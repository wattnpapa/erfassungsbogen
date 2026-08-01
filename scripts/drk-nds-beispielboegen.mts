/**
 * Erzeugt Beispiel-Erfassungsbögen einer DRK-Bereitschaft in Niedersachsen als
 * JSON nach examples/drk/niedersachsen/ — je Teileinheit ein Bogen. Abgelegt ist
 * nur das Bogen-JSON; die PDF (mit eingebettetem JSON und QR-Code) entsteht erst
 * beim Anklicken in der App aus dem aktuellen Layout.
 *
 * Aufruf (Node ≥ 22): npm run beispiele:drk-nds
 *
 * Grundlage: die „Einsatzhandakte" einer DRK-Bereitschaft in Niedersachsen
 * (Stand 03/25) — die Aufstellung, mit der eine Bereitschaft der Leitstelle bzw.
 * dem Meldekopf ihre Teileinheiten meldet. Sie führt je Teileinheit Fahrzeug,
 * Funkkennung, Meldeweg („Gemeldet": KatS-gemeldet, hauptamtlich besetzt oder
 * Eigenvorhaltung) und Stärke:
 *
 *   Einheitsführung                 KDOW          ..-10-1   1/1/0/2
 *   Sanitäts- und Betreuungsgruppe  GW-Sanität    ..-96-1   1/1/4/6   (1. SanGr)
 *                                   BT-Kombi      ..-16-1   0/1/8/9   (1. BtGr)
 *                                   MTW           ..-17-2   0/1/8/9   (2. BtGr)
 *   Gruppe Information & Kommunik.  ELO/ELW       ..-19-1   1/0/2/3
 *   Verpflegungsgruppe              MTW + 3 Anh.  ..-17-1   0/1/8/9
 *   Gruppe Technik & Sicherheit     GW-Logistik   ..-64-1   0/1/2/3
 *   Rettungsdienst                  RTW/N-KTW/KTW ..-8x/9x  je 0/1/1/2
 *
 * Träger, Standort und die örtliche OPTA-Kennung sind bewusst **nicht** die des
 * Verbandes, dessen Handakte hier Pate stand: die Bögen laufen auf einen
 * erfundenen DRK-Kreisverband. Abgebildet ist damit die Gliederung, nicht die
 * Aufstellung eines bestimmten Vereins.
 *
 * Anders als die KatS-StAN der Länder (scripts/kats-*-beispielboegen.mts) ist das
 * keine landesrechtliche Stärkevorgabe, sondern die Verbandsgliederung des DRK.
 * Sie steht deshalb in einem eigenen Bereich `drk` unter dem Bundesland — in der
 * Landesvorlagen-Auswahl erscheint sie als eigene Gruppe neben KatS und FwVO
 * (siehe src/vokabulare/landesvorlagen.ts).
 *
 * Alle Personen, Kontakte, Kfz-Kennzeichen und Ortsangaben sind **fiktiv**. Die
 * Funkrufnamen folgen dem OPTA-Schema Niedersachsen (Kennwort „Rotkreuz"):
 * örtliche Kennung frei erfunden, Fahrzeug- und Ordnungskennung nach Anlage 2
 * des Erlasses — sie tragen den Fahrzeugtyp und sind deshalb die eigentliche
 * Aussage. Genauso halten es die KatS-Beispielbögen der Länder.
 *
 * Am Ende läuft ein QR-Roundtrip; examples/drk/niedersachsen/README.md bekommt
 * eine Übersichtstabelle.
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
const rnd = prng(20250301); // Stand der Einsatzhandakte: 03/25

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
// Nordwestdeutsch gefärbt, damit die Beispiele zur Region passen.

const VORNAMEN_M = [
  "Ansgar", "Bernd", "Christoph", "Dirk", "Enno", "Fabian", "Focke", "Gerrit",
  "Hauke", "Heiko", "Hinrich", "Jann", "Jens", "Johann", "Kai", "Lars",
  "Malte", "Marten", "Menno", "Nils", "Ole", "Onno", "Reent", "Sönke",
  "Tammo", "Thees", "Tjark", "Torben", "Ubbo", "Wilko",
] as const;
const VORNAMEN_W = [
  "Alke", "Anke", "Antje", "Britta", "Frauke", "Gesa", "Heike", "Imke",
  "Insa", "Janna", "Katja", "Maike", "Meike", "Nele", "Rieke", "Silke",
  "Swantje", "Tanja", "Wiebke",
] as const;
const NACHNAMEN = [
  "Ahlers", "Bohlen", "Bruns", "Cordes", "Dierks", "Dreesmann", "Eilers",
  "Focken", "Gerdes", "Groenewold", "Harms", "Hayen", "Hinrichs", "Janßen",
  "Klaassen", "Kramer", "Lammers", "Lüken", "Meyer", "Onken", "Poppen",
  "Renken", "Saathoff", "Tammen", "Ubben", "Wilkens", "Wübben",
] as const;

/** Querschnittsqualifikationen, die in jedem Fachdienst vorkommen. */
const QUALI_ALLGEMEIN = [
  "Sprechfunker (BOS-Digitalfunk)",
  "Sanitätshelfer (San A/B)",
  "Ausbilder Erste Hilfe",
  "Truppführer",
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
  const g = wuerfel(0.35) ? G.W : G.M; // Betreuungs-/Sanitätsdienst: hoher Frauenanteil
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
    ernaehrung: gewichtet<E>([[E.FLEISCH, 74], [E.VEGETARISCH, 19], [E.VEGAN, 7]]),
    kontakte: [],
    zusatzqualifikationen: quali.map((freitext) => ({ freitext })),
  };
  if (opt.kontakt) {
    p.kontakte.push({
      art: KontaktArt.MOBIL,
      dienstlich: false,
      wert: fakeTelefon(`01${ganz(5, 7)}${ganz(1, 9)}${String(ganz(0, 9999999)).padStart(7, "0")}`),
    });
  }
  return p;
}

// ------------------------------------------------------------------ Standort
// DRK-Gliederung: eigene Teileinheit → Bereitschaft → Kreisverband → Landesverband.
// Träger und Standort sind erfunden (siehe Kopfkommentar): „Moorlande" ist keine
// niedersächsische Gemeinde und der Kreisverband gleichen Namens existiert nicht.

const ORT = "Moorlande";
const KV = `${ORT} e. V.`;
const LV = "Niedersachsen";
/** Fiktive örtliche OPTA-Kennung; Fahrzeugkennung und Ordnungszahl folgen Anlage 2. */
const OPTA_ORT = 87;

function hierarchie(teileinheit: string): HierarchieEbene[] {
  return [
    { bezeichnung: { freitext: teileinheit }, name: ORT },
    { bezeichnung: { freitext: "Bereitschaft" }, name: ORT },
    {
      bezeichnung: { code: 2 }, // DRK_HIERARCHIE_EBENEN: 2 = Kreisverband
      name: KV,
      kurz: `KV ${ORT}`,
      telefon: fakeTelefon("04411234560"),
      email: "einsatz@drk-moorlande.example",
    },
    { bezeichnung: { code: 3 }, name: LV }, // 3 = Landesverband
  ];
}

// ------------------------------------------------------------ Fahrzeug-Fabrik

interface FzSpec {
  typ: string;
  kennzeichen: string;
  /**
   * Fahrzeugkennung nach Anlage 2 und Ordnungszahl, z. B. GW-San = [96, 1].
   * Die örtliche Kennung davor setzt fahrzeug() aus OPTA_ORT. Anhänger tragen
   * keinen eigenen Funkrufnamen.
   */
  teile?: [number, number];
  /** Zweck und Meldeweg („Gemeldet"-Spalte der Einsatzhandakte). */
  aenderungen: string;
}

function fahrzeug(spec: FzSpec): Fahrzeug {
  const f: Fahrzeug = {
    typ: { freitext: spec.typ },
    kennzeichen: spec.kennzeichen,
    stanKonform: true,
    aenderungen: spec.aenderungen,
  };
  if (spec.teile) {
    f.funkrufname = {
      kennwort: { code: 3 }, // Rotkreuz (DRK)
      eigenerStandort: false,
      ort: ORT,
      teile: [OPTA_ORT, ...spec.teile],
    };
  }
  return f;
}

// --------------------------------------------------------------- Bogen-Bauplan

interface Bauplan {
  datei: string;
  einheitsTyp: string;
  personal: Person[];
  fahrzeuge: Fahrzeug[];
  sonstiges?: string;
  /** Kraftstoff abweichend vom Standard (60 l Diesel je motorisiertem Fahrzeug). */
  dieselExtra?: number;
}

const EINSATZ = {
  von: datumAusIso("2025-03-22"),
  bis: datumAusIso("2025-03-23"),
  ort:
    `Bombenfund im Stadtteil ${ORT}-Süd — Evakuierung von rund 1.500 Anwohnenden: ` +
    "Betreuungsstelle in der Sporthalle, sanitätsdienstliche Versorgung und " +
    "Transport nicht gehfähiger Personen; Bereitstellungsraum am DRK-Haus.",
} as const;

function bogenAus(plan: Bauplan): Erfassungsbogen {
  const motorisiert = plan.fahrzeuge.filter((f) => !/^anh\./i.test(f.typ.freitext ?? "")).length;
  return {
    schemaVersion: SCHEMA_VERSION,
    uebung: true, // Beispielbogen: überall als Übung gekennzeichnet (Störer, PDF-Wasserzeichen)
    stand: zeitpunktAusIso("2025-03-14T18:30"), // Stand der Einsatzhandakte: 03/25
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
      dieselLiter: 60 * motorisiert + (plan.dieselExtra ?? 0),
      benzinLiter: 0,
      gemischLiter: 0,
      unterbringung: true,
      ruhezeitErforderlich: true,
    },
    sonstiges: plan.sonstiges,
  };
}

// --------------------------------------------------------- Die acht Teileinheiten

const baeuplane: Bauplan[] = [
  // 1 — Einheitsführung (KDOW 40-10-1) 1/1/0/2
  {
    datei: "bereitschaft-einheitsfuehrung-kdow",
    einheitsTyp: "Einheitsführung (Bereitschaft)",
    personal: [
      person({ rolle: R.FUEHRER, funktionen: ["Bereitschaftsleitung"], fe: FE.B, kontakt: true, quali: ["Zugführer (DRK)", "Verbandführer"] }),
      person({ rolle: R.UNTERFUEHRER, funktionen: ["Führungsassistenz", "Kraftfahrer/-in"], fe: FE.C1, kontakt: true, quali: ["Gruppenführer (DRK)"] }),
    ],
    fahrzeuge: [
      fahrzeug({ typ: "KdoW", kennzeichen: "MRL-RK 101", teile: [10, 1], aenderungen: "Kommandowagen der Einheitsführung — Eigenvorhaltung" }),
    ],
    sonstiges: "Führt die Bereitschaft; stellt bei größeren Lagen den Verbindungsdienst zum Meldekopf.",
  },
  // 2 — 1. Sanitätsgruppe (GW-Sanität 40-96-1, KatS) 1/1/4/6
  {
    datei: "bereitschaft-sanitaetsgruppe-gw-san",
    einheitsTyp: "Sanitätsgruppe (Bereitschaft)",
    personal: [
      person({ rolle: R.FUEHRER, funktionen: ["Gruppenführer/-in"], fe: FE.C1, kontakt: true, quali: ["Gruppenführer (DRK)", "Rettungssanitäter"] }),
      person({ rolle: R.UNTERFUEHRER, funktionen: ["Ärztin/Arzt"], fe: FE.B, kontakt: true, quali: ["Notarzt"] }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Rettungssanitäter/-in"], fe: FE.C1, quali: ["Rettungssanitäter"] }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Rettungssanitäter/-in"], fe: FE.B, quali: ["Rettungssanitäter"] }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Sanitätshelfer/-in"], fe: FE.B }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Sanitätshelfer/-in", "Kraftfahrer/-in"], fe: FE.C1 }),
    ],
    fahrzeuge: [
      fahrzeug({ typ: "GW-San", kennzeichen: "MRL-RK 961", teile: [96, 1], aenderungen: "Gerätewagen Sanitätsdienst, Ausstattung für 25 Verletzte — KatS-gemeldet (1. Sanitätsgruppe)" }),
    ],
    sonstiges: "1. Sanitätsgruppe der Bereitschaft; arbeitet mit dem BT-Kombi der 1. Betreuungsgruppe zusammen.",
  },
  // 3 — 1. Betreuungsgruppe (BT-Kombi 40-16-1, KatS) 0/1/8/9
  {
    datei: "bereitschaft-betreuungsgruppe-bt-kombi",
    einheitsTyp: "Betreuungsgruppe (Bereitschaft, BT-Kombi)",
    personal: [
      person({ rolle: R.UNTERFUEHRER, funktionen: ["Gruppenführer/-in"], fe: FE.C1, kontakt: true, quali: ["Gruppenführer (DRK)", "Betreuungshelfer"] }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Betreuungshelfer/-in"], fe: FE.B, quali: ["Betreuungshelfer"] }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Betreuungshelfer/-in"], fe: FE.B, quali: ["Betreuungshelfer"] }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Betreuungshelfer/-in"], fe: FE.NONE, quali: ["Betreuungshelfer"] }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Betreuungshelfer/-in"], fe: FE.NONE }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Betreuungshelfer/-in", "Kinderbetreuung"], fe: FE.B }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Sanitätshelfer/-in"], fe: FE.B, quali: ["Sanitätshelfer (San A/B)"] }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Fachkraft PSNV"], fe: FE.B, quali: ["PSNV-E (Betroffene)"] }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Kraftfahrer/-in"], fe: FE.C1, quali: ["Kraftfahrer C1"] }),
    ],
    fahrzeuge: [
      fahrzeug({ typ: "BT-Kombi", kennzeichen: "MRL-RK 161", teile: [16, 1], aenderungen: "Kombifahrzeug Betreuung/Sanität, Betreuungssatz 50 Personen — KatS-gemeldet (1. Betreuungsgruppe / 1. Sanitätsgruppe)" }),
    ],
    sonstiges: "Der BT-Kombi wird laut Einsatzhandakte von der 1. Betreuungsgruppe und der 1. Sanitätsgruppe genutzt.",
  },
  // 4 — 2. Betreuungsgruppe (MTW 40-17-2, hauptamtlich) 0/1/8/9
  {
    datei: "bereitschaft-betreuungsgruppe-mtw",
    einheitsTyp: "Betreuungsgruppe (Bereitschaft, MTW)",
    personal: [
      person({ rolle: R.UNTERFUEHRER, funktionen: ["Gruppenführer/-in"], fe: FE.C1, kontakt: true, quali: ["Gruppenführer (DRK)"] }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Betreuungshelfer/-in"], fe: FE.B, quali: ["Betreuungshelfer"] }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Betreuungshelfer/-in"], fe: FE.B, quali: ["Betreuungshelfer"] }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Betreuungshelfer/-in"], fe: FE.NONE, quali: ["Betreuungshelfer"] }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Betreuungshelfer/-in"], fe: FE.NONE }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Betreuungshelfer/-in"], fe: FE.B }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Betreuungshelfer/-in", "Materialerhaltung"], fe: FE.BE }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Sanitätshelfer/-in"], fe: FE.B, quali: ["Sanitätshelfer (San A/B)"] }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Kraftfahrer/-in"], fe: FE.C1, quali: ["Kraftfahrer C1"] }),
    ],
    fahrzeuge: [
      fahrzeug({ typ: "MTW", kennzeichen: "MRL-RK 172", teile: [17, 2], aenderungen: "Mannschaftstransportwagen — hauptamtlich besetzt (2. Betreuungsgruppe)" }),
    ],
  },
  // 5 — Gruppe Information & Kommunikation (ELO/ELW 40-19-1) 1/0/2/3
  {
    datei: "bereitschaft-gruppe-iuk-elw",
    einheitsTyp: "Gruppe Information und Kommunikation (IuK)",
    personal: [
      person({ rolle: R.FUEHRER, funktionen: ["Fachdienstleitung IuK"], fe: FE.B, kontakt: true, quali: ["Zugführer (DRK)", "Sprechfunker (BOS-Digitalfunk)"] }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Fernmelder/-in"], fe: FE.B, quali: ["Sprechfunker (BOS-Digitalfunk)"] }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Fernmelder/-in", "Kraftfahrer/-in"], fe: FE.C1, quali: ["Sprechfunker (BOS-Digitalfunk)"] }),
    ],
    fahrzeuge: [
      fahrzeug({ typ: "ELW 1", kennzeichen: "MRL-RK 191", teile: [19, 1], aenderungen: "ELO/ELW — Führungs- und Fernmeldeausstattung, Eigenvorhaltung (Schwerpunkt Großveranstaltungen)" }),
    ],
    sonstiges: "Laut Einsatzhandakte vorrangig für Großveranstaltungen vorgehalten.",
  },
  // 6 — Verpflegungsgruppe (MTW 40-17-1, KatS + 3 Anhänger) 0/1/8/9
  {
    datei: "bereitschaft-verpflegungsgruppe",
    einheitsTyp: "Verpflegungsgruppe (Bereitschaft)",
    personal: [
      person({ rolle: R.UNTERFUEHRER, funktionen: ["Gruppenführer/-in", "Küchenleitung"], fe: FE.BE, kontakt: true, quali: ["Gruppenführer (DRK)", "Koch (Beruf)"] }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Koch/Köchin"], fe: FE.B, quali: ["Koch (Beruf)"] }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Verpflegungshelfer/-in"], fe: FE.B, quali: ["Belehrung Infektionsschutzgesetz"] }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Verpflegungshelfer/-in"], fe: FE.B, quali: ["Belehrung Infektionsschutzgesetz"] }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Verpflegungshelfer/-in"], fe: FE.NONE, quali: ["Belehrung Infektionsschutzgesetz"] }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Verpflegungshelfer/-in"], fe: FE.NONE }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Verpflegungshelfer/-in"], fe: FE.B }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Verpflegungshelfer/-in", "Materialerhaltung"], fe: FE.BE }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Kraftfahrer/-in"], fe: FE.CE, quali: ["Kraftfahrer CE"] }),
    ],
    fahrzeuge: [
      fahrzeug({ typ: "MTW", kennzeichen: "MRL-RK 171", teile: [17, 1], aenderungen: "Zugfahrzeug der Verpflegungsgruppe — KatS-gemeldet (1. Verpflegungsgruppe)" }),
      fahrzeug({ typ: "Anh. Verpflegung", kennzeichen: "MRL-RK 173", aenderungen: "Erstangriff Verpflegung für 150 Personen (Brände/Evakuierungen)" }),
      fahrzeug({ typ: "Anh. Feldküche", kennzeichen: "MRL-RK 174", aenderungen: "Feldkochherd für ca. 300–500 Mahlzeiten" }),
      fahrzeug({ typ: "Anh. Kühl", kennzeichen: "MRL-RK 175", aenderungen: "Kühlanhänger — kein Tiefkühler" }),
    ],
    dieselExtra: 80, // Feldkochherd und Kühlanhänger laufen über Aggregat/Brenner
    sonstiges:
      "Erstangriff für 150 Personen aus dem Verpflegungsanhänger; mit Feldküche " +
      "ca. 300–500 Mahlzeiten. Der Kühlanhänger kühlt nur, er friert nicht ein.",
  },
  // 7 — Gruppe Technik & Sicherheit (GW-Logistik 40-64-1, KatS + Anh. NEA) 0/1/2/3
  {
    datei: "bereitschaft-gruppe-technik-und-sicherheit",
    einheitsTyp: "Gruppe Technik und Sicherheit",
    personal: [
      person({ rolle: R.UNTERFUEHRER, funktionen: ["Gruppenführer/-in"], fe: FE.CE, kontakt: true, quali: ["Gruppenführer (DRK)", "Fachdienst Technik und Sicherheit"] }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Fachhelfer/-in Technik"], fe: FE.BE, quali: ["Elektrofachkraft"] }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Fachhelfer/-in Technik", "Kraftfahrer/-in"], fe: FE.CE, quali: ["Kraftfahrer CE"] }),
    ],
    fahrzeuge: [
      fahrzeug({ typ: "GW-Logistik", kennzeichen: "MRL-RK 641", teile: [64, 1], aenderungen: "Gerätewagen Logistik mit Ladebordwand — KatS-gemeldet, wird gemeinsam mit der Verpflegungsgruppe genutzt" }),
      fahrzeug({ typ: "Anh. NEA 60 kVA", kennzeichen: "MRL-RK 642", aenderungen: "Netzersatzanlage 60 kVA auf Anhänger" }),
    ],
    dieselExtra: 200, // Netzersatzanlage 60 kVA
    sonstiges: "Der GW-Logistik wird laut Einsatzhandakte zusammen mit der Verpflegungsgruppe eingesetzt.",
  },
  // 8 — Rettungsdienst (RTW/N-KTW/KTW), je Fahrzeug 0/1/1/2 → 0/4/4/8
  {
    datei: "bereitschaft-rettungsdienst-rtw-ktw",
    einheitsTyp: "Rettungsdienst (RTW/KTW)",
    personal: [
      person({ rolle: R.UNTERFUEHRER, funktionen: ["Transportführer/-in RTW"], fe: FE.C1, kontakt: true, quali: ["Notfallsanitäter"] }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Rettungssanitäter/-in"], fe: FE.C1, quali: ["Rettungssanitäter"] }),
      person({ rolle: R.UNTERFUEHRER, funktionen: ["Transportführer/-in N-KTW"], fe: FE.C1, quali: ["Rettungssanitäter"] }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Rettungshelfer/-in"], fe: FE.C1, quali: ["Rettungshelfer"] }),
      person({ rolle: R.UNTERFUEHRER, funktionen: ["Transportführer/-in N-KTW"], fe: FE.C1, quali: ["Rettungssanitäter"] }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Rettungshelfer/-in"], fe: FE.C1, quali: ["Rettungshelfer"] }),
      person({ rolle: R.UNTERFUEHRER, funktionen: ["Transportführer/-in KTW"], fe: FE.C1, quali: ["Rettungssanitäter"] }),
      person({ rolle: R.MANNSCHAFT, funktionen: ["Rettungshelfer/-in"], fe: FE.C1, quali: ["Rettungshelfer"] }),
    ],
    fahrzeuge: [
      fahrzeug({ typ: "RTW", kennzeichen: "MRL-RK 831", teile: [83, 1], aenderungen: "Rettungswagen — Eigenvorhaltung, Besatzung 0/1/1/2" }),
      fahrzeug({ typ: "N-KTW (Allrad)", kennzeichen: "MRL-RK 932", teile: [93, 2], aenderungen: "Notfall-Krankentransportwagen Allrad — KatS-gemeldet, Besatzung 0/1/1/2" }),
      fahrzeug({ typ: "N-KTW", kennzeichen: "MRL-RK 931", teile: [93, 1], aenderungen: "Notfall-Krankentransportwagen — hauptamtlich besetzt, Besatzung 0/1/1/2" }),
      fahrzeug({ typ: "KTW", kennzeichen: "MRL-RK 921", teile: [92, 1], aenderungen: "Krankentransportwagen — Eigenvorhaltung, Besatzung 0/1/1/2" }),
    ],
    sonstiges:
      "Vier Transporteinheiten zu je 0/1/1/2 (RTW, N-KTW Allrad, N-KTW, KTW). " +
      "Die Fahrzeuge werden einzeln disponiert und lassen sich auch getrennt abrufen.",
  },
];

// Soll-Stärken aus der Einsatzhandakte zur Selbstprüfung (F/U/M/Gesamt).
const SOLL: Record<string, Staerke> = {
  "bereitschaft-einheitsfuehrung-kdow": { fuehrer: 1, unterfuehrer: 1, mannschaft: 0, gesamt: 2 },
  "bereitschaft-sanitaetsgruppe-gw-san": { fuehrer: 1, unterfuehrer: 1, mannschaft: 4, gesamt: 6 },
  "bereitschaft-betreuungsgruppe-bt-kombi": { fuehrer: 0, unterfuehrer: 1, mannschaft: 8, gesamt: 9 },
  "bereitschaft-betreuungsgruppe-mtw": { fuehrer: 0, unterfuehrer: 1, mannschaft: 8, gesamt: 9 },
  "bereitschaft-gruppe-iuk-elw": { fuehrer: 1, unterfuehrer: 0, mannschaft: 2, gesamt: 3 },
  "bereitschaft-verpflegungsgruppe": { fuehrer: 0, unterfuehrer: 1, mannschaft: 8, gesamt: 9 },
  "bereitschaft-gruppe-technik-und-sicherheit": { fuehrer: 0, unterfuehrer: 1, mannschaft: 2, gesamt: 3 },
  "bereitschaft-rettungsdienst-rtw-ktw": { fuehrer: 0, unterfuehrer: 4, mannschaft: 4, gesamt: 8 },
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
    // Der Landesvorlagen-Katalog schlüsselt über (Organisation, Bundesland,
    // Einheitstyp) — ein doppelter Einheitstyp ließe eine Vorlage verschwinden.
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

const ausgabe = join(wurzel, "examples", "drk", "niedersachsen");
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
  `# Beispiel-Erfassungsbögen — DRK-Bereitschaft Niedersachsen

${baeuplane.length} Beispiel-Einheiten nach der „Einsatzhandakte" einer
DRK-Bereitschaft in Niedersachsen (Stand 03/25) — der Aufstellung, mit der eine
Bereitschaft ihre Teileinheiten mit Fahrzeug, Funkkennung, Meldeweg und Stärke
meldet. Je Teileinheit ein Bogen; zusammen ergeben sie die Bereitschaft mit
${summe.fuehrer}/${summe.unterfuehrer}/${summe.mannschaft}/${summe.gesamt}.

Anders als die KatS-StAN der Länder ist das keine landesrechtliche
Stärkevorgabe, sondern die Verbandsgliederung des DRK. In der
Landesvorlagen-Auswahl (Schritt 1) erscheinen die Einheiten deshalb unter
Niedersachsen als eigene Gruppe „DRK-Bereitschaft" neben Katastrophenschutz und
Feuerwehrverordnung.

**Träger und Standort sind erfunden:** Die Bögen laufen auf einen
DRK-Kreisverband ${KV} — den gibt es so wenig wie die Gemeinde ${ORT}.
Abgebildet ist die Gliederung, nicht die Aufstellung eines bestimmten Vereins.
Personen, Kontakte und Kfz-Kennzeichen sind ebenfalls **fiktiv**.

Die Funkrufnamen folgen dem OPTA-Schema Niedersachsen mit dem Kennwort
„Rotkreuz": die örtliche Kennung (${OPTA_ORT}) ist frei erfunden, Fahrzeug- und
Ordnungskennung entsprechen Anlage 2 des Erlasses — sie tragen den Fahrzeugtyp
und sind damit die eigentliche Aussage. Genauso halten es die
KatS-Beispielbögen der Länder.

Neu erzeugen mit: \`npm run beispiele:drk-nds\` (deterministisch, fester Zufalls-Seed).

| Datei | Teileinheit | Stärke | Fz | Funkkennung (Rotkreuz ${ORT} …) |
|---|---|---|---|---|
${uebersicht.join("\n")}
`,
);

console.log(
  `\nFertig: ${baeuplane.length} Beispielbögen in examples/drk/niedersachsen/ (+ README.md), ` +
    `Bereitschaft gesamt ${summe.fuehrer}/${summe.unterfuehrer}/${summe.mannschaft}/${summe.gesamt}`,
);
