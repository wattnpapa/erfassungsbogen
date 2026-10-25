/**
 * Wächter für das Startbündel (ADR-003, Aufnahmeregel 5; Audit Runde 5).
 *
 * `hilfen.ts` darf `datenschutz-uhr.ts` nicht importieren: Über dessen Kette
 * (uhr-folgen → Meldekopf-Kern → Darstellung → Vokabulare) rutschten Berufe,
 * Ortsverbände und Regionalstruktur (~330 KB) aus den nachgeladenen Brocken in
 * das Startbündel, 1,04 → 1,58 MB. Die geprüfte Uhr wird stattdessen beim Start
 * angemeldet (`stempelQuelleSetzen`, main.tsx).
 */

import { readFileSync } from "node:fs";
import { describe, it, expect, afterEach } from "vitest";
import { jetztZeitpunkt } from "@bos/eeb-format/model";
import { neuerBogen, stempelQuelleSetzen } from "./hilfen";

function quelltext(datei: string): string {
  return readFileSync(new URL(datei, import.meta.url), "utf8");
}

describe("Startbündel-Wächter", () => {
  afterEach(() => stempelQuelleSetzen(() => jetztZeitpunkt()));

  it("hilfen.ts importiert die Uhr-Module nicht", () => {
    const q = quelltext("./hilfen.ts");
    expect(q).not.toMatch(/from\s+["']\.\/(datenschutz-uhr|uhr-folgen|uhr-korrektur|uhr-warnung)["']/);
  });

  it("main.tsx meldet die geprüfte Uhr an", () => {
    const q = quelltext("./main.tsx");
    expect(q).toMatch(/stempelQuelleSetzen\(\s*stempelZeitpunkt\s*\)/);
  });

  it("die angemeldete Quelle stempelt neue Bögen", () => {
    stempelQuelleSetzen(() => 12345);
    expect(neuerBogen().stand).toBe(12345);
  });
});
