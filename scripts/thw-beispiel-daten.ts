/**
 * Gemeinsame Tabellen und Helfer der THW-Beispielbogen-Generatoren
 * (scripts/beispielboegen-pdf.mts: 100 fiktive Einheiten;
 * scripts/thw-ov-beispielboegen.mts: alle Einheiten aller Ortsverbände).
 * Namens-Pools, Zusatzfunktionen, Einsatz-Szenarien, Fahrzeug-Hilfstabellen
 * und die OV-Hierarchie wie im Autofill der App.
 */

import type { Fahrzeug, HierarchieEbene } from "@bos/eeb-format/model";
import type { ThwOrtsverband } from "@bos/vokabulare/thw-ov";
import {
  THW_LANDESVERBAENDE_KONTAKT,
  THW_OV_REGIONALSTRUKTUR,
  THW_REGIONALSTELLEN_KONTAKT,
} from "@bos/vokabulare/thw-ov-regionalstruktur";
import { fakeTelefon } from "./fake-telefon";

/** mulberry32 — deterministischer PRNG, damit die Beispiele reproduzierbar sind. */
export function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ------------------------------------------------------------- Namens-Pools

export const VORNAMEN_M = [
  "Alexander", "Andreas", "Bernd", "Christian", "Daniel", "David", "Dennis", "Dirk",
  "Dominik", "Erik", "Fabian", "Felix", "Florian", "Frank", "Georg", "Hannes",
  "Heiko", "Henrik", "Jan", "Jannik", "Jens", "Joachim", "Jonas", "Julian",
  "Kai", "Karsten", "Kevin", "Lars", "Leon", "Lukas", "Marco", "Marcel",
  "Markus", "Martin", "Matthias", "Michael", "Moritz", "Niklas", "Ole", "Pascal",
  "Patrick", "Paul", "Peter", "Philipp", "Ralf", "Robert", "Sebastian", "Simon",
  "Stefan", "Sven", "Thomas", "Thorsten", "Tim", "Tobias", "Torben", "Uwe",
] as const;
export const VORNAMEN_W = [
  "Anja", "Anna", "Antje", "Birgit", "Carina", "Christina", "Claudia", "Diana",
  "Franziska", "Hanna", "Ines", "Jana", "Julia", "Katharina", "Katrin", "Kerstin",
  "Laura", "Lea", "Lena", "Lisa", "Maren", "Marie", "Melanie", "Miriam",
  "Nadine", "Nicole", "Sabine", "Sandra", "Sarah", "Silke", "Sonja", "Stefanie",
  "Svenja", "Tanja", "Ulrike", "Vanessa", "Verena",
] as const;
export const NACHNAMEN = [
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


/** Zusatzfunktionen je Einheitstyp: `pflicht` auf die ersten Helfer, `pool` gestreut. */
export const ZUSATZ: Record<number, { pflicht: number[]; pool: number[] }> = {
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
export const QUALI_POOL = [
  "Beruf: Elektrofachkraft",
  "Beruf: Berufskraftfahrer",
  "Rettungssanitäter (extern)",
  "Beruf: Zimmerer",
  "Landwirt — Erfahrung Großgeräte",
  "Motorsägenschein AS Baum I (extern)",
  "Funkamateur (extern)",
  "Beruf: Gesundheits- und Krankenpfleger",
  "Feuerwehr-Doppelmitglied (AGT)",
  "Beruf: Tischler",
] as const;

/** Einsatz-Szenario (ortAuftrag) je Einheitstyp; {ort} = Standort-Ort des OV. */
export const SZENARIO: Record<number, string[]> = {
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
export const OHNE_KENNZEICHEN: Record<number, string> = {
  16: "auf Anh Tieflader",
  17: "auf Anh Tieflader",
  18: "auf Anh Tieflader",
  19: "auf Anh Tieflader",
  21: "auf LKW verlastet",
  22: "auf Anh",
};

/** Kraftstoff-Sofortbedarf je Fahrzeugtyp-Code: [Diesel, Benzin] in Litern. */
export const KRAFTSTOFF: Record<number, [number, number]> = {
  1: [40, 0], 2: [30, 0], 3: [40, 0], 4: [60, 0], 5: [30, 0], 6: [50, 0],
  7: [80, 0], 8: [70, 0], 9: [70, 0], 10: [80, 0], 11: [90, 0], 12: [90, 0],
  13: [120, 0], 14: [0, 0], 15: [25, 0], 16: [100, 0], 17: [80, 0], 18: [60, 0],
  19: [60, 0], 20: [120, 0], 21: [20, 0], 22: [0, 40], 23: [30, 0], 24: [30, 0],
  47: [100, 0], 48: [200, 0], 49: [300, 0], 50: [60, 0], 51: [100, 0], 52: [150, 0],
};

/** Einheitstypen mit Motorsägen an Bord → Gemisch-Bedarf. */
export const MIT_MOTORSAEGE = new Set([4, 5, 6, 7, 8, 19]);

/** Fahrzeugtypen, die einen CE-Kraftfahrer voraussetzen. */
export const SCHWERE_FAHRZEUGE = new Set([4, 6, 7, 8, 9, 10, 11, 12, 13, 20]);

/** Anhänger/Auflieger (kein eigener Antrieb). */
export const ANHAENGER = new Set([14, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55]);
export const istAnhaenger = (fz: Fahrzeug): boolean =>
  fz.typ.code != null ? ANHAENGER.has(fz.typ.code) : (fz.typ.freitext ?? "").startsWith("Anh");

/** OV-eigene Zusatzfahrzeuge (Abweichung „mehr Fahrzeuge"): Klasse → Kennzahlen. */
export const EXTRA_FAHRZEUGE: { freitext: string; kennzahlen: number[]; kraftstoff: [number, number] }[] = [
  { freitext: "MTW OV", kennzahlen: [25, 26, 27, 28], kraftstoff: [30, 0] },
  { freitext: "PKW OV", kennzahlen: [21, 22, 23, 24], kraftstoff: [20, 0] },
  { freitext: "MzKW", kennzahlen: [54], kraftstoff: [50, 0] },
  { freitext: "Anh OV (Plane)", kennzahlen: [], kraftstoff: [0, 0] },
];

export function slug(s: string): string {
  return s
    .toLowerCase()
    .replaceAll("ä", "ae").replaceAll("ö", "oe").replaceAll("ü", "ue").replaceAll("ß", "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** OV → Hierarchie OV/RSt/LV mit Kontaktdaten — wie das Autofill der App. */
export function hierarchieFuerOv(ov: ThwOrtsverband): HierarchieEbene[] {
  const ebenen: HierarchieEbene[] = [
    {
      bezeichnung: { code: 1 },
      name: ov.name,
      kurz: ov.kurz || undefined,
      telefon: fakeTelefon(ov.telefon) || undefined,
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
      telefon: rst && fakeTelefon(rst.telefon),
      email: rst?.email,
    });
    ebenen.push({
      bezeichnung: { code: 3 },
      name: struktur.landesverband,
      telefon: lv && fakeTelefon(lv.telefon),
      email: lv?.email,
    });
  }
  return ebenen;
}
