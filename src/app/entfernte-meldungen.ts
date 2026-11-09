/**
 * Gedächtnis für vor Ort entfernte Meldungen.
 *
 * „Entfernen" nimmt eine Einheit samt Fassungen spurlos aus der Sammlung
 * (`einheitEntfernen`). „Einsatz importieren…" ergänzt dann jede Meldung,
 * deren Kennung die Sammlung nicht kennt — also auch genau die entfernte, etwa
 * wenn die Sammel-PDF von vor dem Entfernen bei einer Schichtübergabe
 * zurückkommt. Sie stand dann still wieder als anwesend in der Lage, und die
 * Quittung nannte sie „neue Meldung" (Audit Runde 2, R2-D4).
 *
 * Der Kern (Submodul) bleibt unverändert: Die App merkt sich je Sammlung die
 * Kennungen der hier entfernten Einträge und fragt beim Import, ob sie wieder
 * hinein sollen. Gespeichert werden nur zufällige Kennungen, keine
 * Personendaten; der Eintrag wandert mit der Datensicherung und fällt mit
 * „Alle Daten löschen" weg (Präfix `eeb.`).
 */

import { einsaetzeLaden, einsaetzePapierkorb } from "./einsaetze-lesen";

const SCHLUESSEL = "eeb.entfernt.v1";

/** Sammlungs-Kennung → Kennungen der dort entfernten Einträge. */
type Stand = Record<string, string[]>;

function speicher(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function entfernteLaden(): Stand {
  const roh = speicher()?.getItem(SCHLUESSEL);
  if (!roh) return {};
  try {
    const x: unknown = JSON.parse(roh);
    if (!x || typeof x !== "object" || Array.isArray(x)) return {};
    const stand: Stand = {};
    for (const [k, v] of Object.entries(x)) {
      if (Array.isArray(v)) stand[k] = v.filter((id): id is string => typeof id === "string");
    }
    return stand;
  } catch {
    return {};
  }
}

function schreiben(stand: Stand): void {
  const s = speicher();
  if (!s) return;
  // Sammlungen, die es nicht mehr gibt (endgültig gelöscht), fallen heraus —
  // das Gedächtnis wächst nicht über die Sammlungen hinaus.
  const bekannt = new Set([...einsaetzeLaden(), ...einsaetzePapierkorb()].map((x) => x.id));
  const sauber: Stand = {};
  for (const [k, v] of Object.entries(stand)) if (bekannt.has(k) && v.length > 0) sauber[k] = v;
  try {
    if (Object.keys(sauber).length === 0) s.removeItem(SCHLUESSEL);
    else s.setItem(SCHLUESSEL, JSON.stringify(sauber));
  } catch {
    /* Speicher voll — das Entfernen selbst darf daran nicht scheitern */
  }
}

/** Nach „Entfernen"/„Fassung verwerfen": diese Kennungen gelten hier als bewusst entfernt. */
export function entfernteMerken(einsatzId: string, ids: string[]): void {
  if (ids.length === 0) return;
  const stand = entfernteLaden();
  stand[einsatzId] = [...new Set([...(stand[einsatzId] ?? []), ...ids])];
  schreiben(stand);
}




