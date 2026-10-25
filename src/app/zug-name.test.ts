import { describe, expect, it } from "vitest";
import { vorhandeneZuege, zugNormalisiert, zugSchluessel } from "./zug-name";

describe("Zug-Schreibweise (R7-K4)", () => {
  it("gleicht „1.Zug“ und „1. zug“ mit dem vorhandenen „1. Zug“ ab", () => {
    const vorhanden = ["1. Zug", undefined, "2. Zug"];
    expect(zugNormalisiert("1.Zug", vorhanden)).toBe("1. Zug");
    expect(zugNormalisiert("1. zug", vorhanden)).toBe("1. Zug");
    expect(zugNormalisiert("  1 ZUG ", vorhanden)).toBe("1. Zug");
    expect(zugNormalisiert("2.Zug", vorhanden)).toBe("2. Zug");
  });

  it("glättet einen neuen Zug nur und lässt Leeres leer", () => {
    expect(zugNormalisiert("3.Zug", ["1. Zug"])).toBe("3. Zug");
    expect(zugNormalisiert("  Bergung   Nord ", [])).toBe("Bergung Nord");
    expect(zugNormalisiert("   ", ["1. Zug"])).toBe("");
  });

  it("nimmt bei mehreren Schreibweisen die häufigste", () => {
    expect(zugNormalisiert("1 zug", ["1.Zug", "1. Zug", "1. Zug"])).toBe("1. Zug");
  });

  it("bietet jede Schreibweise einmal und sortiert nach Zahl", () => {
    expect(vorhandeneZuege(["10. Zug", "2. Zug", "2.Zug", undefined, "1. Zug"])).toEqual(["1. Zug", "2. Zug", "10. Zug"]);
    expect(zugSchluessel("1. Zug")).toBe(zugSchluessel("1.zug"));
  });

  it("führt „Zug 2“, „Zug2“, „zug 2“ und „2.Zug“ als „2. Zug“ (R8-N5)", () => {
    for (const e of ["Zug 2", "Zug2", "zug 2", "2.Zug", "2. zug", " 2 ZUG ", "Zug 2."]) {
      expect(zugNormalisiert(e, ["2. zug"])).toBe("2. Zug");
      expect(zugSchluessel(e)).toBe(zugSchluessel("2. Zug"));
    }
    expect(zugNormalisiert("Zug 12", [])).toBe("12. Zug");
    expect(zugNormalisiert("Zugtrupp 2", [])).toBe("Zugtrupp 2");
    expect(vorhandeneZuege(["Zug 2", "2. Zug"])).toHaveLength(1);
  });
});
