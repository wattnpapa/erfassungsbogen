/**
 * Eine Aktion, die Sekunden dauert — sperrt sich selbst gegen den zweiten
 * Tipp und sagt, dass sie läuft (Audit Runde 5, R5-O3, R5-H4, R5-L4).
 *
 * „Einsatz weitergeben / sichern" brauchte bei 30 Bögen 18 s ohne jede
 * Rückmeldung, der Knopf blieb frei, und ein zweiter Tipp erzeugte eine zweite
 * Datei gleichen Namens. Beim Blanko-Vordruck und Lageblatt war es dasselbe
 * (vier Sekunden und länger), beim Bogen-PDF stand „wird erstellt" nur, solange
 * die Oberfläche überhaupt neu zeichnen konnte. Eine gemeinsame Stelle für alle:
 *
 * - **Eine Sperre für alle PDF-Wege.** Es läuft höchstens eine dieser Aktionen,
 *   auch von verschiedenen Stellen der Oberfläche aus (Einsatzansicht, Startseite,
 *   Fußzeile): Die PDF-Erzeugung läuft im Hauptfaden, zwei gleichzeitig würden
 *   einander ausbremsen und zwei Dateien liefern.
 * - **Erst zeichnen, dann rechnen.** Vor der schweren Arbeit gibt die Aktion der
 *   Oberfläche ein Bild, damit „wird erzeugt…" schon steht, wenn der Hauptfaden
 *   für Sekunden blockiert ist.
 * - **Alle Knöpfe lesen denselben Zustand** ({@link useArbeitet}) und beschriften
 *   sich selbst; der Zustand ist der Name der laufenden Aktion.
 */
import { useSyncExternalStore } from "react";

let aktuell: string | null = null;
const hoerer = new Set<() => void>();

function melden(): void {
  for (const h of hoerer) h();
}

function abonnieren(h: () => void): () => void {
  hoerer.add(h);
  return () => hoerer.delete(h);
}

/** Name der gerade laufenden Aktion, sonst null. */
export function arbeitetGerade(): string | null {
  return aktuell;
}

/** Hook: Name der laufenden Aktion, sonst null — die Oberfläche zeichnet bei jedem Wechsel neu. */
export function useArbeitet(): string | null {
  return useSyncExternalStore(abonnieren, arbeitetGerade, arbeitetGerade);
}

/** Der Oberfläche ein Bild geben (Sperre sichtbar machen), bevor schwere Arbeit den Hauptfaden belegt. */
export function naechstesBild(): Promise<void> {
  return new Promise((fertig) => {
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(() => setTimeout(fertig, 0));
    else setTimeout(fertig, 0);
  });
}

/**
 * `aktion` unter dem Namen `was` ausführen, sofern gerade nichts anderes läuft.
 * Ein zweiter Aufruf in der Zeit tut nichts und meldet `lief: false`.
 */
export async function arbeiten<T>(was: string, aktion: () => Promise<T>): Promise<{ lief: true; wert: T } | { lief: false }> {
  if (aktuell !== null) return { lief: false };
  aktuell = was;
  melden();
  try {
    await naechstesBild();
    return { lief: true, wert: await aktion() };
  } finally {
    aktuell = null;
    melden();
  }
}

/** Nur für Tests. */
export function arbeitetZuruecksetzen(): void {
  aktuell = null;
  melden();
}
