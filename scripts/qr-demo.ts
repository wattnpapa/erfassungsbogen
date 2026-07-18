/**
 * End-to-End-Beweis für Codec + QR-Rendering:
 *
 *   Bogen (FGr K (A), 20 Personen, 6 Fahrzeuge)
 *     → encodePayload → QR-PNG/SVG (examples/)
 *     → PNG mit jsQR ZURÜCKSCANNEN (echter QR-Decoder, nicht nur Byte-Vergleich)
 *     → decodePayload → Deep-Equal mit dem Original.
 *
 * Aufruf: npm run demo
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { deepStrictEqual } from "node:assert";
import jsQR from "jsqr";
import { PNG } from "pngjs";
import {
  Erfassungsbogen,
  Ernaehrung as E,
  Fahrerlaubnis as FE,
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
  unterbringungMWD,
} from "../src/model";
import { EEB_URL_PREFIX } from "../src/codec";
import { bogenZuQrPng, bogenZuQrSvg, qrTextZuBogen } from "../src/qr-node";

// Vokabular-Codes aus src/vokabulare/thw.ts:
// Einheitstyp 43 = FGr K (A); Funktionen 3=GrFü 4=TrFü 5=He 7=SGL 35=FüGeh;
// Fahrzeuge 1=FmKW 2=FüKW; Hierarchie 1=OV 2=RB 3=LV; Kennwort 1=Heros.
const V = (code: number): VokabularWert => ({ code });
const VF = (freitext: string): VokabularWert => ({ freitext });

const P = (
  vorname: string,
  nachname: string,
  rolle: R,
  funktionen: VokabularWert[],
  fe: FE,
  g: G,
  mobilPrivat?: string,
): Person => ({
  vorname,
  nachname,
  staerkeRolle: rolle,
  funktionen,
  fahrerlaubnis: fe,
  geschlecht: g,
  ernaehrung: E.FLEISCH,
  kontakte: mobilPrivat ? [{ art: KontaktArt.MOBIL, dienstlich: false, wert: mobilPrivat }] : [],
  zusatzqualifikationen: [],
});

const bogen: Erfassungsbogen = {
  schemaVersion: SCHEMA_VERSION,
  stand: datumAusIso("2026-05-14"),
  einheit: {
    organisation: OrganisationsTyp.THW,
    einheitsTyp: V(43), // FGr K (A)
    name: "OV Oldenburg - Ni",
    hierarchie: [
      { bezeichnung: V(1), name: "Oldenburg - Ni", kurz: "OODE", telefon: "04413401050", email: "ov-oldenburg-ni@thw.de" },
      { bezeichnung: V(2), name: "Oldenburg", telefon: "04413611180", email: "poststelle.rst_oldenburg@thw.de" },
      { bezeichnung: V(3), name: "Bremen, Niedersachsen", telefon: "051133690100", email: "poststelle.lvhbni@thw.de" },
    ],
  },
  einsatz: {
    zeitraumVon: datumAusIso("2025-05-14"),
    zeitraumBis: datumAusIso("2025-05-17"),
    ortAuftrag: "Fernmeldebauübung Kabelblitz",
  },
  personalErfassung: PersonalErfassung.VOLLSTAENDIG,
  personal: [
    {
      ...P("Johannes", "Rudolph", R.UNTERFUEHRER, [V(3), V(7)], FE.C, G.M),
      kontakte: [
        { art: KontaktArt.MOBIL, dienstlich: false, wert: "01701234501" },
        { art: KontaktArt.EMAIL, dienstlich: true, emailTemplate: 1 },
      ],
    },
    P("Jonas", "Bergmann", R.UNTERFUEHRER, [V(4), V(35)], FE.B, G.M, "01701234502"),
    P("Michael", "Sturm", R.UNTERFUEHRER, [V(4), V(7)], FE.CE, G.M, "01701234503"),
    P("Lukas", "Hansen", R.MANNSCHAFT, [V(5)], FE.CE, G.M),
    P("Arne", "Petersen", R.MANNSCHAFT, [V(5), V(7)], FE.CE, G.M),
    P("Tim", "Berger", R.MANNSCHAFT, [V(5)], FE.B, G.M),
    P("Jan", "Winter", R.MANNSCHAFT, [V(5)], FE.BE, G.M),
    P("Jannik", "Krause", R.MANNSCHAFT, [V(5)], FE.BE, G.M),
    P("Felix", "Brandt", R.MANNSCHAFT, [V(5)], FE.BE, G.M),
    P("Tom", "Fischer", R.MANNSCHAFT, [V(5), V(35)], FE.B, G.M),
    { ...P("Doris", "Hartmann", R.MANNSCHAFT, [V(5), V(35)], FE.NONE, G.W), ernaehrung: E.VEGETARISCH },
    { ...P("Anna", "Weber", R.MANNSCHAFT, [V(5)], FE.NONE, G.W), ernaehrung: E.VEGAN },
    P("Miriam", "Vogt", R.MANNSCHAFT, [V(5)], FE.NONE, G.W),
    P("Lena", "Michels", R.MANNSCHAFT, [V(5)], FE.BE, G.W),
    P("Sebastian", "Braun", R.MANNSCHAFT, [V(5)], FE.NONE, G.M),
    P("Luca", "Clausen", R.MANNSCHAFT, [V(5)], FE.NONE, G.M),
    P("Stefan", "Haase", R.MANNSCHAFT, [V(5)], FE.NONE, G.M),
    P("Lasse", "Zimmer", R.MANNSCHAFT, [V(5)], FE.NONE, G.M),
    P("Theo", "Petersen", R.MANNSCHAFT, [V(5)], FE.NONE, G.M),
    P("Theo", "Meier", R.MANNSCHAFT, [V(5)], FE.NONE, G.M),
  ],
  fahrzeuge: [
    { typ: V(1), kennzeichen: "THW-84397", funkrufname: { kennwort: V(1), eigenerStandort: true, teile: [18, 13] }, stanKonform: true },
    { typ: VF("MzKW"), kennzeichen: "THW-90272", funkrufname: { kennwort: V(1), eigenerStandort: true, teile: [24, 54] }, stanKonform: false },
    { typ: V(2), kennzeichen: "THW-96464", funkrufname: { kennwort: V(1), eigenerStandort: true, teile: [16, 11] }, stanKonform: true },
    { typ: VF("Anh Versorgung"), kennzeichen: "THW-94010", stanKonform: false },
    { typ: VF("MTW OV"), kennzeichen: "THW-98933", funkrufname: { kennwort: V(1), eigenerStandort: true, teile: [86, 25] }, stanKonform: false },
    { typ: VF("Anh OV"), kennzeichen: "THW-95039", stanKonform: false },
  ],
  sofortbedarf: {
    verpflegungPersonen: 20,
    dieselLiter: 0,
    benzinLiter: 0,
    gemischLiter: 0,
    unterbringung: false,
    ruhezeitErforderlich: false,
  },
};

// ---------------------------------------------------------------- Durchlauf

const svgErg = await bogenZuQrSvg(bogen);
const pngErg = await bogenZuQrPng(bogen, 600);

mkdirSync("examples", { recursive: true });
writeFileSync("examples/fgr-k-a.svg", svgErg.svg);
writeFileSync("examples/fgr-k-a.png", pngErg.png);

const s = staerke(bogen);
const mwd = unterbringungMWD(bogen);
console.log(`Bogen: FGr K (A), Stärke ${s.fuehrer}/${s.unterfuehrer}/${s.mannschaft}/${s.gesamt}, M${mwd.m}/W${mwd.w}/D${mwd.d}`);
console.log(`QR-Inhalt: ${pngErg.url.length} Zeichen (URL) → QR-Version ${pngErg.version} (ECC M)`);
console.log("Geschrieben: examples/fgr-k-a.svg, examples/fgr-k-a.png");

// Rück-Scan des PNG mit jsQR (echter QR-Decoder)
const bild = PNG.sync.read(pngErg.png);
const scan = jsQR(new Uint8ClampedArray(bild.data), bild.width, bild.height);
if (!scan) throw new Error("jsQR konnte den QR-Code nicht lesen");

if (!scan.data.startsWith(EEB_URL_PREFIX)) {
  throw new Error(`QR-Inhalt beginnt nicht mit ${EEB_URL_PREFIX}`);
}
const dekodiert = qrTextZuBogen(scan.data);

// Deep-Equal (JSON-normalisiert, damit fehlende vs. undefined-Felder gleich zählen)
deepStrictEqual(JSON.parse(JSON.stringify(dekodiert)), JSON.parse(JSON.stringify(bogen)));
console.log("✔ Rück-Scan mit jsQR + Decoder: Bogen ist identisch (Roundtrip bestanden)");
