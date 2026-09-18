import { describe, expect, it } from "vitest";
import { StaerkeRolle } from "@bos/eeb-format/model";
import { parseNamen, rolleAusFunktion } from "./personal-schnell";

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

  it("liest das dritte Feld als Funktion, nicht als Teil des Vornamens", () => {
    // Eingefügte Listen tragen die Funktion mit. Früher wanderte sie in den
    // Vornamen und stand so auf dem Ausdruck in der Spalte „Name, Vorname".
    expect(parseNamen("Muster, Max, Dr.")).toEqual([
      { nachname: "Muster", vorname: "Max", funktion: "Dr.", rolle: undefined },
    ]);
  });

  it("leitet die Stärke-Rolle aus bekannten Funktionskürzeln ab", () => {
    expect(parseNamen("Meyer, Jens, ZFhr")).toEqual([
      { nachname: "Meyer", vorname: "Jens", funktion: "ZFhr", rolle: StaerkeRolle.FUEHRER },
    ]);
    expect(parseNamen("Koch, Lea, GrFü")).toEqual([
      { nachname: "Koch", vorname: "Lea", funktion: "GrFü", rolle: StaerkeRolle.UNTERFUEHRER },
    ]);
    // Unbekanntes Kürzel bleibt Mannschaft (Vorgabe) und wird nicht geraten.
    expect(parseNamen("Wolf, Ida, Fachberater")[0]!.rolle).toBeUndefined();
  });

  it("erkennt Kürzel unabhängig von Schreibweise, Punkten und Umlauten", () => {
    expect(rolleAusFunktion("z.fü.")).toBe(StaerkeRolle.FUEHRER);
    expect(rolleAusFunktion("Gruppenführer")).toBe(StaerkeRolle.UNTERFUEHRER);
    expect(rolleAusFunktion("")).toBeUndefined();
  });

  it("leerer Text ergibt eine leere Liste", () => {
    expect(parseNamen("")).toEqual([]);
    expect(parseNamen("\n  \n")).toEqual([]);
  });
});
