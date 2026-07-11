/**
 * Generiert src/vokabulare/thw-ov.ts aus der OV-Karte https://thw.blafusel.de/.
 *
 * Die Seite bettet alle Ortsverbände als createMarker(...)-Aufrufe ein; die
 * Textfelder sind ROT13-verschleiert (Spam-Schutz der Seite) und werden hier
 * dekodiert. Aufruf:  node scripts/ov-verzeichnis-generieren.mjs
 */

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const QUELLE = "https://thw.blafusel.de/";
const ZIEL = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "vokabulare", "thw-ov.ts");

const rot13 = (s) =>
  s.replace(/[a-zA-Z]/g, (c) => {
    const basis = c <= "Z" ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - basis + 13) % 26) + basis);
  });

/** Zerlegt eine Argumentliste auf oberster Ebene (Kommata in Strings/Arrays ignorieren). */
function argumente(text) {
  const args = [];
  let aktuell = "";
  let inString = false;
  let klammerTiefe = 0;
  for (const z of text) {
    if (z === '"') inString = !inString;
    if (!inString) {
      if (z === "[") klammerTiefe++;
      if (z === "]") klammerTiefe--;
      if (z === "," && klammerTiefe === 0) {
        args.push(aktuell.trim());
        aktuell = "";
        continue;
      }
    }
    aktuell += z;
  }
  if (aktuell.trim()) args.push(aktuell.trim());
  return args;
}

const dekodiereString = (roh) => rot13(roh.replace(/^"|"$/g, "")).trim();

const html = await (await fetch(QUELLE)).text();

const eintraege = [];
for (const [, argText] of html.matchAll(/^createMarker\(([\s\S]*?)\);/gm)) {
  const a = argumente(argText);
  if (a.length < 13) {
    console.warn(`Übersprungen (nur ${a.length} Argumente): ${argText.slice(0, 60)}…`);
    continue;
  }
  // Signatur: lat, lng, idx, ortsverband, strasse, ort, plz, telefon, fax, email, www, kurz, einheiten
  eintraege.push({
    name: dekodiereString(a[3]),
    kurz: dekodiereString(a[11]),
    strasse: dekodiereString(a[4]),
    plz: dekodiereString(a[6]),
    ort: dekodiereString(a[5]),
    telefon: dekodiereString(a[7]),
    email: dekodiereString(a[9]),
    www: dekodiereString(a[10]),
    lat: Math.round(parseFloat(a[0]) * 1e5) / 1e5,
    lng: Math.round(parseFloat(a[1]) * 1e5) / 1e5,
  });
}

if (eintraege.length < 600) {
  throw new Error(`Nur ${eintraege.length} Ortsverbände gefunden — Seitenstruktur geändert?`);
}

// Namen müssen eindeutig sein, damit die Autovervollständigung exakt zuordnen kann.
const gesehen = new Map();
for (const e of eintraege) {
  if (gesehen.has(e.name)) {
    const erster = gesehen.get(e.name);
    console.warn(`Doppelter OV-Name, ergänze PLZ: ${e.name}`);
    erster.name = `${erster.name} (${erster.plz})`;
    e.name = `${e.name} (${e.plz})`;
  }
  gesehen.set(e.name, e);
}

eintraege.sort((x, y) => x.name.localeCompare(y.name, "de"));

const zeilen = eintraege.map(
  (e) =>
    `  { name: ${JSON.stringify(e.name)}, kurz: ${JSON.stringify(e.kurz)}, strasse: ${JSON.stringify(e.strasse)}, plz: ${JSON.stringify(e.plz)}, ort: ${JSON.stringify(e.ort)}, telefon: ${JSON.stringify(e.telefon)}, email: ${JSON.stringify(e.email)}, www: ${JSON.stringify(e.www)}, lat: ${e.lat}, lng: ${e.lng} },`,
);

const datei = `/**
 * Verzeichnis der THW-Ortsverbände mit Adress- und Kontaktdaten.
 *
 * GENERIERT — nicht von Hand bearbeiten.
 * Quelle: ${QUELLE} (inoffizielle OV-Karte), abgerufen ${new Date().toISOString().slice(0, 10)}.
 * Neu erzeugen mit:  node scripts/ov-verzeichnis-generieren.mjs
 */

export interface ThwOrtsverband {
  /** OV-Name wie im THW üblich, ohne "OV"-Präfix: "Aachen", "Oldenburg (Oldb)". */
  name: string;
  /** Offizielles OV-Kürzel: "OAAC". */
  kurz: string;
  strasse: string;
  plz: string;
  ort: string;
  /** Telefon wie veröffentlicht (mit Leerzeichen); für das Modell Ziffern extrahieren. */
  telefon: string;
  email: string;
  www: string;
  lat: number;
  lng: number;
}

export const THW_ORTSVERBAENDE: ThwOrtsverband[] = [
${zeilen.join("\n")}
];
`;

writeFileSync(ZIEL, datei);
console.log(`${eintraege.length} Ortsverbände → ${ZIEL}`);
