/**
 * Schonende Hülle und Lese-Zwischenspeicher (Audit Runde 3, R3-O2): Lesen
 * schreibt nicht, und ein scheiterndes Zurückschreiben lässt die Liste stehen.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  EinsatzArt,
  einsatzAnlegen,
  einsatzLoeschen,
  einsaetzeZuJson,
  speicherhuelleSetzen,
} from "@bos/meldekopf/einsaetze";
import {
  huellenZugriffe,
  leseSchreibFehler,
  leseSchreibFehlerZuruecksetzen,
  nurLesend,
  schonendeHuelle,
} from "./speicher-schonend";
import { einsaetzeLaden, einsaetzeLesenZuruecksetzen, einsaetzePapierkorb } from "./einsaetze-lesen";

const SCHLUESSEL = "eeb.einsaetze.v1";

class ZaehlSpeicher {
  m = new Map<string, string>();
  schreib = 0;
  gesperrt = false;
  getItem(k: string) {
    return this.m.has(k) ? this.m.get(k)! : null;
  }
  setItem(k: string, v: string) {
    if (this.gesperrt) throw new DOMException("voll", "QuotaExceededError");
    this.schreib++;
    this.m.set(k, String(v));
  }
}

let mem: ZaehlSpeicher;

beforeEach(() => {
  mem = new ZaehlSpeicher();
  speicherhuelleSetzen(schonendeHuelle(mem, einsaetzeZuJson([])));
  leseSchreibFehlerZuruecksetzen();
  einsaetzeLesenZuruecksetzen();
});

describe("schonendeHuelle", () => {
  it("überspringt das Schreiben desselben Textes", () => {
    const h = schonendeHuelle(mem);
    h.setItem("k", "a");
    h.setItem("k", "a");
    expect(mem.schreib).toBe(1);
    h.setItem("k", "b");
    expect(mem.schreib).toBe(2);
    mem.m.set("k", "fremd"); // anderes Fenster
    expect(h.getItem("k")).toBe("fremd");
    h.setItem("k", "b");
    expect(mem.schreib).toBe(3);
  });

  it("schreibt auf leerem Speicher keine leere Liste", () => {
    const h = schonendeHuelle(mem, "[]");
    expect(h.getItem("k")).toBeNull();
    h.setItem("k", "[]");
    expect(mem.schreib).toBe(0);
  });

  it("verschluckt den Fehler nur beim bloßen Lesen und meldet ihn", () => {
    const h = schonendeHuelle(mem);
    mem.gesperrt = true;
    expect(() => h.setItem("k", "a")).toThrow();
    expect(leseSchreibFehler()).toBeNull();
    expect(() => nurLesend(() => h.setItem("k", "a"))).not.toThrow();
    expect(leseSchreibFehler()).not.toBeNull();
    mem.gesperrt = false;
    h.setItem("k", "b");
    expect(leseSchreibFehler()).toBeNull();
  });
});

describe("einsaetzeLaden über die schonende Hülle", () => {
  it("schreibt beim Lesen nicht", () => {
    einsatzAnlegen("Hochwasser", EinsatzArt.EINSATZ);
    einsatzAnlegen("Sturm", EinsatzArt.EINSATZ);
    const vorher = mem.schreib;
    for (let i = 0; i < 5; i++) {
      einsaetzeLaden();
      einsaetzePapierkorb();
    }
    expect(mem.schreib).toBe(vorher);
  });

  it("zeigt die Liste, wenn das Zurückschreiben der Frist scheitert, und meldet den Speicher", () => {
    const s = einsatzAnlegen("Altlast", EinsatzArt.EINSATZ);
    einsatzAnlegen("Laufend", EinsatzArt.EINSATZ);
    einsatzLoeschen(s.id);
    // Papierkorb-Frist abgelaufen: der Kern will beim Lesen bereinigen.
    const roh = JSON.parse(mem.getItem(SCHLUESSEL)!) as { id: string; geloeschtAm?: number }[];
    roh.find((x) => x.id === s.id)!.geloeschtAm = Date.now() - 40 * 86_400_000;
    mem.m.set(SCHLUESSEL, JSON.stringify(roh));
    mem.gesperrt = true;

    expect(einsaetzeLaden().map((x) => x.name)).toEqual(["Laufend"]);
    expect(einsaetzePapierkorb()).toEqual([]);
    expect(leseSchreibFehler()).not.toBeNull();
    // Eine Änderung meldet den Fehler weiter dort, wo gehandelt wird.
    expect(() => einsatzAnlegen("Neu", EinsatzArt.EINSATZ)).toThrow();
  });

  it("liest denselben Text nicht erneut ein, wohl aber einen geänderten", () => {
    einsatzAnlegen("Hochwasser", EinsatzArt.EINSATZ);
    const erste = einsaetzeLaden();
    const zugriffe = huellenZugriffe();
    const zweite = einsaetzeLaden();
    expect(huellenZugriffe()).toBe(zugriffe);
    expect(zweite).not.toBe(erste); // neues Array, React sieht die Änderung
    expect(zweite).toEqual(erste);
    expect(Object.isFrozen(zweite[0])).toBe(true);

    // Ein anderes Fenster schreibt: das neue Ergebnis kommt.
    einsatzAnlegen("Sturm", EinsatzArt.EINSATZ);
    expect(einsaetzeLaden().map((x) => x.name).sort()).toEqual(["Hochwasser", "Sturm"]);
    const roh = JSON.parse(mem.getItem(SCHLUESSEL)!) as { name: string }[];
    roh[0]!.name = "Umbenannt";
    mem.m.set(SCHLUESSEL, JSON.stringify(roh));
    expect(einsaetzeLaden().map((x) => x.name)).toContain("Umbenannt");
  });
});
