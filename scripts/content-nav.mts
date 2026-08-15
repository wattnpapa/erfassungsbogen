/**
 * Fügt eine einheitliche Kopfnavigation in alle statischen Content-Seiten
 * unter public/ ein (bzw. aktualisiert sie, falls schon vorhanden).
 *
 * Warum ein Skript statt von Hand pflegen: public/*.html sind unabhängige,
 * eigenständige Dateien ohne Server-Side-Includes oder Build-Templating —
 * jede Seite trägt ihr eigenes <style> und <body>. Ohne dieses Skript müsste
 * jede neue Organisations- oder Länderseite die Navigation manuell abtippen,
 * und ein Nav-Änderung (neuer Link, neue Reihenfolge) 27 Handbearbeitungen
 * nach sich ziehen. Das Skript injiziert stattdessen einen markierten Block
 * (`<!-- NAV:START -->` … `<!-- NAV:END -->`) direkt nach `<body>` sowie einen
 * zugehörigen `<!-- NAV:CSS:START -->`-Block am Ende des Style-Tags — beim
 * erneuten Lauf werden bestehende Blöcke ersetzt, nicht verdoppelt.
 *
 * Aufruf (Node ≥ 22): npm run content-nav
 *
 * Bewusst ohne JavaScript zur Laufzeit: Die Seiten müssen offline und ohne
 * Skript funktionieren (gleiche Prämisse wie der Rest der App). Die Nav ist
 * eine reine Flexbox-Zeile, die bei schmaler Breite umbricht — kein
 * Hamburger-Menü, kein Toggle.
 */

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const wurzel = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(wurzel, "public");

/** Seiten, die absichtlich KEINE Kopfnavigation bekommen. */
const AUSGENOMMEN = new Set(["404.html"]);

/**
 * Nav-Einträge in Anzeige-Reihenfolge. `aktivWenn` bestimmt, für welche
 * Dateien der Link als aktuelle Seite hervorgehoben wird — bei
 * "katastrophenschutz" zählen auch alle Länder-Unterseiten dazu, damit die
 * Zugehörigkeit beim Klicken durch die 12 Länderseiten erkennbar bleibt.
 */
interface NavEintrag {
  href: string;
  label: string;
  aktivWenn: (datei: string) => boolean;
}

const NAV: NavEintrag[] = [
  { href: "./katastrophenschutz.html", label: "Katastrophenschutz", aktivWenn: (d) => d.startsWith("katastrophenschutz") },
  { href: "./thw.html", label: "THW", aktivWenn: (d) => d === "thw.html" },
  { href: "./feuerwehr.html", label: "Feuerwehr", aktivWenn: (d) => d === "feuerwehr.html" },
  { href: "./dlrg.html", label: "DLRG", aktivWenn: (d) => d === "dlrg.html" },
  { href: "./drk.html", label: "DRK", aktivWenn: (d) => d === "drk.html" },
  { href: "./johanniter.html", label: "Johanniter", aktivWenn: (d) => d === "johanniter.html" },
  { href: "./malteser.html", label: "Malteser", aktivWenn: (d) => d === "malteser.html" },
  { href: "./asb.html", label: "ASB", aktivWenn: (d) => d === "asb.html" },
  { href: "./bbk.html", label: "BBK", aktivWenn: (d) => d === "bbk.html" },
  { href: "./bundeswehr.html", label: "Bundeswehr", aktivWenn: (d) => d === "bundeswehr.html" },
  { href: "./meldekopf.html", label: "Meldekopf", aktivWenn: (d) => d === "meldekopf.html" },
  { href: "./anleitung.html", label: "Anleitung", aktivWenn: (d) => d === "anleitung.html" },
];

function navHtml(datei: string): string {
  const links = NAV.map((e) => {
    const klasse = e.aktivWenn(datei) ? ' class="aktiv"' : "";
    return `<a href="${e.href}"${klasse}>${e.label}</a>`;
  }).join("\n        ");
  return `<!-- NAV:START -->
  <header class="kopfnav">
    <div class="kopfnav-inner">
      <a href="./" class="kopfnav-logo">Erfassungsbogen</a>
      <nav class="kopfnav-links" aria-label="Hauptnavigation">
        ${links}
      </nav>
    </div>
  </header>
  <!-- NAV:END -->`;
}

const NAV_CSS = `/* NAV:CSS:START */
    .kopfnav { background: #fff; border-bottom: 1px solid var(--rand); }
    .kopfnav-inner { max-width: 60rem; margin: 0 auto; padding: 0.7rem 1rem; display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 1.2rem; }
    .kopfnav-logo { font-weight: 700; color: var(--blau); text-decoration: none; font-size: 0.95rem; margin-right: auto; }
    .kopfnav-links { display: flex; flex-wrap: wrap; gap: 0.3rem 0.9rem; }
    .kopfnav-links a { color: #444; text-decoration: none; font-size: 0.82rem; white-space: nowrap; }
    .kopfnav-links a:hover { color: var(--blau-hell); text-decoration: underline; }
    .kopfnav-links a.aktiv { color: var(--blau); font-weight: 600; }
    /* NAV:CSS:END */`;

function inject(inhalt: string, datei: string): string {
  let neu = inhalt;

  // Bestehenden Nav-Block ersetzen oder frisch nach <body> einfügen.
  const navBlockMuster = /<!-- NAV:START -->[\s\S]*?<!-- NAV:END -->/;
  if (navBlockMuster.test(neu)) {
    neu = neu.replace(navBlockMuster, navHtml(datei));
  } else {
    neu = neu.replace("<body>\n", `<body>\n  ${navHtml(datei)}\n\n`);
  }

  // Bestehenden CSS-Block ersetzen oder vor </style> einfügen.
  const cssBlockMuster = /\/\* NAV:CSS:START \*\/[\s\S]*?\/\* NAV:CSS:END \*\//;
  if (cssBlockMuster.test(neu)) {
    neu = neu.replace(cssBlockMuster, NAV_CSS);
  } else {
    neu = neu.replace("  </style>", `${NAV_CSS}\n  </style>`);
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
    const nachher = inject(vorher, datei);
    if (nachher !== vorher) {
      writeFileSync(pfad, nachher, "utf8");
      geaendert++;
    }
  }
  console.log(`Kopfnavigation aktualisiert: ${geaendert}/${dateien.length} Seiten.`);
}

main();
