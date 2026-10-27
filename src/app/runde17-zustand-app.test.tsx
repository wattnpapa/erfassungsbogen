/**
 * Runde 17, Block Zustand: Verhalten der ganzen App (jsdom) — Schnellerfassung: Zurück und Weiter nennen denselben Schritt (S12),
 * „Einheit manuell erfassen…" öffnet immer das volle Formular (S3), laufender Einsatz steht über den Wegen der Startseite (S9).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EinsatzArt, einsatzAnlegen, meldungHinzufuegen } from "@bos/meldekopf/einsaetze";
import { neuerBogen } from "./hilfen";

vi.mock("./pdf", () => ({
  pdfErzeugen: async () => {},
  pdfBlobUrl: async () => "blob:pdf-vorschau",
  einsatzPdfErzeugen: async () => true,
  einsatzLageblattErzeugen: async () => true,
  blankoPdfErzeugen: async () => true,
}));
vi.mock("./nativ", async () => {
  const echt = await vi.importActual<typeof import("./nativ")>("./nativ");
  return {
    istNativ: () => false,
    plattform: () => "web",
    imWebBrowser: () => true,
    bogenLinksEmpfangen: () => () => {},
    qrScannen: async () => "",
    binaerTeilen: async () => {},
    linkTeilen: async () => {},
    textTeilen: async () => {},
    shareSheetVerfuegbar: () => false,
    nahbereichDienst: echt.nahbereichDienst,
    pdfEinbettbar: () => true,
  };
});
vi.mock("./pdf-qr", () => ({ qrTexteAusPdfBytes: async () => [] }));

const { App } = await import("./app");

afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  localStorage.clear();
  sessionStorage.clear();
});

describe("R17-S12 Schnellerfassung: Weiter und Zurück führen über denselben Schritt", () => {
  it("von den Fahrzeugen geht es gleich zur Übersicht; „Zurück“ dort nennt Schritt 4, und der Knopf heißt dort wieder „Zur Übersicht“", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.click(screen.getByRole("button", { name: "Einheit schnell erfassen (nur Stärke)…" }));
    await nutzer.type(screen.getByLabelText("Ort der Einheit (Pflicht)"), "Schnellhausen");
    await nutzer.click(screen.getByRole("button", { name: "Weiter →" }));
    expect(screen.getByRole("heading", { level: 2, name: "3. Personal" })).toBeDefined();
    await nutzer.click(await screen.findByRole("button", { name: "Weiter →" }));
    expect(screen.getByRole("heading", { level: 2, name: "4. Fahrzeuge" })).toBeDefined();
    // Der Sofortbedarf entfällt in der Schnellerfassung (Reiter „–"): schon beim ersten Besuch heißt der Knopf „Zur Übersicht →“.
    await nutzer.click(screen.getByRole("button", { name: "Zur Übersicht →" }));
    expect(screen.getByRole("heading", { name: "Gesamtübersicht" })).toBeDefined();
    const zurueck = screen.getByRole("button", { name: "← Zurück zu Schritt 4 (Fahrzeuge)" });
    await nutzer.click(zurueck);
    expect(screen.getByRole("heading", { level: 2, name: "4. Fahrzeuge" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Zur Übersicht →" })).toBeDefined();
    expect(screen.queryByRole("button", { name: "Weiter →" })).toBeNull();
  });
});

describe("R17-S9 Ein laufender Einsatz steht oben auf der Startseite", () => {
  it("seine Karte liegt vor den Wegen „Meinen Bogen ausfüllen“ und „Bögen sammeln“", () => {
    const s = einsatzAnlegen("Hochwasser Süd", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, neuerBogen());
    render(<App />);
    const karte = screen.getByRole("button", { name: "Öffnen" });
    const eigener = screen.getByRole("region", { name: "Meinen Bogen ausfüllen" });
    const sammeln = screen.getByRole("region", { name: "Bögen sammeln (Meldekopf)" });
    expect(karte.compareDocumentPosition(eigener) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(karte.compareDocumentPosition(sammeln) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(sammeln).queryByRole("button", { name: /Hochwasser Süd/ })).toBeNull();
  });
});

describe("R17-S3 „Einheit manuell erfassen…“ öffnet immer das volle Formular", () => {
  it("auch wenn die zuletzt erfasste Einheit der Sammlung eine Schnellerfassung war", async () => {
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Sammelhausen", EinsatzArt.EINSATZ);
    const b = neuerBogen();
    b.personalErfassung = 1; // PersonalErfassung.NUR_STAERKE
    b.staerkeManuell = { fuehrer: 0, unterfuehrer: 2, mannschaft: 7, gesamt: 9 };
    meldungHinzufuegen(s.id, b, { quelle: "manuell" });
    render(<App />);
    await nutzer.click(screen.getByRole("button", { name: "Öffnen" }));
    await screen.findByRole("heading", { level: 1, name: "Sammelhausen" });
    await nutzer.click(screen.getByRole("button", { name: "Einheit manuell erfassen…" }));
    expect(within(screen.getByRole("banner")).queryByText("Schnellerfassung")).toBeNull();
  });
});
