/**
 * Stilregeln aus Runde 3 des Audits, die nur im Stylesheet (index.html)
 * leben. jsdom rechnet keine Kaskade, deshalb prüft der Test den Quelltext —
 * wie stilregeln-r2.test.ts.
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { kontrast } from "./org-farben";

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

/** Wert eines Tokens im ersten Block mit genau diesem Selektor. */
function token(selektor: string, name: string): string {
  for (const b of bloecke(selektor)) {
    const m = new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})\\s*;`).exec(b);
    if (m) return m[1]!;
  }
  throw new Error(`${name} fehlt in ${selektor}`);
}

describe("Kleinere Sichtreste (R3-L7)", () => {
  it("Platzhalter (--text-3) nachts mindestens 4,5:1 auf dem Feldgrund", () => {
    expect(kontrast(token(".nacht-modus", "--text-3"), token(".nacht-modus", "--flaeche"))).toBeGreaterThanOrEqual(4.5);
  });

  it("Knopfrahmen (--n-400) mindestens 3:1 auf dem Seitengrund (--n-50)", () => {
    // :root ist die erste Regel des Blatts — ihr „Selektor" reicht bis in den
    // HTML-Kopf, deshalb hier das erste Vorkommen im Stylesheet.
    const roh = (name: string) => new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})\\s*;`).exec(css)![1]!;
    expect(kontrast(roh("--n-400"), roh("--n-50"))).toBeGreaterThanOrEqual(3);
  });

  it("Markenrahmen im Feld-Modus mindestens 3:1 auf Weiß", () => {
    expect(kontrast(token(".feld-modus", "--warn-linie"), "#ffffff")).toBeGreaterThanOrEqual(3);
  });

  it("der Ladehinweis trägt den Rahmen in der Schriftfarbe, nicht in Grün", () => {
    expect(bloecke(".start > p.offline-badge.offline-laedt").join("\n")).toMatch(/border-color:\s*currentColor/);
  });

  it("die Segmentgrenze des Umschalters liegt auf --linie-stark, auch im Kopf", () => {
    expect(bloecke(".anzeige-schalter button + button").join("\n")).toMatch(/var\(--linie-stark\)/);
    expect(css).not.toMatch(/anzeige-schalter button \+ button\s*\{[^}]*--kopf-linie/);
  });
});

describe("Restliche kleine Ziele (R3-G4)", () => {
  it("Schrittleiste quer mit vollem Zielmaß", () => {
    expect(css).toMatch(/\.schritte button \{[^}]*min-height: max\(calc\(2\.25rem \+ var\(--ziel\)\), 44px\)/);
  });

  it("Segmente des Umschalters und Kopf-Links mindestens 44 px breit", () => {
    expect(bloecke(".anzeige-schalter button").join("\n")).toMatch(/min-width: calc\(var\(--ziel-basis\) \+ var\(--ziel\)\)/);
    expect(bloecke(".kopfnav-links a").join("\n")).toMatch(/min-width: var\(--ziel-basis\)/);
  });

  it("Paar-Listen geben der Wertspalte Platz (keine max-content-Begriffsspalte)", () => {
    expect(bloecke("dl.paare").join("\n")).toMatch(/grid-template-columns: fit-content\(45%\) minmax\(0, 1fr\)/);
  });
});

describe("Startkopf auf schmalen Telefonen (R3-H5)", () => {
  it("klappt den Anzeigemodus in einer Container-Abfrage ein und verkleinert den Titel", () => {
    expect(css).toMatch(/\.seiten-kopf\.start-kopf \{ container: startkopf \/ inline-size; \}/);
    expect(css).toMatch(/@container startkopf \(max-width: 22rem\) \{[\s\S]*?\.anzeige-schalter\.klappbar:not\(\.offen\) > button:not\(\.anzeige-klappe\) \{ display: none; \}/);
  });
});
