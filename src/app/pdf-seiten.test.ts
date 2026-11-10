/**
 * Seitenzahlen der gesetzten PDFs. Seitenumbrüche entstehen erst beim Setzen
 * — die DocDefinition-Tests in pdf-dokument.test.ts sehen sie nicht. Deshalb
 * setzt dieser Test echt (pdfmake in Node, scripts/pdf-in-node.ts) und zählt
 * die Seiten.
 *
 * Anlass: In der Sammel-PDF sprengten Kasten „Stand am Meldekopf" und Hinweis
 * unter einem QR-Paar die Seite; 7 von 38 Seiten trugen nur noch die letzte
 * Zeile des Erklärtexts (Audit Runde 3, R3-A3).
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("./nativ", () => ({ istNativ: () => false, textTeilen: async () => {}, binaerTeilen: async () => {} }));

import {
  Ernaehrung,
  Fahrerlaubnis,
  Geschlecht,
  KontaktArt,
  OrganisationsTyp,
  PersonalErfassung,
  StaerkeRolle,
  SCHEMA_VERSION,
  datumAusIso,
  zeitpunktAusIso,
  type Erfassungsbogen,
} from "@bos/eeb-format/model";
import type { QrSatz } from "./hilfen";
import { einzelPdfDokument, pdfDokument } from "./pdf-dokument";
import { readFileSync, readdirSync } from "node:fs";
import { pdfBytes, seitenZahl } from "../../scripts/pdf-in-node";

/** Echtes 1×1-PNG — pdfmake skaliert es auf die QR-Breite. */
const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

function qrSatz(anzahl: number): QrSatz {
  return {
    teile: Array.from({ length: anzahl }, (_, i) => ({
      datenUrl: PNG,
      url: `https://erfassungsbogen.app/#EEBS.${i + 1}.${anzahl}`,
      teilNr: i + 1,
      anzahl,
      version: 13,
    })),
    segmentiert: anzahl > 1,
    zeichen: 900 * anzahl,
    version: 13,
    vollUrl: "https://erfassungsbogen.app/#VOLL",
    stufen: 1,
    weitergeleitet: false,
  };
}

function bogen(personen = 2): Erfassungsbogen {
  return {
    schemaVersion: SCHEMA_VERSION,
    stand: zeitpunktAusIso("2026-10-04T19:16"),
    einheit: {
      organisation: OrganisationsTyp.THW,
      einheitsTyp: { freitext: "FGr WP (A)" },
      hierarchie: [{ bezeichnung: { freitext: "OV" }, name: "Freiburg", telefon: "0761123456", email: "ov@thw.de" }],
    },
    einsatz: {
      zeitraumVon: datumAusIso("2026-10-04"),
      zeitraumBis: datumAusIso("2026-10-06"),
      ortAuftrag: "Hochwasser Neckar",
    },
    personalErfassung: PersonalErfassung.VOLLSTAENDIG,
    personal: Array.from({ length: personen }, (_, i) => ({
      vorname: `Vorname${i}`,
      nachname: `Nachname${i}`,
      staerkeRolle: i === 0 ? StaerkeRolle.FUEHRER : StaerkeRolle.MANNSCHAFT,
      funktionen: [],
      fahrerlaubnis: Fahrerlaubnis.NONE,
      geschlecht: Geschlecht.M,
      ernaehrung: Ernaehrung.FLEISCH,
      kontakte: i === 0 ? [{ art: KontaktArt.MOBIL, dienstlich: false, wert: "01701234501" }] : [],
      zusatzqualifikationen: [],
    })),
    fahrzeuge: [{ typ: { freitext: "MzKW" }, kennzeichen: "THW-84397" }],
    sofortbedarf: {
      verpflegungPersonen: personen,
      dieselLiter: 0,
      benzinLiter: 0,
      gemischLiter: 0,
      unterbringung: false,
      ruhezeitErforderlich: false,
    },
  };
}

describe("Sammel-PDF: QR-Seiten ohne Überlauf (R3-A3)", () => {

  it.each([2, 3, 7])("%i Teile im Einzel-PDF: ebenso", async (teile) => {
    const b = bogen();
    const formular = seitenZahl(await pdfBytes(pdfDokument(b, null)));
    const einzel = seitenZahl(await pdfBytes(pdfDokument(b, qrSatz(teile))));
    expect(einzel).toBe(formular + Math.ceil(teile / 2));
  }, 20_000);
});

describe("Einzel-PDF: Platz für Stiftnachträge, wo er keine Seite kostet (R3-A6)", () => {
  const freieZeilen = (dd: { content: unknown }) =>
    (JSON.stringify(dd.content).match(/"text":" ","margin":\[0,2,0,2\]/g) ?? []).length / 3;
  const beispiel = (datei: string): Erfassungsbogen =>
    JSON.parse(readFileSync(new URL(`../../examples/thw/${datei}`, import.meta.url), "utf8")) as Erfassungsbogen;

  it.each([3])("kleiner Bogen (%i QR-Teile): zwei freie Personalzeilen und ein leerer Fahrzeugblock, Seitenzahl gleich", async (teile) => {
    const b = bogen(4);
    const dd = await einzelPdfDokument(b, qrSatz(teile), pdfBytes);
    expect(freieZeilen(dd)).toBe(2);
    expect(JSON.stringify(dd.content)).toContain('"Kennzeichen:"');
    expect(seitenZahl(await pdfBytes(dd))).toBe(seitenZahl(await pdfBytes(pdfDokument(b, qrSatz(teile)))));
  }, 20_000);

  // Mit Einzelcode auf Seite 1 bleibt beim Raster der THWin-Vorlage unter dem Code
  // weniger Platz als zwei Zeilen und ein Fahrzeugblock brauchen: dann eben ohne.
  it("kleiner Bogen mit Einzelcode auf Seite 1: nichts dazu, was eine Seite kostet", async () => {
    const b = bogen(4);
    const dd = await einzelPdfDokument(b, qrSatz(1), pdfBytes);
    expect(seitenZahl(await pdfBytes(dd))).toBe(1);
    expect(seitenZahl(await pdfBytes(pdfDokument(b, qrSatz(1))))).toBe(1);
  }, 20_000);

  // Seit dem Raster der THWin-Vorlage (10 pt, Zeilenhöhen der Vorlage) steht der Code des
  // Zugtrupps Albstadt auf Seite 2. Die Regel bleibt: freie Zeilen kosten keine Seite.
  it("Zugtrupp Albstadt: freie Zeilen kosten keine Seite", async () => {
    const b = beispiel("001-albstadt-ztr-tz.json");
    const dd = await einzelPdfDokument(b, qrSatz(1), pdfBytes);
    expect(seitenZahl(await pdfBytes(dd))).toBe(seitenZahl(await pdfBytes(pdfDokument(b, qrSatz(1)))));
  }, 20_000);

  it("50 THW-Beispielbögen: freie Zeilen und Fahrzeugblock kosten nie eine Seite", async () => {
    for (const datei of readdirSync(new URL("../../examples/thw/", import.meta.url)).filter((d) => /^0[0-4]\d-.*\.json$/.test(d))) {
      const b = beispiel(datei);
      const ohne = seitenZahl(await pdfBytes(pdfDokument(b, qrSatz(1))));
      const mit = seitenZahl(await pdfBytes(await einzelPdfDokument(b, qrSatz(1), pdfBytes)));
      expect(mit, datei).toBe(ohne);
    }
  }, 120_000);
});
