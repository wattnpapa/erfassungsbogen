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

let leserVersprechen: Promise<QrLeser> | null = null;

/**
 * Den besten verfügbaren Decoder laden — einmal je Sitzung, beide Wege lazy,
 * damit weder ZXing noch jsQR im Start-Bundle liegen.
 */
export function qrLeserLaden(): Promise<QrLeser> {
  leserVersprechen ??= zxingLeser().catch(() => jsQrLeser());
  return leserVersprechen;
}

async function zxingLeser(): Promise<QrLeser> {
  const { prepareZXingModule, readBarcodes } = await import("zxing-wasm/reader");
  await prepareZXingModule({
    overrides: {
      locateFile: (pfad: string, praefix: string) => (pfad.endsWith(".wasm") ? zxingWasmUrl : praefix + pfad),
    },
    fireImmediately: true,
  });
  return async (bild, optionen) => {
    const treffer = await readBarcodes(bild, {
      formats: ["QRCode"],
      tryHarder: true,
      tryRotate: true,
      tryInvert: optionen?.invertiert === true,
      maxNumberOfSymbols: 1,
    });
    return treffer.find((t) => t.isValid && t.text)?.text ?? null;
  };
}

async function jsQrLeser(): Promise<QrLeser> {
  const jsQR = (await import("jsqr")).default;
  return async (bild, optionen) =>
    jsQR(bild.data, bild.width, bild.height, {
      inversionAttempts: optionen?.invertiert ? "attemptBoth" : "dontInvert",
    })?.data ?? null;
}
