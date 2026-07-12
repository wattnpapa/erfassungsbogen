/**
 * „Meine Vorlagen": lokal gespeicherte, einsatzfreie Basisbögen einer Einheit.
 *
 * Eine Vorlage hält die komplette Mannschaft, die Fahrzeuge und den
 * Standard-Sofortbedarf vor. Beim Einsatz wird sie in der Musterung zu einem
 * frischen Arbeitsbogen instanziiert (Variante A: Vorlage = Quelle, Einsatz =
 * Kopie) — nur die anwesenden Personen/Fahrzeuge landen im Bogen, die Vorlage
 * selbst bleibt unangetastet.
 *
 * Ablage: localStorage (funktioniert im Webview auf iOS/Android/Desktop und im
 * Browser identisch — ein Code-Pfad). Reine Logik (Konvertierung, Serialisierung,
 * Migration) ist von der localStorage-Hülle getrennt und unit-getestet.
 */

import type { Erfassungsbogen } from "../model";
import { datumAusIso } from "../model";
import { migriereBogen } from "./hilfen";

/** Versionierter Schlüssel — erlaubt spätere Formatwechsel der Sammlung selbst. */
const SPEICHER_SCHLUESSEL = "eeb.vorlagen.v1";

export interface Vorlage {
  id: string;
  name: string;
  erstellt: number; // Date.now()
  geaendert: number;
  /** Schnellstart-Vorlage für die App-Icon-Kurzaktion (0..1 pro Gerät). */
  standard?: boolean;
  /** Einsatzfreier Bogen: einheit + personal + fahrzeuge + Standard-Sofortbedarf. */
  bogen: Erfassungsbogen;
}

// ------------------------------------------------------- Konvertierung (rein)

function heute(): number {
  return datumAusIso(new Date().toISOString().slice(0, 10));
}

/**
 * Tiefe Kopie eines Bogens ohne einsatzspezifische Angaben → Vorlage-Bogen.
 * Personal, Fahrzeuge und Sofortbedarf (als Standardbedarf) bleiben erhalten;
 * Einsatzzeitraum/Ort und Beginn/Ende werden zurückgesetzt.
 */
export function bogenAlsVorlage(b: Erfassungsbogen): Erfassungsbogen {
  const kopie = structuredClone(b);
  const t = heute();
  kopie.stand = t;
  kopie.einsatz = { zeitraumVon: t, zeitraumBis: t, ortAuftrag: "" };
  return kopie;
}

/** Musterungsauswahl: welche Personen/Fahrzeuge (nach Index) sind anwesend? */
export interface MusterungAuswahl {
  personal: boolean[];
  fahrzeuge: boolean[];
}

/**
 * Vorlage-Bogen + Musterungsauswahl → frischer Arbeitsbogen (nur Anwesende).
 * Fehlende Auswahl-Einträge gelten als anwesend (robust gegen Längen-Drift).
 */
export function vorlageInstanziieren(
  vorlageBogen: Erfassungsbogen,
  auswahl: MusterungAuswahl,
): Erfassungsbogen {
  const b = bogenAlsVorlage(vorlageBogen); // gleiche Reset-Logik (Einsatz leer, stand heute)
  b.personal = b.personal.filter((_, i) => auswahl.personal[i] ?? true);
  b.fahrzeuge = b.fahrzeuge.filter((_, i) => auswahl.fahrzeuge[i] ?? true);
  return b;
}

// ------------------------------------------------- Serialisierung (rein)

/**
 * JSON-String → Vorlagenliste. Jeder enthaltene Bogen wird durch die
 * Schema-Migration gehoben (alte Vorlagen bleiben lesbar). Defensiv: kaputte
 * Einträge werden übersprungen statt die ganze Sammlung zu verlieren.
 */
export function vorlagenAusJson(text: string | null): Vorlage[] {
  if (!text) return [];
  let roh: unknown;
  try {
    roh = JSON.parse(text);
  } catch {
    return [];
  }
  if (!Array.isArray(roh)) return [];
  const liste: Vorlage[] = [];
  for (const e of roh as Vorlage[]) {
    if (!e || typeof e.id !== "string" || !e.bogen || !Array.isArray(e.bogen.personal)) continue;
    try {
      e.bogen = migriereBogen(e.bogen);
    } catch {
      continue;
    }
    liste.push(e);
  }
  return liste;
}

export function vorlagenZuJson(liste: Vorlage[]): string {
  return JSON.stringify(liste);
}

// ------------------------------------------------- localStorage-Hülle (I/O)

function speicher(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null; // z. B. Privatmodus/blockierter Speicher
  }
}

export function vorlagenLaden(): Vorlage[] {
  const s = speicher();
  return s ? vorlagenAusJson(s.getItem(SPEICHER_SCHLUESSEL)) : [];
}

export function vorlagenSpeichern(liste: Vorlage[]): void {
  speicher()?.setItem(SPEICHER_SCHLUESSEL, vorlagenZuJson(liste));
}

function neueId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `v${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Bogen als neue Vorlage ablegen (einsatzfrei normalisiert) und zurückgeben.
 * Nutzbar sowohl beim Speichern aus der Übersicht als auch beim QR-Import.
 */
export function vorlageAnlegen(name: string, bogen: Erfassungsbogen): Vorlage {
  const liste = vorlagenLaden();
  const jetzt = Date.now();
  const v: Vorlage = {
    id: neueId(),
    name: name.trim() || bogen.einheit.name || "Vorlage",
    erstellt: jetzt,
    geaendert: jetzt,
    bogen: bogenAlsVorlage(bogen),
  };
  liste.push(v);
  vorlagenSpeichern(liste);
  return v;
}

export function vorlageUmbenennen(id: string, name: string): void {
  vorlagenSpeichern(
    vorlagenLaden().map((v) =>
      v.id === id ? { ...v, name: name.trim() || v.name, geaendert: Date.now() } : v,
    ),
  );
}

export function vorlageLoeschen(id: string): void {
  vorlagenSpeichern(vorlagenLaden().filter((v) => v.id !== id));
}
