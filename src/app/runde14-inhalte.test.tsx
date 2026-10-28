/**
 * Runde 14, Block Inhalte: reine Logik der Behebungen aus arbeitsablauf (W1, W3 bis W5), fuehrungssicht (K1, K3, K4),
 * neuer-nutzer (N1, N2) und zerstoerende-handlungen (D2). W2 steht in einsatz-abgleich.test.ts, die gesetzten
 * Lageblätter in runde14-inhalte-pdf.test.ts, die Oberfläche in runde14-inhalte-ui.test.tsx.
 */
import { afterEach, describe, expect, it } from "vitest";
import { PersonalErfassung, StaerkeRolle, jetztZeitpunkt, staerke, type Erfassungsbogen } from "@bos/eeb-format/model";
import {
  EinsatzArt,
  MeldeStatus,
  einsaetzeLaden,
  einsatzAnlegen,
  meldungAufteilen,
  meldungHinzufuegen,
  type MeldeEintrag,
} from "@bos/meldekopf/einsaetze";
import { bogenDiff } from "@bos/meldekopf/meldung-diff";
import { neuePerson, neuerBogen, pruefpunkte } from "./hilfen";
import { angabenAlterWort, angabenZeit, eintreffzeitStapelHinweis, standLiegtWeitVorEingang } from "./angaben-alter";
import { aggregiere, bedarfNichtErfasst } from "./auswertung";
import {
  alterKurz,
  anwesendenAlter,
  anwesendenAlterText,
  auftragKurz,
  bedarfOhneAngabeHinweis,
  bedarfText,
  lageblattZeilenAlter,
  lagebild,
  zugAlterText,
} from "./lagemonitor";
import { abweichenderOrt, lueckenText, vergleichKurztext } from "./einheiten-tabelle";
import { passtZuStatusfilter } from "./einheiten-liste";
import { aenderungsText } from "./meldungs-vergleich";
import { nurStaerkeUebernehmen } from "./nur-staerke";
import { abgeteiltDoppeltImStapel } from "./abgeteilt-doppelt";
import { aggregiereNachZug } from "./auswertung";

afterEach(() => localStorage.clear());

function eintrag(id: string, bogen: Erfassungsbogen, over: Partial<MeldeEintrag> = {}): MeldeEintrag {
  return { id, einheitSchluessel: id, empfangenAm: Date.now(), quelle: "scan", status: MeldeStatus.ANWESEND, bogen, ...over } as MeldeEintrag;
}

function bogenMit(ort: string, personen = 3): Erfassungsbogen {
  const b = neuerBogen();
  b.einheit.hierarchie[0]!.name = ort;
  b.personal = Array.from({ length: personen }, (_, k) => ({ ...neuePerson(), vorname: `V${k}`, nachname: `N${ort}${k}` }));
  return b;
}

/** Schnellerfassung: nur Stärke, nichts sonst. */
function schnell(ort: string, gesamt: number): Erfassungsbogen {
  const b = neuerBogen();
  b.einheit.hierarchie[0]!.name = ort;
  b.personalErfassung = PersonalErfassung.NUR_STAERKE;
  b.personal = [];
  b.fahrzeuge = [];
  b.staerkeManuell = { fuehrer: 0, unterfuehrer: 3, mannschaft: gesamt - 3, gesamt };
  return b;
}

describe("R14-K1 Alter der Angaben (Stand), nicht des Eintreffens", () => {
  const jetzt = Date.now();
  const mitStandVor = (min: number) => {
    const b = bogenMit("Biberach");
    b.stand = jetztZeitpunkt() - min;
    return b;
  };

  it("ein Bogen von gestern Abend, eben eingegangen, gilt als 14 Stunden alt und trägt das Wort „Stand“", () => {
    const e = eintrag("a", mitStandVor(14 * 60), { empfangenAm: jetzt });
    expect(jetzt - angabenZeit(e)).toBeGreaterThanOrEqual(14 * 3600_000 - 61_000);
    expect(standLiegtWeitVorEingang(e)).toBe(true);
    expect(angabenAlterWort(e)).toBe("Stand");
    expect(lageblattZeilenAlter(angabenZeit(e), jetzt, angabenAlterWort(e))).toMatch(/^⚠ Stand vor 14 Std [01] Min$/);
  });

  it("ein frischer Bogen heißt ebenfalls „Stand“ (R20-A3: ein Wort) und trägt keine Marke; ein Stand nach dem Eingang verlängert nichts", () => {
    const frisch = eintrag("a", mitStandVor(5), { empfangenAm: jetzt });
    expect(angabenAlterWort(frisch)).toBe("Stand");
    expect(lageblattZeilenAlter(angabenZeit(frisch), jetzt)).toBeNull();
    const zukunft = eintrag("b", mitStandVor(-120), { empfangenAm: jetzt });
    expect(angabenZeit(zukunft)).toBe(jetzt);
  });

  it("Kopfzeile, Filter, Zugsumme und Monitor rechnen alle ab dem Stand", () => {
    const alt = eintrag("alt", mitStandVor(14 * 60), { empfangenAm: jetzt, einheitSchluessel: "alt", zugEtikett: "1. Zug" });
    const neu = eintrag("neu", mitStandVor(2), { empfangenAm: jetzt, einheitSchluessel: "neu", zugEtikett: "1. Zug" });
    // Kopfzeile: „1 von 2 älter als 1 Std“, die älteste Meldung vor 14 Std.
    expect(anwesendenAlterText(anwesendenAlter([alt, neu], jetzt), jetzt)).toMatch(/^älteste Meldung vor 14 Std \d+ Min, 1 von 2 älter als 1 Std$/);
    expect(anwesendenAlterText(anwesendenAlter([neu], jetzt), jetzt)).toBeNull();
    // Filter „nur ältere als 1 Std“.
    expect(passtZuStatusfilter(alt, "veraltet", jetzt)).toBe(true);
    expect(passtZuStatusfilter(neu, "veraltet", jetzt)).toBe(false);
    // Zugsumme.
    const zug = aggregiereNachZug([alt, neu], EinsatzArt.EINSATZ);
    expect(zugAlterText(zug[0]!.aeltesteMeldungAm, jetzt)).toMatch(/^⚠ älteste Meldung vor 14 Std/);
  });

  it("der Monitor gibt der Zeile Alter, Marke „Stand“, Zug und Auftrag (R14-K3)", () => {
    const s = einsatzAnlegen("Hochwasser Weser", EinsatzArt.EINSATZ);
    const alt = bogenMit("Biberach");
    alt.stand = jetztZeitpunkt() - 400;
    meldungHinzufuegen(s.id, alt);
    const ent = einsaetzeLaden()[0]!.eintraege[0]!;
    ent.empfangenAm = Date.now();
    ent.zugEtikett = "2. Zug";
    ent.notiz = "Sandsackverbau Damm Nord,\n   Ablösung 18 Uhr — bitte Funk halten, Rückfragen über die Führungsstelle des Abschnitts";
    const bild = lagebild({ ...einsaetzeLaden()[0]!, eintraege: [ent] }, Date.now());
    const z = bild.einheiten[0]!;
    expect(z.standAlt).toBe(true);
    expect(alterKurz(z.alterMin!)).toMatch(/^6 Std (39|40|41) Min$/);
    expect(z.zug).toBe("2. Zug");
    expect(z.auftrag!.length).toBeLessThanOrEqual(48);
    expect(z.auftrag).toMatch(/^Sandsackverbau Damm Nord, Ablösung 18 Uhr/);
  });

  it("alterKurz nennt Minuten (R14-K3); auftragKurz kürzt auf eine Zeile", () => {
    expect(alterKurz(90)).toBe("1 Std 30 Min");
    expect(alterKurz(119)).toBe("1 Std 59 Min");
    expect(alterKurz(2 * 1440 + 5)).toBe("2 Tage");
    expect(alterKurz(1440)).toBe("1 Tag");
    expect(auftragKurz("a\n b")).toBe("a b");
  });

  it("der Hinweis nach einem Stapel nennt die Einlesezeit erst ab zwei Bögen", () => {
    expect(eintreffzeitStapelHinweis(1)).toBe("");
    // R18-N3: datiert („Aufnahme 22:41") und mit Deutung des „*".
    expect(eintreffzeitStapelHinweis(6)).toMatch(/^Aufnahme \d{2}:\d{2}: Eintreffzeit dieser 6 Bögen ist die Zeit des Einlesens \(in Lageblatt und Tabellen mit \* markiert\)/);
  });
});

describe("R14-A1 Wann ist die Eintreffzeit nur die Zeit des Einlesens?", () => {
  it("gestempelt: erste Fassung und Folgemeldung erben sie; von Hand gesetzt oder manuell erfasst: nicht", async () => {
    const { zeitEingelesen } = await import("./pdf");
    const t0 = new Date(2026, 9, 26, 9, 56).getTime();
    const erste = eintrag("e1", bogenMit("Ulm"), { einheitSchluessel: "u", empfangenAm: t0 });
    const folge = eintrag("e2", bogenMit("Ulm"), { einheitSchluessel: "u", empfangenAm: t0 + 600_000, eingetroffenAm: t0 });
    expect(zeitEingelesen(erste, [erste])).toBe(true);
    expect(zeitEingelesen(folge, [folge, erste])).toBe(true);
    const korrigiert = { ...erste, eingetroffenAm: new Date(2026, 9, 26, 8, 0).getTime() };
    expect(zeitEingelesen(korrigiert, [korrigiert])).toBe(false);
    const handErfasst = eintrag("m", bogenMit("Verden"), { einheitSchluessel: "v", quelle: "manuell", empfangenAm: t0 });
    expect(zeitEingelesen(handErfasst, [handErfasst])).toBe(false);
  });
});

describe("R14-W1 Schnell erfasste Einheiten: Bedarf „nicht erfasst“ statt „keine“", () => {
  it("bedarfNichtErfasst erkennt die Schnellerfassung, nicht den gemeldeten Bogen", () => {
    expect(bedarfNichtErfasst(schnell("Sinsheim", 11))).toBe(true);
    const voll = bogenMit("Albstadt");
    voll.sofortbedarf = { verpflegungPersonen: 3, dieselLiter: 0, benzinLiter: 0, gemischLiter: 0, unterbringung: false, ruhezeitErforderlich: false };
    expect(bedarfNichtErfasst(voll)).toBe(false);
    const mitDiesel = schnell("Sinsheim", 11);
    mitDiesel.sofortbedarf = { verpflegungPersonen: 11, dieselLiter: 80, benzinLiter: 0, gemischLiter: 0, unterbringung: false, ruhezeitErforderlich: false };
    expect(bedarfNichtErfasst(mitDiesel)).toBe(false);
  });

  it("die Summen zählen die Einheiten ohne Angabe; der Monitor nennt sie in der Bedarfszeile", () => {
    const s = einsatzAnlegen("Hochwasser Weser", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, schnell("Sinsheim", 11));
    meldungHinzufuegen(s.id, bogenMit("Albstadt"));
    const sum = aggregiere(einsaetzeLaden()[0]!.eintraege, EinsatzArt.EINSATZ);
    expect(sum.bedarfOhneAngabe).toBe(1);
    expect(sum.einheiten).toBe(2);
    expect(bedarfText(sum)).toContain("bei 1 Einheit nicht erfasst");
    expect(bedarfOhneAngabeHinweis(1)).toMatch(/„keine" bei Unterbringung, Ruhezeit und Betriebsstoff heißt dort nicht „nichts nötig"/);
  });

  it("ohne Schnellerfassung ändert sich die Bedarfszeile nicht", () => {
    const s = einsatzAnlegen("Hochwasser Weser", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogenMit("Albstadt"));
    const sum = aggregiere(einsaetzeLaden()[0]!.eintraege, EinsatzArt.EINSATZ);
    expect(sum.bedarfOhneAngabe).toBe(0);
    expect(bedarfText(sum) ?? "").not.toContain("nicht erfasst");
  });
});

describe("R14-W3 „Anderer Einsatz?“ hängt nicht von Folgemeldungen und Reihenfolge ab", () => {
  const mitOrt = (ort: string, ortAuftrag: string) => {
    const b = bogenMit(ort);
    b.einsatz.ortAuftrag = ortAuftrag;
    return b;
  };

  it("eine zweite Fassung derselben Einheit macht aus einem Wort nicht „zwei Einheiten“", () => {
    const x = eintrag("x", mitOrt("Albstadt", "Pumpen Nord"), { einheitSchluessel: "x" });
    const b1 = eintrag("b1", mitOrt("Biberach", "Deich Sandsack"), { einheitSchluessel: "b", empfangenAm: 1 });
    const b2 = eintrag("b2", mitOrt("Biberach", "Deich Sandsack"), { einheitSchluessel: "b", empfangenAm: 2 });
    const c = eintrag("c", mitOrt("Crailsheim", "Keller Pumpen"), { einheitSchluessel: "c" });
    const sammlung = { name: "Lage Weser" };
    const ohneFolge = abweichenderOrt(x, sammlung, [x, b2, c]);
    const mitFolge = abweichenderOrt(x, sammlung, [x, b1, b2, c]);
    const andereReihenfolge = abweichenderOrt(x, sammlung, [c, b2, b1, x]);
    expect(mitFolge).toBe(ohneFolge);
    expect(andereReihenfolge).toBe(ohneFolge);
  });

  it("eine wirklich fremde Einheit wird auch mit Folgemeldungen markiert", () => {
    const fremd = eintrag("f", mitOrt("Freiburg", "Gebäudeschaden Cottbus"), { einheitSchluessel: "f" });
    const a = eintrag("a", mitOrt("Albstadt", "Deichverteidigung Weser"), { einheitSchluessel: "a" });
    const b = eintrag("b", mitOrt("Biberach", "Deichverteidigung Weser"), { einheitSchluessel: "b" });
    const c1 = eintrag("c1", mitOrt("Crailsheim", "Deichverteidigung Weser"), { einheitSchluessel: "c", empfangenAm: 1 });
    const c2 = eintrag("c2", mitOrt("Crailsheim", "Deichverteidigung Weser"), { einheitSchluessel: "c", empfangenAm: 2 });
    expect(abweichenderOrt(fremd, { name: "Lage Weser" }, [fremd, a, b, c1, c2])).toBe("Gebäudeschaden Cottbus");
  });
});

describe("R14-W4/W5 Folgemeldungen: Stärke ändern und voller Bogen nach der Schnellerfassung", () => {
  function voll(): Erfassungsbogen {
    const b = bogenMit("Sinsheim", 11);
    b.fahrzeuge = [{ typ: { freitext: "MTW" }, kennzeichen: "THW 1111" }, { typ: { freitext: "GKW" }, kennzeichen: "THW 2222" }];
    b.sofortbedarf = { verpflegungPersonen: 11, dieselLiter: 130, benzinLiter: 0, gemischLiter: 0, unterbringung: true, ruhezeitErforderlich: false };
    return b;
  }

  it("W4: „Stärke ändern“ nimmt Namen, Fahrzeuge und Bedarf mit — die Folgezeile sagt „übernommen“, nicht „nicht erfasst“", () => {
    const vorige = eintrag("v", voll(), { einheitSchluessel: "e", quelle: "scan" });
    const st = staerke(vorige.bogen);
    const geaendert = nurStaerkeUebernehmen(vorige.bogen, { ...st, mannschaft: st.mannschaft - 3, gesamt: st.gesamt - 3 }, vorige.bogen.stand + 1);
    const kopf = eintrag("k", geaendert, { einheitSchluessel: "e", quelle: "manuell", empfangenAm: Date.now() + 1000 });
    const text = vergleichKurztext(vorige, kopf);
    expect(text).toContain("Stärke 11 → 8 (−3)");
    expect(text).toContain("übernommen");
    expect(text).not.toContain("nicht erfasst");
  });

  it("W4: ein wirklich schnell erfasster Bogen behält den Satz „nicht erfasst“, nur mit den fehlenden Teilen", () => {
    const vorige = eintrag("v", voll(), { einheitSchluessel: "e", quelle: "scan" });
    const kopf = eintrag("k", schnell("Sinsheim", 8), { einheitSchluessel: "e", quelle: "manuell", empfangenAm: Date.now() + 1000 });
    const text = vergleichKurztext(vorige, kopf);
    expect(text).toMatch(/Fahrzeuge, Personal und Sofortbedarf nicht erfasst/);
  });

  it("W5: Dialog und Quittung nennen nach der Schnellerfassung dieselbe Aufzählung, Personal zuerst", () => {
    const vorige = eintrag("v", schnell("Sinsheim", 11), { einheitSchluessel: "e", quelle: "manuell" });
    const neu = voll();
    neu.stand = vorige.bogen.stand + 5;
    const kopf = eintrag("k", neu, { einheitSchluessel: "e", quelle: "scan", empfangenAm: Date.now() + 1000 });
    const dialog = aenderungsText(bogenDiff(vorige.bogen, kopf.bogen));
    const quittung = vergleichKurztext(vorige, kopf);
    expect(quittung).toBe(dialog);
    expect(quittung).toMatch(/^Personal: 11 neu/);
    expect(quittung).not.toMatch(/\d\d weitere Änderungen/);
  });
});

describe("R14-N1 Warnung und Knopf zählen dieselben Personenkarten", () => {
  it("zwei Plätze mit Funktion, sieben ganz leer: die Warnung nennt 9 ohne Namen und 7 davon ganz leer", () => {
    const b = neuerBogen();
    b.personal = Array.from({ length: 9 }, () => neuePerson());
    b.personal[0]!.staerkeRolle = StaerkeRolle.FUEHRER;
    b.personal[1]!.staerkeRolle = StaerkeRolle.UNTERFUEHRER;
    const warnung = pruefpunkte(b, false).map((p) => p.text).find((t) => /Personenkarten/.test(t))!;
    expect(warnung).toMatch(/^9 Personenkarten ohne Namen zählen in die Stärke \(7 davon ganz leer\)/);
  });

  it("sind alle Karten ganz leer, bleibt es bei der bisherigen Zahl", () => {
    const b = neuerBogen();
    b.personal = Array.from({ length: 4 }, () => neuePerson());
    expect(pruefpunkte(b, false).map((p) => p.text).find((t) => /Personenkarten/.test(t))).toMatch(/^4 Personenkarten ohne Angaben zählen/);
  });
});

describe("R14-N2 Hinweise der Karte: Gesamtzahl vorn", () => {
  it("zehn Hinweise stehen als „10 Punkte“, nicht als „leere Personenkarte + 9 weitere“", () => {
    const texte = ["7 Personenkarten ohne Angaben zählen in die Stärke — ausfüllen oder entfernen.", ...Array.from({ length: 9 }, (_, i) => `Punkt ${i}`)];
    expect(lueckenText(texte)).toBe("10 Punkte, u. a. leere Personenkarte");
    expect(lueckenText(texte.slice(0, 1))).toBe("leere Personenkarte");
  });
});

describe("R14-D2 Stapelweg: Doppelungsprüfung für jede Folgemeldung", () => {
  it("nennt je Folgemeldung einer aufgeteilten Einheit den Trupp; neue Einheiten und fremde Namen bleiben still", () => {
    const s = einsatzAnlegen("Hochwasser Weser", EinsatzArt.EINSATZ);
    const ganz = bogenMit("Sinsheim", 6);
    const r = meldungHinzufuegen(s.id, ganz)!;
    meldungAufteilen(s.id, r.eintrag.id, { teilEtikett: "Trupp 2", personal: [4, 5], fahrzeuge: [] });
    const vorher = einsaetzeLaden().find((x) => x.id === s.id)!.eintraege;
    const neuer = structuredClone(ganz);
    neuer.stand += 5;
    const folge = meldungHinzufuegen(s.id, neuer)!;
    const fremd = meldungHinzufuegen(s.id, bogenMit("Weinsberg", 3))!;
    const nachher = einsaetzeLaden().find((x) => x.id === s.id)!.eintraege;
    const zeilen = abgeteiltDoppeltImStapel(vorher, nachher, [folge.eintrag.id, fremd.eintrag.id]);
    expect(zeilen).toHaveLength(1);
    expect(zeilen[0]).toMatch(/Trupp 2 \(2 Personen\) ist abgeteilt/);
    expect(zeilen[0]).toContain("NSinsheim4");
    expect(zeilen[0]).toMatch(/zählen jetzt doppelt/);
    expect(abgeteiltDoppeltImStapel(vorher, nachher, [fremd.eintrag.id])).toEqual([]);
  });
});
