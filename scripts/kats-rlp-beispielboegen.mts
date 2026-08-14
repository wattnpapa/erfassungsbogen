/**
 * Erzeugt Beispiel-Erfassungsbögen der Katastrophenschutz-Fähigkeitsmodule des
 * Landes Rheinland-Pfalz als JSON nach examples/katastrophenschutz/rheinland-pfalz/.
 * Abgelegt ist nur das Bogen-JSON; die PDF entsteht erst beim Anklicken in der
 * App aus dem aktuellen Layout.
 *
 * Aufruf (Node ≥ 22): npm run beispiele:kats-rp
 *
 * GRUNDLEGEND ANDERES REGELUNGSMODELL als Sachsen/Niedersachsen/Thüringen/
 * Brandenburg: Die rheinland-pfälzische Katastrophenschutzverordnung (KatS-LVO
 * vom 4. September 2025, GVBl. Nr. 18 vom 25.09.2025, S. 513) regelt in ihrer
 * Anlage 1 (zu §§ 2 und 3) keine Einheiten mit Personalstärke und
 * Fahrzeugliste, sondern abstrakte **Fähigkeiten** (z. B. "SAN-01") mit
 * Vorhaltungs-STÜCKZAHLEN je Landkreis-Größenklasse (klein/mittel/groß/RDB/
 * Land) — ohne Personal- oder Fahrzeugangabe.
 *
 * Diese Fähigkeiten werden erst durch die **"Handlungsanweisung zum Vollzug
 * der Anlage 1 der KatS-LVO"** (Landesamt für Brand- und Katastrophenschutz
 * Rheinland-Pfalz, Stand 18. November 2025, verbindlich im Rahmen der
 * Fachaufsicht nach § 4 Abs. 6 Satz 2 LBKG) zu konkreten "Fähigkeitsmodulen"
 * mit Fahrzeugen, Zusatzmaterial, Personalstärke (Führer/Unterführer/
 * Mannschaft/Gesamt) und Qualifikationsanforderungen — jeweils in einer
 * "Standard (I)"-Variante und optionalen Alternativen. Dieser Generator bildet
 * ausschließlich die STANDARD (I)-VARIANTE jedes Fähigkeitsmoduls ab; die
 * Alternativen sind gleichwertige Bestandsfahrzeug-Lösungen (Teil D der
 * Handlungsanweisung) und hier nicht zusätzlich abgebildet.
 *
 * Ein Bogen je Fähigkeitsmodul, analog zu Brandenburg (keine weitere
 * Zerlegung in Teileinheiten — jedes Modul IST die kleinste in der
 * Handlungsanweisung benannte Einheit). Ausgenommen ist LOG-01 (Instandsetzung
 * stationär): Die Handlungsanweisung weist dafür ausdrücklich keine Umsetzung
 * mit Fahrzeugen/Personal aus ("Wird durch LfBK am Standort Koblenz
 * abgebildet" — eine zentrale Landeseinrichtung, keine von Landkreisen/
 * kreisfreien Städten vorzuhaltende Einheit).
 *
 * Personalstärke (Führer/Unterführer/Mannschaft/Gesamt) und Fahrzeugliste sind
 * für jedes Modul EXAKT der Handlungsanweisung entnommen und werden am Ende
 * gegen sie geprüft. Named-Role-Listen (Zusatzqualifikationen wie "GF",
 * "AGT", "RettSan") stammen ebenfalls aus der Spalte "Besondere Qualifikation"
 * der Handlungsanweisung; wo deren Summe die dort angegebene Ebenen-Stärke
 * nicht ausschöpft (z. B. "8 AGT" bei 17 Mannschaftsstellen insgesamt), füllen
 * generisch benannte Stellen ("Truppmann/Truppfrau", "Kraftfahrer/-in") ohne
 * Sonderqualifikation auf die amtliche Sollstärke auf; das ist im Feld
 * „Sonstiges" jedes Bogens vermerkt.
 *
 * NICHT amtlich geregelt und deshalb frei (aber plausibel) gewählt:
 *   - die TRÄGERORGANISATION je Fähigkeitsmodul (die Handlungsanweisung nennt
 *     außer bei CBRN-04 — Berufsfeuerwehr Ludwigshafen — keinen Träger;
 *     Zuordnung hier nach A 4.3 der Handlungsanweisung: Sanitäts-, Betreuungs-,
 *     Verpflegungsdienst und PSNV über die "Arbeitsgemeinschaft der
 *     Hilfsorganisationen im Katastrophenschutz Rheinland-Pfalz" (HiK 3.0:
 *     DRK, ASB, JUH, Malteser), Wasserrettung über die DLRG, alle übrigen
 *     Module (Führung, Brandschutz, Technische Hilfe, CBRN außer CBRN-04,
 *     Rettung aus unwegsamem Gelände, Logistik, Bevölkerungsinformation) über
 *     die Feuerwehr als Regieeinheit der unteren Katastrophenschutzbehörde
 *     (Landkreis/kreisfreie Stadt);
 *   - Standort-Zuordnung, Personen, Kennzeichen und Funkrufnamen (das
 *     landeseinheitliche OPTA-Rufnamenschema nach § 31 KatS-LVO wird vom LfBK
 *     festgelegt und war öffentlich nicht auffindbar — Funkrufnamen bleiben
 *     deshalb hier leer, statt sie zu erfinden).
 *
 * Am Ende läuft eine Selbstprüfung (Stärke je Modul gegen die
 * Handlungsanweisung, QR-Roundtrip); die README im Zielordner bekommt eine
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
const rnd = prng(20250925); // Datum der KatS-LVO
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
  "Andreas", "Bernd", "Christian", "Daniel", "Dennis", "Dieter", "Dirk", "Frank",
  "Gerd", "Hans", "Heiko", "Jan", "Jens", "Jochen", "Jonas", "Jörg", "Jürgen",
  "Karl", "Klaus", "Lars", "Lukas", "Manfred", "Marco", "Markus", "Martin",
  "Matthias", "Max", "Michael", "Niklas", "Norbert", "Patrick", "Paul", "Peter",
  "Ralf", "Rainer", "René", "Robert", "Rüdiger", "Sebastian", "Stefan", "Sven",
  "Thomas", "Tim", "Tobias", "Uwe", "Volker", "Werner", "Wolfgang",
] as const;
const VORNAMEN_W = [
  "Andrea", "Angelika", "Anja", "Anna", "Barbara", "Beate", "Birgit", "Brigitte",
  "Christiane", "Claudia", "Doris", "Elke", "Erika", "Eva", "Gabriele", "Gisela",
  "Hannelore", "Heike", "Helga", "Ingrid", "Iris", "Julia", "Karin", "Katharina",
  "Kerstin", "Lea", "Lena", "Manuela", "Maria", "Marion", "Martina", "Monika",
  "Petra", "Renate", "Sabine", "Sandra", "Silke", "Simone", "Stefanie", "Susanne",
  "Ute", "Ursula", "Verena",
] as const;
const NACHNAMEN = [
  "Altmeier", "Bach", "Backes", "Bauer", "Becker", "Bender", "Berg", "Bergmann",
  "Blum", "Braun", "Brenner", "Christ", "Decker", "Diehl", "Dietz", "Dörr",
  "Ebert", "Faber", "Fischer", "Flesch", "Freund", "Fuchs", "Görg", "Groß",
  "Haas", "Hein", "Herber", "Hoffmann", "Hohl", "Huber", "Jung", "Jost",
  "Kaiser", "Keller", "Kern", "Klein", "Klöckner", "Koch", "Krämer", "Kraus",
  "Kremer", "Lang", "Lehnert", "Lenz", "Lorenz", "Ludwig", "Martin", "May",
  "Meier", "Merz", "Metzger", "Meyer", "Müller", "Nickel", "Peters", "Pfeiffer",
  "Reinhardt", "Roth", "Sauer", "Schäfer", "Schmidt", "Schmitt", "Schneider",
  "Scholl", "Schröder", "Schuster", "Seibert", "Simon", "Spies", "Stein",
  "Theobald", "Thiel", "Vogel", "Wagner", "Weber", "Weiler", "Weis", "Werner",
  "Winter", "Wolf", "Zimmermann", "Zorn",
] as const;

const QUALI_POOL = [
  "Berufskraftfahrer (Beruf)",
  "Rettungssanitäter (extern)",
  "Elektrofachkraft (Beruf)",
  "Koch (Beruf)",
  "Gesundheits- und Krankenpfleger (Beruf)",
  "Motorsägenschein (extern)",
  "Funkamateur (extern)",
  "Sprechfunker",
] as const;

// -------------------------------------------------------------- RLP: Orte

interface RpOrt {
  ort: string;
  kreis: string; // untere Katastrophenschutzbehörde (Landkreis/kreisfreie Stadt)
  kfz: string;
}

const RP_ORTE: Record<string, RpOrt> = {
  mainz: { ort: "Mainz", kreis: "Stadt Mainz", kfz: "MZ" },
  koblenz: { ort: "Koblenz", kreis: "Stadt Koblenz", kfz: "KO" },
  trier: { ort: "Trier", kreis: "Stadt Trier", kfz: "TR" },
  ludwigshafen: { ort: "Ludwigshafen am Rhein", kreis: "Stadt Ludwigshafen am Rhein", kfz: "LU" },
  kaiserslautern: { ort: "Kaiserslautern", kreis: "Stadt Kaiserslautern", kfz: "KL" },
  neuwied: { ort: "Neuwied", kreis: "Landkreis Neuwied", kfz: "NR" },
  badKreuznach: { ort: "Bad Kreuznach", kreis: "Landkreis Bad Kreuznach", kfz: "KH" },
  bitburg: { ort: "Bitburg", kreis: "Landkreis Eifelkreis Bitburg-Prüm", kfz: "BIT" },
  alzey: { ort: "Alzey", kreis: "Landkreis Alzey-Worms", kfz: "AZ" },
  pirmasens: { ort: "Pirmasens", kreis: "Stadt Pirmasens", kfz: "PS" },
  worms: { ort: "Worms", kreis: "Stadt Worms", kfz: "WO" },
  speyer: { ort: "Speyer", kreis: "Stadt Speyer", kfz: "SP" },
  altenkirchen: { ort: "Altenkirchen (Ww.)", kreis: "Landkreis Altenkirchen", kfz: "AK" },
  bernkastel: { ort: "Bernkastel-Kues", kreis: "Landkreis Bernkastel-Wittlich", kfz: "WIL" },
};
const ORT_SCHLUESSEL = Object.keys(RP_ORTE) as (keyof typeof RP_ORTE)[];

// ------------------------------------------------------------------ Träger

interface Traeger {
  org: OrganisationsTyp;
  name: string;
}
const feuerwehr: Traeger = { org: OrganisationsTyp.FEUERWEHR, name: "Feuerwehr" };
const drk: Traeger = { org: OrganisationsTyp.DRK, name: "Deutsches Rotes Kreuz" };
const asb: Traeger = { org: OrganisationsTyp.ASB, name: "Arbeiter-Samariter-Bund" };
const juh: Traeger = { org: OrganisationsTyp.JUH, name: "Johanniter-Unfall-Hilfe" };
const mhd: Traeger = { org: OrganisationsTyp.MHD, name: "Malteser Hilfsdienst" };
const dlrg: Traeger = { org: OrganisationsTyp.DLRG, name: "DLRG" };
const HIORG_ROTATION = [drk, juh, asb, mhd] as const;

function kreisKurz(o: RpOrt): string {
  return o.kreis.replace(/^(Landkreis|Stadt)\s+/, "");
}

// --------------------------------------------------------------- Kurzhelfer

function slug(s: string): string {
  return s
    .toLowerCase()
    .replaceAll("ä", "ae").replaceAll("ö", "oe").replaceAll("ü", "ue").replaceAll("ß", "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function dieselFuer(kurz: string): number {
  if (/^(TLF|SW|WLF|LKW)/.test(kurz)) return 120;
  if (/^(LF|GW|RW|MLF|MZF)/.test(kurz)) return 70;
  if (/^(ELW|KdoW|MTF|EGF|RTW|KTW|NEF|MZB|RTB)/.test(kurz)) return 45;
  return 0;
}

/** "2 LF 20 KatS" → { anzahl: 2, typ: "LF 20 KatS" }; ohne Zahl davor → anzahl 1. */
function parseFz(spec: string): { anzahl: number; typ: string } {
  const m = /^(\d+)\s*[x×]?\s+(.+)$/.exec(spec.trim());
  if (m) return { anzahl: parseInt(m[1]!, 10), typ: m[2]!.trim() };
  return { anzahl: 1, typ: spec.trim() };
}

/** "3 GF" → { anzahl: 3, funktion: "GF" }; ohne Zahl davor → anzahl 1. */
function parseRolle(spec: string): { anzahl: number; funktion: string } {
  const m = /^(\d+)\s+(.+)$/.exec(spec.trim());
  if (m) return { anzahl: parseInt(m[1]!, 10), funktion: m[2]!.trim() };
  return { anzahl: 1, funktion: spec.trim() };
}

// --------------------------------------------------------------- Modul-Specs

interface ModulSpec {
  /** Kürzel der Handlungsanweisung, z. B. "SAN-01". */
  kuerzel: string;
  titel: string;
  aufgabenfeld: string;
  traeger: Traeger;
  /** Fahrzeuge der Umsetzung "Standard (I)", z. B. ["KdoW", "2 LF 20 KatS"]. */
  fahrzeuge: string[];
  /** Zusatzmaterial als Freitext, sofern angegeben. */
  zusatzmaterial?: string;
  /** Amtliche Gesamtstärke [Führer, Unterführer, Mannschaft, Gesamt]. */
  soll: [number, number, number, number];
  /** Benannte Führer-Rollen aus "Besondere Qualifikation" (VF/ZF/OrgL/BKI/LNA/Arzt/…). */
  fuehrer: string[];
  /** Benannte Unterführer-Rollen (i. d. R. GF). */
  unterfuehrer: string[];
  /** Benannte Mannschafts-Rollen; Rest wird generisch aufgefüllt. */
  mannschaft: string[];
  /** Bezeichnung generischer Füllstellen je Ebene (Default: Trupphelfer). */
  fuellFuehrer?: string;
  fuellMannschaft?: string;
  abmarschbereitNach: string;
  szenario: string; // {ort} wird ersetzt
}

const AN = "Handlungsanweisung zum Vollzug der Anlage 1 der KatS-LVO (LfBK Rheinland-Pfalz, Stand 18.11.2025)";

const MODULE: ModulSpec[] = [
  // ------------------------------------------------------------ Führung
  {
    kuerzel: "FÜ-01", titel: "Führung-Staffel", aufgabenfeld: "Führung", traeger: feuerwehr,
    fahrzeuge: ["ELW 1", "KdoW"], soll: [3, 0, 3, 6],
    fuehrer: ["VF", "2 ZF"], unterfuehrer: [], mannschaft: ["3 Führungshilfspersonal"],
    abmarschbereitNach: "30 Minuten",
    szenario: "Flächenlage {ort} — Führungsunterstützung eines Verbandes",
  },
  {
    kuerzel: "FÜ-02", titel: "Interdisziplinäre Führungsgruppe", aufgabenfeld: "Führung", traeger: feuerwehr,
    fahrzeuge: ["KdoW", "ELW 2", "MZF 1", "MTF"], soll: [5, 0, 4, 9],
    fuehrer: ["2 VF", "3 ZF"], unterfuehrer: [], mannschaft: ["4 Führungshilfspersonal"],
    abmarschbereitNach: "45 Minuten",
    szenario: "Flächenlage {ort} — fachdienstübergreifende Befehlsstelle Führungsstufe C",
  },
  {
    kuerzel: "FÜ-03", titel: "Interdisziplinärer Führungsstab", aufgabenfeld: "Führung", traeger: feuerwehr,
    fahrzeuge: ["KdoW", "ELW 2", "MZF 1", "2 MTF"], soll: [13, 0, 10, 23],
    fuehrer: ["BKI", "5 VF", "6 ZF"], unterfuehrer: [], mannschaft: ["10 Führungshilfspersonal"],
    fuellFuehrer: "Führungskraft (weitere Funktion)",
    abmarschbereitNach: "90 Minuten",
    szenario: "Großschadenslage {ort} — Stab der Führungsebene D",
  },
  {
    kuerzel: "FÜ-04", titel: "Führungsunterstützung gesundheitlicher Bevölkerungsschutz", aufgabenfeld: "Führung",
    traeger: drk,
    fahrzeuge: ["ELW 1", "KdoW"], soll: [3, 0, 3, 6],
    fuehrer: ["VF", "2 ZF"], unterfuehrer: [], mannschaft: ["3 Führungshilfspersonal"],
    abmarschbereitNach: "30 Minuten",
    szenario: "MANV {ort} — Führungsunterstützung im Einsatzabschnitt Gesundheit",
  },
  {
    kuerzel: "FÜ-05", titel: "Führung - Gesundheitlicher Bevölkerungsschutz", aufgabenfeld: "Führung", traeger: drk,
    fahrzeuge: ["ELW 2", "MZF 1", "5 KdoW"], soll: [14, 0, 10, 24],
    fuehrer: ["5 VF", "6 ZF", "LNA"], unterfuehrer: [], mannschaft: ["10 Führungshilfspersonal"],
    fuellFuehrer: "Führungskraft (weitere Funktion)",
    abmarschbereitNach: "60 Minuten",
    szenario: "Großschadenslage {ort} — Leitung des gesundheitlichen Bevölkerungsschutzes",
  },
  {
    kuerzel: "FÜ-06", titel: "Führung – Bildgebende Fernerkundung", aufgabenfeld: "Führung", traeger: feuerwehr,
    fahrzeuge: ["MTF"], zusatzmaterial: "UAV, Bodenstation", soll: [0, 1, 2, 3],
    fuehrer: [], unterfuehrer: ["GF & Luftraumbeobachter/-in"],
    mannschaft: ["Drohnenpilot/-in", "Luftbildauswerter/-in"],
    abmarschbereitNach: "45 Minuten",
    szenario: "Lageerkundung {ort} — Bildgebende Fernerkundung aus der Luft",
  },

  // ---------------------------------------------------------- Brandschutz
  {
    kuerzel: "BS-01", titel: "Brandbekämpfung – schlauchgebunden", aufgabenfeld: "Brandschutz", traeger: feuerwehr,
    fahrzeuge: ["KdoW", "2 LF 20 KatS"], soll: [1, 2, 17, 20],
    fuehrer: ["ZF"], unterfuehrer: ["2 GF"], mannschaft: ["8 AGT"],
    fuellMannschaft: "Truppmann/Truppfrau",
    abmarschbereitNach: "30 Minuten",
    szenario: "Großbrand {ort} — schlauchgebundene Löschwasserversorgung ≥ 5.000 l/min",
  },
  {
    kuerzel: "BS-02", titel: "Brandbekämpfung – Wassertransport im Einsatzraum", aufgabenfeld: "Brandschutz",
    traeger: feuerwehr,
    fahrzeuge: ["KdoW", "TLF 4000", "2 TLF 3000"], soll: [1, 3, 6, 10],
    fuehrer: ["ZF"], unterfuehrer: ["3 GF"], mannschaft: [],
    fuellMannschaft: "Truppmann/Truppfrau",
    abmarschbereitNach: "30 Minuten",
    szenario: "Großbrand {ort} — Löschwassertransport im Einsatzraum",
  },
  {
    kuerzel: "BS-03", titel: "Brandbekämpfung – Wassertransport zum Einsatzraum (B-Schlauch)",
    aufgabenfeld: "Brandschutz", traeger: feuerwehr,
    fahrzeuge: ["MTF-Fü", "LF 20 KatS", "SW KatS", "MTF"], soll: [1, 2, 17, 20],
    fuehrer: ["ZF"], unterfuehrer: ["2 GF"], mannschaft: [],
    fuellMannschaft: "Truppmann/Truppfrau",
    abmarschbereitNach: "30 Minuten",
    szenario: "Großbrand {ort} — Löschwasserförderstrecke über 2.000 m",
  },
  {
    kuerzel: "BS-04", titel: "Brandbekämpfung – Wassertransport zum Einsatzraum (F-Schlauch)",
    aufgabenfeld: "Brandschutz", traeger: feuerwehr,
    fahrzeuge: ["KdoW", "WLF mit AB HFS", "LF 20 KatS", "GW-L 2"], soll: [1, 2, 16, 19],
    fuehrer: ["ZF"], unterfuehrer: ["2 GF"], mannschaft: [],
    fuellMannschaft: "Truppmann/Truppfrau",
    abmarschbereitNach: "45 Minuten",
    szenario: "Waldbrand {ort} — Löschwasserförderstrecke über 1.000 m oder Flutung von Geländeflächen",
  },

  // -------------------------------------------------------- Technische Hilfe
  {
    kuerzel: "TH-01", titel: "Technische Hilfe - Rettung", aufgabenfeld: "Technische Hilfe", traeger: feuerwehr,
    fahrzeuge: ["MTF-Fü", "RW", "GW-L 2", "HLF 10"], soll: [2, 3, 17, 22],
    fuehrer: ["2 ZF"], unterfuehrer: ["3 GF"], mannschaft: ["2 Führungshilfspersonal", "4 AGT"],
    fuellMannschaft: "Truppmann/Truppfrau",
    abmarschbereitNach: "30 Minuten",
    szenario: "Verkehrsunfall/Gebäudeeinsturz {ort} — Rettung aus komplexen Zwangslagen",
  },
  {
    kuerzel: "TH-02", titel: "Technische Hilfe - Sandsack", aufgabenfeld: "Technische Hilfe", traeger: feuerwehr,
    fahrzeuge: ["MTF-Fü", "WLF mit AB-Sandsack (Land)", "MLF", "MTF"],
    zusatzmaterial: "Hubwagen oder Stapler", soll: [2, 1, 18, 21],
    fuehrer: ["2 ZF"], unterfuehrer: ["GF"], mannschaft: ["2 Führungshilfspersonal"],
    fuellMannschaft: "Helfer/-in Sandsackfüllplatz",
    abmarschbereitNach: "60 Minuten",
    szenario: "Hochwasser {ort} — Betrieb einer Sandsackfüllanlage",
  },
  {
    kuerzel: "TH-03", titel: "Technische Hilfe - Pumpen/Beleuchtung", aufgabenfeld: "Technische Hilfe",
    traeger: feuerwehr,
    fahrzeuge: ["WLF mit AB-Starkregen (Land)"], soll: [0, 1, 2, 3],
    fuehrer: [], unterfuehrer: ["GF"], mannschaft: [],
    fuellMannschaft: "Maschinist/-in",
    abmarschbereitNach: "60 Minuten",
    szenario: "Starkregenereignis {ort} — Pump- und Beleuchtungsarbeiten an fünf Stellen",
  },

  // ------------------------------------------------------------------ CBRN
  {
    kuerzel: "CBRN-01", titel: "CBRN-Schutz – Retten und Eindämmen", aufgabenfeld: "CBRN-Schutz", traeger: feuerwehr,
    fahrzeuge: ["ELW 1", "GW-G", "GW-Mess", "MZF-Dekon", "MLF"], soll: [2, 4, 16, 22],
    fuehrer: ["2 ZF"], unterfuehrer: ["4 GF"], mannschaft: ["2 Führungshilfspersonal", "6 CSA"],
    fuellMannschaft: "Truppmann/Truppfrau",
    abmarschbereitNach: "30 Minuten",
    szenario: "Gefahrgutunfall {ort} — Retten und Eindämmen nach Unfällen mit gefährlichen Stoffen",
  },
  {
    kuerzel: "CBRN-02", titel: "CBRN-Schutz – Messen", aufgabenfeld: "CBRN-Schutz", traeger: feuerwehr,
    fahrzeuge: ["ELW 1", "4 CBRN-ErkKW"], soll: [2, 5, 12, 19],
    fuehrer: ["2 ZF"], unterfuehrer: ["5 GF"], mannschaft: ["2 Führungshilfspersonal", "10 AGT"],
    abmarschbereitNach: "30 Minuten",
    szenario: "Gefahrstofffreisetzung {ort} — kontinuierliche Messung an vier Stellen gleichzeitig",
  },
  {
    kuerzel: "CBRN-03", titel: "CBRN-Schutz – radioaktiver Kontaminationsnachweis", aufgabenfeld: "CBRN-Schutz",
    traeger: feuerwehr,
    fahrzeuge: ["ELW 1", "2 MZF-Dekon", "LF 20 KatS"], soll: [2, 3, 20, 25],
    fuehrer: ["2 ZF"], unterfuehrer: ["3 GF"], mannschaft: ["2 Führungshilfspersonal", "4 CSA"],
    fuellMannschaft: "Truppmann/Truppfrau",
    abmarschbereitNach: "90 Minuten",
    szenario: "Strahlenschutzeinsatz {ort} — Dekontaminationsstelle für 50 Personen pro Stunde",
  },
  {
    kuerzel: "CBRN-04", titel: "Landesanalysesystem", aufgabenfeld: "CBRN-Schutz",
    traeger: feuerwehr, // stationär bei der Berufsfeuerwehr Ludwigshafen
    fahrzeuge: ["ELW 1", "GW-Mess", "CBRN-ErkKW"],
    zusatzmaterial: "Ergänzungsausstattung Messtechnik und Probenahme", soll: [1, 1, 4, 6],
    fuehrer: ["VF"], unterfuehrer: ["GF"],
    mannschaft: ["2 Systembediener Analytik", "2 Mess- und Probenentnahmefachkräfte"],
    abmarschbereitNach: "60 Minuten",
    szenario: "Stoffidentifikation {ort} — Landesanalysesystem (stationär bei der BF Ludwigshafen)",
  },

  // ------------------------------------------------------------ Sanitätsdienst
  {
    kuerzel: "SAN-01", titel: "Sanitätsdienst - Behandlung", aufgabenfeld: "Sanitätsdienst", traeger: drk,
    fahrzeuge: ["GW-Sanität", "2 EGF/MTF"], soll: [0, 1, 11, 12],
    fuehrer: [], unterfuehrer: ["GF"], mannschaft: ["3 RettSan", "8 Sanitäter"],
    abmarschbereitNach: "30 Minuten",
    szenario: "MANV {ort} — Behandlung von 15 Verletzten/Erkrankten pro Stunde",
  },
  {
    kuerzel: "SAN-02", titel: "Sanitätsdienst - Transport", aufgabenfeld: "Sanitätsdienst", traeger: juh,
    fahrzeuge: ["KdoW", "RTW", "2 KTW"], zusatzmaterial: "Notfallrucksack und PA-Karten", soll: [1, 1, 7, 9],
    fuehrer: ["Arzt/Ärztin"], unterfuehrer: ["GF"], mannschaft: ["2 RettSan", "5 Sanitäter"],
    abmarschbereitNach: "30 Minuten",
    szenario: "MANV {ort} — zeitgleicher Transport von 5 Verletzten/Erkrankten",
  },
  {
    kuerzel: "SAN-03", titel: "Sanitätsdienst – Behandlungsplatz 50", aufgabenfeld: "Sanitätsdienst", traeger: asb,
    fahrzeuge: ["KdoW", "ELW 1", "2 GW BHP"], zusatzmaterial: "Stromerzeuger tragbar, Infektionsschutzmaterial",
    soll: [3, 0, 6, 9],
    fuehrer: ["VF", "2 ZF"], unterfuehrer: [], mannschaft: ["3 Führungshilfspersonal"],
    fuellMannschaft: "Helfer/-in Behandlungsplatz",
    abmarschbereitNach: "60 Minuten",
    szenario: "MANV {ort} — Leitung eines Behandlungsplatzes für 50 Verletzte/Erkrankte",
  },

  // ---------------------------------------------------------------- Betreuung
  {
    kuerzel: "BT-01", titel: "Betreuung – Soziale Betreuung", aufgabenfeld: "Betreuungsdienst", traeger: mhd,
    fahrzeuge: ["EGF/MTF"], soll: [0, 1, 5, 6],
    fuehrer: [], unterfuehrer: ["GF"], mannschaft: ["5 BT-Helfer"],
    abmarschbereitNach: "30 Minuten",
    szenario: "Evakuierung {ort} — soziale Betreuung von 150 Betroffenen in der Soforthilfephase",
  },
  {
    kuerzel: "BT-02", titel: "Betreuung - Unterkunft", aufgabenfeld: "Betreuungsdienst", traeger: drk,
    fahrzeuge: ["GW-Betreuung", "EGF/MTF"], soll: [0, 1, 5, 6],
    fuehrer: [], unterfuehrer: ["GF"], mannschaft: ["5 BT-Helfer"],
    abmarschbereitNach: "60 Minuten",
    szenario: "Evakuierung {ort} — Notunterkunft für 100 Betroffene in der Übergangsphase",
  },
  {
    kuerzel: "BT-03", titel: "Betreuung – Betreuungsplatz 500", aufgabenfeld: "Betreuungsdienst", traeger: juh,
    fahrzeuge: ["KdoW", "ELW 1", "LKW zGM 18 t", "Mitnahmestapler"], zusatzmaterial: "Betreuungsmaterial",
    soll: [3, 0, 4, 7],
    fuehrer: ["VF", "2 ZF"], unterfuehrer: [], mannschaft: ["3 Führungshilfspersonal"],
    fuellMannschaft: "Helfer/-in Betreuungsplatz",
    abmarschbereitNach: "60 Minuten",
    szenario: "Großschadenslage {ort} — Leitung eines Betreuungsplatzes für 500 Betroffene",
  },

  // ------------------------------------------------------------- Wasserrettung
  {
    kuerzel: "WR-01", titel: "Wasserrettung - Fließgewässer", aufgabenfeld: "Wasserrettung", traeger: dlrg,
    fahrzeuge: ["MTF-Fü", "GW-WR Boot", "MZB", "MTF/EGF", "RTB 2", "GW-WR SR"],
    zusatzmaterial: "Raft", soll: [2, 2, 18, 22],
    fuehrer: ["2 ZF"], unterfuehrer: ["2 GF"],
    mannschaft: [
      "2 Führungshilfspersonal", "4 Bootsführer/-in",
      "6 Strömungs-/Fließwasserretter/-in", "2 Personen als Wasserretter",
    ],
    fuellMannschaft: "Truppmann/Truppfrau",
    abmarschbereitNach: "45 Minuten",
    szenario: "Hochwasser {ort} — Rettung und Evakuierung in Fließgewässern",
  },
  {
    kuerzel: "WR-02", titel: "Wasserrettung - Tauchen", aufgabenfeld: "Wasserrettung", traeger: dlrg,
    fahrzeuge: ["GW-WR Tauchen", "MTF"],
    zusatzmaterial: "Kommunikationseinheit für unter Wasser (Tauchertelefon), ROV (Tauchroboter)",
    soll: [0, 2, 6, 8],
    fuehrer: [], unterfuehrer: ["Taucheinsatzführer/-führerin", "Signalmann/Signalfrau"],
    mannschaft: [
      "Feuerwehrtaucher/-taucherin", "Sicherheitstaucher/-taucherin",
      "ROV-Operator/-Operatorin", "ROV-Beobachter/-Beobachterin", "ROV-Steuerer/-Steuererin",
    ],
    fuellMannschaft: "Feuerwehrtaucher/-taucherin",
    abmarschbereitNach: "45 Minuten",
    szenario: "Vermisstensuche {ort} — Rettung und Bergung von Personen und Sachwerten im Gewässer",
  },

  // ---------------------------------------------- Rettung aus unwegsamem Gelände
  {
    kuerzel: "RG-01", titel: "Rettung aus unwegsamem Gelände - SRHT", aufgabenfeld: "Rettung aus unwegsamem Gelände",
    traeger: feuerwehr,
    fahrzeuge: ["GW-HR Höhenrettung"], soll: [0, 1, 4, 5],
    fuehrer: [], unterfuehrer: ["Ausbilder/Ausbilderin SRHT"], mannschaft: ["4 Höhenretter/-retterinnen"],
    abmarschbereitNach: "45 Minuten",
    szenario: "Höhen-/Tiefenrettung {ort} — Seilunterstütztes Arbeiten im unwegsamen Gelände",
  },
  {
    kuerzel: "RG-02", titel: "Rettung aus unwegsamem Gelände – SRHT Windenrettung",
    aufgabenfeld: "Rettung aus unwegsamem Gelände", traeger: feuerwehr,
    fahrzeuge: ["GW-HR Höhenrettung"], soll: [0, 1, 5, 6],
    fuehrer: [], unterfuehrer: ["Ausbilder/-in SRHT"],
    mannschaft: ["4 Höhenretter/-retterinnen", "1 Person Windenrettung"],
    abmarschbereitNach: "30 Minuten",
    szenario: "Höhen-/Tiefenrettung {ort} — hubschraubergestützte Windenrettung",
  },
  {
    kuerzel: "RG-03", titel: "Rettung aus unwegsamem Gelände - RHOT", aufgabenfeld: "Rettung aus unwegsamem Gelände",
    traeger: drk,
    fahrzeuge: ["Fahrzeug für biologische Ortung", "Fahrzeug für technische Ortung"],
    zusatzmaterial: "Endoskopkamera, Bodenhorchgeräte, Drohne mit WBK, Kernbohrgerät, 3 Trümmersuchhunde",
    soll: [0, 1, 6, 7],
    fuehrer: [], unterfuehrer: ["GF"],
    mannschaft: ["3 Hundeführer/-führerin", "3 Personen technische Ortung (Drohnenpiloten/-innen)"],
    abmarschbereitNach: "30 Minuten",
    szenario: "Vermisstensuche {ort} — biologische und technische Ortung verschütteter Personen",
  },

  // ------------------------------------------------------------- Verpflegung
  {
    kuerzel: "V-01", titel: "Verpflegung-Mahlzeiten", aufgabenfeld: "Verpflegung", traeger: asb,
    fahrzeuge: ["GW-Verpflegung", "FKH", "EGF/MTF"], zusatzmaterial: "Lebensmittel", soll: [0, 1, 8, 9],
    fuehrer: [], unterfuehrer: ["GF"], mannschaft: ["Feldkoch/Feldköchin", "7 Verpflegungshelfer/-helferinnen"],
    abmarschbereitNach: "60 Minuten",
    szenario: "Flächenlage {ort} — Verpflegung von 300 Personen mit 3 Mahlzeiten täglich",
  },
  {
    kuerzel: "V-02", titel: "Verpflegung-Getränke", aufgabenfeld: "Verpflegung", traeger: mhd,
    fahrzeuge: ["GW-Verpflegung", "FKH", "EGF/MTF"], zusatzmaterial: "Getränke", soll: [0, 1, 8, 9],
    fuehrer: [], unterfuehrer: ["GF"], mannschaft: ["Feldkoch/Feldköchin", "7 Verpflegungshelfer/-helferinnen"],
    abmarschbereitNach: "60 Minuten",
    szenario: "Flächenlage {ort} — Ausgabe von 1.500 Heiß-/Kaltgetränken pro Stunde",
  },

  // ---------------------------------------------------------------- Logistik
  // LOG-01 (Instandsetzung stationär) ohne Umsetzungstabelle — zentrale LfBK-Einrichtung Koblenz, hier nicht abgebildet.
  {
    kuerzel: "LOG-02", titel: "Logistik – Treibstoffversorgung", aufgabenfeld: "Logistik", traeger: feuerwehr,
    fahrzeuge: ["2 GW-L 1"], zusatzmaterial: "10 Kanister leer je 20 l (DIN 7274)", soll: [0, 1, 5, 6],
    fuehrer: [], unterfuehrer: ["GF"], mannschaft: [],
    fuellMannschaft: "Kraftfahrer/-in",
    abmarschbereitNach: "60 Minuten",
    szenario: "Flächenlage {ort} — mobile Treibstoffversorgung im Einsatz",
  },
  {
    kuerzel: "LOG-03", titel: "Logistik - Transport von Stückgut", aufgabenfeld: "Logistik", traeger: feuerwehr,
    fahrzeuge: ["GW-L 2"], zusatzmaterial: "Gabelhubwagen mind. 10 kN Hubkraft", soll: [0, 1, 2, 3],
    fuehrer: [], unterfuehrer: ["GF"], mannschaft: [],
    fuellMannschaft: "Kraftfahrer/-in",
    abmarschbereitNach: "30 Minuten",
    szenario: "Flächenlage {ort} — Transport von Stückgut auf mindestens 6 Palettenstellplätzen",
  },
  {
    kuerzel: "LOG-04", titel: "Logistik - Transport von Schüttgut", aufgabenfeld: "Logistik", traeger: feuerwehr,
    fahrzeuge: ["2 WLF mit Mulde"], soll: [0, 1, 5, 6],
    fuehrer: [], unterfuehrer: ["GF"], mannschaft: [],
    fuellMannschaft: "Kraftfahrer/-in",
    abmarschbereitNach: "30 Minuten",
    szenario: "Hochwasser {ort} — Transport von Schüttgut mit mindestens 10 m³ Volumen",
  },
  {
    kuerzel: "LOG-05", titel: "Logistik - Personentransport", aufgabenfeld: "Logistik", traeger: feuerwehr,
    fahrzeuge: ["KdoW", "7 MTF"], soll: [0, 1, 7, 8],
    fuehrer: [], unterfuehrer: ["GF"], mannschaft: [],
    fuellMannschaft: "Kraftfahrer/-in",
    abmarschbereitNach: "60 Minuten",
    szenario: "Evakuierung {ort} — gleichzeitiger Transport von 50 Personen",
  },

  // -------------------------------------------------------------------- PSNV
  {
    kuerzel: "PSNV-01", titel: "Psychosoziale Notfallversorgung", aufgabenfeld: "PSNV", traeger: drk,
    fahrzeuge: ["MTF/EGF"], zusatzmaterial: "PSNV-Ausstattung", soll: [0, 1, 8, 9],
    fuehrer: [], unterfuehrer: ["Leiter/-in PSNV"], mannschaft: ["8 PSNV-Kräfte"],
    abmarschbereitNach: "60 Minuten",
    szenario: "Großschadenslage {ort} — psychosoziale Akutversorgung für 50 Personen",
  },

  // ---------------------------------------------------- Bevölkerungsinformation
  {
    kuerzel: "BM-01", titel: "VOST - Virtual Operations Support Team", aufgabenfeld: "Bevölkerungsinformation",
    traeger: feuerwehr,
    fahrzeuge: ["MTF"], zusatzmaterial: "IT-Arbeitsplatz für jede Funktion", soll: [1, 0, 5, 6],
    fuehrer: ["ZF mit Kenntnissen in der Stabsarbeit"], unterfuehrer: [], mannschaft: [],
    fuellMannschaft: "Helfer/-in VOST",
    abmarschbereitNach: "60 Minuten",
    szenario: "Großschadenslage {ort} — digitale Lagebild-Auswertung sozialer Medien",
  },
  {
    kuerzel: "BM-02", titel: "Bevölkerungsinformation und Medienarbeit - PuMA",
    aufgabenfeld: "Bevölkerungsinformation", traeger: feuerwehr,
    fahrzeuge: ["MTF", "MZF 1"], zusatzmaterial: "Material zum Aufbau einer Pressestelle/-konferenz",
    soll: [4, 0, 2, 6],
    fuehrer: ["Führungskraft der Teileinheit (auch S5)", "3 ZF mit Qualifikation S5"],
    unterfuehrer: [], mannschaft: ["2 IuK/Technik"],
    abmarschbereitNach: "60 Minuten",
    szenario: "Ereignis mit besonderer Medienrelevanz {ort} — Presse- und Medienarbeit (PuMA)",
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

function personBauen(rolle: R, funktion: string, erste: boolean): Person {
  const g = wuerfel(0.3) ? G.W : G.M;
  const { vorname, nachname } = neuerName(g);
  const fe =
    rolle !== R.MANNSCHAFT
      ? gewichtet<FE>([[FE.C, 4], [FE.CE, 3], [FE.C1, 2], [FE.B, 2]])
      : gewichtet<FE>([[FE.B, 6], [FE.C1, 3], [FE.C, 3], [FE.CE, 2], [FE.NONE, 3]]);
  const person: Person = {
    vorname,
    nachname,
    staerkeRolle: rolle,
    funktionen: [{ freitext: funktion }],
    fahrerlaubnis: fe,
    geschlecht: g,
    ernaehrung: gewichtet<E>([[E.FLEISCH, 75], [E.VEGETARISCH, 18], [E.VEGAN, 7]]),
    kontakte: [],
    zusatzqualifikationen: [],
  };
  if (wuerfel(0.12)) {
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

function ebeneBauen(rolle: R, namen: string[], sollAnzahl: number, fuellName: string): Person[] {
  const personen: Person[] = [];
  for (const eintrag of namen) {
    const { anzahl, funktion } = parseRolle(eintrag);
    for (let i = 0; i < anzahl; i++) personen.push(personBauen(rolle, funktion, false));
  }
  while (personen.length < sollAnzahl) personen.push(personBauen(rolle, fuellName, false));
  if (personen.length > sollAnzahl) {
    throw new Error(
      `Zu viele benannte Rollen für Ebene ${R[rolle]}: ${personen.length} > Soll ${sollAnzahl}`,
    );
  }
  return personen;
}

function personalBauen(spec: ModulSpec): Person[] {
  const [f, u, m] = spec.soll;
  const personen = [
    ...ebeneBauen(R.FUEHRER, spec.fuehrer, f, spec.fuellFuehrer ?? "Führungskraft (weitere Funktion)"),
    ...ebeneBauen(R.UNTERFUEHRER, spec.unterfuehrer, u, "Gruppenführer/-in"),
    ...ebeneBauen(R.MANNSCHAFT, spec.mannschaft, m, spec.fuellMannschaft ?? "Helfer/-in"),
  ];
  if (personen[0]) {
    personen[0] = { ...personen[0] };
    if (personen[0].kontakte.length === 0) {
      personen[0].kontakte = [
        {
          art: KontaktArt.MOBIL,
          dienstlich: false,
          wert: fakeTelefon(`01${ganz(5, 7)}${ganz(1, 9)}${String(ganz(0, 9999999)).padStart(7, "0")}`),
        },
      ];
    }
  }
  return personen;
}

let laufendeNummer = 1;
function kennzeichen(kfz: string): string {
  return `${kfz}-${3000 + (laufendeNummer++ % 8000)}`;
}

function fahrzeugeBauen(spec: ModulSpec, ort: RpOrt): Fahrzeug[] {
  const fahrzeuge: Fahrzeug[] = [];
  for (const eintrag of spec.fahrzeuge) {
    const { anzahl, typ } = parseFz(eintrag);
    for (let i = 0; i < anzahl; i++) {
      fahrzeuge.push({ typ: { freitext: typ }, kennzeichen: kennzeichen(ort.kfz) });
    }
  }
  return fahrzeuge;
}

interface BeispielBogen {
  datei: string;
  bogen: Erfassungsbogen;
  ort: RpOrt;
  spec: ModulSpec;
}

function bogenBauen(spec: ModulSpec, ortSchluessel: keyof typeof RP_ORTE): BeispielBogen {
  const ort = RP_ORTE[ortSchluessel]!;
  const personal = personalBauen(spec);
  const fahrzeuge = fahrzeugeBauen(spec, ort);

  const hierarchie: HierarchieEbene[] = [
    { bezeichnung: { freitext: "Fähigkeitsmodul" }, name: `${spec.kuerzel} · ${spec.aufgabenfeld}` },
    { bezeichnung: { freitext: "Untere Katastrophenschutzbehörde" }, name: ort.kreis },
  ];

  const tag = datumAusIso("2026-06-01") + ganz(0, 60);
  const stand = tag * MINUTEN_JE_TAG + ganz(6, 21) * 60 + ganz(0, 59);
  const dauer = ganz(1, 4);
  const diesel = fahrzeuge.reduce((s, fz) => s + dieselFuer(fz.typ.freitext ?? ""), 0);

  const bogen: Erfassungsbogen = {
    schemaVersion: SCHEMA_VERSION,
    uebung: true,
    stand,
    einheit: {
      organisation: spec.traeger.org,
      organisationName: `${spec.traeger.name} ${kreisKurz(ort)}`,
      einheitsTyp: { freitext: `${spec.titel} (${spec.kuerzel})` },
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
      unterbringung: dauer >= 2 && wuerfel(0.5),
      ruhezeitErforderlich: wuerfel(0.3),
    },
    sonstiges:
      `Fähigkeitsmodul ${spec.kuerzel} „${spec.titel}", Umsetzung Standard (I) nach ${AN}. `
      + `Personalstärke ${spec.soll[0]}/${spec.soll[1]}/${spec.soll[2]}/${spec.soll[3]} (Führer/Unterführer/`
      + "Mannschaft/Gesamt) exakt nach Handlungsanweisung; nicht namentlich benannte Stellen sind "
      + "generisch aufgefüllt. Trägerorganisation frei (aber plausibel) gewählt — die Handlungsanweisung "
      + "regelt außer bei CBRN-04 keinen Träger."
      + (spec.zusatzmaterial ? ` Zusatzmaterial lt. Handlungsanweisung: ${spec.zusatzmaterial}.` : "")
      + ` Abmarschbereit nach ${spec.abmarschbereitNach}.`,
  };

  return {
    datei: `${slug(spec.kuerzel)}-${slug(spec.titel)}-${slug(ort.ort)}`,
    bogen,
    ort,
    spec,
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

function pruefen(beispiele: BeispielBogen[]): void {
  const fehler: string[] = [];
  for (const b of beispiele) {
    const s = staerke(b.bogen);
    const [f, u, m, g] = b.spec.soll;
    if (s.fuehrer !== f || s.unterfuehrer !== u || s.mannschaft !== m || s.gesamt !== g) {
      fehler.push(
        `${b.datei}: Stärke ${s.fuehrer}/${s.unterfuehrer}/${s.mannschaft}/${s.gesamt} `
        + `≠ Handlungsanweisung ${f}/${u}/${m}/${g}`,
      );
    }
  }
  const kuerzel = new Set<string>();
  for (const b of beispiele) {
    if (kuerzel.has(b.spec.kuerzel)) fehler.push(`Doppeltes Kürzel ${b.spec.kuerzel}`);
    kuerzel.add(b.spec.kuerzel);
  }
  if (fehler.length > 0) {
    throw new Error(`Selbstprüfung fehlgeschlagen:\n  ${fehler.join("\n  ")}`);
  }
}

// ---------------------------------------------------------------- Hauptlauf

const beispiele: BeispielBogen[] = MODULE.map((spec, i) =>
  bogenBauen(spec, ORT_SCHLUESSEL[i % ORT_SCHLUESSEL.length]!),
);

pruefen(beispiele);

const ausgabe = join(wurzel, "examples", "katastrophenschutz", "rheinland-pfalz");
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
  return `| ${b.spec.kuerzel} | ${b.spec.titel} | ${b.spec.aufgabenfeld} | ${b.ort.ort} | `
    + `${s.fuehrer}/${s.unterfuehrer}/${s.mannschaft}/${s.gesamt} | ${b.bogen.fahrzeuge.length} |`;
});

writeFileSync(
  join(ausgabe, "README.md"),
  `# Beispiel-Erfassungsbögen — Katastrophenschutz Rheinland-Pfalz

${beispiele.length} generierte Beispiel-Fähigkeitsmodule nach der rheinland-pfälzischen
**Katastrophenschutzverordnung** (KatS-LVO vom 4. September 2025, GVBl. Nr. 18 vom
25.09.2025, S. 513) und der dazugehörigen **„Handlungsanweisung zum Vollzug der
Anlage 1 der KatS-LVO"** (Landesamt für Brand- und Katastrophenschutz
Rheinland-Pfalz, Stand 18. November 2025).

Alle Personen, Standort-Zuordnungen und Kennzeichen sind **fiktiv**.

## Warum ein anderes Zerlegungsmuster als Sachsen/Niedersachsen/Thüringen/Brandenburg

Die KatS-LVO selbst regelt in ihrer **Anlage 1** (zu §§ 2 und 3) keine Einheiten
mit Personalstärke und Fahrzeugliste, sondern abstrakte **Fähigkeiten**
(z. B. \`SAN-01\`) mit reinen Vorhaltungs-Stückzahlen je Landkreis-Größenklasse
(klein/mittel/groß/RDB/Land) — ohne jede Personal- oder Fahrzeugangabe. Das ist
ein grundlegend anderes Regelungsmodell als in den anderen Bundesländern, die
entweder Teileinheiten (Sachsen, Niedersachsen, Thüringen) oder wenigstens ganze
Einheiten mit Mindeststärke (Brandenburg) unmittelbar in der Verordnung nennen.

Diese Fähigkeiten werden erst durch die **Handlungsanweisung** zu konkreten
**Fähigkeitsmodulen** mit Fahrzeugen, Zusatzmaterial, Personalstärke
(Führer/Unterführer/Mannschaft/Gesamt) und Qualifikationsanforderungen — jeweils
in einer Umsetzungs-Variante „Standard (I)" und optionalen Alternativen. Diese
Handlungsanweisung ist **verbindlich** (Fachaufsicht und Weisungsrecht nach
§ 4 Abs. 6 Satz 2 LBKG) und damit die maßgebliche Quelle für Personalstärke und
Fahrzeuge dieser Beispielbögen.

**Modellierungsentscheidung:** Ein Bogen je Fähigkeitsmodul (analog Brandenburg,
keine weitere Zerlegung in Teileinheiten) — jedes Modul IST bereits die
kleinste in der Handlungsanweisung benannte Einheit. Abgebildet ist jeweils nur
die **Standard (I)**-Umsetzung; Alternativen (gleichwertige Bestandsfahrzeuge,
Teil D der Handlungsanweisung) sind nicht zusätzlich als eigene Bögen enthalten.
**LOG-01** (Instandsetzung stationär) fehlt bewusst: Die Handlungsanweisung weist
dafür keine Personal-/Fahrzeug-Umsetzung aus — sie wird zentral durch das LfBK
am Standort Koblenz abgebildet, ist also keine von Landkreisen/kreisfreien
Städten vorzuhaltende Einheit.

## Was verordnungsgenau ist — und was nicht

> **Personalstärke und Fahrzeuge sind exakt der Handlungsanweisung entnommen**
> und werden beim Generieren gegen sie geprüft. Wo die dort namentlich
> genannten Qualifikationen (z. B. „8 AGT") die angegebene Ebenen-Stärke nicht
> ausschöpfen, füllen generisch benannte Stellen ohne Sonderqualifikation
> (z. B. „Truppmann/Truppfrau", „Kraftfahrer/-in") auf die amtliche Sollstärke
> auf.
>
> **Nicht amtlich geregelt** und deshalb hier frei, aber plausibel gewählt:
> die **Trägerorganisation** je Modul (die Handlungsanweisung nennt außer bei
> CBRN-04 — stationär bei der Berufsfeuerwehr Ludwigshafen — keinen Träger;
> Zuordnung hier nach Abschnitt A 4.3 der Handlungsanweisung: Sanitäts-,
> Betreuungs- und Verpflegungsdienst sowie PSNV über die Hilfsorganisationen
> der „Arbeitsgemeinschaft der Hilfsorganisationen im Katastrophenschutz
> Rheinland-Pfalz" — DRK, Johanniter, ASB, Malteser im Wechsel —, Wasserrettung
> über die DLRG, alle übrigen Module über die Feuerwehr als Regieeinheit der
> unteren Katastrophenschutzbehörde) sowie Standort-Zuordnung, Personen und
> Kennzeichen.
>
> **Funkrufnamen bleiben leer.** Das landeseinheitliche OPTA-Rufnamenschema
> nach § 31 KatS-LVO wird vom Landesamt für Brand- und Katastrophenschutz
> festgelegt; ein öffentlich zugängliches Funkrufnamenverzeichnis für dieses
> Schema war nicht auffindbar. Statt eines erfundenen Schemas bleibt das Feld
> leer.

Derselbe Hinweis steht im Feld „Sonstiges" jedes einzelnen Bogens.

Neu erzeugen mit: \`npm run beispiele:kats-rp\` (deterministisch, fester Zufalls-Seed).

| Kürzel | Fähigkeitsmodul | Aufgabenfeld | Ort | Stärke | Fahrzeuge |
|---|---|---|---|---|---|
${zeilen.join("\n")}

Quelle: KatS-LVO Rheinland-Pfalz vom 4. September 2025 (GVBl. Nr. 18 vom
25.09.2025, S. 513–531) und „Handlungsanweisung zum Vollzug der Anlage 1 der
KatS-LVO" (LfBK Rheinland-Pfalz, Stand 18. November 2025).
`,
);

console.log(`${beispiele.length} Bögen nach ${ausgabe} geschrieben.`);
