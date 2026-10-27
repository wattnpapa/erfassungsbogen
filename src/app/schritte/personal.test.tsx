/**
 * Schritt 3 — Personal. Der Schritt hat drei Erfassungswege (Detail-Karten,
 * Schnelleingabe-Tabelle, Namens-Import) und die Meldekopf-Schnellerfassung;
 * geprüft wird, dass jeder davon Personal bzw. Stärke tatsächlich verändert.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { SchrittBuehne } from "../../test/schritt-buehne";
import { Dialogschicht } from "../dialoge";
import {
  Ernaehrung,
  Fahrerlaubnis,
  Geschlecht,
  KontaktArt,
  OrganisationsTyp,
  StaerkeRolle,
  type Erfassungsbogen,
} from "@bos/eeb-format/model";
import { neuePerson, neuerBogen } from "../hilfen";
import { SchrittPersonal, kraftfahrerHinweis } from "./personal";
import { stanPersonalVorbelegung } from "@bos/vokabulare/thw-stan-personal";

const buehne = () => render(<SchrittBuehne komponente={SchrittPersonal} />);

/** Startbogen einer DLRG-Einheit — sonst ist der frische Bogen immer THW. */
const dlrgBogen = () => {
  const b = neuerBogen();
  return { ...b, einheit: { ...b.einheit, organisation: OrganisationsTyp.DLRG } };
};

beforeEach(() => {
  // Der Rückweg liegt im Sitzungsspeicher (R6-S4) und darf nicht in den nächsten Test hineinragen.
  sessionStorage.clear();
});

describe("Schritt Personal", () => {
  it("sagt, dass auf dem Papier die Fahrzeuge vor dem Personal stehen (R4-A8)", () => {
    buehne();
    expect(screen.getByText(/Vom Papier abtippen\? Auf dem Blatt stehen die Fahrzeuge oben, das Personal darunter: erst Schritt 4\./)).toBeDefined();
  });

  it("legt über „+ Person hinzufügen“ eine Detail-Karte an und zählt sie zur Stärke", async () => {
    const nutzer = userEvent.setup();
    buehne();

    expect(screen.getByLabelText(/^Stärke: 0 Führer/)).toBeDefined();

    await nutzer.click(screen.getByRole("button", { name: "+ Person hinzufügen" }));

    expect(screen.getByLabelText("Vorname")).toBeDefined();
    // Eine neue Person zählt zunächst als Mannschaft.
    expect(screen.getByLabelText("Stärke: 0 Führer, 0 Unterführer, 1 Mannschaft, 1 gesamt")).toBeDefined();
  });

  /**
   * Eine eben danebengetippte leere Karte muss ohne Rückfrage wieder
   * verschwinden — sonst erzieht die Rückfrage zum Wegklicken und schützt am
   * Ende die ausgefüllte Karte auch nicht mehr.
   */
  it("entfernt eine leere Person ohne Rückfrage", async () => {
    const nutzer = userEvent.setup();
    buehne();

    await nutzer.click(screen.getByRole("button", { name: "+ Person hinzufügen" }));
    await nutzer.click(screen.getByRole("button", { name: "Person 1 entfernen" }));

    expect(screen.queryByLabelText("Vorname")).toBeNull();
    expect(screen.getByLabelText(/^Stärke: 0 Führer/)).toBeDefined();
  });

  /**
   * Der Löschknopf sitzt in der Kopfzeile der Karte, zwischen Sortierpfeilen
   * und Rollen-Auswahl. Ein Fehlgriff kostete ein Dutzend Felder — Name,
   * Funktionen, Qualifikationen, Erreichbarkeiten — ohne Rückfrage und ohne
   * Rückgängig. „Neuer Bogen" und „Entwurf verwerfen" fragen beide nach; hier
   * wiegt es nicht weniger.
   */
  it("fragt vor dem Entfernen einer ausgefüllten Person nach und behält sie bei Abbruch", async () => {
    const nutzer = userEvent.setup();
    const bogen = neuerBogen();
    render(
      <SchrittBuehne
        komponente={SchrittPersonal}
        bogen={{ ...bogen, personal: [{ ...neuePerson(), vorname: "Jan", nachname: "Meyer" }] }}
      />,
    );

    await nutzer.click(screen.getByRole("button", { name: "Meyer, Jan entfernen" }));

    // Die Rückfrage nennt die Person — bei zwölf Karten ist das die einzige
    // Auskunft darüber, welche der Griff getroffen hat.
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Meyer, Jan entfernen?']")!;
    expect(dialog).not.toBeNull();
    await nutzer.click(within(dialog).getByRole("button", { name: "Abbrechen" }));

    expect(screen.getByLabelText(/^Stärke: 0 Führer, 0 Unterführer, 1 Mannschaft/)).toBeDefined();
  });

  it("entfernt die ausgefüllte Person erst nach Bestätigung", async () => {
    const nutzer = userEvent.setup();
    const bogen = neuerBogen();
    render(
      <SchrittBuehne
        komponente={SchrittPersonal}
        bogen={{ ...bogen, personal: [{ ...neuePerson(), vorname: "Jan", nachname: "Meyer" }] }}
      />,
    );

    await nutzer.click(screen.getByRole("button", { name: "Meyer, Jan entfernen" }));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Meyer, Jan entfernen?']")!;
    await nutzer.click(within(dialog).getByRole("button", { name: "Person entfernen" }));

    expect(screen.queryByLabelText("Vorname")).toBeNull();
    expect(screen.getByLabelText(/^Stärke: 0 Führer, 0 Unterführer, 0 Mannschaft/)).toBeDefined();
  });

  /**
   * Ohne Namen sind zwölf frische Karten optisch identisch. Die laufende
   * Nummer ist die Auskunft darüber, welche Stelle die Sortierknöpfe daneben
   * verschieben — und welche der Löschknopf trifft.
   */
  it("beziffert die Personenkarten sichtbar", async () => {
    const nutzer = userEvent.setup();
    buehne();

    await nutzer.click(screen.getByRole("button", { name: "+ Person hinzufügen" }));
    await nutzer.click(screen.getByRole("button", { name: "+ Person hinzufügen" }));

    expect(screen.getByText("Person 1 von 2")).toBeDefined();
    expect(screen.getByText("Person 2 von 2")).toBeDefined();
  });

  it("erklärt „Nur Stärke“ für den eigenen Bogen und die Regel zur ersten Person in der Kurz-Liste (R5-N7, R5-N8)", async () => {
    const nutzer = userEvent.setup();
    buehne();
    expect(screen.getByText(/„Nur Stärke“ meldet nur die Zahlen, ohne Namen; die Fahrzeuge folgen in Schritt 4/)).toBeDefined();
    await nutzer.click(screen.getByRole("button", { name: "+ Person hinzufügen" }));
    await nutzer.click(screen.getByRole("button", { name: "+ Person hinzufügen" }));
    await nutzer.click(screen.getByLabelText("Kurz-Liste (Tabelle)"));
    expect(screen.getByText(/Die erste Person ist die Ansprechperson/)).toBeDefined();
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
   * Die Stärke ist die Zahl, um die es in dieser Ansicht geht: Der Meldekopf
   * nimmt eine eintreffende Einheit im Stehen auf, oft mit Handschuh. Vorher
   * waren Führer, Unterführer und Mannschaft nackte Zahlenfelder — die
   * Tastatur musste auf —, während die Verpflegung darunter schon
   * −/+-Zähler hatte. Ausgerechnet die Hauptzahlen waren die umständlichen.
   */
  it("lässt die Stärke der Schnellerfassung ohne Tastatur zählen", async () => {
    const nutzer = userEvent.setup();
    buehne();

    await nutzer.click(screen.getByLabelText("Nur Stärke (Meldekopf-Schnellerfassung)"));

    await nutzer.click(screen.getByRole("button", { name: "Mannschaft: erhöhen" }));
    await nutzer.click(screen.getByRole("button", { name: "Mannschaft: erhöhen" }));
    await nutzer.click(screen.getByRole("button", { name: "Unterführer: erhöhen" }));

    expect((screen.getByLabelText("Mannschaft") as HTMLInputElement).value).toBe("2");
    expect((screen.getByLabelText("Gesamt") as HTMLInputElement).value).toBe("3");

    await nutzer.click(screen.getByRole("button", { name: "Mannschaft: verringern" }));
    expect((screen.getByLabelText("Gesamt") as HTMLInputElement).value).toBe("2");
    // Bei 0 ist Schluss — eine negative Stärke gibt es nicht.
    expect(screen.getByRole("button", { name: "Führer: verringern" })).toHaveProperty("disabled", true);
  });

  /** Dieselbe Bedienung für die Unterbringungsplätze im selben Block. */
  it("lässt auch die Aufteilung nach Geschlecht zählen, ausgeschrieben statt M/W/D (R3-N3)", async () => {
    const nutzer = userEvent.setup();
    buehne();

    await nutzer.click(screen.getByLabelText("Nur Stärke (Meldekopf-Schnellerfassung)"));
    await nutzer.click(screen.getByLabelText("Aufteilung nach Geschlecht angeben (für Unterbringung, WC/Dusche)"));

    await nutzer.click(screen.getByRole("button", { name: "weiblich: erhöhen" }));

    expect((screen.getByLabelText("weiblich") as HTMLInputElement).value).toBe("1");
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
    await nutzer.click(screen.getByLabelText("Kurz-Liste (Tabelle)"));

    const tabelle = screen.getByRole("table");
    expect(within(tabelle).getAllByRole("row")).toHaveLength(2); // Kopf + 1 Person

    const vorname = within(tabelle).getAllByRole("textbox", { name: /Vorname|Nachname/ })[0]!;
    // Eingabetaste im Vornamen: weiter zum Nachnamen derselben Zeile (R10-G1), noch keine neue Zeile.
    await nutzer.type(vorname, "Erika{Enter}");
    expect(document.activeElement).toBe(within(screen.getByRole("table")).getByLabelText("Person 1: Nachname"));
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(2);

    // Im Nachnamen der letzten Zeile legt sie die nächste Person an.
    await nutzer.type(document.activeElement as HTMLElement, "Muster{Enter}");
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(3);
    expect((within(screen.getByRole("table")).getByLabelText("Person 1: Nachname") as HTMLInputElement).value).toBe("Muster");
  });

  it("springt in der Kurz-Liste vom Nachnamen zum Vornamen der nächsten Zeile und markiert ihn (R10-G1)", async () => {
    const nutzer = userEvent.setup();
    buehne();
    await nutzer.click(screen.getByRole("button", { name: "+ Person hinzufügen" }));
    await nutzer.click(screen.getByRole("button", { name: "+ Person hinzufügen" }));
    await nutzer.click(screen.getByLabelText("Kurz-Liste (Tabelle)"));
    const tabelle = screen.getByRole("table");
    await nutzer.type(within(tabelle).getByLabelText("Person 2: Vorname"), "Otto");
    await nutzer.type(within(tabelle).getByLabelText("Person 1: Nachname"), "Albers{Enter}");
    const zwei = within(tabelle).getByLabelText("Person 2: Vorname") as HTMLInputElement;
    expect(document.activeElement).toBe(zwei);
    expect(zwei.selectionStart).toBe(0);
    expect(zwei.selectionEnd).toBe(4);
  });

  it("benennt die Namensfelder der Schnelleingabe je Person (R2-M5)", async () => {
    const nutzer = userEvent.setup();
    buehne();

    await nutzer.click(screen.getByRole("button", { name: "+ Person hinzufügen" }));
    await nutzer.click(screen.getByRole("button", { name: "+ Person hinzufügen" }));
    await nutzer.click(screen.getByLabelText("Kurz-Liste (Tabelle)"));

    const tabelle = screen.getByRole("table");
    const namen = within(tabelle).getAllByRole("textbox", { name: /Vorname|Nachname/ }).map((f) => f.getAttribute("aria-label"));
    expect(namen).toEqual(["Person 1: Vorname", "Person 1: Nachname", "Person 2: Vorname", "Person 2: Nachname"]);
    // Der Name hängt nicht am Wert: auch mit Inhalt heißt das Feld so.
    await nutzer.type(within(tabelle).getByRole("textbox", { name: "Person 2: Nachname" }), "Musterfrau");
    expect(within(tabelle).getByRole("textbox", { name: "Person 2: Nachname" })).toHaveProperty("value", "Musterfrau");
  });

  it("schlägt für Personen des Bogens nicht den eigenen Namen vor (R2-M6)", async () => {
    const nutzer = userEvent.setup();
    buehne();
    await nutzer.click(screen.getByRole("button", { name: "+ Person hinzufügen" }));

    expect(screen.getByLabelText("Vorname").getAttribute("autocomplete")).toBe("off");
    expect(screen.getByLabelText("Nachname").getAttribute("autocomplete")).toBe("off");
    await nutzer.click(screen.getByLabelText("Kurz-Liste (Tabelle)"));
    for (const feld of within(screen.getByRole("table")).getAllByRole("textbox", { name: /Vorname|Nachname/ })) {
      expect(feld.getAttribute("autocomplete")).toBe("off");
    }
  });

  it("beschriftet das Feld in „Namen einfügen“ sichtbar, nicht nur per Platzhalter (R2-M5)", async () => {
    const nutzer = userEvent.setup();
    buehne();

    await nutzer.click(screen.getByRole("button", { name: "Namen einfügen…" }));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Namen einfügen']")!;
    const feld = within(dialog).getByLabelText(/^Namensliste/);
    expect(feld.tagName).toBe("TEXTAREA");
    await nutzer.type(feld, "Muster, Max");
    expect(within(dialog).getByRole("textbox", { name: /^Namensliste/ })).toBe(feld);
  });

  // Audit Runde 8, R8-E2: Escape oder die Zurück-Geste verwarfen die mühsam eingefügte Liste ohne Frage.
  it("behält die eingefügte Liste, wenn das Fenster ohne Übernehmen schließt (R8-E2)", async () => {
    const nutzer = userEvent.setup();
    buehne();
    await nutzer.click(screen.getByRole("button", { name: "Namen einfügen…" }));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Namen einfügen']")!;
    await nutzer.type(within(dialog).getByRole("textbox"), "Muster, Max\nErika Musterfrau");
    dialog.close(); // Escape, Zurück-Geste und „Schließen“ laufen alle hierüber
    await nutzer.click(screen.getByRole("button", { name: "Namen einfügen…" }));
    expect((within(dialog).getByRole("textbox") as HTMLTextAreaElement).value).toBe("Muster, Max\nErika Musterfrau");
    expect(within(dialog).getByText(/Die Liste bleibt stehen/)).toBeDefined();
    await nutzer.click(within(dialog).getByRole("button", { name: "Liste leeren" }));
    expect((within(dialog).getByRole("textbox") as HTMLTextAreaElement).value).toBe("");
  });

  it("duzt im Hinweis zur stehenden Liste wie die übrige Oberfläche (R16-N3)", async () => {
    const nutzer = userEvent.setup();
    buehne();
    await nutzer.click(screen.getByRole("button", { name: "Namen einfügen…" }));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Namen einfügen']")!;
    await nutzer.type(within(dialog).getByRole("textbox"), "Muster, Max");
    const satz = within(dialog).getByText(/Die Liste bleibt stehen/).textContent ?? "";
    expect(satz).toContain("auch wenn du das Fenster schließt — bis du sie übernimmst oder leerst.");
    expect(satz).not.toMatch(/\bSie\b/);
  });

  it("übernimmt eine eingefügte Namensliste als Personen", async () => {
    const nutzer = userEvent.setup();
    buehne();

    // Die Übernahme ändert die Ansicht nicht mehr (R12-N6): hier ist die Kurz-Liste vorher gewählt.
    await nutzer.click(screen.getByLabelText("Kurz-Liste (Tabelle)"));
    await nutzer.click(screen.getByRole("button", { name: "Namen einfügen…" }));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Namen einfügen']")!;
    expect(dialog.hasAttribute("open")).toBe(true);

    await nutzer.type(within(dialog).getByRole("textbox"), "Muster, Max\nErika Musterfrau");

    // Der Knopf beziffert die erkannten Zeilen — das ist die Vorschau.
    await nutzer.click(within(dialog).getByRole("button", { name: "2 Personen übernehmen" }));

    expect(dialog.hasAttribute("open")).toBe(false);
    const tabelle = screen.getByRole("table");
    const werte = (within(tabelle).getAllByRole("textbox", { name: /Vorname|Nachname/ }) as HTMLInputElement[]).map((f) => f.value);
    expect(werte).toEqual(["Max", "Muster", "Erika", "Musterfrau"]);
  });

  // Audit Runde 7, R7-E7: Was kein Name ist, trägt eine Marke und wird nicht ungefragt übernommen.
  it("markiert Zeilen mit Ziffern oder Klammern als „kein Name?“ und übernimmt sie nur angehakt (R7-E7)", async () => {
    const nutzer = userEvent.setup();
    buehne();
    await nutzer.click(screen.getByLabelText("Kurz-Liste (Tabelle)")); // die Ansicht bleibt nach „Übernehmen“ (R12-N6)
    await nutzer.click(screen.getByRole("button", { name: "Namen einfügen…" }));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Namen einfügen']")!;
    await nutzer.type(within(dialog).getByRole("textbox"), "Müller, Hans\n12345\nMax Mustermann (Gf)");

    expect(within(dialog).getAllByText("kein Name?")).toHaveLength(2);
    expect(dialog.textContent).toContain("Zeilen sehen nicht nach einem Namen aus");
    // Nur die echte Zeile zählt: 1 Person.
    // Der Knopf nennt auch, wie viele Zeilen nicht übernommen werden (R17-H5).
    expect(within(dialog).getByRole("button", { name: "1 Person übernehmen (2 nicht)" })).toBeDefined();

    await nutzer.click(within(dialog).getByRole("checkbox", { name: /12345.*trotzdem als Name übernehmen/ }));
    await nutzer.click(within(dialog).getByRole("button", { name: "2 Personen übernehmen (1 nicht)" }));
    const tabelle = screen.getByRole("table");
    const werte = (within(tabelle).getAllByRole("textbox", { name: /Vorname|Nachname/ }) as HTMLInputElement[]).map((f) => f.value);
    expect(werte).toContain("Müller");
    expect(werte).toContain("12345");
    expect(werte.some((w) => w.includes("Gf"))).toBe(false);
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
    const werte = (within(tabelle).getAllByRole("textbox", { name: /Vorname|Nachname/ }) as HTMLInputElement[]).map((f) => f.value);
    expect(werte.slice(0, 2)).toEqual(["Thomas", "Lange"]);
    expect(werte.some((v) => v === "")).toBe(false);
  });

  /**
   * Audit Runde 2, R2-N2: Eingefügte Namen räumten die Sollplätze weg — mit
   * ihnen GrFü und TrFü, aus 0/2/7/9 wurde 0/0/2/2. Jetzt füllen sie die
   * freien Plätze der Reihe nach auf; nichts Leeres verschwindet.
   */
  it("setzt eingefügte Namen in die freien Plätze, statt sie wegzuräumen", async () => {
    const nutzer = userEvent.setup();
    render(
      <SchrittBuehne komponente={SchrittPersonal} bogen={{ ...neuerBogen(), personal: [neuePerson(), neuePerson()] }} />,
    );

    await nutzer.click(screen.getByLabelText("Kurz-Liste (Tabelle)")); // die Ansicht bleibt nach „Übernehmen“ (R12-N6)
    await nutzer.click(screen.getByRole("button", { name: "Namen einfügen…" }));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Namen einfügen']")!;
    await nutzer.type(within(dialog).getByRole("textbox"), "Muster, Max");
    expect(within(dialog).getByText(/→ Platz 1/)).toBeDefined();
    await nutzer.click(within(dialog).getByRole("button", { name: "1 Person übernehmen" }));

    const werte = (within(screen.getByRole("table")).getAllByRole("textbox", { name: /Vorname|Nachname/ }) as HTMLInputElement[]).map((f) => f.value);
    expect(werte).toEqual(["Max", "Muster", "", ""]);
  });

  it("lässt die StAN-Stärke beim Einfügen von Namen stehen und bietet Rückgängig an", async () => {
    const nutzer = userEvent.setup();
    const einheitsTyp = { code: 4 }; // B – Bergungsgruppe, -/2/7/9
    const bogen = neuerBogen();
    render(
      <SchrittBuehne
        komponente={SchrittPersonal}
        bogen={{
          ...bogen,
          einheit: { ...bogen.einheit, einheitsTyp },
          personal: stanPersonalVorbelegung(bogen.einheit.organisation, einheitsTyp),
        }}
      />,
    );

    await nutzer.click(screen.getByRole("button", { name: "Namen einfügen…" }));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Namen einfügen']")!;
    await nutzer.type(within(dialog).getByRole("textbox"), "Maier, Klaus\nAnna Schulz");
    await nutzer.click(within(dialog).getByRole("button", { name: "2 Personen übernehmen" }));

    expect(screen.getByLabelText("Stärke: 0 Führer, 2 Unterführer, 7 Mannschaft, 9 gesamt")).toBeDefined();
    const werte = (within(screen.getByRole("table")).getAllByRole("textbox", { name: /Vorname|Nachname/ }) as HTMLInputElement[]).map((f) => f.value);
    expect(werte.slice(0, 4)).toEqual(["Klaus", "Maier", "Anna", "Schulz"]);

    await nutzer.click(screen.getByRole("button", { name: "Rückgängig" }));
    const danach = (within(screen.getByRole("table")).getAllByRole("textbox", { name: /Vorname|Nachname/ }) as HTMLInputElement[]).map((f) => f.value);
    expect(danach.every((v) => v === "")).toBe(true);
   }, 20000);

  /**
   * Schritt 1 belegt das Personal beim Wählen des Einheitstyps schon mit der
   * StAN vor. „StAN-Sollplätze laden" würde die Liste danach durch eine
   * identische ersetzen: Rückfrage, Klick auf „Ersetzen" — und sichtbar
   * passiert nichts. Genau so liest sich ein kaputter Knopf, deshalb ist er in
   * diesem Zustand gesperrt und sagt auch, warum.
   */
  it("sperrt den StAN-Knopf, solange die Sollplätze schon genau so in der Liste stehen", () => {
    const einheitsTyp = { code: 4 }; // B – Bergungsgruppe, StAN-Stärke -/2/7/9
    const bogen = neuerBogen();
    render(
      <SchrittBuehne
        komponente={SchrittPersonal}
        bogen={{
          ...bogen,
          einheit: { ...bogen.einheit, einheitsTyp },
          personal: stanPersonalVorbelegung(bogen.einheit.organisation, einheitsTyp),
        }}
      />,
    );

    expect(screen.getByRole("button", { name: /^StAN-Sollplätze laden/ })).toHaveProperty("disabled", true);
    expect(screen.getByText(/Schon geladen/)).toBeDefined();
  });

  it("ersetzt nach einer Änderung wieder durch die Sollplätze", async () => {
    const nutzer = userEvent.setup();
    const einheitsTyp = { code: 4 };
    const bogen = neuerBogen();
    render(
      <SchrittBuehne
        komponente={SchrittPersonal}
        bogen={{
          ...bogen,
          einheit: { ...bogen.einheit, einheitsTyp },
          personal: [{ ...neuePerson(), vorname: "Thomas", nachname: "Lange" }],
        }}
      />,
    );

    const knopf = screen.getByRole("button", { name: /^StAN-Sollplätze laden/ });
    expect(knopf).toHaveProperty("disabled", false);

    await nutzer.click(knopf);
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='StAN-Sollplätze laden?']")!;
    // Die Rückfrage nennt den Namen, der verloren geht (R2-N2).
    expect(dialog.textContent).toMatch(/1 eingetragener Name verloren: Lange, Thomas/);
    await nutzer.click(within(dialog).getByRole("button", { name: "Ersetzen, Namen löschen" }));

    expect(screen.getByLabelText("Stärke: 0 Führer, 2 Unterführer, 7 Mannschaft, 9 gesamt")).toBeDefined();
    // Und jetzt steht die StAN so da wie sie ist — der Knopf hätte nichts mehr zu tun.
    expect(screen.getByRole("button", { name: /^StAN-Sollplätze laden/ })).toHaveProperty("disabled", true);

    // Rückgängig bringt Thomas zurück.
    await nutzer.click(screen.getByRole("button", { name: "Rückgängig" }));
    expect(screen.getByDisplayValue("Thomas")).toBeDefined();
  });

  it("quittiert „Person entfernen“ in der Daumenleiste, der Rückweg übersteht weitere Eingaben (R2-G1, R3-G1, R3-D3)", async () => {
    const nutzer = userEvent.setup();
    render(
      <SchrittBuehne
        komponente={SchrittPersonal}
        bogen={{ ...neuerBogen(), personal: [{ ...neuePerson(), vorname: "Paul", nachname: "Stein" }, { ...neuePerson(), vorname: "Eva", nachname: "Berg" }] }}
      />,
    );
    await nutzer.click(screen.getByRole("button", { name: "Stein, Paul entfernen" }));
    const frage = document.querySelector<HTMLDialogElement>("dialog[aria-label='Stein, Paul entfernen?']")!;
    await nutzer.click(within(frage).getByRole("button", { name: "Person entfernen" }));
    await waitFor(() => expect(screen.queryByDisplayValue("Paul")).toBeNull());

    // Feste Leiste im Daumenbereich statt an der Kartenoberkante (R3-G1).
    const daumen = () => document.querySelector<HTMLElement>(".quittung-daumen")!;
    const leiste = daumen();
    expect(leiste.getAttribute("role")).toBe("status");
    expect(leiste.textContent).toMatch(/^Entfernt: Stein, Paul/);

    // Eine weitere Eingabe nimmt den Rückweg nicht mehr weg (R3-D3) …
    await nutzer.type(screen.getByDisplayValue("Eva"), "-Maria");
    // … und „Rückgängig" lässt sie stehen: Paul kommt an seine alte Stelle.
    await nutzer.click(within(daumen()).getByRole("button", { name: "Rückgängig" }));
    const vornamen = screen.getAllByLabelText("Vorname").map((f) => (f as HTMLInputElement).value);
    expect(vornamen).toEqual(["Paul", "Eva-Maria"]);
    const zurueck = daumen();
    expect(zurueck.textContent).toMatch(/^Zurückgeholt: Stein, Paul \(wieder Person 1\)/);
    expect(within(zurueck).queryByRole("button", { name: "Rückgängig" })).toBeNull();
  });

  // Audit Runde 6, R6-S4: „Rückgängig" nach „Person entfernen" verschwand beim Schrittwechsel.
  it("hält „Rückgängig“ über den Schrittwechsel hinweg bereit (R6-S4)", async () => {
    const nutzer = userEvent.setup();
    const ausgang = {
      ...neuerBogen(),
      personal: [
        { ...neuePerson(), vorname: "Paul", nachname: "Stein" },
        { ...neuePerson(), vorname: "Eva", nachname: "Berg" },
      ],
    };
    const erste = render(<SchrittBuehne komponente={SchrittPersonal} bogen={ausgang} />);
    await nutzer.click(screen.getByRole("button", { name: "Berg, Eva entfernen" }));
    const frage = document.querySelector<HTMLDialogElement>("dialog[aria-label='Berg, Eva entfernen?']")!;
    await nutzer.click(within(frage).getByRole("button", { name: "Person entfernen" }));
    await waitFor(() => expect(screen.queryByDisplayValue("Eva")).toBeNull());
    erste.unmount(); // Schrittwechsel: Die Komponente verschwindet
    const ohneEva = { ...ausgang, personal: [ausgang.personal[0]!] };
    render(<SchrittBuehne komponente={SchrittPersonal} bogen={ohneEva} />);
    const leiste = document.querySelector<HTMLElement>(".quittung-daumen")!;
    expect(leiste.textContent).toMatch(/^Entfernt: Berg, Eva/);
    await nutzer.click(within(leiste).getByRole("button", { name: "Rückgängig" }));
    expect(screen.getAllByLabelText("Vorname").map((f) => (f as HTMLInputElement).value)).toEqual(["Paul", "Eva"]);
  });

  // Audit Runde 5, R5-S3: Wer in einer Reihe zwei Personen entfernt, konnte nur
  // die zweite zurückholen.
  it("„Rückgängig“ holt alle in einer Reihe entfernten Personen zurück, an ihre Stellen (R5-S3)", async () => {
    const nutzer = userEvent.setup();
    render(
      <SchrittBuehne
        komponente={SchrittPersonal}
        bogen={{
          ...neuerBogen(),
          personal: [
            { ...neuePerson(), vorname: "Paul", nachname: "Stein" },
            { ...neuePerson(), vorname: "Eva", nachname: "Berg" },
            { ...neuePerson(), vorname: "Sabine", nachname: "Lang" },
          ],
        }}
      />,
    );
    for (const name of ["Berg, Eva", "Stein, Paul"]) {
      await nutzer.click(screen.getByRole("button", { name: `${name} entfernen` }));
      const frage = document.querySelector<HTMLDialogElement>(`dialog[aria-label='${name} entfernen?']`)!;
      await nutzer.click(within(frage).getByRole("button", { name: "Person entfernen" }));
      await waitFor(() => expect(screen.queryByDisplayValue(name.split(", ")[1]!)).toBeNull());
    }
    const leiste = () => document.querySelector<HTMLElement>(".quittung-daumen")!;
    expect(leiste().textContent).toMatch(/^Entfernt: 2 Personen \(Berg, Eva; Stein, Paul\)/);
    await nutzer.click(within(leiste()).getByRole("button", { name: "Rückgängig" }));
    const vornamen = screen.getAllByLabelText("Vorname").map((f) => (f as HTMLInputElement).value);
    expect(vornamen).toEqual(["Paul", "Eva", "Sabine"]);
    expect(leiste().textContent).toMatch(/^Zurückgeholt: 2 Personen/);
  });

  it("bietet „+ Person hinzufügen“ auch über der Liste an, die neue Person bekommt den Cursor (R3-H6)", async () => {
    const nutzer = userEvent.setup();
    render(
      <SchrittBuehne
        komponente={SchrittPersonal}
        bogen={{ ...neuerBogen(), personal: [{ ...neuePerson(), vorname: "Paul", nachname: "Stein" }, { ...neuePerson(), vorname: "Eva", nachname: "Berg" }] }}
      />,
    );
    const oben = screen.getByRole("button", { name: "+ Person hinzufügen (springt zur neuen Person)" });
    // Oben, vor der ersten Karte.
    expect(oben.compareDocumentPosition(document.querySelector('[data-person-index="0"]')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await nutzer.click(oben);
    const vornamen = screen.getAllByLabelText("Vorname") as HTMLInputElement[];
    expect(vornamen).toHaveLength(3);
    await waitFor(() => expect(document.activeElement).toBe(vornamen[2]));
    await nutzer.keyboard("Jan");
    expect(vornamen[2]!.value).toBe("Jan");
  });

  // Audit Runde 5, R5-H3: Der untere Knopf sprang zur neuen Karte, ließ den Fokus aber auf sich.
  it("der „+ Person hinzufügen“ unter der Liste setzt den Cursor wie der obere in den Vornamen der neuen Karte (R5-H3)", async () => {
    const nutzer = userEvent.setup();
    render(
      <SchrittBuehne
        komponente={SchrittPersonal}
        bogen={{ ...neuerBogen(), personal: [{ ...neuePerson(), vorname: "Paul", nachname: "Stein" }, { ...neuePerson(), vorname: "Eva", nachname: "Berg" }] }}
      />,
    );
    const knoepfe = screen.getAllByRole("button", { name: /^\+ Person hinzufügen/ });
    const unten = knoepfe[knoepfe.length - 1]!;
    expect(unten.className).toContain("primaer");
    await nutzer.click(unten);
    const vornamen = screen.getAllByLabelText("Vorname") as HTMLInputElement[];
    expect(vornamen).toHaveLength(3);
    await waitFor(() => expect(document.activeElement).toBe(vornamen[2]));
  });

  // Audit Runde 5, R5-H2: 38 Personen als Karten waren 88 Bildschirme hoch.
  // Audit Runde 7, R7-H6: Neun Karten maßen 14 000 px, zwölf 18 700 — die Grenze sank von 13 auf 8 Personen.
  it("beginnt ab 8 Personen mit der Kurz-Liste, bei weniger mit den Karten samt Hinweis erst ab 8 (R5-H2, R7-H6)", () => {
    const viele = Array.from({ length: 8 }, (_, i) => ({ ...neuePerson(), vorname: `V${i}`, nachname: "Zug" }));
    const { unmount } = render(<SchrittBuehne komponente={SchrittPersonal} bogen={{ ...neuerBogen(), personal: viele }} />);
    expect((screen.getByLabelText("Kurz-Liste (Tabelle)") as HTMLInputElement).checked).toBe(true);
    expect(screen.getByRole("table")).toBeDefined();
    unmount();
    const sieben = viele.slice(0, 7);
    render(<SchrittBuehne komponente={SchrittPersonal} bogen={{ ...neuerBogen(), personal: sieben }} />);
    expect((screen.getByLabelText("Alle Angaben (Karten)") as HTMLInputElement).checked).toBe(true);
    expect(screen.queryByText(/Viele Personen — die Kurz-Liste/)).toBeNull();
  });

  it("die Karten nennen bei vielen Personen den kürzeren Weg (R5-H2)", async () => {
    const nutzer = userEvent.setup();
    const viele = Array.from({ length: 14 }, (_, i) => ({ ...neuePerson(), vorname: `V${i}`, nachname: "Zug" }));
    render(<SchrittBuehne komponente={SchrittPersonal} bogen={{ ...neuerBogen(), personal: viele }} />);
    await nutzer.click(screen.getByLabelText("Alle Angaben (Karten)"));
    expect(screen.getByText(/Viele Personen — die Kurz-Liste \(eine Zeile je Person\) zeigt mehr auf einmal/)).toBeDefined();
  });

  it("versteckt den Beispielnamen-Weg bei echten Bögen vollständig", async () => {
    const nutzer = userEvent.setup();
    buehne(); // frischer Bogen ohne Übungs-Flag

    await nutzer.click(screen.getByRole("button", { name: "Namen einfügen…" }));

    expect(screen.queryByRole("button", { name: "Beispielpersonen einfügen" })).toBeNull();
    expect(screen.queryByText("Beispielnamen (Übung)")).toBeNull();
  });
});

/**
 * Funktionen und Qualifikationen sind zu lang für ein <select> und müssen
 * trotzdem Freitext zulassen. Geprüft wird, welcher Weg was in den Bogen
 * schreibt — sichtbar am Chip: eine gewählte Funktion erscheint als Kurzform
 * (= Code aufgelöst), Freitext steht ausgeschrieben da.
 */
describe("Vorschlagsfelder für Funktion und Qualifikation", () => {
  const mitPerson = async (nutzer: ReturnType<typeof userEvent.setup>) => {
    buehne();
    await nutzer.click(screen.getByRole("button", { name: "+ Person hinzufügen" }));
  };

  it("trägt eine gewählte Funktion als Code ein — der Chip zeigt die Kurzform", async () => {
    const nutzer = userEvent.setup();
    await mitPerson(nutzer);

    await nutzer.type(screen.getByLabelText("Funktion hinzufügen"), "Ortsbeauftragte");
    // Die Vorschlagszeile führt Kurz- und Langform; geklickt wird die Langform.
    await nutzer.click(screen.getByText("Ortsbeauftragte/r"));

    expect(screen.getByRole("button", { name: "OB entfernen" })).toBeDefined();
  });

  it("findet auch Funktionen, die erst über die THW-Funktionsliste dazugekommen sind", async () => {
    const nutzer = userEvent.setup();
    await mitPerson(nutzer);

    // Schirrmeister/in fehlte in der Handredaktion und kommt aus der Ergänzung.
    await nutzer.type(screen.getByLabelText("Funktion hinzufügen"), "Schirrmeister");
    await nutzer.click(screen.getByText("Schirrmeister/in"));

    expect(screen.getByRole("button", { name: "SM entfernen" })).toBeDefined();
  });

  /**
   * Rückmeldung aus einem Ortsverband: „habe nur Kraftfahrer mit ADR gefunden".
   * Der reine Kraftfahrer steht absichtlich nicht in der Funktionsliste — die
   * Klasse gehört ins Feld Fahrerlaubnis. Das muss die Suche selbst sagen,
   * sonst bleibt der Bogen an der Stelle falsch oder leer.
   */
  it("weist bei der Suche nach „Kraftfahrer“ auf das Feld Fahrerlaubnis hin", async () => {
    const nutzer = userEvent.setup();
    await mitPerson(nutzer);

    const feld = screen.getByLabelText("Funktion hinzufügen");
    await nutzer.type(feld, "Kraftfahrer");
    // Die ADR-Zusätze bleiben als Treffer stehen — sie sind ja richtig hier.
    expect(screen.getByText("Kraftfahrer/in CE ADR Stückgut")).toBeDefined();
    expect(screen.getByRole("note").textContent).toMatch(/Feld „Fahrerlaubnis"/);

    // Bei jeder anderen Suche stört kein Hinweis.
    await nutzer.clear(feld);
    await nutzer.type(feld, "Zugführer");
    expect(screen.queryByRole("note")).toBeNull();
  });

  it("zeigt den Kraftfahrer-Hinweis auch für „Kf“, „Führerschein“ und „Lkw“, nicht aber für „Kfz“-fremde Kürzel", () => {
    expect(kraftfahrerHinweis("Kf")).toBeDefined();
    expect(kraftfahrerHinweis("kf b")).toBeDefined();
    expect(kraftfahrerHinweis("Führerschein CE")).toBeDefined();
    expect(kraftfahrerHinweis("LKW")).toBeDefined();
    expect(kraftfahrerHinweis("Fahrerlaubnis")).toBeDefined();
    expect(kraftfahrerHinweis("Zugführer")).toBeUndefined();
    expect(kraftfahrerHinweis("AGT")).toBeUndefined();
    expect(kraftfahrerHinweis("")).toBeUndefined();
  });

  it("übernimmt eine unbekannte Eingabe mit Enter als Freitext", async () => {
    const nutzer = userEvent.setup();
    await mitPerson(nutzer);

    await nutzer.type(screen.getByLabelText("Qualifikation hinzufügen"), "Kettensägenschein OV-intern{Enter}");

    expect(screen.getByRole("button", { name: "Kettensägenschein OV-intern entfernen" })).toBeDefined();
  });

  /**
   * Der eigentliche Grund für den Knopf: zeigt die Liste Treffer, nimmt Enter
   * den markierten Vorschlag. Ohne den Knopf gäbe es dann keinen Weg mehr zur
   * eigenen Schreibweise.
   */
  it("nimmt über „+ eigener Text“ die eigene Eingabe, obwohl die Liste Treffer zeigt", async () => {
    const nutzer = userEvent.setup();
    await mitPerson(nutzer);

    const feld = screen.getByLabelText("Funktion hinzufügen");
    await nutzer.type(feld, "Zugführer");
    expect(screen.getByText("Zugführer/in")).toBeDefined(); // Treffer liegt vor

    const zeile = feld.closest<HTMLElement>(".chips")!;
    await nutzer.click(within(zeile).getByRole("button", { name: "+ eigener Text" }));

    expect(screen.getByRole("button", { name: "Zugführer entfernen" })).toBeDefined();
  });

  /**
   * Rückmeldung aus einem THW-Ortsverband: Unter „Weitere Qualifikationen"
   * gehören nur Qualifikationen (THW: die aus THWin), die Berufe brauchen ein
   * eigenes Feld darunter. Der Chip zeigt den Beruf ohne Markierung; im Bogen
   * steht er mit dem Präfix „Beruf: " im selben Feld wie die Qualifikationen
   * (beruf.ts), damit das Transportformat unverändert bleibt.
   */
  it("schlägt im Berufsfeld Berufsbezeichnungen vor und trägt sie als Freitext ein", async () => {
    const nutzer = userEvent.setup();
    await mitPerson(nutzer);

    await nutzer.type(screen.getByLabelText("Beruf hinzufügen"), "Elektrotechnik");

    // Das Berufs-Vokabular wird nachgeladen — daher findBy statt getBy.
    await nutzer.click(await screen.findByText("Elektrotechnik"));

    expect(screen.getByRole("button", { name: "Elektrotechnik entfernen" })).toBeDefined();
  });

  it("hält die Berufe aus den Vorschlägen für Qualifikationen heraus", async () => {
    const nutzer = userEvent.setup();
    await mitPerson(nutzer);

    // Erst im Berufsfeld treffen: das beweist, dass die Berufsliste geladen ist.
    await nutzer.type(screen.getByLabelText("Beruf hinzufügen"), "Elektrotechnik");
    await screen.findByText("Elektrotechnik");

    await nutzer.type(screen.getByLabelText("Qualifikation hinzufügen"), "Elektrotechnik");
    const feld = screen.getByLabelText("Qualifikation hinzufügen");
    expect(within(feld.closest<HTMLElement>(".chips")!).queryByRole("listbox")).toBeNull();
  });

  it("speichert Beruf und Qualifikation getrennt kenntlich im selben Bogenfeld", async () => {
    const nutzer = userEvent.setup();
    const gesehen: Erfassungsbogen[] = [];
    render(<SchrittBuehne komponente={SchrittPersonal} beobachten={(b) => gesehen.push(b)} />);
    await nutzer.click(screen.getByRole("button", { name: "+ Person hinzufügen" }));

    await nutzer.type(screen.getByLabelText("Qualifikation hinzufügen"), "Sprechfunk digital{Enter}");
    await nutzer.type(screen.getByLabelText("Beruf hinzufügen"), "Dachdecker/in{Enter}");

    // Beide Chips — der Beruf ohne Präfix.
    expect(screen.getByRole("button", { name: "Sprechfunk digital entfernen" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Dachdecker/in entfernen" })).toBeDefined();
    expect(gesehen[gesehen.length - 1]!.personal[0]!.zusatzqualifikationen).toEqual([
      { freitext: "Sprechfunk digital" },
      { freitext: "Beruf: Dachdecker/in" },
    ]);

    // Den Beruf entfernen lässt die Qualifikation stehen — und umgekehrt.
    await nutzer.click(screen.getByRole("button", { name: "Dachdecker/in entfernen" }));
    expect(gesehen[gesehen.length - 1]!.personal[0]!.zusatzqualifikationen).toEqual([{ freitext: "Sprechfunk digital" }]);
  });

  it("zeigt einen gespeicherten Beruf im Berufsfeld, nicht bei den Qualifikationen", () => {
    const b = neuerBogen();
    b.personal = [
      { ...neuePerson(), vorname: "Erika", nachname: "Muster", zusatzqualifikationen: [{ freitext: "Beruf: Zimmerer/in" }, { freitext: "Motorsägenschein" }] },
    ];
    render(<SchrittBuehne komponente={SchrittPersonal} bogen={b} />);

    const beruf = screen.getByLabelText("Beruf hinzufügen").closest<HTMLElement>(".chips")!;
    const quali = screen.getByLabelText("Qualifikation hinzufügen").closest<HTMLElement>(".chips")!;
    expect(within(beruf).getByRole("button", { name: "Zimmerer/in entfernen" })).toBeDefined();
    expect(within(quali).getByRole("button", { name: "Motorsägenschein entfernen" })).toBeDefined();
    expect(within(quali).queryByRole("button", { name: /Zimmerer/ })).toBeNull();
  });

  /**
   * Bei der DLRG wird Personal über Ausbildungskennzahlen geführt („411, 715,
   * 831"). Die Zahl allein sagt einem fremden Meldekopf nichts, deshalb landet
   * Kennzahl UND Bezeichnung im Bogen; der Fachbereich bleibt Anzeige.
   */
  it("schlägt bei der DLRG die Ausbildungskennzahlen vor — Kennzahl und Bezeichnung landen im Bogen", async () => {
    const nutzer = userEvent.setup();
    render(<SchrittBuehne komponente={SchrittPersonal} bogen={dlrgBogen()} />);
    await nutzer.click(screen.getByRole("button", { name: "+ Person hinzufügen" }));

    await nutzer.type(screen.getByLabelText("Qualifikation hinzufügen"), "411");
    // Die DLRG-Liste wird nachgeladen — daher findBy statt getBy.
    await nutzer.click(await screen.findByText("411 Wasserretter (Fachausbildung Wasserrettungsdienst)"));

    expect(
      screen.getByRole("button", { name: "411 Wasserretter (Fachausbildung Wasserrettungsdienst) entfernen" }),
    ).toBeDefined();
  });

  it("findet DLRG-Qualifikationen auch über den Fachbereich, der nur in der Liste steht", async () => {
    const nutzer = userEvent.setup();
    render(<SchrittBuehne komponente={SchrittPersonal} bogen={dlrgBogen()} />);
    await nutzer.click(screen.getByRole("button", { name: "+ Person hinzufügen" }));

    // „Tauchen" kommt in keiner der Bezeichnungen vor, nur im Fachbereich.
    await nutzer.type(screen.getByLabelText("Qualifikation hinzufügen"), "Tauchen");
    await nutzer.click(await screen.findByText("612 Einsatztaucher Stufe 1"));

    expect(screen.getByRole("button", { name: "612 Einsatztaucher Stufe 1 entfernen" })).toBeDefined();
  });

  it("hält die DLRG-Kennzahlen aus den Vorschlägen anderer Organisationen heraus", async () => {
    const nutzer = userEvent.setup();
    await mitPerson(nutzer); // frischer Bogen = THW

    // Erst im Berufsfeld treffen: das beweist, dass nachgeladene Vorschläge
    // ankommen — sonst prüft der Test nur, dass noch gar nichts da ist.
    await nutzer.type(screen.getByLabelText("Beruf hinzufügen"), "Elektrotechnik");
    await screen.findByText("Elektrotechnik");

    await nutzer.type(screen.getByLabelText("Qualifikation hinzufügen"), "Wasserretter");

    expect(screen.queryByText(/^411 /)).toBeNull();
  });

  it("zeigt im leeren Qualifikationsfeld keine Vorschläge", async () => {
    const nutzer = userEvent.setup();
    await mitPerson(nutzer);

    await nutzer.click(screen.getByLabelText("Qualifikation hinzufügen"));

    expect(document.querySelector("ul.vorschlaege")).toBeNull();
  });

  /**
   * Audit Runde 2, R2-G5: Das Funktionsfeld zeigte beim Antippen nichts —
   * jede Funktion hieß Tastatur auf, Buchstabe tippen, Vorschlag wählen. Jetzt
   * bietet das leere Feld die häufigsten Funktionen der Einheit an (StAN,
   * schon Vergebenes, beim THW Sprechfunk & Co.); eine Funktion lässt sich
   * mit zwei Tipps zuweisen.
   */
  it("bietet im leeren Funktionsfeld die häufigsten Funktionen der Einheit zum Antippen an", async () => {
    const nutzer = userEvent.setup();
    const einheitsTyp = { code: 4 }; // B – Bergungsgruppe: GrFü, TrFü, 7 Helfer
    const bogen = neuerBogen();
    render(
      <SchrittBuehne
        komponente={SchrittPersonal}
        bogen={{ ...bogen, einheit: { ...bogen.einheit, einheitsTyp }, personal: [neuePerson()] }}
      />,
    );

    await nutzer.click(screen.getByLabelText("Funktion hinzufügen"));
    const liste = screen.getByRole("listbox");
    const zeilen = within(liste).getAllByRole("option").map((z) => z.textContent);
    expect(zeilen).toEqual([
      "HeFachhelfer/in",
      "GrFüGruppenführer/in",
      "TrFüTruppführer/in",
      "SprSprechfunker/in",
      "SanHeSanitätshelfer/in",
      "AGTAtemschutzgeräteträger/in",
    ]);

    await nutzer.click(within(liste).getByText("Spr"));
    expect(screen.getByRole("button", { name: "Spr entfernen" })).toBeDefined();

    // Schon Vergebenes fällt aus dem Angebot.
    await nutzer.click(screen.getByLabelText("Funktion hinzufügen"));
    expect(within(screen.getByRole("listbox")).queryByText("Spr")).toBeNull();
  });
});

/**
 * Vorlesesoftware erfährt von einer selbstgebauten Vorschlagsliste nur über die
 * ARIA-Rollen: ohne sie ist sie ein beliebiges <ul> im Dokument. Geprüft wird
 * das Muster „Combobox mit Listen-Autovervollständigung" an einem der Felder —
 * alle drei (Ortsverband, Funktion, Qualifikation) teilen die Komponente.
 */
describe("Vorschlagsfeld für Vorlesesoftware", () => {
  const feldMitTreffern = async (nutzer: ReturnType<typeof userEvent.setup>) => {
    buehne();
    await nutzer.click(screen.getByRole("button", { name: "+ Person hinzufügen" }));
    // Nach Rolle, nicht nach Label: dass es eine Combobox ist, ist Teil der Zusicherung.
    const feld = screen.getByRole("combobox", { name: "Funktion hinzufügen" });
    expect(feld.getAttribute("aria-expanded")).toBe("false");
    await nutzer.type(feld, "Gruppenführer");
    return feld;
  };

  it("meldet die aufgeklappte Liste und verweist auf sie", async () => {
    const nutzer = userEvent.setup();
    const feld = await feldMitTreffern(nutzer);

    expect(feld.getAttribute("aria-expanded")).toBe("true");
    expect(feld.getAttribute("aria-autocomplete")).toBe("list");

    const liste = screen.getByRole("listbox");
    expect(feld.getAttribute("aria-controls")).toBe(liste.id);
    expect(liste.id).not.toBe("");
  });

  /**
   * Der Fokus bleibt beim Tippen im Feld; welche Zeile Enter nehmen würde,
   * transportiert allein aria-activedescendant.
   */
  /**
   * Immer über die Listbox suchen, nie über `screen`: die nativen
   * Auswahllisten der Karte (Stärkerolle, Geschlecht, …) bringen selbst
   * `<option>`-Elemente mit, die dieselbe Rolle tragen.
   */
  const zeilenVon = () => within(screen.getByRole("listbox")).getAllByRole("option");

  it("benennt die markierte Zeile und lässt sie mit der Pfeiltaste wandern", async () => {
    const nutzer = userEvent.setup();
    const feld = await feldMitTreffern(nutzer);

    const zeilen = zeilenVon();
    expect(zeilen.length).toBeGreaterThan(1);
    expect(feld.getAttribute("aria-activedescendant")).toBe(zeilen[0]!.id);
    expect(zeilen[0]!.getAttribute("aria-selected")).toBe("true");
    expect(zeilen[1]!.getAttribute("aria-selected")).toBe("false");

    await nutzer.keyboard("{ArrowDown}");

    expect(feld.getAttribute("aria-activedescendant")).toBe(zeilenVon()[1]!.id);
    expect(zeilenVon()[1]!.getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(feld); // Fokus bleibt im Feld
  });

  it("nennt die Trefferzahl, die sonst nicht ankommt", async () => {
    const nutzer = userEvent.setup();
    const feld = await feldMitTreffern(nutzer);

    // Die Seite hat mehrere Statusbereiche (Stärke, Hinweise, das zweite
    // Vorschlagsfeld) — gemeint ist der zu diesem Feld.
    const umgebung = within(feld.closest<HTMLElement>(".autocomplete")!);
    expect(umgebung.getByRole("status").textContent).toBe(`${zeilenVon().length} Vorschläge`);
  });

  /**
   * Ein aria-controls auf ein Element, das gar nicht im Dokument steht, ist ein
   * Fehler (axe: aria-valid-attr-value) — bei geschlossener Liste muss es weg.
   */
  it("lässt keine Verweise ins Leere, wenn die Liste zu ist", async () => {
    const nutzer = userEvent.setup();
    const feld = await feldMitTreffern(nutzer);

    await nutzer.keyboard("{Escape}");

    expect(screen.queryByRole("listbox")).toBeNull();
    expect(feld.getAttribute("aria-expanded")).toBe("false");
    expect(feld.getAttribute("aria-controls")).toBeNull();
    expect(feld.getAttribute("aria-activedescendant")).toBeNull();
  });

  it("holt die Liste nach Escape mit der Pfeiltaste zurück, ohne neu zu tippen", async () => {
    const nutzer = userEvent.setup();
    const feld = await feldMitTreffern(nutzer);
    await nutzer.keyboard("{Escape}");

    await nutzer.keyboard("{ArrowDown}");

    expect(feld.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("listbox")).toBeDefined();
  });
});

/**
 * Die Reihenfolge der Personalliste ist im Bogen Inhalt: die erste Person
 * steht im PDF als Ansprechpartner/in. Wer eine Vertretung erfasst, legt sie
 * am Ende an — sie muss nach oben zu bekommen sein, ohne die ganze Liste neu
 * zu tippen (Issue #23).
 */
describe("Personal umsortieren", () => {
  const drei = () => {
    const b = neuerBogen();
    return {
      ...b,
      personal: [
        { ...neuePerson(), vorname: "Anna", nachname: "Albers" },
        { ...neuePerson(), vorname: "Bernd", nachname: "Bruns" },
        { ...neuePerson(), vorname: "Carla", nachname: "Claus" },
      ],
    };
  };

  /** Vornamen in Listenreihenfolge — in beiden Ansichten die ersten Textfelder. */
  const vornamen = () =>
    (screen.getAllByLabelText("Vorname") as HTMLInputElement[]).map((f) => f.value);

  it("hebt eine Person in den Detail-Karten um einen Platz", async () => {
    const nutzer = userEvent.setup();
    render(<SchrittBuehne komponente={SchrittPersonal} bogen={drei()} />);

    await nutzer.click(screen.getByRole("button", { name: "Person 3 nach oben" }));

    expect(vornamen()).toEqual(["Anna", "Carla", "Bernd"]);
  });

  it("setzt die zuletzt angelegte Person mit einem Griff an die erste Stelle", async () => {
    const nutzer = userEvent.setup();
    render(<SchrittBuehne komponente={SchrittPersonal} bogen={drei()} />);

    await nutzer.click(screen.getByRole("button", { name: "Person 3 an die erste Stelle" }));

    expect(vornamen()).toEqual(["Carla", "Anna", "Bernd"]);
    // Die Marke sitzt an der Karte, die jetzt oben steht.
    const oberste = screen.getAllByLabelText("Vorname")[0]!.closest(".karte")!;
    expect(within(oberste as HTMLElement).getByText("Erreichbar für Rückfragen")).toBeDefined();
    expect(screen.getAllByText("Erreichbar für Rückfragen")).toHaveLength(1);
  });

  // Audit Runde 5, R5-G4: „⇑“ stand in der ersten Zeile nicht da, und „▼“ lag an seiner Stelle.
  it("lässt „▲“, „▼“ und „⇑“ in jeder Zeile an derselben Stelle: in der ersten ist „⇑“ gesperrt statt weggelassen (R5-G4)", async () => {
    const nutzer = userEvent.setup();
    render(<SchrittBuehne komponente={SchrittPersonal} bogen={drei()} />);
    await nutzer.click(screen.getByLabelText("Kurz-Liste (Tabelle)"));
    const reihe = (i: number) => within(screen.getByRole("table")).getAllByRole("row")[i + 1]!;
    const namen = (i: number) => within(reihe(i)).getAllByRole("button").map((b) => b.getAttribute("aria-label")!.replace(/^Person \d+ /, ""));
    expect(namen(0).slice(0, 3)).toEqual(["nach oben", "nach unten", "an die erste Stelle"]);
    expect(namen(1).slice(0, 3)).toEqual(["nach oben", "nach unten", "an die erste Stelle"]);
    expect(namen(2).slice(0, 3)).toEqual(["nach oben", "nach unten", "an die erste Stelle"]);
    expect((within(reihe(0)).getByRole("button", { name: "Person 1 an die erste Stelle" }) as HTMLButtonElement).disabled).toBe(true);
    expect((within(reihe(0)).getByRole("button", { name: "Person 1 nach oben" }) as HTMLButtonElement).disabled).toBe(true);
    expect((within(reihe(2)).getByRole("button", { name: "Person 3 nach unten" }) as HTMLButtonElement).disabled).toBe(true);
    // Ein gesperrtes „⇑“ tut nichts.
    await nutzer.click(within(reihe(0)).getByRole("button", { name: "Person 1 an die erste Stelle" }));
    expect((within(screen.getByRole("table")).getAllByRole("textbox", { name: /Vorname|Nachname/ }) as HTMLInputElement[]).map((f) => f.value).slice(0, 2)).toEqual(["Anna", "Albers"]);
  });

  // Audit Runde 5, R5-M5: Die Felder einer neuen Person zeigten keine Bezeichnung.
  it("trägt in den Feldern der Kurz-Liste die Bezeichnung als Platzhalter (R5-M5)", async () => {
    const nutzer = userEvent.setup();
    render(<SchrittBuehne komponente={SchrittPersonal} bogen={drei()} />);
    await nutzer.click(screen.getByLabelText("Kurz-Liste (Tabelle)"));
    expect(screen.getByLabelText("Person 1: Vorname").getAttribute("placeholder")).toBe("Vorname");
    expect(screen.getByLabelText("Person 1: Nachname").getAttribute("placeholder")).toBe("Nachname");
  });

  it("sortiert auch in der Schnelleingabe-Tabelle", async () => {
    const nutzer = userEvent.setup();
    render(<SchrittBuehne komponente={SchrittPersonal} bogen={drei()} />);
    await nutzer.click(screen.getByLabelText("Kurz-Liste (Tabelle)"));

    await nutzer.click(screen.getByRole("button", { name: "Person 1 nach unten" }));

    const werte = (within(screen.getByRole("table")).getAllByRole("textbox", { name: /Vorname|Nachname/ }) as HTMLInputElement[]).map((f) => f.value);
    expect(werte).toEqual(["Bernd", "Bruns", "Anna", "Albers", "Carla", "Claus"]);
  });

  /**
   * Zweimal „nach oben" muss dieselbe Person zweimal heben. Bliebe der Fokus
   * auf der Stelle, hätte der zweite Klick die nachgerückte Nachbarperson
   * erwischt — der Fokus wandert deshalb mit.
   */
  it("lässt den Fokus mit der verschobenen Person wandern", async () => {
    const nutzer = userEvent.setup();
    render(<SchrittBuehne komponente={SchrittPersonal} bogen={drei()} />);

    await nutzer.click(screen.getByRole("button", { name: "Person 3 nach oben" }));
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Person 2 nach oben" }));

    await nutzer.keyboard("{Enter}");

    expect(vornamen()).toEqual(["Carla", "Anna", "Bernd"]);
    // Oben angekommen ist der Hoch-Knopf gesperrt: der Fokus fällt auf den
    // Nachbarn derselben Person statt auf den Seitenanfang.
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Person 1 nach unten" }));
  });

  it("zeigt bei einer einzigen Person keine Sortierknöpfe", async () => {
    const nutzer = userEvent.setup();
    buehne();

    await nutzer.click(screen.getByRole("button", { name: "+ Person hinzufügen" }));

    expect(screen.queryByRole("button", { name: /nach oben$/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /nach unten$/ })).toBeNull();
  });
});

/**
 * Die Schnelleingabe-Tabelle löschte ohne Rückfrage — in der Karte fragte
 * derselbe Vorgang mit Namen nach. Hier wiegt es mehr: Qualifikationen und
 * Erreichbarkeiten sieht man in der Tabelle gar nicht, und der Knopf liegt
 * am rechten Rand neben den Sortierpfeilen.
 */
describe("Schnelleingabe-Tabelle — Person entfernen", () => {
  const mitJan = () => ({ ...neuerBogen(), personal: [{ ...neuePerson(), vorname: "Jan", nachname: "Meyer" }, neuePerson()] });

  it("fragt in der Tabelle vor dem Entfernen einer ausgefüllten Person nach", async () => {
    const nutzer = userEvent.setup();
    render(<SchrittBuehne komponente={SchrittPersonal} bogen={mitJan()} />);
    await nutzer.click(screen.getByLabelText("Kurz-Liste (Tabelle)"));

    await nutzer.click(screen.getByRole("button", { name: "Meyer, Jan entfernen" }));

    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Meyer, Jan entfernen?']")!;
    expect(dialog).not.toBeNull();
    await nutzer.click(within(dialog).getByRole("button", { name: "Abbrechen" }));
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(3);

    await nutzer.click(screen.getByRole("button", { name: "Meyer, Jan entfernen" }));
    const zweiter = document.querySelector<HTMLDialogElement>("dialog[aria-label='Meyer, Jan entfernen?']")!;
    await nutzer.click(within(zweiter).getByRole("button", { name: "Person entfernen" }));
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(2);
  });

  it("entfernt eine leere Zeile ohne Rückfrage", async () => {
    const nutzer = userEvent.setup();
    render(<SchrittBuehne komponente={SchrittPersonal} bogen={mitJan()} />);
    await nutzer.click(screen.getByLabelText("Kurz-Liste (Tabelle)"));

    await nutzer.click(screen.getByRole("button", { name: "Person 2 entfernen" }));

    expect(document.querySelector("dialog.abfrage")).toBeNull();
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(2);
  });
});

/**
 * „Nur Stärke" setzte bei vier erfassten Personen die gemeldete Stärke auf
 * 0/0/0/0, während die Karten darunter stehen blieben — der Bogen ging so an
 * den Meldekopf. Jetzt startet die manuelle Stärke mit der abgeleiteten, und
 * bei vorhandenem Personal wird vorher gefragt.
 */
describe("Umschalten auf „Nur Stärke“", () => {
  const vier = () => ({
    ...neuerBogen(),
    personal: [
      { ...neuePerson(), vorname: "Anna", nachname: "Albers", staerkeRolle: StaerkeRolle.FUEHRER, ernaehrung: Ernaehrung.VEGETARISCH },
      { ...neuePerson(), vorname: "Bernd", nachname: "Bruns", staerkeRolle: StaerkeRolle.UNTERFUEHRER, geschlecht: Geschlecht.W },
      { ...neuePerson(), vorname: "Carla", nachname: "Claus" },
      { ...neuePerson(), vorname: "Dirk", nachname: "Dahl" },
    ],
  });

  it("fragt bei erfasstem Personal nach und bleibt bei Abbruch in der Vollerfassung", async () => {
    const nutzer = userEvent.setup();
    render(<SchrittBuehne komponente={SchrittPersonal} bogen={vier()} />);

    await nutzer.click(screen.getByLabelText("Nur Stärke (Meldekopf-Schnellerfassung)"));

    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Nur die Stärke melden?']")!;
    expect(dialog).not.toBeNull();
    expect(dialog.textContent).toContain("4 erfasste Personen zählen dann nicht mehr");
    await nutzer.click(within(dialog).getByRole("button", { name: "Abbrechen" }));

    expect((screen.getByLabelText("Personal vollständig erfassen") as HTMLInputElement).checked).toBe(true);
    expect(screen.getByLabelText("Stärke: 1 Führer, 1 Unterführer, 2 Mannschaft, 4 gesamt")).toBeDefined();
  });

  it("legt den Fokus der Rückfrage auf „Abbrechen“ (R8-H2)", async () => {
    const nutzer = userEvent.setup();
    render(<SchrittBuehne komponente={SchrittPersonal} bogen={vier()} />);
    await nutzer.click(screen.getByLabelText("Nur Stärke (Meldekopf-Schnellerfassung)"));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Nur die Stärke melden?']")!;
    expect(document.activeElement).toBe(within(dialog).getByRole("button", { name: "Abbrechen" }));
  });

  it("belegt Stärke, Unterbringung und Verpflegung mit den abgeleiteten Zahlen vor und kennzeichnet die Karten als nicht gezählt", async () => {
    const nutzer = userEvent.setup();
    render(<SchrittBuehne komponente={SchrittPersonal} bogen={vier()} />);

    await nutzer.click(screen.getByLabelText("Nur Stärke (Meldekopf-Schnellerfassung)"));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Nur die Stärke melden?']")!;
    await nutzer.click(within(dialog).getByRole("button", { name: "Nur Stärke melden" }));

    expect((screen.getByLabelText("Führer") as HTMLInputElement).value).toBe("1");
    expect((screen.getByLabelText("Unterführer") as HTMLInputElement).value).toBe("1");
    expect((screen.getByLabelText("Mannschaft") as HTMLInputElement).value).toBe("2");
    expect((screen.getByLabelText("Gesamt") as HTMLInputElement).value).toBe("4");
    expect((screen.getByLabelText("weiblich") as HTMLInputElement).value).toBe("1");
    expect((screen.getByLabelText("vegetarisch") as HTMLInputElement).value).toBe("1");
    expect(screen.getByText(/1 von 4 vegetarisch\/vegan/)).toBeDefined();
    // Die Namen bleiben — als nicht gezählte Erreichbarkeiten.
    expect(screen.getAllByLabelText("Vorname")).toHaveLength(4);
    expect(screen.getByText("Person 1 von 4 · nicht gezählt")).toBeDefined();
    expect(screen.getByText(/die 4 Personen hier werden nicht dazugerechnet/)).toBeDefined();
  });

  it("nennt bei Sollplätzen ohne Namen Plätze statt „erfasster Personen“ (R10-N1, R10-H4)", async () => {
    const nutzer = userEvent.setup();
    const b = neuerBogen();
    b.personal = [
      { ...neuePerson(), staerkeRolle: StaerkeRolle.FUEHRER, funktionen: [{ code: 1 }] },
      ...Array.from({ length: 4 }, () => neuePerson()),
    ];
    render(<SchrittBuehne komponente={SchrittPersonal} bogen={b} />);
    await nutzer.click(screen.getByLabelText("Nur Stärke (Meldekopf-Schnellerfassung)"));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Nur die Stärke melden?']")!;
    expect(dialog.textContent).toContain("Keine Person mit Namen, nur 5 vorbelegte Plätze");
    expect(dialog.textContent).not.toContain("erfasste Person");
    await nutzer.click(within(dialog).getByRole("button", { name: "Nur Stärke melden" }));
    expect(screen.getByText(/Diese 5 Karten sind vorbelegte Plätze nach Einheitstyp ohne Namen/)).toBeDefined();
    // Der Weg, die Plätze loszuwerden, steht direkt am Hinweis — einmal (R13-N2).
    expect(screen.getAllByRole("button", { name: "Vorbelegung entfernen (5 Personen ohne Namen)" })).toHaveLength(1);
  });

  it("fragt vor „Personal vollständig erfassen“ nach eingetragenen Zahlen und bietet „Rückgängig“ (R10-E1)", async () => {
    const nutzer = userEvent.setup();
    buehne();
    await nutzer.click(screen.getByLabelText("Nur Stärke (Meldekopf-Schnellerfassung)"));
    const mannschaft = screen.getByLabelText("Mannschaft") as HTMLInputElement;
    await nutzer.clear(mannschaft);
    await nutzer.type(mannschaft, "13");
    expect((screen.getByLabelText("Gesamt") as HTMLInputElement).value).toBe("13");

    // Abbrechen: alles bleibt.
    await nutzer.click(screen.getByLabelText("Personal vollständig erfassen"));
    let dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Eingetragene Zahlen verwerfen?']")!;
    expect(dialog.textContent).toContain("Stärke 0 / 0 / 13 / 13");
    expect(document.activeElement).toBe(within(dialog).getByRole("button", { name: "Zahlen behalten" }));
    await nutzer.click(within(dialog).getByRole("button", { name: "Zahlen behalten" }));
    expect((screen.getByLabelText("Nur Stärke (Meldekopf-Schnellerfassung)") as HTMLInputElement).checked).toBe(true);
    expect((screen.getByLabelText("Gesamt") as HTMLInputElement).value).toBe("13");

    // Verwerfen, dann Rückgängig.
    await nutzer.click(screen.getByLabelText("Personal vollständig erfassen"));
    dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Eingetragene Zahlen verwerfen?']")!;
    await nutzer.click(within(dialog).getByRole("button", { name: "Zahlen verwerfen" }));
    expect((screen.getByLabelText("Personal vollständig erfassen") as HTMLInputElement).checked).toBe(true);
    await nutzer.click(await screen.findByRole("button", { name: /Rückgängig/ }));
    expect((screen.getByLabelText("Nur Stärke (Meldekopf-Schnellerfassung)") as HTMLInputElement).checked).toBe(true);
    expect((screen.getByLabelText("Gesamt") as HTMLInputElement).value).toBe("13");
  });

  it("schaltet ohne eigene Zahlen ohne Rückfrage auf „Personal vollständig erfassen“ (R10-E1)", async () => {
    const nutzer = userEvent.setup();
    buehne();
    await nutzer.click(screen.getByLabelText("Nur Stärke (Meldekopf-Schnellerfassung)"));
    await nutzer.click(screen.getByLabelText("Personal vollständig erfassen"));
    expect(document.querySelector("dialog.abfrage")).toBeNull();
    expect((screen.getByLabelText("Personal vollständig erfassen") as HTMLInputElement).checked).toBe(true);
  });

  it("fragt vor „Liste leeren“ bei einer längeren eingefügten Liste (R10-D3)", async () => {
    const nutzer = userEvent.setup();
    buehne();
    await nutzer.click(screen.getByRole("button", { name: /Namen einfügen/ }));
    const feld = document.querySelector<HTMLTextAreaElement>("dialog textarea")!;
    fireEvent.change(feld, { target: { value: "Anna Albers\nBernd Bruns\nCarla Claus\nDirk Dahl\nEva Ernst" } });
    await nutzer.click(screen.getByRole("button", { name: "Liste leeren" }));
    const frage = document.querySelector<HTMLDialogElement>("dialog[aria-label='5 Zeilen verwerfen?']")!;
    expect(frage).not.toBeNull();
    await nutzer.click(within(frage).getByRole("button", { name: "Liste behalten" }));
    expect(feld.value).toContain("Eva Ernst");
    await nutzer.click(screen.getByRole("button", { name: "Liste leeren" }));
    await nutzer.click(within(document.querySelector<HTMLDialogElement>("dialog[aria-label='5 Zeilen verwerfen?']")!).getByRole("button", { name: "Liste leeren" }));
    await waitFor(() => expect(feld.value).toBe(""));
  });

  it("schaltet ohne Personal ohne Rückfrage um", async () => {
    const nutzer = userEvent.setup();
    buehne();

    await nutzer.click(screen.getByLabelText("Nur Stärke (Meldekopf-Schnellerfassung)"));

    expect(document.querySelector("dialog.abfrage")).toBeNull();
    expect((screen.getByLabelText("Gesamt") as HTMLInputElement).value).toBe("0");
  });

  /** „1 von 0 vegetarisch" war ein Bruch, keine Auskunft — der Widerspruch wird benannt. */
  it("nennt einen Widerspruch zwischen Verpflegung und Gesamtstärke statt „1 von 0“", async () => {
    const nutzer = userEvent.setup();
    buehne();
    await nutzer.click(screen.getByLabelText("Nur Stärke (Meldekopf-Schnellerfassung)"));

    await nutzer.click(screen.getByRole("button", { name: "vegetarisch: erhöhen" }));

    expect(screen.queryByText(/1 von 0/)).toBeNull();
    expect(screen.getByText(/1 vegetarisch\/vegan — mehr als die Gesamtstärke 0/)).toBeDefined();
  });
});

/** Rückfrage-Regel an der Erreichbarkeit: die Rufnummer ist, worüber der Meldekopf zurückruft. */
describe("Erreichbarkeit entfernen", () => {
  const mitNummer = () => ({
    ...neuerBogen(),
    personal: [
      {
        ...neuePerson(),
        vorname: "Sabine",
        nachname: "Lang",
        kontakte: [
          { art: KontaktArt.MOBIL, dienstlich: true, wert: "01701234567" },
          { art: KontaktArt.MOBIL, dienstlich: false, wert: "" },
        ],
      },
    ],
  });

  it("fragt vor dem Entfernen einer Nummer nach und nennt sie", async () => {
    const nutzer = userEvent.setup();
    render(<SchrittBuehne komponente={SchrittPersonal} bogen={mitNummer()} />);

    await nutzer.click(screen.getByRole("button", { name: "Erreichbarkeit 01701234567 entfernen" }));

    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Erreichbarkeit 01701234567 entfernen?']")!;
    expect(dialog).not.toBeNull();
    await nutzer.click(within(dialog).getByRole("button", { name: "Abbrechen" }));
    expect(screen.getByRole("button", { name: "Erreichbarkeit 01701234567 entfernen" })).toBeDefined();

    await nutzer.click(screen.getByRole("button", { name: "Erreichbarkeit 01701234567 entfernen" }));
    const zweiter = document.querySelector<HTMLDialogElement>("dialog[aria-label='Erreichbarkeit 01701234567 entfernen?']")!;
    await nutzer.click(within(zweiter).getByRole("button", { name: "Erreichbarkeit entfernen" }));
    expect(screen.queryByRole("button", { name: "Erreichbarkeit 01701234567 entfernen" })).toBeNull();
  });

  it("entfernt eine leere Erreichbarkeit ohne Rückfrage", async () => {
    const nutzer = userEvent.setup();
    render(<SchrittBuehne komponente={SchrittPersonal} bogen={mitNummer()} />);

    await nutzer.click(screen.getByRole("button", { name: "Erreichbarkeit 2 (leer) entfernen" }));

    expect(document.querySelector("dialog.abfrage")).toBeNull();
    expect(screen.queryByRole("button", { name: "Erreichbarkeit 2 (leer) entfernen" })).toBeNull();
  });
});

/**
 * Die Vorbelegung aus Schritt 1 (StAN-Sollplätze) muss sich auf Schritt 3
 * wieder loswerden lassen, ohne 13-mal „entfernen" — und ohne die Karten zu
 * treffen, die schon jemand ausgefüllt hat.
 */
/**
 * Audit Runde 4, R4-H4: Eine neue Person war ungefragt „M“ und „Fleisch“; die
 * Vorgabe sah wie eine Angabe aus und floss in Unterbringung und Verpflegung.
 */
describe("Neue Person: Vorgaben sichtbar als „bitte wählen“ (R4-H4)", () => {
  it("kennzeichnet Geschlecht und Ernährung, bis die Auswahl berührt wird — auch nach dem Tippen des Namens", async () => {
    const nutzer = userEvent.setup();
    buehne();
    await nutzer.click(screen.getByRole("button", { name: "+ Person hinzufügen" }));

    const geschlecht = screen.getByRole("combobox", { name: "Geschlecht" });
    const ernaehrung = screen.getByRole("combobox", { name: "Ernährung" });
    expect(geschlecht.className).toContain("vorgabe-offen");
    expect(ernaehrung.className).toContain("vorgabe-offen");
    expect(document.querySelector(".vorgabe-hinweis")!.textContent).toMatch(/^Geschlecht und Ernährung sind nur vorbelegt \(M, Fleisch\) — bitte wählen\./);

    // Namen tippen berührt die Vorgaben nicht.
    await nutzer.type(screen.getByLabelText("Vorname"), "Anna");
    expect(screen.getByRole("combobox", { name: "Geschlecht" }).className).toContain("vorgabe-offen");

    await nutzer.selectOptions(screen.getByRole("combobox", { name: "Geschlecht" }), String(Geschlecht.W));
    expect(screen.getByRole("combobox", { name: "Geschlecht" }).className).not.toContain("vorgabe-offen");
    expect(screen.getByRole("combobox", { name: "Ernährung" }).className).toContain("vorgabe-offen");
    expect(document.querySelector(".vorgabe-hinweis")!.textContent).toMatch(/^Ernährung ist nur vorbelegt \(Fleisch\) — bitte wählen\./);

    await nutzer.click(screen.getByRole("combobox", { name: "Ernährung" }));
    expect(document.querySelector(".vorgabe-hinweis")).toBeNull();
  });

  it("kennzeichnet bestehende Personen nicht", () => {
    render(<SchrittBuehne komponente={SchrittPersonal} bogen={{ ...neuerBogen(), personal: [{ ...neuePerson(), vorname: "Jan", nachname: "Meyer" }] }} />);
    expect(document.querySelector(".vorgabe-offen")).toBeNull();
    expect(document.querySelector(".vorgabe-hinweis")).toBeNull();
  });
});

describe("Dienststelle je Person (Hoya: Helfer aus mehreren OVs)", () => {
  function hoyaBogen() {
    const b = neuerBogen();
    b.einheit.hierarchie[0]!.name = "Hoya";
    b.personal = [{ ...neuePerson(), vorname: "Jan", nachname: "Meyer" }];
    return b;
  }

  it("belegt das Feld mit der Dienststelle der Einheit vor und speichert nur die Abweichung", async () => {
    const nutzer = userEvent.setup();
    render(<SchrittBuehne komponente={SchrittPersonal} bogen={hoyaBogen()} />);
    const feld = screen.getByLabelText("Dienststelle") as HTMLInputElement;
    expect(feld.value).toBe("Hoya");
    expect(screen.getByText(/wie die Einheit — nur ändern/)).toBeDefined();

    await nutzer.clear(feld);
    await nutzer.type(feld, "Nienburg");
    expect(feld.value).toBe("Nienburg");
    expect(screen.getByText("abweichend von der Einheit (Hoya)")).toBeDefined();

    // Zurück auf die Dienststelle der Einheit: keine Abweichung mehr.
    await nutzer.clear(feld);
    await nutzer.type(feld, "Hoya");
    await nutzer.tab();
    expect(feld.value).toBe("Hoya");
    expect(screen.getByText(/wie die Einheit — nur ändern/)).toBeDefined();
  });

  it("zeigt eine gespeicherte Abweichung und lässt ein geleertes Feld auf die Vorbelegung zurückfallen", async () => {
    const nutzer = userEvent.setup();
    const b = hoyaBogen();
    b.personal[0]!.dienststelle = "Nienburg";
    render(<SchrittBuehne komponente={SchrittPersonal} bogen={b} />);
    const feld = screen.getByLabelText("Dienststelle") as HTMLInputElement;
    expect(feld.value).toBe("Nienburg");
    await nutzer.clear(feld);
    expect(feld.value).toBe(""); // während des Tippens bleibt das Feld leer …
    await nutzer.tab();
    expect(feld.value).toBe("Hoya"); // … danach gilt wieder die Einheit
  });

  it("schlägt beim THW die Ortsverbände vor und übernimmt den gewählten Namen", async () => {
    const nutzer = userEvent.setup();
    render(<SchrittBuehne komponente={SchrittPersonal} bogen={hoyaBogen()} />);
    const feld = screen.getByLabelText("Dienststelle") as HTMLInputElement;
    await nutzer.clear(feld);
    await nutzer.type(feld, "Nienb");
    await nutzer.click(await screen.findByRole("option", { name: /Nienburg/ }));
    expect(feld.value).toBe("Nienburg");
    expect(screen.getByText("abweichend von der Einheit (Hoya)")).toBeDefined();
  });

  it("führt die Spalte auch in der Schnelleingabe und lässt Enter im Nachnamen weiter zur nächsten Zeile", async () => {
    const nutzer = userEvent.setup();
    render(<SchrittBuehne komponente={SchrittPersonal} bogen={hoyaBogen()} />);
    await nutzer.click(screen.getByLabelText("Kurz-Liste (Tabelle)"));
    const tabelle = screen.getByRole("table");
    const dienststelle = within(tabelle).getByLabelText("Person 1: Dienststelle") as HTMLInputElement;
    expect(dienststelle.placeholder).toBe("Hoya");
    await nutzer.type(dienststelle, "Verden");
    expect(dienststelle.value).toBe("Verden");
    const nachname = within(tabelle).getByLabelText("Person 1: Nachname");
    await nutzer.click(nachname);
    await nutzer.keyboard("{Enter}");
    expect(within(tabelle).getAllByRole("row")).toHaveLength(3); // Kopf + 2 Personen
  });
});

describe("Vorbelegung entfernen (Schritt 3)", () => {
  it("entfernt nur die Karten ohne Namen und Erreichbarkeit", async () => {
    const nutzer = userEvent.setup();
    const einheitsTyp = { code: 4 };
    const bogen = neuerBogen();
    const vorlage = stanPersonalVorbelegung(bogen.einheit.organisation, einheitsTyp);
    render(
      <SchrittBuehne
        komponente={SchrittPersonal}
        bogen={{
          ...bogen,
          einheit: { ...bogen.einheit, einheitsTyp },
          personal: [
            { ...vorlage[0]!, vorname: "Jan", nachname: "Meyer" },
            { ...vorlage[1]!, kontakte: [{ art: KontaktArt.MOBIL, dienstlich: true, wert: "0170" }] },
            // R2-E6: Fahrerlaubnis vorbereitet, Helfer noch offen — bleibt.
            { ...vorlage[2]!, fahrerlaubnis: Fahrerlaubnis.CE },
            ...vorlage.slice(3),
          ],
        }}
      />,
    );

    // Ab 8 Personen beginnt die Liste als Kurz-Liste (R7-H6); dieser Test prüft die Karten.
    await nutzer.click(screen.getByLabelText("Alle Angaben (Karten)"));
    await nutzer.click(screen.getByRole("button", { name: `Vorbelegung entfernen (${vorlage.length - 3} Personen ohne Namen)` }));

    expect(screen.getAllByLabelText("Vorname")).toHaveLength(3);
    expect(screen.queryByRole("button", { name: /^Vorbelegung entfernen/ })).toBeNull();
    // R4-D4: Quittung mit Stärke vorher → nachher und Rückweg.
    const quittung = document.querySelector<HTMLElement>(".rueckweg")!;
    expect(quittung.textContent).toContain(`Vorbelegung entfernt: ${vorlage.length - 3} Personen — Stärke ${vorlage.length} → 3.`);
    await nutzer.click(within(quittung).getByRole("button", { name: "Rückgängig" }));
    expect(screen.getAllByLabelText("Vorname")).toHaveLength(vorlage.length);
  });

  it("zeigt den Knopf nicht, wenn alle Karten benannt sind", () => {
    render(
      <SchrittBuehne
        komponente={SchrittPersonal}
        bogen={{ ...neuerBogen(), personal: [{ ...neuePerson(), vorname: "Jan", nachname: "Meyer" }] }}
      />,
    );

    expect(screen.queryByRole("button", { name: /^Vorbelegung entfernen/ })).toBeNull();
  });
});

/** Auf Schritt 3 stehen nur die Hinweise zu Schritt 3 — Zugehörigkeit und Auftrag gehören woandershin. */
describe("Schritt Personal — nur eigene Hinweise", () => {
  it("zeigt weder den fehlenden Einheitsnamen noch den leeren Auftrag", () => {
    buehne();

    expect(screen.getByText(/Stärke ist 0/)).toBeDefined();
    expect(screen.queryByText(/Ort der Einheit .* fehlt/)).toBeNull();
    expect(screen.queryByText(/Ort\/Auftrag/)).toBeNull();
  });

  it("stutzt bei einem Zahlendreher in der Stärke", async () => {
    const nutzer = userEvent.setup();
    buehne();
    await nutzer.click(screen.getByLabelText("Nur Stärke (Meldekopf-Schnellerfassung)"));

    await nutzer.type(screen.getByLabelText("Führer"), "99");
    await nutzer.type(screen.getByLabelText("Mannschaft"), "1");

    expect(screen.getByText(/99 Führer — stimmt das\?/)).toBeDefined();
    expect(screen.getByText(/mehr Führer als Mannschaft — stimmt das\?/)).toBeDefined();
  });
});

/**
 * Verpflegung wurde doppelt geführt: Nach dem Entfernen einer Person blieb der
 * Bedarf in Schritt 5 bei 4 und musste von Hand nachgezogen werden. Jetzt
 * folgt er der Stärke, solange er ihr entsprach.
 */
describe("Verpflegung zieht mit der Stärke mit", () => {
  function Ableseleiste({ start }: { start: Erfassungsbogen }) {
    const [bogen, setBogen] = useState(start);
    return (
      <>
        <SchrittPersonal bogen={bogen} aendern={(patch) => setBogen((b) => ({ ...b, ...patch }))} />
        <output data-testid="verpflegung">{bogen.sofortbedarf?.verpflegungPersonen}</output>
        <Dialogschicht />
      </>
    );
  }
  const sofortbedarf = (verpflegungPersonen: number) => ({
    verpflegungPersonen,
    dieselLiter: 0,
    benzinLiter: 0,
    gemischLiter: 0,
    unterbringung: false,
    ruhezeitErforderlich: false,
  });

  it("zieht den Bedarf nach, wenn er der Stärke entsprach", async () => {
    const nutzer = userEvent.setup();
    render(<Ableseleiste start={{ ...neuerBogen(), personal: [neuePerson(), neuePerson()], sofortbedarf: sofortbedarf(2) }} />);

    await nutzer.click(screen.getByRole("button", { name: "+ Person hinzufügen" }));
    expect(screen.getByTestId("verpflegung").textContent).toBe("3");

    await nutzer.click(screen.getByRole("button", { name: "Person 3 entfernen" }));
    expect(screen.getByTestId("verpflegung").textContent).toBe("2");
  });

  it("lässt einen bewusst abweichenden Bedarf stehen", async () => {
    const nutzer = userEvent.setup();
    render(<Ableseleiste start={{ ...neuerBogen(), personal: [neuePerson(), neuePerson()], sofortbedarf: sofortbedarf(5) }} />);

    await nutzer.click(screen.getByRole("button", { name: "+ Person hinzufügen" }));

    expect(screen.getByTestId("verpflegung").textContent).toBe("5");
  });
});

// Audit Runde 7, R7-O5: Der gemerkte Rückweg (Name, Funktionen, Rufnummern) bleibt nicht liegen, wenn er abgelaufen
// ist oder zu einer anderen Einheit gehört, und lässt sich ausdrücklich vergessen.
describe("Gemerkter Rückweg im Sitzungsspeicher (R7-O5)", () => {
  const WEG = "eeb.personal.rueckweg";
  const lesen = () => sessionStorage.getItem(WEG);

  it("ein abgelaufener Rückweg wird beim Öffnen des Schritts entfernt, nicht nur ignoriert", () => {
    const bogen = neuerBogen();
    sessionStorage.setItem(
      WEG,
      JSON.stringify({ rueckweg: { art: "liste", text: "alt", personal: [] }, einheit: JSON.stringify(bogen.einheit), zeit: Date.now() - 16 * 60 * 1000 }),
    );
    render(<SchrittBuehne komponente={SchrittPersonal} bogen={bogen} />);
    expect(lesen()).toBeNull();
  });

  it("personalRueckwegVergessen räumt ihn weg", async () => {
    const { personalRueckwegVergessen } = await import("./personal");
    sessionStorage.setItem(WEG, "{}");
    personalRueckwegVergessen();
    expect(lesen()).toBeNull();
  });
});

/** R11-E2 und R11-E3: Art-Wechsel und Telefonfeld der Erreichbarkeit. */
describe("Erreichbarkeit: Art und Nummer (R11)", () => {
  const bogenMit = (art: KontaktArt, wert: string) => ({
    ...neuerBogen(),
    personal: [{ ...neuePerson(), vorname: "Sabine", nachname: "Lang", kontakte: [{ art, dienstlich: false, wert }] }],
  });

  it("behält die Nummer bei Mobil → Festnetz (R11-E2)", async () => {
    const nutzer = userEvent.setup();
    render(<SchrittBuehne komponente={SchrittPersonal} bogen={bogenMit(KontaktArt.MOBIL, "01711234567")} />);
    await nutzer.selectOptions(screen.getByLabelText("Art"), "Festnetz");
    expect((screen.getByLabelText("Nummer") as HTMLInputElement).value).toBe("01711234567");
  });

  it("fragt bei Wechsel nach E-Mail nach und behält die Nummer bei „Art behalten“ (R11-E2)", async () => {
    const nutzer = userEvent.setup();
    render(<SchrittBuehne komponente={SchrittPersonal} bogen={bogenMit(KontaktArt.MOBIL, "01711234567")} />);
    await nutzer.selectOptions(screen.getByLabelText("Art"), "E-Mail");
    const dialog = document.querySelector<HTMLDialogElement>("dialog.abfrage")!;
    expect(dialog.textContent).toContain("01711234567");
    await nutzer.click(within(dialog).getByRole("button", { name: "Art behalten" }));
    expect((screen.getByLabelText("Nummer") as HTMLInputElement).value).toBe("01711234567");
    await nutzer.selectOptions(screen.getByLabelText("Art"), "E-Mail");
    await nutzer.click(within(document.querySelector<HTMLDialogElement>("dialog.abfrage")!).getByRole("button", { name: "Art ändern, Wert entfernen" }));
    expect((screen.getByLabelText("Adresse") as HTMLInputElement).value).toBe("");
  });

  it("behält das Plus und nennt eine abgetrennte zweite Nummer (R11-E3)", async () => {
    const nutzer = userEvent.setup();
    render(<SchrittBuehne komponente={SchrittPersonal} bogen={bogenMit(KontaktArt.MOBIL, "")} />);
    const feld = screen.getByLabelText("Nummer") as HTMLInputElement;
    await nutzer.type(feld, "+49 171 1234567");
    expect(feld.value).toBe("+491711234567");
    await nutzer.clear(feld);
    await nutzer.click(feld);
    await nutzer.paste("0171 1234567 / 0441 99");
    expect(feld.value).toBe("01711234567");
    expect(document.querySelector(".zahl-meldung")?.textContent).toContain("Zweite Nummer");
    await nutzer.clear(feld);
    await nutzer.type(feld, "017112");
    await nutzer.tab();
    expect(document.querySelector(".zahl-meldung")?.textContent).toContain("stimmt die Nummer");
  });
});
