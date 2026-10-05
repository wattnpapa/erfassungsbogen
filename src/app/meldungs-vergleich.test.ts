/** Gegenüberstellung zweier Meldungen für „Einheit ist bereits gemeldet" (Audit Runde 4, R4-N1). */
import { describe, expect, it } from "vitest";
import { neuePerson, neuerBogen } from "./hilfen";
import { meldungenVergleichen, steckbriefZeile } from "./meldungs-vergleich";

function bogen(personen: [string, string][], kennzeichen: string[] = []) {
  const b = neuerBogen();
  b.personal = personen.map(([nachname, vorname]) => ({ ...neuePerson(), nachname, vorname }));
  b.fahrzeuge = kennzeichen.map((k) => ({ typ: { freitext: "MTW" }, kennzeichen: k }));
  return b;
}

describe("meldungenVergleichen", () => {
  it("nennt Stärke, Ansprechperson, Kennzeichen und Stand beider Meldungen", () => {
    const v = meldungenVergleichen(bogen([["Lehmann", "Karsten"]], ["THW-84397"]), bogen([["Müller", "Max"], ["Lehmann", "Karsten"]]));
    expect(v.bisher.ansprechperson).toBe("Lehmann, Karsten");
    expect(v.neu.ansprechperson).toBe("Müller, Max");
    expect(steckbriefZeile(v.bisher)).toMatch(/^Stärke \d+ \/ \d+ \/ \d+ \/ \d+ · Lehmann, Karsten · THW-84397 · Stand /);
  });

  it("echte Folgemeldung (gleiche Person, eine dazu): kein Warnhinweis", () => {
    const v = meldungenVergleichen(bogen([["Lehmann", "Karsten"]]), bogen([["Lehmann", "Karsten"], ["Neu", "Nina"]]));
    expect(v.keineUeberschneidung).toBe(false);
  });

  it("andere Gruppe: keine gemeinsame Person und kein gemeinsames Kennzeichen", () => {
    const v = meldungenVergleichen(bogen([["Lehmann", "Karsten"]], ["THW-1"]), bogen([["Müller", "Max"]], ["THW-2"]));
    expect(v.keineUeberschneidung).toBe(true);
  });

  it("ein gemeinsames Fahrzeug reicht (Kennzeichen ohne Leer- und Bindestriche verglichen)", () => {
    const v = meldungenVergleichen(bogen([["Lehmann", "Karsten"]], ["THW 84397"]), bogen([["Müller", "Max"]], ["thw-84397"]));
    expect(v.keineUeberschneidung).toBe(false);
  });

  it("urteilt nicht, wenn eine Seite gar keine Namen und Kennzeichen trägt (nur Stärke)", () => {
    expect(meldungenVergleichen(bogen([]), bogen([["Müller", "Max"]])).keineUeberschneidung).toBe(false);
  });
});
