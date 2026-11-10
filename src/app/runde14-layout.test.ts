/**
 * Behebungen aus Runde 14 (Layout): Tabellenkopf „Ges." (R14-M1), Umbruch nach „/" (R14-M2), Assistentenkopf bei 320 px
 * (R14-M3), Aufklappmarke im Scanner (R14-M4), Ansicht-Kacheln der Fußzeile (R14-G3), Länderliste (R14-H3), Bedarf im
 * ersten Bild (R14-K5). Die Maße wurden zusätzlich im Produktionsbuild mit Playwright gemessen (Chromium, Touch-Wisch).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const lies = (pfad: string) => readFileSync(new URL(pfad, import.meta.url), "utf8");
const html = lies("../../index.html");
const uebersicht = lies("../../public/uebersicht.html");

const abschnitt = (() => {
  const von = html.indexOf("/* ===== Runde 14 (Layout) ===== */");
  expect(von).toBeGreaterThan(0);
  const bis = html.indexOf("/* ===== Ende Runde 14 (Layout) ===== */", von);
  expect(bis).toBeGreaterThan(von);
  return html.slice(von, bis).replace(/\/\*[\s\S]*?\*\//g, "");
})();

describe("Stilregeln Runde 14 (Layout)", () => {
  it("Tabellenrahmen ohne Seitenpolster, Namensspalte fest, Spalten rasten nach der Namensspalte (R14-M1)", () => {
    expect(abschnitt).toMatch(/tabellen-scroll:has\(> table\.einheiten-tabelle\)\s*\{[^}]*padding-inline:\s*0/);
    expect(abschnitt).toMatch(/scroll-padding-inline-start:\s*min\(7\.5rem,\s*38vw\)/);
    expect(abschnitt).toMatch(/thead > tr > :nth-child\(n\+2\)\s*\{\s*scroll-snap-align:\s*start/);
    expect(abschnitt).toMatch(/:first-child\s*\{[^}]*width:\s*min\(7\.5rem,\s*38vw\)[^}]*max-width:\s*min\(7\.5rem,\s*38vw\)/);
  });
  it("Assistentenkopf bei 320 px ohne Logo-Zeile (R14-M3)", () => {
    expect(abschnitt).toMatch(/max-width:\s*21rem\)\s*\{\s*\.seiten-kopf\.assistent-kopf \.titelzeile:not\(:has\(\.modus-marke\)\)\s*\{\s*display:\s*none/);
  });
  it("Hinweise zum Handscanner mit Aufklappmarke (R14-M4)", () => {
    expect(abschnitt).toMatch(/\.handscanner-hinweise > summary::before\s*\{\s*content:\s*"▸"/);
    expect(abschnitt).toMatch(/\.handscanner-hinweise\[open\] > summary::before\s*\{\s*content:\s*"▾"/);
  });
  it("Ansicht-Kacheln der Fußzeile mit 8 px Abstand und eigenem Rahmen (R14-G3)", () => {
    expect(abschnitt).toMatch(/\.fuss-gruppe \.anzeige-schalter\s*\{\s*gap:\s*8px;\s*border:\s*none/);
    expect(abschnitt).toMatch(/\.fuss-gruppe \.anzeige-schalter button\s*\{\s*border:\s*var\(--strich\) solid/);
  });
});

describe("Länderliste der Übersichtsseite (R14-H3)", () => {
  it("Verweise mindestens 44 px hoch (2,75 rem), 8 px Abstand", () => {
    expect(uebersicht).toMatch(/\.laenderliste\s*\{[^}]*gap:\s*0\.5rem\s*;/);
    expect(uebersicht).toMatch(/\.laenderliste a\s*\{[^}]*min-height:\s*2\.75rem/);
    expect(uebersicht).toMatch(/\.start\s*\{[^}]*min-height:\s*2\.75rem/);
  });
});
