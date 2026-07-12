/**
 * Erzeugt für ein Fahrzeug das taktische Zeichen (DV 102) als SVG-String,
 * wie es im Papier-Erfassungsbogen links neben jedem Fahrzeug steht.
 *
 * Genutzt wird die reine JS-Bibliothek „taktische-zeichen-core" (kein DOM),
 * damit die Funktion — wie pdf-dokument.ts — plattformneutral und unit-testbar
 * bleibt. Das SVG wird direkt von pdfmake gerendert (svg-to-pdfkit).
 *
 * Zwei kleine Anpassungen am Bibliotheks-SVG:
 *  - `skipFontRegistration` hält das SVG klein (~700 B statt ~26 kB mit
 *    eingebettetem Font); die Beschriftung rendert pdfmake mit seinem Font.
 *  - Font-Familie „Roboto Slab" → „Roboto": svg-to-pdfkit kennt nur die von
 *    pdfmake registrierten Fonts; „Roboto" ist vorhanden, „Roboto Slab" nicht.
 */

import { erzeugeTaktischesZeichen } from "taktische-zeichen-core";
import type { GrundzeichenId, OrganisationId } from "taktische-zeichen-core";
import type { Fahrzeug } from "../model";
import { OrganisationsTyp } from "../model";
import { vokabText, vokabularFuer } from "./hilfen";

/** BOS-Organisation → Organisations-Kennung der Bibliothek (bestimmt Farbe/Zeichen). */
function organisationId(org: OrganisationsTyp): OrganisationId | undefined {
  switch (org) {
    case OrganisationsTyp.THW:
      return "thw";
    case OrganisationsTyp.FEUERWEHR:
      return "feuerwehr";
    case OrganisationsTyp.POLIZEI:
    case OrganisationsTyp.BUNDESPOLIZEI:
      return "polizei";
    case OrganisationsTyp.BUNDESWEHR:
      return "bundeswehr";
    case OrganisationsTyp.DRK:
    case OrganisationsTyp.JUH:
    case OrganisationsTyp.MHD:
    case OrganisationsTyp.ASB:
    case OrganisationsTyp.DLRG:
    case OrganisationsTyp.RETTUNGSDIENST:
      return "hilfsorganisation";
    default:
      return undefined; // SONSTIGE: neutrales Zeichen ohne Organisationsfarbe
  }
}

/**
 * Grundzeichen (Fahrzeug-Silhouette) aus Kurzzeichen + Name ableiten.
 * Reihenfolge ist Absicht: Anhänger vor Wechsellader (z. B. „Anh …" schlägt
 * ein enthaltenes „WLF" nicht), Wasser vor „gl".
 */
export function grundzeichenFuer(text: string): GrundzeichenId {
  const t = text.toLowerCase();
  if (/\banh\b|anhänger|auflieger/.test(t)) return "anhaenger";
  if (/mzab|\bboot\b|wasserfahrzeug/.test(t)) return "wasserfahrzeug";
  if (/wlf|wechsellader/.test(t)) return "wechsellader";
  if (/\bgl\b|geländeg/.test(t)) return "kraftfahrzeug-gelaendegaengig";
  return "kraftfahrzeug-landgebunden";
}

/**
 * Kurze Beschriftung im Zeichen (wie in der Vorlage: FmKW, FüKW, 2t …).
 * „Anh "-Präfix entfällt (schafft Platz, „Anh 2t" → „2t"). Nur wenn die
 * Beschriftung kurz genug ist, sonst bleibt das Zeichen unbeschriftet — die
 * volle Bezeichnung steht ohnehin in der Zelle daneben.
 */
function beschriftung(kurz: string): string | undefined {
  const label = kurz.replace(/^anh\s+/i, "").trim();
  return label.length > 0 && label.length <= 6 ? label : undefined;
}

/**
 * Taktisches Zeichen eines Fahrzeugs als (pdfmake-taugliches) SVG.
 * Kurzzeichen/Name stammen aus dem organisationsspezifischen Vokabular bzw.
 * dem Freitext des Fahrzeugtyps.
 */
export function fahrzeugSymbolSvg(f: Fahrzeug, org: OrganisationsTyp): string {
  const tabelle = vokabularFuer(org, "fahrzeug");
  const kurz = vokabText(f.typ, tabelle, "kurz");
  const name = vokabText(f.typ, tabelle, "name");
  const zeichen = erzeugeTaktischesZeichen({
    grundzeichen: grundzeichenFuer(`${kurz} ${name}`),
    organisation: organisationId(org),
    text: beschriftung(kurz),
    skipFontRegistration: true,
  });
  return zeichen.toString().replace(/Roboto Slab/g, "Roboto");
}
