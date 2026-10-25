/**
 * Große Systemschrift erkennen (Audit Runde 5, R5-M3, R5-G6).
 *
 * Eine Medienabfrage sieht die Schrift der Seite nicht: `rem` in `@media`
 * bezieht sich auf die Grundeinstellung des Browsers, und `html { font-size }`
 * (Feld-Modus, die Nachstellung der Prüfer) bleibt ihr verborgen. Das
 * Stylesheet will aber wissen, ob die Schrift der Seite groß ist — dann
 * verdichtet sich die Erfassung am niedrigen Fenster (Kopf, Polster, Felder),
 * damit das erste Feld im ersten Bild steht. Darum steht auf <html> die Klasse
 * `schrift-gross`, solange die tatsächliche Grundschrift mindestens 22 px misst
 * (rund 137 % von 16 px; der Feld-Modus mit 112 % liegt darunter).
 */

/** Klasse auf <html>; index.html verdichtet damit bei niedrigem Fenster. */
export const SCHRIFT_GROSS_KLASSE = "schrift-gross";
/** Ab dieser Grundschrift (px) gilt sie als groß. */
export const SCHRIFT_GROSS_AB_PX = 22;

/** Gesetzt oder entfernt; gibt zurück, ob die Schrift groß ist. */
export function schriftStufeAnwenden(dok: Document = document, fenster: Window = window): boolean {
  const px = parseFloat(fenster.getComputedStyle(dok.documentElement).fontSize);
  const gross = Number.isFinite(px) && px >= SCHRIFT_GROSS_AB_PX;
  dok.documentElement.classList.toggle(SCHRIFT_GROSS_KLASSE, gross);
  return gross;
}

let gestartet = false;
/** Einmal je Seite: beim Laden und wenn sich das Fenster ändert (Drehen, Zoom, Anzeigemodus). */
export function schriftStufeStarten(): void {
  if (gestartet || typeof window === "undefined") return;
  gestartet = true;
  schriftStufeAnwenden();
  window.addEventListener("resize", () => schriftStufeAnwenden());
  // Ein Moduswechsel (Feld) und die Nachstellung der Prüfer ändern die Grundschrift ohne resize.
  window.addEventListener("eeb-anzeigemodus", () => schriftStufeAnwenden());
  window.addEventListener("load", () => schriftStufeAnwenden());
}
