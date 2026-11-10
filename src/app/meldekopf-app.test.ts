import { afterEach, describe, expect, it } from "vitest";
import { MELDEKOPF_URL, RUECK_SCHLUESSEL, kamVomMeldekopf, meldekopfLink, rueckMarkeUebernehmen } from "./meldekopf-app";

class Speicher {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}

function umgebung(href: string) {
  const ersetzt: string[] = [];
  const g = globalThis as unknown as Record<string, unknown>;
  g.sessionStorage = new Speicher();
  g.window = {
    location: { href },
    history: { state: null, replaceState: (_s: unknown, _t: string, url: string) => ersetzt.push(url) },
  };
  return ersetzt;
}

afterEach(() => {
  const g = globalThis as unknown as Record<string, unknown>;
  delete g.window;
  delete g.sessionStorage;
});

describe("meldekopfLink()", () => {
  it("setzt die Adresse der Meldekopf-App vor denselben Bogen", () => {
    expect(meldekopfLink("https://erfassungsbogen.app/#AbC-_1")).toBe(MELDEKOPF_URL + "#AbC-_1");
    expect(meldekopfLink("AbC")).toBe(MELDEKOPF_URL + "#AbC");
  });
});

describe("Rücksprung ?rueck=meldekopf", () => {
  it("merkt sich die Marke für den Tab und nimmt sie aus der Adresse, das Fragment bleibt", () => {
    const ersetzt = umgebung("https://erfassungsbogen.app/?rueck=meldekopf#BOGEN");
    rueckMarkeUebernehmen();
    expect(kamVomMeldekopf()).toBe(true);
    expect(ersetzt).toEqual(["/#BOGEN"]);
  });

  it("lässt andere Adressen unberührt", () => {
    const ersetzt = umgebung("https://erfassungsbogen.app/?x=1#BOGEN");
    rueckMarkeUebernehmen();
    expect(kamVomMeldekopf()).toBe(false);
    expect(ersetzt).toEqual([]);
    expect(sessionStorage.getItem(RUECK_SCHLUESSEL)).toBeNull();
  });
});
