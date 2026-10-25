/**
 * Die Haken einer angefangenen Musterung überleben ein Neuladen (Audit Runde 4,
 * R4-E7).
 *
 * „Einsatz vorbereiten": drei von acht Personen abgehakt, Neuladen — die
 * Startseite stand ohne Hinweis da, die Auswahl war weg. Der Bogen selbst
 * überlebt jedes Neuladen, die Musterung nicht; bei einem Zug mit 30 Personen
 * ist das eine Minute Arbeit, die am Telefon (das Betriebssystem beendet die
 * App im Hintergrund) leicht anfällt.
 *
 * Gespeichert wird nur, welche Vorlage gemustert wird und welche Plätze
 * angehakt sind (Wahrheitswerte nach Stelle) — keine Namen, keine Bogendaten.
 * Der Eintrag steht unter `eeb.musterung.v1`, wandert wie alle `eeb.`-Einträge
 * mit der Datensicherung und fällt mit „Alle Daten löschen". Er verschwindet,
 * sobald die Musterung endet (Start, Abbrechen, Wechsel der Ansicht); gilt nur
 * für dieselbe Fassung der Vorlage und höchstens einen Tag.
 */

import type { Vorlage } from "./vorlagen";

const SCHLUESSEL = "eeb.musterung.v1";

/** So lange gilt eine unterbrochene Musterung. */
export const MUSTERUNG_FRIST_MS = 24 * 60 * 60 * 1000;

export interface MusterungStand {
  vorlageId: string;
  /** `geaendert` der Vorlage zum Zeitpunkt — eine geänderte Vorlage hat andere Plätze. */
  vorlageGeaendert: number;
  personal: boolean[];
  fahrzeuge: boolean[];
  bedarf: boolean;
  bemerkung: boolean;
  /** Date.now() des letzten Hakens. */
  zeit: number;
}

function speicher(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function wahrheitswerte(x: unknown): boolean[] | null {
  return Array.isArray(x) && x.every((v) => typeof v === "boolean") ? (x as boolean[]) : null;
}

export function musterungStandLaden(): MusterungStand | null {
  try {
    const roh = speicher()?.getItem(SCHLUESSEL);
    if (!roh) return null;
    const x = JSON.parse(roh) as Partial<MusterungStand> | null;
    const personal = wahrheitswerte(x?.personal);
    const fahrzeuge = wahrheitswerte(x?.fahrzeuge);
    if (!x || typeof x.vorlageId !== "string" || typeof x.vorlageGeaendert !== "number" || !personal || !fahrzeuge) return null;
    if (typeof x.zeit !== "number" || Date.now() - x.zeit > MUSTERUNG_FRIST_MS) return null;
    return {
      vorlageId: x.vorlageId,
      vorlageGeaendert: x.vorlageGeaendert,
      personal,
      fahrzeuge,
      bedarf: x.bedarf === true,
      bemerkung: x.bemerkung === true,
      zeit: x.zeit,
    };
  } catch {
    return null;
  }
}

export function musterungStandSpeichern(stand: MusterungStand): void {
  try {
    speicher()?.setItem(SCHLUESSEL, JSON.stringify(stand));
  } catch {
    /* Speicher voll — die Musterung selbst darf daran nicht scheitern */
  }
}

export function musterungStandLoeschen(): void {
  try {
    speicher()?.removeItem(SCHLUESSEL);
  } catch {
    /* Komfort */
  }
}

/** Passt der gemerkte Stand zu dieser Vorlage (gleiche Fassung, gleiche Plätze)? */
export function standPasst(stand: MusterungStand | null, v: Vorlage): stand is MusterungStand {
  return (
    stand != null &&
    stand.vorlageId === v.id &&
    stand.vorlageGeaendert === v.geaendert &&
    stand.personal.length === v.bogen.personal.length &&
    stand.fahrzeuge.length === v.bogen.fahrzeuge.length
  );
}

/** Die Vorlage, deren Musterung vor dem Neuladen offen war — oder null. */
export function musterungVorlageAusStand(vorlagen: Vorlage[]): Vorlage | null {
  const stand = musterungStandLaden();
  return vorlagen.find((v) => standPasst(stand, v)) ?? null;
}
