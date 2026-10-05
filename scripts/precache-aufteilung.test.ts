import { describe, expect, it } from "vitest";
import { istZusatz, vorratAufteilen } from "./precache-aufteilung";
import { relativerPfad } from "../src/app/offline-vorrat";

describe("Offline-Vorrat in zwei Stufen (R3-O3)", () => {
  it("lässt Bogen, PDF, QR und die verlinkten Seiten im Kern", () => {
    for (const u of [
      "index.html",
      "anleitung.html",
      "vorlage.html",
      "datenschutz.html",
      "impressum.html",
      "assets/index-abc.js",
      "assets/pdf-abc.js",
      "assets/zxing_reader-abc.wasm",
      "assets/archivo-abc.woff2",
      "downloads/einheiten-erfassungsbogen-blanko.pdf",
      "manifest.webmanifest",
      "bilder/thw-logo.svg",
    ]) {
      expect(istZusatz(u), u).toBe(false);
    }
  });

  it("legt Beispielbögen und Themenseiten in die zweite Stufe", () => {
    for (const u of ["assets/001-albstadt-ztr-tz-abc.json", "thw.html", "katastrophenschutz-bayern.html", "uebersicht.html"]) {
      expect(istZusatz(u), u).toBe(true);
    }
  });

  it("teilt das Manifest und nennt beide Umfänge", () => {
    const { kern, umfang } = vorratAufteilen([
      { url: "index.html", revision: "1", size: 10 },
      { url: "assets/x-1.json", revision: null, size: 5 },
      { url: "thw.html", revision: "2", size: 7 },
    ]);
    expect(kern.map((e) => e.url)).toEqual(["index.html"]);
    expect(umfang.kern).toEqual([{ url: "index.html", size: 10 }]);
    expect(umfang.zusatz.map((e) => e.url)).toEqual(["assets/x-1.json", "thw.html"]);
  });

  it("liest Cache-Adressen als Manifest-Pfade", () => {
    expect(relativerPfad("https://x.app/assets/a.js", "https://x.app/")).toBe("assets/a.js");
    expect(relativerPfad("https://x.app/index.html?__WB_REVISION__=abc", "https://x.app/index.html")).toBe("index.html");
  });
});
