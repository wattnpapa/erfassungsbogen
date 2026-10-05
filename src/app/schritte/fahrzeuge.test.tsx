/**
 * Schritt 4 — Fahrzeuge: Anlegen, Kennzeichen, Funkrufname mit Kennzahlen und
 * die StAN-Vorbelegung aus dem Einheitstyp.
 */

import { describe, it, expect } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrganisationsTyp, PersonalErfassung } from "@bos/eeb-format/model";
import { SchrittBuehne } from "../../test/schritt-buehne";
import { neuerBogen, neuesFahrzeug, vokabularFuer } from "../hilfen";
import { stanFahrzeugVorbelegung } from "@bos/vokabulare/thw-stan-fahrzeuge";
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
  it("bietet nach „Fahrzeug entfernen“ den Rückweg in der Daumenleiste (R3-D4)", async () => {
    const nutzer = userEvent.setup();
    const start = neuerBogen();
    start.fahrzeuge = [
      { ...neuesFahrzeug(), kennzeichen: "THW-80125" },
      { ...neuesFahrzeug(), kennzeichen: "THW-80126" },
    ];
    render(<SchrittBuehne komponente={SchrittFahrzeuge} bogen={start} />);

    const kennzeichen = () => (screen.getAllByLabelText("Kennzeichen") as HTMLInputElement[]).map((f) => f.value);
    const knopf = screen.getAllByRole("button", { name: /entfernen$/ }).find((b) => b.className.includes("entfernen"))!;
    await nutzer.click(knopf);
    const frage = document.querySelector<HTMLDialogElement>("dialog[open]")!;
    await nutzer.click(within(frage).getByRole("button", { name: "Fahrzeug entfernen" }));
    await waitFor(() => expect(kennzeichen()).toEqual(["THW-80126"]));

    const leiste = document.querySelector<HTMLElement>(".quittung-daumen")!;
    expect(leiste.textContent).toMatch(/^Entfernt: .*THW-80125/);
    // Eine Eingabe danach bleibt stehen, das Fahrzeug kommt an seine Stelle zurück.
    await nutzer.type(screen.getByDisplayValue("THW-80126"), "7");
    await nutzer.click(within(leiste).getByRole("button", { name: "Rückgängig" }));
    expect(kennzeichen()).toEqual(["THW-80125", "THW-801267"]);
    expect(document.querySelector(".quittung-daumen")!.textContent).toMatch(/^Zurückgeholt: .*THW-80125/);
  });

  it("„Vorbelegung entfernen“ lässt Fahrzeuge mit Sondergerät stehen und bietet „Rückgängig“ (R3-N2)", async () => {
    const nutzer = userEvent.setup();
    const { typ, vorlage } = stanTyp();
    const start = neuerBogen();
    start.einheit.organisation = OrganisationsTyp.THW;
    start.einheit.einheitsTyp = { code: typ.code };
    start.fahrzeuge = [
      { ...vorlage[0]!, aenderungen: "Lichtmast 2 kW, Tauchpumpe TP 4" },
      { ...neuesFahrzeug(), kennzeichen: "THW-80125" },
      { ...vorlage[0]! },
    ];
    render(<SchrittBuehne komponente={SchrittFahrzeuge} bogen={start} />);
    const sondergeraet = () => (screen.getAllByLabelText("Änderungen bzw. Sondergerät") as HTMLInputElement[]).map((f) => f.value);
    const kennzeichen = () => (screen.getAllByLabelText("Kennzeichen") as HTMLInputElement[]).map((f) => f.value);

    // Der Knopf steht unter der Liste, nicht als erster Knopf des Schritts.
    const knopf = screen.getByRole("button", { name: "Vorbelegung entfernen (1 Fahrzeug ohne eigene Angaben)" });
    const hinzufuegen = screen.getByRole("button", { name: "+ Fahrzeug hinzufügen" });
    expect(hinzufuegen.compareDocumentPosition(knopf) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(knopf.parentElement!.textContent).toMatch(/Ein Fahrzeug ohne Kennzeichen bleibt — dort ist schon Sondergerät/);

    await nutzer.click(knopf);
    expect(document.querySelector("dialog[open]")).toBeNull();
    expect(sondergeraet()).toEqual(["Lichtmast 2 kW, Tauchpumpe TP 4", ""]);
    expect(kennzeichen()).toEqual(["", "THW-80125"]);

    const leiste = document.querySelector<HTMLElement>(".quittung-daumen")!;
    expect(leiste.textContent).toMatch(/^Vorbelegung entfernt:/);
    await nutzer.click(within(leiste).getByRole("button", { name: "Rückgängig" }));
    expect(screen.getAllByLabelText("Kennzeichen")).toHaveLength(3);
    expect(kennzeichen()).toEqual(["", "THW-80125", ""]);
    expect(document.querySelector(".quittung-daumen")!.textContent).toMatch(/^Zurückgeholt:/);
  });

  it("legt ein Fahrzeug an und mahnt das fehlende Kennzeichen an", async () => {
    const nutzer = userEvent.setup();
    buehne();

    await nutzer.click(screen.getByRole("button", { name: "+ Fahrzeug hinzufügen" }));

    expect(screen.getByText(/Fahrzeug 1 hat noch kein Kennzeichen/)).toBeDefined();

    await nutzer.type(screen.getByLabelText("Kennzeichen"), "OL-FW 2041");

    expect(screen.queryByText(/hat noch kein Kennzeichen/)).toBeNull();
  });

  it("behandelt Kennzeichen und Kennzahlen als Kennung: Großbuchstaben, ohne Autokorrektur (R2-M6)", async () => {
    const nutzer = userEvent.setup();
    buehne();
    await nutzer.click(screen.getByRole("button", { name: "+ Fahrzeug hinzufügen" }));
    await nutzer.click(screen.getByLabelText("Funkrufname"));

    for (const feld of [screen.getByLabelText("Kennzeichen"), screen.getByLabelText("Kennzahlen (z. B. 18/13)")]) {
      expect(feld.getAttribute("autocapitalize")).toBe("characters");
      expect(feld.getAttribute("autocorrect")).toBe("off");
      expect(feld.getAttribute("spellcheck")).toBe("false");
      expect(feld.getAttribute("autocomplete")).toBe("off");
    }
  });

  it("übernimmt eine abweichende Sitzplatzzahl und rechnet die Bilanz damit", async () => {
    const nutzer = userEvent.setup();
    // Ein FüKomKw (Richtwert 3) und zwei Personen: Ohne eigene Angabe fehlt
    // nichts, mit einer 1 fehlt eine Mitfahrgelegenheit.
    const start = neuerBogen();
    start.fahrzeuge = [{ typ: { code: 3 } }];
    start.personal = [];
    start.staerkeManuell = { fuehrer: 0, unterfuehrer: 0, mannschaft: 2, gesamt: 2 };
    start.personalErfassung = PersonalErfassung.NUR_STAERKE;
    render(<SchrittBuehne komponente={SchrittFahrzeuge} bogen={start} />);

    const feld = screen.getByLabelText("Sitzplätze") as HTMLInputElement;
    // Der Richtwert des Typs steht als Platzhalter drin, nicht als Wert — sonst
    // wäre nicht mehr zu erkennen, was die Einheit selbst geprüft hat.
    expect(feld.value).toBe("");
    expect(feld.placeholder).toBe("3 (Richtwert)");
    expect(screen.getByText(/Sitzplätze:/).textContent).toMatch(/3 für 2 Personen/);

    await nutzer.type(feld, "1");

    expect(screen.getByText(/1 brauchen eine andere Mitfahrgelegenheit/)).toBeDefined();
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

  /** R2-N9: Platzhalter als Beispiel der eigenen Organisation, „eigener Standort" erklärt. */
  it("zeigt ein THW-Beispiel im Kennzeichen und erklärt „eigener Standort“", async () => {
    const nutzer = userEvent.setup();
    buehne();

    await nutzer.click(screen.getByRole("button", { name: "+ Fahrzeug hinzufügen" }));
    expect((screen.getByLabelText("Kennzeichen") as HTMLInputElement).placeholder).toBe("z. B. THW-84397");
    await nutzer.click(screen.getByLabelText("Funkrufname"));

    // Die Erklärung steht unter dem Kästchen, nicht in der Beschriftung — dort
    // brach „eigener Standort" in einer schmalen Spalte um (R3-N6).
    const kaestchen = screen.getByLabelText("eigener Standort");
    expect(kaestchen.closest("label")!.textContent).toBe("eigener Standort");
    expect(kaestchen.closest("label")!.nextElementSibling!.textContent).toMatch(/Ort im Funkrufnamen = Standort der Einheit/);
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

  it("entfernt ein leeres Fahrzeug ohne Rückfrage", async () => {
    const nutzer = userEvent.setup();
    buehne();

    await nutzer.click(screen.getByRole("button", { name: "+ Fahrzeug hinzufügen" }));
    await nutzer.click(screen.getByRole("button", { name: "Fahrzeug 1 entfernen" }));

    expect(screen.queryByLabelText("Kennzeichen")).toBeNull();
  });

  /** Wie bei der Personenkarte: erfasste Angaben gehen nicht still verloren. */
  it("fragt vor dem Entfernen eines erfassten Fahrzeugs nach", async () => {
    const nutzer = userEvent.setup();
    const bogen = neuerBogen();
    render(
      <SchrittBuehne
        komponente={SchrittFahrzeuge}
        bogen={{ ...bogen, fahrzeuge: [{ ...neuesFahrzeug(), kennzeichen: "THW-84397" }] }}
      />,
    );

    await nutzer.click(screen.getByRole("button", { name: "THW-84397 entfernen" }));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='THW-84397 entfernen?']")!;
    expect(dialog).not.toBeNull();
    await nutzer.click(within(dialog).getByRole("button", { name: "Abbrechen" }));

    expect((screen.getByLabelText("Kennzeichen") as HTMLInputElement).value).toBe("THW-84397");

    await nutzer.click(screen.getByRole("button", { name: "THW-84397 entfernen" }));
    const zweiter = document.querySelector<HTMLDialogElement>("dialog[aria-label='THW-84397 entfernen?']")!;
    await nutzer.click(within(zweiter).getByRole("button", { name: "Fahrzeug entfernen" }));

    expect(screen.queryByLabelText("Kennzeichen")).toBeNull();
  });
});
