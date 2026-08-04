import { describe, it, expect } from "vitest";
import type { Einheit, Fahrzeug } from "../model";
import { OrganisationsTyp } from "../model";
import {
  THW_EINHEIT_ZEICHEN,
  THW_FAHRZEUG_ZEICHEN,
  einheitSymbolSvg,
  fahrzeugSymbolSvg,
  grundzeichenFuer,
  svgDataUrl,
} from "./taktische-zeichen";
import { TZ_SYMBOLE } from "../vokabulare/taktische-zeichen-symbole";
import { THW_EINHEITSTYPEN, THW_FAHRZEUGTYPEN } from "../vokabulare/thw";

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
    expect(grundzeichenFuer("FmKW")).toBe("kraftfahrzeug");
    expect(grundzeichenFuer("")).toBe("kraftfahrzeug");
  });
});

describe("Zeichensammlung", () => {
  // Diese Gruppe ist das Sicherheitsnetz der wöchentlichen Aktualisierung
  // (.github/workflows/taktische-zeichen.yml): benennt die Sammlung ein
  // Zeichen um oder entfernt es, muss der Lauf hier scheitern statt still
  // aufs Grundzeichen zurückzufallen.

  it("hat für jeden fest zugeordneten THW-Fahrzeugtyp ein Zeichen", () => {
    const fehlend = Object.entries(THW_FAHRZEUG_ZEICHEN)
      .filter(([, datei]) => !TZ_SYMBOLE[`THW_Fahrzeuge/${datei}`])
      .map(([code, datei]) => `${code} → ${datei}`);
    expect(fehlend).toEqual([]);
  });

  it("hat für jeden fest zugeordneten THW-Einheitstyp ein Zeichen", () => {
    const fehlend = Object.entries(THW_EINHEIT_ZEICHEN)
      .filter(([, datei]) => !TZ_SYMBOLE[`THW_Einheiten/${datei}`])
      .map(([code, datei]) => `${code} → ${datei}`);
    expect(fehlend).toEqual([]);
  });

  it("ordnet jedem THW-Vokabular-Eintrag ein Zeichen zu (oder bewusst keins)", () => {
    // Umgekehrte Richtung: neue Vokabular-Codes sollen nicht unbemerkt ohne
    // Zuordnung bleiben. Die vier Fahrzeugtypen ohne eigenes Zeichen
    // (Auflieger, Anh Plane/Spriegel, Anh BDF, Anh ASH) sind gewollt.
    const ohneZeichen = THW_FAHRZEUGTYPEN.filter((t) => !THW_FAHRZEUG_ZEICHEN[t.code!]).map((t) => t.kurz);
    expect(ohneZeichen).toEqual(["Auflieger", "Anh Plane/Spriegel", "Anh BDF", "Anh ASH"]);
    expect(THW_EINHEITSTYPEN.filter((t) => !THW_EINHEIT_ZEICHEN[t.code!])).toEqual([]);
  });

  it("findet für jede Organisation ein Rückfallzeichen", () => {
    // Prüft die Grundzeichen-Namen gegen die Bereiche jeder Organisation —
    // heißt „Kraftfahrzeug" upstream mal anders, fällt es hier auf.
    const orgs = Object.values(OrganisationsTyp).filter((o): o is OrganisationsTyp => typeof o === "number");
    for (const org of orgs) {
      for (const typ of ["Rätselfahrzeug", "Anhänger X", "Boot X", "WLF X", "Kfz gl X"]) {
        expect(fahrzeugSymbolSvg({ typ: { freitext: typ } }, org), `${org}/${typ}`).toContain("<svg");
      }
      for (const typ of ["Etwas", "Sonderzug", "Sonderstaffel", "Sondertrupp"]) {
        const e = { organisation: org, einheitsTyp: { freitext: typ }, hierarchie: [] } as unknown as Einheit;
        expect(einheitSymbolSvg(e), `${org}/${typ}`).toContain("<svg");
      }
    }
  });

  it("bringt keine eingebettete Schrift mit (sonst 26 kB je Zeichen)", () => {
    const gross = Object.entries(TZ_SYMBOLE).filter(([, svg]) => svg.length > 4000);
    expect(gross).toEqual([]);
    expect(Object.values(TZ_SYMBOLE).some((s) => s.includes("@font-face"))).toBe(false);
  });

  it("nennt nur von pdfmake registrierte Schriften", () => {
    expect(Object.values(TZ_SYMBOLE).some((s) => s.includes("Roboto Slab"))).toBe(false);
  });

  it("schreibt viewBox groß (in der data:-URL wird das SVG als XML gelesen)", () => {
    expect(Object.values(TZ_SYMBOLE).every((s) => !s.includes("viewbox="))).toBe(true);
  });
});

describe("fahrzeugSymbolSvg()", () => {
  const svg = (f: Fahrzeug, org = OrganisationsTyp.THW) => fahrzeugSymbolSvg(f, org);

  it("nutzt für einen bekannten THW-Typ das benannte Zeichen der Sammlung", () => {
    const s = svg({ typ: { code: 1 } }); // FmKW
    expect(s).toBe(TZ_SYMBOLE["THW_Fahrzeuge/FmKW"]);
    expect(s).toContain("#003399"); // THW-Blau
    expect(s).toContain("FmKW");
  });

  it("zeichnet den Anhänger 2t als solchen, nicht als Silhouette mit Aufdruck", () => {
    expect(svg({ typ: { code: 40 } })).toBe(TZ_SYMBOLE["THW_Fahrzeuge/Anhänger_2t"]);
  });

  it("beschriftet Typen ohne eigenes Zeichen statt sie namenlos zu lassen", () => {
    // Anh BDF hat kein eigenes Zeichen — dann lieber der Anhänger mit „BDF"
    // als ein nackter Anhänger, der von jedem anderen ununterscheidbar ist.
    const s = svg({ typ: { code: 54 } });
    expect(s).toContain(">BDF</text>");
  });

  it("findet ein Zeichen auch über den Freitext (Schreibweise egal)", () => {
    expect(svg({ typ: { freitext: "MzKW" } })).toBe(TZ_SYMBOLE["THW_Fahrzeuge/MzKW"]);
    expect(svg({ typ: { freitext: "mlw ii" } })).toBe(TZ_SYMBOLE["THW_Fahrzeuge/MLW_II"]);
    const lf = svg({ typ: { freitext: "LF 16-TS" } }, OrganisationsTyp.FEUERWEHR);
    expect(lf).toBe(TZ_SYMBOLE["Feuerwehr_Fahrzeuge/LF_16-TS"]);
  });

  it("fällt ohne Treffer auf das Grundzeichen der Organisation zurück", () => {
    const s = svg({ typ: { freitext: "Kuriosum" } });
    expect(s).toBe(TZ_SYMBOLE["THW_Fahrzeuge/Kraftfahrzeug"]);
  });

  it("beschriftet das Rückfallzeichen mit dem Kurzzeichen", () => {
    const s = svg({ typ: { freitext: "XY-42" } });
    expect(s).toContain(">XY-42</text>");
  });

  it("lässt zu lange Kurzzeichen unbeschriftet (nur die Silhouette bleibt)", () => {
    // Das THW-Grundzeichen trägt ein „THW" in der Ecke — die mittige
    // Beschriftung (48 px) darf trotzdem nicht dazukommen.
    const s = svg({ typ: { freitext: "Rätselfahrzeug" } });
    expect(s).toBe(TZ_SYMBOLE["THW_Fahrzeuge/Kraftfahrzeug"]);
    expect(s).not.toContain("font-size: 48px");
  });

  it("maskiert Sonderzeichen aus dem Freitext", () => {
    expect(svg({ typ: { freitext: "A&B" } })).toContain(">A&amp;B</text>");
  });

  it("färbt das Zeichen je Organisation (Feuerwehr ungleich THW-Blau)", () => {
    const fw = svg({ typ: { freitext: "Rätselfahrzeug" } }, OrganisationsTyp.FEUERWEHR);
    expect(fw).toContain("#FF0000");
    expect(fw).not.toContain("#003399");
  });

  it("rendert auch ohne bekannte Organisation ein neutrales Zeichen", () => {
    const s = svg({ typ: { freitext: "MZF" } }, OrganisationsTyp.SONSTIGE);
    expect(s).toContain("<svg");
    expect(s).toContain('fill="#FFFFFF"');
    expect(s).toContain(">MZF</text>");
  });
});

describe("einheitSymbolSvg()", () => {
  const einheit = (e: Partial<Einheit>): Einheit =>
    ({ organisation: OrganisationsTyp.THW, hierarchie: [], ...e }) as Einheit;

  it("nutzt für einen bekannten THW-Einheitstyp das Fachgruppen-Zeichen", () => {
    const s = einheitSymbolSvg(einheit({ einheitsTyp: { code: 6 } })); // FGr R (A)
    expect(s).toBe(TZ_SYMBOLE["THW_Einheiten/FGr_Räumen_A"]);
  });

  it("findet Einheiten anderer Organisationen über den Freitext", () => {
    const s = einheitSymbolSvg(
      einheit({ organisation: OrganisationsTyp.FEUERWEHR, einheitsTyp: { freitext: "Löschzug" } }),
    );
    expect(s).toBe(TZ_SYMBOLE["Feuerwehr_Einheiten/Löschzug"]);
  });

  it("wählt ohne Treffer die Formation passender Größe und beschriftet sie", () => {
    const s = einheitSymbolSvg(einheit({ einheitsTyp: { freitext: "Sonderzug" } }));
    expect(s).toContain(">Sonderzug</text>");
    // Der Zug trägt drei Punkte über dem Rechteck.
    expect(s.match(/<ellipse/g)?.length).toBe(3);
  });

  it("nimmt für Unbekanntes ohne Größenwort die Gruppe", () => {
    const s = einheitSymbolSvg(einheit({ einheitsTyp: { freitext: "Etwas" } }));
    expect(s.match(/<ellipse/g)?.length).toBe(2);
    expect(s).toContain("#003399");
  });
});

describe("svgDataUrl()", () => {
  it("verpackt das SVG als data:-URL", () => {
    expect(svgDataUrl("<svg/>")).toBe("data:image/svg+xml;charset=utf-8,%3Csvg%2F%3E");
  });
});
