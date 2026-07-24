import { describe, expect, it } from "vitest";
import { OrganisationsTyp } from "../model";
import { orgAkzentPalette, orgFarbe } from "./org-farben";

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
});
