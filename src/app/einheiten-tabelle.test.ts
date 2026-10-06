/**
 * Tabellensicht des Meldekopfs. Geprüft wird das, worauf sich in einer
 * Lagebesprechung jemand verlässt: dass die Summenzeile genau die Zeilen zählt,
 * die darüberstehen (abgerückte also nicht), und dass die Spaltensortierung
 * nach Zahlen wirklich nach Zahlen ordnet — nicht nach deren Text („10" vor
 * „9"), was bei einer Stärkespalte die falsche Einheit nach oben holt.
 */

import { describe, it, expect } from "vitest";
import {
  Ernaehrung,
  Fahrerlaubnis,
  Geschlecht,
  OrganisationsTyp,
  PersonalErfassung,
  SCHEMA_VERSION,
  StaerkeRolle,
  type Erfassungsbogen,
  type Person,
  zeitpunktAusIso,
} from "@bos/eeb-format/model";
import { EinsatzArt, MeldeStatus, type MeldeEintrag } from "@bos/meldekopf/einsaetze";
import {
  TABELLEN_SPALTEN,
  bedarfKurztext,
  bedarfMarken,
  folgeAenderung,
  frischGemeldet,
  letzteMeldung,
  hatSofortbedarf,
  passtZuBedarfsfilter,
  istNeu,
  lueckeKurz,
  lueckenAlle,
  lueckenText,
  meldungsNummern,
  standIstAlt,
  summenBeschriftung,
  tabellenSumme,
  tabellenZaehlung,
  tabellenZeilen,
  zeilenSortieren,
} from "./einheiten-tabelle";

function person(rolle: StaerkeRolle): Person {
  return {
    vorname: "Anna",
    nachname: "Beispiel",
    staerkeRolle: rolle,
    funktionen: [],
    fahrerlaubnis: Fahrerlaubnis.NONE,
    geschlecht: Geschlecht.W,
    ernaehrung: Ernaehrung.FLEISCH,
    kontakte: [],
    zusatzqualifikationen: [],
  };
}

function bogen(ort: string, mannschaft: number): Erfassungsbogen {
  return {
    schemaVersion: SCHEMA_VERSION,
    stand: 100,
    einheit: {
      organisation: OrganisationsTyp.THW,
      einheitsTyp: { freitext: "FGr N" },
      hierarchie: [{ bezeichnung: { freitext: "Ortsverband" }, name: ort }],
    },
    einsatz: { zeitraumVon: 100, zeitraumBis: 101, ortAuftrag: "" },
    personalErfassung: PersonalErfassung.VOLLSTAENDIG,
    personal: [
      person(StaerkeRolle.FUEHRER),
      ...Array.from({ length: mannschaft }, () => person(StaerkeRolle.MANNSCHAFT)),
    ],
    fahrzeuge: [{ typ: { freitext: "GKW" }, stanKonform: true }],
    sonstiges: "",
  };
}

function eintrag(id: string, b: Erfassungsbogen, over: Partial<MeldeEintrag> = {}): MeldeEintrag {
  return {
    id,
    einheitSchluessel: id,
    empfangenAm: 1000,
    quelle: "scan",
    status: MeldeStatus.ANWESEND,
    bogen: b,
    ...over,
  };
}

/** Anzeigename einer Meldung, wie ihn auch die Tabelle bildet. */
const zeilenName = (e: MeldeEintrag) => tabellenZeilen([e])[0]!.einheit;

const oldenburg = eintrag("a", bogen("Oldenburg", 9));
const bremen = eintrag("b", bogen("Bremen", 1));
const cloppenburg = eintrag("c", bogen("Cloppenburg", 4), { status: MeldeStatus.ABGERUECKT });

describe("tabellenZeilen", () => {
  it("nimmt die abgeleiteten Zahlen des Bogens auf und behält die Reihenfolge", () => {
    const zeilen = tabellenZeilen([oldenburg, bremen]);
    expect(zeilen.map((z) => z.einheit)).toEqual([oldenburg, bremen].map((e) => zeilenName(e)));
    expect(zeilen[0]!.gesamt).toBe(10);
    expect(zeilen[0]!.fuehrer).toBe(1);
    expect(zeilen[0]!.mannschaft).toBe(9);
    expect(zeilen[0]!.fahrzeuge).toBe(1);
    expect(zeilen[0]!.fahrzeugTypen).toBe("GKW");
    expect(zeilen[0]!.anwesend).toBe(true);
  });

  it("kennzeichnet abgerückte Meldungen als nicht anwesend", () => {
    expect(tabellenZeilen([cloppenburg])[0]!.anwesend).toBe(false);
  });

  it("trägt Eintreff- und Abrückzeit, Bedarf und Auftrag der Führungsstelle", () => {
    const jetzt = new Date("2026-09-27T20:00").getTime();
    const b = bogen("Crailsheim", 3);
    b.sofortbedarf = { verpflegungPersonen: 0, dieselLiter: 400, benzinLiter: 0, gemischLiter: 0, unterbringung: true, ruhezeitErforderlich: true };
    const [z] = tabellenZeilen(
      [
        eintrag("x", b, {
          status: MeldeStatus.ABGERUECKT,
          eingetroffenAm: new Date("2026-09-27T09:40").getTime(),
          abgerueckAm: new Date("2026-09-27T15:10").getTime(),
          notiz: "Deichabschnitt Nord",
        }),
      ],
      undefined,
      jetzt,
    );
    // Mit Datum, in derselben Form wie Karte und Lageblatt (R2-A6).
    expect(z!.eingetroffen).toBe("27.09.2026, 09:40");
    expect(z!.abgerueckt).toBe("27.09.2026, 15:10");
    expect(z!.bedarf).toBe("Ruhezeit · Unterbr. · Diesel 400 l");
    expect(z!.auftrag).toBe("Deichabschnitt Nord");
    // Stand 100 (1970) liegt Jahrzehnte vor dem Eintreffen.
    expect(z!.standAlt).toBe(true);
  });

  it("lässt Abrückzeit und Bedarf leer, wo nichts ist", () => {
    const [z] = tabellenZeilen([oldenburg]);
    expect(z!.abgerueckt).toBe("");
    expect(z!.abgerueckAm).toBe(0);
    expect(z!.bedarf).toBe("");
    expect(z!.auftrag).toBe("");
  });
});

describe("meldungsNummern (Audit Runde 2, R2-A6)", () => {
  it("nummeriert Einheiten nach dem ersten Eingang; Folgemeldungen und korrigierte Eintreffzeit ändern nichts", () => {
    const a1 = eintrag("a1", bogen("Aalen", 1), { einheitSchluessel: "A", empfangenAm: 300 });
    const b1 = eintrag("b1", bogen("Biberach", 1), { einheitSchluessel: "B", empfangenAm: 100, eingetroffenAm: 900 });
    const a2 = eintrag("a2", bogen("Aalen", 2), { einheitSchluessel: "A", empfangenAm: 800 });
    const c1 = eintrag("c1", bogen("Crailsheim", 1), { einheitSchluessel: "C", empfangenAm: 500 });
    const nr = meldungsNummern([a2, c1, a1, b1]);
    expect([nr.get("B"), nr.get("A"), nr.get("C")]).toEqual([1, 2, 3]);
  });
});

describe("bedarfMarken", () => {
  it("nennt nur, was gesetzt ist — nichts alarmiert, was leer ist", () => {
    const b = bogen("Bremen", 1);
    expect(bedarfMarken(b)).toEqual([]);
    b.sofortbedarf = { verpflegungPersonen: 2, dieselLiter: 0, benzinLiter: 0, gemischLiter: 0, unterbringung: false, ruhezeitErforderlich: false };
    // Verpflegung 2 bei Stärke 2: der Normalfall, keine Marke.
    expect(bedarfMarken(b)).toEqual([]);
    b.sofortbedarf = { verpflegungPersonen: 5, dieselLiter: 0, benzinLiter: 20, gemischLiter: 0, unterbringung: false, ruhezeitErforderlich: true };
    expect(bedarfMarken(b).map((m) => m.lang)).toEqual(["Ruhezeit", "Verpflegung 5 (Stärke 2)", "Benzin 20 l"]);
    expect(bedarfKurztext(b)).toBe("Ruhezeit · Verpfl. 5 (St. 2) · Benzin 20 l");
  });
});

describe("passtZuBedarfsfilter (Audit Runde 2, R2-K4)", () => {
  const mitBedarf = (ort: string, ruhe: boolean, unterbr: boolean, status = MeldeStatus.ANWESEND) => {
    const b = bogen(ort, 3);
    b.sofortbedarf = { verpflegungPersonen: 0, dieselLiter: 80, benzinLiter: 0, gemischLiter: 0, unterbringung: unterbr, ruhezeitErforderlich: ruhe };
    return eintrag(ort, b, { status });
  };

  it("zeigt bei elf Einheiten mit Diesel genau die zwei mit Ruhezeit", () => {
    const lage = Array.from({ length: 9 }, (_, i) => mitBedarf(`D${i}`, false, false));
    lage.push(mitBedarf("Ruhe1", true, false), mitBedarf("Ruhe2", true, false));
    expect(lage.filter(hatSofortbedarf)).toHaveLength(11);
    expect(lage.filter((e) => passtZuBedarfsfilter(e, "dringend")).map((e) => e.id)).toEqual(["Ruhe1", "Ruhe2"]);
    expect(lage.filter((e) => passtZuBedarfsfilter(e, "ruhezeit"))).toHaveLength(2);
    expect(lage.filter((e) => passtZuBedarfsfilter(e, "unterbringung"))).toHaveLength(0);
  });

  it("nimmt Abgerückte aus dem Filter und setzt Kraftstoff als Routine ab", () => {
    const weg = mitBedarf("Weg", true, true, MeldeStatus.ABGERUECKT);
    expect(passtZuBedarfsfilter(weg, "dringend")).toBe(false);
    expect(passtZuBedarfsfilter(mitBedarf("U", false, true), "unterbringung")).toBe(true);
    expect(bedarfMarken(mitBedarf("D", false, false).bogen).map((m) => m.dringend)).toEqual([false]);
  });
});

describe("standIstAlt / istNeu", () => {
  it("nennt einen Stand alt, der mehr als 24 h vor dem Eintreffen liegt", () => {
    const b = bogen("Aurich", 1);
    // bogen.stand ist ein EebZeitpunkt (Minuten seit 2020, Wandzeit), nicht ms.
    b.stand = zeitpunktAusIso("2026-07-16T19:23");
    const frisch = eintrag("f", b, { eingetroffenAm: new Date("2026-07-16T20:23").getTime() });
    const alt = eintrag("a", b, { eingetroffenAm: new Date("2026-09-27T09:40").getTime() });
    expect(standIstAlt(frisch)).toBe(false);
    expect(standIstAlt(alt)).toBe(true);
  });

  it("setzt die Marke alt nicht an einen Bogen, der Minuten vor dem Eintreffen erstellt wurde (R2-N4)", () => {
    const b = bogen("Ulm", 1);
    b.stand = zeitpunktAusIso("2026-09-28T10:42");
    const e = eintrag("u", b, { eingetroffenAm: new Date("2026-09-28T10:51").getTime() });
    expect(standIstAlt(e)).toBe(false);
    // knapp 24 h: noch nicht alt; gut 24 h: alt
    expect(standIstAlt(eintrag("v", b, { eingetroffenAm: new Date("2026-09-29T10:41").getTime() }))).toBe(false);
    expect(standIstAlt(eintrag("w", b, { eingetroffenAm: new Date("2026-09-29T10:44").getTime() }))).toBe(true);
  });

  it("nennt eine Meldung neu, die vor weniger als 30 Minuten eintraf", () => {
    const jetzt = new Date("2026-09-27T10:00").getTime();
    expect(istNeu(eintrag("n", bogen("A", 1), { eingetroffenAm: jetzt - 10 * 60 * 1000 }), jetzt)).toBe(true);
    expect(istNeu(eintrag("o", bogen("B", 1), { eingetroffenAm: jetzt - 45 * 60 * 1000 }), jetzt)).toBe(false);
  });
});

describe("tabellenZaehlung / summenBeschriftung", () => {
  it("nennt jede Zählweise beim Namen und lässt Nullen weg", () => {
    const uebung = bogen("Übung", 1);
    uebung.uebung = true;
    const zeilen = tabellenZeilen(
      [oldenburg, bremen, cloppenburg, eintrag("u", uebung), eintrag("z", bogen("Zusammen", 1), { status: MeldeStatus.AUFGEGANGEN })],
      EinsatzArt.EINSATZ,
    );
    const z = tabellenZaehlung(zeilen);
    expect(z).toEqual({ zaehlend: 2, uebung: 1, abgerueckt: 1, zusammengefuehrt: 1 });
    expect(summenBeschriftung(z)).toBe("Summe (2 zählend · 1 Übung · 1 abgerückt · 1 zusammengeführt)");
    expect(summenBeschriftung(tabellenZaehlung(tabellenZeilen([oldenburg])))).toBe("Summe (1 zählend)");
    // Dieselbe Zahl wie die Stärkeleiste: die Summe zählt genau die zählenden.
    expect(tabellenSumme(zeilen).einheiten).toBe(2);
  });
});

describe("tabellenSumme", () => {
  it("zählt nur die anwesenden Zeilen der Auswahl", () => {
    const summe = tabellenSumme(tabellenZeilen([oldenburg, bremen, cloppenburg]));
    expect(summe.einheiten).toBe(2);
    expect(summe.staerke.gesamt).toBe(12);
    expect(summe.fahrzeuge).toBe(2);
  });
});

describe("zeilenSortieren", () => {
  const zeilen = tabellenZeilen([oldenburg, bremen, cloppenburg]);

  it("sortiert Zahlenspalten numerisch, nicht als Text", () => {
    const ab = zeilenSortieren(zeilen, "gesamt", "ab").map((z) => z.gesamt);
    expect(ab).toEqual([10, 5, 2]);
    expect(zeilenSortieren(zeilen, "gesamt", "auf").map((z) => z.gesamt)).toEqual([2, 5, 10]);
  });

  it("sortiert Textspalten nach deutscher Sortierung", () => {
    expect(zeilenSortieren(zeilen, "einheit", "auf").map((z) => z.einheit)[0]).toContain("Bremen");
  });

  it("lässt die übergebene Liste unangetastet", () => {
    const vorher = zeilen.map((z) => z.einheit);
    zeilenSortieren(zeilen, "gesamt", "ab");
    expect(zeilen.map((z) => z.einheit)).toEqual(vorher);
  });

  it("sortiert die Zeitspalten nach dem Zeitpunkt, nicht nach dem Uhrzeit-Text", () => {
    const jetzt = new Date("2026-09-27T20:00").getTime();
    const spaet = eintrag("s", bogen("Spät", 1), { eingetroffenAm: new Date("2026-09-27T08:00").getTime() });
    const frueh = eintrag("f", bogen("Früh", 1), { eingetroffenAm: new Date("2026-09-26T23:00").getTime() });
    const sortiert = zeilenSortieren(tabellenZeilen([spaet, frueh], undefined, jetzt), "eingetroffen", "auf");
    // Als Text käme „27.09.…" nach „26.09.…" nur zufällig richtig — sortiert
    // wird nach dem Zeitpunkt, nicht nach dem Text.
    expect(sortiert.map((z) => z.eingetroffen)).toEqual(["26.09.2026, 23:00", "27.09.2026, 08:00"]);
  });

  it("hält jede Spalte sortierbar (kein Schlüssel ohne Wert)", () => {
    for (const s of TABELLEN_SPALTEN) {
      expect(zeilenSortieren(zeilen, s.schluessel, "ab")).toHaveLength(zeilen.length);
    }
  });
});

describe("folgeAenderung / frischGemeldet (Audit Runde 3, R3-K1)", () => {
  const erst = eintrag("c1", bogen("Crailsheim", 11), { einheitSchluessel: "crailsheim", empfangenAm: 1000 });

  it("nennt den Stärkeverlust mit Differenz und markiert ihn", () => {
    const folge = eintrag("c2", bogen("Crailsheim", 8), { einheitSchluessel: "crailsheim", empfangenAm: 5000, eingetroffenAm: 1000 });
    const f = folgeAenderung(folge, [erst, folge])!;
    expect(f.gemeldetAm).toBe(5000);
    expect(f.kurz).toBe("Stärke 12 → 9 (−3)");
    expect(f).toMatchObject({ staerkeVorher: 12, staerkeNachher: 9, verlust: true });
  });

  it("nennt Bedarfsänderungen mit Wert und die Bemerkung im Wortlaut statt „2 Änderungen“ (R4-K4)", () => {
    const b1 = bogen("Weinsberg", 3);
    b1.sofortbedarf = { verpflegungPersonen: 0, dieselLiter: 200, benzinLiter: 0, gemischLiter: 0, unterbringung: false, ruhezeitErforderlich: false };
    const b2 = structuredClone(b1);
    b2.sofortbedarf!.dieselLiter = 400;
    b2.sonstiges = "Nachschub nötig";
    const a = eintrag("w1", b1, { einheitSchluessel: "w", empfangenAm: 1 });
    const b = eintrag("w2", b2, { einheitSchluessel: "w", empfangenAm: 2 });
    const f = folgeAenderung(b, [a, b])!;
    expect(f.kurz).toBe("Diesel 200 l → 400 l · Bemerkung: „Nachschub nötig“");
    expect(f.verlust).toBe(false);
  });

  it("kürzt eine lange Bemerkung auf etwa 60 Zeichen und nennt eine geleerte (R4-K4)", () => {
    const b1 = bogen("Weinsberg", 3);
    const b2 = structuredClone(b1);
    b2.sonstiges = "Ölsperre gerissen, 300 m Sperre nachfordern, außerdem Stiefel Größe 44 und Handschuhe";
    const a = eintrag("w1", b1, { einheitSchluessel: "w", empfangenAm: 1 });
    const b = eintrag("w2", b2, { einheitSchluessel: "w", empfangenAm: 2 });
    const kurz = folgeAenderung(b, [a, b])!.kurz;
    expect(kurz).toMatch(/^Bemerkung: „Ölsperre gerissen, 300 m Sperre nachfordern, außerdem Stief …“$/);
    expect(kurz.length).toBeLessThan(90);
    const c = eintrag("w3", b1, { einheitSchluessel: "w", empfangenAm: 3 });
    expect(folgeAenderung(c, [a, b, c])!.kurz).toBe("Bemerkung: entfernt");
  });

  it("ist keine Folgemeldung: Erstmeldung und Rest-Fassung nach Aufteilen", () => {
    expect(folgeAenderung(erst, [erst])).toBeNull();
    const rest = eintrag("c3", bogen("Crailsheim", 8), { einheitSchluessel: "crailsheim", empfangenAm: 5000, quelle: "aufteilung" });
    expect(folgeAenderung(rest, [erst, rest])).toBeNull();
  });

  it("gilt 30 Minuten nach dem Eingang als frisch", () => {
    expect(frischGemeldet(eintrag("x", bogen("A", 1), { empfangenAm: 1_000_000 }), 1_000_000 + 29 * 60_000)).toBe(true);
    expect(frischGemeldet(eintrag("x", bogen("A", 1), { empfangenAm: 1_000_000 }), 1_000_000 + 31 * 60_000)).toBe(false);
  });
});

describe("letzteMeldung (Audit Runde 3, R3-K5)", () => {
  it("nimmt den jüngsten Eingang, ohne hier entstandene Fassungen", () => {
    expect(letzteMeldung([])).toBeNull();
    const a = eintrag("a", bogen("A", 1), { empfangenAm: 1000 });
    const b = eintrag("b", bogen("B", 1), { empfangenAm: 3000, eingetroffenAm: 10 });
    const rest = eintrag("c", bogen("B", 1), { empfangenAm: 9000, quelle: "aufteilung" });
    expect(letzteMeldung([a, b, rest])).toBe(3000);
  });
});

describe("Lücken mit Inhalt statt Zahl (Audit Runde 3, R3-K7)", () => {
  it("nennt beim Sitzplatz-Hinweis die fehlenden Plätze", () => {
    const t =
      "Sitzplätze: 15 in den erfassten Fahrzeugen für 19 Personen — 4 brauchen eine andere Mitfahrgelegenheit (Richtwerte je Fahrzeugtyp, soweit am Fahrzeug nichts anderes eingetragen ist).";
    expect(lueckeKurz(t)).toBe("Sitzplätze fehlen: 4");
  });

  it("fasst mehrere Punkte als ersten Punkt plus Anzahl zusammen", () => {
    expect(lueckenText([])).toBe("");
    expect(lueckenText(["Stärke ist 0."])).toBe("Stärke 0");
    expect(lueckenText(["Stärke ist 0.", "Ort/Auftrag ist noch leer.", "x"])).toBe("Stärke 0 + 2 weitere");
  });

  it("gibt den häufigen Prüfpunkten Stichworte statt eines abgeschnittenen Satzanfangs (R4-K3)", () => {
    expect(lueckeKurz("Verpflegung für 12 Personen angefordert, die Gesamtstärke ist aber 8.")).toBe("Verpflegung 12 ≠ Stärke 8");
    expect(lueckeKurz("Alle 4 Personen stehen auf Geschlecht „männlich“ — das ist die Vorbelegung. Bitte prüfen (zählt für Unterbringung und WC/Dusche).")).toBe(
      "alle als „männlich“ (Vorbelegung)",
    );
    expect(lueckeKurz("Kennzeichen THW-1234 steht mehrfach in der Fahrzeugliste — stimmt das?")).toBe("Kennzeichen doppelt");
    expect(lueckeKurz("Stärke: 5 + 1 + 2 ergibt nicht die Gesamtstärke 9.")).toBe("F+U+M ≠ Gesamt");
    expect(lueckenAlle(["Stärke ist 0.", "Ort/Auftrag ist noch leer.", "Fahrzeug 2 hat noch kein Kennzeichen."])).toBe(
      "Stärke 0; Ort/Auftrag leer; Kennzeichen fehlt",
    );
  });

  it("kürzt unbekannte lange Texte", () => {
    const k = lueckeKurz("Ein sehr langer Hinweis ohne Doppelpunkt und ohne Gedankenstrich am Anfang");
    expect(k.length).toBeLessThanOrEqual(32);
    expect(k.endsWith("…")).toBe(true);
  });
});
