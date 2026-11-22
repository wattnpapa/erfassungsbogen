/**
 * Übungsbögen-Dialog: mehrere Bögen markieren und als eine Sammel-PDF holen.
 * Die PDF-Erzeugung selbst ist in pdf-sammel.test.ts geprüft; hier zählt der
 * Weg dorthin — Häkchen, „Alle markieren", der Knopf mit der Zahl und was bei
 * der PDF-Erzeugung ankommt.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Erfassungsbogen } from "@bos/eeb-format/model";
import { neuerBogen } from "./hilfen";
import { ausgabeAnteil, ausgabeText } from "./beispiele-dialog";

const einzelPdfsAlsZip = vi.fn<(boegen: readonly Erfassungsbogen[], namen: readonly string[], datei: string) => Promise<boolean>>(async () => true);
const sammelPdfErzeugen = vi.fn<(boegen: readonly Erfassungsbogen[], name: string, titel: string) => Promise<boolean>>(async () => true);
vi.mock("./pdf", () => ({
  pdfErzeugen: async () => ({ nichtDarstellbar: 0, betroffen: [], umschrift: [], vereinfacht: [] }),
  sammelPdfErzeugen: (boegen: readonly Erfassungsbogen[], name: string, titel: string) => sammelPdfErzeugen(boegen, name, titel),
  einzelPdfsAlsZip: (boegen: readonly Erfassungsbogen[], namen: readonly string[], datei: string) => einzelPdfsAlsZip(boegen, namen, datei),
}));
vi.mock("./nativ", () => ({
  istNativ: () => false,
  linkTeilen: async () => {},
  shareSheetVerfuegbar: () => false,
}));

const { default: BeispieleDialog } = await import("./beispiele-dialog");

/** Die Übungsbögen liegen als Dateien neben der App; jsdom hat keinen Server — jede Anfrage bekommt denselben Übungsbogen. */
function fetchAttrappe(): () => void {
  const b = neuerBogen();
  b.einheit.hierarchie[0]!.name = "Beispielhausen";
  const json = JSON.stringify({ ...b, uebung: true });
  const echt = globalThis.fetch;
  globalThis.fetch = async () => new Response(json, { headers: { "content-type": "application/json" } });
  return () => {
    globalThis.fetch = echt;
  };
}

async function dialogMitBoegen(nutzer: ReturnType<typeof userEvent.setup>) {
  render(<BeispieleDialog anfrage={1} onBogenOeffnen={async () => true} />);
  const dialog = await screen.findByRole("dialog", { name: "Übungsbögen" });
  await nutzer.click(within(dialog).getByRole("button", { name: /^DLRG/ }));
  const haken = await within(dialog).findAllByRole("checkbox", { name: /für Sammel-PDF oder ZIP markieren$/ }, { timeout: 15000 });
  return { dialog, haken };
}

describe("Übungsbögen: markierte Bögen als Sammel-PDF", () => {
  it("zählt die Häkchen, markiert alle und hebt die Markierung wieder auf", async () => {
    const zurueck = fetchAttrappe();
    try {
      const nutzer = userEvent.setup();
      const { dialog, haken } = await dialogMitBoegen(nutzer);
      expect(haken.length).toBeGreaterThan(2);
      const sammel = within(dialog).getByRole("button", { name: /^Sammel-PDF/ });
      expect(sammel).toHaveProperty("disabled", true);

      await nutzer.click(haken[0]!);
      await nutzer.click(haken[1]!);
      expect(within(dialog).getByRole("button", { name: "Sammel-PDF (2 Bögen)" })).toHaveProperty("disabled", false);
      expect(within(dialog).getByText(`2 von ${haken.length} markiert.`)).toBeDefined();

      await nutzer.click(within(dialog).getByRole("button", { name: "Alle markieren" }));
      expect(within(dialog).getByRole("button", { name: `Sammel-PDF (${haken.length} Bögen)` })).toBeDefined();
      expect(haken.every((h) => (h as HTMLInputElement).checked)).toBe(true);

      await nutzer.click(within(dialog).getByRole("button", { name: "Markierung aufheben" }));
      expect(haken.every((h) => !(h as HTMLInputElement).checked)).toBe(true);
      expect(within(dialog).getByRole("button", { name: "Sammel-PDF" })).toHaveProperty("disabled", true);
    } finally {
      zurueck();
    }
  }, 30000);

  it("gibt genau die markierten Bögen in eine Datei mit Ordner und Bogenzahl im Namen", async () => {
    const zurueck = fetchAttrappe();
    sammelPdfErzeugen.mockClear();
    try {
      const nutzer = userEvent.setup();
      const { dialog, haken } = await dialogMitBoegen(nutzer);
      await nutzer.click(haken[0]!);
      await nutzer.click(haken[2]!);
      // Der Knopf nimmt kurz nach dem Ordnerwechsel keinen Tipp an (Doppeltipp-Schutz) — warten.
      await new Promise((r) => setTimeout(r, 850));
      await nutzer.click(within(dialog).getByRole("button", { name: "Sammel-PDF (2 Bögen)" }));

      expect(await within(dialog).findByText(/Sammel-PDF „uebung-beispiele-dlrg-2-boegen\.pdf“ mit 2 Bögen erzeugt/)).toBeDefined();
      expect(sammelPdfErzeugen).toHaveBeenCalledTimes(1);
      const [boegen, name, titel] = sammelPdfErzeugen.mock.calls[0]!;
      expect(boegen).toHaveLength(2);
      expect(boegen.every((b) => b.uebung)).toBe(true);
      expect(name).toBe("uebung-beispiele-dlrg-2-boegen.pdf");
      expect(titel).toBe("Übungsbögen DLRG (2 Bögen)");
      // Die Markierung bleibt stehen: wer noch einen Bogen dazunehmen will, fängt nicht von vorn an.
      expect((haken[0] as HTMLInputElement).checked).toBe(true);
    } finally {
      zurueck();
    }
  }, 30000);

  it("gibt die markierten Bögen als ZIP mit einer PDF je Bogen, benannt wie ihr Einzel-PDF", async () => {
    const zurueck = fetchAttrappe();
    einzelPdfsAlsZip.mockClear();
    try {
      const nutzer = userEvent.setup();
      const { dialog, haken } = await dialogMitBoegen(nutzer);
      await nutzer.click(haken[0]!);
      await nutzer.click(haken[1]!);
      await nutzer.click(haken[2]!);
      await new Promise((r) => setTimeout(r, 850));
      await nutzer.click(within(dialog).getByRole("button", { name: "Einzel-PDFs als ZIP" }));

      expect(await within(dialog).findByText(/ZIP-Datei „uebung-beispiele-dlrg-3-boegen\.zip“ mit 3 Bögen als einzelne PDFs erzeugt/)).toBeDefined();
      expect(einzelPdfsAlsZip).toHaveBeenCalledTimes(1);
      const [boegen, namen, datei] = einzelPdfsAlsZip.mock.calls[0]!;
      expect(boegen).toHaveLength(3);
      expect(datei).toBe("uebung-beispiele-dlrg-3-boegen.zip");
      expect(namen).toHaveLength(3);
      expect(namen.every((n) => /^uebung-beispiel-dlrg-.+\.pdf$/.test(n))).toBe(true);
    } finally {
      zurueck();
    }
  }, 30000);
});

describe("Fortschritt von Sammel-PDF und ZIP", () => {
  it("läuft von Laden über QR-Codes und Satz bis zur Datei vorwärts", () => {
    const stufen = [
      { schritt: "laden", n: 0, von: 10 },
      { schritt: "laden", n: 10, von: 10 },
      { schritt: "qr", n: 5, von: 10 },
      { schritt: "satz", n: 1, von: 10 },
      { schritt: "satz", n: 9, von: 10 },
    ] as const;
    for (const art of ["pdf", "zip"] as const) {
      const werte = stufen.map((s) => ausgabeAnteil({ art, ...s })!);
      expect(werte).toEqual([...werte].sort((a, b) => a - b));
      expect(werte[0]).toBe(0);
      expect(Math.max(...werte)).toBeLessThanOrEqual(1);
    }
    // Das Setzen aller Seiten in einem Zug lässt sich nicht zählen: Balken ohne Wert.
    expect(ausgabeAnteil({ art: "pdf", schritt: "datei", n: 0, von: 0 })).toBeNull();
    expect(ausgabeText({ art: "zip", schritt: "satz", n: 3, von: 1200 })).toBe("PDF 3 von 1.200 ist fertig …");
  });
});
