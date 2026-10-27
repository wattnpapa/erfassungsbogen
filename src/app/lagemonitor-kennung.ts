/**
 * Adresse des Lagemonitors, klein gehalten: Der Start prüft sie sofort (main.tsx), der Monitor selbst (lagemonitor-ui.tsx) wird
 * erst nachgeladen, wenn die Adresse ihn verlangt — er gehört nicht ins Startbündel (ADR-003, Aufnahmeregel 5).
 */
export const URL_PARAMETER = "lagemonitor";

/** Kennung aus der Adresse, wenn die Seite als Lagemonitor aufgerufen wurde. */
export function lagemonitorKennung(suche: string = window.location.search): string | null {
  const id = new URLSearchParams(suche).get(URL_PARAMETER);
  return id ? id : null;
}
