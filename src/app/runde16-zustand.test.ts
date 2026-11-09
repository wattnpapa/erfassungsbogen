/**
 * Runde 16, Block Zustand: Logik ohne App — Namenslisten aus Tabellen (E1), Papier-Abgleich beim endgültigen Löschen (O1).
 */
import { describe, expect, it } from "vitest";
import { StaerkeRolle } from "@bos/eeb-format/model";
import { namenVerdachtGruende, parseNamen } from "./personal-schnell";
import { telefonBereinigen } from "./telefon-eingabe";

describe("R16-E3 Telefonfeld: Ziffern aus einem Zusatz wachsen nicht an die Nummer", () => {
  it("„0441 123456 App 12“ bleibt 0441123456, der Hinweis nennt den Zusatz als Ganzes", () => {
    const r = telefonBereinigen("0441 123456 App 12");
    expect(r.wert).toBe("0441123456");
    expect(r.hinweis).toContain("App 12");
    expect(r.hinweis).toContain("nicht angehängt");
  });

  it("die gewohnten Fälle bleiben: reiner Zusatz ohne Ziffern, Plus, Nummer mit Schrägstrich", () => {
    expect(telefonBereinigen("0441 abc")).toMatchObject({ wert: "0441", hinweis: expect.stringContaining("Nur Ziffern übernommen") });
    expect(telefonBereinigen("+49 441 123456")).toEqual({ wert: "+49441123456", hinweis: "" });
    expect(telefonBereinigen("0441/12345-0").wert).toBe("0441123450");
  });
});

describe("R16-E1 Namenslisten aus Tabellen und Nachrichten", () => {
  it("Tabulator-Spalten Nachname, Vorname, Funktion werden als Spalten gelesen", () => {
    const [meier, schmidt, hans] = parseNamen("Meier\tKlaus\tFührer\nSchmidt\tAnna\nHans Müller\tGrFü");
    expect(meier).toMatchObject({ nachname: "Meier", vorname: "Klaus", funktion: "Führer" });
    expect(schmidt).toEqual({ nachname: "Schmidt", vorname: "Anna" });
    // Zwei Wörter in Spalte 1: das ist schon der ganze Name, Spalte 2 die Funktion (R11-H4 bleibt).
    expect(hans).toMatchObject({ nachname: "Müller", vorname: "Hans", funktion: "GrFü", rolle: StaerkeRolle.UNTERFUEHRER });
  });

  it("eine Funktion in Spalte 2 bleibt Funktion, auch ohne Vornamen", () => {
    expect(parseNamen("Meier\tGrFü")[0]).toMatchObject({ nachname: "Meier", vorname: "", funktion: "GrFü" });
    expect(parseNamen("Koch\tHelfer")[0]).toMatchObject({ nachname: "Koch", vorname: "", funktion: "Helfer" });
  });

  it("Semikolon (deutsches CSV) trennt wie der Tabulator, Anführungszeichen entfallen", () => {
    expect(parseNamen("Koch;Jan;Helfer")[0]).toMatchObject({ nachname: "Koch", vorname: "Jan", funktion: "Helfer" });
    expect(parseNamen('"Koch";"Jan";"ZFhr"')[0]).toMatchObject({ nachname: "Koch", vorname: "Jan", rolle: StaerkeRolle.FUEHRER });
  });

  it("drei Wörter ohne Komma: Funktionswort am Ende ist Funktion, Reihenfolge wird zur Prüfung markiert", () => {
    expect(parseNamen("Mustermann Max Truppführer")[0]).toMatchObject({ funktion: "Truppführer", unsicher: true });
    expect(parseNamen("Max Mustermann Helfer")[0]).toMatchObject({ nachname: "Mustermann", vorname: "Max", funktion: "Helfer" });
    // Ohne Funktion gilt „Vorname [weitere Vornamen] Nachname"; die Vorschau zeigt die Lesart.
    expect(parseNamen("Anna Maria Schmidt")[0]).toEqual({ nachname: "Schmidt", vorname: "Anna Maria" });
    // Mit Namenspräfix ist die Lesart eindeutig; zwei Wörter sowieso.
    expect(parseNamen("Max von Mustermann")[0]).toEqual({ vorname: "Max", nachname: "von Mustermann" });
    expect(parseNamen("Max Mustermann")[0]?.unsicher).toBeUndefined();
  });

  it("„Meier, Klaus - Gruppenführer“: der Zusatz ist die Funktion, nicht Teil des Vornamens", () => {
    expect(parseNamen("Meier, Klaus - Gruppenführer")[0]).toMatchObject({
      nachname: "Meier",
      vorname: "Klaus",
      funktion: "Gruppenführer",
      rolle: StaerkeRolle.UNTERFUEHRER,
    });
    expect(parseNamen("Meier, Anna-Lena")[0]).toEqual({ nachname: "Meier", vorname: "Anna-Lena" });
  });

  it("der Hinweis nennt den tatsächlichen Grund statt immer „Ziffern, Klammern“", () => {
    expect(namenVerdachtGruende([{ vorname: "", nachname: "A1" }])).toBe("Ziffern");
    expect(namenVerdachtGruende([{ vorname: "", nachname: "Meier (Neu)" }])).toBe("Klammern");
    expect(namenVerdachtGruende([{ vorname: "", nachname: "<b>" }])).toBe("Sonderzeichen");
    expect(namenVerdachtGruende([{ vorname: "", nachname: "A1" }, { vorname: "", nachname: "[x]" }])).toBe("Ziffern, Klammern");
  });
});
