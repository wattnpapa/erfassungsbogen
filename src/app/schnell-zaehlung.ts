/**
 * Zählung der Schnellerfassung (R20-A2, W3, H3, K4, N3): Es kommen vier Bildschirme
 * (Einheit, Personal, Fahrzeuge, Übersicht); Einsatz (2) und Sofortbedarf (5) entfallen.
 * Die Kopfzeile zählt nur diese vier und nennt die echten Schrittnamen, statt
 * „Schritt 3 von 6 · 2, 5 entfallen" zu zeigen.
 */

/** Indizes der Schritte (0-basiert), die in der Schnellerfassung vorkommen. */
export const SCHNELL_SCHRITTE: readonly number[] = [0, 2, 3, 5];

/**
 * Kopfzeile der Schnellerfassung. `namen` sind die sechs Schrittnamen des Assistenten.
 * Auf einem entfallenden Schritt (nur über die Reiter erreichbar) steht ein Satz
 * ohne Zahlenliste.
 */
export function schnellKopfzeile(schritt: number, namen: readonly string[]): string {
  const pos = SCHNELL_SCHRITTE.indexOf(schritt);
  if (pos < 0) return `${namen[schritt]} entfällt in der Schnellerfassung – weiter mit Personal`;
  return `Schritt ${pos + 1} von ${SCHNELL_SCHRITTE.length}: ${namen[schritt]}`;
}

/**
 * Nummer, die ein Schritt in der Schnellerfassung trägt (R21-A3, W3, E4, H3, G8, M3, L3, N2, O2, S2):
 * Überschrift, Reiter, Rücklink und Rückfrage zählen wie die Kopfzeile (1 Einheit, 2 Personal,
 * 3 Fahrzeuge, 4 Übersicht). Für einen entfallenden Schritt gibt es keine Nummer.
 */
export function schnellNummer(schritt: number): number | undefined {
  const pos = SCHNELL_SCHRITTE.indexOf(schritt);
  return pos < 0 ? undefined : pos + 1;
}
