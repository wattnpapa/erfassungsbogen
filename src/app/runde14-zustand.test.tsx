/**
 * Runde 14, Block Zustand: Logik ohne Oberfläche — Doppeltipp-Nachlauf (G1), Sicherung und Vorratsstand (O2),
 * Telefonprüfung der Absenderkarte (E5), Entfernen-Bezug (D1), Beispiel-Herkunft (E6), Bildlaufstelle (S2),
 * Umbruchstellen in Adressen (S4), Stilregel für das Handscanner-Fenster (E2).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { sicherungEinspielen, sicherungInhalt, ZUSATZ_STAND_SCHLUESSEL } from "./sicherung";
import { absenderHinweis, telefonProblem } from "./absenderkarte";
import { BEISPIEL_HERKUNFT_SCHLUESSEL, beispielMerken, beispielRestText, beispielVergessen } from "./beispiel-herkunft";
import { ANSICHT_STELLE_SCHLUESSEL, stelleLaden } from "./ansicht-stelle";
import { neuePerson, neuerBogen } from "./hilfen";
import { KontaktArt } from "@bos/eeb-format/model";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("R14-O2 Sicherung einspielen lässt den Vorratsstand beim Gerät", () => {
  it("die Datei vom vollständigen Gerät überschreibt „n von 549“ nicht", () => {
    localStorage.setItem(ZUSATZ_STAND_SCHLUESSEL, JSON.stringify({ fertig: 57, gesamt: 549 }));
    localStorage.setItem("eeb.vorlagen.v1", "[]");
    const datei = sicherungInhalt({
      "eeb.vorlagen.v1": "[1]",
      [ZUSATZ_STAND_SCHLUESSEL]: JSON.stringify({ fertig: 549, gesamt: 549 }),
    });
    expect(sicherungEinspielen(datei)).toBe(1);
    expect(localStorage.getItem("eeb.vorlagen.v1")).toBe("[1]");
    expect(JSON.parse(localStorage.getItem(ZUSATZ_STAND_SCHLUESSEL)!)).toEqual({ fertig: 57, gesamt: 549 });
  });

  it("der Schlüssel ist derselbe wie der des Vorrats (offline-bereit.ts)", () => {
    const quelle = readFileSync(join(process.cwd(), "src/app/offline-bereit.ts"), "utf8");
    expect(quelle).toContain(`"${ZUSATZ_STAND_SCHLUESSEL}"`);
  });

  it("ein Gerät ohne eigenen Vorratsstand bekommt auch keinen aus der Datei", () => {
    const datei = sicherungInhalt({ [ZUSATZ_STAND_SCHLUESSEL]: JSON.stringify({ fertig: 549, gesamt: 549 }) });
    sicherungEinspielen(datei);
    expect(localStorage.getItem(ZUSATZ_STAND_SCHLUESSEL)).toBeNull();
  });
});

describe("R14-E5 Telefonnummer der Absenderkarte wie im Assistenten prüfen", () => {
  it("Buchstaben, zweite Nummer und zu wenige Ziffern fallen auf; saubere Nummern nicht", () => {
    expect(telefonProblem("0170 1234567")).toBeNull();
    expect(telefonProblem("+49 170 1234567")).toBeNull();
    expect(telefonProblem("")).toBeNull();
    expect(telefonProblem("abc")?.wert).toBe("");
    expect(telefonProblem("12")?.text).toContain("unvollständig");
    const buchstaben = telefonProblem("0170 abc");
    expect(buchstaben?.text).toContain("abc");
    expect(buchstaben?.wert).toBe("0170");
    const zwei = telefonProblem("0171 1234567 / 0441 99887");
    expect(zwei?.text).toContain("Zweite Nummer");
    expect(zwei?.wert).toBe("01711234567");
  });

  it("der Hinweis unter dem Feld nennt dieselben Fälle", () => {
    expect(absenderHinweis({ name: "Max", telefon: "0170 abc" })).toContain("abc");
    expect(absenderHinweis({ name: "Max", telefon: "0171 1234567 / 0441 99" })).toContain("Zweite Nummer");
    expect(absenderHinweis({ name: "Max", telefon: "0170 1234567" })).toBe("");
  });
});

describe("R14-E6 Beispieldaten im Bogen", () => {
  function bogenMit(namen: [string, string][], nummer?: string) {
    const b = neuerBogen();
    b.personal = namen.map(([n, v]) => {
      const p = neuePerson();
      p.nachname = n;
      p.vorname = v;
      if (nummer) p.kontakte = [{ art: KontaktArt.MOBIL, dienstlich: true, wert: nummer }];
      return p;
    });
    return b;
  }

  it("erkennt Namen und Nummern aus dem Beispiel, bis sie ersetzt sind", () => {
    const beispiel = bogenMit([["Lang", "Sabine"], ["Sommer", "Sandra"]], "5556968346");
    beispielMerken(beispiel);
    expect(JSON.parse(localStorage.getItem(BEISPIEL_HERKUNFT_SCHLUESSEL)!)).toEqual(["n:lang, sabine", "t:5556968346", "n:sommer, sandra"]);
    expect(beispielRestText(beispiel)).toContain("2 Personen („Lang, Sabine“, „Sommer, Sandra“) und 1 Rufnummer");
    // Teilweise ersetzt: Eine Person und die Nummer stehen noch drin.
    const teilweise = bogenMit([["Lang", "Sabine"]], "5556968346");
    expect(beispielRestText(teilweise)).toContain("1 Person („Lang, Sabine“) und 1 Rufnummer");
    // Alles ersetzt: kein Satz mehr.
    const ersetzt = bogenMit([["Echt", "Erika"]], "01701234567");
    expect(beispielRestText(ersetzt)).toBe("");
  });

  it("vergisst alles, sobald kein Bogen mehr offen ist; ohne Speicher fragt die App nicht", () => {
    const beispiel = bogenMit([["Lang", "Sabine"]]);
    beispielMerken(beispiel);
    beispielVergessen();
    expect(localStorage.getItem(BEISPIEL_HERKUNFT_SCHLUESSEL)).toBeNull();
    expect(beispielRestText(beispiel)).toBe("");
  });
});

describe("R14-S2 Bildlaufstelle über das Neuladen", () => {

  it("kaputter Wert im Speicher ergibt keine Stelle statt eines Fehlers", () => {
    sessionStorage.setItem(ANSICHT_STELLE_SCHLUESSEL, "{kaputt");
    expect(stelleLaden("start")).toBeNull();
  });
});

describe("R14-E2 Handscanner-Fenster: Fremdtext bricht um", () => {
  it("die Zeilen im Scanner-Fenster dürfen umbrechen und das Fenster nicht verbreitern", () => {
    const html = readFileSync(join(process.cwd(), "index.html"), "utf8");
    const abschnitt = html.slice(html.indexOf("Runde 14 (Zustand)"), html.indexOf("Ende Runde 14 (Zustand)"));
    expect(abschnitt).toMatch(/\.scanner-handscanner p[^{]*\{[^}]*overflow-wrap:\s*anywhere/);
    expect(abschnitt).toMatch(/\.scanner-handscanner[^{]*\{[^}]*min-width:\s*0/);
  });
});
