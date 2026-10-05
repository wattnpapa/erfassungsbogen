/**
 * Zeiten und Notizen am Meldeeintrag (App-Erweiterung des Kerns).
 *
 * Geprüft wird, worauf sich Einsatztagebuch und Ablösung verlassen: dass
 * „Abrücken" den Zeitpunkt festhält und „wieder anwesend" ihn zurücknimmt,
 * dass eine Folgemeldung die Eintreffzeit und den Auftrag ihrer Vorgängerin
 * erbt (sonst stünde jede Folgemeldung als frisch eingetroffen da), und dass
 * ein voller Speicher als benannter Fehler ankommt statt als stille Ausnahme.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  OrganisationsTyp,
  PersonalErfassung,
  SCHEMA_VERSION,
  zeitpunktAusIso,
  type Erfassungsbogen,
} from "@bos/eeb-format/model";
import {
  EinsatzArt,
  MeldeStatus,
  einsaetzeLaden,
  einheitZugEtikettSetzen,
  einsatzAnlegen,
  meldungHinzufuegen,
  speicherhuelleSetzen,
} from "@bos/meldekopf/einsaetze";
import {
  zeitUnstimmigkeit,
  zeitpunktZuMs,
  SpeicherVollFehler,
  abrueckzeitSetzen,
  eintragGespeichert,
  eintreffzeit,
  eintreffzeitSetzen,
  einheitEntfernen,
  einheitVerschieben,
  folgemeldungErbt,
  istSpeicherVoll,
  meldungAufnehmen,
  notizSetzen,
  sammlungenSchreiben,
  statusMitZeitSetzen,
  zeitKurz,
  zeitLang,
  zugSetzen,
  HERKUNFT_TEXT,
  speicherVollMeldung,
  speicherGroessteSammlungen,
  SPEICHER_GRENZE_ZEICHEN,
} from "./eintrag-zeiten";

class MemStorage {
  private m = new Map<string, string>();
  /** Wirft beim Schreiben wie ein voller Browser-Speicher. */
  voll = false;
  get length() { return this.m.size; }
  clear() { this.m.clear(); }
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) {
    if (this.voll) {
      const e = new Error("The quota has been exceeded.");
      e.name = "QuotaExceededError";
      throw e;
    }
    this.m.set(k, String(v));
  }
  removeItem(k: string) { this.m.delete(k); }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
}

let mem: MemStorage;

beforeEach(() => {
  mem = new MemStorage();
  (globalThis as { localStorage?: Storage }).localStorage = mem as unknown as Storage;
  // Die Einsatz-Sammlung bekommt ihre Ablage hineingereicht (ADR-003).
  speicherhuelleSetzen(mem as unknown as Storage);
});

function bogen(name: string, stand = 100): Erfassungsbogen {
  return {
    schemaVersion: SCHEMA_VERSION,
    stand,
    einheit: { organisation: OrganisationsTyp.THW, einheitsTyp: { code: 1 }, hierarchie: [{ bezeichnung: { code: 1 }, name }] },
    einsatz: { zeitraumVon: 100, zeitraumBis: 130, ortAuftrag: "Lage" },
    personalErfassung: PersonalErfassung.NUR_STAERKE,
    staerkeManuell: { fuehrer: 1, unterfuehrer: 0, mannschaft: 3, gesamt: 4 },
    personal: [],
    fahrzeuge: [],
  };
}

/** Einsatz mit einer Meldung; liefert Einsatz-Id und Eintrag-Id. */
function buehne() {
  const s = einsatzAnlegen("Hochwasser", EinsatzArt.EINSATZ);
  const r = meldungHinzufuegen(s.id, bogen("Crailsheim"))!;
  return { einsatzId: s.id, eintragId: r.eintrag.id };
}

function eintrag(einsatzId: string, eintragId: string) {
  return einsaetzeLaden().find((s) => s.id === einsatzId)!.eintraege.find((e) => e.id === eintragId)!;
}

describe("statusMitZeitSetzen", () => {
  it("hält beim Abrücken den Zeitpunkt fest und nimmt ihn bei „wieder anwesend“ zurück", () => {
    const { einsatzId, eintragId } = buehne();
    statusMitZeitSetzen(einsatzId, eintragId, MeldeStatus.ABGERUECKT, 5000);
    let e = eintrag(einsatzId, eintragId);
    expect(e.status).toBe(MeldeStatus.ABGERUECKT);
    expect(e.abgerueckAm).toBe(5000);

    statusMitZeitSetzen(einsatzId, eintragId, MeldeStatus.ANWESEND);
    e = eintrag(einsatzId, eintragId);
    expect(e.status).toBe(MeldeStatus.ANWESEND);
    expect(e.abgerueckAm).toBeUndefined();
  });

  it("setzt die Änderungszeit der Sammlung — die Aufräumfrist zählt neu", () => {
    const { einsatzId, eintragId } = buehne();
    const vorher = einsaetzeLaden().find((s) => s.id === einsatzId)!.geaendert;
    statusMitZeitSetzen(einsatzId, eintragId, MeldeStatus.ABGERUECKT, vorher + 10_000);
    expect(einsaetzeLaden().find((s) => s.id === einsatzId)!.geaendert).toBeGreaterThanOrEqual(vorher);
  });

  it("tut nichts bei unbekannter Meldung", () => {
    const { einsatzId } = buehne();
    expect(() => statusMitZeitSetzen(einsatzId, "gibt-es-nicht", MeldeStatus.ABGERUECKT)).not.toThrow();
  });
});

describe("Eintreffzeit, Abrückzeit, Notiz", () => {
  it("gilt ohne Korrektur als Empfangszeit und lässt sich nachtragen", () => {
    const { einsatzId, eintragId } = buehne();
    const e = eintrag(einsatzId, eintragId);
    expect(eintreffzeit(e)).toBe(e.empfangenAm);

    eintreffzeitSetzen(einsatzId, eintragId, 4242);
    expect(eintreffzeit(eintrag(einsatzId, eintragId))).toBe(4242);
    // Der Empfangsmoment bleibt als Spur erhalten.
    expect(eintrag(einsatzId, eintragId).empfangenAm).toBe(e.empfangenAm);
  });

  it("korrigiert die Abrückzeit", () => {
    const { einsatzId, eintragId } = buehne();
    statusMitZeitSetzen(einsatzId, eintragId, MeldeStatus.ABGERUECKT, 5000);
    abrueckzeitSetzen(einsatzId, eintragId, 4000);
    expect(eintrag(einsatzId, eintragId).abgerueckAm).toBe(4000);
  });

  it("speichert die Notiz getrimmt und entfernt sie bei leerem Text", () => {
    const { einsatzId, eintragId } = buehne();
    notizSetzen(einsatzId, eintragId, "  Deichabschnitt Nord ab 14:00 ");
    expect(eintrag(einsatzId, eintragId).notiz).toBe("Deichabschnitt Nord ab 14:00");
    notizSetzen(einsatzId, eintragId, "   ");
    expect(eintrag(einsatzId, eintragId).notiz).toBeUndefined();
  });
});

describe("folgemeldungErbt", () => {
  it("übernimmt Eintreffzeit und Notiz der Vorgängerin derselben Einheit", () => {
    const { einsatzId, eintragId } = buehne();
    eintreffzeitSetzen(einsatzId, eintragId, 4242);
    notizSetzen(einsatzId, eintragId, "Deichabschnitt Nord");

    // Folgemeldung: gleicher Einheitsschlüssel, neuerer Stand.
    const r = meldungHinzufuegen(einsatzId, bogen("Crailsheim", 200))!;
    expect(r.neu).toBe(true);
    expect(r.eintrag.id).not.toBe(eintragId);
    folgemeldungErbt(einsatzId, r.eintrag.id);

    const folge = eintrag(einsatzId, r.eintrag.id);
    expect(folge.eingetroffenAm).toBe(4242);
    expect(folge.notiz).toBe("Deichabschnitt Nord");
  });

  it("überschreibt nichts, was die Folgemeldung schon trägt, und schweigt ohne Vorgängerin", () => {
    const { einsatzId, eintragId } = buehne();
    // Erstmeldung: keine Vorgängerin — nichts passiert, nichts wirft.
    folgemeldungErbt(einsatzId, eintragId);
    expect(eintrag(einsatzId, eintragId).eingetroffenAm).toBeUndefined();

    notizSetzen(einsatzId, eintragId, "alt");
    const r = meldungHinzufuegen(einsatzId, bogen("Crailsheim", 200))!;
    notizSetzen(einsatzId, r.eintrag.id, "neu");
    eintreffzeitSetzen(einsatzId, r.eintrag.id, 9);
    folgemeldungErbt(einsatzId, r.eintrag.id);
    expect(eintrag(einsatzId, r.eintrag.id).notiz).toBe("neu");
    expect(eintrag(einsatzId, r.eintrag.id).eingetroffenAm).toBe(9);
  });
});

describe("meldungAufnehmen (R2-K1)", () => {
  it("lässt die Folgemeldung Zug, Auftrag und Eintreffzeit der Führungsstelle behalten", () => {
    const { einsatzId, eintragId } = buehne();
    const schl = eintrag(einsatzId, eintragId).einheitSchluessel;
    eintreffzeitSetzen(einsatzId, eintragId, 4242);
    notizSetzen(einsatzId, eintragId, "Ortung Trümmerkegel B");
    einheitZugEtikettSetzen(einsatzId, schl, "1. TZ");

    const r = meldungAufnehmen(einsatzId, bogen("Crailsheim", 200), { quelle: "pdf-import" })!;
    expect(r.neu).toBe(true);
    const folge = eintrag(einsatzId, r.eintrag.id);
    expect(folge.zugEtikett).toBe("1. TZ");
    expect(folge.notiz).toBe("Ortung Trümmerkegel B");
    expect(folge.eingetroffenAm).toBe(4242);

    // Auch die dritte Fassung erbt — über die zweite hinweg.
    const r3 = meldungAufnehmen(einsatzId, bogen("Crailsheim", 300), { quelle: "manuell" })!;
    const dritte = eintrag(einsatzId, r3.eintrag.id);
    expect(dritte.zugEtikett).toBe("1. TZ");
    expect(dritte.notiz).toBe("Ortung Trümmerkegel B");
    expect(dritte.eingetroffenAm).toBe(4242);
  });

  it("fasst eine Dublette nicht an und lässt Erstmeldungen ohne Erbe", () => {
    const { einsatzId, eintragId } = buehne();
    notizSetzen(einsatzId, eintragId, "Auftrag");
    const gleich = meldungAufnehmen(einsatzId, bogen("Crailsheim"))!;
    expect(gleich.neu).toBe(false);
    expect(gleich.eintrag.id).toBe(eintragId);

    const fremd = meldungAufnehmen(einsatzId, bogen("Aalen"))!;
    expect(fremd.neu).toBe(true);
    const e = eintrag(einsatzId, fremd.eintrag.id);
    expect(e.notiz).toBeUndefined();
    expect(e.zugEtikett).toBeUndefined();
  });
});

describe("Speicher voll", () => {
  it("meldet einen vollen Speicher als SpeicherVollFehler", () => {
    const { einsatzId, eintragId } = buehne();
    mem.voll = true;
    expect(() => sammlungenSchreiben(einsaetzeLaden())).toThrow(SpeicherVollFehler);
    expect(() => statusMitZeitSetzen(einsatzId, eintragId, MeldeStatus.ABGERUECKT)).toThrow(SpeicherVollFehler);
    // Der Speicher ist die Wahrheit, nicht der Aufruf: die Meldung steht noch.
    expect(eintragGespeichert(einsatzId, eintragId)).toBe(true);
    expect(eintrag(einsatzId, eintragId).status).toBe(MeldeStatus.ANWESEND);
  });

  it("erkennt die verschiedenen Namen des vollen Speichers", () => {
    expect(istSpeicherVoll(Object.assign(new Error("x"), { name: "QuotaExceededError" }))).toBe(true);
    expect(istSpeicherVoll(Object.assign(new Error("x"), { name: "NS_ERROR_DOM_QUOTA_REACHED", code: 22 }))).toBe(true);
    expect(istSpeicherVoll(new Error("Netz weg"))).toBe(false);
    expect(istSpeicherVoll("kein Fehlerobjekt")).toBe(false);
  });

  it("reicht andere Fehler unverändert durch", () => {
    speicherhuelleSetzen({
      ...mem,
      setItem: () => {
        throw new Error("Platte kaputt");
      },
      getItem: (k: string) => mem.getItem(k),
    } as unknown as Storage);
    expect(() => sammlungenSchreiben([])).toThrow("Platte kaputt");
  });
});

describe("zeitKurz / zeitLang", () => {
  it("zeigt am selben Tag nur die Uhrzeit, sonst Tag und Monat dazu", () => {
    const jetzt = new Date("2026-09-27T20:19").getTime();
    expect(zeitKurz(new Date("2026-09-27T09:40").getTime(), jetzt)).toBe("09:40");
    expect(zeitKurz(new Date("2026-09-26T23:05").getTime(), jetzt)).toBe("26.09., 23:05");
  });

  it("schreibt Datum und Uhrzeit aus", () => {
    expect(zeitLang(new Date("2026-09-27T20:19").getTime())).toBe("27.09.2026, 20:19");
  });
});

describe("einheitVerschieben", () => {
  it("nimmt alle Fassungen einer Einheit samt Notiz mit und verdoppelt nichts", () => {
    const a = einsatzAnlegen("A", EinsatzArt.EINSATZ);
    const b = einsatzAnlegen("B", EinsatzArt.EINSATZ);
    const b0 = bogen("Wanderhausen");
    const r1 = meldungHinzufuegen(a.id, b0)!;
    meldungHinzufuegen(a.id, { ...b0, stand: 101, sonstiges: "zweite Fassung" });
    notizSetzen(a.id, r1.eintrag.id, "Deich Nord");

    const n = einheitVerschieben(a.id, b.id, r1.eintrag.einheitSchluessel);

    expect(n).toBe(2);
    const nachA = einsaetzeLaden().find((s) => s.id === a.id)!;
    const nachB = einsaetzeLaden().find((s) => s.id === b.id)!;
    expect(nachA.eintraege).toHaveLength(0);
    expect(nachB.eintraege).toHaveLength(2);
    expect(nachB.eintraege.find((e) => e.id === r1.eintrag.id)!.notiz).toBe("Deich Nord");
  });

  it("tut nichts, wenn Ziel und Quelle gleich sind", () => {
    const a = einsatzAnlegen("A", EinsatzArt.EINSATZ);
    const r = meldungHinzufuegen(a.id, bogen("Bleibhausen"))!;
    expect(einheitVerschieben(a.id, a.id, r.eintrag.einheitSchluessel)).toBe(0);
    expect(einsaetzeLaden()[0]!.eintraege).toHaveLength(1);
  });
});

describe("einheitEntfernen (Audit Runde 2, R2-D1)", () => {
  it("nimmt alle Fassungen einer Einheit heraus, lässt Teile mit eigenem Schlüssel stehen und liefert die Einträge unverändert", () => {
    const a = einsatzAnlegen("A", EinsatzArt.EINSATZ);
    const b0 = bogen("Wanderhausen");
    const r1 = meldungHinzufuegen(a.id, b0)!;
    meldungHinzufuegen(a.id, { ...b0, stand: 101, sonstiges: "zweite Fassung" });
    notizSetzen(a.id, r1.eintrag.id, "Deich Nord");
    const schl = r1.eintrag.einheitSchluessel;
    const teil = meldungHinzufuegen(a.id, { ...b0, sonstiges: "Fachberater" }, { einheitSchluesselOverride: `${schl}|teil:1` })!;
    const andere = meldungHinzufuegen(a.id, bogen("Bleibhausen"))!;

    const weg = einheitEntfernen(a.id, schl);

    expect(weg).toHaveLength(2);
    expect(weg.find((e) => e.id === r1.eintrag.id)!.notiz).toBe("Deich Nord");
    const rest = einsaetzeLaden().find((s) => s.id === a.id)!.eintraege.map((e) => e.id).sort();
    expect(rest).toEqual([teil.eintrag.id, andere.eintrag.id].sort());
  });

  it("liefert nichts und schreibt nichts bei unbekanntem Schlüssel", () => {
    const a = einsatzAnlegen("A", EinsatzArt.EINSATZ);
    meldungHinzufuegen(a.id, bogen("Bleibhausen"));
    expect(einheitEntfernen(a.id, "gibt-es-nicht")).toEqual([]);
    expect(einheitEntfernen("kein-einsatz", "x")).toEqual([]);
    expect(einsaetzeLaden()[0]!.eintraege).toHaveLength(1);
  });
});

describe("zeitpunktZuMs (R2-N4)", () => {
  it("liest den Bogen-Zeitpunkt als lokale Wandzeit dieses Geräts", () => {
    expect(zeitpunktZuMs(zeitpunktAusIso("2026-09-28T14:42"))).toBe(new Date("2026-09-28T14:42").getTime());
    expect(zeitpunktZuMs(zeitpunktAusIso("2026-01-02T00:05"))).toBe(new Date("2026-01-02T00:05").getTime());
  });
});

describe("Vermerke der Führungsstelle (Audit Runde 2, R2-K6)", () => {
  it("hält Zug, Auftrag, Zeitkorrektur und Abrücken mit Uhrzeit fest", () => {
    const { einsatzId, eintragId } = buehne();
    const schl = eintrag(einsatzId, eintragId).einheitSchluessel;
    zugSetzen(einsatzId, schl, eintragId, "1. TZ");
    notizSetzen(einsatzId, eintragId, "Einspeisung Pumpwerk Süd");
    notizSetzen(einsatzId, eintragId, "Pumpwerk Nord");
    eintreffzeitSetzen(einsatzId, eintragId, new Date("2026-09-28T15:40").getTime());
    statusMitZeitSetzen(einsatzId, eintragId, MeldeStatus.ABGERUECKT, new Date("2026-09-28T18:00").getTime());
    const v = eintrag(einsatzId, eintragId).vermerke!;
    expect(v.map((x) => x.text)).toEqual([
      "Zug: 1. TZ",
      "Auftrag/Notiz: Einspeisung Pumpwerk Süd",
      "Auftrag/Notiz geändert: Pumpwerk Nord (war: Einspeisung Pumpwerk Süd)",
      expect.stringMatching(/^Eintreffzeit korrigiert: .* → 28\.09\.2026, 15:40$/),
      "Abgerückt",
    ]);
    expect(v.every((x) => typeof x.zeit === "number" && x.zeit > 0)).toBe(true);
    expect(eintrag(einsatzId, eintragId).zugEtikett).toBe("1. TZ");
  });

  it("vermerkt nichts, wenn sich nichts ändert", () => {
    const { einsatzId, eintragId } = buehne();
    notizSetzen(einsatzId, eintragId, "");
    zugSetzen(einsatzId, eintrag(einsatzId, eintragId).einheitSchluessel, eintragId, "");
    expect(eintrag(einsatzId, eintragId).vermerke).toBeUndefined();
  });

  it("gibt den Verlauf an die Folgemeldung weiter", () => {
    const { einsatzId, eintragId } = buehne();
    notizSetzen(einsatzId, eintragId, "Deich Nord");
    const r = meldungAufnehmen(einsatzId, bogen("Crailsheim", 200))!;
    expect(r.eintrag.id).not.toBe(eintragId);
    expect(eintrag(einsatzId, r.eintrag.id).vermerke!.map((x) => x.text)).toEqual(["Auftrag/Notiz: Deich Nord"]);
  });

  it("nennt die Herkunft überall gleich", () => {
    expect(HERKUNFT_TEXT["pdf-import"]).toBe("Aus Datei");
    expect(HERKUNFT_TEXT.scan).toBe("Empfangen");
  });
});

describe("speicherVollMeldung (R3-O1)", () => {
  it("nennt Zahl und Ursache und ist bei 0 leer", () => {
    expect(speicherVollMeldung(0)).toBe("");
    expect(speicherVollMeldung(1)).toMatch(/^Nicht aufgenommen: 1 Bogen — der Speicher dieses Geräts ist voll/);
    expect(speicherVollMeldung(9)).toMatch(/9 Bögen/);
    expect(speicherVollMeldung(9)).not.toMatch(/Keine Bögen/);
  });
});

describe("speicherGroessteSammlungen (R3-O4)", () => {
  it("nennt keine Sammlung über 100 %, auch wenn der Browser mehr als die Grenze zulässt", () => {
    const s = einsatzAnlegen("Großschadenslage Archiv", EinsatzArt.EINSATZ);
    const b = bogen("x".repeat(Math.floor(SPEICHER_GRENZE_ZEICHEN * 1.05)));
    meldungHinzufuegen(s.id, b);
    const [groesste] = speicherGroessteSammlungen(1);
    expect(groesste!.name).toBe("Großschadenslage Archiv");
    expect(groesste!.anteil).toBeLessThanOrEqual(1);
    expect(groesste!.anteil).toBeGreaterThan(0.95);
  });
});

describe("zeitUnstimmigkeit (R3-E5)", () => {
  const jetzt = new Date("2026-10-04T20:39").getTime();
  it("meldet Zeiten mehr als 15 Minuten in der Zukunft", () => {
    expect(zeitUnstimmigkeit({ eintreffen: new Date("2026-10-14T18:22").getTime() }, jetzt)).toMatch(/^Eingetroffen 14\.10\.2026, 18:22 liegt in der Zukunft/);
    expect(zeitUnstimmigkeit({ eintreffen: jetzt + 10 * 60_000 }, jetzt)).toBeNull();
  });
  it("meldet Abrücken vor dem Eintreffen", () => {
    expect(zeitUnstimmigkeit({ eintreffen: jetzt - 60_000, abgerueckt: jetzt - 3_600_000 }, jetzt)).toMatch(/liegt vor dem Eintreffen/);
    expect(zeitUnstimmigkeit({ eintreffen: jetzt - 3_600_000, abgerueckt: jetzt }, jetzt)).toBeNull();
  });
});
