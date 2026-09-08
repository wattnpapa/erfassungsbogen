/**
 * Verdrahtung der Einsatz-Sammlung mit dem Browser-Speicher.
 *
 * Die Sammlung selbst (`einsaetze.ts`) kennt nur eine hineingereichte Hülle —
 * nach ADR-003 wandert sie in den geteilten Kern und darf dort keine
 * Browser-Globals anfassen. Diese Datei bleibt im Produkt und ist die einzige
 * Stelle, die `localStorage` mit ihr verbindet.
 */

import { speicherhuelleSetzen, type Speicherhuelle } from "./einsaetze";

/** `localStorage`, sofern erreichbar — im Privatmodus oder bei blockiertem
 *  Speicher wirft schon der Zugriff auf die Eigenschaft. */
export function browserSpeicherhuelle(): Speicherhuelle | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/** Einmal beim Start aufrufen, bevor die Sammlung gelesen wird. */
export function speicherVerdrahten(): void {
  speicherhuelleSetzen(browserSpeicherhuelle());
}
