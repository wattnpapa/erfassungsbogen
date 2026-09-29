/**
 * Häufigste Funktionen für das leere Funktionsfeld (Audit Runde 2, R2-G5):
 * eine Funktion muss sich ohne Tastatur zuweisen lassen.
 */

import { describe, expect, it } from "vitest";
import { OrganisationsTyp, StaerkeRolle } from "@bos/eeb-format/model";
import { stanPersonalVorbelegung } from "@bos/vokabulare/thw-stan-personal";
import { funktionVergeben, haeufigeFunktionen } from "./haeufige-funktionen";
import { neuePerson } from "./hilfen";

describe("haeufigeFunktionen", () => {
  it("THW-Bergungsgruppe: Helfer zuerst, dann die Führungsfunktionen der StAN, dann Sprechfunk & Co.", () => {
    const stan = stanPersonalVorbelegung(OrganisationsTyp.THW, { code: 4 }); // B: GrFü, TrFü, 7 He
    expect(haeufigeFunktionen(OrganisationsTyp.THW, stan, [])).toEqual([
      { code: 5 }, // He (7 Mannschaftsplätze)
      { code: 3 }, // GrFü
      { code: 4 }, // TrFü
      { code: 30 }, // Spr
      { code: 31 }, // SanHe
      { code: 32 }, // AGT
    ]);
  });

  it("zählt im Bogen vergebene Funktionen mit — auch Freitexte, ohne Doppel nach Schreibweise", () => {
    const personal = [
      { ...neuePerson(), funktionen: [{ freitext: "Maschinist" }] },
      { ...neuePerson(), funktionen: [{ freitext: " maschinist " }, { freitext: "Atemschutz" }] },
    ];
    expect(haeufigeFunktionen(OrganisationsTyp.FEUERWEHR, [], personal)).toEqual([
      { freitext: "Maschinist" },
      { freitext: "Atemschutz" },
    ]);
  });

  it("ohne StAN und ohne Einträge: beim THW die allgemeinen Zusatzfunktionen, sonst nichts", () => {
    expect(haeufigeFunktionen(OrganisationsTyp.THW, [], [])).toEqual([{ code: 30 }, { code: 31 }, { code: 32 }]);
    expect(haeufigeFunktionen(OrganisationsTyp.DLRG, [], [])).toEqual([]);
  });

  it("hält die Liste auf höchstens acht Einträge", () => {
    const personal = Array.from({ length: 12 }, (_, i) => ({
      ...neuePerson(),
      staerkeRolle: StaerkeRolle.MANNSCHAFT,
      funktionen: [{ freitext: `F${i}` }],
    }));
    expect(haeufigeFunktionen(OrganisationsTyp.THW, [], personal)).toHaveLength(8);
  });

  it("funktionVergeben erkennt Code und Freitext", () => {
    expect(funktionVergeben([{ code: 3 }], { code: 3 })).toBe(true);
    expect(funktionVergeben([{ freitext: "Kf" }], { freitext: "kf" })).toBe(true);
    expect(funktionVergeben([{ code: 3 }], { code: 4 })).toBe(false);
  });
});
