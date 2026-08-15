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
 * PIONIERTRUPPE (Panzerpionierzug, Schwimmbrückenzug M3, Pioniermaschinenzug)
 * — Ergänzung vom 15.08.2026, auf Nutzerwunsch ("Hochwassereinsätze/
 * Katastrophenschutz"). Anders als bei KVK/BVK und SAR-Kommando gibt es für
 * die Pioniertruppe KEINE öffentlich belegte Dienstposten-/Funktionsliste des
 * ganzen Zuges — nur einzelne, für sich genommen belegte Eckdaten:
 *   - Panzerpionierzug: bundeswehr.de "Zugführer eines Pionierzuges"
 *     (https://www.bundeswehr.de/de/auftrag/einsaetze/missionen/ich-bin-im-einsatz/efp-zugfuehrer-pioniere-5787548),
 *     Zitat: "Meine 43 Soldatinnen und Soldaten stellen unter meiner Führung
 *     die Pionierunterstützung für die erste Kampfkompanie sicher." Gerät
 *     laut selber Quelle: Transportpanzer Fuchs, Pionierpanzer Dachs,
 *     Brückenlegepanzer Leguan, Minenverlegesystem 85, Walzen-/Radlader.
 *     Die Aufteilung der 43 Dienstposten auf Zugtrupp/Gruppen ist NICHT
 *     Teil der Quelle und daher hier eine plausible, aber erfundene
 *     Strukturskizze (Zugführer, Zugtruppführer + Kraftfahrer, 3 Gruppen)
 *     — siehe `sonstiges` im Bogen für den expliziten Hinweis.
 *   - Schwimmbrückenzug (M3): bundeswehr.de "Schwimmschnellbrücke Amphibie
 *     M3" (https://www.bundeswehr.de/de/ausruestung-technik-bundeswehr/landsysteme-bundeswehr/schwimmschnellbruecke-amphibie-m3),
 *     Zitat: "Mit nur drei Mann Besatzung wird aus der schwimmenden Amphibie
 *     ein Teil einer Schwimmbrücke oder Fähre" (Funktionen: Landfahrer,
 *     Wasserfahrer, Schwimmbrückenpionier) und "Eine 100 Meter lange
 *     Schwimmbrücke wird mit acht Amphibien in weniger als 20 Minuten
 *     gebaut." → 8 Fahrzeuge × 3 Besatzung = 24 Personen, quellenscharf.
 *     Nur die Zugführung (1 Person) ist strukturell ergänzt, nicht
 *     einzelquellenbelegt. Das M3-Fahrzeug wird laut Quelle für "Rad- und
 *     Kettenfahrzeugen einen schnellen Übergang über mittlere bis breite
 *     Gewässer" eingesetzt — Hochwasser wird auf der Seite nicht wörtlich
 *     genannt, ist aber ein Standardanwendungsfall für Fährbetrieb bei
 *     überfluteten Straßen/Brücken.
 *   - Pioniermaschinenzug: Wikipedia "Panzerpioniere (Bundeswehr)" nennt für
 *     die 4. Kompanie (Pioniermaschinenkompanie) eines Panzerpionier­
 *     bataillons u. a. einen "Pioniermaschinenzug mit ungepanzerten
 *     Erdbaumaschinen wie Baggern und Radladern" sowie einen
 *     Faltfestbrückenzug — ohne Personalstärke. Die hier verwendete
 *     Zugstärke (24) ist NICHT quellenbelegt, sondern eine grobe Schätzung
 *     in der Größenordnung der beiden anderen (sourced) Pionierzüge; das
 *     steht ausdrücklich in `sonstiges`.
 * Alle drei Bögen bilden — wie KVK/BVK/SAR — die REALE Stehende-Struktur
 * fiktiv in der Hochwasserlage Moorwehde/Moorgau ab (Bataillonsbezeichnung
 * "Panzerpionierbataillon 700" ist frei erfunden, um keine reale
 * Truppenteil-Nummer mit erfundenem Personal zu verknüpfen).
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

const PIONIERBATAILLON = "Panzerpionierbataillon 700 (fiktiv)"; // frei erfunden, s. Kopfkommentar

function hierarchiePionier(kompanie: string): HierarchieEbene[] {
  return [
    { bezeichnung: { freitext: "Zug" }, name: kompanie },
    {
      bezeichnung: { freitext: "Panzerpionierbataillon" },
      name: PIONIERBATAILLON,
      telefon: fakeTelefon("05119876520"),
      email: "stab@pzpibtl700.bundeswehr.example",
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

// -------------------------------------------------------------- Pioniertruppe
// Siehe Kopfkommentar für die Quellenlage je Zugtyp.

let fahrzeugNr = 1;
function pionierFahrzeug(typ: string, aenderungen?: string): Fahrzeug {
  const kennung = `HEER-${String(1000 + fahrzeugNr++)}`; // fiktiv, kein militärisches Kennzeichenschema öffentlich modelliert
  return { typ: { freitext: typ }, kennzeichen: kennung, stanKonform: true, ...(aenderungen ? { aenderungen } : {}) };
}

/**
 * Panzerpionierzug — 43 Dienstposten laut bundeswehr.de (siehe Kopfkommentar).
 * Aufteilung Zugtrupp/Gruppen ist NICHT quellenbelegt (erfundene Skizze).
 */
function panzerpionierzug(): Bauplan {
  const personal: Person[] = [
    person({ rolle: R.FUEHRER, funktion: "Zugführer Panzerpionierzug", fe: FE.C, kontakt: true }),
    person({ rolle: R.UNTERFUEHRER, funktion: "Zugtruppführer (stv. Zugführer)", fe: FE.C }),
    person({ rolle: R.MANNSCHAFT, funktion: "Kraftfahrer Zugtrupp", fe: FE.C }),
  ];
  let rest = 43 - personal.length; // 40, auf 3 Gruppen verteilen
  for (let g = 1; g <= 3; g++) {
    const groesse = g < 3 ? Math.ceil(rest / (4 - g)) : rest;
    rest -= groesse;
    personal.push(person({ rolle: R.UNTERFUEHRER, funktion: `Gruppenführer ${g}. Gruppe`, fe: FE.C }));
    for (let i = 1; i < groesse; i++) {
      personal.push(
        person({
          rolle: R.MANNSCHAFT,
          funktion: i % 3 === 0 ? `Kraftfahrer ${g}. Gruppe` : `Pionier ${g}. Gruppe`,
          fe: i % 3 === 0 ? FE.C : FE.B,
        }),
      );
    }
  }
  return {
    datei: "panzerpionierzug",
    einheitsTyp: "Panzerpionierzug",
    personal,
    fahrzeuge: [
      pionierFahrzeug("Transportpanzer Fuchs"),
      pionierFahrzeug("Transportpanzer Fuchs"),
      pionierFahrzeug("Pionierpanzer Dachs", "Räum-/Grabarbeiten, Dammsicherung"),
      pionierFahrzeug("Brückenlegepanzer Leguan", "Überbrückung unterspülter Wege"),
      pionierFahrzeug("Radlader"),
    ],
    hierarchie: hierarchiePionier("Panzerpionierzug"),
    einsatzOrt:
      "Hochwasserlage im Landkreis Moorwehde — Herstellen/Sichern von Deichübergängen, " +
      "Räumen unterspülter Wege und Beseitigen von Hindernissen im Zufahrtsbereich der " +
      "zivilen Einsatzkräfte, Bau eines Behelfsübergangs mit dem Brückenlegepanzer.",
    sonstiges:
      `Zugstärke (43) laut bundeswehr.de „Zugführer eines Pionierzuges": „Meine 43 ` +
      `Soldatinnen und Soldaten stellen unter meiner Führung die Pionierunterstützung […] ` +
      `sicher." Ausrüstung laut derselben Quelle (Transportpanzer Fuchs, Pionierpanzer ` +
      `Dachs, Brückenlegepanzer Leguan, Minenverlegesystem 85, Walzen-/Radlader). Die ` +
      `Aufteilung in Zugtrupp und 3 Gruppen ist NICHT Teil der Quelle, sondern eine ` +
      `plausible, aber erfundene Strukturskizze (keine veröffentlichte Zug-STAN).`,
  };
}

/**
 * Schwimmbrückenzug (M3) — Besatzung 3/Fahrzeug (Landfahrer, Wasserfahrer,
 * Schwimmbrückenpionier), 8 Fahrzeuge für eine 100-m-Brücke = 24 Personen,
 * beides wörtlich bundeswehr.de-belegt (siehe Kopfkommentar). Nur die
 * Zugführung (1 Person) ist strukturell ergänzt.
 */
function schwimmbrueckenzug(): Bauplan {
  const personal: Person[] = [
    person({ rolle: R.FUEHRER, funktion: "Zugführer Schwimmbrückenzug", fe: FE.C, kontakt: true }),
  ];
  const fahrzeuge: Fahrzeug[] = [];
  for (let i = 1; i <= 8; i++) {
    personal.push(
      person({ rolle: R.UNTERFUEHRER, funktion: `Landfahrer M3 Nr. ${i}`, fe: FE.C }),
      person({ rolle: R.MANNSCHAFT, funktion: `Wasserfahrer M3 Nr. ${i}`, fe: FE.C }),
      person({ rolle: R.MANNSCHAFT, funktion: `Schwimmbrückenpionier M3 Nr. ${i}`, fe: FE.B }),
    );
    fahrzeuge.push(pionierFahrzeug("Amphibisches Brücken- und Übersetzfahrzeug M3", i === 1 ? "Teil einer 100-m-Schwimmbrücke/Fähre" : undefined));
  }
  return {
    datei: "schwimmbrueckenzug-m3",
    einheitsTyp: "Schwimmbrückenzug (M3)",
    personal,
    fahrzeuge,
    hierarchie: hierarchiePionier("Schwimmbrückenzug (M3)"),
    einsatzOrt:
      "Hochwasserlage im Landkreis Moorwehde — Fährbetrieb über eine überflutete " +
      "Kreisstraße zur Versorgung eines abgeschnittenen Ortsteils sowie Bau einer " +
      "100-m-Schwimmbrücke für den Rad- und Kettenfahrzeugverkehr der Einsatzkräfte, " +
      "nachdem eine Behelfsbrücke unterspült wurde.",
    sonstiges:
      `Quelle bundeswehr.de „Schwimmschnellbrücke Amphibie M3": „Mit nur drei Mann ` +
      `Besatzung wird aus der schwimmenden Amphibie ein Teil einer Schwimmbrücke oder ` +
      `Fähre" (Landfahrer, Wasserfahrer, Schwimmbrückenpionier) und „Eine 100 Meter ` +
      `lange Schwimmbrücke wird mit acht Amphibien in weniger als 20 Minuten gebaut." ` +
      `→ 8 × 3 = 24 Personen, quellenscharf. Nur die Zugführung (1 Person) ist ` +
      `strukturell ergänzt, nicht einzelquellenbelegt. Hochwasser ist auf der ` +
      `Bundeswehr-Seite nicht wörtlich als Einsatzfall genannt, aber Standard-` +
      `Anwendungsfall für Fährbetrieb bei überfluteten Wegen/Brücken.`,
  };
}

/**
 * Pioniermaschinenzug — Kompanie-Gliederung laut Wikipedia „Panzerpioniere
 * (Bundeswehr)" ("Pioniermaschinenzug mit ungepanzerten Erdbaumaschinen wie
 * Baggern und Radladern"), Personalstärke NICHT quellenbelegt (Schätzung).
 */
function pioniermaschinenzug(): Bauplan {
  const personal: Person[] = [
    person({ rolle: R.FUEHRER, funktion: "Zugführer Pioniermaschinenzug", fe: FE.C, kontakt: true }),
    person({ rolle: R.UNTERFUEHRER, funktion: "Zugtruppführer (stv. Zugführer)", fe: FE.C }),
  ];
  for (let i = 1; i <= 8; i++) {
    personal.push(person({ rolle: R.UNTERFUEHRER, funktion: `Pioniermaschinenführer Bagger ${i}`, fe: FE.C }));
    personal.push(person({ rolle: R.MANNSCHAFT, funktion: `Kraftfahrer/Einweiser ${i}`, fe: FE.C }));
  }
  personal.push(
    person({ rolle: R.MANNSCHAFT, funktion: "Bohrgerätebediener Faltfestbrückenzug", fe: FE.C }),
    person({ rolle: R.MANNSCHAFT, funktion: "Kraftfahrer Faltfestbrückentransporter", fe: FE.C }),
  );
  return {
    datei: "pioniermaschinenzug",
    einheitsTyp: "Pioniermaschinenzug",
    personal,
    fahrzeuge: [
      pionierFahrzeug("Bagger (Pioniermaschine)", "Deichverstärkung, Dammbau"),
      pionierFahrzeug("Bagger (Pioniermaschine)", "Deichverstärkung, Dammbau"),
      pionierFahrzeug("Radlader"),
      pionierFahrzeug("Radlader"),
      pionierFahrzeug("Faltfestbrücke (Transportfahrzeug)"),
    ],
    hierarchie: hierarchiePionier("Pioniermaschinenzug"),
    einsatzOrt:
      "Hochwasserlage im Landkreis Moorwehde — Deichverstärkung und Dammbau mit " +
      "Erdbaumaschinen entlang des gefährdeten Flussabschnitts, Unterstützung beim " +
      "Verlegen einer Faltfestbrücke als Ersatz für einen gesperrten Kreisverkehrsweg.",
    sonstiges:
      `Kompanie-Gliederung laut Wikipedia „Panzerpioniere (Bundeswehr)": Die ` +
      `Pioniermaschinenkompanie eines Panzerpionierbataillons enthält u. a. einen ` +
      `„Pioniermaschinenzug mit ungepanzerten Erdbaumaschinen wie Baggern und ` +
      `Radladern" sowie einen Faltfestbrückenzug. Anders als beim Panzerpionierzug ` +
      `(43, bundeswehr.de) und dem Schwimmbrückenzug M3 (24, bundeswehr.de) ist für ` +
      `diesen Zugtyp KEINE Personalstärke veröffentlicht — die hier angesetzten 20 ` +
      `Dienstposten sind eine grobe Schätzung in vergleichbarer Größenordnung, keine ` +
      `Quellenangabe.`,
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
  panzerpionierzug(),
  schwimmbrueckenzug(),
  pioniermaschinenzug(),
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

Für die **Pioniertruppe** (Ergänzung 2026-08, Hochwasser-/Katastrophenschutz-Bezug)
gibt es keine vergleichbare Dienstposten-Gesamtliste, aber einzelne belegte
Eckdaten auf bundeswehr.de:

- **Panzerpionierzug:** 43 Dienstposten laut bundeswehr.de-Karriereportal
  ("Zugführer eines Pionierzuges"); die Aufteilung in Zugtrupp/Gruppen ist
  eine erfundene, aber plausible Strukturskizze.
- **Schwimmbrückenzug (M3):** Besatzung 3/Fahrzeug (Landfahrer, Wasserfahrer,
  Schwimmbrückenpionier) × 8 Fahrzeuge für eine 100-m-Brücke = 24 Personen,
  beides wörtlich bundeswehr.de-belegt; nur die Zugführung ist ergänzt.
- **Pioniermaschinenzug:** Kompanie-Gliederung laut Wikipedia
  ("Pioniermaschinenzug mit … Baggern und Radladern"), Personalstärke (20)
  mangels Quelle geschätzt.

Quellen: [Wikipedia „Verbindungskommando"](https://de.wikipedia.org/wiki/Verbindungskommando),
[Wikipedia „SAR-Dienst für Luftfahrzeuge in Deutschland"](https://de.wikipedia.org/wiki/SAR-Dienst_f%C3%BCr_Luftfahrzeuge_in_Deutschland),
[bundeswehr.de „Zugführer eines Pionierzuges"](https://www.bundeswehr.de/de/auftrag/einsaetze/missionen/ich-bin-im-einsatz/efp-zugfuehrer-pioniere-5787548),
[bundeswehr.de „Schwimmschnellbrücke Amphibie M3"](https://www.bundeswehr.de/de/ausruestung-technik-bundeswehr/landsysteme-bundeswehr/schwimmschnellbruecke-amphibie-m3),
[Wikipedia „Panzerpioniere (Bundeswehr)"](https://de.wikipedia.org/wiki/Panzerpioniere_(Bundeswehr)).

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
