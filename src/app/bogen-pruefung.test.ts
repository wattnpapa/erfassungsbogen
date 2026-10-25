/** Audit Runde 5, R5-E1: Pflichtfelder prüfen, Harmloses ergänzen, sonst mit Ursache ablehnen. */
import { describe, expect, it } from "vitest";
import { OrganisationsTyp, PersonalErfassung, SCHEMA_VERSION } from "@bos/eeb-format/model";
import { bogenBefund } from "./bogen-pruefung";

function roh(): Record<string, unknown> {
  return {
    schemaVersion: SCHEMA_VERSION,
    stand: 100,
    einheit: { organisation: OrganisationsTyp.THW, einheitsTyp: { code: 1 }, hierarchie: [{ bezeichnung: { code: 1 }, name: "OV Ulm" }] },
    einsatz: { zeitraumVon: 100, zeitraumBis: 130, ortAuftrag: "Lage" },
    personalErfassung: PersonalErfassung.VOLLSTAENDIG,
    personal: [],
    fahrzeuge: [],
  };
}

describe("bogenBefund()", () => {
  it("nimmt einen vollständigen Bogen unverändert an", () => {
    const r = bogenBefund(roh());
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.ergaenzt).toEqual([]);
  });

  it("ergänzt einen fehlenden Einheitstyp leer, statt die App abstürzen zu lassen", () => {
    const b = roh();
    delete (b.einheit as Record<string, unknown>).einheitsTyp;
    const r = bogenBefund(b);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.bogen.einheit.einheitsTyp).toEqual({});
      expect(r.ergaenzt).toContain("Einheitstyp (leer gesetzt)");
    }
  });

  it.each(["hierarchie", "fahrzeuge", "sofortbedarf"])("verträgt ein fehlendes oder kaputtes %s", (feld) => {
    const b = roh();
    if (feld === "hierarchie") delete (b.einheit as Record<string, unknown>).hierarchie;
    else if (feld === "fahrzeuge") delete b.fahrzeuge;
    else b.sofortbedarf = "kaputt";
    const r = bogenBefund(b);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(Array.isArray(r.bogen.einheit.hierarchie)).toBe(true);
      expect(Array.isArray(r.bogen.fahrzeuge)).toBe(true);
      expect(r.bogen.sofortbedarf).toBeUndefined();
    }
  });

  it("ergänzt Listen und Namen einer unvollständigen Person", () => {
    const b = roh();
    b.personal = [{ nachname: "Berger" }, 7];
    const r = bogenBefund(b);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.bogen.personal).toHaveLength(1);
      expect(r.bogen.personal[0]!.funktionen).toEqual([]);
      expect(r.bogen.personal[0]!.kontakte).toEqual([]);
      expect(r.ergaenzt).toContain("unlesbare Person entfernt");
    }
  });

  it.each([
    ["stand", "der Stand"],
    ["einheit", "die Einheit fehlt"],
    ["einsatz", "die Angaben zum Einsatz"],
    ["personal", "die Personenliste"],
    ["personalErfassung", "die Erfassungsart"],
  ])("lehnt einen Bogen ohne %s mit Ursache ab", (feld, text) => {
    const b = roh();
    delete b[feld];
    const r = bogenBefund(b);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.ursache).toContain(text);
  });

  it("lehnt eine Einheit ohne Organisation und einen Einsatz ohne Zeitraum ab", () => {
    const a = roh();
    delete (a.einheit as Record<string, unknown>).organisation;
    expect(bogenBefund(a)).toMatchObject({ ok: false });
    const z = roh();
    delete (z.einsatz as Record<string, unknown>).zeitraumBis;
    expect(bogenBefund(z)).toEqual({ ok: false, ursache: "der Einsatzzeitraum fehlt" });
  });

  it("verwirft eine unlesbare Stärkeangabe, behält eine gültige", () => {
    const b = roh();
    b.staerkeManuell = { fuehrer: "x" };
    const r = bogenBefund(b);
    expect(r.ok && r.bogen.staerkeManuell).toBeFalsy();
    const g = roh();
    g.staerkeManuell = { fuehrer: 0, unterfuehrer: 2, mannschaft: 6, gesamt: 8 };
    const r2 = bogenBefund(g);
    expect(r2.ok && r2.bogen.staerkeManuell?.gesamt).toBe(8);
  });
});
