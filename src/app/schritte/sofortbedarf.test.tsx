/**
 * Schritt 5 — Sofortbedarf: die Vorbelegung der Verpflegung aus der Stärke
 * und der Betriebsstoff-Plausibilitätshinweis an Ort und Stelle.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SchrittBuehne } from "../../test/schritt-buehne";
import { neuePerson, neuerBogen } from "../hilfen";
import { SchrittSofortbedarf } from "./sofortbedarf";

describe("Schritt Sofortbedarf", () => {
  it("belegt die Verpflegung mit der Stärke vor und sagt das dazu", async () => {
    const nutzer = userEvent.setup();
    render(<SchrittBuehne komponente={SchrittSofortbedarf} bogen={{ ...neuerBogen(), personal: [neuePerson(), neuePerson(), neuePerson()] }} />);

    await nutzer.click(screen.getByLabelText("Sofortbedarf erfassen"));

    expect((screen.getByLabelText("Verpflegung (Personen)") as HTMLInputElement).value).toBe("3");
    expect(screen.getByText(/Verpflegung ist aus der Stärke vorbelegt und zieht mit ihr mit/)).toBeDefined();
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
