/**
 * Gleichartige Fehler beim Einlesen mehrerer Dateien zu einer Meldung bündeln (R17-G13).
 *
 * Elf gleich defekte Dateien (etwa vom falschen Gerät) erzeugten elfmal denselben roten Absatz ohne Dateinamen, rund
 * 1 000 px hoch: Die Knöpfe darunter rutschten aus dem Bild, und nicht zu erkennen war, welche Datei es traf. Jetzt steht
 * jede Meldung einmal, mit der Zahl und den ersten Dateinamen, und alles über {@link MAX_ZEILEN} Zeilen hinaus wird
 * zusammengezählt.
 */

export interface DateiFehler {
  /** Dateiname. */
  datei: string;
  /** Satz zum Fehler, ohne oder mit dem Namen der Datei darin. */
  text: string;
  /** Der Satz nennt die Datei nicht selbst: bei einer einzelnen Datei steht „Name“: davor. */
  nameVorn?: boolean;
}

/** Höchstens so viele Zeilen stehen im roten Feld. */
export const MAX_ZEILEN = 5;

/** So viele Dateinamen nennt eine gebündelte Zeile, der Rest wird gezählt. */
const MAX_NAMEN = 3;

function dateiWort(n: number): string {
  return n === 1 ? "1 Datei" : `${n} Dateien`;
}

function namenListe(namen: string[]): string {
  const sichtbar = namen.slice(0, MAX_NAMEN).map((n) => `„${n}“`);
  const rest = namen.length - sichtbar.length;
  return rest > 0 ? `${sichtbar.join(", ")} und ${rest} weitere` : sichtbar.join(", ");
}

/** Die Zeilen des roten Felds: gleiche Sätze einmal, mit Zahl und Namen; nie mehr als {@link MAX_ZEILEN}. */
export function fehlerZeilenBuendeln(fehler: readonly DateiFehler[]): string[] {
  const gruppen = new Map<string, DateiFehler[]>();
  for (const f of fehler) gruppen.set(f.text, [...(gruppen.get(f.text) ?? []), f]);
  const zeilen: string[] = [];
  for (const [text, gruppe] of gruppen) {
    const erste = gruppe[0]!;
    if (gruppe.length === 1) {
      zeilen.push(erste.nameVorn ? `„${erste.datei}“: ${text}` : text);
      continue;
    }
    const namen = [...new Set(gruppe.map((f) => f.datei))];
    zeilen.push(
      erste.nameVorn
        ? `${namenListe(namen)} (${dateiWort(gruppe.length)}): ${text}`
        : `${text} Betroffen: ${dateiWort(gruppe.length)}, ${namenListe(namen)}.`,
    );
  }
  if (zeilen.length <= MAX_ZEILEN) return zeilen;
  const sichtbar = zeilen.slice(0, MAX_ZEILEN - 1);
  const rest = zeilen.length - sichtbar.length;
  return [...sichtbar, `Und ${rest} weitere Meldungen zu Dateien, die nicht übernommen wurden.`];
}
