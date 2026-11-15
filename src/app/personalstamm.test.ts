/**
 * Lokaler Personalstamm: Ablage, Alter, Auswahl-Filter und die Umsetzung in Personen eines Bogens.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Ernaehrung, Fahrerlaubnis, Geschlecht, KontaktArt, OrganisationsTyp, StaerkeRolle } from "@bos/eeb-format/model";
import { THW_FUNKTIONEN_ALLE } from "@bos/vokabulare/thw";
import {
  STAMM_ALT_TAGE,
  STAMM_SCHLUESSEL,
  stammAlterTage,
  stammAusJson,
  stammIstAlt,
  stammLaden,
  stammLoeschen,
  stammSpeichern,
  type Personalstamm,
  type StammPerson,
} from "./personalstamm";
import {
  stammName,
  stammPasst,
  stammPersonAlsPerson,
  stammQualifikationen,
  stammSortiert,
  stammTeileinheiten,
  stammZusatz,
} from "./personalstamm-auswahl";
import { sicherungEinspielen, sicherungErstellen, sicherungParsen } from "./sicherung";

const p = (nachname: string, vorname: string, extra: Partial<StammPerson> = {}): StammPerson => ({
  nachname, vorname, rolle: StaerkeRolle.MANNSCHAFT, qualifikationen: [], fahrerlaubnisse: [], ...extra,
});

const TAG = 86_400_000;

describe("Ablage", () => {
  const stamm: Personalstamm = { version: 1, importiert: 1_800_000_000_000, quelle: "helfer.xlsx", personen: [p("Meier", "Anna")] };

  it("liest nur den eigenen, unbeschädigten Stand und lässt kaputte Zeilen weg", () => {
    expect(stammAusJson(null)).toBeNull();
    expect(stammAusJson("{")).toBeNull();
    expect(stammAusJson(JSON.stringify({ version: 2, importiert: 1, personen: [] }))).toBeNull();
    expect(stammAusJson(JSON.stringify(stamm))).toEqual(stamm);
    const mitKaputter = { ...stamm, personen: [...stamm.personen, { nachname: "ohne Rest" }, null] };
    expect(stammAusJson(JSON.stringify(mitKaputter))?.personen).toEqual(stamm.personen);
  });

  it("rechnet das Alter in ganzen Tagen und warnt ab der Frist", () => {
    expect(stammAlterTage(stamm, stamm.importiert + 119.9 * TAG)).toBe(119);
    expect(stammAlterTage(stamm, stamm.importiert - TAG)).toBe(0); // verstellte Uhr
    expect(stammIstAlt(stamm, stamm.importiert + (STAMM_ALT_TAGE - 1) * TAG)).toBe(false);
    expect(stammIstAlt(stamm, stamm.importiert + STAMM_ALT_TAGE * TAG)).toBe(true);
  });

  describe("im Gerätespeicher", () => {
    const inhalt = new Map<string, string>();
    const vorher = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
    beforeEach(() => {
      inhalt.clear();
      Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        writable: true,
        value: {
          get length() {
            return inhalt.size;
          },
          key: (i: number) => [...inhalt.keys()][i] ?? null,
          getItem: (k: string) => inhalt.get(k) ?? null,
          setItem: (k: string, v: string) => void inhalt.set(k, v),
          removeItem: (k: string) => void inhalt.delete(k),
          clear: () => inhalt.clear(),
        } satisfies Storage,
      });
    });
    afterEach(() => {
      if (vorher) Object.defineProperty(globalThis, "localStorage", vorher);
      else delete (globalThis as { localStorage?: Storage }).localStorage;
    });

    it("speichert, lädt und löscht", () => {
      expect(stammLaden()).toBeNull();
      stammSpeichern(stamm);
      expect(stammLaden()).toEqual(stamm);
      stammLoeschen();
      expect(stammLaden()).toBeNull();
    });

    it("bleibt aus der Datensicherung und übersteht das Einspielen einer Sicherung", () => {
      stammSpeichern(stamm);
      inhalt.set("eeb.absenderkarte.v1", '{"name":"Test"}');
      const datei = sicherungErstellen();
      expect(Object.keys(sicherungParsen(datei))).not.toContain(STAMM_SCHLUESSEL);
      expect(datei).not.toContain("Meier");
      // Einspielen ersetzt die App-Daten, der Stamm gehört zum Gerät und bleibt.
      sicherungEinspielen(datei);
      expect(stammLaden()).toEqual(stamm);
    });
  });
});

describe("Auswahl", () => {
  const liste = [
    p("Schulz", "Jens", { funktion: "GrFü", rolle: StaerkeRolle.UNTERFUEHRER, teileinheit: "B1", qualifikationen: ["AGT", "Sprechfunk"], fahrerlaubnisse: [Fahrerlaubnis.CE] }),
    p("Meier", "Anna", { teileinheit: "FGr N", qualifikationen: ["Motorsäge"], fahrerlaubnisse: [Fahrerlaubnis.B] }),
    p("Abel", "Kim", { teileinheit: "b1" }),
  ];

  it("sortiert nach Nachname und nennt Teileinheiten und Qualifikationen je einmal", () => {
    expect(stammSortiert(liste).map((x) => x.nachname)).toEqual(["Abel", "Meier", "Schulz"]);
    expect(stammTeileinheiten(liste)).toEqual(["B1", "FGr N"]);
    // Kraftfahrer-Filter nur für Klassen, die jemand hat (CE schließt C, C1, BE und B ein).
    expect(stammQualifikationen(liste)).toEqual(["Kf B", "Kf BE", "Kf C1", "Kf C", "Kf CE", "AGT", "Motorsäge", "Sprechfunk"]);
    expect(stammQualifikationen([liste[1]!])).toEqual(["Kf B", "Motorsäge"]);
  });

  it("filtert nach Suche, Teileinheit und Qualifikation", () => {
    const treffer = (f: Partial<Parameters<typeof stammPasst>[1]>) =>
      liste.filter((x) => stammPasst(x, { suche: "", teileinheit: "", qualifikation: "", ...f })).map((x) => x.nachname);
    expect(treffer({})).toEqual(["Schulz", "Meier", "Abel"]);
    expect(treffer({ suche: "jens sch" })).toEqual(["Schulz"]);
    expect(treffer({ suche: "motors" })).toEqual(["Meier"]);
    expect(treffer({ teileinheit: "B1" })).toEqual(["Schulz", "Abel"]);
    expect(treffer({ qualifikation: "agt" })).toEqual(["Schulz"]);
    expect(treffer({ qualifikation: "Kf B" })).toEqual(["Schulz", "Meier"]); // CE schließt B ein
    expect(treffer({ qualifikation: "Kf C" })).toEqual(["Schulz"]);
    expect(treffer({ teileinheit: "FGr N", qualifikation: "AGT" })).toEqual([]);
  });

  it("beschreibt eine Person in zwei Zeilen", () => {
    expect(stammName(liste[0]!)).toBe("Schulz, Jens");
    expect(stammZusatz(liste[0]!)).toBe("GrFü · B1 · Kf CE · AGT · Sprechfunk");
    expect(stammZusatz(p("Ohne", "Alles"))).toBe("");
  });
});

describe("Stamm-Person → Person des Bogens", () => {
  it("übersetzt die Funktion ins THW-Vokabular und übernimmt alle Angaben", () => {
    const person = stammPersonAlsPerson(
      p(" Schulz ", "Jens", {
        funktion: "GrFü", rolle: StaerkeRolle.UNTERFUEHRER, qualifikationen: ["AGT"], fahrerlaubnisse: [Fahrerlaubnis.CE, Fahrerlaubnis.A],
        mobil: "0171 3920001", geschlecht: Geschlecht.W, ernaehrung: Ernaehrung.VEGAN, teileinheit: "B1",
      }),
      OrganisationsTyp.THW,
    );
    const grfue = THW_FUNKTIONEN_ALLE.find((f) => f.kurz === "GrFü")!;
    expect(person).toEqual({
      nachname: "Schulz", vorname: "Jens", staerkeRolle: StaerkeRolle.UNTERFUEHRER,
      funktionen: [{ code: grfue.code }],
      fahrerlaubnis: Fahrerlaubnis.CE, weitereFahrerlaubnisse: [Fahrerlaubnis.A],
      geschlecht: Geschlecht.W, ernaehrung: Ernaehrung.VEGAN,
      kontakte: [{ art: KontaktArt.MOBIL, dienstlich: true, wert: "01713920001" }],
      zusatzqualifikationen: [{ freitext: "AGT" }],
    });
    // Die Teileinheit ist ein Filter des Stamms und steht nicht im Bogen.
    expect(JSON.stringify(person)).not.toContain("B1");
  });

  it("nimmt die Funktion als Freitext, wenn die Organisation kein Vokabular dafür hat", () => {
    const person = stammPersonAlsPerson(p("Meier", "Anna", { funktion: "Gruppenführerin" }), OrganisationsTyp.FEUERWEHR);
    expect(person.funktionen).toEqual([{ freitext: "Gruppenführerin" }]);
    expect(person.kontakte).toEqual([]);
    expect(person.fahrerlaubnis).toBe(Fahrerlaubnis.NONE);
    expect(person).not.toHaveProperty("weitereFahrerlaubnisse");
  });
});
