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
import { FELD_GESAMTSTAERKE, bogenDiff, diffKurzfassung } from "./meldung-diff";

function person(nachname: string, vorname: string, rolle = StaerkeRolle.MANNSCHAFT, over: Partial<Person> = {}): Person {
  return {
    nachname,
    vorname,
    staerkeRolle: rolle,
    funktionen: [],
    fahrerlaubnis: Fahrerlaubnis.NONE,
    geschlecht: Geschlecht.M,
    ernaehrung: Ernaehrung.FLEISCH,
    kontakte: [],
    zusatzqualifikationen: [],
    ...over,
  };
}

function bogen(over: Partial<Erfassungsbogen> = {}): Erfassungsbogen {
  return {
    schemaVersion: SCHEMA_VERSION,
    stand: 2000,
    einheit: {
      organisation: OrganisationsTyp.THW,
      einheitsTyp: { code: 1 },
      hierarchie: [{ bezeichnung: { code: 1 }, name: "Oldenburg" }],
    },
    einsatz: { zeitraumVon: 2000, zeitraumBis: 2003, ortAuftrag: "Deichverteidigung" },
    personalErfassung: PersonalErfassung.VOLLSTAENDIG,
    personal: [person("Müller", "Hans", StaerkeRolle.FUEHRER), person("Schmidt", "Eva")],
    fahrzeuge: [{ typ: { code: 2 }, kennzeichen: "THW-00001" }],
    sofortbedarf: {
      verpflegungPersonen: 2,
      dieselLiter: 40,
      benzinLiter: 0,
      gemischLiter: 0,
      unterbringung: false,
      ruhezeitErforderlich: false,
    },
    ...over,
  };
}

describe("bogenDiff()", () => {
  it("meldet für zwei identische Fassungen keine Änderung", () => {
    const d = bogenDiff(bogen(), bogen());
    expect(d.anzahl).toBe(0);
    expect(diffKurzfassung(d)).toBe("");
  });

  it("zeigt die Stärkeveränderung je Rolle und in der Gesamtsumme", () => {
    const alt = bogen({
      personalErfassung: PersonalErfassung.NUR_STAERKE,
      personal: [],
      staerkeManuell: { fuehrer: 1, unterfuehrer: 2, mannschaft: 9, gesamt: 12 },
    });
    const neu = bogen({
      personalErfassung: PersonalErfassung.NUR_STAERKE,
      personal: [],
      staerkeManuell: { fuehrer: 1, unterfuehrer: 2, mannschaft: 6, gesamt: 9 },
    });
    const d = bogenDiff(alt, neu);
    expect(d.staerke).toEqual([
      { feld: "Mannschaft", vorher: "9", nachher: "6" },
      { feld: FELD_GESAMTSTAERKE, vorher: "12", nachher: "9" },
    ]);
    expect(diffKurzfassung(d)).toBe("Stärke 12 → 9");
  });

  it("führt Personal-Zugang und -Abgang getrennt auf", () => {
    const alt = bogen();
    const neu = bogen({
      personal: [person("Müller", "Hans", StaerkeRolle.FUEHRER), person("Meyer", "Ina")],
    });
    const d = bogenDiff(alt, neu);
    expect(d.personalAbgang).toEqual(["Schmidt, Eva (Mannschaft)"]);
    expect(d.personalZugang).toEqual(["Meyer, Ina (Mannschaft)"]);
  });

  it("erkennt Rollen- und Erreichbarkeitswechsel derselben Person", () => {
    const alt = bogen();
    const neu = bogen({
      personal: [
        person("Müller", "Hans", StaerkeRolle.FUEHRER, {
          kontakte: [{ art: KontaktArt.MOBIL, dienstlich: true, wert: "01711234567" }],
        }),
        person("Schmidt", "Eva", StaerkeRolle.UNTERFUEHRER),
      ],
    });
    const d = bogenDiff(alt, neu);
    expect(d.personalGeaendert).toEqual([
      { feld: "Müller, Hans — Erreichbarkeit", vorher: "—", nachher: "Mobil: 01711234567 (D)" },
      { feld: "Schmidt, Eva — Funktion", vorher: "Mannschaft", nachher: "Unterführer" },
    ]);
    expect(d.personalZugang).toEqual([]);
    expect(d.personalAbgang).toEqual([]);
  });

  it("paart Namensgleiche der Reihe nach; Überzählige sind Zu-/Abgang", () => {
    const alt = bogen({ personal: [person("Meyer", "Jan"), person("Meyer", "Jan")] });
    const neu = bogen({ personal: [person("Meyer", "Jan")] });
    const d = bogenDiff(alt, neu);
    expect(d.personalAbgang).toEqual(["Meyer, Jan (Mannschaft)"]);
    expect(d.personalGeaendert).toEqual([]);
  });

  it("meldet ein abgemeldetes Fahrzeug", () => {
    const alt = bogen({
      fahrzeuge: [{ typ: { code: 2 }, kennzeichen: "THW-00001" }, { typ: { code: 3 }, kennzeichen: "THW-00002" }],
    });
    const d = bogenDiff(alt, bogen());
    expect(d.fahrzeugeAbgang).toHaveLength(1);
    expect(d.fahrzeugeAbgang[0]).toContain("THW-00002");
    expect(diffKurzfassung(d)).toBe("1 Fahrzeug abgemeldet");
  });

  it("erkennt Änderungen an einem Fahrzeug über das Kennzeichen", () => {
    const alt = bogen();
    const neu = bogen({
      fahrzeuge: [{ typ: { code: 2 }, kennzeichen: "THW-00001", stanKonform: false, aenderungen: "Winde defekt" }],
    });
    const d = bogenDiff(alt, neu);
    expect(d.fahrzeugeZugang).toEqual([]);
    expect(d.fahrzeugeGeaendert.map((a) => a.feld.split(" — ")[1])).toEqual(["StAN/Norm", "Änderungen"]);
  });

  it("zeigt Änderungen am Sofortbedarf", () => {
    const neu = bogen({
      sofortbedarf: {
        verpflegungPersonen: 2,
        dieselLiter: 120,
        benzinLiter: 0,
        gemischLiter: 0,
        unterbringung: true,
        ruhezeitErforderlich: true,
      },
    });
    const d = bogenDiff(bogen(), neu);
    expect(d.bedarf).toEqual([
      { feld: "Diesel", vorher: "40 l", nachher: "120 l" },
      { feld: "Unterbringung angefordert", vorher: "nein", nachher: "ja" },
      { feld: "Ruhezeit erforderlich", vorher: "nein", nachher: "ja" },
    ]);
  });

  it("zeigt Auftrags- und Zeitänderungen unter Sonstiges", () => {
    const neu = bogen({
      einsatz: { zeitraumVon: 2000, zeitraumBis: 2005, ortAuftrag: "Sandsackverbau", einsatzende: 2000 * 1440 },
    });
    const d = bogenDiff(bogen(), neu);
    expect(d.sonstiges.map((a) => a.feld)).toEqual(["Ort / Auftrag", "Zeitraum", "Einsatzende"]);
  });

  it("nennt in der Kurzfassung sonst die reine Anzahl", () => {
    const neu = bogen({ sonstiges: "Trupp verbleibt vor Ort" });
    expect(diffKurzfassung(bogenDiff(bogen(), neu))).toBe("1 Änderung");
  });
});
