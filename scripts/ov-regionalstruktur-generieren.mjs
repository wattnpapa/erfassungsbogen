/**
 * Generiert src/vokabulare/thw-ov-regionalstruktur.ts:
 * die Zuordnung jedes THW-Ortsverbands zu seiner Regionalstelle und seinem
 * Landesverband (für das Autofill der Zugehörigkeit-Ebenen 2/3) sowie die
 * Kontaktdaten (Telefon/E-Mail) der Regionalstellen und Landesverbände.
 *
 * Quelle: THWiki (https://thwiki.org), MediaWiki-API. Aufbau:
 *   Kategorie:Regionalstelle → 66 "Regionalbereich <X>"-Kategorien;
 *   jede hängt an genau einer "Landesverband <Y>"-Kategorie und enthält
 *   ihre "Ortsverband <Z>"-Seiten. Die Kategorieseiten selbst führen im
 *   Abschnitt "Erreichbarkeit" Telefon und Poststellen-E-Mail.
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

/**
 * Korrekturen einzelner Kontaktfelder, wo die THWiki-Kategorieseite
 * nachweislich falsche Angaben führt (Copy-&-Paste-Fehler). Werte aus
 * offizieller THW-Quelle (thw.de/Regionalstellen), zuletzt geprüft 2026-07-14.
 */
const RST_KONTAKT_OVERRIDES = {
  // THWiki übernimmt aus der Aachener Seite die Nummer 0241 920322-0 (Vorwahl
  // Aachen). Korrekt (thw.de): Bielefeld 0521, Mönchengladbach 02161.
  Bielefeld: { telefon: "0521 915135-0" },
  "Mönchengladbach": { telefon: "02161 47764-0" },
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

/** Rohen Wikitext einer Seite holen (leer, wenn nicht vorhanden). */
async function wikitext(titel) {
  const d = await api({ action: "parse", page: titel, prop: "wikitext" });
  return d.parse?.wikitext?.["*"] ?? "";
}

/** Telefon aus THWiki-Schreibweise ("+49 (0) 241 920322-0") auf nationale Form ("0241 920322-0"). */
function telefonNormalisieren(s) {
  return s
    .replace(/\+49\s*\(0\)\s*/, "0")
    .replace(/^\+49\s*/, "0")
    .replace(/\s+/g, " ")
    .trim();
}

/** THWiki-Artefakte in E-Mails bereinigen: Soft-Hyphen/Zero-Width, doppelte Domain. */
function emailNormalisieren(s) {
  return s
    .replace(/[­​]/g, "") // Soft-Hyphen / Zero-Width-Space (Lübeck)
    .replace(/(@thw\.de)@thw\.de$/i, "$1"); // doppeltes @thw.de (Bad Tölz, Hannover, LV Hessen)
}

/**
 * Telefon + Poststellen-E-Mail aus dem "Erreichbarkeit"-Abschnitt einer
 * Regionalbereich-/Landesverband-Kategorieseite. Bewusst auf den Abschnitt
 * beschränkt, damit kein fremdes "Tel:" von weiter oben erwischt wird.
 */
function kontaktAusWikitext(wt) {
  const i = wt.search(/==\s*Erreichbarkeit/i);
  const abschnitt = i >= 0 ? wt.slice(i, i + 400) : wt;
  const tel = abschnitt.match(/Tel\.?\s*:?\s*([+0-9()/\s.-]+?)\s*(?:<br|\n)/i);
  const mail = abschnitt.match(/E-?Mail\s*:?\s*(?:mailto:)?([^\s<]+@thw\.de)/i);
  return {
    telefon: tel ? telefonNormalisieren(tel[1]) : "",
    email: mail ? emailNormalisieren(mail[1]) : "",
  };
}

// 1) THWiki-Regionalstruktur einlesen: OV-Name → { regionalstelle, landesverband }
const rbKategorien = (await kategorieMitglieder("Kategorie:Regionalstelle"))
  .map((m) => m.title)
  .filter((t) => t.startsWith("Kategorie:Regionalbereich "));
if (rbKategorien.length < 60) {
  throw new Error(`Nur ${rbKategorien.length} Regionalbereiche gefunden — THWiki-Struktur geändert?`);
}

const wikiZuordnung = new Map();
const regionalstellenKontakt = new Map(); // Name → { telefon, email }
const landesverbaende = new Set(); // Kategorietitel der Landesverbände
for (const kat of rbKategorien) {
  const regionalstelle = kat.replace("Kategorie:Regionalbereich ", "");
  const eltern = await elternKategorien(kat);
  const lvKat = eltern.find((c) => c.startsWith("Kategorie:Landesverband "));
  const lv = lvKat?.replace("Kategorie:Landesverband ", "");
  if (!lv) throw new Error(`Kein Landesverband für ${kat}`);
  landesverbaende.add(lvKat);

  const kontakt = kontaktAusWikitext(await wikitext(kat));
  if (!kontakt.telefon && !kontakt.email) console.warn(`Keine Kontaktdaten für RSt ${regionalstelle}`);
  regionalstellenKontakt.set(regionalstelle, kontakt);

  for (const m of await kategorieMitglieder(kat, 0)) {
    if (!m.title.startsWith("Ortsverband ")) continue;
    wikiZuordnung.set(m.title.replace("Ortsverband ", ""), { regionalstelle, landesverband: lv });
  }
}

// THWiki-Fehler korrigieren (siehe RST_KONTAKT_OVERRIDES)
for (const [name, patch] of Object.entries(RST_KONTAKT_OVERRIDES)) {
  if (!regionalstellenKontakt.has(name)) throw new Error(`Override für unbekannte RSt ${name}`);
  regionalstellenKontakt.set(name, { ...regionalstellenKontakt.get(name), ...patch });
}

// Kontaktdaten der Landesverbände aus ihren Kategorieseiten
const landesverbaendeKontakt = new Map(); // Name → { telefon, email }
for (const lvKat of landesverbaende) {
  const lv = lvKat.replace("Kategorie:Landesverband ", "");
  const kontakt = kontaktAusWikitext(await wikitext(lvKat));
  if (!kontakt.telefon && !kontakt.email) console.warn(`Keine Kontaktdaten für LV ${lv}`);
  landesverbaendeKontakt.set(lv, kontakt);
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

const kontaktZeilen = (m) =>
  [...m.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "de"))
    .map(([name, k]) => `  ${JSON.stringify(name)}: { telefon: ${JSON.stringify(k.telefon)}, email: ${JSON.stringify(k.email)} },`)
    .join("\n");

const datei = `/**
 * Zuordnung jedes THW-Ortsverbands zu Regionalstelle und Landesverband sowie
 * die Kontaktdaten der Regionalstellen und Landesverbände (für das Autofill
 * der Zugehörigkeit-Ebenen 2/3).
 * Schlüssel von THW_OV_REGIONALSTRUKTUR ist der OV-Name aus thw-ov.ts
 * (THW_ORTSVERBAENDE[].name); Schlüssel der Kontakt-Tabellen sind die
 * Regionalstellen- bzw. Landesverbandsnamen aus THW_OV_REGIONALSTRUKTUR.
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

/** Kontaktdaten einer Regionalstelle oder eines Landesverbands. */
export interface StelleKontakt {
  /** Telefon in nationaler Schreibweise, z. B. "0241 920322-0". */
  telefon: string;
  /** Poststellen-E-Mail, z. B. "Poststelle.RSt_Aachen@thw.de". */
  email: string;
}

export const THW_OV_REGIONALSTRUKTUR: Record<string, OvRegionalstruktur> = {
${zeilen.join("\n")}
};

/** Regionalstellenname → Kontaktdaten. */
export const THW_REGIONALSTELLEN_KONTAKT: Record<string, StelleKontakt> = {
${kontaktZeilen(regionalstellenKontakt)}
};

/** Landesverbandsname → Kontaktdaten. */
export const THW_LANDESVERBAENDE_KONTAKT: Record<string, StelleKontakt> = {
${kontaktZeilen(landesverbaendeKontakt)}
};
`;

writeFileSync(ZIEL, datei);
console.log(
  `Geschrieben: ${ZIEL} (${zuordnung.length} Ortsverbände, ` +
    `${regionalstellenKontakt.size} Regionalstellen, ${landesverbaendeKontakt.size} Landesverbände)`,
);
