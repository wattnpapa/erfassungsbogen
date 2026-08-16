// @vitest-environment jsdom
// (Die Weiche fragt window und navigator ab — im Node-Lauf gäbe es beide nicht.)

/**
 * Die Weiche „Browser oder installierte Fassung?" (imWebBrowser) entscheidet,
 * ob der erklärende Text der Startseite überhaupt gezeichnet wird. Prüfbar ist
 * hier die Capacitor-Brücke; die Paket-Schemata file:// und capacitor:// lassen
 * sich in jsdom nicht setzen — sie stehen wortgleich in der Frühweiche von
 * index.html, und beide Stellen verweisen aufeinander.
 */

import { describe, it, expect, vi, afterEach } from "vitest";

const nativ = { ist: false };
vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => nativ.ist, getPlatform: () => (nativ.ist ? "ios" : "web") },
}));

const { imWebBrowser } = await import("./nativ");

afterEach(() => {
  nativ.ist = false;
});

describe("imWebBrowser", () => {
  it("ist im Browser wahr", () => {
    expect(imWebBrowser()).toBe(true);
  });

  it("ist in der Capacitor-App (iOS/Android) falsch", () => {
    nativ.ist = true;
    expect(imWebBrowser()).toBe(false);
  });

  it("bleibt wahr in einer Browser-Hülle auf Electron-Basis — sie ist ein Browser", () => {
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/130 Electron/33.0.0 Safari/537.36",
      configurable: true,
    });
    expect(imWebBrowser()).toBe(true);
  });
});
