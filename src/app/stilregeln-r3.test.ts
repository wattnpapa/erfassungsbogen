/**
 * Stilregeln aus Runde 3 des Audits, die nur im Stylesheet (index.html)
 * leben. jsdom rechnet keine Kaskade, deshalb prüft der Test den Quelltext —
 * wie stilregeln-r2.test.ts.
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
// Kommentare raus, sonst zählen Begründungen als Regeln.
const css = html.replace(/\/\*[\s\S]*?\*\//g, "");

/** Alle Deklarationsblöcke, deren Selektorliste genau `selektor` ist (Leerraum egal). */
function bloecke(selektor: string): string[] {
  const treffer: string[] = [];
  const glatt = (t: string) => t.replace(/\s+/g, " ").trim();
  const re = /([^{}]+)\{([^{}]*)\}/g;
  for (let m = re.exec(css); m; m = re.exec(css)) {
    if (glatt(m[1]!) === glatt(selektor)) treffer.push(m[2]!);
  }
  return treffer;
}

describe("Tabellenansicht: Abgerückte in voller Deckkraft (R3-L3)", () => {
  it("keine Regel setzt die Deckkraft gestrichener Tabellenzeilen unter 1", () => {
    expect(bloecke("table.einheiten-tabelle tr.gestrichen").join("\n")).not.toMatch(/opacity:\s*0?\.\d/);
  });

  it("durchgestrichen wird nur der Name, nicht der Zeilenkopf mit dem Statuswort", () => {
    expect(bloecke("table.einheiten-tabelle tr.gestrichen th")).toEqual([]);
    expect(bloecke("table.einheiten-tabelle tr.gestrichen th .tabelle-name").join("\n")).toMatch(/line-through/);
  });
});

describe("Taktisches Zeichen auf dunklem Grund (R3-L5)", () => {
  it("bekommt in Dunkel und Nacht überall eine helle Unterlage, auch im App-Kopf", () => {
    const regel = bloecke(
      ":is(.dunkel-modus, .nacht-modus) img.einheit-avatar, :is(.dunkel-modus, .nacht-modus) .seiten-kopf img.einheit-avatar",
    ).join("\n");
    expect(regel).toMatch(/background:\s*#fff/);
    // Später im Blatt als die Plattform-Regel, die die Unterlage im Kopf wegnimmt.
    expect(css.lastIndexOf(":is(.dunkel-modus, .nacht-modus) .seiten-kopf img.einheit-avatar")).toBeGreaterThan(
      css.indexOf(".platform-android .seiten-kopf img.einheit-avatar"),
    );
  });
});
