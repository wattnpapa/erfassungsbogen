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
  // Electron: electron-builder erzeugt daraus icns/ico für macOS/Windows/Linux.
  ["public/icon.svg", 1024, "build/icon.png"],
  ["public/icon-square.svg", 512, "public/icons/maskable-512.png"],
  ["public/icon-square.svg", 192, "public/icons/maskable-192.png"],
  ["public/icon-square.svg", 180, "public/apple-touch-icon.png"],
  ["public/icon.svg", 512, "public/icons/icon-512.png"],
  ["public/icon.svg", 192, "public/icons/icon-192.png"],
  ["public/icon.svg", 64, "public/icons/icon-64.png"],
  ["public/icon.svg", 32, "public/icons/icon-32.png"],
];

// Android-Launcher-Icons direkt in die Ressourcen-Ordner der Plattform.
// icon-foreground.svg: transparenter Adaptive-Icon-Foreground (Safe-Zone),
// der Hintergrund-Verlauf liegt als Drawable in res/drawable/.
// icon.svg/icon-round.svg: Legacy-Icons für Android 7.x (minSdk 24 < 26).
const androidRes = "android/app/src/main/res";
const androidDichten = [
  ["mdpi", 48, 108],
  ["hdpi", 72, 162],
  ["xhdpi", 96, 216],
  ["xxhdpi", 144, 324],
  ["xxxhdpi", 192, 432],
];
for (const [dichte, launcherPx, foregroundPx] of androidDichten) {
  auftraege.push(
    ["public/icon.svg", launcherPx, `${androidRes}/mipmap-${dichte}/ic_launcher.png`],
    ["public/icon-round.svg", launcherPx, `${androidRes}/mipmap-${dichte}/ic_launcher_round.png`],
    ["public/icon-foreground.svg", foregroundPx, `${androidRes}/mipmap-${dichte}/ic_launcher_foreground.png`],
  );
}

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
