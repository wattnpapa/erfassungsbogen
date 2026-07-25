import { describe, it, expect } from "vitest";
import { deflateRawSync, inflateRawSync } from "node:zlib";
import {
  EEB_KARTE_MAGIC,
  EEB_MAGIC,
  EEB_SIGNIERT_MAGIC,
  EEB_URL_PREFIX,
  EEB_VORLAGE_MARKER,
  base64UrlDekodieren,
  base64UrlKodieren,
  decodePayload,
  decodePayloadUrl,
  decodeVorlagePayloadUrl,
  dekodiereAbsenderkarte,
  encodePayload,
  entpackePayload,
  kodiereAbsenderkarte,
  packePayload,
  type Absenderkarte,
  type Kompressor,
} from "./codec";
import {
  absenderLabel,
  ausHex,
  encodeSigniertPayloadUrl,
  encodeSigniertVorlagePayloadUrl,
  oeffentlicherSchluessel,
  schluesselKurzform,
  schluesselpaarErzeugen,
  signaturVonPayload,
  signaturVonText,
  signaturLabel,
  signiertePayloadBytes,
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

describe("Absenderkarte", () => {
  const karte: Absenderkarte = {
    name: "Max Mustermann",
    email: "max@thw-oldenburg.de",
    telefon: "0170 1234567",
  };

  it("kodiert/dekodiert alle Feldkombinationen", () => {
    const faelle: Absenderkarte[] = [
      {},
      { name: "Max" },
      { email: "max@example.org" },
      { telefon: "0441 123456" },
      { name: "Max", telefon: "0441 123456" }, // Lücke in der Mitte
      karte,
    ];
    for (const f of faelle) {
      expect(dekodiereAbsenderkarte(kodiereAbsenderkarte(f))).toEqual(f);
    }
  });

  it("reist im Container EEB2K mit und erscheint nur bei gültiger Signatur", async () => {
    const b = bogen();
    const kp = await schluesselpaarErzeugen();
    const payload = await signiertePayloadBytes(b, zlib, kp.privat, karte);
    expect(Array.from(payload.subarray(0, 5))).toEqual(Array.from(EEB_KARTE_MAGIC));
    // Nutzdaten bleiben unberührt lesbar …
    gleich(decodePayload(payload, zlib), b);
    // … und die Karte kommt an.
    const status = await signaturVonPayload(payload);
    expect(status.zustand).toBe("gueltig");
    if (status.zustand === "gueltig") expect(status.absender).toEqual(karte);
    // Das Label bleibt am Fingerabdruck: belegt ist der Schlüssel, nicht der Name.
    expect(signaturLabel(status)).toMatch(/^✓ signiert von [0-9a-f ]+$/);
  });

  it("ist mitsigniert: eine ausgetauschte Karte bricht die Signatur", async () => {
    const b = bogen();
    const kp = await schluesselpaarErzeugen();
    const payload = await signiertePayloadBytes(b, zlib, kp.privat, karte);
    // Ein Byte im Namen der Karte kippen (Karte liegt hinter Magic+Schlüssel+Signatur+Längen-Varint).
    const kartenStart = EEB_KARTE_MAGIC.length + 32 + 64 + 1;
    payload[kartenStart + 2] = payload[kartenStart + 2]! ^ 0xff;
    const status = await signaturVonPayload(payload);
    expect(status.zustand).toBe("ungueltig");
    // Bei ungültiger Signatur darf keine Absenderangabe durchkommen.
    expect((status as { absender?: unknown }).absender).toBeUndefined();
  });

  it("bleibt ohne Angaben beim alten Container EEB2S (byte-identisch)", async () => {
    const b = bogen();
    const kp = await schluesselpaarErzeugen();
    const ohne = await signiertePayloadBytes(b, zlib, kp.privat);
    const leer = await signiertePayloadBytes(b, zlib, kp.privat, {});
    expect(Array.from(leer)).toEqual(Array.from(ohne));
    expect(Array.from(leer.subarray(0, 5))).toEqual(Array.from(EEB_SIGNIERT_MAGIC));
  });

  it("kostet nur wenige Bytes gegenüber dem signierten Payload ohne Karte", async () => {
    const b = bogen();
    const kp = await schluesselpaarErzeugen();
    const ohne = await signiertePayloadBytes(b, zlib, kp.privat);
    const mit = await signiertePayloadBytes(b, zlib, kp.privat, karte);
    // Flagbyte + 3 Längenbytes + Feldinhalte + Längen-Varint der Karte.
    expect(mit.length - ohne.length).toBe(kodiereAbsenderkarte(karte).length + 1);
  });

  it("übersteht eine defekte Karte, ohne die Signaturprüfung zu kippen", async () => {
    // Karte behauptet einen längeren Namen, als Bytes folgen → dekodieren wirft,
    // die Signatur bleibt aber gültig: signiert, nur ohne verwertbare Angabe.
    const komprimiert = zlib.deflateRaw(new Uint8Array([1, 2, 3]));
    const kaputt = new Uint8Array([1, 40, 65, 66]); // Flag NAME, Länge 40, nur 2 Bytes
    const kp = await schluesselpaarErzeugen();
    const payload = packePayload({
      komprimiert,
      signatur: { pubkey: kp.oeffentlich, signatur: new Uint8Array(64), karte: kaputt },
    });
    const teile = entpackePayload(payload);
    expect(Array.from(teile.signatur!.karte!)).toEqual(Array.from(kaputt));
    expect(() => dekodiereAbsenderkarte(kaputt)).toThrow();
  });

  it("lehnt einen abgeschnittenen EEB2K-Container ab", () => {
    const zuKurz = new Uint8Array([...EEB_KARTE_MAGIC, ...new Uint8Array(96), 50, 1, 2]);
    expect(() => entpackePayload(zuKurz)).toThrow(/unvollständig/i);
  });

  it("fasst die Angaben für die Anzeige zusammen", () => {
    expect(absenderLabel(karte)).toBe("Max Mustermann · max@thw-oldenburg.de · 0170 1234567");
    expect(absenderLabel({ name: "Max" })).toBe("Max");
    expect(absenderLabel({})).toBe("");
    expect(absenderLabel()).toBe("");
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
