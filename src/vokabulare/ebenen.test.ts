import { describe, it, expect } from "vitest";
import { OrganisationsTyp } from "../model";
import { HIERARCHIE_EBENEN, hierarchieEbenenFuer } from "./ebenen";

// Dieselben Datenpflege-Garantien wie für die THW-Vokabulare (thw.test.ts) —
// plus die Ordnungs-Zusage dieser Tabellen: aufsteigende Codes = aufsteigende
// Hierarchie. Darauf verlässt sich die Vorbelegung von „+ übergeordnete Ebene".
describe.each(Object.entries(HIERARCHIE_EBENEN))("Hierarchie-Ebenen für Organisation %s", (_org, tabelle) => {
  it("ist nicht leer und beginnt mit Code 1 (unterste Ebene = eigene Einheit)", () => {
    expect(tabelle.length).toBeGreaterThan(0);
    expect(tabelle[0]!.code).toBe(1);
  });

  it("verwendet ausschließlich Codes > 0 (0 ist im Codec für Freitext reserviert)", () => {
    for (const e of tabelle) {
      expect(Number.isInteger(e.code)).toBe(true);
      expect(e.code).toBeGreaterThan(0);
    }
  });

  it("ist streng aufsteigend sortiert (Code-Reihenfolge = Hierarchie-Reihenfolge)", () => {
    for (let i = 1; i < tabelle.length; i++) {
      expect(tabelle[i]!.code).toBeGreaterThan(tabelle[i - 1]!.code);
    }
  });

  it("hat nicht-leere Kurz- und Langbezeichnungen", () => {
    for (const e of tabelle) {
      expect(e.kurz.trim().length).toBeGreaterThan(0);
      expect(e.name.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("hierarchieEbenenFuer()", () => {
  it("liefert für Organisationen ohne kanonische Leiter eine leere Tabelle", () => {
    expect(hierarchieEbenenFuer(OrganisationsTyp.POLIZEI)).toEqual([]);
    expect(hierarchieEbenenFuer(OrganisationsTyp.SONSTIGE)).toEqual([]);
  });

  it("liefert die Feuerwehr-Leiter von der Gemeinde aufwärts", () => {
    const namen = hierarchieEbenenFuer(OrganisationsTyp.FEUERWEHR).map((e) => e.name);
    expect(namen[0]).toBe("Gemeinde/Stadt");
    expect(namen).toContain("Landkreis/kreisfreie Stadt");
  });
});
