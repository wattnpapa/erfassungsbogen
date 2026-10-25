import { describe, expect, it } from "vitest";
import { Geschlecht, Person, StaerkeRolle } from "@bos/eeb-format/model";
import { beispielPersonen } from "./beispielnamen";
import { neuePerson } from "./hilfen";

describe("beispielPersonen", () => {
  it("erzeugt die gewünschte Anzahl vollständig befüllter Personen", () => {
    const personen = beispielPersonen(20);
    expect(personen).toHaveLength(20);
    for (const p of personen) {
      expect(p.vorname).not.toBe("");
      expect(p.nachname).not.toBe("");
      expect([Geschlecht.M, Geschlecht.W, Geschlecht.D]).toContain(p.geschlecht);
      // Struktur wie neuePerson(): keine Kontakte/Funktionen vorbelegt.
      expect(p.kontakte).toEqual([]);
      expect(p.funktionen).toEqual([]);
    }
  });

  it("baut ab Zugstärke eine Führungsstruktur auf (1 Führer, Unterführer je angefangene 6)", () => {
    const personen = beispielPersonen(14);
    const fuehrer = personen.filter((p) => p.staerkeRolle === StaerkeRolle.FUEHRER);
    const unterfuehrer = personen.filter((p) => p.staerkeRolle === StaerkeRolle.UNTERFUEHRER);
    expect(fuehrer).toHaveLength(1);
    expect(unterfuehrer.length).toBeGreaterThanOrEqual(1);
    expect(unterfuehrer.length).toBeLessThanOrEqual(3);
  });

  it("setzt bei Gruppenstärke keinen Führer: der Gruppenführer ist Unterführer", () => {
    const personen = beispielPersonen(9);
    expect(personen.filter((p) => p.staerkeRolle === StaerkeRolle.FUEHRER)).toHaveLength(0);
    expect(personen.filter((p) => p.staerkeRolle === StaerkeRolle.UNTERFUEHRER)).toHaveLength(2);
  });

  it("ergänzt bestehende Führungskräfte, statt sie zu doppeln", () => {
    const bestand: Person[] = [{ ...neuePerson(), vorname: "Z", nachname: "F", staerkeRolle: StaerkeRolle.FUEHRER }];
    const personen = beispielPersonen(5, bestand);
    expect(personen.filter((p) => p.staerkeRolle === StaerkeRolle.FUEHRER)).toHaveLength(0);
  });
});
