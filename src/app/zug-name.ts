/**
 * Schreibweise der Zug-Zuordnung (Audit Runde 7, R7-K4): „1. Zug", „1.Zug" und
 * „1. zug" waren drei Züge mit je eigener Zwischensumme. Die Zuordnung gleicht
 * die Eingabe mit den schon vergebenen Zügen ab — ohne Rücksicht auf Groß- und
 * Kleinschreibung, Leerzeichen und Punkte — und übernimmt dann die vorhandene
 * Schreibweise. Neue Züge werden nur geglättet (Leerzeichen, Punkt nach der
 * führenden Zahl).
 */

/**
 * Nummernzug in beiden Wortstellungen („2. Zug", „2.Zug", „2 zug", „Zug 2",
 * „Zug2", „zug 2.") — Audit Runde 8, R8-N5: „Zug 2" und „2. Zug" sind derselbe
 * Zug und werden immer als „2. Zug" geführt.
 */
const NUMMERNZUG = /^(?:zug\s*\.?\s*(\d+)|(\d+)\s*\.?\s*zug)\.?$/i;

/** Vergleichsschlüssel: klein, ohne Leerzeichen und Punkte; „Zug 2" = „2. Zug". */
export function zugSchluessel(name: string): string {
  const t = name.trim().replace(/\s+/g, " ");
  const m = NUMMERNZUG.exec(t);
  const kanon = m ? `${m[1] ?? m[2]}. Zug` : t;
  return kanon.toLocaleLowerCase("de-DE").replace(/[\s.]+/g, "");
}

/** Geglättete Schreibweise eines neuen Zuges: „1.Zug" / „Zug 1" → „1. Zug". */
function geglaettet(name: string): string {
  const t = name.trim().replace(/\s+/g, " ");
  const m = NUMMERNZUG.exec(t);
  if (m) return `${m[1] ?? m[2]}. Zug`;
  return t.replace(/^(\d+)\.\s*(?=\S)/, "$1. ");
}

/**
 * Die Schreibweise, mit der `eingabe` gespeichert wird: die eines vorhandenen
 * Zuges mit gleichem Schlüssel (häufigste zuerst), sonst die geglättete Eingabe.
 * Leer bleibt leer.
 */
export function zugNormalisiert(eingabe: string, vorhandene: Iterable<string | undefined>): string {
  const t = geglaettet(eingabe);
  if (!t) return "";
  // Nummernzüge haben genau eine Schreibweise („2. Zug"), auch gegenüber älteren Beständen.
  if (NUMMERNZUG.test(t)) return t;
  const schl = zugSchluessel(t);
  const zaehler = new Map<string, number>();
  for (const v of vorhandene) {
    if (v && zugSchluessel(v) === schl) zaehler.set(v, (zaehler.get(v) ?? 0) + 1);
  }
  if (zaehler.size === 0) return t;
  return [...zaehler.entries()].sort((a, b) => b[1] - a[1])[0]![0];
}

/** Vorhandene Züge, einmal je Schreibweise, sortiert — Vorschlagsliste fürs Zugfeld. */
export function vorhandeneZuege(etiketten: Iterable<string | undefined>): string[] {
  const nach = new Map<string, string>();
  for (const e of etiketten) {
    if (!e) continue;
    const k = zugSchluessel(e);
    if (!nach.has(k)) nach.set(k, e);
  }
  return [...nach.values()].sort((a, b) => a.localeCompare(b, "de", { numeric: true }));
}
