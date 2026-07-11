/**
 * QR-Rendering und Kompression für Node/Electron.
 * Browser/Mobile bekommen später ein eigenes Pendant (pako + Canvas/Native),
 * der Codec selbst (src/codec.ts) bleibt plattformneutral.
 */

import { deflateRawSync, inflateRawSync } from "node:zlib";
import QRCode from "qrcode";
import type { Erfassungsbogen } from "./model";
import { encodePayloadUrl, decodePayloadUrl, type Kompressor } from "./codec";

export const nodeKompressor: Kompressor = {
  deflateRaw: (d) => new Uint8Array(deflateRawSync(d, { level: 9 })),
  inflateRaw: (d) => new Uint8Array(inflateRawSync(d)),
};

export interface QrErgebnis {
  /** QR-Inhalt: App-URL mit Base64url-Payload im Fragment. */
  url: string;
  /** QR-Version (1–40), bestimmt Modulzahl = 17 + 4·Version. */
  version: number;
}

const QR_OPTIONEN = { errorCorrectionLevel: "M" as const };

/** Bogen → QR-Code als SVG-String (für PDF-Einbettung und Anzeige). */
export async function bogenZuQrSvg(b: Erfassungsbogen): Promise<QrErgebnis & { svg: string }> {
  const url = encodePayloadUrl(b, nodeKompressor);
  const svg = await QRCode.toString(url, { ...QR_OPTIONEN, type: "svg" });
  return { url, version: QRCode.create(url, QR_OPTIONEN).version, svg };
}

/** Bogen → QR-Code als PNG-Buffer (für Druck/Export). */
export async function bogenZuQrPng(
  b: Erfassungsbogen,
  breitePx = 600,
): Promise<QrErgebnis & { png: Buffer }> {
  const url = encodePayloadUrl(b, nodeKompressor);
  const png = await QRCode.toBuffer(url, {
    ...QR_OPTIONEN,
    type: "png",
    width: breitePx,
  });
  return { url, version: QRCode.create(url, QR_OPTIONEN).version, png };
}

/** Gescannter QR-Text (App-URL oder nackter Base64url-Payload) → Bogen. */
export function qrTextZuBogen(text: string): Erfassungsbogen {
  return decodePayloadUrl(text, nodeKompressor);
}
