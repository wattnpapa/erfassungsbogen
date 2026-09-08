import { describe, it, expect, beforeEach } from "vitest";
import {
  encodePayload,
  encodePayloadUrl,
  encodeVorlagePayloadUrl,
  segmentPayloadUrls,
} from "@bos/eeb-format/codec";
import { OrganisationsTyp, PersonalErfassung, SCHEMA_VERSION, type Erfassungsbogen } from "@bos/eeb-format/model";
import { browserKompressor } from "./hilfen";
import { boegenAusQrTexten } from "./qr-boegen";

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
  (globalThis as { localStorage?: Storage }).localStorage = new MemStorage() as unknown as Storage;
});

function bogen(name: string): Erfassungsbogen {
  return {
    schemaVersion: SCHEMA_VERSION,
    stand: 100,
    einheit: {
      organisation: OrganisationsTyp.THW,
      einheitsTyp: { code: 1 },
      hierarchie: [{ bezeichnung: { code: 1 }, name }],
    },
    einsatz: { zeitraumVon: 100, zeitraumBis: 130, ortAuftrag: "Lage" },
    personalErfassung: PersonalErfassung.VOLLSTAENDIG,
    personal: [],
    fahrzeuge: [],
    sofortbedarf: {
      verpflegungPersonen: 0,
      dieselLiter: 0,
      benzinLiter: 0,
      gemischLiter: 0,
      unterbringung: false,
      ruhezeitErforderlich: false,
    },
  };
}

const name = (b: Erfassungsbogen) => b.einheit.hierarchie[0]!.name;

describe("boegenAusQrTexten()", () => {
  it("liest einzelne Bogen-Codes in ihrer Reihenfolge", async () => {
    const texte = ["OV Eins", "OV Zwei"].map((n) => encodePayloadUrl(bogen(n), browserKompressor));
    const gefunden = await boegenAusQrTexten(texte);
    expect(gefunden.map((g) => name(g.bogen))).toEqual(["OV Eins", "OV Zwei"]);
  });

  it("setzt mehrteilige Codes zusammen — auch in beliebiger Reihenfolge", async () => {
    const teile = segmentPayloadUrls(encodePayload(bogen("OV Dreiteilig"), browserKompressor), 3);
    const gefunden = await boegenAusQrTexten([teile[2]!, teile[0]!, teile[1]!]);
    expect(gefunden.map((g) => name(g.bogen))).toEqual(["OV Dreiteilig"]);
  });

  it("hält die Teile mehrerer Bögen auseinander, auch wenn sie verschränkt stehen", async () => {
    const a = segmentPayloadUrls(encodePayload(bogen("OV Alpha"), browserKompressor), 2);
    const b = segmentPayloadUrls(encodePayload(bogen("OV Bravo"), browserKompressor), 2);
    const gefunden = await boegenAusQrTexten([a[0]!, b[0]!, a[1]!, b[1]!]);
    expect(gefunden.map((g) => name(g.bogen)).sort()).toEqual(["OV Alpha", "OV Bravo"]);
  });

  it("übergeht unvollständige Teilesätze, statt einen halben Bogen zu liefern", async () => {
    const teile = segmentPayloadUrls(encodePayload(bogen("OV Halb"), browserKompressor), 3);
    expect(await boegenAusQrTexten([teile[0]!, teile[1]!])).toEqual([]);
  });

  it("übergeht Vorlagen und fremde Codes", async () => {
    const texte = [
      encodeVorlagePayloadUrl(bogen("OV Vorlage"), browserKompressor),
      "https://example.org/irgendwas",
      "",
      encodePayloadUrl(bogen("OV Echt"), browserKompressor),
    ];
    const gefunden = await boegenAusQrTexten(texte);
    expect(gefunden.map((g) => name(g.bogen))).toEqual(["OV Echt"]);
  });

  it("reicht den rohen Payload mit — nur er trägt die Original-Signatur weiter", async () => {
    const [gefunden] = await boegenAusQrTexten([encodePayloadUrl(bogen("OV Herkunft"), browserKompressor)]);
    expect(gefunden!.herkunft).toBeInstanceOf(Uint8Array);
    expect(gefunden!.signatur.zustand).toBe("unsigniert"); // hier unsigniert erzeugt
  });
});
