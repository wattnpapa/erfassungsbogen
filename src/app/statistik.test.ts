import { describe, it, expect, beforeEach, vi } from "vitest";

// statistik.ts zieht über ./nativ die Capacitor-Plugins; der Mock hält die
// Node-Testumgebung frei davon (gleiches Muster wie entwurf.test.ts).
const nativ = vi.hoisted(() => ({ ist: false, name: "web" }));
vi.mock("./nativ", () => ({ istNativ: () => nativ.ist, plattform: () => nativ.name }));

import { statistikStarten, statistikAbgewaehlt, statistikAbwaehlen, nutzungsKanal } from "./statistik";

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

/** Gesendete Zähl-URLs dieses Testlaufs. */
let gesendet: string[] = [];

/**
 * Minimales Browser-Umfeld: nur so viel, wie statistik.ts anfasst.
 * `standalone` schaltet die PWA-Erkennung, `beacon` simuliert ein
 * blockiertes sendBeacon (dann muss der Image-Fallback greifen).
 */
function fakeUmfeld(opt: {
  protocol?: string;
  hostname?: string;
  ua?: string;
  standalone?: boolean;
  beacon?: boolean;
  referrer?: string;
}) {
  const { protocol = "https:", hostname = "erfassungsbogen.app", ua = "", standalone = false } = opt;
  const beacon = opt.beacon ?? true;

  // navigator ist in Node ein reiner Getter — nur über stubGlobal ersetzbar.
  vi.stubGlobal("window", {
    location: { protocol, hostname, pathname: "/", search: "?geheim=1", hash: "#nutzlast" },
    matchMedia: (q: string) => ({ matches: standalone && q.includes("standalone") }),
  });
  vi.stubGlobal("navigator", {
    userAgent: ua,
    sendBeacon: (url: string) => {
      if (!beacon) return false;
      gesendet.push(url);
      return true;
    },
  });
  vi.stubGlobal("document", { referrer: opt.referrer ?? "" });
  vi.stubGlobal(
    "Image",
    class {
      set src(url: string) {
        gesendet.push(url);
      }
    },
  );
}

beforeEach(() => {
  vi.unstubAllGlobals();
  (globalThis as { localStorage?: Storage }).localStorage = new MemStorage() as unknown as Storage;
  nativ.ist = false;
  nativ.name = "web";
  gesendet = [];
});

/** Der p-Parameter der zuletzt gesendeten Zähl-URL. */
function letzterPfad(): string | null {
  const url = gesendet[gesendet.length - 1];
  return url ? new URL(url).searchParams.get("p") : null;
}

describe("nutzungsKanal()", () => {
  it("unterscheidet die installierten Apps", () => {
    fakeUmfeld({});
    nativ.ist = true;
    nativ.name = "ios";
    expect(nutzungsKanal()).toEqual({ pfad: "/app/ios", titel: "App (iOS)" });
    nativ.name = "android";
    expect(nutzungsKanal()).toEqual({ pfad: "/app/android", titel: "App (Android)" });
  });

  it("erkennt den Electron-Build an file://", () => {
    fakeUmfeld({ protocol: "file:", hostname: "" });
    expect(nutzungsKanal()).toEqual({ pfad: "/app/desktop", titel: "App (Desktop)" });
  });

  it("trennt Browser und installierte PWA je Geräteklasse", () => {
    fakeUmfeld({ ua: "Mozilla/5.0 (Macintosh)" });
    expect(nutzungsKanal().pfad).toBe("/browser/desktop");

    fakeUmfeld({ ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)" });
    expect(nutzungsKanal().pfad).toBe("/browser/ios");

    fakeUmfeld({ ua: "Mozilla/5.0 (Linux; Android 14)", standalone: true });
    expect(nutzungsKanal()).toEqual({ pfad: "/pwa/android", titel: "PWA (Android)" });
  });
});

describe("statistikStarten()", () => {
  it("sendet genau einen Treffer an die Zähl-URL", () => {
    fakeUmfeld({ ua: "Mozilla/5.0 (Macintosh)" });
    statistikStarten();
    expect(gesendet).toHaveLength(1);
    const url = new URL(gesendet[0]!);
    expect(url.origin + url.pathname).toBe("https://erfassungsbogen.goatcounter.com/count");
    expect(url.searchParams.get("p")).toBe("/browser/desktop");
    expect(url.searchParams.get("t")).toBe("Browser (Desktop)");
  });

  it("überträgt niemals Query oder Fragment der aktuellen URL", () => {
    fakeUmfeld({ ua: "Mozilla/5.0 (Macintosh)" });
    statistikStarten();
    expect(gesendet[0]).not.toContain("geheim");
    expect(gesendet[0]).not.toContain("nutzlast");
  });

  it("zählt auch in der nativen App", () => {
    fakeUmfeld({ protocol: "capacitor:", hostname: "localhost" });
    nativ.ist = true;
    nativ.name = "ios";
    statistikStarten();
    expect(letzterPfad()).toBe("/app/ios");
  });

  it("sendet in App und Electron keinen Referrer", () => {
    fakeUmfeld({ protocol: "file:", hostname: "", referrer: "https://beispiel.invalid/" });
    statistikStarten();
    expect(new URL(gesendet[0]!).searchParams.get("r")).toBe("");
  });

  it("weicht auf das Zählpixel aus, wenn sendBeacon blockiert ist", () => {
    fakeUmfeld({ ua: "Mozilla/5.0 (Macintosh)", beacon: false });
    statistikStarten();
    expect(gesendet).toHaveLength(1);
    expect(letzterPfad()).toBe("/browser/desktop");
  });

  it("zählt nicht in der lokalen Entwicklung", () => {
    fakeUmfeld({ protocol: "http:", hostname: "localhost" });
    statistikStarten();
    expect(gesendet).toHaveLength(0);
  });

  it("zählt nicht nach Widerspruch", () => {
    fakeUmfeld({ ua: "Mozilla/5.0 (Macintosh)" });
    statistikAbwaehlen(true);
    statistikStarten();
    expect(gesendet).toHaveLength(0);
  });

  it("bleibt still, wenn gar kein Versandweg funktioniert (offline, kein Beacon)", () => {
    fakeUmfeld({ ua: "Mozilla/5.0 (Macintosh)", beacon: false });
    vi.stubGlobal(
      "Image",
      class {
        set src(_url: string) {
          throw new Error("kein Netz");
        }
      },
    );
    expect(() => statistikStarten()).not.toThrow();
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
