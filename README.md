# SVH Media Generator

Läuft als statische Seite auf GitHub Pages:
**https://janvollmuth.github.io/sv-hohentengen-tt-media-generator/**

Ablauf für die Kollegen: Anlass wählen → Format wählen → Design wählen →
Texte und Foto einsetzen → Bild speichern. Am Layout kann nichts verrutschen.

## Aufbau

```
index.html              App-Hülle (ändert sich selten)
app.css / app.js        Oberfläche und Logik
fotos-verwalten.html    Fotos verschlüsseln und ins Paket legen
admin.js                Logik dazu
designs/manifest.json   Liste der Design-Vorlagen
designs/H.html          Standard-Design: alle Anlässe, alle Formate
designs/D.html, E.html  Hell und Vollbild: alle Anlässe, alle Formate
designs/F.html          Duell: Hintergrundfoto + beide Wappen (Spieltags-Anlässe)
designs/A.html … C.html Story-Sonderdesigns (nur Heimspiel/Erinnerung/Ergebnis)
designs/R.html          Rasen: Fußball-Abteilung, Spielfeldlinien statt Foto
logos/manifest.json     Gegner-Wappen (offen, ohne Passwort)
photos/pack.json        verschlüsseltes Fotopaket
photos/manifest.json    optional: unverschlüsselte, unkritische Fotos
fonts/                  Archivo Black + Barlow Condensed (selbst gehostet)
assets/svh-logo.png     Vereinswappen
```

Der Generator lädt beim Start die Manifeste. Neue Vorlagen und Fotos brauchen
**keine** Änderung an `index.html`, `app.css` oder `app.js`.

Die Schriften liegen im Repo, nicht bei Google – dadurch sieht der Export überall
gleich aus und ist schnell. Lizenz: SIL Open Font License, siehe `fonts/OFL.txt`.

## Anlässe und Formate

Jeder Anlass hat in jedem Format mindestens drei Designs (Standard, Hell,
Vollbild); die Spieltags-Anlässe haben zusätzlich Duell (mit Gegner-Wappen)
und in der Story Wappen, Foto & Rot und Anzeigetafel.

| Anlass | Kennung | Formate |
| --- | --- | --- |
| Heimspiel | `ankuendigung` | Story, 4:5, 1:1, A4 |
| Erinnerung | `erinnerung` | Story, 4:5, 1:1 |
| Ergebnis | `ergebnis` | Story, 4:5, 1:1 |
| Spielerporträt | `portrait` | Story, 4:5, 1:1 |
| Mitglieder werben | `werbung` | Story, 4:5, 1:1, A4 |
| Vereinsnachricht | `nachricht` | Story, 4:5, 1:1, A4 |

Die Fußballabteilung hat eigene Anlässe (Abteilung **Fußball** ganz oben):

| Anlass | Kennung | Formate |
| --- | --- | --- |
| Spieltag | `fbSpieltag` | Story, 4:5, 1:1 |
| Erinnerung | `fbErinnerung` | Story, 4:5, 1:1 |
| Ergebnis | `fbErgebnis` | Story, 4:5, 1:1 |

Dafür gibt es das Design **Rasen** (`designs/R.html`): Spielfeldlinien als
Hintergrund, beide Wappen mit VS, Tore statt Punkte. Fotos sind dort bewusst
nicht vorgesehen – die Layouts leben von Typografie und Spielfeld.

| Format | Kennung | Ausgabe |
| --- | --- | --- |
| Story & WhatsApp | `story` | 1080 × 1920 |
| Beitrag 4:5 | `post45` | 1080 × 1350 |
| Beitrag 1:1 | `post11` | 1080 × 1080 |
| A4-Aushang | `a4` | 2480 × 3508 (300 dpi) |

Ein Design muss nicht alles können: Der Generator zeigt pro Anlass nur die
Formate an, für die es mindestens ein Design gibt, und dazu nur die passenden
Designs. `designs/A–E.html` decken zum Beispiel nur Story ab.

## Fotos – verschlüsselt im öffentlichen Repo

Das Repo ist öffentlich, die Vereinsfotos sind es nicht. Fotos werden im Browser
mit einem Vereinspasswort verschlüsselt (AES-256-GCM, Schlüssel aus dem Passwort
über PBKDF2) und liegen nur als unlesbare Dateien im Repo. Im Generator erscheint
die Galerie erst nach Eingabe des Passworts; es wird pro Gerät gespeichert.

### Foto hinzufügen

1. Im Generator unten auf **Fotos verwalten** (oder `fotos-verwalten.html` öffnen).
2. Vereinspasswort eingeben. Beim ersten Mal wird es hier festgelegt – gut merken,
   es steht nirgends im Repo und kann nicht zurückgesetzt werden.
3. Fotos hineinziehen, Beschreibung eintippen, **Verschlüsseln & herunterladen**.
   Die Seite verkleinert auf 1600 px, verschlüsselt und lädt die fertigen Dateien
   herunter (mehrere Downloads muss der Browser einmal erlauben).
4. Die Dateien im Repo nach `photos/` hochladen und `photos/pack.json` überschreiben.

### Foto entfernen

Gleicher Weg: in **Fotos verwalten** das Foto in der Liste „Bereits im Paket" mit
× markieren und neu herunterladen – die alte `p<id>.json` kann man dann im Repo löschen.

### Passwort ändern

In **Fotos verwalten** unten: bisheriges und neues Passwort eingeben, dann
**Alle Fotos neu verschlüsseln**. Die Seite holt jedes Foto aus dem Repo,
entschlüsselt es mit dem alten und verschlüsselt es mit dem neuen Passwort.
Alle heruntergeladenen Dateien zusammen nach `photos/` hochladen (`pack.json`
überschreiben) — bis dahin gilt im Live-Generator noch das alte Passwort.

### Unverschlüsselte Fotos

Für unkritische Bilder (leere Halle, Tisch, Logo-Motive) reicht `photos/manifest.json`:

```json
[ { "file": "photos/halle.jpg", "name": "Unsere Halle" } ]
```

Wer keine Fotos in der Galerie will, nimmt im Generator einfach
„Eigenes Foto vom Gerät" – das Bild verlässt das Gerät dann nie.

## Neue Design-Vorlage

1. Neue Datei `designs/F.html` anlegen (am einfachsten `designs/H.html` kopieren).
   Sie enthält pro Anlass **und** Format einen Block:

```html
<div data-occasion="ankuendigung" data-format="post45"
     style="position:relative; width:1080px; height:1350px; …">…</div>
```

   `data-occasion` und `data-format` müssen den Kennungen aus den Tabellen oben
   entsprechen. Alles ist mit Inline-Styles gebaut, jeder Block exakt so groß wie
   sein Format.

2. Jeden veränderbaren Text in ein `<span data-field="…">` setzen:

| Feld | erscheint als Eingabe |
| --- | --- |
| `gegner` | Gegner |
| `liga` | Liga / Mannschaft |
| `datum` | Datum |
| `uhrzeit` | Uhrzeit |
| `halle` | Halle |
| `heim` | Eigene Mannschaft (Auswahl) |
| `punkteHeim` / `punkteGast` | Punkte eigene Mannschaft / Punkte Gegner |
| `toreHeim` / `toreGast` | Tore eigene Mannschaft / Tore Gegner (Fußball) |
| `halbzeit` | Halbzeitstand |
| `tor1` … `tor10` | Torschützen, eine Zeile je Tor |
| `ausgang` | Sieg / Niederlage / Unentschieden |
| `spielerName` / `spielerRolle` | Name / Mannschaft / Position |
| `titel` | Titel (pro Anlass) |
| `text` | Text (pro Anlass) |
| `zeiten` / `kontakt` | Trainingszeiten / Kontakt |
| `zusatz` | Zusätzlicher Text (pro Anlass) |
| `termin` | berechnet: Datum · Uhrzeit Uhr |
| `paarung` | berechnet: eigene Mannschaft – Gegner |
| `gegnerKuerzel` | berechnet: Monogramm für das Ersatzwappen |

   Feste Beschriftungen (HEIMSPIEL, LIGA, TERMIN, ENDSTAND …) bleiben normaler
   Text – dann sind sie nicht editierbar.

3. Bildplätze: `<img data-photo="haupt" …>` innerhalb eines Containers mit
   fester Größe. Ein Layout kann mehrere Plätze haben – jeder bekommt im
   Generator eine eigene Auswahl mit eigenem Ausschnitt:

| Platz | Bedeutung |
| --- | --- |
| `haupt` | Hauptfoto (`data-photo="1"` gilt als dasselbe) |
| `zweit` | zweites Foto |
| `gegner` | Gegner-Wappen: wird ganz gezeigt, nicht zugeschnitten |

   Zum Gegner-Wappen gehört ein Ersatzwappen, das der Generator ausblendet,
   sobald ein Logo gewählt ist:

```html
<div data-logo-fallback="gegner" style="…"><span data-field="gegnerKuerzel">TTC</span></div>
<img data-photo="gegner" alt="" style="…">
```
4. Farbfläche, die vom Ausgang abhängt: `data-outcome-bg="1"` am Element.
5. In `designs/manifest.json` ergänzen:

```json
{ "id": "F", "name": "Name der Vorlage", "description": "Kurzbeschreibung", "file": "designs/F.html" }
```

## Tischtennis-Objekt im Hintergrund

Layouts mit freier Fläche bekommen eine sehr blasse Schläger-Silhouette in den
Hintergrund. Sie wird groß gesetzt (bis 760 px) und von der freien Fläche
beschnitten, statt auf deren Höhe zu schrumpfen – ein angeschnittenes Blatt
ist als Schläger lesbar, ein kleines Objekt wäre nur ein Fleck.

Gemessen wird pro Layout, wo Fotos, Fußband und Textzeilen sitzen; geprüft
werden die ganze Breite sowie linke und rechte Hälfte einzeln, weil in dichten
Layouts oft nur eine Seite frei ist. Der Beschnitt umfasst genau die gemessene
Spalte, deshalb berührt die Silhouette nie Text.

Abdeckung (82 Layouts, nachgemessen):

| Design | Mit Schläger | Grund für den Rest |
| --- | --- | --- |
| Hell (D) | 20 von 21 | – |
| Standard (H) | 15 von 21 | sechs dichte Layouts ohne freie Fläche |
| Foto & Rot (B) | 1 von 3 | fast vollflächig belegt |
| Wappen (A), Anzeigetafel (C) | 0 von 3 | randlos aufgebaut, keine freie Fläche |
| Vollbild (E), Duell (F) | 0 von 31 | Foto füllt die Seite – zwei Bilder würden konkurrieren |

Insgesamt also 36 Layouts mit Schläger, 31 bewusst ohne (Foto füllt), 15 ohne
freie Fläche. In A, C und den dichten H-Layouts gäbe es kein Objekt ohne
Überdeckung von Text – wer dort eins will, muss im Layout Luft schaffen, nicht
die Schwelle in `applyDecor()` senken.

Die Schläger-Silhouette stammt aus **Game Icons** (Delapouite),
Lizenz **CC BY 3.0** – https://game-icons.net. Die Namensnennung erfüllt
dieser Abschnitt; auf den Bildern selbst ist kein Hinweis nötig.
Der Ball ist eigene Geometrie.

Steuern lässt sich das in `app.js` in `applyDecor()`: Deckkraft über `ink`
und `strong`, Mindestgröße über die Schwelle `200 * s`.

## Gegner-Wappen

Fremde Vereinswappen sind nicht privat, deshalb liegen sie offen in `logos/` –
kein Passwort. Neues Wappen: Datei nach `logos/` hochladen und eine Zeile
in `logos/manifest.json` ergänzen:

```json
[ { "file": "logos/ttc-musterstadt.png", "name": "TTC Musterstadt" } ]
```

PNG mit transparentem Hintergrund ist am besten – der Generator lässt die
Transparenz unangetastet. Wer nichts hochlädt, nimmt im Generator „Logo vom
Gerät"; ohne Logo zeigt das Layout das Ersatzwappen mit dem Monogramm des
Gegners (aus dem Namen gebildet, z. B. TTC Musterstadt → TTCM).

## Eigene Mannschaft

`FIELDS` enthält das Feld `heim` mit der Liste der Mannschaften
(SV Hohentengen, 2, 3, U19, U19 2). Neue Mannschaft = eine Zeile mehr in
`options`; die Layouts brauchen keine Änderung.

## Neuer Anlass oder neues Feld

Beides steht oben in `app.js`: `OCCASIONS` (Anlässe), `FORMATS` (Formate),
`FIELDS` (Eingabefelder). Ein Feld mit `scope: 'occasion'` hat je Anlass einen
eigenen Wert, `computed` baut sich aus anderen Feldern. Danach den Anlass in
mindestens einem Design als Block anlegen — sonst taucht er nicht auf.

## Torschützen im Fußball-Ergebnis

Bis zu zehn Tore lassen sich eintragen, eine Zeile je Tor, Format
`12' Max Mustermann`. Der Generator macht daraus die fertige Liste:

* **Mehrfachtorschützen** stehen einmal da, die Minuten dahinter
  (`Max Mustermann 4' 39' 79'`).
* **Gegentore** markiert man mit einem `G` am Zeilenanfang – sie erscheinen grau.
* Ab **sieben Zeilen** läuft die Liste zweispaltig, die Schrift wird kleiner;
  ein 8:2 passt damit noch in die Kachel.
* Leere Zeilen verschwinden, ein 1:0 sieht also genauso sauber aus.

Endstand (`toreHeim`/`toreGast`), Halbzeitstand und Ausgang bleiben eigene
Felder – die Liste darf auch unvollständig sein.

Im Layout braucht es dafür nur einen Rahmen mit `data-goals="1"` (plus
`data-goal-name`, `data-goal-min`, `data-goal-gap` als Grundgrößen) und darin
zehn Zeilen mit `data-goal-row="1"`, `data-hide-empty="torN"` und
`<span data-field="torN">`. Spaltenzahl, Schriftgrade und Minutenfarbe setzt
`app.js` beim Zeichnen.

## Quelle der Story-Designs A–C

Sie stammen aus dem Design-Board `Instagram Story Template.dc.html` im
Omelette-Projekt. Änderungen dort werden nach `designs/` übertragen.
Das Fußball-Design `designs/R.html` kommt genauso aus `Fussball-Design.dc.html`.
