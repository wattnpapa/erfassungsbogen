import { describe, it, expect } from "vitest";
import { neuerBogen, pruefpunkte, zeitraumDeutsch, zeitraumVonBis } from "./hilfen";
import { beispielAufHeute } from "./beispiel-heute";
import { zeitraumLeer, zeitraumNachEingabe } from "./zeitraum-eingabe";

describe("beispielAufHeute (Prüfrunde Beispielbögen, BB-W5; Rückmeldung 11/2026)", () => {
  it("leert Zeitraum sowie Ort und Auftrag und setzt den Stand", () => {
    const b = neuerBogen();
    b.einsatz.zeitraumVon = 20000;
    b.einsatz.zeitraumBis = 20002;
    b.einsatz.zeitraumVonIso = "2024-10-04T08:00:00+02:00";
    b.einsatz.ortAuftrag = "Überörtliche Hilfe Vegetationsbrand";
    const neu = beispielAufHeute(b, 123456);
    expect(neu.einsatz).toEqual({ zeitraumVon: 0, zeitraumBis: 0, ortAuftrag: "" });
    expect(zeitraumLeer(neu.einsatz)).toBe(true);
    expect(neu.stand).toBe(123456);
    // Das Original bleibt unberührt (Cache des Dialogs).
    expect(b.einsatz.zeitraumVon).toBe(20000);
    expect(b.einsatz.ortAuftrag).toBe("Überörtliche Hilfe Vegetationsbrand");
  });

  it("zeigt einen leeren Zeitraum nicht als 01.01.2020 und warnt nicht vor „vorbei“", () => {
    const neu = beispielAufHeute(neuerBogen(), 1);
    expect(zeitraumVonBis(neu)).toBe("");
    expect(zeitraumDeutsch(neu)).toBe("nicht angegeben");
    const texte = pruefpunkte(neu, true, 2500).map((p) => p.text);
    expect(texte.some((t) => t.includes("nicht angegeben"))).toBe(true);
    expect(texte.some((t) => /vorbei|Jahr entfernt/.test(t))).toBe(false);
  });

  it("das erste eingetragene Datum gilt für beide Enden", () => {
    const leer = { zeitraumVon: 0, zeitraumBis: 0 };
    expect(zeitraumNachEingabe(leer, "bis", "2026-11-13", 2500)).toEqual(zeitraumNachEingabe(leer, "von", "2026-11-13", 2500));
    expect(zeitraumLeer(zeitraumNachEingabe(leer, "von", "2026-11-13", 2500))).toBe(false);
    expect(zeitraumLeer(zeitraumNachEingabe(leer, "von", "", 2500))).toBe(true);
  });
});
