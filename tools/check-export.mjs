/* Export-Regressionsprüfung — DOCX, EPUB, PDF in einem Durchlauf.
 *
 *   node tools/check-export.mjs [--keep] [--nur A] [--chrome <pfad>]
 *
 * Warum es das gibt: die Exportwege sind das eigentliche Produkt, sie sind
 * verwickelt, und ein Handtest übersieht genau die Dinge, die hier geprüft
 * werden. In einer einzigen Sitzung sind zwei Fehlerbehebungen jeweils zur
 * nächsten Regression geworden (Leerseiten beseitigt -> mehrseitige PDFs
 * zerstört; Kopfzeilenband reserviert -> Kopfzeile landete in der Fußzeile).
 * Beide hätte dieses Skript gefangen.
 *
 * Aufbau: ein winziger Dateiserver für das Repo, Chrome im Headless-Modus mit
 * DevTools-Protokoll, ein Testdokument über Runtime.evaluate, danach die
 * Prüfungen. Was der Browser besser kann (XML-Wohlgeformtheit per DOMParser,
 * der Umlauf Export->Import), läuft dort; die PDF-Vermessung läuft hier, weil
 * dafür der Contentstream ausgepackt werden muss.
 *
 * Der Druckpfad wird über eine MATRIX geprüft, nicht an einem Dokument: die
 * Bandberechnung verzweigt nach "Kopfzeile an/aus" und "Fußzeile an/aus"
 * (setPrintPage: hfOf(d,"hdr").on ? f.hd : f.m[0]), und das Seitenformat geht
 * ungeprüft in @page. Genau dort saßen die Fehler.
 *
 * Wichtig für das PDF: printToPDF wird mit denselben Optionen aufgerufen wie
 * in desktop/main.js (preferCSSPageSize, printBackground) — sonst misst man
 * etwas anderes als die Desktop-Fassung ausliefert.
 */
import http from "node:http";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const args = process.argv.slice(2);
const keep = args.includes("--keep");
const chromeArg = args[args.indexOf("--chrome") + 1];
const nur = args.includes("--nur") ? args[args.indexOf("--nur") + 1] : null;

/* Höhe einer Kopf-/Fußzeilenzeile in mm — .printhf steht auf 9pt, hfBandMm()
   rechnet mit Zeilenhöhe 1,35. Muss zur App passen. */
const ZEILE_MM = (9 * 25.4 / 72) * 1.35;
const band = (rand, abstand, zeilen) => zeilen ? Math.max(rand, abstand + ZEILE_MM * zeilen + 2) : rand;

/* ---------- Prüfmatrix ----------
   Deckt beide Zweige von setPrintPage/setPrintHF ab, dazu Querformat und das
   Seitenformat, mit dem der gemeldete Fehler auftrat (Word-Vorlage). */
const A4 = { w: 210, h: 297, m: [25, 20, 25, 25], hd: 12, fd: 12 };
const KONFIGS = [
  { id: "A", name: "A4, Kopf 3-zeilig + Fuß", fmt: A4, kopf: 3, fuss: true, voll: true },
  { id: "B", name: "A4, ohne Kopfzeile", fmt: A4, kopf: 0, fuss: true },
  { id: "C", name: "A4, ohne Fußzeile", fmt: A4, kopf: 3, fuss: false },
  { id: "D", name: "A4, ohne beides", fmt: A4, kopf: 0, fuss: false },
  { id: "E", name: "Querformat, Kopf 1-zeilig", fmt: { w: 297, h: 210, m: [20, 25, 20, 25], hd: 10, fd: 10 }, kopf: 1, fuss: true },
  { id: "F", name: "Word-Vorlage 25,4/12,7", fmt: { w: 210, h: 297, m: [25.4, 25.4, 25.4, 25.4], hd: 12.7, fd: 12.7 }, kopf: 3, fuss: true }
];

/* ---------- Testdokument ----------
   Deckt die Bestandteile ab, an denen bisher etwas kaputtging: ein Bild im
   Fließtext (Größe, Seitenumbruch), eine mehrzeilige Kopfzeile mit Datumsfeld
   (Anführungszeichen im Feldbefehl!), eine Fußzeile mit Seitenzahl, eine
   Fußnote, eine Tabelle, Anführungszeichen im Text, genug Absätze für mehrere
   Seiten — und als allerletzten Block eine Schlussmarke. */
const setup = cfg => `(async()=>{
  function jpg(w,h){const c=document.createElement("canvas");c.width=w;c.height=h;
    const x=c.getContext("2d");x.fillStyle="#c33";x.fillRect(0,0,w,h);return c.toDataURL("image/jpeg");}
  const d=blankDoc("Pruefdokument");
  d.customTitle=true;
  d.fmt=${JSON.stringify({ n: "Prüfformat", key: "custom", ...cfg.fmt, d: "" })};
  ${cfg.kopf ? `d.hdr={on:true,text:${JSON.stringify(["{datum}", "Kopf zwei", "Kopf drei"].slice(0, cfg.kopf).join("\n"))},align:"center"};`
             : `d.hdr={on:false,text:"",align:"center"};`}
  ${cfg.fuss ? `d.ftr={on:true,text:"Seite {seite} von {seiten}",align:"center"};`
             : `d.ftr={on:false,text:"",align:"center"};`}
  d.footnotes=[{id:"f1",text:'Fussnote mit "Zitat" und Apostroph \\u2019s.'}];
  let t="";for(let i=0;i<130;i++)t+="<p>Absatz "+i+" \\u2014 Fuelltext fuer den Seitenumbruch, mehrere Woerter lang.</p>";
  d.html='<h2>Kapitel &quot;eins&quot;</h2>'
    +'<p>Er sagte "hallo" &amp; es ist <b>fertig</b>.<sup class="fn" data-fn="f1">1</sup></p>'
    +'<figure class="fig" contenteditable="false" data-w="70" style="text-align:center">'
    +'<img src="'+jpg(1500,808)+'" style="width:70%"></figure>'
    +'<table><tr><td>A</td><td>B</td></tr><tr><td>C</td><td>D</td></tr></table>'
    +t
    +'<figure class="fig" contenteditable="false" data-w="30" style="text-align:center">'
    +'<img src="'+jpg(600,600)+'" style="width:30%"></figure>';
  S.docs=[d];S.active=d.id;S.mode="write";S.fitPage=false;S.zoom=1;save();
  render();
  await new Promise(r=>setTimeout(r,1500));
  paginate();
  return "bereit";
})()`;

/* ---------- DOCX/EPUB im Browser prüfen (nur Konfiguration A) ---------- */
const DATEIPRUEFUNG = String.raw`(async()=>{
  const P=new DOMParser();
  const befunde=[];
  const ok=(n,b,info)=>befunde.push({name:n,ok:!!b,info:info||""});

  async function fange(fn){
    const oZ=window.dateiZiel,oA=window.dateiAblegen;
    let blob=null;
    window.dateiZiel=async()=>null;
    window.dateiAblegen=async(n,b)=>{blob=b};
    try{ await fn(); } finally { window.dateiZiel=oZ; window.dateiAblegen=oA; }
    return blob?new Uint8Array(await blob.arrayBuffer()):null;
  }
  function entpacke(u8){
    const dv=new DataView(u8.buffer);const teile={};let i=0;
    while(i+4<=u8.length&&dv.getUint32(i,true)===0x04034b50){
      const m=dv.getUint16(i+8,true),cs=dv.getUint32(i+18,true);
      const nl=dv.getUint16(i+26,true),el=dv.getUint16(i+28,true);
      const name=new TextDecoder().decode(u8.slice(i+30,i+30+nl));
      teile[name]={m,data:u8.slice(i+30+nl+el,i+30+nl+el+cs)};
      i+=30+nl+el+cs;
    }
    return teile;
  }
  async function text(e){
    if(e.m===0)return new TextDecoder().decode(e.data);
    const ab=await new Response(new Blob([e.data]).stream()
      .pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer();
    return new TextDecoder().decode(new Uint8Array(ab));
  }
  const wohlgeformt=t=>!P.parseFromString(t,"application/xml").querySelector("parsererror");

  /* ================= DOCX ================= */
  const docx=await fange(()=>exportDoc());
  ok("docx: Datei erzeugt",docx&&docx.length>0,docx?docx.length+" Bytes":"nichts");
  if(docx){
    const teile=entpacke(docx);
    for(const n of ["[Content_Types].xml","_rels/.rels","word/document.xml","word/styles.xml",
                    "word/_rels/document.xml.rels","docProps/core.xml",
                    "word/header1.xml","word/footer1.xml","word/footnotes.xml"])
      ok("docx: "+n+" vorhanden",!!teile[n]);
    ok("docx: Bild eingebettet",Object.keys(teile).some(n=>n.startsWith("word/media/")));
    for(const [n,e] of Object.entries(teile)){
      if(!/\.(xml|rels)$/.test(n))continue;
      const t=await text(e);
      ok("docx: "+n+" wohlgeformt",wohlgeformt(t),wohlgeformt(t)?"":t.slice(0,120));
    }
    /* Der Umlauf Export -> Import -> Export ist der aussagekraeftigste Test:
       zweiter und dritter Durchgang muessen zeichengleich sein. */
    try{
      const b1=await zipDokument("x.docx",docx.buffer);
      const d=doc();
      d.html=b1.html; if(b1.footnotes)d.footnotes=b1.footnotes;
      if(b1.hdr)d.hdr=b1.hdr; if(b1.ftr)d.ftr=b1.ftr;
      document.getElementById("editor").innerHTML=d.html; flush();
      const docx2=await fange(()=>exportDoc());
      const b2=await zipDokument("x.docx",docx2.buffer);
      d.html=b2.html; if(b2.footnotes)d.footnotes=b2.footnotes;
      document.getElementById("editor").innerHTML=d.html; flush();
      const docx3=await fange(()=>exportDoc());
      const x2=await text(entpacke(docx2)["word/document.xml"]);
      const x3=await text(entpacke(docx3)["word/document.xml"]);
      ok("docx: Umlauf ist ein Fixpunkt",x2===x3,x2===x3?"":"Durchgang 2 und 3 unterscheiden sich");
    }catch(e){ ok("docx: Umlauf ist ein Fixpunkt",false,String(e)); }
  }

  /* ================= EPUB ================= */
  try{
    const blob=await epubBauen(doc(),{author:"Pruefer",split:1,titlepage:true});
    const epub=new Uint8Array(await blob.arrayBuffer());
    ok("epub: Datei erzeugt",epub.length>0,epub.length+" Bytes");
    const teile=entpacke(epub);
    ok("epub: mimetype zuerst und ungepackt",
       Object.keys(teile)[0]==="mimetype"&&teile.mimetype.m===0);
    ok("epub: container.xml vorhanden",!!teile["META-INF/container.xml"]);
    const opfName=Object.keys(teile).find(n=>n.endsWith(".opf"));
    ok("epub: package.opf vorhanden",!!opfName);
    for(const [n,e] of Object.entries(teile)){
      if(!/\.(xhtml|opf|ncx|xml)$/.test(n))continue;
      ok("epub: "+n+" wohlgeformt",wohlgeformt(await text(e)));
    }
    if(opfName){
      const opf=P.parseFromString(await text(teile[opfName]),"application/xml");
      const basis=opfName.replace(/[^/]+$/,"");
      const items=[...opf.querySelectorAll("manifest > item")];
      const fehlend=items.map(i=>basis+i.getAttribute("href")).filter(h=>!teile[h]);
      ok("epub: Manifest deckt sich mit dem Archiv",fehlend.length===0,fehlend.join(", "));
      const ids=new Set(items.map(i=>i.getAttribute("id")));
      const spine=[...opf.querySelectorAll("spine > itemref")].map(r=>r.getAttribute("idref"));
      ok("epub: Spine verweist nur auf Manifest-Eintraege",spine.every(id=>ids.has(id)));
      ok("epub: keine doppelten ids",ids.size===items.length);
    }
  }catch(e){ ok("epub: Datei erzeugt",false,String(e)); }
  return JSON.stringify(befunde);
})()`;

/* ---------- Druck vorbereiten (jede Konfiguration) ----------
   Denselben Weg gehen wie exportPdfDesktop(): Fußnotenliste anhängen,
   Bildschirm-Umbrüche entfernen, Druckrahmen bauen, @page setzen. */
const DRUCKVORBEREITUNG = String.raw`(async()=>{
  const d=doc(),ed=document.getElementById("editor");
  const liste=footnoteListHtml(d,"fnprint");
  if(liste){const w=document.createElement("div");w.innerHTML=liste;ed.appendChild(w.firstElementChild)}
  stripScreenPagination(ed);
  printFrame(ed);
  setPrintPage();
  await new Promise(r=>setTimeout(r,300));
  const f=fmtOf(d);
  return JSON.stringify({textspalteMm:f.w-f.m[1]-f.m[3],seitenAmBildschirm:pageCount});
})()`;

/* ---------- Dateiserver ---------- */
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css",
  ".svg": "image/svg+xml", ".json": "application/json", ".aff": "text/plain; charset=utf-8",
  ".dic": "text/plain; charset=utf-8", ".txt": "text/plain; charset=utf-8" };

function starteServer() {
  return new Promise(res => {
    const srv = http.createServer(async (req, rq) => {
      const rel = decodeURIComponent(req.url.split("?")[0]);
      const datei = path.join(root, rel === "/" ? "/index.html" : rel);
      if (!datei.startsWith(root)) { rq.writeHead(403).end(); return; }
      try {
        const b = await fsp.readFile(datei);
        rq.writeHead(200, { "Content-Type": MIME[path.extname(datei)] || "application/octet-stream" });
        rq.end(b);
      } catch { rq.writeHead(404).end("nicht gefunden"); }
    });
    srv.listen(0, "127.0.0.1", () => res({ srv }));
  });
}

/* ---------- Chrome ---------- */
function findeChrome() {
  if (chromeArg) return chromeArg;
  if (process.env.CHROME) return process.env.CHROME;
  return [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "/usr/bin/google-chrome", "/usr/bin/chromium",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  ].find(p => fs.existsSync(p));
}

/* ---------- CDP ---------- */
async function verbinde(port) {
  let ziel = null;
  for (let i = 0; i < 60 && !ziel; i++) {
    try {
      const liste = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      ziel = liste.find(t => t.type === "page");
    } catch { /* Chrome fährt noch hoch */ }
    if (!ziel) await new Promise(r => setTimeout(r, 250));
  }
  if (!ziel) throw new Error("Kein Chrome-Target erreichbar");
  const ws = new WebSocket(ziel.webSocketDebuggerUrl);
  let id = 0; const offen = new Map();
  await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });
  ws.addEventListener("message", e => {
    const m = JSON.parse(e.data);
    if (m.id && offen.has(m.id)) { offen.get(m.id)(m); offen.delete(m.id); }
  });
  const send = (method, params = {}) => new Promise(res => {
    const i = ++id; offen.set(i, res);
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  return { send, schliesse: () => ws.close() };
}

async function auswerten(send, ausdruck) {
  const r = await send("Runtime.evaluate", { expression: ausdruck, awaitPromise: true, returnByValue: true });
  const d = r.result;
  if (d.exceptionDetails) {
    const e = d.exceptionDetails;
    throw new Error((e.exception && e.exception.description) || e.text);
  }
  return d.result.value;
}

/* ---------- PDF vermessen ----------
   Die Koordinaten stecken in zwei geschachtelten Transformationen: eine
   globale (Skia: .24 0 0 -.24 0 H) und je Block eine weitere. y von oben
   = globalerMassstab * (blockMassstab * f + blockVersatz). Der Textmatrix-
   Wert allein ist irreführend. */
function pdfMessen(buf) {
  const s = buf.toString("latin1");
  const mb = (s.match(/\/MediaBox\s*\[([^\]]+)\]/) || [])[1].trim().split(/\s+/).map(Number);
  const [, , PW, PH] = mb;
  const mm = pt => pt / 72 * 25.4;

  const seiten = [];
  const re = /stream\r?\n/g; let m;
  while ((m = re.exec(s))) {
    const von = m.index + m[0].length;
    const bis = buf.indexOf(Buffer.from("endstream"), von);
    if (bis < 0) continue;
    let t = null;
    try { t = zlib.inflateSync(buf.slice(von, bis)).toString("latin1"); } catch { continue; }
    if (!/\bTf\b/.test(t) && !/\bDo\b/.test(t)) continue;

    const g = t.match(/^([-\d.]+) 0 0 ([-\d.]+) ([-\d.]+) ([-\d.]+) cm/m);
    const gs = g ? Math.abs(+g[1]) : 1;
    const zeilen = [], bilder = [];
    const blockRe = /([-\d.]+) 0 0 ([-\d.]+) ([-\d.]+) ([-\d.]+) cm([^]*?)(?=\n[-\d.]+ 0 0 [-\d.]+ [-\d.]+ [-\d.]+ cm|$)/g;
    let b;
    while ((b = blockRe.exec(t))) {
      const bs = +b[1], ty = +b[4], rumpf = b[5];
      for (const tm of rumpf.matchAll(/[-\d.]+ [-\d.]+ [-\d.]+ [-\d.]+ ([-\d.]+) ([-\d.]+) Tm/g))
        zeilen.push(mm(gs * (bs * +tm[2] + ty)));
    }
    /* Bilder: je "/Name Do" die ZULETZT davor gesetzte Matrix nehmen. Ein
       gieriges Muster greift sonst eine fremde cm (Maske, Muster) und meldet
       Phantasiemasse — bei der Schlussmarke kamen so 0,3 statt 49,5 mm. */
    for (const d of t.matchAll(/\/\w+\s+Do\b/g)) {
      const davor = t.slice(Math.max(0, d.index - 400), d.index);
      const cms = [...davor.matchAll(/([-\d.]+) 0 0 ([-\d.]+) ([-\d.]+) ([-\d.]+) cm/g)];
      const c = cms[cms.length - 1];
      if (c) bilder.push({ breiteMm: mm(Math.abs(+c[1]) * gs), hoeheMm: mm(Math.abs(+c[2]) * gs) });
    }
    if (zeilen.length || bilder.length) seiten.push({ zeilen: zeilen.sort((a, c) => a - c), bilder });
  }
  return { breiteMm: mm(PW), hoeheMm: mm(PH), seiten };
}

/* ---------- Lauf ---------- */
const befunde = [];
const ok = (name, bedingung, info = "") => befunde.push({ name, ok: !!bedingung, info });

let server, chrome, cdp;
try {
  const bin = findeChrome();
  if (!bin) { console.error("Chrome/Edge nicht gefunden — mit --chrome <pfad> angeben."); process.exit(2); }

  ({ srv: server } = await starteServer());
  const port = server.address().port;
  const profil = await fsp.mkdtemp(path.join(process.env.TEMP || "/tmp", "pqw-pruef-"));
  const dbg = 9333;

  chrome = spawn(bin, ["--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run",
    `--remote-debugging-port=${dbg}`, `--user-data-dir=${profil}`, "about:blank"], { stdio: "ignore" });

  cdp = await verbinde(dbg);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");

  for (const cfg of KONFIGS) {
    if (nur && cfg.id !== nur) continue;
    /* Frisch laden: der Druckrahmen des vorigen Durchgangs haengt sonst noch
       in der Seite, und localStorage traegt das alte Dokument. */
    await cdp.send("Page.navigate", { url: `http://127.0.0.1:${port}/index.html` });
    await new Promise(r => setTimeout(r, 2500));
    await auswerten(cdp.send, setup(cfg));

    if (cfg.voll) befunde.push(...JSON.parse(await auswerten(cdp.send, DATEIPRUEFUNG)));

    const { textspalteMm, seitenAmBildschirm } = JSON.parse(await auswerten(cdp.send, DRUCKVORBEREITUNG));
    const antwort = await cdp.send("Page.printToPDF", {
      printBackground: true, preferCSSPageSize: true,
      generateDocumentOutline: true, generateTaggedPDF: true
    });
    const P = `pdf ${cfg.id} (${cfg.name}): `;
    if (!antwort.result || !antwort.result.data) { ok(P + "erzeugt", false, "printToPDF lieferte nichts"); continue; }

    const pdf = Buffer.from(antwort.result.data, "base64");
    if (keep) await fsp.writeFile(path.join(root, `pruef-export-${cfg.id}.pdf`), pdf);
    const g = pdfMessen(pdf);
    const f = cfg.fmt;

    ok(P + "Blattmass", Math.abs(g.breiteMm - f.w) < 1 && Math.abs(g.hoeheMm - f.h) < 1,
       `${g.breiteMm.toFixed(1)} x ${g.hoeheMm.toFixed(1)} mm, erwartet ${f.w} x ${f.h}`);
    ok(P + "mehrseitig", g.seiten.length >= 2, g.seiten.length + " Seiten");
    /* Weniger Seiten als am Bildschirm heisst: Inhalt wurde abgeschnitten. */
    ok(P + "Seitenzahl passt zum Bildschirm", g.seiten.length >= seitenAmBildschirm,
       `${g.seiten.length} im PDF, ${seitenAmBildschirm} am Bildschirm`);

    const bandOben = band(f.m[0], f.hd, cfg.kopf);
    const bandUnten = band(f.m[2], f.fd, cfg.fuss ? 1 : 0);
    const satzUnten = f.h - bandUnten;
    /* Nach y entdoppeln: eine Fusszeile "Seite 1 von 8" besteht aus mehreren
       Textlaeufen (die Felder werden einzeln gesetzt), ist aber eine Zeile. */
    const zeilenAuf = ys => [...new Set(ys.map(y => y.toFixed(1)))];
    const sollKopf = cfg.kopf, sollFuss = cfg.fuss ? 1 : 0;
    let kopfFalsch = [], fussFalsch = [];
    g.seiten.forEach((s, i) => {
      const kopf = zeilenAuf(s.zeilen.filter(y => y < bandOben - 1));
      const fuss = zeilenAuf(s.zeilen.filter(y => y > satzUnten + 1));
      if (kopf.length !== sollKopf) kopfFalsch.push(`S${i + 1}: ${kopf.length}`);
      if (fuss.length !== sollFuss) fussFalsch.push(`S${i + 1}: ${fuss.length}`);
    });
    /* Zaehlt GENAU, statt nur "steht da etwas": sonst gilt hineingerutschter
       Fliesstext als Kopfzeile und der Fehler faellt nicht auf. */
    ok(P + `Kopfband hat ${sollKopf} Zeilen auf jeder Seite`, kopfFalsch.length === 0, kopfFalsch.slice(0, 4).join(" | "));
    ok(P + `Fussband hat ${sollFuss} Zeile(n) auf jeder Seite`, fussFalsch.length === 0, fussFalsch.slice(0, 4).join(" | "));

    const bilder = g.seiten.flatMap(s => s.bilder);
    const soll70 = textspalteMm * 0.7, soll30 = textspalteMm * 0.3;
    const bild = bilder.find(b => Math.abs(b.breiteMm - soll70) < 3);
    ok(P + "Bildbreite = 70% der Textspalte", !!bild,
       bild ? `${bild.breiteMm.toFixed(1)} mm, erwartet ${soll70.toFixed(1)} mm`
            : "gefunden: " + (bilder.map(b => b.breiteMm.toFixed(1)).join(", ") || "keine"));
    if (bild) ok(P + "Bild nicht verzerrt",
      Math.abs(bild.breiteMm / bild.hoeheMm - 1500 / 808) < 0.05,
      `Verhaeltnis ${(bild.breiteMm / bild.hoeheMm).toFixed(3)}`);
    /* Die Schlussmarke steht als letzter Block — fehlt sie, ist das Ende
       abgeschnitten, was die blosse Seitenzahl nicht verraet. */
    ok(P + "Dokumentende erreicht (Schlussmarke)",
       bilder.some(b => Math.abs(b.breiteMm - soll30) < 3),
       "gefunden: " + (bilder.map(b => b.breiteMm.toFixed(1)).join(", ") || "keine"));
  }
} catch (e) {
  ok("Durchlauf ohne Ausnahme", false, String((e && e.stack) || e));
} finally {
  try { cdp && cdp.schliesse(); } catch {}
  try { chrome && chrome.kill(); } catch {}
  try { server && server.close(); } catch {}
}

/* ---------- Bericht ---------- */
const fehler = befunde.filter(b => !b.ok);
const breite = Math.min(62, Math.max(...befunde.map(b => b.name.length), 10));
for (const b of befunde)
  console.log(`${b.ok ? "  ok  " : "FEHLT "} ${b.name.padEnd(breite)} ${b.info}`);
console.log(`\n${befunde.length - fehler.length}/${befunde.length} Prüfungen bestanden`);
if (fehler.length) {
  console.log("\nFehlgeschlagen:");
  for (const b of fehler) console.log("  - " + b.name + (b.info ? ": " + b.info : ""));
}
process.exit(fehler.length ? 1 : 0);
