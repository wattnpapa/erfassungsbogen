import { describe, it, expect, beforeEach } from "vitest";
import { sicherungEinspielen, sicherungErstellen, sicherungInhalt, sicherungParsen } from "./sicherung";

class MemStorage {
  private m = new Map<string, string>();
  get length() {
    return this.m.size;
  }
  clear() {
    this.m.clear();
  }
  getItem(k: string) {
    return this.m.has(k) ? this.m.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, String(v));
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
  key(i: number) {
    return [...this.m.keys()][i] ?? null;
  }
}

beforeEach(() => {
  (globalThis as { localStorage?: Storage }).localStorage = new MemStorage() as unknown as Storage;
});

describe("sicherungInhalt() / sicherungParsen()", () => {
  it("überlebt einen Roundtrip", () => {
    const eintraege = { "eeb.vorlagen.v1": "[]", "eeb.signieren.v1": "1" };
    expect(sicherungParsen(sicherungInhalt(eintraege))).toEqual(eintraege);
  });

  it("ignoriert fremde Schlüssel ohne eeb.-Präfix", () => {
    const text = sicherungInhalt({ "eeb.a": "1", "fremd.b": "2" } as Record<string, string>);
    expect(sicherungParsen(text)).toEqual({ "eeb.a": "1" });
  });

  it("weist Müll und fremde Formate mit verständlicher Meldung ab", () => {
    expect(() => sicherungParsen("kein json")).toThrow(/JSON/);
    expect(() => sicherungParsen('{"format":"anders"}')).toThrow(/Sicherungsdatei/);
    expect(() => sicherungParsen('{"format":"eeb-sicherung","version":99,"eintraege":{}}')).toThrow(/neueren App-Version/);
  });
});

describe("sicherungErstellen() / sicherungEinspielen()", () => {
  it("sichert alle eeb.*-Einträge und stellt sie auf einem leeren Gerät wieder her", () => {
    localStorage.setItem("eeb.vorlagen.v1", "[1]");
    localStorage.setItem("eeb.einsaetze.v1", "[2]");
    localStorage.setItem("fremd", "bleibt draußen");
    const datei = sicherungErstellen();

    (globalThis as { localStorage?: Storage }).localStorage = new MemStorage() as unknown as Storage;
    expect(sicherungEinspielen(datei)).toBe(2);
    expect(localStorage.getItem("eeb.vorlagen.v1")).toBe("[1]");
    expect(localStorage.getItem("eeb.einsaetze.v1")).toBe("[2]");
    expect(localStorage.getItem("fremd")).toBeNull();
  });

  it("ersetzt beim Einspielen vorhandene App-Daten komplett (Geräteumzug)", () => {
    const datei = sicherungInhalt({ "eeb.vorlagen.v1": "[\"neu\"]" });
    localStorage.setItem("eeb.vorlagen.v1", "[\"alt\"]");
    localStorage.setItem("eeb.entwurf.v1", "{\"alt\":true}");
    sicherungEinspielen(datei);
    expect(localStorage.getItem("eeb.vorlagen.v1")).toBe("[\"neu\"]");
    expect(localStorage.getItem("eeb.entwurf.v1")).toBeNull(); // nicht in der Sicherung → weg
  });
});
