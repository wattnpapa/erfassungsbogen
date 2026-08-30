import { describe, it, expect } from "vitest";
import { DLRG_QUALIFIKATIONEN } from "./dlrg-qualifikationen";

/**
 * Die Liste ist Handredaktion aus der DLRG-Legende — es gibt keinen Generator,
 * der Dubletten oder Tippfehler abfinge. Anders als bei den Code-Vokabularen
 * verfälscht ein Fehler hier keine gespeicherten Bögen (alles ist Freitext),
 * aber ein doppelter oder verstümmelter Eintrag steht dem Nutzer in der
 * Vorschlagsliste im Weg.
 */
describe("DLRG-Ausbildungskennzahlen", () => {
  it("führt alle 56 Kennzahlen der Legende", () => {
    expect(DLRG_QUALIFIKATIONEN.length).toBe(56);
  });

  it("hat keine doppelten Einträge", () => {
    const texte = DLRG_QUALIFIKATIONEN.map((q) => q.text);
    expect(new Set(texte).size).toBe(texte.length);
  });

  it("beginnt jeden Eintrag mit der Kennzahl und trägt eine Bezeichnung dahinter", () => {
    for (const q of DLRG_QUALIFIKATIONEN) {
      // DSTA ist die einzige Ausbildung der Legende ohne Kennzahl.
      expect(q.text).toMatch(/^(\d{3,4}|DSTA) \S/);
      expect(q.zusatz.trim()).not.toBe("");
    }
  });

  it("hat keine doppelten Kennzahlen", () => {
    const kennzahlen = DLRG_QUALIFIKATIONEN.map((q) => q.text.split(" ")[0]);
    expect(new Set(kennzahlen).size).toBe(kennzahlen.length);
  });

  it("deckt alle sechs Fachbereiche der Legende ab", () => {
    expect(new Set(DLRG_QUALIFIKATIONEN.map((q) => q.zusatz))).toEqual(
      new Set(["Wasserrettungsdienst", "Boot", "Tauchen", "IuK", "KatS / ÖGA", "Strömungsrettung"]),
    );
  });

  it("steht nach Kennzahlbereich sortiert (DSTA vor den 6xx im Tauchblock)", () => {
    const zahlen = DLRG_QUALIFIKATIONEN.map((q) => Number(q.text.split(" ")[0])).filter((n) => !Number.isNaN(n));
    expect(zahlen).toEqual([...zahlen].sort((a, b) => a - b));
  });
});
