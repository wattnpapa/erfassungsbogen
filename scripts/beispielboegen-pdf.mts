/**
 * Erzeugt Beispiel-Erfassungsbögen verschiedener THW-Einheiten als PDF.
 *
 * Jede Beispiel-Einheit wird als vollständiger Bogen (Seite 1 Kopf/Fahrzeuge,
 * Seite 2 Personal/Sofortbedarf, Seite 3 QR-Code) über dieselbe DocDefinition
 * gerendert, die auch die App verwendet (src/app/pdf-dokument.ts). Ausgabe nach
 * examples/ — bewusst NUR die PDFs (das maschinenlesbare JSON steckt bereits in
 * der PDF eingebettet, es werden keine separaten .json-Dateien geschrieben).
 *
 * Aufruf (Node ≥ 22): node --import tsx scripts/beispielboegen-pdf.mts
 *
 * Vokabular-Codes siehe src/vokabulare/thw.ts:
 *   Einheitstyp  3=ZTr TZ 4=B 6=FGr R(A) 9=FGr W(A) 16=FGr N 38=FGr Log-V
 *   Funktion     1=ZFü 2=ZTrFü 3=GrFü 4=TrFü 5=He 7=SGL
 *   Zusatz       30=Spr 31=SanHe 32=AGT 36=BoFü 37=BoFü man. 38=Bed.Motorsäge
 *                41=Bed.Bagger/Radlader 49=Masch.NEA 51=Masch.Pumpen 67=LogFü
 *   Fahrzeug     2=FüKW 4=GKW 6=MLW IV 7=LKW Kipper 8=LKW Lbw 16=Bagger
 *                22=MzAB 24=MTW gl 40=Anh 2t 43=Anh Plane/Spriegel 45=Anh Tieflader
 *                47=Anh NEA mittel
 *   Hierarchie   1=OV 2=RB 3=LV ; Kennwort 1=Heros
 */

import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pdfmake from "pdfmake";
import QRCode from "qrcode";
import {
  Erfassungsbogen,
  Ernaehrung as E,
  Fahrerlaubnis as FE,
  Funkrufname,
  Geschlecht as G,
  KontaktArt,
  OrganisationsTyp,
  PersonalErfassung,
  Person,
  SCHEMA_VERSION,
  StaerkeRolle as R,
  VokabularWert,
  datumAusIso,
  staerke,
} from "../src/model";
import { nodeKompressor } from "../src/qr-node";
import {
  EEB_URL_PREFIX,
  QR_EINZEL_MAX_VERSION,
  QR_SEGMENT_ZIEL_VERSION,
  base64UrlKodieren,
  encodePayload,
  segmentPayloadUrls,
} from "../src/codec";
import { pdfDokument } from "../src/app/pdf-dokument";
import type { QrSatz } from "../src/app/hilfen";

const wurzel = join(dirname(fileURLToPath(import.meta.url)), "..");

// ----------------------------------------------------------------- Kurzhelfer
const V = (code: number): VokabularWert => ({ code });
const FR = (teile: number[], ort?: string): Funkrufname => ({
  kennwort: V(1),
  eigenerStandort: ort == null,
  ort,
  teile,
});

const P = (
  vorname: string,
  nachname: string,
  rolle: R,
  funktionen: VokabularWert[],
  fe: FE,
  g: G,
  opt: {
    /** Weitere StAN-Zusatzfunktionen (Vokabular-Codes) — erscheinen in der Funktionsspalte. */
    zf?: VokabularWert[];
    /** Externe/interne Qualifikationen als Freitext — erscheinen in der Qualifikationstabelle. */
    quali?: string[];
    ernaehrung?: E;
    mobil?: string;
    mail?: boolean;
  } = {},
): Person => ({
  vorname,
  nachname,
  staerkeRolle: rolle,
  funktionen: [...funktionen, ...(opt.zf ?? [])],
  fahrerlaubnis: fe,
  geschlecht: g,
  ernaehrung: opt.ernaehrung ?? E.FLEISCH,
  kontakte: [
    ...(opt.mobil ? [{ art: KontaktArt.MOBIL, dienstlich: false, wert: opt.mobil }] : []),
    ...(opt.mail ? [{ art: KontaktArt.EMAIL, dienstlich: true, emailTemplate: 1 }] : []),
  ],
  zusatzqualifikationen: (opt.quali ?? []).map((freitext) => ({ freitext })),
});

/** Gemeinsamer OV-Rahmen (Hierarchie OV → RST → LV). */
function ov(
  name: string,
  ovName: string,
  kurz: string,
  tel: string,
  mail: string,
  rst: { name: string; tel: string; mail: string },
  lv: { name: string; tel: string; mail: string },
) {
  return {
    name,
    hierarchie: [
      { bezeichnung: V(1), name: ovName, kurz, telefon: tel, email: mail },
      { bezeichnung: V(2), name: rst.name, telefon: rst.tel, email: rst.mail },
      { bezeichnung: V(3), name: lv.name, telefon: lv.tel, email: lv.mail },
    ],
  };
}

const OV_OL = ov(
  "OV Oldenburg - Ni",
  "Oldenburg - Ni",
  "OODE",
  "04413401050",
  "ov-oldenburg-ni@thw.de",
  { name: "Oldenburg", tel: "04413611180", mail: "poststelle.rst_oldenburg@thw.de" },
  { name: "Bremen, Niedersachsen", tel: "051133690100", mail: "poststelle.lvhbni@thw.de" },
);
const OV_KL = ov(
  "OV Kaiserslautern",
  "Kaiserslautern",
  "OKL",
  "063131651680",
  "ov-kaiserslautern@thw.de",
  { name: "Kaiserslautern", tel: "0631316520", mail: "poststelle.rst_kaiserslautern@thw.de" },
  { name: "Rheinland-Pfalz, Saarland", tel: "06131974640", mail: "poststelle.lvrps@thw.de" },
);
const OVE = [OV_OL, OV_KL];

// ----------------------------------------------- Stress-Test: sehr großer Bogen
// Bewusst überfüllte Einheit (Vollzug + Verstärkung), damit der Payload NICHT
// mehr in einen einzelnen QR-Code passt und die App-Segmentierung greift. Die
// Helfer werden aus Namenspools erzeugt und mit reichlich Freitext (Kontakte,
// Qualifikationen) versehen — das treibt die Datenmenge über das QR-Budget.
const VORNAMEN = [
  "Alexander", "Benedikt", "Christoph", "Dominik", "Emil", "Fabian", "Gregor",
  "Hendrik", "Ingo", "Jakob", "Konstantin", "Leopold", "Maximilian", "Nikolas",
  "Ottokar", "Philipp", "Quirin", "Raphael", "Sebastian", "Theodor", "Valentin",
  "Wilhelm", "Annika", "Bettina", "Charlotte", "Dorothea", "Elisabeth",
  "Franziska", "Gabriele", "Henrike", "Isabella", "Josephine", "Katharina",
  "Leonore", "Magdalena", "Natalie", "Ottilie", "Philippa",
];
const NACHNAMEN = [
  "Achenbach", "Baumgartner", "Christiansen", "Dietrichkeit", "Ehrenberg",
  "Falkenhagen", "Grünewald", "Hillebrand", "Immenhausen", "Jägersberg",
  "Kirchhoff", "Lindenberg", "Muckenfuß", "Nachtigall", "Oberländer",
  "Pappenheim", "Quintenz", "Rosenkranz", "Sternberg", "Trautvetter",
  "Uhlenbrock", "Vollenweider", "Wackernagel", "Xylander", "Zähringer",
  "Angermüller", "Brömmelkamp", "Cranachhausen", "Düsterhöft", "Engelbrechten",
  "Fürstenwalde", "Gerstenkorn", "Habermehl", "Ickelsheimer", "Jungmichel",
  "Kettenhofen", "Lämmerhirt", "Mohrenschildt",
];
const QUALI_POOL = [
  "Rettungssanitäter (extern)",
  "Motorsägenschein AS Baum I + II (extern)",
  "Kettensägenführer Modul C/D (extern)",
  "Baggerführer bis 8 t inkl. Anbaugeräte (Beruf)",
  "Elektrofachkraft für festgelegte Tätigkeiten (Beruf)",
  "Atemschutzgeräteträger G26.3, jährlich belehrt",
  "Sprechfunker BOS-Digitalfunk, Netzknoten Rheinland-Pfalz",
  "Höhenrettung / Absturzsicherung (Fachgruppe Höhenrettung)",
];

function grossbogenPersonal(): Person[] {
  const leute: Person[] = [];
  // Führung
  leute.push(P("Reinhardt", "Fürstenwalde", R.FUEHRER, [V(1)], FE.CE, G.M, {
    mobil: "01701230001", mail: true,
    quali: ["Zugführer-Lehrgang THW-Bundesschule", "Berufsfeuerwehr Gruppenführer (Beruf)"],
  }));
  leute.push(P("Cornelia", "Rosenkranz", R.UNTERFUEHRER, [V(2)], FE.C, G.W, {
    mobil: "01701230002", mail: true, zf: [V(30)],
    quali: ["Fachberater THW", "Einsatzstellenhygiene (extern)"],
  }));
  // 4 Gruppen à Gruppenführer + Truppführer + 7 Helfer = 36 Personen
  const funktionen: VokabularWert[][] = [[V(3)], [V(4)], ...Array(7).fill([V(5)])];
  const zusatz = [V(30), V(31), V(32), V(36), V(38), V(41), V(49), V(51), V(67)];
  const fahr = [FE.CE, FE.C, FE.C, FE.B, FE.B, FE.NONE, FE.NONE, FE.NONE, FE.NONE];
  const ern = [E.FLEISCH, E.FLEISCH, E.VEGETARISCH, E.FLEISCH, E.VEGAN, E.FLEISCH, E.VEGETARISCH, E.FLEISCH, E.VEGAN];
  let n = 0;
  for (let g = 0; g < 5; g++) {
    for (let i = 0; i < funktionen.length; i++) {
      const vorname = VORNAMEN[n % VORNAMEN.length]!;
      const nachname = NACHNAMEN[(n * 7) % NACHNAMEN.length]!;
      const geschlecht = n % 5 === 0 ? G.W : G.M;
      leute.push(P(vorname, nachname, i < 2 ? R.UNTERFUEHRER : R.MANNSCHAFT, funktionen[i]!, fahr[i]!, geschlecht, {
        mobil: `017012${String(30010 + n).padStart(5, "0")}`,
        mail: i < 2,
        zf: [zusatz[n % zusatz.length]!, zusatz[(n + 3) % zusatz.length]!],
        ernaehrung: ern[n % ern.length],
        quali: [QUALI_POOL[n % QUALI_POOL.length]!, QUALI_POOL[(n + 4) % QUALI_POOL.length]!],
      }));
      n++;
    }
  }
  return leute;
}

// -------------------------------------------------------- Beispiel-Definitionen

interface Beispiel {
  datei: string;
  ort: number; // Index in OVE
  bogen: Omit<Erfassungsbogen, "schemaVersion" | "einheit"> & {
    einheit: Omit<Erfassungsbogen["einheit"], "organisation" | "name" | "hierarchie">;
  };
}

const beispiele: Beispiel[] = [
  // ---- Bergungsgruppe (B) — das Rückgrat jedes Technischen Zuges ------------
  {
    datei: "bergungsgruppe",
    ort: 0,
    bogen: {
      stand: datumAusIso("2026-06-20"),
      einheit: { einheitsTyp: V(4) },
      einsatz: {
        zeitraumVon: datumAusIso("2026-06-20"),
        zeitraumBis: datumAusIso("2026-06-22"),
        ortAuftrag: "Sturmschäden Landkreis Oldenburg — Beräumung, Sicherung",
      },
      personalErfassung: PersonalErfassung.VOLLSTAENDIG,
      personal: [
        P("Martin", "Berger", R.UNTERFUEHRER, [V(3)], FE.C, G.M, { mobil: "01711234501", mail: true, quali: ["Rettungssanitäter (extern)"] }),
        P("Timo", "Brandt", R.UNTERFUEHRER, [V(4)], FE.CE, G.M, { mobil: "01711234502", zf: [V(38)] }),
        P("Lennart", "Hofmann", R.MANNSCHAFT, [V(5)], FE.C, G.M, { zf: [V(30)] }),
        P("Andre", "Neumann", R.MANNSCHAFT, [V(5)], FE.B, G.M, { zf: [V(32)] }),
        P("Tobias", "Martens", R.MANNSCHAFT, [V(5)], FE.NONE, G.M, { zf: [V(31)] }),
        P("Jens", "Sommer", R.MANNSCHAFT, [V(5)], FE.NONE, G.M, { ernaehrung: E.VEGETARISCH, quali: ["Motorsägenschein AS Baum I (extern)"] }),
        P("Julian", "Grote", R.MANNSCHAFT, [V(5)], FE.NONE, G.M),
        P("Diana", "Hartmann", R.MANNSCHAFT, [V(5)], FE.B, G.W, { zf: [V(31)] }),
        P("Miriam", "Becker", R.MANNSCHAFT, [V(5)], FE.NONE, G.W, { ernaehrung: E.VEGAN }),
      ],
      fahrzeuge: [
        { typ: V(4), thwKennzeichen: 84397, funkrufname: FR([22, 12]), stanKonform: true },
        { typ: V(40), thwKennzeichen: 84398, stanKonform: true, aenderungen: "Anhänger für Beleuchtungssatz" },
      ],
      sofortbedarf: {
        verpflegungPersonen: 9,
        dieselLiter: 60,
        benzinLiter: 20,
        gemischLiter: 5,
        unterbringung: false,
        ruhezeitErforderlich: false,
      },
    },
  },

  // ---- Fachgruppe Notversorgung/Notinstandsetzung (FGr N) -------------------
  {
    datei: "fgr-n-notversorgung",
    ort: 0,
    bogen: {
      stand: datumAusIso("2026-06-20"),
      einheit: { einheitsTyp: V(16) },
      einsatz: {
        zeitraumVon: datumAusIso("2026-06-20"),
        zeitraumBis: datumAusIso("2026-06-24"),
        ortAuftrag: "Stromausfall Klinikum — Notstromversorgung sicherstellen",
      },
      personalErfassung: PersonalErfassung.VOLLSTAENDIG,
      personal: [
        P("Kevin", "Adler", R.UNTERFUEHRER, [V(3)], FE.CE, G.M, { mobil: "01721234501", mail: true, zf: [V(49)], quali: ["Elektrofachkraft (Beruf)"] }),
        P("Sven", "Roth", R.MANNSCHAFT, [V(5)], FE.C, G.M, { zf: [V(49)] }),
        P("Pascal", "Wolf", R.MANNSCHAFT, [V(5)], FE.C, G.M, { zf: [V(51)] }),
        P("Marco", "Keller", R.MANNSCHAFT, [V(5)], FE.B, G.M),
        P("Nadine", "Frank", R.MANNSCHAFT, [V(5)], FE.NONE, G.W, { zf: [V(30)], ernaehrung: E.VEGETARISCH }),
        P("Dennis", "Kaiser", R.MANNSCHAFT, [V(5)], FE.NONE, G.M),
      ],
      fahrzeuge: [
        { typ: V(6), thwKennzeichen: 84512, funkrufname: FR([25, 51]), stanKonform: true },
        { typ: V(47), thwKennzeichen: 84513, stanKonform: true },
      ],
      sofortbedarf: {
        verpflegungPersonen: 6,
        dieselLiter: 200,
        benzinLiter: 0,
        gemischLiter: 0,
        unterbringung: true,
        ruhezeitErforderlich: true,
      },
      sonstiges: "Einsatz voraussichtlich mehrschichtig — Ablösung nach 12 h erforderlich.",
    },
  },

  // ---- Fachgruppe Wassergefahren (A) (FGr W (A)) ----------------------------
  {
    datei: "fgr-w-a-wassergefahren",
    ort: 1,
    bogen: {
      stand: datumAusIso("2026-06-20"),
      einheit: { einheitsTyp: V(9) },
      einsatz: {
        zeitraumVon: datumAusIso("2026-06-20"),
        zeitraumBis: datumAusIso("2026-06-21"),
        ortAuftrag: "Hochwasser Lauter — Menschenrettung, Deichverteidigung",
      },
      personalErfassung: PersonalErfassung.VOLLSTAENDIG,
      personal: [
        P("Florian", "Schmitt", R.UNTERFUEHRER, [V(3)], FE.CE, G.M, { mobil: "01731234501", mail: true, zf: [V(36)], quali: ["Rettungsschwimmabzeichen Silber"] }),
        P("Tobias", "Lang", R.MANNSCHAFT, [V(5)], FE.C, G.M, { zf: [V(36)] }),
        P("Christian", "Vogel", R.MANNSCHAFT, [V(5)], FE.B, G.M, { zf: [V(37)] }),
        P("Manuel", "Braun", R.MANNSCHAFT, [V(5)], FE.NONE, G.M, { zf: [V(31)] }),
        P("Julia", "Wagner", R.MANNSCHAFT, [V(5)], FE.NONE, G.W, { zf: [V(30)] }),
        P("Patrick", "Simon", R.MANNSCHAFT, [V(5)], FE.NONE, G.M, { ernaehrung: E.VEGETARISCH }),
      ],
      fahrzeuge: [
        { typ: V(24), thwKennzeichen: 71204, funkrufname: FR([24, 11]), stanKonform: true },
        { typ: V(22), kennzeichenFreitext: "auf Anh", funkrufname: FR([24, 91]), stanKonform: true, aenderungen: "MzAB mit 40-PS-Außenborder" },
        { typ: V(45), thwKennzeichen: 71205, stanKonform: true },
      ],
      sofortbedarf: {
        verpflegungPersonen: 6,
        dieselLiter: 40,
        benzinLiter: 60,
        gemischLiter: 10,
        unterbringung: false,
        ruhezeitErforderlich: false,
      },
    },
  },

  // ---- Fachgruppe Räumen (A) (FGr R (A)) ------------------------------------
  {
    datei: "fgr-r-a-raeumen",
    ort: 1,
    bogen: {
      stand: datumAusIso("2026-06-20"),
      einheit: { einheitsTyp: V(6) },
      einsatz: {
        zeitraumVon: datumAusIso("2026-06-20"),
        zeitraumBis: datumAusIso("2026-06-23"),
        ortAuftrag: "Erdrutsch B270 — Räumen Fahrbahn, Freilegen Verschütteter",
      },
      personalErfassung: PersonalErfassung.VOLLSTAENDIG,
      personal: [
        P("Thomas", "Herr", R.UNTERFUEHRER, [V(3)], FE.CE, G.M, { mobil: "01741234501", mail: true, zf: [V(41)], quali: ["Berufskraftfahrer, Baggerführer (Beruf)"] }),
        P("Alexander", "Busch", R.MANNSCHAFT, [V(5)], FE.CE, G.M, { zf: [V(41)] }),
        P("Fabian", "Krug", R.MANNSCHAFT, [V(5)], FE.C, G.M, { zf: [V(38)] }),
        P("Nico", "Reuter", R.MANNSCHAFT, [V(5)], FE.C, G.M),
        P("Erik", "Sauer", R.MANNSCHAFT, [V(5)], FE.B, G.M, { zf: [V(31)] }),
        P("Lea", "Marx", R.MANNSCHAFT, [V(5)], FE.NONE, G.W, { ernaehrung: E.VEGAN }),
      ],
      fahrzeuge: [
        { typ: V(4), thwKennzeichen: 71330, funkrufname: FR([23, 12]), stanKonform: true },
        { typ: V(16), kennzeichenFreitext: "Kettenbagger", funkrufname: FR([23, 61]), stanKonform: true },
        { typ: V(7), thwKennzeichen: 71331, funkrufname: FR([23, 51]), stanKonform: true },
        { typ: V(45), thwKennzeichen: 71332, stanKonform: true, aenderungen: "Tieflader für Bagger" },
      ],
      sofortbedarf: {
        verpflegungPersonen: 6,
        dieselLiter: 300,
        benzinLiter: 0,
        gemischLiter: 5,
        unterbringung: true,
        ruhezeitErforderlich: true,
      },
    },
  },

  // ---- Zugtrupp Technischer Zug (ZTr TZ) — Führung des Zuges ----------------
  {
    datei: "zugtrupp-technischer-zug",
    ort: 0,
    bogen: {
      stand: datumAusIso("2026-06-20"),
      einheit: { einheitsTyp: V(3) },
      einsatz: {
        zeitraumVon: datumAusIso("2026-06-20"),
        zeitraumBis: datumAusIso("2026-06-22"),
        ortAuftrag: "Sturmschäden Landkreis Oldenburg — Führung Technischer Zug",
      },
      personalErfassung: PersonalErfassung.VOLLSTAENDIG,
      personal: [
        P("Andreas", "Kraft", R.FUEHRER, [V(1)], FE.C, G.M, { mobil: "01751234501", mail: true }),
        P("Stefan", "Böhm", R.UNTERFUEHRER, [V(2)], FE.C, G.M, { mobil: "01751234502", zf: [V(30)] }),
        P("Jan", "Winter", R.MANNSCHAFT, [V(5)], FE.B, G.M, { zf: [V(30)] }),
        P("Melanie", "Kuhn", R.MANNSCHAFT, [V(5)], FE.B, G.W, { zf: [V(31)], ernaehrung: E.VEGETARISCH }),
      ],
      fahrzeuge: [
        { typ: V(2), thwKennzeichen: 84001, funkrufname: FR([21, 11]), stanKonform: true },
      ],
      sofortbedarf: {
        verpflegungPersonen: 4,
        dieselLiter: 30,
        benzinLiter: 0,
        gemischLiter: 0,
        unterbringung: false,
        ruhezeitErforderlich: false,
      },
    },
  },

  // ---- Fachgruppe Logistik-Verpflegung (FGr Log-V) --------------------------
  {
    datei: "fgr-log-v-verpflegung",
    ort: 1,
    bogen: {
      stand: datumAusIso("2026-06-20"),
      einheit: { einheitsTyp: V(38) },
      einsatz: {
        zeitraumVon: datumAusIso("2026-06-20"),
        zeitraumBis: datumAusIso("2026-06-25"),
        ortAuftrag: "Bereitstellungsraum Kaiserslautern — Verpflegung Einsatzkräfte",
      },
      personalErfassung: PersonalErfassung.VOLLSTAENDIG,
      personal: [
        P("Werner", "Haas", R.UNTERFUEHRER, [V(3)], FE.C, G.M, { mobil: "01761234501", mail: true, zf: [V(67)], quali: ["Koch (Beruf), Hygieneschulung §43 IfSG"] }),
        P("Ralf", "Engel", R.MANNSCHAFT, [V(5)], FE.C, G.M),
        P("Bianca", "Ludwig", R.MANNSCHAFT, [V(5)], FE.B, G.W),
        P("Sandra", "Otto", R.MANNSCHAFT, [V(5)], FE.NONE, G.W, { ernaehrung: E.VEGETARISCH }),
        P("Heiko", "Ernst", R.MANNSCHAFT, [V(5)], FE.NONE, G.M),
        P("Katrin", "Voigt", R.MANNSCHAFT, [V(5)], FE.NONE, G.W, { ernaehrung: E.VEGAN }),
        P("Oliver", "Seidel", R.MANNSCHAFT, [V(5)], FE.NONE, G.M),
        P("Torsten", "Brück", R.MANNSCHAFT, [V(5)], FE.C, G.M),
      ],
      fahrzeuge: [
        { typ: V(8), thwKennzeichen: 71640, funkrufname: FR([29, 11]), stanKonform: true },
        { typ: V(43), thwKennzeichen: 71641, stanKonform: true, aenderungen: "Feldkochherd FKH-250" },
      ],
      sofortbedarf: {
        verpflegungPersonen: 8,
        dieselLiter: 80,
        benzinLiter: 20,
        gemischLiter: 0,
        unterbringung: true,
        ruhezeitErforderlich: false,
      },
      sonstiges: "Kann bis zu 250 Portionen/Ausgabe leisten. Anlieferung Frischware am ersten Tag erforderlich.",
    },
  },

  // ---- STRESS-TEST: Verstärkter Bergungszug (übergroßer Bogen, QR-Segmentierung)
  // Bewusst überfüllt: 38 Helfer mit Kontakten/Qualifikationen, 10 Fahrzeuge und
  // lange Freitexte sprengen das QR-Budget eines einzelnen Codes → die App teilt
  // den Payload auf mehrere QR-Teile auf. Zum Ausprobieren des Scan-Sammelns.
  {
    datei: "grossbogen-verstaerkter-bergungszug",
    ort: 0,
    bogen: {
      stand: datumAusIso("2026-06-20"),
      einheit: { einheitsTyp: V(18) },
      einsatz: {
        zeitraumVon: datumAusIso("2026-06-20"),
        zeitraumBis: datumAusIso("2026-06-27"),
        ortAuftrag:
          "Großschadenslage nach Starkregen und Hangrutsch im Landkreis Oldenburg — " +
          "Verstärkter Bergungszug mit Schwerer Bergung: Menschenrettung aus verschütteten " +
          "Gebäuden, Abstützen einsturzgefährdeter Bauwerke, Beräumung der Zufahrtswege, " +
          "Aufbau einer Bereitstellungsraum-Struktur für nachrückende Kräfte.",
      },
      personalErfassung: PersonalErfassung.VOLLSTAENDIG,
      personal: grossbogenPersonal(),
      fahrzeuge: [
        { typ: V(2), thwKennzeichen: 84100, funkrufname: FR([21, 11]), stanKonform: true },
        { typ: V(4), thwKennzeichen: 84101, funkrufname: FR([22, 12]), stanKonform: true },
        { typ: V(4), thwKennzeichen: 84102, funkrufname: FR([22, 22]), stanKonform: true },
        { typ: V(6), thwKennzeichen: 84103, funkrufname: FR([25, 51]), stanKonform: true, aenderungen: "MLW IV mit Zusatzbeladung Abstützsystem Holz" },
        { typ: V(7), thwKennzeichen: 84104, funkrufname: FR([23, 51]), stanKonform: true },
        { typ: V(16), kennzeichenFreitext: "Kettenbagger 8 t (Mietgerät)", funkrufname: FR([23, 61]), stanKonform: false, aenderungen: "Ersatzgerät, nicht STAN-konform — Tiltrotator + Abbruchgreifer" },
        { typ: V(8), thwKennzeichen: 84105, funkrufname: FR([29, 11]), stanKonform: true, aenderungen: "LKW Ladebordwand für Materialtransport Schwere Bergung" },
        { typ: V(45), thwKennzeichen: 84106, stanKonform: true, aenderungen: "Tieflader für Bagger" },
        { typ: V(47), thwKennzeichen: 84107, stanKonform: true, aenderungen: "NEA 50 kVA für Baustellenbeleuchtung" },
        { typ: V(43), thwKennzeichen: 84108, stanKonform: true, aenderungen: "Anhänger Plane/Spriegel mit Verpflegungs- und Sanitätsausstattung" },
      ],
      sofortbedarf: {
        verpflegungPersonen: 38,
        dieselLiter: 600,
        benzinLiter: 80,
        gemischLiter: 20,
        unterbringung: true,
        ruhezeitErforderlich: true,
      },
      sonstiges:
        "Einsatz mehrschichtig über mindestens sieben Tage geplant. Ablösung nach je 12 h " +
        "erforderlich, zweite Schicht wird nachgeführt. Unterbringung in Turnhalle organisiert, " +
        "Feldküche der FGr Log-V angefragt. Schwere Bergung benötigt zusätzlich Rüstholz, " +
        "Baustützen und Abbruchhämmer — Nachforderung über die Regionalstelle läuft.",
    },
  },
];

// ---------------------------------------------------------------- PDF-Rendering

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

// Spiegelt die App-Logik (src/app/hilfen.ts qrErzeugen) mit dem Node-Kompressor:
// Passt der Bogen in einen einzelnen QR-Code (≤ QR_EINZEL_MAX_VERSION, ECC M),
// bleibt es bei einem Teil; sonst wird der Payload auf so viele Teile aufgeteilt,
// dass jeder auf die gröbere QR_SEGMENT_ZIEL_VERSION kommt — grobe, gut scannbare
// Codes (Segmentierung, siehe docs/datenmodell.md).
const QR_OPTIONEN = { errorCorrectionLevel: "M" as const };

function qrVersion(url: string): number {
  try {
    return QRCode.create(url, QR_OPTIONEN).version;
  } catch {
    return Infinity;
  }
}

async function pngDatenUrl(url: string): Promise<string> {
  const png = await QRCode.toBuffer(url, { ...QR_OPTIONEN, type: "png", width: 520 });
  return `data:image/png;base64,${png.toString("base64")}`;
}

async function qrInfo(b: Erfassungsbogen): Promise<QrSatz> {
  const payload = encodePayload(b, nodeKompressor);
  const url = EEB_URL_PREFIX + base64UrlKodieren(payload);
  const einzelVersion = qrVersion(url);
  if (einzelVersion <= QR_EINZEL_MAX_VERSION) {
    const datenUrl = await pngDatenUrl(url);
    return {
      teile: [{ datenUrl, url, teilNr: 1, anzahl: 1, version: einzelVersion }],
      segmentiert: false,
      zeichen: url.length,
      version: einzelVersion,
    };
  }

  // Zu groß: kleinste Teilzahl suchen, bei der jeder Teil auf die gröbere
  // Segment-Zielversion kommt (grobe Codes = zuverlässig scannbar).
  const maxTeile = Math.min(20, payload.length);
  let urls = segmentPayloadUrls(payload, Math.min(2, maxTeile));
  for (let anzahl = 2; anzahl <= maxTeile; anzahl++) {
    urls = segmentPayloadUrls(payload, anzahl);
    if (urls.every((u) => qrVersion(u) <= QR_SEGMENT_ZIEL_VERSION)) break;
  }
  const teile = await Promise.all(
    urls.map(async (u, i) => ({
      datenUrl: await pngDatenUrl(u),
      url: u,
      teilNr: i + 1,
      anzahl: urls.length,
      version: qrVersion(u),
    })),
  );
  return {
    teile,
    segmentiert: true,
    zeichen: url.length,
    version: Math.max(...teile.map((t) => t.version)),
  };
}

const ausgabe = join(wurzel, "examples");
mkdirSync(ausgabe, { recursive: true });

for (const bsp of beispiele) {
  const rahmen = OVE[bsp.ort];
  const bogen: Erfassungsbogen = {
    schemaVersion: SCHEMA_VERSION,
    ...bsp.bogen,
    einheit: {
      organisation: OrganisationsTyp.THW,
      ...bsp.bogen.einheit,
      name: rahmen.name,
      hierarchie: rahmen.hierarchie,
    },
  };
  const qr = await qrInfo(bogen);
  const pfad = join(ausgabe, `${bsp.datei}.pdf`);
  await pdfmake.createPdf(pdfDokument(bogen, qr)).write(pfad);
  const s = staerke(bogen);
  const qrInfo2 = qr.segmentiert
    ? `${qr.zeichen} Zeichen → ${qr.teile.length} QR-Teile (max. Version ${qr.version})`
    : `${qr.zeichen} Zeichen → 1 QR-Code (Version ${qr.version})`;
  console.log(`✓ ${bsp.datei}.pdf — Stärke ${s.fuehrer}/${s.unterfuehrer}/${s.mannschaft}/${s.gesamt}, ${qrInfo2}`);
}

console.log(`\nFertig: ${beispiele.length} Beispiel-PDFs in examples/`);
