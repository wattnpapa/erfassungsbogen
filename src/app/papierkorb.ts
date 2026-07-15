/**
 * Papierkorb für lokal gespeicherte Sammlungen (Vorlagen, Einsätze):
 * „Löschen" markiert nur (geloeschtAm) — der Eintrag bleibt 30 Tage
 * wiederherstellbar und wird erst danach beim Laden endgültig entfernt.
 * Schützt vor Fehltipps, gerade am geteilten Meldekopf-Tablet.
 * Reine Funktionen; die Speicher-Anbindung liegt bei vorlagen.ts/einsaetze.ts.
 */

/** Nach dieser Frist im Papierkorb wird ein Eintrag beim Laden endgültig entfernt. */
export const PAPIERKORB_FRIST_MS = 30 * 24 * 60 * 60 * 1000; // 30 Tage

export interface PapierkorbEintrag {
  /** Zeitpunkt des Löschens (Date.now()); fehlt = aktiv. */
  geloeschtAm?: number;
}

/** Aktive (nicht gelöschte) Einträge — das, was Listen normal anzeigen. */
export function aktive<T extends PapierkorbEintrag>(liste: T[]): T[] {
  return liste.filter((e) => e.geloeschtAm == null);
}

/** Einträge im Papierkorb, zuletzt gelöschte zuerst. */
export function imPapierkorb<T extends PapierkorbEintrag>(liste: T[]): T[] {
  return liste
    .filter((e) => e.geloeschtAm != null)
    .sort((a, b) => b.geloeschtAm! - a.geloeschtAm!);
}

/** Abgelaufene Papierkorb-Einträge endgültig entfernen (beim Laden angewandt). */
export function papierkorbBereinigt<T extends PapierkorbEintrag>(
  liste: T[],
  jetzt = Date.now(),
): { liste: T[]; entfernt: number } {
  const behalten = liste.filter(
    (e) => e.geloeschtAm == null || jetzt - e.geloeschtAm < PAPIERKORB_FRIST_MS,
  );
  return { liste: behalten, entfernt: liste.length - behalten.length };
}
