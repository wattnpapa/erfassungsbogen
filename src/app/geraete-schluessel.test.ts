/**
 * Geräteschlüssel bei vollem Speicher (Audit Runde 3, R3-E1): die Übergabe
 * darf nie daran scheitern, dass der neue Schlüssel nicht gespeichert wird.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { zuHex } from "@bos/eeb-format/signatur";
import {
  geraeteSchluesselLoeschen,
  geraeteSchluesselNurSitzung,
  geraeteSchluesselPrivat,
  geraeteSchluesselSicherstellen,
} from "./geraete-schluessel";

class Speicher {
  m = new Map<string, string>();
  voll = false;
  getItem(k: string) {
    return this.m.has(k) ? this.m.get(k)! : null;
  }
  setItem(k: string, v: string) {
    if (this.voll) throw new DOMException("Setting the value of 'x' exceeded the quota.", "QuotaExceededError");
    this.m.set(k, v);
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
}

let s: Speicher;

beforeEach(() => {
  s = new Speicher();
  (globalThis as { localStorage?: unknown }).localStorage = s;
  geraeteSchluesselLoeschen();
});

describe("geraeteSchluesselSicherstellen", () => {
  it("speichert den neuen Schlüssel, wenn Platz ist", async () => {
    const k = await geraeteSchluesselSicherstellen();
    expect(s.getItem("eeb.geraeteschluessel.v1")).toBe(zuHex(k));
    expect(geraeteSchluesselNurSitzung()).toBe(false);
  });

  it("gibt bei vollem Speicher einen Sitzungsschlüssel und bleibt bei ihm", async () => {
    s.voll = true;
    const k1 = await geraeteSchluesselSicherstellen();
    expect(k1).toHaveLength(32);
    expect(geraeteSchluesselNurSitzung()).toBe(true);
    expect(geraeteSchluesselPrivat()).toEqual(k1);
    expect(await geraeteSchluesselSicherstellen()).toEqual(k1);
  });

  it("speichert den Sitzungsschlüssel, sobald wieder Platz ist", async () => {
    s.voll = true;
    const k1 = await geraeteSchluesselSicherstellen();
    s.voll = false;
    expect(await geraeteSchluesselSicherstellen()).toEqual(k1);
    expect(s.getItem("eeb.geraeteschluessel.v1")).toBe(zuHex(k1));
    expect(geraeteSchluesselNurSitzung()).toBe(false);
  });
});
