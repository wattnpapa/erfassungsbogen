import { describe, it, expect, vi } from "vitest";

// pdf-dokument.ts zieht über ./hilfen die native Brücke; für die reine
// DocDefinition brauchen wir davon nichts.
vi.mock("./nativ", () => ({
  istNativ: () => false,
  textTeilen: async () => {},
  pdfTeilen: async () => {},
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
  zeitpunktAusIso,
  type Erfassungsbogen,
} from "../model";
import type { QrInfo } from "./hilfen";
import { pdfDokument } from "./pdf-dokument";

const QR: QrInfo = { datenUrl: "data:image/png;base64,QRTESTBILD", zeichen: 123, version: 7 };

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
    stand: datumAusIso("2026-05-14"),
    einheit: {
      organisation: OrganisationsTyp.THW,
      // Freitext-Werte, damit die Assertions unabhängig von den Vokabular-Tabellen sind.
      einheitsTyp: { freitext: "FGr K (A)" },
      name: "OV Oldenburg - Ni",
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
        thwKennzeichen: 84397,
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
    expect(JSON.stringify(dd.content)).toContain(QR.datenUrl);
    expect(texte(dd.content)).toContain(
      `Format EEB2 · ${QR.zeichen} Zeichen · QR-Version ${QR.version} (Fehlerkorrektur M)\nMit der Kamera oder der EEB-App scannen, um den Bogen digital zu übernehmen.`,
    );
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
    // eigenerStandort → Ort = Name der Einheit, Kennzahlen mit "/" verbunden.
    expect(t).toContain("FuRn:");
    expect(t).toContain("OV Oldenburg - Ni 18/13");
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

  it("erzeugt eine Fußzeile mit Stand und Seitenzahlen", () => {
    const dd = pdfDokument(basisBogen(), QR);
    const footer = dd.footer as (s: number, g: number) => unknown;
    const t = texte(footer(2, 5)).join("\n");
    expect(t).toContain("Stand: 14.05.2026");
    expect(t).toContain("2 / 5");
  });
});
