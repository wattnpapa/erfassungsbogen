/**
 * Personen, die bei „Einsatz vorbereiten" abgewählt wurden — für den
 * Nachzügler (Audit Runde 4, R4-W8): Wer später doch kommt, muss im
 * Personalschritt nicht komplett neu eingegeben werden, Funktion,
 * Fahrerlaubnis und Erreichbarkeit stehen noch in der Vorlage.
 *
 * Nur im Arbeitsspeicher und nur für den Bogen, der aus dieser Musterung
 * entstand (Schlüssel der Einheit): Eine andere Einheit bekommt nie Personen
 * einer fremden Vorlage angeboten, und nach dem Neuladen ist die Liste weg —
 * dann hilft die Vorlage selbst, wie bisher.
 */

import type { Erfassungsbogen, Person } from "@bos/eeb-format/model";
import { einheitSchluessel } from "@bos/meldekopf/einsaetze";

let stand: { schluessel: string; personen: Person[] } | null = null;

/** Nach der Musterung: die abgewählten Personen merken (leer = nichts anzubieten). */
export function nachzueglerMerken(bogen: Erfassungsbogen, abgewaehlt: Person[]): void {
  stand = abgewaehlt.length > 0 ? { schluessel: einheitSchluessel(bogen.einheit), personen: structuredClone(abgewaehlt) } : null;
}

const name = (p: Person) => `${p.vorname.trim().toLowerCase()}|${p.nachname.trim().toLowerCase()}`;

/** Abgewählte Personen der Vorlage dieses Bogens, die noch nicht im Bogen stehen. */
export function nachzueglerFuer(bogen: Erfassungsbogen): Person[] {
  if (!stand || stand.schluessel !== einheitSchluessel(bogen.einheit)) return [];
  const da = new Set(bogen.personal.map(name));
  return stand.personen.filter((p) => !da.has(name(p)));
}
