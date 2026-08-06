import { describe, expect, it } from "vitest";
import { fehlendeTeile, fehlendeTeileText, fehltNochSatz } from "./teil-quittung";
import type { SegmentTeil } from "../codec";

/** Sammelstand mit `anzahl` Teilen, von denen `haben` vorliegen. */
function stand(anzahl: number, haben: number[]): SegmentTeil[] {
  return haben.map((teilNr) => ({ teilNr, anzahl, id: 7, chunk: new Uint8Array() }));
}

describe("fehlendeTeile", () => {
  it("nennt die Lücken aufsteigend, unabhängig von der Scan-Reihenfolge", () => {
    expect(fehlendeTeile(stand(5, [3, 1]))).toEqual([2, 4, 5]);
  });

  it("ist leer, wenn alle Teile vorliegen", () => {
    expect(fehlendeTeile(stand(2, [1, 2]))).toEqual([]);
  });

  it("ist leer bei unsegmentiertem Transport und leerem Stand", () => {
    expect(fehlendeTeile(stand(1, [1]))).toEqual([]);
    expect(fehlendeTeile([])).toEqual([]);
  });
});

describe("fehlendeTeileText", () => {
  it("setzt Einzahl, Zweier-Aufzählung und Reihung mit „und“", () => {
    expect(fehlendeTeileText(stand(5, [1, 2, 3, 5]))).toBe("Teil 4");
    expect(fehlendeTeileText(stand(4, [1, 3]))).toBe("Teile 2 und 4");
    expect(fehlendeTeileText(stand(5, [1]))).toBe("Teile 2, 3, 4 und 5");
  });
});

describe("fehltNochSatz", () => {
  it("beugt das Verb nach der Anzahl der fehlenden Teile", () => {
    expect(fehltNochSatz(stand(5, [1, 2, 3, 5]))).toBe("es fehlt noch Teil 4");
    expect(fehltNochSatz(stand(4, [1, 3]))).toBe("es fehlen noch die Teile 2 und 4");
  });

  it("bleibt leer, wenn nichts fehlt", () => {
    expect(fehltNochSatz(stand(2, [1, 2]))).toBe("");
  });
});
