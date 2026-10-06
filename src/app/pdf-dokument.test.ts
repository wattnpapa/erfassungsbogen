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
} from "@bos/eeb-format/model";
import { zeitgruppe, type QrSatz } from "./hilfen";
import { EEB_JSON_DATEINAME, aenderungFuerPapier, bogenAlsEingebetteteDatei, einsatzLageblattDokument, einsatzPdfDokument, pdfDokument, stiftHinweis } from "./pdf-dokument";

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

  it("sagt neben dem Code, dass Stiftkorrekturen nicht im Code stecken — mit Stand und Kästchen (R2-A4)", () => {
    const b = basisBogen();
    const t = texte(pdfDokument(b, QR).content).join("\n");
    expect(t).toContain(stiftHinweis(zeitgruppe(b.stand)));
    expect(stiftHinweis("170805jul26")).toBe(
      "[  ] von Hand geändert — dann gilt der Code (Stand 170805jul26) nicht mehr: abtippen oder neu erzeugen, nicht scannen.",
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
    // Auch bei Segmentierung gibt es einen anklickbaren Link — er trägt den
    // vollständigen Bogen (vollUrl), nicht einen einzelnen Teil.
    expect(t).toContain("Bogen direkt in der App öffnen");
    expect(roh).toContain("https://erfassungsbogen.app/#EEBSVOLL");
  });

  it("macht bei Segmentierung jedes Teilbild anklickbar — mit dem vollständigen Bogen", () => {
    const segQr: QrSatz = {
      teile: [
        { datenUrl: "data:image/png;base64,TEIL1", url: "https://erfassungsbogen.app/#EEBS.1.3.99.AA", teilNr: 1, anzahl: 3, version: 20 },
        { datenUrl: "data:image/png;base64,TEIL2", url: "https://erfassungsbogen.app/#EEBS.2.3.99.BB", teilNr: 2, anzahl: 3, version: 20 },
        { datenUrl: "data:image/png;base64,TEIL3", url: "https://erfassungsbogen.app/#EEBS.3.3.99.CC", teilNr: 3, anzahl: 3, version: 20 },
      ],
      segmentiert: true,
      zeichen: 2700,
      version: 20,
      vollUrl: "https://erfassungsbogen.app/#EEBSVOLL",
      stufen: 1,
      weitergeleitet: false,
    };
    const dd = pdfDokument(basisBogen(), segQr);
    const bilder: { image: string; link?: unknown }[] = [];
    const sammle = (node: unknown): void => {
      if (Array.isArray(node)) node.forEach(sammle);
      else if (node && typeof node === "object") {
        if (typeof (node as { image?: unknown }).image === "string") bilder.push(node as { image: string });
        Object.values(node).forEach(sammle);
      }
    };
    sammle(dd.content);
    const qrBilder = bilder.filter((b) => b.image.startsWith("data:image/png;base64,TEIL"));
    expect(qrBilder).toHaveLength(3);
    // Jedes Teilbild trägt den Link auf den KOMPLETTEN Bogen — nicht die
    // Teil-URL, die nur einen Abschnitt enthält. Ein Klick aufs Bild in der
    // digitalen PDF muss dasselbe tun wie der Textlink darunter.
    for (const b of qrBilder) expect(b.link).toBe("https://erfassungsbogen.app/#EEBSVOLL");
    expect(qrBilder.some((b) => typeof b.link === "string" && b.link.includes("EEBS."))).toBe(false);
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

  it("gibt überlangen Wörtern (E-Mail-Adressen) unsichtbare Umbruchstellen, damit die Kopftabelle nicht ausbricht", () => {
    const b = basisBogen();
    b.einheit.hierarchie.push({
      bezeichnung: { freitext: "RB" },
      name: "Villingen-Schwenningen",
      telefon: "5558642829",
      email: "Poststelle.RSt_Vschwenningen@thw.de",
    });
    b.einsatz.ortAuftrag = "Bereitstellungsraum-Laufenburg-Gesamtkoordinierung";
    const t = texte(pdfDokument(b, QR).content).join("\n");
    // Die lange Adresse muss mit Nullbreiten-Leerzeichen (U+200B) durchsetzt
    // sein — nur so kann pdfmake sie umbrechen, statt die Spalte (und damit
    // die Tabelle) über den Satzspiegel hinaus zu verbreitern.
    expect(t).toContain("Poststelle.\u200BRSt_\u200BVschwenningen@\u200Bthw.\u200Bde");
    expect(t).toContain("Bereitstellungsraum-\u200BLaufenburg-\u200BGesamtkoordinierung");
    // Kurze Wörter bleiben unangetastet.
    expect(t).toContain("ov@thw.de");
  });

  it("hält das eingebettete JSON frei von den Umbruch-Hilfszeichen", () => {
    const b = basisBogen();
    b.einheit.hierarchie[0]!.email = "Poststelle.RSt_Vschwenningen@thw.de";
    const dd = pdfDokument(b, QR);
    const datei = (dd as { files?: Record<string, { src: string }> }).files?.[EEB_JSON_DATEINAME];
    const base64 = datei!.src.split(",")[1]!;
    const json = new TextDecoder().decode(Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)));
    expect(json).toContain("Poststelle.RSt_Vschwenningen@thw.de");
    expect(json).not.toContain("\u200B");
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
    // Lesbare Zeit und „von … auf …" statt Pfeil — Helvetica kennt „→" nicht,
    // im Ausdruck stand „!" (Audit Runde 2, R2-K3).
    expect(t).toContain("gegenüber 14.05.2026, 10:39:");
    expect(t).toContain("Gesamtstärke: von 2 auf 1");
    expect(t).toContain("Fahrzeug abgemeldet: MzKW (THW-84397)");
    expect(t).toContain("Ruhezeit erforderlich: von nein auf ja");
    expect(t).not.toContain("→");
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
    expect(t).toContain("unverändert gegenüber 14.05.2026, 10:39");
  });

  it("summiert Stärke und Fahrzeuge über alle Bögen", () => {
    const t = texte(
      einsatzPdfDokument("Lage", [
        { bogen: basisBogen(), qr: QR },
        { bogen: basisBogen(), qr: QR },
      ]).content,
    ).join("\n");
    expect(t).toContain("Summe (2 zählend)");
    expect(t).toContain("2 / 0 / 2 / 4");
  });

  it("führt abgerückte Einheiten in einem eigenen Block mit Zeiten auf und zählt sie nicht", () => {
    // Papier und eingebettete Datei müssen dasselbe sagen: Crailsheim war da
    // und ist wieder weg — auf dem Blatt stand davon bisher nichts (A1).
    const eingetroffen = new Date("2026-09-26T09:40").getTime();
    const abgerueckt = new Date("2026-09-27T15:10").getTime();
    const t = texte(
      einsatzPdfDokument("Lage", [
        { bogen: basisBogen(), qr: QR, eingetroffenAm: eingetroffen, notiz: "Deichabschnitt Nord" },
        { bogen: basisBogen(), qr: QR, eingetroffenAm: eingetroffen, abgerueckAm: abgerueckt, abgerueckt: true },
      ]).content,
    ).join("\n");
    expect(t).toContain("Eingetroffen");
    expect(t).toContain("Abgerückt (1)");
    expect(t).toContain("26.09.2026, 09:40");
    expect(t).toContain("27.09.2026, 15:10");
    expect(t).toContain("Auftrag / Notiz");
    expect(t).toContain("Deichabschnitt Nord");
    expect(t).toContain("Summe (1 zählend · 1 abgerückt)");
    // Stärke und Bedarf nur über die zählende Einheit.
    expect(t).toContain("1 / 0 / 1 / 2");
    expect(t).toContain("Bedarf gesamt (1 Einheiten, 2 Personen)");
    // Beide Bögen hängen trotzdem an — „alle Bögen" heißt alle.
    const umbrueche = (einsatzPdfDokument("Lage", [
      { bogen: basisBogen(), qr: QR },
      { bogen: basisBogen(), qr: QR, abgerueckt: true },
    ]).content as { pageBreak?: string }[]).filter((c) => c && c.pageBreak === "before");
    expect(umbrueche).toHaveLength(2);
  });

  it("kennzeichnet eine nicht zählende Übung und rechnet ohne sie", () => {
    const u = basisBogen();
    u.uebung = true;
    const t = texte(
      einsatzPdfDokument("Lage", [
        { bogen: basisBogen(), qr: QR },
        { bogen: u, qr: QR, zaehlt: false },
      ]).content,
    ).join("\n");
    expect(t).toContain("zählt nicht in diese Lage");
    expect(t).toContain("Summe (1 zählend · 1 Übung)");
  });

  it("erzeugt auch ohne eine einzige Meldung ein Dokument", () => {
    // Am Einsatzende sind alle abgerückt — die Datei ist dann die Übergabe
    // ans Archiv und darf sich nicht verweigern (W2).
    const dd = einsatzPdfDokument("Lage", [], "{}");
    const t = texte(dd.content).join("\n");
    expect(t).toContain("Übergabe-Übersicht: Lage");
    expect(t).toContain("Summe (0 zählend)");
    expect(dd.files).toBeDefined();
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
    // Quartier und WC/Dusche getrennt beschriftet (R3-K4).
    expect(t).toContain("Unterbringung angefordert:\n2 Einheiten, 4 Personen (2 männl. / 2 weibl. / 0 div.)");
    expect(t).toContain("WC/Dusche (alle Anwesenden):\n2 männl. / 2 weibl. / 0 div.");
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
    const zs = t.slice(t.indexOf("Zwischensummen nach Zug"));
    expect(zs.indexOf("1. Zug")).toBeLessThan(zs.indexOf("2. Zug"));
    expect(zs.indexOf("2. Zug")).toBeLessThan(zs.indexOf("Ohne Zug"));
  });
});

describe("einsatzPdfDokument() — Stand am Meldekopf auf den Bogenseiten (R2-A1)", () => {
  const eingetroffen = new Date("2026-09-28T14:05").getTime();
  const abgerueckt = new Date("2026-09-28T16:30").getTime();
  const erstellt = new Date("2026-09-28T17:00").getTime();
  const QR3: QrSatz = {
    ...QR,
    teile: [1, 2, 3].map((n) => ({ datenUrl: `${QR_BILD}${n}`, url: `${QR_URL}${n}`, teilNr: n, anzahl: 3, version: 20 })),
    segmentiert: true,
  };

  /** Text ab dem n-ten Bogen (nach dem n-ten Seitenumbruch) bis zum nächsten. */
  function bogenTexte(dd: ReturnType<typeof einsatzPdfDokument>): string[] {
    const bloecke: unknown[][] = [];
    for (const c of dd.content as { pageBreak?: string; pageOrientation?: string }[]) {
      if (c && c.pageBreak === "before" && c.pageOrientation === "portrait") bloecke.push([]);
      else if (bloecke.length > 0) bloecke[bloecke.length - 1]!.push(c);
    }
    return bloecke.map((b) => texte(b).join("\n"));
  }

  it("vermerkt Eintreffzeit, Abrückvermerk, Zug und Auftrag über jedem Bogen", () => {
    const dd = einsatzPdfDokument(
      "Hochwasser Albtal",
      [
        { bogen: basisBogen(), qr: QR, eingetroffenAm: eingetroffen, zugEtikett: "1. Zug", notiz: "Deich Nord" },
        { bogen: basisBogen(), qr: QR3, eingetroffenAm: eingetroffen, abgerueckAm: abgerueckt, abgerueckt: true },
      ],
      undefined,
      erstellt,
    );
    const [albstadt, biberach] = bogenTexte(dd);
    expect(albstadt).toContain(
      "Stand am Meldekopf (Hochwasser Albtal, erstellt 28.09.2026, 17:00): Eingetroffen 28.09.2026, 14:05 · anwesend · Zug: 1. Zug · Auftrag / Notiz: Deich Nord",
    );
    expect(biberach).toContain("Eingetroffen 28.09.2026, 14:05 · ABGERÜCKT 28.09.2026, 16:30 · Zug: – · Auftrag / Notiz: –");
    // Der Kasten steht vor dem Formular — also auf der ersten Seite des Bogens.
    expect(albstadt!.indexOf("Stand am Meldekopf")).toBeLessThan(albstadt!.indexOf("Erfassungsbogen FGr K (A)"));
  });

  it("sagt neben jedem QR-Code, dass er nur den Bogen enthält — auch auf jeder Seite eines mehrteiligen Codes", () => {
    const dd = einsatzPdfDokument(
      "Lage",
      [
        { bogen: basisBogen(), qr: QR, eingetroffenAm: eingetroffen },
        { bogen: basisBogen(), qr: QR3, eingetroffenAm: eingetroffen, abgerueckAm: abgerueckt, abgerueckt: true },
      ],
      undefined,
      erstellt,
    );
    const [einteilig, dreiteilig] = bogenTexte(dd);
    const hinweis = "Der Code enthält nur den Bogen der Einheit.";
    expect(einteilig!.split(hinweis)).toHaveLength(2);
    // Drei Teile → zwei QR-Seiten, jede mit Hinweis und Stand (ABGERÜCKT).
    expect(dreiteilig!.split(hinweis)).toHaveLength(3);
    expect(dreiteilig!.split("ABGERÜCKT 28.09.2026, 16:30")).toHaveLength(4); // Kasten oben + 2 QR-Seiten
    expect(dreiteilig).toContain("nach dem Einlesen von Hand nachtragen");
    expect(dreiteilig).toContain("„Einsatz importieren…“");
  });

  it("trägt den Stand des Ausdrucks in der Fußzeile jeder Seite", () => {
    const dd = einsatzPdfDokument("Lage", [{ bogen: basisBogen(), qr: QR }], undefined, erstellt);
    const fuss = (dd.footer as (s: number, g: number) => unknown)(3, 4);
    const t = texte(fuss).join(" ");
    expect(t).toContain("Einsatz-Sammlung: Lage · Stand 28.09.2026, 17:00");
    expect(t).toContain("Seite 1 und Kasten über jedem Bogen");
  });

  it("lässt den Einzelbogen außerhalb der Sammlung ohne Meldekopf-Vermerk", () => {
    const t = texte(pdfDokument(basisBogen(), QR).content).join("\n");
    expect(t).not.toContain("Stand am Meldekopf");
    expect(t).not.toContain("Der Code enthält nur den Bogen");
  });
});

describe("einsatzLageblattDokument()", () => {
  it("liefert nur die Übersichtsseite quer — ohne Bögen, QR und Anhang", () => {
    const dd = einsatzLageblattDokument("Hochwasser", [
      { bogen: basisBogen(), eingetroffenAm: new Date("2026-09-27T09:40").getTime() },
      { bogen: basisBogen(), zugEtikett: "1. Zug" },
    ], new Date("2026-09-27T20:19").getTime());
    const t = texte(dd.content).join("\n");
    expect(dd.pageOrientation).toBe("landscape");
    expect(t).toContain("Lageblatt: Hochwasser");
    expect(t).toContain("Erstellt 27.09.2026, 20:19");
    expect(t).toContain("27.09.2026, 09:40");
    expect(t).toContain("Bedarf gesamt (2 Einheiten, 4 Personen)");
    expect(t).toContain("Zwischensummen nach Zug");
    // Kein Bogen, kein QR-Code, keine eingebettete Datei.
    expect(t).not.toContain("Erfassungsbogen FGr K (A)");
    expect(t).not.toContain(QR_BILD);
    expect(dd.files).toBeUndefined();
    expect((dd.content as { pageBreak?: string }[]).some((c) => c && c.pageBreak === "before")).toBe(false);
  });

  it("beschriftet die Stärke-Linien des Blanko-Vordrucks (R2-A6)", () => {
    const blanko = texte(pdfDokument(basisBogen(), null, { fahrzeuge: 1, personal: 1, qualifikationen: 1 }).content).join("\n");
    expect(blanko).toContain("Stärke (F / UF / M / Ges.):");
    // Seit R3-A6 auch auf dem ausgefüllten Bogen — gleiche Beschriftung wie der Vordruck.
    const voll = texte(pdfDokument(basisBogen(), QR).content).join("\n");
    expect(voll).toContain("Stärke (F / UF / M / Ges.):");
  });

  it("stellt die laufende Nummer der Meldung vor den Namen, wie an der Karte (R2-A6)", () => {
    const t = texte(
      einsatzLageblattDokument("Lage", [
        { bogen: basisBogen(), nummer: 3 },
        { bogen: basisBogen() },
      ]).content,
    ).join("\n");
    expect(t).toContain("Nr. 3  ");
    expect(t.match(/Nr\. \d/g)).toHaveLength(1);
  });

  it("zeigt Zug und Bedarf je Einheit und Änderungen ohne Pfeil (R2-K3)", () => {
    const ruhe = basisBogen();
    ruhe.sofortbedarf = { ...ruhe.sofortbedarf!, ruhezeitErforderlich: true, dieselLiter: 200 };
    const vorher = basisBogen();
    vorher.sofortbedarf = { ...vorher.sofortbedarf!, dieselLiter: 50 };
    const t = texte(
      einsatzLageblattDokument("Lage", [{ bogen: ruhe, vorher, zugEtikett: "1. TZ" }]).content,
    ).join("\n");
    expect(t).toContain("1. TZ");
    expect(t).toMatch(/Ruhezeit\n · [\s\S]*Diesel 200 l/);
    expect(t).toMatch(/von 50 l auf 200 l/);
    expect(t).not.toContain("→");
  });

  it("ist ein Blatt zum Weiterführen: Funkrufname, Rückruf und freie Zeilen (R2-A3)", () => {
    const dd = einsatzLageblattDokument("Lage", [{ bogen: basisBogen(), zugEtikett: "1. TZ" }]);
    const t = texte(dd.content).join("\n").replace(/\u200B/g, "");
    expect(t).toContain("Funkrufname /\nRückruf");
    expect(t).toContain("Oldenburg - Ni 18/13");
    expect(t).toContain("01701234501 (J. Rudolph)");
    expect(t).toContain("Nachtrag von Hand");
    // Mindestens fünf Nachtragszeilen (R3-A5); den Rest der Seite füllt
    // einsatzLageblattSeiteFuellen (gemessen in pdf-seiten.test.ts).
    const leer = JSON.stringify(dd.content).match(/\{"text":" ","margin":\[0,5,0,5\]/g) ?? [];
    expect(leer.length).toBe(5 * 10);
    // Unter der gedruckten Summe ein Feld für die fortgeschriebene (R3-A5).
    expect(t).toContain("Summe laut Gerät (1 zählend)");
    expect(t).toContain("Summe einschl. Nachträge (von Hand)");
    // Die Übergabe-Übersicht der Sammel-PDF bleibt ohne diese Zusätze.
    const u = texte((einsatzPdfDokument("Lage", [{ bogen: basisBogen(), qr: QR }]).content as unknown[]).slice(0, 3)).join("\n");
    expect(u).not.toContain("Nachtrag von Hand");
  });

  it("führt die Zählrolle je Person im Einzel-PDF (R3-A6)", () => {
    const dd = pdfDokument(basisBogen(), QR);
    const t = texte(dd.content).join("\n");
    expect(t).toContain("Rolle\nF/UF/M");
    // Johannes Rudolph ist Führer, Anna Weber Mannschaft.
    expect(t).toMatch(/\nF\ncenter\nRudolph, Johannes\n/);
    expect(t).toMatch(/\nM\ncenter\nWeber, Anna\n/);
    // Ohne Messung keine freien Zeilen — die gibt es nur über einzelPdfDokument.
    expect(JSON.stringify(dd.content)).not.toContain('"text":" ","margin":[0,5,0,5]');
    const frei = pdfDokument(basisBogen(), QR, undefined, undefined, { freiePersonalZeilen: 2, freiesFahrzeug: true });
    expect(JSON.stringify(frei.content).match(/"text":" ","margin":\[0,5,0,5\]/g)).toHaveLength(8);
    expect(texte(frei.content)).toContain("Kennzeichen:");
  });

  it("schreibt Änderungen fürs Papier als „von … auf …“", () => {
    expect(aenderungFuerPapier("Diesel: 50 l → 200 l")).toBe("Diesel: von 50 l auf 200 l");
    expect(aenderungFuerPapier("Unterbringung M/W/D: M 8 / W 3 / D 0 → M 7 / W 2 / D 0")).toBe(
      "Unterbringung M/W/D: von M 8 / W 3 / D 0 auf M 7 / W 2 / D 0",
    );
    expect(aenderungFuerPapier("Personal neu: Anna Weber")).toBe("Personal neu: Anna Weber");
  });

  it("führt die Bemerkung der Einheit unter dem Auftrag, auf dem Lageblatt gekürzt (R3-K3)", () => {
    const b = basisBogen();
    b.sonstiges = "Ölsperre 200 m verbraucht, Nachschub nötig";
    const lang = basisBogen();
    lang.sonstiges = "x".repeat(300);
    const t = texte(
      einsatzLageblattDokument("Lage", [{ bogen: b, notiz: "Ölsperre Kocher km 12" }, { bogen: lang }]).content,
    ).join("\n").replace(/\u200B/g, "");
    expect(t).toContain("Auftrag / Notiz\n(Bemerkung der Einheit)");
    expect(t).toContain("Ölsperre Kocher km 12");
    expect(t).toContain("(Ölsperre 200 m verbraucht, Nachschub nötig)");
    expect(t).toContain(`(${"x".repeat(70)} …)`);
  });

  /**
   * R4-K3: Auf dem Papier darf keine Rückfrage mitten im Satz abbrechen und
   * keine hinter „+ 2 weitere" verschwinden: Das Lageblatt nennt jeden Punkt
   * als Stichwort, die Sammel-PDF die ganzen Sätze.
   */
  it("nennt alle Rückfragen: Lageblatt als Stichworte, Sammel-PDF im Wortlaut (R4-K3)", () => {
    const b = basisBogen();
    b.sofortbedarf = { ...b.sofortbedarf!, verpflegungPersonen: b.personal.length + 8 };
    b.fahrzeuge = [{ typ: { freitext: "MTW" }, kennzeichen: "" }, ...b.fahrzeuge];
    const lage = texte(einsatzLageblattDokument("Lage", [{ bogen: b }]).content).join("\n").replace(/\u200B/g, "");
    expect(lage).toMatch(/Rückfrage: .*Verpflegung \d+ ≠ Stärke \d+/);
    expect(lage).not.toContain("weitere");
    expect(/Rückfrage: [^\n]*/.exec(lage)![0]).not.toContain("…");
    const sammel = texte(einsatzPdfDokument("Lage", [{ bogen: b, qr: QR }]).content)
      .join("\n")
      .replace(/\u200B/g, "");
    expect(sammel).toMatch(/Rückfragen \(\d+\)/);
    expect(sammel).toContain("Verpflegung für");
    expect(sammel).toContain("hat noch kein Kennzeichen");
  });

  it("stellt Stärke und Bedarf als Kopfleiste vor die Tabelle, Dringendes fett, Gesamtstärke zuerst (R3-K6)", () => {
    const ruhe = basisBogen();
    ruhe.sofortbedarf = { ...ruhe.sofortbedarf!, ruhezeitErforderlich: true, unterbringung: false, dieselLiter: 80 };
    const vorher = structuredClone(ruhe);
    vorher.personal = [...vorher.personal, structuredClone(vorher.personal[1]!), structuredClone(vorher.personal[1]!)];
    vorher.personal[vorher.personal.length - 1]!.nachname = "Zusatz";
    vorher.personal[vorher.personal.length - 2]!.nachname = "Extra";
    const dd = einsatzLageblattDokument("Lage", [{ bogen: ruhe, vorher }]);
    const inhalt = dd.content as unknown[];
    // Kopfleiste direkt nach dem Titel, vor der Einheitentabelle.
    const kopf = texte(inhalt[1]).filter((x) => x !== "*").join("");
    expect(kopf).toMatch(/^Lage: 1 Einheit zählend · Stärke F \/ U \/ M \/ G \d+ \/ \d+ \/ \d+ \/ \d+ · 1 Fahrzeuge/);
    expect(kopf).toContain("Bedarf: Verpflegung");
    expect(kopf).toContain("Ruhezeit: 1 Einheit");
    expect(kopf).toContain("Diesel 80 l");
    // Bedarf je Einheit: Ruhezeit fett, Diesel nicht.
    const json = JSON.stringify(inhalt[2]);
    expect(json).toContain('{"text":"Ruhezeit","bold":true}');
    expect(json).toContain('{"text":"Diesel 80 l"}');
    // Änderungen: die Gesamtstärke zuerst.
    const t = texte(inhalt[2]).join("\n");
    expect(t).toMatch(/gegenüber .*:\nGesamtstärke: von \d+ auf \d+\n… und \d+ weitere Änderungen/);
  });

  it("sagt auf einem leeren Blatt, dass noch nichts gemeldet ist", () => {
    const t = texte(einsatzLageblattDokument("Lage", []).content).join("\n");
    expect(t).toContain("Noch keine Einheit gemeldet.");
    // Strichliste ohne vorgedruckte Nullen (R3-A5).
    expect(t).toContain("Summe (von Hand)");
    expect(t).not.toContain("zählend");
    expect(t).not.toMatch(/\b0 \/ 0|0 Portionen|Diesel 0 l/);
    expect(t).toContain("Stärke F / U / M / G ____ / ____ / ____ / ____");
    expect(t).toContain("Bedarf gesamt (von Hand)");
  });
});
