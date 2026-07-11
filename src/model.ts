/**
 * Datenmodell Einheiten-Erfassungsbogen (EEB), Schema-Version 2.
 * Spezifikation: docs/datenmodell.md
 *
 * Organisationsübergreifend (BOS + Sonstige): THW, Feuerwehr, Polizei,
 * Hilfsorganisationen, DLRG, Bundeswehr, unbekannte Organisationen.
 *
 * Plattformneutral (keine Abhängigkeiten) — nutzbar in Electron,
 * React Native / Capacitor und Node.
 */

export const SCHEMA_VERSION = 2;

// ---------------------------------------------------------- Zeitrepräsentation
//
// Alle Zeitfelder werden einheitlich numerisch gespeichert und erst an der
// Anzeige-/PDF-Stelle formatiert. Bewusst KEIN Unix-Timestamp:
//  - Kalenderdaten als UTC-Zeitpunkt kippen je nach Zeitzone/Sommerzeit um
//    einen Tag; ein Tageszähler ist zeitzonenfrei und nur 2 Bytes groß.
//  - Für Zeitpunkte reicht Minutengenauigkeit; lokale Wandzeit entspricht dem,
//    was auf dem Papierbogen steht.

/** Kalendertag ohne Zeitzone: Tage seit 2020-01-01. Im QR: uint16 (reicht bis 2199). */
export type EebDatum = number;

/** Zeitpunkt in lokaler Wandzeit: Minuten seit 2020-01-01 00:00. Im QR: uint32. */
export type EebZeitpunkt = number;

export const EEB_EPOCHE_MS = Date.UTC(2020, 0, 1);

export function datumAusIso(iso: string): EebDatum {
  const [j = 0, m = 1, t = 1] = iso.split("-").map(Number);
  return Math.round((Date.UTC(j, m - 1, t) - EEB_EPOCHE_MS) / 86_400_000);
}

export function datumZuIso(datum: EebDatum): string {
  return new Date(EEB_EPOCHE_MS + datum * 86_400_000).toISOString().slice(0, 10);
}

/** iso: "2025-05-14T08:30" (lokale Wandzeit, ohne Zeitzonen-Suffix). */
export function zeitpunktAusIso(iso: string): EebZeitpunkt {
  const [datum = "", zeit = "00:00"] = iso.split("T");
  const [j = 0, m = 1, t = 1] = datum.split("-").map(Number);
  const [h = 0, min = 0] = zeit.split(":").map(Number);
  return Math.round((Date.UTC(j, m - 1, t, h, min) - EEB_EPOCHE_MS) / 60_000);
}

export function zeitpunktZuIso(zeitpunkt: EebZeitpunkt): string {
  return new Date(EEB_EPOCHE_MS + zeitpunkt * 60_000).toISOString().slice(0, 16);
}

// ------------------------------------------------------------------- Vokabulare

export enum OrganisationsTyp {
  THW = 1,
  FEUERWEHR = 2, // BF und FF
  POLIZEI = 3,
  BUNDESPOLIZEI = 4,
  DRK = 5,
  JUH = 6,
  MHD = 7,
  ASB = 8,
  DLRG = 9,
  BUNDESWEHR = 10,
  RETTUNGSDIENST = 11, // kommunal/privat
  SONSTIGE = 255, // Name als Freitext Pflicht
}

/**
 * Verweis in ein organisationsspezifisches Vokabular (Einheitstyp, Funktion,
 * Fahrzeugtyp, …) MIT Freitext-Ausweg. Genau eines von beiden ist gesetzt.
 * Im QR: Varint-Code (0 = Freitext folgt) → bekannte Werte kosten 1 Byte,
 * unbekannte Organisationen bleiben trotzdem abbildbar.
 */
export interface VokabularWert {
  code?: number; // Bedeutung abhängig von OrganisationsTyp + Vokabular, siehe vokabulare.ts (Stufe 2)
  freitext?: string;
}

/** Für die Stärkemeldung "Führer / Unterführer / Mannschaft / Gesamt" — organisationsunabhängig. */
export enum StaerkeRolle {
  MANNSCHAFT = 0,
  UNTERFUEHRER = 1,
  FUEHRER = 2,
}

/** EU-Fahrerlaubnisklassen (4 Bit im QR). */
export enum Fahrerlaubnis {
  NONE = 0,
  AM = 1,
  A1 = 2,
  A2 = 3,
  A = 4,
  B = 5,
  BE = 6,
  C1 = 7,
  C1E = 8,
  C = 9,
  CE = 10,
  D1 = 11,
  D1E = 12,
  D = 13,
  DE = 14,
}

export enum Geschlecht {
  M = 0,
  W = 1,
  D = 2,
}

export enum KontaktArt {
  MOBIL = 0,
  FESTNETZ = 1,
  EMAIL = 2,
}

export interface Kontakt {
  art: KontaktArt;
  dienstlich: boolean; // D = dienstlich / P = privat
  /**
   * MOBIL/FESTNETZ: nur Ziffern, z. B. "01712345678" (QR: BCD-gepackt).
   * EMAIL: Freitext ODER weglassbar, wenn emailTemplate gesetzt.
   */
  wert?: string;
  /** Organisationsspezifisches Adress-Template, z. B. THW 1 = vorname.nachname@thw-<ov-slug>.de */
  emailTemplate?: number;
}

export interface Person {
  nachname: string;
  vorname: string;
  /**
   * Rolle, in der die Person VOR ORT eingesetzt ist — nicht die höchste
   * Qualifikation (ein SGL, der als GrFü fährt, zählt als Unterführer).
   * UI: aus der Grundfunktion vorbelegen, überschreibbar.
   */
  staerkeRolle: StaerkeRolle;
  /** Anzeige-Funktionen im Vokabular der Organisation (THW: GrFü, SGL …; FW: Zugführer, AGT …). */
  funktionen: VokabularWert[];
  fahrerlaubnis: Fahrerlaubnis; // "Kf" ergibt sich implizit aus > NONE
  geschlecht: Geschlecht; // → Unterbringung M/W/D wird abgeleitet
  kontakte: Kontakt[]; // i. d. R. nur Führungskräfte
  zusatzqualifikationen: VokabularWert[]; // "weitere interne/externe Qualifikationen"
}

/**
 * BOS-Funkrufname, generisch: "<Kennwort> <Ort> <Teile…>"
 * THW:  Heros Oldenburg 18/13   → kennwort HEROS,   eigenerStandort, teile [18, 13]
 * FW:   Florian Wardenburg 11/48/1 → kennwort FLORIAN, teile [11, 48, 1]
 */
export interface Funkrufname {
  /** Globales Vokabular: Heros, Florian, Rotkreuz, Akkon, Johannes, Sama, Pelikan, … */
  kennwort: VokabularWert;
  /** true: Ortsbezeichnung = Standort der Einheit (spart den String im QR). */
  eigenerStandort: boolean;
  ort?: string; // nur wenn eigenerStandort = false
  teile: number[]; // Kennzahl(en), z. B. [18, 13]
}

export interface Fahrzeug {
  /** Vokabular der Organisation: THW FmKW/MzKW/…; FW LF/DLK/ELW/…; RD RTW/KTW/NEF/… */
  typ: VokabularWert;
  /** THW-Kennzeichen als Zahl ("THW-84397" → 84397) … */
  thwKennzeichen?: number;
  /** … oder ziviles/behördliches Kennzeichen als Freitext ("OL-FW 2041"). Genau eines von beiden. */
  kennzeichenFreitext?: string;
  funkrufname?: Funkrufname;
  stanKonform?: boolean; // "Ausstattung nach StAN/Norm ja/nein"; undefined = Frage nicht anwendbar
  aenderungen?: string; // "Änderungen bzw. Sondergerät"
}

/** Eine Ebene der Organisationshierarchie (THW: OV/RB/LV; FW: Gemeinde/Landkreis; DRK: KV/LV …). */
export interface HierarchieEbene {
  /** Vokabular der Organisation: THW OV/RB/LV; FW GEMEINDE/LANDKREIS/BEZIRK; … */
  bezeichnung: VokabularWert;
  name: string; // "Oldenburg - Ni"
  telefon?: string; // nur Ziffern
  email?: string;
}

export interface Einheit {
  organisation: OrganisationsTyp;
  /** Pflicht bei SONSTIGE, sonst optional ("Freiwillige Feuerwehr Wardenburg"). */
  organisationName?: string;
  /** Vokabular der Organisation: THW "FGr K (A)"; FW "Löschzug"; DRK "SEG Sanität"; … */
  einheitsTyp: VokabularWert;
  /**
   * Referenz in ein mitgeliefertes Standort-Verzeichnis (THW: offizielle
   * OV-Nummer). Wenn gesetzt, sind name + hierarchie inkl. Kontakten daraus
   * ableitbar und entfallen im QR komplett (~150 Bytes Ersparnis).
   * name/hierarchie bleiben im Modell für Anzeige und PDF trotzdem gefüllt.
   */
  standortRef?: number;
  /** Anzeigename der Einheit: "OV Oldenburg - Ni", "LZ Wardenburg". */
  name: string;
  hierarchie: HierarchieEbene[]; // 0..n Ebenen, Reihenfolge: unterste zuerst
}

export interface Einsatz {
  zeitraumVon: EebDatum; // "vorgesehener Einsatzzeitraum"
  zeitraumBis: EebDatum;
  ortAuftrag: string; // "Fernmeldebauübung Kabelblitz"
  einsatzbeginn?: EebZeitpunkt; // oft erst vor Ort/am Meldekopf gefüllt
  einsatzende?: EebZeitpunkt;
}

export interface Sofortbedarf {
  verpflegungPersonen: number; // Default: Gesamtstärke
  davonVegetarisch: number;
  dieselLiter: number;
  benzinLiter: number;
  gemischLiter: number;
  unterbringung: boolean;
  ruhezeitErforderlich: boolean;
}

export interface Staerke {
  fuehrer: number;
  unterfuehrer: number;
  mannschaft: number;
  gesamt: number;
}

/**
 * Meldekopf-Modus: Wie wurde das Personal erfasst?
 * VOLLSTAENDIG — jede Person einzeln (klassischer THW-Bogen).
 * NUR_STAERKE  — nur Stärkezahlen + Führungskraft-Kontakt(e); für Einheiten,
 *                die ohne eigenen Bogen am Meldekopf eintreffen.
 */
export enum PersonalErfassung {
  VOLLSTAENDIG = 0,
  NUR_STAERKE = 1,
}

export interface Erfassungsbogen {
  schemaVersion: number;
  stand: EebDatum;
  einheit: Einheit;
  einsatz: Einsatz;
  personalErfassung: PersonalErfassung;
  /** Bei NUR_STAERKE: nur Führungskräfte/Ansprechpartner (0..n), Zahlen kommen aus staerkeManuell. */
  personal: Person[];
  staerkeManuell?: Staerke; // Pflicht bei NUR_STAERKE
  unterbringungManuell?: { m: number; w: number; d: number }; // optional bei NUR_STAERKE
  fahrzeuge: Fahrzeug[];
  sofortbedarf?: Sofortbedarf;
  sonstiges?: string;
}

// ---------- Abgeleitete Werte (werden NICHT gespeichert/kodiert) ----------

/** Stärkemeldung "0 / 3 / 17 / 20" — manuell erfasst oder aus dem Personal abgeleitet. */
export function staerke(b: Pick<Erfassungsbogen, "personal" | "staerkeManuell">): Staerke {
  if (b.staerkeManuell) return b.staerkeManuell;
  let fuehrer = 0;
  let unterfuehrer = 0;
  for (const p of b.personal) {
    if (p.staerkeRolle === StaerkeRolle.FUEHRER) fuehrer++;
    else if (p.staerkeRolle === StaerkeRolle.UNTERFUEHRER) unterfuehrer++;
  }
  const gesamt = b.personal.length;
  return { fuehrer, unterfuehrer, mannschaft: gesamt - fuehrer - unterfuehrer, gesamt };
}

/** Unterbringungszahlen "M 16 / W 4 / D 0" — manuell erfasst oder aus dem Personal abgeleitet. */
export function unterbringungMWD(
  b: Pick<Erfassungsbogen, "personal" | "unterbringungManuell">,
): { m: number; w: number; d: number } {
  if (b.unterbringungManuell) return b.unterbringungManuell;
  const zaehler = { m: 0, w: 0, d: 0 };
  for (const p of b.personal) {
    if (p.geschlecht === Geschlecht.M) zaehler.m++;
    else if (p.geschlecht === Geschlecht.W) zaehler.w++;
    else zaehler.d++;
  }
  return zaehler;
}

/** Ansprechpartner/-in für den Bogenkopf: erste Führungskraft mit Kontakt. */
export function ansprechpartner(personal: Person[]): Person | undefined {
  return (
    personal.find((p) => p.staerkeRolle === StaerkeRolle.FUEHRER && p.kontakte.length > 0) ??
    personal.find((p) => p.staerkeRolle === StaerkeRolle.UNTERFUEHRER && p.kontakte.length > 0) ??
    personal.find((p) => p.kontakte.length > 0)
  );
}
