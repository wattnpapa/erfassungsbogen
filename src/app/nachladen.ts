/**
 * Fehlertext für nachgeladene Bausteine.
 *
 * Große Teile der App liegen als eigene Chunks im Bundle und werden erst beim
 * ersten Klick geholt: der PDF-Satz (pdfmake samt Schriften, ~2 MB), der
 * Excel-Schreiber, der QR-Decoder. Klappt das nicht, meldet der Browser das
 * in seinen eigenen Worten und auf Englisch — Firefox etwa mit „error loading
 * dynamically imported module: https://…/assets/pdf-BjxkdKlJ.js". Für den
 * Helfer am Bereitstellungsraum ist das keine Auskunft, sondern ein Rätsel.
 *
 * Zwei Lagen führen dorthin, und beide haben denselben Ausweg:
 *   - Kein Netz, bevor der Service Worker die Seite übernommen hatte (er
 *     precacht zwar alles, greift beim allerersten Aufruf aber erst nach dem
 *     Übernehmen — siehe clientsClaim in vite.config.ts).
 *   - Eine neue Fassung ist ausgerollt, der offene Tab fragt noch nach den
 *     Dateinamen der alten; die gibt es auf dem Server nicht mehr.
 * Einmal mit Netz neu laden räumt beides ab.
 */

/**
 * Wortlaute der Browser, wenn ein dynamischer Import scheitert (Chrome,
 * Firefox, Safari) samt dem Vite-Preload-Helfer. Kleingeschrieben verglichen,
 * weil die Groß-/Kleinschreibung zwischen den Fassungen wechselt.
 */
const NACHLADE_MELDUNGEN = [
  "dynamically imported module", // Chrome: „Failed to fetch …", Firefox: „error loading …"
  "importing a module script failed", // Safari
  "unable to preload", // Vite-Preload-Helfer (CSS eines Chunks)
];

/** Ist der Fehler daran gescheitert, dass ein Baustein nicht geladen werden konnte? */
export function istNachladeFehler(fehler: unknown): boolean {
  const text = (fehler instanceof Error ? fehler.message : String(fehler)).toLowerCase();
  return NACHLADE_MELDUNGEN.some((m) => text.includes(m));
}

/**
 * Fehler in eine Zeile für die Oberfläche übersetzen. Die Aufrufstellen stellen
 * ihren eigenen Anlass voran („PDF: …"), hier steht nur der Grund.
 */
export function fehlerText(fehler: unknown): string {
  if (istNachladeFehler(fehler)) {
    return (
      "Der Baustein dafür ließ sich nicht nachladen. Dafür braucht die App einmal Netz — " +
      "mit Verbindung die Seite neu laden, danach steht er auch offline bereit."
    );
  }
  // Voller oder gesperrter Speicher: nie den englischen Browser-Text
  // („Failed to execute 'setItem' … exceeded the quota", Audit Runde 3, R3-E1).
  if (istSpeicherFehler(fehler)) {
    return (
      "Der Speicher dieses Geräts nimmt nichts mehr an (voll oder vom Browser gesperrt). " +
      "Platz schafft nur Löschen: nicht mehr benötigte Einsätze sichern, in den Papierkorb legen und den Papierkorb leeren."
    );
  }
  return fehler instanceof Error ? fehler.message : String(fehler);
}

function istSpeicherFehler(fehler: unknown): boolean {
  if (fehler == null || typeof fehler !== "object") return false;
  const { name = "", message = "", code } = fehler as { name?: string; message?: string; code?: number };
  return /quota/i.test(name) || /quota|exceeded/i.test(message) || code === 22;
}
