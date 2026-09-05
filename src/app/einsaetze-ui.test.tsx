/**
 * Einsatzansicht des Meldekopfs — geprüft wird der eine Weg, an dem fremde
 * Meldedaten verschwinden: „Entfernen" an einer Meldung.
 *
 * Wie überall bei Rückfragen zählen beide Richtungen. Ein Bestätigen, das nicht
 * entfernt, lässt eine abgerückte Einheit in der Stärkesumme stehen; ein
 * Abbruch, der trotzdem entfernt, wirft eine fremde Meldung samt Historie weg.
 *
 * Dazu der Einzelbogen als PDF: dort hängt am Ablauf ein Fenster, das der
 * Klick öffnet — es muss die Meldung zu sehen bekommen und darf im Fehlerfall
 * nicht als weißer Tab zurückbleiben.
 */

import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Erfassungsbogen } from "../model";
import { Dialogschicht } from "./dialoge";
import { EinsatzDetail } from "./einsaetze-ui";
import { EinsatzArt, einsaetzeLaden, einsatzAnlegen, meldungHinzufuegen, type MeldeEintrag } from "./einsaetze";
import { neuerBogen } from "./hilfen";

// pdfmake selbst hat hier nichts zu suchen: geprüft wird der Weg dorthin.
const meldungPdfAnzeigen = vi.fn<(m: MeldeEintrag, fenster: Window | null) => Promise<void>>(async () => {});
vi.mock("./pdf", () => ({
  meldungPdfAnzeigen: (m: MeldeEintrag, fenster: Window | null) => meldungPdfAnzeigen(m, fenster),
}));

function bogenMitName(name: string): Erfassungsbogen {
  const b = neuerBogen();
  b.einheit.hierarchie[0]!.name = name;
  return b;
}

/** Einsatz mit einer gemeldeten Einheit, Detailansicht offen. */
function buehne() {
  const angelegt = einsatzAnlegen("Hochwasser Wardenburg", EinsatzArt.EINSATZ);
  meldungHinzufuegen(angelegt.id, bogenMitName("Wardenburg"));
  const einsatz = einsaetzeLaden().find((s) => s.id === angelegt.id)!;
  const geaendert = vi.fn();
  render(
    <>
      <EinsatzDetail
        einsatz={einsatz}
        onZurueck={() => {}}
        onGeaendert={geaendert}
        onScannen={() => {}}
        onManuell={() => {}}
        onDateiImport={() => {}}
        onExport={() => {}}
        onCsvExport={() => {}}
        onCsvDetailExport={() => {}}
        onOldenburgExport={() => {}}
        onSammelPdf={() => {}}
        onGeloescht={() => {}}
      />
      <Dialogschicht />
    </>,
  );
  return { einsatzId: angelegt.id, geaendert };
}

describe("Meldung aus dem Einsatz entfernen", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  /** Meldung aufklappen und „Entfernen" drücken — die Rückfrage steht dann da. */
  async function entfernenDruecken(nutzer: ReturnType<typeof userEvent.setup>) {
    await nutzer.click(screen.getByRole("button", { name: "Details" }));
    await nutzer.click(screen.getByRole("button", { name: "Entfernen" }));
    return document.querySelector<HTMLDialogElement>("dialog[aria-label='Meldung entfernen?']")!;
  }

  it("entfernt die Meldung, wenn die Rückfrage bejaht wird", async () => {
    const nutzer = userEvent.setup();
    const { einsatzId, geaendert } = buehne();

    const dialog = await entfernenDruecken(nutzer);
    await nutzer.click(within(dialog).getByRole("button", { name: "Meldung entfernen" }));

    expect(einsaetzeLaden().find((s) => s.id === einsatzId)!.eintraege).toHaveLength(0);
    expect(geaendert).toHaveBeenCalled();
  });

  it("behält die Meldung, wenn die Rückfrage abgebrochen wird", async () => {
    const nutzer = userEvent.setup();
    const { einsatzId, geaendert } = buehne();

    const dialog = await entfernenDruecken(nutzer);
    await nutzer.click(within(dialog).getByRole("button", { name: "Abbrechen" }));

    expect(einsaetzeLaden().find((s) => s.id === einsatzId)!.eintraege).toHaveLength(1);
    expect(geaendert).not.toHaveBeenCalled();
  });
});

describe("Einzelbogen einer Meldung als PDF", () => {
  beforeEach(() => {
    localStorage.clear();
    meldungPdfAnzeigen.mockClear();
    meldungPdfAnzeigen.mockResolvedValue();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** Fenster, wie window.open es im Browser liefert — nur so viel, wie der Weg anfasst. */
  function tabAttrappe() {
    return {
      document: { body: { textContent: "" } },
      close: vi.fn(),
    } as unknown as Window & { close: ReturnType<typeof vi.fn> };
  }

  it("öffnet einen Tab im Klick und gibt ihm die Meldung mit", async () => {
    const nutzer = userEvent.setup();
    const tab = tabAttrappe();
    const oeffnen = vi.fn(() => tab);
    vi.stubGlobal("open", oeffnen);
    buehne();

    await nutzer.click(screen.getByRole("button", { name: "Bogen als PDF" }));

    // Leer aufgemacht und erst danach befüllt: nur so übersteht der Tab das
    // Nachladen des PDF-Satzes, ohne vom Popup-Blocker kassiert zu werden.
    expect(oeffnen).toHaveBeenCalledWith("", "_blank");
    expect(meldungPdfAnzeigen).toHaveBeenCalledTimes(1);
    const [meldung, fenster] = meldungPdfAnzeigen.mock.calls[0]!;
    expect(meldung.bogen.einheit.hierarchie[0]!.name).toBe("Wardenburg");
    expect(fenster).toBe(tab);
  });

  it("schließt den leeren Tab und meldet den Fehler, wenn die PDF scheitert", async () => {
    const nutzer = userEvent.setup();
    const tab = tabAttrappe();
    vi.stubGlobal("open", vi.fn(() => tab));
    meldungPdfAnzeigen.mockRejectedValue(new Error("Schriften fehlen"));
    buehne();

    await nutzer.click(screen.getByRole("button", { name: "Bogen als PDF" }));

    expect(tab.close).toHaveBeenCalled();
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Bogen als PDF']")!;
    expect(dialog).not.toBeNull();
    expect(dialog.textContent).toContain("Schriften fehlen");
  });

  it("kommt ohne Tab aus, wenn der Popup-Blocker keinen zulässt", async () => {
    const nutzer = userEvent.setup();
    vi.stubGlobal("open", vi.fn(() => null));
    buehne();

    await nutzer.click(screen.getByRole("button", { name: "Bogen als PDF" }));

    // Ohne Fenster bleibt der gewohnte Weg (Download bzw. Share-Sheet) — das
    // entscheidet meldungPdfAnzeigen, es muss den Fall aber zu sehen bekommen.
    expect(meldungPdfAnzeigen).toHaveBeenCalledTimes(1);
    expect(meldungPdfAnzeigen.mock.calls[0]![1]).toBeNull();
  });
});
