/**
 * Taktische Zeichen (DV 102) für Fahrzeuge und Einheiten als SVG-String —
 * links neben jedem Fahrzeug im Papier-Erfassungsbogen und als „Avatar" der
 * Einheit in der Oberfläche.
 *
 * Quelle der Zeichen ist die Sammlung von jonas-koeritz (siehe
 * src/vokabulare/taktische-zeichen-symbole.ts). Anders als ein Zeichen-
 * Generator liefert sie fertige, benannte Zeichen: statt einer allgemeinen
 * Fahrzeug-Silhouette mit aufgedrucktem Kurzzeichen steht dort das echte
 * GKW-, MLW-IV- oder Löschgruppen-Zeichen. Diese Datei ist deshalb im Kern
 * eine Zuordnung: Vokabular-Eintrag → Name des Zeichens.
 *
 * Drei Stufen, in dieser Reihenfolge:
 *  1. Bekannter Vokabular-Code (nur THW) → fest zugeordnetes Zeichen.
 *  2. Freitext → Namenssuche über Dateinamen und Titel der Zeichen, zuerst
 *     im Bereich der Organisation, dann in den neutralen Grundzeichen.
 *  3. Kein Treffer → Grundzeichen (Kfz, Anhänger, Boot …) in der Farbe der
 *     Organisation, mit dem Kurzzeichen als Beschriftung. Das entspricht
 *     dem, was der Bogen vorher immer gezeichnet hat.
 *
 * Die Datei bleibt bewusst DOM-frei (nur String-Verarbeitung): sie läuft
 * unverändert im Browser, in den Unit-Tests und beim PDF-Bau.
 */

import type { Einheit, Fahrzeug } from "../model";
import { OrganisationsTyp } from "../model";
import { TZ_SYMBOLE, TZ_TITEL } from "../vokabulare/taktische-zeichen-symbole";
import { vokabText, vokabularFuer } from "./hilfen";

// ------------------------------------------------------------- Organisation

/** Neutrale Grundfarbe der Sammlung (weißes Zeichen mit schwarzem Rand). */
const NEUTRAL = "#FFFFFF";

interface OrgZeichen {
  /** Bereiche für Fahrzeugzeichen, in Suchreihenfolge. */
  fahrzeuge: string[];
  /** Bereiche für Zeichen taktischer Formationen, in Suchreihenfolge. */
  einheiten: string[];
  /** Grundfarbe der Organisation — färbt neutrale Rückfallzeichen ein. */
  farbe: string;
}

/**
 * Die Sammlung ordnet ihre Zeichen nach Organisation (eigene Ordner mit
 * eingebauter Farbe). Am Ende jeder Liste stehen die neutralen Bereiche als
 * Auffangnetz; ein von dort geholtes Zeichen wird nachträglich eingefärbt.
 */
const ORG_ZEICHEN: Record<OrganisationsTyp, OrgZeichen> = {
  [OrganisationsTyp.THW]: {
    fahrzeuge: ["THW_Fahrzeuge", "Fahrzeuge"],
    einheiten: ["THW_Einheiten", "Einheiten"],
    farbe: "#003399",
  },
  [OrganisationsTyp.FEUERWEHR]: {
    fahrzeuge: ["Feuerwehr_Fahrzeuge", "Fahrzeuge"],
    einheiten: ["Feuerwehr_Einheiten", "Einheiten"],
    farbe: "#FF0000",
  },
  [OrganisationsTyp.POLIZEI]: {
    fahrzeuge: ["Polizei_Fahrzeuge", "Fahrzeuge"],
    einheiten: ["Polizei_Einheiten", "Einheiten"],
    farbe: "#13A538",
  },
  [OrganisationsTyp.BUNDESPOLIZEI]: {
    fahrzeuge: ["Polizei_Fahrzeuge", "Fahrzeuge"],
    einheiten: ["Polizei_Einheiten", "Einheiten"],
    farbe: "#13A538",
  },
  [OrganisationsTyp.BUNDESWEHR]: {
    fahrzeuge: ["Bundeswehr_Fahrzeuge", "Fahrzeuge"],
    einheiten: ["Bundeswehr_Einheiten", "Einheiten"],
    farbe: "#996633",
  },
  // Hilfsorganisationen zeichnen im Rettungswesen — dort sind die Zeichen
  // neutral (weiß) gehalten, die Organisation steht nicht in der Farbe.
  [OrganisationsTyp.DRK]: hilfsorganisation(),
  [OrganisationsTyp.JUH]: hilfsorganisation(),
  [OrganisationsTyp.MHD]: hilfsorganisation(),
  [OrganisationsTyp.ASB]: hilfsorganisation(),
  [OrganisationsTyp.RETTUNGSDIENST]: hilfsorganisation(),
  [OrganisationsTyp.DLRG]: {
    fahrzeuge: ["Rettungswesen_Fahrzeuge", "Fahrzeuge"],
    einheiten: ["Wasserrettung_Einheiten", "Rettungswesen_Einheiten", "Einheiten"],
    farbe: NEUTRAL,
  },
  [OrganisationsTyp.SONSTIGE]: {
    fahrzeuge: ["Fahrzeuge"],
    einheiten: ["Einheiten"],
    farbe: NEUTRAL,
  },
};

function hilfsorganisation(): OrgZeichen {
  return {
    fahrzeuge: ["Rettungswesen_Fahrzeuge", "Fahrzeuge"],
    einheiten: ["Rettungswesen_Einheiten", "Katastrophenschutz_Einheiten", "Einheiten"],
    farbe: NEUTRAL,
  };
}

// ------------------------------------------------------------- Namenssuche

/**
 * Vergleichsform eines Namens: klein, ohne Trenner und Satzzeichen.
 * „LF 16-TS", „LF_16-TS" und „lf16ts" landen so auf demselben Schlüssel.
 */
function normalisiert(text: string): string {
  return text
    .toLowerCase()
    .replaceAll("ß", "ss")
    .replace(/[^a-z0-9äöü]+/g, "");
}

/**
 * Suchindex je Bereich: Vergleichsform → Schlüssel des Zeichens. Indiziert
 * werden Dateiname und Titel; bei Gleichstand gewinnt der zuerst gesehene
 * Eintrag (die Sammlung hat vereinzelt doppelte Titel).
 */
const INDEX: Map<string, Map<string, string>> = (() => {
  const index = new Map<string, Map<string, string>>();
  const merken = (bereich: string, name: string, schluessel: string) => {
    let b = index.get(bereich);
    if (!b) index.set(bereich, (b = new Map()));
    const norm = normalisiert(name);
    if (norm && !b.has(norm)) b.set(norm, schluessel);
  };
  for (const schluessel of Object.keys(TZ_SYMBOLE)) {
    const trenner = schluessel.indexOf("/");
    const bereich = schluessel.slice(0, trenner);
    merken(bereich, schluessel.slice(trenner + 1), schluessel);
  }
  // Titel erst danach, damit ein Dateiname nie von einem fremden Titel
  // verdrängt wird (Dateiname ist die genauere Bezeichnung).
  for (const [schluessel, titel] of Object.entries(TZ_TITEL)) {
    merken(schluessel.slice(0, schluessel.indexOf("/")), titel, schluessel);
  }
  return index;
})();

/** Erstes vorhandenes Zeichen aus der Kandidatenliste (leer, wenn keins). */
function holen(...schluessel: (string | undefined)[]): string {
  for (const s of schluessel) {
    const svg = s != null ? TZ_SYMBOLE[s] : undefined;
    if (svg) return svg;
  }
  return "";
}

/** Erstes Zeichen, dessen Name in einem der Bereiche passt. */
function suche(bereiche: string[], namen: string[]): string | undefined {
  for (const bereich of bereiche) {
    const b = INDEX.get(bereich);
    if (!b) continue;
    for (const name of namen) {
      const treffer = b.get(normalisiert(name));
      if (treffer) return treffer;
    }
  }
  return undefined;
}

// ---------------------------------------------------------- SVG-Nachbearbeitung

/**
 * Färbt ein neutrales Zeichen in die Farbe der Organisation. Die Sammlung
 * baut jedes Zeichen gleich auf: das Grundelement trägt die Clip-Maske
 * `#symbol`, gefüllt weiß mit schwarzem Rand (neutral) bzw. farbig mit
 * weißem Rand (Organisation). Genau dieser Tausch passiert hier.
 */
function einfaerben(svg: string, farbe: string): string {
  if (farbe === NEUTRAL) return svg;
  return svg.replace(/<(?:path|rect|ellipse|polygon)\b[^>]*clip-path="url\(#symbol\)"[^>]*\/>/, (element) =>
    element.replace(/fill="#FFFFFF"/i, `fill="${farbe}"`).replace(/stroke="#000000"/i, 'stroke="#FFFFFF"'),
  );
}

function xmlText(text: string): string {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

/**
 * Schreibt das Kurzzeichen mittig ins Zeichen — im selben Stil, den die
 * Sammlung für ihre eigenen Beschriftungen nutzt. Nur für Rückfallzeichen:
 * ein benanntes Zeichen bringt seine Beschriftung schon mit.
 */
function beschriften(svg: string, text: string, farbe: string): string {
  const schrift = farbe === NEUTRAL ? "#000000" : "#FFFFFF";
  const element =
    `<text style="font-family: 'Roboto'; font-weight: bold; text-anchor: middle; font-size: 48px;"` +
    ` fill="${schrift}" x="128" y="145">${xmlText(text)}</text>`;
  return svg.replace("</svg>", `${element}</svg>`);
}

// -------------------------------------------------------------- Grundzeichen

/**
 * Grundzeichen (Fahrzeug-Silhouette) aus Kurzzeichen + Name ableiten, wenn
 * kein benanntes Zeichen passt. Reihenfolge ist Absicht: Anhänger vor
 * Wechsellader (z. B. „Anh …" schlägt ein enthaltenes „WLF" nicht),
 * Wasser vor „gl".
 */
export type Grundzeichen = "anhaenger" | "wasserfahrzeug" | "wechsellader" | "kraftfahrzeug-gelaendegaengig" | "kraftfahrzeug";

export function grundzeichenFuer(text: string): Grundzeichen {
  const t = text.toLowerCase();
  if (/\banh\b|anhänger|auflieger/.test(t)) return "anhaenger";
  if (/mzab|\bboot\b|wasserfahrzeug/.test(t)) return "wasserfahrzeug";
  if (/wlf|wechsellader/.test(t)) return "wechsellader";
  if (/\bgl\b|geländeg/.test(t)) return "kraftfahrzeug-gelaendegaengig";
  return "kraftfahrzeug";
}

/** Kandidaten je Grundzeichen — die Bereiche benennen dasselbe verschieden. */
const GRUNDZEICHEN_NAMEN: Record<Grundzeichen, string[]> = {
  anhaenger: ["Anhänger", "Feuerwehranhänger"],
  wasserfahrzeug: ["Wasserfahrzeug", "Boot", "Feuerwehrboot"],
  wechsellader: ["Wechselladerfahrzeug"],
  "kraftfahrzeug-gelaendegaengig": ["Kraftfahrzeug geländegängig", "Kraftfahrzeug"],
  kraftfahrzeug: ["Kraftfahrzeug", "Fahrzeug"],
};

/**
 * Grundzeichen taktischer Formationen nach Größe der Einheit. Ohne führende
 * Wortgrenze, damit auch „Löschzug" und „Betreuungsstaffel" greifen; „trupp"
 * steht hinten, aber `zug\b` endet vor „Zugtrupp" — der ist ein Trupp.
 * Kein Treffer heißt Gruppe (der Regelfall im Bogen).
 */
const FORMATION_NAMEN: { muster: RegExp; namen: string[] }[] = [
  { muster: /verband|bereitschaft/, namen: ["Verband", "Zug"] },
  { muster: /zug\b/, namen: ["Zug"] },
  { muster: /staffel/, namen: ["Staffel"] },
  { muster: /trupp/, namen: ["Trupp"] },
];

// -------------------------------------------------- Feste Zuordnung THW

/**
 * THW-Fahrzeugtyp (Code aus THW_FAHRZEUGTYPEN) → Zeichen in THW_Fahrzeuge.
 *
 * Nicht aufgeführt sind die Typen, für die die Sammlung nur den nackten
 * Anhänger hätte (Auflieger, Anh Plane/Spriegel, Anh BDF, Anh ASH): die
 * laufen über den Rückfallweg und bekommen dort ihr Kurzzeichen aufgedruckt
 * — ein beschriftetes Grundzeichen sagt mehr als ein namenloses.
 *
 * Wo etwas Ähnliches existiert, steht das nächstliegende Zeichen:
 * WLF Tank → Wechsellader (kein Tank-Abrollbehälter in der Sammlung),
 * Schreitbagger → Radbagger, Mobilkran → LKW mit Ladekran.
 * Die NEA-Größen mittel/groß/sehr groß sind die THW-Anlagen 50/200/650 kVA
 * (FGr N führt die „mittlere", FGr E die beiden großen).
 */
export const THW_FAHRZEUG_ZEICHEN: Record<number, string> = {
  1: "FmKW",
  2: "FüKW",
  3: "FüKomKW",
  4: "GKW_I",
  5: "MTW_FGr",
  6: "MLW_IV",
  7: "Kipper",
  8: "LKW_Lbw",
  9: "LKW-Ladekran_nicht_geländegängig",
  10: "LKW-Ladekran",
  11: "Wechselladerfahrzeug",
  12: "Wechselladerfahrzeug",
  13: "Sattelzugmaschine",
  15: "PKW_Geländegängig",
  16: "Radbagger",
  17: "Radlader",
  18: "Teleskoplader",
  19: "Radbagger",
  20: "LKW-Ladekran",
  21: "Gabelstapler",
  22: "Mehrzweckarbeitsboot",
  23: "MTW-TZ",
  24: "MTW",
  25: "MzKW",
  26: "MzGW",
  40: "Anhänger_2t",
  41: "Anhänger_K_1t",
  42: "Anhänger_FüLa",
  44: "Anhänger_PF_12t",
  45: "Anhänger_Tieflader_18t",
  46: "Anhänger_DLE",
  47: "Anhänger_NEA_50kVA_LiMa",
  48: "Anhänger_NEA_200kVA",
  49: "Anhänger_NEA_650kVA",
  50: "Anhänger_SwPu_5000",
  51: "Anhänger_SwPu_15000",
  52: "Anhänger_SwPu_25000",
  53: "Anhänger_TWAA",
};

/**
 * THW-Einheitstyp (Code aus THW_EINHEITSTYPEN) → Zeichen in THW_Einheiten.
 * Die Ortungs-Typen der Sammlung heißen nach ihrer Ausstattung: (A) ist
 * biologisch und technisch, (B) biologisch, (C) technisch. Der Dateiname
 * „Wassserschaden" ist ein Tippfehler der Sammlung und bleibt so stehen.
 */
export const THW_EINHEIT_ZEICHEN: Record<number, string> = {
  1: "Media_Team",
  2: "VOST",
  3: "Zugtrupp",
  4: "Bergungsgruppe",
  5: "Bergungsgruppe_ASH",
  6: "FGr_Räumen_A",
  7: "FGr_Räumen_B",
  8: "FGr_Räumen_C",
  9: "FGr_Wassergefahren_A",
  10: "FGr_Wassergefahren_B",
  11: "FGr_Brückenbau",
  12: "FGr_Ortung_biologisch_und_technisch",
  13: "FGr_Ortung_biologisch",
  14: "FGr_Ortung_technisch",
  15: "FGr_Sprengen",
  16: "FGr_Notversorgung_und_Notinstandsetzung",
  17: "SEEBA",
  18: "FGr_Schwere_Bergung_A",
  19: "FGr_Schwere_Bergung_B",
  20: "Trupp_ESS",
  21: "Trupp_MHP",
  22: "Trupp_UL",
  23: "FGr_Bergungstauchen",
  24: "FGr_Infrastruktur",
  25: "FGr_Elektroversorgung",
  26: "FGr_Trinkwasser",
  27: "FGr_Wassserschaden-Pumpen_A",
  28: "FGr_Wassserschaden-Pumpen_B",
  29: "FGr_Wassserschaden-Pumpen_C",
  30: "FGr_Ölschaden_A",
  31: "FGr_Ölschaden_B",
  32: "FGr_Ölschaden_C",
  33: "SEEWA",
  34: "ENT",
  35: "SEELift",
  36: "Zugtrupp_FZ-Logistik",
  37: "FGr_Logistik_Materialwirtschaft",
  38: "FGr_Logistik-Verpflegung",
  39: "Trupp_TS",
  40: "SysBR",
  41: "Zugtrupp_FZ-FK",
  42: "FGr_Führungsunterstützung",
  43: "FGr_Kommunikation_A",
  44: "FGr_Kommunikation_B",
  45: "Stab",
};

// -------------------------------------------------------------- Fahrzeuge

/**
 * Kurze Beschriftung im Rückfallzeichen (wie in der Vorlage: FmKW, FüKW, 2t …).
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
  const zeichen = ORG_ZEICHEN[org] ?? ORG_ZEICHEN[OrganisationsTyp.SONSTIGE];
  const tabelle = vokabularFuer(org, "fahrzeug");
  const kurz = vokabText(f.typ, tabelle, "kurz");
  const name = vokabText(f.typ, tabelle, "name");

  const code = org === OrganisationsTyp.THW ? f.typ?.code : undefined;
  const fest = code != null ? THW_FAHRZEUG_ZEICHEN[code] : undefined;
  const treffer = holen(
    fest ? `THW_Fahrzeuge/${fest}` : undefined,
    suche(zeichen.fahrzeuge, [kurz, name].filter(Boolean)),
  );
  if (treffer) return einfaerben(treffer, zeichen.farbe);

  const grund = suche(zeichen.fahrzeuge, GRUNDZEICHEN_NAMEN[grundzeichenFuer(`${kurz} ${name}`)]);
  const svg = einfaerben(holen(grund, "Fahrzeuge/Kraftfahrzeug"), zeichen.farbe);
  const label = beschriftung(kurz);
  return label ? beschriften(svg, label, zeichen.farbe) : svg;
}

// --------------------------------------------------------------- Einheiten

/**
 * Taktisches Zeichen der Einheit selbst (taktische Formation, DV 102) — der
 * „Avatar" der Einheit in der Oberfläche. Für bekannte THW-Einheitstypen ist
 * das das echte Fachgruppen-Zeichen; sonst die Formation passender Größe,
 * beschriftet mit dem Kurzzeichen.
 */
export function einheitSymbolSvg(e: Einheit): string {
  const zeichen = ORG_ZEICHEN[e.organisation] ?? ORG_ZEICHEN[OrganisationsTyp.SONSTIGE];
  const tabelle = vokabularFuer(e.organisation, "einheitstyp");
  const kurz = vokabText(e.einheitsTyp, tabelle, "kurz").trim();
  const name = vokabText(e.einheitsTyp, tabelle, "name").trim();

  const code = e.organisation === OrganisationsTyp.THW ? e.einheitsTyp?.code : undefined;
  const fest = code != null ? THW_EINHEIT_ZEICHEN[code] : undefined;
  const treffer = holen(
    fest ? `THW_Einheiten/${fest}` : undefined,
    suche(zeichen.einheiten, [kurz, name].filter(Boolean)),
  );
  if (treffer) return einfaerben(treffer, zeichen.farbe);

  const text = `${kurz} ${name}`.toLowerCase();
  const formation = FORMATION_NAMEN.find((f) => f.muster.test(text));
  const grund = suche(zeichen.einheiten, formation?.namen ?? ["Gruppe"]);
  const svg = einfaerben(holen(grund, "Einheiten/Gruppe"), zeichen.farbe);
  return kurz.length > 0 && kurz.length <= 10 ? beschriften(svg, kurz, zeichen.farbe) : svg;
}

/** SVG-String → data:-URL für <img>-Anzeige in der Oberfläche. */
export function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
