import { describe, expect, it } from "vitest";
import type { TDocumentDefinitions } from "pdfmake/interfaces";
import { kaestchenZeichnen } from "./pdf-kaestchen";
import { pdfBytes } from "../../scripts/pdf-in-node";

const dd = (content: unknown): TDocumentDefinitions =>
  ({ content, defaultStyle: { fontSize: 10, font: "Helvetica" } }) as TDocumentDefinitions;
const json = (x: unknown) => JSON.stringify(x);

describe("Gezeichnete Kästchen (wie in der THWin-Vorlage)", () => {
  it("ersetzt „[X]“ und „[  ]“ durch Quadrate, angekreuzt mit zwei Linien", () => {
    const aus = kaestchenZeichnen(dd([{ text: "Ausstattung nach StAN: ja [X] / nein [  ]", bold: true }]));
    const t = json(aus.content);
    expect(t).not.toMatch(/\[(X| +)\]/);
    expect(t.match(/"type":"rect"/g)).toHaveLength(2);
    expect(t.match(/"type":"line"/g)).toHaveLength(2);
    expect(t).toContain('"bold":true');
    expect(t).toContain("Ausstattung nach StAN: ja");
  });

  it("lässt Zeilen ohne Kästchen und das Original unverändert", () => {
    const original = dd([{ text: "[X] Verpflegung\nÄnderungen bzw. Sondergerät: Kran" }, { text: "ohne" }]);
    const vorher = json(original);
    const aus = kaestchenZeichnen(original);
    expect(json(original)).toBe(vorher);
    expect(json(aus.content)).toContain('"text":[{"text":"Änderungen bzw. Sondergerät: Kran"}]');
    expect((aus.content as unknown[])[1]).toBe((original.content as unknown[])[1]);
  });

  it("findet Kästchen in Tabellen, Stapeln und Kopfzeilen, behält id und colSpan", () => {
    const aus = kaestchenZeichnen({
      ...dd([{ table: { body: [[{ text: "[  ] von Hand geändert", colSpan: 2, id: "k" }, {}]] } }]),
      header: () => ({ stack: [{ text: "übertragen [  ] von ____" }] }),
    } as TDocumentDefinitions);
    const t = json(aus.content);
    expect(t).toContain('"colSpan":2');
    expect(t).toContain('"id":"k"');
    expect(t).toContain('"type":"rect"');
    expect(json((aus.header as () => unknown)())).toContain('"type":"rect"');
  });

  it("lässt sich setzen", async () => {
    const pdf = await pdfBytes(dd([{ text: "[X] Betriebsstoff: 70 l Diesel / [  ] Benzin", lineHeight: 1.2 }]));
    expect(pdf.length).toBeGreaterThan(500);
  });
});
