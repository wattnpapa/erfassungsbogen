/**
 * „Zahlen stimmen, so gezählt" mit Rückweg (R16-S3): Die Rückfrage „Nur Sollplätze, keine gemeldete Stärke" macht die
 * Sollzahlen der Vorbelegung auf Wunsch zur gemeldeten Stärke. Ein Tipp daneben tat das ohne Quittung. Jetzt merkt sich die
 * App den Bogen davor; die Einsatzansicht quittiert mit „Rückgängig", das die Einheit wieder als Sollstärke führt.
 * Der Merker liegt nur im Speicher dieser Sitzung: Er gilt für die Quittung, die danach in der Einsatzansicht steht.
 */

import { bogenInhaltsId, einsaetzeLaden as kernEinsaetzeLaden, einsaetzeSpeichern } from "@bos/meldekopf/einsaetze";
import type { Erfassungsbogen } from "@bos/eeb-format/model";

export interface GezaehltWeg {
  einsatzId: string;
  /** Der Eintrag, der als „gezählt" abgelegt wurde. */
  eintragId: string;
  name: string;
  /** Der Bogen davor: Sollplätze, niemand gezählt. */
  soll: Erfassungsbogen;
  nonce: number;
}

let gemerkt: GezaehltWeg | null = null;
const hoerer = new Set<() => void>();

/**
 * Die Einsatzansicht hört mit (R17-S1): Sie öffnet schon, bevor das Ablegen zu Ende ist; ein erst danach gesetzter Merker
 * erreichte ihren Zustand nie, und die Quittung mit „Rückgängig" erschien nicht, obwohl die Rückfrage sie versprach.
 */
export function gezaehltWegBeobachten(f: () => void): () => void {
  hoerer.add(f);
  return () => hoerer.delete(f);
}

function melden(): void {
  for (const f of hoerer) f();
}

export function gezaehltWegMerken(w: Omit<GezaehltWeg, "nonce">): void {
  gemerkt = { ...w, nonce: Date.now() };
  melden();
}

/** Der Rückweg zu dieser Sammlung, falls einer gemerkt ist. */
export function gezaehltWegFuer(einsatzId: string): GezaehltWeg | null {
  return gemerkt?.einsatzId === einsatzId ? gemerkt : null;
}

export function gezaehltWegVergessen(): void {
  gemerkt = null;
  melden();
}

/**
 * Den als „gezählt" abgelegten Eintrag wieder zur Sollstärke machen: Der Bogen davor kommt an seine Stelle, Zeiten, Zug,
 * Nummer und Notiz am Eintrag bleiben. Liefert `false`, wenn der Eintrag nicht mehr da ist (entfernt, Sammlung gelöscht).
 */
export function gezaehltZuruecknehmen(w: GezaehltWeg): boolean {
  const liste = kernEinsaetzeLaden();
  const eintrag = liste.find((s) => s.id === w.einsatzId)?.eintraege.find((e) => e.id === w.eintragId);
  if (!eintrag) return false;
  eintrag.bogen = w.soll;
  eintragIdAnpassen(liste.find((s) => s.id === w.einsatzId)!.eintraege, eintrag, bogenInhaltsId(w.soll));
  einsaetzeSpeichern(liste);
  if (gemerkt?.nonce === w.nonce) {
    gemerkt = null;
    melden();
  }
  return true;
}

/** Die inhaltsbasierte Kennung folgt dem Bogen — außer, ein anderer Eintrag trägt sie schon. */
function eintragIdAnpassen(alle: { id: string }[], eintrag: { id: string }, neueId: string): void {
  if (!alle.some((x) => x !== eintrag && x.id === neueId)) eintrag.id = neueId;
}
