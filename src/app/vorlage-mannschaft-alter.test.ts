// @vitest-environment jsdom
/**
 * Erinnerung „Mannschaft noch aktuell?" und Zählung privater Kontakte (DSFA M15).
 */
import { beforeEach, describe, expect, it } from "vitest";
import { KontaktArt } from "@bos/eeb-format/model";
import { neuerBogen, neuePerson } from "./hilfen";
import {
  VORLAGE_PRUEFEN_TAGE,
  mannschaftAlterTage,
  mannschaftBestaetigen,
  mannschaftPruefen,
  privateKontakte,
  vorlageAktualisieren,
  vorlageAnlegen,
  vorlageUmbenennen,
  vorlagenLaden,
} from "./vorlagen";

const TAG = 86_400_000;

describe("Alter der Mannschaft", () => {
  beforeEach(() => localStorage.clear());

  it("zählt ab der Bestätigung, ältere Vorlagen ohne Feld ab der letzten Änderung", () => {
    const jetzt = Date.now();
    expect(mannschaftAlterTage({ geaendert: jetzt - 10 * TAG }, jetzt)).toBe(10);
    expect(mannschaftAlterTage({ geaendert: jetzt - 10 * TAG, mannschaftGeprueft: jetzt - 3 * TAG }, jetzt)).toBe(3);
    // Verstellte Uhr: nie negativ.
    expect(mannschaftAlterTage({ geaendert: jetzt + 5 * TAG }, jetzt)).toBe(0);
  });

  it("erinnert erst ab der Schwelle", () => {
    const jetzt = Date.now();
    expect(mannschaftPruefen({ geaendert: jetzt - (VORLAGE_PRUEFEN_TAGE - 1) * TAG }, jetzt)).toBe(false);
    expect(mannschaftPruefen({ geaendert: jetzt - VORLAGE_PRUEFEN_TAGE * TAG }, jetzt)).toBe(true);
  });

  it("Umbenennen setzt die Frist nicht zurück, Aktualisieren und „Stimmt noch“ schon", () => {
    const v = vorlageAnlegen("Zug", neuerBogen());
    expect(v.mannschaftGeprueft).toBe(v.erstellt);
    const alt = Date.now() - 200 * TAG;
    localStorage.setItem(
      "eeb.vorlagen.v1",
      JSON.stringify(vorlagenLaden().map((x) => ({ ...x, geaendert: alt, mannschaftGeprueft: alt }))),
    );
    vorlageUmbenennen(v.id, "Zug neu");
    expect(mannschaftPruefen(vorlagenLaden()[0]!)).toBe(true);
    mannschaftBestaetigen(v.id);
    expect(mannschaftPruefen(vorlagenLaden()[0]!)).toBe(false);
    localStorage.setItem(
      "eeb.vorlagen.v1",
      JSON.stringify(vorlagenLaden().map((x) => ({ ...x, mannschaftGeprueft: alt }))),
    );
    vorlageAktualisieren(v.id, neuerBogen());
    expect(mannschaftPruefen(vorlagenLaden()[0]!)).toBe(false);
  });
});

describe("privateKontakte", () => {
  it("zählt nur private Rufnummern und Adressen, keine dienstlichen und keine Funkrufnamen", () => {
    const b = neuerBogen();
    b.personal = [
      {
        ...neuePerson(),
        vorname: "A",
        nachname: "B",
        kontakte: [
          { art: KontaktArt.MOBIL, dienstlich: false, wert: "0171" },
          { art: KontaktArt.EMAIL, dienstlich: false, wert: "a@b.de" },
          { art: KontaktArt.MOBIL, dienstlich: true, wert: "0172" },
          { art: KontaktArt.FUNK, dienstlich: false, wert: "Heros 1" },
        ],
      },
      { ...neuePerson(), vorname: "C", nachname: "D" },
    ];
    expect(privateKontakte(b)).toBe(2);
  });
});
