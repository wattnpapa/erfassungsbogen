/**
 * Runde 11, Block B (Inhalte): W1, W2, W4, H1 bis H4, K1, K2, K4, A1 bis A4.
 */
import { describe, it, expect } from "vitest";
import { StaerkeRolle } from "@bos/eeb-format/model";
import { MINUTEN_JE_TAG } from "@bos/eeb-format/model";
import { readFileSync } from "node:fs";
import { falte, passtZurSuche } from "./schreibweise";
import { parseNamen } from "./personal-schnell";
import { neuerBogen } from "./hilfen";
import { codeGueltigBisText } from "./anonym-hinweis";
import { leseausgabeMeldung, pdfTitel } from "./pdf-titel";
import { erreichbarkeitZeilen } from "./pdf-dokument";
import { BLANKO_ZEILEN } from "./blanko";

describe("Schreibweisen (R11-H1 bis H3)", () => {
  it("faltet ß/ss, Umlaute und ue", () => {
    expect(falte("Haßmersheim")).toBe(falte("Hassmersheim"));
    expect(falte("Müllheim")).toBe(falte("Muellheim"));
    expect(falte("Riß")).toBe(falte("Riss"));
  });
  it("sucht wortweise über Kürzel und Name", () => {
    expect(passtZurSuche("FGr WP – Fachgruppe Wasserschaden/Pumpen (A)", "FGr Wasserschaden/Pumpen")).toBe(true);
    expect(passtZurSuche("GrFü – Gruppenführer/in", "Gruppenfuehrer")).toBe(true);
    expect(passtZurSuche("GrFü – Gruppenführer/in", "GrFu")).toBe(true);
    expect(passtZurSuche("GrFü – Gruppenführer/in", "Zugtrupp")).toBe(false);
    expect(passtZurSuche("irgendwas", "  ")).toBe(false);
  });
});

describe("Namen einfügen (R11-H4)", () => {
  it("Namenszusätze gehören zum Nachnamen", () => {
    const e = parseNamen("Hans van Dijk\nPeter von der Heide\nMaria de la Cruz");
    expect(e.map((x) => x.nachname)).toEqual(["van Dijk", "von der Heide", "de la Cruz"]);
  });
  it("Tabulator trennt Name und Funktion", () => {
    const [e] = parseNamen("Hans Müller\tGrFü");
    expect(e).toMatchObject({ vorname: "Hans", nachname: "Müller", funktion: "GrFü", rolle: StaerkeRolle.UNTERFUEHRER });
  });
});

describe("Lageblatt-Erreichbarkeit (R11-W2, R11-W4)", () => {
  it("nennt den Absender", () => {
    expect(erreichbarkeitZeilen(neuerBogen(), "Hans Beispiel · 0170 5551234")).toContain("Absender: Hans Beispiel · 0170 5551234");
  });
  it("Funkrufname einer unberührten Fahrzeugzeile ist Vorbelegung", () => {
    const b = neuerBogen();
    b.fahrzeuge = [{ typ: { freitext: "GKW" }, funkrufname: { kennwort: { code: 1 }, eigenerStandort: true, teile: [22, 51] } }];
    const z = erreichbarkeitZeilen(b);
    expect(z[0]).toMatch(/\(Vorbelegung\)$/);
    b.fahrzeuge[0]!.kennzeichen = "THW-12345";
    expect(erreichbarkeitZeilen(b)[0]).not.toMatch(/Vorbelegung/);
  });
});

describe("Anonymisierte Bögen (R11-A1)", () => {
  it("Gültigkeitsvermerk für den Ausdruck", () => {
    const b = { uebung: false, stand: 0 };
    expect(codeGueltigBisText(b, (z) => `T${z}`)).toBe(`Namen im Code gültig bis T${90 * MINUTEN_JE_TAG}`);
    expect(codeGueltigBisText({ uebung: true, stand: 0 }, String)).toBe("");
  });
});

describe("Lageblatt-PDF erkennen (R11-A3)", () => {
  const pdf = (titel: string) => new TextEncoder().encode(`%PDF-1.3\n1 0 obj\n<< /Title 2 0 R >>\nendobj\n2 0 obj\n(${titel})\nendobj\n`);
  it("liest den Titel und erklärt Lageblatt und Blanko", () => {
    expect(pdfTitel(pdf("Lageblatt Hochwasser"))).toBe("Lageblatt Hochwasser");
    expect(leseausgabeMeldung(pdf("Lageblatt Hochwasser"), "l.pdf")).toMatch(/Lageblatt.*Sammel-PDF/);
    expect(leseausgabeMeldung(pdf("Einheiten-Erfassungsbogen — Blanko-Vordruck"), "b.pdf")).toMatch(/Blanko-Vordruck/);
    expect(leseausgabeMeldung(pdf("Einsatz-Sammlung X"), "s.pdf")).toBeNull();
  });
  it("liest UTF-16-Hex-Titel", () => {
    const hex = "feff" + [..."Lageblatt X"].map((c) => c.charCodeAt(0).toString(16).padStart(4, "0")).join("");
    const b = new TextEncoder().encode(`1 0 obj\n<< /Title 2 0 R >>\nendobj\n2 0 obj\n<${hex}>\nendobj\n`);
    expect(pdfTitel(b)).toBe("Lageblatt X");
  });
});

describe("Vorlagenseite (R11-A4)", () => {
  it("nennt die Personenzahl des Vordrucks", () => {
    const html = readFileSync("public/vorlage.html", "utf8");
    expect(html).toContain(`${BLANKO_ZEILEN.personal} Helferinnen und Helfer`);
    expect(html).not.toMatch(/rund 11 kB/);
  });
});
