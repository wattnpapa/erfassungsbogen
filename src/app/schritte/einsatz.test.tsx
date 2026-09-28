/**
 * Schritt 2 — Einsatz: die Vorbelegung des Zeitraums, die Zeitstempel-Kästchen
 * und die Hinweise, die auf diesen Schritt gehören.
 */

import { describe, it, expect } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { datumZuIso, zeitpunktAusIso } from "@bos/eeb-format/model";
import { SchrittBuehne } from "../../test/schritt-buehne";
import { neuerBogen } from "../hilfen";
import { SchrittEinsatz } from "./einsatz";

const buehne = () => render(<SchrittBuehne komponente={SchrittEinsatz} />);

describe("Schritt Einsatz", () => {
  /**
   * Das Format verlangt für „bis" ein Datum (uint16 im QR) — die Vorbelegung
   * ist nicht zu vermeiden. Dann soll sie wenigstens dem Beginn folgen,
   * solange niemand sie angefasst hat: Vorher stand nach dem Verschieben des
   * Beginns „bis liegt vor von" zu einem Feld, das nie jemand berührt hatte.
   */
  // Ein Datumsfeld nimmt seinen Wert am Stück (Datumswähler), nicht Zeichen
  // für Zeichen — deshalb fireEvent.change statt userEvent.type.
  const datumSetzen = (feld: HTMLElement, wert: string) => fireEvent.change(feld, { target: { value: wert } });

  it("zieht „bis“ mit „von“ mit, solange es unberührt ist", () => {
    buehne();

    const von = screen.getByLabelText("Zeitraum von") as HTMLInputElement;
    const bis = screen.getByLabelText(/^Zeitraum bis/) as HTMLInputElement;
    expect(bis.value).toBe(von.value);
    expect(screen.getByLabelText("Zeitraum bis (Vorschlag: wie Beginn)")).toBeDefined();

    datumSetzen(von, "2026-10-03");

    expect((screen.getByLabelText(/^Zeitraum bis/) as HTMLInputElement).value).toBe("2026-10-03");
  });

  it("lässt ein bewusst gesetztes „bis“ beim Ändern von „von“ stehen", () => {
    buehne();

    datumSetzen(screen.getByLabelText(/^Zeitraum bis/), "2026-10-10");
    expect(screen.getByLabelText("Zeitraum bis")).toBeDefined(); // kein Vorschlag mehr

    datumSetzen(screen.getByLabelText("Zeitraum von"), "2026-10-03");

    expect((screen.getByLabelText("Zeitraum bis") as HTMLInputElement).value).toBe("2026-10-10");
  });

  /** Das Kästchen setzt einen Zeitstempel — das stand vorher nirgends. */
  it("benennt die Zeitstempel-Kästchen nach dem, was sie tun", async () => {
    const nutzer = userEvent.setup();
    buehne();

    expect(screen.getByText(/Setzt die aktuelle Uhrzeit, danach änderbar/)).toBeDefined();
    await nutzer.click(screen.getByLabelText("Einsatzbeginn eintragen"));

    const feld = screen.getByLabelText("Einsatzbeginn (Datum, Uhrzeit)") as HTMLInputElement;
    expect(feld.value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });

  /**
   * „bis vor von" erschien vorher auf Schritt 1, 3 und in der Übersicht —
   * überall, nur nicht dort, wo der Fehler gemacht wird.
   */
  it("zeigt Zeitfehler auf diesem Schritt — und nur die eigenen Hinweise", () => {
    const b = neuerBogen();
    b.einsatz = {
      zeitraumVon: b.einsatz.zeitraumVon,
      zeitraumBis: b.einsatz.zeitraumVon - 1,
      ortAuftrag: "Kabelblitz",
      einsatzbeginn: zeitpunktAusIso("2026-09-27T18:00"),
      einsatzende: zeitpunktAusIso("2026-09-27T06:00"),
    };
    render(<SchrittBuehne komponente={SchrittEinsatz} bogen={b} />);

    expect(screen.getByText(/„bis“ liegt vor „von“/)).toBeDefined();
    expect(screen.getByText("⚠ Einsatzende 27.09.2026, 06:00 liegt vor dem Einsatzbeginn 27.09.2026, 18:00.")).toBeDefined();
    // Hinweise zu Schritt 1 und 3 bleiben draußen.
    expect(screen.queryByText(/Name der eigenen Einheit/)).toBeNull();
    expect(screen.queryByText(/Stärke ist 0/)).toBeNull();
    expect(datumZuIso(b.einsatz.zeitraumBis) < datumZuIso(b.einsatz.zeitraumVon)).toBe(true);
  });
});
