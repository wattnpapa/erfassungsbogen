/**
 * Stilregeln aus Runde 11 des Audits (Layout, Handschuh, Nacht), die nur im Stylesheet (index.html) und in der
 * gemeinsamen Themenseiten-Vorlage (scripts/content-stil.mts) leben. Wie stilregeln-r10-layout prüft der Test den
 * Quelltext (jsdom rechnet kein Layout).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
const stilVorlage = readFileSync(new URL("../../scripts/content-stil.mts", import.meta.url), "utf8");

/** Nur der Abschnitt „Runde 11 (Layout)", ohne Kommentare. */
const abschnitt = (() => {
  const von = html.indexOf("/* ===== Runde 11 (Layout) ===== */");
  expect(von).toBeGreaterThan(0);
  const bis = html.indexOf("/* ===== Ende Runde 11 (Layout) ===== */", von);
  expect(bis).toBeGreaterThan(von);
  return html.slice(von, bis).replace(/\/\*[\s\S]*?\*\//g, "");
})();

describe("Antippflächen mit Lücke (R11-G3)", () => {
  it("Hinweise-Link, Filterzeile und Kopfzeile haben mindestens 8 px; Knopfreihen der Karte 12 px", () => {
    expect(abschnitt).toMatch(/\.einheit-zeile \.vorlage-aktionen\s*\{\s*margin-top:\s*12px;\s*gap:\s*12px/);
  });
  it("„+ Person/Fahrzeug hinzufügen“ und der StAN-Knopf darunter stehen mit 12 px (auch quer)", () => {
    expect(abschnitt).toMatch(/\.schritt-inhalt button\.primaer \+ p:has\(> button:first-child\)\s*\{\s*margin-top:\s*12px/);
  });
});

describe("Einsatzansicht am Telefon (R11-M2, R11-M3, R11-M4, R11-M5)", () => {
  it("Namen in der Tabelle nicht unter 13 px, außer im Zoom-Fenster (R11-M2)", () => {
    expect(abschnitt).toMatch(/@container \(min-width: 12\.5rem\) and \(max-width: 30rem\)\s*\{\s*table\.einheiten-tabelle tbody th\s*\{\s*font-size:\s*13px/);
  });
  it("die Quittung nach „Abrücken“ darf vier Zeilen haben, der Name wird nicht gekürzt (R11-M3)", () => {
    expect(abschnitt).toMatch(/\.quittung-daumen\.quittung-mehrzeilig > \.quittung-text\s*\{\s*-webkit-line-clamp:\s*4/);
  });
  it("quer bei niedrigem Fenster bleiben die fünf Kacheln in einer Zeile (R11-M5)", () => {
    expect(abschnitt).toMatch(/@media \(orientation: landscape\) and \(max-height: 31\.25rem\) and \(width > 30rem\)/);
    expect(abschnitt).toMatch(/\.staerke-leiste:has\(> div:nth-child\(5\)\)\s*\{\s*flex-wrap:\s*nowrap/);
    expect(abschnitt).toMatch(/\.staerke-leiste:has\(> div:nth-child\(5\)\) strong\s*\{\s*font-size:\s*calc\(var\(--t-zahl\) \* 0\.8\)/);
  });
});

describe("Erzwungene Farben (R11-L2)", () => {
  it("gewählter Zustand in Systemfarben mit Haken, Hauptknopf mit dickem Rahmen", () => {
    expect(abschnitt).toMatch(/@media \(forced-colors: active\)/);
    expect(abschnitt).toMatch(/button\[aria-pressed="true"\],[^{]*schritte button\.aktiv[^{]*\{[^}]*background:\s*Highlight;\s*color:\s*HighlightText/);
    expect(abschnitt).toMatch(/button\[aria-pressed="true"\]::before\s*\{\s*content:\s*"✓ "/);
    expect(abschnitt).toMatch(/button\.primaer, button\.uebernehmen\s*\{\s*border:\s*3px solid ButtonText/);
  });
});

describe("Organisationszeichen in Dunkel und Nacht (R11-L1)", () => {
  const themaCss = stilVorlage.slice(stilVorlage.indexOf("THEMA:CSS:START"), stilVorlage.indexOf("THEMA:CSS:END")).replace(/\/\*[\s\S]*?\*\//g, "");
  it("die Vorlage setzt die Zeichen auf eine helle, gedimmte Platte", () => {
    expect(themaCss).toMatch(/html\.dunkel-modus figure\.zeichen:not\(\.scancodes figure\) img\s*\{\s*filter:\s*brightness\(0\.8\);\s*background:\s*#fff/);
    expect(themaCss).toMatch(/html\.nacht-modus figure\.zeichen:not\(\.scancodes figure\) img\s*\{\s*filter:\s*brightness\(0\.5\);\s*background:\s*#fff/);
  });
  it("alle Seiten mit Zeichen tragen die Regel (THW, Malteser, Bundeswehr)", () => {
    for (const seite of ["thw", "malteser", "bundeswehr"]) {
      const text = readFileSync(new URL(`../../public/${seite}.html`, import.meta.url), "utf8");
      expect(text, seite).toMatch(/html\.nacht-modus figure\.zeichen:not\(\.scancodes figure\) img/);
      expect(text, seite).toMatch(/html\.dunkel-modus figure\.zeichen:not\(\.scancodes figure\) img/);
    }
  });
});

describe("R11-N1/N2/W5 (Hauptagent)", () => {
    const einheit = readFileSync(new URL("./schritte/einheit.tsx", import.meta.url), "utf8");
  it("Telefon und E-Mail der Ebenen-Zeile füllen am Telefon die Zeile (R11-N1)", () => {
    expect(html).toMatch(/R11-N1[\s\S]*?\.ebenen-zeile > label\.feld\.schmal, \.ebenen-zeile > label\.feld \{ flex: 1 1 100%; \}/);
  });
  it("das Kürzelfeld zeigt keine Liste, die nur den eingetragenen Eintrag wiederholt (R11-N2)", () => {
    expect(einheit).toContain("nurEintrag");
    expect(einheit).toContain("treffer={gezeigt}");
  });
  it("kein „mustern“ mehr im Übersichts-Dialog (R11-W5)", () => {
    expect(readFileSync(new URL("./schritte/uebersicht.tsx", import.meta.url), "utf8")).not.toContain("mustern");
  });
});
