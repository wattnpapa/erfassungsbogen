/**
 * Runde 15, Block Zustand: Logik und Hooks ohne App — eine Quittung zur Zeit (D1), Doppelzählung nur für Übernommenes (D3),
 * Signatur im Lageblatt (E1), später eingegangene Meldung mit älterem Stand (E2), Satzbau mehrteiliger Codes (E3),
 * THW-Kennzeichen (E5), Dauer der Sammel-PDF (O1), unterbrochener Stapel (S1), offene Folgeschritte (S4),
 * Zwischenstand des Papierabgleichs (A4), Tab-Text der Einzel-PDF (A5).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SegmentTeil } from "@bos/eeb-format/codec";
import { teilGelesenSatz, verworfeneTeileSatz } from "./teil-quittung";
import { kennzeichenHinweis } from "./schreibweise";
import { sammelPdfDauerText } from "./arbeitet";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
afterEach(() => {
  vi.useRealTimers();
});


describe("R15-E3 Mehrteilige Codes: Nummer des gelesenen Teils, verworfene Teile genannt", () => {
  const teil = (nr: number, anzahl: number): SegmentTeil => ({ teilNr: nr, anzahl, id: 1, chunk: new Uint8Array() });

  it("Teil 2 zuerst: „Teil 2 gelesen“, danach was fehlt — nicht „Teil 1 von 2 gescannt“", () => {
    expect(teilGelesenSatz(2, [teil(2, 2)])).toBe("Teil 2 gelesen — es fehlt noch Teil 1.");
    expect(teilGelesenSatz(3, [teil(2, 3), teil(3, 3)])).toBe("Teil 3 gelesen — es fehlt noch Teil 1.");
  });

  it("nennt, was ein Wechsel des Bogens oder „Abbrechen“ wegwirft; ohne Zwischenstand nichts", () => {
    expect(verworfeneTeileSatz([teil(1, 3), teil(2, 3)])).toBe("2 von 3 Teilen verworfen");
    expect(verworfeneTeileSatz([teil(2, 2)])).toBe("1 von 2 Teilen verworfen");
    expect(verworfeneTeileSatz([])).toBe("");
  });
});

describe("R15-E5 THW-Kennzeichen mit falscher Ziffernzahl", () => {
  it("fragt bei „THW-“ mit weniger oder mehr als fünf Ziffern, sonst nicht", () => {
    expect(kennzeichenHinweis("THW-8439")).toMatch(/fünf Ziffern.*„THW-8439“ hat 4\. Stimmt das\?/);
    expect(kennzeichenHinweis("thw 843970")).toMatch(/hat 6\. Stimmt das\?/);
    expect(kennzeichenHinweis("THW-84397")).toBeNull();
    expect(kennzeichenHinweis("thw84397")).toBeNull();
    // Andere Formate und freier Text werden nicht beanstandet.
    expect(kennzeichenHinweis("OL-FW 2041")).toBeNull();
    expect(kennzeichenHinweis("DAS IST KEIN KENNZEICHEN")).toBeNull();
    expect(kennzeichenHinweis("")).toBeNull();
  });
});

describe("R15-O1 Dauer der Sammel-PDF richtet sich nach der Zahl der Bögen", () => {
  it("nennt Sekunden bei kleinen und Minuten bei großen Einsätzen, nie eine feste Obergrenze, dazu den Bildschirm", () => {
    // Runde 17 (R17-O1): 2 s je Bogen (gemessen: 66 s für 30 Bögen bei sechsfach gedrosselter CPU).
    expect(sammelPdfDauerText(5)).toMatch(/bei 5 Bögen am Telefon etwa 10 Sekunden oder länger\. Nicht noch einmal tippen/);
    const dreissig = sammelPdfDauerText(30);
    expect(dreissig).not.toContain("halben Minute");
    expect(dreissig).toMatch(/bei 30 Bögen am Telefon etwa 1 Min\. oder länger/);
    expect(dreissig).toMatch(/Bildschirm und Seite offen lassen/);
    expect(sammelPdfDauerText(100)).toMatch(/bei 100 Bögen am Telefon etwa 4 Min\. oder länger/);
  });
});
