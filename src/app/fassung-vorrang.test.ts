/**
 * Welche Fassung einer Einheit gilt (Audit Runde 4, R4-W1).
 *
 * Geprüft wird die Schicht über der Kern-Regel „jüngster Stand im Bogen":
 * Ein nachgereichter Bogen mit älterem Stand kann die Schnellerfassung
 * ersetzen, zwei Fassungen derselben Minute fragen nach, eine spätere
 * Folgemeldung löst die bestätigte Fassung wieder normal ab, und
 * „Rückgängig" stellt den alten Stand her.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { OrganisationsTyp, PersonalErfassung, SCHEMA_VERSION, type Erfassungsbogen } from "@bos/eeb-format/model";
import { EinsatzArt, einsaetzeLaden, einsatzAnlegen, meldungHinzufuegen, speicherhuelleSetzen, type MeldeEintrag } from "@bos/meldekopf/einsaetze";
import { fassungGiltSetzen, geltendeJeEinheit } from "./fassung-vorrang";

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
  vi.useFakeTimers({ toFake: ["Date"] });
  const mem = new MemStorage();
  (globalThis as { localStorage?: Storage }).localStorage = mem as unknown as Storage;
  speicherhuelleSetzen(mem as unknown as Storage);
});

afterEach(() => vi.useRealTimers());

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

describe("fassungGiltSetzen", () => {

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
