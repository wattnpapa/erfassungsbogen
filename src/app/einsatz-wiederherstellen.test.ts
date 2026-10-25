/**
 * Audit Runde 5, R5-D2: „Wiederherstellen" löschte eine länger als 90 Tage
 * ruhende Sammlung im selben Augenblick endgültig. Geprüft wird der Weg über
 * den echten Kern.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AUFRAEUM_FRIST_MS,
  EinsatzArt,
  einsatzAnlegen,
  einsatzLoeschen,
  einsatzWiederherstellen as kernWiederherstellen,
  einsaetzeLaden,
  einsaetzePapierkorb,
  einsaetzeAusJson,
  speicherhuelleSetzen,
} from "@bos/meldekopf/einsaetze";
import { einsatzWiederherstellen, ruhtSchonLange } from "./einsatz-wiederherstellen";

const TAG = 24 * 60 * 60 * 1000;
const SCHLUESSEL = "eeb.einsaetze.v1";

class MemStorage {
  m = new Map<string, string>();
  getItem(k: string) {
    return this.m.has(k) ? this.m.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, String(v));
  }
}

let mem: MemStorage;
const START = new Date("2026-10-06T12:00:00Z").getTime();

/** Sammlung, die vor `tage` Tagen zuletzt geändert wurde, im Speicher von Hand datiert. */
function ruhendeSammlung(tage: number): string {
  const s = einsatzAnlegen("Altlage Frühjahr", EinsatzArt.EINSATZ);
  const liste = einsaetzeAusJson(mem.getItem(SCHLUESSEL));
  liste.find((x) => x.id === s.id)!.geaendert = START - tage * TAG;
  mem.setItem(SCHLUESSEL, JSON.stringify(liste));
  return s.id;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(START);
  mem = new MemStorage();
  speicherhuelleSetzen(mem);
});
afterEach(() => {
  speicherhuelleSetzen(null);
  vi.useRealTimers();
});

describe("einsatzWiederherstellen (R5-D2)", () => {
  it("Der Kern allein löscht die ruhende Sammlung beim Zurückholen endgültig", () => {
    const id = ruhendeSammlung(85);
    einsatzLoeschen(id);
    vi.setSystemTime(START + 6 * TAG); // sechs Tage später: 91 Tage ohne Änderung
    expect(einsaetzePapierkorb().map((s) => s.id)).toEqual([id]);
    kernWiederherstellen(id);
    expect(einsaetzeLaden()).toHaveLength(0); // der Befund
  });

  it("Mit der Schicht bleibt die Sammlung in der Liste, auch beim nächsten Lesen", () => {
    const id = ruhendeSammlung(85);
    einsatzLoeschen(id);
    vi.setSystemTime(START + 6 * TAG);
    expect(einsatzWiederherstellen(id)).toBe(true);
    expect(einsaetzeLaden().map((s) => s.id)).toEqual([id]);
    expect(einsaetzePapierkorb()).toHaveLength(0);
    // Die Frist beginnt neu: erst 90 Tage später fällt sie
    vi.setSystemTime(START + 6 * TAG + AUFRAEUM_FRIST_MS - TAG);
    expect(einsaetzeLaden()).toHaveLength(1);
    vi.setSystemTime(START + 6 * TAG + AUFRAEUM_FRIST_MS + TAG);
    expect(einsaetzeLaden()).toHaveLength(0);
  });

  it("Eine frische Sammlung kommt unverändert zurück; unbekannte ID ist kein Fehler", () => {
    const s = einsatzAnlegen("Hochwasser", EinsatzArt.EINSATZ);
    einsatzLoeschen(s.id);
    expect(einsatzWiederherstellen(s.id)).toBe(true);
    expect(einsaetzeLaden().map((x) => x.id)).toEqual([s.id]);
    expect(einsatzWiederherstellen("gibt-es-nicht")).toBe(false);
  });

  it("ruhtSchonLange meldet ab 60 Tagen Ruhe", () => {
    expect(ruhtSchonLange({ geaendert: START - 59 * TAG }, START)).toBe(false);
    expect(ruhtSchonLange({ geaendert: START - 60 * TAG }, START)).toBe(true);
  });
});
