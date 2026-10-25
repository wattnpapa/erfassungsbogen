/**
 * Vor Ort entfernte Meldungen dürfen bei „Einsatz importieren…" nicht still
 * zurückkommen (Audit Runde 2, R2-D4). Hier: das Gedächtnis dafür.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { OrganisationsTyp, PersonalErfassung, SCHEMA_VERSION, type Erfassungsbogen } from "@bos/eeb-format/model";
import { EinsatzArt, einsaetzeLaden, einsatzAnlegen, meldungHinzufuegen, speicherhuelleSetzen } from "@bos/meldekopf/einsaetze";
import { entfernteLaden, entfernteMerken, entfernteVergessen, zurueckkehrende } from "./entfernte-meldungen";
import { einheitEntfernen } from "./eintrag-zeiten";

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
  speicherhuelleSetzen(mem);
});

function bogen(name: string): Erfassungsbogen {
  return {
    schemaVersion: SCHEMA_VERSION,
    stand: 100,
    uebung: true,
    einheit: { organisation: OrganisationsTyp.THW, einheitsTyp: { code: 1 }, hierarchie: [{ bezeichnung: { code: 1 }, name }] },
    einsatz: { zeitraumVon: 100, zeitraumBis: 130, ortAuftrag: "Lage" },
    personalErfassung: PersonalErfassung.NUR_STAERKE,
    staerkeManuell: { fuehrer: 1, unterfuehrer: 0, mannschaft: 3, gesamt: 4 },
    personal: [],
    fahrzeuge: [],
  };
}

describe("entfernte Meldungen merken", () => {
  it("„Entfernen“ merkt sich alle Fassungen der Einheit", () => {
    const s = einsatzAnlegen("Hochwasser Ulm", EinsatzArt.EINSATZ);
    const r = meldungHinzufuegen(s.id, bogen("Albstadt"))!;
    meldungHinzufuegen(s.id, bogen("Crailsheim"));

    const weg = einheitEntfernen(s.id, r.eintrag.einheitSchluessel);

    expect(entfernteLaden()[s.id]).toEqual(weg.map((e) => e.id));
  });

  it("„Rückgängig“ vergisst die Kennungen wieder; leere Listen verschwinden", () => {
    const s = einsatzAnlegen("A", EinsatzArt.EINSATZ);
    entfernteMerken(s.id, ["x", "y"]);
    entfernteVergessen(s.id, ["x"]);
    expect(entfernteLaden()[s.id]).toEqual(["y"]);
    entfernteVergessen(s.id, ["y"]);
    expect(entfernteLaden()).toEqual({});
  });

  it("vergisst Sammlungen, die es nicht mehr gibt", () => {
    const s = einsatzAnlegen("A", EinsatzArt.EINSATZ);
    entfernteMerken("gibt-es-nicht", ["x"]);
    entfernteMerken(s.id, ["y"]);
    expect(Object.keys(entfernteLaden())).toEqual([s.id]);
  });
});

describe("zurueckkehrende()", () => {
  it("findet genau die hier entfernten Einträge der Datei", () => {
    const s = einsatzAnlegen("Hochwasser Ulm", EinsatzArt.EINSATZ);
    const alb = meldungHinzufuegen(s.id, bogen("Albstadt"))!;
    meldungHinzufuegen(s.id, bogen("Crailsheim"));
    const datei = structuredClone(einsaetzeLaden()[0]!); // Export vor dem Entfernen

    einheitEntfernen(s.id, alb.eintrag.einheitSchluessel);
    const vorhanden = einsaetzeLaden()[0]!;

    const zurueck = zurueckkehrende(datei, vorhanden, entfernteLaden());
    expect(zurueck.map((e) => e.id)).toEqual([alb.eintrag.id]);
  });

  it("fragt nichts bei einer Sammlung, die es hier nicht gibt", () => {
    const s = einsatzAnlegen("X", EinsatzArt.EINSATZ);
    const datei = einsaetzeLaden()[0]!;
    expect(zurueckkehrende(datei, undefined, { [s.id]: ["a"] })).toEqual([]);
  });
});
