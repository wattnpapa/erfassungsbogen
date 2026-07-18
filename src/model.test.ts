import { describe, it, expect } from "vitest";
import {
  Ernaehrung,
  Geschlecht,
  KontaktArt,
  PersonalErfassung,
  StaerkeRolle,
  SCHEMA_VERSION,
  ansprechpartner,
  datumAusIso,
  datumZuIso,
  staerke,
  unterbringungMWD,
  verpflegung,
  zeitpunktAusIso,
  zeitpunktZuIso,
  type Person,
} from "./model";

// Kompakter Personen-Builder für die Ableitungs-Tests.
function person(p: Partial<Person> = {}): Person {
  return {
    vorname: "V",
    nachname: "N",
    staerkeRolle: StaerkeRolle.MANNSCHAFT,
    funktionen: [],
    fahrerlaubnis: 0,
    geschlecht: Geschlecht.M,
    ernaehrung: Ernaehrung.FLEISCH,
    kontakte: [],
    zusatzqualifikationen: [],
    ...p,
  };
}

describe("EebDatum (Tageszähler seit 2020-01-01)", () => {
  it("Epoche ist Tag 0", () => {
    expect(datumAusIso("2020-01-01")).toBe(0);
  });

  it("ist ein Roundtrip über ISO", () => {
    for (const iso of ["2020-01-01", "2025-05-14", "2026-12-31", "2199-06-15"]) {
      expect(datumZuIso(datumAusIso(iso))).toBe(iso);
    }
  });

  it("ist zeitzonenunabhängig (kein Off-by-one über Tagesgrenzen)", () => {
    // Tageszähler statt Unix-Timestamp genau deshalb: keine DST-/UTC-Verschiebung.
    expect(datumZuIso(datumAusIso("2025-03-30"))).toBe("2025-03-30"); // DST-Umstellung DE
    expect(datumZuIso(datumAusIso("2025-10-26"))).toBe("2025-10-26");
  });

  it("passt für realistische Einsatzdaten in uint16", () => {
    // uint16 fasst ~179 Jahre ab 2020 (Grenze Mitte 2199); jedes plausible
    // Einsatzdatum liegt weit darunter.
    expect(datumAusIso("2099-12-31")).toBeLessThan(65536);
  });
});

describe("EebZeitpunkt (Minutenzähler seit 2020-01-01 00:00)", () => {
  it("Epoche ist Minute 0", () => {
    expect(zeitpunktAusIso("2020-01-01T00:00")).toBe(0);
  });

  it("ist ein Roundtrip über ISO (Minutengenauigkeit)", () => {
    for (const iso of ["2020-01-01T00:00", "2025-05-14T08:30", "2026-12-31T23:59"]) {
      expect(zeitpunktZuIso(zeitpunktAusIso(iso))).toBe(iso);
    }
  });

  it("behandelt fehlende Uhrzeit als 00:00", () => {
    expect(zeitpunktAusIso("2025-05-14")).toBe(zeitpunktAusIso("2025-05-14T00:00"));
  });
});

describe("staerke()", () => {
  it("leitet Führer/Unterführer/Mannschaft aus dem Personal ab", () => {
    const s = staerke({
      personal: [
        person({ staerkeRolle: StaerkeRolle.FUEHRER }),
        person({ staerkeRolle: StaerkeRolle.UNTERFUEHRER }),
        person({ staerkeRolle: StaerkeRolle.UNTERFUEHRER }),
        person({ staerkeRolle: StaerkeRolle.MANNSCHAFT }),
        person({ staerkeRolle: StaerkeRolle.MANNSCHAFT }),
      ],
    });
    expect(s).toEqual({ fuehrer: 1, unterfuehrer: 2, mannschaft: 2, gesamt: 5 });
  });

  it("bevorzugt die manuelle Stärke (Meldekopf-Modus) vor der Ableitung", () => {
    const manuell = { fuehrer: 1, unterfuehrer: 3, mannschaft: 17, gesamt: 21 };
    const s = staerke({ personal: [person(), person()], staerkeManuell: manuell });
    expect(s).toBe(manuell);
  });

  it("ist bei leerem Personal komplett 0", () => {
    expect(staerke({ personal: [] })).toEqual({ fuehrer: 0, unterfuehrer: 0, mannschaft: 0, gesamt: 0 });
  });
});

describe("unterbringungMWD()", () => {
  it("zählt Geschlechter aus dem Personal", () => {
    const mwd = unterbringungMWD({
      personal: [
        person({ geschlecht: Geschlecht.M }),
        person({ geschlecht: Geschlecht.W }),
        person({ geschlecht: Geschlecht.W }),
        person({ geschlecht: Geschlecht.D }),
      ],
    });
    expect(mwd).toEqual({ m: 1, w: 2, d: 1 });
  });

  it("bevorzugt die manuelle Angabe", () => {
    const manuell = { m: 10, w: 5, d: 1 };
    expect(unterbringungMWD({ personal: [person()], unterbringungManuell: manuell })).toBe(manuell);
  });
});

describe("verpflegung()", () => {
  it("leitet vegetarisch/vegan/fleisch aus dem Personal ab", () => {
    const vp = verpflegung({
      personal: [
        person({ ernaehrung: Ernaehrung.FLEISCH }),
        person({ ernaehrung: Ernaehrung.VEGETARISCH }),
        person({ ernaehrung: Ernaehrung.VEGAN }),
        person({ ernaehrung: Ernaehrung.VEGAN }),
      ],
    });
    expect(vp).toEqual({ gesamt: 4, fleisch: 1, vegetarisch: 1, vegan: 2 });
  });

  it("nutzt im Meldekopf-Modus die manuelle Angabe samt manueller Gesamtstärke", () => {
    const vp = verpflegung({
      personal: [],
      staerkeManuell: { fuehrer: 0, unterfuehrer: 0, mannschaft: 20, gesamt: 20 },
      verpflegungManuell: { vegetarisch: 3, vegan: 1 },
    });
    expect(vp).toEqual({ gesamt: 20, fleisch: 16, vegetarisch: 3, vegan: 1 });
  });

  it("lässt Fleisch nicht negativ werden, wenn manuelle Zahlen die Stärke übersteigen", () => {
    const vp = verpflegung({
      personal: [],
      staerkeManuell: { fuehrer: 0, unterfuehrer: 0, mannschaft: 2, gesamt: 2 },
      verpflegungManuell: { vegetarisch: 3, vegan: 1 },
    });
    expect(vp.fleisch).toBe(0);
  });
});

describe("ansprechpartner()", () => {
  it("nimmt die erste Führungskraft mit Kontakt", () => {
    const chef = person({
      nachname: "Chef",
      staerkeRolle: StaerkeRolle.FUEHRER,
      kontakte: [{ art: KontaktArt.MOBIL, dienstlich: false, wert: "0170" }],
    });
    const p = ansprechpartner([
      person({ staerkeRolle: StaerkeRolle.FUEHRER }), // ohne Kontakt
      chef,
      person({ staerkeRolle: StaerkeRolle.UNTERFUEHRER, kontakte: [{ art: KontaktArt.MOBIL, dienstlich: false, wert: "0171" }] }),
    ]);
    expect(p).toBe(chef);
  });

  it("fällt auf Unterführer, dann auf beliebige Person mit Kontakt zurück", () => {
    const uf = person({
      nachname: "UF",
      staerkeRolle: StaerkeRolle.UNTERFUEHRER,
      kontakte: [{ art: KontaktArt.MOBIL, dienstlich: false, wert: "0171" }],
    });
    expect(ansprechpartner([person(), uf])).toBe(uf);

    const m = person({ nachname: "M", kontakte: [{ art: KontaktArt.MOBIL, dienstlich: false, wert: "0172" }] });
    expect(ansprechpartner([person(), m])).toBe(m);
  });

  it("liefert undefined, wenn niemand einen Kontakt hat", () => {
    expect(ansprechpartner([person(), person()])).toBeUndefined();
  });
});

describe("Konstanten", () => {
  it("SCHEMA_VERSION ist die aktuelle Version 4", () => {
    expect(SCHEMA_VERSION).toBe(4);
    // Sanity: der Meldekopf-Modus ist als eigener Enum-Wert vorhanden.
    expect(PersonalErfassung.NUR_STAERKE).toBe(1);
  });
});
