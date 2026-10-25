/**
 * Schritt 5 — Sofortbedarf: die Vorbelegung der Verpflegung aus der Stärke
 * und der Betriebsstoff-Plausibilitätshinweis an Ort und Stelle.
 */

import { describe, it, expect } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SchrittBuehne } from "../../test/schritt-buehne";
import { neuePerson, neuerBogen } from "../hilfen";
import { SchrittSofortbedarf } from "./sofortbedarf";

describe("Schritt Sofortbedarf", () => {
  it("nennt vor dem Anhaken die vier Bereiche und blendet den Satz danach aus (R4-N6)", async () => {
    const nutzer = userEvent.setup();
    render(<SchrittBuehne komponente={SchrittSofortbedarf} />);
    const satz = /Verpflegung, Betriebsstoff \(Diesel, Benzin, Gemisch\), Unterbringung, Ruhezeit/;
    expect(screen.getByText(satz)).toBeDefined();
    await nutzer.click(screen.getByLabelText("Sofortbedarf erfassen"));
    expect(screen.queryByText(satz)).toBeNull();
  });

  it("belegt die Verpflegung mit der Stärke vor und sagt das dazu", async () => {
    const nutzer = userEvent.setup();
    render(<SchrittBuehne komponente={SchrittSofortbedarf} bogen={{ ...neuerBogen(), personal: [neuePerson(), neuePerson(), neuePerson()] }} />);

    await nutzer.click(screen.getByLabelText("Sofortbedarf erfassen"));

    expect((screen.getByLabelText("Verpflegung (Personen)") as HTMLInputElement).value).toBe("3");
    expect(screen.getByText(/Verpflegung ist aus der Stärke vorbelegt und zieht mit ihr mit/)).toBeDefined();
  });

  // Rückmeldung aus der Erprobung: ein geleertes Zahlenfeld sprang auf „0" zurück, neu tippen ergab „07".
  it("lässt ein Zahlenfeld leer, solange man es leert und neu tippt", async () => {
    const nutzer = userEvent.setup();
    render(<SchrittBuehne komponente={SchrittSofortbedarf} />);
    await nutzer.click(screen.getByLabelText("Sofortbedarf erfassen"));
    const diesel = screen.getByLabelText("Diesel (l)") as HTMLInputElement;
    await nutzer.clear(diesel);
    await nutzer.type(diesel, "70");
    expect(diesel.value).toBe("70");
    await nutzer.clear(diesel);
    expect(diesel.value).toBe("");
    await nutzer.tab();
    expect(diesel.value).toBe("0");
  });

  // Audit Runde 7, R7-E6: Eine begrenzte Eingabe wird genannt.
  it("sagt, wenn ein negativer Wert auf 0 gesetzt wurde (R7-E6)", async () => {
    const nutzer = userEvent.setup();
    render(<SchrittBuehne komponente={SchrittSofortbedarf} />);
    await nutzer.click(screen.getByLabelText("Sofortbedarf erfassen"));
    const benzin = screen.getByLabelText("Benzin (l)") as HTMLInputElement;
    fireEvent.change(benzin, { target: { value: "-40" } });
    expect(benzin.value).toBe("0");
    expect(screen.getByText(/Mindestens 0 — dein Wert -40 wurde auf 0 gesetzt/)).toBeDefined();
    await nutzer.clear(benzin);
    await nutzer.type(benzin, "40");
    expect(screen.queryByText(/Mindestens 0/)).toBeNull();
  });

  /** „Diesel 99 999 l" fiel vorher erst in der Übersicht auf — wenn überhaupt. */
  it("stutzt bei Betriebsstoff über 1000 l je Fahrzeug, nicht sperrend", async () => {
    const nutzer = userEvent.setup();
    render(<SchrittBuehne komponente={SchrittSofortbedarf} bogen={{ ...neuerBogen(), fahrzeuge: [{ typ: { code: 1 } }, { typ: { code: 1 } }] }} />);
    await nutzer.click(screen.getByLabelText("Sofortbedarf erfassen"));

    const diesel = screen.getByLabelText("Diesel (l)") as HTMLInputElement;
    await nutzer.type(diesel, "1500");
    expect(screen.queryByText(/mehr als 1.000 l je Fahrzeug/)).toBeNull(); // 2 Fahrzeuge → bis 2000 l unauffällig

    await nutzer.clear(diesel);
    await nutzer.type(diesel, "99999");

    expect(screen.getByText(/99\.999 l Diesel für 2 Fahrzeuge — mehr als 1\.000 l je Fahrzeug/)).toBeDefined();
    expect(diesel.value).toBe("99999"); // nicht gesperrt, nicht gekappt
  });
});
