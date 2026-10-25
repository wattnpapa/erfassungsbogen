/** Audit Runde 5, R5-S6: Der Link einer wartenden Meldung überlebt das Neuladen, nicht die Antwort. */
import { beforeEach, describe, expect, it } from "vitest";
import { wartendenLinkErledigt, wartendenLinkLesen, wartendenLinkMerken } from "./wartender-link";

class Sitzung {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}

beforeEach(() => {
  (globalThis as { sessionStorage?: unknown }).sessionStorage = new Sitzung();
});

describe("wartender Link", () => {
  it("merkt, liest und vergisst", () => {
    expect(wartendenLinkLesen()).toBe("");
    wartendenLinkMerken("abc");
    expect(wartendenLinkLesen()).toBe("abc");
    wartendenLinkErledigt();
    expect(wartendenLinkLesen()).toBe("");
  });

  it("merkt keinen leeren Link", () => {
    wartendenLinkMerken("");
    expect(wartendenLinkLesen()).toBe("");
  });

  it("verträgt gesperrten Sitzungsspeicher", () => {
    Object.defineProperty(globalThis, "sessionStorage", { configurable: true, get: () => { throw new Error("gesperrt"); } });
    expect(() => wartendenLinkMerken("x")).not.toThrow();
    expect(wartendenLinkLesen()).toBe("");
    expect(() => wartendenLinkErledigt()).not.toThrow();
  });
});
