import { describe, it, expect } from "vitest";
import { bedarfText, dauerText, dtgTeile, uhrTeile, zuEingabeWert, ausEingabeWert } from "./lagemonitor";
import type { EinsatzSummen } from "./auswertung";

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
    expect(dauerText(t0, t0)).toBe("0 Minuten");
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

describe("uhrTeile (R10-H3)", () => {
  it("trennt Uhrzeit mit Doppelpunkt und ausgeschriebenes Datum", () => {
    expect(uhrTeile(new Date(2026, 9, 25, 10, 28))).toEqual({ zeit: "10:28", datum: "25. Okt. 2026" });
    expect(uhrTeile(new Date(2026, 2, 3, 7, 5))).toEqual({ zeit: "07:05", datum: "3. März 2026" });
  });
});

describe("bedarfText (R10-K5)", () => {
  const summen = (k: Partial<EinsatzSummen>) =>
    ({
      kraftstoff: { dieselLiter: 0, benzinLiter: 0, gemischLiter: 0 },
      unterbringungBenoetigt: 0,
      unterbringungAngefordert: { personen: 0, m: 0, w: 0, d: 0, ohneAngabe: 0 },
      ruhezeitErforderlich: 0,
      ...k,
    }) as EinsatzSummen;
  it("ist leer, wenn nichts angefordert ist", () => {
    expect(bedarfText(summen({}))).toBeNull();
  });
  it("nennt nur, was da ist, wie die Kopfzeile der Einsatzansicht", () => {
    expect(
      bedarfText(summen({ kraftstoff: { dieselLiter: 120, benzinLiter: 40, gemischLiter: 5 }, unterbringungBenoetigt: 2, unterbringungAngefordert: { personen: 24, m: 20, w: 4, d: 0, ohneAngabe: 0 }, ruhezeitErforderlich: 3 })),
    ).toBe("Bedarf: Unterbringung 24 Personen · Diesel 120 l · Benzin 40 l · Gemisch 5 l · Ruhezeit 3 Einheiten");
    expect(bedarfText(summen({ ruhezeitErforderlich: 1 }))).toBe("Bedarf: Ruhezeit 1 Einheit");
  });
});
