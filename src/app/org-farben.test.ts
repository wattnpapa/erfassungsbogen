import { describe, expect, it } from "vitest";
import { OrganisationsTyp } from "@bos/eeb-format/model";
import { kontrast, orgAkzentPalette, orgFarbe } from "./org-farben";

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
