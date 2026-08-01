import { describe, it, expect } from "vitest";
import {
  bereichLabel,
  bundeslandLabel,
  hatLandesvorlagen,
  landesvorlage,
  landesvorlagenBundeslaender,
  landesvorlagenGruppen,
} from "./landesvorlagen";
import { Ernaehrung, Fahrerlaubnis, OrganisationsTyp, StaerkeRolle } from "../model";

// Die Vorlagen entstehen zur Bauzeit aus den Beispielbögen unter
// examples/<bereich>/<bundesland>/. Geprüft wird deshalb nicht der Inhalt
// einzelner Einheiten (der wandert mit den Generatorskripten), sondern die
// Ableitung: richtige Zuordnung von Bereich und Bundesland, Gruppierung der
// Auswahlliste und das Leerräumen personen-/ortsbezogener Angaben.

describe("Landesvorlagen", () => {
  it("führt Katastrophenschutz und Feuerwehrverordnung getrennt, KatS zuerst", () => {
    const gruppen = landesvorlagenGruppen(OrganisationsTyp.FEUERWEHR, "niedersachsen");

    expect(gruppen.map((g) => g.bereich)).toEqual(["katastrophenschutz", "feuerwehr"]);
    // Die taktischen Einheiten der Nds. FwVO stehen im Feuerwehr-Bereich …
    const feuerwehr = gruppen.find((g) => g.bereich === "feuerwehr")!;
    expect(feuerwehr.namen).toContain("Gruppe");
    expect(feuerwehr.namen).toContain("Grundausstattungsfeuerwehr");
    // … und nicht in dem der KatS-StAN.
    const kats = gruppen.find((g) => g.bereich === "katastrophenschutz")!;
    expect(kats.namen).not.toContain("Gruppe");
    expect(kats.namen).toContain("Löschgruppe Katastrophenschutz (LG KatS)");
  });

  it("führt die DRK-Bereitschaft als eigene Gruppe hinter den landesrechtlichen", () => {
    const gruppen = landesvorlagenGruppen(OrganisationsTyp.DRK, "niedersachsen");

    expect(gruppen.map((g) => g.bereich)).toEqual(["katastrophenschutz", "drk"]);
    const drk = gruppen.find((g) => g.bereich === "drk")!;
    expect(drk.namen).toContain("Verpflegungsgruppe (Bereitschaft)");
    // Die Teileinheiten der Bereitschaft stehen nicht bei der KatS-StAN …
    const kats = gruppen.find((g) => g.bereich === "katastrophenschutz")!;
    expect(kats.namen).not.toContain("Verpflegungsgruppe (Bereitschaft)");
    // … und die Vorlage bringt Stärkeplätze und Fahrzeuge mit.
    const v = landesvorlage(OrganisationsTyp.DRK, "niedersachsen", "Verpflegungsgruppe (Bereitschaft)")!;
    expect(v.personal).toHaveLength(9);
    expect(v.fahrzeuge.map((f) => f.typ.freitext)).toEqual([
      "MTW",
      "Anh. Verpflegung",
      "Anh. Feldküche",
      "Anh. Kühl",
    ]);
    for (const f of v.fahrzeuge) expect(f.funkrufname).toBeUndefined();
  });

  it("sortiert die Einheiten je Bereich alphabetisch", () => {
    for (const g of landesvorlagenGruppen(OrganisationsTyp.FEUERWEHR, "niedersachsen")) {
      expect(g.namen).toEqual([...g.namen].sort((a, b) => a.localeCompare(b, "de")));
    }
  });

  it("belegt die Gruppe nach § 2 Abs. 2 Nr. 3 mit neun offenen Stärkeplätzen vor", () => {
    const v = landesvorlage(OrganisationsTyp.FEUERWEHR, "niedersachsen", "Gruppe");

    expect(v).toBeDefined();
    expect(v!.bereich).toBe("feuerwehr");
    expect(v!.personal).toHaveLength(9);
    // Ein Führer (Gruppenführung), drei Unterführer (Truppführungen).
    expect(v!.personal.filter((p) => p.staerkeRolle === StaerkeRolle.FUEHRER)).toHaveLength(1);
    expect(v!.personal.filter((p) => p.staerkeRolle === StaerkeRolle.UNTERFUEHRER)).toHaveLength(3);
    // Funktion bleibt, Person nicht.
    expect(v!.personal[0]!.funktionen[0]!.freitext).toContain("Gruppenführer");
    for (const p of v!.personal) {
      expect(p.vorname).toBe("");
      expect(p.nachname).toBe("");
      expect(p.kontakte).toEqual([]);
      expect(p.fahrerlaubnis).toBe(Fahrerlaubnis.NONE);
      expect(p.ernaehrung).toBe(Ernaehrung.FLEISCH);
    }
  });

  it("übernimmt Fahrzeuge ohne Kennzeichen und ohne Funkrufname", () => {
    const v = landesvorlage(OrganisationsTyp.FEUERWEHR, "niedersachsen", "Schwerpunktfeuerwehr (Zug, Variante 1)");

    expect(v!.fahrzeuge.map((f) => f.typ.freitext)).toEqual(["ELW 1", "LF 20", "LF 20"]);
    for (const f of v!.fahrzeuge) {
      expect(f.kennzeichen).toBeUndefined();
      expect(f.funkrufname).toBeUndefined();
      // Der Typ nach Anlage 1 bleibt als beschreibender Zweck erhalten.
      expect(f.aenderungen).toMatch(/Typ \d/);
    }
  });

  it("bietet der Feuerwehr Niedersachsen an, kennt aber keine Vorlagen ohne Beispielbögen", () => {
    expect(hatLandesvorlagen(OrganisationsTyp.FEUERWEHR)).toBe(true);
    expect(landesvorlagenBundeslaender(OrganisationsTyp.FEUERWEHR)).toContain("niedersachsen");
    expect(landesvorlage(OrganisationsTyp.FEUERWEHR, "niedersachsen", "gibt es nicht")).toBeUndefined();
    expect(landesvorlagenGruppen(OrganisationsTyp.FEUERWEHR, "saarland")).toEqual([]);
  });

  it("benennt Bereiche und Bundesländer lesbar, unbekannte kapitalisiert", () => {
    expect(bereichLabel("katastrophenschutz")).toBe("Katastrophenschutz");
    expect(bereichLabel("feuerwehr")).toBe("Feuerwehr (Landesrecht)");
    expect(bereichLabel("drk")).toBe("DRK-Bereitschaft");
    expect(bereichLabel("technische-hilfe")).toBe("Technische Hilfe");
    expect(bundeslandLabel("niedersachsen")).toBe("Niedersachsen");
  });
});
