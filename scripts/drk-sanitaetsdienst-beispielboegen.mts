/**
 * Erzeugt Beispiel-Erfassungsbögen der DRK-Verbandsgliederung „Sanitätsdienst"
 * als JSON nach examples/drk/ — je Teileinheit ein Bogen. Abgelegt ist nur das
 * Bogen-JSON; die PDF (mit eingebettetem JSON und QR-Code) entsteht erst beim
 * Anklicken in der App aus dem aktuellen Layout.
 *
 * Aufruf (Node ≥ 22): npm run beispiele:drk-san
 *
 * ANDERS ALS examples/drk/niedersachsen/ (eine komplette DRK-Bereitschaft nach
 * einer regionalen Einsatzhandakte) bildet dieses Set zwei einzelne,
 * bundesweit bekannte Sanitätsdienst-Formationen ab: die Schnelleinsatzgruppe
 * Sanität (SEG San) und den Behandlungsplatz 25 (BHP 25). Beide gehören zur
 * multifunktionalen „Einsatzeinheit" nach DRK-Dienstvorschrift 400 (DV 400),
 * die bundesweit denselben Grundaufbau hat (Führungstrupp, Sanitätsgruppe,
 * Betreuungsgruppe, Trupp Technik und Sicherheit) — nur die konkreten
 * Stärkezahlen sind Landesverbandssache. Grundlage hier ist die
 * „DRK Dienstvorschrift 400, Ausgabe Saarland (DRK DV 400 SAL) — Der
 * Sanitätseinsatz" (Landesverband Saarland e. V., Beschluss 10.04.2016) sowie
 * die daraus referenzierte Richtlinie „Der Behandlungsplatz 25 (BHP 25 SAL)":
 *   https://www.lv-saarland.drk.de/fileadmin/user_upload/BHP_25_SAL_2014-03-24.pdf
 *
 * SEG SAN (Abschnitt 6.2.3 DV 400 SAL): Führungstrupp und Sanitätsgruppe der
 * Einsatzeinheit können gemeinsam als Schnelleinsatzgruppe (SEG) vorab
 * ausrücken. Die Sanitätsgruppe versorgt in Zusammenarbeit mit einem Notarzt,
 * zwei RTW- und einer KTW-Besatzung 2–3 Schwerverletzte, 4–5 Mittelschwer-
 * verletzte und 12 Leichtverletzte; sie besteht aus dem Arzt und neun
 * Helferinnen/Helfern (Gruppenführer/-in, Rettungssanitäter/-innen,
 * Sanitätshelfer/-innen).
 *
 * BHP 25 SAL (Abschnitt 2, „Einsatzwert"): sieben Teileinheiten mit fester
 * Stärke — Führungstrupp (2/1/1/4), Sichtung/Triage (2/1/2/5), Behandlung
 * Kat. ROT (2/-/6/8), Behandlung Kat. GELB (-/1/4/5), Behandlung Kat. GRÜN
 * (-/1/4/5), Betreuungsstaffel (-/1/5/6), Logistiktrupp (-/1/3/4); zusammen
 * 6/6/25/37. Die Quelle weist die Rollen (VFü, ZTrFü, LNA/NA, GF, RA, RS,
 * SAN, KF/SF …) je Teileinheit als Grafik aus, ohne für jede einzelne Rolle
 * explizit zu benennen, ob sie als Führer/Unterführer/Mannschaft zählt — die
 * Zuordnung unten ist so gewählt, dass die Summe je Teileinheit exakt die
 * angegebene Stärke ergibt (von der Selbstprüfung gegengeprüft). Dieselbe
 * Vorgehensweise nutzt bereits scripts/bbk-bundeseinheiten-beispielboegen.mts
 * für das MTF-Rahmenkonzept.
 *
 * FAHRZEUGE UND FUNKRUFNAMEN sind — wie beim MTF-Beispielset — eine
 * Modellierungsentscheidung: Die Quelle nennt für den BHP 25 ausdrücklich
 * mehrere Umsetzungsmöglichkeiten (ein GWRett, ein BHP-25-Anhänger oder die
 * Zusammenführung mehrerer BHP-10-Module) und legt sich nicht auf konkrete
 * Fahrzeugtypen je Teileinheit fest. Hier wird die modulare Variante
 * (mehrere BHP-10-Module) mit je einem Fahrzeug je Teileinheit angenommen.
 * Die Funkrufnamen folgen dem aus scripts/drk-nds-beispielboegen.mts bekannten
 * OPTA-Stil (Kennwort „Rotkreuz"); Träger, Ort und Kennungen sind frei
 * erfunden — ein anderer fiktiver Kreisverband als beim NDS-Beispielset, um
 * Verwechslungen zu vermeiden.
 *
 * NICHT abgebildet sind Sanitätszug, Betreuungszug und Betreuungsstelle aus
 * der Rechercheliste: Strukturell sind sie dieselbe multifunktionale
 * Einsatzeinheit (Zugtrupp/Sanitätsgruppe/Betreuungsgruppe/Technik und
 * Sicherheit), die examples/drk/niedersachsen/ mit einer vollständigen
 * DRK-Bereitschaft bereits mit Funktionslisten abdeckt — ein zweites Set mit
 * denselben Rollen unter anderem Namen wäre keine zusätzliche Information.
 *
 * Alle Personen, Kontakte, Kfz-Kennzeichen und Ortsangaben sind **fiktiv**.
 *
 * Am Ende läuft ein QR-Roundtrip; examples/drk/README-sanitaetsdienst.md
 * bekommt eine Übersichtstabelle für dieses Set (die bestehende
 * examples/drk/niedersachsen/README.md bleibt unberührt).
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
const rnd = prng(20160410); // Beschlussdatum DRK DV 400 SAL: 10.04.2016

const wuerfel = (p: number): boolean => rnd() < p;
const wahl = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)]!;

// ------------------------------------------------------------- Namens-Pools
// Saarländisch/pfälzisch gefärbt, weil die Quelle aus dem Saarland stammt.

const VORNAMEN_M = [
  "Achim", "Bastian", "Christian", "Daniel", "Erwin", "Frank", "Georg",
  "Hans-Peter", "Ingo", "Jochen", "Klaus", "Manfred", "Norbert", "Oskar",
  "Peter", "Rainer", "Stefan", "Thomas", "Udo", "Werner",
] as const;
const VORNAMEN_W = [
  "Andrea", "Birgit", "Christel", "Doris", "Elke", "Gabi", "Heike",
  "Ingrid", "Jutta", "Karin", "Marion", "Nicole", "Petra", "Renate",
  "Sabine", "Ulrike", "Waltraud",
] as const;
const NACHNAMEN = [
  "Backes", "Conrad", "Dewes", "Ecker", "Follmann", "Groß", "Hoffmann",
  "Jochum", "Kiefer", "Lauer", "Meiser", "Neu", "Ost", "Peifer", "Recktenwald",
  "Schuh", "Theobald", "Vogel", "Wagner", "Zewe",
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
// Fiktiver DRK-Kreisverband, bewusst ein anderer als „Moorlande" aus
// scripts/drk-nds-beispielboegen.mts, um die beiden Beispielsets nicht wie
// denselben Verband aussehen zu lassen.

const ORT = "Buchenrode";
const KV = `${ORT} e. V.`;
const LV = "Saarland";
const OPTA_ORT = 55; // frei erfunden

function hierarchie(teileinheit: string): HierarchieEbene[] {
  return [
    { bezeichnung: { freitext: teileinheit }, name: ORT },
    {
      bezeichnung: { code: 2 }, // DRK_HIERARCHIE_EBENEN: 2 = Kreisverband
      name: KV,
      kurz: `KV ${ORT}`,
      telefon: fakeTelefon("06821123450"),
      email: "einsatz@drk-buchenrode.example",
    },
    { bezeichnung: { code: 3 }, name: LV }, // 3 = Landesverband
  ];
}

// ------------------------------------------------------------ Fahrzeug-Fabrik

let laufendeNummer = 1;

function fahrzeug(opt: { typ: string; kennung: number; ordnung?: number; zweck: string }): Fahrzeug {
  return {
    typ: { freitext: opt.typ },
    kennzeichen: `SB-RK ${1000 + (laufendeNummer++ % 9000)}`,
    stanKonform: true,
    aenderungen: opt.zweck,
    funkrufname: {
      kennwort: { code: 3 }, // Rotkreuz (DRK)
      eigenerStandort: false,
      ort: ORT,
      teile: [OPTA_ORT, opt.kennung, opt.ordnung ?? 1],
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
  von: datumAusIso("2025-06-14"),
  bis: datumAusIso("2025-06-15"),
  ort:
    `Massenkarambolage auf der A-Ost bei ${ORT} — rund 40 Verletzte in drei ` +
    "Sichtungskategorien; Behandlungsplatz auf dem Rastplatz Buchenrode-Nord, " +
    "Voralarmierung der SEG Sanität über die Leitstelle.",
} as const;

function bogenAus(plan: Bauplan): Erfassungsbogen {
  return {
    schemaVersion: SCHEMA_VERSION,
    uebung: true, // Beispielbogen: überall als Übung gekennzeichnet (Störer, PDF-Wasserzeichen)
    stand: zeitpunktAusIso("2025-05-20T10:00"),
    einheit: {
      organisation: OrganisationsTyp.DRK,
      organisationName: `DRK-Kreisverband ${KV}`,
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

// ---------------------------------------------------------------- Bauplane

const baeuplane: Bauplan[] = [
  // SEG San — Führungstrupp + Sanitätsgruppe der Einsatzeinheit (DV 400 SAL 6.2.3).
  // Arzt + neun Helfer, hier: 1 Gruppenführer/-in, 1 Arzt/Ärztin, 8 Helfer/-innen.
  {
    datei: "seg-sanitaet",
    einheitsTyp: "Schnelleinsatzgruppe Sanität (SEG San)",
    personal: [
      person({ rolle: R.FUEHRER, funktion: "Gruppenführer/-in SEG San", fe: FE.C1, kontakt: true, quali: ["Gruppenführer (DRK)", "Rettungssanitäter"] }),
      person({ rolle: R.UNTERFUEHRER, funktion: "Ärztin/Arzt SEG San", fe: FE.B, quali: ["Notärztin/Notarzt"] }),
      person({ rolle: R.MANNSCHAFT, funktion: "Rettungssanitäter/-in", fe: FE.C1, quali: ["Rettungssanitäter"] }),
      person({ rolle: R.MANNSCHAFT, funktion: "Rettungssanitäter/-in", fe: FE.B, quali: ["Rettungssanitäter"] }),
      person({ rolle: R.MANNSCHAFT, funktion: "Rettungssanitäter/-in", fe: FE.B, quali: ["Rettungssanitäter"] }),
      person({ rolle: R.MANNSCHAFT, funktion: "Sanitätshelfer/-in", fe: FE.B }),
      person({ rolle: R.MANNSCHAFT, funktion: "Sanitätshelfer/-in", fe: FE.B }),
      person({ rolle: R.MANNSCHAFT, funktion: "Sanitätshelfer/-in", fe: FE.NONE }),
      person({ rolle: R.MANNSCHAFT, funktion: "Sanitätshelfer/-in", fe: FE.NONE }),
      person({ rolle: R.MANNSCHAFT, funktion: "Sanitätshelfer/-in, Kraftfahrer/-in", fe: FE.C1 }),
    ],
    fahrzeuge: [
      fahrzeug({ typ: "GW-San", kennung: 96, zweck: "Gerätewagen Sanitätsdienst — Erstversorgung von 2–3 Schwer- und 4–5 Mittelschwerverletzten" }),
      fahrzeug({ typ: "MTW", kennung: 17, zweck: "Mannschaftstransport der SEG, Materialreserve für 12 Leichtverletzte" }),
    ],
    sonstiges:
      "Führungstrupp und Sanitätsgruppe der DRK-Einsatzeinheit, gemeinsam als Schnelleinsatzgruppe (SEG) " +
      "vorab alarmiert. In Zusammenarbeit mit einem Notarzt sowie zwei RTW- und einer KTW-Besatzung des " +
      "Rettungsdienstes versorgt die SEG bis zu 2–3 Schwer-, 4–5 Mittelschwer- und 12 Leichtverletzte.",
  },

  // BHP 25 — sieben Teileinheiten nach BHP 25 SAL, Abschnitt 2.
  {
    datei: "bhp25-fuehrungstrupp",
    einheitsTyp: "Führungstrupp (BHP 25)",
    personal: [
      person({ rolle: R.FUEHRER, funktion: "Verbandsführer/-in BHP 25", fe: FE.B, kontakt: true, quali: ["Verbandführer"] }),
      person({ rolle: R.FUEHRER, funktion: "Leitende/-r Notärztin/Notarzt (LNA)", fe: FE.B, quali: ["Leitender Notarzt"] }),
      person({ rolle: R.UNTERFUEHRER, funktion: "Zugtruppführer/-in", fe: FE.C1, quali: ["Gruppenführer (DRK)"] }),
      person({ rolle: R.MANNSCHAFT, funktion: "Kraftfahrer/-in, Sprechfunker/-in", fe: FE.C1, quali: ["Sprechfunker (BOS-Digitalfunk)"] }),
    ],
    fahrzeuge: [
      fahrzeug({ typ: "KdoW", kennung: 10, zweck: "Kommandowagen des Verbandsführers BHP 25" }),
    ],
    sonstiges: "Führt den BHP 25 und seine sechs Behandlungsteileinheiten; Verbandsführer und LNA teilen sich die taktische bzw. medizinische Führung.",
  },
  {
    datei: "bhp25-sichtung-triage",
    einheitsTyp: "Sichtung und Registrierung (BHP 25)",
    personal: [
      person({ rolle: R.FUEHRER, funktion: "Notärztin/Notarzt Sichtung", fe: FE.B, kontakt: true, quali: ["Notärztin/Notarzt"] }),
      person({ rolle: R.FUEHRER, funktion: "Leitende/-r Notärztin/Notarzt Sichtung (LNA)", fe: FE.B, quali: ["Leitender Notarzt"] }),
      person({ rolle: R.UNTERFUEHRER, funktion: "Gruppenführer/-in Sichtung", fe: FE.C1, quali: ["Gruppenführer (DRK)"] }),
      person({ rolle: R.MANNSCHAFT, funktion: "Rettungsassistent/-in Sichtung", fe: FE.C1, quali: ["Rettungsassistent"] }),
      person({ rolle: R.MANNSCHAFT, funktion: "Rettungsassistent/-in Sichtung", fe: FE.B, quali: ["Rettungsassistent"] }),
    ],
    fahrzeuge: [
      fahrzeug({ typ: "MTW", kennung: 17, ordnung: 2, zweck: "Sichtungs-/Registrierungsmodul — Zelt und Dokumentationsmaterial" }),
    ],
    sonstiges:
      "Teilt die eintreffenden Patienten den drei Behandlungskategorien zu und veranlasst " +
      "lebensrettende Sofortmaßnahmen; mindestens ein Arzt hier soll die Qualifikation LNA besitzen.",
  },
  {
    datei: "bhp25-behandlung-rot",
    einheitsTyp: "Behandlung Kat. ROT (BHP 25)",
    personal: [
      person({ rolle: R.FUEHRER, funktion: "Notärztin/Notarzt Behandlung ROT", fe: FE.B, kontakt: true, quali: ["Notärztin/Notarzt"] }),
      person({ rolle: R.FUEHRER, funktion: "Notärztin/Notarzt Behandlung ROT", fe: FE.B, quali: ["Notärztin/Notarzt"] }),
      person({ rolle: R.MANNSCHAFT, funktion: "Rettungsassistent/-in Behandlung ROT", fe: FE.C1, quali: ["Rettungsassistent"] }),
      person({ rolle: R.MANNSCHAFT, funktion: "Rettungsassistent/-in Behandlung ROT", fe: FE.B, quali: ["Rettungsassistent"] }),
      person({ rolle: R.MANNSCHAFT, funktion: "Rettungsassistent/-in Behandlung ROT", fe: FE.B, quali: ["Rettungsassistent"] }),
      person({ rolle: R.MANNSCHAFT, funktion: "Rettungssanitäter/-in Behandlung ROT", fe: FE.C1, quali: ["Rettungssanitäter"] }),
      person({ rolle: R.MANNSCHAFT, funktion: "Rettungssanitäter/-in Behandlung ROT", fe: FE.B, quali: ["Rettungssanitäter"] }),
      person({ rolle: R.MANNSCHAFT, funktion: "Rettungssanitäter/-in Behandlung ROT", fe: FE.B, quali: ["Rettungssanitäter"] }),
    ],
    fahrzeuge: [
      fahrzeug({ typ: "GW-San", kennung: 96, ordnung: 2, zweck: "Behandlungszelt Kategorie ROT — überwiegend rettungsdienstlich/intensivmedizinisch erfahrenes Personal" }),
    ],
    sonstiges: "Versorgt bis zu zehn Schwerstverletzte; Transport erst nach Stabilisierung der Vitalfunktionen.",
  },
  {
    datei: "bhp25-behandlung-gelb",
    einheitsTyp: "Behandlung Kat. GELB (BHP 25)",
    personal: [
      person({ rolle: R.UNTERFUEHRER, funktion: "Gruppenführer/-in Behandlung GELB", fe: FE.C1, kontakt: true, quali: ["Gruppenführer (DRK)", "Rettungsassistent"] }),
      person({ rolle: R.MANNSCHAFT, funktion: "Rettungsassistent/-in Behandlung GELB", fe: FE.B, quali: ["Rettungsassistent"] }),
      person({ rolle: R.MANNSCHAFT, funktion: "Rettungssanitäter/-in Behandlung GELB", fe: FE.B, quali: ["Rettungssanitäter"] }),
      person({ rolle: R.MANNSCHAFT, funktion: "Sanitätshelfer/-in Behandlung GELB", fe: FE.B }),
      person({ rolle: R.MANNSCHAFT, funktion: "Sanitätshelfer/-in Behandlung GELB", fe: FE.NONE }),
    ],
    fahrzeuge: [
      fahrzeug({ typ: "MTW", kennung: 17, ordnung: 3, zweck: "Behandlungszelt Kategorie GELB — überwiegend rettungsdienstlich erfahrenes Personal" }),
    ],
    sonstiges: "Versorgt bis zu fünf mittelschwer Verletzte mit sofortiger Behandlungs- und Transportpriorität.",
  },
  {
    datei: "bhp25-behandlung-gruen",
    einheitsTyp: "Behandlung Kat. GRÜN (BHP 25)",
    personal: [
      person({ rolle: R.UNTERFUEHRER, funktion: "Gruppenführer/-in Behandlung GRÜN", fe: FE.C1, kontakt: true, quali: ["Gruppenführer (DRK)", "Rettungssanitäter"] }),
      person({ rolle: R.MANNSCHAFT, funktion: "Sanitätshelfer/-in Behandlung GRÜN", fe: FE.B }),
      person({ rolle: R.MANNSCHAFT, funktion: "Sanitätshelfer/-in Behandlung GRÜN", fe: FE.B }),
      person({ rolle: R.MANNSCHAFT, funktion: "Sanitätshelfer/-in Behandlung GRÜN", fe: FE.NONE }),
      person({ rolle: R.MANNSCHAFT, funktion: "Sanitätshelfer/-in Behandlung GRÜN", fe: FE.NONE }),
    ],
    fahrzeuge: [
      fahrzeug({ typ: "MTW", kennung: 17, ordnung: 4, zweck: "Behandlungszelt Kategorie GRÜN — Personal aus dem Sanitätsfachdienst" }),
    ],
    sonstiges: "Versorgt und betreut bis zu zehn Leichtverletzte, deren Behandlung und Transport aufgeschoben werden kann.",
  },
  {
    datei: "bhp25-betreuungsstaffel",
    einheitsTyp: "Betreuungsstaffel (BHP 25)",
    personal: [
      person({ rolle: R.UNTERFUEHRER, funktion: "Gruppenführer/-in Betreuungsstaffel", fe: FE.C1, kontakt: true, quali: ["Gruppenführer (DRK)", "Betreuungshelfer"] }),
      person({ rolle: R.MANNSCHAFT, funktion: "Kraftfahrer/-in, Sprechfunker/-in", fe: FE.C1, quali: ["Sprechfunker (BOS-Digitalfunk)"] }),
      person({ rolle: R.MANNSCHAFT, funktion: "Betreuungshelfer/-in", fe: FE.B, quali: ["Betreuungshelfer"] }),
      person({ rolle: R.MANNSCHAFT, funktion: "Betreuungshelfer/-in", fe: FE.B, quali: ["Betreuungshelfer"] }),
      person({ rolle: R.MANNSCHAFT, funktion: "Betreuungshelfer/-in", fe: FE.NONE, quali: ["Betreuungshelfer"] }),
      person({ rolle: R.MANNSCHAFT, funktion: "Betreuungshelfer/-in", fe: FE.NONE }),
    ],
    fahrzeuge: [
      fahrzeug({ typ: "BT-Kombi", kennung: 16, zweck: "Betreuungsstaffel BHP 25 — Material für ca. 100 Betroffene unterschiedlichen Alters und Geschlechts" }),
    ],
    sonstiges: "Betreut Angehörige, Unverletzte und wartende Patienten am BHP 25.",
  },
  {
    datei: "bhp25-logistiktrupp",
    einheitsTyp: "Logistiktrupp (BHP 25)",
    personal: [
      person({ rolle: R.UNTERFUEHRER, funktion: "Gruppenführer/-in Logistiktrupp", fe: FE.CE, kontakt: true, quali: ["Gruppenführer (DRK)", "Fachdienst Technik und Sicherheit"] }),
      person({ rolle: R.MANNSCHAFT, funktion: "Helfer/-in Technik und Sicherheit", fe: FE.BE }),
      person({ rolle: R.MANNSCHAFT, funktion: "Helfer/-in Technik und Sicherheit", fe: FE.B }),
      person({ rolle: R.MANNSCHAFT, funktion: "Helfer/-in Technik und Sicherheit, Kraftfahrer/-in", fe: FE.CE, quali: ["Kraftfahrer CE"] }),
    ],
    fahrzeuge: [
      fahrzeug({ typ: "GW-Logistik", kennung: 64, zweck: "Zeltbau, Stromversorgung, Ausleuchtung und Materialtransport für den gesamten BHP 25" }),
    ],
    dieselExtra: 120, // Netzersatz/Beleuchtung für alle sechs Behandlungsmodule
    sonstiges: "Versorgt technisch alle Teileinheiten des BHP 25 mit Strom, Licht und Material; verpflichtende Fachdienstausbildung Technik und Sicherheit.",
  },
];

// Soll-Stärken aus der Quelle zur Selbstprüfung (F/U/M/Gesamt).
const SOLL: Record<string, Staerke> = {
  "seg-sanitaet": { fuehrer: 1, unterfuehrer: 1, mannschaft: 8, gesamt: 10 },
  "bhp25-fuehrungstrupp": { fuehrer: 2, unterfuehrer: 1, mannschaft: 1, gesamt: 4 },
  "bhp25-sichtung-triage": { fuehrer: 2, unterfuehrer: 1, mannschaft: 2, gesamt: 5 },
  "bhp25-behandlung-rot": { fuehrer: 2, unterfuehrer: 0, mannschaft: 6, gesamt: 8 },
  "bhp25-behandlung-gelb": { fuehrer: 0, unterfuehrer: 1, mannschaft: 4, gesamt: 5 },
  "bhp25-behandlung-gruen": { fuehrer: 0, unterfuehrer: 1, mannschaft: 4, gesamt: 5 },
  "bhp25-betreuungsstaffel": { fuehrer: 0, unterfuehrer: 1, mannschaft: 5, gesamt: 6 },
  "bhp25-logistiktrupp": { fuehrer: 0, unterfuehrer: 1, mannschaft: 3, gesamt: 4 },
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
      if (f.funkrufname.kennwort.code !== 3) fehler.push(`${plan.datei}: Funkruf-Kennwort ≠ Rotkreuz`);
      const opta = f.funkrufname.teile.join("-");
      if (funkrufnamen.has(opta)) fehler.push(`Funkkennung doppelt: ${opta}`);
      funkrufnamen.add(opta);
    }
  }
  if (fehler.length > 0) throw new Error(`Selbstprüfung fehlgeschlagen:\n  ${fehler.join("\n  ")}`);
}

// ---------------------------------------------------------------- Hauptlauf

pruefen();

const ausgabe = join(wurzel, "examples", "drk");
mkdirSync(ausgabe, { recursive: true });
// Nur die eigenen Dateien dieses Skripts löschen — examples/drk/niedersachsen/
// (anderes Skript, eigener Unterordner) bleibt unberührt.
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
  join(ausgabe, "README-sanitaetsdienst.md"),
  `# Beispiel-Erfassungsbögen — DRK-Sanitätsdienst (SEG San, BHP 25)

${baeuplane.length} Beispielbögen zu zwei bundesweit gebräuchlichen
DRK-Sanitätsdienstformationen: der Schnelleinsatzgruppe Sanität (SEG San) und
den sieben Teileinheiten des Behandlungsplatzes 25 (BHP 25). Zusammen
${summe.fuehrer}/${summe.unterfuehrer}/${summe.mannschaft}/${summe.gesamt}.

Quelle: „DRK Dienstvorschrift 400, Ausgabe Saarland (DRK DV 400 SAL) — Der
Sanitätseinsatz" und „Der Behandlungsplatz 25 (BHP 25 SAL)", DRK-Landesverband
Saarland e. V. Beide Formationen gehören zur multifunktionalen
„Einsatzeinheit" nach DRK-Dienstvorschrift 400, die bundesweit denselben
Grundaufbau hat — die konkreten Stärkezahlen sind aber Landesverbandssache,
hier also die Saarland-Ausprägung.

**Nicht abgebildet:** Sanitätszug, Betreuungszug und Betreuungsstelle. Sie
sind strukturell dieselbe multifunktionale Einsatzeinheit (Zugtrupp,
Sanitätsgruppe, Betreuungsgruppe, Trupp Technik und Sicherheit), die
examples/drk/niedersachsen/ (siehe README dort) bereits mit vollständigen
Funktionslisten als komplette DRK-Bereitschaft abdeckt.

**Fahrzeuge sind modelliert:** Die Quelle nennt für den BHP 25 mehrere
Umsetzungsmöglichkeiten (ein GWRett, ein BHP-25-Anhänger oder mehrere
BHP-10-Module), ohne sich auf Fahrzeugtypen je Teileinheit festzulegen. Hier
ist die modulare Variante mit je einem Fahrzeug je Teileinheit angenommen.

Alle Personen, Kontakte und Kfz-Kennzeichen sind **fiktiv**; der
DRK-Kreisverband „${KV}" existiert nicht.

Neu erzeugen mit: \`npm run beispiele:drk-san\` (deterministisch, fester Zufalls-Seed).

| Datei | Teileinheit | Stärke | Fz | Funkkennung (Rotkreuz ${ORT} …) |
|---|---|---|---|---|
${uebersicht.join("\n")}
`,
);

console.log(
  `\nFertig: ${baeuplane.length} Beispielbögen in examples/drk/ (+ README-sanitaetsdienst.md), ` +
    `gesamt ${summe.fuehrer}/${summe.unterfuehrer}/${summe.mannschaft}/${summe.gesamt}`,
);
