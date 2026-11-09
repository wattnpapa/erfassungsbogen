import { describe, expect, it } from "vitest";
import { zugNormalisiert } from "./zug-name";

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
});
