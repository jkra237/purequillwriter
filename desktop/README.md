# PureQuill Writer — Windows-Fassung

Electron-Hülle um dieselbe `index.html`, die auch die Webfassung ist. Es gibt
**keine zweite Kopie des Programms**: `scripts/prepare.mjs` stellt vor jedem
Start und jedem Build den Ordner `app/` aus dem Wurzelverzeichnis des Repos
zusammen. `app/`, `release/` und `node_modules/` liegen nicht im Git.

## Bauen

```bash
cd desktop
npm install
npm start          # zum Ausprobieren
npm run dist       # NSIS-Installer (Direkt-Download)  -> release/
npm run dist:store # APPX/MSIX fürs Microsoft Store     -> release/
```

## Was die Desktop-Fassung anders macht

Drei Stellen in `index.html` fragen `window.pqwDesktop` ab. Fehlt es — also im
Browser — läuft alles wie bisher.

| | Browser | Desktop |
|---|---|---|
| **PDF** | Druckdialog, Nutzer muss *Als PDF speichern* und *Hintergrundgrafiken* wählen | `printToPDF` direkt in die Datei: Hintergründe immer an, `@page`-Format exakt, PDF-Lesezeichen aus den Überschriften, getaggtes PDF |
| **Rechtsklick → Einfügen** | nur Text (`clipboard.readText`), Formatierung geht verloren | HTML aus der Zwischenablage durch dieselbe Bereinigung wie Strg+V — Formatierung bleibt |
| **Deutsches Wörterbuch** | liegt in `dict/` | nicht im Paket, wird beim ersten Prüfen von GitHub Pages geladen |

Strg+C / Strg+V verhalten sich in beiden Fassungen gleich — das war nie das
Problem.

## Warum ein eigenes `pqw://`-Schema statt `file://`

Zwei Gründe, beide hart:

1. Unter `file://` blockiert Chromium `fetch()` auf Nachbardateien. Die
   Rechtschreibprüfung holt ihre Wörterbücher aber genau so — sie würde nie
   starten.
2. `file://` hat keinen stabilen Ursprung. `localStorage` und IndexedDB hängen
   daran, und dort liegt der **gesamte** Programmstand. `pqw://local` ist ein
   richtiger, gleichbleibender Ursprung.

## Warum kein Anwendungsmenü

`Menu.setApplicationMenu(null)`. Das Programm hat seine eigene Leiste, und ein
Electron-Menü würde die Alt-Taste abfangen — genau die, auf der das Tastenschema
`Alt+⇧+…` aufbaut. Die Bearbeiten-Kürzel behandelt Chromium in einem
`contenteditable` selbst.

## Vor der ersten Store-Einreichung

- [ ] `build/icon.ico` (256×256, mehrere Größen) aus `../icon.svg` erzeugen
- [ ] In `package.json` unter `build.appx` die drei `REPLACE-…`-Werte durch die
      Angaben aus dem Partner Center ersetzen (`identityName`, `publisher`,
      `publisherDisplayName`)
- [ ] Signaturzertifikat **nicht** ins Repo — über GitHub-Actions-Secrets
      (`CSC_LINK`, `CSC_KEY_PASSWORD`)
- [ ] Store-Beschreibung und Screenshots je Markt im Partner Center pflegen
      (die App spricht sieben Sprachen)
- [ ] Prüfen, dass `dict/de.*` über die Webadresse erreichbar bleibt, solange
      Store-Fassungen im Umlauf sind
