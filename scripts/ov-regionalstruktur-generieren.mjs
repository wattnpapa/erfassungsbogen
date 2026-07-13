/**
 * Generiert src/vokabulare/thw-ov-regionalstruktur.ts:
 * die Zuordnung jedes THW-Ortsverbands zu seiner Regionalstelle und seinem
 * Landesverband (für das Autofill der Zugehörigkeit-Ebenen 2/3).
 *
 * Quelle: THWiki (https://thwiki.org), MediaWiki-API. Aufbau:
 *   Kategorie:Regionalstelle → 66 "Regionalbereich <X>"-Kategorien;
 *   jede hängt an genau einer "Landesverband <Y>"-Kategorie und enthält
 *   ihre "Ortsverband <Z>"-Seiten.
 *
 * Der Join gegen src/vokabulare/thw-ov.ts erfolgt über den OV-Namen; für
 * abweichende Schreibweisen und THWiki-seitig fehlende Einträge dienen die
 * ALIASSE- und OVERRIDES-Tabellen unten (bei THWiki-Änderungen anpassen).
 *
 * Aufruf:  node scripts/ov-regionalstruktur-generieren.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const API = "https://thwiki.org/api.php";
const WURZEL = join(dirname(fileURLToPath(import.meta.url)), "..");
const OV_QUELLE = join(WURZEL, "src", "vokabulare", "thw-ov.ts");
const ZIEL = join(WURZEL, "src", "vokabulare", "thw-ov-regionalstruktur.ts");

/** App-OV-Name → THWiki-OV-Name, wo sich die Schreibweisen unterscheiden. */
const ALIASSE = {
  "Berlin Lichtenberg": "Berlin-Lichtenberg",
  "Berlin Neukölln": "Berlin-Neukölln",
  "Berlin Pankow": "Berlin-Pankow",
  "Berlin Reinickendorf": "Berlin-Reinickendorf",
  "Berlin Spandau": "Berlin-Spandau",
  "Biberach/Baden": "Biberach/BD.",
  "Bremen Mitte": "Bremen-Mitte",
  "Bremen Nord": "Bremen-Nord",
  "Bremen Ost": "Bremen-Ost",
  "Bremen Süd": "Bremen-Süd",
  "Hamburg Mitte": "Hamburg-Mitte",
  "Hamburg Nord": "Hamburg-Nord",
  "Hann. Münden": "Hann.-Münden",
  Mallersdorf: "Mengkofen", // THWiki-Redirect Mallersdorf → Mengkofen (gleicher OV)
  "Neunburg vorm Wald": "Neunburg v.W.",
  Neustadt: "Neustadt in Holstein",
  "Neustadt an der Aisch": "Neustadt a.d.A.",
  "Neustadt an der Weinstraße": "Neustadt a.d.W.",
  "Oldenburg (NI)": "Oldenburg - NI",
  "Oldenburg in Holstein": "Oldenburg",
  "Osterode - NI": "Osterode",
  Papenburg: "Papenburg-Aschend.",
};

/**
 * App-OV-Name → feste Zuordnung, wo THWiki keine (kategorisierte) Seite hat.
 * Manuell recherchiert; bei Bedarf gegen offizielle THW-Angaben gegenprüfen.
 */
const OVERRIDES = {
  // THWiki-Seite existiert, ist aber unkategorisiert; Kreis Mettmann → RSt
  // Düsseldorf (wie Nachbar-OV Erkrath).
  Haan: { regionalstelle: "Düsseldorf", landesverband: "Nordrhein-Westfalen" },
  // Stützpunkt (keine eigene THWiki-Seite); Güby liegt im Bereich RSt Schleswig.
  "Stützpunkt Louisenlund": {
    regionalstelle: "Schleswig",
    landesverband: "Hamburg, Mecklenburg-Vorpommern, Schleswig-Holstein",
  },
};

async function api(params) {
  const url = `${API}?${new URLSearchParams({ ...params, format: "json" })}`;
  for (let versuch = 0; versuch < 4; versuch++) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) {
      if (versuch === 3) throw e;
      await new Promise((f) => setTimeout(f, 1500));
    }
  }
}

/** Alle Mitglieder einer Kategorie (mit Fortsetzung), optional auf Namensraum beschränkt. */
async function kategorieMitglieder(titel, namensraum) {
  const out = [];
  let cont = {};
  do {
    const d = await api({
      action: "query",
      list: "categorymembers",
      cmtitle: titel,
      cmlimit: "500",
      ...(namensraum !== undefined ? { cmnamespace: String(namensraum) } : {}),
      ...cont,
    });
    out.push(...d.query.categorymembers);
    cont = d.continue ?? {};
  } while (cont.cmcontinue);
  return out;
}

async function elternKategorien(titel) {
  const d = await api({ action: "query", prop: "categories", titles: titel, cllimit: "50" });
  const seite = Object.values(d.query.pages)[0];
  return (seite.categories ?? []).map((c) => c.title);
}

// 1) THWiki-Regionalstruktur einlesen: OV-Name → { regionalstelle, landesverband }
const rbKategorien = (await kategorieMitglieder("Kategorie:Regionalstelle"))
  .map((m) => m.title)
  .filter((t) => t.startsWith("Kategorie:Regionalbereich "));
if (rbKategorien.length < 60) {
  throw new Error(`Nur ${rbKategorien.length} Regionalbereiche gefunden — THWiki-Struktur geändert?`);
}

const wikiZuordnung = new Map();
for (const kat of rbKategorien) {
  const regionalstelle = kat.replace("Kategorie:Regionalbereich ", "");
  const eltern = await elternKategorien(kat);
  const lv = eltern.find((c) => c.startsWith("Kategorie:Landesverband "))?.replace("Kategorie:Landesverband ", "");
  if (!lv) throw new Error(`Kein Landesverband für ${kat}`);
  for (const m of await kategorieMitglieder(kat, 0)) {
    if (!m.title.startsWith("Ortsverband ")) continue;
    wikiZuordnung.set(m.title.replace("Ortsverband ", ""), { regionalstelle, landesverband: lv });
  }
}

// 2) App-OV-Namen aus thw-ov.ts lesen (Reihenfolge beibehalten)
const ovQuelle = readFileSync(OV_QUELLE, "utf-8");
const appNamen = [...ovQuelle.matchAll(/\{ name: "((?:[^"\\]|\\.)*)"/g)].map((m) =>
  m[1].replace(/\\"/g, '"'),
);
if (appNamen.length < 600) throw new Error(`Nur ${appNamen.length} OV-Namen in thw-ov.ts gefunden`);

// 3) Join
const zuordnung = [];
const fehlend = [];
for (const name of appNamen) {
  if (OVERRIDES[name]) {
    zuordnung.push([name, OVERRIDES[name]]);
    continue;
  }
  const wikiName = ALIASSE[name] ?? name;
  const treffer = wikiZuordnung.get(wikiName);
  if (treffer) zuordnung.push([name, treffer]);
  else fehlend.push(name);
}

if (fehlend.length > 0) {
  console.error(`Ohne Zuordnung (${fehlend.length}):`);
  for (const n of fehlend) console.error(`  ${n}`);
  throw new Error("Nicht alle Ortsverbände zugeordnet — ALIASSE/OVERRIDES ergänzen.");
}

// 4) Datei schreiben
const zeilen = zuordnung.map(
  ([name, z]) =>
    `  ${JSON.stringify(name)}: { regionalstelle: ${JSON.stringify(z.regionalstelle)}, landesverband: ${JSON.stringify(z.landesverband)} },`,
);

const datei = `/**
 * Zuordnung jedes THW-Ortsverbands zu Regionalstelle und Landesverband.
 * Schlüssel ist der OV-Name aus thw-ov.ts (THW_ORTSVERBAENDE[].name).
 *
 * GENERIERT — nicht von Hand bearbeiten.
 * Quelle: ${API} (THWiki), abgerufen ${new Date().toISOString().slice(0, 10)}.
 * Neu erzeugen mit:  node scripts/ov-regionalstruktur-generieren.mjs
 */

export interface OvRegionalstruktur {
  /** Name der zuständigen Regionalstelle, z. B. "Aachen". */
  regionalstelle: string;
  /** Landesverband (THW-Bezeichnung, ggf. Ländergruppe), z. B. "Bremen, Niedersachsen". */
  landesverband: string;
}

export const THW_OV_REGIONALSTRUKTUR: Record<string, OvRegionalstruktur> = {
${zeilen.join("\n")}
};
`;

writeFileSync(ZIEL, datei);
console.log(`Geschrieben: ${ZIEL} (${zuordnung.length} Ortsverbände)`);
