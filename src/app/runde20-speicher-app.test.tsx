/**
 * Runde 20, Block Speicher, Verhalten der ganzen App (jsdom): L3 (Zeile „zuletzt erzeugt“ bei vollem Speicher), O5/D4 (Papierkorb der Einsätze
 * auf der Startseite), D3 (Nummernwechsel beim Zusammenführen, Rückgängig, bleibender Hinweis).
 */
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EinsatzArt, einsatzAnlegen, meldungHinzufuegen } from "@bos/meldekopf/einsaetze";
import { neuerBogen } from "./hilfen";

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
  vi.restoreAllMocks();
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  localStorage.clear();
  sessionStorage.clear();
  geladen.length = 0;
});

function bogen(name: string) {
  const b = neuerBogen();
  b.einheit.hierarchie[0]!.name = name;
  return b;
}

describe("R20-D4 Papierkorb-Umschalter in Fingergröße", () => {
  it("die Regel im Abschnitt „Runde 20 (Speicher)“ der index.html gibt dem Knopf mindestens 44 px (im Browser gemessen: 44 px)", () => {
    const html = readFileSync(`${process.cwd()}/index.html`, "utf8");
    const von = html.indexOf("/* ===== Runde 20 (Speicher) ===== */");
    const bis = html.indexOf("/* ===== Ende Runde 20 (Speicher) ===== */");
    expect(von).toBeGreaterThan(0);
    expect(bis).toBeGreaterThan(von);
    expect(html.slice(von, bis)).toMatch(/button\.link\.papierkorb-umschalter \{[^}]*min-height: 44px/);
  });
});

describe("R20-L2 „Alle Daten löschen“: der sichere Weg steht über der festen Leiste", () => {
  it("„Vorher Sicherung erstellen…“ kommt vor der Folge-Zeile und vor der Entscheidungsleiste", async () => {
    const s = einsatzAnlegen("Hochwasser Loeschen", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogen("Albstadt"));
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.click(screen.getByRole("button", { name: "Alle Daten löschen" }));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Alle lokalen Daten löschen']")!;
    const sicherung = within(dialog).getAllByRole("button", { name: "Vorher Sicherung erstellen…" })[0]!;
    const folge = dialog.querySelector(".loesch-kurz")!;
    const leiste = dialog.querySelector(".dialog-entscheidung")!;
    expect(sicherung.compareDocumentPosition(folge) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(sicherung.compareDocumentPosition(leiste) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // Und nur einmal im Dialog (kein zweiter Knopf unter der Aufzählung).
    expect(within(dialog).getAllByRole("button", { name: "Vorher Sicherung erstellen…" })).toHaveLength(1);
  }, 30000);
});
