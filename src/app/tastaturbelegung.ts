/**
 * USB-Handscanner tippen den Code als Tastenfolge — sie senden Tastenpositionen,
 * keine Zeichen. Steht der Scanner werkseitig auf US-Belegung und der Rechner
 * auf Deutsch, kommt der Code deshalb verdreht an:
 *
 *     https://erfassungsbogen.app/#B.LMAD3A…
 *     httpsÖ--erfassungsbogen.app-§B.LMAD3A…
 *
 * Der Scan war dabei technisch fehlerfrei; nur die Zuordnung Taste→Zeichen ist
 * eine andere. Weil dieselbe Vertauschung immer gleich ausfällt, lässt sie
 * sich zurückrechnen — die App liest den Bogen dann, ohne dass jemand im Feld
 * erst das Handbuch des Scanners sucht.
 */

/**
 * Was eine US-Taste auf deutscher Belegung stattdessen schreibt. Nur die
 * Positionen, die sich unterscheiden — alles andere (Ziffern, die meisten
 * Buchstaben, „.“ und „,“) trifft auf beiden Belegungen dasselbe Zeichen.
 */
const US_NACH_DE: Record<string, string> = {
  // Buchstaben: nur Y und Z tauschen die Plätze (QWERTY ↔ QWERTZ).
  y: "z", z: "y", Y: "Z", Z: "Y",
  // Ungeschaltete Sondertasten.
  "-": "ß", "=": "´", "[": "ü", "]": "+", "\\": "#", ";": "ö", "'": "ä", "/": "-", "`": "^",
  // Mit Umschalttaste.
  "@": '"', "#": "§", "^": "&", "&": "/", "*": "(", "(": ")", ")": "=",
  _: "?", "+": "`", "{": "Ü", "}": "*", "|": "'", ":": "Ö", '"': "Ä", "<": ";", ">": ":", "?": "_", "~": "°",
};

/** Umkehrung: geschrieben (DE) → gemeint (US). */
const DE_NACH_US = new Map(Object.entries(US_NACH_DE).map(([us, de]) => [de, us] as const));

/**
 * Text, den ein auf US-Belegung eingestellter Scanner auf einem deutschen
 * Rechner hinterlassen hat, in den gemeinten Text zurückrechnen.
 *
 * Die Abbildung ist eineindeutig: Auf einen bereits richtigen Text angewandt,
 * macht sie ihn kaputt. Sie gehört deshalb ausschließlich hinter einen
 * gescheiterten Leseversuch — siehe {@link entwirreScanText}.
 */
export function usBelegungZurueck(text: string): string {
  let s = "";
  for (const zeichen of text) s += DE_NACH_US.get(zeichen) ?? zeichen;
  return s;
}

/**
 * Gescannten Text lesbar machen: unverändert lassen, wenn er schon trägt —
 * sonst die verdrehte Belegung zurückrechnen und das Ergebnis nur nehmen,
 * wenn es diesmal trägt. Alles andere bleibt, wie es kam, damit die
 * Fehlermeldung den tatsächlich empfangenen Text zeigen kann.
 */
export function entwirreScanText(text: string, lesbar: (t: string) => boolean): string {
  if (lesbar(text)) return text;
  const zurueck = usBelegungZurueck(text);
  return lesbar(zurueck) ? zurueck : text;
}
