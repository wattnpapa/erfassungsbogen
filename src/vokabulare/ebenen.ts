/**
 * Hierarchie-Ebenen je Organisation (Namensraum OrganisationsTyp) — die
 * Kontaktstellen-Leiter von der eigenen Einheit aufsteigend zur höchsten
 * Stelle.
 *
 * REGELN (wie in thw.ts):
 *  - Codes sind append-only und werden NIE umgedeutet oder wiederverwendet.
 *  - Code 0 ist reserviert (= Freitext-Ausweg im QR-Format).
 *  - Die Code-Reihenfolge trägt Bedeutung: aufsteigende Codes = aufsteigende
 *    Hierarchie, unterste Ebene zuerst. Schritt 1 belegt darüber beim
 *    Hinzufügen die jeweils nächsthöhere Ebene vor.
 *
 * Aufgenommen ist nur die kanonische Leiter je Organisation; regionale
 * Sonderformen (z. B. DRK-Bezirksverband in Baden, Samtgemeinden) laufen
 * über den Freitext-Ausweg. Polizei, Bundespolizei, Bundeswehr,
 * Rettungsdienst und Sonstige bleiben bewusst ohne Vokabular — ihre
 * Strukturen sind zu heterogen für eine allgemeingültige Leiter.
 */

import { OrganisationsTyp } from "../model";
import { THW_HIERARCHIE_EBENEN, type VokabularEintrag } from "./thw";

export const FEUERWEHR_HIERARCHIE_EBENEN: VokabularEintrag[] = [
  { code: 1, kurz: "Gemeinde", name: "Gemeinde/Stadt" },
  { code: 2, kurz: "LK", name: "Landkreis/kreisfreie Stadt" },
  { code: 3, kurz: "Bezirk", name: "Bezirk/Regierungsbezirk" },
  { code: 4, kurz: "Land", name: "Bundesland" },
];

export const DRK_HIERARCHIE_EBENEN: VokabularEintrag[] = [
  { code: 1, kurz: "OV", name: "Ortsverein" },
  { code: 2, kurz: "KV", name: "Kreisverband" },
  { code: 3, kurz: "LV", name: "Landesverband" },
];

export const JUH_HIERARCHIE_EBENEN: VokabularEintrag[] = [
  { code: 1, kurz: "OV", name: "Ortsverband" },
  { code: 2, kurz: "RV", name: "Regionalverband" },
  { code: 3, kurz: "LV", name: "Landesverband" },
];

export const MHD_HIERARCHIE_EBENEN: VokabularEintrag[] = [
  { code: 1, kurz: "OG", name: "Ortsgliederung" },
  { code: 2, kurz: "DG", name: "Diözesangliederung" },
  { code: 3, kurz: "LG", name: "Landesgliederung" },
];

export const ASB_HIERARCHIE_EBENEN: VokabularEintrag[] = [
  { code: 1, kurz: "OV", name: "Ortsverband" },
  { code: 2, kurz: "KV", name: "Kreisverband" },
  { code: 3, kurz: "RV", name: "Regionalverband" },
  { code: 4, kurz: "LV", name: "Landesverband" },
];

export const DLRG_HIERARCHIE_EBENEN: VokabularEintrag[] = [
  { code: 1, kurz: "OG", name: "Ortsgruppe" },
  { code: 2, kurz: "Bezirk", name: "Bezirk/Kreisgruppe" },
  { code: 3, kurz: "LV", name: "Landesverband" },
];

export const HIERARCHIE_EBENEN: Partial<Record<OrganisationsTyp, VokabularEintrag[]>> = {
  [OrganisationsTyp.THW]: THW_HIERARCHIE_EBENEN,
  [OrganisationsTyp.FEUERWEHR]: FEUERWEHR_HIERARCHIE_EBENEN,
  [OrganisationsTyp.DRK]: DRK_HIERARCHIE_EBENEN,
  [OrganisationsTyp.JUH]: JUH_HIERARCHIE_EBENEN,
  [OrganisationsTyp.MHD]: MHD_HIERARCHIE_EBENEN,
  [OrganisationsTyp.ASB]: ASB_HIERARCHIE_EBENEN,
  [OrganisationsTyp.DLRG]: DLRG_HIERARCHIE_EBENEN,
};

export function hierarchieEbenenFuer(org: OrganisationsTyp): VokabularEintrag[] {
  return HIERARCHIE_EBENEN[org] ?? [];
}
