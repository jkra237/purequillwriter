# PureQuill Writer

Minimalistische Textverarbeitung mit Sticky Notes und integriertem Glossar. Eine einzige HTML-Datei, keine Installation, keine Abhängigkeiten.

**Testumgebung:** https://BENUTZERNAME.github.io/lightweight-writer/
*(Adresse nach dem Einrichten von GitHub Pages hier eintragen.)*

---

## Was drin ist

- **Schreiben** mit echter Seitenansicht in Millimetermaßen, Seitenumbruch, Kopf- und Fußzeile
- **Sticky Notes**, die sich an beliebig viele Textstellen anheften lassen
- **Glossar** mit Markierung und Nachschlagefunktion im Text
- **Kommandopalette** (`Strg ⇧ P`) und Schrägstrich-Menü für alles ohne Maus
- Tabellen, Bilder, Links, Suchen und Ersetzen, Autosave mit Versionsverlauf
- Sieben Farbschemata, Fokusmodus, Schreibmaschinen-Scrollen

## Bedienung

| Taste | Funktion |
|---|---|
| `Strg` `⇧` `P` | Kommandopalette |
| `Strg` `1` / `2` / `3` | Schreiben / Notizen / Glossar |
| `Strg` `⇧` `N` | Neue Notiz |
| `Strg` `⇧` `K` | Textstelle mit Notiz verknüpfen |
| `Strg` `G` | Glossar nachschlagen |
| `Strg` `F` / `H` | Suchen / Ersetzen |
| `F11` | Fokusmodus (`Esc` verlässt ihn) |
| `/` | Einfügemenü am Anfang eines leeren Absatzes |

Übrige Kürzel folgen Word: `Strg N`, `S`, `P`, `K` (Link), `B`/`I`/`U`, `L`/`E`/`R`, `Strg Enter`.

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
- Beim Wechsel dorthin zuerst *Datei → Alles sichern als Datei* im alten, dann *Datei → Datei laden* im neuen.
- Ein Zurücksetzen des Programmstands verändert die Texte **nicht** — Code und Inhalte liegen getrennt.

Regelmäßige Sicherung über *Datei → Alles sichern als Datei* bleibt trotzdem sinnvoll.
