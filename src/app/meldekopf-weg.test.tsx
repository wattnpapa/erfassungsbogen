/**
 * Die Einsatz-Sammlung ist seit 2026-11-09 in der Meldekopf-App. Die Startseite verweist dorthin und nennt Sammlungen,
 * die noch auf dem Gerät liegen, mit beiden Wegen: Datensicherung hinüber oder vom Gerät löschen.
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EinsatzArt, einsatzAnlegen, meldungHinzufuegen } from "@bos/meldekopf/einsaetze";
import { Dialogschicht } from "./dialoge";
import { MeldekopfWeg } from "./meldekopf-weg";
import { MELDEKOPF_URL } from "./meldekopf-app";
import { altbestandLesen, altbestandLoeschen, altbestandText } from "./meldekopf-altbestand";
import { einsaetzeLesenZuruecksetzen } from "./einsaetze-lesen";
import { neuerBogen } from "./hilfen";
import { vorlageAnlegen, vorlagenLaden } from "./vorlagen";

afterEach(() => {
  cleanup();
  localStorage.clear();
  einsaetzeLesenZuruecksetzen();
});

function sammlungMitMeldungen(name: string, n: number) {
  const s = einsatzAnlegen(name, EinsatzArt.EINSATZ);
  for (let i = 0; i < n; i++) {
    const b = neuerBogen();
    b.einheit.hierarchie[0]!.name = `OV ${name} ${i + 1}`;
    meldungHinzufuegen(s.id, b, { quelle: "manuell" });
  }
  einsaetzeLesenZuruecksetzen();
  return s;
}

describe("Altbestand", () => {
  it("ist leer, solange keine Sammlung auf dem Gerät liegt", () => {
    expect(altbestandLesen()).toBeNull();
  });

  it("zählt Sammlungen und Meldungen und nennt sie in einem Satz", () => {
    sammlungMitMeldungen("Hochwasser", 2);
    sammlungMitMeldungen("Übung", 1);
    const a = altbestandLesen()!;
    expect(a).toEqual({ sammlungen: 2, papierkorb: 0, meldungen: 3 });
    expect(altbestandText(a)).toBe("2 Einsatz-Sammlungen mit 3 Meldungen");
    expect(altbestandText({ sammlungen: 1, papierkorb: 1, meldungen: 1 })).toBe("1 Einsatz-Sammlung mit 1 Meldung (dazu 1 im Papierkorb)");
  });

  it("löscht nur die Sammlung und ihre Merker, Vorlagen bleiben", () => {
    sammlungMitMeldungen("Hochwasser", 1);
    vorlageAnlegen("FGr K", neuerBogen());
    localStorage.setItem("eeb.letzterEinsatz.v1", JSON.stringify({ id: "x", um: Date.now() }));
    expect(altbestandLoeschen()).toBeGreaterThanOrEqual(2);
    expect(altbestandLesen()).toBeNull();
    expect(localStorage.getItem("eeb.letzterEinsatz.v1")).toBeNull();
    expect(vorlagenLaden()).toHaveLength(1);
  });
});

describe("Startseiten-Abschnitt „Bögen sammeln (Meldekopf)“", () => {
  it("verlinkt die Meldekopf-App und zeigt ohne Altbestand keinen Hinweis", () => {
    render(<MeldekopfWeg />);
    const link = screen.getByRole("link", { name: /Meldekopf-App öffnen/ });
    expect(link.getAttribute("href")).toBe(MELDEKOPF_URL);
    expect(link.getAttribute("target")).toBe("_blank");
    expect(screen.queryByText(/Auf diesem Gerät liegen noch/)).toBeNull();
  });

  it("nennt den Altbestand und löscht ihn erst nach der Rückfrage", async () => {
    sammlungMitMeldungen("Hochwasser", 2);
    const nutzer = userEvent.setup();
    render(
      <>
        <MeldekopfWeg />
        <Dialogschicht />
      </>,
    );
    expect(screen.getByText(/Auf diesem Gerät liegen noch 1 Einsatz-Sammlung mit 2 Meldungen/)).toBeDefined();
    expect(screen.getByRole("button", { name: "Datensicherung erstellen…" })).toBeDefined();
    await nutzer.click(screen.getByRole("button", { name: "Sammlungen von diesem Gerät löschen…" }));
    const dialog = await waitFor(() => document.querySelector<HTMLDialogElement>("dialog[open]")!);
    // „Abbrechen" lässt alles stehen.
    await nutzer.click(within(dialog).getByRole("button", { name: "Abbrechen" }));
    expect(altbestandLesen()).not.toBeNull();
    await nutzer.click(screen.getByRole("button", { name: "Sammlungen von diesem Gerät löschen…" }));
    const zweiter = await waitFor(() => document.querySelector<HTMLDialogElement>("dialog[open]")!);
    await nutzer.click(within(zweiter).getByRole("button", { name: "Endgültig löschen" }));
    await waitFor(() => expect(screen.getByText("Die Sammlungen sind von diesem Gerät gelöscht.")).toBeDefined());
    expect(altbestandLesen()).toBeNull();
    expect(screen.queryByText(/Auf diesem Gerät liegen noch/)).toBeNull();
  });
});
