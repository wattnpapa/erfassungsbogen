/**
 * Hält die Suchergebnis-Schnipsel der statischen Seiten in Form.
 *
 * Google schneidet den Title in der Ergebnisliste nach etwa 60 Zeichen ab und
 * die Beschreibung nach etwa 160 — was danach steht, liest niemand. Ein zu
 * langer Title fällt beim Schreiben nicht auf (im Editor ist er einfach eine
 * Zeile), im Suchergebnis dagegen sofort. Darum hier die Grenzen als Test:
 * beim Anlegen einer neuen Seite fällt es auf, bevor Google es tut.
 *
 * Die Grenzen liegen bewusst etwas über dem Redaktionsziel (≤ 60 bzw. 150–160
 * Zeichen): der Test soll Ausrutscher fangen, nicht jede Formulierung um ein
 * Zeichen anmahnen.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const WURZEL = join(import.meta.dirname, "..", "..");

/** Title: darüber schneidet die Ergebnisliste ab. */
const TITEL_MAX = 65;

/** Beschreibung: darunter verschenkt sie Platz, darüber wird sie abgeschnitten. */
const BESCHREIBUNG_MIN = 80;
const BESCHREIBUNG_MAX = 165;

/**
 * Die Fehlerseite bleibt außen vor: sie taucht in keinem Suchergebnis auf und
 * braucht darum weder Beschreibung noch Canonical.
 */
const AUSGENOMMEN = new Set(["404.html"]);

/** Alle Seiten mit eigener Adresse — die App und die statischen Textseiten. */
function seiten(): string[] {
  const oeffentlich = readdirSync(join(WURZEL, "public"))
    .filter((d) => d.endsWith(".html") && !AUSGENOMMEN.has(d))
    .sort()
    .map((d) => `public/${d}`);
  return ["index.html", ...oeffentlich];
}

/**
 * Zählt die `<h1>` der gerenderten Seite. Der `<noscript>`-Block der Startseite
 * hat einen eigenen — der greift nur ohne JavaScript, es sind also nie beide
 * gleichzeitig zu sehen. Für die Zählung fliegt er darum heraus.
 */
function h1Anzahl(html: string): number {
  const ohneNoscript = html.replace(/<noscript>[\s\S]*?<\/noscript>/g, "");
  return (ohneNoscript.match(/<h1[\s>]/g) ?? []).length;
}

describe.each(seiten())("%s", (datei) => {
  const html = readFileSync(join(WURZEL, datei), "utf8");
  const titel = html.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim();
  const beschreibung = html.match(/<meta\s+name="description"\s+content="([^"]*)"/)?.[1];

  it(`hat einen Title von höchstens ${TITEL_MAX} Zeichen`, () => {
    expect(titel, "kein <title>").toBeTruthy();
    // Den Text mit in die Meldung, sonst rät man beim Kürzen.
    expect(titel!.length, `zu lang: „${titel}"`).toBeLessThanOrEqual(TITEL_MAX);
  });

  it(`hat eine Beschreibung von ${BESCHREIBUNG_MIN}–${BESCHREIBUNG_MAX} Zeichen`, () => {
    expect(beschreibung, 'kein <meta name="description">').toBeTruthy();
    expect(beschreibung!.length, `zu kurz: „${beschreibung}"`).toBeGreaterThanOrEqual(BESCHREIBUNG_MIN);
    expect(beschreibung!.length, `zu lang: „${beschreibung}"`).toBeLessThanOrEqual(BESCHREIBUNG_MAX);
  });

  it("nennt eine absolute Canonical-Adresse", () => {
    const canonical = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/)?.[1];
    expect(canonical, "kein rel=canonical").toBeTruthy();
    expect(canonical).toMatch(/^https:\/\/erfassungsbogen\.app\//);
  });

  it("hat genau eine H1", () => {
    expect(h1Anzahl(html)).toBe(1);
  });
});
