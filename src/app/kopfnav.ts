/**
 * Die Kopfnavigation — die EINE Quelle für beide Welten der Domain.
 *
 * Bis hierher gab es die Leiste nur auf den statischen Seiten unter `public/`
 * (erzeugt von scripts/content-nav.mts). Die App selbst — also genau die
 * Adresse, auf der die meisten Besucher landen — hatte gar keine: Von jeder
 * Themenseite kam man mit einem Klick in die App, umgekehrt führte der einzige
 * Weg zur Anleitung durch die komplette Startseite bis in die Fußzeile.
 *
 * Damit die Leiste nicht zweimal existiert und auseinanderläuft, stehen die
 * Einträge hier einmal als Daten. Daraus entstehen drei Fassungen:
 *   - die Leiste der statischen Seiten (scripts/content-nav.mts),
 *   - der statische Block im Start-Gerüst von index.html, geschrieben von
 *     `node --import tsx scripts/kopfnav.mts`,
 *   - die React-Fassung auf der Startseite (`Kopfnav` in kopfnav-ui.tsx).
 * src/test/kopfnav.test.ts vergleicht index.html mit der Quelle und schlägt
 * fehl, sobald der Block veraltet ist.
 *
 * Die Leiste trägt bewusst NUR Wissen, keine App-Aktionen: „Neuen Bogen
 * erstellen", „QR-Code scannen…" und „Neuer Einsatz…" stehen als Weiche mitten
 * auf der Startseite (app.tsx). Dieselben Ziele oben noch einmal als Links
 * hieße zwei konkurrierende Bedienelemente für eine Handlung — und in den
 * Arbeitsansichten „Bogen erstellen" anzubieten, während ein Entwurf offen
 * ist, ist eine Rückfrage oder ein Datenverlust.
 */

/** Ein Unterpunkt im Aufklappmenü eines Eintrags. */
export interface NavUnterpunkt {
  href: string;
  label: string;
}

/**
 * Ein Eintrag der Kopfleiste. `aktivWenn` bestimmt, für welche Datei unter
 * `public/` der Link als aktuelle Seite hervorgehoben wird — bei
 * „Katastrophenschutz" zählen auch alle Länder-Unterseiten dazu, bei „THW" die
 * Fachgruppen-Seiten, damit die Zugehörigkeit beim Klicken in die Tiefe
 * erkennbar bleibt. In der App ist keine Seite aktiv: Die App ist das Ziel des
 * Logos, kein Eintrag der Leiste.
 */
export interface NavEintrag {
  href: string;
  label: string;
  aktivWenn: (datei: string) => boolean;
  /**
   * Unterpunkte, die als Aufklapp-Menü unter dem Eintrag erscheinen. Rein per
   * CSS (`:hover`/`:focus-within`) — kein Skript zur Laufzeit. Auf Geräten ohne
   * echten Zeiger bleibt das Menü zu; dort führt der Eintrag selbst auf die
   * Seite, die genau diese Unterpunkte auflistet.
   */
  unter?: NavUnterpunkt[];
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
  "autor.html",
  "impressum.html",
  "datenschutz.html",
]);

/** Die zwölf Länderseiten in der Reihenfolge der Übersicht. */
const LAENDER: NavUnterpunkt[] = [
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
 * Die vier Aufgaben der Anleitung als Unterpunkte — in der Reihenfolge, in der
 * sie im Einsatz aufeinander folgen: Die Einheit erstellt ihren Bogen, druckt
 * oder gibt ihn weiter, die Gegenstelle scannt ihn, der Meldekopf sammelt.
 * Dieselbe Reihenfolge steht auf anleitung.html; eine Leiste, die anders
 * sortiert als die Seite, auf die sie führt, kostet beim Ankommen Orientierung.
 */
export const ANLEITUNG_AUFGABEN: NavUnterpunkt[] = [
  { href: "./anleitung.html#bogen-erstellen", label: "Bogen erstellen" },
  { href: "./anleitung.html#bogen-drucken", label: "Bogen drucken" },
  { href: "./anleitung.html#bogen-scannen", label: "Bogen scannen" },
  { href: "./anleitung.html#bogensammlung-anlegen", label: "Bogensammlung anlegen" },
];

/**
 * „Alle Themen“ steht vorn: Es ist der Einstieg in den gesamten Textbereich,
 * und sein Menü führt die Seiten, die keinen eigenen Kopf-Eintrag haben.
 * „Anleitung“ steht am Ende — das HowTo ist der letzte Eintrag der Reihe und
 * damit auf jedem Gerät der am weitesten rechts stehende, gut auffindbare.
 */
export const NAV: NavEintrag[] = [
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
      { href: "./autor.html", label: "Über den Autor" },
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
  {
    href: "./anleitung.html",
    label: "Anleitung",
    aktivWenn: (d) => d === "anleitung.html",
    unter: ANLEITUNG_AUFGABEN,
  },
];

/**
 * Der Sammelweg auf schmalen Geräten: Was mobil nicht sichtbar bleibt, ist über
 * diesen einen Eintrag erreichbar — er führt auf das vollständige Verzeichnis.
 */
export const SAMMELWEG = "./uebersicht.html";

/**
 * Was auf schmalen Geräten sichtbar bleibt: „Alle Themen“ als Sammelweg und
 * der Eintrag der Rubrik, in der man gerade steht. Alles Übrige trägt
 * `nur-breit` (siehe NAV_CSS in scripts/content-nav.mts).
 *
 * Die App ist der Sonderfall: Dort ist keine Seite aktiv, aber die Anleitung
 * ist genau der Weg, für den die Leiste dort überhaupt gebaut wurde — sie
 * bleibt deshalb auch schmal sichtbar.
 */
function schmalSichtbar(eintrag: NavEintrag, datei: string, aktiv: boolean): boolean {
  if (aktiv || eintrag.href === SAMMELWEG) return true;
  return datei === "" && eintrag.href === "./anleitung.html";
}

/** Ein Eintrag, fertig entschieden: aktiv? mobil sichtbar? — für beide Fassungen. */
export interface NavStand {
  href: string;
  label: string;
  aktiv: boolean;
  nurBreit: boolean;
  unter?: NavUnterpunkt[];
  zweispaltig?: boolean;
}

/**
 * Die Leiste für eine Seite, mit allen Entscheidungen getroffen. HTML-Fassung
 * und React-Fassung lesen dieselbe Liste — sonst hätte „welcher Eintrag ist
 * aktiv, welcher bleibt schmal sichtbar?" zwei Antworten.
 */
export function kopfnavAufbau(datei: string): NavStand[] {
  return NAV.map((eintrag) => {
    const aktiv = eintrag.aktivWenn(datei);
    return {
      href: eintrag.href,
      label: eintrag.label,
      aktiv,
      nurBreit: !schmalSichtbar(eintrag, datei, aktiv),
      unter: eintrag.unter,
      zweispaltig: eintrag.zweispaltig,
    };
  });
}

/**
 * Die Hülle der Leiste. Auf den Textseiten ist sie der Seitenkopf und damit ein
 * `header`; in der App steht darunter schon der Kopfbalken mit dem Seitentitel
 * (`.seiten-kopf`). Zwei `header` nebeneinander wären zwei Banner-Landmarken
 * auf einer Seite — ein Screenreader kündigte denselben Seitenkopf zweimal an.
 * Dort trägt deshalb ein `div` die Leiste; die Navigation selbst ist ohnehin
 * das `nav` darin.
 */
export type NavHuelle = "header" | "div";

/**
 * Die Leiste als statisches HTML.
 *
 * `datei` ist der Dateiname der Seite unter `public/`, für die gesetzt wird
 * (etwa `"thw.html"`) — leer für die App, die keiner Rubrik angehört.
 * `einzug` ist die Einrückung des `<header>`; ohne sie hinge der Vergleich im
 * Test an der Formatierung der Zieldatei.
 */
export function kopfnavHtml(datei: string, einzug = "  ", huelle: NavHuelle = "header"): string {
  const e = einzug;
  const links = kopfnavAufbau(datei).map((eintrag) => {
    const klasse = eintrag.aktiv ? ' class="aktiv"' : "";
    const breit = eintrag.nurBreit ? " nur-breit" : "";
    if (!eintrag.unter) {
      // Ohne Aufklappmenü trägt der Link selbst die Klassen.
      const klassen = `${eintrag.aktiv ? "aktiv" : ""}${breit}`.trim();
      return `<a href="${eintrag.href}"${klassen ? ` class="${klassen}"` : ""}>${eintrag.label}</a>`;
    }
    const unterlinks = eintrag.unter
      .map((u) => `<a href="${u.href}"${u.href === `./${datei}` ? ' class="aktiv"' : ""}>${u.label}</a>`)
      .join(`\n${e}          `);
    const menuKlasse = eintrag.zweispaltig ? "kopfnav-unter kopfnav-unter-breit" : "kopfnav-unter";
    return `<span class="kopfnav-eintrag${breit}">
${e}        <a href="${eintrag.href}"${klasse}>${eintrag.label}</a>
${e}        <span class="${menuKlasse}">
${e}          ${unterlinks}
${e}        </span>
${e}      </span>`;
  }).join(`\n${e}      `);
  return `${e}<${huelle} class="kopfnav">
${e}  <div class="kopfnav-inner">
${e}    <a href="./" class="kopfnav-logo">Erfassungsbogen</a>
${e}    <nav class="kopfnav-links" aria-label="Hauptnavigation">
${e}      ${links}
${e}    </nav>
${e}  </div>
${e}</${huelle}>`;
}

/** Marken, zwischen denen der erzeugte Block in index.html steht. */
export const MARKE_ANFANG = "<!-- kopfnav:anfang (erzeugt aus src/app/kopfnav.ts — nicht von Hand ändern) -->";
export const MARKE_ENDE = "<!-- kopfnav:ende -->";
