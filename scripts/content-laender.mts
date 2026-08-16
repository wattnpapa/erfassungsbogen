/**
 * Hält den Absatz „Was ist mit anderen Bundesländern?“ auf allen
 * Katastrophenschutz-Länderseiten vollständig.
 *
 * Warum ein Skript: Der Absatz zählt die jeweils anderen Landesvorlagen auf und
 * wurde bisher beim Anlegen einer Seite von Hand geschrieben. Beim Anlegen der
 * nächsten wurde er auf den bestehenden Seiten nicht nachgezogen — Nordrhein-
 * Westfalen und Saarland fehlten deshalb auf allen zehn älteren Seiten, und
 * Baden-Württemberg hatte den Absatz gar nicht. Eine Aufzählung, die behauptet
 * „weitere Landesvorlagen liegen für … bereit“ und dabei zwei Länder verschweigt,
 * ist schlicht falsch.
 *
 * Die Kopfnavigation verlinkt inzwischen alle Länder von jeder Seite aus; dieser
 * Absatz trägt die interne Verlinkung also nicht mehr allein. Er bleibt trotzdem
 * gepflegt, weil er im Fließtext eine Aussage über den Bestand macht.
 *
 * Aufruf (Node ≥ 22): npm run content-laender
 *
 * Wie content-nav.mts arbeitet das Skript über markierte Blöcke
 * (`<!-- LAENDER:START -->` … `<!-- LAENDER:END -->`) und ersetzt beim zweiten
 * Lauf, statt zu verdoppeln. Beim ersten Lauf erkennt es den handgeschriebenen
 * Absatz an seiner Überschrift und übernimmt dessen Platz.
 */

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const wurzel = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(wurzel, "public");

/**
 * Alle Länderseiten mit ihrem Anzeigenamen, alphabetisch — dieselbe Reihenfolge
 * wie im Untermenü der Kopfnavigation, damit Leser den Bestand an beiden Stellen
 * gleich sortiert vorfinden.
 */
const LAENDER: { datei: string; name: string }[] = [
  { datei: "katastrophenschutz-baden-wuerttemberg.html", name: "Baden-Württemberg" },
  { datei: "katastrophenschutz-bayern.html", name: "Bayern" },
  { datei: "katastrophenschutz-berlin.html", name: "Berlin" },
  { datei: "katastrophenschutz-brandenburg.html", name: "Brandenburg" },
  { datei: "katastrophenschutz-hessen.html", name: "Hessen" },
  { datei: "katastrophenschutz-mecklenburg-vorpommern.html", name: "Mecklenburg-Vorpommern" },
  { datei: "katastrophenschutz-niedersachsen.html", name: "Niedersachsen" },
  { datei: "katastrophenschutz-nordrhein-westfalen.html", name: "Nordrhein-Westfalen" },
  { datei: "katastrophenschutz-rheinland-pfalz.html", name: "Rheinland-Pfalz" },
  { datei: "katastrophenschutz-saarland.html", name: "Saarland" },
  { datei: "katastrophenschutz-sachsen.html", name: "Sachsen" },
  { datei: "katastrophenschutz-thueringen.html", name: "Thüringen" },
];

/** Der handgeschriebene Vorgänger-Absatz, erkennbar an seiner Überschrift. */
const ALT_MUSTER = /\s*<h3>Was ist mit anderen Bundesländern\?<\/h3>\s*<p>\s*Weitere Landesvorlagen[\s\S]*?<\/p>/;
const BLOCK_MUSTER = /\s*<!-- LAENDER:START -->[\s\S]*?<!-- LAENDER:END -->/;

function blockHtml(datei: string): string {
  const andere = LAENDER.filter((l) => l.datei !== datei);
  const links = andere.map((l) => `<a href="./${l.datei}">${l.name}</a>`);
  // Der letzte Eintrag hängt an „und“ statt an einem Komma — die Aufzählung
  // steht im Fließtext, nicht in einer Liste.
  const aufzaehlung = `${links.slice(0, -1).join(",\n      ")} und\n      ${links.at(-1)}`;
  return `
    <!-- LAENDER:START -->
    <h3>Was ist mit anderen Bundesländern?</h3>
    <p>
      Weitere Landesvorlagen liegen für
      ${aufzaehlung}
      bereit — eine Übersicht gibt die Seite
      <a href="./katastrophenschutz.html">Katastrophenschutz der Länder</a>.
      Fehlt deins, kannst du jeden Bogen frei ausfüllen und selbst als Vorlage
      speichern.
    </p>
    <!-- LAENDER:END -->`;
}

function inject(inhalt: string, datei: string): string {
  const block = blockHtml(datei);
  if (BLOCK_MUSTER.test(inhalt)) return inhalt.replace(BLOCK_MUSTER, block);
  if (ALT_MUSTER.test(inhalt)) return inhalt.replace(ALT_MUSTER, block);
  // Seiten ohne Vorgänger (Baden-Württemberg) bekommen den Absatz als letzten
  // Punkt vor der Fußzeile — dort, wo er auf allen anderen Seiten auch steht.
  return inhalt.replace(/\n(\s*)<footer/, `\n${block}\n\n$1<footer`);
}

function main(): void {
  const dateien = readdirSync(publicDir).filter((d) => LAENDER.some((l) => l.datei === d));
  const fehlend = LAENDER.filter((l) => !dateien.includes(l.datei));
  for (const l of fehlend) console.warn(`In LAENDER gelistet, aber nicht vorhanden: ${l.datei}`);

  let geaendert = 0;
  for (const datei of dateien) {
    const pfad = join(publicDir, datei);
    const vorher = readFileSync(pfad, "utf8");
    const nachher = inject(vorher, datei);
    if (nachher !== vorher) {
      writeFileSync(pfad, nachher, "utf8");
      geaendert++;
    }
  }
  console.log(`Länder-Absatz aktualisiert: ${geaendert}/${dateien.length} Seiten.`);
}

main();
