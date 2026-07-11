/**
 * StAN-Personal-Vorbelegung (Sollplätze) je THW-Einheitstyp.
 * Quelle: Kapitel "Funktions- und Helfer/innenübersicht" der
 * StAN-Einzeldokumente, Stand 01.07.2026 (maschinell extrahiert).
 *
 * Schlüssel = Einheitstyp-Code aus THW_EINHEITSTYPEN (src/vokabulare/thw.ts);
 * Funktions-Codes aus THW_FUNKTIONEN. Die Vorbelegung ist ein editierbarer
 * Startpunkt — Nutzer können Personen ändern, löschen und ergänzen.
 *
 * Redaktionsentscheidungen (Johannes, 2026-07-11): Es zählt nur die ANZAHL
 * der Personen je Sollplatz plus die Führungsfunktion.
 *  - Führungs-/Unterführungsplätze (ZFü, ZTrFü, GrFü, TrFü, SGL, VOST-Leiter,
 *    PSF) bekommen ihre Grundfunktion vorbelegt.
 *  - Fachhelfer-Plätze werden nur als leere Personen-Karten (Mannschaft)
 *    angelegt — ohne Funktions-Vorbelegung.
 *  - Zusatzfunktionen und Kf-Klassen werden nicht vorbelegt.
 *  - "Fachhelfer/in (Reserve)" wird nicht vorbelegt: die Reserve zählt nicht
 *    zur Einsatzstärke (StAN notiert sie als "+n") und rückt nicht mit aus.
 *  - SEEBA, SEEWA, SEElift, Sys BR500: keine Vorbelegung.
 */

import type { Person, VokabularWert } from "../model";
import { Fahrerlaubnis, Geschlecht, OrganisationsTyp, StaerkeRolle } from "../model";

export interface StanSollplatz {
  /** Grundfunktion als Code in THW_FUNKTIONEN; fehlt bei Mannschaftsplätzen. */
  funktion?: number;
  staerkeRolle: StaerkeRolle;
  anzahl: number;
}

// Funktions-Codes (siehe THW_FUNKTIONEN): 1 ZFü, 2 ZTrFü, 3 GrFü, 4 TrFü,
// 7 SGL, 8 Ltr VOST, 9 stv. Ltr VOST, 10 GrLtr VOST, 11 TrLtr VOST, 12 PSF.

const fu = (funktion: number, staerkeRolle: StaerkeRolle, anzahl = 1): StanSollplatz =>
  ({ funktion, staerkeRolle, anzahl });
const zfue = (): StanSollplatz => fu(1, StaerkeRolle.FUEHRER);
const ztrfue = (): StanSollplatz => fu(2, StaerkeRolle.UNTERFUEHRER);
const grfue = (): StanSollplatz => fu(3, StaerkeRolle.UNTERFUEHRER);
const trfue = (anzahl = 1): StanSollplatz => fu(4, StaerkeRolle.UNTERFUEHRER, anzahl);
const he = (anzahl: number): StanSollplatz => ({ staerkeRolle: StaerkeRolle.MANNSCHAFT, anzahl });

export const THW_STAN_PERSONAL: Record<number, StanSollplatz[]> = {
  1: [grfue(), trfue(), he(7)], // MT — Stärke -/2/7/9
  2: [fu(8, StaerkeRolle.FUEHRER), fu(9, StaerkeRolle.UNTERFUEHRER), fu(10, StaerkeRolle.UNTERFUEHRER, 4), fu(11, StaerkeRolle.UNTERFUEHRER, 8), he(32)], // VOST — 1/13/32/46
  3: [zfue(), ztrfue(), he(2)], // ZTr TZ — 1/1/2/4
  4: [grfue(), trfue(), he(7)], // B — -/2/7/9
  5: [grfue(), trfue(), he(10)], // B (ASH) — -/2/10/12
  6: [grfue(), trfue(), he(7)], // R (A) — -/2/7/9
  7: [grfue(), trfue(), he(7)], // R (B) — -/2/7/9
  8: [grfue(), trfue(), he(7)], // R (C) — -/2/7/9
  9: [grfue(), trfue(2), he(9)], // W (A) — -/3/9/12
  10: [grfue(), trfue(2), he(9)], // W (B) — -/3/9/12
  11: [grfue(), trfue(3), he(14)], // BrB — -/4/14/18
  12: [grfue(), trfue(), he(7)], // O (A) — -/2/7/9
  13: [grfue(), trfue(), he(7)], // O (B) — -/2/7/9
  14: [grfue(), trfue(), he(4)], // O (C) — -/2/4/6
  15: [grfue(), trfue(), he(4)], // Sp — -/2/4/6
  16: [grfue(), trfue(), he(7)], // N — -/2/7/9
  18: [grfue(), trfue(2), he(9)], // SB (A) — -/3/9/12
  19: [grfue(), trfue(2), he(9)], // SB (B) — -/3/9/12
  20: [trfue(), he(3)], // Tr ESS — -/1/3/4
  21: [trfue(), he(3)], // Tr MHP — -/1/3/4
  22: [trfue(), he(3)], // Tr UL — -/1/3/4
  23: [grfue(), trfue(), he(7)], // BT — -/2/7/9
  24: [grfue(), trfue(2), he(9)], // I — -/3/9/12
  25: [grfue(), trfue(), he(7)], // E — -/2/7/9
  26: [grfue(), trfue(2), he(15)], // TW — -/3/15/18
  27: [grfue(), trfue(2), he(9)], // WP (A) — -/3/9/12
  28: [grfue(), trfue(2), he(9)], // WP (B) — -/3/9/12
  29: [grfue(), trfue(2), he(9)], // WP (C) — -/3/9/12
  30: [grfue(), trfue(3), he(14)], // Öl (A) — -/4/14/18
  31: [grfue(), trfue(3), he(14)], // Öl (B) — -/4/14/18
  32: [grfue(), trfue(3), he(14)], // Öl (C) — -/4/14/18
  34: [fu(12, StaerkeRolle.UNTERFUEHRER, 3), he(11)], // ENT — -/3/11/14 (3 PSF, 11 Peers)
  36: [zfue(), ztrfue(), he(2)], // ZTr FZ Log — 1/1/2/4
  37: [grfue(), trfue(3), he(12)], // Log-MW — -/4/12/16
  38: [grfue(), trfue(2), he(9)], // Log-V — -/3/9/12
  39: [trfue(), he(3)], // Tr Log-TS — -/1/3/4
  41: [zfue(), ztrfue(), he(2)], // ZTr FZ FK — 1/1/2/4
  42: [grfue(), trfue(2), he(4)], // F — -/3/4/7
  43: [grfue(), trfue(2), he(6)], // K (A) — -/3/6/9
  44: [grfue(), trfue(3), he(9)], // K (B) — -/4/9/13
  45: [fu(7, StaerkeRolle.FUEHRER, 6)], // Stab — 6/-/-/6 (SGL S1–S6)
};

/**
 * Vorbelegung für den Personal-Schritt: expandiert die StAN-Sollplätze in
 * einzelne Person-Einträge (Namen/Kontakte offen; Stärkerolle gesetzt,
 * Führungsfunktion vorbelegt). Leeres Array, wenn es keine Vorgabe gibt.
 */
export function stanPersonalVorbelegung(
  org: OrganisationsTyp,
  einheitsTyp: VokabularWert,
): Person[] {
  if (org !== OrganisationsTyp.THW || einheitsTyp.code == null) return [];
  const vorgaben = THW_STAN_PERSONAL[einheitsTyp.code] ?? [];
  return vorgaben.flatMap((v) =>
    Array.from({ length: v.anzahl }, (): Person => ({
      vorname: "",
      nachname: "",
      staerkeRolle: v.staerkeRolle,
      funktionen: v.funktion != null ? [{ code: v.funktion }] : [],
      fahrerlaubnis: Fahrerlaubnis.NONE,
      geschlecht: Geschlecht.M,
      kontakte: [],
      zusatzqualifikationen: [],
    })),
  );
}
