/**
 * Einsatzbeginn und Funkrufname des Lagemonitors reisen mit der Weitergabe
 * (Audit Runde 7, R7-K5). Beide stehen in keinem Bogen und nicht in der
 * Sammlung (lagemonitor-beginn.ts); nach einer Ablösung zeigte der Monitor des
 * zweiten Geräts deshalb eine andere Zeitbasis und einen anderen Kopf.
 *
 * Sie wandern im Umschlag der Sammel-PDF und der Einsatz-Datei mit (Feld
 * `lage`, wie die Stände der Exporte) und werden beim Einlesen NUR gesetzt, wenn
 * auf diesem Gerät für den Einsatz noch nichts gesetzt ist — ein von Hand
 * gesetzter Wert wird nie überschrieben. Keine Personendaten.
 */

import { einsatzFunkrufLaden, einsatzFunkrufSetzen, einsatzbeginnLaden, einsatzbeginnSetzen, FUNKRUF_MAX } from "./lagemonitor-beginn";

export interface LageAngaben {
  beginn?: number;
  funkruf?: string;
}

/** Was dieses Gerät für den Einsatz gesetzt hat, oder `undefined`, wenn nichts. */
export function lageAngabenLaden(einsatzId: string): LageAngaben | undefined {
  const beginn = einsatzbeginnLaden(einsatzId);
  const funkruf = einsatzFunkrufLaden(einsatzId);
  if (beginn == null && funkruf == null) return undefined;
  return { ...(beginn != null ? { beginn } : {}), ...(funkruf != null ? { funkruf } : {}) };
}

/** Umschlagfeld prüfen; Unbrauchbares fällt weg. */
export function lageAngabenPruefen(x: unknown): LageAngaben | undefined {
  if (!x || typeof x !== "object" || Array.isArray(x)) return undefined;
  const o = x as Record<string, unknown>;
  const beginn = typeof o.beginn === "number" && Number.isFinite(o.beginn) ? o.beginn : undefined;
  const funkruf = typeof o.funkruf === "string" && o.funkruf.trim() ? o.funkruf.trim().slice(0, FUNKRUF_MAX) : undefined;
  if (beginn == null && funkruf == null) return undefined;
  return { ...(beginn != null ? { beginn } : {}), ...(funkruf != null ? { funkruf } : {}) };
}

/**
 * Angaben aus der Datei übernehmen, soweit hier noch nichts gesetzt ist.
 * Rückgabe: ein Satz für die Quittung (leer, wenn nichts zu sagen ist).
 */
export function lageAngabenUebernehmen(einsatzId: string, angaben: LageAngaben | undefined, bekannteIds: readonly string[]): string {
  if (!angaben) return "";
  const gesetzt: string[] = [];
  const abweichend: string[] = [];
  if (angaben.beginn != null) {
    const hier = einsatzbeginnLaden(einsatzId);
    if (hier == null) {
      if (einsatzbeginnSetzen(einsatzId, angaben.beginn, bekannteIds)) {
        gesetzt.push(`Einsatzbeginn ${new Date(angaben.beginn).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })} Uhr`);
      }
    } else if (hier !== angaben.beginn) abweichend.push("Einsatzbeginn");
  }
  if (angaben.funkruf != null) {
    const hier = einsatzFunkrufLaden(einsatzId);
    if (hier == null) {
      if (einsatzFunkrufSetzen(einsatzId, angaben.funkruf, bekannteIds)) gesetzt.push(`Funkrufname „${angaben.funkruf}"`);
    } else if (hier !== angaben.funkruf) abweichend.push("Funkrufname");
  }
  return [
    gesetzt.length > 0 ? `Für den Lagemonitor übernommen: ${gesetzt.join(", ")}.` : "",
    abweichend.length > 0 ? `${abweichend.join(" und ")} der Datei weicht von deinem gesetzten Wert ab — dein Wert bleibt.` : "",
  ]
    .filter(Boolean)
    .join(" ");
}
