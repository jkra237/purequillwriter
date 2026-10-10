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
 * Strg-Kombinationen des Browsers (Strg+Z/Y, Strg+X/C/V) sind ausgenommen:
 * die setzt das Programm nicht, es erbt sie.
 *
 * Seit 2026-10-10 haengt die Belegung auch von der Oberflaechensprache ab
 * (KZ_SPRACHE: Word legt Fett & Co. je Sprache anders). Jede Sprachfassung
 * der Hilfe wird darum gegen IHRE Belegung geprueft, und Platzhalter wie
 * {kz:fett} werden mit demselben helpKuerzel() aufgeloest wie zur Laufzeit.
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
const kernA = code.indexOf("const KUERZEL=["), kernB = code.indexOf("function zeichenFormat");
runInContext(code.slice(kernA, kernB) +
  "\nglobalThis.__k=KUERZEL;globalThis.__b=kzBelegung;globalThis.__hk=helpKuerzel;", ctx);
const KUERZEL = ctx.__k, kzBelegung = ctx.__b, helpKuerzel = ctx.__hk;

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
  for (const b of H[s]) for (const t of b.t) teile.push(helpKuerzel(aufl(t.b), s, alsApp));
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
const ausTabelle = (m, k) => norm([
  ...(m === "as" ? ["alt", "shift"] : m === "cs" ? ["ctrl", "shift"] : m === "ca" ? ["ctrl", "alt"]
     : m === "c" ? ["ctrl"] : m === "alt" ? ["alt"] : []), k]);

/* `tabelle` kennt alles, was ausloest — daran misst sich Meldung 2.
   `anzuzeigen` sind die Tasten fuer Menue und Hilfe: die Zweitwege (Tasten-
   varianten wie + gegen =) sollen in der Hilfe gar nicht stehen, sie als
   fehlend zu melden hiesse, den Pruefer zum Rufen ohne Anlass zu erziehen.
   Beides haengt von Fassung und Sprache ab und kommt aus kzBelegung(). */
function bauen(alsApp, sprache) {
  const tabelle = new Map(), anzuzeigen = new Map();
  const bel = kzBelegung(sprache, alsApp);
  for (const id in bel) {
    for (const p of bel[id].alle) { const n = ausTabelle(p.m, p.k); if (n) tabelle.set(n, id); }
    for (const p of bel[id].zeige) { const n = ausTabelle(p.m, p.k); if (n) anzuzeigen.set(n, id); }
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
  const proSprache = {}, belegung = {};
  for (const s of SPRACHEN) {
    const alle = new Set();
    for (const roh of hilfeText(s, alsApp)) for (const k of ausHilfe(roh)) alle.add(k);
    proSprache[s] = alle;
    belegung[s] = bauen(alsApp, s);
  }

  console.log(`=== ${name}: in der Tabelle, aber in der Hilfe nicht genannt ===`);
  const fehlt = new Map();
  for (const s of SPRACHEN) for (const [komb, id] of belegung[s].anzuzeigen) {
    if (proSprache[s].has(komb)) continue;
    const z = `${komb.padEnd(18)} (${id})`;
    if (!fehlt.has(z)) fehlt.set(z, []);
    fehlt.get(z).push(s);
  }
  for (const [z, ohne] of fehlt) {
    offen++;
    console.log(`  ${z}  fehlt in: ${ohne.length === SPRACHEN.length ? "allen" : ohne.join(" ")}`);
  }
  if (!fehlt.size) console.log("  (nichts)");

  console.log(`=== ${name}: in der Hilfe genannt, aber nicht belegt (Alt-Bereich) ===`);
  let m = 0;
  for (const s of SPRACHEN) {
    const { tabelle } = belegung[s];
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

/* --- 3. Die Kommandopalette darf keine Taste von Hand behaupten ---
   Sie war die vierte Quelle und fiel bei der Umstellung durch: ihre Hinweise
   standen als fester Text und versprachen sieben Tasten, die inzwischen etwas
   anderes tun. Jeder Hinweis kommt jetzt aus kz(); ein handgeschriebener im
   Alt-Bereich waere ein Rueckfall. Strg Z/Y duerfen bleiben, die erbt das
   Programm vom Browser und setzt sie nicht. */
let palette = 0;
console.log("=== Kommandopalette: Kuerzel von Hand eingetragen ===");
const liste = code.match(/function commandList\(\)\{[\s\S]*?\n\}/);
if (!liste) { console.log("  (commandList nicht gefunden)"); palette++; }
else for (const m of liste[0].matchAll(/"((?:Alt|F\d)[^"]*)"/g)) {
  palette++;
  console.log(`  ${m[1]}  — gehoert in KUERZEL und ueber kz(id) geholt`);
}
if (!palette) console.log("  (nichts)");
console.log("");

console.log(`Tabelle: ${KUERZEL.length} Kuerzel`);
console.log(offen ? `${offen} nicht dokumentiert` : "Alle dokumentiert, in beiden Fassungen");
console.log(falsch ? `${falsch} FALSCHE Angaben in der Hilfe` : "Keine falschen Angaben");
process.exit((falsch+palette) ? 1 : 0);
