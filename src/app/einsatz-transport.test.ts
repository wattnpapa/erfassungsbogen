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
} from "@bos/eeb-format/model";
import { speicherhuelleSetzen } from "@bos/meldekopf/einsaetze";
import { boegenAusPdfBytes } from "./einsatz-transport";

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
  const mem = new MemStorage() as unknown as Storage;
  (globalThis as { localStorage?: Storage }).localStorage = mem;
  // Die Einsatz-Sammlung bekommt ihre Ablage hineingereicht (ADR-003).
  speicherhuelleSetzen(mem);
});

function person(nachname: string, rolle: StaerkeRolle): Person {
  return { vorname: "T", nachname, staerkeRolle: rolle, funktionen: [], fahrerlaubnis: Fahrerlaubnis.NONE, geschlecht: Geschlecht.M, ernaehrung: Ernaehrung.FLEISCH, kontakte: [], zusatzqualifikationen: [] };
}

function bogen(over: Partial<Erfassungsbogen> = {}): Erfassungsbogen {
  return {
    schemaVersion: SCHEMA_VERSION,
    stand: 100,
    einheit: { organisation: OrganisationsTyp.THW, einheitsTyp: { code: 1 }, hierarchie: [{ bezeichnung: { code: 1 }, name: "OV Oldenburg" }] },
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

describe("boegenAusPdfBytes()", () => {
  it("findet einen roh eingebetteten Bogen", () => {
    const json = new TextEncoder().encode(JSON.stringify(bogen()));
    const boegen = boegenAusPdfBytes(pdfMitStream(json));
    expect(boegen).toHaveLength(1);
    expect(boegen[0]!.einheit.hierarchie[0]!.name).toBe("OV Oldenburg");
  });

  it("entpackt einen FlateDecode-komprimierten Bogen", () => {
    const json = new TextEncoder().encode(JSON.stringify(bogen({ stand: 105 })));
    const boegen = boegenAusPdfBytes(pdfMitStream(deflate(json)));
    expect(boegen).toHaveLength(1);
    expect(boegen[0]!.stand).toBe(105);
  });

  it("findet ein eingebettetes Bogen-Array (Sammel-PDF)", () => {
    const arr = [bogen({ stand: 100 }), bogen({ einheit: { organisation: 1, einheitsTyp: { code: 1 }, hierarchie: [{ bezeichnung: { code: 1 }, name: "OV Wardenburg" }] } })];
    const json = new TextEncoder().encode(JSON.stringify(arr));
    const boegen = boegenAusPdfBytes(pdfMitStream(deflate(json)));
    expect(boegen).toHaveLength(2);
  });

  it("liefert nichts, wenn kein Bogen-JSON enthalten ist", () => {
    const noise = new TextEncoder().encode("BT /F1 12 Tf (Hallo) Tj ET");
    expect(boegenAusPdfBytes(pdfMitStream(noise))).toHaveLength(0);
  });
});
