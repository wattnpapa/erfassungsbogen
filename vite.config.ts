import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./": relative Pfade, damit der Build direkt auf GitHub Pages
// (Unterpfad /<repo>/) funktioniert.
export default defineConfig({
  base: "./",
  plugins: [react()],
  // PORT kommt vom Claude-Code-Preview (autoPort); Fallback ist Vite-Standard 5173.
  server: { port: Number(process.env.PORT) || 5173 },
});
