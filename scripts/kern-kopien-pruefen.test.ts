/**
 * Die Diamant-Prüfung ist ein Wächter — sie ist nur so viel wert, wie sie
 * tatsächlich anschlägt. Geprüft wird deshalb an gebauten Beispielbäumen,
 * nicht am echten Repo: dort wäre der Fehlerfall ja gerade nicht herstellbar.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pruefen } from "./kern-kopien-pruefen";

let wurzel: string;

function paket(pfad: string, inhalt: Record<string, unknown>): void {
  const voll = join(wurzel, pfad);
  mkdirSync(voll, { recursive: true });
  writeFileSync(join(voll, "package.json"), JSON.stringify(inhalt));
}

beforeEach(() => {
  wurzel = mkdtempSync(join(tmpdir(), "kern-kopien-"));
});

afterEach(() => {
  rmSync(wurzel, { recursive: true, force: true });
});

describe("pruefen()", () => {
  it("ist zufrieden, wenn jeder Baustein genau einmal vorkommt", () => {
    paket(".", { name: "erfassungsbogen", dependencies: { "@bos/eeb-format": "file:vendor/eeb-format" } });
    paket("vendor/eeb-format", { name: "@bos/eeb-format" });
    paket("vendor/meldekopf", { name: "@bos/meldekopf", peerDependencies: { "@bos/eeb-format": "*" } });
    expect(pruefen(wurzel)).toEqual([]);
  });

  it("schlägt an, wenn ein Baustein einen anderen als dependency führt", () => {
    paket("vendor/meldekopf", { name: "@bos/meldekopf", dependencies: { "@bos/eeb-format": "^1" } });
    const klagen = pruefen(wurzel);
    expect(klagen).toHaveLength(1);
    expect(klagen[0]).toContain("@bos/meldekopf führt @bos/eeb-format als dependency");
  });

  it("schlägt an, wenn ein Baustein zweimal im Baum liegt", () => {
    paket("vendor/eeb-format", { name: "@bos/eeb-format" });
    paket("vendor/meldekopf/node_modules/@bos/eeb-format", { name: "@bos/eeb-format" });
    const klagen = pruefen(wurzel);
    expect(klagen).toHaveLength(1);
    expect(klagen[0]).toContain("liegt 2-mal im Baum");
  });

  it("zählt einen Symlink nicht als zweite Kopie", () => {
    // Genau so sieht die `file:`-Abhängigkeit nach `npm install` aus: unter
    // node_modules/@bos/ steht ein Verweis auf vendor/, kein zweiter Ordner.
    paket("vendor/eeb-format", { name: "@bos/eeb-format" });
    mkdirSync(join(wurzel, "node_modules"), { recursive: true });
    symlinkSync(join(wurzel, "vendor"), join(wurzel, "node_modules", "@bos"));
    expect(pruefen(wurzel)).toEqual([]);
  });

  it("übergeht Pakete, die keine Kern-Bausteine sind", () => {
    paket("vendor/fremd", { name: "irgendwas", dependencies: { react: "^19" } });
    expect(pruefen(wurzel)).toEqual([]);
  });
});
