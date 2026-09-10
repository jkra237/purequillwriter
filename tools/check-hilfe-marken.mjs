/* Prueft die <nur-b>/<nur-a>-Marken im Hilfetext.
 *
 * Die Browser- und die App-Fassung teilen sich einen Text; welche Haelfte
 * stehen bleibt, entscheidet helpAufloesen() zur Laufzeit. Eine Marke, die in
 * einer Sprache fehlt, faellt niemandem auf: der Satz sieht vollstaendig aus,
 * er ist nur in einer der beiden Fassungen falsch. Genau so ist die Sprach-
 * liste jahrelang unbemerkt auseinandergelaufen. Also nachzaehlen.
 *
 * Geprueft wird:
 *   1. jede Marke ist geschlossen und keine ist verschachtelt
 *   2. jedes Thema traegt in allen sieben Sprachen gleich viele Marken
 *   3. in der App-Fassung bleibt kein "Browser"/"Chrome"/"Edge" stehen
 *
 * Aufruf:  node tools/check-hilfe-marken.mjs
 */
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";

const src = readFileSync(new URL("../index.html", import.meta.url), "utf8").replace(/\r\n/g, "\n");
const code = src.match(/<script>([\s\S]*)<\/script>/)[1];

const ctx = createContext({});
const i = code.indexOf("const HELPTEXTE");
const j = code.indexOf("const HELPSPRACHEN");
runInContext(code.slice(i, j) + "\nglobalThis.__h=HELPTEXTE;", ctx);
const H = ctx.__h;

/* helpAufloesen aus der Datei selbst holen, statt sie hier nachzubauen —
   sonst prueft das Skript eine andere Regel als die, die wirklich laeuft. */
const fq = createContext({ window: {} });
runInContext(
  code.match(/const istApp=[\s\S]*?\n\}/)[0].replace("const istApp=()=>!!PQWD();",
    "const istApp=()=>!!window.pqwDesktop;") +
  "\nglobalThis.__f=helpAufloesen;", fq);
const aufl = fq.__f;
const alsApp = (h) => { fq.window.pqwDesktop = {}; const r = aufl(h); delete fq.window.pqwDesktop; return r; };
const alsBrowser = (h) => { delete fq.window.pqwDesktop; return aufl(h); };

let fehler = 0;
const meld = (m) => { fehler++; console.log("  FEHLER " + m); };

/* 1 — Wohlgeformtheit */
const SPRACHEN = Object.keys(H);
for (const s of SPRACHEN) {
  for (const buch of H[s]) for (const t of buch.t) {
    for (const tag of ["b", "a"]) {
      const auf = (t.b.match(new RegExp("<nur-" + tag + ">", "g")) || []).length;
      const zu = (t.b.match(new RegExp("</nur-" + tag + ">", "g")) || []).length;
      if (auf !== zu) meld(`${s} › ${t.t}: <nur-${tag}> ${auf}x geoeffnet, ${zu}x geschlossen`);
    }
    /* Verschachtelung nur mit einem Durchlauf pruefbar: ein Muster ueber
       "auf … auf … zu" trifft auch zwei getrennte Paare hintereinander und
       meldet dann jede zweite Marke als Fehler. */
    let offen = null;
    for (const m of t.b.matchAll(/<(\/?)nur-([ab])>/g)) {
      const zu = m[1] === "/", tag = m[2];
      if (!zu) {
        if (offen) { meld(`${s} › ${t.t}: <nur-${tag}> oeffnet in <nur-${offen}>`); break; }
        offen = tag;
      } else {
        if (offen !== tag) { meld(`${s} › ${t.t}: </nur-${tag}> ohne passende oeffnende Marke`); break; }
        offen = null;
      }
    }
    if (offen) meld(`${s} › ${t.t}: <nur-${offen}> nie geschlossen`);
  }
}

/* 2 — Gleichstand je Thema ueber alle Sprachen */
const proThema = {};
for (const s of SPRACHEN) {
  H[s].forEach((buch, bi) => buch.t.forEach((t, ti) => {
    const schl = bi + "/" + ti;
    const n = (t.b.match(/<nur-[ab]>/g) || []).length;
    (proThema[schl] ||= {})[s] = { n, titel: t.t };
  }));
}
let ungleich = 0;
for (const [schl, je] of Object.entries(proThema)) {
  const zahlen = [...new Set(Object.values(je).map((x) => x.n))];
  if (zahlen.length > 1) {
    ungleich++;
    console.log("  ungleich  " + schl + "  " +
      SPRACHEN.map((s) => s + ":" + (je[s] ? je[s].n : "?")).join(" ") +
      "   (" + (je.de || Object.values(je)[0]).titel + ")");
  }
}

/* 3 — In der App-Fassung darf kein Browser-Wort uebrig bleiben */
const VERBOTEN = /\bBrowser\b|\bbrowser\b|\bChrome\b|\bEdge\b|\bnavegador\b|\bnavigateur\b|przegl/;
for (const s of SPRACHEN) {
  for (const buch of H[s]) for (const t of buch.t) {
    const txt = alsApp(t.b).replace(/<[^>]*>/g, " ");
    if (VERBOTEN.test(txt)) {
      const m = txt.match(new RegExp("[^.]{0,70}(" + VERBOTEN.source + ")[^.]{0,70}"));
      console.log("  App-Fassung  " + s + " › " + t.t + ": …" + (m ? m[0].trim() : "").slice(0, 130));
    }
  }
  /* Gegenprobe: die Browser-Fassung darf keine Marken uebrig lassen */
  for (const buch of H[s]) for (const t of buch.t)
    if (/<\/?nur-[ab]>/.test(alsBrowser(t.b)) || /<\/?nur-[ab]>/.test(alsApp(t.b)))
      meld(`${s} › ${t.t}: Marke nach dem Aufloesen noch da`);
}

console.log("\nThemen je Sprache: " + SPRACHEN.map((s) =>
  s + ":" + H[s].reduce((n, b) => n + b.t.length, 0)).join(" "));
console.log("Marken je Sprache: " + SPRACHEN.map((s) =>
  s + ":" + H[s].reduce((n, b) => n + b.t.reduce((m, t) =>
    m + (t.b.match(/<nur-[ab]>/g) || []).length, 0), 0)).join(" "));
console.log(ungleich ? `\n${ungleich} Themen mit ungleicher Markenzahl` : "\nMarkenzahl in allen Sprachen gleich");
console.log(fehler ? `${fehler} echte Fehler` : "Keine Formfehler");
process.exit(fehler ? 1 : 0);
