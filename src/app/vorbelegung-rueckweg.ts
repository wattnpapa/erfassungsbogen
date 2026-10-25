/**
 * Rückweg von „Vorbelegung entfernen" über das Neuladen hinaus (Audit Runde 5,
 * R5-D5).
 *
 * Die Leiste „Vorbelegung entfernt: … — Stärke 5 → 1" bietet „Rückgängig". Der
 * Stand dafür lag nur im Arbeitsspeicher; ein Neuladen (oder das Beenden der
 * App durch das System) nahm den Rückweg, und die Sollplätze samt Rolle,
 * Funktion, Geschlecht und Ernährung waren weg. Jetzt liegt er für kurze Zeit
 * im Sitzungsspeicher dieses Tabs: nicht in `localStorage`, nicht in der
 * Datensicherung, weg mit dem Schließen des Tabs. Er enthält nur unbenannte
 * Sollplätze (kein Name, keine Rufnummer — das ist ihre Definition, siehe
 * `personUnbenannt`).
 */

import type { Einheit, Fahrzeug, Person } from "@bos/eeb-format/model";

const SCHLUESSEL = "eeb.vorbelegung.rueckweg";

/** So lange gilt der Rückweg nach einem Neuladen (Millisekunden). */
export const RUECKWEG_FRIST_MS = 15 * 60 * 1000;

export interface VorbelegungWeg {
  /**
   * Fingerabdruck von Personal und Fahrzeugen NACH dem Entfernen. Der Rückweg
   * gilt nach einem Neuladen nur, solange sich daran nichts geändert hat — wer
   * inzwischen Namen eingetragen hat, verlöre sie sonst mit „Rückgängig".
   */
  danach?: string;
  kopf: string;
  vor: number;
  personal: Person[];
  fahrzeuge: Fahrzeug[];
  einheit: Einheit;
  nonce: number;
}

function sitzung(): Storage | null {
  try {
    return globalThis.sessionStorage ?? null;
  } catch {
    return null;
  }
}

export function vorbelegungWegSichern(v: VorbelegungWeg | null): void {
  try {
    if (v) sitzung()?.setItem(SCHLUESSEL, JSON.stringify(v));
    else sitzung()?.removeItem(SCHLUESSEL);
  } catch {
    /* zu groß oder gesperrt — dann gilt der Rückweg nur bis zum Neuladen, wie bisher */
  }
}

/** Fingerabdruck des Zustands, den der Rückweg wieder herstellen darf zu überschreiben. */
export function zustandsAbdruck(personal: readonly Person[], fahrzeuge: readonly Fahrzeug[]): string {
  return JSON.stringify([personal, fahrzeuge]);
}

/**
 * Der gemerkte Rückweg, solange er jung genug ist und Personal und Fahrzeuge
 * noch so aussehen wie nach dem Entfernen (`aktuell`); sonst null (und gelöscht).
 */
export function vorbelegungWegLesen(
  aktuell: { personal: readonly Person[]; fahrzeuge: readonly Fahrzeug[] },
  jetzt = Date.now(),
): VorbelegungWeg | null {
  try {
    const roh = sitzung()?.getItem(SCHLUESSEL);
    if (!roh) return null;
    const v = JSON.parse(roh) as Partial<VorbelegungWeg>;
    if (
      typeof v.kopf !== "string" ||
      typeof v.vor !== "number" ||
      typeof v.nonce !== "number" ||
      !Array.isArray(v.personal) ||
      !Array.isArray(v.fahrzeuge) ||
      !v.einheit ||
      jetzt - v.nonce > RUECKWEG_FRIST_MS ||
      v.danach !== zustandsAbdruck(aktuell.personal, aktuell.fahrzeuge)
    ) {
      sitzung()?.removeItem(SCHLUESSEL);
      return null;
    }
    return v as VorbelegungWeg;
  } catch {
    return null;
  }
}
