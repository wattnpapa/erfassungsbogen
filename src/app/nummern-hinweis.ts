/**
 * Merkzettel „Nummern haben sich geändert“ je Einsatz (R20-D3).
 *
 * Beim Zusammenführen zweier Sammlungen ändern sich laufende Nummern; der Satz dazu stand nur in der Quittung des Einlesens und war nach
 * dem Neuladen weg. Wer am Funk „Nr. 1“ als Ansbach geführt hatte, meldete danach Sinsheim. Der Satz bleibt jetzt in der Einsatzansicht
 * stehen, bis ein neues Lageblatt erzeugt wird (das trägt die neuen Nummern) oder jemand ihn quittiert.
 *
 * Schlüssel `eeb.nummernhinweis.v1`: { [einsatzId]: Satz }. Ein Komfort-Vermerk, kein Fachdatum: Scheitert das Schreiben (Speicher voll),
 * fehlt nur der dauerhafte Hinweis; die Quittung des Einlesens nennt die Nummern weiterhin.
 */
import { einsaetzeLaden, einsaetzePapierkorb } from "./einsaetze-lesen";
import { einsatzWerte } from "./lagemonitor-speicher";

const werte = einsatzWerte<string>("eeb.nummernhinweis.v1", (x): x is string => typeof x === "string" && x !== "");
const bekannt = () => [...einsaetzeLaden(), ...einsaetzePapierkorb()].map((s) => s.id);

/** Den Satz zu den geänderten Nummern dieses Einsatzes merken. Rückgabe: ob er geschrieben wurde. */
export const nummernHinweisMerken = (einsatzId: string, text: string): boolean => !!text && werte.setzen(einsatzId, text, bekannt());

/** Der gemerkte Satz zu diesem Einsatz oder null. */
export const nummernHinweisLaden = (einsatzId: string): string | null => werte.laden(einsatzId);

/** Der Hinweis gilt nicht mehr (neues Lageblatt, Rückgängig, quittiert). */
export function nummernHinweisLoeschen(einsatzId: string): void {
  if (werte.laden(einsatzId)) werte.setzen(einsatzId, null, bekannt());
}
