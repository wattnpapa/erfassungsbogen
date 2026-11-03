/** Gewählte Ansicht des Monitors: „v1" (Bestand) oder „v2" (Einheiten im Vordergrund, Einstellungen im Menü). */
export const ANSICHT_SCHLUESSEL = "eeb.lageansicht.v1";
export type Ansicht = "v1" | "v2";

export function ansichtLesen(): Ansicht {
  try {
    if (globalThis.localStorage?.getItem(ANSICHT_SCHLUESSEL) === "v2") return "v2";
  } catch { /* gesperrter Speicher: Bestand */ }
  return "v1";
}

export function ansichtMerken(ansicht: Ansicht): void {
  try { globalThis.localStorage?.setItem(ANSICHT_SCHLUESSEL, ansicht); } catch { /* nicht gemerkt, der Monitor läuft trotzdem */ }
}

/** Spalten des Kachelrasters von V2: so viele, dass alle Einheiten ohne Rollen ins Bild passen (Seitenverhältnis des Fensters). */
export function kachelSpalten(anzahl: number, breite: number, hoehe: number): number {
  if (anzahl <= 1) return 1;
  const verhaeltnis = breite > 0 && hoehe > 0 ? breite / hoehe : 1.78;
  return Math.min(anzahl, Math.max(1, Math.ceil(Math.sqrt((anzahl * verhaeltnis) / 1.6))));
}

/** Darstellung des Einheitsführers in V2 (Beispiel Patrick Muster). */
export type FuehrerDarstellung = "voll" | "initialeNachname" | "vornameInitiale" | "nachname" | "aus";
export type KontaktDarstellung = "telefon" | "aus";
export interface AnzeigeWahl {
  fuehrer: FuehrerDarstellung;
  kontakt: KontaktDarstellung;
}

export const ANZEIGE_SCHLUESSEL = "eeb.lageanzeige.v1";
export const FUEHRER_OPTIONEN: readonly { wert: FuehrerDarstellung; text: string }[] = [
  { wert: "voll", text: "Patrick Muster" },
  { wert: "initialeNachname", text: "P. Muster" },
  { wert: "vornameInitiale", text: "Patrick M." },
  { wert: "nachname", text: "Muster" },
  { wert: "aus", text: "ausgeblendet" },
];
export const KONTAKT_OPTIONEN: readonly { wert: KontaktDarstellung; text: string }[] = [
  { wert: "telefon", text: "Telefonnummer" },
  { wert: "aus", text: "ausgeblendet" },
];
export const ANZEIGE_VORGABE: AnzeigeWahl = { fuehrer: "initialeNachname", kontakt: "telefon" };

export function anzeigeLesen(): AnzeigeWahl {
  try {
    const roh = JSON.parse(globalThis.localStorage?.getItem(ANZEIGE_SCHLUESSEL) ?? "null") as Partial<AnzeigeWahl> | null;
    const f = FUEHRER_OPTIONEN.find((o) => o.wert === roh?.fuehrer)?.wert;
    const k = KONTAKT_OPTIONEN.find((o) => o.wert === roh?.kontakt)?.wert;
    return { fuehrer: f ?? ANZEIGE_VORGABE.fuehrer, kontakt: k ?? ANZEIGE_VORGABE.kontakt };
  } catch {
    return ANZEIGE_VORGABE;
  }
}

export function anzeigeMerken(wahl: AnzeigeWahl): void {
  try { globalThis.localStorage?.setItem(ANZEIGE_SCHLUESSEL, JSON.stringify(wahl)); } catch { /* nicht gemerkt, der Monitor läuft trotzdem */ }
}

/** Name des Einheitsführers in der gewählten Darstellung; leer bei „ausgeblendet". */
export function fuehrerName(l: { vorname: string; nachname: string }, wie: FuehrerDarstellung): string {
  const v = l.vorname.trim();
  const n = l.nachname.trim();
  const initial = (s: string) => (s ? `${[...s][0]!.toUpperCase()}.` : "");
  switch (wie) {
    case "aus": return "";
    case "voll": return [v, n].filter(Boolean).join(" ");
    case "initialeNachname": return [initial(v), n].filter(Boolean).join(" ");
    case "vornameInitiale": return [v, initial(n)].filter(Boolean).join(" ");
    case "nachname": return n || v;
  }
}
