/**
 * Stilregeln der Runde 5, Paket 4 (Restpunkte R5-M2, R5-G6, R5-G7, R5-N4), die nur im
 * Stylesheet leben. Wie stilregeln-r5.test.ts prüft der Test den Quelltext; die Messwerte
 * stehen im Bericht unter „Stand der Behebung".
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../../index.html", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

describe("Restpunkte der Layout-Regeln (Paket 4)", () => {
  it("R5-M2: bei niedrigem, schmalem Fenster rücken Einleitung und Weiche der Startseite enger", () => {
    const m = /@media \(max-width: 40rem\) and \(max-height: 40rem\) \{([\s\S]*?)\n    \}/.exec(css)?.[1] ?? "";
    expect(m).toMatch(/\.start > p\.start-intro \{[^}]*font-size:\s*min\(var\(--t-l\), 16px\)/);
    expect(m).toMatch(/\.weiche > \.weiche-weg \{[^}]*padding:/);
  });

  it("R5-G6: in Schritt 3 sind die Abstände vor der ersten Wahl bei niedrigem Querformat gedeckelt", () => {
    expect(css).toMatch(/\.schritt-inhalt > \.karte > p \{ margin-top: min\(var\(--r-2\), 6px\)/);
    expect(css).toMatch(/\.schritt-inhalt > \.karte > \.hinweis \{ margin-top: min\(var\(--r-2\), 6px\)/);
  });

  it("R5-G7: ab 480 px Breite stehen die Reiter der Schrittleiste mit 8 px Lücke", () => {
    expect(css).toMatch(/@media \(min-width: 480px\) \{ \.schritte \{ column-gap: 8px; \} \}/);
  });

  it("R5-N4: der Leistenknopf mit Wort bekommt Rand", () => {
    expect(css).toMatch(/footer\.nav \.anzeige-leiste-knopf:has\(\.anzeige-leiste-text\) \{[^}]*padding-inline:\s*0\.6rem/);
  });
});
