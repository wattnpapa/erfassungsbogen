/**
 * R20-H1: „Ort der Einheit ändern…" an der Karte – der Dialog und die neue Fassung des Bogens. Eigene Datei, die
 * einsaetze-ui.tsx erst beim Tippen nachlädt (Startbündel, ADR-003 Aufnahmeregel 5).
 */
import type { Erfassungsbogen } from "@bos/eeb-format/model";
import { frageText } from "./dialoge";
import { einheitAnzeigename, orgLabel } from "./hilfen";
import { ortOhneOrganisation } from "./ort-praefix";

export interface OrtAenderung {
  neu: Erfassungsbogen;
  vorherName: string;
  neuerName: string;
}

/**
 * Fragt den neuen Ort und liefert die neue Fassung (Stand neu gestempelt, damit sie als eigene Fassung gilt); `null` bei
 * Abbruch oder unverändertem Ort. Steht die Organisation schon im Namen („THW Oldenburg"), wird sie nicht doppelt gesetzt.
 */
export async function ortErfragen(bogen: Erfassungsbogen, jetzt: number): Promise<OrtAenderung | null> {
  const alt = bogen.einheit.hierarchie[0]?.name ?? "";
  const vorherName = einheitAnzeigename(bogen.einheit);
  const eingabe = await frageText({
    titel: "Ort der Einheit ändern",
    label: "Ort der Einheit",
    vorgabe: alt,
    hinweis: `„${vorherName}" bekommt einen anderen Ort. Nummer, Zug, Auftrag und Historie bleiben; die alte Fassung kommt in die Historie, „Rückgängig“ nimmt die Änderung zurück.`,
    ok: "Ort übernehmen",
  });
  if (eingabe == null) return null;
  const ort = ortOhneOrganisation(eingabe.trim(), bogen.einheit.organisationName?.trim() || orgLabel(bogen.einheit.organisation));
  if (!ort || ort === alt) return null;
  const neu: Erfassungsbogen = JSON.parse(JSON.stringify(bogen));
  neu.einheit.hierarchie[0]!.name = ort;
  neu.stand = Math.max(jetzt, bogen.stand);
  return { neu, vorherName, neuerName: einheitAnzeigename(neu.einheit) };
}
