/**
 * Erzeugt Beispiel-Erfassungsbögen der ASB-Verbandsgliederung „Einsatzeinheit"
 * als JSON nach examples/asb/ — je Teileinheit ein Bogen. Abgelegt ist nur das
 * Bogen-JSON; die PDF (mit eingebettetem JSON und QR-Code) entsteht erst beim
 * Anklicken in der App aus dem aktuellen Layout.
 *
 * Aufruf (Node ≥ 22): npm run beispiele:asb-san
 *
 * QUELLE: „Die Einsatzeinheit NRW" — Beschreibung des DRK-Kreisverbands
 * Wuppertal e. V. der landeseinheitlichen Katastrophenschutz-Einsatzeinheit
 * in Nordrhein-Westfalen:
 *   https://www.drk-w.de/katastrophenschutz/katastrophenschutz-in-nrw/katastrophenschutz-in-nrw/die-einsatzeinheit-nrw.html
 *
 * Die „Einsatzeinheit" ist in NRW KEIN DRK-eigenes Konzept, sondern das
 * landesweite Grundmodell, das alle im Katastrophenschutz mitwirkenden
 * Hilfsorganisationen — DRK, ASB, Johanniter, Malteser — mit identischer
 * Gliederung stellen; Träger und Ausbildung liegen bei der jeweiligen
 * Organisation. Dass der ASB dieselbe Struktur nutzt, bestätigt die
 * Sanitätsgruppen-Seite des ASB Niederrhein e. V. wörtlich (GWSan 25 des
 * Landes NRW, Sanitätsgruppe mit GW-San, KTW4 und RTW):
 *   https://www.asb-niederrhein.de/unsere-angebote/katastrophenschutz/sanitaetsgruppe
 *
 * Die Einsatzeinheit gliedert sich in vier Komponenten:
 *   Führungskomponente   1/1/2/4   ELW 1
 *   Sanitätsgruppe        1/3/6/10  GW-San, KTW-B (Notfall-KTW), RTW
 *   Betreuungskomponente  0/3/12/15 2× BtKombi, Anh. Betreuung, BtLKW
 *   Technikkomponente      0/1/3/4   Gerätewagen Technik
 *   ————————————————————————————————————————————
 *   Gesamt                2/8/23/33
 *
 * Die Quelle beschreibt die Rollen je Komponente im Fließtext, ohne für jede
 * Person explizit Führer/Unterführer/Mannschaft zu benennen — die Zuordnung
 * unten ist so gewählt, dass die Summe je Komponente die in der Quelle
 * genannte Gesamtstärke ergibt (von der Selbstprüfung gegengeprüft, dieselbe
 * Vorgehensweise wie in scripts/bbk-bundeseinheiten-beispielboegen.mts und
 * scripts/drk-sanitaetsdienst-beispielboegen.mts). Bei der Betreuungs-
 * komponente nennt die Quelle selbst nicht ganz konsistente Zahlen (3
 * Führungskräfte + 11 Helfer = 14, aber „Gesamtstärke von 15"); hier wird mit
 * 12 statt 11 Helfern auf die genannte Gesamtstärke aufgefüllt.
 *
 * Die CSV-Rechercheliste, die als Ausgangspunkt diente, nennt für den ASB
 * separat „Sanitätszug" (25–30 Helfer), „Sanitätsgruppe" (9–12 Helfer) und
 * „Rettungsgruppe" (Sanitätsgruppe + RTW-Besatzung, 12–15 Helfer) — mit nur
 * grober Personenzahl, ohne Einzelrollen. Die hier verwendete Quelle bildet
 * dieselbe Sanitätsgruppen-Idee (Grundmodul + RTW-Erweiterung) mit
 * Einzelrollen ab, kommt aber strukturell aus dem größeren
 * Einsatzeinheit-Rahmen; die Bögen folgen deshalb der Quelle statt der
 * CSV-Kategorien.
 *
 * FAHRZEUGE UND FUNKRUFNAMEN sind — wie bei den anderen Verbandsgliederungs-
 * Beispielen — eine Modellierungsentscheidung: Die Quelle nennt Fahrzeugtypen
 * je Komponente, aber keine Kennzeichen oder Funkrufnamen. Diese sind hier
 * frei erfunden, Kennwort „Sama" (ASB) nach dem Funkrufname-Vokabular der App
 * (siehe src/vokabulare/thw.ts).
 *
 * Alle Personen, Kontakte, Kfz-Kennzeichen und Ortsangaben sind **fiktiv**;
 * der ASB-Kreisverband „Rheindorf" existiert nicht.
 *
 * Am Ende läuft ein QR-Roundtrip; examples/asb/README.md bekommt eine
 * Übersichtstabelle.
 */

import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
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
  zeitpunktAusIso,
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
const rnd = prng(20240101);

const wuerfel = (p: number): boolean => rnd() < p;
const wahl = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)]!;

// ------------------------------------------------------------- Namens-Pools
// Bergisch/rheinisch gefärbt (Quelle: DRK KV Wuppertal / ASB Niederrhein).

const VORNAMEN_M = [
  "Axel", "Björn", "Carsten", "Dietmar", "Ecki", "Frank", "Guido", "Heinz",
  "Ingo", "Jürgen", "Klaus-Dieter", "Lutz", "Marc", "Nico", "Olaf", "Ralf",
  "Sven", "Torsten", "Uwe", "Volker",
] as const;
const VORNAMEN_W = [
  "Alexandra", "Bettina", "Christine", "Dagmar", "Edith", "Farah", "Gundula",
  "Heidrun", "Ines", "Jana", "Karin", "Lieselotte", "Monika", "Nadine",
  "Ortrud", "Petra", "Rosemarie", "Silvia", "Tamara",
] as const;
const NACHNAMEN = [
  "Bösch", "Cremer", "Dahlmann", "Esser", "Feldmann", "Gerhards", "Halfmann",
  "Ingendahl", "Jansen", "Klophaus", "Lauterbach", "Michels", "Neuenhaus",
  "Overath", "Pfeifer", "Quirmbach", "Reifenrath", "Steegmann", "Thelen",
  "Vieten", "Wolter",
] as const;

const belegteNamen = new Set<string>();

function person(opt: { rolle: R; funktion: string; fe: FE; kontakt?: boolean; quali?: string[] }): Person {
  const g = wuerfel(0.4) ? G.W : G.M;
  let vorname = "";
  let nachname = "";
  do {
    vorname = wahl(g === G.W ? VORNAMEN_W : VORNAMEN_M);
    nachname = wahl(NACHNAMEN);
  } while (belegteNamen.has(`${vorname} ${nachname}`));
  belegteNamen.add(`${vorname} ${nachname}`);

  const p: Person = {
    vorname,
    nachname,
    staerkeRolle: opt.rolle,
    funktionen: [{ freitext: opt.funktion }],
    fahrerlaubnis: opt.fe,
    geschlecht: g,
    ernaehrung: wuerfel(0.05) ? E.VEGAN : wuerfel(0.2) ? E.VEGETARISCH : E.FLEISCH,
    kontakte: [],
    zusatzqualifikationen: (opt.quali ?? []).map((freitext) => ({ freitext })),
  };
  if (opt.kontakt) {
    p.kontakte.push({
      art: KontaktArt.MOBIL,
      dienstlich: false,
      wert: fakeTelefon(`01${Math.floor(rnd() * 3) + 5}${Math.floor(rnd() * 9) + 1}${String(Math.floor(rnd() * 9999999)).padStart(7, "0")}`),
    });
  }
  return p;
}

// ------------------------------------------------------------------ Standort

const ORT = "Rheindorf";
const KV = `${ORT} e. V.`;
const LV = "Nordrhein-Westfalen";
const OERTL = 41; // frei erfunden

function hierarchie(teileinheit: string): HierarchieEbene[] {
  return [
    { bezeichnung: { freitext: teileinheit }, name: ORT },
    {
      bezeichnung: { code: 2 }, // ASB_HIERARCHIE_EBENEN: 2 = Kreisverband
      name: KV,
      kurz: `KV ${ORT}`,
      telefon: fakeTelefon("02191876540"),
      email: "einsatz@asb-rheindorf.example",
    },
    { bezeichnung: { code: 4 }, name: LV }, // 4 = Landesverband
  ];
}

// ------------------------------------------------------------ Fahrzeug-Fabrik

let laufendeNummer = 1;

function fahrzeug(opt: { typ: string; kennung: number; ordnung?: number; zweck: string }): Fahrzeug {
  return {
    typ: { freitext: opt.typ },
    kennzeichen: `SG-AB ${1000 + (laufendeNummer++ % 9000)}`,
    stanKonform: true,
    aenderungen: opt.zweck,
    funkrufname: {
      kennwort: { code: 6 }, // Sama (ASB)
      eigenerStandort: false,
      ort: ORT,
      teile: [OERTL, opt.kennung, opt.ordnung ?? 1],
    },
  };
}

// --------------------------------------------------------------- Bogen-Bauplan

interface Bauplan {
  datei: string;
  einheitsTyp: string;
  personal: Person[];
  fahrzeuge: Fahrzeug[];
  sonstiges?: string;
  dieselExtra?: number;
}

const EINSATZ = {
  von: datumAusIso("2025-09-06"),
  bis: datumAusIso("2025-09-07"),
  ort:
    `Starkregen und lokale Überflutung in ${ORT}-Süd — rund 300 Betroffene ohne ` +
    "Strom und Trinkwasser; Betreuungsstelle in der Stadthalle, ambulante " +
    "Erstversorgung vor Ort, Einsatzleitung durch die Kreisleitstelle.",
} as const;

function bogenAus(plan: Bauplan): Erfassungsbogen {
  return {
    schemaVersion: SCHEMA_VERSION,
    uebung: true, // Beispielbogen: überall als Übung gekennzeichnet (Störer, PDF-Wasserzeichen)
    stand: zeitpunktAusIso("2025-08-11T09:30"),
    einheit: {
      organisation: OrganisationsTyp.ASB,
      organisationName: `ASB-Kreisverband ${KV}`,
      einheitsTyp: { freitext: plan.einheitsTyp },
      hierarchie: hierarchie(plan.einheitsTyp),
    },
    einsatz: { zeitraumVon: EINSATZ.von, zeitraumBis: EINSATZ.bis, ortAuftrag: EINSATZ.ort },
    personalErfassung: PersonalErfassung.VOLLSTAENDIG,
    personal: plan.personal,
    fahrzeuge: plan.fahrzeuge,
    sofortbedarf: {
      verpflegungPersonen: plan.personal.length,
      dieselLiter: 60 * plan.fahrzeuge.length + (plan.dieselExtra ?? 0),
      benzinLiter: 0,
      gemischLiter: 0,
      unterbringung: true,
      ruhezeitErforderlich: true,
    },
    sonstiges: plan.sonstiges,
  };
}

// ---------------------------------------------------------- Die vier Komponenten

const baeuplane: Bauplan[] = [
  // Führungskomponente — 1/1/2/4, ELW 1.
  {
    datei: "einsatzeinheit-fuehrungskomponente",
    einheitsTyp: "Führungskomponente (Einsatzeinheit)",
    personal: [
      person({ rolle: R.FUEHRER, funktion: "Zugführer/-in", fe: FE.B, kontakt: true, quali: ["Zugführer (ASB)"] }),
      person({ rolle: R.UNTERFUEHRER, funktion: "Führungsassistent/-in (IuK)", fe: FE.C1, quali: ["Gruppenführer (ASB)", "Sprechfunker (BOS-Digitalfunk)"] }),
      person({ rolle: R.MANNSCHAFT, funktion: "Führungsgehilfe/-in (IuK)", fe: FE.B, quali: ["Sprechfunker (BOS-Digitalfunk)"] }),
      person({ rolle: R.MANNSCHAFT, funktion: "Führungsgehilfe/-in (IuK), Kraftfahrer/-in", fe: FE.C1, quali: ["Sprechfunker (BOS-Digitalfunk)"] }),
    ],
    fahrzeuge: [
      fahrzeug({ typ: "ELW 1", kennung: 19, zweck: "Einsatzleitwagen — Führungsstelle der Einsatzeinheit mit zwei Digitalfunk-Arbeitsplätzen" }),
    ],
    sonstiges: "Führt und disponiert die drei Fachkomponenten der Einsatzeinheit; sorgt für die lückenlose Einsatzdokumentation.",
  },

  // Sanitätsgruppe — 1/3/6/10: GW-San (Arzt, GF, 4 Rettungshelfer), KTW-B (Fahrer + Transportführer), RTW (Fahrer + Transportführer).
  {
    datei: "einsatzeinheit-sanitaetsgruppe",
    einheitsTyp: "Sanitätsgruppe (Einsatzeinheit)",
    personal: [
      person({ rolle: R.FUEHRER, funktion: "Ärztin/Arzt (GW-San)", fe: FE.B, kontakt: true, quali: ["Notärztin/Notarzt"] }),
      person({ rolle: R.UNTERFUEHRER, funktion: "Gruppenführer/-in Sanitätsdienst (GW-San)", fe: FE.C1, quali: ["Gruppenführer (ASB)"] }),
      person({ rolle: R.MANNSCHAFT, funktion: "Rettungshelfer/-in (GW-San)", fe: FE.B, quali: ["Rettungshelfer"] }),
      person({ rolle: R.MANNSCHAFT, funktion: "Rettungshelfer/-in (GW-San)", fe: FE.B, quali: ["Rettungshelfer"] }),
      person({ rolle: R.MANNSCHAFT, funktion: "Rettungshelfer/-in (GW-San)", fe: FE.NONE, quali: ["Rettungshelfer"] }),
      person({ rolle: R.MANNSCHAFT, funktion: "Rettungshelfer/-in (GW-San)", fe: FE.NONE, quali: ["Rettungshelfer"] }),
      person({ rolle: R.MANNSCHAFT, funktion: "Fahrer/-in KTW", fe: FE.C1, quali: ["Rettungshelfer"] }),
      person({ rolle: R.UNTERFUEHRER, funktion: "Transportführer/-in KTW", fe: FE.C1, quali: ["Rettungssanitäter"] }),
      person({ rolle: R.MANNSCHAFT, funktion: "Fahrer/-in RTW", fe: FE.C1, quali: ["Rettungssanitäter"] }),
      person({ rolle: R.UNTERFUEHRER, funktion: "Transportführer/-in RTW", fe: FE.C1, quali: ["Notfallsanitäter"] }),
    ],
    fahrzeuge: [
      fahrzeug({ typ: "GW-San", kennung: 96, zweck: "Gerätewagen Sanitätsdienst (GWSan 25) des Landes NRW — aufblasbares Zelt, Notstrom, Beleuchtung" }),
      fahrzeug({ typ: "KTW B (Notfall-KTW)", kennung: 92, zweck: "Krankentransportwagen mit Erweiterung zum Rettungswagen-Ersatz (Zivilschutzfahrzeug KTW4)" }),
      fahrzeug({ typ: "RTW", kennung: 83, zweck: "Rettungswagen der Sanitätsgruppe" }),
    ],
    sonstiges:
      "Grundmodul GW-San (Arzt, Gruppenführer, vier Rettungshelfer) versorgt und stabilisiert Verletzte; " +
      "KTW-B und RTW ergänzen die Sanitätsgruppe um eine Transportkomponente (in einigen Regionalverbänden " +
      "auch als eigenständige „Rettungsgruppe” bezeichnet).",
  },

  // Betreuungskomponente — 0/3/12/15: 1 GF, 2 TF, 12 Helfer.
  {
    datei: "einsatzeinheit-betreuungskomponente",
    einheitsTyp: "Betreuungskomponente (Einsatzeinheit)",
    personal: [
      person({ rolle: R.UNTERFUEHRER, funktion: "Gruppenführer/-in Betreuungsdienst", fe: FE.C1, kontakt: true, quali: ["Gruppenführer (ASB)", "Betreuungshelfer"] }),
      person({ rolle: R.UNTERFUEHRER, funktion: "Truppführer/-in Betreuung (1)", fe: FE.C1, quali: ["Betreuungshelfer"] }),
      person({ rolle: R.UNTERFUEHRER, funktion: "Truppführer/-in Betreuung (2)", fe: FE.C1, quali: ["Betreuungshelfer"] }),
      person({ rolle: R.MANNSCHAFT, funktion: "Betreuungshelfer/-in", fe: FE.B, quali: ["Betreuungshelfer"] }),
      person({ rolle: R.MANNSCHAFT, funktion: "Betreuungshelfer/-in", fe: FE.B, quali: ["Betreuungshelfer"] }),
      person({ rolle: R.MANNSCHAFT, funktion: "Betreuungshelfer/-in", fe: FE.NONE, quali: ["Betreuungshelfer"] }),
      person({ rolle: R.MANNSCHAFT, funktion: "Betreuungshelfer/-in", fe: FE.NONE, quali: ["Betreuungshelfer"] }),
      person({ rolle: R.MANNSCHAFT, funktion: "Betreuungshelfer/-in", fe: FE.B, quali: ["Betreuungshelfer"] }),
      person({ rolle: R.MANNSCHAFT, funktion: "Betreuungshelfer/-in, Kinderbetreuung", fe: FE.B }),
      person({ rolle: R.MANNSCHAFT, funktion: "Betreuungshelfer/-in", fe: FE.NONE }),
      person({ rolle: R.MANNSCHAFT, funktion: "Betreuungshelfer/-in", fe: FE.B }),
      person({ rolle: R.MANNSCHAFT, funktion: "Betreuungshelfer/-in, Materialerhaltung", fe: FE.BE }),
      person({ rolle: R.MANNSCHAFT, funktion: "Betreuungshelfer/-in", fe: FE.B }),
      person({ rolle: R.MANNSCHAFT, funktion: "Betreuungshelfer/-in", fe: FE.NONE }),
      person({ rolle: R.MANNSCHAFT, funktion: "Kraftfahrer/-in BtLKW", fe: FE.CE, quali: ["Kraftfahrer CE"] }),
    ],
    fahrzeuge: [
      fahrzeug({ typ: "BT-Kombi", kennung: 16, ordnung: 1, zweck: "1. Betreuungskombi — Notunterkunft/Verpflegung" }),
      fahrzeug({ typ: "BT-Kombi", kennung: 16, ordnung: 2, zweck: "2. Betreuungskombi" }),
      fahrzeug({ typ: "Anh. Betreuung", kennung: 16, ordnung: 3, zweck: "Betreuungsanhänger — Zusatzmaterial" }),
      fahrzeug({ typ: "BtLKW", kennung: 65, zweck: "Betreuungslastkraftwagen, optional mit Feldküche" }),
    ],
    dieselExtra: 60, // optionale Feldküche auf dem BtLKW
    sonstiges:
      "Personalstärkste Komponente der Einsatzeinheit: Errichtung von Notunterkünften, Verpflegung von " +
      "Betroffenen und Einsatzkräften, Ausgabe von Kleidung/Hygieneartikeln, psychosoziale Notfallversorgung.",
  },

  // Technikkomponente — 0/1/3/4.
  {
    datei: "einsatzeinheit-technikkomponente",
    einheitsTyp: "Technikkomponente (Einsatzeinheit)",
    personal: [
      person({ rolle: R.UNTERFUEHRER, funktion: "Gruppenführer/-in Technik und Sicherheit", fe: FE.CE, kontakt: true, quali: ["Gruppenführer (ASB)", "Fachdienst Technik und Sicherheit"] }),
      person({ rolle: R.MANNSCHAFT, funktion: "Helfer/-in Technik und Sicherheit", fe: FE.BE }),
      person({ rolle: R.MANNSCHAFT, funktion: "Helfer/-in Technik und Sicherheit", fe: FE.B }),
      person({ rolle: R.MANNSCHAFT, funktion: "Helfer/-in Technik und Sicherheit, Kraftfahrer/-in", fe: FE.CE, quali: ["Kraftfahrer CE"] }),
    ],
    fahrzeuge: [
      fahrzeug({ typ: "GW-Technik", kennung: 64, zweck: "Zeltbau, Stromversorgung, Ausleuchtung und Wasserversorgung für die gesamte Einsatzeinheit" }),
    ],
    dieselExtra: 100, // Notstromversorgung
    sonstiges: "Unterstützt zu Einsatzbeginn beim Zeltbau, stellt Strom-/Wasserversorgung und Ausleuchtung her; überwacht während des Einsatzes die Arbeitssicherheit.",
  },
];

// Soll-Stärken aus der Quelle zur Selbstprüfung (F/U/M/Gesamt).
const SOLL: Record<string, Staerke> = {
  "einsatzeinheit-fuehrungskomponente": { fuehrer: 1, unterfuehrer: 1, mannschaft: 2, gesamt: 4 },
  "einsatzeinheit-sanitaetsgruppe": { fuehrer: 1, unterfuehrer: 3, mannschaft: 6, gesamt: 10 },
  "einsatzeinheit-betreuungskomponente": { fuehrer: 0, unterfuehrer: 3, mannschaft: 12, gesamt: 15 },
  "einsatzeinheit-technikkomponente": { fuehrer: 0, unterfuehrer: 1, mannschaft: 3, gesamt: 4 },
};

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

function pruefen(): void {
  const fehler: string[] = [];
  const dateien = new Set<string>();
  const einheitsTypen = new Set<string>();
  const kennzeichen = new Set<string>();
  const funkrufnamen = new Set<string>();
  for (const plan of baeuplane) {
    if (dateien.has(plan.datei)) fehler.push(`Dateiname doppelt: ${plan.datei}`);
    dateien.add(plan.datei);
    if (einheitsTypen.has(plan.einheitsTyp)) fehler.push(`Einheitstyp doppelt: ${plan.einheitsTyp}`);
    einheitsTypen.add(plan.einheitsTyp);
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
      if (!f.funkrufname) continue;
      if (f.funkrufname.kennwort.code !== 6) fehler.push(`${plan.datei}: Funkruf-Kennwort ≠ Sama`);
      const kennung = f.funkrufname.teile.join("-");
      if (funkrufnamen.has(kennung)) fehler.push(`Funkkennung doppelt: ${kennung}`);
      funkrufnamen.add(kennung);
    }
  }
  if (fehler.length > 0) throw new Error(`Selbstprüfung fehlgeschlagen:\n  ${fehler.join("\n  ")}`);
}

// ---------------------------------------------------------------- Hauptlauf

pruefen();

const ausgabe = join(wurzel, "examples", "asb");
mkdirSync(ausgabe, { recursive: true });
for (const plan of baeuplane) {
  const pfad = join(ausgabe, `${plan.datei}.json`);
  if (existsSync(pfad)) rmSync(pfad);
}

const uebersicht: string[] = [];
const summe: Staerke = { fuehrer: 0, unterfuehrer: 0, mannschaft: 0, gesamt: 0 };
for (const plan of baeuplane) {
  const bogen = bogenAus(plan);
  const qr = await qrSatz(bogen);
  roundtrip(qr, bogen.personal.length, plan.datei);
  writeFileSync(join(ausgabe, `${plan.datei}.json`), JSON.stringify(bogen, null, 2) + "\n");
  const s = staerke(bogen);
  summe.fuehrer += s.fuehrer;
  summe.unterfuehrer += s.unterfuehrer;
  summe.mannschaft += s.mannschaft;
  summe.gesamt += s.gesamt;
  const funk = bogen.fahrzeuge
    .map((f) => (f.funkrufname ? f.funkrufname.teile.join("-") : "—"))
    .join(", ");
  uebersicht.push(
    `| ${plan.datei} | ${plan.einheitsTyp} | ${s.fuehrer}/${s.unterfuehrer}/${s.mannschaft}/${s.gesamt} | ${bogen.fahrzeuge.length} | ${funk} |`,
  );
  console.log(`✓ ${plan.datei} (${s.fuehrer}/${s.unterfuehrer}/${s.mannschaft}/${s.gesamt}, ${qr.segmentiert ? `${qr.teile.length} QR-Teile` : "1 QR"})`);
}

writeFileSync(
  join(ausgabe, "README.md"),
  `# Beispiel-Erfassungsbögen — ASB-Einsatzeinheit

${baeuplane.length} Beispielbögen zur vierteiligen Einsatzeinheit, wie sie der
ASB gemeinsam mit den anderen Hilfsorganisationen im Katastrophenschutz
Nordrhein-Westfalens stellt. Zusammen
${summe.fuehrer}/${summe.unterfuehrer}/${summe.mannschaft}/${summe.gesamt}.

Quelle: [„Die Einsatzeinheit NRW", DRK-Kreisverband Wuppertal e. V.](https://www.drk-w.de/katastrophenschutz/katastrophenschutz-in-nrw/katastrophenschutz-in-nrw/die-einsatzeinheit-nrw.html) —
beschreibt das landeseinheitliche NRW-Modell, das auch der ASB nutzt (bestätigt
durch die [Sanitätsgruppen-Seite des ASB Niederrhein e. V.](https://www.asb-niederrhein.de/unsere-angebote/katastrophenschutz/sanitaetsgruppe),
die dieselbe Fahrzeug- und Rollenkombination — GWSan 25, KTW4, RTW — für die
eigene Einsatzeinheit beschreibt).

**Anders als die CSV-Rechercheliste** (die für den ASB „Sanitätszug",
„Sanitätsgruppe" und „Rettungsgruppe" mit grober Personenzahl, aber ohne
Einzelrollen nennt) folgen diese Bögen der Gliederung der Quelle: vier
Komponenten der Einsatzeinheit statt dreier Zug-Teileinheiten. Die
Sanitätsgruppe deckt dieselbe Idee ab — Grundmodul plus RTW-Erweiterung, in
einigen Regionalverbänden „Rettungsgruppe" genannt.

Alle Personen, Kontakte und Kfz-Kennzeichen sind **fiktiv**; der
ASB-Kreisverband „${KV}" existiert nicht.

Neu erzeugen mit: \`npm run beispiele:asb-san\` (deterministisch, fester Zufalls-Seed).

| Datei | Komponente | Stärke | Fz | Funkkennung (Sama ${ORT} …) |
|---|---|---|---|---|
${uebersicht.join("\n")}
`,
);

console.log(
  `\nFertig: ${baeuplane.length} Beispielbögen in examples/asb/ (+ README.md), ` +
    `gesamt ${summe.fuehrer}/${summe.unterfuehrer}/${summe.mannschaft}/${summe.gesamt}`,
);
