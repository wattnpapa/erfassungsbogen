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
import { aufteilungFehler, teileBogen, type AufteilungsWahl } from "./aufteilen";

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

const wahl = (over: Partial<AufteilungsWahl> = {}): AufteilungsWahl => ({
  teilEtikett: "Fachberater",
  personal: [],
  fahrzeuge: [],
  ...over,
});

describe("aufteilungFehler()", () => {
  it("verlangt eine Bezeichnung für den abgeteilten Teil", () => {
    const f = aufteilungFehler(bogen(), wahl({ teilEtikett: "  ", personal: [0] }));
    expect(f).toMatch(/Bezeichnung/);
  });

  it("verlangt, dass überhaupt etwas mitgeht", () => {
    expect(aufteilungFehler(bogen(), wahl())).toMatch(/niemand und nichts/);
  });

  it("verhindert, dass alles mitgeht (das wäre eine Umbenennung, keine Aufteilung)", () => {
    const f = aufteilungFehler(bogen(), wahl({ personal: [0, 1, 2, 3], fahrzeuge: [0, 1] }));
    expect(f).toMatch(/Rest bliebe nichts/);
  });

  it("lässt ein Fahrzeug ohne Personal ziehen (Fahrzeug fährt in die Werkstatt)", () => {
    expect(aufteilungFehler(bogen(), wahl({ fahrzeuge: [0] }))).toBeNull();
  });

  it("weist bei NUR_STAERKE mehr Personen ab, als gemeldet sind", () => {
    const b = bogen({
      personalErfassung: PersonalErfassung.NUR_STAERKE,
      personal: [],
      staerkeManuell: { fuehrer: 1, unterfuehrer: 2, mannschaft: 9, gesamt: 12 },
    });
    const f = aufteilungFehler(b, wahl({ staerke: { fuehrer: 0, unterfuehrer: 3, mannschaft: 0 } }));
    expect(f).toMatch(/nicht gemeldet/);
  });
});

describe("teileBogen() — vollständig erfasstes Personal", () => {
  it("verteilt Personal und Fahrzeuge und rechnet die Stärke beider Hälften neu", () => {
    const b = bogen();
    const { rest, abgeteilt } = teileBogen(b, wahl({ personal: [0, 2], fahrzeuge: [1] }), 2000);

    expect(abgeteilt.personal.map((p) => p.nachname)).toEqual(["Berger", "Cordes"]);
    expect(rest.personal.map((p) => p.nachname)).toEqual(["Ahlers", "Dierks"]);
    expect(abgeteilt.fahrzeuge.map((f) => f.kennzeichen)).toEqual(["THW-2"]);
    expect(rest.fahrzeuge.map((f) => f.kennzeichen)).toEqual(["THW-1"]);

    // Stärke ist abgeleitet — sie muss sich in der Summe erhalten.
    expect(staerke(abgeteilt)).toEqual({ fuehrer: 1, unterfuehrer: 0, mannschaft: 1, gesamt: 2 });
    expect(staerke(rest)).toEqual({ fuehrer: 0, unterfuehrer: 1, mannschaft: 1, gesamt: 2 });
    // Unterbringung zieht mit den Personen um (Cordes ist W).
    expect(unterbringungMWD(abgeteilt)).toEqual({ m: 1, w: 1, d: 0 });
    expect(unterbringungMWD(rest)).toEqual({ m: 2, w: 0, d: 0 });
  });

  it("setzt beiden Hälften denselben neuen Stand und lässt Einheit und Auftrag unberührt", () => {
    const b = bogen();
    const { rest, abgeteilt } = teileBogen(b, wahl({ personal: [0] }), 2000);
    expect(rest.stand).toBe(2000);
    expect(abgeteilt.stand).toBe(2000);
    expect(abgeteilt.einheit).toEqual(b.einheit);
    expect(abgeteilt.einsatz).toEqual(b.einsatz);
  });

  it("nimmt das Übungs-Kennzeichen in beide Hälften mit", () => {
    const { rest, abgeteilt } = teileBogen(bogen({ uebung: true }), wahl({ personal: [0] }), 2000);
    expect(rest.uebung).toBe(true);
    expect(abgeteilt.uebung).toBe(true);
  });

  it("wirft bei einer Auswahl, die nicht aufgeht", () => {
    expect(() => teileBogen(bogen(), wahl(), 2000)).toThrow(/niemand und nichts/);
  });
});

describe("teileBogen() — Sofortbedarf", () => {
  const sofort = {
    verpflegungPersonen: 4,
    dieselLiter: 200,
    benzinLiter: 20,
    gemischLiter: 5,
    unterbringung: true,
    ruhezeitErforderlich: false,
  };

  it("lässt Kraftstoff beim Rest und zieht die Verpflegung mit der Stärke um", () => {
    const { rest, abgeteilt } = teileBogen(bogen({ sofortbedarf: sofort }), wahl({ personal: [0] }), 2000);
    expect(abgeteilt.sofortbedarf).toEqual({
      verpflegungPersonen: 1,
      dieselLiter: 0,
      benzinLiter: 0,
      gemischLiter: 0,
      unterbringung: true,
      ruhezeitErforderlich: false,
    });
    expect(rest.sofortbedarf).toEqual({ ...sofort, verpflegungPersonen: 3 });
  });

  it("deckelt die Verpflegung auf das, was gemeldet war", () => {
    const b = bogen({ sofortbedarf: { ...sofort, verpflegungPersonen: 1 } });
    const { rest, abgeteilt } = teileBogen(b, wahl({ personal: [0, 1, 2] }), 2000);
    expect(abgeteilt.sofortbedarf!.verpflegungPersonen).toBe(1);
    expect(rest.sofortbedarf!.verpflegungPersonen).toBe(0);
  });

  it("erfindet keinen Sofortbedarf, wo keiner gemeldet war", () => {
    const { rest, abgeteilt } = teileBogen(bogen(), wahl({ personal: [0] }), 2000);
    expect(rest.sofortbedarf).toBeUndefined();
    expect(abgeteilt.sofortbedarf).toBeUndefined();
  });
});

describe("teileBogen() — Meldekopf-Modus (nur Stärke)", () => {
  function nurStaerke(over: Partial<Erfassungsbogen> = {}) {
    return bogen({
      personalErfassung: PersonalErfassung.NUR_STAERKE,
      personal: [person("Berger", StaerkeRolle.FUEHRER)],
      staerkeManuell: { fuehrer: 1, unterfuehrer: 2, mannschaft: 9, gesamt: 12 },
      ...over,
    });
  }

  it("gibt dem abgeteilten Teil die eingegebenen Zahlen und dem Rest die Differenz", () => {
    const { rest, abgeteilt } = teileBogen(
      nurStaerke(),
      wahl({ staerke: { fuehrer: 0, unterfuehrer: 1, mannschaft: 3 } }),
      2000,
    );
    expect(staerke(abgeteilt)).toEqual({ fuehrer: 0, unterfuehrer: 1, mannschaft: 3, gesamt: 4 });
    expect(staerke(rest)).toEqual({ fuehrer: 1, unterfuehrer: 1, mannschaft: 6, gesamt: 8 });
  });

  it("verteilt Unterbringung und Verpflegung, wenn der Ursprung Zahlen dazu trägt", () => {
    const b = nurStaerke({
      unterbringungManuell: { m: 8, w: 4, d: 0 },
      verpflegungManuell: { vegetarisch: 3, vegan: 1 },
    });
    const { rest, abgeteilt } = teileBogen(
      b,
      wahl({
        staerke: { fuehrer: 0, unterfuehrer: 1, mannschaft: 3 },
        unterbringung: { m: 2, w: 2, d: 0 },
        verpflegung: { vegetarisch: 1, vegan: 1 },
      }),
      2000,
    );
    expect(unterbringungMWD(abgeteilt)).toEqual({ m: 2, w: 2, d: 0 });
    expect(unterbringungMWD(rest)).toEqual({ m: 6, w: 2, d: 0 });
    expect(verpflegung(abgeteilt)).toMatchObject({ gesamt: 4, vegetarisch: 1, vegan: 1 });
    expect(verpflegung(rest)).toMatchObject({ gesamt: 8, vegetarisch: 2, vegan: 0 });
  });

  it("nimmt gewählte Ansprechpartner:innen mit", () => {
    const { rest, abgeteilt } = teileBogen(
      nurStaerke(),
      wahl({ personal: [0], staerke: { fuehrer: 1, unterfuehrer: 0, mannschaft: 0 } }),
      2000,
    );
    expect(abgeteilt.personal.map((p) => p.nachname)).toEqual(["Berger"]);
    expect(rest.personal).toEqual([]);
    // Die Zahlen bleiben maßgeblich, nicht die Zahl der Ansprechpartner.
    expect(staerke(rest).gesamt).toBe(11);
  });
});
