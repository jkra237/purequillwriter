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
  Knöpfen stand fest verdrahtet `F`/`K`/`U`; übersetzt war nur der Tooltip.
  Jetzt tragen sie die Buchstaben, die Word in der jeweiligen Sprache zeigt:

  | | de | en | fr | es | it | pt | pl |
  |---|---|---|---|---|---|---|---|
  | Fett | F | B | G | N | G | N | B |
  | Kursiv | K | I | I | K | C | I | I |
  | Unterstrichen | U | U | S | S | S | S | U |

  Spanisch ist wirklich **K** für *cursiva*, nicht C — so steht es in Word.
  Gelöst über `PL()` statt über drei neue `tr()`-Schlüssel: ein einzelner
  Buchstabe als Wörterbuchschlüssel wäre mehrdeutig.
  Die Tastenkürzel bleiben in allen Sprachen Strg+B/I/U (die erbt das
  Programm vom Browser); die Tooltips sagten das schon vorher richtig.
  Die Bildschirmfotos sind am 2026-10-03 neu aufgenommen — jetzt für alle
  **sieben** Listings, vorher trugen fr/es/it/pl/pt die englischen. Liegen in
  `suvantra-site/store-einreichung/<locale>/` und `store-screenshots.zip`;
  **im Partner Center hochzuladen** mit der 1.0.1-Einreichung. Werkzeug:
  `cc test/werkzeuge/bilder/screenshots.js <sprache>`.

- **Der Farbschema-Dialog nannte „Papier“ den Standard** („Warmes Naturweiß,
  Standard“, in allen sieben Sprachen), obwohl neue Nutzer Azur bekommen.
  Der Hinweis steht jetzt nicht mehr in einer Beschreibung, sondern hängt
  sich an das Schema in `STANDARD_THEMA` — dieselbe Konstante speist die
  Voreinstellung und das Sicherheitsnetz für unbekannte Schemata, die drei
  Stellen können nicht mehr auseinanderlaufen. Kein neuer
  Übersetzungsschlüssel, `tr("Standard")` gab es schon.
  Das Farbschema-Ladenbild zeigt Papier gewählt und trug darum den alten
  Text; es ist für alle sieben Sprachen noch am selben Tag neu aufgenommen.

- **Wortwiederholungen zeigten Füllwörter, obwohl sie ausgeblendet waren**
  — gemessen im Portugiesischen: „pela/pelo“ (durch die/den) und „eram“
  (waren). Die Füllwortprüfung lief nur am Stamm, und das Wörterbuch führt
  mehrdeutige Wörter mitunter auf einen fremden Stamm zurück („pela“ →
  „pelar“, schälen; „eram“ → „erar“), der nicht in der Liste steht. Jetzt
  wird zusätzlich die geschriebene Form geprüft. Die Prüfung am Stamm bleibt,
  es kommt nur ein Filter hinzu, und er greift nur bei Wörtern, die wörtlich
  in der Liste stehen. Vergleich vorher/nachher mit der echten
  `repAnalyse()` über die Beispieltexte aller sieben Sprachen: in de, en,
  es, fr, it, pl keine einzige Änderung; in pt fallen genau „pela/pelo“ und
  „eram“ heraus. Mit eingeschalteten Füllwörtern erscheinen sie weiter.

- **Word-Export rückte Zeilen ein, die im Editor bündig standen.** Gemeldet
  an einem echten Bewerbungsschreiben: zwei Adresszeilen eines importierten
  Briefs begannen mit 9 bzw. 23 gewöhnlichen Leerzeichen. Der Editor zeigt
  sie nicht (CSS fasst Leerraum zusammen und lässt ihn am Zeilenanfang weg),
  der Export schrieb sie wörtlich, Word zeigte sie — das Programm zeigte also
  etwas anderes, als es speicherte. `inlineAblaufen()` behandelt Leerraum
  jetzt wie der Editor: Folgen aus Leerzeichen/Tab/Zeilenumbruch werden ein
  Leerzeichen, am Absatzanfang und nach `<br>` fällt es weg. Ausgenommen:
  das geschützte Leerzeichen (bleibt auch im Editor stehen), `<pre>`
  (pre-wrap) sowie Kopf- und Fußzeile (pre-wrap, laufen nicht hier durch).
  Geprüft: sieben Fälle, Word-Text gegen `innerText` des Editors, alle
  gleich; `check-export.mjs` 252/252.
  Wer das Dokument schon mit 1.0.0 gespeichert hat: Datei mit 1.0.1 erneut
  speichern, die Leerzeichen stecken noch im Dokument, werden aber nicht
  mehr exportiert.

- **Ein neues Dokument kam doppelt.** Alle Reiter schließen, das
  Willkommensfenster mit × schließen, dann *Datei › Neu* — es standen zwei
  leere Reiter da. Ursache: `S.docs` darf nie leer sein, darum liegt hinter
  der leeren Arbeitsfläche ein unsichtbarer, leerer Platzhalter, und das neue
  Dokument kam daneben statt an seine Stelle. Dasselbe beim **Öffnen einer
  Datei** aus diesem Zustand — und damit auch beim allerersten Start:
  Willkommen › *Datei öffnen* ließ neben der Datei einen leeren Reiter
  „Ohne Titel“ stehen. Ebenso beim Hinzuladen einer `.pqw`.
  `platzhalterAbloesen()` nimmt den Platzhalter jetzt heraus, bevor das
  neue Dokument dazukommt — aber nur, solange wirklich kein Reiter angezeigt
  wird (`ohneDokument`, gesetzt von `clearShell()`, gelöscht von
  `render()`) und er leer ist. Ein sichtbarer leerer Reiter bleibt stehen
  wie bisher. Geprüft: fünf Wege aus dem leeren Zustand (darunter der
  gemeldete und der Kaltstart mit leerem Speicher) ergeben je einen Reiter,
  drei Gegenproben mit sichtbaren Reitern verhalten sich unverändert, keine
  Fehler.

### Nebenbei gefunden, noch nicht behoben

- **Wortformen-Gruppierung fasst Fremdes zusammen** — Kandidat für 1.1.
  `stem()` nimmt bei mehrdeutigen Wörtern *eine* Herleitung, nicht
  unbedingt die gemeinte (gemessen 2026-10-03): Französisch
  `abord`/`d’abord` → `bord` (Vorsilbe, nicht die Elision); Portugiesisch
  `pela`, `pelo`, `pele`, `peles` → alle `pelar` („schälen“).
  Idee: bei mehreren Herleitungen das Wort selbst bevorzugen, wenn es ein
  eigener Wörterbucheintrag ist. **Nicht ohne Vergleichslauf** über längere
  Texte in allen sieben Sprachen — dieselbe Regel könnte Zusammengehöriges
  trennen (im deutschen Bild stehen „Bögen“ und „Bogen“ schon heute getrennt).
  Den sichtbaren Folgefehler (Füllwörter rutschen durch) behebt der Eintrag
  unter „Behoben“.
- **Portugiesisch: „marca-d’água“ gilt als Fehler** mit typografischem
  Apostroph, mit geradem `'` nicht (gemessen). Die Prüfung setzt `’`
  nicht mit `'` gleich. Französisch `d’abord` geht trotzdem durch, das
  dortige Wörterbuch kennt beide Zeichen selbst.
- **`<pre>` im Word-Export:** Zeilenumbrüche darin landen als rohes
  Zeilenende in `<w:t>`; Word macht daraus keine neue Zeile. Älter als der Leerraum-Fix,
  dort unverändert gelassen.
- **Italienisch kann Wortformen nicht zusammenfassen** (das Wörterbuch kennt
  sie nicht, siehe CLAUDE.md). Das Ladenbild zeigt darum den ausgegrauten
  Haken samt Hinweis — ehrlich, aber kein Werbebild.

### Offen, noch nicht entschieden

- **Tastenkürzel für Fett/Kursiv/Unterstrichen je Sprache** — Kandidat für
  1.1, nicht für 1.0.x. Die Knöpfe zeigen seit dem Fix oben Words Buchstaben,
  die Kürzel sind aber überall Strg+B/I/U (vom Browser geerbt). Word belegt
  in Spanisch und Portugiesisch **Strg+N/K/S**, in Italienisch und
  Französisch ebenfalls eigene. Wer aus Gewohnheit Strg+N drückt, bekommt in
  der Desktop-Fassung ein neues Dokument statt Fett. Zu klären: Kürzel je
  Sprache in `KUERZEL` aufnehmen (stehen dort bisher bewusst nicht), und was
  dann mit Strg+N (neues Dokument) und Strg+S (Zwischenstand) passiert.
  Vorher für it/fr nachschlagen statt annehmen.

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
