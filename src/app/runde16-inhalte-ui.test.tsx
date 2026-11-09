/**
 * Runde 16, Block Inhalte: Verhalten in der Oberfläche — Dauer der Papierabgleich-Eingaben (R16-A2), Name und Ort des
 * Einsatzes ändern (R16-K1), Tabellenzelle „Stand vor …“ (R16-N1), Schnelleinstieg und Karte der Startseite (R16-N2).
 */
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("./pdf", () => ({
  pdfErzeugen: async () => {},
  pdfBlobUrl: async () => "blob:pdf-vorschau",
  einsatzPdfErzeugen: async () => true,
  einsatzLageblattErzeugen: async () => true,
  blankoPdfErzeugen: async () => true,
}));
vi.mock("./nativ", async () => {
  const echt = await vi.importActual<typeof import("./nativ")>("./nativ");
  return {
    istNativ: () => false,
    plattform: () => "web",
    imWebBrowser: () => true,
    bogenLinksEmpfangen: () => () => {},
    qrScannen: async () => "",
    binaerTeilen: async () => {},
    linkTeilen: async () => {},
    textTeilen: async () => {},
    shareSheetVerfuegbar: () => false,
    nahbereichDienst: echt.nahbereichDienst,
    pdfEinbettbar: () => true,
  };
});
vi.mock("./pdf-qr", () => ({ qrTexteAusPdfBytes: async () => [] }));

const { App } = await import("./app");

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  localStorage.clear();
  sessionStorage.clear();
});


describe("R16-L1 Beschriftung der Kennzahlen-Kacheln (Stilregel)", () => {
  // Gemessen im Produktionsbuild (Chromium, Touch, 390/360/320 px, Standard/Feld/Nacht): Text höchstens Zellbreite, mindestens 7 px Reserve.
  const html = readFileSync(`${process.cwd()}/index.html`, "utf8");
  const von = html.indexOf("/* ===== Runde 16 (Inhalte) ===== */");
  const bis = html.indexOf("/* ===== Ende Runde 16 (Inhalte) ===== */");
  const abschnitt = html.slice(von, bis).replace(/\/\*[\s\S]*?\*\//g, "");

  it("deckelt die Beschriftung der ersten drei Kacheln und kürzt deren Innenrand am Telefon", () => {
    expect(von).toBeGreaterThan(0);
    expect(bis).toBeGreaterThan(von);
    expect(abschnitt).toMatch(/@media \(max-width: 30rem\)[\s\S]*?:nth-child\(-n \+ 3\) span \{ font-size: min\(var\(--t-xs\), 13px\); letter-spacing: 0\.04em; \}/);
    expect(abschnitt).toMatch(/@media \(max-width: 21rem\)[\s\S]*?:nth-child\(-n \+ 3\) span \{ font-size: min\(var\(--t-xs\), 12px\)/);
    expect(abschnitt).toMatch(/:nth-child\(-n \+ 3\) \{ padding-inline: 6px; \}/);
  });
});
