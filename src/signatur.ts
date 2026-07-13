/**
 * Optionale Ed25519-Signatur für Erfassungsbögen (Authentizität/Herkunft).
 * Spezifikation der Byte-Anordnung: docs/datenmodell.md („Optionale Signatur").
 *
 * Plattformneutral (wie codec.ts/model.ts): keine Node-/DOM-APIs außer der
 * überall verfügbaren SHA-512-Digest, die @noble/ed25519 intern nutzt. Bewusst
 * @noble/ed25519 statt WebCrypto-Ed25519: letzteres fehlt in Electron 35
 * (Chromium ~134) und älteren iOS/Android-WebViews — noble läuft einheitlich.
 *
 * Trust-Modell (siehe docs/datenmodell.md): TOFU-artig, keine PKI. „✓ signiert
 * von <Kurzform>" belegt Integrität + Herkunft (dieser Schlüssel), NICHT die
 * Zuordnung des Schlüssels zu einer Person/Dienststelle.
 *
 * Grundsatz: Verifikation blockiert den Import NIE — sie liefert nur einen
 * Anzeigestatus. Der private Schlüssel taucht ausschließlich lokal auf, nie in
 * QR/URL/Datei.
 */

import * as ed from "@noble/ed25519";
import type { Erfassungsbogen } from "./model";
import {
  EEB_URL_PREFIX,
  EEB_VORLAGE_MARKER,
  PUBKEY_LAENGE,
  base64UrlDekodieren,
  base64UrlKodieren,
  encodeBinaer,
  entpackePayload,
  fragmentInhalt,
  packePayload,
  type Kompressor,
} from "./codec";

/** Ein lokal erzeugtes Geräte-Schlüsselpaar (rohe Ed25519-Bytes). */
export interface Schluesselpaar {
  /** 32-Byte-Seed (privater Schlüssel). Bleibt lokal, nie in QR/URL/Datei. */
  privat: Uint8Array;
  /** 32-Byte öffentlicher Schlüssel. */
  oeffentlich: Uint8Array;
}

/** Ergebnis der Signaturprüfung beim Import — reiner Anzeigestatus. */
export type SignaturStatus =
  | { zustand: "unsigniert" }
  | { zustand: "gueltig"; pubkey: string; kurzform: string }
  | { zustand: "ungueltig"; pubkey: string; kurzform: string };

// --------------------------------------------------------------- Hex-Helfer

/** Bytes → Kleinbuchstaben-Hex (für Speicherung/Anzeige des Schlüssels). */
export function zuHex(daten: Uint8Array): string {
  let s = "";
  for (const b of daten) s += b.toString(16).padStart(2, "0");
  return s;
}

/** Hex → Bytes. Wirft bei ungültiger Länge/Zeichen. */
export function ausHex(hex: string): Uint8Array {
  const sauber = hex.trim().toLowerCase();
  if (sauber.length % 2 !== 0 || /[^0-9a-f]/.test(sauber)) {
    throw new Error("Ungültiger Hex-Schlüssel");
  }
  const bytes = new Uint8Array(sauber.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(sauber.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

/**
 * Kurzform des öffentlichen Schlüssels für die Anzeige („Fingerabdruck").
 * Erste 8 Bytes als Hex, in 2er-Gruppen — z. B. „a1b2 c3d4 e5f6 0708".
 * Reine Wiedererkennung, keine kryptografische Zusicherung.
 */
export function schluesselKurzform(pubkey: Uint8Array | string): string {
  const bytes = typeof pubkey === "string" ? ausHex(pubkey) : pubkey;
  const hex = zuHex(bytes.subarray(0, 8));
  return hex.replace(/(.{4})(?=.)/g, "$1 ").trim();
}

// ------------------------------------------------------- Schlüssel & Signatur

/** Neues Geräte-Schlüsselpaar erzeugen. */
export async function schluesselpaarErzeugen(): Promise<Schluesselpaar> {
  const privat = ed.utils.randomPrivateKey();
  const oeffentlich = await ed.getPublicKeyAsync(privat);
  return { privat, oeffentlich };
}

/** Öffentlichen Schlüssel aus einem privaten ableiten. */
export function oeffentlicherSchluessel(privat: Uint8Array): Promise<Uint8Array> {
  return ed.getPublicKeyAsync(privat);
}

// ------------------------------------------------------------ Signierter QR

/**
 * Bogen → signierte Payload-Bytes ('EEB2S'…). Exportiert, damit der Aufrufer den
 * Payload bei Bedarf segmentieren kann (die Segment-Chunks setzen ihn 1:1 wieder
 * zusammen — Signatur bleibt intakt).
 */
export async function signiertePayloadBytes(
  b: Erfassungsbogen,
  k: Kompressor,
  privat: Uint8Array,
): Promise<Uint8Array> {
  const komprimiert = k.deflateRaw(encodeBinaer(b));
  // Signiert wird GENAU der komprimierte Strom (nicht Magic/Schlüssel).
  const signatur = await ed.signAsync(komprimiert, privat);
  const pubkey = await ed.getPublicKeyAsync(privat);
  return packePayload({ komprimiert, signatur: { pubkey, signatur } });
}

/** Bogen → signierter QR-Inhalt als App-URL (Präfix + Base64url('EEB2S'…)). */
export async function encodeSigniertPayloadUrl(
  b: Erfassungsbogen,
  k: Kompressor,
  privat: Uint8Array,
): Promise<string> {
  return EEB_URL_PREFIX + base64UrlKodieren(await signiertePayloadBytes(b, k, privat));
}

/** Vorlage-Bogen → signierter QR-Inhalt als URL (Präfix + Marker „V." + Base64url). */
export async function encodeSigniertVorlagePayloadUrl(
  b: Erfassungsbogen,
  k: Kompressor,
  privat: Uint8Array,
): Promise<string> {
  return EEB_URL_PREFIX + EEB_VORLAGE_MARKER + base64UrlKodieren(await signiertePayloadBytes(b, k, privat));
}

// ----------------------------------------------------------- Verifikation

/**
 * Signatur eines Payloads prüfen. Liefert nur einen Anzeigestatus und wirft
 * nie — ein defekter/fremder Payload gilt als „unsigniert" (der Import selbst
 * läuft über decodePayload und ist davon unabhängig).
 */
export async function signaturVonPayload(payload: Uint8Array): Promise<SignaturStatus> {
  let teile;
  try {
    teile = entpackePayload(payload);
  } catch {
    return { zustand: "unsigniert" };
  }
  if (!teile.signatur) return { zustand: "unsigniert" };
  const { pubkey, signatur } = teile.signatur;
  if (pubkey.length !== PUBKEY_LAENGE) return { zustand: "unsigniert" };
  const hexPub = zuHex(pubkey);
  const kurz = schluesselKurzform(pubkey);
  try {
    const ok = await ed.verifyAsync(signatur, teile.komprimiert, pubkey);
    return ok
      ? { zustand: "gueltig", pubkey: hexPub, kurzform: kurz }
      : { zustand: "ungueltig", pubkey: hexPub, kurzform: kurz };
  } catch {
    // z. B. ungültiger Schlüsselpunkt → Signatur nicht verwertbar.
    return { zustand: "ungueltig", pubkey: hexPub, kurzform: kurz };
  }
}

/**
 * Signaturstatus zu einem gescannten QR-Text/Link ermitteln. Verarbeitet die
 * volle URL, das nackte Fragment und einen etwaigen Vorlagen-Marker „V.".
 */
export async function signaturVonText(text: string): Promise<SignaturStatus> {
  let daten = fragmentInhalt(text);
  if (daten.startsWith(EEB_VORLAGE_MARKER)) daten = daten.slice(EEB_VORLAGE_MARKER.length);
  let payload: Uint8Array;
  try {
    payload = base64UrlDekodieren(daten);
  } catch {
    return { zustand: "unsigniert" };
  }
  return signaturVonPayload(payload);
}

/** Kurzlabel für die Anzeige aus einem Status („✓ signiert von …" etc.). */
export function signaturLabel(status: SignaturStatus): string {
  switch (status.zustand) {
    case "gueltig":
      return `✓ signiert von ${status.kurzform}`;
    case "ungueltig":
      return "⚠ Signatur ungültig";
    case "unsigniert":
      return "nicht signiert";
  }
}
