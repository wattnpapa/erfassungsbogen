/**
 * Audit Runde 5, R5-O2: Das Nachladen der zweiten Stufe gab beim ersten
 * Fehlschlag auf, und der Zähler stand minutenlang. Jetzt wiederholt es mit
 * Pause und Zeitgrenze, der Zähler bewegt sich oder die Zeile sagt, dass es hakt.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  NACHLADE_VERSUCHE_JE_DATEI,
  nachladePause,
  zusatzNachladen,
  type OfflineUmfang,
} from "./offline-vorrat";

const umfang = (n: number): OfflineUmfang => ({
  kern: [],
  zusatz: Array.from({ length: n }, (_, i) => ({ url: `beispiele/b${i}.json`, size: 10 })),
});

let cacheInhalt: Set<string>;
const sofort = () => Promise.resolve();

beforeEach(() => {
  cacheInhalt = new Set();
  vi.stubGlobal("location", { href: "https://app.test/" });
  vi.stubGlobal("caches", { match: async (adresse: string) => (cacheInhalt.has(adresse) ? new Response("x") : undefined) });
});
afterEach(() => vi.unstubAllGlobals());

function antwort(): Response {
  return new Response("ok", { status: 200 });
}

describe("nachladePause()", () => {
  it("steigert 2, 4, 8, 16 Sekunden und bleibt bei 20 (R6-O6)", () => {
    expect([1, 2, 3, 4, 5, 6, 7, 50].map(nachladePause)).toEqual([2000, 4000, 8000, 16000, 20000, 20000, 20000, 20000]);
  });
});

describe("zusatzNachladen()", () => {
  it("lädt alles, wenn das Netz durchgehend da ist", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => antwort()));
    const stand: number[] = [];
    const r = await zusatzNachladen(umfang(10), (f) => stand.push(f), () => false, { schlafen: sofort });
    expect(r).toEqual({ fertig: 10, gesamt: 10, aufgegeben: 0 });
    expect(stand[stand.length - 1]).toBe(10);
  });

  it("macht nach einem Fehlschlag weiter, statt aufzugeben (flackerndes Netz)", async () => {
    let aufrufe = 0;
    // Die ersten acht Abrufe scheitern (Funkloch), danach ist das Netz stabil.
    vi.stubGlobal("fetch", vi.fn(async () => {
      aufrufe++;
      if (aufrufe <= 8) throw new TypeError("Failed to fetch");
      return antwort();
    }));
    const haken: number[] = [];
    const r = await zusatzNachladen(umfang(20), () => undefined, () => false, {
      schlafen: sofort,
      beiHakt: ({ versuch }) => haken.push(versuch),
    });
    expect(r.fertig).toBe(20);
    expect(haken.length).toBeGreaterThan(0);
  });

  it("meldet das Haken mit der Pause, und der Zähler läuft danach weiter", async () => {
    let netz = false;
    vi.stubGlobal("fetch", vi.fn(async () => {
      if (!netz) throw new TypeError("Failed to fetch");
      return antwort();
    }));
    const lagen: { versuch: number; wartetMs: number }[] = [];
    const stand: number[] = [];
    const r = await zusatzNachladen(umfang(6), (f) => stand.push(f), () => false, {
      schlafen: sofort,
      beiHakt: (l) => {
        lagen.push(l);
        if (lagen.length === 3) netz = true;
      },
    });
    expect(lagen.map((l) => l.wartetMs)).toEqual([2000, 4000, 8000]);
    expect(r.fertig).toBe(6);
    expect(stand[stand.length - 1]).toBe(6);
  });

  it("bricht einen Abruf ohne Antwort nach der Zeitgrenze ab", async () => {
    let versuche = 0;
    vi.stubGlobal("fetch", vi.fn((_u: string, opt?: RequestInit) => {
      versuche++;
      if (versuche > 4) return Promise.resolve(antwort());
      return new Promise<Response>((_res, rej) => {
        opt?.signal?.addEventListener("abort", () => rej(new DOMException("abgebrochen", "AbortError")));
      });
    }));
    const r = await zusatzNachladen(umfang(4), () => undefined, () => false, { schlafen: sofort, abrufMs: 5 });
    expect(r.fertig).toBe(4);
  });

  it("gibt eine Datei nach den Versuchen auf (dauerhaftes 404), ohne die anderen aufzuhalten", async () => {
    vi.stubGlobal("fetch", vi.fn(async (u: string) => (u.endsWith("b1.json") ? new Response("", { status: 404 }) : antwort())));
    const r = await zusatzNachladen(umfang(3), () => undefined, () => false, { schlafen: sofort });
    expect(r).toEqual({ fertig: 2, gesamt: 3, aufgegeben: 1 });
    expect((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.filter(([u]) => String(u).endsWith("b1.json"))).toHaveLength(NACHLADE_VERSUCHE_JE_DATEI);
  });

  it("endet beim Abbruch (Seite geschlossen)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    }));
    let aus = false;
    const r = await zusatzNachladen(umfang(5), () => undefined, () => aus, {
      schlafen: sofort,
      beiHakt: () => {
        aus = true;
      },
    });
    expect(r.fertig).toBe(0);
  });

  it("überspringt, was schon im Cache liegt", async () => {
    const u = umfang(3);
    cacheInhalt.add(new URL(u.zusatz[0]!.url, "https://app.test/").href);
    const f = vi.fn(async () => antwort());
    vi.stubGlobal("fetch", f);
    const r = await zusatzNachladen(u, () => undefined, () => false, { schlafen: sofort });
    expect(r.fertig).toBe(3);
    expect(f).toHaveBeenCalledTimes(2);
  });
});
