import { describe, it, expect } from "vitest";

import {
  Fahrerlaubnis,
  Geschlecht,
  Ernaehrung,
  OrganisationsTyp,
  StaerkeRolle,
  zeitpunktAusIso,
  type Fahrzeug,
  type Person,
} from "../model";
import {
  FE_EINGESCHLOSSEN,
  datumDeutsch,
  funkrufText,
  funktionsText,
  kennzeichenText,
  orgLabel,
  vokabSortiert,
  vokabText,
  vokabularFuer,
  zeitgruppe,
} from "./darstellung";

function person(p: Partial<Person> = {}): Person {
  return {
    vorname: "V",
    nachname: "N",
    staerkeRolle: StaerkeRolle.MANNSCHAFT,
    funktionen: [],
    fahrerlaubnis: Fahrerlaubnis.NONE,
    geschlecht: Geschlecht.M,
    ernaehrung: Ernaehrung.FLEISCH,
    kontakte: [],
    zusatzqualifikationen: [],
    ...p,
  };
}

describe("orgLabel()", () => {
  it("liefert das Label bekannter Organisationen", () => {
    expect(orgLabel(OrganisationsTyp.THW)).toBe("THW");
    expect(orgLabel(OrganisationsTyp.SONSTIGE)).toBe("Sonstige");
  });

  it("fällt für unbekannte Codes auf 'Organisation #n' zurück", () => {
    expect(orgLabel(199 as OrganisationsTyp)).toBe("Organisation #199");
  });
});

describe("vokabularFuer()", () => {
  it("liefert THW-Vokabulare nur für THW", () => {
    expect(vokabularFuer(OrganisationsTyp.THW, "funktion").length).toBeGreaterThan(0);
    expect(vokabularFuer(OrganisationsTyp.FEUERWEHR, "funktion")).toEqual([]);
  });

  it("liefert die Funkruf-Kennwörter organisationsübergreifend", () => {
    // Kennwörter sind ein globales Vokabular — auch für (noch) leere Organisationen.
    expect(vokabularFuer(OrganisationsTyp.FEUERWEHR, "kennwort").length).toBeGreaterThan(0);
  });

  it("liefert Hierarchie-Ebenen je Organisation aus dem Ebenen-Vokabular", () => {
    expect(vokabularFuer(OrganisationsTyp.THW, "ebene").map((e) => e.kurz)).toEqual(["OV", "RB", "LV"]);
    expect(vokabularFuer(OrganisationsTyp.FEUERWEHR, "ebene").length).toBeGreaterThan(0);
    expect(vokabularFuer(OrganisationsTyp.POLIZEI, "ebene")).toEqual([]);
  });
});

describe("vokabSortiert()", () => {
  it("sortiert nach der angezeigten Kurzform, ohne die Tabelle zu verändern", () => {
    const tabelle = vokabularFuer(OrganisationsTyp.THW, "einheitstyp");
    const kurz = vokabSortiert(tabelle).map((t) => t.kurz);
    expect(kurz).toEqual([...kurz].sort((a, b) => a.localeCompare(b, "de")));
    // Die Codes bleiben das Datenformat: die Quelltabelle steht weiter in Code-Reihenfolge.
    expect(tabelle.map((t) => t.code)).toEqual([...tabelle.map((t) => t.code)].sort((a, b) => a - b));
  });

  it("stellt Verwandtes zusammen, statt es über die StAN-Nummern zu verteilen", () => {
    const kurz = vokabSortiert(vokabularFuer(OrganisationsTyp.THW, "einheitstyp")).map((t) => t.kurz);
    const plaetze = kurz.map((k, i) => ({ kurz: k, platz: i })).filter((e) => e.kurz.startsWith("FGr Öl"));
    expect(plaetze.length).toBe(3);
    // Lückenlos hintereinander: letzter Platz minus erster = Anzahl − 1.
    expect(plaetze[plaetze.length - 1]!.platz - plaetze[0]!.platz).toBe(2);
  });

  it("entscheidet bei gleicher Kurzform über den Namen", () => {
    const sortiert = vokabSortiert([
      { code: 2, kurz: "Tr", name: "Trupp Bergung" },
      { code: 1, kurz: "Tr", name: "Trupp Ausbildung" },
    ]);
    expect(sortiert.map((t) => t.name)).toEqual(["Trupp Ausbildung", "Trupp Bergung"]);
  });
});

describe("vokabText()", () => {
  const tabelle = vokabularFuer(OrganisationsTyp.THW, "funktion");

  it("löst einen bekannten Code in seine Kurzform auf", () => {
    expect(vokabText({ code: 3 }, tabelle)).toBe("GrFü"); // 3 = Gruppenführer/in
    expect(vokabText({ code: 3 }, tabelle, "name")).toBe("Gruppenführer/in");
  });

  it("gibt Freitext unverändert zurück", () => {
    expect(vokabText({ freitext: "Sonderrolle" }, tabelle)).toBe("Sonderrolle");
  });

  it("zeigt '#code' für unbekannte Codes und '' für undefined", () => {
    expect(vokabText({ code: 9999 }, tabelle)).toBe("#9999");
    expect(vokabText(undefined, tabelle)).toBe("");
  });
});

describe("funktionsText()", () => {
  it("stellt Grundfunktion, Fahrerlaubnis und Zusatzfunktion wie auf dem Papierbogen dar", () => {
    const p = person({
      funktionen: [{ code: 3 }, { code: 7 }], // GrFü + SGL
      fahrerlaubnis: Fahrerlaubnis.CE,
    });
    expect(funktionsText(p, OrganisationsTyp.THW)).toBe("GrFü / Kf CE, SGL");
  });

  it("lässt 'Kf' weg, wenn keine Fahrerlaubnis vorhanden ist", () => {
    const p = person({ funktionen: [{ code: 5 }], fahrerlaubnis: Fahrerlaubnis.NONE }); // He
    expect(funktionsText(p, OrganisationsTyp.THW)).toBe("He");
  });

  it("reiht mehrere Fahrerlaubnisklassen mit '+' aneinander", () => {
    const p = person({
      funktionen: [{ code: 3 }],
      fahrerlaubnis: Fahrerlaubnis.B,
      weitereFahrerlaubnisse: [Fahrerlaubnis.A],
    });
    expect(funktionsText(p, OrganisationsTyp.THW)).toBe("GrFü / Kf B+A");
  });
});

describe("FE_EINGESCHLOSSEN", () => {
  it("bildet § 6 Abs. 3 FeV samt Vorbesitz ab (Stichproben)", () => {
    expect(FE_EINGESCHLOSSEN[Fahrerlaubnis.CE]).toEqual(
      expect.arrayContaining([Fahrerlaubnis.CE, Fahrerlaubnis.C, Fahrerlaubnis.C1E, Fahrerlaubnis.BE, Fahrerlaubnis.B]),
    );
    expect(FE_EINGESCHLOSSEN[Fahrerlaubnis.B]).toEqual([Fahrerlaubnis.B, Fahrerlaubnis.AM]);
    // Krad und Pkw schließen sich nicht gegenseitig ein.
    expect(FE_EINGESCHLOSSEN[Fahrerlaubnis.A]).not.toContain(Fahrerlaubnis.B);
    expect(FE_EINGESCHLOSSEN[Fahrerlaubnis.CE]).not.toContain(Fahrerlaubnis.A);
    // Jede Klasse enthält sich selbst; NONE nichts.
    for (const [k, liste] of Object.entries(FE_EINGESCHLOSSEN)) {
      if (Number(k) !== Fahrerlaubnis.NONE) expect(liste).toContain(Number(k));
    }
    expect(FE_EINGESCHLOSSEN[Fahrerlaubnis.NONE]).toEqual([]);
  });
});

describe("kennzeichenText()", () => {
  it("gibt das erfasste Kennzeichen unverändert zurück", () => {
    expect(kennzeichenText({ typ: {}, kennzeichen: "THW-84397" } as Fahrzeug)).toBe("THW-84397");
    expect(kennzeichenText({ typ: {}, kennzeichen: "OL-FW 2041" } as Fahrzeug)).toBe("OL-FW 2041");
  });

  it("liefert '' für ein Fahrzeug ohne Kennzeichen", () => {
    expect(kennzeichenText({ typ: {} } as Fahrzeug)).toBe("");
  });
});

describe("funkrufText()", () => {
  it("nutzt bei eigenerStandort den Ort der Einheit", () => {
    const f = { typ: {}, funkrufname: { kennwort: { code: 1 }, eigenerStandort: true, teile: [18, 13] } } as Fahrzeug;
    expect(funkrufText(f, "Oldenburg")).toBe("Heros Oldenburg 18/13");
  });

  it("nutzt bei fremdem Standort den hinterlegten Ort", () => {
    const f = { typ: {}, funkrufname: { kennwort: { code: 1 }, eigenerStandort: false, ort: "Wardenburg", teile: [24, 54] } } as Fahrzeug;
    expect(funkrufText(f, "Oldenburg")).toBe("Heros Wardenburg 24/54");
  });

  it("liefert '' ohne Funkrufnamen", () => {
    expect(funkrufText({ typ: {} } as Fahrzeug, "Oldenburg")).toBe("");
  });
});

describe("datumDeutsch()", () => {
  it("wandelt ISO in Tag.Monat.Jahr (mit führenden Nullen)", () => {
    expect(datumDeutsch("2025-05-14")).toBe("14.05.2025");
    expect(datumDeutsch("2025-12-01")).toBe("01.12.2025");
  });
});

describe("zeitgruppe()", () => {
  it("formatiert als NATO-Zeitgruppe TThhmm + Monatskürzel + Jahr", () => {
    expect(zeitgruppe(zeitpunktAusIso("2026-07-16T10:39"))).toBe("161039jul26");
    expect(zeitgruppe(zeitpunktAusIso("2026-01-02T00:00"))).toBe("020000jan26");
    expect(zeitgruppe(zeitpunktAusIso("2025-12-01T23:05"))).toBe("012305dez25");
  });

  it("nutzt für März das umlautfreie Kürzel mrz", () => {
    expect(zeitgruppe(zeitpunktAusIso("2026-03-31T07:00"))).toBe("310700mrz26");
  });
});
