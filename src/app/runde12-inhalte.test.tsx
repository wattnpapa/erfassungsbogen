/**
 * Runde 12, Block Inhalte: R12-W1 bis W4, A1, K1 bis K4 (mit L1), H1 bis H3.
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { KontaktArt, MINUTEN_JE_TAG, jetztZeitpunkt, type Erfassungsbogen } from "@bos/eeb-format/model";
import { MeldeStatus, type MeldeEintrag } from "@bos/meldekopf/einsaetze";
import { Dialogschicht, frageFelder } from "./dialoge";
import { BogenDetails } from "./einsaetze-ui";
import { MeldungsGegenueberstellung } from "./app";
import { AbsenderKontakt, PersonKontakt, mailHref, telefonHref } from "./kontakt-link";
import { neuePerson, neuerBogen, pruefpunkte, type QrSatz } from "./hilfen";
import { personenText, lageblattAlterText, zugAlterText, bedarfText } from "./lagemonitor";
import { passtZuStatusfilter, einheitenSortieren, SORTIERUNGEN } from "./einheiten-liste";
import { aggregiereNachZug, type EinsatzSummen } from "./auswertung";
import { TABELLEN_SPALTEN, tabellenZeilen, zeilenSortieren } from "./einheiten-tabelle";
import { meldungenVergleichen } from "./meldungs-vergleich";
import { staerkeSummeZeile } from "./staerke-summe";
import { einsatzLageblattDokument, einsatzPdfDokument } from "./pdf-dokument";
import { ANONYM_PAPIER_VERMERK, ANONYM_PERSONAL_SATZ, codeGueltigBisText } from "./anonym-hinweis";

afterEach(cleanup);

const QR_URL = "https://erfassungsbogen.app/#TESTPAYLOAD";
const QR: QrSatz = {
  teile: [{ datenUrl: "data:image/png;base64,QRTESTBILD", url: QR_URL, teilNr: 1, anzahl: 1, version: 7 }],
  segmentiert: false,
  zeichen: 123,
  version: 7,
  vollUrl: QR_URL,
  stufen: 1,
  weitergeleitet: false,
};

function texte(node: unknown, acc: string[] = []): string[] {
  if (typeof node === "string") acc.push(node);
  else if (Array.isArray(node)) node.forEach((n) => texte(n, acc));
  else if (node && typeof node === "object") Object.values(node).forEach((v) => texte(v, acc));
  return acc;
}

function eintrag(id: string, bogen: Erfassungsbogen, over: Partial<MeldeEintrag> = {}): MeldeEintrag {
  return { id, einheitSchluessel: id, empfangenAm: Date.now(), quelle: "scan", status: MeldeStatus.ANWESEND, bogen, ...over } as MeldeEintrag;
}

describe("Rückruf antippbar (R12-W1)", () => {
  it("baut tel:-Ziele aus der eingetragenen Nummer, ohne den Rohtext zu übernehmen", () => {
    expect(telefonHref("0170 5551234")).toBe("tel:01705551234");
    expect(telefonHref("+49 (170) 555-1234")).toBe("tel:+491705551234");
    expect(telefonHref("0170 5551234; rm -rf")).toBeNull();
    expect(telefonHref("12")).toBeNull();
    expect(telefonHref("")).toBeNull();
  });
  it("baut mailto:-Ziele nur aus Adressen", () => {
    expect(mailHref("hans@example.org")).toBe("mailto:hans@example.org");
    expect(mailHref("hans@example.org?cc=x@y.de")).toBeNull();
    expect(mailHref("kein Mail")).toBeNull();
  });
  it("die Absenderzeile zeigt Name, Adresse und Nummer; Adresse und Nummer sind Verknüpfungen", () => {
    render(<p><AbsenderKontakt karte={{ name: "Hans Beispiel", email: "hans@example.org", telefon: "0170 5551234" }} /></p>);
    expect(screen.getByRole("link", { name: "hans@example.org" }).getAttribute("href")).toBe("mailto:hans@example.org");
    const tel = screen.getByRole("link", { name: "0170 5551234" });
    expect(tel.getAttribute("href")).toBe("tel:01705551234");
    expect(document.querySelector("p")!.textContent).toBe("Hans Beispiel · hans@example.org · 0170 5551234");
  });
  it("„Details“ führt Absender, Ebenen und Personal mit Verweisen", () => {
    const b = neuerBogen();
    b.einheit.hierarchie = [{ bezeichnung: { freitext: "OV" }, name: "Sinsheim", telefon: "07261 123456", email: "ov@thw.example" }];
    const p = { ...neuePerson(), vorname: "Anna", nachname: "Beck" };
    p.kontakte = [{ art: KontaktArt.MOBIL, dienstlich: true, wert: "01715551234" }];
    b.personal = [p];
    const { container } = render(
      <BogenDetails bogen={b} absender="Hans Beispiel · 0170 5551234" absenderKarte={{ name: "Hans Beispiel", telefon: "0170 5551234" }} />,
    );
    const hrefs = [...container.querySelectorAll("a.kontakt-link")].map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(expect.arrayContaining(["tel:01705551234", "tel:072611234" + "56", "mailto:ov@thw.example", "tel:01715551234"]));
  });
  it("Personenkontakt behält den Text wie kontaktText", () => {
    const { container } = render(<span><PersonKontakt kontakt={{ art: KontaktArt.MOBIL, dienstlich: false, wert: "01715551234" }} /></span>);
    expect(container.textContent).toBe("Mobil: 01715551234 (P)");
  });
  it("Zielgröße 44 px steht im Stylesheet", () => {
    const html = readFileSync("index.html", "utf8");
    const von = html.indexOf("/* ===== Runde 12 (Inhalte) ===== */");
    expect(von).toBeGreaterThan(0);
    expect(html.slice(von)).toMatch(/a\.kontakt-link\s*\{[^}]*min-height:\s*44px/);
  });
});

describe("Selbstversorger ohne Vegetarier-Hinweis (R12-W2)", () => {
  const bogenMitVeg = (verpflegungPersonen: number) => {
    const b = neuerBogen();
    b.sofortbedarf = { verpflegungPersonen, dieselLiter: 100, benzinLiter: 0, gemischLiter: 0, unterbringung: false, ruhezeitErforderlich: false };
    b.personal = [1, 2, 3].map((i) => ({ ...neuePerson(), vorname: `V${i}`, nachname: `Veg${i}`, ernaehrung: 1 }) as never);
    return b;
  };
  it("bei 0 Portionen kein Hinweis, bei 2 Portionen und 3 Vegetariern schon", () => {
    expect(pruefpunkte(bogenMitVeg(0)).some((p) => /mehr Vegetarier/.test(p.text))).toBe(false);
    expect(pruefpunkte(bogenMitVeg(2)).some((p) => /mehr Vegetarier/.test(p.text))).toBe(true);
  });
});

describe("Weitergabe-Vermerk (R12-W3)", () => {
  it("Kopf und Startseite sagen „erzeugt“ und „nicht bestätigt“, nicht „Weitergegeben“", () => {
    const q = readFileSync("src/app/einsaetze-ui.tsx", "utf8");
    expect(q).toContain("Weitergabe-Datei erzeugt");
    expect(q).toContain("Empfang nicht bestätigt");
    expect(q).not.toMatch(/Weitergegeben \$\{/);
    expect(q).not.toMatch(/<strong>Weitergegeben /);
  });
});

describe("Nachmeldung nach Abrücken: Warnung vor dem Vergleich (R12-W4)", () => {
  it("die Wiederanwesenheits-Warnung steht vor „Bisher“", () => {
    const a = neuerBogen();
    const b = structuredClone(a);
    const { container } = render(<p><MeldungsGegenueberstellung vergleich={meldungenVergleichen(a, b)} warAbgerueckt /></p>);
    const text = container.textContent ?? "";
    expect(text).toContain("war abgerückt");
    expect(text.indexOf("war abgerückt")).toBeLessThan(text.indexOf("Bisher:"));
  });
  it("ohne Abrücken keine Warnung", () => {
    const a = neuerBogen();
    const { container } = render(<p><MeldungsGegenueberstellung vergleich={meldungenVergleichen(a, a)} /></p>);
    expect(container.textContent).not.toContain("war abgerückt");
  });
});

describe("Anonymisierte Bögen auf Papier (R12-A1)", () => {
  const alt = () => {
    const b = neuerBogen();
    b.stand = jetztZeitpunkt() - 100 * MINUTEN_JE_TAG;
    b.uebung = false;
    b.sofortbedarf = undefined;
    b.personal = [{ ...neuePerson(), vorname: "", nachname: "Einsatzkraft 1" }];
    b.fahrzeuge = [{ typ: { freitext: "MTW" }, kennzeichen: "TH 1234" }];
    return b;
  };
  const frisch = () => ({ ...alt(), stand: jetztZeitpunkt() });

  it("Hinweise zu Rufnummer und Kraftfahrer entfallen bei Bögen über 90 Tage, bleiben bei frischen", () => {
    const hinweis = (b: Erfassungsbogen) => pruefpunkte(b).map((p) => p.text).join("\n");
    expect(hinweis(alt())).not.toMatch(/telefonische Erreichbarkeit|kein Kraftfahrer/);
    expect(hinweis(frisch())).toMatch(/telefonische Erreichbarkeit/);
  });
  it("Lageblatt und Sammel-PDF nennen „anonymisiert“ und das Papier der Einheit; die Gegenprobe nicht", () => {
    const lageAlt = texte(einsatzLageblattDokument("Lage", [{ bogen: alt() }]).content).join("\n");
    expect(lageAlt).toContain(ANONYM_PAPIER_VERMERK);
    expect(lageAlt).not.toMatch(/keine Rufnummer|kein Kraftfahrer|telefonische Erreichbarkeit/);
    const sammelAlt = texte(einsatzPdfDokument("Lage", [{ bogen: alt(), qr: QR }]).content).join("\n");
    expect(sammelAlt).toContain(ANONYM_PAPIER_VERMERK);
    expect(sammelAlt).toContain(ANONYM_PERSONAL_SATZ);
    expect(sammelAlt).not.toMatch(/Namen im Code gültig bis/);
    const lageFrisch = texte(einsatzLageblattDokument("Lage", [{ bogen: frisch() }]).content).join("\n");
    expect(lageFrisch).not.toMatch(/ANONYMISIERT/);
    const sammelFrisch = texte(einsatzPdfDokument("Lage", [{ bogen: frisch(), qr: QR }]).content).join("\n");
    expect(sammelFrisch).not.toContain(ANONYM_PERSONAL_SATZ);
  });
  it("das Gültigkeitsdatum im Code-Kasten heißt nach Ablauf „abgelaufen“", () => {
    const b = { uebung: false, stand: 1000 };
    const f = (z: number) => `Tag ${z}`;
    expect(codeGueltigBisText(b, f)).toMatch(/gültig bis/);
    expect(codeGueltigBisText(b, f, true)).toMatch(/abgelaufen/);
  });
});

describe("Kontrast der Warnzeilen im dunklen Kopf (R12-K1, R12-L1)", () => {
  const html = readFileSync("index.html", "utf8");
  const luma = (hex: string) => {
    const k = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * k[0]! + 0.7152 * k[1]! + 0.0722 * k[2]!;
  };
  const kontrast = (a: string, b: string) => {
    const [h, d] = [luma(a), luma(b)].sort((x, y) => y - x);
    return (h! + 0.05) / (d! + 0.05);
  };
  it("die Warnzeile im Kopf nimmt die Kopf-Schriftfarbe, nicht die braune Warnfarbe", () => {
    expect(html).toMatch(/\.seiten-kopf \.hinweis \.warnung-text\s*\{\s*color:\s*var\(--kopf-auf\)/);
  });
  it("Kopf-Schriftfarbe gegen Kopfgrund: mindestens 4,5:1 in Standard/Feld/Dunkel (weiß auf #12275e) und Nacht", () => {
    expect(kontrast("#ffffff", "#12275e")).toBeGreaterThanOrEqual(4.5);
    expect(kontrast("#d9cdb6", "#221f16")).toBeGreaterThanOrEqual(4.5);
    // Der Fehler vorher: braune Warnfarbe auf dem Kopf.
    expect(kontrast("#6d4700", "#12275e")).toBeLessThan(4.5);
    // Die Werte stehen so im Stylesheet.
    expect(html).toContain("--kopf-auf:   #d9cdb6;");
    expect(html).toContain("--kopf-auf:    #ffffff;");
  });
});

describe("Älteste Meldung zuerst, nur veraltete (R12-K2)", () => {
  const jetzt = Date.now();
  const min = (n: number) => jetzt - n * 60_000;
  const a = eintrag("a", neuerBogen(), { empfangenAm: min(5) });
  const b = eintrag("b", neuerBogen(), { empfangenAm: min(200) });
  const c = eintrag("c", neuerBogen(), { empfangenAm: min(90) });
  const abgerueckt = eintrag("d", neuerBogen(), { empfangenAm: min(900), status: MeldeStatus.ABGERUECKT });
  it("Sortierung „aelteste“ ordnet Anwesende nach Alter, Abgerückte ans Ende", () => {
    expect(SORTIERUNGEN.map((s) => s.wert)).toContain("aelteste");
    expect(einheitenSortieren([a, abgerueckt, b, c], "aelteste").map((e) => e.id)).toEqual(["b", "c", "a", "d"]);
  });
  it("Filter „veraltet“ zeigt nur anwesende Einheiten ab einer Stunde", () => {
    const treffer = [a, b, c, abgerueckt].filter((e) => passtZuStatusfilter(e, "veraltet", jetzt));
    expect(treffer.map((e) => e.id)).toEqual(["b", "c"]);
  });
});

describe("Alter auf Lageblatt, je Zug und in der Tabelle (R12-K3)", () => {
  const jetzt = Date.now();
  const min = (n: number) => jetzt - n * 60_000;
  it("Altersaussage nur ab einer Stunde, zum Druckzeitpunkt gerechnet", () => {
    expect(lageblattAlterText([min(5), min(10)], jetzt)).toBeNull();
    expect(lageblattAlterText([min(300), min(5), min(70)], jetzt)).toBe("⚠ älteste Meldung vor 5 Std 0 Min, 2 von 3 älter als 1 Std");
    expect(zugAlterText(min(300), jetzt)).toBe("⚠ älteste Meldung vor 5 Std 0 Min");
    expect(zugAlterText(min(30), jetzt)).toBeNull();
  });
  it("Zwischensumme je Zug trägt die älteste Meldung der Gruppe", () => {
    const e1 = eintrag("e1", neuerBogen(), { empfangenAm: min(300), zugEtikett: "1. Zug" });
    const e2 = eintrag("e2", neuerBogen(), { empfangenAm: min(20), zugEtikett: "1. Zug" });
    const e3 = eintrag("e3", neuerBogen(), { empfangenAm: min(10), zugEtikett: "2. Zug" });
    const g = aggregiereNachZug([e1, e2, e3]);
    expect(g.find((x) => x.zugEtikett === "1. Zug")!.aeltesteMeldungAm).toBe(min(300));
    expect(g.find((x) => x.zugEtikett === "2. Zug")!.aeltesteMeldungAm).toBe(min(10));
  });
  it("Kopf des Lageblatts nennt die Altersaussage, wenn die Meldungen alt sind", () => {
    const text = (empfangen: number) =>
      texte(einsatzLageblattDokument("Lage", [{ bogen: neuerBogen(), empfangenAm: empfangen }], jetzt).content).join("\n");
    // Die PDF-Schrift kennt kein ⚠, winAnsiDokument setzt „!" ein.
    expect(text(min(300))).toContain("älteste Meldung vor 5 Std 0 Min, 1 von 1 älter als 1 Std");
    expect(text(min(5))).not.toContain("älteste Meldung");
  });
  it("Tabelle hat die Spalte „Alter“ (R18-N9, früher „Meldung vor“), sortierbar nach dem Eingang (älteste zuerst)", () => {
    const sp = TABELLEN_SPALTEN.find((s) => s.schluessel === "meldung")!;
    expect(sp.kopf).toBe("Alter");
    const zeilen = tabellenZeilen([eintrag("neu", neuerBogen(), { empfangenAm: min(5) }), eintrag("alt", neuerBogen(), { empfangenAm: min(500) })]);
    expect(zeilenSortieren(zeilen, "meldung", "auf").map((z) => z.eintrag.id)).toEqual(["alt", "neu"]);
  });
});

describe("Bedarfszeile mit Leerzeichen und Verpflegung im Monitor (R12-K4, R12-H1)", () => {
  it("personenText trennt Zahl und Wort", () => {
    expect(personenText(27)).toBe("27 Personen");
    expect(personenText(1)).toBe("1 Person");
  });
  it("der Monitor führt Verpflegung und „Personen“ in der Reihenfolge der Kopfzeile", () => {
    const s = {
      verpflegungAngefordert: 53,
      kraftstoff: { dieselLiter: 480, benzinLiter: 0, gemischLiter: 0 },
      unterbringungBenoetigt: 2,
      unterbringungAngefordert: { personen: 27, m: 0, w: 0, d: 0, ohneAngabe: 0 },
      ruhezeitErforderlich: 3,
    } as unknown as EinsatzSummen;
    expect(bedarfText(s)).toBe("Bedarf: Verpflegung 53 · Unterbringung 27 Personen · Diesel 480 l · Ruhezeit 3 Einheiten");
  });
  it("die Kopfzeile der Einsatzansicht klebt Zahl und Wort nicht mehr zusammen", () => {
    const q = readFileSync("src/app/einsaetze-ui.tsx", "utf8");
    expect(q).toContain("Unterbringung ${personenText(sum.unterbringungAngefordert.personen)}");
  });
});

describe("„Stärke ändern…“ zeigt die Gesamtzahl beim Tippen (R12-H2)", () => {
  it("rechnet die Summe aus den drei Feldern", () => {
    expect(staerkeSummeZeile({ fuehrer: "1", unterfuehrer: "1", mannschaft: "9" }, 4)).toBe("Gesamt: 11 (bisher 4)");
    expect(staerkeSummeZeile({ fuehrer: "1", unterfuehrer: "x", mannschaft: "9" }, 4)).toBe("Gesamt: – (bisher 4)");
  });
  it("die Zeile im Dialog aktualisiert sich bei jeder Eingabe", async () => {
    render(<Dialogschicht />);
    void frageFelder({
      titel: "Stärke ändern",
      felder: [
        { name: "fuehrer", label: "Führer", vorgabe: "1", zahl: true },
        { name: "unterfuehrer", label: "Unterführer", vorgabe: "1", zahl: true },
        { name: "mannschaft", label: "Mannschaft", vorgabe: "2", zahl: true },
      ],
      zeile: (w) => staerkeSummeZeile(w, 4),
    });
    const dialog = await screen.findByRole("dialog", { name: "Stärke ändern" });
    expect(within(dialog).getByRole("status").textContent).toBe("Gesamt: 4 (bisher 4)");
    fireEvent.change(within(dialog).getByLabelText("Mannschaft"), { target: { value: "9" } });
    expect(within(dialog).getByRole("status").textContent).toBe("Gesamt: 11 (bisher 4)");
  });
});

describe("Ortsvorschlag „Schwäbisch Hall“ (R12-H3)", () => {
  it("trennt zusammengezogene Wörter nur für die Anzeige", async () => {
    const { ortAnzeige } = await import("./schreibweise");
    expect(ortAnzeige("SchwäbischHall")).toBe("Schwäbisch Hall");
    expect(ortAnzeige("Albstadt")).toBe("Albstadt");
    expect(ortAnzeige("Garmisch-Partenkirchen")).toBe("Garmisch-Partenkirchen");
  });
  it("im ganzen Verzeichnis kommen nur Leerzeichen hinzu, nie Buchstaben; bekannte Fälle stimmen", async () => {
    const { ortAnzeige } = await import("./schreibweise");
    const { THW_ORTSVERBAENDE: THW_OV } = await import("@bos/vokabulare/thw-ov");
    for (const o of new Set(THW_OV.map((v) => v.ort))) {
      expect(ortAnzeige(o).replace(/ /g, "")).toBe(o.replace(/ /g, ""));
    }
    const fall: Record<string, string> = {
      BadNeuenahr: "Bad Neuenahr",
      FrankfurtamMain: "Frankfurt am Main",
      MülheimanderRuhr: "Mülheim an der Ruhr",
      BergenaufRügen: "Bergen auf Rügen",
      WentorfbeiHamburg: "Wentorf bei Hamburg",
      ZimmernobRottweil: "Zimmern ob Rottweil",
      ZehdenickOTOsterne: "Zehdenick OT Osterne",
      "BadHomburg v. d. Höhe": "Bad Homburg v. d. Höhe",
      "BadTeinach-Zavelstein": "Bad Teinach-Zavelstein",
      HeilbadHeiligenstadt: "Heilbad Heiligenstadt",
      SchwäbischGmünd: "Schwäbisch Gmünd",
    };
    for (const [roh, soll] of Object.entries(fall)) expect(ortAnzeige(roh)).toBe(soll);
  });
});
