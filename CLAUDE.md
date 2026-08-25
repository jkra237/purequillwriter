# PureQuill Writer

Ein einziges HTML-File (`index.html`) als vollständige Textverarbeitung — kein Build-Schritt, keine Abhängigkeiten, kein Framework. CSS und JS stecken inline im selben File. Gehostet über GitHub Pages: https://jkra237.github.io/purequillwriter/

Einzige Ausnahme vom Ein-File-Prinzip ist `dict/` — die Hunspell-Wörterbücher der Rechtschreibprüfung (je Sprache `.dic` + `.aff` + Lizenztext, zusammen ~8,6 MB). Das sind Daten, kein Code: die Prüf-Engine selbst steckt wie alles andere inline in `index.html`, und geladen werden die Dateien erst beim ersten Prüfen. `fetch()` auf `dict/` scheitert beim direkten Öffnen per `file://` — die Rechtschreibprüfung braucht eine echte Adresse (GitHub Pages, lokaler Server, Tauri).

Kommunikation mit dem Nutzer läuft auf Deutsch. Commit-Nachrichten sind bewusst auf Englisch und ausführlich — sie tragen die Begründung hinter jeder Entscheidung, nicht nur das Diff. Bei Unklarheiten zu einer vergangenen Änderung: `git log` und die jeweilige Commit-Message lesen, bevor man rät.

## Architektur

- **Zustand**: globales Objekt `S`, persistiert in `localStorage` via `save()`/`load()`. Enthält `docs[]`, `notes[]`, `glossary[]`, `glossaries[]`, `settings{}`, `mode`, `goal{}`.
- **Migrationen** laufen beim Start direkt nach `let S=load()||{...}` — jede neue persistente Eigenschaft braucht dort eine Zeile, die alte Zustände nachzieht (siehe die vielen `if(S.settings&&...)`-Zeilen als Vorbild).
- **`render()`** ist die zentrale Neuzeichenfunktion: `drawTabs()`, `drawTools()`, moduspezifisches `drawWrite()`/`drawNotes()`/`drawGloss()`, `drawStatus()`.
- **`doc()`** liefert das aktive Dokument, `fmtOf(d)` sein Seitenformat (inkl. `hd`/`fd` für Kopf-/Fußzeilenabstand).
- **Glossare**: mehrere benannte Sammlungen (`S.glossaries`), jedes Dokument hat eine `glossaryId` (auch `null` = bewusst ohne Zuordnung). Ansehen (`curGView()`) und Zuordnen sind getrennte Konzepte — ein Reiterklick zeigt nur an, bindet nichts um.
- **Kopf-/Fußzeile**: Der Textkörper weicht ihr aus (`hfBand()`), Überlappung ist strukturell ausgeschlossen. Der Ziehgriff ändert die Bandhöhe (= Seitenrand), nicht die Position der Zeile.
- **Rechtschreibprüfung**: eigener Hunspell-Kern (`spParseAff`/`spParseDic`/`spMake`), weil die Browserprüfung zwar unterringelt, ihre Funde aber nicht herausgibt — ohne Liste kein „12 Fehler" und kein Weiterspringen. Gefundene Stellen werden als `<span class="spellerr">` in den Text gehängt; `flush()` streift sie beim Speichern ab (dieselbe Liste wie `.hit`/`.glossterm`), im Dokument landen sie nie. `closeOvl()` räumt sie auf, damit auch Escape und der Klick neben den Dialog sauber beenden.
- **Mehrsprachige Oberfläche**: `S.settings.uiLang` ist `de`/`en`/`fr`/`es`. Deutsch ist der Sonderfall ohne eigenes Wörterbuch — die Quelltexte selbst sind deutsch, `tr(s)` gibt für `uiLang==="de"` unverändert zurück, was hereinkam. `const I18N={en:{...},fr:{...},es:{...}}` hält je Sprache ein Objekt, Schlüssel sind immer die deutschen Quelltexte. Neue UI-Strings brauchen einen `tr("Deutscher Text")`-Aufruf plus je einen Eintrag in allen drei Wörterbüchern — `check_i18n.js` (Muster siehe unten) prüft das für alle vier Sprachen automatisch. Stellen, die `tr()` nicht abdeckt (zusammengesetzte Sätze mit Pluralformen, eingebettete Zahlen) laufen über `PL(de,en,fr,es)` — vier fertige Varianten übergeben, keine Lazy-Auswertung nötig, da reine Zeichenkettenverkettung ohne Nebenwirkungen. `OFWORD()` liefert das wiederkehrende „von"/„of"/„sur"/„de" für Zähler wie „3 von 12". Dezimaltrennzeichen (Komma vs. Punkt) bleibt ein reiner `uiLang==="en"`-Vergleich — Deutsch, Französisch und Spanisch nutzen alle drei das Komma, das ist kein Vieraugen-Fall.

## Design-Tokens

- `--radius: 6px` (Bedienelemente), `--radius-lg: 12px` (Dialoge), `--radius-paper: 3px` (Notizzettel, Seiten — bewusst kantig)
- `--mono`: moderner Mono-Stack (Cascadia Mono etc., Consolas nur Rückfall), `--ui`: Systemschrift
- Farbübergänge bei Hover/Fokus: 140ms, nur auf Farbe/Schatten, nie Layout (Flacker-Gefahr). `prefers-reduced-motion` schaltet alles ab.
- 12 Farbschemata, Reihenfolge fest: Azur, Alabaster, Silberton, Lagune, dann Rest nach gemessener Helligkeit (nicht geschätzt — relative Luminanz von Papier/Leiste/Umgebung). Azur ist Standard für neue Nutzer.
- Ein Fokusring (`:focus-visible`) deckt alle interaktiven Elemente ab.

## Tastaturschema

`Alt+Shift+<Taste>` für alle Programmfunktionen (Browser/OS belegen `Strg`-Kombinationen oft schon). Reines `Strg` bleibt für Bearbeiten-Standards (Fett/Kursiv/Unterstrichen/Rückgängig/Drucken), die der Browser nicht beansprucht.

## Verifikation ohne Build-Tools

Kein Test-Framework. Etabliertes Vorgehen:
1. `node -e "..."` extrahiert `<script>`-Inhalt und prüft Syntax via `new Function(...)`.
2. CSS-Klammernbilanz zählen (`{` vs `}`) als Rauchtest nach größeren Edits.
3. `check_i18n.js` (liegt im Scratchpad-Ordner der jeweiligen Session, nicht im Repo) prüft, dass jeder `tr("literal")`-Aufruf in allen drei Wörterbüchern (`I18N.en`/`.fr`/`.es`) einen Eintrag hat.
4. Live-Test über `mcp__Claude_Browser__preview_start` + `javascript_exec`: Zustand direkt manipulieren (`S.docs=[...]`, `render()`), Ergebnis per JS-Assertion prüfen, Kontrast über alle 12 Schemata per relativer Luminanz durchrechnen.
5. **Screenshots sind in dieser Umgebung unzuverlässig** (Browser-Pane rendert oft keine Frames) — Verifikation läuft programmatisch, nicht visuell. Bei Layoutfragen (Überlauf, Spaltenbreite) einen Container fester Breite bauen und dort messen, statt auf Viewport-Maße zu vertrauen (die Preview meldet manchmal Breite 0).

## Bekannte Stolperfallen (aus vergangenen Bugs)

- **`!==false`-Prüfungen** statt echter Booleans waren mehrfach Fehlerquelle (dimUi-Voreinstellung). Bei neuen Einstellungen: Migration auf echten Boolean, dann simple Wahrheitsprüfung.
- **`isTrulyEmpty()`** prüfte einmal nur "sind alle Dokumente leer" statt "gibt es nur eins" — führte dazu, dass das Schließen eines von mehreren leeren Tabs die ganze Oberfläche zurücksetzte. Bei Zustandsprüfungen dieser Art: genau die Bedingung benennen, die gemeint ist.
- **`appearance:auto`** lässt Windows eigene Farben für `<select>` zeichnen und ignoriert dabei gesetztes CSS — betraf mehrere Dropdowns.
- Inline `\uXXXX`-Escapes in Stringliteralen funktionieren, sind aber für `check_i18n.js` unsichtbar und inkonsistent zum Rest der Datei — bei Bearbeitung echte UTF-8-Zeichen verwenden.
