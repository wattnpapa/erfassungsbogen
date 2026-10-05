/**
 * Schutz vor dem zweiten Tipp eines Doppeltipps an einer Stelle, an der
 * gerade etwas anderes erschienen ist.
 *
 * Mit Handschuh tippt man lieber zweimal, wenn man nicht sicher ist, ob der
 * erste Tipp ankam — und zwar bis zu einer Sekunde später. Nach „Abrücken"
 * lag dort aber „Wieder anwesend" (R2-G4 hatte den Gegenknopf eigens an
 * dieselbe Stelle gesetzt), oder die Quittungsleiste mit „Rückgängig" war
 * unter dem Finger aufgegangen. Beide sperrten nur 600 ms; ein zweiter Tipp
 * nach 700 oder 1 000 ms nahm das Abrücken still zurück (Audit Runde 3,
 * R3-S5, R3-G2). Jede Stelle einzeln länger zu sperren hätte auch den
 * bewussten Rückweg an anderer Stelle gebremst.
 *
 * Darum sperrt dieses Modul nicht Knöpfe, sondern den ORT: Nach einer
 * Handlung, die unter dem Finger etwas austauscht (`ortSperren`), nimmt die
 * App an dieser Bildschirmstelle für `ORTSSPERRE_MS` keinen Tipp an — gleich,
 * welcher Knopf dort inzwischen liegt. Ein Tipp daneben wirkt sofort.
 *
 * Tastatur-Klicks (`detail === 0`) und Klicks ohne Ort (Testumgebung ohne
 * Layout: 0/0) sperrt es nie.
 */

/**
 * So lange nimmt eine Karte nach „Abrücken"/„Wieder anwesend" keinen Tipp an.
 * Ein Doppeltipp mit Handschuh liegt bei 100–300 ms (Audit Runde 2, R2-G4);
 * wer bewusst zurücknehmen will, tippt nicht schneller als nach einer
 * halben Sekunde erneut.
 */
// Der Prüfstand (features/support/haken.ts) setzt ihn vor dem Laden auf 0 —
// Playwright tippt schneller nach, als es ein Finger je täte.
export const PRELLSCHUTZ_MS: number = (globalThis as { __EEB_PRELLSCHUTZ_MS?: number }).__EEB_PRELLSCHUTZ_MS ?? 600;

/**
 * Sperre einer Bildschirmstelle nach einem Austausch unter dem Finger. Der
 * zögernde zweite Tipp kam in den Messungen bis 1 000 ms nach dem ersten;
 * 1,5 s liegen deutlich darüber und bleiben kürzer als ein bewusster
 * Rückweg (Blick auf die Quittung, lesen, tippen). Mit abgeschaltetem
 * Prellschutz (Prüfstand) ebenfalls aus.
 */
export const ORTSSPERRE_MS: number =
  (globalThis as { __EEB_ORTSSPERRE_MS?: number }).__EEB_ORTSSPERRE_MS ?? (PRELLSCHUTZ_MS === 0 ? 0 : 1500);

/** Halbmesser der gesperrten Stelle: eine Fingerkuppe mit Handschuh samt Zittern. */
export const ORTSSPERRE_RADIUS_PX = 40;

/** Wie lange ein Tipp als „der Tipp eben" gilt, an dessen Ort gesperrt wird. */
const TIPP_FRISCH_MS = 1000;

interface Punkt {
  x: number;
  y: number;
  zeit: number;
}

let letzterTipp: Punkt | null = null;
let sperre: { x: number; y: number; bis: number } | null = null;

function mitOrt(e: MouseEvent): boolean {
  return e.detail > 0 && !(e.clientX === 0 && e.clientY === 0);
}

function klickPruefen(e: MouseEvent) {
  if (!mitOrt(e)) return;
  const jetzt = Date.now();
  if (sperre) {
    if (jetzt > sperre.bis) {
      sperre = null;
    } else if (Math.hypot(e.clientX - sperre.x, e.clientY - sperre.y) <= ORTSSPERRE_RADIUS_PX) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
  }
  letzterTipp = { x: e.clientX, y: e.clientY, zeit: jetzt };
}

let installiert = false;
/** Einmal je Seite: der Prüfer sitzt vor React (Fenster, Einfangphase). */
export function tippSchutzInstallieren(): void {
  if (installiert || typeof window === "undefined") return;
  installiert = true;
  window.addEventListener("click", klickPruefen, true);
}
tippSchutzInstallieren();

/**
 * Die Stelle des Tipps eben für `ms` sperren. Aufzurufen von einer Handlung,
 * nach der unter dem Finger etwas anderes liegt — auch nach einer Rückfrage:
 * dann gilt der Ort des bestätigenden Tipps.
 */
export function ortSperren(ms: number = ORTSSPERRE_MS): void {
  const t = letzterTipp;
  if (!t || ms <= 0 || Date.now() - t.zeit > TIPP_FRISCH_MS) return;
  const bis = Date.now() + ms;
  sperre = { x: t.x, y: t.y, bis: Math.max(bis, sperre?.bis ?? 0) };
}

/** Ort des letzten Tipps (Bildschirmkoordinaten), solange er frisch ist. */
export function letzterTippOrt(): { x: number; y: number } | null {
  const t = letzterTipp;
  if (!t || Date.now() - t.zeit > TIPP_FRISCH_MS) return null;
  return { x: t.x, y: t.y };
}

/** Nur für Tests: Zustand zurücksetzen. */
export function tippSchutzZuruecksetzen(): void {
  letzterTipp = null;
  sperre = null;
}
