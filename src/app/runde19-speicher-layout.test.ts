/**
 * Runde 19, Block Speicher, Layout (O7 bis O10): Die Regeln stehen im Abschnitt „Runde 19 (Speicher)" der index.html. Gemessen sind
 * die Werte im Produktionsbuild mit Playwright (360 × 640, 320 × 568); hier steht, dass die Regeln da sind und ihre Grenzen halten.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const html = readFileSync(`${process.cwd()}/index.html`, "utf8");
const abschnitt = html.slice(html.indexOf("/* ===== Runde 19 (Speicher) ===== */"), html.indexOf("/* ===== Ende Runde 19 (Speicher) ===== */"));

describe("Runde 19 (Speicher), Layout", () => {
  it("der Abschnitt ist da", () => {
    expect(abschnitt.length).toBeGreaterThan(500);
  });

  it("R19-O7: In der Schnellerfassung steht der Zettel-Kasten hinter dem Schritt", () => {
    expect(abschnitt).toMatch(/\.schritt-inhalt:has\(> \.nacherfassung-zeit\) \{ display: flex; flex-direction: column; \}/);
    expect(abschnitt).toMatch(/> \.nacherfassung-zeit \{ order: 2; \}/);
  });

  it("R19-O8: Karten | Tabelle und die Fußzeilenlisten halten mindestens 8 px Abstand", () => {
    for (const regel of [/\.ansicht-umschalter \{ gap: (\d+)px !important; \}/, /\.fuss-gruppe \{ gap: (\d+)px; \}/, /\.fuss-schmal nav \{ row-gap: (\d+)px; \}/, /footer\.seite \.fuss-werkzeuge \{ row-gap: (\d+)px; \}/]) {
      const m = regel.exec(abschnitt);
      expect(m, String(regel)).not.toBeNull();
      expect(Number(m![1])).toBeGreaterThanOrEqual(8);
    }
  });

  it("R19-O9/O10: Karte und Rückfrage „Stärke ändern“ sind für 320-px-Telefone gekürzt", () => {
    expect(abschnitt).toContain(".einheit-zeile.karte-offen .neu-badge .neu-kurz { display: inline; }");
    expect(abschnitt).toContain('dialog.abfrage .abfrage-rumpf:has(input[inputmode="numeric"]) { display: grid; grid-template-columns: repeat(3');
    expect(abschnitt).toMatch(/@media \(max-width: 22\.5rem\)/);
  });
});
