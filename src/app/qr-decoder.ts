/// <reference types="vite/client" />
/**
 * QR-Decoder für Live-Scan und Bilddatei: ZXing (C++ per WebAssembly), mit
 * jsQR als Rückfallebene.
 *
 * Warum zwei: Gemessen an 144 synthetischen Kameraposen eines Bogen-Codes
 * (Version 19) liest ZXing im Rahmen-Ausschnitt ab 2 px je QR-Modul in 100 %
 * der Bilder, jsQR dort je nach Pose zwischen 8 % und 100 % — und unter
 * 3,6 px je Modul im ganzen, verkleinerten Bild gar nichts. Genau dort liegt
 * der Feldfall „Handy scannt das Display eines anderen Handys": Der Code
 * füllt aus Fokusabstand nur ein Fünftel bis Drittel der Bildbreite. ZXing
 * ist nebenbei schneller (~2–5 ms je Bild statt 15–20 ms).
 *
 * jsQR bleibt, weil die WebAssembly-Datei (~1,1 MB) geladen werden muss:
 * Electron öffnet die App über file:// und blockt dort `fetch`, alte Webviews
 * können WebAssembly fehlen. Dann scannt jsQR wie bisher weiter — mit
 * kleinerer Reichweite, aber nicht gar nicht.
 *
 * Die WASM-Datei liegt im Bundle (Vite-Asset) und im PWA-Precache — ohne
 * die `locateFile`-Vorgabe holte zxing-wasm sie von einem CDN, offline also
 * nie.
 */

import zxingWasmUrl from "zxing-wasm/reader/zxing_reader.wasm?url";

export interface QrLeseOptionen {
  /**
   * Auch hell-auf-dunkel (invertierte) Codes suchen — für Screenshots aus
   * Dunkelmodi. Im Live-Scan unnötig (die App zeigt QR-Codes stets auf Weiß)
   * und dort nur Rechenzeit.
   */
  invertiert?: boolean;
}

/** Liest den ersten QR-Code im Bild; null, wenn keiner drin ist. */
export type QrLeser = (bild: ImageData, optionen?: QrLeseOptionen) => Promise<string | null>;

/**
 * Liest ALLE QR-Codes im Bild (leer, wenn keiner drin ist). Für Fotos ganzer
 * Seiten: Die Bogenseiten der Sammel-PDF tragen je zwei Teile eines großen
 * Bogens — mit nur einem gelesenen Code ergab das Foto der Seite keinen Bogen
 * (Audit Runde 2, R2-A2). Die jsQR-Rückfallebene kennt nur einen Code je Bild.
 */
export type QrAlleLeser = (bild: ImageData, optionen?: QrLeseOptionen) => Promise<string[]>;

interface Decoder {
  eins: QrLeser;
  alle: QrAlleLeser;
}

/** Obergrenze je Bild: zwei Teile je Seite, Luft für Collagen/Screenshots. */
const MAX_CODES_JE_BILD = 8;

let decoderVersprechen: Promise<Decoder> | null = null;

/**
 * Den besten verfügbaren Decoder laden — einmal je Sitzung, beide Wege lazy,
 * damit weder ZXing noch jsQR im Start-Bundle liegen.
 */
function decoderLaden(): Promise<Decoder> {
  decoderVersprechen ??= zxingDecoder().catch(() => jsQrDecoder());
  return decoderVersprechen;
}

export function qrLeserLaden(): Promise<QrLeser> {
  return decoderLaden().then((d) => d.eins);
}

/** Wie {@link qrLeserLaden}, liefert aber alle Codes eines Bildes. */
export function qrAlleLeserLaden(): Promise<QrAlleLeser> {
  return decoderLaden().then((d) => d.alle);
}

async function zxingDecoder(): Promise<Decoder> {
  const { prepareZXingModule, readBarcodes } = await import("zxing-wasm/reader");
  await prepareZXingModule({
    overrides: {
      locateFile: (pfad: string, praefix: string) => (pfad.endsWith(".wasm") ? zxingWasmUrl : praefix + pfad),
    },
    fireImmediately: true,
  });
  const lesen = async (bild: ImageData, optionen: QrLeseOptionen | undefined, maxNumberOfSymbols: number) => {
    const treffer = await readBarcodes(bild, {
      formats: ["QRCode"],
      tryHarder: true,
      tryRotate: true,
      tryInvert: optionen?.invertiert === true,
      maxNumberOfSymbols,
    });
    const texte: string[] = [];
    for (const t of treffer) if (t.isValid && t.text && !texte.includes(t.text)) texte.push(t.text);
    return texte;
  };
  return {
    eins: async (bild, optionen) => (await lesen(bild, optionen, 1))[0] ?? null,
    alle: (bild, optionen) => lesen(bild, optionen, MAX_CODES_JE_BILD),
  };
}

async function jsQrDecoder(): Promise<Decoder> {
  const jsQR = (await import("jsqr")).default;
  const eins: QrLeser = async (bild, optionen) =>
    jsQR(bild.data, bild.width, bild.height, {
      inversionAttempts: optionen?.invertiert ? "attemptBoth" : "dontInvert",
    })?.data ?? null;
  return {
    eins,
    alle: async (bild, optionen) => {
      const text = await eins(bild, optionen);
      return text ? [text] : [];
    },
  };
}
