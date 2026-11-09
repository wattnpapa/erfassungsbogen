/**
 * Erzeugt Beispiel-Erfassungsbögen für Kreiseinheiten niedersächsischer
 * Kreisfeuerwehren (Kreisfeuerwehrbereitschaften, Technische Einsatzleitungen,
 * Fachzüge und -gruppen auf Kreisebene) als JSON nach
 * examples/feuerwehr/niedersachsen/kreisfeuerwehren/<landkreis>/.
 *
 * Aufruf (Node ≥ 22): npm run beispiele:kreisfeuerwehr-nds
 *
 * Abgebildet sind die Landkreise Ammerland, Diepholz, Nienburg/Weser und
 * Wittmund. Gliederung, Fahrzeuge, Standorte und (wo angegeben) Funkrufnamen
 * stammen von den Seiten der jeweiligen Kreisfeuerwehrverbände; die Adressen
 * stehen bei jedem Landkreis unten in QUELLEN und in der README. Eine Einheit
 * aus mehreren Teileinheiten (Bereitschaft: Führung und Fachzüge) bekommt
 * einen eigenen Ordner mit einem Bogen je Teileinheit; eine Einheit, die als
 * Ganzes ausrückt (TEL, Versorgungszug, Logistikgruppe …), ist ein Bogen.
 *
 * Die Besatzung folgt der Normbesatzung des Fahrzeugs (Trupp 1/2, Staffel 1/5,
 * Gruppe 1/8; dieselben Richtwerte wie die Sitzplatzprüfung der App). Jede
 * Person trägt ihre Ortsfeuerwehr als Dienststelle, die Funktion nennt das
 * Fahrzeug: So steht auf dem Papier, wer mit welchem Fahrzeug von wo kommt.
 * Nennt eine Seite keine Fahrzeuge (Züge der KFB Umwelt Nienburg,
 * Gefahrgutzug Ammerland, Drohnengruppe Nienburg), steht nur das Personal da.
 *
 * Fiktiv sind alle Personen (auch die auf den Seiten namentlich genannten
 * Führungskräfte), die Kennzeichen und die Einsatzaufträge. Funkrufnamen
 * stehen so da, wie die Seiten sie angeben; Diepholz nennt keine, dort sind die
 * örtlichen Kennungen fiktiv.
 *
 * Am Ende läuft eine Selbstprüfung (QR-Roundtrip mit Dienststellen,
 * Sitzplatzbilanz je Bogen); jeder Landkreis-Ordner bekommt eine README.
 */

import { mkdirSync, rmSync, writeFileSync } from "node:fs";
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
} from "@bos/eeb-format/model";
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
} from "@bos/eeb-format/codec";
import { nodeKompressor } from "@bos/eeb-format/qr-node";
import { sitzplaetzeAusFreitext, sitzplatzBilanz } from "@bos/vokabulare/sitzplaetze";
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
const rnd = prng(20261109);

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
  "Alexander", "Andreas", "Arne", "Bastian", "Bernd", "Björn", "Christian", "Daniel",
  "Dennis", "Dirk", "Dominik", "Eike", "Erik", "Fabian", "Felix", "Florian",
  "Frank", "Gerd", "Hannes", "Hauke", "Heiko", "Helge", "Hendrik", "Ingo",
  "Jan", "Jannik", "Jens", "Joachim", "Jonas", "Julian", "Kai", "Karsten",
  "Kevin", "Lars", "Lukas", "Malte", "Marcel", "Marco", "Markus", "Martin",
  "Matthias", "Michael", "Nils", "Ole", "Pascal", "Patrick", "Philipp", "Ralf",
  "Sebastian", "Simon", "Stefan", "Sven", "Thorsten", "Tim", "Tobias", "Torben",
  "Uwe", "Volker", "Werner", "Wilfried",
] as const;
const VORNAMEN_W = [
  "Anja", "Anna", "Antje", "Birgit", "Carina", "Christina", "Frauke", "Gesa",
  "Hanna", "Heike", "Imke", "Jana", "Julia", "Katharina", "Katrin", "Kerstin",
  "Laura", "Lea", "Lena", "Maren", "Melanie", "Merle", "Nadine", "Nicole",
  "Sabine", "Sandra", "Silke", "Sonja", "Svenja", "Tanja", "Wiebke",
] as const;
const NACHNAMEN = [
  "Ahrens", "Bammann", "Barlag", "Behrens", "Blome", "Bösch", "Brüning", "Buschmann",
  "Cordes", "Dreyer", "Ehlers", "Eggers", "Gerken", "Grashorn", "Hagedorn", "Heitmann",
  "Hespe", "Hillmann", "Holle", "Kahrs", "Kastens", "Klöpper", "Kracke", "Lange",
  "Lohmann", "Lüdeke", "Meyer", "Menke", "Möhlmann", "Nienaber", "Oetken", "Plate",
  "Rabe", "Rohlfs", "Schierholz", "Schnakenberg", "Schröder", "Siemers", "Stelljes", "Stöver",
  "Tiemann", "Vehrenkamp", "Wachendorf", "Warnke", "Wendt", "Wilkens", "Windhorst", "Wöhler",
  "Albers", "Bartels", "Dierks", "Evers", "Fricke", "Gieschen", "Harms", "Imsiecke",
  "Klenke", "Lameyer", "Niemeyer", "Rippe", "Scharrelmann", "Thöle", "Wessels", "Wulf",
] as const;

/** Externe/Berufs-Qualifikationen (Freitext) — gelegentlich gestreut. */
const QUALI_POOL = [
  "Berufskraftfahrer (Beruf)",
  "Rettungssanitäter (extern)",
  "Elektrofachkraft (Beruf)",
  "Landwirt — Erfahrung Großgeräte",
  "Motorsägenschein AS Baum I (extern)",
  "Kfz-Mechatroniker (Beruf)",
  "Chemielaborant (Beruf)",
] as const;

// ----------------------------------------------------------------- Modell

const F = R.FUEHRER;
const U = R.UNTERFUEHRER;
const M = R.MANNSCHAFT;

const AGT = "Atemschutzgeräteträger";
const CSA = "CSA-Träger";
const MASCHINIST = "Maschinist";
const SPRECHFUNKER = "Sprechfunker";
const FUEHRUNGSASSISTENT = "Führungsassistent";

const KW_FLORIAN = 2;
const KW_ROTKREUZ = 3;

/** Ein Personal-Platz. `funktion` ohne Fahrzeugzusatz; der kommt beim Bauen dazu. */
interface Platz {
  rolle: R;
  funktion: string;
  quali?: string;
  fe?: FE;
  anzahl?: number;
  /** Dienststelle, wenn sie von der des Fahrzeugs abweicht (Zugführung aus anderer Ortsfeuerwehr). */
  dienststelle?: string;
}

/** Ein Element einer Teileinheit: ein Fahrzeug samt Besatzung oder Personal ohne Fahrzeug. */
interface El {
  /** Fahrzeug-Kurzbezeichnung; fehlt = Personal ohne Fahrzeug (Seite nennt keins). */
  kurz?: string;
  /** Standort, wie die Seite ihn nennt (Ortsfeuerwehr, „TZ", „FTZ", „Kreisfeuerwehr" …). */
  standort: string;
  /** Funkrufname, wie auf der Seite angegeben. */
  funk?: [number, number, number];
  kennwort?: number;
  /** Fahrzeug einer Hilfsorganisation (RTW der SEG). */
  traeger?: "DRK" | "JUH" | "ASB";
  /** Dienststelle der Besatzung, wenn nicht aus dem Standort ableitbar. */
  dienststelle?: string;
  /** Sitzplätze, wenn die Kurzzeichen-Tabelle der App den Typ nicht kennt. */
  plaetze?: number;
  /** Zusatz unter „Änderungen bzw. Sondergerät". */
  zusatz?: string;
  /** Besatzung ausdrücklich statt nach Normbesatzung. */
  crew?: Platz[];
  /** Personal ohne Fahrzeug: Art und Bezeichnung („1. ABC-Gruppe"). */
  art?: "gruppe" | "staffel" | "trupp" | "fuehrungstrupp";
  bezeichnung?: string;
  /** Besatzungsstärke laut Seite (Summe); fehlt = Normbesatzung. */
  staerke?: number;
  /** Führung (Bereitschaftsführung) auf diesem Fahrzeug, statt automatisch vergeben. */
  leiter?: Platz;
  /** Zugführung bzw. Stellvertretung fährt auf diesem Fahrzeug. */
  zf?: boolean;
  stvZf?: boolean;
  /** Dienststelle der Zugführung bzw. Stellvertretung (Seite nennt den Ort). */
  zfAus?: string;
  stvZfAus?: string;
}

interface Teileinheit {
  /** Einheitstyp auf dem Bogen. */
  name: string;
  /** Führung einer Bereitschaft (Bereitschaftsführung, Führungsgruppe/-staffel). */
  fuehrung?: boolean;
  /** Teileinheit mit Gefahrstoff-Auftrag: Trupps als CSA-Träger. */
  gefahrstoffe?: boolean;
  elemente: El[];
  /** Eigener Text für „Sonstiges", vor dem Text des Verbands. */
  sonstiges?: string;
}

interface Verband {
  /** Unterordner (Bereitschaft mit mehreren Bögen) oder Dateiname (ein Bogen). */
  pfad: string;
  /** Erste Hierarchie-Ebene, z. B. „KFB Nord"; fehlt = Landkreis ist die erste Ebene. */
  ebene?: { bezeichnung: string; name: string };
  /** Bezeichnung für README und Ordner-Label. */
  titel: string;
  /** Kurzbeschreibung für „Sonstiges" auf jedem Bogen. */
  beschreibung: string;
  datumIso: string;
  ortAuftrag: string;
  teile: Teileinheit[];
}

interface Landkreis {
  ordner: string;
  /** Name ohne Rechtsform, wie in Funkrufnamen und der Ebene „Landkreis". */
  name: string;
  /** Mit Rechtsform, für Organisationsname und README („Landkreis Nienburg/Weser"). */
  anzeige: string;
  /** Ortsangabe im Funkrufnamen, wenn sie vom Namen abweicht („Hannover Land"). */
  funkOrt?: string;
  kfz: string;
  quellen: string[];
  /** Diepholz: Seite nennt keine Funkrufnamen, die örtlichen Kennungen werden fiktiv vergeben. */
  fiktiveFunkrufnamen?: boolean;
  /** Ausgeschriebene Namen für Standort-Kürzel der Seite. */
  standorte?: Record<string, string>;
  /** Absätze für die README (Besonderheiten, Lesart der Seite). */
  hinweise: string[];
  verbaende: Verband[];
}

// --------------------------------------------------------- Fahrzeugtypen

/** Klartext je Kurzbezeichnung — steht unter „Änderungen bzw. Sondergerät". */
const FZ_LANG: Record<string, string> = {
  "KdoW": "Kommandowagen",
  "ELW 1": "Einsatzleitwagen 1",
  "ELW 2": "Einsatzleitwagen 2",
  "FüKW": "Führungskraftwagen",
  "Krad": "Kraftrad (Kradmelder)",
  "MTW": "Mannschaftstransportwagen",
  "MTF": "Mannschaftstransportfahrzeug",
  "MTF Elo": "Mannschaftstransportfahrzeug (Einsatzleitung Ort)",
  "MZF": "Mehrzweckfahrzeug",
  "TSF": "Tragkraftspritzenfahrzeug",
  "TSF-W": "Tragkraftspritzenfahrzeug mit Wassertank",
  "MLF": "Mittleres Löschfahrzeug",
  "LF": "Löschgruppenfahrzeug (Typ auf der Seite nicht genannt)",
  "LF 8": "Löschgruppenfahrzeug 8",
  "LF 8/6": "Löschgruppenfahrzeug 8/6",
  "LF 10": "Löschgruppenfahrzeug 10",
  "LF 10/6": "Löschgruppenfahrzeug 10/6",
  "LF 16": "Löschgruppenfahrzeug 16",
  "LF 16 TS": "Löschgruppenfahrzeug 16 mit Tragkraftspritze",
  "LF 20": "Löschgruppenfahrzeug 20",
  "LF KatS": "Löschgruppenfahrzeug Katastrophenschutz",
  "HLF": "Hilfeleistungslöschgruppenfahrzeug",
  "HLF 10": "Hilfeleistungslöschgruppenfahrzeug 10",
  "HLF 10/6": "Hilfeleistungslöschgruppenfahrzeug 10/6",
  "HLF 20/20": "Hilfeleistungslöschgruppenfahrzeug 20/20",
  "StLF 20/25": "Staffellöschfahrzeug 20/25",
  "TLF 8": "Tanklöschfahrzeug 8",
  "TLF 8/18": "Tanklöschfahrzeug 8/18",
  "TLF 8/24": "Tanklöschfahrzeug 8/24",
  "TLF 8 W": "Tanklöschfahrzeug 8 W",
  "TLF 16/24": "Tanklöschfahrzeug 16/24",
  "TLF 16/25": "Tanklöschfahrzeug 16/25",
  "TLF 20/24": "Tanklöschfahrzeug 20/24",
  "TLF 2000": "Tanklöschfahrzeug 2000",
  "TLF 3000": "Tanklöschfahrzeug 3000",
  "TLF 4000": "Tanklöschfahrzeug 4000",
  "SW 2000": "Schlauchwagen 2000",
  "SW KatS": "Schlauchwagen Katastrophenschutz",
  "RW": "Rüstwagen",
  "RW 1": "Rüstwagen 1",
  "RW 2": "Rüstwagen 2",
  "GW/Z": "Gerätewagen (Bezeichnung „GW/Z“ wie auf der Seite)",
  "GW-G": "Gerätewagen Gefahrgut",
  "GW-L": "Gerätewagen Logistik",
  "GW-L1": "Gerätewagen Logistik 1",
  "GW-L2": "Gerätewagen Logistik 2",
  "GW-V": "Gerätewagen Versorgung (Feldküche)",
  "Dekon-P": "Dekontaminationsfahrzeug Personen",
  "WLF": "Wechselladerfahrzeug",
  "WLF-K": "Wechselladerfahrzeug mit Ladekran",
  "LKW": "Lastkraftwagen",
  "Teleskoplader": "Teleskoplader (Manitou)",
  "AB Atemschutz": "Abrollbehälter Atemschutz",
  "AB TroLF 750": "Abrollbehälter Trockenlöschmittel 750 kg",
  "AB Rüst/Rettung": "Abrollbehälter Rüst/Rettung",
  "AB Logistik": "Abrollbehälter Logistik (Festzeltgarnituren)",
  "AB Infrastruktur": "Abrollbehälter Infrastruktur",
  "AB Aufenthalt": "Abrollbehälter Aufenthalt (Feldbetten, Decken, Kissen)",
  "Anh": "Anhänger",
  "Anh TEL": "Anhänger Technische Einsatzleitung",
  "Anh Spülmobil": "Anhänger Spülmobil",
  "Anh Kühl": "Kühlanhänger",
  "FKH 57/5": "Feldkochherd 57/5 (Anhänger)",
  "RTW": "Rettungswagen",
};

/** Sitzplätze: Angabe am Element, sonst Kurzzeichen-Tabelle der App. */
function plaetzeVon(el: El): number | undefined {
  if (el.plaetze != null) return el.plaetze;
  if (!el.kurz) return undefined;
  if (/^(AB|Anh|FKH)/.test(el.kurz)) return 0;
  return sitzplaetzeAusFreitext(el.kurz);
}

/** Diesel-Sofortbedarf je Fahrzeug (grobe Richtwerte, Liter). */
function dieselFuer(kurz: string): number {
  if (/^(AB|Anh|FKH|Krad)/.test(kurz)) return 0;
  if (/^(TLF 16|TLF 20|TLF 3000|TLF 4000|WLF|Dekon|ELW 2|GW-V|LKW)/.test(kurz)) return 100;
  if (/^(LF|HLF|StLF|TLF|RW|SW|GW|ELW|MZF|FüKW)/.test(kurz)) return 70;
  return 45;
}

/** Fahrzeugkennung nach OPTA Anlage 2 — nur für die fiktiven Funkrufnamen in Diepholz. */
function fzKennung(kurz: string): number | undefined {
  const k = kurz.replace(/\s+/g, "");
  if (k === "KdoW") return 10;
  if (k === "ELW1") return 11;
  if (k === "MTW") return 17;
  if (/^TSF/.test(k)) return 40;
  if (k === "MLF") return 42;
  if (/^(LF8|LF10|HLF10)/.test(k)) return 43;
  if (/^(LF16|LF20)/.test(k)) return 44;
  if (/^TLF(8|16|2000|3000)/.test(k)) return 21;
  if (/^RW/.test(k)) return 52;
  if (k === "GW-L1") return 64;
  if (k === "GW-L2") return 68;
  return undefined;
}

/** Fiktive, aber deterministische örtliche Kennung: 10–89. */
function oertlicheKennung(ort: string): number {
  let h = 0;
  for (const c of ort) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return (h % 80) + 10;
}

// ------------------------------------------------------------- Helfer Daten

const fz = (kurz: string, standort: string, funk?: [number, number, number], extra: Partial<El> = {}): El => ({
  kurz,
  standort,
  ...(funk ? { funk } : {}),
  ...extra,
});
const p = (rolle: R, funktion: string, extra: Partial<Platz> = {}): Platz => ({ rolle, funktion, ...extra });

// ------------------------------------------------------------------- Daten
//
// Reihenfolge der Teileinheiten und Fahrzeuge wie auf den Seiten. Standort =
// Ortsfeuerwehr ohne „FF"/„OF"/„Feuerwehr"; Kürzel wie „TZ" oder „FTZ" stehen
// in `standorte` des Landkreises ausgeschrieben.

const KFB = (name: string) => ({ bezeichnung: "Bereitschaft", name });
const fuehrungstrupp = (dienststelle: string, extra: Partial<El> = {}): El => ({
  standort: dienststelle, art: "fuehrungstrupp", bezeichnung: "Führungstrupp", dienststelle, ...extra,
});
const gruppeOhneFz = (bezeichnung: string, dienststelle: string, extra: Partial<El> = {}): El => ({
  standort: dienststelle, art: "gruppe", bezeichnung, dienststelle, ...extra,
});

const LANDKREISE: Landkreis[] = [
  // ------------------------------------------------------------- Ammerland
  {
    ordner: "landkreis-ammerland",
    name: "Ammerland",
    anzeige: "Landkreis Ammerland",
    kfz: "WST",
    quellen: [
      "https://www.kreisfeuerwehr-ammerland.de/kreisfeuerwehrbereitschaft/",
      "https://www.kreisfeuerwehr-ammerland.de/fuehrungsgruppe-ammerland-tel/",
      "https://www.kreisfeuerwehr-ammerland.de/fachzug-iuk/",
      "https://www.kreisfeuerwehr-ammerland.de/gefahrgutzug/",
      "https://www.kreisfeuerwehr-ammerland.de/absturzsicherung-abstusi/",
    ],
    standorte: { TZ: "Technische Zentrale Ammerland (Elmendorf)" },
    hinweise: [
      "Die Seite der Bereitschaft spricht von vier Fachzügen, führt aber fünf auf; abgebildet sind alle fünf. Die Funkrufnamen stehen so da, wie die Seite sie nennt. Auf dem MTW jedes Fachzugs sitzt der Zugtrupp (Zugführung, Stellvertretung, zwei Führungsassistenzen, Fahrer).",
      "TEL und Fachzug IuK nutzen ELW 2, MTW und KdoW der Technischen Zentrale, dieselben Fahrzeuge wie die Führungsgruppe der Bereitschaft. Der Gefahrgutzug nennt nur seine acht Gefahrgutgruppen, keine Fahrzeuge; sein Bogen führt deshalb nur Personal. Die Fachgruppe Absturzsicherung ist auf ihrer Seite ein Ausbilderteam ohne eigene Einsatzstärke und fehlt hier.",
    ],
    verbaende: [
      {
        pfad: "kfb",
        ebene: KFB("KFB Ammerland"),
        titel: "Kreisfeuerwehrbereitschaft Ammerland",
        beschreibung: "Kreisfeuerwehrbereitschaft Ammerland: Führungsgruppe (TEL) und die Fachzüge Brandschutz 1, Technische Hilfeleistung, Vegetationsbrandbekämpfung, Brandschutz 2 sowie Verpflegung, Logistik, Eigenschutz. Treffpunkt Technische Zentrale Elmendorf, Anfahrt im Verband.",
        datumIso: "2026-09-14",
        ortAuftrag: "Überörtliche Hilfe Hochwasser Hunte (Stadt Oldenburg) — Deichverteidigung und Lenzen",
        teile: [
          {
            name: "Führungsgruppe",
            fuehrung: true,
            elemente: [
              fz("KdoW", "TZ", [81, 10, 1], { leiter: p(F, "Verbandsführer/-in") }),
              fz("MTW", "TZ", [80, 17, 1]),
              fz("ELW 2", "TZ", [80, 12, 1], { leiter: p(F, "stellv. Verbandsführer/-in") }),
            ],
          },
          {
            name: "Fachzug Brandschutz 1",
            elemente: [
              fz("MTW", "Edewecht", [13, 17, 1], { staerke: 5 }),
              fz("LF KatS", "Apen", [11, 44, 1]),
              fz("LF 8/6", "Edewecht", [13, 44, 1]),
              fz("SW KatS", "TZ", [80, 62, 1]),
            ],
          },
          {
            name: "Fachzug Technische Hilfeleistung",
            elemente: [
              fz("MTW", "Westerstede", [15, 17, 1], { staerke: 5 }),
              fz("HLF 10", "Ohrwege", [12, 46, 7]),
              fz("LF 10", "Bokel-Augustfehn", [11, 45, 2]),
              fz("RW", "Husbäke", [13, 51, 3]),
            ],
          },
          {
            name: "Fachzug Vegetationsbrandbekämpfung",
            elemente: [
              fz("MTW", "Rastede", [14, 17, 1], { staerke: 5 }),
              fz("TLF 3000", "Petersfehn", [12, 21, 8]),
              fz("TLF 8/18", "Friedrichsfehn", [13, 20, 2]),
              fz("TLF 3000", "Ocholt-Howiek", [15, 24, 7]),
              fz("TLF 3000", "Halsbek", [15, 24, 3]),
              fz("GW-L", "Ipwege-Wahnbek", [14, 62, 3]),
            ],
          },
          {
            name: "Fachzug Brandschutz 2",
            elemente: [
              fz("MTW", "Wiefelstede", [16, 17, 1], { staerke: 5 }),
              fz("TLF 20/24", "Wiefelstede", [16, 23, 1]),
              fz("LF 20", "Westerstede", [15, 47, 1]),
              fz("GW-L", "Bad Zwischenahn", [12, 68, 1]),
            ],
          },
          {
            name: "Fachzug Verpflegung, Logistik, Eigenschutz",
            elemente: [
              fz("MTW", "Hollriede", [15, 17, 4], { staerke: 5 }),
              fz("MTW", "Hahn", [14, 17, 2]),
              fz("GW-L", "Jeddeloh II", [13, 46, 4]),
              fz("MTW", "Apen", [11, 19, 1]),
              fz("GW-L", "Apen", [80, 64, 2]),
              fz("MTW", "Spohle", [16, 17, 6]),
              fz("GW-L", "Hollwege", [15, 64, 5]),
              fz("GW-L", "TZ", [80, 64, 1]),
            ],
          },
        ],
      },
      {
        pfad: "technische-einsatzleitung",
        titel: "Technische Einsatzleitung (TEL)",
        beschreibung: "Führungsstab nach FwDV 100 aus Mitgliedern mehrerer Ortsfeuerwehren; bei Alarmierung der TEL rückt immer der ELW 2 aus. Als Führungsgruppe Bestandteil der Kreisfeuerwehrbereitschaft.",
        datumIso: "2026-09-14",
        ortAuftrag: "Großschadenslage Sturm im Landkreis Ammerland — Führungsstelle Technische Zentrale Elmendorf",
        teile: [
          {
            name: "Technische Einsatzleitung (TEL)",
            elemente: [
              fz("ELW 2", "TZ", [80, 12, 1], {
                dienststelle: "Technische Einsatzleitung Ammerland",
                crew: [
                  p(F, "Leiter/-in TEL", { quali: "Verbandsführer" }),
                  p(F, "S1 Personal/Innerer Dienst", { quali: "Zugführer" }),
                  p(F, "S2 Lage", { quali: "Zugführer" }),
                  p(F, "S3 Einsatz", { quali: "Zugführer" }),
                  p(F, "S4 Versorgung", { quali: "Zugführer" }),
                  p(U, "S6 Information und Kommunikation", { quali: "Gruppenführer" }),
                  p(M, "Fahrer/-in", { fe: FE.C }),
                ],
              }),
            ],
          },
        ],
      },
      {
        pfad: "fachzug-iuk",
        titel: "Fachzug IuK",
        beschreibung: "Fachzug Information und Kommunikation (seit 01.08.2021) aus den Fachgruppen ELW 2 und Drohne, dem Kreisbrandmeister unterstellt. Drohnen: DJI Mavic Air 2, DJI Matrice 300 RTK mit H20T.",
        datumIso: "2026-10-05",
        ortAuftrag: "Unterstützung der Einsatzleitung bei einem Moorbrand — Lagefeststellung aus der Luft, Lagedarstellung im ELW 2",
        teile: [
          {
            name: "Fachzug IuK",
            elemente: [
              fz("ELW 2", "TZ", [80, 12, 1], {
                dienststelle: "Ortsfeuerwehr Elmendorf",
                crew: [
                  p(F, "Leiter/-in Fachgruppe ELW 2", { quali: "Zugführer" }),
                  p(U, "Führungsassistent/-in", { quali: FUEHRUNGSASSISTENT }),
                  p(M, "Sprechfunker/-in", { quali: SPRECHFUNKER, anzahl: 4 }),
                  p(M, "Fahrer/-in", { fe: FE.C }),
                ],
              }),
              fz("MTW", "TZ", [80, 17, 1], {
                dienststelle: "Ortsfeuerwehr Aschhausen",
                crew: [
                  p(U, "Leiter/-in Fachgruppe Drohne", { quali: "EU-Fernpilotenzeugnis A2" }),
                  p(M, "Drohnenpilot/-in", { quali: "EU-Fernpilotenzeugnis A2", anzahl: 2 }),
                  p(M, "Bildauswerter/-in", { quali: "EU-Fernpilotenzeugnis A1/A3", anzahl: 2 }),
                  p(M, "Fahrer/-in", { fe: FE.B }),
                ],
              }),
              fz("KdoW", "TZ", [81, 10, 1], {
                crew: [p(U, "Führungsassistent/-in", { quali: FUEHRUNGSASSISTENT }), p(M, "Fahrer/-in", { fe: FE.B })],
              }),
            ],
          },
        ],
      },
      {
        pfad: "gefahrgutzug",
        titel: "Gefahrgutzug",
        beschreibung: "Gefahrgutzug des Landkreises Ammerland aus den Gefahrgutgruppen der Ortsfeuerwehren Apen, Bad Zwischenahn, Edewecht, Rastede, Torsholt, Wiefelstede, Elmendorf und Aschhausen; Grundlage ist der Einsatz- und Alarmplan für ABC-Einsätze. Die Seite nennt keine Fahrzeuge.",
        datumIso: "2026-10-19",
        ortAuftrag: "Gefahrgutunfall auf der A 28 — Leckage an einem Tankfahrzeug, Auffangen und Abdichten",
        teile: [
          {
            name: "Gefahrgutzug",
            gefahrstoffe: true,
            elemente: [
              fuehrungstrupp("Kreisfeuerwehr Ammerland"),
              ...["Apen", "Bad Zwischenahn", "Edewecht", "Rastede", "Torsholt", "Wiefelstede", "Elmendorf", "Aschhausen"].map((o) =>
                gruppeOhneFz(`Gefahrgutgruppe ${o}`, `Ortsfeuerwehr ${o}`),
              ),
            ],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ Cloppenburg
  {
    ordner: "landkreis-cloppenburg",
    name: "Cloppenburg",
    anzeige: "Landkreis Cloppenburg",
    kfz: "CLP",
    quellen: ["https://www.kreisfeuerwehrverband-cloppenburg.de/kreisbereitschaft/"],
    standorte: { LK: "Kreisfeuerwehr Cloppenburg (Fahrzeug des Landkreises)" },
    hinweise: [
      "Die Seite nennt je Fahrzeug Funkrufname, Ortsfeuerwehr und Stärke in der Form „Mannschaft / Führung“ (8 / 1 = Gruppe). Diese Stärken sind übernommen. Zugführung und Stellvertretung kommen aus den Ortsfeuerwehren, die die Seite nennt.",
      "Der 5. Zug (Verpflegung) wird bei Bedarf vom DRK gestellt; die Seite nennt dafür nur Kennzeichen, Funkkennung und Stärke, keinen Fahrzeugtyp und keine Zugführung. Er steht deshalb mit „Fahrzeug DRK“ da, die erste Kraft des ersten Fahrzeugs führt.",
    ],
    verbaende: [
      {
        pfad: "kfb",
        ebene: KFB("KFB Cloppenburg"),
        titel: "Kreisfeuerwehrbereitschaft Cloppenburg",
        beschreibung: "Kreisfeuerwehrbereitschaft Cloppenburg: Führungsstaffel und die Züge Wasserförderung, Wassertransport, Wald und Flächenbrand, Technische Hilfe sowie Verpflegung (bei Bedarf, DRK).",
        datumIso: "2026-08-17",
        ortAuftrag: "Überörtliche Hilfe Vegetationsbrand Landkreis Emsland — Wasserversorgung über lange Wegstrecke",
        teile: [
          {
            name: "Führungsstaffel",
            fuehrung: true,
            elemente: [
              fz("ELW 1", "Lindern", [20, 11, 10], { staerke: 4, leiter: p(F, "Kreisbereitschaftsführer/-in", { dienststelle: "Ortsfeuerwehr Cappeln" }) }),
              fz("ELW 2", "LK", [82, 12, 10], { staerke: 6, leiter: p(F, "stellv. Kreisbereitschaftsführer/-in", { dienststelle: "Ortsfeuerwehr Lindern" }) }),
            ],
          },
          {
            name: "1. Zug Wasserförderung",
            elemente: [
              fz("ELW 1", "Löningen", [21, 11, 10], { staerke: 4, stvZfAus: "Ortsfeuerwehr Essen" }),
              fz("SW 2000", "Löningen", [21, 62, 10], { staerke: 3 }),
              fz("LF 10", "Bevern", [16, 45, 20], { staerke: 9 }),
              fz("LF 20/40", "Cappeln", [13, 47, 10], { staerke: 9 }),
              fz("MTW", "Elsten", [13, 17, 20], { staerke: 6 }),
              fz("GW-L2", "Essen", [16, 68, 10], { staerke: 6, plaetze: 6 }),
              fz("LF KatS", "Schwichteler", [80, 44, 10], { staerke: 9 }),
            ],
          },
          {
            name: "2. Zug Wassertransport",
            elemente: [
              fz("ELW 1", "Lastrup", [19, 11, 10], { staerke: 4, stvZfAus: "Ortsfeuerwehr Lindern" }),
              fz("TLF 16/25", "Lastrup", [19, 24, 10], { staerke: 6, plaetze: 6 }),
              fz("TLF 20/40 SL", "Lindern", [20, 25, 10], { staerke: 3 }),
              fz("TLF 16/24", "Peheim", [22, 25, 20], { staerke: 3 }),
              fz("TLF 16/25", "Molbergen", [22, 23, 10], { staerke: 6, plaetze: 6 }),
              fz("TLF 16/24", "Markhausen", [17, 22, 40], { staerke: 3 }),
            ],
          },
          {
            name: "3. Zug Wald und Flächenbrand",
            elemente: [
              fz("ELW 1", "Friesoythe", [17, 11, 10], { staerke: 4, zfAus: "Ortsfeuerwehr Bösel" }),
              fz("TLF 4000", "Barßel", [11, 26, 10], { staerke: 3 }),
              fz("GW-L2", "Ramsloh", [23, 68, 10], { staerke: 6, plaetze: 6 }),
              fz("MZF", "Ramsloh", [83, 69, 10], { staerke: 2 }),
              fz("SW 2000", "Gehlenberg", [17, 62, 30], { staerke: 3 }),
              fz("TLF 4000", "Bösel", [12, 25, 10], { staerke: 9, plaetze: 9, zusatz: "Gruppenkabine (Stärke laut Seite 8 / 1)" }),
              fz("LF 8/6", "Altenoythe", [17, 45, 20], { staerke: 9 }),
              fz("WLF-K", "Scharrel", [23, 67, 20], { staerke: 3 }),
            ],
          },
          {
            name: "4. Zug Technische Hilfe",
            elemente: [
              fz("ELW 1", "Cloppenburg", [14, 17, 10], { staerke: 4, stvZfAus: "Ortsfeuerwehr Garrel" }),
              fz("LF 16/12", "Emstek", [15, 47, 10], { staerke: 9 }),
              fz("LF 16", "Garrel", [18, 45, 10], { staerke: 9 }),
              fz("RW 2", "Cloppenburg", [14, 52, 10], { staerke: 3 }),
              fz("LF-L", "Cloppenburg", [14, 49, 10], { staerke: 9, zusatz: "Löschgruppenfahrzeug mit Logistik-Beladung (Bezeichnung „LF-L“ wie auf der Seite)" }),
            ],
          },
          {
            name: "5. Zug Verpflegung",
            sonstiges: "Wird bei Bedarf vom DRK gestellt; Zugführung auf der Seite nicht besetzt.",
            elemente: [
              fz("Fahrzeug DRK", "DRK Molbergen", [58, 61, 1], { kennwort: KW_ROTKREUZ, dienststelle: "DRK Molbergen", staerke: 3, zf: true, zusatz: "Fahrzeugtyp auf der Seite nicht genannt; Funkkennung dort „58-61“" }),
              fz("Fahrzeug DRK", "DRK Bösel", [15, 67, 1], { kennwort: KW_ROTKREUZ, dienststelle: "DRK Bösel", staerke: 2, zusatz: "Fahrzeugtyp auf der Seite nicht genannt; Funkkennung dort „15-67“" }),
            ],
          },
        ],
      },
    ],
  },

  // -------------------------------------------------------------- Diepholz
  {
    ordner: "landkreis-diepholz",
    name: "Diepholz",
    anzeige: "Landkreis Diepholz",
    kfz: "DH",
    quellen: ["https://kfv-diepholz.org/kreisfeuerwehr/einheiten-fuer-die-gefahrenabwehr/kreisfeuerwehrbereitschaften"],
    fiktiveFunkrufnamen: true,
    standorte: { Landkreis: "Kreisfeuerwehr Diepholz (Fahrzeug des Landkreises)" },
    hinweise: [
      "Der Landkreis hat drei Kreisfeuerwehrbereitschaften mit je einer Führung und vier Fachzügen. Die Seite nennt Fahrzeuge und Standorte, aber keine Funkrufnamen und keine Stärken: Die Besatzung folgt der Normbesatzung, die örtlichen Kennungen der Funkrufnamen sind fiktiv. SW 2000, GW-G, Dekon-P, MZF und RTW sowie Fahrzeuge des Landkreises stehen ohne Funkrufnamen da.",
      "Berichtigt sind zwei Tippfehler der Seite: „Wteschen“ steht als Wetschen da, „TLF16/24 Barenburg“ bekommt den Standort wie alle anderen Fahrzeuge. Die Seite nennt rund 120 Einsatzkräfte je Bereitschaft.",
    ],
    verbaende: [
      {
        pfad: "kfb-1",
        ebene: KFB("KFB 1"),
        titel: "Kreisfeuerwehrbereitschaft 1",
        beschreibung: "Kreisfeuerwehrbereitschaft 1 des Landkreises Diepholz (Feuerwehren Stuhr, Weyhe, Syke und Bassum): Bereitschaftsführung und die Fachzüge Wasserförderung, Wassertransport, Technische Hilfeleistung und Gefährliche Stoffe.",
        datumIso: "2026-08-10",
        ortAuftrag: "Überörtliche Hilfe Hochwasser Aller (Landkreis Verden) — Deichverteidigung und Lenzen",
        teile: [
          { name: "Bereitschaftsführung", fuehrung: true, elemente: [fz("ELW 1", "Kirchweyhe"), fz("KdoW", "Brinkum", undefined, { zusatz: "Fahrzeug des Landkreises" })] },
          { name: "Fachzug Wasserförderung", elemente: [fz("ELW 1", "Bassum"), fz("LF 16", "Bassum"), fz("MLF", "Dimhausen"), fz("MTW", "Dimhausen"), fz("SW 2000", "Bramstedt")] },
          {
            name: "Fachzug Wassertransport",
            elemente: [fz("MTW", "Heiligenfelde"), fz("LF 20", "Kirchweyhe"), fz("TLF 16/24", "Neubruchhausen"), fz("TLF 16/24", "Gödesdorf"), fz("TLF 16/24", "Fahrenhorst"), fz("TLF 16/25", "Seckenhausen")],
          },
          {
            name: "Fachzug Technische Hilfeleistung",
            elemente: [fz("ELW 1", "Fahrenhorst"), fz("LF 8/6", "Erichshof"), fz("LF 10", "Groß Mackenstedt"), fz("RW 2", "Leeste"), fz("RTW", "DRK-Bereitschaft", undefined, { traeger: "DRK" })],
          },
          {
            name: "Fachzug Gefährliche Stoffe",
            gefahrstoffe: true,
            elemente: [
              fz("ELW 1", "Syke"), fz("GW-G", "Landkreis"), fz("TLF 3000", "Gessel-Ristedt"), fz("MTW", "Gessel-Ristedt"),
              fz("RW 2", "Bassum"), fz("MTW", "Brinkum"), fz("LF 10", "Barrien"), fz("TSF", "Wachendorf"),
            ],
          },
        ],
      },
      {
        pfad: "kfb-2",
        ebene: KFB("KFB 2"),
        titel: "Kreisfeuerwehrbereitschaft 2",
        beschreibung: "Kreisfeuerwehrbereitschaft 2 des Landkreises Diepholz (Feuerwehren Twistringen, Bruchhausen-Vilsen, Schwaförden und Siedenburg): Bereitschaftsführung und die Fachzüge Wasserförderung, Wassertransport, Personalreserve und Logistik.",
        datumIso: "2026-08-24",
        ortAuftrag: "Überörtliche Hilfe Vegetationsbrand Lüneburger Heide — Wasserversorgung über lange Wegstrecke",
        teile: [
          { name: "Bereitschaftsführung", fuehrung: true, elemente: [fz("ELW 1", "Bruchhausen-Vilsen"), fz("KdoW", "Asendorf", undefined, { zusatz: "Fahrzeug des Landkreises" }), fz("TSF", "Ohlendorf")] },
          { name: "Fachzug Wasserförderung", elemente: [fz("ELW 1", "Twistringen"), fz("GW-L2", "Twistringen/Marhorst"), fz("TSF", "Asendorf"), fz("LF 8", "Sudwalde"), fz("LF 16 TS", "Siedenburg")] },
          {
            name: "Fachzug Wassertransport",
            elemente: [fz("TSF", "Cantrup"), fz("TLF 8/18", "Neuenkirchen"), fz("HLF 10/6", "Borstel"), fz("TLF 2000", "Heiligenloh"), fz("TLF 8 W", "Schwaförden"), fz("TLF 16/24", "Schmalförden"), fz("TLF 3000", "Schwarme")],
          },
          { name: "Fachzug Personalreserve", elemente: [fz("TSF", "Brake"), fz("TSF", "Ochtmannien"), fz("TSF", "Anstedt"), fz("TSF", "Maasen"), fz("TSF", "Bockhop")] },
          {
            name: "Fachzug Logistik",
            elemente: [fz("ELW 1", "Asendorf"), fz("TSF-W", "Rüssen"), fz("TSF", "Uenzen"), fz("TSF", "Kleinenborstel"), fz("RW 1", "Bruchhausen-Vilsen"), fz("RTW", "DRK-Bereitschaft", undefined, { traeger: "DRK" })],
          },
        ],
      },
      {
        pfad: "kfb-3",
        ebene: KFB("KFB 3"),
        titel: "Kreisfeuerwehrbereitschaft 3",
        beschreibung: "Kreisfeuerwehrbereitschaft 3 des Landkreises Diepholz (Feuerwehren Sulingen, Barnstorf, Diepholz, Rehden, Kirchdorf, Wagenfeld und Lemförde): Führungsgruppe und die Züge Wasserförderung, Wassertransport, Gefährliche Stoffe und Technische Hilfeleistung.",
        datumIso: "2026-09-07",
        ortAuftrag: "Überörtliche Hilfe Großschadenslage Landkreis Nienburg/Weser — Brandbekämpfung und technische Hilfe",
        teile: [
          { name: "Führungsgruppe", fuehrung: true, elemente: [fz("ELW 1", "Rehden"), fz("KdoW", "Diepholz", undefined, { zusatz: "Fahrzeug des Landkreises" }), fz("TSF", "Marl")] },
          { name: "1. Zug Wasserförderung", elemente: [fz("ELW 1", "Wagenfeld"), fz("LF 20", "Wagenfeld"), fz("LF 20", "Rehden"), fz("SW 2000", "Hemsloh"), fz("TLF 16/25", "Drentwede")] },
          {
            name: "2. Zug Wassertransport",
            elemente: [fz("ELW 1", "Quernheim"), fz("TLF 8/18", "Ströhen"), fz("TLF 8 W", "Sankt Hülfe"), fz("TLF 16/24", "Aschen"), fz("TLF 16/24", "Lembruch"), fz("TLF 8/18", "Barver"), fz("TLF 16/24", "Brockum")],
          },
          {
            name: "3. Zug Gefährliche Stoffe",
            gefahrstoffe: true,
            elemente: [
              fz("ELW 1", "Barnstorf"), fz("MTW", "Cornau"), fz("TSF", "Aldorf"), fz("TSF-W", "Cornau"), fz("MZF", "Diepholz"),
              fz("TSF-W", "Dickel"), fz("LF 8/6", "Wetschen"), fz("TLF 16/24", "Barenburg"), fz("GW-L1", "Wagenfeld"), fz("Dekon-P", "Landkreis"),
            ],
          },
          { name: "4. Zug Technische Hilfeleistung", elemente: [fz("ELW 1", "Groß Lessen"), fz("LF 20", "Sulingen"), fz("TLF 16/24", "Varrel"), fz("TSF-W", "Holzhausen"), fz("RW 1", "Barenburg")] },
        ],
      },
    ],
  },

  // --------------------------------------------- Emsland (Abschnitt Nord)
  {
    ordner: "landkreis-emsland",
    name: "Emsland",
    anzeige: "Landkreis Emsland",
    kfz: "EL",
    quellen: [
      "https://kfv-asd-huemmling.de/index.php/einheiten/kreisbereitschaft",
      "https://kfv-asd-huemmling.de/index.php/einheiten/kreisbereitschaft/1-zug",
      "https://kfv-asd-huemmling.de/index.php/einheiten/kreisbereitschaft/2-zug",
      "https://kfv-asd-huemmling.de/index.php/einheiten/kreisbereitschaft/3-zug",
      "https://kfv-asd-huemmling.de/index.php/einheiten/kreisbereitschaft/4-zug",
      "https://kfv-asd-huemmling.de/index.php/einheiten/iuk-gruppe-tel",
      "https://kfv-asd-huemmling.de/index.php/einheiten/cbrn-nord",
    ],
    standorte: { FTZ: "Feuerwehrtechnische Zentrale Aschendorf-Hümmling" },
    hinweise: [
      "Abgebildet ist der Brandschutzabschnitt Nord (Altkreis Aschendorf-Hümmling, Kreisfeuerwehrverband Aschendorf-Hümmling). Der Landkreis Emsland hat drei Kreisfeuerwehrbereitschaften (Nord, Mitte, Süd); Mitte und Süd fehlen hier.",
      "Die Seiten nennen je Zug die Stärke (etwa 1 / 4 / 22 = 27) und die Fahrzeuge, aber nicht die Besatzung je Fahrzeug. Die Besatzungen sind so verteilt, dass die Summe der Seite getroffen wird. Das Rettungsboot des 3. Zuges steht als Anhänger ohne eigene Besatzung da. Funkrufnamen nennen die Seiten nicht; die Fahrzeuge stehen ohne da.",
      "Die IuK-Gruppe/TEL (48 Mitglieder) nennt keine Fahrzeuge; ihr Bogen führt Leitung und Stabsfunktionen ohne Fahrzeug.",
    ],
    verbaende: [
      {
        pfad: "kfb-nord",
        ebene: KFB("KFB Nord"),
        titel: "Kreisfeuerwehrbereitschaft Nord",
        beschreibung: "Kreisfeuerwehrbereitschaft Nord des Landkreises Emsland (Altkreis Aschendorf-Hümmling): rund 120 Einsatzkräfte mit 20 Fahrzeugen in vier Zügen, ausgelegt auf drei Tage Einsatz.",
        datumIso: "2026-09-21",
        ortAuftrag: "Überörtliche Hilfe Hochwasser Elbe — Sicherung eines Umspannwerks",
        teile: [
          {
            name: "Führung KFB Nord",
            fuehrung: true,
            elemente: [{
              standort: "Kreisfeuerwehr", dienststelle: "Kreisfeuerwehr Emsland, Brandschutzabschnitt Nord", bezeichnung: "Führung",
              crew: [p(F, "Abschnittsleiter/-in", { quali: "Verbandsführer" }), p(F, "KFB-Führer/-in", { quali: "Verbandsführer" }), p(F, "stellv. KFB-Führer/-in", { quali: "Verbandsführer" })],
            }],
            sonstiges: "Die Seite nennt für die Führung keine Fahrzeuge.",
          },
          {
            name: "1. Zug Wassertransport",
            sonstiges: "Stärke laut Seite 1 / 5 / 12 = 18. Leistung: Transport von rund 12.000 Litern Löschwasser.",
            elemente: [
              fz("ELW 1", "Aschendorf", undefined, { staerke: 4, zfAus: "Ortsfeuerwehr Obenende", stvZfAus: "Ortsfeuerwehr Berssen" }),
              fz("LF 10/6", "Berssen", undefined, { staerke: 5 }),
              fz("TLF 20/40", "Papenburg-Untenende", undefined, { staerke: 3 }),
              fz("TLF 16/25", "Esterwegen", undefined, { staerke: 3 }),
              fz("TLF 16/25", "Spahnharrenstätte", undefined, { staerke: 3 }),
            ],
          },
          {
            name: "2. Zug Wasserförderung",
            sonstiges: "Stärke laut Seite 1 / 4 / 20 = 25. Leistung: Wasserförderung über lange Wegstrecken, rund 3.000 m B-Leitung und 4 FP 8/8.",
            elemente: [
              fz("ELW 1", "Werlte", undefined, { staerke: 4, zfAus: "Ortsfeuerwehr Aschendorf" }),
              fz("LF 16 TS", "Lathen", undefined, { staerke: 9 }),
              fz("LF 8", "Lorup", undefined, { staerke: 9 }),
              fz("SW 2000", "Werlte", undefined, { staerke: 3 }),
            ],
          },
          {
            name: "3. Zug Technische Hilfeleistung",
            sonstiges: "Stärke laut Seite 1 / 4 / 22 = 27. Leistung: technische Hilfeleistung größeren Umfangs.",
            elemente: [
              fz("MZF", "Heede", undefined, { staerke: 6, zfAus: "Ortsfeuerwehr Dersum", stvZfAus: "Ortsfeuerwehr Spahnharrenstätte" }),
              fz("LF 8", "Dersum", undefined, { staerke: 9 }),
              fz("LF 10/6", "Börger", undefined, { staerke: 9 }),
              fz("RW 2", "Dörpen", undefined, { staerke: 3 }),
              fz("Anh Rettungsboot", "Rhede", undefined, { zusatz: "Feuerwehr-Rettungsboot" }),
            ],
          },
          {
            name: "4. Zug Logistik und Verpflegung",
            sonstiges: "Stärke laut Seite 1 / 6 / 36 = 43. Aufgaben: Versorgung, Verpflegung, Verkehrslenkung, Unterstützung der Züge 1 bis 3.",
            elemente: [
              fz("ELW 1", "Obenende", undefined, { staerke: 4 }),
              fz("LF 10/6", "Lahn", undefined, { staerke: 9 }),
              fz("LF 10/6", "Surwold", undefined, { staerke: 9 }),
              fz("LF 8/6", "Hilkenbrook", undefined, { staerke: 9 }),
              fz("LKW Dekon", "FTZ", undefined, { staerke: 9, zusatz: "mit Anhänger" }),
              fz("GW", "MHD Papenburg", undefined, { staerke: 3, dienststelle: "Malteser Hilfsdienst Papenburg", zusatz: "mit Anhänger" }),
            ],
          },
        ],
      },
      {
        pfad: "iuk-gruppe-tel",
        titel: "IuK-Gruppe / TEL Nord",
        beschreibung: "Technische Einsatzleitung Feuerwehr Nord mit IuK-Gruppe, gegründet 11.09.2001, 48 Mitglieder aus den Feuerwehren der Samtgemeinden im Altkreis Aschendorf-Hümmling. Die Seite nennt keine Fahrzeuge.",
        datumIso: "2026-10-12",
        ortAuftrag: "Brand auf einem Werftgelände in Papenburg — Einsatzleitung, Ordnung des Raumes, Einsatzdokumentation",
        teile: [
          {
            name: "IuK-Gruppe / TEL",
            elemente: [{
              standort: "TEL Nord", dienststelle: "IuK-Gruppe / TEL Nord", bezeichnung: "TEL",
              crew: [
                p(F, "Leiter/-in IuK-Gruppe/TEL", { quali: "Verbandsführer" }),
                p(F, "stellv. Leiter/-in", { quali: "Zugführer", anzahl: 2 }),
                p(U, "Sachgebiet S1", { quali: "Gruppenführer" }),
                p(U, "Sachgebiet S2", { quali: "Gruppenführer" }),
                p(U, "Sachgebiet S3", { quali: "Gruppenführer" }),
                p(U, "Sachgebiet S4", { quali: "Gruppenführer" }),
                p(M, "Sprechfunker/-in", { quali: SPRECHFUNKER, anzahl: 4 }),
                p(M, "Führungsgehilfe/-in (Lagekarte, Einsatztagebuch)", { anzahl: 2 }),
              ],
            }],
          },
        ],
      },
      {
        pfad: "cbrn-nord",
        ebene: { bezeichnung: "Einheit", name: "CBRN-Nord" },
        titel: "CBRN-Einheit Nord",
        beschreibung: "CBRN-Einheit Nord: rund 60 Kräfte mit 7 Fahrzeugen aus Ortsfeuerwehren, Landkreis und Bund, eingesetzt in der Regel im Abschnitt Emsland-Nord; Komponenten CBRN-Einsatz, Dekontamination, Messen/Spüren.",
        datumIso: "2026-10-26",
        ortAuftrag: "Gefahrgutunfall Bahnstrecke Papenburg — Leckage, Dekontamination der Einsatzkräfte, Messfahrten",
        teile: [
          {
            name: "Gefahrgutzug Emsland Nord",
            gefahrstoffe: true,
            elemente: [
              fz("ELW 1", "Papenburg", undefined, { zfAus: "Ortsfeuerwehr Papenburg-Untenende" }),
              fz("GW-G", "Papenburg"),
              fz("MTW", "Papenburg"),
              fz("LF 10/6", "Kluse", undefined, { zusatz: "mit Anhänger Gefahrgut" }),
              fz("TLF 16/24", "Sustrum"),
            ],
            sonstiges: "Stellvertretende Zugführung laut Seite noch offen.",
          },
          {
            name: "Gruppe Dekontamination",
            gefahrstoffe: true,
            elemente: [fz("GW Dekon P1", "Werpeloh", undefined, {
              plaetze: 6, zusatz: "Fahrzeug des Bundes; beheiztes Duschzelt",
              crew: [p(F, "Gruppenführer/-in"), p(U, "stellv. Gruppenführer/-in", { dienststelle: "Ortsfeuerwehr Lathen" }), p(M, "Maschinist/-in", { quali: MASCHINIST, fe: FE.C }), p(M, "Dekon-Trupp", { quali: CSA, anzahl: 3 })],
            })],
            sonstiges: "Gruppenführung aus Werpeloh, Stellvertretung aus Lathen.",
          },
          {
            name: "Gruppe Messen und Spüren",
            gefahrstoffe: true,
            elemente: [fz("GW Messtechnik", "Werlte", undefined, {
              plaetze: 4,
              crew: [p(F, "Gruppenführer/-in"), p(U, "stellv. Gruppenführer/-in", { dienststelle: "Ortsfeuerwehr Surwold" }), p(M, "Messtrupp", { quali: "ABC-Erkunder", anzahl: 2 })],
            })],
            sonstiges: "Gruppenführung aus Werlte, Stellvertretung aus Surwold.",
          },
        ],
      },
    ],
  },

  // --------------------------------------------------------- Nienburg/Weser
  {
    ordner: "landkreis-nienburg",
    name: "Nienburg",
    anzeige: "Landkreis Nienburg/Weser",
    kfz: "NI",
    quellen: [
      "https://www.kfv-nienburg.de/einheiten/kfb-nord/",
      "https://www.kfv-nienburg.de/einheiten/kfb-sued/",
      "https://www.kfv-nienburg.de/einheiten/kfb-umwelt/",
      "https://www.kfv-nienburg.de/einheiten/tel/",
      "https://www.kfv-nienburg.de/einheiten/drohnengruppe-tel/",
      "https://www.kfv-nienburg.de/einheiten/abc-zug/",
      "https://www.kfv-nienburg.de/einheiten/fachzug-ruest-rettung/",
      "https://www.kfv-nienburg.de/einheiten/versorgungszug/",
      "https://www.kfv-nienburg.de/einheiten/logistikgruppe/",
    ],
    standorte: {
      FTZ: "Feuerwehrtechnische Zentrale Nienburg",
      TEL: "Technische Einsatzleitung Nienburg",
      Kreisfeuerwehr: "Kreisfeuerwehr Nienburg/Weser",
      KJF: "Kreisjugendfeuerwehr Nienburg/Weser",
    },
    hinweise: [
      "Die Funkrufnamen der KFB Nord stehen so da, wie die Seite sie nennt („FloNi 80-79-1“). Die KFB Süd nennt keine. Fahrzeugtypen ohne Nummer auf der Seite („LF Heemsen“, „HLF Nendorf“) stehen ohne Nummer da; „GW-Logostik“ ist als GW-L berichtigt.",
      "Die Züge I bis III der KFB Umwelt stellen laut Seite je mindestens zwei Gruppen für den ABC-Einsatz und einen Führungstrupp; Fahrzeuge nennt die Seite nicht, die Bögen führen nur Personal. Zug 4 ist der ABC-Zug mit Geräteeinheit; die Angaben der eigenen ABC-Zug-Seite (40 Kräfte, 8 Fahrzeuge, 4 Abrollbehälter) stehen dort unter „Sonstiges“.",
      "Beim Fachzug Rüst/Rettung fährt der ABC-Zug den Wechsellader mit dem Abrollbehälter, die beteiligten Ortsfeuerwehren kommen mit ihren Löschgruppenfahrzeugen, deren Typ die Seite nicht nennt. Die Drohnengruppe nennt kein eigenes Fahrzeug.",
    ],
    verbaende: [
      {
        pfad: "kfb-nord",
        ebene: KFB("KFB Nord"),
        titel: "Kreisfeuerwehrbereitschaft Nord",
        beschreibung: "Kreisfeuerwehrbereitschaft Nord (I) des Landkreises Nienburg/Weser: Führungsstaffel mit TEL und die Fachzüge Wasserförderung, Wassertransport, Technische Hilfeleistung und Brandbekämpfung.",
        datumIso: "2026-08-31",
        ortAuftrag: "Überörtliche Hilfe Hochwasser Innerste (Landkreis Hildesheim) — Deichverteidigung und Wasserförderung",
        teile: [
          {
            name: "Führungsstaffel",
            fuehrung: true,
            elemente: [
              fz("Krad", "FTZ", [80, 79, 1], { plaetze: 1 }),
              fz("Krad", "FTZ", [80, 79, 2], { plaetze: 1 }),
              fz("MTW", "FTZ", [80, 17, 1]),
              fz("MTW", "Haßbergen", [12, 17, 4]),
              fz("FüKW", "TEL", [85, 14, 1], { staerke: 4 }),
              fz("ELW 2", "TEL", [85, 12, 1]),
              fz("RTW", "DRK SEG Nienburg", [44, 85, 1], { traeger: "DRK", kennwort: KW_ROTKREUZ }),
            ],
          },
          {
            name: "1. Fachzug Wasserförderung",
            elemente: [
              fz("LF 16 TS", "Buchhorst-Behlingen"), fz("LF 8", "Rodewald"), fz("LF 10/6", "Erichshagen-Wölpe"), fz("TSF", "Wenden"),
              fz("TSF", "Gandesbergen"), fz("GW-L2", "Steimbke"), fz("MTF", "Wendenborstel"),
            ],
          },
          {
            name: "2. Fachzug Wassertransport",
            elemente: [
              fz("MTW", "Eystrup", [10, 11, 4]), fz("TLF 8/24", "Linsburg", [18, 21, 2]), fz("TLF 8/24", "Holte-Langeln", [14, 21, 5]),
              fz("TLF 16/24", "Holtorf", [16, 21, 3]), fz("TLF 16/25", "Hassel", [10, 21, 7]),
              fz("TSF", "Hämelhausen", [10, 40, 6], { zusatz: "Pumpenfahrzeug" }), fz("TLF 8", "Wienbergen", [10, 20, 18]),
            ],
          },
          {
            name: "3. Fachzug Technische Hilfeleistung",
            elemente: [
              fz("ELW 1", "Marklohe", [14, 11, 1]), fz("HLF 20/20", "Wietzen", [14, 48, 10]), fz("GW/Z", "Drakenburg", [12, 51, 2]),
              fz("RTW", "DRK SEG Landesbergen", [45, 85, 1], { traeger: "DRK", kennwort: KW_ROTKREUZ }), fz("LF 10/6", "Marklohe", [14, 45, 7]),
            ],
          },
          {
            name: "4. Fachzug Brandbekämpfung",
            elemente: [
              fz("ELW 1", "Gadesbünden", [12, 11, 3]), fz("LF", "Heemsen", [12, 48, 5]), fz("LF", "Langendamm", [16, 45, 4]),
              fz("TSF", "Rohrsen", [12, 40, 6]), fz("TSF", "Wechold", [10, 40, 17]), fz("TSF", "Magelsen", [10, 40, 13]), fz("TSF", "Bötenberg", [14, 40, 4]),
            ],
          },
        ],
      },
      {
        pfad: "kfb-sued",
        ebene: KFB("KFB Süd"),
        titel: "Kreisfeuerwehrbereitschaft Süd",
        beschreibung: "Kreisfeuerwehrbereitschaft Süd (II) des Landkreises Nienburg/Weser: Technische Einsatzleitung und Führungsgruppe sowie die Fachzüge Wasserförderung, Wassertransport, Technische Hilfeleistung und Logistik & Personalreserve.",
        datumIso: "2026-09-28",
        ortAuftrag: "Überörtliche Hilfe Moorbrand Landkreis Diepholz — Brandbekämpfung und Wasserversorgung",
        teile: [
          {
            name: "Technische Einsatzleitung und Führungsgruppe",
            fuehrung: true,
            elemente: [
              fz("ELW 1", "TEL"), fz("ELW 2", "TEL"), fz("MTW", "FTZ"), fz("MTW", "Warmsen"),
              fz("Krad", "Kreisfeuerwehr", undefined, { plaetze: 1 }), fz("Krad", "Kreisfeuerwehr", undefined, { plaetze: 1 }),
            ],
          },
          {
            name: "1. Fachzug Wasserförderung",
            elemente: [
              fz("MTF Elo", "Raddestorf"), fz("MTW", "Essern"), fz("TSF-W", "Sapelloh"), fz("TSF-W", "Lohhof"), fz("TSF-W", "Harrienstedt"),
              fz("TSF", "Hoysinghausen"), fz("LF 10/6", "Diepenau"), fz("SW 2000", "Uchte"), fz("GW-L", "Münchehagen"),
            ],
          },
          {
            name: "2. Fachzug Wassertransport",
            elemente: [
              fz("MTF", "Landesbergen", undefined, { zf: true }), fz("TLF 8/18", "Loccum"), fz("TLF 3000", "Bohnhorst"), fz("TLF 4000", "Stolzenau"),
              fz("TLF 3000", "Liebenau"), fz("TSF-W", "Brokeloh"), fz("TLF 2000", "Leese"),
            ],
          },
          {
            name: "3. Fachzug Technische Hilfeleistung",
            elemente: [fz("HLF", "Nendorf"), fz("TSF", "Bruchhagen"), fz("HLF", "Deblinghausen"), fz("GW-L", "Steyerberg"), fz("HLF", "Husum"), fz("MLF", "Bühren")],
          },
          {
            name: "4. Fachzug Logistik & Personalreserve",
            elemente: [
              fz("MTW", "Rehburg"), fz("HLF", "Rehburg"), fz("TSF", "Müsleringen"), fz("TSF", "Schinna"), fz("TSF", "Leeseringen"),
              fz("RTW", "JUH Landesbergen", undefined, { traeger: "JUH" }), fz("RTW", "ASB Rehburg", undefined, { traeger: "ASB" }),
            ],
          },
        ],
      },
      {
        pfad: "kfb-umwelt",
        ebene: KFB("KFB Umwelt"),
        titel: "Kreisfeuerwehrbereitschaft Umwelt",
        beschreibung: "Kreisfeuerwehrbereitschaft Umwelt des Landkreises Nienburg/Weser (Gefahrstoffkonzept seit 08.05.2018): Züge I Nord, II Mitte und III Süd mit je mindestens zwei ABC-Gruppen und einem Führungstrupp, Zug 4 als ABC-Zug mit Geräteeinheit.",
        datumIso: "2026-10-08",
        ortAuftrag: "Gefahrstoffaustritt in einem Gewerbebetrieb in Nienburg — Menschenrettung unter CSA, Dekontamination, Messen",
        teile: [
          {
            name: "Bereitschaftsführung Umwelt",
            fuehrung: true,
            elemente: [{
              standort: "Kreisfeuerwehr", bezeichnung: "Bereitschaftsführung",
              crew: [p(F, "Kreisbereitschaftsführer/-in Umwelt", { quali: "Verbandsführer" }), p(F, "stellv. Kreisbereitschaftsführer/-in Umwelt", { quali: "Verbandsführer" })],
            }],
            sonstiges: "Die Seite nennt für die Bereitschaftsführung keine Fahrzeuge.",
          },
          {
            name: "Zug I Nord",
            gefahrstoffe: true,
            sonstiges: "Zuständig im ersten Abmarsch: Samtgemeinden Grafschaft Hoya und Weser-Aue.",
            elemente: [
              fuehrungstrupp("Samtgemeinde Grafschaft Hoya"),
              gruppeOhneFz("1. ABC-Gruppe", "Samtgemeinde Grafschaft Hoya"),
              gruppeOhneFz("2. ABC-Gruppe", "Samtgemeinde Weser-Aue"),
            ],
          },
          {
            name: "Zug II Mitte",
            gefahrstoffe: true,
            sonstiges: "Zuständig im ersten Abmarsch: Stadt Nienburg/Weser, Samtgemeinden Steimbke und Heemsen. Stellvertretende Zugführung auf der Seite nicht genannt.",
            elemente: [
              fuehrungstrupp("Stadt Nienburg/Weser", { crew: [p(F, "Zugführer/-in"), p(M, "Führungsassistent/-in", { quali: FUEHRUNGSASSISTENT }), p(M, "Melder/-in", { quali: SPRECHFUNKER })] }),
              gruppeOhneFz("1. ABC-Gruppe", "Samtgemeinde Steimbke"),
              gruppeOhneFz("2. ABC-Gruppe", "Samtgemeinde Heemsen"),
            ],
          },
          {
            name: "Zug III Süd",
            gefahrstoffe: true,
            sonstiges: "Zuständig im ersten Abmarsch: Stadt Rehburg-Loccum, Samtgemeinde Mittelweser, Flecken Steyerberg, Samtgemeinde Uchte.",
            elemente: [
              fuehrungstrupp("Samtgemeinde Mittelweser"),
              gruppeOhneFz("1. ABC-Gruppe", "Stadt Rehburg-Loccum"),
              gruppeOhneFz("2. ABC-Gruppe", "Samtgemeinde Uchte"),
            ],
          },
          {
            name: "Zug 4 ABC-Zug und Geräteeinheit",
            gefahrstoffe: true,
            sonstiges: "Der ABC-Zug hat laut seiner Seite 40 aktive Einsatzkräfte, 8 Fahrzeuge, 4 Abrollbehälter und 2 Anhänger (Standorte FTZ Nienburg und Gewerbegebiet Lemke); Aufgaben: Messen, Spüren, Proben nehmen, Dekontamination, Führungsunterstützung, Betreuung des AB Rüst/Rettung, Tierseuchenanlage. Abgebildet ist die Geräteeinheit, die die Seite der KFB Umwelt nennt.",
            elemente: [
              fz("GW-G", "FTZ", undefined, {
                crew: [p(F, "Zugführer/-in ABC-Zug", { quali: "Zugführer" }), p(M, "Maschinist/-in", { quali: MASCHINIST, fe: FE.C }), p(M, "Messtrupp", { quali: "ABC-Erkunder" })],
              }),
              fz("WLF", "Nienburg", undefined, {
                crew: [p(U, "Gruppenführer/-in Geräteeinheit"), p(M, "Maschinist/-in", { quali: MASCHINIST, fe: FE.CE }), p(M, "Gerätewart/-in Atemschutz", { quali: "Atemschutzgerätewart" })],
              }),
              fz("AB Atemschutz", "Nienburg"),
              fz("GW-L", "Nienburg", undefined, { zusatz: "trägt den AB TroLF 750" }),
              fz("AB TroLF 750", "Nienburg"),
            ],
          },
        ],
      },
      {
        pfad: "technische-einsatzleitung",
        titel: "Technische Einsatzleitung (TEL)",
        beschreibung: "Technische Einsatzleitung des Landkreises Nienburg/Weser (seit 1996 eine TEL für den ganzen Landkreis) aus Führungsgruppe und Funktionsgruppe; handelt im Katastrophenfall im Auftrag des Landkreises nach NKatSG, unterhalb der Katastrophenschwelle für die Kreisfeuerwehr. Fahrzeuge wie auf der Seite der KFB Nord.",
        datumIso: "2026-10-01",
        ortAuftrag: "Flächenlage Starkregen im Landkreis Nienburg/Weser — Koordination der Einsatzkräfte, Verbindung zur Leitstelle",
        teile: [
          {
            name: "Technische Einsatzleitung (TEL)",
            elemente: [
              fz("FüKW", "TEL", [85, 14, 1], {
                crew: [p(F, "Leiter/-in TEL", { quali: "Verbandsführer" }), p(F, "S3 Einsatz", { quali: "Zugführer" }), p(U, "S2 Lage", { quali: "Zugführer" }), p(M, "Fahrer/-in", { fe: FE.C1 })],
              }),
              fz("ELW 2", "TEL", [85, 12, 1], {
                crew: [
                  p(U, "S1 Personal/Innerer Dienst", { quali: "Zugführer" }),
                  p(U, "S4 Versorgung", { quali: "Zugführer" }),
                  p(U, "S6 Information und Kommunikation", { quali: "Gruppenführer" }),
                  p(M, "Sachbearbeiter/-in Lage (Einsatztagebuch)"),
                  p(M, "Sprechfunker/-in", { quali: SPRECHFUNKER, anzahl: 2 }),
                  p(M, "Fahrer/-in", { fe: FE.C }),
                ],
              }),
            ],
          },
        ],
      },
      {
        pfad: "drohnengruppe-tel",
        titel: "Drohnengruppe der TEL",
        beschreibung: "Drohnengruppe der Technischen Einsatzleitung (gegründet Januar 2019, etwa 20 Mitglieder), auch ohne die gesamte TEL alarmierbar. Einsatzdrohne DJI Matrice M400 mit Wärmebildkamera Zenmuse H30T und Suchscheinwerfer Zenmuse S1, geflogen mit Pilot und Operator. Die Seite nennt kein Fahrzeug.",
        datumIso: "2026-10-01",
        ortAuftrag: "Personensuche in einem Waldgebiet bei Steyerberg — Wärmebildsuche aus der Luft",
        teile: [
          {
            name: "Drohnengruppe",
            elemente: [{
              standort: "TEL", bezeichnung: "Drohnengruppe",
              crew: [
                p(F, "Gruppenführer/-in", { quali: "EU-Fernpilotenzeugnis A2" }),
                p(U, "stellv. Gruppenführer/-in", { quali: "EU-Fernpilotenzeugnis A2" }),
                p(M, "Drohnenpilot/-in", { quali: "EU-Fernpilotenzeugnis A2", anzahl: 3 }),
                p(M, "Operator/-in (Bildauswerter)", { anzahl: 3 }),
                p(M, "Sprechfunker/-in", { quali: SPRECHFUNKER }),
              ],
            }],
          },
        ],
      },
      {
        pfad: "fachzug-ruest-rettung",
        titel: "Fachzug Rüst/Rettung",
        beschreibung: "Fachzug für den Abrollbehälter Rüst/Rettung (FTZ Nienburg) aus den Feuerwehren Wietzen, Buchhorst-Behlingen-Mehlbergen, Balge-Holzbalge-Sebbenhausen, Steyerberg und Deblinghausen; medizinische Komponente im MANV-Konzept ab MANV-Stufe 2 mit drei Zelten, Abstützsystem, hydraulischem Rettungsgerät und Hebekissen bis 54 t.",
        datumIso: "2026-10-22",
        ortAuftrag: "Busunfall auf der B 215 — technische Rettung, Patientenablage in Zelten",
        teile: [
          {
            name: "Fachzug Rüst/Rettung",
            elemente: [
              fz("LF", "Wietzen", undefined, { zf: true }),
              fz("LF", "Buchhorst-Behlingen-Mehlbergen"),
              fz("LF", "Balge-Holzbalge-Sebbenhausen"),
              fz("LF", "Steyerberg", undefined, { stvZf: true }),
              fz("LF", "Deblinghausen"),
              fz("WLF", "FTZ", undefined, {
                dienststelle: "ABC-Zug Landkreis Nienburg/Weser",
                crew: [p(U, "Fahrzeugführer/-in (Materialausgabe)"), p(M, "Maschinist/-in", { quali: MASCHINIST, fe: FE.CE })],
              }),
              fz("AB Rüst/Rettung", "FTZ"),
            ],
          },
        ],
      },
      {
        pfad: "versorgungszug",
        titel: "Versorgungszug",
        beschreibung: "Versorgungszug der Kreisfeuerwehr (Standort Feuerwehrhaus Wietzen, seit 1971), Personal aus Feuerwehren von Hoya bis Winzlar. Gerät: 4 Feldkochherde; GW-Versorgung mit 150-l-Kochkessel, Konvektomat, Kippbratpfanne, Kühlzelle, Geschirrspüler.",
        datumIso: "2026-08-31",
        ortAuftrag: "Verpflegung der Kreisfeuerwehrbereitschaften im Hochwassereinsatz, rund 250 Portionen je Mahlzeit",
        teile: [
          {
            name: "Versorgungszug",
            elemente: [
              fz("MTW", "Wietzen", undefined, {
                zusatz: "VW-Bus, Baujahr 1997",
                crew: [p(F, "Zugführer/-in", { quali: "Zugführer" }), p(M, "Feuerwehrkoch/-köchin", { quali: "Koch (Beruf)", anzahl: 4 }), p(M, "Fahrer/-in", { fe: FE.BE })],
              }),
              fz("GW-V", "Wietzen", undefined, {
                zusatz: "MAN, Baujahr 2013",
                crew: [p(U, "stellv. Zugführer/-in"), p(M, "Feuerwehrkoch/-köchin"), p(M, "Fahrer/-in", { fe: FE.C })],
              }),
              fz("LKW", "Wietzen", undefined, {
                plaetze: 3, zusatz: "Mercedes-Benz 811, 7,5 t, Ladebordwand",
                crew: [p(M, "Fahrer/-in", { fe: FE.C1E }), p(M, "Feuerwehrkoch/-köchin")],
              }),
              fz("Anh Spülmobil", "Wietzen"),
              fz("Anh Kühl", "Wietzen"),
            ],
          },
        ],
      },
      {
        pfad: "logistikgruppe",
        titel: "Logistikgruppe",
        beschreibung: "Logistikgruppe der Kreisfeuerwehr (18 Mitglieder, überwiegend aus dem Brandschutzabschnitt Nord; 10 mit Berechtigung für den Teleskoplader, 8 mit Fahrerlaubnis C/CE). Aufgaben: Aufenthalt der Einsatzkräfte, Unterstützung des Verpflegungstrupps, Notstrom. Material: 80 Festzeltgarnituren, 130 Feldbetten (+75 Reserve der KJF).",
        datumIso: "2026-08-31",
        ortAuftrag: "Einrichtung eines Bereitstellungsraums mit Feldbetten für die Kreisfeuerwehrbereitschaften",
        teile: [
          {
            name: "Logistikgruppe",
            elemente: [
              fz("MTW", "Stöckse", undefined, {
                crew: [p(F, "Gruppenführer/-in"), p(M, "Fahrer/-in", { fe: FE.B }), p(M, "Helfer/-in Logistik", { anzahl: 2 })],
              }),
              fz("MTW", "KJF", undefined, {
                crew: [p(U, "stellv. Gruppenführer/-in"), p(M, "Fahrer/-in", { fe: FE.B })],
              }),
              fz("WLF", "Kreisfeuerwehr", undefined, {
                zusatz: "mit Anhänger",
                crew: [p(M, "Maschinist/-in", { quali: MASCHINIST, fe: FE.CE }), p(M, "Helfer/-in Logistik", { fe: FE.C })],
              }),
              fz("Teleskoplader", "Kreisfeuerwehr", undefined, {
                plaetze: 1,
                crew: [p(M, "Teleskopladerfahrer/-in", { quali: "Bedienberechtigung Teleskoplader" })],
              }),
              fz("AB Logistik", "Kreisfeuerwehr"),
              fz("AB Infrastruktur", "Kreisfeuerwehr"),
              fz("AB Aufenthalt", "Kreisfeuerwehr"),
              fz("Anh", "KJF"),
            ],
          },
        ],
      },
    ],
  },

  // -------------------------------------------------------------- Schaumburg
  {
    ordner: "landkreis-schaumburg",
    name: "Schaumburg",
    anzeige: "Landkreis Schaumburg",
    kfz: "SHG",
    quellen: [
      "https://www.kfv-schaumburg.de/m/seite/429425/kreisfeuerwehrbereitschaften.html",
      "https://www.kfv-schaumburg.de/m/seite/429440/nord.html",
      "https://daten2.verwaltungsportal.de/dateien/seitengenerator/6ee23f349a8eb1e180922ad9c7f8775f197754/kfb_nord.pdf",
      "https://www.kfv-schaumburg.de/m/seite/429441/s%C3%BCd.html",
    ],
    standorte: { Kreisfeuerwehr: "Kreisfeuerwehr Schaumburg" },
    hinweise: [
      "Zwei Kreisfeuerwehrbereitschaften nach den Brandschutzabschnitten Nord und Süd, je rund 130 Einsatzkräfte. Grundlage sind die Organigramme auf den Seiten Nord und Süd. Für Nord liegt zusätzlich eine Liste (PDF) mit Funkrufnamen und Besatzungsstärken je Fahrzeug vor; beides ist übernommen, wo das Fahrzeug im Organigramm steht.",
      "Organigramm und PDF der KFB Nord weichen ab: Im 2. Zug steht im Organigramm ein TLF 16/25 Meerbeck-Niedernwöhren, im PDF ein GW-Z; die Führung hat im Organigramm KdoW und ELW 1 Meerbeck-Niedernwöhren, im PDF zwei ELW 1. Abgebildet ist das Organigramm. Die KFB Süd nennt keine Funkrufnamen und Stärken; dort gilt die Normbesatzung. Fernmeldezug und Team Presse hängen in beiden Organigrammen an der Bereitschaftsführung und fehlen hier.",
    ],
    verbaende: [
      {
        pfad: "kfb-nord",
        ebene: KFB("KFB Nord"),
        titel: "Kreisfeuerwehrbereitschaft Nord",
        beschreibung: "Kreisfeuerwehrbereitschaft Nord des Landkreises Schaumburg (Samtgemeinden Lindhorst, Nenndorf, Niedernwöhren, Rodenberg, Sachsenhagen, Stadt Stadthagen): Führung mit Kradmeldern, die Fachzüge Brandbekämpfung/besondere Aufgaben (zwei), Wasserförderung und Technische Hilfeleistung sowie die Logistikkomponente Versorgung.",
        datumIso: "2026-09-10",
        ortAuftrag: "Überörtliche Hilfe Hochwasser Weser (Landkreis Hameln-Pyrmont) — Sandsackverbau und Lenzen",
        teile: [
          {
            name: "Führungsgruppe",
            fuehrung: true,
            elemente: [
              fz("KdoW", "Kreisfeuerwehr"),
              fz("ELW 1", "Meerbeck-Niedernwöhren", [20, 11, 1], { staerke: 3 }),
              fz("Krad", "Wiedenbrügge", undefined, { plaetze: 1 }),
              fz("Krad", "Lüdersfeld", undefined, { plaetze: 1 }),
            ],
          },
          {
            name: "1. Zug Brandbekämpfung und besondere Aufgaben",
            elemente: [
              fz("ELW 1", "Wölpinghausen", [30, 11, 33], { staerke: 4 }),
              fz("LF 8", "Lauenhagen", [20, 43, 5], { staerke: 9 }),
              fz("TSF-W", "Wiedenbrügge", [30, 41, 32], { staerke: 6 }),
              fz("TLF 8/18", "Sachsenhagen", [30, 20, 1], { staerke: 3 }),
              fz("LF 8/6", "Lüdersfeld", [16, 45, 5], { staerke: 9 }),
            ],
          },
          {
            name: "2. Zug Brandbekämpfung und besondere Aufgaben",
            elemente: [
              fz("MTW", "Probsthagen", [32, 17, 15], { staerke: 4 }),
              fz("StLF 10/6", "Waltringhausen", [18, 42, 11], { staerke: 6 }),
              fz("TSF", "Ohndorf", [18, 40, 7], { staerke: 6 }),
              fz("TSF", "Riepen", [18, 40, 10], { staerke: 6 }),
              fz("TLF 16/25", "Meerbeck-Niedernwöhren"),
            ],
          },
          {
            name: "3. Zug Wasserförderung",
            elemente: [
              fz("MTW", "Enzen", [32, 17, 12], { staerke: 4 }),
              fz("LF 16 TS", "Stadthagen", [32, 44, 1], { staerke: 9 }),
              fz("LF 16 TS", "Beckedorf", [16, 44, 3], { staerke: 3 }),
              fz("TLF 16/25", "Lindhorst", [16, 23, 1], { staerke: 3 }),
              fz("GW-L1", "Lindhorst", [16, 64, 1], { staerke: 2 }),
              fz("GW-L1", "Horsten", [18, 64, 6], { staerke: 2 }),
            ],
          },
          {
            name: "4. Zug Technische Hilfeleistung",
            elemente: [
              fz("ELW 1", "Rodenberg", [28, 11, 1], { staerke: 4 }),
              fz("HLF 10", "Pohle", [28, 46, 17], { staerke: 9 }),
              fz("LF 8", "Hülsede-Meinsen", [28, 43, 15], { staerke: 6 }),
              fz("RW 2", "Rodenberg", [28, 52, 1], { staerke: 3 }),
              fz("TLF 8/18", "Haste", [18, 20, 3], { staerke: 3 }),
            ],
          },
          {
            name: "Logistikkomponente Versorgung",
            elemente: [
              fz("MTW", "Apelern", [28, 17, 3], { staerke: 2 }),
              fz("GW-L1", "Apelern", [28, 64, 3], { staerke: 3 }),
              fz("TSF", "Antendorf", [10, 40, 5], { staerke: 3, zusatz: "Küchenleitung" }),
              fz("TSF FeldKH", "Lyhren", [28, 41, 6], { staerke: 3, plaetze: 6, zusatz: "Tragkraftspritzenfahrzeug mit Feldkochherd" }),
            ],
          },
        ],
      },
      {
        pfad: "kfb-sued",
        ebene: KFB("KFB Süd"),
        titel: "Kreisfeuerwehrbereitschaft Süd",
        beschreibung: "Kreisfeuerwehrbereitschaft Süd des Landkreises Schaumburg (Gemeinde Auetal, Stadt Bückeburg, Samtgemeinden Eilsen und Nienstädt, Städte Obernkirchen und Rinteln): Führung mit Kradmeldern, die Fachzüge Brandbekämpfung/besondere Aufgaben (zwei), Wasserförderung und Wassertransport sowie die Logistikkomponente Versorgung.",
        datumIso: "2026-10-15",
        ortAuftrag: "Überörtliche Hilfe Waldbrand Solling (Landkreis Holzminden) — Brandbekämpfung und Wassertransport",
        teile: [
          {
            name: "Führungsgruppe",
            fuehrung: true,
            elemente: [fz("KdoW", "Kreisfeuerwehr"), fz("ELW 1", "Bückeburg"), fz("Krad", "Rusbend", undefined, { plaetze: 1 }), fz("Krad", "Schaumburg", undefined, { plaetze: 1 })],
          },
          {
            name: "1. Zug Brandbekämpfung und besondere Aufgaben",
            elemente: [fz("MTW", "Schaumburg"), fz("LF 10", "Möllenbeck"), fz("TLF 8/18", "Deckbergen"), fz("LF 8", "Krankenhagen"), fz("TSF-W", "Wennenkamp")],
          },
          {
            name: "2. Zug Brandbekämpfung und besondere Aufgaben",
            elemente: [fz("MTW", "Krainhagen"), fz("LF 8", "Rolfshagen"), fz("RW 1", "Meinsen-Warber-Achum"), fz("TSF-W", "Röcke"), fz("TSF-W", "Helpsen")],
          },
          {
            name: "3. Zug Wasserförderung",
            elemente: [fz("MTW", "Meinsen-Warber-Achum"), fz("LF 16/12", "Steinbergen"), fz("SW 2000", "Evesen"), fz("TSF-W", "Kathrinhagen"), fz("TSF-W", "Hattendorf"), fz("GW-L1", "Gelldorf")],
          },
          {
            name: "4. Zug Wassertransport",
            elemente: [fz("MTW", "Seggebruch"), fz("TSF-W", "Buchholz"), fz("TLF 8/18", "Gelldorf"), fz("TLF 8/18", "Exten"), fz("TLF 24/50", "Bückeburg"), fz("TLF 8/18", "KFW", undefined, { dienststelle: "Kreisfeuerwehr Schaumburg", zusatz: "Standort auf der Seite „KFW“" })],
          },
          {
            name: "Logistikkomponente Versorgung",
            elemente: [fz("TSF", "Antendorf", undefined, { zusatz: "mit Feldkochherd", zf: true }), fz("MZF", "Bergdorf"), fz("GW-L", "Rinteln")],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------------ Vechta
  {
    ordner: "landkreis-vechta",
    name: "Vechta",
    anzeige: "Landkreis Vechta",
    kfz: "VEC",
    quellen: ["https://www.kreisfeuerwehrverband-vechta.de/?page_id=10070"],
    standorte: {
      "LK/Visbek": "Ortsfeuerwehr Visbek (Fahrzeug des Landkreises)",
      "LK/Vechta": "Ortsfeuerwehr Vechta (Fahrzeug des Landkreises)",
      "LK/Holdorf": "Ortsfeuerwehr Holdorf (Fahrzeug des Landkreises)",
      "LK/Damme": "Ortsfeuerwehr Damme (Fahrzeug des Landkreises)",
      "DRK KV Vechta": "DRK-Kreisverband Vechta",
    },
    hinweise: [
      "Funkrufnamen wie auf der Seite („FV 22-11-1“ = Florian Vechta). Die Führung besetzt den ELW der Feuerwehr Dinklage (KFB-Führer, zwei Stellvertretungen für Nord und Süd, Zugführer zbV), das MTF stellt die Feuerwehr Lohne. Der 2. Zug hat zwei stellvertretende Zugführer.",
      "Der 5. Zug (Verpflegung und Fachzug Logistik) wird vom DRK-Kreisverband Vechta gestellt. „AB-Rüst“ im 3. Zug trägt die Fahrzeugkennung eines Wechselladers (80-67-1) und steht deshalb als WLF mit Abrollbehälter da.",
    ],
    verbaende: [
      {
        pfad: "kfb",
        ebene: KFB("KFB Vechta"),
        titel: "Kreisfeuerwehrbereitschaft Vechta",
        beschreibung: "Kreisfeuerwehrbereitschaft des Landkreises Vechta: Führungsstaffel, vier Züge der Feuerwehren und der 5. Zug (Verpflegung, Logistik) des DRK-Kreisverbands Vechta.",
        datumIso: "2026-09-03",
        ortAuftrag: "Überörtliche Hilfe Großbrand Landkreis Cloppenburg — Brandbekämpfung, Wassertransport, technische Hilfe",
        teile: [
          {
            name: "Führungsstaffel",
            fuehrung: true,
            elemente: [
              fz("ELW 1", "Dinklage", [22, 11, 1], {
                crew: [p(F, "KFB-Führer/-in", { quali: "Verbandsführer" }), p(F, "stellv. KFB-Führer/-in Nord", { quali: "Verbandsführer" }), p(F, "stellv. KFB-Führer/-in Süd", { quali: "Verbandsführer" }), p(U, "Zugführer/-in zbV", { quali: "Zugführer" })],
              }),
              fz("MTF", "Lohne", [23, 17, 1]),
            ],
          },
          {
            name: "1. Zug",
            elemente: [
              fz("ELW 1", "Goldenstedt", [13, 11, 1]),
              fz("LF 20 KatS", "LK/Visbek", [89, 44, 2]),
              fz("LF 20", "Rechterfeld", [12, 47, 1]),
              fz("LF 20", "Lutten", [14, 47, 1]),
              fz("LF 16 TS", "Goldenstedt", [13, 44, 1]),
              fz("MTF", "Visbek", [11, 17, 1], { zusatz: "mit Anhänger" }),
            ],
          },
          {
            name: "2. Zug",
            elemente: [
              fz("ELW 1", "Langförden", [15, 11, 1], {
                crew: [p(F, "Zugführer/-in"), p(U, "stellv. Zugführer/-in", { quali: "Zugführer", anzahl: 2 }), p(M, "Fahrer/-in", { fe: FE.C1 })],
              }),
              fz("TLF 16/25", "Bakum", [20, 23, 1]),
              fz("TLF 16/24", "Lüsche", [21, 24, 1]),
              fz("HLF 20", "Dinklage", [22, 48, 2]),
              fz("TLF 4000", "Langförden", [15, 26, 1]),
              fz("GW-L2", "LK/Vechta", [80, 62, 1]),
              fz("GW", "Vechta", [16, 63, 1]),
            ],
          },
          {
            name: "3. Zug",
            elemente: [
              fz("ELW 1", "Holdorf", [30, 11, 1]),
              fz("LF 8", "Brockdorf", [24, 46, 1], { zusatz: "mit Anhänger" }),
              fz("LF 8", "Südlohne", [25, 46, 1]),
              fz("GW-L2", "Steinfeld", [32, 62, 1]),
              fz("TLF 16/24 Tr", "Fladderlohausen", [31, 21, 1]),
              fz("TLF 16/25", "Holdorf", [30, 24, 1]),
              fz("MTF", "Holdorf", [30, 17, 1]),
              fz("WLF AB-Rüst", "LK/Holdorf", [80, 67, 1], { zusatz: "Abrollbehälter Rüst" }),
              fz("GW", "Südlohne", [25, 69, 1]),
            ],
          },
          {
            name: "4. Zug",
            elemente: [
              fz("ELW 1", "Vörden", [37, 11, 1]),
              fz("LF 20 KatS", "LK/Damme", [89, 44, 1]),
              fz("HLF 10", "Neuenkirchen", [36, 46, 1]),
              fz("LF 16 TS", "Borringhausen", [34, 44, 1]),
              fz("TLF 16/24", "Osterfeine", [35, 21, 1]),
            ],
          },
          {
            name: "5. Zug Verpflegung und Logistik",
            sonstiges: "Gestellt vom DRK-Kreisverband Vechta, nicht von den Feuerwehren.",
            elemente: [
              fz("MTF", "DRK KV Vechta", [89, 17, 1], {
                kennwort: KW_ROTKREUZ, traeger: "DRK", zf: true,
                crew: [p(F, "Zugführer/-in"), p(M, "Fahrer/-in", { fe: FE.B }), p(M, "Helfer/-in Verpflegung", { quali: "Hygieneschulung", anzahl: 4 })],
              }),
              fz("BtrLKW", "DRK KV Vechta", [89, 64, 1], {
                kennwort: KW_ROTKREUZ, traeger: "DRK", plaetze: 3,
                crew: [p(U, "Fahrzeugführer/-in"), p(M, "Fahrer/-in", { fe: FE.C }), p(M, "Helfer/-in Logistik")],
              }),
              fz("RTW", "DRK KV Vechta", [40, 85, 1], { kennwort: KW_ROTKREUZ, traeger: "DRK" }),
            ],
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------- Wittmund
  {
    ordner: "landkreis-wittmund",
    name: "Wittmund",
    anzeige: "Landkreis Wittmund",
    kfz: "WTM",
    quellen: ["https://kfv-wittmund.de/kfb/", "https://kfv-wittmund.de/tel/"],
    standorte: { Kreisfeuerwehr: "Kreisfeuerwehr Wittmund" },
    hinweise: [
      "Die Seite der Bereitschaft zeigt Führungsstaffel und Fachzüge als Grafiken mit Funktion, Funkrufname und Ortsfeuerwehr; übernommen ist, was dort steht. Zugführung und Stellvertretung kommen aus den Ortsfeuerwehren, die die Grafiken nennen. Die Drohne (Funkrufname 80-79-2) ist kein Fahrzeug und steht beim MTF-Drohne.",
      "TEL und IuK nutzen ELW 2, MTF-TEL und Anhänger-TEL, dieselben Fahrzeuge wie die Führungsstaffel der Bereitschaft.",
    ],
    verbaende: [
      {
        pfad: "kfb",
        ebene: KFB("KFB Wittmund"),
        titel: "Kreisfeuerwehrbereitschaft Wittmund",
        beschreibung: "Kreisfeuerwehrbereitschaft des Landkreises Wittmund: Führungsstaffel mit TEL und Drohne sowie die Fachzüge Wasserförderung, Wassertransport, Gewässerschutz und Logistik.",
        datumIso: "2026-09-17",
        ortAuftrag: "Überörtliche Hilfe Sturmflut Landkreis Aurich — Deichsicherung und Ölsperren",
        teile: [
          {
            name: "Führungsstaffel",
            fuehrung: true,
            elemente: [
              fz("KdoW", "Kreisfeuerwehr", [80, 10, 1], { leiter: p(F, "Leiter/-in KFB", { quali: "Verbandsführer" }) }),
              fz("ELW 2", "Kreisfeuerwehr", [80, 12, 1], { leiter: p(F, "stellv. Leiter/-in KFB", { quali: "Verbandsführer" }) }),
              fz("MTF TEL", "Kreisfeuerwehr", [80, 19, 2], {
                crew: [
                  p(F, "Leiter/-in TEL", { quali: "Verbandsführer", dienststelle: "Ortsfeuerwehr Schweindorf" }),
                  p(U, "stellv. Leiter/-in TEL", { quali: "Zugführer", dienststelle: "Ortsfeuerwehr Blomberg" }),
                  p(M, "Führungsgehilfe/-in", { quali: SPRECHFUNKER, anzahl: 3 }),
                  p(M, "Fahrer/-in", { fe: FE.BE }),
                ],
              }),
              fz("Anh TEL", "Kreisfeuerwehr"),
              fz("MTF Drohne", "Ochtersum", [13, 19, 3], {
                zusatz: "mit Drohne der Kreisfeuerwehr (Funkrufname 80-79-2)",
                crew: [p(U, "Truppführer/-in Drohne", { quali: "EU-Fernpilotenzeugnis A2" }), p(M, "Drohnenpilot/-in", { quali: "EU-Fernpilotenzeugnis A2", anzahl: 2 }), p(M, "Bildauswerter/-in", { anzahl: 2 }), p(M, "Fahrer/-in", { fe: FE.B })],
              }),
            ],
          },
          {
            name: "Fachzug 1 Wasserförderung",
            elemente: [
              fz("MTF", "Schweindorf", [13, 19, 4], { staerke: 5 }),
              fz("LF 8/6", "Stedesdorf", [11, 45, 4]),
              fz("LF 8/6", "Wiesede", [12, 45, 6]),
              fz("SW KatS", "Marx", [12, 62, 4]),
            ],
          },
          {
            name: "Fachzug 2 Wassertransport",
            elemente: [
              fz("MTF", "Horsten", [12, 19, 3], { staerke: 5, zfAus: "Ortsfeuerwehr Friedeburg", stvZfAus: "Ortsfeuerwehr Marx" }),
              fz("TLF 16/24", "Schweindorf", [13, 21, 4]),
              fz("TLF 2000", "Spiekeroog", [15, 20, 1]),
              fz("TLF 2000", "Neuharlingersiel", [11, 20, 3]),
              fz("TLF 3000", "Friedeburg", [12, 23, 1]),
              fz("StLF 20/25", "Leerhafe-Hovel", [10, 23, 7]),
            ],
          },
          {
            name: "Fachzug 3 Gewässerschutz",
            gefahrstoffe: true,
            elemente: [
              fz("MTF", "Carolinensiel", [10, 19, 5], { staerke: 5, zfAus: "Ortsfeuerwehr Wittmund" }),
              fz("GW-G", "Esens", [80, 73, 1], { zusatz: "Fahrzeug der Kreisfeuerwehr" }),
              fz("LF 10", "Ochtersum", [13, 45, 3]),
              fz("MLF", "Eggelingen", [11, 42, 6]),
            ],
          },
          {
            name: "Fachzug 4 Logistik",
            elemente: [
              fz("MTF", "Kreisfeuerwehr", [80, 19, 1], { staerke: 5, zfAus: "Ortsfeuerwehr Holtgast", stvZfAus: "Ortsfeuerwehr Holtgast" }),
              fz("MTF", "Ardorf", [10, 19, 2]),
              fz("GW-L2", "Blomberg", [13, 68, 2]),
              fz("WLF-K", "Kreisfeuerwehr", [80, 67, 1]),
              fz("LKW", "Holtgast", [80, 69, 1], { plaetze: 3, zusatz: "Fahrzeug der Kreisfeuerwehr" }),
              fz("FKH 57/5", "Holtgast", undefined, { zusatz: "Fahrzeug der Kreisfeuerwehr" }),
            ],
          },
        ],
      },
      {
        pfad: "tel-iuk",
        titel: "TEL und IuK",
        beschreibung: "Technische Einsatzleitung und IuK/Fernmeldekomponente des Landkreises Wittmund: Fernmeldeverbindungen, Nachrichtenaufnahme und Dokumentation, Einrichten von Führungsstellen, Führungsgehilfen für die überörtliche Hilfe. Die IuK nutzt den ELW 2.",
        datumIso: "2026-10-29",
        ortAuftrag: "Katastrophenfall Sturmflut im Landkreis Wittmund — Einsatzleitung am Schadensort",
        teile: [
          {
            name: "Technische Einsatzleitung und IuK",
            elemente: [
              fz("MTF TEL", "Kreisfeuerwehr", [80, 19, 2], {
                crew: [
                  p(F, "Leiter/-in TEL", { quali: "Verbandsführer", dienststelle: "Ortsfeuerwehr Schweindorf" }),
                  p(F, "stellv. Leiter/-in TEL", { quali: "Zugführer", dienststelle: "Ortsfeuerwehr Blomberg" }),
                  p(U, "Sachgebiet S1", { quali: "Zugführer" }),
                  p(U, "Sachgebiet S2", { quali: "Zugführer" }),
                  p(U, "Sachgebiet S3", { quali: "Zugführer" }),
                  p(M, "Fahrer/-in", { fe: FE.BE }),
                ],
              }),
              fz("ELW 2", "Kreisfeuerwehr", [80, 12, 1], {
                crew: [
                  p(U, "Leiter/-in IuK", { quali: "Gruppenführer", dienststelle: "Ortsfeuerwehr Ochtersum" }),
                  p(U, "stellv. Leiter/-in IuK", { quali: "Gruppenführer", dienststelle: "Ortsfeuerwehr Ochtersum" }),
                  p(M, "Sprechfunker/-in", { quali: SPRECHFUNKER, anzahl: 4 }),
                  p(M, "Fahrer/-in", { fe: FE.C }),
                ],
              }),
              fz("Anh TEL", "Kreisfeuerwehr"),
            ],
          },
        ],
      },
    ],
  },
];

// ------------------------------------------------------------------ Celle

const CELLE: Landkreis = {
  ordner: "landkreis-celle",
  name: "Celle",
  anzeige: "Landkreis Celle",
  kfz: "CE",
  quellen: ["https://www.kfv-celle.de/organisationseinheiten/kreisfeuerwehrbereitschaft/"],
  standorte: {
    Kreisfeuerwehr: "Kreisfeuerwehr Celle",
    "DRK-OV Winsen (Aller)": "DRK-Ortsverein Winsen (Aller)",
    "DRK-KV Celle": "DRK-Kreisverband Celle",
  },
  hinweise: [
    "Die Seite nennt alle Fahrzeuge mit Ortsfeuerwehr, aber keine Funkrufnamen und keine Stärken; es gilt die Normbesatzung. Laut Seite besteht die Bereitschaft aus 158 Feuerwehrleuten und neun Helfern des DRK mit 34 Einsatzfahrzeugen. Die Seite nennt drei ELW 1 für die Führung (Hermannsburg, Langlingen, Winsen/Aller), in der Aufzählung der Führungsgruppe aber nur zwei; abgebildet ist die Aufzählung.",
    "SW-KatS und das Fahrzeug mit Doppelkabine, Pritsche und Anhänger der FTZ besetzt im Einsatz die Ortsfeuerwehr Oldau, den GW-L2 der Kreisfeuerwehr die Ortsfeuerwehr Eicklingen.",
  ],
  verbaende: [
    {
      pfad: "kfb",
      ebene: KFB("KFB Celle"),
      titel: "Kreisfeuerwehrbereitschaft Celle",
      beschreibung: "Kreisfeuerwehrbereitschaft des Landkreises Celle (seit 01.01.2005 in dieser Form): Führungsgruppe, zwei Züge Wassertransport, je ein Zug Technische Hilfeleistung, Wasserförderung und Logistik.",
      datumIso: "2026-09-24",
      ortAuftrag: "Überörtliche Hilfe Hochwasser Elbe (Landkreis Lüchow-Dannenberg) — Deichverteidigung",
      teile: [
        {
          name: "Führungsgruppe",
          fuehrung: true,
          elemente: [fz("KdoW", "Kreisfeuerwehr", undefined, { zusatz: "Nissan Navara, Baujahr 2010" }), fz("ELW 1", "Hermannsburg"), fz("ELW 1", "Langlingen"), fz("MTF", "Lachendorf")],
        },
        {
          name: "1. Zug Wassertransport",
          elemente: [
            fz("MTF", "Hornbostel"), fz("TSF", "Wohlde"), fz("TLF 3000", "Wietze"), fz("TLF 2000", "Jeversen"),
            fz("TLF 16/25", "Wienhausen"), fz("TLF 16/25", "Wathlingen"), fz("TLF 16/24 Tr", "Adelheidsdorf"),
          ],
        },
        {
          name: "2. Zug Technische Hilfeleistung",
          elemente: [
            fz("MTF", "Oldau"), fz("MTF", "Winsen (Aller)"), fz("RW", "Winsen (Aller)"), fz("LF 20/16", "Hambühren"),
            fz("LF 8/6", "Südwinsen"), fz("TLF 3000", "Lohheide"),
          ],
        },
        {
          name: "3. Zug Wasserförderung",
          elemente: [
            fz("MTF", "Großmoor"), fz("LF 16 TS", "Eldingen"), fz("LF KatS", "Bröckel"),
            fz("GW-L2", "Eicklingen", undefined, { zusatz: "Fahrzeug der Kreisfeuerwehr; 2.000 m Schlauch in Rollcontainern, Schmutzwasser-Tauchpumpen, Frontseilwinde" }),
          ],
        },
        {
          name: "4. Zug Wassertransport",
          elemente: [
            fz("MTF", "Eschede"), fz("TSF-W", "Nienhof"), fz("TLF 16/24 Tr", "Offen"), fz("TLF 16/24 Tr", "Hohne"),
            fz("TLF 3000", "Weesen"), fz("TLF 4000", "Habighorst"), fz("TLF 16/25", "Bergen"),
          ],
        },
        {
          name: "5. Zug Logistik",
          elemente: [
            fz("MTF", "Nienhagen"),
            fz("SW KatS", "FTZ", undefined, { dienststelle: "Ortsfeuerwehr Oldau", zusatz: "Fahrzeug der FTZ" }),
            fz("LKW", "FTZ", undefined, { dienststelle: "Ortsfeuerwehr Oldau", plaetze: 6, staerke: 3, zusatz: "Fahrzeug der FTZ mit Doppelkabine und Pritsche (Seite: „MTF mit Anhänger“)" }),
            fz("Anh", "FTZ", undefined, { zusatz: "Transportanhänger der FTZ" }),
            fz("KTW", "DRK-OV Winsen (Aller)", undefined, { traeger: "DRK", kennwort: KW_ROTKREUZ, crew: [p(U, "Rettungssanitäter/-in", { quali: "Rettungssanitäter", fe: FE.C1 }), p(M, "Sanitätshelfer/-in", { quali: "Sanitätshelfer" })] }),
            fz("MTF", "DRK-KV Celle", undefined, { traeger: "DRK", kennwort: KW_ROTKREUZ, crew: [p(U, "Gruppenführer/-in Verpflegung"), p(M, "Fahrer/-in", { fe: FE.BE }), p(M, "Helfer/-in Verpflegung", { quali: "Hygieneschulung" })] }),
            fz("MTF", "DRK-KV Celle", undefined, { traeger: "DRK", kennwort: KW_ROTKREUZ, crew: [p(M, "Fahrer/-in", { fe: FE.B }), p(M, "Helfer/-in Verpflegung", { quali: "Hygieneschulung", anzahl: 3 })] }),
            fz("FKH", "DRK-KV Celle", undefined, { traeger: "DRK", zusatz: "Feldküche (Anhänger)" }),
          ],
        },
      ],
    },
  ],
};

// ----------------------------------------------------------------- Goslar
//
// Die Seiten nennen je Einheit Fahrzeugtyp und Funkrufname, aber keinen
// Standort. Das Fahrzeug heißt deshalb nach seinem Funkrufnamen.

const gfz = (kurz: string, funk: string, extra: Partial<El> = {}): El => ({
  kurz,
  standort: funk,
  funk: funk.split("-").map(Number) as [number, number, number],
  dienststelle: "Kreisfeuerwehr Goslar",
  ...extra,
});
const gcrew = (fuehrer: string | null, ...rest: [string, number?, Partial<Platz>?][]): Platz[] => [
  ...(fuehrer ? [p(U, fuehrer)] : []),
  ...rest.map(([f, n, x]) => p(M, f, { anzahl: n ?? 1, ...(x ?? {}) })),
];

const GOSLAR: Landkreis = {
  ordner: "landkreis-goslar",
  name: "Goslar",
  anzeige: "Landkreis Goslar",
  kfz: "GS",
  quellen: [
    "https://www.kfv-goslar.de/einsaetze/fahrzeug/loeschzug/ansicht/40/f%C3%BChrungsgruppe-1.html",
    "https://www.kfv-goslar.de/einsaetze/fahrzeug/loeschzug/ansicht/41/f%C3%BChrungsgruppe-2.html",
    "https://www.kfv-goslar.de/einsaetze/fahrzeug/loeschzug/ansicht/42/f%C3%BChrungsgruppe-3.html",
    "https://www.kfv-goslar.de/einsaetze/fahrzeug/loeschzug/ansicht/38/fachzug-brandschutz.html",
    "https://www.kfv-goslar.de/einsaetze/fahrzeug/loeschzug/ansicht/307/fachzug-technische-hilfeleistung.html",
    "https://www.kfv-goslar.de/einsaetze/fahrzeug/loeschzug/ansicht/314/fachzug-umweltschutz-einsatz-im-eigenen-lk.html",
    "https://www.kfv-goslar.de/einsaetze/fahrzeug/loeschzug/ansicht/315/fachzug-umweltschutz-2-%C3%BCber%C3%B6rtlicher-einsatz.html",
    "https://www.kfv-goslar.de/einsaetze/fahrzeug/loeschzug/ansicht/311/fachzug-vegetationsbrandbek%C3%A4mpfung-1.html",
    "https://www.kfv-goslar.de/einsaetze/fahrzeug/loeschzug/ansicht/312/fachzug-vegetationsbrandbek%C3%A4mpfung-2.html",
    "https://www.kfv-goslar.de/einsaetze/fahrzeug/loeschzug/ansicht/310/fachzug-versorgung-und-logistik.html",
    "https://www.kfv-goslar.de/einsaetze/fahrzeug/loeschzug/ansicht/308/fachzug-wassertransport-1.html",
    "https://www.kfv-goslar.de/einsaetze/fahrzeug/loeschzug/ansicht/309/fachzug-wassertransport-2.html",
    "https://www.kfv-goslar.de/einsaetze/fahrzeug/loeschzug/ansicht/317/fachberater-cbrn.html",
  ],
  hinweise: [
    "Die Einsatzeinheiten der Kreisfeuerwehr Goslar (nach KatS-StAN NDS 011 neu gegliedert) stehen als Pool aus drei Führungsgruppen, zehn Fachzügen und den Fachberatern CBRN da, nicht als feste Bereitschaften. Die Seiten nennen Fahrzeugtyp und Funkrufname, aber keine Standorte: Jedes Fahrzeug heißt nach seinem Funkrufnamen, die Dienststelle ist „Kreisfeuerwehr Goslar“. Der ELW 2 (80-12-19) gehört zu allen drei Führungsgruppen.",
    "Wo eine Seite die Mannschaftsstärke nennt (etwa 1/4/20), ist die Besatzung so verteilt, dass sie genau getroffen wird; im Fachzug Vegetationsbrandbekämpfung 1 (1/4/19 bei elf Fahrzeugen) fahren die drei ATV ohne eigene Besatzung, zwei Fahrzeuge nur mit Maschinist. Der Fachzug Hochwasserschutz steht im Menü, seine Seite wurde nicht übergeben und fehlt hier. Die zweite Seite des Fachzugs Technische Hilfeleistung nennt die Stellvertretung „N.N.“; sie ist trotzdem besetzt, damit die Stärke 1/4/20 aufgeht.",
  ],
  verbaende: [
    ...[
      { nr: 1, elw1: "16-11-60", mtw: "16-17-61", bf: "Seesen", stv: "Bad Harzburg" },
      { nr: 2, elw1: "12-11-20", mtw: "12-17-21", bf: "Goslar", stv: "Harlingerode" },
      { nr: 3, elw1: null, mtw: "14-17-43", bf: "Goslar", stv: "Langelsheim" },
    ].map((g): Verband => ({
      pfad: `einsatzeinheiten/0${g.nr}-fuehrungsgruppe-${g.nr}`,
      titel: `Führungsgruppe ${g.nr}`,
      beschreibung: `Führungsgruppe ${g.nr} der Kreisfeuerwehr Goslar zur Führung von Einsätzen der Führungsstufe C (Feuerwehrverbände, Flächenlagen, Katastrophen). Bereitschaftsführung aus den Ortsfeuerwehren ${g.bf} und ${g.stv}.`,
      datumIso: "2026-08-20",
      ortAuftrag: "Waldbrand im Harz — Führung der Einsatzabschnitte, Unterstützung der örtlichen Einsatzleitung",
      teile: [
        {
          name: `Führungsgruppe ${g.nr}`,
          fuehrung: true,
          elemente: [
            ...(g.elw1 ? [gfz("ELW 1", g.elw1, { leiter: p(F, "Bereitschaftsführer/-in", { dienststelle: `Ortsfeuerwehr ${g.bf}` }) })] : []),
            gfz("MTW", g.mtw, g.elw1 ? {} : { leiter: p(F, "Bereitschaftsführer/-in", { dienststelle: `Ortsfeuerwehr ${g.bf}` }) }),
            gfz("ELW 2", "80-12-19", { leiter: p(F, "stellv. Bereitschaftsführer/-in", { dienststelle: `Ortsfeuerwehr ${g.stv}` }) }),
          ],
        },
      ],
    })),
    {
      pfad: "einsatzeinheiten/04-fachzug-brandschutz",
      titel: "Fachzug Brandschutz",
      beschreibung: "Fachzug Brandschutz der Kreisfeuerwehr Goslar nach KatS-StAN NDS 011.",
      datumIso: "2026-08-20",
      ortAuftrag: "Waldbrand im Harz — Brandbekämpfung im Einsatzabschnitt Nord",
      teile: [{
        name: "Fachzug Brandschutz",
        sonstiges: "Mannschaftsstärke laut Seite 1/4/20.",
        elemente: [gfz("ELW 1", "11-19-10", { staerke: 4 }), gfz("LF KatS", "15-44-52"), gfz("LF KatS", "17-44-70"), gfz("SW KatS", "13-62-30")],
      }],
    },
    {
      pfad: "einsatzeinheiten/05-fachzug-technische-hilfeleistung",
      titel: "Fachzug Technische Hilfeleistung",
      beschreibung: "Fachzug Technische Hilfeleistung der Kreisfeuerwehr Goslar nach KatS-StAN NDS 011.",
      datumIso: "2026-09-02",
      ortAuftrag: "Sturmschäden im Landkreis Goslar — Räumen von Straßen, Sichern von Gebäuden",
      teile: [{
        name: "Fachzug Technische Hilfeleistung",
        sonstiges: "Mannschaftsstärke laut Seite 1/4/20; Stellvertretung laut Seite „N.N.“.",
        elemente: [gfz("MTW", "13-17-33", { staerke: 4 }), gfz("LF KatS", "13-44-30"), gfz("LF 20 TS", "14-47-40"), gfz("RW 2", "16-52-60")],
      }],
    },
    {
      pfad: "einsatzeinheiten/06-fachzug-umweltschutz-1",
      titel: "Fachzug Umweltschutz (Einsatz im eigenen Landkreis)",
      beschreibung: "Fachzug Umweltschutz der Kreisfeuerwehr Goslar nach KatS-StAN NDS 011, Einsatz im eigenen Landkreis.",
      datumIso: "2026-09-16",
      ortAuftrag: "Gefahrstoffaustritt in einem Betrieb in Langelsheim — Messen, Spüren, Abdichten",
      teile: [{
        name: "Fachzug Umweltschutz 1",
        gefahrstoffe: true,
        elemente: [gfz("ELW Messleitung", "80-18-1", { plaetze: 4 }), gfz("TSF", "15-40-57"), gfz("GW Mess", "81-19-1"), gfz("MTW", "12-17-22"), gfz("MLF", "12-42-22"), gfz("GW-L2", "81-68-1")],
      }],
    },
    {
      pfad: "einsatzeinheiten/07-fachzug-umweltschutz-2",
      titel: "Fachzug Umweltschutz 2 (überörtlicher Einsatz)",
      beschreibung: "Fachzug Umweltschutz 2 der Kreisfeuerwehr Goslar nach KatS-StAN NDS 011, wird auch überörtlich eingesetzt.",
      datumIso: "2026-09-16",
      ortAuftrag: "Überörtliche Hilfe Gefahrgutunfall Landkreis Wolfenbüttel — Dekontamination und Abdichten",
      teile: [{
        name: "Fachzug Umweltschutz 2",
        gefahrstoffe: true,
        sonstiges: "Mannschaftsstärke laut Seite 1/7/44.",
        elemente: [
          gfz("MTW", "11-17-13", { staerke: 7 }), gfz("HLF 20", "11-49-10"), gfz("HLF 10", "14-46-40"), gfz("LF 10", "12-45-20"),
          gfz("LF 10", "16-46-60"), gfz("GW-L2", "18-68-80", { staerke: 6, plaetze: 6 }), gfz("GW-L1 Dekon", "14-64-40", { staerke: 3 }),
        ],
      }],
    },
    {
      pfad: "einsatzeinheiten/08-fachzug-vegetationsbrandbekaempfung-1",
      titel: "Fachzug Vegetationsbrandbekämpfung 1",
      beschreibung: "Fachzug Vegetationsbrandbekämpfung 1 der Kreisfeuerwehr Goslar nach KatS-StAN NDS 011.",
      datumIso: "2026-08-20",
      ortAuftrag: "Waldbrand im Harz — Brandbekämpfung in schwer zugänglichem Gelände",
      teile: [{
        name: "Fachzug Vegetationsbrandbekämpfung 1",
        sonstiges: "Mannschaftsstärke laut Seite 1/4/19 bei elf Fahrzeugen: Die ATV werden ohne eigene Besatzung mitgeführt, ihre Fahrer sitzen im MTW.",
        elemente: [
          gfz("MTW", "15-17-52", { staerke: 4 }),
          gfz("MTW", "16-17-62", { crew: gcrew(null, ["Fahrer/-in", 1, { fe: FE.B }], ["ATV-Fahrer/-in", 3], ["Truppmitglied", 4, { quali: AGT }]) }),
          gfz("ATV", "16-79-62", { crew: [] }), gfz("ATV", "80-59-1", { crew: [] }), gfz("ATV", "11-59-12", { crew: [] }),
          gfz("TLF 16/25", "16-23-60", { staerke: 3 }), gfz("TLF 16/25", "19-22-25", { staerke: 3 }),
          gfz("LF KatS", "15-44-52", { staerke: 3 }),
          gfz("LF KatS", "12-44-70", { crew: gcrew(null, ["Maschinist/-in", 1, { quali: MASCHINIST, fe: FE.C }]) }),
          gfz("WLF AB-LW", "80-66-1", { crew: gcrew(null, ["Maschinist/-in", 1, { quali: MASCHINIST, fe: FE.CE }]), zusatz: "Abrollbehälter Löschwasser" }),
          gfz("Unimog", "80-75-1", { plaetze: 3, crew: gcrew(null, ["Maschinist/-in", 1, { quali: MASCHINIST, fe: FE.C }]) }),
        ],
      }],
    },
    {
      pfad: "einsatzeinheiten/09-fachzug-vegetationsbrandbekaempfung-2",
      titel: "Fachzug Vegetationsbrandbekämpfung 2",
      beschreibung: "Fachzug Vegetationsbrandbekämpfung 2 der Kreisfeuerwehr Goslar nach KatS-StAN NDS 011 mit acht CCFL.",
      datumIso: "2026-08-20",
      ortAuftrag: "Waldbrand im Harz — Brandbekämpfung mit geländegängigen Tanklöschfahrzeugen",
      teile: [{
        name: "Fachzug Vegetationsbrandbekämpfung 2",
        elemente: [
          gfz("MTW", "19-17-26"),
          ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => gfz("CCFL", `80-29-${n}`, { zusatz: "geländegängiges Tanklöschfahrzeug (Camion-Citerne Feux de Forêts Léger)" })),
          gfz("GW-L", "19-59-27"),
        ],
      }],
    },
    {
      pfad: "einsatzeinheiten/10-fachzug-versorgung-und-logistik",
      titel: "Fachzug Versorgung und Logistik",
      beschreibung: "Fachzug Versorgung und Logistik der Kreisfeuerwehr Goslar nach KatS-StAN NDS 011, mit Fahrzeugen des DRK.",
      datumIso: "2026-08-20",
      ortAuftrag: "Versorgung der Einsatzkräfte beim Waldbrand im Harz — Verpflegung und Materialtransport",
      teile: [{
        name: "Fachzug Versorgung und Logistik",
        sonstiges: "Mannschaftsstärke laut Seite 1/5/15.",
        elemente: [
          gfz("MTW", "16-17-64", { staerke: 4 }), gfz("MTW", "18-17-83", { staerke: 6 }),
          gfz("GW-L1", "16-64-63", { staerke: 2 }), gfz("GW-L1", "19-64-25", { staerke: 2 }),
          gfz("GW DRK", "40-69-19", { kennwort: KW_ROTKREUZ, dienststelle: "DRK", traeger: "DRK", crew: gcrew("Fahrzeugführer/-in", ["Helfer/-in Logistik"]) }),
          gfz("MTW DRK", "47-17-73", { kennwort: KW_ROTKREUZ, dienststelle: "DRK", traeger: "DRK", crew: gcrew(null, ["Fahrer/-in", 1, { fe: FE.B }], ["Helfer/-in Verpflegung", 2, { quali: "Hygieneschulung" }]) }),
          gfz("KTW-B DRK", "44-92-40", { kennwort: KW_ROTKREUZ, dienststelle: "DRK", traeger: "DRK", crew: gcrew(null, ["Rettungssanitäter/-in", 1, { quali: "Rettungssanitäter", fe: FE.C1 }], ["Sanitätshelfer/-in", 1, { quali: "Sanitätshelfer" }]) }),
        ],
      }],
    },
    {
      pfad: "einsatzeinheiten/11-fachzug-wassertransport-1",
      titel: "Fachzug Wassertransport 1",
      beschreibung: "Fachzug Wassertransport 1 der Kreisfeuerwehr Goslar.",
      datumIso: "2026-08-20",
      ortAuftrag: "Waldbrand im Harz — Wassertransport im Pendelverkehr",
      teile: [{
        name: "Fachzug Wassertransport 1",
        sonstiges: "Mannschaftsstärke laut Seite 1/6/24.",
        elemente: [
          gfz("MTW", "18-17-86", { staerke: 7 }), gfz("TLF 3000", "14-21-44", { staerke: 6, plaetze: 6 }), gfz("TLF 16/25", "12-24-26", { staerke: 6, plaetze: 6 }),
          gfz("TLF 3000", "12-23-24", { staerke: 6, plaetze: 6 }), gfz("TLF 16/24", "11-21-11", { staerke: 3 }), gfz("GW-L2", "81-68-1", { staerke: 3 }),
        ],
      }],
    },
    {
      pfad: "einsatzeinheiten/12-fachzug-wassertransport-2",
      titel: "Fachzug Wassertransport 2",
      beschreibung: "Fachzug Wassertransport 2 der Kreisfeuerwehr Goslar.",
      datumIso: "2026-08-20",
      ortAuftrag: "Waldbrand im Harz — Wassertransport im Pendelverkehr",
      teile: [{
        name: "Fachzug Wassertransport 2",
        sonstiges: "Mannschaftsstärke laut Seite 1/6/21.",
        elemente: [
          gfz("MTW", "12-17-23", { staerke: 8 }), gfz("TLF 16/25", "15-23-59", { staerke: 6, plaetze: 6 }), gfz("TLF 16/24", "11-21-13", { staerke: 3 }),
          gfz("TLF 16/24", "14-22-41", { staerke: 3 }), gfz("TLF 8/24", "12-21-20", { staerke: 3 }), gfz("GW-L2", "11-68-10", { staerke: 3 }),
          gfz("GW-L2", "16-64-62", { crew: gcrew(null, ["Maschinist/-in", 1, { quali: MASCHINIST, fe: FE.C }], ["Truppmitglied"]) }),
        ],
      }],
    },
    {
      pfad: "einsatzeinheiten/13-fachberater-cbrn",
      titel: "Fachberater CBRN",
      beschreibung: "Fachberater der Kreisfeuerwehr Goslar für chemische, biologische, radiologische und nukleare Gefahren. Die Seite nennt kein Fahrzeug.",
      datumIso: "2026-09-16",
      ortAuftrag: "Beratung der Einsatzleitung bei einem Gefahrstoffaustritt",
      teile: [{
        name: "Fachberater CBRN",
        elemente: [{
          standort: "Kreisfeuerwehr", dienststelle: "Kreisfeuerwehr Goslar", bezeichnung: "Fachberatung",
          crew: [p(F, "Fachberater/-in CBRN", { quali: "Fachberater CBRN", anzahl: 3 })],
        }],
      }],
    },
  ],
};

// -------------------------------------------------------- Region Hannover

const HANNOVER: Landkreis = {
  ordner: "region-hannover",
  name: "Region Hannover",
  anzeige: "Region Hannover",
  funkOrt: "Hannover Land",
  kfz: "H",
  quellen: ["https://heessel.de/feuerwehr/regionsfeuerwehrbereitschaft-hannover/"],
  standorte: { FTZ: "Feuerwehrtechnische Zentrale Burgdorf" },
  hinweise: [
    "Die Region Hannover hat fünf Regionsfeuerwehrbereitschaften (RFB I bis V), je eine für jeden Brandschutzabschnitt. Die Quelle ist die Seite der Ortsfeuerwehr Heessel, die die Fahrzeuge der FTZ Burgdorf besetzt; sie beschreibt nur die RFB IV und V.",
      "Belegt sind dort die Führungsgruppen und die Fahrzeuge der FTZ Burgdorf mit Funkrufnamen („Florian Hannover Land 87-10-1“). Die übrigen Züge nennt die Seite nur als „Stadtfeuerwehr Sehnde“, „Gemeindefeuerwehr Wedemark“ usw., ohne Fahrzeuge; sie fehlen hier. Die Logistikzüge stehen deshalb nur mit dem Anteil der FTZ da. Das Personal der FTZ-Fahrzeuge kommt aus der Ortsfeuerwehr Heessel.",
  ],
  verbaende: [
    {
      pfad: "rfb-iv",
      ebene: { bezeichnung: "Bereitschaft", name: "RFB IV" },
      titel: "Regionsfeuerwehrbereitschaft IV",
      beschreibung: "Regionsfeuerwehrbereitschaft IV (Brandschutzabschnitt IV: Burgdorf, Lehrte, Sehnde, Uetze): Führungsgruppe, 1. Zug Wassertransport (alternativ Hochwasser, Lehrte), 2. Zug Wasserförderung (Sehnde), 3. und 4. Zug Brandbekämpfung (Uetze, Burgdorf), 5. Zug Logistik/Versorgung (Burgdorf, FTZ).",
      datumIso: "2026-10-01",
      ortAuftrag: "Überörtliche Hilfe Hochwasser Aller (Landkreis Celle) — Deichverteidigung",
      teile: [
        {
          name: "Führungsgruppe",
          fuehrung: true,
          elemente: [
            fz("ELW 2", "Lehrte", undefined, { leiter: p(F, "Bereitschaftsführer/-in") }),
            fz("MTW", "Hänigsen"),
            fz("KdoW", "FTZ", [87, 10, 1], { dienststelle: "Ortsfeuerwehr Heessel", leiter: p(F, "stellv. Bereitschaftsführer/-in", { dienststelle: "Kreisfeuerwehr" }), zusatz: "Fahrzeug der FTZ Burgdorf, besetzt von der Ortsfeuerwehr Heessel" }),
          ],
        },
        {
          name: "5. Zug Logistik/Versorgung",
          sonstiges: "Auf dem Bogen steht nur der Anteil, den die Ortsfeuerwehr Heessel stellt; die Fahrzeuge der Stadtfeuerwehr Burgdorf nennt die Seite nicht. Der GW-Küche kann eine Einheit von rund 150 Personen rund um die Uhr verpflegen.",
          elemente: [
            fz("MTW", "Heessel", [28, 19, 3], { staerke: 5 }),
            fz("GW-L1", "FTZ", [87, 64, 1], { dienststelle: "Ortsfeuerwehr Heessel" }),
            fz("WLF", "FTZ", [87, 66, 1], { dienststelle: "Ortsfeuerwehr Heessel" }),
            fz("GW-Küche", "FTZ", [90, 59, 4], {
              dienststelle: "Ortsfeuerwehr Heessel", plaetze: 3,
              zusatz: "Stromerzeuger 12 kVA, Kippbratpfanne, Kochkessel, Konvektomat, Kühl- und Tiefkühlschrank je 700 l",
              crew: [p(U, "Küchenleiter/-in"), p(M, "Feuerwehrkoch/-köchin", { quali: "Koch (Beruf)" }), p(M, "Fahrer/-in", { fe: FE.C })],
            }),
          ],
        },
      ],
    },
    {
      pfad: "rfb-v",
      ebene: { bezeichnung: "Bereitschaft", name: "RFB V" },
      titel: "Regionsfeuerwehrbereitschaft V",
      beschreibung: "Regionsfeuerwehrbereitschaft V (Brandschutzabschnitt V: Burgwedel, Langenhagen, Isernhagen, Wedemark): Führungsgruppe, 1. Zug Brandbekämpfung (Wedemark), 2. Zug Technische Hilfeleistung (Langenhagen), 3. Zug Wasserförderung (Isernhagen, SW 2000 KatS Schulenburg), 4. Zug Logistik (Burgwedel, FTZ).",
      datumIso: "2026-10-01",
      ortAuftrag: "Überörtliche Hilfe Hochwasser Aller (Landkreis Celle) — Lenzen und Sandsackverbau",
      teile: [
        {
          name: "Führungsgruppe",
          fuehrung: true,
          elemente: [
            fz("ELW 2", "Kaltenweide", undefined, { leiter: p(F, "Bereitschaftsführer/-in") }),
            fz("MTW", "Neuwarmbüchen"),
            fz("KdoW", "FTZ", [87, 10, 1], { dienststelle: "Ortsfeuerwehr Heessel", leiter: p(F, "stellv. Bereitschaftsführer/-in", { dienststelle: "Kreisfeuerwehr" }), zusatz: "Fahrzeug der FTZ Burgdorf, besetzt von der Ortsfeuerwehr Heessel" }),
          ],
        },
        {
          name: "4. Zug Logistik (Anteil FTZ)",
          sonstiges: "Auf dem Bogen steht nur der Anteil der FTZ Burgdorf, den die Ortsfeuerwehr Heessel besetzt; die Fahrzeuge der Stadtfeuerwehr Burgwedel nennt die Seite nicht.",
          elemente: [
            fz("GW-L1", "FTZ", [87, 64, 1], { dienststelle: "Ortsfeuerwehr Heessel", crew: [p(F, "Führer/-in FTZ-Komponente"), p(M, "Maschinist/-in", { quali: MASCHINIST, fe: FE.C })] }),
            fz("WLF", "FTZ", [87, 66, 1], { dienststelle: "Ortsfeuerwehr Heessel", crew: [p(U, "Fahrzeugführer/-in"), p(M, "Maschinist/-in", { quali: MASCHINIST, fe: FE.CE })] }),
          ],
        },
      ],
    },
  ],
};

LANDKREISE.push(CELLE, GOSLAR, HANNOVER);
LANDKREISE.sort((a, b) => a.ordner.replace(/^(landkreis|region)-/, "").localeCompare(b.ordner.replace(/^(landkreis|region)-/, ""), "de"));

// ------------------------------------------------------------- Besatzungen
//
// Stärkerolle wie in der Stärkemeldung der Feuerwehr (1/8 = Gruppe): Führung der
// Teileinheit (Bereitschafts-, Zug-, Einheitsführung) → F, Stellvertretung der
// Zugführung und Fahrzeugführungen → U, alle übrigen → M. Truppführer stehen als
// Qualifikation dabei und zählen zur Mannschaft.

/** Kurzform eines Elements für die Funktionsangabe: „LF 16 Bassum", „1. ABC-Gruppe". */
function elName(el: El): string {
  if (!el.kurz) return el.bezeichnung ?? el.standort;
  return `${el.kurz} ${el.standort}`;
}

function istFuehrungsfahrzeug(kurz = ""): boolean {
  return /^(KdoW|ELW|FüKW)/.test(kurz);
}
function istMannschaftstransport(kurz = ""): boolean {
  return /^(MTW|MTF|MZF)/.test(kurz);
}

/** Ziel-Besatzungsstärke eines Elements. */
function zielStaerke(el: El): number {
  if (el.staerke != null) return el.staerke;
  if (el.crew) return el.crew.reduce((s, x) => s + (x.anzahl ?? 1), 0);
  if (el.traeger && /^RTW/.test(el.kurz ?? "")) return 2;
  if (!el.kurz) {
    return { gruppe: 9, staffel: 6, trupp: 3, fuehrungstrupp: 3 }[el.art ?? "gruppe"];
  }
  if (/^Krad/.test(el.kurz)) return 1;
  if (/^KdoW/.test(el.kurz)) return 2;
  if (istMannschaftstransport(el.kurz)) return 6;
  const pl = plaetzeVon(el);
  return pl ?? 3;
}

/** Normbesatzung der Größe n: Fahrzeugführung, Maschinist, ggf. Melder, Trupps. */
function normBesatzung(n: number, tf: string, kurz = ""): Platz[] {
  if (n <= 0) return [];
  if (/^Krad/.test(kurz)) return [p(M, "Kradmelder/-in", { quali: SPRECHFUNKER, fe: FE.A })];
  const fuehrer = n <= 3 ? "Truppführer/-in" : n <= 6 ? "Staffelführer/-in" : "Gruppenführer/-in";
  const crew: Platz[] = [p(U, n <= 3 ? "Fahrzeugführer/-in" : fuehrer, { quali: n <= 3 ? tf : undefined })];
  if (n >= 2) crew.push(p(M, "Maschinist/-in", { quali: MASCHINIST, fe: /^(TSF|MLF|MTW|MTF|MZF)/.test(kurz) ? FE.B : FE.C }));
  if (n >= 9) crew.push(p(M, "Melder/-in", { quali: SPRECHFUNKER }));
  let tfDran = true;
  while (crew.length < n) {
    crew.push(p(M, tfDran ? "Truppführer/-in" : "Truppmitglied", { quali: tf }));
    tfDran = !tfDran;
  }
  return crew;
}

/** Zugtrupp auf dem Fahrzeug der Zugführung, aufgefüllt bis zur Zielstärke. */
function zugtrupp(n: number, el: El, stvAndersWo: boolean, tf: string): Platz[] {
  const crew: Platz[] = [p(F, "Zugführer/-in", el.zfAus ? { dienststelle: el.zfAus } : {})];
  if (!stvAndersWo) crew.push(p(U, "stellv. Zugführer/-in", { quali: "Zugführer", ...(el.stvZfAus ? { dienststelle: el.stvZfAus } : {}) }));
  const rest: Platz[] = [
    p(M, "Führungsassistent/-in", { quali: FUEHRUNGSASSISTENT }),
    p(M, "Fahrer/-in", { fe: istFuehrungsfahrzeug(el.kurz) ? FE.C1 : FE.B }),
    p(M, "Melder/-in", { quali: SPRECHFUNKER }),
  ];
  if (!el.kurz) rest.splice(1, 1); // Führungstrupp ohne Fahrzeug braucht keinen Fahrer
  while (crew.length < n && rest.length) crew.push(rest.shift()!);
  while (crew.length < n) crew.push(p(M, "Truppmitglied", { quali: tf }));
  return crew;
}

interface Ctx {
  t: Teileinheit;
  tf: string;
  /** Index des Elements mit der Zugführung (Fachzug). */
  host: number;
  stvAndersWo: boolean;
  /** Führung: Index → vergebene Leitungsfunktion. */
  leitung: Map<number, Platz>;
}

function kontext(t: Teileinheit): Ctx {
  const tf = t.gefahrstoffe ? CSA : AGT;
  const els = t.elemente;
  let host = els.findIndex((e) => e.zf);
  if (host < 0) host = els.findIndex((e) => /^ELW/.test(e.kurz ?? ""));
  if (host < 0) host = els.findIndex((e) => istMannschaftstransport(e.kurz));
  if (host < 0) host = els.findIndex((e) => e.art === "fuehrungstrupp");
  if (host < 0) host = els.findIndex((e) => !e.crew && zielStaerke(e) > 0);
  const stvAndersWo = els.some((e) => e.stvZf);
  const leitung = new Map<number, Platz>();
  if (t.fuehrung) {
    const titel = [p(F, "Bereitschaftsführer/-in"), p(F, "stellv. Bereitschaftsführer/-in", { quali: "Verbandsführer" })];
    els.forEach((e, i) => {
      if (e.leiter) leitung.set(i, e.leiter);
    });
    const vergeben = [...leitung.values()].map((x) => x.funktion);
    const offen = titel.filter((x) => !vergeben.includes(x.funktion));
    // KdoW zuerst, dann ELW/FüKW in Seitenreihenfolge.
    const kandidaten = [
      ...els.map((e, i) => [e, i] as const).filter(([e, i]) => !leitung.has(i) && !e.crew && /^KdoW/.test(e.kurz ?? "")),
      ...els.map((e, i) => [e, i] as const).filter(([e, i]) => !leitung.has(i) && !e.crew && /^(ELW|FüKW)/.test(e.kurz ?? "")),
    ];
    for (const [, i] of kandidaten) {
      const x = offen.shift();
      if (!x) break;
      leitung.set(i, x);
    }
  }
  return { t, tf, host, stvAndersWo, leitung };
}

function besatzung(el: El, i: number, ctx: Ctx): Platz[] {
  if (el.crew) return el.crew.flatMap((x) => Array.from({ length: x.anzahl ?? 1 }, () => ({ ...x, anzahl: undefined })));
  const n = zielStaerke(el);
  const kurz = el.kurz ?? "";
  if (n === 0) return [];

  if (el.traeger) {
    const crew = [p(U, "Notfallsanitäter/-in", { quali: "Notfallsanitäter", fe: FE.C1 }), p(M, "Rettungssanitäter/-in", { quali: "Rettungssanitäter", fe: FE.C1 })];
    while (crew.length < n) crew.push(p(M, "Helfer/-in", { quali: "Sanitätshelfer" }));
    return crew.slice(0, n);
  }

  if (ctx.t.fuehrung) {
    const leitung = ctx.leitung.get(i);
    if (istFuehrungsfahrzeug(kurz)) {
      const crew: Platz[] = [leitung ?? p(U, "Fahrzeugführer/-in", { quali: FUEHRUNGSASSISTENT })];
      const rest: Platz[] = [
        p(M, "Fahrer/-in", { fe: /^KdoW/.test(kurz) ? FE.B : FE.C1 }),
        p(M, "Führungsassistent/-in", { quali: FUEHRUNGSASSISTENT }),
      ];
      while (crew.length < n && rest.length) crew.push(rest.shift()!);
      while (crew.length < n) crew.push(p(M, "Sprechfunker/-in", { quali: SPRECHFUNKER }));
      return crew;
    }
    if (istMannschaftstransport(kurz)) {
      const crew: Platz[] = [leitung ?? p(U, "Fahrzeugführer/-in"), p(M, "Fahrer/-in", { fe: FE.B })];
      while (crew.length < n) crew.push(p(M, "Führungsgehilfe/-in", { quali: SPRECHFUNKER }));
      return crew.slice(0, n);
    }
    if (!el.kurz && el.art === "fuehrungstrupp") {
      const crew: Platz[] = [...ctx.leitung.values()].length ? [] : [p(F, "Bereitschaftsführer/-in"), p(F, "stellv. Bereitschaftsführer/-in")];
      while (crew.length < n) crew.push(p(M, "Führungsassistent/-in", { quali: FUEHRUNGSASSISTENT }));
      return crew;
    }
    const crew = normBesatzung(n, ctx.tf, kurz);
    if (leitung) crew[0] = leitung;
    return crew;
  }

  // Fachzug
  if (i === ctx.host && (/^ELW/.test(kurz) || istMannschaftstransport(kurz) || el.art === "fuehrungstrupp")) {
    return zugtrupp(n, el, ctx.stvAndersWo, ctx.tf);
  }
  if (istMannschaftstransport(kurz)) {
    const crew: Platz[] = [p(U, "Fahrzeugführer/-in"), p(M, "Fahrer/-in", { fe: FE.B })];
    let tfDran = true;
    while (crew.length < n) {
      crew.push(p(M, tfDran ? "Truppführer/-in" : "Truppmitglied", { quali: ctx.tf }));
      tfDran = !tfDran;
    }
    if (el.stvZf) crew[0] = p(U, "stellv. Zugführer/-in", { quali: "Zugführer", ...(el.stvZfAus ? { dienststelle: el.stvZfAus } : {}) });
    return crew.slice(0, n);
  }
  const crew = normBesatzung(n, ctx.tf, kurz);
  if (i === ctx.host) {
    // Zugführung führt das erste Fahrzeug, ein Truppführer ist ihr Stellvertreter.
    crew[0] = p(F, "Zugführer/-in", el.zfAus ? { dienststelle: el.zfAus } : {});
    if (!ctx.stvAndersWo) {
      const j = crew.findIndex((x) => x.funktion === "Truppführer/-in");
      if (j > 0) crew[j] = p(U, "stellv. Zugführer/-in", { quali: "Zugführer", ...(el.stvZfAus ? { dienststelle: el.stvZfAus } : {}) });
    }
  } else if (el.stvZf) {
    crew[0] = p(U, "stellv. Zugführer/-in", { quali: "Zugführer", ...(el.stvZfAus ? { dienststelle: el.stvZfAus } : {}) });
  }
  return crew;
}

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

function mobil(): string {
  return fakeTelefon(`01${ganz(5, 7)}${ganz(1, 9)}${String(ganz(0, 9999999)).padStart(7, "0")}`);
}

function dienststelleVon(el: El, lk: Landkreis): string {
  if (el.dienststelle) return el.dienststelle;
  if (el.traeger) return el.standort;
  const sonder = lk.standorte?.[el.standort];
  if (sonder) return sonder;
  return `Ortsfeuerwehr ${el.standort}`;
}

function personBauen(spec: Platz, el: El, lk: Landkreis): Person {
  const g = wuerfel(0.17) ? G.W : G.M;
  const { vorname, nachname } = neuerName(g);
  const fe =
    spec.fe ??
    (spec.rolle !== R.MANNSCHAFT
      ? gewichtet<FE>([[FE.C, 4], [FE.CE, 2], [FE.C1, 2], [FE.B, 3]])
      : gewichtet<FE>([[FE.B, 7], [FE.C1, 2], [FE.C, 2], [FE.CE, 1], [FE.NONE, 3]]));
  const person: Person = {
    vorname,
    nachname,
    staerkeRolle: spec.rolle,
    funktionen: [{ freitext: `${spec.funktion} (${elName(el)})` }],
    fahrerlaubnis: fe,
    dienststelle: spec.dienststelle ?? dienststelleVon(el, lk),
    geschlecht: g,
    ernaehrung: gewichtet<E>([[E.FLEISCH, 82], [E.VEGETARISCH, 13], [E.VEGAN, 5]]),
    kontakte: [],
    zusatzqualifikationen: spec.quali ? [{ freitext: spec.quali }] : [],
  };
  if (person.zusatzqualifikationen.length === 0 && wuerfel(0.1)) {
    person.zusatzqualifikationen = [{ freitext: wahl(QUALI_POOL) }];
  }
  if (spec.rolle !== R.MANNSCHAFT) person.kontakte.push({ art: KontaktArt.MOBIL, dienstlich: false, wert: mobil() });
  return person;
}

let laufendeNummer = 101;
const ordnungBelegt = new Map<string, number>();
const TRAEGER_KZ = { DRK: "RK", JUH: "JU", ASB: "AS" } as const;

function fahrzeugBauen(el: El, lk: Landkreis): Fahrzeug {
  const kurz = el.kurz!;
  const lang = FZ_LANG[kurz] ?? FZ_LANG[kurz.split(" ")[0]!] ?? kurz;
  const teile = [lang, `Standort: ${dienststelleVon(el, lk)}`];
  if (el.zusatz) teile.push(el.zusatz);
  const fahrzeug: Fahrzeug = { typ: { freitext: kurz }, aenderungen: teile.join("; ") };
  if (!/^AB/.test(kurz)) {
    fahrzeug.kennzeichen = `${lk.kfz}-${el.traeger ? TRAEGER_KZ[el.traeger] : "FW"} ${laufendeNummer++}`;
  }
  if (el.plaetze != null) fahrzeug.sitzplaetze = el.plaetze;
  let funkTeile = el.funk;
  if (!funkTeile && lk.fiktiveFunkrufnamen && !el.traeger) {
    const kennung = fzKennung(kurz);
    if (kennung != null && lk.standorte?.[el.standort] == null) {
      const oertl = oertlicheKennung(el.standort);
      const schluessel = `${lk.ordner}/${oertl}/${kennung}`;
      const ordnung = (ordnungBelegt.get(schluessel) ?? 0) + 1;
      ordnungBelegt.set(schluessel, ordnung);
      funkTeile = [oertl, kennung, ordnung];
    }
  }
  if (funkTeile) {
    fahrzeug.funkrufname = {
      kennwort: { code: el.kennwort ?? KW_FLORIAN },
      eigenerStandort: false,
      ort: lk.funkOrt ?? lk.name,
      teile: funkTeile,
    };
  }
  return fahrzeug;
}

interface BeispielBogen {
  lk: Landkreis;
  verband: Verband;
  teil: Teileinheit;
  /** Pfad unterhalb des Landkreis-Ordners, ohne .json. */
  pfad: string;
  bogen: Erfassungsbogen;
  /** Personen je Element (für die Sitzplatzprüfung). */
  besatzungen: { el: El; anzahl: number }[];
}

function bogenBauen(lk: Landkreis, v: Verband, t: Teileinheit, nr: number): BeispielBogen {
  const ctx = kontext(t);
  const personal: Person[] = [];
  const fahrzeuge: Fahrzeug[] = [];
  const besatzungen: { el: El; anzahl: number }[] = [];
  t.elemente.forEach((el, i) => {
    const crew = besatzung(el, i, ctx);
    for (const spec of crew) personal.push(personBauen(spec, el, lk));
    besatzungen.push({ el, anzahl: crew.length });
    if (el.kurz) fahrzeuge.push(fahrzeugBauen(el, lk));
  });

  const hierarchie: HierarchieEbene[] = [];
  if (v.ebene) hierarchie.push({ bezeichnung: { freitext: v.ebene.bezeichnung }, name: v.ebene.name });
  hierarchie.push({ bezeichnung: { code: 2 }, name: lk.name });

  const tag = datumAusIso(v.datumIso);
  const stand = tag * MINUTEN_JE_TAG + ganz(5, 7) * 60 + ganz(0, 59);
  const diesel = fahrzeuge.reduce((s, x) => s + dieselFuer(x.typ.freitext ?? ""), 0);
  const gemisch = t.elemente.filter((e) => /^(TSF|LF 16 TS|LF 8|FKH)/.test(e.kurz ?? "")).length * 10;
  const sonstiges = [t.sonstiges, v.beschreibung].filter(Boolean).join(" ");

  const bogen: Erfassungsbogen = {
    schemaVersion: SCHEMA_VERSION,
    uebung: true, // Beispielbogen: als Übung gekennzeichnet (Störer, PDF-Wasserzeichen)
    stand,
    einheit: {
      organisation: OrganisationsTyp.FEUERWEHR,
      organisationName: `Kreisfeuerwehr ${lk.anzeige}`,
      einheitsTyp: { freitext: t.name },
      hierarchie,
    },
    einsatz: { zeitraumVon: tag, zeitraumBis: tag + 2, ortAuftrag: v.ortAuftrag },
    personalErfassung: PersonalErfassung.VOLLSTAENDIG,
    personal,
    fahrzeuge,
    sofortbedarf: {
      verpflegungPersonen: personal.length,
      dieselLiter: diesel,
      benzinLiter: 0,
      gemischLiter: gemisch,
      unterbringung: true,
      ruhezeitErforderlich: false,
    },
    ...(sonstiges ? { sonstiges } : {}),
  };

  const pfad = v.teile.length > 1 ? `${v.pfad}/${String(nr).padStart(2, "0")}-${slug(t.name)}` : v.pfad;
  return { lk, verband: v, teil: t, pfad, bogen, besatzungen };
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replaceAll("ä", "ae").replaceAll("ö", "oe").replaceAll("ü", "ue").replaceAll("ß", "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
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

async function teilBild(url: string, teilNr: number, anzahlTeile: number): Promise<QrTeil> {
  const png = await QRCode.toBuffer(url, { ...QR_OPTIONEN, type: "png", width: 520 });
  return {
    datenUrl: `data:image/png;base64,${png.toString("base64")}`,
    url,
    teilNr,
    anzahl: anzahlTeile,
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
  for (let n = 2; n <= maxTeile; n++) {
    urls = segmentPayloadUrls(payload, n);
    if (urls.every((u) => qrVersion(u) <= QR_SEGMENT_ZIEL_VERSION)) break;
  }
  const teile = await Promise.all(urls.map((u, i) => teilBild(u, i + 1, urls.length)));
  return { teile, segmentiert: true, zeichen: url.length, version: Math.max(...teile.map((t) => t.version)) };
}

/** QR-Roundtrip: Payload (ggf. aus Segmenten zusammengesetzt) → Bogen dekodierbar. */
function roundtrip(satz: QrSatz, b: Erfassungsbogen, datei: string): void {
  let payload: Uint8Array;
  if (!satz.segmentiert) {
    const url = satz.teile[0]!.url;
    payload = base64UrlDekodieren(url.slice(url.indexOf("#") + 1));
  } else {
    const teile = satz.teile.map((t) => parseSegmentUrl(t.url)).sort((a, c) => a.teilNr - c.teilNr);
    payload = new Uint8Array(teile.reduce((s, t) => s + t.chunk.length, 0));
    let offset = 0;
    for (const t of teile) {
      payload.set(t.chunk, offset);
      offset += t.chunk.length;
    }
  }
  const dekodiert = decodePayload(payload, nodeKompressor);
  if (staerke(dekodiert).gesamt !== b.personal.length) {
    throw new Error(`${datei}: QR-Roundtrip-Stärke ${staerke(dekodiert).gesamt} ≠ ${b.personal.length}`);
  }
  if (dekodiert.personal.some((p, i) => p.dienststelle !== b.personal[i]!.dienststelle)) {
    throw new Error(`${datei}: Dienststelle geht im QR-Roundtrip verloren`);
  }
}


// ---------------------------------------------------------------- Hauptlauf

const beispiele: BeispielBogen[] = LANDKREISE.flatMap((lk) =>
  lk.verbaende.flatMap((v) => v.teile.map((t, i) => bogenBauen(lk, v, t, i + 1))),
);

// Selbstprüfung: Jede Besatzung passt in ihr Fahrzeug, die Sitzplatzbilanz des
// Bogens geht auf (sonst meldet die App „Sitzplätze fehlen").
for (const b of beispiele) {
  const name = `${b.lk.ordner}/${b.pfad}`;
  for (const { el, anzahl } of b.besatzungen) {
    if (!el.kurz) continue;
    const pl = plaetzeVon(el);
    if (pl != null && anzahl > pl) throw new Error(`${name}: ${anzahl} Personen auf ${elName(el)} mit ${pl} Plätzen`);
  }
  if (b.bogen.fahrzeuge.length > 0) {
    const bilanz = sitzplatzBilanz(b.bogen.fahrzeuge, [], b.bogen.personal.length);
    if (bilanz.fehlend > 0) throw new Error(`${name}: Sitzplatzbilanz fehlt ${bilanz.fehlend}`);
  }
  if (b.bogen.personal.length === 0) throw new Error(`${name}: ohne Personal`);
  if (!b.bogen.personal.some((x) => x.staerkeRolle === R.FUEHRER)) throw new Error(`${name}: ohne Führung`);
}

const basis = join(wurzel, "examples", "feuerwehr", "niedersachsen", "kreisfeuerwehren");
rmSync(basis, { recursive: true, force: true });

let segmentierte = 0;
for (const bsp of beispiele) {
  const qr = await qrSatz(bsp.bogen);
  roundtrip(qr, bsp.bogen, bsp.pfad);
  if (qr.segmentiert) segmentierte++;
  const ziel = join(basis, bsp.lk.ordner, `${bsp.pfad}.json`);
  mkdirSync(dirname(ziel), { recursive: true });
  writeFileSync(ziel, JSON.stringify(bsp.bogen, null, 2) + "\n");
}

// ------------------------------------------------------------------ README

function summe(boegen: BeispielBogen[]): string {
  let f = 0, u = 0, m = 0;
  for (const b of boegen) {
    const s = staerke(b.bogen);
    f += s.fuehrer; u += s.unterfuehrer; m += s.mannschaft;
  }
  return `${f}/${u}/${m}/${f + u + m}`;
}

function fzListe(t: Teileinheit): string {
  const fzs = t.elemente.filter((e) => e.kurz).map(elName);
  return fzs.length ? fzs.join(", ") : "keine genannt";
}

for (const lk of LANDKREISE) {
  const eigene = beispiele.filter((b) => b.lk === lk);
  const abschnitte = lk.verbaende.map((v) => {
    const boegen = eigene.filter((b) => b.verband === v);
    const zeilen = boegen.map((b) => {
      const s = staerke(b.bogen);
      return `| ${b.pfad} | ${b.teil.name} | ${s.fuehrer}/${s.unterfuehrer}/${s.mannschaft}/${s.gesamt} | ${fzListe(b.teil)} |`;
    });
    return `## ${v.titel}

${boegen.length === 1 ? "Ein Bogen" : `${boegen.length} Bögen`}, zusammen ${summe(boegen)}.

| Datei | Teileinheit | Stärke F/U/M/Σ | Fahrzeuge (Standort) |
|---|---|---|---|
${zeilen.join("\n")}
`;
  });
  writeFileSync(
    join(basis, lk.ordner, "README.md"),
    `# Beispiel-Erfassungsbögen — Kreisfeuerwehr ${lk.anzeige}

${eigene.length} Bögen für Kreiseinheiten der Kreisfeuerwehr ${lk.anzeige}. Eine
Einheit aus mehreren Teileinheiten hat einen eigenen Ordner mit einem Bogen je
Teileinheit; eine Einheit, die als Ganzes ausrückt, ist ein einzelner Bogen.

Quellen (abgerufen am 09.11.2026):

${lk.quellen.map((q) => `- ${q}`).join("\n")}

${lk.hinweise.join("\n\n")}

Alle Personen sind fiktiv, auch die auf den Seiten namentlich genannten
Führungskräfte; ebenso Kennzeichen und Einsatzaufträge. Jede Person trägt ihre
Ortsfeuerwehr als Dienststelle, die Funktion nennt das Fahrzeug. Gemeinsame
Regeln aller Landkreise: [../README.md](../README.md).

Neu erzeugen mit: \`npm run beispiele:kreisfeuerwehr-nds\`

${abschnitte.join("\n")}`,
  );
}

writeFileSync(
  join(basis, "README.md"),
  `# Beispiel-Erfassungsbögen — Kreiseinheiten niedersächsischer Kreisfeuerwehren

${beispiele.length} Bögen für Kreisfeuerwehrbereitschaften und weitere Kreiseinheiten
(TEL, IuK, Gefahrgut-, Versorgungs- und Logistikeinheiten) aus
${LANDKREISE.length} Landkreisen. Gliederung, Fahrzeuge, Standorte und, wo angegeben,
Funkrufnamen und Stärken stammen von den Seiten der Kreisfeuerwehrverbände; die
Quellen stehen in der README jedes Landkreises.

Eine Bereitschaft ist ein Ordner mit einem Bogen je Teileinheit (Führung,
Fachzüge). So lässt sich jede Teileinheit einzeln melden oder die ganze
Bereitschaft in eine Übungs-Sammlung übernehmen.

Besatzung: Wo die Seite eine Stärke nennt, gilt sie; sonst die Normbesatzung des
Fahrzeugs (Trupp 1/2, Staffel 1/5, Gruppe 1/8, Mannschaftstransportwagen sechs
Kräfte, RTW zwei). Der Zugtrupp (Zugführung, Stellvertretung, Führungsassistenz,
Fahrer) sitzt auf dem ELW, sonst auf dem Mannschaftstransportwagen, sonst auf dem
ersten Fahrzeug des Zuges.

Stärkerolle wie in der Stärkemeldung: Führung der Bereitschaft, des Zuges oder der
Einheit → F, Stellvertretung der Zugführung und Fahrzeugführungen → U, alle
übrigen → M.

Nennt eine Seite für eine Einheit keine Fahrzeuge, steht nur das Personal auf dem
Bogen. Fahrzeuge werden nicht erfunden.

Neu erzeugen mit: \`npm run beispiele:kreisfeuerwehr-nds\` (deterministisch, fester Zufalls-Seed).

| Landkreis | Bögen | Stärke F/U/M/Σ |
|---|---|---|
${LANDKREISE.map((lk) => {
  const eigene = beispiele.filter((b) => b.lk === lk);
  return `| [${lk.anzeige}](${lk.ordner}/README.md) | ${eigene.length} | ${summe(eigene)} |`;
}).join("\n")}
`,
);

console.log(`Fertig: ${beispiele.length} Beispielbögen in examples/feuerwehr/niedersachsen/kreisfeuerwehren/`);
console.log(`Segmentierte QR: ${segmentierte}`);
for (const lk of LANDKREISE) {
  const eigene = beispiele.filter((b) => b.lk === lk);
  console.log(`  ${lk.anzeige}: ${eigene.length} Bögen, ${summe(eigene)}`);
  for (const b of eigene) {
    const s = staerke(b.bogen);
    console.log(`    ${b.pfad}: ${s.fuehrer}/${s.unterfuehrer}/${s.mannschaft}/${s.gesamt}, ${b.bogen.fahrzeuge.length} Fz`);
  }
}
