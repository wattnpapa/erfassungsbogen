import { describe, it, expect } from "vitest";
import {
  Fahrerlaubnis,
  Geschlecht,
  Ernaehrung,
  OrganisationsTyp,
  PersonalErfassung,
  SCHEMA_VERSION,
  StaerkeRolle,
  type Erfassungsbogen,
  type Fahrzeug,
} from "../model";
import { MeldeStatus, type MeldeEintrag } from "./einsaetze";
import {
  einheitenAnsicht,
  einheitenFiltern,
  einheitenSortieren,
  nachQualifikationFiltern,
  personenMitQualifikation,
  qualifikationenImEinsatz,
} from "./einheiten-liste";
import type { Person, VokabularWert } from "../model";

function fahrzeug(over: Partial<Fahrzeug> = {}): Fahrzeug {
  return { typ: { freitext: "MTW" }, stanKonform: true, ...over };
}

function bogen(
  org: OrganisationsTyp,
  ort: string,
  typ: string,
  fahrzeuge: Fahrzeug[] = [],
): Erfassungsbogen {
  return {
    schemaVersion: SCHEMA_VERSION,
    stand: 100,
    einheit: {
      organisation: org,
      einheitsTyp: { freitext: typ },
      hierarchie: [{ bezeichnung: { freitext: "Ortsverband" }, name: ort }],
    },
    einsatz: { zeitraumVon: 100, zeitraumBis: 101, ortAuftrag: "" },
    personalErfassung: PersonalErfassung.VOLLSTAENDIG,
    personal: [
      {
        vorname: "Anna",
        nachname: "Beispiel",
        staerkeRolle: StaerkeRolle.FUEHRER,
        funktionen: [],
        fahrerlaubnis: Fahrerlaubnis.NONE,
        geschlecht: Geschlecht.W,
        ernaehrung: Ernaehrung.FLEISCH,
        kontakte: [],
        zusatzqualifikationen: [],
      },
    ],
    fahrzeuge,
    sonstiges: "",
  };
}

function eintrag(
  id: string,
  b: Erfassungsbogen,
  over: Partial<MeldeEintrag> = {},
): MeldeEintrag {
  return {
    id,
    einheitSchluessel: id,
    empfangenAm: 1000,
    quelle: "scan",
    status: MeldeStatus.ANWESEND,
    bogen: b,
    ...over,
  };
}

const thwOldenburg = eintrag("a", bogen(OrganisationsTyp.THW, "Oldenburg", "FGr N"), {
  empfangenAm: 3000,
  zugEtikett: "2. Zug",
});
const fwMuenchen = eintrag(
  "b",
  bogen(OrganisationsTyp.FEUERWEHR, "München", "Löschgruppe", [fahrzeug({ kennzeichen: "M-FW 1234" })]),
  { empfangenAm: 1000 },
);
const drkBremen = eintrag("c", bogen(OrganisationsTyp.DRK, "Bremen", "SEG"), {
  empfangenAm: 2000,
  zugEtikett: "1. Zug",
});
const liste = [thwOldenburg, fwMuenchen, drkBremen];

const ids = (l: MeldeEintrag[]) => l.map((e) => e.id);

describe("einheitenFiltern", () => {
  it("gibt bei leerer Suche die Liste unverändert zurück", () => {
    expect(einheitenFiltern(liste, "   ")).toBe(liste);
  });

  it("findet über den Anzeigenamen, unabhängig von Groß-/Kleinschreibung", () => {
    expect(ids(einheitenFiltern(liste, "oldenburg"))).toEqual(["a"]);
    expect(ids(einheitenFiltern(liste, "SEG"))).toEqual(["c"]);
  });

  it("verlangt alle Suchwörter (UND), auch über verschiedene Felder hinweg", () => {
    expect(ids(einheitenFiltern(liste, "thw fgr"))).toEqual(["a"]);
    expect(ids(einheitenFiltern(liste, "thw bremen"))).toEqual([]);
  });

  it("findet über Zug-Etikett und Kennzeichen", () => {
    expect(ids(einheitenFiltern(liste, "2. Zug"))).toEqual(["a"]);
    expect(ids(einheitenFiltern(liste, "M-FW 1234"))).toEqual(["b"]);
  });

  it("ignoriert Akzente/Umlaute in Suche und Daten", () => {
    expect(ids(einheitenFiltern(liste, "munchen"))).toEqual(["b"]);
    expect(ids(einheitenFiltern(liste, "MÜNCHEN"))).toEqual(["b"]);
  });

  it("trifft auch mitten im Wort — Teilworteingabe unter Zeitdruck", () => {
    expect(ids(einheitenFiltern(liste, "burg"))).toEqual(["a"]);
  });

  it("liefert leer, wenn nichts passt", () => {
    expect(einheitenFiltern(liste, "hamburg")).toEqual([]);
  });
});

describe("einheitenSortieren", () => {
  it("sortiert nach Name alphabetisch", () => {
    expect(ids(einheitenSortieren(liste, "name"))).toEqual(["c", "b", "a"]);
  });

  it("sortiert nach Eintreffzeit, neueste zuerst", () => {
    expect(ids(einheitenSortieren(liste, "eintreffzeit"))).toEqual(["a", "c", "b"]);
  });

  it("sortiert nach Zug und stellt Einheiten ohne Zug ans Ende", () => {
    expect(ids(einheitenSortieren(liste, "zug"))).toEqual(["c", "a", "b"]);
  });

  it("sortiert nach Organisation, innerhalb der Organisation nach Name", () => {
    const zweitesDrk = eintrag("d", bogen(OrganisationsTyp.DRK, "Aurich", "SEG"));
    expect(ids(einheitenSortieren([...liste, zweitesDrk], "organisation"))).toEqual([
      "d", // DRK Aurich
      "c", // DRK Bremen
      "b", // Feuerwehr
      "a", // THW
    ]);
  });

  it("lässt die Eingabeliste unangetastet", () => {
    const eingabe = [...liste];
    einheitenSortieren(eingabe, "eintreffzeit");
    expect(ids(eingabe)).toEqual(["a", "b", "c"]);
  });

  it("ordnet bei gleicher Eintreffzeit stabil nach Name", () => {
    const gleichzeitig = [
      eintrag("x", bogen(OrganisationsTyp.THW, "Zwickau", "FGr N"), { empfangenAm: 500 }),
      eintrag("y", bogen(OrganisationsTyp.THW, "Aurich", "FGr N"), { empfangenAm: 500 }),
    ];
    expect(ids(einheitenSortieren(gleichzeitig, "eintreffzeit"))).toEqual(["y", "x"]);
  });
});

describe("einheitenAnsicht", () => {
  it("sucht zuerst und sortiert dann das Ergebnis", () => {
    const treffer = einheitenAnsicht(liste, "zug", "eintreffzeit");
    expect(ids(treffer)).toEqual(["a", "c"]);
  });
});

// ------------------------------------------------------- Qualifikationsfilter

function person(nachname: string, funktionen: VokabularWert[], zusatz: VokabularWert[] = []): Person {
  return {
    vorname: "Test",
    nachname,
    staerkeRolle: StaerkeRolle.MANNSCHAFT,
    funktionen,
    fahrerlaubnis: Fahrerlaubnis.NONE,
    geschlecht: Geschlecht.M,
    ernaehrung: Ernaehrung.FLEISCH,
    kontakte: [],
    zusatzqualifikationen: zusatz,
  };
}

function mitPersonal(e: MeldeEintrag, personal: Person[]): MeldeEintrag {
  return { ...e, bogen: { ...e.bogen, personal } };
}

// THW-Codes: 3 = GrFü, 32 = AGT (siehe vokabulare/thw.ts).
const thwMitAgt = mitPersonal(thwOldenburg, [
  person("Auer", [{ code: 3 }, { code: 32 }]),
  person("Bruns", [{ code: 32 }]),
  person("Claes", [{ code: 5 }]),
]);
// Die Feuerwehr hat (noch) kein Funktionsvokabular — dort kommt alles als Freitext.
const fwMitAgt = mitPersonal(fwMuenchen, [
  person("Dorn", [{ freitext: "Truppführer" }], [{ freitext: "AGT" }]),
]);
const drkOhne = mitPersonal(drkBremen, [person("Ernst", [{ freitext: "Sanitäter" }])]);
const gemischt = [thwMitAgt, fwMitAgt, drkOhne];

describe("qualifikationenImEinsatz", () => {
  it("zählt Personen und Einheiten je Qualifikation", () => {
    const agt = qualifikationenImEinsatz(gemischt).find((q) => q.schluessel === "agt");
    expect(agt).toMatchObject({ personen: 3, einheiten: 2 });
  });

  it("führt Vokabular-Code und Freitext derselben Kurzform zusammen und nimmt die sprechendere Beschriftung", () => {
    const agt = qualifikationenImEinsatz(gemischt).find((q) => q.schluessel === "agt");
    expect(agt?.label).toBe("AGT – Atemschutzgeräteträger/in");
  });

  it("liefert die Liste alphabetisch nach Beschriftung", () => {
    const labels = qualifikationenImEinsatz(gemischt).map((q) => q.label);
    expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b, "de")));
  });

  it("nimmt Grundfunktionen und weitere Qualifikationen gleichermaßen auf", () => {
    const schluessel = qualifikationenImEinsatz(gemischt).map((q) => q.schluessel);
    expect(schluessel).toContain("grfu"); // Grundfunktion aus dem Vokabular
    expect(schluessel).toContain("sanitater"); // Freitext einer anderen Organisation
  });

  it("zählt eine Person je Qualifikation nur einmal, auch bei Doppelnennung", () => {
    const doppelt = [mitPersonal(thwOldenburg, [person("Fink", [{ code: 32 }], [{ freitext: "AGT" }])])];
    expect(qualifikationenImEinsatz(doppelt).find((q) => q.schluessel === "agt")?.personen).toBe(1);
  });

  it("bleibt leer, wenn nur Stärke gemeldet wurde", () => {
    expect(qualifikationenImEinsatz([mitPersonal(thwOldenburg, [])])).toEqual([]);
  });
});

describe("personenMitQualifikation", () => {
  it("nennt die Personen in der Reihenfolge des Bogens", () => {
    expect(personenMitQualifikation(thwMitAgt, "agt").map((p) => p.nachname)).toEqual(["Auer", "Bruns"]);
  });

  it("liefert ohne Filter niemanden", () => {
    expect(personenMitQualifikation(thwMitAgt, "")).toEqual([]);
  });
});

describe("nachQualifikationFiltern", () => {
  it("behält nur Einheiten mit mindestens einer passenden Person", () => {
    expect(ids(nachQualifikationFiltern(gemischt, "agt"))).toEqual(["a", "b"]);
  });

  it("gibt bei leerem Schlüssel dieselbe Liste zurück", () => {
    expect(nachQualifikationFiltern(gemischt, "")).toBe(gemischt);
  });

  it("greift in der Anzeigeliste zusammen mit Suche und Sortierung", () => {
    expect(ids(einheitenAnsicht(gemischt, "", "name", "agt"))).toEqual(["b", "a"]);
    expect(ids(einheitenAnsicht(gemischt, "oldenburg", "name", "agt"))).toEqual(["a"]);
    expect(ids(einheitenAnsicht(gemischt, "bremen", "name", "agt"))).toEqual([]);
  });
});
