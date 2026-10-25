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

describe("Hülle des beiseitegelegten Entwurfs (R7-E1)", () => {
  const huelle = JSON.stringify({ gespeichert: 1, bogen: { schemaVersion: SCHEMA_VERSION, einheit: {}, einsatz: {}, personal: [] } });

  it("erkennt die Hülle als gesicherten Entwurf, nicht als fremde Datei", () => {
    expect(dateiArt(huelle)).toBe("entwurf");
    expect(dateiArt('{"gespeichert":"gestern","bogen":{}}')).toBe("json-fremd");
  });

  it("lässt über „Aus Datei laden…“ die genaue Ursache der Hülle zu Wort kommen", async () => {
    // Für den Weg „bogen" erklärt dateiFehlerText nichts → die Meldung der Stelle, die ablehnte, bleibt.
    expect(dateiFehlerText("e.json", "entwurf", "bogen")).toBeNull();
    const datei = new File([huelle], "e.json");
    const fehler = new Error("Der gesicherte Entwurf lässt sich nicht öffnen. Der Bogen ist unvollständig: die Organisation der Einheit fehlt.");
    const meldung = await dateiFehlerMeldung(datei, fehler, "bogen");
    expect(meldung).toContain("Organisation der Einheit fehlt");
    expect(meldung).not.toContain("stammt nicht aus dieser App");
    // Über den falschen Knopf: Wohin die Datei gehört.
    expect(dateiFehlerText("e.json", "entwurf", "einsatz")).toContain("Aus Datei laden");
  });
});

describe("Eigene Bogendatei mit defektem Feld (R8-E3)", () => {
  const ohneEinheit = JSON.stringify({ schemaVersion: 8, stand: 100, einsatz: { zeitraumVon: 1, zeitraumBis: 2 }, personalErfassung: 0, personal: [], fahrzeuge: [] });
  const personalNull = JSON.stringify({
    schemaVersion: 8,
    stand: 100,
    einheit: { organisation: 1, hierarchie: [] },
    einsatz: { zeitraumVon: 1, zeitraumBis: 2 },
    personalErfassung: 0,
    personal: null,
    fahrzeuge: [],
  });

  it("nennt das fehlende Feld statt „stammt nicht aus dieser App“", async () => {
    expect(dateiArt(ohneEinheit)).toBe("bogen-defekt");
    const m = await dateiFehlerMeldung(new File([ohneEinheit], "ohne-einheit.json"), new Error("Keine gültige Erfassungsbogen-Datei (Schema-Version 2–9 erwartet)."), "bogen");
    expect(m).toContain("stammt aus dieser App, ist aber unvollständig");
    expect(m).toContain("die Einheit fehlt");
    expect(m).not.toContain("stammt nicht aus dieser App");
  });

  it("nennt bei personal: null die Personenliste, nicht die Schema-Version", async () => {
    const { bogenPruefen } = await import("./hilfen");
    let fehler: unknown;
    try {
      bogenPruefen(JSON.parse(personalNull));
    } catch (e) {
      fehler = e;
    }
    const m = await dateiFehlerMeldung(new File([personalNull], "p.json"), fehler, "bogen");
    expect(m).toContain("die Personenliste fehlt");
    expect(m).not.toContain("Schema-Version 2");
  });

  it("bogenPruefen sagt bei gültiger Version das Feld, bei fremder Version die Version", async () => {
    const { bogenPruefen } = await import("./hilfen");
    expect(() => bogenPruefen(JSON.parse(personalNull))).toThrow(/die Personenliste fehlt/);
    expect(() => bogenPruefen({ schemaVersion: 99 })).toThrow(/Schema-Version 2/);
  });
});
