/**
 * Audit Runde 4, R4-D1 / Runde 5, R5-D1, R5-O5: „Geräteuhr prüfen" erscheint
 * nur bei nicht bestätigter Geräteuhr, nennt beide Möglichkeiten und die Folgen
 * mit Zahlen und verlangt eine Antwort.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EEB_EPOCHE_MS, MINUTEN_JE_TAG, jetztZeitpunkt } from "@bos/eeb-format/model";
import { uhrPruefungZuruecksetzen } from "./datenschutz-uhr";
import { Dialogschicht, dialogeZuruecksetzen } from "./dialoge";
import { UhrHinweis, UhrWarnung } from "./uhr-warnung";
import { neuerBogen } from "./hilfen";
import { entwurfZuJson } from "./entwurf";
import { msAusZeitpunkt } from "./uhr-folgen";

beforeEach(() => {
  localStorage.clear();
  uhrPruefungZuruecksetzen();
});
afterEach(() => dialogeZuruecksetzen());

function tagText(z: number) {
  return new Date(EEB_EPOCHE_MS + z * 60_000).toLocaleDateString("de-DE", { timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric" });
}

describe("UhrWarnung", () => {
  it("schweigt bei plausibler Uhr", () => {
    localStorage.setItem("eeb.uhr.v1", JSON.stringify({ zuletzt: jetztZeitpunkt() - 3 * MINUTEN_JE_TAG }));
    render(<UhrWarnung />);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("schweigt nach echter Pause, wenn nichts fällig wird", () => {
    localStorage.setItem("eeb.uhr.v1", JSON.stringify({ zuletzt: jetztZeitpunkt() - 100 * MINUTEN_JE_TAG }));
    render(<UhrWarnung />);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("warnt mit beiden Daten, wenn etwas fällig würde, und fragt statt zu behaupten, das Datum sei falsch", () => {
    const zuletzt = jetztZeitpunkt() - 365 * MINUTEN_JE_TAG;
    localStorage.setItem("eeb.uhr.v1", JSON.stringify({ zuletzt }));
    localStorage.setItem("eeb.einsaetze.v1", JSON.stringify([{ id: "a", name: "Alt", geaendert: Date.now() - 200 * 86_400_000, eintraege: [] }]));
    render(<UhrWarnung />);
    const w = screen.getByRole("alert");
    expect(w.textContent).toContain("Geräteuhr prüfen");
    expect(w.textContent).toContain("beim letzten Start war der " + tagText(zuletzt));
    expect(w.textContent).toContain("Stimmt das heutige Datum?");
    expect(w.textContent).toContain("löscht und anonymisiert die App nichts");
    expect(w.textContent).toContain("wird 1 Sammlung endgültig gelöscht");
    expect(screen.getByRole("button", { name: "Geräteuhr stimmt" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Uhr korrigieren" })).toBeTruthy();
  });

  // Audit Runde 6, R6-D3: Namen und letzte Änderung statt nur einer Zahl.
  it("nennt die betroffenen Sammlungen mit Namen und dem Alter ihrer letzten Änderung (R6-D3)", () => {
    const zuletzt = jetztZeitpunkt() - 365 * MINUTEN_JE_TAG;
    localStorage.setItem("eeb.uhr.v1", JSON.stringify({ zuletzt }));
    const zuletztMs = msAusZeitpunkt(zuletzt);
    localStorage.setItem(
      "eeb.einsaetze.v1",
      JSON.stringify([{ id: "a", name: "Hochwasser Test", geaendert: zuletztMs - 60 * 60_000, eintraege: [] }]),
    );
    render(<UhrWarnung />);
    const w = screen.getByRole("alert").textContent!;
    expect(w).toContain("„Hochwasser Test\" (vor 1 Stunde geändert)");
    expect(w).toContain("noch bearbeitet");
  });

  it("nennt bei zurückgestellter Uhr keine Löschfolgen und den Abstand in Tagen", () => {
    const zuletzt = jetztZeitpunkt() + 400 * MINUTEN_JE_TAG;
    localStorage.setItem("eeb.uhr.v1", JSON.stringify({ zuletzt }));
    render(<UhrWarnung />);
    const w = screen.getByRole("alert");
    expect(w.textContent).toContain("Die Uhr ist 400 Tage zurückgegangen");
    expect(w.textContent).not.toContain("endgültig gelöscht");
  });

  it("Geräteuhr stimmt: fragt mit den Folgen nach und bestätigt erst nach Ja", async () => {
    const zuletzt = jetztZeitpunkt() - 365 * MINUTEN_JE_TAG;
    localStorage.setItem("eeb.uhr.v1", JSON.stringify({ zuletzt }));
    localStorage.setItem("eeb.einsaetze.v1", JSON.stringify([{ id: "a", name: "Alt", geaendert: Date.now() - 200 * 86_400_000, eintraege: [] }]));
    const neuLaden = vi.fn();
    render(
      <>
        <UhrWarnung neuLaden={neuLaden} />
        <Dialogschicht />
      </>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Geräteuhr stimmt" }));
    const ja = await screen.findByRole("button", { name: /Datum stimmt — löschen/ });
    expect(JSON.parse(localStorage.getItem("eeb.uhr.v1")!)).toEqual({ zuletzt });
    expect(neuLaden).not.toHaveBeenCalled();
    fireEvent.click(ja);
    await waitFor(() => expect(neuLaden).toHaveBeenCalled());
    expect(JSON.parse(localStorage.getItem("eeb.uhr.v1")!).zuletzt).toBeGreaterThan(zuletzt);
  });

  it("Uhr korrigieren erklärt den Weg und ändert nichts am Speicher", () => {
    const zuletzt = jetztZeitpunkt() - 365 * MINUTEN_JE_TAG;
    localStorage.setItem("eeb.uhr.v1", JSON.stringify({ zuletzt }));
    localStorage.setItem("eeb.einsaetze.v1", JSON.stringify([{ id: "a", name: "Alt", geaendert: Date.now() - 200 * 86_400_000, eintraege: [] }]));
    render(<UhrWarnung neuLaden={() => undefined} />);
    fireEvent.click(screen.getByRole("button", { name: "Uhr korrigieren" }));
    expect(screen.getByRole("alert").textContent).toContain("Geräteeinstellungen");
    expect(screen.getByRole("button", { name: "Neu prüfen" })).toBeTruthy();
    expect(JSON.parse(localStorage.getItem("eeb.uhr.v1")!)).toEqual({ zuletzt });
  });

  // Audit Runde 7, R7-D5, R7-O4: Grammatik und der betroffene Bogen.
  it("sagt bei nur einem betroffenen Bogen „werden die Namen“ und nennt den Bogen (R7-D5, R7-O4)", () => {
    const zuletzt = jetztZeitpunkt() - 365 * MINUTEN_JE_TAG;
    localStorage.setItem("eeb.uhr.v1", JSON.stringify({ zuletzt }));
    const b = neuerBogen();
    b.stand = jetztZeitpunkt() - 400 * MINUTEN_JE_TAG;
    localStorage.setItem("eeb.entwurf.v1", entwurfZuJson(b, Date.now() - 400 * 86_400_000));
    render(<UhrWarnung />);
    const w = screen.getByRole("alert").textContent!;
    expect(w).toContain("werden die Namen im eigenen Bogen endgültig gelöscht");
    expect(w).not.toContain("wird die Namen");
    expect(w).toContain("Eigener Bogen: Bogen „");
    expect(w).toContain("zuletzt bearbeitet");
  });

  // Audit Runde 7, R7-H9, R7-G8: Die Antwort steht vor den Folgen.
  it("zeigt die zwei Knöpfe direkt nach dem ersten Satz, vor den Folgen (R7-H9)", () => {
    const zuletzt = jetztZeitpunkt() - 365 * MINUTEN_JE_TAG;
    localStorage.setItem("eeb.uhr.v1", JSON.stringify({ zuletzt }));
    localStorage.setItem("eeb.einsaetze.v1", JSON.stringify([{ id: "a", name: "Alt", geaendert: Date.now() - 200 * 86_400_000, eintraege: [] }]));
    render(<UhrWarnung />);
    const knopf = screen.getByRole("button", { name: "Geräteuhr stimmt" });
    const folgen = screen.getByText(/Wenn das Datum stimmt/);
    expect(knopf.compareDocumentPosition(folgen) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("nennt die Richtung des Sprungs in Worten (R7-S5)", () => {
    const zuletzt = jetztZeitpunkt() - 365 * MINUTEN_JE_TAG;
    localStorage.setItem("eeb.uhr.v1", JSON.stringify({ zuletzt }));
    localStorage.setItem("eeb.einsaetze.v1", JSON.stringify([{ id: "a", name: "Alt", geaendert: Date.now() - 200 * 86_400_000, eintraege: [] }]));
    render(<UhrWarnung />);
    expect(screen.getByRole("alert").textContent).toContain("Die Uhr ist 365 Tage vorgesprungen.");
  });
});

// Audit Runde 7, R7-W2: Solange die Uhrfrage offen ist, trägt auch der Bogen einen Hinweis.
describe("UhrHinweis", () => {
  it("steht nur, solange die Geräteuhr nicht bestätigt ist, und nennt das Datum des Geräts", () => {
    const { container, unmount } = render(<UhrHinweis />);
    expect(container.textContent).toBe("");
    unmount();
    const zuletzt = jetztZeitpunkt() + 400 * MINUTEN_JE_TAG;
    localStorage.setItem("eeb.uhr.v1", JSON.stringify({ zuletzt }));
    render(<UhrHinweis />);
    const h = screen.getByRole("status").textContent!;
    expect(h).toContain("Geräteuhr nicht bestätigt");
    expect(h).toContain("Datum und Stand dieses Bogens stimmen vielleicht nicht");
  });
});
