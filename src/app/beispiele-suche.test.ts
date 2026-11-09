import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { suchNorm, treffer, woerterVon } from "./beispiele-suche";

describe("Suche der Beispielbögen (Prüfrunde Beispielbögen, Runde 2)", () => {
  it("vereinheitlicht Umlaute und Satzzeichen", () => {
    expect(suchNorm("Fachgruppe Wassergefahren (A) – Köln")).toBe("fachgruppe wassergefahren a koeln");
  });

  it("trifft Wortanfänge, aber nicht Wortmitten (BB2-W5: „aibling“ ≠ „Waiblingen“)", () => {
    expect(treffer(["bergung"], woerterVon("Bergungsgruppe B Oldenburg"))).toBe(1);
    expect(treffer(["oldenburg", "bergungsgruppe"], woerterVon("Bergungsgruppe B Oldenburg"))).toBe(4);
    expect(treffer(["aibling"], woerterVon("DRK Waiblingen"))).toBe(-1);
    expect(treffer(["oldenburg", "zugtrupp"], woerterVon("Bergungsgruppe Oldenburg"))).toBe(-1);
  });
});

describe("Suchindex beispiele-suchindex.json (BB2-S2, BB2-K2)", () => {
  const wurzel = fileURLToPath(new URL("../../examples/", import.meta.url));
  const index = JSON.parse(readFileSync(new URL("./beispiele-suchindex.json", import.meta.url), "utf8")) as {
    typen: Record<string, string>;
    ov: Record<string, number>;
    boegen: Record<string, string>;
  };
  const dateien = (dir: string): string[] =>
    readdirSync(dir).flatMap((n) => {
      const p = join(dir, n);
      return statSync(p).isDirectory() ? dateien(p) : n.endsWith(".json") ? [p] : [];
    });

  it("hat für jede Beispiel-Datei einen Eintrag (sonst: npm run beispiele:suchindex)", () => {
    const fehlen = dateien(wurzel)
      .map((d) => relative(wurzel, d).split(sep).join("/").replace(/\.json$/, ""))
      .filter((k) => !(k in index.boegen) && !(k.slice(k.lastIndexOf("/") + 1) in index.ov));
    expect(fehlen).toEqual([]);
  });

  it("führt die Bergungsgruppe des OV Oldenburg als „Bergungsgruppe“", () => {
    const code = index.ov["ov-oldenburg-ni-05-1-tz-b"];
    expect(code).toBeDefined();
    expect(index.typen[String(code)]).toMatch(/^Bergungsgruppe \| B$/);
  });
});
