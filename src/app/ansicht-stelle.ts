/**
 * Die Bildlaufstelle einer Ansicht über ein Neuladen hinweg (R14-S2).
 *
 * Ein Telefon verwirft die Seite im Hintergrund oder lädt sie neu; der Entwurf kommt aus dem Speicher
 * zurück, die Stelle in der langen Liste (Personalkarten, Startseite) ging verloren, und man begann
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
export function ansichtSchluessel(a: { schritt: number; zeigeStart: boolean; scanner: boolean; muster?: boolean }): string | null {
  if (a.scanner || a.muster) return null;
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
