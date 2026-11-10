/**
 * Runde 11 (Handschuh, Aufnahme, Quittung): Verhalten, das jsdom prüfen kann — Eingabetaste, Fokus, Markup.
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { DaumenQuittung } from "./daumen-quittung";
import { neuerBogen } from "./hilfen";
import { VorschlagFeld } from "./schritte/bausteine";
import { SchrittEinheit } from "./schritte/einheit";

afterEach(cleanup);

function Reihe({ imFluss = false }: { imFluss?: boolean }) {
  const [wert, setWert] = useState("");
  return (
    <div className="schritt-inhalt">
      <VorschlagFeld
        wert={wert}
        beschriftung="Ort"
        treffer={[]}
        schluessel={(t: string) => t}
        zeile={(t: string) => t}
        tippen={setWert}
        waehlen={() => {}}
        bestaetigen={setWert}
        imFluss={imFluss}
      />
      <input aria-label="Kürzel" />
    </div>
  );
}

describe("Eingabetaste in Vorschlagsfeldern (R11-G1)", () => {
  it("„Weiter“ führt zum nächsten Feld, die Taste trägt enterkeyhint", async () => {
    const nutzer = userEvent.setup();
    render(<Reihe />);
    const ort = screen.getByRole("combobox", { name: "Ort" });
    expect(ort.getAttribute("enterkeyhint")).toBe("next");
    await nutzer.type(ort, "Albstadt{Enter}");
    expect(document.activeElement).toBe(screen.getByLabelText("Kürzel"));
    expect((ort as HTMLInputElement).value).toBe("Albstadt");
  });
  it("Chip-Felder (imFluss) behalten den Fokus für den nächsten Eintrag", async () => {
    const nutzer = userEvent.setup();
    render(<Reihe imFluss />);
    const ort = screen.getByRole("combobox", { name: "Ort" });
    await nutzer.type(ort, "x{Enter}");
    expect(document.activeElement).toBe(ort);
  });
});

describe("Aufnahme (R11-M1)", () => {
  it("ohne ortFokus bleibt der Fokus unberührt", () => {
    render(<SchrittEinheit bogen={neuerBogen()} aendern={() => {}} />);
    expect(document.activeElement?.id).not.toBe("feld-einheit-name");
  });
});

describe("Quittung (R11-M3)", () => {
  it("mehrzeilig trägt die Klasse für vier Zeilen", () => {
    render(<DaumenQuittung mehrzeilig onSchliessen={() => {}}>Abgerückt 16:34</DaumenQuittung>);
    expect(document.querySelector(".quittung-daumen")?.classList.contains("quittung-mehrzeilig")).toBe(true);
  });
  it("ohne Angabe bleibt es bei zwei Zeilen", () => {
    render(<DaumenQuittung onSchliessen={() => {}}>Abgerückt 16:34</DaumenQuittung>);
    expect(document.querySelector(".quittung-daumen")?.classList.contains("quittung-mehrzeilig")).toBe(false);
  });
});
