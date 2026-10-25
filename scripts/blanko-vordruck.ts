/**
 * Der leere Erfassungsbogen als PDF-Bytes — gemeinsamer Kern von
 * `npm run blanko-pdf` (schreibt public/downloads/…) und dem Wächtertest
 * blanko-vordruck.test.ts, der die ausgelieferte Datei gegen diesen Generator
 * prüft. Bogen, Zeilenzahl und Metadaten stehen in src/app/blanko.ts — dieselbe
 * Quelle nutzt der Knopf „Blanko-Vordruck" in der App.
 *
 * Der Wächter ist nötig, weil die Datei bewusst im Repo liegt (direkt
 * verlinkbarer Download, auch ohne laufende App) und nicht im Build entsteht:
 * Nach R2-A6 stand die Stärke-Legende im Generator, aber nicht in der
 * ausgelieferten Datei — niemand hatte das Skript aufgerufen (Audit Runde 3,
 * R3-A4).
 *
 * Damit Datei und Generator byte-genau vergleichbar sind, ist die Ausgabe
 * deterministisch: das Erstelldatum wird übergeben (auf ganze Sekunden, wie
 * es in der PDF steht), und davon hängt auch die Datei-ID ab, die pdfkit aus
 * den Metadaten bildet. Der Test liest das Datum aus der ausgelieferten Datei
 * und erzeugt mit genau diesem Datum neu.
 */

import { pdfDokument } from "../src/app/pdf-dokument";
import { BLANKO_DATEINAME, BLANKO_INFO, BLANKO_ZEILEN, leererBogen } from "../src/app/blanko";
import { pdfBytes } from "./pdf-in-node";

/** Pfad relativ zur Repo-Wurzel. */
export const BLANKO_DATEI = `public/downloads/${BLANKO_DATEINAME}`;

/** Der Vordruck mit dem angegebenen Erstelldatum (Millisekunden werden verworfen). */
export async function blankoVordruck(erstellt: Date): Promise<Buffer> {
  const sekunden = new Date(Math.floor(erstellt.getTime() / 1000) * 1000);
  const dd = pdfDokument(leererBogen(), null, BLANKO_ZEILEN);
  return pdfBytes({
    ...dd,
    // Dokument-Metadaten: was Betriebssystem-Vorschau, PDF-Leser und
    // Suchmaschinen als Titel der Datei anzeigen.
    info: { ...BLANKO_INFO, creationDate: sekunden },
  });
}

/**
 * Erstelldatum aus einer von pdfkit geschriebenen PDF. pdfkit legt den Wert
 * als eigenes Objekt ab („/CreationDate 31 0 R" … „31 0 obj (D:20260815153501Z)").
 */
export function erstelldatumAusPdf(pdf: Uint8Array): Date | null {
  const text = Buffer.from(pdf).toString("latin1");
  const ref = /\/CreationDate (\d+) 0 R/.exec(text);
  const roh = ref
    ? new RegExp(`(?:^|\\n)${ref[1]} 0 obj\\s*\\((D:[^)]*)\\)`).exec(text)?.[1]
    : /\/CreationDate \((D:[^)]*)\)/.exec(text)?.[1];
  const m = roh && /^D:(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})Z$/.exec(roh);
  if (!m) return null;
  const [j, mo, t, h, mi, s] = m.slice(1).map(Number) as [number, number, number, number, number, number];
  return new Date(Date.UTC(j, mo - 1, t, h, mi, s));
}
