/**
 * Erzeugt Beispiel-Erfassungsbögen der Katastrophenschutzeinheiten des
 * Freistaates Thüringen als JSON nach examples/katastrophenschutz/thueringen/.
 * Abgelegt ist nur das Bogen-JSON; die PDF entsteht erst beim Anklicken in der
 * App aus dem aktuellen Layout.
 *
 * Aufruf (Node ≥ 22): npm run beispiele:kats-th
 *
 * Grundlage ist die Thüringer Katastrophenschutzverordnung (ThürKatSVO vom
 * 10. November 2020) mit den Anlagen 1 bis 17, wie sie die Broschüre
 * „ThürKatSVO in Schaubildern" (TMIK, Ausgabe 1/2021) je Einheit als
 * Gliederungsbild wiedergibt. Wie bei Sachsen und Niedersachsen wird je
 * kleinster selbstständiger Teileinheit ein Bogen abgebildet; die Züge sind in
 * ihre Teileinheiten zerlegt.
 *
 * Die Schaubilder geben Stärke UND Fahrzeug je Teileinheit an ("0/1/8/9" +
 * „Löschgruppenfahrzeug Katastrophenschutz"). Anders als in Brandenburg sind
 * die Fahrzeugtypen hier also verordnungsseitig belegt und nicht geraten.
 *
 * Zwei Modellierungsentscheidungen, beide im README dokumentiert:
 *  - Der Einheitsführer steht in den Schaubildern als eigener Kasten OHNE
 *    Fahrzeug. Er wird der Führungseinheit (bzw. der ersten Teileinheit)
 *    zugeschlagen, statt einen fahrzeuglosen Ein-Personen-Bogen zu erzeugen.
 *  - Mehrfach identische Teileinheiten (vier Transporttrupps im Sanitätszug,
 *    drei Wasserrettungsstaffeln, zwei Führungsstaffeln des Landes-Führungs-
 *    stabes) ergeben EINEN Bogen; die Spalte „je Einheit" der README nennt die
 *    Zahl im Verband.
 *
 * Die Funkrufnamen folgen der Funkrufnamenregelung Thüringen (Anlage 10 der
 * funktechnischen und funkbetrieblichen Richtlinien, Version 1.0 vom
 * 3. Juli 2017, auf Basis der OPTA-Richtlinie der BDBOS):
 *   „<Kennwort> <Einsatzbereich> <Wache> <Fahrzeugkennzahl> <laufende Nummer>"
 * (Beispiel der Richtlinie: „Florian Weimar 1 44 1"). Einsatzbereich ist der
 * Landkreis bzw. die kreisfreie Stadt, die Wache eine Zahl darunter — im Modell
 * also eigenerStandort = false mit ort = Einsatzbereich und
 * teile = [Wache, Fahrzeugkennzahl, laufende Nummer].
 *
 * Kennwort ist nach Nr. 2.1 für den Katastrophenschutz „Kater"; von den
 * Hilfsorganisationen getragene Einheiten führen deren Kennwort (Rotkreuz,
 * Sama, Akkon, Johannes, Pelikan, Bergwacht, Wasserwacht). Die Fußnote der
 * Richtlinie stellt klar, dass KatS-Fahrzeuge nur bei Einsätzen des örtlichen
 * Brandschutzes und der Allgemeinen Hilfe „Florian" führen — hier geht es um
 * Katastrophenschutzeinsätze, deshalb „Kater".
 *
 * Fiktiv sind alle Personen, Standort-Zuordnungen, Wachennummern und
 * Kennzeichen.
 *
 * Am Ende läuft eine Selbstprüfung (Stärke je Teileinheit gegen das Schaubild,
 * Summe der Teileinheiten gegen die Mannschaftsstärke des Verbandes,
 * vollständiger Funkrufname je motorisiertem Fahrzeug, QR-Roundtrip); die
 * README im Zielordner bekommt eine Übersichtstabelle.
 */

import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
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
const rnd = prng(20201110); // Datum der ThürKatSVO
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
  "Andreas", "Bernd", "Christian", "Clemens", "Daniel", "Dennis", "Dirk", "Enrico",
  "Falk", "Frank", "Georg", "Gunter", "Hagen", "Heiko", "Jan", "Jens",
  "Jörg", "Karsten", "Klaus", "Lars", "Lukas", "Marco", "Mario", "Markus",
  "Martin", "Matthias", "Michael", "Nico", "Norbert", "Olaf", "Patrick", "Paul",
  "Peter", "Philipp", "Ralf", "René", "Robert", "Ronny", "Sebastian", "Steffen",
  "Sven", "Thomas", "Tino", "Tobias", "Torsten", "Uwe", "Volkmar", "Wolfram",
] as const;
const VORNAMEN_W = [
  "Anja", "Anke", "Annett", "Antje", "Beate", "Carola", "Christin", "Claudia",
  "Cornelia", "Doreen", "Franziska", "Grit", "Heike", "Ines", "Jana", "Josephine",
  "Katrin", "Kerstin", "Kristin", "Lea", "Lisa", "Manuela", "Maria", "Marlen",
  "Nadine", "Nicole", "Peggy", "Ramona", "Sabine", "Sandra", "Sarah", "Silke",
  "Simone", "Steffi", "Susann", "Ulrike", "Yvonne",
] as const;
const NACHNAMEN = [
  "Anschütz", "Bachmann", "Bauer", "Becker", "Bergmann", "Beyer", "Brand", "Büchner",
  "Dietzel", "Döring", "Eckardt", "Eichhorn", "Fischer", "Franke", "Fritsche", "Gebhardt",
  "Geier", "Gräf", "Grimm", "Günther", "Haase", "Hädrich", "Hartmann", "Heinrich",
  "Hempel", "Henkel", "Herrmann", "Hofmann", "Hübner", "Jäger", "Kaiser", "Keller",
  "Kirchner", "Klein", "Köhler", "König", "Krause", "Kühn", "Lange", "Lehmann",
  "Liebold", "Löffler", "Ludwig", "Mämpel", "Meißner", "Möller", "Müller", "Naumann",
  "Nickel", "Otto", "Pfeifer", "Reinhardt", "Richter", "Riedel", "Röder", "Rudolph",
  "Sauer", "Schilling", "Schmidt", "Schneider", "Scholz", "Schröter", "Schulz", "Schwarz",
  "Seidel", "Sommer", "Stein", "Thiele", "Tröbs", "Ullrich", "Vogel", "Voigt",
  "Wagner", "Walther", "Weber", "Weiß", "Werner", "Winkler", "Wittig", "Wolf",
  "Zimmermann",
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

// --------------------------------------------------------- Thüringen: Orte

interface ThOrt {
  /** Sitz der Einheit. */
  ort: string;
  /** Landkreis bzw. kreisfreie Stadt = untere Katastrophenschutzbehörde. */
  kreis: string;
  kfz: string;
  /** Wachen-Bezeichnung nach Nr. 2.2 der Funkrufnamenregelung (fiktiv). */
  wache: number;
}

/** Standorte quer durch die 17 Landkreise und 6 kreisfreien Städte. */
const TH_ORTE: ThOrt[] = [
  { ort: "Erfurt", kreis: "Stadt Erfurt", kfz: "EF", wache: 1 },
  { ort: "Gera", kreis: "Stadt Gera", kfz: "G", wache: 1 },
  { ort: "Jena", kreis: "Stadt Jena", kfz: "J", wache: 1 },
  { ort: "Suhl", kreis: "Stadt Suhl", kfz: "SHL", wache: 1 },
  { ort: "Weimar", kreis: "Stadt Weimar", kfz: "WE", wache: 1 },
  { ort: "Eisenach", kreis: "Stadt Eisenach", kfz: "EA", wache: 1 },
  { ort: "Altenburg", kreis: "Landkreis Altenburger Land", kfz: "ABG", wache: 1 },
  { ort: "Schmölln", kreis: "Landkreis Altenburger Land", kfz: "ABG", wache: 2 },
  { ort: "Heilbad Heiligenstadt", kreis: "Landkreis Eichsfeld", kfz: "EIC", wache: 1 },
  { ort: "Leinefelde-Worbis", kreis: "Landkreis Eichsfeld", kfz: "EIC", wache: 2 },
  { ort: "Gotha", kreis: "Landkreis Gotha", kfz: "GTH", wache: 1 },
  { ort: "Waltershausen", kreis: "Landkreis Gotha", kfz: "GTH", wache: 2 },
  { ort: "Greiz", kreis: "Landkreis Greiz", kfz: "GRZ", wache: 1 },
  { ort: "Zeulenroda-Triebes", kreis: "Landkreis Greiz", kfz: "GRZ", wache: 2 },
  { ort: "Hildburghausen", kreis: "Landkreis Hildburghausen", kfz: "HBN", wache: 1 },
  { ort: "Arnstadt", kreis: "Ilm-Kreis", kfz: "IK", wache: 1 },
  { ort: "Ilmenau", kreis: "Ilm-Kreis", kfz: "IK", wache: 2 },
  { ort: "Sondershausen", kreis: "Kyffhäuserkreis", kfz: "KYF", wache: 1 },
  { ort: "Artern", kreis: "Kyffhäuserkreis", kfz: "KYF", wache: 2 },
  { ort: "Nordhausen", kreis: "Landkreis Nordhausen", kfz: "NDH", wache: 1 },
  { ort: "Eisenberg", kreis: "Saale-Holzland-Kreis", kfz: "SHK", wache: 1 },
  { ort: "Hermsdorf", kreis: "Saale-Holzland-Kreis", kfz: "SHK", wache: 2 },
  { ort: "Schleiz", kreis: "Saale-Orla-Kreis", kfz: "SOK", wache: 1 },
  { ort: "Pößneck", kreis: "Saale-Orla-Kreis", kfz: "SOK", wache: 2 },
  { ort: "Saalfeld", kreis: "Landkreis Saalfeld-Rudolstadt", kfz: "SLF", wache: 1 },
  { ort: "Rudolstadt", kreis: "Landkreis Saalfeld-Rudolstadt", kfz: "SLF", wache: 2 },
  { ort: "Meiningen", kreis: "Landkreis Schmalkalden-Meiningen", kfz: "SM", wache: 1 },
  { ort: "Schmalkalden", kreis: "Landkreis Schmalkalden-Meiningen", kfz: "SM", wache: 2 },
  { ort: "Sömmerda", kreis: "Landkreis Sömmerda", kfz: "SÖM", wache: 1 },
  { ort: "Sonneberg", kreis: "Landkreis Sonneberg", kfz: "SON", wache: 1 },
  { ort: "Mühlhausen", kreis: "Unstrut-Hainich-Kreis", kfz: "UH", wache: 1 },
  { ort: "Bad Langensalza", kreis: "Unstrut-Hainich-Kreis", kfz: "UH", wache: 2 },
  { ort: "Bad Salzungen", kreis: "Wartburgkreis", kfz: "WAK", wache: 1 },
  { ort: "Ruhla", kreis: "Wartburgkreis", kfz: "WAK", wache: 2 },
  { ort: "Apolda", kreis: "Landkreis Weimarer Land", kfz: "AP", wache: 1 },
];

/** Die Landesfeuerwehr- und Katastrophenschutzschule führt „Thüringen Schule" (Nr. 2.2). */
const TLFKS: ThOrt = {
  ort: "Bad Köstritz",
  kreis: "Landesfeuerwehr- und Katastrophenschutzschule Thüringen",
  kfz: "G",
  wache: 1,
};

const kreisKurz = (o: ThOrt): string =>
  o.kreis.replace(/^(Landkreis|Stadt|Landeshauptstadt)\s+/, "");

/** Einsatzbereich im Funkrufnamen (Nr. 2.2): Landkreis bzw. kreisfreie Stadt. */
const einsatzbereich = (o: ThOrt): string =>
  o === TLFKS ? "Thüringen Schule" : kreisKurz(o);

// ------------------------------------------------------------------ Träger

interface Traeger {
  org: OrganisationsTyp;
  /** Grundrufname nach Nr. 2.1 der Funkrufnamenregelung Thüringen. */
  kennwort: VokabularWert;
  organisationName: (o: ThOrt) => string;
  ebene: (o: ThOrt) => HierarchieEbene[];
}

/** FUNKRUF_KENNWOERTER-Codes (src/vokabulare/thw.ts). */
const KW = { ROTKREUZ: 3, AKKON: 4, JOHANNES: 5, SAMA: 6, PELIKAN: 7 } as const;

/**
 * Einheiten in Trägerschaft der unteren Katastrophenschutzbehörde bzw. der
 * Feuerwehren. Kennwort ist nach Nr. 2.1 „Kater" (Katastrophenschutz); es steht
 * nicht im Code-Vokabular und wird deshalb als Freitext geführt.
 */
const kats: Traeger = {
  org: OrganisationsTyp.FEUERWEHR,
  kennwort: { freitext: "Kater" },
  organisationName: (o) => `Katastrophenschutz ${o.kreis}`,
  ebene: (o) => [{ bezeichnung: { freitext: "Untere KatS-Behörde" }, name: o.kreis }],
};

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
const mhd = hiorg(OrganisationsTyp.MHD, { code: KW.JOHANNES }, "MHD", "Malteser Hilfsdienst");
const asb = hiorg(OrganisationsTyp.ASB, { code: KW.SAMA }, "ASB", "Arbeiter-Samariter-Bund");
const dlrg = hiorg(OrganisationsTyp.DLRG, { code: KW.PELIKAN }, "DLRG", "DLRG");

// Bergwacht und Wasserwacht führen nach Nr. 2.1 eigene Grundrufnamen; beide
// gehören organisatorisch zum DRK und stehen nicht im Code-Vokabular.
const bergwacht: Traeger = {
  org: OrganisationsTyp.DRK,
  kennwort: { freitext: "Bergwacht" },
  organisationName: (o) => `Bergwacht Thüringen (DRK) — ${o.kreis}`,
  ebene: (o) => [
    { bezeichnung: { freitext: "Bergwacht-Bereitschaft" }, name: o.ort },
    { bezeichnung: { freitext: "Untere KatS-Behörde" }, name: o.kreis },
  ],
};
const wasserwacht: Traeger = {
  org: OrganisationsTyp.DRK,
  kennwort: { freitext: "Wasserwacht" },
  organisationName: (o) => `Wasserwacht Thüringen (DRK) — ${o.kreis}`,
  ebene: (o) => [
    { bezeichnung: { freitext: "Wasserwacht-Ortsgruppe" }, name: o.ort },
    { bezeichnung: { freitext: "Untere KatS-Behörde" }, name: o.kreis },
  ],
};

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
  if (/^(TLF|SW|WLF|LKW|GW-Log)/.test(kurz)) return 120;
  if (/^(LF|GW|RW|CBRN|Dekon)/.test(kurz)) return 70;
  if (/^(ELW|KdoW|MZF|MTW|FüKW|NEF|RTW|KTW|GKTW|Rettungshund)/.test(kurz)) return 45;
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
  /** Klartext des Schaubildes für „Änderungen bzw. Sondergerät". */
  lang?: string;
  anzahl?: number;
  /** Anhänger und Boote statt Kfz-Kennzeichen. */
  ohneKennzeichen?: string;
  /** Fahrzeugkennzahl nach Nr. 2.3 der Funkrufnamenregelung; fehlt = kein Funkrufname. */
  kennzahl?: number;
}

interface BogenSpec {
  /** Verband nach ThürKatSVO (für README und Hierarchie). */
  verband: string;
  kuerzel: string;
  /** Anlage der ThürKatSVO. */
  anlage: number;
  /** Mannschaftsstärke des gesamten Verbandes laut Schaubild-Kopf. */
  verbandSoll: [number, number, number, number];
  einheit: string;
  traeger: Traeger;
  /** Wie oft diese Teileinheit im Verband vorkommt (für die Summenprüfung). */
  jeVerband?: number;
  personal: PlatzSpec[];
  fahrzeuge: FzSpec[];
  szenario: string; // {ort} wird ersetzt
  /** Sollstärke der Teileinheit laut Schaubild als "F/U/M/Gesamt" — wird geprüft. */
  soll: [number, number, number, number];
  /** true: der Einheitsführer-Kasten des Schaubildes ist hier eingerechnet. */
  mitEinheitsfuehrer?: boolean;
  gemisch?: boolean;
  /** Fester Standort statt Streuung (nur Landeseinheiten an der TLFKS). */
  ortFest?: ThOrt;
}

const F = R.FUEHRER;
const U = R.UNTERFUEHRER;
const M = R.MANNSCHAFT;

const SPECS: BogenSpec[] = [
  // ============================================ Anlage 1 — KatS-Führungsstaffel
  // Das Schaubild der Anlage 1 nennt für die Führungsstaffel als einzige Einheit
  // KEINE Fahrzeuge; die Bögen bilden das so ab.
  {
    verband: "Katastrophenschutz-Führungsstaffel", kuerzel: "KatS-FüSt", anlage: 1,
    verbandSoll: [4, 0, 3, 7],
    einheit: "Führungseinheit", traeger: kats, mitEinheitsfuehrer: true,
    personal: [
      { rolle: F, funktion: "Einheitsführer/-in" },
      { rolle: F, funktion: "Fachberater/-in" },
      { rolle: M, funktion: "Helfer/-in Lagedarstellung", anzahl: 2 },
    ],
    fahrzeuge: [],
    szenario: "Großschadenslage {ort} — Führung der Einsatzabschnitte",
    soll: [2, 0, 2, 4],
  },
  {
    verband: "Katastrophenschutz-Führungsstaffel", kuerzel: "KatS-FüSt", anlage: 1,
    verbandSoll: [4, 0, 3, 7],
    einheit: "Führungsunterstützungstrupp", traeger: kats,
    personal: [
      { rolle: F, funktion: "Führungsassistent/-in", anzahl: 2 },
      { rolle: M, funktion: "Fernmelder/-in", quali: "Sprechfunker" },
    ],
    fahrzeuge: [],
    szenario: "Großschadenslage {ort} — Führungsstelle und Fernmeldebetrieb",
    soll: [2, 0, 1, 3],
  },

  // ========================================= Anlage 2 — KatS-Einsatzzug Retten
  {
    verband: "Katastrophenschutz-Einsatzzug Retten", kuerzel: "KatS-EZ Retten", anlage: 2,
    verbandSoll: [1, 4, 22, 27],
    einheit: "Führungseinheit Einsatzzug Retten", traeger: kats, mitEinheitsfuehrer: true,
    personal: [
      { rolle: F, funktion: "Einheitsführer/-in" },
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Melder/-in", anzahl: 2, quali: "Sprechfunker" },
    ],
    fahrzeuge: [{ kurz: "ELW 1", kennzahl: 11, lang: "Einsatzleitwagen 1" }],
    szenario: "Gebäudeeinsturz {ort} — Führung Einsatzzug Retten",
    soll: [1, 1, 2, 4],
  },
  {
    verband: "Katastrophenschutz-Einsatzzug Retten", kuerzel: "KatS-EZ Retten", anlage: 2,
    verbandSoll: [1, 4, 22, 27],
    einheit: "Gruppe Einsatzzug Retten", traeger: kats, jeVerband: 2,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Truppmann/Truppfrau", anzahl: 8, quali: "Atemschutzgeräteträger" },
    ],
    fahrzeuge: [{ kurz: "LF 20 KatS", kennzahl: 45, lang: "Löschgruppenfahrzeug Katastrophenschutz" }],
    szenario: "Gebäudeeinsturz {ort} — Menschenrettung und Brandbekämpfung",
    soll: [0, 1, 8, 9],
  },
  {
    verband: "Katastrophenschutz-Einsatzzug Retten", kuerzel: "KatS-EZ Retten", anlage: 2,
    verbandSoll: [1, 4, 22, 27],
    einheit: "Staffel Einsatzzug Retten", traeger: kats,
    personal: [
      { rolle: U, funktion: "Staffelführer/-in" },
      { rolle: M, funktion: "Truppmann/Truppfrau", anzahl: 4 },
    ],
    fahrzeuge: [
      { kurz: "RW", kennzahl: 72, lang: "Rüstwagen" },
      { kurz: "MTW", kennzahl: 19, lang: "Mannschaftstransportwagen" },
    ],
    szenario: "Gebäudeeinsturz {ort} — technische Rettung, schweres Gerät",
    soll: [0, 1, 4, 5],
    gemisch: true,
  },

  // ============================================== Anlage 3 — KatS-Sanitätszug
  {
    verband: "Katastrophenschutz-Sanitätszug", kuerzel: "KatS-SanZ", anlage: 3,
    verbandSoll: [4, 6, 13, 23],
    einheit: "Führungseinheit Sanitätszug", traeger: drk, mitEinheitsfuehrer: true,
    personal: [
      { rolle: F, funktion: "Einheitsführer/-in" },
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Melder/-in", anzahl: 2, quali: "Sprechfunker" },
    ],
    fahrzeuge: [{ kurz: "ELW 1", kennzahl: 11, lang: "Einsatzleitwagen 1" }],
    szenario: "MANV {ort} — Führung Sanitätszug",
    soll: [1, 1, 2, 4],
  },
  {
    verband: "Katastrophenschutz-Sanitätszug", kuerzel: "KatS-SanZ", anlage: 3,
    verbandSoll: [4, 6, 13, 23],
    einheit: "Sanitätsgruppe", traeger: drk,
    personal: [
      { rolle: F, funktion: "Ärztin/Arzt", anzahl: 3, quali: "Notarzt" },
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Notfallsanitäter/-in", anzahl: 2, quali: "Notfallsanitäter" },
      { rolle: M, funktion: "Sanitätshelfer/-in", anzahl: 5 },
    ],
    fahrzeuge: [
      { kurz: "GW-San", kennzahl: 95, lang: "Gerätewagen Sanität" },
      { kurz: "MTW", kennzahl: 19, lang: "Mannschaftstransportwagen" },
    ],
    szenario: "MANV {ort} — strukturierte Patientenablage und Erstversorgung",
    soll: [3, 1, 7, 11],
  },
  {
    verband: "Katastrophenschutz-Sanitätszug", kuerzel: "KatS-SanZ", anlage: 3,
    verbandSoll: [4, 6, 13, 23],
    einheit: "Transporttrupp Sanitätszug", traeger: drk, jeVerband: 4,
    personal: [
      { rolle: U, funktion: "Truppführer/-in", quali: "Rettungssanitäter" },
      { rolle: M, funktion: "Rettungshelfer/-in" },
    ],
    fahrzeuge: [{ kurz: "KTW", kennzahl: 85, lang: "Krankentransportwagen" }],
    szenario: "MANV {ort} — Patiententransport in Zielkliniken",
    soll: [0, 1, 1, 2],
  },

  // ============================================= Anlage 4 — KatS-Betreuungszug
  {
    verband: "Katastrophenschutz-Betreuungszug", kuerzel: "KatS-BetrZ", anlage: 4,
    verbandSoll: [1, 5, 22, 28],
    einheit: "Führungseinheit Betreuungszug", traeger: asb, mitEinheitsfuehrer: true,
    personal: [
      { rolle: F, funktion: "Einheitsführer/-in" },
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Melder/-in", anzahl: 2, quali: "Sprechfunker" },
    ],
    fahrzeuge: [{ kurz: "ELW 1", kennzahl: 11, lang: "Einsatzleitwagen 1" }],
    szenario: "Evakuierung {ort} — Führung Betreuungszug",
    soll: [1, 1, 2, 4],
  },
  {
    verband: "Katastrophenschutz-Betreuungszug", kuerzel: "KatS-BetrZ", anlage: 4,
    verbandSoll: [1, 5, 22, 28],
    einheit: "Betreuungsgruppe", traeger: asb,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Betreuungshelfer/-in", anzahl: 9 },
    ],
    fahrzeuge: [
      { kurz: "GW-Bt", kennzahl: 98, lang: "Gerätewagen Betreuung" },
      { kurz: "MTW", kennzahl: 19, lang: "Mannschaftstransportwagen" },
    ],
    szenario: "Evakuierung {ort} — Betreuung Betroffener in der Notunterkunft",
    soll: [0, 1, 9, 10],
  },
  {
    verband: "Katastrophenschutz-Betreuungszug", kuerzel: "KatS-BetrZ", anlage: 4,
    verbandSoll: [1, 5, 22, 28],
    einheit: "Verpflegungsstaffel", traeger: juh,
    personal: [
      { rolle: U, funktion: "Staffelführer/-in" },
      { rolle: M, funktion: "Helfer/-in Verpflegung", anzahl: 5, quali: "Koch (Beruf)" },
    ],
    fahrzeuge: [
      { kurz: "GW-V", kennzahl: 99, lang: "Gerätewagen Verpflegung" },
      { kurz: "FKH", lang: "Anhänger Feldkochherd", ohneKennzeichen: "Anh FKH" },
    ],
    szenario: "Evakuierung {ort} — Verpflegung Betroffener und Einsatzkräfte",
    soll: [0, 1, 5, 6],
  },
  {
    verband: "Katastrophenschutz-Betreuungszug", kuerzel: "KatS-BetrZ", anlage: 4,
    verbandSoll: [1, 5, 22, 28],
    einheit: "Unterkunftsstaffel", traeger: mhd,
    personal: [
      { rolle: U, funktion: "Staffelführer/-in" },
      { rolle: M, funktion: "Betreuungshelfer/-in", anzahl: 5 },
    ],
    fahrzeuge: [{ kurz: "MTW", kennzahl: 19, lang: "Mannschaftstransportwagen" }],
    szenario: "Evakuierung {ort} — Aufbau temporärer Unterkünfte",
    soll: [0, 1, 5, 6],
  },
  {
    verband: "Katastrophenschutz-Betreuungszug", kuerzel: "KatS-BetrZ", anlage: 4,
    verbandSoll: [1, 5, 22, 28],
    einheit: "Betreuungstrupp Psychosoziale Notfallversorgung", traeger: mhd,
    personal: [
      { rolle: U, funktion: "Truppführer/-in PSNV", quali: "PSNV-Fachkraft" },
      { rolle: M, funktion: "Helfer/-in PSNV", quali: "PSNV-Fachkraft" },
    ],
    fahrzeuge: [{ kurz: "MTW", kennzahl: 19, lang: "Mannschaftstransportwagen" }],
    szenario: "Evakuierung {ort} — psychosoziale Notfallversorgung Betroffener",
    soll: [0, 1, 1, 2],
  },

  // ============================================== Anlage 5 — KatS-Gefahrgutzug
  {
    verband: "Katastrophenschutz-Gefahrgutzug", kuerzel: "KatS-GGZ", anlage: 5,
    verbandSoll: [1, 5, 24, 30],
    einheit: "Führungseinheit Gefahrgutzug", traeger: kats, mitEinheitsfuehrer: true,
    personal: [
      { rolle: F, funktion: "Einheitsführer/-in" },
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Melder/-in", anzahl: 2, quali: "Sprechfunker" },
    ],
    fahrzeuge: [{ kurz: "ELW 1", kennzahl: 11, lang: "Einsatzleitwagen 1" }],
    szenario: "Gefahrgutunfall {ort} — Führung Gefahrgutzug",
    soll: [1, 1, 2, 4],
  },
  {
    verband: "Katastrophenschutz-Gefahrgutzug", kuerzel: "KatS-GGZ", anlage: 5,
    verbandSoll: [1, 5, 24, 30],
    einheit: "Erkundungsgruppe Gefahrgutzug", traeger: kats,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Truppmann/Truppfrau", anzahl: 7, quali: "ABC-Erkundung" },
    ],
    fahrzeuge: [
      { kurz: "GW-Mess", kennzahl: 57, lang: "Gerätewagen Messtechnik" },
      { kurz: "CBRN-ErkKW", kennzahl: 58, lang: "CBRN-Erkundungswagen" },
    ],
    szenario: "Gefahrgutunfall {ort} — Erkunden, Messen und Spüren",
    soll: [0, 1, 7, 8],
  },
  {
    verband: "Katastrophenschutz-Gefahrgutzug", kuerzel: "KatS-GGZ", anlage: 5,
    verbandSoll: [1, 5, 24, 30],
    einheit: "Gefahrenabwehrstaffel", traeger: kats,
    personal: [
      { rolle: U, funktion: "Staffelführer/-in" },
      { rolle: M, funktion: "Truppmann/Truppfrau", anzahl: 5, quali: "Atemschutzgeräteträger" },
    ],
    fahrzeuge: [
      { kurz: "GW-G", kennzahl: 54, lang: "Gerätewagen Gefahrgut" },
      { kurz: "GW-A/S", kennzahl: 56, lang: "Gerätewagen Atemschutz/Strahlenschutz" },
    ],
    szenario: "Gefahrgutunfall {ort} — Abdichten, Umfüllen, Gefahrenabwehr",
    soll: [0, 1, 5, 6],
  },
  {
    verband: "Katastrophenschutz-Gefahrgutzug", kuerzel: "KatS-GGZ", anlage: 5,
    verbandSoll: [1, 5, 24, 30],
    einheit: "Dekontaminationsstaffel Einsatzkräfte", traeger: kats,
    personal: [
      { rolle: U, funktion: "Staffelführer/-in" },
      { rolle: M, funktion: "Helfer/-in Dekontamination", anzahl: 5 },
    ],
    fahrzeuge: [{ kurz: "GW-Dekon", kennzahl: 53, lang: "Gerätewagen Dekontamination" }],
    szenario: "Gefahrgutunfall {ort} — Dekontamination der Einsatzkräfte",
    soll: [0, 1, 5, 6],
  },
  {
    verband: "Katastrophenschutz-Gefahrgutzug", kuerzel: "KatS-GGZ", anlage: 5,
    verbandSoll: [1, 5, 24, 30],
    einheit: "Dekontaminationsstaffel Personen", traeger: kats,
    personal: [
      { rolle: U, funktion: "Staffelführer/-in" },
      { rolle: M, funktion: "Helfer/-in Dekontamination", anzahl: 5 },
    ],
    fahrzeuge: [{ kurz: "GW-Dekon P", kennzahl: 53, lang: "Gerätewagen Dekontamination Personal" }],
    szenario: "Gefahrgutunfall {ort} — Dekontamination betroffener Personen",
    soll: [0, 1, 5, 6],
  },

  // ========================================= Anlage 6 — KatS-Einsatzzug Wasser
  {
    verband: "Katastrophenschutz-Einsatzzug Wasser", kuerzel: "KatS-EZ Wasser", anlage: 6,
    verbandSoll: [1, 4, 22, 27],
    einheit: "Führungseinheit Einsatzzug Wasser", traeger: kats, mitEinheitsfuehrer: true,
    personal: [
      { rolle: F, funktion: "Einheitsführer/-in" },
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Melder/-in", anzahl: 2, quali: "Sprechfunker" },
    ],
    fahrzeuge: [{ kurz: "ELW 1", kennzahl: 11, lang: "Einsatzleitwagen 1" }],
    szenario: "Hochwasser {ort} — Führung Einsatzzug Wasser",
    soll: [1, 1, 2, 4],
  },
  {
    verband: "Katastrophenschutz-Einsatzzug Wasser", kuerzel: "KatS-EZ Wasser", anlage: 6,
    verbandSoll: [1, 4, 22, 27],
    einheit: "Gruppe Einsatzzug Wasser", traeger: kats, jeVerband: 2,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Truppmann/Truppfrau", anzahl: 8, quali: "Atemschutzgeräteträger" },
    ],
    fahrzeuge: [{ kurz: "LF 20 KatS", kennzahl: 45, lang: "Löschgruppenfahrzeug Katastrophenschutz" }],
    szenario: "Hochwasser {ort} — Deichverteidigung und Abwehr von Wassergefahren",
    soll: [0, 1, 8, 9],
  },
  {
    verband: "Katastrophenschutz-Einsatzzug Wasser", kuerzel: "KatS-EZ Wasser", anlage: 6,
    verbandSoll: [1, 4, 22, 27],
    einheit: "Staffel Einsatzzug Wasser", traeger: kats,
    personal: [
      { rolle: U, funktion: "Staffelführer/-in" },
      { rolle: M, funktion: "Truppmann/Truppfrau", anzahl: 4 },
    ],
    fahrzeuge: [
      { kurz: "SW-KatS", kennzahl: 62, lang: "Schlauchwagen Katastrophenschutz" },
      { kurz: "MTW", kennzahl: 19, lang: "Mannschaftstransportwagen" },
    ],
    szenario: "Hochwasser {ort} — Wasserförderung über lange Wegstrecke",
    soll: [0, 1, 4, 5],
  },

  // ============================================== Anlage 7 — KatS-Logistikzug
  {
    verband: "Katastrophenschutz-Logistikzug", kuerzel: "KatS-LogZ", anlage: 7,
    verbandSoll: [1, 3, 13, 17],
    einheit: "Führungseinheit Logistikzug", traeger: kats, mitEinheitsfuehrer: true,
    personal: [
      { rolle: F, funktion: "Einheitsführer/-in" },
      { rolle: M, funktion: "Melder/-in", quali: "Sprechfunker" },
    ],
    fahrzeuge: [{ kurz: "MTW", kennzahl: 19, lang: "Mannschaftstransportwagen" }],
    szenario: "Flächenlage {ort} — Führung Logistikzug",
    soll: [1, 0, 1, 2],
  },
  {
    verband: "Katastrophenschutz-Logistikzug", kuerzel: "KatS-LogZ", anlage: 7,
    verbandSoll: [1, 3, 13, 17],
    einheit: "Logistikstaffel", traeger: kats, jeVerband: 2,
    personal: [
      { rolle: U, funktion: "Staffelführer/-in" },
      { rolle: M, funktion: "Helfer/-in Logistik", anzahl: 3 },
      { rolle: M, funktion: "Kraftfahrer/-in", anzahl: 2, fe: FE.C },
    ],
    fahrzeuge: [{ kurz: "GW-Log 2", kennzahl: 97, lang: "Gerätewagen Logistik 2" }],
    szenario: "Flächenlage {ort} — Verbrauchsgüterversorgung der Einsatzkräfte",
    soll: [0, 1, 5, 6],
  },
  {
    verband: "Katastrophenschutz-Logistikzug", kuerzel: "KatS-LogZ", anlage: 7,
    verbandSoll: [1, 3, 13, 17],
    einheit: "Logistiktrupp", traeger: kats,
    personal: [
      { rolle: U, funktion: "Truppführer/-in" },
      { rolle: M, funktion: "Kraftfahrer/-in", anzahl: 2, fe: FE.CE },
    ],
    fahrzeuge: [{ kurz: "WLF", kennzahl: 65, lang: "Wechselladerfahrzeug mit Abrollbehälter" }],
    szenario: "Flächenlage {ort} — Transport von Material mit Abrollbehältern",
    soll: [0, 1, 2, 3],
  },

  // ============================================ Anlage 8 — KatS-Bergrettungszug
  {
    verband: "Katastrophenschutz-Bergrettungszug", kuerzel: "KatS-BRZ", anlage: 8,
    verbandSoll: [1, 3, 18, 22],
    einheit: "Führungseinheit Bergrettungszug", traeger: bergwacht, mitEinheitsfuehrer: true,
    personal: [
      { rolle: F, funktion: "Einheitsführer/-in" },
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Melder/-in", anzahl: 2, quali: "Sprechfunker" },
    ],
    fahrzeuge: [
      { kurz: "KdoW", kennzahl: 10, lang: "Kommandowagen mit Anhänger" },
      { kurz: "KLGF", kennzahl: 79, lang: "Kleingeländefahrzeug" },
    ],
    szenario: "Bergunfall {ort} — Führung Bergrettungszug",
    soll: [1, 1, 2, 4],
  },
  {
    verband: "Katastrophenschutz-Bergrettungszug", kuerzel: "KatS-BRZ", anlage: 8,
    verbandSoll: [1, 3, 18, 22],
    einheit: "Bergrettungsgruppe", traeger: bergwacht, jeVerband: 2,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Bergretter/-in", anzahl: 6, quali: "Bergrettung" },
      { rolle: M, funktion: "Rettungssanitäter/-in", anzahl: 2, quali: "Rettungssanitäter" },
    ],
    fahrzeuge: [
      { kurz: "GW-Bergrettung", kennzahl: 74, lang: "Gerätewagen Bergrettung mit Anhänger" },
      { kurz: "KLGF", kennzahl: 79, lang: "Kleingeländefahrzeug" },
      { kurz: "KTW-Bergrettung", kennzahl: 85, lang: "Krankentransportwagen Bergrettung" },
    ],
    szenario: "Bergunfall {ort} — Rettung und Erstversorgung im unwegsamen Gelände",
    soll: [0, 1, 8, 9],
  },

  // ========================================== Anlage 9 — KatS-Wasserrettungszug
  {
    verband: "Katastrophenschutz-Wasserrettungszug", kuerzel: "KatS-WRZ", anlage: 9,
    verbandSoll: [1, 5, 22, 28],
    einheit: "Führungseinheit Wasserrettungszug", traeger: dlrg, mitEinheitsfuehrer: true,
    personal: [
      { rolle: F, funktion: "Einheitsführer/-in" },
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Melder/-in", anzahl: 2, quali: "Sprechfunker" },
    ],
    fahrzeuge: [{ kurz: "KdoW", kennzahl: 10, lang: "Kommandowagen" }],
    szenario: "Hochwasser {ort} — Führung Wasserrettungszug",
    soll: [1, 1, 2, 4],
  },
  {
    verband: "Katastrophenschutz-Wasserrettungszug", kuerzel: "KatS-WRZ", anlage: 9,
    verbandSoll: [1, 5, 22, 28],
    einheit: "Wasserrettungsstaffel", traeger: wasserwacht, jeVerband: 3,
    personal: [
      { rolle: U, funktion: "Staffelführer/-in" },
      { rolle: M, funktion: "Rettungsschwimmer/-in", anzahl: 3, quali: "Rettungsschwimmabzeichen Silber" },
      { rolle: M, funktion: "Bootsführer/-in", anzahl: 2, quali: "Bootsführerschein Binnen" },
    ],
    fahrzeuge: [
      { kurz: "GW-W", kennzahl: 75, lang: "Gerätewagen Wasserrettung mit Trailer" },
      { kurz: "Rettungsboot", kennzahl: 76, lang: "Rettungsboot auf Trailer", ohneKennzeichen: "Boot RTB" },
    ],
    szenario: "Hochwasser {ort} — Menschenrettung aus Wassergefahren",
    soll: [0, 1, 5, 6],
  },
  {
    verband: "Katastrophenschutz-Wasserrettungszug", kuerzel: "KatS-WRZ", anlage: 9,
    verbandSoll: [1, 5, 22, 28],
    einheit: "Taucherstaffel", traeger: dlrg,
    personal: [
      { rolle: U, funktion: "Staffelführer/-in" },
      { rolle: M, funktion: "Einsatztaucher/-in", anzahl: 4, quali: "Einsatztaucher Stufe 2" },
      { rolle: M, funktion: "Bootsführer/-in", quali: "Bootsführerschein Binnen" },
    ],
    fahrzeuge: [
      { kurz: "GW-Tauch", kennzahl: 75, lang: "Gerätewagen Taucher mit Trailer" },
      { kurz: "Rettungsboot", kennzahl: 76, lang: "Rettungsboot auf Trailer", ohneKennzeichen: "Boot RTB" },
    ],
    szenario: "Hochwasser {ort} — Tauchereinsatz und Unterwassersuche",
    soll: [0, 1, 5, 6],
  },

  // ================================ Anlage 10 — KatS-UE Behandlungsplatz
  {
    verband: "Katastrophenschutz-Unterstützungseinheit Behandlungsplatz",
    kuerzel: "KatS-UE BHP", anlage: 10, verbandSoll: [0, 1, 8, 9],
    einheit: "Sanitätsstaffel Behandlungsplatz", traeger: juh, mitEinheitsfuehrer: true,
    personal: [
      { rolle: U, funktion: "Einheitsführer/-in" },
      { rolle: M, funktion: "Sanitätshelfer/-in", anzahl: 5 },
    ],
    fahrzeuge: [{ kurz: "MTW", kennzahl: 19, lang: "Mannschaftstransportwagen" }],
    szenario: "MANV {ort} — Unterstützung der Erstversorgung am Behandlungsplatz",
    soll: [0, 1, 5, 6],
  },
  {
    verband: "Katastrophenschutz-Unterstützungseinheit Behandlungsplatz",
    kuerzel: "KatS-UE BHP", anlage: 10, verbandSoll: [0, 1, 8, 9],
    einheit: "Techniktrupp Behandlungsplatz", traeger: juh,
    personal: [{ rolle: M, funktion: "Helfer/-in Technik", anzahl: 3 }],
    fahrzeuge: [{ kurz: "GW-BHP", kennzahl: 96, lang: "Gerätewagen Behandlungsplatz" }],
    szenario: "MANV {ort} — Aufbau und Betrieb des Behandlungsplatzes",
    soll: [0, 0, 3, 3],
  },

  // ================================== Anlage 11 — KatS-UE Wassertransport
  {
    verband: "Katastrophenschutz-Unterstützungseinheit Wassertransport",
    kuerzel: "KatS-UE Wassertransport", anlage: 11, verbandSoll: [0, 1, 5, 6],
    einheit: "1. Wassertransporttrupp", traeger: kats, mitEinheitsfuehrer: true,
    personal: [
      { rolle: U, funktion: "Einheitsführer/-in" },
      { rolle: M, funktion: "Maschinist/-in", anzahl: 2, fe: FE.C },
    ],
    fahrzeuge: [{
      kurz: "TLF 3000", kennzahl: 23,
      lang: "Tanklöschfahrzeug, Tankinhalt mindestens 2000 Liter, geländegängig",
    }],
    szenario: "Waldbrand {ort} — Wassertransport im unwegsamen Gelände",
    soll: [0, 1, 2, 3],
    gemisch: true,
  },
  {
    verband: "Katastrophenschutz-Unterstützungseinheit Wassertransport",
    kuerzel: "KatS-UE Wassertransport", anlage: 11, verbandSoll: [0, 1, 5, 6],
    einheit: "2. Wassertransporttrupp", traeger: kats,
    personal: [{ rolle: M, funktion: "Maschinist/-in", anzahl: 3, fe: FE.C }],
    fahrzeuge: [{
      kurz: "TLF 4000", kennzahl: 24,
      lang: "Tanklöschfahrzeug, Tankinhalt mindestens 4000 Liter",
    }],
    szenario: "Waldbrand {ort} — Bereitstellung von Löschwasser",
    soll: [0, 0, 3, 3],
  },

  // ========================= Anlage 12 — KatS-UE Dekontamination Erstversorgung
  {
    verband: "Katastrophenschutz-Unterstützungseinheit Dekontamination Erstversorgung",
    kuerzel: "KatS-UE DekonEV", anlage: 12, verbandSoll: [1, 2, 12, 15],
    einheit: "Dekontaminationsgruppe Erstversorgung", traeger: drk, mitEinheitsfuehrer: true,
    personal: [
      { rolle: F, funktion: "Einheitsführer/-in" },
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Helfer/-in Dekontamination", anzahl: 7 },
    ],
    fahrzeuge: [{ kurz: "MTW", kennzahl: 19, lang: "Mannschaftstransportwagen" }],
    szenario: "CBRN-Lage {ort} — Unterstützung der Dekontaminationsmaßnahmen",
    soll: [1, 1, 7, 9],
  },
  {
    verband: "Katastrophenschutz-Unterstützungseinheit Dekontamination Erstversorgung",
    kuerzel: "KatS-UE DekonEV", anlage: 12, verbandSoll: [1, 2, 12, 15],
    einheit: "Dekontaminationsstaffel Erstversorgung", traeger: drk,
    personal: [
      { rolle: U, funktion: "Staffelführer/-in" },
      { rolle: M, funktion: "Helfer/-in Dekontamination", anzahl: 5 },
    ],
    fahrzeuge: [{
      kurz: "GW-Dekon EV", kennzahl: 53,
      lang: "Gerätewagen Dekontamination Erstversorgung (ergänzende Zivilschutzausstattung des Bundes)",
    }],
    szenario: "CBRN-Lage {ort} — Dekontamination von Verletzten",
    soll: [0, 1, 5, 6],
  },

  // ======================================== Anlage 13 — KatS-UE Messleitung
  {
    verband: "Katastrophenschutz-Unterstützungseinheit Messleitung",
    kuerzel: "KatS-UE Messleitung", anlage: 13, verbandSoll: [1, 1, 2, 4],
    einheit: "Messleitung", traeger: kats, mitEinheitsfuehrer: true,
    personal: [
      { rolle: F, funktion: "Einheitsführer/-in" },
      { rolle: U, funktion: "Truppführer/-in" },
      { rolle: M, funktion: "Helfer/-in Messtechnik", anzahl: 2, quali: "ABC-Erkundung" },
    ],
    fahrzeuge: [{
      kurz: "CBRN MLK", kennzahl: 58,
      lang: "Messleitkomponente (ergänzende Zivilschutzausstattung des Bundes)",
    }],
    szenario: "CBRN-Lage {ort} — Messleitung und Fachberatung gefährliche Stoffe",
    soll: [1, 1, 2, 4],
  },

  // ========================================= Anlage 14 — KatS-Führungsgruppe
  {
    verband: "Katastrophenschutz-Führungsgruppe", kuerzel: "KatS-FüGr", anlage: 14,
    verbandSoll: [5, 0, 4, 9],
    einheit: "Führungseinheit Führungsgruppe", traeger: kats, mitEinheitsfuehrer: true,
    personal: [
      { rolle: F, funktion: "Einheitsführer/-in" },
      { rolle: F, funktion: "Fachberater/-in", anzahl: 3 },
      { rolle: M, funktion: "Helfer/-in Lagedarstellung", anzahl: 2 },
    ],
    fahrzeuge: [{ kurz: "MTW", kennzahl: 19, lang: "Mannschaftstransportwagen" }],
    szenario: "Verbandslage {ort} — Führung von Bereitschaften und Abteilungen",
    soll: [4, 0, 2, 6],
  },
  {
    verband: "Katastrophenschutz-Führungsgruppe", kuerzel: "KatS-FüGr", anlage: 14,
    verbandSoll: [5, 0, 4, 9],
    einheit: "Führungsunterstützungstrupp Führungsgruppe", traeger: kats,
    personal: [
      { rolle: F, funktion: "Führungsassistent/-in" },
      { rolle: M, funktion: "Fernmelder/-in", anzahl: 2, quali: "Sprechfunker" },
    ],
    fahrzeuge: [{ kurz: "ELW 2", kennzahl: 12, lang: "Einsatzleitwagen 2" }],
    szenario: "Verbandslage {ort} — stabsmäßige Führungsstelle, IuK-Betrieb",
    soll: [1, 0, 2, 3],
  },

  // ============= Anlage 15 — KatS-UE Führung „Medizinische Rettung" (MTF)
  {
    verband: "Katastrophenschutz-Unterstützungseinheit Führung „Medizinische Rettung“",
    kuerzel: "KatS-UE Führung Med. Rettung", anlage: 15, verbandSoll: [2, 0, 1, 3],
    einheit: "Führungsunterstützungstrupp Medizinische Rettung", traeger: drk,
    personal: [
      { rolle: F, funktion: "Einheitsführer/-in" },
      { rolle: F, funktion: "Führungsassistent/-in" },
      { rolle: M, funktion: "Fernmelder/-in", quali: "Sprechfunker" },
    ],
    fahrzeuge: [{
      kurz: "FüKW MTF", kennzahl: 11,
      lang: "Führungskraftwagen Medizinische Task Force (ergänzende Zivilschutzausstattung des Bundes)",
    }],
    szenario: "MANV {ort} — Führung der Medizinischen Task Force",
    soll: [2, 0, 1, 3],
  },

  // ======================= Anlage 16 — KatS-Facheinheit Rettungshunde/Ortung
  {
    verband: "Katastrophenschutz-Facheinheit Rettungshunde/Ortungstechnik",
    kuerzel: "KatS-RHOT", anlage: 16, verbandSoll: [1, 3, 9, 13],
    einheit: "Führungseinheit Rettungshunde/Ortungstechnik", traeger: kats, mitEinheitsfuehrer: true,
    personal: [
      { rolle: F, funktion: "Einheitsführer/-in" },
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Melder/-in", anzahl: 2, quali: "Sprechfunker" },
    ],
    fahrzeuge: [{ kurz: "KdoW", kennzahl: 10, lang: "Kommandowagen" }],
    szenario: "Gebäudeeinsturz {ort} — Führung Facheinheit Rettungshunde/Ortungstechnik",
    soll: [1, 1, 2, 4],
  },
  {
    verband: "Katastrophenschutz-Facheinheit Rettungshunde/Ortungstechnik",
    kuerzel: "KatS-RHOT", anlage: 16, verbandSoll: [1, 3, 9, 13],
    einheit: "Einheit Ortungstechnik", traeger: kats,
    personal: [
      { rolle: U, funktion: "Truppführer/-in" },
      { rolle: M, funktion: "Helfer/-in Ortungstechnik", anzahl: 2, quali: "Technische Ortung" },
    ],
    fahrzeuge: [{ kurz: "GW-Ortung", kennzahl: 79, lang: "Gerätewagen Ortung" }],
    szenario: "Gebäudeeinsturz {ort} — Ortung verschütteter Personen mit Technik",
    soll: [0, 1, 2, 3],
  },
  {
    verband: "Katastrophenschutz-Facheinheit Rettungshunde/Ortungstechnik",
    kuerzel: "KatS-RHOT", anlage: 16, verbandSoll: [1, 3, 9, 13],
    einheit: "Einheit Rettungshunde", traeger: kats,
    personal: [
      { rolle: U, funktion: "Staffelführer/-in" },
      { rolle: M, funktion: "Hundeführer/-in", anzahl: 5, quali: "Rettungshundeführer Fläche/Trümmer" },
    ],
    fahrzeuge: [{ kurz: "Rettungshundefahrzeug", kennzahl: 19, lang: "Rettungshundefahrzeug" }],
    szenario: "Gebäudeeinsturz {ort} — Suche vermisster Personen mit Rettungshunden",
    soll: [0, 1, 5, 6],
  },

  // ============================ Anlage 17 — KatS-Führungsstab des Landes
  {
    verband: "Katastrophenschutz-Führungsstab des Landes", kuerzel: "KatS-FüStab", anlage: 17,
    verbandSoll: [10, 0, 9, 19], ortFest: TLFKS,
    einheit: "Führungseinheit Führungsstab", traeger: kats, mitEinheitsfuehrer: true,
    personal: [
      { rolle: F, funktion: "Einheitsführer/-in" },
      { rolle: M, funktion: "Helfer/-in Lagedarstellung", anzahl: 3 },
    ],
    fahrzeuge: [{ kurz: "KdoW", kennzahl: 10, lang: "Kommandowagen" }],
    szenario: "Landesweite Lage — Führung des mobilen Führungsstabes des Landes",
    soll: [1, 0, 3, 4],
  },
  {
    verband: "Katastrophenschutz-Führungsstab des Landes", kuerzel: "KatS-FüStab", anlage: 17,
    verbandSoll: [10, 0, 9, 19], ortFest: TLFKS, jeVerband: 2,
    einheit: "Führungsstaffel Führungsstab", traeger: kats,
    personal: [
      { rolle: F, funktion: "Sachgebietsleiter/-in S1 bis S6", anzahl: 4 },
      { rolle: M, funktion: "Sichter/-in und Melder/-in", anzahl: 2 },
    ],
    fahrzeuge: [{ kurz: "MTW", kennzahl: 19, lang: "Mannschaftstransportwagen" }],
    szenario: "Landesweite Lage — Sachgebiete S1 bis S6 des Führungsstabes",
    soll: [4, 0, 2, 6],
  },
  {
    verband: "Katastrophenschutz-Führungsstab des Landes", kuerzel: "KatS-FüStab", anlage: 17,
    verbandSoll: [10, 0, 9, 19], ortFest: TLFKS,
    einheit: "Führungsunterstützungstrupp Führungsstab", traeger: kats,
    personal: [
      { rolle: U, funktion: "Truppführer/-in" },
      { rolle: M, funktion: "Fernmelder/-in", anzahl: 2, quali: "Sprechfunker" },
    ],
    fahrzeuge: [{ kurz: "ELW 2", kennzahl: 12, lang: "Einsatzleitwagen 2" }],
    szenario: "Landesweite Lage — Führungsstelle und Fernmeldebetrieb des Landes",
    soll: [0, 1, 2, 3],
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

function fahrzeugeBauen(specs: FzSpec[], ort: ThOrt, traeger: Traeger): Fahrzeug[] {
  // Laufende Nummer je gleicher Fahrzeugkennzahl (Nr. 2.3: „Mehrere Fahrzeuge
  // derselben Art werden durch eine fortlaufende Zahl unterschieden").
  const belegt = new Map<number, number>();
  const fahrzeuge: Fahrzeug[] = [];
  for (const s of specs) {
    for (let i = 0; i < (s.anzahl ?? 1); i++) {
      const fz: Fahrzeug = { typ: { freitext: s.kurz } };
      if (s.lang) fz.aenderungen = s.lang;
      fz.kennzeichen = s.ohneKennzeichen ?? kennzeichen(ort.kfz);
      if (s.kennzahl != null) {
        const lfd = (belegt.get(s.kennzahl) ?? 0) + 1;
        belegt.set(s.kennzahl, lfd);
        fz.funkrufname = {
          kennwort: traeger.kennwort,
          // Standortkenner ist der Einsatzbereich (Landkreis bzw. kreisfreie
          // Stadt); die Wache steht als erste Zahl in den Teilen.
          eigenerStandort: false,
          ort: einsatzbereich(ort),
          teile: [ort.wache, s.kennzahl, lfd],
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
  ort: ThOrt;
  spec: BogenSpec;
}

function bogenBauen(spec: BogenSpec, ort: ThOrt): BeispielBogen {
  const personal = personalBauen(spec.personal);
  const fahrzeuge = fahrzeugeBauen(spec.fahrzeuge, ort, spec.traeger);

  const hierarchie: HierarchieEbene[] = [
    { bezeichnung: { freitext: spec.verband }, name: ort.ort },
    ...spec.traeger.ebene(ort),
  ];

  const stand = datumAusIso("2026-07-16") + ganz(0, 2);
  const dauer = ganz(1, 4);
  const diesel = fahrzeuge.reduce((s, fz) => s + dieselFuer(fz.typ.freitext ?? ""), 0);

  const mehrfach = spec.jeVerband && spec.jeVerband > 1
    ? ` Der Verband führt ${spec.jeVerband} dieser Teileinheiten.`
    : "";
  const efHinweis = spec.mitEinheitsfuehrer
    ? " Der im Schaubild eigenständig ausgewiesene Einheitsführer ist hier eingerechnet."
    : "";

  const bogen: Erfassungsbogen = {
    schemaVersion: SCHEMA_VERSION,
    stand,
    einheit: {
      organisation: spec.traeger.org,
      organisationName: spec.traeger.organisationName(ort),
      einheitsTyp: { freitext: spec.einheit },
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
      `Teileinheit des Verbandes „${spec.verband}" (${spec.kuerzel}) nach `
      + `ThürKatSVO Anlage ${spec.anlage}; Sollstärke der Teileinheit `
      + `${spec.soll[0]}/${spec.soll[1]}/${spec.soll[2]}/${spec.soll[3]}, `
      + `Mannschaftsstärke des Verbandes ${spec.verbandSoll[0]}/${spec.verbandSoll[1]}`
      + `/${spec.verbandSoll[2]}/${spec.verbandSoll[3]}.${mehrfach}${efHinweis}`,
  };

  return { datei: `${slug(spec.einheit)}-${slug(ort.ort)}`, bogen, ort, spec };
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
 * Verbände, deren Schaubild-Kopfzeile nicht mit der Summe der Kästen
 * übereinstimmt. Die Bögen folgen den Kästen, weil nur diese das Personal den
 * Fahrzeugen zuordnen; im README dokumentiert.
 */
const KOPF_ABWEICHUNG = new Map<string, string>([
  ["KatS-FüStab", "Kopfzeile 10/0/9/19, Summe der Kästen 9/1/9/19"],
]);

/**
 * Selbstprüfung: Stärke je Teileinheit gegen das Schaubild, Summe aller
 * Teileinheiten je Verband gegen dessen Mannschaftsstärke, und jedes
 * motorisierte Fahrzeug trägt einen vollständigen Funkrufnamen aus
 * Wache, Fahrzeugkennzahl und laufender Nummer.
 */
function pruefen(beispiele: BeispielBogen[]): void {
  const fehler: string[] = [];

  for (const b of beispiele) {
    const s = staerke(b.bogen);
    const [f, u, m, g] = b.spec.soll;
    if (s.fuehrer !== f || s.unterfuehrer !== u || s.mannschaft !== m || s.gesamt !== g) {
      fehler.push(
        `${b.datei}: Stärke ${s.fuehrer}/${s.unterfuehrer}/${s.mannschaft}/${s.gesamt} ≠ Schaubild ${f}/${u}/${m}/${g}`,
      );
    }
    const anhaengerKz = new Set(
      b.spec.fahrzeuge.filter((x) => x.ohneKennzeichen).map((x) => x.ohneKennzeichen!),
    );
    for (const fz of b.bogen.fahrzeuge) {
      const kurz = fz.typ.freitext ?? "?";
      if (anhaengerKz.has(fz.kennzeichen ?? "")) continue;
      if (fz.funkrufname?.teile.length !== 3) {
        fehler.push(`${b.datei}: ${kurz} ohne vollständigen Funkrufnamen (Wache/Kennzahl/lfd. Nr.)`);
      }
      if (fz.funkrufname?.ort !== einsatzbereich(b.ort)) {
        fehler.push(`${b.datei}: ${kurz} führt nicht den Einsatzbereich „${einsatzbereich(b.ort)}"`);
      }
    }
  }

  // Summe der Teileinheiten je Verband gegen die Mannschaftsstärke des Kopfes.
  const jeVerband = new Map<string, BogenSpec[]>();
  for (const spec of SPECS) {
    const liste = jeVerband.get(spec.kuerzel) ?? [];
    liste.push(spec);
    jeVerband.set(spec.kuerzel, liste);
  }
  for (const [kuerzel, specs] of jeVerband) {
    const summe = specs.reduce<[number, number, number, number]>(
      (acc, s) => {
        const n = s.jeVerband ?? 1;
        return [
          acc[0] + s.soll[0] * n, acc[1] + s.soll[1] * n,
          acc[2] + s.soll[2] * n, acc[3] + s.soll[3] * n,
        ];
      },
      [0, 0, 0, 0],
    );
    const kopf = specs[0]!.verbandSoll;
    const gleich = summe.every((w, i) => w === kopf[i]);
    const abweichungBekannt = KOPF_ABWEICHUNG.has(kuerzel);
    if (!gleich && !abweichungBekannt) {
      fehler.push(
        `${kuerzel}: Summe der Teileinheiten ${summe.join("/")} ≠ Mannschaftsstärke ${kopf.join("/")}`,
      );
    }
    if (gleich && abweichungBekannt) {
      fehler.push(`${kuerzel}: als Abweichung geführt, stimmt aber — KOPF_ABWEICHUNG bereinigen`);
    }
  }

  if (fehler.length > 0) {
    throw new Error(`Selbstprüfung fehlgeschlagen:\n  ${fehler.join("\n  ")}`);
  }
}

// ---------------------------------------------------------------- Hauptlauf

// Jede Teileinheit an einen anderen Standort in Thüringen setzen
// (deterministisch über die unteren Katastrophenschutzbehörden gestreut);
// die Landeseinheiten bleiben an der TLFKS.
const beispiele: BeispielBogen[] = SPECS.map((spec, i) =>
  bogenBauen(spec, spec.ortFest ?? TH_ORTE[(i * 13 + 3) % TH_ORTE.length]!),
);

pruefen(beispiele);

const ausgabe = join(wurzel, "examples", "katastrophenschutz", "thueringen");
mkdirSync(ausgabe, { recursive: true });
for (const datei of readdirSync(ausgabe)) {
  if (datei.endsWith(".json")) rmSync(join(ausgabe, datei));
}

for (const bsp of beispiele) {
  const qr = await qrSatz(bsp.bogen);
  roundtrip(qr, bsp.bogen.personal.length, bsp.datei);
  writeFileSync(join(ausgabe, `${bsp.datei}.json`), JSON.stringify(bsp.bogen, null, 2) + "\n");
}

const zeilen = beispiele.map((b) => {
  const s = staerke(b.bogen);
  const fz = b.bogen.fahrzeuge.length === 0 ? "—" : String(b.bogen.fahrzeuge.length);
  return `| ${b.datei} | ${b.spec.kuerzel} | ${b.bogen.einheit.einheitsTyp.freitext} | ${b.ort.ort} | ${b.ort.kreis} | ${s.fuehrer}/${s.unterfuehrer}/${s.mannschaft}/${s.gesamt} | ${b.spec.jeVerband ?? 1} | ${fz} | Anlage ${b.spec.anlage} |`;
});

writeFileSync(
  join(ausgabe, "README.md"),
  `# Beispiel-Erfassungsbögen — Katastrophenschutz Thüringen

${beispiele.length} generierte Beispiel-Teileinheiten nach der Thüringer
**Katastrophenschutzverordnung** (ThürKatSVO vom 10. November 2020, Anlagen 1
bis 17), wie sie die Broschüre „ThürKatSVO in Schaubildern" (TMIK,
Ausgabe 1/2021) je Einheit als Gliederungsbild wiedergibt.

Abgebildet ist — wie bei Sachsen und Niedersachsen — je kleinster selbstständiger
Teileinheit ein Bogen; die Züge sind in ihre Teileinheiten zerlegt. Die
Schaubilder geben Stärke **und** Fahrzeug je Teileinheit an, die Fahrzeugtypen
sind hier also verordnungsseitig belegt (anders als in Brandenburg).

Alle Personen, Standort-Zuordnungen, Wachennummern und Kennzeichen sind
**fiktiv**.

## Zwei Modellierungsentscheidungen

* **Einheitsführer:** In den Schaubildern steht der Einheitsführer als eigener
  Kasten ohne Fahrzeug. Er ist hier der Führungseinheit bzw. der ersten
  Teileinheit zugeschlagen, statt einen fahrzeuglosen Ein-Personen-Bogen zu
  erzeugen. Jeder betroffene Bogen vermerkt das im Feld „Sonstiges".
* **Mehrfach gleiche Teileinheiten** (vier Transporttrupps im Sanitätszug, drei
  Wasserrettungsstaffeln, zwei Gruppen der Einsatzzüge, zwei Logistikstaffeln,
  zwei Bergrettungsgruppen, zwei Führungsstaffeln des Landes-Führungsstabes)
  ergeben **einen** Bogen. Die Spalte „je Verband" der Tabelle nennt die Zahl im
  Verband; die Summenprüfung rechnet sie entsprechend hoch.

Geprüft wird beim Generieren die Stärke jeder Teileinheit gegen ihr Schaubild
**und** die Summe aller Teileinheiten gegen die Mannschaftsstärke des Verbandes.

## Hinweis zur Führungsstaffel (Anlage 1)

Das Schaubild der **Katastrophenschutz-Führungsstaffel** ist das einzige, das
**keine Fahrzeuge** ausweist. Die beiden Bögen bilden das so ab und führen
deshalb keine Fahrzeuge — das ist kein Fehler der Generierung.

## Hinweis zum Führungsstab des Landes (Anlage 17)

Die Kopfzeile der Anlage 17 gibt die Mannschaftsstärke **10/0/9/19** an. Die
Summe der Kästen ergibt dagegen **9/1/9/19**: Gesamtstärke und Mannschaft
stimmen überein, der Führungsunterstützungstrupp führt in seinem Kasten aber
einen Unterführer (0/1/2/3), den die Kopfzeile als Führer zählt. Die Bögen
folgen den **Kästen**, weil nur diese das Personal den Fahrzeugen zuordnen. Für
alle übrigen Einheiten stimmen Kopfzeile und Summe exakt überein.

## Funkrufnamen

Nach der Funkrufnamenregelung Thüringen (Anlage 10 der funktechnischen und
funkbetrieblichen Richtlinien, Version 1.0 vom 3. Juli 2017, auf Basis der
OPTA-Richtlinie der BDBOS):

> \`<Kennwort> <Einsatzbereich> <Wache> <Fahrzeugkennzahl> <laufende Nummer>\`
>
> Beispiel der Richtlinie: \`Florian Weimar 1 44 1\`

* **Kennwort** nach Nr. 2.1. Für den Katastrophenschutz ist das **„Kater"**;
  von Hilfsorganisationen getragene Einheiten führen deren Grundrufnamen —
  DRK „Rotkreuz", ASB „Sama", JUH „Akkon", MHD „Johannes", DLRG „Pelikan",
  dazu „Bergwacht" und „Wasserwacht". Die Fußnote der Richtlinie stellt klar,
  dass KatS-Fahrzeuge nur bei Einsätzen des örtlichen Brandschutzes und der
  Allgemeinen Hilfe „Florian" führen — hier geht es um
  Katastrophenschutzeinsätze, deshalb durchgängig „Kater".
* **Standortkenner** (Nr. 2.2) ist der Einsatzbereich — Landkreis bzw.
  kreisfreie Stadt — mit einer Wachennummer darunter. Die Landeseinheiten an der
  Landesfeuerwehr- und Katastrophenschutzschule führen „Thüringen Schule".
* **Fahrzeugkennzahl** nach dem Kennzahlenplan Nr. 2.3 (u. a. 10 KdoW,
  11 ELW 1/FüKW, 12 ELW 2, 19 MTW, 23 TLF 3000, 24 TLF 4000, 45 LF 20 KatS,
  53 GW-Dekon, 54 GW-G, 56 GW-A/S, 57 GW-Mess, 58 CBRN MLK/ErkKw, 62 SW-KatS,
  65 WLF, 72 RW, 74 GW Berg- und Höhenrettung, 75 GW-W/GW-Tauch, 76 Boote,
  85 KTW, 95 GW San, 96 GW Beh, 97 GW Log, 98 GW Bt).
* **Laufende Nummer** unterscheidet mehrere Fahrzeuge derselben Art.
* **Anhänger und Boote auf Trailern** sind ohne Kfz-Kennzeichen geführt.

Neu erzeugen mit: \`npm run beispiele:kats-th\` (deterministisch, fester Zufalls-Seed).

| Datei | Einheit | Teileinheit | Ort | Untere KatS-Behörde | Stärke | je Verband | Fz | Quelle |
|---|---|---|---|---|---|---|---|---|
${zeilen.join("\n")}
`,
);

console.log(`${beispiele.length} Bögen nach ${ausgabe} geschrieben.`);
