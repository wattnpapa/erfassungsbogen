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
  EinsatzArt,
  MeldeStatus,
  einheitSchluessel,
  bogenInhaltsId,
  neuesteJeEinheit,
  revisionen,
  einsaetzeAusJson,
  einsaetzeZuJson,
  einsatzAnlegen,
  einsatzLoeschen,
  einsaetzeLaden,
  meldungHinzufuegen,
  meldungStatusSetzen,
  meldungEntfernen,
  type Einsatzsammlung,
} from "./einsaetze";

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

function bogen(over: Partial<Erfassungsbogen> = {}): Erfassungsbogen {
  return {
    schemaVersion: SCHEMA_VERSION,
    stand: 100,
    einheit: { organisation: OrganisationsTyp.THW, einheitsTyp: { code: 1 }, name: "OV Oldenburg", hierarchie: [] },
    einsatz: { zeitraumVon: 100, zeitraumBis: 130, ortAuftrag: "Übung Kabelblitz" },
    personalErfassung: PersonalErfassung.VOLLSTAENDIG,
    personal: [person("Berger", StaerkeRolle.UNTERFUEHRER), person("Ahlers", StaerkeRolle.MANNSCHAFT)],
    fahrzeuge: [{ typ: { code: 2 }, thwKennzeichen: 84397 }],
    ...over,
  };
}

describe("einheitSchluessel()", () => {
  it("nutzt den Standort-Ref, wenn vorhanden (stabil gegen Namensschreibweise)", () => {
    const a = einheitSchluessel({ ...bogen().einheit, standortRef: 42, name: "OV Oldenburg" });
    const b = einheitSchluessel({ ...bogen().einheit, standortRef: 42, name: "Oldenburg – Ni" });
    expect(a).toBe(b);
    expect(a).toContain("ref:42");
  });

  it("fällt ohne Ref auf Organisation + Typ + normalisierten Namen zurück", () => {
    const a = einheitSchluessel(bogen().einheit);
    const b = einheitSchluessel({ ...bogen().einheit, name: "  ov   OLDENBURG " });
    expect(a).toBe(b); // Normalisierung: klein, getrimmt, Whitespace kollabiert
  });

  it("unterscheidet verschiedene Einheiten", () => {
    const a = einheitSchluessel(bogen().einheit);
    const b = einheitSchluessel({ ...bogen().einheit, name: "OV Wardenburg" });
    expect(a).not.toBe(b);
  });
});

describe("bogenInhaltsId()", () => {
  it("ist stabil für gleichen Inhalt und verschieden bei Änderung", () => {
    expect(bogenInhaltsId(bogen())).toBe(bogenInhaltsId(bogen()));
    expect(bogenInhaltsId(bogen())).not.toBe(bogenInhaltsId(bogen({ stand: 101 })));
  });
});

describe("meldungHinzufuegen() — Idempotenz & Historie", () => {
  it("nimmt einen neuen Bogen als Meldung auf", () => {
    const s = einsatzAnlegen("Hochwasser 2026", EinsatzArt.EINSATZ, "Oldenburg");
    const r = meldungHinzufuegen(s.id, bogen(), { quelle: "scan" });
    expect(r?.neu).toBe(true);
    expect(r?.eintrag.status).toBe(MeldeStatus.ANWESEND);
    expect(einsaetzeLaden()[0]!.eintraege).toHaveLength(1);
  });

  it("überspringt denselben Bogeninhalt (Doppelmeldeweg / Reimport)", () => {
    const s = einsatzAnlegen("E", EinsatzArt.EINSATZ);
    const erst = meldungHinzufuegen(s.id, bogen());
    const nochmal = meldungHinzufuegen(s.id, bogen());
    expect(nochmal?.neu).toBe(false);
    expect(nochmal?.eintrag.id).toBe(erst?.eintrag.id);
    expect(einsaetzeLaden()[0]!.eintraege).toHaveLength(1);
  });

  it("stapelt eine neue Fassung derselben Einheit als Revision", () => {
    const s = einsatzAnlegen("E", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogen({ stand: 100 }));
    meldungHinzufuegen(s.id, bogen({ stand: 101, personal: [person("Berger", StaerkeRolle.FUEHRER)] }));
    const eintraege = einsaetzeLaden()[0]!.eintraege;
    expect(eintraege).toHaveLength(2);
    // gleiche Einheit → gleicher Schlüssel
    expect(eintraege[0]!.einheitSchluessel).toBe(eintraege[1]!.einheitSchluessel);
  });

  it("gibt null zurück, wenn der Einsatz nicht existiert", () => {
    expect(meldungHinzufuegen("gibtsnicht", bogen())).toBeNull();
  });

  it("respektiert einen manuell bestätigten Zuordnungs-Override", () => {
    const s = einsatzAnlegen("E", EinsatzArt.EINSATZ);
    const r = meldungHinzufuegen(s.id, bogen(), { einheitSchluesselOverride: "manuell:zug1" });
    expect(r?.eintrag.einheitSchluessel).toBe("manuell:zug1");
  });
});

describe("neuesteJeEinheit() & revisionen()", () => {
  it("liefert je Einheit nur die neueste Fassung (nach stand)", () => {
    const s = einsatzAnlegen("E", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogen({ stand: 100 }));
    meldungHinzufuegen(s.id, bogen({ stand: 102 }));
    meldungHinzufuegen(s.id, bogen({ einheit: { ...bogen().einheit, name: "OV Wardenburg" } }));
    const kopf = neuesteJeEinheit(einsaetzeLaden()[0]!.eintraege);
    expect(kopf).toHaveLength(2); // zwei Einheiten
    const ol = kopf.find((e) => e.einheitSchluessel.includes("oldenburg"));
    expect(ol?.bogen.stand).toBe(102);
  });

  it("gibt Revisionen einer Einheit neueste-zuerst zurück", () => {
    const s = einsatzAnlegen("E", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogen({ stand: 100 }));
    meldungHinzufuegen(s.id, bogen({ stand: 103 }));
    const eintraege = einsaetzeLaden()[0]!.eintraege;
    const schl = eintraege[0]!.einheitSchluessel;
    const revs = revisionen(eintraege, schl);
    expect(revs.map((r) => r.bogen.stand)).toEqual([103, 100]);
  });
});

describe("Status & Löschen", () => {
  it("setzt eine Meldung auf abgerückt", () => {
    const s = einsatzAnlegen("E", EinsatzArt.EINSATZ);
    const r = meldungHinzufuegen(s.id, bogen())!;
    meldungStatusSetzen(s.id, r.eintrag.id, MeldeStatus.ABGERUECKT);
    expect(einsaetzeLaden()[0]!.eintraege[0]!.status).toBe(MeldeStatus.ABGERUECKT);
  });

  it("entfernt eine Meldung und löscht einen Einsatz", () => {
    const s = einsatzAnlegen("E", EinsatzArt.EINSATZ);
    const r = meldungHinzufuegen(s.id, bogen())!;
    meldungEntfernen(s.id, r.eintrag.id);
    expect(einsaetzeLaden()[0]!.eintraege).toHaveLength(0);
    einsatzLoeschen(s.id);
    expect(einsaetzeLaden()).toHaveLength(0);
  });
});

describe("Serialisierung", () => {
  it("überlebt einen JSON-Roundtrip", () => {
    const s = einsatzAnlegen("E", EinsatzArt.UEBUNG, "Ort");
    meldungHinzufuegen(s.id, bogen());
    const wieder = einsaetzeAusJson(einsaetzeZuJson(einsaetzeLaden()));
    expect(wieder[0]!.name).toBe("E");
    expect(wieder[0]!.eintraege).toHaveLength(1);
  });

  it("überspringt kaputte Einträge statt alles zu verlieren", () => {
    const kaputt: unknown = [
      { id: "s1", name: "E", art: 0, angelegt: 1, geaendert: 1, eintraege: [{ id: "x" /* kein bogen */ }] },
      "unsinn",
    ];
    const liste = einsaetzeAusJson(JSON.stringify(kaputt));
    expect(liste).toHaveLength(1);
    expect(liste[0]!.eintraege).toHaveLength(0);
  });

  it("liefert bei kaputtem JSON eine leere Liste", () => {
    expect(einsaetzeAusJson("{kein json")).toEqual([]);
    expect(einsaetzeAusJson(null)).toEqual([]);
  });

  it("migriert enthaltene Bögen beim Laden (altes Schema bleibt lesbar)", () => {
    const alt: Einsatzsammlung = {
      id: "s1",
      name: "E",
      art: EinsatzArt.EINSATZ,
      angelegt: 1,
      geaendert: 1,
      eintraege: [
        {
          id: "e1",
          einheitSchluessel: "k",
          empfangenAm: 1,
          quelle: "scan",
          status: MeldeStatus.ANWESEND,
          bogen: { ...bogen(), schemaVersion: 1 },
        },
      ],
    };
    const liste = einsaetzeAusJson(JSON.stringify([alt]));
    expect(liste[0]!.eintraege[0]!.bogen.schemaVersion).toBe(SCHEMA_VERSION);
  });
});
