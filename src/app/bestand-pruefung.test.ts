import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { einsaetzeLaden, einsaetzeLesenZuruecksetzen } from "./einsaetze-lesen";
import { speicherhuelleSetzen } from "@bos/meldekopf/einsaetze";
import { vorlagenAusJson } from "./vorlagen";

// Audit Runde 6, R6-E1: Was schon im Speicher liegt, wird beim Lesen wie an den
// Eingängen geprüft — ein Bogen ohne Einheitstyp oder Fahrzeuge legte sonst die
// Startseite lahm.
class MemStorage {
  private m = new Map<string, string>();
  get length() { return this.m.size; }
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
}

const beispiel = () =>
  JSON.parse(readFileSync("examples/thw/ortsverbaende/lv-baden-wuerttemberg/rst-tuebingen/ov-albstadt/ov-albstadt-01-1-tz-ztr-tz.json", "utf8")) as Record<string, any>;

describe("Bestand beim Lesen prüfen (R6-E1)", () => {
  beforeEach(() => {
    (globalThis as { localStorage?: Storage }).localStorage = new MemStorage() as unknown as Storage;
    speicherhuelleSetzen(localStorage);
    einsaetzeLesenZuruecksetzen();
  });

  it("ergänzt eine Vorlage ohne Fahrzeuge und lässt eine unbrauchbare weg", () => {
    const gut = beispiel();
    delete gut.fahrzeuge;
    const kaputt = beispiel();
    delete kaputt.personal;
    const liste = vorlagenAusJson(
      JSON.stringify([
        { id: "a", name: "A", bogen: gut },
        { id: "b", name: "B", bogen: kaputt },
      ]),
    );
    expect(liste.map((v) => v.id)).toEqual(["a"]);
    expect(Array.isArray(liste[0]!.bogen.fahrzeuge)).toBe(true);
  });

  it("ergänzt in einer Sammlung den fehlenden Einheitstyp, statt die Ansicht zu sprengen", () => {
    const b = beispiel();
    delete b.einheit.einheitsTyp;
    delete b.fahrzeuge;
    localStorage.setItem(
      "eeb.einsaetze.v1",
      JSON.stringify([
        {
          id: "s1",
          name: "Hochwasser Test",
          art: 0,
          angelegt: Date.now(),
          geaendert: Date.now(),
          eintraege: [{ id: "e1", einheitSchluessel: "x", empfangenAm: Date.now(), quelle: 0, status: 0, bogen: b }],
        },
      ]),
    );
    const sammlungen = einsaetzeLaden();
    expect(sammlungen).toHaveLength(1);
    const bogen = sammlungen[0]!.eintraege[0]!.bogen;
    expect(bogen.einheit.einheitsTyp).toBeTypeOf("object");
    expect(Array.isArray(bogen.fahrzeuge)).toBe(true);
  });
});

describe("Unlesbares zählen und beiseitelegen (R7-N3, R7-E2)", () => {
  beforeEach(() => {
    (globalThis as { localStorage?: Storage }).localStorage = new MemStorage() as unknown as Storage;
    speicherhuelleSetzen(localStorage);
    einsaetzeLesenZuruecksetzen();
  });

  const eintrag = (id: string, bogen: unknown) => ({ id, einheitSchluessel: id, empfangenAm: Date.now(), quelle: 0, status: 0, bogen });
  const sammlung = (id: string, eintraege: unknown) => ({ id, name: `Sammlung ${id}`, art: 0, angelegt: Date.now(), geaendert: Date.now(), eintraege });

  it("legt eine Sammlung ohne Eintragsliste beiseite, bevor der Kern sie beim Schreiben verliert", async () => {
    const { unlesbarBestand } = await import("./unlesbar");
    const { einsatzAnlegen, EinsatzArt } = await import("@bos/meldekopf/einsaetze");
    localStorage.setItem("eeb.einsaetze.v1", JSON.stringify([sammlung("kaputt", null), sammlung("s1", [eintrag("e1", beispiel())])]));
    einsaetzeLaden();
    einsatzAnlegen("Neu", EinsatzArt.EINSATZ); // schreibt nur die lesbaren Teile zurück
    expect(JSON.parse(localStorage.getItem("eeb.einsaetze.v1")!).some((s: { id: string }) => s.id === "kaputt")).toBe(false);
    expect(unlesbarBestand()!.sammlungen).toEqual([expect.objectContaining({ id: "kaputt", eintraege: null })]);
  });
});
