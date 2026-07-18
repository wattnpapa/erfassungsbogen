/**
 * Erzeugt Beispiel-Erfassungsbögen der Katastrophenschutzeinheiten des Landes
 * Brandenburg als PDF nach examples/katastrophenschutz/brandenburg/.
 * Wie bei den übrigen Generatoren steckt das maschinenlesbare JSON bereits im
 * eingebetteten QR-Code der PDF.
 *
 * Aufruf (Node ≥ 22): npm run beispiele:kats-bb
 *
 * Grundlage ist die Brandenburgische Katastrophenschutzverordnung (KatSV vom
 * 17. Oktober 2012, zuletzt geändert am 16. Dezember 2021) mit ihrer Anlage zu
 * § 4 Absatz 1 „Übersicht zur Mindestausstattung von Fachdiensten und Einheiten
 * der unteren Katastrophenschutzbehörden".
 *
 * WICHTIGER UNTERSCHIED zu Sachsen und Niedersachsen: Die Brandenburger Anlage
 * regelt je Einheit nur die personelle Mindeststärke (Führer/Unterführer/Helfer/
 * Gesamt) und eine Mindest-ANZAHL an Einsatz-Kfz — sie nennt weder Fahrzeugtypen
 * noch eine Untergliederung in Teileinheiten. Deshalb:
 *   - ein Bogen je Einheit der Anlage (acht Stück), nicht je Teileinheit;
 *   - die Stärke und die Zahl der Einsatz-Kfz sind exakt der Anlage entnommen
 *     und werden am Ende gegen sie geprüft;
 *   - die Fahrzeug-TYPEN sind NICHT verordnungsgeregelt. Sie sind hier
 *     beispielhaft aus dem Katalog „Funkkennziffern Feuerwehr & Rettungsdienst
 *     im Land Brandenburg" belegt, damit die Bögen vollständige, im Land
 *     stimmige Funkrufnamen zeigen. Die verbindliche Technikausstattung regeln
 *     die Ausführungsvorschriften nach § 8 KatSV.
 * Das ist im README des Zielordners und im Feld „Sonstiges" jedes Bogens
 * ausdrücklich vermerkt.
 *
 * Die Funkrufnamen folgen dem Brandenburger Schema
 *   „<Kennwort> <Bereich> <Amt/Gemeinde/Stadt>/<Funkkennziffer>/<Ordnungsnummer>"
 * (Beispiel des Katalogs: „Florian Fläming 10/41/03"). Anders als in Sachsen ist
 * die Ortsbezeichnung also NICHT die Gemeinde, sondern die Bereichs-/Kreis-
 * bezeichnung; die Gemeinde steckt in der ersten Teilkennzahl. Deshalb wird
 * eigenerStandort = false gesetzt und der Bereich als ort geführt.
 *
 * Fiktiv sind alle Personen, Standort-Zuordnungen, Gemeindeschlüssel und
 * Kennzeichen.
 *
 * Am Ende läuft eine Selbstprüfung (Stärke und Kfz-Zahl gegen die Anlage,
 * Funkrufname je motorisiertem Fahrzeug, QR-Roundtrip); die README im
 * Zielordner bekommt eine Übersichtstabelle.
 */

import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pdfmake from "pdfmake";
import QRCode from "qrcode";
import {
  Erfassungsbogen,
  Ernaehrung as E,
  Fahrerlaubnis as FE,
  Fahrzeug,
  Geschlecht as G,
  HierarchieEbene,
  KontaktArt,
  OrganisationsTyp,
  Person,
  PersonalErfassung,
  SCHEMA_VERSION,
  StaerkeRolle as R,
  VokabularWert,
  datumAusIso,
  staerke,
} from "../src/model";
import {
  EEB_URL_PREFIX,
  QR_EINZEL_MAX_VERSION,
  QR_SEGMENT_ZIEL_VERSION,
  base64UrlDekodieren,
  base64UrlKodieren,
  decodePayload,
  encodePayload,
  parseSegmentUrl,
  segmentPayloadUrls,
} from "../src/codec";
import { nodeKompressor } from "../src/qr-node";
import { pdfDokument } from "../src/app/pdf-dokument";
import type { QrSatz, QrTeil } from "../src/app/hilfen";

const wurzel = join(dirname(fileURLToPath(import.meta.url)), "..");

// ------------------------------------------------------------ Zufall (seeded)

/** mulberry32 — deterministischer PRNG, damit die Beispiele reproduzierbar sind. */
function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = prng(20261017); // Datum der KatSV
const ganz = (minInkl: number, maxInkl: number): number =>
  minInkl + Math.floor(rnd() * (maxInkl - minInkl + 1));
const wuerfel = (p: number): boolean => rnd() < p;
const wahl = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)]!;
function gewichtet<T>(paare: readonly (readonly [T, number])[]): T {
  const summe = paare.reduce((s, [, g]) => s + g, 0);
  let r = rnd() * summe;
  for (const [wert, g] of paare) {
    r -= g;
    if (r <= 0) return wert;
  }
  return paare[paare.length - 1]![0];
}

// ------------------------------------------------------------- Namens-Pools

const VORNAMEN_M = [
  "Andreas", "Bernd", "Christian", "Daniel", "Danilo", "Dennis", "Detlef", "Dirk",
  "Enrico", "Falko", "Frank", "Gunnar", "Hagen", "Hendrik", "Jan", "Jens",
  "Jörg", "Karsten", "Kay", "Lars", "Lukas", "Maik", "Marco", "Mario",
  "Markus", "Martin", "Matthias", "Michael", "Nico", "Norbert", "Olaf", "Patrick",
  "Paul", "Peter", "Philipp", "Ralf", "René", "Robert", "Ronny", "Sebastian",
  "Steffen", "Sven", "Thomas", "Tino", "Tobias", "Torsten", "Uwe", "Volker",
] as const;
const VORNAMEN_W = [
  "Anja", "Anke", "Annett", "Antje", "Beate", "Bianca", "Carola", "Christin",
  "Claudia", "Cornelia", "Doreen", "Franziska", "Grit", "Heike", "Ines", "Jana",
  "Josephine", "Katrin", "Kerstin", "Kristin", "Lea", "Lisa", "Manuela", "Mandy",
  "Maria", "Nadine", "Nicole", "Peggy", "Ramona", "Sabine", "Sandra", "Sarah",
  "Silke", "Simone", "Steffi", "Susann", "Ulrike", "Yvonne",
] as const;
const NACHNAMEN = [
  "Ahrendt", "Bandelow", "Bauer", "Becker", "Below", "Bergmann", "Bethke", "Böhm",
  "Brandt", "Buchholz", "Dallmann", "Dittrich", "Domke", "Draheim", "Ebert", "Eichler",
  "Engelmann", "Fiedler", "Fischer", "Franke", "Gerhardt", "Giese", "Görlitz", "Grabow",
  "Grimm", "Günther", "Haase", "Hagen", "Hartmann", "Heinrich", "Hempel", "Hennig",
  "Herrmann", "Hoffmann", "Jahnke", "Kaiser", "Keller", "Kirchner", "Klemm", "Köhler",
  "Krause", "Kruse", "Kühn", "Lange", "Lehmann", "Lindner", "Löffler", "Lorenz",
  "Marquardt", "Meißner", "Müller", "Naumann", "Neumann", "Nitsche", "Noack", "Pätzold",
  "Pieper", "Pohl", "Radtke", "Reimann", "Richter", "Riedel", "Röhl", "Rudolph",
  "Schmidt", "Schneider", "Scholz", "Schulz", "Schulze", "Seidel", "Sommer", "Stein",
  "Thiele", "Tietz", "Ulrich", "Vogel", "Voigt", "Wagner", "Weber", "Wegner",
  "Wenzel", "Werner", "Winkler", "Wolf", "Zander", "Zimmermann",
] as const;

/** Externe/Berufs-Qualifikationen (Freitext) — gelegentlich gestreut. */
const QUALI_POOL = [
  "Berufskraftfahrer (Beruf)",
  "Rettungssanitäter (extern)",
  "Elektrofachkraft (Beruf)",
  "Koch (Beruf)",
  "Gesundheits- und Krankenpfleger (Beruf)",
  "Atemschutzgeräteträger",
  "Motorsägenschein (extern)",
  "Funkamateur (extern)",
  "Sprechfunker",
] as const;

// ------------------------------------------------------- Brandenburg: Orte

interface BbOrt {
  /** Sitz der Einheit (Amt, Gemeinde, Stadt). */
  ort: string;
  /** Landkreis bzw. kreisfreie Stadt = untere Katastrophenschutzbehörde. */
  kreis: string;
  kfz: string;
  /**
   * Bereichs-/Ortsbezeichnung im Funkrufnamen. In Brandenburg wird der
   * Kreis- bzw. Bereichsname geführt („Florian Fläming …"), nicht die Gemeinde.
   */
  bereich: string;
  /**
   * Erste Teilkennzahl = Schlüssel des Amtes/der Gemeinde/Stadt im Kreis.
   * Die Vergabe liegt bei der unteren Katastrophenschutzbehörde; die Werte hier
   * sind fiktiv (der Katalog nennt beispielhaft „10").
   */
  gemeindeschluessel: number;
}

/** Ein Standort je Einheit, quer durch die unteren Katastrophenschutzbehörden. */
const BB_ORTE: Record<string, BbOrt> = {
  neuruppin: {
    ort: "Neuruppin", kreis: "Landkreis Ostprignitz-Ruppin", kfz: "OPR",
    bereich: "Ostprignitz-Ruppin", gemeindeschluessel: 10,
  },
  cottbus: {
    ort: "Cottbus", kreis: "Stadt Cottbus", kfz: "CB",
    bereich: "Cottbus", gemeindeschluessel: 10,
  },
  schwedt: {
    ort: "Schwedt/Oder", kreis: "Landkreis Uckermark", kfz: "UM",
    bereich: "Uckermark", gemeindeschluessel: 24,
  },
  potsdam: {
    ort: "Potsdam", kreis: "Landeshauptstadt Potsdam", kfz: "P",
    bereich: "Potsdam", gemeindeschluessel: 10,
  },
  luckenwalde: {
    ort: "Luckenwalde", kreis: "Landkreis Teltow-Fläming", kfz: "TF",
    bereich: "Fläming", gemeindeschluessel: 10,
  },
  eberswalde: {
    ort: "Eberswalde", kreis: "Landkreis Barnim", kfz: "BAR",
    bereich: "Barnim", gemeindeschluessel: 14,
  },
  brandenburg: {
    ort: "Brandenburg an der Havel", kreis: "Stadt Brandenburg an der Havel", kfz: "BRB",
    bereich: "Havel", gemeindeschluessel: 10,
  },
  senftenberg: {
    ort: "Senftenberg", kreis: "Landkreis Oberspreewald-Lausitz", kfz: "OSL",
    bereich: "Lausitz", gemeindeschluessel: 22,
  },
};

// ------------------------------------------------------------------ Träger

interface Traeger {
  org: OrganisationsTyp;
  /** Funkruf-Kennwort der Trägerorganisation. */
  kennwort: VokabularWert;
  organisationName: (o: BbOrt) => string;
  ebene: (o: BbOrt) => HierarchieEbene[];
}

/** FUNKRUF_KENNWOERTER-Codes (src/vokabulare/thw.ts). */
const KW = { FLORIAN: 2, ROTKREUZ: 3, AKKON: 4, SAMA: 6, PELIKAN: 7 } as const;

const kreisKurz = (o: BbOrt): string =>
  o.kreis.replace(/^(Landkreis|Stadt|Landeshauptstadt)\s+/, "");

/**
 * Regieeinheiten der unteren Katastrophenschutzbehörde bzw. Einheiten der
 * öffentlichen Feuerwehren (§ 3 Absatz 1 KatSV).
 */
const feuerwehr: Traeger = {
  org: OrganisationsTyp.FEUERWEHR,
  kennwort: { code: KW.FLORIAN },
  organisationName: (o) => `Feuerwehr ${o.kreis}`,
  ebene: (o) => [{ bezeichnung: { freitext: "Untere KatS-Behörde" }, name: o.kreis }],
};

/** Mitwirkende Hilfsorganisationen nach § 18 Absatz 1 BbgBKG (§ 3 Absatz 1 KatSV). */
function hiorg(org: OrganisationsTyp, kennwort: VokabularWert, kurz: string, lang: string): Traeger {
  return {
    org,
    kennwort,
    organisationName: (o) => `${lang} ${o.kreis}`,
    ebene: (o) => [
      { bezeichnung: { freitext: `${kurz}-Kreisverband` }, name: kreisKurz(o) },
      { bezeichnung: { freitext: "Untere KatS-Behörde" }, name: o.kreis },
    ],
  };
}
const drk = hiorg(OrganisationsTyp.DRK, { code: KW.ROTKREUZ }, "DRK", "Deutsches Rotes Kreuz");
const juh = hiorg(OrganisationsTyp.JUH, { code: KW.AKKON }, "JUH", "Johanniter-Unfall-Hilfe");
const asb = hiorg(OrganisationsTyp.ASB, { code: KW.SAMA }, "ASB", "Arbeiter-Samariter-Bund");
const dlrg = hiorg(OrganisationsTyp.DLRG, { code: KW.PELIKAN }, "DLRG", "DLRG");

// --------------------------------------------------------------- Kurzhelfer

function slug(s: string): string {
  return s
    .toLowerCase()
    .replaceAll("ä", "ae").replaceAll("ö", "oe").replaceAll("ü", "ue").replaceAll("ß", "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Diesel-Sofortbedarf je Fahrzeug-Kurzbezeichnung (grobe Richtwerte, Liter). */
function dieselFuer(kurz: string): number {
  if (/^(TLF|SW|WLF|LKW|DLK)/.test(kurz)) return 120;
  if (/^(LF|GW|RW|TSF)/.test(kurz)) return 70;
  if (/^(ELW|KdoW|MTW|NEF|RTW|KTW|GKTW|MZB|RTB)/.test(kurz)) return 45;
  return 0;
}

// --------------------------------------------------------------- Bogen-Specs

interface PlatzSpec {
  rolle: R;
  funktion: string;
  anzahl?: number;
  quali?: string;
  fe?: FE;
}

interface FzSpec {
  kurz: string;
  /** Klartext + Hinweis auf die Herkunft für „Änderungen bzw. Sondergerät". */
  lang?: string;
  anzahl?: number;
  /** Anhänger und Geräte statt Kfz-Kennzeichen; zählen nicht als Einsatz-Kfz. */
  ohneKennzeichen?: string;
  /**
   * Funkkennziffer nach dem Katalog „Funkkennziffern Feuerwehr &
   * Rettungsdienst im Land Brandenburg" (zweite Teilkennzahl).
   * Fehlt = kein Funkrufname (Anhänger).
   */
  kennzahl?: number;
}

interface BogenSpec {
  fachdienst: string;
  /** Abkürzung der Einheit nach der Anlage zu § 4 Absatz 1. */
  kuerzel: string;
  einheit: string;
  traeger: Traeger;
  ortSchluessel: keyof typeof BB_ORTE;
  personal: PlatzSpec[];
  fahrzeuge: FzSpec[];
  szenario: string; // {ort} wird ersetzt
  /** Mindeststärke laut Anlage als "Führer/Unterführer/Helfer/Gesamt" — wird geprüft. */
  soll: [number, number, number, number];
  /** Mindestzahl Einsatz-Kfz laut Anlage — wird geprüft (ohne Anhänger). */
  sollKfz: number;
  gemisch?: boolean;
}

const F = R.FUEHRER;
const U = R.UNTERFUEHRER;
const M = R.MANNSCHAFT;

const QUELLE = "KatSV Anlage zu § 4 Abs. 1";

const SPECS: BogenSpec[] = [
  // ================================================================= Führung
  {
    fachdienst: "Führung",
    kuerzel: "SEG-Fü",
    einheit: "Schnelleinsatzgruppe-Führungsunterstützung",
    traeger: feuerwehr,
    ortSchluessel: "neuruppin",
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Fernmelder/-in", anzahl: 3, quali: "Sprechfunker" },
      { rolle: M, funktion: "Helfer/-in Lagedarstellung", anzahl: 2 },
      { rolle: M, funktion: "Kraftfahrer/-in", anzahl: 3, fe: FE.C1 },
    ],
    fahrzeuge: [
      { kurz: "ELW 2", kennzahl: 12, lang: "Einsatzleitwagen 2 — Führungsunterstützung (Landkreis)" },
      { kurz: "ELW 1", kennzahl: 11, lang: "Einsatzleitwagen 1 (Träger)" },
      { kurz: "MTW", kennzahl: 19, lang: "Mannschaftstransportwagen (Träger)" },
    ],
    szenario: "Flächenlage {ort} — Aufbau und Betrieb der technischen Einsatzleitung",
    soll: [0, 1, 8, 9],
    sollKfz: 3,
  },

  // ============================================================= Brandschutz
  {
    fachdienst: "Brandschutz",
    kuerzel: "BSE",
    einheit: "Brandschutzeinheit",
    traeger: feuerwehr,
    ortSchluessel: "cottbus",
    personal: [
      { rolle: F, funktion: "Einheitsführer/-in" },
      { rolle: F, funktion: "stellv. Einheitsführer/-in" },
      { rolle: F, funktion: "Zugführer/-in", anzahl: 3 },
      { rolle: U, funktion: "Gruppenführer/-in", anzahl: 9 },
      { rolle: U, funktion: "Truppführer/-in", anzahl: 4 },
      { rolle: M, funktion: "Truppmann/Truppfrau", anzahl: 33, quali: "Atemschutzgeräteträger" },
      { rolle: M, funktion: "Truppmann/Truppfrau", anzahl: 14 },
      { rolle: M, funktion: "Maschinist/-in", anzahl: 8, fe: FE.C },
    ],
    fahrzeuge: [
      { kurz: "ELW 2", kennzahl: 12, lang: "Einsatzleitwagen 2 — Führung Brandschutzeinheit (Landkreis)" },
      { kurz: "ELW 1", kennzahl: 11, lang: "Einsatzleitwagen 1 (Träger)", anzahl: 2 },
      { kurz: "LF 20", kennzahl: 44, lang: "Löschgruppenfahrzeug LF 20 (Träger)", anzahl: 4 },
      { kurz: "LF 16-TS", kennzahl: 45, lang: "Löschgruppenfahrzeug LF 16-TS (Bund/Land)", anzahl: 2 },
      { kurz: "TLF 24/50", kennzahl: 24, lang: "Tanklöschfahrzeug TLF 24/50 (Träger)", anzahl: 2 },
      { kurz: "DLK 23/12", kennzahl: 33, lang: "Drehleiter mit Korb DL(K) 23/12 (Träger)" },
      { kurz: "SW 2000-Tr", kennzahl: 63, lang: "Schlauchwagen SW 2000-Truppbesatzung (Bund/Land)", anzahl: 2 },
      { kurz: "MTW", kennzahl: 19, lang: "Mannschaftstransportwagen (Träger)" },
    ],
    szenario: "Großbrand {ort} — Brandbekämpfung und Wasserförderung über lange Wegstrecke",
    soll: [5, 13, 55, 73],
    sollKfz: 15,
  },

  // ======================================================== Gefahrstoffschutz
  {
    fachdienst: "Gefahrstoffschutz",
    kuerzel: "GSE",
    einheit: "Gefahrstoffeinheit",
    traeger: feuerwehr,
    ortSchluessel: "schwedt",
    personal: [
      { rolle: F, funktion: "Einheitsführer/-in" },
      { rolle: U, funktion: "Gruppenführer/-in", anzahl: 3 },
      { rolle: U, funktion: "Truppführer/-in", anzahl: 4 },
      { rolle: M, funktion: "Truppmann/Truppfrau", anzahl: 14, quali: "Atemschutzgeräteträger" },
      { rolle: M, funktion: "Helfer/-in Dekontamination", anzahl: 6 },
      { rolle: M, funktion: "Maschinist/-in", anzahl: 4, fe: FE.C },
    ],
    fahrzeuge: [
      { kurz: "ELW 1", kennzahl: 11, lang: "Einsatzleitwagen 1 — Führung Gefahrstoffeinheit (Landkreis)" },
      { kurz: "GW-G", kennzahl: 54, lang: "Gerätewagen Gefahrgut (Träger)", anzahl: 2 },
      { kurz: "GW-Mess", kennzahl: 57, lang: "Gerätewagen Messtechnik/Strahlenschutz (Land)" },
      { kurz: "GW-Dekon", kennzahl: 59, lang: "Gerätewagen Dekontamination Personen (Bund/Land)" },
      { kurz: "LF 20", kennzahl: 44, lang: "Löschgruppenfahrzeug LF 20 — Brandschutzsicherstellung (Träger)" },
      { kurz: "MTW", kennzahl: 19, lang: "Mannschaftstransportwagen (Träger)" },
    ],
    szenario: "Gefahrstofffreisetzung {ort} — Messen, Abdichten, Dekontamination",
    soll: [1, 7, 24, 32],
    sollKfz: 7,
  },

  // =========================================================== Sanitätsdienst
  {
    fachdienst: "Sanitätsdienst",
    kuerzel: "SEE-San",
    einheit: "Schnelleinsatzeinheit-Sanität",
    traeger: drk,
    ortSchluessel: "potsdam",
    personal: [
      { rolle: F, funktion: "Einheitsführer/-in" },
      { rolle: U, funktion: "Gruppenführer/-in", anzahl: 4 },
      { rolle: U, funktion: "Truppführer/-in", anzahl: 6 },
      { rolle: M, funktion: "Notfallsanitäter/-in", anzahl: 4, quali: "Notfallsanitäter" },
      { rolle: M, funktion: "Rettungssanitäter/-in", anzahl: 9, quali: "Rettungssanitäter" },
      { rolle: M, funktion: "Sanitätshelfer/-in", anzahl: 8 },
      { rolle: M, funktion: "Kraftfahrer/-in", anzahl: 6, fe: FE.C1 },
    ],
    fahrzeuge: [
      { kurz: "ELW 1", kennzahl: 11, lang: "Einsatzleitwagen 1 — Führung SEE-San (Träger)" },
      { kurz: "NEF", kennzahl: 82, lang: "Notarzteinsatzfahrzeug (Träger)" },
      { kurz: "RTW", kennzahl: 83, lang: "Rettungswagen (Träger)", anzahl: 2 },
      { kurz: "KTW", kennzahl: 85, lang: "Krankentransportwagen (Träger)", anzahl: 3 },
      { kurz: "KTW-B", kennzahl: 85, lang: "Krankentransportwagen Typ B für den Katastrophenschutz (Bund)" },
      { kurz: "GKTW", kennzahl: 87, lang: "Großraum-Krankentransportwagen (Land)" },
      { kurz: "GW-San", kennzahl: 89, lang: "Gerätewagen Sanität — Behandlungsplatz (Land)" },
    ],
    szenario: "MANV {ort} — Patientenablage, Behandlungsplatz und Transportorganisation",
    soll: [1, 10, 27, 38],
    sollKfz: 10,
  },

  // ================================================================ Betreuung
  {
    fachdienst: "Betreuung",
    kuerzel: "SEG-Bt",
    einheit: "Schnelleinsatzgruppe-Betreuung",
    traeger: asb,
    ortSchluessel: "luckenwalde",
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Betreuungshelfer/-in", anzahl: 6 },
      { rolle: M, funktion: "Kraftfahrer/-in", anzahl: 2, fe: FE.C1 },
    ],
    fahrzeuge: [
      { kurz: "GW-Bt", kennzahl: 59, lang: "Gerätewagen Betreuung — Feldbetten, Zelt, Sanitär (Land)" },
      { kurz: "MTW", kennzahl: 19, lang: "Mannschaftstransportwagen (Träger)" },
    ],
    szenario: "Evakuierung {ort} — Einrichtung und Betrieb einer Betreuungsstelle",
    soll: [0, 1, 8, 9],
    sollKfz: 2,
  },
  {
    fachdienst: "Betreuung",
    kuerzel: "SEG-V",
    einheit: "Schnelleinsatzgruppe-Verpflegung",
    traeger: juh,
    ortSchluessel: "eberswalde",
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Helfer/-in Verpflegung", anzahl: 5, quali: "Koch (Beruf)" },
      { rolle: M, funktion: "Kraftfahrer/-in", anzahl: 3, fe: FE.C },
    ],
    fahrzeuge: [
      { kurz: "GW-V", kennzahl: 59, lang: "Gerätewagen Verpflegung (Land)" },
      { kurz: "LKW", kennzahl: 74, lang: "Lastkraftwagen mit Ladebordwand (Träger)" },
      { kurz: "MTW", kennzahl: 19, lang: "Mannschaftstransportwagen (Träger)" },
      { kurz: "FKH", lang: "Feldkochherd (Land) — Anhänger, kein Einsatz-Kfz", ohneKennzeichen: "Anh FKH" },
    ],
    szenario: "Flächenlage {ort} — Verpflegung von Einsatzkräften und Betroffenen",
    soll: [0, 1, 8, 9],
    sollKfz: 3,
  },

  // ============================================ Bergung, Teilbereich Wassergefahren
  {
    fachdienst: "Bergung, Teilbereich Wassergefahren",
    kuerzel: "SEG-W",
    einheit: "Schnelleinsatzgruppe-Wassergefahren",
    traeger: dlrg,
    ortSchluessel: "brandenburg",
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in", anzahl: 2 },
      { rolle: M, funktion: "Rettungsschwimmer/-in", anzahl: 4, quali: "Rettungsschwimmabzeichen Silber" },
      { rolle: M, funktion: "Bootsführer/-in", anzahl: 2, quali: "Bootsführerschein Binnen" },
      { rolle: M, funktion: "Kraftfahrer/-in", anzahl: 2, fe: FE.C1 },
    ],
    fahrzeuge: [
      { kurz: "GW-W", kennzahl: 58, lang: "Gerätewagen Wasserrettung (Land)" },
      { kurz: "MZB", kennzahl: 79, lang: "Mehrzweckboot mit Trailer (Land)" },
      { kurz: "RTB", kennzahl: 88, lang: "Rettungsboot mit Trailer (Träger)" },
      { kurz: "MTW", kennzahl: 19, lang: "Mannschaftstransportwagen (Träger)" },
    ],
    szenario: "Hochwasser {ort} — Menschenrettung aus Wassergefahren, Deichverteidigung",
    soll: [0, 2, 8, 10],
    sollKfz: 4,
  },

  // =============================================================== Versorgung
  {
    fachdienst: "Versorgung",
    kuerzel: "SEE-VE",
    einheit: "Schnelleinsatzeinheit-Versorgung Energie",
    traeger: feuerwehr,
    ortSchluessel: "senftenberg",
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Elektrofachkraft", anzahl: 3, quali: "Elektrofachkraft (Beruf)" },
      { rolle: M, funktion: "Kraftfahrer/-in", anzahl: 2, fe: FE.CE },
    ],
    fahrzeuge: [
      { kurz: "GW-Li", kennzahl: 75, lang: "Gerätewagen Licht und Netzersatz (Land)" },
      { kurz: "WLF", kennzahl: 65, lang: "Wechselladerfahrzeug für Abrollbehälter Netzersatz (Landkreis)" },
      { kurz: "NEA 200 kVA", lang: "Netzersatzanlage 200 kVA (Land) — Anhänger, kein Einsatz-Kfz", ohneKennzeichen: "Anh NEA" },
    ],
    szenario: "Langanhaltender Stromausfall {ort} — Notstromversorgung kritischer Infrastruktur",
    soll: [0, 1, 5, 6],
    sollKfz: 2,
    gemisch: true,
  },
];

// ------------------------------------------------------------ Bogen bauen

const vergebeneNamen = new Set<string>();
function neuerName(g: G): { vorname: string; nachname: string } {
  let vorname = "";
  let nachname = "";
  do {
    vorname = wahl(g === G.W ? VORNAMEN_W : VORNAMEN_M);
    nachname = wahl(NACHNAMEN);
  } while (vergebeneNamen.has(`${vorname} ${nachname}`));
  vergebeneNamen.add(`${vorname} ${nachname}`);
  return { vorname, nachname };
}

function personBauen(spec: PlatzSpec, erste: boolean): Person {
  const g = wuerfel(0.25) ? G.W : G.M;
  const { vorname, nachname } = neuerName(g);
  const fe =
    spec.fe ??
    (spec.rolle !== R.MANNSCHAFT
      ? gewichtet<FE>([[FE.C, 4], [FE.CE, 3], [FE.C1, 2], [FE.B, 2]])
      : gewichtet<FE>([[FE.B, 6], [FE.C1, 3], [FE.C, 3], [FE.CE, 2], [FE.NONE, 3]]));
  const person: Person = {
    vorname,
    nachname,
    staerkeRolle: spec.rolle,
    funktionen: [{ freitext: spec.funktion }],
    fahrerlaubnis: fe,
    geschlecht: g,
    ernaehrung: gewichtet<E>([[E.FLEISCH, 78], [E.VEGETARISCH, 15], [E.VEGAN, 7]]),
    kontakte: [],
    zusatzqualifikationen: spec.quali ? [{ freitext: spec.quali }] : [],
  };
  if (person.zusatzqualifikationen.length === 0 && wuerfel(0.12)) {
    person.zusatzqualifikationen = [{ freitext: wahl(QUALI_POOL) }];
  }
  if (erste) {
    person.kontakte.push({
      art: KontaktArt.MOBIL,
      dienstlich: false,
      wert: `01${ganz(5, 7)}${ganz(1, 9)}${String(ganz(0, 9999999)).padStart(7, "0")}`,
    });
  }
  return person;
}

function personalBauen(specs: PlatzSpec[]): Person[] {
  const personen: Person[] = [];
  for (const s of specs) {
    for (let i = 0; i < (s.anzahl ?? 1); i++) {
      personen.push(personBauen(s, personen.length === 0));
    }
  }
  const zweite = personen.filter((p) => p.staerkeRolle !== R.MANNSCHAFT)[1];
  if (zweite && zweite.kontakte.length === 0 && wuerfel(0.6)) {
    zweite.kontakte.push({
      art: KontaktArt.MOBIL,
      dienstlich: false,
      wert: `01${ganz(5, 7)}${ganz(1, 9)}${String(ganz(0, 9999999)).padStart(7, "0")}`,
    });
  }
  return personen;
}

let laufendeNummer = 1;
function kennzeichen(kfz: string): string {
  return `${kfz}-${2000 + (laufendeNummer++ % 8000)}`;
}

function fahrzeugeBauen(specs: FzSpec[], ort: BbOrt, traeger: Traeger): Fahrzeug[] {
  // Dritte Teilkennzahl = Ordnungsnummer, laufend je gleicher Funkkennziffer;
  // der Katalog führt sie zweistellig („…/41/03").
  const belegt = new Map<number, number>();
  const fahrzeuge: Fahrzeug[] = [];
  for (const s of specs) {
    for (let i = 0; i < (s.anzahl ?? 1); i++) {
      const fz: Fahrzeug = { typ: { freitext: s.kurz } };
      if (s.lang) fz.aenderungen = s.lang;
      fz.kennzeichenFreitext = s.ohneKennzeichen ?? kennzeichen(ort.kfz);
      if (s.kennzahl != null) {
        const lfd = (belegt.get(s.kennzahl) ?? 0) + 1;
        belegt.set(s.kennzahl, lfd);
        fz.funkrufname = {
          kennwort: traeger.kennwort,
          // Brandenburg führt die Bereichs-/Kreisbezeichnung, nicht die Gemeinde —
          // die steckt in der ersten Teilkennzahl.
          eigenerStandort: false,
          ort: ort.bereich,
          teile: [ort.gemeindeschluessel, s.kennzahl, lfd],
        };
      }
      fahrzeuge.push(fz);
    }
  }
  return fahrzeuge;
}

interface BeispielBogen {
  datei: string;
  bogen: Erfassungsbogen;
  ort: BbOrt;
  fachdienst: string;
  kuerzel: string;
}

function bogenBauen(spec: BogenSpec): BeispielBogen {
  const ort = BB_ORTE[spec.ortSchluessel]!;
  const personal = personalBauen(spec.personal);
  const fahrzeuge = fahrzeugeBauen(spec.fahrzeuge, ort, spec.traeger);

  const hierarchie: HierarchieEbene[] = [
    { bezeichnung: { freitext: `Fachdienst ${spec.fachdienst}` }, name: kreisKurz(ort) },
    ...spec.traeger.ebene(ort),
  ];

  const stand = datumAusIso("2026-07-16") + ganz(0, 2);
  const dauer = ganz(1, 4);
  const diesel = fahrzeuge.reduce((s, fz) => s + dieselFuer(fz.typ.freitext ?? ""), 0);

  const bogen: Erfassungsbogen = {
    schemaVersion: SCHEMA_VERSION,
    stand,
    einheit: {
      organisation: spec.traeger.org,
      organisationName: spec.traeger.organisationName(ort),
      einheitsTyp: { freitext: `${spec.einheit} (${spec.kuerzel})` },
      name: ort.ort,
      hierarchie,
    },
    einsatz: {
      zeitraumVon: stand,
      zeitraumBis: stand + dauer,
      ortAuftrag: spec.szenario.replaceAll("{ort}", ort.ort),
    },
    personalErfassung: PersonalErfassung.VOLLSTAENDIG,
    personal,
    fahrzeuge,
    sofortbedarf: {
      verpflegungPersonen: personal.length,
      dieselLiter: diesel,
      benzinLiter: 0,
      gemischLiter: spec.gemisch ? ganz(1, 2) * 5 : 0,
      unterbringung: dauer >= 2 && wuerfel(0.6),
      ruhezeitErforderlich: wuerfel(0.3),
    },
    sonstiges:
      `Mindeststärke ${spec.soll[0]}/${spec.soll[1]}/${spec.soll[2]}/${spec.soll[3]} und `
      + `${spec.sollKfz} Einsatz-Kfz nach ${QUELLE} (KatSV Brandenburg). `
      + "Die Verordnung regelt keine Fahrzeugtypen — die hier gezeigten Typen sind "
      + "beispielhaft nach dem Katalog „Funkkennziffern Feuerwehr & Rettungsdienst "
      + "im Land Brandenburg\" belegt; verbindlich sind die Ausführungsvorschriften "
      + "nach § 8 KatSV.",
  };

  return {
    datei: `${slug(spec.kuerzel)}-${slug(spec.einheit)}-${slug(ort.ort)}`,
    bogen,
    ort,
    fachdienst: spec.fachdienst,
    kuerzel: spec.kuerzel,
  };
}

// ------------------------------------------------------------- QR-Erzeugung

const QR_OPTIONEN = { errorCorrectionLevel: "M" as const };

function qrVersion(url: string): number {
  try {
    return QRCode.create(url, QR_OPTIONEN).version;
  } catch {
    return Infinity;
  }
}

async function teilBild(url: string, teilNr: number, anzahl: number): Promise<QrTeil> {
  const png = await QRCode.toBuffer(url, { ...QR_OPTIONEN, type: "png", width: 520 });
  return {
    datenUrl: `data:image/png;base64,${png.toString("base64")}`,
    url,
    teilNr,
    anzahl,
    version: qrVersion(url),
  };
}

async function qrSatz(b: Erfassungsbogen): Promise<QrSatz> {
  const payload = encodePayload(b, nodeKompressor);
  const url = EEB_URL_PREFIX + base64UrlKodieren(payload);
  if (qrVersion(url) <= QR_EINZEL_MAX_VERSION) {
    const teil = await teilBild(url, 1, 1);
    return { teile: [teil], segmentiert: false, zeichen: url.length, version: teil.version };
  }
  const maxTeile = Math.min(20, payload.length);
  let urls = segmentPayloadUrls(payload, 2);
  for (let anzahl = 2; anzahl <= maxTeile; anzahl++) {
    urls = segmentPayloadUrls(payload, anzahl);
    if (urls.every((u) => qrVersion(u) <= QR_SEGMENT_ZIEL_VERSION)) break;
  }
  const teile = await Promise.all(urls.map((u, i) => teilBild(u, i + 1, urls.length)));
  return {
    teile,
    segmentiert: true,
    zeichen: url.length,
    version: Math.max(...teile.map((t) => t.version)),
  };
}

function roundtrip(satz: QrSatz, erwartetGesamt: number, datei: string): void {
  let payload: Uint8Array;
  if (!satz.segmentiert) {
    const url = satz.teile[0]!.url;
    payload = base64UrlDekodieren(url.slice(url.indexOf("#") + 1));
  } else {
    const teile = satz.teile.map((t) => parseSegmentUrl(t.url)).sort((a, b) => a.teilNr - b.teilNr);
    const gesamt = teile.reduce((s, t) => s + t.chunk.length, 0);
    payload = new Uint8Array(gesamt);
    let offset = 0;
    for (const t of teile) {
      payload.set(t.chunk, offset);
      offset += t.chunk.length;
    }
  }
  const dekodiert = decodePayload(payload, nodeKompressor);
  const s = staerke(dekodiert);
  if (s.gesamt !== erwartetGesamt) {
    throw new Error(`${datei}: QR-Roundtrip-Stärke ${s.gesamt} ≠ ${erwartetGesamt}`);
  }
}

// ------------------------------------------------------------ Selbstprüfung

/**
 * Selbstprüfung gegen die Anlage zu § 4 Absatz 1: personelle Mindeststärke und
 * Mindestzahl der Einsatz-Kfz (Anhänger zählen nicht mit). Zusätzlich trägt
 * jedes Einsatz-Kfz einen vollständigen Funkrufnamen aus drei Teilkennzahlen,
 * jeder Anhänger keinen.
 */
function pruefen(beispiele: BeispielBogen[]): void {
  const fehler: string[] = [];
  beispiele.forEach((b, i) => {
    const spec = SPECS[i]!;
    const s = staerke(b.bogen);
    const [f, u, m, g] = spec.soll;
    if (s.fuehrer !== f || s.unterfuehrer !== u || s.mannschaft !== m || s.gesamt !== g) {
      fehler.push(
        `${b.datei}: Stärke ${s.fuehrer}/${s.unterfuehrer}/${s.mannschaft}/${s.gesamt} ≠ Anlage ${f}/${u}/${m}/${g}`,
      );
    }
    // Anhänger sind genau die Fahrzeuge mit ohneKennzeichen — im Bogen daran
    // erkennbar, dass ihr Kennzeichen nicht dem Kfz-Muster "<KFZ>-<Nr>" folgt.
    const anhaengerKz = new Set(
      spec.fahrzeuge.filter((x) => x.ohneKennzeichen).map((x) => x.ohneKennzeichen!),
    );
    const kfz = b.bogen.fahrzeuge.filter((fz) => !anhaengerKz.has(fz.kennzeichenFreitext ?? ""));
    if (kfz.length !== spec.sollKfz) {
      fehler.push(`${b.datei}: ${kfz.length} Einsatz-Kfz ≠ Anlage ${spec.sollKfz}`);
    }
    for (const fz of b.bogen.fahrzeuge) {
      const kurz = fz.typ.freitext ?? "?";
      const anhaenger = anhaengerKz.has(fz.kennzeichenFreitext ?? "");
      if (anhaenger && fz.funkrufname) {
        fehler.push(`${b.datei}: Anhänger ${kurz} sollte keinen Funkrufnamen führen`);
      }
      if (!anhaenger && fz.funkrufname?.teile.length !== 3) {
        fehler.push(`${b.datei}: ${kurz} ohne vollständigen Funkrufnamen (drei Teilkennzahlen)`);
      }
      if (!anhaenger && fz.funkrufname?.ort !== b.ort.bereich) {
        fehler.push(`${b.datei}: ${kurz} führt nicht die Bereichsbezeichnung „${b.ort.bereich}"`);
      }
    }
  });
  if (fehler.length > 0) {
    throw new Error(`Selbstprüfung fehlgeschlagen:\n  ${fehler.join("\n  ")}`);
  }
}

// ---------------------------------------------------------------- Hauptlauf

// Serverseitige pdfmake-Fonts: Roboto liegt im Paket, Helvetica (≙ Arial) ist
// eine der 14 PDF-Standardschriften und in pdfkit ohne Datei über den Namen
// verfügbar (siehe SCHRIFT in src/app/pdf-dokument.ts).
const robotoDir = join(wurzel, "node_modules/pdfmake/fonts/Roboto");
pdfmake.setFonts({
  Roboto: {
    normal: join(robotoDir, "Roboto-Regular.ttf"),
    bold: join(robotoDir, "Roboto-Medium.ttf"),
    italics: join(robotoDir, "Roboto-Italic.ttf"),
    bolditalics: join(robotoDir, "Roboto-MediumItalic.ttf"),
  },
  Helvetica: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique",
  },
});
pdfmake.setUrlAccessPolicy((url: string) => url.startsWith("data:"));
pdfmake.setLocalAccessPolicy((pfad: string) => pfad.startsWith(robotoDir) || pfad.startsWith("Helvetica"));

const beispiele: BeispielBogen[] = SPECS.map(bogenBauen);

pruefen(beispiele);

const ausgabe = join(wurzel, "examples", "katastrophenschutz", "brandenburg");
mkdirSync(ausgabe, { recursive: true });
for (const datei of readdirSync(ausgabe)) {
  if (datei.endsWith(".pdf")) rmSync(join(ausgabe, datei));
}

for (const bsp of beispiele) {
  const qr = await qrSatz(bsp.bogen);
  roundtrip(qr, bsp.bogen.personal.length, bsp.datei);
  await pdfmake.createPdf(pdfDokument(bsp.bogen, qr)).write(join(ausgabe, `${bsp.datei}.pdf`));
}

const zeilen = beispiele.map((b, i) => {
  const s = staerke(b.bogen);
  const spec = SPECS[i]!;
  return `| ${b.datei} | ${b.fachdienst} | ${b.kuerzel} | ${b.ort.ort} | ${b.ort.kreis} | ${s.fuehrer}/${s.unterfuehrer}/${s.mannschaft}/${s.gesamt} | ${spec.sollKfz} | ${b.bogen.fahrzeuge.length} |`;
});
writeFileSync(
  join(ausgabe, "README.md"),
  `# Beispiel-Erfassungsbögen — Katastrophenschutz Brandenburg

${beispiele.length} generierte Beispiel-Einheiten nach der Brandenburgischen
**Katastrophenschutzverordnung** (KatSV vom 17. Oktober 2012, zuletzt geändert
durch Verordnung vom 16. Dezember 2021) und ihrer **Anlage zu § 4 Absatz 1**
„Übersicht zur Mindestausstattung von Fachdiensten und Einheiten der unteren
Katastrophenschutzbehörden".

Alle Personen, Standort-Zuordnungen, Gemeindeschlüssel und Kennzeichen sind
**fiktiv**.

## Warum ein Bogen je Einheit — und nicht je Teileinheit

Anders als die SächsKatSVO und die KatS-StAN Niedersachsen regelt die
Brandenburger Anlage je Einheit nur

* die **personelle Mindeststärke** (Führer / Unterführer / Helfer / Gesamt) und
* eine **Mindestzahl an Einsatz-Kfz** (Einsatzfahrzeuge mit verlasteter Ausrüstung).

Sie nennt **weder Fahrzeugtypen noch eine Untergliederung in Teileinheiten**.
Deshalb gibt es hier acht Bögen — einen je Einheit der Anlage — statt einer
Zerlegung in Trupps, Staffeln und Gruppen wie bei Sachsen und Niedersachsen.
Eine solche Gliederung wäre frei erfunden.

Aus demselben Grund gilt für die Fahrzeuge:

> **Stärke und Anzahl der Einsatz-Kfz sind verordnungsgenau** und werden beim
> Generieren gegen die Anlage geprüft. Die **Fahrzeugtypen dagegen sind nicht
> verordnungsgeregelt** — sie sind hier beispielhaft aus dem Katalog
> „Funkkennziffern Feuerwehr & Rettungsdienst im Land Brandenburg" belegt, damit
> die Bögen vollständige und im Land stimmige Funkrufnamen zeigen. Verbindlich
> ist stattdessen die Technikausstattung nach den Ausführungsvorschriften gemäß
> § 8 KatSV, die nicht Teil der Verordnung ist.

Derselbe Hinweis steht im Feld „Sonstiges" jedes einzelnen Bogens.

## Funkrufnamen

Nach dem Katalog „Funkkennziffern Feuerwehr & Rettungsdienst im Land
Brandenburg":

> \`<Kennwort> <Bereich> <Amt/Gemeinde/Stadt>/<Funkkennziffer>/<Ordnungsnummer>\`
>
> Beispiel des Katalogs: \`Florian Fläming 10 / 41 / 03\`

* **Ortsbezeichnung** ist — anders als in Sachsen — die **Bereichs-/Kreis-
  bezeichnung**, nicht die Gemeinde; die Gemeinde steckt in der **ersten
  Teilkennzahl** (Amt, Gemeinde, Stadt). Die Vergabe dieser Schlüssel liegt bei
  der unteren Katastrophenschutzbehörde, die Werte hier sind fiktiv.
* **Zweite Teilkennzahl** = Funkkennziffer des Fahrzeugtyps aus dem Katalog
  (z. B. 11 ELW 1, 12 ELW 2, 19 MTW, 24 TLF 24/50, 33 DL(K) 23/12, 44 LF 16/20,
  45 LF 16-TS, 54 GW-G, 57 GW-Mess, 58 GW-W, 59 sonstiger GW, 63 SW 2000-Tr,
  65 WLF, 74 LKW, 75 GW-Licht, 79 MZB, 82 NEF, 83 RTW, 85 KTW, 87 GKTW,
  88 RTB, 89 sonstiges Rettungsfahrzeug).
* **Dritte Teilkennzahl** = Ordnungsnummer, laufend je Funkkennziffer.
* **Kennwort** je Trägerorganisation — Feuerwehr „Florian", DRK „Rotkreuz",
  JUH „Akkon", ASB „Sama", DLRG „Pelikan". Der Katalog selbst deckt Feuerwehr
  und Rettungsdienst ab; die Hilfsorganisationen führen dieselben Kennziffern
  unter ihrem eigenen Kennwort.
* **Anhänger** (Feldkochherd, Netzersatzanlage) führen keinen Funkrufnamen und
  zählen nicht als Einsatz-Kfz.

## Träger

Die Einheiten werden von den öffentlichen Feuerwehren und den mitwirkenden
Hilfsorganisationen nach § 18 Absatz 1 BbgBKG getragen; die Aufgabenträger
können sie auch selbst als **Regieeinheiten** betreiben (§ 3 Absatz 1 KatSV).
Die Zuordnung hier ist beispielhaft gewählt und über die unteren
Katastrophenschutzbehörden gestreut. Nach § 3 Absatz 2 KatSV können die Behörden
insbesondere in den Fachdiensten Versorgung und Bergung/Instandsetzung mit dem
**THW** zusammenwirken — abgebildet ist die SEE-VE hier als Regieeinheit der
unteren Katastrophenschutzbehörde.

Neu erzeugen mit: \`npm run beispiele:kats-bb\` (deterministisch, fester Zufalls-Seed).

| Datei | Fachdienst | Einheit | Ort | Untere KatS-Behörde | Stärke | Kfz (Anlage) | Fahrzeuge im Bogen |
|---|---|---|---|---|---|---|---|
${zeilen.join("\n")}

Die Spalte **Kfz (Anlage)** ist die Mindestzahl der Verordnung, **Fahrzeuge im
Bogen** zählt zusätzlich die mitgeführten Anhänger.
`,
);

console.log(`${beispiele.length} Bögen nach ${ausgabe} geschrieben.`);
