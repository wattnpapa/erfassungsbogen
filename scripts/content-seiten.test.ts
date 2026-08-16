// Prüft die statischen Content-Seiten unter public/ auf die Fehler, die beim
// Schreiben von Hand entstehen und die im Browser unsichtbar bleiben: ungültiges
// JSON-LD, tote interne Links, fehlende Bilddateien, Meta-Angaben, die in der
// Suchergebnisliste abgeschnitten werden.
//
// Anlass: Auf bundeswehr.html beendete ein gerades Anführungszeichen in
// „Bundeswehr" den JSON-String vorzeitig — der komplette @graph (Breadcrumb und
// FAQPage) war damit für Suchmaschinen wertlos, ohne dass die Seite anders
// aussah. Ein Test, der jeden ld+json-Block einmal durch JSON.parse schickt,
// hätte das beim Schreiben gefangen.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const WURZEL = join(import.meta.dirname, "..");
const PUBLIC = join(WURZEL, "public");

const SEITEN = readdirSync(PUBLIC).filter((d) => d.endsWith(".html"));

/** 404.html wird nie indexiert und trägt deshalb weder Canonical noch JSON-LD. */
const OHNE_META = new Set(["404.html"]);
const INHALTSSEITEN = SEITEN.filter((d) => !OHNE_META.has(d));

/**
 * Google kürzt Titel bei rund 60 und Beschreibungen bei rund 160 Zeichen. Wird
 * gekürzt, fällt das Ende weg — und dort steht bei den Länder- und
 * Fachgruppen-Seiten genau das Wort, das die Seite von ihren Geschwistern
 * unterscheidet.
 */
const TITEL_MAX = 60;
const BESCHREIBUNG_MAX = 160;

function lies(datei: string): string {
  return readFileSync(join(PUBLIC, datei), "utf8");
}

describe("Content-Seiten unter public/", () => {
  it.each(INHALTSSEITEN)("%s: jeder ld+json-Block ist gültiges JSON", (datei) => {
    const html = lies(datei);
    const bloecke = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    expect(bloecke.length).toBeGreaterThan(0);
    for (const [, roh] of bloecke) {
      expect(() => JSON.parse(roh)).not.toThrow();
    }
  });

  it.each(SEITEN)("%s: interne Links zeigen auf vorhandene Dateien", (datei) => {
    const html = lies(datei);
    const ziele = [...new Set([...html.matchAll(/href="\.\/([^"#?]+)(?:[#?][^"]*)?"/g)].map((m) => m[1]))];
    const tot = ziele.filter((z) => z && !existsSync(join(PUBLIC, z)));
    expect(tot).toEqual([]);
  });

  it.each(SEITEN)("%s: eingebundene Bilder liegen im Verzeichnis", (datei) => {
    const html = lies(datei);
    const quellen = [...new Set([...html.matchAll(/src="\.\/([^"]+)"/g)].map((m) => m[1]))];
    const fehlend = quellen.filter((q) => !existsSync(join(PUBLIC, q)));
    expect(fehlend).toEqual([]);
  });

  it.each(INHALTSSEITEN)("%s: Titel bleibt unter der Kürzungsgrenze", (datei) => {
    const titel = lies(datei).match(/<title>([\s\S]*?)<\/title>/)?.[1];
    expect(titel).toBeDefined();
    expect(titel!.length).toBeLessThanOrEqual(TITEL_MAX);
  });

  it.each(INHALTSSEITEN)("%s: Beschreibung bleibt unter der Kürzungsgrenze", (datei) => {
    const text = lies(datei).match(/<meta name="description" content="([\s\S]*?)">/)?.[1];
    expect(text).toBeDefined();
    expect(text!.length).toBeLessThanOrEqual(BESCHREIBUNG_MAX);
  });

  it.each(INHALTSSEITEN)("%s: og:url und canonical zeigen auf dieselbe Adresse", (datei) => {
    const html = lies(datei);
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    const ogUrl = html.match(/property="og:url" content="([^"]+)"/)?.[1];
    expect(canonical).toBe(`https://erfassungsbogen.app/${datei}`);
    expect(ogUrl).toBe(canonical);
  });

  it.each(SEITEN)("%s: genau eine h1 und Sprache ausgezeichnet", (datei) => {
    const html = lies(datei);
    expect(html.match(/<h1[\s>]/g)?.length).toBe(1);
    expect(html).toMatch(/<html lang="de">/);
  });

  it.each(SEITEN)("%s: jedes Bild trägt ein alt-Attribut", (datei) => {
    const ohneAlt = [...lies(datei).matchAll(/<img\b[^>]*>/g)].map((m) => m[0]).filter((i) => !/\balt=/.test(i));
    expect(ohneAlt).toEqual([]);
  });
});
