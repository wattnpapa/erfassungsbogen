/**
 * Erzeugt den leeren Erfassungsbogen als statisch abrufbare Datei
 * public/downloads/einheiten-erfassungsbogen-blanko.pdf — den Vordruck zum
 * Ausdrucken und Ausfüllen mit der Hand (Fahrzeugmappe, Reserve im Meldekopf,
 * Ausfall der Technik).
 *
 * Aufruf (Node ≥ 22): npm run blanko-pdf
 *
 * Die Datei liegt bewusst im Repo statt beim Aufruf erzeugt zu werden: sie ist
 * ein direkt verlinkbarer Download, der ohne laufende App funktionieren muss.
 * Sie entsteht ausschließlich über dieses Skript aus derselben DocDefinition
 * wie jede andere Bogen-PDF (src/app/pdf-dokument.ts). Nach einer
 * Layout-Änderung schlägt der Test scripts/blanko-vordruck.test.ts an, bis
 * dieses Skript erneut gelaufen ist (Audit Runde 3, R3-A4).
 */

import { mkdirSync, statSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { BLANKO_DATEI, blankoVordruck } from "./blanko-vordruck";

const wurzel = join(dirname(fileURLToPath(import.meta.url)), "..");
const ZIEL = join(wurzel, BLANKO_DATEI);

mkdirSync(dirname(ZIEL), { recursive: true });
writeFileSync(ZIEL, await blankoVordruck(new Date()));
console.log(`${ZIEL} — ${(statSync(ZIEL).size / 1024).toFixed(1)} kB`);
