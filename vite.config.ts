import { readFileSync } from "node:fs";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { transform } from "esbuild";

const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

// Footer-Version = Build-Version des Releases (Datums-Tag, z. B. 2026.07.11.20.30),
// im CI über APP_BUILD_VERSION gesetzt. Lokal Fallback auf package.json-Version.
const appVersion = process.env.APP_BUILD_VERSION || version;

/**
 * Setzt Version und Build-Datum in die strukturierten Daten der index.html ein
 * (%APP_VERSION% / %BUILD_DATE%). Suchmaschinen werten `dateModified` als
 * Frische-Signal — von Hand gepflegt wäre es nach dem nächsten Release falsch,
 * und ein falsches Datum ist schlechter als keines.
 */
function bauStempel() {
  return {
    name: "eeb-baustempel",
    transformIndexHtml(html: string) {
      return html
        .replaceAll("%APP_VERSION%", appVersion)
        .replaceAll("%BUILD_DATE%", new Date().toISOString().slice(0, 10));
    },
  };
}

/**
 * Minifiziert den Inline-<style>-Block der index.html im Build. Das Design-Token-
 * CSS liegt bewusst inline (kein zweiter Request vor dem ersten Rendern), aber
 * Vite fasst Inline-CSS nicht an — unminifiziert gingen ~10 KB Kommentare und
 * Einrückung mit jedem Seitenaufruf über die Leitung.
 */
function inlineCssMinify(): Plugin {
  return {
    name: "eeb-inline-css-minify",
    apply: "build",
    async transformIndexHtml(html: string) {
      const teile = html.split(/(<style>[\s\S]*?<\/style>)/);
      for (let i = 0; i < teile.length; i++) {
        const css = teile[i].match(/^<style>([\s\S]*)<\/style>$/);
        if (!css) continue;
        const { code } = await transform(css[1], { loader: "css", minify: true });
        teile[i] = `<style>${code.trim()}</style>`;
      }
      return teile.join("");
    },
  };
}

/**
 * Zieht das gebaute Stylesheet (nur die @font-face-Regeln von Archivo, ~1 KB)
 * in die index.html hinein. Als externe Datei ist es der einzige
 * render-blockierende Request — eine ganze Netz-Runde vor dem ersten Rendern
 * für drei Regeln, die dank font-display:swap ohnehin nicht sofort greifen.
 */
function fontCssInline(): Plugin {
  return {
    name: "eeb-font-css-inline",
    apply: "build",
    enforce: "post",
    generateBundle(_optionen, bundle) {
      const html = bundle["index.html"];
      const cssName = Object.keys(bundle).find((n) => n.endsWith(".css"));
      if (!html || html.type !== "asset" || !cssName) return;
      const css = bundle[cssName];
      if (css.type !== "asset") return;
      // Die Font-Pfade sind relativ zum assets/-Ordner; im HTML an der
      // Seitenwurzel muss der Ordner mit in den Pfad.
      const regeln = String(css.source).trim().replaceAll("url(./", "url(./assets/");
      const link = new RegExp(`<link rel="stylesheet"[^>]*href="[^"]*${cssName.split("/").pop()}"[^>]*>`);
      if (!link.test(String(html.source))) return;
      html.source = String(html.source).replace(link, `<style>${regeln}</style>`);
      delete bundle[cssName];
    },
  };
}

// base "./": relative Pfade, damit der Build direkt auf GitHub Pages
// (Unterpfad /<repo>/) funktioniert.
export default defineConfig({
  base: "./",
  plugins: [
    react(),
    bauStempel(),
    inlineCssMinify(),
    fontCssInline(),
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
        // woff2 gehört zwingend dazu: die Oberflächenschrift liegt im Bundle
        // (kein CDN), fehlte sie im Precache, fiele die App offline auf die
        // Systemschrift zurück.
        globPatterns: ["**/*.{js,css,html,svg,png,webmanifest,woff2}"],
        // Die Manifest-Screenshots braucht nur der Installationsdialog des
        // Browsers, nicht die laufende App — sie gehören nicht in den
        // Offline-Vorrat, den jedes Gerät beim ersten Aufruf mitlädt.
        globIgnores: ["screenshots/**"],
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
