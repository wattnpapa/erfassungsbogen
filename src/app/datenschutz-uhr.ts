/**
 * Geräteuhr für die Datenschutzfrist.
 *
 * Die Frist regelt das Format (`@bos/eeb-format/datenschutzfrist`): 90 Tage
 * nach dem Stand eines Bogens verfallen seine Personaldaten, Übungen sind
 * ausgenommen. Hier wird nur entschieden, welche Uhrzeit dafür gilt. Die
 * Geräteuhr zählt, außer sie ist unplausibel weit nach vorn gesprungen (siehe
 * `uhrPruefen`). Dafür merkt sich die App den zuletzt akzeptierten Zeitpunkt
 * unter `eeb.uhr.v1`. Der Eintrag wandert wie alle `eeb.`-Einträge mit der
 * Datensicherung und fällt mit „Alle Daten löschen".
 */

import { jetztZeitpunkt, type EebZeitpunkt } from "@bos/eeb-format/model";
import { uhrPruefen, type Uhrstand } from "@bos/eeb-format/datenschutzfrist";

const SPEICHER_SCHLUESSEL = "eeb.uhr.v1";

/** JSON-String → Uhrstand. Defensiv: Müll ergibt null (wie ein erster Start). */
export function uhrstandAusJson(text: string | null): Uhrstand | null {
  if (!text) return null;
  try {
    const roh = JSON.parse(text) as Partial<Uhrstand> | null;
    if (typeof roh?.zuletzt !== "number") return null;
    return typeof roh.sprung === "number" ? { zuletzt: roh.zuletzt, sprung: roh.sprung } : { zuletzt: roh.zuletzt };
  } catch {
    return null;
  }
}

function speicher(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null; // z. B. Privatmodus/blockierter Speicher
  }
}

/**
 * Zeitpunkt, an dem die Datenschutzfrist gemessen wird. Schreibt den Uhrstand
 * nur, wenn er sich geändert hat — also höchstens einmal je Minute.
 */
export function datenschutzZeitpunkt(jetzt: EebZeitpunkt = jetztZeitpunkt()): EebZeitpunkt {
  const s = speicher();
  let alt: string | null = null;
  try {
    alt = s?.getItem(SPEICHER_SCHLUESSEL) ?? null;
  } catch {
    /* blockierter Speicher — dann gilt die Geräteuhr ungeprüft */
  }
  const r = uhrPruefen(jetzt, uhrstandAusJson(alt));
  const neu = JSON.stringify(r.stand);
  if (neu !== alt) {
    try {
      s?.setItem(SPEICHER_SCHLUESSEL, neu);
    } catch {
      /* Speicher voll o. ä. — die Prüfung darf nie die Arbeit stören */
    }
  }
  return r.zeitpunkt;
}
