/**
 * Runde 16, Block Layout: Aufnahme beginnt oben (M1), Rückfragen mit klebender Entscheidung (M2), Scanner ohne Kamera
 * (M3), Fußleiste „Weiter" (G1), Abstand der offenen Punkte (G2) und Zielhöhe der Sprungverweise (H1). Maße im
 * Produktionsbuild mit Playwright gemessen (Chromium, Touch); jsdom rechnet kein Layout, dort prüfen die Tests Verhalten
 * und Stilregeln.
 */
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dialogschicht } from "./dialoge";
import { Fusszeile } from "./fusszeile";
import { Vollstaendigkeit } from "./schritte/bausteine";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
});

const html = readFileSync(`${process.cwd()}/index.html`, "utf8");
const abschnitt = (() => {
  const von = html.indexOf("/* ===== Runde 16 (Layout) ===== */");
  expect(von).toBeGreaterThan(0);
  const bis = html.indexOf("/* ===== Ende Runde 16 (Layout) ===== */", von);
  expect(bis).toBeGreaterThan(von);
  return html.slice(von, bis).replace(/\/\*[\s\S]*?\*\//g, "");
})();

describe("Rückfragen der Fußzeile (R16-M2)", () => {
  it("„Alle Daten löschen“: Haken, „Endgültig löschen“ und „Abbrechen“ stehen in einer klebenden Entscheidungsgruppe", async () => {
    const nutzer = userEvent.setup();
    render(
      <>
        <Fusszeile onBogenOeffnen={async () => true} />
        <Dialogschicht />
      </>,
    );
    await nutzer.click(screen.getByRole("button", { name: "Alle Daten löschen" }));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Alle lokalen Daten löschen']")!;
    expect(dialog.classList.contains("rollhinweis")).toBe(true);
    const gruppe = dialog.querySelector<HTMLElement>(".dialog-entscheidung")!;
    expect(within(gruppe).getByRole("button", { name: "Endgültig löschen" })).toBeTruthy();
    expect(within(gruppe).getByRole("button", { name: "Abbrechen" })).toBeTruthy();
    expect(within(gruppe).getByLabelText(/Ja, alle lokalen Daten/)).toBeTruthy();
    // Die Gruppe ist das letzte Element des Dialogs: Alles Lange (Aufzählung) rollt darüber.
    expect(dialog.lastElementChild).toBe(gruppe);
    // Der Haken schaltet den Knopf weiter frei.
    expect(within(gruppe).getByRole("button", { name: "Endgültig löschen" })).toHaveProperty("disabled", true);
    await nutzer.click(within(gruppe).getByLabelText(/Ja, alle lokalen Daten/));
    expect(within(gruppe).getByRole("button", { name: "Endgültig löschen" })).toHaveProperty("disabled", false);
  });
  it("„Datensicherung“ trägt den Rollhinweis", () => {
    render(<Fusszeile onBogenOeffnen={async () => true} />);
    expect(document.querySelector("dialog[aria-label='Datensicherung']")!.classList.contains("rollhinweis")).toBe(true);
  });
  it("Stilregeln: Schattenkante und klebende Gruppe, bei großer Schrift rollt sie mit", () => {
    expect(abschnitt).toMatch(/dialog\.rollhinweis\s*\{\s*background:[^}]*no-repeat local[^}]*no-repeat scroll[^}]*var\(--flaeche\);\s*\}/);
    expect(abschnitt).toMatch(/dialog \.dialog-entscheidung\s*\{\s*position:\s*sticky;\s*bottom:\s*0/);
    expect(abschnitt).toMatch(/html\.schrift-gross dialog \.dialog-entscheidung\s*\{\s*position:\s*static/);
  });
});

describe("Scanner ohne Kamera (R16-M3)", () => {
  it("niedrige Telefone: deckende Leiste, Kamera-Knopf allein in der ersten Zeile", () => {
    expect(abschnitt).toMatch(/@media \(max-height: 37\.5rem\)\s*\{\s*\.scanner\s*\{\s*padding-top:\s*0\.75rem/);
    expect(abschnitt).toMatch(/\.scanner > \.scanner-aktionen\s*\{[^}]*background:\s*rgba\(0, 0, 0, 0\.88\)/);
    expect(abschnitt).toMatch(/\.scanner-aktionen > button:first-child:not\(:last-child\)\s*\{\s*flex:\s*1 1 100%/);
  });
});

describe("Fußleiste mit „In Einsatz übernehmen“ (R16-G1)", () => {
  it("16 px Abstand vor „Weiter“; ab 320 px Leistenbreite steht das Wort wieder", () => {
    expect(abschnitt).toMatch(/footer\.nav\.assistent-nav\.mit-uebernehmen > \.primaer\s*\{\s*margin-left:\s*8px/);
    expect(abschnitt).toMatch(/@container assistent-nav \(min-width: 20rem\)\s*\{\s*footer\.nav\.assistent-nav\.mit-uebernehmen \.nav-weiter-wort\s*\{\s*display:\s*inline/);
  });
});

describe("Offene Punkte der Übersicht (R16-G2)", () => {
  it("die Zeilen sind Knöpfe in einer Spaltenliste mit 8 px Lücke", () => {
    const punkte = [
      { text: "Einheitstyp fehlt", schritt: 0 },
      { text: "Stärke ist 0", schritt: 2 },
      { text: "Ort/Auftrag ist noch leer.", schritt: 1 },
    ];
    render(<Vollstaendigkeit punkte={punkte} geheZu={() => {}} />);
    const liste = document.querySelector(".vollstaendigkeit ul")!;
    expect(liste.querySelectorAll("li > button.link")).toHaveLength(3);
    expect(abschnitt).toMatch(/\.vollstaendigkeit ul:has\(button\.link\)\s*\{\s*display:\s*flex;\s*flex-direction:\s*column;\s*gap:\s*8px/);
  });
});

describe("Sprungverweise im Kasten „Neu seit der letzten Kenntnisnahme“ (R16-H1)", () => {
  it("haben die Mindesthöhe der Nachbarn (44 px)", () => {
    expect(abschnitt).toMatch(/\.stapel-eingang > button\.link\s*\{\s*min-height:\s*44px;\s*display:\s*inline-flex;\s*align-items:\s*center/);
  });
});
