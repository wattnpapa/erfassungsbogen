/**
 * Erzeugt Beispiel-Erfassungsbögen der Katastrophenschutzeinheiten des
 * Freistaates Sachsen als JSON nach examples/katastrophenschutz/sachsen/.
 * Abgelegt ist nur das Bogen-JSON; die PDF entsteht erst beim Anklicken in der
 * App aus dem aktuellen Layout.
 *
 * Aufruf (Node ≥ 22): npm run beispiele:kats-sn
 *
 * Grundlage sind die Sächsische Katastrophenschutzverordnung (SächsKatSVO,
 * Anlagen 1–10 zu § 1 Abs. 2 bzw. § 2 Abs. 2) und die VwV KatS-Einheiten
 * (Anlage 7 Fahrzeugausstattung, Anlage 8 Verteilung auf Landkreise und
 * Kreisfreie Städte). Abgebildet wird — wie bei Niedersachsen — je kleinster
 * selbstständiger Teileinheit ein Bogen; die Züge und die Medizinische Task
 * Force sind in ihre Teileinheiten zerlegt.
 *
 * Die Stärkeangaben der SächsKatSVO lauten „ZFü/GrFü/Mannschaft/Gesamt"
 * (bei Führungsgruppen und MTF zusätzlich mit Verbandsführer). Diese Spalten
 * bilden exakt die StaerkeRolle des Datenmodells ab; Notärzte werden in der
 * Verordnung in der ZFü-Spalte geführt und deshalb als Führer gezählt. Die in
 * Klammern angegebene Doppelbesetzung (Ablösung) ist hier NICHT abgebildet —
 * die Bögen zeigen die einfache Sollstärke.
 *
 * Die Funkrufnamen folgen der Funkrufnamen-Richtlinie des SMI vom 2. September
 * 1998 in Verbindung mit den Änderungserlassen vom 14. Juni 2012 (Anpassung an
 * neue Feuerwehrfahrzeugnormen und Katastrophenschutzeinheiten, mit
 * Beispiel-Anlage je KatS-Einheit) und vom 30. Juli 2020 (LF-KatS = 45,
 * RW = 52): „<Kennwort> <Ort> <erste>/<zweite>/<dritte> Teilkennzahl".
 * Die Träger sind der Beispiel-Anlage 2012 entnommen und deshalb je Einheit
 * gemischt (ein Einsatzzug verteilt sich z. B. auf JUH, DRK, ASB und MHD);
 * Bergrettung und Rettungshundestaffel führen die Kennwörter „Bergwacht" bzw.
 * „Antonius". Fiktiv sind alle Personen, Standort-Zuordnungen und Kennzeichen.
 *
 * Am Ende läuft eine Selbstprüfung (Stärke gegen die Verordnung, QR-Roundtrip);
 * die README im Zielordner bekommt eine Übersichtstabelle.
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
const rnd = prng(20240301);

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
  "Andreas", "Bernd", "Christian", "Daniel", "David", "Dennis", "Dirk", "Enrico",
  "Falk", "Frank", "Georg", "Hagen", "Heiko", "Jan", "Jens", "Jörg",
  "Karsten", "Lars", "Lukas", "Marco", "Mario", "Markus", "Martin", "Matthias",
  "Michael", "Mike", "Niklas", "Norbert", "Olaf", "Patrick", "Paul", "Peter",
  "Philipp", "Ralf", "René", "Robert", "Sebastian", "Silvio", "Steffen", "Sven",
  "Thomas", "Tino", "Tobias", "Torsten", "Uwe", "Volker",
] as const;
const VORNAMEN_W = [
  "Anja", "Anke", "Annett", "Antje", "Beate", "Carola", "Christin", "Claudia",
  "Doreen", "Franziska", "Grit", "Heike", "Ines", "Jana", "Josephine", "Katrin",
  "Kerstin", "Kristin", "Lea", "Lisa", "Manuela", "Maria", "Marlen", "Nadine",
  "Nicole", "Peggy", "Sabine", "Sandra", "Sarah", "Silke", "Simone", "Steffi",
  "Susann", "Ulrike", "Yvonne",
] as const;
const NACHNAMEN = [
  "Barthel", "Bauer", "Becker", "Beier", "Bergmann", "Böhme", "Bräutigam", "Clauß",
  "Dietze", "Döring", "Eckert", "Ehrlich", "Fiedler", "Fischer", "Franke", "Fritzsche",
  "Gläser", "Göbel", "Grimm", "Günther", "Haase", "Hähnel", "Hartmann", "Heinrich",
  "Hempel", "Hentschel", "Herrmann", "Hofmann", "Jentzsch", "Kaiser", "Keller", "Kirchner",
  "Klemm", "Köhler", "Krause", "Kretzschmar", "Kühn", "Lange", "Lehmann", "Liebig",
  "Löffler", "Meißner", "Müller", "Naumann", "Neubert", "Nitzsche", "Oertel", "Petzold",
  "Pfeifer", "Richter", "Riedel", "Röder", "Rudolph", "Scheibe", "Schmidt", "Schneider",
  "Scholz", "Schreiber", "Schubert", "Schulze", "Seidel", "Seifert", "Sommer", "Starke",
  "Steglich", "Uhlig", "Vogel", "Voigt", "Wagner", "Walther", "Weber", "Weiß",
  "Werner", "Winkler", "Wolf", "Zimmermann",
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

// ---------------------------------------------------------- Sachsen: Orte

interface SnOrt {
  ort: string;
  kreis: string; // Landkreis bzw. Kreisfreie Stadt (untere Katastrophenschutzbehörde)
  kfz: string;
}

/** Standorte quer durch die zehn Landkreise und drei Kreisfreien Städte. */
const SN_ORTE: SnOrt[] = [
  { ort: "Bautzen", kreis: "Landkreis Bautzen", kfz: "BZ" },
  { ort: "Hoyerswerda", kreis: "Landkreis Bautzen", kfz: "HY" },
  { ort: "Kamenz", kreis: "Landkreis Bautzen", kfz: "KM" },
  { ort: "Bischofswerda", kreis: "Landkreis Bautzen", kfz: "BZ" },
  { ort: "Chemnitz", kreis: "Stadt Chemnitz", kfz: "C" },
  { ort: "Dresden", kreis: "Landeshauptstadt Dresden", kfz: "DD" },
  { ort: "Annaberg-Buchholz", kreis: "Erzgebirgskreis", kfz: "ANA" },
  { ort: "Aue-Bad Schlema", kreis: "Erzgebirgskreis", kfz: "ASZ" },
  { ort: "Marienberg", kreis: "Erzgebirgskreis", kfz: "MEK" },
  { ort: "Stollberg", kreis: "Erzgebirgskreis", kfz: "STL" },
  { ort: "Görlitz", kreis: "Landkreis Görlitz", kfz: "GR" },
  { ort: "Zittau", kreis: "Landkreis Görlitz", kfz: "ZI" },
  { ort: "Niesky", kreis: "Landkreis Görlitz", kfz: "NY" },
  { ort: "Weißwasser", kreis: "Landkreis Görlitz", kfz: "WSW" },
  { ort: "Leipzig", kreis: "Stadt Leipzig", kfz: "L" },
  { ort: "Borna", kreis: "Landkreis Leipzig", kfz: "BNA" },
  { ort: "Grimma", kreis: "Landkreis Leipzig", kfz: "GHA" },
  { ort: "Wurzen", kreis: "Landkreis Leipzig", kfz: "WUR" },
  { ort: "Meißen", kreis: "Landkreis Meißen", kfz: "MEI" },
  { ort: "Riesa", kreis: "Landkreis Meißen", kfz: "RIE" },
  { ort: "Großenhain", kreis: "Landkreis Meißen", kfz: "GRH" },
  { ort: "Freiberg", kreis: "Landkreis Mittelsachsen", kfz: "FG" },
  { ort: "Döbeln", kreis: "Landkreis Mittelsachsen", kfz: "DL" },
  { ort: "Mittweida", kreis: "Landkreis Mittelsachsen", kfz: "MW" },
  { ort: "Hainichen", kreis: "Landkreis Mittelsachsen", kfz: "HC" },
  { ort: "Torgau", kreis: "Landkreis Nordsachsen", kfz: "TDO" },
  { ort: "Oschatz", kreis: "Landkreis Nordsachsen", kfz: "OZ" },
  { ort: "Eilenburg", kreis: "Landkreis Nordsachsen", kfz: "EB" },
  { ort: "Delitzsch", kreis: "Landkreis Nordsachsen", kfz: "DZ" },
  { ort: "Pirna", kreis: "Landkreis Sächsische Schweiz-Osterzgebirge", kfz: "PIR" },
  { ort: "Freital", kreis: "Landkreis Sächsische Schweiz-Osterzgebirge", kfz: "FTL" },
  { ort: "Dippoldiswalde", kreis: "Landkreis Sächsische Schweiz-Osterzgebirge", kfz: "DW" },
  { ort: "Sebnitz", kreis: "Landkreis Sächsische Schweiz-Osterzgebirge", kfz: "SEB" },
  { ort: "Plauen", kreis: "Vogtlandkreis", kfz: "PL" },
  { ort: "Auerbach", kreis: "Vogtlandkreis", kfz: "V" },
  { ort: "Reichenbach", kreis: "Vogtlandkreis", kfz: "RC" },
  { ort: "Zwickau", kreis: "Landkreis Zwickau", kfz: "Z" },
  { ort: "Glauchau", kreis: "Landkreis Zwickau", kfz: "GC" },
  { ort: "Werdau", kreis: "Landkreis Zwickau", kfz: "WDA" },
  { ort: "Hohenstein-Ernstthal", kreis: "Landkreis Zwickau", kfz: "HOT" },
];

// ------------------------------------------------------------------ Träger

interface Traeger {
  org: OrganisationsTyp;
  /** Funkruf-Kennwort nach Nr. 4.1 der Funkrufnamen-Richtlinie Sachsen. */
  kennwort: VokabularWert;
  organisationName: (o: SnOrt) => string;
  ebene: (o: SnOrt) => HierarchieEbene[];
}

/** FUNKRUF_KENNWOERTER-Codes (src/vokabulare/thw.ts). */
const KW = { FLORIAN: 2, ROTKREUZ: 3, AKKON: 4, JOHANNES: 5, SAMA: 6, PELIKAN: 7 } as const;

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
      {
        bezeichnung: { freitext: `${kurz}-Kreisverband` },
        name: o.kreis.replace(/^(Landkreis|Stadt|Landeshauptstadt)\s+/, ""),
      },
      { bezeichnung: { freitext: "Untere KatS-Behörde" }, name: o.kreis },
    ],
  };
}
const drk = hiorg(OrganisationsTyp.DRK, { code: KW.ROTKREUZ }, "DRK", "Deutsches Rotes Kreuz");
const juh = hiorg(OrganisationsTyp.JUH, { code: KW.AKKON }, "JUH", "Johanniter-Unfall-Hilfe");
const mhd = hiorg(OrganisationsTyp.MHD, { code: KW.JOHANNES }, "MHD", "Malteser Hilfsdienst");
const asb = hiorg(OrganisationsTyp.ASB, { code: KW.SAMA }, "ASB", "Arbeiter-Samariter-Bund");
const dlrg = hiorg(OrganisationsTyp.DLRG, { code: KW.PELIKAN }, "DLRG", "DLRG");

// Die Bergwacht Sachsen ist Teil des DRK, führt aber das eigene Kennwort
// „Bergwacht" (Nr. 4.1). Rettungshundestaffeln ohne Hilfsorganisation führen
// nach Erlass vom 14. Juni 2012 das Kennwort „Antonius". Beide stehen nicht im
// Code-Vokabular und werden deshalb als Freitext geführt.
const bergwacht: Traeger = {
  org: OrganisationsTyp.DRK,
  kennwort: { freitext: "Bergwacht" },
  organisationName: (o) => `Bergwacht Sachsen (DRK) — ${o.kreis}`,
  ebene: (o) => [
    { bezeichnung: { freitext: "Bergwacht-Bereitschaft" }, name: o.ort },
    { bezeichnung: { freitext: "Untere KatS-Behörde" }, name: o.kreis },
  ],
};
const rettungshunde: Traeger = {
  org: OrganisationsTyp.SONSTIGE,
  kennwort: { freitext: "Antonius" },
  organisationName: (o) => `Rettungshundestaffel ${o.kreis.replace(/^(Landkreis|Stadt|Landeshauptstadt)\s+/, "")}`,
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
  if (/^(TLF|Dekon-LKW|LKW-Log|SW-KatS|LF 20|LF-KatS)/.test(kurz)) return 120;
  if (/^(LF |GW|RW|Tauch-GKW|Messleitfahrzeug|FKH)/.test(kurz)) return 70;
  if (/^(MZF|ELW|KdoW|MTW|ABCErkKW|KTW)/.test(kurz)) return 45;
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
  lang?: string; // Klartext + Herkunft (Träger/Sachsen/Bund) für „Änderungen bzw. Sondergerät"
  anzahl?: number;
  ohneKennzeichen?: string; // Anhänger/Boote/Geräte statt Kfz-Kennzeichen
  /** Zweite Teilkennzahl (Benutzerkategorie) nach Nr. 4.3.2; fehlt = kein Funkrufname. */
  kennzahl?: number;
}

interface BogenSpec {
  fachdienst: string;
  quelle: string;
  /** Übergeordnete Einheit laut SächsKatSVO (für die README/Hierarchie). */
  verband: string;
  einheit: string;
  traeger: Traeger;
  personal: PlatzSpec[];
  fahrzeuge: FzSpec[];
  szenario: string; // {ort} wird ersetzt
  /**
   * Erste Teilkennzahl nach Nr. 4.3.1: erste Ziffer = Fachdienst der
   * betreibenden Organisation (1 Brandschutz, 4 Sanitätswesen, 7 Wasserrettung),
   * zweite Ziffer = Einheit/Standort (hier durchgängig 1).
   */
  ersteKennzahl: number;
  /** Sollstärke laut Verordnung als "F/U/M/Gesamt" — wird geprüft. */
  soll: [number, number, number, number];
  gemisch?: boolean;
}

const F = R.FUEHRER;
const U = R.UNTERFUEHRER;
const M = R.MANNSCHAFT;

const SPECS: BogenSpec[] = [
  // ============================================ ABC-Gefahrenabwehr (Anlage 1)
  {
    fachdienst: "ABC-Gefahrenabwehr",
    quelle: "SächsKatSVO Anlage 1",
    verband: "Gefahrgutzug (KatS-GGZ)",
    einheit: "Führungstrupp Gefahrgutzug",
    traeger: feuerwehr,
    personal: [
      { rolle: F, funktion: "Zugführer/-in" },
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Truppmann/Truppfrau", anzahl: 2 },
    ],
    fahrzeuge: [{ kurz: "MZF/ELW 1", kennzahl: 14, lang: "Mehrzweckfahrzeug/Einsatzleitwagen 1 (Träger)" }],
    szenario: "Gefahrgutunfall {ort} — Führung Gefahrgutzug",
    ersteKennzahl: 11,
    soll: [1, 1, 2, 4],
  },
  {
    fachdienst: "ABC-Gefahrenabwehr",
    quelle: "SächsKatSVO Anlage 1",
    verband: "Gefahrgutzug (KatS-GGZ)",
    einheit: "Löschgruppe Gefahrgutzug",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Truppmann/Truppfrau", anzahl: 8, quali: "Atemschutzgeräteträger" },
    ],
    fahrzeuge: [{ kurz: "LF 10/6", kennzahl: 42, lang: "Löschgruppenfahrzeug 10/6 (Freistaat Sachsen)" }],
    szenario: "Gefahrgutunfall {ort} — Brandschutz und Menschenrettung",
    ersteKennzahl: 11,
    soll: [0, 1, 8, 9],
  },
  {
    fachdienst: "ABC-Gefahrenabwehr",
    quelle: "SächsKatSVO Anlage 1",
    verband: "Gefahrgutzug (KatS-GGZ)",
    einheit: "Dekontaminationsstaffel",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Truppmann/Truppfrau", anzahl: 5, quali: "Dekontamination Personen" },
    ],
    fahrzeuge: [{ kurz: "Dekon-LKW P", kennzahl: 93, lang: "Dekontaminationslastkraftwagen Personen 2 (Bund)" }],
    szenario: "Gefahrgutunfall {ort} — Dekontamination von Personen",
    ersteKennzahl: 11,
    soll: [0, 1, 5, 6],
  },
  {
    fachdienst: "ABC-Gefahrenabwehr",
    quelle: "SächsKatSVO Anlage 1",
    verband: "Gefahrgutzug (KatS-GGZ)",
    einheit: "Gerätetrupp Gefahrgut",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Truppmann/Truppfrau", anzahl: 2, quali: "Atemschutzgeräteträger" },
    ],
    fahrzeuge: [{ kurz: "GW-G", kennzahl: 54, lang: "Gerätewagen Gefahrgut (Freistaat Sachsen)" }],
    szenario: "Gefahrgutunfall {ort} — Abdichten, Umfüllen, Sonderausstattung",
    ersteKennzahl: 11,
    soll: [0, 1, 2, 3],
  },
  {
    fachdienst: "ABC-Gefahrenabwehr",
    quelle: "SächsKatSVO Anlage 1",
    verband: "ABC-Erkundungszug (KatS-ABC-ErkZ)",
    einheit: "Führungstrupp ABC-Erkundungszug",
    traeger: feuerwehr,
    personal: [
      { rolle: F, funktion: "Zugführer/-in" },
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Truppmann/Truppfrau", anzahl: 2 },
    ],
    fahrzeuge: [{ kurz: "Messleitfahrzeug", kennzahl: 95, lang: "Messleitfahrzeug (Bund)" }],
    szenario: "Freisetzung Gefahrstoff {ort} — Führung ABC-Erkundungszug, Messleitung",
    ersteKennzahl: 11,
    soll: [1, 1, 2, 4],
  },
  {
    fachdienst: "ABC-Gefahrenabwehr",
    quelle: "SächsKatSVO Anlage 1",
    verband: "ABC-Erkundungszug (KatS-ABC-ErkZ)",
    einheit: "Mess- und Erkundungstrupp",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Truppmann/Truppfrau", anzahl: 3, quali: "ABC-Erkundung" },
    ],
    fahrzeuge: [{ kurz: "ABCErkKW", kennzahl: 91, lang: "ABC-Erkundungskraftwagen 2 (Bund)" }],
    szenario: "Freisetzung Gefahrstoff {ort} — Messen und Erkunden im Schadensgebiet",
    ersteKennzahl: 11,
    soll: [0, 1, 3, 4],
  },

  // ================================================== Brandschutz (Anlage 2)
  {
    fachdienst: "Brandschutz",
    quelle: "SächsKatSVO Anlage 2",
    verband: "Löschzug Retten (KatS-LZR)",
    einheit: "Führungstrupp Löschzug Retten",
    traeger: feuerwehr,
    personal: [
      { rolle: F, funktion: "Zugführer/-in" },
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Truppmann/Truppfrau", anzahl: 2 },
    ],
    fahrzeuge: [{ kurz: "MZF/ELW 1", kennzahl: 14, lang: "Mehrzweckfahrzeug/Einsatzleitwagen 1 (Träger)" }],
    szenario: "Gebäudeeinsturz {ort} — Führung Löschzug Retten",
    ersteKennzahl: 11,
    soll: [1, 1, 2, 4],
  },
  {
    fachdienst: "Brandschutz",
    quelle: "SächsKatSVO Anlage 2",
    verband: "Löschzug Retten (KatS-LZR)",
    einheit: "Löschgruppe Löschzug Retten",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Truppmann/Truppfrau", anzahl: 8, quali: "Atemschutzgeräteträger" },
    ],
    fahrzeuge: [{ kurz: "LF 10/6", kennzahl: 42, lang: "Löschgruppenfahrzeug 10/6 (Freistaat Sachsen)" }],
    szenario: "Gebäudeeinsturz {ort} — Menschenrettung und Brandbekämpfung",
    ersteKennzahl: 11,
    soll: [0, 1, 8, 9],
  },
  {
    fachdienst: "Brandschutz",
    quelle: "SächsKatSVO Anlage 2",
    verband: "Löschzug Retten (KatS-LZR)",
    einheit: "Rüsttrupp",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Truppmann/Truppfrau", anzahl: 2 },
    ],
    fahrzeuge: [{ kurz: "RW", kennzahl: 52, lang: "Rüstwagen (Freistaat Sachsen)" }],
    szenario: "Gebäudeeinsturz {ort} — technische Rettung, schweres Gerät",
    ersteKennzahl: 11,
    soll: [0, 1, 2, 3],
    gemisch: true,
  },
  {
    fachdienst: "Brandschutz",
    quelle: "SächsKatSVO Anlage 2",
    verband: "Löschzug Wasserversorgung (KatS-LZW)",
    einheit: "Führungstrupp Löschzug Wasserversorgung",
    traeger: feuerwehr,
    personal: [
      { rolle: F, funktion: "Zugführer/-in" },
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Truppmann/Truppfrau", anzahl: 2 },
    ],
    fahrzeuge: [{ kurz: "MZF/ELW 1", kennzahl: 14, lang: "Mehrzweckfahrzeug/Einsatzleitwagen 1 (Träger)" }],
    szenario: "Großbrand {ort} — Führung Löschzug Wasserversorgung",
    ersteKennzahl: 11,
    soll: [1, 1, 2, 4],
  },
  {
    fachdienst: "Brandschutz",
    quelle: "SächsKatSVO Anlage 2",
    verband: "Löschzug Wasserversorgung (KatS-LZW)",
    einheit: "Löschgruppe Löschzug Wasserversorgung",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Truppmann/Truppfrau", anzahl: 8, quali: "Atemschutzgeräteträger" },
    ],
    fahrzeuge: [{ kurz: "LF 20 KatS", kennzahl: 45, lang: "Löschgruppenfahrzeug für den Katastrophenschutz (Bund)" }],
    szenario: "Großbrand {ort} — Brandbekämpfung, Riegelstellung",
    ersteKennzahl: 11,
    soll: [0, 1, 8, 9],
  },
  {
    fachdienst: "Brandschutz",
    quelle: "SächsKatSVO Anlage 2",
    verband: "Löschzug Wasserversorgung (KatS-LZW)",
    einheit: "Schlauchtrupp",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Truppmann/Truppfrau", anzahl: 2 },
    ],
    fahrzeuge: [
      { kurz: "SW-KatS", kennzahl: 63, lang: "Schlauchwagen für den Katastrophenschutz (Bund)" },
      { kurz: "Schlauchanhänger", lang: "Schlauchanhänger (Freistaat Sachsen)", ohneKennzeichen: "Anh Schlauch" },
    ],
    szenario: "Großbrand {ort} — Aufbau lange Wegstrecke, Wasserförderung",
    ersteKennzahl: 11,
    soll: [0, 1, 2, 3],
  },
  {
    fachdienst: "Brandschutz",
    quelle: "SächsKatSVO Anlage 2",
    verband: "Löschzug Waldbrand (KatS-LZWb)",
    einheit: "Führungstrupp Löschzug Waldbrand",
    traeger: feuerwehr,
    personal: [
      { rolle: F, funktion: "Zugführer/-in" },
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Truppmann/Truppfrau", anzahl: 2 },
    ],
    fahrzeuge: [{ kurz: "KdoW", kennzahl: 10, lang: "Kommandowagen (Freistaat Sachsen)" }],
    szenario: "Waldbrand {ort} — Führung Löschzug Waldbrand",
    ersteKennzahl: 11,
    soll: [1, 1, 2, 4],
  },
  {
    fachdienst: "Brandschutz",
    quelle: "SächsKatSVO Anlage 2",
    verband: "Löschzug Waldbrand (KatS-LZWb)",
    einheit: "Löschtrupp Waldbrand",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Truppmann/Truppfrau", anzahl: 2 },
    ],
    fahrzeuge: [{ kurz: "TLF 20/40", kennzahl: 26, lang: "Tanklöschfahrzeug 20/40 (Freistaat Sachsen)" }],
    szenario: "Waldbrand {ort} — mobiler Löschangriff im Gelände",
    ersteKennzahl: 11,
    soll: [0, 1, 2, 3],
    gemisch: true,
  },

  // ======================== Sanitätswesen und Betreuung — Einsatzzug (Anlage 3)
  {
    fachdienst: "Sanitätswesen und Betreuung",
    quelle: "SächsKatSVO Anlage 3",
    verband: "Einsatzzug (KatS-EZ)",
    einheit: "Führungstrupp Einsatzzug",
    traeger: juh,
    personal: [
      { rolle: F, funktion: "Zugführer/-in" },
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Helfer/-in" },
    ],
    fahrzeuge: [{ kurz: "MZF/ELW 1", kennzahl: 14, lang: "Mehrzweckfahrzeug/Einsatzleitwagen 1 (Träger)" }],
    szenario: "MANV {ort} — Führung Einsatzzug Sanitätswesen und Betreuung",
    ersteKennzahl: 41,
    soll: [1, 1, 1, 3],
  },
  {
    fachdienst: "Sanitätswesen und Betreuung",
    quelle: "SächsKatSVO Anlage 3",
    verband: "Einsatzzug (KatS-EZ)",
    einheit: "Sanitätsgruppe Einsatzzug",
    traeger: drk,
    personal: [
      { rolle: F, funktion: "Notärztin/Notarzt", quali: "Notarzt" },
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Rettungssanitäter/-in", anzahl: 2, quali: "Rettungssanitäter" },
      { rolle: M, funktion: "Helfer/-in", anzahl: 5 },
    ],
    fahrzeuge: [
      { kurz: "GW-San", kennzahl: 72, lang: "Gerätewagen Sanität (Freistaat Sachsen)" },
      { kurz: "MTW", kennzahl: 19, lang: "Mannschaftstransportkraftwagen (Freistaat Sachsen)" },
    ],
    szenario: "MANV {ort} — Sichtung und Behandlung an der Unfallhilfsstelle",
    ersteKennzahl: 41,
    soll: [1, 1, 7, 9],
  },
  {
    fachdienst: "Sanitätswesen und Betreuung",
    quelle: "SächsKatSVO Anlage 3",
    verband: "Einsatzzug (KatS-EZ)",
    einheit: "Transportstaffel Einsatzzug",
    traeger: asb,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Rettungssanitäter/-in", anzahl: 3, quali: "Rettungssanitäter" },
      { rolle: M, funktion: "Helfer/-in", anzahl: 2 },
    ],
    fahrzeuge: [
      { kurz: "KTW Typ B", kennzahl: 85, lang: "Notfallkrankenwagen Typ B (Bund)" },
      { kurz: "KTW Typ B", kennzahl: 85, lang: "Notfallkrankenwagen Typ B (Freistaat Sachsen)", anzahl: 2 },
    ],
    szenario: "MANV {ort} — Transport von Verletzten in Zielkliniken",
    ersteKennzahl: 41,
    soll: [0, 1, 5, 6],
  },
  {
    fachdienst: "Sanitätswesen und Betreuung",
    quelle: "SächsKatSVO Anlage 3",
    verband: "Einsatzzug (KatS-EZ)",
    einheit: "Betreuungsgruppe Einsatzzug",
    traeger: mhd,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Helfer/-in", anzahl: 10 },
    ],
    fahrzeuge: [
      { kurz: "MTW", kennzahl: 19, lang: "Mannschaftstransportkraftwagen (Träger)" },
      { kurz: "GW-Bt", kennzahl: 74, lang: "Gerätewagen Betreuung (Bund)" },
    ],
    szenario: "Evakuierung {ort} — Betreuung und Unterbringung Betroffener",
    ersteKennzahl: 41,
    soll: [0, 1, 10, 11],
  },
  {
    fachdienst: "Sanitätswesen und Betreuung",
    quelle: "SächsKatSVO Anlage 3",
    verband: "Einsatzzug (KatS-EZ)",
    einheit: "Verpflegungstrupp Einsatzzug",
    traeger: juh,
    personal: [{ rolle: M, funktion: "Helfer/-in (Verpflegung)", anzahl: 3, quali: "Koch (Beruf)" }],
    fahrzeuge: [
      { kurz: "GW-V", kennzahl: 74, lang: "Gerätewagen Versorgung (Freistaat Sachsen)" },
      { kurz: "FKH", lang: "Feldkochherd (Freistaat Sachsen)", ohneKennzeichen: "Anh FKH" },
      { kurz: "Kühlanhänger", lang: "Kühlanhänger (Freistaat Sachsen)", ohneKennzeichen: "Anh Kühl" },
    ],
    szenario: "Flächenlage {ort} — Verpflegung von Einsatzkräften und Betroffenen",
    ersteKennzahl: 41,
    soll: [0, 0, 3, 3],
  },

  // ============================ Medizinische Task Force (Anlage 3, Verband)
  {
    fachdienst: "Medizinische Task Force",
    quelle: "SächsKatSVO Anlage 3",
    verband: "Medizinische Task Force (MTF)",
    einheit: "Führungsstaffel MTF",
    traeger: feuerwehr,
    personal: [
      { rolle: F, funktion: "Verbandsführer/-in", anzahl: 2 },
      { rolle: F, funktion: "Zugführer/-in" },
      { rolle: U, funktion: "Gruppenführer/-in", anzahl: 2 },
      { rolle: M, funktion: "Helfer/-in" },
    ],
    fahrzeuge: [{ kurz: "KdoW", kennzahl: 10, lang: "Kommandowagen (Bund)" }],
    szenario: "Großschadenslage {ort} — Führung Medizinische Task Force",
    ersteKennzahl: 11,
    soll: [3, 2, 1, 6],
  },
  {
    fachdienst: "Medizinische Task Force",
    quelle: "SächsKatSVO Anlage 3",
    verband: "Medizinische Task Force (MTF)",
    einheit: "Behandlungszug 1 MTF",
    traeger: drk,
    personal: [
      { rolle: F, funktion: "Zugführer/-in" },
      { rolle: F, funktion: "Notärztin/Notarzt", anzahl: 3, quali: "Notarzt" },
      { rolle: U, funktion: "Gruppenführer/-in", anzahl: 3 },
      { rolle: M, funktion: "Rettungssanitäter/-in", anzahl: 5, quali: "Rettungssanitäter" },
      { rolle: M, funktion: "Helfer/-in", anzahl: 17 },
    ],
    fahrzeuge: [
      { kurz: "MTW", kennzahl: 19, lang: "Mannschaftstransportkraftwagen (Bund)" },
      { kurz: "GW-Beh", kennzahl: 89, lang: "Gerätewagen Behandlung (Bund)" },
      { kurz: "GW-San", kennzahl: 72, lang: "Gerätewagen Sanität (Bund)", anzahl: 3 },
    ],
    szenario: "Großschadenslage {ort} — Aufbau und Betrieb Behandlungsplatz",
    ersteKennzahl: 41,
    soll: [4, 3, 22, 29],
  },
  {
    fachdienst: "Medizinische Task Force",
    quelle: "SächsKatSVO Anlage 3",
    verband: "Medizinische Task Force (MTF)",
    einheit: "Behandlungszug 2 MTF",
    traeger: mhd,
    personal: [
      { rolle: F, funktion: "Zugführer/-in" },
      { rolle: F, funktion: "Notärztin/Notarzt", anzahl: 3, quali: "Notarzt" },
      { rolle: U, funktion: "Gruppenführer/-in", anzahl: 3 },
      { rolle: M, funktion: "Rettungssanitäter/-in", anzahl: 5, quali: "Rettungssanitäter" },
      { rolle: M, funktion: "Helfer/-in", anzahl: 21 },
    ],
    fahrzeuge: [
      { kurz: "MTW", kennzahl: 19, lang: "Mannschaftstransportkraftwagen (Bund)" },
      { kurz: "GW-San", kennzahl: 72, lang: "Gerätewagen Sanität (Bund)", anzahl: 4 },
    ],
    szenario: "Großschadenslage {ort} — zweiter Behandlungsplatz, Patientenablage",
    ersteKennzahl: 41,
    soll: [4, 3, 26, 33],
  },
  {
    fachdienst: "Medizinische Task Force",
    quelle: "SächsKatSVO Anlage 3",
    verband: "Medizinische Task Force (MTF)",
    einheit: "Zug Dekontamination Verletzter MTF",
    traeger: feuerwehr,
    personal: [
      { rolle: F, funktion: "Zugführer/-in" },
      { rolle: U, funktion: "Gruppenführer/-in", anzahl: 3 },
      { rolle: M, funktion: "Rettungssanitäter/-in", anzahl: 5, quali: "Rettungssanitäter" },
      { rolle: M, funktion: "Helfer/-in", anzahl: 15 },
    ],
    fahrzeuge: [
      { kurz: "MTW+", kennzahl: 19, lang: "Mannschaftstransportwagen MTF (Bund)" },
      { kurz: "Dekon-LKW P+", kennzahl: 93, lang: "Dekontaminationslastkraftwagen Personen 2+ (Bund)" },
      { kurz: "LF-KatS", kennzahl: 45, lang: "Löschgruppenfahrzeug KatS (Bund)" },
    ],
    szenario: "CBRN-Lage {ort} — Dekontamination Verletzter",
    ersteKennzahl: 11,
    soll: [1, 3, 20, 24],
  },
  {
    fachdienst: "Medizinische Task Force",
    quelle: "SächsKatSVO Anlage 3",
    verband: "Medizinische Task Force (MTF)",
    einheit: "Logistik- und Transportzug MTF",
    traeger: asb,
    personal: [
      { rolle: F, funktion: "Zugführer/-in" },
      { rolle: M, funktion: "Rettungssanitäter/-in", anzahl: 6, quali: "Rettungssanitäter" },
      { rolle: M, funktion: "Helfer/-in", anzahl: 11 },
    ],
    fahrzeuge: [
      { kurz: "LKW-Log Bt", kennzahl: 74, lang: "Lastkraftwagen Logistik/Betreuung (Bund)" },
      { kurz: "GW-V", kennzahl: 74, lang: "Gerätewagen Versorgung (Freistaat Sachsen)" },
      { kurz: "FKH", lang: "Feldkochherd (Freistaat Sachsen)", ohneKennzeichen: "Anh FKH" },
      { kurz: "Kühlanhänger", lang: "Kühlanhänger (Freistaat Sachsen)", ohneKennzeichen: "Anh Kühl" },
      { kurz: "KTW Typ B", kennzahl: 85, lang: "Notfallkrankenwagen Typ B (Bund)", anzahl: 6 },
    ],
    szenario: "Großschadenslage {ort} — Logistik, Verpflegung und Patiententransport",
    ersteKennzahl: 41,
    soll: [1, 0, 17, 18],
  },

  // ============================== Wasser-/Bergrettung, Rettungshunde (Anl. 4–6)
  {
    fachdienst: "Wasserrettung",
    quelle: "SächsKatSVO Anlage 4",
    verband: "Wasserrettungsgruppe (KatS-WRGr)",
    einheit: "Wasserrettungstrupp",
    traeger: drk,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Rettungsschwimmer/-in (davon ein/-e Bootsführer/-in)", anzahl: 4, quali: "Rettungsschwimmer" },
    ],
    fahrzeuge: [
      { kurz: "MTW", kennzahl: 19, lang: "Mannschaftstransportkraftwagen (Freistaat Sachsen)" },
      { kurz: "Motor-Rettungsboot", kennzahl: 79, lang: "Motor-Rettungsboot mit Trailer (Freistaat Sachsen)", ohneKennzeichen: "auf Trailer" },
    ],
    szenario: "Hochwasser {ort} — Personenrettung aus dem Wasser, Bootsbetrieb",
    ersteKennzahl: 71,
    soll: [0, 1, 4, 5],
  },
  {
    fachdienst: "Wasserrettung",
    quelle: "SächsKatSVO Anlage 4",
    verband: "Wasserrettungsgruppe (KatS-WRGr)",
    einheit: "Taucheinsatztrupp",
    traeger: dlrg,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Rettungstaucher/-in (davon ein/-e Bootsführer/-in)", anzahl: 4, quali: "Rettungstaucher" },
    ],
    fahrzeuge: [
      { kurz: "Tauch-GKW", kennzahl: 58, lang: "Tauchgerätekraftwagen (Freistaat Sachsen)" },
      { kurz: "Motor-Rettungsboot", kennzahl: 79, lang: "Motor-Rettungsboot (Schlauchboot) mit Trailer (Freistaat Sachsen)", ohneKennzeichen: "auf Trailer" },
    ],
    szenario: "Vermisstensuche Gewässer {ort} — Tauchereinsatz",
    ersteKennzahl: 71,
    soll: [0, 1, 4, 5],
  },
  {
    fachdienst: "Bergrettung",
    quelle: "SächsKatSVO Anlage 5",
    verband: "Bergrettungsgruppe (KatS-BergRGr)",
    einheit: "Bergrettungsgruppe",
    traeger: bergwacht,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Bergretter/-in", anzahl: 7, quali: "Bergrettung / Höhenrettung" },
    ],
    fahrzeuge: [{ kurz: "MTW", kennzahl: 19, lang: "Mannschaftstransportkraftwagen mit bis zu 8 Sitzen (Träger)" }],
    szenario: "Bergunfall {ort} — Rettung aus Steilgelände",
    ersteKennzahl: 41,
    soll: [0, 1, 7, 8],
  },
  {
    fachdienst: "Rettungshunde",
    quelle: "SächsKatSVO Anlage 6",
    verband: "Rettungshundestaffel (KatS-RettHundSt)",
    einheit: "Rettungshundestaffel",
    traeger: rettungshunde,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Rettungshundeteam (Hundeführer/-in und Hund)", anzahl: 5, quali: "Rettungshundeführer" },
    ],
    fahrzeuge: [{
      kurz: "MTW",
      kennzahl: 19,
      lang: "Mannschaftstransportkraftwagen mit bis zu 8 Sitzen, Transportmöglichkeit für 5 Hunde (Träger)",
    }],
    szenario: "Vermisstensuche {ort} — Flächen- und Trümmersuche mit Rettungshunden",
    ersteKennzahl: 41,
    soll: [0, 1, 5, 6],
  },

  // ============================== Führungsgruppen und Funktrupp (Anl. 7–9)
  {
    fachdienst: "Führung",
    quelle: "SächsKatSVO Anlage 7",
    verband: "Führungsgruppe Brandschutz (FüGr BS)",
    einheit: "Führungsgruppe Brandschutz",
    traeger: feuerwehr,
    personal: [
      { rolle: F, funktion: "Verbandsführer/-in", anzahl: 3 },
      { rolle: M, funktion: "Truppmann/Truppfrau" },
    ],
    fahrzeuge: [{ kurz: "MZF/ELW 1", kennzahl: 14, lang: "Mehrzweckfahrzeug/Einsatzleitwagen 1 (Freistaat Sachsen)" }],
    szenario: "Flächenlage {ort} — Führungsunterstützung Brandschutz",
    ersteKennzahl: 11,
    soll: [3, 0, 1, 4],
  },
  {
    fachdienst: "Führung",
    quelle: "SächsKatSVO Anlage 8",
    verband: "Führungsgruppe Sanitätswesen und Betreuung (FüGr San/Bt)",
    einheit: "Führungsgruppe Sanitätswesen und Betreuung",
    traeger: drk,
    personal: [
      { rolle: F, funktion: "Verbandsführer/-in", anzahl: 3 },
      { rolle: M, funktion: "Helfer/-in" },
    ],
    fahrzeuge: [{ kurz: "MZF/ELW 1", kennzahl: 14, lang: "Mehrzweckfahrzeug/Einsatzleitwagen 1 (Freistaat Sachsen)" }],
    szenario: "MANV {ort} — Führungsunterstützung Sanitätswesen und Betreuung",
    ersteKennzahl: 41,
    soll: [3, 0, 1, 4],
  },
  {
    fachdienst: "Führung",
    quelle: "SächsKatSVO Anlage 9",
    verband: "Funktrupp (FuTr)",
    einheit: "Funktrupp",
    traeger: feuerwehr,
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Truppmann/Truppfrau", quali: "Sprechfunker" },
    ],
    fahrzeuge: [{ kurz: "ELW 2", kennzahl: 12, lang: "Einsatzleitwagen 2 (Freistaat Sachsen)" }],
    szenario: "Flächenlage {ort} — Fernmeldebetrieb und Führungsunterstützung",
    ersteKennzahl: 11,
    soll: [0, 1, 1, 2],
  },

  // ===================================== Schnell-Einsatz-Gruppe (Anlage 10)
  {
    fachdienst: "Schnell-Einsatz-Gruppe",
    quelle: "SächsKatSVO Anlage 10",
    verband: "Schnell-Einsatz-Gruppe (SEG)",
    einheit: "Sanitätsstaffel SEG",
    traeger: asb,
    personal: [
      { rolle: F, funktion: "Notärztin/Notarzt", quali: "Notarzt" },
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Rettungssanitäter/-in", anzahl: 2, quali: "Rettungssanitäter" },
      { rolle: M, funktion: "Helfer/-in", anzahl: 2 },
    ],
    fahrzeuge: [{ kurz: "GW-San", kennzahl: 72, lang: "Gerätewagen Sanität (Freistaat Sachsen)" }],
    szenario: "Schnelleinsatz {ort} — erste sanitätsdienstliche Versorgung",
    ersteKennzahl: 41,
    soll: [1, 1, 4, 6],
  },
  {
    fachdienst: "Schnell-Einsatz-Gruppe",
    quelle: "SächsKatSVO Anlage 10",
    verband: "Schnell-Einsatz-Gruppe (SEG)",
    einheit: "Sanitätstransportstaffel SEG",
    traeger: asb,
    personal: [
      { rolle: M, funktion: "Rettungssanitäter/-in", anzahl: 3, quali: "Rettungssanitäter" },
      { rolle: M, funktion: "Helfer/-in", anzahl: 3 },
    ],
    fahrzeuge: [
      { kurz: "KTW Typ B", kennzahl: 85, lang: "Notfallkrankenwagen Typ B (Bund)" },
      { kurz: "KTW Typ B", kennzahl: 85, lang: "Notfallkrankenwagen Typ B (Freistaat Sachsen)", anzahl: 2 },
    ],
    szenario: "Schnelleinsatz {ort} — Transport von Betroffenen",
    ersteKennzahl: 41,
    soll: [0, 0, 6, 6],
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

function fahrzeugeBauen(
  specs: FzSpec[],
  ort: SnOrt,
  traeger: Traeger,
  ersteKennzahl: number,
): Fahrzeug[] {
  // Dritte Teilkennzahl (Nr. 4.3.3): laufende Nummer je gleicher zweiter
  // Teilkennzahl; die „1" wird auch bei nur einem Fahrzeug geführt.
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
          // Orts-/Bereichsbezeichnung der Fahrzeuge ist der Standort (Gemeinde);
          // einheit.name trägt genau diesen Ort.
          eigenerStandort: true,
          teile: [ersteKennzahl, s.kennzahl, lfd],
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
  ort: SnOrt;
  fachdienst: string;
  verband: string;
  quelle: string;
}

function bogenBauen(spec: BogenSpec, ort: SnOrt): BeispielBogen {
  const personal = personalBauen(spec.personal);
  const fahrzeuge = fahrzeugeBauen(spec.fahrzeuge, ort, spec.traeger, spec.ersteKennzahl);

  const hierarchie: HierarchieEbene[] = [
    { bezeichnung: { freitext: spec.verband }, name: ort.ort },
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
    sonstiges: `Teileinheit des Verbandes „${spec.verband}" nach ${spec.quelle}. `
      + "Die Verordnung sieht für diese Einheit eine Doppelbesetzung (Ablösung) vor; "
      + "der Bogen zeigt die einfache Sollstärke.",
  };

  return {
    datei: `${slug(spec.einheit)}-${slug(ort.ort)}`,
    bogen,
    ort,
    fachdienst: spec.fachdienst,
    verband: spec.verband,
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

/** Anhänger führen keinen Funkrufnamen — alles andere muss einen haben. */
const OHNE_FUNKRUFNAME = new Set(["FKH", "Kühlanhänger", "Schlauchanhänger"]);

/**
 * Selbstprüfung: Stärke gegen die SächsKatSVO, und jedes motorisierte Fahrzeug
 * trägt einen vollständigen Funkrufnamen (drei Teilkennzahlen).
 */
function pruefen(beispiele: BeispielBogen[]): void {
  const fehler: string[] = [];
  beispiele.forEach((b, i) => {
    const s = staerke(b.bogen);
    const [f, u, m, g] = SPECS[i]!.soll;
    if (s.fuehrer !== f || s.unterfuehrer !== u || s.mannschaft !== m || s.gesamt !== g) {
      fehler.push(
        `${b.datei}: Stärke ${s.fuehrer}/${s.unterfuehrer}/${s.mannschaft}/${s.gesamt} ≠ Soll ${f}/${u}/${m}/${g}`,
      );
    }
    for (const fz of b.bogen.fahrzeuge) {
      const kurz = fz.typ.freitext ?? "?";
      const anhaenger = OHNE_FUNKRUFNAME.has(kurz);
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

// Jede Teileinheit an einen anderen Standort in Sachsen setzen (deterministisch
// über die Landkreise gestreut).
const beispiele: BeispielBogen[] = SPECS.map((spec, i) =>
  bogenBauen(spec, SN_ORTE[(i * 11 + 5) % SN_ORTE.length]!),
);

pruefen(beispiele);

const ausgabe = join(wurzel, "examples", "katastrophenschutz", "sachsen");
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

const zeilen = beispiele.map((b) => {
  const s = staerke(b.bogen);
  return `| ${b.datei} | ${b.fachdienst} | ${b.verband} | ${b.bogen.einheit.einheitsTyp.freitext} | ${b.ort.ort} | ${b.ort.kreis} | ${s.fuehrer}/${s.unterfuehrer}/${s.mannschaft}/${s.gesamt} | ${b.bogen.fahrzeuge.length} | ${b.quelle} |`;
});
writeFileSync(
  join(ausgabe, "README.md"),
  `# Beispiel-Erfassungsbögen — Katastrophenschutz Sachsen

${beispiele.length} generierte Beispiel-Einheiten nach der Sächsischen
Katastrophenschutzverordnung (SächsKatSVO, Anlagen 1–10) und der VwV
KatS-Einheiten. Abgebildet ist je kleinster selbstständiger Teileinheit ein
Bogen; die Züge, die Medizinische Task Force und die Schnell-Einsatz-Gruppe sind
in ihre Teileinheiten zerlegt.

Die Stärkeangaben der SächsKatSVO lauten „ZFü/GrFü/Mannschaft/Gesamt" (bei
Führungsgruppen und MTF zusätzlich mit Verbandsführer) und bilden exakt die
Führer/Unterführer/Mannschaft-Systematik des Bogens ab; Notärzte führt die
Verordnung in der ZFü-Spalte, sie zählen hier deshalb als Führer. Die in der
Verordnung in Klammern angegebene **Doppelbesetzung** (Ablösung) ist nicht
abgebildet — die Bögen zeigen die einfache Sollstärke. Jede erzeugte Stärke wird
beim Generieren gegen die Verordnung geprüft.

Alle Personen, Standort-Zuordnungen und Kennzeichen sind **fiktiv**.

Die **Funkrufnamen** folgen der Funkrufnamen-Richtlinie des SMI vom 2. September
1998, ergänzt durch die Erlasse vom 14. Juni 2012 (Anpassung an neue
Feuerwehrfahrzeugnormen und Katastrophenschutzeinheiten — mit einer
Beispiel-Anlage je KatS-Einheit) und vom 30. Juli 2020 (LF-KatS = 45, RW = 52):

> \`<Kennwort> <Ort> <erste>/<zweite>/<dritte> Teilkennzahl\`

* **Kennwort** nach Nr. 4.1 je Trägerorganisation — Feuerwehr „Florian", DRK
  „Rotkreuz", JUH „Akkon", MHD „Johannes", ASB „Sama", DLRG „Pelikan", dazu
  „Bergwacht" für die Bergrettung und „Antonius" für Rettungshundestaffeln, die
  keiner Hilfsorganisation angehören.
* **Orts-/Bereichsbezeichnung** ist bei Fahrzeugen der Standort (Gemeinde); die
  Landkreisbezeichnung mit dem Kennwort „Kater" gilt nur für die
  funktionsbezogenen Kennungen der Zug- und Verbandsführer (Nr. 4.4) und ist
  hier nicht abgebildet.
* **Erste Teilkennzahl** (Nr. 4.3.1): erste Ziffer = Fachdienst der betreibenden
  Organisation (1 Brandschutz, 4 Sanitätswesen, 7 Wasserrettung), zweite Ziffer =
  Einheit/Standort (hier durchgängig 1).
* **Zweite Teilkennzahl** (Nr. 4.3.2) = Fahrzeugtyp, **dritte Teilkennzahl**
  (Nr. 4.3.3) = laufende Nummer; die „1" wird auch bei nur einem Fahrzeug
  geführt. Anhänger (Feldkochherd, Kühl- und Schlauchanhänger) führen keinen
  Funkrufnamen.

Weil die Träger der Beispiel-Anlage 2012 entnommen sind, sind die Einheiten
**trägergemischt**: ein Einsatzzug verteilt sich etwa auf JUH (Führungstrupp),
DRK (Sanitätsgruppe), ASB (Transportstaffel) und MHD (Betreuungsgruppe).

## Hinweis zur Medizinischen Task Force

Die Kopfzeile der Anlage 3 gibt für die MTF die Mannschaftsstärke
**2/11/17/80/110** an (VFü/ZFü/GrFü/Mannschaft/Gesamt). Die Summe der
Besetzungsspalten der zugehörigen Tabellenzeilen ergibt dagegen
**2/11/11/86/110**: Verbandsführer, Zugführer und Gesamtstärke stimmen überein,
die Aufteilung zwischen Gruppenführern (11 statt 17) und Mannschaft (86 statt 80)
weicht um sechs Personen ab. Die Bögen folgen den **Tabellenzeilen**, weil nur
diese die Zuordnung zu den einzelnen Fahrzeugen und damit zu den Teileinheiten
festlegen. Für die übrigen Einheiten — auch den Einsatzzug (2/4/26/32) — stimmen
Kopfzeile und Tabellensumme exakt überein.

Neu erzeugen mit: \`npm run beispiele:kats-sn\` (deterministisch, fester Zufalls-Seed).

| Datei | Fachdienst | Verband | Teileinheit | Ort | Untere KatS-Behörde | Stärke | Fz | Quelle |
|---|---|---|---|---|---|---|---|---|
${zeilen.join("\n")}
`,
);

console.log(`Fertig: ${beispiele.length} Beispielbögen in examples/katastrophenschutz/sachsen/ (+ README.md)`);
console.log(`Segmentierte QR: ${segmentierte}`);
const jeFd = new Map<string, number>();
for (const b of beispiele) jeFd.set(b.fachdienst, (jeFd.get(b.fachdienst) ?? 0) + 1);
for (const [fd, n] of [...jeFd.entries()].sort()) console.log(`  ${fd}: ${n}`);
