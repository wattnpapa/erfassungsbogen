/**
 * Runde 18, Block Inhalte: Oberfläche (jsdom) — Übergabe und Abschluss (A6, A7), Tabelle am Telefon (A5, N9), Stand der Angaben auf
 * der Karte (A2, K1), Erklärung der Nachtrag-Logik (W8, K10), Übersicht (N11, N12), Autokorrektur (H5), Texte der Sammlung (N13),
 * Rückfrage beim Entfernen (A1). Maße und Fokus sind im Produktionsbuild mit Playwright gemessen (siehe Abschlussbericht);
 * jsdom rechnet kein Layout.
 */
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { neuePerson, neuerBogen } from "./hilfen";
import { prellschutzSetzen } from "./dialoge";
import { SchrittBuehne } from "../test/schritt-buehne";
import { SchrittEinsatz } from "./schritte/einsatz";
import { SchrittSofortbedarf } from "./schritte/sofortbedarf";
import { Uebersicht } from "./schritte/uebersicht";

vi.mock("./pdf", async () => {
  const echt = await vi.importActual<typeof import("./pdf")>("./pdf");
  return { ...echt, pdfErzeugen: async () => {}, einsatzPdfErzeugen: async () => true, einsatzLageblattErzeugen: async () => true };
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  prellschutzSetzen(450);
  localStorage.clear();
  sessionStorage.clear();
  delete (window as { matchMedia?: unknown }).matchMedia;
});




describe("R18-N11/N12 Übersicht im Assistenten", () => {
  it("nennt fehlende Angaben „nicht eingetragen“ und leere Namenszellen „(offen)“, mit Legende der Rollen", () => {
    const b = neuerBogen();
    b.personal = [neuePerson(), { ...neuePerson(), vorname: "Anna", nachname: "Beispiel" }];
    render(<Uebersicht bogen={b} geheZu={() => {}} neu={() => {}} />);
    const dt = screen.getByText("Uhrzeit Beginn / Ende");
    expect(dt.nextElementSibling!.textContent).toContain("nicht eingetragen / nicht eingetragen");
    expect(dt.nextElementSibling!.textContent).toContain("(optional, nur für eigene Nachweise — Schritt 2)");
    expect(dt.nextElementSibling!.textContent).not.toContain("kommen nicht hierher zurück");
    expect(screen.getByText("Ort / Auftrag").nextElementSibling!.textContent).toBe("nicht eingetragen");
    const zellen = [...document.querySelectorAll("table.uebersicht tbody tr")].map((tr) => (tr.children[2] as HTMLElement).textContent);
    expect(zellen).toContain("(offen)");
    expect(zellen).toContain("Beispiel, Anna");
    expect(document.querySelector(".rollen-legende")!.textContent).toBe("Fü = Führer/in · UFü = Unterführer/in · Ma = Mannschaft");
  });
});

describe("R18-H5 Autokorrektur aus bei Ort, Sonstiges und Zettelangaben", () => {
  const aus = (el: HTMLElement) => {
    expect(el.getAttribute("autocorrect")).toBe("off");
    expect(el.getAttribute("spellcheck")).toBe("false");
  };

  it("Einsatzort / Auftrag (Schritt 2)", () => {
    render(<SchrittBuehne komponente={SchrittEinsatz} />);
    aus(screen.getByLabelText("Einsatzort / Auftrag"));
  });

  it("Sonstiges (Schritt 5)", () => {
    render(<SchrittBuehne komponente={SchrittSofortbedarf} />);
    aus(screen.getByLabelText("Sonstiges (Freitext)"));
  });
});

describe("R18: Stilregeln in index.html", () => {
  const html = readFileSync(`${process.cwd()}/index.html`, "utf8");
  const abschnitt = (() => {
    const von = html.indexOf("/* ===== Runde 18 (Inhalte) ===== */");
    const bis = html.indexOf("/* ===== Ende Runde 18 (Inhalte) ===== */");
    expect(von).toBeGreaterThan(0);
    expect(bis).toBeGreaterThan(von);
    return html.slice(von, bis).replace(/\/\*[\s\S]*?\*\//g, "");
  })();

  it("N8: „Zurück“ trägt sein Wort ab 17 rem; im Schritt 1 ist der gesperrte Knopf unsichtbar", () => {
    expect(abschnitt).toMatch(/@container assistent-nav \(min-width: 17rem\)\s*\{\s*footer\.nav\.assistent-nav > \.nav-zurueck \.nav-wort \{ display: inline; \}/);
    expect(abschnitt).toMatch(/footer\.nav\.assistent-nav > \.nav-zurueck:disabled \{ visibility: hidden; \}/);
  });

  it("W7: Schrittleiste und Legende der Schnellerfassung sind am Telefon eingeklappt", () => {
    expect(abschnitt).toMatch(/@media \(max-width: 30rem\)\s*\{[^}]*\.schritte\.schritte-schnell[^}]*display: none/);
  });

  it("A6/A7: die Textverweise des Abschluss-Blocks sind 44 px hoch", () => {
    expect(abschnitt).toMatch(/\.einsatz-abschluss button\.link \{[^}]*min-height: 44px/);
  });
});
