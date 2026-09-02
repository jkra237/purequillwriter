/* Stellt den Ordner app/ zusammen, den electron-builder einpackt.
   Quelle ist immer das Wurzelverzeichnis des Repos — es gibt nur eine
   index.html, und die liegt dort. app/ ist erzeugt und liegt nicht im Git.

   Einzige Abweichung von der Webfassung: das deutsche Wörterbuch bleibt
   draußen. dict/de.* steht unter der GPL (siehe dict/de.LICENSE.txt), und
   die GPL-3 verträgt sich nicht mit dem Kopierschutz, den der Microsoft
   Store über ein Paket legt. index.html lädt es beim ersten deutschen
   Rechtschreib-Durchlauf von der Webadresse nach (siehe dictText()). */
import { cp, mkdir, rm, readdir, stat } from "node:fs/promises";
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

for (const f of ["index.html", "icon.svg", "manifest.webmanifest"]) {
  try { await cp(path.join(root, f), path.join(out, f)); }
  catch { console.warn("  (übersprungen, nicht vorhanden: " + f + ")"); }
}

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
