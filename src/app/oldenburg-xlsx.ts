/**
 * XLSX-Export im Format „Oldenburg" — die Einheitenliste, wie die
 * Führungsstelle des Landkreises Oldenburg sie führt.
 *
 * Anders als die eigenen CSV-Exporte ist das hier ein FREMDES Format: Spalten,
 * Reihenfolge, Farben und Rahmen kommen aus einer vorhandenen Excel-Vorlage und
 * sind nicht verhandelbar. Wer die Datei bekommt, fügt sie in seine laufende
 * Liste ein — passte die Spaltenfolge nicht, wäre der Export wertlos. Deshalb
 * ist das Blatt der Vorlage nachgebaut statt „schön" gemacht: Zeile 1 die
 * farbige Hinweisleiste mit den SUBTOTAL-Summen, Zeile 2 die Kopfzeile, ab
 * Zeile 3 je Einheit eine Zeile.
 *
 * Die Vorlage hat mehr Spalten, als ein Erfassungsbogen kennt (Ablösung,
 * Anforderungs-ID, Zusagen, Rückführung, Schicht). Die bleiben LEER — sie
 * gehören der Führungsstelle, nicht der meldenden Einheit, und werden dort von
 * Hand geführt. Erfundene Werte wären dort schlimmer als leere Zellen.
 *
 * Enthält keine Personennamen, aber Kontaktdaten der Führungskraft
 * (Erreichbarkeit) — bleibt wie alle Exporte rein lokal.
 *
 * Technik: der Container entsteht in xlsx.ts; die Stilnummern unten sind Indizes
 * in {@link STILE}, die aus der Vorlage übernommene Stiltabelle.
 */

import {
  ansprechpartner,
  staerke,
  unterbringungMWD,
  verpflegung,
  type Erfassungsbogen,
} from "../model";
import {
  einheitAnzeigename,
  einheitOrt,
  kontaktText,
  orgLabel,
  vokabText,
  vokabularFuer,
} from "./hilfen";
import {
  XLSX_MIME,
  excelDatum,
  excelZeitpunkt,
  mappeBauen,
  spaltenName,
  zeileXml,
  type Zelle,
} from "./xlsx";
import { bogenInhaltsId, neuesteJeEinheit, MeldeStatus, type Einsatzsammlung, type MeldeEintrag } from "./einsaetze";

export { XLSX_MIME };

// ----------------------------------------------------------------- Stiltabelle

/**
 * `styles.xml` aus der Vorlage, unverändert bis auf die Grundschrift: dort stand
 * eine Farbe „theme=1", die ohne die (großen) Theme-Teile der Vorlage nicht
 * auflösbar wäre — Excel zeigt sie ohnehin als Schwarz. Alles andere (Füllungen,
 * Rahmenstärken, das Datumsformat 165 „dd.mm.yyyy hh:mm") ist Original, damit
 * die erzeugte Datei neben der handgeführten Liste nicht auffällt.
 *
 * Die Reihenfolge in `<cellXfs>` bestimmt die Stilnummern in den Spalten unten —
 * an dieser Liste nichts umsortieren.
 */
const STILE =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
  '<numFmts count="1"><numFmt numFmtId="165" formatCode="dd\\.mm\\.yyyy\\ hh:mm"/></numFmts>' +
  '<fonts count="4">' +
  '<font><sz val="11"/><name val="Aptos Narrow"/><family val="2"/></font>' +
  '<font><b/><sz val="11"/><name val="Arial"/><family val="2"/></font>' +
  '<font><b/><sz val="8"/><name val="Arial"/><family val="2"/></font>' +
  '<font><b/><sz val="14"/><color indexed="17"/><name val="Arial"/><family val="2"/></font>' +
  "</fonts>" +
  '<fills count="7">' +
  '<fill><patternFill patternType="none"/></fill>' +
  '<fill><patternFill patternType="gray125"/></fill>' +
  '<fill><patternFill patternType="solid"><fgColor rgb="FFFF00FF"/><bgColor indexed="64"/></patternFill></fill>' +
  '<fill><patternFill patternType="solid"><fgColor rgb="FFFFCC99"/><bgColor indexed="64"/></patternFill></fill>' +
  '<fill><patternFill patternType="solid"><fgColor indexed="47"/><bgColor indexed="64"/></patternFill></fill>' +
  '<fill><patternFill patternType="solid"><fgColor indexed="51"/><bgColor indexed="64"/></patternFill></fill>' +
  '<fill><patternFill patternType="solid"><fgColor rgb="FFFFCC00"/><bgColor indexed="64"/></patternFill></fill>' +
  "</fills>" +
  '<borders count="8">' +
  "<border><left/><right/><top/><bottom/><diagonal/></border>" +
  '<border><left style="medium"><color indexed="64"/></left><right/><top style="medium"><color indexed="64"/></top><bottom style="medium"><color indexed="64"/></bottom><diagonal/></border>' +
  '<border><left/><right/><top style="medium"><color indexed="64"/></top><bottom style="medium"><color indexed="64"/></bottom><diagonal/></border>' +
  '<border><left/><right style="thin"><color indexed="64"/></right><top style="medium"><color indexed="64"/></top><bottom style="medium"><color indexed="64"/></bottom><diagonal/></border>' +
  '<border><left style="thin"><color indexed="64"/></left><right style="thin"><color indexed="64"/></right><top style="medium"><color indexed="64"/></top><bottom style="medium"><color indexed="64"/></bottom><diagonal/></border>' +
  '<border><left style="thin"><color indexed="64"/></left><right/><top style="medium"><color indexed="64"/></top><bottom style="medium"><color indexed="64"/></bottom><diagonal/></border>' +
  '<border><left style="medium"><color indexed="64"/></left><right style="thin"><color indexed="64"/></right><top style="medium"><color indexed="64"/></top><bottom style="medium"><color indexed="64"/></bottom><diagonal/></border>' +
  '<border><left style="medium"><color indexed="64"/></left><right style="medium"><color indexed="64"/></right><top style="medium"><color indexed="64"/></top><bottom style="medium"><color indexed="64"/></bottom><diagonal/></border>' +
  "</borders>" +
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
  '<cellXfs count="31">' +
  /*  0 */ '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
  /*  1 */ '<xf numFmtId="0" fontId="1" fillId="4" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>' +
  /*  2 */ '<xf numFmtId="0" fontId="1" fillId="4" borderId="3" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>' +
  /*  3 */ '<xf numFmtId="0" fontId="1" fillId="4" borderId="4" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
  /*  4 */ '<xf numFmtId="0" fontId="1" fillId="4" borderId="4" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>' +
  /*  5 */ '<xf numFmtId="0" fontId="2" fillId="4" borderId="4" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>' +
  /*  6 */ '<xf numFmtId="0" fontId="1" fillId="3" borderId="4" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment wrapText="1"/></xf>' +
  /*  7 */ '<xf numFmtId="0" fontId="1" fillId="3" borderId="4" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
  /*  8 */ '<xf numFmtId="0" fontId="2" fillId="5" borderId="4" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>' +
  /*  9 */ '<xf numFmtId="0" fontId="1" fillId="6" borderId="4" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
  /* 10 */ '<xf numFmtId="0" fontId="1" fillId="3" borderId="5" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
  /* 11 */ '<xf numFmtId="0" fontId="1" fillId="3" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
  /* 12 */ '<xf numFmtId="0" fontId="3" fillId="2" borderId="6" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
  /* 13 */ '<xf numFmtId="0" fontId="3" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
  /* 14 */ '<xf numFmtId="0" fontId="3" fillId="3" borderId="6" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
  /* 15 */ '<xf numFmtId="0" fontId="3" fillId="3" borderId="4" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
  /* 16 */ '<xf numFmtId="0" fontId="2" fillId="4" borderId="6" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
  /* 17 */ '<xf numFmtId="0" fontId="2" fillId="4" borderId="4" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
  /* 18 */ '<xf numFmtId="0" fontId="2" fillId="4" borderId="3" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>' +
  /* 19 */ '<xf numFmtId="0" fontId="2" fillId="4" borderId="4" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment wrapText="1"/></xf>' +
  /* 20 */ '<xf numFmtId="0" fontId="2" fillId="3" borderId="4" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>' +
  /* 21 */ '<xf numFmtId="0" fontId="2" fillId="5" borderId="4" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1" applyProtection="1"><alignment horizontal="center" wrapText="1"/><protection locked="0"/></xf>' +
  /* 22 */ '<xf numFmtId="165" fontId="2" fillId="5" borderId="4" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1" applyProtection="1"><alignment horizontal="center" wrapText="1"/><protection locked="0"/></xf>' +
  /* 23 */ '<xf numFmtId="0" fontId="2" fillId="3" borderId="4" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
  /* 24 */ '<xf numFmtId="0" fontId="2" fillId="3" borderId="5" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
  /* 25 */ '<xf numFmtId="0" fontId="2" fillId="3" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" wrapText="1"/></xf>' +
  /* 26 */ '<xf numFmtId="0" fontId="2" fillId="2" borderId="6" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>' +
  /* 27 */ '<xf numFmtId="0" fontId="2" fillId="2" borderId="5" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>' +
  /* 28 */ '<xf numFmtId="0" fontId="2" fillId="2" borderId="7" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>' +
  /* 29 */ '<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
  /* 30 */ '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment wrapText="1"/></xf>' +
  "</cellXfs>" +
  '<cellStyles count="1"><cellStyle name="Standard" xfId="0" builtinId="0"/></cellStyles>' +
  '<dxfs count="0"/><tableStyles count="0" defaultTableStyle="TableStyleMedium2" defaultPivotStyle="PivotStyleLight16"/>' +
  "</styleSheet>";

/** Stilnummer für Datumszellen (Format „dd.mm.yyyy hh:mm") in den Datenzeilen. */
const STIL_DATUM = 29;
/** Stilnummer für Zellen mit Zeilenumbruch (Fahrzeugliste). */
const STIL_UMBRUCH = 30;

/**
 * Breite der Datumsspalten. „14.05.2026 08:30" braucht rund 16 Zeichen; in der
 * schmalen Standardbreite zeigt Excel stattdessen „########", und genau das
 * landet dann auch in der Zwischenablage.
 */
const BREITE_DATUM = 16.5;
/** „Aufträge" etwas breiter — die einzige Breite, die die Vorlage selbst setzt. */
const BREITE_AUFTRAEGE = 11.6640625;

// -------------------------------------------------------------------- Spalten

interface SpaltenSpec {
  id: string;
  /** Text der Kopfzeile (Zeile 2) — Umbrüche wie in der Vorlage. */
  kopf: string;
  kopfStil: number;
  /** Stil der farbigen Leiste in Zeile 1. */
  leisteStil: number;
  /** Hinweistext in Zeile 1, z. B. „(Dat. / Zeit)". */
  leiste?: string;
  /** Stil der Datenzellen; fehlt = Standard. */
  datenStil?: number;
  /** Zeile 1 trägt die SUBTOTAL-Summe dieser Spalte. */
  summe?: boolean;
  /** Spaltenbreite in Zeichen; fehlt = Standardbreite der Vorlage. */
  breite?: number;
}

/**
 * Die 37 Spalten A…AK der Vorlage in genau ihrer Reihenfolge. Die Stilnummern
 * stammen aus der Vorlagendatei (Zelle für Zelle abgelesen) — sie tragen die
 * Farbblöcke, mit denen die Führungsstelle die Bereiche der Liste unterscheidet.
 */
const SPALTEN: SpaltenSpec[] = [
  { id: "fuest", kopf: "FüSt.", kopfStil: 16, leisteStil: 1 },
  { id: "bezeichnung", kopf: "Bezeichnung", kopfStil: 17, leisteStil: 1 },
  { id: "organisation", kopf: "Organisation", kopfStil: 18, leisteStil: 2 },
  { id: "herkunft", kopf: "Herkunft", kopfStil: 5, leisteStil: 3 },
  { id: "zug", kopf: "Zug", kopfStil: 5, leisteStil: 4 },
  { id: "trupp", kopf: "Trupp o.", kopfStil: 5, leisteStil: 5 },
  { id: "gruppe", kopf: "Gruppe", kopfStil: 5, leisteStil: 4 },
  { id: "person", kopf: "Person", kopfStil: 5, leisteStil: 4 },
  { id: "geraete", kopf: "Geräte / Fahrzeuge", kopfStil: 19, leisteStil: 6, datenStil: STIL_UMBRUCH },
  { id: "auftraege", kopf: "Aufträge", kopfStil: 20, leisteStil: 7, breite: BREITE_AUFTRAEGE },
  { id: "erreichbarkeit", kopf: "Erreichbar_\nkeit", kopfStil: 21, leisteStil: 8, leiste: "(Funk / Tel. / eMail)" },
  { id: "verfuegbarBis", kopf: "Verfügbar\n bis", kopfStil: 22, leisteStil: 8, leiste: "(Dat. / Zeit)", datenStil: STIL_DATUM, breite: BREITE_DATUM },
  { id: "abloesung", kopf: "Ablösung angefordert", kopfStil: 22, leisteStil: 8, leiste: "(Dat. / Zeit)", datenStil: STIL_DATUM, breite: BREITE_DATUM },
  { id: "anforderungsId", kopf: "Anforderungs \n- ID", kopfStil: 21, leisteStil: 8 },
  { id: "zugesagtFuer", kopf: "Zugesagt \nfür", kopfStil: 22, leisteStil: 8, leiste: "(Dat. / Zeit)", datenStil: STIL_DATUM, breite: BREITE_DATUM },
  { id: "zugesagtVon", kopf: "Zugesagt \nvon", kopfStil: 21, leisteStil: 8, leiste: "(Org.)" },
  { id: "vorgeseheneEinheit", kopf: "Vorgesehene Einheit", kopfStil: 21, leisteStil: 8 },
  { id: "vorgesehenerAuftrag", kopf: "Vorgesehener Auftrag", kopfStil: 21, leisteStil: 8 },
  { id: "eingetroffen", kopf: "eingetr. / zugew.", kopfStil: 22, leisteStil: 8, leiste: "(Dat. / Zeit)", datenStil: STIL_DATUM, breite: BREITE_DATUM },
  { id: "einsatzende", kopf: "Einsatz-\nende", kopfStil: 22, leisteStil: 8, leiste: "(Dat. / Zeit)", datenStil: STIL_DATUM, breite: BREITE_DATUM },
  { id: "rueckfuehrung", kopf: "Rück-\nführung", kopfStil: 22, leisteStil: 8, leiste: "(Dat. / Zeit)", datenStil: STIL_DATUM, breite: BREITE_DATUM },
  { id: "bemerkung", kopf: "Bemerkung", kopfStil: 21, leisteStil: 8 },
  { id: "reserve1", kopf: "Reserve", kopfStil: 21, leisteStil: 9 },
  { id: "reserve2", kopf: "Reserve", kopfStil: 21, leisteStil: 9 },
  { id: "status", kopf: "Status", kopfStil: 23, leisteStil: 7 },
  { id: "schicht", kopf: "Schicht", kopfStil: 24, leisteStil: 10 },
  { id: "bogenId", kopf: "ID Einheiten-Erfassungsbogen", kopfStil: 25, leisteStil: 11 },
  { id: "weiblich", kopf: "Weibl.", kopfStil: 26, leisteStil: 12, summe: true },
  { id: "divers", kopf: "Div.", kopfStil: 26, leisteStil: 12, summe: true },
  { id: "vegetarisch", kopf: "Veget.", kopfStil: 27, leisteStil: 12, summe: true },
  { id: "vegan", kopf: "Vegan.", kopfStil: 26, leisteStil: 12, summe: true },
  { id: "uenM", kopf: "ÜN (m)", kopfStil: 28, leisteStil: 12, summe: true },
  { id: "uenW", kopf: "ÜN (w)", kopfStil: 28, leisteStil: 12, summe: true },
  { id: "uenD", kopf: "ÜN (d)", kopfStil: 28, leisteStil: 13, summe: true },
  { id: "fuehrer", kopf: "Fü", kopfStil: 5, leisteStil: 14, summe: true },
  { id: "unterfuehrer", kopf: "Ufü", kopfStil: 5, leisteStil: 14, summe: true },
  { id: "helfer", kopf: "He", kopfStil: 5, leisteStil: 15, summe: true },
];

/** Eine Datenzeile: Werte je Spalten-`id`; fehlende Schlüssel bleiben leer. */
type Zeile = Record<string, string | number | undefined>;

const ERSTE_DATENZEILE = 3;

// ------------------------------------------------------------ Werte je Einheit

/**
 * Ebene der Einheit — bestimmt, in welche der Spalten E…H („Zug", „Trupp o.",
 * „Gruppe", „Person") ihre Bezeichnung wandert. Erkannt am ausgeschriebenen
 * Einheitstyp, weil der eindeutiger ist als das Kürzel: „Zugtrupp Technischer
 * Zug" ist ein Trupp, kein Zug — deshalb wird Trupp VOR Zug geprüft.
 */
type Ebene = "zug" | "trupp" | "gruppe" | "person" | undefined;

function ebeneVon(typLang: string, gesamtstaerke: number): Ebene {
  const t = typLang.toLowerCase();
  if (/trupp/.test(t)) return "trupp";
  if (/gruppe/.test(t)) return "gruppe";
  if (/zug\b/.test(t)) return "zug";
  // Kein Einheitstyp erkannt: eine einzelne Person ist ein Einzelposten
  // (Fachberater, Verbindungskraft) und gehört in die Personenspalte.
  return gesamtstaerke === 1 ? "person" : undefined;
}

/** „OV Oldenburg - Ni (OODE)" — Herkunft aus der untersten Hierarchie-Ebene. */
function herkunftText(b: Erfassungsbogen): string {
  const ebene = b.einheit.hierarchie[0];
  if (!ebene) return "";
  const art = vokabText(ebene.bezeichnung, vokabularFuer(b.einheit.organisation, "ebene"));
  return [art, ebene.name, ebene.kurz ? `(${ebene.kurz})` : ""].filter(Boolean).join(" ");
}

/**
 * Fahrzeuge als Liste mit Stückzahl („2× GKW,\nMzKW"). Gleiche Typen werden
 * zusammengefasst: in der schmalen Spalte der Vorlage ist „2× GKW" lesbar,
 * zweimal „GKW" untereinander wirkt wie ein Fehler.
 */
function geraeteText(b: Erfassungsbogen): string {
  const tabelle = vokabularFuer(b.einheit.organisation, "fahrzeug");
  const gezaehlt = new Map<string, number>();
  for (const f of b.fahrzeuge) {
    const name = vokabText(f.typ, tabelle);
    if (name) gezaehlt.set(name, (gezaehlt.get(name) ?? 0) + 1);
  }
  return [...gezaehlt].map(([name, n]) => (n > 1 ? `${n}× ${name}` : name)).join(",\n");
}

/**
 * Erreichbarkeit: Führungskraft mit Kontakt, sonst die Nummern der Einheit.
 * Die Führungsstelle ruft hier an — steht nichts drin, ist die Zeile für die
 * Nachforderung wertlos, deshalb der Rückfall auf die Einheitskontakte.
 */
function erreichbarkeitText(b: Erfassungsbogen): string {
  const p = ansprechpartner(b.personal);
  if (p) {
    const name = [p.vorname, p.nachname].filter(Boolean).join(" ");
    return [name, ...p.kontakte.map(kontaktText)].filter(Boolean).join(" / ");
  }
  const ebene = b.einheit.hierarchie[0];
  return [ebene?.telefon ? `Tel: ${ebene.telefon}` : "", ebene?.email ? `eMail: ${ebene.email}` : ""]
    .filter(Boolean)
    .join(" / ");
}

const STATUS_TEXT: Record<MeldeStatus, string> = {
  [MeldeStatus.ANWESEND]: "Anwesend",
  [MeldeStatus.ABGERUECKT]: "Abgerückt",
  [MeldeStatus.AUFGEGANGEN]: "Aufgegangen",
};

/** Kontext, den erst die Sammlung am Meldekopf beisteuert (beim Einzelbogen leer). */
interface Kontext {
  /** Zug-Etikett aus dem Bündel — die Spalte „Zug", wenn die Einheit selbst keiner ist. */
  zug?: string;
  /** Bezeichnung eines abgeteilten Truppteils; hängt an der Bezeichnung. */
  teil?: string;
  status?: string;
  /** Eintrags-ID der Sammlung; ohne Sammlung der Inhalts-Hash des Bogens. */
  id?: string;
}

function zeileFuer(b: Erfassungsbogen, k: Kontext): Zeile {
  const typen = vokabularFuer(b.einheit.organisation, "einheitstyp");
  const kurz = vokabText(b.einheit.einheitsTyp, typen) || einheitAnzeigename(b.einheit);
  const lang = vokabText(b.einheit.einheitsTyp, typen, "name") || kurz;
  const st = staerke(b);
  const vp = verpflegung(b);
  const u = unterbringungMWD(b);
  const sb = b.sofortbedarf;
  const ebene = ebeneVon(lang, st.gesamt);
  // ÜN nur, wenn Unterbringung überhaupt angefordert ist — sonst stünden dort
  // Betten für Einheiten, die abends nach Hause fahren.
  const uen = sb?.unterbringung ? u : { m: 0, w: 0, d: 0 };

  return {
    // Spalte A („FüSt.") bleibt leer: welche Führungsstelle die Einheit führt,
    // entscheidet die Führungsstelle, nicht der Bogen.
    bezeichnung: [kurz, k.teil ? `(${k.teil})` : ""].filter(Boolean).join(" "),
    organisation: b.einheit.organisationName?.trim() || orgLabel(b.einheit.organisation),
    herkunft: herkunftText(b) || einheitOrt(b.einheit),
    // Ist die Einheit selbst ein Zug, steht sie dort; sonst der Zug, dem der
    // Meldekopf sie zugeordnet hat.
    zug: ebene === "zug" ? kurz : (k.zug ?? ""),
    trupp: ebene === "trupp" ? kurz : "",
    gruppe: ebene === "gruppe" ? kurz : "",
    person: ebene === "person" ? kurz : "",
    geraete: geraeteText(b),
    auftraege: b.einsatz.ortAuftrag,
    erreichbarkeit: erreichbarkeitText(b),
    verfuegbarBis: excelDatum(b.einsatz.zeitraumBis),
    eingetroffen: b.einsatz.einsatzbeginn != null ? excelZeitpunkt(b.einsatz.einsatzbeginn) : "",
    einsatzende: b.einsatz.einsatzende != null ? excelZeitpunkt(b.einsatz.einsatzende) : "",
    // Übung zuerst: eine Übungsmeldung darf in der Liste der Führungsstelle
    // nicht wie eine echte aussehen (siehe uebung im Datenmodell).
    bemerkung: [b.uebung === true ? "ÜBUNG" : "", b.sonstiges ?? ""].filter(Boolean).join(" — "),
    status: k.status ?? "",
    bogenId: k.id ?? bogenInhaltsId(b),
    weiblich: u.w,
    divers: u.d,
    vegetarisch: vp.vegetarisch,
    vegan: vp.vegan,
    uenM: uen.m,
    uenW: uen.w,
    uenD: uen.d,
    fuehrer: st.fuehrer,
    unterfuehrer: st.unterfuehrer,
    helfer: st.mannschaft,
  };
}

// -------------------------------------------------------------- Blatt bauen

/**
 * Zeile 1: farbige Leiste mit den Hinweistexten der Vorlage und den
 * SUBTOTAL-Summen. SUBTOTAL(9;…) statt SUMME, weil es gefilterte Zeilen
 * auslässt — filtert die Führungsstelle auf eine Organisation, stimmt die Summe
 * oben sofort für diese Auswahl.
 */
function leisteZeile(letzteZeile: number): string {
  const zellen: Zelle[] = SPALTEN.map((sp, i) => ({
    spalte: i,
    stil: sp.leisteStil,
    wert: sp.leiste,
    formel: sp.summe ? `SUBTOTAL(9,${spaltenName(i)}${ERSTE_DATENZEILE}:${spaltenName(i)}${letzteZeile})` : undefined,
  }));
  return zeileXml(1, zellen);
}

function kopfZeile(): string {
  return zeileXml(
    2,
    SPALTEN.map((sp, i) => ({ spalte: i, stil: sp.kopfStil, wert: sp.kopf })),
  );
}

function datenZeile(z: Zeile, nr: number): string {
  const zellen: Zelle[] = [];
  SPALTEN.forEach((sp, i) => {
    const wert = z[sp.id];
    // Leere Zellen wegzulassen hält die Datei klein — AUSSER die Spalte bringt
    // eine Formatierung mit. Die Datumsspalten der Führungsstelle (Ablösung,
    // Zusage, Rückführung) füllt sie von Hand; ohne die vorformatierte Zelle
    // stünde dort danach eine nackte Zahl statt „14.05.2026 08:30".
    if ((wert == null || wert === "") && sp.datenStil == null) return;
    zellen.push({ spalte: i, wert: wert === "" ? undefined : wert, stil: sp.datenStil });
  });
  return zeileXml(nr, zellen);
}

/** `<cols>` für alle Spalten, die eine eigene Breite mitbringen. */
function spaltenBreitenXml(): string {
  const cols = SPALTEN.map((sp, i) =>
    sp.breite == null ? "" : `<col min="${i + 1}" max="${i + 1}" width="${sp.breite}" customWidth="1"/>`,
  ).join("");
  return `<cols>${cols}</cols>`;
}

function blattBauen(zeilen: Zeile[]): Uint8Array<ArrayBuffer> {
  const letzteZeile = Math.max(ERSTE_DATENZEILE, ERSTE_DATENZEILE + zeilen.length - 1);
  return mappeBauen(
    {
      name: "Tabelle1",
      zeilen: [leisteZeile(letzteZeile), kopfZeile(), ...zeilen.map((z, i) => datenZeile(z, ERSTE_DATENZEILE + i))],
      bereich: `A1:${spaltenName(SPALTEN.length - 1)}${letzteZeile}`,
      spalten: spaltenBreitenXml(),
      verbund: ["A1:C1"],
    },
    STILE,
  );
}

// --------------------------------------------------------------- Öffentlich

/** Einzelner Erfassungsbogen → XLSX-Bytes mit genau einer Datenzeile. */
export function bogenOldenburgXlsx(b: Erfassungsbogen): Uint8Array<ArrayBuffer> {
  return blattBauen([zeileFuer(b, {})]);
}

/**
 * Einsatz-Sammlung → XLSX-Bytes: je gemeldeter Einheit eine Zeile in ihrer
 * neuesten Revision, nach Anzeigename sortiert. Auch abgerückte und aufgegangene
 * Einheiten sind dabei — die Spalte „Status" hält sie auseinander, und die
 * SUBTOTAL-Summen oben folgen dem Filter, den die Führungsstelle setzt.
 */
export function einsatzOldenburgXlsx(s: Einsatzsammlung): Uint8Array<ArrayBuffer> {
  const meldungen = neuesteJeEinheit(s.eintraege).sort(
    (a, b) =>
      einheitAnzeigename(a.bogen.einheit).localeCompare(einheitAnzeigename(b.bogen.einheit), "de") ||
      (a.teilEtikett ?? "").localeCompare(b.teilEtikett ?? "", "de"),
  );
  return blattBauen(meldungen.map((e) => zeileFuer(e.bogen, kontextAus(e))));
}

function kontextAus(e: MeldeEintrag): Kontext {
  return { zug: e.zugEtikett, teil: e.teilEtikett, status: STATUS_TEXT[e.status], id: e.id };
}
