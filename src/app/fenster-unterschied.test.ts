/** Was unterscheidet die Fassung des anderen Fensters? (Audit Runde 7, R7-O2, R7-W5) */
import { describe, expect, it } from "vitest";
import { neuePerson, neuerBogen } from "./hilfen";
import { unterschiedText, zeitMitSekunden } from "./fenster-unterschied";

describe("unterschiedText", () => {
  it("nennt das geänderte Feld, wenn nur der Ort anders ist", () => {
    const a = neuerBogen();
    const b = structuredClone(a);
    b.einsatz.ortAuftrag = "Nordhafen";
    expect(unterschiedText(a, b)).toBe("Ort / Auftrag");
  });

  it("nennt Personal und Fahrzeuge als Abschnitt mit Zahl", () => {
    const a = neuerBogen();
    const b = structuredClone(a);
    b.personal = [...b.personal, { ...neuePerson(), nachname: "Neu", vorname: "Nina" }];
    expect(unterschiedText(a, b)).toBe("Personal (1 Eintrag: Neu, Nina)");
  });

  it("zählt eine umbenannte Person einmal und nennt beide Namen (R8-E4)", () => {
    const a = neuerBogen();
    a.personal = [{ ...neuePerson(), nachname: "Muster", vorname: "Sandra" }];
    const b = structuredClone(a);
    b.personal[0]!.vorname = "QQQ";
    const t = unterschiedText(a, b);
    expect(t).toMatch(/^Personal \(1 Eintrag: Muster, Sandra → Muster, QQQ\)$/);
  });

  it("nennt mit `werte` beide Texte des Feldes, lange gekürzt (R8-N6)", () => {
    const a = neuerBogen();
    const b = structuredClone(a);
    a.einsatz.ortAuftrag = "Alter Ort";
    b.einsatz.ortAuftrag = "Neuer Ort am Nordhafen, Pumpen und Sandsäcke für die gesamte Lage";
    const t = unterschiedText(a, b, 4, { werte: true });
    expect(t).toContain("dort: „Neuer Ort am Nordhafen, Pum…“");
    expect(t).toContain("hier: „Alter Ort“");
    expect(unterschiedText(a, b)).toBe("Ort / Auftrag");
  });

  it("ist leer bei gleichem Inhalt", () => {
    const a = neuerBogen();
    expect(unterschiedText(a, structuredClone(a))).toBe("");
  });
});

describe("zeitMitSekunden", () => {
  it("nennt heute nur die Uhrzeit mit Sekunden", () => {
    expect(zeitMitSekunden(Date.now())).toMatch(/^\d\d:\d\d:\d\d Uhr$/);
  });
  it("nennt an einem anderen Tag das Datum dazu", () => {
    expect(zeitMitSekunden(Date.now() - 3 * 86_400_000)).toMatch(/^\d\d\.\d\d\.\d\d, \d\d:\d\d:\d\d Uhr$/);
  });
});
