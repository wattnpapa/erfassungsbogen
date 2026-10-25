/**
 * Unlesbare Einträge werden gezählt und beiseitegelegt statt still verschluckt
 * (Audit Runde 7, R7-N3, R7-E2).
 */
import { beforeEach, describe, expect, it } from "vitest";
import { neuerBogen } from "./hilfen";
import {
  UNLESBAR_SCHLUESSEL,
  sammlungenRetteZuruecksetzen,
  sammlungenRetten,
  unlesbarerGesamttext,
  unlesbareSammlungsteile,
  unlesbareVorlagenteile,
  unlesbarBestand,
  unlesbarVerwerfen,
  unlesbarZahlen,
  unlesbaresBeiseitelegen,
} from "./unlesbar";

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
  Object.defineProperty(globalThis, "localStorage", { value: new MemStorage(), configurable: true, writable: true });
});

const gut = () => ({ id: "e1", bogen: neuerBogen() });

describe("unlesbareSammlungsteile", () => {
  it("findet Sammlungen ohne Kennung oder Eintragsliste und Meldungen ohne Bogen — und lässt Lesbares aus", () => {
    const text = JSON.stringify([
      { id: "s1", name: "Hochwasser", eintraege: [gut(), { id: "x" }, { id: "y", bogen: { personal: "kein Array" } }, null] },
      { id: "s2", name: "Ohne Liste", eintraege: null },
      { name: "Ohne Kennung", eintraege: [] },
    ]);
    const teile = unlesbareSammlungsteile(text);
    expect(teile.sammlungen).toHaveLength(2);
    expect(teile.meldungen.map((m) => m.sammlungId)).toEqual(["s1", "s1", "s1"]);
    expect(teile.meldungen[0]!.sammlungName).toBe("Hochwasser");
  });

  it("zählt nichts bei einem sauberen Bestand und bei Unlesbarem im Ganzen", () => {
    expect(unlesbareSammlungsteile(JSON.stringify([{ id: "s", eintraege: [gut()] }]))).toEqual({ sammlungen: [], meldungen: [] });
    expect(unlesbareSammlungsteile("{kaputt")).toEqual({ sammlungen: [], meldungen: [] });
    expect(unlesbareSammlungsteile(null)).toEqual({ sammlungen: [], meldungen: [] });
  });
});

describe("unlesbareVorlagenteile", () => {
  it("nennt Vorlagen ohne lesbaren Bogen, auch ohne Organisation", () => {
    const ohneOrg = neuerBogen() as unknown as { einheit: { organisation?: number } };
    delete ohneOrg.einheit.organisation;
    const liste = unlesbareVorlagenteile(
      JSON.stringify([{ id: "v1", name: "Gut", bogen: neuerBogen() }, { id: "v2", name: "Ohne Org", bogen: ohneOrg }, { id: "v3" }]),
    );
    expect(liste.map((v) => (v as { id: string }).id)).toEqual(["v2", "v3"]);
  });
});

describe("Beiseitelegen", () => {
  it("legt Unlesbares unverändert ab, ergänzt ohne Doppelte und zählt", () => {
    const teile = unlesbareSammlungsteile(JSON.stringify([{ id: "s2", eintraege: null }]));
    expect(unlesbaresBeiseitelegen(teile)).toBe(true);
    expect(unlesbaresBeiseitelegen(teile)).toBe(false); // schon abgelegt
    expect(unlesbarZahlen()).toEqual({ sammlungen: 1, meldungen: 0, vorlagen: 0, texte: 0, gesamt: 1 });
    expect(unlesbaresBeiseitelegen({ vorlagen: [{ id: "v" }] })).toBe(true);
    expect(unlesbarZahlen().gesamt).toBe(2);
    expect(unlesbarBestand()!.sammlungen[0]).toEqual({ id: "s2", eintraege: null });
  });

  it("fällt nach der Datenschutzfrist von 90 Tagen weg und lässt sich verwerfen", () => {
    localStorage.setItem(
      UNLESBAR_SCHLUESSEL,
      JSON.stringify({ am: Date.now() - 91 * 86_400_000, sammlungen: [{ id: "alt" }], meldungen: [], vorlagen: [] }),
    );
    expect(unlesbarBestand()).toBeNull();
    expect(localStorage.getItem(UNLESBAR_SCHLUESSEL)).toBeNull();
    unlesbaresBeiseitelegen({ vorlagen: [{ id: "v" }] });
    expect(unlesbarBestand()).not.toBeNull();
    unlesbarVerwerfen();
    expect(unlesbarBestand()).toBeNull();
  });
});

describe("Beschädigter Gesamttext (R8-D1)", () => {
  beforeEach(() => sammlungenRetteZuruecksetzen());

  it("erkennt abgebrochenes JSON und Werte, die keine Liste sind", () => {
    expect(unlesbarerGesamttext('[{"id":"s1","eintra', "sammlungen")).toEqual({ art: "sammlungen", text: '[{"id":"s1","eintra' });
    expect(unlesbarerGesamttext("xx", "vorlagen")).toEqual({ art: "vorlagen", text: "xx" });
    expect(unlesbarerGesamttext('{"a":1}', "sammlungen")).not.toBeNull();
  });

  it("lässt Leeres, null und gültige Listen in Ruhe", () => {
    expect(unlesbarerGesamttext(null, "sammlungen")).toBeNull();
    expect(unlesbarerGesamttext("  ", "sammlungen")).toBeNull();
    expect(unlesbarerGesamttext("null", "sammlungen")).toBeNull();
    expect(unlesbarerGesamttext("[]", "sammlungen")).toBeNull();
  });

  it("legt den Rohtext beiseite, bevor ihn der Kern durch [] ersetzt", () => {
    const text = '[{"id":"s1","name":"Hochwasser","eintraege":[{"id":"e1","bogen":{"personal":[{"vorname":"An';
    sammlungenRetten(text);
    expect(unlesbarBestand()?.texte).toEqual([{ art: "sammlungen", text }]);
    expect(unlesbarZahlen().gesamt).toBe(1);
    // Derselbe Text noch einmal: nichts Neues
    sammlungenRetten(text);
    expect(unlesbarBestand()?.texte).toHaveLength(1);
  });
});
