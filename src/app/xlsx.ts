/**
 * Minimaler XLSX-Schreiber — genug, um EIN formatiertes Tabellenblatt zu bauen.
 *
 * ## Warum selbst gebaut
 *
 * Eine echte Excel-Bibliothek (SheetJS, exceljs) wiegt einige hundert Kilobyte
 * und bringt Funktionen mit, die hier keine Rolle spielen (Lesen, Pivot,
 * Diagramme, Formelauswertung). Gebraucht wird der Weg in genau eine Richtung:
 * Zellen + Stilnummern → Datei. Das sind ein ZIP-Container und zwei XML-Teile.
 * Die Kompression kommt von `pako`, das für den QR-Transport ohnehin im Bundle
 * liegt — es entsteht also keine neue Abhängigkeit (dasselbe Motiv wie bei
 * csv.ts).
 *
 * ## Was das Modul NICHT kann
 *
 * Keine gemeinsame Zeichenkettentabelle (`sharedStrings`) — Texte stehen direkt
 * in der Zelle (`inlineStr`). Das ist ein paar Prozent größer und spart den
 * halben Schreiber. Keine Bilder, keine Kommentare, kein Blatt-Schutz, immer
 * genau ein Arbeitsblatt.
 *
 * Die Stilnummern (`stil`) sind Indizes in die `<cellXfs>`-Liste der jeweils
 * übergebenen `styles.xml`. Dieses Modul kennt keine Farben und Rahmen — wer
 * ein Blatt baut, bringt seine Stiltabelle mit (siehe oldenburg-xlsx.ts).
 */

import { deflateRaw } from "pako";

// ------------------------------------------------------------------ ZIP-Teil

const CRC_TABELLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c >>> 0;
  }
  return t;
})();

function crc32(daten: Uint8Array): number {
  let c = 0xffffffff;
  for (const b of daten) c = CRC_TABELLE[(c ^ b) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/**
 * Feste Zeitstempel für alle Einträge (1980-01-01, der Nullpunkt des
 * ZIP-Formats). Bewusst nicht die Uhr: gleicher Inhalt ergibt so byteweise
 * dieselbe Datei — das macht den Export testbar und Diffs zwischen zwei
 * Ausgaben aussagekräftig.
 */
const ZIP_ZEIT = 0;
const ZIP_DATUM = 0x0021;

interface ZipEintrag {
  /** Pfad im Container, immer mit „/" ("xl/worksheets/sheet1.xml"). */
  name: string;
  daten: Uint8Array;
}

function u16(n: number): number[] {
  return [n & 0xff, (n >>> 8) & 0xff];
}

function u32(n: number): number[] {
  return [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff];
}

function alsBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function zusammen(teile: Uint8Array[]): Uint8Array<ArrayBuffer> {
  const gesamt = teile.reduce((n, t) => n + t.length, 0);
  const aus = new Uint8Array(gesamt);
  let pos = 0;
  for (const t of teile) {
    aus.set(t, pos);
    pos += t.length;
  }
  return aus;
}

/** ZIP-Container (Deflate) aus den Einträgen — Reihenfolge bleibt erhalten. */
function zipBauen(eintraege: ZipEintrag[]): Uint8Array<ArrayBuffer> {
  const koerper: Uint8Array[] = [];
  const verzeichnis: Uint8Array[] = [];
  let offset = 0;

  for (const e of eintraege) {
    const name = alsBytes(e.name);
    const gepackt = deflateRaw(e.daten, { level: 9 });
    const crc = crc32(e.daten);
    const gemeinsam = [
      ...u16(20), // benötigte Version 2.0
      ...u16(0), // keine Flags (Namen sind ASCII)
      ...u16(8), // Deflate
      ...u16(ZIP_ZEIT),
      ...u16(ZIP_DATUM),
      ...u32(crc),
      ...u32(gepackt.length),
      ...u32(e.daten.length),
      ...u16(name.length),
    ];

    const lokal = new Uint8Array([...u32(0x04034b50), ...gemeinsam, ...u16(0)]);
    koerper.push(lokal, name, gepackt);

    verzeichnis.push(
      new Uint8Array([
        ...u32(0x02014b50),
        ...u16(20), // erzeugende Version
        ...gemeinsam,
        ...u16(0), // extra
        ...u16(0), // Kommentar
        ...u16(0), // Datenträger
        ...u16(0), // interne Attribute
        ...u32(0), // externe Attribute
        ...u32(offset),
      ]),
      name,
    );

    offset += lokal.length + name.length + gepackt.length;
  }

  const vz = zusammen(verzeichnis);
  const ende = new Uint8Array([
    ...u32(0x06054b50),
    ...u16(0),
    ...u16(0),
    ...u16(eintraege.length),
    ...u16(eintraege.length),
    ...u32(vz.length),
    ...u32(offset),
    ...u16(0),
  ]);

  return zusammen([...koerper, vz, ende]);
}

// -------------------------------------------------------------- XML-Bausteine

/**
 * Text für XML-Inhalte. Steuerzeichen fliegen raus statt escaped zu werden:
 * XML 1.0 verbietet sie, und Excel weigert sich, eine Datei mit `&#1;` zu
 * öffnen. Zeilenumbrüche bleiben (in Zellen mit Umbruch-Stil gewollt), Tabs
 * werden zu Leerzeichen.
 */
export function xmlText(s: string): string {
  return s
    .replace(/\t/g, " ")
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Spaltenname aus dem 0-basierten Index: 0 → „A", 26 → „AA". */
export function spaltenName(index: number): string {
  let n = index;
  let name = "";
  do {
    name = String.fromCharCode(65 + (n % 26)) + name;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return name;
}

/**
 * Excel rechnet Datumswerte als Tage seit dem 30.12.1899 (die berühmte
 * Schaltjahr-Lücke von 1900 inklusive). Der EEB-Nullpunkt 2020-01-01 liegt dort
 * auf 43831 — damit werden aus `EebDatum`/`EebZeitpunkt` echte Excel-Datumszahlen,
 * die sich formatieren, sortieren und differenzieren lassen (statt Text).
 */
const EEB_EPOCHE_EXCEL = 43831;

export function excelDatum(tage: number): number {
  return EEB_EPOCHE_EXCEL + tage;
}

export function excelZeitpunkt(minuten: number): number {
  return EEB_EPOCHE_EXCEL + minuten / 1440;
}

/** Eine Zelle: Wert (Text, Zahl oder Formel) plus optionale Stilnummer. */
export interface Zelle {
  /** 0-basierter Spaltenindex. */
  spalte: number;
  wert?: string | number;
  /** Formel OHNE „=" („SUBTOTAL(9,AB3:AB40)"); schlägt `wert` aus. */
  formel?: string;
  /** Index in `<cellXfs>` der mitgelieferten Stiltabelle. */
  stil?: number;
}

function zelleXml(z: Zelle, zeilenNr: number): string {
  const ref = `${spaltenName(z.spalte)}${zeilenNr}`;
  const stil = z.stil != null ? ` s="${z.stil}"` : "";
  if (z.formel != null) return `<c r="${ref}"${stil}><f>${xmlText(z.formel)}</f></c>`;
  if (typeof z.wert === "number") return `<c r="${ref}"${stil}><v>${z.wert}</v></c>`;
  if (z.wert == null || z.wert === "") return `<c r="${ref}"${stil}/>`;
  return `<c r="${ref}"${stil} t="inlineStr"><is><t xml:space="preserve">${xmlText(z.wert)}</t></is></c>`;
}

/** Eine Blattzeile; Zellen müssen nach Spaltenindex aufsteigend sortiert sein. */
export function zeileXml(nr: number, zellen: Zelle[]): string {
  return `<row r="${nr}">${zellen.map((z) => zelleXml(z, nr)).join("")}</row>`;
}

// ------------------------------------------------------------------- Mappe

export interface Blatt {
  /** Registername unten im Excel-Fenster. */
  name: string;
  zeilen: string[];
  /** Belegter Bereich („A1:AL42") — Excel liest ihn als Hinweis, nicht als Grenze. */
  bereich: string;
  /** `<cols>`-Definitionen (Spaltenbreiten) als fertiges XML, optional. */
  spalten?: string;
  /** Verbundene Bereiche („A1:C1"). */
  verbund?: string[];
}

const KOPF = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const NS_PAKET = "http://schemas.openxmlformats.org/package/2006/relationships";
const NS_DOK = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

function blattXml(b: Blatt): string {
  const verbund = b.verbund?.length
    ? `<mergeCells count="${b.verbund.length}">${b.verbund.map((v) => `<mergeCell ref="${v}"/>`).join("")}</mergeCells>`
    : "";
  return (
    `${KOPF}<worksheet xmlns="${NS}"><dimension ref="${b.bereich}"/>` +
    `<sheetViews><sheetView tabSelected="1" workbookViewId="0"/></sheetViews>` +
    `<sheetFormatPr baseColWidth="10" defaultRowHeight="14.25"/>` +
    (b.spalten ?? "") +
    `<sheetData>${b.zeilen.join("")}</sheetData>${verbund}` +
    `<pageMargins left="0.7" right="0.7" top="0.787" bottom="0.787" header="0.3" footer="0.3"/></worksheet>`
  );
}

/**
 * Arbeitsmappe mit genau einem Blatt → XLSX-Bytes.
 *
 * `fullCalcOnLoad` lässt Excel alle Formeln beim Öffnen neu rechnen; deshalb
 * müssen Formelzellen keinen zwischengespeicherten Wert mitbringen.
 */
export function mappeBauen(blatt: Blatt, stile: string): Uint8Array<ArrayBuffer> {
  const teile: ZipEintrag[] = [
    {
      name: "[Content_Types].xml",
      daten: alsBytes(
        `${KOPF}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
          `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
          `<Default Extension="xml" ContentType="application/xml"/>` +
          `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
          `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
          `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
          `</Types>`,
      ),
    },
    {
      name: "_rels/.rels",
      daten: alsBytes(
        `${KOPF}<Relationships xmlns="${NS_PAKET}">` +
          `<Relationship Id="rId1" Type="${NS_DOK}/officeDocument" Target="xl/workbook.xml"/>` +
          `</Relationships>`,
      ),
    },
    {
      name: "xl/workbook.xml",
      daten: alsBytes(
        `${KOPF}<workbook xmlns="${NS}" xmlns:r="${NS_DOK}">` +
          `<sheets><sheet name="${xmlText(blatt.name)}" sheetId="1" r:id="rId1"/></sheets>` +
          `<calcPr calcId="0" fullCalcOnLoad="1"/></workbook>`,
      ),
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      daten: alsBytes(
        `${KOPF}<Relationships xmlns="${NS_PAKET}">` +
          `<Relationship Id="rId1" Type="${NS_DOK}/worksheet" Target="worksheets/sheet1.xml"/>` +
          `<Relationship Id="rId2" Type="${NS_DOK}/styles" Target="styles.xml"/>` +
          `</Relationships>`,
      ),
    },
    { name: "xl/styles.xml", daten: alsBytes(stile) },
    { name: "xl/worksheets/sheet1.xml", daten: alsBytes(blattXml(blatt)) },
  ];
  return zipBauen(teile);
}

export const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
