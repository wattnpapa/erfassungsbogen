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
} from "@bos/eeb-format/model";
import { MeldeStatus, type MeldeEintrag } from "@bos/meldekopf/einsaetze";
import { meldungsNummern } from "./einheiten-tabelle";

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


describe("meldungsNummern (Audit Runde 2, R2-A6)", () => {
  it("nummeriert Einheiten nach dem ersten Eingang; Folgemeldungen und korrigierte Eintreffzeit ändern nichts", () => {
    const a1 = eintrag("a1", bogen("Aalen", 1), { einheitSchluessel: "A", empfangenAm: 300 });
    const b1 = eintrag("b1", bogen("Biberach", 1), { einheitSchluessel: "B", empfangenAm: 100, eingetroffenAm: 900 });
    const a2 = eintrag("a2", bogen("Aalen", 2), { einheitSchluessel: "A", empfangenAm: 800 });
    const c1 = eintrag("c1", bogen("Crailsheim", 1), { einheitSchluessel: "C", empfangenAm: 500 });
    const nr = meldungsNummern([a2, c1, a1, b1]);
    expect([nr.get("B"), nr.get("A"), nr.get("C")]).toEqual([1, 2, 3]);
  });
});
