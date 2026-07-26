import { describe, it, expect } from "vitest";
import { deflateRawSync, inflateRawSync } from "node:zlib";
import {
  EEB_BASE41_MARKER,
  EEB_SEGMENT_MARKER,
  EEB_URL_PREFIX,
  EEB_VORLAGE_MARKER,
  base41Dekodieren,
  base41Kodieren,
  base64UrlKodieren,
  datenDekodieren,
  datenKodieren,
  decodePayloadUrl,
  decodeVorlagePayloadUrl,
  encodePayload,
  encodePayloadUrl,
  encodeVorlagePayloadUrl,
  parseSegmentUrl,
  segmentPayloadUrls,
  segmenteZuBogen,
  type Kompressor,
} from "./codec";
import {
  Fahrerlaubnis,
  Geschlecht,
  Ernaehrung,
  KontaktArt,
  OrganisationsTyp,
  PersonalErfassung,
  StaerkeRolle,
  SCHEMA_VERSION,
  datumAusIso,
  type Erfassungsbogen,
} from "./model";

const zlib: Kompressor = {
  deflateRaw: (d) => new Uint8Array(deflateRawSync(d, { level: 9 })),
  inflateRaw: (d) => new Uint8Array(inflateRawSync(d)),
};

function gleich(a: unknown, b: unknown): void {
  expect(JSON.parse(JSON.stringify(a))).toEqual(JSON.parse(JSON.stringify(b)));
}

function bogen(personen = 3): Erfassungsbogen {
  return {
    schemaVersion: SCHEMA_VERSION,
    stand: datumAusIso("2026-05-14"),
    einheit: {
      organisation: OrganisationsTyp.THW,
      einheitsTyp: { code: 43 },
      hierarchie: [{ bezeichnung: { code: 1 }, name: "Oldenburg - Ni", kurz: "OODE" }],
    },
    einsatz: {
      zeitraumVon: datumAusIso("2025-05-14"),
      zeitraumBis: datumAusIso("2025-05-17"),
      ortAuftrag: "Hochwasserlage im Landkreis",
    },
    personalErfassung: PersonalErfassung.VOLLSTAENDIG,
    personal: Array.from({ length: personen }, (_, i) => ({
      vorname: `Vorname${i}`,
      nachname: `Nachname${i}`,
      staerkeRolle: i === 0 ? StaerkeRolle.FUEHRER : StaerkeRolle.MANNSCHAFT,
      funktionen: [{ code: 7 }],
      fahrerlaubnis: Fahrerlaubnis.CE,
      geschlecht: Geschlecht.M,
      ernaehrung: Ernaehrung.FLEISCH,
      kontakte: [{ art: KontaktArt.MOBIL, dienstlich: false, wert: "01701234501" }],
      zusatzqualifikationen: [],
    })),
    fahrzeuge: [],
  };
}

describe("Base41-Kodierung", () => {
  it("überlebt den Rundlauf für jede Länge", () => {
    for (let n = 0; n <= 300; n++) {
      const daten = Uint8Array.from({ length: n }, (_, i) => (i * 37 + n * 11) % 256);
      expect(Array.from(base41Dekodieren(base41Kodieren(daten)))).toEqual(Array.from(daten));
    }
  });

  it("überlebt den Rundlauf für Randbytes (0x00/0xff)", () => {
    for (const muster of [[0], [255], [0, 0], [255, 255], [0, 255, 0], [255, 0, 255]]) {
      const daten = Uint8Array.from(muster);
      expect(Array.from(base41Dekodieren(base41Kodieren(daten)))).toEqual(muster);
    }
  });

  it("erzeugt aus 2 Bytes 3 Zeichen (statt 4 wie Base64url bei 3 Bytes)", () => {
    expect(base41Kodieren(new Uint8Array(2)).length).toBe(3);
    expect(base41Kodieren(new Uint8Array(4)).length).toBe(6);
    // Einzelnes Restbyte braucht nur 2 Zeichen.
    expect(base41Kodieren(new Uint8Array(1)).length).toBe(2);
    expect(base41Kodieren(new Uint8Array(3)).length).toBe(5);
  });

  it("nutzt ausschließlich Zeichen des alphanumerischen QR-Modus", () => {
    // Genau dieser Zeichensatz macht den Kapazitätsgewinn aus: verlässt die
    // Ausgabe ihn, fällt der QR-Code in den Byte-Modus zurück.
    const erlaubt = /^[0-9A-Z$%*+\-./: ]*$/;
    for (let n = 0; n < 200; n++) {
      const daten = Uint8Array.from({ length: n }, (_, i) => (i * 97 + n * 53) % 256);
      expect(base41Kodieren(daten)).toMatch(erlaubt);
    }
  });

  it("enthält weder '.' noch Kleinbuchstaben — Marker bleiben unterscheidbar", () => {
    for (let n = 0; n < 200; n++) {
      const daten = Uint8Array.from({ length: n }, (_, i) => (i * 131 + n * 17) % 256);
      const s = base41Kodieren(daten);
      expect(s).not.toMatch(/[.a-z_]/);
    }
  });

  it("weist ungültige Eingaben zurück, statt still falsche Bytes zu liefern", () => {
    expect(() => base41Dekodieren("A")).toThrow(/Base41/); // unvollständige Gruppe
    expect(() => base41Dekodieren("ABCD")).toThrow(/Base41/);
    expect(() => base41Dekodieren("ab")).toThrow(/ungültige Zeichen/); // Kleinbuchstaben
    expect(() => base41Dekodieren("A.B")).toThrow(/ungültige Zeichen/);
    // ':::' = 40 + 40*41 + 40*1681 = 70520 > 0xffff
    expect(() => base41Dekodieren(":::")).toThrow(/16 Bit/);
    // '::' = 40 + 40*41 = 1680 > 0xff
    expect(() => base41Dekodieren("::")).toThrow(/8 Bit/);
  });
});

describe("Marker für den Datenteil", () => {
  it("kodiert mit Marker und liest ihn wieder", () => {
    const daten = Uint8Array.from([1, 2, 3, 250, 251, 252]);
    const text = datenKodieren(daten);
    expect(text.startsWith(EEB_BASE41_MARKER)).toBe(true);
    expect(Array.from(datenDekodieren(text))).toEqual(Array.from(daten));
  });

  it("liest markerlose Datenteile weiterhin als Base64url", () => {
    const daten = Uint8Array.from([9, 8, 7, 6, 5, 4, 3, 2, 1]);
    expect(Array.from(datenDekodieren(base64UrlKodieren(daten)))).toEqual(Array.from(daten));
  });
});

describe("Abwärtskompatibilität: QR-Codes aus der Base64url-Zeit", () => {
  it("liest einen alten Einzelbogen-QR", () => {
    const b = bogen();
    // Exakt das frühere Format: Präfix + Base64url, ohne Marker.
    const alteUrl = EEB_URL_PREFIX + base64UrlKodieren(encodePayload(b, zlib));
    gleich(decodePayloadUrl(alteUrl, zlib), b);
  });

  it("liest eine alte Vorlagen-URL (Marker V. + Base64url)", () => {
    const b = bogen();
    const alteUrl = EEB_URL_PREFIX + EEB_VORLAGE_MARKER + base64UrlKodieren(encodePayload(b, zlib));
    gleich(decodeVorlagePayloadUrl(alteUrl, zlib), b);
  });

  it("liest alte Segment-QRs und setzt sie zusammen", () => {
    const b = bogen(40);
    const payload = encodePayload(b, zlib);
    const anzahl = 3;
    const groesse = Math.ceil(payload.length / anzahl);
    // Segment-URLs im früheren Format nachbauen (Kopf gleich, Chunk in Base64url).
    const id = parseSegmentUrl(segmentPayloadUrls(payload, anzahl)[0]!).id;
    const alteUrls = Array.from({ length: anzahl }, (_, i) => {
      const chunk = payload.subarray(i * groesse, Math.min((i + 1) * groesse, payload.length));
      return `${EEB_URL_PREFIX}${EEB_SEGMENT_MARKER}${i + 1}.${anzahl}.${id}.${base64UrlKodieren(chunk)}`;
    });
    gleich(segmenteZuBogen(alteUrls.map(parseSegmentUrl), zlib), b);
  });

  it("liest gemischte Sätze — alter und neuer Teil desselben Bogens", () => {
    const b = bogen(40);
    const payload = encodePayload(b, zlib);
    const neu = segmentPayloadUrls(payload, 2);
    const id = parseSegmentUrl(neu[0]!).id;
    const groesse = Math.ceil(payload.length / 2);
    const alterTeil2 = `${EEB_URL_PREFIX}${EEB_SEGMENT_MARKER}2.2.${id}.${base64UrlKodieren(payload.subarray(groesse))}`;
    gleich(segmenteZuBogen([parseSegmentUrl(neu[0]!), parseSegmentUrl(alterTeil2)], zlib), b);
  });
});

describe("Neue QR-Inhalte", () => {
  it("Einzelbogen trägt den Marker und liest sich zurück", () => {
    const b = bogen();
    const url = encodePayloadUrl(b, zlib);
    expect(url.startsWith(EEB_URL_PREFIX + EEB_BASE41_MARKER)).toBe(true);
    gleich(decodePayloadUrl(url, zlib), b);
  });

  it("Vorlage behält den Marker V. vor dem Base41-Marker", () => {
    const b = bogen();
    const url = encodeVorlagePayloadUrl(b, zlib);
    expect(url.startsWith(EEB_URL_PREFIX + EEB_VORLAGE_MARKER + EEB_BASE41_MARKER)).toBe(true);
    gleich(decodeVorlagePayloadUrl(url, zlib), b);
  });

  it("Segment-Kopf bleibt parsebar, obwohl der Chunk selbst einen Punkt trägt", () => {
    const b = bogen(40);
    const payload = encodePayload(b, zlib);
    const urls = segmentPayloadUrls(payload, 3);
    for (const [i, u] of urls.entries()) {
      const teil = parseSegmentUrl(u);
      expect(teil.teilNr).toBe(i + 1);
      expect(teil.anzahl).toBe(3);
    }
    gleich(segmenteZuBogen(urls.map(parseSegmentUrl), zlib), b);
  });

  it("braucht weniger QR-Kapazität als Base64url", () => {
    const b = bogen(20);
    const payload = encodePayload(b, zlib);
    const alt = base64UrlKodieren(payload);
    const neu = base41Kodieren(payload);
    // Mehr Zeichen, aber je Zeichen nur 5,5 statt 8 Bit — unterm Strich weniger.
    expect(neu.length).toBeGreaterThan(alt.length);
    expect(neu.length * 5.5).toBeLessThan(alt.length * 8);
  });
});
