/**
 * Tabellensicht des Meldekopfs. Geprüft wird das, worauf sich in einer
 * Lagebesprechung jemand verlässt: dass die Summenzeile genau die Zeilen zählt,
 * die darüberstehen (abgerückte also nicht), und dass die Spaltensortierung
 * nach Zahlen wirklich nach Zahlen ordnet — nicht nach deren Text („10" vor
 * „9"), was bei einer Stärkespalte die falsche Einheit nach oben holt.
 */

import { describe, it, expect } from "vitest";
import {
  Ernaehrung,
  Fahrerlaubnis,
  Geschlecht,
  OrganisationsTyp,
  PersonalErfassung,
  SCHEMA_VERSION,
  StaerkeRolle,
  type Erfassungsbogen,
  type Person,
} from "../model";
import { MeldeStatus, type MeldeEintrag } from "./einsaetze";
import { TABELLEN_SPALTEN, tabellenSumme, tabellenZeilen, zeilenSortieren } from "./einheiten-tabelle";

function person(rolle: StaerkeRolle): Person {
  return {
    vorname: "Anna",
    nachname: "Beispiel",
    staerkeRolle: rolle,
    funktionen: [],
    fahrerlaubnis: Fahrerlaubnis.NONE,
    geschlecht: Geschlecht.W,
    ernaehrung: Ernaehrung.FLEISCH,
    kontakte: [],
    zusatzqualifikationen: [],
  };
}

function bogen(ort: string, mannschaft: number): Erfassungsbogen {
  return {
    schemaVersion: SCHEMA_VERSION,
    stand: 100,
    einheit: {
      organisation: OrganisationsTyp.THW,
      einheitsTyp: { freitext: "FGr N" },
      hierarchie: [{ bezeichnung: { freitext: "Ortsverband" }, name: ort }],
    },
    einsatz: { zeitraumVon: 100, zeitraumBis: 101, ortAuftrag: "" },
    personalErfassung: PersonalErfassung.VOLLSTAENDIG,
    personal: [
      person(StaerkeRolle.FUEHRER),
      ...Array.from({ length: mannschaft }, () => person(StaerkeRolle.MANNSCHAFT)),
    ],
    fahrzeuge: [{ typ: { freitext: "GKW" }, stanKonform: true }],
    sonstiges: "",
  };
}

function eintrag(id: string, b: Erfassungsbogen, over: Partial<MeldeEintrag> = {}): MeldeEintrag {
  return {
    id,
    einheitSchluessel: id,
    empfangenAm: 1000,
    quelle: "scan",
    status: MeldeStatus.ANWESEND,
    bogen: b,
    ...over,
  };
}

/** Anzeigename einer Meldung, wie ihn auch die Tabelle bildet. */
const zeilenName = (e: MeldeEintrag) => tabellenZeilen([e])[0]!.einheit;

const oldenburg = eintrag("a", bogen("Oldenburg", 9));
const bremen = eintrag("b", bogen("Bremen", 1));
const cloppenburg = eintrag("c", bogen("Cloppenburg", 4), { status: MeldeStatus.ABGERUECKT });

describe("tabellenZeilen", () => {
  it("nimmt die abgeleiteten Zahlen des Bogens auf und behält die Reihenfolge", () => {
    const zeilen = tabellenZeilen([oldenburg, bremen]);
    expect(zeilen.map((z) => z.einheit)).toEqual([oldenburg, bremen].map((e) => zeilenName(e)));
    expect(zeilen[0]!.gesamt).toBe(10);
    expect(zeilen[0]!.fuehrer).toBe(1);
    expect(zeilen[0]!.mannschaft).toBe(9);
    expect(zeilen[0]!.fahrzeuge).toBe(1);
    expect(zeilen[0]!.fahrzeugTypen).toBe("GKW");
    expect(zeilen[0]!.anwesend).toBe(true);
  });

  it("kennzeichnet abgerückte Meldungen als nicht anwesend", () => {
    expect(tabellenZeilen([cloppenburg])[0]!.anwesend).toBe(false);
  });
});

describe("tabellenSumme", () => {
  it("zählt nur die anwesenden Zeilen der Auswahl", () => {
    const summe = tabellenSumme(tabellenZeilen([oldenburg, bremen, cloppenburg]));
    expect(summe.einheiten).toBe(2);
    expect(summe.staerke.gesamt).toBe(12);
    expect(summe.fahrzeuge).toBe(2);
  });
});

describe("zeilenSortieren", () => {
  const zeilen = tabellenZeilen([oldenburg, bremen, cloppenburg]);

  it("sortiert Zahlenspalten numerisch, nicht als Text", () => {
    const ab = zeilenSortieren(zeilen, "gesamt", "ab").map((z) => z.gesamt);
    expect(ab).toEqual([10, 5, 2]);
    expect(zeilenSortieren(zeilen, "gesamt", "auf").map((z) => z.gesamt)).toEqual([2, 5, 10]);
  });

  it("sortiert Textspalten nach deutscher Sortierung", () => {
    expect(zeilenSortieren(zeilen, "einheit", "auf").map((z) => z.einheit)[0]).toContain("Bremen");
  });

  it("lässt die übergebene Liste unangetastet", () => {
    const vorher = zeilen.map((z) => z.einheit);
    zeilenSortieren(zeilen, "gesamt", "ab");
    expect(zeilen.map((z) => z.einheit)).toEqual(vorher);
  });

  it("hält jede Spalte sortierbar (kein Schlüssel ohne Wert)", () => {
    for (const s of TABELLEN_SPALTEN) {
      expect(zeilenSortieren(zeilen, s.schluessel, "ab")).toHaveLength(zeilen.length);
    }
  });
});
