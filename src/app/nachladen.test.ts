/**
 * Die Meldung, die im Einsatz aus einem gescheiterten Nachladen wird. Geprüft
 * werden die Wortlaute aller drei Browser-Familien: das ist der einzige Faden,
 * an dem die Erkennung hängt, und er reißt still, wenn ein Browser umformuliert.
 */

import { describe, it, expect } from "vitest";
import { fehlerText, istNachladeFehler } from "./nachladen";

const NACHLADE_FEHLER = [
  // Firefox — der Wortlaut aus der Meldung, die aus dem Einsatz kam.
  "error loading dynamically imported module: https://erfassungsbogen.app/assets/pdf-BjxkdKlJ.js",
  // Chrome/Edge
  "Failed to fetch dynamically imported module: https://erfassungsbogen.app/assets/pdf-BjxkdKlJ.js",
  // Safari
  "Importing a module script failed.",
  // Vite-Preload-Helfer
  "Unable to preload CSS for /assets/pdf-BjxkdKlJ.css",
];

describe("istNachladeFehler", () => {
  it.each(NACHLADE_FEHLER)("erkennt %s", (meldung) => {
    expect(istNachladeFehler(new Error(meldung))).toBe(true);
  });

  it("hält andere Fehler heraus", () => {
    expect(istNachladeFehler(new Error("Bogen ohne Personal"))).toBe(false);
    expect(istNachladeFehler("abgebrochen")).toBe(false);
  });
});

describe("fehlerText", () => {
  it("sagt beim Nachladefehler, was zu tun ist — statt der Browser-Meldung", () => {
    const text = fehlerText(new Error(NACHLADE_FEHLER[0]));
    expect(text).toContain("neu laden");
    expect(text).toContain("offline");
    expect(text).not.toContain("module");
  });

  it("reicht jeden anderen Fehler unverändert durch", () => {
    expect(fehlerText(new Error("Kein Platz auf dem Gerät"))).toBe("Kein Platz auf dem Gerät");
    expect(fehlerText("abgebrochen")).toBe("abgebrochen");
  });
});
