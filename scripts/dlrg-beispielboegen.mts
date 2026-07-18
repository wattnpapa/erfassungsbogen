/**
 * Erzeugt DLRG-Beispiel-Erfassungsbögen als JSON nach examples/dlrg/ — je
 * Teileinheit ein Bogen. Abgelegt ist nur das Bogen-JSON; die PDF (mit
 * eingebettetem JSON und QR-Code) entsteht erst beim Anklicken in der App aus
 * dem aktuellen Layout. examples/ ist je Hilfsorganisation in Unterordner
 * gegliedert; der Beispielbögen-Dialog im Footer (src/app/fusszeile.tsx) liest
 * die Ordnerstruktur per Glob und bietet zuerst die Organisation an.
 *
 * Aufruf (Node ≥ 22): npm run beispiele:dlrg
 *
 * Grundlage: „Stärke und Ausstattungsnachweis (STAN) der Wasserrettungszüge
 * und -verbandes", Koordinierungsstelle Baden-Württemberg, Stand 10/2023.
 * Der STAN kennt zwei Formationen mit ihren Teileinheiten:
 *
 *  Wasserrettungsverband — Verbandsführung 1/2/2/3/8
 *    • Führungstrupp (ELW 1)          2/1/1/4   VFü ZFü GrFü Kf, FaBe (Arzt)
 *    • Verbandsführung (KdoW)         1/1/2/4   ZFü GrFü HF Kf
 *
 *  Wasserrettungszug — 1/4/18/23 (mit TLog 1/5/21/27)
 *    • Führungstrupp (KdoW)           1/1/2/4   ZFü GrFü Hf Kf
 *    • Strömungsrettergruppe (Raft)   0/1/7/8   GrFü Sr×6 Kf
 *    • Bootsgruppe (BGF + HWB-Anh.)   0/1/4/5   GrFü Bf Bf Hf Kf
 *    • Tauchgruppe (GW-W)             0/1/5/6   GrFü/TEF Et Et Et Sm Kf
 *    • Logistiktrupp (GW-L, 4× in BW) 0/1/3/4   GrFü Hf Hf Kf
 *
 * Modelliert wird eine kohärente Beispiel-Aufstellung: ein Wasserrettungszug im
 * Bezirk Mittelbaden (LV Baden), dessen Teileinheiten von verschiedenen
 * Ortsgruppen gestellt werden, plus die beiden Trupps der Verbandsführung des
 * Wasserrettungsverbandes Baden-Württemberg. DLRG-Vokabular (Einheitstyp,
 * Funktion, Fahrzeug) steht als Freitext im Bogen — organisationsspezifische
 * Vokabulare sind bislang nur für das THW befüllt. Funkrufnamen mit dem
 * Kennwort „Pelikan"; die Kennzahlen sind beispielhaft (die DLRG hat kein
 * bundesweit einheitliches Kennzahlenschema wie die THW-Taschenkarte).
 *
 * Am Ende läuft ein QR-Roundtrip; examples/dlrg/README.md bekommt eine
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
  Staerke,
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
const rnd = prng(20231001); // STAN-Stand 10/2023

const ganz = (minInkl: number, maxInkl: number): number =>
  minInkl + Math.floor(rnd() * (maxInkl - minInkl + 1));
const wuerfel = (p: number): boolean => rnd() < p;
const wahl = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)]!;
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
  "Alexander", "Andreas", "Benedikt", "Christian", "Daniel", "David", "Dennis",
  "Dominik", "Fabian", "Felix", "Florian", "Frank", "Jan", "Jannik", "Jens",
  "Jonas", "Julian", "Kai", "Lars", "Leon", "Lukas", "Marco", "Markus",
  "Martin", "Matthias", "Michael", "Moritz", "Niklas", "Pascal", "Patrick",
  "Paul", "Philipp", "Sebastian", "Simon", "Stefan", "Sven", "Thomas",
  "Tim", "Tobias", "Valentin",
] as const;
const VORNAMEN_W = [
  "Anna", "Carina", "Christina", "Franziska", "Hanna", "Jana", "Julia",
  "Katharina", "Katrin", "Laura", "Lea", "Lena", "Lisa", "Marie", "Melanie",
  "Miriam", "Nadine", "Sabine", "Sandra", "Sarah", "Sophie", "Stefanie",
  "Svenja", "Tanja", "Verena",
] as const;
const NACHNAMEN = [
  "Bauer", "Baumann", "Becker", "Berger", "Braun", "Dietrich", "Fischer",
  "Frey", "Gerber", "Graf", "Häberle", "Hartmann", "Hoffmann", "Huber",
  "Kaufmann", "Keller", "Kimmig", "Klein", "Koch", "König", "Krieg",
  "Kübler", "Lang", "Maier", "Mayer", "Merz", "Metzger", "Müller",
  "Nagel", "Ott", "Rapp", "Rieger", "Roth", "Schäfer", "Schmid", "Schmidt",
  "Schneider", "Schwab", "Seitz", "Straub", "Vogt", "Wagner", "Walter",
  "Weber", "Weis", "Wolf", "Ziegler",
] as const;

const QUALI_ALLGEMEIN = [
  "Rettungsschwimmer Silber",
  "Rettungsschwimmer Gold",
  "Sanitäter (San A/B)",
  "Sprechfunker (BOS-Digitalfunk)",
  "Wasserretter",
] as const;

// ------------------------------------------------------------ Personal-Fabrik

const belegteNamen = new Set<string>();

/** Erzeugt eine Person mit eindeutigem Namen und plausiblen Attributen. */
function person(opt: {
  rolle: R;
  funktionen: string[];
  fe: FE;
  kontakt?: boolean;
  quali?: string[];
}): Person {
  const g = wuerfel(0.2) ? G.W : G.M;
  let vorname = "";
  let nachname = "";
  do {
    vorname = wahl(g === G.W ? VORNAMEN_W : VORNAMEN_M);
    nachname = wahl(NACHNAMEN);
  } while (belegteNamen.has(`${vorname} ${nachname}`));
  belegteNamen.add(`${vorname} ${nachname}`);

  const quali = [...(opt.quali ?? [])];
  if (wuerfel(0.4) && quali.length < 2) {
    const q = wahl(QUALI_ALLGEMEIN);
    if (!quali.includes(q)) quali.push(q);
  }

  const p: Person = {
    vorname,
    nachname,
    staerkeRolle: opt.rolle,
    funktionen: opt.funktionen.map((freitext) => ({ freitext })),
    fahrerlaubnis: opt.fe,
    geschlecht: g,
    ernaehrung: gewichtet<E>([[E.FLEISCH, 76], [E.VEGETARISCH, 17], [E.VEGAN, 7]]),
    kontakte: [],
    zusatzqualifikationen: quali.map((freitext) => ({ freitext })),
  };
  if (opt.kontakt) {
    p.kontakte.push({
      art: KontaktArt.MOBIL,
      dienstlich: false,
      wert: `01${ganz(5, 7)}${ganz(1, 9)}${String(ganz(0, 9999999)).padStart(7, "0")}`,
    });
  }
  return p;
}

// ------------------------------------------------------------------ Standorte

/** DLRG-Gliederung: Ortsgruppe → Bezirk → Landesverband. */
function hierarchie(
  og: string,
  bezirk: string,
  lv: string,
  tel: string,
  domain: string,
): HierarchieEbene[] {
  return [
    { bezeichnung: { freitext: "Ortsgruppe" }, name: og, kurz: `OG ${og}`, telefon: tel, email: `info@${domain}.dlrg.de` },
    { bezeichnung: { freitext: "Bezirk" }, name: bezirk },
    { bezeichnung: { freitext: "Landesverband" }, name: lv },
  ];
}

// ------------------------------------------------------------ Fahrzeug-Fabrik

interface FzSpec {
  typ: string;
  kennzeichen: string;
  /** Ort für den Funkrufnamen (Pelikan <Ort> <teile>). Fehlt bei Anhängern. */
  funkOrt?: string;
  teile?: number[];
  aenderungen?: string;
}

function fahrzeug(spec: FzSpec): Fahrzeug {
  const f: Fahrzeug = {
    typ: { freitext: spec.typ },
    kennzeichen: spec.kennzeichen,
    stanKonform: true,
    aenderungen: spec.aenderungen,
  };
  if (spec.funkOrt && spec.teile) {
    f.funkrufname = {
      kennwort: { code: 7 }, // Pelikan (DLRG)
      eigenerStandort: false,
      ort: spec.funkOrt,
      teile: spec.teile,
    };
  }
  return f;
}

// --------------------------------------------------------------- Bogen-Bauplan

interface Bauplan {
  datei: string;
  einheitsTyp: string;
  name: string;
  hierarchie: HierarchieEbene[];
  personal: Person[];
  fahrzeuge: Fahrzeug[];
  sonstiges?: string;
}

const EINSATZ = {
  von: datumAusIso("2023-11-06"),
  bis: datumAusIso("2023-11-09"),
  ort:
    "Hochwasserlage an Rhein und Murg im Landkreis Rastatt — Menschenrettung " +
    "aus überfluteten Bereichen, Deichverteidigung und Sicherung der " +
    "Rettungskräfte auf dem Wasser; Bereitstellungsraum am DLRG-Zentrum Rastatt.",
} as const;

function bogenAus(plan: Bauplan): Erfassungsbogen {
  return {
    schemaVersion: SCHEMA_VERSION,
    stand: datumAusIso("2023-10-01"),
    einheit: {
      organisation: OrganisationsTyp.DLRG,
      einheitsTyp: { freitext: plan.einheitsTyp },
      name: plan.name,
      hierarchie: plan.hierarchie,
    },
    einsatz: { zeitraumVon: EINSATZ.von, zeitraumBis: EINSATZ.bis, ortAuftrag: EINSATZ.ort },
    personalErfassung: PersonalErfassung.VOLLSTAENDIG,
    personal: plan.personal,
    fahrzeuge: plan.fahrzeuge,
    sofortbedarf: {
      verpflegungPersonen: plan.personal.length,
      dieselLiter: 60 * plan.fahrzeuge.length,
      benzinLiter: plan.fahrzeuge.some((f) => /boot|raft|hwb|strömung/i.test(f.typ.freitext ?? "")) ? 40 : 0,
      gemischLiter: 0,
      unterbringung: true,
      ruhezeitErforderlich: true,
    },
    sonstiges: plan.sonstiges,
  };
}

// ---------------------------------------------------------- Die sieben Bögen

// Wasserrettungszug „Mittelbaden" (LV Baden) — Teileinheiten je Ortsgruppe.
const BEZIRK = "Mittelbaden";
const LV_BADEN = "Baden";

const baeuplane: Bauplan[] = [
  // 1 — Führungstrupp (KdoW) 1/1/2/4
  {
    datei: "wrz-mittelbaden-fuehrungstrupp-kdow",
    einheitsTyp: "Wasserrettungszug — Führungstrupp (KdoW)",
    name: "Wasserrettungszug Mittelbaden — Führungstrupp",
    hierarchie: hierarchie("Rastatt", BEZIRK, LV_BADEN, "072229876543", "rastatt"),
    personal: [
      person({ rolle: R.FUEHRER, funktionen: ["ZFü"], fe: FE.B, kontakt: true, quali: ["Zugführer Wasserrettung"] }),
      person({ rolle: R.UNTERFUEHRER, funktionen: ["GrFü"], fe: FE.C, kontakt: true }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Hf"], fe: FE.B }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Kf"], fe: FE.C }),
    ],
    fahrzeuge: [
      fahrzeug({ typ: "KdoW (Kommandowagen)", kennzeichen: "RA-DL 101", funkOrt: "Rastatt", teile: [10, 1] }),
    ],
  },
  // 2 — Strömungsrettergruppe (SrGrFzg + Raft) 0/1/7/8
  {
    datei: "wrz-mittelbaden-stroemungsrettergruppe",
    einheitsTyp: "Wasserrettungszug — Strömungsrettergruppe",
    name: "Wasserrettungszug Mittelbaden — Strömungsrettergruppe",
    hierarchie: hierarchie("Gaggenau", BEZIRK, LV_BADEN, "072259988776", "gaggenau"),
    personal: [
      person({ rolle: R.UNTERFUEHRER, funktionen: ["GrFü"], fe: FE.C, kontakt: true, quali: ["Strömungsretter", "Zugführer Wasserrettung"] }),
      ...Array.from({ length: 6 }, () =>
        person({ rolle: R.MANNSCHAFT, funktionen: ["Sr"], fe: gewichtet<FE>([[FE.NONE, 3], [FE.B, 5], [FE.BE, 2]]), quali: ["Strömungsretter"] }),
      ),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Kf"], fe: FE.BE, quali: ["Strömungsretter"] }),
    ],
    fahrzeuge: [
      fahrzeug({ typ: "SrGrFzg (GA Strömungsrettung)", kennzeichen: "RA-DL 461", funkOrt: "Gaggenau", teile: [46, 1], aenderungen: "Zugfahrzeug mit Beladung Strömungsrettung" }),
      fahrzeug({ typ: "Raft-Anhänger (Strömungsrettung)", kennzeichen: "RA-DL 462", aenderungen: "Raft (aufblasbares Wildwasserboot) auf Anhänger" }),
    ],
  },
  // 3 — Bootsgruppe (BGF + HWB-Anhänger) 0/1/4/5
  {
    datei: "wrz-mittelbaden-bootsgruppe",
    einheitsTyp: "Wasserrettungszug — Bootsgruppe",
    name: "Wasserrettungszug Mittelbaden — Bootsgruppe",
    hierarchie: hierarchie("Bühl", BEZIRK, LV_BADEN, "072238877665", "buehl"),
    personal: [
      person({ rolle: R.UNTERFUEHRER, funktionen: ["GrFü", "Bf"], fe: FE.BE, kontakt: true, quali: ["Bootsführer DLRG"] }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Bf"], fe: FE.B, quali: ["Bootsführer DLRG"] }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Bf"], fe: FE.B, quali: ["Bootsführer DLRG"] }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Hf"], fe: FE.NONE }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Kf"], fe: FE.CE }),
    ],
    fahrzeuge: [
      fahrzeug({ typ: "BGF (Bootsgerätewagen)", kennzeichen: "RA-DL 711", funkOrt: "Bühl", teile: [71, 1] }),
      fahrzeug({ typ: "HWB-Anhänger (Hochwasserboot)", kennzeichen: "RA-DL 712", aenderungen: "Hochwasserrettungsboot mit Motor auf Anhänger" }),
    ],
  },
  // 4 — Tauchgruppe (GW-W) 0/1/5/6
  {
    datei: "wrz-mittelbaden-tauchgruppe",
    einheitsTyp: "Wasserrettungszug — Tauchgruppe",
    name: "Wasserrettungszug Mittelbaden — Tauchgruppe",
    hierarchie: hierarchie("Baden-Baden", BEZIRK, LV_BADEN, "072217766554", "baden-baden"),
    personal: [
      person({ rolle: R.UNTERFUEHRER, funktionen: ["GrFü", "TEF"], fe: FE.C, kontakt: true, quali: ["Tauchereinsatzführer", "Einsatztaucher Stufe 2"] }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Et"], fe: FE.B, quali: ["Einsatztaucher Stufe 2"] }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Et"], fe: FE.NONE, quali: ["Einsatztaucher Stufe 1"] }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Et"], fe: FE.B, quali: ["Einsatztaucher Stufe 1"] }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Sm"], fe: FE.NONE, quali: ["Signalmann (Tauchen)"] }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Kf"], fe: FE.C }),
    ],
    fahrzeuge: [
      fahrzeug({ typ: "GW-W (Gerätewagen Wasserrettung)", kennzeichen: "BAD-DL 71", funkOrt: "Baden-Baden", teile: [42, 1], aenderungen: "Tauchausstattung, Kompressor, Sauerstoff" }),
    ],
  },
  // 5 — Logistiktrupp (GW-L) 0/1/3/4
  {
    datei: "wrz-mittelbaden-logistiktrupp",
    einheitsTyp: "Wasserrettungszug — Logistiktrupp",
    name: "Wasserrettungszug Mittelbaden — Logistiktrupp",
    hierarchie: hierarchie("Achern", BEZIRK, LV_BADEN, "078416655443", "achern"),
    personal: [
      person({ rolle: R.UNTERFUEHRER, funktionen: ["GrFü"], fe: FE.CE, kontakt: true }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Hf"], fe: FE.C }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Hf"], fe: FE.B }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Kf"], fe: FE.CE }),
    ],
    fahrzeuge: [
      fahrzeug({ typ: "GW-L (Gerätewagen Logistik)", kennzeichen: "OG-DL 21", funkOrt: "Achern", teile: [42, 2], aenderungen: "Logistik- und Verpflegungsausstattung, Ladebordwand" }),
    ],
    sonstiges:
      "Einer von vier Logistiktrupps in Baden-Württemberg — zentral vorgehalten " +
      "und dem Wasserrettungszug lageabhängig zugeordnet (STAN: 4× in ganz BW).",
  },
  // 6 — Verbandsführung: Führungstrupp (ELW 1) 2/1/1/4
  {
    datei: "wrv-bawue-fuehrungstrupp-elw1",
    einheitsTyp: "Wasserrettungsverband — Führungstrupp (ELW 1)",
    name: "Wasserrettungsverband Baden-Württemberg — Führungstrupp",
    hierarchie: [
      { bezeichnung: { freitext: "Landesverband" }, name: "Baden", kurz: "LV Baden", telefon: "0721136010", email: "info@baden.dlrg.de" },
      { bezeichnung: { freitext: "Koordinierungsstelle" }, name: "Wasserrettung Baden-Württemberg" },
    ],
    personal: [
      person({ rolle: R.FUEHRER, funktionen: ["VFü"], fe: FE.B, kontakt: true, quali: ["Verbandsführer"] }),
      person({ rolle: R.FUEHRER, funktionen: ["ZFü"], fe: FE.B, kontakt: true, quali: ["Zugführer Wasserrettung"] }),
      person({ rolle: R.UNTERFUEHRER, funktionen: ["GrFü"], fe: FE.C }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Kf"], fe: FE.C }),
    ],
    fahrzeuge: [
      fahrzeug({ typ: "ELW 1 (Einsatzleitwagen)", kennzeichen: "KA-DL 11", funkOrt: "Baden-Württ.", teile: [11, 1], aenderungen: "Führungs- und Fernmeldeausstattung" }),
    ],
    sonstiges: "FaBe (Arzt) wird als Fachberater lageabhängig angegliedert (STAN).",
  },
  // 7 — Verbandsführung (KdoW) 1/1/2/4
  {
    datei: "wrv-bawue-verbandsfuehrung-kdow",
    einheitsTyp: "Wasserrettungsverband — Verbandsführung (KdoW)",
    name: "Wasserrettungsverband Baden-Württemberg — Verbandsführung",
    hierarchie: [
      { bezeichnung: { freitext: "Landesverband" }, name: "Württemberg", kurz: "LV Württemberg", telefon: "0711921950", email: "info@wuerttemberg.dlrg.de" },
      { bezeichnung: { freitext: "Koordinierungsstelle" }, name: "Wasserrettung Baden-Württemberg" },
    ],
    personal: [
      person({ rolle: R.FUEHRER, funktionen: ["ZFü"], fe: FE.B, kontakt: true, quali: ["Zugführer Wasserrettung"] }),
      person({ rolle: R.UNTERFUEHRER, funktionen: ["GrFü"], fe: FE.C, kontakt: true }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["HF"], fe: FE.NONE }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Kf"], fe: FE.C }),
    ],
    fahrzeuge: [
      fahrzeug({ typ: "KdoW (Kommandowagen)", kennzeichen: "S-DL 12", funkOrt: "Baden-Württ.", teile: [10, 2] }),
    ],
  },
];

// Soll-Stärken aus dem STAN zur Selbstprüfung (F/U/M/Gesamt).
const SOLL: Record<string, Staerke> = {
  "wrz-mittelbaden-fuehrungstrupp-kdow": { fuehrer: 1, unterfuehrer: 1, mannschaft: 2, gesamt: 4 },
  "wrz-mittelbaden-stroemungsrettergruppe": { fuehrer: 0, unterfuehrer: 1, mannschaft: 7, gesamt: 8 },
  "wrz-mittelbaden-bootsgruppe": { fuehrer: 0, unterfuehrer: 1, mannschaft: 4, gesamt: 5 },
  "wrz-mittelbaden-tauchgruppe": { fuehrer: 0, unterfuehrer: 1, mannschaft: 5, gesamt: 6 },
  "wrz-mittelbaden-logistiktrupp": { fuehrer: 0, unterfuehrer: 1, mannschaft: 3, gesamt: 4 },
  "wrv-bawue-fuehrungstrupp-elw1": { fuehrer: 2, unterfuehrer: 1, mannschaft: 1, gesamt: 4 },
  "wrv-bawue-verbandsfuehrung-kdow": { fuehrer: 1, unterfuehrer: 1, mannschaft: 2, gesamt: 4 },
};

// ------------------------------------------------------------- QR-Erzeugung
// Node-Pendant zu qrErzeugen() in src/app/hilfen.ts: ein einzelner QR-Code bis
// QR_EINZEL_MAX_VERSION; darüber Segmentierung auf die gröbere Zielversion.

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

// ------------------------------------------------------------ Selbstprüfung

function pruefen(): void {
  const fehler: string[] = [];
  const dateien = new Set<string>();
  const kennzeichen = new Set<string>();
  for (const plan of baeuplane) {
    if (dateien.has(plan.datei)) fehler.push(`Dateiname doppelt: ${plan.datei}`);
    dateien.add(plan.datei);
    const soll = SOLL[plan.datei];
    const ist = staerke({ personal: plan.personal });
    if (soll && (ist.fuehrer !== soll.fuehrer || ist.unterfuehrer !== soll.unterfuehrer || ist.mannschaft !== soll.mannschaft || ist.gesamt !== soll.gesamt)) {
      fehler.push(`${plan.datei}: Stärke ${ist.fuehrer}/${ist.unterfuehrer}/${ist.mannschaft}/${ist.gesamt} ≠ Soll ${soll.fuehrer}/${soll.unterfuehrer}/${soll.mannschaft}/${soll.gesamt}`);
    }
    if (!plan.personal[0]?.kontakte.length) fehler.push(`${plan.datei}: erste Person (Ansprechpartner) ohne Kontakt`);
    for (const f of plan.fahrzeuge) {
      const kz = f.kennzeichen!;
      if (kennzeichen.has(kz)) fehler.push(`Kennzeichen doppelt: ${kz}`);
      kennzeichen.add(kz);
      if (f.funkrufname && f.funkrufname.kennwort.code !== 7) fehler.push(`${plan.datei}: Funkruf-Kennwort ≠ Pelikan`);
    }
  }
  if (fehler.length > 0) throw new Error(`Selbstprüfung fehlgeschlagen:\n  ${fehler.join("\n  ")}`);
}

// ---------------------------------------------------------------- Hauptlauf

pruefen();

const ausgabe = join(wurzel, "examples", "dlrg");
mkdirSync(ausgabe, { recursive: true });
for (const datei of readdirSync(ausgabe)) {
  if (datei.endsWith(".json")) rmSync(join(ausgabe, datei));
}

const uebersicht: string[] = [];
for (const plan of baeuplane) {
  const bogen = bogenAus(plan);
  const qr = await qrSatz(bogen);
  roundtrip(qr, bogen.personal.length, plan.datei);
  writeFileSync(join(ausgabe, `${plan.datei}.json`), JSON.stringify(bogen, null, 2) + "\n");
  const s = staerke(bogen);
  uebersicht.push(
    `| ${plan.datei} | ${plan.einheitsTyp} | ${plan.hierarchie[0]!.name} | ${s.fuehrer}/${s.unterfuehrer}/${s.mannschaft}/${s.gesamt} | ${bogen.fahrzeuge.length} |`,
  );
  console.log(`✓ ${plan.datei} (${s.fuehrer}/${s.unterfuehrer}/${s.mannschaft}/${s.gesamt}, ${qr.segmentiert ? `${qr.teile.length} QR-Teile` : "1 QR"})`);
}

writeFileSync(
  join(ausgabe, "README.md"),
  `# Beispiel-Erfassungsbögen DLRG

Sieben Beispiel-Einheiten nach dem „Stärke und Ausstattungsnachweis (STAN) der
Wasserrettungszüge und -verbandes" der Koordinierungsstelle Baden-Württemberg
(Stand 10/2023) — je Teileinheit ein Bogen. Modelliert ist ein
Wasserrettungszug im Bezirk Mittelbaden (Landesverband Baden), dessen
Teileinheiten von verschiedenen Ortsgruppen gestellt werden, plus die beiden
Trupps der Verbandsführung des Wasserrettungsverbandes Baden-Württemberg.

Personennamen, Kontakte und Kfz-Kennzeichen sind frei erfunden. Funkrufnamen
mit dem Kennwort „Pelikan"; die Kennzahlen sind beispielhaft (die DLRG hat kein
bundesweit einheitliches Kennzahlenschema wie die THW-Taschenkarte).

Neu erzeugen mit: \`npm run beispiele:dlrg\` (deterministisch, fester Zufalls-Seed).

| Datei | Teileinheit | Ortsgruppe / Ebene | Stärke | Fz |
|---|---|---|---|---|
${uebersicht.join("\n")}
`,
);

console.log(`\nFertig: ${baeuplane.length} Beispielbögen in examples/dlrg/ (+ README.md)`);
