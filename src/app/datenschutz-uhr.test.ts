import { beforeEach, describe, expect, it } from "vitest";
import { MINUTEN_JE_TAG } from "@bos/eeb-format/model";
import { datenschutzZeitpunkt, uhrstandAusJson } from "./datenschutz-uhr";
import { msAusZeitpunkt } from "./uhr-folgen";

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

  it("hält einen unplausiblen Sprung zurück, wenn dadurch etwas fällig würde, und bestätigt ihn nie durch Zeitablauf", () => {
    datenschutzZeitpunkt(JETZT);
    // Etwas Altes auf dem Gerät: ein Papierkorb-Eintrag der Vorlagen, 29 Tage alt
    localStorage.setItem("eeb.vorlagen.v1", JSON.stringify([{ id: "v", geloeschtAm: Date.now() - 29 * 86_400_000 }]));
    expect(datenschutzZeitpunkt(JETZT + 4000 * TAG)).toBe(JETZT);
    // auch Tage später: weiter unbestätigt (R5-D1)
    expect(datenschutzZeitpunkt(JETZT + 4001 * TAG)).toBe(JETZT);
    expect(datenschutzZeitpunkt(JETZT + 4030 * TAG)).toBe(JETZT);
    expect(JSON.parse(localStorage.getItem("eeb.uhr.v1")!)).toEqual({ zuletzt: JETZT, sprung: JETZT + 4000 * TAG });
  });

  it("übernimmt einen Sprung ohne Frage, wenn er nichts fällig macht (echte Pause)", () => {
    datenschutzZeitpunkt(JETZT);
    expect(datenschutzZeitpunkt(JETZT + 100 * TAG)).toBe(JETZT + 100 * TAG);
    expect(JSON.parse(localStorage.getItem("eeb.uhr.v1")!)).toEqual({ zuletzt: JETZT + 100 * TAG });
  });

  it("hält eine weit zurückgestellte Uhr fest, auch ohne Folgen, und beendet die Rückfrage, wenn sie zurückpasst", () => {
    datenschutzZeitpunkt(JETZT);
    expect(datenschutzZeitpunkt(JETZT - 400 * TAG)).toBe(JETZT - 400 * TAG);
    expect(JSON.parse(localStorage.getItem("eeb.uhr.v1")!)).toEqual({ zuletzt: JETZT, sprung: JETZT - 400 * TAG });
    // Uhr wieder richtig: nichts mehr offen, der letzte Stand wurde nicht zurückgedreht
    expect(datenschutzZeitpunkt(JETZT + 2 * TAG)).toBe(JETZT + 2 * TAG);
    expect(JSON.parse(localStorage.getItem("eeb.uhr.v1")!)).toEqual({ zuletzt: JETZT + 2 * TAG });
  });

  it("arbeitet ohne Speicher mit der ungeprüften Geräteuhr", () => {
    (globalThis as { localStorage?: Storage }).localStorage = undefined;
    expect(datenschutzZeitpunkt(JETZT)).toBe(JETZT);
  });

  // Audit Runde 6, R6-D7: Die Grenze von 60 Tagen ließ eine Sammlung mit 31 bis 59 Tagen
  // Ruhe ohne Vorwarnung fallen (die Ankündigung beginnt erst bei Tag 60).
  it("hält auch einen Sprung unter 60 Tagen zurück, wenn dabei etwas Unangekündigtes fällig würde (R6-D7)", () => {
    datenschutzZeitpunkt(JETZT);
    const heute = msAusZeitpunkt(JETZT);
    localStorage.setItem("eeb.einsaetze.v1", JSON.stringify([{ id: "s", name: "Ruhend", geaendert: heute - 40 * 86_400_000, eintraege: [] }]));
    expect(datenschutzZeitpunkt(JETZT + 55 * TAG)).toBe(JETZT);
    expect(JSON.parse(localStorage.getItem("eeb.uhr.v1")!).sprung).toBe(JETZT + 55 * TAG);
  });

  it("übernimmt denselben Sprung, wenn die Löschung schon angekündigt war (R6-D7)", () => {
    datenschutzZeitpunkt(JETZT);
    const heute = msAusZeitpunkt(JETZT);
    localStorage.setItem("eeb.einsaetze.v1", JSON.stringify([{ id: "s", name: "Angekündigt", geaendert: heute - 70 * 86_400_000, eintraege: [] }]));
    expect(datenschutzZeitpunkt(JETZT + 55 * TAG)).toBe(JETZT + 55 * TAG);
  });
});
