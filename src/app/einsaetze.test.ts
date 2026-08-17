import { describe, it, expect, beforeEach } from "vitest";
import {
  OrganisationsTyp,
  PersonalErfassung,
  SCHEMA_VERSION,
  StaerkeRolle,
  Fahrerlaubnis,
  Geschlecht,
  Ernaehrung,
  staerke,
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
  einsatzWiederherstellen,
  einsatzEndgueltigLoeschen,
  einsatzImportieren,
  einsaetzeLaden,
  einsaetzeSpeichern,
  einsaetzePapierkorb,
  meldungHinzufuegen,
  meldungStatusSetzen,
  meldungEntfernen,
  einheitZugEtikettSetzen,
  meldungAufteilen,
  meldungenZusammenfuehren,
  stammSchluessel,
  tageBisAufraeumen,
  ruhendeBereinigt,
  AUFRAEUM_HINWEIS_MS,
  AUFRAEUM_FRIST_MS,
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
    einheit: { organisation: OrganisationsTyp.THW, einheitsTyp: { code: 1 }, hierarchie: [{ bezeichnung: { code: 1 }, name: "OV Oldenburg" }] },
    einsatz: { zeitraumVon: 100, zeitraumBis: 130, ortAuftrag: "Übung Kabelblitz" },
    personalErfassung: PersonalErfassung.VOLLSTAENDIG,
    personal: [person("Berger", StaerkeRolle.UNTERFUEHRER), person("Ahlers", StaerkeRolle.MANNSCHAFT)],
    fahrzeuge: [{ typ: { code: 2 }, kennzeichen: "THW-84397" }],
    ...over,
  };
}

describe("einheitSchluessel()", () => {
  it("nutzt den Standort-Ref, wenn vorhanden (stabil gegen Namensschreibweise)", () => {
    const a = einheitSchluessel({ ...bogen().einheit, standortRef: 42, hierarchie: [{ bezeichnung: { code: 1 }, name: "OV Oldenburg" }] });
    const b = einheitSchluessel({ ...bogen().einheit, standortRef: 42, hierarchie: [{ bezeichnung: { code: 1 }, name: "Oldenburg – Ni" }] });
    expect(a).toBe(b);
    expect(a).toContain("ref:42");
  });

  it("fällt ohne Ref auf Organisation + Typ + normalisierten Namen zurück", () => {
    const a = einheitSchluessel(bogen().einheit);
    const b = einheitSchluessel({ ...bogen().einheit, hierarchie: [{ bezeichnung: { code: 1 }, name: "  ov   OLDENBURG " }] });
    expect(a).toBe(b); // Normalisierung: klein, getrimmt, Whitespace kollabiert
  });

  it("unterscheidet verschiedene Einheiten", () => {
    const a = einheitSchluessel(bogen().einheit);
    const b = einheitSchluessel({ ...bogen().einheit, hierarchie: [{ bezeichnung: { code: 1 }, name: "OV Wardenburg" }] });
    expect(a).not.toBe(b);
  });
});

describe("bogenInhaltsId()", () => {
  it("ist stabil für gleichen Inhalt und verschieden bei Änderung", () => {
    expect(bogenInhaltsId(bogen())).toBe(bogenInhaltsId(bogen()));
    expect(bogenInhaltsId(bogen())).not.toBe(bogenInhaltsId(bogen({ stand: 101 })));
  });
});

describe("Signaturstatus je Meldung", () => {
  it("speichert den Signaturstatus und übersteht die Serialisierung", () => {
    const s = einsatzAnlegen("E", EinsatzArt.EINSATZ);
    const r = meldungHinzufuegen(s.id, bogen(), {
      quelle: "scan",
      signatur: { zustand: "gueltig", pubkey: "ab".repeat(32), kurzform: "abab abab abab abab" },
    });
    expect(r?.eintrag.signatur?.zustand).toBe("gueltig");
    // Roundtrip durch JSON (localStorage-Format) erhält das Feld.
    const wieder = einsaetzeAusJson(einsaetzeZuJson(einsaetzeLaden()));
    expect(wieder[0]!.eintraege[0]!.signatur).toEqual({
      zustand: "gueltig",
      pubkey: "ab".repeat(32),
      kurzform: "abab abab abab abab",
    });
  });

  it("lässt das Feld bei unsigniertem Empfang weg", () => {
    const s = einsatzAnlegen("E", EinsatzArt.EINSATZ);
    const r = meldungHinzufuegen(s.id, bogen(), { quelle: "pdf-import" });
    expect(r?.eintrag.signatur).toBeUndefined();
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
    meldungHinzufuegen(s.id, bogen({ einheit: { ...bogen().einheit, hierarchie: [{ bezeichnung: { code: 1 }, name: "OV Wardenburg" }] } }));
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

describe("Papierkorb", () => {
  it("löschen verschiebt in den Papierkorb, wiederherstellen holt zurück", () => {
    const s = einsatzAnlegen("E", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogen());
    einsatzLoeschen(s.id);
    expect(einsaetzeLaden()).toEqual([]);
    expect(einsaetzePapierkorb().map((x) => x.id)).toEqual([s.id]);

    einsatzWiederherstellen(s.id);
    expect(einsaetzeLaden().map((x) => x.id)).toEqual([s.id]);
    expect(einsaetzeLaden()[0]!.eintraege).toHaveLength(1); // Meldungen überleben den Papierkorb
    expect(einsaetzePapierkorb()).toEqual([]);
  });

  it("endgültig löschen entfernt den Einsatz komplett", () => {
    const s = einsatzAnlegen("E", EinsatzArt.EINSATZ);
    einsatzLoeschen(s.id);
    einsatzEndgueltigLoeschen(s.id);
    expect(einsaetzeLaden()).toEqual([]);
    expect(einsaetzePapierkorb()).toEqual([]);
  });

  it("Mutationen an anderen Einsätzen lassen den Papierkorb unangetastet", () => {
    const weg = einsatzAnlegen("Weg", EinsatzArt.EINSATZ);
    einsatzLoeschen(weg.id);
    const bleibt = einsatzAnlegen("Bleibt", EinsatzArt.EINSATZ);
    meldungHinzufuegen(bleibt.id, bogen());
    expect(einsaetzeLaden().map((x) => x.name)).toEqual(["Bleibt"]);
    expect(einsaetzePapierkorb().map((x) => x.id)).toEqual([weg.id]);
  });

  it("Import mit gleicher Einsatz-ID belebt einen Einsatz im Papierkorb wieder", () => {
    const s = einsatzAnlegen("E", EinsatzArt.EINSATZ);
    einsatzLoeschen(s.id);
    const kopie: Einsatzsammlung = { ...s, eintraege: [] };
    const r = einsatzImportieren(kopie);
    expect(r.neuerEinsatz).toBe(false);
    expect(einsaetzeLaden().map((x) => x.id)).toEqual([s.id]);
    expect(einsaetzePapierkorb()).toEqual([]);
  });
});

describe("einheitZugEtikettSetzen()", () => {
  it("setzt das Etikett auf allen Revisionen der Einheit", () => {
    const s = einsatzAnlegen("E", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogen({ stand: 100 }));
    meldungHinzufuegen(s.id, bogen({ stand: 101 }));
    const schl = einsaetzeLaden()[0]!.eintraege[0]!.einheitSchluessel;
    einheitZugEtikettSetzen(s.id, schl, "  2. Zug  ");
    const eintraege = einsaetzeLaden()[0]!.eintraege;
    expect(eintraege).toHaveLength(2);
    expect(eintraege.every((e) => e.zugEtikett === "2. Zug")).toBe(true); // getrimmt, auf allen
  });

  it("lässt andere Einheiten unberührt", () => {
    const s = einsatzAnlegen("E", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogen());
    meldungHinzufuegen(s.id, bogen({ einheit: { ...bogen().einheit, hierarchie: [{ bezeichnung: { code: 1 }, name: "OV Wardenburg" }] } }));
    const schl = neuesteJeEinheit(einsaetzeLaden()[0]!.eintraege).find((e) =>
      e.einheitSchluessel.includes("oldenburg"),
    )!.einheitSchluessel;
    einheitZugEtikettSetzen(s.id, schl, "1. Zug");
    const eintraege = einsaetzeLaden()[0]!.eintraege;
    expect(eintraege.filter((e) => e.zugEtikett === "1. Zug")).toHaveLength(1);
    expect(eintraege.filter((e) => e.zugEtikett === undefined)).toHaveLength(1);
  });

  it("entfernt das Etikett bei leerem Text", () => {
    const s = einsatzAnlegen("E", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogen(), { zugEtikett: "3. Zug" });
    const schl = einsaetzeLaden()[0]!.eintraege[0]!.einheitSchluessel;
    einheitZugEtikettSetzen(s.id, schl, "   ");
    expect(einsaetzeLaden()[0]!.eintraege[0]!.zugEtikett).toBeUndefined();
  });

  it("ignoriert unbekannte Einsätze/Einheiten ohne zu werfen", () => {
    const s = einsatzAnlegen("E", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogen());
    expect(() => einheitZugEtikettSetzen("gibtsnicht", "k", "X")).not.toThrow();
    einheitZugEtikettSetzen(s.id, "unbekannt", "X");
    expect(einsaetzeLaden()[0]!.eintraege[0]!.zugEtikett).toBeUndefined();
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

describe("meldungAufteilen()", () => {
  /** Einsatz mit einer gemeldeten Einheit — Ausgangslage aller Aufteilungen. */
  function mitMeldung(over: Partial<Erfassungsbogen> = {}, opt: Parameters<typeof meldungHinzufuegen>[2] = {}) {
    const s = einsatzAnlegen("Hochwasser", EinsatzArt.EINSATZ);
    const r = meldungHinzufuegen(s.id, bogen(over), { quelle: "scan", ...opt })!;
    return { einsatzId: s.id, eintragId: r.eintrag.id };
  }

  const wahl = { teilEtikett: "Fachberater", personal: [0], fahrzeuge: [] };

  it("macht aus einer Meldung zwei zählende Einheiten, ohne Stärke zu verlieren", () => {
    const { einsatzId, eintragId } = mitMeldung();
    const r = meldungAufteilen(einsatzId, eintragId, wahl)!;

    expect(r.rest.einheitSchluessel).not.toBe(r.abgeteilt.einheitSchluessel);
    const koepfe = neuesteJeEinheit(einsaetzeLaden()[0]!.eintraege);
    expect(koepfe).toHaveLength(2);
    // Der Rest löst die Ursprungsmeldung als neueste Fassung seiner Einheit ab.
    expect(koepfe.map((e) => e.id)).toContain(r.rest.id);
    expect(koepfe.map((e) => e.id)).not.toContain(eintragId);
    expect(koepfe.reduce((n, e) => n + staerke(e.bogen).gesamt, 0)).toBe(2);
  });

  it("behält die Ursprungsmeldung als Revision des Rests (Historie bleibt lesbar)", () => {
    const { einsatzId, eintragId } = mitMeldung();
    const r = meldungAufteilen(einsatzId, eintragId, wahl)!;
    const revs = revisionen(einsaetzeLaden()[0]!.eintraege, r.rest.einheitSchluessel);
    expect(revs.map((e) => e.id)).toEqual([r.rest.id, eintragId]);
  });

  it("kennzeichnet den abgeteilten Teil und hält seine Herkunft fest", () => {
    const { einsatzId, eintragId } = mitMeldung();
    const r = meldungAufteilen(einsatzId, eintragId, wahl)!;
    expect(r.abgeteilt.teilEtikett).toBe("Fachberater");
    expect(r.abgeteilt.quelle).toBe("aufteilung");
    expect(r.abgeteilt.stammtVon?.einheitSchluessel).toBe(r.rest.einheitSchluessel);
    expect(r.rest.teilEtikett).toBeUndefined();
    expect(r.rest.quelle).toBe("aufteilung");
  });

  it("überträgt Signatur und Herkunfts-Payload NICHT — sie deckten den Inhalt nicht mehr", () => {
    const { einsatzId, eintragId } = mitMeldung(
      {},
      { signatur: { zustand: "gueltig", pubkey: "ab".repeat(32) }, herkunft: "payload" },
    );
    const r = meldungAufteilen(einsatzId, eintragId, wahl)!;
    for (const e of [r.rest, r.abgeteilt]) {
      expect(e.signatur).toBeUndefined();
      expect(e.herkunft).toBeUndefined();
    }
    // Die signierte Ursprungsfassung bleibt in der Historie erhalten.
    expect(einsaetzeLaden()[0]!.eintraege.find((e) => e.id === eintragId)?.signatur?.zustand).toBe("gueltig");
  });

  it("kann den abgeteilten Teil sofort als abgerückt führen", () => {
    const { einsatzId, eintragId } = mitMeldung();
    const r = meldungAufteilen(einsatzId, eintragId, wahl, { status: MeldeStatus.ABGERUECKT })!;
    expect(r.abgeteilt.status).toBe(MeldeStatus.ABGERUECKT);
    expect(r.rest.status).toBe(MeldeStatus.ANWESEND);
  });

  it("erbt das Zug-Etikett, lässt es aber gezielt umsetzen und leeren", () => {
    const a = mitMeldung();
    meldungHinzufuegen(a.einsatzId, bogen(), {});
    einheitZugEtikettSetzen(a.einsatzId, einheitSchluessel(bogen().einheit), "2. Zug");
    const geerbt = meldungAufteilen(a.einsatzId, a.eintragId, wahl)!;
    expect(geerbt.abgeteilt.zugEtikett).toBe("2. Zug");

    const b = mitMeldung();
    einheitZugEtikettSetzen(b.einsatzId, einheitSchluessel(bogen().einheit), "2. Zug");
    expect(meldungAufteilen(b.einsatzId, b.eintragId, wahl, { zugEtikett: "3. Zug" })!.abgeteilt.zugEtikett).toBe("3. Zug");

    const c = mitMeldung();
    einheitZugEtikettSetzen(c.einsatzId, einheitSchluessel(bogen().einheit), "2. Zug");
    expect(meldungAufteilen(c.einsatzId, c.eintragId, wahl, { zugEtikett: "  " })!.abgeteilt.zugEtikett).toBeUndefined();
  });

  it("hängt weitere Teile an denselben Stamm statt sie zu verschachteln", () => {
    const { einsatzId, eintragId } = mitMeldung();
    const erste = meldungAufteilen(einsatzId, eintragId, { ...wahl, personal: [0] })!;
    const zweite = meldungAufteilen(einsatzId, erste.rest.id, { teilEtikett: "Trupp", personal: [0], fahrzeuge: [] })!;

    expect(stammSchluessel(zweite.abgeteilt.einheitSchluessel)).toBe(erste.rest.einheitSchluessel);
    expect(zweite.abgeteilt.einheitSchluessel).not.toBe(erste.abgeteilt.einheitSchluessel);
    expect(neuesteJeEinheit(einsaetzeLaden()[0]!.eintraege)).toHaveLength(3);
  });

  it("übersteht die Serialisierung mit Teil-Etikett und Herkunft", () => {
    const { einsatzId, eintragId } = mitMeldung();
    meldungAufteilen(einsatzId, eintragId, wahl);
    const wieder = einsaetzeAusJson(einsaetzeZuJson(einsaetzeLaden()));
    const teil = wieder[0]!.eintraege.find((e) => e.teilEtikett === "Fachberater");
    expect(teil?.stammtVon?.abgeteiltAm).toBeGreaterThan(0);
  });

  it("liefert null für unbekannten Einsatz oder Eintrag", () => {
    const { einsatzId, eintragId } = mitMeldung();
    expect(meldungAufteilen("gibts-nicht", eintragId, wahl)).toBeNull();
    expect(meldungAufteilen(einsatzId, "gibts-nicht", wahl)).toBeNull();
  });

  it("wirft bei einer Auswahl, die den Rest leer ließe", () => {
    const { einsatzId, eintragId } = mitMeldung();
    expect(() => meldungAufteilen(einsatzId, eintragId, { teilEtikett: "Alles", personal: [0, 1], fahrzeuge: [0] })).toThrow();
  });
});

describe("meldungenZusammenfuehren()", () => {
  /** Einsatz mit einer aufgeteilten Einheit — Ausgangslage des Zusammenführens. */
  function aufgeteilt() {
    const s = einsatzAnlegen("Hochwasser", EinsatzArt.EINSATZ);
    const erst = meldungHinzufuegen(s.id, bogen(), { quelle: "scan" })!;
    const r = meldungAufteilen(s.id, erst.eintrag.id, {
      teilEtikett: "Fachberater",
      personal: [0],
      fahrzeuge: [],
    })!;
    return { einsatzId: s.id, rest: r.rest, teil: r.abgeteilt };
  }

  it("führt den Teil zurück und zählt die Einheit wieder als eine", () => {
    const { einsatzId, rest, teil } = aufgeteilt();
    const r = meldungenZusammenfuehren(einsatzId, rest.id, [teil.id])!;

    const koepfe = neuesteJeEinheit(einsaetzeLaden()[0]!.eintraege);
    const zaehlend = koepfe.filter((e) => e.status === MeldeStatus.ANWESEND);
    expect(zaehlend).toHaveLength(1);
    expect(staerke(zaehlend[0]!.bogen).gesamt).toBe(2); // nichts doppelt gezählt
    expect(r.ziel.quelle).toBe("zusammenfuehrung");
  });

  it("führt den aufgegangenen Teil nicht als abgerückt, sondern als aufgegangen", () => {
    const { einsatzId, rest, teil } = aufgeteilt();
    const r = meldungenZusammenfuehren(einsatzId, rest.id, [teil.id])!;
    expect(r.aufgegangen[0]!.status).toBe(MeldeStatus.AUFGEGANGEN);
    expect(r.aufgegangen[0]!.status).not.toBe(MeldeStatus.ABGERUECKT);
    expect(r.aufgegangen[0]!.aufgegangenIn?.einheitSchluessel).toBe(rest.einheitSchluessel);
  });

  it("lässt die Historie des aufgegangenen Teils stehen", () => {
    const { einsatzId, rest, teil } = aufgeteilt();
    meldungenZusammenfuehren(einsatzId, rest.id, [teil.id]);
    const eintraege = einsaetzeLaden()[0]!.eintraege;
    expect(eintraege.some((e) => e.id === teil.id)).toBe(true);
    expect(revisionen(eintraege, teil.einheitSchluessel)).toHaveLength(1);
  });

  it("nimmt die Teil-Bezeichnung weg, wenn die Einheit wieder ganz ist", () => {
    const { einsatzId, rest, teil } = aufgeteilt();
    // Erst dem Rest selbst eine Bezeichnung geben, damit das Leeren sichtbar wird.
    const mitEtikett = meldungAufteilen(einsatzId, rest.id, {
      teilEtikett: "Trupp",
      personal: [0],
      fahrzeuge: [],
    })!;
    const r = meldungenZusammenfuehren(einsatzId, mitEtikett.abgeteilt.id, [teil.id], { teilEtikett: "" })!;
    expect(r.ziel.teilEtikett).toBeUndefined();
  });

  it("behält die bisherige Bezeichnung ohne Angabe", () => {
    const { einsatzId, rest, teil } = aufgeteilt();
    const r = meldungenZusammenfuehren(einsatzId, teil.id, [rest.id])!;
    expect(r.ziel.teilEtikett).toBe("Fachberater");
  });

  it("weist Teile fremder Einheiten ab", () => {
    const { einsatzId, rest } = aufgeteilt();
    const fremd = meldungHinzufuegen(einsatzId, bogen({
      einheit: { ...bogen().einheit, hierarchie: [{ bezeichnung: { code: 1 }, name: "OV Wardenburg" }] },
    }), { quelle: "scan" })!;
    expect(() => meldungenZusammenfuehren(einsatzId, rest.id, [fremd.eintrag.id])).toThrow(/derselben Einheit/);
  });

  it("weist das Zusammenführen mit sich selbst ab", () => {
    const { einsatzId, rest } = aufgeteilt();
    expect(() => meldungenZusammenfuehren(einsatzId, rest.id, [rest.id])).toThrow(/mit sich selbst/);
  });

  it("holt einen aufgegangenen Teil über den Status zurück und löscht den Verweis", () => {
    const { einsatzId, rest, teil } = aufgeteilt();
    meldungenZusammenfuehren(einsatzId, rest.id, [teil.id]);
    meldungStatusSetzen(einsatzId, teil.id, MeldeStatus.ANWESEND);
    const wieder = einsaetzeLaden()[0]!.eintraege.find((e) => e.id === teil.id)!;
    expect(wieder.status).toBe(MeldeStatus.ANWESEND);
    expect(wieder.aufgegangenIn).toBeUndefined();
  });

  it("übersteht die Serialisierung mit Status und Verweis", () => {
    const { einsatzId, rest, teil } = aufgeteilt();
    meldungenZusammenfuehren(einsatzId, rest.id, [teil.id]);
    const wieder = einsaetzeAusJson(einsaetzeZuJson(einsaetzeLaden()));
    const auf = wieder[0]!.eintraege.find((e) => e.id === teil.id)!;
    expect(auf.status).toBe(MeldeStatus.AUFGEGANGEN);
    expect(auf.aufgegangenIn?.zusammengefuehrtAm).toBeGreaterThan(0);
  });

  it("liefert null für unbekannten Einsatz, Ziel oder Teil", () => {
    const { einsatzId, rest, teil } = aufgeteilt();
    expect(meldungenZusammenfuehren("gibts-nicht", rest.id, [teil.id])).toBeNull();
    expect(meldungenZusammenfuehren(einsatzId, "gibts-nicht", [teil.id])).toBeNull();
    expect(meldungenZusammenfuehren(einsatzId, rest.id, ["gibts-nicht"])).toBeNull();
  });
});

describe("Automatisches Aufräumen ruhender Sammlungen", () => {
  const TAG = 24 * 60 * 60 * 1000;
  const jetzt = Date.now();
  const sammlung = (alterTage: number, over: Partial<Einsatzsammlung> = {}) =>
    ({
      id: `s${alterTage}`,
      name: "Übung",
      art: EinsatzArt.UEBUNG,
      angelegt: jetzt - alterTage * TAG,
      geaendert: jetzt - alterTage * TAG,
      eintraege: [],
      ...over,
    }) as Einsatzsammlung;

  it("schweigt vor Tag 60", () => {
    expect(tageBisAufraeumen(sammlung(0), jetzt)).toBeNull();
    expect(tageBisAufraeumen(sammlung(59), jetzt)).toBeNull();
  });

  it("zählt ab Tag 60 die Tage bis zur Löschung herunter", () => {
    expect(tageBisAufraeumen(sammlung(60), jetzt)).toBe(30);
    expect(tageBisAufraeumen(sammlung(89), jetzt)).toBe(1);
    expect(tageBisAufraeumen(sammlung(90), jetzt)).toBe(0);
    expect(tageBisAufraeumen(sammlung(200), jetzt)).toBe(0);
  });

  it("die Ankündigung beginnt genau eine Frist-Differenz vor der Löschung", () => {
    const angekuendigt = (AUFRAEUM_FRIST_MS - AUFRAEUM_HINWEIS_MS) / TAG;
    expect(tageBisAufraeumen(sammlung(60), jetzt)).toBe(angekuendigt);
  });

  it("entfernt erst ab Tag 90 — und nur dann", () => {
    const { liste, entfernt } = ruhendeBereinigt([sammlung(89), sammlung(90), sammlung(400)], jetzt);
    expect(entfernt).toBe(2);
    expect(liste.map((s) => s.id)).toEqual(["s89"]);
  });

  it("lässt Papierkorb-Einträge in Ruhe — die haben ihre eigene Uhr", () => {
    const imKorb = sammlung(400, { id: "korb", geloeschtAm: jetzt - TAG });
    const { liste, entfernt } = ruhendeBereinigt([imKorb], jetzt);
    expect(entfernt).toBe(0);
    expect(liste).toHaveLength(1);
  });

  it("räumt beim Laden automatisch auf und schreibt den Stand zurück", () => {
    const frisch = einsatzAnlegen("Läuft noch", EinsatzArt.EINSATZ);
    const alt = einsatzAnlegen("Vergessen", EinsatzArt.EINSATZ);
    // Die alte Sammlung künstlich altern lassen (direkt im Speicher).
    const roh = einsaetzeAusJson(localStorage.getItem("eeb.einsaetze.v1"));
    einsaetzeSpeichern(
      roh.map((s) => (s.id === alt.id ? { ...s, geaendert: jetzt - 91 * TAG } : s)),
    );

    const nachLaden = einsaetzeLaden();
    expect(nachLaden.map((s) => s.id)).toEqual([frisch.id]);
    // Persistiert: auch der Rohspeicher kennt die alte Sammlung nicht mehr.
    expect(einsaetzeAusJson(localStorage.getItem("eeb.einsaetze.v1"))).toHaveLength(1);
  });

  it("eine Änderung setzt die Frist zurück", () => {
    const s = einsatzAnlegen("Aktiv", EinsatzArt.EINSATZ);
    einsaetzeSpeichern(
      einsaetzeAusJson(localStorage.getItem("eeb.einsaetze.v1")).map((x) => ({
        ...x,
        geaendert: jetzt - 80 * TAG,
      })),
    );
    expect(tageBisAufraeumen(einsaetzeLaden()[0]!, jetzt)).toBe(10);
    // Eine neue Meldung berührt die Sammlung → geaendert wird neu gesetzt.
    meldungHinzufuegen(s.id, bogen());
    expect(tageBisAufraeumen(einsaetzeLaden()[0]!)).toBeNull();
  });
});
