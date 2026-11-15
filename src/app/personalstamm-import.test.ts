// @vitest-environment jsdom
/**
 * Helferliste einlesen (CSV und Excel) für den lokalen Personalstamm.
 *
 * Die Excel-Mappen entstehen per Code: ein ZIP mit Mappe, Bezügen, Zeichenketten und Tabellenblatt, so wie Excel
 * sie schreibt (geteilte Zeichenketten, Zahlenzellen, Formelzellen mit gespeichertem Ergebnis, Lücken in der Zeile).
 */
import { describe, expect, it } from "vitest";
import { deflateRaw } from "pako";
import { Ernaehrung, Fahrerlaubnis, Geschlecht, StaerkeRolle } from "@bos/eeb-format/model";
import {
  MUSTER_KOPF,
  StammImportFehler,
  csvLesen,
  csvTabelle,
  csvTrennerErkennen,
  ernaehrungLesen,
  fahrerlaubnisLesen,
  geschlechtLesen,
  mobilLesen,
  musterCsv,
  musterXlsx,
  personenAusTabelle,
  qualifikationenLesen,
  rolleLesen,
  stammAbgleich,
  textAusBytes,
  xlsxBlaetter,
  xlsxBlattLesen,
  zipSchreiben,
  zuordnungReicht,
  zuordnungVorschlagen,
} from "./personalstamm-import";
import type { StammPerson } from "./personalstamm";
import { zipEintrag } from "./word-bogen";

const utf8 = (s: string) => new TextEncoder().encode(s);
const ALLES = { telefon: true, persoenlich: true };

/** ZIP mit „deflate", wie Excel es schreibt (die App selbst schreibt nur „stored"). */
function zip(dateien: Record<string, string>): Uint8Array {
  const teile: Uint8Array[] = [];
  const verzeichnis: Uint8Array[] = [];
  let stelle = 0;
  for (const [name, inhalt] of Object.entries(dateien)) {
    const n = utf8(name);
    const gepackt = deflateRaw(utf8(inhalt));
    const kopf = new DataView(new ArrayBuffer(30));
    kopf.setUint32(0, 0x04034b50, true);
    kopf.setUint16(8, 8, true);
    kopf.setUint32(18, gepackt.length, true);
    kopf.setUint16(26, n.length, true);
    const eintrag = new DataView(new ArrayBuffer(46));
    eintrag.setUint32(0, 0x02014b50, true);
    eintrag.setUint16(10, 8, true);
    eintrag.setUint32(20, gepackt.length, true);
    eintrag.setUint16(28, n.length, true);
    eintrag.setUint32(42, stelle, true);
    teile.push(new Uint8Array(kopf.buffer), n, gepackt);
    verzeichnis.push(new Uint8Array(eintrag.buffer), n);
    stelle += 30 + n.length + gepackt.length;
  }
  const laenge = verzeichnis.reduce((s, t) => s + t.length, 0);
  const ende = new DataView(new ArrayBuffer(22));
  ende.setUint32(0, 0x06054b50, true);
  ende.setUint16(8, verzeichnis.length / 2, true);
  ende.setUint16(10, verzeichnis.length / 2, true);
  ende.setUint32(12, laenge, true);
  ende.setUint32(16, stelle, true);
  const alle = [...teile, ...verzeichnis, new Uint8Array(ende.buffer)];
  const aus = new Uint8Array(alle.reduce((s, t) => s + t.length, 0));
  let o = 0;
  for (const t of alle) {
    aus.set(t, o);
    o += t.length;
  }
  return aus;
}

const NS = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"';

function mappe(blaetter: { name: string; ziel: string; zustand?: string }[]): Record<string, string> {
  return {
    "xl/workbook.xml": `<workbook ${NS} xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${blaetter
      .map((b, i) => `<sheet name="${b.name}" sheetId="${i + 1}" r:id="rId${i + 1}"${b.zustand ? ` state="${b.zustand}"` : ""}/>`)
      .join("")}</sheets></workbook>`,
    "xl/_rels/workbook.xml.rels": `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${blaetter
      .map((b, i) => `<Relationship Id="rId${i + 1}" Type="x" Target="${b.ziel}"/>`)
      .join("")}</Relationships>`,
  };
}

describe("CSV lesen", () => {
  it("erkennt Semikolon, Komma und Tabulator an der Kopfzeile", () => {
    expect(csvTrennerErkennen("Nachname;Vorname;Rolle\nA;B;C")).toBe(";");
    expect(csvTrennerErkennen("Nachname,Vorname,Rolle\nA,B,C")).toBe(",");
    expect(csvTrennerErkennen("Nachname\tVorname\nA\tB")).toBe("\t");
    // Komma in Anführungszeichen zählt nicht als Trenner.
    expect(csvTrennerErkennen('"Name, Vorname";Rolle\n"Meier, Anna";H')).toBe(";");
  });

  it("liest Felder in Anführungszeichen mit Trenner, Umbruch und verdoppeltem Anführungszeichen", () => {
    expect(csvTabelle('Nachname;Qualifikationen\r\n"Meier";"AGT; Motorsäge"\r\n"von ""der"" Heide";"Zeile 1\nZeile 2"\r\n')).toEqual([
      ["Nachname", "Qualifikationen"],
      ["Meier", "AGT; Motorsäge"],
      ['von "der" Heide', "Zeile 1\nZeile 2"],
    ]);
  });

  it("überspringt leere Zeilen und Zeilen nur aus Trennern", () => {
    expect(csvTabelle("Nachname;Vorname\n\n;;\nMeier;Anna\n")).toEqual([
      ["Nachname", "Vorname"],
      ["Meier", "Anna"],
    ]);
  });

  it("liest UTF-8 mit BOM und das Windows-Format, das Excel als CSV schreibt", () => {
    expect(textAusBytes(new Uint8Array([0xef, 0xbb, 0xbf, ...utf8("Müller")]))).toBe("Müller");
    // „Müller;Jörg" in Windows-1252: ü = 0xFC, ö = 0xF6 — als UTF-8 ungültig.
    expect(csvLesen(new Uint8Array([0x4d, 0xfc, 0x6c, 0x6c, 0x65, 0x72, 0x3b, 0x4a, 0xf6, 0x72, 0x67]))).toEqual([["Müller", "Jörg"]]);
    // „Unicode-Text" aus Excel: UTF-16 LE mit BOM.
    expect(textAusBytes(new Uint8Array([0xff, 0xfe, 0x4d, 0x00, 0xfc, 0x00]))).toBe("Mü");
  });
});

describe("Excel lesen", () => {
  const blattXml =
    `<worksheet ${NS}><sheetData>` +
    `<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="D1" t="inlineStr"><is><t>Mobil</t></is></c></row>` +
    `<row r="2"><c r="A2" t="s"><v>2</v></c><c r="B2" t="str"><f>CONCAT("An","na")</f><v>Anna</v></c><c r="D2"><v>1.71392E9</v></c></row>` +
    `<row r="3"></row>` +
    `<row r="4"><c r="A4" t="s"><v>3</v></c><c r="C4" t="e"><v>#N/A</v></c><c r="D4"><v>1713920002</v></c></row>` +
    `</sheetData></worksheet>`;
  const datei = zip({
    ...mappe([
      { name: "Hinweise", ziel: "worksheets/sheet1.xml" },
      { name: "Personal", ziel: "/xl/worksheets/sheet2.xml" },
      { name: "Intern", ziel: "worksheets/sheet3.xml", zustand: "hidden" },
    ]),
    "xl/sharedStrings.xml": `<sst ${NS}><si><t>Nachname</t></si><si><t>Vorname</t></si><si><r><t>Mei</t></r><r><t>er &amp; Co</t></r><rPh><t>マイヤー</t></rPh></si><si><t xml:space="preserve"> Schulz </t></si></sst>`,
    "xl/worksheets/sheet1.xml": `<worksheet ${NS}><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>Bitte ausfüllen</t></is></c></row></sheetData></worksheet>`,
    "xl/worksheets/sheet2.xml": blattXml,
    "xl/worksheets/sheet3.xml": `<worksheet ${NS}><sheetData/></worksheet>`,
  });

  it("nennt die sichtbaren Tabellenblätter mit ihrem Pfad im Archiv", () => {
    expect(xlsxBlaetter(datei)).toEqual([
      { name: "Hinweise", pfad: "xl/worksheets/sheet1.xml" },
      { name: "Personal", pfad: "xl/worksheets/sheet2.xml" },
    ]);
  });

  it("liest Werte statt Formeln, füllt Lücken und lässt leere Zeilen weg", () => {
    expect(xlsxBlattLesen(datei, "xl/worksheets/sheet2.xml")).toEqual([
      ["Nachname", "Vorname", "", "Mobil"],
      ["Meier & Co", "Anna", "", "1713920000"],
      ["Schulz", "", "", "1713920002"],
    ]);
  });

  it("schreibt ganze Zahlen aus Exponentialschreibweise ohne Exponent", () => {
    const d = zip({
      ...mappe([{ name: "T", ziel: "worksheets/sheet1.xml" }]),
      "xl/worksheets/sheet1.xml": `<worksheet ${NS}><sheetData><row><c><v>1.7139200001E10</v></c><c><v>0.30000000000000004</v></c><c t="b"><v>1</v></c></row></sheetData></worksheet>`,
    });
    expect(xlsxBlattLesen(d, "xl/worksheets/sheet1.xml")).toEqual([["17139200001", "0.3", "ja"]]);
  });

  it("meldet alte .xls-Dateien, fremde Dateien und kaputte Archive verständlich", () => {
    expect(() => xlsxBlaetter(new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0, 0, 0, 0]))).toThrow(/alte Excel-Datei|Kennwort/);
    expect(() => xlsxBlaetter(zip({ "word/document.xml": "<a/>" }))).toThrow(/keine Excel-Mappe/);
    expect(() => xlsxBlaetter(utf8("Nachname;Vorname"))).toThrow(StammImportFehler);
    expect(() => xlsxBlaetter(utf8("Nachname;Vorname"))).toThrow(/Excel-Datei ist beschädigt/);
  });
});

describe("Spaltenzuordnung", () => {
  it("erkennt die Kopfzeile der Mustervorlage vollständig", () => {
    expect(zuordnungVorschlagen(MUSTER_KOPF)).toEqual({
      nachname: 0, vorname: 1, rolle: 2, funktion: 3, qualifikationen: 4, fahrerlaubnis: 5, mobil: 6, teileinheit: 7, geschlecht: 8, ernaehrung: 9,
    });
  });

  it("erkennt abweichende Überschriften einer OV-Liste", () => {
    expect(zuordnungVorschlagen(["Nr.", "Name", "Vorname", "Fachgruppe", "Führerschein-Klasse", "Handy", "Lehrgänge"])).toEqual({
      nachname: 1, vorname: 2, teileinheit: 3, fahrerlaubnis: 4, mobil: 5, qualifikationen: 6,
    });
  });

  it("nimmt „Name“ ohne „Vorname“ als Name in einer Spalte", () => {
    const z = zuordnungVorschlagen(["Name", "Gruppe"]);
    expect(z).toEqual({ name: 0, teileinheit: 1 });
    expect(zuordnungReicht(z)).toBe(true);
    expect(zuordnungReicht(zuordnungVorschlagen(["Gruppe", "Handy"]))).toBe(false);
  });
});

describe("Werte deuten", () => {
  it("liest die Rolle aus F / UF / H, sonst aus der Funktion", () => {
    expect(rolleLesen("F", "")).toBe(StaerkeRolle.FUEHRER);
    expect(rolleLesen("uf", "")).toBe(StaerkeRolle.UNTERFUEHRER);
    expect(rolleLesen("H", "ZFü")).toBe(StaerkeRolle.MANNSCHAFT); // die Spalte „Rolle" geht vor
    expect(rolleLesen("", "GrFü")).toBe(StaerkeRolle.UNTERFUEHRER);
    expect(rolleLesen("ZFü", "")).toBe(StaerkeRolle.FUEHRER);
    expect(rolleLesen("", "Helfer")).toBe(StaerkeRolle.MANNSCHAFT);
    expect(rolleLesen("", "")).toBe(StaerkeRolle.MANNSCHAFT);
  });

  it("liest Fahrerlaubnisklassen ohne die eingeschlossenen, höchste zuerst", () => {
    expect(fahrerlaubnisLesen("B, CE").klassen).toEqual([Fahrerlaubnis.CE]);
    expect(fahrerlaubnisLesen("Kf C1E / A").klassen).toEqual([Fahrerlaubnis.C1E, Fahrerlaubnis.A]);
    expect(fahrerlaubnisLesen("Klasse B").klassen).toEqual([Fahrerlaubnis.B]);
    expect(fahrerlaubnisLesen("").klassen).toEqual([]);
    expect(fahrerlaubnisLesen("keine")).toEqual({ klassen: [], unbekannt: [] });
    expect(fahrerlaubnisLesen("3, B")).toEqual({ klassen: [Fahrerlaubnis.B], unbekannt: ["3"] });
  });

  it("liest Geschlecht, Ernährung, Qualifikationen und Rufnummern", () => {
    expect(geschlechtLesen("m")).toBe(Geschlecht.M);
    expect(geschlechtLesen("Frau")).toBe(Geschlecht.W);
    expect(geschlechtLesen("divers")).toBe(Geschlecht.D);
    expect(geschlechtLesen("")).toBeUndefined();
    expect(ernaehrungLesen("vegetarisch")).toBe(Ernaehrung.VEGETARISCH);
    expect(ernaehrungLesen("Vegan")).toBe(Ernaehrung.VEGAN);
    expect(ernaehrungLesen("Fleisch")).toBe(Ernaehrung.FLEISCH);
    expect(ernaehrungLesen("laktosefrei")).toBeUndefined();
    expect(qualifikationenLesen("AGT, Motorsäge; Sprechfunk, agt")).toEqual(["AGT", "Motorsäge", "Sprechfunk"]);
    expect(mobilLesen("1713920000")).toBe("01713920000"); // Zahlenzelle ohne führende Null
    expect(mobilLesen("0171 3920000")).toBe("0171 3920000");
    expect(mobilLesen("441123456")).toBe("441123456");
  });
});

describe("Tabelle → Personen", () => {
  const tabelle = csvTabelle(musterCsv().slice(1));
  const z = zuordnungVorschlagen(tabelle[0]!);

  it("liest die Mustervorlage vollständig", () => {
    const e = personenAusTabelle(tabelle, z, ALLES);
    expect(e.ohneName).toBe(0);
    expect(e.unbekannteKlassen).toEqual([]);
    expect(e.personen).toEqual<StammPerson[]>([
      {
        nachname: "Mustermann", vorname: "Max", rolle: StaerkeRolle.FUEHRER, funktion: "ZFü", qualifikationen: ["Sprechfunk"],
        fahrerlaubnisse: [Fahrerlaubnis.CE], mobil: "0171 3920000", teileinheit: "ZTr", geschlecht: Geschlecht.M, ernaehrung: Ernaehrung.FLEISCH,
      },
      {
        nachname: "Musterfrau", vorname: "Erika", rolle: StaerkeRolle.UNTERFUEHRER, funktion: "GrFü", qualifikationen: ["AGT", "Sprechfunk"],
        fahrerlaubnisse: [Fahrerlaubnis.C], mobil: "0171 3920001", teileinheit: "B1", geschlecht: Geschlecht.W, ernaehrung: Ernaehrung.VEGETARISCH,
      },
      {
        nachname: "Beispiel", vorname: "Kim", rolle: StaerkeRolle.MANNSCHAFT, funktion: "Helfer", qualifikationen: ["Motorsäge"],
        fahrerlaubnisse: [Fahrerlaubnis.B], teileinheit: "B1", geschlecht: Geschlecht.D, ernaehrung: Ernaehrung.VEGAN,
      },
    ]);
  });

  it("lässt Rufnummern, Geschlecht und Ernährung weg, wenn sie nicht eingelesen werden sollen", () => {
    const e = personenAusTabelle(tabelle, z, { telefon: false, persoenlich: false });
    for (const p of e.personen) {
      expect(p).not.toHaveProperty("mobil");
      expect(p).not.toHaveProperty("geschlecht");
      expect(p).not.toHaveProperty("ernaehrung");
    }
  });

  it("zerlegt den Namen aus einer Spalte und zählt Zeilen ohne Namen", () => {
    const t = [["Name", "Gruppe"], ["Meier, Anna", "B1"], ["Jens Schulz", "N"], ["", "Summe"], ["von der Heide, Ute", ""]];
    const e = personenAusTabelle(t, zuordnungVorschlagen(t[0]!), ALLES);
    expect(e.ohneName).toBe(1);
    expect(e.personen.map((p) => [p.nachname, p.vorname, p.teileinheit])).toEqual([
      ["Meier", "Anna", "B1"],
      ["Schulz", "Jens", "N"],
      ["von der Heide", "Ute", undefined],
    ]);
  });

  it("nennt Fahrerlaubnis-Angaben, die keine EU-Klasse sind", () => {
    const t = [["Nachname", "Vorname", "Fahrerlaubnis"], ["Alt", "Otto", "3"]];
    expect(personenAusTabelle(t, zuordnungVorschlagen(t[0]!), ALLES).unbekannteKlassen).toEqual(["Otto Alt: 3"]);
  });
});

describe("Abgleich beim Neu-Einlesen", () => {
  const p = (nachname: string, vorname: string, extra: Partial<StammPerson> = {}): StammPerson => ({
    nachname, vorname, rolle: StaerkeRolle.MANNSCHAFT, qualifikationen: [], fahrerlaubnisse: [], ...extra,
  });

  it("trennt neu, geändert, entfällt und unverändert", () => {
    const alt = [p("Meier", "Anna"), p("Schulz", "Jens"), p("Weg", "Willi")];
    const neu = [p("meier", "ANNA"), p("Schulz", "Jens", { qualifikationen: ["AGT"] }), p("Neu", "Nina")];
    const a = stammAbgleich(alt, neu);
    // Groß-/Kleinschreibung des Namens ist dieselbe Person, aber eine Änderung der Zeile.
    expect(a.geaendert.map((x) => x.vorname)).toEqual(["ANNA", "Jens"]);
    expect(a.neu.map((x) => x.nachname)).toEqual(["Neu"]);
    expect(a.entfaellt.map((x) => x.nachname)).toEqual(["Weg"]);
    expect(a.unveraendert).toBe(0);
  });

  it("hält gleichnamige Personen auseinander", () => {
    const a = stammAbgleich([p("Meier", "Anna"), p("Meier", "Anna", { teileinheit: "N" })], [p("Meier", "Anna")]);
    expect(a.unveraendert).toBe(1);
    expect(a.entfaellt).toHaveLength(1);
    expect(a.entfaellt[0]!.teileinheit).toBe("N");
  });
});

describe("Mustervorlage", () => {
  it("lässt sich als Excel-Mappe wieder einlesen und ergibt dieselben Personen wie die CSV", () => {
    const bytes = musterXlsx();
    const blaetter = xlsxBlaetter(bytes);
    expect(blaetter).toEqual([{ name: "Personal", pfad: "xl/worksheets/sheet1.xml" }]);
    const ausExcel = xlsxBlattLesen(bytes, blaetter[0]!.pfad);
    const ausCsv = csvLesen(utf8(musterCsv()));
    expect(ausExcel[0]).toEqual([...MUSTER_KOPF]);
    const lesen = (t: string[][]) => personenAusTabelle(t, zuordnungVorschlagen(t[0]!), ALLES).personen;
    expect(lesen(ausExcel)).toEqual(lesen(ausCsv));
    expect(lesen(ausExcel)).toHaveLength(3);
  });

  it("trägt Auswahllisten, aber weder Formeln in Zellen noch Makros", () => {
    const blatt = new TextDecoder().decode(zipEintrag(musterXlsx(), "xl/worksheets/sheet1.xml")!);
    expect(blatt).toContain('<formula1>"F,UF,H"</formula1>');
    expect(blatt).not.toContain("<f>");
    expect(zipEintrag(musterXlsx(), "xl/vbaProject.bin")).toBeNull();
  });

  it("schreibt ein ZIP, das der eigene Leser öffnet", () => {
    const z = zipSchreiben([["a/b.txt", "Größe"], ["c.txt", ""]]);
    expect(new TextDecoder().decode(zipEintrag(z, "a/b.txt")!)).toBe("Größe");
    expect(zipEintrag(z, "c.txt")).toHaveLength(0);
    expect(zipEintrag(z, "fehlt.txt")).toBeNull();
  });
});
