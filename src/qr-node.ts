/**
 * QR-Rendering und Kompression für Node/Electron.
 * Browser/Mobile bekommen später ein eigenes Pendant (pako + Canvas/Native),
 * der Codec selbst (src/codec.ts) bleibt plattformneutral.
 */

import { deflateRawSync, inflateRawSync } from "node:zlib";
import QRCode from "qrcode";
import type { Erfassungsbogen } from "./model";
import { encodePayload, decodePayload, type Kompressor } from "./codec";

export const nodeKompressor: Kompressor = {
  deflateRaw: (d) => new Uint8Array(deflateRawSync(d, { level: 9 })),
  inflateRaw: (d) => new Uint8Array(inflateRawSync(d)),
};

export interface QrErgebnis {
  payload: Uint8Array;
  /** QR-Version (1–40), bestimmt Modulzahl = 17 + 4·Version. */
  version: number;
}

function segmente(payload: Uint8Array) {
  return [{ data: Buffer.from(payload), mode: "byte" as const }];
}

const QR_OPTIONEN = { errorCorrectionLevel: "M" as const };

/** Bogen → QR-Code als SVG-String (für PDF-Einbettung und Anzeige). */
export async function bogenZuQrSvg(b: Erfassungsbogen): Promise<QrErgebnis & { svg: string }> {
  const payload = encodePayload(b, nodeKompressor);
  const svg = await QRCode.toString(segmente(payload), { ...QR_OPTIONEN, type: "svg" });
  return { payload, version: QRCode.create(segmente(payload), QR_OPTIONEN).version, svg };
}

/** Bogen → QR-Code als PNG-Buffer (für Druck/Export). */
export async function bogenZuQrPng(
  b: Erfassungsbogen,
  breitePx = 600,
): Promise<QrErgebnis & { png: Buffer }> {
  const payload = encodePayload(b, nodeKompressor);
  const png = await QRCode.toBuffer(segmente(payload), {
    ...QR_OPTIONEN,
    type: "png",
    width: breitePx,
  });
  return { payload, version: QRCode.create(segmente(payload), QR_OPTIONEN).version, png };
}

/** Gescannter QR-Inhalt (Bytes) → Bogen. */
export function qrPayloadZuBogen(payload: Uint8Array): Erfassungsbogen {
  return decodePayload(payload, nodeKompressor);
}
