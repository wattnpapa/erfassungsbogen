/**
 * Sammel-PDF der Übungsbögen (boegenSammelDokument): mehrere Einzel-PDFs in einer
 * Datei, jeder Bogen auf eigener Seite beginnend, mit seiner Kopfzeile und seinem
 * Stand. Gesetzt wird echt (pdfmake in Node, scripts/pdf-in-node.ts), weil erst
 * das Setzen zeigt, auf welcher Seite ein Bogen beginnt.
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
import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import type { QrSatz } from "./hilfen";
import { boegenSammelDokument, bogenAufSeite, einzelPdfDokument } from "./pdf-dokument";
import { pdfBytes, seitenZahl } from "../../scripts/pdf-in-node";
import { einzelPdfsZippen } from "./pdf-zip";

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

function bogen(ort: string, personen: number, stand: string): Erfassungsbogen {
  return {
    schemaVersion: SCHEMA_VERSION,
    stand: zeitpunktAusIso(stand),
    uebung: true,
    einheit: {
      organisation: OrganisationsTyp.THW,
      einheitsTyp: { freitext: "FGr WP (A)" },
      hierarchie: [{ bezeichnung: { freitext: "OV" }, name: ort, telefon: "0761123456", email: "ov@thw.de" }],
    },
    einsatz: { zeitraumVon: datumAusIso("2026-11-16"), zeitraumBis: datumAusIso("2026-11-17"), ortAuftrag: "" },
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

/** Text einer Kopf- oder Fußzeile, wie pdfmake sie für die Seite anfordert. */
function zeilenText(dd: TDocumentDefinitions, feld: "header" | "footer", seite: number, gesamt: number): string {
  const f = dd[feld];
  if (typeof f !== "function") throw new Error(`${feld} ist keine Funktion`);
  return JSON.stringify(f(seite, gesamt, { width: 595, height: 842, orientation: "portrait" }) as Content);
}

describe("Sammel-PDF der Übungsbögen", () => {
  const boegen = [
    { bogen: bogen("Freiburg", 4, "2026-11-16T09:10"), qr: qrSatz(1) },
    // Groß genug für mehrere Seiten, mit mehrteiligem Code auf eigenen Seiten.
    { bogen: bogen("Albstadt", 30, "2026-11-16T09:12"), qr: qrSatz(3) },
    { bogen: bogen("Oldenburg", 2, "2026-11-16T09:15"), qr: qrSatz(1) },
  ];

  it("hat so viele Seiten wie die Einzel-PDFs zusammen, jeder Bogen beginnt auf einer neuen", async () => {
    let einzeln = 0;
    for (const { bogen: b, qr } of boegen) einzeln += seitenZahl(await pdfBytes(await einzelPdfDokument(b, qr, pdfBytes)));
    const dd = await boegenSammelDokument(boegen, pdfBytes, "Übungsbögen Test (3 Bögen)");
    expect(dd).not.toBeNull();
    const gesamt = seitenZahl(await pdfBytes(dd!));
    expect(gesamt).toBe(einzeln);

    // Kopfzeile: Blatt 1 jedes Bogens trägt den Platz für den Meldekopf, die
    // Folgeblätter Einheit und „Blatt n von m dieses Bogens".
    const erste = zeilenText(dd!, "header", 1, gesamt);
    expect(erste).toContain("Meldekopf:");
    const seiten = Array.from({ length: gesamt }, (_, i) => zeilenText(dd!, "header", i + 1, gesamt));
    expect(seiten.filter((t) => t.includes("Meldekopf:"))).toHaveLength(3);
    const albstadt = seiten.filter((t) => t.includes("Albstadt"));
    expect(albstadt.length).toBeGreaterThan(0);
    expect(albstadt[0]).toContain("Blatt 2 von");
    expect(albstadt[albstadt.length - 1]).toContain("dieses Bogens");
    // Fußzeile: Stand des jeweiligen Bogens, Seitenzahl durchlaufend, ÜBUNG auf jeder Seite.
    expect(zeilenText(dd!, "footer", 1, gesamt)).toContain("0910");
    expect(zeilenText(dd!, "footer", gesamt, gesamt)).toContain("0915");
    expect(zeilenText(dd!, "footer", gesamt, gesamt)).toContain(`${gesamt} / ${gesamt}`);
    expect(zeilenText(dd!, "footer", 2, gesamt)).toContain("ÜBUNG · ");
    // Eingebettete Daten je Bogen, Wasserzeichen und Titel.
    expect(Object.keys(dd!.files ?? {})).toEqual(["erfassungsbogen-01.json", "erfassungsbogen-02.json", "erfassungsbogen-03.json"]);
    expect(typeof dd!.background).toBe("function");
    expect(dd!.info?.title).toContain("3 Bögen");
  }, 60_000);

  it("bricht ab, wenn der Aufrufer nicht mehr will", async () => {
    let gefragt = 0;
    const dd = await boegenSammelDokument(boegen.slice(0, 2), pdfBytes, "Test", undefined, () => ++gefragt > 1);
    expect(dd).toBeNull();
  }, 30_000);

  it("ordnet Seiten den Bögen zu (bogenAufSeite)", () => {
    const start = [1, 3, 7];
    expect([1, 2, 3, 6, 7, 12].map((s) => bogenAufSeite(start, s))).toEqual([0, 0, 1, 1, 2, 2]);
    expect(bogenAufSeite([1], 5)).toBe(0);
  });
});

describe("Übungsbögen als ZIP mit einer PDF je Bogen", () => {
  it("legt jede PDF so ab, wie ihr Einzel-PDF aussieht, und macht doppelte Namen eindeutig", async () => {
    const boegen = [
      { bogen: bogen("Aurich", 3, "2026-11-01T08:00:00+01:00"), qr: qrSatz(1) },
      { bogen: bogen("Emden", 30, "2026-11-01T09:00:00+01:00"), qr: qrSatz(2) },
    ];
    const gemeldet: string[] = [];
    const zip = await einzelPdfsZippen(boegen, ["a.pdf", "a.pdf"], pdfBytes, (n, von) => gemeldet.push(`${n}/${von}`));
    expect(gemeldet).toEqual(["1/2", "2/2"]);
    const text = Buffer.from(zip!).toString("latin1");
    expect(text.startsWith("PK")).toBe(true);
    expect(text).toContain("a.pdf");
    expect(text).toContain("a-2.pdf");
    // Zwei vollständige PDFs, die zweite mit mehr Seiten (30 Personen).
    expect((text.match(/%PDF-/g) ?? []).length).toBe(2);
    expect((text.match(/%%EOF/g) ?? []).length).toBeGreaterThanOrEqual(2);
    const einzeln = await Promise.all(boegen.map(async ({ bogen: b, qr }) => seitenZahl(await pdfBytes(await einzelPdfDokument(b, qr, pdfBytes)))));
    expect(seitenZahl(zip!)).toBe(einzeln[0]! + einzeln[1]!);
  }, 60000);

  it("bricht zwischen den Bögen ab", async () => {
    const boegen = [{ bogen: bogen("Aurich", 3, "2026-11-01T08:00:00+01:00"), qr: qrSatz(1) }];
    expect(await einzelPdfsZippen(boegen, ["a.pdf"], pdfBytes, undefined, () => true)).toBeNull();
  });
});

