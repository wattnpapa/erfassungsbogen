/**
 * Erzeugt Beispiel-Erfassungsbögen der Katastrophenschutz-relevanten
 * DRK-Einheiten des Saarlandes als JSON nach
 * examples/katastrophenschutz/saarland/. Abgelegt ist nur das Bogen-JSON;
 * die PDF entsteht erst beim Anklicken in der App aus dem aktuellen Layout.
 *
 * Aufruf (Node ≥ 22): npm run beispiele:kats-sl
 *
 * WARUM KEINE LANDESVERORDNUNG WIE IN ANDEREN LÄNDERN:
 * Die saarländische Katastrophenschutz-Organisationsverordnung (KatOrgVO vom
 * 13.10.2014, zuletzt Amtsbl. I 2014 S. 400 — verbatim per
 * `curl -sL -A "Mozilla/5.0" https://www.sadaba.de/GSLT_KatOrgVO.html` +
 * HTML-Tag-Strip gelesen) regelt in § 2 Abs. 1 ausdrücklich NUR, dass die
 * "oberste Katastrophenschutzbehörde ... Stärke, Gliederung und Ausstattung
 * der Einheiten und Einrichtungen in den Grundstrukturen bestimmt" und
 * verweist auf "gesonderte Konzeptionen" — sie selbst enthält KEINE einzige
 * Stärke- oder Fahrzeugzahl (anders als z. B. Berlins KatSD-VO oder
 * Baden-Württembergs VwV KatSD).
 *
 * Diese "gesonderten Konzeptionen" für den Sanitäts- und Betreuungsdienst
 * (§ 6/§ 7 KatOrgVO) hat das DRK im Saarland öffentlich dokumentiert und mit
 * echten Stärke- und (teils) Fahrzeugangaben versehen — landesweit
 * einheitlich für alle sieben DRK-Kreisverbände des Landesverbandes
 * Saarland e.V., beschlossen vom Landesausschuss der Bereitschaften:
 *
 *   Sanitätsdienst (per `curl` + `pdftotext -layout` vollständig gelesen):
 *   - "Die Sanitätsstaffel im DRK Landesverband Saarland e.V." (16.02.2014)
 *     → Sanitätsstaffel/UHS = "BHP 5 DRK SAL", Stärke -/1/5/6.
 *   - "Der Behandlungsplatz 10 (BHP 10 SAL)" (16.02.2014)
 *     → Basismodul Führung 2/2/-/4, TeSi -/-/2/2, 2× Sanitätsstaffel
 *       -/1/5/6 → Gesamt 2/4/12/18.
 *   - "Der Behandlungsplatz 25 (BHP 25)" (16.02.2014)
 *     → Führungstrupp 2/1/1/4, Sichtung/Triage 2/1/2/5, Behandlung ROT
 *       2/-/6/8, GELB -/1/4/5, GRÜN -/1/4/5, Betreuungsstaffel -/1/5/6,
 *       Logistiktrupp -/1/3/4 → Gesamt 6/6/25/37. Dazu die "Transport-
 *       komponente" (Kap. 4): 1 RTW + 4 KTW + 1 MTW — Fahrzeuge hier
 *       verordnungs-/konzeptgenau, nicht nur beispielhaft belegt.
 *   - "Die Patiententransportkomponenten des DRK im Saarland" (17.11.2020,
 *     Version 28.09.2024) → vier geschlossene Verbände mit exakter
 *     Fahrzeug- UND Personalstärke:
 *       PT-G 5 DRK SAL   1 RTW, 4 KTW, 1 KdoW/ELW1              1/1/10/12
 *       PT-GA 5 DRK SAL  1 RTW, 4 KTW, 1 KdoW/ELW1, 1 NEF (opt.) 2/2/10/14
 *       PT-Z 10 DRK SAL  4 RTW, 6 KTW, 1 KdoW/ELW1              1/4/17/22
 *       PT-ZA 10 DRK SAL 4 RTW, 6 KTW, 1 KdoW/ELW1, 2 NEF (opt.) 3/6/17/26
 *
 *   Betreuungsdienst ("Mindestanforderungen an Strukturen des
 *   DRK-Betreuungsdienstes im Landesverband Saarland e.V.", Bundesfassung
 *   15.10.2011, Saarland-Fassung beschlossen 01.03.2015 — per `curl` +
 *   `pdftotext -layout` vollständig gelesen, Kapitel 6 "Umsetzung ... im
 *   Saarland"):
 *   - Betreuer vor Ort (BvO)          -/-/1/1
 *   - Betreuungsstaffel                -/1/5/6
 *   - Betreuungsgruppe (2× Staffel)    -/2/10/12
 *   - Betreuungsplatz 200 (BTP 200 – SAL)  1/4/17/22
 *   - Betreuungsplatz 500 (BTP 500 – SAL)  1/12/50/63 (die Quelle nennt nur
 *     die Gesamtstärke und einen modularen Aufbau aus Führungs-, Betreuungs-,
 *     Verpflegungs-, Unterbringungs- und Technik-/Logistik-Teileinheiten; die
 *     genaue Modul-Stückzahl ließ sich aus dem beim PDF-Textextrakt
 *     verlorenen Organigramm nicht mehr rekonstruieren — die hier gezeigte
 *     Rollenverteilung ist deshalb ein plausibles Modell, die GESAMTSTÄRKE
 *     1/12/50/63 ist wörtlich der Quelle entnommen und wird geprüft.)
 *   - DRK-Einsatzeinheit (San + Betreuung kombiniert): Führungstrupp 1/1/2/4,
 *     Sanitätsgruppe -/1/8/9, 2× Betreuungsstaffel -/1/5/6, Verpflegungstrupp
 *     -/1/1/2, Technischer Trupp -/1/2/3 → Gesamt 1/6/23/30 (jedes Modul
 *     einzeln nachvollziehbar, keine Näherung nötig).
 *
 * FAHRZEUGTYPEN: Nur bei BHP 25 (Transportkomponente) und den vier
 * Patiententransportkomponenten sind Fahrzeugtyp UND -zahl wörtlich der
 * Quelle entnommen. Bei allen anderen Einheiten (Sanitätsstaffel, BHP 10,
 * Betreuungsstaffel/-gruppe, BTP 200/500, DRK-Einsatzeinheit) nennt die
 * jeweilige DRK-Konzeption keine Fahrzeuge — hier sind die Fahrzeugtypen
 * plausibel nach den generischen Ausstattungslisten der KatOrgVO belegt
 * (§ 6 Abs. 4: "Gerätewagen-Sanität, Krankentransportwagen, Mannschafts-
 * transportwagen und Geräteanhänger"; § 7 Abs. 4: "Betreuungs-Lastkraftwagen,
 * Feldkochherde, Mannschaftstransportwagen und Geräteanhänger"). Das ist im
 * README und im Feld "Sonstiges" jedes betroffenen Bogens vermerkt.
 *
 * FUNKRUFNAMEN: Nach der "Verwaltungsvorschrift über Funkrufnamen für
 * nichtpolizeiliche Behörden und Organisationen mit Sicherheitsaufgaben
 * (npolBOS) im Saarland" vom 24.02.2014 (in Kraft seit 01.04.2014, erlassen
 * auf Grundlage von § 54 Abs. 2 SBKG; per `curl` + `pdftotext -layout`
 * vollständig gelesen, https://www.zrf-saar.de/.../3_6_2014_04_vv_funkrufnamen.pdf):
 *   "<Kennwort> <Einsatzbereich> <Standortkennzahl>-<Fahrzeugkennzahl>-<lfd. Nr.>"
 * Kennwort DRK = "ROTKREUZ" (Nr. 2.1 der VV = Code 3 im globalen
 * FUNKRUF_KENNWOERTER-Vokabular). Einsatzbereich = Gemeindeverband im
 * Klartext (Nr. 2.2). Standortkennzahl "0", weil die hier abgebildeten
 * Einheiten Kreisverbands-Pools ohne festen Standort sind (VV Nr. 2.3:
 * "Fahrzeuge einer Organisation, die keinem Standort zugeordnet werden
 * können ... erhalten die Standortkennzahl 0"). Fahrzeugkennzahlen nach
 * VV Nr. 2.4.1/2.4.6/2.4.8: KdoW 10, ELW 1 11, MTW 18, MTW-Z (Sanitäts-/
 * Betreuungsdienst-Variante) 17, GW-San 61, GW-Betreuung 63,
 * GW-Verpflegung 64, NEF 82, RTW 83, KTW 85, LKW 92.
 *
 * TRÄGER: Alle Bögen sind DRK-Kreisverbände des Landesverbandes Saarland
 * e.V., über die sieben Kreisverbände gestreut (Saarbrücken, Saarlouis,
 * Merzig-Wadern, Neunkirchen, St. Wendel und die beiden Kreisverbände im
 * Saarpfalz-Kreis St. Ingbert/Homburg — hier vereinfacht als ein
 * Kreisverband "Homburg" abgebildet, da beide denselben Gemeindeverband
 * "Saarpfalz-Kreis" im Funkrufnamen führen).
 *
 * Fiktiv sind alle Personen, Standort-Zuordnungen und Kennzeichen.
 *
 * Am Ende läuft eine Selbstprüfung (Stärke gegen die jeweilige DRK-SAL-
 * Konzeption, Funkrufname-Format, QR-Roundtrip); die README im Zielordner
 * bekommt eine Übersichtstabelle.
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
const rnd = prng(20141013); // Datum der KatOrgVO
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
  "Andreas", "Bernd", "Christian", "Daniel", "Dennis", "Dieter", "Dirk",
  "Frank", "Georg", "Hans", "Heiko", "Helmut", "Jan", "Jens", "Jochen",
  "Jürgen", "Klaus", "Lars", "Lukas", "Manfred", "Marc", "Marco", "Mario",
  "Markus", "Martin", "Matthias", "Michael", "Norbert", "Patrick", "Paul",
  "Peter", "Ralf", "René", "Robert", "Roland", "Sascha", "Sebastian",
  "Stefan", "Thomas", "Tobias", "Volker", "Werner", "Wolfgang",
] as const;
const VORNAMEN_W = [
  "Andrea", "Angelika", "Anja", "Anna", "Barbara", "Beate", "Birgit",
  "Britta", "Christiane", "Claudia", "Doris", "Elke", "Gabriele", "Heike",
  "Ines", "Ingrid", "Jasmin", "Julia", "Karin", "Katja", "Kerstin",
  "Kristina", "Manuela", "Maria", "Marion", "Martina", "Nadine", "Nicole",
  "Petra", "Sabine", "Sandra", "Sarah", "Silke", "Simone", "Stefanie",
  "Susanne", "Tanja", "Ursula",
] as const;
const NACHNAMEN = [
  "Backes", "Bauer", "Becker", "Bender", "Berg", "Bock", "Bohr", "Britz",
  "Dietz", "Dillinger", "Dorn", "Ecker", "Faust", "Fixemer", "Fried",
  "Gerber", "Groß", "Hammer", "Hary", "Heck", "Hoffmann", "Jung",
  "Kalbfell", "Kihm", "Klein", "Klein", "Koch", "Kohl", "Krebs", "Krein",
  "Lang", "Lauer", "Leiner", "Lorig", "Marx", "Mathes", "Metz", "Meyer",
  "Ney", "Petry", "Reinert", "Rubly", "Sartor", "Schäfer", "Scherer",
  "Schmidt", "Schmitt", "Schneider", "Schuh", "Schwarz", "Simon", "Thiel",
  "Thome", "Wagner", "Weber", "Weiler", "Wendel", "Wies", "Zimmer",
] as const;

/** Externe/Berufs-Qualifikationen (Freitext) — gelegentlich gestreut. */
const QUALI_POOL = [
  "Berufskraftfahrer (Beruf)",
  "Rettungssanitäter (extern)",
  "Notfallsanitäter (extern)",
  "Gesundheits- und Krankenpfleger (Beruf)",
  "Sprechfunker",
  "Betreuungshelfer/-in",
  "Koch (Beruf)",
] as const;

// --------------------------------------------------------------- Kreisverbände

interface SlOrt {
  /** DRK-Kreisverband (Sitz der Einheit). */
  kreisverband: string;
  /** Einsatzbereich im Funkrufnamen (Nr. 2.2 VV Funkrufnamen: Gemeindeverband). */
  einsatzbereich: string;
  /** Kfz-Kennzeichen des Landkreises/Regionalverbands. */
  kfz: string;
}

const SL_ORTE: Record<string, SlOrt> = {
  saarbruecken: { kreisverband: "Saarbrücken", einsatzbereich: "Regionalverband", kfz: "SB" },
  saarlouis: { kreisverband: "Saarlouis", einsatzbereich: "Saarlouis", kfz: "SLS" },
  merzigwadern: { kreisverband: "Merzig-Wadern", einsatzbereich: "Merzig-Wadern", kfz: "MZG" },
  neunkirchen: { kreisverband: "Neunkirchen", einsatzbereich: "Neunkirchen", kfz: "NK" },
  stwendel: { kreisverband: "St. Wendel", einsatzbereich: "St. Wendel", kfz: "WND" },
  homburg: { kreisverband: "Homburg", einsatzbereich: "Saarpfalz-Kreis", kfz: "HOM" },
};

/** FUNKRUF_KENNWOERTER-Code (src/vokabulare/thw.ts): Rotkreuz = 3. */
const ROTKREUZ: VokabularWert = { code: 3 };

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
  if (/^(LKW)/.test(kurz)) return 90;
  if (/^(GW)/.test(kurz)) return 70;
  if (/^(RTW|KTW|NEF|MTW|KdoW)/.test(kurz)) return 45;
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
  /** Klartext + Herkunft für „Änderungen bzw. Sondergerät". */
  lang: string;
  anzahl?: number;
  /** Fahrzeugkennzahl nach VV Funkrufnamen Nr. 2.4 (Kurzform „xx-yy"). */
  kennzahl: number;
}

interface BogenSpec {
  /** Kürzel der Konzeption, z. B. "BHP 25 DRK SAL". */
  kuerzel: string;
  einheit: string;
  fachdienst: string;
  ortSchluessel: keyof typeof SL_ORTE;
  personal: PlatzSpec[];
  fahrzeuge: FzSpec[];
  szenario: string; // {ort} wird ersetzt
  /** Stärke laut Quelle als "Führer/Unterführer/Mannschaft/Gesamt" — wird geprüft. */
  soll: [number, number, number, number];
  /** Kurzbeleg der Quelle für das Feld „Sonstiges". */
  quelle: string;
  /** true: Fahrzeugtyp UND -zahl sind wörtlich der Quelle entnommen. */
  fahrzeugeQuellengenau: boolean;
}

const F = R.FUEHRER;
const U = R.UNTERFUEHRER;
const M = R.MANNSCHAFT;

const QUELLE_SAN =
  "DRK-Landesverband Saarland e.V., Landesausschuss der Bereitschaften (16.02.2014)";
const QUELLE_PTK =
  "„Die Patiententransportkomponenten des DRK im Saarland\", Landesausschuss der Bereitschaften (17.11.2020, Version 28.09.2024)";
const QUELLE_BTD =
  "„Mindestanforderungen an Strukturen des DRK-Betreuungsdienstes im LV Saarland\" (Landesausschuss der Bereitschaften, 01.03.2015)";
const HINWEIS_FZ_GENERISCH =
  "Fahrzeugtyp nicht in der DRK-SAL-Konzeption genannt — beispielhaft nach der "
  + "generischen Ausstattung der KatOrgVO belegt.";

const SPECS: BogenSpec[] = [
  // ========================================================= Sanitätsdienst
  {
    kuerzel: "BHP 5 DRK SAL",
    einheit: "Sanitätsstaffel (Unfallhilfsstelle UHS)",
    fachdienst: "Sanitätsdienst",
    ortSchluessel: "saarlouis",
    personal: [
      { rolle: U, funktion: "Staffelführer/-in", quali: "Gruppenführerausbildung" },
      { rolle: M, funktion: "Kraftfahrer/-in", quali: "Technik und Sicherheit", fe: FE.C1 },
      { rolle: M, funktion: "Rettungssanitäter/-in", anzahl: 4, quali: "Rettungssanitäter" },
    ],
    fahrzeuge: [
      { kurz: "GW-San", kennzahl: 61, lang: "Gerätewagen-Sanitätsdienst mit Staffelkabine und Geräteaufbau" },
    ],
    szenario: "Sanitätswachdienst {ort} — Aufbau und Betrieb einer Unfallhilfsstelle (UHS)",
    soll: [0, 1, 5, 6],
    quelle: `Stärke -/1/5/6 nach „Die Sanitätsstaffel im DRK Landesverband Saarland e.V." (${QUELLE_SAN}). ${HINWEIS_FZ_GENERISCH}`,
    fahrzeugeQuellengenau: false,
  },
  {
    kuerzel: "BHP 10 DRK SAL",
    einheit: "Behandlungsplatz 10 — Basismodul",
    fachdienst: "Sanitätsdienst",
    ortSchluessel: "neunkirchen",
    personal: [
      { rolle: F, funktion: "Zugführer/-in", quali: "Zugführer" },
      { rolle: F, funktion: "Notarzt/Notärztin" },
      { rolle: U, funktion: "Führungsgehilfe/-in", anzahl: 2, quali: "Technik und Sicherheit" },
      { rolle: M, funktion: "Helfer/-in Technik und Sicherheit", anzahl: 2 },
      { rolle: U, funktion: "Staffelführer/-in Sanitätsstaffel", anzahl: 2, quali: "Gruppenführerausbildung" },
      { rolle: M, funktion: "Kraftfahrer/-in Sanitätsstaffel", anzahl: 2, fe: FE.C1 },
      { rolle: M, funktion: "Rettungssanitäter/-in Sanitätsstaffel", anzahl: 8, quali: "Rettungssanitäter" },
    ],
    fahrzeuge: [
      { kurz: "GW-San", kennzahl: 61, lang: "Gerätewagen-Sanitätsdienst — Behandlung" },
      { kurz: "MTW-Z", kennzahl: 17, lang: "Mannschaftstransportwagen mit Zusatzfunktion — Sanitätsdienst" },
    ],
    szenario: "Sanitätswachdienst {ort} — Aufbau und Betrieb eines Behandlungsplatzes 10 (BHP 10)",
    soll: [2, 4, 12, 18],
    quelle: `Basismodul-Stärke 2/4/12/18 (Führung 2/2/-/4, Technik/Sicherheit -/-/2/2, zwei Sanitätsstaffeln á -/1/5/6) nach „Der Behandlungsplatz 10 (BHP 10 SAL)" (${QUELLE_SAN}). ${HINWEIS_FZ_GENERISCH}`,
    fahrzeugeQuellengenau: false,
  },
  {
    kuerzel: "BHP 25 DRK SAL",
    einheit: "Behandlungsplatz 25",
    fachdienst: "Sanitätsdienst",
    ortSchluessel: "saarbruecken",
    personal: [
      { rolle: F, funktion: "Verbandsführer/-in (Führer BHP 25)" },
      { rolle: F, funktion: "Zugtruppführer/-in" },
      { rolle: U, funktion: "Leitender Notarzt/Leitende Notärztin (LNA)" },
      { rolle: M, funktion: "Kraftfahrer/-in/Sprechfunker/-in Führung", fe: FE.C1 },
      { rolle: F, funktion: "Notarzt/Notärztin Sichtung", anzahl: 2 },
      { rolle: U, funktion: "Gruppenführer/-in Sichtung/Triage" },
      { rolle: M, funktion: "Rettungsassistent/-in Sichtung/Triage", anzahl: 2 },
      { rolle: F, funktion: "Notarzt/Notärztin Behandlung Kat. ROT", anzahl: 2 },
      { rolle: M, funktion: "Rettungsassistent/-in Behandlung Kat. ROT", anzahl: 3 },
      { rolle: M, funktion: "Rettungssanitäter/-in Behandlung Kat. ROT", anzahl: 3 },
      { rolle: U, funktion: "Gruppenführer/-in Behandlung Kat. GELB" },
      { rolle: M, funktion: "Rettungsassistent/-in Behandlung Kat. GELB", anzahl: 2 },
      { rolle: M, funktion: "Sanitätshelfer/-in Behandlung Kat. GELB", anzahl: 2 },
      { rolle: U, funktion: "Gruppenführer/-in Behandlung Kat. GRÜN" },
      { rolle: M, funktion: "Sanitätshelfer/-in Behandlung Kat. GRÜN", anzahl: 4 },
      { rolle: U, funktion: "Staffelführer/-in Betreuungsstaffel" },
      { rolle: M, funktion: "Kraftfahrer/-in Betreuungsstaffel", fe: FE.C1 },
      { rolle: M, funktion: "Helfer/-in Betreuungsstaffel", anzahl: 4 },
      { rolle: U, funktion: "Gruppenführer/-in Logistiktrupp" },
      { rolle: M, funktion: "Helfer/-in Technik und Sicherheit Logistiktrupp", anzahl: 3 },
    ],
    fahrzeuge: [
      { kurz: "RTW", kennzahl: 83, lang: "Rettungswagen — Transportkomponente" },
      { kurz: "KTW", kennzahl: 85, lang: "Krankentransportwagen — Transportkomponente", anzahl: 4 },
      { kurz: "MTW", kennzahl: 18, lang: "Mannschaftstransportwagen — Transportkomponente" },
    ],
    szenario: "MANV {ort} — Aufbau und Betrieb eines Behandlungsplatzes 25 (BHP 25)",
    soll: [6, 6, 25, 37],
    quelle: `Stärke 6/6/25/37 (Führungstrupp 2/1/1/4, Sichtung/Triage 2/1/2/5, Behandlung ROT 2/-/6/8, GELB -/1/4/5, GRÜN -/1/4/5, Betreuungsstaffel -/1/5/6, Logistiktrupp -/1/3/4) nach „Der Behandlungsplatz 25 (BHP 25)" (${QUELLE_SAN}). Die Transportkomponente (1 RTW, 4 KTW, 1 MTW) ist Kap. 4 derselben Quelle wörtlich entnommen.`,
    fahrzeugeQuellengenau: true,
  },
  {
    kuerzel: "PT-G 5 DRK SAL",
    einheit: "Patiententransport-Gruppe",
    fachdienst: "Sanitätsdienst",
    ortSchluessel: "merzigwadern",
    personal: [
      { rolle: F, funktion: "Zugführer/-in (Führer PT-G 5)", quali: "Rettungssanitäter" },
      { rolle: U, funktion: "Fahrzeugführer/-in RTW", quali: "Rettungsassistent/Notfallsanitäter" },
      { rolle: M, funktion: "Kraftfahrer/-in/Sprechfunker/-in Führung", fe: FE.C1 },
      { rolle: M, funktion: "Fahrer/-in RTW", quali: "Rettungssanitäter", fe: FE.C1 },
      { rolle: M, funktion: "Fahrzeugführer/-in KTW", anzahl: 4, quali: "Rettungssanitäter" },
      { rolle: M, funktion: "Kraftfahrer/-in KTW", anzahl: 4, fe: FE.C1 },
    ],
    fahrzeuge: [
      { kurz: "RTW", kennzahl: 83, lang: "Rettungswagen (DIN EN 1789 Typ C)" },
      { kurz: "KTW", kennzahl: 85, lang: "Krankentransportwagen (DIN EN 1789 Typ B)", anzahl: 4 },
      { kurz: "KdoW", kennzahl: 10, lang: "Kommandowagen — Führungsfahrzeug (alt. ELW 1)" },
    ],
    szenario: "Sekundärverlegung {ort} — Bereitstellung von Transportkapazität für fünf Patienten",
    soll: [1, 1, 10, 12],
    quelle: `Stärke 1/1/10/12, 1 RTW + 4 KTW + 1 KdoW/ELW 1 nach ${QUELLE_PTK}.`,
    fahrzeugeQuellengenau: true,
  },
  {
    kuerzel: "PT-GA 5 DRK SAL",
    einheit: "Patiententransport-Gruppe Arzt",
    fachdienst: "Sanitätsdienst",
    ortSchluessel: "stwendel",
    personal: [
      { rolle: F, funktion: "Zugführer/-in (Führer PT-GA 5)", quali: "Rettungssanitäter" },
      { rolle: F, funktion: "Notarzt/Notärztin" },
      { rolle: U, funktion: "Fahrzeugführer/-in RTW", quali: "Rettungsassistent/Notfallsanitäter" },
      { rolle: U, funktion: "Fahrzeugführer/-in NEF", quali: "Rettungsassistent/Notfallsanitäter" },
      { rolle: M, funktion: "Kraftfahrer/-in/Sprechfunker/-in Führung", fe: FE.C1 },
      { rolle: M, funktion: "Fahrer/-in RTW", quali: "Rettungssanitäter", fe: FE.C1 },
      { rolle: M, funktion: "Fahrzeugführer/-in KTW", anzahl: 4, quali: "Rettungssanitäter" },
      { rolle: M, funktion: "Kraftfahrer/-in KTW", anzahl: 4, fe: FE.C1 },
    ],
    fahrzeuge: [
      { kurz: "RTW", kennzahl: 83, lang: "Rettungswagen (DIN EN 1789 Typ C)" },
      { kurz: "KTW", kennzahl: 85, lang: "Krankentransportwagen (DIN EN 1789 Typ B)", anzahl: 4 },
      { kurz: "KdoW", kennzahl: 10, lang: "Kommandowagen — Führungsfahrzeug (alt. ELW 1)" },
      { kurz: "NEF", kennzahl: 82, lang: "Notarzt-Einsatzfahrzeug (optional nach DRK-SAL-Konzept)" },
    ],
    szenario: "Sekundärverlegung {ort} — Transportkapazität für fünf Patienten mit Arztbegleitung",
    soll: [2, 2, 10, 14],
    quelle: `Stärke 2/2/10/14, 1 RTW + 4 KTW + 1 KdoW/ELW 1 + 1 NEF (optional) nach ${QUELLE_PTK}.`,
    fahrzeugeQuellengenau: true,
  },
  {
    kuerzel: "PT-Z 10 DRK SAL",
    einheit: "Patiententransport-Zug",
    fachdienst: "Sanitätsdienst",
    ortSchluessel: "homburg",
    personal: [
      { rolle: F, funktion: "Zugführer/-in (Führer PT-Z 10)", quali: "Rettungssanitäter" },
      { rolle: U, funktion: "Fahrzeugführer/-in RTW", anzahl: 4, quali: "Rettungsassistent/Notfallsanitäter" },
      { rolle: M, funktion: "Kraftfahrer/-in/Sprechfunker/-in Führung", fe: FE.C1 },
      { rolle: M, funktion: "Fahrer/-in RTW", anzahl: 4, quali: "Rettungssanitäter", fe: FE.C1 },
      { rolle: M, funktion: "Fahrzeugführer/-in KTW", anzahl: 6, quali: "Rettungssanitäter" },
      { rolle: M, funktion: "Kraftfahrer/-in KTW", anzahl: 6, fe: FE.C1 },
    ],
    fahrzeuge: [
      { kurz: "RTW", kennzahl: 83, lang: "Rettungswagen (DIN EN 1789 Typ C)", anzahl: 4 },
      { kurz: "KTW", kennzahl: 85, lang: "Krankentransportwagen (DIN EN 1789 Typ B)", anzahl: 6 },
      { kurz: "KdoW", kennzahl: 10, lang: "Kommandowagen — Führungsfahrzeug (alt. ELW 1)" },
    ],
    szenario: "Sekundärverlegung {ort} — überörtlich zusammengestellte Transportkapazität für zehn Patienten",
    soll: [1, 4, 17, 22],
    quelle: `Stärke 1/4/17/22, 4 RTW + 6 KTW + 1 KdoW/ELW 1 nach ${QUELLE_PTK}.`,
    fahrzeugeQuellengenau: true,
  },
  {
    kuerzel: "PT-ZA 10 DRK SAL",
    einheit: "Patiententransport-Zug Arzt",
    fachdienst: "Sanitätsdienst",
    ortSchluessel: "saarlouis",
    personal: [
      { rolle: F, funktion: "Zugführer/-in (Führer PT-ZA 10)", quali: "Rettungssanitäter" },
      { rolle: F, funktion: "Notarzt/Notärztin", anzahl: 2 },
      { rolle: U, funktion: "Fahrzeugführer/-in RTW", anzahl: 4, quali: "Rettungsassistent/Notfallsanitäter" },
      { rolle: U, funktion: "Fahrzeugführer/-in NEF", anzahl: 2, quali: "Rettungsassistent/Notfallsanitäter" },
      { rolle: M, funktion: "Kraftfahrer/-in/Sprechfunker/-in Führung", fe: FE.C1 },
      { rolle: M, funktion: "Fahrer/-in RTW", anzahl: 4, quali: "Rettungssanitäter", fe: FE.C1 },
      { rolle: M, funktion: "Fahrzeugführer/-in KTW", anzahl: 6, quali: "Rettungssanitäter" },
      { rolle: M, funktion: "Kraftfahrer/-in KTW", anzahl: 6, fe: FE.C1 },
    ],
    fahrzeuge: [
      { kurz: "RTW", kennzahl: 83, lang: "Rettungswagen (DIN EN 1789 Typ C)", anzahl: 4 },
      { kurz: "KTW", kennzahl: 85, lang: "Krankentransportwagen (DIN EN 1789 Typ B)", anzahl: 6 },
      { kurz: "KdoW", kennzahl: 10, lang: "Kommandowagen — Führungsfahrzeug (alt. ELW 1)" },
      { kurz: "NEF", kennzahl: 82, lang: "Notarzt-Einsatzfahrzeug (optional nach DRK-SAL-Konzept)", anzahl: 2 },
    ],
    szenario: "Sekundärverlegung {ort} — überörtliche Transportkapazität für zehn Patienten mit Arztbegleitung",
    soll: [3, 6, 17, 26],
    quelle: `Stärke 3/6/17/26, 4 RTW + 6 KTW + 1 KdoW/ELW 1 + 2 NEF (optional) nach ${QUELLE_PTK}.`,
    fahrzeugeQuellengenau: true,
  },

  // ========================================================= Betreuungsdienst
  {
    kuerzel: "BvO",
    einheit: "Betreuer vor Ort",
    fachdienst: "Betreuungsdienst",
    ortSchluessel: "saarbruecken",
    personal: [{ rolle: M, funktion: "Betreuer/-in vor Ort" }],
    fahrzeuge: [],
    szenario: "Kleinschadenslage {ort} — Erstversorgung von bis zu 30 Betroffenen",
    soll: [0, 0, 1, 1],
    quelle: `Stärke -/-/1/1 nach ${QUELLE_BTD}. Kein Fahrzeug vorgesehen — der BvO wird gezielt personenungebunden und schnell verfügbar gehalten (Quelle: "nicht unbedingt aus dem Betreuungsdienst" rekrutiert).`,
    fahrzeugeQuellengenau: true,
  },
  {
    kuerzel: "Betreuungsstaffel",
    einheit: "Betreuungsstaffel",
    fachdienst: "Betreuungsdienst",
    ortSchluessel: "saarlouis",
    personal: [
      { rolle: U, funktion: "Staffelführer/-in" },
      { rolle: M, funktion: "Kraftfahrer/-in/Sprechfunker/-in", fe: FE.C1 },
      { rolle: M, funktion: "Helfer/-in Betreuungsdienst", anzahl: 4 },
    ],
    fahrzeuge: [
      { kurz: "MTW-Z", kennzahl: 17, lang: "Mannschaftstransportwagen mit Zusatzfunktion — Betreuung" },
    ],
    szenario: "Evakuierung {ort} — Erstversorgung von bis zu 100 Betroffenen",
    soll: [0, 1, 5, 6],
    quelle: `Stärke -/1/5/6 nach ${QUELLE_BTD}. ${HINWEIS_FZ_GENERISCH}`,
    fahrzeugeQuellengenau: false,
  },
  {
    kuerzel: "Betreuungsgruppe",
    einheit: "Betreuungsgruppe",
    fachdienst: "Betreuungsdienst",
    ortSchluessel: "merzigwadern",
    personal: [
      { rolle: U, funktion: "Staffelführer/-in", anzahl: 2 },
      { rolle: M, funktion: "Kraftfahrer/-in/Sprechfunker/-in", anzahl: 2, fe: FE.C1 },
      { rolle: M, funktion: "Helfer/-in Betreuungsdienst", anzahl: 8 },
    ],
    fahrzeuge: [
      { kurz: "MTW-Z", kennzahl: 17, lang: "Mannschaftstransportwagen mit Zusatzfunktion — Betreuung", anzahl: 2 },
    ],
    szenario: "Evakuierung {ort} — Erstversorgung von bis zu 200 Betroffenen",
    soll: [0, 2, 10, 12],
    quelle: `Stärke -/2/10/12 (zwei Betreuungsstaffeln) nach ${QUELLE_BTD}. ${HINWEIS_FZ_GENERISCH}`,
    fahrzeugeQuellengenau: false,
  },
  {
    kuerzel: "BTP 200 – SAL",
    einheit: "Betreuungsplatz 200",
    fachdienst: "Betreuungsdienst",
    ortSchluessel: "neunkirchen",
    personal: [
      { rolle: F, funktion: "Platzführer/-in BTP 200" },
      { rolle: U, funktion: "Staffelführer/-in Betreuungsgruppe", anzahl: 2 },
      { rolle: M, funktion: "Kraftfahrer/-in/Sprechfunker/-in Betreuungsgruppe", anzahl: 2, fe: FE.C1 },
      { rolle: M, funktion: "Helfer/-in Betreuungsdienst", anzahl: 8 },
      { rolle: U, funktion: "Truppführer/-in Verpflegungstrupp" },
      { rolle: M, funktion: "Helfer/-in Verpflegungsdienst", anzahl: 2, quali: "Koch (Beruf)" },
      { rolle: M, funktion: "Helfer/-in Unterbringungstrupp", anzahl: 2 },
      { rolle: U, funktion: "Truppführer/-in Technik-/Logistiktrupp" },
      { rolle: M, funktion: "Helfer/-in Technik und Logistik", anzahl: 3 },
    ],
    fahrzeuge: [
      { kurz: "GW-Betr", kennzahl: 63, lang: "Gerätewagen Betreuung" },
      { kurz: "MTW-Z", kennzahl: 17, lang: "Mannschaftstransportwagen mit Zusatzfunktion — Betreuung", anzahl: 2 },
      { kurz: "LKW", kennzahl: 92, lang: "Betreuungs-Lastkraftwagen nach KatOrgVO § 7 Abs. 4" },
    ],
    szenario: "Evakuierung {ort} — Betrieb eines Betreuungsplatzes 200 (BTP 200) über 48 Stunden",
    soll: [1, 4, 17, 22],
    quelle: `Gesamtstärke 1/4/17/22 (Betreuungsgruppe, Verpflegungs-, Unterbringungs- und Technik-/Logistiktrupp) nach ${QUELLE_BTD}. ${HINWEIS_FZ_GENERISCH}`,
    fahrzeugeQuellengenau: false,
  },
  {
    kuerzel: "BTP 500 – SAL",
    einheit: "Betreuungsplatz 500",
    fachdienst: "Betreuungsdienst",
    ortSchluessel: "stwendel",
    personal: [
      { rolle: F, funktion: "Platzführer/-in BTP 500", quali: "Verbandsführerausbildung" },
      { rolle: U, funktion: "Zugführer/-in", anzahl: 2 },
      { rolle: U, funktion: "Staffelführer/-in Betreuung", anzahl: 4 },
      { rolle: U, funktion: "Truppführer/-in Verpflegung", anzahl: 3 },
      { rolle: U, funktion: "Truppführer/-in Unterbringung", anzahl: 2 },
      { rolle: U, funktion: "Truppführer/-in Technik und Logistik" },
      { rolle: M, funktion: "Helfer/-in Betreuungsdienst", anzahl: 30 },
      { rolle: M, funktion: "Kraftfahrer/-in/Sprechfunker/-in", anzahl: 8, fe: FE.C1 },
      { rolle: M, funktion: "Helfer/-in Verpflegungsdienst", anzahl: 6, quali: "Koch (Beruf)" },
      { rolle: M, funktion: "Helfer/-in Unterbringung", anzahl: 4 },
      { rolle: M, funktion: "Helfer/-in Technik und Logistik", anzahl: 2 },
    ],
    fahrzeuge: [
      { kurz: "KdoW", kennzahl: 10, lang: "Kommandowagen — Platzführung" },
      { kurz: "GW-Betr", kennzahl: 63, lang: "Gerätewagen Betreuung", anzahl: 2 },
      { kurz: "MTW-Z", kennzahl: 17, lang: "Mannschaftstransportwagen mit Zusatzfunktion — Betreuung", anzahl: 4 },
      { kurz: "LKW", kennzahl: 92, lang: "Betreuungs-Lastkraftwagen nach KatOrgVO § 7 Abs. 4", anzahl: 2 },
    ],
    szenario: "Großschadenslage {ort} — Betrieb eines Betreuungsplatzes 500 (BTP 500) über 48 Stunden",
    soll: [1, 12, 50, 63],
    quelle: `Gesamtstärke 1/12/50/63 nach ${QUELLE_BTD}. Die Quelle nennt nur die Gesamtstärke und einen modularen Aufbau — die genaue Modul-Stückzahl war aus dem Organigramm der Quelle beim Textextrakt nicht mehr rekonstruierbar; die hier gezeigte Rollenverteilung ist ein plausibles Modell, die Gesamtstärke ist wörtlich der Quelle entnommen. ${HINWEIS_FZ_GENERISCH}`,
    fahrzeugeQuellengenau: false,
  },
  {
    kuerzel: "DRK-Einsatzeinheit",
    einheit: "DRK-Einsatzeinheit (Sanität + Betreuung)",
    fachdienst: "Sanitäts- und Betreuungsdienst",
    ortSchluessel: "homburg",
    personal: [
      { rolle: F, funktion: "Einheitenführer/-in" },
      { rolle: U, funktion: "Führungsassistent/-in" },
      { rolle: M, funktion: "Kraftfahrer/-in/Sprechfunker/-in Führung", anzahl: 2, fe: FE.C1 },
      { rolle: U, funktion: "Gruppenführer/-in Sanitätsgruppe" },
      { rolle: M, funktion: "Sanitätshelfer/-in Sanitätsgruppe", anzahl: 8, quali: "Rettungssanitäter" },
      { rolle: U, funktion: "Staffelführer/-in Betreuungsstaffel", anzahl: 2 },
      { rolle: M, funktion: "Kraftfahrer/-in Betreuungsstaffel", anzahl: 2, fe: FE.C1 },
      { rolle: M, funktion: "Helfer/-in Betreuungsstaffel", anzahl: 8 },
      { rolle: U, funktion: "Truppführer/-in Verpflegungstrupp" },
      { rolle: M, funktion: "Helfer/-in Verpflegungsdienst", quali: "Koch (Beruf)" },
      { rolle: U, funktion: "Truppführer/-in Technischer Trupp" },
      { rolle: M, funktion: "Helfer/-in Technik und Sicherheit", anzahl: 2 },
    ],
    fahrzeuge: [
      { kurz: "KdoW", kennzahl: 10, lang: "Kommandowagen — Führung" },
      { kurz: "GW-San", kennzahl: 61, lang: "Gerätewagen-Sanitätsdienst — Sanitätsgruppe" },
      { kurz: "MTW-Z", kennzahl: 17, lang: "Mannschaftstransportwagen mit Zusatzfunktion — Betreuung", anzahl: 2 },
      { kurz: "GW-Verpfl", kennzahl: 64, lang: "Gerätewagen-Verpflegung" },
      { kurz: "MTW", kennzahl: 18, lang: "Mannschaftstransportwagen — Technischer Trupp" },
    ],
    szenario: "Großschadenslage {ort} — multifunktionaler Einsatz mit sanitäts- und betreuungsdienstlichem Anteil",
    soll: [1, 6, 23, 30],
    quelle: `Stärke 1/6/23/30 (Führungstrupp 1/1/2/4, Sanitätsgruppe -/1/8/9, zwei Betreuungsstaffeln á -/1/5/6, Verpflegungstrupp -/1/1/2, Technischer Trupp -/1/2/3) nach ${QUELLE_BTD}. ${HINWEIS_FZ_GENERISCH}`,
    fahrzeugeQuellengenau: false,
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
      ? gewichtet<FE>([[FE.C, 3], [FE.C1, 4], [FE.B, 3]])
      : gewichtet<FE>([[FE.B, 6], [FE.C1, 4], [FE.NONE, 3]]));
  const person: Person = {
    vorname,
    nachname,
    staerkeRolle: spec.rolle,
    funktionen: [{ freitext: spec.funktion }],
    fahrerlaubnis: fe,
    geschlecht: g,
    ernaehrung: gewichtet<E>([[E.FLEISCH, 76], [E.VEGETARISCH, 17], [E.VEGAN, 7]]),
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
  return `${kfz}-DRK ${100 + (laufendeNummer++ % 800)}`;
}

function fahrzeugeBauen(specs: FzSpec[], ort: SlOrt): Fahrzeug[] {
  const belegt = new Map<number, number>();
  const fahrzeuge: Fahrzeug[] = [];
  for (const s of specs) {
    for (let i = 0; i < (s.anzahl ?? 1); i++) {
      const lfd = (belegt.get(s.kennzahl) ?? 0) + 1;
      belegt.set(s.kennzahl, lfd);
      const fz: Fahrzeug = {
        typ: { freitext: s.kurz },
        aenderungen: s.lang,
        kennzeichen: kennzeichen(ort.kfz),
        funkrufname: {
          kennwort: ROTKREUZ,
          // VV Funkrufnamen Saarland Nr. 2.2: Einsatzbereich im Klartext.
          eigenerStandort: false,
          ort: ort.einsatzbereich,
          // Standortkennzahl "0" (Kreisverbands-Pool ohne festen Standort,
          // VV Nr. 2.3), Fahrzeugkennzahl, laufende Nummer.
          teile: [0, s.kennzahl, lfd],
        },
      };
      fahrzeuge.push(fz);
    }
  }
  return fahrzeuge;
}

interface BeispielBogen {
  datei: string;
  bogen: Erfassungsbogen;
  ort: SlOrt;
  fachdienst: string;
  kuerzel: string;
}

function bogenBauen(spec: BogenSpec): BeispielBogen {
  const ort = SL_ORTE[spec.ortSchluessel]!;
  const personal = personalBauen(spec.personal);
  const fahrzeuge = fahrzeugeBauen(spec.fahrzeuge, ort);

  const hierarchie: HierarchieEbene[] = [
    { bezeichnung: { freitext: `Fachdienst ${spec.fachdienst}` }, name: ort.kreisverband },
    { bezeichnung: { freitext: "DRK-Kreisverband" }, name: ort.kreisverband },
    { bezeichnung: { freitext: "DRK-Landesverband" }, name: "Saarland" },
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
      organisation: OrganisationsTyp.DRK,
      organisationName: `Deutsches Rotes Kreuz Kreisverband ${ort.kreisverband} e.V.`,
      einheitsTyp: { freitext: `${spec.einheit} (${spec.kuerzel})` },
      hierarchie,
    },
    einsatz: {
      zeitraumVon: tag,
      zeitraumBis: tag + dauer,
      ortAuftrag: spec.szenario.replaceAll("{ort}", ort.kreisverband),
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
    sonstiges: spec.quelle,
  };

  return {
    datei: `${slug(spec.kuerzel)}-${slug(spec.einheit)}-${slug(ort.kreisverband)}`,
    bogen,
    ort,
    fachdienst: spec.fachdienst,
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
 * Selbstprüfung: personelle Stärke gegen die jeweilige DRK-SAL-Konzeption
 * sowie Format des Funkrufnamens (Kennwort ROTKREUZ, Einsatzbereich im
 * Klartext, drei Teilkennzahlen: Standort/Fahrzeug/laufende Nummer).
 */
function pruefen(beispiele: BeispielBogen[]): void {
  const fehler: string[] = [];
  beispiele.forEach((b, i) => {
    const spec = SPECS[i]!;
    const s = staerke(b.bogen);
    const [f, u, m, g] = spec.soll;
    if (s.fuehrer !== f || s.unterfuehrer !== u || s.mannschaft !== m || s.gesamt !== g) {
      fehler.push(
        `${b.datei}: Stärke ${s.fuehrer}/${s.unterfuehrer}/${s.mannschaft}/${s.gesamt} ≠ Quelle ${f}/${u}/${m}/${g}`,
      );
    }
    if (b.bogen.fahrzeuge.length !== spec.fahrzeuge.reduce((n, x) => n + (x.anzahl ?? 1), 0)) {
      fehler.push(`${b.datei}: Fahrzeugzahl im Bogen weicht von der Spec ab`);
    }
    for (const fz of b.bogen.fahrzeuge) {
      const kurz = fz.typ.freitext ?? "?";
      if (fz.funkrufname?.kennwort.code !== 3) {
        fehler.push(`${b.datei}: ${kurz} führt nicht das Kennwort ROTKREUZ (Code 3)`);
      }
      if (fz.funkrufname?.teile.length !== 3) {
        fehler.push(`${b.datei}: ${kurz} ohne vollständigen Funkrufnamen (drei Teilkennzahlen)`);
      }
      if (fz.funkrufname?.teile[0] !== 0) {
        fehler.push(`${b.datei}: ${kurz} führt nicht die Standortkennzahl 0`);
      }
      if (fz.funkrufname?.ort !== b.ort.einsatzbereich) {
        fehler.push(`${b.datei}: ${kurz} führt nicht den Einsatzbereich „${b.ort.einsatzbereich}"`);
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

const ausgabe = join(wurzel, "examples", "katastrophenschutz", "saarland");
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
  return `| ${b.datei} | ${b.fachdienst} | ${b.kuerzel} | ${b.ort.kreisverband} | ${s.fuehrer}/${s.unterfuehrer}/${s.mannschaft}/${s.gesamt} | ${b.bogen.fahrzeuge.length} | ${spec.fahrzeugeQuellengenau ? "ja" : "nein"} |`;
});
writeFileSync(
  join(ausgabe, "README.md"),
  `# Beispiel-Erfassungsbögen — Katastrophenschutz Saarland

${beispiele.length} generierte Beispiel-Einheiten der Katastrophenschutz-relevanten
Sanitäts- und Betreuungsdienst-Konzeptionen des **DRK-Landesverbandes Saarland
e.V.**

## Warum keine Landesverordnung wie in anderen Ländern

Die saarländische **Katastrophenschutz-Organisationsverordnung** (KatOrgVO
vom 13.10.2014) regelt in § 2 Abs. 1 ausdrücklich nur, dass die oberste
Katastrophenschutzbehörde Stärke, Gliederung und Ausstattung "in gesonderten
Konzeptionen" bestimmt — sie selbst enthält **keine einzige Stärke- oder
Fahrzeugzahl**, anders als z. B. Berlins KatSD-VO oder Baden-Württembergs
VwV KatSD.

Diese "gesonderten Konzeptionen" für Sanitäts- und Betreuungsdienst
(§ 6/§ 7 KatOrgVO) hat das DRK im Saarland öffentlich dokumentiert und mit
echten Stärke- und (teils) Fahrzeugangaben versehen — landesweit einheitlich
für alle sieben DRK-Kreisverbände, beschlossen vom Landesausschuss der
Bereitschaften. Auf diesen Konzeptionen beruhen alle Bögen hier:

* **Sanitätsdienst**: "Die Sanitätsstaffel im DRK Landesverband Saarland
  e.V.", "Der Behandlungsplatz 10 (BHP 10 SAL)", "Der Behandlungsplatz 25
  (BHP 25)" (alle 16.02.2014) sowie "Die Patiententransportkomponenten des
  DRK im Saarland" (17.11.2020, Version 28.09.2024).
* **Betreuungsdienst**: "Mindestanforderungen an Strukturen des
  DRK-Betreuungsdienstes im Landesverband Saarland e.V." (Bundesfassung
  15.10.2011, Saarland-Fassung beschlossen 01.03.2015).

Alle Personen, Standort-Zuordnungen und Kennzeichen sind **fiktiv**.

## Fahrzeuge: quellengenau nur bei sieben von 13 Bögen

> Bei **BHP 25** (Transportkomponente) und den **vier
> Patiententransportkomponenten** (PT-G 5, PT-GA 5, PT-Z 10, PT-ZA 10) sind
> Fahrzeugtyp UND -zahl **wörtlich der Quelle entnommen** und werden beim
> Generieren geprüft (Spalte **Fahrzeuge quellengenau**).
>
> Bei allen anderen Einheiten (Sanitätsstaffel, BHP 10, Betreuungsstaffel/
> -gruppe, BTP 200/500, DRK-Einsatzeinheit) nennt die jeweilige DRK-SAL-
> Konzeption **keine** Fahrzeuge — hier sind die Fahrzeugtypen plausibel nach
> den generischen Ausstattungslisten der KatOrgVO belegt (§ 6 Abs. 4:
> "Gerätewagen-Sanität, Krankentransportwagen, Mannschaftstransportwagen und
> Geräteanhänger"; § 7 Abs. 4: "Betreuungs-Lastkraftwagen, Feldkochherde,
> Mannschaftstransportwagen und Geräteanhänger"). Derselbe Hinweis steht im
> Feld „Sonstiges" jedes betroffenen Bogens.
>
> Der **Betreuer vor Ort (BvO)** führt laut Quelle bewusst kein Fahrzeug.

## Funkrufnamen

Nach der **Verwaltungsvorschrift über Funkrufnamen für nichtpolizeiliche
Behörden und Organisationen mit Sicherheitsaufgaben (npolBOS) im Saarland**
vom 24.02.2014 (in Kraft seit 01.04.2014, erlassen auf Grundlage von § 54
Abs. 2 SBKG):

> \`<Kennwort> <Einsatzbereich> <Standortkennzahl>-<Fahrzeugkennzahl>-<lfd. Nr.>\`
>
> Beispiel der VV: \`ROTKREUZ ST. WENDEL 0-83-1\` (1. RTW des DRK-
> Kreisverbands St. Wendel)

* **Kennwort** DRK = „ROTKREUZ" (Nr. 2.1 der VV).
* **Einsatzbereich** = Gemeindeverband im Klartext (Nr. 2.2); für den
  Regionalverband Saarbrücken genügt laut VV die Bezeichnung
  „REGIONALVERBAND".
* **Standortkennzahl** „0", weil die hier abgebildeten Einheiten
  Kreisverbands-Pools ohne festen Standort sind (VV Nr. 2.3: "Fahrzeuge
  einer Organisation, die keinem Standort zugeordnet werden können ...
  erhalten die Standortkennzahl 0").
* **Fahrzeugkennzahl** nach VV Nr. 2.4.1/2.4.6/2.4.8: KdoW 10, ELW 1 11,
  MTW 18, MTW-Z (Sanitäts-/Betreuungsdienst-Variante) 17, GW-San 61,
  GW-Betreuung 63, GW-Verpflegung 64, NEF 82, RTW 83, KTW 85, LKW 92.
* **Laufende Nummer**, je Fahrzeugkennzahl am Standort neu gezählt.

## Träger

Alle Bögen sind DRK-Kreisverbände des Landesverbandes Saarland e.V., über
sechs Standorte gestreut (Saarbrücken, Saarlouis, Merzig-Wadern,
Neunkirchen, St. Wendel, Homburg/Saarpfalz-Kreis).

Neu erzeugen mit: \`npm run beispiele:kats-sl\` (deterministisch, fester
Zufalls-Seed).

| Datei | Fachdienst | Einheit | DRK-Kreisverband | Stärke | Fahrzeuge | Fahrzeuge quellengenau |
|---|---|---|---|---|---|---|
${zeilen.join("\n")}
`,
);

console.log(`${beispiele.length} Bögen nach ${ausgabe} geschrieben.`);
