/**
 * Bild-Objekte aus einer PDF als Pixel — die Grundlage dafür, den QR-Code einer
 * PDF auszuwerten (siehe pdf-qr.ts), ohne einen PDF-Renderer einzubinden
 * (pdf.js wäre ein Megabyte extra).
 *
 * Die Bilder einer PDF liegen als rohe Pixelzeilen im Strom (siehe
 * pdf-stroeme.ts). Abgedeckt sind genau die einfachen Fälle, die
 * pdfmake/pdfkit für unsere QR-Bilder erzeugt: 8 Bit je Kanal, DeviceRGB oder
 * DeviceGray, FlateDecode, wahlweise mit PNG-Prädiktor. Alles Übrige (JPEG,
 * CMYK, Farbtabellen) fällt still raus; für unsere eigenen PDFs reicht das.
 *
 * Bewusst frei von Browser-Abhängigkeiten (kein Canvas, kein Decoder): reine
 * Rechenarbeit, dadurch in Node testbar.
 */

import { entpackt, pdfStroeme, type PdfStrom } from "./pdf-stroeme";

/** Ein Bild aus der PDF als RGBA-Puffer, wie ihn ImageData erwartet. */
export interface PdfBild {
  breite: number;
  hoehe: number;
  rgba: Uint8ClampedArray<ArrayBuffer>;
}

function zahl(woerterbuch: string, name: string): number | null {
  const m = new RegExp(`/${name}\\s+(\\d+)`).exec(woerterbuch);
  return m ? Number(m[1]) : null;
}

/**
 * PNG-Prädiktor rückgängig machen (/DecodeParms /Predictor ≥ 10). pdfkit nutzt
 * ihn, wenn es die Bilddaten einer PNG unverändert übernimmt; jede Zeile trägt
 * dann ein führendes Filterbyte.
 */
function ohnePraediktor(daten: Uint8Array, breite: number, kanaele: number): Uint8Array | null {
  const zeileBytes = breite * kanaele;
  const hoehe = Math.floor(daten.length / (zeileBytes + 1));
  if (hoehe < 1) return null;
  const aus = new Uint8Array(zeileBytes * hoehe);
  for (let y = 0; y < hoehe; y++) {
    const filter = daten[y * (zeileBytes + 1)]!;
    const ein = y * (zeileBytes + 1) + 1;
    const zeile = y * zeileBytes;
    const oben = zeile - zeileBytes;
    for (let x = 0; x < zeileBytes; x++) {
      const roh = daten[ein + x]!;
      const a = x >= kanaele ? aus[zeile + x - kanaele]! : 0;
      const b = y > 0 ? aus[oben + x]! : 0;
      const c = x >= kanaele && y > 0 ? aus[oben + x - kanaele]! : 0;
      let wert: number;
      switch (filter) {
        case 0: wert = roh; break;
        case 1: wert = roh + a; break;
        case 2: wert = roh + b; break;
        case 3: wert = roh + ((a + b) >> 1); break;
        case 4: {
          // Paeth
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          wert = roh + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
          break;
        }
        default: return null; // unbekannter Filter — Bild überspringen
      }
      aus[zeile + x] = wert & 0xff;
    }
  }
  return aus;
}

/** Ein Bild-Strom → RGBA-Puffer; null, wenn das Format nicht abgedeckt ist. */
function bildAusStrom(strom: PdfStrom): PdfBild | null {
  const w = strom.woerterbuch;
  if (!w.includes("/Subtype /Image") && !w.includes("/Subtype/Image")) return null;
  if (!w.includes("FlateDecode")) return null; // JPEG & Co. bleiben außen vor
  const breite = zahl(w, "Width");
  const hoehe = zahl(w, "Height");
  if (!breite || !hoehe || zahl(w, "BitsPerComponent") !== 8) return null;
  const grau = w.includes("/DeviceGray");
  const kanaele = grau ? 1 : w.includes("/DeviceRGB") ? 3 : 0;
  if (!kanaele) return null;
  let daten = entpackt(strom);
  if (!daten) return null;
  const praediktor = zahl(w, "Predictor") ?? 1;
  if (praediktor >= 10) {
    const roh = ohnePraediktor(daten, breite, kanaele);
    if (!roh) return null;
    daten = roh;
  }
  if (daten.length < breite * hoehe * kanaele) return null;
  const rgba = new Uint8ClampedArray(new ArrayBuffer(breite * hoehe * 4));
  for (let i = 0, p = 0; i < breite * hoehe; i++, p += 4) {
    const q = i * kanaele;
    rgba[p] = daten[q]!;
    rgba[p + 1] = daten[grau ? q : q + 1]!;
    rgba[p + 2] = daten[grau ? q : q + 2]!;
    rgba[p + 3] = 255;
  }
  return { breite, hoehe, rgba };
}

/**
 * Alle auswertbaren Bilder einer PDF. Reine Rechenarbeit (kein DOM), damit sie
 * sich testen lässt; das Dekodieren übernimmt {@link qrTexteAusPdfBytes}.
 */
export function bilderAusPdfBytes(bytes: Uint8Array): PdfBild[] {
  const bilder: PdfBild[] = [];
  for (const strom of pdfStroeme(bytes)) {
    // Ein QR-Bild ist quadratisch, nicht winzig und nicht einfarbig. Das siebt
    // Logos, Schriftgrafiken und vor allem die Alphamaske aus, die pdfkit zu
    // jedem QR-Bild als zweites, durchweg deckendes Graustufenbild ablegt.
    const bild = bildAusStrom(strom);
    if (bild && bild.breite === bild.hoehe && bild.breite >= 100 && !einfarbig(bild)) bilder.push(bild);
  }
  return bilder;
}

/** Trägt das Bild überhaupt Zeichnung? (Ein QR-Code hat immer zwei Farben.) */
function einfarbig(bild: PdfBild): boolean {
  const erste = bild.rgba[0];
  for (let i = 4; i < bild.rgba.length; i += 4) {
    if (bild.rgba[i] !== erste) return false;
  }
  return true;
}
