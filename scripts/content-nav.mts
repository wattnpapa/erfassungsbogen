/**
 * Fügt eine einheitliche Kopf- und Fußnavigation in alle statischen
 * Content-Seiten unter public/ ein (bzw. aktualisiert sie, falls schon
 * vorhanden).
 *
 * Warum ein Skript statt von Hand pflegen: public/*.html sind unabhängige,
 * eigenständige Dateien ohne Server-Side-Includes oder Build-Templating —
 * jede Seite trägt ihr eigenes <style> und <body>. Ohne dieses Skript müsste
 * jede neue Organisations- oder Länderseite die Navigation manuell abtippen,
 * und ein Nav-Änderung (neuer Link, neue Reihenfolge) 33 Handbearbeitungen
 * nach sich ziehen. Das Skript injiziert stattdessen markierte Blöcke
 * (`<!-- NAV:START -->` … `<!-- NAV:END -->` nach `<body>`,
 * `<!-- FUSSNAV:START -->` … `<!-- FUSSNAV:END -->` im `<footer>`) sowie einen
 * zugehörigen `<!-- NAV:CSS:START -->`-Block am Ende des Style-Tags — beim
 * erneuten Lauf werden bestehende Blöcke ersetzt, nicht verdoppelt.
 *
 * Aufruf (Node ≥ 22): npm run content-nav
 *
 * Aufteilung zwischen den beiden Navigationen: Die Kopfzeile trägt nur die
 * sieben Einstiege, die auf jedem Handy in eine oder zwei Zeilen passen — mehr
 * Einträge sind keine Navigation mehr, sondern eine Linkwolke. Alles Weitere
 * hängt an uebersicht.html, dem einen vollständigen Verzeichnis; die Fußzeile
 * wiederholt die Hauptseiten, damit jede Seite von jeder anderen aus in
 * höchstens zwei Klicks erreichbar bleibt. Die Longtail-Seiten (12 Länder,
 * 3 THW-Fachgruppen) stehen bewusst nur auf der Übersicht und ihrer jeweiligen
 * Elternseite — sie in jede Fußzeile zu kippen, verwässert die interne
 * Verlinkung, statt sie zu stärken.
 *
 * Bewusst ohne JavaScript zur Laufzeit: Die Seiten müssen offline und ohne
 * Skript funktionieren (gleiche Prämisse wie der Rest der App). Die Nav ist
 * eine reine Flexbox-Zeile, die bei schmaler Breite umbricht — kein
 * Hamburger-Menü, kein Toggle. Die Aufklapp-Menüs der Einträge mit
 * Unterpunkten hängen ebenfalls nur an CSS (`:hover`, `:focus-within`).
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
 * "Katastrophenschutz" zählen auch alle Länder-Unterseiten dazu, bei "THW" die
 * Fachgruppen-Seiten, damit die Zugehörigkeit beim Klicken in die Tiefe
 * erkennbar bleibt.
 */
interface NavEintrag {
  href: string;
  label: string;
  aktivWenn: (datei: string) => boolean;
  /**
   * Unterpunkte, die als Aufklapp-Menü unter dem Eintrag erscheinen. Rein per
   * CSS (`:hover`/`:focus-within`) — kein Skript zur Laufzeit. Auf Geräten ohne
   * echten Zeiger bleibt das Menü zu; dort führt der Eintrag selbst auf die
   * Seite, die genau diese Unterpunkte auflistet.
   */
  unter?: { href: string; label: string }[];
  /** Menü zweispaltig setzen (nur sinnvoll bei sehr vielen Unterpunkten). */
  zweispaltig?: boolean;
}

/** Seiten, die auf der Übersicht unter „Hilfsorganisationen“ stehen. */
const HILFSORGANISATIONEN = new Set([
  "drk.html",
  "johanniter.html",
  "malteser.html",
  "asb.html",
  "dlrg.html",
]);

/**
 * Seiten ohne eigenen Kopf-Eintrag: Sie hängen an der Übersicht, und dort soll
 * die Markierung stehen, damit nie ein Eintrag als aktiv erscheint, der die
 * Seite gar nicht enthält.
 */
const UNTER_UEBERSICHT = new Set([
  "uebersicht.html",
  "vorlage.html",
  "papier-oder-digital.html",
  "open-source-datenschutz.html",
  "bbk.html",
  "bundeswehr.html",
  "impressum.html",
  "datenschutz.html",
]);

/** Die zwölf Länderseiten in der Reihenfolge der Übersicht. */
const LAENDER: { href: string; label: string }[] = [
  { href: "./katastrophenschutz-baden-wuerttemberg.html", label: "Baden-Württemberg" },
  { href: "./katastrophenschutz-bayern.html", label: "Bayern" },
  { href: "./katastrophenschutz-berlin.html", label: "Berlin" },
  { href: "./katastrophenschutz-brandenburg.html", label: "Brandenburg" },
  { href: "./katastrophenschutz-hessen.html", label: "Hessen" },
  { href: "./katastrophenschutz-mecklenburg-vorpommern.html", label: "Mecklenburg-Vorpommern" },
  { href: "./katastrophenschutz-niedersachsen.html", label: "Niedersachsen" },
  { href: "./katastrophenschutz-nordrhein-westfalen.html", label: "Nordrhein-Westfalen" },
  { href: "./katastrophenschutz-rheinland-pfalz.html", label: "Rheinland-Pfalz" },
  { href: "./katastrophenschutz-saarland.html", label: "Saarland" },
  { href: "./katastrophenschutz-sachsen.html", label: "Sachsen" },
  { href: "./katastrophenschutz-thueringen.html", label: "Thüringen" },
];

/**
 * „Alle Themen“ steht vorn: Es ist der Einstieg in den gesamten Textbereich,
 * und sein Menü führt die Seiten, die keinen eigenen Kopf-Eintrag haben.
 */
const NAV: NavEintrag[] = [
  {
    href: "./uebersicht.html",
    label: "Alle Themen",
    aktivWenn: (d) => UNTER_UEBERSICHT.has(d),
    unter: [
      { href: "./vorlage.html", label: "Vorlage und Blanko-PDF" },
      { href: "./papier-oder-digital.html", label: "Papier oder digital?" },
      { href: "./bbk.html", label: "BBK" },
      { href: "./bundeswehr.html", label: "Bundeswehr" },
      { href: "./open-source-datenschutz.html", label: "Open Source und Datenschutz" },
      { href: "./impressum.html", label: "Impressum" },
    ],
  },
  {
    href: "./katastrophenschutz.html",
    label: "Katastrophenschutz",
    aktivWenn: (d) => d.startsWith("katastrophenschutz"),
    unter: LAENDER,
    zweispaltig: true,
  },
  {
    href: "./thw.html",
    label: "THW",
    aktivWenn: (d) => d.startsWith("thw"),
    unter: [
      { href: "./thw-fachgruppe-raeumen-erfassungsbogen.html", label: "Fachgruppe Räumen" },
      { href: "./thw-fachgruppe-notversorgung-erfassungsbogen.html", label: "Fachgruppe Notversorgung" },
      { href: "./thw-fachgruppe-wasserschaden-pumpen-erfassungsbogen.html", label: "Fachgruppe Wasserschaden/Pumpen" },
    ],
  },
  {
    href: "./feuerwehr.html",
    label: "Feuerwehr",
    aktivWenn: (d) => d === "feuerwehr.html" || d === "staerkemeldung-feuerwehr.html",
    unter: [{ href: "./staerkemeldung-feuerwehr.html", label: "Stärkemeldung mit Beispiel" }],
  },
  // Es gibt keine eigene Seite „Hilfsorganisationen“; der Abschnitt der
  // Übersicht ist die ehrlichste Zieladresse — er listet genau die fünf Seiten,
  // die der Eintrag verspricht.
  {
    href: "./uebersicht.html#hilfsorganisationen",
    label: "Hilfsorganisationen",
    aktivWenn: (d) => HILFSORGANISATIONEN.has(d),
    unter: [
      { href: "./drk.html", label: "DRK" },
      { href: "./johanniter.html", label: "Johanniter" },
      { href: "./malteser.html", label: "Malteser" },
      { href: "./asb.html", label: "ASB" },
      { href: "./dlrg.html", label: "DLRG" },
    ],
  },
  { href: "./meldekopf.html", label: "Meldekopf", aktivWenn: (d) => d === "meldekopf.html" },
  { href: "./anleitung.html", label: "Anleitung", aktivWenn: (d) => d === "anleitung.html" },
];

/**
 * Fußzeilen-Links: die Hauptseiten aller Bereiche, damit von jeder Seite aus
 * jede andere in höchstens zwei Klicks erreichbar ist. „Zurück zur App“ steht
 * vorn, das Rechtliche hinten.
 */
const FUSSNAV: { href: string; label: string }[] = [
  { href: "./", label: "Zurück zur App" },
  { href: "./uebersicht.html", label: "Alle Themen" },
  { href: "./anleitung.html", label: "Anleitung" },
  { href: "./vorlage.html", label: "Vorlage und Blanko-PDF" },
  { href: "./meldekopf.html", label: "Meldekopf digital" },
  { href: "./katastrophenschutz.html", label: "Katastrophenschutz" },
  { href: "./thw.html", label: "THW" },
  { href: "./feuerwehr.html", label: "Feuerwehr" },
  { href: "./staerkemeldung-feuerwehr.html", label: "Stärkemeldung" },
  { href: "./drk.html", label: "DRK" },
  { href: "./johanniter.html", label: "Johanniter" },
  { href: "./malteser.html", label: "Malteser" },
  { href: "./asb.html", label: "ASB" },
  { href: "./dlrg.html", label: "DLRG" },
  { href: "./bbk.html", label: "BBK" },
  { href: "./bundeswehr.html", label: "Bundeswehr" },
  { href: "./papier-oder-digital.html", label: "Papier oder digital?" },
  { href: "./open-source-datenschutz.html", label: "Open Source und Datenschutz" },
  { href: "./datenschutz.html", label: "Datenschutz" },
  { href: "./impressum.html", label: "Impressum" },
];

function navHtml(datei: string): string {
  const links = NAV.map((e) => {
    const klasse = e.aktivWenn(datei) ? ' class="aktiv"' : "";
    const hauptlink = `<a href="${e.href}"${klasse}>${e.label}</a>`;
    if (!e.unter) return hauptlink;
    const unterlinks = e.unter
      .map((u) => {
        const uKlasse = u.href === `./${datei}` ? ' class="aktiv"' : "";
        return `<a href="${u.href}"${uKlasse}>${u.label}</a>`;
      })
      .join("\n            ");
    const menuKlasse = e.zweispaltig ? "kopfnav-unter kopfnav-unter-breit" : "kopfnav-unter";
    return `<span class="kopfnav-eintrag">
          ${hauptlink}
          <span class="${menuKlasse}">
            ${unterlinks}
          </span>
        </span>`;
  }).join("\n        ");
  return `<!-- NAV:START -->
  <a class="sprunglink" href="#inhalt">Zum Inhalt springen</a>
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

/**
 * Fußzeilen-Links als eine `·`-getrennte Zeile. Der Link auf die Seite selbst
 * fällt weg: Ein Verweis auf die gerade offene Seite ist für den Leser nutzlos
 * und für die interne Verlinkung wertlos.
 */
function fussNavHtml(datei: string): string {
  const links = FUSSNAV.filter((e) => e.href !== `./${datei}`)
    .map((e) => `<a href="${e.href}">${e.label}</a>`)
    .join("\n        ·\n        ");
  return `<!-- FUSSNAV:START -->
      <nav class="fussnav" aria-label="Weitere Seiten">
        ${links}
      </nav>
      <!-- FUSSNAV:END -->`;
}

const NAV_CSS = `/* NAV:CSS:START */
    /* Sprunglink: sitzt außerhalb des Sichtfelds und kommt beim ersten Tabstopp
       hervor. Ohne ihn tabbt man auf jeder Seite durch Logo und acht Nav-Einträge,
       bevor der Text beginnt (WCAG 2.4.1). Nicht mit display:none oder
       visibility:hidden verstecken — dann wäre er auch für die Tastatur weg. */
    .sprunglink { position: absolute; left: -9999px; top: 0; z-index: 40; padding: 0.6rem 1rem; background: var(--blau); color: #fff; text-decoration: none; font-weight: 600; }
    .sprunglink:focus { left: 0; }
    .kopfnav { background: #fff; border-bottom: 1px solid var(--rand); }
    /* Dieselbe Breite wie main: Ein 60rem breiter Kopf über einer 44rem breiten
       Textspalte setzt zwei verschiedene linke Kanten auf eine Seite, die sonst
       durchgehend linksbündig steht. */
    .kopfnav-inner { max-width: 44rem; margin: 0 auto; padding: 0.7rem 1rem; display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 1.2rem; }
    .kopfnav-logo { font-weight: 700; color: var(--blau); text-decoration: none; font-size: 0.95rem; margin-right: auto; }
    .kopfnav-links { display: flex; flex-wrap: wrap; align-items: center; gap: 0.3rem 0.9rem; }
    /* Senkrechtes Polster statt reiner Zeilenhöhe: Ohne es sind die Nav-Links
       19,7 px hoch und verfehlen die 24 px aus WCAG 2.5.8. Die Ausnahme für
       Links im Fließtext greift hier nicht — das ist eine Linkreihe, kein Satz.
       (Die punktgetrennte Fußnav ist ein Textblock und fällt unter die Ausnahme.) */
    .kopfnav-links a { display: inline-block; padding: 0.28rem 0; color: #444; text-decoration: none; font-size: 0.82rem; white-space: nowrap; }
    .kopfnav-links a:hover { color: var(--blau-hell); text-decoration: underline; }
    .kopfnav-links a.aktiv { color: var(--blau); font-weight: 600; }
    .kopfnav-eintrag { position: relative; display: inline-flex; }
    /* Rechteckig wie alles andere (Null-Radius-Regel). Der Schatten bleibt: Das
       Menü schwebt tatsächlich über dem Inhalt, und genau dafür lässt die
       Flach-im-Stand-Regel ihn zu — im Wert des dokumentierten Dropdown-Schattens. */
    .kopfnav-unter { position: absolute; top: 100%; left: -0.6rem; z-index: 30; display: none; grid-template-columns: 1fr; gap: 0.05rem; margin-top: 0.55rem; padding: 0.4rem; background: #fff; border: 1px solid var(--rand); border-radius: 0; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); }
    .kopfnav-unter-breit { grid-template-columns: 1fr 1fr; }
    .kopfnav-unter a { display: block; padding: 0.35rem 0.6rem; border-radius: 0; }
    .kopfnav-unter a:hover { background: var(--grau); text-decoration: none; }
    /* Der unsichtbare Streifen überbrückt den Abstand zwischen Eintrag und
       Menü — ohne ihn klappt das Menü beim Hinüberfahren wieder zu. */
    .kopfnav-unter::before { content: ""; position: absolute; left: 0; right: 0; top: -0.6rem; height: 0.6rem; }
    .kopfnav-eintrag:focus-within .kopfnav-unter { display: grid; }
    /* Nur mit echtem Zeiger aufklappen: Auf Touchgeräten würde der erste Tipp
       sonst das Menü öffnen, statt dem Link zu folgen. Dort führt der Eintrag
       auf die Seite, die dieselben Unterpunkte ohnehin auflistet. */
    @media (hover: hover) and (pointer: fine) {
      .kopfnav-eintrag:hover .kopfnav-unter { display: grid; }
    }
    .fussnav { display: inline; }
    .fussnav a { white-space: nowrap; }
    /* NAV:CSS:END */`;

/**
 * Inhalt der Fußzeile bis zum Markenhinweis bzw. `</footer>`. Group 1 ist das
 * öffnende `<footer>`-Tag, Group 2 der zu ersetzende Bereich, Group 3 das Ende.
 */
const FUSS_MUSTER = /(<footer[^>]*>)([\s\S]*?)\s*(<!-- HINWEIS:START -->|<\/footer>)/;

/**
 * Darf der bisherige Fußzeilen-Inhalt überschrieben werden?
 *
 * Historisch stand dort auf jeder Seite eine von Hand gepflegte Linkzeile —
 * genau die soll dieses Skript ablösen. Ein Fußbereich, der darüber hinaus Text
 * enthält, wäre dagegen echter Seiteninhalt; ihn wortlos zu löschen, wäre der
 * schlimmste Fehler, den dieses Skript machen kann. Darum wird nur ersetzt, was
 * nachweislich nur aus Links, Trennzeichen und dem eigenen Block besteht.
 */
function nurLinks(inhalt: string): boolean {
  const rest = inhalt
    .replace(/<!-- FUSSNAV:START -->[\s\S]*?<!-- FUSSNAV:END -->/g, "")
    .replace(/<nav[^>]*>|<\/nav>/g, "")
    .replace(/<a\s[^>]*>[\s\S]*?<\/a>/g, "")
    .replace(/·/g, "");
  return rest.trim() === "";
}

function inject(inhalt: string, datei: string): string {
  let neu = inhalt;

  // Bestehenden Nav-Block ersetzen oder frisch nach <body> einfügen.
  const navBlockMuster = /<!-- NAV:START -->[\s\S]*?<!-- NAV:END -->/;
  if (navBlockMuster.test(neu)) {
    neu = neu.replace(navBlockMuster, navHtml(datei));
  } else {
    neu = neu.replace("<body>\n", `<body>\n  ${navHtml(datei)}\n\n`);
  }

  // Sprungziel für den Sprunglink. Ohne id am <main> zeigt er ins Leere.
  if (!/<main[^>]*\bid="inhalt"/.test(neu)) {
    neu = neu.replace(/<main(\s|>)/, '<main id="inhalt"$1');
  }

  // Fußzeilen-Links ersetzen — aber nur, wenn dort nichts als Links steht.
  const treffer = neu.match(FUSS_MUSTER);
  if (!treffer) {
    console.warn(`Fußnavigation übersprungen (kein <footer>): ${datei}`);
  } else if (!nurLinks(treffer[2])) {
    console.warn(`Fußnavigation übersprungen (Fußzeile enthält eigenen Inhalt): ${datei}`);
  } else {
    neu = neu.replace(FUSS_MUSTER, `$1\n      ${fussNavHtml(datei)}\n      $3`);
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
