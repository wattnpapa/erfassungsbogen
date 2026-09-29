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

import { einsaetzeLaden, einsaetzePapierkorb, type Einsatzsammlung, type MeldeEintrag } from "@bos/meldekopf/einsaetze";
import { frageJaNein } from "./dialoge";
import { einheitAnzeigename } from "./hilfen";

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

/** Nach „Rückgängig" oder bewusstem Wiederaufnehmen: nicht mehr als entfernt führen. */
export function entfernteVergessen(einsatzId: string, ids: string[]): void {
  const stand = entfernteLaden();
  if (!stand[einsatzId]) return;
  const weg = new Set(ids);
  stand[einsatzId] = stand[einsatzId].filter((id) => !weg.has(id));
  schreiben(stand);
}

/**
 * Einträge einer importierten Sammlung, die auf diesem Gerät aus derselben
 * Sammlung entfernt wurden und dort nicht (wieder) stehen. Rein.
 */
export function zurueckkehrende(importiert: Einsatzsammlung, vorhanden: Einsatzsammlung | undefined, stand: Stand): MeldeEintrag[] {
  if (!vorhanden) return [];
  const entfernt = new Set(stand[importiert.id] ?? []);
  if (entfernt.size === 0) return [];
  const da = new Set(vorhanden.eintraege.map((e) => e.id));
  return importiert.eintraege.filter((e) => entfernt.has(e.id) && !da.has(e.id));
}

/** Einheitennamen der Einträge, je Einheit einmal. */
function namen(eintraege: MeldeEintrag[]): string {
  return [...new Set(eintraege.map((e) => einheitAnzeigename(e.bogen.einheit)))].map((n) => `„${n}“`).join(", ");
}

/**
 * Vor dem Import: Stecken vor Ort entfernte Meldungen in der Datei, wird
 * gefragt — ohne Antwort (Abbrechen, Esc) bleiben sie draußen. Rückgabe: die
 * zu importierende Sammlung und ein Satz für die Quittung (leer, wenn nichts
 * betroffen war).
 */
export async function entfernteImImportKlaeren(s: Einsatzsammlung): Promise<{ sammlung: Einsatzsammlung; hinweis: string }> {
  const vorhanden = [...einsaetzeLaden(), ...einsaetzePapierkorb()].find((x) => x.id === s.id);
  const zurueck = zurueckkehrende(s, vorhanden, entfernteLaden());
  if (zurueck.length === 0) return { sammlung: s, hinweis: "" };
  const wer = namen(zurueck);
  const n = zurueck.length;
  const wieder = await frageJaNein({
    titel: "Hier entfernte Meldungen in der Datei",
    text:
      `Die Datei enthält ${n === 1 ? "eine Meldung" : `${n} Meldungen`}, die auf diesem Gerät aus „${s.name}“ ` +
      `entfernt ${n === 1 ? "wurde" : "wurden"}: ${wer}. Ohne deine Zustimmung ${n === 1 ? "bleibt sie" : "bleiben sie"} draußen.`,
    ok: "Wieder aufnehmen",
    abbruch: "Draußen lassen",
  });
  if (wieder) {
    entfernteVergessen(s.id, zurueck.map((e) => e.id));
    return { sammlung: s, hinweis: ` Zuvor entfernt, wieder aufgenommen: ${wer}.` };
  }
  const weg = new Set(zurueck.map((e) => e.id));
  return {
    sammlung: { ...s, eintraege: s.eintraege.filter((e) => !weg.has(e.id)) },
    hinweis: ` Hier entfernt und nicht wieder aufgenommen: ${wer}.`,
  };
}
