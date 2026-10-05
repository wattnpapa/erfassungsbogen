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
import { einsatzLageblattDokument, einsatzLageblattSeiteFuellen, einsatzPdfDokument, einzelPdfDokument, pdfDokument, type UebersichtEintrag } from "./pdf-dokument";
import { readFileSync } from "node:fs";
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

const erstellt = new Date("2026-10-04T19:16").getTime();
const eingetroffen = new Date("2026-10-04T18:24").getTime();

describe("Sammel-PDF: QR-Seiten ohne Überlauf (R3-A3)", () => {
  it.each([2, 3, 7])("%i Teile: je zwei Codes eine Seite, keine Restseite", async (teile) => {
    const b = bogen();
    const formular = seitenZahl(await pdfBytes(pdfDokument(b, null)));
    const sammel = seitenZahl(
      await pdfBytes(
        einsatzPdfDokument(
          "Hochwasser Neckar",
          [{ bogen: b, qr: qrSatz(teile), eingetroffenAm: eingetroffen, zugEtikett: "1. Zug", notiz: "Deich Nord, Abschnitt 3 sichern" }],
          undefined,
          erstellt,
        ),
      ),
    );
    // Übersicht + Formular + ⌈Teile / 2⌉ QR-Seiten.
    expect(sammel).toBe(1 + formular + Math.ceil(teile / 2));
  }, 20_000);

  it.each([2, 3, 7])("%i Teile im Einzel-PDF: ebenso", async (teile) => {
    const b = bogen();
    const formular = seitenZahl(await pdfBytes(pdfDokument(b, null)));
    const einzel = seitenZahl(await pdfBytes(pdfDokument(b, qrSatz(teile))));
    expect(einzel).toBe(formular + Math.ceil(teile / 2));
  }, 20_000);

  it("abgerückte Einheit mit langem Auftrag: der graue Kasten passt mit auf die Seite", async () => {
    const b = bogen();
    const formular = seitenZahl(await pdfBytes(pdfDokument(b, null)));
    const sammel = seitenZahl(
      await pdfBytes(
        einsatzPdfDokument(
          "Hochwasser Neckar Abschnitt Süd",
          [
            {
              bogen: b,
              qr: qrSatz(2),
              eingetroffenAm: eingetroffen,
              abgerueckAm: erstellt,
              abgerueckt: true,
              zugEtikett: "2. Zug / Bereitstellungsraum Ost",
              teil: "Trupp Pumpe 2",
              notiz: "Deich Nord, Abschnitt 3 sichern, danach Pumpen am Sportplatz übernehmen und Lage melden",
            },
          ],
          undefined,
          erstellt,
        ),
      ),
    );
    expect(sammel).toBe(1 + formular + 1);
  }, 20_000);
});

describe("Lageblatt: Nachtragszeilen bis unten (R3-A5)", () => {
  /** Nachtragszeilen = leere Zeilen mit dem Rand der Nachtragszeilen, je 10 Zellen. */
  const nachtragZeilen = (dd: { content: unknown }) =>
    (JSON.stringify(dd.content).match(/\{"text":" ","margin":\[0,5,0,5\]/g) ?? []).length / 10;

  function einheiten(n: number): UebersichtEintrag[] {
    return Array.from({ length: n }, (_, i) => {
      const b = bogen(4 + (i % 5));
      b.einheit.hierarchie[0]!.name = `Ortsverband ${i + 1}`;
      return { bogen: b, zugEtikett: `${1 + (i % 2)}. Zug`, eingetroffenAm: eingetroffen, nummer: i + 1, notiz: i % 3 ? "Deich Nord sichern" : undefined };
    });
  }

  it.each([
    [0, 5],
    [1, 5],
    [3, 5],
    // Sechs Einheiten mit Rückfrage, Erreichbarkeit und Auftrag: Die Seite
    // trägt dann weniger als fünf, aber nie eine zweite Seite nur für Zeilen.
    [6, 2],
  ])("%i Einheiten: eine Seite, mindestens %i Zeilen, Seite gefüllt", async (n, mindestens) => {
    const e = einheiten(n);
    const dd = await einsatzLageblattSeiteFuellen("Lage", e, pdfBytes, erstellt);
    const zeilen = nachtragZeilen(dd);
    expect(zeilen).toBeGreaterThanOrEqual(mindestens);
    // Gefüllt: Das Blatt bleibt eine Seite, aber zwei Zeilen mehr passen nicht.
    expect(seitenZahl(await pdfBytes(dd))).toBe(1);
    expect(seitenZahl(await pdfBytes(einsatzLageblattDokument("Lage", e, erstellt, zeilen + 2)))).toBe(2);
  }, 30_000);

  it("viele Einheiten: Füllen fügt keine Seite hinzu", async () => {
    const e = einheiten(14);
    const mindest = seitenZahl(await pdfBytes(einsatzLageblattDokument("Lage", e, erstellt)));
    const dd = await einsatzLageblattSeiteFuellen("Lage", e, pdfBytes, erstellt);
    expect(nachtragZeilen(dd)).toBeGreaterThanOrEqual(5);
    expect(seitenZahl(await pdfBytes(dd))).toBe(mindest);
  }, 30_000);

  it("leeres Blatt: über 10 Zeilen statt einer halben leeren Seite", async () => {
    const dd = await einsatzLageblattSeiteFuellen("Lage", [], pdfBytes, erstellt);
    expect(nachtragZeilen(dd)).toBeGreaterThan(10);
  }, 20_000);
});

describe("Einzel-PDF: Platz für Stiftnachträge, wo er keine Seite kostet (R3-A6)", () => {
  const freieZeilen = (dd: { content: unknown }) =>
    (JSON.stringify(dd.content).match(/"text":" ","margin":\[0,5,0,5\]/g) ?? []).length / 4;
  const beispiel = (datei: string): Erfassungsbogen =>
    JSON.parse(readFileSync(new URL(`../../examples/thw/${datei}`, import.meta.url), "utf8")) as Erfassungsbogen;

  it.each([1, 3])("kleiner Bogen (%i QR-Teile): zwei freie Personalzeilen und ein leerer Fahrzeugblock, Seitenzahl gleich", async (teile) => {
    const b = bogen(4);
    const dd = await einzelPdfDokument(b, qrSatz(teile), pdfBytes);
    expect(freieZeilen(dd)).toBe(2);
    expect(JSON.stringify(dd.content)).toContain('"Kennzeichen:"');
    expect(seitenZahl(await pdfBytes(dd))).toBe(seitenZahl(await pdfBytes(pdfDokument(b, qrSatz(teile)))));
  }, 20_000);

  it("voller einseitiger Bogen (Zugtrupp Albstadt): keine freien Zeilen statt einer zweiten Seite", async () => {
    const b = beispiel("001-albstadt-ztr-tz.json");
    const dd = await einzelPdfDokument(b, qrSatz(1), pdfBytes);
    expect(seitenZahl(await pdfBytes(dd))).toBe(1);
    expect(freieZeilen(dd)).toBe(0);
  }, 20_000);
});
