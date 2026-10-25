import { describe, it, expect } from "vitest";
import { dauerText, dtgTeile, zuEingabeWert, ausEingabeWert } from "./lagemonitor";

describe("dtgTeile", () => {
  it("zerlegt die Datum-Zeit-Gruppe wie im Funk", () => {
    expect(dtgTeile(new Date(2026, 1, 17, 18, 6))).toEqual({ tag: "17", zeit: "1806", monat: "feb", jahr: "26" });
    expect(dtgTeile(new Date(2026, 4, 3, 7, 5))).toEqual({ tag: "03", zeit: "0705", monat: "mai", jahr: "26" });
  });
});

describe("dauerText", () => {
  const t0 = new Date(2026, 9, 17, 8, 0).getTime();
  it("schreibt Stunden und Minuten aus", () => {
    expect(dauerText(t0, t0 + (3 * 60 + 15) * 60_000)).toBe("3 Stunden, 15 Minuten");
    expect(dauerText(t0, t0)).toBe("0 Stunden, 0 Minuten");
    expect(dauerText(t0, t0 + 61 * 60_000)).toBe("1 Stunde, 1 Minute");
  });
  it("nimmt ab 24 Stunden Tage dazu", () => {
    expect(dauerText(t0, t0 + (30 * 60 + 6) * 60_000)).toBe("1 Tag, 6 Stunden, 6 Minuten");
    expect(dauerText(t0, t0 + (51 * 60 + 5) * 60_000)).toBe("2 Tage, 3 Stunden, 5 Minuten");
  });
  it("liefert nichts ohne Beginn oder bei einem Beginn in der Zukunft", () => {
    expect(dauerText(null, t0)).toBeNull();
    expect(dauerText(t0 + 1, t0)).toBeNull();
  });
});

describe("Eingabewert des Beginns", () => {
  it("läuft hin und zurück", () => {
    const ms = new Date(2026, 9, 17, 8, 5).getTime();
    expect(zuEingabeWert(ms)).toBe("2026-10-17T08:05");
    expect(ausEingabeWert(zuEingabeWert(ms))).toBe(ms);
  });
  it("nimmt leer und Unsinn als „nicht gesetzt“", () => {
    expect(ausEingabeWert("")).toBeNull();
    expect(ausEingabeWert("gestern")).toBeNull();
  });
});
