/**
 * Schritt 1 — Einheit. Geprüft wird das, was hier Daten verändert: der
 * Organisationswechsel, die OV-Vorschlagsliste (samt mitgeführter Struktur)
 * und die Sichtbarkeit der Landesvorlagen.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SchrittBuehne } from "../../test/schritt-buehne";
import { SchrittEinheit } from "./einheit";

const buehne = () => render(<SchrittBuehne komponente={SchrittEinheit} />);

describe("Schritt Einheit", () => {
  it("zeigt das Kürzelfeld nur beim THW", async () => {
    const nutzer = userEvent.setup();
    buehne();

    expect(screen.getByLabelText("Kürzel")).toBeDefined();

    await nutzer.selectOptions(screen.getByLabelText("Organisation"), "Feuerwehr");

    expect(screen.queryByLabelText("Kürzel")).toBeNull();
  });

  it("übernimmt einen Ortsverband aus der Vorschlagsliste mit Kontakt und Struktur", async () => {
    const nutzer = userEvent.setup();
    buehne();

    await nutzer.type(screen.getByLabelText("Name (Pflicht)"), "Oldenburg");

    // Die OV-Liste lädt asynchron nach (dynamischer Import) — auf einer kalten
    // Maschine steht sie beim Tippen noch nicht, daher warten statt zugreifen.
    const treffer = await screen.findByText(
      (_text, el) => el?.tagName === "LI" && el.textContent?.startsWith("Oldenburg (NI)") === true,
      undefined,
      { timeout: 5000 }, // 220 kB OV-Daten: ein kalter CI-Runner braucht länger als die Vorgabe von 1 s
    );
    await nutzer.click(treffer);

    expect((screen.getByLabelText("Name (Pflicht)") as HTMLInputElement).value).toBe("Oldenburg (NI)");
    expect((screen.getAllByLabelText("Kürzel")[0] as HTMLInputElement).value).toBe("OODE");
    // Ziffern only — die Eingabe filtert Trenn- und Leerzeichen heraus.
    expect((screen.getAllByLabelText("Telefon")[0] as HTMLInputElement).value).toBe("04413401050");

    // Regionalstelle und Landesverband kommen als eigene Ebenen dazu.
    const namen = screen.getAllByLabelText("Name") as HTMLInputElement[];
    expect(namen.map((f) => f.value)).toEqual(["Oldenburg", "Bremen, Niedersachsen"]);
  });

  it("bildet den Anzeigenamen aus Organisation, Einheitstyp und Ebenenname", async () => {
    const nutzer = userEvent.setup();
    buehne();

    await nutzer.type(screen.getByLabelText("Name (Pflicht)"), "Musterhausen");

    expect(screen.getByText("THW Musterhausen")).toBeDefined();
  });

  it("bietet Landesvorlagen erst für Organisationen ohne eigene Vorbelegung an", async () => {
    const nutzer = userEvent.setup();
    buehne();

    // THW hat die code-basierte StAN-Vorbelegung — keine Landesvorlagen.
    expect(screen.queryByLabelText("Landesvorlage – Bundesland")).toBeNull();

    await nutzer.selectOptions(screen.getByLabelText("Organisation"), "Feuerwehr");

    // findBy…: das Landesvorlagen-Datenpaket lädt asynchron nach (dynamischer Import).
    const bundesland = await screen.findByLabelText("Landesvorlage – Bundesland");
    expect(bundesland).toBeDefined();
    // Ohne gewähltes Bundesland bleibt die Einheitenauswahl gesperrt.
    expect((screen.getByLabelText("Landesvorlage – Einheit") as HTMLSelectElement).disabled).toBe(true);
  });

  it("fügt Ebenen hinzu und entfernt sie wieder — die unterste bleibt", async () => {
    const nutzer = userEvent.setup();
    buehne();

    await nutzer.click(screen.getByRole("button", { name: "+ Ebene hinzufügen" }));
    expect(screen.getAllByLabelText(/^Name/)).toHaveLength(2);

    await nutzer.click(screen.getByRole("button", { name: "✕" }));
    expect(screen.getAllByLabelText(/^Name/)).toHaveLength(1);
  });
});
