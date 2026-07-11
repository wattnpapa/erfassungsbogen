import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

// base "./": relative Pfade, damit der Build direkt auf GitHub Pages
// (Unterpfad /<repo>/) funktioniert.
export default defineConfig({
  base: "./",
  plugins: [react()],
  define: { __APP_VERSION__: JSON.stringify(version) },
  // PORT kommt vom Claude-Code-Preview (autoPort); Fallback ist Vite-Standard 5173.
  server: { port: Number(process.env.PORT) || 5173 },
});
