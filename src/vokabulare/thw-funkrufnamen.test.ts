import { describe, it, expect } from "vitest";
import { OrganisationsTyp } from "../model";
import { THW_EINHEITSTYPEN } from "./thw";
import {
  THW_TEILEINHEIT_KENNZAHLEN,
  THW_FAHRZEUG_KENNZAHLEN,
  TEILEINHEIT_KENNZAHL_JE_EINHEITSTYP,
  teileinheitKennzahl,
  type KennzahlEintrag,
} from "./thw-funkrufnamen";
import { THW_STAN_FAHRZEUGE, stanFahrzeugVorbelegung } from "./thw-stan-fahrzeuge";

const REFERENZ: [string, KennzahlEintrag[]][] = [
  ["THW_TEILEINHEIT_KENNZAHLEN", THW_TEILEINHEIT_KENNZAHLEN],
  ["THW_FAHRZEUG_KENNZAHLEN", THW_FAHRZEUG_KENNZAHLEN],
];

describe.each(REFERENZ)("Referenztabelle %s", (_name, tabelle) => {
  it("ist nicht leer", () => {
    expect(tabelle.length).toBeGreaterThan(0);
  });

  it("nutzt zweistellige Kennzahlen 10..99", () => {
    for (const e of tabelle) {
      expect(Number.isInteger(e.kennzahl)).toBe(true);
      expect(e.kennzahl).toBeGreaterThanOrEqual(10);
      expect(e.kennzahl).toBeLessThanOrEqual(99);
    }
  });

  it("hat nicht-leere Kurz- und Langbezeichnungen", () => {
    for (const e of tabelle) {
      expect(e.kurz.trim().length).toBeGreaterThan(0);
      expect(e.name.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("THW_TEILEINHEIT_KENNZAHLEN", () => {
  it("hat eindeutige Kennzahlen (jede Teileinheit-Zahl nur einmal)", () => {
    const zahlen = THW_TEILEINHEIT_KENNZAHLEN.map((e) => e.kennzahl);
    expect(new Set(zahlen).size).toBe(zahlen.length);
  });
});

describe("TEILEINHEIT_KENNZAHL_JE_EINHEITSTYP", () => {
  const bekannteCodes = new Set(THW_EINHEITSTYPEN.map((e) => e.code));
  const teileinheitZahlen = new Set(THW_TEILEINHEIT_KENNZAHLEN.map((e) => e.kennzahl));

  it("verweist nur auf existierende Einheitstyp-Codes", () => {
    for (const code of Object.keys(TEILEINHEIT_KENNZAHL_JE_EINHEITSTYP).map(Number)) {
      expect(bekannteCodes.has(code)).toBe(true);
    }
  });

  it("verwendet nur Kennzahlen aus der Taschenkarte", () => {
    for (const zahl of Object.values(TEILEINHEIT_KENNZAHL_JE_EINHEITSTYP)) {
      expect(teileinheitZahlen.has(zahl)).toBe(true);
    }
  });

  it("belegt Einheitstypen mit StAN-Fahrzeug-Vorbelegung möglichst mit einer Teileinheit-Zahl", () => {
    // Alle Einheitstypen mit Fahrzeug-Kennzahlen sollten auch eine Teileinheit-Zahl haben,
    // sonst entstünde ein Fahrzeug mit halbem Funkrufnamen.
    for (const code of Object.keys(THW_STAN_FAHRZEUGE).map(Number)) {
      const hatKennzahl = THW_STAN_FAHRZEUGE[code]!.some((v) => v.kennzahlen != null);
      if (hatKennzahl) {
        expect(teileinheitKennzahl(code), `Einheitstyp ${code}`).toBeDefined();
      }
    }
  });

  it("bildet FGr K (A) auf 18 ab (Beispiel aus der Doku: 18/13)", () => {
    const fgrKa = THW_EINHEITSTYPEN.find((e) => e.kurz === "FGr K (A)")!;
    expect(teileinheitKennzahl(fgrKa.code)).toBe(18);
  });
});

describe("StanFahrzeug-Kennzahlen", () => {
  it("hat pro Fahrzeug höchstens eine Kennzahl (Länge = anzahl)", () => {
    for (const vorgaben of Object.values(THW_STAN_FAHRZEUGE)) {
      for (const v of vorgaben) {
        if (v.kennzahlen) expect(v.kennzahlen.length).toBe(v.anzahl);
      }
    }
  });

  it("vergibt je Teileinheit keine Fahrzeug-Kennzahl doppelt", () => {
    for (const [code, vorgaben] of Object.entries(THW_STAN_FAHRZEUGE)) {
      if (teileinheitKennzahl(Number(code)) == null) continue;
      const alle = vorgaben.flatMap((v) => v.kennzahlen ?? []);
      expect(new Set(alle).size, `Einheitstyp ${code}`).toBe(alle.length);
    }
  });

  it("nutzt nur Fahrzeug-Kennzahlen aus der Taschenkarte", () => {
    const gueltig = new Set(THW_FAHRZEUG_KENNZAHLEN.map((e) => e.kennzahl));
    for (const vorgaben of Object.values(THW_STAN_FAHRZEUGE)) {
      for (const zahl of vorgaben.flatMap((v) => v.kennzahlen ?? [])) {
        expect(gueltig.has(zahl)).toBe(true);
      }
    }
  });
});

describe("stanFahrzeugVorbelegung — Funkrufname", () => {
  const einheitsTyp = (kurz: string) => ({ code: THW_EINHEITSTYPEN.find((e) => e.kurz === kurz)!.code });

  it("belegt den GKW der Bergungsgruppe mit Heros 22/51", () => {
    const fahrzeuge = stanFahrzeugVorbelegung(OrganisationsTyp.THW, einheitsTyp("B"));
    const gkw = fahrzeuge[0]!;
    expect(gkw.funkrufname).toEqual({ kennwort: { code: 1 }, eigenerStandort: true, teile: [22, 51] });
  });

  it("lässt Anhänger ohne Funkrufname", () => {
    const fahrzeuge = stanFahrzeugVorbelegung(OrganisationsTyp.THW, einheitsTyp("B"));
    const anhaenger = fahrzeuge[1]!; // Anh Plane/Spriegel
    expect(anhaenger.funkrufname).toBeUndefined();
  });

  it("belegt den FmKW der FGr K (A) mit 18/13 (Doku-Beispiel)", () => {
    const fahrzeuge = stanFahrzeugVorbelegung(OrganisationsTyp.THW, einheitsTyp("FGr K (A)"));
    expect(fahrzeuge[0]!.funkrufname?.teile).toEqual([18, 13]);
  });

  it("nummeriert zwei MTW der FGr K (B) fortlaufend (25, 26)", () => {
    const fahrzeuge = stanFahrzeugVorbelegung(OrganisationsTyp.THW, einheitsTyp("FGr K (B)"));
    const mtw = fahrzeuge.filter((f) => f.funkrufname?.teile[1] === 25 || f.funkrufname?.teile[1] === 26);
    expect(mtw.map((f) => f.funkrufname!.teile)).toEqual([[19, 25], [19, 26]]);
  });

  it("gibt der FGr BT keinen Funkrufnamen (nicht in der Taschenkarte)", () => {
    const fahrzeuge = stanFahrzeugVorbelegung(OrganisationsTyp.THW, einheitsTyp("FGr BT"));
    expect(fahrzeuge.every((f) => f.funkrufname == null)).toBe(true);
  });

  it("liefert für Nicht-THW nichts", () => {
    expect(stanFahrzeugVorbelegung(OrganisationsTyp.FEUERWEHR, { code: 4 })).toEqual([]);
  });
});
