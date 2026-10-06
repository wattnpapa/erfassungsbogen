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
import {
  entwurfAusJson,
  entwurfZuJson,
  entwurfLaden,
  entwurfSpeichern,
  entwurfVerwerfen,
  ersetztenEntwurfLaden,
  ersetztenEntwurfMerken,
  rueckholungNimmt,
} from "./entwurf";

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

  it("merkt sich die bearbeitete Vorlage — und lässt sie weg, wenn es keine gibt", () => {
    const b = neuerBogen();
    entwurfSpeichern(b, { vorlageId: "vorlage-7" });
    expect(entwurfLaden()?.vorlageId).toBe("vorlage-7");
    entwurfSpeichern(b);
    expect(entwurfLaden()?.vorlageId).toBeUndefined();
    expect(localStorage.getItem("eeb.entwurf.v1")).not.toMatch(/vorlageId/);
  });

  it("verwirft eine unbrauchbare Vorlagen-Kennung statt des ganzen Entwurfs", () => {
    const e = entwurfAusJson(JSON.stringify({ gespeichert: 1, bogen: neuerBogen(), vorlageId: 42 }));
    expect(e).not.toBeNull();
    expect(e?.vorlageId).toBeUndefined();
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
    entwurfSpeichern(bogenMitPerson(), { vorlageId: "vorlage-9" });
    const e = entwurfLaden((2000 + 90) * MINUTEN_JE_TAG);
    expect(e?.bogen.personal[0]!.nachname).toBe(`${ANONYM_BEZEICHNUNG} 1`);
    expect(localStorage.getItem("eeb.entwurf.v1")).not.toMatch(/Anna|Berger/);
    // Die Verbindung zur Vorlage überlebt das Überschreiben im Speicher.
    expect(e?.vorlageId).toBe("vorlage-9");
    expect(entwurfLaden((2000 + 90) * MINUTEN_JE_TAG)?.vorlageId).toBe("vorlage-9");
  });

  it("lässt einen Entwurf in der Frist und einen Übungsentwurf unangetastet", () => {
    entwurfSpeichern(bogenMitPerson());
    expect(entwurfLaden((2000 + 89) * MINUTEN_JE_TAG)?.bogen.personal[0]!.nachname).toBe("Berger");
    entwurfSpeichern(bogenMitPerson(true));
    expect(entwurfLaden((2000 + 5000) * MINUTEN_JE_TAG)?.bogen.personal[0]!.nachname).toBe("Berger");
  });
});

describe("Rückholung und fremde Erfassungen (R2-N1/R2-E1)", () => {
  function mitName(name: string) {
    const b = neuerBogen();
    b.einheit.hierarchie = [{ bezeichnung: { code: 1 }, name }];
    return b;
  }

  it("merkt sich die Kennzeichnung einer fremden Erfassung samt Sammlung", () => {
    entwurfSpeichern(neuerBogen(), { fremd: { einsatzId: "e-1" } });
    expect(entwurfLaden()?.fremd).toEqual({ einsatzId: "e-1" });
    entwurfSpeichern(neuerBogen());
    expect(entwurfLaden()?.fremd).toBeUndefined();
    // Müll im Feld ergibt „fremd ohne Sammlung", nicht einen kaputten Entwurf.
    expect(entwurfAusJson(JSON.stringify({ gespeichert: 1, bogen: neuerBogen(), fremd: { einsatzId: 3 } }))?.fremd).toEqual({});
  });

  it("merkt sich den Beginn einer fremden Erfassung (R3-S6) und verwirft Müll darin", () => {
    entwurfSpeichern(neuerBogen(), { fremd: { einsatzId: "e-1", beginn: 1_700_000_000_000 } });
    expect(entwurfLaden()?.fremd).toEqual({ einsatzId: "e-1", beginn: 1_700_000_000_000 });
    expect(entwurfAusJson(JSON.stringify({ gespeichert: 1, bogen: neuerBogen(), fremd: { beginn: "12:00" } }))?.fremd).toEqual({});
  });

  it("lässt eine fremde Erfassung einen eigenen Bogen nie verdrängen", () => {
    expect(rueckholungNimmt(false, null)).toBe(true);
    expect(rueckholungNimmt(true, null)).toBe(true);

    expect(ersetztenEntwurfMerken(mitName("Eigenhausen"))).toBe(true);
    expect(ersetztenEntwurfMerken(mitName("Fremdstadt"), {})).toBe(false);
    expect(ersetztenEntwurfLaden()?.bogen.einheit.hierarchie[0]!.name).toBe("Eigenhausen");

    // Beim Zurückholen wird der Platz frei — dann darf auch die Erfassung hinein.
    expect(ersetztenEntwurfMerken(mitName("Fremdstadt"), { einsatzId: "e-1" }, { tausch: true })).toBe(true);
    expect(ersetztenEntwurfLaden()?.fremd).toEqual({ einsatzId: "e-1" });
    // Eine fremde Erfassung verdrängt eine andere, ein eigener Bogen jede.
    expect(ersetztenEntwurfMerken(mitName("Zweitstadt"), {})).toBe(true);
    expect(ersetztenEntwurfMerken(mitName("Eigenhausen"))).toBe(true);
    expect(ersetztenEntwurfLaden()?.fremd).toBeUndefined();
  });

  // Audit Runde 4, R4-S5: Der Stand am Rückholplatz ist die letzte Bearbeitung.
  it("nennt am Rückholplatz die letzte Bearbeitung statt des Zeitpunkts des Verdrängens", () => {
    const um2240 = new Date(2026, 9, 5, 22, 40).getTime();
    expect(ersetztenEntwurfMerken(mitName("Eigenhausen"), undefined, { geaendertUm: um2240 })).toBe(true);
    expect(ersetztenEntwurfLaden()?.gespeichert).toBe(um2240);

    // Ohne Angabe gilt wie früher der Zeitpunkt des Merkens.
    const vorher = Date.now();
    expect(ersetztenEntwurfMerken(mitName("Zweitstadt"))).toBe(true);
    expect(ersetztenEntwurfLaden()!.gespeichert).toBeGreaterThanOrEqual(vorher);
  });
});

describe("Wiedereinstieg (R2-N7, R2-O3)", () => {
  it("merkt sich den zuletzt offenen Schritt und den Zeitpunkt der letzten Änderung", () => {
    entwurfSpeichern(neuerBogen(), { schritt: 2 }, 1234);
    const e = entwurfLaden()!;
    expect(e.schritt).toBe(2);
    expect(e.gespeichert).toBe(1234);
    // Unsinniger Schritt fällt weg, statt die App in einen leeren Schritt zu führen.
    expect(entwurfAusJson(JSON.stringify({ gespeichert: 1, bogen: neuerBogen(), schritt: 17 }))?.schritt).toBeUndefined();
  });
});
