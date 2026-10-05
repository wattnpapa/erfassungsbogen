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

/** Audit Runde 3, R3-O3: Fortschritt beim Laden, zweite Stufe benannt. */
describe("offlineText mit Fortschritt", () => {
  it("nennt beim Laden, wie viel schon da ist", () => {
    const t = offlineText({ stand: "laedt", frischBereit: false, online: true, kern: { geladen: 2_202_009, gesamt: 7_025_459 } });
    expect(t).toMatch(/: 2,1 von 6,7 MB — bitte mit Netz geöffnet lassen/);
    expect(t).toMatch(/Danach gehen Bogen, PDF, QR-Code und Empfang ohne Netz/);
    expect(offlineText({ stand: "laedt", frischBereit: false, online: false, kern: { geladen: 1_048_576, gesamt: 7_025_459 } })).toMatch(
      /Noch nicht offline bereit \(1,0 von 6,7 MB geladen\)/,
    );
  });

  it("meldet den Kern bereit, solange die zweite Stufe nachlädt", () => {
    const t = offlineText({ stand: "bereit", frischBereit: true, online: true, zusatz: { fertig: 120, gesamt: 474 } });
    expect(t).toMatch(/^✓ Jetzt offline bereit für Bogen, PDF, QR-Code und Empfang\. Beispielbögen und Themenseiten werden nachgeladen \(120 von 474\)/);
    expect(t).not.toMatch(/komplett offline/);
    expect(offlineText({ stand: "bereit", frischBereit: false, online: false, zusatz: { fertig: 120, gesamt: 474 } })).toMatch(
      /folgen beim nächsten Netz/,
    );
    expect(offlineText({ stand: "bereit", frischBereit: false, online: true, zusatz: { fertig: 474, gesamt: 474 } })).toMatch(
      /^✓ Funktioniert komplett offline/,
    );
  });
});
