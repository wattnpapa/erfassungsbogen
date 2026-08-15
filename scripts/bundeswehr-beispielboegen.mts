/**
 * Erzeugt Beispiel-Erfassungsbögen für Bundeswehr-Einheiten, die bei
 * Katastrophen im Inland (Amtshilfe, Art. 35 GG) zum Einsatz kommen, als JSON
 * nach examples/bundeswehr/. Abgelegt ist nur das Bogen-JSON; die PDF (mit
 * eingebettetem JSON und QR-Code) entsteht erst beim Anklicken in der App aus
 * dem aktuellen Layout.
 *
 * Aufruf (Node ≥ 22): npm run beispiele:bundeswehr
 *
 * RECHERCHESTAND (wichtig für Nachvollziehbarkeit): Ausgangspunkt war eine
 * Rechercheliste mit 20 Bundeswehr-Einheitstypen, die im Katastrophenschutz
 * Amtshilfe leisten (Sanitätsregimenter, ABC-Abwehrtruppe, Pioniertruppe,
 * Hubschraubergeschwader, Feldjäger, Landes-/Bezirks-/Kreisverbindungs­
 * kommandos, SAR-Kommandos, Operatives Führungskommando …). Für die meisten
 * davon (Sanitätsregiment, ABC-Abwehrkompanie, Pionierkompanie,
 * Feldjägerdienstkommando) ist öffentlich zwar die grobe Gliederung
 * dokumentiert (z. B. "Sanitätsregiment: Stab + mehrere Einsatzkompanien +
 * Sanitätsausbildungskompanie"), aber KEINE Funktions-/Rollenliste mit
 * Stärkeangabe je Position — anders als bei der KatS-StAN der Länder oder dem
 * BBK-Rahmenkonzept MTF (scripts/bbk-bundeseinheiten-beispielboegen.mts). Die
 * Bundeswehr veröffentlicht ihre STAN (Stärke- und Ausrüstungsnachweisung)
 * grundsätzlich nicht.
 *
 * Zwei Einheitstypen sind die Ausnahme — für sie ist die Besetzung mit
 * NAMENTLICHEN Funktionsbezeichnungen öffentlich (Wikipedia, mit Einzelnachweis
 * auf bundeswehr.de) belegt und hier abgebildet:
 *
 * 1. KREIS-/BEZIRKSVERBINDUNGSKOMMANDO (KVK/BVK) — Quelle: Wikipedia
 *    "Verbindungskommando" (https://de.wikipedia.org/wiki/Verbindungskommando,
 *    Stand 19.07.2026), beruft sich auf bundeswehr.de "Landeskommando.
 *    Auftrag"/"Landeskommando. Dienststellen":
 *      "Jedes Verbindungskommando umfasst 13 Dienstposten […] Zwei der 13
 *      Dienstposten besetzen Sanitätssoldaten […]"
 *    Namentlich benannt sind daraus VIER Funktionen:
 *      - Leiter = "Beauftragter der Bundeswehr für die Zivil-Militärische
 *        Zusammenarbeit" (BeaBwZMZ), Oberstleutnant d. R. (KVK) bzw.
 *        Oberst d. R. (BVK)
 *      - dessen Stellvertreter (Wikipedia nennt ausdrücklich "Der Leiter des
 *        BVK/KVK und sein Stellvertreter")
 *      - "Beauftragter Sanitätsstabsoffizier für die Zivil-Militärische
 *        Zusammenarbeit im Gesundheitswesen" (SanStOffz ZMZ GesVers),
 *        Oberfeldarzt (KVK) bzw. Oberstarzt d. R. (BVK)
 *      - "Sanitätsfeldwebel — Assistent Führungsmanagement
 *        Gesundheitsversorgung" (SanFw Ass FüMgmt GesVers), Feldwebel bis
 *        Stabsfeldwebel (KVK) bzw. Oberstabsfeldwebel (BVK)
 *    Die übrigen 9 Dienstposten sind laut Quelle "erfahrene Reserveoffiziere
 *    und -unteroffiziere", aber OHNE veröffentlichte Einzel-Funktionstitel.
 *    Um nicht zu erfinden, bildet der Beispielbogen bewusst NUR die vier
 *    belegten Funktionen ab (Ist-Stärke des Bogens: 4) und weist die
 *    dokumentierte Soll-Stärke (10 bei KVK laut osl-online.de/
 *    westerwaldkreis.de, 13 laut Wikipedia/Landeskommando-Quelle — die
 *    Differenz liegt vermutlich daran, dass die eine Quelle den Leiter separat
 *    zählt) im Feld `sonstiges` aus. Das ist inhaltlich ehrlich: Reale KVK
 *    sind laut Westerwaldkreis-Quelle selbst regelmäßig unterbesetzt
 *    ("auf der Suche nach Verstärkung").
 *
 * 2. SAR-KOMMANDO (Heer) Nörvenich/Niederstetten/Holzdorf-Schönewalde —
 *    Quelle: Wikipedia "SAR-Dienst für Luftfahrzeuge in Deutschland"
 *    (https://de.wikipedia.org/wiki/SAR-Dienst_f%C3%BCr_Luftfahrzeuge_in_Deutschland,
 *    Abschnitt "SAR-Bereich Land in Münster" / "Besatzungen"):
 *      "Im Bereich des Heeres werden die SAR-Hubschrauber regulär mit drei
 *      Crew-Mitgliedern besetzt: zwei Hubschrauberführer, einem
 *      Luftrettungsmeister (Rettungsassistent/Notfallsanitäter), zugleich HHO
 *      (Helicopter Hoist Operator)."
 *    Die drei Standorte (Fliegerhorst Nörvenich, Heeresflugplatz
 *    Niederstetten, Fliegerhorst Holzdorf) und die Rufzeichen RESQ41/
 *    RESQ63/RESQ87 stammen aus der Rechercheliste des Nutzers und decken sich
 *    mit den in Presseartikeln genannten Rufzeichen "RESCUE 41/63/87".
 *
 * MODELLIERUNGSENTSCHEIDUNG FUNKRUFNAME: Militärische Rufnamen folgen keinem
 * Landes-Funkrufname-Schema wie bei BOS-Fahrzeugen (Kennwort + Ort + Kennzahl,
 * siehe Funkrufname in src/model.ts). Für die SAR-Hubschrauber wird das Feld
 * dennoch genutzt — mit Kennwort "Rescue" (Freitext, kein BOS-Kennwort aus dem
 * Vokabular) und der öffentlich bekannten Kennzahl (41/63/87) —, weil es dem
 * "<Kennwort> <Ort> <Kennzahl>"-Muster nahekommt und die reale Funkkennung
 * "RESCUE 41" abbildet. Für die KVK/BVK-Bögen wird das Feld NICHT genutzt:
 * Verbindungskommandos sind Stabsdienststellen ohne Kfz-Funkrufname.
 *
 * Luftfahrzeugkennungen (Bundeswehr-Taktisches Kennzeichen, z. B. "84+xx") und
 * alle Personen, Kontakte, Orte sind FIKTIV. Der SAR-Hubschraubertyp H145 LUH
 * SAR und die Standortnamen sind real, die konkrete Kennung ist frei erfunden.
 *
 * Am Ende läuft ein QR-Roundtrip; examples/bundeswehr/README.md bekommt eine
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
const rnd = prng(20260200); // Recherchestand: Februar 2026 (Wikipedia-Quellenstand)

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
  const g = wuerfel(0.3) ? G.W : G.M;
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
    ernaehrung: wuerfel(0.05) ? E.VEGAN : wuerfel(0.15) ? E.VEGETARISCH : E.FLEISCH,
    kontakte: [],
    zusatzqualifikationen: /^(Arzt|SanStOffz)/.test(opt.funktion) ? [{ freitext: "Arzt" }] : [],
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
// Fiktiver Landkreis/Regierungsbezirk und fiktiver Fliegerhorst-Ortsname, wie
// in den anderen Beispielskripten (siehe Kopfkommentar zu Fiktivität).

const KREIS = "Moorwehde";
const BEZIRK = "Moorgau";
const FLIEGERHORST_ORT = "Sandwede";

function hierarchieVerbindungskommando(ebene: "KVK" | "BVK"): HierarchieEbene[] {
  return ebene === "KVK"
    ? [
        { bezeichnung: { freitext: "Kreisverbindungskommando" }, name: `Landkreis ${KREIS}` },
        {
          bezeichnung: { freitext: "übergeordnetes Landeskommando" },
          name: "Landeskommando (fiktiv)",
          telefon: fakeTelefon("0511987650"),
          email: "kvk-moorwehde@bundeswehr.example",
        },
      ]
    : [
        { bezeichnung: { freitext: "Bezirksverbindungskommando" }, name: `Regierungsbezirk ${BEZIRK}` },
        {
          bezeichnung: { freitext: "übergeordnetes Landeskommando" },
          name: "Landeskommando (fiktiv)",
          telefon: fakeTelefon("0511987651"),
          email: "bvk-moorgau@bundeswehr.example",
        },
      ];
}

function hierarchieSar(standort: string): HierarchieEbene[] {
  return [
    { bezeichnung: { freitext: "SAR-Kommando" }, name: standort },
    {
      bezeichnung: { freitext: "unterstelltes Regiment" },
      name: "Transporthubschrauberregiment 30",
      telefon: fakeTelefon("07932987650"),
      email: `sar-${standort.toLowerCase().replace(/[^a-z]/g, "")}@bundeswehr.example`,
    },
    {
      bezeichnung: { freitext: "SAR-Leitstelle" },
      name: "SAR-Leitstelle Münster (RCC Münster)",
    },
  ];
}

// --------------------------------------------------------------- Bogen-Bauplan

interface Bauplan {
  datei: string;
  einheitsTyp: string;
  personal: Person[];
  fahrzeuge: Fahrzeug[];
  hierarchie: HierarchieEbene[];
  einsatzOrt: string;
  sonstiges: string;
}

const EINSATZ_ZEITRAUM = {
  von: datumAusIso("2025-11-10"),
  bis: datumAusIso("2025-11-12"),
} as const;

function bogenAus(plan: Bauplan): Erfassungsbogen {
  return {
    schemaVersion: SCHEMA_VERSION,
    uebung: true, // Beispielbogen: überall als Übung gekennzeichnet (Störer, PDF-Wasserzeichen)
    stand: zeitpunktAusIso("2025-10-15T09:00"),
    einheit: {
      organisation: OrganisationsTyp.BUNDESWEHR,
      einheitsTyp: { freitext: plan.einheitsTyp },
      hierarchie: plan.hierarchie,
    },
    einsatz: {
      zeitraumVon: EINSATZ_ZEITRAUM.von,
      zeitraumBis: EINSATZ_ZEITRAUM.bis,
      ortAuftrag: plan.einsatzOrt,
    },
    personalErfassung: PersonalErfassung.VOLLSTAENDIG,
    personal: plan.personal,
    fahrzeuge: plan.fahrzeuge,
    sofortbedarf: {
      verpflegungPersonen: plan.personal.length,
      dieselLiter: 0,
      benzinLiter: 0,
      gemischLiter: 0,
      unterbringung: false,
      ruhezeitErforderlich: false,
    },
    sonstiges: plan.sonstiges,
  };
}

// ---------------------------------------------------- Verbindungskommandos
// Nur die vier namentlich in der Quelle belegten Funktionen (siehe
// Kopfkommentar); die übrigen Dienstposten sind laut Quelle unbenannt und
// werden deshalb NICHT erfunden.

function verbindungskommando(opt: {
  datei: string;
  ebene: "KVK" | "BVK";
  bezeichnungLang: string;
  dienstgradLeiter: string;
  dienstgradSanOffz: string;
  dienstgradSanFw: string;
  sollGesamt: number;
}): Bauplan {
  const personal = [
    person({
      rolle: R.FUEHRER,
      funktion: `BeaBwZMZ — Beauftragter der Bundeswehr für die Zivil-Militärische Zusammenarbeit (${opt.dienstgradLeiter})`,
      fe: FE.B,
      kontakt: true,
    }),
    person({
      rolle: R.FUEHRER,
      funktion: `stv. BeaBwZMZ — stellvertretender Beauftragter für Zivil-Militärische Zusammenarbeit`,
      fe: FE.B,
    }),
    person({
      rolle: R.FUEHRER,
      funktion: `SanStOffz ZMZ GesVers — Beauftragter Sanitätsstabsoffizier für ZMZ im Gesundheitswesen (${opt.dienstgradSanOffz})`,
      fe: FE.B,
    }),
    person({
      rolle: R.UNTERFUEHRER,
      funktion: `SanFw Ass FüMgmt GesVers — Sanitätsfeldwebel, Assistent Führungsmanagement Gesundheitsversorgung (${opt.dienstgradSanFw})`,
      fe: FE.B,
    }),
  ];
  return {
    datei: opt.datei,
    einheitsTyp: opt.bezeichnungLang,
    personal,
    fahrzeuge: [], // Stabsdienststelle ohne eigene Kfz; Mitglieder fahren privat/Kreis-Pkw an
    hierarchie: hierarchieVerbindungskommando(opt.ebene),
    einsatzOrt:
      `Unwetterlage mit Hochwasser im ${opt.ebene === "KVK" ? `Landkreis ${KREIS}` : `Regierungsbezirk ${BEZIRK}`} — ` +
      "Beratung des zivilen Krisenstabs zu Möglichkeiten und Grenzen der Amtshilfe " +
      "durch die Bundeswehr, Übertragung der zivilen Schadenslage in ein militärisches " +
      "Lagebild, Koordination angeforderter Kräfte mit dem Landeskommando.",
    sonstiges:
      `Quelle (Wikipedia „Verbindungskommando", zitiert bundeswehr.de „Landeskommando. ` +
      `Auftrag/Dienststellen"): Das ${opt.ebene} umfasst insgesamt 13 Dienstposten, davon ` +
      `2 Sanitätssoldaten. Öffentlich mit Funktionstitel benannt sind nur die hier ` +
      `abgebildeten 4 Positionen (Leiter, Stellvertreter, Sanitätsstabsoffizier, ` +
      `Sanitätsfeldwebel); die übrigen ${opt.sollGesamt - 4} Dienstposten („erfahrene ` +
      `Reserveoffiziere und -unteroffiziere") sind ohne veröffentlichten Einzeltitel und ` +
      `daher hier bewusst nicht mit erfundenen Funktionen aufgefüllt. Reale KVK/BVK sind ` +
      `laut Quelle regelmäßig nicht voll besetzt.`,
  };
}

// -------------------------------------------------------------- SAR-Kommandos
// Crew-Zusammensetzung 2 Hubschrauberführer + 1 Luftrettungsmeister (HHO) laut
// Wikipedia „SAR-Dienst für Luftfahrzeuge in Deutschland" (siehe Kopfkommentar).

let luftfahrzeugNr = 1;

function sarHubschrauber(standort: string, zweck: string): Fahrzeug {
  const kennung = `84+${String(10 + (luftfahrzeugNr++)).padStart(2, "0")}`; // fiktiv
  return {
    typ: { freitext: "SAR-Hubschrauber H145 LUH SAR" },
    kennzeichen: kennung,
    stanKonform: true,
    aenderungen: zweck,
  };
}

function sarKommando(opt: { datei: string; standort: string; rufzeichen: number; mitBergrettung?: boolean }): Bauplan {
  const crew = (rolleZusatz: string): Person[] => [
    person({ rolle: R.FUEHRER, funktion: `Hubschrauberführer (Kommandant) ${rolleZusatz}`, fe: FE.B, kontakt: rolleZusatz === "" }),
    person({ rolle: R.FUEHRER, funktion: `Hubschrauberführer (Copilot) ${rolleZusatz}`, fe: FE.B }),
    person({
      rolle: R.UNTERFUEHRER,
      funktion: `Luftrettungsmeister — Rettungsassistent/Notfallsanitäter, zugleich HHO (Helicopter Hoist Operator) ${rolleZusatz}`,
      fe: FE.B,
    }),
  ];
  const personal = [
    ...crew("").map((p) => ({ ...p, funktionen: [{ freitext: p.funktionen[0]!.freitext!.trimEnd() }] })),
    ...(opt.mitBergrettung ? crew("(Bergrettungs-Hubschrauber)") : []),
  ];
  const fahrzeuge = [
    sarHubschrauber(opt.standort, "SAR-Grundausstattung (medizinische Ausrüstung, Rettungswinde)"),
    ...(opt.mitBergrettung
      ? [sarHubschrauber(opt.standort, "zweiter, einsatzbereiter Hubschrauber speziell für Bergrettung — ohne vollständigen SAR-Satz")]
      : []),
  ];
  return {
    datei: opt.datei,
    einheitsTyp: `SAR-Kommando ${opt.standort}`,
    personal,
    fahrzeuge,
    hierarchie: hierarchieSar(opt.standort),
    einsatzOrt:
      `Hochwasserlage — Suche und Rettung eingeschlossener Personen sowie Unterstützung ` +
      `der zivilen Rettungskette bei Evakuierung und Patiententransport aus nicht mehr ` +
      "erreichbaren Ortsteilen; Anforderung über die SAR-Leitstelle Münster im Rahmen " +
      "der dringenden Eilhilfe.",
    sonstiges:
      `Rufzeichen "Rescue ${opt.rufzeichen}" (RESQ${opt.rufzeichen}). Quelle für die ` +
      `Crew-Zusammensetzung: Wikipedia „SAR-Dienst für Luftfahrzeuge in Deutschland" — ` +
      `„Im Bereich des Heeres werden die SAR-Hubschrauber regulär mit drei ` +
      `Crew-Mitgliedern besetzt: zwei Hubschrauberführer, einem Luftrettungsmeister ` +
      `(Rettungsassistent/Notfallsanitäter), zugleich HHO." Luftfahrzeugkennungen sind ` +
      `frei erfunden (Bundeswehr veröffentlicht keine taktischen Kennzeichen für SAR-Zwecke).`,
  };
}

// ------------------------------------------------------------------ Bögen

const baeuplane: Bauplan[] = [
  verbindungskommando({
    datei: "kreisverbindungskommando",
    ebene: "KVK",
    bezeichnungLang: "Kreisverbindungskommando (KVK)",
    dienstgradLeiter: "Oberstleutnant d. R.",
    dienstgradSanOffz: "Oberfeldarzt d. R.",
    dienstgradSanFw: "Stabsfeldwebel d. R.",
    sollGesamt: 13,
  }),
  verbindungskommando({
    datei: "bezirksverbindungskommando",
    ebene: "BVK",
    bezeichnungLang: "Bezirksverbindungskommando (BVK)",
    dienstgradLeiter: "Oberst d. R.",
    dienstgradSanOffz: "Oberstarzt d. R.",
    dienstgradSanFw: "Oberstabsfeldwebel d. R.",
    sollGesamt: 13,
  }),
  sarKommando({ datei: "sar-kommando-noervenich", standort: "Nörvenich", rufzeichen: 41 }),
  sarKommando({ datei: "sar-kommando-niederstetten", standort: "Niederstetten", rufzeichen: 63, mitBergrettung: true }),
  sarKommando({ datei: "sar-kommando-holzdorf-schoenewalde", standort: "Holzdorf/Schönewalde", rufzeichen: 87 }),
];

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
  for (const plan of baeuplane) {
    if (dateien.has(plan.datei)) fehler.push(`Dateiname doppelt: ${plan.datei}`);
    dateien.add(plan.datei);
    if (einheitsTypen.has(plan.einheitsTyp)) fehler.push(`Einheitstyp doppelt: ${plan.einheitsTyp}`);
    einheitsTypen.add(plan.einheitsTyp);
    if (!plan.personal[0]?.kontakte.length) fehler.push(`${plan.datei}: erste Person (Ansprechpartner) ohne Kontakt`);
    for (const f of plan.fahrzeuge) {
      const kz = f.kennzeichen!;
      if (kennzeichen.has(kz)) fehler.push(`Kennzeichen doppelt: ${kz}`);
      kennzeichen.add(kz);
    }
  }
  if (fehler.length > 0) throw new Error(`Selbstprüfung fehlgeschlagen:\n  ${fehler.join("\n  ")}`);
}

// ---------------------------------------------------------------- Hauptlauf

pruefen();

const ausgabe = join(wurzel, "examples", "bundeswehr");
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
    `| ${plan.datei} | ${plan.einheitsTyp} | ${s.fuehrer}/${s.unterfuehrer}/${s.mannschaft}/${s.gesamt} | ${bogen.fahrzeuge.length} |`,
  );
  console.log(`✓ ${plan.datei} (${s.fuehrer}/${s.unterfuehrer}/${s.mannschaft}/${s.gesamt}, ${qr.segmentiert ? `${qr.teile.length} QR-Teile` : "1 QR"})`);
}

writeFileSync(
  join(ausgabe, "README.md"),
  `# Beispiel-Erfassungsbögen — Bundeswehr im Katastropheneinsatz (Amtshilfe)

${baeuplane.length} Beispielbögen für Bundeswehr-Einheiten, die bei Katastrophen im
Inland Amtshilfe leisten (Art. 35 GG).

**Recherchestand:** Für die meisten angefragten Einheitstypen (Sanitätsregiment,
ABC-Abwehrkompanie, Pionierkompanie, Feldjägerdienstkommando, Hubschrauber­
geschwader …) veröffentlicht die Bundeswehr keine STAN (Stärke- und
Ausrüstungsnachweisung) mit Funktions-/Rollenliste — anders als bei den
KatS-Landesverordnungen oder dem BBK-Rahmenkonzept MTF
(siehe scripts/bbk-bundeseinheiten-beispielboegen.mts). Nur für zwei Typen ist
die Besetzung mit namentlichen Funktionsbezeichnungen öffentlich (Wikipedia,
mit Einzelnachweis auf bundeswehr.de) belegt:

- **Kreis-/Bezirksverbindungskommando (KVK/BVK):** 13 Dienstposten laut Quelle,
  davon 4 mit veröffentlichtem Funktionstitel (Leiter/BeaBwZMZ, Stellvertreter,
  Sanitätsstabsoffizier, Sanitätsfeldwebel) — nur diese vier sind hier
  abgebildet, um nichts zu erfinden.
- **SAR-Kommando (Heer) Nörvenich/Niederstetten/Holzdorf-Schönewalde:**
  Hubschrauber-Crew mit 2 Hubschrauberführern + 1 Luftrettungsmeister (HHO).

Quellen: [Wikipedia „Verbindungskommando"](https://de.wikipedia.org/wiki/Verbindungskommando),
[Wikipedia „SAR-Dienst für Luftfahrzeuge in Deutschland"](https://de.wikipedia.org/wiki/SAR-Dienst_f%C3%BCr_Luftfahrzeuge_in_Deutschland).

**Anders als die KatS-StAN der Länder oder das BBK-Rahmenkonzept MTF ist hier
KEINE vollständige Personalstärke je Einheit dokumentiert** — die Bögen bilden
bewusst nur die öffentlich belegten Funktionen ab (siehe Kopfkommentar im
Generator-Skript für Details je Einheitstyp). Die Beispielbögen liegen flach
hier (kein Bundesland-Unterordner, da Bundeswehr-Organisation) und erscheinen
NICHT in der Landesvorlagen-Auswahl, sondern nur in der
Beispielbögen-Übersicht der App — wie die BBK-, THW- und DLRG-Beispiele.

Alle Personen, Kontakte und Luftfahrzeugkennungen sind **fiktiv**.

Neu erzeugen mit: \`npm run beispiele:bundeswehr\` (deterministisch, fester Zufalls-Seed).

| Datei | Einheit | Stärke | Fahrzeuge |
|---|---|---|---|
${uebersicht.join("\n")}
`,
);

console.log(`\nFertig: ${baeuplane.length} Beispielbögen in examples/bundeswehr/ (+ README.md)`);
