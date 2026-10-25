/**
 * Stilregeln aus Runde 6 des Audits, die nur im Stylesheet (index.html) leben.
 * Wie stilregeln-r4/r5 prüft der Test den Quelltext (jsdom rechnet kein Layout);
 * die Messwerte stehen in den Berichten unter „Stand der Behebung".
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
const css = html.replace(/\/\*[\s\S]*?\*\//g, "");

describe("Fußleiste des Assistenten (R6-G1, R6-G2)", () => {
  it("die Spalte des Primärknopfs schrumpft nicht unter dessen Breite", () => {
    expect(css).toMatch(/grid-template-columns:\s*auto minmax\(0, auto\) minmax\(0, 1fr\) auto/);
  });

  it("bei Enge fallen „Ansicht“ und „Zur“ weg, bevor etwas überlappt", () => {
    expect(css).toMatch(/@container assistent-nav \(max-width: 19rem\)\s*\{[^}]*\.anzeige-leiste-text\s*\{\s*display:\s*none/);
    expect(css).toMatch(/\.nav-zur\s*\{\s*display:\s*none/);
  });

  it("ohne Abschluss-Knopf bleiben es bei sehr schmalem Bild zwei Zeilen", () => {
    expect(css).toMatch(/footer\.nav\.assistent-nav:not\(\.mit-uebernehmen\) > \.primaer\s*\{\s*grid-row:\s*1/);
  });
});

describe("Warnleiste und Balken (R6-M1, R6-M8)", () => {
  it("die feste Warnleiste ist auf die Hälfte des Fensters gedeckelt und rollt in sich", () => {
    expect(css).toMatch(/\.fest-warnung\s*\{[^}]*max-height:\s*50vh[^}]*overflow-y:\s*auto/);
  });

  it("der Ansicht-Balken wird im niedrigen Bild zur Ecke", () => {
    expect(css).toMatch(/@media \(max-height: 30rem\)\s*\{\s*\.anzeige-balken\s*\{[^}]*left:\s*auto/);
  });
});

describe("Schrittleiste bei großer Schrift (R6-M2)", () => {
  it("die Reiter teilen die Breite des Kopfes und rollen nicht hinaus", () => {
    expect(css).toMatch(/:root \.seiten-kopf\.assistent-kopf \.schritte button\s*\{[^}]*flex:\s*1 1 0[^}]*min-width:\s*0/);
  });
});

describe("Lagemonitor (R6-L3)", () => {
  it("beginnt schwarz, noch bevor das Bundle da ist", () => {
    expect(css).toMatch(/html\.lagemonitor-start,\s*html\.lagemonitor-start body\s*\{\s*background:\s*#000/);
    expect(html).toMatch(/lagemonitor=.*lagemonitor-start/s);
  });
});
