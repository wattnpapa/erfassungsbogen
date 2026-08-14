/**
 * Erzeugt die sitemap.xml für erfassungsbogen.app aus den vorhandenen Seiten
 * und der Git-Historie.
 *
 * Warum generiert statt von Hand gepflegt: `<lastmod>` ist ein Frische-Signal
 * für Suchmaschinen, und von Hand nachgezogen steht dort nach dem zweiten
 * Release ein Datum, das mit der Seite nichts mehr zu tun hat. Aus dem letzten
 * Commit, der die Datei angefasst hat, stimmt es dagegen immer — und niemand
 * muss daran denken. Dieselbe Überlegung wie beim `dateModified` der
 * strukturierten Daten (Plugin `bauStempel` in vite.config.ts).
 *
 * Eingebunden ist das Skript als Vite-Plugin (`sitemap()` in vite.config.ts),
 * es läuft also bei jedem `npm run build` und legt dist/sitemap.xml an. Zum
 * Ansehen auch direkt aufrufbar:
 *
 *   npm run sitemap              # schreibt dist/sitemap.xml
 *   npm run sitemap -- /tmp/s.xml
 *
 * Achtung im CI: Der Checkout braucht die volle Historie (`fetch-depth: 0`).
 * Ein flacher Klon liefert nicht etwa keine Daten, sondern für jede Seite
 * dasselbe — das Datum des einzigen Commits, den er kennt. Damit daraus kein
 * stilles Falschsignal wird, prüft `istFlacherKlon()` die Historie vorab und
 * lässt `<lastmod>` dann ganz weg (mit Warnung).
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** Ohne Schrägstrich am Ende: die Seiten werden mit `/` angehängt. */
const BASIS = "https://erfassungsbogen.app";

/**
 * Bekannte Seiten mit ihrem `priority`-Wert, in der Reihenfolge, in der sie in
 * der Sitemap stehen sollen (wichtigste zuerst). Der leere Schlüssel ist die
 * Startseite, also die App selbst — ihre Adresse ist die nackte Domain.
 *
 * Neue Seiten in public/ müssen hier nicht eingetragen werden; sie landen mit
 * STANDARD_PRIORITAET hinten in der Liste. Der Eintrag lohnt nur, wenn eine
 * Seite bewusst höher oder niedriger gewichtet werden soll.
 */
const SEITEN: Record<string, string> = {
  "": "1.0",
  "anleitung.html": "0.8",
  "vorlage.html": "0.8",
  "thw.html": "0.7",
  "feuerwehr.html": "0.7",
  "dlrg.html": "0.7",
  "drk.html": "0.7",
  "johanniter.html": "0.7",
  "malteser.html": "0.7",
  "asb.html": "0.7",
  "katastrophenschutz.html": "0.7",
  "katastrophenschutz-niedersachsen.html": "0.6",
  "katastrophenschutz-sachsen.html": "0.6",
  "katastrophenschutz-brandenburg.html": "0.6",
  "katastrophenschutz-thueringen.html": "0.6",
  "meldekopf.html": "0.7",
  "papier-oder-digital.html": "0.6",
  "impressum.html": "0.3",
  "datenschutz.html": "0.3",
};

/** Gewichtung für Seiten, die (noch) nicht in SEITEN stehen. */
const STANDARD_PRIORITAET = "0.7";

/**
 * Die Fehlerseite ist keine eigenständige Adresse: sie wird nirgends verlinkt
 * und soll auch nicht im Index landen.
 */
const AUSGENOMMEN = new Set(["404.html"]);

/** Ein Eintrag der Sitemap, in der Reihenfolge der Kindelemente von `<url>`. */
export interface SitemapEintrag {
  /** Absolute Adresse, identisch zum `rel="canonical"` der Seite. */
  loc: string;
  /** YYYY-MM-DD. Fehlt, wenn git zu der Seite keinen Commit kennt. */
  lastmod?: string;
  priority: string;
}

/**
 * Dateien, aus deren Historie sich das `lastmod` einer Seite ergibt.
 *
 * Die Startseite IST die App: sie ändert sich mit jedem Eingriff in src/, nicht
 * nur dann, wenn jemand die index.html selbst anfasst. Die Textseiten liegen
 * dagegen je als eine Datei in public/ und tragen ihr Datum allein.
 */
export function quellen(seite: string): string[] {
  return seite === "" ? ["index.html", "src"] : [`public/${seite}`];
}

/**
 * Stellt die Einträge der Sitemap zusammen: erst die bekannten Seiten in der
 * Reihenfolge von SEITEN, danach alphabetisch alles Neue aus public/.
 *
 * @param dateien Verzeichnisinhalt von public/ (nur die .html-Dateien zählen).
 * @param datum Liefert das lastmod zu den Quelldateien einer Seite.
 */
export function eintraegeSammeln(
  dateien: string[],
  datum: (quellen: string[]) => string | undefined,
): SitemapEintrag[] {
  const vorhanden = dateien.filter((d) => d.endsWith(".html") && !AUSGENOMMEN.has(d));
  const neu = vorhanden.filter((d) => !(d in SEITEN)).sort();
  // Die Startseite steckt nicht in public/ und ist immer dabei; eine gelöschte
  // Textseite fliegt dagegen aus der Sitemap, auch wenn sie hier noch steht.
  const bekannt = Object.keys(SEITEN).filter((s) => s === "" || vorhanden.includes(s));

  return [...bekannt, ...neu].map((seite) => ({
    loc: `${BASIS}/${seite}`,
    lastmod: datum(quellen(seite)),
    priority: SEITEN[seite] ?? STANDARD_PRIORITAET,
  }));
}

/**
 * Datum des letzten Commits, der eine der Dateien geändert hat (`%cs` ist das
 * Commit-Datum als YYYY-MM-DD, genau das von der Sitemap erwartete Format).
 *
 * Undefined, wenn git nichts findet — etwa bei einer noch nicht eingecheckten
 * Seite. Dann bleibt `<lastmod>` weg: kein Datum ist besser als ein erfundenes.
 */
export function letztesCommitDatum(pfade: string[], wurzel: string): string | undefined {
  let roh: string;
  try {
    roh = execFileSync("git", ["log", "-1", "--format=%cs", "--", ...pfade], {
      cwd: wurzel,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return undefined;
  }
  return /^\d{4}-\d{2}-\d{2}$/.test(roh) ? roh : undefined;
}

/** Nur `&` und `<` können in einer Adresse XML zerlegen — beides absichern. */
function xmlText(text: string): string {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;");
}

/** Schreibt die Einträge als Sitemap-0.9-Dokument. */
export function sitemapXml(eintraege: SitemapEintrag[]): string {
  const url = (e: SitemapEintrag) =>
    [
      "  <url>",
      `    <loc>${xmlText(e.loc)}</loc>`,
      // Reihenfolge der Kindelemente ist im Schema festgelegt: loc, lastmod, priority.
      ...(e.lastmod ? [`    <lastmod>${e.lastmod}</lastmod>`] : []),
      `    <priority>${e.priority}</priority>`,
      "  </url>",
    ].join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- GENERIERT von scripts/sitemap.ts — nicht von Hand ändern.
     Die App selbst ist eine einzige Seite mit Hash-Routing; als eigenständige
     Adressen gibt es nur sie und die statischen Textseiten aus public/.
     <lastmod> ist das Datum des letzten Commits, der die jeweilige Seite
     geändert hat (für die Startseite: index.html oder irgendetwas unter src/). -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${eintraege.map(url).join("\n")}
</urlset>
`;
}

/**
 * Ist die Historie abgeschnitten (`git clone --depth`, im CI der Standard-
 * Checkout)?
 *
 * Das ist die stille Falle: Am abgeschnittenen Ende steht ein Commit ohne
 * Vorgänger, und für git sieht dort alles so aus, als sei es mit diesem Commit
 * entstanden. Jede Seite, die länger nicht angefasst wurde, bekommt also sein
 * Datum. Es fehlt kein Datum — es stehen frisch aussehende und trotzdem falsche
 * da (beim Standard-Checkout mit Tiefe 1 für alle Seiten dasselbe). Darum wird
 * die Historie vorab geprüft und im Zweifel gar kein `<lastmod>` geschrieben.
 */
export function istFlacherKlon(wurzel: string): boolean {
  try {
    const roh = execFileSync("git", ["rev-parse", "--is-shallow-repository"], {
      cwd: wurzel,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return roh !== "false";
  } catch {
    // Kein Git-Verzeichnis (etwa ein entpackter Quell-Tarball): dann gibt es
    // ohnehin keine Daten, und die Warnung unten ist die richtige Antwort.
    return true;
  }
}

/**
 * Stellt die Einträge für die echten Seiten zusammen: liest public/ und holt die
 * Daten aus der Git-Historie.
 *
 * @param wurzel Projektwurzel — dort liegen public/ und das Git-Verzeichnis.
 *   Bewusst ein Argument und kein aus `import.meta.url` abgeleiteter Vorgabewert:
 *   das Vite-Plugin kennt die Wurzel ohnehin (`config.root`), und ein Modul ohne
 *   Pfad-Nebenwirkung beim Laden ist überall gleich einsetzbar.
 */
export function eintraegeErzeugen(wurzel: string): SitemapEintrag[] {
  const dateien = readdirSync(join(wurzel, "public"));
  if (istFlacherKlon(wurzel)) {
    console.warn(
      "sitemap.xml: flache Git-Historie — <lastmod> wird weggelassen." +
        " Für echte Daten braucht der Checkout fetch-depth: 0.",
    );
    return eintraegeSammeln(dateien, () => undefined);
  }
  return eintraegeSammeln(dateien, (pfade) => letztesCommitDatum(pfade, wurzel));
}

/** Liest public/ und die Git-Historie und liefert die fertige Sitemap. */
export function sitemapErzeugen(wurzel: string): string {
  return sitemapXml(eintraegeErzeugen(wurzel));
}

// Direkt aufgerufen (npm run sitemap): Datei schreiben. Als Modul importiert
// — vom Vite-Plugin und von den Tests — passiert hier nichts.
if (process.argv[1] && import.meta.filename === realpathSync(process.argv[1])) {
  const wurzel = fileURLToPath(new URL("..", import.meta.url));
  const ziel = process.argv[2] ?? join(wurzel, "dist", "sitemap.xml");
  const eintraege = eintraegeErzeugen(wurzel);
  mkdirSync(dirname(ziel), { recursive: true });
  writeFileSync(ziel, sitemapXml(eintraege), "utf8");
  const ohneDatum = eintraege.filter((e) => !e.lastmod).length;
  console.log(
    `${ziel}: ${eintraege.length} Adressen` +
      (ohneDatum ? `, davon ${ohneDatum} ohne lastmod` : ""),
  );
}
