import { describe, it, expect } from "vitest";
import { Geschlecht } from "@bos/eeb-format/model";
import {
  GESCHLECHT_GEPRUEFT_SCHLUESSEL,
  besetzungsPruefsumme,
  geschlechtGeprueft,
  geschlechtGeprueftSetzen,
} from "./geschlecht-geprueft";
import { neuePerson } from "./hilfen";

function speicher() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    roh: () => m.get(GESCHLECHT_GEPRUEFT_SCHLUESSEL),
  };
}

const zwei = [
  { ...neuePerson(), vorname: "Arne", nachname: "Muster", geschlecht: Geschlecht.M },
  { ...neuePerson(), vorname: "Bert", nachname: "Beispiel", geschlecht: Geschlecht.M },
];

describe("Geschlecht geprüft", () => {
  it("merkt die Besetzung und nimmt die Bestätigung zurück", () => {
    const s = speicher();
    expect(geschlechtGeprueft(zwei, s)).toBe(false);
    geschlechtGeprueftSetzen(zwei, true, s);
    expect(geschlechtGeprueft(zwei, s)).toBe(true);
    geschlechtGeprueftSetzen(zwei, false, s);
    expect(geschlechtGeprueft(zwei, s)).toBe(false);
  });

  it("gilt nicht mehr, sobald eine Person dazukommt oder ein Name sich ändert", () => {
    const s = speicher();
    geschlechtGeprueftSetzen(zwei, true, s);
    expect(geschlechtGeprueft([...zwei, { ...neuePerson(), nachname: "Neu" }], s)).toBe(false);
    expect(geschlechtGeprueft([zwei[0]!, { ...zwei[1]!, nachname: "Anders" }], s)).toBe(false);
  });

  it("speichert keine Namen, nur Prüfsummen", () => {
    const s = speicher();
    geschlechtGeprueftSetzen(zwei, true, s);
    expect(s.roh()).not.toMatch(/Arne|Muster|Bert|Beispiel/);
    expect(JSON.parse(s.roh()!)).toEqual([besetzungsPruefsumme(zwei)]);
  });

  it("hält höchstens 50 Bestätigungen", () => {
    const s = speicher();
    for (let i = 0; i < 60; i++) geschlechtGeprueftSetzen([{ ...neuePerson(), nachname: `P${i}` }], true, s);
    expect(JSON.parse(s.roh()!)).toHaveLength(50);
  });

  it("verträgt fehlenden oder kaputten Speicher", () => {
    expect(geschlechtGeprueft(zwei, null)).toBe(false);
    expect(() => geschlechtGeprueftSetzen(zwei, true, null)).not.toThrow();
    expect(geschlechtGeprueft(zwei, { getItem: () => "{kaputt" })).toBe(false);
  });
});
