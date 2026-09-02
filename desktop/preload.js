/* Die einzige Brücke zwischen index.html und dem Hauptprozess.
   Bewusst winzig und namentlich aufgezählt: kein Node im Renderer, kein
   ipcRenderer im Fenster, nur diese zwei Aufrufe. Fehlt window.pqwDesktop —
   also im Browser —, nimmt index.html überall den bisherigen Weg. */
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("pqwDesktop", {
  platform: process.platform,
  /* Öffnet den Speichern-Dialog und schreibt das PDF direkt. */
  savePdf: (opts) => ipcRenderer.invoke("pqw:savePdf", opts),
  /* {html, text} der Zwischenablage — synchron, siehe main.js. */
  clipboardHtmlSync: () => ipcRenderer.sendSync("pqw:clipboard")
});
