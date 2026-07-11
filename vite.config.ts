import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./": relative Pfade, damit der Build direkt auf GitHub Pages
// (Unterpfad /<repo>/) funktioniert.
export default defineConfig({
  base: "./",
  plugins: [react()],
});
