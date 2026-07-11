/**
 * StAN-Fahrzeug-Vorbelegung je THW-Einheitstyp.
 * Quelle: Ausstattungs-Kapitel der StAN-Einzeldokumente, Stand 01.07.2026
 * (maschinell extrahiert; Nicht-Fahrzeuge wie Rollcontainer/Ausstattungssätze
 * bewusst weggelassen).
 *
 * Schlüssel = Einheitstyp-Code aus THW_EINHEITSTYPEN (src/vokabulare/thw.ts).
 * Die Vorbelegung ist ein editierbarer Startpunkt — Nutzer können Fahrzeuge
 * ändern, löschen und ergänzen.
 *
 * Bewusste Lücken/Entscheidungen:
 *  - FGr SB (A) (Code 18): Ausstattung nicht maschinell extrahierbar → keine Vorbelegung.
 *  - ZTr FZ Log (Code 36): StAN listet zusätzlich "3x FüKW FGr-spezifisch";
 *    vorbelegt wird nur der eigene FüKW. TODO(frage) bei Gelegenheit klären.
 *  - Alt-Format-StAN (SEEBA, SEEWA, SEElift, BR500, MT, VOST, Stab): keine Vorbelegung.
 */

import type { Fahrzeug, VokabularWert } from "../model";
import { OrganisationsTyp } from "../model";

export interface StanFahrzeug {
  typ: VokabularWert;
  anzahl: number;
}

const f = (code: number, anzahl = 1): StanFahrzeug => ({ typ: { code }, anzahl });
const ft = (freitext: string, anzahl = 1): StanFahrzeug => ({ typ: { freitext }, anzahl });

/** Fahrzeugtyp-Codes: siehe THW_FAHRZEUGTYPEN in thw.ts. */
export const THW_STAN_FAHRZEUGE: Record<number, StanFahrzeug[]> = {
  3: [f(2)], // ZTr TZ: FüKW
  4: [f(4), f(43)], // B: GKW, Anh Plane/Spriegel
  5: [f(4), f(43), f(55)], // B (ASH): + Anh ASH
  6: [f(7), f(16), f(45), f(46)], // R (A): LKW Kipper, Bagger, Anh Tieflader, Anh DLE
  7: [f(7), f(17), f(45), f(46)], // R (B): Radlader statt Bagger
  8: [f(7), f(18), f(45), f(46)], // R (C): Teleskoplader
  9: [f(10), f(22, 2)], // W (A): LKW LK gl (mittel), 2x MzAB
  10: [f(10), f(44)], // W (B): LKW LK gl, Anh Plattform
  11: [f(20), f(44)], // BrB: Mobilkran, Anh Plattform
  12: [f(23), ft("Anh FGr O")], // O (A): MTW TZ, Anhänger FGr O
  13: [f(23), ft("Anh FGr O")], // O (B)
  14: [f(23)], // O (C): MTW TZ
  15: [f(5), ft("Anh FGr Sp")], // Sp: MTW FGr, Anhänger FGr Sp
  16: [f(21), f(44), f(47)], // N: Gabelstapler, Anh Plattform, Anh NEA mittel
  19: [f(19), f(44)], // SB (B): Schreitbagger, Anh Plattform
  20: [f(23)], // Tr ESS: MTW TZ
  21: [f(24)], // Tr MHP: MTW gl
  22: [f(23)], // Tr UL: MTW TZ
  23: [f(6), ft("Anhänger")], // BT: MLW IV, Anhänger
  24: [f(6), f(5), ft("Anh FGr I")], // I: MLW IV, MTW FGr, Anhänger FGr I
  25: [f(8), f(48), f(49)], // E: LKW Lbw, Anh NEA groß, Anh NEA sehr groß
  26: [f(8, 2), f(53), f(54)], // TW: 2x LKW Lbw, Anh TWAA, Anh BDF
  27: [f(8), f(6), f(50), f(43)], // WP (A): LKW Lbw, MLW IV, Anh SwPu klein, Anh Plane/Spriegel
  28: [f(8), f(6), f(51), f(43)], // WP (B): Anh SwPu mittel
  29: [f(8), f(6), f(52), f(43)], // WP (C): Anh SwPu groß
  30: [f(11), f(9), f(44)], // Öl (A): LKW WLF, LKW LK (mittel), Anh Plattform
  31: [f(11), f(9), f(44)], // Öl (B): LKW LK (leicht)
  32: [f(11, 2), f(44)], // Öl (C): 2x LKW WLF, Anh Plattform
  36: [f(2)], // ZTr FZ Log: FüKW (s. Kopf-Kommentar)
  37: [f(9), f(10), f(12), f(6), f(15), f(21), f(44), ft("Anh FGr Log-MW"), ft("Anhänger")], // Log-MW
  38: [f(8), f(5), ft("Anhänger")], // Log-V: LKW Lbw, MTW FGr, Anhänger
  39: [f(13), f(14)], // Tr Log-TS: SZM, Auflieger
  41: [f(2)], // ZTr FZ FK: FüKW
  42: [f(3), f(42)], // F: FüKomKW, Anh FüLa
  43: [f(1), f(5), f(40), f(41)], // K (A): FmKW, MTW FGr, Anh 2t, Anh K
  44: [f(1), f(5, 2), f(40), f(41), ft("Fahrzeuge/Anhänger Richtfunk")], // K (B)
};

/**
 * Vorbelegung für den Fahrzeuge-Schritt: expandiert die StAN-Vorgaben in
 * einzelne Fahrzeug-Einträge (stanKonform = true, Kennzeichen/Funkrufname offen).
 * Leeres Array, wenn es für die Auswahl keine Vorgabe gibt.
 */
export function stanFahrzeugVorbelegung(
  org: OrganisationsTyp,
  einheitsTyp: VokabularWert,
): Fahrzeug[] {
  if (org !== OrganisationsTyp.THW || einheitsTyp.code == null) return [];
  const vorgaben = THW_STAN_FAHRZEUGE[einheitsTyp.code] ?? [];
  return vorgaben.flatMap((v) =>
    Array.from({ length: v.anzahl }, (): Fahrzeug => ({ typ: { ...v.typ }, stanKonform: true })),
  );
}
