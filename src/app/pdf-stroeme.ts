/**
 * Rohzugriff auf die Datenströme einer PDF — bewusst OHNE PDF-Parser-
 * Abhängigkeit. Unsere eigenen PDFs tragen ihre Nutzdaten als eingebettete
 * Datei (JSON, siehe pdf-dokument.ts) und als QR-Bild; beides steckt in
 * gewöhnlichen `stream … endstream`-Blöcken. Wer sie auswerten will, braucht
 * nur zweierlei: die Bytes des Stroms und das Wörterbuch davor (`/Filter`,
 * `/Width`, …).
 *
 * Genutzt von einsatz-transport.ts (eingebettetes JSON) und pdf-qr.ts (QR-Bild
 * als Rückfallebene, wenn eine PDF kein JSON mitbringt).
 */

import { inflate } from "pako";

export interface PdfStrom {
  /** Das Wörterbuch vor `stream` als Text — grob, aber genug für /Filter & Co. */
  woerterbuch: string;
  /** Die rohen Bytes zwischen `stream` und `endstream`. */
  daten: Uint8Array;
}

/** Bytes → Latin1-String (chunkweise), um Stream-Marker per Offset zu finden. */
function latin1String(bytes: Uint8Array): string {
  let s = "";
  const schritt = 0x8000;
  for (let i = 0; i < bytes.length; i += schritt) {
    s += String.fromCharCode(...bytes.subarray(i, i + schritt));
  }
  return s;
}

/**
 * Alle Datenströme einer PDF. Das Wörterbuch wird als Textfenster vor dem
 * Schlüsselwort `stream` mitgegeben — vom Objektkopf („7 0 obj") an, damit
 * auch verschachtelte Angaben wie `/DecodeParms << … >>` vollständig drinstehen.
 * Das reicht, um Bildströme an /Subtype /Image und ihren Maßen zu erkennen.
 */
export function pdfStroeme(bytes: Uint8Array): PdfStrom[] {
  const latin1 = latin1String(bytes);
  const stroeme: PdfStrom[] = [];
  const re = /stream\r?\n/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(latin1))) {
    const start = m.index + m[0].length;
    const ende = latin1.indexOf("endstream", start);
    if (ende < 0) continue;
    // Vor „endstream" steht i. d. R. ein Zeilenumbruch, der nicht zum Strom gehört.
    let bis = ende;
    if (latin1[bis - 1] === "\n") bis--;
    if (latin1[bis - 1] === "\r") bis--;
    const fenster = latin1.slice(Math.max(0, m.index - 800), m.index);
    const kopf = /\d+\s+\d+\s+obj\b/g;
    let letzter = -1;
    let k: RegExpExecArray | null;
    while ((k = kopf.exec(fenster))) letzter = k.index + k[0].length;
    stroeme.push({
      woerterbuch: letzter >= 0 ? fenster.slice(letzter) : fenster,
      daten: bytes.subarray(start, bis),
    });
  }
  return stroeme;
}

/** Strom entpacken (FlateDecode); null, wenn er nicht Flate-komprimiert ist. */
export function entpackt(strom: PdfStrom): Uint8Array | null {
  try {
    return inflate(strom.daten);
  } catch {
    return null;
  }
}
