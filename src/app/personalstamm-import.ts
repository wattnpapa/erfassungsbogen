/**
 * Helferliste einlesen: CSV (.csv) oder Excel (.xlsx) → Personen des lokalen Personalstamms (personalstamm.ts).
 *
 * Bewusst OHNE neue Abhängigkeit, wie der Word-Import (word-bogen.ts): Eine .xlsx ist ein ZIP mit XML-Dateien.
 * Das ZIP öffnet derselbe Leser wie beim Word-Bogen (`zipEintrag`, pako mit Größengrenze), das XML liest der
 * DOMParser des Browsers. Gelesen werden nur Zellwerte — bei Formeln das zuletzt berechnete Ergebnis, das Excel
 * mitspeichert. Formeln selbst, Makros, Verknüpfungen und eingebettete Objekte fasst der Leser nicht an.
 *
 * Ablauf: Datei → Tabelle (Zeilen aus Texten) → Spaltenzuordnung (Vorschlag aus der Kopfzeile, von Hand
 * änderbar, weil jede Liste anders aussieht) → Personen. Alles reine Funktionen; die Oberfläche steht in
 * personalstamm-ui.tsx.
 *
 * Nur nachgeladen: Der Leser gehört zum Fenster „Personal einlesen…" und bleibt aus dem Startbündel.
 */

import { Ernaehrung, Fahrerlaubnis, Geschlecht, StaerkeRolle } from "@bos/eeb-format/model";
import { CSV_BOM, CSV_TRENNER, csvDatei, csvZeile } from "./csv";
import { FE_EINGESCHLOSSEN } from "./hilfen";
import { parseNamen, rolleAusFunktion } from "./personal-schnell";
import { STAMM_MAX_PERSONEN, type StammPerson } from "./personalstamm";
import { zipEintrag } from "./word-bogen";

/** Fehler beim Einlesen einer Helferliste. Der Text ist immer ein ganzer Satz für die Oberfläche. */
export class StammImportFehler extends Error {
  constructor(meldung: string) {
    super(meldung);
    this.name = "StammImportFehler";
  }
}

/** Größte Datei, die gelesen wird. Eine Helferliste hat wenige hundert Kilobyte. */
export const MAX_STAMM_DATEI = 10 * 1024 * 1024;
/** Größte entpackte XML-Datei einer Excel-Mappe (Tabellenblatt, Zeichenketten). */
const MAX_XLSX_XML = 40 * 1024 * 1024;
/** Mehr Spalten liest der Import nicht; schützt vor Blättern mit verirrten Zellen weit rechts. */
const MAX_SPALTEN = 60;

/** Zeilen einer Tabelle, jede Zelle als Text. Zeile 0 ist die Kopfzeile. */
export type Tabelle = string[][];

/**
 * Was die Dateifelder vorschlagen. Alte .xls-Dateien stehen mit in der Liste, obwohl sie nicht gelesen werden:
 * Wer eine wählt, bekommt gesagt, wie sie zu speichern ist — statt die Datei im Auswahlfenster ausgegraut zu sehen.
 */
export const STAMM_DATEI_ARTEN =
  ".csv,text/csv,.xlsx,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xls,application/vnd.ms-excel,.txt,text/plain";

export function istExcelDatei(datei: Pick<File, "name" | "type">): boolean {
  return /\.(xlsx|xlsm|xls)$/i.test(datei.name) || datei.type.startsWith("application/vnd.openxmlformats-officedocument.spreadsheetml") || datei.type === "application/vnd.ms-excel";
}

// ------------------------------------------------------------------- CSV lesen

/**
 * Bytes → Text. UTF-8 (mit oder ohne BOM), UTF-16 mit BOM („Unicode-Text" aus Excel) und sonst Windows-1252 —
 * so schreibt Excel(DE) beim schlichten „Speichern unter → CSV". Ohne die Unterscheidung wurde aus „Müller"
 * ein „MÃ¼ller" oder ein Ersatzzeichen.
 */
export function textAusBytes(bytes: Uint8Array): string {
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder("utf-16le").decode(bytes.subarray(2));
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder("utf-16be").decode(bytes.subarray(2));
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return text.startsWith(CSV_BOM) ? text.slice(1) : text;
  } catch {
    return new TextDecoder("windows-1252").decode(bytes);
  }
}

/** Trenner der Kopfzeile: Semikolon (Excel DE), Komma oder Tabulator — der häufigste außerhalb von Anführungszeichen. */
export function csvTrennerErkennen(text: string): string {
  const zaehler: Record<string, number> = { ";": 0, ",": 0, "\t": 0 };
  let inQuote = false;
  for (const z of text) {
    if (z === '"') inQuote = !inQuote;
    else if (!inQuote && (z === "\n" || z === "\r")) break;
    else if (!inQuote && z in zaehler) zaehler[z]!++;
  }
  // Bei Gleichstand gewinnt das Semikolon: Ein deutsches CSV mit Dezimalkomma hat sonst zu viele Spalten.
  const [bester, anzahl] = Object.entries(zaehler).sort((x, y) => y[1] - x[1] || (x[0] === CSV_TRENNER ? -1 : 1))[0]!;
  return anzahl > 0 ? bester : CSV_TRENNER;
}

/** CSV-Text → Tabelle. Felder in Anführungszeichen dürfen Trenner, Umbrüche und verdoppelte Anführungszeichen tragen. */
export function csvTabelle(text: string, trenner = csvTrennerErkennen(text)): Tabelle {
  const zeilen: Tabelle = [];
  let zeile: string[] = [];
  let feld = "";
  let inQuote = false;
  let zeileHatInhalt = false;
  const feldEnde = () => {
    zeile.push(feld.trim());
    feld = "";
  };
  const zeilenEnde = () => {
    feldEnde();
    if (zeileHatInhalt) zeilen.push(zeile);
    zeile = [];
    zeileHatInhalt = false;
  };
  for (let i = 0; i < text.length; i++) {
    const z = text[i]!;
    if (inQuote) {
      if (z === '"') {
        if (text[i + 1] === '"') {
          feld += '"';
          i++;
        } else inQuote = false;
      } else feld += z;
      continue;
    }
    if (z === '"' && feld.trim() === "") {
      inQuote = true;
      feld = "";
      zeileHatInhalt = true;
    } else if (z === trenner) feldEnde();
    else if (z === "\n") zeilenEnde();
    else if (z === "\r") {
      /* gehört zum Zeilenende, kommt nie ins Feld */
    } else {
      feld += z;
      if (z.trim() !== "") zeileHatInhalt = true;
    }
  }
  zeilenEnde();
  return zeilen;
}

/** CSV-Datei → Tabelle (Kodierung und Trenner werden erkannt). */
export function csvLesen(bytes: Uint8Array): Tabelle {
  return csvTabelle(textAusBytes(bytes));
}

// ------------------------------------------------------------------ Excel lesen

/** Ein Tabellenblatt der Mappe: Name wie in Excel und Pfad der Datei im ZIP. */
export interface XlsxBlatt {
  name: string;
  pfad: string;
}

const KAPUTT = "Die Excel-Datei ist beschädigt oder unvollständig. Bitte in Excel öffnen und erneut als .xlsx speichern.";

function xlsxXml(bytes: Uint8Array, pfad: string): Document | null {
  let daten: Uint8Array | null;
  try {
    daten = zipEintrag(bytes, pfad, MAX_XLSX_XML);
  } catch {
    // Der ZIP-Leser spricht von der Word-Datei; hier ist es die Excel-Datei.
    throw new StammImportFehler(KAPUTT);
  }
  if (!daten) return null;
  const doc = new DOMParser().parseFromString(new TextDecoder().decode(daten), "application/xml");
  if (doc.getElementsByTagName("parsererror").length > 0) throw new StammImportFehler(KAPUTT);
  return doc;
}

function elemente(wurzel: Document | Element, lokal: string): Element[] {
  return Array.from(wurzel.getElementsByTagName("*")).filter((e) => e.localName === lokal);
}

function kinder(el: Element, lokal: string): Element[] {
  return Array.from(el.children).filter((k) => k.localName === lokal);
}

/** Attribut ohne Rücksicht auf das Namensraum-Kürzel (`r:id`, `d3p1:id`). */
function attributLokal(el: Element, lokal: string): string | null {
  for (const a of Array.from(el.attributes)) if (a.localName === lokal && a.name !== lokal) return a.value;
  return el.getAttribute(lokal);
}

/**
 * Die Tabellenblätter einer .xlsx in der Reihenfolge der Mappe; ausgeblendete Blätter bleiben außen vor, solange
 * es ein sichtbares gibt. Wirft `StammImportFehler` bei alten .xls-Dateien, Kennwortschutz und kaputten Mappen.
 */
export function xlsxBlaetter(bytes: Uint8Array): XlsxBlatt[] {
  // Altes Excel-Format und kennwortgeschützte Mappen sind kein ZIP, sondern ein OLE-Verbunddokument.
  if (bytes.length >= 4 && bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0) {
    throw new StammImportFehler(
      "Diese Datei ist eine alte Excel-Datei (.xls) oder mit einem Kennwort geschützt. Bitte in Excel ohne Kennwort als .xlsx oder als CSV speichern und erneut einlesen.",
    );
  }
  const mappe = xlsxXml(bytes, "xl/workbook.xml");
  if (!mappe) throw new StammImportFehler("Das ist keine Excel-Mappe (.xlsx). Eingelesen werden .xlsx- und .csv-Dateien.");
  const bezuege = new Map<string, string>();
  const rels = xlsxXml(bytes, "xl/_rels/workbook.xml.rels");
  for (const r of rels ? elemente(rels, "Relationship") : []) {
    const id = r.getAttribute("Id");
    const ziel = r.getAttribute("Target");
    if (!id || !ziel) continue;
    bezuege.set(id, ziel.startsWith("/") ? ziel.slice(1) : `xl/${ziel.replace(/^\.\//, "")}`);
  }
  const alle = elemente(mappe, "sheet").map((s, i) => {
    const rid = attributLokal(s, "id");
    return {
      name: s.getAttribute("name") ?? `Blatt ${i + 1}`,
      pfad: (rid && bezuege.get(rid)) || `xl/worksheets/sheet${i + 1}.xml`,
      versteckt: /hidden/i.test(s.getAttribute("state") ?? ""),
      // Diagramm- und Makroblätter tragen keine Tabelle.
      tabelle: !/chartsheets|dialogsheets|macrosheets/.test((rid && bezuege.get(rid)) || ""),
    };
  });
  const lesbar = alle.filter((b) => b.tabelle);
  const sichtbar = lesbar.filter((b) => !b.versteckt);
  const liste = sichtbar.length > 0 ? sichtbar : lesbar;
  if (liste.length === 0) throw new StammImportFehler("Die Excel-Datei enthält kein Tabellenblatt.");
  return liste.map(({ name, pfad }) => ({ name, pfad }));
}

/** Text eines `<si>` oder `<is>`: alle `<t>` der Läufe, ohne die Lautschrift (`<rPh>`) ostasiatischer Texte. */
function zeichenketteText(el: Element): string {
  let text = "";
  for (const t of elemente(el, "t")) {
    let p: Element | null = t.parentElement;
    let lautschrift = false;
    for (; p && p !== el; p = p.parentElement) if (p.localName === "rPh") lautschrift = true;
    if (!lautschrift) text += t.textContent ?? "";
  }
  return text;
}

/** Spaltenbuchstaben einer Zelladresse („C7", „AB12") → Spaltenindex ab 0. */
function spalteAusAdresse(adresse: string): number {
  let n = 0;
  for (const z of adresse) {
    const c = z.toUpperCase().charCodeAt(0);
    if (c < 65 || c > 90) break;
    n = n * 26 + (c - 64);
  }
  return n - 1;
}

/**
 * Zahl einer Zelle als Text. Excel speichert „0171 1234567" in einer Zahlenzelle als 1711234567 oder
 * 1.711234567E9; ganze Zahlen stehen deshalb ohne Exponent und Nachkommastellen da.
 */
function zahlText(roh: string): string {
  const n = Number(roh);
  if (!Number.isFinite(n)) return roh;
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return String(n);
  // Rechenungenauigkeit der Speicherung („0.30000000000000004") nicht in die Liste tragen.
  return String(Number(n.toPrecision(12)));
}

/** Ein Tabellenblatt → Tabelle. Leere Zeilen entfallen, jede Zelle steht als Text da. */
export function xlsxBlattLesen(bytes: Uint8Array, pfad: string): Tabelle {
  const blatt = xlsxXml(bytes, pfad);
  if (!blatt) throw new StammImportFehler(KAPUTT);
  const texte = xlsxXml(bytes, "xl/sharedStrings.xml");
  const geteilt = texte ? elemente(texte, "si").map(zeichenketteText) : [];
  const zeilen: Tabelle = [];
  for (const r of elemente(blatt, "row")) {
    const zeile: string[] = [];
    let naechste = 0;
    for (const c of kinder(r, "c")) {
      const adresse = c.getAttribute("r");
      const spalte = adresse ? spalteAusAdresse(adresse) : naechste;
      naechste = spalte + 1;
      if (spalte < 0 || spalte >= MAX_SPALTEN) continue;
      const typ = c.getAttribute("t") ?? "n";
      const v = kinder(c, "v")[0]?.textContent ?? "";
      let wert: string;
      if (typ === "s") wert = geteilt[Number(v)] ?? "";
      else if (typ === "inlineStr") wert = kinder(c, "is").map(zeichenketteText).join("");
      else if (typ === "b") wert = v === "1" ? "ja" : "nein";
      else if (typ === "e") wert = ""; // Fehlerwert (#NV, #BEZUG!) ist keine Angabe
      else if (typ === "n") wert = v === "" ? "" : zahlText(v);
      else wert = v; // "str": Ergebnis einer Textformel; "d": Datum als ISO-Text
      while (zeile.length < spalte) zeile.push("");
      zeile[spalte] = wert.replace(/\r\n?/g, "\n").trim();
    }
    if (zeile.some((w) => w !== "")) zeilen.push(zeile);
    if (zeilen.length > STAMM_MAX_PERSONEN + 50) break;
  }
  return zeilen;
}

// ------------------------------------------------------------ Spaltenzuordnung

export type StammFeld =
  | "nachname"
  | "vorname"
  | "name"
  | "rolle"
  | "funktion"
  | "qualifikationen"
  | "fahrerlaubnis"
  | "mobil"
  | "teileinheit"
  | "geschlecht"
  | "ernaehrung";

/** Die Felder des Stamms in der Reihenfolge der Mustervorlage, mit dem Text für die Zuordnung. */
export const STAMM_FELDER: ReadonlyArray<{ feld: StammFeld; titel: string; hilfe?: string }> = [
  { feld: "nachname", titel: "Nachname" },
  { feld: "vorname", titel: "Vorname" },
  { feld: "name", titel: "Name in einer Spalte", hilfe: "nur wenn Vor- und Nachname in derselben Spalte stehen („Meier, Anna“ oder „Anna Meier“)" },
  { feld: "rolle", titel: "Rolle (F / UF / H)", hilfe: "für die Stärke; fehlt sie, zählt die Funktion" },
  { feld: "funktion", titel: "Funktion" },
  { feld: "qualifikationen", titel: "Qualifikationen", hilfe: "mehrere mit Komma getrennt" },
  { feld: "fahrerlaubnis", titel: "Fahrerlaubnis", hilfe: "Klassen wie B, BE, C, CE" },
  { feld: "mobil", titel: "Mobil / Telefon" },
  { feld: "teileinheit", titel: "Teileinheit", hilfe: "Gruppe, Trupp oder Fachgruppe; Filter bei der Auswahl" },
  { feld: "geschlecht", titel: "Geschlecht" },
  { feld: "ernaehrung", titel: "Ernährung" },
];

/** Zu jedem Feld der Index der Spalte in der Datei; fehlt = nicht einlesen. */
export type Zuordnung = Partial<Record<StammFeld, number>>;

/** Vergleichsform einer Überschrift: klein, ohne Umlaute, nur Buchstaben. */
function kopfSchluessel(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z]/g, "");
}

/** Überschriften, wie sie in Helferlisten üblich sind (THWin-Auszüge, eigene Tabellen). Verglichen als `kopfSchluessel`. */
const KOPF_NAMEN: Record<StammFeld, readonly string[]> = {
  nachname: ["nachname", "name", "familienname", "zuname", "lastname", "surname"],
  vorname: ["vorname", "rufname", "firstname", "givenname"],
  name: ["vollername", "vollstaendigername", "helfer", "helferin", "person", "nameundvorname", "namevorname", "vornamename", "vornamenachname", "nachnamevorname"],
  rolle: ["rolle", "staerkerolle", "staerke", "fufh", "fuehrungsrolle"],
  funktion: ["funktion", "funktionen", "dienststellung", "position", "grundfunktion", "hauptfunktion"],
  qualifikationen: ["qualifikationen", "qualifikation", "zusatzqualifikationen", "zusatzqualifikation", "lehrgaenge", "ausbildungen", "ausbildung", "befaehigungen", "zusatzfunktionen"],
  fahrerlaubnis: ["fahrerlaubnis", "fahrerlaubnisse", "fuehrerschein", "fuehrerscheinklasse", "fuehrerscheinklassen", "fahrerlaubnisklasse", "fahrerlaubnisklassen", "fe", "feklasse", "klasse", "klassen", "fs", "fsklasse", "fsklassen", "fuehrerscheine"],
  mobil: ["mobil", "mobiltelefon", "mobilnummer", "handy", "handynummer", "telefon", "telefonnummer", "tel", "rufnummer", "mobildienstlich", "telefonmobil"],
  teileinheit: ["teileinheit", "einheit", "gruppe", "fachgruppe", "trupp", "zug", "te", "organisationseinheit", "oe"],
  geschlecht: ["geschlecht", "mwd", "sex", "gender", "anrede"],
  ernaehrung: ["ernaehrung", "verpflegung", "kost", "kostform", "essen"],
};

/**
 * Vorschlag aus der Kopfzeile: je Feld die erste Spalte mit einer bekannten Überschrift. „Name" gilt als Nachname,
 * wenn es auch eine Spalte „Vorname" gibt, sonst als Name in einer Spalte.
 */
export function zuordnungVorschlagen(kopf: readonly string[]): Zuordnung {
  const schluessel = kopf.map(kopfSchluessel);
  const z: Zuordnung = {};
  const vergeben = new Set<number>();
  for (const { feld } of STAMM_FELDER) {
    for (const kandidat of KOPF_NAMEN[feld]) {
      const i = schluessel.findIndex((s, j) => s === kandidat && !vergeben.has(j));
      if (i >= 0) {
        z[feld] = i;
        vergeben.add(i);
        break;
      }
    }
  }
  // Nur „Name", kein „Vorname": Die Spalte trägt den ganzen Namen.
  if (z.nachname != null && z.vorname == null && z.name == null && schluessel[z.nachname] === "name") {
    z.name = z.nachname;
    delete z.nachname;
  }
  return z;
}

/** Reicht die Zuordnung zum Einlesen? Pflicht ist allein der Name. */
export function zuordnungReicht(z: Zuordnung): boolean {
  return z.nachname != null || z.name != null;
}

// ------------------------------------------------------------- Werte deuten

const ROLLE_TEXT: ReadonlyArray<readonly [RegExp, StaerkeRolle]> = [
  [/^(f|fue|fuehrer|fuehrerin|fuehrung|fuehrungskraft)$/, StaerkeRolle.FUEHRER],
  [/^(uf|u|ufue|unterfuehrer|unterfuehrerin)$/, StaerkeRolle.UNTERFUEHRER],
  [/^(h|m|he|helfer|helferin|helfende|mannschaft|ma)$/, StaerkeRolle.MANNSCHAFT],
];

/** Rolle aus der Spalte „Rolle" (F / UF / H); passt nichts, entscheidet die Funktion; sonst Mannschaft. */
export function rolleLesen(rolle: string, funktion: string): StaerkeRolle {
  const s = kopfSchluessel(rolle);
  const direkt = ROLLE_TEXT.find(([muster]) => muster.test(s))?.[1];
  return direkt ?? (rolle ? rolleAusFunktion(rolle) : undefined) ?? (funktion ? rolleAusFunktion(funktion) : undefined) ?? StaerkeRolle.MANNSCHAFT;
}

const KLASSEN: Record<string, Fahrerlaubnis> = {
  am: Fahrerlaubnis.AM, a1: Fahrerlaubnis.A1, a2: Fahrerlaubnis.A2, a: Fahrerlaubnis.A, b: Fahrerlaubnis.B,
  be: Fahrerlaubnis.BE, c1: Fahrerlaubnis.C1, c1e: Fahrerlaubnis.C1E, c: Fahrerlaubnis.C, ce: Fahrerlaubnis.CE,
  d1: Fahrerlaubnis.D1, d1e: Fahrerlaubnis.D1E, d: Fahrerlaubnis.D, de: Fahrerlaubnis.DE,
};

/**
 * „B, CE", „Kf CE", „Klasse C1E / A" → Klassen ohne die, die eine andere einschließt (CE bringt C und B mit),
 * höchste zuerst. `unbekannt`: Angaben, die keine EU-Klasse sind (alte Klasse „3", Schreibfehler).
 */
export function fahrerlaubnisLesen(text: string): { klassen: Fahrerlaubnis[]; unbekannt: string[] } {
  const gefunden = new Set<Fahrerlaubnis>();
  const unbekannt: string[] = [];
  for (const teil of text.split(/[\s,;/+&|]+/)) {
    const t = teil.trim().toLowerCase().replace(/[.:()]/g, "");
    if (!t || /^(kf|kl|klasse|klassen|fe|fahrerlaubnis|fuehrerschein|führerschein|und|keine|nein|ohne)$/.test(t) || t === "-" || t === "—") continue;
    const k = KLASSEN[t];
    if (k != null) gefunden.add(k);
    else unbekannt.push(teil.trim());
  }
  const klassen = [...gefunden]
    .filter((k) => ![...gefunden].some((andere) => andere !== k && FE_EINGESCHLOSSEN[andere].includes(k)))
    .sort((a, b) => b - a);
  return { klassen, unbekannt };
}

export function geschlechtLesen(text: string): Geschlecht | undefined {
  const s = kopfSchluessel(text);
  if (/^(m|maennlich|mann|herr|male)$/.test(s)) return Geschlecht.M;
  if (/^(w|f|weiblich|frau|female)$/.test(s)) return Geschlecht.W;
  if (/^(d|divers|diverse|x)$/.test(s)) return Geschlecht.D;
  return undefined;
}

export function ernaehrungLesen(text: string): Ernaehrung | undefined {
  const s = kopfSchluessel(text);
  if (!s) return undefined;
  if (s.startsWith("vegan")) return Ernaehrung.VEGAN;
  if (s.startsWith("veget") || s === "veg" || s === "vegi" || s === "veggie") return Ernaehrung.VEGETARISCH;
  if (/^(fleisch|normal|mischkost|alles|standard|mitfleisch|vollkost|keinebesonderheit)$/.test(s)) return Ernaehrung.FLEISCH;
  return undefined;
}

/** „AGT, Motorsäge; Sprechfunk" → einzelne Qualifikationen ohne Dubletten. */
export function qualifikationenLesen(text: string): string[] {
  const liste: string[] = [];
  for (const teil of text.split(/[,;\n|]+/)) {
    const t = teil.trim();
    if (t && !liste.some((q) => q.toLowerCase() === t.toLowerCase())) liste.push(t);
  }
  return liste;
}

/**
 * Rufnummer aus einer Tabellenzelle. In einer Zahlenzelle fehlt die führende Null („1711234567"): Beginnt die
 * Ziffernfolge wie eine deutsche Mobilnummer ohne Null, kommt sie wieder davor.
 */
export function mobilLesen(text: string): string {
  const t = text.trim();
  return /^1[567]\d{8,9}$/.test(t) ? `0${t}` : t;
}

// ------------------------------------------------------------ Tabelle → Personen

export interface StammImportOptionen {
  /** Rufnummern mit einlesen? */
  telefon: boolean;
  /** Geschlecht und Ernährung mit einlesen? */
  persoenlich: boolean;
}

export interface StammImportErgebnis {
  personen: StammPerson[];
  /** Zeilen ohne Namen (Zwischenüberschriften, Summenzeilen) — nicht eingelesen. */
  ohneName: number;
  /** Zeilen jenseits der Obergrenze — nicht eingelesen. */
  zuViele: number;
  /** Fahrerlaubnis-Angaben, die keine EU-Klasse sind, mit dem Namen der Person. */
  unbekannteKlassen: string[];
}

/** Zeilen unter der Kopfzeile → Personen des Stamms, nach der gewählten Zuordnung. */
export function personenAusTabelle(tabelle: Tabelle, z: Zuordnung, opt: StammImportOptionen): StammImportErgebnis {
  const zelle = (zeile: readonly string[], feld: StammFeld) => (z[feld] != null ? (zeile[z[feld]!] ?? "").trim() : "");
  const ergebnis: StammImportErgebnis = { personen: [], ohneName: 0, zuViele: 0, unbekannteKlassen: [] };
  for (const zeile of tabelle.slice(1)) {
    let nachname = zelle(zeile, "nachname");
    let vorname = zelle(zeile, "vorname");
    const ganz = zelle(zeile, "name");
    if (!nachname && ganz) {
      // Nur der Name: Funktion und Rufnummer haben eigene Spalten und werden dort gelesen.
      const gelesen = parseNamen(ganz.replace(/[\t;]/g, " "))[0];
      nachname = gelesen?.nachname ?? ganz;
      vorname = vorname || gelesen?.vorname || "";
    }
    if (!nachname && !vorname) {
      ergebnis.ohneName++;
      continue;
    }
    if (ergebnis.personen.length >= STAMM_MAX_PERSONEN) {
      ergebnis.zuViele++;
      continue;
    }
    const funktion = zelle(zeile, "funktion");
    const fe = fahrerlaubnisLesen(zelle(zeile, "fahrerlaubnis"));
    if (fe.unbekannt.length > 0) ergebnis.unbekannteKlassen.push(`${[vorname, nachname].filter(Boolean).join(" ")}: ${fe.unbekannt.join(", ")}`);
    const mobil = opt.telefon ? mobilLesen(zelle(zeile, "mobil")) : "";
    const teileinheit = zelle(zeile, "teileinheit");
    const geschlecht = opt.persoenlich ? geschlechtLesen(zelle(zeile, "geschlecht")) : undefined;
    const ernaehrung = opt.persoenlich ? ernaehrungLesen(zelle(zeile, "ernaehrung")) : undefined;
    ergebnis.personen.push({
      nachname,
      vorname,
      rolle: rolleLesen(zelle(zeile, "rolle"), funktion),
      ...(funktion ? { funktion } : {}),
      qualifikationen: qualifikationenLesen(zelle(zeile, "qualifikationen")),
      fahrerlaubnisse: fe.klassen,
      ...(mobil ? { mobil } : {}),
      ...(teileinheit ? { teileinheit } : {}),
      ...(geschlecht != null ? { geschlecht } : {}),
      ...(ernaehrung != null ? { ernaehrung } : {}),
    });
  }
  return ergebnis;
}

// ------------------------------------------------------------ Abgleich beim Neu-Einlesen

export interface StammAbgleich {
  neu: StammPerson[];
  geaendert: StammPerson[];
  entfaellt: StammPerson[];
  unveraendert: number;
}

/** Wiedererkennung über den Namen; gleichnamige Personen werden in der Reihenfolge der Liste durchgezählt. */
function namensSchluessel(personen: readonly StammPerson[]): string[] {
  const zaehler = new Map<string, number>();
  return personen.map((p) => {
    const k = `${p.nachname.trim().toLowerCase()}|${p.vorname.trim().toLowerCase()}`;
    const n = (zaehler.get(k) ?? 0) + 1;
    zaehler.set(k, n);
    return `${k}|${n}`;
  });
}

/** Feldreihenfolge der Ablage spielt für den Vergleich keine Rolle. */
function vergleichsText(p: StammPerson): string {
  return JSON.stringify(Object.entries(p).sort(([a], [b]) => a.localeCompare(b)));
}

/** Was ändert das Neu-Einlesen gegenüber dem abgelegten Stamm? Grundlage der Vorschau „neu / geändert / entfällt". */
export function stammAbgleich(alt: readonly StammPerson[], neu: readonly StammPerson[]): StammAbgleich {
  const altSchluessel = namensSchluessel(alt);
  const neuSchluessel = namensSchluessel(neu);
  const altNach = new Map(altSchluessel.map((k, i) => [k, alt[i]!]));
  const neuMenge = new Set(neuSchluessel);
  const a: StammAbgleich = { neu: [], geaendert: [], entfaellt: [], unveraendert: 0 };
  neu.forEach((p, i) => {
    const vorher = altNach.get(neuSchluessel[i]!);
    if (!vorher) a.neu.push(p);
    else if (vergleichsText(vorher) !== vergleichsText(p)) a.geaendert.push(p);
    else a.unveraendert++;
  });
  alt.forEach((p, i) => {
    if (!neuMenge.has(altSchluessel[i]!)) a.entfaellt.push(p);
  });
  return a;
}

// ------------------------------------------------------------ Mustervorlage

/** Kopfzeile der Mustervorlage — dieselben Überschriften erkennt `zuordnungVorschlagen` ohne Nacharbeit. */
export const MUSTER_KOPF = ["Nachname", "Vorname", "Rolle", "Funktion", "Qualifikationen", "Fahrerlaubnis", "Mobil", "Teileinheit", "Geschlecht", "Ernährung"] as const;

/** Erfundene Beispielzeilen; die Rufnummern liegen im Bereich, den die Bundesnetzagentur für Drehbücher freihält. */
const MUSTER_ZEILEN: readonly (readonly string[])[] = [
  ["Mustermann", "Max", "F", "ZFü", "Sprechfunk", "CE", "0171 3920000", "ZTr", "m", "Fleisch"],
  ["Musterfrau", "Erika", "UF", "GrFü", "AGT, Sprechfunk", "C", "0171 3920001", "B1", "w", "vegetarisch"],
  ["Beispiel", "Kim", "H", "Helfer", "Motorsäge", "B", "", "B1", "d", "vegan"],
];

export const MUSTER_CSV_NAME = "personalstamm-muster.csv";
export const MUSTER_XLSX_NAME = "personalstamm-muster.xlsx";

/** Mustervorlage als CSV im Excel(DE)-Format (Semikolon, UTF-8 mit BOM). */
export function musterCsv(): string {
  return csvDatei([csvZeile([...MUSTER_KOPF]), ...MUSTER_ZEILEN.map((z) => csvZeile([...z]))]);
}

function xmlText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function spaltenBuchstabe(i: number): string {
  return String.fromCharCode(65 + i); // die Mustervorlage hat zehn Spalten
}

let crcTabelle: Uint32Array | null = null;
function crc32(daten: Uint8Array): number {
  if (!crcTabelle) {
    crcTabelle = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTabelle[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (const b of daten) crc = crcTabelle[(crc ^ b) & 0xff]! ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/** Dateien unkomprimiert zu einem ZIP packen — für die wenigen Kilobyte der Mustervorlage genügt „stored". */
export function zipSchreiben(dateien: ReadonlyArray<readonly [string, string]>): Uint8Array {
  const enc = new TextEncoder();
  const teile: Uint8Array[] = [];
  const verzeichnis: Uint8Array[] = [];
  let stelle = 0;
  for (const [name, inhalt] of dateien) {
    const n = enc.encode(name);
    const d = enc.encode(inhalt);
    const crc = crc32(d);
    const kopf = new DataView(new ArrayBuffer(30));
    kopf.setUint32(0, 0x04034b50, true);
    kopf.setUint16(4, 20, true); // benötigte Version
    kopf.setUint16(6, 0x0800, true); // Dateinamen in UTF-8
    kopf.setUint16(8, 0, true); // stored
    kopf.setUint16(10, 0, true); // Zeit
    kopf.setUint16(12, 0x21, true); // Datum 1980-01-01
    kopf.setUint32(14, crc, true);
    kopf.setUint32(18, d.length, true);
    kopf.setUint32(22, d.length, true);
    kopf.setUint16(26, n.length, true);
    kopf.setUint16(28, 0, true);
    const eintrag = new DataView(new ArrayBuffer(46));
    eintrag.setUint32(0, 0x02014b50, true);
    eintrag.setUint16(4, 20, true);
    eintrag.setUint16(6, 20, true);
    eintrag.setUint16(8, 0x0800, true);
    eintrag.setUint16(10, 0, true);
    eintrag.setUint16(12, 0, true);
    eintrag.setUint16(14, 0x21, true);
    eintrag.setUint32(16, crc, true);
    eintrag.setUint32(20, d.length, true);
    eintrag.setUint32(24, d.length, true);
    eintrag.setUint16(28, n.length, true);
    eintrag.setUint32(42, stelle, true);
    teile.push(new Uint8Array(kopf.buffer), n, d);
    verzeichnis.push(new Uint8Array(eintrag.buffer), n);
    stelle += 30 + n.length + d.length;
  }
  const verzeichnisLaenge = verzeichnis.reduce((s, t) => s + t.length, 0);
  const ende = new DataView(new ArrayBuffer(22));
  ende.setUint32(0, 0x06054b50, true);
  ende.setUint16(8, dateien.length, true);
  ende.setUint16(10, dateien.length, true);
  ende.setUint32(12, verzeichnisLaenge, true);
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

/** Zeilen, die die Mustervorlage für Auswahllisten vorbereitet (ohne Kopfzeile). */
const MUSTER_LISTEN_BIS = 500;

/**
 * Mustervorlage als Excel-Mappe: Kopfzeile, drei erfundene Beispielzeilen und Auswahllisten für Rolle,
 * Fahrerlaubnis, Geschlecht und Ernährung (Wunsch aus dem OV Markt Schwaben). Die Listen schlagen nur vor —
 * „B, CE" in der Spalte Fahrerlaubnis bleibt erlaubt. Die Mappe enthält weder Formeln noch Makros.
 */
export function musterXlsx(): Uint8Array {
  const zelle = (spalte: number, zeile: number, text: string, stil: number) =>
    text === "" ? "" : `<c r="${spaltenBuchstabe(spalte)}${zeile}" t="inlineStr" s="${stil}"><is><t xml:space="preserve">${xmlText(text)}</t></is></c>`;
  const zeilen = [
    `<row r="1">${MUSTER_KOPF.map((k, i) => zelle(i, 1, k, 1)).join("")}</row>`,
    ...MUSTER_ZEILEN.map((z, r) => `<row r="${r + 2}">${z.map((w, i) => zelle(i, r + 2, w, 2)).join("")}</row>`),
  ].join("");
  const liste = (spalte: number, werte: readonly string[], titel: string, hinweis: string) =>
    `<dataValidation type="list" allowBlank="1" showInputMessage="1" showErrorMessage="0" promptTitle="${xmlText(titel)}" prompt="${xmlText(hinweis)}" sqref="${spaltenBuchstabe(spalte)}2:${spaltenBuchstabe(spalte)}${MUSTER_LISTEN_BIS + 1}"><formula1>"${xmlText(werte.join(","))}"</formula1></dataValidation>`;
  const listen = [
    liste(2, ["F", "UF", "H"], "Rolle", "F = Führer, UF = Unterführer, H = Helfer"),
    liste(5, ["B", "BE", "C1", "C1E", "C", "CE", "D1", "D", "DE"], "Fahrerlaubnis", "Höchste Klasse wählen; mehrere mit Komma (B, A) sind erlaubt."),
    liste(8, ["m", "w", "d"], "Geschlecht", "Für die Unterbringung. Darf leer bleiben."),
    liste(9, ["Fleisch", "vegetarisch", "vegan"], "Ernährung", "Für die Verpflegung. Darf leer bleiben."),
  ].join("");
  const breiten = [18, 16, 8, 16, 30, 14, 18, 14, 12, 14];
  const blatt =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>` +
    `<cols>${breiten.map((b, i) => `<col min="${i + 1}" max="${i + 1}" width="${b}" customWidth="1"/>`).join("")}</cols>` +
    `<sheetData>${zeilen}</sheetData>` +
    `<dataValidations count="4">${listen}</dataValidations>` +
    `</worksheet>`;
  // Stil 1: fette Kopfzeile; Stil 2: Textformat (@), damit „0171 …" und „1" (Klasse) nicht zu Zahlen werden.
  const stile =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>` +
    `<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>` +
    `<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>` +
    `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
    `<cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>` +
    `<xf numFmtId="49" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyNumberFormat="1"/>` +
    `<xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs>` +
    `<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>` +
    `</styleSheet>`;
  return zipSchreiben([
    [
      "[Content_Types].xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
        `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
        `<Default Extension="xml" ContentType="application/xml"/>` +
        `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
        `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
        `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
        `</Types>`,
    ],
    [
      "_rels/.rels",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
        `</Relationships>`,
    ],
    [
      "xl/workbook.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
        `<sheets><sheet name="Personal" sheetId="1" r:id="rId1"/></sheets>` +
        `</workbook>`,
    ],
    [
      "xl/_rels/workbook.xml.rels",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
        `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
        `</Relationships>`,
    ],
    ["xl/worksheets/sheet1.xml", blatt],
    ["xl/styles.xml", stile],
  ]);
}
