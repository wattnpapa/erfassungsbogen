/**
 * Restfrist eines Papierkorb-Eintrags (Audit Runde 4, R4-D5).
 *
 * „wird nach 30 Tagen automatisch endgültig entfernt" stand bei einem Einsatz,
 * der vor 29,7 Tagen gelöscht wurde, genauso da wie bei einem von vorgestern.
 * Dass er morgen verschwindet, musste man selbst ausrechnen. Der Text nennt
 * jetzt das Datum und ab {@link BALD_TAGE} Tagen die Restzeit.
 *
 * Gerechnet wird mit der geprüften Geräteuhr (datenschutz-uhr.ts): Eine
 * vorgestellte Uhr soll keine Löschung ankündigen, die gar nicht stattfindet.
 */
import { PAPIERKORB_FRIST_MS } from "@bos/meldekopf/papierkorb";
import { geprueftesJetztMs } from "./datenschutz-uhr";

const TAG_MS = 24 * 60 * 60 * 1000;

/** Ab so vielen verbleibenden Tagen wird die Frist hervorgehoben. */
export const BALD_TAGE = 3;

/** Kalendertag der Geräteuhr, immer zweistellig: „08.11.2026" (R7-D4: ein Format für alle Löschfristen). */
export function datumZweistellig(ms: number): string {
  return new Date(ms).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function papierkorbRest(
  geloeschtAm: number,
  jetzt = geprueftesJetztMs(),
): { text: string; bald: boolean } {
  const ende = geloeschtAm + PAPIERKORB_FRIST_MS;
  const rest = Math.max(0, Math.ceil((ende - jetzt) / TAG_MS));
  const datum = datumZweistellig(ende);
  const bald = rest <= BALD_TAGE;
  const restText = rest === 0 ? "beim nächsten Start" : rest === 1 ? "morgen" : `am ${datum}`;
  return {
    text: bald
      ? `Wird ${restText} endgültig entfernt${rest > 1 ? ` (in ${rest} Tagen)` : ""} — jetzt wiederherstellen, wenn du es noch brauchst.`
      : `Wird am ${datum} endgültig entfernt (in ${rest} Tagen).`,
    bald,
  };
}
