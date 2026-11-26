/**
 * pdfmake mit der Standardschrift Helvetica, in der der Bogen gesetzt ist.
 *
 * Die THWin-Papiervorlage ist in „BundesSans Office" gesetzt (Bund-Hausschrift,
 * nicht frei weitergebbar). Deren im Word-Dokument hinterlegte Ausweichschrift
 * ist Arial — und das metrisch praktisch deckungsgleiche Helvetica ist eine der
 * 14 PDF-Standardschriften. So wirkt die erzeugte PDF wie das Original, statt
 * im pdfmake-Standard Roboto.
 *
 * Roboto selbst wird nicht ausgeliefert. Die taktischen Zeichen verlangen in
 * ihrem SVG zwar `font-family: 'Roboto'`, gesetzt wurde ihre Beschriftung aber
 * von Anfang an in Helvetica: Die Roboto-Dateien waren nie im virtuellen
 * Dateisystem angekommen, und pdfmake fiel bis 0.3.11 stillschweigend auf die
 * Schrift des Dokuments zurück. Seit 0.3.15 bricht es an der Stelle ab
 * („file paths are not supported outside of Node"). Deshalb steht „Roboto"
 * hier ausdrücklich für Helvetica: gleiches Papierbild wie bisher, im
 * Hauptthread wie im Worker der Sammel-PDF, und 850 KB weniger im PDF-Baustein.
 */

import pdfMakeBuild from "pdfmake/build/pdfmake";
// Metriken (AFM) der PDF-Standardschrift Helvetica. Anders als in Node, wo
// pdfkit sie von Platte liest, muss der Browser-Build sie explizit ins
// virtuelle Dateisystem bekommen — sonst bricht das Rendern mit
// „File 'data/Helvetica-Bold.afm' not found in virtual file system" ab.
import helvetica from "pdfmake/build/standard-fonts/Helvetica";

interface FontContainer {
  vfs?: Record<string, string | { data: string; encoding?: string }>;
  standardFonts?: unknown[];
  fonts: Record<string, unknown>;
}

const pdf = pdfMakeBuild as unknown as {
  addFontContainer(container: FontContainer): void;
  addFonts(fonts: Record<string, unknown>): void;
};

pdf.addFontContainer(helvetica as unknown as FontContainer);
pdf.addFonts({
  Roboto: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique",
  },
});

export const pdfMake = pdfMakeBuild;
