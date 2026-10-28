/**
 * Runde 17, Block Zustand: Logik ohne App — „Namen einfügen…" (E1, N1, H5, S7), Zwischenstand der Sammel-PDF (A4, O1, D4),
 * Sperre unter harmlosen Quittungen (D3).
 */
import { afterEach, describe, expect, it } from "vitest";
import { KontaktArt, StaerkeRolle } from "@bos/eeb-format/model";
import { kontaktAusNummer, namenEinsetzen, parseNamen, telefonAbtrennen } from "./personal-schnell";
import { neuePerson, personUnbenannt } from "./hilfen";
import {
  PDF_GESAMT_FAKTOR,
  arbeiten,
  arbeitetZuruecksetzen,
  arbeitFortschritt,
  fortschrittMelden,
  fortschrittSatz,
  sammelPdfDauerText,
} from "./arbeitet";
import { ORTSSPERRE_MS, PRELLSCHUTZ_MS, QUITTUNG_SPERRE_KURZ_MS, QUITTUNG_SPERRE_MS } from "./tipp-schutz";

describe("R17-E1/N1 „Namen einfügen…“: Zeilen ohne Komma", () => {
  it("liest „Meier Karl“ und „Müller-Lüdenscheidt Maria“ auf Wunsch als Nachname Vorname", () => {
    const o = { reihenfolge: "nachname" } as const;
    expect(parseNamen("Meier Karl", o)[0]).toMatchObject({ nachname: "Meier", vorname: "Karl" });
    expect(parseNamen("Müller-Lüdenscheidt Maria", o)[0]).toMatchObject({ nachname: "Müller-Lüdenscheidt", vorname: "Maria" });
    // Mehrere Vornamen und Präfixe des Nachnamens.
    expect(parseNamen("Schmidt Anna Maria", o)[0]).toMatchObject({ nachname: "Schmidt", vorname: "Anna Maria" });
    expect(parseNamen("von der Heide Anna", o)[0]).toMatchObject({ nachname: "von der Heide", vorname: "Anna" });
    // Vorgabe bleibt „Vorname Nachname“.
    expect(parseNamen("Meier Karl")[0]).toMatchObject({ nachname: "Karl", vorname: "Meier" });
    expect(parseNamen("Karl Heinz Meier")[0]).toMatchObject({ nachname: "Meier", vorname: "Karl Heinz" });
  });

  it("markiert jede Zeile mit mehreren Wörtern ohne Komma „Reihenfolge prüfen“, solange nichts bestätigt ist", () => {
    const text = "Schmidt Anna Maria\nMeier Karl\nMüller\nKoch, Jan";
    const ungeprueft = parseNamen(text, { pruefen: true });
    expect(ungeprueft.map((n) => !!n.unsicher)).toEqual([true, true, false, false]);
    // Bestätigt (pruefen aus): keine Marke mehr, auch nicht bei der anderen Lesart.
    expect(parseNamen(text).some((n) => n.unsicher)).toBe(false);
    expect(parseNamen(text, { reihenfolge: "nachname" }).some((n) => n.unsicher)).toBe(false);
  });
});

describe("R17-H5 Rufnummer am Zeilenende", () => {
  it("trennt die Nummer vom Namen und gibt sie als Telefon mit", () => {
    expect(telefonAbtrennen("Kevin Meier 0171 1234567")).toEqual({ zeile: "Kevin Meier", telefon: "0171 1234567" });
    const n = parseNamen("Kevin Meier 0171 1234567")[0]!;
    expect(n).toMatchObject({ vorname: "Kevin", nachname: "Meier", telefon: "0171 1234567" });
    // Mit Komma und Funktion davor.
    expect(parseNamen("Müller, Hans, 0441 123456")[0]).toMatchObject({ nachname: "Müller", vorname: "Hans", telefon: "0441 123456" });
    // Aus einer Tabelle: die Spalte nur aus Ziffern ist die Nummer, nicht die Funktion.
    expect(parseNamen("Meier\tKlaus\t0171 5551234")[0]).toMatchObject({ nachname: "Meier", vorname: "Klaus", telefon: "0171 5551234" });
  });

  it("lässt kurze Ziffernfolgen und Zeilen ohne Buchstaben stehen (sie bleiben „kein Name?“)", () => {
    expect(telefonAbtrennen("Hans Meier 12345")).toEqual({ zeile: "Hans Meier 12345" });
    expect(telefonAbtrennen("0171 1234567")).toEqual({ zeile: "0171 1234567" });
  });

  it("macht aus der Nummer einen dienstlichen Kontakt: Mobil bei 015x/016x/017x, sonst Festnetz", () => {
    expect(kontaktAusNummer("0171 1234567")).toEqual({ art: KontaktArt.MOBIL, dienstlich: true, wert: "01711234567" });
    expect(kontaktAusNummer("+49 171 1234567")).toMatchObject({ art: KontaktArt.MOBIL, wert: "+491711234567" });
    expect(kontaktAusNummer("0441 123456")).toMatchObject({ art: KontaktArt.FESTNETZ, wert: "0441123456" });
    expect(kontaktAusNummer("12")).toBeNull();
  });
});

describe("R17-S7 „Lisa Meier, Fahrer“ und die Plätze der Funktionen", () => {
  it("erkennt ein Funktionswort hinter dem Komma als Funktion, nicht als Vornamen", () => {
    const lisa = parseNamen("Lisa Meier, Fahrer")[0]!;
    expect(lisa).toMatchObject({ vorname: "Lisa", nachname: "Meier", funktion: "Fahrer", unsicher: true });
    // Gewählte Reihenfolge gilt auch hier.
    expect(parseNamen("Meier Lisa, Fahrer", { reihenfolge: "nachname" })[0]).toMatchObject({ vorname: "Lisa", nachname: "Meier", funktion: "Fahrer" });
    // Ein echter Vorname hinter dem Komma bleibt ein Vorname.
    expect(parseNamen("Meier, Lisa")[0]).toMatchObject({ vorname: "Lisa", nachname: "Meier" });
    // Funktionskürzel hinter einem einzigen Namenswort: „Meier GrFü“ ist nicht Nachname „GrFü“.
    expect(parseNamen("Meier GrFü")[0]).toMatchObject({ nachname: "Meier", funktion: "GrFü", rolle: StaerkeRolle.UNTERFUEHRER });
  });

  it("setzt „Hans Meier GrFü“ auf den Sollplatz „GrFü“, auch wenn davor eine Zeile ohne Funktion steht", () => {
    const platz = (code: number, rolle: StaerkeRolle) => ({ ...neuePerson(), staerkeRolle: rolle, funktionen: [{ code }] });
    // Soll: 1 = GrFü (Unterführer), 2 = TrFü (Unterführer), 3 = Helfer.
    const liste = [platz(11, StaerkeRolle.UNTERFUEHRER), platz(12, StaerkeRolle.UNTERFUEHRER), platz(13, StaerkeRolle.MANNSCHAFT)];
    const ohne = { ...neuePerson(), vorname: "Anna", nachname: "Schmidt" };
    const grfue = { ...neuePerson(), vorname: "Hans", nachname: "Meier", staerkeRolle: StaerkeRolle.UNTERFUEHRER, funktionen: [{ code: 11 }] };
    const r = namenEinsetzen(liste, [ohne, grfue], personUnbenannt);
    expect(r.plaetze).toEqual([1, 0]);
    expect(r.personal[0]).toMatchObject({ nachname: "Meier", funktionen: [{ code: 11 }] });
    expect(r.personal[1]).toMatchObject({ nachname: "Schmidt", funktionen: [{ code: 12 }] });
  });

  it("nimmt die Rufnummer als Kontakt mit in den Sollplatz", () => {
    const platz = { ...neuePerson(), staerkeRolle: StaerkeRolle.MANNSCHAFT };
    const kontakt = { art: KontaktArt.MOBIL, dienstlich: true, wert: "01711234567" };
    const neu = { ...neuePerson(), vorname: "Kevin", nachname: "Meier", kontakte: [kontakt] };
    const r = namenEinsetzen([platz], [neu], personUnbenannt);
    expect(r.personal[0]!.kontakte).toEqual([kontakt]);
  });
});

describe("R17-A4/O1/D4 Zwischenstand der Sammel-PDF", () => {
  afterEach(() => arbeitetZuruecksetzen());

  it("meldet „n von m“ nur während einer laufenden Aktion und räumt danach auf", async () => {
    await fortschrittMelden("außerhalb", 1, 2); // ohne laufende Aktion: ohne Wirkung
    expect(arbeitFortschritt()).toBeNull();
    const gesehen: string[] = [];
    const r = await arbeiten("weitergeben", async () => {
      await fortschrittMelden("Bögen vorbereitet (QR-Code, Übersicht)", 0, 3);
      gesehen.push(fortschrittSatz(arbeitFortschritt()!));
      await fortschrittMelden("Bögen vorbereitet (QR-Code, Übersicht)", 2, 3);
      gesehen.push(fortschrittSatz(arbeitFortschritt()!));
      await fortschrittMelden("Datei wird geschrieben …");
      gesehen.push(fortschrittSatz(arbeitFortschritt()!));
      return 42;
    });
    expect(r).toEqual({ lief: true, wert: 42 });
    expect(gesehen).toEqual(["0 von 3 Bögen vorbereitet (QR-Code, Übersicht)", "2 von 3 Bögen vorbereitet (QR-Code, Übersicht)", "Datei wird geschrieben …"]);
    expect(arbeitFortschritt()).toBeNull();
  });

  it("richtet die Zeitangabe an der Messung aus, sobald vier Bögen vorbereitet sind", async () => {
    expect(PDF_GESAMT_FAKTOR).toBeGreaterThan(3);
    // Vorher gilt die Pauschale nach Bogenzahl, danach die Messung.
    expect(sammelPdfDauerText(30)).toMatch(/am Telefon etwa 1 Min\. oder länger/);
    expect(sammelPdfDauerText(30, 40)).toMatch(/an diesem Gerät insgesamt etwa 40 Sekunden \(an den ersten Bögen gemessen\)/);
    expect(sammelPdfDauerText(30, 130)).toMatch(/etwa 3 Min\./);
    await arbeiten("weitergeben", async () => {
      await fortschrittMelden("x", 0, 30);
      expect(arbeitFortschritt()!.schaetzungSek).toBeUndefined();
      // Vier Bögen in ~2 s (zeitJetzt = performance.now): 0,5 s je Bogen · 30 · 4,2 ≈ 63 s → 65.
      await new Promise((f) => setTimeout(f, 600));
      await fortschrittMelden("x", 4, 30);
      const s = arbeitFortschritt()!.schaetzungSek!;
      expect(s % 5).toBe(0);
      expect(s).toBeGreaterThanOrEqual(5);
      // Die Schätzung bleibt in den Schritten ohne Zähler stehen.
      await fortschrittMelden("Seiten werden gesetzt");
      expect(arbeitFortschritt()!.schaetzungSek).toBe(s);
    });
  });

  it("sperrt die Aktion bis zum Ende und schließt beim Verlassen der Seite nicht still (beforeunload nur währenddessen)", async () => {
    // Node ohne `window`: arbeiten() darf daran nicht scheitern.
    const r = await arbeiten("a", async () => {
      const zweite = await arbeiten("b", async () => 1);
      expect(zweite).toEqual({ lief: false });
      return 1;
    });
    expect(r).toEqual({ lief: true, wert: 1 });
  });
});

describe("R17-D3 Sperre unter harmlosen Quittungen", () => {
  it("deckt den Prellschutz, aber nicht die lange Sperre des Abrückens", () => {
    expect(QUITTUNG_SPERRE_KURZ_MS).toBe(PRELLSCHUTZ_MS);
    expect(QUITTUNG_SPERRE_KURZ_MS).toBeLessThan(QUITTUNG_SPERRE_MS);
    // R18: „Rückgängig" ist nie gesperrt; die Sperre schützt nur den Knopf unter einer schwebenden Leiste und ist so lang wie die Ortssperre.
    expect(QUITTUNG_SPERRE_MS).toBe(ORTSSPERRE_MS);
  });
});
