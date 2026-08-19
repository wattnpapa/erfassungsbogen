/**
 * Tests des Fremdformats „Oldenburg". Geprüft wird gegen die AUSGEPACKTE Datei:
 * ein XLSX ist ein ZIP, und nur was Excel dort findet, zählt. Der Test packt mit
 * `inflateRaw` (pako) wieder aus — dieselbe Bibliothek, die schreibt, aber der
 * Weg zurück deckt kaputte ZIP-Kopfdaten und falsche Längen auf.
 *
 * Spalten werden über die Kopfzeile gesucht, nicht über Buchstaben: sonst müsste
 * jeder Test angefasst werden, wenn die Vorlage einmal eine Spalte einschiebt.
 */

import { describe, it, expect } from "vitest";
import { inflateRaw } from "pako";
import {
  Ernaehrung,
  Fahrerlaubnis,
  Geschlecht,
  KontaktArt,
  OrganisationsTyp,
  PersonalErfassung,
  SCHEMA_VERSION,
  StaerkeRolle,
  type Erfassungsbogen,
  type Person,
} from "../model";
import { MeldeStatus, bogenInhaltsId, einheitSchluessel, type Einsatzsammlung, type MeldeEintrag } from "./einsaetze";
import { bogenOldenburgXlsx, einsatzOldenburgXlsx } from "./oldenburg-xlsx";
import { spaltenName } from "./xlsx";

// ------------------------------------------------------------------ Fixtures

function person(over: Partial<Person> = {}): Person {
  return {
    vorname: "Hans",
    nachname: "Müller",
    staerkeRolle: StaerkeRolle.MANNSCHAFT,
    funktionen: [],
    fahrerlaubnis: Fahrerlaubnis.NONE,
    geschlecht: Geschlecht.M,
    ernaehrung: Ernaehrung.FLEISCH,
    kontakte: [],
    zusatzqualifikationen: [],
    ...over,
  };
}

/** THW-Einheitstyp 25 = „FGr E" / „Fachgruppe Elektroversorgung" (wie in der Vorlage). */
function bogen(over: Partial<Erfassungsbogen> = {}): Erfassungsbogen {
  return {
    schemaVersion: SCHEMA_VERSION,
    stand: 100 * 1440,
    einheit: {
      organisation: OrganisationsTyp.THW,
      einheitsTyp: { code: 25 },
      hierarchie: [
        { bezeichnung: { code: 1 }, name: "Oldenburg", kurz: "OODE", telefon: "044112345", email: "ov@example.org" },
      ],
    },
    einsatz: { zeitraumVon: 100, zeitraumBis: 130, ortAuftrag: "Deichverteidigung" },
    personalErfassung: PersonalErfassung.VOLLSTAENDIG,
    personal: [
      person({
        nachname: "Chef",
        staerkeRolle: StaerkeRolle.FUEHRER,
        kontakte: [{ art: KontaktArt.MOBIL, dienstlich: true, wert: "01711234567" }],
      }),
      person({ nachname: "Weber", geschlecht: Geschlecht.W, ernaehrung: Ernaehrung.VEGAN }),
      person({ nachname: "Groß", geschlecht: Geschlecht.D, ernaehrung: Ernaehrung.VEGETARISCH }),
    ],
    fahrzeuge: [{ typ: { code: 2 } }, { typ: { code: 2 } }, { typ: { code: 3 } }],
    sofortbedarf: {
      verpflegungPersonen: 3,
      dieselLiter: 40,
      benzinLiter: 0,
      gemischLiter: 0,
      unterbringung: true,
      ruhezeitErforderlich: false,
    },
    ...over,
  };
}

function meldung(b: Erfassungsbogen, over: Partial<MeldeEintrag> = {}): MeldeEintrag {
  return {
    id: bogenInhaltsId(b),
    einheitSchluessel: einheitSchluessel(b.einheit),
    empfangenAm: 1000,
    quelle: "scan",
    status: MeldeStatus.ANWESEND,
    bogen: b,
    ...over,
  };
}

function sammlung(eintraege: MeldeEintrag[]): Einsatzsammlung {
  return { id: "e1", name: "Sturmflut 26", art: 0, angelegt: 0, geaendert: 0, eintraege };
}

// ------------------------------------------------------------- ZIP auspacken

/** Alle Einträge eines ZIP-Containers als Text — über das Central Directory. */
function zipLesen(bytes: Uint8Array): Map<string, string> {
  const sicht = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  // End-of-Central-Directory vom Ende her suchen (kein Kommentar, also ganz hinten).
  let eocd = bytes.length - 22;
  while (eocd >= 0 && sicht.getUint32(eocd, true) !== 0x06054b50) eocd--;
  expect(eocd, "kein ZIP-Ende gefunden").toBeGreaterThanOrEqual(0);

  const anzahl = sicht.getUint16(eocd + 10, true);
  let pos = sicht.getUint32(eocd + 16, true);
  const aus = new Map<string, string>();
  const dekoder = new TextDecoder();

  for (let i = 0; i < anzahl; i++) {
    expect(sicht.getUint32(pos, true)).toBe(0x02014b50);
    const methode = sicht.getUint16(pos + 10, true);
    const gepacktLaenge = sicht.getUint32(pos + 20, true);
    const rohLaenge = sicht.getUint32(pos + 24, true);
    const nameLaenge = sicht.getUint16(pos + 28, true);
    const extraLaenge = sicht.getUint16(pos + 30, true);
    const kommentarLaenge = sicht.getUint16(pos + 32, true);
    const lokal = sicht.getUint32(pos + 42, true);
    const name = dekoder.decode(bytes.subarray(pos + 46, pos + 46 + nameLaenge));

    // Lokaler Kopf: 30 Bytes fest + Name + Extra, dann die Daten.
    expect(sicht.getUint32(lokal, true)).toBe(0x04034b50);
    const datenAb = lokal + 30 + sicht.getUint16(lokal + 26, true) + sicht.getUint16(lokal + 28, true);
    const gepackt = bytes.subarray(datenAb, datenAb + gepacktLaenge);
    const roh = methode === 8 ? inflateRaw(gepackt) : gepackt;
    expect(roh.length, `Länge von ${name}`).toBe(rohLaenge);
    aus.set(name, dekoder.decode(roh));

    pos += 46 + nameLaenge + extraLaenge + kommentarLaenge;
  }
  return aus;
}

function blatt(bytes: Uint8Array): string {
  const teile = zipLesen(bytes);
  // Ohne diese Teile öffnet Excel die Datei überhaupt nicht.
  for (const pflicht of [
    "[Content_Types].xml",
    "_rels/.rels",
    "xl/workbook.xml",
    "xl/_rels/workbook.xml.rels",
    "xl/styles.xml",
    "xl/worksheets/sheet1.xml",
  ]) {
    expect(teile.has(pflicht), `${pflicht} fehlt`).toBe(true);
  }
  return teile.get("xl/worksheets/sheet1.xml")!;
}

/** Zellinhalt als Text: Zahl, Inline-Text oder Formel („=…"). Fehlende Zelle → undefined. */
function zelle(blattXml: string, ref: string): string | undefined {
  const treffer = new RegExp(`<c r="${ref}"[^>]*?(/>|>(.*?)</c>)`, "s").exec(blattXml);
  if (!treffer) return undefined;
  const inhalt = treffer[2];
  if (inhalt == null) return "";
  const formel = /<f>(.*?)<\/f>/s.exec(inhalt);
  if (formel) return `=${formel[1]}`;
  const text = /<t[^>]*>(.*?)<\/t>/s.exec(inhalt);
  if (text) return text[1]!.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  const zahl = /<v>(.*?)<\/v>/s.exec(inhalt);
  return zahl ? zahl[1] : "";
}

/** Spaltenbuchstabe zu einem Kopfzeilen-Text (Zeile 2). */
function spalteVon(blattXml: string, kopf: string): string {
  for (let i = 0; i < 60; i++) {
    const name = spaltenName(i);
    if (zelle(blattXml, `${name}2`) === kopf) return name;
  }
  throw new Error(`Spalte „${kopf}" nicht in der Kopfzeile`);
}

/** Wert einer Datenzeile (1 = erste Datenzeile) über den Spaltennamen. */
function wert(blattXml: string, zeilenNr: number, kopf: string): string | undefined {
  return zelle(blattXml, `${spalteVon(blattXml, kopf)}${zeilenNr + 2}`);
}

// ------------------------------------------------------------------- Tests

describe("Oldenburg-XLSX: Aufbau", () => {
  it("hat die 37 Spalten der Vorlage in ihrer Reihenfolge", () => {
    const b = blatt(bogenOldenburgXlsx(bogen()));
    expect(zelle(b, "A2")).toBe("FüSt.");
    expect(zelle(b, "B2")).toBe("Bezeichnung");
    expect(zelle(b, "C2")).toBe("Organisation");
    expect(zelle(b, "D2")).toBe("Herkunft");
    expect(zelle(b, "AA2")).toBe("ID Einheiten-Erfassungsbogen");
    expect(zelle(b, "AK2")).toBe("He");
    // Dahinter ist Schluss: die Gesamtspalte der Vorlage entfällt, weil sie nur
    // Fü + Ufü + He wiederholt.
    expect(zelle(b, "AL2")).toBeUndefined();
  });

  it("trägt die Hinweisleiste und die SUBTOTAL-Summen in Zeile 1", () => {
    const b = blatt(bogenOldenburgXlsx(bogen()));
    expect(zelle(b, "K1")).toBe("(Funk / Tel. / eMail)");
    expect(zelle(b, "L1")).toBe("(Dat. / Zeit)");
    expect(zelle(b, "P1")).toBe("(Org.)");
    // Eine Datenzeile → Bereich endet auf Zeile 3.
    expect(zelle(b, "AK1")).toBe("=SUBTOTAL(9,AK3:AK3)");
  });

  it("weitet den Summenbereich auf alle Datenzeilen aus", () => {
    const s = sammlung([
      meldung(bogen()),
      meldung(bogen({ einheit: { ...bogen().einheit, einheitsTyp: { code: 4 } } })),
      meldung(bogen({ einheit: { ...bogen().einheit, einheitsTyp: { code: 16 } } })),
    ]);
    expect(zelle(blatt(einsatzOldenburgXlsx(s)), "AI1")).toBe("=SUBTOTAL(9,AI3:AI5)");
  });

  it("bleibt bei einer leeren Sammlung eine gültige Datei", () => {
    const b = blatt(einsatzOldenburgXlsx(sammlung([])));
    expect(zelle(b, "A2")).toBe("FüSt.");
    // Leerer Bereich: die Summe darf nicht auf „AB3:AB2" zeigen.
    expect(zelle(b, "AB1")).toBe("=SUBTOTAL(9,AB3:AB3)");
    expect(zelle(b, "A3")).toBeUndefined();
  });

  it("gibt den Datumsspalten Breite, damit dort kein „########\" steht", () => {
    const b = blatt(bogenOldenburgXlsx(bogen()));
    // L, M, O, S, T, U sind die Spalten mit „(Dat. / Zeit)".
    for (const spalte of [12, 13, 15, 19, 20, 21]) {
      expect(b).toContain(`<col min="${spalte}" max="${spalte}" width="16.5" customWidth="1"/>`);
    }
  });

  it("verbindet A1:C1 wie die Vorlage", () => {
    expect(blatt(bogenOldenburgXlsx(bogen()))).toContain('<mergeCell ref="A1:C1"/>');
  });
});

describe("Oldenburg-XLSX: Werte", () => {
  it("füllt Bezeichnung, Organisation und Herkunft", () => {
    const b = blatt(bogenOldenburgXlsx(bogen()));
    expect(wert(b, 1, "Bezeichnung")).toBe("FGr E");
    expect(wert(b, 1, "Organisation")).toBe("THW");
    expect(wert(b, 1, "Herkunft")).toBe("OV Oldenburg (OODE)");
  });

  it("sortiert die Einheit nach ihrer Ebene in Zug/Trupp/Gruppe ein", () => {
    const ebene = (code: number, kopf: string) =>
      wert(blatt(bogenOldenburgXlsx(bogen({ einheit: { ...bogen().einheit, einheitsTyp: { code } } }))), 1, kopf);
    // 25 = Fachgruppe Elektroversorgung → Gruppe
    expect(ebene(25, "Gruppe")).toBe("FGr E");
    expect(ebene(25, "Trupp o.")).toBeUndefined();
    // 20 = Trupp Einsatzstellensicherung → Trupp
    expect(ebene(20, "Trupp o.")).toBe("Tr ESS");
    // 3 = Zugtrupp Technischer Zug → Trupp, NICHT Zug (Reihenfolge der Prüfung)
    expect(ebene(3, "Trupp o.")).toBe("ZTr TZ");
    expect(ebene(3, "Zug")).toBeUndefined();
  });

  it("nimmt bei Freitext-Einheitstypen den Zug aus dem Text", () => {
    const b = bogen({
      einheit: {
        organisation: OrganisationsTyp.FEUERWEHR,
        einheitsTyp: { freitext: "Löschzug" },
        hierarchie: [{ bezeichnung: { code: 1 }, name: "Wardenburg" }],
      },
    });
    expect(wert(blatt(bogenOldenburgXlsx(b)), 1, "Zug")).toBe("Löschzug");
  });

  it("führt eine Ein-Personen-Einheit als Person", () => {
    const b = bogen({ personal: [person()], einheit: { ...bogen().einheit, einheitsTyp: { freitext: "Fachberater" } } });
    expect(wert(blatt(bogenOldenburgXlsx(b)), 1, "Person")).toBe("Fachberater");
  });

  it("fasst gleiche Fahrzeugtypen mit Stückzahl zusammen", () => {
    // Fixture: zweimal Typ 2, einmal Typ 3.
    expect(wert(blatt(bogenOldenburgXlsx(bogen())), 1, "Geräte / Fahrzeuge")).toMatch(/^2× /);
  });

  it("schreibt Stärke, Verpflegung und Unterbringung als Zahlen", () => {
    const b = blatt(bogenOldenburgXlsx(bogen()));
    expect(wert(b, 1, "Fü")).toBe("1");
    expect(wert(b, 1, "He")).toBe("2");
    expect(wert(b, 1, "Ufü")).toBe("0");
    expect(wert(b, 1, "Weibl.")).toBe("1");
    expect(wert(b, 1, "Div.")).toBe("1");
    expect(wert(b, 1, "Vegan.")).toBe("1");
    expect(wert(b, 1, "Veget.")).toBe("1");
    // Unterbringung angefordert → ÜN gefüllt
    expect(wert(b, 1, "ÜN (w)")).toBe("1");
  });

  it("setzt ÜN auf 0, wenn keine Unterbringung angefordert ist", () => {
    const ohne = bogen({ sofortbedarf: { ...bogen().sofortbedarf!, unterbringung: false } });
    const b = blatt(bogenOldenburgXlsx(ohne));
    // Nicht leer, sondern eine echte Null: die Zahlenspalten der Vorlage hängen
    // an SUBTOTAL, und eine leere Zelle liest sich dort wie „noch nicht gemeldet".
    expect(wert(b, 1, "ÜN (m)")).toBe("0");
    expect(wert(b, 1, "ÜN (w)")).toBe("0");
    // Die Kopfzahl der Frauen bleibt trotzdem stehen — sie ist keine Bettenzahl.
    expect(wert(b, 1, "Weibl.")).toBe("1");
  });

  it("schreibt Verfügbar-bis als Excel-Datumszahl", () => {
    // EEB-Tag 130 → 43831 + 130
    expect(wert(blatt(bogenOldenburgXlsx(bogen())), 1, "Verfügbar\n bis")).toBe("43961");
  });

  it("schreibt Einsatzbeginn mit Uhrzeit als Bruchteil eines Tages", () => {
    const b = bogen({ einsatz: { ...bogen().einsatz, einsatzbeginn: 130 * 1440 + 8 * 60 + 30 } });
    // 08:30 = 0,354166… Tage
    const roh = wert(blatt(bogenOldenburgXlsx(b)), 1, "eingetr. / zugew.")!;
    expect(Number(roh)).toBeCloseTo(43961 + 8.5 / 24, 6);
  });

  it("nennt die Erreichbarkeit der Führungskraft", () => {
    expect(wert(blatt(bogenOldenburgXlsx(bogen())), 1, "Erreichbar_\nkeit")).toContain("01711234567");
  });

  it("fällt auf die Kontakte der Einheit zurück, wenn niemand erreichbar erfasst ist", () => {
    const b = bogen({ personal: [person()] });
    const text = wert(blatt(bogenOldenburgXlsx(b)), 1, "Erreichbar_\nkeit")!;
    expect(text).toBe("Tel: 044112345 / eMail: ov@example.org");
  });

  it("bleibt in der Erreichbarkeit einzeilig wie die Vorlage", () => {
    // Die Datenzellen der Vorlage haben in dieser Spalte KEINEN Zeilenumbruch —
    // mit „\n" stünde dort für die Führungsstelle nur die erste Zeile sichtbar.
    expect(wert(blatt(bogenOldenburgXlsx(bogen())), 1, "Erreichbar_\nkeit")).not.toContain("\n");
  });

  it("markiert Übungsbögen in der Bemerkung", () => {
    const b = blatt(bogenOldenburgXlsx(bogen({ uebung: true, sonstiges: "Zwei Anhänger" })));
    expect(wert(b, 1, "Bemerkung")).toBe("ÜBUNG — Zwei Anhänger");
  });

  it("lässt die Spalten der Führungsstelle ohne Wert", () => {
    const b = blatt(bogenOldenburgXlsx(bogen()));
    // Ohne Datumsformat: Zelle gar nicht erst geschrieben.
    for (const kopf of ["FüSt.", "Anforderungs \n- ID", "Reserve", "Schicht", "Vorgesehene Einheit"]) {
      expect(wert(b, 1, kopf), kopf).toBeUndefined();
    }
    // Mit Datumsformat: leere Zelle, aber vorformatiert — hier tippt die
    // Führungsstelle später von Hand hinein.
    for (const kopf of ["Ablösung angefordert", "Zugesagt \nfür", "Rück-\nführung"]) {
      expect(wert(b, 1, kopf), kopf).toBe("");
    }
  });

  it("trägt die Bogen-ID, damit die Führungsstelle Meldungen wiedererkennt", () => {
    const b = bogen();
    expect(wert(blatt(bogenOldenburgXlsx(b)), 1, "ID Einheiten-Erfassungsbogen")).toBe(bogenInhaltsId(b));
  });

  it("schützt vor Formel-Einschleusung aus fremden Bögen", () => {
    // Text mit „<" und „&" darf das XML nicht zerreißen (CSV-Injection hat hier
    // kein Gegenstück: inlineStr-Text wird von Excel nie als Formel gelesen).
    const b = bogen({ sonstiges: '=HYPERLINK("x") & <böse>' });
    expect(wert(blatt(bogenOldenburgXlsx(b)), 1, "Bemerkung")).toBe('=HYPERLINK("x") & <böse>');
  });
});

describe("Oldenburg-XLSX: Sammlung", () => {
  it("schreibt je Einheit eine Zeile, nach Anzeigename sortiert", () => {
    const einheit = bogen().einheit;
    const s = sammlung([
      meldung(bogen({ einheit: { ...einheit, einheitsTyp: { code: 4 } } })), // Bergungsgruppe
      meldung(bogen()), // Fachgruppe Elektroversorgung
    ]);
    const b = blatt(einsatzOldenburgXlsx(s));
    expect(wert(b, 1, "Bezeichnung")).toBe("B");
    expect(wert(b, 2, "Bezeichnung")).toBe("FGr E");
    expect(wert(b, 3, "Bezeichnung")).toBeUndefined();
  });

  it("übernimmt Status, Zug-Etikett und Teil-Bezeichnung aus der Meldung", () => {
    const s = sammlung([
      meldung(bogen(), { status: MeldeStatus.ABGERUECKT, zugEtikett: "2. TZ", teilEtikett: "Fachberater" }),
    ]);
    const b = blatt(einsatzOldenburgXlsx(s));
    expect(wert(b, 1, "Status")).toBe("Abgerückt");
    // Die Einheit ist eine Gruppe → die Zug-Spalte trägt die Zuordnung des Meldekopfs.
    expect(wert(b, 1, "Zug")).toBe("2. TZ");
    expect(wert(b, 1, "Bezeichnung")).toBe("FGr E (Fachberater)");
  });

  it("nimmt je Einheit nur die neueste Revision", () => {
    const alt = bogen({ stand: 100 * 1440 });
    const neu = bogen({ stand: 101 * 1440, sonstiges: "Nachmeldung" });
    const b = blatt(einsatzOldenburgXlsx(sammlung([meldung(alt), meldung(neu, { empfangenAm: 2000 })])));
    expect(wert(b, 1, "Bemerkung")).toBe("Nachmeldung");
    expect(wert(b, 2, "Bezeichnung")).toBeUndefined();
  });

  it("nimmt die Eintrags-ID der Sammlung als Bogen-ID", () => {
    const e = meldung(bogen(), { id: "abc12345" });
    expect(wert(blatt(einsatzOldenburgXlsx(sammlung([e]))), 1, "ID Einheiten-Erfassungsbogen")).toBe("abc12345");
  });
});

describe("Oldenburg-XLSX: Datei", () => {
  it("ist ein ZIP und byteweise reproduzierbar", () => {
    const a = bogenOldenburgXlsx(bogen());
    const b = bogenOldenburgXlsx(bogen());
    expect([...a.subarray(0, 2)]).toEqual([0x50, 0x4b]); // „PK"
    expect(a).toEqual(b);
  });
});
