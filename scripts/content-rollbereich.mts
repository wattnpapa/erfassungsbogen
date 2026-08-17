/**
 * Macht die seitlich rollenden Tabellen der Content-Seiten mit der Tastatur
 * erreichbar — die Rollbereich-Regel aus DESIGN.md, übertragen auf public/.
 *
 * Der Befund: Auf katastrophenschutz.html rollt die Tabelle der Landesvorlagen
 * bei 375 px seitlich (380 px Inhalt in 343 px Rahmen). Ihr Container
 * `div.tabellenrahmen` trug `overflow-x: auto`, aber weder `tabindex` noch
 * `role` noch eine Beschriftung. Wer nicht wischen kann, für den existiert die
 * verdeckte Spalte damit nicht — genau der Fall, den die Regel beschreibt:
 * „Eine Tabelle, die seitlich rollt, ist ohne Tastaturzugang für alle
 * abgeschnitten, die nicht wischen können."
 *
 * In der App löst das die Komponente `src/app/tabellen-scroll.tsx`. Sie misst
 * bei jeder Größenänderung, ob wirklich etwas verdeckt ist, und vergibt
 * `tabindex`/`role`/Label nur dann — sonst stünde am Breitbild vor jeder
 * Tabelle ein Tabstopp ohne Zweck.
 *
 * **Warum hier trotzdem ein fest gesetzter Tabstopp.** Dynamisch wäre das nur
 * mit einem Skript zu haben, und die Seiten unter public/ sind bewusst
 * skriptfrei: Sie sollen offline, im Ausdruck und bei abgeschaltetem
 * JavaScript vollständig funktionieren (dieselbe Prämisse wie der Rest der
 * App). Ein Zugang, der ohne Skript verschwindet, ist als Barrierefreiheit
 * wertlos — er fiele genau in der Lage aus, für die er gebaut wird. Der Preis
 * ist ein überflüssiger Tabstopp je Tabelle am Breitbild. Der ist hier klein:
 * Anders als in der Personal-Übersicht der App, wo mehrere Tabellen
 * hintereinander liegen, trägt keine Content-Seite mehr als zwei, und sie
 * stehen weit auseinander im Text. Ein benannter, betretbarer Bereich ist
 * außerdem nicht sinnlos, wenn er gerade nichts verdeckt — er benennt die
 * Tabelle, die er umschließt.
 *
 * Was das Skript tut:
 * 1. Setzt an jeden rollenden Container (`div.tabellenrahmen`, `div.tabelle`)
 *    `tabindex="0"`, `role="region"` und ein `aria-label` aus der nächsten
 *    darüberstehenden Überschrift.
 * 2. Umschließt Tabellen, die noch gar keinen Rahmen haben. Ohne ihn rollt
 *    nicht die Tabelle, sondern die ganze Seite waagerecht — der schlechtere
 *    von beiden Fehlern.
 * 3. Schreibt einen CSS-Block mit `overflow-x` und dem Fokusring in der
 *    Kennfarbe (`outline`, wie in DESIGN.md und index.html).
 *
 * Aufruf (Node ≥ 22): npm run content-rollbereich
 *
 * Idempotent: Vorhandene Attribute werden ersetzt, nicht verdoppelt; ein
 * zweiter Lauf meldet 0 geänderte Seiten.
 */

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const wurzel = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(wurzel, "public");

/**
 * Die beiden Klassennamen, unter denen die Seiten ihre Rollbereiche führen.
 * Historisch gewachsen (`tabellenrahmen` auf vier, `tabelle` auf sechs
 * Seiten) — zusammenzulegen wäre eine eigene Änderung; für den Tastaturzugang
 * zählt nur, dass beide gleich behandelt werden.
 */
const KLASSEN = ["tabellenrahmen", "tabelle"];

/** Klasse, die ein neu angelegter Rahmen bekommt. */
const NEUE_KLASSE = "tabellenrahmen";

const OEFFNER = new RegExp(`<div class="(${KLASSEN.join("|")})"[^>]*>`, "g");

/** Text einer Überschrift, ohne Auszeichnung und ohne Entities. */
function reintext(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&(?:quot|#34);/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Beschriftung des Bereichs: die letzte Überschrift vor ihm. Sie benennt genau
 * den Abschnitt, zu dem die Tabelle gehört — eine erfundene Beschriftung wäre
 * eine zweite Wahrheit, die beim Umschreiben des Textes veraltet.
 */
function beschriftung(vorText: string): string {
  const ueberschriften = [...vorText.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/g)];
  const letzte = ueberschriften.at(-1);
  const text = letzte ? reintext(letzte[1]!) : "";
  // Anführungszeichen im Attribut wären ein kaputtes Tag; Zeilenumbrüche sind
  // in einem aria-label ohnehin bedeutungslos.
  return (text || "Tabelle").replace(/"/g, "");
}

/** Setzt (oder erneuert) die Attribute an einem vorhandenen Rollbereich. */
function rahmenAuszeichnen(html: string): { html: string; anzahl: number } {
  let anzahl = 0;
  const neu = html.replace(OEFFNER, (ganz, klasse: string, index: number) => {
    anzahl++;
    const label = beschriftung(html.slice(0, index));
    const ersatz = `<div class="${klasse}" tabindex="0" role="region" aria-label="${label}">`;
    return ersatz === ganz ? ganz : ersatz;
  });
  return { html: neu, anzahl };
}

/**
 * Legt um jede Tabelle ohne Rahmen einen an. Erkennung über den unmittelbar
 * davorstehenden Text: Endet der auf ein öffnendes `<div class="…">` einer der
 * bekannten Klassen, hat die Tabelle ihren Rahmen schon.
 */
function rahmenNachziehen(html: string): { html: string; anzahl: number } {
  let anzahl = 0;
  const muster = /([ \t]*)(<table\b[^>]*>[\s\S]*?<\/table>)/g;
  const neu = html.replace(muster, (ganz, einzug: string, tabelle: string, index: number) => {
    const davor = html.slice(0, index).trimEnd();
    if (new RegExp(`<div class="(?:${KLASSEN.join("|")})"[^>]*>$`).test(davor)) return ganz;
    anzahl++;
    const label = beschriftung(html.slice(0, index));
    const innen = tabelle.replace(/\n/g, "\n  ");
    return `${einzug}<div class="${NEUE_KLASSE}" tabindex="0" role="region" aria-label="${label}">\n${einzug}  ${innen}\n${einzug}</div>`;
  });
  return { html: neu, anzahl };
}

/**
 * `overflow-x` steht auf den meisten Seiten schon von Hand im Stylesheet; die
 * Regel hier wiederholt ihn, damit auch eine frisch umschlossene Tabelle rollt
 * statt die Seite zu verbreitern. Der Fokusring folgt dem App-Muster
 * (`outline: var(--fokus) solid var(--akzent)`, index.html): 3 px in der
 * Kennfarbe, mit Abstand zum Rahmen. Ohne ihn wäre der Tabstopp zwar da, aber
 * unsichtbar — ein Fokus, den man nicht sieht, ist kein Fokus (WCAG 2.4.7).
 */
const CSS = `/* ROLLBEREICH:CSS:START */
    .tabellenrahmen, .tabelle { overflow-x: auto; }
    .tabellenrahmen:focus-visible, .tabelle:focus-visible { outline: 3px solid var(--blau); outline-offset: 2px; }
    /* ROLLBEREICH:CSS:END */`;

const CSS_MUSTER = /\/\* ROLLBEREICH:CSS:START \*\/[\s\S]*?\/\* ROLLBEREICH:CSS:END \*\//;

function cssEinsetzen(html: string): string {
  if (CSS_MUSTER.test(html)) return html.replace(CSS_MUSTER, CSS);
  return html.replace("  </style>", `${CSS}\n  </style>`);
}

function main(): void {
  const dateien = readdirSync(publicDir).filter((d) => d.endsWith(".html"));
  let geaendert = 0;
  let bereiche = 0;
  let neueRahmen = 0;

  for (const datei of dateien) {
    const pfad = join(publicDir, datei);
    const vorher = readFileSync(pfad, "utf8");
    if (!/<table\b/.test(vorher)) continue;

    const gewickelt = rahmenNachziehen(vorher);
    const ausgezeichnet = rahmenAuszeichnen(gewickelt.html);
    const nachher = cssEinsetzen(ausgezeichnet.html);
    bereiche += ausgezeichnet.anzahl;
    neueRahmen += gewickelt.anzahl;

    if (nachher !== vorher) {
      writeFileSync(pfad, nachher, "utf8");
      geaendert++;
    }
  }

  console.log(
    `Rollbereiche ausgezeichnet: ${bereiche} in ${geaendert} geänderten Seiten ` +
      `(davon ${neueRahmen} Tabellen neu umschlossen).`,
  );
}

main();
