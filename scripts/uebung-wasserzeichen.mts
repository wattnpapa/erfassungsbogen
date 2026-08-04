/**
 * Erzeugt src/app/uebung-wasserzeichen.ts: das Wort „ÜBUNG" als reine
 * SVG-Kontur (Pfad), damit das Wasserzeichen in der PDF eine Grafik ist und
 * kein Text — sonst landet es beim Markieren/Kopieren aus der PDF mitten im
 * Bogeninhalt.
 *
 * Die Konturen stammen aus der Oberflächenschrift Archivo (variabel, Achse
 * wght; hier die Standardlage SemiBold) — dieselbe Schrift, die die App
 * benutzt. Sowohl fontkit (steckt in pdfmake/pdfkit) als auch die Schrift
 * (@fontsource-variable/archivo) sind bereits installiert, es braucht also
 * keine zusätzliche Abhängigkeit.
 *
 *   npm run wasserzeichen
 */

import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

const require = createRequire(import.meta.url);
// fontkit liegt als (transitive) Abhängigkeit von pdfmake im Baum und hat
// keine ESM-Typen — darum bewusst per require.
const fontkit = require("fontkit") as {
  openSync(pfad: string): {
    unitsPerEm: number;
    glyphForCodePoint(cp: number): { advanceWidth: number; path: FontPfad };
  };
};

interface FontPfad {
  bbox: { minX: number; minY: number; maxX: number; maxY: number };
  translate(x: number, y: number): FontPfad;
  scale(x: number, y: number): FontPfad;
  toSVG(): string;
}

const WORT = "ÜBUNG";
const SCHRIFT = require.resolve("@fontsource-variable/archivo/files/archivo-latin-wght-normal.woff2");
const ZIEL = join(import.meta.dirname, "..", "src", "app", "uebung-wasserzeichen.ts");

const font = fontkit.openSync(SCHRIFT);

// Buchstaben aneinanderreihen (Vorschubbreiten der Schrift, ohne Kerning —
// bei fünf Großbuchstaben nicht sichtbar) und dabei aus der Schrift-Y-Achse
// (nach oben) in die SVG-Y-Achse (nach unten) kippen.
const pfade: FontPfad[] = [];
let x = 0;
for (const zeichen of WORT) {
  const glyph = font.glyphForCodePoint(zeichen.codePointAt(0)!);
  pfade.push(glyph.path.translate(x, 0).scale(1, -1));
  x += glyph.advanceWidth;
}

const minY = Math.min(...pfade.map((p) => p.bbox.minY));
const maxY = Math.max(...pfade.map((p) => p.bbox.maxY));
const minX = Math.min(...pfade.map((p) => p.bbox.minX));
const maxX = Math.max(...pfade.map((p) => p.bbox.maxX));

// Auf den Nullpunkt schieben, damit die viewBox exakt das Wort umschließt.
// Ganze Font-Einheiten (1/1000 em) genügen: das Wasserzeichen ist seitenbreit,
// ein Tausendstel Geviert liegt weit unter der Druckauflösung.
const pfad = pfade
  .map((p) => p.translate(-minX, -minY).toSVG())
  .join(" ")
  .replace(/-?\d+(\.\d+)?/g, (n) => String(Math.round(Number(n))));

const quelle = `/**
 * Das Wort „ÜBUNG" als SVG-Kontur — GENERIERT, nicht von Hand ändern.
 * Erzeugt aus Archivo (SemiBold) von scripts/uebung-wasserzeichen.mts:
 *
 *   npm run wasserzeichen
 *
 * Als Kontur statt als Text, damit das Wasserzeichen der Übungsbögen in der
 * PDF eine Grafik ist: es lässt sich nicht markieren und verunreinigt nicht
 * den Text, den man aus der PDF herauskopiert.
 */

/** Pfaddaten in den Maßen der viewBox unten (Nullpunkt links oben). */
export const UEBUNG_PFAD =
  "${pfad}";

/** Breite der Kontur in denselben Einheiten wie UEBUNG_PFAD. */
export const UEBUNG_BREITE = ${Math.round(maxX - minX)};

/** Höhe der Kontur in denselben Einheiten wie UEBUNG_PFAD. */
export const UEBUNG_HOEHE = ${Math.round(maxY - minY)};
`;

writeFileSync(ZIEL, quelle);
console.log(`${ZIEL}: ${pfad.length} Zeichen Pfaddaten, ${Math.round(maxX - minX)} × ${Math.round(maxY - minY)}`);
