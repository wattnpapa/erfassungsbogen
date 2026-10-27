/**
 * Die Bildlaufstelle einer Ansicht über ein Neuladen hinweg (R14-S2).
 *
 * Ein Telefon verwirft die Seite im Hintergrund oder lädt sie neu; der Entwurf und die Sammlung kommen aus dem Speicher
 * zurück, die Stelle in der langen Liste (Einheitenliste mit 30 Einheiten, Personalkarten) ging verloren, und man begann
 * oben. Die App merkt sich beim Rollen, beim Ausblenden und beim Verlassen der Seite, wo in welcher Ansicht sie stand, und
 * rollt nach dem Neuladen dorthin zurück — nur in derselben Ansicht und nur für kurze Zeit.
 *
 * Neuer Speicherschlüssel: `eeb.ansicht-stelle.v1` im `sessionStorage` (je Tab, verschwindet mit dem Tab; nur eine Ansicht-
 * Kennung und eine Zahl, keine Personendaten). Alles tolerant gegen gesperrten Speicher.
 */

export const ANSICHT_STELLE_SCHLUESSEL = "eeb.ansicht-stelle.v1";
/** So lange gilt eine gemerkte Stelle; danach beginnt die Ansicht wieder oben. */
export const STELLE_MAX_ALTER_MS = 12 * 60 * 60 * 1000;
/** Unter dieser Höhe lohnt kein Zurückrollen. */
export const STELLE_MIN_PX = 120;

interface Stelle {
  ansicht: string;
  y: number;
  zeit: number;
}

/** Kennung der Ansicht, in der gerollt wird; `null` für Scanner und Musterung (Vollbild, nichts zu merken). */
export function ansichtSchluessel(a: { schritt: number; zeigeStart: boolean; einsatz: string | null; scanner: boolean; muster?: boolean }): string | null {
  if (a.scanner || a.muster) return null;
  if (a.einsatz) return `einsatz:${a.einsatz}`;
  return a.zeigeStart ? "start" : `schritt:${a.schritt}`;
}

export function stelleMerken(ansicht: string, y: number, jetzt: number = Date.now()): void {
  try {
    const s: Stelle = { ansicht, y: Math.max(0, Math.round(y)), zeit: jetzt };
    sessionStorage.setItem(ANSICHT_STELLE_SCHLUESSEL, JSON.stringify(s));
  } catch {
    /* gesperrt oder voll: dann beginnt die Ansicht nach dem Neuladen oben */
  }
}

/** Die gemerkte Stelle dieser Ansicht in Pixeln; `null`, wenn keine, eine andere Ansicht, zu alt oder zu klein. */
export function stelleLaden(ansicht: string, jetzt: number = Date.now()): number | null {
  try {
    const roh = sessionStorage.getItem(ANSICHT_STELLE_SCHLUESSEL);
    if (!roh) return null;
    const s = JSON.parse(roh) as Partial<Stelle> | null;
    if (!s || s.ansicht !== ansicht || typeof s.y !== "number" || typeof s.zeit !== "number") return null;
    if (!Number.isFinite(s.y) || jetzt - s.zeit > STELLE_MAX_ALTER_MS || jetzt < s.zeit) return null;
    return s.y >= STELLE_MIN_PX ? s.y : null;
  } catch {
    return null;
  }
}

/**
 * Die zuletzt aufgeklappte Karte einer Einsatz-Sammlung über ein Neuladen hinweg (R17-E5, R17-O2, R17-S10, R17-W5).
 *
 * Die Bildlaufstelle blieb, die Karte war wieder zu: Wer die Seite nach einer Unterbrechung neu lud, stand vor 30 zugeklappten
 * Karten und musste die suchen, an der er gearbeitet hatte. Neuer Speicherschlüssel `eeb.karte-offen.v1` im
 * `sessionStorage` (je Tab; Einsatz-ID und Schlüssel der Einheit, keine Personendaten; „Alle Daten löschen" leert ihn mit).
 */
export const KARTE_OFFEN_SCHLUESSEL = "eeb.karte-offen.v1";

interface OffeneKarte {
  einsatz: string;
  einheit: string;
  zeit: number;
}

/** Diese Karte ist aufgeklappt (`einheit`) bzw. keine mehr (`null`, nur wenn sie noch die gemerkte war). */
export function karteOffenMerken(einsatz: string, einheit: string, offen: boolean, jetzt: number = Date.now()): void {
  try {
    if (offen) {
      sessionStorage.setItem(KARTE_OFFEN_SCHLUESSEL, JSON.stringify({ einsatz, einheit, zeit: jetzt } satisfies OffeneKarte));
      return;
    }
    const roh = sessionStorage.getItem(KARTE_OFFEN_SCHLUESSEL);
    const k = roh ? (JSON.parse(roh) as Partial<OffeneKarte> | null) : null;
    if (k && k.einsatz === einsatz && k.einheit === einheit) sessionStorage.removeItem(KARTE_OFFEN_SCHLUESSEL);
  } catch {
    /* gesperrt oder voll: dann beginnt die Liste nach dem Neuladen zugeklappt */
  }
}

/** War diese Karte beim letzten Mal aufgeklappt (und das ist nicht länger als {@link STELLE_MAX_ALTER_MS} her)? */
export function karteWarOffen(einsatz: string, einheit: string, jetzt: number = Date.now()): boolean {
  try {
    const roh = sessionStorage.getItem(KARTE_OFFEN_SCHLUESSEL);
    if (!roh) return false;
    const k = JSON.parse(roh) as Partial<OffeneKarte> | null;
    if (!k || k.einsatz !== einsatz || k.einheit !== einheit || typeof k.zeit !== "number") return false;
    return jetzt >= k.zeit && jetzt - k.zeit <= STELLE_MAX_ALTER_MS;
  } catch {
    return false;
  }
}
