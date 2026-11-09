/**
 * Einsatzbeginn und Funkrufname aus der Übergabe: gesetzt wird nur, wo hier
 * noch nichts steht (Audit Runde 7, R7-K5).
 */
import { beforeEach, describe, expect, it } from "vitest";
import { einsatzbeginnLaden, einsatzFunkrufLaden, einsatzFunkrufSetzen } from "./lagemonitor-beginn";
import { lageAngabenUebernehmen } from "./lage-angaben";

class MemStorage {
  private m = new Map<string, string>();
  get length() { return this.m.size; }
  clear() { this.m.clear(); }
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
}

beforeEach(() => {
  Object.defineProperty(globalThis, "localStorage", { value: new MemStorage(), configurable: true, writable: true });
});

describe("Lage-Angaben der Übergabe", () => {

  it("setzt beides auf dem zweiten Gerät und sagt es in der Quittung", () => {
    const satz = lageAngabenUebernehmen("e1", { beginn: Date.UTC(2026, 9, 23, 8, 0), funkruf: "Salus Führung 1" }, ["e1"]);
    expect(einsatzFunkrufLaden("e1")).toBe("Salus Führung 1");
    expect(einsatzbeginnLaden("e1")).toBe(Date.UTC(2026, 9, 23, 8, 0));
    expect(satz).toContain("Für den Lagemonitor übernommen");
    expect(satz).toContain("Salus Führung 1");
  });

  it("überschreibt nie einen von Hand gesetzten Wert, nennt aber die Abweichung", () => {
    einsatzFunkrufSetzen("e1", "Eigener Name", ["e1"]);
    const satz = lageAngabenUebernehmen("e1", { funkruf: "Anderer Name", beginn: 7 }, ["e1"]);
    expect(einsatzFunkrufLaden("e1")).toBe("Eigener Name");
    expect(einsatzbeginnLaden("e1")).toBe(7); // der Beginn war noch frei
    expect(satz).toContain("Funkrufname der Datei weicht von deinem gesetzten Wert ab");
  });

  it("sagt nichts ohne Angaben", () => {
    expect(lageAngabenUebernehmen("e1", undefined, ["e1"])).toBe("");
  });
});
