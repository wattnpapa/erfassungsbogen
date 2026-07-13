import { describe, it, expect } from "vitest";
import { deflateRawSync, inflateRawSync } from "node:zlib";
import {
  EEB_MAGIC,
  EEB_SIGNIERT_MAGIC,
  EEB_URL_PREFIX,
  EEB_VORLAGE_MARKER,
  base64UrlDekodieren,
  base64UrlKodieren,
  decodePayload,
  decodePayloadUrl,
  decodeVorlagePayloadUrl,
  encodePayload,
  entpackePayload,
  packePayload,
  type Kompressor,
} from "./codec";
import {
  ausHex,
  encodeSigniertPayloadUrl,
  encodeSigniertVorlagePayloadUrl,
  oeffentlicherSchluessel,
  schluesselKurzform,
  schluesselpaarErzeugen,
  signaturVonPayload,
  signaturVonText,
  signaturLabel,
  zuHex,
} from "./signatur";
import {
  OrganisationsTyp,
  PersonalErfassung,
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

function bogen(): Erfassungsbogen {
  return {
    schemaVersion: SCHEMA_VERSION,
    stand: datumAusIso("2026-05-14"),
    einheit: {
      organisation: OrganisationsTyp.THW,
      einheitsTyp: { code: 43 },
      name: "OV Oldenburg - Ni",
      hierarchie: [],
    },
    einsatz: {
      zeitraumVon: datumAusIso("2025-05-14"),
      zeitraumBis: datumAusIso("2025-05-17"),
      ortAuftrag: "Übung Kabelblitz",
    },
    personalErfassung: PersonalErfassung.VOLLSTAENDIG,
    personal: [],
    fahrzeuge: [],
  };
}

describe("Hex-Helfer", () => {
  it("ist ein Roundtrip und lehnt Ungültiges ab", () => {
    const b = new Uint8Array([0x00, 0x0f, 0xa1, 0xff]);
    expect(zuHex(b)).toBe("000fa1ff");
    expect(Array.from(ausHex("000fa1ff"))).toEqual(Array.from(b));
    expect(() => ausHex("xyz")).toThrow();
    expect(() => ausHex("abc")).toThrow(); // ungerade Länge
  });
});

describe("Schlüsselverwaltung", () => {
  it("erzeugt ein 32/32-Byte-Paar; öffentlicher Schlüssel ist ableitbar", async () => {
    const kp = await schluesselpaarErzeugen();
    expect(kp.privat.length).toBe(32);
    expect(kp.oeffentlich.length).toBe(32);
    const abgeleitet = await oeffentlicherSchluessel(kp.privat);
    expect(Array.from(abgeleitet)).toEqual(Array.from(kp.oeffentlich));
  });

  it("bildet eine gruppierte Kurzform (erste 8 Bytes)", () => {
    const pub = ausHex("0123456789abcdef" + "00".repeat(24));
    expect(schluesselKurzform(pub)).toBe("0123 4567 89ab cdef");
  });
});

describe("packePayload/entpackePayload", () => {
  it("Roundtrip unsigniert (Magic EEB2, keine Hülle)", () => {
    const komprimiert = new Uint8Array([9, 8, 7, 6]);
    const payload = packePayload({ komprimiert });
    expect(Array.from(payload.subarray(0, 4))).toEqual(Array.from(EEB_MAGIC));
    const teile = entpackePayload(payload);
    expect(teile.signatur).toBeUndefined();
    expect(Array.from(teile.komprimiert)).toEqual([9, 8, 7, 6]);
  });

  it("Roundtrip signiert (Magic EEB2S, Hülle erhalten)", () => {
    const komprimiert = new Uint8Array([1, 2, 3]);
    const pubkey = new Uint8Array(32).fill(7);
    const signatur = new Uint8Array(64).fill(9);
    const payload = packePayload({ komprimiert, signatur: { pubkey, signatur } });
    expect(Array.from(payload.subarray(0, 5))).toEqual(Array.from(EEB_SIGNIERT_MAGIC));
    const teile = entpackePayload(payload);
    expect(Array.from(teile.komprimiert)).toEqual([1, 2, 3]);
    expect(Array.from(teile.signatur!.pubkey)).toEqual(Array.from(pubkey));
    expect(Array.from(teile.signatur!.signatur)).toEqual(Array.from(signatur));
  });

  it("lehnt falsche Schlüssel-/Signaturlänge beim Packen ab", () => {
    expect(() =>
      packePayload({ komprimiert: new Uint8Array([1]), signatur: { pubkey: new Uint8Array(31), signatur: new Uint8Array(64) } }),
    ).toThrow(/Länge/i);
  });

  it("lehnt fremde Daten und unvollständige Signatur-Container ab", () => {
    expect(() => entpackePayload(new Uint8Array([1, 2, 3, 4, 5, 6]))).toThrow(/Kein EEB2/i);
    // EEB2S-Magic, aber Container zu kurz für Schlüssel+Signatur
    const zuKurz = new Uint8Array([...EEB_SIGNIERT_MAGIC, 1, 2, 3]);
    expect(() => entpackePayload(zuKurz)).toThrow(/unvollständig/i);
  });
});

describe("Abwärtskompatibilität: unsigniert bleibt lesbar", () => {
  it("liest einen alten unsignierten Payload und meldet ‚unsigniert‘", async () => {
    const b = bogen();
    const payload = encodePayload(b, zlib); // 'EEB2' + Deflate — wie bisher
    gleich(decodePayload(payload, zlib), b);
    expect(await signaturVonPayload(payload)).toEqual({ zustand: "unsigniert" });
  });

  it("der Deflate-Strom eines signierten Payloads ist byte-identisch zum unsignierten", async () => {
    const b = bogen();
    const unsigniert = entpackePayload(encodePayload(b, zlib)).komprimiert;
    const kp = await schluesselpaarErzeugen();
    const url = await encodeSigniertPayloadUrl(b, zlib, kp.privat);
    const payload = base64UrlDekodieren(url.slice(EEB_URL_PREFIX.length));
    const signiert = entpackePayload(payload);
    expect(signiert.signatur).toBeDefined();
    expect(Array.from(signiert.komprimiert)).toEqual(Array.from(unsigniert));
  });
});

describe("Signieren → Verifizieren", () => {
  it("signierter QR ist transporttransparent und verifiziert", async () => {
    const b = bogen();
    const kp = await schluesselpaarErzeugen();
    const url = await encodeSigniertPayloadUrl(b, zlib, kp.privat);
    expect(url.startsWith(EEB_URL_PREFIX)).toBe(true);
    // decodePayloadUrl liest den Bogen unverändert (Signatur wird ignoriert).
    gleich(decodePayloadUrl(url, zlib), b);
    const status = await signaturVonText(url);
    expect(status.zustand).toBe("gueltig");
    if (status.zustand === "gueltig") {
      expect(status.pubkey).toBe(zuHex(kp.oeffentlich));
      expect(status.kurzform).toBe(schluesselKurzform(kp.oeffentlich));
    }
    expect(signaturLabel(status)).toMatch(/^✓ signiert von /);
  });

  it("erkennt Manipulation am Nutzdatenstrom (Signatur ungültig)", async () => {
    const b = bogen();
    const kp = await schluesselpaarErzeugen();
    const url = await encodeSigniertPayloadUrl(b, zlib, kp.privat);
    const status0 = await signaturVonText(url);
    expect(status0.zustand).toBe("gueltig");

    // Payload extrahieren, ein Nutzdaten-Byte kippen, Status erneut prüfen.
    const payload = base64UrlDekodieren(url.slice(EEB_URL_PREFIX.length));
    const kopf = EEB_SIGNIERT_MAGIC.length + 32 + 64;
    payload[kopf] = payload[kopf]! ^ 0xff; // erstes komprimiertes Byte verfälschen
    const manipuliert = base64UrlKodieren(payload);
    const status1 = await signaturVonText(manipuliert);
    expect(status1.zustand).toBe("ungueltig");
    expect(signaturLabel(status1)).toMatch(/ungültig/i);
  });

  it("erkennt eine ausgetauschte Signatur (falscher Schlüssel)", async () => {
    const b = bogen();
    const kpA = await schluesselpaarErzeugen();
    const kpB = await schluesselpaarErzeugen();
    // Mit A signieren, aber B's pubkey einsetzen → verify schlägt fehl.
    const url = await encodeSigniertPayloadUrl(b, zlib, kpA.privat);
    const payload = base64UrlDekodieren(url.slice(EEB_URL_PREFIX.length));
    payload.set(kpB.oeffentlich, EEB_SIGNIERT_MAGIC.length); // pubkey tauschen
    const status = await signaturVonText(base64UrlKodieren(payload));
    expect(status.zustand).toBe("ungueltig");
  });
});

describe("Signierte Vorlage", () => {
  it("trägt den Marker V., ist als Bogen lesbar und verifiziert", async () => {
    const b = bogen();
    const kp = await schluesselpaarErzeugen();
    const url = await encodeSigniertVorlagePayloadUrl(b, zlib, kp.privat);
    expect(url.startsWith(EEB_URL_PREFIX + EEB_VORLAGE_MARKER)).toBe(true);
    gleich(decodeVorlagePayloadUrl(url, zlib), b);
    const status = await signaturVonText(url);
    expect(status.zustand).toBe("gueltig");
  });
});
