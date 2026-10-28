/**
 * Runde 16, Block Inhalte: Excel und CSV tragen Einsatz, Erstellzeit und Kennzeichnung der Eintreffzeit (R16-A1),
 * Kurzzeile der Folgemeldung nach Entscheidungsrelevanz (R16-K2), Wortlaut der ausgeblendeten Zeilen (R16-K3),
 * Name und Ort des Einsatzes nachträglich ändern (R16-K1, Logik).
 */
import { beforeEach, describe, expect, it } from "vitest";
import { OrganisationsTyp, PersonalErfassung, SCHEMA_VERSION, type Erfassungsbogen } from "@bos/eeb-format/model";
import {
  EinsatzArt,
  MeldeStatus,
  bogenInhaltsId,
  einheitSchluessel,
  einsaetzeLaden,
  einsatzAnlegen,
  speicherhuelleSetzen,
  type Einsatzsammlung,
  type MeldeEintrag,
} from "@bos/meldekopf/einsaetze";
import { einsatzCsvInhalt } from "./einsatz-csv";
import { einsatzDetailCsvInhalt } from "./bogen-csv";
import { EINTREFF_HINWEIS, einsatzKopfSetzen, eintreffzeitUnbestaetigt } from "./eintrag-zeiten";
import { exportKennzeile } from "./export-stand";
import { ausgeblendetText, folgeAenderung } from "./einheiten-tabelle";

function bogen(name: string, ueber: Partial<Erfassungsbogen> = {}): Erfassungsbogen {
  return {
    schemaVersion: SCHEMA_VERSION,
    stand: 100,
    einheit: { organisation: OrganisationsTyp.THW, einheitsTyp: { code: 1 }, hierarchie: [{ bezeichnung: { code: 1 }, name }] },
    einsatz: { zeitraumVon: 100, zeitraumBis: 130, ortAuftrag: "Lage" },
    personalErfassung: PersonalErfassung.NUR_STAERKE,
    staerkeManuell: { fuehrer: 1, unterfuehrer: 2, mannschaft: 8, gesamt: 11 },
    personal: [],
    fahrzeuge: [],
    sofortbedarf: { verpflegungPersonen: 11, dieselLiter: 50, benzinLiter: 0, gemischLiter: 0, unterbringung: false, ruhezeitErforderlich: true },
    ...ueber,
  };
}

function meldung(b: Erfassungsbogen, ueber: Partial<MeldeEintrag> = {}): MeldeEintrag {
  return {
    id: bogenInhaltsId(b),
    einheitSchluessel: einheitSchluessel(b.einheit),
    empfangenAm: 1000,
    quelle: "scan",
    status: MeldeStatus.ANWESEND,
    bogen: b,
    ...ueber,
  };
}

function sammlung(eintraege: MeldeEintrag[], name = "Hochwasser Test"): Einsatzsammlung {
  return { id: "e1", name, art: EinsatzArt.EINSATZ, angelegt: 0, geaendert: 0, eintraege };
}

function zeilen(csv: string): string[] {
  expect(csv.startsWith("﻿")).toBe(true);
  return csv.slice(1).replace(/\r\n$/, "").split("\r\n");
}

const erstellt = new Date(2026, 9, 26, 17, 16).getTime();
const KENNZEILE = "Einsatz „Hochwasser Test“ · Erstellt 26.10.2026, 17:16";

describe("R16-A1 Kennzeile und Eintreffzeit in der Übersicht-CSV", () => {
  it("nennt Einsatz und Erstellzeit am Dateiende; die Kopfzeile bleibt Zeile 1", () => {
    const csv = einsatzCsvInhalt(sammlung([meldung(bogen("A"))]), undefined, undefined, undefined, erstellt);
    const z = zeilen(csv);
    expect(z[0]!.startsWith("Nr.;Einheit;")).toBe(true);
    expect(z).toContain(KENNZEILE);
  });

  it("kennzeichnet die eingelesene Eintreffzeit mit Stern und hängt die Fußnote an", () => {
    const csv = einsatzCsvInhalt(sammlung([meldung(bogen("A"))]), undefined, undefined, undefined, erstellt);
    const kopf = zeilen(csv)[0]!.split(";");
    const daten = zeilen(csv)[1]!.split(";");
    expect(daten[kopf.indexOf("Eingetroffen")]).toMatch(/ \*$/);
    // „Aufnahme" (früher „Empfangen") ist das Einlesen selbst und bleibt ohne Stern.
    expect(daten[kopf.indexOf("Aufnahme")]).not.toMatch(/\*/);
    expect(zeilen(csv)).toContain(`* ${EINTREFF_HINWEIS}`);
  });

  it("lässt Stern und Fußnote weg, wenn die Einheit von Hand erfasst wurde", () => {
    const csv = einsatzCsvInhalt(sammlung([meldung(bogen("A"), { quelle: "manuell" })]), undefined, undefined, undefined, erstellt);
    expect(csv).not.toContain(" *");
    expect(csv).not.toContain(EINTREFF_HINWEIS);
    expect(zeilen(csv)).toContain(KENNZEILE);
  });

  it("zwei Exporte derselben Lage unterscheiden sich in der Kennzeile (Erstellzeit)", () => {
    const s = sammlung([meldung(bogen("A"))]);
    const a = einsatzCsvInhalt(s, undefined, undefined, undefined, erstellt);
    const b = einsatzCsvInhalt(s, undefined, undefined, undefined, erstellt + 60_000);
    expect(zeilen(a)).toContain(KENNZEILE);
    expect(zeilen(b)).toContain("Einsatz „Hochwasser Test“ · Erstellt 26.10.2026, 17:17");
  });

  it("rechnet die Kennzeichnung beim Teilexport aus der ganzen Sammlung", () => {
    const erste = meldung(bogen("A"), { id: "alt", empfangenAm: 1000 });
    const folge = meldung(bogen("A", { stand: 200 }), { id: "neu", empfangenAm: 5000, eingetroffenAm: 1000 });
    const teil = sammlung([folge]);
    expect(eintreffzeitUnbestaetigt(folge, [folge])).toBe(false);
    expect(eintreffzeitUnbestaetigt(folge, [folge, erste])).toBe(true);
    expect(einsatzCsvInhalt(teil, undefined, undefined, [folge, erste], erstellt)).toContain(EINTREFF_HINWEIS);
    expect(einsatzCsvInhalt(teil, undefined, undefined, [folge], erstellt)).not.toContain(EINTREFF_HINWEIS);
  });
});

describe("R16-A1 Kennzeile und Eintreffzeit in der Alle-Daten-CSV", () => {
  it("hängt Kennzeile und Fußnote als Hinweiszeilen an und kennzeichnet die Eintreffzeit der Einheit", () => {
    const csv = einsatzDetailCsvInhalt(sammlung([meldung(bogen("A"))]), undefined, undefined, erstellt);
    const z = zeilen(csv);
    const kopf = z[0]!.split(";");
    expect(z[1]!.split(";")[kopf.indexOf("Eingetroffen")]).toMatch(/ \*$/);
    const letzte = z.slice(-2);
    expect(letzte[0]!.startsWith(KENNZEILE)).toBe(true);
    expect(letzte[1]!.startsWith(`* ${EINTREFF_HINWEIS}`)).toBe(true);
    // Jede Hinweiszeile hat so viele Felder wie die Kopfzeile und steht unter „Satzart“ als Hinweis.
    expect(letzte[0]!.split(";").length).toBe(kopf.length);
    expect(letzte[0]!.split(";")[kopf.indexOf("Satzart")]).toBe("Hinweis");
  });

  it("exportKennzeile nennt Name und Zeit, wie der Kopf von Lageblatt und Sammel-PDF", () => {
    expect(exportKennzeile({ name: "Hochwasser Test" }, erstellt)).toBe(KENNZEILE);
  });
});

describe("R16-K2 Kurzzeile der Folgemeldung", () => {
  const vorher = meldung(bogen("Biberach"), { id: "v", empfangenAm: 1000 });
  const nachher = (ueber: Partial<Erfassungsbogen>) => meldung(bogen("Biberach", { stand: 200, ...ueber }), { id: "n", empfangenAm: 2000 });

  it("nennt den Wegfall der Ruhezeit, ohne die rechnerisch folgende Verpflegung zu wiederholen", () => {
    const n = nachher({
      staerkeManuell: { fuehrer: 1, unterfuehrer: 1, mannschaft: 6, gesamt: 8 },
      sofortbedarf: { verpflegungPersonen: 8, dieselLiter: 20, benzinLiter: 0, gemischLiter: 0, unterbringung: false, ruhezeitErforderlich: false },
    });
    const folge = folgeAenderung(n, [vorher, n])!;
    expect(folge.kurz).toBe("Stärke 11 → 8 (−3) · Ruhezeit ja → nein · Diesel 50 l → 20 l");
    expect(folge.kurz).not.toContain("Verpflegung");
    expect(folge.kurz).not.toContain("weitere");
  });

  it("nennt eine Verpflegung, die von der Stärke abweicht", () => {
    const n = nachher({ sofortbedarf: { verpflegungPersonen: 20, dieselLiter: 50, benzinLiter: 0, gemischLiter: 0, unterbringung: false, ruhezeitErforderlich: true } });
    expect(folgeAenderung(n, [vorher, n])!.kurz).toBe("Verpflegung 11 Personen → 20 Personen");
  });

  it("stellt Unterbringung vor den Betriebsstoff", () => {
    const n = nachher({ sofortbedarf: { verpflegungPersonen: 11, dieselLiter: 10, benzinLiter: 0, gemischLiter: 0, unterbringung: true, ruhezeitErforderlich: true } });
    const kurz = folgeAenderung(n, [vorher, n])!.kurz;
    expect(kurz.indexOf("Unterbringung nein → ja")).toBeGreaterThan(-1);
    expect(kurz.indexOf("Unterbringung")).toBeLessThan(kurz.indexOf("Diesel"));
  });
});

describe("R16-K3 ausgeblendete Zeilen", () => {
  it("zählt Neumeldungen und Folgemeldungen getrennt und sagt, was ausgeblendet ist", () => {
    expect(ausgeblendetText(6, 0)).toBe("6 Einheiten neu gemeldet — Zeilen je Einheit ausgeblendet, siehe Liste");
    expect(ausgeblendetText(1, 1)).toBe("1 Einheit neu gemeldet, 1 Folgemeldung — Zeilen je Einheit ausgeblendet, siehe Liste");
    expect(ausgeblendetText(0, 2)).toBe("2 Folgemeldungen — Zeilen je Einheit ausgeblendet, siehe Liste");
    expect(ausgeblendetText(6, 0)).not.toContain("Einzelsatz");
  });
});

describe("R16-K1 Name und Ort einer Sammlung ändern", () => {
  beforeEach(() => {
    const speicher = new Map<string, string>();
    speicherhuelleSetzen({
      get length() {
        return speicher.size;
      },
      clear: () => speicher.clear(),
      getItem: (k: string) => speicher.get(k) ?? null,
      setItem: (k: string, v: string) => void speicher.set(k, String(v)),
      removeItem: (k: string) => void speicher.delete(k),
      key: (i: number) => [...speicher.keys()][i] ?? null,
    } as Storage);
  });

  it("ändert Name und Ort, lässt Einheiten stehen und liefert die Werte davor", () => {
    const s = einsatzAnlegen("Hochwasser Weser", EinsatzArt.EINSATZ);
    const vorher = einsatzKopfSetzen(s.id, "  Hochwasser Neckar ", " Sporthalle Rottenburg ");
    expect(vorher).toEqual({ name: "Hochwasser Weser", ort: "" });
    const danach = einsaetzeLaden().find((x) => x.id === s.id)!;
    expect(danach.name).toBe("Hochwasser Neckar");
    expect(danach.ort).toBe("Sporthalle Rottenburg");
    expect(danach.angelegt).toBe(s.angelegt);
  });

  it("lässt bei leerem Namen den alten stehen und löscht einen geleerten Ort", () => {
    const s = einsatzAnlegen("Hochwasser Weser", EinsatzArt.EINSATZ, "Deich Nord");
    einsatzKopfSetzen(s.id, "  ", "");
    const danach = einsaetzeLaden().find((x) => x.id === s.id)!;
    expect(danach.name).toBe("Hochwasser Weser");
    expect(danach.ort).toBeUndefined();
  });

  it("macht die Änderung mit den vorherigen Werten rückgängig", () => {
    const s = einsatzAnlegen("Hochwasser Weser", EinsatzArt.EINSATZ, "Deich Nord");
    const vorher = einsatzKopfSetzen(s.id, "Hochwasser Neckar", "")!;
    einsatzKopfSetzen(s.id, vorher.name, vorher.ort);
    const danach = einsaetzeLaden().find((x) => x.id === s.id)!;
    expect(danach.name).toBe("Hochwasser Weser");
    expect(danach.ort).toBe("Deich Nord");
  });

  it("liefert null für einen unbekannten Einsatz", () => {
    expect(einsatzKopfSetzen("gibt-es-nicht", "X", "Y")).toBeNull();
  });
});
