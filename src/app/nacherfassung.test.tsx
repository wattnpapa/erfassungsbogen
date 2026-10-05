/**
 * Nacherfassung vom Papier (Audit Runde 2, R2-A5): Namensvarianten wie
 * „OV Albstadt" lösen die Ähnlichkeitsrückfrage aus, die Uhrzeit vom
 * Meldeblock wird zum Zeitpunkt.
 */
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { EintreffzeitFeld, aehnlicherOrt, andererEinheitstyp, eintreffzeitAusUhrzeit, ortWoerter } from "./nacherfassung";

describe("aehnlicherOrt", () => {
  it("erkennt den Runde-1-Prüffall „OV Albstadt“ ~ „Albstadt“", () => {
    expect(aehnlicherOrt("OV Albstadt", "Albstadt")).toBe(true);
    expect(aehnlicherOrt("Albstadt", "ov albstadt")).toBe(true);
    expect(aehnlicherOrt("Ortsverband Albstadt", "THW Albstadt")).toBe(true);
  });

  it("erkennt einen Ort als Teil des anderen", () => {
    expect(aehnlicherOrt("Biberach", "Biberach/Riß")).toBe(true);
    expect(aehnlicherOrt("Albstadt-Ebingen", "Albstadt")).toBe(true);
  });

  it("bleibt still bei anderen Orten und leeren Angaben", () => {
    expect(aehnlicherOrt("Albstadt", "Balingen")).toBe(false);
    expect(aehnlicherOrt("Neustadt", "Neustadt-Glewe")).toBe(true);
    expect(aehnlicherOrt("Stadt", "Albstadt")).toBe(false); // nur ganze Wörter
    expect(aehnlicherOrt("", "Albstadt")).toBe(false);
    expect(aehnlicherOrt("OV", "Albstadt")).toBe(false);
  });

  // Audit Runde 4, R4-E1: „Neu-Ulm" enthielt „Ulm" — zwei Ortsverbände.
  it("vergleicht nur vom Anfang des Namens: „Neu-Ulm“ ist nicht „Ulm“", () => {
    expect(aehnlicherOrt("Neu-Ulm", "Ulm")).toBe(false);
    expect(aehnlicherOrt("OV Ulm", "THW Neu-Ulm")).toBe(false);
    expect(aehnlicherOrt("Ulm", "Ulm")).toBe(true);
  });

  it("streift Vorsätze nur ab, wenn danach noch ein Ort bleibt", () => {
    expect(ortWoerter("OV THW Albstadt")).toEqual(["albstadt"]);
    expect(ortWoerter("THW")).toEqual(["thw"]);
  });
});

describe("andererEinheitstyp (R4-E1)", () => {
  it("unterscheidet zwei eingetragene, verschiedene Typen", () => {
    expect(andererEinheitstyp({ einheitsTyp: { code: 1 } }, { einheitsTyp: { code: 2 } })).toBe(true);
    expect(andererEinheitstyp({ einheitsTyp: { freitext: "FGr R" } }, { einheitsTyp: { freitext: "B" } })).toBe(true);
  });

  it("fragt weiter, wenn der Typ gleich ist oder auf einer Seite fehlt", () => {
    expect(andererEinheitstyp({ einheitsTyp: { code: 1 } }, { einheitsTyp: { code: 1 } })).toBe(false);
    expect(andererEinheitstyp({ einheitsTyp: { freitext: "FGr R" } }, { einheitsTyp: { freitext: " fgr r" } })).toBe(false);
    expect(andererEinheitstyp({ einheitsTyp: {} }, { einheitsTyp: { code: 2 } })).toBe(false);
  });
});

describe("eintreffzeitAusUhrzeit", () => {
  const jetzt = new Date(2026, 8, 28, 14, 5).getTime();

  it("liest „09:40“ als heute 09:40", () => {
    expect(eintreffzeitAusUhrzeit("09:40", jetzt)).toBe(new Date(2026, 8, 28, 9, 40).getTime());
  });

  it("nimmt eine Uhrzeit weit in der Zukunft als gestern (über Mitternacht)", () => {
    const kurzNachMitternacht = new Date(2026, 8, 29, 0, 20).getTime();
    expect(eintreffzeitAusUhrzeit("23:50", kurzNachMitternacht)).toBe(new Date(2026, 8, 28, 23, 50).getTime());
  });

  it("lässt eine Uhrzeit knapp nach jetzt am heutigen Tag", () => {
    expect(eintreffzeitAusUhrzeit("14:10", jetzt)).toBe(new Date(2026, 8, 28, 14, 10).getTime());
  });

  it("gibt bei leer oder unlesbar null zurück", () => {
    expect(eintreffzeitAusUhrzeit("", jetzt)).toBeNull();
    expect(eintreffzeitAusUhrzeit("25:00", jetzt)).toBeNull();
    expect(eintreffzeitAusUhrzeit("9.40", jetzt)).toBeNull();
  });
});

describe("EintreffzeitFeld", () => {
  it("meldet die eingegebene Uhrzeit", () => {
    let wert = "";
    render(<EintreffzeitFeld wert="" onAendern={(w) => (wert = w)} />);
    fireEvent.change(screen.getByLabelText("Eingetroffen um (vom Meldeblock)"), { target: { value: "09:40" } });
    expect(wert).toBe("09:40");
  });
});
