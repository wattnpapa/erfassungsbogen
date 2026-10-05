/**
 * pdfmake-DocDefinition in Node zu PDF-Bytes — gemeinsamer Weg für den
 * Blanko-Vordruck (blanko-pdf.mts) und für Tests, die echte Seiten zählen
 * müssen (Seitenumbrüche entstehen erst beim Setzen, nicht in der
 * DocDefinition).
 *
 * Warum nicht der Browser-Weg aus src/app/pdf.ts: dort registriert pdfmake die
 * Helvetica-Metriken von Hand ins virtuelle Dateisystem, weil der Browser-Build
 * sie nicht von Platte lesen kann. In Node liest pdfkit die Standardschriften
 * selbst — hier reicht die Zuordnung der vier Schnitte.
 */

import pdfMake from "pdfmake";
import type { TDocumentDefinitions } from "pdfmake/interfaces";

const SCHNITTE = {
  normal: "Helvetica",
  bold: "Helvetica-Bold",
  italics: "Helvetica-Oblique",
  bolditalics: "Helvetica-BoldOblique",
};

let eingerichtet = false;

function einrichten(): void {
  if (eingerichtet) return;
  pdfMake.setFonts({ Helvetica: SCHNITTE });
  // Gesetzt wird ausschließlich eingebauter Inhalt: keine URL, und von der
  // Platte nur die vier Schriftschnitte. Beides zunageln, statt pdfmake
  // blind auf Netz und Dateisystem zugreifen zu lassen.
  pdfMake.setUrlAccessPolicy(() => false);
  const erlaubt = new Set(Object.values(SCHNITTE));
  pdfMake.setLocalAccessPolicy((pfad) => erlaubt.has(pfad));
  eingerichtet = true;
}

/** Setzt die DocDefinition und liefert die fertige PDF-Datei. */
export async function pdfBytes(dd: TDocumentDefinitions): Promise<Buffer> {
  einrichten();
  return (await pdfMake.createPdf(dd).getBuffer()) as Buffer;
}

/**
 * Seitenzahl einer von pdfkit geschriebenen PDF. Die Seitenobjekte stehen
 * unkomprimiert in der Datei („/Type /Page" ohne „s"); für fremde PDFs taugt
 * das nicht, für unsere eigenen genügt es.
 */
export function seitenZahl(pdf: Uint8Array): number {
  const text = Buffer.from(pdf).toString("latin1");
  return (text.match(/\/Type \/Page\b(?!s)/g) ?? []).length;
}
