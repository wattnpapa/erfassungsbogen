/**
 * Abgleich zweier Geräte beim „Einsatz importieren…" (Audit Runde 3, R3-W1/R3-W2).
 *
 * Zwei Geräte = zwei getrennte Speicher. Die Weitergabe wird als JSON-Kopie
 * der Sammlung nachgestellt — genau das, was Sammel-PDF und Einsatz-Transport
 * eingebettet tragen.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { OrganisationsTyp, PersonalErfassung, SCHEMA_VERSION, type Erfassungsbogen } from "@bos/eeb-format/model";
import {
  EinsatzArt,
  MeldeStatus,
  einsaetzeLaden,
  einsatzAnlegen,
  neuesteJeEinheit,
  speicherhuelleSetzen,
  type Einsatzsammlung,
} from "@bos/meldekopf/einsaetze";
import { meldungAufnehmen, notizSetzen, statusMitZeitSetzen, zugSetzen, eintreffzeitSetzen } from "./eintrag-zeiten";
import { abgleichText, einsatzAbgleichen, sammlungFuerZiel } from "./einsatz-abgleich";
import { aenderungenSeit, neueEintraege, weitergabeStandLaden, weitergabeUmImportErgaenzen, weitergabeVermerken } from "./export-stand";

class MemStorage {
  private m = new Map<string, string>();
  get length() { return this.m.size; }
  clear() { this.m.clear(); }
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
}

let geraetA: MemStorage;
let geraetB: MemStorage;

function auf(g: MemStorage) {
  (globalThis as { localStorage?: Storage }).localStorage = g as unknown as Storage;
  speicherhuelleSetzen(g as unknown as Storage);
}

beforeEach(() => {
  geraetA = new MemStorage();
  geraetB = new MemStorage();
  auf(geraetA);
});

function bogen(ort: string, mannschaft = 3, stand = 100): Erfassungsbogen {
  return {
    schemaVersion: SCHEMA_VERSION,
    stand,
    einheit: { organisation: OrganisationsTyp.THW, einheitsTyp: { code: 1 }, hierarchie: [{ bezeichnung: { code: 1 }, name: ort }] },
    einsatz: { zeitraumVon: 100, zeitraumBis: 130, ortAuftrag: "Lage" },
    personalErfassung: PersonalErfassung.NUR_STAERKE,
    staerkeManuell: { fuehrer: 1, unterfuehrer: 0, mannschaft, gesamt: 1 + mannschaft },
    personal: [],
    fahrzeuge: [],
  };
}

function sammlung(id: string): Einsatzsammlung {
  return einsaetzeLaden().find((s) => s.id === id)!;
}

/** Weitergabe: Sammlung des aktiven Geräts als Datei. */
function weitergeben(id: string): Einsatzsammlung {
  return JSON.parse(JSON.stringify(sammlung(id))) as Einsatzsammlung;
}

function kopf(id: string, ort: string) {
  return neuesteJeEinheit(sammlung(id).eintraege).find((e) => e.bogen.einheit.hierarchie[0]!.name === ort)!;
}

/** Drei Einheiten auf A, weitergegeben an B. */
function buehne() {
  auf(geraetA);
  const s = einsatzAnlegen("Hochwasser", EinsatzArt.EINSATZ);
  for (const ort of ["Ulm", "Biberach", "Albstadt"]) meldungAufnehmen(s.id, bogen(ort), { quelle: "scan" });
  const datei = weitergeben(s.id);
  weitergabeVermerken(sammlung(s.id));
  auf(geraetB);
  einsatzAbgleichen(datei);
  return s.id;
}

describe("einsatzAbgleichen — Szenario 3 aus dem Audit", () => {
  it("übernimmt Abrücken, Zug und Auftrag des anderen Geräts und behält die eigene, jüngere Änderung", () => {
    const id = buehne();
    // B: Ulm abgerückt, Biberach 2. TZ mit Auftrag.
    auf(geraetB);
    statusMitZeitSetzen(id, kopf(id, "Ulm").id, MeldeStatus.ABGERUECKT, 2000);
    const bib = kopf(id, "Biberach");
    zugSetzen(id, bib.einheitSchluessel, bib.id, "2. TZ");
    notizSetzen(id, bib.id, "Ortung Trümmerkegel B27");
    // A: Albstadt abgerückt.
    auf(geraetA);
    statusMitZeitSetzen(id, kopf(id, "Albstadt").id, MeldeStatus.ABGERUECKT, 3000);

    // B gibt weiter, A importiert.
    auf(geraetB);
    const vonB = weitergeben(id);
    auf(geraetA);
    const r = einsatzAbgleichen(vonB);
    expect(r.hinzugefuegt).toBe(0);
    expect(r.widersprueche).toEqual([]);
    expect(r.aktualisiert.map((a) => a.einheit).sort()).toEqual(["Biberach", "Ulm"]);
    expect(kopf(id, "Ulm").status).toBe(MeldeStatus.ABGERUECKT);
    expect(kopf(id, "Ulm").abgerueckAm).toBe(2000);
    expect(kopf(id, "Biberach").zugEtikett).toBe("2. TZ");
    expect(kopf(id, "Biberach").notiz).toBe("Ortung Trümmerkegel B27");
    expect(kopf(id, "Albstadt").status).toBe(MeldeStatus.ABGERUECKT);
    const text = abgleichText(r);
    expect(text).toMatch(/^2 Meldungen aktualisiert: /);
    expect(text).toContain("Ulm abgerückt");
    expect(text).toContain("Biberach Zug „2. TZ“, Auftrag „Ortung Trümmerkegel B27“");

    // A gibt zurück, B importiert: Albstadt kommt an, beide Stände gleich.
    const vonA = weitergeben(id);
    auf(geraetB);
    const r2 = einsatzAbgleichen(vonA);
    expect(r2.aktualisiert.map((a) => a.einheit)).toEqual(["Albstadt"]);
    expect(kopf(id, "Albstadt").status).toBe(MeldeStatus.ABGERUECKT);
    const aufB = neuesteJeEinheit(sammlung(id).eintraege).map((e) => [e.einheitSchluessel, e.status, e.zugEtikett, e.notiz]);
    auf(geraetA);
    const aufA = neuesteJeEinheit(sammlung(id).eintraege).map((e) => [e.einheitSchluessel, e.status, e.zugEtikett, e.notiz]);
    expect(aufB.sort()).toEqual(aufA.sort());

    // Ein dritter Import ändert nichts mehr.
    auf(geraetB);
    const nochmal = weitergeben(id);
    auf(geraetA);
    const r3 = einsatzAbgleichen(nochmal);
    expect(r3.aktualisiert).toEqual([]);
    expect(abgleichText(r3)).toBe("");
  });
});

describe("einsatzAbgleichen — Szenario 2 (Folgemeldung auf dem anderen Gerät)", () => {
  it("hält den hier vergebenen Auftrag auf der von dort gekommenen Folgemeldung", () => {
    const id = buehne();
    auf(geraetA);
    notizSetzen(id, kopf(id, "Albstadt").id, "Lagekarte führen");
    auf(geraetB);
    meldungAufnehmen(id, bogen("Albstadt", 5, 110), { quelle: "scan" });
    const vonB = weitergeben(id);
    auf(geraetA);
    const r = einsatzAbgleichen(vonB);
    expect(r.hinzugefuegt).toBe(1);
    const k = kopf(id, "Albstadt");
    expect(k.bogen.staerkeManuell?.mannschaft).toBe(5);
    expect(k.notiz).toBe("Lagekarte führen");
    // Der Verlauf trägt den Vermerk weiter.
    expect(k.vermerke?.some((v) => v.text.startsWith("Auftrag/Notiz"))).toBe(true);
    // Für dieses Gerät ist das keine Aktualisierung — der Wert stand schon hier.
    expect(r.aktualisiert).toEqual([]);
  });
});

describe("einsatzAbgleichen — Widersprüche", () => {
  it("nennt einen Auftrag, den beide Geräte geändert haben, und lässt den jüngeren gelten", () => {
    const id = buehne();
    auf(geraetB);
    notizSetzen(id, kopf(id, "Ulm").id, "Deich Nord");
    const t = Date.now();
    auf(geraetA);
    notizSetzen(id, kopf(id, "Ulm").id, "Deich Süd");
    // A's Vermerk ist sicher jünger:
    const s = sammlung(id);
    const ulm = neuesteJeEinheit(s.eintraege).find((e) => e.bogen.einheit.hierarchie[0]!.name === "Ulm")!;
    ulm.vermerke![ulm.vermerke!.length - 1]!.zeit = t + 5000;
    geraetA.setItem("eeb.einsaetze.v1", JSON.stringify(einsaetzeLaden().map((x) => (x.id === id ? s : x))));
    auf(geraetB);
    const vonB = weitergeben(id);
    auf(geraetA);
    const r = einsatzAbgleichen(vonB);
    expect(r.widersprueche).toHaveLength(1);
    expect(r.widersprueche[0]).toMatchObject({ einheit: "Ulm", feld: "Auftrag/Notiz", gilt: "hier" });
    expect(kopf(id, "Ulm").notiz).toBe("Deich Süd");
    expect(abgleichText(r)).toContain("1 Widerspruch zwischen den Geräten: Ulm Auftrag/Notiz — hier Auftrag „Deich Süd“, in der Datei Auftrag „Deich Nord“");
    expect(kopf(id, "Ulm").vermerke?.some((v) => v.text.startsWith("Abgleich mit anderem Gerät"))).toBe(true);
  });

  it("überschreibt ohne Vermerk keinen gesetzten Zug, sondern nennt den Unterschied", () => {
    const id = buehne();
    // Zug ohne Vermerk (wie aus einem Bündel): direkt in die Sammlung geschrieben.
    for (const [g, zug] of [[geraetA, "1. TZ"], [geraetB, "2. TZ"]] as const) {
      auf(g);
      const s = sammlung(id);
      for (const e of s.eintraege) if (e.bogen.einheit.hierarchie[0]!.name === "Biberach") e.zugEtikett = zug;
      g.setItem("eeb.einsaetze.v1", JSON.stringify([s]));
    }
    auf(geraetB);
    const vonB = weitergeben(id);
    auf(geraetA);
    const r = einsatzAbgleichen(vonB);
    expect(kopf(id, "Biberach").zugEtikett).toBe("1. TZ");
    expect(r.widersprueche[0]).toMatchObject({ einheit: "Biberach", feld: "Zug", gilt: "hier" });
  });

  it("übernimmt eine korrigierte Eintreffzeit vom anderen Gerät", () => {
    const id = buehne();
    auf(geraetB);
    eintreffzeitSetzen(id, kopf(id, "Ulm").id, 1_700_000_000_000);
    const vonB = weitergeben(id);
    auf(geraetA);
    const r = einsatzAbgleichen(vonB);
    expect(kopf(id, "Ulm").eingetroffenAm).toBe(1_700_000_000_000);
    expect(r.aktualisiert[0]!.was[0]).toMatch(/^eingetroffen /);
  });
});

describe("Weitergabe-Vermerk nach dem Rückimport (R3-W2)", () => {
  it("zählt Importiertes nicht als „hier neu“, wohl aber eigene Aufnahmen und Änderungen", () => {
    const id = buehne();
    // B nimmt Sinsheim auf und lässt Ulm abrücken, A importiert.
    auf(geraetB);
    meldungAufnehmen(id, bogen("Sinsheim"), { quelle: "scan" });
    statusMitZeitSetzen(id, kopf(id, "Ulm").id, MeldeStatus.ABGERUECKT);
    const vonB = weitergeben(id);
    auf(geraetA);
    const r = einsatzAbgleichen(vonB);
    weitergabeUmImportErgaenzen(id, r.neueIds, r.neueVermerke);
    let stand = weitergabeStandLaden(id)!;
    expect(neueEintraege(sammlung(id).eintraege, stand)).toHaveLength(0);
    expect(aenderungenSeit(sammlung(id).eintraege, stand).anzahl).toBe(0);
    expect(stand.uebernommenAm).toBeTypeOf("number");

    // Jetzt arbeitet A selbst weiter.
    meldungAufnehmen(id, bogen("Bamberg"), { quelle: "scan" });
    const bib = kopf(id, "Biberach");
    zugSetzen(id, bib.einheitSchluessel, bib.id, "1. TZ");
    stand = weitergabeStandLaden(id)!;
    expect(neueEintraege(sammlung(id).eintraege, stand)).toHaveLength(1);
    expect(aenderungenSeit(sammlung(id).eintraege, stand)).toEqual({ anzahl: 1, arten: ["Zug"] });
  });

  it("speichert keinen Auftragstext im Weitergabe-Stand", () => {
    const id = buehne();
    auf(geraetA);
    notizSetzen(id, kopf(id, "Ulm").id, "Geheimer Auftrag");
    weitergabeVermerken(sammlung(id));
    expect(geraetA.getItem("eeb.weitergabe-stand.v1")).not.toContain("Geheimer");
    expect(aenderungenSeit(sammlung(id).eintraege, weitergabeStandLaden(id)!).anzahl).toBe(0);
  });
});

describe("sammlungFuerZiel — Sammlung des Zugführers in die laufende Lage (R3-W3)", () => {
  it("legt die Meldungen mit Zeiten, Status und Siegel in die Zielsammlung und schlägt den Zug vor", () => {
    // ZFü-Telefon: eigene Sammlung „1. TZ Albstadt" mit Albstadt (signiert) und Ulm (abgerückt).
    auf(geraetB);
    const zfue = einsatzAnlegen("1. TZ Albstadt", EinsatzArt.EINSATZ);
    meldungAufnehmen(zfue.id, bogen("Albstadt"), {
      quelle: "scan",
      signatur: { zustand: "gueltig", pubkey: "ab", kurzform: "4402 c713" },
      herkunft: "QUJD",
    });
    meldungAufnehmen(zfue.id, bogen("Ulm"), { quelle: "scan" });
    statusMitZeitSetzen(zfue.id, kopf(zfue.id, "Ulm").id, MeldeStatus.ABGERUECKT, 4000);
    eintreffzeitSetzen(zfue.id, kopf(zfue.id, "Albstadt").id, 1234);
    const datei = weitergeben(zfue.id);

    // MK-Tablet: „Hochwasser Albstadt" mit Biberach.
    auf(geraetA);
    const mk = einsatzAnlegen("Hochwasser Albstadt", EinsatzArt.EINSATZ);
    meldungAufnehmen(mk.id, bogen("Biberach"), { quelle: "scan" });
    const r = einsatzAbgleichen(sammlungFuerZiel(datei, sammlung(mk.id), "1. TZ Albstadt"));
    expect(r.neuerEinsatz).toBe(false);
    expect(r.hinzugefuegt).toBe(2);
    expect(einsaetzeLaden()).toHaveLength(1); // keine zweite Sammlung
    const alb = kopf(mk.id, "Albstadt");
    expect(alb.signatur?.kurzform).toBe("4402 c713");
    expect(alb.herkunft).toBe("QUJD");
    expect(alb.eingetroffenAm).toBe(1234);
    expect(alb.zugEtikett).toBe("1. TZ Albstadt");
    expect(alb.vermerke?.some((v) => v.text.startsWith("Zug: 1. TZ Albstadt"))).toBe(true);
    expect(kopf(mk.id, "Ulm").status).toBe(MeldeStatus.ABGERUECKT);
    expect(kopf(mk.id, "Biberach").zugEtikett).toBeUndefined();
  });

  it("überschreibt den Zug einer schon bekannten Einheit nicht und setzt ohne Vorschlag keinen", () => {
    auf(geraetB);
    const zfue = einsatzAnlegen("1. TZ", EinsatzArt.EINSATZ);
    meldungAufnehmen(zfue.id, bogen("Biberach"), { quelle: "scan" });
    meldungAufnehmen(zfue.id, bogen("Ulm"), { quelle: "scan" });
    const datei = weitergeben(zfue.id);
    auf(geraetA);
    const mk = einsatzAnlegen("Lage", EinsatzArt.EINSATZ);
    meldungAufnehmen(mk.id, bogen("Biberach"), { quelle: "scan" });
    const bib = kopf(mk.id, "Biberach");
    zugSetzen(mk.id, bib.einheitSchluessel, bib.id, "2. TZ");
    const vorbereitet = sammlungFuerZiel(datei, sammlung(mk.id), "1. TZ");
    expect(vorbereitet.eintraege.find((e) => e.bogen.einheit.hierarchie[0]!.name === "Biberach")!.zugEtikett).toBeUndefined();
    einsatzAbgleichen(vorbereitet);
    expect(kopf(mk.id, "Biberach").zugEtikett).toBe("2. TZ");
    expect(kopf(mk.id, "Ulm").zugEtikett).toBe("1. TZ");
    const ohne = sammlungFuerZiel(datei, sammlung(mk.id), "");
    expect(ohne.eintraege.every((e) => !e.zugEtikett)).toBe(true);
  });
});
