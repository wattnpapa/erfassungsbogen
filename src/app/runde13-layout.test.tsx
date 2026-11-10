/**
 * Behebungen aus Runde 13 (Layout): Tabelle am Telefon (R13-M1..M3), Nacht-Schrift (R13-L1), Anleitung (R13-N1),
 * ein Weg für „Vorbelegung entfernen" (R13-N2), Abstände der Antippflächen (R13-G2, R13-G3).
 */
import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SchrittPersonal } from "./schritte/personal";
import { SchrittBuehne } from "../test/schritt-buehne";
import { neuePerson, neuerBogen } from "./hilfen";

const lies = (pfad: string) => readFileSync(new URL(pfad, import.meta.url), "utf8");
const html = lies("../../index.html");
const anleitung = lies("../../public/anleitung.html");

const abschnitt = (() => {
  const von = html.indexOf("/* ===== Runde 13 (Layout) ===== */");
  expect(von).toBeGreaterThan(0);
  const bis = html.indexOf("/* ===== Ende Runde 13 (Layout) ===== */", von);
  expect(bis).toBeGreaterThan(von);
  return html.slice(von, bis).replace(/\/\*[\s\S]*?\*\//g, "");
})();

describe("Stilregeln Runde 13", () => {
  it("Marke „offen“ in Nacht mindestens 12 px (R13-L1)", () => {
    const regeln = [...html.matchAll(/\.nacht-modus \.schritte button\.status-begonnen \.schritt-status\s*\{([^}]*)\}/g)].map((m) => m[1]!);
    const letzte = regeln[regeln.length - 1] ?? "";
    expect(letzte).toMatch(/font-size:\s*max\(0\.95em,\s*12px\)/);
    expect(letzte).not.toMatch(/0\.85em/);
  });
});

describe("Anleitung (R13-N1)", () => {
  it("nennt für die Eintreffzeit Schritt 2 und den App-Namen „Einsatzbeginn eintragen“", () => {
    const text = anleitung.replace(/\s+/g, " ");
    expect(text).toContain("Eintreffzeit deiner Einheit trägst du in Schritt 2 ein („Einsatzbeginn eintragen“)");
    expect(text).not.toContain("Eintreffzeit deiner Einheit trägst du in Schritt 1");
  });
});

describe("Schritt 3: ein Weg für „Vorbelegung entfernen“ (R13-N2)", () => {
  it("zeigt bei unbenannten Karten genau einen Knopf mit Zahl und Wort der Warnung", () => {
    const bogen = neuerBogen();
    render(
      <SchrittBuehne
        komponente={SchrittPersonal}
        bogen={{ ...bogen, personal: [neuePerson(), neuePerson()] }}
      />,
    );
    expect(screen.getAllByRole("button", { name: "Vorbelegung entfernen (2 Personen ohne Namen)" })).toHaveLength(1);
    expect(screen.queryByRole("button", { name: /leere Pl/ })).toBeNull();
  });
});
