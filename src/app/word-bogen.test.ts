// @vitest-environment jsdom
/**
 * Import ausgefüllter THW-Word-Erfassungsbögen (.docx).
 *
 * Die Vorlagen des THW liegen nicht im Repository. Die Tests bauen deshalb
 * eine minimale .docx per Code: ein ZIP mit nur `word/document.xml`, darin die
 * Formularfeld-Strukturen (`w:ffData`, `fldChar begin/separate/end`), wie Word
 * sie schreibt — samt festem Funktionstext vor `…_Zusatzf`, Vorbelegungen und
 * den fünf Halbgeviert-Leerzeichen leerer Felder.
 */
import { describe, expect, it } from "vitest";
import { deflateRaw } from "pako";
import { decodeBinaer, encodeBinaer } from "@bos/eeb-format/codec";
import { Fahrerlaubnis, KontaktArt, MINUTEN_JE_TAG, StaerkeRolle, datumAusIso, staerke } from "@bos/eeb-format/model";
import { bogenBefund } from "./bogen-pruefung";
import { bogenAusWordBytes, wordFelderLesen, zeitraumLesen, zeitpunktLesen, zipEintrag } from "./word-bogen";
import { WordBogenFehler, istWordDatei } from "./word-bogen-fehler";

// ------------------------------------------------------------ .docx bauen

const LEER = "     ";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Textfeld; der Wert wird wie bei Word gern auf zwei Läufe verteilt. */
function feld(name: string, wert = ""): string {
  const mitte = Math.ceil(wert.length / 2);
  const ergebnis = wert
    ? `<w:r><w:t xml:space="preserve">${esc(wert.slice(0, mitte))}</w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${esc(wert.slice(mitte))}</w:t></w:r>`
    : `<w:r><w:t xml:space="preserve">${LEER}</w:t></w:r>`;
  return (
    `<w:r><w:fldChar w:fldCharType="begin"><w:ffData><w:name w:val="${name}"/><w:enabled/><w:textInput/></w:ffData></w:fldChar></w:r>` +
    `<w:r><w:instrText xml:space="preserve"> FORMTEXT </w:instrText></w:r>` +
    `<w:r><w:fldChar w:fldCharType="separate"/></w:r>${ergebnis}<w:r><w:fldChar w:fldCharType="end"/></w:r>`
  );
}

/** Kästchen: `checked` angekreuzt, sonst nur die Vorgabe. */
function kasten(name: string, an: boolean): string {
  const zustand = an ? `<w:checked/>` : `<w:default w:val="0"/>`;
  return (
    `<w:r><w:fldChar w:fldCharType="begin"><w:ffData><w:name w:val="${name}"/><w:enabled/><w:checkBox><w:sizeAuto/>${zustand}</w:checkBox></w:ffData></w:fldChar></w:r>` +
    `<w:r><w:instrText xml:space="preserve"> FORMCHECKBOX </w:instrText></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r>`
  );
}

function zelle(fest: string, ...inhalt: string[]): string {
  const vorn = fest ? `<w:r><w:t xml:space="preserve">${esc(fest)}</w:t></w:r>` : "";
  return `<w:tc><w:p>${vorn}${inhalt.join("")}</w:p></w:tc>`;
}

function zeile(...zellen: string[]): string {
  return `<w:tr>${zellen.join("")}</w:tr>`;
}

function dokument(koerper: string): string {
  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${koerper}</w:body></w:document>`
  );
}

function crc32(d: Uint8Array): number {
  let c = ~0;
  for (const b of d) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

/** Minimales ZIP (deflate) aus Name → Inhalt. */
function zip(dateien: Record<string, string>): Uint8Array {
  const enc = new TextEncoder();
  const lokal: Uint8Array[] = [];
  const zentral: Uint8Array[] = [];
  let versatz = 0;
  for (const [name, inhalt] of Object.entries(dateien)) {
    const roh = enc.encode(inhalt);
    const gepackt = deflateRaw(roh);
    const n = enc.encode(name);
    const kopf = new Uint8Array(30 + n.length);
    const k = new DataView(kopf.buffer);
    k.setUint32(0, 0x04034b50, true);
    k.setUint16(4, 20, true);
    k.setUint16(8, 8, true);
    k.setUint32(14, crc32(roh), true);
    k.setUint32(18, gepackt.length, true);
    k.setUint32(22, roh.length, true);
    k.setUint16(26, n.length, true);
    kopf.set(n, 30);
    const z = new Uint8Array(46 + n.length);
    const zv = new DataView(z.buffer);
    zv.setUint32(0, 0x02014b50, true);
    zv.setUint16(4, 20, true);
    zv.setUint16(6, 20, true);
    zv.setUint16(10, 8, true);
    zv.setUint32(16, crc32(roh), true);
    zv.setUint32(20, gepackt.length, true);
    zv.setUint32(24, roh.length, true);
    zv.setUint16(28, n.length, true);
    zv.setUint32(42, versatz, true);
    z.set(n, 46);
    lokal.push(kopf, gepackt);
    zentral.push(z);
    versatz += kopf.length + gepackt.length;
  }
  const zGroesse = zentral.reduce((s, z) => s + z.length, 0);
  const ende = new Uint8Array(22);
  const e = new DataView(ende.buffer);
  e.setUint32(0, 0x06054b50, true);
  e.setUint16(8, zentral.length, true);
  e.setUint16(10, zentral.length, true);
  e.setUint32(12, zGroesse, true);
  e.setUint32(16, versatz, true);
  const teile = [...lokal, ...zentral, ende];
  const alles = new Uint8Array(teile.reduce((s, t) => s + t.length, 0));
  let i = 0;
  for (const t of teile) {
    alles.set(t, i);
    i += t.length;
  }
  return alles;
}

function docx(koerper: string): Uint8Array {
  return zip({ "[Content_Types].xml": "<Types/>", "word/document.xml": dokument(koerper) });
}

// ------------------------------------------------- Beispiel: FGr K (A), ausgefüllt

interface Person {
  funktion: string;
  zusatz?: string;
  name?: string;
  ov?: string;
}

function fuehrungsZeile(n: number, p: Person, mobil = "", dienstlich = false, privat = false, mail = ""): string {
  return zeile(
    zelle(p.funktion, feld(`FüKr_${n}_Zusatzf`, p.zusatz ?? "")),
    zelle("", feld(`FüKr_${n}_Name`, p.name ?? "")),
    zelle("", feld(`FüKr_${n}_OV`, p.ov ?? "")),
    zelle("Mobil: ", feld(`FüKr_${n}_Mobil`, mobil), kasten(`FüKr_${n}_Mobil_dientli`, dienstlich), kasten(`FüKr_${n}_Mobil_privat`, privat)),
    ...(n === 1 ? [zelle("Mail: ", feld(`FüKr_${n}_Mail`, mail || "@thw.de"))] : []),
  );
}

function helferZeile(n: number, p: Person): string {
  return zeile(zelle(p.funktion, feld(`He_${n}_Zusatzf`, p.zusatz ?? "")), zelle("", feld(`He_${n}_Name`, p.name ?? "")), zelle("", feld(`He_${n}_OV`, p.ov ?? "")));
}

function fahrzeugZeile(n: number, typ: string, kennz = "THW-", furn = "", ja = false, nein = false, sonder = ""): string {
  return zeile(
    zelle("", feld(`Fz_${n}`, typ)),
    zelle("", feld(`Fz_${n}_Kennz`, kennz)),
    zelle("", feld(`Fz_${n}_FuRn`, furn)),
    zelle("ja ", kasten(`Fz_${n}_StAN_ja`, ja), kasten(`Fz_${n}_StAN_nein`, nein)),
    zelle("", feld(`Fz_${n}_Sonder`, sonder)),
  );
}

function ebene(kurz: string, name: string, tel = "", fax = "- 18", mail = "@thw.de"): string {
  return zeile(
    zelle(`${kurz}: `, feld(kurz, name)),
    zelle("Tel.: ", feld(`${kurz}_Tel`, tel)),
    zelle("Fax: ", feld(`${kurz}_Fax`, fax)),
    zelle("Mail: ", feld(`${kurz}_Mail`, mail)),
  );
}

function fgrKBogen(): string {
  const helfer: Person[] = [
    { funktion: "TrFü /", name: "Trupp, Tina", zusatz: "Spr" },
    { funktion: "He /", name: "Beispiel, Ben", zusatz: "SanHe, Kf CE" },
    { funktion: "He /", name: "Ohnename", ov: "Nachbarstadt" },
  ];
  let he = "";
  for (let n = 1; n <= 17; n++) he += helferZeile(n, helfer[n - 1] ?? { funktion: "He /" });
  return (
    `<w:p>${feld("Teileinheit", "FGr Kommunikation (A)")}</w:p>` +
    `<w:p>${feld("Fü", "0")}${feld("UFü", "2")}${feld("He", "1")}${feld("Gesamt", "3")}</w:p>` +
    `<w:p>${feld("FüKr", "Muster, Max")}</w:p>` +
    `<w:tbl>${ebene("OV", "Musterstadt", "0441 123450", "- 18", "ov-musterstadt@thw.de")}${ebene("RB", "Oldenburg", "", "0441 999- 18")}${ebene("LV", "")}</w:tbl>` +
    `<w:p>${feld("Einsatzzeitraum", "1.1.25 - 31.12.27")}${feld("Einsatzort", "Hochwasser Hunte, BR Wardenburg")}${feld("Einsatzbeginn", "4:12")}${feld("Einsatzende", "")}</w:p>` +
    `<w:tbl>${fahrzeugZeile(1, "MTW FGr", "THW-84397", "Heros Musterstadt 43/12", true)}${fahrzeugZeile(2, "Anh K")}${fahrzeugZeile(3, "Kühlschrank-Lkw", "OL-AB 12", "", false, true, "Kühlaufbau")}${fahrzeugZeile(4, "")}${fahrzeugZeile(5, "")}</w:tbl>` +
    `<w:tbl>${fuehrungsZeile(1, { funktion: "GrFü /", name: "Muster, Max", zusatz: "" }, "0171 1234567", true, false, "max.muster@thw.de")}${fuehrungsZeile(2, { funktion: "GrFü /" }, "")}${fuehrungsZeile(3, { funktion: "TrFü /" }, "")}</w:tbl>` +
    `<w:tbl>${he}</w:tbl>` +
    `<w:tbl>${zeile(zelle("", feld("int_ext_He_1_Name", "Beispiel, Ben")), zelle("", feld("int_ext_He_1_Quali", "Elektrofachkraft; Motorsäge")))}` +
    `${zeile(zelle("", feld("int_ext_He_2_Name", "Unbekannt, Uwe")), zelle("", feld("int_ext_He_2_Quali", "Bootsführer")))}</w:tbl>` +
    `<w:p>${kasten("Verpflegung", true)}${feld("Personenzahl", "4")}${feld("Vegetarier", "1")}${kasten("Betriebsstoff", true)}${feld("Liter_Diesel", "120")}${feld("Liter_Benzin", "")}${feld("Liter_Gemisch", "5")}` +
    `${kasten("Ruhezeit", false)}${kasten("Unterbringung", true)}${feld("Männlich", "3")}${feld("Weiblich", "1")}${feld("Divers", "")}</w:p>` +
    `<w:p>${feld("Neues_Feld", "Rückfrage an OB")}</w:p>`
  );
}

// ---------------------------------------------------------------- Tests

describe("Word-Formularfelder lesen", () => {
  it("liest Textfelder über mehrere Läufe, Kästchen und den festen Text vor dem Feld", () => {
    const xml = dokument(`<w:tbl>${helferZeile(1, { funktion: "GrFü /", name: "Muster, Max", zusatz: "Spr" })}</w:tbl>${kasten("Ruhezeit", true)}${feld("Leer")}`);
    const felder = wordFelderLesen(xml);
    expect(felder.find((f) => f.name === "He_1_Name")?.text).toBe("Muster, Max");
    expect(felder.find((f) => f.name === "He_1_Zusatzf")).toMatchObject({ text: "Spr", davor: "GrFü /" });
    expect(felder.find((f) => f.name === "Ruhezeit")?.angekreuzt).toBe(true);
    // Fünf Halbgeviert-Leerzeichen = leeres Feld.
    expect(felder.find((f) => f.name === "Leer")?.text).toBe("");
  });

  it("holt document.xml aus dem ZIP", () => {
    const bytes = docx(`<w:p>${feld("Teileinheit", "Stabspersonal")}</w:p>`);
    const xml = new TextDecoder().decode(zipEintrag(bytes, "word/document.xml")!);
    expect(xml).toContain("Stabspe");
    expect(wordFelderLesen(xml)[0]?.text).toBe("Stabspersonal");
    expect(zipEintrag(bytes, "word/fehlt.xml")).toBeNull();
  });
});

describe("Word-Bogen → Erfassungsbogen", () => {
  const { bogen, quittung } = bogenAusWordBytes(docx(fgrKBogen()));

  it("übernimmt Einheitstyp und Hierarchie, filtert Vorbelegungen", () => {
    expect(bogen.einheit.einheitsTyp).toEqual({ code: 43 }); // FGr K (A)
    expect(bogen.einheit.hierarchie).toEqual([
      { bezeichnung: { code: 1 }, name: "Musterstadt", telefon: "0441123450", email: "ov-musterstadt@thw.de" },
      { bezeichnung: { code: 2 }, name: "Oldenburg" },
    ]);
  });

  it("liest Zeitraum, Ort und Einsatzbeginn", () => {
    expect(bogen.einsatz.zeitraumVon).toBe(datumAusIso("2025-01-01"));
    expect(bogen.einsatz.zeitraumBis).toBe(datumAusIso("2027-12-31"));
    expect(bogen.einsatz.ortAuftrag).toBe("Hochwasser Hunte, BR Wardenburg");
    expect(bogen.einsatz.einsatzbeginn).toBe(datumAusIso("2025-01-01") * MINUTEN_JE_TAG + 4 * 60 + 12);
    expect(bogen.einsatz.einsatzende).toBeUndefined();
  });

  it("baut das Personal mit Funktion aus dem festen Text, Stärkerolle, Kontakten und Dienststelle", () => {
    expect(bogen.personal.map((p) => [p.nachname, p.vorname])).toEqual([
      ["Muster", "Max"],
      ["Trupp", "Tina"],
      ["Beispiel", "Ben"],
      ["Ohnename", ""],
    ]);
    const [gf, tf, he, he2] = bogen.personal;
    expect(gf!.funktionen).toEqual([{ code: 3 }]);
    expect(gf!.staerkeRolle).toBe(StaerkeRolle.UNTERFUEHRER);
    expect(gf!.kontakte).toEqual([
      { art: KontaktArt.MOBIL, dienstlich: true, wert: "01711234567" },
      { art: KontaktArt.EMAIL, dienstlich: true, wert: "max.muster@thw.de" },
    ]);
    expect(tf!.funktionen).toEqual([{ code: 4 }, { code: 30 }]); // TrFü + Spr
    expect(he!.staerkeRolle).toBe(StaerkeRolle.MANNSCHAFT);
    expect(he!.funktionen).toEqual([{ code: 5 }, { code: 31 }]); // He + SanHe
    expect(he!.fahrerlaubnis).toBe(Fahrerlaubnis.CE);
    expect(he!.zusatzqualifikationen).toEqual([{ freitext: "Elektrofachkraft" }, { freitext: "Motorsäge" }]);
    expect(he2!.dienststelle).toBe("Nachbarstadt");
    expect(staerke(bogen)).toEqual({ fuehrer: 0, unterfuehrer: 2, mannschaft: 2, gesamt: 4 });
  });

  it("nimmt nur ausgefüllte Fahrzeugzeilen, Typ aus dem Vokabular oder als Freitext", () => {
    expect(bogen.fahrzeuge).toEqual([
      {
        typ: { code: 5 },
        kennzeichen: "THW-84397",
        funkrufname: { kennwort: { code: 1 }, eigenerStandort: true, teile: [43, 12] },
        stanKonform: true,
      },
      { typ: { freitext: "Kühlschrank-Lkw" }, kennzeichen: "OL-AB 12", stanKonform: false, aenderungen: "Kühlaufbau" },
    ]);
  });

  it("übernimmt den Sofortbedarf", () => {
    expect(bogen.sofortbedarf).toEqual({
      verpflegungPersonen: 4,
      dieselLiter: 120,
      benzinLiter: 0,
      gemischLiter: 5,
      unterbringung: true,
      ruhezeitErforderlich: false,
    });
  });

  it("schreibt Nicht-Zuordenbares nach Sonstiges", () => {
    const s = bogen.sonstiges ?? "";
    expect(s).toContain("Fax: RB 0441 999- 18");
    expect(s).not.toContain("OV - 18");
    expect(s).toContain("Qualifikation Unbekannt, Uwe: Bootsführer");
    expect(s).toContain("Verpflegung: davon vegetarisch 1");
    expect(s).toContain("Unterbringung: männlich 3, weiblich 1, divers –");
    expect(s).toContain("Neues_Feld: Rückfrage an OB");
  });

  it("quittiert Übernommenes, Sonstiges und Verworfenes", () => {
    const text = quittung.join(" ");
    expect(text).toContain("2 Führungskräfte, 2 Helfer/innen, 2 Fahrzeuge");
    expect(text).toContain("Unter „Sonstiges“ eingetragen: Faxnummern");
    expect(text).toContain("1 Fahrzeugzeile nur mit der StAN-Vorbelegung");
    expect(text).toContain("weicht von den Personalzeilen ab (gezählt 0/2/2/4)");
    expect(text).toContain("Einsatzbeginn ohne Datum");
  });

  it("ergibt einen gültigen, transportfähigen Bogen", () => {
    const kopie = structuredClone(bogen);
    expect(bogenBefund(kopie)).toMatchObject({ ok: true, ergaenzt: [] });
    const zurueck = decodeBinaer(encodeBinaer(bogen));
    expect(zurueck.personal).toHaveLength(4);
    expect(zurueck.einheit.einheitsTyp).toEqual({ code: 43 });
    expect(zurueck.sonstiges).toBe(bogen.sonstiges);
  });
});

describe("Vorlagen-Varianten", () => {
  it("Zugtrupp: ZFü zählt als Führer; Kopf-Führungskraft füllt eine leere erste Zeile", () => {
    const koerper =
      `<w:p>${feld("Teileinheit", "Zugtrupp Technischer Zug")}${feld("FüKr", "Zugführer, Zora")}</w:p>` +
      `<w:tbl>${fuehrungsZeile(1, { funktion: "ZFü /" }, "0160 5555", false, true)}${helferZeile(1, { funktion: "He /", name: "Helfer" })}</w:tbl>` +
      `<w:tbl>${ebene("OV", "Musterstadt")}</w:tbl>`;
    const { bogen } = bogenAusWordBytes(docx(koerper));
    expect(bogen.einheit.einheitsTyp).toEqual({ code: 3 });
    expect(bogen.personal[0]).toMatchObject({ nachname: "Zugführer", vorname: "Zora", staerkeRolle: StaerkeRolle.FUEHRER, funktionen: [{ code: 1 }] });
    expect(bogen.personal[0]!.kontakte).toEqual([{ art: KontaktArt.MOBIL, dienstlich: false, wert: "01605555" }]);
    expect(bogen.sonstiges ?? "").not.toContain("Führungskraft laut Kopf");
  });

  it("Stab, Tanklogistik und ENT: Einheitstyp und Funktion aus dem festen Text", () => {
    const stab = bogenAusWordBytes(docx(`<w:p>${feld("Teileinheit", "Stabspersonal")}</w:p><w:tbl>${fuehrungsZeile(1, { funktion: "SGL /", name: "Stab, Sam", zusatz: "SGL S3" })}</w:tbl>`)).bogen;
    expect(stab.einheit.einheitsTyp).toEqual({ code: 45 });
    expect(stab.personal[0]).toMatchObject({ staerkeRolle: StaerkeRolle.FUEHRER, funktionen: [{ code: 7 }, { code: 75 }] });

    const tl = bogenAusWordBytes(docx(`<w:p>${feld("Teileinheit", "Tr Logistik-Tanklogistik")}</w:p><w:tbl>${helferZeile(1, { funktion: "He /", name: "Tank" })}</w:tbl>`)).bogen;
    expect(tl.einheit.einheitsTyp).toEqual({ code: 49 });

    const ent = bogenAusWordBytes(docx(`<w:p>${feld("Teileinheit", "Einsatznachsorgeteam")}</w:p><w:tbl>${fuehrungsZeile(1, { funktion: "psFK /", name: "Nachsorge" })}</w:tbl>`)).bogen;
    expect(ent.personal[0]).toMatchObject({ staerkeRolle: StaerkeRolle.UNTERFUEHRER, funktionen: [{ code: 12 }] });
  });

  it("Sonstige: Einheitstyp bleibt offen, FüKr als Freitext-Funktion", () => {
    const { bogen, quittung } = bogenAusWordBytes(
      docx(`<w:p>${feld("Teileinheit", "Sonstige")}</w:p><w:tbl>${fuehrungsZeile(1, { funktion: "FüKr /", name: "Leitung, Lea" })}</w:tbl>`),
    );
    expect(bogen.einheit.einheitsTyp).toEqual({});
    expect(bogen.personal[0]!.funktionen).toEqual([{ freitext: "FüKr" }]);
    expect(quittung.join(" ")).toContain("Einheitstyp offen");
  });
});

describe("Ablehnungen mit verständlichem Satz", () => {
  it("leere Vorlage", () => {
    expect(() => bogenAusWordBytes(docx(`<w:p>${feld("Teileinheit", "FGr Kommunikation (A)")}</w:p><w:tbl>${fahrzeugZeile(1, "MTW FGr")}</w:tbl>`))).toThrow(/nichts ausgefüllt/);
  });

  it("fremdes Word-Dokument, alte .doc, kein ZIP, ZIP ohne Dokument", () => {
    expect(() => bogenAusWordBytes(docx("<w:p><w:r><w:t>Brief</w:t></w:r></w:p>"))).toThrow(/kein THW-Erfassungsbogen/);
    expect(() => bogenAusWordBytes(new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0, 0]))).toThrow(/\.doc/);
    expect(() => bogenAusWordBytes(new TextEncoder().encode("{}"))).toThrow(WordBogenFehler);
    expect(() => bogenAusWordBytes(zip({ "a.txt": "x" }))).toThrow(/kein Word-Dokument/);
    expect(() => bogenAusWordBytes(docx("").subarray(0, 40))).toThrow(/beschädigt/);
  });

  it("erkennt Word-Dateien an Endung oder MIME-Typ", () => {
    expect(istWordDatei({ name: "EEB.DOCX", type: "" })).toBe(true);
    expect(istWordDatei({ name: "bogen", type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" })).toBe(true);
    expect(istWordDatei({ name: "bogen.pdf", type: "application/pdf" })).toBe(false);
  });
});

describe("Zeitangaben", () => {
  const heute = datumAusIso("2026-11-09");
  it("Zeitraum in den üblichen Schreibweisen", () => {
    expect(zeitraumLesen("1.1.25 - 31.12.27", heute)).toEqual({ von: datumAusIso("2025-01-01"), bis: datumAusIso("2027-12-31") });
    expect(zeitraumLesen("12.03.2026", heute)).toEqual({ von: datumAusIso("2026-03-12"), bis: datumAusIso("2026-03-12") });
    expect(zeitraumLesen("12.3.–14.3.26", heute)).toEqual({ von: datumAusIso("2026-03-12"), bis: datumAusIso("2026-03-14") });
    expect(zeitraumLesen("ab sofort", heute)).toBeUndefined();
    expect(zeitraumLesen("31.12.26 - 1.1.26", heute)).toBeUndefined();
  });
  it("Zeitpunkt mit und ohne Datum", () => {
    const tag = datumAusIso("2026-03-12");
    expect(zeitpunktLesen("4:12", tag, heute)).toEqual({ zeitpunkt: tag * MINUTEN_JE_TAG + 252, mitDatum: false });
    expect(zeitpunktLesen("13.3.26 08:00 Uhr", tag, heute)).toEqual({ zeitpunkt: (tag + 1) * MINUTEN_JE_TAG + 480, mitDatum: true });
    expect(zeitpunktLesen("früh", tag, heute)).toBeUndefined();
  });
});
