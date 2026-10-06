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

/** Felder einer Datenzeile nach Spaltenüberschrift — Spalten kommen dazu, die Tests sollen nicht an Zahlen hängen. */
function spaltenIndex(csv: string): (name: string) => number {
  const kopf = zeilen(csv)[0]!.split(";");
  return (name) => {
    const i = kopf.indexOf(name);
    expect(i, `Spalte „${name}“`).toBeGreaterThanOrEqual(0);
    return i;
  };
}

describe("einsatzCsvInhalt()", () => {
  it("beginnt mit UTF-8-BOM und semikolon-getrennter Kopfzeile", () => {
    const csv = einsatzCsvInhalt(sammlung([meldung(bogen("A"))]));
    const [kopf] = zeilen(csv);
    expect(kopf!.split(";")).toEqual([
      "Nr.", "Einheit", "Teil", "Organisation", "Zug",
      "Stärke F", "Stärke U", "Stärke M", "Stärke gesamt",
      "Verpflegung gesamt", "Verpflegung veg.", "Verpflegung vegan",
      "Unterbringung angefordert M", "Unterbringung angefordert W", "Unterbringung angefordert D",
      "WC/Dusche M", "WC/Dusche W", "WC/Dusche D",
      "Diesel (l)", "Benzin (l)", "Gemisch (l)",
      "Fahrzeuge (Anzahl)", "Fahrzeuge (Liste)", "Stand", "Eingetroffen", "Abgerückt", "Empfangen", "Quelle",
      "Status", "Zählt in Lage", "Übung", "Sofortbedarf", "Rückfrage", "Signatur", "Absender", "Auftrag/Notiz",
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
    const sp = spaltenIndex(csv);
    const [, daten] = zeilen(csv);
    const f = daten!.split(";");
    expect(f[sp("Einheit")]).toBe("THW OV Alpha Media Team");
    expect(f[sp("Teil")]).toBe(""); // ungeteilte Einheit: keine Teil-Bezeichnung
    expect(f[sp("Organisation")]).toBe("THW");
    expect(f[sp("Zug")]).toBe("1. Zug");
    expect(f.slice(sp("Stärke F"), sp("Stärke gesamt") + 1)).toEqual(["1", "0", "2", "3"]);
    expect(f.slice(sp("Verpflegung gesamt"), sp("Verpflegung vegan") + 1)).toEqual(["3", "1", "1"]);
    // Unterbringung angefordert (hier: ja) und WC/Dusche (alle Anwesenden) — beide M/W/D.
    expect(f.slice(sp("Unterbringung angefordert M"), sp("Unterbringung angefordert D") + 1)).toEqual(["2", "1", "0"]);
    expect(f.slice(sp("WC/Dusche M"), sp("WC/Dusche D") + 1)).toEqual(["2", "1", "0"]);
    expect(f.slice(sp("Diesel (l)"), sp("Gemisch (l)") + 1)).toEqual(["40", "5", "0"]);
    expect(f[sp("Nr.")]).toBe("1"); // laufende Nummer wie auf Karte und Lageblatt (R3-K7)
    expect(f[sp("Fahrzeuge (Anzahl)")]).toBe("1");
    expect(f[sp("Fahrzeuge (Liste)")]).not.toBe("");
    // Eine Zeitform je Datei: Stand, Eingetroffen und Empfangen gleich (R3-K7).
    expect(f[sp("Stand")]).toMatch(/^\d{2}\.\d{2}\.\d{4}, \d{2}:\d{2}$/);
    expect(f[sp("Empfangen")]).toMatch(/^\d{2}\.\d{2}\.\d{4}, \d{2}:\d{2}$/);
    expect(f[sp("Eingetroffen")]).toMatch(/^\d{2}\.\d{2}\.\d{4}, \d{2}:\d{2}$/); // = Empfangszeit, wenn nicht korrigiert
    expect(f[sp("Abgerückt")]).toBe(""); // nicht abgerückt
    expect(f[sp("Quelle")]).toBe("Empfangen"); // gleicher Wortlaut wie auf der Karte (R2-K6)
    expect(f[sp("Status")]).toBe("anwesend");
    expect(f[sp("Zählt in Lage")]).toBe("ja");
    expect(f[sp("Übung")]).toBe(""); // kein Übungsbogen
    expect(f[sp("Sofortbedarf")]).toBe("Unterbringung / Kraftstoff");
    expect(f[sp("Signatur")]).toBe("unsigniert");
    expect(f[sp("Auftrag/Notiz")]).toBe(""); // kein Auftrag
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
    const sp = spaltenIndex(csv);
    const felder = zeilen(csv).slice(1, 3).map((z) => z.split(";"));
    expect(felder.map((f) => f[sp("Teil")])).toEqual(["", "Fachberater"]);
    expect(felder[1]![sp("Quelle")]).toBe("Aufteilung");
  });

  it("hängt eine Summenzeile über alle anwesenden Einheiten an", () => {
    const csv = einsatzCsvInhalt(sammlung([meldung(bogen("A")), meldung(bogen("B"))]));
    const sp = spaltenIndex(csv);
    const reihen = zeilen(csv);
    expect(reihen).toHaveLength(4); // Kopf + 2 Einheiten + Summe
    const summe = reihen[3]!.split(";");
    expect(summe[1]).toBe("Summe (2 Einheiten)");
    expect(summe.slice(sp("Stärke F"), sp("Stärke gesamt") + 1)).toEqual(["2", "0", "4", "6"]); // Stärke gesamt 6
    expect(summe.slice(sp("Diesel (l)"), sp("Gemisch (l)") + 1)).toEqual(["80", "10", "0"]); // Kraftstoff summiert
    expect(summe[sp("Fahrzeuge (Anzahl)")]).toBe("2"); // Fahrzeuge gesamt als Zahl, die Liste bleibt leer (R4-K8)
    expect(summe[sp("Fahrzeuge (Liste)")]).toBe("");
  });

  /**
   * R4-W5: Die Summe unter „Unterbringung angefordert“ ist die Zahl, mit der
   * der Stab Schlafplätze plant — dieselbe wie auf Lageblatt und in der
   * Excel-Liste. „WC/Dusche“ zählt alle Anwesenden.
   */
  it("führt Unterbringung angefordert nur für Einheiten mit Anforderung, WC/Dusche für alle (R4-W5)", () => {
    const ohne = bogen("B", { sofortbedarf: { verpflegungPersonen: 3, dieselLiter: 0, benzinLiter: 0, gemischLiter: 0, unterbringung: false, ruhezeitErforderlich: false } });
    const csv = einsatzCsvInhalt(sammlung([meldung(bogen("A")), meldung(ohne)]));
    const sp = spaltenIndex(csv);
    const reihen = zeilen(csv);
    const b = reihen[2]!.split(";");
    expect(b.slice(sp("Unterbringung angefordert M"), sp("Unterbringung angefordert D") + 1)).toEqual(["0", "0", "0"]);
    expect(b.slice(sp("WC/Dusche M"), sp("WC/Dusche D") + 1)).toEqual(["2", "1", "0"]);
    const summe = reihen[3]!.split(";");
    expect(summe.slice(sp("Unterbringung angefordert M"), sp("Unterbringung angefordert D") + 1)).toEqual(["2", "1", "0"]);
    expect(summe.slice(sp("WC/Dusche M"), sp("WC/Dusche D") + 1)).toEqual(["4", "2", "0"]);
  });

  it("schreibt die offenen Punkte der Meldung in eine Spalte „Rückfrage“ (R4-K8)", () => {
    const csv = einsatzCsvInhalt(sammlung([meldung(bogen("A", { fahrzeuge: [{ typ: { code: 2 }, kennzeichen: "" }] }))]));
    const sp = spaltenIndex(csv);
    expect(zeilen(csv)[1]!.split(";")[sp("Rückfrage")]).toContain("hat noch kein Kennzeichen");
  });

  it("führt abgerückte Einheiten mit Status auf, zählt sie aber nicht in die Summe", () => {
    // Weglassen war der Fehler: Die Führungsstelle sah eine Lücke, ohne sie als
    // Lücke erkennen zu können. Die Zeile bleibt, die Summe nicht.
    const csv = einsatzCsvInhalt(
      sammlung([meldung(bogen("A")), meldung(bogen("B"), { status: MeldeStatus.ABGERUECKT })]),
    );
    const sp = spaltenIndex(csv);
    const reihen = zeilen(csv);
    expect(reihen).toHaveLength(4); // Kopf + 2 Einheiten + Summe
    const abgerueckt = reihen[2]!.split(";");
    expect(abgerueckt[sp("Status")]).toBe("abgerückt");
    expect(abgerueckt[sp("Zählt in Lage")]).toBe("nein");
    expect(reihen[3]!).toContain("Summe (1 Einheiten)");
  });

  it("nimmt einen Übungsbogen aus der Lage eines echten Einsatzes heraus", () => {
    const csv = einsatzCsvInhalt(
      sammlung([meldung(bogen("A")), meldung(bogen("B", { uebung: true }))]),
    );
    const sp = spaltenIndex(csv);
    const reihen = zeilen(csv);
    const uebung = reihen[2]!.split(";");
    expect(uebung[sp("Zählt in Lage")]).toBe("nein");
    expect(uebung[sp("Übung")]).toBe("ÜBUNG");
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
    const sp = spaltenIndex(csv);
    const f = zeilen(csv)[1]!.split(";");
    expect(f[sp("Eingetroffen")]).toBe("26.09.2026, 09:40");
    expect(f[sp("Abgerückt")]).toBe("27.09.2026, 15:10");
    expect(f[sp("Auftrag/Notiz")]).toBe("Deichabschnitt Nord");
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
