/* Haelt die Tastenkuerzel der Hilfe gegen die Tabelle KUERZEL.
 *
 * Seit der Umstellung speist eine Tabelle den Tastenhandler UND die
 * Menuespalte — zwischen diesen beiden kann nichts mehr auseinanderlaufen.
 * Die Hilfe nennt ihre Kuerzel aber weiter als uebersetzten Fliesstext, in
 * rund sechs Themen je Sprache. Sie daraus zu erzeugen hiesse, vierzig Zellen
 * in sieben Sprachen in Platzhalter umzubauen — viel Chirurgie an uebersetzter
 * Prosa fuer wenig Gewinn. Billiger und sicherer: nachlesen und vergleichen.
 *
 * Gemeldet wird:
 *   1. Kuerzel aus der Tabelle, die eine Sprachfassung nicht erwaehnt
 *   2. Alt+Umschalt-Kombinationen, die die Hilfe nennt, die es aber nicht gibt
 *      — der gefaehrliche Fall: die Hilfe verspricht eine tote Taste
 *
 * Strg-Kombinationen des Browsers (Strg+B/I/U, Strg+Z/Y, Strg+X/C/V/A) sind
 * ausgenommen: die setzt das Programm nicht, es erbt sie.
 *
 * Aufruf:  node tools/check-kuerzel.mjs
 */
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";

const src = readFileSync(new URL("../index.html", import.meta.url), "utf8").replace(/\r\n/g, "\n");
const code = src.match(/<script>([\s\S]*)<\/script>/)[1];

/* --- Die Tabelle aus der Datei holen, statt sie hier nachzubauen --- */
const ctx = createContext({});
runInContext(code.match(/const KUERZEL=\[[\s\S]*?\n\];/)[0] + "\nglobalThis.__k=KUERZEL;", ctx);
const KUERZEL = ctx.__k;

const hctx = createContext({});
const i = code.indexOf("const HELPTEXTE"), j = code.indexOf("const HELPSPRACHEN");
runInContext(code.slice(i, j) + "\nglobalThis.__h=HELPTEXTE;", hctx);
const H = hctx.__h;

/* --- Eine Kombination auf eine Schreibweise bringen --- */
const ZUSATZ = {
  alt: "alt", strg: "ctrl", ctrl: "ctrl",
  "⇧": "shift", shift: "shift", umschalt: "shift", maj: "shift",
  "mayús": "shift", mayus: "shift", maiusc: "shift",
};
const TASTE = {
  eingabe: "enter", enter: "enter", "entrée": "enter", entree: "enter",
  intro: "enter", invio: "enter", "↵": "enter",
  "−": "-", "–": "-",
};
function norm(teile) {
  const zus = new Set(), rest = [];
  for (const t0 of teile) {
    const t = t0.trim().toLowerCase();
    if (!t) continue;
    if (ZUSATZ[t]) zus.add(ZUSATZ[t]); else rest.push(TASTE[t] || t);
  }
  if (!rest.length) return null;
  return [...[...zus].sort(), rest.join("")].join("+");
}
const ausTabelle = (x, m, k) => norm([
  ...(m === "as" ? ["alt", "shift"] : m === "c" ? ["ctrl"] : m === "alt" ? ["alt"] : []), k]);

/* `tabelle` kennt alles, was ausloest — daran misst sich Meldung 2.
   `anzuzeigen` sind nur die Erstbelegungen: die Zweitwege (Tastaturvarianten
   wie + gegen =) sollen in der Hilfe gar nicht stehen, sie als fehlend zu
   melden hiesse, den Pruefer zum Rufen ohne Anlass zu erziehen. */
const tabelle = new Map(), anzuzeigen = new Map();
for (const x of KUERZEL) {
  const erste = ausTabelle(x, x.m, x.k);
  if (erste) { tabelle.set(erste, x.id); anzuzeigen.set(erste, x.id); }
  for (const p of x.auch || []) {
    const a = ausTabelle(x, p[0], p[1]);
    if (a) tabelle.set(a, x.id);
  }
}

/* --- Die Hilfe auslesen: <kbd>-Folgen und Klartext wie "Alt+Umschalt+N" --- */
function ausHilfe(html) {
  const gefunden = new Set();
  /* Folgen von <kbd>…</kbd>, durch + getrennt — eine Folge der Laenge eins
     zaehlt mit, sonst faende der Pruefer Einzeltasten wie F7 nie. Meldung 2
     stoert das nicht: sie sieht nur Kombinationen, die mit alt beginnen. */
  for (const m of html.matchAll(/(?:<kbd>[^<]*<\/kbd>\s*\+\s*)*<kbd>[^<]*<\/kbd>/g)) {
    const teile = [...m[0].matchAll(/<kbd>([^<]*)<\/kbd>/g)].map(x => x[1]);
    const n = norm(teile);
    if (n) gefunden.add(n);
  }
  /* Klartext, etwa <b>Alt+Shift+N</b> */
  const roh = html.replace(/<[^>]*>/g, " ");
  for (const m of roh.matchAll(/\b(Alt|Strg|Ctrl)\s*\+\s*([A-Za-zÀ-ÿ⇧↵−–]+)\s*(?:\+\s*([A-Za-z0-9À-ÿ⇧↵−–]+))?/g)) {
    const n = norm([m[1], m[2], m[3]].filter(Boolean));
    if (n && n.includes("+")) gefunden.add(n);
  }
  return gefunden;
}

const SPRACHEN = Object.keys(H);
const proSprache = {};
for (const s of SPRACHEN) {
  const alle = new Set();
  for (const b of H[s]) for (const t of b.t) for (const k of ausHilfe(t.b)) alle.add(k);
  proSprache[s] = alle;
}

/* --- 1. Was die Tabelle kennt, die Hilfe aber nicht nennt --- */
let offen = 0;
console.log("=== In der Tabelle, aber in der Hilfe nicht genannt ===");
for (const [komb, id] of anzuzeigen) {
  const ohne = SPRACHEN.filter(s => !proSprache[s].has(komb));
  if (!ohne.length) continue;
  offen++;
  console.log(`  ${komb.padEnd(18)} (${id})  fehlt in: ${ohne.length === SPRACHEN.length ? "allen" : ohne.join(" ")}`);
}
if (!offen) console.log("  (nichts)");

/* --- 2. Was die Hilfe verspricht, ohne dass es existiert --- */
let falsch = 0;
console.log("\n=== In der Hilfe genannt, aber nicht belegt (Alt-Bereich) ===");
for (const s of SPRACHEN) {
  for (const komb of proSprache[s]) {
    if (!komb.startsWith("alt")) continue;       /* Strg gehoert teils dem Browser */
    if (tabelle.has(komb)) continue;
    falsch++;
    console.log(`  ${s}: ${komb}`);
  }
}
if (!falsch) console.log("  (nichts)");

console.log(`\nTabelle: ${KUERZEL.length} Kuerzel, ${tabelle.size} Kombinationen (mit Zweitwegen)`);
console.log(offen ? `${offen} nicht dokumentiert` : "Alle dokumentiert");
console.log(falsch ? `${falsch} FALSCHE Angaben in der Hilfe` : "Keine falschen Angaben");
process.exit(falsch ? 1 : 0);
