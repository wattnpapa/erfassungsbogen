/**
 * Reine Suchlogik des Beispielbögen-Dialogs (beispiele-dialog.tsx), getrennt,
 * damit sie ohne Oberfläche prüfbar ist (beispiele-suche.test.ts).
 */

/** Suchtext vereinheitlichen: klein, Umlaute ausgeschrieben, nur Buchstaben und Ziffern. */
const NORM_CACHE = new Map<string, string>();
export function suchNorm(t: string): string {
  let n = NORM_CACHE.get(t);
  if (n === undefined) {
    n = t
      .toLocaleLowerCase("de-DE")
      .replace(/ä/g, "ae")
      .replace(/ö/g, "oe")
      .replace(/ü/g, "ue")
      .replace(/ß/g, "ss")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
    NORM_CACHE.set(t, n);
  }
  return n;
}

export const woerterVon = (t: string): string[] => suchNorm(t).split(" ").filter(Boolean);

/**
 * Wie gut passen die Suchwörter? Jedes Wort muss als Wortanfang vorkommen
 * („bergung" trifft „Bergungsgruppe", „aibling" aber nicht mehr „Waiblingen",
 * Prüfrunde Beispielbögen, Runde 2, BB2-W5). Ganzes Wort zählt 2,
 * Wortanfang 1; -1 heißt: passt nicht.
 */
export function treffer(such: string[], text: string[]): number {
  let punkte = 0;
  for (const w of such) {
    let best = 0;
    for (const t of text) {
      if (t === w) {
        best = 2;
        break;
      }
      if (best === 0 && t.startsWith(w)) best = 1;
    }
    if (best === 0) return -1;
    punkte += best;
  }
  return punkte;
}
