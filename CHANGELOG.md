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

### Neu

- **Linux-Fassung**: AppImage und .deb, je x64 und arm64, gebaut in WSL mit
  `desktop/scripts/linux-bauen.sh` (siehe `desktop/README.md`). Derselbe
  Electron-Code wie unter Windows, kein eigener Zweig. Das .deb empfiehlt
  Carlito, Caladea und Liberation: Chromium setzt diese unter Linux selbst für
  Calibri, Cambria, Times New Roman, Arial und Courier New ein (gemessen
  2026-10-08), sie sind maßgleich, Umbrüche und Seitenzahl bleiben wie in Word.
  Verbreitet wird sie über suvantra.eu, nicht über einen Store.
- **Deutsches Wörterbuch in den Linux-Paketen** (`prepare.mjs --linux`).
  Unter Windows bleibt es draußen, weil sich die GPL nicht mit dem
  Kopierschutz des Stores verträgt; die Linux-Pakete gehen ohne Store
  hinaus, also prüft Deutsch dort ab dem ersten Start ohne Netz. Lizenztext
  liegt daneben.
- **Freie Ersatzschriften** in `schriftStapel()` (`SCHRIFT_ERSATZ`): Palatino
  Linotype und Book Antiqua → Palatino/P052/TeX Gyre Pagella, Garamond → EB
  Garamond, Georgia → Gelasio, Verdana → DejaVu Sans. Unter Linux fielen diese
  Schriften vorher auf die Grundschrift bzw. Carlito. Greift nur, wo das
  Original fehlt; Windows und der Word-Export behalten den Originalnamen. Das
  .deb empfiehlt die Pakete dazu.

### Behoben

- **Schriftwechsel über die Werkzeugleiste** setzte `Schrift,serif` statt
  `schriftStapel()`: Eine fehlende serifenlose Schrift (unter Linux Verdana,
  Tahoma, Segoe UI, Trebuchet; auf dem Mac Calibri) erschien bis zum
  nächsten Öffnen mit Serifen. Und der Zeilenabstand blieb auf der Höhe der
  alten Schrift stehen, auch unter Windows: Calibri → Georgia stand im Editor
  bei 1,15 × 1,22 statt 1,15 × 1,15, rund 6 % weiter als im Export, bis das
  Dokument neu geöffnet wurde.
- **Doppelklick auf eine `.pqw` öffnete nur das Programm, nicht die Datei** —
  unter Windows wie Linux, seit 1.0.0. `main.js` liest jetzt die Befehlszeile
  (`dateienAus()`, unter Linux auch `file://`-Adressen): beim ersten Start
  holt `index.html` die Dateien ab, sobald es aufgebaut ist
  (`pqw:startDateien`); läuft das Programm schon, schickt `second-instance`
  sie hinüber (`pqw:dateien`). Beides geht durch `ladeDokumente()`, also
  schließt sich auch das Willkommensfenster, und eine Vollsicherung fragt
  vorher nach. Geprüft unter Linux (arm64-Paket) und Windows, mit
  Leerzeichen im Dateinamen.
- **Zeichenzahl zählte Absatzwechsel mit** — in Statusleiste, Auswahlanzeige,
  „Wörter zählen“ und beim Schreibziel in Zeichen. Ein leeres Dokument stand
  bei „1 Zeichen“, drei Absätze bei vier zu viel. Dazu rechneten Statusleiste
  (innerText) und Dialog (stripHtml) getrennt und zeigten für denselben Text
  verschiedene Zahlen (32 gegen 31, Word: 28). Jetzt zählt nur noch
  countStats(), ohne Zeilen- und Absatzwechsel wie Word; gemessen an sechs
  Fällen (leer, ein und drei Absätze, Leerzeile, Überschrift, Liste) und an
  einer Auswahl über zwei Absätze, alle gleich Word. Bestand schon in 1.0.0.

### Nebenbei gefunden, noch nicht behoben

- **Wortformen-Gruppierung fasst Fremdes zusammen** — Kandidat für 1.2.
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
- **Englische Vorschläge übersehen fehlende Apostrophe:** für „doesnt“
  kommen „doesant“, „doesent“ …, nicht „doesn’t“. Bestand schon vorher.
- **Italienisch kann Wortformen nicht zusammenfassen** (das Wörterbuch kennt
  sie nicht, siehe CLAUDE.md). Das Ladenbild zeigt darum den ausgegrauten
  Haken samt Hinweis — ehrlich, aber kein Werbebild.

### Offen, noch nicht entschieden

- **Tastenkürzel für Fett/Kursiv/Unterstrichen je Sprache** — Kandidat für
  1.2, nicht für 1.1.x. Die Knöpfe zeigen seit 1.1.0 Words Buchstaben,
  die Kürzel sind aber überall Strg+B/I/U (vom Browser geerbt). Word belegt
  in Spanisch und Portugiesisch **Strg+N/K/S**, in Italienisch und
  Französisch ebenfalls eigene. Wer aus Gewohnheit Strg+N drückt, bekommt in
  der Desktop-Fassung ein neues Dokument statt Fett. Zu klären: Kürzel je
  Sprache in `KUERZEL` aufnehmen (stehen dort bisher bewusst nicht), und was
  dann mit Strg+N (neues Dokument) und Strg+S passiert — seit 1.1.0 ist
  Strg+S „Speichern“, Unterstrichen auf Strg+S würde also das Speichern
  verdrängen.
  Vorher für it/fr nachschlagen statt annehmen.

- **`Store-Texte-PartnerCenter.txt` ist nicht auf dem Stand des Eingetragenen.**
  Beim Ausfüllen am 2026-10-02 geändert, in der Datei nicht nachgezogen:
  (1) Suchbegriffe — `docx` und `odt` ersetzen je zwei schwache Begriffe;
  fremde Marken wie „Word" oder „OpenOffice" wurden bewusst **nicht**
  genommen, die sind in Suchbegriffen ein Ablehnungsgrund.
  (2) „Neuigkeiten" als Aufzählung statt Fließtext.

---

## 1.1.0 — 2026-10-04

Erste Folgeversion im Store. Tag `v1.1.0` auf `631d692`, Pakete x64 und
arm64 in einer Einreichung, „Neuigkeiten“ in sieben Sprachen
(`suvantra-site/store-einreichung/Neuigkeiten-1.1.0.txt`). 1.1.0 statt
1.0.1, weil mit „Speichern“ eine neue Funktion dabei ist.

### Neu

- **Datei › Speichern (Strg+S)** — gewünscht nach einem Nutzertest: neben
  „Speichern als“ fehlte das gewohnte Speichern, obwohl das Programm laufend
  sichert. Schreibt das offene Dokument in seine Word-Datei, nur dieses und
  nur auf Befehl. Beim ersten Mal wird nach dem Ort gefragt (`.docx`), danach
  ohne Rückfrage überschrieben. Eine geöffnete `.docx` ist sofort die Datei
  des Dokuments und wird zurückgeschrieben; andere geöffnete Formate fragen
  beim ersten Speichern nach einer `.docx`. *Speichern als › Word* macht die
  gewählte Datei ebenfalls zur Datei des Dokuments, wie in Word.
  - Jedes Speichern legt zusätzlich einen Zwischenstand an.
  - **Strg+S** speichert jetzt; bis 1.0 legte es nur einen Zwischenstand an
    und meldete „Gesichert“ — wer es aus Gewohnheit drückte, glaubte eine
    Datei gespeichert zu haben. Der Zwischenstand allein liegt auf Alt+⇧+S.
  - **Statuszeile:** Dateiname mit Punkt (grün = aktuell, Akzentfarbe =
    Änderungen noch nicht in der Datei), Erklärung im Tooltip, Klick
    speichert.
  - **Schließen** eines Dokuments mit ungespeicherten Änderungen fragt
    „Speichern / Nicht speichern / Abbrechen“. Ist die Datei aktuell, schließt
    es ohne Frage. „Vorher speichern“ im bisherigen Dialog speichert jetzt
    und schließt dann, statt den Dialog offen zu lassen.
  - Ist die Datei gesperrt (meist: noch in Word offen), sagt das Programm das
    und fragt nach einem anderen Ort.
  - Beim Beenden des Programms wird nicht gefragt: dort geht nichts verloren,
    der Text bleibt im Programm und ist beim nächsten Start wieder da.
  - Die `.pqw`-Verknüpfung (*Alles sichern › Mit Datei verknüpfen*) bleibt
    unverändert daneben bestehen — laufend mitgeschrieben, eigenes Format.
  - Technisch: `d.ziel` (Name, Pfad in der Desktop-Fassung, Fingerabdruck
    des zuletzt Gespeicherten); im Browser der Datei-Handle in der IndexedDB
    unter `ziel:<id>`, getrennt vom `.pqw`-Handle. `exportDoc()` ist in
    `docxBlob()` (bauen) und den Dialogteil zerlegt. `desktop/main.js`
    liefert beim Öffnen den Pfad mit.
  - Geprüft in der Browser-Vorschau mit einer Attrappe der Desktop-Brücke:
    erstes Speichern fragt einmal, Strg+S danach schreibt ohne Frage an
    denselben Pfad und unterdrückt das Browser-Speichern, Statuspunkt
    wechselt korrekt, Alt+⇧+S nur Zwischenstand, Schließen-Dialog in de/en/fr,
    gesperrte Datei → Meldung und neuer Ort, geöffnete `.docx` → Datei des
    Dokuments und zurückgeschrieben, Ergebnis wieder lesbar.
    `check-export.mjs` 252/252, Hilfe-Marken und Kürzel-Prüfung grün.
    **Nicht live geprüft:** der Browserweg über Datei-Handles (Chrome/Edge auf
    suvantra.eu/app) und die echte Desktop-Fassung — vor dem Einreichen von
    Hand durchspielen.
- Hilfe: Absatz zu *Speichern* im Thema „Speichern als“, Kürzeltabelle in
  allen sieben Sprachen angepasst.
- **Neue Dokumente wie in Word.** Bisher Georgia 12, Zeilenabstand 1,62,
  A4-Ränder 25/20/25/25 mm, Schrift und Größe nur in den Einstellungen.
  Jetzt **Calibri 11, Zeilenabstand 1,15, Ränder 25/25/20/25 mm** (oben,
  rechts, unten, links) — für alle, auch bestehende Installationen.
  - **Dialog „Neues Dokument“** zeigt Schrift, Größe, Zeilen- und
    Absatzabstand sichtbar und mit diesen Werten vorbelegt; Ränder darunter
    einklappbar. „Als Standard“ merkt sich auch Schrift, Größe und
    Absatzabstand. Die Werte werden am Dokument festgeschrieben
    (`leeresDokument()`), nicht aus den Einstellungen geerbt. Der Weg aus
    dem Willkommensfenster ist derselbe wie Datei › Neu — vorher übernahm er
    nur das Seitenformat.
  - **Zeilenabstand rechnet wie Word:** Vielfaches der natürlichen
    Zeilenhöhe der Schrift (`lhNatur()`, gemessen: Calibri 1,22, Georgia
    1,14, Arial 1,15, Segoe UI 1,33), nicht der Schriftgröße. „1,15“ sieht
    damit aus wie in Word und geht unverändert als `w:line` hinaus; vorher
    war Word-1,15 rund 20 % weiter. Liste wie Word: 1 · 1,08 · 1,15 · 1,5 ·
    2 · 2,5.
  - **Bestehende Dokumente sehen unverändert aus:** `dokAufWordWerte()`
    schreibt einmalig Schrift, Größe und Format fest (A4 mit den alten
    Rändern) und rechnet den Zeilenabstand um (`d.lhw` markiert erledigte).
    Läuft beim Start, beim Laden einer Vollsicherung von vor 1.1 und für
    jedes Dokument aus einer älteren Teilsicherung. Gemessen: 25,92 → 25,90
    px und 24,27 → 24,26 px Zeilenhöhe.
  - **„Als Standard“ ersetzt** — nach Rückmeldung: der Haken sagte weder,
    was zum Standard wird, noch wofür. Jetzt erscheint im Dialog nur dann
    eine Zeile, wenn die Wahl vom Standard abweicht: „Neue Dokumente
    beginnen sonst mit DIN A4 · Calibri 11 · Zeilenabstand 1,15.
    *Künftig immer so beginnen*“ — ein Klick übernimmt es, eine Meldung
    bestätigt, was neue Dokumente jetzt bekommen. Im Dialog „Seitenformat“
    eines bestehenden Dokuments erst, wenn man dort etwas verstellt.
  - **Einstellungen › Allgemein › Neue Dokumente**: Schrift, Größe,
    Zeilen- und Absatzabstand, Seitenformat — der Ort, an dem man den
    Standard sieht und ändert — und „Auf Word-Standard zurücksetzen“
    (`WORD_VORGABE`).
  - Schriften fallen passend zurück (`schriftStapel()`): serifenlose auf
    Carlito/Arial, nicht mehr auf Serif — Calibri auf einem Rechner ohne
    Calibri erschien sonst als Times.
  - Geprüft: Umstellung eines 1.0-Speicherstands (zwei Dokumente,
    geerbte und eigene Werte), Dialogvorbelegung, neues Dokument mit genau
    Word-Zeilenhöhe (20,58 px bei Calibri 11), „Als Standard“, Dialog
    „Seitenformat“ ohne Schriftfelder; `check-export.mjs` 252/252,
    check-i18n grün.

### Behoben

- **Zeilen- und Absatzabstand aus Word-Dateien** wurden nicht gelesen: eine
  Datei mit 1,08 und 8 pt ging beim Speichern mit der eigenen Voreinstellung
  zurück. `docxAbstand()` liest `w:spacing` (nur `lineRule="auto"`,
  „exakt“/„mindestens“ bleiben außen vor) aus Vorgaben, Vorlagenkette und
  Absatz; `docxGrundschrift()` nimmt den Wert, der am meisten Text trägt.
  Umlauf geprüft: `line="259" after="160"` hinein und genauso wieder heraus.
  Dabei: `psOf()` ließ einen Absatzabstand von 0 als „nicht gesetzt“
  durchfallen (`||`) — jetzt gilt 0.
- **Dateiname beim Speichern** endete auf das Satzzeichen der ersten Zeile
  („Sehr geehrte Damen und Herren,.docx“). `safeName()` streicht Satzzeichen
  am Ende, wie Word; gilt für alle Exporte und Sicherungen.
- **Typografischer Apostroph in der Rechtschreibprüfung:** „marca-d’água“,
  „don’t“ galten als Fehler, mit geradem Apostroph nicht. Nur das
  französische Wörterbuch bringt dafür eine ICONV-Umsetzung mit. `check()`
  versucht jetzt die andere Apostroph-Form; Vorschläge kommen im Apostroph des
  Textes.
- **Code-Blöcke (`<pre>`) im Word-Export:** Zeilenenden und Tabs landeten
  als Leerraum in `<w:t>`, Word zeigte alles in einer Zeile. Jetzt
  `<w:br/>` und `<w:tab/>`.
- **ODT- und RTF-Dateien** bekamen Schrift, Größe und Abstände nicht aus der
  Datei, nur .docx. `odtGrundschrift()` liest `styles.xml` (Vorgabe je
  Familie, Standardvorlage) und die automatischen Vorlagen aus
  `content.xml` samt Elternkette, `fo:line-height` in Prozent und
  `fo:margin-bottom`; `rtfGrundschrift()` liest `\fonttbl`, verfolgt
  `\f`/`\fs`/`\plain`/`\sl`+`\slmult`/`\sa` je Gruppe und überspringt
  Kopfdaten, Bilder, Kopf-/Fußzeilen und `\*`-Gruppen. Beide zählen nach
  Textmenge ohne Überschriften und gehen durch dieselbe Schriftzuordnung
  (Liberation Serif → Times New Roman usw.). Geprüft mit einer RTF wie aus
  Word (Arial 11, 1,15, 10 pt; Times im Titel der Kopfdaten zählt nicht) und
  einer ODT wie aus LibreOffice (Liberation Serif 12, 115 %, 0,247 cm).
- **Text aus Word-Dateien und Eingefügtes wirkte zu groß.** Zwei Ursachen:
  (1) Der Word-Import las Schriftart und -größe der Datei gar nicht; eine
  Datei in Arial/Calibri 11 erschien in der eigenen Voreinstellung (Georgia
  12) — und ging beim Speichern auch so zurück. Jetzt bestimmt
  `docxGrundschrift()` die Schrift, die im Fließtext am meisten Text trägt
  (Überschriften zählen nicht; Vorgaben, Vorlagenkette, Zeichenvorlage und
  direkte Angabe wie bei Fett/Kursiv), löst Designschriften über
  `theme1.xml` auf und setzt `d.font`/`d.size`. Schriften außerhalb der
  Programmliste werden der nächsten zugeordnet (`SCHRIFT_NAEHE`, z. B. Aptos
  → Calibri, Helvetica → Arial); unbekannte lassen die Voreinstellung stehen.
  Die gemessene Größe dient auch der em-Umrechnung von Tabellenzeilen.
  (2) Der Zoom stand für neue Nutzer auf 120 %, Word zeigt 100 %. Jetzt 100 %;
  wer schon eine Stufe gewählt hat, behält sie. Zusammen ergab das rund das
  1,3-Fache der Größe in Word. Eingefügter Text übernimmt weiterhin bewusst
  die Größe des Dokuments.
  Geprüft: fünf gebaute Testdateien (Arial-Läufe gegen Calibri-Vorgabe,
  nur Designschrift Aptos, Überschrift und unbekannte Schrift, ohne Angaben,
  Übernahme bis in Werkzeugleiste und Editor) und eine echte Word-Datei
  (Arial 11 erkannt); `check-export.mjs` 252/252.
- **Willkommensfenster blieb nach „Datei öffnen…“ stehen.** Das Dokument
  wurde geladen, das Fenster davor blieb offen (es ist gesperrt, `lockedOvl`).
  Steckte schon in 1.0.0 — nur der `.pqw`-Weg über `applyBundle` schloss es
  selbst. Gemeldet beim Testen von „Speichern“ in der Desktop-Fassung.
  Beim Prüfen des Fixes für das doppelte Dokument (eb8e8d3) war es nicht
  aufgefallen, weil das Testskript das Fenster selbst geschlossen hatte —
  der Test verdeckte genau diesen Fehler. `ladeDokumente()` schließt es
  jetzt, sobald etwas geladen wurde; ist die Datei unlesbar, bleibt es offen.
- **„Wörterbuch nicht verfügbar“ war in keiner Sprache übersetzt** und
  erschien überall deutsch. Beim Prüfen der neuen Texte aufgefallen.

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
