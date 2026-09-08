/**
 * Brücke zwischen Erfassungsbogen und Zeichensammlung.
 *
 * `taktische-zeichen.ts` kennt nach ADR-003 weder `Einheit` noch `Fahrzeug`
 * noch die Vokabulare — es nimmt nur Organisation, Kurzzeichen und Name
 * entgegen. Diese Datei löst beides aus dem Bogen auf und bleibt deshalb im
 * Produkt.
 */

import { OrganisationsTyp, type Einheit, type Fahrzeug } from "@bos/eeb-format/model";
import { vokabText, vokabularFuer } from "@bos/meldekopf/darstellung";
import {
  einheitZeichenSvg,
  fahrzeugZeichenSvg,
  type Zeichenorganisation,
} from "@bos/taktische-zeichen/zeichen";

/**
 * Bogen-Organisation → Zeichenbereich der Sammlung. Mehrere Organisationen
 * teilen sich einen Bereich: die Bundespolizei zeichnet wie die Landespolizei,
 * die Hilfsorganisationen zeichnen gemeinsam im Rettungswesen.
 */
const ZEICHENBEREICH: Record<OrganisationsTyp, Zeichenorganisation> = {
  [OrganisationsTyp.THW]: "thw",
  [OrganisationsTyp.FEUERWEHR]: "feuerwehr",
  [OrganisationsTyp.POLIZEI]: "polizei",
  [OrganisationsTyp.BUNDESPOLIZEI]: "polizei",
  [OrganisationsTyp.BUNDESWEHR]: "bundeswehr",
  [OrganisationsTyp.DRK]: "hilfsorganisation",
  [OrganisationsTyp.JUH]: "hilfsorganisation",
  [OrganisationsTyp.MHD]: "hilfsorganisation",
  [OrganisationsTyp.ASB]: "hilfsorganisation",
  [OrganisationsTyp.RETTUNGSDIENST]: "hilfsorganisation",
  [OrganisationsTyp.DLRG]: "wasserrettung",
  [OrganisationsTyp.SONSTIGE]: "sonstige",
};

/**
 * Taktisches Zeichen eines Fahrzeugs als (pdfmake-taugliches) SVG.
 * Kurzzeichen/Name stammen aus dem organisationsspezifischen Vokabular bzw.
 * dem Freitext des Fahrzeugtyps.
 */
export function fahrzeugSymbolSvg(f: Fahrzeug, org: OrganisationsTyp): string {
  const tabelle = vokabularFuer(org, "fahrzeug");
  return fahrzeugZeichenSvg({
    organisation: ZEICHENBEREICH[org] ?? "sonstige",
    kurz: vokabText(f.typ, tabelle, "kurz"),
    name: vokabText(f.typ, tabelle, "name"),
    thwCode: org === OrganisationsTyp.THW ? f.typ?.code : undefined,
  });
}

/**
 * Taktisches Zeichen der Einheit selbst (taktische Formation, DV 102) — der
 * „Avatar" der Einheit in der Oberfläche.
 */
export function einheitSymbolSvg(e: Einheit): string {
  const tabelle = vokabularFuer(e.organisation, "einheitstyp");
  return einheitZeichenSvg({
    organisation: ZEICHENBEREICH[e.organisation] ?? "sonstige",
    kurz: vokabText(e.einheitsTyp, tabelle, "kurz").trim(),
    name: vokabText(e.einheitsTyp, tabelle, "name").trim(),
    thwCode: e.organisation === OrganisationsTyp.THW ? e.einheitsTyp?.code : undefined,
  });
}

export { svgDataUrl } from "@bos/taktische-zeichen/zeichen";
