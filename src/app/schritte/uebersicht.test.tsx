/**
 * Schritt 6 — Gesamtübersicht: die Personalliste sagt, wer welchen Platz der
 * Stärke besetzt. Ohne die Rolle steht dort eine Reihe von Qualifikationen,
 * aus der sich nicht ablesen lässt, wer vor Ort Unterführer ist.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
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
