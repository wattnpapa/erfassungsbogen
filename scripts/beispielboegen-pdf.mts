/**
 * Erzeugt 100 Beispiel-Erfassungsbögen von THW-Einheiten aus ganz Deutschland
 * als PDF nach examples/ (bewusst NUR die PDFs — das maschinenlesbare JSON
 * steckt bereits in der PDF eingebettet).
 *
 * Aufruf (Node ≥ 22): npm run beispiele
 *
 * Konstruktion (deterministisch, fester Zufalls-Seed):
 *  - 100 Ortsverbände aus dem OV-Verzeichnis (src/vokabulare/thw-ov.ts),
 *    proportional über alle Landesverbände verteilt.
 *  - Einheitstyp je OV aus einer realistisch gewichteten Verteilung; Personal-
 *    und Fahrzeug-Soll kommen aus den StAN-Vokabularen (thw-stan-personal.ts /
 *    thw-stan-fahrzeuge.ts).
 *  - Genau 40 Bögen sind exakt im StAN-Soll; die übrigen 60 weichen zufällig
 *    ab (mehr/weniger Personal, fehlende/zusätzliche Fahrzeuge) — Abweichungen
 *    werden unter "Sonstiges" erläutert, OV-eigene Zusatzfahrzeuge stehen mit
 *    stanKonform = nein im Bogen.
 *  - Funkrufnamen streng nach Taschenkarte THW-Funkrufnamen (02/2022):
 *    1. Zahl = Teileinheit-Kennzahl je Einheitstyp (immer 1. Zug/TZ),
 *    2. Zahl = Fahrzeug-Kennzahl aus der StAN-Vorbelegung; Anhänger, Boote auf
 *    Anhängern und Nicht-Funkstellen (Gabelstapler) tragen keinen Funkrufnamen.
 *    Zusatzfahrzeuge bekommen die nächste freie Kennzahl ihrer Klasse
 *    (PKW 21-24, MTW 25-28, MzKW 54).
 *
 * Am Ende läuft eine Selbstprüfung (Verteilung, Funkrufnamen-Regeln,
 * QR-Roundtrip); examples/README.md bekommt eine Übersichtstabelle.
 */

import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pdfmake from "pdfmake";
import QRCode from "qrcode";
import {
  Erfassungsbogen,
  Ernaehrung as E,
  Fahrerlaubnis as FE,
  Fahrzeug,
  Funkrufname,
  Geschlecht as G,
  HierarchieEbene,
  KontaktArt,
  OrganisationsTyp,
  Person,
  PersonalErfassung,
  SCHEMA_VERSION,
  StaerkeRolle as R,
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
import { pdfDokument } from "../src/app/pdf-dokument";
import type { QrSatz, QrTeil } from "../src/app/hilfen";
import { THW_EINHEITSTYPEN, THW_FAHRZEUGTYPEN } from "../src/vokabulare/thw";
import {
  THW_FAHRZEUG_KENNZAHLEN,
  THW_TEILEINHEIT_KENNZAHLEN,
  teileinheitKennzahl,
} from "../src/vokabulare/thw-funkrufnamen";
import { THW_STAN_FAHRZEUGE } from "../src/vokabulare/thw-stan-fahrzeuge";
import { THW_STAN_PERSONAL } from "../src/vokabulare/thw-stan-personal";
import { THW_ORTSVERBAENDE, type ThwOrtsverband } from "../src/vokabulare/thw-ov";
import {
  THW_LANDESVERBAENDE_KONTAKT,
  THW_OV_REGIONALSTRUKTUR,
  THW_REGIONALSTELLEN_KONTAKT,
} from "../src/vokabulare/thw-ov-regionalstruktur";

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
const rnd = prng(20260714);

const ganz = (minInkl: number, maxInkl: number): number =>
  minInkl + Math.floor(rnd() * (maxInkl - minInkl + 1));
const wuerfel = (p: number): boolean => rnd() < p;
const wahl = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)]!;
function mischen<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}
/** Gewichtete Auswahl: `paare` = [Wert, Gewicht]. */
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
  "Albrecht", "Arnold", "Bauer", "Baumann", "Becker", "Berger", "Bergmann", "Böhm",
  "Brandt", "Braun", "Brunner", "Busch", "Dietrich", "Ebert", "Engel", "Ernst",
  "Fischer", "Franke", "Friedrich", "Fuchs", "Geiger", "Graf", "Groß", "Günther",
  "Haas", "Hahn", "Hartmann", "Heinrich", "Herrmann", "Hoffmann", "Horn", "Huber",
  "Jäger", "Jung", "Kaiser", "Keller", "Kern", "Klein", "Koch", "Köhler",
  "König", "Krämer", "Kraus", "Krüger", "Kuhn", "Lang", "Lehmann", "Lenz",
  "Lorenz", "Ludwig", "Lutz", "Maier", "Marx", "Menzel", "Meyer", "Möller",
  "Müller", "Neumann", "Otto", "Peters", "Pfeiffer", "Pohl", "Reuter", "Richter",
  "Roth", "Sauer", "Schäfer", "Scherer", "Schmidt", "Schmitt", "Schneider", "Scholz",
  "Schröder", "Schubert", "Schulte", "Schulz", "Schwarz", "Seidel", "Sommer", "Stein",
  "Thiel", "Vogel", "Vogt", "Voigt", "Wagner", "Walter", "Weber", "Weiß",
  "Wenzel", "Werner", "Winkler", "Winter", "Wolf", "Ziegler", "Zimmermann",
] as const;

// --------------------------------------------------- Einheitstyp-Eigenschaften

/**
 * Wie oft welcher Einheitstyp unter den 100 Beispielen vorkommt (Summe = 100).
 * Grob an der realen Häufigkeit orientiert: Zugtrupp/Bergungsgruppe/FGr N gibt
 * es in jedem Technischen Zug, Spezial-Fachgruppen sind selten.
 */
const TYP_VERTEILUNG: Record<number, number> = {
  3: 10, // ZTr TZ
  4: 16, // B
  5: 3, // B (ASH)
  6: 4, // FGr R (A)
  7: 4, // FGr R (B)
  8: 2, // FGr R (C)
  9: 5, // FGr W (A)
  10: 2, // FGr W (B)
  11: 1, // FGr BrB
  12: 2, // FGr O (A)
  13: 2, // FGr O (B)
  14: 1, // FGr O (C)
  15: 1, // FGr Sp
  16: 10, // FGr N
  19: 2, // FGr SB (B)
  20: 2, // Tr ESS
  21: 1, // Tr MHP
  22: 2, // Tr UL
  24: 3, // FGr I
  25: 3, // FGr E
  26: 2, // FGr TW
  27: 3, // FGr WP (A)
  28: 2, // FGr WP (B)
  29: 1, // FGr WP (C)
  30: 1, // FGr Öl (A)
  31: 1, // FGr Öl (B)
  32: 1, // FGr Öl (C)
  36: 2, // ZTr FZ Log
  37: 2, // FGr Log-MW
  38: 3, // FGr Log-V
  39: 1, // Tr Log-TS
  41: 1, // ZTr FZ FK
  42: 1, // FGr F
  43: 2, // FGr K (A)
  44: 1, // FGr K (B)
};

/** Zusatzfunktionen je Einheitstyp: `pflicht` auf die ersten Helfer, `pool` gestreut. */
const ZUSATZ: Record<number, { pflicht: number[]; pool: number[] }> = {
  3: { pflicht: [30], pool: [30, 31, 34] },
  4: { pflicht: [38, 32], pool: [30, 31, 32, 38, 59] },
  5: { pflicht: [38, 32], pool: [30, 31, 32, 38, 59] },
  6: { pflicht: [41], pool: [41, 38, 30, 31, 39] },
  7: { pflicht: [41], pool: [41, 38, 30, 31, 39] },
  8: { pflicht: [42], pool: [42, 38, 30, 31] },
  9: { pflicht: [36, 36], pool: [36, 37, 31, 30, 39] },
  10: { pflicht: [37], pool: [37, 36, 31, 30] },
  11: { pflicht: [40, 39], pool: [39, 40, 59, 30, 31] },
  12: { pflicht: [56], pool: [56, 30, 31, 62] },
  13: { pflicht: [46], pool: [46, 30, 31, 62] },
  14: { pflicht: [46], pool: [46, 30, 31] },
  15: { pflicht: [57, 58], pool: [57, 58, 30, 31] },
  16: { pflicht: [49, 51], pool: [49, 51, 30, 31, 90] },
  19: { pflicht: [43], pool: [43, 38, 32, 30, 31, 59] },
  20: { pflicht: [], pool: [30, 31] },
  21: { pflicht: [], pool: [30, 31] },
  22: { pflicht: [82], pool: [82, 83, 30] },
  24: { pflicht: [90, 89], pool: [90, 89, 49, 30, 31] },
  25: { pflicht: [49, 90], pool: [49, 90, 30, 31] },
  26: { pflicht: [52, 84], pool: [52, 84, 85, 30, 31] },
  27: { pflicht: [51], pool: [51, 49, 30, 31] },
  28: { pflicht: [51], pool: [51, 49, 30, 31] },
  29: { pflicht: [51], pool: [51, 49, 30, 31] },
  30: { pflicht: [55], pool: [55, 54, 30, 31] },
  31: { pflicht: [55], pool: [55, 54, 30, 31] },
  32: { pflicht: [55], pool: [55, 54, 30, 31] },
  36: { pflicht: [30], pool: [30, 31, 34, 67] },
  37: { pflicht: [47, 88], pool: [47, 88, 66, 30, 31, 39] },
  38: { pflicht: [86, 85], pool: [86, 85, 30, 31, 47] },
  39: { pflicht: [100], pool: [100, 39, 30] },
  41: { pflicht: [30], pool: [30, 31, 34] },
  42: { pflicht: [34, 35], pool: [34, 35, 30, 71] },
  43: { pflicht: [34], pool: [34, 53, 30, 31] },
  44: { pflicht: [34, 53], pool: [34, 53, 30, 31] },
};

/** Externe/Berufs-Qualifikationen (Freitext) — gelegentlich gestreut. */
const QUALI_POOL = [
  "Elektrofachkraft (Beruf)",
  "Berufskraftfahrer (Beruf)",
  "Rettungssanitäter (extern)",
  "Zimmerer (Beruf)",
  "Landwirt — Erfahrung Großgeräte",
  "Motorsägenschein AS Baum I (extern)",
  "Funkamateur (extern)",
  "Gesundheits- und Krankenpfleger (Beruf)",
  "Feuerwehr-Doppelmitglied (AGT)",
  "Tischler (Beruf)",
] as const;

/** Einsatz-Szenario (ortAuftrag) je Einheitstyp; {ort} = Standort-Ort des OV. */
const SZENARIO: Record<number, string[]> = {
  3: ["Sturmtief »Quirin« {ort} — Führung Technischer Zug", "Hochwasserlage {ort} — Führung Technischer Zug"],
  4: ["Sturmtief »Quirin« {ort} — Beräumung, Sicherung", "Gebäudeschaden {ort} — Abstützen, Räumen", "Hochwasser {ort} — Sandsackverbau, Deichsicherung"],
  5: ["Einsturzgefahr Wohngebäude {ort} — Abstützsystem Holz", "Gebäudeschaden nach Explosion {ort} — Abstützen"],
  6: ["Unwetterschäden {ort} — Räumen Verkehrswege", "Erdrutsch bei {ort} — Räumen, Freilegen"],
  7: ["Unwetterschäden {ort} — Räumen Verkehrswege", "Hochwasser {ort} — Beseitigung Treibgut"],
  8: ["Sturmschäden {ort} — Räumen, Materialumschlag"],
  9: ["Hochwasser {ort} — Personenrettung, Transport", "Hochwasserlage {ort} — Deichverteidigung, Bootsbetrieb"],
  10: ["Hochwasser {ort} — Fährbetrieb, Transport"],
  11: ["Hochwasser {ort} — Behelfsbrücke Wirtschaftsweg"],
  12: ["Gebäudeeinsturz {ort} — biologische Ortung", "Vermisstensuche {ort} — Rettungshunde"],
  13: ["Gebäudeeinsturz {ort} — technische Ortung"],
  14: ["Gebäudeschaden {ort} — Ortung, Erkundung"],
  15: ["Eisgang/Verklausung bei {ort} — Sprengvorbereitung"],
  16: ["Stromausfall {ort} — Notstromeinspeisung", "Trinkwassernotstand {ort} — Notinstandsetzung", "Unwetter {ort} — Notversorgung kritische Infrastruktur"],
  19: ["Gebäudeeinsturz {ort} — schwere Bergung, Schreitbagger"],
  20: ["Unwetterlage {ort} — Einsatzstellensicherung"],
  21: ["Hochwasser {ort} — mobile Pegelüberwachung"],
  22: ["Hochwasserlage {ort} — Luftbilderkundung", "Vermisstensuche {ort} — Erkundung mit UAS"],
  24: ["Hochwasser {ort} — Notinstandsetzung Infrastruktur", "Stromausfall {ort} — Anschluss Notstromnetz"],
  25: ["Stromausfall {ort} — Netzersatzbetrieb Klinikum", "Flächenlage {ort} — Elektroversorgung Bereitstellungsraum"],
  26: ["Trinkwassernotversorgung {ort} — TWAA-Betrieb"],
  27: ["Hochwasser {ort} — Wasserförderung, Kellerpumpen", "Starkregen {ort} — Auspumpen Unterführungen"],
  28: ["Hochwasser {ort} — Wasserförderung 15.000 l/min"],
  29: ["Hochwasser {ort} — Großpumpeneinsatz Polder"],
  30: ["Ölschaden Hafen {ort} — Ölsperren, Separation"],
  31: ["Ölschaden Küstenbereich {ort} — Ölaufnahme"],
  32: ["Ölschaden Gewässer bei {ort} — Ölsperren, Skimmer"],
  36: ["Bereitstellungsraum {ort} — Führung Fachzug Logistik"],
  37: ["Bereitstellungsraum {ort} — Materialwirtschaft, Instandhaltung"],
  38: ["Bereitstellungsraum {ort} — Verpflegung Einsatzkräfte", "Flächenlage {ort} — Verpflegung 250 Portionen/Ausgabe"],
  39: ["Schwertransport Pumpentechnik nach {ort}"],
  41: ["Einsatzabschnitt {ort} — Führung Fachzug F/K"],
  42: ["Einsatzabschnitt {ort} — Führungsunterstützung, Lage"],
  43: ["Flächenlage {ort} — Weitverkehrsanbindung, Kommunikation"],
  44: ["Flächenlage {ort} — Richtfunkstrecken, Mastbetrieb"],
};

// ------------------------------------------------- Fahrzeuge: Hilfstabellen

/** Fahrzeugtyp-Codes ohne eigenes Kennzeichen (Baumaschinen, Stapler, Boote). */
const OHNE_KENNZEICHEN: Record<number, string> = {
  16: "auf Anh Tieflader",
  17: "auf Anh Tieflader",
  18: "auf Anh Tieflader",
  19: "auf Anh Tieflader",
  21: "auf LKW verlastet",
  22: "auf Anh",
};

/** Kraftstoff-Sofortbedarf je Fahrzeugtyp-Code: [Diesel, Benzin] in Litern. */
const KRAFTSTOFF: Record<number, [number, number]> = {
  1: [40, 0], 2: [30, 0], 3: [40, 0], 4: [60, 0], 5: [30, 0], 6: [50, 0],
  7: [80, 0], 8: [70, 0], 9: [70, 0], 10: [80, 0], 11: [90, 0], 12: [90, 0],
  13: [120, 0], 14: [0, 0], 15: [25, 0], 16: [100, 0], 17: [80, 0], 18: [60, 0],
  19: [60, 0], 20: [120, 0], 21: [20, 0], 22: [0, 40], 23: [30, 0], 24: [30, 0],
  47: [100, 0], 48: [200, 0], 49: [300, 0], 50: [60, 0], 51: [100, 0], 52: [150, 0],
};

/** Einheitstypen mit Motorsägen an Bord → Gemisch-Bedarf. */
const MIT_MOTORSAEGE = new Set([4, 5, 6, 7, 8, 19]);

/** Fahrzeugtypen, die einen CE-Kraftfahrer voraussetzen. */
const SCHWERE_FAHRZEUGE = new Set([4, 6, 7, 8, 9, 10, 11, 12, 13, 20]);

/** Anhänger/Auflieger (kein eigener Antrieb). */
const ANHAENGER = new Set([14, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55]);
const istAnhaenger = (fz: Fahrzeug): boolean =>
  fz.typ.code != null ? ANHAENGER.has(fz.typ.code) : (fz.typ.freitext ?? "").startsWith("Anh");

/** OV-eigene Zusatzfahrzeuge (Abweichung „mehr Fahrzeuge"): Klasse → Kennzahlen. */
const EXTRA_FAHRZEUGE: { freitext: string; kennzahlen: number[]; kraftstoff: [number, number] }[] = [
  { freitext: "MTW OV", kennzahlen: [25, 26, 27, 28], kraftstoff: [30, 0] },
  { freitext: "PKW OV", kennzahlen: [21, 22, 23, 24], kraftstoff: [20, 0] },
  { freitext: "MzKW", kennzahlen: [54], kraftstoff: [50, 0] },
  { freitext: "Anh OV (Plane)", kennzahlen: [], kraftstoff: [0, 0] },
];

// --------------------------------------------------------------- Kurzhelfer

const typEintrag = (code: number) => THW_EINHEITSTYPEN.find((t) => t.code === code)!;
const fahrzeugKurz = (fz: Fahrzeug): string =>
  fz.typ.freitext ?? THW_FAHRZEUGTYPEN.find((t) => t.code === fz.typ.code)?.kurz ?? "?";

function slug(s: string): string {
  return s
    .toLowerCase()
    .replaceAll("ä", "ae").replaceAll("ö", "oe").replaceAll("ü", "ue").replaceAll("ß", "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** OV → Hierarchie OV/RSt/LV mit Kontaktdaten — wie das Autofill der App. */
function hierarchieFuerOv(ov: ThwOrtsverband): HierarchieEbene[] {
  const ebenen: HierarchieEbene[] = [
    {
      bezeichnung: { code: 1 },
      name: ov.name,
      kurz: ov.kurz || undefined,
      telefon: ov.telefon.replace(/\D/g, "") || undefined,
      email: ov.email || undefined,
    },
  ];
  const struktur = THW_OV_REGIONALSTRUKTUR[ov.name];
  if (struktur) {
    const rst = THW_REGIONALSTELLEN_KONTAKT[struktur.regionalstelle];
    const lv = THW_LANDESVERBAENDE_KONTAKT[struktur.landesverband];
    ebenen.push({
      bezeichnung: { code: 2 },
      name: struktur.regionalstelle,
      telefon: rst?.telefon.replace(/\D/g, ""),
      email: rst?.email,
    });
    ebenen.push({
      bezeichnung: { code: 3 },
      name: struktur.landesverband,
      telefon: lv?.telefon.replace(/\D/g, ""),
      email: lv?.email,
    });
  }
  return ebenen;
}

// --------------------------------------------------------- OV-Auswahl (100)

/** 100 OVs, proportional je Landesverband, innerhalb des LV gleichmäßig gestreut. */
function ovsWaehlen(anzahl: number): ThwOrtsverband[] {
  const jeLv = new Map<string, ThwOrtsverband[]>();
  for (const ov of THW_ORTSVERBAENDE) {
    const lv = THW_OV_REGIONALSTRUKTUR[ov.name]?.landesverband;
    if (!lv) continue;
    (jeLv.get(lv) ?? jeLv.set(lv, []).get(lv)!).push(ov);
  }
  const gesamt = [...jeLv.values()].reduce((s, l) => s + l.length, 0);
  // Größte-Reste-Verfahren für die Quoten je Landesverband.
  const quoten = [...jeLv.entries()].map(([lv, liste]) => {
    const roh = (liste.length / gesamt) * anzahl;
    return { lv, liste, basis: Math.floor(roh), rest: roh - Math.floor(roh) };
  });
  let vergeben = quoten.reduce((s, q) => s + q.basis, 0);
  for (const q of quoten.sort((a, b) => b.rest - a.rest)) {
    if (vergeben >= anzahl) break;
    q.basis++;
    vergeben++;
  }
  const auswahl: ThwOrtsverband[] = [];
  for (const q of quoten.sort((a, b) => a.lv.localeCompare(b.lv))) {
    const liste = [...q.liste].sort((a, b) => a.name.localeCompare(b.name));
    for (let i = 0; i < q.basis; i++) {
      // Gleichmäßig über die alphabetische Liste streuen → geografische Breite.
      auswahl.push(liste[Math.floor(((i + 0.5) * liste.length) / q.basis)]!);
    }
  }
  return auswahl;
}

// ------------------------------------------------------- Personal generieren

interface PersonenFabrik {
  neu: (rolle: R, funktion: number | undefined, kontakt: boolean) => Person;
}

/** Namens-Fabrik je Bogen: eindeutige Namen, plausible Attribute. */
function personenFabrik(): PersonenFabrik {
  const vergeben = new Set<string>();
  return {
    neu: (rolle, funktion, kontakt) => {
      const g = wuerfel(0.22) ? G.W : G.M;
      let vorname = "";
      let nachname = "";
      do {
        vorname = wahl(g === G.W ? VORNAMEN_W : VORNAMEN_M);
        nachname = wahl(NACHNAMEN);
      } while (vergeben.has(`${vorname} ${nachname}`));
      vergeben.add(`${vorname} ${nachname}`);

      const fe =
        rolle === R.FUEHRER || rolle === R.UNTERFUEHRER
          ? gewichtet<FE>([[FE.CE, 5], [FE.C, 4], [FE.B, 1]])
          : gewichtet<FE>([[FE.NONE, 7], [FE.B, 6], [FE.C, 4], [FE.CE, 3]]);

      const person: Person = {
        vorname,
        nachname,
        staerkeRolle: rolle,
        funktionen: funktion != null ? [{ code: funktion }] : [{ code: 5 }],
        fahrerlaubnis: fe,
        geschlecht: g,
        ernaehrung: gewichtet<E>([[E.FLEISCH, 78], [E.VEGETARISCH, 15], [E.VEGAN, 7]]),
        kontakte: [],
        zusatzqualifikationen: wuerfel(0.1) ? [{ freitext: wahl(QUALI_POOL) }] : [],
      };
      if (kontakt) {
        person.kontakte.push({
          art: KontaktArt.MOBIL,
          dienstlich: false,
          wert: `01${ganz(5, 7)}${ganz(1, 9)}${String(ganz(0, 9999999)).padStart(7, "0")}`,
        });
        person.kontakte.push({ art: KontaktArt.EMAIL, dienstlich: true, emailTemplate: 1 });
      }
      return person;
    },
  };
}

/** StAN-Sollplätze → Personen; `delta` fügt Helfer hinzu bzw. streicht sie. */
function personalBauen(typCode: number, delta: number): Person[] {
  const fabrik = personenFabrik();
  const personen: Person[] = [];
  for (const platz of THW_STAN_PERSONAL[typCode] ?? []) {
    for (let i = 0; i < platz.anzahl; i++) {
      personen.push(
        fabrik.neu(platz.staerkeRolle, platz.funktion, personen.length === 0),
      );
    }
  }
  const fuehrung = personen.filter((p) => p.staerkeRolle !== R.MANNSCHAFT).length;
  if (delta > 0) {
    for (let i = 0; i < delta; i++) personen.push(fabrik.neu(R.MANNSCHAFT, undefined, false));
  } else if (delta < 0) {
    // Von hinten streichen (nur Mannschaft); Führung + 2 bleiben immer.
    let streichen = -delta;
    for (let i = personen.length - 1; i >= 0 && streichen > 0 && personen.length > fuehrung + 2; i--) {
      if (personen[i]!.staerkeRolle === R.MANNSCHAFT) {
        personen.splice(i, 1);
        streichen--;
      }
    }
  }

  // Zusatzfunktionen: Pflicht-Funktionen auf die ersten Helfer, Pool gestreut.
  const zusatz = ZUSATZ[typCode];
  if (zusatz) {
    const helfer = personen.filter((p) => p.staerkeRolle === R.MANNSCHAFT);
    zusatz.pflicht.forEach((code, i) => {
      const ziel = helfer[i % Math.max(1, helfer.length)];
      if (ziel && !ziel.funktionen.some((f) => f.code === code)) ziel.funktionen.push({ code });
    });
    for (const p of personen) {
      if (wuerfel(0.3)) {
        const code = wahl(zusatz.pool);
        if (!p.funktionen.some((f) => f.code === code)) p.funktionen.push({ code });
      }
    }
  }

  // Zweite Führungskraft bekommt zu 60 % eine Mobilnummer (Erreichbarkeit).
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

// ------------------------------------------------------ Fahrzeuge generieren

let naechstesKennzeichen = 80101;

interface FahrzeugPlan {
  fahrzeuge: Fahrzeug[];
  notizen: string[];
}

/**
 * StAN-Fahrzeuge (mit korrekten Funkrufnamen) plus Abweichungen:
 * `minus` streicht ein Fahrzeug (Instandsetzung), `plus` ergänzt ein
 * OV-Fahrzeug (stanKonform = nein) mit freier Kennzahl seiner Klasse.
 */
function fahrzeugeBauen(typCode: number, minus: boolean, plus: boolean): FahrzeugPlan {
  const teil = teileinheitKennzahl(typCode);
  const notizen: string[] = [];
  const fahrzeuge: Fahrzeug[] = [];

  for (const vorgabe of THW_STAN_FAHRZEUGE[typCode] ?? []) {
    for (let i = 0; i < vorgabe.anzahl; i++) {
      const fz: Fahrzeug = { typ: { ...vorgabe.typ }, stanKonform: true };
      const code = vorgabe.typ.code;
      if (code != null && OHNE_KENNZEICHEN[code]) {
        fz.kennzeichenFreitext = OHNE_KENNZEICHEN[code];
      } else {
        fz.thwKennzeichen = naechstesKennzeichen++;
      }
      const kennzahl = vorgabe.kennzahlen?.[i];
      if (teil != null && kennzahl != null) {
        const funkrufname: Funkrufname = {
          kennwort: { code: 1 }, // Heros
          eigenerStandort: true,
          teile: [teil, kennzahl],
        };
        fz.funkrufname = funkrufname;
      }
      fahrzeuge.push(fz);
    }
  }

  if (minus && fahrzeuge.length >= 2) {
    // Streichbar ist nur, was mindestens ein motorisiertes Fahrzeug übrig lässt
    // (eine Einheit rückt nicht allein mit Anhängern aus).
    const motoren = fahrzeuge.filter((fz) => !istAnhaenger(fz)).length;
    const kandidaten = fahrzeuge
      .map((fz, i) => ({ fz, i }))
      .filter(({ fz }) => istAnhaenger(fz) || motoren >= 2);
    if (kandidaten.length > 0) {
      const { fz, i } = wahl(kandidaten);
      fahrzeuge.splice(i, 1);
      notizen.push(`${fahrzeugKurz(fz)} in Instandsetzung — nicht mit ausgerückt.`);
    }
  }

  if (plus) {
    const belegt = new Set(fahrzeuge.map((f) => f.funkrufname?.teile[1]).filter((k) => k != null));
    const kandidaten = mischen(EXTRA_FAHRZEUGE);
    for (const extra of kandidaten) {
      const frei = extra.kennzahlen.find((k) => !belegt.has(k));
      if (extra.kennzahlen.length > 0 && frei == null) continue; // Klasse voll belegt
      const fz: Fahrzeug = {
        typ: { freitext: extra.freitext },
        thwKennzeichen: naechstesKennzeichen++,
        stanKonform: false,
        aenderungen: "OV-eigenes Fahrzeug, zusätzlich zur StAN",
      };
      if (teil != null && frei != null) {
        fz.funkrufname = { kennwort: { code: 1 }, eigenerStandort: true, teile: [teil, frei] };
      }
      fahrzeuge.push(fz);
      notizen.push(`${extra.freitext} zusätzlich über StAN-Soll dabei.`);
      break;
    }
  }

  return { fahrzeuge, notizen };
}

// -------------------------------------------------------- Bogen zusammensetzen

interface BeispielBogen {
  datei: string;
  bogen: Erfassungsbogen;
  ov: ThwOrtsverband;
  landesverband: string;
  abweichung: string; // "—" = StAN-Soll
}

function bogenBauen(nr: number, ov: ThwOrtsverband, typCode: number, stanTreu: boolean): BeispielBogen {
  const typ = typEintrag(typCode);

  // Abweichungsplan: mindestens eine wirksame Abweichung, wenn nicht StAN-treu.
  const plaetze = THW_STAN_PERSONAL[typCode] ?? [];
  const fuehrungSoll = plaetze
    .filter((p) => p.staerkeRolle !== R.MANNSCHAFT)
    .reduce((s, p) => s + p.anzahl, 0);
  const sollStaerke = plaetze.reduce((s, p) => s + p.anzahl, 0);
  // Untergrenze beim Streichen (s. personalBauen): Führung + 2 bleiben immer.
  const maxMinus = Math.max(0, sollStaerke - (fuehrungSoll + 2));
  let personalDelta = 0;
  let fzMinus = false;
  let fzPlus = false;
  if (!stanTreu) {
    const mehrereStanFahrzeuge = (THW_STAN_FAHRZEUGE[typCode] ?? [])
      .reduce((s, v) => s + v.anzahl, 0) >= 2;
    do {
      personalDelta = gewichtet<number>([[-3, 1], [-2, 2], [-1, 3], [0, 2], [1, 2], [2, 1]]);
      if (personalDelta < 0) personalDelta = Math.max(personalDelta, -maxMinus);
      fzMinus = mehrereStanFahrzeuge && wuerfel(0.35);
      fzPlus = wuerfel(0.35);
    } while (personalDelta === 0 && !fzMinus && !fzPlus);
  }

  const personal = personalBauen(typCode, personalDelta);
  const istDelta = personal.length - sollStaerke;
  const { fahrzeuge, notizen } = fahrzeugeBauen(typCode, fzMinus, fzPlus);

  // Mindestens ein CE-Kraftfahrer, wenn schwere Fahrzeuge dabei sind.
  if (
    fahrzeuge.some((f) => f.typ.code != null && SCHWERE_FAHRZEUGE.has(f.typ.code)) &&
    !personal.some((p) => p.fahrerlaubnis === FE.CE)
  ) {
    personal[personal.length - 1]!.fahrerlaubnis = FE.CE;
  }

  if (istDelta > 0) notizen.unshift(`${istDelta} Helfer über StAN-Soll (Reserve aktiviert).`);
  if (istDelta < 0) notizen.unshift(`${-istDelta} Sollplätze unbesetzt.`);

  // Einsatz: Juli-2026-Unwetterlage, Ort aus dem OV-Standort.
  const stand = datumAusIso("2026-07-16") + ganz(0, 2);
  const dauer = ganz(1, 4);
  const ortAuftrag = wahl(SZENARIO[typCode] ?? ["Einsatz {ort}"]).replaceAll("{ort}", ov.ort);

  // Sofortbedarf aus Stärke und Fahrzeugliste.
  let diesel = 0;
  let benzin = 0;
  for (const fz of fahrzeuge) {
    const code = fz.typ.code;
    const [d, b] = code != null
      ? KRAFTSTOFF[code] ?? [0, 0]
      : EXTRA_FAHRZEUGE.find((e) => e.freitext === fz.typ.freitext)?.kraftstoff ?? [0, 0];
    diesel += d;
    benzin += b;
  }

  const bogen: Erfassungsbogen = {
    schemaVersion: SCHEMA_VERSION,
    stand,
    einheit: {
      organisation: OrganisationsTyp.THW,
      einheitsTyp: { code: typCode },
      // Reiner OV-Name (ohne "OV"-Präfix): dient zugleich als Ortsbezeichnung
      // des Funkrufnamens — gesprochen wird "Heros Crailsheim 36/46".
      name: ov.name,
      hierarchie: hierarchieFuerOv(ov),
    },
    einsatz: {
      zeitraumVon: stand,
      zeitraumBis: stand + dauer,
      ortAuftrag,
    },
    personalErfassung: PersonalErfassung.VOLLSTAENDIG,
    personal,
    fahrzeuge,
    sofortbedarf: {
      verpflegungPersonen: personal.length,
      dieselLiter: diesel,
      benzinLiter: benzin,
      gemischLiter: MIT_MOTORSAEGE.has(typCode) ? ganz(1, 2) * 5 : 0,
      unterbringung: dauer >= 2 && wuerfel(0.6),
      ruhezeitErforderlich: wuerfel(0.3),
    },
    ...(notizen.length > 0 ? { sonstiges: notizen.join(" ") } : {}),
  };

  const abweichungen: string[] = [];
  if (istDelta !== 0) abweichungen.push(`Personal ${istDelta > 0 ? "+" : ""}${istDelta}`);
  if (fzMinus) abweichungen.push("Fahrzeug fehlt");
  if (fzPlus) abweichungen.push("Fahrzeug zusätzlich");

  return {
    datei: `${String(nr).padStart(3, "0")}-${slug(ov.name)}-${slug(typ.kurz)}`,
    bogen,
    ov,
    landesverband: THW_OV_REGIONALSTRUKTUR[ov.name]?.landesverband ?? "?",
    abweichung: abweichungen.length > 0 ? abweichungen.join(", ") : "—",
  };
}

// --------------------------------------- Stress-Test: sehr großer Bogen (QR-Segmentierung)

/**
 * "Verstärkter Bergungszug" — bewusst überfüllt (40 Personen mit Kontakten und
 * Qualifikationen, 10 Fahrzeuge, lange Freitexte), damit der Payload nicht in
 * einen einzelnen QR-Code passt und die Segmentierung greift (Sammel-Scan zum
 * Ausprobieren). Funkrufnamen nach Taschenkarte für sonstige Einheiten
 * (z. B. 3. TZ): 71 = Führungstrupp, 72 = 1. Gruppe, 73 = 2. Gruppe.
 */
function grossbogenBauen(): BeispielBogen {
  const ov = THW_ORTSVERBAENDE.find((o) => o.name.startsWith("Oldenburg")) ?? THW_ORTSVERBAENDE[0]!;
  const fabrik = personenFabrik();
  const personal: Person[] = [fabrik.neu(R.FUEHRER, 1, true), fabrik.neu(R.UNTERFUEHRER, 2, true)];
  for (let gruppe = 0; gruppe < 4; gruppe++) {
    personal.push(fabrik.neu(R.UNTERFUEHRER, 3, true));
    personal.push(fabrik.neu(R.UNTERFUEHRER, 4, false));
    for (let i = 0; i < 7; i++) personal.push(fabrik.neu(R.MANNSCHAFT, undefined, false));
  }
  // Datenmenge über das QR-Budget treiben: Zusatzfunktionen, Qualifikationen,
  // Mobilnummern für alle.
  const zusatzPool = [30, 31, 32, 36, 38, 41, 49, 51, 67];
  personal.forEach((p, i) => {
    const code = zusatzPool[i % zusatzPool.length]!;
    if (!p.funktionen.some((f) => f.code === code)) p.funktionen.push({ code });
    p.zusatzqualifikationen = [
      { freitext: QUALI_POOL[i % QUALI_POOL.length]! },
      { freitext: QUALI_POOL[(i + 4) % QUALI_POOL.length]! },
    ];
    if (p.kontakte.length === 0) {
      p.kontakte.push({
        art: KontaktArt.MOBIL,
        dienstlich: false,
        wert: `01701${String(230000 + i).padStart(6, "0")}`,
      });
    }
  });

  const fr = (teile: [number, number]): Funkrufname =>
    ({ kennwort: { code: 1 }, eigenerStandort: true, teile });
  const fahrzeuge: Fahrzeug[] = [
    { typ: { code: 24 }, thwKennzeichen: naechstesKennzeichen++, funkrufname: fr([71, 25]), stanKonform: true }, // MTW gl Führungstrupp
    { typ: { code: 4 }, thwKennzeichen: naechstesKennzeichen++, funkrufname: fr([72, 51]), stanKonform: true }, // GKW 1. Gruppe
    { typ: { freitext: "MzKW" }, thwKennzeichen: naechstesKennzeichen++, funkrufname: fr([72, 54]), stanKonform: false, aenderungen: "OV-eigenes Fahrzeug, zusätzlich zur StAN" },
    { typ: { code: 16 }, kennzeichenFreitext: "Kettenbagger 8 t (Mietgerät)", funkrufname: fr([72, 71]), stanKonform: false, aenderungen: "Mietgerät — Tiltrotator und Abbruchgreifer" },
    { typ: { code: 4 }, thwKennzeichen: naechstesKennzeichen++, funkrufname: fr([73, 51]), stanKonform: true }, // GKW 2. Gruppe
    { typ: { code: 7 }, thwKennzeichen: naechstesKennzeichen++, funkrufname: fr([73, 61]), stanKonform: true }, // LKW Kipper 2. Gruppe
    { typ: { code: 8 }, thwKennzeichen: naechstesKennzeichen++, funkrufname: fr([71, 43]), stanKonform: true, aenderungen: "Materialtransport Schwere Bergung, Ladebordwand" },
    { typ: { code: 45 }, thwKennzeichen: naechstesKennzeichen++, stanKonform: true, aenderungen: "Tieflader für Bagger" },
    { typ: { code: 47 }, thwKennzeichen: naechstesKennzeichen++, stanKonform: true, aenderungen: "NEA 50 kVA für Baustellenbeleuchtung" },
    { typ: { code: 43 }, thwKennzeichen: naechstesKennzeichen++, stanKonform: true, aenderungen: "Verpflegungs- und Sanitätsausstattung" },
  ];

  const stand = datumAusIso("2026-07-16");
  const bogen: Erfassungsbogen = {
    schemaVersion: SCHEMA_VERSION,
    stand,
    einheit: {
      organisation: OrganisationsTyp.THW,
      einheitsTyp: { freitext: "Verstärkter Bergungszug" },
      name: ov.name,
      hierarchie: hierarchieFuerOv(ov),
    },
    einsatz: {
      zeitraumVon: stand,
      zeitraumBis: stand + 7,
      ortAuftrag:
        `Großschadenslage nach Starkregen und Hangrutsch im Landkreis ${ov.ort} — ` +
        "Verstärkter Bergungszug mit Schwerer Bergung: Menschenrettung aus verschütteten " +
        "Gebäuden, Abstützen einsturzgefährdeter Bauwerke, Beräumung der Zufahrtswege, " +
        "Aufbau einer Bereitstellungsraum-Struktur für nachrückende Kräfte.",
    },
    personalErfassung: PersonalErfassung.VOLLSTAENDIG,
    personal,
    fahrzeuge,
    sofortbedarf: {
      verpflegungPersonen: personal.length,
      dieselLiter: 620,
      benzinLiter: 40,
      gemischLiter: 20,
      unterbringung: true,
      ruhezeitErforderlich: true,
    },
    sonstiges:
      "Einsatz mehrschichtig über mindestens sieben Tage geplant. Ablösung nach je 12 h " +
      "erforderlich, zweite Schicht wird nachgeführt. Unterbringung in Turnhalle organisiert, " +
      "Feldküche der FGr Log-V angefragt. Schwere Bergung benötigt zusätzlich Rüstholz, " +
      "Baustützen und Abbruchhämmer — Nachforderung über die Regionalstelle läuft.",
  };

  return {
    datei: "grossbogen-verstaerkter-bergungszug",
    bogen,
    ov,
    landesverband: THW_OV_REGIONALSTRUKTUR[ov.name]?.landesverband ?? "?",
    abweichung: "Großbogen (Stress-Test QR-Segmentierung)",
  };
}

// ------------------------------------------------------------- QR-Erzeugung
// Node-Pendant zu qrErzeugen() in src/app/hilfen.ts: ein einzelner QR-Code bis
// QR_EINZEL_MAX_VERSION; darüber Segmentierung, wobei jeder Teil auf die
// gröbere, gut scannbare QR_SEGMENT_ZIEL_VERSION zielt.

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

// ------------------------------------------------------------ Selbstprüfung

const KENNZAHLEN_2 = new Set(THW_FAHRZEUG_KENNZAHLEN.map((k) => k.kennzahl));

function pruefen(beispiele: BeispielBogen[], stanTreuSoll: number): void {
  const fehler: string[] = [];
  const stanTreu = beispiele.filter((b) => b.abweichung === "—").length;
  if (stanTreu !== stanTreuSoll) {
    fehler.push(`StAN-treue Bögen: ${stanTreu} statt ${stanTreuSoll}`);
  }
  const kennzeichen = new Set<number>();
  for (const b of beispiele) {
    const teilSoll = teileinheitKennzahl(b.bogen.einheit.einheitsTyp.code);
    const belegt = new Set<string>();
    for (const fz of b.bogen.fahrzeuge) {
      if (fz.thwKennzeichen != null) {
        if (kennzeichen.has(fz.thwKennzeichen)) fehler.push(`${b.datei}: Kennzeichen doppelt`);
        kennzeichen.add(fz.thwKennzeichen);
      }
      const fr = fz.funkrufname;
      if (!fr) continue;
      if (fr.kennwort.code !== 1 || !fr.eigenerStandort || fr.teile.length !== 2) {
        fehler.push(`${b.datei}: Funkrufname-Form ungültig (${fr.teile.join("/")})`);
        continue;
      }
      const [teil, kfz] = fr.teile as [number, number];
      if (teilSoll != null) {
        if (teil !== teilSoll) fehler.push(`${b.datei}: Teileinheit ${teil} ≠ ${teilSoll}`);
      } else if (!THW_TEILEINHEIT_KENNZAHLEN.some((k) => k.kennzahl === teil)) {
        // Freitext-Einheiten (Großbogen): Teileinheit muss in der Taschenkarte stehen.
        fehler.push(`${b.datei}: Teileinheit-Kennzahl ${teil} unbekannt`);
      }
      if (!KENNZAHLEN_2.has(kfz)) fehler.push(`${b.datei}: Fahrzeug-Kennzahl ${kfz} unbekannt`);
      // Taschenkarte: 20, 30, 40, 50, 60, 70, 80, 90 werden nicht belegt.
      if (kfz >= 20 && kfz % 10 === 0) fehler.push(`${b.datei}: Kennzahl ${kfz} darf nicht belegt werden`);
      if (belegt.has(`${teil}/${kfz}`)) fehler.push(`${b.datei}: Funkrufname ${teil}/${kfz} doppelt`);
      belegt.add(`${teil}/${kfz}`);
    }
  }
  if (fehler.length > 0) {
    throw new Error(`Selbstprüfung fehlgeschlagen:\n  ${fehler.join("\n  ")}`);
  }
}

/** QR-Roundtrip: Payload (ggf. aus Segmenten zusammengesetzt) → Bogen dekodierbar. */
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

// ---------------------------------------------------------------- Hauptlauf

// Serverseitige pdfmake-Fonts (Roboto liegt im Paket).
const robotoDir = join(wurzel, "node_modules/pdfmake/fonts/Roboto");
pdfmake.setFonts({
  Roboto: {
    normal: join(robotoDir, "Roboto-Regular.ttf"),
    bold: join(robotoDir, "Roboto-Medium.ttf"),
    italics: join(robotoDir, "Roboto-Italic.ttf"),
    bolditalics: join(robotoDir, "Roboto-MediumItalic.ttf"),
  },
});
// Nur eingebettete data:-URLs zulassen (QR-Bild + JSON), kein Netzzugriff.
pdfmake.setUrlAccessPolicy((url: string) => url.startsWith("data:"));
// Lokaler Zugriff nur auf die mitgelieferten Schriftdateien.
pdfmake.setLocalAccessPolicy((pfad: string) => pfad.startsWith(robotoDir));

const ANZAHL = 100;
const STAN_TREU = 40; // max. 40 % exakt im StAN-Soll

// Einheitstyp-Liste (Summe der Verteilung = ANZAHL) und StAN-Flags mischen.
const typListe = mischen(
  Object.entries(TYP_VERTEILUNG).flatMap(([code, n]) => Array<number>(n).fill(Number(code))),
);
if (typListe.length !== ANZAHL) {
  throw new Error(`TYP_VERTEILUNG summiert auf ${typListe.length}, erwartet ${ANZAHL}`);
}
const stanFlags = mischen([
  ...Array<boolean>(STAN_TREU).fill(true),
  ...Array<boolean>(ANZAHL - STAN_TREU).fill(false),
]);

const ovs = ovsWaehlen(ANZAHL);
const beispiele = [
  ...ovs.map((ov, i) => bogenBauen(i + 1, ov, typListe[i]!, stanFlags[i]!)),
  grossbogenBauen(),
];

pruefen(beispiele, STAN_TREU);

const ausgabe = join(wurzel, "examples");
mkdirSync(ausgabe, { recursive: true });
// Alte Beispiel-PDFs entfernen (qr-demo-Ausgaben .png/.svg bleiben unberührt).
for (const datei of readdirSync(ausgabe)) {
  if (datei.endsWith(".pdf")) rmSync(join(ausgabe, datei));
}

let segmentierte = 0;
for (const [i, bsp] of beispiele.entries()) {
  const qr = await qrSatz(bsp.bogen);
  roundtrip(qr, bsp.bogen.personal.length, bsp.datei);
  if (qr.segmentiert) segmentierte++;
  await pdfmake.createPdf(pdfDokument(bsp.bogen, qr)).write(join(ausgabe, `${bsp.datei}.pdf`));
  if ((i + 1) % 10 === 0) console.log(`… ${i + 1}/${beispiele.length}`);
}

// Übersichtstabelle für examples/README.md.
const zeilen = beispiele.map((b) => {
  const s = staerke(b.bogen);
  const typText =
    b.bogen.einheit.einheitsTyp.freitext ?? typEintrag(b.bogen.einheit.einheitsTyp.code!).kurz;
  return `| ${b.datei} | ${typText} | ${b.ov.name} | ${b.landesverband} | ${s.fuehrer}/${s.unterfuehrer}/${s.mannschaft}/${s.gesamt} | ${b.bogen.fahrzeuge.length} | ${b.abweichung} |`;
});
writeFileSync(
  join(ausgabe, "README.md"),
  `# Beispiel-Erfassungsbögen

${ANZAHL} generierte Beispiel-Einheiten aus ganz Deutschland (${STAN_TREU} exakt im
StAN-Soll, ${ANZAHL - STAN_TREU} mit zufälligen Abweichungen bei Personal und/oder
Fahrzeugen) plus ein bewusst übergroßer Stress-Test-Bogen, der die
QR-Segmentierung auslöst. Funkrufnamen nach Taschenkarte THW-Funkrufnamen
(Stand 02/2022).

Neu erzeugen mit: \`npm run beispiele\` (deterministisch, fester Zufalls-Seed).

| Datei | Einheit | OV | Landesverband | Stärke | Fz | Abweichung |
|---|---|---|---|---|---|---|
${zeilen.join("\n")}
`,
);

const jeLv = new Map<string, number>();
for (const b of beispiele) jeLv.set(b.landesverband, (jeLv.get(b.landesverband) ?? 0) + 1);
console.log(`\nFertig: ${beispiele.length} Beispiel-PDFs in examples/ (+ README.md)`);
console.log(`StAN-treu: ${beispiele.filter((b) => b.abweichung === "—").length}, mit Abweichung: ${beispiele.filter((b) => b.abweichung !== "—").length}, segmentierte QR: ${segmentierte}`);
for (const [lv, n] of [...jeLv.entries()].sort()) console.log(`  ${lv}: ${n}`);
