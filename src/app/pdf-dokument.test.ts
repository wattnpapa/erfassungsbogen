import { describe, it, expect, vi } from "vitest";

// pdf-dokument.ts zieht über ./hilfen die native Brücke; für die reine
// DocDefinition brauchen wir davon nichts.
vi.mock("./nativ", () => ({
  istNativ: () => false,
  textTeilen: async () => {},
  binaerTeilen: async () => {},
}));

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
  mitTransportVersion,
  zeitpunktAusIso,
  type Erfassungsbogen,
} from "../model";
import type { QrSatz } from "./hilfen";
import { EEB_JSON_DATEINAME, bogenAlsEingebetteteDatei, einsatzPdfDokument, pdfDokument } from "./pdf-dokument";

const QR_BILD = "data:image/png;base64,QRTESTBILD";
const QR_URL = "https://erfassungsbogen.app/#TESTPAYLOAD";
const QR: QrSatz = {
  teile: [{ datenUrl: QR_BILD, url: QR_URL, teilNr: 1, anzahl: 1, version: 7 }],
  segmentiert: false,
  zeichen: 123,
  version: 7,
  vollUrl: QR_URL,
  stufen: 1,
  weitergeleitet: false,
};

// Sammelt rekursiv alle String-Werte einer pdfmake-Struktur ein — robust
// gegenüber der verschachtelten Tabellen-/Stack-Form.
function texte(node: unknown, acc: string[] = []): string[] {
  if (typeof node === "string") acc.push(node);
  else if (Array.isArray(node)) node.forEach((n) => texte(n, acc));
  else if (node && typeof node === "object") Object.values(node).forEach((v) => texte(v, acc));
  return acc;
}

function basisBogen(): Erfassungsbogen {
  return {
    schemaVersion: SCHEMA_VERSION,
    stand: zeitpunktAusIso("2026-05-14T10:39"),
    einheit: {
      organisation: OrganisationsTyp.THW,
      // Freitext-Werte, damit die Assertions unabhängig von den Vokabular-Tabellen sind.
      einheitsTyp: { freitext: "FGr K (A)" },
      hierarchie: [
        { bezeichnung: { freitext: "OV" }, name: "Oldenburg - Ni", kurz: "OODE", telefon: "04413401050", email: "ov@thw.de" },
      ],
    },
    einsatz: {
      zeitraumVon: datumAusIso("2025-05-14"),
      zeitraumBis: datumAusIso("2025-05-17"),
      ortAuftrag: "Fernmeldebauübung Kabelblitz",
      einsatzbeginn: zeitpunktAusIso("2025-05-14T08:30"),
      einsatzende: zeitpunktAusIso("2025-05-17T16:00"),
    },
    personalErfassung: PersonalErfassung.VOLLSTAENDIG,
    personal: [
      {
        vorname: "Johannes",
        nachname: "Rudolph",
        staerkeRolle: StaerkeRolle.FUEHRER,
        funktionen: [{ freitext: "GrFü" }],
        fahrerlaubnis: Fahrerlaubnis.CE,
        geschlecht: Geschlecht.M,
        ernaehrung: Ernaehrung.FLEISCH,
        kontakte: [{ art: KontaktArt.MOBIL, dienstlich: false, wert: "01701234501" }],
        zusatzqualifikationen: [{ freitext: "Bootsführer" }],
      },
      {
        vorname: "Anna",
        nachname: "Weber",
        staerkeRolle: StaerkeRolle.MANNSCHAFT,
        funktionen: [],
        fahrerlaubnis: Fahrerlaubnis.NONE,
        geschlecht: Geschlecht.W,
        ernaehrung: Ernaehrung.VEGAN,
        kontakte: [],
        zusatzqualifikationen: [],
      },
    ],
    fahrzeuge: [
      {
        typ: { freitext: "MzKW" },
        kennzeichen: "THW-84397",
        funkrufname: { kennwort: { code: 1 }, eigenerStandort: true, teile: [18, 13] },
        stanKonform: true,
      },
    ],
    sofortbedarf: {
      verpflegungPersonen: 2,
      dieselLiter: 200,
      benzinLiter: 0,
      gemischLiter: 0,
      unterbringung: true,
      ruhezeitErforderlich: false,
    },
    sonstiges: "Bitte Verpflegung ab 12 Uhr.",
  };
}

describe("pdfDokument()", () => {
  it("setzt A4, Titel und übernimmt das QR-Bild", () => {
    const dd = pdfDokument(basisBogen(), QR);
    expect(dd.pageSize).toBe("A4");
    expect((dd.info as { title: string }).title).toBe("Erfassungsbogen FGr K (A)");
    // Das übergebene QR-Bild muss unverändert im Dokument landen.
    expect(JSON.stringify(dd.content)).toContain(QR_BILD);
    expect(texte(dd.content)).toContain(
      "Mit der Kamera scannen oder den Link antippen, um den Bogen digital zu übernehmen.",
    );
  });

  it("legt unter dem QR-Code einen anklickbaren App-Link auf QR-Bild und Text", () => {
    const dd = pdfDokument(basisBogen(), QR);
    // Alle pdfmake-Knoten flach durchgehen und die mit `link` einsammeln.
    const links: { text?: unknown; image?: unknown; link: string }[] = [];
    const sammle = (node: unknown): void => {
      if (Array.isArray(node)) node.forEach(sammle);
      else if (node && typeof node === "object") {
        if (typeof (node as { link?: unknown }).link === "string") {
          links.push(node as { link: string });
        }
        Object.values(node).forEach(sammle);
      }
    };
    sammle(dd.content);
    // Sowohl das QR-Bild als auch der Textlink verweisen auf die App-URL.
    expect(links.some((n) => n.link === QR_URL && n.image === QR_BILD)).toBe(true);
    expect(links.some((n) => n.link === QR_URL && n.text === "Bogen direkt in der App öffnen")).toBe(true);
  });

  it("zeigt bei Segmentierung mehrere QR-Bilder mit Teil x / n", () => {
    const segQr: QrSatz = {
      teile: [
        { datenUrl: "data:image/png;base64,TEIL1", url: "https://erfassungsbogen.app/#EEBS.1.2.99.AA", teilNr: 1, anzahl: 2, version: 20 },
        { datenUrl: "data:image/png;base64,TEIL2", url: "https://erfassungsbogen.app/#EEBS.2.2.99.BB", teilNr: 2, anzahl: 2, version: 20 },
      ],
      segmentiert: true,
      zeichen: 1800,
      version: 20,
      vollUrl: "https://erfassungsbogen.app/#EEBSVOLL",
      stufen: 1,
      weitergeleitet: false,
    };
    const dd = pdfDokument(basisBogen(), segQr);
    const roh = JSON.stringify(dd.content);
    expect(roh).toContain("TEIL1");
    expect(roh).toContain("TEIL2");
    const t = texte(dd.content).join("\n");
    expect(t).toContain("Teil 1 / 2");
    expect(t).toContain("Teil 2 / 2");
    expect(t).toContain("Alle 2 Teile nacheinander mit der Kamera scannen");
  });

  it("druckt Kopf, Einsatz, Zugehörigkeit und Stärke", () => {
    const t = texte(pdfDokument(basisBogen(), QR).content).join("\n");
    expect(t).toContain("Erfassungsbogen FGr K (A)");
    expect(t).toContain("THW");
    expect(t).toContain("Fernmeldebauübung Kabelblitz");
    expect(t).toContain("Oldenburg - Ni (OODE)");
    expect(t).toContain("1 / 0 / 1 / 2"); // Stärke: 1 Führer, 0 Unterführer, 1 Mannschaft, 2 gesamt
    expect(t).toContain("Johannes Rudolph"); // Ansprechpartner/in = erste Person
  });

  it("listet das Personal samt Kontakt und Qualifikation", () => {
    const t = texte(pdfDokument(basisBogen(), QR).content).join("\n");
    expect(t).toContain("Rudolph, Johannes");
    expect(t).toContain("Weber, Anna");
    expect(t).toContain("Mobil: 01701234501 (P)");
    expect(t).toContain("Bootsführer");
  });

  it("stellt Fahrzeug mit Kennzeichen, Funkruf und StAN-Angabe dar", () => {
    const t = texte(pdfDokument(basisBogen(), QR).content).join("\n");
    expect(t).toContain("MzKW");
    expect(t).toContain("THW-84397");
    // eigenerStandort → Ort = Name der untersten Ebene, Kennzahlen mit "/" verbunden.
    expect(t).toContain("FuRn:");
    expect(t).toContain("Oldenburg - Ni 18/13");
    expect(t).toContain("Ausstattung nach StAN: ja [X] / nein [  ]");
  });

  it("zeigt Sofortbedarf und Sonstiges, wenn vorhanden", () => {
    const t = texte(pdfDokument(basisBogen(), QR).content).join("\n");
    expect(t).toContain("Sofortbedarf:");
    expect(t).toContain("Verpflegung für 2 Personen, davon 0 vegetarisch, 1 vegan");
    expect(t).toContain("Sonstiges: Bitte Verpflegung ab 12 Uhr.");
  });

  it("lässt Sofortbedarf und Sonstiges weg, wenn nicht gesetzt", () => {
    const b = basisBogen();
    delete b.sofortbedarf;
    delete b.sonstiges;
    const t = texte(pdfDokument(b, QR).content).join("\n");
    expect(t).not.toContain("Sofortbedarf:");
    expect(t).not.toContain("Sonstiges:");
  });

  it("markiert den Meldekopf-Modus (NUR_STAERKE) mit Hinweis und manueller Stärke", () => {
    const b = basisBogen();
    b.personalErfassung = PersonalErfassung.NUR_STAERKE;
    b.personal = [];
    b.staerkeManuell = { fuehrer: 1, unterfuehrer: 3, mannschaft: 17, gesamt: 21 };
    const t = texte(pdfDokument(b, QR).content).join("\n");
    expect(t).toContain("Personal am Meldekopf nur in Stärke erfasst.");
    expect(t).toContain("1 / 3 / 17 / 21");
  });

  it("bettet den Bogen als maschinenlesbares JSON ein (ZUGFeRD-artig)", () => {
    const b = basisBogen();
    const dd = pdfDokument(b, QR);
    const dateien = (dd as { files?: Record<string, { src: string; relationship?: string }> }).files;
    const datei = dateien?.[EEB_JSON_DATEINAME];
    expect(datei).toBeDefined();
    expect(datei!.relationship).toBe("Alternative");
    expect(datei!.src).toMatch(/^data:application\/json;base64,/);

    // Data-URL zurück zu JSON dekodieren und mit dem Bogen vergleichen —
    // eingebettet wird die Transport-Version (5 ohne Übungs-Flag), damit
    // ältere App-Stände das JSON weiter lesen können.
    const base64 = datei!.src.split(",")[1]!;
    const json = new TextDecoder().decode(Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)));
    expect(JSON.parse(json)).toEqual(mitTransportVersion(b));
  });

  it("kennzeichnet Übungsbögen mit Wasserzeichen und Störer-Zeile", () => {
    const b = { ...basisBogen(), uebung: true };
    const dd = pdfDokument(b, QR);
    // Das Wasserzeichen liegt als SVG-Kontur hinter der Seite (nicht als Text,
    // sonst würde es beim Kopieren aus der PDF mitgenommen) — und pdfmakes
    // Text-Wasserzeichen bleibt ungenutzt.
    expect(dd.watermark).toBeUndefined();
    const grund = (dd.background as (s: number, g: { width: number; height: number }) => { svg: string })(1, {
      width: 595,
      height: 842,
    });
    expect(grund.svg).toContain("<path d=");
    expect(grund.svg).not.toContain("<text");
    expect(grund.svg).not.toContain("ÜBUNG");
    // Die erste Inhaltszeile ist die Störer-Zeile — sichtbar auch dort, wo das
    // Wasserzeichen untergeht (Schwarzweiß-Kopie, blasser Druck).
    expect(JSON.stringify((dd.content as unknown[])[0])).toContain("ÜBUNG");
    // Echte Bögen bleiben unangetastet.
    expect(pdfDokument(basisBogen(), QR).background).toBeUndefined();
  });

  it("kodiert Umlaute im eingebetteten JSON UTF-8-sauber", () => {
    const b = basisBogen();
    b.sonstiges = "Grüße an die Führungskräfte – Straße 5";
    const datei = bogenAlsEingebetteteDatei(b);
    const base64 = datei.src.split(",")[1]!;
    const json = new TextDecoder().decode(Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)));
    expect(JSON.parse(json).sonstiges).toBe("Grüße an die Führungskräfte – Straße 5");
  });

  it("erzeugt eine Fußzeile mit Stand und Seitenzahlen", () => {
    const dd = pdfDokument(basisBogen(), QR);
    const footer = dd.footer as (s: number, g: number) => unknown;
    const t = texte(footer(2, 5)).join("\n");
    expect(t).toContain("Stand: 141039mai26");
    expect(t).toContain("2 / 5");
  });
});

describe("einsatzPdfDokument()", () => {
  /** Zweite Meldung derselben Einheit: 1 Person und 1 Fahrzeug weniger, Ruhezeit nötig. */
  function folgeBogen(): Erfassungsbogen {
    const b = basisBogen();
    b.stand = zeitpunktAusIso("2026-05-15T08:00");
    b.personal = [b.personal[0]!];
    b.fahrzeuge = [];
    b.sofortbedarf = { ...b.sofortbedarf!, ruhezeitErforderlich: true };
    return b;
  }

  it("stellt der Sammlung eine Übersicht mit Änderungsspalte voran", () => {
    const dd = einsatzPdfDokument("Hochwasser", [
      { bogen: folgeBogen(), qr: QR, vorher: basisBogen() },
    ]);
    const t = texte(dd.content).join("\n");
    expect(t).toContain("Übergabe-Übersicht: Hochwasser");
    expect(t).toContain("Veränderung seit der letzten Meldung");
    expect(t).toContain("gegenüber 141039mai26:");
    expect(t).toContain("Gesamtstärke: 2 → 1");
    expect(t).toContain("Fahrzeug abgemeldet: MzKW (THW-84397)");
    expect(t).toContain("Ruhezeit erforderlich: nein → ja");
    // Die Übersicht steht vor dem ersten Bogen.
    expect(t.indexOf("Übergabe-Übersicht")).toBeLessThan(t.indexOf("Erfassungsbogen FGr K (A)"));
  });

  it("weist Erstmeldungen und unveränderte Folgemeldungen aus", () => {
    const t = texte(
      einsatzPdfDokument("Lage", [
        { bogen: basisBogen(), qr: QR },
        { bogen: basisBogen(), qr: QR, vorher: basisBogen() },
      ]).content,
    ).join("\n");
    expect(t).toContain("Erstmeldung");
    expect(t).toContain("unverändert gegenüber 141039mai26");
  });

  it("summiert Stärke und Fahrzeuge über alle Bögen", () => {
    const t = texte(
      einsatzPdfDokument("Lage", [
        { bogen: basisBogen(), qr: QR },
        { bogen: basisBogen(), qr: QR },
      ]).content,
    ).join("\n");
    expect(t).toContain("Summe (2 Einheiten)");
    expect(t).toContain("2 / 0 / 2 / 4");
  });

  it("legt die Übersicht quer und schaltet ab dem ersten Bogen zurück ins Hochformat", () => {
    const dd = einsatzPdfDokument("Lage", [
      { bogen: basisBogen(), qr: QR },
      { bogen: basisBogen(), qr: QR },
    ]);
    expect(dd.pageOrientation).toBe("landscape");
    const umbrueche = (dd.content as { pageBreak?: string; pageOrientation?: string }[]).filter(
      (c) => c && c.pageBreak === "before",
    );
    // Je Bogen ein Umbruch — und jeder stellt ausdrücklich auf Hochformat.
    expect(umbrueche).toHaveLength(2);
    expect(umbrueche.every((c) => c.pageOrientation === "portrait")).toBe(true);
  });

  it("weist Verpflegung, Unterbringung und Betriebsstoff als Gesamtbedarf aus", () => {
    const t = texte(
      einsatzPdfDokument("Lage", [
        { bogen: basisBogen(), qr: QR },
        { bogen: basisBogen(), qr: QR },
      ]).content,
    ).join("\n");
    expect(t).toContain("Bedarf gesamt (2 Einheiten, 4 Personen)");
    expect(t).toContain("4 Portionen (2 Fleisch / 0 vegetarisch / 2 vegan)");
    expect(t).toContain("M 2 / W 2 / D 0 · 2× Unterbringung angefordert");
    expect(t).toContain("Diesel 400 l · Benzin 0 l");
    expect(t).toContain("2 Fahrzeuge · Ruhezeit erforderlich bei 0 Einheit(en)");
  });

  it("zeigt Zwischensummen erst ab zwei Zügen — und stellt „ohne Zug“ ans Ende", () => {
    const einZug = texte(
      einsatzPdfDokument("Lage", [{ bogen: basisBogen(), qr: QR, zugEtikett: "1. Zug" }]).content,
    ).join("\n");
    expect(einZug).not.toContain("Zwischensummen nach Zug");

    const t = texte(
      einsatzPdfDokument("Lage", [
        { bogen: basisBogen(), qr: QR },
        { bogen: basisBogen(), qr: QR, zugEtikett: "2. Zug" },
        { bogen: basisBogen(), qr: QR, zugEtikett: "1. Zug" },
      ]).content,
    ).join("\n");
    expect(t).toContain("Zwischensummen nach Zug");
    expect(t.indexOf("1. Zug")).toBeLessThan(t.indexOf("2. Zug"));
    expect(t.indexOf("2. Zug")).toBeLessThan(t.indexOf("Ohne Zug"));
  });
});
