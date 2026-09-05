import { describe, it, expect } from "vitest";
import { OrganisationsTyp, StaerkeRolle } from "../model";
import {
  FUNKRUF_KENNWOERTER,
  THW_EINHEITSTYPEN,
  THW_FAHRZEUGTYPEN,
  THW_FUNKTIONEN,
  THW_FUNKTIONEN_ALLE,
  THW_HIERARCHIE_EBENEN,
  type VokabularEintrag,
} from "./thw";
import { stanPersonalVorbelegung } from "./thw-stan-personal";

// Alle im Codec adressierbaren THW-Vokabulare. Jede Tabelle wird über
// VokabularWert.code referenziert; Datenpflege-Fehler (doppelte oder
// 0-Codes, leere Labels) würden QR-Kodierung/Anzeige stillschweigend
// verfälschen — daher hier hart abgesichert.
const TABELLEN: [string, VokabularEintrag[]][] = [
  ["THW_HIERARCHIE_EBENEN", THW_HIERARCHIE_EBENEN],
  ["THW_EINHEITSTYPEN", THW_EINHEITSTYPEN],
  ["THW_FUNKTIONEN", THW_FUNKTIONEN],
  ["THW_FUNKTIONEN_ALLE", THW_FUNKTIONEN_ALLE],
  ["THW_FAHRZEUGTYPEN", THW_FAHRZEUGTYPEN],
  ["FUNKRUF_KENNWOERTER", FUNKRUF_KENNWOERTER],
];

describe.each(TABELLEN)("Vokabular %s", (_name, tabelle) => {
  it("ist nicht leer", () => {
    expect(tabelle.length).toBeGreaterThan(0);
  });

  it("verwendet ausschließlich Codes > 0 (0 ist im Codec für Freitext reserviert)", () => {
    for (const e of tabelle) {
      expect(Number.isInteger(e.code)).toBe(true);
      expect(e.code).toBeGreaterThan(0);
    }
  });

  it("hat eindeutige Codes", () => {
    const codes = tabelle.map((e) => e.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("hat nicht-leere Kurz- und Langbezeichnungen", () => {
    for (const e of tabelle) {
      expect(e.kurz.trim().length).toBeGreaterThan(0);
      expect(e.name.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("THW_FUNKTIONEN_ALLE", () => {
  it("kennzeichnet jede Funktion als 'funktion' oder 'zusatz'", () => {
    for (const f of THW_FUNKTIONEN_ALLE) {
      expect(["funktion", "zusatz"]).toContain(f.art);
    }
  });

  it("enthält die Handredaktion vollständig und darüber hinaus die Funktionsliste", () => {
    expect(THW_FUNKTIONEN_ALLE.slice(0, THW_FUNKTIONEN.length)).toEqual(THW_FUNKTIONEN);
    expect(THW_FUNKTIONEN_ALLE.length).toBeGreaterThan(THW_FUNKTIONEN.length);
  });

  it("führt keine Funktion doppelt (sonst gäbe es zwei Codes für dieselbe Sache)", () => {
    // Vergleich ohne Groß-/Kleinschreibung, Leerzeichen und Bindestriche —
    // genau wie der Generator dedupliziert (scripts/thw-funktionen-vokabular.mts).
    const namen = THW_FUNKTIONEN_ALLE.map((f) => f.name.toLowerCase().replace(/[\s\-.]/g, ""));
    const doppelte = namen.filter((n, i) => namen.indexOf(n) !== i);
    expect(doppelte).toEqual([]);
  });
});

describe("OV-Stab (StAN 00-01)", () => {
  const ovStab = THW_EINHEITSTYPEN.find((e) => e.kurz === "OV-Stab")!;

  it("steht als Einheitstyp mit seiner StAN-Nummer im Vokabular", () => {
    expect(ovStab.stanNr).toBe("00-01");
  });

  it("belegt die Ämter vor, die es nur im Ortsverband gibt — je einmal", () => {
    // Abgeleitet aus scripts/quellen/thw-funktionen.csv (alle STAN-Positionen
    // ohne Zug-/Fachgruppen-Bindung); Reihenfolge ist die der Vorbelegung.
    const personal = stanPersonalVorbelegung(OrganisationsTyp.THW, { code: ovStab.code });
    expect(personal.map((p) => p.funktionen[0]?.code)).toEqual([
      238, 283, 204, 242, 278, 201, 202, 239, 284, 237,
    ]);
    // Stärke 2/1/7/10: OB und Vertretung führen, der Fachberater als Unterführer.
    const je = (r: StaerkeRolle) => personal.filter((p) => p.staerkeRolle === r).length;
    expect([je(StaerkeRolle.FUEHRER), je(StaerkeRolle.UNTERFUEHRER), je(StaerkeRolle.MANNSCHAFT)])
      .toEqual([2, 1, 7]);
  });

  it("verweist nur auf Funktionen, die es wirklich gibt", () => {
    const bekannt = new Set(THW_FUNKTIONEN_ALLE.map((f) => f.code));
    const personal = stanPersonalVorbelegung(OrganisationsTyp.THW, { code: ovStab.code });
    for (const p of personal) expect(bekannt.has(p.funktionen[0]!.code!)).toBe(true);
  });
});
