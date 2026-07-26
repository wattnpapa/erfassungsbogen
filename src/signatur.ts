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
  MAX_STUFEN,
  PUBKEY_LAENGE,
  datenKodieren,
  dekodiereAbsenderkarte,
  encodeBinaer,
  entpackePayload,
  kodiereAbsenderkarte,
  packePayload,
  payloadAusText,
  signierteBytes,
  type Absenderkarte,
  type Kettenstufe,
  type Kompressor,
} from "./codec";

export type { Absenderkarte } from "./codec";

/** Ein lokal erzeugtes Geräte-Schlüsselpaar (rohe Ed25519-Bytes). */
export interface Schluesselpaar {
  /** 32-Byte-Seed (privater Schlüssel). Bleibt lokal, nie in QR/URL/Datei. */
  privat: Uint8Array;
  /** 32-Byte öffentlicher Schlüssel. */
  oeffentlich: Uint8Array;
}

/** Eine Stufe der Signaturkette (wer hat diesen Bogen wann gezeichnet). */
export interface Signaturstufe {
  zustand: "gueltig" | "ungueltig";
  pubkey: string;
  kurzform: string;
  /** Freiwillige Absenderangaben jener Stufe — nur bei „gueltig" verwertbar. */
  absender?: Absenderkarte;
}

/**
 * Ergebnis der Signaturprüfung beim Import — reiner Anzeigestatus.
 *
 * `absender` steht bewusst NUR am Zustand „gueltig": Die Karte ist zwar
 * mitsigniert, bei gebrochener Signatur wäre sie aber wertlos und dürfte nie
 * als Absenderangabe angezeigt werden.
 *
 * `pubkey`/`kurzform`/`absender` beschreiben immer die LETZTE Stufe, also wer den
 * Bogen gezeichnet und übergeben hat. `stufen` steht nur bei einem
 * weitergereichten Bogen: chronologisch vom Ursprung (Index 0) bis zu dieser
 * letzten Stufe.
 */
export type SignaturStatus =
  | { zustand: "unsigniert" }
  | {
      zustand: "gueltig";
      pubkey: string;
      kurzform: string;
      absender?: Absenderkarte;
      stufen?: Signaturstufe[];
    }
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

/** Karte ohne jeden gefüllten Wert zählt als „keine Karte" (Kartenlänge 0). */
function kartenBytes(karte?: Absenderkarte): Uint8Array | undefined {
  if (!karte || (!karte.name && !karte.email && !karte.telefon)) return undefined;
  return kodiereAbsenderkarte(karte);
}

/** Neue Stufe hinter `frueher` zeichnen — der gemeinsame Kern beider Signierwege. */
async function neueStufe(
  komprimiert: Uint8Array,
  privat: Uint8Array,
  karte: Uint8Array | undefined,
  frueher: Kettenstufe[],
): Promise<Kettenstufe> {
  const signatur = await ed.signAsync(signierteBytes(komprimiert, karte, frueher), privat);
  const pubkey = await ed.getPublicKeyAsync(privat);
  return { pubkey, signatur, ...(karte ? { karte } : {}) };
}

/**
 * Bogen → signierte Payload-Bytes ('EEB2C' mit einer Stufe: dem Ersteller).
 * Exportiert, damit der Aufrufer den Payload bei Bedarf segmentieren kann (die
 * Segment-Chunks setzen ihn 1:1 wieder zusammen — Signatur bleibt intakt).
 *
 * `karte` ist freiwillig; ohne sie steht in der Stufe nur die Kartenlänge 0.
 */
export async function signiertePayloadBytes(
  b: Erfassungsbogen,
  k: Kompressor,
  privat: Uint8Array,
  karte?: Absenderkarte,
): Promise<Uint8Array> {
  const komprimiert = k.deflateRaw(encodeBinaer(b));
  const stufe = await neueStufe(komprimiert, privat, kartenBytes(karte), []);
  return packePayload({ komprimiert, stufen: [stufe] });
}

/** Bogen → signierter QR-Inhalt als App-URL (Präfix + Base41('EEB2C'…)). */
export async function encodeSigniertPayloadUrl(
  b: Erfassungsbogen,
  k: Kompressor,
  privat: Uint8Array,
  karte?: Absenderkarte,
): Promise<string> {
  return EEB_URL_PREFIX + datenKodieren(await signiertePayloadBytes(b, k, privat, karte));
}

/**
 * Fremden Bogen unverändert weiterreichen: eine Stufe ANHÄNGEN statt neu zu
 * signieren. Der komprimierte Strom und alle bisherigen Stufen bleiben wörtlich
 * erhalten — damit bleibt beim nächsten Empfänger prüfbar, von wem der Bogen
 * ursprünglich kam und über wen er gelaufen ist.
 *
 * Wirft, wenn `herkunft` kein EEB2-Payload, selbst unsigniert oder die Kette
 * voll ist (dann gibt es keine Herkunft zu bezeugen bzw. keinen Platz — der
 * Aufrufer signiert regulär).
 */
export async function gegengezeichnetePayloadBytes(
  herkunft: Uint8Array,
  privat: Uint8Array,
  karte?: Absenderkarte,
): Promise<Uint8Array> {
  const { komprimiert, stufen } = entpackePayload(herkunft);
  if (stufen.length === 0) throw new Error("Empfangener Bogen ist unsigniert — nichts gegenzuzeichnen");
  if (stufen.length >= MAX_STUFEN) throw new Error(`Meldeweg hat schon ${MAX_STUFEN} Stufen`);
  const stufe = await neueStufe(komprimiert, privat, kartenBytes(karte), stufen);
  return packePayload({ komprimiert, stufen: [...stufen, stufe] });
}

/** Vorlage-Bogen → signierter QR-Inhalt als URL (Präfix + Marker „V." + Base41). */
export async function encodeSigniertVorlagePayloadUrl(
  b: Erfassungsbogen,
  k: Kompressor,
  privat: Uint8Array,
  karte?: Absenderkarte,
): Promise<string> {
  return (
    EEB_URL_PREFIX +
    EEB_VORLAGE_MARKER +
    datenKodieren(await signiertePayloadBytes(b, k, privat, karte))
  );
}

// ----------------------------------------------------------- Verifikation

/**
 * Rohe Kartenbytes → Absenderkarte. Eine defekte Karte darf die Prüfung nicht
 * kippen: dann gilt der Bogen als signiert, aber ohne Absenderangabe.
 */
function absenderVon(roh?: Uint8Array): Absenderkarte | undefined {
  if (!roh) return undefined;
  try {
    const karte = dekodiereAbsenderkarte(roh);
    return karte.name || karte.email || karte.telefon ? karte : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Eine Stufe prüfen. Signiert hat sie ihren Kartenblock, alle Stufen VOR ihr und
 * den komprimierten Strom — `frueher` muss also genau die Vorgängerstufen in
 * Container-Reihenfolge enthalten.
 */
async function pruefeStufe(
  komprimiert: Uint8Array,
  stufe: Kettenstufe,
  frueher: Kettenstufe[],
): Promise<Signaturstufe> {
  const anzeige = { pubkey: zuHex(stufe.pubkey), kurzform: schluesselKurzform(stufe.pubkey) };
  try {
    const daten = signierteBytes(komprimiert, stufe.karte, frueher);
    const ok = await ed.verifyAsync(stufe.signatur, daten, stufe.pubkey);
    if (!ok) return { zustand: "ungueltig", ...anzeige };
    return { zustand: "gueltig", ...anzeige, absender: absenderVon(stufe.karte) };
  } catch {
    // z. B. ungültiger Schlüsselpunkt → Signatur nicht verwertbar.
    return { zustand: "ungueltig", ...anzeige };
  }
}

/**
 * Signatur eines Payloads prüfen. Liefert nur einen Anzeigestatus und wirft
 * nie — ein defekter/fremder Payload gilt als „unsigniert" (der Import selbst
 * läuft über decodePayload und ist davon unabhängig).
 *
 * Bei mehreren Stufen wird der ganze Meldeweg geprüft. Maßgeblich für den
 * Gesamtzustand ist die LETZTE Stufe: sie belegt, was der Absender übergeben
 * hat, von dem dieser Bogen tatsächlich kam. Eine gebrochene frühere Stufe
 * entwertet sie nicht — dann ist nur der behauptete Ursprung nicht gedeckt.
 */
export async function signaturVonPayload(payload: Uint8Array): Promise<SignaturStatus> {
  let teile;
  try {
    teile = entpackePayload(payload);
  } catch {
    return { zustand: "unsigniert" };
  }
  if (teile.stufen.length === 0) return { zustand: "unsigniert" };
  if (teile.stufen.some((s) => s.pubkey.length !== PUBKEY_LAENGE)) return { zustand: "unsigniert" };

  const stufen: Signaturstufe[] = [];
  for (const [i, s] of teile.stufen.entries()) {
    stufen.push(await pruefeStufe(teile.komprimiert, s, teile.stufen.slice(0, i)));
  }
  const letzte = stufen[stufen.length - 1]!;
  if (letzte.zustand === "ungueltig") {
    return { zustand: "ungueltig", pubkey: letzte.pubkey, kurzform: letzte.kurzform };
  }
  return {
    zustand: "gueltig",
    pubkey: letzte.pubkey,
    kurzform: letzte.kurzform,
    absender: letzte.absender,
    ...(stufen.length > 1 ? { stufen } : {}),
  };
}

/**
 * Signaturstatus zu einem gescannten QR-Text/Link ermitteln. Verarbeitet die
 * volle URL, das nackte Fragment und einen etwaigen Vorlagen-Marker „V.".
 */
export async function signaturVonText(text: string): Promise<SignaturStatus> {
  const payload = payloadAusText(text);
  if (!payload) return { zustand: "unsigniert" };
  return signaturVonPayload(payload);
}

/**
 * Absenderkarte als eine Zeile („Max Mustermann · max@thw.de · 0170 …").
 * Leere Karte → leerer String.
 */
export function absenderLabel(karte?: Absenderkarte): string {
  if (!karte) return "";
  return [karte.name, karte.email, karte.telefon].filter(Boolean).join(" · ");
}

/**
 * Kurzlabel für die Anzeige aus einem Status („✓ signiert von …" etc.).
 * Bewusst der Schlüssel-Fingerabdruck, nicht der Name aus der Absenderkarte:
 * belegt ist der Schlüssel, der Name ist nur eine Eigenangabe (getrennt
 * ausgeben, siehe absenderLabel).
 */
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

/**
 * Signaturkette als Weg lesbar machen: „a1b2 … (Ursprung) → c3d4 … → e5f6 …".
 * Leer, wenn der Bogen direkt vom Ersteller kommt (keine Weiterleitung).
 */
export function kettenLabel(status: SignaturStatus): string {
  if (status.zustand !== "gueltig" || !status.stufen) return "";
  return status.stufen
    .map((s, i) => {
      const rolle = i === 0 ? " (Ursprung)" : "";
      const warnung = s.zustand === "ungueltig" ? " ⚠ nicht gedeckt" : "";
      return `${s.kurzform}${rolle}${warnung}`;
    })
    .join(" → ");
}

/** Trägt die Kette eine Stufe, deren Signatur nicht aufgeht? */
export function ketteVollstaendig(status: SignaturStatus): boolean {
  if (status.zustand !== "gueltig" || !status.stufen) return true;
  return status.stufen.every((s) => s.zustand === "gueltig");
}
