import { describe, it, expect } from "vitest";
import { deflateRawSync, inflateRawSync } from "node:zlib";
import {
  EEB_URL_PREFIX,
  EEB_VORLAGE_MARKER,
  decodePayloadUrl,
  decodeVorlagePayloadUrl,
  encodePayloadUrl,
  encodeVorlagePayloadUrl,
  istVorlageNutzlast,
  type Kompressor,
} from "./codec";
import {
  OrganisationsTyp,
  PersonalErfassung,
  SCHEMA_VERSION,
  StaerkeRolle,
  Fahrerlaubnis,
  Geschlecht,
  Ernaehrung,
  type Erfassungsbogen,
} from "./model";

const k: Kompressor = {
  deflateRaw: (d) => new Uint8Array(deflateRawSync(d)),
  inflateRaw: (d) => new Uint8Array(inflateRawSync(d)),
};

function bogen(): Erfassungsbogen {
  return {
    schemaVersion: SCHEMA_VERSION,
    stand: 200,
    einheit: {
      organisation: OrganisationsTyp.THW,
      einheitsTyp: { code: 1 },
      name: "OV Oldenburg – FGr N",
      hierarchie: [],
    },
    einsatz: { zeitraumVon: 200, zeitraumBis: 200, ortAuftrag: "" },
    personalErfassung: PersonalErfassung.VOLLSTAENDIG,
    personal: [
      {
        vorname: "Kai",
        nachname: "Berger",
        staerkeRolle: StaerkeRolle.UNTERFUEHRER,
        funktionen: [],
        fahrerlaubnis: Fahrerlaubnis.CE,
        geschlecht: Geschlecht.M,
        ernaehrung: Ernaehrung.FLEISCH,
        kontakte: [],
        zusatzqualifikationen: [],
      },
    ],
    fahrzeuge: [{ typ: { code: 2 }, thwKennzeichen: 84397 }],
  };
}

describe("Vorlagen-QR (Marker „V.“)", () => {
  it("kodiert mit Marker und dekodiert wieder zum selben Bogen", () => {
    const url = encodeVorlagePayloadUrl(bogen(), k);
    expect(url.startsWith(EEB_URL_PREFIX + EEB_VORLAGE_MARKER)).toBe(true);
    expect(decodeVorlagePayloadUrl(url, k)).toEqual(bogen());
  });

  it("erkennt Vorlagen- vs. Einsatzbogen-Nutzlast", () => {
    expect(istVorlageNutzlast(encodeVorlagePayloadUrl(bogen(), k))).toBe(true);
    expect(istVorlageNutzlast(encodePayloadUrl(bogen(), k))).toBe(false);
  });

  it("akzeptiert auch das nackte Fragment ohne URL-Präfix", () => {
    const url = encodeVorlagePayloadUrl(bogen(), k);
    const fragment = url.slice(EEB_URL_PREFIX.length); // "V.<payload>"
    expect(istVorlageNutzlast(fragment)).toBe(true);
    expect(decodeVorlagePayloadUrl(fragment, k)).toEqual(bogen());
  });

  it("liest ein Einsatzbogen-QR NICHT als Vorlage fehl (Marker fehlt)", () => {
    const einsatzUrl = encodePayloadUrl(bogen(), k);
    expect(istVorlageNutzlast(einsatzUrl)).toBe(false);
    // Umgekehrt: das Marker-Fragment ist kein gültiger Einsatzbogen ('.' ist
    // kein Base64url-Zeichen) → decodePayloadUrl wirft.
    expect(() => decodePayloadUrl(encodeVorlagePayloadUrl(bogen(), k), k)).toThrow();
  });
});
