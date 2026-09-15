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
designs/A.html … C.html Story-Sonderdesigns (nur Heimspiel/Erinnerung/Ergebnis)
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
Vollbild); die Spieltags-Anlässe haben in der Story zusätzlich Wappen,
Foto & Rot und Anzeigetafel.

| Anlass | Kennung | Formate |
| --- | --- | --- |
| Heimspiel | `ankuendigung` | Story, 4:5, 1:1, A4 |
| Erinnerung | `erinnerung` | Story, 4:5, 1:1 |
| Ergebnis | `ergebnis` | Story, 4:5, 1:1 |
| Spielerporträt | `portrait` | Story, 4:5, 1:1 |
| Mitglieder werben | `werbung` | Story, 4:5, 1:1, A4 |
| Vereinsnachricht | `nachricht` | Story, 4:5, 1:1, A4 |

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
| `punkteHeim` / `punkteGast` | Punkte SVH / Punkte Gegner |
| `ausgang` | Sieg / Niederlage / Unentschieden |
| `spielerName` / `spielerRolle` | Name / Mannschaft / Position |
| `titel` | Titel (pro Anlass) |
| `text` | Text (pro Anlass) |
| `zeiten` / `kontakt` | Trainingszeiten / Kontakt |
| `zusatz` | Zusätzlicher Text (pro Anlass) |
| `termin` | berechnet: Datum · Uhrzeit Uhr |
| `paarung` | berechnet: SV Hohentengen – Gegner |

   Feste Beschriftungen (HEIMSPIEL, LIGA, TERMIN, ENDSTAND …) bleiben normaler
   Text – dann sind sie nicht editierbar.

3. Fotoplatz: `<img data-photo="1" …>` innerhalb eines Containers mit fester Größe.
4. Farbfläche, die vom Ausgang abhängt: `data-outcome-bg="1"` am Element.
5. In `designs/manifest.json` ergänzen:

```json
{ "id": "F", "name": "Name der Vorlage", "description": "Kurzbeschreibung", "file": "designs/F.html" }
```

## Neuer Anlass oder neues Feld

Beides steht oben in `app.js`: `OCCASIONS` (Anlässe), `FORMATS` (Formate),
`FIELDS` (Eingabefelder). Ein Feld mit `scope: 'occasion'` hat je Anlass einen
eigenen Wert, `computed` baut sich aus anderen Feldern. Danach den Anlass in
mindestens einem Design als Block anlegen — sonst taucht er nicht auf.

## Quelle der Story-Designs A–E

Sie stammen aus dem Design-Board `Instagram Story Template.dc.html` im
Omelette-Projekt. Änderungen dort werden nach `designs/` übertragen.
