# Implementierungsplan: Video-Export (animierte Stories & Beiträge)

**Repo:** `janvollmuth/sv-hohentengen-tt-media-generator` (Branch `main`, läuft auf GitHub Pages)
**Ziel:** Neben „Bild speichern“ gibt es „Video speichern“. Das Layout baut sich in wenigen
Sekunden animiert auf (ca. 8 s) und bleibt dann stehen (Video insgesamt 15 s). Export als MP4 (H.264), direkt teilbar nach
Instagram/WhatsApp. Der bestehende PNG-Export bleibt **unverändert**.

---

## 0. Rahmenbedingungen (bitte zuerst lesen)

- **Kein Build-Schritt.** Statische Seite, Vanilla-JS im Stil des bestehenden Codes:
  `var`, `function`, Promises, keine Module, keine Arrow-Functions, Kommentare auf Deutsch.
- Externe Bibliotheken wie bisher per jsDelivr mit **fester Version** (vgl. `html-to-image@1.11.13`
  in `index.html`). Die Video-Bibliothek erst beim ersten Klick auf „Video speichern“ nachladen,
  damit der Seitenstart nicht langsamer wird.
- Neuer Code kommt in eine **eigene Datei `video.js`**, eingebunden nach `app.js`. In `app.js` nur
  kleine, klar markierte Eingriffe (Button, `deliver()`, `progress()`).
- Designs bleiben reines HTML mit Inline-Styles. Animation wird über **neue `data-`Attribute**
  beschrieben, so wie `data-field`, `data-photo` usw. Layouts ohne diese Attribute bekommen
  keinen Video-Button und verhalten sich exakt wie heute.
- Nach Änderungen an `app.js`/`app.css`/`video.js` die Versionsnummer `?v=…` in `index.html`
  erhöhen (siehe README, Abschnitt „Nach dem Hochladen“).
- `photos/pack.json` und `photos/p*.json` nicht anfassen.
- Arbeit auf dem Branch `feature/video-export`. Den Branch darf man jederzeit pushen.
  **Nach `main` mergen erst nach Jans Freigabe**, denn `main` ist der Live-Generator auf GitHub Pages.
  Am Ende jeder Etappe gibt es eine Zusammenfassung und die Liste der geänderten Dateien.

## 1. Bestehende Architektur (relevante Stellen in `app.js`)

| Was | Wo |
| --- | --- |
| Formate inkl. Exportgröße (`w`, `h`, `ratio: 2`) | `FORMATS` (~Z. 40) |
| Layout-Knoten pro Design/Anlass/Format | `nodes[key(design, occ, fmt)]`, gefüllt durch `loadDesign()` |
| Felder ins Layout schreiben | `paintNode()`, `ensurePainted(k)`, `flushPaint()` |
| Knoten temporär ins DOM hängen + Dekor setzen | `attached(node, fn)` (nutzt `#render-slot`) |
| Hintergrundfarbe eines Layouts | `nodeBackground(node)` |
| Schriften für den Export einbetten | `FONTS_READY.then(buildFontCSS)` → `fontEmbedCSS` |
| Erster Render-Durchlauf (Warmlaufen) | `primeRenderer(node, bg)` |
| PNG-Export | `renderPng()` → `renderFile()` (html-to-image `toPng`) |
| Ausgabe-Dialog (Teilen/Speichern) | `deliver(files)` — Texte sind auf „Bild“ festgelegt |
| Fortschrittsbalken | `progress(total)` — Text „Bild n von m“, hängt hinter `#save-pack` |
| Buttons | `#save-one`, `#save-pack` in `index.html` |

Saison-Layouts (`designs/saison-2026-27-dunkel.html`, `-hell.html`) haben bereits nützliche
Anker: `data-stage`, `data-photo-box`, `data-season-strip`, `data-footer`, `data-outcome-bg`,
`data-field="punkteHeim"` / `"punkteGast"`, `data-bottom-photo` / `data-bottom-nophoto`.

## 2. Technischer Ansatz: Ebenen-Rendering + Canvas-Compositing

Nicht jeden Frame per html-to-image rendern (zu langsam am Handy). Stattdessen:

1. **Grundebene:** Layout einmal rendern, dabei alle `[data-anim]`-Elemente per
   `visibility:hidden` ausblenden → statisches Hintergrundbild (Fläche, Saisonleiste, Fußband,
   Deko).
2. **Animierte Ebenen:** Für jedes `[data-anim]`-Element das Layout erneut rendern, mit
   `visibility:hidden` auf der Wurzel und `visibility:visible` nur auf diesem Element,
   **transparenter Hintergrund**. Das Ergebnis auf das Bounding-Rect des Elements zuschneiden
   (Position relativ zum Layout aus `getBoundingClientRect()`, umgerechnet in Layout-Pixel).
   → Bitmap + Rechteck pro Ebene.
3. **Hochzählen (`count`):** Für Zahlenfelder (Punkte/Tore) eine Ebene pro Zwischenwert
   (0 … Endwert) rendern, indem kurz `textContent` gesetzt und danach zurückgesetzt wird.
   Werte sind klein (Tischtennis 0–10). Ist der Wert keine ganze Zahl von 0–20 → Fallback `fade`.
4. **Compositing:** Für jeden Frame auf ein Canvas in Ausgabegröße zeichnen: Grundebene, dann alle
   Ebenen in DOM-Reihenfolge mit Transformation/Deckkraft laut Zeitachse.
5. **Kodieren:** WebCodecs `VideoEncoder` (H.264) → MP4-Muxer → `File` (`video/mp4`).

Alle Renders laufen innerhalb **eines** `attached()`-Aufrufs, mit denselben Optionen wie der
PNG-Export (`fontEmbedCSS`, `primeRenderer`). Ausgeblendete Elemente (`display:none`, z. B.
leere Zeilen oder fehlender Fotokasten) und Elemente mit Breite/Höhe 0 werden übersprungen.

**Verschachtelung:** `[data-anim]` darf nicht in einem anderen `[data-anim]` liegen. Beim Laden
eines Designs prüfen; bei Verstoß `console.warn` und das innere Attribut ignorieren.

### Videoparameter

| Parameter | Wert |
| --- | --- |
| Auflösung | **1×** Layoutgröße: Story 1080×1920, 4:5 1080×1350, 1:1 1080×1080 (nicht `ratio: 2` — 4K-Encoding scheitert auf vielen Handys) |
| Bildrate | 30 fps |
| Dauer | Standard **15 s** (Aufbau ~8 s, Rest Standbild); pro Layout über `data-anim-duration` am Wurzelknoten änderbar (Instagram-Stories erlauben bis 60 s pro Segment) |
| Codec | Reihenfolge per `VideoEncoder.isConfigSupported()` testen: `avc1.640028`, `avc1.4d0028`, `avc1.42e028` |
| Bitrate | 8 Mbit/s, `latencyMode: 'quality'`, Keyframe alle 2 s |
| Container | MP4 mit `fastStart: 'in-memory'` (moov vorne — wichtig für Instagram) |
| Ton | keiner (Musik legt man in Instagram selbst drauf) |
| A4 | kein Video |

**Muxer:** `mediabunny` (Nachfolger von `mp4-muxer`, gleicher Autor). Aktuelle Version und API
auf npm/GitHub prüfen und fest pinnen. Falls die Einbindung ohne Build-Schritt Probleme macht,
ist `mp4-muxer` (letzte Version, UMD-Build) ein zulässiger Ersatz.

**Frames füttern:** `new VideoFrame(canvas, { timestamp: i * 1e6 / fps, duration: 1e6 / fps })`,
`encoder.encode(frame, { keyFrame: i % 60 === 0 })`, danach sofort `frame.close()`. Gegendruck
beachten: bei `encoder.encodeQueueSize > 5` auf das `dequeue`-Event bzw. kurz warten.
Am Ende `await encoder.flush()`, Muxer finalisieren.

**Ohne WebCodecs/H.264** (ältere iPhones, alte Browser): Button bleibt sichtbar, Klick zeigt
einen freundlichen Hinweis („Video-Export braucht einen aktuellen Browser: Chrome, Edge oder
Safari ab iOS 17. Am PC klappt es immer.“). Ein MediaRecorder-Fallback ist **nicht** Teil von
Phase 1.

## 3. Animations-Attribute (Design-API)

Am animierten Element:

| Attribut | Werte | Bedeutung |
| --- | --- | --- |
| `data-anim` | `fade`, `slide-up`, `slide-down`, `slide-left`, `slide-right`, `scale-in`, `pop`, `wipe-right`, `kenburns`, `count` | Effekt |
| `data-anim-delay` | Sekunden, Standard `0` | Start |
| `data-anim-dur` | Sekunden, Standard `1.2` (`kenburns`: ganze Videodauer, `count`: `1.5`) | Länge |
| `data-anim-dist` | Pixel, Standard `120` | Weg bei `slide-*` |

Am Layout-Wurzelknoten (optional): `data-anim-duration` (Gesamtdauer in s).

Effekt-Definitionen (Fortschritt `p` 0→1, nach Easing):

- `fade`: Deckkraft p
- `slide-*`: Deckkraft p, Versatz `(1-p) * dist` entgegen der Richtung
- `scale-in`: Deckkraft p, Skalierung 0.85 → 1 (um die Mitte des Elements)
- `pop`: Skalierung 0 → 1.08 → 1 (Overshoot), Deckkraft schnell auf 1
- `wipe-right`: Clip-Rechteck wächst von links nach rechts
- `kenburns`: Skalierung 1.0 → 1.12 über die Dauer, **auf das eigene Rechteck beschnitten**, voll
  sichtbar ab t=0
- `count`: Zwischenwerte mit easeOut über die Dauer verteilt (am Anfang schnell, zum Ende langsamer); vor `delay` steht `0`

Easing: `easeOutCubic` für alles, `easeOutBack` für `pop`, linear für `kenburns`. Vor `delay`
ist die Ebene unsichtbar (außer `kenburns`, `count`). Nach dem Ende bleibt sie im Endzustand.

**Wichtigste Abnahmeregel:** Der **letzte Frame muss dem PNG-Export entsprechen** (bis auf
Auflösung). Alle Effekte enden also exakt im Ruhezustand des Layouts.

*Entschieden am 13.11.2026 (Jan): `kenburns` ist davon ausgenommen.* Das Foto zoomt wie in
der abgenommenen Vorschau über die ganzen 15 Sekunden weiter und steht am Ende auf 1.12 —
sonst wirkt das Standbild nach dem Aufbau eingefroren. Diese Regel und der Hinweis „Foto
zoomt weiter“ in Abschnitt 4.1 widersprachen sich; so ist es aufgelöst. Gemessen: außerhalb
des Fotokastens weicht der letzte Frame um 0,98 % vom PNG ab, im Fotokasten um 7,6 %.

## 4. Choreografien Phase 1: Heimspiel, Ergebnis, Wochenvorschau, Ergebnisse der Woche (Saison-Designs)

Diese vier Anlässe nutzt der Verein aktuell. Alle vier gehören in Phase 1.

Neuer Effekt `stamp`: wie `pop`, aber von Skalierung 1.7 auf 1 (easeOutBack), für die schräg gestellten roten Etiketten (HEIMSPIEL, WOCHENVORSCHAU, ERGEBNISSE). Wichtig: Eine im Layout gesetzte Drehung (`rotate(-2.5deg)`) muss in allen Skalierungs-Effekten erhalten bleiben. Sie wird also mit der Animations-Transformation verkettet, nicht ersetzt.

### 4.1 Ergebnis

In `designs/saison-2026-27-dunkel.html` **und** `-hell.html`, jeweils Blöcke
`data-occasion="ergebnis"` × `story`, `post45`, `post11`:

| Element | Effekt | Delay | Dauer |
| --- | --- | --- | --- |
| `[data-photo-box]` | `kenburns` | 0 | gesamt (15 s) |
| Kopfzeile (Vereinswappen + „Endstand“/Datum) | `fade` | 0.3 | 1.2 |
| Zeile eigene Mannschaft (weißer Kasten, obere Zeile) | `slide-left` | 1.2 | 1.2 |
| Zeile Gegner | `slide-left` | 1.8 | 1.2 |
| `span[data-field="punkteHeim"]` | `count` | 3.0 | 1.5 |
| `span[data-field="punkteGast"]` | `count` | 3.0 | 1.5 |
| Ausgang-Plakette (`[data-outcome-bg]`) | `pop` | 4.8 | 0.9 |
| Liga-Zeile | `fade` | 5.8 | 1.2 |
| `zusatz`-Text | `slide-up` | 6.8 | 1.2 |
| danach | Standbild bis 15 s (Foto zoomt weiter) | – | – |

Tempo und Ablauf hat Jan an der damaligen Vorschau-Seite `dev/video-vorschau/` abgenommen (Tab „Ergebnis“); maßgeblich sind seither die Zeiten in dieser Tabelle.
| Saisonleiste, Fußband, Hintergrund-Deko | statisch (Grundebene) | – | – |

Hinweis: Die Punkte-Spans liegen **in** den Mannschaftszeilen. Wegen der Regel „keine
Verschachtelung“ entweder (a) die Zeilen-Animation auf den Namens-Container legen statt auf die
ganze Zeile, oder (b) beim Rendern einer Ebene verschachtelte `[data-anim]`-Kinder mit
ausblenden und `count` als eigene Ebene darüberlegen. **Variante (b) implementieren**, sie ist
für künftige Designs robuster. Die Regel aus Abschnitt 2 entsprechend anpassen: Verschachtelung
ist erlaubt, Kinder werden in der Eltern-Ebene ausgeblendet und separat gezeichnet. Ihre
Transformation addiert sich zur Eltern-Ebene.

### 4.2 Heimspiel (`ankuendigung`)

| Element | Effekt | Delay | Dauer |
| --- | --- | --- | --- |
| Foto (`[data-photo]` im oberen Fotokasten) | `kenburns` | 0 | gesamt |
| Vereinswappen | `fade` | 0.3 | 1.2 |
| Etikett „HEIMSPIEL“ | `stamp` | 0.7 | 0.7 |
| Eigene Mannschaft (`heim`) | `slide-left` | 1.4 | 1.2 |
| Zeile „gegen ●“ | `fade` | 2.0 | 1.0 |
| Gegner | `slide-left`, dist 160 | 2.4 | 1.4 |
| Tischtennisnetz-Linie | `wipe-right` | 3.4 | 0.8 |
| Zeilen Liga / Termin / Halle | `slide-up`, dist 60 | 3.9 / 4.4 / 4.9 | 1.0 |
| Roter Kasten (Text + „Eintritt frei“) | `slide-up`, dist 80 | 5.7 | 1.0 |
| Hinweiszeile mit Punkt | `fade` | 6.5 | 1.0 |

### 4.3 Wochenvorschau (`wochenvorschau`)

| Element | Effekt | Delay | Dauer |
| --- | --- | --- | --- |
| Vereinswappen | `fade` | 0.3 | 1.2 |
| Etikett „WOCHENVORSCHAU“ | `stamp` | 0.7 | 0.7 |
| Zeitraum (`wvZeitraum`) | `fade` | 1.3 | 1.0 |
| Überschrift „Diese Woche spielen“ | `slide-up`, dist 80 | 1.6 | 1.2 |
| Jede **sichtbare** Spielzeile k (0-basiert) | `slide-left` | 2.6 + k·0.7 | 1.0 |
| … deren Heim/Auswärts-Marke (`[data-ort]`) | `pop`, Ursprung rechts | Zeilenstart + 0.5 | 0.6 |
| `zusatz` | `slide-up`, dist 80 | nach der letzten Zeile + 0.6 | 1.2 |

### 4.4 Ergebnisse der Woche (`ergebnisse`)

| Element | Effekt | Delay | Dauer |
| --- | --- | --- | --- |
| Wappen, Etikett, Zeitraum, Überschrift | wie Wochenvorschau | | |
| Jede **sichtbare** Ergebniszeile k | `slide-left` | 2.6 + k·1.0 | 1.0 |
| … deren Punkte (`weHeimN`, `weGastN`) | `count` | Zeilenstart + 0.4 | 0.8 |
| … deren Ausgang (`[data-we-outcome]`) | `pop`, Ursprung rechts | Zeilenstart + 1.2 | 0.6 |
| `zusatz` | `slide-up`, dist 80 | nach der letzten Zeile + 1.0 | 1.2 |

Bei Wochenvorschau und Ergebnissen hängen die Startzeiten von der Zahl der sichtbaren Zeilen ab (1–6). Deshalb braucht es zusätzlich einen **Staffel-Mechanismus**: `data-anim-stagger="0.7"` am Listen-Container. Er verteilt die Startzeiten auf die sichtbaren Kinder, ausgeblendete Zeilen (`data-hide-empty`) werden übersprungen. Delays von Elementen innerhalb einer Zeile gelten relativ zum Zeilenstart. Für den `zusatz`-Text: `data-anim-after="list"` (Start nach Ende der Staffel + eigener Delay).

**Referenz-Umsetzung:** Während Phase 1 diente die Seite `dev/video-vorschau/index.html` als Vorlage — sie spielte die vier Abläufe per Web Animations API ab, und Jan hat Tempo und Ablauf dort abgenommen. Am 13.11.2026 ist sie gelöscht worden: Sie trug eingefrorene Kopien der Layouts in sich und wäre mit jeder Design-Änderung weiter auseinandergelaufen. Was sie konnte, kann der Generator selbst („▶ Vorschau“, Abschnitt 5), und die Choreografien stehen in den Abschnitten 4 und 4a sowie in den `data-anim`-Attributen der Designs.

Vor dem Ausrollen auf weitere Formate jeden Anlass als Video an Jan geben (per Teilen-Dialog oder als Datei).

## 4a. Choreografien Phase 2: Erinnerung, Spielerporträt, Mitglieder werben, Vereinsnachricht

*Umgesetzt am 13.11.2026.* Jeweils in beiden Saison-Designs (dunkel und hell) und in
`story`, `post45` und `post11`; A4 bleibt außen vor. Neue Effekte braucht keine dieser
vier Choreografien — sie kommen mit dem Vorrat aus Phase 1 aus.

Gemeinsam ist allen vieren der Auftakt aus Phase 1: das Wappen blendet bei 0.3 ein,
die kleine rote Zeile daneben bei 0.6–0.7. Danach baut sich das Layout von oben nach
unten auf und steht spätestens nach 6.5 s.

### 4a.1 Erinnerung (`erinnerung`, ohne Foto)

| Element | Effekt | Delay | Dauer |
| --- | --- | --- | --- |
| Vereinswappen | `fade` | 0.3 | 1.2 |
| „Heute Abend“ | `scale-in` | 0.8 | 1.0 |
| Uhrzeit-Zeile (`uhrzeit` + „Uhr“) | `pop`, Ursprung links | 1.9 | 0.9 |
| Roter Kasten (Liga / Paarung / Halle) | `slide-up`, dist 80 | 3.0 | 1.0 |
| `zusatz` | `slide-up`, dist 60 | 4.1 | 1.0 |
| Zeile `verpflegung` | `fade` | 5.1 | 1.0 |

### 4a.2 Spielerporträt (`portrait`)

| Element | Effekt | Delay | Dauer |
| --- | --- | --- | --- |
| Foto | `kenburns` | 0 | gesamt |
| Verlauf über dem Foto | `static` | – | – |
| Vereinswappen | `fade` | 0.3 | 1.2 |
| „Aus der Mannschaft“ | `fade` | 0.7 | 1.0 |
| `spielerName` | `slide-left` | 1.4 | 1.2 |
| Zeile `spielerRolle` (mit rotem Strich) | `slide-left`, dist 80 | 2.3 | 1.2 |
| Tischtennisnetz-Linie | `wipe-right` | 3.4 | 0.8 |
| `text` | `slide-up`, dist 60 | 4.2 | 1.2 |

### 4a.3 Mitglieder werben (`werbung`)

| Element | Effekt | Delay | Dauer |
| --- | --- | --- | --- |
| Foto | `kenburns` | 0 | gesamt |
| Verlauf über dem Foto | `static` | – | – |
| Vereinswappen | `fade` | 0.3 | 1.2 |
| „Tischtennis beim SVH“ | `fade` | 0.7 | 1.0 |
| `titel` | `slide-left` | 1.4 | 1.3 |
| `text` | `slide-up`, dist 60 | 2.5 | 1.2 |
| Tischtennisnetz-Linie | `wipe-right` | 3.6 | 0.8 |
| Zeile Training (`zeiten`) | `slide-up`, dist 60 | 4.3 | 1.0 |
| Zeile Kontakt (`kontakt`) | `slide-up`, dist 60 | 4.8 | 1.0 |
| Zeile Instagram (`insta`) | `slide-up`, dist 60 | 5.3 | 1.0 |

Ohne gewähltes Foto blendet `paintNode` den Fotokasten aus; die `kenburns`-Ebene
entfällt dann von selbst, weil Ebenen ohne Fläche übersprungen werden. Dasselbe gilt
für die Instagram-Zeile, die `data-hide-empty` trägt.

### 4a.4 Vereinsnachricht (`nachricht`, ohne Foto)

| Element | Effekt | Delay | Dauer |
| --- | --- | --- | --- |
| Vereinswappen | `fade` | 0.3 | 1.2 |
| „Abteilung Tischtennis“ | `fade` | 0.7 | 1.0 |
| `titel` | `slide-left` | 1.4 | 1.3 |
| `text` | `slide-up`, dist 60 | 2.7 | 1.3 |
| Fußzeile (roter Strich + Adresse) | `fade` | 4.1 | 1.0 |
| … der rote Strich darin | `wipe-right` | 4.2 | 1.1 |

Der rote Strich ist eine verschachtelte Ebene in der Fußzeile: er wird separat
gezeichnet, seine Deckkraft multipliziert sich mit der der Fußzeile.

### 4a.5 Messwerte

Je Anlass ein Video in `story`, `post45` und `post11`, beide Designs stichprobenartig
(12 von 24 Kombinationen als Video, alle 24 als Ebenenprüfung):

| | |
| --- | --- |
| Format | h264 High, 1080×1920 / 1080×1350 / 1080×1080, 30 fps, 450 Frames, 15.000 s, faststart |
| Exportzeit | 1.6 – 3.2 s (Desktop-Chromium) |
| Endframe vs. PNG, ohne Foto | 0.88 – 1.19 % |
| Endframe vs. PNG, mit `kenburns` | 1.85 – 2.22 % gesamt; außerhalb des Fotokastens 1.0 – 1.2 %, darin 3.1 – 3.6 % |
| PNG-Export | byte-gleich mit `main`, auch für die vier neuen Anlässe |

Die Werte mit `kenburns` liegen über der 2-%-Marke aus Abschnitt 7, weil das Foto
weiterzoomt — die in Abschnitt 3 festgehaltene Ausnahme. Außerhalb des Fotokastens
stimmt der letzte Frame wie gefordert mit dem PNG überein.

## 5. UI-Änderungen

- `index.html`: neuer Button `<button type="button" class="ghost" id="save-video" hidden>Video speichern</button>`
  zwischen `#save-one` und `#save-pack`. `<script src="video.js?v=…">` nach `app.js`.
- Sichtbarkeit in `sync()` (bzw. dort, wo `#save-pack` geschaltet wird): sichtbar, wenn der
  aktuelle Knoten mindestens ein `[data-anim]` enthält und das Format nicht `a4` ist.
- Klick: `busy()`, Fortschrittsbalken mit Phasen „Ebenen vorbereiten …“ und „Video n %“,
  danach `deliver([file])`.
- `progress(total)` verallgemeinern: Beschriftung als Parameter oder Callback, Einfügeposition
  als Parameter. Bestehende Aufrufe verhalten sich unverändert.
- `deliver(files)`: Überschrift aus Dateityp ableiten („Video fertig“ bzw. „Bild fertig“ /
  „n Bilder fertig“). `navigator.canShare({ files })` funktioniert auch mit MP4.
- Dateiname: wie `fileName()`, aber `.mp4` (z. B. `SVH-Ergebnis-story-TTC-Musterstadt.mp4`).
- Fehler: eigene Meldung „Das Video konnte nicht erzeugt werden …“ (nicht die Bild-Meldung aus `fail()`).
- **Live-Vorschau: umgesetzt am 13.11.2026** (auf Jans Wunsch vorgezogen). „▶ Vorschau“ im
  `#frame`: der Compositor spielt live auf ein Canvas über der Vorschau
  (`requestAnimationFrame`), ohne zu kodieren. `drawFrame()` nimmt dafür einen
  Skalierungsfaktor. Die Ebenen liegen in einem Zwischenspeicher, den Vorschau und Export
  teilen; er verfällt, sobald sich Inhalt, Ausschnitt oder Fotos ändern.
- **Sperre, nachgerüstet am 13.11.2026** nach der unabhängigen Prüfung von PR #1: Solange
  ein Export läuft, sperren sich „Bild speichern“, „Alle Formate als Paket“,
  „Video speichern“ und „▶ Vorschau“ gegenseitig (`layoutSperren` / `layoutFreigeben` in
  `video.js`, aufgerufen auch aus den beiden Bild-Handlern in `app.js`). Grund: Das
  Ebenen-Rendern blendet Teile des Layouts aus und stellt sie danach wieder her. Zwei
  gleichzeitige Durchläufe merken sich gegenseitig den halb ausgeblendeten Zustand als
  Ausgangswert — der Bild-Export lieferte danach für den Rest der Sitzung ein fast leeres
  PNG, ohne Fehlermeldung. Nachgestellt: 9 von 12 Klickfolgen beschädigten den Export,
  nach der Sperre 0 von 12.

## 6. Aufbau von `video.js`

```
VIDEO_CFG                  fps, Standarddauer, Bitrate, Codec-Kandidaten
videoSupported()           Promise<config|null> — WebCodecs + isConfigSupported
loadMuxer()                lädt die Bibliothek einmalig per <script>, Promise
collectAnimLayers(node)    liest [data-anim] → Liste {el, effect, delay, dur, dist, parent}
renderLayers(node, fmt, bg, onStep)
                           in attached(): Grundebene + Ebenen + count-Varianten → ImageBitmaps
                           (stellt visibility/textContent IMMER wieder her, auch bei Fehler: try/finally)
drawFrame(ctx, layers, t)  Compositing eines Zeitpunkts
encodeVideo(layers, fmt, cfg, onProgress)  → Blob (video/mp4)
renderVideoFile(occ, fmtId, designId)      → File; analog zu renderFile()
```

PNG-Daten aus `toPng` per `createImageBitmap(blob)` in Bitmaps wandeln. Ebenen mit
`pixelRatio: 1` rendern (Ausgabe ist 1×). Für die `count`-Varianten nur den Wurzelknoten
unsichtbar schalten und nur das Zahl-Element sichtbar, damit es schnell geht.

## 7. Tests & Abnahme

Lokal mit einem statischen Server (`python3 -m http.server`) und **Playwright (Chromium)**:

1. Für jeden der vier Anlässe: Generator öffnen → Tischtennis → Anlass → Story → Design „Dunkel“, ohne Foto und mit
   eigenem Testfoto (`setInputFiles` auf „Eigenes Foto vom Gerät“).
2. „Video speichern“ → Dialog „Speichern“ → Download abfangen.
3. Mit `ffprobe` prüfen: Codec `h264`, Auflösung 1080×1920, 30 fps, Dauer 15 s ±0.1, `moov`
   vor `mdat` (faststart).
4. Mit `ffmpeg` Frames bei t=0, t=2.0, t=3.5, t=5.5 und dem letzten Frame extrahieren. Der letzte
   Frame wird mit dem PNG-Export (auf 1080 px verkleinert) verglichen: mittlere Pixelabweichung
   unter ~2 %. Frames bei t=0–5.5 dürfen sich sichtbar unterscheiden (Animation läuft).
5. Dasselbe für `post45`, `post11` und Design „Hell“.
6. Regression: PNG-Export (`Bild speichern`, `Alle Formate als Paket`) für Ergebnis und einen
   Anlass ohne Animation erzeugen. Die Bytes müssen gegenüber `main` gleich bleiben, ein
   Pixelvergleich reicht auch.
7. Layout ohne `[data-anim]` (z. B. Archiv „Standard“): kein Video-Button.
8. Browser ohne `VideoEncoder` simulieren (`delete window.VideoEncoder` vor dem Klick): Hinweis
   erscheint, kein Absturz.
9. Laufzeit messen und berichten (Ziel: Story-Video mit 15 s / 450 Frames < 20 s Exportzeit auf Desktop-Chromium).

Die extrahierten Frames (t=0, 2.0, 3.5, 5.5, Ende) als Kontaktbogen-PNG mitliefern, damit Jan die
Animation ohne Abspielen beurteilen kann.

Manuelle Prüfung durch Jan (nicht automatisierbar): echtes iPhone und Android-Handy → Teilen →
Instagram-Story. Ins Ergebnis-Protokoll als offene Punkte aufnehmen.

## 8. Doku

- `README.md`: neuer Abschnitt „Video-Export“ mit Attributtabelle (Abschnitt 3), Hinweis auf
  den letzten Frame = PNG und Browser-Voraussetzungen.
- ~~`HOCHLADEN.md`: geänderte/neue Dateien auflisten.~~ *Entfällt (13.11.2026).* Die Datei
  stammte aus der Zeit der Web-Uploads; veröffentlicht wird über Git, und welche Dateien sich
  geändert haben, steht im Commit. Sie ist gelöscht.

## 9. Phasen

| Phase | Inhalt | Abnahme |
| --- | --- | --- |
| **1** | `video.js`, UI, Heimspiel + Ergebnis + Wochenvorschau + Ergebnisse der Woche × 3 Formate (Story, 4:5, 1:1) × Dunkel/Hell, Tests | Abschnitt 7 grün für alle vier Anlässe, Jan gibt Look frei |
| **2** | Choreografien für Erinnerung, Spielerporträt, Mitglieder werben, Vereinsnachricht — **umgesetzt am 13.11.2026**, siehe Abschnitt 4a | je Anlass Kontaktbogen, Jan gibt Look frei |
| 3 (optional) | ~~Live-Vorschau im Editor~~ (erledigt), MediaRecorder-Fallback, wählbare Dauer (10 s / 15 s / 20 s) | nach Bedarf |

Archiv-Designs (H, A–F) und Fußball (`R.html`) sind ausdrücklich **nicht** im Umfang.

## 10. Risiken

- **html-to-image + `visibility`:** Falls die Bibliothek `visibility:hidden` nicht sauber
  übernimmt, auf geklonten Knoten mit `opacity:0` ausweichen. Wichtig: Hintergründe der
  Eltern-Elemente dürfen nicht in die Ebene geraten. Früh mit einem Prototyp prüfen
  (erster Arbeitsschritt!).
- **Schriften/Wappen fehlen im ersten Render:** `primeRenderer()` vor den Ebenen aufrufen,
  wie beim PNG-Export.
- **Speicher am Handy:** Bitmaps nach dem Kodieren mit `.close()` freigeben.
  Ebenen-Bitmaps nur in Elementgröße halten, nicht in Vollformat.
- **Silbentrennung / Umbruch:** Ebenen werden aus dem fertig gesetzten Layout ausgeschnitten,
  Umbrüche ändern sich also nicht. Transformationen nur auf Bitmaps, nie auf DOM-Text während
  der Animation.
