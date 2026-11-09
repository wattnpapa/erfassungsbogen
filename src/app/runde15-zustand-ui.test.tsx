/**
 * Runde 15, Block Zustand: Verhalten in der Oberfläche (jsdom) — eine Quittungsleiste zur Zeit (D1), Rückgängig nach
 * „Meldung entfernen“ über das Verlassen der Ansicht (D2), Herkunft nach „Als Übung kennzeichnen…“ (D4), Marke bei nicht
 * übernommener neuerer Eingabe (E2), „Aufteilen…“ rollt ins Bild (E4), Kennzeichen-Frage (E5), Hinweis auf unterbrochenen
 * Stapel (S1), Quittung für Auftrag/Notiz (W3), Bestätigung nach „Bogen als PDF“ (A5).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type MeldeEintrag } from "@bos/meldekopf/einsaetze";
import { neuerBogen } from "./hilfen";
import { SchrittBuehne } from "../test/schritt-buehne";
import { SchrittFahrzeuge } from "./schritte/fahrzeuge";

// pdfmake hat hier nichts zu suchen: geprüft wird der Weg dorthin.
const meldungPdfAnzeigen = vi.fn<(m: MeldeEintrag, fenster: Window | null) => Promise<void>>(async () => {});
vi.mock("./pdf", () => ({
  meldungPdfAnzeigen: (m: MeldeEintrag, fenster: Window | null) => meldungPdfAnzeigen(m, fenster),
}));

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  localStorage.clear();
  sessionStorage.clear();
});





describe("R15-E5 THW-Kennzeichen: „Stimmt das?“ nach dem Verlassen des Felds", () => {
  it("fragt bei vier Ziffern, nicht bei fünf und nicht bei freiem Text", async () => {
    const nutzer = userEvent.setup();
    const bogen = neuerBogen();
    bogen.fahrzeuge = [{ typ: {}, kennzeichen: "" }];
    render(<SchrittBuehne komponente={SchrittFahrzeuge} bogen={bogen} />);
    const feld = () => document.getElementById("feld-kennzeichen-0") as HTMLInputElement;
    await nutzer.type(feld(), "thw 8439");
    // Beim Tippen noch keine Frage.
    expect(screen.queryByText(/Stimmt das\?/)).toBeNull();
    await nutzer.tab();
    expect(feld().value).toBe("THW-8439");
    expect(document.querySelector(".kennzeichen-frage")!.textContent).toMatch(/fünf Ziffern.*„THW-8439“ hat 4\. Stimmt das\?/);
    await nutzer.clear(feld());
    await nutzer.type(feld(), "THW-84397");
    await nutzer.tab();
    expect(screen.queryByText(/Stimmt das\?/)).toBeNull();
    await nutzer.clear(feld());
    await nutzer.type(feld(), "DAS IST KEIN KENNZEICHEN");
    await nutzer.tab();
    expect(screen.queryByText(/Stimmt das\?/)).toBeNull();
  });
});
