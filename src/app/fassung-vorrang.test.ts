/**
 * Welche Fassung einer Einheit gilt (Audit Runde 4, R4-W1).
 *
 * Geprüft wird die Schicht über der Kern-Regel „jüngster Stand im Bogen":
 * Ein nachgereichter Bogen mit älterem Stand kann die Schnellerfassung
 * ersetzen, zwei Fassungen derselben Minute fragen nach, eine spätere
 * Folgemeldung löst die bestätigte Fassung wieder normal ab, und
 * „Rückgängig" stellt den alten Stand her.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { OrganisationsTyp, PersonalErfassung, SCHEMA_VERSION, type Erfassungsbogen } from "@bos/eeb-format/model";
import { EinsatzArt, einsaetzeLaden, einsatzAnlegen, meldungHinzufuegen, speicherhuelleSetzen, type MeldeEintrag } from "@bos/meldekopf/einsaetze";
import {
  fassungGiltSetzen,
  fassungPruefen,
  fassungenJeEinheit,
  geltendeJeEinheit,
  istVerdraengt,
  nachgereichterBogen,
  vorrangZuruecknehmen,
} from "./fassung-vorrang";
import { notizSetzen, zugSetzen } from "./eintrag-zeiten";

class MemStorage {
  private m = new Map<string, string>();
  get length() { return this.m.size; }
  clear() { this.m.clear(); }
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
}

beforeEach(() => {
  const mem = new MemStorage();
  (globalThis as { localStorage?: Storage }).localStorage = mem as unknown as Storage;
  speicherhuelleSetzen(mem as unknown as Storage);
});

function bogen(stand: number, gesamt: number, fahrzeuge = 0): Erfassungsbogen {
  return {
    schemaVersion: SCHEMA_VERSION,
    stand,
    einheit: { organisation: OrganisationsTyp.THW, einheitsTyp: { code: 1 }, hierarchie: [{ bezeichnung: { code: 1 }, name: "Bamberg" }] },
    einsatz: { zeitraumVon: 100, zeitraumBis: 130, ortAuftrag: "Lage" },
    personalErfassung: PersonalErfassung.NUR_STAERKE,
    staerkeManuell: { fuehrer: 0, unterfuehrer: 1, mannschaft: gesamt - 1, gesamt },
    personal: [],
    fahrzeuge: Array.from({ length: fahrzeuge }, () => ({ typ: { code: 1 }, kennzeichen: "", sitzplaetze: 3 }) as never),
  };
}

function eintraege(id: string): MeldeEintrag[] {
  return einsaetzeLaden().find((s) => s.id === id)!.eintraege;
}

function gesamt(e: MeldeEintrag | undefined): number | undefined {
  return e?.bogen.staerkeManuell?.gesamt;
}

/** Schnellerfassung 20:55 (12, manuell), danach der Bogen der Einheit 18:55 (11, aus Datei). */
function schnellUndBogen() {
  const s = einsatzAnlegen("Hochwasser Eyach", EinsatzArt.EINSATZ);
  const schnell = meldungHinzufuegen(s.id, bogen(2000, 12), { quelle: "manuell" })!.eintrag;
  const vorher = eintraege(s.id).map((e) => ({ ...e }));
  const echt = meldungHinzufuegen(s.id, bogen(1880, 11, 4), { quelle: "pdf-import" })!.eintrag;
  return { id: s.id, schnell, echt, vorher };
}

describe("fassungPruefen", () => {
  it("erkennt den nachgereichten Bogen hinter der Schnellerfassung", () => {
    const { id, echt, vorher } = schnellUndBogen();
    const p = fassungPruefen(vorher, eintraege(id), echt.id);
    expect(p?.lage).toBe("ersetzt-platzhalter");
    // Ohne Entscheidung gilt nach der Kern-Regel weiter die Schnellerfassung.
    expect(gesamt(geltendeJeEinheit(eintraege(id))[0])).toBe(12);
  });

  it("fragt bei zwei verschiedenen Fassungen derselben Minute", () => {
    const s = einsatzAnlegen("Lage", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogen(2000, 4), { quelle: "pdf-import" });
    const vorher = eintraege(s.id).map((e) => ({ ...e }));
    const alt = meldungHinzufuegen(s.id, bogen(2000, 3), { quelle: "pdf-import" })!.eintrag;
    expect(fassungPruefen(vorher, eintraege(s.id), alt.id)?.lage).toBe("gleiche-minute");
  });

  it("nennt einen älteren Bogen nach einem jüngeren, ohne dass er gilt", () => {
    const s = einsatzAnlegen("Lage", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogen(2041, 4), { quelle: "scan" });
    const vorher = eintraege(s.id).map((e) => ({ ...e }));
    const alt = meldungHinzufuegen(s.id, bogen(2038, 3), { quelle: "pdf-import" })!.eintrag;
    expect(fassungPruefen(vorher, eintraege(s.id), alt.id)?.lage).toBe("aelter");
    expect(gesamt(geltendeJeEinheit(eintraege(s.id))[0])).toBe(4);
  });

  it("lässt eine gewöhnliche Folgemeldung in Ruhe", () => {
    const s = einsatzAnlegen("Lage", EinsatzArt.EINSATZ);
    meldungHinzufuegen(s.id, bogen(2000, 4), { quelle: "scan" });
    const vorher = eintraege(s.id).map((e) => ({ ...e }));
    const neu = meldungHinzufuegen(s.id, bogen(2010, 5), { quelle: "scan" })!.eintrag;
    expect(fassungPruefen(vorher, eintraege(s.id), neu.id)).toBeNull();
  });
});

describe("fassungGiltSetzen", () => {
  it("lässt den Bogen der Einheit gelten — Zug und Auftrag der Schnellerfassung bleiben", () => {
    const { id, schnell, echt } = schnellUndBogen();
    zugSetzen(id, schnell.einheitSchluessel, schnell.id, "1. Zug");
    notizSetzen(id, schnell.id, "Deich Nord");
    expect(nachgereichterBogen(geltendeJeEinheit(eintraege(id))[0]!, fassungenJeEinheit(eintraege(id), schnell.einheitSchluessel))?.id).toBe(echt.id);

    const a = fassungGiltSetzen(id, echt.id, 9_000)!;
    expect(a).not.toBeNull();
    const kopf = geltendeJeEinheit(eintraege(id))[0]!;
    expect(kopf.id).toBe(echt.id);
    expect(gesamt(kopf)).toBe(11);
    expect(kopf.bogen.fahrzeuge).toHaveLength(4);
    expect(kopf.zugEtikett).toBe("1. Zug");
    expect(kopf.notiz).toBe("Deich Nord");
    // Die Historie behält beide, die Schnellerfassung als ersetzt.
    const revs = fassungenJeEinheit(eintraege(id), schnell.einheitSchluessel);
    expect(revs.map((r) => r.id)).toEqual([echt.id, schnell.id]);
    expect(istVerdraengt(revs[1]!, revs)).toBe(true);
    expect(nachgereichterBogen(kopf, revs)).toBeNull();

    vorrangZuruecknehmen(a);
    expect(geltendeJeEinheit(eintraege(id))[0]!.id).toBe(schnell.id);
  });

  it("eine spätere Folgemeldung der Einheit löst die bestätigte Fassung normal ab", () => {
    const { id, echt } = schnellUndBogen();
    fassungGiltSetzen(id, echt.id);
    const folge = meldungHinzufuegen(id, bogen(2100, 10, 4), { quelle: "scan" })!.eintrag;
    expect(geltendeJeEinheit(eintraege(id))[0]!.id).toBe(folge.id);
  });

  it("gilt nicht mehr, wenn die bestätigte Fassung fehlt (verworfen)", () => {
    const { id, schnell, echt } = schnellUndBogen();
    fassungGiltSetzen(id, echt.id);
    const ohne = eintraege(id).filter((e) => e.id !== echt.id);
    expect(geltendeJeEinheit(ohne)[0]!.id).toBe(schnell.id);
  });

  it("gleiche Minute: die bestätigte Fassung gilt in beiden Reihenfolgen des Einlesens", () => {
    for (const reihenfolge of [[4, 3], [3, 4]] as const) {
      const s = einsatzAnlegen(`Lage ${reihenfolge.join()}`, EinsatzArt.EINSATZ);
      const ids = reihenfolge.map((n) => meldungHinzufuegen(s.id, bogen(2000, n), { quelle: "pdf-import" })!.eintrag);
      const vier = ids.find((e) => gesamt(e) === 4)!;
      fassungGiltSetzen(s.id, vier.id);
      expect(gesamt(geltendeJeEinheit(eintraege(s.id))[0])).toBe(4);
    }
  });
});
