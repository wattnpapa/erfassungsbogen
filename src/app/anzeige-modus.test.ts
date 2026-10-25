/**
 * Der Anzeigemodus belegt die App-Token neu (index.html, .dunkel-/feld-/
 * nacht-modus). In der iOS- und Android-App rechnen Fläche und Schrift aber aus
 * der jeweiligen Plattformpalette (--ios-* / --md-*): fehlt zu einem Modus der
 * passende Plattformblock, bleibt dort die helle Systempalette stehen, während
 * die App-Token schon dunkel rechnen — genau das halb angewandte Bild, das
 * anzeige-modus.ts im Kopf ausdrücklich ausschließt. Der Nacht-Modus sah so in
 * der Android-App weiß aus (Rückmeldung Anwender, August 2026).
 *
 * Der Test hängt an ANZEIGE_MODI: ein neuer Modus fällt hier auf, nicht erst
 * auf dem Gerät.
 */

import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ANZEIGE_MODI, anzeigeModus } from "./anzeige-modus";

const css = readFileSync(new URL("../../index.html", import.meta.url), "utf8");

describe("Anzeigemodi in der App-Oberfläche", () => {
  const modi = ANZEIGE_MODI.filter((m) => m.modus !== "standard");

  it.each(modi)("„$label“ belegt auch die Plattformpaletten neu", ({ modus }) => {
    for (const plattform of ["ios", "android"]) {
      expect(css, `.${modus}-modus.platform-${plattform} fehlt in index.html`).toContain(
        `.${modus}-modus.platform-${plattform}`,
      );
    }
  });
});

/**
 * Vorgabe aus der Systemeinstellung (Audit „Nacht und Sicht", N4): Der erste
 * Start bei Nacht begann mit einem weißen Bildschirm, obwohl das Telefon auf
 * dunkel stand. Ohne gespeicherte Wahl zählt jetzt prefers-color-scheme; eine
 * gespeicherte Wahl — auch „standard" — geht immer vor.
 *
 * Läuft in Node ohne DOM: anzeigeModus() liest nur globalThis.localStorage und
 * globalThis.matchMedia, beides wird hier nachgestellt.
 */
describe("Anzeigemodus — Vorgabe aus der Systemeinstellung", () => {
  function speicherMit(eintraege: Record<string, string>): void {
    const inhalt = new Map(Object.entries(eintraege));
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => inhalt.get(k) ?? null,
      setItem: (k: string, v: string) => void inhalt.set(k, v),
    });
  }
  function systemDunkel(matches: boolean): void {
    vi.stubGlobal("matchMedia", (abfrage: string) => ({ matches: abfrage.includes("dark") && matches }));
  }

  afterEach(() => vi.unstubAllGlobals());

  it("startet ohne gespeicherte Wahl dunkel, wenn das Gerät dunkel steht", () => {
    speicherMit({});
    systemDunkel(true);
    expect(anzeigeModus()).toBe("dunkel");
  });

  it("startet ohne gespeicherte Wahl hell, wenn das Gerät hell steht", () => {
    speicherMit({});
    systemDunkel(false);
    expect(anzeigeModus()).toBe("standard");
  });

  it("lässt eine gespeicherte Wahl vorgehen — auch „standard“ gegen ein dunkles Gerät", () => {
    systemDunkel(true);
    speicherMit({ "eeb.anzeigemodus.v1": "standard" });
    expect(anzeigeModus()).toBe("standard");
    speicherMit({ "eeb.anzeigemodus.v1": "nacht" });
    expect(anzeigeModus()).toBe("nacht");
    // Der Vorgänger-Schalter (nur Feld) zählt ebenfalls als getroffene Wahl.
    speicherMit({ "eeb.feldmodus.v1": "1" });
    expect(anzeigeModus()).toBe("feld");
  });

  it("kommt ohne matchMedia aus (alte Webviews)", () => {
    speicherMit({});
    vi.stubGlobal("matchMedia", undefined);
    expect(anzeigeModus()).toBe("standard");
  });

  it("wendet dieselbe Regel schon im Boot-Skript der index.html an", () => {
    // Sonst blitzte das Start-Gerüst bis zum Laden des Bundles hell auf —
    // genau der Kaltstart, den die Vorgabe vermeiden soll.
    expect(css).toMatch(/prefers-color-scheme: dark[^;]*\)\.matches\)\s*\n?\s*eebModus = "dunkel"/);
  });
});
