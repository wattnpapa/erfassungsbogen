/**
 * Schonende Hülle um die Ablage der Einsatz-Sammlungen.
 *
 * Der Kern (`@bos/meldekopf/einsaetze`, Submodul, hier nicht änderbar) wendet
 * bei JEDEM Lesen Papierkorb-, Aufräum- und Datenschutzfrist an und schreibt
 * das Ergebnis zurück — auch wenn sich nichts geändert hat, weil
 * `fristBereinigt()` immer ein neues Array liefert. Eine Sammlung mit 5 Mio.
 * Zeichen wurde so beim Start 14-mal neu geschrieben (64 Mio. Zeichen), und
 * scheiterte das Zurückschreiben (Speicher gesperrt), blieb der Bildschirm
 * leer (Audit Runde 3, R3-O2).
 *
 * Diese Hülle sitzt zwischen Kern und `localStorage` (siehe
 * speicher-browser.ts) und tut zweierlei:
 *
 * 1. **Gleiches nicht schreiben:** Sie merkt sich je Schlüssel den zuletzt
 *    gelesenen oder geschriebenen Text. Soll genau dieser Text wieder
 *    geschrieben werden, entfällt der Schreibvorgang — der Speicher hält ihn
 *    ja schon. Ein fehlender Eintrag gilt dabei als leere Liste.
 * 2. **Lesen scheitert nicht am Schreiben:** Läuft ein reiner Lesezugriff
 *    (über {@link nurLesend}, siehe einsaetze-lesen.ts) und das
 *    Zurückschreiben einer Frist-Bereinigung scheitert, wird der Fehler
 *    gemerkt statt geworfen. Die Liste erscheint trotzdem — bereinigt, wie
 *    der Kern sie berechnet hat —, und die Oberfläche meldet den Speicher
 *    (`leseSchreibFehler`). Beim nächsten Lesen versucht der Kern es erneut.
 *    Schreibvorgänge einer Änderung (Abrücken, Ablegen, …) laufen nicht
 *    durch `nurLesend` und melden ihren Fehler wie bisher dort, wo gehandelt
 *    wurde.
 */

import type { Speicherhuelle } from "@bos/meldekopf/einsaetze";

interface Eingehaengt {
  innen: Speicherhuelle;
  bekannt: Map<string, string | null>;
  /** Wie oft der Kern über diese Hülle gelesen hat. */
  zugriffe: number;
}

/** Die zuletzt gebaute Hülle — die, die `speicherVerdrahten` dem Kern gibt. */
let eingehaengt: Eingehaengt | null = null;

let lesend = 0;
let leseFehler: unknown = null;

/** `fn` als reinen Lesezugriff ausführen: scheiterndes Zurückschreiben wirft nicht. */
export function nurLesend<T>(fn: () => T): T {
  lesend++;
  try {
    return fn();
  } finally {
    lesend--;
  }
}

/**
 * Der zuletzt beim bloßen Lesen verschluckte Schreibfehler, oder null.
 * Gelingt danach ein Schreibvorgang, ist er erledigt.
 */
export function leseSchreibFehler(): unknown {
  return leseFehler;
}

/** Nur für Tests. */
export function leseSchreibFehlerZuruecksetzen(): void {
  leseFehler = null;
}

/**
 * Hülle bauen. `leer` ist der Text einer leeren Ablage (beim Kern `"[]"`):
 * Steht unter dem Schlüssel nichts, gilt das Schreiben von `leer` als
 * unverändert — sonst schriebe ein frisches oder gesperrtes Gerät bei jedem
 * Lesen eine leere Liste.
 */
export function schonendeHuelle(innen: Speicherhuelle, leer = "[]"): Speicherhuelle {
  const bekannt = new Map<string, string | null>();
  const stand: Eingehaengt = { innen, bekannt, zugriffe: 0 };
  eingehaengt = stand;
  return {
    getItem(schluessel: string) {
      stand.zugriffe++;
      const text = innen.getItem(schluessel);
      bekannt.set(schluessel, text);
      return text;
    },
    setItem(schluessel: string, wert: string) {
      if (bekannt.has(schluessel)) {
        const alt = bekannt.get(schluessel);
        if (alt === wert || (alt == null && wert === leer)) return;
      }
      try {
        innen.setItem(schluessel, wert);
      } catch (e) {
        // Was jetzt im Speicher steht, ist unklar — beim nächsten Mal schreiben.
        bekannt.delete(schluessel);
        if (lesend > 0) {
          leseFehler = e;
          return;
        }
        throw e;
      }
      bekannt.set(schluessel, wert);
      leseFehler = null;
    },
  };
}

/**
 * Was gerade wirklich im Speicher steht — `undefined`, wenn keine schonende
 * Hülle eingehängt oder der Speicher nicht lesbar ist. Für den
 * Lese-Zwischenspeicher in einsaetze-lesen.ts.
 */
export function rohText(schluessel: string): string | null | undefined {
  if (!eingehaengt) return undefined;
  try {
    return eingehaengt.innen.getItem(schluessel);
  } catch {
    return undefined;
  }
}

/**
 * Der Text, den die Hülle zuletzt unter `schluessel` gelesen oder erfolgreich
 * geschrieben hat; `undefined`, wenn unbekannt (etwa nach einem gescheiterten
 * Schreibvorgang).
 */
export function bekannterText(schluessel: string): string | null | undefined {
  return eingehaengt?.bekannt.get(schluessel);
}

/** Zähler der Lesezugriffe über die eingehängte Hülle (−1 ohne Hülle). */
export function huellenZugriffe(): number {
  return eingehaengt ? eingehaengt.zugriffe : -1;
}
