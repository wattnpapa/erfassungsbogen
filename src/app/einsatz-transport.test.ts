import { describe, it, expect, beforeEach } from "vitest";
import { deflate } from "pako";
import {
  OrganisationsTyp,
  PersonalErfassung,
  SCHEMA_VERSION,
  StaerkeRolle,
  Fahrerlaubnis,
  Geschlecht,
  Ernaehrung,
  type Erfassungsbogen,
  type Person,
} from "../model";
import { einsatzAnlegen, einsaetzeLaden, einsatzImportieren, meldungHinzufuegen } from "./einsaetze";
import { boegenAusPdfBytes, einsatzAusDatei, einsatzDateiInhalt } from "./einsatz-transport";

class MemStorage {
  private m = new Map<string, string>();
  get length() { return this.m.size; }
  clear() { this.m.clear(); }
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
}

beforeEach(() => {
  (globalThis as { localStorage?: Storage }).localStorage = new MemStorage() as unknown as Storage;
});

function person(nachname: string, rolle: StaerkeRolle): Person {
  return { vorname: "T", nachname, staerkeRolle: rolle, funktionen: [], fahrerlaubnis: Fahrerlaubnis.NONE, geschlecht: Geschlecht.M, ernaehrung: Ernaehrung.FLEISCH, kontakte: [], zusatzqualifikationen: [] };
}

function bogen(over: Partial<Erfassungsbogen> = {}): Erfassungsbogen {
  return {
    schemaVersion: SCHEMA_VERSION,
    stand: 100,
    einheit: { organisation: OrganisationsTyp.THW, einheitsTyp: { code: 1 }, name: "OV Oldenburg", hierarchie: [] },
    einsatz: { zeitraumVon: 100, zeitraumBis: 130, ortAuftrag: "Lage" },
    personalErfassung: PersonalErfassung.VOLLSTAENDIG,
    personal: [person("Berger", StaerkeRolle.FUEHRER)],
    fahrzeuge: [],
    ...over,
  };
}

/** Baut minimale „PDF"-Bytes mit einem stream…endstream-Block um die Nutzlast. */
function pdfMitStream(payload: Uint8Array): Uint8Array {
  const pre = new TextEncoder().encode("%PDF-1.7\n1 0 obj\n<< /Type /EmbeddedFile /Filter /FlateDecode >>\nstream\n");
  const post = new TextEncoder().encode("\nendstream\nendobj\n%%EOF");
  const out = new Uint8Array(pre.length + payload.length + post.length);
  out.set(pre, 0);
  out.set(payload, pre.length);
  out.set(post, pre.length + payload.length);
  return out;
}

describe("einsatzAusDatei() / einsatzDateiInhalt()", () => {
  it("überlebt einen Roundtrip über den Datei-Umschlag", () => {
    const s = einsatzAnlegen("Hochwasser", 0, "Oldenburg");
    meldungHinzufuegen(s.id, bogen());
    const geladen = einsaetzeLaden()[0]!;
    const wieder = einsatzAusDatei(einsatzDateiInhalt(geladen));
    expect(wieder.id).toBe(geladen.id);
    expect(wieder.eintraege).toHaveLength(1);
  });

  it("akzeptiert auch eine bloße Sammlung ohne Umschlag", () => {
    const s = einsatzAnlegen("E", 0);
    meldungHinzufuegen(s.id, bogen());
    const roh = JSON.stringify(einsaetzeLaden()[0]);
    expect(einsatzAusDatei(roh).eintraege).toHaveLength(1);
  });

  it("wirft bei ungültiger Datei", () => {
    expect(() => einsatzAusDatei("{kein json")).toThrow();
    expect(() => einsatzAusDatei(JSON.stringify({ irgendwas: true }))).toThrow();
  });
});

describe("boegenAusPdfBytes()", () => {
  it("findet einen roh eingebetteten Bogen", () => {
    const json = new TextEncoder().encode(JSON.stringify(bogen()));
    const boegen = boegenAusPdfBytes(pdfMitStream(json));
    expect(boegen).toHaveLength(1);
    expect(boegen[0]!.einheit.name).toBe("OV Oldenburg");
  });

  it("entpackt einen FlateDecode-komprimierten Bogen", () => {
    const json = new TextEncoder().encode(JSON.stringify(bogen({ stand: 105 })));
    const boegen = boegenAusPdfBytes(pdfMitStream(deflate(json)));
    expect(boegen).toHaveLength(1);
    expect(boegen[0]!.stand).toBe(105);
  });

  it("findet ein eingebettetes Bogen-Array (Sammel-PDF)", () => {
    const arr = [bogen({ stand: 100 }), bogen({ einheit: { organisation: 1, einheitsTyp: { code: 1 }, name: "OV Wardenburg", hierarchie: [] } })];
    const json = new TextEncoder().encode(JSON.stringify(arr));
    const boegen = boegenAusPdfBytes(pdfMitStream(deflate(json)));
    expect(boegen).toHaveLength(2);
  });

  it("liefert nichts, wenn kein Bogen-JSON enthalten ist", () => {
    const noise = new TextEncoder().encode("BT /F1 12 Tf (Hallo) Tj ET");
    expect(boegenAusPdfBytes(pdfMitStream(noise))).toHaveLength(0);
  });
});

describe("einsatzImportieren()", () => {
  it("legt einen unbekannten Einsatz neu an", () => {
    const s = einsatzAnlegen("Quelle", 0);
    meldungHinzufuegen(s.id, bogen());
    const kopie = einsatzAusDatei(einsatzDateiInhalt(einsaetzeLaden()[0]!));
    (globalThis as { localStorage?: Storage }).localStorage = new MemStorage() as unknown as Storage; // frisches Zielgerät
    const r = einsatzImportieren(kopie);
    expect(r.neuerEinsatz).toBe(true);
    expect(einsaetzeLaden()).toHaveLength(1);
  });

  it("führt gleiche Einsätze zusammen und dedupliziert Meldungen", () => {
    const s = einsatzAnlegen("E", 0);
    meldungHinzufuegen(s.id, bogen({ stand: 100 }));
    const stand1 = einsatzAusDatei(einsatzDateiInhalt(einsaetzeLaden()[0]!));
    // Zielgerät hat den Einsatz schon mit einer neueren Meldung.
    meldungHinzufuegen(s.id, bogen({ stand: 102 }));
    const r = einsatzImportieren(stand1); // enthält nur die alte Fassung
    expect(r.neuerEinsatz).toBe(false);
    expect(r.hinzugefuegt).toBe(0); // stand-100-Meldung ist bereits vorhanden
    expect(einsaetzeLaden()[0]!.eintraege).toHaveLength(2);
  });
});
