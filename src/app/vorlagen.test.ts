import { describe, it, expect, beforeEach } from "vitest";
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
import {
  bogenAlsVorlage,
  vorlageInstanziieren,
  vorlagenAusJson,
  vorlagenZuJson,
  vorlageAnlegen,
  vorlageUmbenennen,
  vorlageLoeschen,
  vorlagenLaden,
  type Vorlage,
} from "./vorlagen";

class MemStorage {
  private m = new Map<string, string>();
  get length() {
    return this.m.size;
  }
  clear() {
    this.m.clear();
  }
  getItem(k: string) {
    return this.m.has(k) ? this.m.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, String(v));
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
  key(i: number) {
    return [...this.m.keys()][i] ?? null;
  }
}

beforeEach(() => {
  (globalThis as { localStorage?: Storage }).localStorage = new MemStorage() as unknown as Storage;
});

function person(nachname: string, rolle: StaerkeRolle): Person {
  return {
    vorname: "T",
    nachname,
    staerkeRolle: rolle,
    funktionen: [],
    fahrerlaubnis: Fahrerlaubnis.NONE,
    geschlecht: Geschlecht.M,
    ernaehrung: Ernaehrung.FLEISCH,
    kontakte: [],
    zusatzqualifikationen: [],
  };
}

function bogen(): Erfassungsbogen {
  return {
    schemaVersion: SCHEMA_VERSION,
    stand: 100,
    einheit: { organisation: OrganisationsTyp.THW, einheitsTyp: { code: 1 }, name: "OV Test", hierarchie: [] },
    einsatz: { zeitraumVon: 100, zeitraumBis: 130, ortAuftrag: "Übung Kabelblitz", einsatzbeginn: 999 },
    personalErfassung: PersonalErfassung.VOLLSTAENDIG,
    personal: [person("Berger", StaerkeRolle.UNTERFUEHRER), person("Ahlers", StaerkeRolle.MANNSCHAFT), person("Voss", StaerkeRolle.MANNSCHAFT)],
    fahrzeuge: [{ typ: { code: 2 }, thwKennzeichen: 84397 }, { typ: { code: 3 }, thwKennzeichen: 84401 }],
    sofortbedarf: { verpflegungPersonen: 3, dieselLiter: 50, benzinLiter: 0, gemischLiter: 0, unterbringung: true, ruhezeitErforderlich: false },
  };
}

describe("bogenAlsVorlage()", () => {
  it("setzt den Einsatz zurück, behält Personal, Fahrzeuge und Sofortbedarf", () => {
    const v = bogenAlsVorlage(bogen());
    expect(v.einsatz.ortAuftrag).toBe("");
    expect(v.einsatz.einsatzbeginn).toBeUndefined();
    expect(v.einsatz.zeitraumVon).toBe(v.einsatz.zeitraumBis); // beide = heute
    expect(v.personal).toHaveLength(3);
    expect(v.fahrzeuge).toHaveLength(2);
    expect(v.sofortbedarf?.unterbringung).toBe(true);
  });

  it("kopiert tief — die Quelle bleibt unangetastet", () => {
    const quelle = bogen();
    const v = bogenAlsVorlage(quelle);
    v.personal[0]!.nachname = "Geändert";
    expect(quelle.personal[0]!.nachname).toBe("Berger");
    expect(quelle.einsatz.ortAuftrag).toBe("Übung Kabelblitz");
  });
});

describe("vorlageInstanziieren()", () => {
  it("übernimmt nur die angehakten Personen/Fahrzeuge", () => {
    const arbeit = vorlageInstanziieren(bogen(), {
      personal: [true, false, true],
      fahrzeuge: [true, false],
    });
    expect(arbeit.personal.map((p) => p.nachname)).toEqual(["Berger", "Voss"]);
    expect(arbeit.fahrzeuge).toHaveLength(1);
    expect(arbeit.einsatz.ortAuftrag).toBe(""); // frischer Einsatz
  });

  it("wertet fehlende Auswahl-Einträge als anwesend", () => {
    const arbeit = vorlageInstanziieren(bogen(), { personal: [true], fahrzeuge: [] });
    expect(arbeit.personal).toHaveLength(3);
    expect(arbeit.fahrzeuge).toHaveLength(2);
  });
});

describe("Serialisierung", () => {
  it("überlebt einen JSON-Roundtrip", () => {
    const liste: Vorlage[] = [{ id: "a", name: "A", erstellt: 1, geaendert: 2, bogen: bogenAlsVorlage(bogen()) }];
    expect(vorlagenAusJson(vorlagenZuJson(liste))).toEqual(liste);
  });

  it("ist defensiv gegen Müll und überspringt kaputte Einträge", () => {
    expect(vorlagenAusJson(null)).toEqual([]);
    expect(vorlagenAusJson("kein json")).toEqual([]);
    expect(vorlagenAusJson('{"x":1}')).toEqual([]);
    expect(vorlagenAusJson('[{"id":"ok"}]')).toEqual([]); // ohne bogen
  });

  it("hebt alte Schema-Versionen beim Laden (Migration)", () => {
    const alt = bogenAlsVorlage(bogen());
    alt.schemaVersion = 2;
    const geladen = vorlagenAusJson(JSON.stringify([{ id: "a", name: "A", erstellt: 1, geaendert: 1, bogen: alt }]));
    expect(geladen[0]!.bogen.schemaVersion).toBe(SCHEMA_VERSION);
  });
});

describe("CRUD über localStorage", () => {
  it("legt an, lädt (einsatzfrei), benennt um und löscht", () => {
    const v = vorlageAnlegen("Meine Mannschaft", bogen());
    const geladen = vorlagenLaden();
    expect(geladen).toHaveLength(1);
    expect(geladen[0]!.name).toBe("Meine Mannschaft");
    expect(geladen[0]!.bogen.einsatz.ortAuftrag).toBe(""); // normalisiert

    vorlageUmbenennen(v.id, "Neuer Name");
    expect(vorlagenLaden()[0]!.name).toBe("Neuer Name");

    vorlageLoeschen(v.id);
    expect(vorlagenLaden()).toEqual([]);
  });

  it("nutzt den Einheitsnamen, wenn kein Name angegeben ist", () => {
    vorlageAnlegen("   ", bogen());
    expect(vorlagenLaden()[0]!.name).toBe("OV Test");
  });
});
