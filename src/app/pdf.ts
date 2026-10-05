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
import { base64UrlDekodieren } from "@bos/eeb-format/codec";
import { einheitAnzeigename, natoZeitstempel, qrErzeugen } from "./hilfen";
import { istNativ, binaerTeilen } from "./nativ";
import { einsatzLageblattSeiteFuellen, einsatzPdfDokument, pdfDokument, type SammelBogen, type UebersichtEintrag } from "./pdf-dokument";
import { einsatzDateiInhalt } from "./einsatz-transport";
import { MeldeStatus, neuesteJeEinheit, revisionen, type Einsatzsammlung, type MeldeEintrag } from "@bos/meldekopf/einsaetze";
import { zaehltInLage } from "./auswertung";
import { eintreffzeit } from "./eintrag-zeiten";
import { lageblattVermerken, weitergabeVermerken } from "./export-stand";
import { meldungsNummern } from "./einheiten-tabelle";

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
  const dd = pdfDokument(b, qr);
  return URL.createObjectURL(await pdfMake.createPdf(dd).getBlob());
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

/**
 * Einzelbogen einer Meldung anzeigen — der Blick auf genau eine Einheit, ohne
 * den Umweg über die Sammel-PDF.
 *
 * Im Browser landet er in dem Tab, den der Aufrufer schon geöffnet hat: das
 * muss im Klick selbst passieren, denn bis pdfmake nachgeladen und der Satz
 * gerechnet ist, vergehen Sekunden — ein danach geöffnetes Fenster hält der
 * Popup-Blocker für ungefragt. Ohne Fenster (Popup-Blocker, App, Electron)
 * bleibt der gewohnte Weg: Download bzw. Share-Sheet.
 */
export async function meldungPdfAnzeigen(m: MeldeEintrag, fenster: Window | null): Promise<void> {
  const herkunft = herkunftBytes(m);
  if (!fenster) {
    await pdfErzeugen(m.bogen, undefined, herkunft);
    return;
  }
  const qr = await qrErzeugen(m.bogen, herkunft);
  await pdfMake.createPdf(pdfDokument(m.bogen, qr)).open(fenster);
}

/**
 * Was die Übersichtsseite über eine Meldung wissen muss — Zeiten, Status,
 * Auftrag, Vorfassung. Gemeinsam für Sammel-PDF und Lageblatt. `historie`
 * ist die ganze Sammlung: beim Teilexport („nur neue Bögen") steckt die
 * Vorfassung einer Folgemeldung nur noch dort.
 */
function uebersichtEintrag(
  einsatz: Einsatzsammlung,
  m: MeldeEintrag,
  historie: MeldeEintrag[] = einsatz.eintraege,
): UebersichtEintrag {
  // revisionen() liefert neueste zuerst — die Vorfassung steht direkt hinter
  // dieser Meldung. Fehlt sie, ist es eine Erstmeldung.
  const revs = revisionen(historie, m.einheitSchluessel);
  const idx = revs.findIndex((r) => r.id === m.id);
  const vorher = idx >= 0 ? revs[idx + 1]?.bogen : undefined;
  return {
    bogen: m.bogen,
    vorher,
    zugEtikett: m.zugEtikett,
    teil: m.teilEtikett,
    eingetroffenAm: eintreffzeit(m),
    abgerueckAm: m.abgerueckAm,
    abgerueckt: m.status !== MeldeStatus.ANWESEND,
    zaehlt: m.status === MeldeStatus.ANWESEND && zaehltInLage(einsatz.art, m.bogen),
    notiz: m.notiz,
    // Über die ganze Sammlung gezählt — auch im Nachtrag „nur neue Bögen"
    // dieselbe Nummer wie am Gerät (R2-A6).
    nummer: meldungsNummern(historie).get(m.einheitSchluessel),
  };
}

/**
 * Alle aktuellen Meldungen des Einsatzes — neueste Fassung je Einheit, auch
 * abgerückte und Übungen — nach Anzeigename geordnet. Die Auswahl „nur
 * anwesende" war der Fehler: Papier und eingebettete Datei sagten Verschiedenes
 * (Analog-Audit A1), und bei null Anwesenden gab es gar keine Datei (W2).
 */
export function alleAktuellen(einsatz: Einsatzsammlung): MeldeEintrag[] {
  return neuesteJeEinheit(einsatz.eintraege).sort((a, b) =>
    einheitAnzeigename(a.bogen.einheit).localeCompare(einheitAnzeigename(b.bogen.einheit), "de"),
  );
}

/** Dateiname-tauglicher Rumpf aus dem Einsatznamen. */
function dateiRumpf(einsatz: Einsatzsammlung): string {
  return (einsatz.name || "sammlung").replace(/[^\wäöüÄÖÜß-]+/g, "_");
}

/**
 * Fertiges Dokument ausgeben: Download im Browser, Share-Sheet in der App.
 * false = Share-Sheet abgebrochen; der Export-Stand verbucht dann nichts.
 */
async function dokumentAusgeben(dd: Parameters<typeof pdfMake.createPdf>[0], dateiname: string): Promise<boolean> {
  if (istNativ()) {
    const base64 = await pdfMake.createPdf(dd).getBase64();
    return binaerTeilen(dateiname, base64);
  }
  pdfMake.createPdf(dd).download(dateiname);
  return true;
}

/**
 * Sammel-PDF: Übergabe-Übersicht plus Bögen plus eingebettete Sammlung.
 * Ohne `meldungen` gehen ALLE aktuellen Meldungen je Einheit hinein (inkl.
 * abgerückte und Übungen) — auch bei null anwesenden Einheiten entsteht ein
 * Dokument. Beim Teilexport ist `einsatz` schon auf die neuen Bögen
 * zugeschnitten (export-stand.ts); `historie` ist dann die ganze Sammlung,
 * aus der die Vorfassung einer Folgemeldung für den Diff kommt.
 */
export async function einsatzPdfErzeugen(
  einsatz: Einsatzsammlung,
  meldungen: MeldeEintrag[] = alleAktuellen(einsatz),
  historie: MeldeEintrag[] = einsatz.eintraege,
): Promise<boolean> {
  const boegenMitQr: SammelBogen[] = [];
  for (const m of meldungen) {
    boegenMitQr.push({
      ...uebersichtEintrag(einsatz, m, historie),
      qr: await qrErzeugen(m.bogen, herkunftBytes(m)),
    });
  }
  const dd = einsatzPdfDokument(einsatz.name, boegenMitQr, einsatzDateiInhalt(einsatz));
  // Teilexport („nur neue Bögen") mit eigenem Dateinamen — sonst hießen
  // Nachtrag und ganze Sammlung gleich (Audit Runde 2, R2-A3).
  const nachtrag = historie !== einsatz.eintraege;
  const ok = await dokumentAusgeben(dd, `eeb-einsatz-${nachtrag ? "nachtrag-" : ""}${natoZeitstempel()}_${dateiRumpf(einsatz)}.pdf`);
  // Die ganze Sammlung ging heraus — womöglich an die nächste Schicht. Die
  // Einsatzansicht sagt danach, wann, und was seitdem nur hier dazukam
  // (Audit Runde 2, R2-W5). Der Nachtrag „nur neue Bögen" ist keine Übergabe.
  if (ok && !nachtrag) weitergabeVermerken(einsatz);
  return ok;
}

/**
 * Lageblatt: nur die Übersichtsseite (Einheiten mit Zeiten, Bedarf, Züge) als
 * A4 quer — ohne Bögen und ohne QR-Codes, deshalb in Sekundenbruchteilen
 * fertig. Das Blatt für die Wand (Analog-Audit A3/A4). Immer der ganze
 * Einsatz: die Wand braucht die Lage, nicht die Lieferung.
 */
export async function einsatzLageblattErzeugen(einsatz: Einsatzsammlung): Promise<boolean> {
  const eintraege = alleAktuellen(einsatz).map((m) => uebersichtEintrag(einsatz, m));
  // Zwei Sätze: der erste misst, wie viel Platz unter dem Inhalt bleibt, der
  // zweite füllt ihn mit Nachtragszeilen (Audit Runde 3, R3-A5).
  const dd = await einsatzLageblattSeiteFuellen(einsatz.name, eintraege, (probe) => pdfMake.createPdf(probe).getBuffer());
  const ok = await dokumentAusgeben(dd, `eeb-lageblatt-${natoZeitstempel()}_${dateiRumpf(einsatz)}.pdf`);
  // Merken, wann das Blatt entstand — die Einsatzansicht sagt dann „Lageblatt
  // 16:30 · seitdem 1 neue Meldung" (Audit Runde 2, R2-A3).
  if (ok) lageblattVermerken(einsatz);
  return ok;
}
