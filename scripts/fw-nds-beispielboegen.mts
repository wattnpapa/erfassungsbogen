/**
 * Erzeugt Beispiel-Erfassungsbögen der niedersächsischen Feuerwehren nach der
 * Niedersächsischen Feuerwehrverordnung (Nds. FwVO vom 08.04.2025, Nds. GVBl.
 * 2025; nicht amtlicher Abdruck Stand 10.04.2025) als JSON nach
 * examples/feuerwehr/niedersachsen/. Abgelegt ist nur das Bogen-JSON; die PDF
 * entsteht erst beim Anklicken in der App aus dem aktuellen Layout.
 *
 * Aufruf (Node ≥ 22): npm run beispiele:fw-nds
 *
 * Abgebildet sind zwei Familien:
 *  1. die taktischen Einheiten nach § 2 Abs. 2 (Selbständiger Trupp, Staffel,
 *     Gruppe, Zug) — das, was tatsächlich ausrückt bzw. überörtlich hilft, mit
 *     dem zur Besatzung passenden Löschfahrzeug nach Anlage 1;
 *  2. die drei Arten von Ortsfeuerwehren nach § 1 Abs. 1 (Grundausstattungs-,
 *     Stützpunkt-, Schwerpunktfeuerwehr) mit ihrer personellen Mindeststärke
 *     nach § 3 Abs. 2 — einschließlich Ortsbrandmeisterin/Ortsbrandmeister,
 *     Stellvertretung und der 100-%-Personalreserve — und ihrer
 *     Mindestausrüstung nach § 4.
 *
 * Die Stärkerolle folgt der Stellung in der Einheit, nicht der höchsten
 * Ausbildung: Führerin/Führer der Einheit → F, Truppführungen und die
 * Teileinheitsführungen innerhalb eines Zuges → U, alle weiteren
 * einsatzspezifischen Funktionen → M.
 *
 * Fiktiv sind alle Personen, die Zuordnung der Einheiten zu Ortsfeuerwehren,
 * die Kennzeichen und die örtlichen Kennungen der Funkrufnamen.
 *
 * Am Ende läuft eine Selbstprüfung (QR-Roundtrip und Soll-Stärke je Bogen); die
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
  datumAusIso,
  MINUTEN_JE_TAG,
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
import { fakeTelefon } from "./fake-telefon";

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
const rnd = prng(20250408); // Datum der Verordnung

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
  "Alexander", "Andreas", "Bernd", "Christian", "Daniel", "David", "Dennis", "Dirk",
  "Dominik", "Erik", "Fabian", "Felix", "Florian", "Frank", "Georg", "Hannes",
  "Heiko", "Henrik", "Jan", "Jannik", "Jens", "Joachim", "Jonas", "Julian",
  "Kai", "Karsten", "Kevin", "Lars", "Leon", "Lukas", "Marco", "Marcel",
  "Markus", "Martin", "Matthias", "Michael", "Moritz", "Niklas", "Ole", "Pascal",
  "Patrick", "Paul", "Peter", "Philipp", "Ralf", "Robert", "Sebastian", "Simon",
  "Stefan", "Sven", "Thomas", "Thorsten", "Tim", "Tobias", "Torben", "Uwe",
  "Arne", "Bastian", "Björn", "Broder", "Eike", "Gerd", "Hauke", "Helge",
  "Ingo", "Jasper", "Johann", "Klaas", "Malte", "Nils", "Onno", "Rüdiger",
] as const;
const VORNAMEN_W = [
  "Anja", "Anna", "Antje", "Birgit", "Carina", "Christina", "Claudia", "Diana",
  "Franziska", "Hanna", "Ines", "Jana", "Julia", "Katharina", "Katrin", "Kerstin",
  "Laura", "Lea", "Lena", "Lisa", "Maren", "Marie", "Melanie", "Miriam",
  "Nadine", "Nicole", "Sabine", "Sandra", "Sarah", "Silke", "Sonja", "Stefanie",
  "Svenja", "Tanja", "Ulrike", "Vanessa", "Verena", "Almut", "Frauke", "Gesa",
  "Heike", "Imke", "Jutta", "Merle", "Tomke", "Wiebke",
] as const;
const NACHNAMEN = [
  "Ahlers", "Albers", "Behrens", "Brinkmann", "Bruns", "Cordes", "Dettmer", "Eilers",
  "Fischer", "Focke", "Freese", "Gerdes", "Harms", "Hinrichs", "Janssen", "Kastens",
  "Kruse", "Lüdemann", "Meyer", "Müller", "Oltmanns", "Onken", "Petersen", "Pohl",
  "Ramke", "Renken", "Rieper", "Sanders", "Schmidt", "Schröder", "Siefken", "Tammen",
  "Ubben", "Vosteen", "Wessels", "Wilkens", "Wübben", "Ziegler",
  "Albrecht", "Bauer", "Becker", "Braun", "Engel", "Ernst", "Franke", "Graf",
  "Hahn", "Hartmann", "Hoffmann", "Kaiser", "Keller", "Klein", "Koch", "König",
  "Krüger", "Lang", "Lehmann", "Lorenz", "Neumann", "Otto", "Peters", "Richter",
  "Roth", "Schäfer", "Schulz", "Schwarz", "Sommer", "Stein", "Vogel", "Wagner",
  "Weber", "Werner", "Winkler", "Wolf",
  "Addicks", "Bohlen", "Deters", "Ehlen", "Frerichs", "Grote", "Hemmen", "Kleene",
  "Lammers", "Mansholt", "Nannen", "Ostendorf", "Poppen", "Riesenbeck", "Schoone",
  "Tholen", "Uphoff", "Vehmeyer", "Wehlage", "Zwafelink",
] as const;

/** Externe/Berufs-Qualifikationen (Freitext) — gelegentlich gestreut. */
const QUALI_POOL = [
  "Berufskraftfahrer (Beruf)",
  "Rettungssanitäter (extern)",
  "Elektrofachkraft (Beruf)",
  "Landwirt — Erfahrung Großgeräte",
  "Motorsägenschein AS Baum I (extern)",
  "Funkamateur (extern)",
  "Gesundheits- und Krankenpfleger (Beruf)",
  "Kfz-Mechatroniker (Beruf)",
] as const;

// -------------------------------------------------- Ortsfeuerwehren (fiktiv)

interface OrtsFw {
  /** Name der Ortsfeuerwehr (Ortsteil) — erste Hierarchie-Ebene. */
  ortsfeuerwehr: string;
  /** Gemeinde/Stadt nach § 1 (ohne Berufsfeuerwehr) — Ebene „Gemeinde/Stadt". */
  gemeinde: string;
  landkreis: string;
  kfz: string;
}

const ORTE: OrtsFw[] = [
  { ortsfeuerwehr: "Hundsmühlen", gemeinde: "Gemeinde Wardenburg", landkreis: "Landkreis Oldenburg", kfz: "OL" },
  { ortsfeuerwehr: "Bookholzberg", gemeinde: "Gemeinde Ganderkesee", landkreis: "Landkreis Oldenburg", kfz: "OL" },
  { ortsfeuerwehr: "Ocholt", gemeinde: "Stadt Westerstede", landkreis: "Landkreis Ammerland", kfz: "WST" },
  { ortsfeuerwehr: "Ottensen", gemeinde: "Stadt Buxtehude", landkreis: "Landkreis Stade", kfz: "STD" },
  { ortsfeuerwehr: "Hemmoor", gemeinde: "Stadt Hemmoor", landkreis: "Landkreis Cuxhaven", kfz: "CUX" },
  { ortsfeuerwehr: "Versen", gemeinde: "Stadt Meppen", landkreis: "Landkreis Emsland", kfz: "EL" },
  { ortsfeuerwehr: "Laxten", gemeinde: "Stadt Lingen (Ems)", landkreis: "Landkreis Emsland", kfz: "EL" },
  { ortsfeuerwehr: "Sudheim", gemeinde: "Stadt Northeim", landkreis: "Landkreis Northeim", kfz: "NOM" },
  { ortsfeuerwehr: "Lenglern", gemeinde: "Gemeinde Bovenden", landkreis: "Landkreis Göttingen", kfz: "GÖ" },
  { ortsfeuerwehr: "Wietzendorf", gemeinde: "Gemeinde Wietzendorf", landkreis: "Heidekreis", kfz: "HK" },
];

// ------------------------------------------------------ Funkrufnamen (OPTA)
//
// Wie bei den KatS-Beispielen Niedersachsen: „Florian <Landkreis>
// <örtl. Kennung>/<Fahrzeugkennung>/<Ordnungskennung>" nach dem OPTA-RdErl. MI
// Niedersachsen v. 01.03.2024 (Nds. MBl. 2024 Nr. 125). Rufname „Florian" ist
// FUNKRUF_KENNWOERTER-Code 2 (src/vokabulare/thw.ts).

const KENNWORT_FLORIAN = 2;

/**
 * Name ohne vorangestellte Rechtsform. Gebraucht an zwei Stellen: als regionale
 * Zuordnung im Funkrufnamen (OPTA Nr. 4.2.2) und als Name einer Hierarchie-Ebene
 * — deren Bezeichnung („Gemeinde/Stadt", „Landkreis/kreisfreie Stadt") steht auf
 * dem Bogen schon davor, sonst läse es sich „Landkreis Landkreis Northeim".
 */
function ohneRechtsform(name: string): string {
  return name.replace(/^(Samtgemeinde|Gemeinde|Stadt|Landkreis|Region)\s+/, "");
}

/** Fiktive, aber deterministische Gemeindekennziffer (OPTA Nr. 2.5): 10–39. */
function gemeindeKennung(o: OrtsFw): number {
  let h = 0;
  for (const c of o.gemeinde) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return (h % 30) + 10;
}

// ------------------------------------- Feuerwehrfahrzeuge (Anlage 1 zu § 4)

interface FzTyp {
  /** Kurzbezeichnung wie am Fahrzeug — steht im Bogen als Fahrzeugtyp. */
  kurz: string;
  /** Klartext mit Typ nach Anlage 1 — steht im Bogen unter „Änderungen/Sondergerät". */
  lang: string;
  /** Fahrzeugkennung (OPTA Anlage 2); fehlt sie, bekommt das Fahrzeug keinen Funkrufnamen. */
  kennung?: number;
  /** Abrollbehälter/Gerät: kein Kfz-Kennzeichen, sondern ein Freitext. */
  ohneKennzeichen?: string;
}

const FZ = {
  ELW1: {
    kurz: "ELW 1", kennung: 11,
    lang: "Einsatzleitfahrzeug (Typ 1): erweiterter Selbständiger Trupp, zwei Kommunikationsarbeitsplätze, Außenlautsprecheranlage",
  },
  TLF2000: {
    kurz: "TLF 2000", kennung: 21,
    lang: "Löschfahrzeug mit Truppbesatzung (Typ 2.1.1): FP 1 000 l/min, 1 800 l Löschwasser, Schnellangriff, 2 Atemschutzgeräte",
  },
  TLF4000: {
    kurz: "TLF 4000", kennung: 24,
    lang: "Löschfahrzeug mit Truppbesatzung (Typ 2.1.2): FP 2 000 l/min, 4 000 l Löschwasser, Dachmonitor, 2 Atemschutzgeräte",
  },
  TSF: {
    kurz: "TSF", kennung: 40,
    lang: "Löschfahrzeug mit Staffelbesatzung (Typ 2.2.1): FP 1 000 l/min, Beladung für eine Gruppe, 4 Atemschutzgeräte",
  },
  MLF: {
    kurz: "MLF", kennung: 42,
    lang: "Löschfahrzeug mit Staffelbesatzung (Typ 2.2.2): FP 1 000 l/min, 600 l Löschwasser, Schnellangriff, 4 Atemschutzgeräte",
  },
  STLF20: {
    kurz: "StLF 20", kennung: 45,
    lang: "Löschfahrzeug mit Staffelbesatzung (Typ 2.2.3): FP 2 000 l/min, 2 500 l Löschwasser, Schnellangriff, 4 Atemschutzgeräte",
  },
  LF10: {
    kurz: "LF 10", kennung: 43,
    lang: "Löschfahrzeug mit Gruppenbesatzung (Typ 2.3.1): FP 1 000 l/min, 600 l Löschwasser, 4 Atemschutzgeräte",
  },
  LF20: {
    kurz: "LF 20", kennung: 44,
    lang: "Löschfahrzeug mit Gruppenbesatzung (Typ 2.3.2): FP 2 000 l/min, 1 600 l Löschwasser, Leitern 7 m und 12 m, 4 Atemschutzgeräte",
  },
  DLK23: {
    kurz: "DLK 23", kennung: 33,
    lang: "Hubrettungsfahrzeug (Typ 3): Rettungshöhe 23 m, Truppbesatzung",
  },
  RW: {
    kurz: "RW", kennung: 52,
    lang: "Rüstwagen (Typ 4): Zugeinrichtung 50 kN, Lichtmast, Stromerzeuger 22 kVA, geländefähig",
  },
  GWL2: {
    kurz: "GW-L2", kennung: 68,
    lang: "Gerätewagen (Typ 5.3): Staffelbesatzung, Nutzlast 4 000 kg, Ausrüstungsmodul Wasserversorgung",
  },
  WLF: {
    kurz: "WLF", kennung: 66,
    lang: "Wechselladerfahrzeug (Typ 6) zum Transport von Abrollbehältern",
  },
  AB_RUEST: {
    kurz: "AB Rüst",
    lang: "Abrollbehälter mit den Merkmalen der Fahrzeuggruppe Typ 4 (technische Hilfeleistung)",
    ohneKennzeichen: "AB",
  },
} satisfies Record<string, FzTyp>;

/** Diesel-Sofortbedarf je Fahrzeug (grobe Richtwerte, Liter). */
function dieselFuer(kurz: string): number {
  if (/^(WLF|TLF 4000)/.test(kurz)) return 120;
  if (/^(LF|StLF|DLK|RW|GW|TLF)/.test(kurz)) return 70;
  if (/^(ELW|MLF|TSF)/.test(kurz)) return 45;
  return 0;
}

// --------------------------------------------------------------- Kurzhelfer

function slug(s: string): string {
  return s
    .toLowerCase()
    .replaceAll("ä", "ae").replaceAll("ö", "oe").replaceAll("ü", "ue").replaceAll("ß", "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ----------------------------------------- Taktische Einheiten (§ 2 Abs. 2)

/** Ein Personal-Sollplatz. */
interface PlatzSpec {
  rolle: R;
  funktion: string;
  anzahl?: number;
  /** Ausbildungslehrgang nach § 8 als Zusatzqualifikation. */
  quali?: string;
  /** erzwungene Fahrerlaubnis. */
  fe?: FE;
}

const F = R.FUEHRER;
const U = R.UNTERFUEHRER;
const M = R.MANNSCHAFT;

const AGT = "Atemschutzgeräteträger";
const MASCHINIST = "Maschinist";
const SPRECHFUNKER = "Sprechfunker";

/** Zusatz „(1. Gruppe)" o. Ä., wenn eine Einheit mehrfach im Zug vorkommt. */
function mit(funktion: string, zusatz: string): string {
  return zusatz ? `${funktion} (${zusatz})` : funktion;
}

/**
 * Selbständiger Trupp (§ 2 Abs. 2 Satz 1 Nr. 1): Truppführung, Maschinist und
 * eine weitere einsatzspezifische Funktion — 3 Funktionen.
 */
function selbstaendigerTrupp(fuehrung: R, zusatz = ""): PlatzSpec[] {
  return [
    { rolle: fuehrung, funktion: mit("Truppführer/-in", zusatz), quali: AGT },
    { rolle: M, funktion: mit("Maschinist/-in", zusatz), quali: MASCHINIST, fe: FE.C },
    { rolle: M, funktion: mit("Truppmitglied", zusatz), quali: AGT },
  ];
}

/**
 * Staffel (§ 2 Abs. 2 Satz 1 Nr. 2): Staffelführung, Maschinist, zwei
 * Truppführungen und zwei weitere einsatzspezifische Funktionen — 6 Funktionen.
 */
function staffel(fuehrung: R, zusatz = ""): PlatzSpec[] {
  return [
    { rolle: fuehrung, funktion: mit("Staffelführer/-in", zusatz) },
    { rolle: M, funktion: mit("Maschinist/-in", zusatz), quali: MASCHINIST, fe: FE.C },
    { rolle: U, funktion: mit("Truppführer/-in", zusatz), anzahl: 2, quali: AGT },
    { rolle: M, funktion: mit("Truppmitglied", zusatz), anzahl: 2, quali: AGT },
  ];
}

/**
 * Gruppe (§ 2 Abs. 2 Satz 1 Nr. 3) — die taktische Grundeinheit der Feuerwehr:
 * Gruppenführung, Maschinist, Melder, drei Truppführungen und drei weitere
 * einsatzspezifische Funktionen — 9 Funktionen.
 */
function gruppe(fuehrung: R, zusatz = ""): PlatzSpec[] {
  return [
    { rolle: fuehrung, funktion: mit("Gruppenführer/-in", zusatz) },
    { rolle: M, funktion: mit("Maschinist/-in", zusatz), quali: MASCHINIST, fe: FE.C },
    { rolle: M, funktion: mit("Melder/-in", zusatz), quali: SPRECHFUNKER },
    { rolle: U, funktion: mit("Truppführer/-in", zusatz), anzahl: 3, quali: AGT },
    { rolle: M, funktion: mit("Truppmitglied", zusatz), anzahl: 3, quali: AGT },
  ];
}

/**
 * Zug (§ 2 Abs. 2 Satz 2): Zugführung, Zugtrupp (Führungsassistenz, Melder,
 * Fahrer) und je Variante die Teileinheiten — in jeder Variante 22 Funktionen.
 *  Variante 1: zwei Gruppen
 *  Variante 2: eine Gruppe, eine Staffel und ein Selbständiger Trupp
 *  Variante 3: eine Gruppe und drei Selbständige Trupps
 */
function zug(variante: 1 | 2 | 3): PlatzSpec[] {
  const zugtrupp: PlatzSpec[] = [
    { rolle: F, funktion: "Zugführer/-in" },
    { rolle: U, funktion: "Führungsassistent/-in (Zugtrupp)", quali: SPRECHFUNKER },
    { rolle: M, funktion: "Melder/-in (Zugtrupp)", quali: SPRECHFUNKER },
    { rolle: M, funktion: "Fahrer/-in (Zugtrupp)", fe: FE.C },
  ];
  switch (variante) {
    case 1:
      return [...zugtrupp, ...gruppe(U, "1. Gruppe"), ...gruppe(U, "2. Gruppe")];
    case 2:
      return [...zugtrupp, ...gruppe(U, "Gruppe"), ...staffel(U, "Staffel"), ...selbstaendigerTrupp(U, "Sel. Trupp")];
    case 3:
      return [
        ...zugtrupp,
        ...gruppe(U, "Gruppe"),
        ...selbstaendigerTrupp(U, "1. Sel. Trupp"),
        ...selbstaendigerTrupp(U, "2. Sel. Trupp"),
        ...selbstaendigerTrupp(U, "3. Sel. Trupp"),
      ];
  }
}

/**
 * Personelle Mindeststärke einer Ortsfeuerwehr (§ 3 Abs. 2): Ortsbrandmeisterin
 * oder Ortsbrandmeister, Stellvertretung, die Funktionen der maßgeblichen
 * taktischen Einheiten und eine Personalreserve von 100 vom Hundert, bezogen
 * auf die zu besetzenden Funktionen.
 */
function ortsfeuerwehr(einheiten: PlatzSpec[]): PlatzSpec[] {
  const reserve = einheiten.map((p) => ({ ...p, funktion: `${p.funktion} — Personalreserve` }));
  return [
    { rolle: F, funktion: "Ortsbrandmeister/-in" },
    { rolle: F, funktion: "stellv. Ortsbrandmeister/-in" },
    ...einheiten,
    ...reserve,
  ];
}

// --------------------------------------------------------------- Bogen-Specs

interface BogenSpec {
  /** Familie für README und Landesvorlagen-Gruppierung. */
  familie: "Taktische Einheit" | "Ortsfeuerwehr";
  quelle: string;
  /** Einheitstyp-Freitext = Anzeigename, auch als Landesvorlage. */
  einheit: string;
  /** Soll-Gesamtstärke aus der Verordnung — wird am Ende geprüft. */
  soll: number;
  personal: PlatzSpec[];
  fahrzeuge: FzTyp[];
  szenario: string; // {ort} und {gemeinde} werden ersetzt
  sonstiges?: string;
}

const SPECS: BogenSpec[] = [
  // ------------------------------------- Taktische Einheiten (§ 2 Abs. 2)
  {
    familie: "Taktische Einheit",
    quelle: "§ 2 Abs. 2 Satz 1 Nr. 1, § 4 Abs. 3 Satz 1 Nr. 2 Buchst. a",
    einheit: "Selbständiger Trupp",
    soll: 3,
    personal: selbstaendigerTrupp(F),
    fahrzeuge: [FZ.TLF2000],
    szenario: "Überörtliche Hilfe {ort} — Löschwasserversorgung im Pendelverkehr",
  },
  {
    familie: "Taktische Einheit",
    quelle: "§ 2 Abs. 2 Satz 1 Nr. 2, § 4 Abs. 3 Satz 1 Nr. 3",
    einheit: "Staffel",
    soll: 6,
    personal: staffel(F),
    fahrzeuge: [FZ.MLF],
    szenario: "Überörtliche Hilfe {ort} — Menschenrettung und Brandbekämpfung",
  },
  {
    familie: "Taktische Einheit",
    quelle: "§ 2 Abs. 2 Satz 1 Nr. 3, § 4 Abs. 3 Satz 1 Nr. 1",
    einheit: "Gruppe",
    soll: 9,
    personal: gruppe(F),
    fahrzeuge: [FZ.LF10],
    szenario: "Überörtliche Hilfe {ort} — Menschenrettung und Brandbekämpfung",
  },
  {
    familie: "Taktische Einheit",
    quelle: "§ 2 Abs. 2 Satz 2, § 4 Abs. 4 Satz 1 Nr. 1",
    einheit: "Zug (Variante 1: zwei Gruppen)",
    soll: 22,
    personal: zug(1),
    fahrzeuge: [FZ.ELW1, FZ.LF20, FZ.LF20],
    szenario: "Überörtliche Hilfe {ort} — Löschzug im Einsatzabschnitt",
    sonstiges:
      "Gerätesatz zur Durchführung der technischen Hilfeleistung nach § 4 Abs. 4 Satz 2 Nds. FwVO verlastet.",
  },
  {
    familie: "Taktische Einheit",
    quelle: "§ 2 Abs. 2 Satz 2 Nr. 2 Buchst. b, § 4 Abs. 4 Satz 1 Nr. 2",
    einheit: "Zug (Variante 2: Gruppe, Staffel und Selbständiger Trupp)",
    soll: 22,
    personal: zug(2),
    fahrzeuge: [FZ.ELW1, FZ.LF20, FZ.STLF20, FZ.DLK23],
    szenario: "Überörtliche Hilfe {ort} — Löschzug mit Hubrettungsfahrzeug",
    sonstiges:
      "Gerätesatz zur Durchführung der technischen Hilfeleistung nach § 4 Abs. 4 Satz 2 Nds. FwVO verlastet.",
  },
  {
    familie: "Taktische Einheit",
    quelle: "§ 2 Abs. 2 Satz 2 Nr. 2 Buchst. c, § 4 Abs. 4 Satz 1 Nr. 3",
    einheit: "Zug (Variante 3: Gruppe und drei Selbständige Trupps)",
    soll: 22,
    personal: zug(3),
    fahrzeuge: [FZ.ELW1, FZ.LF20, FZ.TLF4000, FZ.DLK23, FZ.WLF, FZ.AB_RUEST],
    szenario: "Überörtliche Hilfe {ort} — Löschzug mit Sonderfahrzeugen",
    sonstiges:
      "Gerätesatz zur Durchführung der technischen Hilfeleistung nach § 4 Abs. 4 Satz 2 Nds. FwVO auf dem Abrollbehälter.",
  },

  // ------------------------------- Arten von Ortsfeuerwehren (§§ 1, 3, 4)
  {
    familie: "Ortsfeuerwehr",
    quelle: "§ 1 Abs. 1 Nr. 1, § 3 Abs. 1 Nr. 1 und Abs. 2, § 4 Abs. 2",
    einheit: "Grundausstattungsfeuerwehr",
    soll: 20, // 2 + 9 Funktionen + 9 Personalreserve
    personal: ortsfeuerwehr(gruppe(U)),
    fahrzeuge: [FZ.TSF],
    szenario: "Brandschutz und Hilfeleistung im Ortsteil {ort}",
  },
  {
    familie: "Ortsfeuerwehr",
    quelle: "§ 1 Abs. 1 Nr. 2, § 3 Abs. 1 Nr. 2 Buchst. a und Abs. 2, § 4 Abs. 3 Satz 1 Nr. 1 und 2 Buchst. c",
    einheit: "Stützpunktfeuerwehr (Gruppe und Selbständiger Trupp)",
    soll: 26, // 2 + 12 Funktionen + 12 Personalreserve
    personal: ortsfeuerwehr([...gruppe(U, "Gruppe"), ...selbstaendigerTrupp(U, "Sel. Trupp")]),
    fahrzeuge: [FZ.LF10, FZ.RW],
    szenario: "Überörtlicher Brandschutz für {gemeinde} — Stützpunkt {ort}",
  },
  {
    familie: "Ortsfeuerwehr",
    quelle: "§ 1 Abs. 1 Nr. 2, § 3 Abs. 1 Nr. 2 Buchst. b und Abs. 2, § 4 Abs. 3 Satz 1 Nr. 3",
    einheit: "Stützpunktfeuerwehr (zwei Staffeln)",
    soll: 26, // 2 + 12 Funktionen + 12 Personalreserve
    personal: ortsfeuerwehr([...staffel(U, "1. Staffel"), ...staffel(U, "2. Staffel")]),
    fahrzeuge: [FZ.MLF, FZ.MLF],
    szenario: "Überörtlicher Brandschutz für {gemeinde} — Stützpunkt {ort}",
    sonstiges:
      "Bei einem der beiden Löschfahrzeuge ist nach § 4 Abs. 3 Satz 3 Nds. FwVO auf den Löschwasserbehälter verzichtet; die Zuladung trägt das hydraulische Rettungsgerät.",
  },
  {
    familie: "Ortsfeuerwehr",
    quelle: "§ 1 Abs. 1 Nr. 3, § 3 Abs. 1 Nr. 3 und Abs. 2, § 4 Abs. 4 Satz 1 Nr. 1",
    einheit: "Schwerpunktfeuerwehr (Zug, Variante 1)",
    soll: 46, // 2 + 22 Funktionen + 22 Personalreserve
    personal: ortsfeuerwehr(zug(1)),
    fahrzeuge: [FZ.ELW1, FZ.LF20, FZ.LF20],
    szenario: "Überörtlicher Brandschutz für {gemeinde} — Schwerpunkt {ort}",
    sonstiges:
      "Gerätesatz zur Durchführung der technischen Hilfeleistung nach § 4 Abs. 4 Satz 2 Nds. FwVO vorgehalten.",
  },
  {
    familie: "Ortsfeuerwehr",
    quelle: "§ 1 Abs. 1 Nr. 3, § 3 Abs. 1 Nr. 3 und Abs. 2, § 4 Abs. 4 Satz 1 Nr. 2",
    einheit: "Schwerpunktfeuerwehr (Zug, Variante 2)",
    soll: 46,
    personal: ortsfeuerwehr(zug(2)),
    fahrzeuge: [FZ.ELW1, FZ.LF20, FZ.GWL2, FZ.RW],
    szenario: "Überörtlicher Brandschutz für {gemeinde} — Schwerpunkt {ort}",
    sonstiges:
      "Staffelbesetztes Fahrzeug nach § 4 Abs. 4 Satz 1 Nr. 2 Buchst. b als Gerätewagen (Typ 5.3); Gerätesatz technische Hilfeleistung nach Satz 2 vorgehalten.",
  },
  {
    familie: "Ortsfeuerwehr",
    quelle: "§ 1 Abs. 1 Nr. 3, § 3 Abs. 1 Nr. 3 und Abs. 2, § 4 Abs. 4 Satz 1 Nr. 3",
    einheit: "Schwerpunktfeuerwehr (Zug, Variante 3)",
    soll: 46,
    personal: ortsfeuerwehr(zug(3)),
    fahrzeuge: [FZ.ELW1, FZ.LF20, FZ.TLF4000, FZ.DLK23, FZ.WLF, FZ.AB_RUEST],
    szenario: "Überörtlicher Brandschutz für {gemeinde} — Schwerpunkt {ort}",
    sonstiges:
      "Drei Fahrzeuge mit Truppbesatzung nach § 4 Abs. 4 Satz 1 Nr. 3 Buchst. b; Gerätesatz technische Hilfeleistung nach Satz 2 auf dem Abrollbehälter.",
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
  const g = wuerfel(0.22) ? G.W : G.M;
  const { vorname, nachname } = neuerName(g);
  const fe =
    spec.fe ??
    (spec.rolle !== R.MANNSCHAFT
      ? gewichtet<FE>([[FE.C, 4], [FE.CE, 2], [FE.C1, 2], [FE.B, 3]])
      : gewichtet<FE>([[FE.B, 7], [FE.C1, 2], [FE.C, 2], [FE.CE, 1], [FE.NONE, 3]]));
  const person: Person = {
    vorname,
    nachname,
    staerkeRolle: spec.rolle,
    funktionen: [{ freitext: spec.funktion }],
    fahrerlaubnis: fe,
    geschlecht: g,
    ernaehrung: gewichtet<E>([[E.FLEISCH, 80], [E.VEGETARISCH, 14], [E.VEGAN, 6]]),
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
      wert: fakeTelefon(`01${ganz(5, 7)}${ganz(1, 9)}${String(ganz(0, 9999999)).padStart(7, "0")}`),
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
  // Die zweite Führungskraft (Stellvertretung bzw. erste Teileinheitsführung)
  // ist zu 70 % über Mobilfunk erreichbar.
  const zweite = personen.filter((p) => p.staerkeRolle !== R.MANNSCHAFT)[1];
  if (zweite && zweite.kontakte.length === 0 && wuerfel(0.7)) {
    zweite.kontakte.push({
      art: KontaktArt.MOBIL,
      dienstlich: false,
      wert: fakeTelefon(`01${ganz(5, 7)}${ganz(1, 9)}${String(ganz(0, 9999999)).padStart(7, "0")}`),
    });
  }
  return personen;
}

let laufendeNummer = 1;
function kennzeichen(kfz: string): string {
  return `${kfz}-FW ${1000 + (laufendeNummer++ % 9000)}`;
}

function fahrzeugeBauen(typen: FzTyp[], ort: OrtsFw): Fahrzeug[] {
  const belegt = new Map<number, number>(); // Fahrzeugkennung → nächste Ordnungskennung
  const oertl = gemeindeKennung(ort);
  const region = ohneRechtsform(ort.landkreis);
  return typen.map((t) => {
    const fz: Fahrzeug = { typ: { freitext: t.kurz }, aenderungen: t.lang };
    fz.kennzeichen = t.ohneKennzeichen ?? kennzeichen(ort.kfz);
    if (t.kennung != null) {
      // Ordnungskennung (Block 4.3): lfd. Nr. je gleicher Fahrzeugkennung; die 1
      // wird auch bei nur einem Fahrzeug gesprochen (Nr. 4.2.5.3).
      const ordnung = (belegt.get(t.kennung) ?? 0) + 1;
      belegt.set(t.kennung, ordnung);
      fz.funkrufname = {
        kennwort: { code: KENNWORT_FLORIAN },
        eigenerStandort: false,
        ort: region,
        teile: [oertl, t.kennung, ordnung],
      };
    }
    return fz;
  });
}

interface BeispielBogen {
  datei: string;
  bogen: Erfassungsbogen;
  ort: OrtsFw;
  spec: BogenSpec;
}

function bogenBauen(spec: BogenSpec, ort: OrtsFw): BeispielBogen {
  const personal = personalBauen(spec.personal);
  const fahrzeuge = fahrzeugeBauen(spec.fahrzeuge, ort);

  // Ortsfeuerwehr → Gemeinde/Stadt → Landkreis (FEUERWEHR_HIERARCHIE_EBENEN:
  // Code 1 = Gemeinde/Stadt, Code 2 = Landkreis/kreisfreie Stadt).
  const hierarchie: HierarchieEbene[] = [
    { bezeichnung: { freitext: "Ortsfeuerwehr" }, name: ort.ortsfeuerwehr },
    { bezeichnung: { code: 1 }, name: ohneRechtsform(ort.gemeinde) },
    { bezeichnung: { code: 2 }, name: ohneRechtsform(ort.landkreis) },
  ];

  const tag = datumAusIso("2026-07-20") + ganz(0, 3);
  const stand = tag * MINUTEN_JE_TAG + ganz(6, 21) * 60 + ganz(0, 59);
  const dauer = spec.familie === "Ortsfeuerwehr" ? 0 : ganz(1, 3);
  const diesel = fahrzeuge.reduce((s, fz) => s + dieselFuer(fz.typ.freitext ?? ""), 0);

  const bogen: Erfassungsbogen = {
    schemaVersion: SCHEMA_VERSION,
    uebung: true, // Beispielbogen: als Übung gekennzeichnet (Störer, PDF-Wasserzeichen)
    stand,
    einheit: {
      organisation: OrganisationsTyp.FEUERWEHR,
      organisationName: `Freiwillige Feuerwehr ${ohneRechtsform(ort.gemeinde)}`,
      einheitsTyp: { freitext: spec.einheit },
      hierarchie,
    },
    einsatz: {
      zeitraumVon: tag,
      zeitraumBis: tag + dauer,
      ortAuftrag: spec.szenario.replaceAll("{ort}", ort.ortsfeuerwehr).replaceAll("{gemeinde}", ort.gemeinde),
    },
    personalErfassung: PersonalErfassung.VOLLSTAENDIG,
    personal,
    fahrzeuge,
    sofortbedarf: {
      verpflegungPersonen: personal.length,
      dieselLiter: diesel,
      benzinLiter: 0,
      gemischLiter: 0,
      unterbringung: dauer >= 2 && wuerfel(0.6),
      ruhezeitErforderlich: wuerfel(0.3),
    },
    ...(spec.sonstiges ? { sonstiges: spec.sonstiges } : {}),
  };

  return { datei: `${slug(spec.einheit)}-${slug(ort.ortsfeuerwehr)}`, bogen, ort, spec };
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

/** QR-Roundtrip: Payload (ggf. aus Segmenten zusammengesetzt) → Bogen dekodierbar. */
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

// ---------------------------------------------------------------- Hauptlauf

// Jede Einheit an eine andere Ortsfeuerwehr setzen (deterministisch gestreut).
const beispiele: BeispielBogen[] = SPECS.map((spec, i) => bogenBauen(spec, ORTE[(i * 3 + 1) % ORTE.length]!));

// Soll-Stärken der Verordnung prüfen, bevor irgendwas geschrieben wird.
for (const b of beispiele) {
  if (b.bogen.personal.length !== b.spec.soll) {
    throw new Error(`${b.datei}: ${b.bogen.personal.length} Funktionen ≠ Soll ${b.spec.soll} (${b.spec.quelle})`);
  }
}

const ausgabe = join(wurzel, "examples", "feuerwehr", "niedersachsen");
mkdirSync(ausgabe, { recursive: true });
for (const datei of readdirSync(ausgabe)) {
  if (datei.endsWith(".json")) rmSync(join(ausgabe, datei));
}

let segmentierte = 0;
for (const bsp of beispiele) {
  const qr = await qrSatz(bsp.bogen);
  roundtrip(qr, bsp.bogen.personal.length, bsp.datei);
  if (qr.segmentiert) segmentierte++;
  writeFileSync(join(ausgabe, `${bsp.datei}.json`), JSON.stringify(bsp.bogen, null, 2) + "\n");
}

// Übersichtstabelle für die README.
const zeilen = beispiele.map((b) => {
  const s = staerke(b.bogen);
  const fz = b.bogen.fahrzeuge.map((f) => f.typ.freitext).join(", ");
  return `| ${b.datei} | ${b.spec.familie} | ${b.spec.einheit} | ${b.ort.ortsfeuerwehr} (${b.ort.gemeinde}) | ${s.fuehrer}/${s.unterfuehrer}/${s.mannschaft}/${s.gesamt} | ${fz} | ${b.spec.quelle} |`;
});
writeFileSync(
  join(ausgabe, "README.md"),
  `# Beispiel-Erfassungsbögen — Feuerwehren Niedersachsen (Nds. FwVO)

${beispiele.length} generierte Beispiel-Einheiten nach der **Niedersächsischen
Feuerwehrverordnung** (Nds. FwVO vom 08.04.2025). Abgebildet sind zwei Familien:

- **Taktische Einheiten (§ 2 Abs. 2)** — Selbständiger Trupp, Staffel, Gruppe und
  der Zug in allen drei Varianten, jeweils mit dem zur Besatzung passenden
  Feuerwehrfahrzeug nach Anlage 1. Das ist die Einheit, die ausrückt oder
  überörtliche Hilfe leistet.
- **Arten von Ortsfeuerwehren (§ 1 Abs. 1)** — Grundausstattungs-, Stützpunkt- und
  Schwerpunktfeuerwehr mit der **personellen Mindeststärke nach § 3 Abs. 2**
  (Ortsbrandmeisterin oder Ortsbrandmeister, Stellvertretung, die Funktionen der
  maßgeblichen taktischen Einheit und 100 % Personalreserve) sowie der
  **Mindestausrüstung nach § 4**.

Die Stärkerolle folgt der Stellung in der Einheit, nicht der höchsten Ausbildung:
Führung der Einheit → F, Truppführungen und Teileinheitsführungen im Zug → U,
alle weiteren einsatzspezifischen Funktionen → M.

Alle Personen, die Zuordnung der Einheiten zu Ortsfeuerwehren und die Kennzeichen
sind **fiktiv**; die Ortsfeuerwehren liegen in Gemeinden ohne Berufsfeuerwehr, für
die §§ 1, 3 und 4 gelten. Die Funkrufnamen folgen dem OPTA-Schema Niedersachsen
(RdErl. MI v. 01.03.2024, Nds. MBl. 2024 Nr. 125): „Florian <Landkreis>
<örtl. Kennung>/<Fahrzeugkennung>/<Ordnungskennung>". Die örtlichen Kennungen
(Gemeindekennziffern) sind fiktiv; die Fahrzeugkennungen folgen derselben
Systematik wie in den KatS-Beispielen.

Die Kurzbezeichnungen der Fahrzeuge (LF 10, MLF, StLF 20 …) sind die in der Praxis
gebräuchlichen; der Typ nach Anlage 1 samt Mindestausstattung steht bei jedem
Fahrzeug im Feld „Änderungen bzw. Sondergerät".

Neu erzeugen mit: \`npm run beispiele:fw-nds\` (deterministisch, fester Zufalls-Seed).

| Datei | Familie | Einheit | Ortsfeuerwehr | Stärke F/U/M/Σ | Fahrzeuge | Fundstelle Nds. FwVO |
|---|---|---|---|---|---|---|
${zeilen.join("\n")}
`,
);

console.log(`Fertig: ${beispiele.length} Beispielbögen in examples/feuerwehr/niedersachsen/ (+ README.md)`);
console.log(`Segmentierte QR: ${segmentierte}`);
for (const b of beispiele) {
  const s = staerke(b.bogen);
  console.log(`  ${b.spec.einheit}: ${s.fuehrer}/${s.unterfuehrer}/${s.mannschaft}/${s.gesamt} (Soll ${b.spec.soll})`);
}
