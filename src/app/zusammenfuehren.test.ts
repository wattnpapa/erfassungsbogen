import { describe, it, expect } from "vitest";
import {
  Ernaehrung,
  Fahrerlaubnis,
  Geschlecht,
  OrganisationsTyp,
  PersonalErfassung,
  SCHEMA_VERSION,
  StaerkeRolle,
  staerke,
  unterbringungMWD,
  verpflegung,
  type Erfassungsbogen,
  type Person,
} from "../model";
import { teileBogen } from "./aufteilen";
import { fuegeZusammen, zusammenfuehrungFehler } from "./zusammenfuehren";

function person(nachname: string, rolle: StaerkeRolle, geschlecht = Geschlecht.M): Person {
  return {
    vorname: "T",
    nachname,
    staerkeRolle: rolle,
    funktionen: [],
    fahrerlaubnis: Fahrerlaubnis.NONE,
    geschlecht,
    ernaehrung: Ernaehrung.FLEISCH,
    kontakte: [],
    zusatzqualifikationen: [],
  };
}

function bogen(over: Partial<Erfassungsbogen> = {}): Erfassungsbogen {
  return {
    schemaVersion: SCHEMA_VERSION,
    stand: 1000,
    einheit: {
      organisation: OrganisationsTyp.THW,
      einheitsTyp: { code: 1 },
      hierarchie: [{ bezeichnung: { code: 1 }, name: "OV Oldenburg" }],
    },
    einsatz: { zeitraumVon: 100, zeitraumBis: 130, ortAuftrag: "Hochwasser" },
    personalErfassung: PersonalErfassung.VOLLSTAENDIG,
    personal: [
      person("Berger", StaerkeRolle.FUEHRER),
      person("Ahlers", StaerkeRolle.UNTERFUEHRER),
      person("Cordes", StaerkeRolle.MANNSCHAFT, Geschlecht.W),
      person("Dierks", StaerkeRolle.MANNSCHAFT),
    ],
    fahrzeuge: [{ typ: { code: 2 }, kennzeichen: "THW-1" }, { typ: { code: 3 }, kennzeichen: "THW-2" }],
    ...over,
  };
}

describe("zusammenfuehrungFehler()", () => {
  it("verlangt mindestens einen Teil", () => {
    expect(zusammenfuehrungFehler(bogen(), [])).toMatch(/mindestens einen Teil/);
  });

  it("weist das Mischen von Übung und Ernstfall ab", () => {
    expect(zusammenfuehrungFehler(bogen(), [bogen({ uebung: true })])).toMatch(/Übungs- und Einsatzmeldungen/);
    expect(zusammenfuehrungFehler(bogen({ uebung: true }), [bogen()])).toMatch(/Übungs- und Einsatzmeldungen/);
  });

  it("lässt zwei Übungsmeldungen zusammen", () => {
    expect(zusammenfuehrungFehler(bogen({ uebung: true }), [bogen({ uebung: true })])).toBeNull();
  });
});

describe("fuegeZusammen()", () => {
  it("führt eine Aufteilung wieder auf den Ausgangsstand zurück", () => {
    // Die eigentliche Zusicherung des Gegenstücks: aufteilen und wieder
    // zusammenführen darf nichts erfinden und nichts verlieren.
    const ganz = bogen();
    const { rest, abgeteilt } = teileBogen(
      ganz,
      { teilEtikett: "Fachberater", personal: [0, 2], fahrzeuge: [1] },
      2000,
    );
    const wieder = fuegeZusammen(rest, [abgeteilt], 3000);

    expect(staerke(wieder)).toEqual(staerke(ganz));
    expect(unterbringungMWD(wieder)).toEqual(unterbringungMWD(ganz));
    expect(wieder.personal.map((p) => p.nachname).sort()).toEqual(
      ganz.personal.map((p) => p.nachname).sort(),
    );
    expect(wieder.fahrzeuge.map((f) => f.kennzeichen).sort()).toEqual(
      ganz.fahrzeuge.map((f) => f.kennzeichen).sort(),
    );
    expect(wieder.stand).toBe(3000);
  });

  it("führt auch mehrere Teile in einem Zug zusammen", () => {
    const a = bogen({ personal: [person("Berger", StaerkeRolle.FUEHRER)], fahrzeuge: [] });
    const b = bogen({ personal: [person("Ahlers", StaerkeRolle.MANNSCHAFT)], fahrzeuge: [] });
    const c = bogen({ personal: [person("Cordes", StaerkeRolle.MANNSCHAFT)], fahrzeuge: [] });
    const wieder = fuegeZusammen(a, [b, c], 3000);
    expect(staerke(wieder)).toEqual({ fuehrer: 1, unterfuehrer: 0, mannschaft: 2, gesamt: 3 });
  });

  it("übernimmt Einheit und Auftrag aus dem Zielbogen", () => {
    const ziel = bogen();
    const anderer = bogen({ einsatz: { zeitraumVon: 9, zeitraumBis: 9, ortAuftrag: "Anderer Auftrag" } });
    const wieder = fuegeZusammen(ziel, [anderer], 3000);
    expect(wieder.einsatz).toEqual(ziel.einsatz);
    expect(wieder.einheit).toEqual(ziel.einheit);
  });

  it("summiert den Sofortbedarf und verknüpft Ja/Nein-Angaben mit ODER", () => {
    const a = bogen({
      sofortbedarf: {
        verpflegungPersonen: 3,
        dieselLiter: 200,
        benzinLiter: 20,
        gemischLiter: 0,
        unterbringung: false,
        ruhezeitErforderlich: false,
      },
    });
    const b = bogen({
      sofortbedarf: {
        verpflegungPersonen: 1,
        dieselLiter: 50,
        benzinLiter: 0,
        gemischLiter: 5,
        unterbringung: true,
        ruhezeitErforderlich: false,
      },
    });
    expect(fuegeZusammen(a, [b], 3000).sofortbedarf).toEqual({
      verpflegungPersonen: 4,
      dieselLiter: 250,
      benzinLiter: 20,
      gemischLiter: 5,
      unterbringung: true,
      ruhezeitErforderlich: false,
    });
  });

  it("erfindet keinen Sofortbedarf, wo keiner gemeldet war", () => {
    expect(fuegeZusammen(bogen(), [bogen()], 3000).sofortbedarf).toBeUndefined();
  });

  it("wirft bei unpassenden Bögen", () => {
    expect(() => fuegeZusammen(bogen(), [], 3000)).toThrow(/mindestens einen Teil/);
  });
});

describe("fuegeZusammen() — gemischte Erfassung", () => {
  const nurStaerke = bogen({
    personalErfassung: PersonalErfassung.NUR_STAERKE,
    personal: [person("Eiler", StaerkeRolle.FUEHRER)],
    staerkeManuell: { fuehrer: 1, unterfuehrer: 1, mannschaft: 6, gesamt: 8 },
    unterbringungManuell: { m: 6, w: 2, d: 0 },
    verpflegungManuell: { vegetarisch: 2, vegan: 1 },
  });

  it("fällt auf Zahlen zurück, sobald ein Teil nur als Stärke gemeldet ist", () => {
    const wieder = fuegeZusammen(bogen(), [nurStaerke], 3000);
    expect(wieder.personalErfassung).toBe(PersonalErfassung.NUR_STAERKE);
    // 1/1/2/4 (Personen) + 1/1/6/8 (Zahlen) — nichts doppelt, nichts verloren.
    expect(staerke(wieder)).toEqual({ fuehrer: 2, unterfuehrer: 2, mannschaft: 8, gesamt: 12 });
    expect(unterbringungMWD(wieder)).toEqual({ m: 9, w: 3, d: 0 });
    expect(verpflegung(wieder)).toMatchObject({ gesamt: 12, vegetarisch: 2, vegan: 1 });
  });

  it("behält die bekannten Namen als Ansprechpartner", () => {
    const wieder = fuegeZusammen(bogen(), [nurStaerke], 3000);
    expect(wieder.personal.map((p) => p.nachname)).toEqual([
      "Berger",
      "Ahlers",
      "Cordes",
      "Dierks",
      "Eiler",
    ]);
  });

  it("leitet bei durchweg vollständiger Erfassung wieder ab statt Zahlen zu führen", () => {
    const wieder = fuegeZusammen(bogen(), [bogen({ personal: [person("Eiler", StaerkeRolle.MANNSCHAFT)] })], 3000);
    expect(wieder.personalErfassung).toBe(PersonalErfassung.VOLLSTAENDIG);
    expect(wieder.staerkeManuell).toBeUndefined();
    expect(wieder.unterbringungManuell).toBeUndefined();
    expect(wieder.verpflegungManuell).toBeUndefined();
  });
});
