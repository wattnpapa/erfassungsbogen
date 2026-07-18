import { describe, it, expect, vi } from "vitest";

// hilfen.ts zieht über ./nativ die Capacitor-Plugins; für die reinen Helfer
// brauchen wir davon nichts. Der Mock hält die Node-Testumgebung frei davon.
vi.mock("./nativ", () => ({
  istNativ: () => false,
  textTeilen: async () => {},
}));

import {
  Ernaehrung,
  Fahrerlaubnis,
  Geschlecht,
  OrganisationsTyp,
  PersonalErfassung,
  StaerkeRolle,
  SCHEMA_VERSION,
  datumAusIso,
  type Erfassungsbogen,
  KontaktArt,
  type Fahrzeug,
  type Person,
} from "../model";
import {
  bogenLaden,
  datumDeutsch,
  funkrufText,
  funktionsText,
  kennzeichenText,
  migriereBogen,
  neuePerson,
  neuerBogen,
  neuesFahrzeug,
  orgLabel,
  plausibilitaet,
  schrittStatus,
  vokabText,
  vokabularFuer,
} from "./hilfen";

// Minimaler File-Ersatz: bogenLaden nutzt nur datei.text().
function jsonDatei(inhalt: string): File {
  return { text: async () => inhalt } as File;
}

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

describe("plausibilitaet()", () => {
  function bogen(over: Partial<Erfassungsbogen> = {}): Erfassungsbogen {
    return { ...neuerBogen(), ...over };
  }

  it("meldet keine Hinweise für einen stimmigen Bogen", () => {
    const basis = neuerBogen();
    const b = bogen({
      einheit: { ...basis.einheit, hierarchie: [{ bezeichnung: { code: 1 }, name: "Oldenburg - Ni" }] },
      einsatz: { ...basis.einsatz, ortAuftrag: "Übung Kabelblitz" },
      personal: [
        person({
          staerkeRolle: StaerkeRolle.FUEHRER,
          geschlecht: Geschlecht.M,
          kontakte: [{ art: KontaktArt.MOBIL, dienstlich: true, wert: "01711234567" }],
        }),
        person({ geschlecht: Geschlecht.W }),
      ],
      fahrzeuge: [{ typ: { code: 1 }, kennzeichen: "THW-84397" }],
    });
    expect(plausibilitaet(b)).toEqual([]);
  });

  it("weist auf den fehlenden Namen der eigenen Einheit hin, nicht aber bei Standort-Referenz", () => {
    const basis = neuerBogen();
    expect(plausibilitaet(bogen()).some((h) => /unterste Ebene/.test(h))).toBe(true);
    const mitRef = bogen({ einheit: { ...basis.einheit, standortRef: 42, hierarchie: [] } });
    expect(plausibilitaet(mitRef).some((h) => /unterste Ebene/.test(h))).toBe(false);
  });

  it("weist auf leeren Ort/Auftrag, fehlende Erreichbarkeit und Fahrzeuge ohne Kennzeichen hin", () => {
    const b = bogen({
      personal: [person({ staerkeRolle: StaerkeRolle.FUEHRER })], // ohne Kontakte
      fahrzeuge: [{ typ: { code: 1 } }],
    });
    const hinweise = plausibilitaet(b);
    expect(hinweise.some((h) => /Ort\/Auftrag/.test(h))).toBe(true);
    expect(hinweise.some((h) => /telefonische Erreichbarkeit/.test(h))).toBe(true);
    expect(hinweise.some((h) => /Fahrzeug 1.*kein Kennzeichen/.test(h))).toBe(true);
  });

  it("zählt eMail nicht als telefonische Erreichbarkeit, ein ziviles Kennzeichen aber als Kennzeichen", () => {
    const basis = neuerBogen();
    const b = bogen({
      einsatz: { ...basis.einsatz, ortAuftrag: "X" },
      personal: [person({ kontakte: [{ art: KontaktArt.EMAIL, dienstlich: true, wert: "a@b.de" }] })],
      fahrzeuge: [{ typ: { code: 1 }, kennzeichen: "OL-FW 2041" }],
    });
    const hinweise = plausibilitaet(b);
    expect(hinweise.some((h) => /telefonische Erreichbarkeit/.test(h))).toBe(true);
    expect(hinweise.some((h) => /Kennzeichen/.test(h) && /Fahrzeug/.test(h))).toBe(false);
  });

  it("weist auf eine Stärke von 0 hin", () => {
    expect(plausibilitaet(bogen()).some((h) => /Stärke ist 0/.test(h))).toBe(true);
  });

  it("erkennt einen umgedrehten Einsatzzeitraum", () => {
    const b = bogen({
      personal: [person()],
      einsatz: { zeitraumVon: datumAusIso("2025-05-17"), zeitraumBis: datumAusIso("2025-05-14"), ortAuftrag: "X" },
    });
    expect(plausibilitaet(b).some((h) => /„bis“ liegt vor „von“/.test(h))).toBe(true);
  });

  it("prüft die Unterbringungssumme nur bei belastbarer Grundlage (Meldekopf ohne manuelle Angabe: kein Hinweis)", () => {
    const b = bogen({
      personalErfassung: PersonalErfassung.NUR_STAERKE,
      personal: [],
      staerkeManuell: { fuehrer: 1, unterfuehrer: 0, mannschaft: 9, gesamt: 10 },
    });
    expect(plausibilitaet(b).some((h) => /Unterbringung/.test(h))).toBe(false);
  });

  it("meldet Verpflegung für mehr Personen als die Gesamtstärke", () => {
    const b = bogen({
      personal: [person()],
      sofortbedarf: { verpflegungPersonen: 5, dieselLiter: 0, benzinLiter: 0, gemischLiter: 0, unterbringung: false, ruhezeitErforderlich: false },
    });
    expect(plausibilitaet(b).some((h) => /Verpflegung für 5 Personen/.test(h))).toBe(true);
  });
});

describe("migriereBogen() (JSON-Pfad, muss zum Codec passen)", () => {
  it("hebt einen v2-Bogen auf die aktuelle Version und rettet davonVegetarisch", () => {
    const alt = {
      schemaVersion: 2,
      stand: 0,
      einheit: { organisation: OrganisationsTyp.THW, einheitsTyp: { code: 43 }, hierarchie: [{ bezeichnung: { code: 1 }, name: "OV" }] },
      einsatz: { zeitraumVon: 0, zeitraumBis: 0, ortAuftrag: "" },
      personalErfassung: PersonalErfassung.VOLLSTAENDIG,
      // v2-Person ohne ernaehrung:
      personal: [{ vorname: "A", nachname: "B", staerkeRolle: 0, funktionen: [], fahrerlaubnis: 0, geschlecht: 0, kontakte: [], zusatzqualifikationen: [] }],
      fahrzeuge: [],
      sofortbedarf: { verpflegungPersonen: 10, davonVegetarisch: 4, dieselLiter: 0, benzinLiter: 0, gemischLiter: 0, unterbringung: false, ruhezeitErforderlich: false },
    } as unknown as Erfassungsbogen;

    const b = migriereBogen(alt);
    expect(b.schemaVersion).toBe(SCHEMA_VERSION);
    expect(b.personal[0]!.ernaehrung).toBe(Ernaehrung.FLEISCH);
    expect(b.verpflegungManuell).toEqual({ vegetarisch: 4, vegan: 0 });
    // Das Alt-Feld darf nicht im Sofortbedarf zurückbleiben.
    expect((b.sofortbedarf as unknown as Record<string, unknown>).davonVegetarisch).toBeUndefined();
  });

  it("führt die getrennten Kennzeichenfelder eines v3-Bogens zusammen", () => {
    const alt = {
      ...neuerBogen(),
      schemaVersion: 3,
      fahrzeuge: [
        { typ: { code: 1 }, thwKennzeichen: 84397 },
        { typ: { code: 2 }, thwKennzeichen: 12 },
        { typ: { code: 3 }, kennzeichenFreitext: "OL-FW 2041" },
      ],
    } as unknown as Erfassungsbogen;

    const b = migriereBogen(alt);
    expect(b.fahrzeuge.map((f) => f.kennzeichen)).toEqual(["THW-84397", "THW-00012", "OL-FW 2041"]);
    // Die Alt-Felder dürfen nicht zurückbleiben.
    const roh = b.fahrzeuge as unknown as Record<string, unknown>[];
    expect(roh.every((f) => !("thwKennzeichen" in f) && !("kennzeichenFreitext" in f))).toBe(true);
  });
});

describe("bogenLaden() (JSON-Datei)", () => {
  it("lädt einen gültigen aktuellen Bogen und hebt ihn aufs aktuelle Schema", async () => {
    const bogen = { ...neuerBogen(), einheit: { ...neuerBogen().einheit, hierarchie: [{ bezeichnung: { code: 1 }, name: "OV Test" }] } };
    const b = await bogenLaden(jsonDatei(JSON.stringify(bogen)));
    expect(b.schemaVersion).toBe(SCHEMA_VERSION);
    expect(b.einheit.hierarchie[0]!.name).toBe("OV Test");
  });

  it("migriert einen alten v2-Bogen (Ernährung, davonVegetarisch)", async () => {
    const alt = {
      schemaVersion: 2,
      stand: 0,
      einheit: { organisation: OrganisationsTyp.THW, einheitsTyp: { code: 43 }, hierarchie: [{ bezeichnung: { code: 1 }, name: "OV" }] },
      einsatz: { zeitraumVon: 0, zeitraumBis: 0, ortAuftrag: "" },
      personalErfassung: PersonalErfassung.VOLLSTAENDIG,
      personal: [{ vorname: "A", nachname: "B", staerkeRolle: 0, funktionen: [], fahrerlaubnis: 0, geschlecht: 0, kontakte: [], zusatzqualifikationen: [] }],
      fahrzeuge: [],
      sofortbedarf: { verpflegungPersonen: 5, davonVegetarisch: 2, dieselLiter: 0, benzinLiter: 0, gemischLiter: 0, unterbringung: false, ruhezeitErforderlich: false },
    };
    const b = await bogenLaden(jsonDatei(JSON.stringify(alt)));
    expect(b.schemaVersion).toBe(SCHEMA_VERSION);
    expect(b.personal[0]!.ernaehrung).toBe(Ernaehrung.FLEISCH);
    expect(b.verpflegungManuell).toEqual({ vegetarisch: 2, vegan: 0 });
  });

  it("lehnt kaputtes JSON ab", async () => {
    await expect(bogenLaden(jsonDatei("{ kein json"))).rejects.toThrow(/kein gültiges JSON/i);
  });

  it("lehnt eine zu neue Schema-Version ab", async () => {
    const b = { ...neuerBogen(), schemaVersion: SCHEMA_VERSION + 1 };
    await expect(bogenLaden(jsonDatei(JSON.stringify(b)))).rejects.toThrow(/gültige Erfassungsbogen-Datei/i);
  });

  it("lehnt eine zu alte Schema-Version ab", async () => {
    const b = { ...neuerBogen(), schemaVersion: 1 };
    await expect(bogenLaden(jsonDatei(JSON.stringify(b)))).rejects.toThrow(/gültige Erfassungsbogen-Datei/i);
  });

  it("lehnt eine Datei ohne Pflichtstruktur ab", async () => {
    await expect(bogenLaden(jsonDatei(JSON.stringify({ schemaVersion: SCHEMA_VERSION })))).rejects.toThrow(
      /gültige Erfassungsbogen-Datei/i,
    );
  });
});

describe("plausibilitaet() — weitere Zweige", () => {
  function bogen(over: Partial<Erfassungsbogen> = {}): Erfassungsbogen {
    return { ...neuerBogen(), ...over };
  }

  it("erkennt eine manuelle Stärke, deren Summe nicht zur Gesamtstärke passt", () => {
    const b = bogen({
      personalErfassung: PersonalErfassung.NUR_STAERKE,
      personal: [],
      staerkeManuell: { fuehrer: 1, unterfuehrer: 1, mannschaft: 1, gesamt: 5 },
    });
    expect(plausibilitaet(b).some((h) => /ergibt nicht die Gesamtstärke/.test(h))).toBe(true);
  });

  it("erkennt bei vollständiger Erfassung eine falsche manuelle Unterbringungssumme", () => {
    const b = bogen({
      personal: [person(), person()],
      unterbringungManuell: { m: 1, w: 0, d: 0 },
    });
    expect(plausibilitaet(b).some((h) => /Unterbringung/.test(h))).toBe(true);
  });

  it("warnt, wenn im Meldekopf-Modus mehr Ansprechpartner als die Gesamtstärke erfasst sind", () => {
    const b = bogen({
      personalErfassung: PersonalErfassung.NUR_STAERKE,
      personal: [person(), person()],
      staerkeManuell: { fuehrer: 0, unterfuehrer: 0, mannschaft: 1, gesamt: 1 },
    });
    expect(plausibilitaet(b).some((h) => /Ansprechpartner erfasst/.test(h))).toBe(true);
  });

  it("warnt im Meldekopf-Modus, wenn veg + vegan die Gesamtstärke übersteigen (auch ohne Sofortbedarf)", () => {
    const b = bogen({
      personalErfassung: PersonalErfassung.NUR_STAERKE,
      personal: [],
      staerkeManuell: { fuehrer: 0, unterfuehrer: 0, mannschaft: 5, gesamt: 5 },
      verpflegungManuell: { vegetarisch: 4, vegan: 3 },
    });
    expect(plausibilitaet(b).some((h) => /übersteigen die Gesamtstärke 5/.test(h))).toBe(true);
  });

  it("warnt nicht, wenn veg + vegan die Gesamtstärke einhalten", () => {
    const b = bogen({
      personalErfassung: PersonalErfassung.NUR_STAERKE,
      personal: [],
      staerkeManuell: { fuehrer: 0, unterfuehrer: 0, mannschaft: 5, gesamt: 5 },
      verpflegungManuell: { vegetarisch: 2, vegan: 1 },
    });
    expect(plausibilitaet(b).some((h) => /übersteigen die Gesamtstärke/.test(h))).toBe(false);
  });

  it("warnt, wenn mehr Vegetarier/Veganer als Verpflegungsbedarf erfasst sind", () => {
    const b = bogen({
      personalErfassung: PersonalErfassung.NUR_STAERKE,
      personal: [],
      staerkeManuell: { fuehrer: 0, unterfuehrer: 0, mannschaft: 5, gesamt: 5 },
      verpflegungManuell: { vegetarisch: 3, vegan: 0 },
      sofortbedarf: { verpflegungPersonen: 1, dieselLiter: 0, benzinLiter: 0, gemischLiter: 0, unterbringung: false, ruhezeitErforderlich: false },
    });
    expect(plausibilitaet(b).some((h) => /mehr Vegetarier\/Veganer/.test(h))).toBe(true);
  });
});

describe("Konstruktoren für neue Objekte", () => {
  it("neuerBogen() ist ein leerer THW-Bogen der aktuellen Schema-Version", () => {
    const b = neuerBogen();
    expect(b.schemaVersion).toBe(SCHEMA_VERSION);
    expect(b.einheit.organisation).toBe(OrganisationsTyp.THW);
    expect(b.personal).toEqual([]);
    expect(b.fahrzeuge).toEqual([]);
    expect(b.einsatz.zeitraumVon).toBe(b.einsatz.zeitraumBis);
  });

  it("neuePerson()/neuesFahrzeug() liefern sinnvolle Defaults", () => {
    const p = neuePerson();
    expect(p).toMatchObject({ vorname: "", nachname: "", fahrerlaubnis: Fahrerlaubnis.NONE, ernaehrung: Ernaehrung.FLEISCH });
    expect(neuesFahrzeug()).toEqual({ typ: {} });
  });
});

describe("schrittStatus", () => {
  it("meldet für einen leeren Bogen alle Schritte als leer", () => {
    expect(schrittStatus(neuerBogen())).toEqual(["leer", "leer", "leer", "leer", "leer"]);
  });

  it("meldet einen vollständig gefüllten Bogen als ok", () => {
    const b = neuerBogen();
    b.einheit.einheitsTyp = { code: 43 };
    b.einheit.hierarchie = [{ bezeichnung: { code: 1 }, name: "OV Oldenburg - Ni" }];
    b.einsatz.ortAuftrag = "Übung Kabelblitz";
    b.personal = [neuePerson()];
    b.fahrzeuge = [neuesFahrzeug()];
    b.sofortbedarf = { verpflegungPersonen: 1, dieselLiter: 0, benzinLiter: 0, gemischLiter: 0, unterbringung: false, ruhezeitErforderlich: false };
    expect(schrittStatus(b)).toEqual(["ok", "ok", "ok", "ok", "ok"]);
  });

  it("erkennt Zwischenzustände als begonnen", () => {
    const b = neuerBogen();
    b.einheit.hierarchie = [{ bezeichnung: { code: 1 }, name: "OV X" }]; // Typ fehlt noch → begonnen
    b.einsatz.einsatzbeginn = 1000; // Ort fehlt noch → begonnen
    b.personalErfassung = PersonalErfassung.NUR_STAERKE;
    b.staerkeManuell = { fuehrer: 0, unterfuehrer: 0, mannschaft: 0, gesamt: 0 };
    b.personal = [neuePerson()]; // Ansprechpartner erfasst, Stärke aber 0 → begonnen
    const s = schrittStatus(b);
    expect(s[0]).toBe("begonnen");
    expect(s[1]).toBe("begonnen");
    expect(s[2]).toBe("begonnen");
  });
});
