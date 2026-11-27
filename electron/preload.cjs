/**
 * Preload der Desktop-App: reicht der Seite genau zwei Dinge über die
 * contextBridge, sonst nichts — die Plattform (für die Frage, ob die
 * Screenshot-Sperre dort wirkt) und den Schalter der Sperre selbst.
 *
 * Läuft mit sandbox: true und contextIsolation: true. Ein Preload in der
 * Sandbox ist CommonJS und darf nur das eingeschränkte `electron`-Modul
 * laden; Node-Zugriff hat die Seite dadurch nicht. Der Hauptprozess prüft
 * Absender und Wert noch einmal (electron/main.js).
 */

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("eebDesktop", {
  plattform: process.platform,
  bildschirmschutz: (an) => ipcRenderer.invoke("eeb:bildschirmschutz", an === true),
});
