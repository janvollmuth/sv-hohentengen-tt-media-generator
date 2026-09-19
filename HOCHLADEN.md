# Ins Repo hochladen

Ziel: `janvollmuth/sv-hohentengen-tt-media-generator`, Branch `main`.
Alle Dateien aus diesem Paket **an dieselbe Stelle** im Repo legen und
vorhandene überschreiben.

| Datei / Ordner | geändert |
| --- | --- |
| `app.js` | zehn Torschützen-Felder, Gruppierung, zweispaltige Liste |
| `designs/R.html` | Fußball „Rasen": zehn Torzeilen, kein Foto mehr im Ergebnis |
| `designs/A–F.html`, `designs/H.html` | Hashtag-Zeile zentriert |
| `designs/manifest.json`, `logos/`, `fonts/`, `assets/`, `index.html`, `app.css`, `admin.js`, `fotos-verwalten.html` | unverändert, nur der Vollständigkeit halber dabei |
| `README.md` | Fußball-Anlässe und Torschützen dokumentiert |

**Nicht enthalten und nicht anfassen:** `photos/pack.json` und
`photos/p<id>.json` im Repo — die entstehen in `fotos-verwalten.html`.

Nach dem Hochladen baut GitHub Pages automatisch neu (ein bis zwei Minuten):
https://janvollmuth.github.io/sv-hohentengen-tt-media-generator/

## Kurz zum Prüfen

Fußball → Ergebnis → Rasen: zehn Torzeilen eintragen. Erwartet:
gleicher Name einmal mit allen Minuten, `G` am Zeilenanfang = graues Gegentor,
ab sieben Zeilen zwei Spalten.
