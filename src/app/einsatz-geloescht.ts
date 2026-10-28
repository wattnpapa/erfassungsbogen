/**
 * Einsatz löschen, während für ihn eine Erfassung angefangen ist (R12-S1).
 *
 * Löscht jemand den Einsatz im selben Fenster, galt dafür die Meldung „in einem anderen Fenster in den Papierkorb
 * gelegt", und die Ansicht sprang ins Aufnahmeformular. Jetzt nennt die Rückfrage die angefangene Erfassung, die
 * Ansicht bleibt auf der Startseite, und die Meldung sagt, was aus der Erfassung wird. Der Entwurf heißt überall
 * „Erfassung einer fremden Einheit" (so auch der Kasten der Startseite).
 */

/**
 * R21-A7: Die Zahlen in „Einsatz löschen?" (Einheiten) und „endgültig löschen" (Meldungen) wichen ohne Erklärung ab (7 und 8):
 * Jede geänderte Einheit trägt in der Historie ihre früheren Fassungen. Der Satz nennt beide Zahlen, wo sie sich unterscheiden.
 * `einheiten`: geltende Fassungen (die Karten der Liste), `meldungen`: alle Einträge samt Historie.
 */
export function loeschenUmfangText(einheiten: number, meldungen: number): string {
  const e = `${einheiten} Einheit${einheiten === 1 ? "" : "en"}`;
  if (meldungen === einheiten) return e;
  return `${e} (mit allen früheren Fassungen ${meldungen} Meldung${meldungen === 1 ? "" : "en"})`;
}

/** Zusatz der Rückfrage „Einsatz löschen?"; leer, wenn keine Erfassung für diesen Einsatz offen ist. */
export function loeschenErfassungSatz(erfassungName: string | undefined): string {
  if (!erfassungName) return "";
  return ` Die angefangene Erfassung einer fremden Einheit „${erfassungName}" bleibt als Entwurf auf der Startseite erhalten; sie lässt sich danach nur ablegen, wenn du den Einsatz aus dem Papierkorb zurückholst.`;
}

/** Meldung auf der Startseite nach dem eigenen Löschen. */
export function selbstGeloeschtMeldung(einsatzName: string, erfassungName: string): string {
  return `Einsatz „${einsatzName}" in den Papierkorb gelegt. Die angefangene Erfassung einer fremden Einheit „${erfassungName}" bleibt als Entwurf — oben auf der Startseite „Fortsetzen" oder „Verwerfen"; zum Ablegen vorher den Einsatz unter „Papierkorb Einsätze" zurückholen.`;
}
