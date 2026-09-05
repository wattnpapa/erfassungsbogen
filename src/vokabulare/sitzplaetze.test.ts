import { describe, it, expect } from "vitest";
import type { Fahrzeug } from "../model";
import { THW_FAHRZEUGTYPEN } from "./thw";
import { sitzplaetzeAusFreitext, sitzplaetzeFuer, sitzplatzBilanz } from "./sitzplaetze";

const code = (c: number): Fahrzeug => ({ typ: { code: c } });
const text = (t: string): Fahrzeug => ({ typ: { freitext: t } });

describe("sitzplaetzeFuer()", () => {
  it("liest die Sitzplätze aus dem Fahrzeug-Vokabular", () => {
    expect(sitzplaetzeFuer(code(4), THW_FAHRZEUGTYPEN)).toBe(9); // GKW 1+8
    expect(sitzplaetzeFuer(code(10), THW_FAHRZEUGTYPEN)).toBe(3); // LKW Lkr gl 1+2
  });

  it("zählt Anhänger mit null Plätzen, nicht als unbekannt", () => {
    expect(sitzplaetzeFuer(code(44), THW_FAHRZEUGTYPEN)).toBe(0); // Anh Plattform
  });

  it("gibt undefined für Fahrzeugtypen ohne hinterlegte Zahl", () => {
    expect(sitzplaetzeFuer(code(24), THW_FAHRZEUGTYPEN)).toBeUndefined(); // MTW gl
    expect(sitzplaetzeFuer(code(999), THW_FAHRZEUGTYPEN)).toBeUndefined();
  });

  it("greift bei Freitext-Fahrzeugen auf die Kurzzeichen-Tabelle zurück", () => {
    expect(sitzplaetzeFuer(text("LF 20"), THW_FAHRZEUGTYPEN)).toBe(9);
    expect(sitzplaetzeFuer(text("Bus"), THW_FAHRZEUGTYPEN)).toBeUndefined();
  });

  it("zählt den MTW OV mit Gruppenbesatzung — als Code wie als Freitext", () => {
    // Der MTW OV steht seit 2026-09-05 im Vokabular; Alt-Bögen tragen ihn als
    // Freitext. Beide Wege müssen dieselbe Zahl liefern, sonst springt der
    // Sanitycheck je nach Herkunft des Bogens unterschiedlich an.
    expect(sitzplaetzeFuer(code(27), THW_FAHRZEUGTYPEN)).toBe(9);
    expect(sitzplaetzeFuer(text("MTW OV"), THW_FAHRZEUGTYPEN)).toBe(9);
  });

  it("zählt MzKW und MzGW mit ihrer Doppelkabine (1+6)", () => {
    expect(sitzplaetzeFuer(code(25), THW_FAHRZEUGTYPEN)).toBe(7); // MzKW
    expect(sitzplaetzeFuer(code(26), THW_FAHRZEUGTYPEN)).toBe(7); // MzGW
    // Auch als Freitext geschrieben — nicht als Gruppenbesatzung durchrutschen.
    expect(sitzplaetzeFuer(text("MzKW"), THW_FAHRZEUGTYPEN)).toBe(7);
    expect(sitzplaetzeFuer(text("MzGW"), THW_FAHRZEUGTYPEN)).toBe(7);
  });
});

describe("sitzplaetzeAusFreitext()", () => {
  it("kennt die Normbesatzungen der Feuerwehr", () => {
    expect(sitzplaetzeAusFreitext("HLF 20")).toBe(9); // Gruppe
    expect(sitzplaetzeAusFreitext("TSF-W")).toBe(6); // Staffel
    expect(sitzplaetzeAusFreitext("DLK 23/12")).toBe(3); // Trupp
  });

  it("unterscheidet ELW 1 und ELW 2", () => {
    expect(sitzplaetzeAusFreitext("ELW 1")).toBe(4);
    expect(sitzplaetzeAusFreitext("ELW 2")).toBe(7);
  });

  it("erkennt Anhänger vor dem Fahrzeug-Kurzzeichen im Namen", () => {
    // „Anh SW" darf nicht als Schlauchwagen mit Truppbesatzung durchgehen.
    expect(sitzplaetzeAusFreitext("Anh SW")).toBe(0);
    expect(sitzplaetzeAusFreitext("Anh OV (Plane)")).toBe(0);
  });

  it("behandelt Bindestrich als Worttrenner", () => {
    expect(sitzplaetzeAusFreitext("GW-San")).toBe(3);
  });

  it("schweigt bei allem, was nicht eindeutig ist", () => {
    expect(sitzplaetzeAusFreitext("RTB 2")).toBeUndefined(); // Boot
    expect(sitzplaetzeAusFreitext("Feldkochherd")).toBeUndefined();
    expect(sitzplaetzeAusFreitext("")).toBeUndefined();
  });
});

describe("sitzplatzBilanz()", () => {
  it("summiert die Plätze und meldet die Lücke", () => {
    // Der gemeldete Fall: FGr W (B) — 10 Helfer, ein LKW Lkr gl und ein Anhänger.
    const b = sitzplatzBilanz([code(10), code(44)], THW_FAHRZEUGTYPEN, 10);
    expect(b).toEqual({ plaetze: 3, unbekannt: 0, benoetigt: 10, fehlend: 7 });
  });

  it("meldet keine Lücke, wenn die Plätze reichen", () => {
    expect(sitzplatzBilanz([code(4)], THW_FAHRZEUGTYPEN, 9).fehlend).toBe(0);
  });

  it("hält sich heraus, sobald ein Fahrzeug unbekannt ist", () => {
    // Das unbekannte Fahrzeug könnte das Defizit auffangen — also nicht warnen.
    const b = sitzplatzBilanz([code(10), code(24)], THW_FAHRZEUGTYPEN, 10);
    expect(b.unbekannt).toBe(1);
    expect(b.fehlend).toBe(0);
    expect(b.plaetze).toBe(3);
  });

  it("liefert für einen Bogen ohne Fahrzeuge eine leere Bilanz", () => {
    expect(sitzplatzBilanz([], THW_FAHRZEUGTYPEN, 0)).toEqual({
      plaetze: 0,
      unbekannt: 0,
      benoetigt: 0,
      fehlend: 0,
    });
  });
});

describe("THW_FAHRZEUGTYPEN", () => {
  it("kürzt den Ladekran mit Lkr ab", () => {
    expect(THW_FAHRZEUGTYPEN.find((e) => e.code === 9)?.kurz).toBe("LKW Lkr");
    expect(THW_FAHRZEUGTYPEN.find((e) => e.code === 10)?.kurz).toBe("LKW Lkr gl");
  });

  it("führt den MTW OV mit eigener Kurzform", () => {
    expect(THW_FAHRZEUGTYPEN.find((e) => e.code === 27)?.kurz).toBe("MTW OV");
  });

  it("hinterlegt für jeden Anhänger null Sitzplätze", () => {
    const anhaenger = THW_FAHRZEUGTYPEN.filter((e) => e.kurz.startsWith("Anh "));
    expect(anhaenger.length).toBeGreaterThan(0);
    expect(anhaenger.every((e) => e.sitzplaetze === 0)).toBe(true);
  });
});
