/**
 * QR-Codes aus einer PDF lesen — die Rückfallebene für PDFs, die kein
 * eingebettetes Bogen-JSON tragen (fremd erzeugte Ausdrucke, ältere Fassungen,
 * Dateien, die durch ein Fremdwerkzeug gelaufen sind und dabei ihre Anhänge
 * verloren haben). Ausgewertet wird der QR-Code, den unsere PDFs als eigenes
 * Bild-Objekt mitführen (pdf-bilder.ts) — durch denselben Decoder wie Kamera
 * und Bilddatei (qr-decoder.ts).
 */

import { bilderAusPdfBytes } from "./pdf-bilder";
import { qrLeserLaden } from "./qr-decoder";

/**
 * QR-Inhalte aller Bilder einer PDF, in Dokumentreihenfolge und ohne Dubletten
 * (eine Sammel-PDF trägt je Bogen einen Code, ein großer Bogen mehrere Teile).
 */
export async function qrTexteAusPdfBytes(bytes: Uint8Array): Promise<string[]> {
  const bilder = bilderAusPdfBytes(bytes);
  if (bilder.length === 0) return [];
  const lesen = await qrLeserLaden();
  const texte: string[] = [];
  for (const b of bilder) {
    const text = await lesen(new ImageData(b.rgba, b.breite, b.hoehe));
    if (text && !texte.includes(text)) texte.push(text);
  }
  return texte;
}
