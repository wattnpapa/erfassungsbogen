/**
 * Audit Runde 4, R4-D1: Eine vorgestellte Geräteuhr löschte beim Start die
 * laufende Sammlung endgültig (Aufräumfrist) und leerte den Papierkorb. Geprüft
 * wird der ganze Weg über den echten Kern: Ablage verdrahten, Uhr um 40, 365
 * und 400 Tage vorstellen, lesen.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  EinsatzArt,
  einsaetzeAusJson,
  einsaetzeLaden,
  einsaetzePapierkorb,
  einsatzAnlegen,
  einsatzLoeschen,
  speicherhuelleSetzen,
} from "@bos/meldekopf/einsaetze";
import { aufgeraeumteLaden, aufraeumBeobachter } from "./aufraeum-hinweis";
import { datenschutzUhrSetzen } from "@bos/meldekopf/einsaetze";
import { datenschutzZeitpunkt, geraeteuhrPruefen, geprueftesJetzt, uhrPruefungZuruecksetzen, uhrWarnung } from "./datenschutz-uhr";
import { uhrKorrigierteHuelle, zeitstempelVerschieben } from "./uhr-korrektur";
import { schonendeHuelle } from "./speicher-schonend";
import { MINUTEN_JE_TAG, OrganisationsTyp, PersonalErfassung, SCHEMA_VERSION, type Erfassungsbogen } from "@bos/eeb-format/model";
import { vorlageAnlegen, vorlageLoeschen, vorlagenPapierkorb } from "./vorlagen";

function blankoBogen(): Erfassungsbogen {
  return {
    schemaVersion: SCHEMA_VERSION,
    stand: 100,
    einheit: { organisation: OrganisationsTyp.THW, einheitsTyp: { code: 1 }, hierarchie: [{ bezeichnung: { code: 1 }, name: "OV Test" }] },
    einsatz: { zeitraumVon: 100, zeitraumBis: 130, ortAuftrag: "", einsatzbeginn: 999 },
    personalErfassung: PersonalErfassung.VOLLSTAENDIG,
    personal: [],
    fahrzeuge: [],
  };
}

const TAG = 24 * 60 * 60 * 1000;
const SCHLUESSEL = "eeb.einsaetze.v1";

class MemStorage {
  m = new Map<string, string>();
  getItem(k: string) {
    return this.m.has(k) ? this.m.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, String(v));
  }
}

let mem: MemStorage;
const START = new Date("2026-10-06T12:00:00Z").getTime();

function verdrahten() {
  speicherhuelleSetzen(schonendeHuelle(uhrKorrigierteHuelle(aufraeumBeobachter(mem)), "[]"));
}

/** Neuer Seitenaufruf: Arbeitsspeicher-Stand der Uhr vergessen, Ablage neu verdrahten. */
function neuStart(jetzt: number) {
  vi.setSystemTime(jetzt);
  uhrPruefungZuruecksetzen();
  verdrahten();
  // Wie beim Start der App: Die Datenschutzfrist schreibt den Uhrstand fort.
  datenschutzUhrSetzen(() => datenschutzZeitpunkt());
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(START);
  mem = new MemStorage();
  (globalThis as { localStorage?: Storage }).localStorage = mem as unknown as Storage;
  uhrPruefungZuruecksetzen();
  verdrahten();
});

afterEach(() => {
  vi.useRealTimers();
  speicherhuelleSetzen(null);
  datenschutzUhrSetzen(null);
});

describe("geraeteuhrPruefen()", () => {
  const Z = 2500 * MINUTEN_JE_TAG;
  it("lässt kleine Vorsprünge durch und hält ab 60 Tagen zurück", () => {
    expect(geraeteuhrPruefen(Z + 40 * MINUTEN_JE_TAG, { zuletzt: Z }).gehalten).toBe(false);
    expect(geraeteuhrPruefen(Z + 60 * MINUTEN_JE_TAG, { zuletzt: Z }).gehalten).toBe(false);
    const r = geraeteuhrPruefen(Z + 365 * MINUTEN_JE_TAG, { zuletzt: Z });
    expect(r.gehalten).toBe(true);
    expect(r.zeitpunkt).toBe(Z);
    expect(r.stand).toEqual({ zuletzt: Z, sprung: Z + 365 * MINUTEN_JE_TAG });
  });

  it("übernimmt den Sprung erst, wenn er sich einen Tag später bestätigt", () => {
    const sprung = Z + 400 * MINUTEN_JE_TAG;
    expect(geraeteuhrPruefen(sprung + 60, { zuletzt: Z, sprung }).gehalten).toBe(true);
    const r = geraeteuhrPruefen(sprung + MINUTEN_JE_TAG, { zuletzt: Z, sprung });
    expect(r.gehalten).toBe(false);
    expect(r.zeitpunkt).toBe(sprung + MINUTEN_JE_TAG);
  });
});

describe("zeitstempelVerschieben()", () => {
  it("verschiebt nur geaendert und geloeschtAm der Sammlungen", () => {
    const t = JSON.stringify([{ id: "a", angelegt: 1, geaendert: 100, geloeschtAm: 50, eintraege: [] }, { id: "b", geaendert: 7 }]);
    const v = JSON.parse(zeitstempelVerschieben(t, 10));
    expect(v[0]).toMatchObject({ angelegt: 1, geaendert: 110, geloeschtAm: 60 });
    expect(v[1]).toEqual({ id: "b", geaendert: 17 });
    expect(zeitstempelVerschieben(t, 0)).toBe(t);
    expect(zeitstempelVerschieben("kaputt", 10)).toBe("kaputt");
  });
});

describe("Aufräum- und Papierkorbfrist bei vorgestellter Geräteuhr (R4-D1)", () => {
  function sammlungen() {
    einsatzAnlegen("Laufender Einsatz", EinsatzArt.EINSATZ);
    const weg = einsatzAnlegen("Gestern gelöscht", EinsatzArt.EINSATZ);
    einsatzLoeschen(weg.id);
    // erster normaler Start merkt sich die Uhr
    geprueftesJetzt();
  }

  it.each([365, 400])("löscht bei +%i Tagen nichts und warnt", (tage) => {
    sammlungen();
    neuStart(START + tage * TAG);
    expect(einsaetzeLaden().map((s) => s.name)).toEqual(["Laufender Einsatz"]);
    expect(einsaetzePapierkorb().map((s) => s.name)).toEqual(["Gestern gelöscht"]);
    expect(aufgeraeumteLaden(mem)).toEqual([]);
    expect(uhrWarnung()).not.toBeNull();
    // Im Speicher stehen weiter die ehrlichen Zeitstempel.
    const roh = einsaetzeAusJson(mem.getItem(SCHLUESSEL));
    expect(roh).toHaveLength(2);
    for (const s of roh) expect(s.geaendert).toBeLessThanOrEqual(START + 1000);
  });

  it("nach zurückgestellter Uhr ist alles unverändert da, ohne Warnung", () => {
    sammlungen();
    neuStart(START + 400 * TAG);
    expect(einsaetzeLaden()).toHaveLength(1);
    neuStart(START + TAG);
    expect(einsaetzeLaden().map((s) => s.name)).toEqual(["Laufender Einsatz"]);
    expect(einsaetzePapierkorb()).toHaveLength(1);
    expect(uhrWarnung()).toBeNull();
  });

  it("Änderungen bei gehaltener Uhr schreiben die geprüfte Zeit, nicht die falsche", () => {
    sammlungen();
    neuStart(START + 400 * TAG);
    einsatzAnlegen("Neu am falschen Tag", EinsatzArt.UEBUNG);
    const neu = einsaetzeAusJson(mem.getItem(SCHLUESSEL)).find((s) => s.name === "Neu am falschen Tag")!;
    expect(neu.geaendert).toBeLessThan(START + 2 * TAG);
    // Uhr wieder richtig: alles da.
    neuStart(START + 2 * TAG);
    expect(einsaetzeLaden().map((s) => s.name).sort()).toEqual(["Laufender Einsatz", "Neu am falschen Tag"]);
  });

  it("räumt nach bestätigtem Sprung (einen Tag später) wirklich auf", () => {
    sammlungen();
    neuStart(START + 400 * TAG);
    expect(einsaetzeLaden()).toHaveLength(1);
    neuStart(START + 401 * TAG + 60_000);
    expect(einsaetzeLaden()).toHaveLength(0);
    expect(uhrWarnung()).toBeNull();
  });

  it("räumt bei plausibler Uhr nach 90 Tagen weiter auf", () => {
    sammlungen();
    neuStart(START + 40 * TAG);
    expect(einsaetzeLaden()).toHaveLength(1);
    expect(einsaetzePapierkorb()).toHaveLength(0); // 30 Tage Papierkorb
    neuStart(START + 91 * TAG); // 51 Tage nach dem letzten Start: plausibel
    expect(einsaetzeLaden()).toHaveLength(0);
    expect(aufgeraeumteLaden(mem)).toHaveLength(1);
  });
});

describe("Papierkorb der Vorlagen bei vorgestellter Geräteuhr (R4-D1)", () => {
  it("behält den Eintrag von gestern bei +40 Tagen nicht, bei +400 Tagen aber schon", () => {
    const v = vorlageAnlegen("Meine FGr W", blankoBogen());
    vorlageLoeschen(v.id);
    geprueftesJetzt();
    neuStart(START + 400 * TAG);
    expect(vorlagenPapierkorb().map((x) => x.name)).toEqual(["Meine FGr W"]);
    neuStart(START + 2 * TAG);
    expect(vorlagenPapierkorb()).toHaveLength(1);
    neuStart(START + 40 * TAG);
    expect(vorlagenPapierkorb()).toHaveLength(0);
  });
});
