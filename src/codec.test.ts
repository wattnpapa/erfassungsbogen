import { describe, it, expect } from "vitest";
import { deflateRawSync, inflateRawSync } from "node:zlib";
import {
  EEB_MAGIC,
  EEB_URL_PREFIX,
  decodeBinaer,
  decodePayload,
  decodePayloadUrl,
  encodeBinaer,
  encodePayload,
  encodePayloadUrl,
  signierteBytes,
  type Kompressor,
} from "./codec";
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
} from "./model";

// Realer Deflate wie in Node/Electron (src/qr-node.ts nutzt denselben Weg).
const zlib: Kompressor = {
  deflateRaw: (d) => new Uint8Array(deflateRawSync(d, { level: 9 })),
  inflateRaw: (d) => new Uint8Array(inflateRawSync(d)),
};

// JSON-normalisiert vergleichen: fehlendes Feld und `undefined` zählen gleich.
function gleich(a: unknown, b: unknown): void {
  expect(JSON.parse(JSON.stringify(a))).toEqual(JSON.parse(JSON.stringify(b)));
}

function basisBogen(): Erfassungsbogen {
  return {
    schemaVersion: SCHEMA_VERSION,
    stand: zeitpunktAusIso("2026-05-14T10:39"),
    einheit: {
      organisation: OrganisationsTyp.THW,
      einheitsTyp: { code: 43 },
      hierarchie: [
        { bezeichnung: { code: 1 }, name: "Oldenburg - Ni", kurz: "OODE", telefon: "04413401050", email: "ov@thw.de" },
      ],
    },
    einsatz: {
      zeitraumVon: datumAusIso("2025-05-14"),
      zeitraumBis: datumAusIso("2025-05-17"),
      ortAuftrag: "Fernmeldebauübung Kabelblitz",
    },
    personalErfassung: PersonalErfassung.VOLLSTAENDIG,
    personal: [
      {
        vorname: "Johannes",
        nachname: "Rudolph",
        staerkeRolle: StaerkeRolle.FUEHRER,
        funktionen: [{ code: 7 }, { freitext: "Sonderfunktion" }],
        fahrerlaubnis: Fahrerlaubnis.CE,
        geschlecht: Geschlecht.M,
        ernaehrung: Ernaehrung.FLEISCH,
        kontakte: [
          { art: KontaktArt.MOBIL, dienstlich: false, wert: "01701234501" },
          { art: KontaktArt.EMAIL, dienstlich: true, emailTemplate: 1 },
          { art: KontaktArt.EMAIL, dienstlich: false, wert: "privat@example.org" },
        ],
        zusatzqualifikationen: [{ code: 12 }],
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
        typ: { code: 1 },
        kennzeichen: "THW-84397",
        funkrufname: { kennwort: { code: 1 }, eigenerStandort: true, teile: [18, 13] },
        stanKonform: true,
      },
      {
        typ: { freitext: "MzKW" },
        kennzeichen: "OL-FW 2041",
        funkrufname: { kennwort: { code: 1 }, eigenerStandort: false, ort: "Wardenburg", teile: [24, 54] },
        stanKonform: false,
        aenderungen: "Zusatzbeladung Ölwehr",
      },
    ],
    sofortbedarf: {
      verpflegungPersonen: 20,
      dieselLiter: 200,
      benzinLiter: 30,
      gemischLiter: 5,
      unterbringung: true,
      ruhezeitErforderlich: false,
    },
    sonstiges: "Bitte Verpflegung ab 12 Uhr.",
  };
}

describe("Binär-Roundtrip (encodeBinaer/decodeBinaer)", () => {
  it("erhält einen vollständigen Bogen unverändert", () => {
    const b = basisBogen();
    gleich(decodeBinaer(encodeBinaer(b)), b);
  });

  it("erhält das Übungs-Flag — ohne den Strom zu verlängern", () => {
    const echt = basisBogen();
    const uebung = { ...basisBogen(), uebung: true };
    expect(decodeBinaer(encodeBinaer(uebung)).uebung).toBe(true);
    expect(decodeBinaer(encodeBinaer(echt)).uebung).toBeUndefined();
    // Das Flag sitzt in einem freien Bit des Personal-Flags-Bytes.
    expect(encodeBinaer(uebung).length).toBe(encodeBinaer(echt).length);
  });

  it("schreibt die kleinste tragende Schema-Version (5/6/7)", () => {
    // Bögen ohne Übungs-Flag und ohne Uhrzeit im Stand bleiben für ältere
    // App-Stände (Schema 5) lesbar; Übungsbögen fordern Schema 6. Ein Stand
    // mit Uhrzeit ist erst ab Schema 7 kodierbar und fordert daher Schema 7.
    const mitternacht = { ...basisBogen(), stand: zeitpunktAusIso("2026-05-14T00:00") };
    expect(encodeBinaer(mitternacht)[0]).toBe(5);
    expect(encodeBinaer({ ...mitternacht, uebung: true })[0]).toBe(6);
    expect(encodeBinaer(basisBogen())[0]).toBe(7); // Stand 10:39 → Schema 7
  });

  it("mehrere Fahrerlaubnisklassen fordern Schema 8 und überstehen den Roundtrip", () => {
    const b = basisBogen();
    b.personal[0]!.weitereFahrerlaubnisse = [Fahrerlaubnis.A, Fahrerlaubnis.D1];
    expect(encodeBinaer(b)[0]).toBe(8);
    gleich(decodeBinaer(encodeBinaer(b)), b);
    // Eine Klasse allein bleibt bei der bisherigen Version — alte App-Stände
    // können solche Bögen weiter lesen.
    expect(encodeBinaer(basisBogen())[0]).toBe(7);
  });

  it("erhält die Uhrzeit im Stand über den Roundtrip", () => {
    expect(decodeBinaer(encodeBinaer(basisBogen())).stand).toBe(zeitpunktAusIso("2026-05-14T10:39"));
  });

  it("liest einen Mitternachts-Stand auch über den alten Tageszähler-Pfad", () => {
    const mitternacht = { ...basisBogen(), stand: zeitpunktAusIso("2026-05-14T00:00") };
    expect(decodeBinaer(encodeBinaer(mitternacht)).stand).toBe(zeitpunktAusIso("2026-05-14T00:00"));
  });

  it("erhält einen Meldekopf-Bogen (NUR_STAERKE, manuelle Blöcke, standortRef)", () => {
    const b: Erfassungsbogen = {
      schemaVersion: SCHEMA_VERSION,
      stand: datumAusIso("2026-01-02"),
      einheit: {
        organisation: OrganisationsTyp.THW,
        einheitsTyp: { code: 43 },
        standortRef: 40, // Name/Hierarchie kommen aus dem Verzeichnis → im QR leer
        hierarchie: [],
      },
      einsatz: {
        zeitraumVon: datumAusIso("2026-01-02"),
        zeitraumBis: datumAusIso("2026-01-03"),
        ortAuftrag: "Hochwasser",
        einsatzbeginn: zeitpunktAusIso("2026-01-02T06:15"),
        einsatzende: zeitpunktAusIso("2026-01-03T18:00"),
      },
      personalErfassung: PersonalErfassung.NUR_STAERKE,
      personal: [],
      staerkeManuell: { fuehrer: 1, unterfuehrer: 3, mannschaft: 17, gesamt: 21 },
      unterbringungManuell: { m: 16, w: 4, d: 1 },
      verpflegungManuell: { vegetarisch: 3, vegan: 2 },
      fahrzeuge: [],
    };
    gleich(decodeBinaer(encodeBinaer(b)), b);
  });

  it("erhält einen minimalen Bogen ohne Personal, Fahrzeuge, Sofortbedarf", () => {
    const b: Erfassungsbogen = {
      schemaVersion: SCHEMA_VERSION,
      stand: 0,
      einheit: {
        organisation: OrganisationsTyp.SONSTIGE,
        organisationName: "Nachbarschaftshilfe",
        einheitsTyp: { freitext: "Trupp" },
        hierarchie: [],
      },
      einsatz: { zeitraumVon: 0, zeitraumBis: 0, ortAuftrag: "" },
      personalErfassung: PersonalErfassung.VOLLSTAENDIG,
      personal: [],
      fahrzeuge: [],
    };
    gleich(decodeBinaer(encodeBinaer(b)), b);
  });

  it("kodiert Umlaute/Unicode in Strings verlustfrei (UTF-8)", () => {
    const b = basisBogen();
    b.einsatz.ortAuftrag = "Straße Grüße — Überörtlich 🚒";
    b.sonstiges = "Fußgängerübergang";
    gleich(decodeBinaer(encodeBinaer(b)), b);
  });
});

describe("BCD-Telefonnummern", () => {
  it("kodiert gerade und ungerade Ziffernlängen verlustfrei", () => {
    for (const nummer of ["0170123456", "01701234567", "12345", "0", ""]) {
      const b = basisBogen();
      b.personal[0]!.kontakte = [{ art: KontaktArt.MOBIL, dienstlich: false, wert: nummer }];
      const zurueck = decodeBinaer(encodeBinaer(b));
      expect(zurueck.personal[0]!.kontakte[0]!.wert).toBe(nummer);
    }
  });

  it("lehnt nicht-numerische Telefonnummern beim Kodieren ab", () => {
    const b = basisBogen();
    b.personal[0]!.kontakte = [{ art: KontaktArt.FESTNETZ, dienstlich: true, wert: "0441 / 34-01" }];
    expect(() => encodeBinaer(b)).toThrow(/nicht numerisch/i);
  });
});

describe("Vokabular-Werte", () => {
  it("kodiert Code und Freitext unterscheidbar", () => {
    const b = basisBogen();
    b.einheit.einheitsTyp = { freitext: "Sondereinheit XY" };
    b.fahrzeuge[0]!.typ = { code: 2 };
    const zurueck = decodeBinaer(encodeBinaer(b));
    expect(zurueck.einheit.einheitsTyp).toEqual({ freitext: "Sondereinheit XY" });
    expect(zurueck.fahrzeuge[0]!.typ).toEqual({ code: 2 });
  });

  it("verbietet den reservierten Code 0", () => {
    const b = basisBogen();
    b.einheit.einheitsTyp = { code: 0 };
    expect(() => encodeBinaer(b)).toThrow(/Code 0/i);
  });
});

describe("QR-Payload (encodePayload/decodePayload)", () => {
  it("beginnt mit dem EEB2-Magic und ist ein Roundtrip", () => {
    const b = basisBogen();
    const payload = encodePayload(b, zlib);
    expect(Array.from(payload.subarray(0, 4))).toEqual(Array.from(EEB_MAGIC));
    gleich(decodePayload(payload, zlib), b);
  });

  it("lehnt fremde Daten ohne EEB2-Magic ab", () => {
    expect(() => decodePayload(new Uint8Array([1, 2, 3, 4, 5, 6]), zlib)).toThrow(/Kein EEB2/i);
  });
});

describe("signierteBytes(): was eine Stufe deckt", () => {
  const stufe = (fuellung: number, karte?: Uint8Array) => ({
    pubkey: new Uint8Array(32).fill(fuellung),
    signatur: new Uint8Array(64).fill(fuellung + 1),
    ...(karte ? { karte } : {}),
  });
  const strom = new Uint8Array([7, 7, 7]);

  it("beginnt mit dem eigenen Kartenblock und endet mit dem Strom", () => {
    const karte = new Uint8Array([1, 2, 65, 66]);
    const daten = signierteBytes(strom, karte, []);
    // varint(4) ‖ Karte ‖ Strom
    expect(Array.from(daten)).toEqual([4, 1, 2, 65, 66, 7, 7, 7]);
    // Ohne Karte bleibt die Länge 0 stehen — der Block fehlt nie ganz.
    expect(Array.from(signierteBytes(strom, undefined, []))).toEqual([0, 7, 7, 7]);
  });

  it("nimmt frühere Stufen mit hinein (bindet die Reihenfolge)", () => {
    const allein = signierteBytes(strom, undefined, []);
    const mitEiner = signierteBytes(strom, undefined, [stufe(1)]);
    const mitZwei = signierteBytes(strom, undefined, [stufe(1), stufe(3)]);
    // Je Vorgängerstufe: 32 Schlüssel + 64 Signatur + 1 Kartenlänge.
    expect(mitEiner.length - allein.length).toBe(97);
    expect(mitZwei.length - mitEiner.length).toBe(97);
    // Andere Reihenfolge = andere Bytes → andere Signatur.
    const getauscht = signierteBytes(strom, undefined, [stufe(3), stufe(1)]);
    expect(Array.from(getauscht)).not.toEqual(Array.from(mitZwei));
  });
});

describe("QR-URL (encodePayloadUrl/decodePayloadUrl)", () => {
  it("erzeugt eine App-URL und liest sie zurück", () => {
    const b = basisBogen();
    const url = encodePayloadUrl(b, zlib);
    expect(url.startsWith(EEB_URL_PREFIX)).toBe(true);
    gleich(decodePayloadUrl(url, zlib), b);
  });

  it("akzeptiert auch den nackten Base64url-Payload ohne URL-Präfix", () => {
    const b = basisBogen();
    const url = encodePayloadUrl(b, zlib);
    const nackt = url.slice(EEB_URL_PREFIX.length);
    gleich(decodePayloadUrl(nackt, zlib), b);
  });

  it("lehnt ungültige Base64url-Zeichen ab", () => {
    expect(() => decodePayloadUrl("https://erfassungsbogen.app/#!!!nicht base64!!!", zlib)).toThrow(/EEB2/i);
  });
});

describe("Fehlerbehandlung im Decoder", () => {
  // Der Encoder schreibt seit Schema 6 immer die kleinste tragende Version
  // (transportSchemaVersion) statt b.schemaVersion — ungültige Versionen
  // entstehen also nur noch aus fremden/kaputten Strömen. Das Versions-Byte
  // wird deshalb direkt im Strom manipuliert (varint ≤ 127 = 1 Byte).
  it("lehnt zu neue Schema-Versionen ab", () => {
    const bytes = encodeBinaer(basisBogen());
    bytes[0] = SCHEMA_VERSION + 1;
    expect(() => decodeBinaer(bytes)).toThrow(/nicht unterstützte Schema-Version/i);
  });

  it("lehnt zu alte (< 2) Schema-Versionen ab", () => {
    const bytes = encodeBinaer(basisBogen());
    bytes[0] = 1;
    expect(() => decodeBinaer(bytes)).toThrow(/nicht unterstützte Schema-Version/i);
  });

  it("meldet überschüssige Daten am Ende", () => {
    const b = basisBogen();
    const bytes = encodeBinaer(b);
    const zuLang = new Uint8Array(bytes.length + 1);
    zuLang.set(bytes);
    expect(() => decodeBinaer(zuLang)).toThrow(/überschüssige Daten/i);
  });

  it("meldet vorzeitiges Datenende", () => {
    const b = basisBogen();
    const bytes = encodeBinaer(b);
    expect(() => decodeBinaer(bytes.subarray(0, bytes.length - 3))).toThrow(/Datenende/i);
  });
});
