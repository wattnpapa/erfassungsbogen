/** Audit Runde 5, R5-E1: Statt eines weißen Bildschirms eine Seite mit Ausweg, die nichts löscht. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Fehlerfaenger } from "./fehlerfaenger";

function Bombe(): never {
  throw new TypeError("Cannot read properties of undefined (reading 'code')");
}

let download: { name: string; blob: Blob }[];

beforeEach(() => {
  localStorage.clear();
  download = [];
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.stubGlobal("URL", { ...URL, createObjectURL: () => "blob:x", revokeObjectURL: () => undefined });
  HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
    download.push({ name: this.download, blob: new Blob() });
  };
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Fehlerfaenger", () => {
  it("reicht die Kinder durch, solange nichts abstürzt", () => {
    render(<Fehlerfaenger><p>Alles gut</p></Fehlerfaenger>);
    expect(screen.getByText("Alles gut")).toBeTruthy();
  });

  it("zeigt bei einem Absturz eine deutsche Meldung mit den Wegen hinaus und sagt, dass nichts gelöscht wurde", () => {
    localStorage.setItem("eeb.vorlagen.v1", "[1]");
    render(<Fehlerfaenger><Bombe /></Fehlerfaenger>);
    const seite = screen.getByRole("alert");
    expect(seite.textContent).toContain("Hier ist etwas schiefgelaufen");
    expect(seite.textContent).toContain("Deine Daten liegen weiter auf diesem Gerät");
    for (const name of ["Neu laden", "Zur Startseite", "Daten sichern"]) {
      expect(screen.getByRole("button", { name })).toBeTruthy();
    }
    expect(screen.getByText(/Cannot read properties/)).toBeTruthy(); // nur unter „Technische Angabe"
    expect(localStorage.getItem("eeb.vorlagen.v1")).toBe("[1]");
  });

  it("Neu laden und Zur Startseite vergessen die zuletzt geöffnete Sammlung, damit der Absturz sich nicht wiederholt", () => {
    localStorage.setItem("eeb.letzterEinsatz.v1", JSON.stringify({ id: "s1", um: Date.now() }));
    localStorage.setItem("eeb.einsaetze.v1", "[]");
    const reload = vi.fn();
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, reload, assign, pathname: "/" });
    render(<Fehlerfaenger><Bombe /></Fehlerfaenger>);
    fireEvent.click(screen.getByRole("button", { name: "Zur Startseite" }));
    expect(localStorage.getItem("eeb.letzterEinsatz.v1")).toBeNull();
    expect(assign).toHaveBeenCalledWith("/");
    localStorage.setItem("eeb.letzterEinsatz.v1", "{}");
    fireEvent.click(screen.getByRole("button", { name: "Neu laden" }));
    expect(localStorage.getItem("eeb.letzterEinsatz.v1")).toBeNull();
    expect(reload).toHaveBeenCalled();
    expect(localStorage.getItem("eeb.einsaetze.v1")).toBe("[]"); // Daten unberührt
  });

  it("„Daten sichern“ erzeugt eine Sicherungsdatei mit allen eeb.-Einträgen", () => {
    localStorage.setItem("eeb.vorlagen.v1", "[1]");
    render(<Fehlerfaenger><Bombe /></Fehlerfaenger>);
    fireEvent.click(screen.getByRole("button", { name: "Daten sichern" }));
    expect(download).toHaveLength(1);
    expect(download[0]!.name).toMatch(/^eeb-sicherung-\d{4}-\d{2}-\d{2}\.json$/);
    expect(screen.getByRole("status").textContent).toContain("Sicherung erstellt");
  });

  it("„Alle Daten löschen“ ist gesperrt, bis der Haken gesetzt ist, und löscht dann nur eeb.-Daten", () => {
    localStorage.setItem("eeb.vorlagen.v1", "[1]");
    localStorage.setItem("fremd", "bleibt");
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, assign, pathname: "/" });
    render(<Fehlerfaenger><Bombe /></Fehlerfaenger>);
    const loeschen = screen.getByRole("button", { name: "Endgültig löschen", hidden: true }) as HTMLButtonElement;
    expect(loeschen.disabled).toBe(true);
    fireEvent.click(screen.getByLabelText(/Ja, alle Daten dieser App/));
    expect(loeschen.disabled).toBe(false);
    fireEvent.click(loeschen);
    expect(localStorage.getItem("eeb.vorlagen.v1")).toBeNull();
    expect(localStorage.getItem("fremd")).toBe("bleibt");
    expect(assign).toHaveBeenCalledWith("/");
  });
});
