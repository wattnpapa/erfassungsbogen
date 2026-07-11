// Rendert die App-Icons aus den SVG-Mastern in public/.
// Aufruf: npm run icons
import { Resvg } from "@resvg/resvg-js";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const wurzel = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// [Quelle, Kantenlänge px, Ziel]
// icon-square.svg: vollflächig, ohne vorgerundete Ecken — Master für
// iOS/Android (die Systeme maskieren selbst) und maskable-PWA-Icons.
// icon.svg: mit gerundeten Ecken — Favicon und PWA "any".
const auftraege = [
  ["public/icon-square.svg", 1024, "public/icons/icon-1024.png"],
  ["public/icon-square.svg", 512, "public/icons/maskable-512.png"],
  ["public/icon-square.svg", 192, "public/icons/maskable-192.png"],
  ["public/icon-square.svg", 180, "public/apple-touch-icon.png"],
  ["public/icon.svg", 512, "public/icons/icon-512.png"],
  ["public/icon.svg", 192, "public/icons/icon-192.png"],
  ["public/icon.svg", 64, "public/icons/icon-64.png"],
  ["public/icon.svg", 32, "public/icons/icon-32.png"],
];

for (const [quelle, groesse, ziel] of auftraege) {
  const svg = readFileSync(resolve(wurzel, quelle));
  const png = new Resvg(svg, {
    fitTo: { mode: "width", value: groesse },
  }).render().asPng();
  const zielPfad = resolve(wurzel, ziel);
  mkdirSync(dirname(zielPfad), { recursive: true });
  writeFileSync(zielPfad, png);
  console.log(`${ziel} (${groesse}×${groesse}, ${(png.length / 1024).toFixed(1)} KiB)`);
}
