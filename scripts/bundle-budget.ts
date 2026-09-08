/**
 * Bundle-Budget: misst den gebauten Stand byteweise und vergleicht ihn mit
 * `scripts/bundle-budget.json`.
 *
 * Hintergrund ist Aufnahmeregel 5 aus ADR-003: der geteilte Kern darf die PWA
 * nicht schwerer machen. Ohne feste Messung merkt das niemand — ein Submodul
 * zieht seine Abhängigkeiten still mit hinein, und der Zuwachs verteilt sich
 * über Wochen. Also wird gemessen, und zwar bei jedem Lauf.
 *
 * Gemessen wird JavaScript, nicht `dist/` insgesamt: die Inhaltsseiten unter
 * `public/` machen den Löwenanteil der Verzeichnisgröße aus und wachsen mit
 * jedem Text, ohne dass die App dadurch schwerer lädt. Zwei Zahlen halten das
 * Budget:
 *
 *   summeJs   — alle Bündel zusammen, also auch die nachgeladenen Brocken
 *               (PDF, Landesvorlagen). Fängt eine Abhängigkeit, die neu
 *               irgendwo hineingerät.
 *   startJs   — nur das Startbündel `index-*.js`. Fängt eine Abhängigkeit, die
 *               aus einem nachgeladenen Brocken in den Start rutscht — die
 *               teuerste Art von Zuwachs, weil sie jeden Aufruf verlangsamt.
 *
 * Die Gesamtgröße von `dist/` wird mitgeschrieben, aber nicht geprüft.
 *
 * Wächst etwas absichtlich, wird das Budget im selben Commit angehoben — mit
 * der Begründung in der Commit-Nachricht. Genau das ist der Zweck: der Zuwachs
 * soll eine Entscheidung sein, keine Nebenwirkung.
 *
 *     npm run bundle-budget            # prüfen (Rückgabewert ≠ 0 bei Verstoß)
 *     npm run bundle-budget -- --setze # gemessene Werte als neues Budget schreiben
 */

import { readFileSync, readdirSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const WURZEL = fileURLToPath(new URL("..", import.meta.url));
const DIST = join(WURZEL, "dist");
const BUDGET_DATEI = join(WURZEL, "scripts", "bundle-budget.json");

interface Budget {
  summeJs: number;
  startJs: number;
  /** Erlaubter Zuwachs in Prozent, damit ein Umsortieren des Bundlers nicht
   *  bei jeder Bibliotheks-Aktualisierung rot wird. */
  spielraumProzent: number;
}

interface Messung {
  summeJs: number;
  startJs: number;
  distGesamt: number;
}

function dateienRekursiv(verzeichnis: string): string[] {
  const treffer: string[] = [];
  for (const eintrag of readdirSync(verzeichnis, { withFileTypes: true })) {
    const pfad = join(verzeichnis, eintrag.name);
    if (eintrag.isDirectory()) treffer.push(...dateienRekursiv(pfad));
    else if (eintrag.isFile()) treffer.push(pfad);
  }
  return treffer;
}

export function messen(dist = DIST): Messung {
  const dateien = dateienRekursiv(dist);
  const groesse = (p: string) => statSync(p).size;
  const js = dateien.filter((p) => p.endsWith(".js"));
  const start = js.filter((p) => /(^|\/)index-[^/]+\.js$/.test(p));
  if (start.length !== 1) {
    throw new Error(
      `Erwartet genau ein Startbündel index-*.js, gefunden: ${start.length}. ` +
        "Hat sich der Name im Vite-Bau geändert? Dann diese Prüfung nachziehen.",
    );
  }
  return {
    summeJs: js.reduce((s, p) => s + groesse(p), 0),
    startJs: groesse(start[0]!),
    distGesamt: dateien.reduce((s, p) => s + groesse(p), 0),
  };
}

function zahl(n: number): string {
  return n.toLocaleString("de-DE");
}

function main(): void {
  const setzen = process.argv.includes("--setze");
  const messung = messen();

  if (setzen) {
    const bisher = JSON.parse(readFileSync(BUDGET_DATEI, "utf8")) as Budget;
    const neu: Budget = { ...bisher, summeJs: messung.summeJs, startJs: messung.startJs };
    writeFileSync(BUDGET_DATEI, `${JSON.stringify(neu, null, 2)}\n`);
    console.log(`Budget geschrieben: summeJs ${zahl(neu.summeJs)}, startJs ${zahl(neu.startJs)}.`);
    return;
  }

  const budget = JSON.parse(readFileSync(BUDGET_DATEI, "utf8")) as Budget;
  const faktor = 1 + budget.spielraumProzent / 100;
  const grenzen = { summeJs: Math.floor(budget.summeJs * faktor), startJs: Math.floor(budget.startJs * faktor) };

  console.log(`dist/ gesamt      ${zahl(messung.distGesamt)} Byte (nur zur Kenntnis)`);
  console.log(`JavaScript gesamt ${zahl(messung.summeJs)} Byte (Budget ${zahl(budget.summeJs)}, Grenze ${zahl(grenzen.summeJs)})`);
  console.log(`Startbündel       ${zahl(messung.startJs)} Byte (Budget ${zahl(budget.startJs)}, Grenze ${zahl(grenzen.startJs)})`);

  const verstoesse: string[] = [];
  if (messung.summeJs > grenzen.summeJs) {
    verstoesse.push(`JavaScript gesamt ${zahl(messung.summeJs)} > ${zahl(grenzen.summeJs)}`);
  }
  if (messung.startJs > grenzen.startJs) {
    verstoesse.push(`Startbündel ${zahl(messung.startJs)} > ${zahl(grenzen.startJs)}`);
  }
  if (verstoesse.length > 0) {
    console.error(`\nBundle-Budget überschritten (ADR-003, Aufnahmeregel 5):\n  ${verstoesse.join("\n  ")}`);
    console.error("\nIst der Zuwachs gewollt? Dann `npm run bundle-budget -- --setze` und die");
    console.error("Begründung in dieselbe Commit-Nachricht.");
    process.exitCode = 1;
  }
}

// Nur beim direkten Aufruf messen — Tests importieren `messen()` einzeln.
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) main();
