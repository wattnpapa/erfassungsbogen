/**
 * Der Fall aus dem Feld: Ein Datalogic-Handscanner steht werkseitig auf
 * „Ländermodus = USA“ und tippt auf einem deutschen Rechner „httpsÖ--…app-§…“
 * statt „https://…app/#…“. Der Scan ist dabei fehlerfrei — nur die Zuordnung
 * Taste→Zeichen ist eine andere.
 */

import { describe, it, expect } from "vitest";
import { usBelegungZurueck, entwirreScanText } from "./tastaturbelegung";
import { encodePayload, encodePayloadUrl, segmentPayloadUrls } from "../codec";
import { browserKompressor, neuerBogen } from "./hilfen";

/** Was ein auf US-Belegung stehender Scanner auf deutscher Tastatur hinterlässt. */
function wieUsScanner(text: string): string {
  const us: Record<string, string> = {
    ":": "Ö", "/": "-", "#": "§", "-": "ß", "*": "(", y: "z", z: "y", Y: "Z", Z: "Y",
  };
  return [...text].map((z) => us[z] ?? z).join("");
}

describe("Tastaturbelegung eines Handscanners", () => {
  it("rechnet den verdrehten Link zurück", () => {
    expect(usBelegungZurueck("httpsÖ--erfassungsbogen.app-§B.LMAD3A")).toBe("https://erfassungsbogen.app/#B.LMAD3A");
  });

  it("lässt einen bereits lesbaren Text unberührt", () => {
    const url = encodePayloadUrl(neuerBogen(), browserKompressor);

    expect(entwirreScanText(url, () => true)).toBe(url);
  });

  it("macht einen verdrehten Bogen-QR wieder lesbar", () => {
    const url = encodePayloadUrl(neuerBogen(), browserKompressor);
    const verdreht = wieUsScanner(url);

    expect(verdreht).not.toBe(url);
    expect(entwirreScanText(verdreht, (t) => t === url)).toBe(url);
  });

  it("macht auch einen verdrehten Segment-Teil wieder lesbar", () => {
    const teile = segmentPayloadUrls(encodePayload(neuerBogen(), browserKompressor), 2);

    expect(entwirreScanText(wieUsScanner(teile[0]!), (t) => t === teile[0])).toBe(teile[0]);
  });

  it("gibt unverständlichen Text unverändert zurück — die Meldung soll zeigen, was ankam", () => {
    expect(entwirreScanText("WIFIÖS=Gast;;", () => false)).toBe("WIFIÖS=Gast;;");
  });
});
