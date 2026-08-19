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
import { base64UrlDekodieren } from "../codec";
import { einheitAnzeigename, natoZeitstempel, qrErzeugen } from "./hilfen";
import { istNativ, binaerTeilen } from "./nativ";
import { einsatzPdfDokument, pdfDokument, type SammelBogen } from "./pdf-dokument";
import { einsatzDateiInhalt } from "./einsatz-transport";
import { revisionen, type Einsatzsammlung, type MeldeEintrag } from "./einsaetze";

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
 * `herkunft` = empfangener Payload: unverändert weitergereicht behält der
 * QR-Code auf der letzten Seite die Original-Signatur (siehe qrErzeugen).
 */
export async function pdfErzeugen(
  b: Erfassungsbogen,
  name?: string,
  herkunft?: Uint8Array | null,
): Promise<void> {
  const qr = await qrErzeugen(b, herkunft);
  const dd = pdfDokument(b, qr);
  const rumpf = einheitAnzeigename(b.einheit).replace(/[^\wäöüÄÖÜß-]+/g, "_");
  const dateiname = name ?? `eeb-${natoZeitstempel()}_${rumpf}.pdf`;
  if (istNativ()) {
    // In der App gibt es keinen Browser-Download: PDF übers Share-Sheet anbieten
    const base64 = await pdfMake.createPdf(dd).getBase64();
    await binaerTeilen(dateiname, base64);
  } else {
    pdfMake.createPdf(dd).download(dateiname);
  }
}

/**
 * Bogen als PDF-Daten-URL — für die eingebettete Vorschau in der Übersicht
 * (Browser/Desktop; die native App zeigt PDFs übers Share-Sheet an).
 */
export async function pdfDatenUrl(b: Erfassungsbogen, herkunft?: Uint8Array | null): Promise<string> {
  const qr = await qrErzeugen(b, herkunft);
  const dd = pdfDokument(b, qr);
  return pdfMake.createPdf(dd).getDataUrl();
}

/**
 * Sammel-PDF eines Einsatzes: Übergabe-Übersicht mit Änderungsspalte, dahinter
 * die übergebenen Meldungen als vollständige Bögen (inkl. QR), plus alle Bögen
 * als eingebettetes JSON UND die komplette Einsatz-Sammlung (Züge, Status,
 * Historie) — die PDF ist damit die vollständige Schichtübergabe in einer Datei.
 *
 * Erwartet die Meldungen (nicht nur die Bögen), weil die Änderungsspalte je
 * Einheit die vorherige Revision aus der Sammlung braucht.
 */
/**
 * Empfangene Rohbytes einer Meldung — Grundlage fürs Gegenzeichnen, damit eine
 * unverändert weitergegebene Meldung die Original-Signatur behält. Ältere
 * Sammlungen haben sie nicht; ein beschädigter Eintrag darf das PDF nicht
 * verhindern (dann wird wie früher selbst signiert).
 */
function herkunftBytes(m: MeldeEintrag): Uint8Array | null {
  if (!m.herkunft) return null;
  try {
    return base64UrlDekodieren(m.herkunft);
  } catch {
    return null;
  }
}

export async function einsatzPdfErzeugen(einsatz: Einsatzsammlung, meldungen: MeldeEintrag[]): Promise<void> {
  const boegenMitQr: SammelBogen[] = [];
  for (const m of meldungen) {
    // revisionen() liefert neueste zuerst — die Vorfassung steht direkt hinter
    // dieser Meldung. Fehlt sie, ist es eine Erstmeldung.
    const revs = revisionen(einsatz.eintraege, m.einheitSchluessel);
    const idx = revs.findIndex((r) => r.id === m.id);
    const vorher = idx >= 0 ? revs[idx + 1]?.bogen : undefined;
    boegenMitQr.push({
      bogen: m.bogen,
      qr: await qrErzeugen(m.bogen, herkunftBytes(m)),
      vorher,
      zugEtikett: m.zugEtikett,
      teil: m.teilEtikett,
    });
  }
  const dd = einsatzPdfDokument(einsatz.name, boegenMitQr, einsatzDateiInhalt(einsatz));
  const rumpf = (einsatz.name || "sammlung").replace(/[^\wäöüÄÖÜß-]+/g, "_");
  const dateiname = `eeb-einsatz-${natoZeitstempel()}_${rumpf}.pdf`;
  if (istNativ()) {
    const base64 = await pdfMake.createPdf(dd).getBase64();
    await binaerTeilen(dateiname, base64);
  } else {
    pdfMake.createPdf(dd).download(dateiname);
  }
}
