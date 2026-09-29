/**
 * Offline-Zusage auf der Startseite (Audit Runde 2, R2-O1): Sie steht erst,
 * wenn der Service Worker aktiv ist — vorher sagt die Zeile, dass noch
 * geladen wird, und ohne Netz, dass die Seite nicht neu geladen werden darf.
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("./nativ", () => ({ istNativ: () => false }));

const { offlineText } = await import("./offline-bereit");

describe("offlineText", () => {
  it("verspricht den Offline-Betrieb nur im Stand „bereit“", () => {
    expect(offlineText({ stand: "bereit", frischBereit: false, online: true })).toMatch(/^✓ Funktioniert komplett offline/);
    expect(offlineText({ stand: "laedt", frischBereit: false, online: true })).not.toMatch(/Funktioniert komplett offline/);
    expect(offlineText({ stand: "ohne", frischBereit: false, online: true })).not.toMatch(/Funktioniert komplett offline/);
  });

  it("sagt beim Laden, was zu tun ist — mit und ohne Netz", () => {
    expect(offlineText({ stand: "laedt", frischBereit: false, online: true })).toMatch(/bitte mit Netz geöffnet lassen/);
    expect(offlineText({ stand: "laedt", frischBereit: false, online: false })).toMatch(/ohne Netz diese Seite nicht neu laden/);
  });

  it("quittiert den Abschluss einmal", () => {
    expect(offlineText({ stand: "bereit", frischBereit: true, online: true })).toMatch(/^✓ Jetzt offline bereit/);
  });
});
