/**
 * Stärkeänderung vom Papier für eine schon gemeldete Einheit (Audit Runde 3, R3-A1).
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  Ernaehrung,
  Geschlecht,
  OrganisationsTyp,
  PersonalErfassung,
  SCHEMA_VERSION,
  staerke,
  type Erfassungsbogen,
} from "@bos/eeb-format/model";
import { EinsatzArt, einsaetzeLaden, einsatzAnlegen, neuesteJeEinheit, speicherhuelleSetzen } from "@bos/meldekopf/einsaetze";
import { aggregiere, summiereBoegen } from "./auswertung";
import { neuePerson } from "./hilfen";
import { meldungAufnehmen, notizSetzen } from "./eintrag-zeiten";
import { istNurStaerke, nurStaerkeUebernehmen, wasWegfiele } from "./nur-staerke";

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

function volleMeldung(): Erfassungsbogen {
  return {
    schemaVersion: SCHEMA_VERSION,
    stand: 100,
    einheit: { organisation: OrganisationsTyp.THW, einheitsTyp: { code: 4 }, hierarchie: [{ bezeichnung: { code: 1 }, name: "Kirchehrenbach" }] },
    einsatz: { zeitraumVon: 100, zeitraumBis: 130, ortAuftrag: "Lage" },
    personalErfassung: PersonalErfassung.NUR_STAERKE,
    staerkeManuell: { fuehrer: 0, unterfuehrer: 2, mannschaft: 7, gesamt: 9 },
    verpflegungManuell: { vegetarisch: 5, vegan: 0 },
    personal: [],
    fahrzeuge: [{ typ: { code: 1 } }, { typ: { code: 2 } }],
    sofortbedarf: { verpflegungPersonen: 9, dieselLiter: 60, benzinLiter: 0, gemischLiter: 5, unterbringung: false, ruhezeitErforderlich: true },
  };
}

function zettel(): Erfassungsbogen {
  return {
    schemaVersion: SCHEMA_VERSION,
    stand: 200,
    einheit: { organisation: OrganisationsTyp.THW, einheitsTyp: { code: 4 }, hierarchie: [{ bezeichnung: { code: 1 }, name: "OV Kirchehrenbach" }] },
    einsatz: { zeitraumVon: 100, zeitraumBis: 130, ortAuftrag: "" },
    personalErfassung: PersonalErfassung.NUR_STAERKE,
    staerkeManuell: { fuehrer: 0, unterfuehrer: 2, mannschaft: 6, gesamt: 8 },
    personal: [],
    fahrzeuge: [],
  };
}

describe("istNurStaerke / wasWegfiele", () => {
  it("erkennt die Schnellerfassung und nennt, was beim Ersetzen wegfiele", () => {
    expect(istNurStaerke(zettel())).toBe(true);
    expect(istNurStaerke(volleMeldung())).toBe(false);
    expect(wasWegfiele(volleMeldung(), zettel())).toEqual([
      "2 Fahrzeuge",
      "Diesel 60 l",
      "Gemisch 5 l",
      "Ruhezeit",
      "Verpflegungsaufteilung",
    ]);
  });
});

describe("nurStaerkeUebernehmen", () => {
  it("ändert nur die Stärke: Fahrzeuge, Kraftstoff, Ruhezeit, Verpflegung und Schreibweise bleiben", () => {
    const s = einsatzAnlegen("Hochwasser Neckar", EinsatzArt.EINSATZ);
    const r = meldungAufnehmen(s.id, volleMeldung(), { quelle: "scan" })!;
    notizSetzen(s.id, r.eintrag.id, "Deich Nord");
    const vorher = aggregiere(einsaetzeLaden()[0]!.eintraege, EinsatzArt.EINSATZ);

    const neu = nurStaerkeUebernehmen(volleMeldung(), staerke(zettel()), zettel().stand);
    expect(neu.stand).toBe(200);
    expect(neu.einheit.hierarchie[0]!.name).toBe("Kirchehrenbach");
    expect(neu.sofortbedarf!.verpflegungPersonen).toBe(8); // folgte der Gesamtstärke
    meldungAufnehmen(s.id, neu, { quelle: "manuell", einheitSchluesselOverride: r.eintrag.einheitSchluessel });

    const eintraege = einsaetzeLaden()[0]!.eintraege;
    const nachher = aggregiere(eintraege, EinsatzArt.EINSATZ);
    expect(nachher.staerke.gesamt).toBe(8);
    expect(nachher.fahrzeuge).toBe(vorher.fahrzeuge);
    expect(nachher.kraftstoff).toEqual(vorher.kraftstoff);
    expect(nachher.ruhezeitErforderlich).toBe(vorher.ruhezeitErforderlich);
    expect(nachher.verpflegung.vegetarisch).toBe(vorher.verpflegung.vegetarisch);
    // Eine Einheit, Auftrag geerbt, alte Fassung in der Historie.
    const koepfe = neuesteJeEinheit(eintraege);
    expect(koepfe).toHaveLength(1);
    expect(koepfe[0]!.notiz).toBe("Deich Nord");
    expect(eintraege).toHaveLength(2);
  });
});

describe("nurStaerkeUebernehmen — namentliche Meldung", () => {
  it("hält vegetarische Portionen und M/W/D fest, der Überhang geht von der größten Gruppe ab", () => {
    const person = (g: Geschlecht, e: Ernaehrung) => ({ ...neuePerson(), vorname: "A", nachname: "B", geschlecht: g, ernaehrung: e });
    const vorher: Erfassungsbogen = {
      ...volleMeldung(),
      personalErfassung: PersonalErfassung.VOLLSTAENDIG,
      staerkeManuell: undefined,
      verpflegungManuell: undefined,
      personal: [
        ...Array.from({ length: 6 }, () => person(Geschlecht.M, Ernaehrung.FLEISCH)),
        ...Array.from({ length: 3 }, () => person(Geschlecht.W, Ernaehrung.VEGETARISCH)),
      ],
    };
    const lageVorher = summiereBoegen([vorher]);
    const neu = nurStaerkeUebernehmen(vorher, { fuehrer: 0, unterfuehrer: 0, mannschaft: 8, gesamt: 8 });
    const lage = summiereBoegen([neu]);
    expect(lage.staerke.gesamt).toBe(8);
    expect(lage.verpflegung.vegetarisch).toBe(lageVorher.verpflegung.vegetarisch);
    expect(lage.unterbringung).toEqual({ m: 5, w: 3, d: 0 });
    expect(lage.unterbringungOhneAngabe).toBe(0);
    expect(neu.personal).toHaveLength(9); // Namen bleiben sichtbar
  });
});
