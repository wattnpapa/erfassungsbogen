/**
 * Schreibt die Kopfnavigation (src/app/kopfnav.ts) als statisches HTML in das
 * Start-Gerüst von index.html — zwischen die beiden Marken.
 *
 * Aufruf: `node --import tsx scripts/kopfnav.mts`
 *
 * Warum erzeugt statt von Hand gepflegt: Die Leiste steht im ausgelieferten
 * HTML (sie ist das Erste, was Auge und Crawler sehen) und noch einmal in der
 * React-Ansicht, die das Gerüst beim Mount ersetzt. Weichen beide voneinander
 * ab, springt die Seite beim Mount. src/test/kopfnav.test.ts prüft, dass der
 * Block hier aktuell ist; scripts/content-nav.mts setzt dieselbe Quelle in die
 * statischen Seiten unter public/.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { MARKE_ANFANG, MARKE_ENDE, kopfnavHtml } from "../src/app/kopfnav.js";

const DATEI = join(import.meta.dirname, "..", "index.html");
const html = readFileSync(DATEI, "utf8");

const anfang = html.indexOf(MARKE_ANFANG);
const ende = html.indexOf(MARKE_ENDE);
if (anfang < 0 || ende < anfang) throw new Error("Marken fehlen oder stehen verkehrt in index.html");

// Einzug 4: Die Leiste sitzt im Gerüst innerhalb von <div id="app">.
// Hülle `div`: Der Kopfbalken darunter ist der Seitenkopf (siehe NavHuelle).
const neu =
  html.slice(0, anfang + MARKE_ANFANG.length) +
  "\n" +
  kopfnavHtml("", "    ", "div") +
  "\n    " +
  html.slice(ende);

if (neu === html) console.log("index.html ist bereits aktuell.");
else {
  writeFileSync(DATEI, neu);
  console.log("index.html aktualisiert.");
}
