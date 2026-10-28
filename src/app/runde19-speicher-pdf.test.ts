/**
 * Runde 19, Block Speicher, R19-A2: Die Lücke in den Nummern steht im Lageblatt (und nur dort, wo ein Einsatz etwas entfernt hat).
 */
import { afterEach, describe, expect, it } from "vitest";
import { neuerBogen } from "./hilfen";
import { einsatzLageblattDokument, lueckenZeileSetzen } from "./pdf-dokument";

function texte(node: unknown, acc: string[] = []): string[] {
  if (typeof node === "string") acc.push(node);
  else if (Array.isArray(node)) node.forEach((n) => texte(n, acc));
  else if (node && typeof node === "object") Object.values(node).forEach((v) => texte(v, acc));
  return acc;
}

afterEach(() => lueckenZeileSetzen(""));

describe("R19-A2 Lageblatt nennt die entfernte Nummer", () => {
  it("setzt die Zeile in den Hinweis des Blatts; ohne Entfernen bleibt sie weg", () => {
    const ohne = texte(einsatzLageblattDokument("Lage", [{ bogen: neuerBogen() }]).content).join("\n");
    expect(ohne).not.toContain("nicht in der Summe");
    lueckenZeileSetzen("Nr. 2 entfernt 04:21 (Papierkorb) — nicht in der Summe.");
    const mit = texte(einsatzLageblattDokument("Lage", [{ bogen: neuerBogen() }]).content).join("\n");
    expect(mit).toContain("Nr. 2 entfernt 04:21 (Papierkorb) — nicht in der Summe.");
  });
});
