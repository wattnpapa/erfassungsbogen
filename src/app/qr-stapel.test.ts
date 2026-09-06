import { describe, it, expect } from "vitest";
import { deflateRawSync, inflateRawSync } from "node:zlib";
import { encodePayload, encodePayloadUrl, encodeVorlagePayloadUrl, segmentPayloadUrls, type Kompressor } from "../codec";
import {
  Ernaehrung,
  Fahrerlaubnis,
  Geschlecht,
  OrganisationsTyp,
  PersonalErfassung,
  SCHEMA_VERSION,
  StaerkeRolle,
  datumAusIso,
  type Erfassungsbogen,
  type Person,
} from "../model";
import { istBilddatei, qrStapelLesen, stapelBericht, type StapelDatei } from "./qr-stapel";

const zlib: Kompressor = {
  deflateRaw: (d) => new Uint8Array(deflateRawSync(d, { level: 9 })),
  inflateRaw: (d) => new Uint8Array(inflateRawSync(d)),
};

function person(rolle: StaerkeRolle, nachname: string): Person {
  return {
    nachname,
    vorname: "Max",
    staerkeRolle: rolle,
    funktionen: [],
    fahrerlaubnis: Fahrerlaubnis.NONE,
    geschlecht: Geschlecht.M,
    ernaehrung: Ernaehrung.FLEISCH,
    kontakte: [],
    zusatzqualifikationen: [],
  };
}

function bogen(name: string): Erfassungsbogen {
  return {
    schemaVersion: SCHEMA_VERSION,
    stand: datumAusIso("2026-05-14"),
    einheit: {
      organisation: OrganisationsTyp.THW,
      einheitsTyp: { code: 43 },
      hierarchie: [{ bezeichnung: { code: 1 }, name }],
    },
    einsatz: { zeitraumVon: datumAusIso("2026-05-14"), zeitraumBis: datumAusIso("2026-05-16"), ortAuftrag: "Musterstadt" },
    personalErfassung: PersonalErfassung.NUR_STAERKE,
    personal: [person(StaerkeRolle.FUEHRER, "Muster"), person(StaerkeRolle.MANNSCHAFT, "Beispiel")],
    fahrzeuge: [],
  };
}

/** Der Name der Einheit steckt in der Hierarchie — kurzer Weg fürs Prüfen. */
function einheitName(b: Erfassungsbogen): string | undefined {
  return b.einheit.hierarchie?.[0]?.name;
}

/**
 * Der Stapel bekommt keine echten Bilder: die Dateien tragen ihren QR-Text im
 * Blob, der eingesetzte Leser gibt ihn zurück. So prüft der Test die
 * Stapellogik (Reihenfolge, Segmentsammlung, Bericht) ohne Canvas und WASM.
 */
function datei(name: string, text: string | null): StapelDatei {
  return { name, blob: { text: () => Promise.resolve(text ?? "") } as unknown as Blob };
}

async function lesen(blob: Blob): Promise<string | null> {
  const t = await blob.text();
  return t === "" ? null : t;
}

const optionen = { lesen, kompressor: zlib };

describe("qrStapelLesen", () => {
  it("liest mehrere Einzelbögen und meldet Bilder ohne Code", async () => {
    const erg = await qrStapelLesen(
      [
        datei("b1.jpg", encodePayloadUrl(bogen("1. Bergungsgruppe"), zlib)),
        datei("leer.jpg", null),
        datei("b2.jpg", encodePayloadUrl(bogen("Fachgruppe Räumen"), zlib)),
      ],
      optionen,
    );
    expect(erg.gelesen).toBe(3);
    expect(erg.funde.map((f) => einheitName(f.bogen))).toEqual(["1. Bergungsgruppe", "Fachgruppe Räumen"]);
    expect(erg.funde[0]!.payload).not.toBeNull();
    expect(erg.fehler).toEqual([{ datei: "leer.jpg", grund: "kein-code", text: "Kein QR-Code im Bild gefunden." }]);
    expect(erg.luecken).toEqual([]);
  });

  it("setzt einen mehrteiligen Bogen aus mehreren Bildern zusammen — auch in falscher Reihenfolge", async () => {
    const b = bogen("Zugtrupp");
    const urls = segmentPayloadUrls(encodePayload(b, zlib), 3);
    const erg = await qrStapelLesen(
      // Die Namen sortieren die Teile absichtlich anders als ihre Teilnummern.
      [datei("c.jpg", urls[1]!), datei("a.jpg", urls[2]!), datei("b.jpg", urls[0]!)],
      optionen,
    );
    expect(erg.funde).toHaveLength(1);
    expect(einheitName(erg.funde[0]!.bogen)).toBe("Zugtrupp");
    expect(erg.funde[0]!.datei).toBe("a.jpg + b.jpg + c.jpg");
    expect(erg.luecken).toEqual([]);
  });

  it("hält zwei mehrteilige Bögen auseinander, die durcheinander im Ordner liegen", async () => {
    const eins = segmentPayloadUrls(encodePayload(bogen("Erste Gruppe"), zlib), 2);
    const zwei = segmentPayloadUrls(encodePayload(bogen("Zweite Gruppe"), zlib), 2);
    const erg = await qrStapelLesen(
      [datei("1.jpg", eins[0]!), datei("2.jpg", zwei[0]!), datei("3.jpg", eins[1]!), datei("4.jpg", zwei[1]!)],
      optionen,
    );
    expect(erg.funde.map((f) => einheitName(f.bogen)).sort()).toEqual(["Erste Gruppe", "Zweite Gruppe"]);
    expect(erg.luecken).toEqual([]);
  });

  it("meldet fehlende Teile statt sie still zu verwerfen", async () => {
    const urls = segmentPayloadUrls(encodePayload(bogen("Fachgruppe Wasserschaden"), zlib), 3);
    const erg = await qrStapelLesen([datei("teil1.jpg", urls[0]!)], optionen);
    expect(erg.funde).toEqual([]);
    expect(erg.luecken).toEqual([{ dateien: ["teil1.jpg"], haben: 1, anzahl: 3, fehlen: [2, 3] }]);
    expect(stapelBericht(erg, 0, 0).join(" ")).toContain("fehlen die Teile 2, 3");
  });

  it("zählt ein doppelt fotografiertes Teil nicht doppelt", async () => {
    const urls = segmentPayloadUrls(encodePayload(bogen("Fachgruppe Ortung"), zlib), 2);
    const erg = await qrStapelLesen(
      [datei("a.jpg", urls[0]!), datei("b.jpg", urls[0]!), datei("c.jpg", urls[1]!)],
      optionen,
    );
    expect(erg.funde).toHaveLength(1);
    expect(erg.funde[0]!.datei).toBe("a.jpg + c.jpg");
  });

  it("nimmt Vorlagen und fremde Codes nicht als Meldung auf", async () => {
    const erg = await qrStapelLesen(
      [datei("vorlage.png", encodeVorlagePayloadUrl(bogen("Muster"), zlib)), datei("fremd.png", "https://example.org/")],
      optionen,
    );
    expect(erg.funde).toEqual([]);
    expect(erg.fehler.map((f) => f.grund)).toEqual(["kein-bogen", "vorlage"]);
  });

  it("bricht ab, ohne die restlichen Bilder anzufassen", async () => {
    let gelesen = 0;
    const erg = await qrStapelLesen(
      [datei("a.jpg", encodePayloadUrl(bogen("A"), zlib)), datei("b.jpg", encodePayloadUrl(bogen("B"), zlib))],
      {
        ...optionen,
        lesen: async (blob) => {
          gelesen++;
          return lesen(blob);
        },
        abbruch: () => gelesen >= 1,
      },
    );
    expect(gelesen).toBe(1);
    expect(erg.abgebrochen).toBe(true);
    expect(erg.funde).toHaveLength(1);
    expect(stapelBericht(erg, 1, 0)).toContain("Abgebrochen — die restlichen Bilder wurden nicht gelesen.");
  });

  it("bericht nennt Aufnahme und Dubletten", () => {
    const zeilen = stapelBericht({ gelesen: 5, funde: [], fehler: [], luecken: [], abgebrochen: false }, 3, 2);
    expect(zeilen[0]).toBe("5 Bilder gelesen — 3 Bögen aufgenommen, 2 bereits vorhanden.");
  });
});

describe("istBilddatei", () => {
  it("erkennt Bilder an Typ und Endung", () => {
    expect(istBilddatei("foto.JPG")).toBe(true);
    expect(istBilddatei("scan", "image/png")).toBe(true);
    expect(istBilddatei("bogen.heic")).toBe(true);
  });

  it("übergeht alles andere und macOS-Beifang", () => {
    expect(istBilddatei("bericht.pdf", "application/pdf")).toBe(false);
    expect(istBilddatei("notizen.txt")).toBe(false);
    expect(istBilddatei("._foto.jpg")).toBe(false);
    expect(istBilddatei("ordner/.DS_Store")).toBe(false);
  });
});
