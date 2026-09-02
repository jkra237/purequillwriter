/* PureQuill Writer — Electron-Hauptprozess.
   Bewusst dünn: das Programm selbst ist unverändert dieselbe index.html wie
   die Webfassung. Hier stehen nur die drei Dinge, die eine Webseite nicht
   kann — ein eigenes Ursprungsschema, PDF ohne Druckdialog, und die
   Zwischenablage mit Formatierung. */
const { app, BrowserWindow, Menu, dialog, ipcMain, clipboard, protocol, net, shell } = require("electron");
const path = require("node:path");
const fs = require("node:fs/promises");
const { pathToFileURL } = require("node:url");

const APP_DIR = path.join(__dirname, "app");

/* Warum ein eigenes Schema statt loadFile()?
   Unter file:// blockiert Chromium fetch() auf Nachbardateien — die
   Rechtschreibprüfung holt ihre Wörterbücher aber genau so. Und file:// hat
   keinen stabilen Ursprung, an dem localStorage/IndexedDB hängen könnten:
   der gesamte Programmstand läge auf wackligem Grund. pqw://local ist ein
   richtiger, gleichbleibender Ursprung — damit funktionieren fetch, Speicher
   und die Sicherheitsvorgaben wie im Browser. */
protocol.registerSchemesAsPrivileged([{
  scheme: "pqw",
  privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true }
}]);

function serveApp() {
  protocol.handle("pqw", async (req) => {
    const url = new URL(req.url);
    let rel = decodeURIComponent(url.pathname);
    if (rel === "" || rel === "/") rel = "/index.html";
    const file = path.join(APP_DIR, path.normalize(rel));
    /* Kein Ausbrechen aus dem App-Ordner über ../ */
    if (!file.startsWith(APP_DIR)) return new Response("Forbidden", { status: 403 });
    try {
      return await net.fetch(pathToFileURL(file).toString());
    } catch {
      return new Response("Not found", { status: 404 });
    }
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#ffffff",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  win.once("ready-to-show", () => win.show());
  win.loadURL("pqw://local/index.html");
  /* Links im Dokument gehören in den Systembrowser, nicht in ein zweites
     Programmfenster ohne Adresszeile. */
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  return win;
}

/* Gar kein Anwendungsmenü: das Programm hat seine eigene Leiste (Datei,
   Ansicht, Format, Tools), und ein Electron-Menü würde die Alt-Taste
   abfangen — genau die, auf der das ganze Tastenschema Alt+⇧+… aufbaut.
   Die Bearbeiten-Kürzel (Strg+C/V/X/Z/Y) behandelt Chromium in einem
   contenteditable ohnehin selbst. */
Menu.setApplicationMenu(null);

/* PDF ohne Druckdialog. printBackground und preferCSSPageSize sind die
   beiden Zusagen, die der Browserweg nicht geben kann; die beiden generate*-
   Schalter liefern Lesezeichen aus den Überschriften und ein getaggtes PDF. */
ipcMain.handle("pqw:savePdf", async (e, opts = {}) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    defaultPath: opts.suggestedName || "Dokument.pdf",
    filters: [{ name: "PDF", extensions: ["pdf"] }]
  });
  if (canceled || !filePath) return { canceled: true };
  const data = await e.sender.printToPDF({
    printBackground: true,
    preferCSSPageSize: true,
    generateDocumentOutline: opts.outline !== false,
    generateTaggedPDF: true
  });
  await fs.writeFile(filePath, data);
  return { ok: true, path: filePath };
});

/* Synchron, damit zwischen Menüklick und dem Einfügen nichts passiert, was
   die Schreibmarke verlieren könnte. Der Lesevorgang selbst ist sofort da. */
ipcMain.on("pqw:clipboard", (e) => {
  e.returnValue = { html: clipboard.readHTML() || "", text: clipboard.readText() || "" };
});

/* Nativer Speichern-Dialog + Bytes schreiben. index.html ruft erst
   chooseSave (Pfad holen, solange nichts gebaut ist), dann writeFile mit den
   fertigen Bytes. Bewusst getrennt, damit der Ablauf dem Browserweg gleicht;
   der native Dialog hat aber keine ablaufende Freigabe. */
const SAVE_FILTERS = {
  docx: { name: "Word-Dokument", extensions: ["docx"] },
  epub: { name: "EPUB", extensions: ["epub"] },
  pdf:  { name: "PDF", extensions: ["pdf"] },
  html: { name: "Webseite", extensions: ["html", "htm"] },
  md:   { name: "Markdown", extensions: ["md"] },
  txt:  { name: "Text", extensions: ["txt"] },
  csv:  { name: "Tabelle (CSV)", extensions: ["csv"] },
  pqw:  { name: "PureQuill", extensions: ["pqw"] },
  json: { name: "PureQuill", extensions: ["json", "pqw"] }
};
ipcMain.handle("pqw:chooseSave", async (e, opts = {}) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  const name = opts.suggestedName || "Dokument";
  const ext = (name.match(/[.]([a-z0-9]+)$/i) || [, ""])[1].toLowerCase();
  const filters = [];
  if (SAVE_FILTERS[ext]) filters.push(SAVE_FILTERS[ext]);
  filters.push({ name: "Alle Dateien", extensions: ["*"] });
  const { canceled, filePath } = await dialog.showSaveDialog(win, { defaultPath: name, filters });
  return canceled ? null : filePath;
});
ipcMain.handle("pqw:writeFile", async (e, filePath, bytes) => {
  await fs.writeFile(filePath, Buffer.from(bytes));
  return { ok: true };
});

/* Nativer Öffnen-Dialog: liefert die Dateien gleich als Bytes mit, damit
   index.html sie wie einen <input type=file> behandeln kann. */
ipcMain.handle("pqw:openFiles", async (e, opts = {}) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    properties: ["openFile", ...(opts.multiple ? ["multiSelections"] : [])],
    filters: opts.filters || [{ name: "Alle Dateien", extensions: ["*"] }]
  });
  if (canceled) return [];
  const out = [];
  for (const fp of filePaths) {
    const buf = await fs.readFile(fp);
    out.push({ name: require("node:path").basename(fp), bytes: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) });
  }
  return out;
});

/* Ein zweiter Start (etwa per Doppelklick auf eine .pqw) holt das
   vorhandene Fenster nach vorn, statt ein zweites zu öffnen — sonst liefen
   zwei Programme auf demselben Browserspeicher. */
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    const [win] = BrowserWindow.getAllWindows();
    if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
  });
  app.whenReady().then(() => {
    serveApp();
    createWindow();
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
  app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
}
