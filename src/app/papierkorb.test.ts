import { describe, it, expect } from "vitest";
import { PAPIERKORB_FRIST_MS, aktive, imPapierkorb, papierkorbBereinigt } from "./papierkorb";

interface Eintrag {
  id: string;
  geloeschtAm?: number;
}

const JETZT = 1_800_000_000_000;

function liste(): Eintrag[] {
  return [
    { id: "aktiv" },
    { id: "frisch", geloeschtAm: JETZT - 1000 },
    { id: "aelter", geloeschtAm: JETZT - PAPIERKORB_FRIST_MS + 60_000 },
    { id: "abgelaufen", geloeschtAm: JETZT - PAPIERKORB_FRIST_MS },
  ];
}

describe("aktive()", () => {
  it("liefert nur Einträge ohne Löschmarke", () => {
    expect(aktive(liste()).map((e) => e.id)).toEqual(["aktiv"]);
  });
});

describe("imPapierkorb()", () => {
  it("liefert gelöschte Einträge, zuletzt gelöschte zuerst", () => {
    expect(imPapierkorb(liste()).map((e) => e.id)).toEqual(["frisch", "aelter", "abgelaufen"]);
  });
});

describe("papierkorbBereinigt()", () => {
  it("entfernt nur abgelaufene Papierkorb-Einträge (Frist exakt erreicht = weg)", () => {
    const r = papierkorbBereinigt(liste(), JETZT);
    expect(r.liste.map((e) => e.id)).toEqual(["aktiv", "frisch", "aelter"]);
    expect(r.entfernt).toBe(1);
  });

  it("lässt eine Liste ohne abgelaufene Einträge unverändert", () => {
    const r = papierkorbBereinigt([{ id: "a" }, { id: "b", geloeschtAm: JETZT }], JETZT);
    expect(r.entfernt).toBe(0);
    expect(r.liste).toHaveLength(2);
  });
});
