/**
 * Komplett-Sicherung aller lokalen App-Daten (Geräteumzug / Backup):
 * sämtliche `eeb.*`-Einträge des localStorage — Vorlagen, Einsätze, Entwurf,
 * Geräteschlüssel, Einstellungen — als eine JSON-Datei exportieren und auf
 * einem anderen Gerät wieder einspielen. Ohne Cloud ist das Gerät sonst ein
 * Single Point of Failure.
 *
 * Achtung: Die Datei enthält auch den PRIVATEN Signatur-Geräteschlüssel —
 * die UI weist darauf hin, dass sie wie ein Schlüssel zu behandeln ist.
 *
 * Gegenstück ist das restlose Löschen (`alleDatenLoeschen`) — beides arbeitet
 * über denselben `eeb.`-Präfix, damit „gesichert" und „gelöscht" dieselbe Menge
 * meinen.
 */

import { absenderkarteGefuellt, absenderkarteLaden } from "./absenderkarte";
import { einsaetzeLaden, einsaetzePapierkorb } from "./einsaetze";
import { entwurfLaden } from "./entwurf";
import { geraeteSchluesselPrivat } from "./geraete-schluessel";
import { vorlagenLaden, vorlagenPapierkorb } from "./vorlagen";

const FORMAT = "eeb-sicherung";
const VERSION = 1;
/** Nur App-eigene Einträge wandern in die Sicherung. */
const PRAEFIX = "eeb.";

export interface Sicherung {
  format: typeof FORMAT;
  version: number;
  erstellt: string; // ISO-Zeitpunkt
  eintraege: Record<string, string>;
}

// ------------------------------------------------- Serialisierung (rein)

export function sicherungInhalt(eintraege: Record<string, string>, jetzt = new Date()): string {
  const s: Sicherung = { format: FORMAT, version: VERSION, erstellt: jetzt.toISOString(), eintraege };
  return JSON.stringify(s, null, 2);
}

/**
 * Sicherungsdatei prüfen und die Einträge zurückgeben. Wirft mit verständlicher
 * Meldung bei fremden Dateien; fremde Schlüssel (ohne `eeb.`) werden ignoriert.
 */
export function sicherungParsen(text: string): Record<string, string> {
  let roh: unknown;
  try {
    roh = JSON.parse(text);
  } catch {
    throw new Error("Datei ist kein gültiges JSON.");
  }
  const s = roh as Sicherung;
  if (s?.format !== FORMAT || typeof s.eintraege !== "object" || s.eintraege == null) {
    throw new Error("Keine gültige Erfassungsbogen-Sicherungsdatei.");
  }
  if (typeof s.version !== "number" || s.version > VERSION) {
    throw new Error(`Sicherung stammt aus einer neueren App-Version (Format ${s.version}) — bitte erst die App aktualisieren.`);
  }
  const eintraege: Record<string, string> = {};
  for (const [k, v] of Object.entries(s.eintraege)) {
    if (k.startsWith(PRAEFIX) && typeof v === "string") eintraege[k] = v;
  }
  return eintraege;
}

// ------------------------------------------------- localStorage-Hülle (I/O)

function speicher(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null; // z. B. Privatmodus/blockierter Speicher
  }
}

function alleEebSchluessel(s: Storage): string[] {
  const schluessel: string[] = [];
  for (let i = 0; i < s.length; i++) {
    const k = s.key(i);
    if (k?.startsWith(PRAEFIX)) schluessel.push(k);
  }
  return schluessel;
}

/** Alle lokalen App-Daten als Sicherungsdatei-Inhalt. */
export function sicherungErstellen(): string {
  const s = speicher();
  const eintraege: Record<string, string> = {};
  if (s) {
    for (const k of alleEebSchluessel(s)) {
      const v = s.getItem(k);
      if (v != null) eintraege[k] = v;
    }
  }
  return sicherungInhalt(eintraege);
}

/**
 * Sicherung einspielen: ERSETZT alle lokalen App-Daten durch den Datei-Inhalt
 * (Geräteumzug-Semantik). Rückgabe: Zahl der übernommenen Einträge.
 */
export function sicherungEinspielen(text: string): number {
  const eintraege = sicherungParsen(text);
  const s = speicher();
  if (!s) throw new Error("Lokaler Speicher ist nicht verfügbar (Privatmodus?).");
  for (const k of alleEebSchluessel(s)) s.removeItem(k);
  for (const [k, v] of Object.entries(eintraege)) s.setItem(k, v);
  return Object.keys(eintraege).length;
}

// ------------------------------------------------- Restlos löschen

/**
 * Was auf diesem Gerät liegt — für die Rückfrage vor dem Löschen. Ohne konkrete
 * Zahlen ist „alles löschen?" eine Frage, die niemand verantwortlich beantworten
 * kann. Vorlagen und Einsätze zählen inklusive Papierkorb: was gelöscht wird,
 * muss auch gezeigt werden.
 */
export interface DatenUmfang {
  /** Zahl der `eeb.*`-Einträge insgesamt (auch Einstellungen). */
  eintraege: number;
  vorlagen: number;
  einsaetze: number;
  /** Gemeldete Bögen über alle Einsatz-Sammlungen. */
  meldungen: number;
  entwurf: boolean;
  absender: boolean;
  geraeteschluessel: boolean;
}

export function datenUmfang(): DatenUmfang {
  const s = speicher();
  const einsaetze = [...einsaetzeLaden(), ...einsaetzePapierkorb()];
  return {
    eintraege: s ? alleEebSchluessel(s).length : 0,
    vorlagen: vorlagenLaden().length + vorlagenPapierkorb().length,
    einsaetze: einsaetze.length,
    meldungen: einsaetze.reduce((summe, e) => summe + e.eintraege.length, 0),
    entwurf: entwurfLaden() != null,
    absender: absenderkarteGefuellt(absenderkarteLaden()),
    geraeteschluessel: geraeteSchluesselPrivat() != null,
  };
}

/**
 * Alle lokalen App-Daten (`eeb.*`) endgültig entfernen — auch der Papierkorb,
 * auch der private Geräteschlüssel. Rückgabe: Zahl der entfernten Einträge.
 *
 * Nicht betroffen ist der Widerspruch zur Reichweitenmessung (`skipgc`, ohne
 * `eeb.`-Präfix): das ist eine Datenschutz-Entscheidung über die App, kein
 * erfasster Inhalt — sie beim „Alles löschen" stillschweigend zurückzunehmen
 * wäre das Gegenteil dessen, was hier jemand will.
 */
export function alleDatenLoeschen(): number {
  const s = speicher();
  if (!s) throw new Error("Lokaler Speicher ist nicht verfügbar (Privatmodus?).");
  const schluessel = alleEebSchluessel(s);
  for (const k of schluessel) s.removeItem(k);
  return schluessel.length;
}
