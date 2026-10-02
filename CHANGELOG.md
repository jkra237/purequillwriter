# Änderungen

Was sich seit der letzten Veröffentlichung angesammelt hat, und was in jeder
früheren drin war. Deutsch wie die Commits — das Repository ist privat, es
liest niemand mit, für den Englisch die Brücke wäre. Der kundenseitige Text
(„Neuigkeiten in dieser Version" im Store) entsteht **aus** dieser Datei und
wird in alle sieben Sprachen übersetzt; er ersetzt sie nicht.

## Versionsregel

Das Paket trägt vier Stellen, die vierte gehört dem Store und bleibt `0`.
Nutzbar sind also drei:

| Stelle | Wofür | Beispiel |
|---|---|---|
| **1.0.x** | nur Fehlerbehebungen, keine neuen Funktionen | falsche Buchstaben in der Werkzeugleiste |
| **1.x.0** | neue Funktionen, neue Sprache, sichtbare Änderungen | ein weiteres Exportformat |
| **x.0.0** | das Produkt wird ein anderes | |

**Die Nummer wird nicht bei jedem Fix hochgezählt.** Fixes sammeln sich auf
`main`, jeder mit eigenem Commit, und stehen hier unter „Unveröffentlicht".
Die Version in `desktop/package.json` ändert sich **genau einmal**, als
letzter Commit vor dem Bauen. So kann sie nicht auseinanderlaufen: Es gibt
immer genau einen Commit, der sie anfasst.

## Ablauf einer Veröffentlichung

1. `desktop/package.json` → neue Version, eigener Commit („Setze die Version auf 1.0.1").
2. `cd desktop` und `npm.cmd run dist:store`
   — in PowerShell **`npm.cmd`**, nicht `npm`: die Ausführungsrichtlinie blockiert `npm.ps1`.
3. **Nachzählen, dass ZWEI `.appx` in `desktop/release/` liegen**, eines davon `arm64`.
   Dieser Rechner ist ARM64; ein CLI-Argument wie `--win appx` würde die
   arch-Liste aus der Konfiguration überschreiben und nur die eigene
   Architektur bauen. Seit ff3b65a nennen die Skripte beide ausdrücklich,
   aber der Build meldet den Ausfall nicht — er endet mit Code 0.
4. Beide Pakete in **eine** Einreichung im Partner Center.
5. „Neuigkeiten in dieser Version" in **sieben** Sprachen eintragen, aus den
   Einträgen unten destilliert. Aufzählung mit `•`, nicht Fließtext.
6. Nach der Veröffentlichung taggen: `git tag -a v1.0.1 <commit> -m "…"`, dann
   `git push origin main` und `git push origin v1.0.1`.
7. Hier die Überschrift „Unveröffentlicht" durch `## 1.0.1 — <Datum>` ersetzen
   und darüber eine neue leere anlegen.

---

## Unveröffentlicht

### Behoben

- **Werkzeugleiste zeigt in allen Sprachen die deutschen Buchstaben.** Auf den
  Knöpfen steht fest verdrahtet `<b>F</b>`, `<i>K</i>`, `<u>U</u>` (Fett,
  Kursiv, Unterstrichen); übersetzt ist nur der Tooltip. Betrifft sechs von
  sieben Sprachen — Englisch erwartet B/I/U, Französisch G/I/S, Italienisch
  G/C/S, Spanisch N/C/S. Zu sehen auch auf den Store-Bildern.
  Braucht drei neue Übersetzungsschlüssel in sechs Sprachen und je eine Zeile
  bei `data-cmd="bold"`/`"italic"`/`"underline"` (um Zeile 6831).
  **Danach müssen die Bildschirmfotos neu aufgenommen werden**, die alten
  zeigen dann das Falsche.

### Offen, noch nicht entschieden

- **Bildschirmfotos nur für de und en.** Die Listings für fr, es, it, pl und pt
  tragen den englischen Satz. Die Aufnahmewerkzeuge liegen in
  `cc test/werkzeuge/bilder/` (`screenshots-de.js`, `screenshots-en.js`), fünf
  weitere Sprachen wären eine Abwandlung davon.
- **`Store-Texte-PartnerCenter.txt` ist nicht auf dem Stand des Eingetragenen.**
  Beim Ausfüllen am 2026-10-02 geändert, in der Datei nicht nachgezogen:
  (1) Suchbegriffe — `docx` und `odt` ersetzen je zwei schwache Begriffe;
  fremde Marken wie „Word" oder „OpenOffice" wurden bewusst **nicht**
  genommen, die sind in Suchbegriffen ein Ablehnungsgrund.
  (2) „Neuigkeiten" als Aufzählung statt Fließtext.

---

## 1.0.0 — 2026-10-02

Erste Veröffentlichung im Microsoft Store.
Produkt-ID **9N7N656ZRJSZ**, Tag `v1.0.0` auf `2705261`, Paket
`Anrede.PureQuillWriter 1.0.0.0`, x64 und arm64 in einer Einreichung.
Kostenlos, USK 0, Herausgeber Suvantra.

### Neu in dieser Veröffentlichung

- **Alle Daten löschen** unter *Einstellungen › Speichern*, als Gegenstück zur
  Vollsicherung. Der Dialog bietet die Sicherung als ersten Weg an; bricht der
  Speichern-Dialog ab, wird nichts gelöscht. Entfernt Dokumente, Notizen,
  Glossare, Einstellungen, die gemerkten Dateizeiger und das geholte deutsche
  Wörterbuch. Eigene Dateien auf der Platte bleiben liegen, nur der Zeiger
  darauf verschwindet.
- **Über-Fenster** mit Version und den Lizenzen der sieben Wörterbücher.

### Behoben

- `saveBundle` meldete „Gesichert" auch nach einem abgebrochenen
  Speichern-Dialog. `download()` und `saveBundle()` melden jetzt zurück, ob
  wirklich geschrieben wurde.
- Die Hilfe behauptete in der App-Fassung, der Arbeitsstand gehe bei einer
  Deinstallation verloren — in allen sieben Sprachen. **Am Store-Paket
  gemessen stimmt das nicht**: Die Daten liegen in
  `%APPDATA%\PureQuill Writer` und überleben Update, Zurücksetzen und
  Deinstallation. Derselbe Irrtum stand in der Datenschutzerklärung und ist
  dort ebenfalls berichtigt.
- Die Karte im Einstellungsdialog redete in der Desktop-Fassung vom „Browser".

### Gemessen, nicht angenommen

Sideload-Test am 2026-09-30: 1.0.0 installiert, Dokument getippt, 1.0.1
drübergespielt — das Dokument hat überlebt, im Programm bestätigt. Ebenso
geprüft: `Reset-AppxPackage` und `Remove-AppxPackage` lassen die Daten stehen.
Die AppData-Umleitung von MSIX greift bei diesem Paket **nicht**, der
Paketcontainer bleibt leer.
