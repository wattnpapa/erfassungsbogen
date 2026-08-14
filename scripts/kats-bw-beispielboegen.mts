/**
 * Erzeugt Beispiel-Erfassungsbögen der Katastrophenschutzeinheiten des Landes
 * Baden-Württemberg als JSON nach examples/katastrophenschutz/badenwuerttemberg/.
 * (Ordnername ohne Bindestrich — wie bei den übrigen Ländern; die Vorlagen-
 * Erkennung in src/vokabulare/landesvorlagen.ts liest den Ordnernamen direkt
 * als Bundesland-Schlüssel und kennt „badenwuerttemberg" in BUNDESLAND_LABEL.)
 * Abgelegt ist nur das Bogen-JSON; die PDF entsteht erst beim Anklicken in der
 * App aus dem aktuellen Layout.
 *
 * Aufruf (Node ≥ 22): npm run beispiele:kats-bw
 *
 * Grundlage ist die VwV KatSD (Verwaltungsvorschrift des Innenministeriums
 * Baden-Württemberg über die Stärke und Gliederung des Katastrophenschutz-
 * dienstes) vom 24. September 2012 (GABl. Nr. 12 vom 31. Oktober 2012, S. 802)
 * mit ihren Anlagen 2 (Brandschutz, Technische Hilfe, ABC-Schutz), 3 (Sanität
 * und Betreuung), 4 (Wasserrettung) und 5 (Veterinärwesen). Gliederungsschema
 * durchgängig Führer/Unterführer/Mannschaften/Gesamtstärke; alle Einheiten
 * werden in Doppelbesetzung vorgehalten, die angegebenen Stärken sind die
 * einfache Besetzung.
 *
 * WICHTIGER UNTERSCHIED zu Sachsen und Niedersachsen, aber GLEICH wie bei
 * Brandenburg: Die VwV KatSD stellt die taktischen Einheiten als geschlossene
 * Züge mit interner Fahrzeug-Tabelle dar, nicht als unabhängig einsetzbare
 * Teileinheiten. Deshalb:
 *   - ein Bogen je taktischer Einheit (14 Stück über alle vier Anlagen),
 *     nicht je Teileinheit;
 *   - Personalstärke (Führer/Unterführer/Mannschaft/Gesamt) sind aus den
 *     Anlagen entnommen und werden am Ende gegen sie geprüft;
 *   - die Fahrzeug-TYPEN stehen zwar in der Anlage, aber die genauen
 *     Funkkennziffern (2. Teilkennzahl) sind nicht vollständig öffentlich
 *     dokumentiert. Die hier verwendeten Kennziffern sind daher plausibel und
 *     in sich konsistent gewählt, orientiert an den bekannten Ankerpunkten
 *     (10 KdoW, 11 ELW1/FüKW, 12 ELW2) des Funkrufnamenplans — siehe README.
 *
 * WICHTIGER HINWEIS zur Landkreis-Zuordnung: Die VwV KatSD weist die 12
 * taktischen Einheiten der Anlage 2 konkreten Land-/Stadtkreisen zu (Tabelle
 * je Regierungsbezirk). Diese Einzelzuordnung lag beim Erstellen dieses
 * Generators nicht vollständig vor. Die hier gewählten Standorte sind daher
 * NUR BEISPIELHAFT — plausible, reale baden-württembergische Land-/Stadtkreise,
 * über alle vier Regierungsbezirke gestreut, aber NICHT Zeile für Zeile der
 * Verordnungstabelle entnommen. Stärke- und Fahrzeugdaten dagegen sind
 * verordnungsgenau (soweit oben zusammengefasst) und werden geprüft.
 *
 * Für das Rettungshundestaffel-Kennwort „Antonius" und das Bergwacht-Kennwort
 * „Bergwacht" gilt dasselbe wie in Sachsen/Thüringen: Sie stehen nicht im
 * globalen FUNKRUF_KENNWOERTER-Vokabular und werden deshalb als Freitext
 * geführt, ebenso „Kater" für die Regieeinheiten der unteren
 * Katastrophenschutzbehörde (hier: Veterinärzug).
 *
 * Fiktiv sind alle Personen, Standort-Zuordnungen und Kennzeichen.
 *
 * Am Ende läuft eine Selbstprüfung (Stärke gegen die Anlagen, Funkrufname je
 * motorisiertem Einsatzmittel, QR-Roundtrip); die README im Zielordner bekommt
 * eine Übersichtstabelle.
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
const rnd = prng(20120924); // Datum der VwV KatSD
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
  "Achim", "Andreas", "Bernd", "Christian", "Daniel", "David", "Dennis", "Dieter",
  "Dominik", "Eberhard", "Fabian", "Felix", "Florian", "Frank", "Gerhard", "Hans",
  "Heiko", "Helmut", "Jan", "Jens", "Joachim", "Jochen", "Jonas", "Julian",
  "Kai", "Karl", "Klaus", "Lars", "Leon", "Lukas", "Manfred", "Marc",
  "Marco", "Markus", "Martin", "Matthias", "Michael", "Moritz", "Norbert", "Patrick",
  "Paul", "Peter", "Ralf", "Reiner", "Robert", "Rolf", "Sebastian", "Simon",
  "Stefan", "Sven", "Thomas", "Thorsten", "Tim", "Tobias", "Uwe", "Werner",
] as const;
const VORNAMEN_W = [
  "Angelika", "Anja", "Anna", "Barbara", "Beate", "Birgit", "Brigitte", "Christine",
  "Claudia", "Doris", "Elke", "Erika", "Franziska", "Gabriele", "Heidi", "Heike",
  "Ingrid", "Jana", "Julia", "Karin", "Katharina", "Katrin", "Kerstin", "Lea",
  "Lena", "Lisa", "Manuela", "Maria", "Marion", "Martina", "Melanie", "Monika",
  "Nadine", "Nicole", "Petra", "Renate", "Sabine", "Sandra", "Sarah", "Silvia",
  "Simone", "Sonja", "Susanne", "Ulrike", "Ursula", "Vanessa", "Verena",
] as const;
const NACHNAMEN = [
  "Bauer", "Baumann", "Beck", "Becker", "Berger", "Bihler", "Braun", "Deuschle",
  "Egger", "Eisele", "Faller", "Farrenkopf", "Fischer", "Frey", "Fritz", "Gaiser",
  "Geiger", "Groh", "Gruber", "Haas", "Häfele", "Hartmann", "Hauser", "Herrmann",
  "Hofmann", "Huber", "Jäger", "Kaiser", "Keller", "Kern", "Klein", "Koch",
  "Kohler", "König", "Kraus", "Krause", "Kuhn", "Lang", "Lehmann", "Maier",
  "Mayer", "Meier", "Müller", "Rapp", "Renz", "Roth", "Sailer", "Schmid",
  "Schmidt", "Schmitt", "Schneider", "Scholz", "Schuster", "Schwarz", "Seitz",
  "Stark", "Stein", "Vogel", "Wagner", "Walz", "Weber", "Weiß", "Wolf", "Ziegler",
] as const;

/** Externe/Berufs-Qualifikationen (Freitext) — gelegentlich gestreut. */
const QUALI_POOL = [
  "Berufskraftfahrer (Beruf)",
  "Rettungssanitäter (extern)",
  "Elektrofachkraft (Beruf)",
  "Landwirt — Erfahrung Großgeräte",
  "Motorsägenschein (extern)",
  "Funkamateur (extern)",
  "Gesundheits- und Krankenpfleger (Beruf)",
  "Sprechfunker",
] as const;

// ---------------------------------------------- Baden-Württemberg: Standorte

interface BwOrt {
  ort: string;
  kreis: string;
  kfz: string;
  /** Regierungsbezirk (nur Dokumentation/README). */
  rb: "Stuttgart" | "Karlsruhe" | "Freiburg" | "Tübingen";
  /**
   * Fiktive erste Teilkennzahl (Standort) des Funkrufnamenplans; die Vergabe
   * liegt bei der unteren Katastrophenschutzbehörde.
   */
  standort: number;
}

/**
 * Ein Standort je Einheit, über alle vier Regierungsbezirke gestreut. Die
 * Zuordnung Einheit → Standort ist BEISPIELHAFT gewählt (siehe Kommentar am
 * Dateianfang) — Stärke und Fahrzeuge dagegen sind verordnungsgenau.
 */
const BW_ORTE: Record<string, BwOrt> = {
  ludwigsburg: { ort: "Ludwigsburg", kreis: "Landkreis Ludwigsburg", kfz: "LB", rb: "Stuttgart", standort: 10 },
  stuttgart: { ort: "Stuttgart", kreis: "Stadt Stuttgart", kfz: "S", rb: "Stuttgart", standort: 10 },
  remsmurr: { ort: "Waiblingen", kreis: "Rems-Murr-Kreis", kfz: "WN", rb: "Stuttgart", standort: 12 },
  boeblingen: { ort: "Böblingen", kreis: "Landkreis Böblingen", kfz: "BB", rb: "Stuttgart", standort: 14 },
  rastatt: { ort: "Rastatt", kreis: "Landkreis Rastatt", kfz: "RA", rb: "Karlsruhe", standort: 10 },
  karlsruhe: { ort: "Karlsruhe", kreis: "Stadt Karlsruhe", kfz: "KA", rb: "Karlsruhe", standort: 10 },
  mannheim: { ort: "Mannheim", kreis: "Stadt Mannheim", kfz: "MA", rb: "Karlsruhe", standort: 10 },
  ortenau: { ort: "Offenburg", kreis: "Ortenaukreis", kfz: "OG", rb: "Freiburg", standort: 16 },
  konstanz: { ort: "Konstanz", kreis: "Landkreis Konstanz", kfz: "KN", rb: "Freiburg", standort: 10 },
  waldshut: { ort: "Waldshut-Tiengen", kreis: "Landkreis Waldshut", kfz: "WT", rb: "Freiburg", standort: 18 },
  reutlingen: { ort: "Reutlingen", kreis: "Landkreis Reutlingen", kfz: "RT", rb: "Tübingen", standort: 10 },
  biberach: { ort: "Biberach an der Riß", kreis: "Landkreis Biberach", kfz: "BC", rb: "Tübingen", standort: 10 },
  bodensee: { ort: "Friedrichshafen", kreis: "Bodenseekreis", kfz: "FN", rb: "Tübingen", standort: 12 },
  ravensburg: { ort: "Ravensburg", kreis: "Landkreis Ravensburg", kfz: "RV", rb: "Tübingen", standort: 10 },
};

// ------------------------------------------------------------------ Träger

interface Traeger {
  org: OrganisationsTyp;
  kennwort: VokabularWert;
  organisationName: (o: BwOrt) => string;
  ebene: (o: BwOrt) => HierarchieEbene[];
}

/** FUNKRUF_KENNWOERTER-Codes (src/vokabulare/thw.ts). */
const KW = { FLORIAN: 2, ROTKREUZ: 3, AKKON: 4, SAMA: 6, PELIKAN: 7 } as const;

const kreisKurz = (o: BwOrt): string =>
  o.kreis.replace(/^(Landkreis|Stadt|Landeshauptstadt)\s+/, "");

const feuerwehr: Traeger = {
  org: OrganisationsTyp.FEUERWEHR,
  kennwort: { code: KW.FLORIAN },
  organisationName: (o) => `Feuerwehr ${o.kreis}`,
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
const asb = hiorg(OrganisationsTyp.ASB, { code: KW.SAMA }, "ASB", "Arbeiter-Samariter-Bund");
const juh = hiorg(OrganisationsTyp.JUH, { code: KW.AKKON }, "JUH", "Johanniter-Unfall-Hilfe");
const dlrg = hiorg(OrganisationsTyp.DLRG, { code: KW.PELIKAN }, "DLRG", "DLRG");

/** Bergwacht Baden-Württemberg — organisatorisch beim DRK, eigenes Kennwort. */
const bergwacht: Traeger = {
  org: OrganisationsTyp.DRK,
  kennwort: { freitext: "Bergwacht" },
  organisationName: (o) => `Bergwacht Baden-Württemberg (DRK) — ${o.kreis}`,
  ebene: (o) => [
    { bezeichnung: { freitext: "Bergwacht-Bereitschaft" }, name: o.ort },
    { bezeichnung: { freitext: "Untere KatS-Behörde" }, name: o.kreis },
  ],
};

/** Rettungshundestaffel — eigenes Kennwort „Antonius", organisatorisch beim DRK geführt. */
const rettungshunde: Traeger = {
  org: OrganisationsTyp.DRK,
  kennwort: { freitext: "Antonius" },
  organisationName: (o) => `Rettungshundestaffel ${o.kreis} (DRK)`,
  ebene: (o) => [{ bezeichnung: { freitext: "Untere KatS-Behörde" }, name: o.kreis }],
};

/** Regieeinheit der unteren Katastrophenschutzbehörde (Veterinärzug), Kennwort „Kater". */
const kats: Traeger = {
  org: OrganisationsTyp.FEUERWEHR,
  kennwort: { freitext: "Kater" },
  organisationName: (o) => `Katastrophenschutzbehörde ${o.kreis} — Veterinärwesen`,
  ebene: (o) => [{ bezeichnung: { freitext: "Untere KatS-Behörde" }, name: o.kreis }],
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
  if (/^(WLF|LKW|Dekon-LKW)/.test(kurz)) return 120;
  if (/^(LF|GW|RW|SW|Anh)/.test(kurz)) return 70;
  if (/^(ELW|KdoW|MTW|KTW|ABC-ErkKW)/.test(kurz)) return 45;
  if (/^RTH/.test(kurz)) return 0; // Kerosin, kein Diesel/Benzin-Sofortbedarf hier abgebildet
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
  lang?: string;
  anzahl?: number;
  /** Anhänger und Boote statt Kfz-Kennzeichen; zählen nicht als Einsatz-Kfz. */
  ohneKennzeichen?: string;
  /** Zweite Teilkennzahl (Funkkennziffer je Fahrzeugtyp) — siehe README. Fehlt = kein Funkrufname. */
  kennzahl?: number;
}

interface BogenSpec {
  anlage: string; // "Anlage 2", "Anlage 3", "Anlage 4", "Anlage 5" der VwV KatSD
  kuerzel: string;
  einheit: string;
  traeger: Traeger;
  ortSchluessel: keyof typeof BW_ORTE;
  personal: PlatzSpec[];
  fahrzeuge: FzSpec[];
  szenario: string; // {ort} wird ersetzt
  /** Mindeststärke laut Anlage als "Führer/Unterführer/Helfer/Gesamt" — wird geprüft. */
  soll: [number, number, number, number];
  /** Zahl der Einsatz-Kfz (bzw. -mittel) laut Anlage — wird geprüft (ohne Anhänger). */
  sollKfz: number;
  /** Landesweite Gesamtzahl dieses Einheitstyps (nur Dokumentation). */
  landesweit: number;
  gemisch?: boolean;
}

const F = R.FUEHRER;
const U = R.UNTERFUEHRER;
const M = R.MANNSCHAFT;

const QUELLE = "VwV KatSD Baden-Württemberg vom 24.09.2012 (GABl. Nr. 12/2012, S. 802)";

const SPECS: BogenSpec[] = [
  // ============================================ Anlage 2: Brandschutz, THuS, ABC-Schutz
  {
    anlage: "Anlage 2",
    kuerzel: "FüE",
    einheit: "Führungseinheit",
    traeger: feuerwehr,
    ortSchluessel: "ludwigsburg",
    personal: [
      { rolle: F, funktion: "Verbandsführer/-in (Leitung)" },
      { rolle: F, funktion: "Verbandsführer/-in S3 (Einsatz)" },
      { rolle: F, funktion: "Zugführer/-in (ELW 1)" },
      { rolle: F, funktion: "Zugführer/-in (GW-T/GW-L)" },
      { rolle: U, funktion: "Gruppenführer/-in (KdoW)" },
      { rolle: U, funktion: "Truppführer/-in (MTW)", anzahl: 2 },
      { rolle: M, funktion: "Kraftfahrer/-in", anzahl: 2, fe: FE.C1 },
      { rolle: M, funktion: "Führungsassistent/-in / Sprechfunker/-in", anzahl: 3, quali: "Sprechfunker" },
    ],
    fahrzeuge: [
      { kurz: "KdoW", kennzahl: 10, lang: "Kommandowagen (Verbandsführer)" },
      { kurz: "ELW 1", kennzahl: 11, lang: "Einsatzleitwagen 1" },
      { kurz: "GW-T/GW-L", kennzahl: 30, lang: "Gerätewagen Transport/Logistik der Führungseinheit" },
      { kurz: "MTW", kennzahl: 19, lang: "Mannschaftstransportwagen", anzahl: 2 },
    ],
    szenario: "Flächenlage {ort} — Führung der Einsatzabschnitte des Katastrophenschutzes",
    soll: [4, 3, 5, 12],
    sollKfz: 5,
    landesweit: 36,
  },
  {
    anlage: "Anlage 2",
    kuerzel: "ZBB",
    einheit: "Zug Brandbekämpfung",
    traeger: feuerwehr,
    ortSchluessel: "stuttgart",
    personal: [
      { rolle: F, funktion: "Zugführer/-in" },
      { rolle: U, funktion: "Gruppenführer/-in (LF)", anzahl: 2 },
      { rolle: U, funktion: "Truppführer/-in (MTW)" },
      { rolle: M, funktion: "Truppmann/Truppfrau", anzahl: 12, quali: "Atemschutzgeräteträger" },
      { rolle: M, funktion: "Maschinist/-in", anzahl: 2, fe: FE.C },
      { rolle: M, funktion: "Kraftfahrer/-in", anzahl: 2, fe: FE.C1 },
    ],
    fahrzeuge: [
      { kurz: "KdoW", kennzahl: 10, lang: "Kommandowagen (Zugführer)" },
      { kurz: "(H)LF 20/16", kennzahl: 20, lang: "Löschgruppenfahrzeug (H)LF 20 bzw. 16", anzahl: 2 },
      { kurz: "MTW", kennzahl: 19, lang: "Mannschaftstransportwagen" },
    ],
    szenario: "Großbrand {ort} — Löschangriff im Zugverband",
    soll: [1, 3, 16, 20],
    sollKfz: 4,
    landesweit: 50,
  },
  {
    anlage: "Anlage 2",
    kuerzel: "ZLW",
    einheit: "Zug Löschwasserversorgung",
    traeger: feuerwehr,
    ortSchluessel: "rastatt",
    personal: [
      { rolle: F, funktion: "Zugführer/-in" },
      { rolle: U, funktion: "Gruppenführer/-in (LF-KatS)", anzahl: 2 },
      { rolle: U, funktion: "Truppführer/-in (SW 2000)" },
      { rolle: U, funktion: "Truppführer/-in (AB-Schlauch/GW-L)" },
      { rolle: M, funktion: "Truppmann/Truppfrau", anzahl: 9 },
      { rolle: M, funktion: "Maschinist/-in", anzahl: 3, fe: FE.C },
      { rolle: M, funktion: "Kraftfahrer/-in", fe: FE.C1 },
    ],
    fahrzeuge: [
      { kurz: "KdoW", kennzahl: 10, lang: "Kommandowagen (Zugführer)" },
      { kurz: "LF-KatS", kennzahl: 22, lang: "Löschgruppenfahrzeug Katastrophenschutz", anzahl: 2 },
      { kurz: "SW 2000", kennzahl: 31, lang: "Schlauchwagen 2000" },
      { kurz: "AB-Schlauch/GW-L", kennzahl: 32, lang: "Abrollbehälter Schlauch bzw. Gerätewagen Logistik" },
      { kurz: "MTW", kennzahl: 19, lang: "Mannschaftstransportwagen" },
    ],
    szenario: "Großbrand {ort} — Wasserförderung über lange Wegstrecke",
    soll: [1, 4, 13, 18],
    sollKfz: 6,
    landesweit: 56,
  },
  {
    anlage: "Anlage 2",
    kuerzel: "ZTH",
    einheit: "Zug Technische Hilfe",
    traeger: feuerwehr,
    ortSchluessel: "reutlingen",
    personal: [
      { rolle: F, funktion: "Zugführer/-in" },
      { rolle: U, funktion: "Gruppenführer/-in (LF)" },
      { rolle: U, funktion: "Gruppenführer/-in (RW)" },
      { rolle: U, funktion: "Truppführer/-in (MTW)" },
      { rolle: M, funktion: "Truppmann/Truppfrau", anzahl: 8 },
      { rolle: M, funktion: "Maschinist/-in", anzahl: 2, fe: FE.C },
      { rolle: M, funktion: "Kraftfahrer/-in", anzahl: 2, fe: FE.C1 },
    ],
    fahrzeuge: [
      { kurz: "KdoW", kennzahl: 10, lang: "Kommandowagen (Zugführer)" },
      { kurz: "(H)LF 20/16", kennzahl: 20, lang: "Löschgruppenfahrzeug (H)LF 20 bzw. 16" },
      { kurz: "RW", kennzahl: 40, lang: "Rüstwagen" },
      { kurz: "MTW", kennzahl: 19, lang: "Mannschaftstransportwagen" },
    ],
    szenario: "Verkehrsunfall/Sturmschäden {ort} — technische Hilfeleistung im Zugverband",
    soll: [1, 3, 12, 16],
    sollKfz: 4,
    landesweit: 51,
  },
  {
    anlage: "Anlage 2",
    kuerzel: "ZHW",
    einheit: "Zug Hochwasser",
    traeger: feuerwehr,
    ortSchluessel: "ortenau",
    personal: [
      { rolle: F, funktion: "Zugführer/-in" },
      { rolle: U, funktion: "Gruppenführer/-in (LF)" },
      { rolle: U, funktion: "Gruppenführer/-in (RW)" },
      { rolle: U, funktion: "Truppführer/-in (GW-T/GW-L)" },
      { rolle: U, funktion: "Truppführer/-in (MTW)" },
      { rolle: M, funktion: "Truppmann/Truppfrau (Schmutzwasserpumpen, Sandsackverbau)", anzahl: 9 },
      { rolle: M, funktion: "Maschinist/-in", anzahl: 2, fe: FE.C },
      { rolle: M, funktion: "Kraftfahrer/-in", anzahl: 2, fe: FE.C1 },
    ],
    fahrzeuge: [
      { kurz: "KdoW", kennzahl: 10, lang: "Kommandowagen (Zugführer)" },
      { kurz: "(H)LF 20/16", kennzahl: 20, lang: "Löschgruppenfahrzeug (H)LF 20 bzw. 16" },
      { kurz: "RW", kennzahl: 40, lang: "Rüstwagen" },
      { kurz: "MTW", kennzahl: 19, lang: "Mannschaftstransportwagen" },
      { kurz: "GW-T/GW-L", kennzahl: 30, lang: "Gerätewagen Transport/Logistik" },
    ],
    szenario: "Hochwasser {ort} — Lenzeinsatz und Deichverteidigung",
    soll: [1, 4, 13, 18],
    sollKfz: 5,
    landesweit: 36,
  },
  {
    anlage: "Anlage 2",
    kuerzel: "ZG",
    einheit: "Zug Gefahrstoff",
    traeger: feuerwehr,
    ortSchluessel: "mannheim",
    personal: [
      { rolle: F, funktion: "Zugführer/-in" },
      { rolle: U, funktion: "Gruppenführer/-in (LF)" },
      { rolle: U, funktion: "Gruppenführer/-in (GW-G/AB-G)" },
      { rolle: U, funktion: "Truppführer/-in (RW)" },
      { rolle: U, funktion: "Truppführer/-in (GW-AS/AB-AS)" },
      { rolle: U, funktion: "Truppführer/-in (MTW)" },
      { rolle: M, funktion: "Truppmann/Truppfrau (Gefahrstoff)", anzahl: 9, quali: "Chemikalienschutzanzug-Träger" },
      { rolle: M, funktion: "Maschinist/-in", anzahl: 3, fe: FE.C },
      { rolle: M, funktion: "Kraftfahrer/-in", anzahl: 3, fe: FE.C1 },
    ],
    fahrzeuge: [
      { kurz: "KdoW", kennzahl: 10, lang: "Kommandowagen (Zugführer)" },
      { kurz: "(H)LF 20/16", kennzahl: 20, lang: "Löschgruppenfahrzeug (H)LF 20 bzw. 16 — Brandschutzsicherstellung" },
      { kurz: "GW-G/AB-G", kennzahl: 41, lang: "Gerätewagen Gefahrgut bzw. Abrollbehälter Gefahrgut" },
      { kurz: "RW", kennzahl: 40, lang: "Rüstwagen" },
      { kurz: "GW-AS/AB-AS", kennzahl: 42, lang: "Gerätewagen bzw. Abrollbehälter Absperrung/Sicherung" },
      { kurz: "MTW", kennzahl: 19, lang: "Mannschaftstransportwagen" },
    ],
    szenario: "Gefahrstofffreisetzung {ort} — Abdichten, Auffangen, Absperrung",
    soll: [1, 5, 15, 21],
    sollKfz: 6,
    landesweit: 34,
  },
  {
    anlage: "Anlage 2",
    kuerzel: "ZMD",
    einheit: "Zug Messen und Dekontamination",
    traeger: feuerwehr,
    ortSchluessel: "karlsruhe",
    personal: [
      { rolle: F, funktion: "Zugführer/-in" },
      { rolle: U, funktion: "Gruppenführer/-in (Dekon-LKW P)" },
      { rolle: U, funktion: "Gruppenführer/-in ((H)LF 10/20)" },
      { rolle: U, funktion: "Truppführer/-in (ABC-ErkKW)" },
      { rolle: U, funktion: "Truppführer/-in (MTW)" },
      { rolle: M, funktion: "Helfer/-in Dekontamination", anzahl: 8 },
      { rolle: M, funktion: "Messtrupp-Helfer/-in", anzahl: 4 },
      { rolle: M, funktion: "Maschinist/-in", anzahl: 2, fe: FE.C },
      { rolle: M, funktion: "Kraftfahrer/-in", anzahl: 2, fe: FE.C1 },
    ],
    fahrzeuge: [
      { kurz: "KdoW", kennzahl: 10, lang: "Kommandowagen (Zugführer)" },
      { kurz: "MTW", kennzahl: 19, lang: "Mannschaftstransportwagen" },
      { kurz: "Dekon-LKW P", kennzahl: 43, lang: "Dekontaminations-Lkw Personen" },
      { kurz: "ABC-ErkKW", kennzahl: 44, lang: "ABC-Erkundungskraftwagen" },
      { kurz: "(H)LF 10/20", kennzahl: 24, lang: "Löschgruppenfahrzeug (H)LF 10 bzw. 20 — Brandschutzsicherstellung" },
    ],
    szenario: "Kontamination {ort} — Messen, Erkunden, Personendekontamination",
    soll: [1, 4, 16, 21],
    sollKfz: 5,
    landesweit: 42,
  },

  // ================================================== Anlage 3: Sanität und Betreuung
  {
    anlage: "Anlage 3",
    kuerzel: "EE-EV",
    einheit: "Einsatzeinheit Erstversorgung",
    traeger: drk,
    ortSchluessel: "remsmurr",
    personal: [
      { rolle: F, funktion: "Einheitsführer/-in (Modul Führung)" },
      { rolle: F, funktion: "stellv. Einheitsführer/-in (Modul Führung)" },
      { rolle: F, funktion: "Führungsassistent/-in (Modul Führung)" },
      { rolle: U, funktion: "Sprechfunker/-in (Modul Führung)", anzahl: 2 },
      { rolle: M, funktion: "Kraftfahrer/-in (Modul Führung)", fe: FE.C1 },
      { rolle: U, funktion: "Gruppenführer/-in (Modul Erstversorgung)" },
      { rolle: M, funktion: "Rettungssanitäter/-in (Modul Erstversorgung)", anzahl: 4, quali: "Rettungssanitäter" },
      { rolle: M, funktion: "Sanitätshelfer/-in (Modul Erstversorgung)", anzahl: 4 },
      { rolle: M, funktion: "Kraftfahrer/-in (Modul Transport)", anzahl: 4, fe: FE.C1 },
      { rolle: U, funktion: "Gruppenführer/-in (Modul Betreuung u. Logistik)" },
      { rolle: M, funktion: "Betreuungshelfer/-in (Modul Betreuung u. Logistik)", anzahl: 8 },
      { rolle: U, funktion: "Gruppenführer/-in (Modul Technik u. Sicherheit)" },
      { rolle: M, funktion: "Technikhelfer/-in (Modul Technik u. Sicherheit)", anzahl: 3 },
    ],
    fahrzeuge: [
      { kurz: "KdoW", kennzahl: 10, lang: "Kommandowagen (Modul Führung)" },
      { kurz: "MTW", kennzahl: 19, lang: "Mannschaftstransportwagen (Modul Führung/Reserve)" },
      { kurz: "GW-San", kennzahl: 60, lang: "Gerätewagen Sanität (Modul Erstversorgung)", anzahl: 2 },
      { kurz: "KTW", kennzahl: 61, lang: "Krankentransportwagen (Modul Transport)", anzahl: 2 },
      { kurz: "GW-Bt/Log", kennzahl: 62, lang: "Gerätewagen Betreuung/Logistik (Modul Betreuung u. Logistik)" },
      { kurz: "GW-Technik", kennzahl: 63, lang: "Gerätewagen Technik u. Sicherheit" },
    ],
    szenario: "MANV {ort} — Sichtung, Erstversorgung und Herstellung der Transportfähigkeit",
    soll: [3, 5, 24, 32],
    sollKfz: 8,
    landesweit: 66,
  },
  {
    anlage: "Anlage 3",
    kuerzel: "EE-B",
    einheit: "Einsatzeinheit Behandlung",
    traeger: asb,
    ortSchluessel: "konstanz",
    personal: [
      { rolle: F, funktion: "Einheitsführer/-in (Modul Führung)" },
      { rolle: F, funktion: "stellv. Einheitsführer/-in (Modul Führung)" },
      { rolle: F, funktion: "Führungsassistent/-in (Modul Führung)" },
      { rolle: U, funktion: "Sprechfunker/-in (Modul Führung)", anzahl: 2 },
      { rolle: M, funktion: "Kraftfahrer/-in (Modul Führung)", fe: FE.C1 },
      { rolle: U, funktion: "Gruppenführer/-in (Modul Behandlung)" },
      { rolle: M, funktion: "Notfallsanitäter/-in (Modul Behandlung)", anzahl: 4, quali: "Notfallsanitäter" },
      { rolle: M, funktion: "Sanitätshelfer/-in (Modul Behandlung)", anzahl: 4 },
      { rolle: M, funktion: "Kraftfahrer/-in (Modul Transport)", anzahl: 4, fe: FE.C1 },
      { rolle: U, funktion: "Gruppenführer/-in (Modul Betreuung u. Logistik)" },
      { rolle: M, funktion: "Betreuungshelfer/-in (Modul Betreuung u. Logistik)", anzahl: 8 },
      { rolle: U, funktion: "Gruppenführer/-in (Modul Technik u. Sicherheit)" },
      { rolle: M, funktion: "Technikhelfer/-in (Modul Technik u. Sicherheit)", anzahl: 3 },
    ],
    fahrzeuge: [
      { kurz: "KdoW", kennzahl: 10, lang: "Kommandowagen (Modul Führung)" },
      { kurz: "MTW", kennzahl: 19, lang: "Mannschaftstransportwagen (Modul Führung/Reserve)" },
      { kurz: "GW-San", kennzahl: 60, lang: "Gerätewagen Sanität (Modul Behandlung, Zusatzausstattung Behandlungsplatz)", anzahl: 2 },
      { kurz: "KTW", kennzahl: 61, lang: "Krankentransportwagen (Modul Transport)", anzahl: 2 },
      { kurz: "GW-Bt/Log", kennzahl: 62, lang: "Gerätewagen Betreuung/Logistik (Modul Betreuung u. Logistik)" },
      { kurz: "GW-Technik", kennzahl: 63, lang: "Gerätewagen Technik u. Sicherheit" },
    ],
    szenario: "MANV {ort} — Aufbau und Betrieb des Behandlungsplatzes",
    soll: [3, 5, 24, 32],
    sollKfz: 8,
    landesweit: 54,
  },
  {
    anlage: "Anlage 3",
    kuerzel: "BRZ",
    einheit: "Bergrettungszug",
    traeger: bergwacht,
    ortSchluessel: "waldshut",
    personal: [
      { rolle: F, funktion: "Zugführer/-in (Zugtrupp)" },
      { rolle: F, funktion: "stellv. Zugführer/-in (Zugtrupp)" },
      { rolle: M, funktion: "Sprechfunker/-in (Zugtrupp)", anzahl: 2, quali: "Sprechfunker" },
      { rolle: U, funktion: "Gruppenführer/-in (Rettungsgruppe)", anzahl: 3 },
      { rolle: M, funktion: "Bergretter/-in", anzahl: 21, quali: "Bergwacht-Einsatzausbildung" },
    ],
    fahrzeuge: [
      { kurz: "KdoW (Bergrettung)", kennzahl: 10, lang: "Bergrettungsfahrzeug als Kommandowagen (Zugtrupp)" },
      { kurz: "Bergrettungsfahrzeug gl.", kennzahl: 71, lang: "geländegängiges Bergrettungsfahrzeug (je Rettungsgruppe)", anzahl: 3 },
    ],
    szenario: "Vermisstensuche/Absturz {ort} — Bergrettung im unwegsamen Gelände",
    soll: [2, 3, 23, 28],
    sollKfz: 4,
    landesweit: 6,
    gemisch: true,
  },
  {
    anlage: "Anlage 3",
    kuerzel: "LKT",
    einheit: "Luftkrankentransporttrupp",
    traeger: juh,
    ortSchluessel: "boeblingen",
    personal: [
      { rolle: F, funktion: "Ärztin/Arzt", quali: "Notarzt" },
      { rolle: U, funktion: "Rettungsassistent/-in", quali: "Rettungsassistent" },
      { rolle: M, funktion: "Pilot/-in", quali: "Hubschrauberpilot (Beruf)", fe: FE.NONE },
    ],
    fahrzeuge: [
      { kurz: "RTH", kennzahl: 90, lang: "Rettungshubschrauber (Luftfahrzeugkennzeichen statt Kfz-Kennzeichen)" },
    ],
    szenario: "Verlegung {ort} — Luftkrankentransport zwischen Kliniken",
    soll: [1, 1, 1, 3],
    sollKfz: 1,
    landesweit: 7,
  },
  {
    anlage: "Anlage 3",
    kuerzel: "RHS",
    einheit: "Rettungshundestaffel",
    traeger: rettungshunde,
    ortSchluessel: "biberach",
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Hundeführer/-in", anzahl: 3, quali: "Rettungshundeführer" },
      { rolle: M, funktion: "Suchgruppenhelfer/-in", anzahl: 3 },
    ],
    fahrzeuge: [{ kurz: "MTW", kennzahl: 19, lang: "Mannschaftstransportwagen" }],
    szenario: "Vermisstensuche {ort} — Flächen- und Trümmersuche mit Rettungshunden",
    soll: [0, 1, 6, 7],
    sollKfz: 1,
    landesweit: 5,
  },

  // ============================================================= Anlage 4: Wasserrettung
  {
    anlage: "Anlage 4",
    kuerzel: "WRZ",
    einheit: "Wasserrettungszug",
    traeger: dlrg,
    ortSchluessel: "bodensee",
    personal: [
      { rolle: F, funktion: "Zugführer/-in (Führungstrupp)" },
      { rolle: U, funktion: "Zugtruppführer/-in (Führungstrupp)" },
      { rolle: M, funktion: "Sprechfunker/-in (Führungstrupp)", anzahl: 2, quali: "Sprechfunker" },
      { rolle: U, funktion: "Gruppenführer/-in (Strömungsrettergruppe)" },
      { rolle: M, funktion: "Strömungsretter/-in", anzahl: 5, quali: "Strömungsretter" },
      { rolle: U, funktion: "Gruppenführer/-in (Bootsgruppe)" },
      { rolle: M, funktion: "Bootsführer/-in", quali: "Bootsführerschein Binnen" },
      { rolle: M, funktion: "Rettungsschwimmer/-in (Bootsgruppe)", anzahl: 3, quali: "Rettungsschwimmabzeichen Silber" },
      { rolle: U, funktion: "Gruppenführer/-in (Tauchgruppe)" },
      { rolle: M, funktion: "Rettungstaucher/-in", anzahl: 5, quali: "Rettungstaucher" },
    ],
    fahrzeuge: [
      { kurz: "KdoW", kennzahl: 10, lang: "Kommandowagen (Führungstrupp)" },
      { kurz: "GW-W", kennzahl: 70, lang: "Gerätewagen Wasserrettung" },
      { kurz: "GW-StrR", kennzahl: 72, lang: "Gerätewagen Strömungsrettung" },
      { kurz: "GW-Boot", kennzahl: 73, lang: "Gerätewagen mit Mehrzweckboot" },
      { kurz: "GW-Tauchen", kennzahl: 74, lang: "Gerätewagen Tauchen" },
      { kurz: "MTW", kennzahl: 19, lang: "Mannschaftstransportwagen" },
      { kurz: "Anh Boot", lang: "Bootsanhänger", ohneKennzeichen: "Anh Boot" },
      { kurz: "Anh Tauchen", lang: "Anhänger Tauchgerät", ohneKennzeichen: "Anh Tauchen" },
    ],
    szenario: "Hochwasser {ort} — Menschenrettung aus Wassergefahren am Bodensee",
    soll: [1, 4, 16, 21],
    sollKfz: 6,
    landesweit: 10,
    gemisch: true,
  },

  // ============================================================ Anlage 5: Veterinärwesen
  {
    anlage: "Anlage 5",
    kuerzel: "VetZ",
    einheit: "Veterinärzug",
    traeger: kats,
    ortSchluessel: "ravensburg",
    personal: [
      { rolle: F, funktion: "Tierärztin/Tierarzt (Zugführung)", anzahl: 2, quali: "Approbation Tierarzt" },
      { rolle: M, funktion: "Helfer/-in Veterinärwesen", anzahl: 18 },
    ],
    fahrzeuge: [{ kurz: "Lkw", kennzahl: 80, lang: "Lastkraftwagen (Tiertransport/Gerät)" }],
    szenario: "Tierseuchenlage {ort} — veterinärmedizinische Versorgung und Tiertransport",
    soll: [2, 0, 18, 20],
    sollKfz: 1,
    landesweit: 3,
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
  const zweite = personen.filter((p) => p.staerkeRolle !== R.MANNSCHAFT)[1];
  if (zweite && zweite.kontakte.length === 0 && wuerfel(0.6)) {
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
  return `${kfz}-${2000 + (laufendeNummer++ % 8000)}`;
}

function fahrzeugeBauen(specs: FzSpec[], ort: BwOrt, traeger: Traeger): Fahrzeug[] {
  // Dritte Teilkennzahl = Ordnungsnummer, laufend je gleicher Funkkennziffer.
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
          eigenerStandort: false,
          ort: kreisKurz(ort),
          teile: [ort.standort, s.kennzahl, lfd],
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
  ort: BwOrt;
  anlage: string;
  kuerzel: string;
}

function bogenBauen(spec: BogenSpec): BeispielBogen {
  const ort = BW_ORTE[spec.ortSchluessel]!;
  const personal = personalBauen(spec.personal);
  const fahrzeuge = fahrzeugeBauen(spec.fahrzeuge, ort, spec.traeger);

  const hierarchie: HierarchieEbene[] = [
    { bezeichnung: { freitext: `Regierungsbezirk ${ort.rb}` }, name: kreisKurz(ort) },
    ...spec.traeger.ebene(ort),
  ];

  const tag = datumAusIso("2026-07-16") + ganz(0, 2);
  const stand = tag * MINUTEN_JE_TAG + ganz(6, 21) * 60 + ganz(0, 59);
  const dauer = ganz(1, 4);
  const diesel = fahrzeuge.reduce((s, fz) => s + dieselFuer(fz.typ.freitext ?? ""), 0);

  const bogen: Erfassungsbogen = {
    schemaVersion: SCHEMA_VERSION,
    uebung: true, // Beispielbogen: überall als Übung gekennzeichnet (Störer, PDF-Wasserzeichen)
    stand,
    einheit: {
      organisation: spec.traeger.org,
      organisationName: spec.traeger.organisationName(ort),
      einheitsTyp: { freitext: `${spec.einheit} (${spec.kuerzel})` },
      hierarchie,
    },
    einsatz: {
      zeitraumVon: tag,
      zeitraumBis: tag + dauer,
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
      `Stärke ${spec.soll[0]}/${spec.soll[1]}/${spec.soll[2]}/${spec.soll[3]} (einfache Besetzung; `
      + `alle Einheiten werden in Doppelbesetzung vorgehalten) nach ${QUELLE}, ${spec.anlage}. `
      + `Landesweit sind ${spec.landesweit} Einheiten dieses Typs vorgesehen. `
      + "Die Landkreis-Zuordnung dieses Beispiels ist exemplarisch gewählt, nicht der "
      + "Verordnungstabelle Zeile für Zeile entnommen — Stärke und Fahrzeuge dagegen sind "
      + "verordnungsgenau. Die Funkkennziffern der Fahrzeuge sind plausibel, aber nicht "
      + "vollständig amtlich belegt (siehe README).",
  };

  return {
    datei: `${slug(spec.kuerzel)}-${slug(spec.einheit)}-${slug(ort.ort)}`,
    bogen,
    ort,
    anlage: spec.anlage,
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
 * Selbstprüfung gegen die Anlagen der VwV KatSD: personelle Stärke und
 * Zahl der Einsatz-Kfz (Anhänger zählen nicht mit). Zusätzlich trägt jedes
 * Einsatz-Kfz einen vollständigen Funkrufnamen aus drei Teilkennzahlen, jeder
 * Anhänger keinen.
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
    const anhaengerKz = new Set(
      spec.fahrzeuge.filter((x) => x.ohneKennzeichen).map((x) => x.ohneKennzeichen!),
    );
    const kfz = b.bogen.fahrzeuge.filter((fz) => !anhaengerKz.has(fz.kennzeichen ?? ""));
    if (kfz.length !== spec.sollKfz) {
      fehler.push(`${b.datei}: ${kfz.length} Einsatz-Kfz ≠ Anlage ${spec.sollKfz}`);
    }
    for (const fz of b.bogen.fahrzeuge) {
      const kurz = fz.typ.freitext ?? "?";
      const anhaenger = anhaengerKz.has(fz.kennzeichen ?? "");
      if (anhaenger && fz.funkrufname) {
        fehler.push(`${b.datei}: Anhänger ${kurz} sollte keinen Funkrufnamen führen`);
      }
      if (!anhaenger && fz.funkrufname?.teile.length !== 3) {
        fehler.push(`${b.datei}: ${kurz} ohne vollständigen Funkrufnamen (drei Teilkennzahlen)`);
      }
    }
  });
  if (fehler.length > 0) {
    throw new Error(`Selbstprüfung fehlgeschlagen:\n  ${fehler.join("\n  ")}`);
  }
}

// ---------------------------------------------------------------- Hauptlauf

const beispiele: BeispielBogen[] = SPECS.map(bogenBauen);

pruefen(beispiele);

const ausgabe = join(wurzel, "examples", "katastrophenschutz", "badenwuerttemberg");
mkdirSync(ausgabe, { recursive: true });
for (const datei of readdirSync(ausgabe)) {
  if (datei.endsWith(".json")) rmSync(join(ausgabe, datei));
}

for (const bsp of beispiele) {
  const qr = await qrSatz(bsp.bogen);
  roundtrip(qr, bsp.bogen.personal.length, bsp.datei);
  writeFileSync(join(ausgabe, `${bsp.datei}.json`), JSON.stringify(bsp.bogen, null, 2) + "\n");
}

const zeilen = beispiele.map((b, i) => {
  const s = staerke(b.bogen);
  const spec = SPECS[i]!;
  return `| ${b.datei} | ${b.anlage} | ${b.kuerzel} | ${b.ort.ort} | ${b.ort.rb} | ${s.fuehrer}/${s.unterfuehrer}/${s.mannschaft}/${s.gesamt} | ${spec.sollKfz} | ${b.bogen.fahrzeuge.length} | ${spec.landesweit} |`;
});
writeFileSync(
  join(ausgabe, "README.md"),
  `# Beispiel-Erfassungsbögen — Katastrophenschutz Baden-Württemberg

${beispiele.length} generierte Beispiel-Einheiten nach der baden-württembergischen
**VwV KatSD** (Verwaltungsvorschrift des Innenministeriums über die Stärke und
Gliederung des Katastrophenschutzdienstes, vom 24. September 2012, GABl. Nr. 12
vom 31. Oktober 2012, S. 802) mit ihren **Anlagen 2** (Brandschutz, Technische
Hilfe, ABC-Schutz), **3** (Sanität und Betreuung), **4** (Wasserrettung) und
**5** (Veterinärwesen).

Alle Einheiten werden in **Doppelbesetzung** vorgehalten; die angegebenen
Stärken sind jeweils die **einfache Besetzung**.

Alle Personen, Standort-Zuordnungen und Kennzeichen sind **fiktiv**.

## Warum ein Bogen je Einheit — und nicht je Teileinheit

Wie die Brandenburgische KatSV stellt die VwV KatSD die taktischen Einheiten
als **geschlossene Züge mit interner Fahrzeug-Tabelle** dar, nicht als
unabhängig einsetzbare Teileinheiten wie die SächsKatSVO oder die KatS-StAN
Niedersachsen. Deshalb gibt es hier ${beispiele.length} Bögen — einen je
taktischer Einheit — statt einer Zerlegung in Trupps, Staffeln und Gruppen.
Eine solche Gliederung wäre frei erfunden.

## Zur Landkreis-Zuordnung

Die VwV KatSD weist die Einheiten der Anlage 2 konkreten Land- und
Stadtkreisen je Regierungsbezirk zu. Diese Einzeltabelle lag beim Erstellen
dieses Generators nicht vollständig vor. Die hier gezeigten Standorte sind
deshalb **beispielhaft** gewählt — reale, plausible Land-/Stadtkreise über
alle vier Regierungsbezirke (Stuttgart, Karlsruhe, Freiburg, Tübingen)
gestreut, aber **nicht** Zeile für Zeile der Verordnungstabelle entnommen.
**Stärke- und Fahrzeugdaten dagegen sind verordnungsgenau** und werden beim
Generieren gegen die Anlagen geprüft. Bei drei Einheiten (Bergrettungszug,
Luftkrankentransporttrupp, Veterinärzug) ist zusätzlich die reale
Standortliste bekannt; dort wurde einer der tatsächlichen Standorte verwendet
(Veterinärzug: einer von Schwäbisch Hall, Freiburg, Ravensburg).

## Funkrufnamen

Nach dem Funkrufnamenplan für die nichtpolizeilichen BOS Baden-Württemberg
(Erlass 5-0268.7/1 vom 21.07.2003 des Innenministeriums):

> \`<Kennwort> <Ortsbezeichnung> <1. Teilkennzahl>/<2. Teilkennzahl>-<3. Teilkennzahl>\`

* **Kennwort** je Trägerorganisation — Feuerwehr „Florian", ASB „Sama",
  Bergwacht „Bergwacht", DLRG „Pelikan", DRK „Rotkreuz", JUH „Akkon", Malteser
  „Johannes", Katastrophenschutzbehörden (Regieeinheiten) „Kater", THW
  „Heros", Rettungshunde „Antonius". Kennwörter, die nicht im globalen
  Vokabular stehen (Bergwacht, Antonius, Kater), werden als Freitext geführt.
* **Ortsbezeichnung** ist Gemeinde bzw. Landkreis; haben Stadt- und Landkreis
  denselben Namen, bekommt der Landkreis den Zusatz „-Land" (in diesen
  Beispielen nicht aufgetreten, da keine zwei gleichnamigen Kreise gewählt
  wurden).
* **1. Teilkennzahl** = Standort (fiktiv, Vergabe liegt bei der unteren
  Katastrophenschutzbehörde).
* **2. Teilkennzahl** = Funkkennziffer des Fahrzeugtyps. Bekannt sind aus dem
  Erlass nur die Ankerpunkte 10 KdoW, 11 ELW1/FüKW, 12 ELW2; alle weiteren
  Kennziffern hier (19 MTW, 20 (H)LF20/16, 22 LF-KatS, 24 (H)LF10/20, 30
  GW-T/GW-L, 31 SW2000, 32 AB-Schlauch, 40 RW, 41 GW-G/AB-G, 42 GW-AS/AB-AS,
  43 Dekon-LKW P, 44 ABC-ErkKW, 60 GW-San, 61 KTW, 62 GW-Bt/Log, 63
  GW-Technik, 70 GW-W, 71 Bergrettungsfahrzeug, 72 GW-StrR, 73 GW-Boot, 74
  GW-Tauchen, 80 Lkw Veterinärzug, 90 Luftrettung) sind **plausibel, aber
  nicht vollständig amtlich belegt** — sie dienen nur dazu, vollständige und
  in sich stimmige Funkrufnamen zu zeigen.
* **3. Teilkennzahl** = Ordnungsnummer, laufend je Funkkennziffer.
* **Anhänger** (Boots-, Tauchanhänger) führen keinen Funkrufnamen und zählen
  nicht als Einsatz-Kfz. Der Rettungshubschrauber des Luftkrankentransport-
  trupps führt in dieser vereinfachten Darstellung ebenfalls eine
  Funkkennziffer (90); tatsächlich gilt für Luftfahrzeuge ein eigenes
  Kennzeichnungssystem.

## Träger

Die Fachdienste Brandschutz, Technische Hilfe und ABC-Schutz (Anlage 2) sind
durchgängig den öffentlichen Feuerwehren zugeordnet. Sanität und Betreuung
(Anlage 3) verteilen sich beispielhaft auf DRK, ASB, Bergwacht (organisatorisch
beim DRK), Johanniter und die Rettungshundestaffeln (Kennwort „Antonius").
Der Wasserrettungszug (Anlage 4) ist der DLRG zugeordnet, der Veterinärzug
(Anlage 5) als Regieeinheit der unteren Katastrophenschutzbehörde
(Kennwort „Kater").

Neu erzeugen mit: \`npm run beispiele:kats-bw\` (deterministisch, fester Zufalls-Seed).

| Datei | Anlage | Einheit | Ort | Regierungsbezirk | Stärke | Kfz (Anlage) | Fahrzeuge im Bogen | Landesweit |
|---|---|---|---|---|---|---|---|---|
${zeilen.join("\n")}

Die Spalte **Kfz (Anlage)** ist die Zahl der Einsatz-Kfz laut Verordnung,
**Fahrzeuge im Bogen** zählt zusätzlich die mitgeführten Anhänger, und
**Landesweit** ist die Gesamtzahl dieses Einheitstyps in Baden-Württemberg
(keine Personalstärke).
`,
);

console.log(`${beispiele.length} Bögen nach ${ausgabe} geschrieben.`);
