/**
 * PDF-Ausgabe (pdfmake, rein clientseitig): rendert die DocDefinition aus
 * pdf-dokument.ts und bietet das Ergebnis als Download (Web) bzw. übers
 * System-Share-Sheet (nativ) an. Das Layout selbst liegt in pdf-dokument.ts
 * (pdfmake-frei und dadurch unit-testbar).
 */

import pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";
// Metriken (AFM) der PDF-Standardschrift Helvetica. Anders als in Node, wo
// pdfkit sie von Platte liest, muss der Browser-Build sie explizit ins
// virtuelle Dateisystem bekommen — sonst bricht das Rendern mit
// „File 'data/Helvetica-Bold.afm' not found in virtual file system" ab.
import helvetica from "pdfmake/build/standard-fonts/Helvetica";
import type { Erfassungsbogen } from "../model";
import { qrErzeugen } from "./hilfen";
import { istNativ, pdfTeilen } from "./nativ";
import { einsatzPdfDokument, pdfDokument } from "./pdf-dokument";

interface FontContainer {
  vfs: Record<string, string | { data: string; encoding?: string }>;
  fonts: Record<string, unknown>;
}
const pdf = pdfMake as unknown as {
  addVirtualFileSystem(vfs: FontContainer["vfs"]): void;
  addFontContainer(container: FontContainer): void;
  addFonts(fonts: Record<string, unknown>): void;
};

// vfs-Zuweisung ist je nach pdfmake-Version unterschiedlich verpackt
const fonts = pdfFonts as unknown as { pdfMake?: { vfs: Record<string, string> }; vfs?: Record<string, string> };
pdf.addVirtualFileSystem(fonts.pdfMake?.vfs ?? fonts.vfs ?? {});

// Die THWin-Papiervorlage ist in „BundesSans Office" gesetzt (Bund-Hausschrift,
// nicht frei weitergebbar). Deren im Word-Dokument hinterlegte Ausweichschrift
// ist Arial — und das metrisch praktisch deckungsgleiche Helvetica ist eine der
// 14 PDF-Standardschriften. So wirkt die erzeugte PDF wie das Original, statt
// im pdfmake-Standard Roboto. Roboto bleibt als Fallback erhalten (steht
// bereits als Vorgabe in pdfMake.fonts).
pdf.addFontContainer(helvetica as unknown as FontContainer);
pdf.addFonts({
  Roboto: {
    normal: "Roboto-Regular.ttf",
    bold: "Roboto-Medium.ttf",
    italics: "Roboto-Italic.ttf",
    bolditalics: "Roboto-MediumItalic.ttf",
  },
});

/**
 * Bogen als PDF ausgeben. `name` überschreibt den aus der Einheit abgeleiteten
 * Dateinamen (die Beispielbögen behalten so ihren Dateinamen aus examples/).
 */
export async function pdfErzeugen(b: Erfassungsbogen, name?: string): Promise<void> {
  const qr = await qrErzeugen(b);
  const dd = pdfDokument(b, qr);
  const dateiname = name ?? `eeb-${(b.einheit.name || "bogen").replace(/[^\wäöüÄÖÜß-]+/g, "_")}.pdf`;
  if (istNativ()) {
    // In der App gibt es keinen Browser-Download: PDF übers Share-Sheet anbieten
    const base64 = await pdfMake.createPdf(dd).getBase64();
    await pdfTeilen(dateiname, base64);
  } else {
    pdfMake.createPdf(dd).download(dateiname);
  }
}

/**
 * Sammel-PDF eines Einsatzes: alle übergebenen Bögen in einer PDF (je Bogen
 * die vollständigen Seiten inkl. QR), plus alle Bögen als eingebettetes JSON.
 */
export async function einsatzPdfErzeugen(name: string, boegen: Erfassungsbogen[]): Promise<void> {
  const boegenMitQr: { bogen: Erfassungsbogen; qr: Awaited<ReturnType<typeof qrErzeugen>> }[] = [];
  for (const b of boegen) boegenMitQr.push({ bogen: b, qr: await qrErzeugen(b) });
  const dd = einsatzPdfDokument(name, boegenMitQr);
  const dateiname = `eeb-einsatz-${(name || "sammlung").replace(/[^\wäöüÄÖÜß-]+/g, "_")}.pdf`;
  if (istNativ()) {
    const base64 = await pdfMake.createPdf(dd).getBase64();
    await pdfTeilen(dateiname, base64);
  } else {
    pdfMake.createPdf(dd).download(dateiname);
  }
}
