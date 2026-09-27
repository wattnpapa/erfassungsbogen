/**
 * Automatische Entwurfssicherung: der gerade bearbeitete Bogen wird bei jeder
 * Änderung still im localStorage abgelegt. Tab geschlossen, Akku leer, App im
 * Hintergrund beendet — beim nächsten Start bietet die Startseite „Aktuellen
 * Bogen fortsetzen" mit dem letzten Stand an. Verworfen wird der Entwurf erst,
 * wenn der Bogen bewusst geschlossen wird („Neuer Bogen", Übernahme in einen
 * Einsatz).
 *
 * Auch der Entwurf unterliegt der Datenschutzfrist: 90 Tage nach der letzten
 * Änderung (Übung ausgenommen) wird er beim Laden anonymisiert. Ein Bogen,
 * der so lange nicht angefasst wurde, ist kein laufender Einsatz mehr — und er
 * kann ebenso gut ein fremder, gescannter Bogen sein. Die Stammdaten der
 * eigenen Einheit gehören in „Meine Vorlagen", die keine Frist haben.
 */

import type { EebZeitpunkt, Erfassungsbogen } from "@bos/eeb-format/model";
import { bogenAnonymisiert, datenschutzfristAbgelaufen } from "@bos/eeb-format/datenschutzfrist";
import { migriereBogen } from "./hilfen";
import { datenschutzZeitpunkt } from "./datenschutz-uhr";

const SPEICHER_SCHLUESSEL = "eeb.entwurf.v1";

/**
 * Zweiter Platz: der zuletzt VERDRÄNGTE Entwurf. Die App führt genau einen
 * Arbeitsbogen; ein eintreffender Bogen (Link, QR, Datei, Beispiel) und jeder
 * „neu anfangen"-Weg setzen sich an dessen Stelle. Bis hierher war das
 * endgültig — wer mitten im eigenen Bogen eine fremde Meldung öffnete, hatte
 * seine Eingaben verloren. Der verdrängte Bogen wandert deshalb hierher und
 * lässt sich von der Startseite zurückholen; erst der übernächste Wechsel
 * überschreibt ihn.
 */
const ERSETZT_SCHLUESSEL = "eeb.entwurf.ersetzt.v1";

export interface Entwurf {
  gespeichert: number; // Date.now()
  bogen: Erfassungsbogen;
  /**
   * Gesetzt, wenn der Bogen die Bearbeitung einer gespeicherten Vorlage ist
   * („Bearbeiten" auf der Vorlagenkarte). Nur die Kennung — so findet die App
   * nach einem Neustart wieder zu der Vorlage, in die „Vorlage aktualisieren"
   * zurückschreibt. Fehlt = gewöhnlicher Arbeitsbogen.
   */
  vorlageId?: string;
}

// ------------------------------------------------- Serialisierung (rein)

/** JSON-String → Entwurf. Defensiv: Müll oder fremdes Format ergibt null. */
export function entwurfAusJson(text: string | null): Entwurf | null {
  if (!text) return null;
  let roh: unknown;
  try {
    roh = JSON.parse(text);
  } catch {
    return null;
  }
  const e = roh as Entwurf;
  if (!e || typeof e.gespeichert !== "number" || !e.bogen || !Array.isArray(e.bogen.personal)) return null;
  try {
    e.bogen = migriereBogen(e.bogen);
  } catch {
    return null;
  }
  if (typeof e.vorlageId !== "string" || !e.vorlageId) delete e.vorlageId;
  return e;
}

export function entwurfZuJson(bogen: Erfassungsbogen, gespeichert = Date.now(), vorlageId?: string): string {
  return JSON.stringify(vorlageId ? { gespeichert, bogen, vorlageId } : { gespeichert, bogen });
}

/** Entwurf nach der Datenschutzfrist — anonymisiert, wenn sie abgelaufen ist. */
export function entwurfNachFrist(e: Entwurf, jetzt: EebZeitpunkt): Entwurf {
  return datenschutzfristAbgelaufen(e.bogen, jetzt) ? { ...e, bogen: bogenAnonymisiert(e.bogen) } : e;
}

// ------------------------------------------------- localStorage-Hülle (I/O)

function speicher(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null; // z. B. Privatmodus/blockierter Speicher
  }
}

/** Entwurf laden; ist die Datenschutzfrist abgelaufen, wird er auch im Speicher überschrieben. */
export function entwurfLaden(jetzt: EebZeitpunkt = datenschutzZeitpunkt()): Entwurf | null {
  return ausSpeicherLaden(SPEICHER_SCHLUESSEL, jetzt);
}

function ausSpeicherLaden(schluessel: string, jetzt: EebZeitpunkt): Entwurf | null {
  const s = speicher();
  if (!s) return null;
  const roh = s.getItem(schluessel);
  const e = entwurfAusJson(roh);
  if (!e) return null;
  const nachFrist = entwurfNachFrist(e, jetzt);
  if (nachFrist !== e) {
    const text = entwurfZuJson(nachFrist.bogen, nachFrist.gespeichert, nachFrist.vorlageId);
    if (text !== roh) {
      try {
        s.setItem(schluessel, text);
      } catch {
        /* Speicher voll o. ä. — angezeigt wird trotzdem nur die anonymisierte Fassung */
      }
    }
  }
  return nachFrist;
}

/**
 * `vorlageId`: der Bogen ist die Bearbeitung dieser gespeicherten Vorlage (siehe `Entwurf`).
 *
 * Rückgabe: true = gespeichert, false = nicht gespeichert (Speicher voll,
 * blockiert). Das Autosave darf die Bearbeitung nie stören — aber die
 * Anzeige „automatisch gespeichert" darf auch nicht lügen (Audit „Offline
 * und Speicher", O1): der Aufrufer zeigt bei false den Fehlzustand.
 */
export function entwurfSpeichern(bogen: Erfassungsbogen, vorlageId?: string): boolean {
  const s = speicher();
  if (!s) return false;
  const text = entwurfZuJson(bogen, Date.now(), vorlageId);
  try {
    s.setItem(SPEICHER_SCHLUESSEL, text);
  } catch {
    return false;
  }
  // Manche Browser scheitern still: dem Speicher glauben, nicht dem Aufruf.
  return s.getItem(SPEICHER_SCHLUESSEL) === text;
}

export function entwurfVerwerfen(): void {
  speicher()?.removeItem(SPEICHER_SCHLUESSEL);
}

// --------------------------------------------- Verdrängter Entwurf (Rückholung)

/**
 * Den Bogen merken, der gerade von einem anderen verdrängt wird. Ein leerer
 * Bogen ist nichts wert und würde nur eine sinnlose Rückhol-Zeile erzeugen —
 * das entscheidet die aufrufende Stelle (siehe `bogenHatInhalt`).
 */
export function ersetztenEntwurfMerken(bogen: Erfassungsbogen): void {
  try {
    speicher()?.setItem(ERSETZT_SCHLUESSEL, entwurfZuJson(bogen));
  } catch {
    /* Speicher voll o. ä. — der Wechsel selbst darf daran nicht scheitern */
  }
}

export function ersetztenEntwurfLaden(jetzt: EebZeitpunkt = datenschutzZeitpunkt()): Entwurf | null {
  return ausSpeicherLaden(ERSETZT_SCHLUESSEL, jetzt);
}

export function ersetztenEntwurfVerwerfen(): void {
  speicher()?.removeItem(ERSETZT_SCHLUESSEL);
}
