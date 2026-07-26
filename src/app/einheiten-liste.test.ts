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
import { einheitenAnsicht, einheitenFiltern, einheitenSortieren } from "./einheiten-liste";

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
