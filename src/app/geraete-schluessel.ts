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
} from "@bos/eeb-format/signatur";

const SCHLUESSEL_KEY = "eeb.geraeteschluessel.v1"; // privater Schlüssel (Hex)

function speicher(): Storage | null {
  try {
    return globalThis.localStorage ?? null; // z. B. Privatmodus/blockierter Speicher
  } catch {
    return null;
  }
}

/**
 * Schlüssel nur für diese Sitzung: Ließ sich der neu erzeugte Schlüssel nicht
 * speichern (Speicher voll oder gesperrt), signiert die App mit ihm weiter,
 * solange die Seite offen ist. Vorher scheiterten QR-Code und PDF mit
 * englischem Programmtext — gerade dann, wenn die App „jetzt PDF erzeugen"
 * empfahl (Audit Runde 3, R3-E1). Sobald wieder Platz ist, wird er gespeichert.
 */
let sitzungsSchluessel: Uint8Array | null = null;

function gespeicherterSchluessel(): Uint8Array | null {
  let hex: string | null | undefined;
  try {
    hex = speicher()?.getItem(SCHLUESSEL_KEY);
  } catch {
    return null;
  }
  if (!hex) return null;
  try {
    const bytes = ausHex(hex);
    return bytes.length === 32 ? bytes : null;
  } catch {
    return null; // beschädigter Eintrag → wie „kein Schlüssel"
  }
}

/** Privater Geräteschlüssel (32 Byte) oder null, wenn noch keiner erzeugt wurde. */
export function geraeteSchluesselPrivat(): Uint8Array | null {
  return gespeicherterSchluessel() ?? sitzungsSchluessel;
}

/**
 * Gilt der Geräteschlüssel nur für diese Sitzung? Dann trägt jede Übergabe
 * ein Siegel, das die Gegenstelle später keinem gespeicherten Gerät
 * zuordnen kann — die Übersicht sagt das am Code.
 */
export function geraeteSchluesselNurSitzung(): boolean {
  return sitzungsSchluessel != null && gespeicherterSchluessel() == null;
}

function speichern(privat: Uint8Array): boolean {
  try {
    const s = speicher();
    if (!s) return false;
    s.setItem(SCHLUESSEL_KEY, zuHex(privat));
    return true;
  } catch {
    return false; // Speicher voll oder gesperrt
  }
}

/**
 * Privaten Geräteschlüssel zurückgeben; einmalig erzeugen und speichern, falls
 * nötig. Scheitert das Speichern, gilt der Schlüssel für diese Sitzung — die
 * Übergabe darf nie am Schlüssel scheitern.
 */
export async function geraeteSchluesselSicherstellen(): Promise<Uint8Array> {
  const vorhanden = gespeicherterSchluessel();
  if (vorhanden) return vorhanden;
  if (sitzungsSchluessel) {
    // Ist inzwischen Platz, wird der Sitzungsschlüssel zum Geräteschlüssel.
    if (speichern(sitzungsSchluessel)) sitzungsSchluessel = null;
    return gespeicherterSchluessel() ?? sitzungsSchluessel!;
  }
  const kp = await schluesselpaarErzeugen();
  if (!speichern(kp.privat)) sitzungsSchluessel = kp.privat;
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
  sitzungsSchluessel = null;
  speicher()?.removeItem(SCHLUESSEL_KEY);
}
