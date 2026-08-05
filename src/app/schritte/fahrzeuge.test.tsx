/**
 * Schritt 4 — Fahrzeuge: Anlegen, Kennzeichen, Funkrufname mit Kennzahlen und
 * die StAN-Vorbelegung aus dem Einheitstyp.
 */

import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrganisationsTyp } from "../../model";
import { SchrittBuehne } from "../../test/schritt-buehne";
import { neuerBogen, neuesFahrzeug, vokabularFuer } from "../hilfen";
import { stanFahrzeugVorbelegung } from "../../vokabulare/thw-stan-fahrzeuge";
import { SchrittFahrzeuge } from "./fahrzeuge";

const buehne = () => render(<SchrittBuehne komponente={SchrittFahrzeuge} />);

/**
 * Ersten THW-Einheitstyp mit StAN-Fahrzeugen samt seiner Vorgabe. Gesucht statt
 * festgeschrieben, damit die Tests eine geänderte StAN-Tabelle überleben.
 */
function stanTyp() {
  const typ = vokabularFuer(OrganisationsTyp.THW, "einheitstyp").find(
    (e) => stanFahrzeugVorbelegung(OrganisationsTyp.THW, { code: e.code }).length > 0,
  )!;
  return { typ, vorlage: stanFahrzeugVorbelegung(OrganisationsTyp.THW, { code: typ.code }) };
}

describe("Schritt Fahrzeuge", () => {
  it("legt ein Fahrzeug an und mahnt das fehlende Kennzeichen an", async () => {
    const nutzer = userEvent.setup();
    buehne();

    await nutzer.click(screen.getByRole("button", { name: "+ Fahrzeug hinzufügen" }));

    expect(screen.getByText(/Fahrzeug 1 hat noch kein Kennzeichen/)).toBeDefined();

    await nutzer.type(screen.getByLabelText("Kennzeichen"), "OL-FW 2041");

    expect(screen.queryByText(/hat noch kein Kennzeichen/)).toBeNull();
  });

  it("behält beim Tippen der Kennzahlen das Trennzeichen", async () => {
    const nutzer = userEvent.setup();
    buehne();

    await nutzer.click(screen.getByRole("button", { name: "+ Fahrzeug hinzufügen" }));
    await nutzer.click(screen.getByLabelText("Funkrufname"));

    const kennzahlen = screen.getByLabelText("Kennzahlen (z. B. 18/13)") as HTMLInputElement;
    await nutzer.type(kennzahlen, "18/13");

    // Der lokale Textzustand ist der Grund für dieses Feld: „18/" darf beim
    // Tippen nicht auf „18" zurückspringen.
    expect(kennzahlen.value).toBe("18/13");
  });

  it("lädt die StAN-Vorbelegung des Einheitstyps", async () => {
    const nutzer = userEvent.setup();
    // Ersten THW-Einheitstyp nehmen, für den es überhaupt eine Vorgabe gibt —
    // so bleibt der Test gültig, wenn sich die StAN-Tabelle ändert.
    const typ = vokabularFuer(OrganisationsTyp.THW, "einheitstyp").find(
      (e) => stanFahrzeugVorbelegung(OrganisationsTyp.THW, { code: e.code }).length > 0,
    )!;
    const vorlage = stanFahrzeugVorbelegung(OrganisationsTyp.THW, { code: typ.code });
    const start = neuerBogen();
    start.einheit.einheitsTyp = { code: typ.code };

    render(<SchrittBuehne komponente={SchrittFahrzeuge} bogen={start} />);

    await nutzer.click(
      screen.getByRole("button", { name: `StAN-Vorbelegung laden (${vorlage.length} Fahrzeuge)` }),
    );

    expect(screen.getAllByLabelText("Kennzeichen")).toHaveLength(vorlage.length);
  });

  /**
   * Der Test darüber startet mit leerer Liste — dann greift die
   * Kurzschluss-Bedingung und es gibt keine Rückfrage. Der eigentliche Weg
   * (Liste voll → Rückfrage → „Ersetzen") war damit nie geprüft. Hier ist er.
   */
  it("ersetzt eine eigene Liste nach Rückfrage durch die StAN-Fahrzeuge", async () => {
    const nutzer = userEvent.setup();
    const { typ, vorlage } = stanTyp();
    const start = neuerBogen();
    start.einheit.einheitsTyp = { code: typ.code };
    start.fahrzeuge = [{ ...neuesFahrzeug(), kennzeichen: "OL-FW 2041" }];

    render(<SchrittBuehne komponente={SchrittFahrzeuge} bogen={start} />);

    await nutzer.click(screen.getByRole("button", { name: /^StAN-Vorbelegung laden/ }));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='StAN-Vorbelegung laden?']")!;
    await nutzer.click(within(dialog).getByRole("button", { name: "Ersetzen" }));

    const kennzeichen = screen.getAllByLabelText("Kennzeichen") as HTMLInputElement[];
    expect(kennzeichen).toHaveLength(vorlage.length);
    expect(kennzeichen.some((f) => f.value === "OL-FW 2041")).toBe(false);
  });

  it("lässt bei „Abbrechen“ die eigene Liste unangetastet", async () => {
    const nutzer = userEvent.setup();
    const { typ } = stanTyp();
    const start = neuerBogen();
    start.einheit.einheitsTyp = { code: typ.code };
    start.fahrzeuge = [{ ...neuesFahrzeug(), kennzeichen: "OL-FW 2041" }];

    render(<SchrittBuehne komponente={SchrittFahrzeuge} bogen={start} />);

    await nutzer.click(screen.getByRole("button", { name: /^StAN-Vorbelegung laden/ }));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='StAN-Vorbelegung laden?']")!;
    await nutzer.click(within(dialog).getByRole("button", { name: "Abbrechen" }));

    const kennzeichen = screen.getAllByLabelText("Kennzeichen") as HTMLInputElement[];
    expect(kennzeichen).toHaveLength(1);
    expect(kennzeichen[0]!.value).toBe("OL-FW 2041");
  });

  /**
   * Schritt 1 trägt die StAN-Fahrzeuge beim Wählen des Einheitstyps schon ein.
   * Der Knopf würde die Liste dann durch eine identische ersetzen — Rückfrage,
   * Klick, und sichtbar passiert nichts. Genau so liest sich ein kaputter Knopf.
   */
  it("sperrt den StAN-Knopf, solange die Fahrzeuge schon genau so in der Liste stehen", () => {
    const { typ, vorlage } = stanTyp();
    const start = neuerBogen();
    start.einheit.einheitsTyp = { code: typ.code };
    start.fahrzeuge = vorlage;

    render(<SchrittBuehne komponente={SchrittFahrzeuge} bogen={start} />);

    expect(screen.getByRole("button", { name: /^StAN-Vorbelegung laden/ })).toHaveProperty("disabled", true);
    expect(screen.getByText(/Schon geladen/)).toBeDefined();
  });

  it("entfernt ein Fahrzeug wieder", async () => {
    const nutzer = userEvent.setup();
    buehne();

    await nutzer.click(screen.getByRole("button", { name: "+ Fahrzeug hinzufügen" }));
    await nutzer.click(screen.getByRole("button", { name: "Fahrzeug entfernen" }));

    expect(screen.queryByLabelText("Kennzeichen")).toBeNull();
  });
});
