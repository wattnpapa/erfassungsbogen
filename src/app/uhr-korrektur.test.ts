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
import { datenschutzZeitpunkt, geraeteuhrPruefen, geprueftesJetzt, uhrstandAusJson, uhrBestaetigen, uhrPruefungZuruecksetzen, uhrWarnung } from "./datenschutz-uhr";
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

describe("uhrstandAusJson()", () => {
  it("verwirft unplausible Werte wie einen ersten Start (R7-O7)", () => {
    expect(uhrstandAusJson('{"zuletzt":1238983256000}')).toBeNull();
    expect(uhrstandAusJson('{"zuletzt":-5}')).toBeNull();
    expect(uhrstandAusJson('{"zuletzt":30000000}')).toEqual({ zuletzt: 30000000 });
    expect(uhrstandAusJson('{"zuletzt":30000000,"sprung":1e99}')).toEqual({ zuletzt: 30000000 });
  });
});

describe("geraeteuhrPruefen()", () => {
  const Z = 2500 * MINUTEN_JE_TAG;
  it("lässt kleine Vorsprünge durch und hält ab 60 Tagen zurück, wenn etwas fällig würde", () => {
    const fällig = () => true;
    expect(geraeteuhrPruefen(Z + 40 * MINUTEN_JE_TAG, { zuletzt: Z }, fällig).gehalten).toBe(false);
    expect(geraeteuhrPruefen(Z + 60 * MINUTEN_JE_TAG, { zuletzt: Z }, fällig).gehalten).toBe(false);
    const r = geraeteuhrPruefen(Z + 365 * MINUTEN_JE_TAG, { zuletzt: Z }, fällig);
    expect(r.gehalten).toBe(true);
    expect(r.richtung).toBe("vor");
    expect(r.zeitpunkt).toBe(Z);
    expect(r.stand).toEqual({ zuletzt: Z, sprung: Z + 365 * MINUTEN_JE_TAG });
  });

  it("nimmt einen Sprung ohne Folgen an (echte Pause), fragt aber bei Folgen", () => {
    const pause = geraeteuhrPruefen(Z + 100 * MINUTEN_JE_TAG, { zuletzt: Z }, () => false);
    expect(pause.gehalten).toBe(false);
    expect(pause.stand).toEqual({ zuletzt: Z + 100 * MINUTEN_JE_TAG });
  });

  it("übernimmt einen vermerkten Sprung nie durch Zeitablauf (R5-D1)", () => {
    const sprung = Z + 400 * MINUTEN_JE_TAG;
    for (const spaeter of [60, MINUTEN_JE_TAG, 3 * MINUTEN_JE_TAG, 29 * MINUTEN_JE_TAG, 200 * MINUTEN_JE_TAG]) {
      const r = geraeteuhrPruefen(sprung + spaeter, { zuletzt: Z, sprung }, () => false);
      expect(r.gehalten).toBe(true);
      expect(r.zeitpunkt).toBe(Z);
      expect(r.stand).toEqual({ zuletzt: Z, sprung });
    }
  });

  it("hält einen kurzen Sprung mit unangekündigten Folgen auch beim zweiten Lesen (R7-D2)", () => {
    const unangekuendigt = () => true;
    const erst = geraeteuhrPruefen(Z + 59 * MINUTEN_JE_TAG, { zuletzt: Z }, () => true, unangekuendigt);
    expect(erst.gehalten).toBe(true);
    const zweit = geraeteuhrPruefen(Z + 59 * MINUTEN_JE_TAG, erst.stand, () => true, unangekuendigt);
    expect(zweit.gehalten).toBe(true);
    expect(zweit.zeitpunkt).toBe(Z);
    expect(zweit.stand).toEqual(erst.stand);
  });

  it("hält eine weit zurückgestellte Uhr fest, auch wenn nichts fällig wäre, und dreht den Stand nicht zurück", () => {
    const r = geraeteuhrPruefen(Z - 400 * MINUTEN_JE_TAG, { zuletzt: Z }, () => false);
    expect(r.gehalten).toBe(true);
    expect(r.richtung).toBe("zurueck");
    expect(r.stand).toEqual({ zuletzt: Z, sprung: Z - 400 * MINUTEN_JE_TAG });
    // Uhr wieder nah am letzten Start: Rückfrage beendet
    const wieder = geraeteuhrPruefen(Z + 2 * MINUTEN_JE_TAG, r.stand, () => true);
    expect(wieder.gehalten).toBe(false);
    expect(wieder.stand).toEqual({ zuletzt: Z + 2 * MINUTEN_JE_TAG });
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

  it("löscht auch Tage später nichts, solange der Sprung nicht bestätigt ist (R5-D1)", () => {
    sammlungen();
    neuStart(START + 400 * TAG);
    expect(einsaetzeLaden()).toHaveLength(1);
    for (const tage of [401, 402, 430, 500]) {
      neuStart(START + tage * TAG + 60_000);
      expect(einsaetzeLaden().map((s) => s.name)).toEqual(["Laufender Einsatz"]);
      expect(einsaetzePapierkorb()).toHaveLength(1);
      expect(aufgeraeumteLaden(mem)).toEqual([]);
      expect(uhrWarnung()).not.toBeNull();
    }
  });

  it("räumt nach ausdrücklicher Bestätigung auf — und nur dann", () => {
    sammlungen();
    neuStart(START + 400 * TAG);
    const w = uhrWarnung()!;
    expect(w.folgen).toMatchObject({ sammlungen: 1, papierkorb: 1 });
    expect(uhrBestaetigen()).toBe(true);
    neuStart(START + 401 * TAG);
    expect(einsaetzeLaden()).toHaveLength(0);
    expect(uhrWarnung()).toBeNull();
    expect(aufgeraeumteLaden(mem)).toHaveLength(1);
  });

  it("Uhr nach dem Sprung zurück: alles unverändert, nichts bestätigt", () => {
    sammlungen();
    neuStart(START + 400 * TAG);
    neuStart(START + 401 * TAG);
    neuStart(START + 2 * TAG);
    expect(einsaetzeLaden().map((s) => s.name)).toEqual(["Laufender Einsatz"]);
    expect(uhrWarnung()).toBeNull();
  });

  it("Pause von 100 Tagen mit einer dann fälligen Sammlung: Frage mit Folgen statt Löschen (R5-D1)", () => {
    einsatzAnlegen("Junge Sammlung", EinsatzArt.EINSATZ);
    geprueftesJetzt();
    // Die Sammlung ist am Tag 100 über 90 Tage alt, also fällig: Frage statt Löschen
    // (die echte Pause, bei der nichts fällig ist, folgt im nächsten Fall)
    neuStart(START + 100 * TAG);
    expect(uhrWarnung()).not.toBeNull();
    expect(einsaetzeLaden()).toHaveLength(1);
  });

  it("echte Pause ohne jede Sammlung: weder Warnung noch Frage", () => {
    geprueftesJetzt();
    neuStart(START + 100 * TAG);
    expect(uhrWarnung()).toBeNull();
  });

  it("zurückgestellte Uhr, dann korrigiert: keine falsche Warnung, Sammlungen bleiben (R5-O5)", () => {
    sammlungen();
    neuStart(START - 400 * TAG);
    expect(uhrWarnung()?.richtung).toBe("zurueck");
    einsatzAnlegen("Mit falscher Uhr angelegt", EinsatzArt.EINSATZ);
    neuStart(START + TAG);
    expect(uhrWarnung()).toBeNull();
    expect(einsaetzeLaden().map((s) => s.name).sort()).toEqual(["Laufender Einsatz", "Mit falscher Uhr angelegt"]);
  });

  it("räumt bei plausibler Uhr nach 90 Tagen weiter auf", () => {
    sammlungen();
    neuStart(START + 40 * TAG);
    expect(einsaetzeLaden()).toHaveLength(1);
    expect(einsaetzePapierkorb()).toHaveLength(0); // 30 Tage Papierkorb
    // Die Ankündigung (ab Tag 60) liegt dazwischen, so fällt nichts Unangekündigtes (R6-D7).
    neuStart(START + 65 * TAG);
    expect(einsaetzeLaden()).toHaveLength(1);
    neuStart(START + 91 * TAG); // 26 Tage nach dem letzten Start: plausibel
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

describe("Beschädigter Gesamttext über die echte Ablage (R8-D1)", () => {
  it("legt den Rohtext beiseite, bevor der Kern beim Schreiben [] daraus macht", async () => {
    const { EinsatzArt, einsatzAnlegen, einsaetzeLaden } = await import("@bos/meldekopf/einsaetze");
    const { unlesbarBestand, sammlungenRetteZuruecksetzen } = await import("./unlesbar");
    sammlungenRetteZuruecksetzen();
    const abgeschnitten = '[{"id":"s1","name":"Hochwasser","eintraege":[{"id":"e1","bogen":{"personal":[{"vorname":"An';
    mem.setItem(SCHLUESSEL, abgeschnitten);
    verdrahten();
    expect(einsaetzeLaden()).toEqual([]);
    einsatzAnlegen("Neuer Einsatz", EinsatzArt.EINSATZ);
    expect(unlesbarBestand()?.texte).toEqual([{ art: "sammlungen", text: abgeschnitten }]);
  });
});
