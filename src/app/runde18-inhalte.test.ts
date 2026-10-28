/**
 * Runde 18, Block Inhalte: Logik ohne Oberfläche — Dateinamen (W6, H9, N10), feste Nummern beim Entfernen (A1, W2), Stand der
 * Angaben und Handänderung in CSV, Excel und PDF (A2, A3, K1), letzte Meldung (K2), Stärke-Schreibweise (W5), Aufnahme-Hinweis
 * (N3), Übergabe und Abschluss (A6, A7), Lageblatt-Nachtragstafel auf einer Seite (A9).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  Ernaehrung,
  Fahrerlaubnis,
  Geschlecht,
  OrganisationsTyp,
  PersonalErfassung,
  SCHEMA_VERSION,
  StaerkeRolle,
  type Erfassungsbogen,
  type Person,
} from "@bos/eeb-format/model";
import { EinsatzArt, MeldeStatus, einheitSchluessel, bogenInhaltsId, einsatzAnlegen, einsaetzeLaden, meldungHinzufuegen, speicherhuelleSetzen, type Einsatzsammlung, type MeldeEintrag } from "@bos/meldekopf/einsaetze";

vi.mock("./nativ", () => ({ istNativ: () => false, textTeilen: async () => {}, binaerTeilen: async () => {} }));

import { artMitMarke, ausgabeDateiname, dateiZeitstempel } from "./hilfen";
import { lieferungsMarke } from "./export-stand";
import { dateiFehlerText } from "./datei-fehler";
import { einheitEntfernen } from "./eintrag-zeiten";
import { entfernenNummernText, meldungsNummern } from "./einheiten-tabelle";
import { einsatzCsvInhalt } from "./einsatz-csv";
import { eintreffzeitStapelHinweis, handAenderungText } from "./angaben-alter";
import { letzteMeldung } from "./einheiten-tabelle";
import { alterKurz, staerkeSpalteKompakt, staerkeSummenText } from "./lagemonitor";
import { abschlussLaden, abschlussOffen, abschlussSetzen, abschlussUebergabeText, einsatzBeendet } from "./einsatz-abschluss";
import { einsatzLageblattSeiteFuellen, type UebersichtEintrag } from "./pdf-dokument";
import { pdfBytes, seitenZahl } from "../../scripts/pdf-in-node";

class MemStorage {
  private m = new Map<string, string>();
  get length() { return this.m.size; }
  clear() { this.m.clear(); }
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
}

beforeEach(() => {
  const mem = new MemStorage() as unknown as Storage;
  (globalThis as { localStorage?: Storage }).localStorage = mem;
  speicherhuelleSetzen(mem);
});

afterEach(() => {
  vi.useRealTimers();
});

function person(rolle: StaerkeRolle): Person {
  return {
    vorname: "T",
    nachname: "X",
    staerkeRolle: rolle,
    funktionen: [],
    fahrerlaubnis: Fahrerlaubnis.NONE,
    geschlecht: Geschlecht.M,
    ernaehrung: Ernaehrung.FLEISCH,
    kontakte: [],
    zusatzqualifikationen: [],
  };
}

function bogen(name: string, mannschaft = 3, stand = 100): Erfassungsbogen {
  return {
    schemaVersion: SCHEMA_VERSION,
    stand,
    einheit: { organisation: OrganisationsTyp.THW, einheitsTyp: { code: 1 }, hierarchie: [{ bezeichnung: { code: 1 }, name }] },
    einsatz: { zeitraumVon: 100, zeitraumBis: 130, ortAuftrag: "Lage" },
    personalErfassung: PersonalErfassung.VOLLSTAENDIG,
    personal: [person(StaerkeRolle.FUEHRER), ...Array.from({ length: mannschaft }, () => person(StaerkeRolle.MANNSCHAFT))],
    fahrzeuge: [],
    sofortbedarf: { verpflegungPersonen: mannschaft + 1, dieselLiter: 0, benzinLiter: 0, gemischLiter: 0, unterbringung: false, ruhezeitErforderlich: false },
  };
}

/** Fünf Einheiten, nacheinander aufgenommen (jede mit eigener Eingangszeit). */
function fuenfEinheiten() {
  vi.useFakeTimers();
  const s = einsatzAnlegen("Hochwasser Weser", EinsatzArt.EINSATZ);
  const namen = ["Albstadt", "Biberach", "Crailsheim", "Freiburg", "Haßmersheim"];
  const keys: string[] = [];
  namen.forEach((n, i) => {
    vi.setSystemTime(new Date(2026, 9, 28, 1, i));
    keys.push(meldungHinzufuegen(s.id, bogen(n))!.eintrag.einheitSchluessel);
  });
  return { s, keys };
}

/** Die Nummern vor dem Entfernen — wie sie die Einsatzansicht dem Aufrufer mitgibt. */
const nummernJetzt = (id: string) => meldungsNummern(einsaetzeLaden().find((x) => x.id === id)!.eintraege);

const nummernVon = (id: string) => {
  const eintraege = einsaetzeLaden().find((x) => x.id === id)!.eintraege;
  const n = meldungsNummern(eintraege);
  return eintraege.map((e) => `${e.bogen.einheit.hierarchie[0]!.name}=${n.get(e.einheitSchluessel)}`).sort();
};

describe("R18-W6/H9/N10 Dateinamen", () => {
  it("steht der Zeitstempel lesbar und sortierbar vorn: JJJJ-MM-TT_HHMM", () => {
    expect(dateiZeitstempel(new Date(2026, 9, 27, 22, 37))).toBe("2026-10-27_2237");
    expect(dateiZeitstempel(new Date(2026, 0, 3, 7, 5))).toBe("2026-01-03_0705");
    const frueh = ausgabeDateiname("lageblatt", "Hochwasser_Weser", "pdf", new Date(2026, 9, 27, 9, 5));
    const spaet = ausgabeDateiname("lageblatt", "Hochwasser_Weser", "pdf", new Date(2026, 9, 27, 22, 37));
    expect(frueh).toBe("2026-10-27_0905_eeb-lageblatt_Hochwasser_Weser.pdf");
    // Nach Namen sortiert entspricht der Reihenfolge der Zeit — auch über Arten hinweg.
    const alle = [spaet, ausgabeDateiname("einsatz-nachtrag", "X", "csv", new Date(2026, 9, 27, 10, 0)), frueh].sort();
    expect(alle[0]).toBe(frueh);
    expect(alle[2]).toBe(spaet);
  });

  it("trägt ein Nachtrag den Zeitstempel einmal; der Bezugspunkt steht in der Datei, nicht im Namen", () => {
    const stand = { zeitpunkt: new Date(2026, 9, 27, 23, 8).getTime(), eintragIds: [] };
    const marke = lieferungsMarke("neue", stand);
    const name = ausgabeDateiname(artMitMarke("einsatz", marke), "Hochwasser_Weser", "csv", new Date(2026, 9, 27, 23, 9));
    expect(name).toBe("2026-10-27_2309_eeb-einsatz-nachtrag_Hochwasser_Weser.csv");
    expect(name.match(/2026/g)).toHaveLength(1);
    expect(name).not.toContain("seit");
    expect(ausgabeDateiname(artMitMarke("einsatz", lieferungsMarke("neue", null)), "X", "csv", new Date(2026, 9, 27, 23, 9))).toContain("erste-lieferung");
    expect(ausgabeDateiname(artMitMarke("einsatz", lieferungsMarke("alle", null)), "X", "xlsx", new Date(2026, 9, 27, 23, 9))).toBe("2026-10-27_2309_eeb-einsatz_X.xlsx");
    // Einzelbogen: „eeb" ohne Art.
    expect(ausgabeDateiname("", "THW_Albstadt", "pdf", new Date(2026, 9, 27, 23, 26))).toBe("2026-10-27_2326_eeb_THW_Albstadt.pdf");
  });

  it("erkennt die eigene Auswertung beim Einlesen auch unter dem neuen Namen (R17-A5 bleibt)", () => {
    for (const name of ["2026-10-27_2309_eeb-einsatz_Hochwasser.csv", "2026-10-27_2309_eeb-einsatz-oldenburg_Hochwasser.xlsx", "2026-10-27_2309_eeb-einsatz-alle-daten-nachtrag_X.csv"]) {
      expect(dateiFehlerText(name, name.endsWith("xlsx") ? "fremd" : "tabelle", "einsatz"), name).toContain("Sammel-PDF");
    }
  });
});

describe("R18-A1/W2 Nummern bleiben beim Entfernen", () => {
  it("lässt Nr. 3–5 stehen, wenn Nr. 2 entfernt wird (Lücke), und gibt die Nummer beim Zurückholen wieder", () => {
    const { s, keys } = fuenfEinheiten();
    expect(nummernVon(s.id)).toEqual(["Albstadt=1", "Biberach=2", "Crailsheim=3", "Freiburg=4", "Haßmersheim=5"]);
    const weg = einheitEntfernen(s.id, keys[1]!, nummernJetzt(s.id));
    expect(weg.every((e) => e.nummer === 2)).toBe(true);
    expect(nummernVon(s.id)).toEqual(["Albstadt=1", "Crailsheim=3", "Freiburg=4", "Haßmersheim=5"]);
    // Zurückholen: die Einheit trägt ihre alte Nummer wieder, die übrigen bleiben.
    const sammlung = einsaetzeLaden().find((x) => x.id === s.id)!;
    sammlung.eintraege.push(...weg);
    expect(meldungsNummern(sammlung.eintraege).get(keys[1]!)).toBe(2);
    expect(meldungsNummern(sammlung.eintraege).get(keys[2]!)).toBe(3);
  });

  it("füllt die Lücke nicht mit einer später eingegangenen Einheit: Sie zählt hinter der höchsten Nummer weiter", () => {
    const { s, keys } = fuenfEinheiten();
    einheitEntfernen(s.id, keys[1]!, nummernJetzt(s.id));
    vi.setSystemTime(new Date(2026, 9, 28, 2, 0));
    const neu = meldungHinzufuegen(s.id, bogen("Müllheim"))!.eintrag;
    const n = meldungsNummern(einsaetzeLaden().find((x) => x.id === s.id)!.eintraege);
    expect(n.get(neu.einheitSchluessel)).toBe(6);
    expect(n.get(keys[3]!)).toBe(4);
  });

  it("nennt in der Rückfrage die frei bleibende Nummer statt aufrückender", () => {
    const { s, keys } = fuenfEinheiten();
    const eintraege = einsaetzeLaden().find((x) => x.id === s.id)!.eintraege;
    expect(entfernenNummernText(eintraege, keys[1]!)).toBe("Nr. 2 bleibt frei, die übrigen Nummern (3–5) bleiben");
    expect(entfernenNummernText(eintraege, keys[4]!)).toBe("");
  });

  it("Papier-Nummern (Papier-Abgleich) füllen weiter die kleinsten freien Nummern für früher Eingegangene (R4-A1)", () => {
    const mk = (id: string, ms: number, nummer?: number): MeldeEintrag => ({
      id,
      einheitSchluessel: id,
      empfangenAm: ms,
      quelle: "scan",
      status: MeldeStatus.ANWESEND,
      bogen: bogen(id),
      ...(nummer != null ? { nummer } : {}),
    });
    // b hat vom Blatt Nr. 3; a (früher) und c (später ohne Nummer): a bekommt die 1, c zählt hinter der 3 weiter.
    const n = meldungsNummern([mk("a", 1000), mk("b", 2000, 3), mk("c", 3000)]);
    expect([n.get("a"), n.get("b"), n.get("c")]).toEqual([1, 3, 4]);
  });
});

describe("R18-A2/A3/K1 Stand der Angaben und Handänderung in den Tabellen", () => {
  function geaendert(): { s: Einsatzsammlung; e: MeldeEintrag } {
    const b = bogen("Albstadt", 8, 50);
    const e: MeldeEintrag = {
      id: bogenInhaltsId(b),
      einheitSchluessel: einheitSchluessel(b.einheit),
      empfangenAm: new Date(2026, 9, 28, 1, 26).getTime(),
      quelle: "manuell",
      status: MeldeStatus.ANWESEND,
      bogen: { ...b, stand: 200 },
      standAbsender: b.stand,
      angaben: { seit: new Date(2026, 9, 28, 0, 6).getTime(), wort: "Stand", geaendertAm: new Date(2026, 9, 28, 1, 26).getTime() },
    };
    const erste: MeldeEintrag = { ...e, id: "erste", quelle: "pdf-import", empfangenAm: new Date(2026, 9, 28, 0, 20).getTime(), bogen: b, angaben: undefined, standAbsender: undefined };
    return { s: { id: "e1", name: "Testlage", art: EinsatzArt.EINSATZ, angelegt: 0, geaendert: 0, eintraege: [erste, e] }, e };
  }

  it("CSV: Spalten „Stand der Angaben“ und „Aufnahme“; Stand ist der des Absenders; Quelle bleibt „Aus Datei“ und die Handänderung steht in „Hinweise“", () => {
    const { s, e } = geaendert();
    const csv = einsatzCsvInhalt(s);
    const zeilen = csv.slice(1).split("\r\n");
    const kopf = zeilen[0]!.split(";");
    expect(kopf).toContain("Stand der Angaben");
    expect(kopf).toContain("Aufnahme");
    expect(kopf).not.toContain("Stand");
    expect(kopf).not.toContain("Empfangen");
    const zelle = (name: string) => zeilen[1]!.split(";")[kopf.indexOf(name)]!;
    expect(zelle("Quelle")).toMatch(/^"?Aus Datei.*am Meldekopf geändert/);
    expect(zelle("Hinweise")).toContain(handAenderungText(e));
    expect(handAenderungText(e)).toMatch(/^Stärke am Meldekopf geändert \d{2}\.\d{2}\.\d{4}, 01:26$/);
    // Der Stand ist der des Absenders (100/50), nicht der Zeitpunkt der Handänderung.
    expect(zelle("Stand der Angaben")).not.toContain("01:26");
  });

  it("eine Umstellung der Kennzeichnung heißt „Kennzeichnung“, nicht „Stärke“", () => {
    const { e } = geaendert();
    expect(handAenderungText({ angaben: { ...e.angaben!, kennzeichnung: true } })).toMatch(/^Kennzeichnung am Meldekopf geändert/);
    expect(handAenderungText({})).toBe("");
  });
});

describe("R18-K2 letzte Meldung", () => {
  const mk = (id: string, ms: number, over: Partial<MeldeEintrag> = {}): MeldeEintrag => ({
    id,
    einheitSchluessel: "a",
    empfangenAm: ms,
    quelle: "scan",
    status: MeldeStatus.ANWESEND,
    bogen: bogen("A"),
    ...over,
  });
  const angaben = (kennzeichnung?: boolean) => ({ seit: 1, wort: "Stand" as const, geaendertAm: 9000, ...(kennzeichnung ? { kennzeichnung } : {}) });

  it("zählt eine Stärkeänderung am Meldekopf als Folgemeldung, die Kennzeichnung und hier entstandene Fassungen nicht", () => {
    expect(letzteMeldung([mk("1", 1000), mk("2", 2000, { quelle: "manuell", angaben: angaben() })])).toBe(2000);
    expect(letzteMeldung([mk("1", 1000), mk("2", 2000, { quelle: "manuell", angaben: angaben(true) })])).toBe(1000);
    expect(letzteMeldung([mk("1", 1000), mk("2", 2000, { quelle: "aufteilung" })])).toBe(1000);
  });
});

describe("R18-W5 eine Schreibweise der Stärke", () => {
  it("setzt alle Zeilen und die Summe kompakt, sobald eine zu breit ist", () => {
    expect(staerkeSpalteKompakt([[1, 1, 2, 4], [0, 2, 9, 11]])).toBe(false);
    expect(staerkeSpalteKompakt([[1, 1, 2, 4], [10, 20, 100, 130]])).toBe(true);
    expect(staerkeSummenText(1, 1, 2, 4, false)).toBe("1 / 1 / 2 / 4");
    expect(staerkeSummenText(1, 1, 2, 4, true)).toBe("1/1/2/4");
    // Ohne Vorgabe wie bisher: nach der eigenen Breite.
    expect(staerkeSummenText(10, 20, 100, 130)).toBe("10/20/100/130");
  });
});

describe("R18-N3, K5 Texte", () => {
  it("datiert den Aufnahme-Hinweis und deutet das Sternchen", () => {
    const t = eintreffzeitStapelHinweis(8, new Date(2026, 9, 27, 22, 41).getTime());
    expect(t).toMatch(/^Aufnahme 22:41: Eintreffzeit dieser 8 Bögen ist die Zeit des Einlesens \(in Lageblatt und Tabellen mit \* markiert\)/);
    expect(eintreffzeitStapelHinweis(1)).toBe("");
  });

  it("schreibt Tage im Monitor aus", () => {
    expect(alterKurz(103 * 1440)).toBe("103 Tage");
    expect(alterKurz(1440)).toBe("1 Tag");
    expect(alterKurz(90)).toBe("1 Std 30 Min");
  });
});

describe("R18-A6/A7 Übergabe und Abschluss", () => {
  const ids = ["e1", "e2"];

  it("vermerkt Übergabe und Ende je Einsatz, getrennt und rückgängig zu machen", () => {
    expect(abschlussLaden("e1")).toEqual({});
    expect(einsatzBeendet("e1")).toBe(false);
    expect(abschlussSetzen("e1", { uebergabeAm: 1000, uebergabeAn: "  Stab Oldenburg " }, ids)).toBe(true);
    expect(abschlussLaden("e1")).toEqual({ uebergabeAm: 1000, uebergabeAn: "Stab Oldenburg" });
    expect(abschlussUebergabeText(abschlussLaden("e1"), (ms) => `um ${ms}`)).toBe("Übergabe vermerkt um 1000 an Stab Oldenburg");
    // „Beendet" ändert die Übergabe nicht.
    abschlussSetzen("e1", { beendetAm: 2000 }, ids);
    expect(einsatzBeendet("e1")).toBe(true);
    expect(abschlussLaden("e1")).toMatchObject({ uebergabeAm: 1000, beendetAm: 2000 });
    // Ein anderer Einsatz bleibt unberührt.
    expect(abschlussLaden("e2")).toEqual({});
    // Wieder öffnen und Vermerk entfernen.
    abschlussSetzen("e1", { beendetAm: null }, ids);
    abschlussSetzen("e1", { uebergabeAm: null, uebergabeAn: null }, ids);
    expect(abschlussLaden("e1")).toEqual({});
    expect(localStorage.getItem("eeb.abschluss.v1")).toBeNull();
  });

  it("ohne Empfänger steht nur die Zeit; Einträge zu gelöschten Einsätzen fallen beim Schreiben weg", () => {
    abschlussSetzen("alt", { beendetAm: 1 }, ["alt", "e1"]);
    abschlussSetzen("e1", { uebergabeAm: 5 }, ["e1"]);
    expect(abschlussLaden("alt")).toEqual({});
    expect(abschlussUebergabeText(abschlussLaden("e1"), (ms) => `${ms}`)).toBe("Übergabe vermerkt 5");
  });

  it("nennt, was am Abschluss noch fehlt", () => {
    expect(abschlussOffen([{ name: "Lageblatt", getan: true }, { name: "Datensicherung", getan: false }])).toEqual(["Datensicherung"]);
    expect(abschlussOffen([{ name: "Lageblatt", getan: true }])).toEqual([]);
  });
});

describe("R18-A9 Lageblatt: Nachtragstafel auf einer Seite", () => {
  const hatPdftotext = (() => {
    try {
      execFileSync("pdftotext", ["-v"], { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  })();

  async function seitenTexte(dd: Parameters<typeof pdfBytes>[0]): Promise<string[]> {
    const dir = mkdtempSync(join(tmpdir(), "lageblatt18-"));
    try {
      const datei = join(dir, "x.pdf");
      writeFileSync(datei, await pdfBytes(dd));
      const n = seitenZahl(readFileSync(datei));
      const out: string[] = [];
      for (let s = 1; s <= n; s++) out.push(execFileSync("pdftotext", ["-f", String(s), "-l", String(s), "-layout", datei, "-"], { encoding: "utf8" }));
      return out;
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }

  function beispiele(n: number): UebersichtEintrag[] {
    const dir = new URL("../../examples/thw/", import.meta.url);
    const dateien = readdirSync(dir).filter((d) => d.endsWith(".json")).sort();
    const erstellt = new Date("2026-10-28T01:00").getTime();
    return dateien.slice(0, n).map((datei, i) => ({
      bogen: JSON.parse(readFileSync(new URL(datei, dir), "utf8")) as Erfassungsbogen,
      zugEtikett: `${1 + (i % 2)}. Zug`,
      eingetroffenAm: erstellt - 3_600_000,
      empfangenAm: erstellt - 7_200_000,
      nummer: i + 1,
      notiz: i % 2 ? "Deich Nord sichern" : undefined,
    }));
  }

  it.skipIf(!hatPdftotext).each([3, 4, 5, 6, 8, 10, 12])("%i Einheiten: Tafel „Nachtrag von Hand“ und „Summe einschl. Nachträge“ stehen auf derselben Seite", async (n) => {
    const erstellt = new Date("2026-10-28T01:00").getTime();
    const dd = await einsatzLageblattSeiteFuellen("Hochwasser Weser", beispiele(n), pdfBytes, erstellt);
    const seiten = await seitenTexte(dd);
    const mitTafel = seiten.filter((t) => t.includes("Nachtrag von Hand"));
    expect(mitTafel, `Seiten mit Tafel bei ${n} Einheiten`).toHaveLength(1);
    expect(mitTafel[0]).toContain("Summe einschl. Nachträge");
    expect(seiten.filter((t) => t.includes("Summe einschl. Nachträge"))).toHaveLength(1);
  }, 60_000);
});
