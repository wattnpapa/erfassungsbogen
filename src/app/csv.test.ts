import { describe, expect, it } from "vitest";
import { csvFeld, csvZeile } from "./csv";

describe("csvFeld", () => {
  it("lässt harmlosen Text unangetastet", () => {
    expect(csvFeld("Max Mustermann")).toBe("Max Mustermann");
  });

  it("quotet Trenner, Anführungszeichen und Umbrüche", () => {
    expect(csvFeld("a;b")).toBe('"a;b"');
    expect(csvFeld('sagt "hallo"')).toBe('"sagt ""hallo"""');
    expect(csvFeld("Zeile1\nZeile2")).toBe('"Zeile1\nZeile2"');
  });

  it("quotet Werte mit Rand-Leerzeichen", () => {
    expect(csvFeld(" führend")).toBe('" führend"');
  });

  it("neutralisiert Formel-Präfixe gegen CSV-Injection", () => {
    expect(csvFeld("=HYPERLINK(\"http://evil\")")).toBe('"\'=HYPERLINK(""http://evil"")"');
    expect(csvFeld("=cmd|'/c calc'!A1")).toBe("'=cmd|'/c calc'!A1");
    expect(csvFeld("+1")).toBe("'+1");
    expect(csvFeld("-SUMME")).toBe("'-SUMME");
    expect(csvFeld("@import")).toBe("'@import");
    expect(csvFeld("\tTab")).toBe("'\tTab");
  });

  it("lässt negative Zahlen als Zahl unberührt (kein Formel-Präfix)", () => {
    expect(csvFeld(-5)).toBe("-5");
    expect(csvFeld(-5.5)).toBe("-5,5");
  });

  it("csvZeile verbindet Felder mit dem Trenner", () => {
    expect(csvZeile(["a", "=b", 3])).toBe("a;'=b;3");
  });
});
