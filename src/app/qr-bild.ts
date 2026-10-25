/**
 * QR-Code aus einer Bilddatei dekodieren — für den Alltagsfall „jemand schickt
 * ein Foto des gedruckten Bogens per Messenger" oder einen Screenshot. Das
 * Ergebnis läuft beim Aufrufer durch dieselbe Übernahme-Pipeline wie der
 * Live-Scan (inklusive Segment-Sammlung über mehrere Bilder).
 */

import { istSegmentNutzlast } from "@bos/eeb-format/codec";
import { qrAlleLeserLaden, qrLeserLaden } from "./qr-decoder";

interface Bildquelle {
  quelle: CanvasImageSource;
  breite: number;
  hoehe: number;
  freigeben: () => void;
}

async function bildLaden(datei: Blob): Promise<Bildquelle> {
  if (typeof createImageBitmap === "function") {
    const b = await createImageBitmap(datei);
    return { quelle: b, breite: b.width, hoehe: b.height, freigeben: () => b.close() };
  }
  // Fallback für ältere Webviews: <img> über eine Objekt-URL.
  const url = URL.createObjectURL(datei);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Bild konnte nicht gelesen werden."));
      i.src = url;
    });
    return { quelle: img, breite: img.naturalWidth, hoehe: img.naturalHeight, freigeben: () => URL.revokeObjectURL(url) };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}

/**
 * QR-Code im Bild suchen; null, wenn keiner gefunden wird. Probiert mehrere
 * Auflösungen: Verkleinern glättet Foto-Rauschen und ist schnell, die volle
 * Größe rettet kleine Codes in großen Fotos. `invertiert` erkennt auch
 * hell-auf-dunkel (z. B. Dark-Mode-Screenshots).
 */
export async function qrAusBild(datei: Blob): Promise<string | null> {
  const lesen = await qrLeserLaden();
  const bild = await bildLaden(datei);
  try {
    const leinwand = document.createElement("canvas");
    const ctx = leinwand.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    const laengste = Math.max(bild.breite, bild.hoehe);
    for (const maxKante of [800, 1400, 2400]) {
      const faktor = Math.min(1, maxKante / laengste);
      leinwand.width = Math.max(1, Math.round(bild.breite * faktor));
      leinwand.height = Math.max(1, Math.round(bild.hoehe * faktor));
      ctx.drawImage(bild.quelle, 0, 0, leinwand.width, leinwand.height);
      const daten = ctx.getImageData(0, 0, leinwand.width, leinwand.height);
      const text = await lesen(daten, { invertiert: true });
      if (text) return text;
      if (faktor >= 1) break; // größer als das Original geht nicht
    }
    return null;
  } finally {
    bild.freigeben();
  }
}

/**
 * ALLE QR-Codes im Bild — für „Bögen einlesen…" mit Fotos ganzer Seiten. Eine
 * Bogenseite der Sammel-PDF trägt zwei Teile eines großen Bogens; mit nur
 * einem gelesenen Code ergab das Foto der Seite keinen Bogen (Audit Runde 2,
 * R2-A2).
 *
 * Auflösungen wie {@link qrAusBild}, die Funde werden aber gesammelt: in der
 * kleinen Stufe geht bei zwei Codes auf einer Seite gern einer unter. Früher
 * aufhören darf der Leser nur, wenn das Bild erkennbar fertig ist — ein
 * einteiliger Bogen (ein Code je Blatt) oder schon zwei Teile (mehr stehen
 * nie auf einer Seite).
 */
export async function qrAlleAusBild(datei: Blob): Promise<string[]> {
  const lesen = await qrAlleLeserLaden();
  const bild = await bildLaden(datei);
  const texte: string[] = [];
  try {
    const leinwand = document.createElement("canvas");
    const ctx = leinwand.getContext("2d", { willReadFrequently: true });
    if (!ctx) return texte;
    const laengste = Math.max(bild.breite, bild.hoehe);
    for (const maxKante of [800, 1400, 2400]) {
      const faktor = Math.min(1, maxKante / laengste);
      leinwand.width = Math.max(1, Math.round(bild.breite * faktor));
      leinwand.height = Math.max(1, Math.round(bild.hoehe * faktor));
      ctx.drawImage(bild.quelle, 0, 0, leinwand.width, leinwand.height);
      const daten = ctx.getImageData(0, 0, leinwand.width, leinwand.height);
      for (const t of await lesen(daten, { invertiert: true })) if (!texte.includes(t)) texte.push(t);
      const segmente = texte.filter(istSegmentNutzlast).length;
      if (texte.length > segmente || segmente >= 2) break;
      if (faktor >= 1) break;
    }
    return texte;
  } finally {
    bild.freigeben();
  }
}
