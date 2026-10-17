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

### Behoben (Schriftliste der Desktop-Fassung, gefunden bei der Prüfung vor 1.3)

- **Die App zeigt alle Systemschriften — aber nur bei sichtbarem Fenster.**
  `queryLocalFonts` lieferte in der Projektfassung 266 Familien ohne
  Rückfrage, verweigert aber bei verdecktem Fenster („Page needs to be
  visible“). Die Vorababfrage nach dem Start konnte genau das treffen und
  hielt dann bis zum Neustart die kürzere Namensliste fest. Jetzt gilt so ein
  Rückfall nur vorläufig, beim nächsten Öffnen der Liste wird neu gefragt.
- **Arabische, hebräische und Symbolschriften aus Office** standen noch in der
  Liste (AGA Arabesque, Amiri, DecoType Naskh, Diwani, Kufi, Alef, Frank
  Ruehl, Segoe Fluent Icons, MS Outlook, „Sans Serif Collection“ …) — der
  Filter kannte nur die Windows-eigenen. Gemessen an Toms 356 Schriftnamen:
  übrig bleiben nur Schriften für lateinische Buchstaben.

### Behoben (Bilder in Word und OpenDocument)

- **Freie Bilder wandern mit dem Text, wie in Word („Mit Text
  verschieben“).** Bisher hing ein Bild „hinter/vor dem Text“ an der Seite:
  fügte man davor einen Seitenumbruch ein, rückte der Text weiter, die
  Unterschrift blieb stehen (Toms Fund). Jetzt hängt jedes freie Bild am
  Block direkt nach ihm (Abstand `data-fabsatz`), Seite und Höhe folgen
  bei jedem Umbruch diesem Block; wer das Bild verschiebt, hängt es an den
  Absatz an der neuen Stelle. Bestehende Dokumente bekommen den Anker beim
  ersten Öffnen, ohne dass sich etwas bewegt — verankert wird erst, wenn
  alle Bilder geladen und die Schriften da sind, sonst wäre der Abstand
  falsch gemessen (so beim ersten Versuch im Umlauf gefunden).

- **Frei platzierte Bilder** („hinter dem Text“/„vor dem Text“) gehen jetzt
  in beide Richtungen verlustfrei. Beim Öffnen von Word und .odt wurden sie
  zu Bildern in der Zeile. Beim Speichern als Word stand das Bild an seiner
  Stelle im Text in einem eigenen leeren Absatz: eine Unterschrift von
  Seite 1 (Unterschriften hängen am Dokumentende) landete in Word auf der
  letzten Seite, und der leere Absatz schob den Text um eine Zeile. Grund:
  dieses Programm merkt sich die Seite des Bildes, Word und LibreOffice den
  Absatz, an dem es hängt. Jetzt: verankert am Absatz direkt über dem Bild,
  die Höhe zu diesem Absatz, waagerecht zum Rand (`freiZiele`, Tabellen
  ausgenommen) — so bleibt eine Unterschrift unter ihrem Text, auch wenn
  Word die Seiten etwas anders umbricht (ein erster Versuch mit dem ersten
  Absatz der Seite schob das Bild in Word auf die Vorseite);
  beim Öffnen kommt ein freies Bild zurück, Seite und Höhe rechnet
  `placeFreeFigs()` nach dem ersten Umbruch aus dem Absatz aus, an dem es
  hängt (Bezug Rand, Blatt oder Absatz).
- **Ein Absatz mit umflossenem oder freiem Bild blieb nicht, was er war.**
  Hing in Word oder LibreOffice ein Bild an einer Überschrift (Logo neben dem
  Titel) oder einem Zitat, kam daraus ein einfacher Absatz. Jetzt steht das
  Bild davor, und der Absatz behält Stufe, Zitat oder Unterschrift.

### Geändert

- **Listenstil wie in Word: der zuletzt gewählte gilt für neue Listen.**
  Bisher galt ein im Format-Menü gewählter Stil nur für die eine Liste; jede
  neue begann wieder mit „1.“ bzw. „•“. Jetzt merkt sich das Programm den
  zuletzt gewählten Stil je Art (Aufzählung, Nummerierung), auch über einen
  Neustart (`S.settings.listStil`), und Knopf, Tastenkürzel und Menü legen
  neue Listen darin an — bestehende Listen ändern sich nicht. Getipptes
  gewinnt: „1. “ ergibt „1.“, auch wenn zuletzt Römisch gewählt war. Neu
  beim Tippen, wie Word: „a) “ (Kleinbuchstaben), „A. “ (Großbuchstaben),
  „I. “/„III. “ (römisch, mit Startwert). Nur mit a/A beginnend, damit
  „z. B.“ oder „S. 3“ am Absatzanfang keine Liste werden.

- **Listen eingerückt wie in Word** (Toms Frage: in Word stehen Listen
  weiter rechts). Bisher 1,5 em — bei 12 pt Text bei 0,64 cm, halb so weit
  wie Word, und bei kleinerer Schrift noch weniger. Jetzt wie Word: Text
  bei 1,27 cm, jede Ebene 1,27 cm tiefer, die Nummer davor; fest in cm,
  mit dem Zoom skaliert. Word- und OpenDocument-Export schreiben dieselben
  Werte (Nummer bei 0,63 cm), unsere Listen sehen in Word jetzt aus wie
  Words eigene. Bestehende Listen rücken um gut 0,6 cm nach rechts; lange
  Listen können dadurch anders umbrechen.

### Neu

- **Wolke ist das Farbschema neuer Nutzer** (vorher Azur, Toms Wahl):
  reines Weiß, helle Leisten, Blauakzent, kein grauer Rahmen um die Seite.
  Wer schon ein Schema hat, behält es. Im Schema-Dialog trägt jetzt Wolke
  den Hinweis „Standard“.

- **Speichern als OpenDocument-Text (.odt)** unter Datei › Speichern als,
  direkt unter Word. Bis jetzt konnte das Programm .odt nur öffnen; wer eine
  Datei aus LibreOffice bekam, gab sie als Word zurück. Geschrieben so, wie
  LibreOffice es selbst tut (`odtBlob`): Vorlagen „Heading 1–3“,
  „Quotations“/„Intense Quote“, „Caption“, „Footnote“, „Internet link“;
  automatische Vorlagen für Textformat, Ausrichtung, Einzug und Seiten-
  umbruch („Umbruch davor“ am folgenden Absatz); eine Listenvorlage je
  Liste mit den Ebenen der tatsächlich verschachtelten Listen; Tabellen mit
  Spaltenbreiten, verbundenen und verdeckten Zellen; Bilder eingebettet,
  umflossen (am folgenden Absatz verankert) oder frei; Bildunterschrift;
  Fuß- und Endnoten (dieselbe Note an zweiter Stelle als Verweis);
  Kommentare; Kopf-/Fußzeile mit Seitenzahl, Seitenanzahl, Titel, Datum,
  erste und gerade Seite; Seitenformat; Metadaten mit dem eigenen Namen.
  Das Ziel von „Speichern“ bleibt die Word-Datei. Geprüft: Umlauf ist ein
  Fixpunkt, und LibreOffice öffnet die Datei und speichert sie mit allen
  Merkmalen neu (Umlauf-Werkzeug); `check-export` prüft jetzt auch das
  .odt-Paket (mimetype, Manifest, Wohlgeformtheit, Fixpunkt) — 302 statt
  285 Prüfungen.
- **`tools/check-umlauf.mjs`**: Umlauf-Prüfung für Word und OpenDocument
  (`--modus word|odt|nativ`) — ein Dokument mit jedem Merkmal einmal wird
  gespeichert, geöffnet und mit dem Original verglichen, dazu der Fixpunkt.
  Mit installiertem LibreOffice zusätzlich die Gegenprobe mit dem echten
  Programm. Fand die neun Word-Lücken und den fast leeren .odt-Leser.

### Behoben

- **Unterpunkte kamen aus Word als eigene Aufzählungsart „Kreis“ zurück.**
  Die zweite Ebene einer Grundliste schreibt Word (und dieses Programm) mit
  dem Zeichen „o“, und der Leser hielt das für die Kreis-Liste. Beginnt die
  Liste oben mit einem Punkt, sind „o“ und „▪“/„§“ darunter jetzt die
  Grundpunkte — gilt auch für Words eigene mehrstufige Aufzählung und für
  aus Word umgewandelte .odt.

- **OpenDocument (.odt) öffnen auf dem Stand von Word.** Der Leser war rund
  60 Zeilen lang: Absätze, Überschriften, vier Textauszeichnungen, jede
  Liste als flache Punktliste, einfache Tabellen — gemessen kamen 9 von 37
  Merkmalen an (Bilder, Fußnoten, Kopf-/Fußzeile, Seitenformat, Nummerierung,
  Ausrichtung, Schrift am Text fehlten ganz; Tabulatoren wurden Leerzeichen).
  Neu geschrieben (`odtLesen`): Vorlagen mit Elternkette aus styles.xml und
  content.xml (getrennte Karten für Text und Kopf-/Fußzeile, weil die
  automatischen Vorlagen beider Teile gleich heißen dürfen); Schrift, Größe,
  Farbe, Textmarker, hoch/tief, Großbuchstaben am Text; Ausrichtung, Einzug,
  Seitenumbruch vor/nach; Zitat- und Beschriftungsvorlagen (LibreOffice
  „Quotations“, aus Word „Quote“; „Caption“, „Illustration“ …, auch
  LibreOffices Beschriftungsrahmen); Listen mit Art je Ebene, Startwert und
  Weiterzählen; Tabellen mit Spaltenbreiten, verbundenen Zellen, Zeilenhöhe,
  rahmenlos; Bilder eingebettet oder umflossen; Fuß- und Endnoten;
  Kommentare als Notizen; Links (nur http/https/mailto/ftp); Kopf-/Fußzeile
  mit Seitenzahl, erster und gerader Seite; Seitenformat aus der
  Musterseite. Die Grundfarbe der Vorlage „Standard“ gilt nicht als
  Textfarbe, und Schriftlisten („Georgia, serif“) zählen mit ihrem ersten
  Namen. Gemessen an einer von LibreOffice erzeugten Datei: alle Merkmale
  wie beim Word-Weg, das Ergebnis bis auf zwei leere Absätze (Reste aus der
  Word-Vorlage) zeichengleich.

- **Word-Umlauf: neun Merkmale gingen verloren** (gefunden mit einem neuen
  Umlauf-Prüfwerkzeug, das ein Dokument mit allem als Word speichert, wieder
  öffnet und mit dem Original vergleicht). Beim **Öffnen** jeder Word-Datei
  fehlten Ausrichtung (alles kam linksbündig), Hoch-/Tiefstellung,
  Textmarker (`w:highlight` und `w:shd`) und Linkziele (nur noch blauer,
  unterstrichener Text); beim **Speichern** fehlten Seitenumbrüche (leerer
  Absatz), verbundene Zellen, Bildunterschriften, und Zitate wurden zu
  eingerücktem Kursivtext. Jetzt in beide Richtungen: Ausrichtung an
  Absätzen, Überschriften und Bildern; `<sup>`/`<sub>`; Textmarker; Links
  (nur http/https/mailto/ftp werden klickbar); Seitenumbruch als
  `w:br w:type="page"` bzw. `pageBreakBefore`; colspan/rowspan als
  `gridSpan`/`vMerge`; Bildunterschrift als Vorlage „Beschriftung“
  (caption) unter dem Bild; Zitate als Vorlagen „Zitat“/„Intensives Zitat“
  (und eine eigene für die typografische Art). Verhaltensänderung: Bilder
  aus Word stehen wie ihr Absatz ausgerichtet, ohne Angabe links wie in
  Word — bisher kam jedes zentriert. Umlauf ist ein Fixpunkt, Tom hat die
  gespeicherte Datei in Word geöffnet und alles bestätigt (2026-10-17).

- **Großschreibung nach Abkürzungen, und sie ließ sich nicht zurücknehmen.**
  Die Autokorrektur machte nach jedem „. “ groß, auch mitten im Satz nach
  „z.B.“, „ca.“ oder „bzw.“. Rücktaste und wieder klein getippt ergab sofort
  wieder den Großbuchstaben, nur Abschalten half. Jetzt wie in Word:
  eine eingebaute Liste je Prüfsprache (`AC_ABK`), dazu jedes Wort mit
  Punkt darin (z.B, e.g) und einzelne Buchstaben (Initialen, „z. B.“).
  Im Deutschen und Polnischen bleibt es auch nach einer Ordnungszahl mitten
  im Satz klein („der 3. große Tag“). Wer die Großschreibung mit der
  Rücktaste und demselben Buchstaben oder mit Strg+Z zurücknimmt, behält den
  Kleinbuchstaben, und das Wort vor dem Punkt kommt in `S.capAusnahmen`.
  Das gilt auch, wenn das Wort erst fertig getippt, dann ganz gelöscht
  (Rücktaste, Strg+Rücktaste oder markiert) und klein neu geschrieben wird,
  wie in Word. Aber nur innerhalb dieses ersten Worts: Wer schon ein
  Leerzeichen dahinter getippt hat und später den ganzen Satz neu
  anfängt, verlässt sich auf die Korrektur und bekommt sie (`acImWort`).
  Und mitten in einem bestehenden Wort greift die Großschreibung nie: Wer
  später in „Text weiter“ das „T“ löscht und „t“ tippt, korrigiert von
  Hand. Auch Word korrigiert erst beim Fertigschreiben eines Worts.

- **Kopierte Zitate ließen sich nicht mehr in Fließtext verwandeln.** Aus
  Webseiten kommt ein Zitat als `<blockquote><p>…</p></blockquote>`;
  Absatzformat → Fließtext (`formatBlock("p")`) wandelte nur die inneren
  Absätze um, die schon Absätze waren, und der Zitatrahmen blieb. Man bekam
  ihn nur durch Löschen los. Ebenso `<h2><div>`, aus dem `<h2><p>` wurde.
  `alsFliesstext()` löst Überschriften und Zitate jetzt selbst auf; aus
  einem Zitat treten nur die markierten Absätze heraus, davor und danach
  bleibt es Zitat (wie in Word, wo jeder Absatz seine Formatvorlage hat).
  Listen, Tabellen und Bilder im Zitat bleiben, was sie sind.

- **„Formatierung entfernen“ wirkt jetzt wie in Word auch auf den Absatz.**
  Bisher nahm es nur Fett, Kursiv, Farben und Ähnliches weg. Jetzt werden
  zusätzlich Überschriften und Zitate zu Fließtext, und Ausrichtung und
  Einrückung gehen zurück (`formatierungEntfernen()`). Listen bleiben
  Listen. Hilfe in allen sieben Sprachen ergänzt.

- **Der Autor kam nie im PDF an.** `pdfAuthorMeta()` setzte ein
  `<meta name="author">` in der Annahme, Chromium übernehme es; nachgemessen
  mit Chrome 154: das Info-Verzeichnis trägt nur Title, Creator (die
  Browserkennung), Producer und die Daten. Die Desktop-Fassung trägt Titel,
  Autor, Betreff, Stichwörter und „PureQuill Writer“ als Ersteller jetzt nach
  dem Drucken selbst ein (`desktop/pdf-info.js`, inkrementelle
  Aktualisierung: neues Info-Objekt, Querverweis, Trailer mit `/Prev`; der
  Inhalt davor bleibt Byte für Byte). `check-export.mjs` prüft das an jedem
  Testdokument (285/285). Nicht in der echten Electron-App nachgemessen,
  nur mit Chrome headless und denselben `printToPDF`-Optionen.

- **Listen: Unterpunkte gingen beim Speichern verloren, der Listenknopf
  baute ungültiges HTML.** Durchgang über alle üblichen Wege, eine Liste
  anzufangen (Tippen, Knopf, Menü, Palette, Enter/Tab/Rücktaste,
  Einfügen), 34 Fälle. Gefunden und behoben:
  - Mit **Tab** eingerückte Unterpunkte legte Chrome als `<ol><li>…</li><ol>`
    ab; Word-, Markdown- und Textexport lasen nur `<li>`-Kinder und ließen
    die Unterpunkte **ohne Warnung weg**.
  - Der **Listenknopf** (auch Palette, „/“-Menü, Format › Liste) legte die
    Liste in den Absatz: `<p><ol>…</ol></p>`. Nach dem Neuladen standen
    leere Absätze davor und danach, Ausschalten verschmolz die Einträge zu
    einem Absatz mit `<br>`, die Schreibmarke sprang an den Eintragsanfang.
  - `listenOrdnen()` bringt beides in gültige Form, nach jeder
    Listenaktion, in `flush()` und beim Laden (repariert Altbestand).
    Ausschalten, Art wechseln (ganze Liste, wie Word) und Ausrücken
    (`liAusruecken`) macht das Programm jetzt selbst, weil Chromes
    `outdent` mit richtig verschachtelten Listen `<li>` in `<li>` baute und
    Schriftgrößen-`<span>`s einstreute.
  - **Rücktaste am Anfang eines Eintrags** tat beim ersten nichts (den Punkt
    bekam man nie weg) und verschmolz spätere sofort mit dem vorigen. Jetzt
    wie Word: der Punkt geht, der Text bleibt als Absatz, eine Nummerierung
    danach zählt weiter; ein Unterpunkt rückt eine Ebene hinaus.
  - **Strg+Z direkt nach „1. “** gibt den getippten Text zurück statt einer
    leeren Liste.
  - **„3. “ beginnt bei 3**, „1) “ zählt mit Klammer, „- “ setzt einen
    Strich statt eines Punkts, wie in Word.
  - Gleichartige Listen direkt hintereinander werden zusammengefasst.

- **Listen brechen am Seitenende zwischen den Einträgen um**, wie in Word.
  Bisher war eine Liste für den Umbruch ein Block: passte sie nicht ganz,
  sprang sie komplett auf die nächste Seite (gemessen: 65 mm leer bei zwölf
  kurzen Punkten, die fast alle noch Platz gehabt hätten). Und war sie
  länger als eine Seite, lief sie durch Fußzeile und Seitenabstand; der
  Druck teilte sie richtig und hatte danach eine Seite mehr als die Ansicht
  (8 statt 7, letzte Seite ohne Kopf- und Fußzeile). Jetzt wie beim
  zeilenweisen Tabellenumbruch: der erste Eintrag, der über die Seite ragt,
  bekommt einen Abstand bis zur nächsten Seite (Klasse `pgli`, reine
  Anzeige, `flush()` und der Druck nehmen sie heraus), und der Druck bricht
  vor genau diesem Eintrag um (`seitenAnfaenge`). `check-export.mjs` hat
  dafür eine 70-Punkte-Liste mit Unterliste im Prüfdokument und schlug mit
  dem alten Stand in allen sieben Formaten an (285/285 mit dem neuen).
  Ein einzelner Eintrag länger als eine Seite bleibt stehen wie ein
  überlanger Absatz; Absätze teilen weiterhin nicht zeilenweise.

- **Überschriften blieben allein unten auf der Seite stehen**, der Text dazu
  begann erst auf der nächsten. Jetzt wandert die Überschrift mit, wie in
  Word („Nicht vom nächsten Absatz trennen“ ist dort bei Überschriften
  voreingestellt). Anders als Word über Leerzeilen hinweg: Word bindet die
  Überschrift nur an den nächsten Absatz, ist das eine Leerzeile, stehen
  beide allein unten. Mehrere Überschriften untereinander (H1 + H2) zählen
  als eine Einheit. Vom folgenden Inhalt muss der Anfang mit auf die Seite:
  ein Absatz oder eine kurze Tabelle ganz (beide wandern bisher als
  Ganzes), bei Liste und langer Tabelle der erste Eintrag bzw. die erste
  Zeile, bei einem überlangen Absatz zwei Zeilen. Geprüft je Fall in 30
  Lagen zur Seitengrenze (Absatz, Leerzeilen, H1+H2, Liste, kurze und lange
  Tabelle, überlanger Absatz).

- **Absätze brechen am Seitenende zeilenweise um, mit Absatzkontrolle wie
  in Word.** Bisher wanderte ein Absatz, der nicht ganz auf die Seite
  passte, komplett weiter (gemessen: 22 mm leer bei fünf Zeilen), und einer,
  der länger als eine Seite war, lief durch Fußzeile und Seitenabstand; der
  Druck teilte ihn und hatte dann eine Seite mehr (10 statt 9, letzte Seite
  ohne Kopf- und Fußzeile). Jetzt bricht er zwischen zwei Zeilen um,
  mindestens zwei Zeilen stehen auf jeder Seite, unter vier Zeilen wandert
  er als Ganzes — dieselbe Regel wie `orphans/widows: 2`, mit der Chromium
  druckt, deshalb bricht der Druck von selbst an derselben Zeile.
  Technik (`absatzTeilen`): an den Anfang der ersten Zeile der nächsten
  Seite kommt ein Platzhalter der Breite 0 (`span.pgspalt-h`), der nur diese
  Zeile höher macht. Er steckt mit dem ersten Buchstaben in einer
  `white-space:nowrap`-Hülle (`span.pgspalt`): allein passte er noch ans
  Ende der vorigen Zeile, und dort wanderte eine Zeile zu viel (auch ein
  Wortverbinder U+2060 half nicht, nachgestellt). Reine Anzeige wie
  `tr.pgzeile`: reflow, `flush()`, Kopieren und Druck nehmen ihn heraus, die
  Markierung bleibt über Zeichenpositionen erhalten. Rücktaste am
  Zeilenanfang und Entf am Zeilenende trafen den Platzhalter statt des
  Zeichens und schienen nichts zu tun; sie werden umgelenkt
  (`pgspaltUmgehen`). Geprüft in 90 Lagen (4 bis 20 Zeilen) und an einem
  Absatz über drei Seiten: nie eine Einzelzeile, nie eine Zeile im Rand;
  dazu Schreibmarke beim Neuumbruch, Tippen, Rücktaste, Entf, Speichern,
  Kopieren. `check-export.mjs` hat einen Absatz länger als eine Seite im
  Prüfdokument und schlug mit dem alten Stand in allen Formaten an.
  Überschriften nehmen jetzt nur noch die ersten zwei Zeilen eines solchen
  Absatzes mit auf die Seite. Nicht nachgestellt: echte Mausklicks und
  Pfeiltasten am Platzhalter (die Tastatursimulation hier löst keine
  Eingabeereignisse aus).

- **Fette Zwischentitel blieben allein am Seitenende.** Aus Webseiten kommen
  Zwischentitel oft als fetter Absatz statt als Überschrift („Mehr zum
  Thema“ in Toms Test, mit zwei Testdateien bestätigt). Ein Absatz, der eine
  Zeile lang und ganz fett ist (`istZwischentitel`), hält beim Umbruch jetzt
  wie eine Überschrift zu seinem Text. Über Word hinaus, das nur die
  Formatvorlage kennt; der Absatz bleibt ein Absatz. Teilweise fette und
  mehrzeilige Absätze zählen nicht.

- **Öffnen-Fenster ging immer wieder auf** (im eingebauten Browser der
  Claude-App, Toms Test). Ein einziges `catch` fing alles ab: scheiterte
  erst das Lesen der schon gewählten Datei oder das Laden danach, öffnete
  `loadDocumentFile()` noch einen Dialog. Jetzt nur dann ein Ersatzdialog,
  wenn der Dialog selbst nicht aufging; sonst eine Meldung mit dem Grund.
  Das Ersatz-Dateifeld hängt bis zur Wahl im Dokument, weil `change` an
  einem losen Element nicht in jedem eingebetteten Chromium sicher feuert.
  Nachgestellt mit nachgebildetem Dialog (Lesen scheitert, Dialog geht
  nicht auf, Abbrechen, Normalfall); den echten Dialog der Claude-App kann
  ich nicht bedienen. Chrome, Edge und die Store-App waren nicht betroffen.
  Nachtrag: Dort gibt der moderne Dialog die gewählte Datei gar nicht heraus
  („file could not be read“). Scheitert das Lesen, merkt sich das Programm
  das (`pqwOhnePicker`), bittet um eine neue Wahl und öffnet sofort den
  einfachen Dateidialog; ab dann nur noch diesen.

- **Listen aus Word einfügen.** Word legt beim Kopieren keine
  zusammenhängende Liste ab. Word im Browser und das neue Word liefern jeden
  Punkt als eigene Mini-Liste (`div.ListContainerWrapper`, Ebene nur in
  `data-aria-level`); daraus wurde eine Liste je Punkt, jede begann bei 1
  (aus 1, 2, 3 wurde 1, 1, 1), Unterpunkte standen nicht eingerückt, an
  jedem Punkt hing ein geschütztes Leerzeichen. Word am PC (klassisch)
  liefert Absätze mit `mso-list` und das Zeichen als Text davor; Punkte in
  Symbol/Wingdings kamen als „·“, „o“, „§“ an, Listen gar nicht.
  `wordListen()` baut beim Einfügen daraus eine verschachtelte Liste mit
  Startnummer und Stil (a/b/c, römisch, Klammer, Strich, Kreis, Quadrat,
  Haken). Geprüft mit Toms echter Zwischenablage (Word im Browser) und dem
  bekannten Aufbau von Word am PC (nachgebaut, keine echte Probe); Listen
  aus Webseiten unverändert, Weiterschreiben mit Enter und der Word-Umlauf
  gehen.

- **Verschachtelte Nummerierung zählt wie Word: 1. → a. → i.** Bisher zählte
  jede Ebene 1., 2., 3. (Toms Vergleich mit Word). Jetzt per CSS für Listen
  ohne eigenen Stil, ebenso im HTML-Export und im Nur-Text-Export (der auch
  die Startnummer und die Listenstile übernimmt). Word-Export: die
  Grundstile sind mehrstufig wie Words Standardlisten (Nummern decimal →
  lowerLetter → lowerRoman, Punkte • → o → ▪), und eine Unterliste im
  Grundstil hängt an der numId ihrer Liste. Mit eigener numId zählte Word die
  Unterpunkte über verschiedene Hauptpunkte hinweg weiter (a, b, dann c, d).
  Word-Import und Einfügen aus Word: Words Standardebenen (a., i.) werden zum
  Grundstil statt zu einem eigenen Stil, sonst kam „i.“ als „I.“ an und
  „a.“ beim Speichern als „a)“ zurück. Geprüft: Anzeige, Word-XML,
  Umlauf (unverändert), Text, Einfügen; check-export 285/285.

- **Am Seitenende knapp passende Zeilen: Druck hatte eine Seite mehr.**
  Mit Calibri 12 endete eine Zeile eines geteilten Absatzes am Bildschirm
  0,9 px über der Unterkante; im Druck (andere Rundung) passte sie nicht,
  wanderte weiter, und das PDF hatte 11 statt 10 Seiten, die letzte ohne
  Fußzeile (`check-export.mjs`, Formate „ohne Kopfzeile“). Absatzteilung
  rechnet jetzt mit 3 px Spielraum (wie Tabellenzeilen mit 6 px), Blöcke und
  Listeneinträge mit 2 px statt bisher 1 px Überhang zugunsten des
  Bildschirms. Geprüft mit 11 und 12 pt: 285/285.

### Geändert

- **Schriftauswahl wie in Word.** Statt der festen Liste mit rund 30
  Schriften ein beschreibbares Feld mit eigener Liste: oben „Zuletzt
  verwendet“ (fünf), darunter „Alle Schriftarten“ mit Anzahl, beide
  zuklappbar, jede Schrift größer und in ihrer eigenen Form. Tippen filtert
  (Anfangstreffer zuerst), Pfeiltasten wandern, Eingabe übernimmt, Escape
  bricht ab; ein Name, der nicht in der Liste steht, aber installiert ist,
  lässt sich eintippen. Woher „alle“ kommen: in der App vom System
  (queryLocalFonts), im Browser **ohne Erlaubnisabfrage** (Toms Wunsch) über
  rund 300 bekannte Namen (Windows, Office, macOS, Linux), die einzeln auf
  Vorhandensein geprüft werden — auf Toms Rechner 131 Schriften. Umleitungen
  wie Helvetica → Arial und die Linux-Zwillinge erscheinen nicht doppelt.
  Weggelassen: Schriften für andere Schriftsysteme (CJK, Arabisch,
  Hebräisch, Thai, indische …) und Symbolschriften (Wingdings & Co.); steht
  eine davon im Dokument, erscheint sie trotzdem. Dabei behoben: Kam der
  Fokus aus einem Eingabefeld, setzte `edAuswahlHolen` die Schreibmarke an
  den Dokumentanfang statt auf die Markierung — gilt auch fürs Größenfeld.
  Die Auswahl im Dialog „Neues Dokument“ und in den Einstellungen bleibt
  bei der kurzen Liste.

- **Handy-Ansicht in der Browserfassung** (Bildschirm bis 600 px breit, die
  Store- und Desktopfassung bleibt unberührt). Bisher stand dort die A4-Seite
  in voller Breite, der Text lief rechts hinaus, und vier Werkzeugzeilen
  fraßen den halben Bildschirm. Jetzt wie die Mobilansicht von Word und
  Google Docs: der Text fließt über die Bildschirmbreite, ohne Seitenrahmen,
  Lineal und Seitenumbrüche (Kopf-/Fußzeile und Seiten bleiben im Dokument
  und im Druck). Eine wischbare Werkzeugzeile, die Menüs hinter ☰, die
  Statuszeile zeigt nur Wörter und Sicherung. **Ansicht › Seitenansicht**
  schaltet zur echten Seite zurück, eingepasst (dafür darf der Zoom auf dem
  Handy bis 25 % statt 45 % sinken, sonst ragte die Seite hinaus). Die
  Statuszeile lässt sich auf schmalen Bildschirmen seitlich wischen.
  Technik: Klasse `body.handy` über `handyAnwenden()` (auch beim Drehen),
  `paginate()` räumt dann nur Umbruchspuren ab, `S.handySeiten` merkt die Wahl.

- **Schrift und Größe für markierten Text, wie in Word** (Toms Entscheidung:
  PureQuill soll eine vollwertige Word-/OpenOffice-Alternative sein). Bisher
  galten Schrift- und Größenfeld immer für das ganze Dokument. Jetzt:
  Markierung → nur die Markierung; nichts markiert → das als Nächstes
  Getippte; alles markiert (Strg+A) → Grundschrift/-größe des Dokuments.
  Die Felder zeigen, was an der Schreibmarke gilt, bei gemischter
  Markierung bleiben sie leer. Neu: **Strg+Umschalt+> / Strg+<** (und
  Strg+] / Strg+[) zur nächsten Größe der Word-Liste.
  Technik: Größe am Text absolut als `calc(Npt * var(--zoom,1))` (im Druck
  ist --zoom 1; relativ in em verschachtelte sie sich), Schrift als Stapel
  mit Zwillingen. Gesetzt über execCommand `fontName`/`fontSize 7`, deren
  `<font>`-Zwischenform `schriftNormalisieren()` in Spans mit dem echten Wert
  verwandelt; was der Grundschrift entspricht, entfällt.
  **Word-Import wortgenau:** Schriften am Text kamen bisher gar nicht mit,
  Größen nur relativ und in Überschriften nicht. Jetzt jede abweichende
  Schrift (Word-Name zuerst, damit er beim Speichern erhalten bleibt, auch
  wenn sie hier fehlt) und Größe, auch in Überschriften und Titeln.
  Geprüft an Toms echter Word-365-Datei (Titel Aptos Display 28, Überschrift
  Aptos Display 20 blau, Times 16, Comic Sans 9 rot, Georgia 14, Tabelle
  Arial 10): alles stimmt, und Speichern + Wiedereinlesen ist verlustfrei.
  **Word-Export:** Schriften am Text als `w:rFonts`; die Überschrift-
  Vorlagen stehen jetzt im Verhältnis zur Grundgröße wie in der Anzeige
  (bisher fest 18/15/13 pt). HTML und EPUB bekommen feste pt.
  Die Hilfe-Kürzel schützen < und > jetzt im HTML (`helpKuerzel`), das
  Prüfskript liest sie entsprechend.

- **Standardschrift Calibri 12 statt 11** (Toms Wunsch) für neue Nutzer, für
  „Standardwerte wiederherstellen“ und den Werkszustand. Word 365 und Word
  online nehmen Aptos 12; Aptos gibt es aber nur mit Office, deshalb bleibt
  Calibri (jedes Windows, unter Linux Carlito). Google Docs nimmt Arial 11.
  Bestehende Einstellungen und Dokumente bleiben unverändert.

- **Bilder: „Text umfließt“** (Schritt 2 von 2). Neue Layout-Art: das Bild
  steht links oder rechts, der Text läuft daneben weiter (Words
  „Quadrat“). Im Dokument steht es vor dem Absatz, den es umfließen lässt
  (`figure.fig.umfl`, CSS-float, Breite am Rahmen). Ausrichtung in der
  Leiste nur links/rechts; Verschieben per Ziehen setzt es vor den Absatz
  unter dem Zeiger, die Seite folgt der Zeigerhälfte (`umflZiehen`).
  Word-Export: Anker mit `wrapSquare`, am Rand ausgerichtet, eingesetzt in
  den folgenden Textabsatz statt in einen eigenen (sonst entstünde in Word
  eine Leerzeile; `umflAnkerEinsetzen`, sicher gegen Tabellenzellen).
  Word-Import: bisher kam jedes Bild als zentrierte eigene Zeile an; ein
  umflossenes (Quadrat, Passend, Transparent) bleibt jetzt umflossen, die
  Seite aus der Ausrichtung oder Lage. Geprüft: Umfließen links und
  rechts, Ziehen, Eckanfasser, Word hin und zurück; `check-export.mjs` hat
  ein umflossenes Bild im Prüfdokument, Druck und Ansicht brechen gleich um
  (285/285). Hilfe in allen sieben Sprachen.

- **Bilder: neue Leiste und Layout „wie der Text zum Bild steht“** (Toms
  Wunsch, Schritt 1 von 2; Schritt 2 wird „Text umfließt“).
  - Die Leiste schwebt über dem Bild, mit Symbolen statt Textknöpfen wie in
    Word 365 und Google Docs: Layout ▾, Ausrichtung, Bildunterschrift,
    ⋯ (Alternativtext, neu: **Bild ersetzen**), Papierkorb. Der
    Breitenregler entfällt; Größe über **vier Eckanfasser**, beim Ziehen
    steht die Breite in Prozent am Bild, die Leiste tritt zurück.
  - **Layout** für jedes Bild: Eigene Zeile (wie bisher), **Hinter dem
    Text** (neu) und Vor dem Text (bisher nur die Unterschrift). Wechsel
    aus dem Text behält Stelle und Größe auf der Seite, zurück in den Text
    landet das Bild vor dem Absatz auf seiner Höhe. Die Unterschrift hat
    dieselbe Leiste und kann in eine eigene Zeile (data-sig fällt dann weg,
    sonst höbe placeFreeFigs sie wieder heraus).
  - Hinter dem Text: `z-index:-1` in einem isolierten Editor (sonst
    verschwand das Bild hinter dem Papier). Es bleibt auch ausgewählt
    hinten, wie in Word; Rahmen und acht Anfasser liegen auf einer eigenen
    Ebene über dem Text (`#hinterbox`), innerhalb des Rahmens verschiebt
    ein Zug das Bild auch über den Buchstaben. Gewählt wird es mit einem
    Klick neben die Schrift (`hinterBildAn`), auf einem Buchstaben bleibt
    der Klick beim Text. Word-Export setzt `behindDoc="1"`.
  - **Die Unterschrift kommt in eine eigene Zeile** an der Schreibstelle,
    linksbündig, 55 mm (Toms Wahl), statt frei vor dem Text. Frei legt man
    sie über Layout. Ohne `data-sig`, sonst höbe `placeFreeFigs` sie als
    Altbestand wieder heraus.
  - Das kleine Kreuz an der Unterschrift entfällt, Löschen über die Leiste
    oder Entf. Hilfe in allen sieben Sprachen angepasst.
  - Nicht nachgestellt: „Bild ersetzen“ mit echtem Dateidialog; die
    Bildunterschrift fällt beim Wechsel aus dem Text weg (frei liegende
    Bilder haben keine, wie in Word).

- **Schriftauswahl: nur Vorhandenes, alphabetisch, mehr Schriften.**
  - Angezeigt wird nur, was auf dem Rechner installiert ist (`schriftDa`,
    gemessen an der Breite eines Mustertextes; `document.fonts.check()`
    meldet lokale Schriften immer als vorhanden). Bisher standen Garamond und
    Book Antiqua auch auf PCs ohne Office in der Liste, geschrieben wurde in
    einer Ersatzschrift. Die Schrift des Dokuments erscheint immer, fehlt sie,
    mit „(nicht installiert)“.
  - Alphabetisch wie in Word statt nach Art gemischt (Toms Wunsch).
  - Neu, in jedem Windows enthalten: Candara, Comic Sans MS, Constantia,
    Corbel, Ink Free, Sitka Text; mit Office: Aptos, Century Gothic.
  - Linux: eine Schrift gilt als vorhanden, wenn ein freier Zwilling da ist
    (`SCHRIFT_DOPPEL`: Liberation, Carlito, Caladea, Comic Neue, URW Gothic,
    DejaVu, Open Sans …), und heißt weiter wie das Original, damit Word-
    Dateien dieselbe Schrift nennen. Ohne Zwilling bleibt sie ausgeblendet.
    Das .deb empfiehlt dafür zusätzlich `fonts-comic-neue` und
    `fonts-open-sans`.

- **PDF-Dialog:** Titel (vorausgefüllt mit dem Dokumentnamen, änderbar),
  Autor, unter „Weitere Angaben“ Betreff und Stichwörter. Lesezeichen aus
  Überschriften sind voreingestellt **aus**; bei schon exportierten
  Dokumenten einmalig zurückgesetzt, weil dort fast immer nur die alte
  Voreinstellung stand. Die Browserfassung zeigt nur den Titel: dort
  speichert der Druckdialog des Browsers, und der übernimmt nur `<title>`.
- **Autor kommt aus „Dein Name“** (Einstellungen → Allgemein, anfangs
  leer), wie Words Benutzername. Bisher füllten PDF und EPUB mit dem Namen
  vor, der zuletzt in irgendeinem Exportdialog stand, auch dem eines
  fremden Dokuments. Der alte Wert (`S.settings.author`) wird verworfen,
  nicht übernommen. Was im Dialog eingetragen wird, gilt nur für dieses
  Dokument.
  Die Liste steht unter Einstellungen → Autokorrektur → Ausnahmen, jedes
  Wort lässt sich einzeln entfernen. Sie liegt außerhalb von `S.settings`,
  „Werkszustand“ lässt sie also stehen wie das eigene Wörterbuch. Ein
  anderer Buchstabe nach der Rücktaste wird weiter groß, denn das ist ein
  Tippfehler, keine Rücknahme. Bewusst nicht in der Liste sind Kürzel, die
  oft als Wort am Satzende stehen („Jan.“, „Max.“, „No.“, „Inc.“).

### Nebenbei gefunden, noch nicht behoben

- **Portugiesisch gemischt**: Die Oberfläche ist überwiegend brasilianisch
  („Salvar tudo“, „você“, „arquivo“), einzelne ältere Einträge sind
  europäisch („ficheiro“, „guardado“, „definições“), etwa „Não foi possível
  criar o ficheiro EPUB.“, „Escolher ficheiro de cópia“, „Não guardado“.
  Einmal geschlossen durchsehen.

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
- **Italienisch kann Wortformen nicht zusammenfassen** (das Wörterbuch kennt
  sie nicht, siehe CLAUDE.md). Das Ladenbild zeigt darum den ausgegrauten
  Haken samt Hinweis — ehrlich, aber kein Werbebild.

### Offen, noch nicht entschieden


- **`Store-Texte-PartnerCenter.txt` ist nicht auf dem Stand des Eingetragenen.**
  Beim Ausfüllen am 2026-10-02 geändert, in der Datei nicht nachgezogen:
  (1) Suchbegriffe — `docx` und `odt` ersetzen je zwei schwache Begriffe;
  fremde Marken wie „Word" oder „OpenOffice" wurden bewusst **nicht**
  genommen, die sind in Suchbegriffen ein Ablehnungsgrund.
  (2) „Neuigkeiten" als Aufzählung statt Fließtext.

---

## 1.2.0 — 2026-10-12

Zweite Folgeversion im Store, am 2026-10-12 eingereicht und freigegeben.
Tag `v1.2.0` auf `bc406b5`, Pakete x64 und arm64 in einer Einreichung,
ohne schrittweisen Rollout, nur Windows 10/11 Desktop. „Neuigkeiten“ in
sieben Sprachen (`suvantra-site/store-einreichung/Neuigkeiten-1.2.0.txt`).
Am selben Tag live: Browser-Fassung unter /app/, Linux-Pakete 1.2.0 unter
/download/linux/, Produktseiten und „What’s new“ (suvantra-site c95c31c).
1.2.0, weil neue Funktionen dabei sind (Word-Kompatibilität, neue Dialoge,
Versionsverlauf bis einen Monat).

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
- **Tastenkürzel wie Word in der jeweiligen Sprache.** Bisher galten überall
  Strg+B/I/U (vom Browser geerbt), obwohl die Knöpfe seit 1.1.0 Words
  Buchstaben zeigen. Jetzt nach der Oberflächensprache (`KZ_SPRACHE`):
  - **Deutsch:** zusätzlich Strg+⇧+F / K / U.
  - **Französisch:** Fett zusätzlich auf Strg+G und Strg+⇧+G.
  - **Italienisch:** Fett zusätzlich auf Strg+G. Unterstrichen läge in Word
    auf Strg+S; das bleibt Speichern, weil die Quellen sich widersprechen und
    ein Speichern, das unterstreicht, der schlimmere Irrtum wäre.
  - **Spanisch (nur Desktop-Fassung):** wie Word — Fett Strg+N, Kursiv
    Strg+K, Unterstrichen Strg+S, Speichern Strg+G, Neu Strg+U, Öffnen
    Strg+A, Alles markieren Strg+E, Suchen Strg+B, Ersetzen Strg+L, Link
    Strg+Alt+K, links/zentriert/rechts/Blocksatz Strg+Q/T/D/J.
  - **Portugiesisch (nur Desktop-Fassung):** wie Word — Fett Strg+N, Kursiv
    Strg+I, Unterstrichen Strg+S, Speichern Strg+B, Neu Strg+O, Öffnen
    Strg+A, Alles markieren Strg+T, Suchen Strg+L, Ersetzen Strg+U, Link
    Strg+K, links/zentriert/rechts/Blocksatz Strg+Q/E/G/J.
  - Englisch, Polnisch: unverändert, Word nimmt dort Strg+B/I/U.
  - In der Browser-Fassung behalten es/pt die bisherige Belegung: der Browser
    gibt Strg+N und Strg+T nie an die Seite, Fett und Zentrieren bzw. Alles
    markieren gingen dort ins Leere. Die Hilfe sagt das.
  - Alte Wege bleiben Zweitweg, solange die Sprache die Taste nicht anders
    braucht (Strg+F sucht auch im Spanischen weiter).
  - Menüs, Befehlspalette, Tooltips und Hilfe zeigen die Tasten der Sprache.
    Die Hilfe nennt sprachabhängige Tasten über Platzhalter (`{kz:id}`), die
    aus derselben Tabelle kommen — sie kann keine Taste mehr nennen, die in
    der Sprache etwas anderes tut. `check-kuerzel.mjs` prüft jede Sprache
    gegen ihre eigene Belegung.
  - Recherche 2026-10-10: Microsofts Kürzelseiten je Sprache (selbst aus
    einer englischen Vorlage übersetzt und darum teils widersprüchlich), dazu
    Kursunterlagen und Foren je Sprache. Am unsichersten: Italienisch
    (Speichern) und Französisch (Strg+G gegen Strg+⇧+G, darum beide).
  - Geprüft: 106 Tastendrücke über sechs Sprachen und beide Fassungen, je mit
    der erwarteten Wirkung; echtes Formatieren in de/fr/es/pt/en; Strg+B in
    einem Eingabefeld formatiert den Editor nicht; check-kuerzel und
    check-hilfe-marken grün.
- **Einfügen fragt bei Bildern nach.** Fremder Inhalt (Webseite, E-Mail,
  Word) mit Text und Bildern öffnet vor dem Einsetzen die Frage „Bilder
  mitkopieren?“ mit der Zahl der Bilder: *Ohne Bilder einfügen*
  (vorausgewählt, Enter), *Mit Bildern einfügen*, *Abbrechen*. Ohne Bilder
  kommt der Text samt Überschriften, Listen und Hervorhebungen; leer
  gewordene Absätze fallen weg. Nicht gefragt wird bei Inhalt aus einem
  eigenen PureQuill-Dokument (dessen Bilder sind schon eingepasst, beim
  Umstellen von Absätzen wäre die Frage im Weg) und bei reinen Bildern
  (Bildschirmfotos). Die Leiste „Nur Text übernehmen“ danach bleibt.
- **Bilder in Kopf- und Fußzeile** (Logo, Siegel): Bildsymbol in der Leiste
  über der Zeile oder „Bild einfügen …“ im Dialog *Kopf- und Fußzeile*. Dort
  je Bild Seite (links/Mitte/rechts), Höhe (Seitenverhältnis bleibt, die
  Kante, an der es steht, auch) und Entfernen. Ein eigenes Bild steht zuerst
  rechts, 15 mm hoch, und schiebt den Text weg wie ein Bild im Word-Text.
  Gedruckt, als PDF und nach Word gespeichert an derselben Stelle.
- **Erste Seite anders** wie in Word (`w:titlePg`): Häkchen im Dialog
  *Kopf- und Fußzeile*, darunter eigene Zeilen für Seite 1 (`d.hdr1`/`d.ftr1`,
  `d.ersteAnders`; intern „hdr1“/„ftr1“, `hfFuerSeite()` wählt je Seite).
  Anfangs leer wie in Word; Abstände zum Rand gelten für beide. Gedacht für
  den Briefbogen mit Logo und Bankzeile nur auf Blatt 1 und das Deckblatt
  ohne Kopfzeile — beides kam aus Word-Dateien bisher falsch an: die Zeile
  der ersten Seite fehlte, oder (ohne Standardzeile) stand sie auf jeder Seite.
  - Seite 1 bekommt das **größere** der beiden Bänder: der Druck kann
    Seite 1 nur mehr Platz geben als den übrigen (thead/tfoot wiederholen
    sich gleich hoch). Bei einem Deckblatt ohne Kopf beginnt der Text auf
    Seite 1 darum am Band der Folgeseiten statt am Rand (gemessen 1,1 mm
    tiefer als in Word).
  - **Druck:** jede Seite bekommt ihre eigenen Zeilen (siehe „Seitenzahl im
    Druck“ unter Behoben), Seite 1 eben die der ersten Seite. Ein erster
    Weg — die fixierten Zeilen auf Seite 1 weiß zuzudecken — ist dadurch
    überholt. Was davon blieb: `@page` links und rechts auf 0, die
    Seitenränder tragen Rahmen und Druckzeilen selbst (ragte etwas im Fluss
    über die Druckfläche, verkleinerte Chromium die ganze Seite auf 86 %), und
    die 0,8-px-Linie an `.body` ist im Druck weg (sie schob den Rahmen
    0,3 mm unter die Kante der Druckfläche).
  - Export: `header2.xml`/`footer2.xml` mit `type="first"` plus
    `w:titlePg`; ist die Zeile der ersten Seite aus, keine Datei (Word lässt
    sie dann leer). Import liest `first` nur bei gesetztem `titlePg` und
    weicht für die Standardzeile dann nicht mehr auf `first` aus.
  - Der Fingerabdruck für „ungespeichert“ (`dokStand()`) nimmt die neuen
    Felder nur auf, wenn sie gesetzt sind — sonst gälte nach dem Update jede
    gespeicherte Datei als geändert.
  - Geprüft mit zwei weiteren Word-Dateien (Brief mit eigener erster Seite,
    Deckblatt ohne Kopf): Bilder auf Seite 1 im PDF ≤ 0,1 mm neben Words
    PDF, Seite 2 ohne sie; Folgezeile auf Seite 1 verdeckt (als Bild aus dem
    PDF geprüft, `pdf-foto.cjs`); Umlauf über Word identisch.
- **Dialog „Neues Dokument“ neu und kompakt** (Entwurf A, Tom 2026-10-12):
  oben nur Titel, Format und Schrift. Der **Titel** lässt sich gleich beim
  Anlegen eintippen (Schreibmarke steht im Feld, Enter legt an; leer bleibt
  es bei „Ohne Titel“ und der Benennung nach der ersten Zeile). Ein
  eingetippter Titel setzt `customTitle`, sonst ersetzte `flush()` ihn
  beim ersten Tippen durch die erste Textzeile — im Test aufgefallen. Das
  **Format** ist eine Klappliste (Name und Maße, die Beschreibungen wie
  „Standard für alles“ fielen auf Toms Wunsch weg), darunter „Eigene
  Formate“, ganz unten „Eigene Maße …“; Hoch- und Querformat als zwei
  Seitensymbole daneben. Ein eigenes Format löscht ein Papierkorb-Knopf
  neben der Liste. Zeilen- und Absatzabstand, Maßsystem, Ränder, Kopf-/
  Fußzeilenabstand und „Eigenes Format speichern“ (jetzt aus jedem Format,
  nicht nur aus eigenen Maßen) liegen unter **„Weitere Einstellungen“**,
  zugeklappt mit Kurzfassung „Ränder 25/25/20/25 mm · 1,15“. Bis 1.2
  standen sieben Formatkarten und alle Felder offen untereinander. „Seiten-
  format“ für ein bestehendes Dokument hat denselben Aufbau ohne Titel und
  Schrift. Die **Seitenvorschau** zeigt die Formate maßstäblich zueinander
  (bis 1.2 wurde jede Seite auf dieselbe Höhe gezogen, A4 und A5 sahen
  gleich aus), Textzeilen im Satzspiegel und beim Geschäftsbrief das
  Anschriftfeld nach DIN 5008. Geprüft: `werkzeuge/pruefen/neues-dokument.cjs`,
  `format-vorschau.cjs`.
- **Auf Werkszustand zurücksetzen** (Einstellungen › Allgemein, mit
  Rückfrage): Einstellungen und Ansicht zurück auf den Auslieferungsstand —
  Farbschema, Sprache, Schrift und Format neuer Dokumente, Autokorrektur,
  Zoom, Seitenleisten, Schreibziel. Dokumente, Notizen, Glossare, eigene
  Formate, das eigene Wörterbuch, verknüpfte Dateien und die automatische
  Sicherung bleiben; wer alles loswerden will, hat weiter „Alle Daten
  löschen“. Zurückgesetzt wird eine feste Liste (`WERK_ANSICHT`,
  `WERK_WEG`), nicht „alles außer den Daten“: in `S` stehen auch Merker
  gelaufener Umstellungen, die sonst ein zweites Mal über die Dokumente
  liefen. Der Auslieferungsstand steht dafür an einer Stelle
  (`standardEinstellungen()`), danach lädt das Programm neu und die
  Migrationen ergänzen den Rest wie beim ersten Start. Geprüft:
  `werkzeuge/pruefen/werkszustand.cjs` (eigene, flüchtige Sitzung).
- **Einstellungen mit Seitenleiste** wie im Optionsdialog von OpenOffice und
  Word, statt drei Reitern oben (Toms Wunsch: „Allgemein“ war zu lang). Fünf
  Bereiche mit Symbol: Allgemein (Sprache, Farbschema, Schreiben, Maßsystem,
  Abbildungsverzeichnis), **Neue Dokumente** (Schrift, Abstände, Seitenformat,
  Word-Standard — vorher in „Allgemein“), Autokorrektur, Speichern (die drei
  Speicherorte) und **Zwischenstände** (vorher oben in „Speichern“, das
  sonst nicht ohne Rollen passte). „Auf Werkszustand zurücksetzen …“ steht
  unten links in der Knopfleiste wie OpenOffices „Zurücksetzen“. Die
  Inhaltsfläche ist für alle Bereiche gleich hoch (580 px, im kleinen
  Fenster weniger, dann rollt nur sie), der Dialog springt beim Wechsel
  nicht; gemessen mit `dialog-reiter.cjs`. Unter 640 px Breite liegt die
  Leiste waagerecht über dem Inhalt. Die Hilfe nennt weiter „Einstellungen ›
  Allgemein/Speichern/Autokorrektur“ — das stimmt, weil Maßsystem und
  Abbildungsverzeichnis in „Allgemein“ und die Speicherkarten in „Speichern“
  geblieben sind.
  - **Texte klarer** (Toms Durchsicht): „Programm“ statt „Benutzeroberfläche“;
    „Zeile beim Schreiben · in der Fenstermitte halten“ statt „Schreib-
    maschinen-Scrollen“; „Leisten beim Schreiben · abblenden, solange du
    tippst“ statt „tritt zurück“; Abschnitt „Bearbeiten“ mit „Maßeinheit“
    (Millimeter/Zoll) und „im Menü Einfügen anbieten“. „Neue Dokumente“ sagt
    oben, dass es nur für künftig angelegte Dokumente gilt; „1,15 · Standard“
    in der Liste; **„Standardwerte wiederherstellen“** statt „Auf Word-Standard
    zurücksetzen“, darunter, was das setzt (Calibri 11 · Zeilenabstand 1,15 ·
    DIN A4). Autokorrektur mit Beispielen (`--` → –, „1. “ → Liste); der
    Hinweis zu den Anführungszeichen nannte die „oben gewählte“ Sprache, die
    jetzt auf einer anderen Seite steht. Zwischenstände erklären, was sie
    sind, und haben einen Knopf „Versionsverlauf öffnen…“. Alle neuen Texte
    in sieben Sprachen.
  - **Neue Dokumente**: Erklärungssatz in Toms Wortlaut („Voreinstellungen für
    neue Dokumente, die du ab jetzt anlegst. Das Format bestehender Dokumente
    bleibt bestehen.“).
  - **Speichern mit Ampel**: jede der drei Karten zeigt rechts ihren Zustand —
    grün „aktiv“, gelb „Zugriff nötig“ (eingerichtet, Zugriff nach dem
    Neustart verloren), grau „aus“ oder „nicht verfügbar“. Bewusst kein Rot
    für „aus“: Nummer 2 und 3 sind freiwillig. In der App heißt Karte 1
    „Arbeitsstand im Programmspeicher“.
  - **Speichern einfacher** (Toms Durchsicht, Zielgruppe: Schreibende, keine
    Technikprofis): nur noch zwei Karten — „Programmspeicher“ (Browser:
    „Browserspeicher“) und „Automatische Sicherung von allem“, je mit einer
    Umfang-Zeile („Alles: 3 Dok. · …“, „Alles: Dokumente, Notizen, Glossare,
    Einstellungen · .pqw“). Die Karte für die Verknüpfung einzelner Dokumente
    mit einer .pqw ist raus: ein Sonderfall für Fortgeschrittene, der neben
    der Sicherung von allem und „Speichern als → Word“ mehr erklärt als
    hilft (ein Zwischenentwurf listete alle Reiter mit Zustand — zu
    kompliziert). Die Verknüpfung bleibt im Menü Datei › Sicherung, dort jetzt
    auch „Verbinden“ (bei abgelaufenem Zugriff) und „Verbindung lösen“.
    **Am Reiter** trägt ein verknüpftes Dokument ein kleines Dateisymbol mit
    Tooltip („Wird auch in Roman.pqw gespeichert“); ist der Zugriff
    abgelaufen, ist es gelb und verbindet per Klick neu. Der stille
    Zugriffscheck beim Öffnen der Einstellungen läuft für alle verknüpften
    Dokumente. Text, Umfang und Knöpfe beginnen bündig unter dem Titel
    (vorher drei verschiedene Linien), Text der Sicherung in Toms Wortlaut,
    der Cloud-Hinweis kein eigener Kasten mehr. Fläche der Einstellungen
    580 px. Hilfe: „an drei Orten, in den Einstellungen durchnummeriert“ und
    die Überschrift „Datei auf der Festplatte ist ausgegraut“ (jetzt „‚Mit
    Datei verknüpfen‘ fehlt im Menü“) in allen Sprachen angepasst.
  - **Zwischenstände übersichtlicher**: erst die Erklärung, dann die Felder.
    „Automatisch anlegen“ ist ein Feld mit „Aus“ als erstem Eintrag statt
    eines unbeschrifteten Hakens neben der Liste; „Aufbewahren: eine Woche“
    statt „Wie weit zurück: einen Monat“, der Hinweis zur Ausdünnung in
    einfacheren Worten. Ein Kasten zum aktiven Dokument zeigt Zahl und Alter
    seiner Zwischenstände („4 Zwischenstände · ältester: 09.10.2026, 14:04“)
    mit den Knöpfen „Zwischenstand anlegen“ und „Versionsverlauf öffnen…“.
  - **Was beim Schließen passiert** (Toms Frage): ein geschlossener Reiter
    ist nicht mehr im Programmspeicher — und mit ihm seine Zwischenstände.
    Das stand nirgends. Jetzt bei den Zwischenständen: sie gibt es nur in
    PureQuill, eine Word-Datei enthält sie nicht, eine .pqw schon, beim
    Schließen sind sie im Programm weg. Beim Programmspeicher: „Wenn du ein
    Dokument schließt, ist es hier weg. Speichere es vorher …“; bei der
    Sicherung: nur offene Dokumente, samt Zwischenständen.
  - **Manuelle Sicherung als eigene Karte** (Toms Vorschlag): „Alles
    sichern“ und „Sicherung laden“ standen unter dem Programmspeicher, als
    gehörten sie zu ihm — sie schreiben und lesen aber eine .pqw wie die
    automatische Sicherung. Jetzt Karte 3 „Manuelle Sicherung · einmalig als
    Datei“, ohne Ampel (eine Handlung, kein Zustand); beim Programmspeicher
    bleibt nur „Alle Daten löschen“. Einleitung: „Sichern kannst du sie
    zusätzlich automatisch oder von Hand.“ Für eine ruhigere Fläche trägt nur
    noch Karte 1 eine Umfang-Zeile (mit echten Zahlen), die Sätze der
    automatischen Sicherung sind ein Absatz, Knöpfe einheitlich 13 px.
    Fläche der Einstellungen 620 px: auch mit eingerichteter Sicherung passt
    alles ohne Rollen.
  - Portugiesisch: die heute neuen Texte im brasilianischen Portugiesisch der
    übrigen Oberfläche („salvar“, „você“, „arquivo“); sie waren zuerst
    europäisch geschrieben.

- **Versionsverlauf reicht bis zu einem Monat zurück** (Einstellungen ›
  Zwischenstände › „Wie weit zurück“: eine Stunde, einen Tag, eine Woche —
  Standard —, einen Monat). Bis 1.2 behielt jedes Dokument fest die
  **letzten 12** Zwischenstände, bei 30 s Abstand also gut sechs Minuten
  Arbeit — was gestern war, ließ sich nicht zurückholen. Jetzt wird
  ausgedünnt wie bei Time Machine (`histAusduennen()`): die fünf neuesten
  bleiben, ältere nur einer je Altersstufe (10/30 min, 1/2/4/8 h, 1/2/3/5 d,
  1/2/3 Wochen, 1 Monat), höchstens 19 statt 12 — der Speicher wächst also
  kaum. Im Zeitraffer gemessen (35 Tage, alle 10 Minuten ein Stand):
  Spanne Woche 13–14 Stände bis 6 Tage zurück, Monat 15–17 bis 19 Tage
  (der älteste fällt beim Überschreiten der Spanne weg, dann rückt der
  nächste nach). Läuft der Speicher voll, opfert `commit()` die ältesten
  Zwischenstände über alle Dokumente, nie den neuesten und nie den Text.
  Dazu Abstände „alle 10 Minuten“ und „alle 15 Minuten“. Die Hilfe sagte
  „die letzten zwölf“ — in allen sieben Sprachen berichtigt. Geprüft:
  `werkzeuge/pruefen/zwischenstaende.cjs`.

### Behoben

- **Verknüpfte Datei blieb beim schnellen Reiterwechsel zurück.** Das
  Mitschreiben in die .pqw lief über einen einzigen Zeitgeber für alle
  Dokumente: wer in Reiter A tippte und binnen einer Sekunde in Reiter B
  weiterschrieb, löschte den ausstehenden Schreibvorgang von A — die Datei
  von A hatte bis zum nächsten Tippen in A einen Stand zu wenig (im
  Programmspeicher war alles da). Jetzt ein Zeitgeber je Dokument
  (`fileTimers`); geprüft mit gestubbtem Dateizugriff, beide Dateien werden
  geschrieben (`werkzeuge/pruefen/mehrere-dateien.cjs`).

- **Eingefügte Bilder mitten im Text sprengten den Absatz.** Ein Bild aus
  einer Webseite, das im Fließtext stand, kam als Inline-Bild in voller
  Breite: die Zeile wurde so hoch wie das Bild, Umbrüche und Seiten
  verschoben sich — bei Fernbildern ein zweites Mal, sobald die Datei
  eintraf. Es wird jetzt ein eigener Bildblock hinter seinem Absatz, wie
  jedes Dokumentbild verschieb- und skalierbar. Ausnahmen: Symbole und
  Emoji bis 48 px bleiben in der Zeile, Bilder in Listen und Tabellen
  bleiben in ihrem Eintrag.
- **Ein Bild am Anfang des Eingefügten landete im Absatz der Schreibmarke.**
  Chrome verschmilzt den ersten eingefügten Block mit dem Absatz, in dem
  der Cursor steht; war das ein Bildblock, verlor er seine Hülle. Eingefügte
  Bildblöcke tragen jetzt eine Marke, `pasteBildReparatur()` stellt sie nach
  dem Einsetzen wieder her. Gilt auch für Inhalt aus dem eigenen Dokument.
- **Eingefügter Text behielt Größe, Farbe und Abstände der Quelle.** Chrome
  schreibt beim Einsetzen die gerade gültige Größe fest dazu
  (`font-size:14.6667px` bei Calibri 11) und gibt dem ersten Block, den es
  mit dem Absatz der Schreibmarke verschmilzt, Größe, Farbe und Abstände
  des Originals als Inline-Stil mit. Nach einer Änderung der Dokumentgröße
  blieb solcher Text in der alten Größe. Bei fremdem Inhalt gilt jetzt auch
  für das, was Chrome dazuschreibt, dieselbe Liste wie für die Quelle
  (Fett, Kursiv, Unterstrichen, Ausrichtung); bei eigenem Inhalt fällt nur
  eine Größe weg, die der Dokumentgröße entspricht.
- **Bilder in Kachel-Layouts blieben in voller Breite in der Zeile.**
  Nachrichten-, Rezept- und Blogseiten setzen Bild und Überschrift in einen
  Link ohne umgebenden Absatz; gemessen an Chefkoch standen 137 Bilder mit
  605 px im Text. Sie werden jetzt ein Bildblock vor ihrem Link.
- **Leere Absätze aus der Quelle und vom Einsetzen** (Wikipedia: 14 je
  Artikel, GitHub: 4 um Bildblöcke) hielten unsichtbar ihren Abstand. Neu
  eingefügte leere Absätze ohne `<br>` fallen weg; bewusste Leerzeilen und
  alles, was schon im Dokument stand, bleiben.
- **Bildblock ohne Bild** (Wikipedia-Video: das Video wird gefiltert, die
  Unterschrift blieb in einem leeren Bildblock): die Unterschrift wird ein
  Absatz.
- **Newsletter-Mails sprangen auf Seite 2 und ergaben eine beschädigte
  Word-Datei.** Gemeldet an einer Mailchimp-Mail: HTML-Mails bauen ihr
  Layout aus Tabellen, drei Ebenen tief, jede einspaltig. Fast die ganze
  Mail stand dadurch in einer Tabellenzeile, die sich nicht teilen lässt —
  sie sprang als Ganzes auf Seite 2, Seite 1 blieb leer. Und wo ein Bild
  aus einer Zelle gefiltert war, blieb eine Zeile ohne Zelle; Word verlangt
  mindestens eine und meldet die Datei als beschädigt.
  `pasteLayoutTabellen()` löst beim Einfügen Layout-Tabellen auf
  (`role="presentation"`, einspaltig oder selbst Tabellen enthaltend), ihr
  Inhalt wird zu Absätzen. Echte Datentabellen mit mehreren Spalten
  bleiben. Zusätzlich lässt der Word-Export Zeilen ohne Zelle und leere
  Tabellen weg, auch für Dokumente, die schon so gespeichert sind.
  Nachgeprüft vom Nutzer mit der echten Mail in der Desktop-Fassung aus dem
  Projektordner (2026-10-11): „jetzt ist es viel besser“.
- **Geprüft mit echtem Kopieren und Einfügen** über die Windows-
  Zwischenablage (Electron, `webContents.copy()`/`paste()`) an zehn Seiten:
  Wikipedia de und en, MDN, GitHub, Tagesschau, BBC, NASA, Chefkoch,
  Mozilla-Blog, Spiegel — je mit und ohne Bilder. Neun ohne Befund: nichts
  über den Rand, kein großes Bild in der Zeile, keine festen
  Schriftgrößen, keine leeren Absätze, Text davor und danach unversehrt,
  keine Programmfehler. Spiegel greift selbst ins Kopieren ein und lieferte
  wechselnde Inhalte; den tatsächlich kopierten Inhalt direkt eingefügt:
  voller Text, Rückfrage erscheint. Layout-Tabellen an einem
  Mailchimp-Nachbau (7 Tabellen → 0, zwei Seiten statt leerer erster) und
  an den neun Seiten (Wikipedia behält seine 6 Tabellen, echte Datentabelle
  bleibt), jedes Ergebnis nach Word exportiert: wohlgeformt, keine Zeile
  ohne Zelle. Dazu im headless Chrome: Enter = ohne Bilder, Abbrechen,
  keine Frage bei eigenem Inhalt und reinem Bild, Smiley bleibt in der
  Zeile, Leerzeile anderswo bleibt, nach Wechsel auf 16 pt folgt der Text,
  Knöpfe in allen sieben Sprachen in einer Zeile. `check-export.mjs`
  252/252.
  **Nicht geprüft:** Einfügen aus Word. In der Browser-Fassung lassen viele
  Seiten das Einbetten ihrer Bilder nicht zu (Tagesschau 76 von 76); die
  bleiben Verweise ins Netz — wie schon vorher.
- **Ausgefüllte Word-Formulare verloren beim Öffnen alle Antworten** — ohne
  Meldung, seit 1.0.0. Gemeldet an einem Formular des Goethe-Instituts (PEP-
  Dokumentation). Der Word-Leser kannte nur Absätze, Tabellen, Textläufe und
  Links; alles in einem Formularfeld (`w:sdt`, Inhaltssteuerelement) fiel
  samt Inhalt weg, ebenso nachverfolgt eingefügter Text (`w:ins`), Smart
  Tags und einfache Felder. Gelesen wird jetzt durch diese Hüllen hindurch,
  auf Absatz-, Block-, Zeilen- und Zellebene (`docxBloecke()`,
  `DOCX_HUELLE_LAUF`). Draußen bleiben gelöschter Text (`w:del`) und der
  graue Hinweis leerer Felder („Klicken oder tippen Sie hier …“,
  `showingPlcHdr`). Geprüft am echten Formular, mit Antworten ausgefüllt:
  alle vier Antworten und der nachverfolgte Text kommen an und gehen beim
  Speichern als Word wieder hinaus; gelöschter Text nicht.
- **Formatierung aus Word-Dateien** (am selben Formular):
  - **Schriftfarbe und GROSSBUCHSTABEN** (`w:color`, `w:caps`) wurden nicht
    gelesen — die dunkelblauen Versal-Überschriften kamen schwarz und klein
    an. Jetzt als Inline-Stil, und der Export schreibt beides zurück.
  - **Schriftgröße je Textstelle**: nur die Grundgröße wurde übernommen,
    Überschriften (11 pt) und Feldnamen (10 pt) standen in 9 pt wie der
    Text. Jetzt relativ in em zur Dokumentgröße (geht mit Zoom und mit einer
    späteren Änderung der Dokumentgröße mit); der Export schreibt `w:sz`.
  - **Tabellen ohne Rahmen** bekamen welche — Formulare ordnen ihre Felder
    in rahmenlosen Tabellen. Erkannt über `tblBorders`, Zellrahmen und die
    Tabellenvorlage samt `basedOn`; ohne Angabe gilt Words „Normale Tabelle“
    (ohne Rahmen). Im Editor zeigen feine gestrichelte Hilfslinien die
    Zellen (wie Words „Rasterlinien anzeigen“), in Vorschau, Druck,
    Leseansicht, HTML/EPUB ohne; der Export schreibt `nil`.
  - **Absätze in Tabellenzellen** wurden mit Zeilenumbrüchen zu einem
    zusammengezogen und verloren ihren Abstand; jetzt bleiben sie Absätze.
    Verschachtelte Tabellen in Zellen kamen gar nicht an; jetzt schon.
  - **Einzüge** (links, Erstzeile, hängend) wurden nicht gelesen — und der
    Word-Export schrieb Einzüge, die man im Editor gesetzt hatte, ebenfalls
    nicht. Beides behoben (margin-left/text-indent in em ↔ `w:ind`).
  - **Nummerierung zählte nach einer Unterbrechung neu** — die fünf
    Abschnitte des Formulars hießen alle „1.“, weil Aufzählungspunkte
    dazwischenstehen. Word zählt je Liste (`numId`) weiter; der Leser jetzt
    auch, als `<ol start="…">`, und liest `w:start`/`startOverride`.
    Umgekehrt im Export: alle nummerierten Listen eines Stils teilten sich
    eine Word-Liste, Word zählte über das ganze Dokument weiter (zwei
    getrennte Listen 1–3 wurden 1–3 und 4–6). Jetzt bekommt jede ihre
    eigene `w:num` mit ihrer Startnummer.
  - Nebenbei: `w:rPr` in Schemareihenfolge (rStyle stand am Ende).
  - Geprüft über den echten Weg (Datei öffnen → Editor → Speichern als Word
    → wieder öffnen → wieder speichern): zweiter und dritter Export
    zeichengleich; 11 Stellen farbig und versal, Größen 1,222/1,111 em,
    erste Tabelle ohne Rahmen mit 4 Absätzen, Einzüge als Erstzeileneinzug,
    Abschnitte 1–5. Getrennte Listen und `start="7"` überleben den Umlauf.
    `check-export.mjs` 252/252.
  **Nicht behoben:** die beiden Logos der Kopfzeile. Kopf- und Fußzeilen
  sind in PureQuill reiner Text; die Kopfzeile fällt beim Einlesen ganz weg.
  Eigener, größerer Schritt.

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
- **Vorschläge übersahen einen fehlenden Apostroph:** für „doesnt“ kamen
  „doesant“, „doesent“ …, nie „doesn’t“ — beim fehlenden Zeichen probierte
  `suggest()` nur Buchstaben. Jetzt wird der Apostroph an jeder Stelle
  versucht, gewogen wie ein Dreher, also vorn in der Liste. Angenommen wird
  nur, was als ganzes Wort im Wörterbuch steht (`checkOne()`), sonst machte
  die Teile-Regel von `check()` aus „cant“ ein „c'ant“. Der Vorschlag kommt
  im Apostroph, den die Autokorrektur setzen würde: typografisch, wenn
  *Anführungszeichen* an ist, sonst gerade. Gemessen: doesnt, dont, isnt,
  wouldnt, Im, thats → jeweils die Kurzform an erster Stelle, its → „Its,
  it's“, cant → „Cant, can't“; teh, recieve unverändert.
  **Elisionen in Französisch und Italienisch:** Diese Wörterbücher führen
  „j'“, „qu'“, „dell'“ … als eigene Einträge, „j'ai“ steht nirgends am
  Stück. Ein Vorschlag gilt darum auch, wenn der Kopf samt Apostroph ein
  solcher Eintrag ist und der Rest ein Wort, das mit Vokal oder h beginnt
  (sonst machte italienisch „po'“ aus „pomo“ ein „po'mo“). Englisch,
  Deutsch, Spanisch, Portugiesisch und Polnisch haben keine solchen
  Einträge, dort greift es nie. Gemessen: jai, quil, daccord, mappelle,
  lorsquil, quelquun, aujourdhui → Elision auf Platz 1; cest, nest, sest,
  lheure, lhomme, lami, jaime auf Platz 2 (hinter einem echten Wort);
  italienisch lanno, cè, lamico, unaltra, cosè, lultimo auf Platz 1,
  dovè auf 2. Gewöhnliche Tippfehler (maisn, beacoup, grazei, casaa,
  Hauser, obrigdo, ksiazka) unverändert. Im Prüfdialog in en/fr/it und
  mit beiden Einstellungen der Anführungszeichen geprüft.
- **Druckvorschau zeigte das Blatt in den Farben des Schemas** — auf Enzian
  dunkelblau mit heller Schrift, auf Tinte, Zyan, Bernstein und Phosphor
  ebenso dunkel, auf Morgensonne, Salbei & Co. getönt. Gedruckt wird aber
  immer schwarz auf Weiß. Das Blatt der Vorschau trägt jetzt dieselben
  Druckfarben wie `@media print` (`.pvinner .paper`); Leiste und Umgebung
  behalten das Schema. Gemessen über alle 17 Schemata: Blatt weiß, Text
  schwarz, Zitatrahmen und Seitenzahl in Druckfarbe. Bestand seit 1.0.0.
- **Druckvorschau zeigte leere Blätter** — der Text fehlte ganz, nur Kopf-
  und Fußzeile und Seitenzahl waren zu sehen. Die Vorschau klont #paper und
  nimmt dem Klon die IDs; damit verlor der Text jede `#editor`-Regel,
  darunter `position:relative;z-index:1`, und die Seitenflächen lagen über
  ihm. Auch Schriftgröße, Zeilen- und Absatzabstand, Überschriften und
  Tabellen fehlten. Der Klon trägt jetzt `.pvedit`, die Regeln für Satz und
  Aussehen gelten für `:is(#editor,.pvedit)`; die fürs Bearbeiten
  (Suchtreffer, Rechtschreibung, Auswahl) bleiben am Editor. Der
  Seitenumbruch zeigt in der Vorschau keine Strichlinie mehr. Gemessen an
  einem Dokument über vier Seiten (Überschriften, Liste, Zitat, Tabelle,
  40 Absätze, Seitenumbruch): alle 49 Blöcke stehen in der Vorschau auf
  0 px genau wie im Editor; `check-export.mjs` 252/252. Bestand seit 1.0.0.
- **Schließen-Kreuz im Reiter rückte bei kurzen Titeln zur Mitte.** Ein
  Reiter ist mindestens 88 px breit; bei „test“ blieb rechts Platz, und das
  Kreuz stand direkt hinter dem Titel. Jetzt `margin-left:auto`: gemessen
  an fünf Reitern (1 bis 37 Zeichen) steht es überall 13 px vom rechten Rand.
- **Logos und Bilder in Kopf- und Fußzeile fielen beim Öffnen einer
  Word-Datei weg** — seit 1.0.0. `docxHf()` las nur den Text der Absätze
  direkt unter `w:hdr`; Bilder, aber auch Text in Tabellen (der übliche
  Briefkopf: Logo links, Anschrift rechts) gingen verloren. Jetzt:
  - Bilder im Text (`wp:inline`), frei verankerte (`wp:anchor`, Bezug Blatt,
    Rand, Satzspiegel oder Absatz, Versatz oder Ausrichtung) und VML aus
    älteren Dateien, je über die eigene Beziehungsdatei der Teildatei
    (`word/_rels/header2.xml.rels`).
  - Lage **wie in Word, in Millimetern** (Toms Entscheidung gegen das
    einfachere „Seite links/Mitte/rechts“): gespeichert ab linkem Seitenrand
    und ab der Linie der Zeile nach innen, damit sie mitwandern, wenn man den
    Abstand zum Blatt verstellt. Bilder im Text schieben den Textkörper weg,
    verankerte nicht — wie in Word.
  - Text aus Tabellenzellen; steht er in einer Zelle, bekommt er deren
    Spalte (`tx`/`tw`), steht er unter einem Bild, dessen Versatz (`ty`).
  - Ohne `w:jc` steht ein Absatz links, wie in Word. Der Leser nahm bisher
    „Mitte“ an — linksbündige Kopfzeilen kamen zentriert an.
  - **Druck:** ragt ein Bild über die Zeile zur Blattkante hinaus (Logo bei
    8 mm, Kopfzeile bei 12,5 mm), druckte Chromium es ein zweites Mal auf
    die Gegenseite — unten auf Seite 1, oben auf Seite 2. Die fixierte
    Druckzeile beginnt jetzt am äußersten Bild (`hfUeberstand()`, `@page`-Rand
    entsprechend kleiner), nichts steht mehr über ihre Kante.
  - **Export:** Bilder gehen als verankerte Grafik mit Blattbezug hinaus
    (eigene `header1.xml.rels`, `word/media/`), andere Formate als PNG/JPEG
    werden PNG. Weil Word ein verankertes Bild den Text nicht wegschieben
    lässt, bekommt die Zeile so viel Abstand nach dem letzten (Kopf) bzw.
    vor dem ersten Absatz (Fuß), dass sie so hoch wird wie ein Bild „im
    Text“ — nicht der Seitenrand, der gälte für alle Seiten, auch wenn das
    Bild nur auf Seite 1 steht. Solche Bilder heißen in der Datei
    `PureQuill im Text …` (`HF_FLUSS_NAME`), daran erkennt der Import sie
    wieder; der Umlauf ist damit verlustfrei.
    Ohne Bilder ist die Kopfzeilendatei Zeichen für Zeichen wie vorher.
    `bildGrafikXml()`/`bildAnkerXml()` sind aus `figurXml()` herausgelöst
    und werden von beiden benutzt.
  - Geprüft mit fünf Dateien, die das echte Word gebaut hat
    (`werkzeuge/pruefen/hf-bilder-testdateien.ps1`: schwebend rechts,
    Tabelle mit Logo links, im Text zentriert, Fußzeile mit Siegel, nur
    Logo): Lage im PDF von PureQuill gegen Words eigenes PDF höchstens 0,3 mm
    daneben (`pdf-bilder.cjs`). Die von PureQuill gespeicherten Dateien
    öffnet Word ohne Rückfrage, die Bilder stehen dort auf 0,1 mm wie im
    Original (`word-pdf.ps1`). Bedienung (Seite, Höhe, Einfügen, Entfernen)
    über `hf-bilder-bedienung.cjs`; `check-export.mjs` 252/252.
  - Bekannte Grenze: EMF/WMF-Logos (alte Vorlagen) kann Chromium nicht
    zeigen, sie fallen weiter weg — wie im Fließtext.

- **Seitenzahl im Druck stand auf jeder Seite auf „0“** — im PDF und auf
  Papier „Seite 0 von 6“, seit 1.0 (am Bildschirm richtig; mit dem alten
  Stand nachgemessen). `.pageno::after{content:counter(page)}` zählt in
  Chromium nur in den Randfeldern von `@page`, die erst Chromium 131 kann
  (die App: Electron 33 = 130), und die Druckzeilen waren fixierte Elemente,
  die auf jeder Seite gleich sind. Jetzt (`hfDruckSeiten()`):
  - Kopf- und Fußzeile **je Seite**, alle an einem Anker am Anfang des
    Druckrahmens, per `transform` auf ihre Seite geschoben. Gemessen:
    Chromium legt die Seiten des Flusses lückenlos übereinander, Seite p
    beginnt bei p × Höhe der Druckfläche, **aufgerundet auf ganze CSS-Pixel**
    (ohne Rundung wanderte die Zeile 0,14 mm je Seite). Ein transform ändert
    nur das Malen, nicht den Umbruch — gilt auch mitten in einer langen
    Tabelle. 25 Seiten nachgemessen: Logo überall auf derselben Höhe.
  - **Der Druck bricht dort um, wo die Ansicht umbricht** (`druckWieSchirm()`,
    break-before am ersten Block jeder Seite, `seitenAnfaenge` aus
    `paginate()`). Vorher teilte der Druck Absätze zeilenweise, wo die
    Ansicht sie ganz weiterschiebt: im Druck drei Absätze mehr auf Seite 2,
    danach jede Seite verschoben, Gesamtzahl falsch. Die Blockhöhen sind in
    beiden Medien gleich (nachgemessen), also passt der Druck immer.
  - **Gesamtzahl:** „von y“ kommt aus der Ansicht. Wo ein Block länger als
    eine Seite ist, bricht der Druck anders; die Desktop-Fassung zählt nach
    dem ersten `printToPDF` die Seiten, baut mit der echten Zahl neu
    (`hfDruckGesamt()`) und druckt noch einmal (`desktop/main.js`). Der
    Browserdruck kann das nicht — dort kann in diesem Fall die letzte Seite
    ohne Zeile bleiben und y um eins daneben liegen.
  - Keine Reserve-Zeilen hinter dem Text: eine Zeile für eine Seite, die es
    nicht gibt, legte Chromium als leere Seite an („Seite 7 von 6“).
  - Die fixierten `#printhdr`/`#printftr` bleiben nur als Rückfall für einen
    Druck am Rahmen vorbei (Browsermenü), mit dem alten Zähler.
  - `check-export.mjs` prüft jetzt Seitenzahl je Seite und **gleich viele**
    Seiten wie am Bildschirm (vorher nur „mindestens“) — 264/264. Dabei
    behoben: das Skript nahm ohne `--chrome` das erste Argument als Pfad zu
    Chrome, `--keep` und `--nur` liefen deshalb nie.

- **Word-Dateien verloren beim Öffnen und Speichern alles, was PureQuill
  nicht kennt** — seit 1.0. Gemessen an zwölf Dateien, die das echte Word
  gebaut hat (`werkzeuge/pruefen/word-merkmale.ps1 bauen`), gezählt von Word
  selbst vor und nach dem Umlauf (`… zaehlen`, `merkmale-vergleich.cjs`):
  formatierte Kopfzeile, Textfeld, Kommentare, Endnoten, Formel, Diagramm,
  zwei Spalten, Kopfzeile für gerade Seiten, Querformat-Abschnitt,
  Tabulatoren, EMF-Bild, nachverfolgte Änderungen — jede Datei verlor ihr
  Merkmal. Jetzt in allen zwölf **gleich**, Word öffnet jede ohne Reparatur:
  - **Bewahren** (`wRohHtml`, `wPaketBewahren`, `wPaketSchreiben`): was
    nicht darstellbar ist, bleibt als fester Platzhalter im Text (`span.wroh`,
    nicht bearbeitbar, als Ganzes löschbar) mit dem Original-XML in
    `d.word.roh`, samt allen Teilen des Pakets, an denen es hängt (rekursiv
    über die Beziehungsdateien: Diagrammdaten, eingebettete Tabellen, Bilder,
    `comments.xml`, `people.xml`, `endnotes.xml`; `d.word.teile`). Verweise
    heißen `W_…` (bleibt bei weiteren Umläufen stabil), Namensräume und
    `mc:Ignorable` des Originals kommen an die Wurzel, Inhaltstypen aus dem
    Original. Bewahrte Teile, die wie eigene heißen, bekommen `w-` davor.
  - Platzhalter: Diagramm/Formel/Textfeld/Form/Objekt/Bild als gestricheltes
    Kästchen mit Art und Text, im Text stehende in Originalgröße (sonst
    brächen die Seiten anders um); Kommentar als 💬 mit Text im Tooltip;
    Endnote als Kästchen; Lesezeichen und Kommentarbereiche unsichtbar.
  - **Nachverfolgte Änderungen** werden nicht mehr stillschweigend
    angenommen: Eingefügtes bleibt bearbeitbar und unterstrichen
    (`ins.wins`, geht als `w:ins` zurück), Gelöschtes rot durchgestrichen.
  - Abschnittswechsel und Tabstopps hängen am Absatz (`data-wsect`,
    `data-wtabs`), Spalten, gerade Kopfzeilen, Seitennummerierung, Raster aus
    dem letzten `sectPr` (`d.word.sect`), dazu Einstellungen aus
    `settings.xml` (gerade/ungerade, Silbentrennung, Standard-Tabstopp …).
  - **Kopf-/Fußzeile im Original**, solange man sie nicht ändert (`wHfRoh`,
    Vergleich über einen Fingerabdruck des Modells) — mit Fett, Farbe, Größe
    und Tabstopps, die das Modell nicht kennt.
  - **Tabulatoren** sind echte Tabs (`span.wtab`, Abstand wie Words
    Standard-Tabstopps alle 1,25 cm), keine Leerzeichen mehr.
  - Nebenbei: ein leerer Absatz ging als Absatz mit Zeilenumbruch nach Word
    (`<p><br></p>` → `w:br`) und war dort doppelt so hoch — das abschließende
    `<br>` eines Blocks fällt jetzt weg, wie es auch in HTML keine Zeile ist.
  - Fixpunkt: zweites und drittes Speichern Teil für Teil gleich, in allen
    zwölf Fällen (`word-bewahren-pruefen.cjs`).

- **Formatierung und Tabulatoren in Kopf- und Fußzeile** — bis 1.2 nur
  reiner Text in einer Schrift; aus Word kamen Fett, Farbe, Größe nicht mit,
  Tabs fielen ganz weg („FirmaMitteRechts“). Jetzt trägt die Zeile neben
  `text` ein optionales `html` (nur b/i/u/s, span mit Farbe und Größe in em
  zur Zeilenschrift, `<br>` als Zeilenwechsel; `hfSaeubern()`). Reine
  Textzeilen bleiben Zeichen für Zeichen wie bisher.
  - Anzeige über `hfInhalt()` an allen Stellen (Seite, Messung, Druck).
    Tabulatoren wie Words Vorlage „Kopfzeile“: erster zur Mitte, zweiter an
    den rechten Rand (`hfTabZeilen()`, Raster links | Mitte | rechts;
    geteilt mit Range.cloneContents, damit angeschnittene Auszeichnung
    stimmt).
  - Bearbeiten auf der Seite mit Formatierung; Strg+B/I/U usw. wirken im
    Eingabefeld (geprüft mit echtem Tastendruck). Im Dialog bleibt das
    Textfeld reiner Text — ein Hinweis sagt, dass eine Änderung dort die
    Formatierung aufhebt.
  - Import: direkte Auszeichnung der Läufe (`docxHfAbsatz(p,html)`), Größe
    relativ zur Grundgröße, die der Export schreibt (Dokumentgröße × 0,85).
    Export: Läufe aus dem HTML (`hfHtmlLaeufe()`), Tabs als `w:tab`, dazu
    Tabstopps Mitte/rechts im Absatz, damit Word die Zeile genauso setzt.
  - Geprüft: Kopfzeile „Firma (fett, rot, 14 pt) ⇥ Mitte ⇥ Rechts“ aus
    Word, in PureQuill geändert und gespeichert — Word findet Fett, Farbe
    und Tabs wieder; unverändert geht weiter das Original zurück.

- **Endnoten** wie in Word: *Werkzeuge › Endnote einfügen*, Marke im Text
  (`sup.en`, gezählt i, ii, iii), Klick bearbeitet den Text, Liste am
  Dokumentende (`.enliste`, setzt `paginate()` vor jedem Umbruch neu,
  `flush()` nimmt sie wieder heraus — sie bricht mit um und wird gedruckt).
  Aus Word gelesen wie die Fußnoten (`docxFussnoten(xml,"endnote")`), nach
  Word als `endnotes.xml` mit `EndnoteReference`/`EndnoteText`; in Markdown,
  Text und HTML als eigene Liste. Bis 1.2 gingen sie verloren, seit dem
  Bewahren standen sie nur als Platzhalter. Dabei: `endnotePr` aus
  settings.xml wird nicht mehr übernommen — ohne `endnotes.xml` hielt Word die
  Datei für beschädigt.
- **Abschnitte aus Word**: bleiben wie bisher vollständig erhalten (jeder
  mit seinem Format, seinen Kopfzeilen). Neu: ein Abschnittswechsel beginnt
  eine neue Seite wie in Word (außer „fortlaufend“; `data-wsect-neu`,
  `paginate()` verschiebt den nächsten Block, der Druck folgt über
  `seitenAnfaenge`) — vorher lief der Text weiter, Umbrüche und Seitenzahl
  wichen ab (gemessen: 1 statt 2 Seiten). Am Abschnittswechsel eine dezente
  gestrichelte Linie, in der Statusleiste „2 Abschnitte“ mit Hinweis, dass
  alle Seiten im Format des letzten Abschnitts erscheinen (Toms Entscheidung:
  echte Formate je Abschnitt hätten Umbruch und Druck im Kern umgebaut).
- **Spalten**: aus Word gelesen (gleich breite, `w:cols` mit `num`), in der
  Statusleiste angezeigt („2 Spalten“, Klick öffnet den Dialog), über
  *Format › Spalten …* für Word setzbar (1–3, Abstand), beim Speichern an der
  vom Schema verlangten Stelle im `sectPr` (`wMitteMitSpalten`). **Am
  Bildschirm und im Druck einspaltig** — Toms Entscheidung: mehrspaltig hätte
  bedeutet, jeden Absatz der zweiten Spalte zu verschieben, ein Risiko für
  Schreibmarke und Markieren. Ungleich breite Spalten bleiben roh bewahrt.
- **Gerade Seiten anders** wie in Word (`evenAndOddHeaders` in
  settings.xml, `type="even"`): Häkchen im Dialog *Kopf- und Fußzeile*,
  eigene Zeilen für Seite 2, 4, 6 … (`d.hdr2`/`d.ftr2`, `d.geradeAnders`;
  `hfFuerSeite()` wählt, die erste Seite geht vor). Am Bildschirm, im Druck
  (je Seite über `hfDruckSeiten`) und als Word-Datei (`header3.xml`/
  `footer3.xml`, `wSettings()` setzt die Einstellung an die vom Schema
  verlangte Stelle). Alle Seiten ab 2 bekommen das größere Band aus normal
  und gerade — der Druckrahmen reserviert überall gleich viel. Vorher nur
  bewahrt, jetzt sichtbar und bearbeitbar; geprüft mit einer Word-Datei
  (gerade/ungerade im Druck abwechselnd richtig, Word zählt gleich) und
  umgekehrt in PureQuill angelegt (Word findet Einstellung und beide Zeilen).
- **Word-Kommentare werden Notizen** (`wKommentarNotiz`): je Kommentar eine
  Notiz (Titel = Autor, Text = Kommentar, Farbe Zitrone, `n.wort` mit Autor,
  Datum, Initialen), die kommentierte Stelle eine verknüpfte Markierung
  (`span.anch`) wie bei einer selbst verknüpften Notiz. Bereiche über
  mehrere Absätze werden je Absatz geschlossen und wieder geöffnet,
  überlappende so verschachtelt, dass die Tags nie über Kreuz gehen.
  Zurück nach Word gehen **nur Notizen aus Word-Kommentaren**
  (`wKommentarePlanen`, `comments.xml`) — eigene Notizen sind privat und
  gehören nicht ungefragt in eine weitergegebene Datei. Geprüft mit zwei
  Dateien aus Word (zwei Kommentare; einer über zwei Absätze plus zwei
  überlappende): Autor, Text und kommentierte Stelle laut Word gleich.
  Dabei: aneinanderstoßende oder verschachtelte Markierungen haben keinen
  Innenabstand mehr — er riss Wörter sichtbar auseinander („Drit ter“).
- **Eingefügte Fußnoten gingen verloren** — `insertHTML` machte aus der
  Marke einen `<span>` mit nachgeahmten Stilen, ohne Klasse und Kennung
  (gemessen: schon die erste am Absatzende, erst recht eine zweite direkt
  hinter einer ersten). Die Marke wird jetzt direkt in den Text gesetzt; zwei
  Fußnoten hintereinander kommen beide in Word an.

- **Untermenüs blieben offen** (gemeldet am Rechtsklick-Menü, betraf auch
  Datei und Format): sie öffneten beim Überfahren ihres Pfeil-Eintrags, aber
  nichts schloss sie, wenn der Zeiger weiterzog. Jetzt schließen sie, sobald
  der Zeiger weder auf dem Eintrag noch im Untermenü ist — mit 300 ms
  Verzögerung wie in Windows, damit man schräg hinüberfahren kann
  (`subMenuSchliessenPlanen`); erneutes Überfahren desselben Eintrags öffnet
  nicht neu. Geprüft mit echten Mausereignissen
  (`werkzeuge/pruefen/untermenue-pruefen.cjs`), Gegenprobe am alten Stand
  zeigt den Fehler.

- **Fußnoten stehen im Druck/PDF am Fuß ihrer Seite** wie am Bildschirm
  und in Word — bis 1.2 gesammelt am Ende. `hfDruckSeiten()` setzt je Seite
  dasselbe Band wie die Ansicht (`fnSeiten` aus `paginate()`, Unterkante
  dort, wo der Textkörper der Seite endet); den Platz hält schon die Ansicht
  frei, und der Druck bricht wie sie um. Die Sammelliste bleibt Rückfall.
  Dabei zwei Druckfehler behoben:
  - Der Druck nahm die **alte Aufteilung**: `paginate()` läuft erst 220 ms
    nach dem letzten Tastendruck. Beide Druckwege teilen jetzt vorher frisch
    auf (sonst gemessen: Fußnoten eines anderen Dokuments, leeres Band).
  - Der **Umbruch-Wächter** (`wacheUeberUmbruch`) teilte mitten in der
    Druckvorbereitung neu auf und setzte die Bildschirm-Abstände wieder in
    den Text — gemessen: jede Seite im Druck zu zwei zerfallen (10 statt 6).
    Beim PDF-Export reichte dafür ein Speichern-Dialog, der länger als 1,2 s
    offen war. `paginate()` ruht jetzt, solange der Druckrahmen steht
    (`druckLaeuft`).
  - `check-export.mjs` prüft, dass jede Fußnote im Band steht und keine
    Sammelliste mehr angehängt ist (271/271).

- **Lange Tabellen werden in der Ansicht auf Seiten verteilt.** Eine
  Tabelle, die länger als eine Seite ist, lief am Bildschirm durch Fuß- und
  Kopfband der Folgeseiten; `paginate()` verschob nur ganze Blöcke. Der Druck
  teilte sie richtig und lag danach eine Seite gegen die Ansicht versetzt
  (gemessen: 120 Zeilen, Ansicht 24 Seiten, Druck 25). Jetzt kommt vor die
  erste Zeile, die über die Seite ragt, eine Abstandszeile (`tr.pgzeile`,
  reine Anzeige wie `margin-top`: `flush()` und der Druck nehmen sie heraus,
  Tabellenbefehle räumen sie vorher ab, die Tab-Taste überspringt sie); die
  Zeile zählt als Seitenanfang, an dem der Druck umbricht. Ragt schon die
  erste Zeile über die Seite, wandert die Tabelle wie bisher ganz weiter.
  6 px Spielraum: bricht Chromium eine Tabelle im Druck, zeichnet es an jedem
  Bruch die Rahmen dazu, und eine randvolle Seite fasste dort eine Zeile
  weniger. Ergebnis: Ansicht und Druck 25 Seiten, gleiche Seitenanfänge,
  kein zweiter Druckdurchgang mehr nötig. Fußnoten in umbrochenen Tabellen
  zählen zu der Seite, auf der ihre Marke steht.

- **Markiertes Bild oder ganze Tabelle mit der Tastatur löschen**: ein
  angeklicktes Bild (auch frei platziert) oder ein markiertes
  Inhaltsverzeichnis entfernen jetzt Rücktaste und Entf, wie in Word und
  anderen Programmen — bis 1.2 ging das nur über das Löschkreuz, die Tasten
  bewirkten nichts. Eine ganz markierte Tabelle löscht die Rücktaste ebenso
  (Entf tat das schon, der Browser selbst). Über `execCommand("delete")`,
  damit Strg+Z es zurücknimmt (`blockLoeschen`). Pfeiltasten oder Tippen
  heben die Bildmarkierung auf, damit die nächste Rücktaste kein Bild löscht,
  das man längst verlassen hat; wer einen Eintrag im Inhaltsverzeichnis
  bearbeitet, löscht nicht das ganze Verzeichnis. Geprüft mit echten Klicks
  und Tastendrücken (`werkzeuge/pruefen/loeschen-pruefen.cjs`).

- **Dialoge öffnen mittig über dem Programmfenster**, wie in OpenOffice und
  Word, maximiert wie im kleinen Fenster. Bis 1.2 standen sie in fester Höhe
  ab der Oberkante (maximiert 127 px) — kleine Dialoge wie „Wörter zählen“
  oder die Rechtschreibprüfung saßen damit bis zu 248 px über der Mitte.
  `dialogLage()` setzt die Lage einmal beim Öffnen; was gleich danach
  nachgefüllt wird (Rechtschreibprüfung: erst „lädt …“), zählt noch dazu.
  Danach bleibt die Oberkante stehen: wächst der Inhalt, wächst der Dialog
  nach unten, statt zu springen. Baut sich derselbe Dialog neu auf (die
  Reiter der Einstellungen gehen durch `overlay()`), behält er seine Lage.
  Eine neue Fenstergröße (Maximieren) richtet ihn neu aus. Dialoge, die
  höher als das Fenster sind (Einstellungen ragten selbst maximiert unten
  heraus), passen ihren Rahmen ans Fenster an, nur der Inhalt rollt, Titel
  und Schließkreuz bleiben stehen (`.modal.zuhoch` — nur dann, weil
  overflow sonst Aufklappendes im Dialog abschneiden könnte). Gemessen an
  elf Dialogen in drei Fenstergrößen: Abweichung zur Mitte höchstens 1 px
  (`werkzeuge/pruefen/dialog-lage.cjs`, `dialog-reiter.cjs`).

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
