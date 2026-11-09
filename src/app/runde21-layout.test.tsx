/**
 * Runde 21, Block Layout: erste Einheitenkarte höher (A4, W4, E5, H4, K3, G5, M5, L4, N4, O3, S3, D4), Assistent quer in „Feld" (W5, E6, H5, G3,
 * M4, L7), Fußleiste Schritt 5 quer (A6) und bei Tastaturhöhe (G2), Platzhalter beim Nachladen (A2, E2, M2, N5), Tabelle bei 320/360 px (G7, M6, L6,
 * D3, S4), Wortbrüche in Rückfragen und Titeln (E7, L5, H8), „Zur Kenntnis genommen" (G4) und die feste Ansichtsleiste (G6).
 *
 * Die Maße stammen aus Messungen im Produktionsbuild mit Playwright (Chromium, Touch; siehe Bericht); jsdom rechnet kein Layout. Hier stehen das
 * Verhalten (was wann im Baum steht, was Tippen auslöst) und die Stilregeln in index.html, Abschnitt „Runde 21 (Layout)".
 */
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { tippSchutzZuruecksetzen } from "./tipp-schutz";

const html = readFileSync(`${process.cwd()}/index.html`, "utf8");
const abschnitt = (() => {
  const von = html.indexOf("/* ===== Runde 21 (Layout) ===== */");
  expect(von).toBeGreaterThan(0);
  const bis = html.indexOf("/* ===== Ende Runde 21 (Layout) ===== */", von);
  expect(bis).toBeGreaterThan(von);
  return html.slice(von, bis).replace(/\/\*[\s\S]*?\*\//g, "");
})();

afterEach(() => {
  cleanup();
  tippSchutzZuruecksetzen();
  vi.useRealTimers();
  vi.restoreAllMocks();
  localStorage.clear();
  delete (window as { matchMedia?: unknown }).matchMedia;
  document.documentElement.className = "";
});





describe("Runde 21 (Layout): die Stilregeln sind da", () => {
  it("der Abschnitt ist da", () => {
    expect(abschnitt.length).toBeGreaterThan(3000);
  });

  it("R21-A4 u. a.: Einsatzansicht am Telefon: Zweierraster der Aufnahme, Aufklapper, Kennzahlen in einer Zeile, 10 px zwischen den Blöcken", () => {
    expect(abschnitt).toMatch(/@media \(max-width: 47\.999rem\) \{[\s\S]*main\.einsatz-detail \.einsatz-seite > \* \{ margin-block: 0 10px; \}/);
    expect(abschnitt).toMatch(/\.einsatz-seite \.aktionen \{ display: grid; grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
    expect(abschnitt).toMatch(/\.aktionen > \.primaer,\s*:root:root main\.einsatz-detail \.einsatz-seite \.aktionen > details\.aufnahme-weitere \{ grid-column: 1 \/ -1; \}/);
    expect(abschnitt).toMatch(/details\.aufnahme-weitere > summary \{[^}]*min-height: calc\(var\(--ziel-basis\) \+ var\(--ziel\)\)/);
    // Eine Zeile ab 360 px (22,5 rem) bis 480 px, nicht in „Feld" und nicht bei großer Schrift; bei 320 px bleiben zwei Reihen.
    expect(abschnitt).toMatch(/@media \(min-width: 22\.5rem\) and \(max-width: 30rem\) \{\s*:root:root:root:not\(\.schrift-gross\):not\(\.feld-modus\) main\.einsatz-detail \.staerke-leiste:has\(> div:nth-child\(5\)\) \{ grid-template-columns: 1\.3fr repeat\(4, minmax\(0, 1fr\)\); \}/);
    // Das Menü von „Bögen einlesen…" öffnet nach links, damit es in der rechten Spalte nicht aus dem Bild ragt.
    expect(abschnitt).toMatch(/\.aktionen \.einlese-menue \{ left: auto; right: 0; \}/);
  });

  it("R21-G6: die feste Ansichtsleiste entfällt am Telefon (der Kopf trägt die Wahl), ihre Höhe auch", () => {
    expect(abschnitt).toMatch(/@media \(max-width: 47\.999rem\) \{\s*:root:root \.anzeige-balken \{ display: none; \}\s*:root:root:has\(\.anzeige-balken\) \{ --balken-hoehe: 0px; \}/);
  });

  it("R21-G7, M6, L6, D3, S4: Tabelle bei 320/360 px: Bedarfsposten und Zugzelle brechen vor der Zahl, Spaltenbreiten, alles oben ausgerichtet", () => {
    expect(abschnitt).toMatch(/@media \(max-width: 30rem\) \{[\s\S]*tabelle-kern \.bedarf-teil \{ white-space: normal; \}/);
    expect(abschnitt).toMatch(/tabelle-kern td\.zug-zelle \{ white-space: normal; \}/);
    expect(abschnitt).toMatch(/tabelle-kern tbody > tr > \* \{ vertical-align: top; \}/);
    expect(abschnitt).toMatch(/@media \(max-width: 22\.5rem\) \{\s*:root:root table\.einheiten-tabelle\.tabelle-kern > \* > tr > :first-child \{ width: 35%; \}/);
    expect(abschnitt).toMatch(/th\[data-spalte="gesamt"\] \{ width: 16%; \}/);
    // Der Kopf „Eingetroffen": am Telefon die Fassung mit weicher Trennstelle, sonst die glatte.
    expect(abschnitt).toMatch(/table\.einheiten-tabelle \.spalten-kopf > \.kopf-weich \{ display: none; \}/);
    expect(abschnitt).toMatch(/\.spalten-kopf > \.kopf-glatt:has\(\+ \.kopf-weich\) \{ display: none; \}/);
  });

  it("R21-E7, L5: Rückfragen bei 320 px: Antwort und „Abbrechen“ untereinander, nicht in 119-px-Knöpfen", () => {
    expect(abschnitt).toMatch(/@media \(max-width: 22\.5rem\) \{\s*:root:root dialog\.abfrage \.abfrage-fuss:has\(> \.abfrage-weg:first-child:nth-last-child\(2\)\) \{ flex-direction: column; gap: 24px; \}/);
    expect(abschnitt).toMatch(/dialog\.abfrage form > \.abfrage-aktionen:has\(> button \+ button\) \{ flex-direction: column; \}/);
  });

  it("R21-H8: Titel der Fußzeilen-Fenster bricht nie im Wort; „Schließen“ rutscht in die Zeile darunter", () => {
    expect(abschnitt).toMatch(/dialog\.rollhinweis > \.kopfzeile:first-child \{ flex-wrap: wrap; \}/);
    expect(abschnitt).toMatch(/dialog\.rollhinweis > \.kopfzeile:first-child h2 \{ flex: 1 1 0; min-width: min-content; overflow-wrap: normal;/);
  });

  it("R21-A6, G2: Fußleiste mit „In Einsatz übernehmen“ in niedrigen Fenstern: nie im Wort, „Ansicht“ und „In Einsatz“ fallen zuerst weg", () => {
    expect(abschnitt).toMatch(/@media \(orientation: landscape\) and \(max-height: 31\.25rem\) \{\s*:root:root footer\.nav\.assistent-nav\.mit-uebernehmen \{ grid-template-columns: auto auto minmax\(max-content, 1fr\) auto; \}/);
    expect(abschnitt).toMatch(/footer\.nav\.assistent-nav\.mit-uebernehmen > \.uebernehmen \{ white-space: nowrap; min-width: max-content;/);
    expect(abschnitt).toMatch(/\(max-width: 45rem\) \{\s*:root:root footer\.nav\.assistent-nav\.mit-uebernehmen \.anzeige-leiste-text \{ display: none; \}/);
    expect(abschnitt).toMatch(/\(max-width: 26rem\) \{\s*:root:root footer\.nav\.assistent-nav\.mit-uebernehmen \.nav-einsatz \{ display: none; \}/);
  });

  it("R21-W5, E6, H5, G3, M4, L7: Assistent quer in „Feld“: Schrittüberschrift nur für Vorlesesoftware, Abstände klein", () => {
    expect(abschnitt).toMatch(/@media \(orientation: landscape\) and \(max-height: 30rem\) \{\s*:root:root\.feld-modus main \{ padding-top: 4px; \}/);
    expect(abschnitt).toMatch(/:root:root\.feld-modus \.schritt-inhalt > \.karte > h2:first-child \{\s*position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset\(50%\);/);
  });

  it("R21-G4: die Zeile an Stelle des Kastens ist mindestens so hoch wie der Bereich unter dem Finger", () => {
    expect(abschnitt).toMatch(/p\.kenntnis-spur \{[^}]*min-height: 104px/);
  });
});
