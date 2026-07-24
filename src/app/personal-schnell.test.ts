import { describe, expect, it } from "vitest";
import { parseNamen } from "./personal-schnell";

describe("parseNamen", () => {
  it("liest „Nachname, Vorname“ je Zeile", () => {
    expect(parseNamen("Muster, Max\nMusterfrau, Erika")).toEqual([
      { nachname: "Muster", vorname: "Max" },
      { nachname: "Musterfrau", vorname: "Erika" },
    ]);
  });

  it("liest „Vorname Nachname“ — letztes Wort ist der Nachname", () => {
    expect(parseNamen("Max Muster\nAnna Maria Beispiel")).toEqual([
      { vorname: "Max", nachname: "Muster" },
      { vorname: "Anna Maria", nachname: "Beispiel" },
    ]);
  });

  it("übernimmt ein einzelnes Wort als Nachname", () => {
    expect(parseNamen("Muster")).toEqual([{ vorname: "", nachname: "Muster" }]);
  });

  it("überspringt Leerzeilen und trimmt Ränder", () => {
    expect(parseNamen("  Muster, Max  \n\n\r\n  Erika Musterfrau ")).toEqual([
      { nachname: "Muster", vorname: "Max" },
      { vorname: "Erika", nachname: "Musterfrau" },
    ]);
  });

  it("weitere Kommas gehören zum Vornamen", () => {
    expect(parseNamen("Muster, Max, Dr.")).toEqual([{ nachname: "Muster", vorname: "Max, Dr." }]);
  });

  it("leerer Text ergibt eine leere Liste", () => {
    expect(parseNamen("")).toEqual([]);
    expect(parseNamen("\n  \n")).toEqual([]);
  });
});
