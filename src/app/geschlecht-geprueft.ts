/**
 * Bestätigung „Geschlecht geprüft“ zum Hinweis, dass alle Personen auf der
 * Vorbelegung „männlich“ stehen.
 *
 * Der Hinweis ist berechtigt (die Vorbelegung sieht aus wie eine Angabe und
 * fließt in Unterbringung und WC/Dusche), aber bei einer Einheit, die wirklich
 * nur aus Männern besteht, ließ er sich nicht loswerden. Ein Merker im Bogen
 * würde das Transportformat ändern; darum merkt sich das Gerät die bestätigte
 * Besetzung als Prüfsumme über Namen und Geschlecht der Personen. Kommt eine
 * Person dazu, fällt eine weg oder ändert sich ein Name, passt die Prüfsumme
 * nicht mehr und der Hinweis steht wieder da. Gespeichert werden nur
 * Prüfsummen, keine Namen.
 */

import { useEffect, useState } from "react";
import type { Person } from "@bos/eeb-format/model";

export const GESCHLECHT_GEPRUEFT_SCHLUESSEL = "eeb.geschlecht-geprueft.v1";

/** Ereignis nach jeder Änderung — Schrittanzeige und Hinweise zeichnen neu. */
const EREIGNIS = "eeb-geschlecht-geprueft";

/** So viele Bestätigungen bleiben gemerkt; die ältesten fallen heraus. */
const HOECHSTENS = 50;

function lokalerSpeicher(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/** FNV-1a über Namen und Geschlecht in Listenreihenfolge. */
export function besetzungsPruefsumme(personal: readonly Person[]): string {
  const s = JSON.stringify(
    personal.map((p) => [p.vorname?.trim() ?? "", p.nachname?.trim() ?? "", p.geschlecht]),
  );
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `${personal.length}:${h.toString(16)}`;
}

function laden(speicher: Pick<Storage, "getItem"> | null): string[] {
  try {
    const roh = speicher?.getItem(GESCHLECHT_GEPRUEFT_SCHLUESSEL);
    const liste: unknown = roh ? JSON.parse(roh) : [];
    return Array.isArray(liste) ? liste.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Wurde genau diese Besetzung auf diesem Gerät als „Geschlecht geprüft“ bestätigt? */
export function geschlechtGeprueft(
  personal: readonly Person[],
  speicher: Pick<Storage, "getItem"> | null = lokalerSpeicher(),
): boolean {
  return laden(speicher).includes(besetzungsPruefsumme(personal));
}

/** Bestätigung setzen oder zurücknehmen. Gesperrter Speicher: still ohne Wirkung. */
export function geschlechtGeprueftSetzen(
  personal: readonly Person[],
  geprueft: boolean,
  speicher: Pick<Storage, "getItem" | "setItem"> | null = lokalerSpeicher(),
): void {
  if (!speicher) return;
  const summe = besetzungsPruefsumme(personal);
  const liste = laden(speicher).filter((x) => x !== summe);
  if (geprueft) liste.push(summe);
  try {
    speicher.setItem(GESCHLECHT_GEPRUEFT_SCHLUESSEL, JSON.stringify(liste.slice(-HOECHSTENS)));
  } catch {
    /* Speicher voll/gesperrt: der Hinweis bleibt dann eben stehen */
  }
  try {
    globalThis.dispatchEvent?.(new Event(EREIGNIS));
  } catch {
    /* ohne Fenster (Node): niemand zeichnet */
  }
}

/**
 * Zähler, der bei jeder Bestätigung steigt. Wer ihn liest, wird neu
 * gezeichnet — der Merker liegt im Gerät, nicht im Bogen, und eine Änderung
 * daran löst sonst kein Neuzeichnen aus. Auch das `storage`-Ereignis eines
 * anderen Fensters zählt.
 */
export function useGeschlechtGeprueftStand(): number {
  const [stand, setStand] = useState(0);
  useEffect(() => {
    const weiter = () => setStand((n) => n + 1);
    const ausSpeicher = (e: StorageEvent) => {
      if (e.key === GESCHLECHT_GEPRUEFT_SCHLUESSEL) weiter();
    };
    window.addEventListener(EREIGNIS, weiter);
    window.addEventListener("storage", ausSpeicher);
    return () => {
      window.removeEventListener(EREIGNIS, weiter);
      window.removeEventListener("storage", ausSpeicher);
    };
  }, []);
  return stand;
}
