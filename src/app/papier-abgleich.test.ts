/**
 * Lage vom Papier abgleichen (Audit Runde 3, R3-A2).
 */

import { describe, it, expect, beforeEach } from "vitest";
import { OrganisationsTyp, PersonalErfassung, SCHEMA_VERSION, type Erfassungsbogen } from "@bos/eeb-format/model";
import { EinsatzArt, einsaetzeLaden, einsatzAnlegen, speicherhuelleSetzen } from "@bos/meldekopf/einsaetze";
import { meldungAufnehmen } from "./eintrag-zeiten";
import { meldungsNummern } from "./einheiten-tabelle";

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
  const mem = new MemStorage();
  (globalThis as { localStorage?: Storage }).localStorage = mem as unknown as Storage;
  speicherhuelleSetzen(mem as unknown as Storage);
});

function bogen(ort: string, mannschaft = 3, stand = 100): Erfassungsbogen {
  return {
    schemaVersion: SCHEMA_VERSION,
    stand,
    einheit: { organisation: OrganisationsTyp.THW, einheitsTyp: { code: 1 }, hierarchie: [{ bezeichnung: { code: 1 }, name: ort }] },
    einsatz: { zeitraumVon: 100, zeitraumBis: 130, ortAuftrag: "Lage" },
    personalErfassung: PersonalErfassung.NUR_STAERKE,
    staerkeManuell: { fuehrer: 1, unterfuehrer: 0, mannschaft, gesamt: 1 + mannschaft },
    personal: [],
    fahrzeuge: [],
  };
}

const sammlung = (id: string) => einsaetzeLaden().find((s) => s.id === id)!;

describe("Notiz und Nummer vom Blatt (Audit Runde 4, R4-A1, R4-A2)", () => {
  function lage() {
    const s = einsatzAnlegen("Hochwasser", EinsatzArt.EINSATZ);
    // Eingang in Alphabet-fremder Reihenfolge: Crailsheim, Albstadt, Ulm.
    const ids = ["Crailsheim", "Albstadt", "Ulm"].map((n) => meldungAufnehmen(s.id, bogen(n), { quelle: "scan" })!.eintrag);
    return { id: s.id, ids: ids.map((e) => e.id) };
  }

  it("zählt ohne feste Nummern wie bisher und vergibt eine doppelte nur einmal", () => {
    const { id } = lage();
    const e = sammlung(id).eintraege;
    for (const x of e) x.nummer = 2; // alle behaupten Nr. 2
    const nr = [...meldungsNummern(e).values()].sort();
    // Eine Nummer gilt nur einmal: Die erste Einheit behält die 2, die übrigen bekommen andere, verschiedene Nummern
    // (R18-A1: Wer nach der letzten festen Einheit einging, zählt hinter der höchsten festen Nummer weiter).
    expect(new Set(nr).size).toBe(3);
    expect(nr.filter((n) => n === 2)).toHaveLength(1);
  });
});
