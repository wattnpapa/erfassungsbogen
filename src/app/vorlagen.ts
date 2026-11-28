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

import type { Erfassungsbogen } from "@bos/eeb-format/model";
import { KontaktArt, datumAusIso, mitTransportVersion, staerke } from "@bos/eeb-format/model";
import { bogenPruefen, dateinameTeil, einheitAnzeigename, migriereBogen } from "./hilfen";
import { bogenBefund } from "./bogen-pruefung";
import { einsatzVorgabe } from "./zeitraum-eingabe";
import { aktive, imPapierkorb, papierkorbBereinigt } from "@bos/meldekopf/papierkorb";
import { geprueftesJetztMs, stempelZeitpunkt } from "./datenschutz-uhr";
import { rettungGesperrtFehler, rettungWiederholenFaellig, schreibenErlaubt, unlesbarerGesamttext, unlesbareVorlagenteile, vorlagenRetten } from "./unlesbar";

/** Versionierter Schlüssel — erlaubt spätere Formatwechsel der Sammlung selbst. */
const SPEICHER_SCHLUESSEL = "eeb.vorlagen.v1";

export interface Vorlage {
  id: string;
  name: string;
  erstellt: number; // Date.now()
  geaendert: number;
  /** Schnellstart-Vorlage für die App-Icon-Kurzaktion (0..1 pro Gerät). */
  standard?: boolean;
  /** Im Papierkorb seit (Date.now()); fehlt = aktiv. Siehe papierkorb.ts. */
  geloeschtAm?: number;
  /**
   * Zuletzt bestätigt, dass die Mannschaft stimmt (Date.now()): beim Anlegen,
   * bei „Vorlage aktualisieren" und mit „Stimmt noch" auf der Karte — nicht
   * beim Umbenennen. Fehlt (ältere Vorlagen) = `geaendert`. Grundlage der
   * Erinnerung nach VORLAGE_PRUEFEN_TAGE (DSFA M15).
   */
  mannschaftGeprueft?: number;
  /** Einsatzfreier Bogen: einheit + personal + fahrzeuge + Standard-Sofortbedarf. */
  bogen: Erfassungsbogen;
}

/**
 * Nach so vielen Tagen ohne Änderung oder Bestätigung fragt die Vorlagenkarte,
 * ob die Mannschaft noch stimmt. Eine Vorlage hat keine Datenschutzfrist (sie
 * ist der Ausdruck in der Führungsmappe); ohne Erinnerung wanderten
 * ausgeschiedene Helfer jahrelang mit, samt Rufnummern (DSFA M15). Halbjährlich
 * statt der 90 Tage des Personalstamms: Eine Mannschaft ändert sich langsamer
 * als die Helferliste einer Dienststelle, und eine Erinnerung, die zu oft kommt,
 * wird weggetippt.
 */
export const VORLAGE_PRUEFEN_TAGE = 180;

/** Zeitpunkt, ab dem das Alter der Mannschaft zählt. */
export function mannschaftStand(v: Pick<Vorlage, "geaendert" | "mannschaftGeprueft">): number {
  return v.mannschaftGeprueft ?? v.geaendert;
}

/** Tage seit der letzten Änderung oder Bestätigung der Mannschaft (nie negativ, auch bei verstellter Uhr). */
export function mannschaftAlterTage(v: Pick<Vorlage, "geaendert" | "mannschaftGeprueft">, jetzt = Date.now()): number {
  return Math.max(0, Math.floor((jetzt - mannschaftStand(v)) / 86_400_000));
}

export function mannschaftPruefen(v: Pick<Vorlage, "geaendert" | "mannschaftGeprueft">, jetzt = Date.now()): boolean {
  return mannschaftAlterTage(v, jetzt) >= VORLAGE_PRUEFEN_TAGE;
}

/**
 * Private Rufnummern und Adressen der Personen (Kontakt nicht dienstlich).
 * Ein Funkrufname ist nie privat. „Vorlage teilen" nennt die Zahl vor dem
 * Teilen (DSFA M15).
 */
export function privateKontakte(b: Pick<Erfassungsbogen, "personal">): number {
  return b.personal.reduce((n, p) => n + p.kontakte.filter((k) => !k.dienstlich && k.art !== KontaktArt.FUNK).length, 0);
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
  kopie.stand = stempelZeitpunkt();
  kopie.einsatz = einsatzVorgabe(t);
  return kopie;
}

/** Musterungsauswahl: welche Personen/Fahrzeuge (nach Index) sind anwesend? */
export interface MusterungAuswahl {
  personal: boolean[];
  fahrzeuge: boolean[];
  /**
   * Den Standard-Sofortbedarf der Vorlage übernehmen? Fehlt/false = nein.
   * Er gehört zum letzten Einsatz, nicht zur Einheit: still übernommen, stand
   * „120 l Diesel" im nächsten Alarm und am Meldekopf in der Bedarfssumme
   * (Audit Runde 2, R2-W1). Wer ihn will, hakt ihn in der Musterung bewusst an.
   */
  sofortbedarf?: boolean;
  /**
   * Die Bemerkung („Sonstiges") der Vorlage übernehmen? Fehlt/false = nein.
   * Sie beschreibt oft den Stand beim Speichern („2 Sollplätze unbesetzt, Anh
   * in Instandsetzung") und stimmte nach der Musterung nicht mehr — still
   * übernommen stand sie falsch im übergebenen Bogen (Audit Runde 3, R3-H7).
   */
  sonstiges?: boolean;
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
  if (!auswahl.sonstiges) delete b.sonstiges;
  if (!auswahl.sofortbedarf) delete b.sofortbedarf;
  // Übernommen: die Verpflegung folgt der gemusterten Stärke, nicht der
  // Stärke, mit der die Vorlage gespeichert wurde.
  else if (b.sofortbedarf && b.sofortbedarf.verpflegungPersonen > 0) {
    b.sofortbedarf = { ...b.sofortbedarf, verpflegungPersonen: staerke(b).gesamt };
  }
  return b;
}

/** „4 Personen, 1 Fahrzeug" — was eine Vorlage bzw. ein Bogen an Mannschaft und Technik trägt (R12-D1). */
export function vorlageZahlenText(b: Pick<Erfassungsbogen, "personal" | "fahrzeuge">): string {
  const p = b.personal.length;
  const f = b.fahrzeuge.length;
  return `${p} ${p === 1 ? "Person" : "Personen"}, ${f} ${f === 1 ? "Fahrzeug" : "Fahrzeuge"}`;
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
    // Wie an den Eingängen: ergänzen, was sich leer lassen lässt; sonst weglassen
    // (Audit Runde 6, R6-E1: eine Vorlage ohne Fahrzeuge legte die Startseite lahm).
    if (!bogenBefund(e.bogen).ok) continue;
    liste.push(e);
  }
  return liste;
}

export function vorlagenZuJson(liste: Vorlage[]): string {
  return JSON.stringify(liste);
}

// ------------------------------------------------- Vorlagen-Datei (rein)
//
// Eine einzelne Vorlage als JSON-Datei — für die Ablage in einer Cloud oder
// den Versand per Mail, damit sie auf einem anderen Gerät wieder eingelesen
// werden kann. Anders als die Komplett-Sicherung (sicherung.ts) trägt die
// Datei nur diese eine Vorlage und keinen Geräteschlüssel.

const DATEI_FORMAT = "eeb-vorlage";
const DATEI_VERSION = 1;

interface VorlagenDatei {
  format: typeof DATEI_FORMAT;
  version: number;
  name: string;
  bogen: Erfassungsbogen;
}

export function vorlageDateiname(v: Vorlage): string {
  return `eeb-vorlage-${dateinameTeil(v.name)}.json`;
}

export function vorlageDateiInhalt(v: Vorlage): string {
  const d: VorlagenDatei = {
    format: DATEI_FORMAT,
    version: DATEI_VERSION,
    name: v.name,
    bogen: mitTransportVersion(v.bogen),
  };
  return JSON.stringify(d, null, 2);
}

/**
 * Dateitext → Name und Bogen der Vorlage. `null`, wenn es gar keine
 * Vorlagen-Datei ist (dann versucht der Aufrufer den Bogen-Weg); wirft mit
 * verständlicher Meldung, wenn sie es ist, aber nicht gelesen werden kann.
 */
export function vorlageAusDatei(text: string): { name: string; bogen: Erfassungsbogen } | null {
  let roh: unknown;
  try {
    roh = JSON.parse(text);
  } catch {
    return null;
  }
  const d = roh as Partial<VorlagenDatei> | null;
  if (d?.format !== DATEI_FORMAT) return null;
  if (typeof d.version !== "number" || d.version > DATEI_VERSION) {
    throw new Error(`Vorlage stammt aus einer neueren App-Version (Format ${d.version}) — bitte erst die App aktualisieren.`);
  }
  const bogen = bogenPruefen(d.bogen);
  const name = typeof d.name === "string" && d.name.trim() ? d.name.trim() : einheitAnzeigename(bogen.einheit);
  return { name, bogen };
}

// ------------------------------------------------- localStorage-Hülle (I/O)

function speicher(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null; // z. B. Privatmodus/blockierter Speicher
  }
}

let zuletztGeprueft: string | null | undefined;

/**
 * Komplette Liste inkl. Papierkorb — Basis aller Mutationen, damit beim
 * Zurückschreiben keine Papierkorb-Einträge verloren gehen. Abgelaufene
 * Einträge werden hier endgültig bereinigt (und der Stand persistiert).
 */
function alleVorlagenLaden(): Vorlage[] {
  const s = speicher();
  if (!s) return [];
  // Was `vorlagenAusJson` überspringt, ginge beim nächsten Schreiben verloren:
  // erst beiseitelegen, damit es sich sichern lässt (R7-E2).
  const roh = s.getItem(SPEICHER_SCHLUESSEL);
  if (roh !== zuletztGeprueft || rettungWiederholenFaellig("vorlagen")) {
    zuletztGeprueft = roh;
    const unlesbar = unlesbareVorlagenteile(roh);
    const text = unlesbarerGesamttext(roh, "vorlagen");
    vorlagenRetten(roh, unlesbar, text);
  }
  // Die geprüfte Uhr, nicht die Geräteuhr (R4-D1).
  const r = papierkorbBereinigt(vorlagenAusJson(s.getItem(SPEICHER_SCHLUESSEL)), geprueftesJetztMs());
  if (r.entfernt > 0) vorlagenSpeichern(r.liste);
  return r.liste;
}

/** Aktive Vorlagen (ohne Papierkorb) — das, was Listen anzeigen. */
export function vorlagenLaden(): Vorlage[] {
  return aktive(alleVorlagenLaden());
}

/** Vorlagen im Papierkorb, zuletzt gelöschte zuerst. */
export function vorlagenPapierkorb(): Vorlage[] {
  return imPapierkorb(alleVorlagenLaden());
}

export function vorlagenSpeichern(liste: Vorlage[]): void {
  const s = speicher();
  // Ließ sich ein beschädigter Vorlagentext nicht beiseitelegen (Speicher voll), bleibt er unverändert liegen (R9-O1).
  if (s && !schreibenErlaubt("vorlagen", s.getItem(SPEICHER_SCHLUESSEL))) throw rettungGesperrtFehler();
  s?.setItem(SPEICHER_SCHLUESSEL, vorlagenZuJson(liste));
}

let notfallZaehler = 0;

/**
 * Kennung einer Vorlage. `randomUUID` gibt es nur im sicheren Kontext (https
 * bzw. localhost); über eine schlichte http-Adresse aufgerufen fehlt es. Der
 * Rückfall nimmt dann `getRandomValues` — das steht auch dort zur Verfügung —
 * statt `Math.random`, dessen Werte sich aus wenigen Ausgaben vorhersagen
 * lassen. Sicherheitsrelevant ist das hier nicht (die Kennung ist eine lokale
 * Datensatz-Nummer, kein Geheimnis), aber ein vorhersagbarer Zufallsgenerator
 * hat in einem Projekt mit Signaturen auch an harmloser Stelle nichts zu suchen.
 */
function neueId(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  if (c?.getRandomValues) {
    const bytes = c.getRandomValues(new Uint8Array(16));
    return `v${Date.now()}-${[...bytes].map((b) => b.toString(16).padStart(2, "0")).join("")}`;
  }
  // Weder das eine noch das andere: dann bleibt nur der Zeitstempel, und ein
  // Zähler hält zwei Vorlagen derselben Millisekunde auseinander.
  return `v${Date.now()}-${(notfallZaehler++).toString(36)}`;
}

/**
 * Bogen als neue Vorlage ablegen (einsatzfrei normalisiert) und zurückgeben.
 * Nutzbar sowohl beim Speichern aus der Übersicht als auch beim QR-Import.
 */
export function vorlageAnlegen(name: string, bogen: Erfassungsbogen): Vorlage {
  const liste = alleVorlagenLaden();
  const jetzt = Date.now();
  const v: Vorlage = {
    id: neueId(),
    name: name.trim() || einheitAnzeigename(bogen.einheit),
    erstellt: jetzt,
    geaendert: jetzt,
    mannschaftGeprueft: jetzt,
    bogen: bogenAlsVorlage(bogen),
  };
  liste.push(v);
  vorlagenSpeichern(liste);
  return v;
}

/**
 * Bogen einer bestehenden Vorlage ersetzen („Bearbeiten" auf der Vorlagenkarte:
 * Vorlage → Assistent → „Vorlage aktualisieren"). Der Bogen wird wie beim
 * Anlegen einsatzfrei normalisiert. Liegt die Vorlage inzwischen im Papierkorb,
 * holt die Aktualisierung sie zurück — wer sie gerade ändert, will sie
 * behalten. Liefert die aktualisierte Vorlage, oder null, wenn es sie nicht
 * mehr gibt (endgültig gelöscht).
 */
export function vorlageAktualisieren(id: string, bogen: Erfassungsbogen): Vorlage | null {
  const liste = alleVorlagenLaden();
  const alt = liste.find((v) => v.id === id);
  if (!alt) return null;
  const { geloeschtAm: _, ...rest } = alt;
  const jetzt = Date.now();
  const neu: Vorlage = { ...rest, bogen: bogenAlsVorlage(bogen), geaendert: jetzt, mannschaftGeprueft: jetzt };
  vorlagenSpeichern(liste.map((v) => (v.id === id ? neu : v)));
  return neu;
}

/**
 * Eine Vorlage wieder auf eine frühere Fassung setzen — das „Rückgängig" nach
 * „Vorlage aktualisieren" (Audit Runde 2, R2-D2).
 */
export function vorlageZuruecksetzen(fassung: Vorlage): void {
  vorlagenSpeichern(alleVorlagenLaden().map((v) => (v.id === fassung.id ? fassung : v)));
}

export function vorlageUmbenennen(id: string, name: string): void {
  vorlagenSpeichern(
    alleVorlagenLaden().map((v) =>
      v.id === id ? { ...v, name: name.trim() || v.name, geaendert: Date.now() } : v,
    ),
  );
}

/** „Stimmt noch": Mannschaft bestätigt, ohne die Vorlage zu ändern (DSFA M15). */
export function mannschaftBestaetigen(id: string): void {
  const jetzt = Date.now();
  vorlagenSpeichern(alleVorlagenLaden().map((v) => (v.id === id ? { ...v, mannschaftGeprueft: jetzt } : v)));
}

/** In den Papierkorb verschieben (30 Tage wiederherstellbar). */
export function vorlageLoeschen(id: string): void {
  vorlagenSpeichern(
    alleVorlagenLaden().map((v) => (v.id === id ? { ...v, geloeschtAm: geprueftesJetztMs() } : v)),
  );
}

/** Aus dem Papierkorb zurückholen. */
export function vorlageWiederherstellen(id: string): void {
  vorlagenSpeichern(
    alleVorlagenLaden().map((v) => {
      if (v.id !== id) return v;
      const { geloeschtAm: _, ...rest } = v;
      return rest;
    }),
  );
}

/** Endgültig löschen (nur aus dem Papierkorb heraus angeboten). */
export function vorlageEndgueltigLoeschen(id: string): void {
  vorlagenSpeichern(alleVorlagenLaden().filter((v) => v.id !== id));
}
