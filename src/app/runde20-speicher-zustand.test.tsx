/**
 * Runde 20, Block Speicher, Zustand: Verhalten bei vollem Gerätespeicher (jsdom, Speicher mit fester Kapazität).
 * Die Ablage des geschlossenen Bogens (R20-D1) steht in runde20-speicher-d1.test.tsx.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { sicherungErstellen, sicherungQuittungText, sicherungVermerkFehlte, SICHERUNG_EREIGNIS } from "./sicherung";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  localStorage.clear();
  sessionStorage.clear();
});

function belegung(): number {
  let n = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)!;
    n += k.length + (localStorage.getItem(k) ?? "").length;
  }
  return n;
}

/** Kapazität des Speichers festlegen: Schreiben, das darüber käme, wirft wie der Browser. */
function kapazitaet(grenze: number): void {
  const echt = Storage.prototype.setItem;
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, k: string, v: string) {
    const alt = this.getItem(k);
    const neu = belegung() - (alt === null ? 0 : k.length + alt.length) + k.length + v.length;
    if (neu > grenze) throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
    echt.call(this, k, v);
  });
}

describe("R20-O2 Sicherung bei vollem Speicher und Übergabe-Liste", () => {
  it("meldet den fehlenden Vermerk wie die Exporte und zeichnet Ansichten neu", () => {
    const gehoert = vi.fn();
    window.addEventListener(SICHERUNG_EREIGNIS, gehoert);
    sicherungErstellen();
    expect(sicherungVermerkFehlte()).toBe(false);
    expect(sicherungQuittungText("x.json", false, false)).not.toContain("Vermerk");
    kapazitaet(belegung());
    sicherungErstellen(new Date(Date.now() * 10)); // ein Zeichen länger als der gespeicherte Zeitpunkt: passt nicht mehr hinein
    expect(sicherungVermerkFehlte()).toBe(true);
    expect(sicherungQuittungText("x.json", false, sicherungVermerkFehlte())).toContain("Vermerk nicht gespeichert (Speicher voll)");
    expect(gehoert).toHaveBeenCalledTimes(2);
    window.removeEventListener(SICHERUNG_EREIGNIS, gehoert);
  });
});
