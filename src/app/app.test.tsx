/**
 * Durchlauf durch den Assistenten — der Weg, den jeder Nutzer nimmt und den
 * jede Änderung an Schritten, Navigation oder Übersicht berühren kann:
 * Startseite → Schritt 1 → alle Schritte → Übersicht → Bogen übergeben.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrganisationsTyp, type Erfassungsbogen } from "../model";

// Die PDF-Erzeugung (pdfmake) ist eigenständig getestet und im Test nur teuer;
// hier zählt, dass der Weg dorthin funktioniert und der Bogen ankommt.
const pdfErzeugen = vi.fn<(bogen: Erfassungsbogen, name?: string) => Promise<void>>(async () => {});
vi.mock("./pdf", () => ({
  pdfErzeugen: (bogen: Erfassungsbogen, name?: string) => pdfErzeugen(bogen, name),
  pdfDatenUrl: async () => "data:application/pdf;base64,",
  einsatzPdfErzeugen: async () => {},
}));

// Ohne Capacitor: die Tests fahren die Browser-Variante der App.
vi.mock("./nativ", () => ({
  istNativ: () => false,
  plattform: () => "web",
  bogenLinksEmpfangen: () => () => {},
  qrScannen: async () => "",
  pdfTeilen: async () => {},
  linkTeilen: async () => {},
  textTeilen: async () => {},
}));

const { App } = await import("./app");

/** Vom Startbildschirm bis zum angegebenen Schritt klicken (0 = Einheit). */
async function neuerBogenBis(nutzer: ReturnType<typeof userEvent.setup>, bisSchritt: number) {
  await nutzer.click(screen.getByRole("button", { name: "Neuen Bogen erstellen" }));
  for (let i = 0; i < bisSchritt; i++) {
    await nutzer.click(screen.getByRole("button", { name: /(Weiter|Zur Übersicht) →/ }));
  }
}

describe("Assistenten-Durchlauf", () => {
  beforeEach(() => {
    pdfErzeugen.mockClear();
  });

  it("startet auf der Startseite und öffnet mit „Neuen Bogen erstellen“ Schritt 1", async () => {
    const nutzer = userEvent.setup();
    render(<App />);

    expect(screen.getByRole("heading", { name: "Einheiten-Erfassungsbogen" })).toBeDefined();
    await nutzer.click(screen.getByRole("button", { name: "Neuen Bogen erstellen" }));

    expect(screen.getByRole("heading", { name: "1. Einheit" })).toBeDefined();
  });

  it("führt Schritt für Schritt bis zur Übersicht und zeigt die erfasste Einheit", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.click(screen.getByRole("button", { name: "Neuen Bogen erstellen" }));

    await nutzer.type(screen.getByLabelText("Name (Pflicht)"), "Musterhausen");

    // Ein Klick je Schritt: Einheit → Einsatz → Personal → Fahrzeuge →
    // Sofortbedarf → Übersicht. Jede Zwischenüberschrift bestätigt, dass der
    // Schritt gerendert hat (und nicht nur der Zähler weitergelaufen ist).
    for (const titel of ["2. Einsatz", "3. Personal", "4. Fahrzeuge", "5. Sofortbedarf & Sonstiges"]) {
      await nutzer.click(screen.getByRole("button", { name: "Weiter →" }));
      expect(screen.getByRole("heading", { name: titel })).toBeDefined();
    }
    await nutzer.click(screen.getByRole("button", { name: "Zur Übersicht →" }));

    expect(screen.getByRole("heading", { name: "Gesamtübersicht" })).toBeDefined();
    // Die Übersicht fasst Schritt 1 zusammen — der Name muss dort ankommen.
    const einheit = screen.getByRole("heading", { name: "Einheit" }).closest("section")!;
    expect(within(einheit).getByText(/Musterhausen/)).toBeDefined();
  });

  it("erreicht die Übersicht auch über die Schrittleiste im Kopf", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await nutzer.click(screen.getByRole("button", { name: "Neuen Bogen erstellen" }));

    await nutzer.click(screen.getByRole("button", { name: /^6\. Übersicht/ }));

    expect(screen.getByRole("heading", { name: "Gesamtübersicht" })).toBeDefined();
  });

  it("bietet auf der Übersicht die offenen Punkte zum Beheben an", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await neuerBogenBis(nutzer, 5);

    // Frischer Bogen: der Einheitsname fehlt, also meldet die Checkliste ihn —
    // und der Punkt führt per Klick auf den Schritt, der ihn behebt.
    await nutzer.click(screen.getByRole("button", { name: /Der Name der eigenen Einheit/ }));

    expect(screen.getByRole("heading", { name: "1. Einheit" })).toBeDefined();
  });

  it("übergibt den Bogen als PDF — Knopf im Übergabedialog löst die Erzeugung aus", async () => {
    const nutzer = userEvent.setup();
    render(<App />);
    await neuerBogenBis(nutzer, 5);

    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Bogen übergeben']")!;
    expect(dialog.hasAttribute("open")).toBe(false);

    await nutzer.click(screen.getByRole("button", { name: "Bogen übergeben…" }));
    expect(dialog.hasAttribute("open")).toBe(true);

    const pdfKnopf = within(dialog).getByRole("button", { name: "PDF erzeugen" });
    expect(pdfKnopf.hasAttribute("disabled")).toBe(false);

    await nutzer.click(pdfKnopf);

    expect(pdfErzeugen).toHaveBeenCalledTimes(1);
    expect(pdfErzeugen.mock.calls[0]![0].einheit.organisation).toBe(OrganisationsTyp.THW);
  });

  it("verwirft den Bogen auf Nachfrage und kehrt zur Startseite zurück", async () => {
    const nutzer = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<App />);
    await neuerBogenBis(nutzer, 5);

    await nutzer.click(screen.getByRole("button", { name: "Neuer Bogen" }));

    expect(screen.getByRole("button", { name: "Neuen Bogen erstellen" })).toBeDefined();
  });
});
