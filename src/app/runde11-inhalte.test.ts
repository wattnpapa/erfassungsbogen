/**
 * Runde 11, Block B (Inhalte): W1, W2, W4, H1 bis H4, K1, K2, K4, A1 bis A4.
 */
import { describe, it, expect } from "vitest";
import { StaerkeRolle } from "@bos/eeb-format/model";
import { MINUTEN_JE_TAG } from "@bos/eeb-format/model";
import { readFileSync } from "node:fs";
import { falte, passtZurSuche } from "./schreibweise";
import { parseNamen } from "./personal-schnell";
import { verpflegungText, summiereBoegen, verpflegungAngefordertLage } from "./auswertung";
import { neuerBogen } from "./hilfen";
import { anwesendenAlter, anwesendenAlterText } from "./lagemonitor";
import { passtZuStatusfilter } from "./einheiten-liste";
import { MeldeStatus } from "@bos/meldekopf/einsaetze";
import { anonymQuittung, codeGueltigBisText } from "./anonym-hinweis";
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

describe("Verpflegung angefordert (R11-W1)", () => {
  it("ohne Sofortbedarf: nicht angefordert, Stärke benannt", () => {
    const b = neuerBogen();
    b.sofortbedarf = undefined;
    b.staerkeManuell = { fuehrer: 0, unterfuehrer: 0, mannschaft: 9, gesamt: 9 };
    expect(verpflegungAngefordertLage(b)).toBe(0);
    expect(verpflegungText(summiereBoegen([b]))).toBe("Verpflegung: kein Bedarf gemeldet (9 Personen vor Ort)");
  });
  it("angefordert = Stärke: eine Zahl", () => {
    const b = neuerBogen();
    b.staerkeManuell = { fuehrer: 0, unterfuehrer: 0, mannschaft: 9, gesamt: 9 };
    b.sofortbedarf = { verpflegungPersonen: 9, dieselLiter: 0, benzinLiter: 0, gemischLiter: 0, unterbringung: false, ruhezeitErforderlich: false };
    expect(verpflegungText(summiereBoegen([b]))).toBe("Verpflegung 9");
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

describe("Alter der Anwesenden (R11-K1)", () => {
  const jetzt = 10_000_000_000;
  it("warnt, obwohl die jüngste Meldung frisch ist", () => {
    const a = anwesendenAlter(
      [{ empfangenAm: jetzt - 5 * 3_600_000 }, { empfangenAm: jetzt - 4 * 3_600_000 }, { empfangenAm: jetzt - 60_000 }],
      jetzt,
    );
    expect(anwesendenAlterText(a, jetzt)).toBe("älteste Meldung vor 5 Std 0 Min, 2 von 3 älter als 1 Std");
  });
  it("schweigt bei frischer Lage", () => {
    expect(anwesendenAlterText(anwesendenAlter([{ empfangenAm: jetzt - 60_000 }], jetzt), jetzt)).toBeNull();
    expect(anwesendenAlter([], jetzt)).toBeNull();
  });
});

describe("Statusfilter (R11-K2)", () => {
  it("trennt Anwesende und Abgerückte", () => {
    const an = { status: MeldeStatus.ANWESEND } as never;
    const ab = { status: MeldeStatus.ABGERUECKT } as never;
    expect(passtZuStatusfilter(an, "anwesend")).toBe(true);
    expect(passtZuStatusfilter(ab, "anwesend")).toBe(false);
    expect(passtZuStatusfilter(ab, "abgerueckt")).toBe(true);
  });
});

describe("Anonymisierte Bögen (R11-A1)", () => {
  it("Quittung nennt den Bogen mit Alter; frischer Bogen nicht", () => {
    const alt = neuerBogen();
    alt.uebung = false;
    alt.stand = 1_000_000;
    const jetzt = alt.stand + 95 * MINUTEN_JE_TAG;
    const frisch = { ...neuerBogen(), uebung: false, stand: jetzt - 30 * MINUTEN_JE_TAG };
    const s = anonymQuittung([{ bogen: alt }, { bogen: frisch }], jetzt);
    expect(s).toMatch(/^1 Bogen ohne Namen und Erreichbarkeiten: Datenschutzfrist/);
    expect(s).toContain("Stand vor 95 Tagen");
    expect(anonymQuittung([{ bogen: frisch }], jetzt)).toBe("");
  });
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
