/**
 * Runde 13, Block Inhalte: Verhalten der Behebungen aus arbeitsablauf (W1 bis W6), fuehrungssicht (K1, K2),
 * analog-first (A1 bis A5) und feldtauglichkeit (H1 bis H3) — reine Logik, PDF-Text und Speicher.
 */
import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { verpflegungBogenText } from "./auswertung";
import { zettelPruefen } from "./entwurf";
import { falte, suchAlternativen, sucheForm, vokabRang } from "./schreibweise";

afterEach(() => localStorage.clear());

describe("R13-A1 „Abgerückt um“ vom Meldeblock", () => {
  const jetzt = new Date(2026, 9, 26, 10, 0).getTime();
  const an = new Date(2026, 9, 26, 5, 10).getTime();
  it("der Entwurf trägt „ab“ mit durch das Neuladen", () => {
    expect(zettelPruefen({ zeit: "05:10", ab: "06:00" })).toEqual({ zeit: "05:10", ab: "06:00" });
    expect(zettelPruefen({ ab: "6 Uhr" })).toBeUndefined();
  });
});

describe("R13-W4 Verpflegung bei 0 Portionen", () => {
  it("nennt „nicht angefordert“ und die Ernährung getrennt, ohne „0 Personen, davon …“", () => {
    expect(verpflegungBogenText(0, { vegetarisch: 3, vegan: 1 })).toBe("nicht angefordert (Ernährung der Personen: 3 vegetarisch, 1 vegan)");
    expect(verpflegungBogenText(0, { vegetarisch: 0, vegan: 0 })).toBe("nicht angefordert");
    expect(verpflegungBogenText(11, { vegetarisch: 3, vegan: 1 })).toBe("11 Personen, davon 3 vegetarisch, 1 vegan");
    expect(verpflegungBogenText(11, { vegetarisch: 0, vegan: 0 }, false)).toBe("11 Personen · Aufteilung vegetarisch/vegan: keine Angabe");
    expect(verpflegungBogenText(0, { vegetarisch: 3, vegan: 1 })).not.toMatch(/0 Personen/);
  });
});

describe("R13-H1 Einheitstyp-Suche", () => {
  const typen = [
    { kurz: "B (ASH)", name: "Bergungsgruppe (Abstützsystem Holz)" },
    { kurz: "ENT", name: "Einsatznachsorgeteam" },
    { kurz: "FGr F", name: "Fachgruppe Führungsunterstützung" },
    { kurz: "ZTr TZ", name: "Zugtrupp Technischer Zug" },
    { kurz: "B", name: "Bergungsgruppe" },
    { kurz: "FGr E", name: "Fachgruppe Elektroversorgung" },
    { kurz: "OV-Stab", name: "Stab des Ortsverbands" },
  ];
  const ordne = (suche: string) => {
    const alle = [suche, ...suchAlternativen(suche)];
    return typen
      .map((t, i) => ({ t, i, r: Math.min(...alle.map((s) => vokabRang(t.kurz, t.name, s))) }))
      .filter((x) => x.r < 3)
      .sort((a, b) => a.r - b.r || a.i - b.i)
      .map((x) => x.t.kurz);
  };
  it("„TZ“ nennt den Technischen Zug zuerst, die Treffer mitten im Wort danach", () => {
    const r = ordne("TZ");
    expect(r[0]).toBe("ZTr TZ");
    expect(r).toContain("B (ASH)");
    expect(r.indexOf("ZTr TZ")).toBeLessThan(r.indexOf("B (ASH)"));
  });
  it("„OV“ nennt den OV-Stab vor der Elektroversorgung", () => {
    const r = ordne("OV");
    expect(r[0]).toBe("OV-Stab");
    expect(r.indexOf("OV-Stab")).toBeLessThan(r.indexOf("FGr E"));
  });
  it("„BGr“, „1. BGr“, „1.BGr“ und „1. Bergungsgruppe“ finden die Bergungsgruppe, die ganze Bezeichnung zuerst", () => {
    for (const s of ["BGr", "1. BGr", "1.BGr", "2. Bergungsgruppe"]) {
      const r = ordne(s);
      expect(r[0], s).toBe("B");
      expect(r, s).toContain("B (ASH)");
    }
  });
  it("Kurzformen ergänzen nur: wer „Fachgruppe“ tippt, findet weiter alles", () => {
    expect(suchAlternativen("Fachgruppe")).toEqual([]);
    expect(ordne("Fachgruppe")).toEqual(["FGr F", "FGr E"]);
  });
});

describe("R13-H2 Ortssuche kennt Bindestrich und Leerzeichen als gleich", () => {
  it("sucheForm", () => {
    expect(sucheForm("Neu-Ulm")).toBe(sucheForm("Neu Ulm"));
    expect(sucheForm("Villingen-Schwenningen")).toBe(sucheForm("villingen schwenningen"));
    expect(sucheForm("Garmisch-Partenkirchen")).toBe("garmisch partenkirchen");
    expect(sucheForm("Biberach/Riß")).toBe(sucheForm("Biberach Riss"));
    // Die Faltung bleibt: Umlaute wie bisher.
    expect(sucheForm("Müllheim")).toBe(falte("Muellheim"));
  });
  it("„Baden Baden“ und „Neu Ulm“ liegen im Treffer, „Ulm“ nach wie vor auch", () => {
    const orte = ["Baden-Baden", "Neu-Ulm", "Ulm", "Hamburg-Altona"];
    const finde = (s: string) => orte.filter((o) => sucheForm(o).includes(sucheForm(s)));
    expect(finde("Baden Baden")).toEqual(["Baden-Baden"]);
    expect(finde("Neu Ulm")).toEqual(["Neu-Ulm"]);
    expect(finde("Ulm")).toEqual(["Neu-Ulm", "Ulm"]);
    expect(finde("Hamburg Altona")).toEqual(["Hamburg-Altona"]);
  });
});

describe("R13-H3 Autokorrektur aus bei Namen, Ort, Typ, Zug und Suche", () => {
  it("die gemeinsamen Eingabeattribute schalten Autokorrektur und Rechtschreibprüfung ab", () => {
    const q = readFileSync("src/app/schritte/bausteine.tsx", "utf8");
    expect(q).toMatch(/export const NAMEN_EINGABE = \{ autoCorrect: "off", spellCheck: false \} as const;/);
    expect(q).toMatch(/export const FREMDE_DATEN = \{ autoComplete: "off", autoCorrect: "off", spellCheck: false \} as const;/);
    // Das Vorschlagsfeld (Ort, Einheitstyp, Funktion, Beruf) trägt sie.
    expect(q).toContain("{...NAMEN_EINGABE}");
  });
});
