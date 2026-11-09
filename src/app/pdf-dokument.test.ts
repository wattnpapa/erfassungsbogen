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
import { einheitAnzeigename, orgLabel, neuePerson, neuesFahrzeug, zeitgruppe, type QrSatz } from "./hilfen";
import { EEB_JSON_DATEINAME, bogenAlsEingebetteteDatei, pdfDokument, stiftHinweis, STIFT_KAESTCHEN, codeKopfzeile, ohneVorbelegung, erreichbarkeitZeilen, nichtDarstellbareNamen, nichtDarstellbareBetroffene, ansprechpersonPapier, umschrift, umschriftBetroffene } from "./pdf-dokument";
import { THW_LOGO_JPEG } from "./pdf-logo-thw";
import { ORG_LOGOS } from "./pdf-logos";

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
    // Mit Einheit und Stand: ein im Tab angezeigter Bogen hat keinen Dateinamen (R16-A3).
    expect((dd.info as { title: string }).title).toMatch(/^Erfassungsbogen .*FGr K \(A\), Stand \d{2}\.\d{2}\.\d{4}, \d{2}:\d{2}$/);
    // Das übergebene QR-Bild muss unverändert im Dokument landen.
    expect(JSON.stringify(dd.content)).toContain(QR_BILD);
    expect(texte(dd.content)).toContain(
      "Mit der Kamera scannen oder den Link antippen, um den Bogen digital zu übernehmen.",
    );
  });

  it("sagt neben dem Code, dass Stiftkorrekturen nicht im Code stecken — mit Stand (R2-A4); das Kästchen steht beim Bogen (R4-A5)", () => {
    const b = basisBogen();
    const t = texte(pdfDokument(b, QR).content).join("\n");
    expect(t).toContain(stiftHinweis(zeitgruppe(b.stand)));
    expect(stiftHinweis("170805jul26")).toBe(
      "Ist oben auf dem Bogen „von Hand geändert“ angekreuzt, gilt dieser Code (Stand 170805jul26) nicht mehr: abtippen oder neu erzeugen, nicht scannen.",
    );
    // Das Kästchen steht einmal, und zwar neben der Stärke auf dem Bogen — nicht auf der Codeseite.
    expect(t.split(STIFT_KAESTCHEN)).toHaveLength(2);
    const inhalt = pdfDokument(b, QR).content as unknown[];
    const kopfTabelle = JSON.stringify(inhalt.slice(0, 3));
    expect(kopfTabelle).toContain(STIFT_KAESTCHEN);
    // Ohne Code (Vordruck, Bogen ohne QR) gibt es nichts, was durch Handschrift ungültig würde.
    expect(texte(pdfDokument(b, null).content).join("\n")).not.toContain(STIFT_KAESTCHEN);
  });

  it("jede Codeseite nennt Einheit, Funkrufname und Stand — Einzelcode und mehrteilig (R4-A5)", () => {
    const b = basisBogen();
    const kopf = codeKopfzeile(b, zeitgruppe(b.stand), 7);
    expect(kopf).toContain("Nr. 7");
    expect(kopf).toContain(einheitAnzeigename(b.einheit));
    expect(kopf).toContain(`Stand ${zeitgruppe(b.stand)}`);
    expect(kopf).toMatch(/FuRn /);
    const einzel = texte(pdfDokument(b, QR).content);
    expect(einzel.filter((z) => z.startsWith(einheitAnzeigename(b.einheit)) && z.includes("Stand "))).toHaveLength(1);
    const seg: QrSatz = {
      teile: [1, 2, 3].map((n) => ({ datenUrl: QR_BILD, url: `https://erfassungsbogen.app/#EEBS.${n}.3`, teilNr: n, anzahl: 3, version: 20 })),
      segmentiert: true,
      zeichen: 2700,
      version: 20,
      vollUrl: "https://erfassungsbogen.app/#V",
      stufen: 1,
      weitergeleitet: false,
    };
    // 3 Teile = 2 Codeseiten, jede mit eigener Kopfzeile.
    const mehr = texte(pdfDokument(b, seg).content);
    expect(mehr.filter((z) => z.includes(einheitAnzeigename(b.einheit)) && z.includes("Stand "))).toHaveLength(2);
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
    expect(t).toContain("1 / 0 / 1 // 2"); // Stärke: 1 Führer, 0 Unterführer, 1 Mannschaft, 2 gesamt
    expect(t).toContain("Johannes Rudolph"); // Ansprechpartner/in = erste Person
  });

  it("listet das Personal samt Kontakt und Qualifikation", () => {
    const t = texte(pdfDokument(basisBogen(), QR).content).join("\n");
    expect(t).toContain("Rudolph, Johannes");
    expect(t).toContain("Weber, Anna");
    expect(t).toContain("Mobil: 01701234501 (P)");
    expect(t).toContain("Bootsführer");
  });

  it("nennt den Funkrufname einer Person ohne (D)/(P) — in der Personaltabelle und auf dem Lageblatt (Schema 12)", () => {
    const b = basisBogen();
    b.personal[0]!.kontakte = [
      { art: KontaktArt.MOBIL, dienstlich: true, wert: "01701234501" },
      { art: KontaktArt.FUNK, dienstlich: true, wert: "Heros Oldenburg 18/13-1" },
    ];
    const t = texte(pdfDokument(b, QR).content).join("\n");
    expect(t).toContain("Funk: Heros Oldenburg 18/13-1");
    expect(t).not.toContain("Funk: Heros Oldenburg 18/13-1 (");
    const zeilen = erreichbarkeitZeilen(b);
    expect(zeilen).toContain("01701234501 (D) J. Rudolph");
    expect(zeilen).toContain("Heros Oldenburg 18/13-1 (Funk) J. Rudolph");
    // Nur Funk, keine Rufnummer: der OV-Rückruf bleibt die Telefonzeile, der Funkrufname kommt dazu.
    b.personal[0]!.kontakte = [{ art: KontaktArt.FUNK, dienstlich: true, wert: "Heros Oldenburg 18/13-1" }];
    expect(erreichbarkeitZeilen(b)).toEqual(expect.arrayContaining(["04413401050 (OV)", "Heros Oldenburg 18/13-1 (Funk) J. Rudolph"]));
  });

  /**
   * Rückmeldung aus einem THW-Ortsverband: Beruf UND Qualifikation gehören in
   * die Tabelle „weitere interne / externe Qualifikationen". Die Berufe stehen
   * als ein „Beruf: …"-Block hinter den Qualifikationen, egal in welcher
   * Reihenfolge der Bogen sie führt.
   */
  it("schreibt Berufe als eigenen Block hinter die Qualifikationen derselben Person", () => {
    const b = basisBogen();
    b.personal[0]!.zusatzqualifikationen = [
      { freitext: "Beruf: Elektroniker/in" },
      { freitext: "Bootsführer" },
      { freitext: "Beruf: Dachdecker/in" },
    ];
    b.personal[1]!.zusatzqualifikationen = [{ freitext: "Beruf: Zimmerer/in" }];
    const t = texte(pdfDokument(b, QR).content).join("\n");
    expect(t).toContain("Bootsführer, Beruf: Elektroniker/in, Dachdecker/in");
    expect(t).toContain("Weber, Anna");
    expect(t).toContain("Beruf: Zimmerer/in");
  });

  it("nennt eine abweichende Dienststelle als „OV:“-Zeile in der Kontaktspalte, die der Einheit nicht", () => {
    const b = basisBogen();
    b.personal[1]!.dienststelle = "Bremen - Nord";
    const t = texte(pdfDokument(b, QR).content).join("\n");
    expect(t).toContain("OV: Bremen - Nord\n");
    // Die erste Person kommt aus der Dienststelle der Einheit: keine OV-Zeile, Name unverändert.
    expect(t).toContain("Rudolph, Johannes");
    expect(t).not.toContain("OV: Oldenburg");
    expect(t).not.toContain("(Bremen - Nord)");
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
    expect(t).toContain("Verpflegung für 2 Personen, davon 1 vegan");
    expect(t).toContain("Sonstiges: Bitte Verpflegung ab 12 Uhr.");
  });

  it("druckt beim Sofortbedarf nur, was angefordert ist — keine Nullzeilen (OV Chemnitz, 11/2026)", () => {
    const b = basisBogen();
    b.sofortbedarf = { verpflegungPersonen: 0, dieselLiter: 0, benzinLiter: 0, gemischLiter: 0, unterbringung: true, ruhezeitErforderlich: true };
    const t = texte(pdfDokument(b, QR).content).join("\n");
    expect(t).toContain("Sofortbedarf:");
    expect(t).not.toContain("Verpflegung für");
    expect(t).not.toContain("Betriebsstoff");
    expect(t).toContain("[X]  Unterbringung");
    expect(t).toContain("[X]  Ruhezeit erforderlich");
    expect(t).not.toMatch(/\[ {2}\] {1,2}(Unterbringung|Ruhezeit)/);
  });

  it("druckt den Sitzplatz-Richtwert gekennzeichnet, eine erfasste Zahl ohne Zusatz (OV Chemnitz, 11/2026)", () => {
    const b = basisBogen();
    expect(texte(pdfDokument(b, QR).content).join("\n")).toMatch(/Sitzplätze: \d+ \(Richtwert\)/);
    b.fahrzeuge[0]!.sitzplaetze = 4;
    const t = texte(pdfDokument(b, QR).content).join("\n");
    expect(t).toContain("Sitzplätze: 4");
    expect(t).not.toContain("(Richtwert)");
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
    expect(t).toContain("1 / 3 / 17 // 21");
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

describe("einsatzPdfDokument() — Stand am Meldekopf auf den Bogenseiten (R2-A1)", () => {
  const eingetroffen = new Date("2026-09-28T14:05").getTime();
  const abgerueckt = new Date("2026-09-28T16:30").getTime();
  const erstellt = new Date("2026-09-28T17:00").getTime();
  const QR3: QrSatz = {
    ...QR,
    teile: [1, 2, 3].map((n) => ({ datenUrl: `${QR_BILD}${n}`, url: `${QR_URL}${n}`, teilNr: n, anzahl: 3, version: 20 })),
    segmentiert: true,
  };

  it("lässt den Einzelbogen außerhalb der Sammlung ohne Meldekopf-Vermerk", () => {
    const t = texte(pdfDokument(basisBogen(), QR).content).join("\n");
    expect(t).not.toContain("Stand am Meldekopf");
    expect(t).not.toContain("Der Code enthält nur den Bogen");
  });
});

describe("einsatzLageblattDokument()", () => {

  it("beschriftet die Stärke-Linien des Blanko-Vordrucks (R2-A6)", () => {
    const blanko = texte(pdfDokument(basisBogen(), null, { fahrzeuge: 1, personal: 1, qualifikationen: 1 }).content).join("\n");
    // Seit dem Raster der THWin-Vorlage zweizeilig: „Stärke:“ und darunter klein die Legende.
    expect(blanko).toContain("Stärke:\nF / UF / M // Ges.");
    // Seit R3-A6 auch auf dem ausgefüllten Bogen — gleiche Beschriftung wie der Vordruck.
    const voll = texte(pdfDokument(basisBogen(), QR).content).join("\n");
    expect(voll).toContain("Stärke:\nF / UF / M // Ges.");
  });

  it("Blanko-Vordruck trägt den Meldekopf-Kasten mit „ins Gerät übertragen“ und dem Kästchen „Übung“ (R4-A4)", () => {
    const blanko = texte(pdfDokument(basisBogen(), null, { fahrzeuge: 1, personal: 1, qualifikationen: 1 }).content).join("\n");
    expect(blanko).toContain("Meldekopf:");
    expect(blanko).toMatch(/eingegangen am/);
    expect(blanko).toMatch(/\[ {2}\] ÜBUNG/);
    expect(blanko).toMatch(/ins Gerät übertragen \[ {2}\]/);
    expect(blanko).toContain("Zug / Verband:");
    // Ein ausgefüllter Bogen trägt den Kasten nicht — er hat seinen „Stand am Meldekopf“.
    expect(texte(pdfDokument(basisBogen(), QR).content).join("\n")).not.toContain("ins Gerät übertragen");
  });

  it("Personalzeilen brechen nicht über die Seite — auf dem Vordruck keine 3-mm-Zeile (R4-A8)", () => {
    const dd = pdfDokument(basisBogen(), null, { fahrzeuge: 1, personal: 3, qualifikationen: 1 });
    const tabellen: { table?: { dontBreakRows?: boolean; headerRows?: number } }[] = [];
    const sammle = (n: unknown): void => {
      if (Array.isArray(n)) n.forEach(sammle);
      else if (n && typeof n === "object") {
        if ((n as { table?: unknown }).table) tabellen.push(n as never);
        Object.values(n).forEach(sammle);
      }
    };
    sammle(dd.content);
    const personal = tabellen.find((t) => JSON.stringify(t.table).includes("D = dienstlich / P = privat"));
    expect(personal?.table?.dontBreakRows).toBe(true);
    // Der Vordruck wiederholt den Kopf auf der zweiten Seite.
    expect(personal?.table?.headerRows).toBe(1);
  });

  it("führt die Zählrolle je Person im Einzel-PDF (R3-A6)", () => {
    const dd = pdfDokument(basisBogen(), QR);
    const t = texte(dd.content).join("\n");
    expect(t).toContain("Rolle\nF/UF/M");
    // Johannes Rudolph ist Führer, Anna Weber Mannschaft.
    expect(t).toMatch(/\nF\nmiddle\ncenter\nRudolph, Johannes\n/);
    expect(t).toMatch(/\nM\nmiddle\ncenter\nWeber, Anna\n/);
    // Ohne Messung keine freien Zeilen — die gibt es nur über einzelPdfDokument.
    expect(JSON.stringify(dd.content)).not.toContain('"text":" ","margin":[0,2,0,2]');
    const frei = pdfDokument(basisBogen(), QR, undefined, undefined, { freiePersonalZeilen: 2, freiesFahrzeug: true });
    expect(JSON.stringify(frei.content).match(/"text":" ","margin":\[0,2,0,2\]/g)).toHaveLength(6);
    expect(texte(frei.content)).toContain("Kennzeichen:");
  });
});

// Audit Runde 6, R6-A3: Vorbelegung aus dem Einheitstyp steht nicht als gemeldet auf Papier.
describe("ohneVorbelegung() (R6-A3)", () => {
  it("nimmt bei nur nach Stärke erfasster Einheit Funkrufname und StAN-Kreuz weg", () => {
    const b = basisBogen();
    b.personalErfassung = PersonalErfassung.NUR_STAERKE;
    b.fahrzeuge = [{ ...neuesFahrzeug(), stanKonform: true, funkrufname: { kennwort: { freitext: "Heros" }, eigenerStandort: true, teile: [22, 51] } }];
    const c = ohneVorbelegung(b);
    expect(c.fahrzeuge[0]!.stanKonform).toBeUndefined();
    expect(c.fahrzeuge[0]!.funkrufname).toBeUndefined();
    expect(erreichbarkeitZeilen(b).join(" ")).not.toMatch(/Heros/);
  });

  it("lässt vollständig erfasste Einheiten unverändert", () => {
    const b = basisBogen();
    b.fahrzeuge = [{ ...neuesFahrzeug(), stanKonform: true }];
    expect(ohneVorbelegung(b)).toBe(b);
  });
});

// Audit Runde 6, R6-A5: Namen, die auf Papier als „?" stünden, werden gezählt.
describe("nichtDarstellbareNamen() (R6-A5)", () => {
  it("zählt Emoji-Namen (kyrillische stehen in Umschrift, R9-W3), nicht lateinische Akzente", () => {
    const b = basisBogen();
    b.personal = [
      { ...b.personal[0]!, vorname: "Дмитрий", nachname: "Иванов" },
      { ...b.personal[0]!, vorname: "Łukasz", nachname: "Şahin" },
      { ...b.personal[0]!, vorname: "Max", nachname: "😀" },
    ];
    // Kyrillisch wird umgeschrieben (R9-W3), „Łukasz" ist darstellbar; nur das Emoji bleibt „?".
    expect(nichtDarstellbareNamen(b)).toBe(1);
  });
});

// Audit Runde 7, R7-A4: Die Quittung nennt die Person mit nicht darstellbarem Namen.
describe("nichtDarstellbareBetroffene() (R7-A4)", () => {
  it("nennt die Person und kennzeichnet die Ansprechperson", () => {
    const b = basisBogen();
    b.personal = [
      { ...neuePerson(), vorname: "Владимир", nachname: "Lehmann" },
      { ...neuePerson(), vorname: "Anna", nachname: "Beispiel" },
      { ...neuePerson(), vorname: "Zoë", nachname: "Ärger" },
    ];
    // Kyrillisch steht in Umschrift (R9-W3): kein „?", aber in der Quittung genannt.
    expect(nichtDarstellbareBetroffene(b)).toEqual([]);
    expect(umschriftBetroffene(b)).toEqual(["Владимир Lehmann → Vladimir Lehmann (Ansprechperson)"]);
    b.personal[0] = { ...neuePerson(), vorname: "محمد", nachname: "Lehmann" };
    expect(nichtDarstellbareBetroffene(b)).toEqual(["محمد Lehmann (Ansprechperson)"]);
    expect(nichtDarstellbareNamen(b)).toBe(1);
    b.personal.push({ ...neuePerson(), vorname: "علي", nachname: "Meyer" });
    expect(nichtDarstellbareBetroffene(b)).toEqual(["محمد Lehmann (Ansprechperson)", "علي Meyer"]);
  });
});

// Audit Runde 8, R8-A3: Das Rückruf-Feld steht lesbar auf Papier, nicht als „????????".
describe("ansprechpersonPapier() (R8-A3)", () => {
  it("setzt Kyrillisch und Griechisch in lateinische Umschrift", () => {
    expect(umschrift("Владимир")).toBe("Vladimir");
    expect(umschrift("Жуков Щербаков")).toBe("Zhukov Schtscherbakov");
    expect(umschrift("Γιώργος")).toBe("Giorgos");
  });
  it("lässt Darstellbares unverändert und kennzeichnet die Umschrift", () => {
    expect(ansprechpersonPapier("Zoë Ärger")).toBe("Zoë Ärger");
    expect(ansprechpersonPapier("Владимир Lehmann")).toBe("Vladimir Lehmann (Umschrift)");
  });
  it("vermerkt, wenn auch die Umschrift nichts nützt", () => {
    const t = ansprechpersonPapier("张伟 Lehmann");
    expect(t).toContain("Name nicht darstellbar – siehe digitale Meldung");
    expect(t).toContain("Lehmann");
  });
  it("steht im Feld Ansprechpartner/in der Seite", () => {
    const b = basisBogen();
    b.personal = [{ ...neuePerson(), vorname: "Владимир", nachname: "Lehmann" }];
    const dd = pdfDokument(b, null);
    expect(JSON.stringify(dd.content)).toContain("Vladimir Lehmann (Umschrift)");
  });
  it("R8-A1: die Bogenseite sagt, dass die Stärke nur die Sollstärke ist", () => {
    const b = basisBogen();
    b.personalErfassung = 1;
    b.personal = [{ ...neuePerson() }, { ...neuePerson() }];
    expect(JSON.stringify(pdfDokument(b, null).content)).toContain("Sollstärke der Vorbelegung");
  });
});

describe("Titelbalken im Raster der THWin-Vorlage", () => {
  it("THW-Bogen: Wortbildmarke rechts, Balken im Vorlagen-Blau #003399", () => {
    const b = basisBogen();
    b.uebung = false;
    const t = JSON.stringify(pdfDokument(b, QR).content);
    expect(t).toContain(THW_LOGO_JPEG);
    expect(t).toContain('"fillColor":"#003399"');
  });

  it("Organisation ohne Logo: kein THW-Logo, stattdessen der Name der Organisation", () => {
    const b = basisBogen();
    b.einheit.organisation = OrganisationsTyp.POLIZEI;
    b.einheit.organisationName = "Polizeidirektion Musterstadt";
    const t = JSON.stringify(pdfDokument(b, QR).content);
    expect(t).not.toContain(THW_LOGO_JPEG);
    expect(t).toContain('"text":"Polizei"');
    expect(t).toContain("Polizeidirektion Musterstadt");
  });

  it.each([
    OrganisationsTyp.ASB,
    OrganisationsTyp.BUNDESPOLIZEI,
    OrganisationsTyp.BUNDESWEHR,
    OrganisationsTyp.DLRG,
    OrganisationsTyp.DRK,
    OrganisationsTyp.JUH,
    OrganisationsTyp.MHD,
  ])("Organisation %i mit bekanntem Logo: Logo als Vektor statt Name, Gliederung darunter", (org) => {
    const b = basisBogen();
    b.einheit.organisation = org;
    b.einheit.organisationName = "Kreisverband Musterstadt";
    const logo = ORG_LOGOS[org]!;
    const t = JSON.stringify(pdfDokument(b, QR).content);
    expect(t).toContain(JSON.stringify(logo.svg));
    expect(t).not.toContain(THW_LOGO_JPEG);
    expect(t).not.toContain(`"text":"${orgLabel(org)}"`);
    expect(t).toContain("Kreisverband Musterstadt");
  });

  it("Logos passen in den Platz der THW-Marke und kommen ohne Stylesheet aus", () => {
    for (const logo of Object.values(ORG_LOGOS)) {
      expect(logo.breite).toBeLessThanOrEqual(96);
      expect(logo.hoehe).toBeLessThanOrEqual(19);
      // pdfmake (svg-to-pdfkit) zeichnet weder <style>/class noch <switch>.
      expect(logo.svg).not.toMatch(/<style|class=|<switch|<foreignObject/);
    }
  });

  it("Vordruck: weder Logo noch Organisation, nur die Beschriftung zum Ausfüllen", () => {
    const t = JSON.stringify(pdfDokument(basisBogen(), null, { fahrzeuge: 1, personal: 1, qualifikationen: 1 }).content);
    expect(t).not.toContain(THW_LOGO_JPEG);
    expect(t).toContain('"text":"Organisation:"');
    expect(t).toContain('"text":"Einheit:"');
  });
});
