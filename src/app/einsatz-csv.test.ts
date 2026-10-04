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
} from "@bos/eeb-format/model";
import { MeldeStatus, einheitSchluessel, bogenInhaltsId, type Einsatzsammlung, type MeldeEintrag } from "@bos/meldekopf/einsaetze";
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
    einheit: { organisation: OrganisationsTyp.THW, einheitsTyp: { code: 1 }, hierarchie: [{ bezeichnung: { code: 1 }, name }] },
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
      "Einheit", "Teil", "Organisation", "Zug",
      "Stärke F", "Stärke U", "Stärke M", "Stärke gesamt",
      "Verpflegung gesamt", "Verpflegung veg.", "Verpflegung vegan",
      "Unterbringung M", "Unterbringung W", "Unterbringung D",
      "Diesel (l)", "Benzin (l)", "Gemisch (l)",
      "Fahrzeuge", "Stand", "Eingetroffen", "Abgerückt", "Empfangen", "Quelle",
      "Status", "Zählt in Lage", "Übung", "Sofortbedarf", "Signatur", "Absender", "Auftrag/Notiz",
      "Bemerkung (Einheit)",
    ]);
  });

  it("führt die Bemerkung der Einheit in einer eigenen Spalte (R3-K3)", () => {
    const b = bogen("OV Alpha");
    b.sonstiges = "Ölsperre 200 m verbraucht, Nachschub nötig";
    const [kopf, daten] = zeilen(einsatzCsvInhalt(sammlung([meldung(b)])));
    const i = kopf!.replace(/^\uFEFF/, "").split(";").indexOf("Bemerkung (Einheit)");
    expect(daten!.split(";")[i]).toBe("Ölsperre 200 m verbraucht, Nachschub nötig");
  });

  it("schreibt je anwesende Einheit eine Datenzeile mit den erwarteten Werten", () => {
    // zugEtikett gehört an die Meldung, nicht an den Bogen.
    const csv = einsatzCsvInhalt(sammlung([meldung(bogen("OV Alpha"), { zugEtikett: "1. Zug" })]));
    const [, daten] = zeilen(csv);
    const f = daten!.split(";");
    expect(f[0]).toBe("THW OV Alpha Media Team");
    expect(f[1]).toBe(""); // ungeteilte Einheit: keine Teil-Bezeichnung
    expect(f[2]).toBe("THW");
    expect(f[3]).toBe("1. Zug");
    // Stärke F/U/M/gesamt
    expect(f.slice(4, 8)).toEqual(["1", "0", "2", "3"]);
    // Verpflegung gesamt/veg/vegan
    expect(f.slice(8, 11)).toEqual(["3", "1", "1"]);
    // Unterbringung M/W/D
    expect(f.slice(11, 14)).toEqual(["2", "1", "0"]);
    // Diesel/Benzin/Gemisch
    expect(f.slice(14, 17)).toEqual(["40", "5", "0"]);
    expect(f[18]).toMatch(/^\d{6}[a-z]{3}\d{2}$/); // Stand als NATO-Zeitgruppe
    expect(f[19]).toMatch(/^\d{2}\.\d{2}\.\d{4}, \d{2}:\d{2}$/); // Eingetroffen = Empfangszeit, wenn nicht korrigiert
    expect(f[20]).toBe(""); // nicht abgerückt
    expect(f[22]).toBe("Empfangen"); // gleicher Wortlaut wie auf der Karte (R2-K6)
    expect(f[23]).toBe("anwesend");
    expect(f[24]).toBe("ja");
    expect(f[25]).toBe(""); // kein Übungsbogen
    expect(f[26]).toBe("Unterbringung / Kraftstoff");
    expect(f[27]).toBe("unsigniert");
    expect(f[29]).toBe(""); // kein Auftrag
  });

  it("unterscheidet abgeteilte Truppteile in der Teil-Spalte", () => {
    // Nach einer Aufteilung stehen zwei Zeilen derselben Einheit in der Liste —
    // nur das Teil-Etikett hält sie auseinander.
    const csv = einsatzCsvInhalt(
      sammlung([
        meldung(bogen("OV Alpha")),
        meldung(bogen("OV Alpha"), {
          id: "teil-1",
          einheitSchluessel: "org:1||c1|ov alpha|teil:1",
          teilEtikett: "Fachberater",
          quelle: "aufteilung",
        }),
      ]),
    );
    const felder = zeilen(csv).slice(1, 3).map((z) => z.split(";"));
    expect(felder.map((f) => f[1])).toEqual(["", "Fachberater"]);
    expect(felder[1]![22]).toBe("Aufteilung");
  });

  it("hängt eine Summenzeile über alle anwesenden Einheiten an", () => {
    const csv = einsatzCsvInhalt(sammlung([meldung(bogen("A")), meldung(bogen("B"))]));
    const reihen = zeilen(csv);
    expect(reihen).toHaveLength(4); // Kopf + 2 Einheiten + Summe
    const summe = reihen[3]!.split(";");
    expect(summe[0]).toBe("Summe (2 Einheiten)");
    expect(summe.slice(4, 8)).toEqual(["2", "0", "4", "6"]); // Stärke gesamt 6
    expect(summe.slice(14, 17)).toEqual(["80", "10", "0"]); // Kraftstoff summiert
    expect(summe[17]).toBe("2"); // Fahrzeuge gesamt
  });

  it("führt abgerückte Einheiten mit Status auf, zählt sie aber nicht in die Summe", () => {
    // Weglassen war der Fehler: Die Führungsstelle sah eine Lücke, ohne sie als
    // Lücke erkennen zu können. Die Zeile bleibt, die Summe nicht.
    const csv = einsatzCsvInhalt(
      sammlung([meldung(bogen("A")), meldung(bogen("B"), { status: MeldeStatus.ABGERUECKT })]),
    );
    const reihen = zeilen(csv);
    expect(reihen).toHaveLength(4); // Kopf + 2 Einheiten + Summe
    const abgerueckt = reihen[2]!.split(";");
    expect(abgerueckt[23]).toBe("abgerückt");
    expect(abgerueckt[24]).toBe("nein");
    expect(reihen[3]!).toContain("Summe (1 Einheiten)");
  });

  it("nimmt einen Übungsbogen aus der Lage eines echten Einsatzes heraus", () => {
    const csv = einsatzCsvInhalt(
      sammlung([meldung(bogen("A")), meldung(bogen("B", { uebung: true }))]),
    );
    const reihen = zeilen(csv);
    const uebung = reihen[2]!.split(";");
    expect(uebung[24]).toBe("nein");
    expect(uebung[25]).toBe("ÜBUNG");
    expect(reihen[3]!).toContain("Summe (1 Einheiten)");
  });

  it("schreibt korrigierte Eintreffzeit, Abrückzeit und Auftrag der Führungsstelle", () => {
    // Die Zeiten der Führungsstelle, nicht der Empfangsmoment: fürs
    // Einsatztagebuch zählt, wann die Einheit da war.
    const eingetroffen = new Date("2026-09-26T09:40").getTime();
    const abgerueckt = new Date("2026-09-27T15:10").getTime();
    const csv = einsatzCsvInhalt(
      sammlung([
        meldung(bogen("A"), {
          status: MeldeStatus.ABGERUECKT,
          eingetroffenAm: eingetroffen,
          abgerueckAm: abgerueckt,
          notiz: "Deichabschnitt Nord",
        }),
      ]),
    );
    const f = zeilen(csv)[1]!.split(";");
    expect(f[19]).toBe("26.09.2026, 09:40");
    expect(f[20]).toBe("27.09.2026, 15:10");
    expect(f[29]).toBe("Deichabschnitt Nord");
  });

  it("quotet Felder mit Semikolon und deutschem Dezimalkomma", () => {
    const csv = einsatzCsvInhalt(
      sammlung([
        meldung(bogen("Feuerwehr; Ort", {
          einheit: { organisation: OrganisationsTyp.THW, einheitsTyp: { code: 1 }, hierarchie: [{ bezeichnung: { code: 1 }, name: "Feuerwehr; Ort" }] },
          sofortbedarf: { verpflegungPersonen: 3, dieselLiter: 12.5, benzinLiter: 0, gemischLiter: 0, unterbringung: false, ruhezeitErforderlich: false },
        })),
      ]),
    );
    const daten = zeilen(csv)[1]!;
    expect(daten).toContain('"THW Feuerwehr; Ort Media Team"'); // Semikolon-Feld gequotet
    expect(daten.split(";")).toContain("12,5"); // Diesel als deutsche Dezimalzahl
  });
});
