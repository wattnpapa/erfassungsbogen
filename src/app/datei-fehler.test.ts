/**
 * Datei-Eingänge erklären kaputte und falsche Dateien in Alltagssprache und
 * nennen den nächsten Schritt — Parser-Text („Unexpected end of JSON input")
 * erscheint nie (Audit Runde 2, R2-E5).
 */

import { describe, it, expect } from "vitest";
import { SCHEMA_VERSION } from "@bos/eeb-format/model";
import { dateiArt, dateiFehlerMeldung, dateiFehlerText } from "./datei-fehler";

const bogenJson = JSON.stringify({ schemaVersion: SCHEMA_VERSION, einheit: {}, einsatz: {}, personal: [] });

describe("dateiArt", () => {
  it("erkennt leere, abgeschnittene und fremde Dateien", () => {
    expect(dateiArt("")).toBe("leer");
    expect(dateiArt(bogenJson.slice(0, bogenJson.length / 2))).toBe("json-kaputt");
    expect(dateiArt("Name;Vorname;Funktion\nMüller;Anna;GF\n")).toBe("tabelle");
    expect(dateiArt("%PDF-1.4\n1 0 obj")).toBe("pdf-kaputt");
    expect(dateiArt("%PDF-1.4\n1 0 obj\n%%EOF\n")).toBe("pdf");
    expect(dateiArt('{"hallo":1}')).toBe("json-fremd");
  });

  it("erkennt die Dateien der App an ihrem Umschlag", () => {
    expect(dateiArt(bogenJson)).toBe("bogen");
    expect(dateiArt(`[${bogenJson}]`)).toBe("boegen");
    expect(dateiArt('{"typ":"eeb-einsatz","version":1,"einsatz":{}}')).toBe("einsatz");
    expect(dateiArt('{"format":"eeb-vorlage"}')).toBe("vorlage");
    expect(dateiArt('{"format":"eeb-sicherung"}')).toBe("sicherung");
    expect(dateiArt(JSON.stringify({ schemaVersion: SCHEMA_VERSION + 1, einheit: {} }))).toBe("bogen-neuer");
  });
});

describe("dateiFehlerText", () => {
  it("nennt bei einer abgeschnittenen Datei Ursache und nächsten Schritt", () => {
    const t = dateiFehlerText("bogen.json", "json-kaputt", "bogen")!;
    expect(t).toMatch(/beschädigt oder unvollständig/);
    expect(t).toMatch(/neu anfordern oder den QR-Code/);
  });

  it("sagt bei einer Liste, dass sie keine Datei der App ist", () => {
    expect(dateiFehlerText("liste.csv", "tabelle", "boegen")).toMatch(/Tabelle oder Liste, keine Datei dieser App/);
  });

  it("verweist eine Datei für einen anderen Knopf dorthin", () => {
    expect(dateiFehlerText("x.json", "einsatz", "bogen")).toMatch(/„Einsatz importieren…“/);
    expect(dateiFehlerText("x.json", "sicherung", "einsatz")).toMatch(/Datensicherung.*ersetzt alle Daten/);
    expect(dateiFehlerText("x.json", "bogen", "sicherung")).toMatch(/„Aus Datei laden…“/);
  });

  it("schweigt, wenn die Art zum Weg passt", () => {
    expect(dateiFehlerText("x.pdf", "pdf", "bogen")).toBeNull();
    expect(dateiFehlerText("x.json", "bogen", "einsatz")).toBeNull();
  });

  it("beruhigt bei der Sicherung: die Daten auf dem Gerät sind unverändert", () => {
    expect(dateiFehlerText("s.json", "json-kaputt", "sicherung")).toMatch(/Daten auf diesem Gerät sind unverändert/);
  });
});

describe("dateiFehlerMeldung", () => {
  it("zeigt nie den Parser-Text", async () => {
    const halb = new File([bogenJson.slice(0, 20)], "kaputt.json", { type: "application/json" });
    let parserFehler: unknown;
    try {
      JSON.parse(bogenJson.slice(0, 20));
    } catch (e) {
      parserFehler = e;
    }
    const t = await dateiFehlerMeldung(halb, parserFehler, "einsatz");
    expect(t).not.toMatch(/Unexpected|JSON/);
    expect(t).toMatch(/„kaputt.json“ ist beschädigt/);
  });

  it("reicht eigene, verständliche Meldungen einer passenden Datei durch", async () => {
    const pdf = new File(["%PDF-1.4\n%%EOF\n"], "leer.pdf", { type: "application/pdf" });
    const t = await dateiFehlerMeldung(pdf, new Error("In dieser PDF steckt kein Erfassungsbogen."), "bogen");
    expect(t).toBe("In dieser PDF steckt kein Erfassungsbogen.");
  });

  it("fällt bei unerklärlichen Programmfehlern auf eine allgemeine Meldung zurück", async () => {
    const d = new File([bogenJson], "b.json", { type: "application/json" });
    const t = await dateiFehlerMeldung(d, new TypeError("Cannot read properties of undefined"), "bogen");
    expect(t).toMatch(/ließ sich nicht lesen\. Bitte beim Absender neu anfordern/);
  });
});
