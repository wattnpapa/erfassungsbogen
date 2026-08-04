/**
 * Generiert src/vokabulare/thw-funktionen-ergaenzung.ts aus der THW-Funktionsliste.
 *
 * Aufgenommen werden die Inlandsbereiche (STAN-Position, Zusatzfunktion,
 * Sonstige Funktion) ohne "Gültig bis" — abgelaufene Funktionen sind für einen
 * heutigen Erfassungsbogen nur Ballast, die Auslandsfunktionen (SEEBA, SEEWA,
 * HCP …) laut Redaktionsentscheid ebenfalls nicht.
 *
 * CODES SIND APPEND-ONLY: Der Generator liest die bereits erzeugte Datei und
 * behält jede vorhandene Bezeichnung→Code-Zuordnung. Neue Bezeichnungen bekommen
 * Codes hinter dem bisherigen Maximum. Nur so bleiben alte QR-Codes und
 * gespeicherte Bögen lesbar (s. Schema-Regeln im Kopf von thw.ts).
 *
 * Aufruf:  npx tsx scripts/thw-funktionen-vokabular.mts
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HIER = dirname(fileURLToPath(import.meta.url));
const QUELLE = join(HIER, "quellen", "thw-funktionen.csv");
const ZIEL = join(HIER, "..", "src", "vokabulare", "thw-funktionen-ergaenzung.ts");
const KURATIERT = join(HIER, "..", "src", "vokabulare", "thw.ts");

/** Erster Code des generierten Blocks; darunter liegt die Handredaktion in thw.ts. */
const CODE_START = 200;

const BEREICHE_INLAND = ["STAN-Position", "Zusatzfunktion", "Sonstige Funktion"];

/**
 * Bezeichnungen, die dieselbe Funktion meinen wie ein handredaktioneller Eintrag
 * in thw.ts, dort aber anders geschrieben ist. Ohne diese Brücke bekäme dieselbe
 * Funktion zwei Codes.
 */
const ENTSPRICHT_KURATIERT: Record<string, string> = {
  "Maschinist/in Netzersatzanlage": "Maschinist/in NEA",
  "Maschinist/in Stromerzeuger": "Maschinist/in SEA",
  "Leiter/in THW-FüST": "Leiter/in THW-FüSt",
  "Leiter/in THW - Führungsstelle": "Leiter/in THW-FüSt",
  "Sachgebietsleiter/in S 1": "Sachgebietsleiter/in S1",
  "Sachgebietsleiter/in S 2": "Sachgebietsleiter/in S2",
  "Sachgebietsleiter/in S 3": "Sachgebietsleiter/in S3",
  "Sachgebietsleiter/in S 4": "Sachgebietsleiter/in S4",
  "Sachgebietsleiter/in S 5": "Sachgebietsleiter/in S5",
  "Sachgebietsleiter/in S 6": "Sachgebietsleiter/in S6",
  "Bootsführer/in THW": "Bootsführer/in",
  "Koch/Köchin FZ Log": "Koch/Köchin FGr Log-V",
};

/**
 * Funktionen der Quelle, die die App an anderer Stelle schon abbildet. Die
 * Fahrerlaubnisklasse steckt im Feld `fahrerlaubnis` der Person — als
 * Zusatzfunktion wäre sie doppelt erfasst und könnte ihr widersprechen.
 */
const NICHT_UEBERNEHMEN = ["Kraftfahrer/in B", "Kraftfahrer/in BE", "Kraftfahrer/in CE"];

/** Vergleichsform: Groß-/Kleinschreibung, Leerzeichen und Bindestriche egal. */
const schluessel = (s: string): string => s.toLowerCase().replace(/[\s\-.]/g, "");

// ------------------------------------------------- vorhandene Codes einsammeln

/** Bezeichnungen der Handredaktion in thw.ts — die dürfen nicht doppelt entstehen. */
const kuratierteNamen = new Set<string>();
for (const [, name] of readFileSync(KURATIERT, "utf8").matchAll(
  /\{ code: \d+, kurz: "[^"]*", name: "([^"]*)", art: "(?:funktion|zusatz)" \}/g,
)) {
  kuratierteNamen.add(schluessel(name));
}
if (kuratierteNamen.size < 50) {
  throw new Error(`Nur ${kuratierteNamen.size} kuratierte Funktionen erkannt — Format in thw.ts geändert?`);
}

/** Schon vergebene Codes des generierten Blocks (name → code). */
const vergeben = new Map<string, number>();
if (existsSync(ZIEL)) {
  for (const [, code, name] of readFileSync(ZIEL, "utf8").matchAll(
    /\{ code: (\d+), kurz: "[^"]*", name: "([^"]*)", art: "(?:funktion|zusatz)" \}/g,
  )) {
    vergeben.set(schluessel(name!), Number(code));
  }
}

// ------------------------------------------------------------- CSV einlesen

interface Eintrag {
  code: number;
  kurz: string;
  name: string;
  art: "funktion" | "zusatz";
}

const roh: Omit<Eintrag, "code">[] = [];
const gesehen = new Set<string>();
for (const zeile of readFileSync(QUELLE, "utf8").split("\n").slice(1)) {
  if (!zeile.trim()) continue;
  const felder = zeile.split(";").map((f) => f.replace(/^"|"$/g, "").trim());
  const [bereich, bezeichnung, kurz, , gueltigBis] = felder;
  if (!bereich || !bezeichnung || !BEREICHE_INLAND.includes(bereich)) continue;
  if (gueltigBis) continue; // abgelaufen

  // Offensichtlich fehlerhafte Altlasten der Quelle nicht anbieten.
  if (/ungültig/i.test(bezeichnung)) continue;
  if (NICHT_UEBERNEHMEN.includes(bezeichnung)) continue;

  // Die Quelle kürzt an einer Stelle "und" zu "u" ("Notversorgung u
  // Notinstandsetzung"), an der Schwesterposition nicht — hier vereinheitlicht.
  const roher = bezeichnung.replace(/ u (?=[A-ZÄÖÜ])/g, " und ");
  const name = ENTSPRICHT_KURATIERT[roher] ?? roher;
  const k = schluessel(name);
  if (kuratierteNamen.has(k) || gesehen.has(k)) continue;
  gesehen.add(k);

  roh.push({
    // STAN-Positionen sind die Grundfunktion (Spalte 1 der StAN-Übersicht),
    // Zusatz- und sonstige Funktionen kommen obendrauf.
    art: bereich === "STAN-Position" ? "funktion" : "zusatz",
    kurz: kurz || bezeichnung,
    name,
  });
}

// -------------------------------------------------------- Codes stabil vergeben

let naechster = Math.max(CODE_START - 1, ...[...vergeben.values()]) + 1;
const eintraege: Eintrag[] = roh.map((e) => {
  const k = schluessel(e.name);
  const code = vergeben.get(k) ?? naechster++;
  vergeben.set(k, code);
  return { ...e, code };
});

const entfallen = [...vergeben.keys()].filter((k) => !gesehen.has(k));
for (const k of entfallen) {
  // Nicht wiederverwenden, nur melden: der Code bleibt für alte Bögen belegt.
  console.warn(`Nicht mehr in der Quelle (Code ${vergeben.get(k)} bleibt reserviert): ${k}`);
}

if (eintraege.length < 100) {
  throw new Error(`Nur ${eintraege.length} Funktionen übernommen — Quelldatei geändert?`);
}

eintraege.sort((a, b) => a.code - b.code);
const zeilen = eintraege.map(
  (e) =>
    `  { code: ${e.code}, kurz: ${JSON.stringify(e.kurz)}, name: ${JSON.stringify(e.name)}, art: ${JSON.stringify(e.art)} },`,
);

const anzFunktion = eintraege.filter((e) => e.art === "funktion").length;
const datei = `/**
 * THW-Funktionen aus der Funktionsliste des THW, Inlandsbereiche
 * (${anzFunktion} STAN-Positionen als Grundfunktion, ${eintraege.length - anzFunktion} Zusatz-/sonstige Funktionen).
 *
 * GENERIERT — nicht von Hand bearbeiten.
 * Quelle: scripts/quellen/thw-funktionen.csv (vom Nutzer bereitgestellt).
 * Neu erzeugen mit:  npx tsx scripts/thw-funktionen-vokabular.mts
 *
 * Ergänzt die Handredaktion in thw.ts, die die geläufigen Funktionen mit
 * eigenen Kurzformen und den Codes 1–102 abdeckt. Codes ab ${CODE_START} sind
 * append-only: Der Generator übernimmt vorhandene Zuordnungen unverändert,
 * damit gespeicherte Bögen und alte QR-Codes weiter auflösen.
 * "kurz" ist hier die amtliche Kurzbezeichnung der Quelle.
 */

import type { FunktionsEintrag } from "./thw";

export const THW_FUNKTIONEN_ERGAENZUNG: FunktionsEintrag[] = [
${zeilen.join("\n")}
];
`;

writeFileSync(ZIEL, datei);
console.log(`${eintraege.length} Funktionen (Codes ${eintraege[0]!.code}–${eintraege.at(-1)!.code}) → ${ZIEL}`);
