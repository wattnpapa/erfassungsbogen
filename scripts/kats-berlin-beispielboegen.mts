/**
 * Erzeugt Beispiel-Erfassungsbögen der Katastrophenschutzeinheiten des Landes
 * Berlin als JSON nach examples/katastrophenschutz/berlin/.
 * Abgelegt ist nur das Bogen-JSON; die PDF entsteht erst beim Anklicken in der
 * App aus dem aktuellen Layout.
 *
 * Aufruf (Node ≥ 22): npm run beispiele:kats-be
 *
 * Grundlage ist die Berliner Verordnung über den Katastrophenschutzdienst
 * (KatSD-VO vom 20. Dezember 2001, GVBl. Nr. 1/2002 S. 1, zuletzt geändert
 * durch Verordnung vom 07.11.2011, GVBl. S. 532) mit ihrer Anlage zu § 8
 * „Gesamtstärke der Einheiten des Katastrophenschutzdienstes". Volltext per
 *   curl -sL -A "Mozilla/5.0" "https://www.umwelt-online.de/regelwerk/cgi-bin/suchausgabe.cgi?pfad=/anlasi/sicher/bln/katsdvo.htm&such=verwaltende"
 * geladen und die HTML-Tabellen verbatim ausgewertet (nicht nur eine
 * WebFetch-Zusammenfassung).
 *
 * WIE DIE ANLAGE AUFGEBAUT IST: Anders als Thüringen/Sachsen/Niedersachsen
 * kennt Berlin keine Landkreise und keine benannten Verbände (Bereitschaften,
 * Züge) mit fester Stückzahl je Kreis. Die Anlage listet stattdessen je
 * Fachdienst (ABC-Dienst, Betreuungsdienst, Brandschutzdienst, Sanitätsdienst)
 * eine LANDESWEITE Gesamtzahl an Fahrzeugen je Teileinheiten-Typ (Spalte
 * „Soll") sowie die daraus resultierende Helferstärke bei doppelter
 * Besetzung (Spalte „Soll Gesamt"). Für den Betreuungsdienst gilt das für
 * sieben Betreuungsplätze 500 (BTP 500) im Land, für den Sanitätsdienst für
 * sieben Behandlungsplätze 25 (BHP 25) und die zugehörigen sieben
 * Patiententransportzüge 10 (PTZ 10). Die Zahlen wurden verifiziert: pro
 * Fahrzeug ergibt (Personal der einfachen Besetzung × 2 [doppelte Besetzung])
 * exakt die „Soll Gesamt"-Spalte, und die Fachdienst-Summen ergeben exakt die
 * „Insgesamt"-Zeile (267 Fahrzeuge / 2.392 Helfer bei doppelter Besetzung).
 *
 * MODELLIERUNGSENTSCHEIDUNG: Jeder Bogen bildet EINE Instanz einer
 * Teileinheit mit EINFACHER Besetzung ab (eine Schicht/Besatzung), nicht die
 * doppelte Besetzung der Anlage — genau wie ein Fahrzeug im echten Einsatz
 * eine Besatzung hat, auch wenn die Alarmierungsplanung eine zweite Schicht
 * vorhält. Die Selbstprüfung rechnet das Personal jedes Bogens auf die
 * landesweite Instanzenzahl der Teileinheit hoch (× 2 × Instanzen) und
 * vergleicht mit „Soll Gesamt" der Anlage sowie die Fahrzeugzahl je Instanz
 * × Instanzen mit der Spalte „Soll" (siehe Spalte „Instanzen" in der README).
 *
 * TRÄGER: § 2 Absatz 1 KatSG Berlin nennt als Träger die Berliner Feuerwehr,
 * die Berliner Polizei sowie anerkannte private Hilfsorganisationen; die
 * KatSD-VO-Anlage weist Träger nur für den Brandschutzdienst ausdrücklich aus
 * (Fußnote 2: „Die Fahrzeuge sind den Freiwilligen Feuerwehren zugeordnet" —
 * deckungsgleich mit der BBK-Meldung von 2023 über zehn KatS-Fahrzeuge für die
 * Berliner Freiwilligen Feuerwehren). Für ABC-Dienst, Betreuungsdienst und
 * Sanitätsdienst nennt die Verordnung keinen Träger je Teileinheit; hier
 * gewählt: ABC-Dienst als Regieeinheit der Berliner Feuerwehr (ABC-Erkundung
 * ist dort angesiedelte Fachkompetenz), Sanitätsdienst (BHP 25/PTZ 10) beim
 * DRK (die einzige mit dieser Quellenlage belegbare Trägerschaft — der
 * Kreisverband Berlin-Nordost betreibt nachweislich einen BHP 25), und
 * Betreuungsdienst über ASB, JUH, MHD und DLRG gestreut, um die Bandbreite der
 * mitwirkenden Hilfsorganisationen zu zeigen. Das ist eine redaktionelle
 * Annahme, keine Verordnungsvorgabe, und im README sowie im Feld „Sonstiges"
 * jedes Bogens vermerkt.
 *
 * FUNKRUFNAMEN: Berlin führt — anders als die übrigen bisher abgebildeten
 * Länder — KEINE OPTA-Kennzahlen. Der Funkkennziffernvergleich der
 * Bundesländer (https://fwthwrd.wordpress.com/2020/09/14/funkrufnamen-der-bundeslander/,
 * Spalte Berlin, alle Kennziffern 00–99) nennt für Berlin durchgängig:
 * „Klartextbezeichnung des Fahrzeugs gefolgt von Wachennummer" — also
 * Fahrzeugtyp im Klartext plus eine Wachennummer, ohne Kennzahlenschema.
 * Das App-Datenmodell verlangt für jeden Funkrufnamen ein Kennwort und
 * numerische „teile" (siehe Funkrufname in src/model.ts); eine reine
 * Klartext-Kennung lässt sich darin nicht verlustfrei abbilden. Genähert wird
 * daher mit
 *   „<Kennwort der Trägerorganisation> <Bezirk> <Wachennummer>"
 * — der Fahrzeugtyp steht ohnehin im Feld „Typ" jedes Fahrzeugs auf dem Bogen,
 * die Wachennummern sind vierstellig fiktiv angelehnt an das reale
 * Nummernschema der Berliner Feuerwehr (z. B. „12xx" für Friedrichshain, siehe
 * Forum-Beispiel „NAW 1205"). Kennwort je Trägerorganisation: Feuerwehr
 * „Florian", DRK „Rotkreuz", ASB „Sama", JUH „Akkon", MHD „Johannes".
 *
 * Fiktiv sind alle Personen, Standort-/Bezirks-Zuordnungen, Wachennummern und
 * Kennzeichen.
 *
 * Am Ende läuft eine Selbstprüfung (Personalstärke je Teileinheit gegen die
 * Anlage, vollständiger Funkrufname je motorisiertem Fahrzeug, QR-Roundtrip);
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
const rnd = prng(20111107); // Datum der letzten KatSD-VO-Änderung
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
  "Falk", "Frank", "Gunnar", "Hendrik", "Jan", "Jens", "Jörg", "Karsten",
  "Kay", "Lars", "Lukas", "Maik", "Marco", "Mario", "Markus", "Martin",
  "Matthias", "Michael", "Nico", "Norbert", "Olaf", "Patrick", "Paul", "Peter",
  "Philipp", "Ralf", "René", "Robert", "Sebastian", "Steffen", "Sven", "Thomas",
  "Tobias", "Torsten", "Uwe", "Volker", "Axel", "Benjamin", "Carsten", "Enrico",
] as const;
const VORNAMEN_W = [
  "Anja", "Anke", "Antje", "Beate", "Bettina", "Bianca", "Carola", "Christin",
  "Claudia", "Cornelia", "Doreen", "Franziska", "Grit", "Heike", "Ines", "Jana",
  "Josephine", "Katrin", "Kerstin", "Kristin", "Lea", "Lisa", "Manuela", "Mandy",
  "Maria", "Nadine", "Nicole", "Peggy", "Ramona", "Sabine", "Sandra", "Sarah",
  "Silke", "Simone", "Steffi", "Susann", "Ulrike", "Yvonne", "Diana", "Susanne",
] as const;
const NACHNAMEN = [
  "Bandelow", "Bauer", "Becker", "Below", "Bergmann", "Bethke", "Böhm", "Brandt",
  "Buchholz", "Dallmann", "Dittrich", "Domke", "Draheim", "Ebert", "Eichler", "Engelmann",
  "Fiedler", "Fischer", "Franke", "Gerhardt", "Giese", "Görlitz", "Grabow", "Grimm",
  "Günther", "Haase", "Hagen", "Hartmann", "Heinrich", "Hempel", "Hennig", "Herrmann",
  "Hoffmann", "Jahnke", "Kaiser", "Keller", "Kirchner", "Klemm", "Köhler", "Krause",
  "Kruse", "Kühn", "Lange", "Lehmann", "Lindner", "Löffler", "Lorenz", "Marquardt",
  "Meißner", "Müller", "Naumann", "Neumann", "Nitsche", "Noack", "Pätzold", "Pieper",
  "Pohl", "Radtke", "Reimann", "Richter", "Riedel", "Röhl", "Schmidt", "Schneider",
  "Scholz", "Schulz", "Schulze", "Seidel", "Sommer", "Stein", "Thiele", "Ulrich",
  "Vogel", "Voigt", "Wagner", "Weber", "Wegner", "Wenzel", "Werner", "Winkler",
  "Wolf", "Zander", "Zimmermann",
] as const;

/** Externe/Berufs-Qualifikationen (Freitext) — gelegentlich gestreut. */
const QUALI_POOL = [
  "Berufskraftfahrer (Beruf)",
  "Rettungssanitäter (extern)",
  "Elektrofachkraft (Beruf)",
  "Koch (Beruf)",
  "Gesundheits- und Krankenpfleger (Beruf)",
  "Atemschutzgeräteträger",
  "Sprechfunker",
  "Kraftfahrer für Krankentransport",
] as const;

// -------------------------------------------------------------- Berlin: Orte

interface BeOrt {
  /** Berliner Bezirk. */
  bezirk: string;
  /**
   * Vierstellige Wachennummer (fiktiv, an das reale Berliner-Feuerwehr-Schema
   * angelehnt, siehe Skriptkopf). Dient als einzige Kennzahl im Funkrufnamen.
   */
  wache: number;
}

/** Ein Standort je Teileinheit, quer durch die Berliner Bezirke gestreut. */
const BE_ORTE: Record<string, BeOrt> = {
  mitte: { bezirk: "Mitte", wache: 1100 },
  friedrichshainKreuzberg: { bezirk: "Friedrichshain-Kreuzberg", wache: 1200 },
  pankow: { bezirk: "Pankow", wache: 1300 },
  charlottenburgWilmersdorf: { bezirk: "Charlottenburg-Wilmersdorf", wache: 1400 },
  spandau: { bezirk: "Spandau", wache: 1500 },
  steglitzZehlendorf: { bezirk: "Steglitz-Zehlendorf", wache: 1600 },
  tempelhofSchoeneberg: { bezirk: "Tempelhof-Schöneberg", wache: 1700 },
  neukoelln: { bezirk: "Neukölln", wache: 1800 },
  treptowKoepenick: { bezirk: "Treptow-Köpenick", wache: 1900 },
  marzahnHellersdorf: { bezirk: "Marzahn-Hellersdorf", wache: 2000 },
  lichtenberg: { bezirk: "Lichtenberg", wache: 2100 },
  reinickendorf: { bezirk: "Reinickendorf", wache: 2200 },
};
const ORT_SCHLUESSEL = Object.keys(BE_ORTE) as (keyof typeof BE_ORTE)[];

// ------------------------------------------------------------------ Träger

interface Traeger {
  org: OrganisationsTyp;
  /** Funkruf-Kennwort der Trägerorganisation. */
  kennwort: VokabularWert;
  organisationName: (o: BeOrt) => string;
  ebene: (o: BeOrt) => HierarchieEbene[];
}

/** FUNKRUF_KENNWOERTER-Codes (src/vokabulare/thw.ts). */
const KW = { FLORIAN: 2, ROTKREUZ: 3, AKKON: 4, JOHANNES: 5, SAMA: 6 } as const;

const feuerwehr: Traeger = {
  org: OrganisationsTyp.FEUERWEHR,
  kennwort: { code: KW.FLORIAN },
  organisationName: () => "Berliner Feuerwehr",
  ebene: (o) => [{ bezeichnung: { freitext: "Bezirk" }, name: o.bezirk }],
};

/** Mitwirkende Hilfsorganisation nach § 2 Absatz 1 KatSG Berlin. */
function hiorg(org: OrganisationsTyp, kennwort: VokabularWert, kurz: string, lang: string): Traeger {
  return {
    org,
    kennwort,
    organisationName: () => `${lang} Berlin`,
    ebene: (o) => [
      { bezeichnung: { freitext: `${kurz}-Kreisverband` }, name: o.bezirk },
      { bezeichnung: { freitext: "Landesverband" }, name: "Berlin" },
    ],
  };
}
const drk = hiorg(OrganisationsTyp.DRK, { code: KW.ROTKREUZ }, "DRK", "Deutsches Rotes Kreuz");
const asb = hiorg(OrganisationsTyp.ASB, { code: KW.SAMA }, "ASB", "Arbeiter-Samariter-Bund");
const juh = hiorg(OrganisationsTyp.JUH, { code: KW.AKKON }, "JUH", "Johanniter-Unfall-Hilfe");
const mhd = hiorg(OrganisationsTyp.MHD, { code: KW.JOHANNES }, "MHD", "Malteser Hilfsdienst");

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
  if (/^(LF KatS|SW KatS|Dekon Lkw|Lkw TeSi)/.test(kurz)) return 90;
  if (/^(GW |Bt-Lkw)/.test(kurz)) return 60;
  if (/^(KdoW|MTW|KTW|FKH|Bt-Kombi|MLK|ABC-ErkKW)/.test(kurz)) return 40;
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
  /** Kurzbezeichnung wie in der Anlage (Abkürzungsverzeichnis). */
  kurz: string;
  /** Klartext-Fahrzeugbezeichnung — steht so auf dem Funkrufname-Fahrzeugtyp. */
  lang: string;
  anzahl?: number;
}

interface BogenSpec {
  fachdienst: string;
  /** Fahrzeuggebundene Teileinheit nach der Anlage zu § 8 KatSD-VO. */
  einheit: string;
  verband: string; // "BHP 25", "PTZ 10", "BTP 500", "Feuerwehr-Bereitschaft" o. Ä.
  traeger: Traeger;
  ortSchluessel: keyof typeof BE_ORTE;
  personal: PlatzSpec[];
  fahrzeuge: FzSpec[];
  szenario: string; // {ort} wird ersetzt
  /** Personalstärke der einfachen Besetzung — wird gegen personal[] geprüft. */
  soll: [number, number, number, number]; // Führer/Unterführer/Mannschaft/Gesamt
  /** "Soll Gesamt" der Anlage (Helferstärke bei DOPPELTER Besetzung, landesweit für diesen Fahrzeugtyp). */
  sollGesamtDoppelt: number;
  /** Summe der "Soll"-Werte der Anlage über alle zu dieser Teileinheit gehörenden Fahrzeugzeilen, landesweit. */
  sollFahrzeuge: number;
  /** Landesweite Zahl der Instanzen dieser Teileinheit (z. B. 21 Sanitäts-Gruppen = 3 je BHP 25 × 7 BHP 25). */
  instanzen: number;
}

const F = R.FUEHRER;
const U = R.UNTERFUEHRER;
const M = R.MANNSCHAFT;

const QUELLE = "KatSD-VO Berlin, Anlage zu § 8";

const SPECS: BogenSpec[] = [
  // ================================================================ ABC-Dienst
  {
    fachdienst: "ABC-Dienst",
    einheit: "Messleitfahrzeug",
    verband: "ABC-Dienst (landesweit)",
    traeger: feuerwehr,
    ortSchluessel: "mitte",
    personal: [
      { rolle: F, funktion: "Führer/-in Messleitfahrzeug" },
      { rolle: M, funktion: "Kraftfahrer/-in", fe: FE.B },
      { rolle: M, funktion: "Helfer/-in Messtechnik", anzahl: 2 },
    ],
    fahrzeuge: [{ kurz: "MLK", lang: "Messleitfahrzeug (Messleitkomponente)" }],
    szenario: "ABC-Gefahrenlage {ort} — Messwerterfassung und Lagedarstellung",
    soll: [1, 0, 3, 4],
    sollGesamtDoppelt: 24,
    sollFahrzeuge: 3,
    instanzen: 3,
  },
  {
    fachdienst: "ABC-Dienst",
    einheit: "Erkundungs-Trupp",
    verband: "ABC-Dienst (landesweit)",
    traeger: feuerwehr,
    ortSchluessel: "friedrichshainKreuzberg",
    personal: [
      { rolle: U, funktion: "Truppführer/-in" },
      { rolle: M, funktion: "Kraftfahrer/-in", fe: FE.B },
      { rolle: M, funktion: "Helfer/-in Erkundung", anzahl: 2 },
    ],
    fahrzeuge: [{ kurz: "ABC-ErkKW", lang: "ABC-Erkundungskraftwagen" }],
    szenario: "ABC-Gefahrenlage {ort} — Erkunden, Spüren und Messen kontaminierter Bereiche",
    soll: [0, 1, 3, 4],
    sollGesamtDoppelt: 112,
    sollFahrzeuge: 14,
    instanzen: 14,
  },
  {
    fachdienst: "ABC-Dienst",
    einheit: "DekonP-Gruppe",
    verband: "ABC-Dienst (landesweit)",
    traeger: feuerwehr,
    ortSchluessel: "pankow",
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Kraftfahrer/-in", fe: FE.C },
      { rolle: M, funktion: "Helfer/-in Dekontamination", anzahl: 4 },
    ],
    fahrzeuge: [{ kurz: "Dekon Lkw P", lang: "Dekontaminationslastkraftwagen Personen" }],
    szenario: "ABC-Gefahrenlage {ort} — mobile Dekontamination von Einsatzkräften",
    soll: [0, 1, 5, 6],
    sollGesamtDoppelt: 108,
    sollFahrzeuge: 9,
    instanzen: 9,
  },
  {
    fachdienst: "ABC-Dienst",
    einheit: "DekonG-Gruppe",
    verband: "ABC-Dienst (landesweit)",
    traeger: feuerwehr,
    ortSchluessel: "charlottenburgWilmersdorf",
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Kraftfahrer/-in", fe: FE.C },
      { rolle: M, funktion: "Helfer/-in Dekontamination", anzahl: 4 },
    ],
    fahrzeuge: [{ kurz: "Dekon Lkw G", lang: "Dekontaminationslastkraftwagen Geräte" }],
    szenario: "ABC-Gefahrenlage {ort} — Dekontamination von Fahrzeugen und Großgerät",
    soll: [0, 1, 5, 6],
    sollGesamtDoppelt: 12,
    sollFahrzeuge: 1,
    instanzen: 1,
  },

  // =========================================================== Betreuungsdienst
  {
    fachdienst: "Betreuungsdienst",
    einheit: "Führungs-Trupp",
    verband: "Betreuungsplatz 500 (BTP 500)",
    traeger: asb,
    ortSchluessel: "spandau",
    personal: [
      { rolle: F, funktion: "Führer/-in" },
      { rolle: U, funktion: "Unterführer/-in" },
      { rolle: M, funktion: "Kraftfahrer/-in", fe: FE.C1 },
      { rolle: M, funktion: "Helfer/-in Führungsunterstützung", anzahl: 3 },
    ],
    fahrzeuge: [{ kurz: "KdoW", lang: "Kommandowagen" }],
    szenario: "Evakuierung {ort} — Führung eines Betreuungsplatzes 500",
    soll: [1, 1, 4, 6],
    sollGesamtDoppelt: 84,
    sollFahrzeuge: 7,
    instanzen: 7,
  },
  {
    fachdienst: "Betreuungsdienst",
    einheit: "Logistik-Gruppe",
    verband: "Betreuungsplatz 500 (BTP 500)",
    traeger: drk,
    ortSchluessel: "steglitzZehlendorf",
    personal: [
      { rolle: M, funktion: "Kraftfahrer/-in", fe: FE.B },
      { rolle: M, funktion: "Helfer/-in Logistik", anzahl: 2 },
    ],
    fahrzeuge: [{ kurz: "GW Log Bt", lang: "Gerätewagen Logistik/Betreuung" }],
    szenario: "Evakuierung {ort} — Materialnachschub für den Betreuungsplatz",
    soll: [0, 0, 3, 3],
    sollGesamtDoppelt: 42,
    sollFahrzeuge: 7,
    instanzen: 7,
  },
  {
    fachdienst: "Betreuungsdienst",
    einheit: "Betreuungs-Gruppe",
    verband: "Betreuungsplatz 500 (BTP 500)",
    traeger: juh,
    ortSchluessel: "tempelhofSchoeneberg",
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Kraftfahrer/-in", fe: FE.B },
      { rolle: M, funktion: "Betreuungshelfer/-in", anzahl: 4 },
    ],
    fahrzeuge: [{ kurz: "Bt-Kombi", lang: "Betreuungs-Kombi" }],
    szenario: "Evakuierung {ort} — Betreuen und Versorgen hilfsbedürftiger Personen",
    soll: [0, 1, 5, 6],
    sollGesamtDoppelt: 168,
    sollFahrzeuge: 14,
    instanzen: 14,
  },
  {
    fachdienst: "Betreuungsdienst",
    einheit: "Verpflegungs-Gruppe",
    verband: "Betreuungsplatz 500 (BTP 500)",
    traeger: mhd,
    ortSchluessel: "neukoelln",
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Kraftfahrer/-in", fe: FE.C1E },
      { rolle: M, funktion: "Feldkoch/-köchin", quali: "Koch (Beruf)" },
      { rolle: M, funktion: "Helfer/-in Verpflegung", anzahl: 6 },
    ],
    fahrzeuge: [
      { kurz: "GW Bt", lang: "Gerätewagen Betreuung" },
      { kurz: "FKH", lang: "Feldkochherd" },
    ],
    szenario: "Evakuierung {ort} — Verpflegung von Betroffenen und Einsatzkräften",
    soll: [0, 1, 8, 9],
    sollGesamtDoppelt: 252,
    sollFahrzeuge: 28,
    instanzen: 14,
  },
  {
    fachdienst: "Betreuungsdienst",
    einheit: "Transportgruppe",
    verband: "Betreuungsplatz 500 (BTP 500)",
    traeger: asb,
    ortSchluessel: "treptowKoepenick",
    personal: [
      { rolle: M, funktion: "Rettungssanitäter/-in", quali: "Rettungssanitäter" },
      { rolle: M, funktion: "Kraftfahrer/-in", fe: FE.C1 },
    ],
    fahrzeuge: [{ kurz: "KTW Typ B", lang: "Notfallkrankenwagen" }],
    szenario: "Evakuierung {ort} — Transport hilfsbedürftiger Personen",
    soll: [0, 0, 2, 2],
    sollGesamtDoppelt: 56,
    sollFahrzeuge: 14,
    instanzen: 14,
  },

  // ========================================================== Brandschutzdienst
  {
    fachdienst: "Brandschutzdienst",
    einheit: "Löschgruppe",
    verband: "Feuerwehr-Bereitschaft (FwB)",
    traeger: feuerwehr,
    ortSchluessel: "marzahnHellersdorf",
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Kraftfahrer/-in", fe: FE.C },
      { rolle: M, funktion: "Truppmann/Truppfrau", anzahl: 4, quali: "Atemschutzgeräteträger" },
    ],
    fahrzeuge: [{ kurz: "LF KatS", lang: "Löschfahrzeug Katastrophenschutz" }],
    szenario: "Großbrand {ort} — Brandbekämpfung durch die Feuerwehr-Bereitschaft",
    soll: [0, 1, 5, 6],
    sollGesamtDoppelt: 720,
    sollFahrzeuge: 60,
    instanzen: 60,
  },
  {
    fachdienst: "Brandschutzdienst",
    einheit: "Schlauchtrupp",
    verband: "Feuerwehr-Bereitschaft (FwB)",
    traeger: feuerwehr,
    ortSchluessel: "lichtenberg",
    personal: [
      { rolle: U, funktion: "Truppführer/-in" },
      { rolle: M, funktion: "Kraftfahrer/-in", fe: FE.C },
      { rolle: M, funktion: "Helfer/-in Schlauchtrupp" },
    ],
    fahrzeuge: [{ kurz: "SW KatS", lang: "Schlauchwagen Katastrophenschutz" }],
    szenario: "Großbrand {ort} — Löschwasserförderung über lange Wegstrecke",
    soll: [0, 1, 2, 3],
    sollGesamtDoppelt: 72,
    sollFahrzeuge: 12,
    instanzen: 12,
  },

  // ============================================================ Sanitätsdienst
  {
    fachdienst: "Sanitätsdienst",
    einheit: "Führungs-Trupp",
    verband: "Behandlungsplatz 25 (BHP 25)",
    traeger: drk,
    ortSchluessel: "reinickendorf",
    personal: [
      { rolle: F, funktion: "Führer/-in" },
      { rolle: U, funktion: "Unterführer/-in" },
      { rolle: M, funktion: "Kraftfahrer/-in", fe: FE.C1 },
      { rolle: M, funktion: "Helfer/-in Führungsunterstützung" },
    ],
    fahrzeuge: [{ kurz: "KdoW", lang: "Kommandowagen" }],
    szenario: "MANV {ort} — Führung eines Behandlungsplatzes 25",
    soll: [1, 1, 2, 4],
    sollGesamtDoppelt: 56,
    sollFahrzeuge: 7,
    instanzen: 7,
  },
  {
    fachdienst: "Sanitätsdienst",
    einheit: "Logistik-Trupp",
    verband: "Behandlungsplatz 25 (BHP 25)",
    traeger: drk,
    ortSchluessel: "mitte",
    personal: [
      { rolle: U, funktion: "Unterführer/-in" },
      { rolle: M, funktion: "Kraftfahrer/-in", fe: FE.C },
    ],
    fahrzeuge: [{ kurz: "GW Beh", lang: "Gerätewagen Behandlung" }],
    szenario: "MANV {ort} — Materialnachschub für den Behandlungsplatz",
    soll: [0, 1, 1, 2],
    sollGesamtDoppelt: 28,
    sollFahrzeuge: 7,
    instanzen: 7,
  },
  {
    fachdienst: "Sanitätsdienst",
    einheit: "Sanitäts-Gruppe",
    verband: "Behandlungsplatz 25 (BHP 25)",
    traeger: drk,
    ortSchluessel: "friedrichshainKreuzberg",
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Rettungssanitäter/-in", anzahl: 2, quali: "Rettungssanitäter" },
      { rolle: M, funktion: "Kraftfahrer/-in", fe: FE.C1 },
      { rolle: M, funktion: "Helfer/-in Sanität", anzahl: 2 },
    ],
    fahrzeuge: [{ kurz: "GW San", lang: "Gerätewagen Sanität" }],
    szenario: "MANV {ort} — Sanitätsdienstliches und ärztliches Betreuen von Verletzten",
    soll: [0, 1, 5, 6],
    sollGesamtDoppelt: 252,
    sollFahrzeuge: 21,
    instanzen: 21,
  },
  {
    fachdienst: "Sanitätsdienst",
    einheit: "Betreuungsgruppe",
    verband: "Behandlungsplatz 25 (BHP 25)",
    traeger: mhd,
    ortSchluessel: "pankow",
    personal: [
      { rolle: U, funktion: "Gruppenführer/-in" },
      { rolle: M, funktion: "Kraftfahrer/-in", fe: FE.B },
      { rolle: M, funktion: "Betreuungshelfer/-in", anzahl: 4 },
    ],
    fahrzeuge: [{ kurz: "Bt-Kombi", lang: "Betreuungs-Kombi" }],
    szenario: "MANV {ort} — Betreuen unverletzt Betroffener am Behandlungsplatz",
    soll: [0, 1, 5, 6],
    sollGesamtDoppelt: 168,
    sollFahrzeuge: 14,
    instanzen: 14,
  },
  {
    fachdienst: "Sanitätsdienst",
    einheit: "Gruppe Technik und Sicherheit",
    verband: "Behandlungsplatz 25 (BHP 25)",
    traeger: drk,
    ortSchluessel: "charlottenburgWilmersdorf",
    personal: [
      { rolle: U, funktion: "Unterführer/-in" },
      { rolle: M, funktion: "Kraftfahrer/-in", fe: FE.C1 },
      { rolle: M, funktion: "Helfer/-in Technik und Sicherheit", anzahl: 2 },
    ],
    fahrzeuge: [{ kurz: "Lkw TeSi", lang: "Lastkraftwagen technische Sicherheit" }],
    szenario: "MANV {ort} — Ausleuchten, Absichern und technischer Betrieb des Behandlungsplatzes",
    soll: [0, 1, 3, 4],
    sollGesamtDoppelt: 56,
    sollFahrzeuge: 7,
    instanzen: 7,
  },
  {
    fachdienst: "Sanitätsdienst",
    einheit: "Führungs-Trupp",
    verband: "Patiententransportzug 10 (PTZ 10)",
    traeger: drk,
    ortSchluessel: "spandau",
    personal: [
      { rolle: F, funktion: "Führer/-in" },
      { rolle: U, funktion: "Unterführer/-in" },
      { rolle: M, funktion: "Kraftfahrer/-in", fe: FE.C1 },
    ],
    fahrzeuge: [{ kurz: "KdoW", lang: "Kommandowagen" }],
    szenario: "MANV {ort} — Führung eines Patiententransportzuges 10",
    soll: [1, 1, 1, 3],
    sollGesamtDoppelt: 42,
    sollFahrzeuge: 7,
    instanzen: 7,
  },
  {
    fachdienst: "Sanitätsdienst",
    einheit: "Verletztentransport-Trupp",
    verband: "Patiententransportzug 10 (PTZ 10)",
    traeger: drk,
    ortSchluessel: "steglitzZehlendorf",
    personal: [
      { rolle: U, funktion: "Unterführer/-in / Rettungssanitäter/-in", quali: "Rettungssanitäter" },
      { rolle: M, funktion: "Kraftfahrer/-in", fe: FE.C1 },
    ],
    fahrzeuge: [{ kurz: "KTW Typ B", lang: "Notfallkrankenwagen" }],
    szenario: "MANV {ort} — Transport von Verletzten nach ärztlicher Festlegung",
    soll: [0, 1, 1, 2],
    sollGesamtDoppelt: 140,
    sollFahrzeuge: 35,
    instanzen: 35,
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
  const g = wuerfel(0.28) ? G.W : G.M;
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
    ernaehrung: gewichtet<E>([[E.FLEISCH, 76], [E.VEGETARISCH, 16], [E.VEGAN, 8]]),
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
function kennzeichen(): string {
  return `B-KatS ${1000 + (laufendeNummer++ % 8000)}`;
}

function fahrzeugeBauen(specs: FzSpec[], ort: BeOrt, traeger: Traeger): Fahrzeug[] {
  const fahrzeuge: Fahrzeug[] = [];
  let lfd = 0;
  for (const s of specs) {
    for (let i = 0; i < (s.anzahl ?? 1); i++) {
      lfd += 1;
      const fz: Fahrzeug = { typ: { freitext: s.kurz }, aenderungen: s.lang };
      fz.kennzeichen = kennzeichen();
      // Berlin führt keine OPTA-Kennzahlen (siehe Skriptkopf) — genähert mit
      // Kennwort der Trägerorganisation, Bezirk als Standort und der
      // Wachennummer als einziger Teilkennzahl. Bei mehreren Fahrzeugen im
      // selben Bogen (z. B. GW Bt + FKH) unterscheidet die zweite,
      // fortlaufende Ziffer.
      fz.funkrufname = {
        kennwort: traeger.kennwort,
        eigenerStandort: false,
        ort: ort.bezirk,
        teile: specs.length > 1 || (s.anzahl ?? 1) > 1 ? [ort.wache, lfd] : [ort.wache],
      };
      fahrzeuge.push(fz);
    }
  }
  return fahrzeuge;
}

interface BeispielBogen {
  datei: string;
  bogen: Erfassungsbogen;
  ort: BeOrt;
  fachdienst: string;
  verband: string;
}

function bogenBauen(spec: BogenSpec): BeispielBogen {
  const ort = BE_ORTE[spec.ortSchluessel]!;
  const personal = personalBauen(spec.personal);
  const fahrzeuge = fahrzeugeBauen(spec.fahrzeuge, ort, spec.traeger);

  const hierarchie: HierarchieEbene[] = [
    { bezeichnung: { freitext: `Fachdienst ${spec.fachdienst}` }, name: spec.verband },
    ...spec.traeger.ebene(ort),
  ];

  const tag = datumAusIso("2026-06-15") + ganz(0, 2);
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
      ortAuftrag: spec.szenario.replaceAll("{ort}", ort.bezirk),
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
      `Einfache Besetzung nach ${QUELLE}: ${spec.soll[0]}/${spec.soll[1]}/${spec.soll[2]}/${spec.soll[3]}. `
      + `Landesweit ${spec.instanzen} Teileinheiten dieses Typs (${spec.sollFahrzeuge} Fahrzeuge), `
      + `${spec.sollGesamtDoppelt} Helfer bei doppelter Besetzung laut Anlage. `
      + "Träger dieser Teileinheit ist redaktionell gewählt (die Verordnung nennt "
      + "außer für den Brandschutzdienst keinen Träger je Teileinheit), siehe README.",
  };

  return {
    datei: `${slug(spec.fachdienst)}-${slug(spec.einheit)}-${slug(spec.verband)}`,
    bogen,
    ort,
    fachdienst: spec.fachdienst,
    verband: spec.verband,
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
 * Selbstprüfung gegen die Anlage zu § 8 KatSD-VO: Personalstärke der
 * einfachen Besetzung je Teileinheit, hochgerechnete doppelte Besetzung
 * (× 2 × landesweite Instanzenzahl) gegen „Soll Gesamt", Fahrzeugzahl je
 * Instanz × Instanzenzahl gegen „Soll", vollständiger Funkrufname je
 * Fahrzeug, QR-Roundtrip, sowie die Fachdienst- und Gesamtsummen der Anlage.
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
    const hochgerechnet = s.gesamt * 2 * spec.instanzen;
    if (hochgerechnet !== spec.sollGesamtDoppelt) {
      fehler.push(
        `${b.datei}: hochgerechnet ${hochgerechnet} (${s.gesamt}×2×${spec.instanzen}) ≠ Anlage „Soll Gesamt" ${spec.sollGesamtDoppelt}`,
      );
    }
    const fzJeInstanz = spec.fahrzeuge.reduce((n, x) => n + (x.anzahl ?? 1), 0);
    if (fzJeInstanz * spec.instanzen !== spec.sollFahrzeuge) {
      fehler.push(
        `${b.datei}: ${fzJeInstanz}×${spec.instanzen} Fahrzeuge ≠ Anlage „Soll" ${spec.sollFahrzeuge}`,
      );
    }
    for (const fz of b.bogen.fahrzeuge) {
      const kurz = fz.typ.freitext ?? "?";
      if (!fz.funkrufname || fz.funkrufname.teile.length === 0) {
        fehler.push(`${b.datei}: ${kurz} ohne Funkrufnamen`);
      }
      if (fz.funkrufname?.ort !== b.ort.bezirk) {
        fehler.push(`${b.datei}: ${kurz} führt nicht den Bezirk „${b.ort.bezirk}"`);
      }
    }
  });
  // Fachdienst-Summen gegen die „Insgesamt"-Zeile der Anlage.
  const fachdienstSumme = (fd: string): { fz: number; helfer: number } => {
    let fz = 0;
    let helfer = 0;
    SPECS.forEach((spec) => {
      if (spec.fachdienst !== fd) return;
      fz += spec.sollFahrzeuge;
      helfer += spec.sollGesamtDoppelt;
    });
    return { fz, helfer };
  };
  const erwartet: Record<string, { fz: number; helfer: number }> = {
    "ABC-Dienst": { fz: 27, helfer: 256 },
    Betreuungsdienst: { fz: 70, helfer: 602 },
    Brandschutzdienst: { fz: 72, helfer: 792 },
    Sanitätsdienst: { fz: 98, helfer: 742 },
  };
  for (const [fd, soll] of Object.entries(erwartet)) {
    const ist = fachdienstSumme(fd);
    if (ist.fz !== soll.fz || ist.helfer !== soll.helfer) {
      fehler.push(
        `Fachdienst ${fd}: Summe ${ist.fz} Fz / ${ist.helfer} Helfer ≠ Anlage ${soll.fz} Fz / ${soll.helfer} Helfer`,
      );
    }
  }
  const gesamtFz = Object.values(erwartet).reduce((s, x) => s + x.fz, 0);
  const gesamtHelfer = Object.values(erwartet).reduce((s, x) => s + x.helfer, 0);
  if (gesamtFz !== 267 || gesamtHelfer !== 2392) {
    fehler.push(`„Insgesamt"-Zeile stimmt nicht: ${gesamtFz} Fz / ${gesamtHelfer} Helfer ≠ 267 / 2.392`);
  }
  if (fehler.length > 0) {
    throw new Error(`Selbstprüfung fehlgeschlagen:\n  ${fehler.join("\n  ")}`);
  }
}

// ---------------------------------------------------------------- Hauptlauf

const beispiele: BeispielBogen[] = SPECS.map(bogenBauen);

pruefen(beispiele);

const ausgabe = join(wurzel, "examples", "katastrophenschutz", "berlin");
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
  return `| ${b.datei} | ${b.fachdienst} | ${b.verband} | ${b.ort.bezirk} | ${s.fuehrer}/${s.unterfuehrer}/${s.mannschaft}/${s.gesamt} | ${spec.instanzen} | ${spec.sollFahrzeuge} | ${spec.sollGesamtDoppelt} |`;
});
writeFileSync(
  join(ausgabe, "README.md"),
  `# Beispiel-Erfassungsbögen — Katastrophenschutz Berlin

${beispiele.length} generierte Beispiel-Teileinheiten nach der Berliner
**Verordnung über den Katastrophenschutzdienst** (KatSD-VO vom 20. Dezember
2001, GVBl. Nr. 1/2002 S. 1, zuletzt geändert durch Verordnung vom 07.11.2011,
GVBl. S. 532) und ihrer **Anlage zu § 8** „Gesamtstärke der Einheiten des
Katastrophenschutzdienstes".

Alle Personen, Bezirks-Zuordnungen, Wachennummern und Kennzeichen sind
**fiktiv**.

## Warum die Anlage anders aufgebaut ist als in anderen Bundesländern

Berlin ist kreisfrei und kennt keine Landkreis-Stückzahlen. Die Anlage listet
je Fachdienst (ABC-Dienst, Betreuungsdienst, Brandschutzdienst, Sanitätsdienst)
stattdessen eine **landesweite Gesamtzahl an Fahrzeugen je Teileinheiten-Typ**
sowie die daraus resultierende Helferstärke bei **doppelter Besetzung**. Für
den Betreuungsdienst gilt das für **sieben Betreuungsplätze 500 (BTP 500)**,
für den Sanitätsdienst für **sieben Behandlungsplätze 25 (BHP 25)** und die
zugehörigen **sieben Patiententransportzüge 10 (PTZ 10)**, für den
Brandschutzdienst für die Feuerwehr-Bereitschaften der Freiwilligen
Feuerwehren.

Jeder Bogen bildet **eine Instanz einer Teileinheit mit einfacher Besetzung**
ab (eine Besatzung), nicht die doppelte Besetzung der Anlage. Die
Selbstprüfung rechnet das Personal jedes Bogens auf die landesweite
Instanzenzahl hoch (**× 2 × Instanzen**, Spalte „Instanzen") und vergleicht
mit der Spalte „Helfer (Anlage, doppelt)"; ebenso werden die Fachdienst-Summen
und die „Insgesamt"-Zeile der Anlage (267 Fahrzeuge / 2.392 Helfer) geprüft.

## Träger

§ 2 Absatz 1 KatSG Berlin nennt als Träger die Berliner Feuerwehr, die
Berliner Polizei sowie anerkannte private Hilfsorganisationen. Die
KatSD-VO-Anlage weist einen Träger nur für den **Brandschutzdienst**
ausdrücklich aus (Fußnote 2: „Die Fahrzeuge sind den Freiwilligen Feuerwehren
zugeordnet" — deckungsgleich mit der BBK-Meldung von 2023 über zehn
KatS-Fahrzeuge für die Berliner Freiwilligen Feuerwehren).

Für ABC-Dienst, Betreuungsdienst und Sanitätsdienst nennt die Verordnung
**keinen Träger je Teileinheit**. Hier redaktionell gewählt:

* **ABC-Dienst**: Regieeinheit der Berliner Feuerwehr.
* **Sanitätsdienst** (BHP 25 / PTZ 10): **DRK** — die einzige mit dieser
  Quellenlage belegbare Trägerschaft (der DRK-Kreisverband Berlin-Nordost
  betreibt nachweislich einen Behandlungsplatz 25).
* **Betreuungsdienst**: über ASB, DRK, JUH und MHD gestreut, um die Bandbreite
  der mitwirkenden Hilfsorganisationen zu zeigen.

Das ist eine **redaktionelle Annahme, keine Verordnungsvorgabe** — vermerkt im
Feld „Sonstiges" jedes einzelnen Bogens.

## Funkrufnamen

Berlin führt — anders als die übrigen bisher abgebildeten Länder — **keine
OPTA-Kennzahlen**. Der Funkkennziffernvergleich der Bundesländer
(fwthwrd.wordpress.com, Stand 2020/2023) nennt für Berlin durchgängig:

> „Klartextbezeichnung des Fahrzeugs gefolgt von Wachennummer"

Das App-Datenmodell verlangt für jeden Funkrufnamen ein Kennwort und
numerische Teilkennzahlen; eine reine Klartext-Kennung lässt sich darin nicht
verlustfrei abbilden. Genähert wird daher mit

> \`<Kennwort der Trägerorganisation> <Bezirk> <Wachennummer>[/<laufende Nummer>]\`

Der Fahrzeugtyp steht ohnehin im Klartext im Feld „Typ" jedes Fahrzeugs auf
dem Bogen (Spalte „Änderungen bzw. Sondergerät"). Die Wachennummern sind
vierstellig fiktiv, angelehnt an das reale Nummernschema der Berliner
Feuerwehr (Bezirk mal 100, z. B. „12xx" für Friedrichshain-Kreuzberg). Kennwort
je Trägerorganisation: Feuerwehr „Florian", DRK „Rotkreuz", ASB „Sama", JUH
„Akkon", MHD „Johannes".

Neu erzeugen mit: \`npm run beispiele:kats-be\` (deterministisch, fester
Zufalls-Seed).

| Datei | Fachdienst | Verband | Bezirk | Stärke (einfach) | Instanzen | Fz (Anlage) | Helfer (Anlage, doppelt) |
|---|---|---|---|---|---|---|---|
${zeilen.join("\n")}

Quelle: ${QUELLE}.
`,
);

console.log(`${beispiele.length} Bögen nach ${ausgabe} geschrieben.`);
