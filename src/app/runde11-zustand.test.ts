/** Runde 11, Block Zustand: reine Logik der Behebungen (E3, E4, E5, E6, E7, D3, O3). */
import { describe, expect, it } from "vitest";
import { telefonAlsTabellenText, telefonBereinigen, telefonKurzHinweis } from "./telefon-eingabe";
import { parseNamen } from "./personal-schnell";
import { freitextQrHinweis, qrGroessePosten } from "./qr-posten";
import { neuePerson, neuerBogen } from "./hilfen";
import { ansprechWechselSatz } from "./schritte/personal";
import { ortGeaendert } from "./schritte/einheit";
import { KontaktArt } from "@bos/eeb-format/model";

describe("R11-E3 Telefonfelder", () => {
  it("behält das führende Plus", () => {
    expect(telefonBereinigen("+49 171 1234567").wert).toBe("+491711234567");
  });
  it("trennt eine zweite Nummer ab und nennt sie", () => {
    const r = telefonBereinigen("0171 1234567 / 0441 99");
    expect(r.wert).toBe("01711234567");
    expect(r.hinweis).toContain("Zweite Nummer");
  });
  it("Schrägstrich hinter der Vorwahl trennt nichts", () => {
    expect(telefonBereinigen("0441/998877")).toEqual({ wert: "0441998877", hinweis: "" });
  });
  it("nennt entfernte Zeichen", () => {
    const r = telefonBereinigen("0441 abc");
    expect(r.wert).toBe("0441");
    expect(r.hinweis).toContain("Nur Ziffern");
  });
  it("fragt bei kurzen Nummern nach", () => {
    expect(telefonKurzHinweis("017112")).toContain("stimmt die Nummer");
    expect(telefonKurzHinweis("01711234567")).toBe("");
    expect(telefonKurzHinweis("")).toBe("");
  });
});

describe("R11-E7 CSV-Telefon", () => {
  it("macht Ziffernfolgen zu Text", () => {
    expect(telefonAlsTabellenText("0441123")).toBe("Tel. 0441123");
    expect(telefonAlsTabellenText(undefined)).toBe("");
  });
});

describe("R11-E4 Namenspräfixe", () => {
  it("schlägt von/van/der dem Nachnamen zu", () => {
    expect(parseNamen("Jan-Erik von der Heide-Müller")[0]).toMatchObject({ vorname: "Jan-Erik", nachname: "von der Heide-Müller" });
    expect(parseNamen("Anna van der Berg")[0]).toMatchObject({ vorname: "Anna", nachname: "van der Berg" });
    expect(parseNamen("Hans Meier")[0]).toMatchObject({ vorname: "Hans", nachname: "Meier" });
  });
  it("kennzeichnet „Vorname Nachname, Funktion“ als unsicher", () => {
    expect(parseNamen("Lena Nowak, Zugführerin, 0171 99")[0]!.unsicher).toBe(true);
    expect(parseNamen("Nowak, Lena")[0]!.unsicher).toBeUndefined();
  });
});

describe("R11-E5 Freitext und QR", () => {
  it("warnt ab 500 Zeichen", () => {
    expect(freitextQrHinweis("x".repeat(499))).toBe("");
    expect(freitextQrHinweis("x".repeat(2000))).toContain("vergrößern den QR-Code");
  });
  it("nennt den Freitext als Hauptposten", () => {
    const b = neuerBogen();
    b.sonstiges = "wort ".repeat(2000);
    expect(qrGroessePosten(b)).toMatch(/^Freitext „Sonstiges"/);
  });
});

describe("R11-E1 Ortswechsel", () => {
  it("erkennt den geänderten Ort", () => {
    expect(ortGeaendert("Neustadtfeld", "Freiburg")).toBe(true);
    expect(ortGeaendert(" freiburg ", "Freiburg")).toBe(false);
  });
});

describe("R11-D3 Ansprechperson", () => {
  it("nennt den Nachfolger und fehlende Nummer", () => {
    const a = { ...neuePerson(), nachname: "Lang", kontakte: [{ art: KontaktArt.MOBIL, dienstlich: false, wert: "0171" }] };
    const b = { ...neuePerson(), nachname: "Lehmann" };
    expect(ansprechWechselSatz([a, b])).toMatch(/Lehmann.*OHNE Erreichbarkeit/);
    expect(ansprechWechselSatz([a])).toContain("keine Ansprechperson");
  });
});
