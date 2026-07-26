/**
 * Schritt 4 — Fahrzeuge: Anlegen, Kennzeichen, Funkrufname mit Kennzahlen und
 * die StAN-Vorbelegung aus dem Einheitstyp.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrganisationsTyp } from "../../model";
import { SchrittBuehne } from "../../test/schritt-buehne";
import { neuerBogen, vokabularFuer } from "../hilfen";
import { stanFahrzeugVorbelegung } from "../../vokabulare/thw-stan-fahrzeuge";
import { SchrittFahrzeuge } from "./fahrzeuge";

const buehne = () => render(<SchrittBuehne komponente={SchrittFahrzeuge} />);

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
    await nutzer.click(screen.getByRole("checkbox")); // Funkrufname

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

  it("entfernt ein Fahrzeug wieder", async () => {
    const nutzer = userEvent.setup();
    buehne();

    await nutzer.click(screen.getByRole("button", { name: "+ Fahrzeug hinzufügen" }));
    await nutzer.click(screen.getByRole("button", { name: "Fahrzeug entfernen" }));

    expect(screen.queryByLabelText("Kennzeichen")).toBeNull();
  });
});
