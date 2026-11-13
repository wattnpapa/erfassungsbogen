/**
 * Papier-Befunde der Runde 5 (R5-A2, A3, A6, A7, A8, A9): Kopfzeile jeder
 * Bogenseite mit Nr., Einheit und Platz zum Quittieren; Fahrzeugblöcke ohne
 * Seitenumbruch; Beiblatt-Hinweis und Luft im Blanko; Lageblatt nach Nr.
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("./nativ", () => ({ istNativ: () => false, textTeilen: async () => {}, binaerTeilen: async () => {} }));

import type { TDocumentDefinitions } from "pdfmake/interfaces";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Erfassungsbogen } from "@bos/eeb-format/model";
import type { QrSatz } from "./hilfen";
import { BLANKO_ZEILEN, leererBogen } from "./blanko";
import { einzelPdfDokument, pdfDokument } from "./pdf-dokument";
import { pdfBytes, seitenZahl } from "../../scripts/pdf-in-node";

const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
const qr = (n: number): QrSatz => ({
  teile: Array.from({ length: n }, (_, i) => ({ datenUrl: PNG, url: `https://x/#${i}`, teilNr: i + 1, anzahl: n, version: 13 })),
  segmentiert: n > 1,
  zeichen: 900,
  version: 13,
  vollUrl: "https://x/#V",
  stufen: 1,
  weitergeleitet: false,
});
// Der Großbogen ist ein Prüfling (überlanger Bogen mit segmentiertem QR), kein Beispielbogen der App.
const GROSSBOGEN = "./grossbogen-verstaerkter-bergungszug.json";
const LOG_MW = "../../../examples/thw/ortsverbaende/lv-baden-wuerttemberg/rst-biberach/ov-biberach-riss/ov-biberach-riss-02-fz-log-fgr-log-mw.json";
const beispiel = (datei: string): Erfassungsbogen =>
  JSON.parse(readFileSync(new URL(datei, new URL("./testdaten/", import.meta.url)), "utf8")) as Erfassungsbogen;

const hatPdftotext = (() => {
  try {
    execFileSync("pdftotext", ["-v"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
})();

async function seitenTexte(dd: TDocumentDefinitions): Promise<string[]> {
  const dir = mkdtempSync(join(tmpdir(), "papier-"));
  try {
    const datei = join(dir, "x.pdf");
    writeFileSync(datei, await pdfBytes(dd));
    const n = seitenZahl(readFileSync(datei));
    return Array.from({ length: n }, (_, s) => execFileSync("pdftotext", ["-f", String(s + 1), "-l", String(s + 1), "-layout", datei, "-"], { encoding: "utf8" }));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("Einzel-PDF: Kopfzeile jeder Seite (R5-A2, R5-A3)", () => {
  it.skipIf(!hatPdftotext)("Seite 1 trägt den Platz „übertragen“, jede Folgeseite Nr. und Einheit", async () => {
    const dd = await einzelPdfDokument(beispiel(GROSSBOGEN), qr(1), pdfBytes);
    const seiten = await seitenTexte(dd);
    expect(seiten.length).toBeGreaterThan(2);
    expect(seiten[0]).toMatch(/Meldekopf:\s+Nr\. _+/);
    // Das Kästchen ist gezeichnet (pdf-kaestchen.ts), im Text steht nur noch „übertragen von“.
    expect(seiten[0]).toMatch(/übertragen +von/);
    seiten.slice(1).forEach((t, i) => {
      expect(t).toContain("Verstärkter Bergungszug");
      expect(t).toContain(`Blatt ${i + 2} von ${seiten.length} dieses Bogens`);
    });
  }, 60_000);

  it("kein Fahrzeugblock liegt auf zwei Seiten", async () => {
    for (const datei of [GROSSBOGEN, LOG_MW]) {
      const dd = pdfDokument(beispiel(datei), qr(1));
      const gerissen: number[][] = [];
      dd.pageBreakBefore = (k) => {
        const n = k as { table?: { widths?: unknown[] }; pageNumbers?: number[] };
        if (n.table?.widths?.[0] === 56 && (n.pageNumbers?.length ?? 1) > 1) gerissen.push(n.pageNumbers!);
        return false;
      };
      await pdfBytes(dd);
      expect(gerissen, datei).toEqual([]);
    }
  }, 30_000);
});

describe("Blanko: Beiblatt, Luft, Platz für „Sonstiges“ (R5-A6, R5-A7)", () => {
  it("bleibt bei zwei Seiten, nennt Beiblatt und Blattzahl, trägt Kopfzeile mit Einheit auf Seite 2", async () => {
    const dd = pdfDokument(leererBogen(), null, BLANKO_ZEILEN);
    const roh = JSON.stringify(dd.content);
    expect(roh).toContain("Blatt ____ von ____");
    expect(roh).toContain("Beiblatt");
    expect(seitenZahl(await pdfBytes(dd))).toBe(2);
    const kopf2 = JSON.stringify((dd.header as (s: number) => unknown)(2));
    expect(kopf2).toContain("Einheit: ____");
    expect(JSON.stringify((dd.header as (s: number) => unknown)(1))).not.toContain("Einheit");
  }, 20_000);

  it("Sofortbedarf mit Abstand zwischen den Zeilen, „Sonstiges“ mit drei Schreibzeilen", () => {
    const roh = JSON.stringify(pdfDokument(leererBogen(), null, BLANKO_ZEILEN).content);
    expect(roh).toContain('"margin":[0,3,0,3]');
    const i = roh.indexOf('"Sonstiges:"');
    expect(i).toBeGreaterThan(-1);
    expect((roh.slice(i).match(/"text":" ","margin":\[0,2,0,2\]/g) ?? []).length).toBe(3);
  });
});
