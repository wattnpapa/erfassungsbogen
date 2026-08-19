/**
 * Hält den Absprung zu den anderen Bundesländern auf allen
 * Katastrophenschutz-Länderseiten vollständig — und an der richtigen Stelle.
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
 * **Warum er nicht mehr im FAQ steht.** Bis eben war er dort die letzte
 * `<details class="frage">` — „Was ist mit anderen Bundesländern?“, elf
 * Landeslinks plus Übersichtslink, unmittelbar vor der Handlungsaufforderung.
 * Damit endete die Seite auf einer Liste von Wegen woanders hin, genau an der
 * Stelle, an der es einen Weg geben soll. Wer auf der Bayern-Seite ist, weil er
 * in Bayern ist, braucht die Liste nicht; wer falsch gelandet ist, findet sie
 * in der Kopfnavigation. Und eine Navigationsliste ist ohnehin keine Frage:
 * Sie im FAQ zu führen hieß, sie auch im `FAQPage`-Schema als Frage
 * auszuzeichnen.
 *
 * Der Block steht deshalb jetzt **unterhalb** des Abschlussknopfes
 * (`<!-- HANDLUNG:ABSCHLUSS:END -->`) als eigener Abschnitt mit eigener `h2`.
 * Das FAQ endet dadurch auf einer beantworteten Sachfrage, der Knopf ist das
 * Letzte vor dem Absprung, und wer weiterziehen will, findet den Weg trotzdem
 * — nur eben hinter der Entscheidung statt davor.
 *
 * Nicht gewählt wurde die Aufnahme in die Fußnavigation
 * (`content-nav.mts`, `.fussnav`): Die steht wortgleich auf **allen** 29
 * Seiten. Zwölf Landeslinks dort hingen auch unter `dlrg.html` und
 * `impressum.html`, wo sie niemanden angehen; die Fußzeile führt aus gutem
 * Grund nur die Übersichtsseite.
 *
 * **Die Karte wandert mit.** `content-laenderkarte.mts` setzt auf denselben
 * Seiten eine anklickbare Deutschlandkarte, und die ist `aria-hidden` — dieser
 * Absatz ist ihr einziger Zugang für Tastatur und Screenreader. Die beiden
 * dürfen nicht auseinanderfallen, deshalb nimmt dieses Skript einen
 * vorhandenen `<!-- KARTE:… -->`-Block beim Umsetzen mit. Danach ersetzt
 * `content-laenderkarte.mts` ihn wie immer an Ort und Stelle; die Reihenfolge
 * der beiden Läufe ist egal.
 *
 * Aufruf (Node ≥ 22): npm run content-laender
 *
 * Wie content-nav.mts arbeitet das Skript über markierte Blöcke
 * (`<!-- LAENDER:START -->` … `<!-- LAENDER:END -->`) und ersetzt beim zweiten
 * Lauf, statt zu verdoppeln.
 *
 * **Danach `npm run content-faq`.** Solange der Block im FAQ stand, zählte er
 * als sichtbare Frage und stand im `FAQPage`-Schema; jetzt zählt er nicht mehr
 * mit. `content-faq.mts` leitet die `mainEntity`-Liste aus der fertigen Seite
 * ab und zieht das nach — bis dahin nennt das Schema eine Frage zu viel. Der
 * Test in `scripts/content-seiten.test.ts` schlägt an, wenn der Lauf ausbleibt.
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

/** Einzug der Blockelemente im `<main>` aller Content-Seiten. */
const EINZUG = "    ";

/**
 * Der eigene Block und der der Karte — jeweils samt Einzug und den Leerzeilen
 * **davor**, damit das Herausnehmen keine doppelte Leerzeile hinterlässt und
 * das Ergebnis eines zweiten Laufs Zeichen für Zeichen dasselbe ist.
 */
const BLOCK_MUSTER = /\n*[^\S\n]*<!-- LAENDER:START -->[\s\S]*?<!-- LAENDER:END -->/;
const KARTE_MUSTER = /\n*[^\S\n]*<!-- KARTE:START -->[\s\S]*?<!-- KARTE:END -->/;

/** Hinter dem Abschlussknopf — die Begründung steht im Kopf dieser Datei. */
const ZIEL_MUSTER = /([^\S\n]*)<!-- HANDLUNG:ABSCHLUSS:END -->\n*/;

function blockHtml(datei: string): string {
  const andere = LAENDER.filter((l) => l.datei !== datei);
  const links = andere.map((l) => `<a href="./${l.datei}">${l.name}</a>`);
  // Der letzte Eintrag hängt an „und“ statt an einem Komma — die Aufzählung
  // steht im Fließtext, nicht in einer Liste.
  const aufzaehlung = `${links.slice(0, -1).join(",\n      ")} und\n      ${links.at(-1)}`;
  // Die Überschrift ist keine Frage mehr, weil der Block keine mehr ist: Er
  // steht nicht im FAQ und nicht im FAQPage-Schema, sondern ist die
  // Landesnavigation dieser Seite. Wie sie aussieht, steht in CSS weiter
  // unten — als Gliederungsstufe bleibt sie eine h2, im Bild tritt sie hinter
  // die Inhaltsüberschriften zurück.
  return `${EINZUG}<!-- LAENDER:START -->
    <h2 id="andere-bundeslaender">Andere Bundesländer</h2>
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

/**
 * Wie der Absprung aussieht — und warum er kleiner aussieht als der Rest.
 *
 * Der Block steht **hinter** dem Abschlussknopf: Er ist Navigation nach dem
 * Ziel, nicht Inhalt davor. Eine `h2` in der Stärke der Inhaltsüberschriften
 * (1.375rem, Textfarbe, Linie darunter) behauptet an dieser Stelle einen
 * Gleichrang mit „Kräfteerfassung im Verband" oder „Wo Namen und
 * Erreichbarkeiten bleiben", den der Block nicht hat — und zieht das Auge über
 * den Knopf hinweg, auf den die ganze Seite zuläuft.
 *
 * Die Überschrift bleibt trotzdem eine `h2`: Die Gliederung stimmt so (der
 * Absprung ist ein Abschnitt der Seite, kein Unterpunkt des Abschlussblocks),
 * Screenreader führen ihn in der Überschriftenliste, und der Anker
 * `#andere-bundeslaender` bleibt, was er ist. Geändert wird allein das Bild.
 *
 * Gewählt ist dafür die **Versalzeile** aus DESIGN.md (Mono, 700, 0.8125rem,
 * ls 0.1em, uppercase, Zweittext-Ton #5c6478) — dieselbe Rolle, die auf
 * derselben Seite schon die Gruppentitel der Fußnavigation und der Titel des
 * Sprungmenüs tragen. Sie sagt „Beschriftung eines Navigationsblocks" statt
 * „nächstes Kapitel", ohne dass dafür ein neuer Wert erfunden werden müsste.
 * Die Linie wandert von unten nach oben: Sie trennt den Nachspann vom Knopf,
 * statt eine Überschrift zu unterstreichen, die keine mehr sein will.
 *
 * Der Absatz folgt auf den Nebentext-Grad (0.875rem, Zweittext) und auf 60ch
 * Zeilenlänge — wie Bildunterzeile und Markenhinweis. Die zwölf Landeslinks
 * behalten die Kennfarbe: Sie sind der Zweck des Blocks, und die
 * Kennfarben-Regel nimmt Links ausdrücklich aus.
 */
const CSS = `/* LAENDER:CSS:START */
    h2#andere-bundeslaender { clear: both; margin-top: 2.5rem; padding: 0.9rem 0 0; border-top: 1px solid var(--rand); border-bottom: 0; font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace; font-weight: 700; font-size: 0.8125rem; letter-spacing: 0.1em; text-transform: uppercase; color: #5c6478; }
    h2#andere-bundeslaender + p { max-width: 60ch; margin-top: 0.4rem; font-size: 0.875rem; color: #5c6478; }
    /* LAENDER:CSS:END */`;

const CSS_MUSTER = /\/\* LAENDER:CSS:START \*\/[\s\S]*?\/\* LAENDER:CSS:END \*\//;

/** Wie bei den anderen Generatoren: eigener Block, beim zweiten Lauf ersetzt. */
function cssEinsetzen(html: string): string {
  if (CSS_MUSTER.test(html)) return html.replace(CSS_MUSTER, CSS);
  return html.replace("  </style>", `${CSS}\n  </style>`);
}

function inject(inhalt: string, datei: string): string {
  if (!ZIEL_MUSTER.test(inhalt)) {
    console.warn(`Länder-Absprung übersprungen (kein Abschlussblock): ${datei}`);
    return inhalt;
  }

  // Die Karte wird mitgenommen, wo sie steht — ihr Inhalt gehört
  // content-laenderkarte.mts und bleibt unangetastet, nur ihr Platz ist hier
  // entschieden.
  const karte = inhalt.match(KARTE_MUSTER)?.[0]?.replace(/^\n+/, "");

  // Wo die Blöcke bisher standen — zwischen FAQ und Abschlussknopf —, bleibt
  // sonst die Leerzeile weg, die dort auf allen anderen Seiten steht.
  const ohneBloecke = inhalt
    .replace(BLOCK_MUSTER, "")
    .replace(KARTE_MUSTER, "")
    .replace(/(<!-- FAQ:END -->)\n([^\S\n]*<!-- HANDLUNG:)/, "$1\n\n$2");
  const teile = [blockHtml(datei), karte].filter(Boolean).join("\n\n");

  return ohneBloecke.replace(
    ZIEL_MUSTER,
    (_ganz, einzug: string) => `${einzug}<!-- HANDLUNG:ABSCHLUSS:END -->\n\n${teile}\n\n`,
  );
}

function main(): void {
  const dateien = readdirSync(publicDir).filter((d) => LAENDER.some((l) => l.datei === d));
  const fehlend = LAENDER.filter((l) => !dateien.includes(l.datei));
  for (const l of fehlend) console.warn(`In LAENDER gelistet, aber nicht vorhanden: ${l.datei}`);

  let geaendert = 0;
  for (const datei of dateien) {
    const pfad = join(publicDir, datei);
    const vorher = readFileSync(pfad, "utf8");
    const nachher = cssEinsetzen(inject(vorher, datei));
    if (nachher !== vorher) {
      writeFileSync(pfad, nachher, "utf8");
      geaendert++;
    }
  }
  console.log(`Länder-Absatz aktualisiert: ${geaendert}/${dateien.length} Seiten.`);
}

main();
