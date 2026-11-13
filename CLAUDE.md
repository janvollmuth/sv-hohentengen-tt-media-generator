# SVH Mediengenerator – Hinweise für Claude Code

Statische Web-App, mit der der SV Hohentengen (Tischtennis, später Fußball) Instagram-Stories,
Beiträge und A4-Aushänge erzeugt. Läuft auf GitHub Pages aus dem Branch `main`:
https://janvollmuth.github.io/sv-hohentengen-tt-media-generator/

Ausführliche Doku zu Aufbau, Designs und Feldern: `README.md`.

## Aktuelle Aufgabe

Video-Export (animierte Stories/Beiträge als MP4). Der Plan steht in
**`docs/PLAN-video-export.md`**. Die abgenommene Referenz für Tempo und Ablauf liegt in
**`dev/video-vorschau/index.html`**. Mit dem Plan arbeiten, Abweichungen vorher mit Jan klären.

## Regeln

- **Kein Build-Schritt, keine Module.** Vanilla-JS wie im Bestand: `var`, `function`,
  Promises, keine Arrow-Functions, keine Klassen. Kommentare und UI-Texte auf Deutsch.
- Externe Bibliotheken nur per jsDelivr mit fest gepinnter Version (wie `html-to-image` in `index.html`).
- Designs (`designs/*.html`) sind reines HTML mit Inline-Styles. Verhalten wird über
  `data-`Attribute gesteuert, nicht über Sonderfälle in `app.js`.
- Nach jeder Änderung an `app.js`, `app.css` oder neuen Skripten die Versionsnummer `?v=…`
  in `index.html` erhöhen (Format `JJJJ-MM-TT` + Buchstabe), sonst zeigen Handys die alte Version.
- `photos/pack.json` und `photos/p*.json` (verschlüsselte Vereinsfotos) **nie** ändern oder löschen.
- Der bestehende PNG-Export muss unverändert bleiben.

## Git & Deployment

- `main` = Live-Seite. Push auf `main` geht sofort live (GitHub Pages baut 1–2 Minuten).
- Gearbeitet wird auf Feature-Branches (aktuell `feature/video-export`). Feature-Branches
  dürfen jederzeit gepusht werden.
- **Merge bzw. Push nach `main` nur nach ausdrücklicher Freigabe von Jan.**
- Commit-Nachrichten auf Deutsch, kurz und beschreibend (Stil wie im bisherigen Verlauf).
- `HOCHLADEN.md` stammt aus der Zeit, als per Web-Upload veröffentlicht wurde. Mit Git ist sie überflüssig.

## Lokal testen

```bash
python3 -m http.server 8000
# Generator:  http://localhost:8000/
# Vorschau:   http://localhost:8000/dev/video-vorschau/
```

Automatisierte Prüfungen mit Playwright (Chromium), Videoanalyse mit `ffprobe`/`ffmpeg`,
siehe Plan, Abschnitt 7.
