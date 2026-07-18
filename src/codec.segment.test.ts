import { describe, it, expect } from "vitest";
import { deflateRawSync, inflateRawSync } from "node:zlib";
import {
  EEB_SEGMENT_MARKER,
  EEB_URL_PREFIX,
  encodePayload,
  encodePayloadUrl,
  decodePayloadUrl,
  istSegmentNutzlast,
  parseSegmentUrl,
  segmentPayloadUrls,
  segmentSammeln,
  segmenteZuBogen,
  type Kompressor,
  type SegmentTeil,
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

/** Großer Bogen (viel Personal) — erzwingt einen Payload, der sich sinnvoll teilen lässt. */
function grosserBogen(personen = 40): Erfassungsbogen {
  return {
    schemaVersion: SCHEMA_VERSION,
    stand: datumAusIso("2026-05-14"),
    einheit: {
      organisation: OrganisationsTyp.THW,
      einheitsTyp: { code: 43 },
      hierarchie: [{ bezeichnung: { code: 1 }, name: "Oldenburg - Ni", kurz: "OODE", telefon: "04413401050", email: "ov@thw.de" }],
    },
    einsatz: {
      zeitraumVon: datumAusIso("2025-05-14"),
      zeitraumBis: datumAusIso("2025-05-17"),
      ortAuftrag: "Fernmeldebauübung Kabelblitz mit langem Auftragstext zur Sicherheit",
    },
    personalErfassung: PersonalErfassung.VOLLSTAENDIG,
    personal: Array.from({ length: personen }, (_, i) => ({
      vorname: `Vorname${i}`,
      nachname: `Nachname${i}`,
      staerkeRolle: i === 0 ? StaerkeRolle.FUEHRER : StaerkeRolle.MANNSCHAFT,
      funktionen: [{ code: 7 }, { freitext: `Sonderfunktion ${i}` }],
      fahrerlaubnis: Fahrerlaubnis.CE,
      geschlecht: Geschlecht.M,
      ernaehrung: Ernaehrung.FLEISCH,
      kontakte: [{ art: KontaktArt.MOBIL, dienstlich: false, wert: "01701234501" }],
      zusatzqualifikationen: [{ freitext: `Qualifikation ${i}` }],
    })),
    fahrzeuge: [],
  };
}

describe("Segment-Split/Merge-Roundtrip", () => {
  it("teilt einen Payload und setzt ihn verlustfrei wieder zusammen", () => {
    const b = grosserBogen();
    for (const anzahl of [2, 3, 5]) {
      const payload = encodePayload(b, zlib);
      const urls = segmentPayloadUrls(payload, anzahl);
      expect(urls).toHaveLength(anzahl);
      const teile = urls.map(parseSegmentUrl);
      gleich(segmenteZuBogen(teile, zlib), b);
    }
  });

  it("erzeugt gültige Segment-URLs mit Präfix, Marker und aufsteigender teilNr", () => {
    const urls = segmentPayloadUrls(encodePayload(grosserBogen(), zlib), 3);
    urls.forEach((url, i) => {
      expect(url.startsWith(EEB_URL_PREFIX + EEB_SEGMENT_MARKER)).toBe(true);
      expect(istSegmentNutzlast(url)).toBe(true);
      const t = parseSegmentUrl(url);
      expect(t.teilNr).toBe(i + 1);
      expect(t.anzahl).toBe(3);
    });
    // Alle Teile tragen dieselbe id.
    const ids = new Set(urls.map((u) => parseSegmentUrl(u).id));
    expect(ids.size).toBe(1);
  });

  it("setzt Teile in beliebiger Scan-Reihenfolge zusammen", () => {
    const b = grosserBogen();
    const teile = segmentPayloadUrls(encodePayload(b, zlib), 4).map(parseSegmentUrl);
    gleich(segmenteZuBogen([teile[2]!, teile[0]!, teile[3]!, teile[1]!], zlib), b);
  });

  it("hält den Single-QR unverändert (kein Segment-Marker)", () => {
    const b = grosserBogen(2);
    const url = encodePayloadUrl(b, zlib);
    expect(istSegmentNutzlast(url)).toBe(false);
    gleich(decodePayloadUrl(url, zlib), b);
  });
});

describe("Segment-Fehlerfälle", () => {
  it("lehnt einen fehlenden Teil ab", () => {
    const teile = segmentPayloadUrls(encodePayload(grosserBogen(), zlib), 3).map(parseSegmentUrl);
    expect(() => segmenteZuBogen([teile[0]!, teile[2]!], zlib)).toThrow(/unvollständig|fehlt/i);
  });

  it("lehnt vermischte Teile zweier Bögen ab (andere id)", () => {
    const a = segmentPayloadUrls(encodePayload(grosserBogen(40), zlib), 2).map(parseSegmentUrl);
    const b = segmentPayloadUrls(encodePayload(grosserBogen(41), zlib), 2).map(parseSegmentUrl);
    expect(() => segmenteZuBogen([a[0]!, b[1]!], zlib)).toThrow(/vermischt|unvollständig|Prüfsumme/i);
  });

  it("lehnt einen defekten Chunk über die Prüfsumme ab", () => {
    const teile = segmentPayloadUrls(encodePayload(grosserBogen(), zlib), 2).map(parseSegmentUrl);
    const kaputt: SegmentTeil = { ...teile[1]!, chunk: teile[1]!.chunk.slice() };
    kaputt.chunk[0] = kaputt.chunk[0]! ^ 0xff;
    expect(() => segmenteZuBogen([teile[0]!, kaputt], zlib)).toThrow(/Prüfsumme|EEB2/i);
  });

  it("parseSegmentUrl wirft bei ungültigem Kopf", () => {
    expect(() => parseSegmentUrl(EEB_URL_PREFIX + EEB_SEGMENT_MARKER + "0.2.99.AAAA")).toThrow(/ungültiger Kopf/i);
    expect(() => parseSegmentUrl(EEB_URL_PREFIX + EEB_SEGMENT_MARKER + "3.2.99.AAAA")).toThrow(/ungültiger Kopf/i);
    expect(() => parseSegmentUrl(EEB_URL_PREFIX + "AAAA")).toThrow(/Kein EEB2-Segment/i);
  });

  it("verlangt mindestens 2 Teile", () => {
    expect(() => segmentPayloadUrls(encodePayload(grosserBogen(), zlib), 1)).toThrow(/mindestens 2/i);
  });
});

describe("segmentSammeln (Scanner-Sammelzustand)", () => {
  function teileVon(anzahl: number): SegmentTeil[] {
    return segmentPayloadUrls(encodePayload(grosserBogen(), zlib), anzahl).map(parseSegmentUrl);
  }

  it("sammelt Teile bis zur Vollständigkeit", () => {
    const [t1, t2, t3] = teileVon(3);
    const r1 = segmentSammeln([], t1!);
    expect(r1.status).toBe("gesammelt");
    expect(r1.haben).toBe(1);
    const r2 = segmentSammeln(r1.teile, t2!);
    expect(r2.status).toBe("gesammelt");
    expect(r2.haben).toBe(2);
    const r3 = segmentSammeln(r2.teile, t3!);
    expect(r3.status).toBe("vollständig");
    expect(r3.haben).toBe(3);
    gleich(segmenteZuBogen(r3.teile, zlib), grosserBogen());
  });

  it("erkennt Duplikate und verändert den Stand nicht", () => {
    const [t1, t2] = teileVon(2);
    const r1 = segmentSammeln([], t1!);
    const dup = segmentSammeln(r1.teile, t1!);
    expect(dup.status).toBe("duplikat");
    expect(dup.haben).toBe(1);
    expect(dup.teile).toBe(r1.teile);
    // t2 schließt dann ab.
    expect(segmentSammeln(r1.teile, t2!).status).toBe("vollständig");
  });

  it("beginnt bei einem fremden Teil neu", () => {
    const alt = teileVon(3);
    const neu = segmentPayloadUrls(encodePayload(grosserBogen(41), zlib), 2).map(parseSegmentUrl);
    const r1 = segmentSammeln([], alt[0]!);
    const fremd = segmentSammeln(r1.teile, neu[0]!);
    expect(fremd.status).toBe("fremd");
    expect(fremd.teile).toEqual([neu[0]]);
    expect(fremd.haben).toBe(1);
  });
});
