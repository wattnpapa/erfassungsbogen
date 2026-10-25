/**
 * Papier-Befunde der Runde 5 (R5-A2, A3, A6, A7, A8, A9): Kopfzeile jeder
 * Bogenseite mit Nr., Einheit und Platz zum Quittieren; Fahrzeugblöcke ohne
 * Seitenumbruch; Beiblatt-Hinweis und Luft im Blanko; Lageblatt nach Nr.
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("./nativ", () => ({ istNativ: () => false, textTeilen: async () => {}, binaerTeilen: async () => {} }));

import type { TDocumentDefinitions } from "pdfmake/interfaces";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Erfassungsbogen } from "@bos/eeb-format/model";
import type { QrSatz } from "./hilfen";
import { BLANKO_ZEILEN, leererBogen } from "./blanko";
import {
  einsatzLageblattDokument,
  einsatzPdfDokumentGesetzt,
  einzelPdfDokument,
  nachNummer,
  pdfDokument,
  type SammelBogen,
} from "./pdf-dokument";
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
const beispiel = (datei: string): Erfassungsbogen =>
  JSON.parse(readFileSync(new URL(`../../examples/thw/${datei}`, import.meta.url), "utf8")) as Erfassungsbogen;

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
    const dd = await einzelPdfDokument(beispiel("grossbogen-verstaerkter-bergungszug.json"), qr(1), pdfBytes);
    const seiten = await seitenTexte(dd);
    expect(seiten.length).toBeGreaterThan(2);
    expect(seiten[0]).toMatch(/Meldekopf:\s+Nr\. _+/);
    expect(seiten[0]).toMatch(/übertragen \[ +\] von/);
    seiten.slice(1).forEach((t, i) => {
      expect(t).toContain("Verstärkter Bergungszug");
      expect(t).toContain(`Blatt ${i + 2} von ${seiten.length} dieses Bogens`);
    });
  }, 60_000);

  it("kein Fahrzeugblock liegt auf zwei Seiten", async () => {
    for (const datei of ["grossbogen-verstaerkter-bergungszug.json", "015-ansbach-fgr-log-mw.json"]) {
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

describe("Sammel-PDF: Kopfzeile je Bogenseite, Bedarf nicht allein (R5-A2, R5-A3, R5-A8)", () => {
  function lage(n: number): SammelBogen[] {
    const dir = new URL("../../examples/thw/", import.meta.url);
    return readdirSync(dir)
      .sort()
      .slice(0, n)
      .map((d, i) => ({
        bogen: JSON.parse(readFileSync(new URL(d, dir), "utf8")) as Erfassungsbogen,
        qr: qr(1 + (i % 3)),
        eingetroffenAm: Date.UTC(2026, 9, 4, 18, 24),
        zugEtikett: `${1 + (i % 3)}. Zug`,
        nummer: n - i,
      }));
  }

  it.skipIf(!hatPdftotext)("jede Bogenseite nennt Nr. und Einheit, Blatt 1 den Haken „übertragen“", async () => {
    const dd = await einsatzPdfDokumentGesetzt("Lage", lage(6), undefined, Date.UTC(2026, 9, 4, 19, 0), undefined, pdfBytes);
    const seiten = await seitenTexte(dd);
    const erste = seiten.findIndex((t) => /Blatt \d+ von \d+/.test(t));
    expect(erste).toBeGreaterThan(0); // davor nur die Übersicht (quer)
    const bogenSeiten = seiten.slice(erste);
    for (const t of bogenSeiten) expect(t).toMatch(/Nr\. \d+ +· .*Blatt \d+ von \d+/);
    expect(bogenSeiten.filter((t) => /Blatt 1 von \d+/.test(t) && /übertragen \[ +\]/.test(t)).length).toBe(6);
    // Nach Nr. geordnet: Nr. 1 steht vor Nr. 6.
    const seite = (nr: number) => seiten.findIndex((t) => new RegExp(`Nr\\. ${nr} +· .*Blatt 1 von`).test(t));
    expect(seite(1)).toBeGreaterThan(0);
    expect(seite(1)).toBeLessThan(seite(6));
  }, 60_000);

  it.skipIf(!hatPdftotext)("30 Einheiten: „Bedarf gesamt“ steht nicht allein auf einer Seite, keine Seite unter 12 Zeilen", async () => {
    const dd = await einsatzPdfDokumentGesetzt("Grosslage", lage(30), undefined, Date.UTC(2026, 9, 4, 19, 0), undefined, pdfBytes);
    const seiten = await seitenTexte(dd);
    const zeilen = seiten.map((t) => t.split("\n").filter((z) => z.trim()).length);
    expect(Math.min(...zeilen), `Zeilen je Seite: ${zeilen.join(" ")}`).toBeGreaterThanOrEqual(12);
    const bedarf = seiten.findIndex((t) => t.includes("Bedarf gesamt (30 Einheiten"));
    expect(bedarf).toBe(0);
  }, 120_000);
});

describe("Lageblatt nach Nr. (R5-A9)", () => {
  it("ordnet nach Nr., Einträge ohne Nr. zuletzt", () => {
    expect(nachNummer([{ nummer: 15 }, { nummer: 2 }, {}, { nummer: 1 }])).toEqual([{ nummer: 1 }, { nummer: 2 }, { nummer: 15 }, {}]);
  });

  it("das Blatt führt Nr. 2 vor Nr. 15, auch wenn der Name alphabetisch später steht", () => {
    const a = beispiel("001-albstadt-ztr-tz.json");
    const b = beispiel("015-ansbach-fgr-log-mw.json");
    const text = JSON.stringify(einsatzLageblattDokument("L", [{ bogen: a, nummer: 15 }, { bogen: b, nummer: 2 }]).content);
    expect(text.indexOf("Nr. 2 ")).toBeGreaterThan(-1);
    expect(text.indexOf("Nr. 2 ")).toBeLessThan(text.indexOf("Nr. 15 "));
  });
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
    expect((roh.slice(i).match(/"text":" ","margin":\[0,5,0,5\]/g) ?? []).length).toBe(3);
  });
});
