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
 * Geprueft wird zweimal, einmal je Fassung. Vier Belegungen unterscheiden sich:
 * Strg+R, Strg+N und Strg+W gibt es nur in der App, und die Hilfe sagt das ueber
 * <nur-b>/<nur-a>. Wer nur eine Fassung pruefte, faende die andere Haelfte
 * entweder nie dokumentiert oder falsch dokumentiert.
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

/* helpAufloesen aus der Datei holen, damit die Hilfe genauso aufgeloest wird
   wie zur Laufzeit — sonst pruefte man Text, den niemand zu sehen bekommt. */
const actx = createContext({ window: {} });
runInContext(
  code.match(/const istApp=[\s\S]*?\n\}/)[0]
      .replace("const istApp=()=>!!PQWD();", "const istApp=()=>!!window.pqwDesktop;") +
  "\nglobalThis.__f=helpAufloesen;", actx);
const aufl = actx.__f;
function hilfeText(s, alsApp) {
  if (alsApp) actx.window.pqwDesktop = {}; else delete actx.window.pqwDesktop;
  const teile = [];
  for (const b of H[s]) for (const t of b.t) teile.push(aufl(t.b));
  delete actx.window.pqwDesktop;
  return teile;
}

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
   melden hiesse, den Pruefer zum Rufen ohne Anlass zu erziehen.
   Beides haengt von der Fassung ab, siehe app und nurApp in der Tabelle. */
function bauen(alsApp) {
  const tabelle = new Map(), anzuzeigen = new Map();
  for (const x of KUERZEL) {
    if (x.nurApp && !alsApp) continue;
    const e = (alsApp && x.app) ? x.app : { m: x.m, k: x.k };
    const erste = ausTabelle(x, e.m, e.k);
    if (erste) { tabelle.set(erste, x.id); anzuzeigen.set(erste, x.id); }
    for (const p of x.auch || []) {
      const a = ausTabelle(x, p[0], p[1]);
      if (a) tabelle.set(a, x.id);
    }
    /* In der App bleibt die Browser-Belegung als Zweitweg bestehen. */
    if (alsApp && x.app) {
      const z = ausTabelle(x, x.m, x.k);
      if (z) tabelle.set(z, x.id);
    }
  }
  return { tabelle, anzuzeigen };
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
let offen = 0, falsch = 0;

for (const [name, alsApp] of [["Browser-Fassung", false], ["App-Fassung", true]]) {
  const { tabelle, anzuzeigen } = bauen(alsApp);
  const proSprache = {};
  for (const s of SPRACHEN) {
    const alle = new Set();
    for (const roh of hilfeText(s, alsApp)) for (const k of ausHilfe(roh)) alle.add(k);
    proSprache[s] = alle;
  }

  console.log(`=== ${name}: in der Tabelle, aber in der Hilfe nicht genannt ===`);
  let n = 0;
  for (const [komb, id] of anzuzeigen) {
    const ohne = SPRACHEN.filter(s => !proSprache[s].has(komb));
    if (!ohne.length) continue;
    n++; offen++;
    console.log(`  ${komb.padEnd(18)} (${id})  fehlt in: ${ohne.length === SPRACHEN.length ? "allen" : ohne.join(" ")}`);
  }
  if (!n) console.log("  (nichts)");

  console.log(`=== ${name}: in der Hilfe genannt, aber nicht belegt (Alt-Bereich) ===`);
  let m = 0;
  for (const s of SPRACHEN) {
    for (const komb of proSprache[s]) {
      if (!komb.startsWith("alt")) continue;     /* Strg gehoert teils dem Browser */
      if (tabelle.has(komb)) continue;
      m++; falsch++;
      console.log(`  ${s}: ${komb}`);
    }
  }
  if (!m) console.log("  (nichts)");
  console.log("");
}

console.log(`Tabelle: ${KUERZEL.length} Kuerzel`);
console.log(offen ? `${offen} nicht dokumentiert` : "Alle dokumentiert, in beiden Fassungen");
console.log(falsch ? `${falsch} FALSCHE Angaben in der Hilfe` : "Keine falschen Angaben");
process.exit(falsch ? 1 : 0);
