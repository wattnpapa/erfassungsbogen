/**
 * Der Download-Weg aller Browser-Exporte (CSV, Excel, JSON-Sicherung).
 *
 * Liegt als `.test.tsx` in der Suite „oberflaeche", weil `blobAlsDownload` ein
 * echtes DOM braucht — geprüft wird gerade das, was in Node nicht existiert:
 * hängt der Anker beim Klick im Dokument, und lebt die Blob-URL über den Klick
 * hinaus? Beides ist der Unterschied zwischen „Datei kommt" und „Knopf tut
 * nichts", und beides sieht man im Aufrufer nicht.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { blobAlsDownload } from "./hilfen";

interface Klick {
  /** Hing der Anker beim Klick im Dokument? */
  imDokument: boolean;
  /** War die Blob-URL zum Zeitpunkt des Klicks noch gültig? */
  urlGueltig: boolean;
  name: string;
}

let klicks: Klick[];
let gueltig: Set<string>;

beforeEach(() => {
  klicks = [];
  gueltig = new Set();
  vi.useFakeTimers();
  vi.stubGlobal("URL", {
    ...URL,
    createObjectURL: (_b: Blob) => {
      const u = `blob:test/${gueltig.size + 1}`;
      gueltig.add(u);
      return u;
    },
    revokeObjectURL: (u: string) => gueltig.delete(u),
  });
  // jsdom würde dem Link folgen wollen („Not implemented: navigation"). Der
  // Mitschnitt hier ersetzt den Browser-Download.
  document.addEventListener("click", (e) => {
    const a = e.target as HTMLAnchorElement;
    if (a.tagName !== "A") return;
    e.preventDefault();
    klicks.push({ imDokument: a.isConnected, urlGueltig: gueltig.has(a.href), name: a.download });
  });
});

afterEach(() => {
  // Die Aufräum-Uhr des vorigen Tests laufen lassen: sonst bleiben seine Anker
  // im Dokument und der nächste Test zählt sie mit.
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("blobAlsDownload", () => {
  it("klickt einen Anker, der im Dokument hängt und eine gültige Blob-URL trägt", () => {
    blobAlsDownload("eeb-THW-oldenburg.xlsx", new Blob(["x"]));

    expect(klicks).toEqual([{ imDokument: true, urlGueltig: true, name: "eeb-THW-oldenburg.xlsx" }]);
  });

  it("gibt die Blob-URL nicht im selben Takt frei — der Download hätte sonst ins Leere gegriffen", () => {
    blobAlsDownload("eeb.csv", new Blob(["x"]));

    expect(gueltig.size).toBe(1);
  });

  it("räumt Anker und Blob-URL später auf", () => {
    blobAlsDownload("eeb.csv", new Blob(["x"]));
    expect(document.querySelectorAll("a[download]")).toHaveLength(1);

    vi.runAllTimers();

    expect(document.querySelectorAll("a[download]")).toHaveLength(0);
    expect(gueltig.size).toBe(0);
  });
});
