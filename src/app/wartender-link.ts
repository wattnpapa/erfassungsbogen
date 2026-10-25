/**
 * Eine Meldung aus einem Link, auf die „Wohin damit?" noch wartet (Audit
 * Runde 5, R5-S6).
 *
 * Der Link wird aus der Adresszeile entfernt, sobald er gelesen ist (die Daten
 * sollen nicht im Verlauf hängen), und gespeichert wird die Meldung erst nach
 * der Wahl. Wurde die Seite in der Zwischenzeit neu geladen — auf dem Telefon
 * beendet das System einen Hintergrund-Tab oft von allein —, stand die
 * Startseite ohne Rückfrage und ohne Hinweis da, und die Meldung war weg.
 *
 * Darum liegt der Link bis zur Antwort im Sitzungsspeicher dieses Tabs
 * (`sessionStorage`): nicht in `localStorage`, nicht in der Datensicherung, weg
 * mit dem Schließen des Tabs. Nach dem Neuladen fragt die App erneut. Jede
 * Antwort — aufnehmen, öffnen, abbrechen — löscht ihn.
 */

const SCHLUESSEL = "eeb.wartet.fragment";

function sitzung(): Storage | null {
  try {
    return globalThis.sessionStorage ?? null;
  } catch {
    return null;
  }
}

/** Den Link merken, bis über ihn entschieden ist. */
export function wartendenLinkMerken(fragment: string): void {
  if (!fragment) return;
  try {
    sitzung()?.setItem(SCHLUESSEL, fragment);
  } catch {
    /* Sitzungsspeicher voll oder gesperrt — dann geht es wie bisher */
  }
}

/** Der noch nicht beantwortete Link dieser Sitzung, oder leer. */
export function wartendenLinkLesen(): string {
  try {
    return sitzung()?.getItem(SCHLUESSEL) ?? "";
  } catch {
    return "";
  }
}

/** Über den Link ist entschieden (oder er war gar nicht zu übernehmen). */
export function wartendenLinkErledigt(): void {
  try {
    sitzung()?.removeItem(SCHLUESSEL);
  } catch {
    /* nichts zu tun */
  }
}
