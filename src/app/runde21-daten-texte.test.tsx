/**
 * Runde 21, Block Daten und Texte: Organisation der Schnellerfassung (W2, H2), Fehlerschirm ohne Netz (L2, D2), „Mehr"-Blatt schließt (K2),
 * eine Zählung der Schnellerfassung (A3, W3, E4, H3, G8, M3, L3, N2, O2, S2), Texte bei vollem Speicher (H6, H7, N7, S5, W6, A7),
 * Lageblatt (A8, A10), Pflichtfeld am Reiter (N3), Fachwörter (N6). Die Abläufe der ganzen App stehen in runde21-daten-texte-app.test.tsx.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrganisationsTyp } from "@bos/eeb-format/model";
import { EinsatzArt, einsatzAnlegen, meldungHinzufuegen } from "@bos/meldekopf/einsaetze";
import { Fehlerfaenger, istLadeFehler } from "./fehlerfaenger";
import { neuerBogen } from "./hilfen";
import { andereOrganisationImOrt } from "./schnell-organisation";
import { SpeicherWarnung } from "./speicher-warnung";
import { SPEICHER_GRENZE_ZEICHEN, speicherBelegung } from "./eintrag-zeiten";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
  sessionStorage.clear();
});

// ---------------------------------------------------------------------------------------- W2, H2 Organisation

describe("R21-W2, H2: Organisation der Schnellerfassung", () => {

  it("erkennt eine andere Organisation am Anfang des Orts (DRK, Feuerwehr), aber nicht in Wortteilen", () => {
    expect(andereOrganisationImOrt("DRK Bremen", OrganisationsTyp.THW)).toBe(OrganisationsTyp.DRK);
    expect(andereOrganisationImOrt("Feuerwehr Husum", OrganisationsTyp.THW)).toBe(OrganisationsTyp.FEUERWEHR);
    expect(andereOrganisationImOrt("Freiwillige Feuerwehr Husum", OrganisationsTyp.THW)).toBe(OrganisationsTyp.FEUERWEHR);
    expect(andereOrganisationImOrt("Malteser Hilfsdienst Kiel", OrganisationsTyp.THW)).toBe(OrganisationsTyp.MHD);
    expect(andereOrganisationImOrt("THW Oldenburg", OrganisationsTyp.DRK)).toBe(OrganisationsTyp.THW);
    // Gleiche Organisation, Ort ohne Organisation und Wortteile lösen nichts aus.
    expect(andereOrganisationImOrt("DRK Bremen", OrganisationsTyp.DRK)).toBeUndefined();
    expect(andereOrganisationImOrt("Oldenburg", OrganisationsTyp.THW)).toBeUndefined();
    expect(andereOrganisationImOrt("Drkwalde", OrganisationsTyp.THW)).toBeUndefined();
    expect(andereOrganisationImOrt("FFW", OrganisationsTyp.THW)).toBe(OrganisationsTyp.FEUERWEHR);
    expect(andereOrganisationImOrt("", OrganisationsTyp.THW)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------------------- L2, D2 Fehlerschirm

describe("R21-L2, D2: Fehlerschirm nennt bei fehlendem Netz die Ursache und rät nicht zum Löschen", () => {
  const Bombe = ({ text }: { text: string }): never => {
    throw new TypeError(text);
  };

  it("erkennt nachgeladene Teile, die nicht kamen, an den Meldungen der Browser", () => {
    for (const t of [
      "Unable to preload CSS for /assets/index-Bp0pLAQP.css",
      "Failed to fetch dynamically imported module: https://x/assets/einsaetze-1.js",
      "error loading dynamically imported module",
      "Importing a module script failed.",
      "Load failed",
    ]) {
      expect(istLadeFehler(new TypeError(t)), t).toBe(true);
    }
    expect(istLadeFehler(new TypeError("Cannot read properties of undefined (reading 'code')"))).toBe(false);
  });

  it("zeigt bei einem Ladefehler die Ursache und „Seite neu laden“, ohne Löschempfehlung und ohne „Alle Daten löschen“", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    localStorage.setItem("eeb.einsaetze.v1", "[1]");
    render(<Fehlerfaenger><Bombe text="Unable to preload CSS for /assets/index-x.css" /></Fehlerfaenger>);
    const seite = screen.getByRole("alert");
    expect(seite.textContent).toContain("Ein Teil der App konnte ohne Netz nicht geladen werden");
    expect(seite.textContent).toContain("Deine Daten und dein Einsatz sind unversehrt");
    expect(seite.textContent).toMatch(/Seite neu laden oder online verbinden/);
    expect(screen.getByRole("button", { name: "Seite neu laden" })).toBeTruthy();
    // Kein Rat zum Löschen, auch nicht hinter einem Aufklapper.
    expect(seite.textContent).not.toMatch(/Löschen…|löschen|Endgültig/);
    expect(screen.queryByRole("button", { name: "Endgültig löschen" })).toBeNull();
    expect(localStorage.getItem("eeb.einsaetze.v1")).toBe("[1]");
  });

  it("„Seite neu laden“ lädt neu und behält die zuletzt geöffnete Sammlung, damit der Einsatz danach wieder aufgeht", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    localStorage.setItem("eeb.letzterEinsatz.v1", JSON.stringify({ id: "s1", um: Date.now() }));
    const reload = vi.fn();
    vi.stubGlobal("location", { ...window.location, reload, assign: vi.fn(), pathname: "/" });
    render(<Fehlerfaenger><Bombe text="Failed to fetch dynamically imported module: x.js" /></Fehlerfaenger>);
    screen.getByRole("button", { name: "Seite neu laden" }).click();
    expect(reload).toHaveBeenCalled();
    expect(localStorage.getItem("eeb.letzterEinsatz.v1")).not.toBeNull();
  });

  it("sagt, wenn das Gerät selbst kein Netz meldet", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    render(<Fehlerfaenger><Bombe text="Load failed" /></Fehlerfaenger>);
    expect(screen.getByRole("alert").textContent).toContain("Das Gerät meldet gerade keine Verbindung");
  });

  it("ein echter Absturz behält den bisherigen Schirm: zuerst neu laden, dann die Löschwege", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(<Fehlerfaenger><Bombe text="Cannot read properties of undefined (reading 'code')" /></Fehlerfaenger>);
    const seite = screen.getByRole("alert");
    expect(seite.textContent).not.toContain("ohne Netz");
    expect(screen.getByRole("button", { name: "Neu laden" })).toBeTruthy();
    // Das Löschen ist nicht die erste Empfehlung: „Zuerst neu laden“ steht vor dem Satz zum Löschen eines Einsatzes.
    const text = seite.textContent!;
    expect(text.indexOf("Zuerst neu laden")).toBeGreaterThan(-1);
    expect(text.indexOf("Zuerst neu laden")).toBeLessThan(text.indexOf("Löschen…"));
  });
});

function bogenOrt(ort: string, aendern?: (b: ReturnType<typeof neuerBogen>) => void) {
  const b = neuerBogen();
  b.einheit.hierarchie[0]!.name = ort;
  aendern?.(b);
  return b;
}


// ---------------------------------------------------------------------------------------- Speicher voll

/** Speicher bis auf wenige Zeichen füllen (die App rechnet mit SPEICHER_GRENZE_ZEICHEN). */
function speicherVollFuellen() {
  const rest = SPEICHER_GRENZE_ZEICHEN - 50 - speicherBelegung()!.belegt;
  localStorage.setItem("fueller", "y".repeat(Math.max(0, rest)));
  expect(speicherBelegung()!.anteil).toBeGreaterThanOrEqual(0.995);
}

describe("R21-H7, S5: Warnzeile bei vollem Speicher", () => {
  it("nennt in zwei kurzen Sätzen, was ist und was jetzt zählt; die Wege stehen hinter „Mehr dazu“", () => {
    const s = einsatzAnlegen("Archiv", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenOrt("Albstadt"));
    speicherVollFuellen();
    render(<SpeicherWarnung stand={1} />);
    const warnung = screen.getByRole("status");
    const kurz = warnung.querySelector(":scope > p")!.textContent!;
    expect(kurz).toBe("⚠ Gerätespeicher ist voll: 100 % — nichts wird mehr gespeichert. Erst sichern.");
    expect(kurz.length).toBeLessThan(100); // bei 360 px höchstens drei Zeilen
    const mehr = warnung.querySelector<HTMLDetailsElement>("details.hinweis-mehr")!;
    expect(mehr.open).toBe(false);
    expect(mehr.textContent).toContain("Platz schafft nur Löschen");
    expect(mehr.textContent).toMatch(/Belegt: 100 % \(/);
  });
});
