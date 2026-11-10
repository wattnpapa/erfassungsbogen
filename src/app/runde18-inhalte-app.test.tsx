/**
 * Runde 18, Block Inhalte: Verhalten der ganzen App (jsdom) — Entwurfskarte mit Erklärsatz und Sollplätzen (N7), Verlauf beim Kaltstart
 * in den letzten Einsatz (K12), Dateinamen der Ausgaben im Download (W6, H9), Quittung der Tabellen mit Dateiname (A4).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrganisationsTyp, PersonalErfassung } from "@bos/eeb-format/model";
import { neuePerson, neuerBogen } from "./hilfen";
import { entwurfSpeichern } from "./entwurf";

const geladen: { name: string }[] = [];
vi.mock("./pdf", () => ({
  pdfErzeugen: async () => {},
  pdfBlobUrl: async () => "blob:pdf-vorschau",
  einsatzPdfErzeugen: async () => true,
  einsatzLageblattErzeugen: async () => true,
  blankoPdfErzeugen: async () => true,
}));
vi.mock("./hilfen", async () => {
  const echt = await vi.importActual<typeof import("./hilfen")>("./hilfen");
  return { ...echt, blobAlsDownload: (name: string) => void geladen.push({ name }) };
});
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
  geladen.length = 0;
});

describe("R18-N7 Entwurfskarte", () => {
  it("trägt den Erklärsatz in der Karte und nennt reine Vorbelegung „Sollplätze, noch ohne Namen“", async () => {
    const b = neuerBogen();
    b.einheit.organisation = OrganisationsTyp.THW;
    b.einheit.hierarchie[0]!.name = "Müllheim";
    // Vorbelegung nach Einheitstyp: Plätze ohne Namen (niemand hat gezählt).
    b.personalErfassung = PersonalErfassung.VOLLSTAENDIG;
    b.personal = Array.from({ length: 9 }, () => neuePerson());
    entwurfSpeichern(b);
    // Der Entwurf wird beim Laden des Moduls gelesen: App nach dem Speichern neu laden.
    vi.resetModules();
    const { App: NeueApp } = await import("./app");
    render(<NeueApp />);
    const karte = await waitFor(() => {
      const k = document.querySelector(".entwurf-karte");
      expect(k).not.toBeNull();
      return k as HTMLElement;
    });
    expect(karte.textContent).toMatch(/Entwurf vom .+ Uhr wiederhergestellt\./);
    expect(karte.textContent).toContain("„Fortsetzen“ öffnet ihn dort, wo du warst.");
    // Der Satz steht nur einmal: in der Karte, nicht zusätzlich als eigener Kasten darunter.
    expect(document.querySelectorAll("p.meldung").length === 0 || ![...document.querySelectorAll("p.meldung")].some((p) => p.textContent!.startsWith("Entwurf vom "))).toBe(true);
    expect(karte.textContent).toMatch(/9 Sollplätze, noch ohne Namen/);
    expect(karte.textContent).not.toMatch(/Stärke \d+ \/ \d+/);
  });
});
