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
import { MeldeStatus, einheitSchluessel, bogenInhaltsId, type Einsatzsammlung, type MeldeEintrag } from "./einsaetze";
import { einsatzCsvInhalt } from "./einsatz-csv";

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
    fahrzeuge: [{ typ: { code: 2 }, thwKennzeichen: 1 }],
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

function sammlung(eintraege: MeldeEintrag[]): Einsatzsammlung {
  return { id: "e1", name: "Testlage", art: 0, angelegt: 0, geaendert: 0, eintraege };
}

/** BOM abtrennen und in Zeilen zerlegen (CRLF). Letzte Zeile ist leer (trailing CRLF). */
function zeilen(csv: string): string[] {
  expect(csv.startsWith("﻿")).toBe(true);
  return csv.slice(1).replace(/\r\n$/, "").split("\r\n");
}

describe("einsatzCsvInhalt()", () => {
  it("beginnt mit UTF-8-BOM und semikolon-getrennter Kopfzeile", () => {
    const csv = einsatzCsvInhalt(sammlung([meldung(bogen("A"))]));
    const [kopf] = zeilen(csv);
    expect(kopf!.split(";")).toEqual([
      "Einheit", "Organisation", "Zug",
      "Stärke F", "Stärke U", "Stärke M", "Stärke gesamt",
      "Verpflegung gesamt", "Verpflegung veg.", "Verpflegung vegan",
      "Unterbringung M", "Unterbringung W", "Unterbringung D",
      "Diesel (l)", "Benzin (l)", "Gemisch (l)",
      "Fahrzeuge", "Stand", "Quelle",
    ]);
  });

  it("schreibt je anwesende Einheit eine Datenzeile mit den erwarteten Werten", () => {
    // zugEtikett gehört an die Meldung, nicht an den Bogen.
    const csv = einsatzCsvInhalt(sammlung([meldung(bogen("OV Alpha"), { zugEtikett: "1. Zug" })]));
    const [, daten] = zeilen(csv);
    const f = daten!.split(";");
    expect(f[0]).toBe("OV Alpha");
    expect(f[1]).toBe("THW");
    expect(f[2]).toBe("1. Zug");
    // Stärke F/U/M/gesamt
    expect(f.slice(3, 7)).toEqual(["1", "0", "2", "3"]);
    // Verpflegung gesamt/veg/vegan
    expect(f.slice(7, 10)).toEqual(["3", "1", "1"]);
    // Unterbringung M/W/D
    expect(f.slice(10, 13)).toEqual(["2", "1", "0"]);
    // Diesel/Benzin/Gemisch
    expect(f.slice(13, 16)).toEqual(["40", "5", "0"]);
    expect(f[17]).toMatch(/^\d{2}\.\d{2}\.\d{4}$/); // Stand als deutsches Datum
    expect(f[18]).toBe("Scan");
  });

  it("hängt eine Summenzeile über alle anwesenden Einheiten an", () => {
    const csv = einsatzCsvInhalt(sammlung([meldung(bogen("A")), meldung(bogen("B"))]));
    const reihen = zeilen(csv);
    expect(reihen).toHaveLength(4); // Kopf + 2 Einheiten + Summe
    const summe = reihen[3]!.split(";");
    expect(summe[0]).toBe("Summe (2 Einheiten)");
    expect(summe.slice(3, 7)).toEqual(["2", "0", "4", "6"]); // Stärke gesamt 6
    expect(summe.slice(13, 16)).toEqual(["80", "10", "0"]); // Kraftstoff summiert
    expect(summe[16]).toBe("2"); // Fahrzeuge gesamt
  });

  it("ignoriert abgerückte Einheiten (nur aktuelle Meldungen)", () => {
    const csv = einsatzCsvInhalt(
      sammlung([meldung(bogen("A")), meldung(bogen("B"), { status: MeldeStatus.ABGERUECKT })]),
    );
    const reihen = zeilen(csv);
    expect(reihen).toHaveLength(3); // Kopf + 1 Einheit + Summe
    expect(reihen[3]).toBeUndefined();
    expect(reihen[2]!).toContain("Summe (1 Einheiten)");
  });

  it("quotet Felder mit Semikolon und deutschem Dezimalkomma", () => {
    const csv = einsatzCsvInhalt(
      sammlung([
        meldung(bogen("Feuerwehr; Ort", {
          einheit: { organisation: OrganisationsTyp.THW, einheitsTyp: { code: 1 }, name: "Feuerwehr; Ort", hierarchie: [] },
          sofortbedarf: { verpflegungPersonen: 3, dieselLiter: 12.5, benzinLiter: 0, gemischLiter: 0, unterbringung: false, ruhezeitErforderlich: false },
        })),
      ]),
    );
    const daten = zeilen(csv)[1]!;
    expect(daten).toContain('"Feuerwehr; Ort"'); // Semikolon-Feld gequotet
    expect(daten.split(";")).toContain("12,5"); // Diesel als deutsche Dezimalzahl
  });
});
