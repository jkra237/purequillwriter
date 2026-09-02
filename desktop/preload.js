/* Die einzige Brücke zwischen index.html und dem Hauptprozess.
   Bewusst winzig und namentlich aufgezählt: kein Node im Renderer, kein
   ipcRenderer im Fenster, nur diese Aufrufe. Fehlt window.pqwDesktop — also
   im Browser —, nimmt index.html überall den bisherigen Weg. */
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("pqwDesktop", {
  platform: process.platform,

  /* Öffnet den Speichern-Dialog und schreibt das PDF direkt. */
  savePdf: (opts) => ipcRenderer.invoke("pqw:savePdf", opts),

  /* {html, text} der Zwischenablage — synchron, siehe main.js. */
  clipboardHtmlSync: () => ipcRenderer.sendSync("pqw:clipboard"),

  /* Nativer Speichern-Dialog. Liefert den gewählten Pfad oder null bei
     Abbruch. Muss vor dem Erzeugen des Inhalts laufen (wie im Browser), aber
     hier läuft nichts ab — der native Dialog braucht keine frische Geste. */
  chooseSavePath: (opts) => ipcRenderer.invoke("pqw:chooseSave", opts),

  /* Schreibt rohe Bytes an einen zuvor gewählten Pfad. bytes ist ein
     Uint8Array; über den contextBridge kommt es als ArrayBuffer an, den
     main.js zurückverwandelt. So geht der Blob nie durch Chromiums File
     System Access API, deren Electron-Umsetzung Binärdaten verbiegt. */
  writeFile: (path, bytes) => ipcRenderer.invoke("pqw:writeFile", path, bytes),

  /* Nativer Öffnen-Dialog. Liefert [{name, bytes:ArrayBuffer}] oder []. */
  openFiles: (opts) => ipcRenderer.invoke("pqw:openFiles", opts)
});
