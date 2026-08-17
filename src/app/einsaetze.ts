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

import { jetztZeitpunkt, type Einheit, type Erfassungsbogen } from "../model";
import { teileBogen, type AufteilungsWahl } from "./aufteilen";
import { fuegeZusammen } from "./zusammenfuehren";
import { migriereBogen } from "./hilfen";
import { aktive, imPapierkorb, papierkorbBereinigt } from "./papierkorb";

/** Versionierter Schlüssel — erlaubt spätere Formatwechsel der Sammlung selbst. */
const SPEICHER_SCHLUESSEL = "eeb.einsaetze.v1";

export enum EinsatzArt {
  EINSATZ = 0,
  UEBUNG = 1,
  VERANSTALTUNG = 2,
}

/**
 * Anwesenheit einer Einheit vor Ort — steuert, ob sie in aktuelle Summen zählt.
 * Nur ANWESEND zählt; die anderen bleiben in der Historie sichtbar.
 *
 * AUFGEGANGEN trennt zwei Dinge, die sonst verwechselt würden: ein
 * zusammengeführter Truppteil ist NICHT abgerückt — er ist wieder Teil seiner
 * Einheit und steckt in deren Zahlen. Als „abgerückt" gemeldet, läse die
 * Führungsstelle einen Abgang, den es nie gab.
 */
export enum MeldeStatus {
  ANWESEND = 0,
  ABGERUECKT = 1,
  AUFGEGANGEN = 2,
}

/**
 * Wie kam die Meldung in die Sammlung? (Herkunftsnachweis)
 * „aufteilung" und „zusammenfuehrung" sind die Quellen, die hier vor Ort
 * ENTSTEHEN statt anzukommen: der Bogen wurde aus einer anderen Meldung
 * herausgetrennt bzw. aus mehreren verschmolzen (siehe {@link meldungAufteilen},
 * {@link meldungenZusammenfuehren}).
 */
export type MeldeQuelle = "scan" | "manuell" | "pdf-import" | "aufteilung" | "zusammenfuehrung";

/**
 * Ergebnis der Signaturprüfung beim Empfang (nur gespeichert, wenn der Transport
 * signiert war). Fehlt das Feld → der Bogen kam unsigniert an. Belegt Herkunft
 * (welcher Schlüssel), keine Identitäts-Zusicherung — siehe docs/datenmodell.md.
 */
export interface EintragSignatur {
  zustand: "gueltig" | "ungueltig";
  /** Öffentlicher Schlüssel (Hex) — bei „gueltig" zur Wiedererkennung. */
  pubkey?: string;
  /** Anzeige-Kurzform des Schlüssels. */
  kurzform?: string;
  /**
   * Freiwillige Absenderangaben aus der mitsignierten Absenderkarte — nur bei
   * „gueltig" gesetzt (bei gebrochener Signatur wären sie wertlos).
   */
  absender?: { name?: string; email?: string; telefon?: string };
}

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
  /**
   * Bezeichnung eines abgeteilten Truppteils („Fachberater", „Rest 2. Zug").
   * Gesetzt, sobald eine Einheit aufgeteilt wurde — sonst stünde dieselbe
   * Einheit zweimal gleichnamig in der Liste. Bewusst am EINTRAG und nicht im
   * Bogen: kein Schemawechsel, keine QR-Bytes; die Sammlung trägt es durch
   * Sammel-PDF und Einsatz-Transport mit. Siehe aufteilen.ts.
   */
  teilEtikett?: string;
  /**
   * Wohin ein Teil zusammengeführt wurde (Status AUFGEGANGEN) — Gegenstück zu
   * {@link MeldeEintrag.stammtVon}. Zeigt in der Liste, wo die Zahlen dieses
   * Teils jetzt stecken.
   */
  aufgegangenIn?: {
    einheitSchluessel: string;
    zusammengefuehrtAm: number; // Date.now()
  };
  /** Woher ein abgeteilter Teil stammt — Herkunftsspur der Aufteilung. */
  stammtVon?: {
    /** Fingerabdruck der Einheit, aus der abgeteilt wurde. */
    einheitSchluessel: string;
    /** Deren Teil-Bezeichnung, falls schon sie ein Teil war. */
    teilEtikett?: string;
    abgeteiltAm: number; // Date.now()
  };
  /** Signaturstatus des Empfangstransports (fehlt = unsigniert empfangen). */
  signatur?: EintragSignatur;
  /**
   * Der empfangene QR-Payload als Base64url — nur bei signiertem Scan gesetzt.
   * Er trägt die Original-Signatur des Absenders: reicht der Meldekopf die
   * Meldung unverändert weiter, wird dieser Payload gegengezeichnet statt neu
   * signiert, damit der Ursprung beim nächsten Empfänger prüfbar bleibt.
   * Fehlt bei älteren Sammlungen — dann wird wie früher selbst signiert.
   */
  herkunft?: string;
  bogen: Erfassungsbogen;
}

export interface Einsatzsammlung {
  id: string;
  name: string;
  art: EinsatzArt;
  ort?: string;
  angelegt: number; // Date.now()
  geaendert: number;
  /** Im Papierkorb seit (Date.now()); fehlt = aktiv. Siehe papierkorb.ts. */
  geloeschtAm?: number;
  eintraege: MeldeEintrag[];
}

// ------------------------------------------------------ Ruhende Sammlungen

/**
 * Einsatz-Sammlungen räumen sich selbst auf: 90 Tage ohne Änderung, dann weg.
 *
 * Eine Sammlung enthält FREMDE Personendaten — Namen und Funktionen gemeldeter
 * Kräfte, die diese Kräfte einem Meldekopf für einen Einsatz gegeben haben und
 * nicht für die Ablage danach. Nach dem Einsatz fehlt der Zweck (Art. 5 Abs. 1
 * lit. e DSGVO), aber niemand räumt am Meldekopf-Tablet von sich aus auf.
 * Deshalb löscht die App hier automatisch — anders als beim EIGENEN Bogen und
 * den eigenen Vorlagen, die genau dafür da sind, liegen zu bleiben.
 *
 * Ab Tag 60 kündigt die Liste die Löschung an, damit der Zeitpunkt niemanden
 * überrascht: 30 Tage sind genug, um eine Sammlung zu exportieren, wenn sie
 * für die Nachbereitung noch gebraucht wird. Jede Änderung setzt die Uhr
 * zurück — eine Sammlung, an der noch gearbeitet wird, altert nicht.
 */
export const AUFRAEUM_HINWEIS_MS = 60 * 24 * 60 * 60 * 1000; // 60 Tage
export const AUFRAEUM_FRIST_MS = 90 * 24 * 60 * 60 * 1000; // 90 Tage

const TAG_MS = 24 * 60 * 60 * 1000;

/**
 * Tage bis zur automatischen Löschung, sobald die Ankündigungsfrist läuft —
 * sonst `null`. Getrennt vom UI, damit die Fristen prüfbar bleiben.
 */
export function tageBisAufraeumen(s: Einsatzsammlung, jetzt = Date.now()): number | null {
  const ruht = jetzt - s.geaendert;
  if (ruht < AUFRAEUM_HINWEIS_MS) return null;
  return Math.max(0, Math.ceil((AUFRAEUM_FRIST_MS - ruht) / TAG_MS));
}

/**
 * Abgelaufene Sammlungen entfernen — endgültig, nicht in den Papierkorb.
 *
 * Der Papierkorb schützt vor dem Fehltipp eines Menschen; hier hat niemand
 * getippt, und weitere 30 Tage Aufbewahrung wären genau das, was die Frist
 * verhindern soll. Papierkorb-Einträge lässt die Regel in Ruhe: die haben mit
 * `geloeschtAm` schon ihre eigene, kürzere Uhr (siehe papierkorb.ts).
 */
export function ruhendeBereinigt(
  liste: Einsatzsammlung[],
  jetzt = Date.now(),
): { liste: Einsatzsammlung[]; entfernt: number } {
  const behalten = liste.filter(
    (s) => s.geloeschtAm != null || jetzt - s.geaendert < AUFRAEUM_FRIST_MS,
  );
  return { liste: behalten, entfernt: liste.length - behalten.length };
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
  return `org:${e.organisation}|${normText(e.organisationName)}|${typ}|${normText(e.hierarchie[0]?.name)}`;
}

/**
 * Anhängsel, das einen abgeteilten Truppteil vom Rest der Einheit unterscheidet.
 * Ohne ihn hätten beide denselben Fingerabdruck und würden sich gegenseitig als
 * Revision überschreiben — nur einer zählte in den Summen.
 */
const TEIL_TRENNER = "|teil:";

/** Fingerabdruck ohne Teil-Anhängsel — alle Teile einer Einheit teilen ihn. */
export function stammSchluessel(schluessel: string): string {
  const i = schluessel.indexOf(TEIL_TRENNER);
  return i < 0 ? schluessel : schluessel.slice(0, i);
}

/**
 * Nächster freier Teil-Schlüssel zu einer Einheit. Teile eines schon geteilten
 * Teils hängen am selben Stamm, damit aus wiederholtem Aufteilen keine
 * verschachtelten Schlüssel werden.
 */
export function freierTeilSchluessel(vergeben: Iterable<string>, basis: string): string {
  const stamm = stammSchluessel(basis);
  const belegt = new Set(vergeben);
  for (let n = 1; ; n++) {
    const k = `${stamm}${TEIL_TRENNER}${n}`;
    if (!belegt.has(k)) return k;
  }
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

/**
 * Komplette Liste inkl. Papierkorb — Basis aller Mutationen, damit beim
 * Zurückschreiben keine Papierkorb-Einträge verloren gehen. Abgelaufene
 * Einträge werden hier endgültig bereinigt (und der Stand persistiert).
 *
 * Zwei Uhren laufen: der Papierkorb (30 Tage seit dem Löschen) und die
 * Aufräumfrist ruhender Sammlungen (90 Tage ohne Änderung, siehe
 * AUFRAEUM_FRIST_MS). Beide greifen hier, weil jeder Lesepfad durch diese
 * Funktion läuft — eine Sammlung kann also nicht an der Frist vorbei liegen
 * bleiben, egal über welchen Weg die App sie anfasst.
 */
function alleEinsaetzeLaden(): Einsatzsammlung[] {
  const s = speicher();
  if (!s) return [];
  const nachPapierkorb = papierkorbBereinigt(einsaetzeAusJson(s.getItem(SPEICHER_SCHLUESSEL)));
  const r = ruhendeBereinigt(nachPapierkorb.liste);
  if (nachPapierkorb.entfernt > 0 || r.entfernt > 0) einsaetzeSpeichern(r.liste);
  return r.liste;
}

/** Aktive Einsätze (ohne Papierkorb) — das, was Listen anzeigen. */
export function einsaetzeLaden(): Einsatzsammlung[] {
  return aktive(alleEinsaetzeLaden());
}

/** Einsätze im Papierkorb, zuletzt gelöschte zuerst. */
export function einsaetzePapierkorb(): Einsatzsammlung[] {
  return imPapierkorb(alleEinsaetzeLaden());
}

export function einsaetzeSpeichern(liste: Einsatzsammlung[]): void {
  speicher()?.setItem(SPEICHER_SCHLUESSEL, einsaetzeZuJson(liste));
}

/**
 * Empfangszeit für eine hier vor Ort erzeugte Fassung, die die bisherige
 * ablösen MUSS (Aufteilen, Zusammenführen).
 *
 * Der Revisionsvergleich wertet den Stand minutengenau und erst bei Gleichstand
 * die Empfangszeit ({@link istNeuer}). Zwei Schritte in derselben Minute — beim
 * Aufteilen und gleich wieder Zusammenführen der Normalfall — haben denselben
 * Stand; fallen sie zusätzlich in dieselbe Millisekunde, bliebe die ALTE Fassung
 * Revisionskopf und die Summen zeigten den Zustand vor der Änderung. Ein
 * Millisekundenschritt über die bisherigen Fassungen hinaus macht die Reihenfolge
 * eindeutig.
 */
function ablosendeEmpfangszeit(eintraege: MeldeEintrag[], einheitSchl: string, jetzt: number): number {
  return Math.max(
    jetzt,
    ...eintraege.filter((e) => e.einheitSchluessel === einheitSchl).map((e) => e.empfangenAm + 1),
  );
}

function neueId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `e${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function einsatzAnlegen(name: string, art: EinsatzArt, ort?: string): Einsatzsammlung {
  const liste = alleEinsaetzeLaden();
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

/** In den Papierkorb verschieben (30 Tage wiederherstellbar). */
export function einsatzLoeschen(id: string): void {
  einsaetzeSpeichern(
    alleEinsaetzeLaden().map((s) => (s.id === id ? { ...s, geloeschtAm: Date.now() } : s)),
  );
}

/** Aus dem Papierkorb zurückholen. */
export function einsatzWiederherstellen(id: string): void {
  einsaetzeSpeichern(
    alleEinsaetzeLaden().map((s) => {
      if (s.id !== id) return s;
      const { geloeschtAm: _, ...rest } = s;
      return rest;
    }),
  );
}

/** Endgültig löschen (nur aus dem Papierkorb heraus angeboten). */
export function einsatzEndgueltigLoeschen(id: string): void {
  einsaetzeSpeichern(alleEinsaetzeLaden().filter((s) => s.id !== id));
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
  /** Signaturstatus des Empfangstransports (nur bei signiertem Scan gesetzt). */
  signatur?: EintragSignatur;
  /** Empfangener Payload (Base64url) — erhält die Original-Signatur, s. {@link MeldeEintrag.herkunft}. */
  herkunft?: string;
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
  const liste = alleEinsaetzeLaden();
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
    signatur: opt.signatur,
    herkunft: opt.herkunft,
    bogen: migriert,
  };
  s.eintraege.push(eintrag);
  s.geaendert = Date.now();
  einsaetzeSpeichern(liste);
  return { eintrag, neu: true };
}

/**
 * Importierte Sammlung einfügen bzw. mit einer bestehenden zusammenführen.
 * Gleiche Einsatz-ID → Meldungen mergen (Dedupe über die inhaltsbasierte
 * Eintrags-ID, keine Dubletten bei Reimport). Sonst als neuen Einsatz anlegen.
 */
export function einsatzImportieren(s: Einsatzsammlung): { neuerEinsatz: boolean; hinzugefuegt: number } {
  const liste = alleEinsaetzeLaden();
  const vorhanden = liste.find((x) => x.id === s.id);
  if (!vorhanden) {
    liste.push(s);
    einsaetzeSpeichern(liste);
    return { neuerEinsatz: true, hinzugefuegt: s.eintraege.length };
  }
  // Import belebt einen Einsatz im Papierkorb wieder — sonst verschwänden die
  // gemergten Meldungen unsichtbar im Papierkorb.
  delete vorhanden.geloeschtAm;
  const ids = new Set(vorhanden.eintraege.map((e) => e.id));
  let hinzugefuegt = 0;
  for (const e of s.eintraege) {
    if (!ids.has(e.id)) {
      vorhanden.eintraege.push(e);
      ids.add(e.id);
      hinzugefuegt++;
    }
  }
  vorhanden.geaendert = Date.now();
  einsaetzeSpeichern(liste);
  return { neuerEinsatz: false, hinzugefuegt };
}

/** Status einer Meldung setzen (z. B. Einheit rückt ab → fällt aus aktuellen Summen). */
export function meldungStatusSetzen(einsatzId: string, eintragId: string, status: MeldeStatus): void {
  const liste = alleEinsaetzeLaden();
  const s = liste.find((x) => x.id === einsatzId);
  if (!s) return;
  const e = s.eintraege.find((x) => x.id === eintragId);
  if (!e) return;
  e.status = status;
  // Wird ein aufgegangener Teil wieder eigenständig geführt, ist der Verweis auf
  // das Ziel überholt — er stünde sonst an einer Meldung, die wieder mitzählt.
  if (status !== MeldeStatus.AUFGEGANGEN) delete e.aufgegangenIn;
  s.geaendert = Date.now();
  einsaetzeSpeichern(liste);
}

export function meldungEntfernen(einsatzId: string, eintragId: string): void {
  const liste = alleEinsaetzeLaden();
  const s = liste.find((x) => x.id === einsatzId);
  if (!s) return;
  s.eintraege = s.eintraege.filter((e) => e.id !== eintragId);
  s.geaendert = Date.now();
  einsaetzeSpeichern(liste);
}

export interface AufteilungOptionen {
  /** Status des abgeteilten Teils — „abgerückt", wenn er den Einsatz verlässt. */
  status?: MeldeStatus;
  /**
   * Zug-Etikett des abgeteilten Teils. Fehlt das Feld, erbt er das des
   * Ursprungs; ein leerer Text stellt ihn bewusst zugfrei.
   */
  zugEtikett?: string;
}

export interface AufteilungErgebnis {
  /** Neue Revision der Einheit, die weiterbesteht. */
  rest: MeldeEintrag;
  /** Der abgeteilte Teil als eigene Meldung mit eigenem Fingerabdruck. */
  abgeteilt: MeldeEintrag;
}

/**
 * Eine Meldung aufteilen: der Rest wird als neue Revision derselben Einheit
 * fortgeschrieben (die Änderungsansicht zeigt die Abgänge dadurch von selbst),
 * der abgeteilte Teil kommt als eigenständige Meldung mit eigenem Fingerabdruck
 * dazu und zählt damit getrennt in den Summen.
 *
 * Beide Bögen sind hier vor Ort entstanden: Signatur und Herkunfts-Payload der
 * Ursprungsmeldung werden NICHT übernommen — sie deckten den veränderten Inhalt
 * nicht mehr und würden eine Echtheit behaupten, die es nicht gibt. Die
 * signierte Ursprungsfassung bleibt in der Historie erhalten.
 */
export function meldungAufteilen(
  einsatzId: string,
  eintragId: string,
  wahl: AufteilungsWahl,
  opt: AufteilungOptionen = {},
): AufteilungErgebnis | null {
  const liste = alleEinsaetzeLaden();
  const s = liste.find((x) => x.id === einsatzId);
  if (!s) return null;
  const quelle = s.eintraege.find((e) => e.id === eintragId);
  if (!quelle) return null;

  // Der Rest muss die bisher neueste Fassung ablösen. Eine Senderuhr kann
  // vorgehen — dann bliebe „jetzt" hinter dem alten Stand zurück.
  const stand = Math.max(jetztZeitpunkt(), quelle.bogen.stand);
  const geteilt = teileBogen(quelle.bogen, wahl, stand);
  const jetzt = Date.now();

  const restId = bogenInhaltsId(geteilt.rest);
  const rest: MeldeEintrag = s.eintraege.find((e) => e.id === restId) ?? {
    id: restId,
    einheitSchluessel: quelle.einheitSchluessel,
    empfangenAm: ablosendeEmpfangszeit(s.eintraege, quelle.einheitSchluessel, jetzt),
    quelle: "aufteilung",
    status: quelle.status,
    zugEtikett: quelle.zugEtikett,
    teilEtikett: quelle.teilEtikett,
    stammtVon: quelle.stammtVon,
    bogen: geteilt.rest,
  };

  const abgeteiltId = bogenInhaltsId(geteilt.abgeteilt);
  const abgeteilt: MeldeEintrag = s.eintraege.find((e) => e.id === abgeteiltId) ?? {
    id: abgeteiltId,
    einheitSchluessel: freierTeilSchluessel(
      s.eintraege.map((e) => e.einheitSchluessel),
      quelle.einheitSchluessel,
    ),
    empfangenAm: jetzt,
    quelle: "aufteilung",
    status: opt.status ?? MeldeStatus.ANWESEND,
    zugEtikett: opt.zugEtikett === undefined ? quelle.zugEtikett : opt.zugEtikett.trim() || undefined,
    teilEtikett: wahl.teilEtikett.trim(),
    stammtVon: {
      einheitSchluessel: quelle.einheitSchluessel,
      teilEtikett: quelle.teilEtikett,
      abgeteiltAm: jetzt,
    },
    bogen: geteilt.abgeteilt,
  };

  // Idempotent wie meldungHinzufuegen: identischer Inhalt ergibt dieselbe ID
  // (dieselbe Aufteilung binnen einer Minute nochmals ausgelöst) und wird nicht
  // erneut angehängt.
  for (const e of [rest, abgeteilt]) {
    if (!s.eintraege.some((x) => x.id === e.id)) s.eintraege.push(e);
  }
  s.geaendert = jetzt;
  einsaetzeSpeichern(liste);
  return { rest, abgeteilt };
}

export interface ZusammenfuehrungOptionen {
  /**
   * Neue Teil-Bezeichnung des Ziels. Fehlt das Feld, bleibt die bisherige
   * stehen; ein leerer Text entfernt sie — die Einheit ist wieder ganz.
   */
  teilEtikett?: string;
}

export interface ZusammenfuehrungErgebnis {
  /** Neue Revision der Einheit, in der jetzt alles steckt. */
  ziel: MeldeEintrag;
  /** Die Teile, die darin aufgegangen sind (Status AUFGEGANGEN). */
  aufgegangen: MeldeEintrag[];
}

/**
 * Abgeteilte Truppteile zurück in eine Meldung führen. Das Ziel bekommt eine
 * neue Revision mit allem darin; die eingegliederten Teile bleiben mit ihrer
 * Historie erhalten, fallen aber als AUFGEGANGEN aus den Summen — sonst wären
 * ihre Personen doppelt gezählt.
 *
 * Nur Teile DERSELBEN Einheit lassen sich zusammenführen (gleicher Stamm-
 * Fingerabdruck). Zwei verschiedene Einheiten zu verschmelzen wäre kein
 * Zusammenführen, sondern ein Datenverlust: die eine verschwände.
 *
 * Wie bei der Aufteilung tragen die Ergebnisse KEINE Signatur und keinen
 * Herkunfts-Payload — der Inhalt ist hier vor Ort entstanden.
 */
export function meldungenZusammenfuehren(
  einsatzId: string,
  zielEintragId: string,
  teilEintragIds: string[],
  opt: ZusammenfuehrungOptionen = {},
): ZusammenfuehrungErgebnis | null {
  const liste = alleEinsaetzeLaden();
  const s = liste.find((x) => x.id === einsatzId);
  if (!s) return null;
  const zielEintrag = s.eintraege.find((e) => e.id === zielEintragId);
  if (!zielEintrag) return null;
  const teile = teilEintragIds.map((id) => s.eintraege.find((e) => e.id === id));
  if (teile.some((e) => e == null)) return null;
  const quellen = teile as MeldeEintrag[];

  const stamm = stammSchluessel(zielEintrag.einheitSchluessel);
  if (quellen.some((e) => stammSchluessel(e.einheitSchluessel) !== stamm)) {
    throw new Error("Zusammenführen geht nur mit Teilen derselben Einheit.");
  }
  if (quellen.some((e) => e.einheitSchluessel === zielEintrag.einheitSchluessel)) {
    throw new Error("Ein Teil kann nicht mit sich selbst zusammengeführt werden.");
  }

  const stand = Math.max(jetztZeitpunkt(), ...[zielEintrag, ...quellen].map((e) => e.bogen.stand));
  const bogen = fuegeZusammen(
    zielEintrag.bogen,
    quellen.map((e) => e.bogen),
    stand,
  );
  const jetzt = Date.now();

  const id = bogenInhaltsId(bogen);
  const ziel: MeldeEintrag = s.eintraege.find((e) => e.id === id) ?? {
    id,
    einheitSchluessel: zielEintrag.einheitSchluessel,
    empfangenAm: ablosendeEmpfangszeit(s.eintraege, zielEintrag.einheitSchluessel, jetzt),
    quelle: "zusammenfuehrung",
    status: MeldeStatus.ANWESEND,
    zugEtikett: zielEintrag.zugEtikett,
    teilEtikett:
      opt.teilEtikett === undefined ? zielEintrag.teilEtikett : opt.teilEtikett.trim() || undefined,
    stammtVon: zielEintrag.stammtVon,
    bogen,
  };
  if (!s.eintraege.some((e) => e.id === ziel.id)) s.eintraege.push(ziel);

  for (const q of quellen) {
    q.status = MeldeStatus.AUFGEGANGEN;
    q.aufgegangenIn = { einheitSchluessel: zielEintrag.einheitSchluessel, zusammengefuehrtAm: jetzt };
  }
  s.geaendert = jetzt;
  einsaetzeSpeichern(liste);
  return { ziel, aufgegangen: quellen };
}

/**
 * Zug-/Verbands-Etikett einer Einheit setzen. Wirkt auf ALLE Revisionen der
 * Einheit — das Etikett beschreibt die Einheit (Zugzugehörigkeit), nicht die
 * einzelne Meldung; so bleiben Gruppierung und Historie konsistent. Leerer Text
 * entfernt das Etikett. Speichert nur bei tatsächlicher Änderung.
 */
export function einheitZugEtikettSetzen(einsatzId: string, einheitSchl: string, etikett: string): void {
  const liste = alleEinsaetzeLaden();
  const s = liste.find((x) => x.id === einsatzId);
  if (!s) return;
  const wert = etikett.trim() || undefined;
  let geaendert = false;
  for (const e of s.eintraege) {
    if (e.einheitSchluessel === einheitSchl && e.zugEtikett !== wert) {
      e.zugEtikett = wert;
      geaendert = true;
    }
  }
  if (geaendert) {
    s.geaendert = Date.now();
    einsaetzeSpeichern(liste);
  }
}
