/**
 * Nachzügler aus der Vorlage (Audit Runde 4, R4-W8).
 */
import { describe, it, expect } from "vitest";
import { neuerBogen, neuePerson } from "./hilfen";
import { nachzueglerFuer, nachzueglerMerken } from "./vorlage-nachzuegler";

function bogenMit(name: string, personen: string[]) {
  const b = neuerBogen();
  b.einheit.hierarchie[0]!.name = name;
  b.personal = personen.map((nachname) => ({ ...neuePerson(), vorname: "T", nachname }));
  return b;
}

describe("nachzueglerFuer", () => {
  it("bietet die abgewählten Personen nur dem Bogen dieser Einheit an, ohne wen schon da ist", () => {
    const b = bogenMit("Musterhausen", ["Berger"]);
    const abgewaehlt = bogenMit("Musterhausen", ["Ahlers", "Voss"]).personal;
    nachzueglerMerken(b, abgewaehlt);
    expect(nachzueglerFuer(b).map((p) => p.nachname)).toEqual(["Ahlers", "Voss"]);
    // Voss kam inzwischen von Hand dazu.
    b.personal.push({ ...neuePerson(), vorname: "t", nachname: "voss" });
    expect(nachzueglerFuer(b).map((p) => p.nachname)).toEqual(["Ahlers"]);
    // Eine andere Einheit bekommt nichts angeboten.
    expect(nachzueglerFuer(bogenMit("Andernorts", []))).toEqual([]);
  });

  it("vergisst sie, wenn niemand abgewählt wurde", () => {
    const b = bogenMit("Musterhausen", ["Berger"]);
    nachzueglerMerken(b, bogenMit("Musterhausen", ["Ahlers"]).personal);
    nachzueglerMerken(b, []);
    expect(nachzueglerFuer(b)).toEqual([]);
  });
});
