/** Audit Runde 4, R4-D1: „Geräteuhr prüfen" erscheint nur bei zurückgehaltener Geräteuhr. */
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { EEB_EPOCHE_MS, MINUTEN_JE_TAG, jetztZeitpunkt } from "@bos/eeb-format/model";
import { uhrPruefungZuruecksetzen } from "./datenschutz-uhr";
import { UhrWarnung } from "./uhr-warnung";

beforeEach(() => {
  localStorage.clear();
  uhrPruefungZuruecksetzen();
});

describe("UhrWarnung", () => {
  it("schweigt bei plausibler Uhr", () => {
    localStorage.setItem("eeb.uhr.v1", JSON.stringify({ zuletzt: jetztZeitpunkt() - 3 * MINUTEN_JE_TAG }));
    render(<UhrWarnung />);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("warnt mit beiden Daten, wenn die Uhr weit vorgeht, und sagt, dass nichts gelöscht wird", () => {
    const zuletzt = jetztZeitpunkt() - 365 * MINUTEN_JE_TAG;
    localStorage.setItem("eeb.uhr.v1", JSON.stringify({ zuletzt }));
    render(<UhrWarnung />);
    const w = screen.getByRole("alert");
    expect(w.textContent).toContain("Geräteuhr prüfen");
    expect(w.textContent).toContain("beim letzten Start war der " + new Date(EEB_EPOCHE_MS + zuletzt * 60_000).toLocaleDateString("de-DE", { timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric" }));
    expect(w.textContent).toContain("löscht und anonymisiert die App nichts");
  });
});
