/**
 * Runde 20, Block Layout: Scanner ohne Kamera quer (E1, H8, G5, M2, S2, L5), Assistent und Schnellerfassung quer (G7, M3, S3, H7, M4),
 * Dialoge am kleinen Telefon (H9, M5, L2), Ziele von 44 px („Warum?", „ganz zeigen", Papierkorb; G1, M6, L1, O4, A4, D4, O5),
 * „Anderer Einsatz?"-Chip (G2, M1), „Zur Kenntnis genommen" (G3), Einheitenliste nach oben (W6, H5, G6, N4), Tabelle am Telefon
 * (N6, H11, H12, S5, E2), Startseite (A1), Kopf der Einsatzansicht (H4, G4), Abstände der Sprungverweise (H6), Ort im Vollassistenten (N2).
 *
 * Die Maße stammen aus Messungen im Produktionsbuild mit Playwright (Chromium, Touch; siehe Bericht); jsdom rechnet kein Layout. Hier stehen
 * das Verhalten (Bedienung, Reihenfolge, Texte) und die Stilregeln in index.html, Abschnitt „Runde 20 (Layout)".
 */
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StaerkeRolle, type Person } from "@bos/eeb-format/model";
import { neuePerson, neuerBogen } from "./hilfen";
import { QrScannerWeb, hinweiseGeoeffnet } from "./qr-scanner-web";
import { KENNTNIS_SPERRE_MS, ORTSSPERRE_MS, ortFreigeben, ortSperren, tippSchutzZuruecksetzen } from "./tipp-schutz";
import { Uebersicht } from "./schritte/uebersicht";
import { SchrittEinheit } from "./schritte/einheit";
import { SchrittBuehne } from "../test/schritt-buehne";

vi.mock("./qr-decoder", () => ({ qrLeserLaden: async () => async () => null }));

const html = readFileSync(`${process.cwd()}/index.html`, "utf8");
const abschnitt = (() => {
  const von = html.indexOf("/* ===== Runde 20 (Layout) ===== */");
  expect(von).toBeGreaterThan(0);
  const bis = html.indexOf("/* ===== Ende Runde 20 (Layout) ===== */", von);
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
});




describe("Runde 20 (Layout): die Stilregeln sind da", () => {
  it("der Abschnitt ist da", () => {
    expect(abschnitt.length).toBeGreaterThan(3000);
  });

  it("R20-E1, H8, G5, M2, S2, L5: Scanner ohne Kamera quer in einer Zeile, Rollkante und Rollleiste wo doch gerollt wird", () => {
    expect(abschnitt).toMatch(/@media \(orientation: landscape\) and \(max-height: 30rem\) \{[\s\S]*\.scanner-text\.fehler \{[^}]*flex-wrap: nowrap/);
    expect(abschnitt).toMatch(/\.scanner-handscanner > \.handscanner-hinweise > summary \{[^}]*min-height: 44px/);
    expect(abschnitt).toContain(".scanner-mitte.scrollt::-webkit-scrollbar { width: 12px; }");
    expect(abschnitt).toMatch(/\.scanner-mitte\.scrollt \{[^}]*scrollbar-width: auto[^}]*linear-gradient\(#000 30%/);
  });

  it("R20-G7, M3, S3, H7, M4: Kopf des Assistenten quer in einer Zeile mit der Schrittleiste, Einsatzansicht quer mit Raster", () => {
    expect(abschnitt).toMatch(/\.seiten-kopf\.assistent-kopf \.kopf-inhalt \{ flex-wrap: nowrap;/);
    expect(abschnitt).toMatch(/\.seiten-kopf\.assistent-kopf \.schritte \{ order: 2; flex: 0 0 auto;/);
    expect(abschnitt).toMatch(/grid-template-areas: "zur titel ansicht" "info info aendern"/);
  });

  it("R20-H9, M5, L2: „Datensicherung“ und „Alle Daten löschen“ am kleinen Telefon: Entscheidung klebt, Kopf klebt nicht", () => {
    expect(abschnitt).toMatch(/@media \(max-width: 30rem\) and \(max-height: 40rem\) \{[\s\S]*dialog\.rollhinweis > \.kopfzeile:first-child \{ position: static;/);
    expect(abschnitt).toMatch(/dialog\.rollhinweis \.dialog-entscheidung \{ position: sticky; bottom: 0;/);
  });

  it("R20-G1, M6, L1, O4, A4: „ganz zeigen“, „Warum?“ und „Hinweise“ sind Ziele von mindestens einer Fingerhöhe ohne Überlappung", () => {
    expect(abschnitt).toMatch(/--ziel-karte: calc\(var\(--ziel-basis\) \+ var\(--ziel\)\)/);
    expect(abschnitt).toMatch(/\.ort-warum > summary \{\s*display: inline-block;[^}]*min-height: var\(--ziel-karte, 44px\)[^}]*margin-bottom: 8px/);
    expect(abschnitt).toMatch(/button\.link\.zeit-aendern \{\s*display: inline-block;[^}]*margin: 0 0 0 0\.25rem/);
    expect(abschnitt).toMatch(/> button\.link\.luecken-marke \{\s*display: block; margin: 0;/);
  });

  it("R20-G2, M1: der Chip liegt über dem Aufklapp-Knopf der Karte", () => {
    expect(abschnitt).toMatch(/button\.kompakt-merkmal\.marke-knopf \{ position: relative; z-index: 2;/);
  });

  it("R20-W6, H5, G6: am Telefon steht die Liste vor Bedarf und Zwischensummen, der Sprung zur Liste entfällt", () => {
    expect(abschnitt).toMatch(/main\.einsatz-detail > \.einsatz-liste \{ order: 2; \}/);
    expect(abschnitt).toMatch(/details\.bedarf-block, main\.einsatz-detail \.einsatz-seite > details\.zug-summen,\s*main\.einsatz-detail \.einsatz-seite > details\.uebung-ausgenommen \{ order: 3; \}/);
    expect(abschnitt).toMatch(/p\.ausgabe-sprung:not\(\.ausgabe-sprung ~ \.ausgabe-sprung\) \{ display: none; \}/);
  });

  it("R20-H6: Sprungverweise und Tabellenknöpfe halten mindestens 8 px Abstand", () => {
    for (const regel of [/main\.einsatz-detail p\.hinweis\.ausgabe-sprung \{ margin: (\d+)px 0 0; \}/, /p\.hinweis\.ausgabe-sprung > button\.link \{[^}]*margin: 0 (\d+)px (\d+)px 0;/]) {
      const m = regel.exec(abschnitt);
      expect(m, String(regel)).not.toBeNull();
      for (const zahl of m!.slice(1)) expect(Number(zahl)).toBeGreaterThanOrEqual(8);
    }
    expect(abschnitt).toMatch(/p\.tabellen-spalten \{ margin-top: 10px; \}/);
    expect(abschnitt).toMatch(/p\.hinweis\.luecken-zaehler \{ margin-block: 4px 10px; \}/);
  });

  it("R20-S5, N6, H11: Tabelle am Telefon endet am Kartenrand, Zellen mindestens 14 px, Köpfe in Fließschrift", () => {
    expect(abschnitt).toMatch(/\.karte > \.tabellen-scroll:has\(> table\.einheiten-tabelle\) \{ margin-inline: -8px; \}/);
    expect(abschnitt).toMatch(/tabelle-kern thead th \{ font-family: inherit; text-transform: none; letter-spacing: 0; font-size: 14px;/);
    expect(abschnitt).toMatch(/tabelle-kern tbody td, :root:root table\.einheiten-tabelle\.tabelle-kern tbody th \{ font-size: 14px; vertical-align: top;/);
  });

  it("R20-E2 / OV Chemnitz: Erreichbarkeit auf jeder Breite unter dem Namen, keine eigene Spalte", () => {
    expect(abschnitt).toMatch(/table\.uebersicht \.kontakt-unter \{ display: block;/);
    expect(abschnitt).not.toContain(".kontakt-unter { display: none; }");
  });

  it("R20-H4, G4: „Ansicht“ steht im Kopf der Einsatzansicht", () => {
    expect(abschnitt).toMatch(/\.seiten-kopf\.einsatz-kopf \.anzeige-mit-name \{ display: inline-flex; \}/);
  });
});

describe("R20-L5: „Hinweise zum Handscanner“ aufgeklappt beginnt oben im Rollfenster", () => {
  it("rollt den Text beim Aufklappen an den Anfang, beim Zuklappen nicht", () => {
    const rollen = vi.fn();
    const offen = { currentTarget: { open: true, scrollIntoView: rollen } } as unknown as Parameters<typeof hinweiseGeoeffnet>[0];
    hinweiseGeoeffnet(offen);
    expect(rollen).toHaveBeenCalledWith({ block: "start" });
    rollen.mockClear();
    hinweiseGeoeffnet({ currentTarget: { open: false, scrollIntoView: rollen } } as unknown as Parameters<typeof hinweiseGeoeffnet>[0]);
    expect(rollen).not.toHaveBeenCalled();
  });

  it("im Scanner ohne Kamera löst das Aufklappen den Bildlauf aus", async () => {
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: vi.fn(async () => { throw Object.assign(new Error("NotFoundError"), { name: "NotFoundError" }); }) },
      configurable: true,
    });
    const rollen = vi.fn();
    HTMLElement.prototype.scrollIntoView = rollen;
    render(<QrScannerWeb onErgebnis={() => {}} onAbbruch={() => {}} />);
    const details = await waitFor(() => {
      const d = document.querySelector<HTMLDetailsElement>("details.handscanner-hinweise");
      expect(d).not.toBeNull();
      return d!;
    });
    details.open = true;
    fireEvent(details, new Event("toggle"));
    expect(rollen).toHaveBeenCalled();
    delete (HTMLElement.prototype as { scrollIntoView?: unknown }).scrollIntoView;
  });
});

describe("R20-G3: nach „Zur Kenntnis genommen“ bleibt die Stelle unter dem Finger gesperrt", () => {
  function tipp(el: HTMLElement, x: number, y: number) {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, clientX: x, clientY: y, detail: 1 }));
  }

  it("ein zweiter Tipp nach 1,5 s öffnet nichts; „Rückgängig“ gibt die Stelle frei", () => {
    expect(KENNTNIS_SPERRE_MS).toBeGreaterThan(1500);
    expect(KENNTNIS_SPERRE_MS).toBeGreaterThan(ORTSSPERRE_MS);
    const knopf = document.createElement("button");
    const getroffen = vi.fn();
    knopf.addEventListener("click", getroffen);
    document.body.appendChild(knopf);
    const echt = Date.now();
    const uhr = vi.spyOn(Date, "now").mockReturnValue(echt);
    tipp(knopf, 100, 300); // „Zur Kenntnis genommen“
    ortSperren(KENNTNIS_SPERRE_MS, undefined, { marke: "kenntnis" });
    uhr.mockReturnValue(echt + 1500);
    tipp(knopf, 104, 298); // „Bögen einlesen…“ liegt jetzt dort
    expect(getroffen).toHaveBeenCalledTimes(1);
    ortFreigeben("kenntnis"); // „Rückgängig“: der Kasten ist wieder da
    uhr.mockReturnValue(echt + 1600);
    tipp(knopf, 100, 300);
    expect(getroffen).toHaveBeenCalledTimes(2);
    knopf.remove();
  });

  it("nach Ablauf ist die Stelle frei", () => {
    const knopf = document.createElement("button");
    const getroffen = vi.fn();
    knopf.addEventListener("click", getroffen);
    document.body.appendChild(knopf);
    const echt = Date.now();
    const uhr = vi.spyOn(Date, "now").mockReturnValue(echt);
    tipp(knopf, 100, 300);
    ortSperren(KENNTNIS_SPERRE_MS, undefined, { marke: "kenntnis" });
    uhr.mockReturnValue(echt + KENNTNIS_SPERRE_MS + 10);
    tipp(knopf, 100, 300);
    expect(getroffen).toHaveBeenCalledTimes(2);
    knopf.remove();
  });
});

describe("R20-E2: Personaltabelle der Übersicht", () => {
  it("die Erreichbarkeit steht unter dem Namen, eine eigene Spalte gibt es nicht mehr (OV Chemnitz, 11/2026)", () => {
    const bogen = neuerBogen();
    const person: Person = {
      ...neuePerson(),
      vorname: "Anna",
      nachname: "Ahrens",
      staerkeRolle: StaerkeRolle.FUEHRER,
      kontakte: [{ art: 0, dienstlich: true, wert: "441987654" }],
    };
    render(<Uebersicht bogen={{ ...bogen, personal: [person] }} geheZu={() => {}} neu={() => {}} />);
    const tabelle = document.querySelector("table.personal-tabelle")!;
    const zeile = tabelle.querySelector("tbody tr")!;
    expect(zeile.querySelector("td .kontakt-unter")!.textContent).toContain("441987654");
    expect(zeile.querySelectorAll("td")).toHaveLength(3);
    expect(tabelle.querySelectorAll("th")[2]!.textContent).toBe("Name, Vorname / Erreichbarkeit");
  });

  it("ohne Kontakte gibt es weder Spalte noch Zeile unter dem Namen", () => {
    const bogen = neuerBogen();
    render(<Uebersicht bogen={{ ...bogen, personal: [{ ...neuePerson(), nachname: "Ahrens" }] }} geheZu={() => {}} neu={() => {}} />);
    expect(document.querySelector(".kontakt-unter")).toBeNull();
    expect(document.querySelector(".kontakt-spalte")).toBeNull();
  });
});

describe("R20-N2: Ort der Einheit im Vollassistenten", () => {
  beforeEach(() => localStorage.clear());
  it("steht vor „Zugehörigkeit / Kontaktstellen“ (nicht dahinter unter dem Falz) und nur einmal", () => {
    render(<SchrittBuehne komponente={SchrittEinheit} />);
    const ort = screen.getByLabelText("Ort der Einheit (Pflicht)");
    const zugehoerigkeit = screen.getByRole("heading", { name: "Zugehörigkeit / Kontaktstellen" });
    expect(ort.compareDocumentPosition(zugehoerigkeit) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getAllByLabelText("Ort der Einheit (Pflicht)")).toHaveLength(1);
    const organisation = screen.getByLabelText("Organisation");
    expect(organisation.compareDocumentPosition(ort) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
