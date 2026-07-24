/// <reference types="vite/client" />
/**
 * Landesvorlagen: aus den KatS-Beispielbögen abgeleitete, im Editor anwendbare
 * Vorlagen für Schritt 1 — das Pendant zur code-basierten THW-StAN-Vorbelegung
 * (thw-stan-personal.ts / thw-stan-fahrzeuge.ts), nur freitext-basiert und
 * automatisch aus den vorhandenen Beispieldaten gewonnen.
 *
 * Quelle & Konvention: jede Datei unter
 *   examples/katastrophenschutz/<bundesland>/*.json
 * wird beim Build per Glob eingelesen und steht dann als Vorlage der jeweiligen
 * Organisation und des jeweiligen Bundeslands zur Verfügung. Neue Bundesländer
 * oder Einheiten (z. B. aus künftigen StAN-Unterlagen) erscheinen dadurch ohne
 * Codeänderung, sobald der Beispielbogen abgelegt ist. Siehe docs/entwicklung.md.
 *
 * Beim Anwenden werden personen- und ortsbezogene Angaben entfernt; übrig
 * bleiben:
 *  - Stärkeplätze: Stärke-Rolle, Funktion(en) und Qualifikation(en) des Platzes;
 *    Name/Kontakte leer, Geschlecht/Ernährung/Fahrerlaubnis auf Default.
 *  - Fahrzeuge: Typ (und beschreibender Zweck aus „aenderungen"); ohne
 *    Kennzeichen und ohne Funkrufname (der hängt am konkreten Standort).
 */

import type { Erfassungsbogen, Fahrzeug, Person, VokabularWert } from "../model";
import { Ernaehrung, Fahrerlaubnis, Geschlecht, OrganisationsTyp } from "../model";

export interface Landesvorlage {
  organisation: OrganisationsTyp;
  /** Ordner-Slug des Bundeslands, z. B. "niedersachsen". */
  bundesland: string;
  /** Anzeigename = Einheitstyp-Bezeichnung, z. B. "Fachgruppe Versorgung …". */
  name: string;
  einheitsTyp: VokabularWert;
  personal: Person[];
  fahrzeuge: Fahrzeug[];
}

/** Person → leerer Stärkeplatz (Rolle/Funktion/Qualifikation bleiben). */
function platzAusPerson(p: Person): Person {
  return {
    vorname: "",
    nachname: "",
    staerkeRolle: p.staerkeRolle,
    funktionen: p.funktionen,
    fahrerlaubnis: Fahrerlaubnis.NONE,
    geschlecht: Geschlecht.M,
    ernaehrung: Ernaehrung.FLEISCH,
    kontakte: [],
    zusatzqualifikationen: p.zusatzqualifikationen,
  };
}

/** Fahrzeug → Vorlage: nur Typ und Zweck, ohne Kennzeichen/Funkrufname. */
function fahrzeugAusVorlage(f: Fahrzeug): Fahrzeug {
  return {
    typ: f.typ,
    ...(f.aenderungen ? { aenderungen: f.aenderungen } : {}),
    ...(f.stanKonform != null ? { stanKonform: f.stanKonform } : {}),
  };
}

// Glob wird beim Build aufgelöst; neue Dateien/Ordner erscheinen automatisch.
const MODULE = import.meta.glob<Erfassungsbogen>(
  "../../examples/katastrophenschutz/**/*.json",
  { eager: true, import: "default" },
);

const ABGELEITET: Landesvorlage[] = Object.entries(MODULE)
  .map(([pfad, bogen]): Landesvorlage => {
    const teile = pfad.split("/");
    const bundesland = teile[teile.indexOf("katastrophenschutz") + 1] ?? "";
    return {
      organisation: bogen.einheit.organisation,
      bundesland,
      name: bogen.einheit.einheitsTyp.freitext ?? "",
      einheitsTyp: bogen.einheit.einheitsTyp,
      personal: bogen.personal.map(platzAusPerson),
      fahrzeuge: bogen.fahrzeuge.map(fahrzeugAusVorlage),
    };
  })
  .filter((v) => v.name !== "" && v.bundesland !== "");

// Eine Vorlage je (Organisation, Bundesland, Einheitstyp) — kommt derselbe
// Einheitstyp aus mehreren Kreisen, gewinnt der erste (Struktur ist gleich).
const KATALOG = new Map<string, Landesvorlage>();
for (const v of ABGELEITET) {
  const schluessel = `${v.organisation}|${v.bundesland}|${v.name}`;
  if (!KATALOG.has(schluessel)) KATALOG.set(schluessel, v);
}
const VORLAGEN = [...KATALOG.values()];

const BUNDESLAND_LABEL: Record<string, string> = {
  badenwuerttemberg: "Baden-Württemberg",
  bayern: "Bayern",
  berlin: "Berlin",
  brandenburg: "Brandenburg",
  bremen: "Bremen",
  hamburg: "Hamburg",
  hessen: "Hessen",
  mecklenburgvorpommern: "Mecklenburg-Vorpommern",
  niedersachsen: "Niedersachsen",
  nordrheinwestfalen: "Nordrhein-Westfalen",
  rheinlandpfalz: "Rheinland-Pfalz",
  saarland: "Saarland",
  sachsen: "Sachsen",
  sachsenanhalt: "Sachsen-Anhalt",
  schleswigholstein: "Schleswig-Holstein",
  thueringen: "Thüringen",
};

/** Lesbarer Name eines Bundesland-Ordners; unbekannte werden kapitalisiert. */
export function bundeslandLabel(slug: string): string {
  return BUNDESLAND_LABEL[slug] ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Gibt es für diese Organisation überhaupt Landesvorlagen? */
export function hatLandesvorlagen(org: OrganisationsTyp): boolean {
  return VORLAGEN.some((v) => v.organisation === org);
}

/** Bundesländer (Slugs) mit Vorlagen für diese Organisation, sortiert. */
export function landesvorlagenBundeslaender(org: OrganisationsTyp): string[] {
  return [...new Set(VORLAGEN.filter((v) => v.organisation === org).map((v) => v.bundesland))].sort((a, b) =>
    bundeslandLabel(a).localeCompare(bundeslandLabel(b), "de"),
  );
}

/** Einheitstyp-Namen für (Organisation, Bundesland), sortiert. */
export function landesvorlagenEinheiten(org: OrganisationsTyp, bundesland: string): string[] {
  return VORLAGEN.filter((v) => v.organisation === org && v.bundesland === bundesland)
    .map((v) => v.name)
    .sort((a, b) => a.localeCompare(b, "de"));
}

/** Konkrete Vorlage nachschlagen (undefined, wenn nicht vorhanden). */
export function landesvorlage(org: OrganisationsTyp, bundesland: string, name: string): Landesvorlage | undefined {
  return KATALOG.get(`${org}|${bundesland}|${name}`);
}
