import { describe, it, expect, vi } from "vitest";

// hilfen.ts zieht über ./nativ die Capacitor-Plugins; für die reinen Helfer
// brauchen wir davon nichts. Der Mock hält die Node-Testumgebung frei davon.
vi.mock("./nativ", () => ({
  istNativ: () => false,
  textTeilen: async () => {},
}));

// Fester „Geräteschlüssel": ohne localStorage würde je Aufruf ein neuer
// entstehen und die Prüfung, WER gezeichnet hat, wäre nicht formulierbar.
vi.mock("./geraete-schluessel", () => ({
  geraeteSchluesselSicherstellen: async () => new Uint8Array(32).fill(5),
}));

import {
  Ernaehrung,
  Fahrerlaubnis,
  Geschlecht,
  OrganisationsTyp,
  PersonalErfassung,
  StaerkeRolle,
  SCHEMA_VERSION,
  datumAusIso,
  zeitpunktAusIso,
  type Erfassungsbogen,
  KontaktArt,
  type Fahrzeug,
  type Person,
} from "@bos/eeb-format/model";
import {
  bogenLaden,
  browserKompressor,
  fahrzeugHinweise,
  inflateRawBegrenzt,
  MAX_ENTPACKT,
  migriereBogen,
  neuePerson,
  neuerBogen,
  natoZeitstempel,
  neuesFahrzeug,
  plausibilitaet,
  qrErzeugen,
  schrittStatus,
  transportBilanz,
} from "./hilfen";
import { deflateRaw } from "pako";
import QRCode from "qrcode";
import {
  EEB_URL_PREFIX,
  QR_EINZEL_MAX_VERSION,
  QR_SEGMENT_ZIEL_VERSION,
  decodePayload,
  encodePayload,
  parseSegmentUrl,
  payloadAusText,
  segmentePayload,
} from "@bos/eeb-format/codec";
import {
  oeffentlicherSchluessel,
  schluesselKurzform,
  schluesselpaarErzeugen,
  signaturVonPayload,
  signiertePayloadBytes,
} from "@bos/eeb-format/signatur";

// Minimaler File-Ersatz: bogenLaden nutzt nur datei.text().
function jsonDatei(inhalt: string): File {
  return { text: async () => inhalt } as File;
}

function person(p: Partial<Person> = {}): Person {
  return {
    vorname: "V",
    nachname: "N",
    staerkeRolle: StaerkeRolle.MANNSCHAFT,
    funktionen: [],
    fahrerlaubnis: Fahrerlaubnis.NONE,
    geschlecht: Geschlecht.M,
    ernaehrung: Ernaehrung.FLEISCH,
    kontakte: [],
    zusatzqualifikationen: [],
    ...p,
  };
}


describe("plausibilitaet()", () => {
  function bogen(over: Partial<Erfassungsbogen> = {}): Erfassungsbogen {
    return { ...neuerBogen(), ...over };
  }

  it("meldet keine Hinweise für einen stimmigen Bogen", () => {
    const basis = neuerBogen();
    const b = bogen({
      einheit: { ...basis.einheit, hierarchie: [{ bezeichnung: { code: 1 }, name: "Oldenburg - Ni" }] },
      einsatz: { ...basis.einsatz, ortAuftrag: "Übung Kabelblitz" },
      personal: [
        person({
          staerkeRolle: StaerkeRolle.FUEHRER,
          geschlecht: Geschlecht.M,
          // Mit Fahrzeug gehört ein Kraftfahrer zum stimmigen Bogen.
          fahrerlaubnis: Fahrerlaubnis.B,
          kontakte: [{ art: KontaktArt.MOBIL, dienstlich: true, wert: "01711234567" }],
        }),
        person({ geschlecht: Geschlecht.W }),
      ],
      fahrzeuge: [{ typ: { code: 1 }, kennzeichen: "THW-84397" }],
    });
    expect(plausibilitaet(b)).toEqual([]);
  });

  it("weist auf den fehlenden Namen der eigenen Einheit hin, nicht aber bei Standort-Referenz", () => {
    const basis = neuerBogen();
    expect(plausibilitaet(bogen()).some((h) => /unterste Ebene/.test(h))).toBe(true);
    const mitRef = bogen({ einheit: { ...basis.einheit, standortRef: 42, hierarchie: [] } });
    expect(plausibilitaet(mitRef).some((h) => /unterste Ebene/.test(h))).toBe(false);
  });

  it("weist auf leeren Ort/Auftrag, fehlende Erreichbarkeit und Fahrzeuge ohne Kennzeichen hin", () => {
    const b = bogen({
      personal: [person({ staerkeRolle: StaerkeRolle.FUEHRER })], // ohne Kontakte
      fahrzeuge: [{ typ: { code: 1 } }],
    });
    const hinweise = plausibilitaet(b);
    expect(hinweise.some((h) => /Ort\/Auftrag/.test(h))).toBe(true);
    expect(hinweise.some((h) => /telefonische Erreichbarkeit/.test(h))).toBe(true);
    expect(hinweise.some((h) => /Fahrzeug 1.*kein Kennzeichen/.test(h))).toBe(true);
  });

  it("lässt die Kennzeichen-Hinweise mit mitFahrzeugen=false weg (Personalseite)", () => {
    const b = bogen({
      personal: [person({ staerkeRolle: StaerkeRolle.FUEHRER })],
      fahrzeuge: [{ typ: { code: 1 } }],
    });
    const hinweise = plausibilitaet(b, false);
    expect(hinweise.some((h) => /kein Kennzeichen/.test(h))).toBe(false);
    // Andere Vollständigkeitshinweise bleiben erhalten.
    expect(hinweise.some((h) => /telefonische Erreichbarkeit/.test(h))).toBe(true);
  });

  it("warnt, wenn die Sitzplätze der Fahrzeuge für die Stärke nicht reichen", () => {
    // FGr W (B): 10 Helfer, dazu laut StAN ein LKW Lkr gl (3 Plätze) und ein
    // Anhänger — sieben Leute hätten keine Mitfahrgelegenheit.
    const b = bogen({
      personal: Array.from({ length: 10 }, () => person()),
      fahrzeuge: [{ typ: { code: 10 } }, { typ: { code: 44 } }],
    });
    const hinweise = fahrzeugHinweise(b);
    expect(hinweise.some((h) => /Sitzplätze: 3 .*für 10 Personen — 7 brauchen/.test(h))).toBe(true);
    expect(transportBilanz(b)).toMatchObject({ plaetze: 3, benoetigt: 10, fehlend: 7 });
  });

  it("warnt nicht bei genug Sitzplätzen, ohne Fahrzeuge oder bei unbekanntem Fahrzeugtyp", () => {
    const personal = Array.from({ length: 8 }, () => person());
    const genug = bogen({ personal, fahrzeuge: [{ typ: { code: 4 } }] }); // GKW: 9 Plätze
    expect(fahrzeugHinweise(genug).some((h) => /Sitzplätze/.test(h))).toBe(false);

    // Keine Fahrzeuge = die Einheit reist erklärtermaßen anders an.
    expect(fahrzeugHinweise(bogen({ personal })).some((h) => /Sitzplätze/.test(h))).toBe(false);

    // MTW gl hat keine hinterlegte Platzzahl — die Bilanz bleibt unvollständig.
    const unklar = bogen({ personal, fahrzeuge: [{ typ: { code: 24 } }] });
    expect(fahrzeugHinweise(unklar).some((h) => /Sitzplätze/.test(h))).toBe(false);
    expect(transportBilanz(unklar).unbekannt).toBe(1);
  });

  it("warnt bei Fahrzeugen ohne erfassten Kraftfahrer", () => {
    // Die StAN-Vorbelegung setzt bewusst keine Fahrerlaubnisklassen — ohne den
    // Hinweis findet der Kraftfahrer-Filter am Meldekopf die Einheit nicht.
    const ohneKf = bogen({
      personal: [person()],
      fahrzeuge: [{ typ: { code: 8 }, kennzeichen: "THW-84397" }],
    });
    expect(plausibilitaet(ohneKf).some((h) => /kein Kraftfahrer/.test(h))).toBe(true);
    // Auf der Personalseite (mitFahrzeugen=false) bleibt der Hinweis weg.
    expect(plausibilitaet(ohneKf, false).some((h) => /kein Kraftfahrer/.test(h))).toBe(false);
  });

  it("warnt nicht, sobald eine Klasse erfasst ist — oder wo Klassen gar nicht erfasst werden", () => {
    const mitKf = bogen({
      personal: [person({ weitereFahrerlaubnisse: [Fahrerlaubnis.CE] })],
      fahrzeuge: [{ typ: { code: 8 } }],
    });
    expect(plausibilitaet(mitKf).some((h) => /kein Kraftfahrer/.test(h))).toBe(false);

    // Ohne Fahrzeuge braucht es keinen Fahrer, ohne Personal greift schon „Stärke ist 0".
    expect(plausibilitaet(bogen({ personal: [person()] })).some((h) => /kein Kraftfahrer/.test(h))).toBe(false);
    expect(plausibilitaet(bogen({ fahrzeuge: [{ typ: { code: 8 } }] })).some((h) => /kein Kraftfahrer/.test(h))).toBe(false);

    // Die Stärke-Schnellerfassung kennt keine Klassen je Person — kein Fehlalarm.
    const schnell = bogen({
      personalErfassung: PersonalErfassung.NUR_STAERKE,
      staerkeManuell: { fuehrer: 1, unterfuehrer: 2, mannschaft: 9, gesamt: 12 },
      personal: [person()],
      fahrzeuge: [{ typ: { code: 8 } }],
    });
    expect(plausibilitaet(schnell).some((h) => /kein Kraftfahrer/.test(h))).toBe(false);
  });

  it("nimmt die Sitzplatz-Warnung in die Gesamtübersicht auf, nicht auf die Personalseite", () => {
    const b = bogen({
      personal: Array.from({ length: 10 }, () => person()),
      fahrzeuge: [{ typ: { code: 10 }, kennzeichen: "THW-84397" }],
    });
    expect(plausibilitaet(b).some((h) => /Sitzplätze/.test(h))).toBe(true);
    expect(plausibilitaet(b, false).some((h) => /Sitzplätze/.test(h))).toBe(false);
  });

  it("meldet fehlende Kennzeichen getrennt über fahrzeugHinweise", () => {
    const b = bogen({
      fahrzeuge: [{ typ: { code: 1 } }, { typ: { code: 2 }, kennzeichen: "OL-FW 2041" }],
    });
    const hinweise = fahrzeugHinweise(b);
    expect(hinweise.some((h) => /Fahrzeug 1.*kein Kennzeichen/.test(h))).toBe(true);
    expect(hinweise.some((h) => /Fahrzeug 2/.test(h))).toBe(false);
  });

  it("zählt eMail nicht als telefonische Erreichbarkeit, ein ziviles Kennzeichen aber als Kennzeichen", () => {
    const basis = neuerBogen();
    const b = bogen({
      einsatz: { ...basis.einsatz, ortAuftrag: "X" },
      personal: [person({ kontakte: [{ art: KontaktArt.EMAIL, dienstlich: true, wert: "a@b.de" }] })],
      fahrzeuge: [{ typ: { code: 1 }, kennzeichen: "OL-FW 2041" }],
    });
    const hinweise = plausibilitaet(b);
    expect(hinweise.some((h) => /telefonische Erreichbarkeit/.test(h))).toBe(true);
    expect(hinweise.some((h) => /Kennzeichen/.test(h) && /Fahrzeug/.test(h))).toBe(false);
  });

  it("weist auf eine Stärke von 0 hin", () => {
    expect(plausibilitaet(bogen()).some((h) => /Stärke ist 0/.test(h))).toBe(true);
  });

  it("erkennt einen umgedrehten Einsatzzeitraum", () => {
    const b = bogen({
      personal: [person()],
      einsatz: { zeitraumVon: datumAusIso("2025-05-17"), zeitraumBis: datumAusIso("2025-05-14"), ortAuftrag: "X" },
    });
    expect(plausibilitaet(b).some((h) => /„bis“ liegt vor „von“/.test(h))).toBe(true);
  });

  it("prüft die Unterbringungssumme nur bei belastbarer Grundlage (Meldekopf ohne manuelle Angabe: kein Hinweis)", () => {
    const b = bogen({
      personalErfassung: PersonalErfassung.NUR_STAERKE,
      personal: [],
      staerkeManuell: { fuehrer: 1, unterfuehrer: 0, mannschaft: 9, gesamt: 10 },
    });
    expect(plausibilitaet(b).some((h) => /Unterbringung/.test(h))).toBe(false);
  });

  it("meldet Verpflegung für mehr Personen als die Gesamtstärke", () => {
    const b = bogen({
      personal: [person()],
      sofortbedarf: { verpflegungPersonen: 5, dieselLiter: 0, benzinLiter: 0, gemischLiter: 0, unterbringung: false, ruhezeitErforderlich: false },
    });
    expect(plausibilitaet(b).some((h) => /Verpflegung für 5 Personen/.test(h))).toBe(true);
  });
});

describe("migriereBogen() (JSON-Pfad, muss zum Codec passen)", () => {
  it("hebt einen v2-Bogen auf die aktuelle Version und rettet davonVegetarisch", () => {
    const alt = {
      schemaVersion: 2,
      stand: 0,
      einheit: { organisation: OrganisationsTyp.THW, einheitsTyp: { code: 43 }, hierarchie: [{ bezeichnung: { code: 1 }, name: "OV" }] },
      einsatz: { zeitraumVon: 0, zeitraumBis: 0, ortAuftrag: "" },
      personalErfassung: PersonalErfassung.VOLLSTAENDIG,
      // v2-Person ohne ernaehrung:
      personal: [{ vorname: "A", nachname: "B", staerkeRolle: 0, funktionen: [], fahrerlaubnis: 0, geschlecht: 0, kontakte: [], zusatzqualifikationen: [] }],
      fahrzeuge: [],
      sofortbedarf: { verpflegungPersonen: 10, davonVegetarisch: 4, dieselLiter: 0, benzinLiter: 0, gemischLiter: 0, unterbringung: false, ruhezeitErforderlich: false },
    } as unknown as Erfassungsbogen;

    const b = migriereBogen(alt);
    expect(b.schemaVersion).toBe(SCHEMA_VERSION);
    expect(b.personal[0]!.ernaehrung).toBe(Ernaehrung.FLEISCH);
    expect(b.verpflegungManuell).toEqual({ vegetarisch: 4, vegan: 0 });
    // Das Alt-Feld darf nicht im Sofortbedarf zurückbleiben.
    expect((b.sofortbedarf as unknown as Record<string, unknown>).davonVegetarisch).toBeUndefined();
  });

  it("führt die getrennten Kennzeichenfelder eines v3-Bogens zusammen", () => {
    const alt = {
      ...neuerBogen(),
      schemaVersion: 3,
      fahrzeuge: [
        { typ: { code: 1 }, thwKennzeichen: 84397 },
        { typ: { code: 2 }, thwKennzeichen: 12 },
        { typ: { code: 3 }, kennzeichenFreitext: "OL-FW 2041" },
      ],
    } as unknown as Erfassungsbogen;

    const b = migriereBogen(alt);
    expect(b.fahrzeuge.map((f) => f.kennzeichen)).toEqual(["THW-84397", "THW-00012", "OL-FW 2041"]);
    // Die Alt-Felder dürfen nicht zurückbleiben.
    const roh = b.fahrzeuge as unknown as Record<string, unknown>[];
    expect(roh.every((f) => !("thwKennzeichen" in f) && !("kennzeichenFreitext" in f))).toBe(true);
  });

  it("hebt den Tageszähler-Stand eines v6-Bogens auf Minuten (Mitternacht)", () => {
    const alt = { ...neuerBogen(), schemaVersion: 6, stand: datumAusIso("2026-05-14") } as Erfassungsbogen;
    const b = migriereBogen(alt);
    expect(b.stand).toBe(zeitpunktAusIso("2026-05-14T00:00"));
    expect(b.schemaVersion).toBe(SCHEMA_VERSION);
  });

  it("lässt den minutengenauen Stand eines v7-Bogens unangetastet", () => {
    const b = migriereBogen({ ...neuerBogen(), stand: zeitpunktAusIso("2026-05-14T10:39") });
    expect(b.stand).toBe(zeitpunktAusIso("2026-05-14T10:39"));
  });
});

describe("bogenLaden() (JSON-Datei)", () => {
  it("lädt einen gültigen aktuellen Bogen und hebt ihn aufs aktuelle Schema", async () => {
    const bogen = { ...neuerBogen(), einheit: { ...neuerBogen().einheit, hierarchie: [{ bezeichnung: { code: 1 }, name: "OV Test" }] } };
    const b = await bogenLaden(jsonDatei(JSON.stringify(bogen)));
    expect(b.schemaVersion).toBe(SCHEMA_VERSION);
    expect(b.einheit.hierarchie[0]!.name).toBe("OV Test");
  });

  it("migriert einen alten v2-Bogen (Ernährung, davonVegetarisch)", async () => {
    const alt = {
      schemaVersion: 2,
      stand: 0,
      einheit: { organisation: OrganisationsTyp.THW, einheitsTyp: { code: 43 }, hierarchie: [{ bezeichnung: { code: 1 }, name: "OV" }] },
      einsatz: { zeitraumVon: 0, zeitraumBis: 0, ortAuftrag: "" },
      personalErfassung: PersonalErfassung.VOLLSTAENDIG,
      personal: [{ vorname: "A", nachname: "B", staerkeRolle: 0, funktionen: [], fahrerlaubnis: 0, geschlecht: 0, kontakte: [], zusatzqualifikationen: [] }],
      fahrzeuge: [],
      sofortbedarf: { verpflegungPersonen: 5, davonVegetarisch: 2, dieselLiter: 0, benzinLiter: 0, gemischLiter: 0, unterbringung: false, ruhezeitErforderlich: false },
    };
    const b = await bogenLaden(jsonDatei(JSON.stringify(alt)));
    expect(b.schemaVersion).toBe(SCHEMA_VERSION);
    expect(b.personal[0]!.ernaehrung).toBe(Ernaehrung.FLEISCH);
    expect(b.verpflegungManuell).toEqual({ vegetarisch: 2, vegan: 0 });
  });

  it("lehnt kaputtes JSON ab", async () => {
    await expect(bogenLaden(jsonDatei("{ kein json"))).rejects.toThrow(/kein gültiges JSON/i);
  });

  it("lehnt eine zu neue Schema-Version ab", async () => {
    const b = { ...neuerBogen(), schemaVersion: SCHEMA_VERSION + 1 };
    await expect(bogenLaden(jsonDatei(JSON.stringify(b)))).rejects.toThrow(/gültige Erfassungsbogen-Datei/i);
  });

  it("lehnt eine zu alte Schema-Version ab", async () => {
    const b = { ...neuerBogen(), schemaVersion: 1 };
    await expect(bogenLaden(jsonDatei(JSON.stringify(b)))).rejects.toThrow(/gültige Erfassungsbogen-Datei/i);
  });

  it("lehnt eine Datei ohne Pflichtstruktur ab", async () => {
    await expect(bogenLaden(jsonDatei(JSON.stringify({ schemaVersion: SCHEMA_VERSION })))).rejects.toThrow(
      /gültige Erfassungsbogen-Datei/i,
    );
  });
});

describe("plausibilitaet() — weitere Zweige", () => {
  function bogen(over: Partial<Erfassungsbogen> = {}): Erfassungsbogen {
    return { ...neuerBogen(), ...over };
  }

  it("erkennt eine manuelle Stärke, deren Summe nicht zur Gesamtstärke passt", () => {
    const b = bogen({
      personalErfassung: PersonalErfassung.NUR_STAERKE,
      personal: [],
      staerkeManuell: { fuehrer: 1, unterfuehrer: 1, mannschaft: 1, gesamt: 5 },
    });
    expect(plausibilitaet(b).some((h) => /ergibt nicht die Gesamtstärke/.test(h))).toBe(true);
  });

  it("erkennt bei vollständiger Erfassung eine falsche manuelle Unterbringungssumme", () => {
    const b = bogen({
      personal: [person(), person()],
      unterbringungManuell: { m: 1, w: 0, d: 0 },
    });
    expect(plausibilitaet(b).some((h) => /Unterbringung/.test(h))).toBe(true);
  });

  it("warnt, wenn im Meldekopf-Modus mehr Ansprechpartner als die Gesamtstärke erfasst sind", () => {
    const b = bogen({
      personalErfassung: PersonalErfassung.NUR_STAERKE,
      personal: [person(), person()],
      staerkeManuell: { fuehrer: 0, unterfuehrer: 0, mannschaft: 1, gesamt: 1 },
    });
    expect(plausibilitaet(b).some((h) => /Ansprechpartner erfasst/.test(h))).toBe(true);
  });

  it("warnt im Meldekopf-Modus, wenn veg + vegan die Gesamtstärke übersteigen (auch ohne Sofortbedarf)", () => {
    const b = bogen({
      personalErfassung: PersonalErfassung.NUR_STAERKE,
      personal: [],
      staerkeManuell: { fuehrer: 0, unterfuehrer: 0, mannschaft: 5, gesamt: 5 },
      verpflegungManuell: { vegetarisch: 4, vegan: 3 },
    });
    expect(plausibilitaet(b).some((h) => /übersteigen die Gesamtstärke 5/.test(h))).toBe(true);
  });

  it("warnt nicht, wenn veg + vegan die Gesamtstärke einhalten", () => {
    const b = bogen({
      personalErfassung: PersonalErfassung.NUR_STAERKE,
      personal: [],
      staerkeManuell: { fuehrer: 0, unterfuehrer: 0, mannschaft: 5, gesamt: 5 },
      verpflegungManuell: { vegetarisch: 2, vegan: 1 },
    });
    expect(plausibilitaet(b).some((h) => /übersteigen die Gesamtstärke/.test(h))).toBe(false);
  });

  it("warnt, wenn mehr Vegetarier/Veganer als Verpflegungsbedarf erfasst sind", () => {
    const b = bogen({
      personalErfassung: PersonalErfassung.NUR_STAERKE,
      personal: [],
      staerkeManuell: { fuehrer: 0, unterfuehrer: 0, mannschaft: 5, gesamt: 5 },
      verpflegungManuell: { vegetarisch: 3, vegan: 0 },
      sofortbedarf: { verpflegungPersonen: 1, dieselLiter: 0, benzinLiter: 0, gemischLiter: 0, unterbringung: false, ruhezeitErforderlich: false },
    });
    expect(plausibilitaet(b).some((h) => /mehr Vegetarier\/Veganer/.test(h))).toBe(true);
  });
});

describe("Konstruktoren für neue Objekte", () => {
  it("neuerBogen() ist ein leerer THW-Bogen der aktuellen Schema-Version", () => {
    const b = neuerBogen();
    expect(b.schemaVersion).toBe(SCHEMA_VERSION);
    expect(b.einheit.organisation).toBe(OrganisationsTyp.THW);
    expect(b.personal).toEqual([]);
    expect(b.fahrzeuge).toEqual([]);
    expect(b.einsatz.zeitraumVon).toBe(b.einsatz.zeitraumBis);
  });

  it("neuePerson()/neuesFahrzeug() liefern sinnvolle Defaults", () => {
    const p = neuePerson();
    expect(p).toMatchObject({ vorname: "", nachname: "", fahrerlaubnis: Fahrerlaubnis.NONE, ernaehrung: Ernaehrung.FLEISCH });
    expect(neuesFahrzeug()).toEqual({ typ: {} });
  });
});

describe("schrittStatus", () => {
  it("meldet für einen leeren Bogen alle Schritte als leer", () => {
    expect(schrittStatus(neuerBogen())).toEqual(["leer", "leer", "leer", "leer", "leer"]);
  });

  it("meldet einen vollständig gefüllten Bogen als ok", () => {
    const b = neuerBogen();
    b.einheit.einheitsTyp = { code: 43 };
    b.einheit.hierarchie = [{ bezeichnung: { code: 1 }, name: "OV Oldenburg - Ni" }];
    b.einsatz.ortAuftrag = "Übung Kabelblitz";
    b.personal = [neuePerson()];
    b.fahrzeuge = [neuesFahrzeug()];
    b.sofortbedarf = { verpflegungPersonen: 1, dieselLiter: 0, benzinLiter: 0, gemischLiter: 0, unterbringung: false, ruhezeitErforderlich: false };
    expect(schrittStatus(b)).toEqual(["ok", "ok", "ok", "ok", "ok"]);
  });

  it("erkennt Zwischenzustände als begonnen", () => {
    const b = neuerBogen();
    b.einheit.hierarchie = [{ bezeichnung: { code: 1 }, name: "OV X" }]; // Typ fehlt noch → begonnen
    b.einsatz.einsatzbeginn = 1000; // Ort fehlt noch → begonnen
    b.personalErfassung = PersonalErfassung.NUR_STAERKE;
    b.staerkeManuell = { fuehrer: 0, unterfuehrer: 0, mannschaft: 0, gesamt: 0 };
    b.personal = [neuePerson()]; // Ansprechpartner erfasst, Stärke aber 0 → begonnen
    const s = schrittStatus(b);
    expect(s[0]).toBe("begonnen");
    expect(s[1]).toBe("begonnen");
    expect(s[2]).toBe("begonnen");
  });
});

describe("qrErzeugen(): Herkunft eines fremden Bogens", () => {
  const GERAET = new Uint8Array(32).fill(5); // wie im Mock oben

  /** Payload, wie ihn ein anderes Gerät signiert übergeben hätte. */
  async function fremderPayload(b: Erfassungsbogen, name = "Melder") {
    const fremd = await schluesselpaarErzeugen();
    const payload = await signiertePayloadBytes(b, browserKompressor, fremd.privat, { name });
    return { payload, pubkey: fremd.oeffentlich };
  }

  function ausQr(qr: { vollUrl: string }) {
    return payloadAusText(qr.vollUrl)!;
  }

  it("zeichnet einen unveränderten Empfang gegen und erhält die Original-Signatur", async () => {
    const b = neuerBogen();
    b.einsatz.ortAuftrag = "Übung Kabelblitz";
    const { payload, pubkey } = await fremderPayload(b);
    // Der Bogen, der offen liegt, ist genau der empfangene.
    const empfangen = decodePayload(payload, browserKompressor);

    const qr = await qrErzeugen(empfangen, payload);

    expect(qr.weitergeleitet).toBe(true);
    const status = await signaturVonPayload(ausQr(qr));
    expect(status.zustand).toBe("gueltig");
    if (status.zustand !== "gueltig") return;
    expect(status.stufen?.map((s) => s.kurzform)).toEqual([
      schluesselKurzform(pubkey),
      schluesselKurzform(await oeffentlicherSchluessel(GERAET)),
    ]);
  });

  it("signiert nach einer Bearbeitung allein selbst (fremde Signatur deckt die Änderung nicht)", async () => {
    const b = neuerBogen();
    b.einsatz.ortAuftrag = "Übung Kabelblitz";
    const { payload } = await fremderPayload(b);
    const bearbeitet = decodePayload(payload, browserKompressor);
    bearbeitet.einsatz.ortAuftrag = "Nachtrag durch Meldekopf";

    const qr = await qrErzeugen(bearbeitet, payload);

    expect(qr.weitergeleitet).toBe(false);
    const status = await signaturVonPayload(ausQr(qr));
    expect(status.zustand).toBe("gueltig");
    if (status.zustand !== "gueltig") return;
    expect(status.stufen).toBeUndefined(); // keine Kette — eigener Bogen
    expect(status.kurzform).toBe(schluesselKurzform(await oeffentlicherSchluessel(GERAET)));
  });

  it("signiert ohne Herkunft wie bisher", async () => {
    const qr = await qrErzeugen(neuerBogen());
    expect(qr.weitergeleitet).toBe(false);
    expect(qr.stufen).toBe(1); // nur die eigene Signatur
  });

  it("fällt bei unsigniertem Empfang auf die eigene Signatur zurück", async () => {
    const b = neuerBogen();
    const roh = encodePayload(b, browserKompressor);
    const qr = await qrErzeugen(decodePayload(roh, browserKompressor), roh);
    expect(qr.weitergeleitet).toBe(false);
    expect((await signaturVonPayload(ausQr(qr))).zustand).toBe("gueltig");
  });
});

describe("qrErzeugen(): Textlink (vollUrl)", () => {
  it("ist Base64url-kodiert — Chat-Programme erkennen den ganzen Link", async () => {
    const b = neuerBogen();
    b.einsatz.ortAuftrag = "Übung Kabelblitz";
    const qr = await qrErzeugen(b);
    const fragment = qr.vollUrl.slice(EEB_URL_PREFIX.length);
    // Nur A–Z a–z 0–9 - _ : an keinem dieser Zeichen bricht die Link-Erkennung ab.
    expect(fragment).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("trägt denselben Payload wie das QR-Bild (dort Base41)", async () => {
    const qr = await qrErzeugen(neuerBogen());
    expect(payloadAusText(qr.vollUrl)).toEqual(payloadAusText(qr.teile[0]!.url));
  });
});

describe("qrErzeugen(): QR-Budget (Modulgröße statt Datenmenge)", () => {
  /** Modulzahl je Kante — das ist es, was auf Papier über die Punktgröße entscheidet. */
  const module = (url: string) => 17 + 4 * QRCode.create(url, { errorCorrectionLevel: "M" }).version;

  /** Bogen mit `n` ausführlich erfassten Personen — treibt den Payload gezielt hoch. */
  function grosserBogen(n: number): Erfassungsbogen {
    const b = neuerBogen();
    b.personalErfassung = PersonalErfassung.VOLLSTAENDIG;
    b.personal = Array.from({ length: n }, (_, i) =>
      person({
        vorname: `Vorname${i}`,
        nachname: `Nachname${i}`,
        funktionen: [{ freitext: `Sonderfunktion ${i}` }],
        kontakte: [{ art: KontaktArt.MOBIL, dienstlich: false, wert: "01701234501" }],
        zusatzqualifikationen: [{ freitext: `Qualifikation ${i}` }],
      }),
    );
    return b;
  }

  it("hält einen normalen Bogen in einem Code — und den unter 89 Modulen", async () => {
    const qr = await qrErzeugen(grosserBogen(6));
    expect(qr.segmentiert).toBe(false);
    expect(qr.teile).toHaveLength(1);
    expect(module(qr.teile[0]!.url)).toBeLessThanOrEqual(17 + 4 * QR_EINZEL_MAX_VERSION); // ≤ 89
  });

  it("teilt einen großen Bogen lieber auf, als die Module fein werden zu lassen", async () => {
    const qr = await qrErzeugen(grosserBogen(60));
    expect(qr.segmentiert).toBe(true);
    expect(qr.teile.length).toBeGreaterThan(1);
    // Jeder Teil bleibt grob genug fürs Handy — das ist der Zweck der Aufteilung.
    for (const t of qr.teile) {
      expect(module(t.url)).toBeLessThanOrEqual(17 + 4 * QR_SEGMENT_ZIEL_VERSION); // ≤ 69
    }
  });

  it("setzt die Teile wieder zu genau dem Payload des Textlinks zusammen", async () => {
    const qr = await qrErzeugen(grosserBogen(60));
    const zusammengesetzt = segmentePayload(qr.teile.map((t) => parseSegmentUrl(t.url)));
    expect(zusammengesetzt).toEqual(payloadAusText(qr.vollUrl));
  });
});

describe("natoZeitstempel()", () => {
  it("setzt Tag, Uhrzeit, Monatskürzel und Jahr zusammen", () => {
    expect(natoZeitstempel(new Date(2026, 7, 10, 20, 35))).toBe("102035aug26");
  });

  it("füllt einstellige Werte mit Null auf", () => {
    expect(natoZeitstempel(new Date(2026, 0, 3, 7, 5))).toBe("030705jan26");
  });
});

describe("inflateRawBegrenzt()", () => {
  it("entpackt normale Daten unverändert", () => {
    const original = new TextEncoder().encode("Erfassungsbogen".repeat(100));
    expect(inflateRawBegrenzt(deflateRaw(original))).toEqual(original);
    // Und über den regulären Weg des Kompressors ebenso.
    expect(browserKompressor.inflateRaw(browserKompressor.deflateRaw(original))).toEqual(original);
  });

  it("bricht ab, bevor eine Deflate-Bombe den Speicher füllt", () => {
    // 8 MiB Nullbytes packen sich auf wenige Kilobyte zusammen — genau der
    // Fall, den eine präparierte Importdatei ausnutzen würde.
    const bombe = deflateRaw(new Uint8Array(8 * 1024 * 1024));
    expect(bombe.length).toBeLessThan(64 * 1024);
    expect(() => inflateRawBegrenzt(bombe)).toThrow(RangeError);
    expect(() => browserKompressor.inflateRaw(bombe)).toThrow(RangeError);
  });

  it("lässt die Grenze selbst noch durch und alles darüber nicht mehr", () => {
    expect(inflateRawBegrenzt(deflateRaw(new Uint8Array(1000)), 1000)).toHaveLength(1000);
    expect(() => inflateRawBegrenzt(deflateRaw(new Uint8Array(1001)), 1000)).toThrow(RangeError);
  });

  it("hält für echte Bögen reichlich Luft (4 MiB)", () => {
    expect(MAX_ENTPACKT).toBe(4 * 1024 * 1024);
  });
});
