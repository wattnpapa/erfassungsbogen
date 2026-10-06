import { describe, expect, it } from "vitest";
import { OrganisationsTyp } from "@bos/eeb-format/model";
import { kontrast, kopfDunkel, orgAkzentPalette, orgFarbe } from "./org-farben";

const HEX = /^#[0-9a-f]{6}$/;

/** Relative Helligkeit 0–1 (wie in org-farben.ts) — für Reihenfolge-Prüfungen. */
function helligkeit(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

describe("orgAkzentPalette", () => {
  it("übernimmt die Kennfarbe der Organisation als Grundton (wie im PDF)", () => {
    expect(orgAkzentPalette(OrganisationsTyp.FEUERWEHR).akzent).toBe("#c8102e");
    expect(orgAkzentPalette(OrganisationsTyp.THW).akzent).toBe("#20214f");
    // Der PDF-Grundton ist identisch — eine gemeinsame Quelle.
    expect(orgAkzentPalette(OrganisationsTyp.DRK).akzent).toBe(orgFarbe(OrganisationsTyp.DRK).akzent);
  });

  it("weicht bei sehr hellen Kennfarben auf lesbares Neutralgrau aus (Rettungsdienst = weiß)", () => {
    // Weiß wäre als Akzent auf hellem Grund unsichtbar → Neutralgrau statt #ffffff.
    expect(orgAkzentPalette(OrganisationsTyp.RETTUNGSDIENST).akzent).toBe("#4d4d4d");
  });

  it("liefert für jede bekannte Organisation gültige #rrggbb-Werte", () => {
    for (const org of Object.values(OrganisationsTyp).filter((v): v is OrganisationsTyp => typeof v === "number")) {
      const p = orgAkzentPalette(org);
      expect(p.akzent).toMatch(HEX);
      expect(p.hell).toMatch(HEX);
      expect(p.dunkel).toMatch(HEX);
      expect(p.tief).toMatch(HEX);
    }
  });

  it("ordnet die Töne nach Helligkeit: tief < akzent < hell < dunkel", () => {
    // dunkel = Tint für dunklen Grund (hell), tief = Text darauf (sehr dunkel).
    const p = orgAkzentPalette(OrganisationsTyp.FEUERWEHR);
    expect(helligkeit(p.tief)).toBeLessThan(helligkeit(p.akzent));
    expect(helligkeit(p.akzent)).toBeLessThan(helligkeit(p.hell));
    expect(helligkeit(p.hell)).toBeLessThan(helligkeit(p.dunkel));
  });

  // --- Kontrast ----------------------------------------------------------
  //
  // Die abgeleiteten Töne waren einmal von Hand gegen das THW-Blau geprüft
  // und galten dann für alle zwölf Kennfarben mit. Gemessen fielen dabei
  // acht Organisationen unter AA — der DLRG-Link auf 2,3:1. Die Rechnung ist
  // deterministisch, also gehört sie hierher und nicht in eine Sichtprüfung.

  const ALLE = Object.values(OrganisationsTyp).filter((v): v is OrganisationsTyp => typeof v === "number");

  it.each(ALLE)("hält für Organisation %s überall 4,5:1 ein", (org) => {
    const p = orgAkzentPalette(org);
    // Links und Hover stehen als Schrift auf der weißen Fläche.
    expect(kontrast(p.hell, "#ffffff")).toBeGreaterThanOrEqual(4.5);
    // Kopfbalken: die Fläche ist die Kennfarbe.
    expect(kontrast("#ffffff", p.akzent)).toBeGreaterThanOrEqual(4.5);
    expect(kontrast(p.kopfAuf2, p.akzent)).toBeGreaterThanOrEqual(4.5);
    expect(kontrast(p.kopfGut, p.akzent)).toBeGreaterThanOrEqual(4.5);
  });

  it("lässt Link und Grundton unterscheidbar — ein Hover ohne Farbwechsel ist kein Hover", () => {
    for (const org of ALLE) {
      const p = orgAkzentPalette(org);
      expect(p.hell).not.toBe(p.akzent);
    }
  });

  it("hellt den Link-Ton auf, wo der Kontrast es zulässt", () => {
    // Die Absicht bleibt „heller = anfassbar". Nur das DLRG-Gelb steht so
    // dicht an Weiß, dass schon der kleinste Schritt AA reißt — dort dunkelt
    // der Ton ab, statt unlesbar zu werden.
    const dunkler = ALLE.filter((org) => {
      const p = orgAkzentPalette(org);
      return helligkeit(p.hell) < helligkeit(p.akzent);
    });
    expect(dunkler).toEqual([OrganisationsTyp.DLRG]);
  });

  it("hält den Erledigt-Haken grün, solange ein grüner Ton trägt", () => {
    // Auf DRK-Rot und DLRG-Gelb liegt kein grüner Ton mit 4,5:1 — dort wird
    // der Haken weiß; die Auskunft hängt dann am Zeichen, nicht an der Farbe.
    const weiss = ALLE.filter((org) => orgAkzentPalette(org).kopfGut === "#ffffff");
    expect(weiss).toEqual([OrganisationsTyp.DRK, OrganisationsTyp.DLRG]);
    expect(orgAkzentPalette(OrganisationsTyp.THW).kopfGut).toBe("#8fe0ab");
  });

  it("liefert auch die Kopf-Töne als gültige #rrggbb-Werte", () => {
    for (const org of ALLE) {
      const p = orgAkzentPalette(org);
      expect(p.kopfAuf2).toMatch(HEX);
      expect(p.kopfGut).toMatch(HEX);
    }
  });
});

const ALLE_ORGS = Object.values(OrganisationsTyp).filter((v): v is OrganisationsTyp => typeof v === "number");

/** WCAG-Leuchtdichte (mit Gamma) — unabhängig von org-farben.ts nachgerechnet. */
function leuchtdichte(hex: string): number {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

/**
 * Audit Runde 4, R4-L1/R4-L2: Im Dunkel-Modus stand die Kennfarbe als
 * vollflächiger Kopfbalken über der Seite (DRK #e30613) und trug die Zeile
 * „✓ gespeichert" in Grün (2,59:1). Der Balken wird abgedunkelt, die Schrift
 * darauf bleibt gegen BEIDE Töne lesbar.
 */
describe("kopfDunkel: Kopfbalken im Dunkel-Modus (R4-L2)", () => {
  const MALTESER = leuchtdichte(orgAkzentPalette(OrganisationsTyp.MHD).akzent);

  it("dunkle Kennfarben bleiben unverändert (THW, Malteser, Johanniter)", () => {
    for (const org of [OrganisationsTyp.THW, OrganisationsTyp.MHD, OrganisationsTyp.JUH]) {
      const p = orgAkzentPalette(org);
      expect(p.kopfDunkel).toBe(p.akzent);
    }
  });

  it("kein Kopfbalken ist heller als der Malteser-Balken", () => {
    for (const org of ALLE_ORGS) {
      expect(leuchtdichte(orgAkzentPalette(org).kopfDunkel)).toBeLessThanOrEqual(MALTESER + 1e-3);
    }
  });

  it("DRK, Feuerwehr, DLRG und ASB werden merklich dunkler, behalten aber ihren Farbton", () => {
    for (const org of [OrganisationsTyp.DRK, OrganisationsTyp.FEUERWEHR, OrganisationsTyp.DLRG, OrganisationsTyp.ASB]) {
      const p = orgAkzentPalette(org);
      expect(p.kopfDunkel).not.toBe(p.akzent);
      expect(leuchtdichte(p.kopfDunkel)).toBeLessThan(leuchtdichte(p.akzent) * 0.6);
    }
    // Rot bleibt rot: Rotanteil überwiegt, kein Grau.
    const drk = orgAkzentPalette(OrganisationsTyp.DRK).kopfDunkel;
    expect(parseInt(drk.slice(1, 3), 16)).toBeGreaterThan(parseInt(drk.slice(3, 5), 16) * 3);
  });

  it("Weiß, Zweitschrift und Haken tragen auf dem Balken mit mindestens 4,5:1", () => {
    for (const org of ALLE_ORGS) {
      const p = orgAkzentPalette(org);
      expect(kontrast("#ffffff", p.kopfDunkel)).toBeGreaterThanOrEqual(4.5);
      expect(kontrast(p.kopfAuf2, p.kopfDunkel)).toBeGreaterThanOrEqual(4.5);
      expect(kontrast(p.kopfGut, p.kopfDunkel)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("ist ein #rrggbb-Wert, auch für unbekannte (Neutral-)Töne", () => {
    expect(kopfDunkel("#ff0000")).toMatch(HEX);
    expect(kopfDunkel("#000000")).toBe("#000000");
  });
});

/** Die Zeile im Kopf liegt auf der Kennfarbe: Zweitschrift der Kennfarbe, nie das Grün der Seite. */
describe("Speicherzeile im Kopf (R4-L1)", () => {
  it("die Zweitschrift der Kennfarbe erreicht auf jeder Kennfarbe 4,5:1 — das Grün der Seite nicht", () => {
    const GUT_DUNKEL = "#6cd18a"; // --gut im Dunkel-Modus
    const ALT = [OrganisationsTyp.DLRG, OrganisationsTyp.DRK, OrganisationsTyp.FEUERWEHR, OrganisationsTyp.ASB, OrganisationsTyp.POLIZEI];
    for (const org of ALLE_ORGS) {
      const p = orgAkzentPalette(org);
      expect(kontrast(p.kopfAuf2, p.akzent)).toBeGreaterThanOrEqual(4.5);
    }
    for (const org of ALT) {
      // Das war der Fehler: die Seitenfarbe auf der Kennfarbe.
      expect(kontrast(GUT_DUNKEL, orgAkzentPalette(org).akzent)).toBeLessThan(4.5);
    }
  });
});
