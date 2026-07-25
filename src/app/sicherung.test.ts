import { describe, it, expect, beforeEach } from "vitest";
import {
  alleDatenLoeschen,
  datenUmfang,
  sicherungEinspielen,
  sicherungErstellen,
  sicherungInhalt,
  sicherungParsen,
} from "./sicherung";
import { OrganisationsTyp, PersonalErfassung, SCHEMA_VERSION, type Erfassungsbogen } from "../model";
import { absenderkarteSpeichern } from "./absenderkarte";
import { EinsatzArt, einsatzAnlegen, meldungHinzufuegen } from "./einsaetze";
import { entwurfLaden, entwurfSpeichern } from "./entwurf";
import { vorlageAnlegen, vorlageLoeschen, vorlagenLaden } from "./vorlagen";

function bogen(): Erfassungsbogen {
  return {
    schemaVersion: SCHEMA_VERSION,
    stand: 100,
    einheit: {
      organisation: OrganisationsTyp.THW,
      einheitsTyp: { code: 1 },
      hierarchie: [{ bezeichnung: { code: 1 }, name: "OV Oldenburg" }],
    },
    einsatz: { zeitraumVon: 100, zeitraumBis: 130, ortAuftrag: "Übung Kabelblitz" },
    personalErfassung: PersonalErfassung.VOLLSTAENDIG,
    personal: [],
    fahrzeuge: [],
  };
}

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

describe("sicherungInhalt() / sicherungParsen()", () => {
  it("überlebt einen Roundtrip", () => {
    const eintraege = { "eeb.vorlagen.v1": "[]", "eeb.signieren.v1": "1" };
    expect(sicherungParsen(sicherungInhalt(eintraege))).toEqual(eintraege);
  });

  it("ignoriert fremde Schlüssel ohne eeb.-Präfix", () => {
    const text = sicherungInhalt({ "eeb.a": "1", "fremd.b": "2" } as Record<string, string>);
    expect(sicherungParsen(text)).toEqual({ "eeb.a": "1" });
  });

  it("weist Müll und fremde Formate mit verständlicher Meldung ab", () => {
    expect(() => sicherungParsen("kein json")).toThrow(/JSON/);
    expect(() => sicherungParsen('{"format":"anders"}')).toThrow(/Sicherungsdatei/);
    expect(() => sicherungParsen('{"format":"eeb-sicherung","version":99,"eintraege":{}}')).toThrow(/neueren App-Version/);
  });
});

describe("sicherungErstellen() / sicherungEinspielen()", () => {
  it("sichert alle eeb.*-Einträge und stellt sie auf einem leeren Gerät wieder her", () => {
    localStorage.setItem("eeb.vorlagen.v1", "[1]");
    localStorage.setItem("eeb.einsaetze.v1", "[2]");
    localStorage.setItem("fremd", "bleibt draußen");
    const datei = sicherungErstellen();

    (globalThis as { localStorage?: Storage }).localStorage = new MemStorage() as unknown as Storage;
    expect(sicherungEinspielen(datei)).toBe(2);
    expect(localStorage.getItem("eeb.vorlagen.v1")).toBe("[1]");
    expect(localStorage.getItem("eeb.einsaetze.v1")).toBe("[2]");
    expect(localStorage.getItem("fremd")).toBeNull();
  });

  it("ersetzt beim Einspielen vorhandene App-Daten komplett (Geräteumzug)", () => {
    const datei = sicherungInhalt({ "eeb.vorlagen.v1": "[\"neu\"]" });
    localStorage.setItem("eeb.vorlagen.v1", "[\"alt\"]");
    localStorage.setItem("eeb.entwurf.v1", "{\"alt\":true}");
    sicherungEinspielen(datei);
    expect(localStorage.getItem("eeb.vorlagen.v1")).toBe("[\"neu\"]");
    expect(localStorage.getItem("eeb.entwurf.v1")).toBeNull(); // nicht in der Sicherung → weg
  });
});

describe("datenUmfang()", () => {
  it("meldet auf einem frischen Gerät nichts", () => {
    expect(datenUmfang()).toEqual({
      eintraege: 0,
      vorlagen: 0,
      einsaetze: 0,
      meldungen: 0,
      entwurf: false,
      absender: false,
      geraeteschluessel: false,
    });
  });

  it("zählt Vorlagen und Einsätze inklusive Papierkorb", () => {
    const v = vorlageAnlegen("Basis", bogen());
    vorlageLoeschen(v.id); // nur in den Papierkorb
    const e = einsatzAnlegen("Übung", EinsatzArt.UEBUNG);
    meldungHinzufuegen(e.id, bogen(), { quelle: "manuell" });
    einsatzAnlegen("Sturmflut", EinsatzArt.EINSATZ);

    const u = datenUmfang();
    expect(u.vorlagen).toBe(1); // im Papierkorb, aber vorhanden
    expect(u.einsaetze).toBe(2);
    expect(u.meldungen).toBe(1);
    expect(u.eintraege).toBeGreaterThanOrEqual(2);
  });

  it("erkennt Entwurf und Absenderkarte", () => {
    entwurfSpeichern(bogen());
    absenderkarteSpeichern({ name: "Rudolph", email: "", telefon: "" });
    const u = datenUmfang();
    expect(u.entwurf).toBe(true);
    expect(u.absender).toBe(true);
  });
});

describe("alleDatenLoeschen()", () => {
  it("entfernt alle eeb.*-Einträge und lässt fremde Schlüssel stehen", () => {
    vorlageAnlegen("Basis", bogen());
    entwurfSpeichern(bogen());
    localStorage.setItem("skipgc", "t"); // Widerspruch zur Reichweitenmessung
    localStorage.setItem("fremd", "bleibt");

    expect(alleDatenLoeschen()).toBeGreaterThanOrEqual(2);
    expect(datenUmfang().eintraege).toBe(0);
    expect(vorlagenLaden()).toEqual([]);
    expect(entwurfLaden()).toBeNull();
    expect(localStorage.getItem("skipgc")).toBe("t");
    expect(localStorage.getItem("fremd")).toBe("bleibt");
  });

  it("ist auf einem leeren Gerät ein Nullvorgang", () => {
    expect(alleDatenLoeschen()).toBe(0);
  });
});
