/**
 * Erzeugt Beispiel-Erfassungsbögen für den Bevölkerungsschutz des Freistaates
 * Bayern als JSON nach examples/katastrophenschutz/bayern/. Abgelegt ist nur
 * das Bogen-JSON; die PDF entsteht erst beim Anklicken in der App aus dem
 * aktuellen Layout.
 *
 * Aufruf (Node ≥ 22): npm run beispiele:kats-by
 *
 * WICHTIGER UNTERSCHIED zu den anderen acht Ländern: Für Bayern gibt es —
 * anders als z. B. die ThürKatSVO oder die VwV KatSD Baden-Württemberg —
 * KEINE landesweite Verordnung mit einer verbindlichen Stärke- und
 * Ausrüstungsnachweisung je KatS-Teileinheit. Das Bayerische
 * Katastrophenschutzgesetz (BayKSG) regelt Zuständigkeiten und Pflichten,
 * überlässt die konkrete Gliederung aber weitgehend den Landkreisen und
 * kreisfreien Städten. Diese Recherche (siehe auch die Notiz in der
 * Projekt-Memory, Abschnitt „Bayern") hat mehrfach danach gesucht (u. a.
 * „Bayern Hilfeleistungskontingent Stärke Fahrzeuge", „BayKSG
 * Ausführungsvorschrift StAN", „Sanitäts-Hilfeleistungskontingent Modul
 * Behandlungsplatz") und KEINE solche landesweite Tabelle gefunden.
 *
 * Gefunden wurde stattdessen die bayernweit standardisierte KONZEPTION der
 * FEUERWEHR-HILFELEISTUNGSKONTINGENTE, die das Staatsministerium des Innern
 * den Landkreisen und kreisfreien Städten vorgibt (Grundkomponenten
 * Führung/Verbindung, Logistik, Unterkunft, Sanitätsdienst, Personal, dazu
 * Spezialkomponenten Hochwasser/Pumpen, Sturmschaden/Dachsicherung,
 * ABC-Abwehr sowie das eigenständige Wasserfördersystem Bayern) — mit realen
 * Personenzahlen UND Fahrzeuglisten je Komponente, öffentlich dokumentiert
 * von der Freiwilligen Feuerwehr München, die diese Komponenten als eine von
 * mehreren bayerischen Kommunen stellt:
 *   https://www.ffw-muenchen.de/ueber-uns/hilfeleistungskontingente/
 *   (Unterseiten: standard/, hochwasser/pumpen/, sturmschaden/dachsicherung/,
 *   abc-abwehr/, wasserfoerdersystem-bayern/)
 * Volltext per `curl -sL -A "Mozilla/5.0" <url>` + HTML-Tag-Strip gelesen,
 * nicht nur die WebFetch-Zusammenfassung.
 *
 * Ergänzt um die Schnell-Einsatz-Gruppen (SEG) des Bayerischen Roten Kreuzes
 * — SEG San (Arzttrupp/Transporttrupp) und SEG Bt (Betreuungstrupp/
 * Verpflegungstrupp) —, ebenfalls ein bayernweites Konzept (seit den 1990er-
 * Jahren landeseinheitlich in den Ausbildungsunterlagen der BRK-Bereitschaften
 * beschrieben), dokumentiert im „Handbuch für Einsatzkräfte in den
 * Bereitschaften" (Stand 15.03.2005), hier über den Kreisverband Höchstadt
 * gelesen: https://www.brk-hoechstadt.de/Downloads/Handbuch_fuer_Einsatzkraefte.pdf
 *
 * Diese Struktur ist damit KEIN Pendant zu einer Landesverordnung wie in den
 * anderen acht Ländern, sondern — wie die niedersächsische FwVO
 * (scripts/kats-nds-beispielboegen.mts als Vorbild für dieses
 * Modellierungsprinzip) — ein bayernweit standardisiertes Konzept mit real
 * dokumentierten Stärke- und Fahrzeugangaben je Komponente. Die
 * Rollenverteilung INNERHALB einer Komponente (wer genau Gruppenführer,
 * Maschinist oder Truppmann ist) ist dagegen — wo die Quelle nur die
 * Gesamtstärke und die Fahrzeugliste, aber keine Einzelrollen nennt — ein
 * plausibles, in sich stimmiges Modell und NICHT wörtlich der Quelle
 * entnommen; das ist je Bogen im Feld „Sonstiges" vermerkt. Gesamtstärke UND
 * Fahrzeugliste je Komponente sind dagegen quellengenau und werden beim
 * Generieren geprüft.
 *
 * Funkrufnamen: Ein bayerisches Funkrufnamenverzeichnis mit amtlichen
 * Fahrzeug-Kennzahlen wurde bei der Recherche nicht gefunden. Wie bei
 * Thüringen wird deshalb die bundesweite OPTA-Systematik der BDBOS analog
 * angewendet: „<Kennwort> <Ortsbezeichnung> <Standort>/<Fahrzeugkennzahl>-
 * <laufende Nummer>". Kennwort nach dem globalen FUNKRUF_KENNWOERTER-
 * Vokabular: Feuerwehr „Florian", Bayerisches Rotes Kreuz „Rotkreuz". Die
 * Fahrzeugkennzahlen sind — wie in Baden-Württemberg — plausibel gewählt,
 * aber NICHT amtlich belegt.
 *
 * Standort-Zuordnung: Die Feuerwehr-Hilfeleistungskontingente und BRK-SEG
 * gibt es in nahezu jedem bayerischen Landkreis bzw. jeder kreisfreien Stadt;
 * welche Komponente hier an welchem Ort steht, ist frei über alle sieben
 * Regierungsbezirke gestreut und rein BEISPIELHAFT — Stärke und Fahrzeuge
 * dagegen sind wie oben beschrieben quellengenau.
 *
 * Fiktiv sind alle Personen, Standort-Zuordnungen und Kennzeichen.
 *
 * Am Ende läuft eine Selbstprüfung (Stärke je Komponente gegen die Quelle,
 * Zahl der Einsatzfahrzeuge gegen die Quelle, vollständiger Funkrufname je
 * motorisiertem Fahrzeug, QR-Roundtrip); die README im Zielordner bekommt
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
const rnd = prng(20050315); // Datum des BRK-Handbuchs "Einsatzkräfte in den Bereitschaften"
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
  "Andreas", "Anton", "Benedikt", "Bernhard", "Christian", "Daniel", "Dominik", "Florian",
  "Franz", "Georg", "Hans", "Josef", "Johann", "Korbinian", "Lorenz", "Ludwig",
  "Manuel", "Marcus", "Markus", "Martin", "Matthias", "Max", "Maximilian", "Michael",
  "Norbert", "Patrick", "Peter", "Philipp", "Quirin", "Rainer", "Robert", "Rudolf",
  "Sebastian", "Sepp", "Simon", "Stefan", "Thomas", "Tobias", "Toni", "Wolfgang",
] as const;
const VORNAMEN_W = [
  "Andrea", "Angelika", "Anna", "Barbara", "Bianca", "Birgit", "Christine", "Claudia",
  "Elisabeth", "Franziska", "Gabriele", "Heidi", "Ingrid", "Johanna", "Julia", "Katharina",
  "Katrin", "Kathrin", "Kerstin", "Magdalena", "Maria", "Marion", "Martina", "Michaela",
  "Monika", "Nadja", "Petra", "Regina", "Resi", "Sabine", "Sandra", "Silvia",
  "Simone", "Sonja", "Stefanie", "Susanne", "Theresa", "Ursula", "Veronika", "Waltraud",
] as const;
const NACHNAMEN = [
  "Aigner", "Bauer", "Baumgartner", "Berger", "Brandner", "Brunner", "Eder", "Fischer",
  "Frank", "Gruber", "Gschwendtner", "Haas", "Hofer", "Hofmann", "Huber", "Kellner",
  "Kirchner", "Klein", "Kraus", "Kraler", "Lang", "Lechner", "Lindner", "Maier",
  "Maurer", "Mayer", "Meier", "Meyer", "Moser", "Müller", "Obermeier", "Pichler",
  "Pöllinger", "Reindl", "Riedl", "Sailer", "Scharrer", "Schmid", "Schmidbauer", "Schneider",
  "Schuster", "Seidl", "Sommer", "Stauber", "Steiner", "Stöckl", "Vogl", "Wagner",
  "Weber", "Wimmer", "Winkler", "Wolf", "Ziegler",
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

// ----------------------------------------------------- Bayern: Standorte

interface ByOrt {
  ort: string;
  kreis: string;
  kfz: string;
  /** Regierungsbezirk (nur Dokumentation/README). */
  rb: string;
  /** Fiktive Standortkennzahl der OPTA-Analogie. */
  standort: number;
}

const BY_ORTE: Record<string, ByOrt> = {
  muenchen: { ort: "München", kreis: "Landeshauptstadt München", kfz: "M", rb: "Oberbayern", standort: 10 },
  ingolstadt: { ort: "Ingolstadt", kreis: "Stadt Ingolstadt", kfz: "IN", rb: "Oberbayern", standort: 12 },
  augsburg: { ort: "Augsburg", kreis: "Stadt Augsburg", kfz: "A", rb: "Schwaben", standort: 10 },
  kempten: { ort: "Kempten (Allgäu)", kreis: "Stadt Kempten", kfz: "KE", rb: "Schwaben", standort: 14 },
  nuernberg: { ort: "Nürnberg", kreis: "Stadt Nürnberg", kfz: "N", rb: "Mittelfranken", standort: 10 },
  fuerth: { ort: "Fürth", kreis: "Stadt Fürth", kfz: "FÜ", rb: "Mittelfranken", standort: 12 },
  wuerzburg: { ort: "Würzburg", kreis: "Stadt Würzburg", kfz: "WÜ", rb: "Unterfranken", standort: 10 },
  regensburg: { ort: "Regensburg", kreis: "Stadt Regensburg", kfz: "R", rb: "Oberpfalz", standort: 10 },
  bayreuth: { ort: "Bayreuth", kreis: "Stadt Bayreuth", kfz: "BT", rb: "Oberfranken", standort: 10 },
  passau: { ort: "Passau", kreis: "Stadt Passau", kfz: "PA", rb: "Niederbayern", standort: 10 },
  landshut: { ort: "Landshut", kreis: "Stadt Landshut", kfz: "LA", rb: "Niederbayern", standort: 12 },
};

// ------------------------------------------------------------------ Träger

interface Traeger {
  org: OrganisationsTyp;
  kennwort: VokabularWert;
  organisationName: (o: ByOrt) => string;
  ebene: (o: ByOrt) => HierarchieEbene[];
}

/** FUNKRUF_KENNWOERTER-Codes (src/model.ts). */
const KW = { FLORIAN: 2, ROTKREUZ: 3 } as const;

const feuerwehr: Traeger = {
  org: OrganisationsTyp.FEUERWEHR,
  kennwort: { code: KW.FLORIAN },
  organisationName: (o) => `Feuerwehr-Hilfeleistungskontingent ${o.kreis}`,
  ebene: (o) => [
    { bezeichnung: { freitext: "Regierungsbezirk" }, name: o.rb },
    { bezeichnung: { freitext: "Untere KatS-Behörde" }, name: o.kreis },
  ],
};

const brk: Traeger = {
  org: OrganisationsTyp.DRK,
  kennwort: { code: KW.ROTKREUZ },
  organisationName: (o) => `Bayerisches Rotes Kreuz — Kreisverband ${o.kreis}`,
  ebene: (o) => [
    { bezeichnung: { freitext: "Regierungsbezirk" }, name: o.rb },
    { bezeichnung: { freitext: "BRK-Kreisverband" }, name: o.kreis },
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
  if (/^(WLF|LKW)/.test(kurz)) return 120;
  if (/^(HLF|RW|GW|DLA)/.test(kurz)) return 70;
  if (/^(ELW|KdoW|MZF|RTW|ATrKW|KTW|Bt-Kombi)/.test(kurz)) return 45;
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
  /** Anhänger statt Kfz-Kennzeichen; zählen nicht als Einsatz-Kfz. */
  ohneKennzeichen?: string;
  /** Fiktive Fahrzeugkennzahl der OPTA-Analogie; fehlt = kein Funkrufname. */
  kennzahl?: number;
}

interface BogenSpec {
  /** Übergeordnetes Konzept ("Feuerwehr-Hilfeleistungskontingent Standard" o. ä.). */
  konzept: string;
  kuerzel: string;
  einheit: string;
  traeger: Traeger;
  ortSchluessel: keyof typeof BY_ORTE;
  personal: PlatzSpec[];
  fahrzeuge: FzSpec[];
  szenario: string; // {ort} wird ersetzt
  /** Gesamtstärke laut Quelle als "Führer/Unterführer/Mannschaft/Gesamt" — wird geprüft. */
  soll: [number, number, number, number];
  /** Zahl der Einsatz-Kfz laut Quelle (ohne Anhänger) — wird geprüft. */
  sollKfz: number;
  /** Hinweis auf Modellierungsentscheidungen für die README/das Sonstiges-Feld. */
  hinweis?: string;
  gemisch?: boolean;
}

const F = R.FUEHRER;
const U = R.UNTERFUEHRER;
const M = R.MANNSCHAFT;

const QUELLE_FFHLK =
  "Feuerwehr-Hilfeleistungskontingente Bayern, dokumentiert von der Freiwilligen Feuerwehr München " +
  "(https://www.ffw-muenchen.de/ueber-uns/hilfeleistungskontingente/)";
const QUELLE_BRK =
  "Handbuch für Einsatzkräfte in den Bereitschaften, Kreisverband Höchstadt (Stand 15.03.2005), " +
  "Kapitel 3.3 Betreuungsdienst / 4.1 Sanitätsdienst";

const HINWEIS_ROLLEN =
  "Die Quelle nennt Gesamtstärke und Fahrzeugliste der Komponente; die Verteilung auf einzelne " +
  "Funktionen (wer genau Gruppenführer, Maschinist oder Truppmann ist) ist ein plausibles, in sich " +
  "stimmiges Modell und nicht wörtlich der Quelle entnommen.";

const SPECS: BogenSpec[] = [
  // ===================================== Feuerwehr-HLK: Grundkomponenten
  // (identisch in den Kontingenten Standard, Hochwasser/Pumpen,
  // Sturmschaden/Dachsicherung und ABC-Abwehr — hier je ein Bogen)
  {
    konzept: "Feuerwehr-Hilfeleistungskontingent (Grundkomponenten)",
    kuerzel: "FF-HLK Führung", einheit: "Grundkomponente „Führung/Verbindung”",
    traeger: feuerwehr, ortSchluessel: "muenchen",
    personal: [
      { rolle: F, funktion: "Kontingentführer/-in" },
      { rolle: F, funktion: "stellv. Kontingentführer/-in" },
      { rolle: U, funktion: "Verwaltungsbeamter/-in" },
      { rolle: F, funktion: "Sachgebietsleiter/-in S1 (Personal)" },
      { rolle: F, funktion: "Sachgebietsleiter/-in S2/3 (Lage/Einsatz)" },
      { rolle: F, funktion: "Sachgebietsleiter/-in S4 (Versorgung)" },
      { rolle: F, funktion: "Sachgebietsleiter/-in S5 (Presse-/Öffentlichkeitsarbeit)" },
      { rolle: F, funktion: "Sachgebietsleiter/-in S6 (Führungsunterstützung/IuK)" },
      { rolle: M, funktion: "Helfer/-in Unterstützungsgruppe Kontingentführung", anzahl: 5, quali: "Sprechfunker" },
      { rolle: M, funktion: "Kradmelder/-in", anzahl: 2 },
    ],
    fahrzeuge: [
      { kurz: "KdoW", kennzahl: 10, lang: "Kommandowagen", anzahl: 2 },
      { kurz: "GW-IuK", kennzahl: 30, lang: "Gerätewagen Informations- und Kommunikationstechnik" },
      { kurz: "Kraftrad", kennzahl: 95, lang: "Kraftrad Kradmelder", anzahl: 2 },
    ],
    szenario: "Kontingenteinsatz — Kontingentführung stellt Verbindung zur Schadensstelle und zur Logistik in {ort} her",
    soll: [7, 1, 7, 15], sollKfz: 5,
    hinweis: HINWEIS_ROLLEN
      + " Die Grundkomponente „Führung/Verbindung“ wird laut Quelle in jedem der vier Kontingenttypen "
      + "Standard, Hochwasser/Pumpen, Sturmschaden/Dachsicherung und ABC-Abwehr baugleich gestellt — "
      + "hier deshalb nur einmal abgebildet.",
  },
  {
    konzept: "Feuerwehr-Hilfeleistungskontingent (Grundkomponenten)",
    kuerzel: "FF-HLK Logistik", einheit: "Grundkomponente „Logistik”",
    traeger: feuerwehr, ortSchluessel: "augsburg",
    personal: [
      { rolle: U, funktion: "Truppführer/-in Logistik" },
      { rolle: M, funktion: "Helfer/-in Logistik", anzahl: 9 },
      { rolle: M, funktion: "Kraftfahrer/-in", anzahl: 2, fe: FE.C },
    ],
    fahrzeuge: [
      { kurz: "MZF", kennzahl: 19, lang: "Mehrzweckfahrzeug", anzahl: 2 },
      { kurz: "GW-Verpflegung", kennzahl: 40, lang: "Gerätewagen Verpflegung" },
      { kurz: "Anh VPA", lang: "Verpflegungsanhänger", ohneKennzeichen: "Anh VPA" },
      { kurz: "LKW", kennzahl: 41, lang: "Lastkraftwagen mit Ladebordwand" },
    ],
    szenario: "Kontingenteinsatz — Transport von Gepäck, Verpflegung und Trinkwasservorrat (1.500 l) für {ort}",
    soll: [0, 1, 11, 12], sollKfz: 4,
    hinweis: HINWEIS_ROLLEN + " Auch diese Grundkomponente wird in allen vier Kontingenttypen baugleich gestellt.",
  },
  {
    konzept: "Feuerwehr-Hilfeleistungskontingent (Grundkomponenten)",
    kuerzel: "FF-HLK Unterkunft", einheit: "Grundkomponente „Unterkunft”",
    traeger: feuerwehr, ortSchluessel: "nuernberg",
    personal: [
      { rolle: U, funktion: "Truppführer/-in Unterkunft" },
      { rolle: M, funktion: "Helfer/-in Unterkunft", anzahl: 5 },
      { rolle: M, funktion: "Kraftfahrer/-in", fe: FE.CE },
    ],
    fahrzeuge: [
      { kurz: "WLF", kennzahl: 50, lang: "Wechselladerfahrzeug mit Abrollbehälter Unterkunft" },
      { kurz: "WLF", kennzahl: 51, lang: "Wechselladerfahrzeug mit Abrollbehälter Dekon-Z (Duschmöglichkeit)" },
      { kurz: "Anh Lichtmast", lang: "Anhänger Lichtmast", ohneKennzeichen: "Anh Lichtmast" },
    ],
    szenario: "Kontingenteinsatz — Aufbau von Feldunterkunft und Dusche für das Kontingent in {ort}",
    soll: [0, 1, 6, 7], sollKfz: 2,
    hinweis: HINWEIS_ROLLEN + " Auch diese Grundkomponente wird in allen vier Kontingenttypen baugleich gestellt.",
  },
  {
    konzept: "Feuerwehr-Hilfeleistungskontingent (Grundkomponenten)",
    kuerzel: "FF-HLK Sanitätsdienst", einheit: "Grundkomponente „Sanitätsdienst” (Eigenschutz)",
    traeger: feuerwehr, ortSchluessel: "wuerzburg",
    personal: [
      { rolle: U, funktion: "Rettungssanitäter/-in (Fahrzeugführer/-in)", quali: "Rettungssanitäter" },
      { rolle: M, funktion: "Rettungssanitäter/-in", quali: "Rettungssanitäter" },
    ],
    fahrzeuge: [{ kurz: "RTW", kennzahl: 60, lang: "Rettungswagen für den Eigenschutz des Kontingents" }],
    szenario: "Kontingenteinsatz — sanitätsdienstlicher Eigenschutz der Einsatzkräfte in {ort}",
    soll: [0, 1, 1, 2], sollKfz: 1,
    hinweis: "Diese Grundkomponente wird in allen vier Kontingenttypen baugleich gestellt.",
  },
  {
    konzept: "Feuerwehr-Hilfeleistungskontingent Standard",
    kuerzel: "FF-HLK Personal", einheit: "Grundkomponente „Personal” (2 Löschzüge)",
    traeger: feuerwehr, ortSchluessel: "regensburg",
    personal: [
      { rolle: F, funktion: "Verbandsführer/-in" },
      { rolle: F, funktion: "Zugführer/-in", anzahl: 2 },
      { rolle: U, funktion: "Gruppenführer/-in", anzahl: 4 },
      { rolle: U, funktion: "Truppführer/-in Kommandowagen", anzahl: 2 },
      { rolle: M, funktion: "Truppmann/Truppfrau", anzahl: 16, quali: "Atemschutzgeräteträger" },
      { rolle: M, funktion: "Maschinist/-in", anzahl: 4, fe: FE.C },
      { rolle: M, funktion: "Kraftfahrer/-in", anzahl: 5, fe: FE.C1 },
    ],
    fahrzeuge: [
      { kurz: "ELW", kennzahl: 11, lang: "Einsatzleitwagen" },
      { kurz: "KdoW", kennzahl: 10, lang: "Kommandowagen", anzahl: 2 },
      {
        kurz: "HLF 20/16", kennzahl: 20,
        lang: "(Hilfeleistungs-)Löschfahrzeug — je nach Einsatzsituation HLF 20/16, LF 16/12 oder LF 20 KatS",
        anzahl: 4,
      },
    ],
    szenario: "Kontingenteinsatz Standard — zwei Löschzüge im Marschpaket nach {ort}",
    soll: [3, 6, 25, 34], sollKfz: 7,
    hinweis: HINWEIS_ROLLEN
      + " Im Kontingenttyp „Standard“ wird diese Komponente laut Quelle als Grund- UND als (baugleiche) "
      + "Spezialkomponente „Personal“ zweimal gestellt (macht die 104 Gesamtkräfte des Standard-"
      + "Kontingents aus 15+12+7+2+34+34); hier ist sie deshalb nur einmal abgebildet.",
  },

  // ===================================== Feuerwehr-HLK: Spezialkomponenten
  {
    konzept: "Feuerwehr-Hilfeleistungskontingent Hochwasser/Pumpen",
    kuerzel: "FF-HLK Hochwasser", einheit: "Spezialkomponente „Hochwasser/Pumpen”",
    traeger: feuerwehr, ortSchluessel: "bayreuth",
    personal: [
      { rolle: F, funktion: "Kontingentteilführer/-in Spezialkomponente" },
      { rolle: F, funktion: "Zugführer/-in", anzahl: 2 },
      { rolle: U, funktion: "Gruppenführer/-in Löschfahrzeug", anzahl: 4 },
      { rolle: U, funktion: "Truppführer/-in Rüstwagen/GW-Hochwasser", anzahl: 2 },
      { rolle: M, funktion: "Truppmann/Truppfrau", anzahl: 30 },
      { rolle: M, funktion: "Maschinist/-in", anzahl: 6, fe: FE.C },
      { rolle: M, funktion: "Kraftfahrer/-in", anzahl: 6, fe: FE.C1 },
    ],
    fahrzeuge: [
      { kurz: "ELW", kennzahl: 11, lang: "Einsatzleitwagen" },
      { kurz: "KdoW", kennzahl: 10, lang: "Kommandowagen (Zug 1)" },
      { kurz: "HLF 20/16", kennzahl: 20, lang: "(Hilfeleistungs-)Löschfahrzeug Zug 1", anzahl: 2 },
      { kurz: "RW", kennzahl: 42, lang: "Rüstwagen (Zug 1)" },
      { kurz: "KdoW", kennzahl: 10, lang: "Kommandowagen (Zug 2)" },
      { kurz: "HLF 20/16", kennzahl: 20, lang: "(Hilfeleistungs-)Löschfahrzeug Zug 2", anzahl: 2 },
      { kurz: "Anh Lichtmast", lang: "Anhänger Lichtmast (Zug 2)", ohneKennzeichen: "Anh Lichtmast" },
      { kurz: "GW-Hochwasser", kennzahl: 52, lang: "Gerätewagen Hochwasser (Chiemsee-Pumpen 2.000 l/min, Tauchpumpen TP4)" },
    ],
    szenario: "Hochwasser {ort} — Pumpeneinsatz und Deichverteidigung mit dem Kontingent Hochwasser/Pumpen",
    soll: [3, 6, 42, 51], sollKfz: 9,
    hinweis: HINWEIS_ROLLEN,
  },
  {
    konzept: "Feuerwehr-Hilfeleistungskontingent Sturmschaden/Dachsicherung",
    kuerzel: "FF-HLK Sturmschaden", einheit: "Spezialkomponente „Sturmschaden/Dachsicherung”",
    traeger: feuerwehr, ortSchluessel: "passau",
    personal: [
      { rolle: F, funktion: "Kontingentteilführer/-in Spezialkomponente" },
      { rolle: F, funktion: "Zugführer/-in", anzahl: 2 },
      { rolle: U, funktion: "Gruppenführer/-in Löschfahrzeug", anzahl: 4 },
      { rolle: U, funktion: "Maschinist/-in Drehleiter", anzahl: 2, fe: FE.C },
      { rolle: U, funktion: "Truppführer/-in Rüstwagen/Dachsicherung/Höhenrettung", anzahl: 3 },
      { rolle: M, funktion: "Truppmann/Truppfrau", anzahl: 27, quali: "Höhenrettung" },
      { rolle: M, funktion: "Maschinist/-in", anzahl: 6, fe: FE.C },
      { rolle: M, funktion: "Kraftfahrer/-in", anzahl: 6, fe: FE.C1 },
    ],
    fahrzeuge: [
      { kurz: "ELW", kennzahl: 11, lang: "Einsatzleitwagen" },
      { kurz: "KdoW", kennzahl: 10, lang: "Kommandowagen (Zug 1)" },
      { kurz: "HLF 20/16", kennzahl: 20, lang: "(Hilfeleistungs-)Löschfahrzeug Zug 1", anzahl: 2 },
      { kurz: "DLA 23/12", kennzahl: 21, lang: "Drehleiter mit Korb, Zug 1" },
      { kurz: "RW", kennzahl: 42, lang: "Rüstwagen (Zug 1)" },
      { kurz: "KdoW", kennzahl: 10, lang: "Kommandowagen (Zug 2)" },
      { kurz: "HLF 20/16", kennzahl: 20, lang: "(Hilfeleistungs-)Löschfahrzeug Zug 2", anzahl: 2 },
      { kurz: "DLA 23/12", kennzahl: 21, lang: "Drehleiter mit Korb, Zug 2" },
      { kurz: "LKW", kennzahl: 43, lang: "Lastkraftwagen mit Zusatzbeladung Dachsicherung" },
      { kurz: "MZF", kennzahl: 22, lang: "Mehrzweckfahrzeug Höhenrettungsgruppe" },
    ],
    szenario: "Sturmschäden {ort} — Notabdeckung von Dächern und Höhenrettung mit dem Kontingent Sturmschaden/Dachsicherung",
    soll: [3, 9, 39, 51], sollKfz: 12,
    hinweis: HINWEIS_ROLLEN,
  },
  {
    konzept: "Feuerwehr-Hilfeleistungskontingent ABC-Abwehr",
    kuerzel: "FF-HLK ABC-Abwehr", einheit: "Spezialkomponente „ABC-Abwehr”",
    traeger: feuerwehr, ortSchluessel: "ingolstadt",
    personal: [
      { rolle: F, funktion: "Kontingentteilführer/-in Spezialkomponente" },
      { rolle: F, funktion: "Zugführer/-in" },
      { rolle: U, funktion: "Gruppenführer/-in Löschfahrzeug", anzahl: 2 },
      { rolle: U, funktion: "Truppführer/-in Rettungswagen", quali: "Rettungssanitäter" },
      { rolle: M, funktion: "Rettungssanitäter/-in", quali: "Rettungssanitäter" },
      {
        rolle: U,
        funktion: "Truppführer/-in Gefahrgut/Rüstwagen/Dekon/CBRN-Erkundung/Absperrung/Ausrüstungslogistik/ABC-Ausrüstung",
        anzahl: 7,
      },
      { rolle: M, funktion: "Truppmann/Truppfrau ABC-Abwehr", anzahl: 38, quali: "Chemikalienschutzanzug-Träger" },
    ],
    fahrzeuge: [
      { kurz: "ELW", kennzahl: 11, lang: "Einsatzleitwagen (Kontingentteilführung)" },
      { kurz: "ELW", kennzahl: 11, lang: "Einsatzleitwagen (Zugführung)" },
      { kurz: "HLF 20/16", kennzahl: 20, lang: "(Hilfeleistungs-)Löschfahrzeug", anzahl: 2 },
      { kurz: "RTW", kennzahl: 60, lang: "Rettungswagen" },
      { kurz: "GW-Gefahrgut", kennzahl: 44, lang: "Gerätewagen Gefahrgut" },
      { kurz: "RW", kennzahl: 42, lang: "Rüstwagen" },
      { kurz: "GW-Dekon-P", kennzahl: 53, lang: "Gerätewagen Dekontamination Personen" },
      { kurz: "CBRN-ErkW", kennzahl: 54, lang: "CBRN-Erkundungswagen" },
      { kurz: "GW-AS", kennzahl: 55, lang: "Gerätewagen Absperrung/Sicherung" },
      { kurz: "GW-AL", kennzahl: 56, lang: "Gerätewagen Ausrüstung/Logistik" },
      { kurz: "LKW", kennzahl: 45, lang: "Lastkraftwagen mit Ausrüstung ABC (CSA, Spritzschutzanzüge, Hochdruckreiniger)" },
    ],
    szenario: "ABC-Gefahrenlage {ort} — Erkunden, Absperren und Dekontamination mit dem Kontingent ABC-Abwehr",
    soll: [2, 10, 39, 51], sollKfz: 12,
    hinweis: HINWEIS_ROLLEN,
  },
  {
    konzept: "Feuerwehr-Hilfeleistungskontingent Wasserfördersystem Bayern",
    kuerzel: "FF-HLK WFS", einheit: "Wasserfördersystem Bayern (eigenständiges Kontingent, erster Abmarsch)",
    traeger: feuerwehr, ortSchluessel: "fuerth",
    personal: [
      { rolle: F, funktion: "Zugführer/-in (ELW)" },
      { rolle: U, funktion: "Gruppenführer/-in (KdoW)" },
      { rolle: U, funktion: "Gruppenführer/-in (Löschfahrzeug)" },
      { rolle: M, funktion: "Truppmann/Truppfrau", anzahl: 6 },
      { rolle: M, funktion: "Maschinist/-in", anzahl: 2, fe: FE.C },
      { rolle: M, funktion: "Kraftfahrer/-in", anzahl: 3, fe: FE.C1 },
    ],
    fahrzeuge: [
      { kurz: "ELW", kennzahl: 11, lang: "Einsatzleitwagen" },
      { kurz: "KdoW", kennzahl: 10, lang: "Kommandowagen" },
      { kurz: "HLF 20/16", kennzahl: 20, lang: "(Hilfeleistungs-)Löschfahrzeug (entfällt in Absprache mit der Einsatzleitung ggf.)" },
      { kurz: "WLF", kennzahl: 57, lang: "Wechselladerfahrzeug mit Abrollbehälter Wasserfördersystem Bayern" },
      { kurz: "LKW", kennzahl: 41, lang: "Lastkraftwagen" },
      { kurz: "Anh Lichtmast", lang: "Anhänger Lichtmast", ohneKennzeichen: "Anh Lichtmast" },
    ],
    szenario:
      "Löschwasserförderung über lange Wegstrecke {ort} — 2.000 m Schlauchlänge im ebenen Gelände, "
      + "Förderstrom 8.000 l/min, Ausgangsdruck 2 bar",
    soll: [1, 2, 11, 14], sollKfz: 5,
    hinweis: HINWEIS_ROLLEN
      + " Innerhalb von ca. 30 Minuten marschbereit, eigenständige Durchhaltefähigkeit 12 Stunden, "
      + "danach löst eine nachgeführte Einheit Logistik/Versorgung (11 Einsatzkräfte, hier nicht "
      + "eigens abgebildet) ab.",
  },

  // ===================================== BRK: Schnell-Einsatz-Gruppen (SEG)
  {
    konzept: "BRK Schnell-Einsatz-Gruppe Sanitätsdienst (SEG San)",
    kuerzel: "SEG San", einheit: "SEG San (Arzttrupp/Transporttrupp)",
    traeger: brk, ortSchluessel: "landshut",
    personal: [
      { rolle: F, funktion: "Leiter/-in SEG San (Notarzt/-in)", quali: "Notarzt" },
      { rolle: U, funktion: "Truppführer/-in Transporttrupp", quali: "Rettungssanitäter" },
      { rolle: M, funktion: "Rettungssanitäter/-in", anzahl: 8, quali: "Rettungssanitäter" },
    ],
    fahrzeuge: [
      { kurz: "ATrKW", kennzahl: 61, lang: "Arzttruppkraftwagen" },
      { kurz: "KTW", kennzahl: 62, lang: "Krankentransportkraftwagen (4 Tragen)", anzahl: 2 },
    ],
    szenario: "MANV {ort} — Erstversorgung an der Verletztenablage/am Verbandplatz, ergänzende Transportkapazität",
    soll: [1, 1, 8, 10], sollKfz: 3,
    hinweis: HINWEIS_ROLLEN
      + " Quelle: Handbuch für Einsatzkräfte in den Bereitschaften, Kap. 4.1 (Personalstärke 1/9). "
      + "Versorgungskapazität laut Quelle: 20 Verletzte bzw. bis 100 Personen in der ersten Phase.",
  },
  {
    konzept: "BRK Schnell-Einsatz-Gruppe Betreuung (SEG Bt)",
    kuerzel: "SEG Bt Betreuung", einheit: "SEG Bt — Betreuungstrupp für soziale Betreuung",
    traeger: brk, ortSchluessel: "landshut",
    personal: [
      { rolle: U, funktion: "Truppführer/-in Betreuung" },
      { rolle: M, funktion: "Betreuungshelfer/-in", anzahl: 11 },
    ],
    fahrzeuge: [{ kurz: "Bt-Kombi", kennzahl: 63, lang: "Einsatzfahrzeug Soziale Betreuung (MB 312D/35 Sprinter o. ä.)", anzahl: 2 }],
    szenario: "Evakuierung {ort} — Betreuung von ca. 500 hilfsbedürftigen Personen, vorübergehende Unterbringung",
    soll: [0, 1, 11, 12], sollKfz: 2,
    hinweis: HINWEIS_ROLLEN + " Quelle: Handbuch für Einsatzkräfte in den Bereitschaften, Kap. 3.3 (Personalstärke 1/11).",
  },
  {
    konzept: "BRK Schnell-Einsatz-Gruppe Betreuung (SEG Bt)",
    kuerzel: "SEG Bt Verpflegung", einheit: "SEG Bt — Verpflegungstrupp",
    traeger: brk, ortSchluessel: "kempten",
    personal: [
      { rolle: U, funktion: "Koch/Köchin (Truppführer/-in Verpflegung)", quali: "Koch (Beruf)" },
      { rolle: M, funktion: "Helfer/-in Verpflegung", anzahl: 2 },
    ],
    fahrzeuge: [
      { kurz: "BtLKW", kennzahl: 64, lang: "Betreuungs-Lastkraftwagen (Typ 811/37 Eco-Power o. ä.)" },
      { kurz: "FKH", lang: "Feldkochherd", ohneKennzeichen: "Anh FKH" },
    ],
    szenario: "Evakuierung {ort} — Kalt-/Warmverpflegung für bis zu 200 bzw. 100 Personen je Kochgang",
    soll: [0, 1, 2, 3], sollKfz: 1,
    hinweis: HINWEIS_ROLLEN + " Quelle: Handbuch für Einsatzkräfte in den Bereitschaften, Kap. 3.3 (Personalstärke 1/2).",
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

function fahrzeugeBauen(specs: FzSpec[], ort: ByOrt, traeger: Traeger): Fahrzeug[] {
  // Laufende Nummer je gleicher Fahrzeugkennzahl (analog zur OPTA-Systematik).
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
          ort: ort.kreis,
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
  ort: ByOrt;
  spec: BogenSpec;
}

function bogenBauen(spec: BogenSpec): BeispielBogen {
  const ort = BY_ORTE[spec.ortSchluessel]!;
  const personal = personalBauen(spec.personal);
  const fahrzeuge = fahrzeugeBauen(spec.fahrzeuge, ort, spec.traeger);

  const hierarchie: HierarchieEbene[] = [...spec.traeger.ebene(ort)];

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
      einheitsTyp: { freitext: `${spec.einheit} (${spec.konzept})` },
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
      `Stärke ${spec.soll[0]}/${spec.soll[1]}/${spec.soll[2]}/${spec.soll[3]} nach ${
        spec.traeger === brk ? QUELLE_BRK : QUELLE_FFHLK
      }. ${spec.hinweis ?? ""}`.trim(),
  };

  return { datei: `${slug(spec.kuerzel)}-${slug(spec.einheit)}-${slug(ort.ort)}`, bogen, ort, spec };
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

function pruefen(beispiele: BeispielBogen[]): void {
  const fehler: string[] = [];
  for (const b of beispiele) {
    const s = staerke(b.bogen);
    const [f, u, m, g] = b.spec.soll;
    if (s.fuehrer !== f || s.unterfuehrer !== u || s.mannschaft !== m || s.gesamt !== g) {
      fehler.push(
        `${b.datei}: Stärke ${s.fuehrer}/${s.unterfuehrer}/${s.mannschaft}/${s.gesamt} ≠ Quelle ${f}/${u}/${m}/${g}`,
      );
    }
    const anhaengerKz = new Set(
      b.spec.fahrzeuge.filter((x) => x.ohneKennzeichen).map((x) => x.ohneKennzeichen!),
    );
    const kfz = b.bogen.fahrzeuge.filter((fz) => !anhaengerKz.has(fz.kennzeichen ?? ""));
    if (kfz.length !== b.spec.sollKfz) {
      fehler.push(`${b.datei}: ${kfz.length} Einsatz-Kfz ≠ Quelle ${b.spec.sollKfz}`);
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
  }
  if (fehler.length > 0) {
    throw new Error(`Selbstprüfung fehlgeschlagen:\n  ${fehler.join("\n  ")}`);
  }
}

// ---------------------------------------------------------------- Hauptlauf

const beispiele: BeispielBogen[] = SPECS.map(bogenBauen);

pruefen(beispiele);

const ausgabe = join(wurzel, "examples", "katastrophenschutz", "bayern");
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
  return `| ${b.datei} | ${b.spec.konzept} | ${b.spec.einheit} | ${b.ort.ort} | ${b.ort.rb} | ${s.fuehrer}/${s.unterfuehrer}/${s.mannschaft}/${s.gesamt} | ${b.bogen.fahrzeuge.length} |`;
});

writeFileSync(
  join(ausgabe, "README.md"),
  `# Beispiel-Erfassungsbögen — Katastrophenschutz/Bevölkerungsschutz Bayern

${beispiele.length} generierte Beispiel-Komponenten für den bayerischen Bevölkerungsschutz.

## Warum keine Landesverordnung wie bei den anderen Ländern

Anders als z. B. Thüringen (ThürKatSVO) oder Baden-Württemberg (VwV KatSD)
regelt das **Bayerische Katastrophenschutzgesetz (BayKSG)** keine landesweit
verbindliche Stärke- und Ausrüstungsnachweisung je KatS-Teileinheit — das ist
in Bayern Sache der Landkreise und kreisfreien Städte. Eine solche Tabelle war
trotz mehrerer Suchanfragen nicht auffindbar.

Gefunden wurde stattdessen die **bayernweit standardisierte Konzeption der
Feuerwehr-Hilfeleistungskontingente**, die das Staatsministerium des Innern
den Landkreisen und kreisfreien Städten vorgibt — mit realen Personenzahlen
UND Fahrzeuglisten je Komponente, öffentlich dokumentiert von der
Freiwilligen Feuerwehr München:
<https://www.ffw-muenchen.de/ueber-uns/hilfeleistungskontingente/>

Ergänzt um die **Schnell-Einsatz-Gruppen (SEG) des Bayerischen Roten
Kreuzes** — SEG San und SEG Bt —, ebenfalls ein bayernweites Konzept, hier aus
dem „Handbuch für Einsatzkräfte in den Bereitschaften" (Stand 15.03.2005) des
Kreisverbands Höchstadt:
<https://www.brk-hoechstadt.de/Downloads/Handbuch_fuer_Einsatzkraefte.pdf>

Diese Struktur ist damit — wie die niedersächsische Feuerwehrverordnung
(\`scripts/kats-nds-beispielboegen.mts\`) — ein bayernweit standardisiertes
Konzept mit real dokumentierten Stärke- und Fahrzeugangaben je Komponente,
kein Pendant zu einer Landesverordnung.

## Was quellengenau ist — und was modelliert

**Gesamtstärke und Fahrzeugliste** je Komponente sind der Quelle entnommen und
werden beim Generieren dagegen geprüft. Wo die Quelle nur die Gesamtstärke und
die Fahrzeugliste, aber **keine Einzelrollen** nennt (z. B. wer genau
Gruppenführer, Maschinist oder Truppmann ist), ist die Verteilung auf
Funktionen ein **plausibles, in sich stimmiges Modell** und nicht wörtlich der
Quelle entnommen — das ist je Bogen im Feld „Sonstiges" vermerkt.

Die **Grundkomponenten** „Führung/Verbindung", „Logistik", „Unterkunft" und
„Sanitätsdienst" werden laut Quelle in allen vier Kontingenttypen (Standard,
Hochwasser/Pumpen, Sturmschaden/Dachsicherung, ABC-Abwehr) baugleich gestellt
— hier deshalb nur je einmal abgebildet, nicht viermal. Die Grundkomponente
„Personal" (zwei Löschzüge) wird im Kontingenttyp „Standard" laut Quelle
zusätzlich als baugleiche **Spezialkomponente** „Personal" ein zweites Mal
gestellt (macht die 104 Gesamtkräfte des Standard-Kontingents aus
15+12+7+2+34+34) — auch das ist hier nur einmal abgebildet.

## Funkrufnamen

Ein bayerisches Funkrufnamenverzeichnis mit amtlichen Fahrzeug-Kennzahlen war
nicht auffindbar. Wie bei Thüringen wird deshalb die **bundesweite
OPTA-Systematik** der BDBOS analog angewendet:

> \`<Kennwort> <Ortsbezeichnung> <Standort>/<Fahrzeugkennzahl>-<laufende Nummer>\`

* **Kennwort** nach dem globalen FUNKRUF_KENNWOERTER-Vokabular: Feuerwehr
  „Florian", Bayerisches Rotes Kreuz „Rotkreuz".
* **Ortsbezeichnung** ist der Landkreis bzw. die kreisfreie Stadt.
* **Standort** und **Fahrzeugkennzahl** sind — wie in Baden-Württemberg —
  plausibel gewählt, aber **nicht amtlich belegt**.
* **Anhänger** (Verpflegungsanhänger, Lichtmast, Feldkochherd) führen keinen
  Funkrufnamen und zählen nicht als Einsatz-Kfz.

## Zur Standort-Zuordnung

Feuerwehr-Hilfeleistungskontingente und BRK-SEG gibt es in nahezu jedem
bayerischen Landkreis bzw. jeder kreisfreien Stadt. Welche Komponente hier an
welchem Ort steht, ist **beispielhaft** über alle sieben Regierungsbezirke
gestreut — Stärke und Fahrzeuge dagegen sind wie oben beschrieben
quellengenau.

Alle Personen, Standort-Zuordnungen und Kennzeichen sind **fiktiv**.

Neu erzeugen mit: \`npm run beispiele:kats-by\` (deterministisch, fester Zufalls-Seed).

| Datei | Konzept | Komponente | Ort | Regierungsbezirk | Stärke | Fahrzeuge im Bogen |
|---|---|---|---|---|---|---|
${zeilen.join("\n")}
`,
);

console.log(`${beispiele.length} Bögen nach ${ausgabe} geschrieben.`);
