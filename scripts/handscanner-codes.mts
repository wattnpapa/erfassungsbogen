/**
 * Erzeugt die Konfigurations-Strichcodes, die ein USB-Handscanner braucht,
 * damit er in deutscher Tastaturbelegung tippt — als SVG unter
 * public/bilder/handscanner/.
 *
 * Warum selbst erzeugen statt aus dem Handbuch kopieren: Der Inhalt eines
 * Programmier-Codes ist eine kurze Befehlszeichenfolge (bei Datalogic z. B.
 * „$CKBCO05" für Ländermodus = Deutschland). Die kennen wir; das Bild dazu ist
 * unser eigenes, sauber skalierbar und ohne fremdes Handbuchmaterial. Wir
 * nehmen ausschließlich die Codes auf, die für diese App gebraucht werden —
 * keine Ländertabellen, keine Symbologie-Einstellungen.
 *
 * Symbologie ist Data Matrix, wie in den Handbüchern der Geräte: Die
 * 2D-Imager lesen sie werkseitig, und sie bleibt auf dem Bildschirm auch klein
 * noch lesbar.
 *
 * Aufruf (Node ≥ 22): npm run handscanner-codes
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import bwipjs from "bwip-js/node";

const ZIEL = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "bilder", "handscanner");

interface Code {
  /** Dateiname ohne Endung. */
  datei: string;
  /** Befehlszeichenfolge, die der Scanner liest. */
  inhalt: string;
  /** Beschriftung unter dem Code (steht auch im alt-Text der Seite). */
  titel: string;
}

/**
 * Datalogic (Gryphon, QuickScan, Heron …): Ein Parameter wird zwischen zwei
 * „$P" gesetzt — aufrufen, Parameter lesen, verlassen. „$CKBCO" ist der
 * Ländermodus, „05" steht für Deutschland.
 */
const CODES: Code[] = [
  { datei: "datalogic-programmiermodus", inhalt: "$P", titel: "Datalogic: Programmiermodus aufrufen/verlassen" },
  { datei: "datalogic-belegung-deutschland", inhalt: "$CKBCO05", titel: "Datalogic: Tastaturbelegung Deutschland" },
  // Rückweg, wenn am Gerät etwas verstellt wurde: Der Code bringt seinen
  // Programmiermodus selbst mit ($P … ,P) und wird deshalb einzeln gescannt.
  // Danach steht auch die Belegung wieder auf USA — der Deutschland-Code
  // gehört also hinterher.
  { datei: "datalogic-werkseinstellung", inhalt: "$P,HA00,P", titel: "Datalogic: auf Werkseinstellung zurücksetzen" },
];

mkdirSync(ZIEL, { recursive: true });
for (const code of CODES) {
  const svg = bwipjs.toSVG({
    bcid: "datamatrix",
    text: code.inhalt,
    scale: 4,
    // Ruhezone: Ohne den weißen Rand erkennt ein Scanner den Code auf dem
    // Bildschirm oft nicht — 2 Module sind die Vorgabe für Data Matrix.
    padding: 2,
    backgroundcolor: "FFFFFF",
  });
  const datei = join(ZIEL, `${code.datei}.svg`);
  writeFileSync(datei, `<!-- ${code.titel} — Inhalt: ${code.inhalt} · erzeugt von scripts/handscanner-codes.mts -->\n${svg}\n`);
  console.log(`${code.datei}.svg — „${code.inhalt}"`);
}
