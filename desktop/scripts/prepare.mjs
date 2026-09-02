/* Stellt den Ordner app/ zusammen, den electron-builder einpackt.
   Quelle ist immer das Wurzelverzeichnis des Repos — es gibt nur eine
   index.html, und die liegt dort. app/ ist erzeugt und liegt nicht im Git.

   Zwei Abweichungen von der Webfassung, beide bewusst:

   1. Das deutsche Wörterbuch bleibt draußen. dict/de.* steht unter der GPL
      (siehe dict/de.LICENSE.txt), und die GPL-3 verträgt sich nicht mit dem
      Kopierschutz, den der Microsoft Store über ein Paket legt. index.html
      lädt es beim ersten deutschen Rechtschreib-Durchlauf von der Webadresse
      nach (siehe dictText()).

   2. Das PWA-Manifest fliegt raus, samt seiner Verknüpfung im <head>. Es hat
      in einer Desktop-App keine Funktion, und unter dem pqw://-Schema kann
      Chromium seine start_url/scope nicht auflösen — das quittiert es beim
      Start mit einer Meldung im Terminal, die nach einem Fehler aussieht,
      aber keiner ist. Ohne die Verknüpfung gibt es nichts zu holen und
      nichts zu bemängeln. */
import { cp, mkdir, rm, readdir, stat, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");
const out = path.resolve(here, "..", "app");

/* Sprachen, deren Wörterbuch mit ins Paket darf */
const BUNDLED_DICTS = ["en", "es", "fr", "it", "pl", "pt"];
/* Nicht gebündelt, wird zur Laufzeit geholt */
const REMOTE_DICTS = ["de"];

await rm(out, { recursive: true, force: true });
await mkdir(path.join(out, "dict"), { recursive: true });

/* index.html: eine Zeile fällt weg, sonst Wort für Wort dieselbe Datei */
let html = await readFile(path.join(root, "index.html"), "utf8");
const vorher = html.length;
html = html.replace(/^[ \t]*<link[^>]+rel=["']manifest["'][^>]*>[ \t]*\r?\n?/mi, "");
if (html.length === vorher) console.warn("  ! <link rel=\"manifest\"> nicht gefunden — bitte prüfen");
await writeFile(path.join(out, "index.html"), html, "utf8");

await cp(path.join(root, "icon.svg"), path.join(out, "icon.svg"));

let bytes = 0;
for (const name of await readdir(path.join(root, "dict"))) {
  const lang = name.split(".")[0];
  if (!BUNDLED_DICTS.includes(lang)) continue;
  const src = path.join(root, "dict", name);
  await cp(src, path.join(out, "dict", name));
  bytes += (await stat(src)).size;
}

console.log("app/ zusammengestellt");
console.log("  Wörterbücher im Paket : " + BUNDLED_DICTS.join(", ") + "  (" + (bytes / 1048576).toFixed(1) + " MB)");
console.log("  zur Laufzeit geladen  : " + REMOTE_DICTS.join(", ") + "  (GPL, siehe dict/de.LICENSE.txt)");
console.log("  PWA-Manifest          : entfernt (in einer Desktop-App ohne Funktion)");
