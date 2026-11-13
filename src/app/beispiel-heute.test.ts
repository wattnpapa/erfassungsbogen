import { describe, it, expect } from "vitest";
import { neuerBogen } from "./hilfen";
import { beispielAufHeute } from "./beispiel-heute";
import { einsatzVorgabe } from "./zeitraum-eingabe";

describe("beispielAufHeute (Prüfrunde Beispielbögen, BB-W5; Rückmeldung 11/2026)", () => {
  it("leert Ort und Auftrag, stellt den Zeitraum auf die Vorgabe eines neuen Bogens und setzt den Stand", () => {
    const b = neuerBogen();
    b.einsatz.zeitraumVon = 20000;
    b.einsatz.zeitraumBis = 20002;
    b.einsatz.zeitraumVonIso = "2024-10-04T08:00:00+02:00";
    b.einsatz.ortAuftrag = "Überörtliche Hilfe Vegetationsbrand";
    const neu = beispielAufHeute(b, 20500, 123456);
    expect(neu.einsatz).toEqual(einsatzVorgabe(20500));
    expect(neu.einsatz.ortAuftrag).toBe("");
    expect(neu.stand).toBe(123456);
    // Das Original bleibt unberührt (Cache des Dialogs).
    expect(b.einsatz.zeitraumVon).toBe(20000);
    expect(b.einsatz.ortAuftrag).toBe("Überörtliche Hilfe Vegetationsbrand");
  });

  it("ersetzt auch einen laufenden oder künftigen Zeitraum", () => {
    const b = neuerBogen();
    b.einsatz.zeitraumVon = 20490;
    b.einsatz.zeitraumBis = 20510;
    const neu = beispielAufHeute(b, 20500, 1);
    expect(neu.einsatz.zeitraumVon).toBe(20500);
    expect(neu.einsatz.zeitraumBis).toBe(20500);
  });
});
