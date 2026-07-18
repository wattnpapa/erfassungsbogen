/**
 * Erzeugt Beispiel-Erfassungsbögen der Starkeinheiten des Katastrophenschutzes
 * Niedersachsen (KatS-StAN NDS, Fassung 2023/2025 des NLBK) als JSON nach
 * examples/katastrophenschutz/niedersachsen/. Abgelegt ist nur das Bogen-JSON;
 * die PDF entsteht erst beim Anklicken in der App aus dem aktuellen Layout.
 *
 * Aufruf (Node ≥ 22): npm run beispiele:kats
 *
 * Grundlage sind die vom Nutzer bereitgestellten StAN-PDFs. Abgebildet wird je
 * kleinster selbstständiger Teileinheit (Gruppe/Trupp/Staffel/Geräteeinheit) ein
 * Bogen; Fachzüge und der Sanitäts- und Betreuungszug sind in ihre Teileinheiten
 * zerlegt. Die Träger (und damit Funkruf-Kennwort und Organisation) sind je nach
 * Fachdienst realistisch gestreut: Feuerwehr (Florian) für Brandschutz, Fachzüge,
 * GFFF-V, Logistik/Technik und Geräteeinheiten; DRK (Rotkreuz), JUH (Akkon),
 * MHD (Johannes) und ASB (Sama) für Sanitäts-, Betreuungs- und PSNV-Einheiten;
 * DLRG (Pelikan) für die Wasserrettung.
 *
 * Fiktiv sind alle Personen, Orte-Zuordnungen, Kennzeichen und Funkrufnamen. Für
 * Funkrufnamen gibt es in der KatS-StAN NDS kein einheitliches Kennzahlensystem;
 * die verwendeten Kennzahlen sind daher nur illustrativ.
 *
 * Am Ende läuft eine Selbstprüfung (QR-Roundtrip je Bogen); die README im
 * Zielordner bekommt eine Übersichtstabelle.
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
  Funkrufname,
  Geschlecht as G,
  HierarchieEbene,
  KontaktArt,
  OrganisationsTyp,
  Person,
  PersonalErfassung,
  SCHEMA_VERSION,
  StaerkeRolle as R,
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
const rnd = prng(20230417);

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
] as const;
const VORNAMEN_W = [
  "Anja", "Anna", "Antje", "Birgit", "Carina", "Christina", "Claudia", "Diana",
  "Franziska", "Hanna", "Ines", "Jana", "Julia", "Katharina", "Katrin", "Kerstin",
  "Laura", "Lea", "Lena", "Lisa", "Maren", "Marie", "Melanie", "Miriam",
  "Nadine", "Nicole", "Sabine", "Sandra", "Sarah", "Silke", "Sonja", "Stefanie",
  "Svenja", "Tanja", "Ulrike", "Vanessa", "Verena",
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
] as const;

/** Externe/Berufs-Qualifikationen (Freitext) — gelegentlich gestreut. */
const QUALI_POOL = [
  "Berufskraftfahrer (Beruf)",
  "Rettungssanitäter (extern)",
  "Elektrofachkraft (Beruf)",
  "Koch (Beruf)",
  "Landwirt — Erfahrung Großgeräte",
  "Motorsägenschein AS Baum I (extern)",
  "Funkamateur (extern)",
  "Gesundheits- und Krankenpfleger (Beruf)",
] as const;

// ------------------------------------------------------ Niedersachsen: Orte

interface NdsOrt {
  ort: string;
  landkreis: string;
  kfz: string;
}

/** Standorte (Ort → untere Katastrophenschutzbehörde) quer durch Niedersachsen. */
const NDS_ORTE: NdsOrt[] = [
  { ort: "Cuxhaven", landkreis: "Landkreis Cuxhaven", kfz: "CUX" },
  { ort: "Stade", landkreis: "Landkreis Stade", kfz: "STD" },
  { ort: "Buxtehude", landkreis: "Landkreis Stade", kfz: "STD" },
  { ort: "Winsen (Luhe)", landkreis: "Landkreis Harburg", kfz: "WL" },
  { ort: "Lüneburg", landkreis: "Landkreis Lüneburg", kfz: "LG" },
  { ort: "Uelzen", landkreis: "Landkreis Uelzen", kfz: "UE" },
  { ort: "Celle", landkreis: "Landkreis Celle", kfz: "CE" },
  { ort: "Soltau", landkreis: "Heidekreis", kfz: "HK" },
  { ort: "Verden (Aller)", landkreis: "Landkreis Verden", kfz: "VER" },
  { ort: "Rotenburg (Wümme)", landkreis: "Landkreis Rotenburg (Wümme)", kfz: "ROW" },
  { ort: "Nienburg (Weser)", landkreis: "Landkreis Nienburg", kfz: "NI" },
  { ort: "Diepholz", landkreis: "Landkreis Diepholz", kfz: "DH" },
  { ort: "Osnabrück", landkreis: "Landkreis Osnabrück", kfz: "OS" },
  { ort: "Lingen (Ems)", landkreis: "Landkreis Emsland", kfz: "EL" },
  { ort: "Meppen", landkreis: "Landkreis Emsland", kfz: "EL" },
  { ort: "Papenburg", landkreis: "Landkreis Emsland", kfz: "EL" },
  { ort: "Nordhorn", landkreis: "Landkreis Grafschaft Bentheim", kfz: "NOH" },
  { ort: "Aurich", landkreis: "Landkreis Aurich", kfz: "AUR" },
  { ort: "Emden", landkreis: "Stadt Emden", kfz: "EMD" },
  { ort: "Leer", landkreis: "Landkreis Leer", kfz: "LER" },
  { ort: "Wittmund", landkreis: "Landkreis Wittmund", kfz: "WTM" },
  { ort: "Jever", landkreis: "Landkreis Friesland", kfz: "FRI" },
  { ort: "Wilhelmshaven", landkreis: "Stadt Wilhelmshaven", kfz: "WHV" },
  { ort: "Brake (Unterweser)", landkreis: "Landkreis Wesermarsch", kfz: "BRA" },
  { ort: "Westerstede", landkreis: "Landkreis Ammerland", kfz: "WST" },
  { ort: "Oldenburg (Oldb)", landkreis: "Stadt Oldenburg", kfz: "OL" },
  { ort: "Delmenhorst", landkreis: "Stadt Delmenhorst", kfz: "DEL" },
  { ort: "Cloppenburg", landkreis: "Landkreis Cloppenburg", kfz: "CLP" },
  { ort: "Vechta", landkreis: "Landkreis Vechta", kfz: "VEC" },
  { ort: "Wolfsburg", landkreis: "Stadt Wolfsburg", kfz: "WOB" },
  { ort: "Gifhorn", landkreis: "Landkreis Gifhorn", kfz: "GF" },
  { ort: "Peine", landkreis: "Landkreis Peine", kfz: "PE" },
  { ort: "Hildesheim", landkreis: "Landkreis Hildesheim", kfz: "HI" },
  { ort: "Hameln", landkreis: "Landkreis Hameln-Pyrmont", kfz: "HM" },
  { ort: "Holzminden", landkreis: "Landkreis Holzminden", kfz: "HOL" },
  { ort: "Northeim", landkreis: "Landkreis Northeim", kfz: "NOM" },
  { ort: "Göttingen", landkreis: "Landkreis Göttingen", kfz: "GÖ" },
  { ort: "Goslar", landkreis: "Landkreis Goslar", kfz: "GS" },
  { ort: "Wolfenbüttel", landkreis: "Landkreis Wolfenbüttel", kfz: "WF" },
  { ort: "Hannover", landkreis: "Region Hannover", kfz: "H" },
  { ort: "Langenhagen", landkreis: "Region Hannover", kfz: "H" },
];

// ------------------------------------------------------ Träger / Kennwörter

/** FUNKRUF_KENNWOERTER-Codes (src/vokabulare/thw.ts). */
const KW = { FLORIAN: 2, ROTKREUZ: 3, AKKON: 4, JOHANNES: 5, SAMA: 6, PELIKAN: 7 } as const;

interface Traeger {
  org: OrganisationsTyp;
  kennwort: number;
  organisationName: (o: NdsOrt) => string;
  /** Bezeichnung der oberen Hierarchie-Ebene (Kreis-/Ortsverband bzw. Landkreis). */
  ebene: (o: NdsOrt) => HierarchieEbene[];
  /** Örtliche- bzw. Organisationskennung (OPTA Nr. 2.5, Block 4.1 Ziffern 9–10). */
  oertlKennung: (o: NdsOrt) => number;
}

// Deterministische, aber fiktive Gemeindekennziffer (OPTA Nr. 2.5): kreisfreie
// Städte 01–09, sonst Gemeindekennziffern 10–39.
function gemeindeKennung(o: NdsOrt): number {
  let h = 0;
  for (const c of o.ort) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const kreisfrei = o.landkreis.startsWith("Stadt ");
  return kreisfrei ? (h % 9) + 1 : (h % 30) + 10;
}

const feuerwehr: Traeger = {
  org: OrganisationsTyp.FEUERWEHR,
  kennwort: KW.FLORIAN,
  organisationName: (o) => `Feuerwehr ${o.landkreis}`,
  ebene: (o) => [{ bezeichnung: { freitext: "Untere KatS-Behörde" }, name: o.landkreis }],
  oertlKennung: gemeindeKennung,
};
function hiorg(
  org: OrganisationsTyp,
  kennwort: number,
  kurz: string,
  lang: string,
  // Organisationskennung nach OPTA Nr. 2.5 (DRK 40–48, JUH 49–56, MHD 57–63,
  // ASB 64–70, DLRG 71–77).
  orgKennung: number,
): Traeger {
  return {
    org,
    kennwort,
    organisationName: (o) => `${lang} ${o.landkreis}`,
    ebene: (o) => [
      { bezeichnung: { freitext: `${kurz}-Kreisverband` }, name: landkreisFunk(o.landkreis) },
      { bezeichnung: { freitext: "Untere KatS-Behörde" }, name: o.landkreis },
    ],
    oertlKennung: () => orgKennung,
  };
}
const drk = hiorg(OrganisationsTyp.DRK, KW.ROTKREUZ, "DRK", "Deutsches Rotes Kreuz", 40);
const juh = hiorg(OrganisationsTyp.JUH, KW.AKKON, "JUH", "Johanniter-Unfall-Hilfe", 49);
const mhd = hiorg(OrganisationsTyp.MHD, KW.JOHANNES, "MHD", "Malteser Hilfsdienst", 57);
const asb = hiorg(OrganisationsTyp.ASB, KW.SAMA, "ASB", "Arbeiter-Samariter-Bund", 65);
const dlrg = hiorg(OrganisationsTyp.DLRG, KW.PELIKAN, "DLRG", "DLRG", 75);

// ------------------------------------------------- Funkrufnamen (OPTA NDS)
//
// Funkrufname nach OPTA-RdErl. MI Niedersachsen v. 01.03.2024 (Nds. MBl. 2024
// Nr. 125): „<Rufname> <Landkreis> <örtl./Org.-Kennung>/<Fahrzeugkennung>/
// <Ordnungskennung>". Rufname = Kennwort (Anlage 1), Landkreis = regionale
// Zuordnung (Nr. 4.2.2), örtl./Org.-Kennung nach Nr. 2.5, Fahrzeugkennung nach
// Anlage 2, Ordnungskennung nach Block 4.3 (lfd. Nr. je gleicher Kennung).

/** Fahrzeug-/Funktionskennung (Anlage 2, Ziffern 12–13) je Fahrzeug-Kurz. */
const FZ_KENNUNG: Record<string, number> = {
  "FüKW": 12, // Führungskraftwagen (KatS)
  "KdoW": 10, // Kommandowagen
  "KdoW GFFF-V": 10,
  "ELW 1": 11, // Einsatzleitwagen 1
  "ZTrKW": 11, // Zugtruppkraftwagen (KatS)
  "Kombi UAV": 15, // Kombinationskraftwagen UAV
  "Kombi-L": 60, // Kombinationskraftwagen Logistik
  "MTW": 17, // Mannschaftstransportwagen
  "MTW Vpf": 16, // MTW Betreuung/PSNV/Verpflegung
  "MTW Bt": 16,
  "MTWm": 99, // MTW multifunktional
  "Krad": 79, // sonstige Fahrzeuge (Krad)
  "KOM": 18, // Kraftomnibus
  "TSF": 40, // Tragkraftspritzenfahrzeug
  "TLF 3000": 21, // TLF ≤3000 l mit Truppbesatzung
  "CCFM 3000 Niedersachsen": 29, // sonstiges Tank-/Sonderlöschfahrzeug (CCFM)
  "LF KatS": 44, // Löschgruppenfahrzeug Katastrophenschutz
  "RW": 52, // Rüstwagen
  "GW San": 96, // Gerätewagen Sanität
  "GW Bt": 74, // Gerätewagen Betreuung
  "GW Vpf": 76, // Gerätewagen Verpflegung/Kühl
  "GW WR": 58, // Gerätewagen Wasserrettung
  "GW StrR": 58, // Gerätewagen Strömungsrettung
  "GW GFFF-V": 68, // Gerätewagen Logistik groß (Wasserentnahme)
  "GW L gr": 68, // Gerätewagen Logistik groß (KatS)
  "GW L kl": 64, // Gerätewagen Logistik klein (KatS)
  "GW-L1 BtrMt": 64, // Gerätewagen Logistik 1
  "GW-L1 Vpf": 64,
  "GW-L2 Vers": 68, // Gerätewagen Logistik 2
  "GW-L2 HFS": 68,
  "GW-L2": 68,
  "GW-L2 SW": 62, // GW Logistik Schlauch ≥2000 m / SW-KatS
  "KTW": 92, // Krankentransportwagen
  "WLF": 66, // Wechselladerfahrzeug 6500 (26 t)
  "NEA 250": 55, // Gerätewagen Strom-/Elektroversorgung (Netzersatz)
  "TB Ks": 69, // sonstiges Versorgungs-/Logistikfahrzeug (Tankfahrzeug)
  "Zugfahrzeug": 69,
  "Transportfahrzeug": 69,
};
function fzKennung(kurz: string): number | undefined {
  return FZ_KENNUNG[kurz];
}

/** Regionale Zuordnung (Nr. 4.2.2): Name des Landkreises / der kreisfreien Stadt. */
function landkreisFunk(landkreis: string): string {
  return landkreis.replace(/^(Landkreis|Stadt|Region)\s+/, "");
}

// ------------------------------------------------- Fahrzeuge: Hilfstabellen

/** Diesel-Sofortbedarf je Fahrzeug-Kurzbezeichnung (grobe Richtwerte, Liter). */
function dieselFuer(kurz: string): number {
  if (/^(WLF|KOM|CCFM|TLF)/.test(kurz)) return 120;
  if (/^(LF|GW|SW|FKH|NEA|FüKW|ELW|RW|Kombi-L)/.test(kurz)) return 70;
  if (/^(ZTrKW|KdoW|MTW|Kombi|TSF|KTW|RTW)/.test(kurz)) return 45;
  if (/^Krad/.test(kurz)) return 8;
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

// --------------------------------------------------------------- Bogen-Specs

/** Ein Personal-Sollplatz (aus Abschnitt A der StAN). */
interface PlatzSpec {
  rolle: R;
  funktion: string;
  anzahl: number;
  quali?: string; // Zusatzqualifikation (Freitext), z. B. "Atemschutzgeräteträger"
  fe?: FE; // erzwungene Fahrerlaubnis (z. B. Kraftomnibus → DE)
}

/** Ein Fahrzeug/Anhänger (aus Abschnitt A der StAN). */
interface FzSpec {
  kurz: string; // Kurzbezeichnung, z. B. "LF KatS"
  lang?: string; // Klartext für "Änderungen bzw. Sondergerät"
  anzahl?: number; // Default 1
  ohneFunk?: boolean; // Anhänger, Boote, Abrollbehälter, Geräte → kein Funkrufname
  ohneKennzeichen?: string; // statt Kfz-Kennzeichen ein Freitext (Gerät/Abrollbehälter)
}

interface BogenSpec {
  fachdienst: string;
  quelle: string; // KatS-StAN NDS …
  einheit: string; // einheitsTyp-Freitext
  traeger: Traeger;
  personal: PlatzSpec[];
  fahrzeuge: FzSpec[];
  szenario: string; // {ort} wird ersetzt
  gemisch?: boolean; // Motorsägen/Gemisch-Bedarf
}

const F = R.FUEHRER;
const U = R.UNTERFUEHRER;
const M = R.MANNSCHAFT;

// Wiederkehrende Bausteine (identische Teileinheiten der Fachzüge).
const zugtruppFachzug: PlatzSpec[] = [
  { rolle: F, funktion: "Zugführer/-in" },
  { rolle: U, funktion: "Führungsassistent/-in" },
  { rolle: M, funktion: "Führungshilfspersonal", anzahl: 2 },
];

const SPECS: BogenSpec[] = [
  // ---------------------------------------------------- Führungsdienst (110)
  {
    fachdienst: "Führungsdienst",
    quelle: "KatS-StAN NDS 110/1",
    einheit: "Führungsgruppe (FüGr)",
    traeger: drk,
    personal: [
      { rolle: F, funktion: "Verbandsführer/-in (Leitung)" },
      { rolle: F, funktion: "Verbandsführer/-in S3" },
      { rolle: F, funktion: "Notärztin/Notarzt (medizinische Leitung)", quali: "Notarzt" },
      { rolle: F, funktion: "Verbandsführer/-in S2" },
      { rolle: F, funktion: "Verbandsführer/-in S1/4/6" },
      { rolle: U, funktion: "Zugführer/-in (Lageführung)" },
      { rolle: U, funktion: "Gruppenführer/-in (Dokumentation)" },
      { rolle: M, funktion: "Sprechfunker/-in / Melder/-in", anzahl: 2 },
    ],
    fahrzeuge: [
      { kurz: "FüKW", lang: "Führungskraftwagen" },
      { kurz: "KdoW", lang: "Kommandowagen, geländefähig" },
      { kurz: "Anh Zelt", lang: "Anhänger Zelt (erweiterter Besprechungsraum)", ohneFunk: true, ohneKennzeichen: "Anh Zelt" },
    ],
    szenario: "Führung Verband Behandlungsplatz 50 im Einsatzabschnitt {ort}",
  },
  {
    fachdienst: "Führungsdienst",
    quelle: "KatS-StAN NDS 110/2",
    einheit: "Zugtrupp Wasserrettung (ZTr WR)",
    traeger: dlrg,
    personal: [
      { rolle: F, funktion: "Zugführer/-in" },
      { rolle: U, funktion: "stellv. Zugführer/-in als Zugtruppführer/-in" },
      { rolle: M, funktion: "Sprechfunker/-in / Melder/-in", anzahl: 2 },
    ],
    fahrzeuge: [{ kurz: "ZTrKW", lang: "Zugtruppkraftwagen" }],
    szenario: "Hochwasserlage {ort} — Führung Wasserrettungszug",
  },
  {
    fachdienst: "Führungsdienst",
    quelle: "KatS-StAN NDS 110/3",
    einheit: "Melde- und Lotsentrupp",
    traeger: feuerwehr,
    personal: [{ rolle: M, funktion: "Melder/-in / Lotse", anzahl: 3, fe: FE.A }],
    fahrzeuge: [{ kurz: "Krad", lang: "Kraftrad", anzahl: 3 }],
    szenario: "Flächenlage {ort} — Lotsendienst und Meldewege",
  },
  {
    fachdienst: "Führungsdienst",
    quelle: "KatS-StAN NDS 110/4",
    einheit: "Aufklärungstrupp Luft",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Truppführer/-in" },
      { rolle: M, funktion: "Drohnensteuerer/-in / Luftbeobachter/-in", anzahl: 2, quali: "UAS-Steuerberechtigung" },
    ],
    fahrzeuge: [{ kurz: "Kombi UAV", lang: "Kombinationskraftwagen UAV" }],
    szenario: "Vermisstensuche {ort} — Luftbilderkundung mit UAS",
  },

  // ---------------------------------------------------- Brandschutzdienst (010)
  {
    fachdienst: "Brandschutzdienst",
    quelle: "KatS-StAN NDS 010/2",
    einheit: "Fachmodul Vegetationsbrandbekämpfung",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Maschinist/-in", anzahl: 2 },
      { rolle: M, funktion: "Truppmitglied", anzahl: 6 },
    ],
    fahrzeuge: [
      { kurz: "TSF", lang: "Tragkraftspritzenfahrzeug" },
      { kurz: "WLF", lang: "Wechselladerfahrzeug mit AB Vegetationsbrandbekämpfung (AB VEG)" },
      { kurz: "AB VEG", lang: "Abrollbehälter Vegetationsbrandbekämpfung", ohneFunk: true, ohneKennzeichen: "auf WLF" },
    ],
    szenario: "Vegetationsbrand {ort} — Waldbrandbekämpfung, Wasserförderung",
    gemisch: true,
  },
  {
    fachdienst: "Brandschutzdienst",
    quelle: "KatS-StAN NDS 010/3",
    einheit: "Fachmodul Hochleistungsförderpumpensystem (HFS)",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Maschinist/-in", anzahl: 2 },
      { rolle: M, funktion: "Truppmitglied", anzahl: 6 },
    ],
    fahrzeuge: [
      { kurz: "GW-L2 HFS", lang: "Gerätewagen Logistik 2 mit Beladungssatz HFS" },
      { kurz: "WLF", lang: "Wechselladerfahrzeug mit AB-HFS" },
      { kurz: "AB HFS", lang: "Abrollbehälter Hochleistungsförderpumpensystem", ohneFunk: true, ohneKennzeichen: "auf WLF" },
      { kurz: "MTW", lang: "Mannschaftstransportwagen (optional)" },
    ],
    szenario: "Hochwasser {ort} — großräumige Wasserförderung und Lenzeinsatz",
  },

  // ----------------------------------------------- Feuerwehrbereitschaft (011)
  {
    fachdienst: "Feuerwehrbereitschaft",
    quelle: "KatS-StAN NDS 011/2",
    einheit: "Fachgruppe Versorgung und Eigenschutz",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Maschinist/-in", anzahl: 2 },
      { rolle: M, funktion: "Verpflegungshelfer/-in", anzahl: 3 },
      { rolle: M, funktion: "Truppmitglied", anzahl: 3 },
      { rolle: M, funktion: "Rettungssanitäter/-in", quali: "Rettungssanitäter" },
      { rolle: M, funktion: "Sanitätshelfer/-in" },
    ],
    fahrzeuge: [
      { kurz: "GW-L1 BtrMt", lang: "Gerätewagen Logistik 1 Betriebsmittel (Kraftstoffversorgung)" },
      { kurz: "Anh", lang: "Anhänger für Marschgepäck", ohneFunk: true, ohneKennzeichen: "Anh" },
      { kurz: "GW-L1 Vpf", lang: "Gerätewagen Logistik 1 Verpflegung" },
      { kurz: "Anh Kühl", lang: "Kühlanhänger", ohneFunk: true, ohneKennzeichen: "Anh Kühl" },
      { kurz: "GW-L2 Vers", lang: "Gerätewagen Logistik 2 Versorgung (Unterbringung)" },
      { kurz: "KTW", lang: "Krankentransportwagen (Eigenschutz)" },
    ],
    szenario: "Bereitstellungsraum {ort} — Verpflegung und Eigenschutz der Bereitschaft",
  },
  {
    fachdienst: "Feuerwehrbereitschaft",
    quelle: "KatS-StAN NDS 011/3",
    einheit: "Zugtrupp (Fachzug)",
    traeger: feuerwehr,
    personal: zugtruppFachzug,
    fahrzeuge: [{ kurz: "ELW 1", lang: "Einsatzleitwagen 1" }],
    szenario: "Flächenlage {ort} — Führung Fachzug der Feuerwehrbereitschaft",
  },
  {
    fachdienst: "Feuerwehrbereitschaft",
    quelle: "KatS-StAN NDS 011/3",
    einheit: "Löschgruppe Katastrophenschutz (LG KatS)",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Truppführer/-in", anzahl: 3, quali: "Atemschutzgeräteträger" },
      { rolle: M, funktion: "Truppmitglied", quali: "Atemschutzgeräteträger" },
      { rolle: M, funktion: "Truppmitglied", anzahl: 2 },
      { rolle: M, funktion: "Maschinist/-in" },
      { rolle: M, funktion: "Melder/-in" },
    ],
    fahrzeuge: [{ kurz: "LF KatS", lang: "Löschgruppenfahrzeug Katastrophenschutz" }],
    szenario: "Großbrand {ort} — Brandbekämpfung, Menschenrettung",
  },
  {
    fachdienst: "Feuerwehrbereitschaft",
    quelle: "KatS-StAN NDS 011/3",
    einheit: "Staffel Logistik Schlauch",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Maschinist/-in" },
      { rolle: M, funktion: "Truppmitglied", anzahl: 4 },
    ],
    fahrzeuge: [{ kurz: "GW-L2 SW", lang: "Gerätewagen Logistik 2 Schlauch" }],
    szenario: "Wasserförderung {ort} — Verlegung langer Schlauchstrecken",
  },
  {
    fachdienst: "Feuerwehrbereitschaft",
    quelle: "KatS-StAN NDS 011/4",
    einheit: "Trupp Technische Hilfe",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Maschinist/-in" },
      { rolle: M, funktion: "Truppmitglied" },
    ],
    fahrzeuge: [{ kurz: "RW", lang: "Rüstwagen" }],
    szenario: "Sturmschäden {ort} — technische Hilfeleistung, Beseitigung",
  },
  {
    fachdienst: "Feuerwehrbereitschaft",
    quelle: "KatS-StAN NDS 011/5",
    einheit: "Trupp Vegetationsbrandbekämpfung",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Truppführer/-in" },
      { rolle: M, funktion: "Maschinist/-in" },
      { rolle: M, funktion: "Truppmitglied" },
    ],
    fahrzeuge: [{ kurz: "TLF 3000", lang: "Tanklöschfahrzeug 3000" }],
    szenario: "Waldbrand {ort} — mobiler Löschangriff, Pendelverkehr",
  },
  {
    fachdienst: "Feuerwehrbereitschaft",
    quelle: "KatS-StAN NDS 011/5",
    einheit: "Staffel Logistik Wasserentnahme",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Maschinist/-in" },
      { rolle: M, funktion: "Truppmitglied", anzahl: 4 },
    ],
    fahrzeuge: [{ kurz: "GW-L2", lang: "Gerätewagen Logistik 2 (Wasserentnahme)" }],
    szenario: "Vegetationsbrand {ort} — Aufbau Wasserentnahmestelle",
  },
  {
    fachdienst: "Feuerwehrbereitschaft",
    quelle: "KatS-StAN NDS 011/6",
    einheit: "Trupp Wassertransport",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Truppführer/-in" },
      { rolle: M, funktion: "Maschinist/-in" },
      { rolle: M, funktion: "Truppmitglied" },
    ],
    fahrzeuge: [{ kurz: "TLF 3000", lang: "Tanklöschfahrzeug 3000 (Wassertransport)" }],
    szenario: "Trinkwassernotstand {ort} — Wassertransport im Pendelverkehr",
  },

  // ---------------------------------------------------------- GFFF-V (012/2)
  {
    fachdienst: "GFFF-V",
    quelle: "KatS-StAN NDS 012/2",
    einheit: "Zugtrupp GFFF-V",
    traeger: feuerwehr,
    personal: [
      { rolle: F, funktion: "Zugführer/-in" },
      { rolle: U, funktion: "Führungsassistent/-in" },
      { rolle: M, funktion: "Fachberater Sicherheit (Field Safety Officer)", anzahl: 2, quali: "Field Safety Officer" },
    ],
    fahrzeuge: [{ kurz: "KdoW GFFF-V", lang: "Kommandowagen GFFF-V, geländefähig" }],
    szenario: "Waldbrand {ort} — Führung GFFF-V-Einheit (überörtliche Hilfe)",
  },
  {
    fachdienst: "GFFF-V",
    quelle: "KatS-StAN NDS 012/2",
    einheit: "Erweiterter Trupp Vegetationsbrandbekämpfung (GFFF-V)",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Staffelführer/-in" },
      { rolle: M, funktion: "Maschinist/-in" },
      { rolle: M, funktion: "Truppmitglied", anzahl: 2 },
    ],
    fahrzeuge: [{ kurz: "CCFM 3000 Niedersachsen", lang: "spezialisiertes Waldbrandtanklöschfahrzeug" }],
    szenario: "Waldbrand {ort} — mobiler Löschangriff im Gelände",
    gemisch: true,
  },
  {
    fachdienst: "GFFF-V",
    quelle: "KatS-StAN NDS 012/2",
    einheit: "Staffel Logistik Wasserentnahme (GFFF-V)",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Staffelführer/-in" },
      { rolle: M, funktion: "Maschinist/-in" },
      { rolle: M, funktion: "Truppmitglied", anzahl: 4 },
    ],
    fahrzeuge: [{ kurz: "GW GFFF-V", lang: "Gerätewagen GFFF-V (Wasserentnahme)" }],
    szenario: "Waldbrand {ort} — Wasserentnahme und Nachschub",
  },

  // ------------------------------------------------------- Wasserrettung (025)
  {
    fachdienst: "Wasserrettung",
    quelle: "KatS-StAN NDS 025/1",
    einheit: "Staffel Wasserrettung (WRSt)",
    traeger: dlrg,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Bootsführer/-in", quali: "Bootsführerschein" },
      { rolle: M, funktion: "Wasserrettungshelfer/-in", anzahl: 4, quali: "Rettungsschwimmer" },
    ],
    fahrzeuge: [
      { kurz: "GW WR", lang: "Gerätewagen Wasserrettung" },
      { kurz: "MZB KatS", lang: "Mehrzweckboot Katastrophenschutz", ohneFunk: true, ohneKennzeichen: "auf Anh" },
    ],
    szenario: "Hochwasser {ort} — Personenrettung und Bootstransport",
  },
  {
    fachdienst: "Wasserrettung",
    quelle: "KatS-StAN NDS 025/1",
    einheit: "Staffel Strömungsrettung (StrRSt)",
    traeger: dlrg,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Bootsführer/-in", quali: "Bootsführerschein" },
      { rolle: M, funktion: "Strömungsretter/-in", anzahl: 4, quali: "Strömungsretter" },
    ],
    fahrzeuge: [
      { kurz: "GW StrR", lang: "Gerätewagen Strömungsrettung" },
      { kurz: "MZB KatS", lang: "Mehrzweckboot Katastrophenschutz", ohneFunk: true, ohneKennzeichen: "auf Anh" },
      { kurz: "Raft", lang: "Raft (Strömungsrettung)", ohneFunk: true, ohneKennzeichen: "auf Anh" },
    ],
    szenario: "Starkregen {ort} — Rettung aus Fließgewässer und Strömung",
  },

  // --------------------------------------------------------- Sanitätsdienst
  {
    fachdienst: "Sanitätsdienst",
    quelle: "KatS-StAN NDS 040/1",
    einheit: "Patiententransportstaffel",
    traeger: mhd,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Rettungssanitäter/-in", anzahl: 3, quali: "Rettungssanitäter" },
      { rolle: M, funktion: "Sanitätshelfer/-in", anzahl: 2 },
    ],
    fahrzeuge: [{ kurz: "KTW", lang: "Krankentransportwagen (erweiterte Transportfähigkeit)", anzahl: 3 }],
    szenario: "Klinikräumung {ort} — Transport nicht gehfähiger Patientinnen und Patienten",
  },
  {
    fachdienst: "Sanitätsdienst",
    quelle: "KatS-StAN NDS 041",
    einheit: "Zugtrupp Sanitäts- und Betreuungszug (ZTr SBZ)",
    traeger: drk,
    personal: [
      { rolle: F, funktion: "Zugführer/-in" },
      { rolle: F, funktion: "stellv. Zugführer/-in als Zugtruppführer/-in" },
      { rolle: M, funktion: "Sprechfunker/-in / Melder/-in", anzahl: 2 },
    ],
    fahrzeuge: [{ kurz: "ZTrKW", lang: "Zugtruppkraftwagen" }],
    szenario: "MANV {ort} — Führung Sanitäts- und Betreuungszug",
  },
  {
    fachdienst: "Sanitätsdienst",
    quelle: "KatS-StAN NDS 041",
    einheit: "Sanitätsgruppe (SanGr)",
    traeger: drk,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: F, funktion: "Ärztin/Arzt", quali: "Notarzt" },
      { rolle: M, funktion: "Rettungssanitäter/-in", anzahl: 2, quali: "Rettungssanitäter" },
      { rolle: M, funktion: "Rettungssanitäter/-in bzw. Sanitätshelfer/-in", anzahl: 2 },
      { rolle: M, funktion: "Sanitätshelfer/-in", anzahl: 3 },
    ],
    fahrzeuge: [
      { kurz: "GW San", lang: "Gerätewagen Sanitätsdienst" },
      { kurz: "MTW", lang: "Mannschaftstransportwagen" },
    ],
    szenario: "MANV {ort} — Sichtung, Behandlung, Herstellung der Transportfähigkeit",
  },
  {
    fachdienst: "Sanitätsdienst",
    quelle: "KatS-StAN NDS 041",
    einheit: "Betreuungsgruppe (BTGr)",
    traeger: drk,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Betreuungshelfer/-in", anzahl: 8 },
    ],
    fahrzeuge: [
      { kurz: "GW Bt", lang: "Gerätewagen Betreuungsdienst" },
      { kurz: "MTW Bt", lang: "Mannschaftstransportwagen Betreuung" },
      { kurz: "Anh Bt", lang: "Anhänger Betreuung", ohneFunk: true, ohneKennzeichen: "Anh Bt" },
    ],
    szenario: "Evakuierung {ort} — Betreuung und Unterbringung Betroffener",
  },
  {
    fachdienst: "Sanitätsdienst",
    quelle: "KatS-StAN NDS 049/1",
    einheit: "Staffel Psychosoziale Notfallversorgung (PSNV)",
    traeger: juh,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "PSNV-Kraft (Betroffene / Einsatzkräfte)", anzahl: 4, quali: "PSNV-Ausbildung" },
    ],
    fahrzeuge: [{ kurz: "MTW", lang: "Mannschaftstransportwagen" }],
    szenario: "Schadenslage {ort} — psychosoziale Notfallversorgung",
  },

  // -------------------------------------------------------- Betreuungsdienst
  {
    fachdienst: "Betreuungsdienst",
    quelle: "KatS-StAN NDS 060/1",
    einheit: "Verpflegungsgruppe",
    traeger: asb,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Feldkoch/-köchin", anzahl: 2, quali: "Koch" },
      { rolle: M, funktion: "Verpflegungshelfer/-in", anzahl: 5 },
      { rolle: M, funktion: "Küchentechniker/-in" },
    ],
    fahrzeuge: [
      { kurz: "GW Vpf", lang: "Gerätewagen Verpflegung" },
      { kurz: "MTW Vpf", lang: "Mannschaftstransportwagen Verpflegung" },
      { kurz: "FKH", lang: "Feldkochherd", ohneFunk: true, ohneKennzeichen: "Anh FKH" },
      { kurz: "Anh Kühl", lang: "Kühlanhänger", ohneFunk: true, ohneKennzeichen: "Anh Kühl" },
    ],
    szenario: "Flächenlage {ort} — Verpflegung von Einsatzkräften und Betroffenen",
  },
  {
    fachdienst: "Betreuungsdienst",
    quelle: "KatS-StAN NDS 060/2",
    einheit: "Registrierungsstaffel",
    traeger: drk,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Registrierungshelfer/-in", anzahl: 5 },
    ],
    fahrzeuge: [{ kurz: "MTW", lang: "Mannschaftstransportwagen mit Materialsatz Registrierungsstelle" }],
    szenario: "Evakuierung {ort} — Registrierung Betroffener in der Notunterkunft",
  },
  {
    fachdienst: "Betreuungsdienst",
    quelle: "KatS-StAN NDS 060/3",
    einheit: "Betreuungstransport- und -leitstaffel",
    traeger: juh,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Betreuungshelfer/-in", anzahl: 5 },
    ],
    fahrzeuge: [
      { kurz: "MTWm", lang: "Mannschaftstransportwagen multifunktional" },
      { kurz: "Anh Bt", lang: "Anhänger Betreuung (optional)", ohneFunk: true, ohneKennzeichen: "Anh Bt" },
    ],
    szenario: "Evakuierung {ort} — Transport und Leitung Betreuungsstelle",
  },
  {
    fachdienst: "Betreuungsdienst",
    quelle: "KatS-StAN NDS 060/4",
    einheit: "Transporttrupp Bus 50",
    traeger: mhd,
    personal: [{ rolle: M, funktion: "Fahrer/-in / Helfer/-in", anzahl: 3, fe: FE.DE }],
    fahrzeuge: [
      { kurz: "KOM", lang: "Kraftomnibus (mind. 50 Sitzplätze)" },
      { kurz: "Anh", lang: "Anhänger für Gepäck (optional)", ohneFunk: true, ohneKennzeichen: "Anh" },
    ],
    szenario: "Evakuierung {ort} — Transport von bis zu 50 Betroffenen",
  },

  // ------------------------------------------- Logistik-/Versorgungsdienst (090)
  {
    fachdienst: "Logistik- und Versorgungsdienst",
    quelle: "KatS-StAN NDS 090/1",
    einheit: "Logistik- und Technikgruppe",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in (Logistik-Führungstrupp)" },
      { rolle: M, funktion: "Sprechfunker/-in (Logistik-Führungstrupp)" },
      { rolle: M, funktion: "Technikhelfer/-in", anzahl: 7 },
    ],
    fahrzeuge: [
      { kurz: "Kombi-L", lang: "Kombinationskraftwagen Logistik (Führungstrupp)" },
      { kurz: "GW L gr", lang: "Gerätewagen Logistik groß" },
      { kurz: "Anh Log", lang: "Anhänger für Logistikzwecke", ohneFunk: true, ohneKennzeichen: "Anh Log" },
      { kurz: "GW L kl", lang: "Gerätewagen Logistik klein" },
      { kurz: "NEA", lang: "mobile Netzersatzanlage mit Lichtmast", ohneFunk: true, ohneKennzeichen: "Anh NEA" },
      { kurz: "Anh Tank", lang: "Anhänger mobile Kraftstoffversorgung", ohneFunk: true, ohneKennzeichen: "Anh Tank" },
    ],
    szenario: "Bereitstellungsraum {ort} — Materialnachschub und technische Unterstützung",
  },
  {
    fachdienst: "Logistik- und Versorgungsdienst",
    quelle: "KatS-StAN NDS 090/2",
    einheit: "Energieversorgungsgruppe",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Elektrofachkraft (Staffel Netzersatzanlage)", anzahl: 2, quali: "Elektrofachkraft DIN VDE 1000-10" },
      { rolle: M, funktion: "Technikhelfer/-in (Staffel Netzersatzanlage)", anzahl: 3 },
      { rolle: M, funktion: "Truppführer/-in (Kraft- und Betriebsstofftrupp)" },
      { rolle: M, funktion: "Technikhelfer/-in (Betriebsstofftrupp)", anzahl: 2 },
    ],
    fahrzeuge: [
      { kurz: "NEA 250", lang: "mobile Netzersatzanlage 250 kVA mit Zugfahrzeug" },
      { kurz: "TB Ks", lang: "mobiler Tankbehälter Kraftstoff 6000 l mit Transportfahrzeug (ADR)" },
    ],
    szenario: "Stromausfall {ort} — Netzersatz für kritische Infrastruktur",
  },
  {
    fachdienst: "Logistik- und Versorgungsdienst",
    quelle: "KatS-StAN NDS 090/3",
    einheit: "Logistiktrupp schwer",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Truppführer/-in" },
      { rolle: M, funktion: "Technikhelfer/-in", anzahl: 2 },
    ],
    fahrzeuge: [
      { kurz: "WLF", lang: "Wechselladerfahrzeug" },
      { kurz: "AB Mulde", lang: "Abrollbehälter Mulde", ohneFunk: true, ohneKennzeichen: "auf WLF" },
      { kurz: "AB Logistik", lang: "Abrollbehälter Logistik", ohneFunk: true, ohneKennzeichen: "auf WLF" },
      { kurz: "Anh", lang: "Transportanhänger", ohneFunk: true, ohneKennzeichen: "Anh" },
      { kurz: "UslG", lang: "Umschlaggerät (Teleskoplader)", ohneFunk: true, ohneKennzeichen: "auf Anh" },
    ],
    szenario: "Hochwasser {ort} — schwerer Materialumschlag und Transport",
  },

  // ---------------------------------------------------------- Geräteeinheiten (120)
  {
    fachdienst: "Geräteeinheiten Hochwasserschutz",
    quelle: "KatS-StAN NDS 120/1",
    einheit: "Geräteeinheit Sandsackfüllmaschine",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Helfer/-in (Befüllen und Verschließen)", anzahl: 8 },
    ],
    fahrzeuge: [
      { kurz: "Zugfahrzeug", lang: "Zugfahrzeug (Anhängerzugleistung mind. 8,6 t)" },
      { kurz: "SMF", lang: "Sandsackfüllmaschine, elektromechanisch", ohneFunk: true, ohneKennzeichen: "auf Anh Trsp" },
      { kurz: "Anh Trsp", lang: "Anhänger zum Transport der Sandsackfüllmaschine, mit Materialcontainer", ohneFunk: true, ohneKennzeichen: "Anh Trsp" },
    ],
    szenario: "Hochwasser {ort} — Betrieb Sandsackfüllplatz (materielle Reserve)",
  },
  {
    fachdienst: "Geräteeinheiten Hochwasserschutz",
    quelle: "KatS-StAN NDS 120/2",
    einheit: "Geräteeinheit mobiles Hochwasserschutzsystem",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Truppführer/-in" },
      { rolle: M, funktion: "Helfer/-in", anzahl: 2 },
    ],
    fahrzeuge: [
      { kurz: "Transportfahrzeug", lang: "geeignetes Transportfahrzeug (mobiles Hochwasserschutzsystem, bis 3 Sätze à 150 m)" },
      { kurz: "UslG", lang: "Umschlaggerät (Logistik am Einsatzort)", ohneFunk: true, ohneKennzeichen: "auf Anh" },
    ],
    szenario: "Hochwasser {ort} — Aufbau mobiler Hochwasserschutz (materielle Reserve)",
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
  // Zweite Führungskraft ist zu 60 % über Mobilfunk erreichbar.
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

function fahrzeugeBauen(specs: FzSpec[], traeger: Traeger, ort: NdsOrt): Fahrzeug[] {
  const belegt = new Map<number, number>(); // Fahrzeugkennung → nächste lfd. Ordnungskennung
  const oertl = traeger.oertlKennung(ort);
  const region = landkreisFunk(ort.landkreis);
  const fahrzeuge: Fahrzeug[] = [];
  for (const s of specs) {
    for (let i = 0; i < (s.anzahl ?? 1); i++) {
      const fz: Fahrzeug = { typ: { freitext: s.kurz } };
      if (s.lang) fz.aenderungen = s.lang;
      if (s.ohneKennzeichen) fz.kennzeichenFreitext = s.ohneKennzeichen;
      else fz.kennzeichenFreitext = kennzeichen(ort.kfz);
      if (!s.ohneFunk) {
        const kennung = fzKennung(s.kurz);
        if (kennung != null) {
          // Ordnungskennung (Block 4.3): lfd. Nr. je gleicher Fahrzeugkennung;
          // die 1 wird auch bei nur einem Fahrzeug gesprochen (Nr. 4.2.5.3).
          const ordnung = (belegt.get(kennung) ?? 0) + 1;
          belegt.set(kennung, ordnung);
          const funkrufname: Funkrufname = {
            kennwort: { code: traeger.kennwort },
            eigenerStandort: false,
            ort: region,
            teile: [oertl, kennung, ordnung],
          };
          fz.funkrufname = funkrufname;
        }
      }
      fahrzeuge.push(fz);
    }
  }
  return fahrzeuge;
}

interface BeispielBogen {
  datei: string;
  bogen: Erfassungsbogen;
  ort: NdsOrt;
  fachdienst: string;
  quelle: string;
}

function bogenBauen(spec: BogenSpec, ort: NdsOrt): BeispielBogen {
  const personal = personalBauen(spec.personal);
  const fahrzeuge = fahrzeugeBauen(spec.fahrzeuge, spec.traeger, ort);

  const hierarchie: HierarchieEbene[] = [
    { bezeichnung: { freitext: spec.einheit }, name: ort.ort },
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
      einheitsTyp: { freitext: spec.einheit },
      // Der Ort dient zugleich als Ortsbezeichnung des Funkrufnamens
      // („Florian Cuxhaven 40").
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
  };

  return {
    datei: `${slug(spec.einheit)}-${slug(ort.ort)}`,
    bogen,
    ort,
    fachdienst: spec.fachdienst,
    quelle: spec.quelle,
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

// Jede Teileinheit an einen anderen Ort in Niedersachsen setzen (geografisch
// breit gestreut, deterministisch).
const orte = [...NDS_ORTE];
const beispiele: BeispielBogen[] = SPECS.map((spec, i) => {
  const ort = orte[(i * 7 + 3) % orte.length]!;
  return bogenBauen(spec, ort);
});

const ausgabe = join(wurzel, "examples", "katastrophenschutz", "niedersachsen");
mkdirSync(ausgabe, { recursive: true });
for (const datei of readdirSync(ausgabe)) {
  if (datei.endsWith(".json")) rmSync(join(ausgabe, datei));
}

let segmentierte = 0;
for (const [i, bsp] of beispiele.entries()) {
  const qr = await qrSatz(bsp.bogen);
  roundtrip(qr, bsp.bogen.personal.length, bsp.datei);
  if (qr.segmentiert) segmentierte++;
  writeFileSync(join(ausgabe, `${bsp.datei}.json`), JSON.stringify(bsp.bogen, null, 2) + "\n");
}

// Übersichtstabelle für die README.
const zeilen = beispiele.map((b) => {
  const s = staerke(b.bogen);
  return `| ${b.datei} | ${b.fachdienst} | ${b.bogen.einheit.einheitsTyp.freitext} | ${b.ort.ort} | ${b.ort.landkreis} | ${s.fuehrer}/${s.unterfuehrer}/${s.mannschaft}/${s.gesamt} | ${b.bogen.fahrzeuge.length} | ${b.quelle} |`;
});
writeFileSync(
  join(ausgabe, "README.md"),
  `# Beispiel-Erfassungsbögen — Katastrophenschutz Niedersachsen

${beispiele.length} generierte Beispiel-Einheiten nach den KatS-StAN NDS (Kommunale
Einheiten des Katastrophenschutzes Niedersachsen, Fassung 2023/2025). Abgebildet
ist je kleinster selbstständiger Teileinheit (Gruppe/Trupp/Staffel/Geräteeinheit)
ein Bogen; Fachzüge und der Sanitäts- und Betreuungszug sind in ihre Teileinheiten
zerlegt.

Alle Personen, Orte und Kennzeichen sind **fiktiv**. Die Funkrufnamen folgen dem
OPTA-Schema Niedersachsen (RdErl. MI v. 01.03.2024, Nds. MBl. 2024 Nr. 125):
„<Rufname> <Landkreis> <örtl./Org.-Kennung>/<Fahrzeugkennung (Anlage 2)>/
<Ordnungskennung>". Die örtlichen Kennungen (Gemeindekennziffern) sind fiktiv,
Fahrzeug- und Organisationskennungen entsprechen dem Erlass. Die Träger (und damit
Organisation und Rufname) sind je Fachdienst realistisch gestreut: Feuerwehr
(Florian), DRK (Rotkreuz), JUH (Akkon), MHD (Johannes), ASB (Sama), DLRG (Pelikan).

Neu erzeugen mit: \`npm run beispiele:kats\` (deterministisch, fester Zufalls-Seed).

| Datei | Fachdienst | Einheit | Ort | Untere KatS-Behörde | Stärke | Fz | Quelle |
|---|---|---|---|---|---|---|---|
${zeilen.join("\n")}
`,
);

console.log(`Fertig: ${beispiele.length} Beispielbögen in examples/katastrophenschutz/niedersachsen/ (+ README.md)`);
console.log(`Segmentierte QR: ${segmentierte}`);
const jeFd = new Map<string, number>();
for (const b of beispiele) jeFd.set(b.fachdienst, (jeFd.get(b.fachdienst) ?? 0) + 1);
for (const [fd, n] of [...jeFd.entries()].sort()) console.log(`  ${fd}: ${n}`);
