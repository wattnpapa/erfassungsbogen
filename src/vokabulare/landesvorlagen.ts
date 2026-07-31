/// <reference types="vite/client" />
/**
 * Landesvorlagen: aus den landesrechtlichen Beispielbögen abgeleitete, im Editor
 * anwendbare Vorlagen für Schritt 1 — das Pendant zur code-basierten
 * THW-StAN-Vorbelegung (thw-stan-personal.ts / thw-stan-fahrzeuge.ts), nur
 * freitext-basiert und automatisch aus den vorhandenen Beispieldaten gewonnen.
 *
 * Quelle & Konvention: jede Datei unter
 *   examples/<bereich>/<bundesland>/*.json
 * mit einem Bereich aus BEREICHE (Katastrophenschutz, Feuerwehr) wird beim Build
 * per Glob eingelesen und steht dann als Vorlage der jeweiligen Organisation und
 * des jeweiligen Bundeslands zur Verfügung. Neue Bundesländer oder Einheiten
 * (z. B. aus künftigen StAN- oder Verordnungsunterlagen) erscheinen dadurch ohne
 * Codeänderung, sobald der Beispielbogen abgelegt ist. Der Bereich gruppiert die
 * Auswahlliste, weil unter derselben Organisation und demselben Bundesland zwei
 * Regelwerke stehen können (KatS-StAN und Feuerwehrverordnung des Landes).
 * Siehe docs/entwicklung.md.
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
  /** Ordner-Slug des Regelwerks, z. B. "katastrophenschutz" oder "feuerwehr". */
  bereich: string;
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

/**
 * Landesrechtliche Bereiche in der Reihenfolge, in der sie in der Auswahl
 * erscheinen. Nur Ordner mit einer Bundesland-Ebene darunter gehören hierher —
 * die organisationseigenen Beispiele (examples/thw, examples/dlrg) sind bundes-
 * bzw. verbandsweit gültig und keine Landesvorlagen.
 */
const BEREICHE = ["katastrophenschutz", "feuerwehr"] as const;

const BEREICH_LABEL: Record<string, string> = {
  katastrophenschutz: "Katastrophenschutz",
  feuerwehr: "Feuerwehr (Landesrecht)",
};

/** Lesbarer Name eines Bereichs-Ordners. */
export function bereichLabel(slug: string): string {
  return BEREICH_LABEL[slug] ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Glob wird beim Build aufgelöst; neue Dateien/Ordner erscheinen automatisch.
// Der Pfad ist bewusst zweistufig (<bereich>/<bundesland>/datei.json) — daran
// hängt die Ableitung von Bereich und Bundesland.
const MODULE = import.meta.glob<Erfassungsbogen>(
  ["../../examples/katastrophenschutz/*/*.json", "../../examples/feuerwehr/*/*.json"],
  { eager: true, import: "default" },
);

const ABGELEITET: Landesvorlage[] = Object.entries(MODULE)
  .map(([pfad, bogen]): Landesvorlage => {
    const teile = pfad.split("/");
    const iExamples = teile.lastIndexOf("examples");
    return {
      organisation: bogen.einheit.organisation,
      bereich: teile[iExamples + 1] ?? "",
      bundesland: teile[iExamples + 2] ?? "",
      name: bogen.einheit.einheitsTyp.freitext ?? "",
      einheitsTyp: bogen.einheit.einheitsTyp,
      personal: bogen.personal.map(platzAusPerson),
      fahrzeuge: bogen.fahrzeuge.map(fahrzeugAusVorlage),
    };
  })
  .filter((v) => v.name !== "" && v.bundesland !== "" && (BEREICHE as readonly string[]).includes(v.bereich));

// Eine Vorlage je (Organisation, Bundesland, Einheitstyp) — kommt derselbe
// Einheitstyp aus mehreren Kreisen, gewinnt der erste (Struktur ist gleich).
// Der Bereich steckt bewusst NICHT im Schlüssel: die Auswahl gibt nur den Namen
// zurück, und ein Einheitstyp trägt in beiden Regelwerken dieselbe Bedeutung.
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

/**
 * Einheitstyp-Namen für (Organisation, Bundesland), nach Bereich gruppiert und
 * je Gruppe sortiert — die Reihenfolge der Gruppen ist die von BEREICHE.
 */
export function landesvorlagenGruppen(
  org: OrganisationsTyp,
  bundesland: string,
): { bereich: string; namen: string[] }[] {
  const passend = VORLAGEN.filter((v) => v.organisation === org && v.bundesland === bundesland);
  return BEREICHE.map((bereich) => ({
    bereich,
    namen: passend
      .filter((v) => v.bereich === bereich)
      .map((v) => v.name)
      .sort((a, b) => a.localeCompare(b, "de")),
  })).filter((g) => g.namen.length > 0);
}

/** Konkrete Vorlage nachschlagen (undefined, wenn nicht vorhanden). */
export function landesvorlage(org: OrganisationsTyp, bundesland: string, name: string): Landesvorlage | undefined {
  return KATALOG.get(`${org}|${bundesland}|${name}`);
}
