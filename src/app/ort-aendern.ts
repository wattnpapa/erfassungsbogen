/**
 * R20-H1: „Ort der Einheit ändern…" an der Karte – der Dialog und die neue Fassung des Bogens. Eigene Datei, die
 * einsaetze-ui.tsx erst beim Tippen nachlädt (Startbündel, ADR-003 Aufnahmeregel 5).
 *
 * R21-E3: Beim THW prüft die Korrektur den Ort wie die Schnellerfassung gegen das OV-Verzeichnis: Steht der Ort nicht darin
 * („Oldenbrg"), nennt eine Rückfrage das und bietet Vorschläge mit Kennung an; „So übernehmen" bleibt möglich (ein
 * Ortsverband, den es dort nicht gibt, darf so stehen).
 */
import { OrganisationsTyp, type Erfassungsbogen } from "@bos/eeb-format/model";
import type { ThwOrtsverband } from "@bos/vokabulare/thw-ov";
import { frageText, frageWahl } from "./dialoge";
import { einheitAnzeigename, orgLabel } from "./hilfen";
import { ortOhneOrganisation } from "./ort-praefix";
import { ortAnzeige } from "./schreibweise";

export interface OrtAenderung {
  neu: Erfassungsbogen;
  vorherName: string;
  neuerName: string;
}

/** Vorschläge zu einer Eingabe: erst wie im Eingabefeld der Schnellerfassung, bei einem Tippfehler über den Wortanfang. */
export function ortVorschlaege(verzeichnis: readonly ThwOrtsverband[], ort: string, treffer: (v: readonly ThwOrtsverband[], w: string) => ThwOrtsverband[]): ThwOrtsverband[] {
  const roh = treffer(verzeichnis, ort);
  if (roh.length > 0) return roh;
  const t = ort.trim();
  for (let laenge = t.length - 1; laenge >= 3; laenge--) {
    const anfang = treffer(verzeichnis, t.slice(0, laenge));
    if (anfang.length > 0) return anfang;
  }
  return [];
}

/**
 * Findet das Verzeichnis zu diesem Ort überhaupt etwas? Wie im Eingabefeld der Schnellerfassung: „Oldenburg" hat Treffer
 * (mit Kennung „Oldenburg (NI)"), „Oldenbrg" keine — dann steht dort „Kein Ort mit diesem Namen in der Liste".
 */
function imVerzeichnis(verzeichnis: readonly ThwOrtsverband[], ort: string, treffer: (v: readonly ThwOrtsverband[], w: string) => ThwOrtsverband[]): boolean {
  return treffer(verzeichnis, ort).length > 0 || verzeichnis.some((o) => o.kurz.toUpperCase() === ort.trim().toUpperCase());
}

/**
 * Fragt den neuen Ort und liefert die neue Fassung (Stand neu gestempelt, damit sie als eigene Fassung gilt); `null` bei
 * Abbruch oder unverändertem Ort. Steht die Organisation schon im Namen („THW Oldenburg"), wird sie nicht doppelt gesetzt.
 */
export async function ortErfragen(bogen: Erfassungsbogen, jetzt: number): Promise<OrtAenderung | null> {
  const alt = bogen.einheit.hierarchie[0]?.name ?? "";
  const vorherName = einheitAnzeigename(bogen.einheit);
  const mitVerzeichnis = bogen.einheit.organisation === OrganisationsTyp.THW && bogen.einheit.hierarchie[0]?.bezeichnung.code === 1;
  let vorgabe = alt;
  for (;;) {
    const eingabe = await frageText({
      titel: "Ort der Einheit ändern",
      label: "Ort der Einheit",
      vorgabe,
      hinweis: `„${vorherName}" bekommt einen anderen Ort. Nummer, Zug, Auftrag und Historie bleiben; die alte Fassung kommt in die Historie, „Rückgängig“ nimmt die Änderung zurück.`,
      ok: "Ort übernehmen",
    });
    if (eingabe == null) return null;
    const ort = ortOhneOrganisation(eingabe.trim(), bogen.einheit.organisationName?.trim() || orgLabel(bogen.einheit.organisation));
    if (!ort || ort === alt) return null;
    const neu: Erfassungsbogen = JSON.parse(JSON.stringify(bogen));
    neu.einheit.hierarchie[0]!.name = ort;
    neu.stand = Math.max(jetzt, bogen.stand);
    if (mitVerzeichnis) {
      const [ov, struktur, einheit, funkruf] = await Promise.all([
        import("@bos/vokabulare/thw-ov"),
        import("@bos/vokabulare/thw-ov-regionalstruktur"),
        import("./schritte/einheit"),
        import("../vokabulare/thw-funkrufname-ort"),
      ]);
      const verzeichnis = ov.THW_ORTSVERBAENDE;
      if (!imVerzeichnis(verzeichnis, ort, einheit.ovTreffer)) {
        const vorschlaege = ortVorschlaege(verzeichnis, ort, einheit.ovTreffer).slice(0, 4);
        const wahl = await frageWahl({
          titel: "Ort nicht in der Liste",
          text: `Kein Ort mit dem Namen „${ort}" in der Liste der Ortsverbände — Schreibweise prüfen.${vorschlaege.length > 0 ? " Meinst du:" : ""}`,
          wege: [
            ...vorschlaege.map((o) => ({
              wert: `ov:${o.kurz}`,
              label: `${o.name} (${o.kurz})`,
              kurz: `${o.plz} ${ortAnzeige(o.ort)}; Kürzel, Telefon und E-Mail kommen dazu.`,
              sicher: true,
            })),
            { wert: "so", label: `„${ort}" so übernehmen`, kurz: "Ein Ortsverband, den es dort nicht gibt, darf so stehen bleiben." },
          ],
          abbruch: "Schreibweise ändern",
        });
        if (wahl === null) {
          vorgabe = ort;
          continue;
        }
        const gewaehlt = wahl.startsWith("ov:") ? vorschlaege.find((o) => `ov:${o.kurz}` === wahl) : undefined;
        if (gewaehlt) {
          const daten = { ...ov, ...struktur };
          neu.einheit.hierarchie = einheit.ovInHierarchieUebernehmen(daten, neu.einheit.hierarchie, 0, gewaehlt);
          neu.fahrzeuge = funkruf.fahrzeugeMitFunkrufOv(neu.fahrzeuge, neu.einheit);
          if (gewaehlt.name === alt) return null;
        }
      }
    }
    return { neu, vorherName, neuerName: einheitAnzeigename(neu.einheit) };
  }
}
