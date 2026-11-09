/**
 * Runde 15, Block Layout: aufgeklappte Karte (M1), Bedarfsposten (M4), Doppeltipp nach „Zur Kenntnis genommen" (G1),
 * Quittung des übersprungenen Empfangs (W1), Kasten nach Stapelimport (S2), Hinweis über rollenden Tabellen und
 * „Ausstattung (StAN)" (N2) sowie die Stilregeln für Fußleiste (M2), Ansichtswahl (M3), Reiter (G2) und
 * Quittungsleiste (H1). Die Maße wurden zusätzlich im Produktionsbuild mit Playwright gemessen (Chromium, Touch).
 */
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TabellenScroll } from "./tabellen-scroll";

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  vi.useRealTimers();
});

const html = readFileSync(`${process.cwd()}/index.html`, "utf8");
const abschnitt = (() => {
  const von = html.indexOf("/* ===== Runde 15 (Layout) ===== */");
  expect(von).toBeGreaterThan(0);
  const bis = html.indexOf("/* ===== Ende Runde 15 (Layout) ===== */", von);
  expect(bis).toBeGreaterThan(von);
  return html.slice(von, bis).replace(/\/\*[\s\S]*?\*\//g, "");
})();



function alsTelefon() {
  const vorher = window.matchMedia;
  window.matchMedia = ((abfrage: string) => ({
    matches: abfrage === "(max-width: 600px)",
    media: abfrage,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
  return () => {
    if (vorher) window.matchMedia = vorher;
    else delete (window as { matchMedia?: unknown }).matchMedia;
  };
}

describe("R15-M1 aufgeklappte Karte am Telefon", () => {
  let zurueck: () => void;
  beforeEach(() => {
    zurueck = alsTelefon();
  });
  afterEach(() => zurueck());

  it("Stilregel: Rahmen in der Kennfarbe, linker Rand schon offen 3 px (kein Springen beim Abrücken)", () => {
    expect(abschnitt).toMatch(/\.einheit-zeile\.karte-offen:not\(\.kompakt\)\s*\{[^}]*border:\s*var\(--strich\) solid var\(--akzent\);\s*border-left:\s*3px solid var\(--akzent\)/);
    expect(abschnitt).toMatch(/\.einheit-zeile\.gestrichen\.karte-offen:not\(\.kompakt\)\s*\{\s*border-left:\s*3px dashed/);
  });
});

describe("R15-G1 Doppeltipp nach „Zur Kenntnis genommen“", () => {

  it("die Sperre hält länger als der 1-Sekunden-Takt eines zögernden Doppeltipps (QUITTUNG_SPERRE_MS; R18: 1,2 s)", async () => {
    const { QUITTUNG_SPERRE_MS } = await import("./tipp-schutz");
    expect(QUITTUNG_SPERRE_MS).toBeGreaterThanOrEqual(1100);
  });
});

describe("R15-N2 Tabellen in den Details", () => {
  const sw = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollWidth");
  const cw = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientWidth");
  afterEach(() => {
    if (sw) Object.defineProperty(HTMLElement.prototype, "scrollWidth", sw);
    else delete (HTMLElement.prototype as { scrollWidth?: unknown }).scrollWidth;
    if (cw) Object.defineProperty(HTMLElement.prototype, "clientWidth", cw);
    else delete (HTMLElement.prototype as { clientWidth?: unknown }).clientWidth;
  });
  function breite(scroll: number, sichtbar: number) {
    Object.defineProperty(HTMLElement.prototype, "scrollWidth", { configurable: true, get: () => scroll });
    Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, get: () => sichtbar });
  }

  it("zeigt den Hinweis zum Wischen nur, wenn die Tabelle über den Rand reicht", () => {
    breite(418, 313);
    const mit = render(
      <TabellenScroll titel="Personal">
        <table />
      </TabellenScroll>,
    );
    expect(mit.container.querySelector(".tabellen-hinweis")!.textContent).toBe("Zum Weiterlesen seitlich wischen →");
    mit.unmount();
    breite(300, 313);
    const ohne = render(
      <TabellenScroll titel="Personal">
        <table />
      </TabellenScroll>,
    );
    expect(ohne.container.querySelector(".tabellen-hinweis")).toBeNull();
  });
});

describe("Stilregeln Runde 15 (Layout)", () => {
  it("Quittungsleiste: Text in voller Breite, bis zu vier Zeilen (R15-H1)", () => {
    expect(abschnitt).toMatch(/\.quittung-daumen > \.quittung-text\s*\{[^}]*flex-basis:\s*12em;[^}]*-webkit-line-clamp:\s*4/);
  });
  it("Reiter bleiben gleich breit, „offen“ steht unter der Nummer (R15-G2)", () => {
    expect(abschnitt).toMatch(/\.schritte button\s*\{\s*flex:\s*1 1 0;\s*min-width:\s*0/);
    expect(abschnitt).toMatch(/\.schritte button\.status-begonnen\s*\{[^}]*flex-direction:\s*column/);
  });
  it("Ansichtswahl als Überlagerung: Kopf behält seine Höhe, Kacheln in Kopffarbe (R15-M3)", () => {
    expect(abschnitt).toMatch(/\.anzeige-schalter\.klappbar\.offen\s*\{[^}]*position:\s*absolute;[^}]*z-index:\s*30/);
    expect(abschnitt).toMatch(/\.anzeige-schalter\.klappbar\.offen > button:not\(\.anzeige-klappe\)\s*\{[^}]*background:\s*var\(--wahl-fond\)/);
  });
  it("Fußleiste mit „In Einsatz übernehmen“ am niedrigen Telefon einzeilig (R15-M2)", () => {
    expect(abschnitt).toMatch(/min-width:\s*20rem\) and \(max-width:\s*35\.99rem\) and \(max-height:\s*43\.75rem\)/);
    expect(abschnitt).toMatch(/footer\.nav\.assistent-nav\.mit-uebernehmen\s*\{\s*grid-template-areas:\s*"zurueck modus mitte weiter"/);
    expect(abschnitt).toMatch(/\.nav-weiter-wort\s*\{\s*display:\s*none/);
  });
});
