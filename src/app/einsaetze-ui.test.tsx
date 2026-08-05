/**
 * Einsatzansicht des Meldekopfs — geprüft wird der eine Weg, an dem fremde
 * Meldedaten verschwinden: „Entfernen" an einer Meldung.
 *
 * Wie überall bei Rückfragen zählen beide Richtungen. Ein Bestätigen, das nicht
 * entfernt, lässt eine abgerückte Einheit in der Stärkesumme stehen; ein
 * Abbruch, der trotzdem entfernt, wirft eine fremde Meldung samt Historie weg.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Erfassungsbogen } from "../model";
import { Dialogschicht } from "./dialoge";
import { EinsatzDetail } from "./einsaetze-ui";
import { EinsatzArt, einsaetzeLaden, einsatzAnlegen, meldungHinzufuegen } from "./einsaetze";
import { neuerBogen } from "./hilfen";

function bogenMitName(name: string): Erfassungsbogen {
  const b = neuerBogen();
  b.einheit.hierarchie[0]!.name = name;
  return b;
}

describe("Meldung aus dem Einsatz entfernen", () => {
  beforeEach(() => {
    localStorage.clear();
  });

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
