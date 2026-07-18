import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

// Footer-Version = Build-Version des Releases (Datums-Tag, z. B. 2026.07.11.20.30),
// im CI über APP_BUILD_VERSION gesetzt. Lokal Fallback auf package.json-Version.
const appVersion = process.env.APP_BUILD_VERSION || version;

// base "./": relative Pfade, damit der Build direkt auf GitHub Pages
// (Unterpfad /<repo>/) funktioniert.
export default defineConfig({
  base: "./",
  plugins: [
    react(),
    // Service Worker nur für die im Browser aufgerufene Web-App (erfassungsbogen.app):
    // cached die App-Shell (HTML/JS/CSS, Icons, manifest, das eingebaute THW-OV-
    // Verzeichnis steckt im JS-Bundle), damit die Seite auch offline startet.
    // In der Capacitor-/Electron-App wird der SW bewusst NICHT registriert
    // (siehe src/app/aktualisierung.tsx); die Datei liegt dort nur ungenutzt.
    VitePWA({
      // "prompt": neue Version im Hintergrund laden, aber erst nach Nutzer-Klick
      // aktivieren. Kein Auto-Reload — ein Bogen wird evtl. gerade ausgefüllt.
      registerType: "prompt",
      // Wir registrieren selbst und nur im Web (native Guard), kein Auto-Inject.
      injectRegister: false,
      // Eigenes public/manifest.webmanifest behalten, nicht überschreiben.
      manifest: false,
      workbox: {
        // App-Shell + statische Assets precachen (Dateien mit Hash im Namen).
        globPatterns: ["**/*.{js,css,html,svg,png,webmanifest}"],
        // Das Haupt-Bundle (React, pdfmake, THW-OV-Verzeichnis …) ist ~3 MB und
        // damit größer als Workbox' 2-MiB-Standard. Es IST die App-Shell und muss
        // für den Offline-Start precacht werden – Limit entsprechend anheben.
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // SPA nutzt Hash-Routing; index.html als Fallback für Navigationen.
        navigateFallback: "index.html",
        // .well-known (Universal-/App-Links), statische Extra-Seiten wie
        // datenschutz.html und Datei-Downloads (Beispiel-PDFs) NICHT auf die
        // App-Shell umbiegen — Klicks auf <a download> sind Navigations-Requests,
        // ohne Ausnahme würde der SW statt des PDFs die index.html ausliefern.
        navigateFallbackDenylist: [/^\/\.well-known\//, /\/[^/]+\.(?:html|json|txt|xml|pdf)$/],
        // Alte Precaches beim Versionswechsel entsorgen (kein Aggressiv-Cache).
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  define: { __APP_VERSION__: JSON.stringify(appVersion) },
  build: {
    // Die Beispielbögen (examples/**/*.json) werden per Glob als URL eingebunden
    // und erst beim Anklicken geladen. Ohne diese Ausnahme würde Vite alle
    // Bögen unter 4 KB als data:-URL ins Haupt-Bundle inlinen — sie lägen dann
    // bei jedem App-Start im Speicher, statt nur bei Bedarf geladen zu werden.
    assetsInlineLimit: (datei) => (/examples\/.*\.json$/.test(datei) ? false : undefined),
  },
  // PORT kommt vom Claude-Code-Preview (autoPort); Fallback ist Vite-Standard 5173.
  server: { port: Number(process.env.PORT) || 5173 },
});
