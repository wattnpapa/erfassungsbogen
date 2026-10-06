/**
 * Der Abgleich vom Papier lässt sich von außen öffnen: Der Bericht von
 * „Bögen einlesen…“ trägt den Knopf, damit er nach dem Einlesen im Bild steht
 * (Audit Runde 4, R4-A6).
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrganisationsTyp, PersonalErfassung, SCHEMA_VERSION, type Erfassungsbogen } from "@bos/eeb-format/model";
import { EinsatzArt, einsaetzeLaden, einsatzAnlegen, speicherhuelleSetzen } from "@bos/meldekopf/einsaetze";
import { meldungAufnehmen, vomPapierMarkieren } from "./eintrag-zeiten";
import { PapierAbgleich } from "./papier-abgleich-ui";

class MemStorage {
  private m = new Map<string, string>();
  get length() { return this.m.size; }
  clear() { this.m.clear(); }
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
}

const proto = HTMLElement.prototype as unknown as { scrollIntoView?: (opt?: unknown) => void };
const vorherScroll = proto.scrollIntoView;

beforeEach(() => {
  const mem = new MemStorage();
  (globalThis as { localStorage?: Storage }).localStorage = mem as unknown as Storage;
  speicherhuelleSetzen(mem as unknown as Storage);
});
afterEach(() => {
  if (vorherScroll === undefined) delete proto.scrollIntoView;
  else proto.scrollIntoView = vorherScroll;
});

function bogen(ort: string): Erfassungsbogen {
  return {
    schemaVersion: SCHEMA_VERSION,
    stand: 100,
    einheit: { organisation: OrganisationsTyp.THW, einheitsTyp: { code: 1 }, hierarchie: [{ bezeichnung: { code: 1 }, name: ort }] },
    einsatz: { zeitraumVon: 100, zeitraumBis: 130, ortAuftrag: "Lage" },
    personalErfassung: PersonalErfassung.NUR_STAERKE,
    staerkeManuell: { fuehrer: 1, unterfuehrer: 0, mannschaft: 3, gesamt: 4 },
    personal: [],
    fahrzeuge: [],
  };
}

describe("PapierAbgleich von außen öffnen (R4-A6)", () => {
  it("ein hochgezählter Anstoß öffnet die Liste und holt sie ins Bild; ohne Anstoß bleibt die Karte zu", () => {
    const gerufen: unknown[] = [];
    proto.scrollIntoView = function (opt?: unknown) { gerufen.push(opt); };
    const s = einsatzAnlegen("Hochwasser", EinsatzArt.EINSATZ);
    const ids = ["Ansbach", "Ulm"].map((n) => meldungAufnehmen(s.id, bogen(n), { quelle: "scan" })!.eintrag.id);
    vomPapierMarkieren(s.id, ids, 999);
    const eintraege = einsaetzeLaden().find((x) => x.id === s.id)!.eintraege;
    const props = { einsatzId: s.id, eintraege, zuege: [], onGeaendert: () => {} };
    const { rerender } = render(<PapierAbgleich {...props} anstoss={0} />);
    // Zu: nur der Knopf der Karte, keine Liste.
    expect(screen.queryByRole("heading", { name: /Lage vom Papier abgleichen \(2\)/ })).toBeNull();
    expect(screen.getByRole("button", { name: "Lage vom Papier abgleichen…" })).toBeTruthy();
    rerender(<PapierAbgleich {...props} anstoss={0} />);
    expect(screen.queryByRole("heading", { name: /Lage vom Papier abgleichen \(2\)/ })).toBeNull();
    rerender(<PapierAbgleich {...props} anstoss={1} />);
    expect(screen.getByRole("heading", { name: /Lage vom Papier abgleichen \(2\)/ })).toBeTruthy();
    expect(gerufen).toEqual([{ block: "start" }]);
  });
});
