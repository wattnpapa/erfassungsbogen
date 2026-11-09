/**
 * Runde 12, Block Zustand: Verhalten in der Oberfläche (jsdom) — Tippen im Telefonfeld, Tipp neben das
 * Funktionsfeld, Doppeltipp auf Ausgaben, Historie, verlorene Eingabe, Widerspruch, Sicherung, Dauerhaft-Anfrage.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import type { Erfassungsbogen, VokabularWert } from "@bos/eeb-format/model";
import { EinsatzArt, einsaetzeLaden, einsatzAnlegen, meldungHinzufuegen } from "@bos/meldekopf/einsaetze";
import { Dialogschicht } from "./dialoge";
import { Fusszeile } from "./fusszeile";
import { neuePerson, neuerBogen } from "./hilfen";
import { Uebersicht } from "./schritte/uebersicht";
import { vorlageAnlegen, vorlagenLaden, vorlageZuruecksetzen, type Vorlage } from "./vorlagen";
import { sicherungStandText } from "./sicherung";
import { Feld, VokabListe } from "./schritte/bausteine";
import { TelefonFeld } from "./schritte/telefon-feld";

afterEach(cleanup);

function bogenMitName(name: string): Erfassungsbogen {
  const b = neuerBogen();
  b.einheit.hierarchie[0]!.name = name;
  return b;
}

function einsatzMit(namen: string[]) {
  const angelegt = einsatzAnlegen("Hochwasser Wardenburg", EinsatzArt.EINSATZ);
  for (const n of namen) meldungHinzufuegen(angelegt.id, bogenMitName(n));
  return angelegt.id;
}

describe("R12-G1 Tipp neben das Funktionsfeld", () => {
  function Reihe({ start }: { start: VokabularWert[] }) {
    const [werte, setWerte] = useState(start);
    return (
      <Feld titel="Funktionen / Zusatzfunktionen">
        <VokabListe werte={werte} aendern={setWerte} tabelle={[]} hinzufuegenText="Funktion" />
      </Feld>
    );
  }
  const chips = () => [...document.querySelectorAll(".chip")].map((c) => c.firstChild?.textContent);

  it("ein Tipp auf die Titelzeile oder neben den Chip löscht keine Funktion, sondern holt das Eingabefeld", async () => {
    const nutzer = userEvent.setup();
    render(<Reihe start={[{ freitext: "ZFü" }, { freitext: "He" }]} />);
    const label = document.querySelector("label.feld")!;
    await nutzer.click(label); // Mitte der Beschriftung, nicht im Eingabefeld
    expect(chips()).toEqual(["ZFü", "He"]);
    expect(document.activeElement).toBe(screen.getByRole("combobox", { name: "Funktion hinzufügen" }));
    expect(document.querySelector(".chip-rueckgaengig")).toBeNull();
  });

  it("das ✕ am Chip entfernt genau diesen Chip und bietet Rückgängig an", async () => {
    const nutzer = userEvent.setup();
    render(<Reihe start={[{ freitext: "ZFü" }, { freitext: "He" }]} />);
    await nutzer.click(screen.getByRole("button", { name: "He entfernen" }));
    expect(chips()).toEqual(["ZFü"]);
    const quittung = document.querySelector<HTMLElement>(".chip-rueckgaengig")!;
    expect(quittung.textContent).toContain("„He\" entfernt");
    await nutzer.click(within(quittung).getByRole("button", { name: "Rückgängig" }));
    expect(chips()).toEqual(["ZFü", "He"]); // an alter Stelle
    expect(document.querySelector(".chip-rueckgaengig")).toBeNull();
  });

  it("Rückgängig bringt auch den ersten Eintrag an den Anfang zurück", async () => {
    const nutzer = userEvent.setup();
    render(<Reihe start={[{ freitext: "ZFü" }, { freitext: "He" }]} />);
    await nutzer.click(screen.getByRole("button", { name: "ZFü entfernen" }));
    await nutzer.click(screen.getByRole("button", { name: "Rückgängig" }));
    expect(chips()).toEqual(["ZFü", "He"]);
  });

  it("ein Feld ohne Chips behält die Weitergabe an das Eingabefeld", async () => {
    const nutzer = userEvent.setup();
    render(<Reihe start={[]} />);
    await nutzer.click(document.querySelector("label.feld")!);
    expect(document.activeElement).toBe(screen.getByRole("combobox", { name: "Funktion hinzufügen" }));
  });
});

describe("R12-E1 Telefonfeld getippt", () => {
  function Telefon() {
    const [wert, setWert] = useState<string | undefined>("");
    return (
      <Feld titel="Telefon">
        <TelefonFeld wert={wert} setzen={setWert} />
      </Feld>
    );
  }

  it("zeichenweise getippt bleibt nur die erste Nummer, und der Hinweis nennt die zweite", async () => {
    const nutzer = userEvent.setup();
    render(<Telefon />);
    const feld = screen.getByRole("textbox") as HTMLInputElement;
    await nutzer.type(feld, "0171 1234567 / 0441 99");
    expect(feld.value).toBe("01711234567");
    expect(document.body.textContent).toContain("Zweite Nummer „0441 99\" nicht übernommen");
  });

  it("„+49 (0) 171 …“ wird getippt zu +491711234567", async () => {
    const nutzer = userEvent.setup();
    render(<Telefon />);
    const feld = screen.getByRole("textbox") as HTMLInputElement;
    await nutzer.type(feld, "+49 (0) 171 1234567");
    expect(feld.value).toBe("+491711234567");
  });

  it("20 Ziffern: nach dem Verlassen fragt ein Hinweis nach", async () => {
    const nutzer = userEvent.setup();
    render(<Telefon />);
    const feld = screen.getByRole("textbox");
    await nutzer.type(feld, "01711234567890123456");
    await nutzer.tab();
    expect(document.body.textContent).toMatch(/20 Ziffern — länger als jede Telefonnummer/);
  });
});

describe("R12-D1 Vorlage ersetzen", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stellt die Zahlen beider Seiten gegenüber und gibt die vorige Fassung für Rückgängig mit", async () => {
    const nutzer = userEvent.setup();
    const alt = bogenMitName("OV Test");
    alt.personal = [neuePerson(), neuePerson(), neuePerson(), neuePerson()];
    const vorhanden = vorlageAnlegen("OV Test", alt);
    const kurz = bogenMitName("OV Test");
    kurz.personal = [];
    const gespeichert = vi.fn();
    render(
      <>
        <Uebersicht bogen={kurz} geheZu={() => {}} neu={() => {}} onVorlageGespeichert={gespeichert} />
        <Dialogschicht />
      </>,
    );
    await nutzer.click(screen.getByRole("button", { name: "Als Vorlage speichern" }));
    const frage = await screen.findByRole("dialog", { name: "Als Vorlage speichern" });
    const feld = within(frage).getByRole("textbox");
    await nutzer.clear(feld);
    await nutzer.type(feld, "OV Test");
    await nutzer.click(within(frage).getByRole("button", { name: "Vorlage speichern" }));

    const wahl = await screen.findByRole("dialog", { name: "Vorlage mit diesem Namen vorhanden" });
    expect(wahl.textContent).toMatch(/Vorhanden: 4 Personen, \d+ Fahrzeuge? · dieser Bogen: 0 Personen, \d+ Fahrzeuge?/);
    expect(wahl.textContent).toContain("Rückgängig");
    await nutzer.click(within(wahl).getByRole("button", { name: "Vorhandene ersetzen" }));

    expect(vorlagenLaden()).toHaveLength(1);
    expect(vorlagenLaden()[0]!.bogen.personal).toHaveLength(0);
    expect(gespeichert).toHaveBeenCalledTimes(1);
    const [name, ersetzt] = gespeichert.mock.calls[0]! as [string, Vorlage];
    expect(name).toBe("OV Test");
    expect(ersetzt.id).toBe(vorhanden.id);
    expect(ersetzt.bogen.personal).toHaveLength(4);

    // Das „Rückgängig“ der App ruft vorlageZuruecksetzen mit dieser Fassung auf: Die vier Personen sind wieder da.
    vorlageZuruecksetzen(ersetzt);
    expect(vorlagenLaden()[0]!.bogen.personal).toHaveLength(4);
  });

  it("„Zusätzlich anlegen“ gibt keine ersetzte Fassung mit", async () => {
    const nutzer = userEvent.setup();
    vorlageAnlegen("OV Test", bogenMitName("OV Test"));
    const gespeichert = vi.fn();
    render(
      <>
        <Uebersicht bogen={bogenMitName("OV Test")} geheZu={() => {}} neu={() => {}} onVorlageGespeichert={gespeichert} />
        <Dialogschicht />
      </>,
    );
    await nutzer.click(screen.getByRole("button", { name: "Als Vorlage speichern" }));
    const frage = await screen.findByRole("dialog", { name: "Als Vorlage speichern" });
    const feld = within(frage).getByRole("textbox");
    await nutzer.clear(feld);
    await nutzer.type(feld, "OV Test");
    await nutzer.click(within(frage).getByRole("button", { name: "Vorlage speichern" }));
    await nutzer.click(within(await screen.findByRole("dialog", { name: "Vorlage mit diesem Namen vorhanden" })).getByRole("button", { name: "Zusätzlich anlegen" }));
    expect(gespeichert.mock.calls[0]![1]).toBeUndefined();
    expect(vorlagenLaden()).toHaveLength(2);
  });
});

describe("R12-O3 und R12-O4 Datensicherung", () => {
  function buehne() {
    render(
      <>
        <Fusszeile onBogenOeffnen={async () => true} />
        <Dialogschicht />
      </>,
    );
  }
  afterEach(() => {
    Reflect.deleteProperty(navigator, "storage");
  });
  beforeEach(() => {
    localStorage.clear();
  });

  it("zeigt nach abgelehnter Anfrage nach dauerhaftem Speicher einen Satz dazu (R12-O3)", async () => {
    const persist = vi.fn(async () => false);
    Object.defineProperty(globalThis.navigator, "storage", { configurable: true, value: { persisted: async () => false, persist } });
    const nutzer = userEvent.setup();
    buehne();
    await nutzer.click(screen.getByRole("button", { name: "Datensicherung" }));
    const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Datensicherung']")!;
    expect(await within(dialog).findByText(/Speicher ist nicht dauerhaft/)).toBeDefined();
    expect(within(dialog).queryByText(/hat den dauerhaften Speicher abgelehnt/)).toBeNull();
    await nutzer.click(within(dialog).getByRole("button", { name: "Dauerhaften Speicher anfragen" }));
    expect(persist).toHaveBeenCalled();
    expect(await within(dialog).findByText(/Der Browser hat den dauerhaften Speicher abgelehnt — regelmäßig sichern/)).toBeDefined();
  });

  it("quittiert „Sicherung erstellen…“ mit Dateiname und Ablage und nennt den Datenstand (R12-O4)", async () => {
    einsatzMit(["Wardenburg", "Hatten"]);
    const urlAlt = { c: URL.createObjectURL, r: URL.revokeObjectURL };
    URL.createObjectURL = vi.fn(() => "blob:test");
    URL.revokeObjectURL = vi.fn();
    const klick = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    try {
      const nutzer = userEvent.setup();
      buehne();
      await nutzer.click(screen.getByRole("button", { name: "Datensicherung" }));
      const dialog = document.querySelector<HTMLDialogElement>("dialog[aria-label='Datensicherung']")!;
      await nutzer.click(within(dialog).getByRole("button", { name: "Sicherung erstellen…" }));
      const quittung = (await within(dialog).findAllByRole("status")).map((s) => s.textContent).join(" | ");
      expect(quittung).toMatch(/Sicherung „eeb-sicherung-\d{4}-\d\d-\d\d\.json" erzeugt — liegt im Download-Ordner/);
      expect(quittung).toContain("erst, wenn sie auf einem zweiten Gerät oder Datenträger liegt");
      expect(quittung).toContain("Sie enthält 1 Einsatz, 2 Meldungen; seitdem ist nichts Neues dazugekommen");
      // Eine Meldung mehr: die Anzeige rechnet seit der Sicherung.
      const id = einsaetzeLaden()[0]!.id;
      meldungHinzufuegen(id, bogenMitName("Ganderkesee"));
      expect(sicherungStandText()).toBe("Sie enthält 1 Einsatz, 2 Meldungen; seit der Sicherung 1 neue Meldung.");
    } finally {
      URL.createObjectURL = urlAlt.c;
      URL.revokeObjectURL = urlAlt.r;
      klick.mockRestore();
    }
  });

  it("ohne Sicherung gibt es keinen Datenstand-Satz", () => {
    expect(sicherungStandText()).toBe("");
  });
});
