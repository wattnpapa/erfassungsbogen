/**
 * Geprüfte Geräteuhr für alle Fristen der App.
 *
 * Die Datenschutzfrist regelt das Format (`@bos/eeb-format/datenschutzfrist`):
 * 90 Tage nach dem Stand eines Bogens verfallen seine Personaldaten, Übungen
 * sind ausgenommen. Dazu kommen die Aufräumfrist ruhender Sammlungen (90 Tage)
 * und die Papierkorbfrist (30 Tage), die der Kern mit der ungeprüften
 * `Date.now()` rechnet. Hier wird entschieden, welche Uhrzeit gilt: Die
 * Geräteuhr zählt, außer sie ist unplausibel weit nach vorn gesprungen (siehe
 * {@link geraeteuhrPruefen}, Audit Runde 4, R4-D1). Dann löscht und
 * anonymisiert die App nichts, und die Oberfläche warnt „Geräteuhr prüfen".
 * Dafür merkt sich die App den zuletzt akzeptierten Zeitpunkt unter
 * `eeb.uhr.v1`. Der Eintrag wandert wie alle `eeb.`-Einträge mit der
 * Datensicherung und fällt mit „Alle Daten löschen".
 */

import { jetztZeitpunkt, MINUTEN_JE_TAG, type EebZeitpunkt } from "@bos/eeb-format/model";
import type { Uhrstand } from "@bos/eeb-format/datenschutzfrist";

const SPEICHER_SCHLUESSEL = "eeb.uhr.v1";

/**
 * Ab diesem Vorsprung gegenüber dem letzten Start gilt die Geräteuhr als
 * gesprungen. Der Wert des Formats (`UHR_SPRUNG_TAGE`, 366 Tage) ließ ein
 * falsch gestelltes Jahr (+365 Tage) durch und löschte beim Start die laufende
 * Sammlung (Audit Runde 4, R4-D1); das Submodul ist hier nicht änderbar, die
 * App rechnet mit ihrem eigenen, engeren Wert. 60 Tage sind die
 * Ankündigungsfrist der Aufräumfrist: Was die App nach einer Pause von bis zu
 * 60 Tagen löscht, hat sie vorher angekündigt; was darüber hinausgeht, löscht
 * sie erst, wenn die Uhr einen Tag später noch dazu passt.
 */
export const UHR_SPRUNG_TAGE = 60;

/** Innerhalb dieses Fensters muss sich ein Sprung bestätigen, sonst beginnt die Prüfung neu. */
const SPRUNG_FENSTER_TAGE = 30;

/** Ergebnis der Uhrprüfung: Welche Zeit gilt, und ob die Geräteuhr dafür zurückgehalten wurde. */
export interface Uhrpruefung {
  /** Die Zeit, nach der sich alle Fristen richten. */
  zeitpunkt: EebZeitpunkt;
  /** Was die Geräteuhr gerade zeigt. */
  geraet: EebZeitpunkt;
  /** `true`: Die Geräteuhr liegt unplausibel weit vor dem letzten Start; `zeitpunkt` ist der letzte akzeptierte. */
  gehalten: boolean;
  stand: Uhrstand;
}

/**
 * Reine Prüfung wie `uhrPruefen` des Formats, nur mit {@link UHR_SPRUNG_TAGE}.
 * Liegt die Uhr mehr als diese Tage vor dem letzten Start, gilt weiter der
 * letzte akzeptierte Zeitpunkt. Den neuen übernimmt die App erst, wenn die Uhr
 * frühestens einen Tag später noch dazu passt. Eine zurückgestellte Uhr wird
 * nicht abgefangen (sie kann nur verhindern, was fällig wäre).
 */
export function geraeteuhrPruefen(jetzt: EebZeitpunkt, bisher: Uhrstand | null): Uhrpruefung {
  if (!bisher || jetzt - bisher.zuletzt <= UHR_SPRUNG_TAGE * MINUTEN_JE_TAG) {
    return { zeitpunkt: jetzt, geraet: jetzt, gehalten: false, stand: { zuletzt: jetzt } };
  }
  const s = bisher.sprung;
  const passtZumSprung = s != null && jetzt >= s && jetzt - s <= SPRUNG_FENSTER_TAGE * MINUTEN_JE_TAG;
  if (passtZumSprung && jetzt - s >= MINUTEN_JE_TAG) {
    return { zeitpunkt: jetzt, geraet: jetzt, gehalten: false, stand: { zuletzt: jetzt } };
  }
  return {
    zeitpunkt: bisher.zuletzt,
    geraet: jetzt,
    gehalten: true,
    stand: { zuletzt: bisher.zuletzt, sprung: passtZumSprung ? s : jetzt },
  };
}

/** JSON-String → Uhrstand. Defensiv: Müll ergibt null (wie ein erster Start). */
export function uhrstandAusJson(text: string | null): Uhrstand | null {
  if (!text) return null;
  try {
    const roh = JSON.parse(text) as Partial<Uhrstand> | null;
    if (typeof roh?.zuletzt !== "number") return null;
    return typeof roh.sprung === "number" ? { zuletzt: roh.zuletzt, sprung: roh.sprung } : { zuletzt: roh.zuletzt };
  } catch {
    return null;
  }
}

function speicher(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null; // z. B. Privatmodus/blockierter Speicher
  }
}

/**
 * Die geprüfte Uhr: Geräteuhr oder, bei unplausiblem Sprung, der letzte
 * akzeptierte Zeitpunkt. Schreibt den Uhrstand nur, wenn er sich geändert hat
 * — also höchstens einmal je Minute. Wer die Uhr bloß ansehen will
 * (`schreiben = false`: Ablage-Hülle, Vorlagen, Warnung), legt den Eintrag
 * nicht an; fortgeschrieben wird er beim Start über die Datenschutzfrist.
 */
export function geprueftesJetzt(jetzt: EebZeitpunkt = jetztZeitpunkt(), schreiben = true): Uhrpruefung {
  const s = speicher();
  let alt: string | null = null;
  try {
    alt = s?.getItem(SPEICHER_SCHLUESSEL) ?? null;
  } catch {
    /* blockierter Speicher — dann gilt die Geräteuhr ungeprüft */
  }
  const r = geraeteuhrPruefen(jetzt, uhrstandAusJson(alt));
  const neu = JSON.stringify(r.stand);
  if (schreiben && neu !== alt) {
    try {
      s?.setItem(SPEICHER_SCHLUESSEL, neu);
    } catch {
      /* Speicher voll o. ä. — die Prüfung darf nie die Arbeit stören */
    }
  }
  return r;
}

/**
 * Zeitpunkt, an dem die Datenschutzfrist gemessen wird (siehe
 * {@link geprueftesJetzt}).
 */
export function datenschutzZeitpunkt(jetzt: EebZeitpunkt = jetztZeitpunkt()): EebZeitpunkt {
  return geprueftesJetzt(jetzt).zeitpunkt;
}

/** Zurückgehaltene Geräteuhr: die Differenz zur Geräteuhr, einmal je Seitenaufruf festgehalten. */
let versatzMs: number | null = null;

/**
 * Um wie viele Millisekunden die Geräteuhr der geprüften Uhr voraus ist — 0,
 * solange sie plausibel ist. Der Kern rechnet Aufräum- und Papierkorbfrist mit
 * `Date.now()` (Submodul, nicht änderbar); die Ablage (uhr-korrektur.ts)
 * zieht diesen Versatz von den Zeitstempeln ab, bevor der Kern sie sieht.
 * Je Seitenaufruf bleibt der Wert gleich, sonst liefe die Umrechnung beim
 * Zurückschreiben auseinander.
 */
export function uhrVersatzMs(): number {
  const r = geprueftesJetzt(undefined, false);
  if (!r.gehalten) {
    versatzMs = null;
    return 0;
  }
  if (versatzMs == null) versatzMs = Math.max(0, (r.geraet - r.zeitpunkt) * 60_000);
  return versatzMs;
}

/** Die geprüfte Uhr in Millisekunden, zum Vergleich mit `Date.now()`-Zeitstempeln. */
export function geprueftesJetztMs(): number {
  return Date.now() - uhrVersatzMs();
}

/**
 * Warnung „Geräteuhr prüfen", solange die Geräteuhr zurückgehalten wird — sonst
 * `null`. Liest die Uhr frisch.
 */
export function uhrWarnung(): { geraet: EebZeitpunkt; zuletzt: EebZeitpunkt } | null {
  const r = geprueftesJetzt(undefined, false);
  return r.gehalten ? { geraet: r.geraet, zuletzt: r.zeitpunkt } : null;
}

/** Nur für Tests. */
export function uhrPruefungZuruecksetzen(): void {
  versatzMs = null;
}
