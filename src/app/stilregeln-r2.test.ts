/**
 * Stilregeln aus Runde 2 des Audits, die nur im Stylesheet (index.html)
 * leben. jsdom rechnet keine Kaskade, deshalb prüft der Test den Quelltext:
 * dass eine Regel da ist — oder dass eine, die eine andere überstimmt hat,
 * nicht wiederkommt.
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

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
