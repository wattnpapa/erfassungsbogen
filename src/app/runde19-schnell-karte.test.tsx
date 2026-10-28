/**
 * Runde 19, Block Schnellerfassung und Karte: Verhalten (Texte, Zustände, Reihenfolge) und die Stilregeln in index.html.
 * Die Maße (y-Lage des ersten Felds, Kartenhöhe, Tippziele, Lücken) stammen aus Messungen im Produktionsbuild mit
 * Playwright (Chromium, Touch); jsdom rechnet kein Layout.
 */
import { readFileSync } from "node:fs";
import { useState } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { PersonalErfassung } from "@bos/eeb-format/model";
import { neuerBogen } from "./hilfen";
import { dauerText } from "./lagemonitor";
import { telefonTippen } from "./telefon-eingabe";
import { SchrittEinheit } from "./schritte/einheit";
import { TelefonFeld } from "./schritte/telefon-feld";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const html = readFileSync(`${process.cwd()}/index.html`, "utf8");
const abschnitt = (() => {
  const von = html.indexOf("/* ===== Runde 19 (Schnellerfassung und Karte) ===== */");
  expect(von).toBeGreaterThan(0);
  const bis = html.indexOf("/* ===== Ende Runde 19 (Schnellerfassung und Karte) ===== */", von);
  expect(bis).toBeGreaterThan(von);
  return html.slice(von, bis).replace(/\/\*[\s\S]*?\*\//g, "");
})();

describe("Schnellerfassung, Schritt Einheit (E3, E4, G11, M7, S2, O7)", () => {
  it("zeigt den Ort als erstes Feld und alles Übrige hinter einem Aufklapper", () => {
    const b = neuerBogen();
    render(<SchrittEinheit bogen={{ ...b, personalErfassung: PersonalErfassung.NUR_STAERKE }} aendern={() => {}} />);
    const karte = document.querySelector("section.schnell-einheit")!;
    expect(karte.querySelector("input")!.id).toBe("feld-einheit-name");
    const mehr = karte.querySelector<HTMLDetailsElement>("details.schnell-mehr")!;
    expect(mehr.open).toBe(false);
    expect(mehr.compareDocumentPosition(karte.querySelector("#feld-einheit-name")!) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
  });

  it("bleibt auf einem frischen Bogen still und nennt den fehlenden Ort erst, wenn etwas eingetragen ist", () => {
    const b = neuerBogen();
    const { unmount } = render(<SchrittEinheit bogen={b} aendern={() => {}} />);
    expect(screen.queryByText(/Ort der Einheit .* fehlt/)).toBeNull();
    unmount();
    render(<SchrittEinheit bogen={{ ...b, einheit: { ...b.einheit, einheitsTyp: { freitext: "Bergungsgruppe" } } }} aendern={() => {}} />);
    expect(screen.getByText(/Ort der Einheit .* fehlt/)).toBeDefined();
  });
});

describe("Telefonfeld (E12) und Dauer (K11)", () => {
  function Feld() {
    const [w, setW] = useState<string | undefined>("");
    return <TelefonFeld aria-label="Telefon" wert={w} setzen={setW} />;
  }

  it("sammelt zeichenweise getippte Buchstaben zu einem Satz statt je Zeichen einen neuen zu schreiben", async () => {
    const nutzer = userEvent.setup();
    render(<Feld />);
    await nutzer.type(screen.getByLabelText("Telefon"), "12abc34");
    expect(document.body.textContent).toMatch(/Nur Ziffern übernommen \(„abc" entfernt\)\./);
  });

  it("meldet Entferntes nur, wenn etwas entfernt wurde", () => {
    expect(telefonTippen("", "0441", undefined).entfernt).toBeUndefined();
    expect(telefonTippen("", "04x", undefined).entfernt).toEqual(["x"]);
  });

  it("schreibt unter einer Stunde nur die Minuten", () => {
    const t0 = 1_700_000_000_000;
    expect(dauerText(t0, t0 + 9 * 60_000)).toBe("9 Minuten");
    expect(dauerText(t0, t0 + 61 * 60_000)).toBe("1 Stunde, 1 Minute");
  });
});

describe("Stilregeln des Blocks in index.html", () => {
  it("hält die Tippziele der Tabelle und der Karte bei mindestens 44 px", () => {
    expect(abschnitt).toMatch(/table\.einheiten-tabelle button\.tabelle-oeffnen \{[^}]*min-height: 44px/);
    expect(abschnitt).toMatch(/input\[type="checkbox"\] \{ width: 44px; height: 44px; \}/);
  });

  it("legt die Kartenknöpfe in zwei Spalten mit mindestens 8 px Abstand", () => {
    expect(abschnitt).toMatch(/\.einheit-zeile \.vorlage-aktionen \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); gap: 8px; \}/);
  });

  it("stellt die Startseite so, dass beide Hauptwege nebeneinander im ersten Bild stehen", () => {
    expect(abschnitt).toMatch(/\.weiche \{ display: grid; grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); gap: 8px;/);
    expect(abschnitt).toMatch(/main\.start > \.weiche \{ order: 1; \}/);
  });

  it("zeigt die Namen in der Kerntabelle ungekürzt", () => {
    expect(abschnitt).toMatch(/tabelle-kern tbody th \.tabelle-name \{ display: inline; overflow: visible;/);
  });
});
