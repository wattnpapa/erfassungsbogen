// Prüft den Seitengenerator scripts/content-stil.mts gegen die eingecheckten
// Seiten unter public/ und die Lesbarkeit der dunklen Anzeigemodi dort.
//
// Anlass (Audit Runde 2, R2-L1): Die Regel „Textfarbe als Token“ lief
// ungebunden über das ganze Stylesheet und schrieb `--text` auch in den
// Modus-Blöcken auf #11141b zurück. Im Dunkel- und Nacht-Thema (und bei
// Systemeinstellung dunkel ohne Wahl) standen Überschriften und Fließtext
// damit bei 1,01:1 auf dem Grund — auf allen 36 Seiten, ohne dass ein Test
// anschlug, weil kein Test die Modus-Blöcke las.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { stilAngleichen, THEMA_CSS } from "./content-stil.mjs";

const PUBLIC = join(import.meta.dirname, "..", "public");
const SEITEN = readdirSync(PUBLIC).filter((d) => d.endsWith(".html"));

function lies(datei: string): string {
  return readFileSync(join(PUBLIC, datei), "utf8");
}

/** Relative Leuchtdichte nach WCAG 2.x für #rgb / #rrggbb. */
function leuchtdichte(hex: string): number {
  let h = hex.replace("#", "");
  if (h.length === 3) h = [...h].map((z) => z + z).join("");
  const kanal = (i: number) => {
    const v = parseInt(h.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * kanal(0) + 0.7152 * kanal(2) + 0.0722 * kanal(4);
}

function kontrast(a: string, b: string): number {
  const [hell, dunkel] = [leuchtdichte(a), leuchtdichte(b)].sort((x, y) => y - x);
  return (hell! + 0.05) / (dunkel! + 0.05);
}

/** Token-Belegung eines Blocks `html.<modus>-modus { … }` aus einem Stylesheet. */
function modusToken(css: string, modus: string): Record<string, string> {
  const rumpf = css.match(new RegExp(`html\\.${modus}-modus\\s*\\{([^}]*)\\}`))?.[1];
  expect(rumpf, `Block html.${modus}-modus fehlt`).toBeDefined();
  return Object.fromEntries([...rumpf!.matchAll(/(--[\w-]+):\s*(#[0-9a-f]{3,8})\b/gi)].map((m) => [m[1]!, m[2]!]));
}

/**
 * Schriftrolle → Gründe, auf denen sie auf den Seiten steht. Links (--blau)
 * stehen nur auf Seitengrund und Fläche, nie in Tabellenköpfen (--flaeche-2);
 * nachts erreichte Bernstein dort nur 4,24:1 — die Werte stammen aus
 * index.html und gelten für die App mit.
 */
const PAARE: Record<string, string[]> = {
  "--text": ["--grau", "--flaeche", "--flaeche-2"],
  "--text-2": ["--grau", "--flaeche", "--flaeche-2"],
  "--blau": ["--grau", "--flaeche"],
};

function dunkleModiPruefen(css: string): void {
  for (const modus of ["dunkel", "nacht"]) {
    const t = modusToken(css, modus);
    for (const [schrift, gruende] of Object.entries(PAARE)) {
      for (const grund of gruende) {
        expect(t[schrift], `${modus}: ${schrift} fehlt`).toBeDefined();
        expect(t[grund], `${modus}: ${grund} fehlt`).toBeDefined();
        expect(kontrast(t[schrift]!, t[grund]!), `${modus}: ${schrift} ${t[schrift]} auf ${grund} ${t[grund]}`).toBeGreaterThanOrEqual(4.5);
      }
    }
    // Ausdrücklich der Fehler aus R2-L1: kein Tintenschwarz als Text im Dunkeln.
    expect(t["--text"]!.toLowerCase()).not.toBe("#11141b");
  }
}

describe("scripts/content-stil.mts: Modus-Blöcke (R2-L1)", () => {
  it("der Generator selbst belegt --text in Dunkel und Nacht hell, im Feld schwarz", () => {
    dunkleModiPruefen(THEMA_CSS);
    expect(modusToken(THEMA_CSS, "feld")["--text"]).toBe("#000000");
  });

  it("die Angleich-Regeln verändern den Modus-Block nicht", () => {
    // Eine Seite im alten, fehlerhaften Stand: Rohwert in :root, und der
    // Modus-Block trägt überall Tintenschwarz.
    const kaputt = THEMA_CSS.replace(/--text: #[0-9a-f]+;/gi, "--text: #11141b;");
    const html = `<head>\n  <style>\n    :root { --blau: #1f3d8a; --text: #1a1c22; }\n    body { color: var(--text); }\n${kaputt}  </style>\n</head>`;
    const { html: neu } = stilAngleichen(html);
    const css = neu.match(/<style>([\s\S]*?)<\/style>/)![1]!;
    // :root wird weiterhin auf das App-Token gezogen …
    expect(css).toMatch(/:root \{[^}]*--text: #11141b;/);
    // … der Modus-Block aber steht wieder wörtlich wie im Generator.
    expect(css).toContain(THEMA_CSS);
    dunkleModiPruefen(css);
  });

  it("dimmt Fotos und Bildschirmfotos in Dunkel und Nacht, die Strichcodes nicht (R3-L4)", () => {
    expect(THEMA_CSS).toMatch(/html\.dunkel-modus figure:not\(\.scancodes figure\) img,\s*html\.nacht-modus figure:not\(\.scancodes figure\) img \{ filter: brightness\(0\.7\); \}/);
    for (const datei of SEITEN) {
      const css = lies(datei).match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? "";
      if (/<img/.test(lies(datei))) expect(css, datei).toContain("html.dunkel-modus figure:not(.scancodes figure) img");
    }
  });

  it("der umrandete Knopf .start.papier behält in den dunklen Modi seine Schrift", () => {
    // Das Sicherheitsnetz für .start setzt die Schrift auf --auf-blau (dunkel);
    // auf der Fläche stünde sie dann bei rund 1:1.
    expect(THEMA_CSS).toMatch(/:is\(\.start:not\(\.papier\), \.sprunglink\)/);
  });
});

describe("public/*.html: eingecheckt = Generator-Ausgabe (R2-L1)", () => {
  it.each(SEITEN)("%s: npm run content-stil änderte nichts mehr", (datei) => {
    const html = lies(datei);
    // Weicht die Datei ab, wurde der Generator geändert, ohne ihn laufen zu
    // lassen — oder die Seite von Hand am Generator vorbei geändert.
    expect(stilAngleichen(html).html).toBe(html);
  });

  it.each(SEITEN)("%s: Text in Dunkel und Nacht mindestens 4,5:1", (datei) => {
    const css = lies(datei).match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? "";
    dunkleModiPruefen(css);
  });
});
