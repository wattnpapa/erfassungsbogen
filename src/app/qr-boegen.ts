/**
 * QR-Inhalte → Erfassungsbögen, ohne laufende Scan-Oberfläche. Genutzt vom
 * PDF-Import: pdf-qr.ts liefert die Texte der QR-Bilder einer PDF.
 *
 * Das Zusammensetzen mehrteiliger Bögen macht qr-stapel.ts — dieselbe Aufgabe
 * wie beim Stapel abfotografierter Blätter: Teile über ihre Bogen-Kennung
 * gruppieren (die Reihenfolge in der Datei sagt nichts), Vorlagen aussortieren,
 * unvollständige Sätze liegen lassen. Statt Bilder zu dekodieren, reichen wir
 * die schon gelesenen Texte durch.
 *
 * Zusätzlich wird hier der Signaturstatus geprüft: Er und der rohe Payload
 * tragen die Original-Signatur des Absenders und erlauben das spätere
 * Weiterreichen einer fremden Meldung (Gegenzeichnen, siehe hilfen.ts).
 */

import { signaturVonPayload, type SignaturStatus } from "@bos/eeb-format/signatur";
import type { Erfassungsbogen } from "@bos/eeb-format/model";
import { qrStapelLesen } from "./qr-stapel";

/** Ein aus QR-Codes gewonnener Bogen samt Herkunftsnachweis. */
export interface QrBogen {
  bogen: Erfassungsbogen;
  signatur: SignaturStatus;
  /** Roher Payload — Grundlage für Signaturprüfung und Weitergabe. */
  herkunft: Uint8Array | null;
}

/**
 * Alle vollständigen Bögen aus einer Menge QR-Texte. Unlesbare Codes, Vorlagen
 * und angefangene Teilesätze fallen still raus — beim Datei-Import zählt, was
 * ankommt; der Aufrufer meldet die Zahl.
 */
export async function boegenAusQrTexten(texte: string[]): Promise<QrBogen[]> {
  // Der Stapelleser erwartet Dateien und eine Lesefunktion. Beides bedienen wir
  // mit dem, was wir schon haben: der Text steckt im Blob, „lesen" gibt ihn
  // zurück. Die laufende Nummer im Namen hält die Reihenfolge (er sortiert).
  const ergebnis = await qrStapelLesen(
    texte.map((text, i) => ({ name: `QR ${String(i + 1).padStart(4, "0")}`, blob: new Blob([text]) })),
    { lesen: (blob) => blob.text() },
  );
  return Promise.all(
    ergebnis.funde.map(async (fund) => ({
      bogen: fund.bogen,
      signatur: fund.payload ? await signaturVonPayload(fund.payload) : ({ zustand: "unsigniert" } as SignaturStatus),
      herkunft: fund.payload,
    })),
  );
}
