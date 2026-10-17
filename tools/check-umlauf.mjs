/* Umlauf-Prüfung: ein Dokument mit allem, was das Programm kann, wird
 * gespeichert, wieder geöffnet und Merkmal für Merkmal mit dem Original
 * verglichen — dazu der Fixpunkt (zweiter und dritter Durchgang gleich).
 *
 *   node tools/check-umlauf.mjs [--modus word|odt|nativ] [--soffice <pfad>] [--chrome <pfad>]
 *
 *   word   (Standard) Speichern als Word → öffnen. Mit LibreOffice zusätzlich:
 *          LibreOffice wandelt die .docx in .odt, die wird geöffnet.
 *   odt    Speichern als OpenDocument → öffnen. Mit LibreOffice zusätzlich:
 *          LibreOffice öffnet unsere .odt und speichert sie selbst neu.
 *   nativ  (nur mit LibreOffice) Webseiten-Export → LibreOffice macht daraus
 *          ein Writer-eigenes Dokument (andere Vorlagennamen als nach einer
 *          Umwandlung aus Word). Vieles geht schon über HTML verloren — hier
 *          zählt, dass nichts FALSCH ankommt (Farben, Schriften).
 *
 * Entstanden 2026-10-17 bei der Frage, ob .odt so verlustfrei geht wie .docx:
 * es fand neun Lücken im Word-Weg und den fast leeren OpenDocument-Leser.
 * LibreOffice ist keine Voraussetzung des Projekts — ohne es laufen die
 * eigenen Umläufe. Ergebnisdateien liegen im Temp-Ordner (pqw-umlauf).
 * Die Zählung sagt nur, DASS ein Merkmal ankommt; ob es gleich aussieht,
 * zeigt der Vergleich von import-a.html und import-b.html dort. */
import http from "node:http";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const arg = n => args.includes(n) ? args[args.indexOf(n) + 1] : null;
const MODUS = arg("--modus") || "word";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const aus = path.join(os.tmpdir(), "pqw-umlauf");
const SOFFICE = arg("--soffice") || ["C:/Program Files/LibreOffice/program/soffice.com", "C:/Program Files (x86)/LibreOffice/program/soffice.com",
  "/usr/bin/soffice", "/usr/bin/libreoffice", "/Applications/LibreOffice.app/Contents/MacOS/soffice"].find(p => fs.existsSync(p)) || null;
/* Eigenes LibreOffice-Profil, damit die Einstellungen des Nutzers unberührt bleiben */
const PROFIL = "file:///" + path.join(aus, "lo-profil").split(path.sep).join("/");
if (MODUS === "nativ" && !SOFFICE) { console.error("--modus nativ braucht LibreOffice (--soffice <pfad>)"); process.exit(2); }
const bin = arg("--chrome") || process.env.CHROME || ["C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe", "/usr/bin/google-chrome", "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find(p => fs.existsSync(p));
if (!bin) { console.error("Chrome/Edge nicht gefunden — mit --chrome <pfad> angeben."); process.exit(2); }

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".aff": "text/plain", ".dic": "text/plain" };
const srv = http.createServer(async (req, rq) => {
  const rel = decodeURIComponent(req.url.split("?")[0]);
  const datei = path.join(root, rel === "/" ? "/index.html" : rel);
  if (!datei.startsWith(root)) { rq.writeHead(403).end(); return; }
  try { const b = await fsp.readFile(datei); rq.writeHead(200, { "Content-Type": MIME[path.extname(datei)] || "application/octet-stream" }); rq.end(b); }
  catch { rq.writeHead(404).end(); }
});
await new Promise(r => srv.listen(0, "127.0.0.1", r));
const port = srv.address().port;
const profil = await fsp.mkdtemp(path.join(os.tmpdir(), "pqw-umlauf-chrome-"));
const DBG = 9334;
const chrome = spawn(bin, ["--headless=new", "--disable-gpu", "--no-first-run", `--remote-debugging-port=${DBG}`, `--user-data-dir=${profil}`, "about:blank"], { stdio: "ignore" });

let ziel = null;
for (let i = 0; i < 60 && !ziel; i++) { try { ziel = (await (await fetch(`http://127.0.0.1:${DBG}/json/list`)).json()).find(t => t.type === "page"); } catch {} if (!ziel) await new Promise(r => setTimeout(r, 250)); }
const ws = new WebSocket(ziel.webSocketDebuggerUrl); let id = 0; const offen = new Map();
await new Promise(r => ws.addEventListener("open", r));
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && offen.has(m.id)) { offen.get(m.id)(m); offen.delete(m.id); } });
const send = (method, params = {}) => new Promise(res => { const i = ++id; offen.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true });
  if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text); return r.result.result.value; };

/* Wie gespeichert und wie zurückgelesen wird, je Modus */
const SPEICHERN = { word: "await exportDoc()", odt: "blob=await odtBlob(doc())", nativ: "await exportHtml()" }[MODUS];
const ENDUNG = { word: "docx", odt: "odt", nativ: "html" }[MODUS];
const fang = `async()=>{let blob=null;const oZ=window.dateiZiel,oA=window.dateiAblegen;
  window.dateiZiel=async()=>null;window.dateiAblegen=async(n,b)=>{blob=b};
  try{${SPEICHERN}}finally{window.dateiZiel=oZ;window.dateiAblegen=oA}
  return new Uint8Array(await (blob instanceof Blob?blob:new Blob([blob])).arrayBuffer())}`;

try {
  await fsp.mkdir(aus, { recursive: true });
  await send("Page.navigate", { url: `http://127.0.0.1:${port}/index.html` });
  await new Promise(r => setTimeout(r, 2500));
  const lang = "Satz mit mehreren Woertern fuer den Blocksatz, damit die Zeile umbricht. ".repeat(4);
  /* Das Prüfdokument: jedes Merkmal einmal */
  const datei64 = await ev(`(async()=>{
    function jpg(w,h,f){const c=document.createElement("canvas");c.width=w;c.height=h;const x=c.getContext("2d");x.fillStyle=f;x.fillRect(0,0,w,h);return c.toDataURL("image/jpeg");}
    const d=blankDoc("Pruefung Umlauf");d.customTitle=true;
    d.fmt={n:"Prüfformat",key:"custom",w:210,h:297,m:[30,20,25,25],hd:12,fd:12,d:""};
    d.hdr={on:true,text:"Kopfzeile Pruefung",align:"center"};
    d.ftr={on:true,text:"Seite {seite} von {seiten}",align:"right"};
    d.footnotes=[{id:"f1",text:"Text der Fussnote."}];
    d.html='<h1>Titel Eins</h1>'
     +'<p>Normal <b>fett</b> <i>kursiv</i> <u>unterstrichen</u> <s>durchgestrichen</s> H<sub>2</sub>O x<sup>2</sup>.</p>'
     +'<p><span style="font-family:Georgia, serif">Georgia</span> und <span style="font-size:calc(16pt * var(--zoom,1))">sechzehn</span> und <span style="color:#c00000">rot</span> und <span style="background-color:#fbeb9b">markiert</span>.</p>'
     +'<h2>Kapitel Zwei</h2>'
     +'<p style="text-align:center">Zentriert</p><p style="text-align:right">Rechts</p><p style="text-align:justify">${lang}</p>'
     +'<p style="margin-left:2em">Eingerueckt</p>'
     +'<p>Tab:<span class="wtab" contenteditable="false">\\t</span>nach Tab und drei&nbsp;&nbsp; Leerzeichen.</p>'
     +'<p>Link: <a href="https://suvantra.eu/">Suvantra</a>.</p>'
     +'<p>Fussnote hier.<sup class="fn" data-fn="f1">1</sup></p>'
     +'<ol><li>Eins<ol><li>Unter a<ol><li>Unter i</li></ol></li></ol></li><li>Zwei</li></ol>'
     +'<p>Zwischentext</p>'
     +'<ol start="3"><li>Drei</li><li>Vier</li></ol>'
     +'<ul><li>Punkt<ul><li>Unterpunkt</li></ul></li></ul>'
     +'<h3>Abschnitt Drei</h3>'
     +'<table><tr><td colspan="2">Verbunden</td><td rowspan="2">Hoch</td></tr><tr><td>A</td><td>B</td></tr></table>'
     +'<figure class="fig" contenteditable="false" data-w="50" style="text-align:center"><img src="'+jpg(800,400,"#c33")+'" style="width:100%"><figcaption>Bildunterschrift</figcaption></figure>'
     +'<blockquote><p>Ein Zitat.</p></blockquote>'
     +'<div class="pgbreak" contenteditable="false" data-label="Seitenumbruch"></div>'
     +'<p>Nach dem Umbruch.</p>'
     +'<figure class="fig umfl" contenteditable="false" data-w="40" data-seite="rechts" style="text-align:right;width:40%"><img src="'+jpg(600,600,"#36c")+'" style="width:100%"></figure>'
     +'<p>${lang}</p><p>Schlussmarke</p>';
    S.docs=[d];S.active=d.id;S.mode="write";save();render();
    await new Promise(r=>setTimeout(r,800));
    return base64Von(await (${fang})());
  })()`);
  const eigen = path.join(aus, "pruefung." + ENDUNG);
  await fsp.writeFile(eigen, Buffer.from(datei64, "base64"));
  /* LibreOffice: word → .docx umwandeln, odt → unsere .odt neu speichern,
     nativ → HTML als Writer-Dokument öffnen */
  let fremd64 = "";
  if (SOFFICE) {
    const zielOrdner = path.join(aus, "lo");
    const filter = MODUS === "nativ" ? ["--infilter=HTML (StarWriter)"] : [];
    try {
      execFileSync(SOFFICE, ["-env:UserInstallation=" + PROFIL, "--headless", "--norestore", ...filter, "--convert-to", "odt:writer8", "--outdir", zielOrdner, eigen], { stdio: "ignore", timeout: 120000 });
      fremd64 = (await fsp.readFile(path.join(zielOrdner, "pruefung.odt"))).toString("base64");
    } catch (e) { console.log("LibreOffice-Schritt gescheitert: " + e.message); }
  }
  const erg = await ev(`(async()=>{
    const b=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0)).buffer;
    const A=${MODUS === "nativ" ? "null" : `await zipDokument("p.${ENDUNG}",b(${JSON.stringify(datei64)}))`};
    const B=${fremd64 ? `await zipDokument("p.odt",b(${JSON.stringify(fremd64)}))` : "null"};
    const merk=r=>{if(!r)return null;const t=document.createElement("div");t.innerHTML=r.html||"";const q=s=>t.querySelectorAll(s).length;
      const st=p=>[...t.querySelectorAll("[style]")].filter(e=>e.style[p]).length;
      return {"h1":q("h1"),"h2":q("h2"),"h3":q("h3"),"fett":q("b,strong"),"kursiv":q("i,em"),"unterstr.":q("u"),"durchgestr.":q("s,strike"),
       "hoch":q("sup:not(.fn):not(.en)"),"tief":q("sub"),"Schriftart":st("fontFamily"),"Schriftgroesse":st("fontSize"),"Farbe":st("color"),
       "Hervorhebung":st("backgroundColor")+q("mark"),"Ausrichtung":st("textAlign"),"Einzug":st("marginLeft")+st("paddingLeft"),
       "ol":q("ol"),"ul":q("ul"),"ol verschachtelt":q("ol ol"),"li":q("li"),"ol start":q("ol[start]"),
       "Listenart":[...t.querySelectorAll("ol,ul")].map(o=>o.getAttribute("data-ls")||"-").join("/"),
       "Tabelle":q("table"),"verbundene Zelle":q("[colspan]")+"/"+q("[rowspan]"),"Bild":q("img"),"Bild umflossen":q("figure.umfl"),"Bildunterschrift":q("figcaption"),
       "Zitat":q("blockquote"),"Seitenumbruch":q(".pgbreak"),"Link":q("a[href]"),"Fussnotenzeichen":q("sup.fn"),
       "Tab im Text":q(".wtab"),"3 Leerzeichen":/drei(\\s|&nbsp;|\\u00a0){3}Leer/.test(r.html.replace(/<[^>]+>/g,""))?1:0,
       "Fussnoten":(r.footnotes||[]).length,"Kopfzeile":r.hdr&&r.hdr.text?r.hdr.text:"-","Fusszeile":r.ftr&&r.ftr.text?r.ftr.text:"-",
       "Seitenformat":r.fmt?[r.fmt.w,r.fmt.h,(r.fmt.m||[]).join("/")].join(" "):"-"}};
    /* Fixpunkt: das Ergebnis erneut speichern und öffnen — muss gleich bleiben */
    const dq=doc(),merkHtml=dq.html,merkFn=dq.footnotes;
    const runde=async r=>{dq.html=r.html;dq.footnotes=r.footnotes||[];document.getElementById("editor").innerHTML=r.html;flush();
      return await zipDokument("x.${ENDUNG}",(await (${fang})()).buffer)};
    let fixpunkt=null;
    if(A){const A2=await runde(A),A3=await runde(A2);
      const ohneId=h=>String(h||"").replace(/data-(fn|en|n)="[^"]*"/g,"").replace(/src="data:[^"]*"/g,"");
      fixpunkt=ohneId(A2.html)===ohneId(A3.html)}
    dq.html=merkHtml;dq.footnotes=merkFn;document.getElementById("editor").innerHTML=merkHtml;flush();
    const Q={html:doc().html,footnotes:doc().footnotes,hdr:doc().hdr,ftr:doc().ftr,fmt:doc().fmt};
    return JSON.stringify({Q:merk(Q),A:merk(A),B:merk(B),Ahtml:A&&A.html,Bhtml:B&&B.html,fixpunkt});
  })()`);
  const { Q, A, B, Ahtml, Bhtml, fixpunkt } = JSON.parse(erg);
  await fsp.writeFile(path.join(aus, "import-a.html"), Ahtml || "");
  await fsp.writeFile(path.join(aus, "import-b.html"), Bhtml || "");
  const kopfA = { word: "Word", odt: "PQ-ODT", nativ: "—" }[MODUS], kopfB = { word: "LO-ODT", odt: "LO neu gesp.", nativ: "LO-Writer" }[MODUS];
  const breite = Math.max(...Object.keys(Q).map(k => k.length));
  let aOk = 0, bOk = 0; const n = Object.keys(Q).length;
  console.log("      " + "Merkmal".padEnd(breite) + "  " + "Original".padEnd(26) + kopfA.padEnd(26) + kopfB);
  for (const k of Object.keys(Q)) {
    const q = String(Q[k]), a = A ? String(A[k]) : "—", b = B ? String(B[k]) : "—";
    if (q === a) aOk++; if (q === b) bOk++;
    console.log((q === a ? "A" : "·") + (q === b ? "B" : "·") + "    " + k.padEnd(breite) + "  " + q.slice(0, 24).padEnd(26) + a.slice(0, 24).padEnd(26) + b.slice(0, 24));
  }
  if (fixpunkt !== null) console.log("\nUmlauf-Fixpunkt (" + kopfA + "): " + (fixpunkt ? "ja" : "NEIN"));
  console.log(`${kopfA}: ${A ? aOk + "/" + n : "—"}   ${kopfB}: ${B ? bOk + "/" + n : SOFFICE ? "gescheitert" : "ohne LibreOffice"}   (gleich dem Original) — Dateien in ${aus}`);
  if (MODUS !== "nativ" && (fixpunkt === false || aOk < n)) process.exitCode = 1;
} finally {
  ws.close(); chrome.kill(); srv.close();
}
