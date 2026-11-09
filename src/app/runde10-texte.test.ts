/**
 * Runde 10, Block Texte und Logik: Gleiche Hinweise im Lageblatt einmal (R10-A4), vereinfachte Zeichen in der PDF
 * (R10-W1), Hinweise zum Ort der Einheit (R10-N3), Dateifehler beim Einsatzimport (R10-E6).
 */
import { describe, expect, it } from "vitest";
import { namePapier, vereinfachtBetroffene, winAnsiText, zeichenVereinfacht } from "./pdf-dokument";
import { dateiFehlerText } from "./datei-fehler";
import { neuerBogen, neuePerson, pruefpunkte } from "./hilfen";
import { speicherFehlerKurz } from "./speicher-fehler-text";

describe("Warnung zum Ort der Einheit (R10-N3, R10-M1)", () => {
  it("trägt dasselbe Wort wie das Feld und springt auf das Feld", () => {
    const p = pruefpunkte(neuerBogen(), false).find((x) => x.text.startsWith("Zugehörigkeit"))!;
    expect(p.text).toBe("Zugehörigkeit: Der Ort der Einheit (unterste Ebene) fehlt.");
    expect(p.feld).toBe("feld-einheit-name");
  });
});

describe("PDF: vereinfachte Zeichen (R10-W1)", () => {
  it("erkennt einzelne vereinfachte Buchstaben und vermerkt sie", () => {
    expect(zeichenVereinfacht("Łukasz")).toBe(true);
    expect(zeichenVereinfacht("Dvořák")).toBe(true); // ř steht in WinAnsi nicht (Dvorak)
    expect(zeichenVereinfacht("Müller, Zoë")).toBe(false);
    expect(namePapier("Łukasz", "Zoë")).toBe("Łukasz, Zoë (vereinfacht)");
    expect(namePapier("Müller", "Hans")).toBe("Müller, Hans");
  });

  it("erweitert die Umschrift-Tabelle und nennt die Betroffenen in der Quittung", () => {
    expect(winAnsiText("Łukasz Đorđe Straße Søren Ħ")).toBe("Lukasz Dorde Straße Søren H");
    const b = neuerBogen();
    b.personal = [
      { ...neuePerson(), vorname: "Anna", nachname: "Meier" },
      { ...neuePerson(), vorname: "Zoë", nachname: "Łukasz" },
    ];
    expect(vereinfachtBetroffene(b)).toEqual(["Zoë Łukasz → Zoë Lukasz"]);
  });
});

describe("Dateifehler beim Einsatzimport (R10-E6)", () => {
  it("verweist auf Sammel-PDF oder Einsatzsicherung, nicht auf die PDF des Bogens", () => {
    const t = dateiFehlerText("falsch.txt", "fremd", "einsatz")!;
    expect(t).toContain("Sammel-PDF");
    expect(t).not.toContain("PDF des Bogens");
    expect(dateiFehlerText("falsch.txt", "fremd", "bogen")!).toContain("PDF des Bogens");
    expect(dateiFehlerText("leer.pdf", "leer", "einsatz")!).toContain("Sammel-PDF");
  });
});

describe("Speicher voll bei Sollstärke (R10-A3)", () => {
  it("nennt die Sollstärke mit dem Wort „Soll“", () => {
    expect(speicherFehlerKurz("voll", true, true)).toContain("Sollstärke (nicht gezählt)");
    expect(speicherFehlerKurz("voll", true)).toContain("Die Stärke jetzt");
  });
});

describe("Browser-Druck der Übersicht (R10-A2)", () => {
  it("zeigt die offenen Punkte als Text und blendet „antippen“ aus", async () => {
    const { readFileSync } = await import("node:fs");
    const css = readFileSync(new URL("../../index.html", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    const druck = css.slice(css.indexOf("@media print"));
    expect(druck).toMatch(/\.vollstaendigkeit li button\.link\s*\{[^}]*display:\s*inline !important/);
    expect(druck).toMatch(/\.nur-bildschirm\s*\{[^}]*display:\s*none !important/);
  });
});
