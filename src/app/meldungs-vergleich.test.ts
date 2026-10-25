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

  // Audit Runde 6, R6-W2: Die Rückfrage nennt, was sich geändert hat.
  it("nennt die Änderung zwischen den Fassungen, leer bei gleichem Inhalt", () => {
    const v = meldungenVergleichen(bogen([["Lehmann", "Karsten"]]), bogen([["Lehmann", "Karsten"], ["Neu", "Nina"]]));
    expect(v.geaendert).not.toBe("");
    const gleich = meldungenVergleichen(bogen([["Lehmann", "Karsten"]]), bogen([["Lehmann", "Karsten"]]));
    expect(gleich.geaendert).toBe("");
  });

  // Audit Runde 7, R7-W3: Werte statt „3 Änderungen".
  it("nennt Namenstausch und Bedarf mit Wert statt „n Änderungen“ (R7-W3)", () => {
    const alt = bogen([["Lang", "Sabine"]]);
    const neu = bogen([["Neumann", "Nora"]]);
    alt.sofortbedarf = { ...(alt.sofortbedarf ?? {}), dieselLiter: 80 } as typeof alt.sofortbedarf;
    neu.sofortbedarf = { ...(neu.sofortbedarf ?? {}), dieselLiter: 100 } as typeof neu.sofortbedarf;
    const v = meldungenVergleichen(alt, neu);
    expect(v.geaendert).toContain("Personal: 1 getauscht");
    expect(v.geaendert).toContain("Diesel 80 l → 100 l");
    expect(v.geaendert).not.toMatch(/^\d+ Änderungen$/);
  });

  it("nennt eine Änderung der Einheit im Wortlaut (R7-N8)", () => {
    const alt = bogen([["Lang", "Sabine"]]);
    const neu = bogen([["Lang", "Sabine"]]);
    neu.einheit = { ...neu.einheit, einheitsTyp: undefined } as unknown as typeof neu.einheit;
    alt.einheit = { ...alt.einheit, einheitsTyp: { freitext: "Zugtrupp" } } as typeof alt.einheit;
    const v = meldungenVergleichen(alt, neu);
    expect(v.geaendert).toMatch(/Einheit: „.*Zugtrupp.*“? → /);
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
