/**
 * Wächter für die Scanner-Codes: Die Bilder entstehen aus einem Skript, der
 * Abschnitt in der Anleitung ebenfalls — läuft es nach einer Änderung nicht,
 * zeigt die Seite auf Dateien, die es nicht (mehr) gibt. Beim nächsten Gerät
 * fällt das sonst erst jemandem im Feld auf, der vor einem leeren Rahmen steht.
 */

import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), "..");
const seite = readFileSync(join(WURZEL, "public", "anleitung.html"), "utf8");
const block = seite.match(/<!-- HANDSCANNER:START -->([\s\S]*?)<!-- HANDSCANNER:END -->/)?.[1] ?? "";

describe("Handscanner-Codes in der Anleitung", () => {
  it("hat den erzeugten Abschnitt mit mindestens einem Hersteller", () => {
    expect(block).toMatch(/<h3>/);
  });

  it("zeigt nur auf Bilder, die es gibt", () => {
    const dateien = [...block.matchAll(/src="\.\/(bilder\/handscanner\/[^"]+)"/g)].map((m) => m[1]!);

    expect(dateien.length).toBeGreaterThan(0);
    for (const datei of dateien) expect(existsSync(join(WURZEL, "public", datei)), datei).toBe(true);
  });

  it("nennt in jedem Bild den Befehl, den es trägt", () => {
    for (const m of block.matchAll(/src="\.\/(bilder\/handscanner\/[^"]+)"/g)) {
      const svg = readFileSync(join(WURZEL, "public", m[1]!), "utf8");
      expect(svg, m[1]).toMatch(/Inhalt: \S+/);
    }
  });

  it("beschriftet jeden Code für Screenreader", () => {
    const bilder = [...block.matchAll(/<img[^>]*>/g)].map((m) => m[0]);

    for (const bild of bilder) expect(bild).toMatch(/alt="[^"]{20,}"/);
  });
});
