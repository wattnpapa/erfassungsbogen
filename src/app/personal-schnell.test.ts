import { describe, expect, it } from "vitest";
import { StaerkeRolle } from "@bos/eeb-format/model";
import { namenEinsetzen, parseNamen, rolleAusFunktion } from "./personal-schnell";
import { neuePerson, personUnbenannt } from "./hilfen";

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

describe("Audit Runde 2, R2-N2", () => {
  it("liest ein vorangestelltes Führungskürzel als Funktion, nicht als Nachnamen", () => {
    expect(parseNamen("GrFü Maier, Klaus")).toEqual([
      { nachname: "Maier", vorname: "Klaus", funktion: "GrFü", rolle: StaerkeRolle.UNTERFUEHRER },
    ]);
    expect(parseNamen("TrFü Anna Schulz")[0]).toMatchObject({ vorname: "Anna", nachname: "Schulz", funktion: "TrFü" });
    // Ein gewöhnlicher Doppelname bleibt ein Name.
    expect(parseNamen("Anna Maria Schulz")[0]).toEqual({ vorname: "Anna Maria", nachname: "Schulz" });
  });

  it("füllt freie Plätze auf, statt sie zu ersetzen — Führungsrolle zuerst auf passenden Platz", () => {
    const platz = (rolle: StaerkeRolle, code: number) => ({ ...neuePerson(), staerkeRolle: rolle, funktionen: [{ code }] });
    const liste = [platz(StaerkeRolle.UNTERFUEHRER, 1), platz(StaerkeRolle.UNTERFUEHRER, 2), platz(StaerkeRolle.MANNSCHAFT, 3)];
    const helfer = { ...neuePerson(), vorname: "Anna", nachname: "Schulz" };
    const fuehrer = { ...neuePerson(), vorname: "Klaus", nachname: "Maier", staerkeRolle: StaerkeRolle.UNTERFUEHRER, funktionen: [{ freitext: "TrFü" }] };
    const extra = { ...neuePerson(), vorname: "Paul", nachname: "Stein" };
    const vierter = { ...neuePerson(), vorname: "Eva", nachname: "Berg" };

    const r = namenEinsetzen(liste, [helfer, fuehrer, extra, vierter], personUnbenannt);
    expect(r.plaetze).toEqual([0, 1, 2, null]);
    expect(r.personal).toHaveLength(4);
    // Platz 0 behält seine Funktion, Platz 1 bekommt die mitgebrachte.
    expect(r.personal[0]).toMatchObject({ nachname: "Schulz", funktionen: [{ code: 1 }], staerkeRolle: StaerkeRolle.UNTERFUEHRER });
    expect(r.personal[1]).toMatchObject({ nachname: "Maier", funktionen: [{ freitext: "TrFü" }] });
    expect(r.personal[3]).toBe(vierter);
  });
});
