/**
 * Schritt 3 — Personal. Der Schritt hat drei Erfassungswege (Detail-Karten,
 * Schnelleingabe-Tabelle, Namens-Import) und die Meldekopf-Schnellerfassung;
 * geprüft wird, dass jeder davon Personal bzw. Stärke tatsächlich verändert.
 */

import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SchrittBuehne } from "../../test/schritt-buehne";
import { OrganisationsTyp } from "../../model";
import { neuePerson, neuerBogen } from "../hilfen";
import { SchrittPersonal } from "./personal";
import { stanPersonalVorbelegung } from "../../vokabulare/thw-stan-personal";

const buehne = () => render(<SchrittBuehne komponente={SchrittPersonal} />);

/** Startbogen einer DLRG-Einheit — sonst ist der frische Bogen immer THW. */
const dlrgBogen = () => {
  const b = neuerBogen();
  return { ...b, einheit: { ...b.einheit, organisation: OrganisationsTyp.DLRG } };
};

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
    await nutzer.click(within(dialog).getByRole("button", { name: "Ersetzen" }));

    expect(screen.getByLabelText("Stärke: 0 Führer, 2 Unterführer, 7 Mannschaft, 9 gesamt")).toBeDefined();
    // Und jetzt steht die StAN so da wie sie ist — der Knopf hätte nichts mehr zu tun.
    expect(screen.getByRole("button", { name: /^StAN-Sollplätze laden/ })).toHaveProperty("disabled", true);
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

  it("schlägt für Qualifikationen Berufsbezeichnungen vor und trägt sie als Freitext ein", async () => {
    const nutzer = userEvent.setup();
    await mitPerson(nutzer);

    await nutzer.type(screen.getByLabelText("Qualifikation hinzufügen"), "Elektrotechnik");

    // Das Berufs-Vokabular wird nachgeladen — daher findBy statt getBy.
    await nutzer.click(await screen.findByText("Elektrotechnik"));

    expect(screen.getByRole("button", { name: "Elektrotechnik entfernen" })).toBeDefined();
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

    const feld = screen.getByLabelText("Qualifikation hinzufügen");
    // Erst einen Beruf treffen: das beweist, dass die Vorschläge geladen sind —
    // sonst prüft der Test nur, dass noch gar nichts da ist.
    await nutzer.type(feld, "Elektrotechnik");
    await screen.findByText("Elektrotechnik");

    await nutzer.clear(feld);
    await nutzer.type(feld, "Wasserretter");

    expect(screen.queryByText(/^411 /)).toBeNull();
  });

  it("zeigt ohne Eingabe keine Vorschläge", async () => {
    const nutzer = userEvent.setup();
    await mitPerson(nutzer);

    await nutzer.click(screen.getByLabelText("Funktion hinzufügen"));

    expect(document.querySelector("ul.vorschlaege")).toBeNull();
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
