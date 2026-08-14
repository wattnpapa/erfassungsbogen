/**
 * Erzeugt Beispiel-Erfassungsbögen der Medizinischen Task Force (MTF) des
 * Bundes als JSON nach examples/bbk/ — je Teileinheit ein Bogen. Abgelegt ist
 * nur das Bogen-JSON; die PDF (mit eingebettetem JSON und QR-Code) entsteht
 * erst beim Anklicken in der App aus dem aktuellen Layout.
 *
 * Aufruf (Node ≥ 22): npm run beispiele:bbk
 *
 * Grundlage: das „Rahmenkonzept Medizinische Task Force (MTF)" des Bundesamts
 * für Bevölkerungsschutz und Katastrophenhilfe (BBK), Stand April 2018,
 * Abschnitt 6–11 (Gesamtstärke/Gliederung sowie je Teileinheit Stärke,
 * Fahrzeuge und Funktionsstellen):
 *   https://www.bbk.bund.de/SharedDocs/Downloads/DE/MTF/Rahmenkonzept/rahmenkonzept-mtf-download.pdf
 *
 * Die MTF gliedert sich bundeseinheitlich in fünf Teileinheiten mit fester
 * Stärke (Abschnitt 6.1) und Fahrzeugausstattung (Abschnitt 6.2):
 *
 *   Führungsgruppe (FüGr)                     5/1/3/9     2 Fahrzeuge
 *   Behandlungsbereitschaft (BeB)              13/19/34/66 10 Fahrzeuge
 *   Patiententransportgruppe (PtGr)            0/2/10/12   6 Fahrzeuge
 *   Dekontaminationszug für Verletzte (Dekon V Z) 3/5/28/36 5 Fahrzeuge
 *   Logistikzug (Log Z)                        2/4/9/15    3 Fahrzeuge
 *   ————————————————————————————————————————————————————————————
 *   Gesamtstärke MTF                           23/31/84/138 26 Fahrzeuge
 *
 * Die CSV-Rechercheliste, die als Ausgangspunkt diente, nannte nur vier
 * Teileinheiten (Führung, Behandlung, Dekon-V, Patiententransport) — das
 * Rahmenkonzept selbst weist eine fünfte, den Logistikzug, aus. Er ist hier
 * mit abgebildet, weil das Rahmenkonzept dazu dieselbe Detailtiefe liefert wie
 * zu den anderen vier.
 *
 * Jede Teileinheit besteht ihrerseits aus mehreren Funktionsstellen (z. B. die
 * Behandlungsbereitschaft aus Führung, Eingangssichtung, Internem
 * Patiententransport, Versorgungsnachweis, sieben Behandlungsstellen A–G,
 * Totenablage und Ausgangsdokumentation). Die Rollenkürzel, Funktionstitel und
 * Stärken je Funktionsstelle sind wörtlich dem Rahmenkonzept entnommen
 * (Abschnitt 7.3/8.3/8.4/9.3/10.3/11.3); nur die Zuordnung „Führer /
 * Unterführer / Mannschaft" der einzelnen Funktion war dort teils nicht
 * explizit benannt und wurde so gewählt, dass die Summe je Funktionsstelle und
 * je Teileinheit exakt die im Rahmenkonzept angegebene Stärke ergibt (von der
 * Selbstprüfung unten gegengeprüft).
 *
 * ANDERS ALS die KatS-StAN der Länder (scripts/kats-*-beispielboegen.mts) und
 * die Verbandsgliederung des DRK (scripts/drk-nds-beispielboegen.mts) ist die
 * MTF-Gliederung weder Landesrecht noch Verbandssatzung, sondern ein
 * Bund-Land-übergreifendes Rahmenkonzept des BBK — bundesweit für alle 61
 * MTF-Standorte identisch. Die Beispielbögen liegen deshalb flach unter
 * examples/bbk/ (kein Bundesland-Unterordner) und erscheinen NICHT in der
 * Landesvorlagen-Auswahl (src/vokabulare/landesvorlagen.ts erwartet eine
 * Bundesland-Ebene) — genau wie die bundesweiten THW- und DLRG-Beispiele
 * (examples/thw/, examples/dlrg/) sind sie nur über die Beispielbögen-Übersicht
 * in der Fußzeile erreichbar.
 *
 * TRÄGER UND FUNKRUFNAMEN (Modellierungsentscheidung): Die MTF-Fahrzeuge sind
 * Bundeseigentum (ZSKG), werden aber von einem örtlichen Träger besetzt und
 * unterhalten — laut Rahmenkonzept (4.1) "in Abstimmung zwischen den
 * zuständigen Stellen, Behörden sowie den Trägern der MTF"; die
 * "Beschriftung der Fahrzeuge" richtet sich dabei nach Landesvorgaben. Es gibt
 * also KEIN bundeseinheitliches Funkrufname-Schema für die MTF: In der Praxis
 * mischen sich Berufsfeuerwehren und Hilfsorganisationen als Träger (die
 * MTF-Pilotstandorte im Rahmenkonzept selbst liegen bei einer Berufsfeuerwehr
 * bzw. bei einem Konsortium aus THW/DRK/JUH/MHD/ASB). Für dieses Beispielset
 * wird EIN fiktiver Träger durchgehend verwendet — eine Berufsfeuerwehr einer
 * kreisfreien Stadt — und die Fahrzeuge tragen deren Funkrufname-Schema
 * (Kennwort „Florian", Niedersachsen-Anlage-2-Stil wie in
 * scripts/fw-nds-beispielboegen.mts). Die dabei verwendeten Fahrzeugkennungen
 * (zweite Zahl) sind frei erfunden, weil das Rahmenkonzept dafür keine
 * bundeseinheitliche Vorgabe macht.
 *
 * Alle Personen, Kontakte, Kfz-Kennzeichen und Ortsangaben sind **fiktiv**;
 * der Standort „Nordwede" und der Landkreis „Moorwehde" existieren nicht.
 *
 * Am Ende läuft ein QR-Roundtrip; examples/bbk/README.md bekommt eine
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
const rnd = prng(20180400); // Stand des Rahmenkonzepts: April 2018

const wuerfel = (p: number): boolean => rnd() < p;
const wahl = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)]!;

// ------------------------------------------------------------- Namens-Pools

const VORNAMEN_M = [
  "Andreas", "Benedikt", "Carsten", "Dennis", "Erik", "Felix", "Gunnar",
  "Hendrik", "Ingo", "Jonas", "Karsten", "Lennart", "Markus", "Niklas",
  "Oliver", "Patrick", "Robert", "Steffen", "Thorsten", "Volker",
] as const;
const VORNAMEN_W = [
  "Anja", "Britta", "Carolin", "Diana", "Elke", "Franziska", "Gabriele",
  "Hannah", "Isabell", "Jana", "Katrin", "Lena", "Melanie", "Nadine",
  "Petra", "Sabrina", "Tanja", "Ute", "Vera", "Yvonne",
] as const;
const NACHNAMEN = [
  "Ahrens", "Bartels", "Claasen", "Dircksen", "Ehlers", "Freytag", "Grote",
  "Hansen", "Isernhagen", "Janssen", "Kock", "Lehmann", "Meinders", "Nolte",
  "Ohlmann", "Petersen", "Quast", "Reimers", "Sievers", "Tietjen", "Ubben",
  "Vogt", "Wiechers",
] as const;

const belegteNamen = new Set<string>();

/** Erzeugt eine Person mit eindeutigem Namen und plausiblen Attributen. */
function person(opt: { rolle: R; funktion: string; fe: FE; kontakt?: boolean }): Person {
  const g = wuerfel(0.4) ? G.W : G.M; // Sanitäts-/Betreuungsdienst: hoher Frauenanteil
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
    zusatzqualifikationen: /^(Arzt|ML )/.test(opt.funktion) ? [{ freitext: "Notarzt" }] : [],
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

// -------------------------------------------------------- Rollen → Personal

interface RollenSpec {
  /** Amtliches Kürzel + ausgeschriebene Funktion aus dem Rahmenkonzept, z. B. "AFü MTF — Abteilungsführer MTF". */
  funktion: string;
  rolle: R;
  /** Kf/Maschinist-Rollen brauchen mind. C1; sonstige Führungs-/Fachrollen B. */
  fe?: FE;
  anzahl?: number;
  kontakt?: boolean;
}

/** Wandelt eine Liste von Rollen (aus dem Rahmenkonzept) in Personal um; Mehrfachrollen werden durchnummeriert. */
function rollenPersonal(specs: RollenSpec[]): Person[] {
  const out: Person[] = [];
  for (const s of specs) {
    const n = s.anzahl ?? 1;
    for (let i = 0; i < n; i++) {
      out.push(
        person({
          rolle: s.rolle,
          funktion: n > 1 ? `${s.funktion} (${i + 1})` : s.funktion,
          fe: s.fe ?? FE.B,
          kontakt: s.kontakt && i === 0,
        }),
      );
    }
  }
  return out;
}

// ------------------------------------------------------------------ Standort
// Träger: fiktive Berufsfeuerwehr einer kreisfreien Stadt (siehe Kopfkommentar
// zur Trägerfrage). FEUERWEHR_HIERARCHIE_EBENEN: Code 1 = Gemeinde/Stadt,
// Code 2 = Landkreis/kreisfreie Stadt (wie in scripts/fw-nds-beispielboegen.mts).

const ORT = "Nordwede";
const KREIS = "Moorwehde";
/** Fiktive örtliche Kennung für die Florian-Funkrufnamen (Anlage-2-Stil Niedersachsen). */
const OERTL = 77;

function hierarchie(teileinheit: string): HierarchieEbene[] {
  return [
    { bezeichnung: { freitext: teileinheit }, name: ORT },
    {
      bezeichnung: { freitext: "MTF-Standort" },
      name: `Berufsfeuerwehr ${ORT}`,
      telefon: fakeTelefon("04421987650"),
      email: "mtf@feuerwehr-nordwede.example",
    },
    { bezeichnung: { code: 1 }, name: ORT },
    { bezeichnung: { code: 2 }, name: `Landkreis ${KREIS}` },
  ];
}

// ------------------------------------------------------------ Fahrzeug-Fabrik

const KENNWORT_FLORIAN = 2;
let laufendeNummer = 1;

interface FzSpec {
  typ: string;
  /** Fahrzeugkennung (frei erfunden, siehe Kopfkommentar) + Ordnungszahl. */
  kennung: number;
  ordnung?: number;
  zweck: string;
}

function fahrzeug(spec: FzSpec): Fahrzeug {
  return {
    typ: { freitext: spec.typ },
    kennzeichen: `NWD-FW ${1000 + (laufendeNummer++ % 9000)}`,
    stanKonform: true,
    aenderungen: spec.zweck,
    funkrufname: {
      kennwort: { code: KENNWORT_FLORIAN },
      eigenerStandort: false,
      ort: ORT,
      teile: [OERTL, spec.kennung, spec.ordnung ?? 1],
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
  von: datumAusIso("2025-11-10"),
  bis: datumAusIso("2025-11-12"),
  ort:
    `Chemieunfall im Tanklager ${ORT}-Hafen — Massenanfall von Verletzten mit ` +
    "CBRN-Komponente: Behandlungsplatz, Verletztendekontamination und " +
    "weiträumiger Patiententransport in umliegende Kliniken; überörtliche " +
    "Alarmierung der MTF durch die Leitstelle des Landkreises.",
} as const;

function bogenAus(plan: Bauplan): Erfassungsbogen {
  return {
    schemaVersion: SCHEMA_VERSION,
    uebung: true, // Beispielbogen: überall als Übung gekennzeichnet (Störer, PDF-Wasserzeichen)
    stand: zeitpunktAusIso("2025-10-15T09:00"),
    einheit: {
      organisation: OrganisationsTyp.FEUERWEHR,
      organisationName: `Berufsfeuerwehr ${ORT} — MTF-Standort (Bundesausstattung)`,
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

// ---------------------------------------------------- Die fünf Teileinheiten
// Rollen, Funktionstitel und Stärken je Funktionsstelle sind wörtlich dem
// Rahmenkonzept entnommen (siehe Kopfkommentar für die Fundstellen).

const baeuplane: Bauplan[] = [
  // 1 — Führungsgruppe (FüGr): Stärke 5/1/3/9, 2 Fahrzeuge (Abschnitt 7).
  {
    datei: "fuehrungsgruppe",
    einheitsTyp: "Führungsgruppe (MTF)",
    personal: rollenPersonal([
      { funktion: "AFü MTF — Abteilungsführer Medizinische Task Force", rolle: R.FUEHRER, kontakt: true },
      { funktion: "stv. AFü MTF — stellvertretender Abteilungsführer MTF", rolle: R.FUEHRER },
      { funktion: "ML MTF — Medizinischer Leiter MTF", rolle: R.FUEHRER },
      { funktion: "FüAss Dekon V Z — Führungsassistent Dekontaminationszug für Verletzte", rolle: R.FUEHRER },
      { funktion: "FüAss PtGr — Führungsassistent Patiententransportgruppe", rolle: R.FUEHRER },
      { funktion: "FüAss BeB — Führungsassistent Behandlungsbereitschaft", rolle: R.UNTERFUEHRER },
      { funktion: "SpFu FüGr — Sprechfunker Führungsgruppe", rolle: R.MANNSCHAFT },
      { funktion: "Kf KdoW — Kraftfahrer Kommandowagen", rolle: R.MANNSCHAFT, fe: FE.C1 },
      { funktion: "Me/Kf FüKW — Melder/Kraftfahrer Führungskraftwagen", rolle: R.MANNSCHAFT, fe: FE.C1 },
    ]),
    fahrzeuge: [
      fahrzeug({ typ: "KdoW", kennung: 10, zweck: "Kommandowagen der Führungsgruppe" }),
      fahrzeug({ typ: "FüKW", kennung: 11, zweck: "Führungskraftwagen — mobile Führungsstelle" }),
    ],
    sonstiges: "Führt die MTF und ihre Teileinheiten; stellt bei Vollalarmierung die sanitätsdienstliche Einsatzleitung vor Ort, bleibt aber dem Stab unterstellt.",
  },

  // 2 — Behandlungsbereitschaft (BeB): Stärke 13/19/34/66, 10 Fahrzeuge (Abschnitt 8).
  {
    datei: "behandlungsbereitschaft",
    einheitsTyp: "Behandlungsbereitschaft (MTF)",
    personal: [
      // Führung BeB — Stärke 3/0/1/4 (8.4.1)
      ...rollenPersonal([
        { funktion: "BFü BeB — Bereitschaftsführer Behandlungsbereitschaft", rolle: R.FUEHRER, kontakt: true },
        { funktion: "stv. BFü BeB — stellvertretender Bereitschaftsführer BeB", rolle: R.FUEHRER },
        { funktion: "ML BeB — Medizinischer Leiter Behandlungsbereitschaft", rolle: R.FUEHRER },
        { funktion: "Kf MTW Beh 1 Fü", rolle: R.MANNSCHAFT, fe: FE.C1 },
      ]),
      // Eingangssichtung (ES) — Stärke 3/0/4/7 (8.4.2)
      ...rollenPersonal([
        { funktion: "ZFü ES — Zugführer Eingangssichtung", rolle: R.FUEHRER },
        { funktion: "Arzt St 1 — Arzt Sichtungsstelle 1", rolle: R.FUEHRER },
        { funktion: "Arzt St 2 — Arzt Sichtungsstelle 2", rolle: R.FUEHRER },
        { funktion: "RS St 1 — Rettungssanitäter Sichtungsstelle 1", rolle: R.MANNSCHAFT },
        { funktion: "San St 1 — Sanitäter Sichtungsstelle 1", rolle: R.MANNSCHAFT },
        { funktion: "RS St 2 — Rettungssanitäter Sichtungsstelle 2", rolle: R.MANNSCHAFT },
        { funktion: "San St 2 — Sanitäter Sichtungsstelle 2", rolle: R.MANNSCHAFT },
      ]),
      // Interner Patiententransport (InTr) — Stärke 0/2/4/6 (8.4.3)
      ...rollenPersonal([
        { funktion: "GrFü InTr — Gruppenführer Interner Patiententransport", rolle: R.UNTERFUEHRER },
        { funktion: "stv. GrFü InTr", rolle: R.UNTERFUEHRER },
        { funktion: "San InTr — Sanitäter Interner Patiententransport", rolle: R.MANNSCHAFT, anzahl: 3 },
        { funktion: "Kf GW Beh InTr", rolle: R.MANNSCHAFT, fe: FE.C1 },
      ]),
      // Versorgungsnachweis (VSN) — Stärke 0/1/1/2 (8.4.4)
      ...rollenPersonal([
        { funktion: "FüAss VSN — Führungsassistent Versorgungsnachweis", rolle: R.UNTERFUEHRER },
        { funktion: "FüHe VSN — Führungshelfer Versorgungsnachweis", rolle: R.MANNSCHAFT },
      ]),
      // Behandlungsstellen A–G (BhS) — 7 × Stärke 1/2/3/6 (8.4.5)
      ...(["A", "B", "C", "D", "E", "F", "G"] as const).flatMap((buchstabe) =>
        rollenPersonal([
          { funktion: `GrFü BhS ${buchstabe} — Gruppenführer Behandlungsstelle ${buchstabe}`, rolle: R.FUEHRER },
          { funktion: `stv. GrFü BhS ${buchstabe}`, rolle: R.UNTERFUEHRER },
          { funktion: `Arzt BhS ${buchstabe}`, rolle: R.UNTERFUEHRER },
          { funktion: `RS BhS ${buchstabe}`, rolle: R.MANNSCHAFT },
          { funktion: `San BhS ${buchstabe}`, rolle: R.MANNSCHAFT },
          { funktion: `Kf GW San BhS ${buchstabe}`, rolle: R.MANNSCHAFT, fe: FE.C1 },
        ]),
      ),
      // Totenablage (TA) — Stärke 0/1/1/2 (8.4.6)
      ...rollenPersonal([
        { funktion: "GrFü TA — Gruppenführer Totenablage", rolle: R.UNTERFUEHRER },
        { funktion: "San TA — Sanitäter Totenablage", rolle: R.MANNSCHAFT },
      ]),
      // Ausgangsdokumentation/Patiententransportorganisation (AD/PtO) — Stärke 0/1/2/3 (8.4.7)
      ...rollenPersonal([
        { funktion: "GrFü AD/PtO — Gruppenführer Ausgangsdokumentation/Patiententransportorganisation", rolle: R.UNTERFUEHRER },
        { funktion: "RS AD/PtO — Rettungssanitäter AD/PtO", rolle: R.MANNSCHAFT },
        { funktion: "Kf MTW Beh 2 PtO", rolle: R.MANNSCHAFT, fe: FE.C1 },
      ]),
    ],
    fahrzeuge: [
      fahrzeug({ typ: "MTW Beh 1 (Fü)", kennung: 20, zweck: "Führungsfahrzeug BeB — transportiert Fü BeB, VSN" }),
      fahrzeug({ typ: "MTW Beh 2 (PtO)", kennung: 21, zweck: "transportiert Eingangssichtung, Totenablage, AD/PtO" }),
      ...(["A", "B", "C", "D", "E", "F", "G"] as const).map((buchstabe, i) =>
        fahrzeug({ typ: `GW San (BhS ${buchstabe})`, kennung: 30, ordnung: i + 1, zweck: `betreibt die Behandlungsstelle ${buchstabe}` }),
      ),
      fahrzeug({ typ: "GW Beh", kennung: 25, zweck: "Zusatzausstattung Führung/ES/VSN/InTr/TA/AD-PtO" }),
    ],
    sonstiges:
      "Betreibt den Behandlungsplatz MTF (BHP MTF) mit sieben sichtungskategorieunabhängigen " +
      "Behandlungsstellen. Taktische Führung durch BFü BeB/stv. BFü BeB, fachliche (medizinische) " +
      "Führung durch ML BeB und den Führungsassistenten Versorgungsnachweis.",
  },

  // 3 — Patiententransportgruppe (PtGr): Stärke 0/2/10/12, 6 Fahrzeuge (Abschnitt 9).
  {
    datei: "patiententransportgruppe",
    einheitsTyp: "Patiententransportgruppe (MTF)",
    personal: [
      ...rollenPersonal([
        { funktion: "GrFü PtGr — Gruppenführer Patiententransportgruppe (RS KTW 1)", rolle: R.UNTERFUEHRER, kontakt: true },
        { funktion: "Kf KTW PtGr (1)", rolle: R.MANNSCHAFT, fe: FE.C1 },
        { funktion: "stv. GrFü PtGr — stellvertretender Gruppenführer PtGr (RS KTW 2)", rolle: R.UNTERFUEHRER },
        { funktion: "Kf KTW PtGr (2)", rolle: R.MANNSCHAFT, fe: FE.C1 },
      ]),
      ...[3, 4, 5, 6].flatMap((n) =>
        rollenPersonal([
          { funktion: `RS PtGr — Rettungssanitäter KTW ${n}`, rolle: R.MANNSCHAFT },
          { funktion: `Kf KTW PtGr (${n})`, rolle: R.MANNSCHAFT, fe: FE.C1 },
        ]),
      ),
    ],
    fahrzeuge: [1, 2, 3, 4, 5, 6].map((n) =>
      fahrzeug({ typ: "KTW B / KTW 4-Tr.", kennung: 40, ordnung: n, zweck: `Krankentransportwagen ${n} der Patiententransportgruppe` }),
    ),
    sonstiges: "Sechs gleich ausgestattete KTW; GrFü und stv. GrFü sind zugleich RS auf KTW 1 bzw. KTW 2.",
  },

  // 4 — Dekontaminationszug für Verletzte (Dekon V Z): Stärke 3/5/28/36, 5 Fahrzeuge (Abschnitt 10).
  {
    datei: "dekontaminationszug-verletzte",
    einheitsTyp: "Dekontaminationszug für Verletzte (MTF)",
    personal: [
      // Zugführung + Erstversorgung Schwarzbereich (Trupp 1) — mit MTW Fü Dekon V (10.3.1)
      ...rollenPersonal([
        { funktion: "ZFü Dekon V Z — Zugführer Dekontaminationszug für Verletzte", rolle: R.FUEHRER, kontakt: true },
        { funktion: "stv. ZFü Dekon V Z", rolle: R.FUEHRER },
        { funktion: "Arzt EV — Arzt Erstversorgung", rolle: R.FUEHRER },
        { funktion: "GrFü SiTr — Gruppenführer Sicherheitstrupp", rolle: R.UNTERFUEHRER },
        { funktion: "RS EV — Rettungssanitäter Erstversorgung Schwarzbereich", rolle: R.MANNSCHAFT, anzahl: 2 },
        { funktion: "San EV — Sanitäter Erstversorgung Schwarzbereich", rolle: R.MANNSCHAFT, anzahl: 2 },
        { funktion: "Kf MTW Fü Dekon V", rolle: R.MANNSCHAFT, fe: FE.C1 },
      ]),
      // Erstversorgung Schwarzbereich (Trupp 2) — mit GW Dekon EV
      ...rollenPersonal([
        { funktion: "GrFü EV — Gruppenführer Erstversorgung Schwarzbereich", rolle: R.UNTERFUEHRER },
        { funktion: "RS EV — Rettungssanitäter Erstversorgung Schwarzbereich (2)", rolle: R.MANNSCHAFT },
        { funktion: "San EV — Sanitäter Erstversorgung Schwarzbereich (3)", rolle: R.MANNSCHAFT },
        { funktion: "San SHS — Sanitäter Selbsthilfestation", rolle: R.MANNSCHAFT, anzahl: 2 },
        { funktion: "Maschinist GW Dekon EV", rolle: R.MANNSCHAFT, fe: FE.C1 },
      ]),
      // Abtrocknung/Duschen/Nassdekon (Trupp 3) — mit MTW Dekon V
      ...rollenPersonal([
        { funktion: "GrFü At — Gruppenführer Abtrocknung", rolle: R.UNTERFUEHRER },
        { funktion: "RS At — Rettungssanitäter Abtrocknung", rolle: R.MANNSCHAFT },
        { funktion: "San At — Sanitäter Abtrocknung", rolle: R.MANNSCHAFT },
        { funktion: "San NDekon — Sanitäter Nassdekontamination", rolle: R.MANNSCHAFT, anzahl: 3 },
        { funktion: "San Du — Sanitäter Duschen", rolle: R.MANNSCHAFT, anzahl: 2 },
        { funktion: "Kf MTW Dekon V", rolle: R.MANNSCHAFT, fe: FE.C1 },
      ]),
      // Nassdekontamination (Trupp 4) — mit GW Dekon V
      ...rollenPersonal([
        { funktion: "GrFü NDekon — Gruppenführer Nassdekontamination", rolle: R.UNTERFUEHRER },
        { funktion: "RS NDekon — Rettungssanitäter Nassdekontamination", rolle: R.MANNSCHAFT, anzahl: 2 },
        { funktion: "San NDekon — Sanitäter Nassdekontamination (2)", rolle: R.MANNSCHAFT, anzahl: 2 },
        { funktion: "Maschinist GW Dekon V", rolle: R.MANNSCHAFT, fe: FE.C1 },
      ]),
      // Dekontamination Personal (Trupp 5) — mit GW Dekon P
      ...rollenPersonal([
        { funktion: "GrFü Dekon P — Gruppenführer Dekon Personal", rolle: R.UNTERFUEHRER },
        { funktion: "San Gro P — Sanitäter Grobreinigung Personal", rolle: R.MANNSCHAFT, anzahl: 2 },
        { funktion: "San Ank — Sanitäter Ankleiden", rolle: R.MANNSCHAFT, anzahl: 2 },
        { funktion: "Maschinist GW Dekon P", rolle: R.MANNSCHAFT, fe: FE.C1 },
      ]),
    ],
    fahrzeuge: [
      fahrzeug({ typ: "MTW Fü Dekon V", kennung: 50, zweck: "Führungsfahrzeug des Dekon-Zugs, transportiert die Zugführung" }),
      fahrzeug({ typ: "MTW Dekon V", kennung: 51, zweck: "transportiert Abtrocknung/Duschen/Nassdekon-Personal" }),
      fahrzeug({ typ: "GW Dekon EV", kennung: 52, zweck: "Gerätewagen Dekontamination Erstversorgung Schwarzbereich" }),
      fahrzeug({ typ: "GW Dekon V", kennung: 53, zweck: "Gerätewagen Dekontamination für Verletzte — Nassdekon-Ausstattung" }),
      fahrzeug({ typ: "GW Dekon P", kennung: 54, zweck: "Gerätewagen Dekontamination Personal" }),
    ],
    dieselExtra: 60, // Wasseraufbereitung/Beheizung der Dekon-Duschstrecke
    sonstiges: "Baut die Verletzten-Dekontaminationsstrecke auf (Erstversorgung Schwarzbereich → Nassdekontamination → Dekon Personal) und betreibt sie im Schichtbetrieb.",
  },

  // 5 — Logistikzug (Log Z): Stärke 2/4/9/15, 3 Fahrzeuge (Abschnitt 11).
  {
    datei: "logistikzug",
    einheitsTyp: "Logistikzug (MTF)",
    personal: [
      ...rollenPersonal([
        { funktion: "ZFü Log Z — Zugführer Logistikzug", rolle: R.FUEHRER, kontakt: true },
        { funktion: "He GW Log Bt — Helfer GW Logistik Betreuung", rolle: R.MANNSCHAFT },
        { funktion: "Kf GW Log Bt", rolle: R.MANNSCHAFT, fe: FE.C1 },
      ]),
      ...rollenPersonal([
        { funktion: "stv. ZFü Log Z — stellvertretender Zugführer Logistikzug", rolle: R.FUEHRER },
        { funktion: "GrFü Log VV — Gruppenführer Logistik, Versorgung Verbrauchsmaterial", rolle: R.UNTERFUEHRER },
        { funktion: "stv. GrFü Log VV", rolle: R.UNTERFUEHRER },
        { funktion: "He Log BG — Helfer Logistik, Betriebsstoffausgabe/Gerätewartung", rolle: R.MANNSCHAFT },
        { funktion: "He GW Log VV — Helfer GW Logistik Versorgung Verbrauchsmaterial", rolle: R.MANNSCHAFT },
        { funktion: "Kf GW Log VV", rolle: R.MANNSCHAFT, fe: FE.C1 },
      ]),
      ...rollenPersonal([
        { funktion: "GrFü Log VE — Gruppenführer Logistik, Versorgung Einsatzkräfte", rolle: R.UNTERFUEHRER },
        { funktion: "stv. GrFü Log VE", rolle: R.UNTERFUEHRER },
        { funktion: "SpFu Log Z — Sprechfunker im Logistikzug", rolle: R.MANNSCHAFT },
        { funktion: "He Log RB — Helfer Logistik, Ruhebereich Einsatzkräfte", rolle: R.MANNSCHAFT },
        { funktion: "He GW Log VE — Helfer GW Logistik Versorgung Einsatzkräfte", rolle: R.MANNSCHAFT },
        { funktion: "Kf GW Log VE", rolle: R.MANNSCHAFT, fe: FE.C1 },
      ]),
    ],
    fahrzeuge: [
      fahrzeug({ typ: "GW Log Bt", kennung: 60, zweck: "Gerätewagen Logistik Betreuung — Unterkünfte/Verpflegung für Einsatzkräfte" }),
      fahrzeug({ typ: "GW Log VV", kennung: 61, zweck: "Gerätewagen Logistik Versorgung Verbrauchsmaterial" }),
      fahrzeug({ typ: "GW Log VE", kennung: 62, zweck: "Gerätewagen Logistik Versorgung Einsatzkräfte — mobile Versorgungsstelle" }),
    ],
    dieselExtra: 100, // Feldküche/Ruhebereich, Betriebsstoffausgabe
    sonstiges: "Versorgt die eingesetzten MTF-Kräfte (Verpflegung, Ruhebereich, Betriebsstoff, Gerätewartung) und unterstützt bei Abholung/Transport von Nachschub.",
  },
];

// Soll-Stärken aus dem Rahmenkonzept zur Selbstprüfung (F/U/M/Gesamt).
const SOLL: Record<string, Staerke> = {
  "fuehrungsgruppe": { fuehrer: 5, unterfuehrer: 1, mannschaft: 3, gesamt: 9 },
  "behandlungsbereitschaft": { fuehrer: 13, unterfuehrer: 19, mannschaft: 34, gesamt: 66 },
  "patiententransportgruppe": { fuehrer: 0, unterfuehrer: 2, mannschaft: 10, gesamt: 12 },
  "dekontaminationszug-verletzte": { fuehrer: 3, unterfuehrer: 5, mannschaft: 28, gesamt: 36 },
  "logistikzug": { fuehrer: 2, unterfuehrer: 4, mannschaft: 9, gesamt: 15 },
};
const SOLL_FAHRZEUGE: Record<string, number> = {
  "fuehrungsgruppe": 2,
  "behandlungsbereitschaft": 10,
  "patiententransportgruppe": 6,
  "dekontaminationszug-verletzte": 5,
  "logistikzug": 3,
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
      fehler.push(`${plan.datei}: Stärke ${ist.fuehrer}/${ist.unterfuehrer}/${ist.mannschaft}/${ist.gesamt} ≠ Soll ${soll.fuehrer}/${soll.unterfuehrer}/${soll.mannschaft}/${soll.gesamt} (Rahmenkonzept)`);
    }
    const sollFz = SOLL_FAHRZEUGE[plan.datei];
    if (sollFz != null && plan.fahrzeuge.length !== sollFz) {
      fehler.push(`${plan.datei}: ${plan.fahrzeuge.length} Fahrzeuge ≠ Soll ${sollFz} (Rahmenkonzept)`);
    }
    if (!plan.personal[0]?.kontakte.length) fehler.push(`${plan.datei}: erste Person (Ansprechpartner) ohne Kontakt`);
    for (const f of plan.fahrzeuge) {
      const kz = f.kennzeichen!;
      if (kennzeichen.has(kz)) fehler.push(`Kennzeichen doppelt: ${kz}`);
      kennzeichen.add(kz);
      if (!f.funkrufname) continue;
      const florian = f.funkrufname.teile.join("-");
      if (funkrufnamen.has(florian)) fehler.push(`Funkkennung doppelt: ${florian}`);
      funkrufnamen.add(florian);
    }
  }
  if (fehler.length > 0) throw new Error(`Selbstprüfung fehlgeschlagen:\n  ${fehler.join("\n  ")}`);
}

// ---------------------------------------------------------------- Hauptlauf

pruefen();

const ausgabe = join(wurzel, "examples", "bbk");
mkdirSync(ausgabe, { recursive: true });
for (const datei of readdirSync(ausgabe)) {
  if (datei.endsWith(".json")) rmSync(join(ausgabe, datei));
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
  uebersicht.push(
    `| ${plan.datei} | ${plan.einheitsTyp} | ${s.fuehrer}/${s.unterfuehrer}/${s.mannschaft}/${s.gesamt} | ${bogen.fahrzeuge.length} |`,
  );
  console.log(`✓ ${plan.datei} (${s.fuehrer}/${s.unterfuehrer}/${s.mannschaft}/${s.gesamt}, ${qr.segmentiert ? `${qr.teile.length} QR-Teile` : "1 QR"})`);
}

writeFileSync(
  join(ausgabe, "README.md"),
  `# Beispiel-Erfassungsbögen — Medizinische Task Force (MTF) des Bundes

${baeuplane.length} Beispielbögen nach dem „Rahmenkonzept Medizinische Task Force
(MTF)" des Bundesamts für Bevölkerungsschutz und Katastrophenhilfe (BBK, Stand
04/2018) — je Teileinheit ein Bogen. Zusammen ergeben sie die MTF-Gesamtstärke
${summe.fuehrer}/${summe.unterfuehrer}/${summe.mannschaft}/${summe.gesamt}
(Rahmenkonzept: 23/31/84/138).

Quelle: [Rahmenkonzept MTF (PDF)](https://www.bbk.bund.de/SharedDocs/Downloads/DE/MTF/Rahmenkonzept/rahmenkonzept-mtf-download.pdf)

**Anders als die KatS-StAN der Länder oder die DRK-Verbandsgliederung ist die
MTF-Gliederung ein bundesweit einheitliches Rahmenkonzept des BBK** — nicht
Landesrecht. Die Beispielbögen liegen deshalb ohne Bundesland-Unterordner
flach hier und erscheinen nicht in der Landesvorlagen-Auswahl, sondern nur in
der Beispielbögen-Übersicht der App (wie die bundesweiten THW- und
DLRG-Beispiele).

**Träger und Funkrufnamen sind modelliert, nicht amtlich:** Das Rahmenkonzept
schreibt keinen bundeseinheitlichen Träger vor — MTF-Standorte werden je nach
Region von einer Berufsfeuerwehr oder von einem Konsortium der
Hilfsorganisationen gestellt, und die „Beschriftung der Fahrzeuge" richtet
sich nach Landesvorgaben. Für dieses Beispielset läuft durchgehend ein
fiktiver Träger — eine Berufsfeuerwehr der (nicht existierenden) kreisfreien
Stadt „${ORT}" — mit Funkrufnamen nach dem Florian-Schema
(Niedersachsen-Anlage-2-Stil). Die Fahrzeugkennungen sind dabei frei erfunden.

Alle Personen, Kontakte und Kfz-Kennzeichen sind **fiktiv**.

Neu erzeugen mit: \`npm run beispiele:bbk\` (deterministisch, fester Zufalls-Seed).

| Datei | Teileinheit | Stärke | Fahrzeuge |
|---|---|---|---|
${uebersicht.join("\n")}
`,
);

console.log(
  `\nFertig: ${baeuplane.length} Beispielbögen in examples/bbk/ (+ README.md), ` +
    `MTF gesamt ${summe.fuehrer}/${summe.unterfuehrer}/${summe.mannschaft}/${summe.gesamt}`,
);
