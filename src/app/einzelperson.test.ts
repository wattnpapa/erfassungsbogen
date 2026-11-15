import { describe, expect, it } from "vitest";
import { PersonalErfassung } from "@bos/eeb-format/model";
import { decodeBinaer, encodeBinaer } from "@bos/eeb-format/codec";
import { einzelpersonAbgleich, neuePerson, neuerBogen, pruefpunkte } from "./hilfen";

function einzelBogen() {
  const b = neuerBogen();
  b.einheit = { ...b.einheit, einzelperson: true, hierarchie: [{ bezeichnung: { code: 1 }, name: "Siegburg" }] };
  b.personal = [{ ...neuePerson(), vorname: "Kim", nachname: "Beispiel", funktionen: [{ code: 61 }] }];
  return b;
}

describe("einzelpersonAbgleich()", () => {
  it("schreibt die Funktion der Person als Einheitstyp, damit ältere Stände sie als Typ lesen", () => {
    expect(einzelpersonAbgleich(einzelBogen()).einheit.einheitsTyp).toEqual({ freitext: "Baufachberater/in" });
  });

  it("folgt einer in Schritt 3 geänderten Funktion", () => {
    const b = einzelpersonAbgleich(einzelBogen());
    b.personal = [{ ...b.personal[0]!, funktionen: [{ freitext: "Fachberater/in Hochwasser" }] }];
    expect(einzelpersonAbgleich(b).einheit.einheitsTyp).toEqual({ freitext: "Fachberater/in Hochwasser" });
  });

  it("nimmt einer Einzelperson die „Nur Stärke“-Zahlen", () => {
    const b = { ...einzelBogen(), personalErfassung: PersonalErfassung.NUR_STAERKE, staerkeManuell: { fuehrer: 0, unterfuehrer: 0, mannschaft: 9, gesamt: 9 } };
    const neu = einzelpersonAbgleich(b);
    expect(neu.personalErfassung).toBe(PersonalErfassung.VOLLSTAENDIG);
    expect(neu.staerkeManuell).toBeUndefined();
  });

  it("lässt eine Einheit und einen schon stimmigen Bogen unangetastet (dasselbe Objekt)", () => {
    const einheit = neuerBogen();
    expect(einzelpersonAbgleich(einheit)).toBe(einheit);
    const stimmig = einzelpersonAbgleich(einzelBogen());
    expect(einzelpersonAbgleich(stimmig)).toBe(stimmig);
  });
});

describe("Einzelperson im Bogen", () => {
  it("übersteht den Transport", () => {
    const b = einzelpersonAbgleich(einzelBogen());
    expect(decodeBinaer(encodeBinaer(b)).einheit.einzelperson).toBe(true);
  });

  it("meldet den Freitext-Typ nicht als „nicht erkannt“, wohl aber eine fehlende Funktion und eine zweite Person", () => {
    const b = einzelpersonAbgleich(einzelBogen());
    expect(pruefpunkte(b).map((h) => h.text).join("\n")).not.toMatch(/nicht erkannt|Einheitstyp fehlt/);
    const ohne = einzelpersonAbgleich({ ...b, personal: [{ ...b.personal[0]!, funktionen: [] }, neuePerson()] });
    const texte = pruefpunkte(ohne).map((h) => h.text).join("\n");
    expect(texte).toMatch(/Funktion fehlt/);
    expect(texte).toMatch(/Als Einzelperson gemeldet, aber 2 Personen/);
  });
});
