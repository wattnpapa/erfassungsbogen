import { describe, it, expect } from "vitest";
import { deflate } from "pako";
import { bilderAusPdfBytes } from "./pdf-bilder";

/** Bytes eines Mini-PDFs mit genau einem Bild-Objekt bauen. */
function pdfMitBild(woerterbuch: string, strom: Uint8Array): Uint8Array {
  const kopf = new TextEncoder().encode(`%PDF-1.4\n7 0 obj\n<<\n${woerterbuch}\n>>\nstream\n`);
  const fuss = new TextEncoder().encode("\nendstream\nendobj\n%%EOF\n");
  const alles = new Uint8Array(kopf.length + strom.length + fuss.length);
  alles.set(kopf, 0);
  alles.set(strom, kopf.length);
  alles.set(fuss, kopf.length + strom.length);
  return alles;
}

/** Schachbrett als RGB-Zeilen (ohne Prädiktor). */
function rgbFlaeche(kante: number): Uint8Array {
  const daten = new Uint8Array(kante * kante * 3);
  for (let i = 0; i < kante * kante; i++) {
    const hell = ((i % kante) + Math.floor(i / kante)) % 2 === 0 ? 255 : 0;
    daten.fill(hell, i * 3, i * 3 + 3);
  }
  return daten;
}

describe("bilderAusPdfBytes()", () => {
  it("liest ein DeviceRGB-Bild als RGBA-Puffer", () => {
    const kante = 120;
    const pdf = pdfMitBild(
      `/Subtype /Image\n/Width ${kante}\n/Height ${kante}\n/BitsPerComponent 8\n/Filter /FlateDecode\n/ColorSpace /DeviceRGB`,
      deflate(rgbFlaeche(kante)),
    );
    const [bild] = bilderAusPdfBytes(pdf);
    expect(bild).toBeDefined();
    expect([bild!.breite, bild!.hoehe]).toEqual([kante, kante]);
    // erstes Pixel weiß, zweites schwarz — und immer voll deckend
    expect([...bild!.rgba.slice(0, 8)]).toEqual([255, 255, 255, 255, 0, 0, 0, 255]);
  });

  it("liest ein DeviceGray-Bild und füllt alle drei Kanäle", () => {
    const kante = 100;
    const grau = new Uint8Array(kante * kante);
    grau.fill(200);
    grau[7] = 0; // nicht einfarbig — sonst gilt das Bild als Alphamaske (s. u.)
    const pdf = pdfMitBild(
      `/Subtype /Image\n/Width ${kante}\n/Height ${kante}\n/BitsPerComponent 8\n/Filter /FlateDecode\n/ColorSpace /DeviceGray`,
      deflate(grau),
    );
    const [bild] = bilderAusPdfBytes(pdf);
    expect([...bild!.rgba.slice(0, 4)]).toEqual([200, 200, 200, 255]);
  });

  it("macht den PNG-Prädiktor rückgängig (pdfkit übernimmt PNG-Daten unverändert)", () => {
    const kante = 100;
    const roh = rgbFlaeche(kante);
    // Jede Zeile mit Filter 2 (Up) kodieren: Wert minus Wert der Zeile darüber.
    const zeile = kante * 3;
    const gefiltert = new Uint8Array((zeile + 1) * kante);
    for (let y = 0; y < kante; y++) {
      gefiltert[y * (zeile + 1)] = 2;
      for (let x = 0; x < zeile; x++) {
        const oben = y > 0 ? roh[(y - 1) * zeile + x]! : 0;
        gefiltert[y * (zeile + 1) + 1 + x] = (roh[y * zeile + x]! - oben) & 0xff;
      }
    }
    const pdf = pdfMitBild(
      `/Subtype /Image\n/Width ${kante}\n/Height ${kante}\n/BitsPerComponent 8\n/Filter /FlateDecode\n/DecodeParms << /Predictor 15 /Colors 3 /BitsPerComponent 8 /Columns ${kante} >>\n/ColorSpace /DeviceRGB`,
      deflate(gefiltert),
    );
    const [bild] = bilderAusPdfBytes(pdf);
    expect(bild).toBeDefined();
    expect([...bild!.rgba.slice(0, 8)]).toEqual([255, 255, 255, 255, 0, 0, 0, 255]);
  });

  it("übergeht, was kein QR-Bild sein kann: JPEG, winzige Bilder, nicht quadratische", () => {
    const jpeg = pdfMitBild(
      "/Subtype /Image\n/Width 300\n/Height 300\n/BitsPerComponent 8\n/Filter /DCTDecode\n/ColorSpace /DeviceRGB",
      new Uint8Array([0xff, 0xd8, 0xff]),
    );
    const winzig = pdfMitBild(
      "/Subtype /Image\n/Width 16\n/Height 16\n/BitsPerComponent 8\n/Filter /FlateDecode\n/ColorSpace /DeviceRGB",
      deflate(rgbFlaeche(16)),
    );
    const streifen = pdfMitBild(
      "/Subtype /Image\n/Width 200\n/Height 100\n/BitsPerComponent 8\n/Filter /FlateDecode\n/ColorSpace /DeviceRGB",
      deflate(new Uint8Array(200 * 100 * 3)),
    );
    expect(bilderAusPdfBytes(jpeg)).toEqual([]);
    expect(bilderAusPdfBytes(winzig)).toEqual([]);
    expect(bilderAusPdfBytes(streifen)).toEqual([]);
  });

  it("übergeht die einfarbige Alphamaske, die pdfkit neben jedes QR-Bild legt", () => {
    const kante = 520;
    const maske = new Uint8Array(kante * kante);
    maske.fill(255);
    const pdf = pdfMitBild(
      `/Subtype /Image\n/Width ${kante}\n/Height ${kante}\n/BitsPerComponent 8\n/Filter /FlateDecode\n/ColorSpace /DeviceGray\n/Decode [0 1]`,
      deflate(maske),
    );
    expect(bilderAusPdfBytes(pdf)).toEqual([]);
  });

  it("liefert nichts für eine PDF ganz ohne Bilder", () => {
    const text = new TextEncoder().encode("%PDF-1.4\n1 0 obj\n<< /Length 4 >>\nstream\nabcd\nendstream\nendobj\n");
    expect(bilderAusPdfBytes(text)).toEqual([]);
  });
});
