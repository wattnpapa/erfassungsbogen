/**
 * Audit Runde 7, R7-H2 und R7-O5: Die Musterung ist eine eigene Ansicht im Browser-Verlauf
 * (Zurück führt zur Startseite, nicht aus der App), und der gemerkte Rückweg des Personalschritts
 * bleibt nicht im Sitzungsspeicher, wenn der Bogen verworfen wird.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Erfassungsbogen } from "@bos/eeb-format/model";
import { neuerBogen } from "./hilfen";
import { vorlageAnlegen } from "./vorlagen";

vi.mock("./pdf", () => ({
  pdfErzeugen: async () => {},
  pdfBlobUrl: async () => "blob:pdf-vorschau",
  einsatzPdfErzeugen: async () => {},
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

function bogenMitName(name: string): Erfassungsbogen {
  const b = neuerBogen();
  b.einheit.hierarchie[0]!.name = name;
  return b;
}

describe("Musterung im Browser-Verlauf (R7-H2)", () => {
  afterEach(() => {
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    localStorage.clear();
    sessionStorage.clear();
  });

  it("Zurück aus der Musterung zeigt die Startseite, nicht eine andere Seite", async () => {
    vorlageAnlegen("FGr Zurückhausen", bogenMitName("OV Zurückhausen"));
    const nutzer = userEvent.setup();
    render(<App />);
    const laenge = window.history.length;
    await nutzer.click(screen.getByRole("button", { name: "Einsatz vorbereiten" }));
    expect(screen.getByRole("heading", { level: 1, name: "FGr Zurückhausen" })).toBeDefined();
    // Die Musterung hat einen eigenen Verlaufseintrag …
    expect((window.history.state as { eeb?: { muster?: boolean } }).eeb?.muster).toBe(true);
    expect(window.history.length).toBe(laenge + 1);
    // … und Zurück bricht sie ab wie „‹ Abbrechen".
    act(() => window.history.back());
    await waitFor(() => expect(screen.getByRole("button", { name: "Einsatz vorbereiten" })).toBeDefined());
    expect(screen.queryByRole("heading", { level: 1, name: "FGr Zurückhausen" })).toBeNull();
  });

  it("„‹ Abbrechen“ nimmt den Verlaufseintrag der Musterung zurück", async () => {
    vorlageAnlegen("FGr Abbruchhausen", bogenMitName("OV Abbruchhausen"));
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.click(screen.getByRole("button", { name: "Einsatz vorbereiten" }));
    await nutzer.click(screen.getByRole("button", { name: "‹ Abbrechen" }));
    await waitFor(() => expect((window.history.state as { eeb?: { muster?: boolean } } | null)?.eeb?.muster).toBeFalsy());
    expect(screen.getByRole("button", { name: "Einsatz vorbereiten" })).toBeDefined();
  });

  it("„Bogen anlegen“ ersetzt den Eintrag der Musterung (kein Zurück in die tote Musterung)", async () => {
    vorlageAnlegen("FGr Anlagehausen", bogenMitName("OV Anlagehausen"));
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.click(screen.getByRole("button", { name: "Einsatz vorbereiten" }));
    const laenge = window.history.length;
    await nutzer.click(screen.getByRole("button", { name: /^Bogen anlegen/ }));
    await screen.findByRole("heading", { level: 2, name: /Einsatz/ });
    expect(window.history.length).toBe(laenge);
    expect((window.history.state as { eeb?: { muster?: boolean } }).eeb?.muster).toBeFalsy();
  });
});

describe("Gemerkter Rückweg des Personalschritts (R7-O5)", () => {
  afterEach(() => {
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    localStorage.clear();
    sessionStorage.clear();
  });

  it("verschwindet aus dem Sitzungsspeicher, wenn der angefangene Bogen verworfen wird", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.click(screen.getByRole("button", { name: "Neuen Bogen erstellen" }));
    await nutzer.type(screen.getByLabelText("Ort der Einheit (Pflicht)"), "Verwerfhausen");
    sessionStorage.setItem(
      "eeb.personal.rueckweg",
      JSON.stringify({ rueckweg: { art: "liste", text: "x", personal: [] }, einheit: "{}", zeit: Date.now() }),
    );
    await nutzer.click(screen.getByRole("button", { name: "‹ Startseite" }));
    await nutzer.click(screen.getByRole("button", { name: "Bogen schließen" }));
    const frage = document.querySelector<HTMLDialogElement>("dialog[aria-label='Angefangenen Bogen schließen?']")!;
    await nutzer.click(within(frage).getByRole("button", { name: "Bogen schließen" }));
    await waitFor(() => expect(sessionStorage.getItem("eeb.personal.rueckweg")).toBeNull());
  });
});
