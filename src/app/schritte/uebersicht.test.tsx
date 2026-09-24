/**
 * Schritt 6 — Gesamtübersicht: die Personalliste sagt, wer welchen Platz der
 * Stärke besetzt. Ohne die Rolle steht dort eine Reihe von Qualifikationen,
 * aus der sich nicht ablesen lässt, wer vor Ort Unterführer ist.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StaerkeRolle, type Person } from "@bos/eeb-format/model";
import { neuePerson, neuerBogen, vokabularFuer } from "../hilfen";
import { Uebersicht } from "./uebersicht";

// pdfmake wird in der Übersicht nur nachgeladen, wenn jemand ein PDF anfordert;
// im Test ist es teuer und hier ohne Belang.
vi.mock("../pdf", () => ({
  pdfErzeugen: async () => {},
  pdfBlobUrl: async () => "blob:pdf-vorschau",
  einsatzPdfErzeugen: async () => {},
}));

function person(vorname: string, nachname: string, rolle: StaerkeRolle, funktionKurz?: string): Person {
  const org = neuerBogen().einheit.organisation;
  const eintrag = funktionKurz
    ? vokabularFuer(org, "funktion").find((f) => f.kurz === funktionKurz)
    : undefined;
  return {
    ...neuePerson(),
    vorname,
    nachname,
    staerkeRolle: rolle,
    funktionen: eintrag ? [{ code: eintrag.code }] : [],
  };
}

function uebersichtMit(personal: Person[]) {
  const bogen = { ...neuerBogen(), personal };
  return render(<Uebersicht bogen={bogen} geheZu={() => {}} neu={() => {}} />);
}

/** Die Personaltabelle des Abschnitts „Personal (n)". */
function personalTabelle(): HTMLElement {
  const abschnitt = screen.getByRole("heading", { name: /^Personal \(/ }).closest("section")!;
  return within(abschnitt).getByRole("table");
}

describe("Übersicht — Personalliste", () => {
  it("zeigt je Person die Stärkerolle als Kürzel", () => {
    uebersichtMit([
      person("Anna", "Ahrens", StaerkeRolle.FUEHRER),
      person("Bernd", "Brandt", StaerkeRolle.UNTERFUEHRER),
      person("Carla", "Cordes", StaerkeRolle.MANNSCHAFT),
    ]);

    const zeilen = within(personalTabelle()).getAllByRole("row").slice(1);
    expect(zeilen.map((z) => within(z).getAllByRole("cell")[0]!.textContent)).toEqual(["Fü", "UFü", "Ma"]);
  });

  it("nennt die Rolle vorlesbar aus, nicht nur als Kürzel", () => {
    uebersichtMit([person("Bernd", "Brandt", StaerkeRolle.UNTERFUEHRER)]);

    expect(screen.getByLabelText("Unterführer/in").textContent).toBe("UFü");
  });

  it("trennt die Rolle von der Funktion: Gruppenführer-Ausbildung, Platz in der Mannschaft", () => {
    // Genau der Fall, in dem die Funktion allein in die Irre führt — die
    // Qualifikation sagt „GrFü", besetzt ist aber ein Mannschaftsplatz.
    const grFue = vokabularFuer(neuerBogen().einheit.organisation, "funktion").find((f) =>
      f.kurz.startsWith("GrFü"),
    )!;
    uebersichtMit([person("Carla", "Cordes", StaerkeRolle.MANNSCHAFT, grFue.kurz)]);

    const zeile = within(personalTabelle()).getAllByRole("row")[1]!;
    const zellen = within(zeile).getAllByRole("cell");
    expect(zellen[0]!.textContent).toBe("Ma");
    expect(zellen[1]!.textContent).toContain(grFue.kurz);
  });
});

/**
 * Der Übergabe-Dialog ist der letzte Moment, in dem eine Lücke im Bogen noch
 * auffallen kann. Vorher zählte nur die Leitzeile der Ansicht die offenen
 * Punkte auf — wer bis zum QR-Code durchgetippt hatte, hatte sie längst
 * weggescrollt, und ein Bogen ohne Einheitsnamen und mit Stärke 0 ging
 * kommentarlos als QR-Code und PDF an den Meldekopf. Am Meldekopf fällt das
 * erst beim Zusammenzählen auf, und ohne hinterlegten Absender ist auch keine
 * Rückfrage möglich.
 */
describe("Übersicht — Übergabe-Dialog", () => {
  function uebergabeDialog(): HTMLDialogElement {
    return document.querySelector<HTMLDialogElement>("dialog[aria-label='Bogen übergeben']")!;
  }

  it("zählt die offenen Punkte auch im Übergabe-Dialog auf", async () => {
    const nutzer = userEvent.setup();
    // Frischer Bogen: kein Einheitsname, Stärke 0, kein Ort/Auftrag.
    render(<Uebersicht bogen={neuerBogen()} geheZu={() => {}} neu={() => {}} />);

    await nutzer.click(screen.getByRole("button", { name: "Bogen übergeben…" }));

    const dialog = uebergabeDialog();
    expect(within(dialog).getByText(/offene Punkte für die Weitergabe/)).toBeDefined();
    expect(
      within(dialog).getByRole("button", { name: /Name der eigenen Einheit .* fehlt/ }),
    ).toBeDefined();
    // Gesperrt wird nichts — eine Teilmeldung ist manchmal richtig.
    expect(within(dialog).getByText(/Übergeben ist trotzdem möglich/)).toBeDefined();
    expect(within(dialog).getByRole("button", { name: "PDF erzeugen" })).toHaveProperty("disabled", false);
  });

  it("springt aus dem Dialog auf den Schritt, der die Lücke schließt", async () => {
    const nutzer = userEvent.setup();
    const gesprungen: number[] = [];
    render(<Uebersicht bogen={neuerBogen()} geheZu={(s) => gesprungen.push(s)} neu={() => {}} />);

    await nutzer.click(screen.getByRole("button", { name: "Bogen übergeben…" }));
    await nutzer.click(
      within(uebergabeDialog()).getByRole("button", { name: /Name der eigenen Einheit .* fehlt/ }),
    );

    expect(gesprungen).toEqual([0]); // Schritt 1 „Einheit"
    expect(uebergabeDialog().open).toBe(false);
  });

  it("zeigt im vollständigen Bogen keine Punkte im Dialog", async () => {
    const nutzer = userEvent.setup();
    const bogen = neuerBogen();
    render(
      <Uebersicht
        bogen={{
          ...bogen,
          einheit: { ...bogen.einheit, hierarchie: [{ bezeichnung: { code: 1 }, name: "Oldenburg", telefon: "4419876" }] },
          einsatz: { ...bogen.einsatz, ortAuftrag: "Deichsicherung" },
          personal: [
            { ...person("Anna", "Ahrens", StaerkeRolle.FUEHRER), kontakte: [{ art: 0, dienstlich: true, wert: "441987654" }] },
          ],
        }}
        geheZu={() => {}}
        neu={() => {}}
      />,
    );

    await nutzer.click(screen.getByRole("button", { name: "Bogen übergeben…" }));

    expect(within(uebergabeDialog()).queryByText(/offene[nr]? Punkt/)).toBeNull();
  });
});

/**
 * Gemeldet aus einem THW-OV: In Chrome auf Android zeigte „Vorschau anzeigen"
 * nur eine graue Seite „Inhalt blockiert". Der Browser hat keinen eingebauten
 * PDF-Betrachter und sagt das über navigator.pdfViewerEnabled.
 */
describe("Übersicht — PDF-Vorschau", () => {
  function mitPdfBetrachter(wert: boolean | undefined, test: () => Promise<void> | void) {
    const vorher = Object.getOwnPropertyDescriptor(navigator, "pdfViewerEnabled");
    Object.defineProperty(navigator, "pdfViewerEnabled", { value: wert, configurable: true });
    return Promise.resolve(test()).finally(() => {
      if (vorher) Object.defineProperty(navigator, "pdfViewerEnabled", vorher);
      else delete (navigator as { pdfViewerEnabled?: boolean }).pdfViewerEnabled;
    });
  }

  it("bettet die Vorschau ein, wenn der Browser PDFs anzeigen kann", () =>
    mitPdfBetrachter(true, async () => {
      const nutzer = userEvent.setup();
      const { container } = render(<Uebersicht bogen={neuerBogen()} geheZu={() => {}} neu={() => {}} />);

      await nutzer.click(screen.getByRole("button", { name: "Vorschau anzeigen" }));

      expect(await screen.findByTitle("PDF-Vorschau des Erfassungsbogens")).toBeDefined();
      expect(container.querySelector("iframe.pdf-rahmen")).not.toBeNull();
    }));

  it("bietet ohne PDF-Betrachter den Download statt eines leeren Rahmens an", () =>
    mitPdfBetrachter(false, () => {
      const { container } = render(<Uebersicht bogen={neuerBogen()} geheZu={() => {}} neu={() => {}} />);

      expect(screen.queryByRole("button", { name: "Vorschau anzeigen" })).toBeNull();
      expect(screen.getByRole("button", { name: "PDF herunterladen" })).toBeDefined();
      expect(screen.getByText(/kann PDFs nicht in der Seite anzeigen/)).toBeDefined();
      expect(container.querySelector("iframe")).toBeNull();
    }));
});
