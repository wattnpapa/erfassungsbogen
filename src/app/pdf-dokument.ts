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
  PersonalErfassung,
  datumZuIso,
  staerke,
  unterbringungMWD,
  verpflegung,
  zeitpunktZuIso,
} from "../model";
import {
  datumDeutsch,
  funkrufText,
  funktionsText,
  kennzeichenText,
  orgLabel,
  vokabText,
  vokabularFuer,
  type QrSatz,
} from "./hilfen";
import { fahrzeugSymbolSvg } from "./taktische-zeichen";

const BLAU = "#12275e";
const GRAU = "#e8e8e8";

/**
 * Kantenlänge des QR-Bilds in pt (1 pt = 1/72 Zoll). 150 pt ≈ 53 mm: klein
 * genug, dass kleine Einheiten (wenig Daten → niedrige QR-Version → große
 * Module) komplett auf eine Seite passen, und noch groß genug für einfache
 * A4-Drucker (Version 16 ≈ 0,65 mm, Version 20 ≈ 0,55 mm je Modul). Bewusst als
 * Konstante, damit sich die Größe nach einem Druck-/Scan-Praxistest leicht
 * nachziehen lässt.
 */
const QR_BREITE = 150;

/** Kantenlänge je QR-Bild bei Segmentierung (mehrere Codes nebeneinander). */
const QR_SEGMENT_BREITE = 120;

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
  const json = JSON.stringify(b, null, 2);
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

/** Mehrere Bögen als ein eingebettetes JSON-Array (für die Einsatz-Sammel-PDF). */
export function boegenAlsEingebetteteDatei(boegen: Erfassungsbogen[]): EingebetteteDatei {
  const json = JSON.stringify(boegen, null, 2);
  const base64 = base64AusBytes(new TextEncoder().encode(json));
  return {
    src: `data:application/json;base64,${base64}`,
    name: EEB_EINSATZ_DATEINAME,
    description: "Strukturierte Daten aller Bögen des Einsatzes (maschinenlesbar)",
    relationship: "Alternative",
  };
}

/**
 * Sammel-PDF eines Einsatzes: alle Bögen hintereinander (je Bogen die
 * vollständigen Seiten inkl. QR-Code), plus ALLE Bögen als eingebettetes
 * JSON-Array — so ist der ganze Einsatz maschinen- und menschenlesbar in einer
 * Datei übergebbar. Baut die Seiten aus {@link pdfDokument} zusammen.
 */
export function einsatzPdfDokument(
  name: string,
  boegenMitQr: { bogen: Erfassungsbogen; qr: QrSatz }[],
): TDocumentDefinitions {
  const content: Content[] = [];
  boegenMitQr.forEach(({ bogen, qr }, i) => {
    if (i > 0) content.push({ text: "", pageBreak: "before" });
    content.push(...(pdfDokument(bogen, qr).content as Content[]));
  });
  return {
    pageSize: "A4",
    pageMargins: [40, 36, 40, 40],
    defaultStyle: { fontSize: 9 },
    info: { title: `Einsatz-Sammlung ${name}` },
    files: { [EEB_EINSATZ_DATEINAME]: boegenAlsEingebetteteDatei(boegenMitQr.map((x) => x.bogen)) },
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
 * Mehrere Teile (Segmentierung) = QR-Bilder nebeneinander mit „Teil x / n"; ein
 * Öffnen-Link entfällt, da jeder Teil nur einen Abschnitt trägt.
 */
function qrBlock(qr: QrSatz): Content {
  const kopf = (text: string): Content => ({ text, bold: true, fontSize: 13, color: BLAU, alignment: "center" });
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
          color: BLAU,
          decoration: "underline",
          alignment: "center",
          fontSize: 11,
          margin: [0, 8, 0, 0],
        },
        {
          text: `Format EEB2 · ${qr.zeichen} Zeichen · QR-Version ${qr.version} (Fehlerkorrektur M)\nMit der Kamera scannen oder den Link antippen, um den Bogen digital zu übernehmen.`,
          alignment: "center",
          fontSize: 8,
          margin: [0, 6, 0, 0],
        },
      ],
    };
  }
  const anzahl = qr.teile.length;
  const spalten: Content[] = qr.teile.map((t) => ({
    width: "auto",
    stack: [
      { text: `Teil ${t.teilNr} / ${anzahl}`, bold: true, alignment: "center", color: BLAU },
      { image: t.datenUrl, width: QR_SEGMENT_BREITE, alignment: "center", margin: [0, 4, 0, 0] },
    ],
  }));
  return {
    unbreakable: true,
    margin: [0, 14, 0, 0],
    stack: [
      kopf(`Digitaler Bogen als QR-Code (${anzahl} Teile)`),
      { columns: spalten, columnGap: 16, alignment: "center", margin: [0, 8, 0, 0] },
      {
        text: `Format EEB2 · ${qr.zeichen} Zeichen · in ${anzahl} QR-Codes aufgeteilt (je ≤ Version ${qr.version}, Fehlerkorrektur M)\nAlle ${anzahl} Teile nacheinander mit der Kamera scannen — die App setzt den Bogen zusammen.`,
        alignment: "center",
        fontSize: 8,
        margin: [0, 6, 0, 0],
      },
    ],
  };
}

/** Bogen + fertiger QR-Satz → pdfmake-DocDefinition (Papier-Layout). */
export function pdfDokument(b: Erfassungsbogen, qr: QrSatz): TDocumentDefinitions {
  const org = b.einheit.organisation;
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
          { text: f.funkrufname ? `FuRn: ${funkrufText(f, b.einheit.name)}` : "" },
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
    pageMargins: [40, 36, 40, 40],
    defaultStyle: { fontSize: 9 },
    info: { title: `Erfassungsbogen ${typKurz || typName}` },
    // Maschinenlesbares JSON dokumentweit einbetten (ZUGFeRD-artig).
    files: { [EEB_JSON_DATEINAME]: bogenAlsEingebetteteDatei(b) },
    footer: (seite, gesamt) => ({
      columns: [
        { text: `Stand: ${datumDeutsch(datumZuIso(b.stand))}`, margin: [40, 0, 0, 0] },
        { text: `${seite} / ${gesamt}`, alignment: "right", margin: [0, 0, 40, 0] },
      ],
      fontSize: 8,
    }),
    content: [
      // ---- Kopf ----
      {
        table: {
          widths: [60, "*", 120],
          body: [
            [
              { text: typKurz, bold: true, fontSize: 10, margin: [2, 8, 2, 8] },
              {
                text: `Erfassungsbogen ${typName}`,
                color: "#ffffff",
                fillColor: BLAU,
                bold: true,
                fontSize: 13,
                margin: [6, 8, 6, 8],
              },
              { text: orgLabel(org) + (b.einheit.organisationName ? `\n${b.einheit.organisationName}` : ""), bold: true, color: BLAU, margin: [2, 8, 2, 8] },
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
      {
        table: {
          widths: ["*"],
          body: [[{ text: "Sollten die vorgegebenen Felder nicht genügen,\nist der „Erfassungsbogen Sonstige“ zu verwenden!", bold: true, alignment: "center", fillColor: GRAU }]],
        },
        margin: [0, 10, 0, 0],
      },

      // ---- QR-Block ----
      // Kein fester Seitenumbruch mehr; als unbreakable-Gruppe zusammengehalten,
      // damit der QR-Code nicht über eine Seitengrenze zerrissen wird. Passt der
      // Block nicht mehr, rückt er als Ganzes auf die nächste Seite.
      qrBlock(qr),
    ],
  };
}
