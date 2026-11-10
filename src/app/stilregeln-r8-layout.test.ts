/**
 * Stilregeln aus Runde 8 des Audits (Block Layout, Kontrast, Anzeige), die nur im Stylesheet (index.html) leben.
 * Wie stilregeln-r7-layout prüft der Test den Quelltext (jsdom rechnet kein Layout); die Messwerte stehen im
 * „Stand der Behebung" der Berichte.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
const css = html.replace(/\/\*[\s\S]*?\*\//g, "");

describe("Kontrast (R8-L2, R8-L6, R8-L7)", () => {
  it("abgewählte Musterungszeilen werden nicht über Deckkraft abgeblendet", () => {
    expect(css).not.toMatch(/\.muster-zeile\.gestrichen\s*\{\s*opacity/);
    expect(css).toMatch(/\.muster-zeile\.gestrichen \.muster-name\s*\{[^}]*line-through[^}]*color:\s*var\(--text-2\)/);
  });
  it("Nacht: dunklere Füllung des Kästchens, Plattformen mit eigener Schriftfarbe auf der Füllung", () => {
    expect(css).toMatch(/\.nacht-modus input\[type="checkbox"\]\s*\{\s*accent-color:\s*#6b4d0e/);
    expect(css).toMatch(/--ios-auf-akzent:\s*var\(--text\)/);
    expect(css).not.toMatch(/\.platform-ios button\.primaer,[^}]*color:\s*#fff/);
    expect(css).toMatch(/--ios-rot:\s*#ff6b61/);
  });
});

describe("Fußleiste und Schrittleiste bei Zoom (R8-G2, R8-M3)", () => {
  it("bleibt bis 160 px einzeilig; erst unter 9rem bekommt der Pfeil eine eigene Zeile", () => {
    expect(css).toMatch(/@media \(max-width: 12rem\)\s*\{\s*footer\.nav\.assistent-nav\s*\{\s*column-gap:\s*4px/);
    expect(css).toMatch(/@media \(max-width: 9rem\)\s*\{\s*footer\.nav\.assistent-nav:not\(\.mit-uebernehmen\) > \.primaer/);
  });
  it("„Weiter“ behält sein Wort, die Reiter stehen zu je drei in zwei Zeilen", () => {
    expect(css).toMatch(/\.nav-zur ~ \.nav-weiter-wort\s*\{\s*display:\s*none/);
    expect(css).toMatch(/\.schritte\s*\{\s*display:\s*grid;\s*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/);
  });
});

describe("Musterung (R8-G4, R8-M10)", () => {
  it("die Kopfzeile der Liste klebt am Telefon nicht, die Leiste nicht bei 180 px und quer", () => {
    expect(css).toMatch(/@media \(max-width: 30rem\)\s*\{\s*\.musterung \.kopfzeile\.klebend\s*\{\s*position:\s*static/);
    expect(css).toMatch(/@media \(max-width: 16rem\), \(max-height: 31\.25rem\)\s*\{\s*\.musterung \.staerke-leiste\s*\{\s*position:\s*static/);
  });
});

describe("Startseite bei Zoom (R8-D4, R8-S3)", () => {
  it("Entwurfskarte unter 16rem: Name, Knöpfe untereinander mit umbrechender Beschriftung, Einzelheiten danach", () => {
    expect(css).toMatch(/@media \(max-width: 16rem\)\s*\{\s*\.entwurf-karte\s*\{\s*flex-direction:\s*column/);
    expect(css).toMatch(/\.entwurf-karte \.entwurf-text\s*\{\s*display:\s*contents/);
    expect(css).toMatch(/\.entwurf-karte \.entwurf-aktionen button, \.entwurf-karte > button\s*\{[^}]*white-space:\s*normal/);
  });
});

describe("Einsatzansicht (R8-K2, R8-K3, R8-M6, R8-M9, R8-N3)", () => {
  it("Namen in der klebenden Spalte brechen nicht im Wort; bei 180 px klebt sie nicht", () => {
    expect(css).toMatch(/table\.einheiten-tabelle tbody th\s*\{[^}]*overflow-wrap:\s*normal/);
    expect(css).toMatch(/@media \(max-width: 16rem\)\s*\{\s*table\.einheiten-tabelle > \* > tr > :first-child\s*\{\s*position:\s*static/);
  });
});

describe("Kurz-Liste, Dialoge (R8-M5, R8-M7)", () => {
  it("Felder der Kurz-Liste tragen sichtbare Beschriftungen, das Rollenfeld vier von sechs Spalten", () => {
    expect(css).toMatch(/schnell-tabelle td:nth-child\(4\)::before\s*\{\s*content:\s*"Zählt als"/);
    expect(css).toMatch(/schnell-tabelle td:nth-child\(4\)\s*\{\s*grid-column:\s*1 \/ span 4/);
  });
  it("die Kopfzeile einfacher Dialoge klebt, Textknöpfe haben 44 px", () => {
    expect(css).toMatch(/dialog > \.kopfzeile:first-child\s*\{\s*position:\s*sticky;\s*top:\s*0/);
    expect(css).toMatch(/dialog button\.link\s*\{\s*min-height:\s*calc\(44px \+ var\(--ziel\)\)/);
  });
});
