/**
 * Erzeugt Beispiel-Erfassungsbögen der Katastrophenschutzeinheiten des Landes
 * Nordrhein-Westfalen als JSON nach examples/katastrophenschutz/nordrhein-westfalen/.
 * Abgelegt ist nur das Bogen-JSON; die PDF entsteht erst beim Anklicken in der
 * App aus dem aktuellen Layout.
 *
 * Aufruf (Node ≥ 22): npm run beispiele:kats-nw
 *
 * QUELLENLAGE: Anders als die meisten anderen Länder kennt NRW KEINE
 * Katastrophenschutz-Verordnung mit Anlage/Schaubildern je Einheit. Der
 * frühere Rechercheeintrag „NRW: keine landesweite StAN-Tabelle auffindbar"
 * (siehe kats-weitere-laender-recherche.md) hat nur nach einer Verordnung
 * gesucht, nicht nach den seit 2013 eingeführten LANDESKONZEPTEN — die
 * bestehen sehr wohl, sind aktuell (Version 2.1 vom 15.11.2024!) und
 * enthalten exakte Personal- UND Fahrzeugtabellen. Grundlage dieses Skripts:
 *
 *   „Konzept für die Vorgeplante überörtliche Hilfe im Sanitäts- und
 *   Betreuungsdienst im Land Nordrhein-Westfalen" (VüH-SanBt NRW),
 *   Version 2.1, Ausgabe 15.11.2024, Innenministerium NRW / IdF NRW, geladen
 *   per `curl -sL -A "Mozilla/5.0"` von
 *   https://www.idf.nrw.de/rechtsvorschriften/eingebundene_dokumente/katastrophenschutz/weitere_katastrophenschutzkonzepte/241115_konzept_vueh-sanbt__version_2.pdf
 *   und mit `pdftotext -layout` VERBATIM ausgewertet (nicht nur eine
 *   WebFetch-Zusammenfassung). Übersicht der eingeführten Landeskonzepte
 *   zusätzlich bestätigt über die Präsentation „Katastrophenschutz-Konzepte
 *   in Nordrhein-Westfalen" (Bezirksregierung Arnsberg, Dez. 22, Stand
 *   02/2014), ebenso per curl+pdftotext gelesen.
 *
 * ABGEBILDET sind die zwei Bausteine des VüH-SanBt NRW mit vollständiger,
 * verbindlicher Personal- UND Fahrzeugtabelle je Teileinheit:
 *
 *  - Einsatzeinheit NRW (EE NRW): die überall in NRW landesweit einheitlich
 *    eingeführte Basiseinheit (Erlass vom 23.08.2013), 33 Funktionen
 *    (1/7/25/33) in 4 Teileinheiten (Führung, Sanität, Betreuung,
 *    Unterstützung) — je Teileinheit mit exakter Rollenliste UND
 *    Fahrzeugausstattung im Dokument (Abschnitt B.3.2).
 *  - Behandlungsplatz 50 NRW (BHP 50 NRW): der aus mind. 2× EE NRW plus
 *    Feuerwehr/Rettungsdienst gebildete sanitätsdienstliche Großverband,
 *    78 Funktionen (9/5/64/78) in 9 Modulen (Führungsstaffel,
 *    Eingangssichtung, Behandlungsbereich „Kritische Patienten",
 *    Behandlungsbereich „Unkritische Patienten", Logistik-Führung, Interner
 *    Patiententransport, Technische Unterstützung, Verpflegung,
 *    Ausgangsdokumentation) — ebenfalls mit exakter Rollen- UND
 *    Fahrzeugliste je Modul (Abschnitt C.3.2, Tabelle „Qualifikations- und
 *    Ausstattungsübersicht" in C.4).
 *
 * NICHT abgebildet, obwohl als Landeskonzepte real existierend (siehe
 * Recherchenotiz): Betreuungsplatz 500 NRW (BTP 500 NRW, 72 Funktionen,
 * dasselbe Dokument, Abschnitt 5 — nur die Führungsstaffel und ein Teil der
 * Betreuungsmodule wurden für dieses Skript ausgewertet, nicht die
 * vollständigen neun Untermodule) und Patiententransport-Zug 10 NRW
 * (PT-Z 10 NRW, 20 Funktionen, Abschnitt 6) sowie das sechsteilige
 * ABC-Schutz-Konzept NRW und der Wasserrettungszug NRW (WR-Z NRW) — für
 * diese vier Konzepte liegen zwar Gesamtstärke und Fahrzeugzahl vor, aber
 * (anders als bei EE NRW und BHP 50 NRW) keine mit vertretbarem Aufwand
 * ausgewertete Rollenliste je Teileinheit/Modul. Das kann in einem
 * Folgeschritt nachgezogen werden, ohne den bereits soliden Kern aus EE NRW
 * und BHP 50 NRW zu verändern.
 *
 * FUNKRUFNAMEN: Für NRW wurde kein landeseigener, öffentlich zugänglicher
 * Fahrzeugkennzahlen-Katalog gefunden (anders als z. B. Hessens amtlicher
 * Funkrufnamenkatalog). Genähert wird daher — wie bereits bei Thüringen und
 * Bayern — mit der bundesweiten OPTA-Richtlinie der BDBOS als Vorbild:
 *   „<Kennwort> <Kreis/kreisfreie Stadt> <Wache> <Fahrzeugkennzahl> <lfd. Nr.>"
 * Kennwort nach FUNKRUF_KENNWOERTER (src/vokabulare/thw.ts): Rotkreuz (DRK),
 * Sama (ASB), Akkon (JUH), Johannes (MHD), Florian (Feuerwehr). Die
 * Fahrzeugkennzahlen selbst sind KEIN NRW-amtliches Schema, sondern eine
 * plausible, an die OPTA-Systematik angelehnte Zuordnung — ausdrücklich
 * keine Verordnungsvorgabe.
 *
 * TRÄGER: Das Dokument nennt für die EE NRW „in der Regel … Kräfte einer
 * anerkannten Hilfsorganisation" (ASB, DRK, JUH, MHD), lässt aber
 * ausdrücklich zu, dass „unterschiedliche Teileinheiten von unterschiedlichen
 * … Hilfsorganisationen gebildet werden" (Abschnitt B.1). Für den BHP 50 NRW
 * nennt das Dokument keine Organisation je Modul (nur „2× EE NRW,
 * Feuerwehr, Rettungsdienst und weitere Organisationen" in der 2014er
 * Kurzübersicht). Die Trägerzuordnung je Bogen ist daher — wie bei den
 * anderen Ländern mit dieser Quellenlage (Berlin, Bayern) — redaktionell
 * gewählt, um die Bandbreite der mitwirkenden Organisationen zu zeigen, und
 * im Feld „Sonstiges" jedes Bogens vermerkt.
 *
 * Fiktiv sind alle Personen, Kreis-Zuordnungen, Wachennummern und
 * Kennzeichen.
 *
 * Am Ende läuft eine Selbstprüfung (Personalstärke je Teileinheit/Modul
 * gegen das Dokument, Summenprüfung je Verband gegen 1/7/25/33 (EE NRW) bzw.
 * 9/5/64/78 (BHP 50 NRW), vollständiger Funkrufname je motorisiertem
 * Fahrzeug, QR-Roundtrip); die README im Zielordner bekommt eine
 * Übersichtstabelle.
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
const rnd = prng(20241115); // Ausgabedatum der VüH-SanBt NRW (Version 2.1)
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
  "Andreas", "Bernd", "Christian", "Daniel", "Dennis", "Detlef", "Dirk", "Erik",
  "Frank", "Guido", "Heinz", "Hendrik", "Jan", "Jens", "Jörg", "Karsten",
  "Kevin", "Lars", "Lukas", "Maik", "Marco", "Mario", "Markus", "Martin",
  "Matthias", "Michael", "Nico", "Norbert", "Olaf", "Patrick", "Paul", "Peter",
  "Philipp", "Ralf", "René", "Robert", "Sebastian", "Steffen", "Sven", "Thomas",
  "Tobias", "Torsten", "Uwe", "Volker", "Axel", "Benjamin", "Carsten", "Dominik",
] as const;
const VORNAMEN_W = [
  "Anja", "Anke", "Antje", "Beate", "Bettina", "Bianca", "Carola", "Christina",
  "Claudia", "Cornelia", "Doreen", "Franziska", "Gaby", "Heike", "Ines", "Jana",
  "Josephine", "Katrin", "Kerstin", "Kristin", "Lea", "Lisa", "Manuela", "Mandy",
  "Maria", "Nadine", "Nicole", "Petra", "Ramona", "Sabine", "Sandra", "Sarah",
  "Silke", "Simone", "Steffi", "Ulrike", "Yvonne", "Diana", "Susanne", "Melanie",
] as const;
const NACHNAMEN = [
  "Averbeck", "Bauer", "Becker", "Beckmann", "Berger", "Bergmann", "Böhm", "Brandt",
  "Brinkmann", "Cremer", "Dahlmann", "Dittrich", "Ebert", "Engelmann", "Esser", "Fischer",
  "Franke", "Frenzel", "Gerhardt", "Giese", "Grabow", "Grimm", "Grüter", "Günther",
  "Haase", "Hagen", "Hartmann", "Heinemann", "Hermes", "Hoffmann", "Holtmann", "Jansen",
  "Kaiser", "Keller", "Kemper", "Kessler", "Klein", "Köhler", "Krause", "Kremer",
  "Kruse", "Kühn", "Lange", "Lehmann", "Linden", "Lorenz", "Lücke", "Marquardt",
  "Meier", "Meyer", "Möller", "Neumann", "Nolte", "Pauls", "Pieper", "Radtke",
  "Reimann", "Richter", "Riedel", "Röhl", "Schmitz", "Schneider", "Scholz", "Schröder",
  "Schulte", "Schulz", "Seidel", "Sommer", "Thiele", "Tönnies", "Ulrich", "Vogt",
  "Wagner", "Weber", "Wegner", "Wendt", "Werner", "Winkler", "Wolf", "Zander",
] as const;

/** Externe/Berufs-Qualifikationen (Freitext) — gelegentlich gestreut. */
const QUALI_POOL = [
  "Berufskraftfahrer (Beruf)",
  "Elektrofachkraft (Beruf)",
  "Koch (Beruf)",
  "Gesundheits- und Krankenpfleger (Beruf)",
  "Atemschutzgeräteträger",
  "Sprechfunker",
  "PSNV-Fachkraft",
] as const;

// -------------------------------------------------------------- NRW: Orte

interface NrwOrt {
  /** Fiktiver Sitz-Ort innerhalb des Kreises/der kreisfreien Stadt. */
  ort: string;
  /** Kreis bzw. kreisfreie Stadt = untere Katastrophenschutzbehörde. */
  kreis: string;
  /** Vierstellige Wachennummer (fiktiv). */
  wache: number;
}

/** Standorte quer durch die fünf Regierungsbezirke NRWs. */
const NRW_ORTE: Record<string, NrwOrt> = {
  soest: { ort: "Soest", kreis: "Kreis Soest", wache: 1100 },
  paderborn: { ort: "Paderborn", kreis: "Kreis Paderborn", wache: 1200 },
  unna: { ort: "Unna", kreis: "Kreis Unna", wache: 1300 },
  maerkischerKreis: { ort: "Lüdenscheid", kreis: "Märkischer Kreis", wache: 1400 },
  hochsauerlandkreis: { ort: "Meschede", kreis: "Hochsauerlandkreis", wache: 1500 },
  recklinghausen: { ort: "Recklinghausen", kreis: "Kreis Recklinghausen", wache: 1600 },
  steinfurt: { ort: "Steinfurt", kreis: "Kreis Steinfurt", wache: 1700 },
  warendorf: { ort: "Warendorf", kreis: "Kreis Warendorf", wache: 1800 },
  rheinSieg: { ort: "Siegburg", kreis: "Rhein-Sieg-Kreis", wache: 1900 },
  rheinKreisNeuss: { ort: "Neuss", kreis: "Rhein-Kreis Neuss", wache: 2000 },
  viersen: { ort: "Viersen", kreis: "Kreis Viersen", wache: 2100 },
  mindenLuebbecke: { ort: "Minden", kreis: "Kreis Minden-Lübbecke", wache: 2200 },
  lippe: { ort: "Detmold", kreis: "Kreis Lippe", wache: 2300 },
};
type OrtSchluessel = keyof typeof NRW_ORTE;

// ------------------------------------------------------------------ Träger

interface Traeger {
  org: OrganisationsTyp;
  /** Funkruf-Kennwort der Trägerorganisation. */
  kennwort: VokabularWert;
  organisationName: (o: NrwOrt) => string;
  ebene: (o: NrwOrt) => HierarchieEbene[];
}

/** FUNKRUF_KENNWOERTER-Codes (src/vokabulare/thw.ts). */
const KW = { FLORIAN: 2, ROTKREUZ: 3, AKKON: 4, JOHANNES: 5, SAMA: 6 } as const;

function hiorg(org: OrganisationsTyp, kennwort: VokabularWert, kurz: string, lang: string): Traeger {
  return {
    org,
    kennwort,
    organisationName: (o) => `${lang} ${o.kreis}`,
    ebene: (o) => [
      { bezeichnung: { freitext: `${kurz}-Kreisverband` }, name: o.kreis },
      { bezeichnung: { freitext: "Untere Katastrophenschutzbehörde" }, name: o.kreis },
    ],
  };
}
const drk = hiorg(OrganisationsTyp.DRK, { code: KW.ROTKREUZ }, "DRK", "Deutsches Rotes Kreuz");
const asb = hiorg(OrganisationsTyp.ASB, { code: KW.SAMA }, "ASB", "Arbeiter-Samariter-Bund");
const juh = hiorg(OrganisationsTyp.JUH, { code: KW.AKKON }, "JUH", "Johanniter-Unfall-Hilfe");
const mhd = hiorg(OrganisationsTyp.MHD, { code: KW.JOHANNES }, "MHD", "Malteser Hilfsdienst");
const feuerwehr: Traeger = {
  org: OrganisationsTyp.FEUERWEHR,
  kennwort: { code: KW.FLORIAN },
  organisationName: (o) => `Feuerwehr ${o.kreis}`,
  ebene: (o) => [{ bezeichnung: { freitext: "Untere Katastrophenschutzbehörde" }, name: o.kreis }],
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
  if (/^(GW-L2|HLF20|GW-Bt|Bt-LKW)/.test(kurz)) return 90;
  if (/^(GW-San|AB-MANV)/.test(kurz)) return 60;
  if (/^(KdoW|ELW|MTF|KTW|Bt-Kombi|Fü-Kombi)/.test(kurz)) return 40;
  return 0;
}

/** Plausible, an die OPTA-Systematik angelehnte Fahrzeugkennzahl (siehe Skriptkopf — kein NRW-Schema). */
const KENNZAHL: Record<string, number> = {
  "KdoW": 10,
  "ELW 1": 11,
  "ELW 2": 12,
  "Fü-Kombi": 13,
  "MTF": 19,
  "GW-San": 95,
  "KTW-B": 85,
  "KTW": 85,
  "GW-Bt": 98,
  "Bt-Kombi": 97,
  "Bt-LKW": 99,
  "GW-L2 NRW": 65,
  "AB-MANV NRW": 74,
};

// --------------------------------------------------------------- Bogen-Specs

interface PlatzSpec {
  rolle: R;
  funktion: string;
  anzahl?: number;
  quali?: string;
  fe?: FE;
}

interface FzSpec {
  /** Kurzbezeichnung wie im Dokument (Klartext bzw. Abkürzung). */
  kurz: string;
  /** Klartext für „Änderungen bzw. Sondergerät". */
  lang?: string;
  anzahl?: number;
  /** Abrollbehälter u. Ä. statt Kfz-Kennzeichen/Funkrufname. */
  ohneKennzeichen?: string;
}

interface BogenSpec {
  /** "EE NRW" oder "BHP 50 NRW". */
  verband: string;
  /** Teileinheit (EE NRW) bzw. Modul (BHP 50 NRW) nach dem Dokument. */
  einheit: string;
  traeger: Traeger;
  ortSchluessel: OrtSchluessel;
  personal: PlatzSpec[];
  fahrzeuge: FzSpec[];
  szenario: string; // {ort} wird ersetzt
  /** Sollstärke laut Dokument als "F/U/M/Gesamt" — wird geprüft. */
  soll: [number, number, number, number];
}

const F = R.FUEHRER;
const U = R.UNTERFUEHRER;
const M = R.MANNSCHAFT;

const QUELLE = "VüH-SanBt NRW, Version 2.1 (15.11.2024)";

const SPECS: BogenSpec[] = [
  // ======================================================== Einsatzeinheit NRW
  {
    verband: "Einsatzeinheit NRW", einheit: "Teileinheit Führung (TE Fü)",
    traeger: drk, ortSchluessel: "soest",
    personal: [
      { rolle: F, funktion: "Zugführer/-in" },
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Führungsgehilfe/-in", anzahl: 2 },
    ],
    fahrzeuge: [{ kurz: "KdoW", lang: "Kommandowagen" }],
    szenario: "Überörtliche Hilfe {ort} — Führung der Einsatzeinheit NRW",
    soll: [1, 1, 2, 4],
  },
  {
    verband: "Einsatzeinheit NRW", einheit: "Teileinheit Sanität (TE San)",
    traeger: drk, ortSchluessel: "paderborn",
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in mit Rettungshelfer-Ausbildung" },
      { rolle: M, funktion: "Rettungssanitäter/-in", anzahl: 3, quali: "Rettungssanitäter" },
      { rolle: M, funktion: "Rettungshelfer/-in", anzahl: 6 },
    ],
    fahrzeuge: [
      { kurz: "GW-San", lang: "Gerätewagen Sanität" },
      { kurz: "KTW-B", lang: "Krankentransportwagen Typ B" },
      { kurz: "KTW-B", lang: "Krankentransportwagen Typ B" },
    ],
    szenario: "MANV {ort} — sanitätsdienstliche Erstversorgung und Patiententransport",
    soll: [0, 1, 9, 10],
  },
  {
    verband: "Einsatzeinheit NRW", einheit: "Teileinheit Betreuung (TE Bt)",
    traeger: asb, ortSchluessel: "unna",
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: U, funktion: "Truppführer/-in", anzahl: 3 },
      { rolle: M, funktion: "Helfer/-in Betreuung", anzahl: 11 },
    ],
    fahrzeuge: [
      { kurz: "GW-Bt", lang: "Gerätewagen Betreuung" },
      { kurz: "Bt-Kombi", lang: "Betreuungs-Kombi" },
      { kurz: "Bt-LKW", lang: "Betreuungs-Lastkraftwagen" },
    ],
    szenario: "Evakuierung {ort} — Anlaufstelle und Erstbetreuung unverletzt Betroffener",
    soll: [0, 4, 11, 15],
  },
  {
    verband: "Einsatzeinheit NRW", einheit: "Teileinheit Unterstützung (TE Ust)",
    traeger: juh, ortSchluessel: "maerkischerKreis",
    personal: [
      { rolle: U, funktion: "Truppführer/-in" },
      { rolle: M, funktion: "Helfer/-in Unterstützung", anzahl: 3 },
    ],
    fahrzeuge: [{ kurz: "MTF", lang: "Mannschaftstransportfahrzeug" }],
    szenario: "Überörtliche Hilfe {ort} — logistische Unterstützung der Einsatzeinheit",
    soll: [0, 1, 3, 4],
  },

  // ============================================================ BHP 50 NRW
  {
    verband: "BHP 50 NRW", einheit: "Führungsstaffel",
    traeger: drk, ortSchluessel: "hochsauerlandkreis",
    personal: [
      { rolle: F, funktion: "Verbandsführer/-in", quali: "Organisatorische/r Leiter/-in Rettungsdienst" },
      { rolle: F, funktion: "Leitende/r Notarzt/-ärztin (LNA)", quali: "Leitender Notarzt" },
      { rolle: F, funktion: "Organisatorische/r Leiter/-in Rettungsdienst (OrgL RD)", quali: "OrgL Rettungsdienst" },
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Helfer/-in Führung", anzahl: 2 },
    ],
    fahrzeuge: [{ kurz: "ELW 2", lang: "Einsatzleitwagen 2" }],
    szenario: "MANV {ort} — Führung des Behandlungsplatzes 50 NRW",
    soll: [3, 1, 2, 6],
  },
  {
    verband: "BHP 50 NRW", einheit: "Eingangssichtung",
    traeger: drk, ortSchluessel: "recklinghausen",
    personal: [
      { rolle: F, funktion: "Notarzt/-ärztin", quali: "Notarzt" },
      { rolle: M, funktion: "Notfallsanitäter/-in", quali: "Notfallsanitäter" },
      { rolle: M, funktion: "Rettungssanitäter/-in", anzahl: 2, quali: "Rettungssanitäter" },
      { rolle: M, funktion: "Rettungshelfer/-in", anzahl: 2 },
    ],
    fahrzeuge: [{ kurz: "MTF", lang: "Mannschaftstransportfahrzeug" }],
    szenario: "MANV {ort} — Sichtung eintreffender Patienten am Behandlungsplatz",
    soll: [1, 0, 5, 6],
  },
  {
    verband: "BHP 50 NRW", einheit: 'Behandlungsbereich „Kritische Patienten" (rot/gelb)',
    traeger: asb, ortSchluessel: "steinfurt",
    personal: [
      { rolle: F, funktion: "Zugführer/-in mit OrgL-RD-Qualifikation", quali: "OrgL Rettungsdienst" },
      { rolle: F, funktion: "Notarzt/-ärztin", anzahl: 3, quali: "Notarzt" },
      { rolle: M, funktion: "Notfallsanitäter/-in", anzahl: 5, quali: "Notfallsanitäter" },
      { rolle: M, funktion: "Rettungssanitäter/-in", anzahl: 8, quali: "Rettungssanitäter" },
      { rolle: M, funktion: "Rettungshelfer/-in", anzahl: 6 },
    ],
    fahrzeuge: [
      { kurz: "AB-MANV NRW", lang: "Abrollbehälter MANV", ohneKennzeichen: "AB MANV" },
      { kurz: "GW-San", lang: "Gerätewagen Sanität" },
      { kurz: "KTW", lang: "Krankentransportwagen", anzahl: 6 },
      { kurz: "MTF", lang: "Mannschaftstransportfahrzeug (Personaltransport)" },
    ],
    szenario: "MANV {ort} — Behandlung der Sichtungskategorien I/IV und II",
    soll: [4, 0, 19, 23],
  },
  {
    verband: "BHP 50 NRW", einheit: 'Behandlungsbereich „Unkritische Patienten" (grün)',
    traeger: juh, ortSchluessel: "warendorf",
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Rettungssanitäter/-in", anzahl: 2, quali: "Rettungssanitäter" },
      { rolle: M, funktion: "Rettungshelfer/-in", anzahl: 9 },
    ],
    fahrzeuge: [
      { kurz: "GW-San", lang: "Gerätewagen Sanität" },
      { kurz: "GW-San", lang: "Gerätewagen Sanität" },
    ],
    szenario: "MANV {ort} — Behandlung der Sichtungskategorie III",
    soll: [0, 1, 11, 12],
  },
  {
    verband: "BHP 50 NRW", einheit: "Logistik (Führung)",
    traeger: mhd, ortSchluessel: "rheinSieg",
    personal: [
      { rolle: F, funktion: "Zugführer/-in" },
      { rolle: M, funktion: "Helfer/-in Logistik" },
    ],
    fahrzeuge: [{ kurz: "Fü-Kombi", lang: "Führungskombi" }],
    szenario: "MANV {ort} — Führung der Logistik am Behandlungsplatz",
    soll: [1, 0, 1, 2],
  },
  {
    verband: "BHP 50 NRW", einheit: "Interner Patiententransport",
    traeger: drk, ortSchluessel: "rheinKreisNeuss",
    personal: [{ rolle: M, funktion: "Helfer/-in Patiententransport", anzahl: 16 }],
    fahrzeuge: [
      { kurz: "MTF", lang: "Mannschaftstransportfahrzeug" },
      { kurz: "Bt-Kombi", lang: "Betreuungs-Kombi" },
    ],
    szenario: "MANV {ort} — Transport der Patienten zwischen Sichtung und Behandlungsbereich",
    soll: [0, 0, 16, 16],
  },
  {
    verband: "BHP 50 NRW", einheit: "Technische Unterstützung",
    traeger: feuerwehr, ortSchluessel: "viersen",
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Helfer/-in Technik", anzahl: 5, quali: "Elektrofachkraft (Beruf)" },
    ],
    fahrzeuge: [{ kurz: "GW-L2 NRW", lang: "Gerätewagen Logistik 2 NRW mit Notstromausstattung" }],
    szenario: "MANV {ort} — Strom-, Licht- und Wärmeversorgung des Behandlungsplatzes",
    soll: [0, 1, 5, 6],
  },
  {
    verband: "BHP 50 NRW", einheit: "Verpflegung",
    traeger: mhd, ortSchluessel: "mindenLuebbecke",
    personal: [
      { rolle: U, funktion: "Truppführer/-in" },
      { rolle: M, funktion: "Helfer/-in Verpflegung", anzahl: 2, quali: "Koch (Beruf)" },
    ],
    fahrzeuge: [{ kurz: "Bt-LKW", lang: "Betreuungs-Lastkraftwagen" }],
    szenario: "MANV {ort} — Verpflegung von Einsatzkräften und Patienten",
    soll: [0, 1, 2, 3],
  },
  {
    verband: "BHP 50 NRW", einheit: "Ausgangsdokumentation",
    traeger: asb, ortSchluessel: "lippe",
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Helfer/-in Ausgangsdokumentation", anzahl: 3 },
    ],
    fahrzeuge: [{ kurz: "ELW 1", lang: "Einsatzleitwagen 1" }],
    szenario: "MANV {ort} — Schnittstelle zur Transportorganisation und Patientendokumentation",
    soll: [0, 1, 3, 4],
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
  const g = wuerfel(0.3) ? G.W : G.M;
  const { vorname, nachname } = neuerName(g);
  const fe =
    spec.fe ??
    (spec.rolle !== R.MANNSCHAFT
      ? gewichtet<FE>([[FE.C, 3], [FE.CE, 2], [FE.C1, 3], [FE.B, 3]])
      : gewichtet<FE>([[FE.B, 6], [FE.C1, 3], [FE.C, 2], [FE.NONE, 4]]));
  const person: Person = {
    vorname,
    nachname,
    staerkeRolle: spec.rolle,
    funktionen: [{ freitext: spec.funktion }],
    fahrerlaubnis: fe,
    geschlecht: g,
    ernaehrung: gewichtet<E>([[E.FLEISCH, 75], [E.VEGETARISCH, 17], [E.VEGAN, 8]]),
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
  return `${kfz}-KS ${1000 + (laufendeNummer++ % 8000)}`;
}

/** KFZ-Kürzel je Kreis/kreisfreie Stadt (fiktiv den realen Kennzeichen nachempfunden). */
const KFZ_KUERZEL: Record<string, string> = {
  "Kreis Soest": "SO",
  "Kreis Paderborn": "PB",
  "Kreis Unna": "UN",
  "Märkischer Kreis": "MK",
  "Hochsauerlandkreis": "HSK",
  "Kreis Recklinghausen": "RE",
  "Kreis Steinfurt": "ST",
  "Kreis Warendorf": "WAF",
  "Rhein-Sieg-Kreis": "SU",
  "Rhein-Kreis Neuss": "NE",
  "Kreis Viersen": "VIE",
  "Kreis Minden-Lübbecke": "MI",
  "Kreis Lippe": "LIP",
};

function fahrzeugeBauen(specs: FzSpec[], ort: NrwOrt, traeger: Traeger): Fahrzeug[] {
  const fahrzeuge: Fahrzeug[] = [];
  let lfd = 0;
  for (const s of specs) {
    for (let i = 0; i < (s.anzahl ?? 1); i++) {
      lfd += 1;
      const fz: Fahrzeug = { typ: { freitext: s.kurz }, aenderungen: s.lang };
      if (s.ohneKennzeichen) {
        fz.kennzeichen = s.ohneKennzeichen;
      } else {
        fz.kennzeichen = kennzeichen(KFZ_KUERZEL[ort.kreis] ?? "NW");
        const kennzahl = KENNZAHL[s.kurz] ?? 50;
        fz.funkrufname = {
          kennwort: traeger.kennwort,
          eigenerStandort: false,
          ort: ort.kreis,
          teile: specs.length > 1 || (s.anzahl ?? 1) > 1 ? [ort.wache, kennzahl, lfd] : [ort.wache, kennzahl],
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
  ort: NrwOrt;
  verband: string;
  einheit: string;
}

function bogenBauen(spec: BogenSpec): BeispielBogen {
  const ort = NRW_ORTE[spec.ortSchluessel]!;
  const personal = personalBauen(spec.personal);
  const fahrzeuge = fahrzeugeBauen(spec.fahrzeuge, ort, spec.traeger);

  const hierarchie: HierarchieEbene[] = [
    { bezeichnung: { freitext: spec.verband }, name: spec.einheit },
    ...spec.traeger.ebene(ort),
  ];

  const tag = datumAusIso("2026-06-01") + ganz(0, 2);
  // Stand minutengenau (Schema 7): Meldung irgendwann zwischen 06:00 und 21:59.
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
      einheitsTyp: { freitext: `${spec.einheit} (${spec.verband})` },
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
      gemischLiter: 0,
      unterbringung: dauer >= 2 && wuerfel(0.6),
      ruhezeitErforderlich: wuerfel(0.3),
    },
    sonstiges:
      `Sollstärke nach ${QUELLE}: ${spec.soll[0]}/${spec.soll[1]}/${spec.soll[2]}/${spec.soll[3]}. `
      + `Träger dieser Teileinheit/dieses Moduls ist redaktionell gewählt (das Dokument nennt für den `
      + "BHP 50 NRW keine Organisation je Modul, für die Einsatzeinheit NRW lässt es unterschiedliche "
      + "Hilfsorganisationen je Teileinheit ausdrücklich zu), siehe README.",
  };

  return {
    datei: `${slug(spec.verband)}-${slug(spec.einheit)}`,
    bogen,
    ort,
    verband: spec.verband,
    einheit: spec.einheit,
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
 * Selbstprüfung gegen die VüH-SanBt NRW: Personalstärke je Teileinheit/Modul,
 * Summenprüfung je Verband (Einsatzeinheit NRW = 1/7/25/33, BHP 50 NRW =
 * 9/5/64/78), vollständiger Funkrufname je motorisiertem Fahrzeug (Abroll-
 * behälter ausgenommen), QR-Roundtrip.
 */
function pruefen(beispiele: BeispielBogen[]): void {
  const fehler: string[] = [];
  beispiele.forEach((b, i) => {
    const spec = SPECS[i]!;
    const s = staerke(b.bogen);
    const [f, u, m, g] = spec.soll;
    if (s.fuehrer !== f || s.unterfuehrer !== u || s.mannschaft !== m || s.gesamt !== g) {
      fehler.push(
        `${b.datei}: Stärke ${s.fuehrer}/${s.unterfuehrer}/${s.mannschaft}/${s.gesamt} ≠ Sollwert ${f}/${u}/${m}/${g}`,
      );
    }
    for (const fz of b.bogen.fahrzeuge) {
      const kurz = fz.typ.freitext ?? "?";
      const istAnhaenger = kurz.startsWith("AB-MANV");
      if (!istAnhaenger && (!fz.funkrufname || fz.funkrufname.teile.length === 0)) {
        fehler.push(`${b.datei}: ${kurz} ohne Funkrufnamen`);
      }
      if (!istAnhaenger && fz.funkrufname?.ort !== b.ort.kreis) {
        fehler.push(`${b.datei}: ${kurz} führt nicht den Kreis „${b.ort.kreis}"`);
      }
    }
  });

  // Verbandssummen gegen das Dokument.
  const summe = (verband: string): { f: number; u: number; m: number; g: number } => {
    let f = 0, u = 0, m = 0, g = 0;
    SPECS.forEach((spec) => {
      if (spec.verband !== verband) return;
      f += spec.soll[0]; u += spec.soll[1]; m += spec.soll[2]; g += spec.soll[3];
    });
    return { f, u, m, g };
  };
  const eeNrw = summe("Einsatzeinheit NRW");
  if (eeNrw.f !== 1 || eeNrw.u !== 7 || eeNrw.m !== 25 || eeNrw.g !== 33) {
    fehler.push(
      `Einsatzeinheit NRW: Summe ${eeNrw.f}/${eeNrw.u}/${eeNrw.m}/${eeNrw.g} ≠ Dokument 1/7/25/33`,
    );
  }
  const bhp50 = summe("BHP 50 NRW");
  if (bhp50.f !== 9 || bhp50.u !== 5 || bhp50.m !== 64 || bhp50.g !== 78) {
    fehler.push(
      `BHP 50 NRW: Summe ${bhp50.f}/${bhp50.u}/${bhp50.m}/${bhp50.g} ≠ Dokument 9/5/64/78`,
    );
  }

  if (fehler.length > 0) {
    throw new Error(`Selbstprüfung fehlgeschlagen:\n  ${fehler.join("\n  ")}`);
  }
}

// ---------------------------------------------------------------- Hauptlauf

const beispiele: BeispielBogen[] = SPECS.map(bogenBauen);

pruefen(beispiele);

const ausgabe = join(wurzel, "examples", "katastrophenschutz", "nordrhein-westfalen");
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
  return `| ${b.datei} | ${b.verband} | ${b.einheit} | ${b.ort.kreis} | ${s.fuehrer}/${s.unterfuehrer}/${s.mannschaft}/${s.gesamt} |`;
});
writeFileSync(
  join(ausgabe, "README.md"),
  `# Beispiel-Erfassungsbögen — Katastrophenschutz Nordrhein-Westfalen

${beispiele.length} generierte Beispiel-Teileinheiten nach dem Konzept
**„Vorgeplante überörtliche Hilfe im Sanitäts- und Betreuungsdienst im Land
Nordrhein-Westfalen"** (VüH-SanBt NRW, Version 2.1, Ausgabe 15.11.2024,
Innenministerium NRW / Institut der Feuerwehr NRW).

Alle Personen, Kreis-Zuordnungen, Wachennummern und Kennzeichen sind
**fiktiv**.

## Warum NRW anders erschlossen wurde als die meisten anderen Länder

NRW kennt keine Katastrophenschutz-Verordnung mit Anlage/Schaubildern je
Einheit wie z. B. Thüringen oder Sachsen. Stattdessen führt das Land seit
2013 landesweit einheitliche **Katastrophenschutz-Konzepte** ein — mit
derselben Verbindlichkeit, aber als eigenständige Innenministeriums-Dokumente
statt als Verordnungsanlage. Das hier verwendete Konzept ist aktuell
(Version 2.1 vom 15.11.2024) und enthält je Teileinheit/Modul eine exakte
Rollenliste **und** Fahrzeugausstattung — vergleichbar detailliert wie die
Schaubilder der ThürKatSVO.

## Die zwei abgebildeten Bausteine

* **Einsatzeinheit NRW (EE NRW)** — die überall in NRW landesweit
  einheitlich eingeführte Basiseinheit (Erlass vom 23.08.2013), 33
  Funktionen (1/7/25/33) in vier Teileinheiten: Führung, Sanität, Betreuung,
  Unterstützung.
* **Behandlungsplatz 50 NRW (BHP 50 NRW)** — der aus mindestens zwei
  Einsatzeinheiten NRW plus Feuerwehr/Rettungsdienst gebildete
  sanitätsdienstliche Großverband, 78 Funktionen (9/5/64/78) in neun
  Modulen: Führungsstaffel, Eingangssichtung, Behandlungsbereich „Kritische
  Patienten" (rot/gelb), Behandlungsbereich „Unkritische Patienten" (grün),
  Logistik (Führung), Interner Patiententransport, Technische Unterstützung,
  Verpflegung, Ausgangsdokumentation.

**Nicht abgebildet**, obwohl als Landeskonzepte real existierend: der
Betreuungsplatz 500 NRW (BTP 500 NRW, 72 Funktionen — dasselbe Dokument, aber
mit mehr Untermodulen als hier ausgewertet), der Patiententransport-Zug 10
NRW (PT-Z 10 NRW, 20 Funktionen), das sechsteilige ABC-Schutz-Konzept NRW und
der Wasserrettungszug NRW (WR-Z NRW, 44 Funktionen). Für diese vier Konzepte
liegen Gesamtstärke und Mindest-Fahrzeugzahl vor, aber keine mit
vertretbarem Aufwand ausgewertete Rollenliste je Teileinheit — das kann in
einem Folgeschritt ergänzt werden.

## Träger

Für die Einsatzeinheit NRW nennt das Dokument „in der Regel … Kräfte einer
anerkannten Hilfsorganisation" (ASB, DRK, JUH, MHD), lässt aber ausdrücklich
zu, dass unterschiedliche Teileinheiten von unterschiedlichen Organisationen
gebildet werden. Für den BHP 50 NRW nennt das Dokument keine Organisation je
Modul. Die Trägerzuordnung je Bogen ist daher **redaktionell gewählt**, um
die Bandbreite der mitwirkenden Organisationen zu zeigen — keine
Dokumentvorgabe.

## Funkrufnamen

Für NRW wurde kein landeseigener, öffentlich zugänglicher
Fahrzeugkennzahlen-Katalog gefunden. Genähert wird daher — wie bei Thüringen
und Bayern — mit der bundesweiten OPTA-Richtlinie der BDBOS als Vorbild:

> \`<Kennwort> <Kreis/kreisfreie Stadt> <Wache> <Fahrzeugkennzahl>[/<lfd. Nr.>]\`

Kennwort je Trägerorganisation: DRK „Rotkreuz", ASB „Sama", JUH „Akkon", MHD
„Johannes", Feuerwehr „Florian". Die Fahrzeugkennzahlen selbst sind **kein
NRW-amtliches Schema**, sondern eine plausible, an die OPTA-Systematik
angelehnte Zuordnung.

Neu erzeugen mit: \`npm run beispiele:kats-nw\` (deterministisch, fester
Zufalls-Seed).

| Datei | Verband | Teileinheit/Modul | Kreis | Stärke (F/U/M/Gesamt) |
|---|---|---|---|---|
${zeilen.join("\n")}

Quelle: ${QUELLE}.
`,
);

console.log(`${beispiele.length} Bögen nach ${ausgabe} geschrieben.`);
