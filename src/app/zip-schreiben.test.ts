import { describe, expect, it } from "vitest";
import { eindeutigeNamen, zipSchreiben } from "./zip-schreiben";

/** Einträge eines ZIP über das zentrale Verzeichnis lesen (nur „stored"). */
function eintraege(zip: Uint8Array): [string, Uint8Array][] {
  const v = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  const ende = zip.length - 22;
  expect(v.getUint32(ende, true)).toBe(0x06054b50);
  const anzahl = v.getUint16(ende + 10, true);
  let p = v.getUint32(ende + 16, true);
  const aus: [string, Uint8Array][] = [];
  for (let i = 0; i < anzahl; i++) {
    const laenge = v.getUint32(p + 20, true);
    const nl = v.getUint16(p + 28, true);
    const lokal = v.getUint32(p + 42, true);
    const name = new TextDecoder().decode(zip.subarray(p + 46, p + 46 + nl));
    const start = lokal + 30 + v.getUint16(lokal + 26, true);
    aus.push([name, zip.subarray(start, start + laenge)]);
    p += 46 + nl;
  }
  return aus;
}

describe("zipSchreiben", () => {
  it("legt Binärdaten unverändert ab", () => {
    const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0, 255, 128]);
    const z = zipSchreiben([["a.pdf", pdf], ["Größe.txt", "ä"]]);
    const e = eintraege(z);
    expect(e.map(([n]) => n)).toEqual(["a.pdf", "Größe.txt"]);
    expect([...e[0]![1]]).toEqual([...pdf]);
    expect(new TextDecoder().decode(e[1]![1])).toBe("ä");
  });
});

describe("eindeutigeNamen", () => {
  it("hängt an doppelte Namen eine Zahl an, ohne Rücksicht auf Groß- und Kleinschreibung", () => {
    expect(eindeutigeNamen(["a.pdf", "b.pdf", "a.pdf", "A.pdf", "a-2.pdf"])).toEqual(["a.pdf", "b.pdf", "a-2.pdf", "A-3.pdf", "a-2-2.pdf"]);
  });
});
