/**
 * Reine Erzeugung der pdfmake-DocDefinition im Layout des Papier-Erfassungsbogens.
 * Bewusst OHNE pdfmake-Laufzeitabhängigkeit (nur Typ-Import) und ohne Download/
 * Share — dadurch plattformneutral und unit-testbar. Das Rendering und die
 * Ausgabe liegen in pdf.ts.
 *
 * Seite 1: Kopf, Stärke, Zugehörigkeit, Einsatz, Fahrzeuge.
 * Seite 2: Personalliste + Qualifikationen + Sofortbedarf.
 * Letzte Seite: QR-Code (EEB2-Payload, als Bild übergeben).
 *
 * Zusätzlich wird der Bogen als strukturiertes JSON in die PDF eingebettet
 * (analog zu ZUGFeRD-Rechnungen): dokumentweit als „Associated File" (/AF)
 * und im /Names/EmbeddedFiles-Baum, sodass die PDF auch maschinenlesbar ist.
 */

import type {
  Attachment,
  Content,
  TDocumentDefinitions,
  TableCell,
  CustomTableLayout,
} from "pdfmake/interfaces";
import {
  Erfassungsbogen,
  Fahrzeug,
  KontaktArt,
  ansprechpartner,
  OrganisationsTyp,
  PersonalErfassung,
  StaerkeRolle,
  mitTransportVersion,
  staerke,
  unterbringungMWD,
  verpflegung,
} from "@bos/eeb-format/model";
import {
  einheitAnzeigename,
  funkrufText,
  funktionsText,
  kennzeichenText,
  nurSollstaerke,
  orgLabel,
  vokabText,
  vokabularFuer,
  zeitgruppe,
  bogenAnonymisiert,
  type QrSatz,
  zeitpunktDeutsch,
  zeitraumVonBis,
} from "./hilfen";
import { betriebsstoffText } from "./auswertung";
import { type AngabenSeit } from "./angaben-alter";
import { ANONYM_PERSONAL_SATZ, codeGueltigBisText } from "./anonym-hinweis";
import { anfuehrung } from "./typografie";
import { fahrzeugSymbolSvg } from "./taktische-zeichen-bogen";
import { sitzplaetzeRichtwert } from "@bos/vokabulare/sitzplaetze";
import { orgFarbePapier } from "./org-farben";
import { THW_LOGO_BREITE, THW_LOGO_HOEHE, THW_LOGO_JPEG } from "./pdf-logo-thw";
import { ORG_LOGOS } from "./pdf-logos";
import { BERUF_PRAEFIX, berufText, qualifikationenUndBerufe } from "./beruf";
import {
  UEBUNG_BREITE,
  UEBUNG_HOEHE,
  UEBUNG_PFAD,
} from "./uebung-wasserzeichen";

// Grau der Kopfzeilen/Hinweiszeile exakt aus der THWin-Papiervorlage
// (06-BrB_Erfassungsbogen.dotx): w:fill="D9D9D9".
const GRAU = "#d9d9d9";

// Kennzeichnung von Übungsbögen (Störer-Zeile, Übersichts-Markierung):
// gedecktes Signalrot, das sich von allen Organisations-Kennfarben abhebt.
const UEBUNG_FARBE = "#b02a1e";

/**
 * Wasserzeichen „ÜBUNG" diagonal über jeder Seite — bewusst NICHT über
 * pdfmakes eingebautes `watermark`: das setzt echten PDF-Text, der beim
 * Markieren und Kopieren aus der PDF mitten im Bogeninhalt landet. Stattdessen
 * die Buchstabenkonturen als SVG-Grafik hinter dem Inhalt (siehe
 * uebung-wasserzeichen.ts) — nicht markierbar und nicht kopierbar.
 */
// 8 % (Grauwert 241/255) ging beim Schwarzweiß-Kopieren unter (Prüfrunde
// Beispielbögen, BB-A3); 14 % bleibt hinter dem Text lesbar.
const UEBUNG_DECKKRAFT = 0.14;

function uebungsWasserzeichen(): TDocumentDefinitions["background"] {
  // Pro Seite, weil die Sammel-PDF Quer- und Hochformat mischt.
  return (_seite, groesse) => {
    const { width: breite, height: hoehe } = groesse;
    // Wie bei pdfmake entlang der Seitendiagonale.
    const winkel = (Math.atan2(hoehe, breite) * 180) / Math.PI;
    const diagonale = Math.hypot(breite, hoehe);
    const cos = breite / diagonale;
    const sin = hoehe / diagonale;
    // Größtmögliches Wort, das gedreht noch ganz auf die Seite passt: das
    // gedrehte Rechteck (Breite w, Höhe w·verhaeltnis) belegt
    // w·cos + w·verhaeltnis·sin in der Breite und w·sin + w·verhaeltnis·cos in
    // der Höhe. Die 0,96 lassen einen Hauch Luft zu den Seitenrändern.
    const verhaeltnis = UEBUNG_HOEHE / UEBUNG_BREITE;
    const wortBreite =
      0.96 *
      Math.min(
        breite / (cos + verhaeltnis * sin),
        hoehe / (sin + verhaeltnis * cos),
      );
    const skala = wortBreite / UEBUNG_BREITE;
    const wortHoehe = UEBUNG_HOEHE * skala;
    // Vier Nachkommastellen, weil der Maßstab (Font-Einheiten → pt) selbst weit
    // unter 1 liegt und gröberes Runden das Wort merklich stauchen würde.
    const rund = (n: number) => Math.round(n * 10000) / 10000;
    // Drehpunkt ist die Seitenmitte; im SVG zeigt die Y-Achse nach unten,
    // darum dreht das negative Winkelmaß das Wort nach oben rechts.
    const lage = [
      `translate(${rund(breite / 2)} ${rund(hoehe / 2)})`,
      `rotate(${rund(-winkel)})`,
      `translate(${rund(-wortBreite / 2)} ${rund(-wortHoehe / 2)})`,
      `scale(${rund(skala)})`,
    ].join(" ");
    return {
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${rund(breite)}" height="${rund(hoehe)}" viewBox="0 0 ${rund(breite)} ${rund(hoehe)}"><g transform="${lage}" fill="${UEBUNG_FARBE}" fill-opacity="${UEBUNG_DECKKRAFT}"><path d="${UEBUNG_PFAD}"/></g></svg>`,
      width: breite,
    };
  };
}

/** Störer-Zeile über dem Bogenkopf — sichtbar auch beim Schwarzweiß-Druck. */
function uebungsStoerer(): Content {
  return {
    text: "ÜBUNG — Dieser Bogen beschreibt keinen echten Einsatz.",
    color: UEBUNG_FARBE,
    bold: true,
    fontSize: 10,
    margin: [0, 0, 0, 6],
  };
}

/**
 * Schriftart und Seitenränder wie in der THWin-Vorlage. Helvetica (≙ Arial, die
 * im Word-Dokument hinterlegte Ausweichschrift der Bund-Hausschrift BundesSans)
 * wird in pdf.ts als PDF-Standardschrift registriert.
 */
const SCHRIFT = "Helvetica";


/*
 * Raster des Bogens, aus der THWin-Vorlage nachgemessen (06-K_A_Erfassungsbogen.dotx,
 * mit Word ausgefüllt und als PDF gedruckt). Alle Werte in pt; 1 pt = 20 Twips.
 *
 * Der Rahmen der Vorlage steht nicht auf dem Satzspiegel, sondern 3,5 pt
 * (w:tblInd 70 Twips) weiter rechts und ist 474,9 pt breit (Spaltensumme 9498
 * Twips): außen links bei x = 74,4 pt, rechts bei 549,1 pt. Oben beginnt er bei
 * 41 pt. Linien sind 0,5 pt stark (w:sz 4), schwarz.
 */
/** Linke Außenkante des Rahmens. */
const RAHMEN_X = 74.4;
/** Rahmenbreite = Summe von {@link RASTER}. */
const RAHMEN_BREITE = 474.9;
/** Oberkante des Titelbalkens auf Seite 1. */
const RAHMEN_Y = 41;
/**
 * Seitenränder des Bogens: links und rechts auf den Rahmen der Vorlage gelegt.
 * pdfmake zieht die Außenlinie eine halbe Linienstärke innerhalb des Rands,
 * darum steht der Rand eine halbe Linie weiter außen.
 */
const BOGEN_RAENDER: [number, number, number, number] = [
  RAHMEN_X - 0.25,
  RAHMEN_Y,
  595.28 - (RAHMEN_X - 0.25) - RAHMEN_BREITE,
  32,
];
/** Linienstärke aller Rahmen (w:sz 4 = ½ pt). */
const LINIE = 0.5;
/** Innenabstand links/rechts je Zelle (w:tblCellMar 70 Twips). */
const ZELLE_INNEN = 3.5;
/**
 * Spaltenraster der Vorlage (w:tblGrid 1276 · 709 · 2126 · 1134 · 917 · 1209 ·
 * 2127 Twips). Kopf, Fahrzeugblöcke und Sofortbedarf setzen ihre Trennlinien
 * auf diese Kanten, sodass alle Tabellen untereinander fluchten.
 */
const RASTER = [63.8, 35.45, 106.3, 56.7, 45.85, 60.45, 106.35] as const;
/** Höhe des Titelbalkens, gemessen (41,0 bis 70,8 pt). */
const ZEILE_TITEL = 29.8;
/** Zeilenhöhe von Kopf und Fahrzeugkopf (w:trHeight 567 Twips). */
const ZEILE_HOCH = 28.35;
/** Zeilenhöhe der Personal- und Qualifikationstabelle (w:trHeight 397 Twips). */
const ZEILE_PERSONAL = 19.85;
/** Zweite Zeile eines Fahrzeugblocks: Platz für StAN und Sondergerät (w:trHeight 1134 Twips). */
const ZEILE_FAHRZEUG_UNTEN = 56.7;

/**
 * pdfmake-Spaltenbreite für eine Spalte, die auf dem Papier `pt` breit sein
 * soll: pdfmake zählt Innenabstand und Linie zur Spalte hinzu.
 */
const spalte = (pt: number): number => pt - 2 * ZELLE_INNEN - LINIE;
/** Breite der Rasterspalten `von` bis `bis` (einschließlich, ab 0). */
const raster = (von: number, bis: number): number =>
  RASTER.slice(von, bis + 1).reduce((s, w) => s + w, 0);

/** Zeichenzahl des längsten Worts — Maß dafür, ob ein Text in eine schmale Spalte passt. */
const laengstesWort = (text: string): number =>
  Math.max(0, ...text.split(/\s+/).map((w) => w.length));

/** Tabellenlinien und Innenabstände der Vorlage. `dicht` = Sammel-PDF, knapp gesetzt. */
function rahmenLayout(dicht = false): CustomTableLayout {
  return {
    hLineWidth: () => LINIE,
    vLineWidth: () => LINIE,
    hLineColor: () => "#000000",
    vLineColor: () => "#000000",
    paddingLeft: () => ZELLE_INNEN,
    paddingRight: () => ZELLE_INNEN,
    paddingTop: () => (dicht ? 0.5 : 2),
    paddingBottom: () => (dicht ? 0.5 : 2),
  };
}

/**
 * Kantenlänge des QR-Bilds in pt (1 pt = 1/72 Zoll). 190 pt ≈ 67 mm.
 *
 * Vorher standen hier 150 pt — gewählt, damit der QR-Block möglichst oft noch
 * auf die letzte Formularseite passt. Nachdem das Einzel-Budget auf v18
 * gesenkt wurde (siehe QR_EINZEL_MAX_VERSION), blieb dieser Einzelcode
 * trotzdem der dichteste gedruckte Code überhaupt: 0,59 mm je Modul gegen
 * 1,18 mm bei einem Segment-Teil (v13 auf QR_SEGMENT_BREITE). Das Budget
 * konnte das nicht heilen — die Modulgröße hängt an Version UND Druckbreite,
 * und an der Breite war noch Luft. Mit 190 pt kommt der Einzelcode auf
 * 0,75 mm je Modul (Version 16 ≈ 0,82 mm) und liegt damit in derselben
 * Größenordnung wie ein Segment-Teil.
 *
 * Der Platzpreis wurde über alle 73 einteiligen Beispielbögen gemessen: 10
 * davon wachsen von einer auf zwei Seiten (101 → 111 Seiten gesamt), weil der
 * QR-Block als `unbreakable` nicht mehr unter das Formular passt. Bei 175 pt
 * wären es 7 — die Kurve ist flach, ein kleinerer Wert kauft wenig zurück.
 * Bewusst als Konstante, damit sich die Größe nach einem Druck-/Scan-
 * Praxistest leicht nachziehen lässt.
 */
const QR_BREITE = 190;

/**
 * Kantenlänge je QR-Bild bei Segmentierung. Bewusst groß (≈ 8 cm) und pro Seite
 * nur ZWEI Codes, diagonal versetzt (oben links / unten rechts): Liegen mehrere
 * Codes dicht beieinander, geraten beim Anvisieren eines Codes immer Nachbarn
 * mit ins Kamerabild und die Erkennung springt zwischen ihnen. Der Diagonal-
 * abstand (~15 cm) stellt sicher, dass formatfüllend immer nur ein Code im
 * Sucher ist — ohne die anderen abdecken zu müssen.
 */
const QR_SEGMENT_BREITE = 230;

/** Dateiname der eingebetteten Maschinen-Daten (analog factur-x.xml bei ZUGFeRD). */
export const EEB_JSON_DATEINAME = "erfassungsbogen.json";

const kasten = (ja: boolean) => (ja ? "[X]" : "[  ]");

/**
 * pdfmake bricht Zeilen nur an Leerzeichen um. Ein einziges überlanges Wort
 * (typisch: E-Mail-Adressen wie „Poststelle.RSt_Vschwenningen@thw.de") setzt
 * deshalb die Mindestbreite seiner Spalte — die Kopftabelle wird breiter als
 * der Satzspiegel und ragt über den rechten Rand hinaus. Nullbreiten-
 * Leerzeichen (U+200B) hinter den natürlichen Trennzeichen geben pdfmake
 * unsichtbare Umbruchstellen; als Notbremse bekommen auch trennzeichenlose
 * Endloswörter alle 20 Zeichen eine (20 Zeichen à 8 pt passen noch in die
 * schmalste Sternspalte). Nur für Anzeigetext — nie für das eingebettete JSON
 * oder die QR-Daten.
 */
export function weichUmbrechen(text: string): string {
  return text.replace(/\S{19,}/g, (wort) =>
    wort
      .replace(/([@._\-/:])(?=.)/g, "$1\u200B")
      .replace(/[^\u200B]{20}(?=[^\u200B])/g, "$&\u200B"),
  );
}

/**
 * Zeichen, die die PDF-Schrift (Helvetica, WinAnsi = Windows-1252) kennt.
 * Alles andere druckt pdfkit als Fremdzeichen: „Verpflegung 12 ≠ Stärke 8"
 * stand auf dem Lageblatt als „12 ″` Stärke 8" (Audit Runde 5, R5-K2).
 */
const WINANSI_SONDER = new Set("€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ");
const winAnsiKennt = (z: string): boolean => {
  const c = z.codePointAt(0)!;
  return (
    (c >= 0x20 && c <= 0x7e) ||
    (c >= 0xa0 && c <= 0xff) ||
    z === "\n" ||
    z === "\u200B" ||
    WINANSI_SONDER.has(z)
  );
};
/** Häufige Zeichen aus Freitext mit sinnvoller Schreibweise in WinAnsi. */
const WINANSI_ERSATZ: Record<string, string> = {
  "→": "->",
  "⇒": "=>",
  "←": "<-",
  "↔": "<->",
  "≠": "!=",
  "≥": ">=",
  "≤": "<=",
  "≈": "ca.",
  "−": "-",
  "‐": "-",
  "‑": "-",
  "‒": "-",
  "✓": "x",
  "✔": "x",
  "✗": "x",
  "✘": "x",
  "☎": "Tel.",
  "⚠": "!",
  ł: "l",
  Ł: "L",
  đ: "d",
  Đ: "D",
  ı: "i",
  // Weitere lateinische Buchstaben ohne Platz in WinAnsi und ohne Akzent-Zerlegung (R10-W1); ß, ø, æ, þ, ð kennt WinAnsi selbst.
  ẞ: "SS",
  ŧ: "t",
  Ŧ: "T",
  ħ: "h",
  Ħ: "H",
  ŀ: "l",
  Ŀ: "L",
  ĸ: "k",
  ŋ: "ng",
  Ŋ: "Ng",
  ĳ: "ij",
  Ĳ: "IJ",
  ſ: "s",
  ə: "e",
  Ə: "E",
  ǝ: "e",
  ʼ: "'",
  ʻ: "'",
  ˈ: "'",
  ǃ: "!",
  "\u202F": " ",
  "\u2009": " ",
  "\u2002": " ",
  "\u2003": " ",
  "\uFEFF": "",
  "\u00AD": "",
};

/**
 * Text für die PDF-Schrift: unbekannte Zeichen durch eine Schreibweise ersetzen,
 * die sie kennt („≠" → „!=", „ő" → „o"); was sich nicht abbilden lässt, wird „?"
 * statt eines Fremdzeichens. Gilt für alle Texte der Dokumente, auch für Freitext
 * der Bögen, den niemand prüft.
 */
export function winAnsiText(eingabe: string): string {
  const text = anfuehrung(eingabe); // R17-W3: „…“ statt „…"
  let aus = "";
  let geaendert = false;
  for (const z of text) {
    if (winAnsiKennt(z)) {
      aus += z;
      continue;
    }
    geaendert = true;
    const ersatz = WINANSI_ERSATZ[z];
    if (ersatz != null) {
      aus += ersatz;
      continue;
    }
    // Buchstabe mit Akzent, den WinAnsi nicht hat („ő", „ž" ist drin, „ć" nicht): Grundbuchstabe.
    const grund = z.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    aus += [...grund].every(winAnsiKennt) && grund !== "" ? grund : "?";
  }
  return geaendert ? aus : text;
}

/** Umschrift kyrillischer und griechischer Buchstaben in lateinische (R8-A3) — klein, die Großschreibung setzt {@link umschrift}. */
const UMSCHRIFT: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "jo",
  ж: "zh",
  з: "z",
  и: "i",
  й: "j",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "ch",
  ц: "z",
  ч: "tsch",
  ш: "sch",
  щ: "schtsch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "ju",
  я: "ja",
  і: "i",
  ї: "ji",
  є: "je",
  ґ: "g",
  ў: "u",
  ј: "j",
  љ: "lj",
  њ: "nj",
  ћ: "c",
  ђ: "dj",
  џ: "dz",
  α: "a",
  β: "v",
  γ: "g",
  δ: "d",
  ε: "e",
  ζ: "z",
  η: "i",
  θ: "th",
  ι: "i",
  κ: "k",
  λ: "l",
  μ: "m",
  ν: "n",
  ξ: "x",
  ο: "o",
  π: "p",
  ρ: "r",
  σ: "s",
  ς: "s",
  τ: "t",
  υ: "y",
  φ: "f",
  χ: "ch",
  ψ: "ps",
  ω: "o",
  ά: "a",
  έ: "e",
  ή: "i",
  ί: "i",
  ό: "o",
  ύ: "y",
  ώ: "o",
  ϊ: "i",
  ϋ: "y",
};

/**
 * Kyrillisch/griechisch → lateinisch („Владимир" → „Vladimir"); alles andere bleibt. Nur für das
 * Rückruf-Feld auf Papier (R8-A3): Der Name steht dort lesbar statt als „????????".
 */
export function umschrift(text: string): string {
  let aus = "";
  for (const z of text) {
    const klein = z.toLowerCase();
    const u = UMSCHRIFT[klein];
    if (u === undefined) {
      aus += z;
    } else if (klein !== z && u) {
      aus += u[0]!.toUpperCase() + u.slice(1);
    } else {
      aus += u;
    }
  }
  return aus;
}

/**
 * Der Name im Feld „Ansprechpartner/in": darstellbar unverändert; kyrillisch/griechisch in Umschrift
 * mit dem Vermerk dazu; was auch so nicht druckbar ist, mit dem Hinweis auf die digitale Meldung —
 * kein „????????" mehr an der Stelle, wo der Meldekopf zurückruft (R8-A3).
 */
export function ansprechpersonPapier(name: string): string {
  const weg = (t: string) => winAnsiText(t).includes("?") && !t.includes("?");
  if (!weg(name))
    return zeichenVereinfacht(name) ? `${name} (vereinfacht)` : name;
  const u = umschrift(name);
  if (!weg(u)) return `${u} (Umschrift)`;
  return `${winAnsiText(u)} (Name nicht darstellbar – siehe digitale Meldung)`;
}

/** Enthält der Text Zeichen, die die PDF-Schrift nicht kennt und die als „?" gedruckt würden? */
const papierWeg = (t: string): boolean =>
  winAnsiText(t).includes("?") && !t.includes("?");

/**
 * Enthält der Text Buchstaben, die die PDF-Schrift nicht kennt und die still durch einen ähnlichen ersetzt
 * werden („Łukasz" → „Lukasz", „Dvořák" → „Dvorak")? Dann steht der Name auf Papier anders als im QR-Code,
 * und das gehört dazu und in die Quittung (R10-W1). Nur Buchstaben: Leerraum und Bindestriche zählen nicht.
 */
export const zeichenVereinfacht = (t: string): boolean =>
  !papierWeg(t) &&
  [...t].some((z) => !winAnsiKennt(z) && /[\p{L}\p{M}]/u.test(z));

/**
 * Ein Personenname für die Listen auf dem Bogen: darstellbar unverändert; kyrillisch/griechisch in
 * Umschrift mit dem Vermerk dazu — dieselbe Schreibweise wie im Feld „Ansprechpartner/in", damit der
 * Mensch an beiden Stellen gleich lesbar ist (R9-W3). Was auch so nicht druckbar ist, bleibt, wie es ist
 * (die PDF druckt dann „?", die Quittung nennt es).
 */
export function namePapier(
  nachname: string,
  vorname: string,
  trenner = ", ",
): string {
  const roh = `${nachname}${nachname && vorname ? trenner : ""}${vorname}`;
  if (!papierWeg(roh))
    return zeichenVereinfacht(roh) ? `${roh} (vereinfacht)` : roh;
  const u = umschrift(roh);
  return papierWeg(u) ? roh : `${u} (Umschrift)`;
}

/**
 * Wie viele Namen im Bogen Zeichen enthalten, die die PDF-Schrift nicht darstellen kann
 * (arabisch, Emoji …) und die als „?" gedruckt würden (Audit Runde 6, R6-A5). Eine Person zählt einmal
 * (Vor- und Nachname zusammen), und was in Umschrift gedruckt wird, zählt nicht mit (R9-W3).
 */
export function nichtDarstellbareNamen(b: Erfassungsbogen): number {
  const personen = b.personal.filter(
    (p) =>
      papierWeg(`${p.vorname} ${p.nachname}`) &&
      papierWeg(umschrift(`${p.vorname} ${p.nachname}`)),
  ).length;
  const sonst = [
    b.einheit.organisationName ?? "",
    ...b.einheit.hierarchie.map((h) => h.name),
  ].filter((n) => n && papierWeg(n)).length;
  return personen + sonst;
}

/**
 * Wer betroffen ist: „Владимир Lehmann (Ansprechperson)" — für die Quittung (R7-A4). Die erste
 * Person steht im Feld „Ansprechpartner/in", also dort, wo der Meldekopf zurückruft. Nur, was auch in
 * Umschrift nicht druckbar ist; die Umschrift-Fälle nennt {@link umschriftBetroffene}.
 */
export function nichtDarstellbareBetroffene(b: Erfassungsbogen): string[] {
  const wer: string[] = [];
  b.personal.forEach((p, i) => {
    const name = `${p.vorname} ${p.nachname}`;
    if (papierWeg(name) && papierWeg(umschrift(name))) {
      wer.push(
        `${[p.vorname, p.nachname].filter(Boolean).join(" ")}${i === 0 ? " (Ansprechperson)" : ""}`,
      );
    }
  });
  if (papierWeg(b.einheit.organisationName ?? ""))
    wer.push(`Organisationsname „${b.einheit.organisationName}"`);
  for (const h of b.einheit.hierarchie)
    if (papierWeg(h.name)) wer.push(`Zugehörigkeit „${h.name}"`);
  return wer;
}

/** Personen, deren Name in Umschrift gedruckt wird (Feld „Ansprechpartner/in" und Personenliste) — für die Quittung (R9-W3). */
export function umschriftBetroffene(b: Erfassungsbogen): string[] {
  const wer: string[] = [];
  b.personal.forEach((p, i) => {
    const name = `${p.vorname} ${p.nachname}`;
    if (papierWeg(name) && !papierWeg(umschrift(name))) {
      wer.push(
        `${[p.vorname, p.nachname].filter(Boolean).join(" ")} → ${umschrift(name).trim()}${i === 0 ? " (Ansprechperson)" : ""}`,
      );
    }
  });
  return wer;
}

/** Personen, deren Name mit einzelnen vereinfachten Buchstaben gedruckt wird („Łukasz" → „Lukasz") — für die Quittung (R10-W1). */
export function vereinfachtBetroffene(b: Erfassungsbogen): string[] {
  const wer: string[] = [];
  b.personal.forEach((p, i) => {
    const name = `${p.vorname} ${p.nachname}`;
    if (zeichenVereinfacht(name)) {
      const voll = [p.vorname, p.nachname].filter(Boolean).join(" ");
      wer.push(
        `${voll} → ${winAnsiText(voll)}${i === 0 ? " (Ansprechperson)" : ""}`,
      );
    }
  });
  return wer;
}

/** Läuft durch ein Dokument und wendet {@link winAnsiText} auf alle gedruckten Texte an (Schlüssel „text"). */
function winAnsiKnoten<T>(k: T): T {
  if (Array.isArray(k)) {
    k.forEach((x, i) => {
      (k as unknown[])[i] = winAnsiKnoten(x);
    });
  } else if (k && typeof k === "object") {
    const o = k as Record<string, unknown>;
    for (const name of Object.keys(o)) {
      // Eingebettete Dateien (JSON, Sammlung) sind Daten, kein gedruckter Text.
      if (
        name === "files" ||
        name === "image" ||
        name === "svg" ||
        name === "link"
      )
        continue;
      const wert = o[name];
      if (name === "text" && typeof wert === "string")
        o[name] = winAnsiText(wert);
      else if (wert && typeof wert === "object") winAnsiKnoten(wert);
    }
  }
  return k;
}

/** Dokument-Titel, Inhalt, Kopf- und Fußzeile auf WinAnsi bringen (R5-K2). */
function winAnsiDokument(dd: TDocumentDefinitions): TDocumentDefinitions {
  winAnsiKnoten(dd.content);
  if (dd.info?.title) dd.info.title = winAnsiText(dd.info.title);
  for (const feld of ["header", "footer"] as const) {
    const f = dd[feld];
    if (typeof f === "function") {
      dd[feld] = ((...a: Parameters<typeof f>) =>
        winAnsiKnoten(f(...a))) as typeof f;
    } else if (f) winAnsiKnoten(f);
  }
  return dd;
}

/** pdfmake-Attachment inkl. der von pdfkit unterstützten AFRelationship (fehlt im Typ). */
type EingebetteteDatei = Attachment & { relationship?: string };

/** Uint8Array → Base64 (chunkweise, damit auch große Bögen nicht den Stack sprengen). */
function base64AusBytes(bytes: Uint8Array): string {
  let binaer = "";
  const schritt = 0x8000;
  for (let i = 0; i < bytes.length; i += schritt) {
    binaer += String.fromCharCode(...bytes.subarray(i, i + schritt));
  }
  return btoa(binaer);
}

/**
 * Serialisiert den Bogen als UTF-8-JSON und verpackt ihn als Base64-Data-URL,
 * die pdfmake dokumentweit einbettet. Das Model trägt selbst `schemaVersion`,
 * ist also für externe Auswertung selbstbeschreibend.
 */
export function bogenAlsEingebetteteDatei(
  b: Erfassungsbogen,
): EingebetteteDatei {
  const json = JSON.stringify(mitTransportVersion(b), null, 2);
  const base64 = base64AusBytes(new TextEncoder().encode(json));
  return {
    src: `data:application/json;base64,${base64}`,
    name: EEB_JSON_DATEINAME,
    description:
      "Strukturierte Daten des Einheitenerfassungsbogens (maschinenlesbar)",
    // Alternative = maschinenlesbares Gegenstück zur sichtbaren Darstellung (wie ZUGFeRD).
    relationship: "Alternative",
  };
}






export interface UebersichtEintrag {
  bogen: Erfassungsbogen;
  /** Vorherige Meldung derselben Einheit; fehlt bei einer Erstmeldung. */
  vorher?: Erfassungsbogen;
  /** Zug-/Verbandsetikett aus der Sammlung — Grundlage der Zwischensummen. */
  zugEtikett?: string;
  /** Bezeichnung eines abgeteilten Truppteils (MeldeEintrag.teilEtikett). */
  teil?: string;
  /** Eintreffzeit (ms); fehlt bei Aufrufern, die nur Bögen kennen. */
  eingetroffenAm?: number;
  /** Abrückzeit (ms), falls festgehalten. */
  abgerueckAm?: number;
  /** Eingang der geltenden Fassung am Meldekopf (ms) — Grundlage der Altersaussage im Kopf des Lageblatts (R12-K3). */
  empfangenAm?: number;
  /**
   * Nicht mehr vor Ort (abgerückt oder zusammengeführt): steht im eigenen
   * Block unter den anwesenden Einheiten. Bisher fehlten diese Einheiten auf
   * dem Papier vollständig, während die eingebettete Sammlung sie trug — zwei
   * Wahrheiten für dieselbe Übergabe (Analog-Audit A1).
   */
  abgerueckt?: boolean;
  /** Zählt in Summen und Bedarf (anwesend, keine fremde Übung). Fehlt = ja. */
  zaehlt?: boolean;
  /** Auftrag/Notiz der Führungsstelle zu dieser Einheit. */
  notiz?: string;
  /** Laufende Nummer der Meldung, wie an der Karte am Gerät (R2-A6). */
  nummer?: number;
  /**
   * Diese Fassung hat die abgerückte Einheit wieder in die Lage geholt (R5-K1);
   * `abgerueckAm` = seit wann sie abgerückt war. Das Blatt nennt es in der Spalte
   * „Veränderung" — die Wand und der Stab lesen sonst nur eine normale Zeile.
   */
  rueckkehr?: { abgerueckAm?: number };
  /**
   * Nur im Nachtrag (R5-W7): warum die Einheit dabei ist („neu", „Zug", „Auftrag" …).
   * `nachtragNeu === false`: Sie war schon in der letzten Lieferung — ihre Zeile
   * ersetzt die frühere, ihre Kräfte gehören nicht noch einmal zur Summe.
   */
  nachtragGrund?: string[];
  nachtragNeu?: boolean;
  /**
   * Die Eintreffzeit ist die Zeit des Einlesens vom Papier, nicht bestätigt
   * (R5-A1): Das Blatt kennzeichnet sie, statt eine Uhrzeit wie eine Angabe zu drucken.
   */
  zeitUnbestaetigt?: boolean;
  /** Die Eintreffzeit ist die Zeit des Einlesens am Gerät, nicht vom Meldeblock oder von Hand bestätigt (R14-A1). */
  zeitEingelesen?: boolean;
  /** Alter der Angaben nach einer Handänderung am Meldekopf: das der Vorgängerin (R17-K1). */
  angaben?: AngabenSeit;
  /** Stand der Angaben, den der Absender gemeldet hat, wenn der Bogen am Meldekopf von Hand umgestellt wurde (R18-A2). */
  standAbsender?: Erfassungsbogen["stand"];
  /** Der Stand des Bogens liegt nach dem Eingang am Gerät: Geräteuhr oder Absenderuhr falsch (R13-A3, R14-A2). */
  standNachEintreffen?: boolean;
  /** Die Signatur passt nicht zu den Daten: unterwegs verändert oder beschädigt (R15-E1). */
  signaturUngueltig?: boolean;
  /** Ort/Auftrag, den der Bogen nennt, obwohl er nicht zur Lage zu passen scheint (R5-K5). */
  fremderOrt?: string;
  /** Name und Rufnummer des Absenders aus der mitsignierten Absenderkarte (R11-W2): „Hans Beispiel · 0170 5551234". */
  absender?: string;
}

/** Ein Bogen der Sammel-PDF samt QR — die Übersichtsangaben plus der Code für die Bogenseiten. */
export interface SammelBogen extends UebersichtEintrag {
  qr: QrSatz;
}










/**
 * Übergabe-Übersicht: eine Zeile je Einheit mit Eintreff-/Abrückzeit, Stärke,
 * Fahrzeugen, Auftrag der Führungsstelle und der Spalte „Veränderung seit der
 * letzten Meldung" — der Teil, den die ablösende Schicht zuerst liest.
 * Abgerückte Einheiten stehen als eigener Block darunter; die Summe zählt
 * nur die zählenden — genau wie die Stärkeleiste am Gerät.
 */
/**
 * Bei einer Einheit, deren Personal nur als Stärke erfasst ist, stammen Fahrzeug-
 * Ausstattung („nach StAN: ja") und Funkrufname aus der Vorbelegung des Einheitstyps –
 * gemeldet hat sie niemand. Auf Papier sähe das wie eine Aussage der Einheit aus
 * (Audit Runde 6, R6-A3): Die Kästchen bleiben leer, der Funkrufname entfällt.
 */
export function ohneVorbelegung(b: Erfassungsbogen): Erfassungsbogen {
  if (b.personalErfassung !== PersonalErfassung.NUR_STAERKE) return b;
  return {
    ...b,
    fahrzeuge: b.fahrzeuge.map((f) => ({
      ...f,
      stanKonform: undefined,
      funkrufname: undefined,
    })),
  };
}

/**
 * Wie erreiche ich die Einheit ohne Gerät? Funkrufname des ersten Fahrzeugs
 * mit Funkrufnamen und die Rückrufnummer der Führungskraft (sonst die des
 * Ortsverbands) — auf dem Einzelbogen stehen sie, auf dem Lageblatt fehlten
 * sie (Audit Runde 2, R2-A3).
 */
export function erreichbarkeitZeilen(
  b: Erfassungsbogen,
  absender?: string,
): string[] {
  const zeilen: string[] = [];
  // Niemand hat gezählt (Sollstärke): Funkrufname und Rufnummer stammen aus der Vorbelegung des Einheitstyps,
  // nicht von der Einheit — am Wandblatt sähen sie wie ein bestätigter Rückruf aus (R9-A3).
  const soll = nurSollstaerke(b);
  b = ohneVorbelegung(b);
  const fzg = b.fahrzeuge.find((f) => f.funkrufname);
  const furn = fzg ? funkrufText(fzg, b.einheit) : "";
  // Trägt die Fahrzeugzeile noch keine eigene Angabe (Kennzeichen, Sitzplätze, Sondergerät), stammt der
  // Funkrufname aus der Vorbelegung des Einheitstyps, auch bei vollständig gemeldetem Bogen (R11-W4).
  const unberuehrt =
    fzg != null &&
    !fzg.kennzeichen?.trim() &&
    fzg.sitzplaetze == null &&
    !fzg.aenderungen?.trim();
  if (furn) zeilen.push(soll || unberuehrt ? `${furn} (Vorbelegung)` : furn);
  // Rückruf der Einheit selbst: Name und Nummer, die der Absender hinterlegt hat (R11-W2).
  if (absender) zeilen.push(`Absender: ${absender}`);
  // Knapp, damit die Zeile in die Spalte passt: „5556968346 (S. Lang)".
  const p = ansprechpartner(b.personal);
  // Dienstliche Nummer vor privater; die Art steht hinter der Nummer wie auf dem Bogen (R14-A3).
  const nummern =
    p?.kontakte.filter(
      (k) => k.art !== KontaktArt.EMAIL && k.art !== KontaktArt.FUNK && k.wert,
    ) ?? [];
  const tel = nummern.find((k) => k.dienstlich) ?? nummern[0];
  const name = p
    ? [p.vorname ? `${p.vorname.charAt(0)}.` : "", p.nachname]
        .filter(Boolean)
        .join(" ")
    : "";
  if (p && tel) {
    const art = tel.dienstlich ? "(D)" : "(P)";
    zeilen.push(name ? `${tel.wert} ${art} ${name}` : `${tel.wert} ${art}`);
  } else if (b.einheit.hierarchie[0]?.telefon) {
    zeilen.push(
      `${b.einheit.hierarchie[0].telefon} (${soll ? "OV, Vorbelegung" : "OV"})`,
    );
  }
  // Funkrufname der Ansprechperson (Handfunkgerät): der Weg, wenn das Telefonnetz weg ist.
  const funkP = p?.kontakte.find(
    (k) => k.art === KontaktArt.FUNK && k.wert?.trim(),
  );
  if (p && funkP)
    zeilen.push(
      name
        ? `${funkP.wert!.trim()} (Funk) ${name}`
        : `${funkP.wert!.trim()} (Funk)`,
    );
  return zeilen;
}












/**
 * Bemerkung der Einheit für das Blatt, in Klammern (R17-W4): gekürzt an einer Wortgrenze — nie mitten in „StAN“ —, und das
 * Blatt sagt, wo der Rest steht (R5-A9). Eigene Klammern der Bemerkung werden eckig, damit keine Klammer in der Klammer steht.
 */
export function bemerkungKurz(bemerkung: string, kuerzen?: number): string {
  let b = bemerkung.trim();
  if (!b) return "";
  const umschlossen =
    b.startsWith("(") && b.endsWith(")") && !b.slice(1, -1).includes(")(");
  if (umschlossen) b = b.slice(1, -1).trim();
  b = b.replace(/\(/g, "[").replace(/\)/g, "]");
  if (kuerzen != null && b.length > kuerzen) {
    let teil = b.slice(0, kuerzen);
    // R20-A5: An einer Satz- oder Satzteilgrenze kürzen, nicht mitten im Satz: „… in Instandsetzung — nicht …“ las sich auf der Wand
    // als „ausgerückt“. Ein vollständiger Satz davor geht vor einem Wortschnitt; die Grenze muss mehr als ein Viertel tragen.
    const grenzen = [/[.!?](?=\s)/g, /\s[—–]\s|;\s/g];
    let geschnitten = false;
    for (const muster of grenzen) {
      let letzte = -1;
      for (const m of teil.matchAll(muster))
        letzte =
          m.index! + (m[0].length > 1 && /[—–;]/.test(m[0]) ? 0 : m[0].length);
      if (letzte >= kuerzen / 4) {
        teil = teil.slice(0, letzte);
        geschnitten = true;
        break;
      }
    }
    if (!geschnitten && !/\s/.test(b.charAt(kuerzen)) && /\s/.test(teil))
      teil = teil.replace(/\s+\S*$/, "");
    // Ein Rest „… nicht“, „… ohne“ oder „… und“ ohne sein Ziel sagt das Gegenteil oder nichts: solche Endwörter fallen weg.
    teil = teil.replace(
      /(?:\s+(?:nicht|kein|keine|keinen|keiner|ohne|und|oder|mit|über|in|an|zu|von|bei|für|auf|als|dem|der|die|den))+$/i,
      "",
    );
    // R21-A8: Fahrzeugangaben fallen nie weg („Anh … nicht mit ausgerückt" fehlte an der Wand): Steht im abgeschnittenen Rest ein
    // Fahrzeug, steht die Bemerkung bis zur größeren Grenze ganz da.
    if (
      kuerzen < BEMERKUNG_LAGEBLATT_FAHRZEUG &&
      FAHRZEUG_IN_BEMERKUNG.test(b.slice(teil.length))
    ) {
      return bemerkungKurz(bemerkung, BEMERKUNG_LAGEBLATT_FAHRZEUG);
    }
    return `(${teil.replace(/[\s,;:([—–-]+$/, "")} … Rest: Sammel-PDF)`;
  }
  return `(${b})`;
}

/** R21-A8: Grenze für Bemerkungen, die ein Fahrzeug nennen; Wörter, die auf eines hinweisen. */
const BEMERKUNG_LAGEBLATT_FAHRZEUG = 200;
const FAHRZEUG_IN_BEMERKUNG =
  /\b(PKW|LKW|Anh|Anhänger|Fahrzeug|Fahrzeuge|Fzg|GKW|MTW|MLW|MzKW|Kipper|Radlader|Bagger|Boot|Kennzeichen)(?![\p{L}])/iu;











/**
 * Stand einer Einheit am Meldekopf als Text für ihre Bogenseiten in der
 * Sammel-PDF. Der QR-Code trägt nur den Bogen der Einheit — Eintreffzeit,
 * Abrückvermerk, Zug und Auftrag gehören dem Meldekopf und stehen sonst nur
 * auf Seite 1. Ein Ausdruck ohne Seite 1 zeigte eine abgerückte Einheit wie
 * eine anwesende, und wer die Codes einlas, bekam die Scan-Uhrzeit als
 * Eintreffzeit, ohne dass Blatt oder App sagten, was fehlt (Audit Runde 2,
 * R2-A1). Kein Schemawechsel: der Vermerk ist reiner Text neben dem Code.
 */
export interface MeldekopfVermerk {
  /** „Eingetroffen … · ABGERÜCKT … · Zug: … · Auftrag / Notiz: …" */
  stand: string;
  /** Nicht mehr vor Ort — hebt den Kasten hervor. */
  abgerueckt: boolean;
  /** Laufende Nummer am Meldekopf — steht auch in der Kopfzeile der Codeseiten (R4-A5). */
  nummer?: number;
}

/** Hinweis neben den QR-Codes der Sammel-PDF: was der Code NICHT enthält (R2-A1). */
export const QR_NUR_BOGEN_HINWEIS =
  "Der Code enthält nur den Bogen der Einheit. Eintreffzeit, Abrückvermerk, Zug und Auftrag des Meldekopfs " +
  "stehen als Text im Kasten „Stand am Meldekopf“ und auf Seite 1 — nach dem Einlesen von Hand nachtragen. " +
  "Die ganze Lage liest „Einsatz importieren…“ aus der PDF-Datei.";

/**
 * Satz neben dem Code: Der Code trägt den gedruckten Stand, Handschrift sieht
 * die App nicht. Ohne diesen Hinweis korrigierte eine Gruppenführerin „1 / 1 /
 * 2 / 4" mit dem Stift auf „1 / 1 / 1 / 3", der Meldekopf scannte und zählte
 * weiter 4 — Papier und Gerät widersprachen sich unbemerkt (Audit Runde 2,
 * R2-A4). Das Kästchen macht die Korrektur für den Scannenden sichtbar.
 */
export function stiftHinweis(stand: string): string {
  return `Ist oben auf dem Bogen „von Hand geändert“ angekreuzt, gilt dieser Code (Stand ${stand}) nicht mehr: abtippen oder neu erzeugen, nicht scannen.`;
}

/**
 * Das Kästchen selbst steht auf dem Bogen, neben der Stärke: Mit dem Stift
 * korrigiert wird dort, nicht auf der Codeseite. Wer auf Seite 1 änderte und
 * das Kästchen auf der Codeseite vergaß, lieferte einen Code, der als gültig
 * durchging (Audit Runde 4, R4-A5).
 */
export const STIFT_KAESTCHEN = "[  ] von Hand geändert";
export const STIFT_KAESTCHEN_ANGEKREUZT = "[X] von Hand geändert";

/**
 * Am Meldekopf auf eine andere Stärke gesetzt („Stärke ändern…"), obwohl der Bogen Namen führt? Dann stimmen Zahl und
 * Namensliste nicht mehr überein; der Ausdruck kreuzt „von Hand geändert" an und nennt es unter „Sonstiges" (R15-A3).
 */
export function staerkeVonHand(
  b: Pick<Erfassungsbogen, "personalErfassung" | "staerkeManuell" | "personal">,
): boolean {
  return (
    b.staerkeManuell != null &&
    b.personalErfassung !== PersonalErfassung.NUR_STAERKE &&
    b.personal.length > 0
  );
}

/** Satz unter „Sonstiges" zu {@link staerkeVonHand}: gedruckte Stärke, Zahl der Namen, Stand. */
export function staerkeVonHandSatz(b: Erfassungsbogen): string {
  const s = staerke(b).gesamt;
  return `Stärke am Meldekopf auf ${s} korrigiert (Stand ${zeitpunktDeutsch(b.stand)}); die Namensliste führt ${b.personal.length} und ist nicht angepasst. Der Code trägt die korrigierte Stärke.`;
}

/**
 * Kopfzeile der Codeseiten: Einheit, Funkrufname, Stand. Lose Codeseiten ohne
 * Heftung ließen sich sonst nur durch Scannen einem Bogen zuordnen (R4-A5).
 */
export function codeKopfzeile(
  b: Erfassungsbogen,
  stand: string,
  nummer?: number,
): string {
  const funk = erreichbarkeitZeilen(b)[0];
  const fzg = b.fahrzeuge.find((f) => f.funkrufname);
  return [
    ...(nummer != null ? [`Nr. ${nummer}`] : []),
    einheitAnzeigename(b.einheit),
    ...(fzg && funk ? [`FuRn ${funk}`] : []),
    `Stand ${stand}`,
  ].join(" · ");
}


/** Kasten „Stand am Meldekopf" — oben auf dem Bogen und auf jeder QR-Seite. */
function vermerkKasten(
  v: MeldekopfVermerk,
  margin: [number, number, number, number],
  id?: string,
): Content {
  return {
    ...(id ? { id } : {}),
    table: {
      widths: ["*"],
      body: [
        [
          {
            text: weichUmbrechen(v.stand),
            bold: true,
            fontSize: 8,
            fillColor: v.abgerueckt ? GRAU : undefined,
          },
        ],
      ],
    },
    margin,
  };
}

/**
 * Kopfzeile jeder Bogenseite, im oberen Seitenrand (R5-A2, R5-A3). Der Rand
 * liegt ohnehin leer; die Zeile kostet dem Satz keine Höhe und damit keine
 * Seite. Auf Seite 1 steht der Platz, auf dem der Meldekopf „angenommen,
 * Nr., übertragen“ quittiert — bisher nur auf dem Blanko. Auf jeder Folgeseite
 * stehen Nr. und Einheit: Eine verrutschte Seite 2 war sonst eine Namensliste
 * ohne Absender.
 */
// 16 pt = 5,6 mm vom Papierrand: Viele Drucker lassen oben 3 bis 5 mm unbedruckt (R6-A2; vorher 6 pt = 2 mm).
const RAND_ZEILE_Y = 16;
const NAME_IM_KOPF_MAX = 62;
const UEBERTRAGEN_KURZ = `übertragen ${kasten(false)} von ______ um ____:____ Uhr`;

/** Mit Rahmen und fett (Seite 1: der Platz zum Quittieren), sonst eine schlichte Zeile. */
function randZeile(text: string, rahmen: boolean): Content {
  return {
    margin: [BOGEN_RAENDER[0], RAND_ZEILE_Y, BOGEN_RAENDER[2], 0],
    table: {
      widths: ["*"],
      body: [[{ text, fontSize: 7.5, bold: rahmen, noWrap: true }]],
    },
    layout: {
      hLineWidth: () => (rahmen ? 0.5 : 0),
      vLineWidth: () => (rahmen ? 0.5 : 0),
      paddingTop: () => 0.5,
      paddingBottom: () => 0.5,
      paddingLeft: () => 4,
      paddingRight: () => 4,
    },
  };
}

/** Einheit für die Kopfzeile: einzeilig, notfalls gekürzt. */
function kopfName(name: string): string {
  return name.length > NAME_IM_KOPF_MAX
    ? `${name.slice(0, NAME_IM_KOPF_MAX - 1).trimEnd()}…`
    : name;
}

/**
 * Kopfzeile einer Bogenseite. `nummer` aus dem Meldekopf (Sammel-PDF) oder
 * Ausfülllinie (Einzel-PDF, Blanko). `blatt`/`von`: Seite dieses Bogens.
 */
function bogenKopfzeile(
  einheit: string,
  nummer: number | undefined,
  blatt: number,
  von: number,
): Content {
  const nr = nummer != null ? `Nr. ${nummer}` : "Nr. ______";
  if (blatt === 1) {
    return randZeile(
      nummer != null
        ? `${nr}  ·  ${kopfName(einheit)}  ·  Blatt 1 von ${von}  ·  ${UEBERTRAGEN_KURZ}`
        : `Meldekopf:  ${nr}  ·  eingegangen ____________ um ____:____ Uhr  ·  ${UEBERTRAGEN_KURZ}`,
      true,
    );
  }
  return randZeile(
    `${nr}  ·  ${kopfName(einheit)}  ·  Blatt ${blatt} von ${von} dieses Bogens`,
    false,
  );
}




/** Nur für {@link einsatzPdfDokumentGesetzt} und den Probesatz. */
export interface SammelOptionen {
  /** Index der Bögen, die enger gesetzt werden (R4-A7). */
  verdichtet?: ReadonlySet<number>;
  /** Probesatz: Messpunkte je Bogen, ohne eingebettete Dateien. */
  messen?: boolean;
  /**
   * Seite (ab 1), auf der der Bogen mit dem Index i beginnt — aus einem Probesatz
   * mit Platzhalterbildern. Damit trägt jede Bogenseite im Seitenrand Nr. und Einheit
   * (R5-A3); ohne Angabe bleibt der Rand leer.
   */
  bogenStart?: number[];
  /** Nur die Kasten „Stand am Meldekopf“ tragen eine Kennung — Probesatz für `bogenStart`, ohne Messpunkte, die Höhe kosten. */
  nurKastenKennung?: boolean;
}





/** Was ein Messpunkt beim Setzen über seine Lage meldet (pdfmake `pageBreakBefore`). */
interface MessPosition {
  pageNumber: number;
  top: number;
  verticalRatio: number;
  pageInnerHeight: number;
}


/**
 * QR-Block der letzten Seite. Ein Teil = wie bisher (Bild + antippbarer Link).
 * Mehrere Teile (Segmentierung) = eigene QR-Seiten mit je zwei diagonal
 * versetzten Codes „Teil x / n" (Kamera sieht immer nur einen Code, siehe
 * QR_SEGMENT_BREITE). Der Öffnen-Link — auf dem Text UND auf jedem Teilbild —
 * zeigt dort nicht auf einen einzelnen Teil (der trägt nur einen Abschnitt),
 * sondern auf {@link QrSatz.vollUrl} — den kompletten Bogen in einer URL.
 * Segmentierung ist eine Grenze des QR-Bildes, nicht des Links.
 */
function qrBlock(
  qr: QrSatz,
  akzent: string,
  stand: string,
  vermerk?: MeldekopfVermerk,
  einheit = "",
  gueltigBis = "",
): Content {
  const kopf = (text: string): Content => ({
    text,
    bold: true,
    fontSize: 13,
    color: akzent,
    alignment: "center",
  });
  // Jede Codeseite nennt ihre Einheit (R4-A5). Beim Einzelcode steht die Zeile
  // in der freien Spalte neben dem Bild — über dem Bild kostete sie 36 von 443
  // Beispielbögen eine zweite Seite; auf den eigenen Seiten mehrteiliger Codes
  // steht sie unter der Überschrift.
  const einheitZeile = (): Content => ({
    text: einheit,
    bold: true,
    fontSize: 9,
    alignment: "center",
    margin: [0, 2, 0, 0],
  });
  const einheitSeitlich = (): Content => ({
    text: einheit,
    bold: true,
    fontSize: 8,
    margin: [0, 0, 0, 8],
  });
  // Fett und direkt am Code: Wer den Ausdruck scannt, soll vorher aufs
  // Kästchen schauen (R2-A4). Beim Einzelcode steht er in der freien Spalte
  // links NEBEN dem Bild — unter dem Code kostete die Zeile 6 von 101
  // THW-Beispielbögen eine zweite Seite (unbreakable-Block).
  // Dazu, bis wann der Code Namen liefert: wer sein Papier frisch druckt, ohne den Bogen zu ändern, hält
  // sonst ein Blatt mit lesbaren Namen, dessen Code sie nach der Datenschutzfrist nicht mehr trägt (R11-A1).
  const stift = (): Content => ({
    text: `${stiftHinweis(stand)}${gueltigBis ? ` ${gueltigBis}.` : ""}`,
    bold: true,
    fontSize: 8,
  });
  // Nur in der Sammel-PDF: was der Code nicht enthält, direkt beim Code
  // (R2-A1). Beim Einzelcode steht der Kasten „Stand am Meldekopf“ schon über
  // dem Formular derselben Seite, der Hinweis rechts neben dem Code. Mehrteilige
  // Codes stehen auf eigenen Seiten: dort Kasten und Hinweis neben dem unteren Code (R3-A3).
  const nurBogenHinweis = (): Content => ({
    text: QR_NUR_BOGEN_HINWEIS,
    bold: true,
    fontSize: 8,
  });
  if (qr.teile.length === 1) {
    const t = qr.teile[0]!;
    return {
      unbreakable: true,
      margin: [0, 14, 0, 0],
      stack: [
        kopf("Digitaler Bogen als QR-Code"),
        // QR-Bild UND Textlink tragen dieselbe App-URL: mit der Kamera scannen ODER
        // in der digitalen PDF direkt anklicken, um den Bogen in der App zu öffnen.
        vermerk
          ? // Sammel-PDF: der Hinweis steht NEBEN dem Code — darunter kostete er
            // Bögen mittlerer Stärke eine zweite Seite (R2-A1).
            {
              columns: [
                {
                  width: "*",
                  stack: [einheitSeitlich(), stift()],
                  alignment: "right",
                  margin: [0, 8, 12, 0],
                },
                { image: t.datenUrl, width: QR_BREITE, link: t.url },
                {
                  width: "*",
                  stack: [nurBogenHinweis()],
                  margin: [12, 40, 0, 0],
                },
              ],
              columnGap: 0,
              margin: [0, 8, 0, 0],
            }
          : {
              columns: [
                {
                  width: "*",
                  stack: [einheitSeitlich(), stift()],
                  alignment: "right",
                  margin: [0, 8, 12, 0],
                },
                { image: t.datenUrl, width: QR_BREITE, link: t.url },
                { width: "*", text: "" },
              ],
              columnGap: 0,
              margin: [0, 8, 0, 0],
            },
        {
          text: "Bogen direkt in der App öffnen",
          link: t.url,
          color: akzent,
          decoration: "underline",
          alignment: "center",
          fontSize: 11,
          margin: [0, 8, 0, 0],
        },
        {
          text: "Mit der Kamera scannen oder den Link antippen, um den Bogen digital zu übernehmen.",
          alignment: "center",
          fontSize: 8,
          margin: [0, 6, 0, 0],
        },
      ],
    };
  }
  const anzahl = qr.teile.length;
  // Pro Seite zwei Teile, diagonal versetzt (siehe QR_SEGMENT_BREITE). Jede
  // QR-Seite beginnt auf einer frischen Seite, damit kein Formularrest die
  // Diagonale zusammenstaucht.
  // Jedes Teilbild ist — wie der Einzelcode — antippbar und öffnet den
  // vollständigen Bogen (vollUrl), nicht den einzelnen Abschnitt: Nutzer
  // versuchen sonst, den Link „aus dem QR-Code zu kopieren", und landen beim
  // Bild statt bei der URL (Rückmeldung aus dem OV Oldenburg, Firefox-Viewer).
  const teilZelle = (t: QrSatz["teile"][number]): Content => ({
    stack: [
      {
        text: `Teil ${t.teilNr} / ${anzahl}`,
        bold: true,
        alignment: "center",
        color: akzent,
      },
      {
        image: t.datenUrl,
        width: QR_SEGMENT_BREITE,
        margin: [0, 4, 0, 0],
        link: qr.vollUrl,
      },
    ],
  });
  const oeffnenLink = (): Content => ({
    text: "Bogen direkt in der App öffnen",
    link: qr.vollUrl,
    color: akzent,
    decoration: "underline",
    alignment: "center",
    fontSize: 11,
    margin: [0, 12, 0, 0],
  });
  const hinweis = (): Content => ({
    text:
      // Der Satz folgt dem tatsächlichen Verhalten (Audit Runde 2, R2-A2):
      // Live-Scan sieht einen Code auf einmal, „Bögen einlesen…" liest alle
      // Codes eines Fotos und merkt sich Teile bis zum nächsten Foto.
      `Alle ${anzahl} Teile nacheinander mit der Kamera scannen — die App setzt den Bogen zusammen. ` +
      `Beim Live-Scan jeweils nur einen Code ins Kamerabild nehmen. Fotos ganzer Seiten liest „Bögen einlesen…“ ` +
      `mit allen Codes; fehlende Teile dürfen auch in einem späteren Foto kommen. ` +
      `In der digitalen PDF geht es auch ohne Scannen: der Link unten öffnet den vollständigen Bogen.`,
    fontSize: 7.5,
  });
  // Der Erklärtext steht NEBEN den Codes, in der Fläche, die die Diagonale
  // ohnehin frei lässt: rechts neben dem oberen Code Anleitung und Stift-
  // Kästchen, links neben dem unteren Code Kasten „Stand am Meldekopf" und
  // was der Code nicht enthält. Untereinander gestapelt sprengten sie in der
  // Sammel-PDF die Seite; 7 von 38 Seiten trugen dann nur noch die letzte
  // Zeile des Erklärtexts (Audit Runde 3, R3-A3).
  const SEITENTEXT_ABSTAND = 12;
  const anleitung = (): Content[] => [
    hinweis(),
    { ...(stift() as object), margin: [0, 8, 0, 0] } as Content,
  ];
  const meldekopf = (): Content[] =>
    vermerk
      ? [
          vermerkKasten(vermerk, [0, 0, 0, 0]),
          { ...(nurBogenHinweis() as object), margin: [0, 6, 0, 0] } as Content,
        ]
      : [];
  const seiten: Content[] = [];
  for (let i = 0; i < qr.teile.length; i += 2) {
    const links = qr.teile[i]!;
    const rechts = qr.teile[i + 1];
    const stack: Content[] = [
      kopf(`Digitaler Bogen als QR-Code (${anzahl} Teile)`),
      einheitZeile(),
      // Erster Code oben links, daneben die Anleitung …
      {
        columns: [
          { width: "auto", stack: [teilZelle(links)] },
          {
            width: "*",
            stack: anleitung(),
            margin: [SEITENTEXT_ABSTAND, 24, 0, 0],
          },
        ],
        margin: [0, 10, 0, 0],
      },
    ];
    if (rechts) {
      // … zweiter Code unten rechts (der obere Rand erzeugt den vertikalen
      // Diagonalabstand), links daneben der Stand am Meldekopf.
      stack.push({
        columns: [
          {
            width: "*",
            stack: meldekopf(),
            margin: [0, 24, SEITENTEXT_ABSTAND, 0],
          },
          { width: "auto", stack: [teilZelle(rechts)] },
        ],
        margin: [0, 150, 0, 0],
      });
    } else if (vermerk) {
      // Letzte Seite mit nur einem Code: der Platz unten ist frei.
      stack.push({ stack: meldekopf(), margin: [0, 16, 0, 0] });
    }
    stack.push(oeffnenLink());
    seiten.push({ stack, pageBreak: "before" });
  }
  return { stack: seiten };
}

/**
 * Kasten oben auf dem Vordruck: was der Meldekopf auf das Papier schreibt —
 * Eingang, Nummer, Zug, Übung, und der Haken „ins Gerät übertragen“. Auf dem
 * Vordruck fehlte beides: Nach einer Papierphase tippen zwei Helfer denselben
 * Stapel ab oder ein Blatt bleibt liegen, und ein handschriftlicher
 * Übungsbogen wird in einer echten Lage mitgezählt (Audit Runde 4, R4-A4).
 * Die Felder entsprechen dem Kasten „Stand am Meldekopf“ der Sammel-PDF.
 */
function blankoMeldekopf(z: BlankoZeilen): Content {
  return {
    table: {
      widths: ["*"],
      body: [
        [
          {
            stack: [
              {
                text: "Meldekopf:   Nr. ______   ·   eingegangen am ____________  um ____:____ Uhr   ·   Zug / Verband: ________________",
              },
              // „abgerückt am … um …" neben „eingegangen": Rückt die Einheit ab, während das Gerät aus ist, steht die
              // Uhrzeit auf ihrem Blatt statt nur auf dem Meldeblock (R11-A2).
              {
                // Zwei Zeilen: Mit gezeichneten Kästchen (pdf-kaestchen.ts) bricht eine Zeile nur am Ende sauber um.
                text: `${kasten(false)} ÜBUNG (kein Einsatz)  ·  abgerückt am __________ um ____:____ Uhr\nins Gerät übertragen ${kasten(false)} von ______ um ____:____ Uhr`,
                margin: [0, 5, 0, 0],
              },
              // Beiblatt (R5-A6): Der Vordruck fasst 4 Fahrzeuge und 6 Qualifikationen. Mehr gehört
              // auf einen zweiten Vordruck mit gleicher Einheit und Nr., nicht an den Rand.
              {
                text: `Blatt ____ von ____   ·   Reicht der Platz nicht (mehr als ${z.personal} Personen, ${z.fahrzeuge} Fahrzeuge oder ${z.qualifikationen} Qualifikationen): weiteren Vordruck als Beiblatt nehmen, dort Einheit und Nr. eintragen und hier die Blattzahl nachtragen.`,
                bold: false,
                fontSize: 7.5,
                lineHeight: 1.25,
                margin: [0, 5, 0, 0],
              },
            ],
            bold: true,
            margin: [0, 3, 0, 3],
          },
        ],
      ],
    },
    margin: [0, 0, 0, 6],
  };
}

/**
 * Zeilenzahlen des Blanko-Vordrucks (leerer Bogen zum Ausfüllen mit der Hand).
 * Die Anzahl ist bewusst nicht fest verdrahtet: wie viele Fahrzeug- und
 * Personalzeilen sinnvoll sind, hängt am Papierformat und nicht am Layoutcode.
 */
export interface BlankoZeilen {
  fahrzeuge: number;
  personal: number;
  qualifikationen: number;
}

/** Zählrolle als Kürzel, wie in der Stärke „F / UF / M" (R3-A6). */
const ROLLE_KURZ: Record<number, string> = {
  [StaerkeRolle.FUEHRER]: "F",
  [StaerkeRolle.UNTERFUEHRER]: "UF",
  [StaerkeRolle.MANNSCHAFT]: "M",
};

/**
 * Platz für Stiftnachträge im Einzel-PDF (R3-A6) — nur, wenn er keine Seite
 * kostet; siehe {@link einzelPdfDokument}.
 */
export interface NachtragsPlatz {
  /** Freie Zeilen unter dem Personal. */
  freiePersonalZeilen?: number;
  /** Ein leerer Fahrzeugblock unter den Fahrzeugen. */
  freiesFahrzeug?: boolean;
  /** Messpunkt hinter dem letzten Inhalt (nur für den Probesatz). */
  messpunkt?: boolean;
  /** Kennung des Messpunkts — in der Sammel-PDF je Bogen eine eigene (R4-A7). */
  messKennung?: string;
  /**
   * Enger gesetzt: weniger Innenabstand und Zwischenraum, damit der Bogen samt
   * Kasten „Stand am Meldekopf“ auf seine Seiten passt, statt mit der letzten
   * Zeile allein auf einer weiteren zu stehen (R4-A7).
   */
  verdichtet?: boolean;
}

/** Freie Personalzeilen, wenn Platz ist (R3-A6). */
const PERSONAL_NACHTRAG_ZEILEN = 2;
/** Höhe einer leeren Personalzeile in pt: Zeilenhöhe der Vorlage (19,85), aufgerundet. */
const LEERZEILE_HOEHE = 20;
/** Höhe eines leeren Fahrzeugblocks in pt: 28,35 + 56,7 aus der Vorlage, aufgerundet; Blöcke stoßen ohne Abstand aneinander. */
const LEERFAHRZEUG_HOEHE = 86;
const MESS_BOGEN_ENDE = "bogen-ende";

/** Fahrzeug ohne Angaben — Platzhalter für die Fahrzeugblöcke des Blanko-Vordrucks. */
const BLANKO_FAHRZEUG: Fahrzeug = { typ: { freitext: "" } };

/**
 * Bogen + QR-Satz → pdfmake-DocDefinition (Papier-Layout).
 *
 * `qr = null` lässt den QR-Block weg — ein Bogen ohne Inhalt hat nichts zu
 * transportieren. `blanko` schaltet auf den Vordruck um: alle abgeleiteten
 * Werte (Stärke, Sofortbedarf-Zahlen) werden zu Ausfülllinien, und statt der
 * leeren Datenlisten entstehen leere Zeilen. Ohne `blanko` würde derselbe
 * leere Bogen „0 / 0 / 0 / 0" und „01.01.2020" drucken — auf einem Vordruck
 * sind das falsche Angaben, keine Leerstellen.
 */
export function pdfDokument(
  b: Erfassungsbogen,
  qr: QrSatz | null,
  blanko?: BlankoZeilen,
  /** Nur Sammel-PDF: Stand der Einheit am Meldekopf neben dem QR-Code (R2-A1). */
  vermerk?: MeldekopfVermerk,
  /** Nur Einzel-PDF: Platz für Stiftnachträge (R3-A6). */
  zusatz?: NachtragsPlatz,
): TDocumentDefinitions {
  b = ohneVorbelegung(b);
  const org = b.einheit.organisation;
  const farbe = orgFarbePapier(org);
  const typName =
    vokabText(
      b.einheit.einheitsTyp,
      vokabularFuer(org, "einheitstyp"),
      "name",
    ) || "Einheit";
  const typKurz = vokabText(
    b.einheit.einheitsTyp,
    vokabularFuer(org, "einheitstyp"),
  );
  const s = staerke(b);
  const mwd = unterbringungMWD(b);
  const vp = verpflegung(b);
  const ansprech = b.personal[0];
  // Verdichteter Satz (Sammel-PDF, R4-A7): knappere Innenabstände und Lücken.
  const dicht = zusatz?.verdichtet === true;
  const tabLayout = rahmenLayout(dicht);
  /** Mindesthöhe einer Zeile wie in der Vorlage; verdichtet ohne. */
  // pdfmake rechnet die Höhe ohne Innenabstand oben/unten.
  const hoch = (pt: number): number | "auto" =>
    dicht ? "auto" : pt - 2 * 2;
  /** Schriftgröße des Formulars: 10 pt wie die Vorlage, verdichtet 8 pt. */
  const schrift = dicht ? 8 : 10;
  /** Abstand in pt, verdichtet halb so groß. */
  const luecke = (pt: number): number => (dicht ? Math.ceil(pt / 2) : pt);

  // Ausfülllinie statt eines errechneten Werts (nur Vordruck). Bewusst kurz:
  // vier Stärkezahlen nebeneinander müssen in eine Tabellenzelle passen, ohne
  // dass die letzte in die zweite Zeile rutscht.
  const linie = "____";
  /** Zahl im ausgefüllten Bogen, Ausfülllinie im Vordruck. */
  const zahl = (n: number) => (blanko ? linie : String(n));
  /** Leere Tabellenzeile mit Schreibhöhe — die Ränder bilden die Ausfülllinien. */
  const leerZelle = (): TableCell => ({
    text: " ",
    // Verdichtet fehlt die Mindesthöhe der Zeile — dann trägt die Zelle sie
    // selbst. Sonst gibt die Zeilenhöhe der Vorlage (19,85 pt) die Schreibhöhe.
    margin: (dicht ? [0, 5, 0, 5] : [0, 2, 0, 2]) as [number, number, number, number],
  });
  /** Beschriftung im Kopf: fett, senkrecht mittig wie in der Vorlage. */
  const feld = (text: string, extra: Partial<TableCell> = {}): TableCell =>
    ({ text, bold: true, verticalAlignment: "middle", ...extra }) as TableCell;
  /** Wert im Kopf: senkrecht mittig. */
  const wert = (text: string, extra: Partial<TableCell> = {}): TableCell =>
    ({ text, verticalAlignment: "middle", ...extra }) as TableCell;
  /** Von einer colSpan-Zelle belegter Platz. */
  const belegt = (n: number): TableCell[] => Array.from({ length: n }, () => ({}));

  // Kopf im Spaltenraster der Vorlage (sieben Spalten, siehe RASTER):
  //   Stärke | Wert (3 Spalten) | Ansprechpartner/in (2) | Name
  //   OV/RB/LV | Name (3) | Telefon/eMail | Nummern (2)
  //   Einsatzzeitraum, Einsatzort (3) | Wert (4)
  //   Einsatzbeginn (2) | Wert | Einsatzende (2) | Wert (2)
  const infoZeilen: TableCell[][] = [
    [
      // Mit Legende: „____ / ____ / ____ / ____" allein sagte nicht, welche
      // Linie welche Zahl ist (Audit Runde 2, R2-A6) — und „1 / 1 / 2 / 4"
      // ließ sich nach einer Stiftkorrektur nicht gegen die Namen prüfen
      // (Audit Runde 3, R3-A6). Gleiche Beschriftung auf Vordruck und Bogen.
      {
        verticalAlignment: "middle",
        stack: [
          { text: "Stärke:", bold: true },
          { text: "F / UF / M // Ges.", fontSize: 6.5 },
        ],
      },
      {
        colSpan: 3,
        verticalAlignment: "middle",
        // Mit Code: das Kästchen „von Hand geändert“ gehört hierher, wo mit
        // dem Stift korrigiert wird, nicht auf die Codeseite (R4-A5).
        stack: [
          {
            text: `${zahl(s.fuehrer)} / ${zahl(s.unterfuehrer)} / ${zahl(s.mannschaft)} // ${zahl(s.gesamt)}`,
          },
          ...(qr
            ? [
                {
                  text:
                    !blanko && staerkeVonHand(b)
                      ? STIFT_KAESTCHEN_ANGEKREUZT
                      : STIFT_KAESTCHEN,
                  bold: true,
                  fontSize: schrift - 2,
                } as Content,
              ]
            : []),
        ],
      },
      ...belegt(2),
      feld("Ansprechpartner/in:", { colSpan: 2 }),
      ...belegt(1),
      wert(
        ansprech
          ? ansprechpersonPapier(`${ansprech.vorname} ${ansprech.nachname}`)
          : "",
      ),
    ],
  ];
  for (const h of b.einheit.hierarchie) {
    const ebene = vokabText(h.bezeichnung, vokabularFuer(org, "ebene")) || "Ebene";
    // „OV“, „RB“, „LV“ passen in die 63,8-pt-Spalte der Vorlage; „Ortsfeuerwehr“
    // oder „übergeordnete Ebene“ brächen mitten im Wort um und bekommen die
    // nächste Rasterkante (173,5 pt) dazu.
    const breit = laengstesWort(ebene) > 8;
    infoZeilen.push([
      feld(ebene, breit ? { colSpan: 2 } : {}),
      ...belegt(breit ? 1 : 0),
      wert(weichUmbrechen(h.kurz ? `${h.name} (${h.kurz})` : h.name), {
        colSpan: breit ? 2 : 3,
      }),
      ...belegt(breit ? 1 : 2),
      feld("Telefon:\neMail:"),
      wert(weichUmbrechen(`${h.telefon ?? "—"}\n${h.email ?? "—"}`), {
        colSpan: 2,
      }),
      ...belegt(1),
    ]);
  }
  infoZeilen.push([
    feld("vorgesehener Einsatzzeitraum:", { colSpan: 3 }),
    ...belegt(2),
    wert(blanko ? `${linie}______  –  ${linie}______` : zeitraumVonBis(b), {
      colSpan: 4,
    }),
    ...belegt(3),
  ]);
  infoZeilen.push([
    feld("vorgesehener Einsatzort / Auftrag:", { colSpan: 3 }),
    ...belegt(2),
    wert(weichUmbrechen(b.einsatz.ortAuftrag), { colSpan: 4 }),
    ...belegt(3),
  ]);
  infoZeilen.push([
    feld("Einsatzbeginn:", { colSpan: 2 }),
    ...belegt(1),
    wert(
      b.einsatz.einsatzbeginn != null
        ? zeitpunktDeutsch(b.einsatz.einsatzbeginn)
        : "",
    ),
    feld("Einsatzende:", { colSpan: 2 }),
    ...belegt(1),
    wert(
      b.einsatz.einsatzende != null
        ? zeitpunktDeutsch(b.einsatz.einsatzende)
        : "",
      { colSpan: 2 },
    ),
    ...belegt(1),
  ]);


  const fahrzeugBlock = (f: Fahrzeug, leer = !!blanko): Content => {
    const stan =
      leer || f.stanKonform != null
        ? `Ausstattung nach StAN: ja ${kasten(!leer && f.stanKonform === true)} / nein ${kasten(!leer && f.stanKonform === false)}\n`
        : "";
    return {
      layout: tabLayout,
      // Ein Fahrzeug steht ganz auf einer Seite: Das taktische Zeichen läuft über zwei Zeilen,
      // und der Block riss über die Seitengrenze — „Tiefl 18 t“ nur als Bild, der Text auf
      // der nächsten Seite (R5-A3).
      unbreakable: true,
      table: {
        // Spalten wie in der Vorlage: Zeichen | Fahrzeug | Kennzeichen | Funkrufname.
        widths: [
          spalte(raster(0, 1)),
          spalte(RASTER[2]),
          spalte(raster(3, 4)),
          spalte(raster(5, 6)),
        ],
        heights: [hoch(ZEILE_HOCH), hoch(ZEILE_FAHRZEUG_UNTEN)],
        body: [
          [
            {
              // Taktisches Zeichen (DV 102), zeilenübergreifend links und wie in
              // der Vorlage mittig im 85 pt hohen Block.
              svg: fahrzeugSymbolSvg(f, org),
              width: 50,
              rowSpan: 2,
              alignment: "center",
              margin: (dicht ? [2, 6, 2, 6] : [2, 20, 2, 6]) as [
                number,
                number,
                number,
                number,
              ],
            },
            // Im Vordruck stehen hier die Feldnamen — sonst wäre die Zeile eine
            // beschriftungslose Leerzeile, in der niemand weiß, was hingehört.
            feld(
              leer
                ? "Fahrzeug:"
                : vokabText(f.typ, vokabularFuer(org, "fahrzeug")) || "Fahrzeug",
            ),
            feld(leer ? "Kennzeichen:" : kennzeichenText(f)),
            // Erfasste Sitzplätze stehen als Zahl. Ohne eigene Angabe steht der
            // Richtwert des Typs, aber als solcher gekennzeichnet: in der App
            // zählte er in die Sitzplatzbilanz, auf dem Papier fehlte er ganz
            // (Rückmeldung OV Chemnitz, 11/2026). „(Richtwert)“ hält ihn von
            // einer Zusage der Einheit unterscheidbar.
            leer
              ? feld("FuRn:")
              : {
                  verticalAlignment: "middle",
                  stack: [
                    ...(f.funkrufname
                      ? [{ text: `FuRn: ${funkrufText(f, b.einheit)}`, bold: true }]
                      : []),
                    ...(sitzplatzZeile(f, org)
                      ? [{ text: sitzplatzZeile(f, org), fontSize: schrift - 2 }]
                      : []),
                    { text: "" },
                  ],
                },
          ],
          [
            {}, // von rowSpan des Zeichens belegt
            {
              colSpan: 3,
              // Zeilenabstand wie Word in der Vorlage; die 56,7 pt der Zeile haben Platz dafür.
              lineHeight: dicht ? 1 : 1.25,
              text: [
                { text: `${stan}Änderungen bzw. Sondergerät:`, bold: true },
                leer ? "" : ` ${weichUmbrechen(f.aenderungen ?? "")}`,
              ],
            },
            {},
            {},
          ],
        ],
      },
      fontSize: schrift,
      // Die Blöcke schließen wie in der Vorlage ohne Lücke aneinander: Die
      // Unterkante des einen ist die Oberkante des nächsten.
      margin: [0, 0, 0, -LINIE] as [number, number, number, number],
    };
  };
  const fahrzeuge: Content[] = blanko
    ? Array.from({ length: blanko.fahrzeuge }, () =>
        fahrzeugBlock(BLANKO_FAHRZEUG),
      )
    : [
        ...b.fahrzeuge.map((f) => fahrzeugBlock(f)),
        // Ein leerer Fahrzeugblock zum Nachtragen, wenn Platz ist (R3-A6).
        ...(zusatz?.freiesFahrzeug
          ? [fahrzeugBlock(BLANKO_FAHRZEUG, true)]
          : []),
      ];

  // Spalte „Rolle" (F / UF / M): Ohne sie ließ sich eine von Hand geänderte
  // Stärke auf dem Blatt nicht gegen die Namen prüfen (Audit Runde 3, R3-A6).
  // Ausgefüllter Bogen: drei Spalten, die Erreichbarkeit steht klein unter dem
  // Namen. Als eigene Spalte (160 pt) blieb sie meist leer — es trägt ja oft nur
  // eine Person eine Nummer — und drückte die Funktionen in 118 pt zusammen
  // (Rückmeldung OV Chemnitz, 11/2026). Der Vordruck behält die Spalte: dort
  // wird von Hand geschrieben und gebraucht wird der Platz.
  // Kopfzeile wie in der Vorlage: weiß, fett, 8 pt.
  const kopf = (text: string, fontSize = 8): TableCell =>
    ({ text, bold: true, fontSize, verticalAlignment: "middle" }) as TableCell;
  const personalZeilen: TableCell[][] = [
    blanko
      ? [
          kopf("Funktion/Zusatzfunktionen"),
          kopf("Rolle\nF/UF/M", 6.5),
          kopf("Name, Vorname"),
          kopf("D = dienstlich / P = privat"),
        ]
      : [
          kopf("Funktion/Zusatzfunktionen"),
          kopf("Rolle\nF/UF/M", 6.5),
          kopf("Name, Vorname\nErreichbarkeit (D = dienstlich / P = privat)"),
        ],
  ];
  for (let i = 0; blanko && i < blanko.personal; i++) {
    personalZeilen.push([leerZelle(), leerZelle(), leerZelle(), leerZelle()]);
  }
  for (const p of blanko ? [] : b.personal) {
    // Abweichende Dienststelle als erste Zeile der Kontaktspalte („OV: Bremen - Nord"),
    // wie am Meldekopf gewünscht: Bei einer aus mehreren OVs zusammengestellten
    // Einheit sieht man so auf einen Blick, wer woher kommt. Personen aus der
    // Dienststelle der Einheit bekommen keine Zeile — das steht im Kopf des Bogens.
    const dienststelle = p.dienststelle
      ? [
          `${org === OrganisationsTyp.THW ? "OV" : "Dienststelle"}: ${weichUmbrechen(p.dienststelle)}`,
        ]
      : [];
    const kontakte = [
      ...dienststelle,
      ...p.kontakte.map((k) => {
        // Alte Bögen konnten statt einer Adresse ein Template tragen (siehe Kontakt).
        if (k.emailTemplate != null)
          return `eMail: — (${k.dienstlich ? "D" : "P"})`;
        // Funkrufname ohne (D)/(P): nie privat.
        if (k.art === KontaktArt.FUNK)
          return `Funk: ${weichUmbrechen(k.wert ?? "")}`;
        const art =
          k.art === KontaktArt.EMAIL
            ? "eMail"
            : k.art === KontaktArt.MOBIL
              ? "Mobil"
              : "Telefon";
        return `${art}: ${weichUmbrechen(k.wert ?? "")} (${k.dienstlich ? "D" : "P"})`;
      }),
    ].join("\n");
    personalZeilen.push([
      wert(funktionsText(p, org)),
      wert(ROLLE_KURZ[p.staerkeRolle] ?? "", { alignment: "center" }),
      kontakte
        ? wert("", { text: [namePapier(p.nachname, p.vorname), { text: `  ${kontakte.replace(/\n/g, " · ")}`, fontSize: schrift - 2 }] })
        : wert(namePapier(p.nachname, p.vorname)),
    ]);
  }
  // Freie Zeilen für Nachrückende: Wer auf dem Ausdruck nachträgt und „von
  // Hand geändert" ankreuzt, schrieb sonst an den Rand (R3-A6). Nur bei
  // vollständig erfasstem Personal — „nur Stärke" hat keine Namensliste.
  // Wie viele, entscheidet einzelPdfDokument nach einer Messung.
  if (!blanko && b.personalErfassung !== PersonalErfassung.NUR_STAERKE) {
    for (let i = 0; i < (zusatz?.freiePersonalZeilen ?? 0); i++)
      personalZeilen.push([leerZelle(), leerZelle(), leerZelle()]);
  }

  const qualiZeilen: TableCell[][] = [
    [wert("Name, Vorname"), wert("Qualifikation")],
  ];
  for (let i = 0; blanko && i < blanko.qualifikationen; i++) {
    qualiZeilen.push([leerZelle(), leerZelle()]);
  }
  for (const p of blanko ? [] : b.personal) {
    if (p.zusatzqualifikationen.length > 0) {
      // Qualifikationen und Berufe stehen beide in dieser Tabelle — die Berufe
      // als ein „Beruf: …"-Block hinter den Qualifikationen, damit der Leser
      // sieht, was Lehrgang ist und was Brotberuf (beruf.ts).
      const { qualifikationen, berufe } = qualifikationenUndBerufe(p);
      const teile = qualifikationen.map((q) => q.freitext ?? `#${q.code}`);
      if (berufe.length > 0)
        teile.push(BERUF_PRAEFIX + berufe.map(berufText).join(", "));
      qualiZeilen.push([
        wert(namePapier(p.nachname, p.vorname)),
        wert(weichUmbrechen(teile.join(", "))),
      ]);
    }
  }
  if (qualiZeilen.length === 1)
    qualiZeilen.push([{ text: " " }, { text: " " }]);

  const sofort: Content[] = [];
  if (b.sofortbedarf) {
    const sb = b.sofortbedarf;
    // Auf dem Vordruck Luft zwischen den Zeilen: Die Kästchen berührten sich, „[ ] Betriebsstoff“
    // war angeschnitten und die Ausfülllinie „____ vegan“ lief in die nächste Zeile (R5-A7).
    const zeile = (text: string): Content => ({
      text,
      ...(blanko
        ? { margin: [0, 3, 0, 3] as [number, number, number, number] }
        : {}),
    });
    sofort.push({
      layout: tabLayout,
      fontSize: schrift,
      lineHeight: dicht ? 1 : 1.2,
      table: {
        // Trennlinie auf der Kante „Einsatzende“/Funkrufname der Vorlage.
        widths: [spalte(raster(0, 4)), spalte(raster(5, 6))],
        // Der Kasten bleibt ganz: In der Sammel-PDF stand die letzte Zeile
        // („M 11 / W 1 / D 0“) allein auf einer Seite, die Beschriftung davor (R4-A7).
        dontBreakRows: true,
        body: [
          blanko
            ? [
                {
                  stack: [
                    { text: "Sofortbedarf:", bold: true, decoration: "underline" },
                    zeile(
                      `${kasten(false)} Verpflegung für ${zahl(sb.verpflegungPersonen)} Personen, davon ${zahl(vp.vegetarisch)} vegetarisch, ${zahl(vp.vegan)} vegan`,
                    ),
                    zeile(
                      `${kasten(false)} Betriebsstoff: ${zahl(sb.dieselLiter)} l Diesel / ${zahl(sb.benzinLiter)} l Benzin / ${zahl(sb.gemischLiter)} l Gemisch`,
                    ),
                  ],
                },
                {
                  stack: [
                    zeile(`${kasten(false)}  Unterbringung`),
                    zeile(`${kasten(false)}  Ruhezeit erforderlich`),
                    zeile(
                      `Anzahl Unterbringung/WC/Dusche:\nM ${zahl(mwd.m)} / W ${zahl(mwd.w)} / D ${zahl(mwd.d)}`,
                    ),
                  ],
                },
              ]
            : sofortbedarfZellen(sb, vp, mwd),
        ],
      },
      // Schließt wie in der Vorlage direkt an den letzten Fahrzeugblock an.
      margin: [0, 0, 0, 0] as [number, number, number, number],
    });
  }

  /**
   * Titelbalken wie in der Vorlage: links das Kurzzeichen der Einheit, in der
   * Mitte der Titel weiß auf der Kennfarbe, rechts das Logo der Organisation
   * (THW: Wortbildmarke aus der Vorlage; ASB, Bundespolizei, Bundeswehr, DLRG, DRK,
   * JUH, MHD:
   * pdf-logos.ts), bei allen ohne Logo der Name der Organisation als Text.
   */
  // Kurzzeichen links im Titelbalken (in der Vorlage „Fb Fü 6 / K (A)“): Die
  // Spalte ist nur 56 pt breit. Kurze Zeichen wie „FGr K (A)“ stehen in 10 pt,
  // etwas längere in 7 pt; ein Wort, das auch dann nicht passt
  // („Schwerpunktfeuerwehr“), bliebe zerhackt und fällt weg — der Titel daneben
  // nennt die Einheit ohnehin ausgeschrieben.
  const titelKurz = laengstesWort(typKurz) <= 13 ? typKurz : "";
  const titelKurzGroesse = laengstesWort(titelKurz) <= 9 ? schrift : 7;
  const titelZeile = (): Content => {
    const mitte = (extra: Partial<TableCell>): TableCell =>
      ({ alignment: "center", verticalAlignment: "middle", ...extra }) as TableCell;
    const orgName: Content[] = b.einheit.organisationName
      ? [{ text: weichUmbrechen(b.einheit.organisationName), fontSize: 7, color: farbe.akzent }]
      : [];
    const logo = ORG_LOGOS[org];
    const rechts: TableCell = blanko
      ? mitte({ text: "Organisation:", bold: true, alignment: "left" })
      : org === OrganisationsTyp.THW
        ? mitte({
            stack: [
              {
                image: THW_LOGO_JPEG,
                width: THW_LOGO_BREITE,
                height: THW_LOGO_HOEHE,
                alignment: "center",
              },
              ...orgName,
            ],
          })
        : logo
          ? mitte({
              stack: [
                // 1 pt Luft: ASB und Malteser reichen bis an den unteren Rand ihrer Zeichenfläche.
                { svg: logo.svg, width: logo.breite, height: logo.hoehe, alignment: "center", margin: [0, 0, 0, 1] },
                ...orgName,
              ],
            })
          : mitte({
              stack: [{ text: orgLabel(org), bold: true, fontSize: 11, color: farbe.akzent }, ...orgName],
            });
    return {
      layout: { ...tabLayout, paddingLeft: () => 2, paddingRight: () => 2 },
      fontSize: schrift,
      table: {
        widths: [spalte(RASTER[0]) + 3, spalte(raster(1, 5)) + 3, spalte(RASTER[6]) + 3],
        heights: () => hoch(ZEILE_TITEL),
        body: [
          [
            // Der Vordruck gehört keiner Einheit — sie wird erst beim Ausfüllen bekannt.
            mitte({ text: blanko ? "Einheit:" : titelKurz, bold: true, fontSize: titelKurzGroesse }),
            mitte({
              text: blanko ? "Erfassungsbogen" : `Erfassungsbogen ${typName}`,
              color: farbe.schrift,
              fillColor: farbe.balken,
              bold: true,
            }),
            rechts,
          ],
        ],
      },
      margin: [0, 0, 0, -LINIE],
    };
  };

  return winAnsiDokument({
    pageSize: "A4",
    pageMargins: BOGEN_RAENDER,
    defaultStyle: { fontSize: 8, font: SCHRIFT },
    // Titel mit Einheit und Stand: Ein im Tab angezeigter Bogen hat keinen Dateinamen, der Titel unterscheidet ihn in Tab und Ablage (R16-A3).
    info: {
      title: blanko
        ? `Erfassungsbogen ${typKurz || typName}`
        : `Erfassungsbogen ${einheitAnzeigename(b.einheit)}, Stand ${zeitpunktDeutsch(b.stand)}`,
    },
    ...(b.uebung ? { background: uebungsWasserzeichen() } : {}),
    // Maschinenlesbares JSON dokumentweit einbetten (ZUGFeRD-artig). Am
    // Vordruck hinge dort ein leerer Bogen — ein Anhang ohne jede Aussage.
    ...(blanko
      ? {}
      : { files: { [EEB_JSON_DATEINAME]: bogenAlsEingebetteteDatei(b) } }),
    // Kopfzeile im Seitenrand: Seite 1 der Platz für „Nr., eingegangen, übertragen“, jede
    // Folgeseite Nr. und Einheit (R5-A2, R5-A3). Die Sammel-PDF nimmt nur den Inhalt
    // dieses Dokuments und setzt ihre eigene Kopfzeile mit der Nr. des Meldekopfs.
    header: blanko
      ? (seite) =>
          seite > 1
            ? randZeile(
                "Einheit: ______________________________   ·   Nr. ______   ·   Blatt ____ von ____",
                false,
              )
            : { text: "" }
      : (seite, gesamt) =>
          bogenKopfzeile(
            einheitAnzeigename(b.einheit),
            undefined,
            seite,
            gesamt,
          ),
    footer: (seite, gesamt) => ({
      columns: [
        {
          // „ÜBUNG" auf jeder Seite (BB-A3): Die Störer-Zeile steht nur auf Seite 1,
          // lose Folgeblätter einer Kopie trugen sonst keine Kennzeichnung.
          text: `${!blanko && b.uebung ? "ÜBUNG · " : ""}${blanko ? "Stand:" : `Stand: ${zeitgruppe(b.stand)}`}`,
          // Bündig mit dem Rahmen des Bogens.
          margin: [BOGEN_RAENDER[0], 0, 0, 0],
        },
        {
          text: `${seite} / ${gesamt}`,
          alignment: "right",
          margin: [0, 0, BOGEN_RAENDER[2], 0],
        },
      ],
      fontSize: 8,
    }),
    content: [
      // Störer VOR dem Kopf: das Wasserzeichen allein kann beim Kopieren oder
      // blassen Druck untergehen, die Textzeile nicht.
      ...(b.uebung ? [uebungsStoerer()] : []),
      // ---- Meldekopf-Kasten (nur Vordruck) ----
      ...(blanko ? [blankoMeldekopf(blanko)] : []),
      // ---- Kopf ----
      titelZeile(),
      {
        layout: tabLayout,
        fontSize: schrift,
        table: {
          widths: RASTER.map(spalte),
          heights: () => hoch(ZEILE_HOCH),
          body: infoZeilen,
        },
        margin: [0, -LINIE, 0, -LINIE],
      },
      ...fahrzeuge,
      ...sofort,

      // ---- Personal ----
      // Kein fester Seitenumbruch: kleine Einheiten passen so auf eine Seite,
      // größere lässt pdfmake bei Bedarf selbst umbrechen.
      {
        layout: tabLayout,
        fontSize: schrift,
        // Zeilen bleiben ganz: Auf Seite 1 des Vordrucks stand die letzte
        // Personalzeile nur als 3-mm-Streifen über der Fußzeile (R4-A8). Der
        // Vordruck wiederholt den Tabellenkopf auf Seite 2.
        // Spalten nach der Vorlage: Funktion 127,4 pt, Name 163 pt, Erreichbarkeit
        // 184,3 pt; die Rolle bekommt im Vordruck 30 pt aus der Namensspalte.
        // Ausgefüllt steht die Erreichbarkeit klein hinter dem Namen (Rückmeldung
        // OV Chemnitz, 11/2026); Funktion und Rolle nehmen dann alles bis zur
        // Kante Name/Erreichbarkeit der Vorlage (364,8 pt), sonst brächen
        // Funktionen wie „Führungsassistent/-in (Zugtrupp) — Personalreserve“
        // auf drei Zeilen um.
        table: {
          widths: blanko
            ? [spalte(127.4), spalte(30), spalte(133), spalte(184.5)]
            : [spalte(260.4), spalte(30), spalte(184.5)],
          heights: () => hoch(ZEILE_PERSONAL),
          body: personalZeilen,
          dontBreakRows: true,
          // Der Tabellenkopf wiederholt sich auf der Folgeseite und steht nie
          // allein am Seitenende.
          headerRows: 1,
          keepWithHeaderRows: 1,
        },
        margin: [0, luecke(12), 0, luecke(10)],
      },
      ...(!blanko && bogenAnonymisiert(b)
        ? [
            {
              text: ANONYM_PERSONAL_SATZ,
              bold: true,
              margin: [0, 0, 0, 6],
            } as Content,
          ]
        : []),
      ...(b.personalErfassung === PersonalErfassung.NUR_STAERKE
        ? [
            {
              text: nurSollstaerke(b)
                ? "Personal am Meldekopf nur in Stärke erfasst. Die Zahl ist die Sollstärke der Vorbelegung, nicht gezählt."
                : "Personal am Meldekopf nur in Stärke erfasst.",
              italics: true,
              margin: [0, 0, 0, 6],
            } as Content,
          ]
        : []),
      {
        text: "weitere interne / externe Qualifikationen obiger Helfer/-innen:",
        fontSize: schrift,
        margin: [0, 0, 0, 4],
      },
      {
        layout: tabLayout,
        fontSize: schrift,
        // Spalten der Vorlage: 171,25 pt Name (w:tblGrid 3425 Twips), Rest Qualifikation.
        table: {
          widths: [spalte(171.25), spalte(RAHMEN_BREITE - 171.25)],
          heights: () => hoch(ZEILE_PERSONAL),
          body: qualiZeilen,
          // Zeilen bleiben ganz, der Kopf wiederholt sich auf der Folgeseite: Eine am Seitenende
          // geteilte Zeile ragte in den Fußrand, und die Kopfzeile der Seite stand quer über ihr.
          dontBreakRows: true,
          headerRows: 1,
          keepWithHeaderRows: 1,
        },
      },
      // Vordruck: Platz für drei Zeilen Handschrift statt einer Zeile (R5-A7).
      ...(blanko
        ? [
            {
              unbreakable: true,
              stack: [
                { text: "Sonstiges:", fontSize: schrift, margin: [0, 8, 0, 3] },
                {
                  layout: tabLayout,
                  table: {
                    heights: () => hoch(ZEILE_PERSONAL),
                    widths: ["*"],
                    body: [[leerZelle()], [leerZelle()], [leerZelle()]],
                  },
                },
              ],
            } as Content,
          ]
        : b.sonstiges || staerkeVonHand(b)
          ? [
              {
                text: `Sonstiges: ${[b.sonstiges ? weichUmbrechen(b.sonstiges) : "", staerkeVonHand(b) ? staerkeVonHandSatz(b) : ""].filter(Boolean).join(" ")}`,
                fontSize: schrift,
                margin: [0, 8, 0, 0],
              } as Content,
            ]
          : []),
      ...(zusatz?.messpunkt
        ? [
            {
              text: " ",
              fontSize: 1,
              id: `${MESS_BOGEN_ENDE}-formular${zusatz.messKennung ?? ""}`,
            } as Content,
          ]
        : []),

      // ---- QR-Block ----
      // Kein fester Seitenumbruch mehr; als unbreakable-Gruppe zusammengehalten,
      // damit der QR-Code nicht über eine Seitengrenze zerrissen wird. Passt der
      // Block nicht mehr, rückt er als Ganzes auf die nächste Seite.
      ...(qr
        ? [
            qrBlock(
              qr,
              farbe.akzent,
              zeitgruppe(b.stand),
              vermerk,
              codeKopfzeile(b, zeitgruppe(b.stand), vermerk?.nummer),
              codeGueltigBisText(
                b,
                (z) => zeitpunktDeutsch(z).split(",")[0] ?? "",
                bogenAnonymisiert(b),
              ),
            ),
          ]
        : []),
      ...(zusatz?.messpunkt
        ? [
            {
              text: " ",
              fontSize: 1,
              id: `${MESS_BOGEN_ENDE}-qr${zusatz.messKennung ?? ""}`,
            } as Content,
          ]
        : []),
    ],
  });
}

/**
 * Einzel-PDF mit Platz für Stiftnachträge — aber nur, wo er keine Seite
 * kostet (Audit Runde 3, R3-A6). Zwei freie Personalzeilen hätten 15 von 133
 * Beispielbögen um eine Seite verlängert, darunter den einseitigen Bogen des
 * Zugtrupps Albstadt. Deshalb ein Probesatz: Er liest über pdfmakes
 * `pageBreakBefore` ab, wie viel Platz hinter dem Formular (mehrteiliger Code
 * auf eigenen Seiten) bzw. hinter dem Code auf derselben Seite bleibt. Passen
 * zwei Zeilen hinein, kommen sie dazu; passt danach noch ein Fahrzeugblock,
 * auch der.
 *
 * `setzen` führt den Satz aus (Browser: pdfmake-Puffer, Tests: Node).
 */
export async function einzelPdfDokument(
  b: Erfassungsbogen,
  qr: QrSatz | null,
  setzen: (dd: TDocumentDefinitions) => Promise<unknown>,
): Promise<TDocumentDefinitions> {
  if (b.personalErfassung === PersonalErfassung.NUR_STAERKE)
    return pdfDokument(b, qr);
  const pos = new Map<string, MessPosition>();
  const probe = pdfDokument(b, qr, undefined, undefined, { messpunkt: true });
  probe.pageBreakBefore = (knoten) => {
    const k = knoten as { id?: string; startPosition?: MessPosition };
    if (k.id && k.startPosition) pos.set(k.id, k.startPosition);
    return false;
  };
  await setzen(probe);
  const formular = pos.get(`${MESS_BOGEN_ENDE}-formular`);
  const ende = pos.get(`${MESS_BOGEN_ENDE}-qr`);
  if (!formular || !ende) return pdfDokument(b, qr);
  const rest = (p: MessPosition) => p.pageInnerHeight * (1 - p.verticalRatio);
  // Einzelcode auf derselben Seite wie das Formularende: der Platz unter dem
  // Code zählt. Sonst (Code auf eigener Seite, mehrteiliger Code) der Platz
  // unter dem Formular — was dort nicht hineinpasst, schöbe den Code weiter.
  const einzelcodeDahinter =
    qr != null &&
    qr.teile.length === 1 &&
    formular.pageNumber === ende.pageNumber;
  const frei = (einzelcodeDahinter ? rest(ende) : rest(formular)) - 4;
  const zeilen =
    frei >= PERSONAL_NACHTRAG_ZEILEN * LEERZEILE_HOEHE
      ? PERSONAL_NACHTRAG_ZEILEN
      : 0;
  const fahrzeug =
    zeilen > 0 && frei >= zeilen * LEERZEILE_HOEHE + LEERFAHRZEUG_HOEHE;
  return pdfDokument(b, qr, undefined, undefined, {
    freiePersonalZeilen: zeilen,
    freiesFahrzeug: fahrzeug,
  });
}


/**
 * „Sitzplätze: 3“ (am Fahrzeug erfasst) oder „Sitzplätze: 3 (Richtwert)“ (aus
 * dem Fahrzeugtyp); leer, wenn beides fehlt. Anhänger mit Richtwert 0 bleiben
 * leer — „0 Sitzplätze“ an jedem Anhänger wäre nur Rauschen.
 */
export function sitzplatzZeile(f: Fahrzeug, org: OrganisationsTyp): string {
  if (f.sitzplaetze != null) return `Sitzplätze: ${f.sitzplaetze}`;
  const richtwert = sitzplaetzeRichtwert(f, vokabularFuer(org, "fahrzeug"));
  return richtwert ? `Sitzplätze: ${richtwert} (Richtwert)` : "";
}


/**
 * Sofortbedarf eines ausgefüllten Bogens: nur, was angefordert ist. Mit allen
 * Kästchen und Nullen („Verpflegung für 0 Personen, davon 0 vegetarisch …“)
 * sah ein Bogen mit Bedarf „Unterbringung“ aus wie eine lange Bestellliste;
 * ohne Sofortbedarf erscheint der Block gar nicht (Rückmeldung OV Chemnitz,
 * 11/2026). Der Vordruck behält alle Zeilen zum Ausfüllen.
 */
export function sofortbedarfZellen(
  sb: NonNullable<Erfassungsbogen["sofortbedarf"]>,
  vp: { vegetarisch: number; vegan: number },
  mwd: { m: number; w: number; d: number },
): TableCell[] {
  const links: Content[] = [{ text: "Sofortbedarf:", bold: true, decoration: "underline" }];
  if (sb.verpflegungPersonen > 0) {
    const davon = [
      vp.vegetarisch > 0 ? `${vp.vegetarisch} vegetarisch` : "",
      vp.vegan > 0 ? `${vp.vegan} vegan` : "",
    ].filter(Boolean);
    links.push({
      text: `${kasten(true)} Verpflegung für ${sb.verpflegungPersonen} Personen${davon.length ? `, davon ${davon.join(", ")}` : ""}`,
    });
  }
  const stoff = betriebsstoffText(sb);
  if (stoff) links.push({ text: `${kasten(true)} Betriebsstoff: ${stoff}` });
  const rechts: Content[] = [];
  if (sb.unterbringung) {
    rechts.push({ text: `${kasten(true)}  Unterbringung` });
    rechts.push({ text: `Anzahl Unterbringung/WC/Dusche:\nM ${mwd.m} / W ${mwd.w} / D ${mwd.d}` });
  }
  if (sb.ruhezeitErforderlich) rechts.push({ text: `${kasten(true)}  Ruhezeit erforderlich` });
  if (links.length === 1 && rechts.length === 0) links.push({ text: "kein Bedarf angegeben", italics: true });
  return [{ stack: links }, { stack: rechts.length ? rechts : [{ text: " " }] }];
}
