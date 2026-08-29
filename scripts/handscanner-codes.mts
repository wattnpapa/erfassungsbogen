/**
 * Konfigurations-Strichcodes für USB-Handscanner: erzeugt die SVGs unter
 * public/bilder/handscanner/ und schreibt den zugehörigen Abschnitt in
 * public/anleitung.html (Block HANDSCANNER:START…END).
 *
 * Hintergrund: Handscanner melden sich als Tastatur an und senden Tasten-
 * positionen. Steht das Gerät auf US-Belegung (Werkseinstellung vieler
 * Scanner) und der Rechner auf Deutsch, kommt der Bogen verdreht an. Die App
 * rechnet das zurück (src/app/tastaturbelegung.ts); dauerhaft behoben ist es
 * erst am Gerät — dafür stehen hier die Codes zum Abscannen.
 *
 * Warum selbst erzeugen statt aus dem Handbuch kopieren: Der Inhalt eines
 * Programmier-Codes ist eine kurze Befehlszeichenfolge (bei Datalogic z. B.
 * „$CKBCO05" für Ländermodus = Deutschland). Die kennen wir; das Bild dazu ist
 * unser eigenes, sauber skalierbar und ohne fremdes Handbuchmaterial.
 *
 * NEUEN SCANNER AUFNEHMEN: einen Eintrag in {@link HERSTELLER} ergänzen und
 * `npm run handscanner-codes` laufen lassen — Bilder und Seitenabschnitt
 * entstehen daraus. Aufgenommen wird nur, was diese App braucht (Belegung und
 * Rückweg), und nur mit Befehlen, die an einem echten Gerät geprüft wurden:
 * Ein falsch geratener Code verstellt jemandem den Scanner.
 *
 * Aufruf (Node ≥ 22): npm run handscanner-codes
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import bwipjs from "bwip-js/node";

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), "..");
const BILDER = join(WURZEL, "public", "bilder", "handscanner");
const SEITE = join(WURZEL, "public", "anleitung.html");

interface Code {
  /** Dateiname ohne Endung — zugleich die Kennung im Seitenabschnitt. */
  datei: string;
  /** Befehlszeichenfolge, die der Scanner liest. */
  inhalt: string;
  /** Beschriftung unter dem Code. */
  beschriftung: string;
  /** alt-Text: was der Code bewirkt, für alle, die ihn nicht sehen. */
  alt: string;
}

interface Hersteller {
  /** Überschrift des Abschnitts, z. B. „Datalogic (Gryphon, QuickScan, Heron)". */
  titel: string;
  /** Ablauf für die Belegung — je Satz ein Schritt. */
  ablauf: string;
  codes: Code[];
  /** Rückweg auf die Werkseinstellung (eigener Absatz, eigener Code). */
  ruecksetzen?: { text: string; code: Code };
}

/**
 * Datalogic setzt Parameter zwischen zwei „$P" (Programmiermodus aufrufen und
 * verlassen); „$CKBCO" ist der Ländermodus, „05" steht für Deutschland. Der
 * Rücksetz-Code bringt seinen Programmiermodus selbst mit.
 * Geprüft am Gryphon I GD4500 (Kurzanleitung, Ländermodus/Programmierung).
 */
const HERSTELLER: Hersteller[] = [
  {
    titel: "Datalogic (Gryphon, QuickScan, Heron)",
    ablauf: "Nacheinander scannen: erst den Programmiermodus, dann die Belegung, dann wieder den Programmiermodus zum Verlassen.",
    codes: [
      {
        datei: "datalogic-programmiermodus",
        inhalt: "$P",
        beschriftung: "1. und 3.: Programmiermodus aufrufen bzw. verlassen",
        alt: "Data-Matrix-Code mit dem Datalogic-Befehl Dollarzeichen P: Programmiermodus aufrufen und verlassen.",
      },
      {
        datei: "datalogic-belegung-deutschland",
        inhalt: "$CKBCO05",
        beschriftung: "2.: Tastaturbelegung Deutschland",
        alt: "Data-Matrix-Code mit dem Datalogic-Befehl für den Ländermodus Deutschland.",
      },
    ],
    ruecksetzen: {
      text: "Geht am Scanner etwas schief oder wurde vorher anderes eingestellt, setzt dieser Code ihn auf die Werkseinstellung zurück. Er wird einzeln gescannt — Programmiermodus braucht es dafür nicht. Danach steht die Belegung wieder auf USA, der Deutschland-Code gehört also hinterher.",
      code: {
        datei: "datalogic-werkseinstellung",
        inhalt: "$P,HA00,P",
        beschriftung: "Auf Werkseinstellung zurücksetzen",
        alt: "Data-Matrix-Code mit dem Datalogic-Befehl zum Zurücksetzen auf die Werkseinstellungen.",
      },
    },
  },
];

/**
 * Symbologie ist Data Matrix wie in den Handbüchern der Geräte: Die 2D-Imager
 * lesen sie werkseitig, und sie bleibt auf dem Bildschirm auch klein lesbar.
 * Die Ruhezone von 2 Modulen ist Vorgabe — ohne den weißen Rand erkennt ein
 * Scanner den Code auf dem Bildschirm oft nicht.
 */
function svgSchreiben(code: Code, hersteller: string): void {
  const svg = bwipjs.toSVG({ bcid: "datamatrix", text: code.inhalt, scale: 4, padding: 2, backgroundcolor: "FFFFFF" });
  writeFileSync(
    join(BILDER, `${code.datei}.svg`),
    `<!-- ${hersteller} — ${code.beschriftung} · Inhalt: ${code.inhalt} · erzeugt von scripts/handscanner-codes.mts -->\n${svg}\n`,
  );
}

function kachel(code: Code): string {
  return `      <figure>
        <img src="./bilder/handscanner/${code.datei}.svg" width="180" height="180" loading="lazy"
          alt="${code.alt}">
        <figcaption>${code.beschriftung}</figcaption>
      </figure>`;
}

function abschnitt(h: Hersteller): string {
  const teile = [
    `    <h3>${h.titel}</h3>`,
    `    <p>${h.ablauf}</p>`,
    `    <div class="scancodes">\n${h.codes.map(kachel).join("\n")}\n    </div>`,
  ];
  if (h.ruecksetzen) {
    teile.push(`    <p>${h.ruecksetzen.text}</p>`);
    teile.push(`    <div class="scancodes">\n${kachel(h.ruecksetzen.code)}\n    </div>`);
  }
  return teile.join("\n");
}

mkdirSync(BILDER, { recursive: true });
let anzahl = 0;
for (const h of HERSTELLER) {
  for (const code of [...h.codes, ...(h.ruecksetzen ? [h.ruecksetzen.code] : [])]) {
    svgSchreiben(code, h.titel);
    anzahl += 1;
  }
}

const block = `<!-- HANDSCANNER:START -->\n${HERSTELLER.map(abschnitt).join("\n\n")}\n    <!-- HANDSCANNER:END -->`;
const muster = /<!-- HANDSCANNER:START -->[\s\S]*?<!-- HANDSCANNER:END -->/;
const seite = readFileSync(SEITE, "utf8");
if (!muster.test(seite)) throw new Error(`Block HANDSCANNER:START…END fehlt in ${SEITE}`);
writeFileSync(SEITE, seite.replace(muster, block));

console.log(`${anzahl} Codes für ${HERSTELLER.length} Hersteller — Bilder und Abschnitt in anleitung.html erneuert.`);
