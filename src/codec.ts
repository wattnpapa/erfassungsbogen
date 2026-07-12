/**
 * Binär-Codec für das QR-Payload-Format "EEB2" (siehe docs/datenmodell.md).
 *
 * Plattformneutral: keine Node-APIs. Die Deflate-Kompression wird injiziert
 * (Node: node:zlib, Browser/Mobile: z. B. pako oder CompressionStream),
 * damit Encoder und Decoder überall identisch laufen.
 *
 * Regeln:
 *  - Feste Feldreihenfolge, Optionals über Flag-Bits.
 *  - Varint (LE, Base 128) für Längen, Codes und Zahlen.
 *  - Strings: Varint-Länge + UTF-8.
 *  - VokabularWert: Varint-Code; 0 = Freitext folgt als String.
 *  - Telefonnummern: Varint-Ziffernanzahl + BCD (2 Ziffern/Byte).
 *  - EebDatum: uint16, EebZeitpunkt: uint32 (siehe model.ts).
 */

import type {
  Erfassungsbogen,
  Einheit,
  Einsatz,
  Fahrzeug,
  Funkrufname,
  HierarchieEbene,
  Kontakt,
  Person,
  Sofortbedarf,
  VokabularWert,
} from "./model";
import { Ernaehrung, KontaktArt, SCHEMA_VERSION } from "./model";

export const EEB_MAGIC = new Uint8Array([0x45, 0x45, 0x42, 0x32]); // "EEB2"

/** Injizierbare Kompression (roher Deflate-Strom, ohne zlib-Header). */
export type Kompressor = {
  deflateRaw(daten: Uint8Array): Uint8Array;
  inflateRaw(daten: Uint8Array): Uint8Array;
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

// ------------------------------------------------------------------- Writer

class Writer {
  private buf: number[] = [];

  u8(n: number): void {
    this.buf.push(n & 0xff);
  }
  u16(n: number): void {
    this.u8(n);
    this.u8(n >>> 8);
  }
  u32(n: number): void {
    this.u16(n);
    this.u16(Math.floor(n / 65536));
  }
  varint(n: number): void {
    if (n < 0 || !Number.isSafeInteger(n)) throw new Error(`varint: ungültig ${n}`);
    while (n > 0x7f) {
      this.u8((n & 0x7f) | 0x80);
      n = Math.floor(n / 128);
    }
    this.u8(n);
  }
  str(s: string): void {
    const b = textEncoder.encode(s);
    this.varint(b.length);
    for (const byte of b) this.buf.push(byte);
  }
  vokab(v: VokabularWert): void {
    if (v.code != null) {
      if (v.code === 0) throw new Error("Vokabular-Code 0 ist reserviert");
      this.varint(v.code);
    } else {
      this.varint(0);
      this.str(v.freitext ?? "");
    }
  }
  bcd(ziffern: string): void {
    if (!/^\d*$/.test(ziffern)) throw new Error(`Telefonnummer nicht numerisch: ${ziffern}`);
    this.varint(ziffern.length);
    for (let i = 0; i < ziffern.length; i += 2) {
      const hi = ziffern.charCodeAt(i) - 48;
      const lo = i + 1 < ziffern.length ? ziffern.charCodeAt(i + 1) - 48 : 0xf;
      this.u8((hi << 4) | lo);
    }
  }
  bytes(): Uint8Array {
    return Uint8Array.from(this.buf);
  }
}

// ------------------------------------------------------------------- Reader

class Reader {
  private pos = 0;
  constructor(private readonly buf: Uint8Array) {}

  u8(): number {
    const b = this.buf[this.pos++];
    if (b === undefined) throw new Error("EEB2: unerwartetes Datenende");
    return b;
  }
  u16(): number {
    return this.u8() | (this.u8() << 8);
  }
  u32(): number {
    return this.u16() + this.u16() * 65536;
  }
  varint(): number {
    let n = 0;
    let faktor = 1;
    for (;;) {
      const b = this.u8();
      n += (b & 0x7f) * faktor;
      if ((b & 0x80) === 0) return n;
      faktor *= 128;
    }
  }
  str(): string {
    const len = this.varint();
    const slice = this.buf.subarray(this.pos, this.pos + len);
    if (slice.length !== len) throw new Error("EEB2: unerwartetes Datenende (String)");
    this.pos += len;
    return textDecoder.decode(slice);
  }
  vokab(): VokabularWert {
    const code = this.varint();
    return code === 0 ? { freitext: this.str() } : { code };
  }
  bcd(): string {
    const len = this.varint();
    let s = "";
    for (let i = 0; i < Math.ceil(len / 2); i++) {
      const b = this.u8();
      s += String.fromCharCode(48 + (b >> 4));
      if (s.length < len) s += String.fromCharCode(48 + (b & 0xf));
    }
    return s;
  }
  get amEnde(): boolean {
    return this.pos >= this.buf.length;
  }
}

// ------------------------------------------------------------------ Encoder

function encodeKontakt(w: Writer, k: Kontakt): void {
  const istTemplate = k.art === KontaktArt.EMAIL && k.emailTemplate != null;
  w.u8(k.art | (k.dienstlich ? 4 : 0) | (istTemplate ? 8 : 0));
  if (istTemplate) w.u8(k.emailTemplate!);
  else if (k.art === KontaktArt.EMAIL) w.str(k.wert ?? "");
  else w.bcd(k.wert ?? "");
}

function encodePerson(w: Writer, p: Person): void {
  w.str(p.vorname);
  w.str(p.nachname);
  // 4 Bit Fahrerlaubnis + 2 Bit Geschlecht + 2 Bit Stärkerolle
  w.u8(p.fahrerlaubnis | (p.geschlecht << 4) | (p.staerkeRolle << 6));
  w.u8(p.ernaehrung); // eigenes Byte (Vorbyte voll); komprimiert sich als 0-Serie weg
  w.varint(p.funktionen.length);
  for (const f of p.funktionen) w.vokab(f);
  w.varint(p.kontakte.length);
  for (const k of p.kontakte) encodeKontakt(w, k);
  w.varint(p.zusatzqualifikationen.length);
  for (const q of p.zusatzqualifikationen) w.vokab(q);
}

function encodeFunkrufname(w: Writer, fr: Funkrufname): void {
  w.u8(fr.eigenerStandort ? 1 : 0);
  w.vokab(fr.kennwort);
  if (!fr.eigenerStandort) w.str(fr.ort ?? "");
  w.varint(fr.teile.length);
  for (const t of fr.teile) w.u8(t);
}

function encodeFahrzeug(w: Writer, f: Fahrzeug): void {
  const flags =
    (f.stanKonform != null ? 1 : 0) |
    (f.stanKonform ? 2 : 0) |
    (f.funkrufname ? 4 : 0) |
    (f.aenderungen ? 8 : 0) |
    (f.thwKennzeichen != null ? 16 : 0);
  w.u8(flags);
  w.vokab(f.typ);
  if (f.thwKennzeichen != null) w.varint(f.thwKennzeichen);
  else w.str(f.kennzeichenFreitext ?? "");
  if (f.funkrufname) encodeFunkrufname(w, f.funkrufname);
  if (f.aenderungen) w.str(f.aenderungen);
}

function encodeEinheit(w: Writer, e: Einheit): void {
  w.u8(e.organisation);
  w.u8((e.organisationName ? 1 : 0) | (e.standortRef != null ? 2 : 0));
  if (e.organisationName) w.str(e.organisationName);
  w.vokab(e.einheitsTyp);
  if (e.standortRef != null) {
    // Name, Hierarchie und Kontakte kommen beim Decodieren aus dem
    // mitgelieferten Standort-Verzeichnis (THW: OV-Nummer).
    w.varint(e.standortRef);
  } else {
    w.str(e.name);
    w.varint(e.hierarchie.length);
    for (const h of e.hierarchie) {
      w.u8((h.telefon ? 1 : 0) | (h.email ? 2 : 0) | (h.kurz ? 4 : 0));
      w.vokab(h.bezeichnung);
      w.str(h.name);
      if (h.telefon) w.bcd(h.telefon);
      if (h.email) w.str(h.email);
      if (h.kurz) w.str(h.kurz);
    }
  }
}

function encodeEinsatz(w: Writer, ez: Einsatz): void {
  w.u8((ez.einsatzbeginn != null ? 1 : 0) | (ez.einsatzende != null ? 2 : 0));
  w.u16(ez.zeitraumVon);
  w.u16(ez.zeitraumBis);
  w.str(ez.ortAuftrag);
  if (ez.einsatzbeginn != null) w.u32(ez.einsatzbeginn);
  if (ez.einsatzende != null) w.u32(ez.einsatzende);
}

function encodeSofortbedarf(w: Writer, s: Sofortbedarf): void {
  w.u8(s.verpflegungPersonen);
  w.varint(s.dieselLiter);
  w.varint(s.benzinLiter);
  w.varint(s.gemischLiter);
  w.u8((s.unterbringung ? 1 : 0) | (s.ruhezeitErforderlich ? 2 : 0));
}

/** Bogen → unkomprimierter Binärstrom. */
export function encodeBinaer(b: Erfassungsbogen): Uint8Array {
  const w = new Writer();
  w.varint(b.schemaVersion);
  w.u16(b.stand);
  encodeEinheit(w, b.einheit);
  encodeEinsatz(w, b.einsatz);

  w.u8(
    b.personalErfassung |
      (b.staerkeManuell ? 2 : 0) |
      (b.unterbringungManuell ? 4 : 0) |
      (b.verpflegungManuell ? 8 : 0),
  );
  if (b.staerkeManuell) {
    w.u8(b.staerkeManuell.fuehrer);
    w.u8(b.staerkeManuell.unterfuehrer);
    w.u8(b.staerkeManuell.mannschaft); // gesamt = Summe, wird nicht kodiert
  }
  if (b.unterbringungManuell) {
    w.u8(b.unterbringungManuell.m);
    w.u8(b.unterbringungManuell.w);
    w.u8(b.unterbringungManuell.d);
  }
  if (b.verpflegungManuell) {
    w.u8(b.verpflegungManuell.vegetarisch);
    w.u8(b.verpflegungManuell.vegan);
  }
  w.varint(b.personal.length);
  for (const p of b.personal) encodePerson(w, p);

  w.varint(b.fahrzeuge.length);
  for (const f of b.fahrzeuge) encodeFahrzeug(w, f);

  w.u8(b.sofortbedarf ? 1 : 0);
  if (b.sofortbedarf) encodeSofortbedarf(w, b.sofortbedarf);
  w.u8(b.sonstiges ? 1 : 0);
  if (b.sonstiges) w.str(b.sonstiges);
  return w.bytes();
}

// ------------------------------------------------------------------ Decoder

function decodeKontakt(r: Reader): Kontakt {
  const flags = r.u8();
  const art = (flags & 3) as KontaktArt;
  const k: Kontakt = { art, dienstlich: (flags & 4) !== 0 };
  if (flags & 8) k.emailTemplate = r.u8();
  else if (art === KontaktArt.EMAIL) k.wert = r.str();
  else k.wert = r.bcd();
  return k;
}

function decodePerson(r: Reader, version: number): Person {
  const vorname = r.str();
  const nachname = r.str();
  const flags = r.u8();
  const p: Person = {
    vorname,
    nachname,
    fahrerlaubnis: flags & 0x0f,
    geschlecht: (flags >> 4) & 3,
    staerkeRolle: (flags >> 6) & 3,
    // v2 kannte keine Ernährungsform → Default Fleisch (Migration).
    ernaehrung: version >= 3 ? r.u8() : Ernaehrung.FLEISCH,
    funktionen: [],
    kontakte: [],
    zusatzqualifikationen: [],
  };
  for (let i = r.varint(); i > 0; i--) p.funktionen.push(r.vokab());
  for (let i = r.varint(); i > 0; i--) p.kontakte.push(decodeKontakt(r));
  for (let i = r.varint(); i > 0; i--) p.zusatzqualifikationen.push(r.vokab());
  return p;
}

function decodeFunkrufname(r: Reader): Funkrufname {
  const eigenerStandort = r.u8() === 1;
  const kennwort = r.vokab();
  const fr: Funkrufname = { kennwort, eigenerStandort, teile: [] };
  if (!eigenerStandort) fr.ort = r.str();
  for (let i = r.varint(); i > 0; i--) fr.teile.push(r.u8());
  return fr;
}

function decodeFahrzeug(r: Reader): Fahrzeug {
  const flags = r.u8();
  const f: Fahrzeug = { typ: r.vokab() };
  if (flags & 16) f.thwKennzeichen = r.varint();
  else f.kennzeichenFreitext = r.str();
  if (flags & 4) f.funkrufname = decodeFunkrufname(r);
  if (flags & 1) f.stanKonform = (flags & 2) !== 0;
  if (flags & 8) f.aenderungen = r.str();
  return f;
}

function decodeEinheit(r: Reader): Einheit {
  const organisation = r.u8();
  const flags = r.u8();
  const organisationName = flags & 1 ? r.str() : undefined;
  const einheitsTyp = r.vokab();
  const e: Einheit = { organisation, einheitsTyp, name: "", hierarchie: [] };
  if (organisationName != null) e.organisationName = organisationName;
  if (flags & 2) {
    // Auflösung von Name/Hierarchie über das Standort-Verzeichnis ist
    // Aufgabe der App (Verzeichnis nicht Teil des Codecs).
    e.standortRef = r.varint();
  } else {
    e.name = r.str();
    for (let i = r.varint(); i > 0; i--) {
      const hflags = r.u8();
      const h: HierarchieEbene = { bezeichnung: r.vokab(), name: r.str() };
      if (hflags & 1) h.telefon = r.bcd();
      if (hflags & 2) h.email = r.str();
      if (hflags & 4) h.kurz = r.str();
      e.hierarchie.push(h);
    }
  }
  return e;
}

function decodeEinsatz(r: Reader): Einsatz {
  const flags = r.u8();
  const ez: Einsatz = { zeitraumVon: r.u16(), zeitraumBis: r.u16(), ortAuftrag: r.str() };
  if (flags & 1) ez.einsatzbeginn = r.u32();
  if (flags & 2) ez.einsatzende = r.u32();
  return ez;
}

/** Unkomprimierter Binärstrom → Bogen. */
export function decodeBinaer(daten: Uint8Array): Erfassungsbogen {
  const r = new Reader(daten);
  const schemaVersion = r.varint();
  // Abwärtskompatibel: ältere Schemata werden migriert (siehe unten), nicht abgelehnt.
  if (schemaVersion < 2 || schemaVersion > SCHEMA_VERSION) {
    throw new Error(`EEB2: nicht unterstützte Schema-Version ${schemaVersion}`);
  }
  const b: Erfassungsbogen = {
    schemaVersion,
    stand: r.u16(),
    einheit: decodeEinheit(r),
    einsatz: decodeEinsatz(r),
    personalErfassung: 0,
    personal: [],
    fahrzeuge: [],
  };
  const pflags = r.u8();
  b.personalErfassung = pflags & 1;
  if (pflags & 2) {
    const fuehrer = r.u8();
    const unterfuehrer = r.u8();
    const mannschaft = r.u8();
    b.staerkeManuell = { fuehrer, unterfuehrer, mannschaft, gesamt: fuehrer + unterfuehrer + mannschaft };
  }
  if (pflags & 4) b.unterbringungManuell = { m: r.u8(), w: r.u8(), d: r.u8() };
  if (pflags & 8) b.verpflegungManuell = { vegetarisch: r.u8(), vegan: r.u8() };
  for (let i = r.varint(); i > 0; i--) b.personal.push(decodePerson(r, schemaVersion));
  for (let i = r.varint(); i > 0; i--) b.fahrzeuge.push(decodeFahrzeug(r));
  if (r.u8() === 1) {
    const verpflegungPersonen = r.u8();
    // v2 speicherte die Aggregatzahl "davon vegetarisch" im Sofortbedarf;
    // ab v3 wird sie aus dem Personal abgeleitet.
    const davonVegetarisch = schemaVersion < 3 ? r.u8() : 0;
    b.sofortbedarf = {
      verpflegungPersonen,
      dieselLiter: r.varint(),
      benzinLiter: r.varint(),
      gemischLiter: r.varint(),
      unterbringung: false,
      ruhezeitErforderlich: false,
    };
    const sflags = r.u8();
    b.sofortbedarf.unterbringung = (sflags & 1) !== 0;
    b.sofortbedarf.ruhezeitErforderlich = (sflags & 2) !== 0;
    // Migration: alte Aggregatzahl als manuelle Verpflegungsangabe erhalten,
    // damit sie in Anzeige/PDF nicht verloren geht (Personal hat keine Ernährungsangabe).
    if (davonVegetarisch > 0 && !b.verpflegungManuell) {
      b.verpflegungManuell = { vegetarisch: davonVegetarisch, vegan: 0 };
    }
  }
  if (r.u8() === 1) b.sonstiges = r.str();
  if (!r.amEnde) throw new Error("EEB2: überschüssige Daten am Ende");
  b.schemaVersion = SCHEMA_VERSION; // nach Migration auf aktuelle Version heben
  return b;
}

// -------------------------------------------------------------- QR-Payload

/** Bogen → QR-Payload ('EEB2' + DeflateRaw(Binärstrom)). */
export function encodePayload(b: Erfassungsbogen, k: Kompressor): Uint8Array {
  const komprimiert = k.deflateRaw(encodeBinaer(b));
  const payload = new Uint8Array(EEB_MAGIC.length + komprimiert.length);
  payload.set(EEB_MAGIC);
  payload.set(komprimiert, EEB_MAGIC.length);
  return payload;
}

/** QR-Payload → Bogen. Wirft bei falschem Magic oder defekten Daten. */
export function decodePayload(payload: Uint8Array, k: Kompressor): Erfassungsbogen {
  if (payload.length < 5 || !EEB_MAGIC.every((byte, i) => payload[i] === byte)) {
    throw new Error("Kein EEB2-QR-Code");
  }
  return decodeBinaer(k.inflateRaw(payload.subarray(EEB_MAGIC.length)));
}

// ----------------------------------------------------------------- QR-URL

/**
 * URL-Präfix im QR-Code: Die native Kamera erkennt die URL und öffnet die
 * App (Universal Link) bzw. die Web-App. Die Daten stehen im Fragment (#),
 * werden also nie an einen Server übertragen.
 */
export const EEB_URL_PREFIX = "https://erfassungsbogen.app/#";

const B64URL = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const B64URL_REV = new Map([...B64URL].map((c, i) => [c, i] as const));

function base64UrlKodieren(daten: Uint8Array): string {
  let s = "";
  for (let i = 0; i < daten.length; i += 3) {
    const a = daten[i] ?? 0;
    const b = daten[i + 1];
    const c = daten[i + 2];
    s += B64URL.charAt(a >> 2) + B64URL.charAt(((a & 3) << 4) | ((b ?? 0) >> 4));
    if (b !== undefined) s += B64URL.charAt(((b & 15) << 2) | ((c ?? 0) >> 6));
    if (c !== undefined) s += B64URL.charAt(c & 63);
  }
  return s;
}

function base64UrlDekodieren(s: string): Uint8Array {
  const bytes: number[] = [];
  let puffer = 0;
  let bits = 0;
  for (const zeichen of s) {
    const wert = B64URL_REV.get(zeichen);
    if (wert === undefined) throw new Error("Kein EEB2-QR-Code (ungültige Zeichen)");
    puffer = (puffer << 6) | wert;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((puffer >> bits) & 0xff);
    }
  }
  return Uint8Array.from(bytes);
}

/** Datenteil hinter '#' aus voller URL, nacktem '#…'-Fragment oder rohem Payload. */
function fragmentInhalt(text: string): string {
  const daten = text.trim();
  const raute = daten.indexOf("#");
  return raute >= 0 ? daten.slice(raute + 1) : daten;
}

/** Bogen → QR-Inhalt als URL (Präfix + Base64url-Payload). */
export function encodePayloadUrl(b: Erfassungsbogen, k: Kompressor): string {
  return EEB_URL_PREFIX + base64UrlKodieren(encodePayload(b, k));
}

/**
 * Gescannter QR-Text bzw. App-Link → Bogen. Akzeptiert die volle URL
 * (Datenteil hinter '#') oder den nackten Base64url-Payload.
 */
export function decodePayloadUrl(text: string, k: Kompressor): Erfassungsbogen {
  return decodePayload(base64UrlDekodieren(fragmentInhalt(text)), k);
}

// ------------------------------------------------------------ Vorlagen-QR
//
// Eine geteilte Vorlage ist technisch derselbe Bogen (einsatzfrei). Damit der
// Scanner sie von einem Einsatzbogen unterscheidet, trägt ihr QR-Fragment den
// Marker "V." VOR dem Base64url-Payload. Alte QR-Codes haben keinen Marker und
// werden weiter als Einsatzbogen gelesen — abwärtskompatibel, ohne Eingriff ins
// Binärformat. Das '.' liegt außerhalb des Base64url-Alphabets, kann also nie
// Teil eines Payloads sein.

/** Marker im URL-Fragment, der eine geteilte Vorlage kennzeichnet. */
export const EEB_VORLAGE_MARKER = "V.";

/** true, wenn Text/Link eine geteilte Vorlage transportiert (Fragment beginnt mit "V."). */
export function istVorlageNutzlast(text: string): boolean {
  return fragmentInhalt(text).startsWith(EEB_VORLAGE_MARKER);
}

/** Vorlage-Bogen → QR-Inhalt als URL (Präfix + Marker + Base64url-Payload). */
export function encodeVorlagePayloadUrl(b: Erfassungsbogen, k: Kompressor): string {
  return EEB_URL_PREFIX + EEB_VORLAGE_MARKER + base64UrlKodieren(encodePayload(b, k));
}

/** Gescannter Vorlagen-QR bzw. -Link → Bogen (Marker "V." wird entfernt, falls vorhanden). */
export function decodeVorlagePayloadUrl(text: string, k: Kompressor): Erfassungsbogen {
  let daten = fragmentInhalt(text);
  if (daten.startsWith(EEB_VORLAGE_MARKER)) daten = daten.slice(EEB_VORLAGE_MARKER.length);
  return decodePayload(base64UrlDekodieren(daten), k);
}
