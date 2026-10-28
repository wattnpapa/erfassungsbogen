/**
 * Organisation der Schnellerfassung (R21-W2, H2): Sie steht sichtbar im ersten Bild und beginnt mit der
 * letzten Wahl dieses Geräts. Eine Einheit des DRK wurde vorher still als „THW DRK Bremen" abgelegt,
 * weil die Auswahl eingeklappt auf dem Standard „THW" stand.
 *
 * Gemerkt wird nur die Zahl der Organisation unter `eeb.schnellOrganisation.v1` (Gerätewert, kein Personenbezug;
 * wandert mit der Datensicherung und fällt mit „Alle Daten löschen"). Ohne Speicher oder mit einem unbekannten
 * Wert gilt das THW, und die Auswahl zeigt es sichtbar an.
 */
import { ORG_OPTIONEN } from "./hilfen";
import { OrganisationsTyp } from "@bos/eeb-format/model";

export const SCHNELL_ORGANISATION_SCHLUESSEL = "eeb.schnellOrganisation.v1";

export function schnellOrganisationMerken(organisation: OrganisationsTyp): void {
  try {
    localStorage.setItem(SCHNELL_ORGANISATION_SCHLUESSEL, String(organisation));
  } catch {
    /* Speicher voll oder gesperrt — dann beginnt die nächste Erfassung wieder beim THW */
  }
}

/** Anfang eines Ortsfelds, der eine andere Organisation nennt („DRK Bremen", „Freiwillige Feuerwehr Husum"). */
const ORGANISATION_IM_ORT: readonly [OrganisationsTyp, RegExp][] = [
  [OrganisationsTyp.BUNDESPOLIZEI, /^\s*Bundespolizei(?![\p{L}\p{N}])/iu],
  [OrganisationsTyp.POLIZEI, /^\s*Polizei(?![\p{L}\p{N}])/iu],
  [OrganisationsTyp.FEUERWEHR, /^\s*(Freiwillige\s+Feuerwehr|Berufsfeuerwehr|Feuerwehr|FFW|FF|BF)(?![\p{L}\p{N}])/iu],
  [OrganisationsTyp.DRK, /^\s*(DRK|Deutsches\s+Rotes\s+Kreuz)(?![\p{L}\p{N}])/iu],
  [OrganisationsTyp.JUH, /^\s*(Johanniter|JUH)(?![\p{L}\p{N}])/iu],
  [OrganisationsTyp.MHD, /^\s*(Malteser|MHD)(?![\p{L}\p{N}])/iu],
  [OrganisationsTyp.ASB, /^\s*ASB(?![\p{L}\p{N}])/iu],
  [OrganisationsTyp.DLRG, /^\s*DLRG(?![\p{L}\p{N}])/iu],
  [OrganisationsTyp.BUNDESWEHR, /^\s*Bundeswehr(?![\p{L}\p{N}])/iu],
  [OrganisationsTyp.THW, /^\s*THW(?![\p{L}\p{N}])/iu],
];

/**
 * R21-W2, H2: Nennt der Ort eine andere Organisation als die gewählte, kommt sie zurück (sonst undefined).
 * Die App stellt nichts still um, sondern fragt an der Stelle, an der der Ort steht.
 */
export function andereOrganisationImOrt(ort: string, aktuell: OrganisationsTyp): OrganisationsTyp | undefined {
  for (const [org, muster] of ORGANISATION_IM_ORT) {
    if (muster.test(ort)) return org === aktuell ? undefined : org;
  }
  return undefined;
}

export function schnellOrganisationLaden(): OrganisationsTyp {
  try {
    const roh = localStorage.getItem(SCHNELL_ORGANISATION_SCHLUESSEL);
    if (roh === null) return OrganisationsTyp.THW;
    const wert = Number(roh);
    return ORG_OPTIONEN.some((o) => o.wert === wert) ? (wert as OrganisationsTyp) : OrganisationsTyp.THW;
  } catch {
    return OrganisationsTyp.THW;
  }
}
