# Ins Repo hochladen

Ziel: `janvollmuth/sv-hohentengen-tt-media-generator`, Branch `main`.
Alle Dateien aus diesem Paket **an dieselbe Stelle** im Repo legen und
vorhandene überschreiben.

## Wichtig: alte Design-Dateien löschen

Die bisherigen Designs ziehen ins Archiv. Im Repo bitte **löschen**:

`designs/A.html`, `designs/B.html`, `designs/C.html`, `designs/D.html`,
`designs/E.html`, `designs/F.html`, `designs/H.html`

(Sie liegen jetzt unter `designs/archiv/` und sind darüber weiter anwählbar.)

## Was sich geändert hat

| Datei / Ordner | Änderung |
| --- | --- |
| `designs/saison-2026-27-dunkel.html` | **neu**: Saison-Design 2026/27, dunkel (inkl. Wochenvorschau) |
| `designs/saison-2026-27-hell.html` | **neu**: Saison-Design 2026/27, hell (inkl. Wochenvorschau) |
| `designs/archiv/` | **neu**: frühere Designs H, A–F |
| `designs/manifest.json` | Saison-Designs oben, alte mit `"archiv": true` |
| `app.js` | neuer Anlass Wochenvorschau (bis 6 Spiele), Archiv-Auswahl, einmalige Umstellung auf die neue Saison, Foto optional, Fußball deaktiviert, zehn Torschützen |
| `app.css` | Saison-Überschrift, Archiv-Schalter, deaktivierte Auswahl |
| `README.md` | Abschnitt „Saison-Design“ inkl. Anleitung für die nächste Saison |
| `designs/R.html`, `index.html`, `admin.js`, `fotos-verwalten.html`, `logos/`, `fonts/`, `assets/` | unverändert bzw. aus früheren Runden, der Vollständigkeit halber dabei |

**Nicht enthalten und nicht anfassen:** `photos/pack.json` und
`photos/p<id>.json` im Repo.

Nach dem Hochladen baut GitHub Pages automatisch neu (ein bis zwei Minuten):
https://janvollmuth.github.io/sv-hohentengen-tt-media-generator/

## Kurz zum Prüfen

* Tischtennis → beliebiger Anlass: unter „4 · Design“ steht „Saison 2026/27“ mit Dunkel und Hell.
* „Archiv: frühere Designs“ klappt die alten Designs auf.
* Heimspiel ohne Foto: kein grauer Bildkasten, der Text steht frei.
* Tischtennis → Wochenvorschau: drei Beispielspiele; bei „— kein Spiel —“ verschwindet die Zeile.
