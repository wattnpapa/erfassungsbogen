import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

// Footer-Version = Build-Version des Releases (Datums-Tag, z. B. 2026.07.11.20.30),
// im CI über APP_BUILD_VERSION gesetzt. Lokal Fallback auf package.json-Version.
const appVersion = process.env.APP_BUILD_VERSION || version;

// base "./": relative Pfade, damit der Build direkt auf GitHub Pages
// (Unterpfad /<repo>/) funktioniert.
export default defineConfig({
  base: "./",
  plugins: [react()],
  define: { __APP_VERSION__: JSON.stringify(appVersion) },
  // PORT kommt vom Claude-Code-Preview (autoPort); Fallback ist Vite-Standard 5173.
  server: { port: Number(process.env.PORT) || 5173 },
});
