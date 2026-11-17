/**
 * pdfmake mit der Standardschrift Helvetica, in der der Bogen gesetzt ist.
 *
 * Die THWin-Papiervorlage ist in „BundesSans Office" gesetzt (Bund-Hausschrift,
 * nicht frei weitergebbar). Deren im Word-Dokument hinterlegte Ausweichschrift
 * ist Arial — und das metrisch praktisch deckungsgleiche Helvetica ist eine der
 * 14 PDF-Standardschriften. So wirkt die erzeugte PDF wie das Original, statt
 * im pdfmake-Standard Roboto. Roboto als Rückfall kommt in pdf-make.ts dazu.
 */

import pdfMakeBuild from "pdfmake/build/pdfmake";
// Metriken (AFM) der PDF-Standardschrift Helvetica. Anders als in Node, wo
// pdfkit sie von Platte liest, muss der Browser-Build sie explizit ins
// virtuelle Dateisystem bekommen — sonst bricht das Rendern mit
// „File 'data/Helvetica-Bold.afm' not found in virtual file system" ab.
import helvetica from "pdfmake/build/standard-fonts/Helvetica";

interface FontContainer {
  vfs: Record<string, string | { data: string; encoding?: string }>;
  fonts: Record<string, unknown>;
}

(pdfMakeBuild as unknown as { addFontContainer(container: FontContainer): void }).addFontContainer(
  helvetica as unknown as FontContainer,
);

export const pdfMake = pdfMakeBuild;
