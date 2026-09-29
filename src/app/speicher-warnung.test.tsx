/**
 * Speicheranzeige und -warnung (Audit Runde 2, R2-O7): nie über 100 %, die
 * Warnung auch außerhalb der Datensicherung, und sie nennt, wo der Platz steckt.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { EinsatzArt, einsatzAnlegen, meldungHinzufuegen } from "@bos/meldekopf/einsaetze";
import { SPEICHER_GRENZE_ZEICHEN, speicherBelegung, speicherText } from "./eintrag-zeiten";
import { SpeicherWarnung } from "./speicher-warnung";
import { neuerBogen } from "./hilfen";

describe("Speicheranzeige", () => {
  beforeEach(() => localStorage.clear());

  it("rechnet in Zeichen gegen die Grenze und bleibt bei 100 %", () => {
    expect(speicherText({ belegt: SPEICHER_GRENZE_ZEICHEN * 2, grenze: SPEICHER_GRENZE_ZEICHEN })).toBe("100 % (5 von 5 Mio. Zeichen)");
    localStorage.setItem("x", "a".repeat(1_000_000));
    const b = speicherBelegung()!;
    expect(b.belegt).toBe(1_000_001);
    expect(Math.round(b.anteil * 100)).toBe(20);
  });

  it("schweigt bei wenig Belegung", () => {
    render(<SpeicherWarnung stand={1} />);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("warnt ab 80 % und nennt die größte Sammlung", () => {
    const s = einsatzAnlegen("Hochwasser Weser", EinsatzArt.EINSATZ);
    const b = neuerBogen();
    b.einheit.hierarchie[0]!.name = "x".repeat(Math.floor(SPEICHER_GRENZE_ZEICHEN * 0.2));
    meldungHinzufuegen(s.id, b);
    // Bis 85 % auffüllen — die Sammlung selbst belegt ihren Namen mehrfach (Bogen, Schlüssel).
    const rest = Math.floor(SPEICHER_GRENZE_ZEICHEN * 0.85) - speicherBelegung()!.belegt;
    localStorage.setItem("fueller", "y".repeat(rest));

    render(<SpeicherWarnung stand={2} />);

    const text = screen.getByRole("status").textContent!;
    expect(text).toMatch(/Gerätespeicher zu \d+ %/);
    expect(text).toMatch(/Am meisten belegen: „Hochwasser Weser" \(\d+ %\)/);
    expect(text).toMatch(/Platz schafft nur Löschen/);
  });
});
