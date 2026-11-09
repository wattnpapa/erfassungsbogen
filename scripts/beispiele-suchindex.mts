/**
 * Suchindex der Beispielbögen (Prüfrunde Beispielbögen, Runde 2, BB2-S1, BB2-S2,
 * BB2-K2, BB2-N1, BB2-H2): Die Suche im Dialog kannte nur Ordner- und
 * Dateinamen; „Bergungsgruppe" fand nichts, weil die OV-Dateien „…-b" heißen.
 * Der Index trägt je Bogen den angezeigten Einheitstyp (THW: Name und Kürzel aus
 * dem Vokabular, sonst der Freitext), den Träger und die Orte der Ebenen.
 *
 * Er liegt als JSON-Datei neben dem Dialog (src/app/beispiele-suchindex.json)
 * und wird erst beim ersten Suchen geladen — als Datei, nicht als Modul, damit
 * er weder ins Start- noch ins JS-Bündel zählt.
 *
 * Aufruf (Node ≥ 22): npm run beispiele:suchindex   (neu schreiben)
 *                     npm run beispiele:suchindex -- --pruefen   (nur vergleichen)
 * Nach jedem Neuerzeugen von Beispielbögen mit ausführen; ein Test
 * (beispiele-suchindex.test.ts) prüft, dass jede Beispiel-Datei einen Eintrag hat.
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { THW_EINHEITSTYPEN } from "../vendor/bos-vokabulare/src/thw.ts";

const WURZEL = fileURLToPath(new URL("../examples/", import.meta.url));
const ZIEL = fileURLToPath(new URL("../src/app/beispiele-suchindex.json", import.meta.url));
const THW = 1;

function dateien(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? dateien(p) : n.endsWith(".json") ? [p] : [];
  });
}

interface Roh {
  einheit?: {
    organisation?: number;
    organisationName?: string;
    einheitsTyp?: { code?: number; freitext?: string };
    hierarchie?: { name?: string }[];
  };
}

export function eintragText(b: Roh): string {
  const e = b.einheit ?? {};
  const typ = e.einheitsTyp ?? {};
  const teile: string[] = [];
  if (typ.code != null && e.organisation === THW) {
    const v = THW_EINHEITSTYPEN.find((x) => x.code === typ.code);
    if (v) teile.push(v.name, v.kurz);
  }
  if (typ.freitext) teile.push(typ.freitext);
  if (e.organisationName) teile.push(e.organisationName);
  for (const h of e.hierarchie ?? []) if (h.name) teile.push(h.name);
  return [...new Set(teile.map((t) => t.trim()).filter(Boolean))].join(" | ");
}

/**
 * Aufbau (kompakt, die Bögen der Ortsverbände sind 3.500 Stück):
 * - `typen`: THW-Einheitstyp-Code → „Name | Kürzel"
 * - `ov`: Dateiname eines OV-Bogens (examples/thw/ortsverbaende/…, eindeutig) → Code;
 *   OV, Regionalstelle und Landesverband stehen schon in den Ordnernamen.
 * - `boegen`: alle übrigen, Pfad unter examples/ ohne „.json" → Text.
 */
export interface Suchindex {
  typen: Record<string, string>;
  ov: Record<string, number>;
  boegen: Record<string, string>;
}

const index: Suchindex = { typen: {}, ov: {}, boegen: {} };
for (const v of THW_EINHEITSTYPEN) index.typen[String(v.code)] = `${v.name} | ${v.kurz}`;
for (const datei of dateien(WURZEL).sort()) {
  const schluessel = relative(WURZEL, datei).split(sep).join("/").replace(/\.json$/, "");
  const roh = JSON.parse(readFileSync(datei, "utf8")) as Roh;
  const code = roh.einheit?.einheitsTyp?.code;
  if (schluessel.startsWith("thw/ortsverbaende/") && roh.einheit?.organisation === THW && code != null) {
    index.ov[schluessel.slice(schluessel.lastIndexOf("/") + 1)] = code;
  } else {
    index.boegen[schluessel] = eintragText(roh);
  }
}
const anzahl = Object.keys(index.ov).length + Object.keys(index.boegen).length;
const inhalt = `${JSON.stringify(index)}\n`;

if (process.argv.includes("--pruefen")) {
  let alt = "";
  try {
    alt = readFileSync(ZIEL, "utf8");
  } catch {
    /* fehlt */
  }
  if (alt !== inhalt) {
    console.error("beispiele-suchindex.json passt nicht zu examples/ — npm run beispiele:suchindex");
    process.exit(1);
  }
  console.log(`✓ Suchindex aktuell (${anzahl} Bögen)`);
} else {
  writeFileSync(ZIEL, inhalt);
  console.log(`Suchindex geschrieben: ${anzahl} Bögen, ${(inhalt.length / 1024).toFixed(0)} KB`);
}
