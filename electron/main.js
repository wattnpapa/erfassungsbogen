/**
 * Electron-Hauptprozess: lädt die gebaute Web-App (dist/) als Offline-Desktop-App.
 *
 * Der Renderer ist die unveränderte Web-App — kein Node-Zugriff, kein Preload.
 * Capacitor meldet hier istNativ() = false, daher greifen automatisch die
 * Web-Pfade (Download-Links statt Share-Sheet).
 */

import { app, BrowserWindow, dialog, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
// electron-updater ist CommonJS — Default-Import und destrukturieren.
import electronUpdater from "electron-updater";

const { autoUpdater } = electronUpdater;

const hier = path.dirname(fileURLToPath(import.meta.url));

// Im Dev-Modus (npm run electron:dev) läuft der Vite-Server; sonst dist/.
const devServerUrl = process.env.VITE_DEV_SERVER_URL;

/** Externe Links (GitHub, mailto …) im System öffnen statt im App-Fenster. */
function istExtern(url) {
  return !url.startsWith("file:") && !(devServerUrl && url.startsWith(devServerUrl));
}

function fensterErstellen() {
  const fenster = new BrowserWindow({
    width: 1100,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  fenster.webContents.setWindowOpenHandler(({ url }) => {
    if (istExtern(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  fenster.webContents.on("will-navigate", (ereignis, url) => {
    if (istExtern(url)) {
      ereignis.preventDefault();
      shell.openExternal(url);
    }
  });

  if (devServerUrl) {
    fenster.loadURL(devServerUrl);
  } else {
    fenster.loadFile(path.join(hier, "../dist/index.html"));
  }
}

/**
 * Auto-Update (wie S1-Control): beim Start gegen das neueste GitHub-Release
 * prüfen, Update im Hintergrund laden, dann Neustart anbieten. Wer "Später"
 * wählt, bekommt das Update beim nächsten Beenden automatisch installiert.
 */
function updatesEinrichten() {
  if (!app.isPackaged) return; // im Dev-Modus gibt es nichts zu aktualisieren

  // Die App ist für Offline-Betrieb gedacht: Fehler (kein Netz, kein
  // Release, unsignierter Build) still ignorieren, nie den Start stören.
  autoUpdater.on("error", () => {});

  autoUpdater.on("update-downloaded", async (info) => {
    const { response } = await dialog.showMessageBox({
      type: "info",
      message: `Update auf Version ${info.version} ist bereit.`,
      detail: "Jetzt neu starten, um das Update zu installieren? Bei „Später“ wird es beim nächsten Beenden installiert.",
      buttons: ["Jetzt neu starten", "Später"],
      defaultId: 0,
      cancelId: 1,
    });
    if (response === 0) autoUpdater.quitAndInstall();
  });

  autoUpdater.checkForUpdates().catch(() => {});
}

app.whenReady().then(() => {
  fensterErstellen();
  updatesEinrichten();
  // macOS: Klick aufs Dock-Icon öffnet ein neues Fenster, wenn keins offen ist.
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) fensterErstellen();
  });
});

// Windows/Linux: App beenden, wenn das letzte Fenster geschlossen wird.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
