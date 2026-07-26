import { describe, it, expect } from "vitest";
import { deflateRawSync, inflateRawSync } from "node:zlib";
import {
  EEB_KETTE_MAGIC,
  EEB_MAGIC,
  EEB_URL_PREFIX,
  EEB_VORLAGE_MARKER,
  datenDekodieren,
  datenKodieren,
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
  gegengezeichnetePayloadBytes,
  ketteVollstaendig,
  kettenLabel,
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
  const stufe = (fuellung: number, karte?: Uint8Array) => ({
    pubkey: new Uint8Array(32).fill(fuellung),
    signatur: new Uint8Array(64).fill(fuellung + 1),
    ...(karte ? { karte } : {}),
  });

  it("Roundtrip unsigniert (Magic EEB2, keine Stufen)", () => {
    const komprimiert = new Uint8Array([9, 8, 7, 6]);
    const payload = packePayload({ komprimiert, stufen: [] });
    expect(Array.from(payload.subarray(0, 4))).toEqual(Array.from(EEB_MAGIC));
    const teile = entpackePayload(payload);
    expect(teile.stufen).toEqual([]);
    expect(Array.from(teile.komprimiert)).toEqual([9, 8, 7, 6]);
  });

  it("Roundtrip signiert (Magic EEB2C, eine Stufe)", () => {
    const komprimiert = new Uint8Array([1, 2, 3]);
    const payload = packePayload({ komprimiert, stufen: [stufe(7)] });
    expect(Array.from(payload.subarray(0, 5))).toEqual(Array.from(EEB_KETTE_MAGIC));
    const teile = entpackePayload(payload);
    expect(Array.from(teile.komprimiert)).toEqual([1, 2, 3]);
    expect(teile.stufen.length).toBe(1);
    expect(Array.from(teile.stufen[0]!.pubkey)).toEqual(Array.from(new Uint8Array(32).fill(7)));
    expect(teile.stufen[0]!.karte).toBeUndefined();
  });

  it("Roundtrip mehrerer Stufen in Reihenfolge, mit und ohne Karte", () => {
    const komprimiert = new Uint8Array([4, 5]);
    const karte = new Uint8Array([1, 3, 65, 66, 67]);
    const payload = packePayload({ komprimiert, stufen: [stufe(1, karte), stufe(3), stufe(5, karte)] });
    const teile = entpackePayload(payload);
    expect(Array.from(teile.komprimiert)).toEqual([4, 5]);
    expect(teile.stufen.map((s) => s.pubkey[0])).toEqual([1, 3, 5]);
    expect(Array.from(teile.stufen[0]!.karte!)).toEqual(Array.from(karte));
    expect(teile.stufen[1]!.karte).toBeUndefined();
    expect(Array.from(teile.stufen[2]!.karte!)).toEqual(Array.from(karte));
  });

  it("lehnt falsche Schlüssel-/Signaturlänge beim Packen ab", () => {
    expect(() =>
      packePayload({
        komprimiert: new Uint8Array([1]),
        stufen: [{ pubkey: new Uint8Array(31), signatur: new Uint8Array(64) }],
      }),
    ).toThrow(/Länge/i);
  });

  it("lehnt fremde Daten, unvollständige Container und unplausible Stufenzahlen ab", () => {
    expect(() => entpackePayload(new Uint8Array([1, 2, 3, 4, 5, 6]))).toThrow(/Kein EEB2/i);
    // EEB2C-Magic, Stufenzahl 1, aber zu kurz für Schlüssel+Signatur
    expect(() => entpackePayload(new Uint8Array([...EEB_KETTE_MAGIC, 1, 2, 3]))).toThrow(/unvollständig/i);
    // Stufenzahl 0 bzw. absurd hoch → früh und mit klarer Meldung raus
    expect(() => entpackePayload(new Uint8Array([...EEB_KETTE_MAGIC, 0, 1]))).toThrow(/Stufenzahl/i);
    expect(() => entpackePayload(new Uint8Array([...EEB_KETTE_MAGIC, 200, 1]))).toThrow(/Stufenzahl/i);
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
    const payload = datenDekodieren(url.slice(EEB_URL_PREFIX.length));
    const signiert = entpackePayload(payload);
    expect(signiert.stufen.length).toBe(1);
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
    const payload = datenDekodieren(url.slice(EEB_URL_PREFIX.length));
    const kopf = payload.length - entpackePayload(payload).komprimiert.length;
    payload[kopf] = payload[kopf]! ^ 0xff; // erstes komprimiertes Byte verfälschen
    const manipuliert = datenKodieren(payload);
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
    const payload = datenDekodieren(url.slice(EEB_URL_PREFIX.length));
    payload.set(kpB.oeffentlich, EEB_KETTE_MAGIC.length + 1); // pubkey der Stufe 1 tauschen
    const status = await signaturVonText(datenKodieren(payload));
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

  it("reist in der Signaturstufe mit und erscheint nur bei gültiger Signatur", async () => {
    const b = bogen();
    const kp = await schluesselpaarErzeugen();
    const payload = await signiertePayloadBytes(b, zlib, kp.privat, karte);
    expect(Array.from(payload.subarray(0, 5))).toEqual(Array.from(EEB_KETTE_MAGIC));
    expect(entpackePayload(payload).stufen[0]!.karte).toBeDefined();
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
    // Ein Byte im Namen der Karte kippen. Die Karte liegt hinter
    // Magic+Stufenzahl+Schlüssel+Signatur+Kartenlängen-Varint.
    const kartenStart = EEB_KETTE_MAGIC.length + 1 + 32 + 64 + 1;
    payload[kartenStart + 2] = payload[kartenStart + 2]! ^ 0xff;
    const status = await signaturVonPayload(payload);
    expect(status.zustand).toBe("ungueltig");
    // Bei ungültiger Signatur darf keine Absenderangabe durchkommen.
    expect((status as { absender?: unknown }).absender).toBeUndefined();
  });

  it("zählt eine leere Karte als keine Karte (byte-identisch)", async () => {
    const b = bogen();
    const kp = await schluesselpaarErzeugen();
    const ohne = await signiertePayloadBytes(b, zlib, kp.privat);
    const leer = await signiertePayloadBytes(b, zlib, kp.privat, {});
    expect(Array.from(leer)).toEqual(Array.from(ohne));
    expect(entpackePayload(leer).stufen[0]!.karte).toBeUndefined();
  });

  it("kostet nur die Kartenbytes gegenüber dem signierten Payload ohne Karte", async () => {
    const b = bogen();
    const kp = await schluesselpaarErzeugen();
    const ohne = await signiertePayloadBytes(b, zlib, kp.privat);
    const mit = await signiertePayloadBytes(b, zlib, kp.privat, karte);
    // Das Längen-Varint steht in beiden Fällen (ohne Karte als 0).
    expect(mit.length - ohne.length).toBe(kodiereAbsenderkarte(karte).length);
  });

  it("übersteht eine defekte Karte, ohne die Signaturprüfung zu kippen", async () => {
    // Karte behauptet einen längeren Namen, als Bytes folgen → dekodieren wirft,
    // die Signatur bleibt aber gültig: signiert, nur ohne verwertbare Angabe.
    const komprimiert = zlib.deflateRaw(new Uint8Array([1, 2, 3]));
    const kaputt = new Uint8Array([1, 40, 65, 66]); // Flag NAME, Länge 40, nur 2 Bytes
    const kp = await schluesselpaarErzeugen();
    const payload = packePayload({
      komprimiert,
      stufen: [{ pubkey: kp.oeffentlich, signatur: new Uint8Array(64), karte: kaputt }],
    });
    const teile = entpackePayload(payload);
    expect(Array.from(teile.stufen[0]!.karte!)).toEqual(Array.from(kaputt));
    expect(() => dekodiereAbsenderkarte(kaputt)).toThrow();
  });

  it("lehnt eine Stufe mit abgeschnittener Karte ab", () => {
    const zuKurz = new Uint8Array([...EEB_KETTE_MAGIC, 1, ...new Uint8Array(96), 50, 1, 2]);
    expect(() => entpackePayload(zuKurz)).toThrow(/unvollständig/i);
  });

  it("fasst die Angaben für die Anzeige zusammen", () => {
    expect(absenderLabel(karte)).toBe("Max Mustermann · max@thw-oldenburg.de · 0170 1234567");
    expect(absenderLabel({ name: "Max" })).toBe("Max");
    expect(absenderLabel({})).toBe("");
    expect(absenderLabel()).toBe("");
  });
});

describe("Signaturkette beim Weiterreichen", () => {
  it("erhält die Original-Signatur und bezeugt die Weitergabe", async () => {
    const b = bogen();
    const ersteller = await schluesselpaarErzeugen();
    const meldekopf = await schluesselpaarErzeugen();
    const original = await signiertePayloadBytes(b, zlib, ersteller.privat, { name: "Melder" });

    const weiter = await gegengezeichnetePayloadBytes(original, meldekopf.privat, { name: "Meldekopf" });

    // Der Bogen bleibt derselbe — nur die Hülle wächst um eine Stufe.
    gleich(decodePayload(weiter, zlib), b);
    const status = await signaturVonPayload(weiter);
    expect(entpackePayload(weiter).stufen.length).toBe(2);
    expect(status.zustand).toBe("gueltig");
    if (status.zustand !== "gueltig") return;
    // Vorn steht, wer übergeben hat …
    expect(status.kurzform).toBe(schluesselKurzform(meldekopf.oeffentlich));
    expect(status.absender?.name).toBe("Meldekopf");
    // … die Kette beginnt beim Ursprung.
    expect(status.stufen?.map((s) => s.kurzform)).toEqual([
      schluesselKurzform(ersteller.oeffentlich),
      schluesselKurzform(meldekopf.oeffentlich),
    ]);
    expect(status.stufen?.[0]?.absender?.name).toBe("Melder");
    expect(ketteVollstaendig(status)).toBe(true);
    expect(kettenLabel(status)).toBe(
      `${schluesselKurzform(ersteller.oeffentlich)} (Ursprung) → ${schluesselKurzform(meldekopf.oeffentlich)}`,
    );
  });

  it("trägt auch über mehrere Stufen und ohne eigene Karte", async () => {
    const b = bogen();
    const a = await schluesselpaarErzeugen();
    const c = await schluesselpaarErzeugen();
    const d = await schluesselpaarErzeugen();
    // Ursprung ohne Karte (Kartenlänge 0) — die Kette muss das aushalten.
    const s1 = await signiertePayloadBytes(b, zlib, a.privat);
    expect(entpackePayload(s1).stufen[0]!.karte).toBeUndefined();
    const s2 = await gegengezeichnetePayloadBytes(s1, c.privat);
    const s3 = await gegengezeichnetePayloadBytes(s2, d.privat, { name: "Leitstelle" });

    gleich(decodePayload(s3, zlib), b);
    const status = await signaturVonPayload(s3);
    expect(status.zustand).toBe("gueltig");
    if (status.zustand !== "gueltig") return;
    expect(status.stufen?.map((s) => s.kurzform)).toEqual([
      schluesselKurzform(a.oeffentlich),
      schluesselKurzform(c.oeffentlich),
      schluesselKurzform(d.oeffentlich),
    ]);
    expect(ketteVollstaendig(status)).toBe(true);
  });

  it("deckt eine gefälschte frühere Stufe auf, ohne die letzte zu entwerten", async () => {
    const b = bogen();
    const ersteller = await schluesselpaarErzeugen();
    const faelscher = await schluesselpaarErzeugen();
    const meldekopf = await schluesselpaarErzeugen();
    const original = await signiertePayloadBytes(b, zlib, ersteller.privat);
    // Herkunft behaupten, aber mit fremdem Schlüssel: die Signatur der Stufe 1
    // passt nicht zum genannten Ursprung.
    const teile = entpackePayload(original);
    const gefaelscht = packePayload({
      komprimiert: teile.komprimiert,
      stufen: [{ pubkey: faelscher.oeffentlich, signatur: teile.stufen[0]!.signatur }],
    });
    const weiter = await gegengezeichnetePayloadBytes(gefaelscht, meldekopf.privat);

    const status = await signaturVonPayload(weiter);
    // Die letzte Stufe ist echt (der Meldekopf hat genau diese Bytes übergeben),
    // der behauptete Ursprung aber nicht gedeckt.
    expect(status.zustand).toBe("gueltig");
    if (status.zustand !== "gueltig") return;
    expect(ketteVollstaendig(status)).toBe(false);
    expect(status.stufen?.[0]?.zustand).toBe("ungueltig");
    expect(status.stufen?.[1]?.zustand).toBe("gueltig");
    expect(kettenLabel(status)).toMatch(/nicht gedeckt/);
  });

  it("bindet die Reihenfolge: eine entfernte Zwischenstufe bricht die letzte Signatur", async () => {
    const b = bogen();
    const a = await schluesselpaarErzeugen();
    const c = await schluesselpaarErzeugen();
    const d = await schluesselpaarErzeugen();
    const s3 = await gegengezeichnetePayloadBytes(
      await gegengezeichnetePayloadBytes(await signiertePayloadBytes(b, zlib, a.privat), c.privat),
      d.privat,
    );
    const { komprimiert, stufen } = entpackePayload(s3);
    // Mittlere Stufe herausschneiden — Stufe 3 hat sie mitgezeichnet.
    const gekuerzt = packePayload({ komprimiert, stufen: [stufen[0]!, stufen[2]!] });
    const status = await signaturVonPayload(gekuerzt);
    expect(status.zustand).toBe("ungueltig");
  });

  it("bindet die Reihenfolge: getauschte Stufen brechen die Prüfung", async () => {
    const b = bogen();
    const a = await schluesselpaarErzeugen();
    const c = await schluesselpaarErzeugen();
    const original = await signiertePayloadBytes(b, zlib, a.privat);
    const weiter = await gegengezeichnetePayloadBytes(original, c.privat);
    const { komprimiert, stufen } = entpackePayload(weiter);
    const vertauscht = packePayload({ komprimiert, stufen: [stufen[1]!, stufen[0]!] });
    const status = await signaturVonPayload(vertauscht);
    expect(status.zustand).toBe("ungueltig");
  });

  it("bemerkt veränderte Nutzdaten in der ganzen Kette", async () => {
    const b = bogen();
    const ersteller = await schluesselpaarErzeugen();
    const meldekopf = await schluesselpaarErzeugen();
    const original = await signiertePayloadBytes(b, zlib, ersteller.privat);
    const weiter = await gegengezeichnetePayloadBytes(original, meldekopf.privat);
    // Ein Byte im komprimierten Strom kippen (letztes Byte des Payloads).
    weiter[weiter.length - 1]! ^= 0xff;
    const status = await signaturVonPayload(weiter);
    expect(status.zustand).toBe("ungueltig");
  });

  it("lässt einen unsignierten Empfang nicht gegenzeichnen", async () => {
    const roh = encodePayload(bogen(), zlib);
    const kp = await schluesselpaarErzeugen();
    await expect(gegengezeichnetePayloadBytes(roh, kp.privat)).rejects.toThrow(/unsigniert/i);
  });

  it("bleibt ein lesbarer Bogen mit Karte je Stufe", async () => {
    const b = bogen();
    const ersteller = await schluesselpaarErzeugen();
    const meldekopf = await schluesselpaarErzeugen();
    const original = await signiertePayloadBytes(b, zlib, ersteller.privat, { name: "Melder" });
    const weiter = await gegengezeichnetePayloadBytes(original, meldekopf.privat, { name: "Meldekopf" });

    expect(Array.from(weiter.subarray(0, 5))).toEqual(Array.from(EEB_KETTE_MAGIC));
    const teile = entpackePayload(weiter);
    expect(teile.stufen.map((s) => dekodiereAbsenderkarte(s.karte!))).toEqual([
      { name: "Melder" },
      { name: "Meldekopf" },
    ]);
    gleich(decodePayload(weiter, zlib), b);
  });

  it("kostet je Stufe nur die Signaturhülle", async () => {
    const b = bogen();
    const a = await schluesselpaarErzeugen();
    const c = await schluesselpaarErzeugen();
    const original = await signiertePayloadBytes(b, zlib, a.privat);
    const weiter = await gegengezeichnetePayloadBytes(original, c.privat);
    // Schlüssel + Signatur (96) + Kartenrahmen/Flags/Längen — deutlich unter 120.
    expect(weiter.length - original.length).toBeLessThan(120);
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
