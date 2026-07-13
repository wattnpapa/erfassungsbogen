/**
 * Geräte-Schlüsselverwaltung für die optionale Ed25519-Signatur.
 *
 * Bewusst minimal (siehe docs/datenmodell.md, Trust-Modell): EIN lokal erzeugtes
 * Schlüsselpaar je Gerät. Der private Schlüssel liegt als Hex im localStorage und
 * verlässt das Gerät nie (nicht in QR/URL/Datei). Der öffentliche Schlüssel ist
 * anzeig- und exportierbar. Kein Server, keine Passphrase — das Schlüsselpaar
 * belegt Herkunft/Integrität, nicht Identität.
 */

import {
  ausHex,
  oeffentlicherSchluessel,
  schluesselKurzform,
  schluesselpaarErzeugen,
  zuHex,
} from "../signatur";

const SCHLUESSEL_KEY = "eeb.geraeteschluessel.v1"; // privater Schlüssel (Hex)
const SIGNIEREN_KEY = "eeb.signieren.v1"; // "1" = neue QR/Vorlagen signieren

function speicher(): Storage | null {
  try {
    return globalThis.localStorage ?? null; // z. B. Privatmodus/blockierter Speicher
  } catch {
    return null;
  }
}

/** Privater Geräteschlüssel (32 Byte) oder null, wenn noch keiner erzeugt wurde. */
export function geraeteSchluesselPrivat(): Uint8Array | null {
  const hex = speicher()?.getItem(SCHLUESSEL_KEY);
  if (!hex) return null;
  try {
    const bytes = ausHex(hex);
    return bytes.length === 32 ? bytes : null;
  } catch {
    return null; // beschädigter Eintrag → wie „kein Schlüssel"
  }
}

/** Privaten Geräteschlüssel zurückgeben; einmalig erzeugen und speichern, falls nötig. */
export async function geraeteSchluesselSicherstellen(): Promise<Uint8Array> {
  const vorhanden = geraeteSchluesselPrivat();
  if (vorhanden) return vorhanden;
  const kp = await schluesselpaarErzeugen();
  speicher()?.setItem(SCHLUESSEL_KEY, zuHex(kp.privat));
  return kp.privat;
}

/** Öffentlicher Geräteschlüssel als Hex, oder null wenn noch keiner existiert. */
export async function geraeteOeffentlichHex(): Promise<string | null> {
  const privat = geraeteSchluesselPrivat();
  if (!privat) return null;
  return zuHex(await oeffentlicherSchluessel(privat));
}

/** Kurzform (Fingerabdruck) des öffentlichen Geräteschlüssels für die Anzeige. */
export async function geraeteKurzform(): Promise<string | null> {
  const hex = await geraeteOeffentlichHex();
  return hex ? schluesselKurzform(hex) : null;
}

/** true, wenn neue QR-Codes/Vorlagen signiert werden sollen. */
export function signierenAktiv(): boolean {
  return speicher()?.getItem(SIGNIEREN_KEY) === "1";
}

/** Signieren an-/abschalten (Voreinstellung fürs Gerät). */
export function signierenSetzen(an: boolean): void {
  speicher()?.setItem(SIGNIEREN_KEY, an ? "1" : "0");
}

/** Geräteschlüssel verwerfen (neuer Schlüssel wird bei Bedarf neu erzeugt). */
export function geraeteSchluesselLoeschen(): void {
  speicher()?.removeItem(SCHLUESSEL_KEY);
}
