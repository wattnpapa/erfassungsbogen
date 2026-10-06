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
  aenderungenSeit,
  nachtragEintraege,
  type ExportStand,
  exportSammlung,
  exportStandLaden,
  exportVermerken,
  kenntnisStandLaden,
  kenntnisVermerken,
  lageblattStandLaden,
  lageblattVermerken,
  letzterStandMit,
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
    expect(exportStandLaden("e1", "csv")).toBeNull();
  });

  it("merkt sich nach dem Export alle Meldungen der Sammlung samt Zeitpunkt", () => {
    const s = sammlung("e1", [eintrag("m1", "Wardenburg", 1000), eintrag("m2", "Hatten", 2000)]);
    exportVermerken(s, "csv", undefined, 5000);
    expect(exportStandLaden("e1", "csv")).toMatchObject({ zeitpunkt: 5000, eintragIds: ["m1", "m2"] });
  });

  it("hält die Stände mehrerer Einsätze auseinander", () => {
    exportVermerken(sammlung("e1", [eintrag("m1", "Wardenburg", 1)]), "csv", undefined, 10);
    exportVermerken(sammlung("e2", [eintrag("m9", "Hatten", 1)]), "csv", undefined, 20);
    expect(exportStandLaden("e1", "csv")!.eintragIds).toEqual(["m1"]);
    expect(exportStandLaden("e2", "csv")!.eintragIds).toEqual(["m9"]);
  });

  it("wirft Stände endgültig gelöschter Einsätze weg, wenn die vorhandenen genannt werden", () => {
    exportVermerken(sammlung("alt", [eintrag("m1", "Wardenburg", 1)]), "csv");
    exportVermerken(sammlung("e2", [eintrag("m2", "Hatten", 1)]), "csv", ["e2"]);
    expect(exportStandLaden("alt", "csv")).toBeNull();
    expect(exportStandLaden("e2", "csv")).not.toBeNull();
  });

  it("überlebt einen beschädigten Speichereintrag", () => {
    localStorage.setItem("eeb.export-stand.v2", "{kaputt");
    expect(exportStandLaden("e1", "csv")).toBeNull();
    localStorage.setItem(
      "eeb.export-stand.v2",
      JSON.stringify({ e1: { csv: { zeitpunkt: "gestern", eintragIds: ["m1"] } }, e2: { csv: { zeitpunkt: 3, eintragIds: ["m2", 7] } } }),
    );
    expect(exportStandLaden("e1", "csv")).toBeNull();
    expect(exportStandLaden("e2", "csv")).toEqual({ zeitpunkt: 3, eintragIds: ["m2"] });
  });
});

describe("lageblattStandLaden / lageblattVermerken (Audit Runde 2, R2-A3)", () => {
  it("merkt sich das Lageblatt getrennt vom Export — „nur neue Bögen“ verschiebt es nicht", () => {
    const s = sammlung("e1", [eintrag("m1", "Wardenburg", 1000)]);
    expect(lageblattStandLaden("e1")).toBeNull();
    lageblattVermerken(s, undefined, 7000);
    expect(lageblattStandLaden("e1")).toMatchObject({ zeitpunkt: 7000, eintragIds: ["m1"] });
    expect(exportStandLaden("e1", "pdf")).toBeNull();
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
    expect(weitergabeStandLaden("e1")).toMatchObject({ zeitpunkt: 9000, eintragIds: ["m1"] });
    expect(exportStandLaden("e1", "pdf")).toBeNull();
    expect(lageblattStandLaden("e1")).toBeNull();
    expect(localStorage.getItem("eeb.weitergabe-stand.v1")).not.toBeNull();
  });
});

describe("kenntnisStandLaden / kenntnisVermerken (Audit Runde 3, R3-K1)", () => {
  it("merkt sich die Kenntnisnahme je Sammlung, getrennt von den übrigen Ständen, und räumt verschwundene weg", () => {
    const s = sammlung("e1", [eintrag("m1", "Wardenburg", 1000)]);
    expect(kenntnisStandLaden("e1")).toBeNull();
    kenntnisVermerken(s, undefined, 5000);
    kenntnisVermerken(sammlung("e2", []), undefined, 6000);
    expect(kenntnisStandLaden("e1")).toEqual({ zeitpunkt: 5000, eintragIds: ["m1"] });
    expect(exportStandLaden("e1", "pdf")).toBeNull();
    expect(localStorage.getItem("eeb.kenntnis-stand.v1")).not.toBeNull();
    const danach = sammlung("e1", [eintrag("m1", "Wardenburg", 1000), eintrag("m2", "Wardenburg", 800)]);
    // Über die Kennung, nicht die Zeit: die ältere Empfangszeit ist trotzdem neu.
    expect(neueEintraege(danach.eintraege, kenntnisStandLaden("e1")).map((e) => e.id)).toEqual(["m2"]);
    kenntnisVermerken(danach, ["e1"], 7000);
    expect(kenntnisStandLaden("e2")).toBeNull();
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
    const stand = exportVermerken(sammlung("e1", [alt]), "csv", undefined, 2000);
    expect(neueEintraege([alt, importiert, folge], stand).map((e) => e.id)).toEqual(["m2", "m3"]);
  });

  it("schneidet die Sammlung nur beim Umfang „neue“ zu", () => {
    const s = sammlung("e1", [alt, folge]);
    const stand = exportVermerken(sammlung("e1", [alt]), "csv");
    expect(exportSammlung(s, "alle", stand)).toBe(s);
    const teil = exportSammlung(s, "neue", stand);
    expect(teil.id).toBe("e1");
    expect(teil.eintraege.map((e) => e.id)).toEqual(["m3"]);
  });
});

describe("Stände je Format (Audit Runde 4, R4-W2)", () => {
  it("verbraucht mit einem Format nicht den Bezugspunkt der anderen", () => {
    const a = eintrag("m1", "Wardenburg", 1000);
    const b = eintrag("m2", "Hatten", 2000);
    exportVermerken(sammlung("e1", [a]), "csv", undefined, 5000);
    expect(exportStandLaden("e1", "csv")).not.toBeNull();
    expect(exportStandLaden("e1", "xlsx")).toBeNull();
    expect(exportStandLaden("e1", "pdf")).toBeNull();
    // Excel hat noch keinen Stand: für das Format ist alles neu.
    expect(exportSammlung(sammlung("e1", [a, b]), "neue", exportStandLaden("e1", "xlsx")).eintraege.map((e) => e.id)).toEqual(["m1", "m2"]);
    expect(exportSammlung(sammlung("e1", [a, b]), "neue", exportStandLaden("e1", "csv")).eintraege.map((e) => e.id)).toEqual(["m2"]);
    // Danach Excel: die anderen Stände bleiben.
    exportVermerken(sammlung("e1", [a, b]), "xlsx", undefined, 6000);
    expect(exportStandLaden("e1", "csv")!.eintragIds).toEqual(["m1"]);
    expect(exportStandLaden("e1", "xlsx")!.eintragIds).toEqual(["m1", "m2"]);
  });

  it("lässt den Stand der Weitergabe und des Lageblatts unberührt (und umgekehrt)", () => {
    const s = sammlung("e1", [eintrag("m1", "Wardenburg", 1000)]);
    weitergabeVermerken(s, undefined, 4000);
    lageblattVermerken(s, undefined, 4500);
    expect(exportStandLaden("e1", "pdf")).toBeNull();
    exportVermerken(s, "pdf", undefined, 5000);
    expect(weitergabeStandLaden("e1")!.zeitpunkt).toBe(4000);
  });

  it("übernimmt den gemeinsamen Merker der Runden 1–3 nicht — lieber einmal zu viel liefern", () => {
    localStorage.setItem("eeb.export-stand.v1", JSON.stringify({ e1: { zeitpunkt: 3, eintragIds: ["m1"] } }));
    expect(exportStandLaden("e1", "pdf")).toBeNull();
    exportVermerken(sammlung("e1", [eintrag("m1", "Wardenburg", 1)]), "pdf");
    expect(localStorage.getItem("eeb.export-stand.v1")).toBeNull();
  });
});

describe("Änderungen an bekannten Einheiten seit dem Stand (Audit Runde 4, R4-K1)", () => {
  it("zählt ein Abrücken als Änderung, und „Rückgängig“ nimmt es wieder weg", () => {
    const a = eintrag("m1", "Wardenburg", 1000);
    const b = eintrag("m2", "Hatten", 2000);
    const stand = lageblattVermerken(sammlung("e1", [a, b]), undefined, 3000);
    expect(aenderungenSeit([a, b], stand)).toEqual({ anzahl: 0, arten: [], einheiten: [] });
    expect(seitdemText(0, aenderungenSeit([a, b], stand))).toBe("seitdem keine neue Meldung");

    a.status = MeldeStatus.ABGERUECKT;
    a.abgerueckAm = 4000;
    const aend = aenderungenSeit([a, b], stand);
    expect(aend).toEqual({ anzahl: 1, arten: ["Abrücken"], einheiten: [a.einheitSchluessel] });
    expect(seitdemText(0, aend)).toBe("seitdem 1 Änderung (Abrücken)");
    expect(seitdemText(1, aend)).toBe("seitdem 1 neue Meldung und 1 Änderung (Abrücken)");

    // Rückgängig: der Zustand von vorher — auch wenn ein Vermerk dazukam.
    a.status = MeldeStatus.ANWESEND;
    delete a.abgerueckAm;
    a.vermerke = [{ zeit: 4000, text: "Abgerückt" }, { zeit: 4100, text: "Wieder als anwesend geführt" }];
    expect(aenderungenSeit([a, b], stand).anzahl).toBe(0);
  });

  it("zählt Zug, Auftrag und Eintreffzeit, je Art genannt", () => {
    const a = eintrag("m1", "Wardenburg", 1000);
    const stand = lageblattVermerken(sammlung("e1", [a]), undefined, 3000);
    a.zugEtikett = "1. TZ";
    a.notiz = "Deich Nord";
    a.eingetroffenAm = 1500;
    expect(aenderungenSeit([a], stand)).toMatchObject({ anzahl: 3, arten: ["Zug", "Auftrag", "Eintreffzeit"] });
    expect(JSON.stringify(localStorage.getItem("eeb.lageblatt-stand.v1"))).not.toContain("Deich");
  });

  it("nimmt in den Nachtrag die geltende Fassung jeder geänderten Einheit mit", () => {
    const a = eintrag("m1", "Wardenburg", 1000);
    const b = eintrag("m2", "Hatten", 2000);
    const stand = exportVermerken(sammlung("e1", [a, b]), "csv", undefined, 3000);
    a.status = MeldeStatus.ABGERUECKT;
    a.abgerueckAm = 4000;
    const c = eintrag("m3", "Ganderkesee", 5000);
    expect(nachtragEintraege([a, b, c], stand).map((e) => e.id)).toEqual(["m1", "m3"]);
    expect(exportSammlung(sammlung("e1", [a, b, c]), "neue", stand).eintraege.map((e) => e.id)).toEqual(["m1", "m3"]);
    // Nur Abrücken, sonst nichts: der Nachtrag ist nicht leer.
    expect(nachtragEintraege([a, b], stand).map((e) => e.id)).toEqual(["m1"]);
  });

  it("liest Stände ohne Zustand weiter über die Vermerke (ältere Weitergaben)", () => {
    const a = eintrag("m1", "Wardenburg", 1000);
    a.vermerke = [{ zeit: 5000, text: "Abgerückt" }];
    const alt: ExportStand = { zeitpunkt: 4000, eintragIds: ["m1"] };
    expect(aenderungenSeit([a], alt)).toMatchObject({ anzahl: 1, arten: ["Abrücken"] });
  });
});

/** Audit Runde 4, R4-D3: Gibt es von einer Meldung, die entfernt werden soll, noch eine Kopie? */
describe("letzterStandMit()", () => {
  beforeEach(() => {
    (globalThis as { localStorage?: Storage }).localStorage = new MemStorage() as unknown as Storage;
  });

  it("nennt den jüngsten Stand, in dem eine der Meldungen stand — sonst null", () => {
    const s = sammlung("e1", [eintrag("m1", "Wardenburg", 1), eintrag("m2", "Hatten", 2)]);
    expect(letzterStandMit("e1", ["m1"])).toBeNull();

    exportVermerken(s, "csv", undefined, 100);
    lageblattVermerken(s, undefined, 300);
    expect(letzterStandMit("e1", ["m1"])).toBe(300);
    expect(letzterStandMit("e1", ["m9"])).toBeNull();
    // Eine später dazugekommene Meldung stand in keinem Stand.
    expect(letzterStandMit("e1", ["m3", "m9"])).toBeNull();
    expect(letzterStandMit("andere", ["m1"])).toBeNull();
  });
});
