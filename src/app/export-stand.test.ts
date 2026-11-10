/**
 * Export-Stand des Meldekopfs: Was beim letzten Export in der Sammlung stand,
 * zählt danach nicht mehr als neu — und zwar über die Kennung der Meldung,
 * nicht über ihre Empfangszeit. Ein hereinimportierter Bogen mit alter
 * Empfangszeit ist für den Stab trotzdem neu.
 */

import { describe, it, expect, beforeEach } from "vitest";
import type { Erfassungsbogen } from "@bos/eeb-format/model";
import { MeldeStatus, einheitSchluessel, type MeldeEintrag } from "@bos/meldekopf/einsaetze";
import { neuerBogen } from "./hilfen";
import { aenderungenSeit, type ExportStand } from "./export-stand";

function bogen(name: string): Erfassungsbogen {
  const b = neuerBogen();
  b.einheit.hierarchie[0]!.name = name;
  return b;
}

function eintrag(id: string, name: string, empfangenAm: number): MeldeEintrag {
  const b = bogen(name);
  return { id, einheitSchluessel: einheitSchluessel(b.einheit), empfangenAm, quelle: "scan", status: MeldeStatus.ANWESEND, bogen: b };
}

/** Der Logik-Lauf hat kein DOM — ein Speicher im Arbeitsspeicher reicht (wie in absenderkarte.test.ts). */
class MemStorage {
  private m = new Map<string, string>();
  get length() {
    return this.m.size;
  }
  clear() {
    this.m.clear();
  }
  getItem(k: string) {
    return this.m.has(k) ? this.m.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, String(v));
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
  key(i: number) {
    return [...this.m.keys()][i] ?? null;
  }
}

beforeEach(() => {
  (globalThis as { localStorage?: Storage }).localStorage = new MemStorage() as unknown as Storage;
});

describe("Änderungen an bekannten Einheiten seit dem Stand (Audit Runde 4, R4-K1)", () => {

  it("liest Stände ohne Zustand weiter über die Vermerke (ältere Weitergaben)", () => {
    const a = eintrag("m1", "Wardenburg", 1000);
    a.vermerke = [{ zeit: 5000, text: "Abgerückt" }];
    const alt: ExportStand = { zeitpunkt: 4000, eintragIds: ["m1"] };
    expect(aenderungenSeit([a], alt)).toMatchObject({ anzahl: 1, arten: ["Abrücken"] });
  });
});
