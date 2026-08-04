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
import { describe, expect, it } from "vitest";
import { ANZEIGE_MODI } from "./anzeige-modus";

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
