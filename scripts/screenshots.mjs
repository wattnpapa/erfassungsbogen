/**
 * Bildschirmfotos für das Web-Manifest (public/screenshots/).
 *
 * Android-Installationsdialoge und die freien PWA-Verzeichnisse zeigen nur dann
 * eine richtige Vorschau, wenn das Manifest `screenshots` mitbringt — ein Icon
 * allein reicht ihnen nicht. Aufnahmen sind Handarbeit, die veraltet; deshalb
 * dieses Skript: `npm run screenshots` nimmt sie reproduzierbar neu auf,
 * einmal breit (Desktop) und einmal schmal (Telefon).
 *
 * Startet selbst einen Vite-Dev-Server, sofern nicht EEB_BASE_URL auf einen
 * laufenden zeigt (gleiche Regel wie in den E2E-Tests, features/support/haken.ts).
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const PORT = 5373;
const BASIS_URL = process.env.EEB_BASE_URL ?? `http://localhost:${PORT}`;
const ZIEL = fileURLToPath(new URL("../public/screenshots/", import.meta.url));

// Die Maße stehen so auch im Manifest — beides muss zusammenpassen, sonst
// verwirft der Browser die Aufnahme.
const AUFNAHMEN = [
  { datei: "start-breit.png", breite: 1280, hoehe: 800 },
  { datei: "start-schmal.png", breite: 390, hoehe: 844 },
];

async function warteAufServer(url, versuche = 60) {
  for (let i = 0; i < versuche; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {
      /* Server noch nicht bereit */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Dev-Server unter ${url} nicht erreichbar geworden`);
}

const server = process.env.EEB_BASE_URL
  ? undefined
  : spawn("npx", ["vite", "--port", String(PORT), "--strictPort"], { stdio: "ignore", env: process.env });

try {
  await warteAufServer(BASIS_URL);
  await mkdir(ZIEL, { recursive: true });
  const browser = await chromium.launch();
  for (const { datei, breite, hoehe } of AUFNAHMEN) {
    const kontext = await browser.newContext({ viewport: { width: breite, height: hoehe }, deviceScaleFactor: 1 });
    // Der Dev-Server zeigt von sich aus die Debug-Leiste zur Plattform-Vorschau
    // (siehe src/app/debug-plattform.tsx). Auf einem Bildschirmfoto, das als
    // Vorschau der App dient, hat sie nichts zu suchen — gemerktes „0" schaltet
    // sie ab, ohne dass dafür ein Produktions-Build nötig wäre.
    await kontext.addInitScript(() => localStorage.setItem("eeb-debug", "0"));
    const seite = await kontext.newPage();
    await seite.goto(`${BASIS_URL}/`, { waitUntil: "networkidle" });
    await seite.screenshot({ path: ZIEL + datei });
    await seite.context().close();
    console.log(`${datei} (${breite}×${hoehe})`);
  }
  await browser.close();
} finally {
  server?.kill("SIGTERM");
}
