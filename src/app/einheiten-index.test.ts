/**
 * Revisionen/Köpfe je Einheit über den Index: dasselbe Ergebnis wie der Kern,
 * nur ohne Durchlauf über alle Meldungen je Karte (Audit Runde 3, R3-O2).
 */

import { describe, it, expect } from "vitest";
import { neuesteJeEinheit, revisionen, type MeldeEintrag } from "@bos/meldekopf/einsaetze";
import { koepfeJe, revisionenJe } from "./einheiten-index";

function eintrag(id: string, schl: string, stand: number, empfangenAm: number): MeldeEintrag {
  return { id, einheitSchluessel: schl, empfangenAm, bogen: { stand } } as unknown as MeldeEintrag;
}

describe("einheiten-index", () => {
  const alle = [
    eintrag("a1", "a", 10, 1),
    eintrag("b1", "b", 5, 2),
    eintrag("a2", "a", 12, 3),
    eintrag("a3", "a", 12, 4),
    eintrag("c1", "c", 1, 5),
    eintrag("b2", "b", 4, 6),
  ];

  it("liefert dieselben Revisionen wie der Kern", () => {
    for (const s of ["a", "b", "c", "x"]) {
      expect(revisionenJe(alle, s).map((e) => e.id)).toEqual(revisionen(alle, s).map((e) => e.id));
    }
  });

  it("liefert dieselben Köpfe wie der Kern, jedes Mal als neues Array", () => {
    const k1 = koepfeJe(alle);
    expect(k1.map((e) => e.id)).toEqual(neuesteJeEinheit(alle).map((e) => e.id));
    const k2 = koepfeJe(alle);
    expect(k2).not.toBe(k1);
    expect(k2).toEqual(k1);
  });

  it("rechnet für ein neues Array neu", () => {
    const mehr = [...alle, eintrag("c2", "c", 9, 7)];
    expect(revisionenJe(mehr, "c").map((e) => e.id)).toEqual(["c2", "c1"]);
    expect(revisionenJe(alle, "c").map((e) => e.id)).toEqual(["c1"]);
  });
});
