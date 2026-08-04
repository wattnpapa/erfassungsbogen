import { describe, it, expect } from "vitest";
import {
  Ernaehrung,
  Fahrerlaubnis,
  Geschlecht,
  KontaktArt,
  OrganisationsTyp,
  PersonalErfassung,
  SCHEMA_VERSION,
  StaerkeRolle,
  type Erfassungsbogen,
  type Person,
} from "../model";
import { MeldeStatus, bogenInhaltsId, einheitSchluessel, type Einsatzsammlung, type MeldeEintrag } from "./einsaetze";
import { bogenCsvInhalt, einsatzDetailCsvInhalt } from "./bogen-csv";

function person(over: Partial<Person> = {}): Person {
  return {
    vorname: "Hans",
    nachname: "Müller",
    staerkeRolle: StaerkeRolle.MANNSCHAFT,
    funktionen: [],
    fahrerlaubnis: Fahrerlaubnis.NONE,
    geschlecht: Geschlecht.M,
    ernaehrung: Ernaehrung.FLEISCH,
    kontakte: [],
    zusatzqualifikationen: [],
    ...over,
  };
}

function bogen(name = "Oldenburg", over: Partial<Erfassungsbogen> = {}): Erfassungsbogen {
  return {
    schemaVersion: SCHEMA_VERSION,
    stand: 100 * 1440,
    einheit: {
      organisation: OrganisationsTyp.THW,
      einheitsTyp: { code: 1 },
      hierarchie: [{ bezeichnung: { code: 1 }, name, kurz: "OODE", telefon: "044112345", email: "ov@example.org" }],
    },
    einsatz: { zeitraumVon: 100, zeitraumBis: 130, ortAuftrag: "Deichverteidigung" },
    personalErfassung: PersonalErfassung.VOLLSTAENDIG,
    personal: [
      person({ nachname: "Chef", staerkeRolle: StaerkeRolle.FUEHRER, fahrerlaubnis: Fahrerlaubnis.CE }),
      person({ nachname: "Weber", geschlecht: Geschlecht.W, ernaehrung: Ernaehrung.VEGAN }),
    ],
    fahrzeuge: [{ typ: { code: 2 }, kennzeichen: "THW-84397" }],
    sofortbedarf: {
      verpflegungPersonen: 2,
      dieselLiter: 40,
      benzinLiter: 0,
      gemischLiter: 0,
      unterbringung: true,
      ruhezeitErforderlich: false,
    },
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

function sammlung(eintraege: MeldeEintrag[], name = "Sturmflut 26"): Einsatzsammlung {
  return { id: "e1", name, art: 0, angelegt: 0, geaendert: 0, eintraege };
}

/** BOM abtrennen und in Zeilen zerlegen (CRLF). */
function zeilen(csv: string): string[] {
  expect(csv.startsWith("﻿")).toBe(true);
  return csv.slice(1).replace(/\r\n$/, "").split("\r\n");
}

/** Zeile → Feldliste. Nur für Zeilen ohne gequotete Felder benutzen. */
function felder(zeile: string): string[] {
  return zeile.split(";");
}

/** Wert einer Spalte per Kopfzeilen-Name — hält die Tests von Spaltenindizes frei. */
function spalte(csv: string, zeilenNr: number, name: string): string {
  const reihen = zeilen(csv);
  const i = felder(reihen[0]!).indexOf(name);
  expect(i, `Spalte „${name}" fehlt`).toBeGreaterThanOrEqual(0);
  return felder(reihen[zeilenNr]!)[i]!;
}

describe("bogenCsvInhalt()", () => {
  it("schreibt je eine Zeile für Einheit, Person und Fahrzeug", () => {
    const csv = bogenCsvInhalt(bogen());
    const reihen = zeilen(csv);
    expect(reihen).toHaveLength(5); // Kopf + Einheit + 2 Personen + 1 Fahrzeug
    expect(reihen.slice(1).map((z) => spalte(csv, reihen.indexOf(z), "Satzart"))).toEqual([
      "Einheit",
      "Person",
      "Person",
      "Fahrzeug",
    ]);
  });

  it("wiederholt den Kontext auf jeder Zeile, damit eine gefilterte Sicht lesbar bleibt", () => {
    const csv = bogenCsvInhalt(bogen());
    for (let z = 1; z <= 4; z++) {
      expect(spalte(csv, z, "Einheit")).toBe("THW Oldenburg Media Team");
      expect(spalte(csv, z, "Stand")).toMatch(/^\d{6}[a-z]{3}\d{2}$/);
      expect(spalte(csv, z, "Übung")).toBe("nein");
    }
  });

  it("nummeriert Personen und Fahrzeuge je Einheit ab 1", () => {
    const csv = bogenCsvInhalt(bogen());
    expect(spalte(csv, 1, "Nr")).toBe(""); // Einheitszeile
    expect(spalte(csv, 2, "Nr")).toBe("1");
    expect(spalte(csv, 3, "Nr")).toBe("2");
    expect(spalte(csv, 4, "Nr")).toBe("1"); // Fahrzeuge zählen eigenständig
  });

  it("füllt die Einheitszeile mit Kopfdaten, Summen und Sofortbedarf", () => {
    const csv = bogenCsvInhalt(bogen());
    expect(spalte(csv, 1, "Organisation")).toBe("THW");
    expect(spalte(csv, 1, "Standort")).toBe("Oldenburg");
    expect(spalte(csv, 1, "Telefon Einheit")).toBe("044112345");
    expect(spalte(csv, 1, "Auftrag")).toBe("Deichverteidigung");
    expect(spalte(csv, 1, "Zeitraum von")).toBe("10.04.2020");
    expect(spalte(csv, 1, "Personalerfassung")).toBe("Vollständig");
    expect(spalte(csv, 1, "Stärke F")).toBe("1");
    expect(spalte(csv, 1, "Stärke gesamt")).toBe("2");
    expect(spalte(csv, 1, "Verpflegung vegan")).toBe("1");
    expect(spalte(csv, 1, "Unterbringung W")).toBe("1");
    expect(spalte(csv, 1, "Unterbringung nötig")).toBe("ja");
    expect(spalte(csv, 1, "Diesel (l)")).toBe("40");
    expect(spalte(csv, 1, "Anzahl Fahrzeuge")).toBe("1");
  });

  it("lässt die Blöcke der jeweils anderen Satzarten leer", () => {
    const csv = bogenCsvInhalt(bogen());
    expect(spalte(csv, 1, "Nachname")).toBe(""); // Einheitszeile ohne Personenfelder
    expect(spalte(csv, 2, "Stärke gesamt")).toBe(""); // Personenzeile ohne Summen
    expect(spalte(csv, 2, "Kennzeichen")).toBe("");
    expect(spalte(csv, 4, "Nachname")).toBe(""); // Fahrzeugzeile ohne Personenfelder
  });

  it("schreibt Personenzeilen mit Rolle, Fahrerlaubnis, Geschlecht und Ernährung", () => {
    const csv = bogenCsvInhalt(bogen());
    expect(spalte(csv, 2, "Nachname")).toBe("Chef");
    expect(spalte(csv, 2, "Vorname")).toBe("Hans");
    expect(spalte(csv, 2, "Rolle")).toBe("Führer");
    expect(spalte(csv, 2, "Fahrerlaubnis")).toBe("CE");
    expect(spalte(csv, 3, "Fahrerlaubnis")).toBe(""); // „keine" ist eine leere Zelle, kein „—"
    expect(spalte(csv, 3, "Geschlecht")).toBe("w");
    expect(spalte(csv, 3, "Ernährung")).toBe("Vegan");
  });

  it("schreibt Kontakte einer Person in ein Feld", () => {
    const csv = bogenCsvInhalt(
      bogen("Oldenburg", {
        personal: [
          person({
            kontakte: [
              { art: KontaktArt.MOBIL, dienstlich: true, wert: "01712345678" },
              { art: KontaktArt.EMAIL, dienstlich: false, wert: "h@example.org" },
            ],
          }),
        ],
      }),
    );
    // Feld enthält kein Semikolon, aber ein „/" als Trenner
    expect(spalte(csv, 2, "Kontakte")).toBe("Mobil: 01712345678 (D) / eMail: h@example.org (P)");
  });

  it("schreibt Fahrzeugzeilen mit Typ und Kennzeichen; StAN bleibt leer, wenn nicht gefragt", () => {
    const csv = bogenCsvInhalt(bogen());
    expect(spalte(csv, 4, "Kennzeichen")).toBe("THW-84397");
    expect(spalte(csv, 4, "Fahrzeugtyp")).not.toBe("");
    expect(spalte(csv, 4, "StAN-konform")).toBe("");
  });

  it("unterscheidet „nicht gefragt“ von „nein“ beim StAN-Kennzeichen", () => {
    const csv = bogenCsvInhalt(bogen("Oldenburg", { fahrzeuge: [{ typ: { code: 2 }, stanKonform: false }] }));
    expect(spalte(csv, 4, "StAN-konform")).toBe("nein"); // Kopf + Einheit + 2 Personen

  });

  it("lässt Unterbringung/Ruhezeit leer, wenn gar kein Sofortbedarf erfasst wurde", () => {
    const csv = bogenCsvInhalt(bogen("Oldenburg", { sofortbedarf: undefined }));
    expect(spalte(csv, 1, "Unterbringung nötig")).toBe("");
    expect(spalte(csv, 1, "Ruhezeit nötig")).toBe("");
    expect(spalte(csv, 1, "Diesel (l)")).toBe("0");
  });

  it("markiert Übungsbögen", () => {
    const csv = bogenCsvInhalt(bogen("Oldenburg", { uebung: true }));
    expect(spalte(csv, 1, "Übung")).toBe("ja");
  });

  it("kommt mit einer Nur-Stärke-Meldung ohne Personal aus", () => {
    const csv = bogenCsvInhalt(
      bogen("Wardenburg", {
        personalErfassung: PersonalErfassung.NUR_STAERKE,
        personal: [],
        staerkeManuell: { fuehrer: 1, unterfuehrer: 2, mannschaft: 17, gesamt: 20 },
        fahrzeuge: [],
      }),
    );
    const reihen = zeilen(csv);
    expect(reihen).toHaveLength(2); // Kopf + Einheitszeile
    expect(spalte(csv, 1, "Personalerfassung")).toBe("Nur Stärke");
    expect(spalte(csv, 1, "Stärke gesamt")).toBe("20");
  });

  it("lässt beim Einzelbogen die Sammlungsspalten leer", () => {
    const csv = bogenCsvInhalt(bogen());
    expect(spalte(csv, 1, "Einsatz")).toBe("");
    expect(spalte(csv, 1, "Quelle")).toBe("");
    expect(spalte(csv, 1, "Status")).toBe("");
  });

  it("quotet Felder mit Semikolon und schreibt deutsche Dezimalkommas", () => {
    const csv = bogenCsvInhalt(
      bogen("Oldenburg", {
        sonstiges: 'Achtung; Anhänger hat "Sonderlast"',
        sofortbedarf: {
          verpflegungPersonen: 2,
          dieselLiter: 12.5,
          benzinLiter: 0,
          gemischLiter: 0,
          unterbringung: false,
          ruhezeitErforderlich: false,
        },
      }),
    );
    const einheitZeile = zeilen(csv)[1]!;
    expect(einheitZeile).toContain('"Achtung; Anhänger hat ""Sonderlast"""');
    expect(einheitZeile.split(";")).toContain("12,5");
  });
});

describe("einsatzDetailCsvInhalt()", () => {
  it("reiht die Bögen aller Einheiten hintereinander, nach Anzeigename sortiert", () => {
    const csv = einsatzDetailCsvInhalt(
      sammlung([meldung(bogen("Zeta")), meldung(bogen("Alpha"), { id: "a" })]),
    );
    const einheiten = zeilen(csv)
      .slice(1)
      .filter((z) => felder(z)[6] === "Einheit")
      .map((z) => felder(z)[1]);
    expect(einheiten).toEqual(["THW Alpha Media Team", "THW Zeta Media Team"]);
  });

  it("trägt Sammlungsname, Zug, Teil, Quelle und Status in jede Zeile bzw. Einheitszeile", () => {
    const csv = einsatzDetailCsvInhalt(
      sammlung([meldung(bogen(), { zugEtikett: "1. Zug", teilEtikett: "Fachberater", quelle: "aufteilung" })]),
    );
    expect(spalte(csv, 1, "Einsatz")).toBe("Sturmflut 26");
    expect(spalte(csv, 2, "Einsatz")).toBe("Sturmflut 26"); // auch auf der Personenzeile
    expect(spalte(csv, 2, "Zug")).toBe("1. Zug");
    expect(spalte(csv, 2, "Teil")).toBe("Fachberater");
    expect(spalte(csv, 1, "Quelle")).toBe("Aufteilung");
    expect(spalte(csv, 1, "Status")).toBe("Anwesend");
  });

  it("nimmt abgerückte Einheiten mit auf und weist sie in der Status-Spalte aus", () => {
    const csv = einsatzDetailCsvInhalt(
      sammlung([
        meldung(bogen("Alpha")),
        meldung(bogen("Zeta"), { id: "z", status: MeldeStatus.ABGERUECKT }),
      ]),
    );
    const status = zeilen(csv)
      .slice(1)
      .filter((z) => felder(z)[6] === "Einheit")
      .map((z) => felder(z)[felder(zeilen(csv)[0]!).indexOf("Status")]);
    expect(status).toEqual(["Anwesend", "Abgerückt"]);
  });

  it("führt je Einheit nur die neueste Revision", () => {
    const alt = bogen("Alpha");
    const neu = bogen("Alpha", { stand: 200 * 1440, personal: [person({ nachname: "Neu" })] });
    const csv = einsatzDetailCsvInhalt(sammlung([meldung(alt), meldung(neu, { empfangenAm: 2000 })]));
    const personen = zeilen(csv)
      .slice(1)
      .filter((z) => felder(z)[6] === "Person");
    expect(personen).toHaveLength(1);
    expect(spalte(csv, 2, "Nachname")).toBe("Neu");
  });

  it("weist eine geprüfte Signatur aus", () => {
    const csv = einsatzDetailCsvInhalt(
      sammlung([meldung(bogen(), { signatur: { zustand: "gueltig", kurzform: "AB12-CD34" } })]),
    );
    expect(spalte(csv, 1, "Signatur")).toBe("gültig (AB12-CD34)");
  });

  it("liefert bei leerer Sammlung nur die Kopfzeile", () => {
    expect(zeilen(einsatzDetailCsvInhalt(sammlung([])))).toHaveLength(1);
  });
});
