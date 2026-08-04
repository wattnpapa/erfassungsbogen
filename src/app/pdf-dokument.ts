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
  KontaktArt,
  OrganisationsTyp,
  PersonalErfassung,
  datumZuIso,
  mitTransportVersion,
  staerke,
  unterbringungMWD,
  verpflegung,
  zeitpunktZuIso,
} from "../model";
import {
  datumDeutsch,
  einheitAnzeigename,
  einheitOrt,
  funkrufText,
  funktionsText,
  kennzeichenText,
  orgLabel,
  vokabText,
  vokabularFuer,
  zeitgruppe,
  type QrSatz,
} from "./hilfen";
import { summiereBoegen, type EinsatzSummen } from "./auswertung";
import { bogenDiff, diffZeilen } from "./meldung-diff";
import { fahrzeugSymbolSvg } from "./taktische-zeichen";
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
 * Kantenlänge des QR-Bilds in pt (1 pt = 1/72 Zoll). 150 pt ≈ 53 mm: klein
 * genug, dass kleine Einheiten (wenig Daten → niedrige QR-Version → große
 * Module) komplett auf eine Seite passen, und noch groß genug für einfache
 * A4-Drucker (Version 16 ≈ 0,65 mm, Version 20 ≈ 0,55 mm je Modul). Bewusst als
 * Konstante, damit sich die Größe nach einem Druck-/Scan-Praxistest leicht
 * nachziehen lässt.
 */
const QR_BREITE = 150;

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

/** Ein Bogen der Sammel-PDF samt QR und (für die Änderungsspalte) seiner Vorfassung. */
export interface SammelBogen {
  bogen: Erfassungsbogen;
  qr: QrSatz;
  /** Vorherige Meldung derselben Einheit; fehlt bei einer Erstmeldung. */
  vorher?: Erfassungsbogen;
  /** Zug-/Verbandsetikett aus der Sammlung — Grundlage der Zwischensummen. */
  zugEtikett?: string;
  /** Bezeichnung eines abgeteilten Truppteils (MeldeEintrag.teilEtikett). */
  teil?: string;
}

/** Mehr Zeilen passen nicht sinnvoll in eine Tabellenzelle — der Rest wird gezählt. */
const UEBERSICHT_MAX_ZEILEN = 8;

/**
 * Übergabe-Übersicht: eine Zeile je Einheit mit Stärke, Fahrzeugen und der
 * Spalte „Veränderung seit der letzten Meldung" — der Teil, den die ablösende
 * Schicht zuerst liest. Die Detailbögen dahinter bleiben unverändert im Layout
 * des Papiervordrucks.
 */
function uebersichtsTabelle(boegen: SammelBogen[]): Content {
  const kopf = (text: string): TableCell => ({ text, bold: true, fillColor: GRAU });
  const body: TableCell[][] = [
    [
      kopf("Einheit"),
      kopf("Stand"),
      kopf("Stärke\nF / U / M / G"),
      kopf("Fzg"),
      kopf("Veränderung seit der letzten Meldung"),
    ],
  ];
  const summe = { fuehrer: 0, unterfuehrer: 0, mannschaft: 0, gesamt: 0, fahrzeuge: 0 };
  for (const { bogen: b, vorher, teil } of boegen) {
    const s = staerke(b);
    summe.fuehrer += s.fuehrer;
    summe.unterfuehrer += s.unterfuehrer;
    summe.mannschaft += s.mannschaft;
    summe.gesamt += s.gesamt;
    summe.fahrzeuge += b.fahrzeuge.length;

    let aenderung: Content;
    if (!vorher) {
      aenderung = { text: "Erstmeldung", italics: true };
    } else {
      const d = bogenDiff(vorher, b);
      aenderung =
        d.anzahl === 0
          ? { text: `unverändert gegenüber ${zeitgruppe(vorher.stand)}`, italics: true }
          : {
              stack: [
                { text: `gegenüber ${zeitgruppe(vorher.stand)}:`, bold: true },
                ...diffZeilen(d, UEBERSICHT_MAX_ZEILEN).map((z) => ({ text: z })),
              ],
            };
    }
    // Name, darunter bei Bedarf die Kennzeichnung eines abgeteilten Truppteils
    // und der Übungs-Störer — beides muss in der Übersicht stehen, sonst sind
    // zwei Zeilen derselben Einheit nicht auseinanderzuhalten.
    const namensZeilen: Content[] = [{ text: einheitAnzeigename(b.einheit) }];
    if (teil) namensZeilen.push({ text: teil, italics: true });
    if (b.uebung) namensZeilen.push({ text: "ÜBUNG", bold: true, color: UEBUNG_FARBE });
    body.push([
      namensZeilen.length === 1 ? namensZeilen[0]! : { stack: namensZeilen },
      { text: zeitgruppe(b.stand) },
      { text: `${s.fuehrer} / ${s.unterfuehrer} / ${s.mannschaft} / ${s.gesamt}` },
      { text: `${b.fahrzeuge.length}` },
      aenderung,
    ]);
  }
  body.push([
    { text: `Summe (${boegen.length} Einheiten)`, bold: true },
    { text: "" },
    { text: `${summe.fuehrer} / ${summe.unterfuehrer} / ${summe.mannschaft} / ${summe.gesamt}`, bold: true },
    { text: `${summe.fahrzeuge}`, bold: true },
    { text: "" },
  ]);
  // Breiten für die quer liegende Übersichtsseite: Einheitsname und Zeitgruppe
  // bekommen so viel Platz, dass sie einzeilig bleiben.
  return { table: { headerRows: 1, widths: [170, 56, 60, 22, "*"], body }, margin: [0, 0, 0, 4] };
}

/** „Diesel 120 l · Benzin 30 l" — Gemisch nur, wenn gemeldet (wie in der Oberfläche). */
function kraftstoffText(k: EinsatzSummen["kraftstoff"]): string {
  const teile = [`Diesel ${k.dieselLiter} l`, `Benzin ${k.benzinLiter} l`];
  if (k.gemischLiter > 0) teile.push(`Gemisch ${k.gemischLiter} l`);
  return teile.join(" · ");
}

/**
 * Bedarfs-Übersicht des ganzen Einsatzes: Verpflegung, Unterbringung,
 * Kraftstoff und Ruhezeit über alle Bögen der Sammlung — dieselben Zahlen, die
 * der Meldekopf auf dem Bildschirm sieht (gemeinsame Summierung in
 * auswertung.ts). Ohne sie zeigte die gedruckte Sammlung nur die Stärke.
 */
function bedarfsTabelle(boegen: SammelBogen[]): Content {
  const s = summiereBoegen(boegen.map((x) => x.bogen));
  const body: TableCell[][] = [
    [
      { text: "Verpflegung:", bold: true },
      {
        text:
          `${s.verpflegung.gesamt} Portionen ` +
          `(${s.verpflegung.fleisch} Fleisch / ${s.verpflegung.vegetarisch} vegetarisch / ${s.verpflegung.vegan} vegan)`,
      },
    ],
    [
      { text: "Unterbringung/WC/Dusche:", bold: true },
      {
        text:
          `M ${s.unterbringung.m} / W ${s.unterbringung.w} / D ${s.unterbringung.d}` +
          (s.unterbringungBenoetigt > 0 ? ` · ${s.unterbringungBenoetigt}× Unterbringung angefordert` : ""),
      },
    ],
    [{ text: "Betriebsstoff:", bold: true }, { text: kraftstoffText(s.kraftstoff) }],
    [
      { text: "Fahrzeuge / Ruhezeit:", bold: true },
      { text: `${s.fahrzeuge} Fahrzeuge · Ruhezeit erforderlich bei ${s.ruhezeitErforderlich} Einheit(en)` },
    ],
  ];
  return {
    stack: [
      { text: `Bedarf gesamt (${s.einheiten} Einheiten, ${s.staerke.gesamt} Personen)`, bold: true, margin: [0, 10, 0, 4] },
      { table: { headerRows: 0, widths: [130, "*"], body }, margin: [0, 0, 0, 4] },
    ],
    unbreakable: true,
  };
}

/**
 * Zwischensummen je Zug/Verband — nur sinnvoll, wenn die Sammlung überhaupt
 * mehr als eine Gruppe kennt (sonst wiederholt die Tabelle nur den Gesamtwert).
 */
function zugSummenTabelle(boegen: SammelBogen[]): Content | undefined {
  const nach = new Map<string, Erfassungsbogen[]>();
  for (const { bogen, zugEtikett } of boegen) {
    const k = zugEtikett ?? "";
    (nach.get(k) ?? nach.set(k, []).get(k)!).push(bogen);
  }
  if (nach.size < 2) return undefined;
  const kopf = (text: string): TableCell => ({ text, bold: true, fillColor: GRAU });
  const body: TableCell[][] = [
    [kopf("Zug / Verband"), kopf("Einh."), kopf("Stärke\nF / U / M / G"), kopf("Verpfl."), kopf("M / W / D"), kopf("Betriebsstoff"), kopf("Fzg")],
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
      { text: `${s.unterbringung.m} / ${s.unterbringung.w} / ${s.unterbringung.d}` },
      { text: kraftstoffText(s.kraftstoff) },
      { text: `${s.fahrzeuge}` },
    ]);
  }
  return {
    stack: [
      { text: "Zwischensummen nach Zug", bold: true, margin: [0, 10, 0, 4] },
      { table: { headerRows: 1, widths: [150, 32, 60, 36, 56, "*", 24], body }, margin: [0, 0, 0, 4] },
    ],
  };
}

/**
 * Sammel-PDF eines Einsatzes: vorneweg die Übergabe-Übersicht (Stärke,
 * Fahrzeuge, Änderungen je Einheit), dahinter alle Bögen (je Bogen die
 * vollständigen Seiten inkl. QR-Code), plus ALLE Bögen als eingebettetes
 * JSON-Array — so ist der ganze Einsatz maschinen- und menschenlesbar in einer
 * Datei übergebbar. Baut die Seiten aus {@link pdfDokument} zusammen.
 */
export function einsatzPdfDokument(
  name: string,
  boegenMitQr: SammelBogen[],
  /** Optional: kompletter Einsatz-Umschlag (einsatzDateiInhalt) für die Schichtübergabe. */
  sammlungJson?: string,
): TDocumentDefinitions {
  const zugSummen = zugSummenTabelle(boegenMitQr);
  const content: Content[] = [
    { text: `Übergabe-Übersicht: ${name}`, bold: true, fontSize: 12, margin: [0, 0, 0, 8] },
    uebersichtsTabelle(boegenMitQr),
    {
      text: "Die Änderungsspalte vergleicht jede Meldung mit der vorherigen Meldung derselben Einheit. Die vollständigen Bögen folgen.",
      italics: true,
      margin: [0, 4, 0, 0],
    },
    bedarfsTabelle(boegenMitQr),
    ...(zugSummen ? [zugSummen] : []),
  ];
  boegenMitQr.forEach(({ bogen, qr }) => {
    // Zurück ins Hochformat: der Bogen selbst bleibt exakt der Papiervordruck.
    // pdfmake übernimmt die Ausrichtung des Knotens, der den Umbruch auslöst.
    content.push({ text: "", pageBreak: "before", pageOrientation: "portrait" });
    content.push(...(pdfDokument(bogen, qr).content as Content[]));
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
    footer: (seite, gesamt) => ({
      columns: [
        { text: `Einsatz-Sammlung: ${name}`, margin: [40, 0, 0, 0] },
        { text: `${seite} / ${gesamt}`, alignment: "right", margin: [0, 0, 40, 0] },
      ],
      fontSize: 8,
    }),
    content,
  };
}

/**
 * QR-Block der letzten Seite. Ein Teil = wie bisher (Bild + antippbarer Link).
 * Mehrere Teile (Segmentierung) = eigene QR-Seiten mit je zwei diagonal
 * versetzten Codes „Teil x / n" (Kamera sieht immer nur einen Code, siehe
 * QR_SEGMENT_BREITE); ein Öffnen-Link entfällt, da jeder Teil nur einen
 * Abschnitt trägt.
 */
function qrBlock(qr: QrSatz, akzent: string): Content {
  const kopf = (text: string): Content => ({ text, bold: true, fontSize: 13, color: akzent, alignment: "center" });
  if (qr.teile.length === 1) {
    const t = qr.teile[0]!;
    return {
      unbreakable: true,
      margin: [0, 14, 0, 0],
      stack: [
        kopf("Digitaler Bogen als QR-Code"),
        // QR-Bild UND Textlink tragen dieselbe App-URL: mit der Kamera scannen ODER
        // in der digitalen PDF direkt anklicken, um den Bogen in der App zu öffnen.
        { image: t.datenUrl, width: QR_BREITE, alignment: "center", margin: [0, 8, 0, 0], link: t.url },
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
  const teilZelle = (t: QrSatz["teile"][number]): Content => ({
    stack: [
      { text: `Teil ${t.teilNr} / ${anzahl}`, bold: true, alignment: "center", color: akzent },
      { image: t.datenUrl, width: QR_SEGMENT_BREITE, margin: [0, 4, 0, 0] },
    ],
  });
  const hinweis = (): Content => ({
    text:
      `Alle ${anzahl} Teile nacheinander mit der Kamera scannen — die App setzt den Bogen zusammen.\n` +
      `Beim Scannen jeweils nur einen Code ins Kamerabild nehmen.`,
    alignment: "center",
    fontSize: 8,
    margin: [0, 12, 0, 0],
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
    stack.push(hinweis());
    seiten.push({ stack, pageBreak: "before" });
  }
  return { stack: seiten };
}

/** Bogen + fertiger QR-Satz → pdfmake-DocDefinition (Papier-Layout). */
export function pdfDokument(b: Erfassungsbogen, qr: QrSatz): TDocumentDefinitions {
  const org = b.einheit.organisation;
  const farbe = orgFarbe(org);
  const typName = vokabText(b.einheit.einheitsTyp, vokabularFuer(org, "einheitstyp"), "name") || "Einheit";
  const typKurz = vokabText(b.einheit.einheitsTyp, vokabularFuer(org, "einheitstyp"));
  const s = staerke(b);
  const mwd = unterbringungMWD(b);
  const vp = verpflegung(b);
  const ansprech = b.personal[0];

  const infoZeilen: TableCell[][] = [
    [
      { text: "Stärke:", bold: true },
      { text: `${s.fuehrer} / ${s.unterfuehrer} / ${s.mannschaft} / ${s.gesamt}` },
      { text: "Ansprechpartner/in:", bold: true },
      { text: ansprech ? `${ansprech.vorname} ${ansprech.nachname}` : "" },
    ],
  ];
  for (const h of b.einheit.hierarchie) {
    infoZeilen.push([
      { text: vokabText(h.bezeichnung, vokabularFuer(org, "ebene")) || "Ebene", bold: true },
      { text: h.kurz ? `${h.name} (${h.kurz})` : h.name },
      { text: "Telefon:\neMail:", bold: true },
      { text: `${h.telefon ?? "—"}\n${h.email ?? "—"}` },
    ]);
  }
  infoZeilen.push([
    { text: "vorgesehener Einsatzzeitraum:", bold: true, colSpan: 2 },
    {},
    { text: `${datumDeutsch(datumZuIso(b.einsatz.zeitraumVon))} – ${datumDeutsch(datumZuIso(b.einsatz.zeitraumBis))}`, colSpan: 2 },
    {},
  ]);
  infoZeilen.push([
    { text: "vorgesehener Einsatzort / Auftrag:", bold: true, colSpan: 2 },
    {},
    { text: b.einsatz.ortAuftrag, colSpan: 2 },
    {},
  ]);
  infoZeilen.push([
    { text: "Einsatzbeginn:", bold: true },
    { text: b.einsatz.einsatzbeginn != null ? zeitpunktZuIso(b.einsatz.einsatzbeginn).replace("T", " ") : "" },
    { text: "Einsatzende:", bold: true },
    { text: b.einsatz.einsatzende != null ? zeitpunktZuIso(b.einsatz.einsatzende).replace("T", " ") : "" },
  ]);

  const fahrzeuge: Content[] = b.fahrzeuge.map((f): Content => ({
    table: {
      // Erste Spalte: taktisches Zeichen (DV 102), zeilenübergreifend links.
      widths: [56, "*", "*", "*"],
      body: [
        [
          { svg: fahrzeugSymbolSvg(f, org), width: 50, rowSpan: 2, alignment: "center", margin: [2, 6, 2, 6] as [number, number, number, number] },
          { text: vokabText(f.typ, vokabularFuer(org, "fahrzeug")) || "Fahrzeug", bold: true },
          { text: kennzeichenText(f), bold: true },
          { text: f.funkrufname ? `FuRn: ${funkrufText(f, einheitOrt(b.einheit))}` : "" },
        ],
        [
          {}, // von rowSpan des Zeichens belegt
          {
            colSpan: 3,
            text:
              f.stanKonform == null
                ? `Änderungen bzw. Sondergerät: ${f.aenderungen ?? ""}`
                : `Ausstattung nach StAN: ja ${kasten(f.stanKonform)} / nein ${kasten(!f.stanKonform)}\nÄnderungen bzw. Sondergerät: ${f.aenderungen ?? ""}`,
          },
          {},
          {},
        ],
      ],
    },
    margin: [0, 0, 0, 6] as [number, number, number, number],
  }));

  const personalZeilen: TableCell[][] = [
    [
      { text: "Funktion /\nZusatzfunktion", bold: true, fillColor: GRAU },
      { text: "Name, Vorname", bold: true, fillColor: GRAU },
      { text: "D = dienstlich / P = privat", bold: true, fillColor: GRAU },
    ],
  ];
  for (const p of b.personal) {
    const kontakte = p.kontakte
      .map((k) => {
        if (k.emailTemplate === 1) return "eMail: vorname.nachname@… (D)";
        const art = k.art === KontaktArt.EMAIL ? "eMail" : k.art === KontaktArt.MOBIL ? "Mobil" : "Telefon";
        return `${art}: ${k.wert ?? ""} (${k.dienstlich ? "D" : "P"})`;
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
  for (const p of b.personal) {
    if (p.zusatzqualifikationen.length > 0) {
      qualiZeilen.push([
        { text: `${p.nachname}, ${p.vorname}` },
        { text: p.zusatzqualifikationen.map((q) => q.freitext ?? `#${q.code}`).join(", ") },
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
                { text: `${kasten(sb.verpflegungPersonen > 0)} Verpflegung für ${sb.verpflegungPersonen} Personen, davon ${vp.vegetarisch} vegetarisch, ${vp.vegan} vegan` },
                { text: `${kasten(sb.dieselLiter + sb.benzinLiter + sb.gemischLiter > 0)} Betriebsstoff: ${sb.dieselLiter} l Diesel / ${sb.benzinLiter} l Benzin / ${sb.gemischLiter} l Gemisch` },
              ],
            },
            {
              stack: [
                { text: `${kasten(sb.unterbringung)}  Unterbringung` },
                { text: `${kasten(sb.ruhezeitErforderlich)}  Ruhezeit erforderlich` },
                { text: `Anzahl Unterbringung/WC/Dusche:\nM ${mwd.m} / W ${mwd.w} / D ${mwd.d}` },
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
    // Maschinenlesbares JSON dokumentweit einbetten (ZUGFeRD-artig).
    files: { [EEB_JSON_DATEINAME]: bogenAlsEingebetteteDatei(b) },
    footer: (seite, gesamt) => ({
      columns: [
        { text: `Stand: ${zeitgruppe(b.stand)}`, margin: [40, 0, 0, 0] },
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
                text: `Erfassungsbogen ${typName}`,
                color: farbe.schrift,
                fillColor: farbe.balken,
                bold: true,
                fontSize: 12,
                margin: [6, 8, 6, 8],
              },
              {
                text: [orgLabel(org), b.einheit.organisationName, typKurz].filter(Boolean).join("\n"),
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
      ...(b.sonstiges ? [{ text: `Sonstiges: ${b.sonstiges}`, margin: [0, 8, 0, 0] } as Content] : []),

      // ---- QR-Block ----
      // Kein fester Seitenumbruch mehr; als unbreakable-Gruppe zusammengehalten,
      // damit der QR-Code nicht über eine Seitengrenze zerrissen wird. Passt der
      // Block nicht mehr, rückt er als Ganzes auf die nächste Seite.
      qrBlock(qr, farbe.akzent),
    ],
  };
}
