/**
 * Mehrere Bögen als ZIP mit je einer eigenen PDF (Übungsbögen). Jede PDF
 * entsteht wie das Einzel-PDF des Bogens, mit Probesatz für den Platz der
 * Stiftnachträge. Ohne pdfmake-Import: `setzen` kommt vom Aufrufer, damit
 * Worker (nur Helvetica) und Hauptthread dieselbe Rechnung teilen.
 */

import type { TDocumentDefinitions } from "pdfmake/interfaces";
import { einzelPdfDokument, type SammelEinzelBogen } from "./pdf-dokument";
import { zipSchreiben, eindeutigeNamen } from "./zip-schreiben";

export async function einzelPdfsZippen(
  boegen: readonly SammelEinzelBogen[],
  namen: readonly string[],
  /** Setzt das Dokument und liefert die Bytes der PDF (Kästchen schon gezeichnet). */
  setzen: (dd: TDocumentDefinitions) => Promise<Uint8Array>,
  fortschritt: (n: number, von: number) => void = () => {},
  abgebrochen: () => boolean = () => false,
  /** Zwischen den Bögen; im Hauptthread die Pause für die Oberfläche. */
  atemholen: () => Promise<void> = async () => {},
): Promise<Uint8Array | null> {
  if (boegen.length === 0) throw new Error("Kein Bogen für die ZIP-Datei.");
  const dateinamen = eindeutigeNamen(namen);
  const dateien: [string, Uint8Array][] = [];
  for (const [i, { bogen, qr }] of boegen.entries()) {
    if (abgebrochen()) return null;
    const dd = await einzelPdfDokument(bogen, qr, setzen);
    dateien.push([dateinamen[i]!, await setzen(dd)]);
    fortschritt(i + 1, boegen.length);
    await atemholen();
  }
  if (abgebrochen()) return null;
  return zipSchreiben(dateien);
}
