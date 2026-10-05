/**
 * Lage vom Papier abgleichen (Audit Runde 3, R3-A2).
 */

import { describe, it, expect, beforeEach } from "vitest";
import { OrganisationsTyp, PersonalErfassung, SCHEMA_VERSION, type Erfassungsbogen } from "@bos/eeb-format/model";
import { EinsatzArt, MeldeStatus, einsaetzeLaden, einsatzAnlegen, speicherhuelleSetzen } from "@bos/meldekopf/einsaetze";
import { aggregiere } from "./auswertung";
import { eintreffzeitSetzen, meldungAufnehmen, papierAbgleichUebernehmen, vomPapierMarkieren } from "./eintrag-zeiten";
import { offenVomPapier } from "./papier-abgleich-ui";

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

describe("vomPapierMarkieren / papierAbgleichUebernehmen", () => {
  it("markiert nur neue Einheiten und übernimmt Zeiten, Status und Zug in einem Schritt", () => {
    const s = einsatzAnlegen("Hochwasser", EinsatzArt.EINSATZ);
    const alt = meldungAufnehmen(s.id, bogen("Ulm"), { quelle: "scan" })!;
    const ids = [
      meldungAufnehmen(s.id, bogen("Ansbach", 17), { quelle: "scan" })!.eintrag.id,
      meldungAufnehmen(s.id, bogen("Kirchehrenbach", 7), { quelle: "scan" })!.eintrag.id,
      // Folgemeldung einer bekannten Einheit: erbt, braucht keinen Abgleich.
      meldungAufnehmen(s.id, bogen("Ulm", 5, 110), { quelle: "scan" })!.eintrag.id,
    ];
    vomPapierMarkieren(s.id, ids, 999);
    const offen = offenVomPapier(sammlung(s.id).eintraege);
    expect(offen.map((e) => e.bogen.einheit.hierarchie[0]!.name).sort()).toEqual(["Ansbach", "Kirchehrenbach"]);
    expect(sammlung(s.id).eintraege.find((e) => e.id === alt.eintrag.id)!.vomPapier).toBeUndefined();

    const vorher = aggregiere(sammlung(s.id).eintraege, EinsatzArt.EINSATZ);
    expect(vorher.staerke.gesamt).toBe(6 + 18 + 8);
    papierAbgleichUebernehmen(s.id, [
      { eintragId: ids[0]!, eingetroffenAm: 1000, status: MeldeStatus.ABGERUECKT, abgerueckAm: 5000, zug: "1. TZ" },
      { eintragId: ids[1]!, eingetroffenAm: 2000, status: MeldeStatus.ANWESEND, zug: "2. TZ" },
    ]);
    const e = sammlung(s.id).eintraege;
    expect(offenVomPapier(e)).toEqual([]);
    const ansbach = e.find((x) => x.id === ids[0])!;
    expect(ansbach).toMatchObject({ eingetroffenAm: 1000, status: MeldeStatus.ABGERUECKT, abgerueckAm: 5000, zugEtikett: "1. TZ" });
    expect(ansbach.vermerke!.map((v) => v.text)).toEqual(expect.arrayContaining(["Abgerückt", "Zug: 1. TZ"]));
    expect(e.find((x) => x.id === ids[1])!).toMatchObject({ eingetroffenAm: 2000, zugEtikett: "2. TZ" });
    expect(aggregiere(e, EinsatzArt.EINSATZ).staerke.gesamt).toBe(6 + 8);
  });

  it("nimmt die Marke weg, wenn die Eintreffzeit an der Karte korrigiert wird", () => {
    const s = einsatzAnlegen("Hochwasser", EinsatzArt.EINSATZ);
    const r = meldungAufnehmen(s.id, bogen("Ansbach"), { quelle: "scan" })!;
    vomPapierMarkieren(s.id, [r.eintrag.id]);
    expect(offenVomPapier(sammlung(s.id).eintraege)).toHaveLength(1);
    eintreffzeitSetzen(s.id, r.eintrag.id, 1234);
    expect(offenVomPapier(sammlung(s.id).eintraege)).toHaveLength(0);
  });
});
