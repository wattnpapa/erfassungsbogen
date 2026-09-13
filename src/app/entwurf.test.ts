import { describe, it, expect, beforeEach, vi } from "vitest";

// entwurf.ts zieht über ./hilfen → ./nativ die Capacitor-Plugins; der Mock hält
// die Node-Testumgebung frei davon (gleiches Muster wie hilfen.test.ts).
vi.mock("./nativ", () => ({
  istNativ: () => false,
  textTeilen: async () => {},
}));

import {
  Ernaehrung,
  Fahrerlaubnis,
  Geschlecht,
  MINUTEN_JE_TAG,
  SCHEMA_VERSION,
  StaerkeRolle,
} from "@bos/eeb-format/model";
import { ANONYM_BEZEICHNUNG } from "@bos/eeb-format/datenschutzfrist";
import { neuerBogen } from "./hilfen";
import { entwurfAusJson, entwurfZuJson, entwurfLaden, entwurfSpeichern, entwurfVerwerfen } from "./entwurf";

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

describe("entwurfAusJson()", () => {
  it("überlebt einen Roundtrip", () => {
    const b = neuerBogen();
    b.einheit.hierarchie = [{ bezeichnung: { code: 1 }, name: "OV Test" }];
    const e = entwurfAusJson(entwurfZuJson(b, 1234));
    expect(e?.gespeichert).toBe(1234);
    expect(e?.bogen.einheit.hierarchie[0]!.name).toBe("OV Test");
  });

  it("ist defensiv gegen Müll und fremde Formate", () => {
    expect(entwurfAusJson(null)).toBeNull();
    expect(entwurfAusJson("kein json")).toBeNull();
    expect(entwurfAusJson("{}")).toBeNull();
    expect(entwurfAusJson('{"gespeichert":1}')).toBeNull(); // ohne bogen
  });

  it("hebt alte Schema-Versionen beim Laden (Migration)", () => {
    const alt = neuerBogen();
    alt.schemaVersion = 2;
    const e = entwurfAusJson(entwurfZuJson(alt, 1));
    expect(e?.bogen.schemaVersion).toBe(SCHEMA_VERSION);
  });
});

describe("Speichern/Laden/Verwerfen über localStorage", () => {
  it("legt ab, lädt zurück und verwirft", () => {
    const b = neuerBogen();
    b.einheit.hierarchie = [{ bezeichnung: { code: 1 }, name: "LZ Wardenburg" }];
    entwurfSpeichern(b);
    expect(entwurfLaden()?.bogen.einheit.hierarchie[0]!.name).toBe("LZ Wardenburg");

    entwurfVerwerfen();
    expect(entwurfLaden()).toBeNull();
  });
});

describe("Datenschutzfrist", () => {
  function bogenMitPerson(uebung?: true) {
    const b = neuerBogen();
    b.stand = 2000 * MINUTEN_JE_TAG;
    b.uebung = uebung;
    b.personal = [
      {
        vorname: "Anna",
        nachname: "Berger",
        staerkeRolle: StaerkeRolle.FUEHRER,
        funktionen: [{ code: 1 }],
        fahrerlaubnis: Fahrerlaubnis.B,
        geschlecht: Geschlecht.W,
        ernaehrung: Ernaehrung.FLEISCH,
        kontakte: [],
        zusatzqualifikationen: [],
      },
    ];
    return b;
  }

  it("anonymisiert einen abgelaufenen Entwurf beim Laden und überschreibt ihn im Speicher", () => {
    entwurfSpeichern(bogenMitPerson());
    const e = entwurfLaden((2000 + 90) * MINUTEN_JE_TAG);
    expect(e?.bogen.personal[0]!.nachname).toBe(`${ANONYM_BEZEICHNUNG} 1`);
    expect(localStorage.getItem("eeb.entwurf.v1")).not.toMatch(/Anna|Berger/);
  });

  it("lässt einen Entwurf in der Frist und einen Übungsentwurf unangetastet", () => {
    entwurfSpeichern(bogenMitPerson());
    expect(entwurfLaden((2000 + 89) * MINUTEN_JE_TAG)?.bogen.personal[0]!.nachname).toBe("Berger");
    entwurfSpeichern(bogenMitPerson(true));
    expect(entwurfLaden((2000 + 5000) * MINUTEN_JE_TAG)?.bogen.personal[0]!.nachname).toBe("Berger");
  });
});
