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
 * Funkrufname: Fahrzeuge, die Funkstelle sind, tragen ihre Fahrzeug-Kennzahl
 * (2. Zahl des Funkrufnamens, s. thw-funkrufnamen.ts). Zusammen mit der aus
 * dem Einheitstyp abgeleiteten Teileinheit-Kennzahl (1. Zahl) entsteht z. B.
 * "Heros <OV> 22/51" (Bergungsgruppe / GKW). Anhänger und Nicht-Funkstellen
 * (z. B. Gabelstapler) bekommen KEINE Kennzahl → kein Funkrufname.
 *
 * Bewusste Lücken/Entscheidungen:
 *  - FGr SB (A) (Code 18): Ausstattung nicht maschinell extrahierbar → keine Vorbelegung.
 *  - ZTr FZ Log (Code 36): StAN listet zusätzlich "3x FüKW FGr-spezifisch";
 *    vorbelegt wird nur der eigene FüKW. TODO(frage) bei Gelegenheit klären.
 *  - Alt-Format-StAN (SEEBA, SEEWA, SEElift, BR500, MT, VOST, Stab): keine Vorbelegung.
 */

import type { Fahrzeug, Funkrufname, VokabularWert } from "../model";
import { OrganisationsTyp } from "../model";
import { teileinheitKennzahl } from "./thw-funkrufnamen";

export interface StanFahrzeug {
  typ: VokabularWert;
  anzahl: number;
  /**
   * Fahrzeug-Kennzahl(en) für den Funkrufnamen (2. Zahl), eine je Fahrzeug in
   * Reihenfolge. Länge = `anzahl`. Fehlt bei Anhängern/Nicht-Funkstellen.
   */
  kennzahlen?: number[];
}

/** Anhänger oder Nicht-Funkstelle per Code (keine Funkruf-Kennzahl). */
const f = (code: number, anzahl = 1): StanFahrzeug => ({ typ: { code }, anzahl });
/** Funkstelle(n) per Code mit Fahrzeug-Kennzahl(en) (anzahl = Anzahl der Kennzahlen). */
const fk = (code: number, ...kennzahlen: number[]): StanFahrzeug =>
  ({ typ: { code }, anzahl: kennzahlen.length, kennzahlen });
/** Freitext-Fahrzeug/Anhänger (keine Kennzahl). */
const ft = (freitext: string, anzahl = 1): StanFahrzeug => ({ typ: { freitext }, anzahl });

/** Fahrzeugtyp-Codes: siehe THW_FAHRZEUGTYPEN in thw.ts; Kennzahlen: thw-funkrufnamen.ts. */
export const THW_STAN_FAHRZEUGE: Record<number, StanFahrzeug[]> = {
  3: [fk(2, 10)], // ZTr TZ: FüKW (ZTr-Fahrzeug → 10)
  4: [fk(4, 51), f(43)], // B: GKW, Anh Plane/Spriegel
  5: [fk(4, 51), f(43), f(55)], // B (ASH): + Anh ASH
  6: [fk(7, 42), fk(16, 71), f(45), f(46)], // R (A): LKW Kipper, Bagger, Anh Tieflader, Anh DLE
  7: [fk(7, 42), fk(17, 72), f(45), f(46)], // R (B): Radlader statt Bagger
  8: [fk(7, 42), fk(18, 73), f(45), f(46)], // R (C): Teleskoplader
  9: [fk(10, 46), fk(22, 81, 82)], // W (A): LKW LK gl (mittel), 2x MzAB
  10: [fk(10, 46), f(44)], // W (B): LKW LK gl, Anh Plattform
  11: [fk(20, 47), f(44)], // BrB: Mobilkran, Anh Plattform
  12: [fk(23, 25), ft("Anh FGr O")], // O (A): MTW TZ, Anhänger FGr O
  13: [fk(23, 25), ft("Anh FGr O")], // O (B)
  14: [fk(23, 25)], // O (C): MTW TZ
  15: [fk(5, 25), ft("Anh FGr Sp")], // Sp: MTW FGr, Anhänger FGr Sp
  16: [f(21), f(44), f(47)], // N: Gabelstapler (keine Funkstelle), Anh Plattform, Anh NEA mittel
  19: [fk(19, 74), f(44)], // SB (B): Schreitbagger, Anh Plattform
  20: [fk(23, 25)], // Tr ESS: MTW TZ
  21: [fk(24, 25)], // Tr MHP: MTW gl
  22: [fk(23, 25)], // Tr UL: MTW TZ
  23: [f(6), ft("Anhänger")], // BT: MLW IV, Anhänger (nicht in Taschenkarte → keine Kennzahl/Funkrufname)
  24: [fk(6, 34), fk(5, 25), ft("Anh FGr I")], // I: MLW IV, MTW FGr, Anhänger FGr I
  25: [fk(8, 43), f(48), f(49)], // E: LKW Lbw, Anh NEA groß, Anh NEA sehr groß
  26: [fk(8, 43, 49), f(53), f(54)], // TW: 2x LKW Lbw (2. → 49), Anh TWAA, Anh BDF
  27: [fk(8, 43), fk(6, 34), f(50), f(43)], // WP (A): LKW Lbw, MLW IV, Anh SwPu klein, Anh Plane/Spriegel
  28: [fk(8, 43), fk(6, 34), f(51), f(43)], // WP (B): Anh SwPu mittel
  29: [fk(8, 43), fk(6, 34), f(52), f(43)], // WP (C): Anh SwPu groß
  30: [fk(11, 65), fk(9, 44), f(44)], // Öl (A): LKW WLF, LKW LK (mittel), Anh Plattform
  31: [fk(11, 65), fk(9, 44), f(44)], // Öl (B): LKW LK (leicht)
  32: [fk(11, 65, 67), f(44)], // Öl (C): 2x LKW WLF, Anh Plattform
  36: [fk(2, 10)], // ZTr FZ Log: FüKW (ZTr-Fahrzeug → 10; s. Kopf-Kommentar)
  37: [fk(9, 44), fk(10, 46), fk(12, 65), fk(6, 34), fk(15, 21), f(21), f(44), ft("Anh FGr Log-MW"), ft("Anhänger")], // Log-MW
  38: [fk(8, 43), fk(5, 25), ft("Anhänger")], // Log-V: LKW Lbw, MTW FGr, Anhänger
  39: [fk(13, 68), f(14)], // Tr Log-TS: SZM, Auflieger (Anhänger)
  41: [fk(2, 11)], // ZTr FZ FK: FüKW (nur FZ FK → 11)
  42: [fk(3, 12), f(42)], // F: FüKomKW, Anh FüLa
  43: [fk(1, 13), fk(5, 25), f(40), f(41)], // K (A): FmKW, MTW FGr, Anh 2t, Anh K
  44: [fk(1, 13), fk(5, 25, 26), f(40), f(41), ft("Fahrzeuge/Anhänger Richtfunk")], // K (B): 2x MTW FGr
};

/**
 * Vorbelegung für den Fahrzeuge-Schritt: expandiert die StAN-Vorgaben in
 * einzelne Fahrzeug-Einträge (stanKonform = true, Kennzeichen offen). Fahrzeuge
 * mit Fahrzeug-Kennzahl bekommen zusätzlich einen Funkrufnamen (Heros, eigener
 * Standort, teile [Teileinheit, Fahrzeug]) — sofern der Einheitstyp eine
 * Teileinheit-Kennzahl hat. Leeres Array, wenn es keine Vorgabe gibt.
 */
export function stanFahrzeugVorbelegung(
  org: OrganisationsTyp,
  einheitsTyp: VokabularWert,
): Fahrzeug[] {
  if (org !== OrganisationsTyp.THW || einheitsTyp.code == null) return [];
  const vorgaben = THW_STAN_FAHRZEUGE[einheitsTyp.code] ?? [];
  const teil = teileinheitKennzahl(einheitsTyp.code);
  return vorgaben.flatMap((v) =>
    Array.from({ length: v.anzahl }, (_, i): Fahrzeug => {
      const fahrzeug: Fahrzeug = { typ: { ...v.typ }, stanKonform: true };
      const kennzahl = v.kennzahlen?.[i];
      if (teil != null && kennzahl != null) {
        const funkrufname: Funkrufname = {
          kennwort: { code: 1 }, // Heros (FUNKRUF_KENNWOERTER)
          eigenerStandort: true,
          teile: [teil, kennzahl],
        };
        fahrzeug.funkrufname = funkrufname;
      }
      return fahrzeug;
    }),
  );
}
