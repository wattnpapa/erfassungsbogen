/**
 * Automatische Entwurfssicherung: der gerade bearbeitete Bogen wird bei jeder
 * Änderung still im localStorage abgelegt. Tab geschlossen, Akku leer, App im
 * Hintergrund beendet — beim nächsten Start bietet die Startseite „Aktuellen
 * Bogen fortsetzen" mit dem letzten Stand an. Verworfen wird der Entwurf erst,
 * wenn der Bogen bewusst geschlossen wird („Neuer Bogen", Übernahme in einen
 * Einsatz).
 */

import type { Erfassungsbogen } from "../model";
import { migriereBogen } from "./hilfen";

const SPEICHER_SCHLUESSEL = "eeb.entwurf.v1";

export interface Entwurf {
  gespeichert: number; // Date.now()
  bogen: Erfassungsbogen;
}

// ------------------------------------------------- Serialisierung (rein)

/** JSON-String → Entwurf. Defensiv: Müll oder fremdes Format ergibt null. */
export function entwurfAusJson(text: string | null): Entwurf | null {
  if (!text) return null;
  let roh: unknown;
  try {
    roh = JSON.parse(text);
  } catch {
    return null;
  }
  const e = roh as Entwurf;
  if (!e || typeof e.gespeichert !== "number" || !e.bogen || !Array.isArray(e.bogen.personal)) return null;
  try {
    e.bogen = migriereBogen(e.bogen);
  } catch {
    return null;
  }
  return e;
}

export function entwurfZuJson(bogen: Erfassungsbogen, gespeichert = Date.now()): string {
  return JSON.stringify({ gespeichert, bogen });
}

// ------------------------------------------------- localStorage-Hülle (I/O)

function speicher(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null; // z. B. Privatmodus/blockierter Speicher
  }
}

export function entwurfLaden(): Entwurf | null {
  const s = speicher();
  return s ? entwurfAusJson(s.getItem(SPEICHER_SCHLUESSEL)) : null;
}

export function entwurfSpeichern(bogen: Erfassungsbogen): void {
  try {
    speicher()?.setItem(SPEICHER_SCHLUESSEL, entwurfZuJson(bogen));
  } catch {
    /* Speicher voll o. ä. — Autosave darf die Bearbeitung nie stören */
  }
}

export function entwurfVerwerfen(): void {
  speicher()?.removeItem(SPEICHER_SCHLUESSEL);
}
