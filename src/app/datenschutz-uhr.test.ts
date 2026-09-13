import { beforeEach, describe, expect, it } from "vitest";
import { MINUTEN_JE_TAG } from "@bos/eeb-format/model";
import { datenschutzZeitpunkt, uhrstandAusJson } from "./datenschutz-uhr";

class MemStorage {
  private m = new Map<string, string>();
  getItem(k: string) {
    return this.m.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, String(v));
  }
}

const TAG = MINUTEN_JE_TAG;
const JETZT = 2500 * TAG;

beforeEach(() => {
  (globalThis as { localStorage?: Storage }).localStorage = new MemStorage() as unknown as Storage;
});

describe("uhrstandAusJson()", () => {
  it("liest einen gültigen Stand und verwirft Müll", () => {
    expect(uhrstandAusJson('{"zuletzt":5,"sprung":9}')).toEqual({ zuletzt: 5, sprung: 9 });
    expect(uhrstandAusJson('{"zuletzt":5}')).toEqual({ zuletzt: 5 });
    expect(uhrstandAusJson("kaputt")).toBeNull();
    expect(uhrstandAusJson('{"zuletzt":"5"}')).toBeNull();
    expect(uhrstandAusJson("null")).toBeNull();
    expect(uhrstandAusJson(null)).toBeNull();
  });
});

describe("datenschutzZeitpunkt()", () => {
  it("folgt der Geräteuhr und merkt sie sich", () => {
    expect(datenschutzZeitpunkt(JETZT)).toBe(JETZT);
    expect(JSON.parse(localStorage.getItem("eeb.uhr.v1")!)).toEqual({ zuletzt: JETZT });
  });

  it("hält einen unplausiblen Sprung über die gemerkte Uhr hinweg zurück", () => {
    datenschutzZeitpunkt(JETZT);
    expect(datenschutzZeitpunkt(JETZT + 4000 * TAG)).toBe(JETZT);
    expect(datenschutzZeitpunkt(JETZT + 4001 * TAG)).toBe(JETZT + 4001 * TAG);
  });

  it("arbeitet ohne Speicher mit der ungeprüften Geräteuhr", () => {
    (globalThis as { localStorage?: Storage }).localStorage = undefined;
    expect(datenschutzZeitpunkt(JETZT)).toBe(JETZT);
  });
});
