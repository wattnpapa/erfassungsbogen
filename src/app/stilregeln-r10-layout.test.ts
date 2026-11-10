/**
 * Stilregeln aus Runde 10 des Audits (Block Layout, Anzeige, Dialoge), die nur im Stylesheet (index.html) leben.
 * Wie stilregeln-r9-layout prüft der Test den Quelltext (jsdom rechnet kein Layout); die Messwerte stehen im
 * „Stand der Behebung" der Berichte.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
const dialoge = readFileSync(new URL("./dialoge.tsx", import.meta.url), "utf8");

/** Nur der Abschnitt „Runde 10 (Layout)": andere Blöcke dürfen daneben eigene Regeln tragen. */
const abschnitt = (() => {
  const von = html.indexOf("/* ===== Runde 10 (Layout) ===== */");
  expect(von).toBeGreaterThan(0);
  const bis = html.indexOf("/* ===== Ende Runde 10 (Layout) ===== */", von);
  expect(bis).toBeGreaterThan(von);
  return html.slice(von, bis).replace(/\/\*[\s\S]*?\*\//g, "");
})();

describe("Dialoge (R10-L1, R10-M8, R10-W4)", () => {
  it("ein Eingabefeld im Rumpf wird beim Öffnen und beim Fokus ins Bild gerollt (R10-L1)", () => {
    expect(dialoge).toMatch(/function feldInsBild\(/);
    expect(dialoge).toMatch(/scrollIntoView\?\.\(\{ block: "nearest"/);
    // beim Öffnen (nach dem Zurücksetzen auf die Frage) und bei jedem Feldfokus
    expect(dialoge).toMatch(/dialog\.current\.scrollTop = 0;\s*\/\/[^\n]*\s*feldInsBild\(erstes\.current\)/);
    // Auswahl und Textfeld mehrzeilig: je ein Aufruf; das einzeilige Feld markiert zusätzlich Zahlen (R16-S1).
    expect((dialoge.match(/onFocus=\{\(e\) => feldInsBild\(e\.currentTarget\)\}/g) ?? []).length).toBe(2);
    expect(dialoge).toMatch(/feldInsBild\(e\.currentTarget\);\s*if \(f\.zahl\) zahlMarkieren\(e\)/);
  });
  it("Zoom-Fenster: 12 px zwischen den Wegen der Rückfrage (R10-M8)", () => {
    expect(abschnitt).toMatch(/@media \(max-width: 279\.98px\)\s*\{\s*dialog\.abfrage \.abfrage-fuss \.abfrage-weg\s*\{\s*margin:\s*12px 0 0/);
  });
  it("niedriges Querformat: Frage links in voller Höhe, Wege rechts untereinander (R10-W4)", () => {
    expect(abschnitt).toMatch(/@media \(orientation: landscape\) and \(max-height: 31\.25rem\) and \(min-width: 36rem\)/);
    expect(abschnitt).toMatch(/dialog\.abfrage form:has\(> \.abfrage-fuss\)\s*\{\s*display:\s*grid;\s*grid-template-columns:\s*minmax\(0, 1fr\) minmax\(0, min\(18rem, 44%\)\)/);
    expect(abschnitt).toMatch(/\.abfrage-fuss\s*\{\s*grid-column:\s*2;[^}]*flex-direction:\s*column;\s*flex-wrap:\s*nowrap/);
  });
});

describe("Einsatzansicht (R10-G2, R10-M3, R10-M6, R10-K3, R10-M2)", () => {
  it("die Anzahl der Einheiten ist flach: keine Fläche, kein Balken (R10-G2, R10-M7)", () => {
    expect(abschnitt).toMatch(/\.staerke-leiste > div\.anzahl\s*\{\s*background:\s*none/);
    expect(abschnitt).toMatch(/\.staerke-leiste > div\.anzahl\s*\{\s*border-right:\s*0/);
    expect(abschnitt).not.toMatch(/div\.anzahl[^{]*\{[^}]*3px/);
  });
  it("die Ansicht-Kacheln haben 8 px Abstand und je einen eigenen Rand (R10-M6)", () => {
    expect(abschnitt).toMatch(/\.seiten-kopf \.anzeige-schalter\s*\{\s*gap:\s*8px;\s*border:\s*0/);
    expect(abschnitt).toMatch(/\.anzeige-leiste-wahl\s*\{\s*gap:\s*8px/);
  });
  it("Tabelle am Telefon: Rahmen ohne Seitenpolster, schmale Namensspalte, bei 200 % enge Zahlenspalten (R10-K3)", () => {
    expect(abschnitt).toMatch(/@media \(max-width: 20rem\)\s*\{\s*\.karte > \.tabellen-scroll\s*\{\s*padding-inline:\s*0/);
    expect(abschnitt).toMatch(/@container \(max-width: 20rem\)\s*\{[^@]*table\.einheiten-tabelle tbody th\s*\{\s*font-size:\s*11px/);
    expect(abschnitt).toMatch(/html\.schrift-gross table\.einheiten-tabelle th\.zahl, html\.schrift-gross table\.einheiten-tabelle td\.zahl\s*\{\s*padding-inline:\s*1px/);
  });
  it("Tabelle im Zoom-Fenster: Namensspalte mindestens 96 px, sonst klebt sie nicht, kein Wortbruch (R10-M2)", () => {
    expect(abschnitt).toMatch(/@container \(max-width: 200px\)\s*\{\s*table\.einheiten-tabelle > \* > tr > :first-child\s*\{\s*position:\s*static;[^}]*min-width:\s*96px;\s*max-width:\s*none/);
    expect(abschnitt).toMatch(/overflow-wrap:\s*normal;\s*word-break:\s*normal;\s*hyphens:\s*manual/);
  });
  it("Überschriften im Zoom-Fenster brechen nicht im Wort (R10-N6)", () => {
    expect(abschnitt).toMatch(/@media \(max-width: 16rem\)\s*\{\s*main h2\s*\{\s*font-size:\s*min\(var\(--t-xl\), 17px\);\s*overflow-wrap:\s*break-word/);
  });
});

describe("Schritte (R10-M5, R10-N7, R10-L2, R10-M4, R10-G3, R10-N8)", () => {
  it("Auswahlfelder füllen die Zeile; die Ebenen-Zeilen wachsen gleichmäßig (R10-M5, R10-N7)", () => {
    expect(abschnitt).toMatch(/label\.feld > span:has\(> select\) > select\s*\{\s*flex:\s*1 1 10rem;\s*width:\s*auto;\s*min-width:\s*0/);
    expect(abschnitt).toMatch(/@media \(max-width: 47\.999rem\)\s*\{\s*\.ebenen-zeile > label\.feld\.mittel, \.ebenen-zeile > span > label\.feld\s*\{\s*flex:\s*1 1 100%/);
    expect(abschnitt).toMatch(/@media \(min-width: 48rem\)\s*\{\s*\.ebenen-zeile > label\.feld\.mittel, \.ebenen-zeile > span > label\.feld\s*\{\s*flex:\s*1 1 12rem/);
    expect(abschnitt).toMatch(/\.zeile > label\.feld\.mittel\s*\{\s*flex:\s*1 1 100%/);
  });
  it("der Satz zur Zahl hat Zeichen, Warnfarbe und Rand, die Sammelzeile steht über die volle Breite (R10-L2, R10-M4)", () => {
    expect(abschnitt).toMatch(/\.zahl-meldung, \.zahl-meldungen > p\s*\{[^}]*background:\s*var\(--warn-fond\)/);
    expect(abschnitt).toMatch(/\.zahl-meldung, \.zahl-meldungen > p\s*\{[^}]*color:\s*var\(--warn-text\)/);
    expect(abschnitt).toMatch(/\.zahl-meldung::before, \.zahl-meldungen > p::before\s*\{\s*content:\s*"⚠ "/);
    expect(abschnitt).toMatch(/\.zahl-meldungen\s*\{\s*display:\s*grid/);
  });
  it("die abgeleitete Ernährung ist eine Anzeige ohne Feldform (R10-N8)", () => {
    expect(abschnitt).toMatch(/label\.feld > output\.abgeleitet\.nur-anzeige\s*\{[^}]*border:\s*0;[^}]*background:\s*none/);
  });
});
