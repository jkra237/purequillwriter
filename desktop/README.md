# PureQuill Writer — Desktop-Fassung (Windows und Linux)

Electron-Hülle um dieselbe `index.html`, die auch die Webfassung ist. Es gibt
**keine zweite Kopie des Programms**: `scripts/prepare.mjs` stellt vor jedem
Start und jedem Build den Ordner `app/` aus dem Wurzelverzeichnis des Repos
zusammen. `app/`, `release/` und `node_modules/` liegen nicht im Git.

## Bauen

Jede Zeile einzeln — **`&&` funktioniert in Windows PowerShell 5.1 nicht**
(erst ab PowerShell 7). Wer alles in eine Zeile will, nimmt dort `;`.

```powershell
cd desktop
npm install
npm start          # zum Ausprobieren
npm run dist       # NSIS-Installer (Direkt-Download)  -> release/
npm run dist:store # APPX/MSIX fürs Microsoft Store     -> release/
```

### Linux (AppImage + .deb)

Gebaut wird in WSL (Ubuntu), nicht unter Windows: electron-builder kann die
Linux-Pakete dort nicht zuverlässig erzeugen. Aus PowerShell:

```powershell
wsl -d Ubuntu -- bash "/mnt/c/Users/jkraj/cc test/purequillwriter/desktop/scripts/linux-bauen.sh"
```

Das Skript kopiert das Repo nach `~/pqw-build` (eigene `node_modules`, denn
die hier in `desktop/` gehören Windows), baut AppImage und .deb je für x64
und arm64 und legt die vier Pakete nach `release/linux/`. Es **zählt nach**
und bricht ab, wenn nicht genau vier ankommen: Eine ausgefallene Architektur
meldet electron-builder nicht.

Einmalig in Ubuntu nötig (fpm, weil electron-builder es nur als x64-Programm
mitbringt und dieser Rechner arm64 ist; die Bibliotheken und Schriften, damit
man die App in WSL auch starten kann):

```bash
sudo apt install -y nodejs npm ruby ruby-dev build-essential libfuse2t64 libnss3 libgtk-3-0t64 libasound2t64 libgbm1 libxss1 libxtst6 libnotify4 libsecret-1-0 fonts-crosextra-carlito fonts-crosextra-caladea fonts-liberation
sudo gem install fpm --no-document
```

**Testen:** In WSL läuft nur die arm64-Fassung, sie öffnet ein normales
Fenster unter Windows: `~/pqw-build/desktop/release/linux-arm64-unpacked/purequillwriter`.
Die x64-Pakete lassen sich auf diesem Rechner bauen, aber nicht ausprobieren.

`build/icon.png` (512×512) ist das Symbol für Linux, aus `../icon.svg`
gerendert.

### Wenn PowerShell npm blockiert

`npm : ... npm.ps1 cannot be loaded because running scripts is disabled on this
system.` — das ist die Execution Policy von Windows, nicht das Projekt. Zwei Wege:

- **Ohne etwas zu ändern:** `npm.cmd` statt `npm` aufrufen, das umgeht den
  PowerShell-Wrapper. Oder `cmd` statt PowerShell benutzen.
- **Dauerhaft:** `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` — die
  übliche Entwicklereinstellung, kein Admin nötig, gilt nur für den eigenen
  Benutzer.

## Was die Desktop-Fassung anders macht

Drei Stellen in `index.html` fragen `window.pqwDesktop` ab. Fehlt es — also im
Browser — läuft alles wie bisher.

| | Browser | Desktop |
|---|---|---|
| **PDF** | Druckdialog, Nutzer muss *Als PDF speichern* und *Hintergrundgrafiken* wählen | `printToPDF` direkt in die Datei: Hintergründe immer an, `@page`-Format exakt, PDF-Lesezeichen aus den Überschriften, getaggtes PDF |
| **Rechtsklick → Einfügen** | nur Text (`clipboard.readText`), Formatierung geht verloren | HTML aus der Zwischenablage durch dieselbe Bereinigung wie Strg+V — Formatierung bleibt |
| **Deutsches Wörterbuch** | liegt in `dict/` | Windows: nicht im Paket (GPL gegen Store-Kopierschutz), wird beim ersten Prüfen von suvantra.eu geladen. Linux: im Paket |

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

- [ ] `build/icon.ico` (256×256, mehrere Größen) aus `../icon.svg` erzeugen —
      ohne das nimmt der Build das Electron-Standardsymbol
- [ ] Zielarchitekturen festlegen: der Store will meist **x64 und arm64**;
      `build.win.target[].arch` steht derzeit auf `x64`
- [ ] In `package.json` unter `build.appx` die drei `REPLACE-…`-Werte durch die
      Angaben aus dem Partner Center ersetzen (`identityName`, `publisher`,
      `publisherDisplayName`)
- [ ] Signaturzertifikat **nicht** ins Repo — über GitHub-Actions-Secrets
      (`CSC_LINK`, `CSC_KEY_PASSWORD`)
- [ ] Store-Beschreibung und Screenshots je Markt im Partner Center pflegen
      (die App spricht sieben Sprachen)
- [ ] Prüfen, dass `dict/de.*` über die Webadresse erreichbar bleibt, solange
      Store-Fassungen im Umlauf sind
