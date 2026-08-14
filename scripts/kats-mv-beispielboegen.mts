/**
 * Erzeugt Beispiel-Erfassungsbögen der Katastrophenschutzeinheiten (KSE) des
 * Landes Mecklenburg-Vorpommern als JSON nach
 * examples/katastrophenschutz/mecklenburg-vorpommern/. Abgelegt ist nur das
 * Bogen-JSON; die PDF entsteht erst beim Anklicken in der App aus dem
 * aktuellen Layout.
 *
 * Aufruf (Node ≥ 22): npm run beispiele:kats-mv
 *
 * Grundlage sind die „Festlegungen zu den Grundstrukturen im Katastrophenschutz
 * Mecklenburg-Vorpommern" — Erlass des Landesamtes für zentrale Aufgaben und
 * Technik der Polizei, Brand- und Katastrophenschutz Mecklenburg-Vorpommern
 * (LPBK M-V, Az. 300 - 233.0) vom 15. März 2020, ergangen nach § 5 Absatz 4
 * LKatSG M-V. Der Erlass beschreibt für jede Katastrophenschutzeinheit (KSE)
 * eine taktische Gliederung mit Personalstärke (Führer/Unterführer/Mannschaft/
 * Gesamt) UND Fahrzeugtyp je kleinster Teileinheit — anders als die
 * Brandenburger KatSV (die nur eine Mindeststärke und eine Kfz-ANZAHL je
 * Einheit nennt, siehe kats-brandenburg-beispielboegen.mts), aber genau wie
 * die KatS-StAN Niedersachsen. Deshalb folgt dieser Generator dem
 * NDS-Zerlegungsmuster: ein Bogen je kleinster selbstständiger Teileinheit
 * (Trupp/Gruppe/Staffel), nicht ein Bogen je Zug/Gruppe insgesamt.
 *
 * Wo ein Zug mehrere BAUGLEICHE Teileinheiten enthält (z. B. LGr1/LGr2 des
 * Erweiterten Löschzugs, SanGr1/SanGr2 des Sanitätszugs, die beiden
 * Betreuungstrupps der zwei Betreuungsgruppen), wird — wie im
 * Niedersachsen-Generator — nur EIN repräsentativer Bogen erzeugt statt
 * mehrerer inhaltsgleicher. Der Zugtrupp (ZTr) ist dagegen je Zug ein eigener
 * Bogen, weil er dort jeweils die Führung dieses konkreten Zuges stellt.
 *
 * Die Medical Task Force (Abschnitt 4.11) ist NICHT abgebildet: der Erlass
 * nennt für sie keine Personalstärken je Teileinheit (nur "Verband der
 * Größe II"), das Ausstattungskonzept liegt beim Bund. Eine erfundene Stärke
 * wäre hier keine belastbare Beispielangabe.
 *
 * WICHTIGER HINWEIS ZU FUNKRUFNAMEN: Für Mecklenburg-Vorpommern konnte trotz
 * gezielter Suche KEIN öffentlich zugänglicher landeseigener OPTA-/
 * Funkrufnamen-Kennzahlenkatalog (Fahrzeug-/Orts-Kennziffern) verifiziert
 * werden. Verwendet werden nur die bundesweit einheitlichen Kennwörter je
 * Trägerorganisation (Florian, Rotkreuz, Akkon, Johannes, Sama, Pelikan —
 * Vokabular FUNKRUF_KENNWOERTER, bereits im Projekt). Die numerische
 * Kennzahl ist eine rein fortlaufende, ausdrücklich FIKTIVE Ordnungsnummer
 * je Landkreis — keine amtliche Fahrzeug- oder Ortskennung. Das steht im
 * README und im Feld „Sonstiges" jedes Bogens.
 *
 * Fiktiv sind zusätzlich alle Personen, Orte-Zuordnungen und Kennzeichen.
 *
 * Am Ende läuft eine Selbstprüfung (Stärke je Teileinheit gegen den Erlass,
 * QR-Roundtrip je Bogen); die README im Zielordner bekommt eine
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
const rnd = prng(20200315); // Datum des Erlasses
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
  "Andreas", "Bernd", "Carsten", "Christian", "Daniel", "Detlef", "Dirk", "Enrico",
  "Falk", "Frank", "Gerd", "Hagen", "Hannes", "Hendrik", "Holger", "Jan",
  "Jens", "Jörg", "Karsten", "Kay", "Lars", "Lukas", "Marco", "Mario",
  "Markus", "Martin", "Matthias", "Michael", "Nico", "Norbert", "Olaf", "Patrick",
  "Paul", "Peter", "Ralf", "René", "Robert", "Ronny", "Sebastian", "Steffen",
  "Sven", "Thomas", "Tino", "Tobias", "Torsten", "Uwe", "Volker", "Wolfgang",
] as const;
const VORNAMEN_W = [
  "Anja", "Anke", "Antje", "Beate", "Bettina", "Carola", "Christin", "Claudia",
  "Cornelia", "Doreen", "Franziska", "Grit", "Heike", "Ines", "Jana", "Josephine",
  "Katrin", "Kerstin", "Kristin", "Lea", "Lisa", "Manuela", "Mandy", "Maria",
  "Nadine", "Nicole", "Peggy", "Ramona", "Sabine", "Sandra", "Silke", "Simone",
  "Steffi", "Susann", "Ulrike", "Yvonne",
] as const;
const NACHNAMEN = [
  "Ahrens", "Bartels", "Bauer", "Becker", "Behrens", "Below", "Bohl", "Brandt",
  "Buck", "Dahl", "Dallmann", "Ebert", "Fischer", "Franck", "Garbe", "Gerdes",
  "Grabow", "Haase", "Hagen", "Harder", "Hartmann", "Hinz", "Höpner", "Jahnke",
  "Jarchow", "Kähler", "Kasten", "Klatt", "Köhn", "Krause", "Kruse", "Kühl",
  "Lange", "Lehmann", "Lindow", "Löffler", "Lorenz", "Malchow", "Marquardt", "Meincke",
  "Meyer", "Müller", "Neumann", "Ohlsen", "Papenfuß", "Pieper", "Pohl", "Priebe",
  "Radloff", "Retzlaff", "Riedel", "Rudolph", "Schmidt", "Schröder", "Schulz", "Schwarz",
  "Sievers", "Sommer", "Stein", "Struck", "Thiel", "Voß", "Wegner", "Wendt",
  "Werner", "Wilke", "Wolf", "Zimmermann",
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
] as const;

// ------------------------------------------------ Mecklenburg-Vorpommern: Orte

interface MvOrt {
  ort: string;
  /** Untere Katastrophenschutzbehörde (Landkreis bzw. kreisfreie Stadt). */
  kreis: string;
  /** Kürzel aus Tabelle 1 des Erlasses (Verteilung der KSE): HRO/LRO/LUP/MSE/NWM/SN/VG/VR. */
  kfz: string;
}

/** Standorte quer durch die acht unteren Katastrophenschutzbehörden M-V. */
const MV_ORTE: MvOrt[] = [
  { ort: "Rostock", kreis: "Hanse- und Universitätsstadt Rostock", kfz: "HRO" },
  { ort: "Bad Doberan", kreis: "Landkreis Rostock", kfz: "LRO" },
  { ort: "Güstrow", kreis: "Landkreis Rostock", kfz: "LRO" },
  { ort: "Ludwigslust", kreis: "Landkreis Ludwigslust-Parchim", kfz: "LUP" },
  { ort: "Parchim", kreis: "Landkreis Ludwigslust-Parchim", kfz: "LUP" },
  { ort: "Hagenow", kreis: "Landkreis Ludwigslust-Parchim", kfz: "LUP" },
  { ort: "Neubrandenburg", kreis: "Landkreis Mecklenburgische Seenplatte", kfz: "MSE" },
  { ort: "Waren (Müritz)", kreis: "Landkreis Mecklenburgische Seenplatte", kfz: "MSE" },
  { ort: "Neustrelitz", kreis: "Landkreis Mecklenburgische Seenplatte", kfz: "MSE" },
  { ort: "Grevesmühlen", kreis: "Landkreis Nordwestmecklenburg", kfz: "NWM" },
  { ort: "Wismar", kreis: "Landkreis Nordwestmecklenburg", kfz: "NWM" },
  { ort: "Schwerin", kreis: "Landeshauptstadt Schwerin", kfz: "SN" },
  { ort: "Greifswald", kreis: "Landkreis Vorpommern-Greifswald", kfz: "VG" },
  { ort: "Anklam", kreis: "Landkreis Vorpommern-Greifswald", kfz: "VG" },
  { ort: "Ueckermünde", kreis: "Landkreis Vorpommern-Greifswald", kfz: "VG" },
  { ort: "Stralsund", kreis: "Landkreis Vorpommern-Rügen", kfz: "VR" },
  { ort: "Ribnitz-Damgarten", kreis: "Landkreis Vorpommern-Rügen", kfz: "VR" },
  { ort: "Bergen auf Rügen", kreis: "Landkreis Vorpommern-Rügen", kfz: "VR" },
];

// ------------------------------------------------------------------ Träger

/** FUNKRUF_KENNWOERTER-Codes (src/vokabulare/thw.ts) — bundesweit einheitlich. */
const KW = { FLORIAN: 2, ROTKREUZ: 3, AKKON: 4, JOHANNES: 5, SAMA: 6, PELIKAN: 7 } as const;

interface Traeger {
  org: OrganisationsTyp;
  kennwort: VokabularWert;
  organisationName: (o: MvOrt) => string;
  ebene: (o: MvOrt) => HierarchieEbene[];
}

const kreisKurz = (o: MvOrt): string =>
  o.kreis.replace(/^(Landkreis|Hanse- und Universitätsstadt|Landeshauptstadt)\s+/, "");

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
const juh = hiorg(OrganisationsTyp.JUH, { code: KW.AKKON }, "JUH", "Johanniter-Unfall-Hilfe");
const mhd = hiorg(OrganisationsTyp.MHD, { code: KW.JOHANNES }, "MHD", "Malteser Hilfsdienst");
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
  if (/^(WLF|LF|SW|TLF)/.test(kurz)) return 90;
  if (/^(GW|ELW|MZF|CBRN)/.test(kurz)) return 70;
  if (/^(ZTrKW|BtGrKW|BtKW|MTW|KTW)/.test(kurz)) return 45;
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
  lang?: string; // Klartext für "Änderungen bzw. Sondergerät"
  anzahl?: number;
  ohneFunk?: boolean; // Anhänger/Geräte auf Trägerfahrzeug → kein eigener Funkrufname
  ohneKennzeichen?: string; // statt Kfz-Kennzeichen ein Freitext
}

interface BogenSpec {
  kse: string; // übergeordnete KSE (z. B. "Erweiterter Löschzug (ELZ)")
  teileinheit: string; // Bezeichnung der Teileinheit inkl. Kürzel
  quelle: string; // Abschnitt des Erlasses
  traeger: Traeger;
  personal: PlatzSpec[];
  fahrzeuge: FzSpec[];
  szenario: string; // {ort} wird ersetzt
  /** Sollstärke laut Erlass als "Führer/Unterführer/Mannschaft/Gesamt" — wird geprüft. */
  soll: [number, number, number, number];
  gemisch?: boolean;
}

const F = R.FUEHRER;
const U = R.UNTERFUEHRER;
const M = R.MANNSCHAFT;

const ERLASS = "LPBK M-V, Festlegungen zu den Grundstrukturen im KatS M-V v. 15.03.2020";

const SPECS: BogenSpec[] = [
  // ================================================================ Führung
  {
    kse: "Führungsunterstützungsgruppe (FüUstgGr) — 4/1/2/7",
    teileinheit: "Führungstrupp (FüTr)",
    quelle: "Erlass Nr. 4.2.1, Abb. 1",
    traeger: feuerwehr,
    personal: [
      { rolle: F, funktion: "Führungskraft (Leitung FüTr)" },
      { rolle: F, funktion: "Führungskraft S2 (Lage)" },
      { rolle: F, funktion: "Führungskraft S3 (Einsatz)" },
      { rolle: F, funktion: "Führungskraft S1/4/6 (Sachgebiete)" },
    ],
    fahrzeuge: [{ kurz: "ELW 1", lang: "Einsatzleitwagen 1" }],
    szenario: "Führung Verband {ort} — Aufbau der (Unter-)Einsatzabschnittsleitung",
    soll: [4, 0, 0, 4],
  },
  {
    kse: "Führungsunterstützungsgruppe (FüUstgGr) — 4/1/2/7",
    teileinheit: "Führungsunterstützungstrupp (FüUstgTr)",
    quelle: "Erlass Nr. 4.2.1, Abb. 1",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Truppführer/-in (Führungsunterstützung)" },
      { rolle: M, funktion: "Fernmelder/-in", anzahl: 2, quali: "Sprechfunker" },
    ],
    fahrzeuge: [{ kurz: "ELW 2", lang: "Einsatzleitwagen 2" }],
    szenario: "Führung Verband {ort} — Fernmeldeverbindungen für die Einsatzleitung",
    soll: [0, 1, 2, 3],
  },
  {
    kse: "Erkundungstrupp Luft (ErkTr-L) — 0/1/2/3",
    teileinheit: "Erkundungstrupp Luft (ErkTr-L)",
    quelle: "Erlass Nr. 4.2.2, Abb. 2",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Truppführer/-in" },
      { rolle: M, funktion: "Steuerer/-in Unbemanntes Luftfahrtsystem (ULS)", quali: "UAS-Steuerberechtigung" },
      { rolle: M, funktion: "Beobachter/-in / Kraftfahrer/-in" },
    ],
    fahrzeuge: [{ kurz: "MZF", lang: "Mehrzweckfahrzeug mit Unbemanntem Luftfahrtsystem (ULS)" }],
    szenario: "Vermisstensuche {ort} — Luftbilderkundung mit ULS",
    soll: [0, 1, 2, 3],
  },

  // ============================================================ Brandschutz
  {
    kse: "Erweiterter Löschzug (ELZ) — 1/4/20/25",
    teileinheit: "Zugtrupp (ZTr)",
    quelle: "Erlass Nr. 4.3, Abb. 3",
    traeger: feuerwehr,
    personal: [
      { rolle: F, funktion: "Zugführer/-in" },
      { rolle: U, funktion: "stellv. Zugführer/-in als Zugtruppführer/-in" },
      { rolle: M, funktion: "Sprechfunker/-in / Melder/-in", anzahl: 2 },
    ],
    fahrzeuge: [{ kurz: "ZTrKW", lang: "Zugtruppkraftwagen" }],
    szenario: "Großbrand {ort} — Führung Erweiterter Löschzug",
    soll: [1, 1, 2, 4],
  },
  {
    kse: "Erweiterter Löschzug (ELZ) — 1/4/20/25",
    teileinheit: "Löschgruppe (LGr1/LGr2)",
    quelle: "Erlass Nr. 4.3, Abb. 3",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Truppführer/-in", anzahl: 3, quali: "Atemschutzgeräteträger" },
      { rolle: M, funktion: "Truppmitglied", anzahl: 4 },
      { rolle: M, funktion: "Maschinist/-in" },
    ],
    fahrzeuge: [{ kurz: "LF-KatS", lang: "Löschgruppenfahrzeug Katastrophenschutz (bis auf Weiteres LF 16-TS)" }],
    szenario: "Großbrand {ort} — Brandbekämpfung, Menschenrettung",
    soll: [0, 1, 8, 9],
  },
  {
    kse: "Erweiterter Löschzug (ELZ) — 1/4/20/25",
    teileinheit: "Wasserfördertrupp (WfTr)",
    quelle: "Erlass Nr. 4.3, Abb. 3",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Truppführer/-in" },
      { rolle: M, funktion: "Maschinist/-in" },
      { rolle: M, funktion: "Truppmitglied" },
    ],
    fahrzeuge: [{ kurz: "SW-KatS", lang: "Schlauchwagen Katastrophenschutz (bis auf Weiteres SW 2000-Tr)" }],
    szenario: "Großbrand {ort} — Wasserförderung über lange Wegstrecke",
    soll: [0, 1, 2, 3],
  },

  // =========================================================== Sanitätsdienst
  {
    kse: "Sanitätszug (SanZ) — 3/4/19/26",
    teileinheit: "Zugtrupp (ZTr)",
    quelle: "Erlass Nr. 4.4, Abb. 4",
    traeger: drk,
    personal: [
      { rolle: F, funktion: "Zugführer/-in" },
      { rolle: U, funktion: "stellv. Zugführer/-in als Zugtruppführer/-in" },
      { rolle: M, funktion: "Sprechfunker/-in / Melder/-in", anzahl: 2 },
    ],
    fahrzeuge: [{ kurz: "ZTrKW", lang: "Zugtruppkraftwagen" }],
    szenario: "MANV {ort} — Führung Sanitätszug",
    soll: [1, 1, 2, 4],
  },
  {
    kse: "Sanitätszug (SanZ) — 3/4/19/26",
    teileinheit: "Sanitätsgruppe (SanGr1/SanGr2)",
    quelle: "Erlass Nr. 4.4, Abb. 4",
    traeger: drk,
    personal: [
      { rolle: F, funktion: "Ärztin/Arzt", quali: "Notarzt" },
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Rettungssanitäter/-in", anzahl: 2, quali: "Rettungssanitäter" },
      { rolle: M, funktion: "Rettungssanitäter/-in bzw. Sanitätshelfer/-in", anzahl: 2 },
    ],
    fahrzeuge: [{ kurz: "GW-San", lang: "Gerätewagen Sanität" }],
    szenario: "MANV {ort} — Sichtung, Behandlung, Herstellung der Transportfähigkeit",
    soll: [1, 1, 4, 6],
  },
  {
    kse: "Sanitätszug (SanZ) — 3/4/19/26",
    teileinheit: "Patiententransportgruppe (PtGr, 5 Patiententransporttrupps)",
    quelle: "Erlass Nr. 4.4, Abb. 4",
    traeger: mhd,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in (zugleich Kraftfahrer/-in 1. PtTr)" },
      { rolle: M, funktion: "Rettungssanitäter/-in (Kraftfahrer/-in KTW)", anzahl: 4, quali: "Rettungssanitäter" },
      { rolle: M, funktion: "Sanitätshelfer/-in (Beifahrer/-in KTW)", anzahl: 5 },
    ],
    fahrzeuge: [{ kurz: "KTW", lang: "Krankentransportwagen (5 Patiententransporttrupps)", anzahl: 5 }],
    szenario: "MANV {ort} — Transport von Verletzten und Erkrankten unter Aufrechterhaltung der Transportfähigkeit",
    soll: [0, 1, 9, 10],
  },

  // ====================================================== Logistik / Technik
  {
    kse: "Logistikgruppe (LogGr) — 0/2/4/6",
    teileinheit: "Logistiktrupp 1 (LogTr1)",
    quelle: "Erlass Nr. 4.5, Abb. 5",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Truppführer/-in" },
      { rolle: M, funktion: "Elektrofachkraft", quali: "Elektrofachkraft (Beruf)" },
      { rolle: M, funktion: "Technikhelfer/-in" },
    ],
    fahrzeuge: [
      { kurz: "GW-KatS", lang: "Gerätewagen Katastrophenschutz" },
      { kurz: "NEA", lang: "Netzersatzanlage", ohneFunk: true, ohneKennzeichen: "Anh NEA" },
    ],
    szenario: "Stromausfall {ort} — Ersatzstromversorgung für ausgewählte Verbraucher",
    soll: [0, 1, 2, 3],
  },
  {
    kse: "Logistikgruppe (LogGr) — 0/2/4/6",
    teileinheit: "Logistiktrupp 2 (LogTr2)",
    quelle: "Erlass Nr. 4.5, Abb. 5",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Truppführer/-in" },
      { rolle: M, funktion: "Technikhelfer/-in", anzahl: 2 },
    ],
    fahrzeuge: [
      { kurz: "WLF", lang: "Wechselladerfahrzeug" },
      { kurz: "AB-Logistik", lang: "Abrollbehälter Logistik", ohneFunk: true, ohneKennzeichen: "auf WLF" },
      { kurz: "AB-Mulde", lang: "Abrollbehälter Mulde", ohneFunk: true, ohneKennzeichen: "auf WLF" },
      { kurz: "NEA", lang: "Netzersatzanlage", ohneFunk: true, ohneKennzeichen: "Anh NEA" },
    ],
    szenario: "Hochwasser {ort} — Materialtransport und Ersatzstromversorgung",
    soll: [0, 1, 2, 3],
  },

  // ================================================== Psychosoziale Notfallversorgung
  {
    kse: "PSNV-Trupp Betroffene (PSNV-B-Tr) — 0/1/3/4",
    teileinheit: "PSNV-Trupp Betroffene (PSNV-B-Tr)",
    quelle: "Erlass Nr. 4.6.1, Abb. 6",
    traeger: juh,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "PSNV-Kraft (Betroffene)", anzahl: 3, quali: "PSNV-Ausbildung" },
    ],
    fahrzeuge: [{ kurz: "MTW-PSNV", lang: "Mannschaftstransportwagen Psychosoziale Notfallversorgung" }],
    szenario: "Schadenslage {ort} — psychosoziale Notfallversorgung Betroffener",
    soll: [0, 1, 3, 4],
  },
  {
    kse: "PSNV-Trupp Einsatzkräfte (PSNV-E-Tr) — 0/1/3/4",
    teileinheit: "PSNV-Trupp Einsatzkräfte (PSNV-E-Tr)",
    quelle: "Erlass Nr. 4.6.2, Abb. 7",
    traeger: juh,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "PSNV-Kraft (Einsatzkräfte)", anzahl: 3, quali: "PSNV-Ausbildung" },
    ],
    // Der PSNV-E-Tr verfügt laut Erlass über KEIN eigenes Fahrzeug — im
    // Einsatzfall wird der MTW-PSNV des PSNV-B-Tr mitgenutzt.
    fahrzeuge: [],
    szenario: "Schadenslage {ort} — psychosoziale Notfallversorgung von Einsatzkräften",
    soll: [0, 1, 3, 4],
  },

  // ==================================================================== Betreuung
  {
    kse: "Betreuungszug (BtZ) — 1/7/23/31",
    teileinheit: "Zugtrupp (ZTr)",
    quelle: "Erlass Nr. 4.7, Abb. 8",
    traeger: drk,
    personal: [
      { rolle: F, funktion: "Zugführer/-in" },
      { rolle: U, funktion: "stellv. Zugführer/-in als Zugtruppführer/-in" },
      { rolle: M, funktion: "Sprechfunker/-in / Melder/-in", anzahl: 2 },
    ],
    fahrzeuge: [{ kurz: "ZTrKW", lang: "Zugtruppkraftwagen" }],
    szenario: "Evakuierung {ort} — Führung Betreuungszug",
    soll: [1, 1, 2, 4],
  },
  {
    kse: "Betreuungszug (BtZ) — 1/7/23/31",
    teileinheit: "Betreuungstrupp (BtTr, je Betreuungsgruppe)",
    quelle: "Erlass Nr. 4.7, Abb. 8",
    traeger: asb,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Betreuungshelfer/-in", anzahl: 5 },
    ],
    fahrzeuge: [{ kurz: "BtGrKW", lang: "Betreuungsgruppenkraftwagen" }],
    szenario: "Evakuierung {ort} — Einrichtung und Betrieb einer Betreuungsstelle",
    soll: [0, 1, 5, 6],
  },
  {
    kse: "Betreuungszug (BtZ) — 1/7/23/31",
    teileinheit: "Betreuungstrupp 100 (BtTr100, in BtGr1)",
    quelle: "Erlass Nr. 4.7, Abb. 8",
    traeger: asb,
    personal: [
      { rolle: U, funktion: "Truppführer/-in" },
      { rolle: M, funktion: "Betreuungshelfer/-in", anzahl: 3 },
    ],
    fahrzeuge: [{ kurz: "GW-B", lang: "Gerätewagen Betreuung mit zwei Betreuungssätzen für je 50 Betroffene (Bt50)" }],
    szenario: "Evakuierung {ort} — Betreuung von bis zu 100 Betroffenen",
    soll: [0, 1, 3, 4],
  },
  {
    kse: "Betreuungszug (BtZ) — 1/7/23/31",
    teileinheit: "Betreuungstrupp 30 (BtTr30, in BtGr2)",
    quelle: "Erlass Nr. 4.7, Abb. 8",
    traeger: juh,
    personal: [
      { rolle: U, funktion: "Truppführer/-in" },
      { rolle: M, funktion: "Betreuungshelfer/-in", anzahl: 3 },
    ],
    fahrzeuge: [
      { kurz: "BtKW", lang: "Betreuungskraftwagen" },
      { kurz: "TA-Bt", lang: "Tandemanhänger Betreuung — Betreuungsausstattung für 30 Einsatzkräfte/Betroffene", ohneFunk: true, ohneKennzeichen: "TA-Bt" },
    ],
    szenario: "Evakuierung {ort} — Betreuung von bis zu 30 Betroffenen",
    soll: [0, 1, 3, 4],
  },
  {
    kse: "Betreuungszug (BtZ) — 1/7/23/31",
    teileinheit: "Verpflegungstrupp (VTr)",
    quelle: "Erlass Nr. 4.7, Abb. 8",
    traeger: mhd,
    personal: [
      { rolle: U, funktion: "Truppführer/-in" },
      { rolle: M, funktion: "Feldkoch/-köchin", quali: "Koch (Beruf)" },
      { rolle: M, funktion: "Verpflegungshelfer/-in" },
    ],
    fahrzeuge: [
      { kurz: "GW-V", lang: "Gerätewagen Verpflegung" },
      { kurz: "FKH", lang: "Feldkochherd auf Anhänger", ohneFunk: true, ohneKennzeichen: "Anh FKH" },
    ],
    szenario: "Flächenlage {ort} — Zubereiten von Verpflegung für rund 250 Personen",
    soll: [0, 1, 2, 3],
  },
  {
    kse: "Betreuungszug (BtZ) — 1/7/23/31",
    teileinheit: "Verpflegungstransporttrupp (VtTr)",
    quelle: "Erlass Nr. 4.7, Abb. 8",
    traeger: mhd,
    personal: [
      { rolle: U, funktion: "Truppführer/-in" },
      { rolle: M, funktion: "Verpflegungshelfer/-in", anzahl: 3 },
    ],
    fahrzeuge: [
      { kurz: "MTW-V", lang: "Mannschaftstransportwagen Verpflegung" },
      { kurz: "TA-V", lang: "Tandemanhänger Verpflegung", ohneFunk: true, ohneKennzeichen: "TA-V" },
    ],
    szenario: "Flächenlage {ort} — Verpflegungsausgabe an Betroffene und Einsatzkräfte",
    soll: [0, 1, 3, 4],
  },

  // ===================================================================== CBRN
  {
    kse: "CBRN-Zug (CBRN-Z) — 1/5/18/24",
    teileinheit: "Zugtrupp (ZTr)",
    quelle: "Erlass Nr. 4.8, Abb. 9",
    traeger: feuerwehr,
    personal: [
      { rolle: F, funktion: "Zugführer/-in" },
      { rolle: U, funktion: "stellv. Zugführer/-in als Zugtruppführer/-in" },
      { rolle: M, funktion: "Sprechfunker/-in / Melder/-in", anzahl: 2 },
    ],
    fahrzeuge: [{ kurz: "ZTrKW", lang: "Zugtruppkraftwagen" }],
    szenario: "Gefahrstofffreisetzung {ort} — Führung CBRN-Zug",
    soll: [1, 1, 2, 4],
  },
  {
    kse: "CBRN-Zug (CBRN-Z) — 1/5/18/24",
    teileinheit: "CBRN-Unterstützungsgruppe (CBRN-UstgGr)",
    quelle: "Erlass Nr. 4.8, Abb. 9",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Kraftfahrer/-in" },
      { rolle: M, funktion: "CSA-Träger/-in", anzahl: 6, quali: "Chemikalienschutzanzug-Träger" },
    ],
    fahrzeuge: [{ kurz: "MZF-CSA", lang: "Mehrzweckfahrzeug Chemikalienschutzanzug" }],
    szenario: "Gefahrstofffreisetzung {ort} — Einsatz unter Chemikalienschutzanzug",
    soll: [0, 1, 7, 8],
  },
  {
    kse: "CBRN-Zug (CBRN-Z) — 1/5/18/24",
    teileinheit: "Dekontaminationsstaffel (DekonSt)",
    quelle: "Erlass Nr. 4.8, Abb. 9",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Staffelführer/-in" },
      { rolle: M, funktion: "Dekon-Helfer/-in", anzahl: 5 },
    ],
    fahrzeuge: [
      { kurz: "GW-Dekon-P", lang: "Gerätewagen Dekontamination Personal" },
      { kurz: "TA-DKS", lang: "Tandemanhänger Dekontaminationsschleuse", ohneFunk: true, ohneKennzeichen: "TA-DKS" },
    ],
    szenario: "CBRN-Lage {ort} — Dekontamination von Einsatzkräften und Betroffenen",
    soll: [0, 1, 5, 6],
  },
  {
    kse: "CBRN-Zug (CBRN-Z) — 1/5/18/24",
    teileinheit: "Gefahrguttrupp (GfGTr)",
    quelle: "Erlass Nr. 4.8, Abb. 9",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Truppführer/-in" },
      { rolle: M, funktion: "Truppmitglied" },
    ],
    fahrzeuge: [{ kurz: "GW-G", lang: "Gerätewagen Gefahrgut (bis auf Weiteres GW-G1/GW-G2)" }],
    szenario: "Gefahrgutunglück {ort} — Unterstützung der Gefahrenbekämpfung",
    soll: [0, 1, 1, 2],
  },
  {
    kse: "CBRN-Zug (CBRN-Z) — 1/5/18/24",
    teileinheit: "Messtrupp (MTr)",
    quelle: "Erlass Nr. 4.8, Abb. 9",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Truppführer/-in" },
      { rolle: M, funktion: "Messhelfer/-in", anzahl: 3, quali: "CBRN-Messtechnik" },
    ],
    fahrzeuge: [{ kurz: "CBRN-ErkW", lang: "CBRN-Erkundungswagen" }],
    szenario: "CBRN-Lage {ort} — Erkunden und Messen von Kontaminationen",
    soll: [0, 1, 3, 4],
  },

  // ============================================================ Wassergefahren
  {
    kse: "Wassergefahrenzug (WGfZ) — 1/4/14/19",
    teileinheit: "Zugtrupp (ZTr)",
    quelle: "Erlass Nr. 4.9, Abb. 10",
    traeger: dlrg,
    personal: [
      { rolle: F, funktion: "Zugführer/-in" },
      { rolle: U, funktion: "stellv. Zugführer/-in als Zugtruppführer/-in" },
      { rolle: M, funktion: "Sprechfunker/-in / Melder/-in", anzahl: 2 },
    ],
    fahrzeuge: [{ kurz: "ZTrKW", lang: "Zugtruppkraftwagen" }],
    szenario: "Hochwasser {ort} — Führung Wassergefahrenzug",
    soll: [1, 1, 2, 4],
  },
  {
    kse: "Wassergefahrenzug (WGfZ) — 1/4/14/19",
    teileinheit: "Wassergefahrengruppe (WGfGr1/WGfGr2)",
    quelle: "Erlass Nr. 4.9, Abb. 10",
    traeger: dlrg,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Bootsführer/-in", quali: "Bootsführerschein Binnen" },
      { rolle: M, funktion: "Wasserrettungshelfer/-in", anzahl: 3, quali: "Rettungsschwimmer" },
    ],
    fahrzeuge: [
      { kurz: "GW-WGf", lang: "Gerätewagen Wassergefahren" },
      { kurz: "MZB", lang: "Mehrzweckboot auf Anhänger", ohneFunk: true, ohneKennzeichen: "Anh-MZB" },
    ],
    szenario: "Hochwasser {ort} — Personenrettung und Bootstransport",
    soll: [0, 1, 4, 5],
  },
  {
    kse: "Wassergefahrenzug (WGfZ) — 1/4/14/19",
    teileinheit: "Wassergefahrengruppe schwer (WGfGr3(s))",
    quelle: "Erlass Nr. 4.9, Abb. 10",
    traeger: dlrg,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Bootsführer/-in", quali: "Bootsführerschein Binnen" },
      { rolle: M, funktion: "Strömungsretter/-in", anzahl: 3, quali: "Strömungsretter" },
    ],
    fahrzeuge: [
      { kurz: "GW-WGf(s)", lang: "Gerätewagen Wassergefahren (schwer)" },
      { kurz: "MZB(s)", lang: "Mehrzweckboot (schwer) auf Anhänger", ohneFunk: true, ohneKennzeichen: "Anh-MZB(s)" },
    ],
    szenario: "Starkregen {ort} — Rettung aus Fließgewässer und Strömung",
    soll: [0, 1, 4, 5],
  },

  // ======================================================= Personenauskunftswesen
  {
    kse: "Registrierungseinheit (RegE) — 0/1/5/6",
    teileinheit: "Registrierungseinheit (RegE)",
    quelle: "Erlass Nr. 4.10, Abb. 11",
    traeger: drk,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Registrierungshelfer/-in", anzahl: 5 },
    ],
    fahrzeuge: [{ kurz: "MTW-RegE", lang: "Mannschaftstransportwagen Registrierungseinheit" }],
    szenario: "Evakuierung {ort} — Registrierung Betroffener in der Notunterkunft",
    soll: [0, 1, 5, 6],
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

// Fortlaufende, rein FIKTIVE Ordnungsnummer je Landkreis für den Funkrufnamen —
// da kein amtlicher M-V-Kennzahlenkatalog verifiziert werden konnte (siehe
// Kopfkommentar). Keine amtliche Fahrzeug- oder Ortskennung.
const lfdJeKreis = new Map<string, number>();
function naechsteLfd(kfz: string): number {
  const n = (lfdJeKreis.get(kfz) ?? 0) + 1;
  lfdJeKreis.set(kfz, n);
  return n;
}

function fahrzeugeBauen(specs: FzSpec[], traeger: Traeger, ort: MvOrt): Fahrzeug[] {
  const fahrzeuge: Fahrzeug[] = [];
  for (const s of specs) {
    for (let i = 0; i < (s.anzahl ?? 1); i++) {
      const fz: Fahrzeug = { typ: { freitext: s.kurz } };
      if (s.lang) fz.aenderungen = s.lang;
      fz.kennzeichen = s.ohneKennzeichen ?? kennzeichen(ort.kfz);
      if (!s.ohneFunk) {
        fz.funkrufname = {
          kennwort: traeger.kennwort,
          eigenerStandort: false,
          ort: ort.ort,
          teile: [naechsteLfd(ort.kfz)], // fiktive, rein fortlaufende Ordnungsnummer
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
  ort: MvOrt;
  kse: string;
  teileinheit: string;
}

let ortIndex = 0;
function bogenBauen(spec: BogenSpec): BeispielBogen {
  const ort = MV_ORTE[ortIndex % MV_ORTE.length]!;
  ortIndex++;
  const personal = personalBauen(spec.personal);
  const fahrzeuge = fahrzeugeBauen(spec.fahrzeuge, spec.traeger, ort);

  const hierarchie: HierarchieEbene[] = [
    { bezeichnung: { freitext: "KSE" }, name: spec.kse.replace(/\s*—.*$/, "") },
    ...spec.traeger.ebene(ort),
  ];

  const tag = datumAusIso("2026-04-20") + ganz(0, 4);
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
      gemischLiter: spec.gemisch ? ganz(1, 2) * 5 : 0,
      unterbringung: dauer >= 2 && wuerfel(0.6),
      ruhezeitErforderlich: wuerfel(0.3),
    },
    sonstiges:
      `Sollstärke ${spec.soll[0]}/${spec.soll[1]}/${spec.soll[2]}/${spec.soll[3]} (Führer/Unterführer/`
      + `Mannschaft/Gesamt) nach ${ERLASS}, ${spec.quelle} — Teileinheit von ${spec.kse}. `
      + "Funkrufname mit fiktiver, rein fortlaufender Ordnungsnummer — für M-V konnte kein "
      + "amtlicher OPTA-/Kennzahlenkatalog verifiziert werden.",
  };

  return { datei: `${slug(spec.teileinheit)}-${slug(ort.ort)}`, bogen, ort, kse: spec.kse, teileinheit: spec.teileinheit };
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

/** Selbstprüfung gegen die Sollstärke des Erlasses je Teileinheit. */
function pruefen(beispiele: BeispielBogen[]): void {
  const fehler: string[] = [];
  beispiele.forEach((b, i) => {
    const spec = SPECS[i]!;
    const s = staerke(b.bogen);
    const [f, u, m, g] = spec.soll;
    if (s.fuehrer !== f || s.unterfuehrer !== u || s.mannschaft !== m || s.gesamt !== g) {
      fehler.push(
        `${b.datei}: Stärke ${s.fuehrer}/${s.unterfuehrer}/${s.mannschaft}/${s.gesamt} ≠ Erlass ${f}/${u}/${m}/${g}`,
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

const ausgabe = join(wurzel, "examples", "katastrophenschutz", "mecklenburg-vorpommern");
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
  return `| ${b.datei} | ${b.kse} | ${b.teileinheit} | ${b.ort.ort} | ${b.ort.kreis} | ${s.fuehrer}/${s.unterfuehrer}/${s.mannschaft}/${s.gesamt} | ${b.bogen.fahrzeuge.length} | ${spec.quelle} |`;
});
writeFileSync(
  join(ausgabe, "README.md"),
  `# Beispiel-Erfassungsbögen — Katastrophenschutz Mecklenburg-Vorpommern

${beispiele.length} generierte Beispiel-Teileinheiten nach den **„Festlegungen zu den
Grundstrukturen im Katastrophenschutz Mecklenburg-Vorpommern"** — Erlass des
Landesamtes für zentrale Aufgaben und Technik der Polizei, Brand- und
Katastrophenschutz Mecklenburg-Vorpommern (LPBK M-V, Az. 300 - 233.0) vom
15. März 2020, ergangen nach § 5 Absatz 4 LKatSG M-V.

Alle Personen, Orte-Zuordnungen und Kennzeichen sind **fiktiv**.

## Warum ein Bogen je Teileinheit — wie Niedersachsen, anders als Brandenburg

Der Erlass beschreibt für jede der elf Katastrophenschutzeinheiten (KSE) eine
taktische Gliederung mit **Personalstärke UND Fahrzeugtyp je kleinster
Teileinheit** (Trupp/Gruppe/Staffel) — anders als die Brandenburger KatSV, die
nur eine Mindeststärke und eine Kfz-Anzahl je GANZER Einheit nennt (siehe
\`examples/katastrophenschutz/brandenburg/\`), aber wie die KatS-StAN
Niedersachsen. Deshalb ist hier — wie bei Niedersachsen — je kleinster
selbstständiger Teileinheit ein Bogen erzeugt, nicht ein Bogen je Zug/Gruppe
insgesamt.

Enthält ein Zug mehrere **baugleiche** Teileinheiten (z. B. LGr1/LGr2 des
Erweiterten Löschzugs, SanGr1/SanGr2 des Sanitätszugs, die beiden
Betreuungstrupps der zwei Betreuungsgruppen, WGfGr1/WGfGr2 des
Wassergefahrenzugs), steht hier nur EIN repräsentativer Bogen statt mehrerer
inhaltsgleicher. Der Zugtrupp (ZTr) ist dagegen je Zug ein eigener Bogen, weil
er dort jeweils die Führung genau dieses Zuges stellt.

Die **Medical Task Force** (Erlass Nr. 4.11) ist absichtlich **nicht**
abgebildet: Der Erlass nennt für ihre Teileinheiten keine Personalstärken
(nur „Verband der Größe II"), das bundeseinheitliche Ausstattungskonzept liegt
beim Bund. Eine erfundene Stärke wäre hier keine belastbare Beispielangabe.

## Funkrufnamen

Für Mecklenburg-Vorpommern konnte trotz gezielter Suche **kein öffentlich
zugänglicher landeseigener OPTA-/Funkrufnamen-Kennzahlenkatalog** (Fahrzeug-
oder Ortskennziffern, wie ihn Niedersachsen mit der OPTA-RdErl. oder
Brandenburg mit dem Katalog „Funkkennziffern Feuerwehr & Rettungsdienst" hat)
verifiziert werden. Verwendet werden deshalb nur die **bundesweit
einheitlichen Kennwörter** je Trägerorganisation (Florian, Rotkreuz, Akkon,
Johannes, Sama, Pelikan — Vokabular \`FUNKRUF_KENNWOERTER\`, bereits im
Projekt vorhanden). Die numerische Kennzahl jedes Fahrzeugs ist eine rein
**fortlaufende, ausdrücklich fiktive Ordnungsnummer je Landkreis** — keine
amtliche Fahrzeug- oder Ortskennung. Derselbe Hinweis steht im Feld
„Sonstiges" jedes einzelnen Bogens. Der PSNV-Trupp Einsatzkräfte (PSNV-E-Tr)
führt laut Erlass kein eigenes Fahrzeug (er nutzt im Einsatzfall den
MTW-PSNV des PSNV-Trupp Betroffene) und hat deshalb keinen Funkrufnamen.

## Träger

Getragen werden die KSE laut Erlass Nr. 2 von den öffentlichen Feuerwehren,
ASB, DLRG, DRK, JUH und MHD. Der Erlass regelt keine feste Zuordnung Fachdienst
→ Organisation; die Verteilung hier ist beispielhaft gewählt und über die acht
unteren Katastrophenschutzbehörden (HRO, LRO, LUP, MSE, NWM, SN, VG, VR aus
Tabelle 1 des Erlasses) gestreut.

Neu erzeugen mit: \`npm run beispiele:kats-mv\` (deterministisch, fester
Zufalls-Seed).

| Datei | KSE | Teileinheit | Ort | Untere KatS-Behörde | Stärke | Fahrzeuge | Quelle |
|---|---|---|---|---|---|---|---|
${zeilen.join("\n")}
`,
);

console.log(`${beispiele.length} Bögen nach ${ausgabe} geschrieben.`);
