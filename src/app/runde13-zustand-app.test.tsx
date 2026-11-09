/**
 * Runde 13, Block Zustand: Verhalten der ganzen App — Rückgängig beim Einsatz-Löschen (S1), Rat bei vollem Speicher
 * und leerem Papierkorb (O3), Einspielen einer zu großen Sicherung (O1).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EinsatzArt, einsaetzeLaden, einsatzAnlegen as einsatzImSpeicherAnlegen } from "@bos/meldekopf/einsaetze";
import { sicherungInhalt } from "./sicherung";

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
  vi.restoreAllMocks();
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  localStorage.clear();
});

describe("R13-O1 Sicherung einspielen, die nicht auf das Gerät passt", () => {
  it("lässt die Daten des Geräts stehen und meldet auf Deutsch im Dialog „Datensicherung“", async () => {
    const vorhanden = einsatzImSpeicherAnlegen("Vorhandener Einsatz", EinsatzArt.EINSATZ);
    const nutzer = userEvent.setup();
    render(<App />);
    const datei = new File(
      [sicherungInhalt({ "eeb.einsaetze.v1": JSON.stringify([]), "eeb.zusatz.v1": "RIESIG" })],
      "sicHuge.json",
      { type: "application/json" },
    );
    const echt = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, k: string, v: string) {
      if (v === "RIESIG") throw new DOMException("Setting the value of 'eeb.zusatz.v1' exceeded the quota.", "QuotaExceededError");
      return echt.call(this, k, v);
    });

    await nutzer.click(screen.getByRole("button", { name: "Datensicherung" }));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Datensicherung']")!;
    const eingabe = dialog.querySelector<HTMLInputElement>("input[type='file']")!;
    await nutzer.upload(eingabe, datei);
    const frage = await screen.findByRole("dialog", { name: "Sicherung einspielen?" });
    await nutzer.click(within(frage).getByRole("checkbox", { name: /Ja, die Daten dieses Geräts durch die Sicherung ersetzen/ }));
    await nutzer.click(within(frage).getByRole("button", { name: "Einspielen und ersetzen" }));

    await waitFor(() => expect(dialog.textContent).toContain("Nicht eingespielt"));
    expect(dialog.textContent).toContain("Deine bisherigen Daten auf diesem Gerät sind unverändert.");
    expect(dialog.textContent).not.toMatch(/Failed to execute|quota/i);
    expect(einsaetzeLaden().map((s) => s.id)).toEqual([vorhanden.id]);
  }, 30000);
});
