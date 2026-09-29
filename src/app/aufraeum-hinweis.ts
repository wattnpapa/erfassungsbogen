/**
 * Nachricht über automatisch gelöschte, ruhende Einsatz-Sammlungen.
 *
 * Der Kern (`@bos/meldekopf/einsaetze`) löscht eine Sammlung, die 90 Tage nicht
 * geändert wurde, endgültig — gewollt (Datenschutz, Aufräumfrist), aber still:
 * Wer das Meldekopf-Tablet nach Monaten zur Nachbereitung wieder einschaltet,
 * fand die Sammlung weder in der Liste noch im Papierkorb und wusste nicht, ob
 * sie je auf dem Gerät war (Audit Runde 2, R2-D5).
 *
 * Der Kern meldet nicht, WAS er entfernt hat. Die App reicht ihm die Ablage
 * aber selbst herein (speicher-browser.ts, ADR-003) — dort schaut diese Hülle
 * beim Lesen der Sammlungen mit auf die Uhr und merkt sich, welche Sammlung
 * die Frist überschritten hat, bevor der Kern sie verwirft. Gemerkt werden nur
 * Name, Zeitraum und Zahl der Meldungen, keine Personendaten; die Startseite
 * nennt sie einmal beim Namen, bis „Verstanden" gedrückt wird.
 */

import {
  AUFRAEUM_FRIST_MS,
  einsaetzeAusJson,
  neuesteJeEinheit,
  type Speicherhuelle,
} from "@bos/meldekopf/einsaetze";

/** Speicherschlüssel der Sammlungen im Kern (einsaetze.ts, nicht exportiert). */
const SAMMLUNGEN_SCHLUESSEL = "eeb.einsaetze.v1";
const HINWEIS_SCHLUESSEL = "eeb.aufgeraeumt.v1";

export interface AufgeraeumteSammlung {
  id: string;
  name: string;
  /** Angelegt / zuletzt geändert (Date.now()) — der Zeitraum, den sie abdeckte. */
  angelegt: number;
  geaendert: number;
  einheiten: number;
  meldungen: number;
  /** Wann die App sie entfernt hat. */
  entferntAm: number;
}

function lokalerSpeicher(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/** Die gemerkten Löschungen, älteste zuerst. Leer bei fehlendem/kaputtem Speicher. */
export function aufgeraeumteLaden(speicher: Pick<Storage, "getItem"> | null = lokalerSpeicher()): AufgeraeumteSammlung[] {
  try {
    const roh = speicher?.getItem(HINWEIS_SCHLUESSEL);
    const liste: unknown = roh ? JSON.parse(roh) : [];
    return Array.isArray(liste) ? (liste as AufgeraeumteSammlung[]) : [];
  } catch {
    return [];
  }
}

/** „Verstanden": die Nachricht ist gelesen und verschwindet. */
export function aufgeraeumteQuittieren(speicher: Pick<Storage, "removeItem"> | null = lokalerSpeicher()): void {
  try {
    speicher?.removeItem(HINWEIS_SCHLUESSEL);
  } catch {
    // Speicher blockiert — die Nachricht kommt dann beim nächsten Start wieder.
  }
}

/**
 * Welche Sammlungen im gespeicherten Text die Aufräumfrist überschritten haben
 * (Papierkorb-Einträge nicht: die haben ihre eigene Uhr) — und diese vormerken.
 */
export function ruhendeVormerken(
  text: string | null,
  speicher: Pick<Storage, "getItem" | "setItem"> | null,
  jetzt = Date.now(),
): void {
  if (!text || !speicher) return;
  const abgelaufen = einsaetzeAusJson(text).filter(
    (s) => s.geloeschtAm == null && jetzt - s.geaendert >= AUFRAEUM_FRIST_MS,
  );
  if (abgelaufen.length === 0) return;
  const bisher = aufgeraeumteLaden(speicher);
  const neu = abgelaufen
    .filter((s) => !bisher.some((b) => b.id === s.id))
    .map<AufgeraeumteSammlung>((s) => ({
      id: s.id,
      name: s.name,
      angelegt: s.angelegt,
      geaendert: s.geaendert,
      einheiten: neuesteJeEinheit(s.eintraege).length,
      meldungen: s.eintraege.length,
      entferntAm: jetzt,
    }));
  if (neu.length === 0) return;
  try {
    speicher.setItem(HINWEIS_SCHLUESSEL, JSON.stringify([...bisher, ...neu]));
  } catch {
    // Speicher voll: die Löschung selbst läuft trotzdem (Datenschutz geht vor).
  }
}

/**
 * Hülle um die Ablage, die beim Lesen der Sammlungen die fällige Löschung
 * vormerkt. Derselbe Text wird nur einmal geprüft — der Kern liest bei jedem
 * Zugriff, und eine große Sammlung jedes Mal zu parsen wäre unnötig.
 */
export function aufraeumBeobachter(innen: Speicherhuelle & Partial<Pick<Storage, "removeItem">>): Speicherhuelle {
  let zuletzt: string | null = null;
  return {
    getItem(schluessel: string) {
      const text = innen.getItem(schluessel);
      if (schluessel === SAMMLUNGEN_SCHLUESSEL && text !== zuletzt) {
        zuletzt = text;
        try {
          ruhendeVormerken(text, innen);
        } catch {
          // Nie das Laden der Sammlungen blockieren.
        }
      }
      return text;
    },
    setItem(schluessel: string, wert: string) {
      innen.setItem(schluessel, wert);
    },
  };
}
