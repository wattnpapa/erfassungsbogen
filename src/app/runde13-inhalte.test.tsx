/**
 * Runde 13, Block Inhalte: Verhalten der Behebungen aus arbeitsablauf (W1 bis W6), fuehrungssicht (K1, K2),
 * analog-first (A1 bis A5) und feldtauglichkeit (H1 bis H3) — reine Logik, PDF-Text und Speicher.
 */
import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { MINUTEN_JE_TAG, jetztZeitpunkt, type Erfassungsbogen } from "@bos/eeb-format/model";
import {
  EinsatzArt,
  MeldeStatus,
  einsaetzeLaden,
  einsatzAnlegen,
  meldungAufteilen,
  meldungHinzufuegen,
  type MeldeEintrag,
} from "@bos/meldekopf/einsaetze";
import { neuePerson, neuerBogen } from "./hilfen";
import { bedarfText, kraftstoffTeile, lageblattZeilenAlter, staerkeSummenText } from "./lagemonitor";
import type { EinsatzSummen } from "./auswertung";
import { verpflegungBogenText } from "./auswertung";
import { einsatzLageblattDokument } from "./pdf-dokument";
import { ANONYM_BEMERKUNG_VERMERK, ANONYM_ERKLAERUNG, anonymQuittung } from "./anonym-hinweis";
import { abgeteiltDoppelt, abgeteiltDoppeltText, doppeltHerausnehmbar, ohneAbgeteilte } from "./abgeteilt-doppelt";
import { neuZurKenntnis, weitergabeStandLaden, weitergabeUmImportErgaenzen, weitergabeVermerken, type ExportStand } from "./export-stand";
import { einheitenAufteilung } from "./einheiten-tabelle";
import { abrueckzeitVomZettel } from "./nacherfassung";
import { zettelPruefen } from "./entwurf";
import { importUebernahm } from "./einsatz-abgleich";
import { standLiegtNachEintreffen, standNachEintreffenQuittung } from "./stand-uhr";
import { falte, suchAlternativen, sucheForm, vokabRang } from "./schreibweise";
import { zeitpunktZuMs } from "./eintrag-zeiten";

afterEach(() => localStorage.clear());

function texte(node: unknown, acc: string[] = []): string[] {
  if (typeof node === "string") acc.push(node);
  else if (Array.isArray(node)) node.forEach((n) => texte(n, acc));
  else if (node && typeof node === "object") Object.values(node).forEach((v) => texte(v, acc));
  return acc;
}

function eintrag(id: string, bogen: Erfassungsbogen, over: Partial<MeldeEintrag> = {}): MeldeEintrag {
  return { id, einheitSchluessel: id, empfangenAm: Date.now(), quelle: "scan", status: MeldeStatus.ANWESEND, bogen, ...over } as MeldeEintrag;
}

function bogenMitPersonen(namen: string[]): Erfassungsbogen {
  const b = neuerBogen();
  b.einheit.hierarchie[0]!.name = "Sinsheim";
  b.personal = namen.map((n) => ({ ...neuePerson(), vorname: n, nachname: `Nach${n}` }));
  return b;
}

describe("R13-K1 Bedarfszeile nennt alle Kraftstoffe", () => {
  it("kraftstoffTeile nennt Diesel, Benzin und Gemisch mit Menge, in der Schreibweise des Lageblatts", () => {
    expect(kraftstoffTeile({ dieselLiter: 580, benzinLiter: 160, gemischLiter: 10 })).toEqual(["Diesel 580 l", "Benzin 160 l", "Gemisch 10 l"]);
    expect(kraftstoffTeile({ dieselLiter: 0, benzinLiter: 160, gemischLiter: 0 })).toEqual(["Benzin 160 l"]);
    expect(kraftstoffTeile({ dieselLiter: 0, benzinLiter: 0, gemischLiter: 0 })).toEqual([]);
  });
  it("die Monitor-Zeile „Bedarf“ führt alle drei Sorten", () => {
    const s = {
      verpflegungAngefordert: 65,
      kraftstoff: { dieselLiter: 580, benzinLiter: 160, gemischLiter: 10 },
      unterbringungBenoetigt: 2,
      unterbringungAngefordert: { personen: 23, m: 0, w: 0, d: 0, ohneAngabe: 0 },
      ruhezeitErforderlich: 4,
    } as unknown as EinsatzSummen;
    expect(bedarfText(s)).toBe("Bedarf: Verpflegung 65 · Unterbringung 23 Personen · Diesel 580 l · Benzin 160 l · Gemisch 10 l · Ruhezeit 4 Einheiten");
  });
  it("die zugeklappte Kurzzeile der Einsatzansicht nutzt dieselbe Funktion", () => {
    const q = readFileSync("src/app/einsaetze-ui.tsx", "utf8");
    expect(q).toContain("kraftstoffTeile(sum.kraftstoff)");
    expect(q).not.toContain("` · Diesel ${sum.kraftstoff.dieselLiter} l`");
  });
});

describe("R13-K2 Lageblatt kennzeichnet die Zeilen mit alter Meldung", () => {
  it("Zeilenmarke nur ab einer Stunde, zum Druckzeitpunkt gerechnet", () => {
    const jetzt = Date.now();
    expect(lageblattZeilenAlter(jetzt - 5 * 60_000, jetzt)).toBeNull();
    expect(lageblattZeilenAlter(undefined, jetzt)).toBeNull();
    expect(lageblattZeilenAlter(jetzt - 401 * 60_000, jetzt)).toBe("⚠ Stand vor 6 Std 41 Min");
  });
  it("im Lageblatt tragen genau die alten Einheiten die Marke", () => {
    const erstellt = Date.now();
    const alt = bogenMitPersonen(["A"]);
    alt.einheit.hierarchie[0]!.name = "Altstadt";
    const neu = bogenMitPersonen(["B"]);
    neu.einheit.hierarchie[0]!.name = "Neuhausen";
    const zeilen = [
      { bogen: alt, empfangenAm: erstellt - 5 * 3_600_000, nummer: 1 },
      { bogen: neu, empfangenAm: erstellt - 10 * 60_000, nummer: 2 },
      { bogen: bogenMitPersonen(["C"]), empfangenAm: erstellt - 9 * 3_600_000, nummer: 3, abgerueckt: true },
    ];
    const t = texte(einsatzLageblattDokument("Lage", zeilen, erstellt).content);
    // Die PDF-Schrift kennt kein ⚠, winAnsiDokument setzt „!“ ein.
    expect(t.filter((x) => x === "! Stand vor 5 Std 0 Min")).toHaveLength(1);
    // Abgerückte tragen keine Marke: sie tragen die Lage nicht mehr.
    expect(t.some((x) => x.startsWith("! Stand vor 9 Std"))).toBe(false);
    // Sechs Zeilen darüber trägt der Kopf die Zahl, die diese Marke auflöst.
    expect(t.some((x) => /1 von 2 älter als 1 Std/.test(x))).toBe(true);
  });
});

describe("R13-A5 Summenzeile des Lageblatts bricht nicht um", () => {
  it("dreistellige Werte stehen ohne Leerzeichen um die Schrägstriche, kleine wie bisher", () => {
    expect(staerkeSummenText(5, 69, 195, 269)).toBe("5/69/195/269");
    expect(staerkeSummenText(1, 1, 2, 4)).toBe("1 / 1 / 2 / 4");
    expect(staerkeSummenText(0, 3, 9, 12)).toBe("0 / 3 / 9 / 12");
  });
  it("das Lageblatt druckt die große Summe in einem Stück", () => {
    const b = bogenMitPersonen([]);
    b.staerkeManuell = { fuehrer: 5, unterfuehrer: 69, mannschaft: 195, gesamt: 269 };
    const t = texte(einsatzLageblattDokument("Lage", [{ bogen: b, nummer: 1 }]).content);
    expect(t).toContain("5/69/195/269");
  });
});

describe("R13-A2 anonymisierte Bögen nennen den Verlust der Bemerkung", () => {
  const alt = () => {
    const b = bogenMitPersonen(["A"]);
    b.stand = jetztZeitpunkt() - 100 * MINUTEN_JE_TAG;
    b.uebung = false;
    b.sonstiges = undefined;
    return b;
  };
  it("Lageblatt nennt es in der Notizzelle, die Gegenprobe mit frischem Bogen nicht", () => {
    const lageAlt = texte(einsatzLageblattDokument("Lage", [{ bogen: alt() }]).content).join("\n");
    expect(lageAlt).toContain(ANONYM_BEMERKUNG_VERMERK);
    const frisch = { ...alt(), stand: jetztZeitpunkt(), sonstiges: "Anhänger nicht mit ausgerückt." };
    const lageFrisch = texte(einsatzLageblattDokument("Lage", [{ bogen: frisch }]).content).join("\n");
    expect(lageFrisch).not.toContain(ANONYM_BEMERKUNG_VERMERK);
    expect(lageFrisch).toContain("Anhänger nicht mit ausgerückt.");
  });
  it("Erklärung der Marke und Quittung nennen die Bemerkung der Einheit", () => {
    expect(ANONYM_ERKLAERUNG).toContain("Bemerkung der Einheit");
    const b = alt();
    const jetzt = b.stand + 100 * MINUTEN_JE_TAG;
    expect(anonymQuittung([{ bogen: b }], jetzt)).toMatch(/Bemerkung der Einheit fehlt/);
  });
});

describe("R13-A3 Stand nach dem Eintreffen (falsche Geräteuhr)", () => {
  it("der Stand drei Stunden nach dem Eingang fällt auf, der kurz davor nicht", () => {
    const b = bogenMitPersonen(["A"]);
    b.stand = jetztZeitpunkt();
    const standMs = zeitpunktZuMs(b.stand);
    expect(standLiegtNachEintreffen({ bogen: b, empfangenAm: standMs - 3 * 3_600_000, quelle: "scan" })).toBe(true);
    expect(standLiegtNachEintreffen({ bogen: b, empfangenAm: standMs - 2 * 60_000, quelle: "scan" })).toBe(false);
    expect(standLiegtNachEintreffen({ bogen: b, empfangenAm: standMs + 3_600_000, quelle: "scan" })).toBe(false);
    // Von Hand erfasst: Stand und Eingang sind dieselbe Uhr.
    expect(standLiegtNachEintreffen({ bogen: b, empfangenAm: standMs - 3 * 3_600_000, quelle: "manuell" })).toBe(false);
  });
  it("die Quittung zählt die betroffenen Meldungen; ohne Abweichung bleibt sie leer", () => {
    const b = bogenMitPersonen(["A"]);
    b.stand = jetztZeitpunkt();
    const standMs = zeitpunktZuMs(b.stand);
    const falsch = { bogen: b, empfangenAm: standMs - 3 * 3_600_000, quelle: "scan" as const };
    const richtig = { bogen: b, empfangenAm: standMs, quelle: "scan" as const };
    expect(standNachEintreffenQuittung([richtig])).toBe("");
    expect(standNachEintreffenQuittung([falsch, falsch, richtig])).toMatch(/^⚠ 2 Meldungen: Stand liegt nach dem Eintreffen/);
    expect(standNachEintreffenQuittung([falsch])).toMatch(/^⚠ 1 Meldung: /);
  });
});

describe("R13-A4 Einspielen einer älteren Datei übernimmt nichts und sagt es nicht anders", () => {
  it("importUebernahm: nur neue Meldungen, Aktualisierungen oder ein neuer Einsatz zählen", () => {
    expect(importUebernahm({ neuerEinsatz: false, hinzugefuegt: 0, aktualisiert: [] })).toBe(false);
    expect(importUebernahm({ neuerEinsatz: false, hinzugefuegt: 1, aktualisiert: [] })).toBe(true);
    expect(importUebernahm({ neuerEinsatz: false, hinzugefuegt: 0, aktualisiert: [{}] as never })).toBe(true);
    expect(importUebernahm({ neuerEinsatz: true, hinzugefuegt: 0, aktualisiert: [] })).toBe(true);
  });
  it("der Weitergabe-Stand trägt „übernommen“ nur, wenn die Datei etwas brachte", () => {
    const s = einsatzAnlegen("Lage", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenMitPersonen(["A"]));
    weitergabeVermerken(einsaetzeLaden()[0]!);
    weitergabeUmImportErgaenzen(s.id, [], [], {}, Date.now(), false);
    expect(weitergabeStandLaden(s.id)!.uebernommenAm).toBeUndefined();
    weitergabeUmImportErgaenzen(s.id, [], [], {}, 12345, true);
    expect(weitergabeStandLaden(s.id)!.uebernommenAm).toBe(12345);
  });
  it("die Kopfzeile sagt „Neuere Angaben … übernommen“, nicht mehr „Stand des anderen Geräts übernommen“", () => {
    const q = readFileSync("src/app/einsaetze-ui.tsx", "utf8");
    expect(q).toContain("Neuere Angaben aus der Datei des anderen Geräts übernommen");
    expect(q).not.toContain("Stand des anderen Geräts übernommen");
  });
});

describe("R13-A1 „Abgerückt um“ vom Meldeblock", () => {
  const jetzt = new Date(2026, 9, 26, 10, 0).getTime();
  const an = new Date(2026, 9, 26, 5, 10).getTime();
  it("leer heißt: noch da", () => {
    expect(abrueckzeitVomZettel("", an, jetzt)).toEqual({ art: "keine" });
  });
  it("eine Zeit nach dem Eintreffen gilt", () => {
    expect(abrueckzeitVomZettel("06:00", an, jetzt)).toEqual({ art: "zeit", zeit: new Date(2026, 9, 26, 6, 0).getTime() });
  });
  it("vor dem Eintreffen, in der Zukunft, ohne Eintreffzeit oder unlesbar: Fehler mit Grund statt falscher Zeit", () => {
    expect(abrueckzeitVomZettel("04:00", an, jetzt)).toMatchObject({ art: "fehler", text: expect.stringContaining("vor „Eingetroffen um“") });
    expect(abrueckzeitVomZettel("23:30", an, jetzt)).toMatchObject({ art: "fehler", text: expect.stringContaining("Zukunft") });
    expect(abrueckzeitVomZettel("06:00", null, jetzt)).toMatchObject({ art: "fehler", text: expect.stringContaining("braucht „Eingetroffen um“") });
    expect(abrueckzeitVomZettel("abc", an, jetzt)).toMatchObject({ art: "fehler" });
  });
  it("der Entwurf trägt „ab“ mit durch das Neuladen", () => {
    expect(zettelPruefen({ zeit: "05:10", ab: "06:00" })).toEqual({ zeit: "05:10", ab: "06:00" });
    expect(zettelPruefen({ ab: "6 Uhr" })).toBeUndefined();
  });
});

describe("R13-W1 Folgemeldung nach „Aufteilen“ zählt abgeteilte Personen nicht doppelt", () => {
  function aufgeteilt() {
    const s = einsatzAnlegen("Hochwasser Weser", EinsatzArt.EINSATZ);
    const ganz = bogenMitPersonen(["Anna", "Bert", "Clara", "Dirk", "Eva", "Finn", "Gerd", "Hans", "Ina", "Jan", "Kai"]);
    ganz.fahrzeuge = [
      { typ: { freitext: "MTW" }, kennzeichen: "THW 1111" },
      { typ: { freitext: "GKW" }, kennzeichen: "THW 2222" },
    ];
    ganz.sofortbedarf = { verpflegungPersonen: 11, dieselLiter: 0, benzinLiter: 0, gemischLiter: 0, unterbringung: false, ruhezeitErforderlich: false };
    const r = meldungHinzufuegen(s.id, ganz)!;
    // Scherer und Heinrich (hier: Jan und Kai) bilden den Trupp Fähre.
    meldungAufteilen(s.id, r.eintrag.id, { teilEtikett: "Trupp Fähre", personal: [9, 10], fahrzeuge: [1] });
    return { s: einsaetzeLaden().find((x) => x.id === s.id)!, schl: r.eintrag.einheitSchluessel, ganz };
  }

  it("erkennt den abgeteilten Trupp und die Namen, die auch in der neuen Meldung stehen", () => {
    const { s, schl, ganz } = aufgeteilt();
    const folge = structuredClone(ganz);
    folge.personal = folge.personal.slice(0, 10); // 10 Personen, enthält Jan, nicht Kai
    const d = abgeteiltDoppelt(s.eintraege, schl, folge);
    expect(d).not.toBeNull();
    expect(d!.teile).toHaveLength(1);
    expect(d!.teile[0]).toMatchObject({ etikett: "Trupp Fähre", personen: 2 });
    expect(d!.personen).toEqual(["NachJan, Jan"]);
    expect(d!.fahrzeuge).toEqual(["THW 2222"]);
    expect(abgeteiltDoppeltText(d!)).toMatch(/^Trupp Fähre \(2 Personen\) ist abgeteilt; NachJan, Jan; Fahrzeug THW 2222 stehen auch in der neuen Meldung\.$/);
  });

  it("die Folgemeldung mit denselben Personen: ohne die abgeteilten bleibt die Summe der Lage bei 10", () => {
    const { s, schl, ganz } = aufgeteilt();
    const folge = structuredClone(ganz);
    folge.personal = folge.personal.slice(0, 10).concat(ganz.personal.slice(10)); // alle 11 wie gemeldet, Jan und Kai dabei
    folge.personal = folge.personal.filter((p) => p.vorname !== "Hans"); // die Einheit meldet 10 (Hans ging nach Hause)
    const d = abgeteiltDoppelt(s.eintraege, schl, folge)!;
    expect(d.personen.sort()).toEqual(["NachJan, Jan", "NachKai, Kai"]);
    const bereinigt = ohneAbgeteilte(folge, d);
    const rest = bereinigt.personal.length;
    const teil = s.eintraege.find((e) => e.teilEtikett === "Trupp Fähre")!.bogen.personal.length;
    expect(rest).toBe(8);
    // Rest plus Trupp ergeben die zehn der Einheit, nicht zwölf.
    expect(rest + teil).toBe(10);
    expect(folge.personal.length + teil).toBe(12);
    expect(bereinigt.sofortbedarf!.verpflegungPersonen).toBe(9);
    expect(bereinigt.fahrzeuge.map((f) => f.kennzeichen)).toEqual(["THW 1111"]);
    // Das Original bleibt unverändert.
    expect(folge.personal.length).toBe(10);
  });

  it("ohne Überschneidung, ohne Teil oder bei abgerücktem Teil gibt es keinen Befund", () => {
    const { s, schl } = aufgeteilt();
    const fremd = bogenMitPersonen(["Xaver", "Yvonne"]);
    expect(abgeteiltDoppelt(s.eintraege, schl, fremd)).toBeNull();
    const ohneTeil = einsatzAnlegen("Ohne", EinsatzArt.EINSATZ);
    meldungHinzufuegen(ohneTeil.id, bogenMitPersonen(["Anna"]));
    const e0 = einsaetzeLaden().find((x) => x.id === ohneTeil.id)!.eintraege;
    expect(abgeteiltDoppelt(e0, e0[0]!.einheitSchluessel, bogenMitPersonen(["Anna"]))).toBeNull();
    const abger = s.eintraege.map((e) => (e.teilEtikett ? { ...e, status: MeldeStatus.ABGERUECKT } : e));
    expect(abgeteiltDoppelt(abger, schl, bogenMitPersonen(["Jan", "Kai"]))).toBeNull();
  });

  it("„Nur Stärke“ mit manueller Zahl lässt sich nicht herausnehmen", () => {
    const b = neuerBogen();
    expect(doppeltHerausnehmbar(b)).toBe(true);
    expect(doppeltHerausnehmbar({ ...b, staerkeManuell: { fuehrer: 0, unterfuehrer: 1, mannschaft: 8, gesamt: 9 } })).toBe(false);
  });

  it("die Rückfrage „Einheit ist bereits gemeldet“ bietet den Weg ohne den Trupp an", () => {
    const q = readFileSync("src/app/app.tsx", "utf8");
    expect(q).toContain('wert: "fassung-ohne"');
    expect(q).toContain("abgeteiltDoppeltText(doppeltBefund)");
  });
});

describe("R13-W2 abgerückte Einheiten sind nicht „neu seit der letzten Kenntnisnahme“", () => {
  const stand = { zeitpunkt: 0, eintragIds: [] } as unknown as ExportStand;
  it("Abgerückte, Aufteilungen und Zusammenführungen zählen nicht, Anwesende schon", () => {
    const b = bogenMitPersonen(["A"]);
    const eintraege = [
      eintrag("a", b),
      eintrag("b", b, { status: MeldeStatus.ABGERUECKT }),
      eintrag("c", b, { quelle: "aufteilung" }),
      eintrag("d", b, { quelle: "zusammenfuehrung" }),
    ];
    expect(neuZurKenntnis(eintraege, stand).map((e) => e.id)).toEqual(["a"]);
  });
  it("die einzige Einheit abgerückt: null neu, auch auf der Startseite", () => {
    const b = bogenMitPersonen(["A"]);
    expect(neuZurKenntnis([eintrag("a", b, { status: MeldeStatus.ABGERUECKT })], stand)).toEqual([]);
  });
});

describe("R13-W3 Startseite nennt eine Aufteilung der Einheitenzahl", () => {
  it("gemeldet und anwesend fallen auseinander: beide Wörter; sonst wie bisher", () => {
    const b = bogenMitPersonen(["A"]);
    const abgerueckt = [eintrag("a", b, { status: MeldeStatus.ABGERUECKT })];
    expect(einheitenAufteilung(abgerueckt, EinsatzArt.EINSATZ)).toBe("1 Einheit gemeldet · 0 anwesend");
    const da = [eintrag("a", b), eintrag("b", bogenMitPersonen(["B"]))];
    expect(einheitenAufteilung(da, EinsatzArt.EINSATZ)).toBe("2 Einheiten");
    const gemischt = [eintrag("a", b), eintrag("b", bogenMitPersonen(["B"]), { status: MeldeStatus.ABGERUECKT })];
    expect(einheitenAufteilung(gemischt, EinsatzArt.EINSATZ)).toBe("2 Einheiten gemeldet · 1 anwesend");
  });
});

describe("R13-W4 Verpflegung bei 0 Portionen", () => {
  it("nennt „nicht angefordert“ und die Ernährung getrennt, ohne „0 Personen, davon …“", () => {
    expect(verpflegungBogenText(0, { vegetarisch: 3, vegan: 1 })).toBe("nicht angefordert (Ernährung der Personen: 3 vegetarisch, 1 vegan)");
    expect(verpflegungBogenText(0, { vegetarisch: 0, vegan: 0 })).toBe("nicht angefordert");
    expect(verpflegungBogenText(11, { vegetarisch: 3, vegan: 1 })).toBe("11 Personen, davon 3 vegetarisch, 1 vegan");
    expect(verpflegungBogenText(11, { vegetarisch: 0, vegan: 0 }, false)).toBe("11 Personen · Aufteilung vegetarisch/vegan: keine Angabe");
    expect(verpflegungBogenText(0, { vegetarisch: 3, vegan: 1 })).not.toMatch(/0 Personen/);
  });
});

describe("R13-H1 Einheitstyp-Suche", () => {
  const typen = [
    { kurz: "B (ASH)", name: "Bergungsgruppe (Abstützsystem Holz)" },
    { kurz: "ENT", name: "Einsatznachsorgeteam" },
    { kurz: "FGr F", name: "Fachgruppe Führungsunterstützung" },
    { kurz: "ZTr TZ", name: "Zugtrupp Technischer Zug" },
    { kurz: "B", name: "Bergungsgruppe" },
    { kurz: "FGr E", name: "Fachgruppe Elektroversorgung" },
    { kurz: "OV-Stab", name: "Stab des Ortsverbands" },
  ];
  const ordne = (suche: string) => {
    const alle = [suche, ...suchAlternativen(suche)];
    return typen
      .map((t, i) => ({ t, i, r: Math.min(...alle.map((s) => vokabRang(t.kurz, t.name, s))) }))
      .filter((x) => x.r < 3)
      .sort((a, b) => a.r - b.r || a.i - b.i)
      .map((x) => x.t.kurz);
  };
  it("„TZ“ nennt den Technischen Zug zuerst, die Treffer mitten im Wort danach", () => {
    const r = ordne("TZ");
    expect(r[0]).toBe("ZTr TZ");
    expect(r).toContain("B (ASH)");
    expect(r.indexOf("ZTr TZ")).toBeLessThan(r.indexOf("B (ASH)"));
  });
  it("„OV“ nennt den OV-Stab vor der Elektroversorgung", () => {
    const r = ordne("OV");
    expect(r[0]).toBe("OV-Stab");
    expect(r.indexOf("OV-Stab")).toBeLessThan(r.indexOf("FGr E"));
  });
  it("„BGr“, „1. BGr“, „1.BGr“ und „1. Bergungsgruppe“ finden die Bergungsgruppe, die ganze Bezeichnung zuerst", () => {
    for (const s of ["BGr", "1. BGr", "1.BGr", "2. Bergungsgruppe"]) {
      const r = ordne(s);
      expect(r[0], s).toBe("B");
      expect(r, s).toContain("B (ASH)");
    }
  });
  it("Kurzformen ergänzen nur: wer „Fachgruppe“ tippt, findet weiter alles", () => {
    expect(suchAlternativen("Fachgruppe")).toEqual([]);
    expect(ordne("Fachgruppe")).toEqual(["FGr F", "FGr E"]);
  });
});

describe("R13-H2 Ortssuche kennt Bindestrich und Leerzeichen als gleich", () => {
  it("sucheForm", () => {
    expect(sucheForm("Neu-Ulm")).toBe(sucheForm("Neu Ulm"));
    expect(sucheForm("Villingen-Schwenningen")).toBe(sucheForm("villingen schwenningen"));
    expect(sucheForm("Garmisch-Partenkirchen")).toBe("garmisch partenkirchen");
    expect(sucheForm("Biberach/Riß")).toBe(sucheForm("Biberach Riss"));
    // Die Faltung bleibt: Umlaute wie bisher.
    expect(sucheForm("Müllheim")).toBe(falte("Muellheim"));
  });
  it("„Baden Baden“ und „Neu Ulm“ liegen im Treffer, „Ulm“ nach wie vor auch", () => {
    const orte = ["Baden-Baden", "Neu-Ulm", "Ulm", "Hamburg-Altona"];
    const finde = (s: string) => orte.filter((o) => sucheForm(o).includes(sucheForm(s)));
    expect(finde("Baden Baden")).toEqual(["Baden-Baden"]);
    expect(finde("Neu Ulm")).toEqual(["Neu-Ulm"]);
    expect(finde("Ulm")).toEqual(["Neu-Ulm", "Ulm"]);
    expect(finde("Hamburg Altona")).toEqual(["Hamburg-Altona"]);
  });
});

describe("R13-H3 Autokorrektur aus bei Namen, Ort, Typ, Zug und Suche", () => {
  it("die gemeinsamen Eingabeattribute schalten Autokorrektur und Rechtschreibprüfung ab", () => {
    const q = readFileSync("src/app/schritte/bausteine.tsx", "utf8");
    expect(q).toMatch(/export const NAMEN_EINGABE = \{ autoCorrect: "off", spellCheck: false \} as const;/);
    expect(q).toMatch(/export const FREMDE_DATEN = \{ autoComplete: "off", autoCorrect: "off", spellCheck: false \} as const;/);
    // Das Vorschlagsfeld (Ort, Einheitstyp, Funktion, Beruf) trägt sie.
    expect(q).toContain("{...NAMEN_EINGABE}");
  });
  it("Organisationsname, Suchfeld und Zugfelder tragen sie, Fließtexte nicht", () => {
    const e = readFileSync("src/app/schritte/einheit.tsx", "utf8");
    expect(e).toMatch(/<input\s+\{\.\.\.NAMEN_EINGABE\}\s+value=\{e\.organisationName/);
    const u = readFileSync("src/app/einsaetze-ui.tsx", "utf8");
    expect(u).toMatch(/type="search"\s+\{\.\.\.NAMEN_EINGABE\}/);
    expect(u).toMatch(/list=\{zugListeId\}\s+\{\.\.\.NAMEN_EINGABE\}/);
  });
});
