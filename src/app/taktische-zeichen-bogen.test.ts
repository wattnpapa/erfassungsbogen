/**
 * Die Brücke zwischen Bogen und Zeichensammlung — und die eine Prüfung, die
 * nur hier möglich ist.
 *
 * `@bos/taktische-zeichen` weiß nichts von den Vokabularen, `@bos/vokabulare`
 * nichts von den Zeichen. Ob jeder Vokabular-Eintrag eine Zuordnung hat, lässt
 * sich deshalb erst dort feststellen, wo beide zusammenkommen: hier.
 */

import { describe, it, expect } from "vitest";
import { OrganisationsTyp, Zeichenfarbe, type Einheit } from "@bos/eeb-format";
import { THW_EINHEITSTYPEN, THW_FAHRZEUGTYPEN } from "@bos/vokabulare";
import { THW_EINHEIT_ZEICHEN, THW_FAHRZEUG_ZEICHEN, TZ_SYMBOLE, ZEICHENFARBEN } from "@bos/taktische-zeichen";
import { einheitSymbolSvg, fahrzeugSymbolSvg } from "./taktische-zeichen-bogen";

describe("Zuordnung Vokabular → Zeichen", () => {
  it("ordnet jedem THW-Vokabular-Eintrag ein Zeichen zu (oder bewusst keins)", () => {
    // Neue Vokabular-Codes sollen nicht unbemerkt ohne Zuordnung bleiben. Die
    // Auflieger, nackte Anhänger und die Wechselbrücke ohne eigenes Zeichen sind gewollt.
    const ohneZeichen = THW_FAHRZEUGTYPEN.filter((t) => !THW_FAHRZEUG_ZEICHEN[t.code!]).map((t) => t.kurz);
    expect(ohneZeichen).toEqual(["Auflieger", "Auflieger Plane/Spriegel", "Auflieger Container", "Anh Plane/Spriegel", "Anh BDF", "Anh ASH", "Anh 12t Koffer", "Anh 5t Tandem", "WB", "ABK"]);
    expect(THW_EINHEITSTYPEN.filter((t) => !THW_EINHEIT_ZEICHEN[t.code!])).toEqual([]);
  });
});

describe("fahrzeugSymbolSvg()", () => {
  it("löst den Vokabular-Code zum benannten Zeichen auf", () => {
    const s = fahrzeugSymbolSvg({ typ: { code: 1 } }, OrganisationsTyp.THW); // FmKW
    expect(s).toBe(TZ_SYMBOLE["THW_Fahrzeuge/FmKW"]);
  });

  it("nimmt bei Freitext den Text als Kurzzeichen und Namen", () => {
    expect(fahrzeugSymbolSvg({ typ: { freitext: "MzKW" } }, OrganisationsTyp.THW)).toBe(
      TZ_SYMBOLE["THW_Fahrzeuge/MzKW"],
    );
  });

  it("schickt die Bundespolizei in den Zeichenbereich der Polizei", () => {
    const bp = fahrzeugSymbolSvg({ typ: { freitext: "Rätselfahrzeug" } }, OrganisationsTyp.BUNDESPOLIZEI);
    const pol = fahrzeugSymbolSvg({ typ: { freitext: "Rätselfahrzeug" } }, OrganisationsTyp.POLIZEI);
    expect(bp).toBe(pol);
  });

  it("schickt die Hilfsorganisationen gemeinsam ins Rettungswesen", () => {
    const drk = fahrzeugSymbolSvg({ typ: { freitext: "Rätselfahrzeug" } }, OrganisationsTyp.DRK);
    for (const org of [OrganisationsTyp.JUH, OrganisationsTyp.MHD, OrganisationsTyp.ASB, OrganisationsTyp.RETTUNGSDIENST]) {
      expect(fahrzeugSymbolSvg({ typ: { freitext: "Rätselfahrzeug" } }, org)).toBe(drk);
    }
  });
});

describe("fahrzeugSymbolSvg() mit abweichender Zeichenfarbe", () => {
  it("zeichnet Gerät von Partnern orange oder grau statt in der Farbe der Einheit", () => {
    const anh = { typ: { code: 51 } }; // Anh SwPu 15000
    expect(fahrzeugSymbolSvg(anh, OrganisationsTyp.THW)).toContain("#003399");
    const orange = fahrzeugSymbolSvg({ ...anh, zeichenfarbe: Zeichenfarbe.KOMMUNAL }, OrganisationsTyp.THW);
    expect(orange).toContain(ZEICHENFARBEN.kommunal);
    expect(orange).not.toContain("#003399");
    expect(fahrzeugSymbolSvg({ ...anh, zeichenfarbe: Zeichenfarbe.GRAU }, OrganisationsTyp.THW)).toContain(ZEICHENFARBEN.grau);
  });

  it("nimmt das Kommunalzeichen der Sammlung, wo es eines gibt", () => {
    expect(fahrzeugSymbolSvg({ typ: { freitext: "MTW" }, zeichenfarbe: Zeichenfarbe.KOMMUNAL }, OrganisationsTyp.FEUERWEHR)).toBe(
      TZ_SYMBOLE["Kommunal_Fahrzeuge/MTW"],
    );
  });

  it("fällt bei einem unbekannten Wert auf die Farbe der Organisation zurück", () => {
    const f = { typ: { code: 1 }, zeichenfarbe: 9 as Zeichenfarbe };
    expect(fahrzeugSymbolSvg(f, OrganisationsTyp.THW)).toBe(TZ_SYMBOLE["THW_Fahrzeuge/FmKW"]);
  });
});

describe("einheitSymbolSvg()", () => {
  const einheit = (e: Partial<Einheit>): Einheit =>
    ({ organisation: OrganisationsTyp.THW, hierarchie: [], ...e }) as Einheit;

  it("löst den Vokabular-Code zum Fachgruppen-Zeichen auf", () => {
    expect(einheitSymbolSvg(einheit({ einheitsTyp: { code: 6 } }))).toBe(
      TZ_SYMBOLE["THW_Einheiten/FGr_Räumen_A"],
    );
  });

  it("findet Einheiten anderer Organisationen über den Freitext", () => {
    const s = einheitSymbolSvg(
      einheit({ organisation: OrganisationsTyp.FEUERWEHR, einheitsTyp: { freitext: "Löschzug" } }),
    );
    expect(s).toBe(TZ_SYMBOLE["Feuerwehr_Einheiten/Löschzug"]);
  });
});

describe("Einzelperson", () => {
  it("zeichnet die Raute der Person mit der Aufschrift ihrer Funktion", () => {
    const s = einheitSymbolSvg({
      organisation: OrganisationsTyp.THW,
      einzelperson: true,
      einheitsTyp: { freitext: "Baufachberater/in" },
      hierarchie: [],
    });
    expect(s).toContain("M64,128 L128,64 L192,128 L128,192 Z");
    expect(s).toContain(">BFB</text>");
  });
});
