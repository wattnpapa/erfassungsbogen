/**
 * Geräte-Schlüsselverwaltung für die Ed25519-Signatur (immer aktiv).
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

/** Geräteschlüssel verwerfen (neuer Schlüssel wird bei Bedarf neu erzeugt). */
export function geraeteSchluesselLoeschen(): void {
  speicher()?.removeItem(SCHLUESSEL_KEY);
}
