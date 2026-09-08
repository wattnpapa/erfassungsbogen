/**
 * Die Brücke zwischen Bogen und Zeichensammlung — und die eine Prüfung, die
 * nur hier möglich ist.
 *
 * `@bos/taktische-zeichen` weiß nichts von den Vokabularen, `@bos/vokabulare`
 * nichts von den Zeichen. Ob jeder Vokabular-Eintrag eine Zuordnung hat, lässt
 * sich deshalb erst dort feststellen, wo beide zusammenkommen: hier.
 */

import { describe, it, expect } from "vitest";
import { OrganisationsTyp, type Einheit } from "@bos/eeb-format";
import { THW_EINHEITSTYPEN, THW_FAHRZEUGTYPEN } from "@bos/vokabulare";
import { THW_EINHEIT_ZEICHEN, THW_FAHRZEUG_ZEICHEN, TZ_SYMBOLE } from "@bos/taktische-zeichen";
import { einheitSymbolSvg, fahrzeugSymbolSvg } from "./taktische-zeichen-bogen";

describe("Zuordnung Vokabular → Zeichen", () => {
  it("ordnet jedem THW-Vokabular-Eintrag ein Zeichen zu (oder bewusst keins)", () => {
    // Neue Vokabular-Codes sollen nicht unbemerkt ohne Zuordnung bleiben. Die
    // vier Fahrzeugtypen ohne eigenes Zeichen sind gewollt.
    const ohneZeichen = THW_FAHRZEUGTYPEN.filter((t) => !THW_FAHRZEUG_ZEICHEN[t.code!]).map((t) => t.kurz);
    expect(ohneZeichen).toEqual(["Auflieger", "Anh Plane/Spriegel", "Anh BDF", "Anh ASH"]);
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
