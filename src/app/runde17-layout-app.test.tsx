/**
 * Runde 17, Block Layout: Verhalten der ganzen App (jsdom) — Fußleiste und Kopf des Assistenten in der Erfassung für eine
 * Sammlung (H6, M3, N7, L2), Weiter im Takt von 0,6 s (G11) und die gebündelte Meldung bei mehreren unlesbaren Dateien (G13).
 * Die Maße selbst sind im Produktionsbuild gemessen (Bericht); die Stilregeln prüft runde17-layout.test.tsx.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { tippSchutzZuruecksetzen } from "./tipp-schutz";

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
// Die Landesvorlagen (rund 300 Beispielbögen per Glob) braucht hier niemand; der späte Import risse nach dem Testende ab.
vi.mock("../vokabulare/landesvorlagen", () => ({
  bereichLabel: (s: string) => s,
  bundeslandLabel: (s: string) => s,
  hatLandesvorlagen: () => false,
  landesvorlagenBundeslaender: () => [],
  landesvorlagenGruppen: () => [],
  landesvorlage: () => undefined,
}));

const { App } = await import("./app");

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
});

describe("Weiter im Assistenten im Takt von 0,6 s (R17-G11)", () => {
  beforeEach(() => {
    localStorage.clear();
    tippSchutzZuruecksetzen();
  });

  it("jeder Tipp im Abstand von 0,6 s wechselt den Schritt; der Doppeltipp nach 0,3 s bleibt gesperrt", async () => {
    let jetzt = 1_800_000_000_000;
    vi.spyOn(Date, "now").mockImplementation(() => jetzt);
    render(<App />);
    const tipp = (el: HTMLElement) =>
      act(() => {
        el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, clientX: 290, clientY: 606, detail: 1 }));
      });
    const schritt = () => screen.getByRole("heading", { level: 2, name: /^\d\. / }).textContent;

    tipp(screen.getByRole("button", { name: "Neuen Bogen erstellen" }));
    await screen.findByRole("heading", { level: 2, name: "1. Einheit" });
    expect(schritt()).toMatch(/^1\./);
    jetzt += 1000; // gelesen, dann „Weiter“ (Sperre der Ansicht: 0,6 s)
    tipp(screen.getByRole("button", { name: "Weiter →" }));
    expect(schritt()).toMatch(/^2\./);
    jetzt += 300; // Doppeltipp
    tipp(screen.getByRole("button", { name: "Weiter →" }));
    expect(schritt()).toMatch(/^2\./);
    // Ab hier im Takt von 0,6 s: Vorher blieb jeder zweite Tipp liegen (Sperre 0,9 s).
    jetzt += 600;
    tipp(screen.getByRole("button", { name: "Weiter →" }));
    expect(schritt()).toMatch(/^3\./);
    jetzt += 600;
    tipp(screen.getByRole("button", { name: "Weiter →" }));
    expect(schritt()).toMatch(/^4\./);
  });
});
