import { describe, it, expect } from "vitest";
import type { Fahrzeug } from "../model";
import { OrganisationsTyp } from "../model";
import { fahrzeugSymbolSvg, grundzeichenFuer } from "./taktische-zeichen";

describe("grundzeichenFuer()", () => {
  it("erkennt Anhänger (auch vor einem enthaltenen WLF-Treffer)", () => {
    expect(grundzeichenFuer("Anh Plattform")).toBe("anhaenger");
    expect(grundzeichenFuer("Auflieger Sattelzug")).toBe("anhaenger");
    expect(grundzeichenFuer("Anh WLF-Zubehör")).toBe("anhaenger");
  });

  it("erkennt Wasserfahrzeuge", () => {
    expect(grundzeichenFuer("MzAB Mehrzweckarbeitsboot")).toBe("wasserfahrzeug");
  });

  it("erkennt Wechsellader", () => {
    expect(grundzeichenFuer("LKW WLF Wechsellader")).toBe("wechsellader");
  });

  it("erkennt geländegängige Kraftfahrzeuge am Kuerzel gl", () => {
    expect(grundzeichenFuer("LKW LK gl")).toBe("kraftfahrzeug-gelaendegaengig");
    expect(grundzeichenFuer("MTW gl")).toBe("kraftfahrzeug-gelaendegaengig");
  });

  it("nutzt sonst das landgebundene Kraftfahrzeug", () => {
    expect(grundzeichenFuer("FmKW")).toBe("kraftfahrzeug-landgebunden");
    expect(grundzeichenFuer("")).toBe("kraftfahrzeug-landgebunden");
  });
});

describe("fahrzeugSymbolSvg()", () => {
  const svg = (f: Fahrzeug, org = OrganisationsTyp.THW) => fahrzeugSymbolSvg(f, org);

  it("liefert ein SVG mit THW-Blau und der Kurz-Beschriftung im Zeichen", () => {
    const s = svg({ typ: { code: 1 } }); // FmKW
    expect(s.startsWith("<?xml")).toBe(true);
    expect(s).toContain("<svg");
    expect(s).toContain("#003399"); // THW-Blau
    expect(s).toContain("FmKW");
  });

  it("registriert den Font nicht mit und ersetzt Roboto Slab durch Roboto", () => {
    const s = svg({ typ: { freitext: "MzKW" } });
    expect(s).not.toContain("@font-face");
    expect(s).not.toContain("Roboto Slab");
    expect(s).toContain("Roboto");
  });

  it("kürzt das Anh-Präfix in der Beschriftung (Anh 2t wird 2t)", () => {
    const s = svg({ typ: { code: 40 } }); // Anh 2t
    expect(s).toContain("2t");
    expect(s).not.toContain("Anh 2t");
  });

  it("lässt zu lange Kurzzeichen unbeschriftet (nur die Silhouette bleibt)", () => {
    const s = svg({ typ: { freitext: "Schreitbagger" } });
    expect(s).not.toContain("<text");
  });

  it("färbt das Zeichen je Organisation (Feuerwehr ungleich THW-Blau)", () => {
    const fw = svg({ typ: { freitext: "LF" } }, OrganisationsTyp.FEUERWEHR);
    expect(fw).not.toContain("#003399");
  });

  it("rendert auch ohne bekannte Organisation ein neutrales Zeichen", () => {
    const s = svg({ typ: { freitext: "MZF" } }, OrganisationsTyp.SONSTIGE);
    expect(s).toContain("<svg");
  });
});
