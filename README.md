# PureQuill Writer

Minimalistische Textverarbeitung mit Sticky Notes und integriertem Glossar. Eine einzige HTML-Datei, keine Installation, keine Abhängigkeiten.

**Testumgebung:** https://jkra237.github.io/purequillwriter/

---

## Was drin ist

- **Schreiben** mit echter Seitenansicht in Millimetermaßen, Seitenumbruch, Einrücken
- **Kopf- und Fußzeile** direkt auf der Seite per Doppelklick auf den oberen/unteren Rand
- **Sticky Notes**, die sich an beliebig viele Textstellen anheften lassen
- **Glossar** mit Markierung und Nachschlagefunktion im Text
- **Kommandopalette** (`Alt` `⇧` `P`) und Schrägstrich-Menü für alles ohne Maus
- Tabellen, Bilder, Links, Suchen und Ersetzen, Autosave mit Versionsverlauf
- **Dokumente laden** aus `.docx`, `.odt`, `.rtf`, `.html`, `.md` und `.txt`
- Siebzehn Farbschemata (historische wie Phosphor und Enzian, moderne wie Alabaster und Azur), Fokusmodus, Schreibmaschinen-Scrollen
- **Leseansicht** und **Druckvorschau** — den Text beurteilen, bevor gedruckt wird
- **Dokumentnotizen** je Dokument und ein abschaltbares **Schreibziel** in der Statuszeile
- Sechs Oberflächensprachen mit Startdialog beim ersten Öffnen; die Hilfe liegt auf Deutsch und Englisch vor und weist auf Englisch als Ersatz hin, wo eine Fassung fehlt

## Bedienung

Die Tastenkombinationen verwenden `Alt` `⇧` statt `Strg`, weil `Strg`-Kombinationen im Browser oft schon vom Browser selbst belegt sind (z. B. `Strg N`, `Strg F`, `Strg 1`). Bearbeiten-Kürzel wie Fett/Kursiv/Rückgängig bleiben bei `Strg`, da diese vom Browser nicht beansprucht werden.

| Taste | Funktion |
|---|---|
| `Alt` `⇧` `P` | Kommandopalette |
| `Alt` `1` / `2` / `3` | Schreiben / Notizen / Glossar |
| `Alt` `⇧` `D` | Neues Dokument |
| `Alt` `⇧` `N` | Neue Notiz |
| `Alt` `⇧` `M` | Textstelle mit Notiz verknüpfen |
| `Alt` `⇧` `K` | Link einfügen/bearbeiten |
| `Alt` `⇧` `G` | Glossar nachschlagen |
| `Alt` `⇧` `F` / `H` | Suchen / Ersetzen |
| `Alt` `⇧` `S` | Jetzt sichern |
| `Alt` `⇧` `Z` | Fokusmodus (`Esc` verlässt ihn) |
| `Alt` `⇧` `B` | Leseansicht (`Esc` verlässt sie) |
| `Alt` `⇧` `V` | Druckvorschau (`Esc` verlässt sie) |
| `Alt` `⇧` `T` | Dokumentnotizen ein-/ausblenden |
| `Alt` `⇧` `L` / `E` / `R` | Linksbündig / Zentriert / Rechtsbündig |
| `Alt` `⇧` `+` / `−` / `0` | Vergrößern / Verkleinern / Seitenbreite einpassen |
| `Alt` `⇧` `⏎` | Seitenumbruch einfügen |
| `Tab` / `⇧` `Tab` | Absatz ein- / ausrücken (in Tabellen: nächste Zelle) |
| `/` | Einfügemenü am Anfang eines leeren Absatzes |
| `F1` | Hilfe (Inhalt, Stichwortverzeichnis, Volltextsuche) |

Übrige Kürzel folgen Word: `Strg B`/`I`/`U` (Fett/Kursiv/Unterstrichen), `Strg Z`/`Y` (Rückgängig/Wiederholen), `Strg P` (Drucken).

---

## Aufbau

| Datei | Zweck |
|---|---|
| `index.html` | Das gesamte Programm |
| `manifest.webmanifest` | Ermöglicht die Installation als App |
| `icon.svg` | Programmsymbol |

Es gibt keinen Build-Schritt. `index.html` bearbeiten, hochladen, fertig.

---

## Einen früheren Stand zurückholen

Jeder Upload ist ein Wiederherstellungspunkt.

**Einzelne Änderung rückgängig machen**
Reiter *Commits* → den betreffenden Eintrag öffnen → oben rechts `···` → *Revert*. GitHub legt die frühere Fassung als neuen Stand an.

**Eine ältere Fassung ansehen oder herunterladen**
`index.html` öffnen → *History* → gewünschten Stand wählen → *View file* → Knopf *Raw* → Datei speichern.

**Stabile Stände festhalten**
Unter *Releases* → *Draft a new release* eine Marke wie `v0.1` vergeben und `index.html` anhängen. So hast du jederzeit eine unveränderliche Fassung zum Zurückfallen, unabhängig vom laufenden Stand.

---

## Wichtig: Wo die Texte liegen

Dokumente, Notizen und Glossar werden im Speicher des Browsers abgelegt, getrennt nach Adresse. Das bedeutet:

- Die lokale Datei und die GitHub-Pages-Adresse haben **getrennte Bestände**.
- Beim Wechsel dorthin zuerst *Datei → Sicherung → Sicherung erstellen* im alten, dann *Datei → Sicherung → Sicherung laden* im neuen.
- Ein Zurücksetzen des Programmstands verändert die Texte **nicht** — Code und Inhalte liegen getrennt.

Regelmäßige Sicherung über *Datei → Sicherung → Sicherung erstellen* bleibt trotzdem sinnvoll.
