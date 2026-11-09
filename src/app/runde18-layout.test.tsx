/**
 * Runde 18, Block Layout: Aufnahme und Kennzahlen der Einsatzansicht (M1, G2, S1, W4, K3, N5, K9, S8, N4, M8), Knöpfe statt Verweise
 * (K6, G4, M4, L4, H7), Tabelle am Telefon (E5, S10, K8, M2, L1, M3), Scanner ohne Kamera (M5, L2, S9, H8), Karte (M7, S11),
 * Assistent (M6, M9, G5, W7), Rückfrage der Sollstärke (S4), Lagemonitor (L3), Offline-Zeile (K7, M10), Dialoge (D4).
 *
 * Die Maße stammen aus Messungen im Produktionsbuild mit Playwright (Chromium, Touch; Bericht des Blocks); jsdom rechnet kein Layout.
 * Hier stehen das Verhalten (Bedienung, Zustände, Texte) und die Stilregeln in index.html.
 */
import { readFileSync } from "node:fs";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Dialogschicht, frageWahl } from "./dialoge";
import { QrScannerWeb } from "./qr-scanner-web";
import { offlineLangText, offlineText, type OfflineZustand } from "./offline-bereit";

vi.mock("./qr-decoder", () => ({ qrLeserLaden: async () => async () => null }));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  delete (window as { matchMedia?: unknown }).matchMedia;
});

const html = readFileSync(`${process.cwd()}/index.html`, "utf8");
const abschnitt = (() => {
  const von = html.indexOf("/* ===== Runde 18 (Layout) ===== */");
  expect(von).toBeGreaterThan(0);
  const bis = html.indexOf("/* ===== Ende Runde 18 (Layout) ===== */", von);
  expect(bis).toBeGreaterThan(von);
  return html.slice(von, bis).replace(/\/\*[\s\S]*?\*\//g, "");
})();




describe("Aufnahme und Kennzahlen (R18-M1, G2, S1, W4, K3, N5, K9, S8, N4, M8)", () => {
  it("Stilregeln: Bedarfsposten bricht in sich um; Aufnahme steht am Telefon vor Neuem, Bedarf und Summen (order 0)", () => {
    expect(abschnitt).toMatch(/\.bedarf-posten\s*\{\s*display:\s*inline-block;\s*max-width:\s*100%;\s*white-space:\s*normal;\s*overflow-wrap:\s*anywhere/);
    expect(abschnitt).toMatch(/@media \(max-width: 30rem\)\s*\{\s*main\.einsatz-detail \.einsatz-seite > \.aktionen\s*\{\s*order:\s*0/);
  });

  it("Stilregeln: Kennzahlen auf einem Raster aus sechs Spalten, Gesamt über vier Spalten, gleiche Linien und Beschriftung", () => {
    expect(abschnitt).toMatch(/grid-template-columns:\s*repeat\(6, minmax\(0, 1fr\)\)/);
    expect(abschnitt).toMatch(/div\.gesamt:nth-child\(n\)\s*\{\s*grid-column:\s*span 4/);
    expect(abschnitt).toMatch(/span\s*\{\s*font-size:\s*min\(var\(--t-xs\), 12\.5px\);\s*letter-spacing:\s*0/);
  });
});

describe("Knöpfe statt Textverweise (R18-K6, G4, M4, L4, H7)", () => {
  it("Stilregeln: „Gehört zu dieser Lage“ ist ein Knopf von Tippgröße; Quittungsverweise und Startseitenverweise ebenso", () => {
    expect(abschnitt).toMatch(/\.muster-sub button\.ort-knopf\s*\{[^}]*display:\s*flex;[^}]*min-height:\s*calc\(var\(--ziel-basis\) \+ var\(--ziel\)\)/);
    expect(abschnitt).toMatch(/\.eingang-quittung button\.link\s*\{[^}]*min-height:\s*calc\(var\(--ziel-basis\) \+ var\(--ziel\)\)/);
    expect(abschnitt).toMatch(/\.start-seo a\s*\{\s*min-width:\s*calc\(var\(--ziel-basis\) \+ var\(--ziel\)\)/);
  });
});

describe("Tabelle am Telefon (R18-E5, S10, K8, M2, L1, M3)", () => {
  beforeEach(() => localStorage.clear());

  it("Stilregeln: Köpfe und Marken mindestens 12 px, Name höchstens drei Zeilen, keine Deckfläche über der Tabelle, Einheitenspalte klebt", () => {
    expect(abschnitt).toMatch(/table\.einheiten-tabelle thead th, table\.einheiten-tabelle\.tabelle-kern thead th\s*\{\s*font-size:\s*12px/);
    expect(abschnitt).toMatch(/\.fassung-badge\s*\{\s*font-size:\s*12px/);
    expect(abschnitt).toMatch(/\.tabelle-name\s*\{[^}]*-webkit-line-clamp:\s*3/);
    expect(abschnitt).toMatch(/button\.tabelle-oeffnen::after\s*\{\s*content:\s*none/);
    expect(abschnitt).toMatch(/table\.einheiten-tabelle:not\(\.tabelle-kern\) > \* > tr > :first-child\s*\{\s*position:\s*sticky;\s*left:\s*0/);
    // Keine Schrift der Tabelle unter 12 px in dieser Gruppe.
    const kleine = [...abschnitt.matchAll(/table\.einheiten-tabelle[^{]*\{[^}]*font-size:\s*(\d+(?:\.\d+)?)px/g)].map((m) => Number(m[1]));
    expect(kleine.length).toBeGreaterThan(0);
    expect(Math.min(...kleine)).toBeGreaterThanOrEqual(12);
  });
});

describe("Scanner ohne Kamera (R18-M5, L2, S9, H8)", () => {
  it("„Kamera erneut versuchen“ steht in der Meldung, nicht in der Knopfleiste; die Leiste trägt nur Bildweg und Abbruch", async () => {
    Object.defineProperty(navigator, "mediaDevices", { value: undefined, configurable: true });
    const { container } = render(<QrScannerWeb onErgebnis={() => {}} onAbbruch={() => {}} onBild={() => {}} />);
    await screen.findByText(/gibt die Kamera für Webseiten nicht frei/);
    const erneut = screen.getByRole("button", { name: "Kamera erneut versuchen" });
    expect(container.querySelector(".scanner-text.fehler")!.contains(erneut)).toBe(true);
    const leiste = container.querySelector(".scanner-aktionen")!;
    expect(leiste.contains(erneut)).toBe(false);
    expect(within(leiste as HTMLElement).getByText("QR aus Bild einlesen…")).toBeDefined();
    expect(within(leiste as HTMLElement).getByRole("button", { name: "Abbrechen" })).toBeDefined();
    // Die Mitte rollt für sich, die Leiste steht darunter.
    expect(container.querySelector(".scanner-mitte.scrollt")).not.toBeNull();
    expect(container.querySelector(".scanner-mitte.scrollt")!.nextElementSibling).toBe(leiste);
  });

  it("Stilregeln: rollende Mitte, Leiste in der Reihenfolge statt klebend, 16 px zwischen den Knöpfen", () => {
    expect(abschnitt).toMatch(/\.scanner-mitte\.scrollt\s*\{[^}]*overflow-y:\s*auto/);
    expect(abschnitt).toMatch(/\.scanner:has\(> \.scanner-mitte\.scrollt\) > \.scanner-aktionen\s*\{\s*position:\s*static;[^}]*gap:\s*16px/);
  });
});

describe("Rückfrage mit einem Satz je Antwort (R18-S4)", () => {
  it("zeigt den Satz unter dem Knopf im festen Fuß; die Liste im Rumpf entfällt und der Knopf hängt am Satz", async () => {
    render(<Dialogschicht />);
    void frageWahl({
      titel: "Nur Sollplätze, keine gemeldete Stärke",
      text: "Niemand hat gezählt.",
      wege: [
        { wert: "eintragen", label: "Stärke jetzt eintragen", kurz: "Springt zum Personal." },
        { wert: "soll", label: "Als Sollstärke ablegen", kurz: "Zählt nur als Sollwert." },
      ],
    });
    const d = await screen.findByRole("dialog", { name: "Nur Sollplätze, keine gemeldete Stärke" });
    expect(d.querySelector(".abfrage-wegehinweise")).toBeNull();
    const fuss = d.querySelector(".abfrage-fuss")!;
    const knopf = within(d).getByRole("button", { name: "Als Sollstärke ablegen" });
    const satz = document.getElementById(knopf.getAttribute("aria-describedby")!)!;
    expect(satz.textContent).toBe("Zählt nur als Sollwert.");
    expect(fuss.contains(satz)).toBe(true);
    expect(d.querySelector(".abfrage-rumpf")!.textContent).not.toContain("Springt zum Personal.");
  });
});

describe("Karte und Assistent am Telefon (R18-M7, S11, M6, M9, G5, W7)", () => {

  it("Stilregeln: Raster der Kartenknöpfe (drei Spalten, bei Feld und 320 px zwei), Abrücken zuerst", () => {
    expect(abschnitt).toMatch(/\.einheit-zeile \.vorlage-aktionen\s*\{\s*display:\s*grid;\s*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/);
    expect(abschnitt).toMatch(/html\.feld-modus \.einheit-zeile \.vorlage-aktionen\s*\{\s*grid-template-columns:\s*repeat\(2/);
    expect(abschnitt).toMatch(/@media \(max-width: 20\.5rem\)\s*\{\s*\.einheit-zeile \.vorlage-aktionen\s*\{\s*grid-template-columns:\s*repeat\(2/);
    expect(abschnitt).toMatch(/\.wechsel-knopf\s*\{\s*order:\s*1/);
  });

  it("Stilregeln: Reiter 44 px breit, 8 px Abstand, bei 320 px über den Textrand hinaus; Kopf im Querformat zweizeilig", () => {
    expect(abschnitt).toMatch(/\.seiten-kopf \.schritte\s*\{\s*gap:\s*8px/);
    expect(abschnitt).toMatch(/\.schritte button\s*\{\s*min-width:\s*44px/);
    expect(abschnitt).toMatch(/@media \(max-width: 21rem\)\s*\{\s*:root:root \.seiten-kopf\.assistent-kopf \.schritte\s*\{\s*margin-inline:\s*-8px/);
    expect(abschnitt).toMatch(/@media \(orientation: landscape\) and \(max-height: 31\.25rem\)\s*\{\s*\.seiten-kopf\.assistent-kopf \.kopf-inhalt\s*\{\s*display:\s*flex/);
  });
});

describe("Lagemonitor und Dialoge (R18-L3, D4)", () => {

  it("die feste Leiste der Rückfrage rollt bei Feld auf niedrigen Telefonen mit", () => {
    expect(abschnitt).toMatch(/@media \(max-height: 40rem\)\s*\{\s*html\.feld-modus dialog \.dialog-entscheidung\s*\{\s*position:\s*static/);
  });
});

describe("Offline-Zeile beim Erstbesuch (R18-K7, M10)", () => {
  const laedt: OfflineZustand = { stand: "laedt", frischBereit: false, online: true, kern: { geladen: 1_000_000, gesamt: 6_000_000 }, zweiStufen: true };

  it("die längste Fassung ist nie kürzer als die aktuelle und kürzer als nichts: sie deckt Laden, Abbruch, Haken und Funkloch ab", () => {
    for (const z of [
      laedt,
      { ...laedt, kernHakt: true },
      { ...laedt, abgebrochen: true },
      { ...laedt, stand: "bereit" as const, zusatz: { fertig: 5, gesamt: 549 } },
      { ...laedt, stand: "bereit" as const, zusatz: { fertig: 549, gesamt: 549 }, frischBereit: true },
      { ...laedt, stand: "bereit" as const, zusatz: { fertig: 5, gesamt: 549 }, online: false },
    ]) {
      expect(offlineLangText(z).length).toBeGreaterThanOrEqual(offlineText(z).length);
    }
  });

  it("die Endfassung ist deutlich kürzer als die längste (deshalb braucht die Zeile den Platzhalter)", () => {
    const fertig: OfflineZustand = { ...laedt, stand: "bereit", frischBereit: true, zusatz: { fertig: 549, gesamt: 549 } };
    expect(offlineLangText(fertig).length).toBeGreaterThan(offlineText(fertig).length + 40);
  });

  it("Stilregeln: Platzhalter liegt im selben Raster, unsichtbar, ohne Textknoten (Text im Attribut)", () => {
    expect(abschnitt).toMatch(/\.offline-platz\s*\{\s*display:\s*grid;\s*grid-template-columns:\s*minmax\(0, 1fr\)/);
    expect(abschnitt).toMatch(/\.offline-platz > p\.offline-geist\s*\{\s*visibility:\s*hidden/);
    expect(abschnitt).toMatch(/p\.offline-geist::after\s*\{\s*content:\s*attr\(data-text\)/);
  });

  it("die Startseite legt den Platzhalter beim Erstbesuch unter die Zeile, ohne dass er gefunden oder vorgelesen wird", async () => {
    const { App } = await import("./app");
    Object.defineProperty(navigator, "serviceWorker", {
      value: { controller: null, ready: new Promise(() => {}), addEventListener: () => {}, removeEventListener: () => {}, getRegistration: async () => undefined },
      configurable: true,
    });
    render(<App />);
    const platz = document.querySelector(".offline-platz");
    expect(platz).not.toBeNull();
    const geist = platz!.querySelector("p.offline-geist")!;
    expect(geist.getAttribute("aria-hidden")).toBe("true");
    expect(geist.textContent).toBe("");
    expect(geist.getAttribute("data-text")!.length).toBeGreaterThan(100);
    fireEvent.scroll(window);
  });
});
