/**
 * Geprüfte Geräteuhr für alle Fristen der App.
 *
 * Die Datenschutzfrist regelt das Format (`@bos/eeb-format/datenschutzfrist`):
 * 90 Tage nach dem Stand eines Bogens verfallen seine Personaldaten, Übungen
 * sind ausgenommen. Dazu kommen die Aufräumfrist ruhender Sammlungen (90 Tage)
 * und die Papierkorbfrist (30 Tage), die der Kern mit der ungeprüften
 * `Date.now()` rechnet. Hier wird entschieden, welche Uhrzeit gilt.
 *
 * Die Geräteuhr zählt, außer sie weicht unplausibel weit vom letzten Start ab
 * (mehr als {@link UHR_SPRUNG_TAGE} Tage, vor oder zurück). Dann löscht und
 * anonymisiert die App nichts, und die Oberfläche fragt „Geräteuhr prüfen".
 * Dafür merkt sich die App den zuletzt akzeptierten Zeitpunkt unter
 * `eeb.uhr.v1`.
 *
 * Ein Sprung wird NIE durch bloßen Zeitablauf bestätigt (Audit Runde 5,
 * R5-D1). Die Runde-4-Fassung übernahm ihn einen Tag später selbst und
 * löschte dann alle Sammlungen und anonymisierte den Entwurf — die App kann
 * nicht wissen, ob die Uhr falsch steht oder ob wirklich ein Jahr vergangen
 * ist. Jetzt bleibt die Uhr „nicht bestätigt", bis der Helfer „Geräteuhr
 * stimmt" tippt ({@link uhrBestaetigen}) oder die Uhr wieder zum letzten Start
 * passt. Nur wenn der Sprung nichts fällig machte (echte Pause, nichts
 * Altes auf dem Gerät), übernimmt die App ihn ohne Frage.
 */

import { jetztZeitpunkt, MINUTEN_JE_TAG, type EebZeitpunkt } from "@bos/eeb-format/model";
import type { Uhrstand } from "@bos/eeb-format/datenschutzfrist";
import { folgenVorhanden, msAusZeitpunkt, uhrFolgen, type UhrFolgen } from "./uhr-folgen";

const SPEICHER_SCHLUESSEL = "eeb.uhr.v1";

/**
 * Ab diesem Abstand zum letzten Start gilt die Geräteuhr als gesprungen. Der
 * Wert des Formats (`UHR_SPRUNG_TAGE`, 366 Tage) ließ ein falsch gestelltes
 * Jahr (+365 Tage) durch und löschte beim Start die laufende Sammlung (Audit
 * Runde 4, R4-D1); das Submodul ist hier nicht änderbar, die App rechnet mit
 * ihrem eigenen, engeren Wert. 60 Tage sind die Ankündigungsfrist der
 * Aufräumfrist: Was die App nach einer Pause von bis zu 60 Tagen löscht, hat
 * sie vorher angekündigt. Darüber fragt sie, bevor etwas fällt.
 */
export const UHR_SPRUNG_TAGE = 60;

/** Ergebnis der Uhrprüfung: Welche Zeit gilt, und ob die Geräteuhr dafür zurückgehalten wurde. */
export interface Uhrpruefung {
  /** Die Zeit, nach der sich alle Fristen richten. */
  zeitpunkt: EebZeitpunkt;
  /** Was die Geräteuhr gerade zeigt. */
  geraet: EebZeitpunkt;
  /** `true`: Die Geräteuhr weicht unplausibel weit vom letzten Start ab und ist nicht bestätigt. */
  gehalten: boolean;
  /** Bei `gehalten`: ging die Geräteuhr vor oder zurück? */
  richtung: "vor" | "zurueck" | null;
  stand: Uhrstand;
}

/**
 * Reine Prüfung wie `uhrPruefen` des Formats, nur mit {@link UHR_SPRUNG_TAGE}
 * und ohne Bestätigung durch Zeitablauf (R5-D1).
 *
 * - Abstand bis 60 Tage: Die Uhr gilt, der Stand rückt nach (auch eine
 *   Uhr, die wieder zum letzten Start passt, beendet die Rückfrage).
 * - Darüber, und der Sprung steht noch aus: Hat die Geräteuhr mehr als
 *   nichts zu löschen (`faelligWuerde`), bleibt der letzte akzeptierte
 *   Zeitpunkt und der Sprung wird vermerkt. Ohne Folgen (echte Pause, leeres
 *   oder junges Gerät) und beim Vorwärtssprung übernimmt die App ihn ohne
 *   Frage. Ein Rückwärtssprung wird immer festgehalten: Er löscht nichts,
 *   würde aber den Stand zurückdrehen, sodass die korrigierte Uhr danach
 *   wie ein Sprung nach vorn aussähe (R5-O5).
 * - Ist der Sprung schon vermerkt, bleibt es dabei, bis die Uhr zurückpasst
 *   oder der Helfer bestätigt.
 */
export function geraeteuhrPruefen(
  jetzt: EebZeitpunkt,
  bisher: Uhrstand | null,
  faelligWuerde: () => boolean = () => true,
  /**
   * Würde der Sprung etwas fällig machen, das noch nicht angekündigt war (Ruhe bei
   * Tag 30 bis 59 vor dem letzten Start; die Ankündigung beginnt bei Tag 60)? Dann
   * fragt die App schon bei kürzeren Sprüngen (Audit Runde 6, R6-D7).
   */
  unangekuendigt: () => boolean = () => false,
): Uhrpruefung {
  const annehmen = (): Uhrpruefung => ({
    zeitpunkt: jetzt,
    geraet: jetzt,
    gehalten: false,
    richtung: null,
    stand: { zuletzt: jetzt },
  });
  if (!bisher) return annehmen();
  const abstand = jetzt - bisher.zuletzt;
  if (Math.abs(abstand) <= UHR_SPRUNG_TAGE * MINUTEN_JE_TAG) {
    // Unter 30 Tagen Sprung kann nichts Unangekündigtes fällig werden (90 − 60 Tage).
    // Auch bei schon vermerktem Sprung (R7-D2): Der Halt gilt, bis jemand antwortet.
    const kannUeberraschen = abstand > 30 * MINUTEN_JE_TAG && unangekuendigt();
    if (!kannUeberraschen) return annehmen();
  }
  const vor = abstand > 0;
  if (bisher.sprung == null && vor && !faelligWuerde()) return annehmen();
  return {
    // Vorwärts rechnet alles mit dem letzten akzeptierten Zeitpunkt (nichts
    // wird fällig). Rückwärts ist die Geräteuhr die frühere und löscht von
    // sich aus nichts.
    zeitpunkt: vor ? bisher.zuletzt : jetzt,
    geraet: jetzt,
    gehalten: true,
    richtung: vor ? "vor" : "zurueck",
    stand: { zuletzt: bisher.zuletzt, sprung: bisher.sprung ?? jetzt },
  };
}

/**
 * Ein Zeitpunkt in Minuten seit 1970, der als Uhrstand taugt: endlich und
 * zwischen 1970 und rund 2084. Ein Wert aus einer fremden Fassung wäre sonst
 * „Invalid Date (1238983256 Tage danach)" in der Rückfrage (R7-O7).
 */
function zeitpunktPlausibel(wert: unknown): wert is number {
  return typeof wert === "number" && Number.isFinite(wert) && wert > 0 && wert < 60_000_000;
}

/** JSON-String → Uhrstand. Defensiv: Müll ergibt null (wie ein erster Start). */
export function uhrstandAusJson(text: string | null): Uhrstand | null {
  if (!text) return null;
  try {
    const roh = JSON.parse(text) as Partial<Uhrstand> | null;
    if (!zeitpunktPlausibel(roh?.zuletzt)) return null;
    return zeitpunktPlausibel(roh.sprung) ? { zuletzt: roh.zuletzt, sprung: roh.sprung } : { zuletzt: roh.zuletzt };
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
  const bisher = uhrstandAusJson(alt);
  const r = geraeteuhrPruefen(
    jetzt,
    bisher,
    () => folgenVorhanden(uhrFolgen(msAusZeitpunkt(jetzt))),
    () =>
      bisher != null &&
      folgenVorhanden(uhrFolgen(msAusZeitpunkt(jetzt), undefined, msAusZeitpunkt(bisher.zuletzt))),
  );
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
 * solange sie plausibel ist, negativ bei einer nachgehenden Uhr. Der Kern
 * rechnet Aufräum- und Papierkorbfrist mit `Date.now()` (Submodul, nicht
 * änderbar); die Ablage (uhr-korrektur.ts) zieht diesen Versatz von den
 * Zeitstempeln ab, bevor der Kern sie sieht. Je Seitenaufruf bleibt der Wert
 * gleich, sonst liefe die Umrechnung beim Zurückschreiben auseinander.
 */
export function uhrVersatzMs(): number {
  const r = geprueftesJetzt(undefined, false);
  if (!r.gehalten) {
    versatzMs = null;
    return 0;
  }
  if (versatzMs == null) {
    // Gerät minus letzter akzeptierter Zeitpunkt, vor- wie rückwärts: Die
    // Stempel der Sammlungen liegen während der falschen Uhr in der echten
    // Zeitlinie und sehen nach dem Richtigstellen nicht uralt oder
    // zukünftig aus.
    const bezug = uhrstandAusJson(rohStand())?.zuletzt ?? r.zeitpunkt;
    versatzMs = (r.geraet - bezug) * 60_000;
  }
  return versatzMs;
}

function rohStand(): string | null {
  try {
    return speicher()?.getItem(SPEICHER_SCHLUESSEL) ?? null;
  } catch {
    return null;
  }
}

/** Die geprüfte Uhr in Millisekunden, zum Vergleich mit `Date.now()`-Zeitstempeln. */
export function geprueftesJetztMs(): number {
  return Date.now() - uhrVersatzMs();
}

/**
 * Stempelzeit für neue Stände (Bogen, Vorlage, „Stärke ändern…"): die
 * geprüfte Uhr, nicht die falsche Geräteuhr (Audit Runde 5, R5-E2). Mit der
 * Geräteuhr gestempelt, trug eine Fassung bei vorgestellter Uhr einen Stand
 * in der Zukunft, und jede spätere Änderung blieb hinter ihr zurück.
 */
export function stempelZeitpunkt(): EebZeitpunkt {
  return jetztZeitpunkt() - Math.round(uhrVersatzMs() / 60_000);
}

/** Warnung „Geräteuhr prüfen" (siehe {@link uhrWarnung}). */
export interface UhrWarnungDaten {
  geraet: EebZeitpunkt;
  zuletzt: EebZeitpunkt;
  richtung: "vor" | "zurueck";
  /** Tage zwischen letztem Start und Geräteuhr. */
  tage: number;
  /** Was „Geräteuhr stimmt" endgültig löscht oder anonymisiert. */
  folgen: UhrFolgen;
}

/**
 * Warnung „Geräteuhr prüfen", solange die Geräteuhr nicht bestätigt ist —
 * sonst `null`. Liest die Uhr frisch.
 */
export function uhrWarnung(): UhrWarnungDaten | null {
  const r = geprueftesJetzt(undefined, false);
  if (!r.gehalten || !r.richtung) return null;
  const zuletzt = uhrstandAusJson(rohStand())?.zuletzt ?? r.zeitpunkt;
  return {
    geraet: r.geraet,
    zuletzt,
    richtung: r.richtung,
    tage: Math.max(1, Math.round(Math.abs(r.geraet - zuletzt) / MINUTEN_JE_TAG)),
    folgen: uhrFolgen(msAusZeitpunkt(r.geraet)),
  };
}

/**
 * „Geräteuhr stimmt": Der Helfer bestätigt das Datum des Geräts. Ab dem
 * nächsten Lesen gilt die Geräteuhr; was dadurch fällig ist, wird gelöscht
 * oder anonymisiert. Rückgabe: false, wenn der Stand nicht geschrieben werden
 * konnte (Speicher gesperrt) — dann bleibt die Rückfrage stehen.
 */
export function uhrBestaetigen(jetzt: EebZeitpunkt = jetztZeitpunkt()): boolean {
  versatzMs = null;
  try {
    const s = speicher();
    if (!s) return false;
    s.setItem(SPEICHER_SCHLUESSEL, JSON.stringify({ zuletzt: jetzt }));
    return s.getItem(SPEICHER_SCHLUESSEL) === JSON.stringify({ zuletzt: jetzt });
  } catch {
    return false;
  }
}

/** Nur für Tests. */
export function uhrPruefungZuruecksetzen(): void {
  versatzMs = null;
}
