/**
 * Schritt 3 — Personal. Der Schritt hat drei Erfassungswege (Detail-Karten,
 * Schnelleingabe-Tabelle, Namens-Import) und die Meldekopf-Schnellerfassung;
 * geprüft wird, dass jeder davon Personal bzw. Stärke tatsächlich verändert.
 */

import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SchrittBuehne } from "../../test/schritt-buehne";
import { neuePerson, neuerBogen } from "../hilfen";
import { SchrittPersonal } from "./personal";

const buehne = () => render(<SchrittBuehne komponente={SchrittPersonal} />);

describe("Schritt Personal", () => {
  it("legt über „+ Person hinzufügen“ eine Detail-Karte an und zählt sie zur Stärke", async () => {
    const nutzer = userEvent.setup();
    buehne();

    expect(screen.getByLabelText(/^Stärke: 0 Führer/)).toBeDefined();

    await nutzer.click(screen.getByRole("button", { name: "+ Person hinzufügen" }));

    expect(screen.getByLabelText("Vorname")).toBeDefined();
    // Eine neue Person zählt zunächst als Mannschaft.
    expect(screen.getByLabelText("Stärke: 0 Führer, 0 Unterführer, 1 Mannschaft, 1 gesamt")).toBeDefined();
  });

  it("entfernt eine Person wieder", async () => {
    const nutzer = userEvent.setup();
    buehne();

    await nutzer.click(screen.getByRole("button", { name: "+ Person hinzufügen" }));
    await nutzer.click(screen.getByRole("button", { name: "Person entfernen" }));

    expect(screen.queryByLabelText("Vorname")).toBeNull();
    expect(screen.getByLabelText(/^Stärke: 0 Führer/)).toBeDefined();
  });

  it("rechnet in der Meldekopf-Schnellerfassung die Gesamtstärke aus", async () => {
    const nutzer = userEvent.setup();
    buehne();

    await nutzer.click(screen.getByLabelText("Nur Stärke (Meldekopf-Schnellerfassung)"));

    await nutzer.type(screen.getByLabelText("Führer"), "1");
    await nutzer.type(screen.getByLabelText("Unterführer"), "2");
    await nutzer.type(screen.getByLabelText("Mannschaft"), "9");

    expect((screen.getByLabelText("Gesamt") as HTMLInputElement).value).toBe("12");
  });

  /**
   * Beschriftung und Bedienelement müssen verbunden bleiben: nur so liest ein
   * Screenreader den Namen vor, und nur so trifft ein Klick auf den Text. Stand
   * die Beschriftung bloß daneben (<span>), fiel beides aus — daher der Klick
   * hier bewusst auf den Text und nicht auf das Kästchen.
   */
  it("schaltet die Erfassungsart auch über einen Klick auf die Beschriftung um", async () => {
    const nutzer = userEvent.setup();
    buehne();

    const nurStaerke = screen.getByLabelText("Nur Stärke (Meldekopf-Schnellerfassung)") as HTMLInputElement;
    expect(nurStaerke.checked).toBe(false);

    await nutzer.click(screen.getByText("Nur Stärke (Meldekopf-Schnellerfassung)"));

    expect(nurStaerke.checked).toBe(true);
    expect(screen.getByLabelText("Gesamt")).toBeDefined();
  });

  it("legt in der Schnelleingabe mit Enter die nächste Zeile an", async () => {
    const nutzer = userEvent.setup();
    buehne();

    await nutzer.click(screen.getByRole("button", { name: "+ Person hinzufügen" }));
    await nutzer.click(screen.getByLabelText("Schnelleingabe (Tabelle)"));

    const tabelle = screen.getByRole("table");
    expect(within(tabelle).getAllByRole("row")).toHaveLength(2); // Kopf + 1 Person

    const vorname = within(tabelle).getAllByRole("textbox")[0]!;
    await nutzer.type(vorname, "Erika{Enter}");

    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(3);
  });

  it("übernimmt eine eingefügte Namensliste als Personen", async () => {
    const nutzer = userEvent.setup();
    buehne();

    await nutzer.click(screen.getByRole("button", { name: "Namen einfügen…" }));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Namen einfügen']")!;
    expect(dialog.hasAttribute("open")).toBe(true);

    await nutzer.type(within(dialog).getByRole("textbox"), "Muster, Max\nErika Musterfrau");

    // Der Knopf beziffert die erkannten Zeilen — das ist die Vorschau.
    await nutzer.click(within(dialog).getByRole("button", { name: "2 Personen übernehmen" }));

    expect(dialog.hasAttribute("open")).toBe(false);
    const tabelle = screen.getByRole("table"); // Übernahme schaltet auf die Tabelle
    const werte = (within(tabelle).getAllByRole("textbox") as HTMLInputElement[]).map((f) => f.value);
    expect(werte).toEqual(["Max", "Muster", "Erika", "Musterfrau"]);
  });

  it("bietet Beispielnamen nur bei Übungsbögen an", async () => {
    const nutzer = userEvent.setup();
    render(<SchrittBuehne komponente={SchrittPersonal} bogen={{ ...neuerBogen(), uebung: true }} />);

    await nutzer.click(screen.getByRole("button", { name: "Namen einfügen…" }));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Namen einfügen']")!;
    await nutzer.click(within(dialog).getByRole("button", { name: "Beispielpersonen einfügen" }));

    // Vorgabe 9 Personen — als Schnelleingabe-Tabelle sichtbar (Kopf + 9 Zeilen).
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(10);
  });

  /**
   * Nach einer Vorlage steht der Bogen voller namenloser Sollplätze. Wer dann
   * Namen einfügt, will sie nicht hinter den leeren Zeilen wiederfinden: die
   * leeren weichen, alles schon Ausgefüllte bleibt stehen.
   */
  it("räumt beim Einfügen von Beispielpersonen die namenlosen Vorlagenzeilen weg", async () => {
    const nutzer = userEvent.setup();
    const thomas = { ...neuePerson(), vorname: "Thomas", nachname: "Lange" };
    render(
      <SchrittBuehne
        komponente={SchrittPersonal}
        bogen={{ ...neuerBogen(), uebung: true, personal: [neuePerson(), thomas, neuePerson()] }}
      />,
    );

    await nutzer.click(screen.getByRole("button", { name: "Namen einfügen…" }));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Namen einfügen']")!;
    await nutzer.click(within(dialog).getByRole("button", { name: "Beispielpersonen einfügen" }));

    // Thomas + 9 Beispielpersonen, die beiden leeren Zeilen sind weg.
    const tabelle = screen.getByRole("table");
    expect(within(tabelle).getAllByRole("row")).toHaveLength(11); // Kopf + 10
    const werte = (within(tabelle).getAllByRole("textbox") as HTMLInputElement[]).map((f) => f.value);
    expect(werte.slice(0, 2)).toEqual(["Thomas", "Lange"]);
    expect(werte.some((v) => v === "")).toBe(false);
  });

  it("räumt die namenlosen Zeilen auch beim Einfügen einer Namensliste weg", async () => {
    const nutzer = userEvent.setup();
    render(
      <SchrittBuehne komponente={SchrittPersonal} bogen={{ ...neuerBogen(), personal: [neuePerson(), neuePerson()] }} />,
    );

    await nutzer.click(screen.getByRole("button", { name: "Namen einfügen…" }));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Namen einfügen']")!;
    await nutzer.type(within(dialog).getByRole("textbox"), "Muster, Max");
    await nutzer.click(within(dialog).getByRole("button", { name: "1 Person übernehmen" }));

    const werte = (within(screen.getByRole("table")).getAllByRole("textbox") as HTMLInputElement[]).map((f) => f.value);
    expect(werte).toEqual(["Max", "Muster"]);
  });

  it("versteckt den Beispielnamen-Weg bei echten Bögen vollständig", async () => {
    const nutzer = userEvent.setup();
    buehne(); // frischer Bogen ohne Übungs-Flag

    await nutzer.click(screen.getByRole("button", { name: "Namen einfügen…" }));

    expect(screen.queryByRole("button", { name: "Beispielpersonen einfügen" })).toBeNull();
    expect(screen.queryByText("Beispielnamen (Übung)")).toBeNull();
  });
});
