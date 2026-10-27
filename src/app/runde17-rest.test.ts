/**
 * Runde 17, Layout-Reste: Zeilenknöpfe der Personenzeile (S5/D2), Beschriftung und Breite des Felds „Dienststelle" der Kurz-Liste
 * (S6), Abstand im Dialog „Alle Daten löschen" (D7) und Abstand der riskanteren Antwort der Rückfrage „Nur Sollplätze" (S1).
 * Die Pixelmaße wurden im Produktionsbuild gemessen (Playwright, 360 × 640 und 390 × 844); hier steht die CSS-Zusage dahinter.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const html = readFileSync(`${process.cwd()}/index.html`, "utf8");
const ohneKommentare = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "");
const abschnitt = (() => {
  const von = html.indexOf("/* ===== Runde 17 (Rest) ===== */");
  const bis = html.indexOf("/* ===== Ende Runde 17 (Rest) ===== */");
  expect(von).toBeGreaterThan(-1);
  expect(bis).toBeGreaterThan(von);
  return ohneKommentare(html.slice(von, bis));
})();

describe("Runde 17 (Rest)", () => {
  it("R17-S5/D2: Zeilenknöpfe mit 44 px Tippfläche und mindestens 8 px Lücke, am Telefon in eigener Reihe", () => {
    expect(abschnitt).toMatch(/\.sortieren > button\s*\{[^}]*min-width: 44px; min-height: 44px/);
    expect(abschnitt).toMatch(/\.sortieren \{ gap: 12px; \}/);
    expect(abschnitt).toMatch(/@container \(min-width: 24\.01rem\) and \(max-width: 44rem\)[\s\S]*\.sortieren \{ flex-wrap: nowrap; gap: 8px; \}/);
    expect(abschnitt).toMatch(/@container \(min-width: 17rem\) and \(max-width: 24rem\)[\s\S]*td\.stelle \{ grid-column: 1 \/ -1; grid-row: 1; \}/);
    expect(abschnitt).toMatch(/td\.sortier-spalte \{ grid-column: 1 \/ -1; grid-row: 2;/);
    expect(abschnitt).toMatch(/tr \{ column-gap: 12px; \}/);
  });

  it("R17-S6: Dienststelle der Kurz-Liste in voller Breite mit sichtbarer Beschriftung", () => {
    expect(abschnitt).toMatch(/td:nth-child\(6\) \{ grid-column: 1 \/ -1; grid-row: 5;/);
    expect(abschnitt).toMatch(/td:nth-child\(6\)::before \{[^}]*content: "Dienststelle"/);
    expect(abschnitt).toMatch(/td:nth-child\(6\) input[^{]*\{[^}]*min-width: 12rem/);
  });

  it("R17-D7: „Endgültig löschen“ und „Abbrechen“ liegen mindestens 16 px auseinander", () => {
    expect(abschnitt).toMatch(/dialog \.dialog-entscheidung > \.aktionen \{ gap: 16px; row-gap: 16px; \}/);
  });

  it("R17-S1: Die riskantere Antwort der Rückfrage hält mindestens 16 px Abstand zur Hauptantwort (gemessen 28 px)", () => {
    const m = /dialog\.abfrage \.abfrage-weg \+ \.abfrage-weg:has\(> button\.gefahr\) \{ margin-top: (\d+)px; \}/.exec(ohneKommentare(html));
    expect(m).not.toBeNull();
    expect(Number(m![1])).toBeGreaterThanOrEqual(16);
  });
});
