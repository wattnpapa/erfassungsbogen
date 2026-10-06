/**
 * Offline-Zusage auf der Startseite (Audit Runde 2, R2-O1): Sie steht erst,
 * wenn der Service Worker aktiv ist — vorher sagt die Zeile, dass noch
 * geladen wird, und ohne Netz, dass die Seite nicht neu geladen werden darf.
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("./nativ", () => ({ istNativ: () => false }));

const { offlineText, installationAnstossen } = await import("./offline-bereit");

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

  // Gleich nach dem Aktivieren ist die zweite Stufe noch nicht gezählt. Die
  // Zeile sagte dann rund 100 ms lang „komplett offline" — beim Neuladen ohne
  // Netz auch dann, wenn noch kein einziger Beispielbogen im Gerät lag.
  it("verspricht „komplett offline“ erst, wenn die zweite Stufe gezählt ist", () => {
    const frisch = offlineText({ stand: "bereit", frischBereit: true, online: true, zweiStufen: true });
    expect(frisch).toMatch(/^✓ Jetzt offline bereit für Bogen, PDF, QR-Code und Empfang — /);
    expect(frisch).not.toMatch(/komplett offline/);
    expect(offlineText({ stand: "bereit", frischBereit: false, online: false, zweiStufen: true, zusatz: null })).not.toMatch(
      /komplett offline/,
    );
    expect(
      offlineText({ stand: "bereit", frischBereit: false, online: true, zweiStufen: true, zusatz: { fertig: 474, gesamt: 474 } }),
    ).toMatch(/^✓ Funktioniert komplett offline/);
    // Native App: keine zweite Stufe, alles liegt im Paket.
    expect(offlineText({ stand: "bereit", frischBereit: false, online: true, zweiStufen: false })).toMatch(
      /^✓ Funktioniert komplett offline/,
    );
  });
});

/**
 * Audit Runde 4, R4-O1: Bricht das Erstladen ab, verwirft der Browser die
 * Registrierung; die Zeile blieb bei „wird geladen" stehen. Jetzt wird neu
 * registriert, und die Zeile sagt ehrlich, was los ist.
 */
describe("installationAnstossen", () => {
  function container(registrierung: unknown) {
    const register = vi.fn(async () => ({}));
    const update = vi.fn(async () => {});
    const c = {
      getRegistration: vi.fn(async () => (registrierung ? { update } : undefined)),
      register,
    } as unknown as ServiceWorkerContainer;
    return { c, register, update };
  }

  it("stößt eine lebende Registrierung nur an", async () => {
    const { c, register, update } = container(true);
    expect(await installationAnstossen(c, "https://x.test/app/sw.js")).toBe("vorhanden");
    expect(update).toHaveBeenCalled();
    expect(register).not.toHaveBeenCalled();
  });

  it("registriert neu, wenn der Browser die Registrierung verworfen hat", async () => {
    const { c, register } = container(false);
    expect(await installationAnstossen(c, "https://x.test/app/sw.js")).toBe("neu");
    expect(register).toHaveBeenCalledWith("https://x.test/app/sw.js", { scope: "https://x.test/app/" });
  });

  it("meldet „fehler“, wenn das Registrieren scheitert oder es keinen Service Worker gibt", async () => {
    const { c } = container(false);
    (c.register as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("abgelehnt"));
    expect(await installationAnstossen(c, "https://x.test/sw.js")).toBe("fehler");
    expect(await installationAnstossen(null)).toBe("fehler");
  });
});

describe("offlineText bei abgebrochenem Laden (R4-O1)", () => {
  it("sagt „Laden abgebrochen“ mit Zahl und Ausweg, statt weiter zu laden", () => {
    const t = offlineText({
      stand: "laedt",
      frischBereit: false,
      online: true,
      abgebrochen: true,
      kern: { geladen: 1_677_721, gesamt: 7_025_459 },
    });
    expect(t).toMatch(/^⚠ Laden abgebrochen bei 1,6 von 6,7 MB — mit Netz einmal neu laden/);
    expect(t).not.toMatch(/Wird für den Offline-Betrieb geladen/);
  });

  it("ohne Netz bleibt es bei der Zeile „noch nicht offline bereit“", () => {
    expect(offlineText({ stand: "laedt", frischBereit: false, online: false, abgebrochen: true })).toMatch(/Noch nicht offline bereit/);
  });
});
