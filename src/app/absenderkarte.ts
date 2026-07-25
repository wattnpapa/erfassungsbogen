/**
 * Absenderkarte: freiwillige Kontaktangaben (Name, E-Mail, Telefon), die mit
 * der Ed25519-Signatur mitgereicht werden.
 *
 * Zweck (siehe docs/datenmodell.md, Trust-Modell): Der Schlüssel-Fingerabdruck
 * allein belegt nur „derselbe Absender wie beim letzten Mal". Wer freiwillig
 * seinen Namen und einen Rückkanal hinterlegt, macht daraus einen Absender, den
 * die Gegenstelle auch anrufen und damit außerhalb der App verifizieren kann.
 *
 * Die Karte gehört zum GERÄT (wie der Schlüssel), nicht zum Bogen: sie liegt im
 * localStorage, wandert über die Datensicherung (`eeb.`-Präfix) mit und wird
 * beim Signieren immer mitgesendet, sobald sie gefüllt ist. Freiwillig heißt
 * freiwillig — ist sie leer, sind Payloads byte-identisch zu vorher.
 */

import type { Absenderkarte } from "../signatur";

export type { Absenderkarte };

const KARTE_KEY = "eeb.absenderkarte.v1";

/**
 * Längenobergrenzen. Die Karte reist unkomprimiert im QR-Payload; großzügig
 * genug für reale Angaben, knapp genug fürs Größenbudget (siehe README).
 */
export const ABSENDER_MAX = { name: 40, email: 48, telefon: 24 } as const;

function speicher(): Storage | null {
  try {
    return globalThis.localStorage ?? null; // z. B. Privatmodus/blockierter Speicher
  } catch {
    return null;
  }
}

function feld(wert: unknown, max: number): string | undefined {
  if (typeof wert !== "string") return undefined;
  // Zeilenumbrüche/Steuerzeichen raus: die Karte ist eine einzeilige Angabe.
  const sauber = wert.replace(/[\r\n\t]+/g, " ").trim().slice(0, max);
  return sauber || undefined;
}

/** Karte auf gespeicherte Form bringen: getrimmt, gekürzt, leere Felder entfernt. */
export function normalisiereAbsenderkarte(karte: Absenderkarte): Absenderkarte {
  const k: Absenderkarte = {};
  const name = feld(karte.name, ABSENDER_MAX.name);
  const email = feld(karte.email, ABSENDER_MAX.email);
  const telefon = feld(karte.telefon, ABSENDER_MAX.telefon);
  if (name) k.name = name;
  if (email) k.email = email;
  if (telefon) k.telefon = telefon;
  return k;
}

/** Trägt die Karte überhaupt eine Angabe? */
export function absenderkarteGefuellt(karte: Absenderkarte): boolean {
  return Boolean(karte.name || karte.email || karte.telefon);
}

/** Gespeicherte Absenderkarte; leeres Objekt, wenn nichts hinterlegt ist. */
export function absenderkarteLaden(): Absenderkarte {
  const roh = speicher()?.getItem(KARTE_KEY);
  if (!roh) return {};
  try {
    return normalisiereAbsenderkarte(JSON.parse(roh) as Absenderkarte);
  } catch {
    return {}; // beschädigter Eintrag → wie „keine Karte"
  }
}

/**
 * Karte speichern (normalisiert) und die gespeicherte Form zurückgeben.
 * Eine vollständig leere Karte löscht den Eintrag.
 */
export function absenderkarteSpeichern(karte: Absenderkarte): Absenderkarte {
  const k = normalisiereAbsenderkarte(karte);
  if (!absenderkarteGefuellt(k)) {
    absenderkarteLoeschen();
    return {};
  }
  speicher()?.setItem(KARTE_KEY, JSON.stringify(k));
  return k;
}

/** Karte verwerfen — ab dann reisen die Bögen wieder ohne Absenderangabe. */
export function absenderkarteLoeschen(): void {
  speicher()?.removeItem(KARTE_KEY);
}

/**
 * Grobe Plausibilitätsprüfung für die UI (blockiert nichts). Rückgabe: Hinweis
 * oder leerer String. Bewusst nachsichtig — im Einsatz zählt „irgendwie
 * erreichbar" mehr als RFC-Konformität.
 */
export function absenderHinweis(karte: Absenderkarte): string {
  if (karte.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(karte.email)) {
    return "Die E-Mail-Adresse sieht unvollständig aus.";
  }
  if (karte.telefon && !/\d{3}/.test(karte.telefon)) {
    return "Die Telefonnummer sieht unvollständig aus.";
  }
  if (!karte.name && absenderkarteGefuellt(karte)) {
    return "Ohne Namen ist die Angabe für die Gegenstelle schwer einzuordnen.";
  }
  return "";
}
