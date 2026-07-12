import { describe, it, expect } from "vitest";
import {
  FUNKRUF_KENNWOERTER,
  THW_EINHEITSTYPEN,
  THW_EMAIL_TEMPLATES,
  THW_FAHRZEUGTYPEN,
  THW_FUNKTIONEN,
  THW_HIERARCHIE_EBENEN,
  type VokabularEintrag,
} from "./thw";

// Alle im Codec adressierbaren THW-Vokabulare. Jede Tabelle wird über
// VokabularWert.code referenziert; Datenpflege-Fehler (doppelte oder
// 0-Codes, leere Labels) würden QR-Kodierung/Anzeige stillschweigend
// verfälschen — daher hier hart abgesichert.
const TABELLEN: [string, VokabularEintrag[]][] = [
  ["THW_HIERARCHIE_EBENEN", THW_HIERARCHIE_EBENEN],
  ["THW_EINHEITSTYPEN", THW_EINHEITSTYPEN],
  ["THW_FUNKTIONEN", THW_FUNKTIONEN],
  ["THW_FAHRZEUGTYPEN", THW_FAHRZEUGTYPEN],
  ["FUNKRUF_KENNWOERTER", FUNKRUF_KENNWOERTER],
  ["THW_EMAIL_TEMPLATES", THW_EMAIL_TEMPLATES],
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

describe("THW_FUNKTIONEN", () => {
  it("kennzeichnet jede Funktion als 'funktion' oder 'zusatz'", () => {
    for (const f of THW_FUNKTIONEN) {
      expect(["funktion", "zusatz"]).toContain(f.art);
    }
  });
});
