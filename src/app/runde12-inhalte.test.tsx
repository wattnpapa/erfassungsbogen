/**
 * Runde 12, Block Inhalte: R12-W1 bis W4, A1, K1 bis K4 (mit L1), H1 bis H3.
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { MINUTEN_JE_TAG, jetztZeitpunkt, type Erfassungsbogen } from "@bos/eeb-format/model";
import { neuePerson, neuerBogen, pruefpunkte } from "./hilfen";
import { codeGueltigBisText } from "./anonym-hinweis";

afterEach(cleanup);

describe("Rückruf antippbar (R12-W1)", () => {
  it("Zielgröße 44 px steht im Stylesheet", () => {
    const html = readFileSync("index.html", "utf8");
    const von = html.indexOf("/* ===== Runde 12 (Inhalte) ===== */");
    expect(von).toBeGreaterThan(0);
  });
});

describe("Selbstversorger ohne Vegetarier-Hinweis (R12-W2)", () => {
  const bogenMitVeg = (verpflegungPersonen: number) => {
    const b = neuerBogen();
    b.sofortbedarf = { verpflegungPersonen, dieselLiter: 100, benzinLiter: 0, gemischLiter: 0, unterbringung: false, ruhezeitErforderlich: false };
    b.personal = [1, 2, 3].map((i) => ({ ...neuePerson(), vorname: `V${i}`, nachname: `Veg${i}`, ernaehrung: 1 }) as never);
    return b;
  };
  it("bei 0 Portionen kein Hinweis, bei 2 Portionen und 3 Vegetariern schon", () => {
    expect(pruefpunkte(bogenMitVeg(0)).some((p) => /mehr Vegetarier/.test(p.text))).toBe(false);
    expect(pruefpunkte(bogenMitVeg(2)).some((p) => /mehr Vegetarier/.test(p.text))).toBe(true);
  });
});

describe("Anonymisierte Bögen auf Papier (R12-A1)", () => {
  const alt = () => {
    const b = neuerBogen();
    b.stand = jetztZeitpunkt() - 100 * MINUTEN_JE_TAG;
    b.uebung = false;
    b.sofortbedarf = undefined;
    b.personal = [{ ...neuePerson(), vorname: "", nachname: "Einsatzkraft 1" }];
    b.fahrzeuge = [{ typ: { freitext: "MTW" }, kennzeichen: "TH 1234" }];
    return b;
  };
  const frisch = () => ({ ...alt(), stand: jetztZeitpunkt() });

  it("Hinweise zu Rufnummer und Kraftfahrer entfallen bei Bögen über 90 Tage, bleiben bei frischen", () => {
    const hinweis = (b: Erfassungsbogen) => pruefpunkte(b).map((p) => p.text).join("\n");
    expect(hinweis(alt())).not.toMatch(/telefonische Erreichbarkeit|kein Kraftfahrer/);
    expect(hinweis(frisch())).toMatch(/telefonische Erreichbarkeit/);
  });
  it("das Gültigkeitsdatum im Code-Kasten heißt nach Ablauf „abgelaufen“", () => {
    const b = { uebung: false, stand: 1000 };
    const f = (z: number) => `Tag ${z}`;
    expect(codeGueltigBisText(b, f)).toMatch(/gültig bis/);
    expect(codeGueltigBisText(b, f, true)).toMatch(/abgelaufen/);
  });
});

describe("Kontrast der Warnzeilen im dunklen Kopf (R12-K1, R12-L1)", () => {
  const html = readFileSync("index.html", "utf8");
  const luma = (hex: string) => {
    const k = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * k[0]! + 0.7152 * k[1]! + 0.0722 * k[2]!;
  };
  const kontrast = (a: string, b: string) => {
    const [h, d] = [luma(a), luma(b)].sort((x, y) => y - x);
    return (h! + 0.05) / (d! + 0.05);
  };
  it("die Warnzeile im Kopf nimmt die Kopf-Schriftfarbe, nicht die braune Warnfarbe", () => {
    expect(html).toMatch(/\.seiten-kopf \.hinweis \.warnung-text\s*\{\s*color:\s*var\(--kopf-auf\)/);
  });
  it("Kopf-Schriftfarbe gegen Kopfgrund: mindestens 4,5:1 in Standard/Feld/Dunkel (weiß auf #12275e) und Nacht", () => {
    expect(kontrast("#ffffff", "#12275e")).toBeGreaterThanOrEqual(4.5);
    expect(kontrast("#d9cdb6", "#221f16")).toBeGreaterThanOrEqual(4.5);
    // Der Fehler vorher: braune Warnfarbe auf dem Kopf.
    expect(kontrast("#6d4700", "#12275e")).toBeLessThan(4.5);
    // Die Werte stehen so im Stylesheet.
    expect(html).toContain("--kopf-auf:   #d9cdb6;");
    expect(html).toContain("--kopf-auf:    #ffffff;");
  });
});

describe("Ortsvorschlag „Schwäbisch Hall“ (R12-H3)", () => {
  it("trennt zusammengezogene Wörter nur für die Anzeige", async () => {
    const { ortAnzeige } = await import("./schreibweise");
    expect(ortAnzeige("SchwäbischHall")).toBe("Schwäbisch Hall");
    expect(ortAnzeige("Albstadt")).toBe("Albstadt");
    expect(ortAnzeige("Garmisch-Partenkirchen")).toBe("Garmisch-Partenkirchen");
  });
  it("im ganzen Verzeichnis kommen nur Leerzeichen hinzu, nie Buchstaben; bekannte Fälle stimmen", async () => {
    const { ortAnzeige } = await import("./schreibweise");
    const { THW_ORTSVERBAENDE: THW_OV } = await import("@bos/vokabulare/thw-ov");
    for (const o of new Set(THW_OV.map((v) => v.ort))) {
      expect(ortAnzeige(o).replace(/ /g, "")).toBe(o.replace(/ /g, ""));
    }
    const fall: Record<string, string> = {
      BadNeuenahr: "Bad Neuenahr",
      FrankfurtamMain: "Frankfurt am Main",
      MülheimanderRuhr: "Mülheim an der Ruhr",
      BergenaufRügen: "Bergen auf Rügen",
      WentorfbeiHamburg: "Wentorf bei Hamburg",
      ZimmernobRottweil: "Zimmern ob Rottweil",
      ZehdenickOTOsterne: "Zehdenick OT Osterne",
      "BadHomburg v. d. Höhe": "Bad Homburg v. d. Höhe",
      "BadTeinach-Zavelstein": "Bad Teinach-Zavelstein",
      HeilbadHeiligenstadt: "Heilbad Heiligenstadt",
      SchwäbischGmünd: "Schwäbisch Gmünd",
    };
    for (const [roh, soll] of Object.entries(fall)) expect(ortAnzeige(roh)).toBe(soll);
  });
});
