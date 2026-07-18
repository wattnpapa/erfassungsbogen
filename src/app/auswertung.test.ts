import { describe, it, expect } from "vitest";
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
import { MeldeStatus, einheitSchluessel, bogenInhaltsId, type MeldeEintrag } from "./einsaetze";
import { aggregiere, aggregiereNachZug, aktuelleMeldungen } from "./auswertung";

function person(rolle: StaerkeRolle, geschlecht = Geschlecht.M, ernaehrung = Ernaehrung.FLEISCH): Person {
  return {
    vorname: "T",
    nachname: "X",
    staerkeRolle: rolle,
    funktionen: [],
    fahrerlaubnis: Fahrerlaubnis.NONE,
    geschlecht,
    ernaehrung,
    kontakte: [],
    zusatzqualifikationen: [],
  };
}

function bogen(name: string, over: Partial<Erfassungsbogen> = {}): Erfassungsbogen {
  return {
    schemaVersion: SCHEMA_VERSION,
    stand: 100,
    einheit: { organisation: OrganisationsTyp.THW, einheitsTyp: { code: 1 }, name, hierarchie: [] },
    einsatz: { zeitraumVon: 100, zeitraumBis: 130, ortAuftrag: "Lage" },
    personalErfassung: PersonalErfassung.VOLLSTAENDIG,
    personal: [
      person(StaerkeRolle.FUEHRER),
      person(StaerkeRolle.MANNSCHAFT, Geschlecht.W, Ernaehrung.VEGETARISCH),
      person(StaerkeRolle.MANNSCHAFT, Geschlecht.M, Ernaehrung.VEGAN),
    ],
    fahrzeuge: [{ typ: { code: 2 }, kennzeichen: "THW-00001" }],
    sofortbedarf: { verpflegungPersonen: 3, dieselLiter: 40, benzinLiter: 5, gemischLiter: 0, unterbringung: true, ruhezeitErforderlich: false },
    ...over,
  };
}

function meldung(b: Erfassungsbogen, over: Partial<MeldeEintrag> = {}): MeldeEintrag {
  return {
    id: bogenInhaltsId(b),
    einheitSchluessel: einheitSchluessel(b.einheit),
    empfangenAm: 1000,
    quelle: "scan",
    status: MeldeStatus.ANWESEND,
    bogen: b,
    ...over,
  };
}

describe("aggregiere()", () => {
  it("summiert Stärke, Verpflegung, Unterbringung, Kraftstoff und Fahrzeuge", () => {
    const s = aggregiere([meldung(bogen("A")), meldung(bogen("B"))]);
    expect(s.einheiten).toBe(2);
    expect(s.staerke).toEqual({ fuehrer: 2, unterfuehrer: 0, mannschaft: 4, gesamt: 6 });
    expect(s.verpflegung).toEqual({ gesamt: 6, fleisch: 2, vegetarisch: 2, vegan: 2 });
    expect(s.unterbringung).toEqual({ m: 4, w: 2, d: 0 });
    expect(s.unterbringungBenoetigt).toBe(2);
    expect(s.kraftstoff).toEqual({ dieselLiter: 80, benzinLiter: 10, gemischLiter: 0 });
    expect(s.fahrzeuge).toBe(2);
  });

  it("ignoriert abgerückte Einheiten", () => {
    const s = aggregiere([
      meldung(bogen("A")),
      meldung(bogen("B"), { status: MeldeStatus.ABGERUECKT }),
    ]);
    expect(s.einheiten).toBe(1);
    expect(s.staerke.gesamt).toBe(3);
  });

  it("zählt je Einheit nur die neueste Revision", () => {
    const alt = bogen("A", { stand: 100 });
    const neu = bogen("A", { stand: 105, personal: [person(StaerkeRolle.FUEHRER)] }); // nur 1 Person
    const s = aggregiere([meldung(alt), meldung(neu)]);
    expect(s.einheiten).toBe(1);
    expect(s.staerke.gesamt).toBe(1); // die neue Fassung zählt
  });

  it("berücksichtigt Meldekopf-Schnellerfassung (staerkeManuell)", () => {
    const nurStaerke = bogen("Fremd", {
      personalErfassung: PersonalErfassung.NUR_STAERKE,
      personal: [],
      staerkeManuell: { fuehrer: 1, unterfuehrer: 2, mannschaft: 17, gesamt: 20 },
      sofortbedarf: undefined,
    });
    const s = aggregiere([meldung(nurStaerke)]);
    expect(s.staerke.gesamt).toBe(20);
  });

  it("liefert für eine leere Sammlung Nullsummen", () => {
    const s = aggregiere([]);
    expect(s.einheiten).toBe(0);
    expect(s.staerke.gesamt).toBe(0);
    expect(s.kraftstoff.dieselLiter).toBe(0);
  });
});

describe("aggregiereNachZug()", () => {
  it("bildet Zwischensummen je Etikett, ohne Etikett zuletzt", () => {
    const gruppen = aggregiereNachZug([
      meldung(bogen("A"), { zugEtikett: "1. Bergungszug" }),
      meldung(bogen("B"), { zugEtikett: "1. Bergungszug" }),
      meldung(bogen("C")), // ohne Etikett
    ]);
    expect(gruppen.map((g) => g.zugEtikett)).toEqual(["1. Bergungszug", undefined]);
    expect(gruppen[0]!.summen.einheiten).toBe(2);
    expect(gruppen[1]!.summen.einheiten).toBe(1);
  });
});

describe("aktuelleMeldungen()", () => {
  it("liefert neueste Revision je Einheit, nur anwesende", () => {
    const m = aktuelleMeldungen([
      meldung(bogen("A", { stand: 100 })),
      meldung(bogen("A", { stand: 101 })),
      meldung(bogen("B"), { status: MeldeStatus.ABGERUECKT }),
    ]);
    expect(m).toHaveLength(1);
    expect(m[0]!.bogen.stand).toBe(101);
  });
});
