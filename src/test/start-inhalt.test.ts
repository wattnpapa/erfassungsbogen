/**
 * Hält die beiden Pfade der Startseite zusammen.
 *
 * Der erklärende Text steht einmal als Daten (src/app/start-inhalt.ts) und
 * erscheint an zwei Stellen: im statischen Gerüst von index.html (das ist,
 * was ein Crawler ohne JavaScript-Ausführung und was das Auge zuerst sieht)
 * und in der React-Ansicht, die das Gerüst beim Mount ersetzt. Weicht der
 * Block in index.html von der Quelle ab, ändert sich der sichtbare Text beim
 * Mount — schlecht fürs Auge (Sprung) wie für die Auffindbarkeit.
 *
 * Der Block wird deshalb erzeugt, nicht getippt; dieser Test prüft, dass die
 * erzeugte Fassung noch drinsteht. Zum Nachziehen:
 *   node --import tsx scripts/start-inhalt.mts
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  MARKE_ANFANG,
  MARKE_ENDE,
  MARKE_FAQ_ANFANG,
  MARKE_FAQ_ENDE,
  START_ABSCHNITTE,
  faqJsonLd,
  startInhaltHtml,
} from "../app/start-inhalt";

const INDEX = readFileSync(join(import.meta.dirname, "..", "..", "index.html"), "utf8");

describe("Startseiten-Text", () => {
  it("steht im statischen Gerüst genau so wie in der Quelle", () => {
    const anfang = INDEX.indexOf(MARKE_ANFANG);
    const ende = INDEX.indexOf(MARKE_ENDE);
    expect(anfang, "Anfangsmarke fehlt in index.html").toBeGreaterThan(-1);
    expect(ende, "Endmarke fehlt in index.html").toBeGreaterThan(anfang);
    const block = INDEX.slice(anfang + MARKE_ANFANG.length, ende).trim();
    expect(block, "index.html ist veraltet: node --import tsx scripts/start-inhalt.mts").toBe(
      startInhaltHtml().trim(),
    );
  });

  it("trägt eine FAQ-Auszeichnung, die zu den sichtbaren Fragen passt", () => {
    const anfang = INDEX.indexOf(MARKE_FAQ_ANFANG);
    const ende = INDEX.indexOf(MARKE_FAQ_ENDE);
    expect(anfang, "FAQ-Anfangsmarke fehlt in index.html").toBeGreaterThan(-1);
    expect(ende, "FAQ-Endmarke fehlt in index.html").toBeGreaterThan(anfang);
    const block = INDEX.slice(anfang + MARKE_FAQ_ANFANG.length, ende).trim();
    expect(block, "index.html ist veraltet: node --import tsx scripts/start-inhalt.mts").toBe(
      faqJsonLd().trim(),
    );

    // Gültiges JSON-LD mit den Pflichtfeldern je Typ …
    const json = JSON.parse(block.replace(/^<script[^>]*>|<\/script>$/g, ""));
    expect(json["@context"]).toBe("https://schema.org");
    expect(json["@type"]).toBe("FAQPage");
    expect(Array.isArray(json.mainEntity)).toBe(true);
    expect(json.mainEntity.length).toBeGreaterThan(0);

    // … und jede ausgezeichnete Frage steht auch sichtbar auf der Seite.
    // Ohne das wäre das Markup eine Falschangabe gegenüber der Suchmaschine.
    const sichtbar = INDEX.slice(INDEX.indexOf(MARKE_ANFANG), INDEX.indexOf(MARKE_ENDE));
    for (const frage of json.mainEntity) {
      expect(frage["@type"]).toBe("Question");
      expect(frage.acceptedAnswer["@type"]).toBe("Answer");
      expect(frage.acceptedAnswer.text.length).toBeGreaterThan(0);
      expect(sichtbar, `nicht sichtbar: ${frage.name}`).toContain(`<h3>${frage.name}</h3>`);
    }
  });

  it("führt jeden Abschnitt unter genau einer H2 mit Inhalt", () => {
    expect(START_ABSCHNITTE.length).toBeGreaterThan(0);
    for (const abschnitt of START_ABSCHNITTE) {
      expect(abschnitt.titel.length, JSON.stringify(abschnitt.titel)).toBeGreaterThan(0);
      expect(abschnitt.bloecke.length, abschnitt.titel).toBeGreaterThan(0);
    }
  });

  it("verweist nur auf Seiten, die es gibt", () => {
    const ziele = new Set<string>();
    for (const abschnitt of START_ABSCHNITTE) {
      for (const block of abschnitt.bloecke) {
        const teile =
          block.art === "absatz" ? block.teile
          : block.art === "frage" ? block.antwort
          : block.punkte.flat();
        for (const teil of teile) if (typeof teil !== "string") ziele.add(teil.ziel);
      }
    }
    expect(ziele.size).toBeGreaterThan(0);
    for (const ziel of ziele) {
      // Relative Adressen: dieselbe Schreibweise wie im übrigen Gerüst,
      // damit die Seite auch in der Electron-/Capacitor-App (file://) trägt.
      expect(ziel, "keine relative Adresse").toMatch(/^\.\/[a-z0-9-]+\.html$/);
      const datei = join(import.meta.dirname, "..", "..", "public", ziel.slice(2));
      expect(() => readFileSync(datei), `${ziel} fehlt in public/`).not.toThrow();
    }
  });
});
