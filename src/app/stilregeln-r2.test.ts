/**
 * Stilregeln aus Runde 2 des Audits, die nur im Stylesheet (index.html)
 * leben. jsdom rechnet keine Kaskade, deshalb prüft der Test den Quelltext:
 * dass eine Regel da ist — oder dass eine, die eine andere überstimmt hat,
 * nicht wiederkommt.
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { kontrast } from "./org-farben";

const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
// Kommentare raus, sonst zählen Begründungen als Regeln.
const css = html.replace(/\/\*[\s\S]*?\*\//g, "");

/** Alle Deklarationsblöcke, deren Selektorliste genau `selektor` ist. */
function bloecke(selektor: string): string[] {
  const treffer: string[] = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  for (let m = re.exec(css); m; m = re.exec(css)) {
    if (m[1].trim() === selektor) treffer.push(m[2]);
  }
  return treffer;
}

describe("Fußleiste und Safe-Area (R2-M7)", () => {
  it("setzt die Safe-Area nirgends per Addition — max() und die Querformat-Verdichtung bleiben wirksam", () => {
    const regeln = bloecke("footer.nav");
    expect(regeln.length).toBeGreaterThan(0);
    for (const r of regeln) {
      expect(r).not.toMatch(/calc\([^;]*safe-area-inset/);
    }
    expect(regeln.join("\n")).toMatch(/padding-bottom:\s*max\(0\.25rem, env\(safe-area-inset-bottom\)\)/);
  });
});

/** Wert eines Tokens im ersten Block mit genau diesem Selektor. */
function token(selektor: string, name: string): string {
  for (const b of bloecke(selektor)) {
    const m = new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})\\s*;`).exec(b);
    if (m) return m[1];
  }
  throw new Error(`${name} fehlt in ${selektor}`);
}

describe("Feldrahmen in den dunklen Themen (R2-L3)", () => {
  it.each([".dunkel-modus", ".nacht-modus"])("%s: Rahmen ≥ 3:1 auf Karte und zweiter Fläche", (modus) => {
    const rahmen = token(modus, "--linie-stark");
    for (const grund of ["--flaeche", "--flaeche-2", "--grund"]) {
      expect(kontrast(rahmen, token(modus, grund)), `${modus} ${grund}`).toBeGreaterThanOrEqual(3);
    }
    // … ohne heller zu werden als die blasseste Schrift.
    expect(kontrast(rahmen, token(modus, "--flaeche"))).toBeLessThan(
      kontrast(token(modus, "--text-3"), token(modus, "--flaeche")),
    );
  });

  it("Eingabefelder ziehen ihren Rahmen aus --linie-stark", () => {
    expect(bloecke("input, select, textarea").join("\n")).toMatch(/border:[^;]*var\(--linie-stark\)/);
  });
});

describe("Fokus in der Schrittleiste (R2-L4)", () => {
  it("zeichnet den Fokusrahmen in der Kopf-Schriftfarbe, nicht in der Kennfarbe des Balkens", () => {
    const regel = bloecke(":root:not(.platform-ios):not(.platform-android) .schritte button:focus-visible").join("\n");
    expect(regel).toMatch(/outline:[^;]*var\(--kopf-auf\)/);
    // nach innen versetzt: die Leiste rollt waagerecht und schnitte einen äußeren Rahmen ab
    expect(regel).toMatch(/outline-offset:\s*calc\(-1 \* var\(--fokus\)\)/);
  });
});
