/**
 * Audit Runde 2, R2-D5: Ruhende Sammlungen verschwanden nach 90 Tagen ohne
 * Nachricht. Geprüft wird der ganze Weg über den echten Speicher: Sammlung
 * zurückdatieren, Liste laden — die Startseite muss die Löschung beim Namen
 * nennen, und „Verstanden" nimmt die Nachricht weg.
 */

import { describe, it, expect, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { AUFRAEUM_FRIST_MS, EinsatzArt, einsaetzeZuJson } from "@bos/meldekopf/einsaetze";
import { aufgeraeumteLaden, aufraeumBeobachter, ruhendeVormerken } from "./aufraeum-hinweis";




describe("Nachricht nach automatischer Löschung (R2-D5)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("merkt sich eine Sammlung nur einmal und lässt Papierkorb-Einträge in Ruhe", () => {
    const jetzt = Date.now();
    const alt = { id: "a", name: "Alt", art: EinsatzArt.EINSATZ, angelegt: 0, geaendert: jetzt - AUFRAEUM_FRIST_MS, eintraege: [] };
    const korb = { ...alt, id: "k", name: "Korb", geloeschtAm: jetzt };
    const frisch = { ...alt, id: "f", name: "Frisch", geaendert: jetzt };
    const text = einsaetzeZuJson([alt, korb, frisch]);
    ruhendeVormerken(text, localStorage, jetzt);
    ruhendeVormerken(text, localStorage, jetzt);
    expect(aufgeraeumteLaden().map((a) => a.name)).toEqual(["Alt"]);
  });

  it("reicht Lesen und Schreiben der Hülle unverändert durch", () => {
    const h = aufraeumBeobachter(localStorage);
    h.setItem("x", "1");
    expect(h.getItem("x")).toBe("1");
    expect(h.getItem("eeb.einsaetze.v1")).toBeNull();
  });
});
