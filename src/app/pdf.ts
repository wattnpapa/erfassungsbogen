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
import type { Erfassungsbogen } from "@bos/eeb-format/model";
import { ausgabeDateiname, dateinameTeil, einheitAnzeigename, qrErzeugen } from "./hilfen";
import { istNativ, binaerTeilen } from "./nativ";
import {
  einzelPdfDokument,
  nichtDarstellbareBetroffene,
  nichtDarstellbareNamen,
  pdfDokument,
  umschriftBetroffene,
  vereinfachtBetroffene,
} from "./pdf-dokument";
import { BLANKO_DATEINAME, BLANKO_INFO, BLANKO_ZEILEN, leererBogen } from "./blanko";
import { zeitEingelesen } from "./eintrag-zeiten";
import { kaestchenZeichnen } from "./pdf-kaestchen";

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
 * Einzel-PDF mit Platz für Stiftnachträge, wo er keine Seite kostet: ein
 * Probesatz misst den freien Platz (Audit Runde 3, R3-A6).
 */
function einzelDokument(b: Erfassungsbogen, qr: Awaited<ReturnType<typeof qrErzeugen>>) {
  return einzelPdfDokument(b, qr, (probe) => pdfMake.createPdf(kaestchenZeichnen(probe)).getBuffer());
}

/**
 * Bogen als PDF ausgeben. `name` überschreibt den aus der Einheit abgeleiteten
 * Dateinamen (die Beispielbögen behalten so ihren Dateinamen aus examples/).
 * `herkunft` = empfangener Payload: unverändert weitergereicht behält der
 * QR-Code auf der letzten Seite die Original-Signatur (siehe qrErzeugen).
 */
export async function pdfErzeugen(
  b: Erfassungsbogen,
  name?: string,
  herkunft?: Uint8Array | null,
  /** Vor dem Ausgeben gefragt: true = der Aufrufer will die Datei nicht mehr (Beispielbögen, BB-E1). */
  abgebrochen?: () => boolean,
): Promise<{ nichtDarstellbar: number; betroffen: string[]; umschrift: string[]; vereinfacht: string[] }> {
  const qr = await qrErzeugen(b, herkunft);
  const dd = await einzelDokument(b, qr);
  const nichtDarstellbar = nichtDarstellbareNamen(b);
  const betroffen = nichtDarstellbareBetroffene(b);
  const umschrift = umschriftBetroffene(b);
  const vereinfacht = vereinfachtBetroffene(b);
  const rumpf = dateinameTeil(einheitAnzeigename(b.einheit));
  const dateiname = name ?? ausgabeDateiname("", rumpf, "pdf");
  if (abgebrochen?.()) return { nichtDarstellbar, betroffen, umschrift, vereinfacht };
  if (istNativ()) {
    // In der App gibt es keinen Browser-Download: PDF übers Share-Sheet anbieten
    const base64 = await pdfMake.createPdf(kaestchenZeichnen(dd)).getBase64();
    await binaerTeilen(dateiname, base64);
  } else {
    pdfMake.createPdf(kaestchenZeichnen(dd)).download(dateiname);
  }
  return { nichtDarstellbar, betroffen, umschrift, vereinfacht };
}

/**
 * Bogen als PDF-Blob-URL — für die eingebettete Vorschau in der Übersicht
 * (Browser/Desktop; die native App zeigt PDFs übers Share-Sheet an).
 *
 * Bewusst Blob statt `data:`-URL: die Content-Security-Policy des Builds
 * erlaubt als Rahmenquelle nur 'self'/file:/blob: — ein data:-Rahmen wird
 * blockiert und die Vorschau bliebe leer. Die URL muss der Aufrufer wieder
 * freigeben (URL.revokeObjectURL), sonst hält der Tab jede erzeugte PDF fest.
 */
export async function pdfBlobUrl(b: Erfassungsbogen, herkunft?: Uint8Array | null): Promise<string> {
  const qr = await qrErzeugen(b, herkunft);
  const dd = await einzelDokument(b, qr);
  return URL.createObjectURL(await pdfMake.createPdf(kaestchenZeichnen(dd)).getBlob());
}






export { zeitEingelesen };




/**
 * Fertiges Dokument ausgeben: Download im Browser, Share-Sheet in der App.
 * false = Share-Sheet abgebrochen; der Export-Stand verbucht dann nichts.
 */
async function dokumentAusgeben(dd: Parameters<typeof pdfMake.createPdf>[0], dateiname: string): Promise<boolean> {
  if (istNativ()) {
    const base64 = await pdfMake.createPdf(kaestchenZeichnen(dd)).getBase64();
    return binaerTeilen(dateiname, base64);
  }
  // Bis die Datei wirklich entstanden ist: Ohne `await` meldete die Sperre „fertig", Sekunden bevor der Download kam (R17-D4).
  await pdfMake.createPdf(kaestchenZeichnen(dd)).download(dateiname);
  return true;
}



/**
 * Blanko-Vordruck: der leere Bogen zum Ausfüllen mit der Hand, aus derselben
 * Quelle wie die ausgelieferte Datei (blanko.ts). In der App erzeugt statt
 * geladen — geht offline, in der Desktop-App und im Teilen-Fenster gleich.
 * Bisher nur über „Aufbau des Bogens" auf der Website erreichbar (Audit
 * Runde 3, R3-A7).
 */
export async function blankoPdfErzeugen(): Promise<boolean> {
  const dd = pdfDokument(leererBogen(), null, BLANKO_ZEILEN);
  return dokumentAusgeben({ ...dd, info: BLANKO_INFO }, BLANKO_DATEINAME);
}
