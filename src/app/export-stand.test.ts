/**
 * Export-Stand des Meldekopfs: Was beim letzten Export in der Sammlung stand,
 * zählt danach nicht mehr als neu — und zwar über die Kennung der Meldung,
 * nicht über ihre Empfangszeit. Ein hereinimportierter Bogen mit alter
 * Empfangszeit ist für den Stab trotzdem neu.
 */

import { describe, it, expect, beforeEach } from "vitest";
import type { Erfassungsbogen } from "@bos/eeb-format/model";
import { EinsatzArt, MeldeStatus, einheitSchluessel, type Einsatzsammlung, type MeldeEintrag } from "@bos/meldekopf/einsaetze";
import { neuerBogen } from "./hilfen";
import {
  exportSammlung,
  exportStandLaden,
  exportVermerken,
  lageblattStandLaden,
  lageblattVermerken,
  neueEintraege,
  seitdemText,
  weitergabeStandLaden,
  weitergabeVermerken,
} from "./export-stand";

function bogen(name: string): Erfassungsbogen {
  const b = neuerBogen();
  b.einheit.hierarchie[0]!.name = name;
  return b;
}

function eintrag(id: string, name: string, empfangenAm: number): MeldeEintrag {
  const b = bogen(name);
  return { id, einheitSchluessel: einheitSchluessel(b.einheit), empfangenAm, quelle: "scan", status: MeldeStatus.ANWESEND, bogen: b };
}

function sammlung(id: string, eintraege: MeldeEintrag[]): Einsatzsammlung {
  return { id, name: "Hochwasser", art: EinsatzArt.EINSATZ, angelegt: 1, geaendert: 1, eintraege };
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

describe("exportStandLaden / exportVermerken", () => {
  it("kennt vor dem ersten Export keinen Stand", () => {
    expect(exportStandLaden("e1")).toBeNull();
  });

  it("merkt sich nach dem Export alle Meldungen der Sammlung samt Zeitpunkt", () => {
    const s = sammlung("e1", [eintrag("m1", "Wardenburg", 1000), eintrag("m2", "Hatten", 2000)]);
    exportVermerken(s, undefined, 5000);
    expect(exportStandLaden("e1")).toEqual({ zeitpunkt: 5000, eintragIds: ["m1", "m2"] });
  });

  it("hält die Stände mehrerer Einsätze auseinander", () => {
    exportVermerken(sammlung("e1", [eintrag("m1", "Wardenburg", 1)]), undefined, 10);
    exportVermerken(sammlung("e2", [eintrag("m9", "Hatten", 1)]), undefined, 20);
    expect(exportStandLaden("e1")!.eintragIds).toEqual(["m1"]);
    expect(exportStandLaden("e2")!.eintragIds).toEqual(["m9"]);
  });

  it("wirft Stände endgültig gelöschter Einsätze weg, wenn die vorhandenen genannt werden", () => {
    exportVermerken(sammlung("alt", [eintrag("m1", "Wardenburg", 1)]));
    exportVermerken(sammlung("e2", [eintrag("m2", "Hatten", 1)]), ["e2"]);
    expect(exportStandLaden("alt")).toBeNull();
    expect(exportStandLaden("e2")).not.toBeNull();
  });

  it("überlebt einen beschädigten Speichereintrag", () => {
    localStorage.setItem("eeb.export-stand.v1", "{kaputt");
    expect(exportStandLaden("e1")).toBeNull();
    localStorage.setItem("eeb.export-stand.v1", JSON.stringify({ e1: { zeitpunkt: "gestern", eintragIds: ["m1"] }, e2: { zeitpunkt: 3, eintragIds: ["m2", 7] } }));
    expect(exportStandLaden("e1")).toBeNull();
    expect(exportStandLaden("e2")).toEqual({ zeitpunkt: 3, eintragIds: ["m2"] });
  });
});

describe("lageblattStandLaden / lageblattVermerken (Audit Runde 2, R2-A3)", () => {
  it("merkt sich das Lageblatt getrennt vom Export — „nur neue Bögen“ verschiebt es nicht", () => {
    const s = sammlung("e1", [eintrag("m1", "Wardenburg", 1000)]);
    expect(lageblattStandLaden("e1")).toBeNull();
    lageblattVermerken(s, undefined, 7000);
    expect(lageblattStandLaden("e1")).toEqual({ zeitpunkt: 7000, eintragIds: ["m1"] });
    expect(exportStandLaden("e1")).toBeNull();
    const danach = sammlung("e1", [eintrag("m1", "Wardenburg", 1000), eintrag("m2", "Hatten", 8000)]);
    expect(seitdemText(neueEintraege(danach.eintraege, lageblattStandLaden("e1")).length)).toBe("seitdem 1 neue Meldung");
    expect(seitdemText(0)).toBe("seitdem keine neue Meldung");
  });
});

describe("weitergabeStandLaden / weitergabeVermerken (Audit Runde 2, R2-W5)", () => {
  it("merkt sich die Weitergabe der ganzen Sammlung getrennt von Export und Lageblatt", () => {
    const s = sammlung("e1", [eintrag("m1", "Wardenburg", 1000)]);
    expect(weitergabeStandLaden("e1")).toBeNull();
    weitergabeVermerken(s, undefined, 9000);
    expect(weitergabeStandLaden("e1")).toEqual({ zeitpunkt: 9000, eintragIds: ["m1"] });
    expect(exportStandLaden("e1")).toBeNull();
    expect(lageblattStandLaden("e1")).toBeNull();
    expect(localStorage.getItem("eeb.weitergabe-stand.v1")).not.toBeNull();
  });
});

describe("neueEintraege / exportSammlung", () => {
  const alt = eintrag("m1", "Wardenburg", 1000);
  // Späterer Eintrag, aber mit ÄLTERER Empfangszeit — so kommt ein Bogen an,
  // den ein anderer Meldekopf früher empfangen und per Sammel-PDF weitergegeben hat.
  const importiert = eintrag("m2", "Hatten", 500);
  const folge = eintrag("m3", "Wardenburg", 3000);

  it("liefert ohne Stand alles — vor dem ersten Export ist jeder Bogen neu", () => {
    expect(neueEintraege([alt, importiert], null)).toEqual([alt, importiert]);
  });

  it("lässt nur weg, was beim letzten Export schon da war — unabhängig von der Empfangszeit", () => {
    const stand = exportVermerken(sammlung("e1", [alt]), undefined, 2000);
    expect(neueEintraege([alt, importiert, folge], stand).map((e) => e.id)).toEqual(["m2", "m3"]);
  });

  it("schneidet die Sammlung nur beim Umfang „neue“ zu", () => {
    const s = sammlung("e1", [alt, folge]);
    const stand = exportVermerken(sammlung("e1", [alt]));
    expect(exportSammlung(s, "alle", stand)).toBe(s);
    const teil = exportSammlung(s, "neue", stand);
    expect(teil.id).toBe("e1");
    expect(teil.eintraege.map((e) => e.id)).toEqual(["m3"]);
  });
});
