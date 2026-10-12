/* Schreibt Titel, Autor, Betreff, Stichwörter und Ersteller in ein PDF.

   Warum es das braucht: printToPDF übernimmt aus der Seite nur den <title>.
   Ein <meta name="author"> (so stand es bis 1.2 in index.html) landet nicht
   im PDF — nachgemessen 2026-10-12 mit Chrome 154: das Info-Verzeichnis
   trägt Title, Creator (die Browserkennung), Producer und die Daten, sonst
   nichts. Das Autorfeld im Exportdialog hatte also nie eine Wirkung.

   Wie: als inkrementelle Aktualisierung, so wie jedes PDF-Programm eine
   Datei nachträglich ändert — das neue Info-Objekt, ein Querverweis-
   abschnitt nur für dieses eine Objekt und ein Trailer mit /Prev auf den
   alten werden hinten angehängt. Der Inhalt davor bleibt Byte für Byte, wie
   Chromium ihn geschrieben hat (Lesezeichen, Tags, Schriften).

   Skia schreibt einen klassischen Querverweis mit „trailer“. Findet sich
   der nicht (ein künftiges Chromium mit Querverweis-Strom), kommt das PDF
   unverändert zurück: lieber ohne Autor als kaputt. */
function pdfText(s) {
  /* UTF-16BE mit BOM als Hex-String — deckt Umlaute, ą, ß und alles andere
     ab, ohne PDFDocEncoding und Klammer-Escapes. */
  const b = Buffer.from("﻿" + s, "utf16le");
  for (let i = 0; i < b.length; i += 2) { const t = b[i]; b[i] = b[i + 1]; b[i + 1] = t; }
  return "<" + b.toString("hex").toUpperCase() + ">";
}

function setPdfInfo(data, info = {}) {
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const s = buf.toString("latin1");
  const sx = /startxref\s+(\d+)\s+%%EOF\s*$/.exec(s);
  const ti = s.lastIndexOf("trailer");
  if (!sx || ti < 0 || ti > sx.index) return buf;
  const trailer = s.slice(ti, sx.index);
  const size = /\/Size\s+(\d+)/.exec(trailer);
  const root = /\/Root\s+(\d+\s+\d+\s+R)/.exec(trailer);
  if (!size || !root) return buf;
  const id = /\/ID\s*(\[[^\]]*\])/.exec(trailer);

  /* Erstellungs- und Änderungsdatum und den Producer aus dem alten
     Info-Objekt übernehmen; alles andere setzen wir selbst. */
  const behalten = [];
  const altInfo = /\/Info\s+(\d+)\s+(\d+)\s+R/.exec(trailer);
  if (altInfo) {
    const m = new RegExp("(?:^|\\s)" + altInfo[1] + "\\s+" + altInfo[2] + "\\s+obj\\s*<<([\\s\\S]*?)>>\\s*endobj").exec(s);
    if (m) for (const k of ["CreationDate", "ModDate", "Producer"]) {
      const v = new RegExp("/" + k + "\\s*(\\((?:\\\\.|[^\\\\)])*\\)|<[0-9A-Fa-f]*>)").exec(m[1]);
      if (v) behalten.push("/" + k + " " + v[1]);
    }
  }
  const felder = [];
  for (const [k, v] of [["Title", info.title], ["Author", info.author], ["Subject", info.subject],
    ["Keywords", info.keywords], ["Creator", info.creator]]) {
    if (v && String(v).trim()) felder.push("/" + k + " " + pdfText(String(v).trim()));
  }

  const n = +size[1];
  const vorne = buf.length + 1;   /* nach dem Zeilenumbruch, mit dem der Anhang beginnt */
  const obj = n + " 0 obj\n<<" + [...felder, ...behalten].join("\n") + ">>\nendobj\n";
  const xrefPos = vorne + Buffer.byteLength(obj, "latin1");
  const anhang = "\n" + obj +
    "xref\n" + n + " 1\n" + String(vorne).padStart(10, "0") + " 00000 n \n" +
    "trailer\n<</Size " + (n + 1) + "\n/Root " + root[1] + "\n/Info " + n + " 0 R" +
    (id ? "\n/ID " + id[1] : "") + "\n/Prev " + sx[1] + ">>\n" +
    "startxref\n" + xrefPos + "\n%%EOF\n";
  return Buffer.concat([buf, Buffer.from(anhang, "latin1")]);
}

module.exports = { setPdfInfo, pdfText };
