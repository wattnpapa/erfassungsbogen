import { describe, it, expect } from "vitest";
import { zeitraumIsoLesen } from "@bos/eeb-format/model";
import { neuerBogen } from "./hilfen";
import { beispielAufHeute } from "./beispiel-heute";

describe("beispielAufHeute (Prüfrunde Beispielbögen, BB-W5)", () => {
  it("rückt einen vergangenen Zeitraum mit gleicher Dauer auf heute und setzt den Stand", () => {
    const b = neuerBogen();
    b.einsatz.zeitraumVon = 20000;
    b.einsatz.zeitraumBis = 20002;
    b.einsatz.zeitraumVonIso = "2024-10-04T08:00:00+02:00";
    const neu = beispielAufHeute(b, 20500, 123456);
    expect(neu.einsatz.zeitraumVon).toBe(20500);
    expect(neu.einsatz.zeitraumBis).toBe(20502);
    expect(zeitraumIsoLesen(neu.einsatz.zeitraumVonIso!)!.tag).toBe(zeitraumIsoLesen("2024-10-04T08:00:00+02:00")!.tag + 500);
    expect(zeitraumIsoLesen(neu.einsatz.zeitraumVonIso!)!.minuten).toBe(8 * 60);
    expect(neu.stand).toBe(123456);
    // Das Original bleibt unberührt (Cache des Dialogs).
    expect(b.einsatz.zeitraumVon).toBe(20000);
  });

  it("lässt einen laufenden Zeitraum stehen", () => {
    const b = neuerBogen();
    b.einsatz.zeitraumVon = 20490;
    b.einsatz.zeitraumBis = 20510;
    const neu = beispielAufHeute(b, 20500, 1);
    expect(neu.einsatz.zeitraumVon).toBe(20490);
    expect(neu.einsatz.zeitraumBis).toBe(20510);
    expect(neu.stand).toBe(1);
  });
});
