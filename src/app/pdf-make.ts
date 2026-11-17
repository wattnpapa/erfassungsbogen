/**
 * pdfmake mit Schriften: Helvetica-Metriken und Roboto im virtuellen
 * Dateisystem. Der Worker der Sammel-PDF (pdf-sammel-worker.ts) nimmt nur
 * pdf-helvetica.ts: Roboto ist dort Ballast von 850 KB.
 */

import * as pdfFonts from "pdfmake/build/vfs_fonts";
import { pdfMake as pdfMakeBuild } from "./pdf-helvetica";

const pdf = pdfMakeBuild as unknown as {
  addVirtualFileSystem(vfs: Record<string, string>): void;
  addFonts(fonts: Record<string, unknown>): void;
};

// vfs-Zuweisung ist je nach pdfmake-Version unterschiedlich verpackt
const fonts = pdfFonts as unknown as { pdfMake?: { vfs: Record<string, string> }; vfs?: Record<string, string> };
pdf.addVirtualFileSystem(fonts.pdfMake?.vfs ?? fonts.vfs ?? {});
pdf.addFonts({
  Roboto: {
    normal: "Roboto-Regular.ttf",
    bold: "Roboto-Medium.ttf",
    italics: "Roboto-Italic.ttf",
    bolditalics: "Roboto-MediumItalic.ttf",
  },
});

export const pdfMake = pdfMakeBuild;
