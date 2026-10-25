import { describe, it, expect, beforeEach } from "vitest";
import { deflate } from "pako";
import {
  OrganisationsTyp,
  PersonalErfassung,
  SCHEMA_VERSION,
  StaerkeRolle,
  Fahrerlaubnis,
  Geschlecht,
  Ernaehrung,
  type Erfassungsbogen,
  type Person,
} from "@bos/eeb-format/model";
import { einsatzAnlegen, einsaetzeLaden, einsatzImportieren, meldungHinzufuegen,
  speicherhuelleSetzen,
} from "@bos/meldekopf/einsaetze";
import { ablehnungsSatz, abgelehnteBoegen, boegenAusJsonTextMitUrsachen, boegenAusPdfBytes, einsatzAusDatei, einsatzAusPdfBytes, einsatzDateiInhalt, pdfInhaltArt } from "./einsatz-transport";

class MemStorage {
  private m = new Map<string, string>();
  get length() { return this.m.size; }
  clear() { this.m.clear(); }
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
}

beforeEach(() => {
  const mem = new MemStorage() as unknown as Storage;
  (globalThis as { localStorage?: Storage }).localStorage = mem;
  // Die Einsatz-Sammlung bekommt ihre Ablage hineingereicht (ADR-003).
  speicherhuelleSetzen(mem);
});

function person(nachname: string, rolle: StaerkeRolle): Person {
  return { vorname: "T", nachname, staerkeRolle: rolle, funktionen: [], fahrerlaubnis: Fahrerlaubnis.NONE, geschlecht: Geschlecht.M, ernaehrung: Ernaehrung.FLEISCH, kontakte: [], zusatzqualifikationen: [] };
}

function bogen(over: Partial<Erfassungsbogen> = {}): Erfassungsbogen {
  return {
    schemaVersion: SCHEMA_VERSION,
    stand: 100,
    einheit: { organisation: OrganisationsTyp.THW, einheitsTyp: { code: 1 }, hierarchie: [{ bezeichnung: { code: 1 }, name: "OV Oldenburg" }] },
    einsatz: { zeitraumVon: 100, zeitraumBis: 130, ortAuftrag: "Lage" },
    personalErfassung: PersonalErfassung.VOLLSTAENDIG,
    personal: [person("Berger", StaerkeRolle.FUEHRER)],
    fahrzeuge: [],
    ...over,
  };
}

/** Baut minimale „PDF"-Bytes mit einem stream…endstream-Block um die Nutzlast. */
function pdfMitStream(payload: Uint8Array): Uint8Array {
  const pre = new TextEncoder().encode("%PDF-1.7\n1 0 obj\n<< /Type /EmbeddedFile /Filter /FlateDecode >>\nstream\n");
  const post = new TextEncoder().encode("\nendstream\nendobj\n%%EOF");
  const out = new Uint8Array(pre.length + payload.length + post.length);
  out.set(pre, 0);
  out.set(payload, pre.length);
  out.set(post, pre.length + payload.length);
  return out;
}

describe("einsatzAusDatei() / einsatzDateiInhalt()", () => {
  it("überlebt einen Roundtrip über den Datei-Umschlag", () => {
    const s = einsatzAnlegen("Hochwasser", 0, "Oldenburg");
    meldungHinzufuegen(s.id, bogen());
    const geladen = einsaetzeLaden()[0]!;
    const wieder = einsatzAusDatei(einsatzDateiInhalt(geladen));
    expect(wieder.id).toBe(geladen.id);
    expect(wieder.eintraege).toHaveLength(1);
  });

  it("akzeptiert auch eine bloße Sammlung ohne Umschlag", () => {
    const s = einsatzAnlegen("E", 0);
    meldungHinzufuegen(s.id, bogen());
    const roh = JSON.stringify(einsaetzeLaden()[0]);
    expect(einsatzAusDatei(roh).eintraege).toHaveLength(1);
  });

  it("wirft bei ungültiger Datei", () => {
    expect(() => einsatzAusDatei("{kein json")).toThrow();
    expect(() => einsatzAusDatei(JSON.stringify({ irgendwas: true }))).toThrow();
  });
});

describe("boegenAusPdfBytes()", () => {
  it("findet einen roh eingebetteten Bogen", () => {
    const json = new TextEncoder().encode(JSON.stringify(bogen()));
    const boegen = boegenAusPdfBytes(pdfMitStream(json));
    expect(boegen).toHaveLength(1);
    expect(boegen[0]!.einheit.hierarchie[0]!.name).toBe("OV Oldenburg");
  });

  it("entpackt einen FlateDecode-komprimierten Bogen", () => {
    const json = new TextEncoder().encode(JSON.stringify(bogen({ stand: 105 })));
    const boegen = boegenAusPdfBytes(pdfMitStream(deflate(json)));
    expect(boegen).toHaveLength(1);
    expect(boegen[0]!.stand).toBe(105);
  });

  it("findet ein eingebettetes Bogen-Array (Sammel-PDF)", () => {
    const arr = [bogen({ stand: 100 }), bogen({ einheit: { organisation: 1, einheitsTyp: { code: 1 }, hierarchie: [{ bezeichnung: { code: 1 }, name: "OV Wardenburg" }] } })];
    const json = new TextEncoder().encode(JSON.stringify(arr));
    const boegen = boegenAusPdfBytes(pdfMitStream(deflate(json)));
    expect(boegen).toHaveLength(2);
  });

  it("liefert nichts, wenn kein Bogen-JSON enthalten ist", () => {
    const noise = new TextEncoder().encode("BT /F1 12 Tf (Hallo) Tj ET");
    expect(boegenAusPdfBytes(pdfMitStream(noise))).toHaveLength(0);
  });
});

describe("einsatzAusPdfBytes()", () => {
  it("findet den roh eingebetteten Einsatz-Umschlag (inkl. Metadaten)", () => {
    const s = einsatzAnlegen("Schichtübergabe", 0, "Oldenburg");
    meldungHinzufuegen(s.id, bogen());
    const umschlag = einsatzDateiInhalt(einsaetzeLaden()[0]!);
    const gefunden = einsatzAusPdfBytes(pdfMitStream(new TextEncoder().encode(umschlag)));
    expect(gefunden?.name).toBe("Schichtübergabe");
    expect(gefunden?.eintraege).toHaveLength(1);
  });

  it("entpackt einen FlateDecode-komprimierten Umschlag", () => {
    const s = einsatzAnlegen("E", 0);
    meldungHinzufuegen(s.id, bogen());
    const umschlag = einsatzDateiInhalt(einsaetzeLaden()[0]!);
    const gefunden = einsatzAusPdfBytes(pdfMitStream(deflate(new TextEncoder().encode(umschlag))));
    expect(gefunden?.id).toBe(s.id);
  });

  it("liefert null ohne Umschlag — eine bloße Bogen-Liste ist keine Sammlung", () => {
    const json = new TextEncoder().encode(JSON.stringify([bogen()]));
    expect(einsatzAusPdfBytes(pdfMitStream(json))).toBeNull();
    const noise = new TextEncoder().encode("BT /F1 12 Tf (Hallo) Tj ET");
    expect(einsatzAusPdfBytes(pdfMitStream(noise))).toBeNull();
  });
});

describe("pdfInhaltArt() — Rückmeldung von „Bögen einlesen…“ (R2-A1)", () => {
  it("unterscheidet Sammlung, eingebettete Bögen und eingescannten Ausdruck", () => {
    const s = einsatzAnlegen("Übergabe", 0);
    meldungHinzufuegen(s.id, bogen());
    const umschlag = einsatzDateiInhalt(einsaetzeLaden()[0]!);
    expect(pdfInhaltArt(pdfMitStream(deflate(new TextEncoder().encode(umschlag))))).toBe("sammlung");
    expect(pdfInhaltArt(pdfMitStream(new TextEncoder().encode(JSON.stringify([bogen()]))))).toBe("boegen");
    expect(pdfInhaltArt(pdfMitStream(new TextEncoder().encode("BT /F1 12 Tf (Hallo) Tj ET")))).toBe("nur-qr");
  });
});

describe("einsatzImportieren()", () => {
  it("legt einen unbekannten Einsatz neu an", () => {
    const s = einsatzAnlegen("Quelle", 0);
    meldungHinzufuegen(s.id, bogen());
    const kopie = einsatzAusDatei(einsatzDateiInhalt(einsaetzeLaden()[0]!));
    const mem = new MemStorage() as unknown as Storage;
    (globalThis as { localStorage?: Storage }).localStorage = mem;
    // Die Einsatz-Sammlung bekommt ihre Ablage hineingereicht (ADR-003).
    speicherhuelleSetzen(mem); // frisches Zielgerät
    const r = einsatzImportieren(kopie);
    expect(r.neuerEinsatz).toBe(true);
    expect(einsaetzeLaden()).toHaveLength(1);
  });

  it("führt gleiche Einsätze zusammen und dedupliziert Meldungen", () => {
    const s = einsatzAnlegen("E", 0);
    meldungHinzufuegen(s.id, bogen({ stand: 100 }));
    const stand1 = einsatzAusDatei(einsatzDateiInhalt(einsaetzeLaden()[0]!));
    // Zielgerät hat den Einsatz schon mit einer neueren Meldung.
    meldungHinzufuegen(s.id, bogen({ stand: 102 }));
    const r = einsatzImportieren(stand1); // enthält nur die alte Fassung
    expect(r.neuerEinsatz).toBe(false);
    expect(r.hinzugefuegt).toBe(0); // stand-100-Meldung ist bereits vorhanden
    expect(einsaetzeLaden()[0]!.eintraege).toHaveLength(2);
  });
});

describe("unvollständige Bögen in Dateien (R5-E1)", () => {
  function sammlungsDatei(boegen: Record<string, unknown>[]): string {
    const s = einsatzAnlegen("Hochwasser", 0);
    const eintrag = (b: Record<string, unknown>, i: number) => ({
      id: `e${i}`,
      einheitSchluessel: `k${i}`,
      empfangenAm: 1,
      quelle: "datei",
      status: 0,
      bogen: b,
    });
    return JSON.stringify({ typ: "eeb-einsatz", version: 1, einsatz: { ...s, eintraege: boegen.map(eintrag) } });
  }

  it("ergänzt einen fehlenden Einheitstyp, statt die App weiß zu machen", () => {
    const b = JSON.parse(JSON.stringify(bogen())) as Record<string, unknown>;
    delete (b.einheit as Record<string, unknown>).einheitsTyp;
    const s = einsatzAusDatei(sammlungsDatei([b]));
    expect(s.eintraege).toHaveLength(1);
    expect(s.eintraege[0]!.bogen.einheit.einheitsTyp).toEqual({});
  });

  it("lehnt einen Bogen ohne Einsatz mit Ursache ab und übernimmt die übrigen", () => {
    const gut = JSON.parse(JSON.stringify(bogen())) as Record<string, unknown>;
    const schlecht = JSON.parse(JSON.stringify(bogen())) as Record<string, unknown>;
    delete schlecht.einsatz;
    const s = einsatzAusDatei(sammlungsDatei([gut, schlecht]));
    expect(s.eintraege).toHaveLength(1);
    expect(abgelehnteBoegen(s)).toEqual(["die Angaben zum Einsatz fehlen"]);
    expect(ablehnungsSatz(abgelehnteBoegen(s), 2)).toBe(
      "1 von 2 Bögen ist unvollständig (die Angaben zum Einsatz fehlen) und wurde nicht übernommen.",
    );
  });

  it("legt keine leere Sammlung an, wenn kein Bogen lesbar ist", () => {
    const schlecht = JSON.parse(JSON.stringify(bogen())) as Record<string, unknown>;
    delete schlecht.personal;
    expect(() => einsatzAusDatei(sammlungsDatei([schlecht]))).toThrow(/Kein Bogen in der Datei ist lesbar/);
  });

  it("Bögen aus einer JSON-Datei: unvollständige mit Ursache, vollständige ergänzt", () => {
    const ohneTyp = JSON.parse(JSON.stringify(bogen())) as Record<string, unknown>;
    delete (ohneTyp.einheit as Record<string, unknown>).einheitsTyp;
    const ohneStand = JSON.parse(JSON.stringify(bogen())) as Record<string, unknown>;
    delete ohneStand.stand;
    const r = boegenAusJsonTextMitUrsachen(JSON.stringify([ohneTyp, ohneStand]));
    expect(r.boegen).toHaveLength(1);
    expect(r.abgelehnt).toEqual(["der Stand (Zeitpunkt der letzten Änderung) fehlt"]);
    expect(r.gesamt).toBe(2);
  });
});

describe("Stände der Exporte im Umschlag (Audit Runde 5, R5-W6)", () => {
  it("reisen im Umschlag mit, nicht in der Sammlung, und Nachtrag-Gründe bleiben draußen", async () => {
    const { einsatzDateiInhalt, einsatzAusDatei } = await import("./einsatz-transport");
    const s = { id: "e", name: "Lage", art: 0, angelegt: 1, geaendert: 1, eintraege: [], nachtragGruende: { x: { neu: true, gruende: ["neu"] } } } as never;
    const text = einsatzDateiInhalt(s, { csv: { zeitpunkt: 5, eintragIds: ["a"] } });
    expect(text).not.toContain("nachtragGruende");
    const zurueck = einsatzAusDatei(text);
    expect(zurueck.exportStaende?.csv?.eintragIds).toEqual(["a"]);
    expect(einsatzAusDatei(einsatzDateiInhalt(s)).exportStaende).toBeUndefined();
  });
});

describe("Einsatzbeginn und Funkrufname reisen mit (R7-K5)", () => {
  it("steht im Umschlag der Datei, wird gelesen, geprüft und nie in die Sammlung geschrieben", () => {
    const s = einsatzAnlegen("Hochwasser", 0);
    meldungHinzufuegen(s.id, bogen());
    const sammlung = einsaetzeLaden().find((x) => x.id === s.id)!;
    const text = einsatzDateiInhalt(sammlung, undefined, { beginn: 1_790_000_000_000, funkruf: "Salus Führung 1" });
    expect(JSON.parse(text).lage).toEqual({ beginn: 1_790_000_000_000, funkruf: "Salus Führung 1" });
    expect(JSON.parse(text).einsatz.lageAngaben).toBeUndefined();
    const gelesen = einsatzAusDatei(text);
    expect(gelesen.lageAngaben).toEqual({ beginn: 1_790_000_000_000, funkruf: "Salus Führung 1" });
  });

  it("lässt das Feld ohne Angaben weg und verwirft Unbrauchbares", () => {
    const s = einsatzAnlegen("Hochwasser", 0);
    meldungHinzufuegen(s.id, bogen());
    const sammlung = einsaetzeLaden().find((x) => x.id === s.id)!;
    expect(JSON.parse(einsatzDateiInhalt(sammlung)).lage).toBeUndefined();
    const roh = JSON.parse(einsatzDateiInhalt(sammlung));
    roh.lage = { beginn: "gestern", funkruf: 5 };
    expect(einsatzAusDatei(JSON.stringify(roh)).lageAngaben).toBeUndefined();
  });
});
