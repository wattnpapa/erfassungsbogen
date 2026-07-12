/**
 * „Einsatz-Sammlung": lokal gesammelte, FREMDE Erfassungsbögen unter einem
 * Einsatz/Übung/Veranstaltung. Gegenstück zu „Meine Vorlagen" (eigene Einheit).
 *
 * Zwei Rollen nutzen denselben Mechanismus, nur in anderem Kontext:
 *  - Zug-/Verbandsführer sammelt die Bögen seiner Einheiten und leitet sie weiter.
 *  - Meldekopf/Führungsstelle sammelt terminal und wertet aus.
 *
 * Kernregeln:
 *  - HISTORIE STAPELN: eine Einheit meldet bei Mehrtageslagen täglich neu; jede
 *    Fassung bleibt als Revision erhalten, die neueste zählt in den Summen.
 *  - ZUORDNUNG per Fingerabdruck (einheitSchluessel) — von der App VORGESCHLAGEN,
 *    vom Menschen bestätigt/überschrieben (kein hartes Auto-Merge).
 *  - IDEMPOTENZ: derselbe Bogeninhalt (Doppelmeldeweg, PDF-Reimport) erzeugt
 *    KEINE zweite Revision. Die Eintrags-ID ist der Inhalts-Hash des Bogens.
 *
 * Ablage: localStorage (ein Code-Pfad für iOS/Android/Desktop/Browser). Reine
 * Logik (Fingerabdruck, Hash, Serialisierung, Migration, Auswahl) ist von der
 * localStorage-Hülle getrennt und unit-getestet.
 */

import type { Einheit, Erfassungsbogen } from "../model";
import { migriereBogen } from "./hilfen";

/** Versionierter Schlüssel — erlaubt spätere Formatwechsel der Sammlung selbst. */
const SPEICHER_SCHLUESSEL = "eeb.einsaetze.v1";

export enum EinsatzArt {
  EINSATZ = 0,
  UEBUNG = 1,
  VERANSTALTUNG = 2,
}

/** Anwesenheit einer Einheit vor Ort — steuert, ob sie in aktuelle Summen zählt. */
export enum MeldeStatus {
  ANWESEND = 0,
  ABGERUECKT = 1,
}

/** Wie kam die Meldung in die Sammlung? (Herkunftsnachweis) */
export type MeldeQuelle = "scan" | "manuell" | "pdf-import";

export interface MeldeEintrag {
  /** Stabiler, inhaltsbasierter Schlüssel → Dedupe bei Doppelmeldeweg/Reimport. */
  id: string;
  /** Fingerabdruck der Einheit → gruppiert Revisionen derselben Einheit. */
  einheitSchluessel: string;
  empfangenAm: number; // Date.now() der Geräteuhr (nicht der Sender-`stand`)
  quelle: MeldeQuelle;
  status: MeldeStatus;
  /** Optionales Verbands-/Zug-Etikett aus einem gesammelten Bündel. */
  zugEtikett?: string;
  bogen: Erfassungsbogen;
}

export interface Einsatzsammlung {
  id: string;
  name: string;
  art: EinsatzArt;
  ort?: string;
  angelegt: number; // Date.now()
  geaendert: number;
  eintraege: MeldeEintrag[];
}

// ----------------------------------------------- Fingerabdruck & Hash (rein)

/** Normalisiert Freitext für den Vergleich: klein, getrimmt, Whitespace kollabiert. */
function normText(s: string | undefined): string {
  return (s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Fingerabdruck einer Einheit — Basis der Revisions-Gruppierung.
 * Stabile Identität zuerst (offizieller Standort-Ref), sonst Organisation +
 * Einheitstyp + Anzeigename. Bewusst eine HEURISTIK: die App schlägt damit die
 * Zuordnung vor, der Mensch bestätigt/überschreibt (siehe Modul-Kopf).
 */
export function einheitSchluessel(e: Einheit): string {
  const typ = e.einheitsTyp.code != null ? `c${e.einheitsTyp.code}` : normText(e.einheitsTyp.freitext);
  if (e.standortRef != null) return `ref:${e.standortRef}|${typ}`;
  return `org:${e.organisation}|${normText(e.organisationName)}|${typ}|${normText(e.name)}`;
}

/** FNV-1a (32 Bit) über einen String → 8-stelliger Hex. Deterministisch, kryptofrei (nur Dedupe). */
function fnv1a(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/**
 * Inhalts-ID eines Bogens → Eintrags-ID. Gleicher Inhalt = gleiche ID = Dedupe.
 * Der Bogen trägt einheit + `stand` in sich, daher genügt sein Inhalt.
 */
export function bogenInhaltsId(bogen: Erfassungsbogen): string {
  return fnv1a(JSON.stringify(bogen));
}

// -------------------------------------------------------- Auswahl/Gruppierung

function istNeuer(a: MeldeEintrag, b: MeldeEintrag): boolean {
  if (a.bogen.stand !== b.bogen.stand) return a.bogen.stand > b.bogen.stand;
  return a.empfangenAm > b.empfangenAm;
}

/**
 * Neueste Meldung je Einheit (Revisions-Kopf). Bewertet nach Sender-`stand`,
 * bei Gleichstand nach Empfangszeit — beides absteigend.
 */
export function neuesteJeEinheit(eintraege: MeldeEintrag[]): MeldeEintrag[] {
  const kopf = new Map<string, MeldeEintrag>();
  for (const e of eintraege) {
    const bisher = kopf.get(e.einheitSchluessel);
    if (!bisher || istNeuer(e, bisher)) kopf.set(e.einheitSchluessel, e);
  }
  return [...kopf.values()];
}

/** Alle Revisionen einer Einheit, neueste zuerst. */
export function revisionen(eintraege: MeldeEintrag[], einheitSchl: string): MeldeEintrag[] {
  return eintraege
    .filter((e) => e.einheitSchluessel === einheitSchl)
    .sort((a, b) => (istNeuer(a, b) ? -1 : 1));
}

// ------------------------------------------------- Serialisierung (rein)

/**
 * JSON-String → Sammlungsliste. Jeder enthaltene Bogen wird durch die
 * Schema-Migration gehoben (alte Sammlungen bleiben lesbar). Defensiv: kaputte
 * Einträge/Sammlungen werden übersprungen statt alles zu verlieren.
 */
export function einsaetzeAusJson(text: string | null): Einsatzsammlung[] {
  if (!text) return [];
  let roh: unknown;
  try {
    roh = JSON.parse(text);
  } catch {
    return [];
  }
  if (!Array.isArray(roh)) return [];
  const liste: Einsatzsammlung[] = [];
  for (const s of roh as Einsatzsammlung[]) {
    if (!s || typeof s.id !== "string" || !Array.isArray(s.eintraege)) continue;
    const eintraege: MeldeEintrag[] = [];
    for (const e of s.eintraege) {
      if (!e || typeof e.id !== "string" || !e.bogen || !Array.isArray(e.bogen.personal)) continue;
      try {
        e.bogen = migriereBogen(e.bogen);
      } catch {
        continue;
      }
      eintraege.push(e);
    }
    liste.push({ ...s, eintraege });
  }
  return liste;
}

export function einsaetzeZuJson(liste: Einsatzsammlung[]): string {
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

export function einsaetzeLaden(): Einsatzsammlung[] {
  const s = speicher();
  return s ? einsaetzeAusJson(s.getItem(SPEICHER_SCHLUESSEL)) : [];
}

export function einsaetzeSpeichern(liste: Einsatzsammlung[]): void {
  speicher()?.setItem(SPEICHER_SCHLUESSEL, einsaetzeZuJson(liste));
}

function neueId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `e${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function einsatzAnlegen(name: string, art: EinsatzArt, ort?: string): Einsatzsammlung {
  const liste = einsaetzeLaden();
  const jetzt = Date.now();
  const s: Einsatzsammlung = {
    id: neueId(),
    name: name.trim() || "Einsatz",
    art,
    ort: ort?.trim() || undefined,
    angelegt: jetzt,
    geaendert: jetzt,
    eintraege: [],
  };
  liste.push(s);
  einsaetzeSpeichern(liste);
  return s;
}

export function einsatzLoeschen(id: string): void {
  einsaetzeSpeichern(einsaetzeLaden().filter((s) => s.id !== id));
}

/** Ergebnis von {@link meldungHinzufuegen}: `neu=false` heißt „Dublette übersprungen". */
export interface MeldungAufnahme {
  eintrag: MeldeEintrag;
  neu: boolean;
}

export interface MeldungOptionen {
  quelle?: MeldeQuelle;
  zugEtikett?: string;
  /** Manuell bestätigte Zuordnung (Vorschlag+Bestätigung) statt Auto-Fingerabdruck. */
  einheitSchluesselOverride?: string;
}

/**
 * Bogen als Meldung aufnehmen. Idempotent: gleicher Bogeninhalt (gleiche
 * Inhalts-ID) im selben Einsatz wird NICHT erneut angehängt — der bestehende
 * Eintrag kommt mit `neu=false` zurück. Neuer Inhalt derselben Einheit landet
 * als zusätzliche Revision (Historie stapeln).
 */
export function meldungHinzufuegen(
  einsatzId: string,
  bogen: Erfassungsbogen,
  opt: MeldungOptionen = {},
): MeldungAufnahme | null {
  const liste = einsaetzeLaden();
  const s = liste.find((x) => x.id === einsatzId);
  if (!s) return null;

  const migriert = migriereBogen(bogen);
  const id = bogenInhaltsId(migriert);
  const bestehend = s.eintraege.find((e) => e.id === id);
  if (bestehend) return { eintrag: bestehend, neu: false };

  const eintrag: MeldeEintrag = {
    id,
    einheitSchluessel: opt.einheitSchluesselOverride ?? einheitSchluessel(migriert.einheit),
    empfangenAm: Date.now(),
    quelle: opt.quelle ?? "scan",
    status: MeldeStatus.ANWESEND,
    zugEtikett: opt.zugEtikett?.trim() || undefined,
    bogen: migriert,
  };
  s.eintraege.push(eintrag);
  s.geaendert = Date.now();
  einsaetzeSpeichern(liste);
  return { eintrag, neu: true };
}

/** Status einer Meldung setzen (z. B. Einheit rückt ab → fällt aus aktuellen Summen). */
export function meldungStatusSetzen(einsatzId: string, eintragId: string, status: MeldeStatus): void {
  const liste = einsaetzeLaden();
  const s = liste.find((x) => x.id === einsatzId);
  if (!s) return;
  const e = s.eintraege.find((x) => x.id === eintragId);
  if (!e) return;
  e.status = status;
  s.geaendert = Date.now();
  einsaetzeSpeichern(liste);
}

export function meldungEntfernen(einsatzId: string, eintragId: string): void {
  const liste = einsaetzeLaden();
  const s = liste.find((x) => x.id === einsatzId);
  if (!s) return;
  s.eintraege = s.eintraege.filter((e) => e.id !== eintragId);
  s.geaendert = Date.now();
  einsaetzeSpeichern(liste);
}
