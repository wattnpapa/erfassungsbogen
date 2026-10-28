/**
 * Runde 18, Block Inhalte: Verhalten der ganzen App (jsdom) — Entwurfskarte mit Erklärsatz und Sollplätzen (N7), Verlauf beim Kaltstart
 * in den letzten Einsatz (K12), Dateinamen der Ausgaben im Download (W6, H9), Quittung der Tabellen mit Dateiname (A4).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EinsatzArt, einsatzAnlegen, meldungHinzufuegen } from "@bos/meldekopf/einsaetze";
import { OrganisationsTyp, PersonalErfassung } from "@bos/eeb-format/model";
import { neuePerson, neuerBogen } from "./hilfen";
import { entwurfSpeichern } from "./entwurf";

/** Wie die App den zuletzt offenen Einsatz merkt (app.tsx `eeb.letzterEinsatz.v1`). */
function letztenEinsatzMerken(id: string): void {
  localStorage.setItem("eeb.letzterEinsatz.v1", JSON.stringify({ id, um: Date.now() }));
}

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

describe("R18-K12 Kaltstart in den letzten Einsatz", () => {
  it("legt unter den Einsatz einen Verlaufseintrag „Startseite“: Zurück zeigt zuerst die Startseite", async () => {
    const s = einsatzAnlegen("Hochwasser Weser", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, (() => { const b = neuerBogen(); b.einheit.hierarchie[0]!.name = "Albstadt"; return b; })());
    letztenEinsatzMerken(s.id);
    const vorher = window.history.length;
    render(<App />);
    await waitFor(() => expect(document.querySelector("#einheiten-liste")).not.toBeNull());
    // Zwei Einträge statt einem: Startseite darunter, Einsatz oben.
    expect(window.history.length).toBe(vorher + 1);
    const oben = (window.history.state as { eeb?: { einsatz: string | null } }).eeb!;
    expect(oben.einsatz).toBe(s.id);
    window.history.back();
    await waitFor(() => expect(document.querySelector("#einheiten-liste")).toBeNull());
    expect(screen.getByRole("button", { name: "Neuen Bogen erstellen" })).toBeDefined();
    expect((window.history.state as { eeb?: { einsatz: string | null } }).eeb!.einsatz).toBeNull();
  });

  it("nach dem Neuladen (Marke schon da) kommt kein weiterer Eintrag dazu", async () => {
    const s = einsatzAnlegen("Hochwasser Weser", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, (() => { const b = neuerBogen(); b.einheit.hierarchie[0]!.name = "Albstadt"; return b; })());
    letztenEinsatzMerken(s.id);
    window.history.replaceState({ eeb: { schritt: 0, zeigeStart: true, einsatz: s.id, scanner: false, muster: false, lauf: "alt" }, eebErste: true }, "");
    const vorher = window.history.length;
    render(<App />);
    await waitFor(() => expect(document.querySelector("#einheiten-liste")).not.toBeNull());
    expect(window.history.length).toBe(vorher);
  });
});

describe("R18-W6/A4 Ausgaben der Einsatzansicht", () => {
  it("die Übersicht als CSV heißt „JJJJ-MM-TT_HHMM_eeb-einsatz_<Einsatz>.csv“, und die Quittung nennt den Namen", async () => {
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Hochwasser Weser", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, (() => { const b = neuerBogen(); b.einheit.hierarchie[0]!.name = "Albstadt"; return b; })());
    letztenEinsatzMerken(s.id);
    render(<App />);
    await nutzer.click(await screen.findByRole("button", { name: /^Übersicht als CSV/ }));
    await waitFor(() => expect(geladen).toHaveLength(1));
    expect(geladen[0]!.name).toMatch(/^\d{4}-\d{2}-\d{2}_\d{4}_eeb-einsatz_Hochwasser_Weser\.csv$/);
    // R19-O10: Die Quittung ist eine Leiste mit Kurzfassung; der volle Satz steht für Vorleser in `.nur-sr`.
    const quittung = (await screen.findAllByText(/^✓ Gespeichert: /))[0]!;
    expect(quittung.textContent).toContain(geladen[0]!.name);
    expect(quittung.textContent).toContain("Download-Ordner");
  });

  it("Excel und alle Daten: eigene Art im Namen, Quittung mit Namen", async () => {
    const nutzer = userEvent.setup();
    const s = einsatzAnlegen("Hochwasser Weser", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, (() => { const b = neuerBogen(); b.einheit.hierarchie[0]!.name = "Albstadt"; return b; })());
    letztenEinsatzMerken(s.id);
    render(<App />);
    await nutzer.click(await screen.findByRole("button", { name: /^Alle Daten als CSV/ }));
    await waitFor(() => expect(geladen).toHaveLength(1));
    expect(geladen[0]!.name).toMatch(/^\d{4}-\d{2}-\d{2}_\d{4}_eeb-einsatz-alle-daten_Hochwasser_Weser\.csv$/);
    await waitFor(() => expect(screen.queryAllByText(/^✓ Gespeichert: /).length).toBeGreaterThan(0));
    expect(within(screen.getAllByText(/^✓ Gespeichert: /)[0]!.closest("[role=status]") as HTMLElement).getAllByText(/alle-daten/).length).toBeGreaterThan(0);
  });
});
