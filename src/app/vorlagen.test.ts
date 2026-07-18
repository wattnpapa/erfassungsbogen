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
  vorlageWiederherstellen,
  vorlageEndgueltigLoeschen,
  vorlagenLaden,
  vorlagenPapierkorb,
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
    fahrzeuge: [{ typ: { code: 2 }, kennzeichen: "THW-84397" }, { typ: { code: 3 }, kennzeichen: "THW-84401" }],
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

describe("Papierkorb", () => {
  it("löschen verschiebt in den Papierkorb, wiederherstellen holt zurück", () => {
    const v = vorlageAnlegen("A", bogen());
    vorlageLoeschen(v.id);
    expect(vorlagenLaden()).toEqual([]);
    expect(vorlagenPapierkorb().map((x) => x.id)).toEqual([v.id]);

    vorlageWiederherstellen(v.id);
    expect(vorlagenLaden().map((x) => x.id)).toEqual([v.id]);
    expect(vorlagenLaden()[0]!.geloeschtAm).toBeUndefined();
    expect(vorlagenPapierkorb()).toEqual([]);
  });

  it("endgültig löschen entfernt den Eintrag komplett", () => {
    const v = vorlageAnlegen("A", bogen());
    vorlageLoeschen(v.id);
    vorlageEndgueltigLoeschen(v.id);
    expect(vorlagenLaden()).toEqual([]);
    expect(vorlagenPapierkorb()).toEqual([]);
  });

  it("Mutationen (anlegen/umbenennen) lassen Papierkorb-Einträge unangetastet", () => {
    const geloescht = vorlageAnlegen("Weg", bogen());
    vorlageLoeschen(geloescht.id);
    const bleibt = vorlageAnlegen("Bleibt", bogen());
    vorlageUmbenennen(bleibt.id, "Bleibt 2");
    expect(vorlagenLaden().map((x) => x.name)).toEqual(["Bleibt 2"]);
    expect(vorlagenPapierkorb().map((x) => x.id)).toEqual([geloescht.id]);
  });

  it("abgelaufene Einträge werden beim Laden endgültig bereinigt", () => {
    const v = vorlageAnlegen("Alt", bogen());
    vorlageLoeschen(v.id);
    // Löschzeitpunkt künstlich 31 Tage in die Vergangenheit setzen.
    const roh = JSON.parse(localStorage.getItem("eeb.vorlagen.v1")!) as Vorlage[];
    roh[0]!.geloeschtAm = Date.now() - 31 * 24 * 60 * 60 * 1000;
    localStorage.setItem("eeb.vorlagen.v1", JSON.stringify(roh));

    expect(vorlagenPapierkorb()).toEqual([]);
    expect(JSON.parse(localStorage.getItem("eeb.vorlagen.v1")!)).toEqual([]); // persistiert
  });
});
