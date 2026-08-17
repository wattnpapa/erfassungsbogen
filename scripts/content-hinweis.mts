/**
 * Fügt den Marken- und Unabhängigkeitshinweis in den Fußbereich aller
 * statischen Content-Seiten unter public/ ein (bzw. aktualisiert ihn).
 *
 * Warum der Hinweis nötig ist: Die Organisationsseiten nennen fremde Namen
 * (THW, DLRG, Johanniter, Malteser, ASB, DRK, BBK, Bundeswehr, Feuerwehr) und
 * zeigen teilweise deren Logos. Urheberrechtlich sind diese Logos gemeinfrei,
 * markenrechtlich bleiben sie geschützt. Zulässig ist die Verwendung als
 * beschreibender Hinweis auf den Markeninhaber (§ 23 MarkenG), solange kein
 * Eindruck einer Geschäftsbeziehung entsteht — genau das stellt dieser Satz
 * klar. Er gehört deshalb auf jede Seite, nicht nur auf die mit Logo.
 *
 * Warum ein Skript statt von Hand pflegen: gleiche Prämisse wie bei
 * scripts/content-nav.mts — public/*.html sind eigenständige Dateien ohne
 * Templating, eine Textänderung würde sonst über 40 Handbearbeitungen
 * bedeuten. Das Skript injiziert einen markierten Block
 * (`<!-- HINWEIS:START -->` … `<!-- HINWEIS:END -->`) vor `</footer>` sowie
 * einen zugehörigen CSS-Block am Ende des Style-Tags; beim erneuten Lauf
 * werden bestehende Blöcke ersetzt, nicht verdoppelt.
 *
 * Aufruf (Node ≥ 22): npm run content-hinweis
 */

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const wurzel = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(wurzel, "public");

/** Seiten, die absichtlich KEINEN Hinweis bekommen. */
const AUSGENOMMEN = new Set(["404.html"]);

/**
 * Klassenname bewusst `marken-hinweis` und nicht `hinweis`: Letzteres ist auf
 * mehreren Seiten bereits als hervorgehobener Kasten belegt.
 */
const HINWEIS_HTML = `<!-- HINWEIS:START -->
      <p class="marken-hinweis">
        Der Einheiten-Erfassungsbogen ist ein unabhängiges, privates Projekt.
        Es besteht keine Zusammenarbeit mit den hier genannten Organisationen
        und Behörden und keine Unterstützung durch sie. Namen, Logos und Marken
        gehören ihren jeweiligen Inhabern und werden ausschließlich zur
        Bezeichnung der jeweiligen Organisation verwendet.
      </p>
      <!-- HINWEIS:END -->`;

/**
 * Farbe bewusst #5c6478 statt eines helleren Grautons: #777 erreicht auf dem
 * Seitengrund #f2f3f7 nur 4,04:1 und verfehlt damit WCAG AA (4,5:1) —
 * ausgerechnet beim rechtlichen Hinweis, der am ehesten lesbar sein muss.
 *
 * #5c6478 ist der Wert, den die App als `--text-2` für Zweittext führt, und
 * erreicht hier 5,39:1. Nicht `--text-3` (#6b7488): der ist gegen die weiße
 * Fläche `--flaeche` gerechnet (4,69:1) und fällt auf dem dunkleren Seitengrund
 * dieser Seiten auf 4,23:1 zurück — knapp unter AA. Die Fußzeile steht auf
 * `--grund`, nicht auf einer Karte.
 */
const HINWEIS_CSS = `/* HINWEIS:CSS:START */
    /* Grad aus der Leiter (--t-xs = 0.8125rem), nicht 0.78rem: content-stil.mts
       zieht jeden Zwischenwert ohnehin auf die nächste tragende Stufe. Stünde
       hier der Zwischenwert, machte ein Lauf dieses Skripts die Angleichung
       wieder rückgängig — die Generatoren müssen in beliebiger Reihenfolge
       laufen können. */
    /* max-width in ch, nicht in px: Der Hinweis lief über die volle
       Inhaltsspalte und kam bei diesem Grad auf rund 108 Zeichen je Zeile.
       Die Breite gehört hierher und nicht nach content-stil.mts — dieser
       Block wird bei jedem Lauf ersetzt, eine dort eingefügte Deklaration
       wäre nach dem nächsten Hinweis-Lauf wieder weg. */
    .marken-hinweis { margin: 1rem 0 0; max-width: 60ch; font-size: 0.8125rem; line-height: 1.45; color: #5c6478; }
    /* HINWEIS:CSS:END */`;

function inject(inhalt: string): string {
  let neu = inhalt;

  const blockMuster = /<!-- HINWEIS:START -->[\s\S]*?<!-- HINWEIS:END -->/;
  if (blockMuster.test(neu)) {
    neu = neu.replace(blockMuster, HINWEIS_HTML);
  } else {
    neu = neu.replace("</footer>", `  ${HINWEIS_HTML}\n    </footer>`);
  }

  const cssMuster = /\/\* HINWEIS:CSS:START \*\/[\s\S]*?\/\* HINWEIS:CSS:END \*\//;
  if (cssMuster.test(neu)) {
    neu = neu.replace(cssMuster, HINWEIS_CSS);
  } else {
    neu = neu.replace("  </style>", `${HINWEIS_CSS}\n  </style>`);
  }

  return neu;
}

function main(): void {
  const dateien = readdirSync(publicDir).filter(
    (d) => d.endsWith(".html") && !AUSGENOMMEN.has(d),
  );

  let geaendert = 0;
  for (const datei of dateien) {
    const pfad = join(publicDir, datei);
    const vorher = readFileSync(pfad, "utf8");
    if (!vorher.includes("</footer>")) {
      console.warn(`Übersprungen (kein <footer>): ${datei}`);
      continue;
    }
    const nachher = inject(vorher);
    if (nachher !== vorher) {
      writeFileSync(pfad, nachher, "utf8");
      geaendert++;
    }
  }
  console.log(`Markenhinweis aktualisiert: ${geaendert}/${dateien.length} Seiten.`);
}

main();
