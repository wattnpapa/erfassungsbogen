/** Audit Runde 4, R4-D5: Der Papierkorb nennt das Datum und hebt die letzten Tage hervor. */
import { describe, expect, it } from "vitest";
import { papierkorbRest } from "./papierkorb-frist";

const TAG = 24 * 60 * 60 * 1000;
const JETZT = new Date("2026-10-06T12:00:00").getTime();

describe("papierkorbRest()", () => {
  it("nennt bei frischem Eintrag das Datum und die Tage, ohne Hervorhebung", () => {
    const r = papierkorbRest(JETZT - 2 * TAG, JETZT);
    expect(r.bald).toBe(false);
    expect(r.text).toBe("Wird am 3.11.2026 endgültig entfernt (in 28 Tagen).");
  });

  it("hebt ab drei Tagen vor dem Ende hervor und rät zum Wiederherstellen", () => {
    const r = papierkorbRest(JETZT - 27 * TAG, JETZT);
    expect(r.bald).toBe(true);
    expect(r.text).toMatch(/^Wird am 9\.10\.2026 endgültig entfernt \(in 3 Tagen\) — jetzt wiederherstellen/);
  });

  it("sagt bei 29,7 Tagen „morgen“ und danach „beim nächsten Start“", () => {
    expect(papierkorbRest(JETZT - 29.7 * TAG, JETZT).text).toMatch(/^Wird morgen endgültig entfernt/);
    expect(papierkorbRest(JETZT - 31 * TAG, JETZT).text).toMatch(/^Wird beim nächsten Start endgültig entfernt/);
  });
});
