/**
 * PDF-Ausgabe (pdfmake, rein clientseitig): rendert die DocDefinition aus
 * pdf-dokument.ts und bietet das Ergebnis als Download (Web) bzw. übers
 * System-Share-Sheet (nativ) an. Das Layout selbst liegt in pdf-dokument.ts
 * (pdfmake-frei und dadurch unit-testbar).
 */

import pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";
import type { Erfassungsbogen } from "../model";
import { qrErzeugen } from "./hilfen";
import { istNativ, pdfTeilen } from "./nativ";
import { pdfDokument } from "./pdf-dokument";

// vfs-Zuweisung ist je nach pdfmake-Version unterschiedlich verpackt
const fonts = pdfFonts as unknown as { pdfMake?: { vfs: Record<string, string> }; vfs?: Record<string, string> };
(pdfMake as unknown as { vfs: Record<string, string> }).vfs = fonts.pdfMake?.vfs ?? fonts.vfs ?? {};

export async function pdfErzeugen(b: Erfassungsbogen): Promise<void> {
  const qr = await qrErzeugen(b);
  const dd = pdfDokument(b, qr);
  const dateiname = `eeb-${(b.einheit.name || "bogen").replace(/[^\wäöüÄÖÜß-]+/g, "_")}.pdf`;
  if (istNativ()) {
    // In der App gibt es keinen Browser-Download: PDF übers Share-Sheet anbieten
    const base64 = await pdfMake.createPdf(dd).getBase64();
    await pdfTeilen(dateiname, base64);
  } else {
    pdfMake.createPdf(dd).download(dateiname);
  }
}
