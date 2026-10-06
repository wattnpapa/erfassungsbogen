/**
 * Lage vom Papier abgleichen (Audit Runde 3, R3-A2).
 */

import { describe, it, expect, beforeEach } from "vitest";
import { OrganisationsTyp, PersonalErfassung, SCHEMA_VERSION, type Erfassungsbogen } from "@bos/eeb-format/model";
import { EinsatzArt, MeldeStatus, einsaetzeLaden, einsatzAnlegen, speicherhuelleSetzen } from "@bos/meldekopf/einsaetze";
import { aggregiere } from "./auswertung";
import { eintreffzeitSetzen, meldungAufnehmen, papierAbgleichUebernehmen, vomPapierMarkieren } from "./eintrag-zeiten";
import { offenVomPapier } from "./papier-abgleich-ui";
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

describe("Notiz und Nummer vom Blatt (Audit Runde 4, R4-A1, R4-A2)", () => {
  function lage() {
    const s = einsatzAnlegen("Hochwasser", EinsatzArt.EINSATZ);
    // Eingang in Alphabet-fremder Reihenfolge: Crailsheim, Albstadt, Ulm.
    const ids = ["Crailsheim", "Albstadt", "Ulm"].map((n) => meldungAufnehmen(s.id, bogen(n), { quelle: "scan" })!.eintrag);
    vomPapierMarkieren(s.id, ids.map((e) => e.id), 999);
    return { id: s.id, ids: ids.map((e) => e.id) };
  }

  it("übernimmt die Notiz vom Blatt mit Vermerk und lässt eine leere Zeile die Notiz nicht löschen, wenn sie fehlt", () => {
    const { id, ids } = lage();
    papierAbgleichUebernehmen(id, [
      { eintragId: ids[2]!, eingetroffenAm: 1_700_000_000_000, status: MeldeStatus.ANWESEND, zug: "2. TZ", notiz: "Pumpe 2 defekt" },
      { eintragId: ids[1]!, eingetroffenAm: 1_700_000_100_000, status: MeldeStatus.ANWESEND, zug: "" },
    ]);
    const e = sammlung(id).eintraege;
    const ulm = e.find((x) => x.id === ids[2])!;
    expect(ulm.notiz).toBe("Pumpe 2 defekt");
    expect(ulm.vermerke?.some((v) => v.text === "Auftrag/Notiz: Pumpe 2 defekt")).toBe(true);
    expect(e.find((x) => x.id === ids[1])!.notiz).toBeUndefined();
  });

  it("hält die Nummern vom Blatt fest, die übrigen rücken um sie herum", () => {
    const { id, ids } = lage();
    const vorher = meldungsNummern(sammlung(id).eintraege);
    expect([...vorher.values()].sort()).toEqual([1, 2, 3]);
    // Auf dem Blatt war Ulm Nr. 1 und Crailsheim Nr. 3; Albstadt hat keine Nr. eingetragen.
    papierAbgleichUebernehmen(id, [
      { eintragId: ids[2]!, eingetroffenAm: 1, status: MeldeStatus.ANWESEND, zug: "", nummer: 1 },
      { eintragId: ids[0]!, eingetroffenAm: 2, status: MeldeStatus.ANWESEND, zug: "", nummer: 3 },
      { eintragId: ids[1]!, eingetroffenAm: 3, status: MeldeStatus.ANWESEND, zug: "" },
    ]);
    const e = sammlung(id).eintraege;
    const nr = meldungsNummern(e);
    const von = (n: string) => nr.get(e.find((x) => x.bogen.einheit.hierarchie[0]!.name === n)!.einheitSchluessel);
    expect(von("Ulm")).toBe(1);
    expect(von("Crailsheim")).toBe(3);
    expect(von("Albstadt")).toBe(2);
  });

  it("zählt ohne feste Nummern wie bisher und vergibt eine doppelte nur einmal", () => {
    const { id } = lage();
    const e = sammlung(id).eintraege;
    for (const x of e) x.nummer = 2; // alle behaupten Nr. 2
    const nr = [...meldungsNummern(e).values()].sort();
    expect(nr).toEqual([1, 2, 3]);
  });
});
