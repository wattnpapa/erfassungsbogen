/**
 * Erzeugt Beispiel-Erfassungsbögen der Katastrophenschutz-Einheiten Hessens
 * als JSON nach examples/katastrophenschutz/hessen/. Abgelegt ist nur das
 * Bogen-JSON; die PDF entsteht erst beim Anklicken in der App aus dem
 * aktuellen Layout.
 *
 * Aufruf (Node ≥ 22): npm run beispiele:kats-he
 *
 * Grundlage: Katastrophenschutz-Dienstvorschrift 400 (KatSDV 400, Stand
 * 01.04.2012) regelt Führung und Aufgaben, verweist für Stärke und
 * Gliederung aber ausdrücklich auf das Konzept „Katastrophenschutz in
 * Hessen" (Hessisches Ministerium des Innern, Fassung 01.01.2024 — die
 * operativ-taktischen Anlagen sind seit der Fassung 01.01.2016 unverändert)
 * und dessen Anlage 2 „Übersicht Einheiten und Einrichtungen" (Stand
 * 01.01.2016): Sie nennt die offizielle Sollstärke jedes Aufgabenbereichs
 * als Führer/Unterführer/Mannschaft/Gesamt UND die landesweite
 * Personen-Gesamtkraft (Anzahl Einheiten × Stärke) als Prüfsumme — sowie in
 * Bildtabellen (Anlage 2.3–2.24) die Teileinheiten-Gliederung mit
 * Funktionen und Fahrzeugtyp je Teileinheit. Damit gilt wie bei Sachsen und
 * Niedersachsen: ein Bogen je kleinster selbstständiger Teileinheit, nicht
 * ein Bogen je Zug/Gruppe insgesamt.
 *
 * WICHTIGER HINWEIS ZU DEN BILDTABELLEN: Die Personenzahlen der einzelnen
 * Rollen in den Bildtabellen (Anlage 2.3–2.24) summieren sich bei mehreren
 * Aufgabenbereichen (Löschzug, Gefahrstoff-ABC-Zug, Sanitätszug,
 * Betreuungszug, Wasserrettungszug, Führungsgruppe TEL) NICHT exakt zur
 * offiziellen Sollstärke aus der Übersichtstabelle (Anlage 2.1) — ein
 * Befund, der sich schon in den Quelldokumenten selbst zeigt (vermutlich
 * Rundung oder Doppelbesetzung im Original). Bindend für diesen Generator
 * ist durchgehend die offizielle Sollstärke aus Anlage 2.1: die
 * Mannschafts-Kopfzahlen einzelner Teileinheiten sind dafür leicht
 * angepasst, Funktionsbezeichnungen und Fahrzeugtypen bleiben aus den
 * Bildtabellen. Siehe README im Zielordner für die betroffenen Einheiten.
 *
 * Die Medizinische Task Force (MTF) und der KatS-Stab sind NICHT als Bogen
 * abgebildet: Die MTF ist ein bundeseinheitlich ausgestatteter Großverband
 * (111 Personen), der Stab eine reine Personal- ohne Fahrzeugeinheit — beide
 * passen nicht zum Bogenformat „Einheit mit Fahrzeugen".
 *
 * Funkrufnamen folgen dem Hessischen Funkrufnamenkatalog (Sonderschutzplan
 * Bereich 2, Plan Nr. 2, Version 1.02, 2011): Kennwort + Landkreis-Kürzel +
 * Standortkennzahl-Fahrzeugkennzahl. Die Standortkennzahl ist für die
 * Beispiele eine fiktive, fortlaufende Zahl je Landkreis; die
 * Fahrzeugkennzahl folgt dagegen der amtlichen Anlage I des Katalogs.
 *
 * Fiktiv sind alle Personen, Orte-Zuordnungen und Kennzeichen.
 *
 * Am Ende läuft eine Selbstprüfung (Stärke je Teileinheit gegen die
 * Sollstärke aus Anlage 2.1, QR-Roundtrip je Bogen); die README im
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
const rnd = prng(20120401); // Stand-Datum der KatSDV 400
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
  "Bauer", "Becker", "Braun", "Engel", "Ernst", "Franke", "Graf", "Hahn",
  "Hartmann", "Herbst", "Hoffmann", "Kaiser", "Keller", "Klein", "Koch", "König",
  "Krüger", "Lang", "Lehmann", "Lorenz", "Neumann", "Otto", "Peters", "Richter",
  "Roth", "Schäfer", "Schmitt", "Schneider", "Schulz", "Schwarz", "Sommer", "Stein",
  "Vogel", "Wagner", "Weber", "Weiß", "Werner", "Winkler", "Wolf", "Zimmermann",
  "Bender", "Best", "Diehl", "Fuchs", "Groß", "Hess", "Hofmann", "Jung",
  "Kern", "Kirsch", "Krebs", "Kuhn", "May", "Reuter", "Scherer", "Schuster",
  "Seibert", "Vetter", "Wolff", "Ziegler",
] as const;

/** Externe/Berufs-Qualifikationen (Freitext) — gelegentlich gestreut. */
const QUALI_POOL = [
  "Berufskraftfahrer (Beruf)",
  "Rettungssanitäter (extern)",
  "Elektrofachkraft (Beruf)",
  "Koch (Beruf)",
  "IT-Fachkraft (Beruf)",
  "Motorsägenschein AS Baum I (extern)",
  "Funkamateur (extern)",
  "Gesundheits- und Krankenpfleger (Beruf)",
] as const;

// ---------------------------------------------------------------- Hessen: Orte

interface HeOrt {
  ort: string;
  kreis: string;
  kfz: string;
}

/** Kreisstädte über alle Regierungsbezirke Hessens (Kürzel = amtliches Kfz-Kennzeichen der Anlage II). */
const HE_ORTE: HeOrt[] = [
  { ort: "Heppenheim", kreis: "Kreis Bergstraße", kfz: "HP" },
  { ort: "Darmstadt", kreis: "Stadt Darmstadt", kfz: "DA" },
  { ort: "Groß-Gerau", kreis: "Kreis Groß-Gerau", kfz: "GG" },
  { ort: "Frankfurt am Main", kreis: "Stadt Frankfurt am Main", kfz: "F" },
  { ort: "Bad Homburg", kreis: "Hochtaunuskreis", kfz: "HG" },
  { ort: "Gelnhausen", kreis: "Main-Kinzig-Kreis", kfz: "MKK" },
  { ort: "Hofheim am Taunus", kreis: "Main-Taunus-Kreis", kfz: "MTK" },
  { ort: "Erbach", kreis: "Odenwaldkreis", kfz: "ERB" },
  { ort: "Offenbach am Main", kreis: "Stadt Offenbach am Main", kfz: "OF" },
  { ort: "Bad Schwalbach", kreis: "Rheingau-Taunus-Kreis", kfz: "RÜD" },
  { ort: "Wiesbaden", kreis: "Stadt Wiesbaden", kfz: "WI" },
  { ort: "Friedberg (Hessen)", kreis: "Wetteraukreis", kfz: "FB" },
  { ort: "Gießen", kreis: "Kreis Gießen", kfz: "GI" },
  { ort: "Wetzlar", kreis: "Lahn-Dill-Kreis", kfz: "LDK" },
  { ort: "Limburg an der Lahn", kreis: "Kreis Limburg-Weilburg", kfz: "LM" },
  { ort: "Marburg", kreis: "Kreis Marburg-Biedenkopf", kfz: "MR" },
  { ort: "Lauterbach (Hessen)", kreis: "Vogelsbergkreis", kfz: "VB" },
  { ort: "Fulda", kreis: "Kreis Fulda", kfz: "FD" },
  { ort: "Bad Hersfeld", kreis: "Kreis Hersfeld-Rotenburg", kfz: "HEF" },
  { ort: "Kassel", kreis: "Stadt Kassel", kfz: "KS" },
  { ort: "Homberg (Efze)", kreis: "Schwalm-Eder-Kreis", kfz: "HR" },
  { ort: "Korbach", kreis: "Kreis Waldeck-Frankenberg", kfz: "KB" },
  { ort: "Eschwege", kreis: "Werra-Meißner-Kreis", kfz: "ESW" },
];

// ------------------------------------------------------------------ Träger

/** FUNKRUF_KENNWOERTER-Codes (src/vokabulare/thw.ts). */
const KW = { FLORIAN: 2, ROTKREUZ: 3, AKKON: 4, JOHANNES: 5, SAMA: 6, PELIKAN: 7 };

interface Traeger {
  org: OrganisationsTyp;
  kennwort: VokabularWert;
  organisationName: (o: HeOrt) => string;
  ebene: (o: HeOrt) => HierarchieEbene[];
}

const feuerwehr: Traeger = {
  org: OrganisationsTyp.FEUERWEHR,
  kennwort: { code: KW.FLORIAN },
  organisationName: (o) => `Feuerwehr ${o.kreis}`,
  ebene: (o) => [{ bezeichnung: { freitext: "Landkreis/kreisfreie Stadt" }, name: o.kreis }],
};

function hiorg(org: OrganisationsTyp, kennwort: VokabularWert, kurz: string, lang: string): Traeger {
  return {
    org,
    kennwort,
    organisationName: (o) => `${lang} — Kreisverband ${o.kreis}`,
    ebene: (o) => [
      { bezeichnung: { freitext: "Landkreis/kreisfreie Stadt" }, name: o.kreis },
      { bezeichnung: { freitext: "Kreisverband" }, name: `${kurz}-Kreisverband ${o.kreis}` },
    ],
  };
}
const drk = hiorg(OrganisationsTyp.DRK, { code: KW.ROTKREUZ }, "DRK", "Deutsches Rotes Kreuz");
const juh = hiorg(OrganisationsTyp.JUH, { code: KW.AKKON }, "JUH", "Johanniter-Unfall-Hilfe");
const mhd = hiorg(OrganisationsTyp.MHD, { code: KW.JOHANNES }, "MHD", "Malteser Hilfsdienst");
const asb = hiorg(OrganisationsTyp.ASB, { code: KW.SAMA }, "ASB", "Arbeiter-Samariter-Bund");
const dlrg = hiorg(OrganisationsTyp.DLRG, { code: KW.PELIKAN }, "DLRG", "DLRG");

// --------------------------------------------------------------- Kurzhelfer

function slug(s: string): string {
  return s
    .toLowerCase()
    .replaceAll("ä", "ae").replaceAll("ö", "oe").replaceAll("ü", "ue").replaceAll("ß", "ss")
    .normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function dieselFuer(kurz: string): number {
  if (/^(WLF|LF|TLF|SW)/.test(kurz)) return 90;
  if (/^(GW|ELW|MZF)/.test(kurz)) return 70;
  if (/^(KTW|MTW|RTB)/.test(kurz)) return 45;
  return 0;
}

/** Amtliche Fahrzeugkennzahl nach Anlage I des Funkrufnamenkatalogs 2011 (Auszug für KatS-Fahrzeuge). */
const FZ_KENNZAHL: Record<string, number> = {
  KdoW: 10, "ELW 1": 11, "ELW 2": 12, "GW-IuK": 14, BtKombi: 18, MTW: 19,
  "LF 10/6": 43, "LF 16/12": 44, "LF-KatS": 45, RW: 52, "GW-G": 55, "ABC-ErkKW": 72,
  "GW-StrSpTr": 71, "GW-Dekon P": 74, "GW-N": 64, "SW-KatS": 62, "GW-San": 96,
  KTW: 93, RTW: 83, "GW-Betreuung": 75, "GW-WR": 58, "GW-Taucher": 57, "GW-Technik": 76,
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
  kurz: string;
  lang?: string;
  anzahl?: number;
  ohneFunk?: boolean;
}

interface BogenSpec {
  einheit: string; // übergeordneter Aufgabenbereich (z. B. "Löschzug (LZ)")
  teileinheit: string;
  quelle: string; // Anlage-Nummer des Konzepts
  traeger: Traeger;
  personal: PlatzSpec[];
  fahrzeuge: FzSpec[];
  szenario: string; // {ort} wird ersetzt
  /** Sollstärke laut Anlage 2.1 als "Führer/Unterführer/Mannschaft/Gesamt" — wird geprüft. */
  soll: [number, number, number, number];
}

const F = R.FUEHRER;
const U = R.UNTERFUEHRER;
const M = R.MANNSCHAFT;

const KONZEPT = "Konzept „Katastrophenschutz in Hessen” (HMdIS, Anlage 2.1, 01.01.2016/2024)";

const SPECS: BogenSpec[] = [
  // ================================================================ Führung
  {
    einheit: "Führungsgruppe TEL (FüGrTEL) — 1/4/4/9",
    teileinheit: "Führungsgruppe TEL",
    quelle: "Anlage 2.5",
    traeger: feuerwehr,
    personal: [
      { rolle: F, funktion: "Leiter/-in FüGrTEL" },
      { rolle: U, funktion: "Führungsassistent/-in", anzahl: 3 },
      { rolle: U, funktion: "Lagekartenführer/-in" },
      { rolle: M, funktion: "Melder/-in", anzahl: 4 },
    ],
    fahrzeuge: [{ kurz: "ELW 2", lang: "Einsatzleitwagen 2" }],
    szenario: "Großschadenslage {ort} — Technische Einsatzleitung",
    soll: [1, 4, 4, 9],
  },
  {
    einheit: "Informations- und Kommunikationszentrale (IuKZt) — 0/1/5/6",
    teileinheit: "IuK-Zentrale (IuKZt)",
    quelle: "Anlage 2.7",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Staffelführer/-in" },
      { rolle: M, funktion: "Fernmelder/-in", anzahl: 5, quali: "Sprechfunker" },
    ],
    fahrzeuge: [],
    szenario: "Großschadenslage {ort} — Fernmeldeverbindungen der Integrierten Leitstelle",
    soll: [0, 1, 5, 6],
  },
  {
    einheit: "Informations- und Kommunikationsgruppe (IuKGr) — 0/2/7/9",
    teileinheit: "ELW-2-Trupp",
    quelle: "Anlage 2.8",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Fernmelder/-in" },
      { rolle: M, funktion: "Kraftfahrer/-in" },
    ],
    fahrzeuge: [{ kurz: "ELW 2", lang: "Einsatzleitwagen 2" }],
    szenario: "Großschadenslage {ort} — mobile Führungsstelle",
    soll: [0, 1, 2, 3],
  },
  {
    einheit: "Informations- und Kommunikationsgruppe (IuKGr) — 0/2/7/9",
    teileinheit: "GW-IuK-Trupp",
    quelle: "Anlage 2.8",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Staffelführer/-in" },
      { rolle: M, funktion: "Fernmelder/-in", anzahl: 4, quali: "Sprechfunker" },
      { rolle: M, funktion: "Kraftfahrer/-in / Gerätewart/-in" },
    ],
    fahrzeuge: [{ kurz: "GW-IuK", lang: "Gerätewagen Information und Kommunikation" }],
    szenario: "Großschadenslage {ort} — Fernmeldeverbindungen der Einsatzstelle",
    soll: [0, 1, 5, 6],
  },

  // ============================================================ Brandschutz
  {
    einheit: "Löschzug (LZ) — 1/4/20/25",
    teileinheit: "Zugtrupp (ZTr)",
    quelle: "Anlage 2.9",
    traeger: feuerwehr,
    personal: [
      { rolle: F, funktion: "Zugführer/-in" },
      { rolle: U, funktion: "stellv. Zugführer/-in" },
      { rolle: M, funktion: "Melder/-in" },
      { rolle: M, funktion: "Kraftfahrer/-in" },
    ],
    fahrzeuge: [{ kurz: "ELW 1", lang: "Einsatzleitwagen 1" }],
    szenario: "Großbrand {ort} — Führung Löschzug",
    soll: [1, 1, 2, 4],
  },
  {
    einheit: "Löschzug (LZ) — 1/4/20/25",
    teileinheit: "1. Löschgruppe",
    quelle: "Anlage 2.9",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Melder/-in" },
      { rolle: M, funktion: "Truppführer/-in", anzahl: 2, quali: "Atemschutzgeräteträger" },
      { rolle: M, funktion: "Truppmitglied", anzahl: 4 },
      { rolle: M, funktion: "Maschinist/-in" },
    ],
    fahrzeuge: [{ kurz: "LF 10/6", lang: "Löschgruppenfahrzeug LF 10/6" }],
    szenario: "Großbrand {ort} — Brandbekämpfung, Menschenrettung",
    soll: [0, 1, 8, 9],
  },
  {
    einheit: "Löschzug (LZ) — 1/4/20/25",
    teileinheit: "2. Löschgruppe",
    quelle: "Anlage 2.9",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Melder/-in" },
      { rolle: M, funktion: "Truppführer/-in", anzahl: 2, quali: "Atemschutzgeräteträger" },
      { rolle: M, funktion: "Truppmitglied", anzahl: 4 },
      { rolle: M, funktion: "Maschinist/-in" },
    ],
    fahrzeuge: [{ kurz: "LF-KatS", lang: "Löschgruppenfahrzeug Katastrophenschutz (Bund)" }],
    szenario: "Großbrand {ort} — Brandbekämpfung, Wasserversorgung",
    soll: [0, 1, 8, 9],
  },
  {
    einheit: "Löschzug (LZ) — 1/4/20/25",
    teileinheit: "Ergänzungstrupp (ErgTr)",
    quelle: "Anlage 2.9",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Truppführer/-in" },
      { rolle: M, funktion: "Truppmitglied" },
      { rolle: M, funktion: "Maschinist/-in" },
    ],
    fahrzeuge: [{ kurz: "SW-KatS", lang: "Schlauchwagen 2000 Katastrophenschutz" }],
    szenario: "Großbrand {ort} — Wasserförderung über lange Wegstrecke",
    soll: [0, 1, 2, 3],
  },

  // ============================================================ Gefahrstoff/ABC
  {
    einheit: "Gefahrstoff-ABC-Zug (GABCZ) — 1/5/16/22",
    teileinheit: "Zugtrupp (ZTr)",
    quelle: "Anlage 2.13",
    traeger: feuerwehr,
    personal: [
      { rolle: F, funktion: "Zugführer/-in" },
      { rolle: U, funktion: "stellv. Zugführer/-in" },
      { rolle: M, funktion: "Melder/-in" },
      { rolle: M, funktion: "Kraftfahrer/-in" },
    ],
    fahrzeuge: [{ kurz: "ELW 1", lang: "Einsatzleitwagen 1" }],
    szenario: "Gefahrstofffreisetzung {ort} — Führung GABC-Zug",
    soll: [1, 1, 2, 4],
  },
  {
    einheit: "Gefahrstoff-ABC-Zug (GABCZ) — 1/5/16/22",
    teileinheit: "Gefahrstoffgruppe (GefGr)",
    quelle: "Anlage 2.13",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: U, funktion: "Melder/-in" },
      { rolle: M, funktion: "Truppführer/-in", anzahl: 3, quali: "ABC-Lehrgang" },
      { rolle: M, funktion: "Truppmitglied", anzahl: 3 },
      { rolle: M, funktion: "Maschinist/-in" },
    ],
    fahrzeuge: [{ kurz: "LF 10/6", lang: "Löschgruppenfahrzeug LF 10/6" }],
    szenario: "Gefahrstofffreisetzung {ort} — Erkundung, Absperrung, Erstmaßnahmen",
    soll: [0, 2, 7, 9],
  },
  {
    einheit: "Gefahrstoff-ABC-Zug (GABCZ) — 1/5/16/22",
    teileinheit: "Gerätegruppe, Trupp 1",
    quelle: "Anlage 2.13",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Truppführer/-in" },
      { rolle: M, funktion: "Helfer/-in", anzahl: 2, quali: "ABC-Lehrgang" },
      { rolle: M, funktion: "Kraftfahrer/-in" },
    ],
    fahrzeuge: [{ kurz: "GW-G", lang: "Gerätewagen Gefahrgut" }],
    szenario: "Gefahrstofffreisetzung {ort} — Abdichten, Umfüllen",
    soll: [0, 1, 3, 4],
  },
  {
    einheit: "Gefahrstoff-ABC-Zug (GABCZ) — 1/5/16/22",
    teileinheit: "Gerätegruppe, Trupp 2",
    quelle: "Anlage 2.13",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Truppführer/-in" },
      { rolle: M, funktion: "Helfer/-in", anzahl: 3, quali: "ABC-Lehrgang" },
      { rolle: M, funktion: "Maschinist/-in" },
    ],
    fahrzeuge: [{ kurz: "TLF 4000", lang: "Tanklöschfahrzeug 4000" }],
    szenario: "Gefahrstofffreisetzung {ort} — Kühlen, Verdünnen",
    soll: [0, 1, 4, 5],
  },
  {
    einheit: "Gefahrstoff-Dekontaminations-Zug (GDekonZ) — 1/4/17/22",
    teileinheit: "Zugtrupp (ZTr)",
    quelle: "Anlage 2.14",
    traeger: feuerwehr,
    personal: [
      { rolle: F, funktion: "Zugführer/-in" },
      { rolle: U, funktion: "stellv. Zugführer/-in" },
      { rolle: M, funktion: "Melder/-in" },
      { rolle: M, funktion: "Kraftfahrer/-in" },
    ],
    fahrzeuge: [{ kurz: "ELW 1", lang: "Einsatzleitwagen 1" }],
    szenario: "Gefahrstofffreisetzung {ort} — Führung Dekontaminations-Zug",
    soll: [1, 1, 2, 4],
  },
  {
    einheit: "Gefahrstoff-Dekontaminations-Zug (GDekonZ) — 1/4/17/22",
    teileinheit: "Logistikgruppe (LogGr)",
    quelle: "Anlage 2.14",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Melder/-in" },
      { rolle: M, funktion: "Truppführer/-in", anzahl: 3 },
      { rolle: M, funktion: "Truppmitglied", anzahl: 3 },
      { rolle: M, funktion: "Maschinist/-in" },
    ],
    fahrzeuge: [{ kurz: "LF-KatS", lang: "Löschgruppenfahrzeug Katastrophenschutz (Bund)" }],
    szenario: "Gefahrstofffreisetzung {ort} — Wasserversorgung Dekonplatz",
    soll: [0, 1, 8, 9],
  },
  {
    einheit: "Gefahrstoff-Dekontaminations-Zug (GDekonZ) — 1/4/17/22",
    teileinheit: "Dekontaminationsgruppe, Trupp 1",
    quelle: "Anlage 2.14",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Staffelführer/-in" },
      { rolle: M, funktion: "Helfer/-in", anzahl: 3 },
      { rolle: M, funktion: "Kraftfahrer/-in" },
    ],
    fahrzeuge: [{ kurz: "GW-Dekon P", lang: "Gerätewagen Dekontamination Personen" }],
    szenario: "Gefahrstofffreisetzung {ort} — Personendekontamination",
    soll: [0, 1, 4, 5],
  },
  {
    einheit: "Gefahrstoff-Dekontaminations-Zug (GDekonZ) — 1/4/17/22",
    teileinheit: "Dekontaminationsgruppe, Trupp 2",
    quelle: "Anlage 2.14",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Truppführer/-in" },
      { rolle: M, funktion: "Helfer/-in", anzahl: 2 },
      { rolle: M, funktion: "Kraftfahrer/-in" },
    ],
    fahrzeuge: [{ kurz: "GW-N", lang: "Gerätewagen Nachschub" }],
    szenario: "Gefahrstofffreisetzung {ort} — Nachschub Dekonmaterial",
    soll: [0, 1, 3, 4],
  },
  {
    einheit: "GABC-Messzentrale (GABCMZt) — 0/1/5/6",
    teileinheit: "Messzentrale (GABCMZt)",
    quelle: "Anlage 2.10",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Führungshilfspersonal", anzahl: 2 },
      { rolle: M, funktion: "Fernmelder/-in", anzahl: 3, quali: "Sprechfunker" },
    ],
    fahrzeuge: [{ kurz: "GW-IuK", lang: "als mobile Messzentrale ausgestattet" }],
    szenario: "Gefahrstofffreisetzung {ort} — Auswertung Messwerte, Lagedarstellung",
    soll: [0, 1, 5, 6],
  },
  {
    einheit: "GABC-Mess-Gruppe (GABCMGr) — 0/2/6/8",
    teileinheit: "ABC-Erkundungstrupp",
    quelle: "Anlage 2.12",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Helfer/-in", anzahl: 3, quali: "ABC-Lehrgang" },
      { rolle: M, funktion: "Kraftfahrer/-in" },
    ],
    fahrzeuge: [{ kurz: "ABC-ErkKW", lang: "ABC-Erkundungskraftwagen" }],
    szenario: "Gefahrstofffreisetzung {ort} — Erkundung, Messung",
    soll: [0, 1, 4, 5],
  },
  {
    einheit: "GABC-Mess-Gruppe (GABCMGr) — 0/2/6/8",
    teileinheit: "Strahlenspürtrupp",
    quelle: "Anlage 2.12",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Truppführer/-in" },
      { rolle: M, funktion: "Helfer/-in" },
      { rolle: M, funktion: "Kraftfahrer/-in" },
    ],
    fahrzeuge: [{ kurz: "GW-StrSpTr", lang: "Gerätewagen Strahlenspürtrupp" }],
    szenario: "Kerntechnischer Unfall {ort} — Strahlenmessung",
    soll: [0, 1, 2, 3],
  },

  // ============================================================== Sanität
  {
    einheit: "Sanitätszug (SanZ) — 1/8/16/25",
    teileinheit: "Zugtrupp (ZTr)",
    quelle: "Anlage 2.16",
    traeger: drk,
    personal: [
      { rolle: F, funktion: "Zugführer/-in" },
      { rolle: U, funktion: "stellv. Zugführer/-in" },
      { rolle: M, funktion: "Melder/-in" },
      { rolle: M, funktion: "Kraftfahrer/-in" },
    ],
    fahrzeuge: [{ kurz: "ELW 1", lang: "Einsatzleitwagen 1" }],
    szenario: "MANV {ort} — Führung Sanitätszug",
    soll: [1, 1, 2, 4],
  },
  {
    einheit: "Sanitätszug (SanZ) — 1/8/16/25",
    teileinheit: "Behandlungsgruppe",
    quelle: "Anlage 2.16",
    traeger: drk,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: U, funktion: "Rettungsassistent/-in (Notarzt-Vertretung)", quali: "Notarzt" },
      { rolle: U, funktion: "Truppführer/-in", anzahl: 2, quali: "Rettungssanitäter" },
      { rolle: M, funktion: "Rettungssanitäter/-in", anzahl: 6 },
      { rolle: M, funktion: "Kraftfahrer/-in", anzahl: 2 },
    ],
    fahrzeuge: [
      { kurz: "GW-San", lang: "Gerätewagen Sanität" },
      { kurz: "KTW", lang: "Krankentransportwagen" },
    ],
    szenario: "MANV {ort} — Sichtung, Behandlung, Herstellung der Transportfähigkeit",
    soll: [0, 4, 8, 12],
  },
  {
    einheit: "Sanitätszug (SanZ) — 1/8/16/25",
    teileinheit: "Transportgruppe",
    quelle: "Anlage 2.16",
    traeger: drk,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: U, funktion: "Truppführer/-in", anzahl: 2 },
      { rolle: M, funktion: "Rettungssanitäter/-in", anzahl: 3 },
      { rolle: M, funktion: "Kraftfahrer/-in", anzahl: 3 },
    ],
    fahrzeuge: [
      { kurz: "KTW", lang: "Krankentransportwagen", anzahl: 2 },
      { kurz: "RTW", lang: "Rettungswagen" },
    ],
    szenario: "MANV {ort} — Transport von Verletzten und Erkrankten",
    soll: [0, 3, 6, 9],
  },

  // ============================================================= Betreuung
  {
    einheit: "Betreuungszug (BtZ) — 1/8/16/25",
    teileinheit: "Zugtrupp (ZTr)",
    quelle: "Anlage 2.18",
    traeger: mhd,
    personal: [
      { rolle: F, funktion: "Zugführer/-in" },
      { rolle: U, funktion: "stellv. Zugführer/-in" },
      { rolle: M, funktion: "Melder/-in" },
      { rolle: M, funktion: "Kraftfahrer/-in" },
    ],
    fahrzeuge: [{ kurz: "ELW 1", lang: "Einsatzleitwagen 1" }],
    szenario: "Evakuierung {ort} — Führung Betreuungszug",
    soll: [1, 1, 2, 4],
  },
  {
    einheit: "Betreuungszug (BtZ) — 1/8/16/25",
    teileinheit: "SEG Betreuung",
    quelle: "Anlage 2.18",
    traeger: mhd,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: U, funktion: "Truppführer/-in", anzahl: 3 },
      { rolle: M, funktion: "Helfer/-in", anzahl: 6 },
      { rolle: M, funktion: "Kraftfahrer/-in / Gerätewart/-in", anzahl: 2 },
    ],
    fahrzeuge: [
      { kurz: "GW-Technik", lang: "Gerätewagen Technik" },
      { kurz: "MTW", lang: "Mannschaftstransportwagen" },
    ],
    szenario: "Evakuierung {ort} — Aufbau Betreuungsstelle",
    soll: [0, 4, 8, 12],
  },
  {
    einheit: "Betreuungszug (BtZ) — 1/8/16/25",
    teileinheit: "Betreuungsgruppe",
    quelle: "Anlage 2.18",
    traeger: mhd,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: U, funktion: "Truppführer/-in", anzahl: 2 },
      { rolle: M, funktion: "Helfer/-in", anzahl: 4 },
      { rolle: M, funktion: "Kraftfahrer/-in", anzahl: 2 },
    ],
    fahrzeuge: [
      { kurz: "BtKombi", lang: "Betreuungskombi Katastrophenschutz", anzahl: 2 },
    ],
    szenario: "Evakuierung {ort} — Verpflegung und Unterbringung Betroffener",
    soll: [0, 3, 6, 9],
  },
  {
    einheit: "Betreuungsstelle 25 (BtSt) — 0/5/4/9",
    teileinheit: "Betreuungsstelle 25 (BtSt)",
    quelle: "Anlage 2.19",
    traeger: mhd,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: U, funktion: "Melder/-in" },
      { rolle: U, funktion: "Truppführer/-in", anzahl: 3 },
      { rolle: M, funktion: "Helfer/-in", anzahl: 3 },
      { rolle: M, funktion: "Gerätewart/-in" },
    ],
    fahrzeuge: [{ kurz: "BtKombi", lang: "Betreuungskombi Katastrophenschutz" }],
    szenario: "Evakuierung {ort} — ortsfeste Betreuungsstelle für 25 Betroffene",
    soll: [0, 5, 4, 9],
  },

  // =========================================================== Kreisauskunftsbüro
  {
    einheit: "Kreisauskunftsbüro (KAB) — 1/5/18/24",
    teileinheit: "Führung",
    quelle: "Anlage 2.20",
    traeger: drk,
    personal: [
      { rolle: F, funktion: "Leiter/-in KAB" },
      { rolle: U, funktion: "Führungsassistent/-in" },
      { rolle: M, funktion: "Sprechfunker/-in" },
      { rolle: M, funktion: "Kraftfahrer/-in" },
    ],
    fahrzeuge: [{ kurz: "ELW 1", lang: "Einsatzleitwagen 1" }],
    szenario: "Großschadenslage {ort} — Führung Kreisauskunftsbüro",
    soll: [1, 1, 2, 4],
  },
  {
    einheit: "Kreisauskunftsbüro (KAB) — 1/5/18/24",
    teileinheit: "Aufnahme",
    quelle: "Anlage 2.20",
    traeger: drk,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Helfer/-in", anzahl: 4 },
      { rolle: M, funktion: "Kraftfahrer/-in" },
    ],
    fahrzeuge: [{ kurz: "MTW", lang: "Mannschaftstransportwagen" }],
    szenario: "Großschadenslage {ort} — Aufnahme von Anfragen",
    soll: [0, 1, 5, 6],
  },
  {
    einheit: "Kreisauskunftsbüro (KAB) — 1/5/18/24",
    teileinheit: "Verarbeitung",
    quelle: "Anlage 2.20",
    traeger: drk,
    personal: [
      { rolle: U, funktion: "Truppführer/-in" },
      { rolle: M, funktion: "Helfer/-in", anzahl: 2 },
      { rolle: M, funktion: "Kraftfahrer/-in" },
    ],
    fahrzeuge: [{ kurz: "MTW", lang: "Mannschaftstransportwagen" }],
    szenario: "Großschadenslage {ort} — Verarbeitung der Auskunftsdaten",
    soll: [0, 1, 3, 4],
  },
  {
    einheit: "Kreisauskunftsbüro (KAB) — 1/5/18/24",
    teileinheit: "Erfassung",
    quelle: "Anlage 2.20",
    traeger: drk,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Helfer/-in", anzahl: 4 },
      { rolle: M, funktion: "Kraftfahrer/-in" },
    ],
    fahrzeuge: [{ kurz: "MTW", lang: "Mannschaftstransportwagen" }],
    szenario: "Großschadenslage {ort} — Erfassung Betroffener",
    soll: [0, 1, 5, 6],
  },
  {
    einheit: "Kreisauskunftsbüro (KAB) — 1/5/18/24",
    teileinheit: "Auskunft",
    quelle: "Anlage 2.20",
    traeger: drk,
    personal: [
      { rolle: U, funktion: "Truppführer/-in" },
      { rolle: M, funktion: "Helfer/-in", anzahl: 2 },
      { rolle: M, funktion: "Kraftfahrer/-in" },
    ],
    fahrzeuge: [{ kurz: "MTW", lang: "Mannschaftstransportwagen" }],
    szenario: "Großschadenslage {ort} — Auskunft an Angehörige",
    soll: [0, 1, 3, 4],
  },

  // =========================================================== Wasserrettung
  {
    einheit: "Wasserrettungszug (WRZ) — 1/5/19/25",
    teileinheit: "Zugtrupp (ZTr)",
    quelle: "Anlage 2.21",
    traeger: dlrg,
    personal: [
      { rolle: F, funktion: "Zugführer/-in" },
      { rolle: U, funktion: "stellv. Zugführer/-in" },
      { rolle: M, funktion: "Melder/-in" },
      { rolle: M, funktion: "Kraftfahrer/-in" },
    ],
    fahrzeuge: [{ kurz: "ELW 1", lang: "Einsatzleitwagen 1" }],
    szenario: "Hochwasser {ort} — Führung Wasserrettungszug",
    soll: [1, 1, 2, 4],
  },
  {
    einheit: "Wasserrettungszug (WRZ) — 1/5/19/25",
    teileinheit: "SEG Wasserrettung, Trupp 1",
    quelle: "Anlage 2.21",
    traeger: dlrg,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Bootsführer/-in", quali: "Bootsführerschein Binnen" },
      { rolle: M, funktion: "Rettungsschwimmer/-in", anzahl: 3 },
      { rolle: M, funktion: "Kraftfahrer/-in" },
    ],
    fahrzeuge: [{ kurz: "GW-WR", lang: "Gerätewagen Wasserrettung mit Rettungsboot" }],
    szenario: "Hochwasser {ort} — Wasserrettung, Personensuche",
    soll: [0, 1, 5, 6],
  },
  {
    einheit: "Wasserrettungszug (WRZ) — 1/5/19/25",
    teileinheit: "SEG Wasserrettung, Trupp 2",
    quelle: "Anlage 2.21",
    traeger: dlrg,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Bootsführer/-in", quali: "Bootsführerschein Binnen" },
      { rolle: M, funktion: "Rettungsschwimmer/-in", anzahl: 3 },
      { rolle: M, funktion: "Kraftfahrer/-in" },
    ],
    fahrzeuge: [{ kurz: "MTW", lang: "Mannschaftstransportwagen mit Hochwasserboot" }],
    szenario: "Hochwasser {ort} — Evakuierung von Personen",
    soll: [0, 1, 5, 6],
  },
  {
    einheit: "Wasserrettungszug (WRZ) — 1/5/19/25",
    teileinheit: "Taucher-Trupp",
    quelle: "Anlage 2.21",
    traeger: dlrg,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: U, funktion: "Einsatztaucher/-in", quali: "Einsatztaucher" },
      { rolle: M, funktion: "Einsatztaucher/-in", anzahl: 4, quali: "Einsatztaucher" },
      { rolle: M, funktion: "Signalmann/-frau" },
      { rolle: M, funktion: "Kraftfahrer/-in" },
      { rolle: M, funktion: "Helfer/-in" },
    ],
    fahrzeuge: [{ kurz: "GW-Taucher", lang: "Gerätewagen Taucher mit Rettungsboot" }],
    szenario: "Wasserunfall {ort} — Tauchen, Bergung",
    soll: [0, 2, 7, 9],
  },
  {
    einheit: "Erweiterte Wasserrettungsgruppe (EWRGr) — 0/2/10/12",
    teileinheit: "GW-Taucher-Trupp",
    quelle: "Anlage 2.21",
    traeger: dlrg,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Einsatztaucher/-in", anzahl: 4, quali: "Einsatztaucher" },
      { rolle: M, funktion: "Kraftfahrer/-in" },
    ],
    fahrzeuge: [{ kurz: "GW-Taucher", lang: "Gerätewagen Taucher mit Rettungsboot" }],
    szenario: "Wasserunfall {ort} — erweiterte Wasserrettung, Tauchen",
    soll: [0, 1, 5, 6],
  },
  {
    einheit: "Erweiterte Wasserrettungsgruppe (EWRGr) — 0/2/10/12",
    teileinheit: "MTW-Strömungsrettertrupp",
    quelle: "Anlage 2.21",
    traeger: dlrg,
    personal: [
      { rolle: U, funktion: "Bootsführer/-in", quali: "Bootsführerschein Binnen" },
      { rolle: M, funktion: "Strömungsretter/-in", anzahl: 4 },
      { rolle: M, funktion: "Kraftfahrer/-in" },
    ],
    fahrzeuge: [{ kurz: "MTW", lang: "Mannschaftstransportwagen mit Rettungsboot" }],
    szenario: "Wasserunfall {ort} — erweiterte Wasserrettung, Strömungsrettung",
    soll: [0, 1, 5, 6],
  },

  // ======================================================= Bergung/Instandsetzung
  {
    einheit: "Technische Hilfeleistungs-Einheit (THE) — 0/1/2/3",
    teileinheit: "Technische Hilfeleistungs-Einheit (THE)",
    quelle: "Anlage 2.22",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Truppführer/-in" },
      { rolle: M, funktion: "Truppmitglied" },
      { rolle: M, funktion: "Maschinist/-in" },
    ],
    fahrzeuge: [{ kurz: "RW", lang: "Rüstwagen" }],
    szenario: "Gebäudeeinsturz {ort} — technische Hilfeleistung, Bergung",
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

// Standortkennzahl: fiktive, fortlaufende Zahl je Landkreis (die reale Vergabe
// ist eine statistische Gemeindekennziffer, für Beispielbögen genügt eine
// eindeutige fortlaufende Nummer). Die Fahrzeugkennzahl dagegen ist amtlich
// (FZ_KENNZAHL, Anlage I des Funkrufnamenkatalogs).
const standortJeKreis = new Map<string, number>();
function standortkennzahl(kfz: string): number {
  const n = (standortJeKreis.get(kfz) ?? 0) + 1;
  standortJeKreis.set(kfz, n);
  return n;
}

function fahrzeugeBauen(specs: FzSpec[], traeger: Traeger, ort: HeOrt): Fahrzeug[] {
  const fahrzeuge: Fahrzeug[] = [];
  for (const s of specs) {
    for (let i = 0; i < (s.anzahl ?? 1); i++) {
      const fz: Fahrzeug = { typ: { freitext: s.kurz } };
      if (s.lang) fz.aenderungen = s.lang;
      fz.kennzeichen = kennzeichen(ort.kfz);
      if (!s.ohneFunk) {
        const kennzahl = FZ_KENNZAHL[s.kurz] ?? 19;
        fz.funkrufname = {
          kennwort: traeger.kennwort,
          eigenerStandort: false,
          ort: ort.kreis,
          teile: [standortkennzahl(ort.kfz), kennzahl],
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
  ort: HeOrt;
  einheit: string;
  teileinheit: string;
}

let ortIndex = 0;
function bogenBauen(spec: BogenSpec): BeispielBogen {
  const ort = HE_ORTE[ortIndex % HE_ORTE.length]!;
  ortIndex++;
  const personal = personalBauen(spec.personal);
  const fahrzeuge = fahrzeugeBauen(spec.fahrzeuge, spec.traeger, ort);

  const hierarchie: HierarchieEbene[] = [
    { bezeichnung: { freitext: "Aufgabenbereich" }, name: spec.einheit.replace(/\s*—.*$/, "") },
    ...spec.traeger.ebene(ort),
  ];

  const tag = datumAusIso("2026-04-01") + ganz(0, 4);
  const stand = tag * MINUTEN_JE_TAG + ganz(6, 21) * 60 + ganz(0, 59);
  const dauer = ganz(1, 4);
  const diesel = fahrzeuge.reduce((s, fz) => s + dieselFuer(fz.typ.freitext ?? ""), 0);

  const bogen: Erfassungsbogen = {
    schemaVersion: SCHEMA_VERSION,
    uebung: true,
    stand,
    einheit: {
      organisation: spec.traeger.org,
      organisationName: spec.traeger.organisationName(ort),
      einheitsTyp: { freitext: spec.teileinheit },
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
      `Sollstärke ${spec.soll[0]}/${spec.soll[1]}/${spec.soll[2]}/${spec.soll[3]} (Führer/Unterführer/`
      + `Mannschaft/Gesamt) nach ${KONZEPT}, ${spec.quelle} — Teileinheit von ${spec.einheit}. `
      + "Funkrufname: Standortkennzahl fiktiv fortlaufend, Fahrzeugkennzahl amtlich nach Anlage I "
      + "des Funkrufnamenkatalogs 2011.",
  };

  return { datei: `${slug(spec.teileinheit)}-${slug(ort.ort)}`, bogen, ort, einheit: spec.einheit, teileinheit: spec.teileinheit };
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

/** Selbstprüfung gegen die Sollstärke aus Anlage 2.1 je Teileinheit. */
function pruefen(beispiele: BeispielBogen[]): void {
  const fehler: string[] = [];
  beispiele.forEach((b, i) => {
    const spec = SPECS[i]!;
    const s = staerke(b.bogen);
    const [f, u, m, g] = spec.soll;
    if (s.fuehrer !== f || s.unterfuehrer !== u || s.mannschaft !== m || s.gesamt !== g) {
      fehler.push(
        `${b.datei}: Stärke ${s.fuehrer}/${s.unterfuehrer}/${s.mannschaft}/${s.gesamt} ≠ Anlage 2.1 ${f}/${u}/${m}/${g}`,
      );
    }
  });
  if (fehler.length > 0) {
    throw new Error(`Selbstprüfung fehlgeschlagen:\n  ${fehler.join("\n  ")}`);
  }
}

// ---------------------------------------------------------------- Hauptlauf

const beispiele: BeispielBogen[] = SPECS.map(bogenBauen);

pruefen(beispiele);

const ausgabe = join(wurzel, "examples", "katastrophenschutz", "hessen");
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
  return `| ${b.datei} | ${b.einheit} | ${b.teileinheit} | ${b.ort.ort} | ${b.ort.kreis} | ${s.fuehrer}/${s.unterfuehrer}/${s.mannschaft}/${s.gesamt} | ${b.bogen.fahrzeuge.length} | ${spec.quelle} |`;
});
writeFileSync(
  join(ausgabe, "README.md"),
  `# Beispiel-Erfassungsbögen — Katastrophenschutz Hessen

${beispiele.length} generierte Beispiel-Teileinheiten nach dem Konzept
**„Katastrophenschutz in Hessen"** (Hessisches Ministerium des Innern und für
Sport, Fassung 01.01.2024 — die operativ-taktischen Anlagen sind seit
01.01.2016 unverändert) und seiner **Anlage 2 „Übersicht Einheiten und
Einrichtungen"** (Stand 01.01.2016). Die Katastrophenschutz-Dienstvorschrift
400 (KatSDV 400, Stand 01.04.2012) regelt Führung und Aufgaben, verweist für
Stärke und Gliederung aber ausdrücklich auf dieses Konzept.

Alle Personen, Orte-Zuordnungen und Kennzeichen sind **fiktiv**.

## Warum ein Bogen je Teileinheit — wie Sachsen und Niedersachsen

Anlage 2 beschreibt für jeden Aufgabenbereich eine taktische Gliederung mit
**Personalstärke UND Fahrzeugtyp je kleinster Teileinheit** (Zugtrupp,
Löschgruppe, SEG usw.) — anders als die Brandenburger KatSV, die nur eine
Mindeststärke je GANZER Einheit nennt. Deshalb ist hier je kleinster
selbstständiger Teileinheit ein Bogen erzeugt, nicht ein Bogen je
Zug/Gruppe insgesamt.

## Hinweis zu abweichenden Personenzahlen in den Bildtabellen

Die Bildtabellen der Anlage 2 (2.3–2.24) summieren sich bei mehreren
Aufgabenbereichen — Löschzug, Gefahrstoff-ABC-Zug, Sanitätszug,
Betreuungszug, Wasserrettungszug, Führungsgruppe TEL — **nicht exakt** zur
offiziellen Sollstärke der Übersichtstabelle (Anlage 2.1), die auch gegen
die landesweite Personen-Gesamtkraft geprüft ist. **Bindend für diesen
Generator ist durchgehend Anlage 2.1**: Funktionsbezeichnungen und
Fahrzeugtypen stammen aus den Bildtabellen, die Mannschafts-Kopfzahlen
einzelner Teileinheiten sind dafür so angepasst, dass die Summe je
Aufgabenbereich exakt stimmt — dieselbe Vorgehensweise wie beim
MTF-Befund im Sachsen-README dieses Projekts.

Bei der **Betreuungsstelle 25 (BtSt)** weicht sogar die Sollstärke selbst
zwischen Haupttext (0/1/8/9) und Detailtabelle Anlage 2.19 (0/5/4/9) ab;
hier ist die Detailtabelle verwendet, da nur sie die Einzelfunktionen
auflistet.

Die **Medizinische Task Force** und der **KatS-Stab** sind absichtlich
**nicht** abgebildet: Die MTF ist ein bundeseinheitlich ausgestatteter
Großverband (111 Personen laut Anlage 2.1), der Stab eine reine
Personaleinheit ohne Fahrzeug — beide passen nicht zum Bogenformat „Einheit
mit Fahrzeugen".

## Funkrufnamen

Nach dem hessischen Funkrufnamenkatalog (Sonderschutzplan Bereich 2, Plan
Nr. 2, Version 1.02, 2011):

> \`<Kennwort> <Landkreis-Kürzel> <Standortkennzahl>-<Fahrzeugkennzahl>\`

Kennwort je Trägerorganisation (Florian, Rotkreuz, Akkon, Johannes, Sama),
Landkreis-Kürzel nach Anlage II (identisch mit den amtlichen
Kfz-Kennzeichen). Die **Fahrzeugkennzahl ist amtlich** nach Anlage I des
Katalogs (z. B. 11 = ELW 1, 45 = LF-KatS, 52 = RW, 96 = GW-San). Die
**Standortkennzahl ist dagegen eine fiktive, fortlaufende Zahl je
Landkreis** — die reale Vergabe folgt einer statistischen
Gemeindekennziffer, die hier nicht rekonstruiert werden konnte. Derselbe
Hinweis steht im Feld „Sonstiges" jedes einzelnen Bogens.

## Träger

Der Feuerwehr sind laut Konzept alle Fachbereiche Brandschutz, Technische
Hilfe, Gefahrstoff-ABC und Führung/IuK zugeordnet; DRK trägt den
Sanitätszug und das Kreisauskunftsbüro, Malteser den Betreuungszug/die
Betreuungsstelle, DLRG die Wasserrettung — eine beispielhafte, plausible
Verteilung, da das Konzept keine feste bundesweite Träger-Zuordnung je
Landkreis vorschreibt.

Neu erzeugen mit: \`npm run beispiele:kats-he\` (deterministisch, fester
Zufalls-Seed).

| Datei | Aufgabenbereich | Teileinheit | Ort | Landkreis/Stadt | Stärke | Fahrzeuge | Quelle |
|---|---|---|---|---|---|---|---|
${zeilen.join("\n")}
`,
);

console.log(`${beispiele.length} Bögen nach ${ausgabe} geschrieben.`);
