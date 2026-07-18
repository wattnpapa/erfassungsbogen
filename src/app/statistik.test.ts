import { describe, it, expect, beforeEach, vi } from "vitest";

// statistik.ts zieht über ./nativ die Capacitor-Plugins; der Mock hält die
// Node-Testumgebung frei davon (gleiches Muster wie entwurf.test.ts).
const nativ = vi.hoisted(() => ({ wert: false }));
vi.mock("./nativ", () => ({ istNativ: () => nativ.wert }));

import { statistikStarten, statistikAbgewaehlt, statistikAbwaehlen } from "./statistik";

class MemStorage {
  private m = new Map<string, string>();
  get length() {
    return this.m.size;
  }
  clear() {
    this.m.clear();
  }
  getItem(k: string) {
    return this.m.has(k) ? this.m.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, String(v));
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
  key(i: number) {
    return [...this.m.keys()][i] ?? null;
  }
}

/** Minimales DOM: nur so viel, wie statistikStarten() anfasst. */
function fakeDom(protocol: string, hostname: string) {
  const eingehaengt: { src: string; endpunkt: string | undefined }[] = [];
  const skripte: unknown[] = [];
  const document = {
    querySelector: (sel: string) => (sel.includes("goatcounter") ? (skripte[0] ?? null) : null),
    createElement: () => ({ dataset: {} as Record<string, string>, src: "", async: false, addEventListener() {} }),
    head: {
      appendChild(el: { src: string; dataset: Record<string, string> }) {
        skripte.push(el);
        eingehaengt.push({ src: el.src, endpunkt: el.dataset.goatcounter });
      },
    },
  };
  (globalThis as Record<string, unknown>).document = document;
  (globalThis as Record<string, unknown>).window = {
    location: { protocol, hostname, pathname: "/" },
    document,
  };
  return eingehaengt;
}

beforeEach(() => {
  (globalThis as { localStorage?: Storage }).localStorage = new MemStorage() as unknown as Storage;
  nativ.wert = false;
  delete (globalThis as Record<string, unknown>).window;
  delete (globalThis as Record<string, unknown>).document;
});

describe("statistikStarten()", () => {
  it("hängt das Zählskript auf der Produktions-Domain ein", () => {
    const eingehaengt = fakeDom("https:", "erfassungsbogen.app");
    statistikStarten();
    expect(eingehaengt).toHaveLength(1);
    expect(eingehaengt[0]?.src).toBe("https://gc.zgo.at/count.js");
    expect(eingehaengt[0]?.endpunkt).toBe("https://erfassungsbogen.goatcounter.com/count");
  });

  it("meldet als Pfad nur location.pathname – nie Query oder Fragment", () => {
    fakeDom("https:", "erfassungsbogen.app");
    statistikStarten();
    const gc = (globalThis as { window?: { goatcounter?: { path?: () => string } } }).window?.goatcounter;
    expect(gc?.path?.()).toBe("/");
  });

  it("zählt nicht in der nativen App", () => {
    const eingehaengt = fakeDom("https:", "erfassungsbogen.app");
    nativ.wert = true;
    statistikStarten();
    expect(eingehaengt).toHaveLength(0);
  });

  it("zählt nicht unter file:// (Electron-Build)", () => {
    const eingehaengt = fakeDom("file:", "");
    statistikStarten();
    expect(eingehaengt).toHaveLength(0);
  });

  it("zählt nicht in der lokalen Entwicklung", () => {
    const eingehaengt = fakeDom("http:", "localhost");
    statistikStarten();
    expect(eingehaengt).toHaveLength(0);
  });

  it("zählt nicht nach Widerspruch", () => {
    const eingehaengt = fakeDom("https:", "erfassungsbogen.app");
    statistikAbwaehlen(true);
    statistikStarten();
    expect(eingehaengt).toHaveLength(0);
  });

  it("hängt das Skript kein zweites Mal ein", () => {
    const eingehaengt = fakeDom("https:", "erfassungsbogen.app");
    statistikStarten();
    statistikStarten();
    expect(eingehaengt).toHaveLength(1);
  });
});

describe("statistikAbwaehlen()", () => {
  it("setzt und entfernt den von GoatCounter ausgewerteten Schlüssel", () => {
    expect(statistikAbgewaehlt()).toBe(false);
    statistikAbwaehlen(true);
    expect(localStorage.getItem("skipgc")).toBe("t");
    expect(statistikAbgewaehlt()).toBe(true);
    statistikAbwaehlen(false);
    expect(localStorage.getItem("skipgc")).toBeNull();
    expect(statistikAbgewaehlt()).toBe(false);
  });

  it("bleibt still, wenn der Storage gesperrt ist (privater Modus)", () => {
    (globalThis as { localStorage?: Storage }).localStorage = {
      getItem() {
        throw new Error("gesperrt");
      },
      setItem() {
        throw new Error("gesperrt");
      },
      removeItem() {
        throw new Error("gesperrt");
      },
    } as unknown as Storage;
    expect(() => statistikAbwaehlen(true)).not.toThrow();
    expect(statistikAbgewaehlt()).toBe(false);
  });
});
