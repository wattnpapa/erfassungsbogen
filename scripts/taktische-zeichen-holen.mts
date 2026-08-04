/**
 * Holt die taktischen Zeichen aus dem Release-Archiv von
 * github.com/jonas-koeritz/Taktische-Zeichen und schreibt sie als eine
 * generierte TS-Datei nach src/vokabulare/taktische-zeichen-symbole.ts.
 *
 * Warum eingebacken statt als Abhängigkeit: das Projekt liefert keine
 * npm-Pakete, sondern fertige SVG/PNG im Release. Die Zeichen sind Teil der
 * Oberfläche UND des PDFs — sie müssen offline und synchron verfügbar sein,
 * ein Nachladen zur Laufzeit scheidet aus.
 *
 * Aufbereitung je Datei (aus 26 kB werden ~800 B):
 *  - Der eingebettete Base64-Font (Roboto Slab, ~25 kB je Datei) fliegt raus.
 *    Im Browser zeichnet die Systemschrift, im PDF der von pdfmake
 *    registrierte Font — beides braucht das @font-face nicht.
 *  - Schriftfamilie „Roboto Slab" → „Roboto": svg-to-pdfkit kennt nur die von
 *    pdfmake registrierten Fonts, „Roboto Slab" ist keiner davon.
 *  - `viewbox` → `viewBox`: das Archiv schreibt es klein. In einer data:-URL
 *    wird das SVG als XML gelesen, dort zählt Groß-/Kleinschreibung — mit
 *    kleinem `viewbox` fehlt dem Bild die Skalierungsbox.
 *  - DOCTYPE, <title> und Einrückung entfallen (Größe). Die Titel wandern
 *    stattdessen in eine eigene Tabelle: sie sind der Anzeigename und die
 *    Grundlage für die Freitext-Suche.
 *
 * Aktualisieren, wenn es dort ein neues Release gibt:
 *
 *     npm run zeichen -- v2.1.0
 *
 * Danach den Diff der generierten Datei ansehen (neue/entfallene Zeichen) und
 * `npm test` laufen lassen — die Tests prüfen, dass die Zuordnungstabellen in
 * src/app/taktische-zeichen.ts noch auf vorhandene Zeichen zeigen. Ohne
 * Argument wird die unten festgeschriebene Version geholt, damit ein Build
 * immer dasselbe Ergebnis liefert.
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/** Festgeschriebene Version — nur hier ändern (oder per Argument übersteuern). */
const VERSION = process.argv[2] ?? "v2.0.0";
const RELEASE = `https://github.com/jonas-koeritz/Taktische-Zeichen/releases/download/${VERSION}/release.zip`;
const ZIEL = fileURLToPath(new URL("../src/vokabulare/taktische-zeichen-symbole.ts", import.meta.url));

/**
 * Übernommen werden nur die Ordner, aus denen der Erfassungsbogen schöpft:
 * Fahrzeuge und Einheiten (taktische Formationen) samt der neutralen
 * Grundzeichen. Personen, Gefahren, Gebäude, Fernmeldewesen usw. kennt der
 * Bogen nicht — sie würden das Bundle nur aufblähen.
 */
const ORDNER = [
  "Fahrzeuge",
  "Einheiten",
  "THW_Fahrzeuge",
  "THW_Einheiten",
  "Feuerwehr_Fahrzeuge",
  "Feuerwehr_Einheiten",
  "Rettungswesen_Fahrzeuge",
  "Rettungswesen_Einheiten",
  "Wasserrettung_Einheiten",
  "Polizei_Fahrzeuge",
  "Polizei_Einheiten",
  "Katastrophenschutz_Einheiten",
  "Bundeswehr_Fahrzeuge",
  "Bundeswehr_Einheiten",
  "Kommunal_Fahrzeuge",
  "Zoll_Fahrzeuge",
  "Zoll_Einheiten",
];

function aufbereiten(roh: string): { svg: string; titel: string } {
  const titel = roh.match(/<title>([\s\S]*?)<\/title>/)?.[1].trim() ?? "";
  let svg = roh
    .replace(/^<!DOCTYPE[^>]*>\s*/, "")
    .replace(/\s*<style type="text\/css">[\s\S]*?<\/style>/g, "")
    .replace(/\s*<title>[\s\S]*?<\/title>/g, "")
    .replace(/<defs>\s*<\/defs>/g, "")
    .replaceAll("Roboto Slab", "Roboto")
    .replace(/\bviewbox=/g, "viewBox=");
  // Einrückung und Zeilenumbrüche zwischen den Elementen zusammenstreichen.
  svg = svg.replace(/>\s+</g, "><").replace(/\s{2,}/g, " ").trim();
  return { svg, titel };
}

const tmp = mkdtempSync(join(tmpdir(), "tz-"));
try {
  console.log(`Lade ${RELEASE} …`);
  execFileSync("curl", ["-sSL", "-o", join(tmp, "release.zip"), RELEASE], { stdio: "inherit" });
  execFileSync("unzip", ["-q", "-o", join(tmp, "release.zip"), "svg/*", "-d", tmp]);

  const symbole: [string, string][] = [];
  const titel: [string, string][] = [];
  for (const ordner of ORDNER) {
    const pfad = join(tmp, "svg", ordner);
    let dateien: string[];
    try {
      dateien = readdirSync(pfad).filter((d) => d.endsWith(".svg")).sort();
    } catch {
      console.warn(`  ! Ordner fehlt im Release: ${ordner}`);
      continue;
    }
    for (const datei of dateien) {
      const schluessel = `${ordner}/${datei.replace(/\.svg$/, "")}`;
      const roh = readFileSync(join(pfad, datei), "utf8");
      const { svg, titel: t } = aufbereiten(roh);
      symbole.push([schluessel, svg]);
      if (t) titel.push([schluessel, t]);
    }
    console.log(`  ${ordner}: ${dateien.length}`);
  }

  const zeile = ([k, v]: [string, string]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`;
  const bytes = symbole.reduce((s, [, v]) => s + v.length, 0);
  const inhalt = `// GENERIERT von scripts/taktische-zeichen-holen.mts — nicht von Hand ändern.
// Neu holen/aktualisieren: npm run zeichen [-- <version>]
// Quelle: github.com/jonas-koeritz/Taktische-Zeichen, Release ${VERSION} (CC0 1.0).
// ${symbole.length} Zeichen, ${(bytes / 1024).toFixed(0)} kB.

/** Taktisches Zeichen als SVG-Quelltext, Schlüssel „Ordner/Name". */
export const TZ_SYMBOLE: Record<string, string> = {
${symbole.map(zeile).join("\n")}
};

/** Ausgeschriebener Name je Zeichen (aus dem <title> des Originals). */
export const TZ_TITEL: Record<string, string> = {
${titel.map(zeile).join("\n")}
};
`;
  writeFileSync(ZIEL, inhalt, "utf8");
  console.log(`\n${symbole.length} Zeichen (${(bytes / 1024).toFixed(0)} kB) → ${ZIEL}`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
