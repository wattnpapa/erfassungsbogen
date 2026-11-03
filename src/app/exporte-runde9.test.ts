/**
 * Runde 9, Block Exporte: Sollstärke im Wort (R9-A2), Rückruf einer
 * Soll-Einheit gekennzeichnet (R9-A3), Umschrift in der Personenliste (R9-W3), Zug-Titel (R9-K4).
 */
import { describe, expect, it } from "vitest";
import {
  Ernaehrung,
  Fahrerlaubnis,
  OrganisationsTyp,
  PersonalErfassung,
  SCHEMA_VERSION,
  StaerkeRolle,
  type Erfassungsbogen,
  type Person,
} from "@bos/eeb-format/model";
import { MeldeStatus, bogenInhaltsId, einheitSchluessel, type Einsatzsammlung, type MeldeEintrag } from "@bos/meldekopf/einsaetze";
import { einsatzCsvInhalt } from "./einsatz-csv";
import { einsatzDetailCsvInhalt } from "./bogen-csv";
import { erreichbarkeitZeilen, namePapier, nichtDarstellbareBetroffene, nichtDarstellbareNamen, umschriftBetroffene } from "./pdf-dokument";
import { neuePerson } from "./hilfen";

function person(over: Partial<Person> = {}): Person {
  return {
    ...neuePerson(),
    vorname: "Hans",
    nachname: "Müller",
    staerkeRolle: StaerkeRolle.MANNSCHAFT,
    fahrerlaubnis: Fahrerlaubnis.NONE,
    ernaehrung: Ernaehrung.FLEISCH,
    ...over,
  };
}

function bogen(name: string, personal: Person[]): Erfassungsbogen {
  return {
    schemaVersion: SCHEMA_VERSION,
    stand: 100,
    einheit: { organisation: OrganisationsTyp.THW, einheitsTyp: { code: 1 }, hierarchie: [{ bezeichnung: { code: 1 }, name, telefon: "040419256910" }] },
    einsatz: { zeitraumVon: 100, zeitraumBis: 130, ortAuftrag: "Lage" },
    personalErfassung: PersonalErfassung.VOLLSTAENDIG,
    personal,
    fahrzeuge: [{ typ: { code: 2 }, kennzeichen: "", funkrufname: { kennwort: { code: 1 }, eigenerStandort: false, ort: "Norderstedt", teile: [22, 51] } }],
  };
}

function meldung(b: Erfassungsbogen, empfangen: number): MeldeEintrag {
  return { id: bogenInhaltsId(b), einheitSchluessel: einheitSchluessel(b.einheit), empfangenAm: empfangen, quelle: "scan", status: MeldeStatus.ANWESEND, bogen: b };
}

const soll = () => bogen("Zulauf Soll", [neuePerson(), neuePerson(), neuePerson()]);
const gemeldet = () => bogen("Ahlen", [person(), person()]);

function sammlung(eintraege: MeldeEintrag[]): Einsatzsammlung {
  return { id: "e1", name: "Testlage", art: 0, angelegt: 0, geaendert: 0, eintraege };
}

describe("Sollstärke im Wort (R9-A2)", () => {
  it("Übersicht-CSV: Marke in der Zeile und Anteil in der Summenzeile", () => {
    const csv = einsatzCsvInhalt(sammlung([meldung(gemeldet(), 1000), meldung(soll(), 2000)]));
    expect(csv).toContain("Sollstärke, nicht gemeldet");
    expect(csv).toMatch(/Summe \(2 Einheiten, davon 3 Personen Sollstärke, nicht gemeldet\)/);
  });
  it("Übersicht-CSV ohne Sollstärke bleibt ohne das Wort", () => {
    const csv = einsatzCsvInhalt(sammlung([meldung(gemeldet(), 1000)]));
    expect(csv).not.toContain("Sollstärke");
  });
  it("„Alle Daten“-CSV trägt es in der Spalte Personalerfassung", () => {
    const csv = einsatzDetailCsvInhalt(sammlung([meldung(soll(), 2000)]));
    expect(csv).toContain("Sollstärke, nicht gemeldet");
  });
});

describe("Rückruf einer Soll-Einheit (R9-A3)", () => {
  it("kennzeichnet Funkrufname und OV-Nummer als Vorbelegung", () => {
    const z = erreichbarkeitZeilen(soll());
    expect(z.join(" ")).toMatch(/Vorbelegung/);
  });
  it("lässt gemeldete Einheiten unverändert", () => {
    // Mit eigener Angabe an der Fahrzeugzeile (Kennzeichen); ohne sie gilt der Funkrufname als Vorbelegung (R11-W4).
    const b = gemeldet();
    b.fahrzeuge[0]!.kennzeichen = "THW-12345";
    const z = erreichbarkeitZeilen(b);
    expect(z.join(" ")).not.toMatch(/Vorbelegung/);
  });
});

describe("Umschrift in der Personenliste (R9-W3)", () => {
  it("namePapier schreibt kyrillische Namen um und vermerkt es, lässt Lateinisches stehen", () => {
    expect(namePapier("Иванова", "Мария")).toBe("Ivanova, Marija (Umschrift)");
    expect(namePapier("Müller", "Hans")).toBe("Müller, Hans");
  });
  it("zählt eine Person einmal und nennt Umschrift getrennt von Nicht-Druckbarem", () => {
    const b = gemeldet();
    b.personal = [person({ vorname: "Мария", nachname: "Иванова" }), person({ vorname: "محمد", nachname: "Ali" })];
    expect(nichtDarstellbareNamen(b)).toBe(1);
    expect(nichtDarstellbareBetroffene(b)).toHaveLength(1);
    expect(umschriftBetroffene(b)).toEqual(["Мария Иванова → Marija Ivanova (Ansprechperson)"]);
  });
});
