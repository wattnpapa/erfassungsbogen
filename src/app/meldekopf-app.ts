/**
 * Die Meldekopf-App: eigenes Produkt der Familie seit dem 2026-11-09 (Repo wattnpapa/meldekopf). Sie hat die
 * Einsatz-Sammlung dieser App übernommen — Sammeln, Lagemonitor, Sammel-PDF, Lageblatt, Weitermeldung.
 * Ein Link, keine Verbindung: Die App ruft dort nichts ab.
 */
export const MELDEKOPF_URL = "https://meldekopf.erfassungsbogen.app/";

/**
 * Rückweg „An Meldekopf geben“: derselbe signierte Bogen wie im Link „Link teilen“, nur mit der Adresse der
 * Meldekopf-App davor. Die nimmt das Fragment beim Öffnen auf und fragt, in welche Sammlung er gehört. Das
 * Fragment geht nicht an den Server.
 */
export function meldekopfLink(vollUrl: string): string {
  const raute = vollUrl.indexOf("#");
  return MELDEKOPF_URL + "#" + (raute >= 0 ? vollUrl.slice(raute + 1) : vollUrl);
}

/**
 * Rücksprung (`?rueck=meldekopf`): Die Meldekopf-App öffnet diese App aus ihrer Schnellerfassung, damit hier
 * der vollständige Bogen entsteht. Die Marke gilt für den Tab (sessionStorage, kein Inhalt außer „1“) und hebt
 * „An Meldekopf-App geben“ in der Übergabe an die erste Stelle. Aus der Adresse fällt sie gleich heraus, das
 * Fragment mit dem Bogen bleibt stehen.
 */
export const RUECK_PARAMETER = "rueck";
export const RUECK_MELDEKOPF = "meldekopf";
export const RUECK_SCHLUESSEL = "eeb.rueck.meldekopf";

export function rueckMarkeUebernehmen(): void {
  try {
    const adresse = new URL(window.location.href);
    if (adresse.searchParams.get(RUECK_PARAMETER) !== RUECK_MELDEKOPF) return;
    sessionStorage.setItem(RUECK_SCHLUESSEL, "1");
    adresse.searchParams.delete(RUECK_PARAMETER);
    window.history.replaceState(window.history.state, "", adresse.pathname + adresse.search + adresse.hash);
  } catch {
    /* ohne Sitzungsspeicher eben ohne Marke: der Weg steht trotzdem in der Übergabe */
  }
}

export function kamVomMeldekopf(): boolean {
  try {
    return sessionStorage.getItem(RUECK_SCHLUESSEL) === "1";
  } catch {
    return false;
  }
}
