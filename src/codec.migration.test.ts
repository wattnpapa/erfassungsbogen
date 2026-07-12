import { describe, it, expect } from "vitest";
import { deflateRawSync, inflateRawSync } from "node:zlib";
import { decodePayloadUrl, type Kompressor } from "./codec";
import { Ernaehrung, SCHEMA_VERSION } from "./model";

const zlib: Kompressor = {
  deflateRaw: (d) => new Uint8Array(deflateRawSync(d, { level: 9 })),
  inflateRaw: (d) => new Uint8Array(inflateRawSync(d)),
};

/**
 * EINGEFRORENE Golden-Fixture: ein echter QR-Payload im ALTEN Schema v2,
 * erzeugt mit dem v2-Wire-Format (Person ohne Ernährungs-Byte; Sofortbedarf
 * mit "davonVegetarisch"-Byte). Diese Bytes dürfen sich NIE ändern — sie
 * stehen stellvertretend für alle QR-Codes/Dateien, die Nutzer vor der
 * Schema-v3-Umstellung erzeugt haben. Bricht dieser Test, ist die
 * Abwärtskompatibilität verletzt (siehe docs/datenmodell.md, Migrationspolicy).
 *
 * Inhalt (v2): THW OV Oldenburg, FGr K (A), 3 Personen, 1 Fahrzeug,
 * Sofortbedarf für 20 Personen mit davonVegetarisch = 3.
 */
const V2_QR_URL =
  "https://erfassungsbogen.app/#RUVCMmNawc7IoC3oH6bgn5OSmpdUWpSuoKvgl8nIysiHKsLN4mjCyMrP4u_v4sqwgn01u6xbalFebmpOSmpSYunhPUmleekK3olJqTlJOZklVQzMHF75GYl5eanF7EGlKfk5BRmdjOxMDNyMBUImAfJcjAwsjnl5iazhqUmpRQIMDAzMIfm57G6ZxckZqUWsDAwMjMKMayezMoowM4AAAA";

describe("Abwärtskompatibilität: alter v2-QR-Code", () => {
  const bogen = decodePayloadUrl(V2_QR_URL, zlib);

  it("wird auf die aktuelle Schema-Version gehoben", () => {
    expect(bogen.schemaVersion).toBe(SCHEMA_VERSION);
  });

  it("liest Einheit, Personal und Fahrzeug korrekt", () => {
    expect(bogen.einheit.name).toBe("OV Oldenburg - Ni");
    expect(bogen.einheit.einheitsTyp).toEqual({ code: 43 });
    expect(bogen.personal.map((p) => `${p.vorname} ${p.nachname}`)).toEqual([
      "Johannes Rudolph",
      "Anna Weber",
      "Tom Fischer",
    ]);
    expect(bogen.fahrzeuge[0]).toMatchObject({ typ: { code: 1 }, thwKennzeichen: 84397, stanKonform: true });
  });

  it("setzt für v2-Personen die fehlende Ernährungsform auf FLEISCH", () => {
    // v2 kannte kein Ernährungsfeld — Migration muss einen sinnvollen Default setzen.
    expect(bogen.personal.every((p) => p.ernaehrung === Ernaehrung.FLEISCH)).toBe(true);
  });

  it("rettet die alte Aggregatzahl 'davonVegetarisch' in verpflegungManuell", () => {
    // In v2 stand die Vegetarier-Zahl im Sofortbedarf; ab v3 wird sie aus dem
    // Personal abgeleitet. Damit die Angabe nicht verlorengeht, migriert sie
    // in verpflegungManuell.
    expect(bogen.verpflegungManuell).toEqual({ vegetarisch: 3, vegan: 0 });
    expect(bogen.sofortbedarf?.verpflegungPersonen).toBe(20);
  });

  it("behält die erste Person mit dienstlichem E-Mail-Template und Mobilnummer", () => {
    const johannes = bogen.personal[0]!;
    expect(johannes.kontakte).toEqual([
      { art: 0, dienstlich: false, wert: "01701234501" },
      { art: 2, dienstlich: false, emailTemplate: 1 },
    ]);
  });
});
