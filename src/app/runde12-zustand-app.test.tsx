/**
 * Runde 12, Block Zustand: Verhalten der ganzen App — Einsatz löschen mit angefangener Erfassung (R12-S1),
 * leerer Einsatz (R12-E5), Absenderkarte (R12-E2), Eintreffzeit (R12-E4).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AbsenderkarteFeld } from "./absenderkarte-ui";
import { absenderkarteLaden } from "./absenderkarte";
import { Dialogschicht } from "./dialoge";

const einsatzPdfErzeugen = vi.fn(async () => true);
const einsatzLageblattErzeugen = vi.fn(async () => true);
vi.mock("./pdf", () => ({
  pdfErzeugen: async () => {},
  pdfBlobUrl: async () => "blob:pdf-vorschau",
  einsatzPdfErzeugen: (...a: unknown[]) => (einsatzPdfErzeugen as (...x: unknown[]) => Promise<boolean>)(...a),
  einsatzLageblattErzeugen: (...a: unknown[]) => (einsatzLageblattErzeugen as (...x: unknown[]) => Promise<boolean>)(...a),
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
  einsatzPdfErzeugen.mockClear();
  einsatzLageblattErzeugen.mockClear();
});

function rueckfrage(titel: string): HTMLElement {
  return document.querySelector<HTMLElement>(`dialog[aria-label='${titel}']`)!;
}

describe("R12-E2 Absenderkarte übernimmt keine unvollständige Adresse ohne Rückfrage", () => {
  function karte(onGespeichert = vi.fn()) {
    render(
      <>
        <AbsenderkarteFeld karte={{}} startOffen onGespeichert={onGespeichert} />
        <Dialogschicht />
      </>,
    );
    return onGespeichert;
  }

  it("fragt vor dem Übernehmen von „max@thw“; „Adresse prüfen“ übernimmt nichts, „Trotzdem übernehmen“ schon", async () => {
    const nutzer = userEvent.setup();
    const gespeichert = karte();
    await nutzer.type(screen.getByLabelText("Name"), "Max M");
    await nutzer.type(screen.getByLabelText("E-Mail"), "max@thw");
    expect(screen.getByText("Die E-Mail-Adresse sieht unvollständig aus.")).toBeDefined();

    await nutzer.click(screen.getByRole("button", { name: "Übernehmen" }));
    const frage = await screen.findByRole("dialog", { name: "E-Mail-Adresse übernehmen?" });
    expect(frage.textContent).toContain("„max@thw\" sieht unvollständig aus");
    await nutzer.click(within(frage).getByRole("button", { name: "Adresse prüfen" }));
    expect(gespeichert).not.toHaveBeenCalled();
    expect(absenderkarteLaden().email).toBeUndefined();

    await nutzer.click(screen.getByRole("button", { name: "Übernehmen" }));
    await nutzer.click(within(await screen.findByRole("dialog", { name: "E-Mail-Adresse übernehmen?" })).getByRole("button", { name: "Trotzdem übernehmen" }));
    expect(gespeichert).toHaveBeenCalledTimes(1);
    expect(absenderkarteLaden().email).toBe("max@thw");
  });

  it("eine plausible Adresse wird ohne Rückfrage übernommen", async () => {
    const nutzer = userEvent.setup();
    const gespeichert = karte();
    await nutzer.type(screen.getByLabelText("Name"), "Max M");
    await nutzer.type(screen.getByLabelText("E-Mail"), "max.mustermann@thw.de");
    await nutzer.click(screen.getByRole("button", { name: "Übernehmen" }));
    expect(gespeichert).toHaveBeenCalledTimes(1);
    expect(rueckfrage("E-Mail-Adresse übernehmen?")).toBeNull();
  });
});
