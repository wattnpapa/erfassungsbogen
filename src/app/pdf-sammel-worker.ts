/**
 * Worker für die Ausgabe vieler Übungsbögen: Sammel-PDF oder ZIP mit einer
 * PDF je Bogen.
 *
 * pdfmake setzt synchron: Bei 100 Bögen blockierten der Probesatz und der
 * Endsatz den Hauptthread je mehrere Sekunden am Stück, in Firefox und auf
 * langsamen Rechnern so lange, dass der Browser „Skript reagiert nicht"
 * meldete (Rückmeldung 11/2026). Hier läuft dieselbe Rechnung abseits der
 * Oberfläche; der Hauptthread erzeugt nur die QR-Codes (brauchen Canvas) und
 * gibt die fertige Datei aus.
 */

import type { TDocumentDefinitions } from "pdfmake/interfaces";
import { pdfMake } from "./pdf-helvetica";
import { boegenSammelDokument, type SammelEinzelBogen } from "./pdf-dokument";
import { kaestchenZeichnen } from "./pdf-kaestchen";
import { einzelPdfsZippen } from "./pdf-zip";

export type PdfAuftrag =
  | { art: "sammel"; boegen: SammelEinzelBogen[]; titel: string }
  | { art: "zip"; boegen: SammelEinzelBogen[]; namen: string[] };

export type PdfNachricht =
  | { art: "fortschritt"; schritt: "satz" | "datei"; n: number; von: number }
  | { art: "fertig"; datei: ArrayBuffer }
  | { art: "fehler"; text: string };

const setzen = async (dd: TDocumentDefinitions) => (await pdfMake.createPdf(kaestchenZeichnen(dd)).getBuffer()) as Uint8Array;

function senden(n: PdfNachricht, transfer: Transferable[] = []) {
  (self as unknown as Worker).postMessage(n, transfer);
}

/** Bogen n von von gesetzt; nach dem letzten entsteht die Datei. */
function stand(n: number, von: number) {
  senden(n < von ? { art: "fortschritt", schritt: "satz", n, von } : { art: "fortschritt", schritt: "datei", n: 0, von: 0 });
}

self.onmessage = async (e: MessageEvent<PdfAuftrag>) => {
  try {
    const auftrag = e.data;
    let bytes: Uint8Array | null;
    if (auftrag.art === "zip") {
      bytes = await einzelPdfsZippen(auftrag.boegen, auftrag.namen, setzen, stand);
    } else {
      const dd = await boegenSammelDokument(auftrag.boegen, setzen, auftrag.titel, stand);
      bytes = dd ? await setzen(dd) : null;
    }
    if (!bytes) throw new Error("Die Datei blieb leer.");
    const datei = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    senden({ art: "fertig", datei }, [datei]);
  } catch (err) {
    senden({ art: "fehler", text: err instanceof Error ? err.message : String(err) });
  }
};
