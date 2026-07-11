/**
 * Machbarkeitsnachweis: passt ein Einheiten-Erfassungsbogen in EINEN QR-Code?
 *
 * Referenzimplementierung des Binärformats "EEB2" (siehe docs/datenmodell.md),
 * organisationsübergreifend (BOS + Sonstige). Zwei Szenarien:
 *
 *   1. Voller THW-Bogen: FGr Kommunikation (A), FZ FK Oldenburg,
 *      Übung "Kabelblitz 2026" — 20 Personen einzeln, 6 Fahrzeuge.
 *   2. Meldekopf-Schnellerfassung: Feuerwehr-Löschzug ohne eigenen Bogen —
 *      nur Stärke, Führungskraft-Kontakt, 4 Fahrzeuge mit zivilen Kennzeichen.
 *   3. Wie 1, aber mit Standort-Verzeichnis-Referenz (THW-OV-Nummer statt
 *      Name/Hierarchie/Kontakten — Verzeichnis wird mit der App ausgeliefert).
 *
 * Aufruf: node prototype/qr-size-check.mjs
 */

import zlib from "node:zlib";

// Zeitfelder: einheitlich numerisch (siehe src/model.ts — kein Unix-Timestamp,
// Kalendertage zeitzonenfrei als Tage seit 2020-01-01, uint16 im QR).
const EEB_EPOCHE_MS = Date.UTC(2020, 0, 1);
const datumAusIso = (iso) => {
  const [j, m, t] = iso.split("-").map(Number);
  return Math.round((Date.UTC(j, m - 1, t) - EEB_EPOCHE_MS) / 86_400_000);
};

// ------------------------------------------------------------------ Enums

const ORG = { THW: 1, FEUERWEHR: 2, SONSTIGE: 255 };
const ROLLE = { MANNSCHAFT: 0, UNTERFUEHRER: 1, FUEHRER: 2 };
const FE = { NONE: 0, B: 5, BE: 6, C: 9, CE: 10 }; // EU-Klassen, 4 Bit
const G = { M: 0, W: 1, D: 2 };
const KART = { MOBIL: 0, FESTNETZ: 1, EMAIL: 2 };

// Organisationsspezifische Vokabulare (Auszug; Stufe 2: vollständige Tabellen).
// Ein VokabularWert ist { code } ODER { freitext }.
const V = (code) => ({ code });
const VF = (freitext) => ({ freitext });

// THW-Funktionen: 1=GrFü 2=TrFü 3=He 4=SGL 5=FüGeh | FW: 1=Zugführer 2=Gruppenführer 3=Maschinist 4=AGT
// THW-Fahrzeuge:  1=FmKW 2=MzKW 3=FüKW 4=MTW 20=Anh2t 21=AnhVers | FW: 1=ELW1 2=LF20 3=DLK23 4=TLF
// Hierarchie-Ebenen THW: 1=OV 2=RB 3=LV | FW: 1=Gemeinde 2=Landkreis
// Funkrufname-Kennwörter (global): 1=Heros 2=Florian 3=Rotkreuz 4=Akkon 5=Johannes 6=Sama 7=Pelikan

// ------------------------------------------------------------- Binärwriter

class Writer {
  constructor() {
    this.buf = [];
  }
  u8(n) {
    this.buf.push(n & 0xff);
  }
  u16(n) {
    this.u8(n & 0xff);
    this.u8(n >>> 8);
  }
  varint(n) {
    while (n > 0x7f) {
      this.u8((n & 0x7f) | 0x80);
      n = Math.floor(n / 128);
    }
    this.u8(n);
  }
  str(s) {
    const b = Buffer.from(s, "utf8");
    this.varint(b.length);
    for (const byte of b) this.u8(byte);
  }
  /** VokabularWert: Varint-Code, 0 = Freitext folgt. */
  vokab(v) {
    if (v.code != null) this.varint(v.code);
    else {
      this.varint(0);
      this.str(v.freitext);
    }
  }
  /** Telefonnummer: Ziffern BCD-gepackt, 2 Ziffern pro Byte. */
  bcd(digits) {
    this.varint(digits.length);
    for (let i = 0; i < digits.length; i += 2) {
      const hi = digits.charCodeAt(i) - 48;
      const lo = i + 1 < digits.length ? digits.charCodeAt(i + 1) - 48 : 0xf;
      this.u8((hi << 4) | lo);
    }
  }
  /** EebDatum (Tage seit 2020-01-01) als uint16. */
  datum(tage) {
    this.u16(tage);
  }
  bytes() {
    return Buffer.from(this.buf);
  }
}

// --------------------------------------------- Beispiel 1: voller THW-Bogen

const P = (vorname, nachname, rolle, funktionen, fahrerlaubnis, geschlecht, kontakte = []) => ({
  vorname, nachname, staerkeRolle: rolle, funktionen, fahrerlaubnis, geschlecht, kontakte,
  zusatzqualifikationen: [],
});
const mobilP = (nr) => ({ art: KART.MOBIL, dienstlich: false, wert: nr });
const emailTemplate = () => ({ art: KART.EMAIL, dienstlich: true, emailTemplate: 1 });

const bogenTHW = {
  schemaVersion: 2,
  stand: datumAusIso("2026-05-14"),
  einheit: {
    organisation: ORG.THW,
    einheitsTyp: V(1), // FGr K (A)
    name: "OV Oldenburg - Ni",
    hierarchie: [
      { bezeichnung: V(1), name: "Oldenburg - Ni", telefon: "04413401050", email: "ov-oldenburg-ni@thw.de" },
      { bezeichnung: V(2), name: "Oldenburg", telefon: "04413611180", email: "poststelle.rst_oldenburg@thw.de" },
      { bezeichnung: V(3), name: "Bremen, Niedersachsen", telefon: "051133690100", email: "poststelle.lvhbni@thw.de" },
    ],
  },
  einsatz: {
    zeitraumVon: datumAusIso("2025-05-14"),
    zeitraumBis: datumAusIso("2025-05-17"),
    ortAuftrag: "Fernmeldebauübung Kabelblitz",
  },
  personalErfassung: 0, // VOLLSTAENDIG
  personal: [
    P("Johannes", "Rudolph", ROLLE.UNTERFUEHRER, [V(1), V(4)], FE.C, G.M, [mobilP("01701234501"), emailTemplate()]),
    P("Jonas", "Bergmann", ROLLE.UNTERFUEHRER, [V(2), V(5)], FE.B, G.M, [mobilP("01701234502")]),
    P("Michael", "Sturm", ROLLE.UNTERFUEHRER, [V(2), V(4)], FE.CE, G.M, [mobilP("01701234503")]),
    P("Lukas", "Hansen", ROLLE.MANNSCHAFT, [V(3)], FE.CE, G.M),
    P("Arne", "Petersen", ROLLE.MANNSCHAFT, [V(3), V(4)], FE.CE, G.M),
    P("Tim", "Berger", ROLLE.MANNSCHAFT, [V(3)], FE.B, G.M),
    P("Jan", "Winter", ROLLE.MANNSCHAFT, [V(3)], FE.BE, G.M),
    P("Jannik", "Krause", ROLLE.MANNSCHAFT, [V(3)], FE.BE, G.M),
    P("Felix", "Brandt", ROLLE.MANNSCHAFT, [V(3)], FE.BE, G.M),
    P("Tom", "Fischer", ROLLE.MANNSCHAFT, [V(3), V(5)], FE.B, G.M),
    P("Doris", "Hartmann", ROLLE.MANNSCHAFT, [V(3), V(5)], FE.NONE, G.W),
    P("Anna", "Weber", ROLLE.MANNSCHAFT, [V(3)], FE.NONE, G.W),
    P("Miriam", "Vogt", ROLLE.MANNSCHAFT, [V(3)], FE.NONE, G.W),
    P("Lena", "Michels", ROLLE.MANNSCHAFT, [V(3)], FE.BE, G.W),
    P("Sebastian", "Braun", ROLLE.MANNSCHAFT, [V(3)], FE.NONE, G.M),
    P("Luca", "Clausen", ROLLE.MANNSCHAFT, [V(3)], FE.NONE, G.M),
    P("Stefan", "Haase", ROLLE.MANNSCHAFT, [V(3)], FE.NONE, G.M),
    P("Lasse", "Zimmer", ROLLE.MANNSCHAFT, [V(3)], FE.NONE, G.M),
    P("Theo", "Petersen", ROLLE.MANNSCHAFT, [V(3)], FE.NONE, G.M),
    P("Theo", "Meier", ROLLE.MANNSCHAFT, [V(3)], FE.NONE, G.M),
  ],
  fahrzeuge: [
    { typ: V(1), thwKennzeichen: 84397, funkrufname: { kennwort: V(1), eigenerStandort: true, teile: [18, 13] }, stanKonform: true },
    { typ: V(2), thwKennzeichen: 90272, funkrufname: { kennwort: V(1), eigenerStandort: true, teile: [24, 54] }, stanKonform: false },
    { typ: V(3), thwKennzeichen: 96464, funkrufname: { kennwort: V(1), eigenerStandort: true, teile: [16, 11] }, stanKonform: true },
    { typ: V(21), thwKennzeichen: 94010, stanKonform: false },
    { typ: V(4), thwKennzeichen: 98933, funkrufname: { kennwort: V(1), eigenerStandort: true, teile: [86, 25] }, stanKonform: false },
    { typ: V(20), thwKennzeichen: 95039, stanKonform: false },
  ],
  sofortbedarf: {
    verpflegungPersonen: 20, davonVegetarisch: 0,
    dieselLiter: 0, benzinLiter: 0, gemischLiter: 0,
    unterbringung: false, ruhezeitErforderlich: false,
  },
};

// ----------------------- Beispiel 2: Meldekopf-Schnellerfassung (Feuerwehr)

const bogenFW = {
  schemaVersion: 2,
  stand: datumAusIso("2026-05-14"),
  einheit: {
    organisation: ORG.FEUERWEHR,
    organisationName: "Freiwillige Feuerwehr Wardenburg",
    einheitsTyp: VF("Löschzug"),
    name: "LZ Wardenburg",
    hierarchie: [
      { bezeichnung: V(1), name: "Wardenburg" }, // Gemeinde
      { bezeichnung: V(2), name: "Oldenburg" }, // Landkreis
    ],
  },
  einsatz: {
    zeitraumVon: datumAusIso("2025-05-14"),
    zeitraumBis: datumAusIso("2025-05-17"),
    ortAuftrag: "Fernmeldebauübung Kabelblitz",
  },
  personalErfassung: 1, // NUR_STAERKE — Einheit ohne eigenen Bogen, erfasst am Meldekopf
  personal: [
    P("Max", "Mustermann", ROLLE.FUEHRER, [V(1)], FE.CE, G.M, [mobilP("01701234567")]),
  ],
  staerkeManuell: { fuehrer: 1, unterfuehrer: 3, mannschaft: 18, gesamt: 22 },
  unterbringungManuell: { m: 19, w: 3, d: 0 },
  fahrzeuge: [
    { typ: V(1), kennzeichenFreitext: "OL-FW 2011", funkrufname: { kennwort: V(2), eigenerStandort: true, teile: [11, 12, 1] } },
    { typ: V(2), kennzeichenFreitext: "OL-FW 2041", funkrufname: { kennwort: V(2), eigenerStandort: true, teile: [11, 48, 1] } },
    { typ: V(2), kennzeichenFreitext: "OL-FW 2042", funkrufname: { kennwort: V(2), eigenerStandort: true, teile: [11, 48, 2] } },
    { typ: V(4), kennzeichenFreitext: "OL-FW 2023", funkrufname: { kennwort: V(2), eigenerStandort: true, teile: [11, 23, 1] } },
  ],
  sofortbedarf: {
    verpflegungPersonen: 22, davonVegetarisch: 2,
    dieselLiter: 200, benzinLiter: 0, gemischLiter: 0,
    unterbringung: true, ruhezeitErforderlich: true,
  },
};

// ---------------------------------------------------------------- Encoder

function encodeKontakt(w, k) {
  // Bit 0-1: Art, Bit 2: dienstlich, Bit 3: Email-Template statt Freitext
  const isTemplate = k.art === KART.EMAIL && k.emailTemplate;
  w.u8(k.art | (k.dienstlich ? 4 : 0) | (isTemplate ? 8 : 0));
  if (isTemplate) w.u8(k.emailTemplate);
  else if (k.art === KART.EMAIL) w.str(k.wert);
  else w.bcd(k.wert);
}

function encodePerson(w, p) {
  w.str(p.vorname);
  w.str(p.nachname);
  // 4 Bit Fahrerlaubnis + 2 Bit Geschlecht + 2 Bit Stärkerolle = 1 Byte
  w.u8(p.fahrerlaubnis | (p.geschlecht << 4) | (p.staerkeRolle << 6));
  w.varint(p.funktionen.length);
  for (const f of p.funktionen) w.vokab(f);
  w.varint(p.kontakte.length);
  for (const k of p.kontakte) encodeKontakt(w, k);
  w.varint(p.zusatzqualifikationen.length);
  for (const q of p.zusatzqualifikationen) w.vokab(q);
}

function encodeFahrzeug(w, f) {
  const flags =
    (f.stanKonform != null ? 1 : 0) |
    (f.stanKonform ? 2 : 0) |
    (f.funkrufname ? 4 : 0) |
    (f.aenderungen ? 8 : 0) |
    (f.thwKennzeichen != null ? 16 : 0);
  w.u8(flags);
  w.vokab(f.typ);
  if (f.thwKennzeichen != null) w.varint(f.thwKennzeichen);
  else w.str(f.kennzeichenFreitext);
  if (f.funkrufname) {
    const fr = f.funkrufname;
    w.u8(fr.eigenerStandort ? 1 : 0);
    w.vokab(fr.kennwort);
    if (!fr.eigenerStandort) w.str(fr.ort);
    w.varint(fr.teile.length);
    for (const t of fr.teile) w.u8(t);
  }
  if (f.aenderungen) w.str(f.aenderungen);
}

function encodeBogen(b) {
  const w = new Writer();
  w.varint(b.schemaVersion);
  w.datum(b.stand);

  const e = b.einheit;
  w.u8(e.organisation);
  w.u8((e.organisationName ? 1 : 0) | (e.standortRef != null ? 2 : 0));
  if (e.organisationName) w.str(e.organisationName);
  w.vokab(e.einheitsTyp);
  if (e.standortRef != null) {
    // Name, Hierarchie und Kontakte kommen beim Decodieren aus dem
    // mitgelieferten Standort-Verzeichnis (THW: OV-Nummer).
    w.varint(e.standortRef);
  } else {
    w.str(e.name);
    w.varint(e.hierarchie.length);
    for (const h of e.hierarchie) {
      w.u8((h.telefon ? 1 : 0) | (h.email ? 2 : 0));
      w.vokab(h.bezeichnung);
      w.str(h.name);
      if (h.telefon) w.bcd(h.telefon);
      if (h.email) w.str(h.email);
    }
  }

  const ez = b.einsatz;
  w.u8((ez.einsatzbeginn ? 1 : 0) | (ez.einsatzende ? 2 : 0));
  w.datum(ez.zeitraumVon);
  w.datum(ez.zeitraumBis);
  w.str(ez.ortAuftrag);

  w.u8(
    b.personalErfassung |
      (b.staerkeManuell ? 2 : 0) |
      (b.unterbringungManuell ? 4 : 0),
  );
  if (b.staerkeManuell) {
    const s = b.staerkeManuell;
    w.u8(s.fuehrer);
    w.u8(s.unterfuehrer);
    w.u8(s.mannschaft); // gesamt = Summe, wird nicht kodiert
  }
  if (b.unterbringungManuell) {
    w.u8(b.unterbringungManuell.m);
    w.u8(b.unterbringungManuell.w);
    w.u8(b.unterbringungManuell.d);
  }
  w.varint(b.personal.length);
  for (const p of b.personal) encodePerson(w, p);

  w.varint(b.fahrzeuge.length);
  for (const f of b.fahrzeuge) encodeFahrzeug(w, f);

  const s = b.sofortbedarf;
  w.u8(s ? 1 : 0);
  if (s) {
    w.u8(s.verpflegungPersonen);
    w.u8(s.davonVegetarisch);
    w.varint(s.dieselLiter);
    w.varint(s.benzinLiter);
    w.varint(s.gemischLiter);
    w.u8((s.unterbringung ? 1 : 0) | (s.ruhezeitErforderlich ? 2 : 0));
  }
  w.u8(b.sonstiges ? 1 : 0);
  if (b.sonstiges) w.str(b.sonstiges);
  return w.bytes();
}

// -------------------------------------------------- QR-Kapazitäten (Byte-Modus)
// ISO/IEC 18004, Datenkapazität in Bytes je Version für ECC L / M.

const QR_BYTES = [
  [1, 17, 14], [2, 32, 26], [3, 53, 42], [4, 78, 62], [5, 106, 86],
  [6, 134, 106], [7, 154, 122], [8, 192, 152], [9, 230, 180], [10, 271, 213],
  [11, 321, 251], [12, 367, 287], [13, 425, 331], [14, 458, 362], [15, 520, 412],
  [16, 586, 450], [17, 644, 504], [18, 718, 560], [19, 792, 624], [20, 858, 666],
  [21, 929, 711], [22, 1003, 779], [23, 1091, 857], [24, 1171, 911], [25, 1273, 997],
  [26, 1367, 1059], [27, 1465, 1125], [28, 1528, 1190], [29, 1628, 1264], [30, 1732, 1370],
  [31, 1840, 1452], [32, 1952, 1538], [33, 2068, 1628], [34, 2188, 1722], [35, 2303, 1809],
  [36, 2431, 1911], [37, 2563, 1989], [38, 2699, 2099], [39, 2809, 2213], [40, 2953, 2331],
];

function qrVersion(byteLen, ecc /* 1 = L, 2 = M */) {
  for (const row of QR_BYTES) if (row[ecc] >= byteLen) return row[0];
  return null;
}

function describe(byteLen, ecc, label) {
  const v = qrVersion(byteLen, ecc);
  if (!v) return `${label}: passt NICHT in einen QR-Code`;
  const modules = 17 + 4 * v;
  const mm = (modules * 0.5).toFixed(0); // 0,5 mm Modulgröße — konservativ für 300-dpi-Druck
  return `${label}: QR Version ${v} (${modules}×${modules} Module, ≈ ${mm}×${mm} mm bei 0,5 mm/Modul)`;
}

// ------------------------------------------------------------------- Messen

function messen(name, bogen) {
  const binaer = encodeBogen(bogen);
  const json = Buffer.from(JSON.stringify(bogen), "utf8");
  const deflated = zlib.deflateRawSync(binaer, { level: 9 });
  const payload = Buffer.concat([Buffer.from("EEB2", "ascii"), deflated]);

  // Gegenprobe: Dekomprimieren liefert exakt den Binärstrom zurück
  if (!zlib.inflateRawSync(payload.subarray(4)).equals(binaer)) {
    throw new Error("Roundtrip fehlgeschlagen!");
  }

  console.log(`── ${name} ${"─".repeat(Math.max(0, 60 - name.length))}`);
  console.log(`JSON (lesbar):                 ${json.length.toString().padStart(5)} Bytes`);
  console.log(`EEB2-Binärformat:              ${binaer.length.toString().padStart(5)} Bytes`);
  console.log(`QR-Payload ('EEB2' + Deflate): ${payload.length.toString().padStart(5)} Bytes  (−${(100 - (payload.length / json.length) * 100).toFixed(1)} % ggü. JSON)`);
  console.log(describe(payload.length, 2, "ECC M (15 % Fehlerkorrektur)"));
  console.log(describe(payload.length, 1, "ECC L ( 7 % Fehlerkorrektur)"));
  console.log();
}

// Szenario 3: wie 1, aber OV per Verzeichnis-Referenz (fiktive OV-Nummer).
const bogenTHWRef = {
  ...bogenTHW,
  einheit: { ...bogenTHW.einheit, standortRef: 1540, hierarchie: [] },
};

messen("Voller THW-Bogen: FGr K (A), 20 Personen, 6 Fahrzeuge", bogenTHW);
messen("Meldekopf-Schnellerfassung: FF-Löschzug, nur Stärke, 4 Fzg.", bogenFW);
messen("THW-Bogen wie oben, OV als Verzeichnis-Referenz", bogenTHWRef);
