/**
 * Anonymisierte Bögen beim Einlesen benennen (R11-A1).
 *
 * Ein Bogen mit Stand über 90 Tage kommt ohne Namen, Funktionen und Erreichbarkeiten an: gewollt
 * (Datenschutzfrist), aber das Papier in der Fahrzeugmappe trägt sie weiter. Die Quittung sagt es, und die
 * Karte erklärt ihre Marke sichtbar statt nur im Tooltip.
 */

import { DATENSCHUTZFRIST_TAGE } from "@bos/eeb-format/datenschutzfrist";
import { MINUTEN_JE_TAG, type EebZeitpunkt, type Erfassungsbogen } from "@bos/eeb-format/model";




/** „Namen im Code gültig bis 17.10.2026" für den Ausdruck neben dem Code; leer bei Übungsbögen (keine Frist). */
export function codeGueltigBisText(
  b: Pick<Erfassungsbogen, "uebung" | "stand">,
  formatiere: (z: EebZeitpunkt) => string,
  /** Frist beim Druck schon vorbei: „seit … abgelaufen" statt eines Datums in der Vergangenheit (R12-A1). */
  abgelaufen = false,
): string {
  if (b.uebung) return "";
  const ende = formatiere(b.stand + DATENSCHUTZFRIST_TAGE * MINUTEN_JE_TAG);
  return abgelaufen ? `Namen im Code seit ${ende} abgelaufen (Datenschutzfrist)` : `Namen im Code gültig bis ${ende}`;
}



/** Satz im Personalblock der Bogenseite: warum dort „Einsatzkraft n" steht und wo die Namen zu holen sind (R12-A1). */
export const ANONYM_PERSONAL_SATZ =
  `Personal anonymisiert (Datenschutzfrist: Stand älter als ${DATENSCHUTZFRIST_TAGE} Tage). Namen, Funktionen und Rufnummern stehen nur noch auf dem Papier der Einheit - dort nachfragen.`;
