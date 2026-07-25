import { describe, it, expect, beforeEach } from "vitest";
import {
  ABSENDER_MAX,
  absenderHinweis,
  absenderkarteGefuellt,
  absenderkarteLaden,
  absenderkarteLoeschen,
  absenderkarteSpeichern,
  normalisiereAbsenderkarte,
} from "./absenderkarte";

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

describe("normalisiereAbsenderkarte()", () => {
  it("trimmt, entfernt leere Felder und Zeilenumbrüche", () => {
    expect(normalisiereAbsenderkarte({ name: "  Max Mustermann \n", email: "   ", telefon: "0170\t1" })).toEqual({
      name: "Max Mustermann",
      telefon: "0170 1",
    });
  });

  it("kürzt überlange Angaben auf das Größenbudget", () => {
    const k = normalisiereAbsenderkarte({ name: "x".repeat(200) });
    expect(k.name).toHaveLength(ABSENDER_MAX.name);
  });
});

describe("Speichern/Laden", () => {
  it("ist ein Roundtrip über den localStorage", () => {
    absenderkarteSpeichern({ name: "Max", telefon: "0441 123456" });
    expect(absenderkarteLaden()).toEqual({ name: "Max", telefon: "0441 123456" });
  });

  it("liefert ohne Eintrag eine leere Karte", () => {
    expect(absenderkarteLaden()).toEqual({});
    expect(absenderkarteGefuellt(absenderkarteLaden())).toBe(false);
  });

  it("löscht den Eintrag, wenn alle Felder geleert werden", () => {
    absenderkarteSpeichern({ name: "Max" });
    expect(absenderkarteSpeichern({ name: "  " })).toEqual({});
    expect(absenderkarteLaden()).toEqual({});
  });

  it("verträgt einen beschädigten Eintrag wie ‚keine Karte‘", () => {
    globalThis.localStorage.setItem("eeb.absenderkarte.v1", "{kaputt");
    expect(absenderkarteLaden()).toEqual({});
  });

  it("entfernt die Karte auf Wunsch", () => {
    absenderkarteSpeichern({ name: "Max" });
    absenderkarteLoeschen();
    expect(absenderkarteLaden()).toEqual({});
  });
});

describe("absenderHinweis()", () => {
  it("schweigt bei plausiblen und bei leeren Angaben", () => {
    expect(absenderHinweis({})).toBe("");
    expect(absenderHinweis({ name: "Max", email: "max@thw.de", telefon: "0170 1234567" })).toBe("");
  });

  it("weist auf unvollständige Angaben hin, ohne zu blockieren", () => {
    expect(absenderHinweis({ name: "Max", email: "max@thw" })).toMatch(/E-Mail/);
    expect(absenderHinweis({ name: "Max", telefon: "01" })).toMatch(/Telefon/);
    expect(absenderHinweis({ email: "max@thw.de" })).toMatch(/Namen/);
  });
});
