/**
 * Hält die drei Fassungen der Kopfnavigation zusammen.
 *
 * Die Leiste existiert dreimal: in den statischen Seiten unter `public/`
 * (scripts/content-nav.mts), im Start-Gerüst von index.html — das ist, was das
 * Auge zuerst sieht und was ein Crawler ohne JavaScript bekommt — und in der
 * React-Ansicht, die das Gerüst beim Mount ersetzt. Weicht das Gerüst von der
 * Quelle ab, springt die Seite beim Mount.
 *
 * Der Block wird deshalb erzeugt, nicht getippt; dieser Test prüft, dass die
 * erzeugte Fassung noch drinsteht. Zum Nachziehen:
 *   node --import tsx scripts/kopfnav.mts && npm run content-nav
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ANLEITUNG_AUFGABEN, MARKE_ANFANG, MARKE_ENDE, NAV, kopfnavHtml } from "../app/kopfnav";

const WURZEL = join(import.meta.dirname, "..", "..");
const INDEX = readFileSync(join(WURZEL, "index.html"), "utf8");
const ANLEITUNG = readFileSync(join(WURZEL, "public", "anleitung.html"), "utf8");

describe("Kopfnavigation", () => {
  it("steht im statischen Gerüst genau so wie in der Quelle", () => {
    const anfang = INDEX.indexOf(MARKE_ANFANG);
    const ende = INDEX.indexOf(MARKE_ENDE);
    expect(anfang, "Anfangsmarke fehlt in index.html").toBeGreaterThan(-1);
    expect(ende, "Endmarke fehlt in index.html").toBeGreaterThan(anfang);
    const block = INDEX.slice(anfang + MARKE_ANFANG.length, ende).trim();
    expect(block, "index.html ist veraltet: node --import tsx scripts/kopfnav.mts").toBe(
      kopfnavHtml("", "    ", "div").trim(),
    );
  });

  it("steht hinter der Sprungmarke, nicht davor", () => {
    // Sonst führt der Weg zum Formular durch acht Navigationslinks — an genau
    // dem Element vorbei, das ihn abkürzen soll (WCAG 2.4.1).
    expect(INDEX.indexOf('class="sprungmarke"')).toBeLessThan(INDEX.indexOf(MARKE_ANFANG));
  });

  it("verweist nur auf Seiten, die es gibt", () => {
    const ziele = new Set<string>();
    for (const eintrag of NAV) {
      ziele.add(eintrag.href);
      for (const u of eintrag.unter ?? []) ziele.add(u.href);
    }
    const fehlend = [...ziele]
      .map((z) => z.replace(/^\.\//, "").replace(/[#?].*$/, ""))
      .filter((datei) => datei !== "" && !existsSync(join(WURZEL, "public", datei)));
    expect(fehlend).toEqual([]);
  });

  it("führt zu Aufgaben, die in der Anleitung auch wirklich stehen", () => {
    // Ein Menüpunkt auf eine Sprungmarke, die es nicht gibt, ist im Browser
    // still kaputt: Die Seite öffnet oben, und niemand merkt den Fehler.
    for (const aufgabe of ANLEITUNG_AUFGABEN) {
      const kennung = aufgabe.href.split("#")[1];
      expect(kennung, aufgabe.label).toBeTruthy();
      expect(ANLEITUNG, `${aufgabe.label}: id="${kennung}" fehlt in anleitung.html`).toContain(
        `id="${kennung}"`,
      );
    }
  });
});
