/**
 * Zwischenstand des Papier-Abgleichs (Audit Runde 7, R7-S1/R7-G1): Eingaben
 * gehen bei Neuladen, „Später" und Verlassen nicht still verloren.
 */
import { beforeEach, describe, expect, it } from "vitest";
import {
  abgleichEntwurfLaden,
  abgleichEntwurfLoeschen,
  abgleichEntwurfSpeichern,
  abgleichSchluessel,
  abgleichZeilenMitEntwurf,
  geaenderteZeilen,
  type AbgleichZeile,
} from "./papier-abgleich-entwurf";

const zeile = (id: string, teil: Partial<AbgleichZeile> = {}): AbgleichZeile => ({
  eintragId: id,
  name: `Einheit ${id}`,
  eingetroffen: "",
  abgerueckt: false,
  abgerueckAm: "",
  zug: "",
  notiz: "",
  nummer: "",
  ...teil,
});

class MemStorage {
  private m = new Map<string, string>();
  get length() { return this.m.size; }
  clear() { this.m.clear(); }
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
}
let sessionStorage: MemStorage;
beforeEach(() => {
  sessionStorage = new MemStorage();
  Object.defineProperty(globalThis, "sessionStorage", { value: sessionStorage, configurable: true, writable: true });
});

describe("Zwischenstand des Papier-Abgleichs", () => {
  it("legt nichts ab, solange nichts eingetragen ist", () => {
    const basis = [zeile("a"), zeile("b")];
    abgleichEntwurfSpeichern("e1", basis, basis);
    expect(sessionStorage.getItem(abgleichSchluessel("e1"))).toBeNull();
    expect(abgleichEntwurfLaden("e1")).toEqual([]);
  });

  it("legt ab, was eingetragen ist, und stellt es über die Ausgangszeilen wieder her", () => {
    const basis = [zeile("a"), zeile("b")];
    const eingaben = [zeile("a", { nummer: "77", abgerueckt: true }), zeile("b")];
    abgleichEntwurfSpeichern("e1", eingaben, basis);
    expect(geaenderteZeilen(eingaben, basis)).toBe(1);
    const geladen = abgleichEntwurfLaden("e1");
    expect(geladen).toHaveLength(1); // nur die Zeile mit Eingaben
    const zurueck = abgleichZeilenMitEntwurf(basis, geladen);
    expect(zurueck[0]).toMatchObject({ nummer: "77", abgerueckt: true });
    expect(zurueck[1]).toEqual(basis[1]);
  });

  it("nimmt nur Einheiten wieder auf, die noch offen sind, und behält deren Namen aus der Ausgangslage", () => {
    abgleichEntwurfSpeichern("e1", [zeile("a", { nummer: "5", name: "alt" }), zeile("weg", { nummer: "9" })], [zeile("a"), zeile("weg")]);
    const basis = [zeile("a", { name: "Neu benannt" })];
    const zurueck = abgleichZeilenMitEntwurf(basis, abgleichEntwurfLaden("e1"));
    expect(zurueck).toEqual([expect.objectContaining({ eintragId: "a", nummer: "5", name: "Neu benannt" })]);
  });

  it("entfernt den Zwischenstand wieder, wenn alles zurückgenommen ist, und auf Wunsch", () => {
    const basis = [zeile("a")];
    abgleichEntwurfSpeichern("e1", [zeile("a", { notiz: "Pumpe" })], basis);
    expect(sessionStorage.getItem(abgleichSchluessel("e1"))).not.toBeNull();
    abgleichEntwurfSpeichern("e1", basis, basis);
    expect(sessionStorage.getItem(abgleichSchluessel("e1"))).toBeNull();
    abgleichEntwurfSpeichern("e1", [zeile("a", { zug: "1. Zug" })], basis);
    abgleichEntwurfLoeschen("e1");
    expect(abgleichEntwurfLaden("e1")).toEqual([]);
  });

  it("liest Unbrauchbares als leer, ohne zu werfen", () => {
    sessionStorage.setItem(abgleichSchluessel("e1"), "{kaputt");
    expect(abgleichEntwurfLaden("e1")).toEqual([]);
    sessionStorage.setItem(abgleichSchluessel("e1"), JSON.stringify([{ eintragId: 3 }, null, "x"]));
    expect(abgleichEntwurfLaden("e1")).toEqual([]);
  });

  it("hält die Einsätze auseinander", () => {
    const basis = [zeile("a")];
    abgleichEntwurfSpeichern("e1", [zeile("a", { nummer: "1" })], basis);
    expect(abgleichEntwurfLaden("e2")).toEqual([]);
  });
});
