/**
 * Lokaler Personalstamm: die Helferliste einer Dienststelle, einmal aus einer CSV- oder Excel-Datei eingelesen
 * (personalstamm-import.ts) und auf diesem Gerät abgelegt. Aus ihm stellt „Wer ist dabei?" die Mannschaft eines
 * Bogens zusammen, über Einheiten und Fachgruppen hinweg — eine Vorlage ist dagegen an eine Einheit gebunden.
 *
 * Anders als ein Bogen enthält der Stamm auch Personen, die NICHT im Einsatz sind. Deshalb gilt (Wunsch aus dem
 * OV Markt Schwaben, 11/2026):
 *  - Er liegt nur im Speicher dieses Geräts. In einen Bogen, einen QR-Code oder eine PDF gelangen ausschließlich
 *    die Personen, die jemand ausgewählt hat.
 *  - Er reist NICHT in der Datensicherung mit (sicherung.ts, `BEIM_GERAET`): Die Quelle ist die Datei der
 *    Dienststelle, ein zweites Gerät liest sie selbst ein. So entsteht keine weitere Kopie der Liste.
 *  - Er lässt sich mit einem Tipp löschen; „Alle Daten löschen" nimmt ihn mit (Präfix `eeb.`).
 *  - Die Startseite nennt das Datum des Einlesens und erinnert, wenn der Stamm alt ist.
 *
 * Diese Datei steckt im Startbündel und bleibt deshalb klein: Typen, Ablage, Alter. Lesen der Dateien, Suche und
 * die Umsetzung in Personen eines Bogens laden nach.
 */

import type { Ernaehrung, Fahrerlaubnis, Geschlecht, StaerkeRolle } from "@bos/eeb-format/model";

export const STAMM_SCHLUESSEL = "eeb.personalstamm.v1";

/** Ab diesem Alter fragt die Startseite „neu einlesen?" — Helferlisten ändern sich mit jedem Lehrgang und Zugang. */
export const STAMM_ALT_TAGE = 90;

/** Mehr Zeilen liest der Import nicht ein; eine Dienststelle hat weit weniger. Schützt Speicher und Liste. */
export const STAMM_MAX_PERSONEN = 3000;

/** Eine Person des Stamms. Bewusst Text statt Vokabular-Codes: Der Stamm kennt die Organisation des Bogens nicht. */
export interface StammPerson {
  nachname: string;
  vorname: string;
  rolle: StaerkeRolle;
  /** Funktion wie in der Liste („GrFü", „Truppführer") — beim Auswählen ins Vokabular der Organisation übersetzt. */
  funktion?: string;
  qualifikationen: string[];
  /** Fahrerlaubnisklassen ohne die, die eine andere schon einschließt; höchste zuerst. */
  fahrerlaubnisse: Fahrerlaubnis[];
  /** Rufnummer, wie sie in der Liste steht. Fehlt, wenn Rufnummern nicht mit eingelesen wurden. */
  mobil?: string;
  /** Gruppe, Trupp oder Fachgruppe („B1", „N", „FGr E") — Filter bei der Auswahl, steht nicht im Bogen. */
  teileinheit?: string;
  geschlecht?: Geschlecht;
  ernaehrung?: Ernaehrung;
}

export interface Personalstamm {
  version: 1;
  /** Zeitpunkt des Einlesens (Date.now()). */
  importiert: number;
  /** Name der eingelesenen Datei, zur Wiedererkennung auf der Startseite. */
  quelle: string;
  personen: StammPerson[];
}

// ------------------------------------------------------------ Serialisierung (rein)

function istPerson(p: unknown): p is StammPerson {
  const q = p as Partial<StammPerson> | null;
  return (
    !!q &&
    typeof q.nachname === "string" &&
    typeof q.vorname === "string" &&
    typeof q.rolle === "number" &&
    Array.isArray(q.qualifikationen) &&
    Array.isArray(q.fahrerlaubnisse)
  );
}

/** Gespeicherter Text → Stamm. `null` bei fehlendem, fremdem oder beschädigtem Inhalt; kaputte Zeilen entfallen. */
export function stammAusJson(text: string | null): Personalstamm | null {
  if (!text) return null;
  let roh: unknown;
  try {
    roh = JSON.parse(text);
  } catch {
    return null;
  }
  const s = roh as Partial<Personalstamm> | null;
  if (!s || s.version !== 1 || !Array.isArray(s.personen) || typeof s.importiert !== "number") return null;
  return {
    version: 1,
    importiert: s.importiert,
    quelle: typeof s.quelle === "string" ? s.quelle : "",
    personen: s.personen.filter(istPerson),
  };
}

/** Alter des Stamms in ganzen Tagen (nie negativ, auch bei verstellter Uhr). */
export function stammAlterTage(stamm: Pick<Personalstamm, "importiert">, jetzt = Date.now()): number {
  return Math.max(0, Math.floor((jetzt - stamm.importiert) / 86_400_000));
}

export function stammIstAlt(stamm: Pick<Personalstamm, "importiert">, jetzt = Date.now()): boolean {
  return stammAlterTage(stamm, jetzt) >= STAMM_ALT_TAGE;
}

/** „12 Personen", „1 Person". */
export function stammAnzahlText(n: number): string {
  return `${n} ${n === 1 ? "Person" : "Personen"}`;
}

// ------------------------------------------------------------ Ablage (I/O)

function speicher(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null; // Privatmodus, gesperrter Speicher
  }
}

export function stammLaden(): Personalstamm | null {
  return stammAusJson(speicher()?.getItem(STAMM_SCHLUESSEL) ?? null);
}

/** Stamm ablegen (ersetzt den bisherigen). Wirft bei vollem oder gesperrtem Speicher — der Aufrufer meldet es. */
export function stammSpeichern(stamm: Personalstamm): void {
  const s = speicher();
  if (!s) throw new Error("Lokaler Speicher ist nicht verfügbar (Privatmodus?). Der Personalstamm lässt sich hier nicht ablegen.");
  s.setItem(STAMM_SCHLUESSEL, JSON.stringify(stamm));
}

/** Stamm endgültig vom Gerät entfernen. Schon erstellte Bögen und Vorlagen bleiben unberührt. */
export function stammLoeschen(): void {
  speicher()?.removeItem(STAMM_SCHLUESSEL);
}
