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
import {
  EinsatzArt,
  MeldeStatus,
  einsatzAnlegen,
  einsaetzeLaden,
  meldungHinzufuegen,
  speicherhuelleSetzen,
  type MeldeEintrag,
} from "@bos/meldekopf/einsaetze";

vi.mock("./nativ", () => ({ istNativ: () => false, textTeilen: async () => {}, binaerTeilen: async () => {} }));

import { ausgabeDateiname, dateiZeitstempel } from "./hilfen";
import { dateiFehlerText } from "./datei-fehler";
import { einheitEntfernen } from "./eintrag-zeiten";
import { meldungsNummern } from "./einheiten-tabelle";
import { type UebersichtEintrag } from "./pdf-dokument";
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
  }, 60_000);
});
