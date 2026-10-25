/**
 * Wächter: Der ausgelieferte Blanko-Vordruck muss genau das sein, was der
 * Generator heute erzeugt. Nach R2-A6 stand die Stärke-Legende nur im
 * Generator; die Datei unter public/downloads/ war vom August und wurde ohne
 * Legende ausgeliefert (Audit Runde 3, R3-A4).
 *
 * Schlägt dieser Test an: `npm run blanko-pdf` aufrufen und die neue Datei
 * mit committen.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { BLANKO_DATEI, blankoVordruck, erstelldatumAusPdf } from "./blanko-vordruck";
import { seitenZahl } from "./pdf-in-node";

const wurzel = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("Blanko-Vordruck (R3-A4)", () => {
  const ausgeliefert = readFileSync(join(wurzel, BLANKO_DATEI));

  it("ist deterministisch: gleiches Datum, gleiche Bytes", async () => {
    const d = new Date(Date.UTC(2026, 9, 5, 8, 0, 0));
    const a = await blankoVordruck(d);
    const b = await blankoVordruck(d);
    expect(a.equals(b)).toBe(true);
    expect(erstelldatumAusPdf(a)?.getTime()).toBe(d.getTime());
  });

  it("die ausgelieferte Datei passt zum Generator — sonst `npm run blanko-pdf`", async () => {
    const datum = erstelldatumAusPdf(ausgeliefert);
    expect(datum, "Erstelldatum in der ausgelieferten Datei").not.toBeNull();
    const neu = await blankoVordruck(datum!);
    expect(
      neu.equals(ausgeliefert),
      `${BLANKO_DATEI} ist älter als der Generator — \`npm run blanko-pdf\` aufrufen und die Datei committen.`,
    ).toBe(true);
  }, 20_000);

  it("bleibt bei zwei Seiten", () => {
    expect(seitenZahl(ausgeliefert)).toBe(2);
  });
});
