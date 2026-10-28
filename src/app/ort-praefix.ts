/**
 * R20-H1: Wer in der Schnellerfassung den Ort so einträgt, wie er auf dem Zettel steht
 * („THW Oldenburg"), setzte die Organisation ein zweites Mal davor („THW THW Oldenburg").
 * Der Anzeigename (hilfen.ts, einheitAnzeigename) führt jetzt jeden Teil nur einmal; dieser
 * Helfer bereinigt zusätzlich den gespeicherten Ortsnamen, sobald das Feld verlassen ist.
 */

/**
 * Ort ohne führende Organisation: „THW Oldenburg" → „Oldenburg" bei Organisation „THW".
 * Bleibt unverändert, wenn nichts übrig bliebe („THW") oder das Präfix nur ein Wortteil ist
 * („THWalde").
 */
export function ortOhneOrganisation(ort: string, organisation: string): string {
  const org = organisation.trim();
  if (!org) return ort;
  const roh = org.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const rest = ort.replace(new RegExp(`^\\s*${roh}(?![\\p{L}\\p{N}])[\\s,:–-]*`, "iu"), "");
  return rest.trim() && rest !== ort ? rest.trim() : ort;
}
