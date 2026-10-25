/**
 * Stilregeln aus Runde 8 des Audits (Block „Dialoge“), die nur im Stylesheet (index.html) leben. Wie
 * stilregeln-r7-layout prüft der Test den Quelltext (jsdom rechnet kein Layout); die Messwerte stehen
 * im „Stand der Behebung“ der Berichte.
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
const css = html.replace(/\/\*[\s\S]*?\*\//g, "");

describe("Sprungmarke bleibt in Ruhe außerhalb des Bildes (R8-M1, R8-O1, R8-G3, R8-S1)", () => {
  it("rückt um die eigene Höhe nach oben, bricht nicht um und kommt nur per Fokus herein", () => {
    expect(css).toMatch(/\.sprungmarke\s*\{[^}]*top:\s*0[^}]*transform:\s*translateY\(calc\(-100% - 8px\)\)/);
    expect(css).toMatch(/\.sprungmarke\s*\{[^}]*white-space:\s*nowrap/);
    expect(css).toMatch(/\.sprungmarke:focus\s*\{\s*transform:\s*translateY\(var\(--r-2\)\)/);
    expect(css).not.toMatch(/\.sprungmarke\s*\{[^}]*top:\s*-3rem/);
  });
});

describe("Rückfragen bei Zoom und großer Schrift (R8-G1, R8-M2, R8-G5, R8-M8)", () => {
  it("die Knopfzeile quer steht nur ab 280 px Breite nebeneinander, mit 16 px Abstand und auf einer Linie", () => {
    expect(css).toMatch(/@media \(max-height: 480px\) and \(min-width: 280px\)\s*\{\s*dialog\.abfrage \.abfrage-fuss\s*\{[^}]*gap:\s*var\(--r-4\)/);
    expect(css).toMatch(/dialog\.abfrage \.abfrage-fuss \.abfrage-aktionen:not\(\.abgesetzt\),/);
    expect(css).toMatch(/dialog\.abfrage \.abfrage-weg > button\s*\{\s*display:\s*flex/);
  });

  it("unter 280 px Breite stehen die Knöpfe untereinander in voller Breite", () => {
    expect(css).toMatch(/@media \(max-width: 279\.98px\)\s*\{[\s\S]*?dialog\.abfrage \.abfrage-fuss\s*\{\s*display:\s*block/);
  });

  it("Schrift und Polster der Knöpfe sind in px gedeckelt, bei sehr niedrigem Bild kompakter", () => {
    expect(css).toMatch(/dialog\.abfrage button\s*\{[^}]*font-size:\s*min\(var\(--t-m\), 18px\)/);
    expect(css).toMatch(/@media \(max-height: 240px\)\s*\{\s*dialog\s*\{\s*max-height:\s*calc\(100dvh - 12px\)/);
  });

  it("die Überschrift bricht an Silben, nicht mitten im Wort", () => {
    expect(css).toMatch(/dialog\.abfrage h2\s*\{[^}]*hyphens:\s*auto/);
  });
});

describe("Papier-Abgleich, Bogen übergeben, beiseitegelegter Bogen (R8-G6, R8-D6, R8-H4)", () => {
  it("„Eingaben verwerfen…“ ist ein Knopf mit 44 px und 16 px Abstand zu „Später“", () => {
    expect(css).toMatch(/\.papier-abgleich-weg\s*\{\s*gap:\s*var\(--r-4\)/);
    expect(css).toMatch(/\.papier-abgleich-weg > button\s*\{\s*min-height:\s*calc\(44px \+ var\(--ziel\)\)/);
    const quelle = readFileSync(new URL("./papier-abgleich-ui.tsx", import.meta.url), "utf8");
    expect(quelle).toMatch(/className="gefahr" onClick=\{\(\) => void eingabenVerwerfen\(\)\}/);
  });

  it("„Für neuen Einsatz vorbereiten“ steht am Ende des Dialogs „Bogen übergeben“, abgesetzt", () => {
    const quelle = readFileSync(new URL("./schritte/uebersicht.tsx", import.meta.url), "utf8");
    const pdf = quelle.indexOf("PDF erzeugen");
    const weitere = quelle.indexOf("Weitere Formate (Link");
    const neu = quelle.indexOf("Für neuen Einsatz vorbereiten\n");
    expect(pdf).toBeLessThan(weitere);
    expect(weitere).toBeLessThan(neu);
    expect(css).toMatch(/\.teilen-dialog \.teilen-weg\.teilen-weg-ende\s*\{[^}]*border-top/);
  });

  it("der Kasten zum beiseitegelegten Bogen nennt keine „Support-Stelle“ und fasst die Einzelheiten unter „Mehr dazu“", () => {
    const quelle = readFileSync(new URL("./app.tsx", import.meta.url), "utf8");
    expect(quelle).not.toMatch(/Support-Stelle/);
    expect(quelle).toMatch(/<details className="beschaedigt-mehr">\s*<summary>Mehr dazu<\/summary>/);
  });
});
