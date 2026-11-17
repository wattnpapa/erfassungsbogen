/**
 * Worker für die Sammel-PDF der Übungsbögen.
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

export interface SammelAuftrag {
  boegen: SammelEinzelBogen[];
  titel: string;
}

export type SammelNachricht =
  | { art: "fortschritt"; n: number; von: number }
  | { art: "fertig"; pdf: ArrayBuffer }
  | { art: "fehler"; text: string };

const setzen = (dd: TDocumentDefinitions) => pdfMake.createPdf(kaestchenZeichnen(dd)).getBuffer();

self.onmessage = async (e: MessageEvent<SammelAuftrag>) => {
  const senden = (n: SammelNachricht, transfer: Transferable[] = []) => (self as unknown as Worker).postMessage(n, transfer);
  try {
    const { boegen, titel } = e.data;
    const dd = await boegenSammelDokument(boegen, setzen, titel, (n, von) => senden({ art: "fortschritt", n, von }));
    if (!dd) throw new Error("Sammel-PDF ohne Inhalt.");
    const puffer = (await setzen(dd)) as Uint8Array;
    const pdf = puffer.buffer.slice(puffer.byteOffset, puffer.byteOffset + puffer.byteLength) as ArrayBuffer;
    senden({ art: "fertig", pdf }, [pdf]);
  } catch (err) {
    senden({ art: "fehler", text: err instanceof Error ? err.message : String(err) });
  }
};
