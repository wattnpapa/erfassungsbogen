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
  orgLabel,
  vokabText,
  vokabularFuer,
  zeitgruppe,
  pruefpunkte,
  type QrSatz,
  zeitpunktDeutsch,
} from "./hilfen";
import { mwdText, summiereBoegen, unterbringungAngefordertText, type EinsatzSummen } from "./auswertung";
import { zeitLang } from "./eintrag-zeiten";
import { bedarfKurztext } from "./einheiten-tabelle";
import { bogenDiff, diffZeilen } from "@bos/meldekopf/meldung-diff";
import { fahrzeugSymbolSvg } from "./taktische-zeichen-bogen";
import { orgFarbe } from "./org-farben";
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
}

/** Ein Bogen der Sammel-PDF samt QR — die Übersichtsangaben plus der Code für die Bogenseiten. */
export interface SammelBogen extends UebersichtEintrag {
  qr: QrSatz;
}

/** Zählt der Eintrag in die Summen? Abgerückte nie, Übungen nur in Übungssammlungen (zaehlt=false). */
function zaehlend(e: UebersichtEintrag): boolean {
  return !e.abgerueckt && e.zaehlt !== false;
}

/** Nur die Bögen, die in Summen und Bedarf gehören. */
function zaehlendeBoegen(eintraege: UebersichtEintrag[]): Erfassungsbogen[] {
  return eintraege.filter(zaehlend).map((e) => e.bogen);
}

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
 * Wie erreiche ich die Einheit ohne Gerät? Funkrufname des ersten Fahrzeugs
 * mit Funkrufnamen und die Rückrufnummer der Führungskraft (sonst die des
 * Ortsverbands) — auf dem Einzelbogen stehen sie, auf dem Lageblatt fehlten
 * sie (Audit Runde 2, R2-A3).
 */
export function erreichbarkeitZeilen(b: Erfassungsbogen): string[] {
  const zeilen: string[] = [];
  const fzg = b.fahrzeuge.find((f) => f.funkrufname);
  const furn = fzg ? funkrufText(fzg, b.einheit) : "";
  if (furn) zeilen.push(furn);
  // Knapp, damit die Zeile in die Spalte passt: „5556968346 (S. Lang)".
  const p = ansprechpartner(b.personal);
  const tel = p?.kontakte.find((k) => k.art !== KontaktArt.EMAIL && k.wert);
  if (p && tel) {
    const name = [p.vorname ? `${p.vorname.charAt(0)}.` : "", p.nachname].filter(Boolean).join(" ");
    zeilen.push(name ? `${tel.wert} (${name})` : `${tel.wert}`);
  } else if (b.einheit.hierarchie[0]?.telefon) {
    zeilen.push(`${b.einheit.hierarchie[0].telefon} (OV)`);
  }
  return zeilen;
}

/**
 * Leere Zeilen unter den Einheiten des Lageblatts — zum Weiterschreiben bei
 * Geräteausfall (R2-A3). Wenige Einheiten lassen Platz für mehr; bei rund
 * zehn bleiben zwei, damit das Blatt eine Seite bleibt (R2-K3).
 */
function freieZeilen(anwesend: number): number {
  return Math.min(6, Math.max(2, 10 - anwesend));
}

/** So viele Zeichen der Bemerkung stehen auf dem Lageblatt, der Rest in der Sammel-PDF. */
const BEMERKUNG_LAGEBLATT = 110;

/** Zelle „Auftrag / Notiz (Bemerkung der Einheit)": Auftrag oben, Bemerkung kursiv darunter (R3-K3). */
function bemerkungZelle(notiz: string | undefined, sonstiges: string | undefined, kuerzen?: number): TableCell {
  const teile: Content[] = [];
  if (notiz?.trim()) teile.push({ text: weichUmbrechen(notiz.trim()) });
  let b = sonstiges?.trim() ?? "";
  if (kuerzen != null && b.length > kuerzen) b = `${b.slice(0, kuerzen).trimEnd()} …`;
  if (b) teile.push({ text: weichUmbrechen(`(${b})`), italics: true });
  if (teile.length === 0) return { text: "" };
  return teile.length === 1 ? (teile[0] as TableCell) : { stack: teile };
}

function uebersichtsTabelle(
  eintraege: UebersichtEintrag[],
  maxZeilen = UEBERSICHT_MAX_ZEILEN,
  /** Lageblatt: Erreichbarkeit je Einheit und freie Zeilen zum Nachtragen (R2-A3). */
  zumWeiterfuehren = false,
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
      kopf("Stand"),
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
  const zeile = (e: UebersichtEintrag): TableCell[] => {
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
                ...diffZeilen(d, maxZeilen).map((z) => ({ text: aenderungFuerPapier(z) })),
              ],
            };
    }
    // Name, darunter bei Bedarf die Kennzeichnung eines abgeteilten Truppteils
    // und der Übungs-Störer — beides muss in der Übersicht stehen, sonst sind
    // zwei Zeilen derselben Einheit nicht auseinanderzuhalten.
    // Laufende Nummer vorn, wie an der Karte: „Meldung 3" über Funk statt
    // des vollen Einheitsnamens (Audit Runde 2, R2-A6).
    const namensZeilen: Content[] = [
      e.nummer != null
        ? { text: [{ text: `Nr. ${e.nummer}  `, bold: true }, { text: einheitAnzeigename(b.einheit) }] }
        : { text: einheitAnzeigename(b.einheit) },
    ];
    if (teil) namensZeilen.push({ text: teil, italics: true });
    if (b.uebung) namensZeilen.push({ text: "ÜBUNG", bold: true, color: UEBUNG_FARBE });
    if (!e.abgerueckt && e.zaehlt === false) namensZeilen.push({ text: "zählt nicht in diese Lage", italics: true });
    // Lücken der Meldung als Zahl — am Gerät eine Marke an der Karte (R2-K3).
    const luecken = pruefpunkte(b).length;
    if (luecken > 0) namensZeilen.push({ text: `${luecken} ${luecken === 1 ? "Lücke" : "Lücken"} (Meldung)`, italics: true });
    return [
      namensZeilen.length === 1 ? namensZeilen[0]! : { stack: namensZeilen },
      { text: weichUmbrechen(e.zugEtikett ?? "") },
      ...(zumWeiterfuehren ? [{ stack: erreichbarkeitZeilen(b).map((text) => ({ text: weichUmbrechen(text) })) }] : []),
      {
        stack: [
          { text: blattZeit(e.eingetroffenAm) },
          ...(e.abgerueckAm != null ? [{ text: `ab ${blattZeit(e.abgerueckAm)}`, bold: true }] : []),
        ],
      },
      { text: zeitpunktDeutsch(b.stand) },
      { text: `${s.fuehrer} / ${s.unterfuehrer} / ${s.mannschaft} / ${s.gesamt}` },
      { text: `${b.fahrzeuge.length}` },
      { text: bedarfKurztext(b), bold: true },
      bemerkungZelle(e.notiz, b.sonstiges, maxZeilen === LAGEBLATT_MAX_ZEILEN ? BEMERKUNG_LAGEBLATT : undefined),
      aenderung,
    ];
  };
  const anwesend = eintraege.filter((e) => !e.abgerueckt);
  const abgerueckt = eintraege.filter((e) => e.abgerueckt);
  for (const e of anwesend) body.push(zeile(e));
  if (zumWeiterfuehren) {
    // Fällt das Gerät aus, geht es auf diesem Blatt weiter statt auf einem
    // neuen Zettel — sonst gibt es später drei Quellen (R2-A3).
    const kopfzeile: TableCell[] = [
      { text: "Nachtrag von Hand (Einheit, Zug, Uhrzeit, Stärke …)", italics: true, colSpan: SPALTEN },
    ];
    for (let i = 1; i < SPALTEN; i++) kopfzeile.push({});
    body.push(kopfzeile);
    for (let n = 0; n < freieZeilen(anwesend.length); n++) {
      body.push(Array.from({ length: SPALTEN }, (): TableCell => ({ text: " ", margin: [0, 5, 0, 5] })));
    }
  }
  if (abgerueckt.length > 0) {
    // Ein Zwischenkopf statt einer Fußnote: „war da und ist wieder weg" muss
    // auf dem Papier so sichtbar sein wie in der Datei.
    const trenner: TableCell[] = [{ text: `Abgerückt (${abgerueckt.length})`, bold: true, fillColor: GRAU, colSpan: SPALTEN }];
    for (let i = 1; i < SPALTEN; i++) trenner.push({});
    body.push(trenner);
    for (const e of abgerueckt) body.push(zeile(e));
  }
  const summe = summiereBoegen(zaehlendeBoegen(eintraege));
  const uebungen = anwesend.filter((e) => e.zaehlt === false).length;
  const beschriftung = [`${summe.einheiten} zählend`];
  if (uebungen > 0) beschriftung.push(`${uebungen} Übung`);
  if (abgerueckt.length > 0) beschriftung.push(`${abgerueckt.length} abgerückt`);
  body.push([
    { text: `Summe (${beschriftung.join(" · ")})`, bold: true },
    { text: "" },
    ...(zumWeiterfuehren ? [{ text: "" }] : []),
    { text: "" },
    { text: "" },
    { text: `${summe.staerke.fuehrer} / ${summe.staerke.unterfuehrer} / ${summe.staerke.mannschaft} / ${summe.staerke.gesamt}`, bold: true },
    { text: `${summe.fahrzeuge}`, bold: true },
    { text: "" },
    { text: "" },
    { text: "" },
  ]);
  // Breiten für die quer liegende Übersichtsseite (714 pt Satzbreite): Zeiten
  // brechen nach dem Datum um, damit Zug und Bedarf daneben Platz haben.
  return {
    table: {
      headerRows: 1,
      widths: zumWeiterfuehren
        ? [104, 34, 96, 46, 46, 52, 14, 62, 70, "*"]
        : [118, 38, 48, 48, 48, 16, 66, 88, "*"],
      body,
    },
    fontSize: 7.5,
    // Knappe Innenabstände: bei zehn Einheiten entscheidet das über Seite 2.
    layout: { paddingTop: () => 1, paddingBottom: () => 1, paddingLeft: () => 3, paddingRight: () => 3 },
    margin: [0, 0, 0, 4],
  };
}

/** „Diesel 120 l · Benzin 30 l" — Gemisch nur, wenn gemeldet (wie in der Oberfläche). */
function kraftstoffText(k: EinsatzSummen["kraftstoff"]): string {
  const teile = [`Diesel ${k.dieselLiter} l`, `Benzin ${k.benzinLiter} l`];
  if (k.gemischLiter > 0) teile.push(`Gemisch ${k.gemischLiter} l`);
  return teile.join(" · ");
}

/**
 * Bedarfs-Übersicht des ganzen Einsatzes: Verpflegung, Unterbringung,
 * Kraftstoff und Ruhezeit über die zählenden Bögen der Sammlung — dieselben
 * Zahlen, die der Meldekopf auf dem Bildschirm sieht (gemeinsame Summierung in
 * auswertung.ts). Ohne sie zeigte die gedruckte Sammlung nur die Stärke.
 */
function bedarfsTabelle(eintraege: UebersichtEintrag[]): Content {
  const s = summiereBoegen(zaehlendeBoegen(eintraege));
  const body: TableCell[][] = [
    [
      { text: "Verpflegung:", bold: true },
      {
        text:
          `${s.verpflegung.gesamt} Portionen ` +
          `(${s.verpflegung.fleisch} Fleisch / ${s.verpflegung.vegetarisch} vegetarisch / ${s.verpflegung.vegan} vegan)`,
      },
    ],
    // Quartier und WC/Dusche getrennt: die M/W/D-Zahl zählt alle Anwesenden,
    // angefordert haben nur einige Einheiten (Audit Runde 3, R3-K4).
    [
      { text: "Unterbringung angefordert:", bold: true },
      { text: unterbringungAngefordertText(s) || "keine" },
    ],
    [
      { text: "WC/Dusche (alle Anwesenden):", bold: true },
      { text: mwdText({ ...s.unterbringung, ohneAngabe: s.unterbringungOhneAngabe }) },
    ],
    [{ text: "Betriebsstoff:", bold: true }, { text: kraftstoffText(s.kraftstoff) }],
    [
      { text: "Fahrzeuge / Ruhezeit:", bold: true },
      { text: `${s.fahrzeuge} Fahrzeuge · Ruhezeit erforderlich bei ${s.ruhezeitErforderlich} Einheit(en)` },
    ],
  ];
  return {
    stack: [
      { text: `Bedarf gesamt (${s.einheiten} Einheiten, ${s.staerke.gesamt} Personen)`, bold: true, margin: [0, 6, 0, 4] },
      { table: { headerRows: 0, widths: [84, "*"], body }, margin: [0, 0, 0, 4] },
    ],
    unbreakable: true,
  };
}

/**
 * Zwischensummen je Zug/Verband — nur sinnvoll, wenn die Sammlung überhaupt
 * mehr als eine Gruppe kennt (sonst wiederholt die Tabelle nur den Gesamtwert).
 * Nur zählende Einheiten, wie am Gerät (aggregiereNachZug).
 */
function zugSummenTabelle(eintraege: UebersichtEintrag[]): Content | undefined {
  const nach = new Map<string, Erfassungsbogen[]>();
  for (const e of eintraege.filter(zaehlend)) {
    const k = e.zugEtikett ?? "";
    (nach.get(k) ?? nach.set(k, []).get(k)!).push(e.bogen);
  }
  if (nach.size < 2) return undefined;
  const kopf = (text: string): TableCell => ({ text, bold: true, fillColor: GRAU });
  const body: TableCell[][] = [
    // „Unterbr. angef." = Personen der Einheiten mit angeforderter
    // Unterbringung; „M / W / D (alle)" zählt alle Anwesenden (R3-K4).
    [kopf("Zug / Verband"), kopf("Einh."), kopf("Stärke\nF / U / M / G"), kopf("Verpfl."), kopf("Unterbr.\nangef."), kopf("M / W / D\n(alle)"), kopf("Betriebsstoff"), kopf("Fzg")],
  ];
  const gruppen = [...nach.entries()].sort(([a], [b]) => {
    if (a === "") return 1; // „ohne Etikett" ans Ende — wie in der Oberfläche
    if (b === "") return -1;
    return a.localeCompare(b, "de");
  });
  for (const [etikett, gruppe] of gruppen) {
    const s = summiereBoegen(gruppe);
    body.push([
      { text: etikett || "Ohne Zug" },
      { text: `${s.einheiten}` },
      { text: `${s.staerke.fuehrer} / ${s.staerke.unterfuehrer} / ${s.staerke.mannschaft} / ${s.staerke.gesamt}` },
      { text: `${s.verpflegung.gesamt}` },
      { text: `${s.unterbringungAngefordert.personen}` },
      { text: `${s.unterbringung.m} / ${s.unterbringung.w} / ${s.unterbringung.d}` },
      { text: kraftstoffText(s.kraftstoff) },
      { text: `${s.fahrzeuge}` },
    ]);
  }
  return {
    stack: [
      { text: "Zwischensummen nach Zug", bold: true, margin: [0, 6, 0, 4] },
      { table: { headerRows: 1, widths: [84, 22, 52, 28, 32, 44, "*", 18], body }, margin: [0, 0, 0, 4] },
    ],
    unbreakable: true,
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
): Content[] {
  const zugSummen = zugSummenTabelle(eintraege);
  const bedarf = bedarfsTabelle(eintraege);
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
    uebersichtsTabelle(eintraege, maxZeilen, zumWeiterfuehren),
    ...(hinweis ? [{ text: hinweis, italics: true, margin: [0, 2, 0, 0] } as Content] : []),
    // Bedarf und Zwischensummen nebeneinander statt untereinander: vorher
    // rutschten die Zwischensummen allein auf Seite 2 (R2-K3).
    zugSummen
      ? { columns: [{ width: 330, stack: [bedarf] }, { width: "*", stack: [zugSummen] }], columnGap: 12, fontSize: 7.5 }
      : bedarf,
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
  return `[  ] von Hand geändert — dann gilt der Code (Stand ${stand}) nicht mehr: abtippen oder neu erzeugen, nicht scannen.`;
}

export function meldekopfVermerk(e: UebersichtEintrag, name: string, erstellt: number): MeldekopfVermerk {
  const teile = [`Eingetroffen ${e.eingetroffenAm == null ? "(nicht festgehalten)" : zeitLang(e.eingetroffenAm)}`];
  if (e.abgerueckt) {
    teile.push(e.abgerueckAm == null ? "ABGERÜCKT (nicht mehr vor Ort)" : `ABGERÜCKT ${zeitLang(e.abgerueckAm)}`);
  } else {
    teile.push(e.zaehlt === false ? "anwesend, zählt nicht in diese Lage" : "anwesend");
  }
  teile.push(`Zug: ${e.zugEtikett || "–"}`);
  if (e.teil) teile.push(`Teil: ${e.teil}`);
  teile.push(`Auftrag / Notiz: ${e.notiz || "–"}`);
  return {
    stand: `Stand am Meldekopf (${name}, erstellt ${zeitLang(erstellt)}): ${teile.join(" · ")}`,
    abgerueckt: !!e.abgerueckt,
  };
}

/** Kasten „Stand am Meldekopf" — oben auf dem Bogen und auf jeder QR-Seite. */
function vermerkKasten(v: MeldekopfVermerk, margin: [number, number, number, number]): Content {
  return {
    table: {
      widths: ["*"],
      body: [[{ text: weichUmbrechen(v.stand), bold: true, fontSize: 8, fillColor: v.abgerueckt ? GRAU : undefined }]],
    },
    margin,
  };
}

/** Fußzeile mit Seitenzahl — für Sammel-PDF und Lageblatt gleich. */
function seitenFuss(text: string): TDocumentDefinitions["footer"] {
  return (seite, gesamt) => ({
    columns: [
      { text, margin: [40, 0, 0, 0] },
      // Seitenzahl nur so breit wie nötig — der Text links darf lang sein.
      { text: `${seite} / ${gesamt}`, width: "auto", noWrap: true, alignment: "right", margin: [8, 0, 40, 0] },
    ],
    fontSize: 8,
  });
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
  boegenMitQr: SammelBogen[],
  /** Optional: kompletter Einsatz-Umschlag (einsatzDateiInhalt) für die Schichtübergabe. */
  sammlungJson?: string,
  erstellt = Date.now(),
): TDocumentDefinitions {
  const content: Content[] = uebersichtsSeite(
    `Übergabe-Übersicht: ${name}`,
    boegenMitQr,
    erstellt,
    "Die Änderungsspalte vergleicht jede Meldung mit der vorherigen Meldung derselben Einheit. Die vollständigen Bögen folgen.",
  );
  boegenMitQr.forEach((eintrag) => {
    // Zurück ins Hochformat: der Bogen selbst bleibt exakt der Papiervordruck.
    // pdfmake übernimmt die Ausrichtung des Knotens, der den Umbruch auslöst.
    content.push({ text: "", pageBreak: "before", pageOrientation: "portrait" });
    // Der Stand am Meldekopf steht über dem Bogen und auf jeder QR-Seite —
    // die Bogenseiten müssen auch ohne Seite 1 stimmen (R2-A1).
    const vermerk = meldekopfVermerk(eintrag, name, erstellt);
    content.push(vermerkKasten(vermerk, [0, 0, 0, 4]));
    content.push(...(pdfDokument(eintrag.bogen, eintrag.qr, undefined, vermerk).content as Content[]));
  });
  return {
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
    files: {
      [EEB_EINSATZ_DATEINAME]: boegenAlsEingebetteteDatei(boegenMitQr.map((x) => x.bogen)),
      ...(sammlungJson ? { [EEB_EINSATZ_SAMMLUNG_DATEINAME]: sammlungAlsEingebetteteDatei(sammlungJson) } : {}),
    },
    // Die Fußzeile trägt den Stand des Ausdrucks auf jeder Seite; Zeiten und
    // Abrückvermerk je Einheit stehen im Kasten über dem Bogen (R2-A1).
    footer: seitenFuss(`Einsatz-Sammlung: ${name} · Stand ${zeitLang(erstellt)} · Eintreff-/Abrückzeiten: Seite 1 und Kasten über jedem Bogen`),
    content,
  };
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
  eintraege: UebersichtEintrag[],
  erstellt = Date.now(),
): TDocumentDefinitions {
  return {
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
        : "Summen und Bedarf zählen nur die anwesenden Einheiten dieser Lage; abgerückte stehen im eigenen Block. Alle Änderungen im Einzelnen: Sammel-PDF.",
      LAGEBLATT_MAX_ZEILEN,
      true,
    ),
  };
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
function qrBlock(qr: QrSatz, akzent: string, stand: string, vermerk?: MeldekopfVermerk): Content {
  const kopf = (text: string): Content => ({ text, bold: true, fontSize: 13, color: akzent, alignment: "center" });
  // Fett und direkt am Code: Wer den Ausdruck scannt, soll vorher aufs
  // Kästchen schauen (R2-A4). Beim Einzelcode steht er in der freien Spalte
  // links NEBEN dem Bild — unter dem Code kostete die Zeile 6 von 101
  // THW-Beispielbögen eine zweite Seite (unbreakable-Block).
  const stift = (): Content => ({ text: stiftHinweis(stand), bold: true, fontSize: 8 });
  // Nur in der Sammel-PDF: was der Code nicht enthält, direkt beim Code
  // (R2-A1). Beim Einzelcode steht der Kasten „Stand am Meldekopf“ schon über
  // dem Formular derselben Seite, der Hinweis rechts neben dem Code. Mehrteilige
  // Codes stehen auf eigenen Seiten: dort Kasten und Hinweis unter den Codes.
  const nurBogenHinweis = (): Content => ({ text: QR_NUR_BOGEN_HINWEIS, bold: true, fontSize: 8 });
  const vermerkTeile = (): Content[] =>
    vermerk
      ? [vermerkKasten(vermerk, [0, 8, 0, 0]), { ...(nurBogenHinweis() as object), alignment: "center", margin: [0, 6, 0, 0] } as Content]
      : [];
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
                { width: "*", stack: [stift()], alignment: "right", margin: [0, 40, 12, 0] },
                { image: t.datenUrl, width: QR_BREITE, link: t.url },
                { width: "*", stack: [nurBogenHinweis()], margin: [12, 40, 0, 0] },
              ],
              columnGap: 0,
              margin: [0, 8, 0, 0],
            }
          : {
              columns: [
                { width: "*", stack: [stift()], alignment: "right", margin: [0, 40, 12, 0] },
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
      `Alle ${anzahl} Teile nacheinander mit der Kamera scannen — die App setzt den Bogen zusammen.\n` +
      `Beim Live-Scan jeweils nur einen Code ins Kamerabild nehmen. Fotos ganzer Seiten liest „Bögen einlesen…“\n` +
      `mit allen Codes; fehlende Teile dürfen auch in einem späteren Foto kommen.\n` +
      `In der digitalen PDF geht es auch ohne Scannen: der Link oben öffnet den vollständigen Bogen.`,
    alignment: "center",
    fontSize: 8,
    margin: [0, 6, 0, 0],
  });
  const seiten: Content[] = [];
  for (let i = 0; i < qr.teile.length; i += 2) {
    const links = qr.teile[i]!;
    const rechts = qr.teile[i + 1];
    const stack: Content[] = [
      kopf(`Digitaler Bogen als QR-Code (${anzahl} Teile)`),
      // Erster Code oben links …
      { columns: [{ width: "auto", stack: [teilZelle(links)] }], margin: [0, 10, 0, 0] },
    ];
    if (rechts) {
      // … zweiter Code unten rechts (Leerspalte schiebt ihn an den Rand,
      // der obere Rand erzeugt den vertikalen Diagonalabstand).
      stack.push({
        columns: [{ width: "*", text: "" }, { width: "auto", stack: [teilZelle(rechts)] }],
        margin: [0, 150, 0, 0],
      });
    }
    stack.push(oeffnenLink(), hinweis(), { ...(stift() as object), alignment: "center", margin: [0, 6, 0, 0] } as Content, ...vermerkTeile());
    seiten.push({ stack, pageBreak: "before" });
  }
  return { stack: seiten };
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
): TDocumentDefinitions {
  const org = b.einheit.organisation;
  const farbe = orgFarbe(org);
  const typName = vokabText(b.einheit.einheitsTyp, vokabularFuer(org, "einheitstyp"), "name") || "Einheit";
  const typKurz = vokabText(b.einheit.einheitsTyp, vokabularFuer(org, "einheitstyp"));
  const s = staerke(b);
  const mwd = unterbringungMWD(b);
  const vp = verpflegung(b);
  const ansprech = b.personal[0];

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
      // Im Vordruck mit Legende: „____ / ____ / ____ / ____" allein sagte
      // nicht, welche Linie welche Zahl ist (Audit Runde 2, R2-A6).
      { text: blanko ? "Stärke (F / UF / M / Ges.):" : "Stärke:", bold: true },
      { text: `${zahl(s.fuehrer)} / ${zahl(s.unterfuehrer)} / ${zahl(s.mannschaft)} / ${zahl(s.gesamt)}` },
      { text: "Ansprechpartner/in:", bold: true },
      { text: ansprech ? `${ansprech.vorname} ${ansprech.nachname}` : "" },
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
        : `${datumDeutsch(datumZuIso(b.einsatz.zeitraumVon))} – ${datumDeutsch(datumZuIso(b.einsatz.zeitraumBis))}`,
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

  const fahrzeugBlock = (f: Fahrzeug): Content => ({
    table: {
      // Erste Spalte: taktisches Zeichen (DV 102), zeilenübergreifend links.
      widths: [56, "*", "*", "*"],
      body: [
        [
          { svg: fahrzeugSymbolSvg(f, org), width: 50, rowSpan: 2, alignment: "center", margin: [2, 6, 2, 6] as [number, number, number, number] },
          // Im Vordruck stehen hier die Feldnamen — sonst wäre die Zeile eine
          // beschriftungslose Leerzeile, in der niemand weiß, was hingehört.
          { text: blanko ? "Fahrzeug:" : vokabText(f.typ, vokabularFuer(org, "fahrzeug")) || "Fahrzeug", bold: true },
          { text: blanko ? "Kennzeichen:" : kennzeichenText(f), bold: true },
          // Sitzplätze nur, wenn sie am Fahrzeug erfasst sind: der Richtwert
          // des Typs steht in keiner Akte und hätte auf dem Papier den Rang
          // einer Zusage, die niemand gegeben hat.
          {
            text: blanko
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
            text: blanko
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
    margin: [0, 0, 0, 6] as [number, number, number, number],
  });
  const fahrzeuge: Content[] = blanko
    ? Array.from({ length: blanko.fahrzeuge }, () => fahrzeugBlock(BLANKO_FAHRZEUG))
    : b.fahrzeuge.map(fahrzeugBlock);

  const personalZeilen: TableCell[][] = [
    [
      { text: "Funktion /\nZusatzfunktion", bold: true, fillColor: GRAU },
      { text: "Name, Vorname", bold: true, fillColor: GRAU },
      { text: "D = dienstlich / P = privat", bold: true, fillColor: GRAU },
    ],
  ];
  for (let i = 0; blanko && i < blanko.personal; i++) {
    personalZeilen.push([leerZelle(), leerZelle(), leerZelle()]);
  }
  for (const p of blanko ? [] : b.personal) {
    const kontakte = p.kontakte
      .map((k) => {
        // Alte Bögen konnten statt einer Adresse ein Template tragen (siehe Kontakt).
        if (k.emailTemplate != null) return `eMail: — (${k.dienstlich ? "D" : "P"})`;
        const art = k.art === KontaktArt.EMAIL ? "eMail" : k.art === KontaktArt.MOBIL ? "Mobil" : "Telefon";
        return `${art}: ${weichUmbrechen(k.wert ?? "")} (${k.dienstlich ? "D" : "P"})`;
      })
      .join("\n");
    personalZeilen.push([
      { text: funktionsText(p, org) },
      { text: `${p.nachname}${p.nachname && p.vorname ? ", " : ""}${p.vorname}` },
      { text: kontakte },
    ]);
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
      qualiZeilen.push([
        { text: `${p.nachname}, ${p.vorname}` },
        { text: weichUmbrechen(p.zusatzqualifikationen.map((q) => q.freitext ?? `#${q.code}`).join(", ")) },
      ]);
    }
  }
  if (qualiZeilen.length === 1) qualiZeilen.push([{ text: " " }, { text: " " }]);

  const sofort: Content[] = [];
  if (b.sofortbedarf) {
    const sb = b.sofortbedarf;
    sofort.push({
      table: {
        widths: ["*", "*"],
        body: [
          [
            {
              stack: [
                { text: "Sofortbedarf:", bold: true, decoration: "underline" },
                { text: `${kasten(sb.verpflegungPersonen > 0)} Verpflegung für ${zahl(sb.verpflegungPersonen)} Personen, davon ${zahl(vp.vegetarisch)} vegetarisch, ${zahl(vp.vegan)} vegan` },
                { text: `${kasten(sb.dieselLiter + sb.benzinLiter + sb.gemischLiter > 0)} Betriebsstoff: ${zahl(sb.dieselLiter)} l Diesel / ${zahl(sb.benzinLiter)} l Benzin / ${zahl(sb.gemischLiter)} l Gemisch` },
              ],
            },
            {
              stack: [
                { text: `${kasten(sb.unterbringung)}  Unterbringung` },
                { text: `${kasten(sb.ruhezeitErforderlich)}  Ruhezeit erforderlich` },
                { text: `Anzahl Unterbringung/WC/Dusche:\nM ${zahl(mwd.m)} / W ${zahl(mwd.w)} / D ${zahl(mwd.d)}` },
              ],
            },
          ],
        ],
      },
      margin: [0, 8, 0, 0] as [number, number, number, number],
    });
  }

  return {
    pageSize: "A4",
    pageMargins: SEITENRAENDER,
    defaultStyle: { fontSize: 8, font: SCHRIFT },
    info: { title: `Erfassungsbogen ${typKurz || typName}` },
    ...(b.uebung ? { background: uebungsWasserzeichen() } : {}),
    // Maschinenlesbares JSON dokumentweit einbetten (ZUGFeRD-artig). Am
    // Vordruck hinge dort ein leerer Bogen — ein Anhang ohne jede Aussage.
    ...(blanko ? {} : { files: { [EEB_JSON_DATEINAME]: bogenAlsEingebetteteDatei(b) } }),
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
      // ---- Kopf ----
      {
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
        margin: [0, 0, 0, 8],
      },
      { table: { widths: [110, "*", 70, "*"], body: infoZeilen }, margin: [0, 0, 0, 10] },
      ...fahrzeuge,

      // ---- Personal ----
      // Kein fester Seitenumbruch: kleine Einheiten passen so auf eine Seite,
      // größere lässt pdfmake bei Bedarf selbst umbrechen.
      { table: { widths: [130, "*", 170], body: personalZeilen }, margin: [0, 12, 0, 10] },
      ...(b.personalErfassung === PersonalErfassung.NUR_STAERKE
        ? [{ text: "Personal am Meldekopf nur in Stärke erfasst.", italics: true, margin: [0, 0, 0, 6] } as Content]
        : []),
      { text: "weitere interne / externe Qualifikationen obiger Helfer/-innen:", margin: [0, 0, 0, 4] },
      { table: { widths: [180, "*"], body: qualiZeilen } },
      ...sofort,
      ...(b.sonstiges ? [{ text: `Sonstiges: ${weichUmbrechen(b.sonstiges)}`, margin: [0, 8, 0, 0] } as Content] : []),

      // ---- QR-Block ----
      // Kein fester Seitenumbruch mehr; als unbreakable-Gruppe zusammengehalten,
      // damit der QR-Code nicht über eine Seitengrenze zerrissen wird. Passt der
      // Block nicht mehr, rückt er als Ganzes auf die nächste Seite.
      ...(qr ? [qrBlock(qr, farbe.akzent, zeitgruppe(b.stand), vermerk)] : []),
    ],
  };
}
