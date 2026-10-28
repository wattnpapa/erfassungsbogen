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

import type { Attachment, Content, TDocumentDefinitions, TableCell } from "pdfmake/interfaces";
import {
  Erfassungsbogen,
  Fahrzeug,
  KontaktArt,
  ansprechpartner,
  OrganisationsTyp,
  PersonalErfassung,
  StaerkeRolle,
  datumZuIso,
  mitTransportVersion,
  staerke,
  unterbringungMWD,
  verpflegung,
} from "@bos/eeb-format/model";
import {
  datumDeutsch,
  einheitAnzeigename,
  funkrufText,
  funktionsText,
  kennzeichenText,
  nurSollstaerke,
  orgLabel,
  vokabText,
  vokabularFuer,
  zeitgruppe,
  pruefpunkte,
  bogenAnonymisiert,
  datumAnzeige,
  type QrSatz,
  zeitpunktDeutsch,
} from "./hilfen";
import { bedarfNichtErfasst, mwdText, summiereBoegen, unterbringungAngefordertText, verpflegungText, type EinsatzSummen } from "./auswertung";
import { EINTREFF_HINWEIS, zeitLang } from "./eintrag-zeiten";
import { angabenAlterWort, angabenZeit, handAenderungText, type AngabenSeit } from "./angaben-alter";
import { bedarfOhneAngabeText, kraftstoffTeile, lageblattAlterText, lageblattZeilenAlter, staerkeSpalteKompakt, staerkeSummenText, zugAlterText } from "./lagemonitor";
import { ANONYM_BEMERKUNG_VERMERK, ANONYM_PAPIER_VERMERK, ANONYM_PERSONAL_SATZ, codeGueltigBisText } from "./anonym-hinweis";
import { anfuehrung } from "./typografie";
import { bedarfMarken, datumVonMs, einheitenZahl, lueckenAlle, rueckkehrText } from "./einheiten-tabelle";
import { FELD_GESAMTSTAERKE, diffZeilen } from "@bos/meldekopf/meldung-diff";
import { bogenDiff, type BogenDiff } from "./diff-lage";
import { fahrzeugSymbolSvg } from "./taktische-zeichen-bogen";
import { orgFarbe } from "./org-farben";
import { BERUF_PRAEFIX, berufText, qualifikationenUndBerufe } from "./beruf";
import { UEBUNG_BREITE, UEBUNG_HOEHE, UEBUNG_PFAD } from "./uebung-wasserzeichen";

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
      0.96 * Math.min(breite / (cos + verhaeltnis * sin), hoehe / (sin + verhaeltnis * cos));
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
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${rund(breite)}" height="${rund(hoehe)}" viewBox="0 0 ${rund(breite)} ${rund(hoehe)}"><g transform="${lage}" fill="${UEBUNG_FARBE}" fill-opacity="0.08"><path d="${UEBUNG_PFAD}"/></g></svg>`,
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

/**
 * Seitenränder [links, oben, rechts, unten] in pt, umgerechnet aus den
 * pgMar-Twips der Vorlage (1 pt = 20 Twips): links 1418→70,9 · oben 567→28,3 ·
 * rechts 1134→56,7. Der charakteristische breite linke / schmale rechte Rand
 * lässt die PDF wie das Original wirken. Unten bewusst etwas größer als die
 * 284 Twips der Vorlage (≈14 pt), damit die App-Fußzeile („Stand … / Seite")
 * Platz behält.
 */
const SEITENRAENDER: [number, number, number, number] = [71, 28, 57, 32];

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
  return (c >= 0x20 && c <= 0x7e) || (c >= 0xa0 && c <= 0xff) || z === "\n" || z === "\u200B" || WINANSI_SONDER.has(z);
};
/** Häufige Zeichen aus Freitext mit sinnvoller Schreibweise in WinAnsi. */
const WINANSI_ERSATZ: Record<string, string> = {
  "→": "->", "⇒": "=>", "←": "<-", "↔": "<->", "≠": "!=", "≥": ">=", "≤": "<=", "≈": "ca.", "−": "-", "‐": "-", "‑": "-", "‒": "-",
  "✓": "x", "✔": "x", "✗": "x", "✘": "x", "☎": "Tel.", "⚠": "!", "ł": "l", "Ł": "L", "đ": "d", "Đ": "D", "ı": "i",
  // Weitere lateinische Buchstaben ohne Platz in WinAnsi und ohne Akzent-Zerlegung (R10-W1); ß, ø, æ, þ, ð kennt WinAnsi selbst.
  "ẞ": "SS", "ŧ": "t", "Ŧ": "T", "ħ": "h", "Ħ": "H", "ŀ": "l", "Ŀ": "L", "ĸ": "k", "ŋ": "ng", "Ŋ": "Ng", "ĳ": "ij", "Ĳ": "IJ",
  "ſ": "s", "ə": "e", "Ə": "E", "ǝ": "e", "ʼ": "'", "ʻ": "'", "ˈ": "'", "ǃ": "!",
  "\u202F": " ", "\u2009": " ", "\u2002": " ", "\u2003": " ", "\uFEFF": "", "\u00AD": "",
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
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "jo", ж: "zh", з: "z", и: "i", й: "j", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p",
  р: "r", с: "s", т: "t", у: "u", ф: "f", х: "ch", ц: "z", ч: "tsch", ш: "sch", щ: "schtsch", ъ: "", ы: "y", ь: "", э: "e", ю: "ju", я: "ja",
  і: "i", ї: "ji", є: "je", ґ: "g", ў: "u", ј: "j", љ: "lj", њ: "nj", ћ: "c", ђ: "dj", џ: "dz",
  α: "a", β: "v", γ: "g", δ: "d", ε: "e", ζ: "z", η: "i", θ: "th", ι: "i", κ: "k", λ: "l", μ: "m", ν: "n", ξ: "x", ο: "o", π: "p",
  ρ: "r", σ: "s", ς: "s", τ: "t", υ: "y", φ: "f", χ: "ch", ψ: "ps", ω: "o", ά: "a", έ: "e", ή: "i", ί: "i", ό: "o", ύ: "y", ώ: "o", ϊ: "i", ϋ: "y",
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
  if (!weg(name)) return zeichenVereinfacht(name) ? `${name} (vereinfacht)` : name;
  const u = umschrift(name);
  if (!weg(u)) return `${u} (Umschrift)`;
  return `${winAnsiText(u)} (Name nicht darstellbar – siehe digitale Meldung)`;
}

/** Enthält der Text Zeichen, die die PDF-Schrift nicht kennt und die als „?" gedruckt würden? */
const papierWeg = (t: string): boolean => winAnsiText(t).includes("?") && !t.includes("?");

/**
 * Enthält der Text Buchstaben, die die PDF-Schrift nicht kennt und die still durch einen ähnlichen ersetzt
 * werden („Łukasz" → „Lukasz", „Dvořák" → „Dvorak")? Dann steht der Name auf Papier anders als im QR-Code,
 * und das gehört dazu und in die Quittung (R10-W1). Nur Buchstaben: Leerraum und Bindestriche zählen nicht.
 */
export const zeichenVereinfacht = (t: string): boolean =>
  !papierWeg(t) && [...t].some((z) => !winAnsiKennt(z) && /[\p{L}\p{M}]/u.test(z));

/**
 * Ein Personenname für die Listen auf dem Bogen: darstellbar unverändert; kyrillisch/griechisch in
 * Umschrift mit dem Vermerk dazu — dieselbe Schreibweise wie im Feld „Ansprechpartner/in", damit der
 * Mensch an beiden Stellen gleich lesbar ist (R9-W3). Was auch so nicht druckbar ist, bleibt, wie es ist
 * (die PDF druckt dann „?", die Quittung nennt es).
 */
export function namePapier(nachname: string, vorname: string, trenner = ", "): string {
  const roh = `${nachname}${nachname && vorname ? trenner : ""}${vorname}`;
  if (!papierWeg(roh)) return zeichenVereinfacht(roh) ? `${roh} (vereinfacht)` : roh;
  const u = umschrift(roh);
  return papierWeg(u) ? roh : `${u} (Umschrift)`;
}

/**
 * Wie viele Namen im Bogen Zeichen enthalten, die die PDF-Schrift nicht darstellen kann
 * (arabisch, Emoji …) und die als „?" gedruckt würden (Audit Runde 6, R6-A5). Eine Person zählt einmal
 * (Vor- und Nachname zusammen), und was in Umschrift gedruckt wird, zählt nicht mit (R9-W3).
 */
export function nichtDarstellbareNamen(b: Erfassungsbogen): number {
  const personen = b.personal.filter((p) => papierWeg(`${p.vorname} ${p.nachname}`) && papierWeg(umschrift(`${p.vorname} ${p.nachname}`))).length;
  const sonst = [b.einheit.organisationName ?? "", ...b.einheit.hierarchie.map((h) => h.name)].filter((n) => n && papierWeg(n)).length;
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
      wer.push(`${[p.vorname, p.nachname].filter(Boolean).join(" ")}${i === 0 ? " (Ansprechperson)" : ""}`);
    }
  });
  if (papierWeg(b.einheit.organisationName ?? "")) wer.push(`Organisationsname „${b.einheit.organisationName}"`);
  for (const h of b.einheit.hierarchie) if (papierWeg(h.name)) wer.push(`Zugehörigkeit „${h.name}"`);
  return wer;
}

/** Personen, deren Name in Umschrift gedruckt wird (Feld „Ansprechpartner/in" und Personenliste) — für die Quittung (R9-W3). */
export function umschriftBetroffene(b: Erfassungsbogen): string[] {
  const wer: string[] = [];
  b.personal.forEach((p, i) => {
    const name = `${p.vorname} ${p.nachname}`;
    if (papierWeg(name) && !papierWeg(umschrift(name))) {
      wer.push(`${[p.vorname, p.nachname].filter(Boolean).join(" ")} → ${umschrift(name).trim()}${i === 0 ? " (Ansprechperson)" : ""}`);
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
      wer.push(`${voll} → ${winAnsiText(voll)}${i === 0 ? " (Ansprechperson)" : ""}`);
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
      if (name === "files" || name === "image" || name === "svg" || name === "link") continue;
      const wert = o[name];
      if (name === "text" && typeof wert === "string") o[name] = winAnsiText(wert);
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
      dd[feld] = ((...a: Parameters<typeof f>) => winAnsiKnoten(f(...a))) as typeof f;
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
export function bogenAlsEingebetteteDatei(b: Erfassungsbogen): EingebetteteDatei {
  const json = JSON.stringify(mitTransportVersion(b), null, 2);
  const base64 = base64AusBytes(new TextEncoder().encode(json));
  return {
    src: `data:application/json;base64,${base64}`,
    name: EEB_JSON_DATEINAME,
    description: "Strukturierte Daten des Einheitenerfassungsbogens (maschinenlesbar)",
    // Alternative = maschinenlesbares Gegenstück zur sichtbaren Darstellung (wie ZUGFeRD).
    relationship: "Alternative",
  };
}

/** Dateiname der eingebetteten Sammel-Daten (mehrere Bögen eines Einsatzes). */
export const EEB_EINSATZ_DATEINAME = "einsatz.json";

/**
 * Dateiname der eingebetteten VOLLSTÄNDIGEN Einsatz-Sammlung (Umschlag
 * „eeb-einsatz" mit Zug-Zuordnungen, Anwesenheits-Status und Historie) —
 * macht die Sammel-PDF zur kompletten Schichtübergabe in einer Datei.
 */
export const EEB_EINSATZ_SAMMLUNG_DATEINAME = "einsatz-sammlung.json";

/** Vorserialisierte Einsatz-Sammlung (einsatzDateiInhalt) als eingebettete Datei. */
export function sammlungAlsEingebetteteDatei(json: string): EingebetteteDatei {
  const base64 = base64AusBytes(new TextEncoder().encode(json));
  return {
    src: `data:application/json;base64,${base64}`,
    name: EEB_EINSATZ_SAMMLUNG_DATEINAME,
    description: "Vollständige Einsatz-Sammlung inkl. Zug-Zuordnung, Status und Historie (maschinenlesbar)",
    relationship: "Alternative",
  };
}

/** Mehrere Bögen als ein eingebettetes JSON-Array (für die Einsatz-Sammel-PDF). */
export function boegenAlsEingebetteteDatei(boegen: Erfassungsbogen[]): EingebetteteDatei {
  const json = JSON.stringify(boegen.map(mitTransportVersion), null, 2);
  const base64 = base64AusBytes(new TextEncoder().encode(json));
  return {
    src: `data:application/json;base64,${base64}`,
    name: EEB_EINSATZ_DATEINAME,
    description: "Strukturierte Daten aller Bögen des Einsatzes (maschinenlesbar)",
    relationship: "Alternative",
  };
}

/**
 * Was die Übergabe-Übersicht je Einheit braucht — bewusst ohne QR-Satz, damit
 * das einseitige Lageblatt keinen Code rechnen muss (auf dem Telefon Sekunden
 * je Bogen; für ein Blatt an der Wand ist das der Unterschied zwischen
 * „drucke ich stündlich" und „drucke ich nie", Analog-Audit A3/A4).
 */
/** Zeile im Lageblatt und in der Sammel-PDF zu einem Bogen mit ungültiger Signatur: Der Stab liest sie, nicht die Karte (R15-E1). */
export const SIGNATUR_UNGUELTIG_PAPIER = "⚠ SIGNATUR UNGÜLTIG: Daten unterwegs verändert oder beschädigt — beim Absender prüfen";

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
 * Nach Nr. geordnet, wie am Gerät und im Funk (R5-A9): „Nr. 17“ steht auf dem
 * Wandblatt zwischen 16 und 18, nicht an der Stelle des Namens im Alphabet.
 * Stabil; Einträge ohne Nr. folgen in ihrer Reihenfolge.
 */
export function nachNummer<T extends { nummer?: number }>(eintraege: readonly T[]): T[] {
  return eintraege
    .map((e, i) => ({ e, i }))
    .sort((a, b) => (a.e.nummer ?? Infinity) - (b.e.nummer ?? Infinity) || a.i - b.i)
    .map(({ e }) => e);
}

/** Zählt der Eintrag in die Summen? Abgerückte nie, Übungen nur in Übungssammlungen (zaehlt=false). */
function zaehlend(e: UebersichtEintrag): boolean {
  // Eine Einheit des Nachtrags, die schon in der letzten Lieferung stand, ersetzt
  // ihre frühere Zeile und wird nicht noch einmal summiert (R5-W7).
  return !e.abgerueckt && e.zaehlt !== false && e.nachtragNeu !== false;
}

/** Nur die Bögen, die in Summen und Bedarf gehören. */
function zaehlendeBoegen(eintraege: UebersichtEintrag[]): Erfassungsbogen[] {
  return eintraege.filter(zaehlend).map((e) => e.bogen);
}

/** Ab so vielen Einheiten steht der Bedarf der Sammel-PDF vor der Tabelle (R5-A8). */
const BEDARF_VORN_AB = 12;

/** Mehr Zeilen passen nicht sinnvoll in eine Tabellenzelle — der Rest wird gezählt. */
const UEBERSICHT_MAX_ZEILEN = 8;
/**
 * Auf dem Lageblatt weniger: es muss bei rund zehn Einheiten auf eine Seite
 * passen, die Einzelheiten stehen in der Sammel-PDF (Audit Runde 2, R2-K3).
 */
const LAGEBLATT_MAX_ZEILEN = 2;

/**
 * Änderungszeile fürs Papier: „Diesel: von 50 l auf 200 l" statt
 * „Diesel: 50 l → 200 l". Die PDF-Standardschrift Helvetica (WinAnsi) kennt
 * den Pfeil nicht; im Ausdruck stand „50 l !200 l" und las sich als Ausruf
 * (Audit Runde 2, R2-K3).
 */
export function aenderungFuerPapier(zeile: string): string {
  const m = /^([^:]+): (.*) → (.*)$/.exec(zeile);
  if (m) return `${m[1]}: von ${m[2]} auf ${m[3]}`;
  return zeile.replace(/→/g, "->");
}

/** Zeitpunkt auf dem Blatt — immer mit Datum: gelesen wird es auch morgen noch. */
function alterMarke(e: { empfangenAm?: number; bogen: Erfassungsbogen; angaben?: AngabenSeit }, erstellt: number): Content[] {
  if (e.empfangenAm == null) return [];
  // Alter der Angaben (Stand), nicht des Eintreffens; „Stand vor …", wenn der Bogen schon vor dem Eingang alt war (R14-K1).
  // Nach einer Handänderung am Meldekopf gilt das Alter der Meldung davor (R17-K1).
  const m = { empfangenAm: e.empfangenAm, bogen: e.bogen, angaben: e.angaben };
  const t = lageblattZeilenAlter(angabenZeit(m), erstellt, angabenAlterWort(m));
  return t ? [{ text: t, bold: true, fontSize: 7 }] : [];
}

/**
 * Spalte „Stand der Angaben": der Stand, auf den sich die Angaben der Einheit beziehen — beim Absender, nicht die Zeit
 * der Aufnahme. Eine Handänderung am Meldekopf steht darunter getrennt (R18-A2, R18-K1), damit eine frische Uhrzeit
 * neben „Stand vor 2 Std" nicht widerspricht.
 */
function standZelle(e: Pick<UebersichtEintrag, "bogen" | "standAbsender" | "angaben">): Content {
  const stand = { text: zeitpunktDeutsch(e.standAbsender ?? e.bogen.stand) };
  if (!e.angaben) return stand;
  return { stack: [stand, { text: handAenderungText(e), italics: true, fontSize: 7 }] };
}

function blattZeit(ms: number | undefined): string {
  return ms == null ? "" : zeitLang(ms);
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
  return { ...b, fahrzeuge: b.fahrzeuge.map((f) => ({ ...f, stanKonform: undefined, funkrufname: undefined })) };
}

/**
 * Wie erreiche ich die Einheit ohne Gerät? Funkrufname des ersten Fahrzeugs
 * mit Funkrufnamen und die Rückrufnummer der Führungskraft (sonst die des
 * Ortsverbands) — auf dem Einzelbogen stehen sie, auf dem Lageblatt fehlten
 * sie (Audit Runde 2, R2-A3).
 */
export function erreichbarkeitZeilen(b: Erfassungsbogen, absender?: string): string[] {
  const zeilen: string[] = [];
  // Niemand hat gezählt (Sollstärke): Funkrufname und Rufnummer stammen aus der Vorbelegung des Einheitstyps,
  // nicht von der Einheit — am Wandblatt sähen sie wie ein bestätigter Rückruf aus (R9-A3).
  const soll = nurSollstaerke(b);
  b = ohneVorbelegung(b);
  const fzg = b.fahrzeuge.find((f) => f.funkrufname);
  const furn = fzg ? funkrufText(fzg, b.einheit) : "";
  // Trägt die Fahrzeugzeile noch keine eigene Angabe (Kennzeichen, Sitzplätze, Sondergerät), stammt der
  // Funkrufname aus der Vorbelegung des Einheitstyps, auch bei vollständig gemeldetem Bogen (R11-W4).
  const unberuehrt = fzg != null && !fzg.kennzeichen?.trim() && fzg.sitzplaetze == null && !fzg.aenderungen?.trim();
  if (furn) zeilen.push(soll || unberuehrt ? `${furn} (Vorbelegung)` : furn);
  // Rückruf der Einheit selbst: Name und Nummer, die der Absender hinterlegt hat (R11-W2).
  if (absender) zeilen.push(`Absender: ${absender}`);
  // Knapp, damit die Zeile in die Spalte passt: „5556968346 (S. Lang)".
  const p = ansprechpartner(b.personal);
  // Dienstliche Nummer vor privater; die Art steht hinter der Nummer wie auf dem Bogen (R14-A3).
  const nummern = p?.kontakte.filter((k) => k.art !== KontaktArt.EMAIL && k.wert) ?? [];
  const tel = nummern.find((k) => k.dienstlich) ?? nummern[0];
  if (p && tel) {
    const name = [p.vorname ? `${p.vorname.charAt(0)}.` : "", p.nachname].filter(Boolean).join(" ");
    const art = tel.dienstlich ? "(D)" : "(P)";
    zeilen.push(name ? `${tel.wert} ${art} ${name}` : `${tel.wert} ${art}`);
  } else if (b.einheit.hierarchie[0]?.telefon) {
    zeilen.push(`${b.einheit.hierarchie[0].telefon} (${soll ? "OV, Vorbelegung" : "OV"})`);
  }
  return zeilen;
}

/**
 * Leere Zeilen unter den Einheiten des Lageblatts — zum Weiterschreiben bei
 * Geräteausfall (R2-A3). Bei zehn Einheiten waren es zwei, darunter ein
 * Fünftel der Seite leer, und nach dem zweiten Nachtrag ging es auf einem
 * Zettel weiter (Audit Runde 3, R3-A5). Ohne Messung fünf; gemessen füllt
 * {@link einsatzLageblattSeiteFuellen} die letzte Seite bis unten.
 */
export const NACHTRAG_ZEILEN_MIN = 5;

/**
 * Zeilenzahl des Probesatzes. Früher die Untergrenze („mindestens zwei —
 * ein Lageblatt, das wegen leerer Zeilen eine zweite Seite anfängt, hängt
 * niemand aus", R2-K3); seit R4-A3 geht es bei zu vollem Blatt auf die
 * Rückseite, und Seite 1 bleibt das Blatt für die Wand.
 */
const NACHTRAG_ZEILEN_PROBE = 3;

/** Kennungen der Messpunkte für {@link einsatzLageblattSeiteFuellen}. */
const MESS_ENDE = "lageblatt-ende";
const MESS_NACHTRAG = "lageblatt-nachtrag-";

/** Zelle „übertragen“ einer Nachtragszeile: Kästchen und Platz für das Kürzel. */
const NACHTRAG_UEBERTRAGEN = "[  ] ______";

/** Ausfülllinie für Zahlen auf dem leeren Lageblatt — statt vorgedruckter Nullen (R3-A5). */
const LEERFELD = "____";

/**
 * Gesamtstärke an den Anfang der Änderungen: Auf dem Lageblatt (zwei Zeilen
 * je Einheit) stand sonst „Mannschaft: von 9 auf 6 … und 5 weitere
 * Änderungen", die Gesamtstärke 12 → 9 erst in der Sammel-PDF (Audit
 * Runde 3, R3-K6).
 */
function gesamtZuerst(d: BogenDiff): BogenDiff {
  const gesamt = d.staerke.filter((a) => a.feld === FELD_GESAMTSTAERKE);
  return gesamt.length === 0 ? d : { ...d, staerke: [...gesamt, ...d.staerke.filter((a) => a.feld !== FELD_GESAMTSTAERKE)] };
}

/**
 * Änderungen für die zwei Zeilen des Lageblatts, nach Bedarfsrelevanz geordnet
 * (R5-K7): Gesamtstärke; dann alles, was den Bedarf bewegt (Unterbringung,
 * Ruhezeit, Verpflegung, Kraftstoff) und der Auftrag der Einheit; der Rest
 * (Personal, Fahrzeuge, Bemerkung) nur als Stichwort mit Zahl. Vorher stand
 * hinter der Stärke „… und 4 weitere Änderungen" — dahinter die Unterbringung.
 */
export function lageblattAenderungen(d: BogenDiff): string[] {
  const wert = (a: { feld: string; vorher: string; nachher: string }) => `${a.feld}: ${a.vorher} → ${a.nachher}`;
  const zeilen: string[] = [];
  const gesamt = d.staerke.find((a) => a.feld === FELD_GESAMTSTAERKE);
  if (gesamt) zeilen.push(wert(gesamt));
  const papier = (a: { feld: string; vorher: string; nachher: string }) => `${a.feld} von ${a.vorher} auf ${a.nachher}`;
  const bedarf = [...d.bedarf.map(papier), ...d.sonstiges.filter((a) => a.feld === "Ort / Auftrag").map(papier)];
  if (bedarf.length > 0) zeilen.push(`Bedarf/Auftrag: ${bedarf.join("; ")}`);
  const rest: string[] = [];
  const andereStaerke = d.staerke.filter((a) => a !== gesamt).length;
  if (andereStaerke > 0) rest.push("Stärke nach Funktion");
  const personal = d.personalZugang.length + d.personalAbgang.length + d.personalGeaendert.length;
  if (personal > 0) rest.push(`Personal (${personal})`);
  const fahrzeuge = d.fahrzeugeZugang.length + d.fahrzeugeAbgang.length + d.fahrzeugeGeaendert.length;
  if (fahrzeuge > 0) rest.push(`Fahrzeuge (${fahrzeuge})`);
  if (d.sonstiges.some((a) => a.feld !== "Ort / Auftrag")) rest.push("Bemerkung/Sonstiges");
  if (rest.length > 0) zeilen.push(`weitere: ${rest.join(", ")}`);
  return zeilen;
}

/**
 * Bedarf je Einheit: Dringendes (Ruhezeit, Unterbringung, abweichende
 * Verpflegung) fett, Kraftstoff normal — am Gerät gelb gegen grau, auf dem
 * Papier war alles gleich fett (Audit Runde 3, R3-K6).
 */
function bedarfZelle(b: Erfassungsbogen): TableCell {
  const marken = bedarfMarken(b);
  // Schnellerfassung: leer hieße „nichts nötig" — das Blatt sagt, dass niemand gefragt hat (R14-W1).
  if (marken.length === 0) return bedarfNichtErfasst(b) ? { text: "Bedarf nicht erfasst", italics: true, bold: true } : { text: "" };
  return {
    text: marken.flatMap((m, i) => [
      ...(i > 0 ? [{ text: " · " }] : []),
      m.dringend ? { text: m.kurz, bold: true } : { text: m.kurz },
    ]),
  };
}

/** Marke hinter einer Eintreffzeit, die nur die Zeit des Einlesens ist (R14-A1); die Fußnote erklärt sie. */
export const EINGELESEN_STERN = " *";
export const EINGELESEN_FUSSNOTE = `* ${EINTREFF_HINWEIS}`;

/**
 * Zeile über die Lücke in den Nummern („Nr. 2 entfernt 04:21 — nicht in der Summe", R19-A2). Die Ausgabe setzt sie vor dem
 * Bauen des Dokuments (pdf.ts) und leert sie danach; ohne Entfernen bleibt sie leer und ändert nichts am Blatt.
 */
let lueckenZeile = "";
export function lueckenZeileSetzen(text: string): void {
  lueckenZeile = text;
}

/** So viele Zeichen der Bemerkung stehen auf dem Lageblatt, der Rest in der Sammel-PDF. */
const BEMERKUNG_LAGEBLATT = 70;

/**
 * Bemerkung der Einheit für das Blatt, in Klammern (R17-W4): gekürzt an einer Wortgrenze — nie mitten in „StAN“ —, und das
 * Blatt sagt, wo der Rest steht (R5-A9). Eigene Klammern der Bemerkung werden eckig, damit keine Klammer in der Klammer steht.
 */
export function bemerkungKurz(bemerkung: string, kuerzen?: number): string {
  let b = bemerkung.trim();
  if (!b) return "";
  const umschlossen = b.startsWith("(") && b.endsWith(")") && !b.slice(1, -1).includes(")(");
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
      for (const m of teil.matchAll(muster)) letzte = m.index! + (m[0].length > 1 && /[—–;]/.test(m[0]) ? 0 : m[0].length);
      if (letzte >= kuerzen / 4) {
        teil = teil.slice(0, letzte);
        geschnitten = true;
        break;
      }
    }
    if (!geschnitten && !/\s/.test(b.charAt(kuerzen)) && /\s/.test(teil)) teil = teil.replace(/\s+\S*$/, "");
    // Ein Rest „… nicht“, „… ohne“ oder „… und“ ohne sein Ziel sagt das Gegenteil oder nichts: solche Endwörter fallen weg.
    teil = teil.replace(/(?:\s+(?:nicht|kein|keine|keinen|keiner|ohne|und|oder|mit|über|in|an|zu|von|bei|für|auf|als|dem|der|die|den))+$/i, "");
    return `(${teil.replace(/[\s,;:([—–-]+$/, "")} … Rest: Sammel-PDF)`;
  }
  return `(${b})`;
}

/** Zelle „Auftrag / Notiz (Bemerkung der Einheit)": Auftrag oben, Bemerkung kursiv darunter (R3-K3). */
function bemerkungZelle(notiz: string | undefined, sonstiges: string | undefined, kuerzen?: number, anonym = false): TableCell {
  const teile: Content[] = [];
  if (notiz?.trim()) teile.push({ text: weichUmbrechen(notiz.trim()) });
  // Anonymisiert: Die Bemerkung der Einheit ist mit der Frist entfallen; das Blatt sagt es (R13-A2).
  if (anonym) teile.push({ text: ANONYM_BEMERKUNG_VERMERK, italics: true, fontSize: 7 });
  const b = bemerkungKurz(sonstiges?.trim() ?? "", kuerzen);
  if (b) teile.push({ text: weichUmbrechen(b), italics: true });
  if (teile.length === 0) return { text: "" };
  return teile.length === 1 ? (teile[0] as TableCell) : { stack: teile };
}

function uebersichtsTabelle(
  eintraege: UebersichtEintrag[],
  maxZeilen = UEBERSICHT_MAX_ZEILEN,
  /** Lageblatt: Erreichbarkeit je Einheit (R2-A3); die Nachtragszeilen stehen in {@link nachtragsTabelle}. */
  zumWeiterfuehren = false,
  /** Nachtrag (R4-W4): „seit 05.10.2026, 20:49" — die Summen heißen dann „Summe Nachtrag". */
  nachtrag?: string,
  /** Druckzeitpunkt (ms): Zeilen mit Meldungen über einer Stunde Alter bekommen die Marke (R13-K2). */
  erstellt?: number,
): Content {
  const kopf = (text: string): TableCell => ({ text, bold: true, fillColor: GRAU });
  // Zug und Bedarf je Einheit, wie in der App-Tabelle — „Ruhezeit bei 5
  // Einheiten" ohne Namen musste die Ablösung per Funk klären (R2-K3).
  const SPALTEN = zumWeiterfuehren ? 10 : 9;
  const body: TableCell[][] = [
    [
      kopf("Einheit"),
      kopf("Zug"),
      ...(zumWeiterfuehren ? [kopf("Funkrufname /\nRückruf")] : []),
      // Eine Spalte für beide Zeiten: die Abrückzeit gibt es nur im Block
      // „Abgerückt", die leere Spalte daneben kostete die Änderungsspalte
      // ihre Breite und das Blatt seine Seite (R2-K3).
      kopf("Eingetroffen\n(abgerückt)"),
      kopf("Stand der\nAngaben"),
      kopf("Stärke\nF / U / M / G"),
      kopf("Fzg"),
      kopf("Bedarf"),
      // Die Bemerkung der Einheit („Sonstiges") unter dem Auftrag — eine
      // Nachschubanforderung im Freitext stand auf dem Blatt nur, solange sie
      // als Änderung galt (Audit Runde 3, R3-K3). Gleiche Spalte, damit das
      // Blatt nicht breiter wird.
      kopf("Auftrag / Notiz\n(Bemerkung der Einheit)"),
      kopf("Veränderung seit der letzten Meldung"),
    ],
  ];
  // Eine Schreibweise der Stärke in allen Zeilen und der Summe (R18-W5).
  const staerkeKompakt = (() => {
    const z = (x: ReturnType<typeof staerke>): [number, number, number, number] => [x.fuehrer, x.unterfuehrer, x.mannschaft, x.gesamt];
    const sm = summiereBoegen(zaehlendeBoegen(eintraege)).staerke;
    return staerkeSpalteKompakt([...eintraege.map((e) => z(staerke(e.bogen))), z(sm)]);
  })();
  const zeile = (e: UebersichtEintrag, blockKopf?: string): TableCell[] => {
    const { bogen: b, vorher, teil } = e;
    const s = staerke(b);
    let aenderung: Content;
    if (!vorher) {
      aenderung = { text: "Erstmeldung", italics: true };
    } else {
      const d = bogenDiff(vorher, b);
      aenderung =
        d.anzahl === 0
          ? { text: `unverändert gegenüber ${zeitpunktDeutsch(vorher.stand)}`, italics: true }
          : {
              stack: [
                { text: `gegenüber ${zeitpunktDeutsch(vorher.stand)}:`, bold: true },
                ...(maxZeilen === LAGEBLATT_MAX_ZEILEN ? lageblattAenderungen(d) : diffZeilen(gesamtZuerst(d), maxZeilen)).map((z) => ({ text: aenderungFuerPapier(z) })),
              ],
            };
    }
    // Eine durch Folgemeldung zurückgeholte Einheit steht als Erstes in der
    // Spalte — nicht als gewöhnliche Zeile (R5-K1).
    if (e.rueckkehr) {
      aenderung = { stack: [{ text: rueckkehrText(e.rueckkehr).toUpperCase(), bold: true }, aenderung] };
    }
    // Name, darunter bei Bedarf die Kennzeichnung eines abgeteilten Truppteils
    // und der Übungs-Störer — beides muss in der Übersicht stehen, sonst sind
    // zwei Zeilen derselben Einheit nicht auseinanderzuhalten.
    // Laufende Nummer vorn, wie an der Karte: „Meldung 3" über Funk statt
    // des vollen Einheitsnamens (Audit Runde 2, R2-A6).
    const namensZeilen: Content[] = [
      // Kopf des Blocks „Abgerückt (n)" in der ersten Zeile selbst: als eigene Tabellenzeile stand er am Seitenende
      // allein, die Einheit darunter erst auf der nächsten Seite (R14-K2). Zeilen brechen nicht (dontBreakRows).
      ...(blockKopf ? [{ text: blockKopf, bold: true, background: GRAU, margin: [0, 0, 0, 2] as [number, number, number, number] }] : []),
      e.nummer != null
        ? { text: [{ text: `Nr. ${e.nummer}  `, bold: true }, { text: einheitAnzeigename(b.einheit) }] }
        : { text: einheitAnzeigename(b.einheit) },
    ];
    if (teil) namensZeilen.push({ text: teil, italics: true });
    if (b.uebung) namensZeilen.push({ text: "ÜBUNG", bold: true, color: UEBUNG_FARBE });
    if (!e.abgerueckt && e.zaehlt === false) namensZeilen.push({ text: "zählt nicht in diese Lage", italics: true });
    // Niemand hat gezählt: Die Zahl ist die Sollstärke der Vorbelegung, nicht wie eine Meldung zu lesen (R8-A1).
    if (nurSollstaerke(b)) namensZeilen.push({ text: "Sollstärke, nicht gemeldet", bold: true });
    // Wie an der Karte: Der Bogen nennt einen anderen Einsatz, gezählt wird er trotzdem (R5-K5).
    if (e.fremderOrt) namensZeilen.push({ text: `Anderer Einsatz? Bogen nennt: „${e.fremderOrt}“`, bold: true });
    // Wie an der Karte: Daten und Signatur passen nicht zusammen — das Papier sagt es dem Stab (R15-E1).
    if (e.signaturUngueltig) namensZeilen.push({ text: SIGNATUR_UNGUELTIG_PAPIER, bold: true, fontSize: 7 });
    // Nachtrag: der Grund je Zeile (R5-W7).
    if (e.nachtragGrund) {
      namensZeilen.push({
        text: e.nachtragNeu === false ? `im Nachtrag wegen: ${e.nachtragGrund.join(", ")} — ersetzt die frühere Zeile` : "im Nachtrag: neu",
        italics: true,
        bold: true,
      });
    }
    // Anonymisiert: Das Papier sagt, warum Namen und Rufnummern fehlen und wo sie zu holen sind (R12-A1).
    if (bogenAnonymisiert(b)) namensZeilen.push({ text: ANONYM_PAPIER_VERMERK, bold: true, fontSize: 7 });
    // Lücken der Meldung als Zahl — am Gerät eine Marke an der Karte (R2-K3).
    // Mit Inhalt statt „1 Lücke" (R3-K7).
    // Auf dem Papier alle, nicht „… + 2 weitere" (R4-K3): Das Lageblatt nennt
    // jeden Punkt als Stichwort, die Sammel-PDF die ganzen Sätze. Der Zeitraum
    // zählt wie am Gerät mit (Bezug: Eintreffen, R4-W6).
    const luecken = pruefpunkte(b, true, e.eingetroffenAm != null ? datumVonMs(e.eingetroffenAm) : undefined);
    if (luecken.length > 0) {
      if (maxZeilen === LAGEBLATT_MAX_ZEILEN) {
        namensZeilen.push({ text: `Hinweise: ${lueckenAlle(luecken.map((p) => p.text))}`, italics: true });
      } else {
        namensZeilen.push({ text: luecken.length === 1 ? "Hinweis:" : `Hinweise (${luecken.length}):`, italics: true });
        for (const p of luecken) namensZeilen.push({ text: `– ${p.text}`, italics: true, fontSize: 7 });
      }
    }
    return [
      namensZeilen.length === 1 ? namensZeilen[0]! : { stack: namensZeilen },
      { text: weichUmbrechen(e.zugEtikett ?? "") },
      ...(zumWeiterfuehren ? [{ stack: erreichbarkeitZeilen(b, e.absender).map((text) => ({ text: weichUmbrechen(text) })) }] : []),
      {
        stack: [
          { text: `${blattZeit(e.eingetroffenAm)}${e.zeitEingelesen ? EINGELESEN_STERN : ""}` },
          ...(e.zeitUnbestaetigt ? [{ text: "Zeit nicht bestätigt (vom Papier)", italics: true, fontSize: 7 }] : []),
          ...(e.standNachEintreffen && zumWeiterfuehren ? [{ text: "⚠ Stand nach dem Eintreffen: Uhr prüfen", bold: true, fontSize: 7 }] : []),
          ...(e.abgerueckAm != null ? [{ text: `ab ${blattZeit(e.abgerueckAm)}`, bold: true }] : []),
          // Welche der „n von m älter als 1 Std" gemeint sind, steht an der Zeile (R13-K2); nur zählende Anwesende.
          ...(erstellt != null && !nachtrag && zaehlend(e) ? alterMarke(e, erstellt) : []),
          // Ohne Abrückzeit steht auf dem Wandblatt eine leere Stelle: Sie soll nicht wie „nie bekannt" wirken (R7-A2).
          ...(e.abgerueckt && e.abgerueckAm == null
            ? [{ text: e.zeitUnbestaetigt ? "Abrückzeit nicht bestätigt (vom Papier)" : "Abrückzeit nicht festgehalten", italics: true, fontSize: 7 }]
            : []),
        ],
      },
      standZelle(e),
      { text: staerkeSummenText(s.fuehrer, s.unterfuehrer, s.mannschaft, s.gesamt, staerkeKompakt) },
      { text: `${b.fahrzeuge.length}` },
      bedarfZelle(b),
      bemerkungZelle(e.notiz, b.sonstiges, maxZeilen === LAGEBLATT_MAX_ZEILEN ? BEMERKUNG_LAGEBLATT : undefined, bogenAnonymisiert(b)),
      aenderung,
    ];
  };
  const anwesend = eintraege.filter((e) => !e.abgerueckt);
  const abgerueckt = eintraege.filter((e) => e.abgerueckt);
  for (const e of anwesend) body.push(zeile(e));
  if (abgerueckt.length > 0) {
    // Ein Zwischenkopf statt einer Fußnote: „war da und ist wieder weg" muss
    // auf dem Papier so sichtbar sein wie in der Datei.
    abgerueckt.forEach((e, i) => body.push(zeile(e, i === 0 ? `Abgerückt (${abgerueckt.length})` : undefined)));
  }
  const summe = summiereBoegen(zaehlendeBoegen(eintraege));
  const uebungen = anwesend.filter((e) => e.zaehlt === false).length;
  const beschriftung = [`${summe.einheiten} zählend`];
  // Die Sollstärke steht in der Summe — das Blatt sagt, wie viel davon nicht gezählt ist (R8-A1).
  const sollEinheiten = eintraege.filter((e) => zaehlend(e) && nurSollstaerke(e.bogen));
  if (sollEinheiten.length > 0) {
    const personen = sollEinheiten.reduce((n, e) => n + staerke(e.bogen).gesamt, 0);
    beschriftung.push(`davon ${sollEinheiten.length} Sollstärke, nicht gemeldet (${personen} Pers.)`);
  }
  if (uebungen > 0) beschriftung.push(`${uebungen} Übung`);
  // Im Nachtrag: Einheiten, die schon in der letzten Lieferung standen, ersetzen
  // ihre Zeile und stehen nicht in dieser Summe (R5-W7).
  const ersetzend = anwesend.filter((e) => e.zaehlt !== false && e.nachtragNeu === false).length;
  if (ersetzend > 0) beschriftung.push(`${ersetzend} geändert, nicht mitgezählt`);
  if (abgerueckt.length > 0) beschriftung.push(`${abgerueckt.length} abgerückt`);
  /** Summenzeile: Beschriftung, Stärke, Fahrzeuge an ihren Spalten, Rest leer. */
  const summenZeile = (titel: string, staerkeText: string, fzg: string, margin?: [number, number, number, number]): TableCell[] => [
    { text: titel, bold: true, ...(margin ? { margin } : {}) },
    { text: "" },
    ...(zumWeiterfuehren ? [{ text: "" }] : []),
    { text: "" },
    { text: "" },
    { text: staerkeText, bold: true },
    { text: fzg, bold: true },
    { text: "" },
    { text: "" },
    { text: "" },
  ];
  // Auf dem leeren Lageblatt keine vorgedruckten Nullen — es ist die
  // Strichliste eines Meldekopfs, der gar nicht erst ins Gerät kommt (R3-A5).
  const leer = zumWeiterfuehren && eintraege.length === 0;
  if (!leer) {
    body.push(
      summenZeile(
        `Summe${nachtrag ? " Nachtrag" : ""}${zumWeiterfuehren ? " laut Gerät" : ""} (${beschriftung.join(" · ")})`,
        staerkeSummenText(summe.staerke.fuehrer, summe.staerke.unterfuehrer, summe.staerke.mannschaft, summe.staerke.gesamt, staerkeKompakt),
        `${summe.fahrzeuge}`,
      ),
    );
  }
  // Breiten für die quer liegende Übersichtsseite (714 pt Satzbreite): Zeiten
  // brechen nach dem Datum um, damit Zug und Bedarf daneben Platz haben.
  return {
    table: {
      headerRows: 1,
      // Eine Einheit steht auf einem Blatt: Auf dem Lageblatt brach die Zeile
      // „Nr. 8 THW Müllheim …" am Seitenende, oben auf der nächsten Seite
      // standen „Bergung (B)" und der Bedarf ohne Nummer und Namen (R4-A7).
      // Kopf und erste Zeile bleiben beisammen.
      dontBreakRows: true,
      keepWithHeaderRows: 1,
      widths: zumWeiterfuehren ? LAGEBLATT_SPALTEN : [118, 38, 48, 48, 48, 16, 66, 88, "*"],
      body,
    },
    // Bei 7,5 pt bleibt es (Zeilenbox 6,9 pt): 8 pt schob zehn Einheiten auf
    // zwei Seiten. Stärke und Bedarf stehen dafür in 9 pt in der Kopfleiste
    // über der Tabelle (Audit Runde 3, R3-K6).
    fontSize: 7.5,
    // Knappe Innenabstände: bei zehn Einheiten entscheidet das über Seite 2.
    layout: { paddingTop: () => 1, paddingBottom: () => 1, paddingLeft: () => 3, paddingRight: () => 3 },
    margin: [0, 0, 0, 4],
  };
}

/**
 * „Diesel 120 l · Benzin 30 l" — nur gemeldete Sorten, wie Einsatzansicht und Monitor (R14-K4); ohne Kraftstoff leer
 * (vorher „Diesel 0 l · Benzin 0 l", aber ohne Gemisch).
 */
function kraftstoffText(k: EinsatzSummen["kraftstoff"]): string {
  return kraftstoffTeile(k).join(" · ");
}

/** „Diesel 320 l · Gemisch 10 l" — nur gemeldete Sorten; „—" ohne Kraftstoff. */
function kraftstoffKurz(k: EinsatzSummen["kraftstoff"]): string {
  const teile: string[] = [];
  if (k.dieselLiter > 0) teile.push(`Diesel ${k.dieselLiter} l`);
  if (k.benzinLiter > 0) teile.push(`Benzin ${k.benzinLiter} l`);
  if (k.gemischLiter > 0) teile.push(`Gemisch ${k.gemischLiter} l`);
  return teile.join(" · ") || "—";
}

/**
 * Bedarfs-Übersicht des ganzen Einsatzes: Verpflegung, Unterbringung,
 * Kraftstoff und Ruhezeit über die zählenden Bögen der Sammlung — dieselben
 * Zahlen, die der Meldekopf auf dem Bildschirm sieht (gemeinsame Summierung in
 * auswertung.ts). Ohne sie zeigte die gedruckte Sammlung nur die Stärke.
 */
function bedarfsTabelle(eintraege: UebersichtEintrag[], leer = false, nachtrag?: string): Content {
  if (leer) {
    // Leeres Lageblatt: Zeilen zum Ausfüllen statt „0 Portionen" (R3-A5).
    const zeile = (titel: string): TableCell[] => [{ text: titel, bold: true }, { text: " ", margin: [0, 3, 0, 3] }];
    return {
      stack: [
        { text: "Bedarf gesamt (von Hand)", bold: true, margin: [0, 6, 0, 4] },
        {
          table: {
            headerRows: 0,
            widths: [104, "*"],
            body: [zeile("Verpflegung:"), zeile("Unterbringung angefordert:"), zeile("Betriebsstoff:"), zeile("Ruhezeit erforderlich:")],
          },
          margin: [0, 0, 0, 4],
        },
      ],
      unbreakable: true,
    };
  }
  const s = summiereBoegen(zaehlendeBoegen(eintraege));
  // R20-K2: Beruhen Summen auf Einheiten ohne Bedarfsangabe (Schnellerfassung), steht der Vorbehalt an jeder dieser Zeilen:
  // Das gedruckte Blatt geht an Stellen ohne App, und „keine" / „0 Portionen" las sich dort als „nichts nötig".
  const ohne = s.bedarfOhneAngabe ?? 0;
  const vorbehalt = ohne > 0 ? `bei ${ohne} von ${s.einheiten} Einheiten nicht erfasst` : "";
  const mitVorbehalt = (text: string) => (vorbehalt ? `${text} (${vorbehalt})` : text);
  const body: TableCell[][] = [
    [
      { text: "Verpflegung:", bold: true },
      {
        text: mitVorbehalt(
          (s.verpflegungAngefordert === s.verpflegung.gesamt
            ? `${s.verpflegung.gesamt} Portionen `
            : `angefordert ${s.verpflegungAngefordert} Portionen, Stärke ${s.verpflegung.gesamt} `) +
            // Die Ernährung kennt nur, wer Bedarf angegeben hat: ohne Angabe steht sie nicht als „Fleisch“ da.
            (ohne >= s.einheiten && s.einheiten > 0
              ? "(Ernährung nicht erfasst)"
              : `(${s.verpflegung.fleisch} Fleisch / ${s.verpflegung.vegetarisch} vegetarisch / ${s.verpflegung.vegan} vegan)`),
        ),
      },
    ],
    // Quartier und WC/Dusche getrennt: die M/W/D-Zahl zählt alle Anwesenden,
    // angefordert haben nur einige Einheiten (Audit Runde 3, R3-K4).
    [
      { text: "Unterbringung angefordert:", bold: true },
      { text: mitVorbehalt(unterbringungAngefordertText(s) || "keine") },
    ],
    [
      { text: "WC/Dusche (alle Anwesenden):", bold: true },
      { text: mwdText({ ...s.unterbringung, ohneAngabe: s.unterbringungOhneAngabe }) },
    ],
    [{ text: "Betriebsstoff:", bold: true }, { text: mitVorbehalt(kraftstoffText(s.kraftstoff) || "—") }],
    [
      { text: "Fahrzeuge / Ruhezeit:", bold: true },
      { text: mitVorbehalt(`${s.fahrzeuge} Fahrzeuge · Ruhezeit erforderlich bei ${einheitenZahl(s.ruhezeitErforderlich)}`) },
    ],
  ];
  return {
    stack: [
      { text: `${nachtrag ? "Bedarf Nachtrag" : "Bedarf gesamt"} (${einheitenZahl(s.einheiten)}, ${s.staerke.gesamt} Personen)`, bold: true, margin: [0, 6, 0, 4] },
      { table: { headerRows: 0, widths: [104, "*"], body }, margin: [0, 0, 0, 4] },
    ],
    unbreakable: true,
  };
}

/**
 * Zwischensummen je Zug/Verband — nur sinnvoll, wenn die Sammlung überhaupt
 * mehr als eine Gruppe kennt (sonst wiederholt die Tabelle nur den Gesamtwert).
 * Nur zählende Einheiten, wie am Gerät (aggregiereNachZug).
 */
function zugSummenTabelle(eintraege: UebersichtEintrag[], nachtrag?: string, erstellt?: number): Content | undefined {
  const nach = new Map<string, Erfassungsbogen[]>();
  const aeltester = new Map<string, number>();
  for (const e of eintraege.filter(zaehlend)) {
    const k = e.zugEtikett ?? "";
    (nach.get(k) ?? nach.set(k, []).get(k)!).push(e.bogen);
    if (e.empfangenAm != null) {
      const z = angabenZeit({ empfangenAm: e.empfangenAm, bogen: e.bogen, angaben: e.angaben });
      aeltester.set(k, Math.min(aeltester.get(k) ?? z, z));
    }
  }
  if (nach.size < 2) return undefined;
  const kopf = (text: string): TableCell => ({ text, bold: true, fillColor: GRAU });
  const body: TableCell[][] = [
    // „Unterbr. angef." = Personen der Einheiten mit angeforderter
    // Unterbringung; „M / W / D (alle)" zählt alle Anwesenden (R3-K4).
    [kopf("Zug / Verband"), kopf("Einh."), kopf("Stärke\nF / U / M / G"), kopf("Verpfl."), kopf("Unterbr.\nangef."), kopf("M / W / D\n(alle)"), kopf("Betriebsstoff"), kopf("Ruhe-\nzeit"), kopf("Fzg")],
  ];
  const gruppen = [...nach.entries()].sort(([a], [b]) => {
    if (a === "") return 1; // „ohne Etikett" ans Ende — wie in der Oberfläche
    if (b === "") return -1;
    return a.localeCompare(b, "de");
  });
  for (const [etikett, gruppe] of gruppen) {
    const s = summiereBoegen(gruppe);
    // Die Stärke je Zug wirkt frisch, auch wenn sie es nicht ist (R12-K3).
    const alter = erstellt != null && !nachtrag ? zugAlterText(aeltester.get(etikett), erstellt) : null;
    body.push([
      alter ? { text: [{ text: etikett || "Ohne Zug" }, { text: `\n${alter}`, bold: true, fontSize: 6.5 }] } : { text: etikett || "Ohne Zug" },
      { text: `${s.einheiten}` },
      { text: `${s.staerke.fuehrer} / ${s.staerke.unterfuehrer} / ${s.staerke.mannschaft} / ${s.staerke.gesamt}` },
      { text: `${s.verpflegung.gesamt}` },
      { text: `${s.unterbringungAngefordert.personen}` },
      { text: `${s.unterbringung.m} / ${s.unterbringung.w} / ${s.unterbringung.d}` },
      // Nur, was gemeldet ist: „Benzin 0 l" brach die Zeile in der schmalen
      // Spalte auf drei Zeilen um und schob den Block auf Seite 2 (R3-K6).
      { text: kraftstoffKurz(s.kraftstoff) },
      // Einheiten mit Ruhezeit je Zug: Die Summe geht mit „Ruhezeit erforderlich bei n Einheit(en)" auf (R15-K3).
      { text: `${s.ruhezeitErforderlich}` },
      { text: `${s.fahrzeuge}` },
    ]);
  }
  return {
    stack: [
      { text: nachtrag ? "Zwischensummen nach Zug (nur Nachtrag)" : "Zwischensummen nach Zug", bold: true, margin: [0, 6, 0, 4] },
      { table: { headerRows: 1, widths: [84, 22, 52, 28, 32, 44, "*", 26, 18], body }, margin: [0, 0, 0, 4] },
    ],
    unbreakable: true,
  };
}

/**
 * Kopfleiste der Übersichtsseite: Stärke und Bedarf der zählenden Einheiten
 * in zwei Zeilen, Dringendes fett. Die Einzelheiten (Verpflegung nach
 * Kostform, WC/Dusche, Zwischensummen) stehen weiter unter der Tabelle.
 */
function lageKopfleiste(eintraege: UebersichtEintrag[], leer = false, nachtrag?: string, erstellt?: number): Content {
  if (leer) {
    // Leeres Lageblatt: Ausfülllinien statt „0 / 0 / 0 / 0" (R3-A5).
    const l = LEERFELD;
    return {
      table: {
        widths: ["*"],
        body: [[{
          stack: [
            { text: [{ text: "Lage: ", bold: true }, { text: `${l} Einheiten · Stärke F / U / M / G ${l} / ${l} / ${l} / ${l} · ${l} Fahrzeuge` }] },
            { text: [{ text: "Bedarf: ", bold: true }, { text: `Verpflegung ${l} · Unterbringung ${l} · Ruhezeit ${l} · Diesel ${l} l · Benzin ${l} l` }] },
          ],
          margin: [0, 2, 0, 2],
        }]],
      },
      fontSize: 9,
      margin: [0, 0, 0, 5],
    };
  }
  const s = summiereBoegen(zaehlendeBoegen(eintraege));
  // Ein Nachtrag beginnt nicht wie die Gesamtfassung: im Stab liegen am Morgen
  // mehrere Ausdrucke mit „Lage: …", und wer den jüngsten greift, las 8 Kräfte
  // statt 50 (R4-W4).
  const staerkeZeile = [
    nachtrag
      ? { text: `NACHTRAG ${nachtrag} — nicht die ganze Lage: `, bold: true }
      : { text: "Lage: ", bold: true },
    { text: `${s.einheiten} ${s.einheiten === 1 ? "Einheit" : "Einheiten"} zählend · Stärke F / U / M / G ` },
    { text: `${s.staerke.fuehrer} / ${s.staerke.unterfuehrer} / ${s.staerke.mannschaft} / ${s.staerke.gesamt}`, bold: true },
    { text: ` · ${s.fahrzeuge} Fahrzeuge` },
  ];
  const angefordert = unterbringungAngefordertText(s);
  // Schnell erfasste Einheiten haben keinen Bedarf angegeben: „keine" wäre dort eine falsche Aussage (R14-W1).
  const ohne = s.bedarfOhneAngabe;
  const ohneText = ohne > 0 ? ` (${bedarfOhneAngabeText(ohne)})` : "";
  const kraftstoff = kraftstoffText(s.kraftstoff);
  const bedarfZeile = [
    { text: nachtrag ? "Bedarf (nur Nachtrag): " : "Bedarf: ", bold: true },
    { text: `${verpflegungText(s)} · ` },
    angefordert
      ? { text: `Unterbringung angefordert: ${angefordert}${ohneText}`, bold: true }
      : { text: `keine Unterbringung angefordert${ohneText}`, ...(ohne > 0 ? { bold: true } : {}) },
    { text: " · " },
    s.ruhezeitErforderlich > 0
      ? { text: `Ruhezeit: ${s.ruhezeitErforderlich} ${s.ruhezeitErforderlich === 1 ? "Einheit" : "Einheiten"}${ohneText}`, bold: true }
      : { text: `keine Ruhezeit${ohneText}`, ...(ohne > 0 ? { bold: true } : {}) },
    ...(kraftstoff || ohne > 0 ? [{ text: ` · ${kraftstoff || "kein Betriebsstoff"}${ohneText}` }] : []),
  ];
  // Wie alt sind die Meldungen hinter den Zahlen? Bildschirm und Monitor sagen es; die Wand sollte es auch sagen (R12-K3).
  // Gerechnet zum Zeitpunkt des Ausdrucks, nicht zum Zeitpunkt des Lesens.
  const alterZeile =
    erstellt != null && !nachtrag
      ? lageblattAlterText(
          eintraege.filter(zaehlend).flatMap((e) => (e.empfangenAm != null ? [angabenZeit({ empfangenAm: e.empfangenAm, bogen: e.bogen, angaben: e.angaben })] : [])),
          erstellt,
        )
      : null;
  // Eine falsche Geräteuhr versetzt alle Zeiten des Blatts; der Bildschirm warnt, die Wand muss es auch sagen (R14-A2).
  const uhrN = eintraege.filter((e) => zaehlend(e) && e.standNachEintreffen).length;
  const uhrZeile =
    uhrN > 0 && !nachtrag
      ? `⚠ Geräteuhr geht vermutlich nach: ${uhrN} ${uhrN === 1 ? "Stand liegt" : "Stände liegen"} nach dem Eintreffen — alle Zeiten dieses Blatts prüfen.`
      : null;
  return {
    table: {
      widths: ["*"],
      body: [[{ stack: [{ text: staerkeZeile }, { text: bedarfZeile }, ...(alterZeile ? [{ text: alterZeile, bold: true }] : []), ...(uhrZeile ? [{ text: uhrZeile, bold: true }] : [])] }]],
    },
    fontSize: 9,
    margin: [0, 0, 0, 5],
  };
}

/** Spaltenbreiten des Lageblatts (714 pt Satzbreite). */
const LAGEBLATT_SPALTEN: (number | "*")[] = [100, 34, 86, 46, 46, 54, 14, 56, 104, "*"];
/** Wie das Lageblatt, die letzte Spalte geteilt: hinten schmal „übertragen“ (R4-A4). */
const NACHTRAG_SPALTEN: (number | "*")[] = [...LAGEBLATT_SPALTEN.slice(0, 9), "*", 64];

/**
 * Nachtragszeilen des Lageblatts: Fällt das Gerät aus, geht es auf diesem
 * Blatt weiter statt auf einem neuen Zettel — sonst gibt es später drei
 * Quellen (R2-A3). Gleiche Spalten wie die Einheitenzeilen darüber, hinten
 * eine schmale Spalte „übertragen“: Nach der Papierphase hakt ab, wer die
 * Zeile ins Gerät übernommen hat, statt dass zwei Helfer denselben Stapel
 * abtippen (R4-A4). Darunter die fortgeschriebene Summe (R3-A5).
 *
 * Eigene Tabelle statt Zeilen der Einheitentabelle: Die Beschriftung
 * „Nachtrag von Hand“ blieb am Seitenende stehen, ihre Zeilen standen auf
 * der nächsten Seite (R4-A7). Als Kopfzeile bleibt sie bei den Zeilen und
 * steht auf jeder Folgeseite wieder oben. Mit `rueckseite` wiederholt die
 * Tabelle zusätzlich die Spaltenköpfe.
 */
function nachtragsTabelle(zeilen: number, leer: boolean, rueckseite: boolean): Content {
  const SP = NACHTRAG_SPALTEN.length;
  const kopf = (text: string): TableCell => ({ text, bold: true, fillColor: GRAU });
  const body: TableCell[][] = [];
  if (rueckseite) {
    body.push([
      kopf("Einheit"),
      kopf("Zug"),
      kopf("Funkrufname /\nRückruf"),
      kopf("Eingetroffen\n(abgerückt)"),
      kopf("Stand der\nAngaben"),
      kopf("Stärke\nF / U / M / G"),
      kopf("Fzg"),
      kopf("Bedarf"),
      kopf("Auftrag / Notiz"),
      kopf("Veränderung / Bemerkung"),
      kopf("übertragen"),
    ]);
  }
  const label: TableCell[] = [{ text: "Nachtrag von Hand (Einheit, Zug, Uhrzeit an / ab, Stärke …)", italics: true, colSpan: SP - 1 }];
  for (let i = 1; i < SP - 1; i++) label.push({});
  // Mit Spaltenköpfen steht „übertragen“ dort schon.
  label.push({ text: rueckseite ? "" : "übertragen", italics: true });
  body.push(label);
  for (let n = 0; n < zeilen; n++) {
    // Die zweite und dritte Zeile tragen Messpunkte: ihr Abstand ist die Zeilenhöhe
    // (die erste steht hinter der Kopfzeile und misst anders).
    body.push(
      Array.from({ length: SP }, (_, i): TableCell => ({
        // Hinten das Kästchen mit Platz für das Kürzel dahinter.
        text: i === SP - 1 ? NACHTRAG_UEBERTRAGEN : " ",
        margin: [0, 5, 0, 5],
        ...(i === 0 && (n === 1 || n === 2) ? { id: `${MESS_NACHTRAG}${n}` } : {}),
      })),
    );
  }
  // Nach dem ersten Nachtrag ist die gedruckte Summe falsch; die
  // fortgeschriebene gehört darunter aufs Blatt, nicht auf einen Zettel (R3-A5).
  const summe: TableCell[] = [
    { text: leer ? "Summe (von Hand)" : "Summe einschl. Nachträge (von Hand)", bold: true, margin: [0, 5, 0, 5] },
    ...Array.from({ length: SP - 1 }, (): TableCell => ({ text: " " })),
  ];
  body.push(summe);
  return {
    table: {
      // Zeilen bleiben ganz; Kopf (und bei der Rückseite die Spaltenköpfe) bleiben bei den Zeilen.
      headerRows: rueckseite ? 2 : 1,
      keepWithHeaderRows: 1,
      dontBreakRows: true,
      widths: NACHTRAG_SPALTEN,
      body,
    },
    fontSize: 7.5,
    layout: { paddingTop: () => 1, paddingBottom: () => 1, paddingLeft: () => 3, paddingRight: () => 3 },
    margin: [0, 0, 0, 4],
  };
}

/** Die Übersichtsseite — gemeinsamer Kern von Sammel-PDF und Lageblatt. */
function uebersichtsSeite(
  titel: string,
  eintraege: UebersichtEintrag[],
  erstellt: number,
  hinweis?: string,
  maxZeilen = UEBERSICHT_MAX_ZEILEN,
  zumWeiterfuehren = false,
  nachtragZeilen = NACHTRAG_ZEILEN_MIN,
  nachtrag?: string,
  /** Nachtragszeilen auf eine eigene Seite hinter dem Blatt (Lageblatt, das auf eine Seite zu voll ist). */
  rueckseite = false,
): Content[] {
  const leer = zumWeiterfuehren && eintraege.length === 0;
  const nachtragsTab = zumWeiterfuehren && nachtragZeilen > 0 ? nachtragsTabelle(nachtragZeilen, leer, rueckseite) : undefined;
  const zugSummen = zugSummenTabelle(eintraege, nachtrag, erstellt);
  const bedarf = bedarfsTabelle(eintraege, leer, nachtrag);
  // Sammel-PDF mit vielen Einheiten: Bedarf und Zwischensummen stehen unter der
  // Kopfleiste. Hinter der Tabelle passte der unteilbare Block oft nicht mehr auf
  // die Seite und stand allein auf einer eigenen (R5-A8).
  const bedarfBlock: Content = zugSummen
    ? { columns: [{ width: 300, stack: [bedarf] }, { width: "*", stack: [zugSummen] }], columnGap: 12, fontSize: 7.5 }
    : bedarf;
  // Lageblatt mit Zügen: Die Zugsummen gehören auf Seite 1 (R16-K4) — wer nur sie aushängt, hat sonst die Stärke je Zug nicht;
  // bei langen Zeilen der Tabelle rutschte der Block sonst auf die Rückseite.
  const bedarfVorn = zumWeiterfuehren ? !leer && zugSummen != null : eintraege.length > BEDARF_VORN_AB;
  return [
    // Titel und Erstellzeit in einer Zeile — jede Zeile zählt, damit das
    // Lageblatt bei rund zehn Einheiten auf eine Seite passt (R2-K3).
    {
      text: [
        { text: titel, bold: true, fontSize: 12 },
        // Wann das Blatt gedruckt wurde, gehört aufs Blatt: an der Wand hängen
        // nachher drei davon, und nur das jüngste gilt.
        { text: `   Erstellt ${zeitLang(erstellt)}`, italics: true },
      ],
      margin: [0, 0, 0, 6],
    },
    // Stärke und Bedarf vor der Tabelle: Ab rund 13 Einheiten stand „Bedarf
    // gesamt" allein auf Seite 2 — wer nur Seite 1 aushängt oder faxt, gab
    // Stärke ohne Bedarf weiter (Audit Runde 3, R3-K6).
    lageKopfleiste(eintraege, leer, nachtrag, erstellt),
    ...(bedarfVorn ? [bedarfBlock] : []),
    uebersichtsTabelle(eintraege, maxZeilen, zumWeiterfuehren, nachtrag, erstellt),
    ...(nachtragsTab && !rueckseite && leer ? [nachtragsTab] : []),
    ...(hinweis ? [{ text: hinweis, italics: true, margin: [0, 2, 0, 0] } as Content] : []),
    // Bedarf und Zwischensummen nebeneinander statt untereinander: vorher
    // rutschten die Zwischensummen allein auf Seite 2 (R2-K3).
    ...(bedarfVorn ? [] : [bedarfBlock]),
    // Das Raster zum Weiterschreiben füllt den Rest des Blatts NACH Bedarf und Zugsummen (R16-K4): bei zwei Zügen
    // und einer abgerückten Einheit stand es vor ihnen, und sie rutschten hinter zwölf leere Zeilen auf die Rückseite.
    // Tafel und Summenzeile bleiben auf einer Seite (R18-A9): Passt sie nicht mehr unter den Inhalt, steht sie ganz auf der
    // nächsten; vorher begann sie am Seitenende mit zwei Zeilen, der Rest samt „Summe einschl. Nachträge" folgte auf Seite 2.
    ...(nachtragsTab && !rueckseite && !leer ? [{ stack: [nachtragsTab], unbreakable: true } as Content] : []),
    // Zu voll für eine Seite mit fünf Nachtragszeilen: die Zeilen bekommen die
    // Rückseite, Seite 1 bleibt, wie sie ist (R4-A3).
    ...(nachtragsTab && rueckseite ? [{ stack: [nachtragsTab], pageBreak: "before" } as Content] : []),
    // Messpunkt hinter dem letzten Inhalt: wie viel Platz bleibt auf der
    // letzten Seite (einsatzLageblattSeiteFuellen)?
    ...(zumWeiterfuehren ? [{ text: " ", fontSize: 1, id: MESS_ENDE } as Content] : []),
  ];
}

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
export function staerkeVonHand(b: Pick<Erfassungsbogen, "personalErfassung" | "staerkeManuell" | "personal">): boolean {
  return b.staerkeManuell != null && b.personalErfassung !== PersonalErfassung.NUR_STAERKE && b.personal.length > 0;
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
export function codeKopfzeile(b: Erfassungsbogen, stand: string, nummer?: number): string {
  const funk = erreichbarkeitZeilen(b)[0];
  const fzg = b.fahrzeuge.find((f) => f.funkrufname);
  return [
    ...(nummer != null ? [`Nr. ${nummer}`] : []),
    einheitAnzeigename(b.einheit),
    ...(fzg && funk ? [`FuRn ${funk}`] : []),
    `Stand ${stand}`,
  ].join(" · ");
}

export function meldekopfVermerk(e: UebersichtEintrag, name: string, erstellt: number): MeldekopfVermerk {
  // Die Nummer steht auch hier: nach einem Wiederanlauf vom Papier fragt der
  // Abgleich sie ab, damit „Nr. 3 rückt ab" über Funk dieselbe Einheit meint
  // wie auf dem Blatt an der Wand (R4-A1).
  const teile = [
    ...(e.nummer != null ? [`Nr. ${e.nummer}`] : []),
    // Die Marke der Übersicht gehört auch in den Kasten: Sonst gilt die Einlesezeit beim
    // Wiederanlauf vom Papier als bestätigt (R6-A1).
    `Eingetroffen ${e.eingetroffenAm == null ? "(nicht festgehalten)" : `${zeitLang(e.eingetroffenAm)}${e.zeitUnbestaetigt ? " (nicht bestätigt, vom Papier)" : e.zeitEingelesen ? " (Zeit des Einlesens, nicht geprüft)" : ""}`}`,
  ];
  if (e.abgerueckt) {
    teile.push(
      e.abgerueckAm == null
        ? `ABGERÜCKT (nicht mehr vor Ort) — Abrückzeit ${e.zeitUnbestaetigt ? "nicht bestätigt (vom Papier)" : "nicht festgehalten"}`
        : `ABGERÜCKT ${zeitLang(e.abgerueckAm)}`,
    );
  } else {
    teile.push(e.zaehlt === false ? "anwesend, zählt nicht in diese Lage" : "anwesend");
  }
  teile.push(`Zug: ${e.zugEtikett || "–"}`);
  if (e.teil) teile.push(`Teil: ${e.teil}`);
  teile.push(`Auftrag / Notiz: ${e.notiz || "–"}`);
  if (e.absender) teile.push(`Absender: ${e.absender}`);
  return {
    stand: `Stand am Meldekopf (${name}, erstellt ${zeitLang(erstellt)}): ${teile.join(" · ")}`,
    abgerueckt: !!e.abgerueckt,
    ...(e.nummer != null ? { nummer: e.nummer } : {}),
  };
}

/** Kasten „Stand am Meldekopf" — oben auf dem Bogen und auf jeder QR-Seite. */
function vermerkKasten(v: MeldekopfVermerk, margin: [number, number, number, number], id?: string): Content {
  return {
    ...(id ? { id } : {}),
    table: {
      widths: ["*"],
      body: [[{ text: weichUmbrechen(v.stand), bold: true, fontSize: 8, fillColor: v.abgerueckt ? GRAU : undefined }]],
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
    margin: [SEITENRAENDER[0], RAND_ZEILE_Y, SEITENRAENDER[2], 0],
    table: { widths: ["*"], body: [[{ text, fontSize: 7.5, bold: rahmen, noWrap: true }]] },
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
  return name.length > NAME_IM_KOPF_MAX ? `${name.slice(0, NAME_IM_KOPF_MAX - 1).trimEnd()}…` : name;
}

/**
 * Kopfzeile einer Bogenseite. `nummer` aus dem Meldekopf (Sammel-PDF) oder
 * Ausfülllinie (Einzel-PDF, Blanko). `blatt`/`von`: Seite dieses Bogens.
 */
function bogenKopfzeile(einheit: string, nummer: number | undefined, blatt: number, von: number): Content {
  const nr = nummer != null ? `Nr. ${nummer}` : "Nr. ______";
  if (blatt === 1) {
    return randZeile(
      nummer != null
        ? `${nr}  ·  ${kopfName(einheit)}  ·  Blatt 1 von ${von}  ·  ${UEBERTRAGEN_KURZ}`
        : `Meldekopf:  ${nr}  ·  eingegangen ____________ um ____:____ Uhr  ·  ${UEBERTRAGEN_KURZ}`,
      true,
    );
  }
  return randZeile(`${nr}  ·  ${kopfName(einheit)}  ·  Blatt ${blatt} von ${von} dieses Bogens`, false);
}

/** Fußzeile mit Seitenzahl — für Sammel-PDF und Lageblatt gleich. */
function seitenFuss(text: string): TDocumentDefinitions["footer"] {
  return (seite, gesamt) => ({
    columns: [
      { text, margin: [40, 0, 0, 0] },
      // Seitenzahl nur so breit wie nötig — der Text links darf lang sein.
      { text: `${seite} / ${gesamt}`, width: "auto", noWrap: true, alignment: "right", margin: [8, 0, 40, 0] },
    ],
    fontSize: 7.5,
  });
}

/** Ein Pixel, quadratisch: Platzhalter für QR-Bilder im Probesatz. */
const PIXEL_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

/** Kennung des Kastens „Stand am Meldekopf“ im Probesatz (R4-A7). */
const MESS_KASTEN = "sammel-kasten-";

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

/**
 * Sammel-PDF eines Einsatzes: vorneweg die Übergabe-Übersicht (Zeiten,
 * Stärke, Fahrzeuge, Auftrag, Änderungen je Einheit — abgerückte in einem
 * eigenen Block), dahinter alle Bögen (je Bogen die vollständigen Seiten inkl.
 * QR-Code), plus ALLE Bögen als eingebettetes JSON-Array — so ist der ganze
 * Einsatz maschinen- und menschenlesbar in einer Datei übergebbar. Auch mit
 * null anwesenden Einheiten: am Einsatzende, wenn alle abgerückt sind, ist die
 * Datei die Übergabe ans Archiv (Arbeitsablauf-Audit W2). Baut die Seiten aus
 * {@link pdfDokument} zusammen.
 */
export function einsatzPdfDokument(
  name: string,
  boegenMitQrUngeordnet: SammelBogen[],
  /** Optional: kompletter Einsatz-Umschlag (einsatzDateiInhalt) für die Schichtübergabe. */
  sammlungJson?: string,
  erstellt = Date.now(),
  /**
   * Ein Nachtrag („nur neue Bögen"): ab wann. Kopf, Summen und Fußzeile sagen,
   * dass es nur ein Teil der Lage ist, und ein Import warnt (R4-W4).
   */
  nachtragSeit?: number,
  optionen: SammelOptionen = {},
): TDocumentDefinitions {
  const boegenMitQr = nachNummer(boegenMitQrUngeordnet);
  const nachtrag = nachtragSeit != null ? `seit ${zeitLang(nachtragSeit)}` : undefined;
  const content: Content[] = uebersichtsSeite(
    nachtrag ? `Übergabe-Übersicht NACHTRAG ${nachtrag}: ${name}` : `Übergabe-Übersicht: ${name}`,
    boegenMitQr,
    erstellt,
    (nachtrag
      ? `NACHTRAG ${nachtrag}: nur die neuen oder geänderten Einheiten — nicht die ganze Lage. Die ganze Lage steht in „Einsatz weitergeben / sichern“. `
      : "") +
      "Die Änderungsspalte vergleicht jede Meldung mit der vorherigen Meldung derselben Einheit. Die vollständigen Bögen folgen." +
      (boegenMitQr.some((e) => e.zeitEingelesen) ? ` ${EINGELESEN_FUSSNOTE}` : "") +
      (lueckenZeile ? ` ${lueckenZeile}` : ""),
    undefined,
    false,
    undefined,
    nachtrag,
  );
  boegenMitQr.forEach((eintrag, i) => {
    // Zurück ins Hochformat: der Bogen selbst bleibt exakt der Papiervordruck.
    // pdfmake übernimmt die Ausrichtung des Knotens, der den Umbruch auslöst.
    content.push({ text: "", pageBreak: "before", pageOrientation: "portrait" });
    // Der Stand am Meldekopf steht über dem Bogen und auf jeder QR-Seite —
    // die Bogenseiten müssen auch ohne Seite 1 stimmen (R2-A1).
    const vermerk = meldekopfVermerk(eintrag, name, erstellt);
    content.push(vermerkKasten(vermerk, [0, 0, 0, 4], optionen.messen || optionen.nurKastenKennung ? `${MESS_KASTEN}${i}` : undefined));
    content.push(
      ...(pdfDokument(eintrag.bogen, eintrag.qr, undefined, vermerk, {
        verdichtet: optionen.verdichtet?.has(i) === true,
        ...(optionen.messen ? { messpunkt: true, messKennung: `-${i}` } : {}),
      }).content as Content[]),
    );
  });
  return winAnsiDokument({
    pageSize: "A4",
    // Nur die vorangestellte Übersicht liegt quer — sie trägt breite Tabellen
    // (Änderungsspalte, Zug-Zwischensummen); ab dem ersten Bogen wird oben
    // wieder auf Hochformat zurückgeschaltet.
    pageOrientation: "landscape",
    pageMargins: SEITENRAENDER,
    defaultStyle: { fontSize: 8, font: SCHRIFT },
    info: { title: `Einsatz-Sammlung ${name}` },
    // Das Wasserzeichen liegt dokumentweit hinter allen Seiten — es erscheint
    // darum nur, wenn ausnahmslos jeder Bogen eine Übung ist. In gemischten
    // Sammlungen bleiben die Übungsbögen über ihre Störer-Zeile und die
    // Markierung in der Übersichtstabelle erkennbar.
    ...(boegenMitQr.length > 0 && boegenMitQr.every(({ bogen }) => bogen.uebung)
      ? { background: uebungsWasserzeichen() }
      : {}),
    ...(optionen.messen || optionen.nurKastenKennung
      ? {}
      : {
          files: {
            [EEB_EINSATZ_DATEINAME]: boegenAlsEingebetteteDatei(boegenMitQr.map((x) => x.bogen)),
            ...(sammlungJson ? { [EEB_EINSATZ_SAMMLUNG_DATEINAME]: sammlungAlsEingebetteteDatei(sammlungJson) } : {}),
          },
        }),
    // Kopfzeile jeder Bogenseite: Nr., Einheit, Blatt x von y; auf Blatt 1 der Platz
    // „übertragen“ (R5-A2, R5-A3). Die Übersicht (quer) hat ihren Titel.
    ...(optionen.bogenStart
      ? {
          header: (seite: number, gesamt: number, groesse: { orientation: string }): Content => {
            const start = optionen.bogenStart!;
            let i = -1;
            start.forEach((von, k) => {
              if (von <= seite) i = k;
            });
            if (i < 0 || groesse.orientation === "landscape") return { text: "" };
            const ende = (start[i + 1] ?? gesamt + 1) - 1;
            const e = boegenMitQr[i]!;
            return bogenKopfzeile(einheitAnzeigename(e.bogen.einheit), e.nummer, seite - start[i]! + 1, ende - start[i]! + 1);
          },
        }
      : {}),
    // Die Fußzeile trägt den Stand des Ausdrucks auf jeder Seite; Zeiten und
    // Abrückvermerk je Einheit stehen im Kasten über dem Bogen (R2-A1).
    footer: seitenFuss(
      `${nachtrag ? `NACHTRAG ${nachtrag} (nicht die ganze Lage) — Einsatz` : "Einsatz-Sammlung"}: ${name} · Stand ${zeitLang(erstellt)} · Eintreff-/Abrückzeiten: Seite 1 und Kasten über jedem Bogen`,
    ),
    content,
  });
}

/**
 * Bis zu so viel Höhe (pt) belegt die letzte Zeile(n) eines Bogens auf einer
 * Folgeseite, damit sie als Restseite gilt: gut zwölf Textzeilen (R5-A8, vorher 110 pt = gut acht). Der Kasten
 * „Stand am Meldekopf“ über dem Bogen kostete in der Sammel-PDF von 30
 * Einheiten zwei Seiten, die nur noch die letzte Zeile des Sofortbedarfs
 * trugen („M 11 / W 1 / D 0“), obwohl das Einzel-PDF derselben Einheit ohne
 * Restseite auskam (Audit Runde 4, R4-A7).
 */
const RESTSEITE_MAX_PT = 160;

/**
 * Sammel-PDF ohne Restseiten. Ein Probesatz ohne Bilder und ohne Anhang misst
 * je Bogen, wo sein Formular endet; steht der Rest auf einer Folgeseite und
 * ist kürzer als {@link RESTSEITE_MAX_PT}, wird dieser Bogen enger gesetzt
 * (`verdichtet`). Hilft das nicht, bleibt er wie er war — ein enger Bogen, der
 * trotzdem eine Restseite braucht, hätte nichts gewonnen.
 *
 * `setzen` führt den Satz aus (Browser: pdfmake-Puffer, Tests: Node).
 */
export async function einsatzPdfDokumentGesetzt(
  name: string,
  boegenMitQrUngeordnet: SammelBogen[],
  sammlungJson: string | undefined,
  erstellt: number,
  nachtragSeit: number | undefined,
  setzen: (dd: TDocumentDefinitions) => Promise<unknown>,
): Promise<TDocumentDefinitions> {
  // Die Indizes der Probesätze gelten für diese Reihenfolge (nach Nr., R5-A9).
  const boegenMitQr = nachNummer(boegenMitQrUngeordnet);
  const ohneBilder = boegenMitQr.map((e) => ({ ...e, qr: null }) as unknown as SammelBogen);
  /** Welche Bögen enden mit einer Restseite? */
  const restseiten = async (verdichtet: ReadonlySet<number>): Promise<Set<number>> => {
    const pos = new Map<string, MessPosition>();
    const dd = einsatzPdfDokument(name, ohneBilder, undefined, erstellt, nachtragSeit, { verdichtet, messen: true });
    dd.pageBreakBefore = (knoten) => {
      const k = knoten as { id?: string; startPosition?: MessPosition };
      if (k.id && k.startPosition) pos.set(k.id, k.startPosition);
      return false;
    };
    await setzen(dd);
    const rest = new Set<number>();
    boegenMitQr.forEach((_, i) => {
      const anfang = pos.get(`${MESS_KASTEN}${i}`);
      const ende = pos.get(`${MESS_BOGEN_ENDE}-formular-${i}`);
      if (!anfang || !ende || ende.pageNumber <= anfang.pageNumber) return;
      if (ende.verticalRatio * ende.pageInnerHeight <= RESTSEITE_MAX_PT) rest.add(i);
    });
    return rest;
  };
  const betroffen = await restseiten(new Set());
  let verdichtet: ReadonlySet<number> = new Set();
  if (betroffen.size > 0) {
    const nochBetroffen = await restseiten(betroffen);
    verdichtet = new Set([...betroffen].filter((i) => !nochBetroffen.has(i)));
  }
  // Wo jeder Bogen beginnt, weiß erst der Satz MIT Codeseiten: Platzhalterbilder gleicher
  // Größe (ein Pixel, quadratisch) setzen gleich wie die QR-Codes, kosten aber nichts (R5-A3).
  const platzhalter = boegenMitQr.map(
    (e) => ({ ...e, qr: { ...e.qr, teile: e.qr.teile.map((t) => ({ ...t, datenUrl: PIXEL_PNG })) } }) as SammelBogen,
  );
  const start = new Map<string, MessPosition>();
  const probe = einsatzPdfDokument(name, platzhalter, undefined, erstellt, nachtragSeit, { verdichtet, nurKastenKennung: true });
  probe.pageBreakBefore = (knoten) => {
    const k = knoten as { id?: string; startPosition?: MessPosition };
    if (k.id && k.startPosition) start.set(k.id, k.startPosition);
    return false;
  };
  await setzen(probe);
  const bogenStart = boegenMitQr.map((_, i) => start.get(`${MESS_KASTEN}${i}`)?.pageNumber ?? 0);
  return einsatzPdfDokument(name, boegenMitQr, sammlungJson, erstellt, nachtragSeit, {
    verdichtet,
    ...(bogenStart.every((n) => n > 0) ? { bogenStart } : {}),
  });
}

/**
 * Lageblatt: nur die Übersichtsseite der Sammel-PDF — Einheiten mit Zeiten,
 * Bedarf, Zwischensummen — quer auf A4, ohne Bögen, ohne QR, ohne Anhang.
 *
 * Das Blatt für die Wand und für die Ablösung: „alle 60 Minuten ein Blatt,
 * das ist der Stand, der bei Geräteausfall gilt" (Analog-Audit A3). Die
 * Sammel-PDF mit 40 Bögen ist 41 Seiten und wird deshalb nicht gedruckt (A4).
 * Bewusst kein eingebettetes JSON: das Blatt ist Papier, die Weitergabe der
 * Sammlung ist die Sammel-PDF.
 */
export function einsatzLageblattDokument(
  name: string,
  eintraegeUngeordnet: UebersichtEintrag[],
  erstellt = Date.now(),
  nachtragZeilen = NACHTRAG_ZEILEN_MIN,
  /** Die Nachtragszeilen auf eine eigene Seite hinter dem Blatt (R4-A3). */
  rueckseite = false,
): TDocumentDefinitions {
  const eintraege = nachNummer(eintraegeUngeordnet);
  return winAnsiDokument({
    pageSize: "A4",
    pageOrientation: "landscape",
    pageMargins: SEITENRAENDER,
    defaultStyle: { fontSize: 8, font: SCHRIFT },
    info: { title: `Lageblatt ${name}` },
    ...(eintraege.length > 0 && eintraege.every(({ bogen }) => bogen.uebung)
      ? { background: uebungsWasserzeichen() }
      : {}),
    footer: seitenFuss(`Lageblatt: ${name}`),
    content: uebersichtsSeite(
      `Lageblatt: ${name}`,
      eintraege,
      erstellt,
      eintraege.length === 0
        ? "Noch keine Einheit gemeldet."
        : "Summen und Bedarf zählen nur die anwesenden Einheiten dieser Lage; abgerückte stehen im eigenen Block. Nach Nr. geordnet. Alle Änderungen im Einzelnen: Sammel-PDF." +
          (eintraege.some((e) => e.zeitEingelesen) ? ` ${EINGELESEN_FUSSNOTE}` : "") +
          (lueckenZeile ? ` ${lueckenZeile}` : "") +
          " Rückrufnummer: (D) dienstlich, (P) privat, (OV) Nummer des Ortsverbands – die Einheit selbst hat keine gemeldet." +
          (rueckseite ? " Nachträge von Hand: Seite 2." : ""),
      LAGEBLATT_MAX_ZEILEN,
      true,
      nachtragZeilen,
      undefined,
      rueckseite,
    ),
  });
}

/** Was ein Messpunkt beim Setzen über seine Lage meldet (pdfmake `pageBreakBefore`). */
interface MessPosition {
  pageNumber: number;
  top: number;
  verticalRatio: number;
  pageInnerHeight: number;
}

/**
 * Lageblatt, dessen letzte Seite bis unten mit Nachtragszeilen gefüllt ist
 * (Audit Runde 3, R3-A5) und das immer mindestens fünf davon trägt (R4-A3).
 * Wie viel Platz bleibt, weiß erst der Setzer: die Höhe einer Einheitenzeile
 * hängt an Änderungen, Rückfragen und Bemerkung. Deshalb Probesätze: Der erste
 * setzt das Blatt mit der Mindestzahl und liest über pdfmakes
 * `pageBreakBefore` die Lage zweier Messpunkte ab (Ende des Inhalts, Abstand
 * zweier Nachtragszeilen); der letzte trägt so viele Zeilen, wie in den Rest
 * passen.
 *
 * Passen auf die letzte Seite keine fünf Zeilen mehr (bei sechs bis zehn
 * Einheiten mit Bedarf und Zwischensummen der Normalfall), bekommen die Zeilen
 * eine eigene letzte Seite, die Rückseite: mit Spaltenköpfen, bis unten
 * gefüllt. Vorher blieben bei acht Einheiten zwei Zeilen, und ab dem dritten
 * Nachtrag ging es auf einem Zettel weiter — drei Quellen statt einer. Bei 30
 * Einheiten schob das Mindestmaß von fünf Zeilen den Bedarf allein auf eine
 * vierte Seite. Die Rückseite wird immer mitgedruckt; Seite 1 bleibt das
 * Blatt für die Wand.
 *
 * Kostet bis zu zwei zusätzliche Sätze einer Seite ohne Bilder —
 * Sekundenbruchteile.
 *
 * `setzen` führt den Satz aus (Browser: pdfmake-Puffer, Tests: Node).
 */
export async function einsatzLageblattSeiteFuellen(
  name: string,
  eintraege: UebersichtEintrag[],
  setzen: (dd: TDocumentDefinitions) => Promise<unknown>,
  erstellt = Date.now(),
): Promise<TDocumentDefinitions> {
  const messen = async (dd: TDocumentDefinitions) => {
    const pos = new Map<string, MessPosition>();
    const seiten = new Set<number>();
    dd.pageBreakBefore = (knoten) => {
      const k = knoten as { id?: string; startPosition?: MessPosition; pageNumbers?: number[] };
      k.pageNumbers?.forEach((n) => seiten.add(n));
      if (k.id && k.startPosition) pos.set(k.id, k.startPosition);
      return false;
    };
    await setzen(dd);
    const ende = pos.get(MESS_ENDE);
    const z1 = pos.get(`${MESS_NACHTRAG}1`);
    const z2 = pos.get(`${MESS_NACHTRAG}2`);
    return {
      ende,
      zeilenHoehe: z1 && z2 && z1.pageNumber === z2.pageNumber && z2.top > z1.top ? z2.top - z1.top : 20,
      seiten: seiten.size === 0 ? 0 : Math.max(...seiten),
      /** Platz unter dem letzten Inhalt der letzten Seite. */
      rest: ende ? ende.pageInnerHeight * (1 - ende.verticalRatio) : 0,
    };
  };
  const m = await messen(einsatzLageblattDokument(name, eintraege, erstellt, NACHTRAG_ZEILEN_PROBE));
  if (!m.ende) return einsatzLageblattDokument(name, eintraege, erstellt, NACHTRAG_ZEILEN_MIN);
  // Über mehrere Seiten wiederholt die Tabelle ihre Kopfzeile; verschiebt sich
  // dabei eine Zeile über den Seitenrand, kostet das eine Zeile mehr.
  const rest = m.seiten > 1 ? m.rest - 2 * m.zeilenHoehe : m.rest;
  const passen = NACHTRAG_ZEILEN_PROBE + Math.max(0, Math.floor((rest - 2) / m.zeilenHoehe));
  if (passen >= NACHTRAG_ZEILEN_MIN) return einsatzLageblattDokument(name, eintraege, erstellt, Math.min(passen, 40));
  // Zu voll: Die Zeilen bekommen eine eigene Seite hinter dem Blatt, so viele,
  // wie draufpassen.
  const r = await messen(einsatzLageblattDokument(name, eintraege, erstellt, NACHTRAG_ZEILEN_PROBE, true));
  const zeilen = r.ende
    ? NACHTRAG_ZEILEN_PROBE + Math.max(0, Math.floor((r.rest - 2) / r.zeilenHoehe))
    : NACHTRAG_ZEILEN_MIN;
  return einsatzLageblattDokument(name, eintraege, erstellt, Math.max(NACHTRAG_ZEILEN_MIN, Math.min(zeilen, 40)), true);
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
function qrBlock(qr: QrSatz, akzent: string, stand: string, vermerk?: MeldekopfVermerk, einheit = "", gueltigBis = ""): Content {
  const kopf = (text: string): Content => ({ text, bold: true, fontSize: 13, color: akzent, alignment: "center" });
  // Jede Codeseite nennt ihre Einheit (R4-A5). Beim Einzelcode steht die Zeile
  // in der freien Spalte neben dem Bild — über dem Bild kostete sie 36 von 443
  // Beispielbögen eine zweite Seite; auf den eigenen Seiten mehrteiliger Codes
  // steht sie unter der Überschrift.
  const einheitZeile = (): Content => ({ text: einheit, bold: true, fontSize: 9, alignment: "center", margin: [0, 2, 0, 0] });
  const einheitSeitlich = (): Content => ({ text: einheit, bold: true, fontSize: 8, margin: [0, 0, 0, 8] });
  // Fett und direkt am Code: Wer den Ausdruck scannt, soll vorher aufs
  // Kästchen schauen (R2-A4). Beim Einzelcode steht er in der freien Spalte
  // links NEBEN dem Bild — unter dem Code kostete die Zeile 6 von 101
  // THW-Beispielbögen eine zweite Seite (unbreakable-Block).
  // Dazu, bis wann der Code Namen liefert: wer sein Papier frisch druckt, ohne den Bogen zu ändern, hält
  // sonst ein Blatt mit lesbaren Namen, dessen Code sie nach der Datenschutzfrist nicht mehr trägt (R11-A1).
  const stift = (): Content => ({ text: `${stiftHinweis(stand)}${gueltigBis ? ` ${gueltigBis}.` : ""}`, bold: true, fontSize: 8 });
  // Nur in der Sammel-PDF: was der Code nicht enthält, direkt beim Code
  // (R2-A1). Beim Einzelcode steht der Kasten „Stand am Meldekopf“ schon über
  // dem Formular derselben Seite, der Hinweis rechts neben dem Code. Mehrteilige
  // Codes stehen auf eigenen Seiten: dort Kasten und Hinweis neben dem unteren Code (R3-A3).
  const nurBogenHinweis = (): Content => ({ text: QR_NUR_BOGEN_HINWEIS, bold: true, fontSize: 8 });
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
                { width: "*", stack: [einheitSeitlich(), stift()], alignment: "right", margin: [0, 8, 12, 0] },
                { image: t.datenUrl, width: QR_BREITE, link: t.url },
                { width: "*", stack: [nurBogenHinweis()], margin: [12, 40, 0, 0] },
              ],
              columnGap: 0,
              margin: [0, 8, 0, 0],
            }
          : {
              columns: [
                { width: "*", stack: [einheitSeitlich(), stift()], alignment: "right", margin: [0, 8, 12, 0] },
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
      { text: `Teil ${t.teilNr} / ${anzahl}`, bold: true, alignment: "center", color: akzent },
      { image: t.datenUrl, width: QR_SEGMENT_BREITE, margin: [0, 4, 0, 0], link: qr.vollUrl },
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
  const anleitung = (): Content[] => [hinweis(), { ...(stift() as object), margin: [0, 8, 0, 0] } as Content];
  const meldekopf = (): Content[] =>
    vermerk ? [vermerkKasten(vermerk, [0, 0, 0, 0]), { ...(nurBogenHinweis() as object), margin: [0, 6, 0, 0] } as Content] : [];
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
          { width: "*", stack: anleitung(), margin: [SEITENTEXT_ABSTAND, 24, 0, 0] },
        ],
        margin: [0, 10, 0, 0],
      },
    ];
    if (rechts) {
      // … zweiter Code unten rechts (der obere Rand erzeugt den vertikalen
      // Diagonalabstand), links daneben der Stand am Meldekopf.
      stack.push({
        columns: [
          { width: "*", stack: meldekopf(), margin: [0, 24, SEITENTEXT_ABSTAND, 0] },
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
function blankoMeldekopf(): Content {
  return {
    table: {
      widths: ["*"],
      body: [[{
        stack: [
          { text: "Meldekopf:   Nr. ______   ·   eingegangen am ____________  um ____:____ Uhr   ·   Zug / Verband: ________________" },
          // „abgerückt am … um …" neben „eingegangen": Rückt die Einheit ab, während das Gerät aus ist, steht die
          // Uhrzeit auf ihrem Blatt statt nur auf dem Meldeblock (R11-A2).
          { text: `${kasten(false)} ÜBUNG (kein Einsatz)  ·  abgerückt am __________ um ____:____ Uhr  ·  ins Gerät übertragen ${kasten(false)} von ______ um ____:____ Uhr`, margin: [0, 5, 0, 0] },
          // Beiblatt (R5-A6): Der Vordruck fasst 4 Fahrzeuge und 6 Qualifikationen. Mehr gehört
          // auf einen zweiten Vordruck mit gleicher Einheit und Nr., nicht an den Rand.
          {
            text: "Blatt ____ von ____   ·   Reicht der Platz nicht (mehr als 29 Personen, 4 Fahrzeuge oder 6 Qualifikationen): weiteren Vordruck als Beiblatt nehmen, dort Einheit und Nr. eintragen und hier die Blattzahl nachtragen.",
            bold: false,
            fontSize: 7.5,
            lineHeight: 1.25,
            margin: [0, 5, 0, 0],
          },
        ],
        bold: true,
        margin: [0, 3, 0, 3],
      }]],
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
/** Höhe einer leeren Personalzeile in pt, gemessen 22,4 (8 pt Schrift, 5 pt Rand oben und unten, Innenabstand), aufgerundet. */
const LEERZEILE_HOEHE = 23;
/** Höhe eines leeren Fahrzeugblocks samt Abstand in pt, gemessen 74, aufgerundet. */
const LEERFAHRZEUG_HOEHE = 76;
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
  const farbe = orgFarbe(org);
  const typName = vokabText(b.einheit.einheitsTyp, vokabularFuer(org, "einheitstyp"), "name") || "Einheit";
  const typKurz = vokabText(b.einheit.einheitsTyp, vokabularFuer(org, "einheitstyp"));
  const s = staerke(b);
  const mwd = unterbringungMWD(b);
  const vp = verpflegung(b);
  const ansprech = b.personal[0];
  // Verdichteter Satz (Sammel-PDF, R4-A7): knappere Innenabstände und Lücken.
  const dicht = zusatz?.verdichtet === true;
  const tabLayout = dicht ? { paddingTop: () => 0.5, paddingBottom: () => 0.5 } : undefined;
  /** Abstand in pt, verdichtet halb so groß. */
  const luecke = (pt: number): number => (dicht ? Math.ceil(pt / 2) : pt);

  // Ausfülllinie statt eines errechneten Werts (nur Vordruck). Bewusst kurz:
  // vier Stärkezahlen nebeneinander müssen in eine Tabellenzelle passen, ohne
  // dass die letzte in die zweite Zeile rutscht.
  const linie = "____";
  /** Zahl im ausgefüllten Bogen, Ausfülllinie im Vordruck. */
  const zahl = (n: number) => (blanko ? linie : String(n));
  /** Leere Tabellenzeile mit Schreibhöhe — die Ränder bilden die Ausfülllinien. */
  const leerZelle = (): TableCell => ({ text: " ", margin: [0, 5, 0, 5] as [number, number, number, number] });

  const infoZeilen: TableCell[][] = [
    [
      // Mit Legende: „____ / ____ / ____ / ____" allein sagte nicht, welche
      // Linie welche Zahl ist (Audit Runde 2, R2-A6) — und „1 / 1 / 2 / 4"
      // ließ sich nach einer Stiftkorrektur nicht gegen die Namen prüfen
      // (Audit Runde 3, R3-A6). Gleiche Beschriftung auf Vordruck und Bogen.
      { text: "Stärke (F / UF / M / Ges.):", bold: true },
      {
        // Mit Code: das Kästchen „von Hand geändert“ gehört hierher, wo mit
        // dem Stift korrigiert wird, nicht auf die Codeseite (R4-A5).
        stack: [
          { text: `${zahl(s.fuehrer)} / ${zahl(s.unterfuehrer)} / ${zahl(s.mannschaft)} / ${zahl(s.gesamt)}` },
          // Zweite Zeile der Zelle: „Ansprechpartner/in:" daneben bricht ohnehin
          // auf zwei Zeilen um, das Kästchen kostet keine Höhe.
          ...(qr ? [{ text: !blanko && staerkeVonHand(b) ? STIFT_KAESTCHEN_ANGEKREUZT : STIFT_KAESTCHEN, bold: true } as Content] : []),
        ],
      },
      { text: "Ansprechpartner/in:", bold: true },
      { text: ansprech ? ansprechpersonPapier(`${ansprech.vorname} ${ansprech.nachname}`) : "" },
    ],
  ];
  for (const h of b.einheit.hierarchie) {
    infoZeilen.push([
      { text: vokabText(h.bezeichnung, vokabularFuer(org, "ebene")) || "Ebene", bold: true },
      { text: weichUmbrechen(h.kurz ? `${h.name} (${h.kurz})` : h.name) },
      { text: "Telefon:\neMail:", bold: true },
      { text: weichUmbrechen(`${h.telefon ?? "—"}\n${h.email ?? "—"}`) },
    ]);
  }
  infoZeilen.push([
    { text: "vorgesehener Einsatzzeitraum:", bold: true, colSpan: 2 },
    {},
    {
      text: blanko
        ? `${linie}______  –  ${linie}______`
        : `${datumAnzeige(b.einsatz.zeitraumVon)} – ${datumAnzeige(b.einsatz.zeitraumBis)}`,
      colSpan: 2,
    },
    {},
  ]);
  infoZeilen.push([
    { text: "vorgesehener Einsatzort / Auftrag:", bold: true, colSpan: 2 },
    {},
    { text: weichUmbrechen(b.einsatz.ortAuftrag), colSpan: 2 },
    {},
  ]);
  infoZeilen.push([
    { text: "Einsatzbeginn:", bold: true },
    { text: b.einsatz.einsatzbeginn != null ? zeitpunktDeutsch(b.einsatz.einsatzbeginn) : "" },
    { text: "Einsatzende:", bold: true },
    { text: b.einsatz.einsatzende != null ? zeitpunktDeutsch(b.einsatz.einsatzende) : "" },
  ]);

  const fahrzeugBlock = (f: Fahrzeug, leer = !!blanko): Content => ({
    ...(tabLayout ? { layout: tabLayout } : {}),
    // Ein Fahrzeug steht ganz auf einer Seite: Das taktische Zeichen läuft über zwei Zeilen,
    // und der Block riss über die Seitengrenze — „Tiefl 18 t“ nur als Bild, der Text auf
    // der nächsten Seite (R5-A3).
    unbreakable: true,
    table: {
      // Erste Spalte: taktisches Zeichen (DV 102), zeilenübergreifend links.
      widths: [56, "*", "*", "*"],
      body: [
        [
          { svg: fahrzeugSymbolSvg(f, org), width: 50, rowSpan: 2, alignment: "center", margin: [2, 6, 2, 6] as [number, number, number, number] },
          // Im Vordruck stehen hier die Feldnamen — sonst wäre die Zeile eine
          // beschriftungslose Leerzeile, in der niemand weiß, was hingehört.
          { text: leer ? "Fahrzeug:" : vokabText(f.typ, vokabularFuer(org, "fahrzeug")) || "Fahrzeug", bold: true },
          { text: leer ? "Kennzeichen:" : kennzeichenText(f), bold: true },
          // Sitzplätze nur, wenn sie am Fahrzeug erfasst sind: der Richtwert
          // des Typs steht in keiner Akte und hätte auf dem Papier den Rang
          // einer Zusage, die niemand gegeben hat.
          {
            text: leer
              ? "Funkrufname:"
              : [f.funkrufname ? `FuRn: ${funkrufText(f, b.einheit)}` : "", f.sitzplaetze != null ? `Sitzplätze: ${f.sitzplaetze}` : ""]
                  .filter(Boolean)
                  .join("\n"),
          },
        ],
        [
          {}, // von rowSpan des Zeichens belegt
          {
            colSpan: 3,
            text: leer
              ? `Ausstattung nach StAN: ja ${kasten(false)} / nein ${kasten(false)}\nÄnderungen bzw. Sondergerät:`
              : f.stanKonform == null
                ? `Änderungen bzw. Sondergerät: ${weichUmbrechen(f.aenderungen ?? "")}`
                : `Ausstattung nach StAN: ja ${kasten(f.stanKonform)} / nein ${kasten(!f.stanKonform)}\nÄnderungen bzw. Sondergerät: ${weichUmbrechen(f.aenderungen ?? "")}`,
          },
          {},
          {},
        ],
      ],
    },
    margin: [0, 0, 0, luecke(6)] as [number, number, number, number],
  });
  const fahrzeuge: Content[] = blanko
    ? Array.from({ length: blanko.fahrzeuge }, () => fahrzeugBlock(BLANKO_FAHRZEUG))
    : [
        ...b.fahrzeuge.map((f) => fahrzeugBlock(f)),
        // Ein leerer Fahrzeugblock zum Nachtragen, wenn Platz ist (R3-A6).
        ...(zusatz?.freiesFahrzeug ? [fahrzeugBlock(BLANKO_FAHRZEUG, true)] : []),
      ];

  // Spalte „Rolle" (F / UF / M): Ohne sie ließ sich eine von Hand geänderte
  // Stärke auf dem Blatt nicht gegen die Namen prüfen (Audit Runde 3, R3-A6).
  const personalZeilen: TableCell[][] = [
    [
      { text: "Funktion /\nZusatzfunktion", bold: true, fillColor: GRAU },
      { text: "Rolle\nF/UF/M", bold: true, fillColor: GRAU },
      { text: "Name, Vorname", bold: true, fillColor: GRAU },
      { text: "D = dienstlich / P = privat", bold: true, fillColor: GRAU },
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
      ? [`${org === OrganisationsTyp.THW ? "OV" : "Dienststelle"}: ${weichUmbrechen(p.dienststelle)}`]
      : [];
    const kontakte = [
      ...dienststelle,
      ...p.kontakte.map((k) => {
        // Alte Bögen konnten statt einer Adresse ein Template tragen (siehe Kontakt).
        if (k.emailTemplate != null) return `eMail: — (${k.dienstlich ? "D" : "P"})`;
        const art = k.art === KontaktArt.EMAIL ? "eMail" : k.art === KontaktArt.MOBIL ? "Mobil" : "Telefon";
        return `${art}: ${weichUmbrechen(k.wert ?? "")} (${k.dienstlich ? "D" : "P"})`;
      }),
    ].join("\n");
    personalZeilen.push([
      { text: funktionsText(p, org) },
      { text: ROLLE_KURZ[p.staerkeRolle] ?? "", alignment: "center" },
      { text: namePapier(p.nachname, p.vorname) },
      { text: kontakte },
    ]);
  }
  // Freie Zeilen für Nachrückende: Wer auf dem Ausdruck nachträgt und „von
  // Hand geändert" ankreuzt, schrieb sonst an den Rand (R3-A6). Nur bei
  // vollständig erfasstem Personal — „nur Stärke" hat keine Namensliste.
  // Wie viele, entscheidet einzelPdfDokument nach einer Messung.
  if (!blanko && b.personalErfassung !== PersonalErfassung.NUR_STAERKE) {
    for (let i = 0; i < (zusatz?.freiePersonalZeilen ?? 0); i++) personalZeilen.push([leerZelle(), leerZelle(), leerZelle(), leerZelle()]);
  }

  const qualiZeilen: TableCell[][] = [
    [
      { text: "Name, Vorname", bold: true, fillColor: GRAU },
      { text: "Qualifikation", bold: true, fillColor: GRAU },
    ],
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
      if (berufe.length > 0) teile.push(BERUF_PRAEFIX + berufe.map(berufText).join(", "));
      qualiZeilen.push([{ text: namePapier(p.nachname, p.vorname) }, { text: weichUmbrechen(teile.join(", ")) }]);
    }
  }
  if (qualiZeilen.length === 1) qualiZeilen.push([{ text: " " }, { text: " " }]);

  const sofort: Content[] = [];
  if (b.sofortbedarf) {
    const sb = b.sofortbedarf;
    // Auf dem Vordruck Luft zwischen den Zeilen: Die Kästchen berührten sich, „[ ] Betriebsstoff“
    // war angeschnitten und die Ausfülllinie „____ vegan“ lief in die nächste Zeile (R5-A7).
    const zeile = (text: string): Content => ({ text, ...(blanko ? { margin: [0, 3, 0, 3] as [number, number, number, number] } : {}) });
    sofort.push({
      ...(tabLayout ? { layout: tabLayout } : {}),
      table: {
        widths: ["*", "*"],
        // Der Kasten bleibt ganz: In der Sammel-PDF stand die letzte Zeile
        // („M 11 / W 1 / D 0“) allein auf einer Seite, die Beschriftung davor (R4-A7).
        dontBreakRows: true,
        body: [
          [
            {
              stack: [
                { text: "Sofortbedarf:", bold: true, decoration: "underline" },
                zeile(`${kasten(sb.verpflegungPersonen > 0)} Verpflegung für ${zahl(sb.verpflegungPersonen)} Personen, davon ${zahl(vp.vegetarisch)} vegetarisch, ${zahl(vp.vegan)} vegan`),
                zeile(`${kasten(sb.dieselLiter + sb.benzinLiter + sb.gemischLiter > 0)} Betriebsstoff: ${zahl(sb.dieselLiter)} l Diesel / ${zahl(sb.benzinLiter)} l Benzin / ${zahl(sb.gemischLiter)} l Gemisch`),
              ],
            },
            {
              stack: [
                zeile(`${kasten(sb.unterbringung)}  Unterbringung`),
                zeile(`${kasten(sb.ruhezeitErforderlich)}  Ruhezeit erforderlich`),
                zeile(`Anzahl Unterbringung/WC/Dusche:\nM ${zahl(mwd.m)} / W ${zahl(mwd.w)} / D ${zahl(mwd.d)}`),
              ],
            },
          ],
        ],
      },
      margin: [0, luecke(8), 0, 0] as [number, number, number, number],
    });
  }

  return winAnsiDokument({
    pageSize: "A4",
    pageMargins: SEITENRAENDER,
    defaultStyle: { fontSize: 8, font: SCHRIFT },
    // Titel mit Einheit und Stand: Ein im Tab angezeigter Bogen hat keinen Dateinamen, der Titel unterscheidet ihn in Tab und Ablage (R16-A3).
    info: { title: blanko ? `Erfassungsbogen ${typKurz || typName}` : `Erfassungsbogen ${einheitAnzeigename(b.einheit)}, Stand ${zeitpunktDeutsch(b.stand)}` },
    ...(b.uebung ? { background: uebungsWasserzeichen() } : {}),
    // Maschinenlesbares JSON dokumentweit einbetten (ZUGFeRD-artig). Am
    // Vordruck hinge dort ein leerer Bogen — ein Anhang ohne jede Aussage.
    ...(blanko ? {} : { files: { [EEB_JSON_DATEINAME]: bogenAlsEingebetteteDatei(b) } }),
    // Kopfzeile im Seitenrand: Seite 1 der Platz für „Nr., eingegangen, übertragen“, jede
    // Folgeseite Nr. und Einheit (R5-A2, R5-A3). Die Sammel-PDF nimmt nur den Inhalt
    // dieses Dokuments und setzt ihre eigene Kopfzeile mit der Nr. des Meldekopfs.
    header: blanko
      ? (seite) => (seite > 1 ? randZeile("Einheit: ______________________________   ·   Nr. ______   ·   Blatt ____ von ____", false) : { text: "" })
      : (seite, gesamt) => bogenKopfzeile(einheitAnzeigename(b.einheit), undefined, seite, gesamt),
    footer: (seite, gesamt) => ({
      columns: [
        { text: blanko ? "Stand:" : `Stand: ${zeitgruppe(b.stand)}`, margin: [40, 0, 0, 0] },
        { text: `${seite} / ${gesamt}`, alignment: "right", margin: [0, 0, 40, 0] },
      ],
      fontSize: 8,
    }),
    content: [
      // Störer VOR dem Kopf: das Wasserzeichen allein kann beim Kopieren oder
      // blassen Druck untergehen, die Textzeile nicht.
      ...(b.uebung ? [uebungsStoerer()] : []),
      // ---- Meldekopf-Kasten (nur Vordruck) ----
      ...(blanko ? [blankoMeldekopf()] : []),
      // ---- Kopf ----
      {
        ...(tabLayout ? { layout: tabLayout } : {}),
        table: {
          // Kopf zweispaltig: Titel im Kasten in der Kennfarbe der Organisation,
          // rechts die Einheit von
          // oben nach unten — Organisation, Organisationsname, Einheitstyp.
          widths: ["*", 150],
          body: [
            [
              {
                // Der Vordruck gehört keiner Organisation — der Einheitstyp
                // wird erst beim Ausfüllen bekannt.
                text: blanko ? "Erfassungsbogen" : `Erfassungsbogen ${typName}`,
                color: farbe.schrift,
                fillColor: farbe.balken,
                bold: true,
                fontSize: 12,
                margin: [6, 8, 6, 8],
              },
              {
                text: blanko
                  ? "Organisation:\nEinheit:"
                  : weichUmbrechen([orgLabel(org), b.einheit.organisationName, typKurz].filter(Boolean).join("\n")),
                bold: true,
                color: farbe.akzent,
                margin: [2, 8, 2, 8],
              },
            ],
          ],
        },
        margin: [0, 0, 0, luecke(8)],
      },
      { ...(tabLayout ? { layout: tabLayout } : {}), table: { widths: [110, "*", 70, "*"], body: infoZeilen }, margin: [0, 0, 0, luecke(10)] },
      ...fahrzeuge,

      // ---- Personal ----
      // Kein fester Seitenumbruch: kleine Einheiten passen so auf eine Seite,
      // größere lässt pdfmake bei Bedarf selbst umbrechen.
      {
        ...(tabLayout ? { layout: tabLayout } : {}),
        // Zeilen bleiben ganz: Auf Seite 1 des Vordrucks stand die letzte
        // Personalzeile nur als 3-mm-Streifen über der Fußzeile (R4-A8). Der
        // Vordruck wiederholt den Tabellenkopf auf Seite 2.
        table: { widths: [118, 30, "*", 160], body: personalZeilen, dontBreakRows: true, ...(blanko ? { headerRows: 1 } : {}) },
        margin: [0, luecke(12), 0, luecke(10)],
      },
      ...(!blanko && bogenAnonymisiert(b) ? [{ text: ANONYM_PERSONAL_SATZ, bold: true, margin: [0, 0, 0, 6] } as Content] : []),
      ...(b.personalErfassung === PersonalErfassung.NUR_STAERKE
        ? [{ text: nurSollstaerke(b) ? "Personal am Meldekopf nur in Stärke erfasst. Die Zahl ist die Sollstärke der Vorbelegung, nicht gezählt." : "Personal am Meldekopf nur in Stärke erfasst.", italics: true, margin: [0, 0, 0, 6] } as Content]
        : []),
      { text: "weitere interne / externe Qualifikationen obiger Helfer/-innen:", margin: [0, 0, 0, 4] },
      { ...(tabLayout ? { layout: tabLayout } : {}), table: { widths: [180, "*"], body: qualiZeilen } },
      ...sofort,
      // Vordruck: Platz für drei Zeilen Handschrift statt einer Zeile (R5-A7).
      ...(blanko
        ? [
            {
              unbreakable: true,
              stack: [
                { text: "Sonstiges:", margin: [0, 8, 0, 3] },
                { table: { widths: ["*"], body: [[leerZelle()], [leerZelle()], [leerZelle()]] } },
              ],
            } as Content,
          ]
        : b.sonstiges || staerkeVonHand(b)
          ? [{ text: `Sonstiges: ${[b.sonstiges ? weichUmbrechen(b.sonstiges) : "", staerkeVonHand(b) ? staerkeVonHandSatz(b) : ""].filter(Boolean).join(" ")}`, margin: [0, 8, 0, 0] } as Content]
          : []),
      ...(zusatz?.messpunkt ? [{ text: " ", fontSize: 1, id: `${MESS_BOGEN_ENDE}-formular${zusatz.messKennung ?? ""}` } as Content] : []),

      // ---- QR-Block ----
      // Kein fester Seitenumbruch mehr; als unbreakable-Gruppe zusammengehalten,
      // damit der QR-Code nicht über eine Seitengrenze zerrissen wird. Passt der
      // Block nicht mehr, rückt er als Ganzes auf die nächste Seite.
      ...(qr ? [qrBlock(qr, farbe.akzent, zeitgruppe(b.stand), vermerk, codeKopfzeile(b, zeitgruppe(b.stand), vermerk?.nummer), codeGueltigBisText(b, (z) => zeitpunktDeutsch(z).split(",")[0] ?? "", bogenAnonymisiert(b)))] : []),
      ...(zusatz?.messpunkt ? [{ text: " ", fontSize: 1, id: `${MESS_BOGEN_ENDE}-qr${zusatz.messKennung ?? ""}` } as Content] : []),
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
  if (b.personalErfassung === PersonalErfassung.NUR_STAERKE) return pdfDokument(b, qr);
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
  const einzelcodeDahinter = qr != null && qr.teile.length === 1 && formular.pageNumber === ende.pageNumber;
  const frei = (einzelcodeDahinter ? rest(ende) : rest(formular)) - 4;
  const zeilen = frei >= PERSONAL_NACHTRAG_ZEILEN * LEERZEILE_HOEHE ? PERSONAL_NACHTRAG_ZEILEN : 0;
  const fahrzeug = zeilen > 0 && frei >= zeilen * LEERZEILE_HOEHE + LEERFAHRZEUG_HOEHE;
  return pdfDokument(b, qr, undefined, undefined, { freiePersonalZeilen: zeilen, freiesFahrzeug: fahrzeug });
}
