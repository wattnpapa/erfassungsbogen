/**
 * Große Systemschrift erkennen (Audit Runde 5, R5-M3, R5-G6): Das Stylesheet
 * verdichtet bei großer Schrift und niedrigem Fenster; die Klasse dafür setzt
 * schrift-stufe.ts nach der tatsächlichen Grundschrift, nicht nach einer
 * Medienabfrage (die sieht `html { font-size }` nicht).
 */
import { afterEach, describe, expect, it } from "vitest";
import { SCHRIFT_GROSS_AB_PX, SCHRIFT_GROSS_KLASSE, schriftStufeAnwenden } from "./schrift-stufe";

describe("Große Schrift erkennen", () => {
  afterEach(() => {
    document.documentElement.style.fontSize = "";
    document.documentElement.classList.remove(SCHRIFT_GROSS_KLASSE);
  });

  it("setzt die Klasse ab 22 px Grundschrift und nimmt sie wieder weg", () => {
    expect(SCHRIFT_GROSS_AB_PX).toBe(22);
    document.documentElement.style.fontSize = "32px";
    expect(schriftStufeAnwenden()).toBe(true);
    expect(document.documentElement.classList.contains(SCHRIFT_GROSS_KLASSE)).toBe(true);
    // Der Feld-Modus (112 % = 17,9 px) zählt nicht als große Schrift.
    document.documentElement.style.fontSize = "17.92px";
    expect(schriftStufeAnwenden()).toBe(false);
    expect(document.documentElement.classList.contains(SCHRIFT_GROSS_KLASSE)).toBe(false);
  });
});
