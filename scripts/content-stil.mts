/**
 * Gleicht den Basis-Stil der Content-Seiten an die Handschrift der App an.
 *
 * Die Seiten unter public/ tragen jeweils ihr eigenes `<style>`. Das ist so
 * gewollt (kein Build-Templating, jede Seite steht allein), führt aber dazu,
 * dass Werte, die in DESIGN.md geregelt sind, hier als Rohwerte auftauchen und
 * beim Anlegen einer neuen Seite mitkopiert werden. Dieses Skript zieht genau
 * die geregelten Werte nach — chirurgisch, ohne das Stylesheet umzubauen:
 *
 * - **Null-Radius-Regel:** `border-radius` ist überall 0. Der abgerundete Knopf
 *   war das einzige Bauteil dieser Seiten, das nach Consumer-App aussah statt
 *   nach Vordruck.
 * - **Rollen-Token statt Rohgrau:** #555 und #444 werden zu den Werten, die die
 *   App als `--text-2` (Zweittext) führt. Beide bestehen den Kontrast auf dem
 *   Seitengrund; der Gewinn ist, dass es künftig einen Wert gibt statt drei.
 *
 * Bewusst NICHT angefasst: die Systemschrift. Archivo läge zwar in DESIGN.md,
 * kostet auf einer Landingpage aber einen blockierenden Font-Download — und
 * genau die Leichtigkeit ist der Grund, warum diese Seiten ohne Framework
 * gebaut sind. Das ist eine bewusste Abweichung, kein Versehen.
 *
 * Aufruf (Node ≥ 22): npm run content-stil
 *
 * Idempotent: Ein bereits angeglichener Wert wird nicht erneut ersetzt.
 */

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const wurzel = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(wurzel, "public");

/**
 * `--text-2` der App (#5c6478, Aktenschrift-Grau). Ersetzt #555 und #444: Beide
 * waren als „etwas leiser als Fließtext“ gemeint und meinen dieselbe Rolle.
 */
const TEXT_2 = "#5c6478";

interface Regel {
  name: string;
  suchen: RegExp;
  ersetzen: string;
}

const REGELN: Regel[] = [
  {
    name: "Null-Radius",
    // Nur im <style>-Block relevant; im Markup kommt border-radius nicht vor.
    suchen: /border-radius:\s*(?!0\b)[0-9.]+(?:px|rem|em)/g,
    ersetzen: "border-radius: 0",
  },
  {
    name: "Zweittext statt #555",
    suchen: /color:\s*#555\b/g,
    ersetzen: `color: ${TEXT_2}`,
  },
  {
    name: "Zweittext statt #444",
    suchen: /color:\s*#444\b/g,
    ersetzen: `color: ${TEXT_2}`,
  },
];

/** Nur der <style>-Block wird angefasst — im Fließtext hat nichts davon etwas zu suchen. */
function stilAngleichen(html: string): { html: string; treffer: Record<string, number> } {
  const treffer: Record<string, number> = {};
  const neu = html.replace(/<style>([\s\S]*?)<\/style>/, (_ganz, css: string) => {
    let angepasst = css;
    for (const regel of REGELN) {
      const anzahl = (angepasst.match(regel.suchen) ?? []).length;
      if (anzahl) {
        treffer[regel.name] = (treffer[regel.name] ?? 0) + anzahl;
        angepasst = angepasst.replace(regel.suchen, regel.ersetzen);
      }
    }
    return `<style>${angepasst}</style>`;
  });
  return { html: neu, treffer };
}

function main(): void {
  const dateien = readdirSync(publicDir).filter((d) => d.endsWith(".html"));
  const gesamt: Record<string, number> = {};
  let geaendert = 0;

  for (const datei of dateien) {
    const pfad = join(publicDir, datei);
    const vorher = readFileSync(pfad, "utf8");
    const { html, treffer } = stilAngleichen(vorher);
    for (const [k, v] of Object.entries(treffer)) gesamt[k] = (gesamt[k] ?? 0) + v;
    if (html !== vorher) {
      writeFileSync(pfad, html, "utf8");
      geaendert++;
    }
  }

  console.log(`Basis-Stil angeglichen: ${geaendert}/${dateien.length} Seiten.`);
  for (const [name, anzahl] of Object.entries(gesamt)) console.log(`  ${name}: ${anzahl} Werte`);
}

main();
