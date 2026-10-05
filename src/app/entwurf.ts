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
import type { UebergabeStand } from "./uebergabe-stand";

const SPEICHER_SCHLUESSEL = "eeb.entwurf.v1";

/**
 * Zweiter Platz: der zuletzt VERDRÄNGTE Entwurf. Die App führt genau einen
 * Arbeitsbogen; ein eintreffender Bogen (Link, QR, Datei, Beispiel) und jeder
 * „neu anfangen"-Weg setzen sich an dessen Stelle. Bis hierher war das
 * endgültig — wer mitten im eigenen Bogen eine fremde Meldung öffnete, hatte
 * seine Eingaben verloren. Der verdrängte Bogen wandert deshalb hierher und
 * lässt sich von der Startseite zurückholen; erst der übernächste Wechsel
 * überschreibt ihn.
 *
 * Ausnahme: Eine fremde Erfassung (Meldekopf, siehe `Entwurf.fremd`) darf
 * einen eigenen Bogen hier nie verdrängen. Sonst genügten zwei Erfassungen
 * nacheinander — oder eine abgebrochene und eine neue —, und der eigene Bogen
 * war endgültig weg, während die Rückfrage „bleibt erreichbar" versprach
 * (Audit Runde 2, R2-N1/R2-E1). Siehe {@link rueckholungNimmt}.
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
  /**
   * Gesetzt, wenn der Bogen keine eigene Meldung ist, sondern die Erfassung
   * einer fremden Einheit am Meldekopf („Einheit schnell erfassen",
   * „Einheit manuell erfassen…"). `einsatzId` = die Sammlung, für die erfasst
   * wird — so findet die App nach einem Neustart zurück in die Erfassung.
   * Fehlt = eigener Bogen. `beginn` (Date.now()) = Beginn der Erfassung —
   * Vorschlag für die Eintreffzeit, wenn bis zur Übernahme Zeit vergeht
   * (Audit Runde 3, R3-S6).
   */
  fremd?: { einsatzId?: string; beginn?: number };
  /** Zuletzt offener Schritt des Assistenten — „Fortsetzen" öffnet ihn (R2-N7). */
  schritt?: number;
  /** Letzte Übergabe dieses Bogens (QR, Link, PDF, Nahbereich) — siehe uebergabe-stand.ts (R2-W2). */
  uebergabe?: UebergabeStand;
}

/** Zusätze eines Entwurfs neben dem Bogen (siehe `Entwurf`). */
export type EntwurfZusatz = Pick<Entwurf, "vorlageId" | "fremd" | "schritt" | "uebergabe">;

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
  if (typeof e.schritt !== "number" || !Number.isInteger(e.schritt) || e.schritt < 0 || e.schritt > 5) delete e.schritt;
  const u = e.uebergabe as Partial<UebergabeStand> | undefined;
  if (!u || typeof u.um !== "number" || typeof u.id !== "string" || typeof u.einheit !== "string" || typeof u.staerke !== "string") {
    delete e.uebergabe;
  }
  if (!e.fremd || typeof e.fremd !== "object") delete e.fremd;
  else {
    const { einsatzId, beginn } = e.fremd;
    e.fremd = {
      ...(typeof einsatzId === "string" && einsatzId ? { einsatzId } : {}),
      ...(typeof beginn === "number" && Number.isFinite(beginn) ? { beginn } : {}),
    };
  }
  return e;
}

export function entwurfZuJson(bogen: Erfassungsbogen, gespeichert = Date.now(), zusatz: EntwurfZusatz = {}): string {
  return JSON.stringify({
    gespeichert,
    bogen,
    ...(zusatz.vorlageId ? { vorlageId: zusatz.vorlageId } : {}),
    ...(zusatz.fremd ? { fremd: zusatz.fremd } : {}),
    ...(zusatz.schritt != null ? { schritt: zusatz.schritt } : {}),
    ...(zusatz.uebergabe ? { uebergabe: zusatz.uebergabe } : {}),
  });
}

/**
 * Darf der Bogen, der gerade seinen Platz räumt, in die Rückholung — wo
 * vielleicht schon `alt` liegt? Ein eigener Bogen darf immer (der ältere
 * Inhalt dort geht dann verloren, das sagt die Rückfrage). Eine fremde
 * Erfassung darf nur, wenn dort kein eigener Bogen liegt.
 */
export function rueckholungNimmt(neuIstFremd: boolean, alt: Entwurf | null): boolean {
  return !neuIstFremd || !alt || !!alt.fremd;
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
    const text = entwurfZuJson(nachFrist.bogen, nachFrist.gespeichert, nachFrist);
    if (text !== roh) {
      try {
        s.setItem(schluessel, text);
        // Die eigene Anonymisierung ist keine Änderung aus einem anderen Fenster.
        if (schluessel === SPEICHER_SCHLUESSEL && eigenerStand === roh) eigenerStand = text;
      } catch {
        /* Speicher voll o. ä. — angezeigt wird trotzdem nur die anonymisierte Fassung */
      }
    }
  }
  return nachFrist;
}

/**
 * `zusatz`: Vorlagen-Bearbeitung bzw. fremde Erfassung (siehe `Entwurf`).
 *
 * Rückgabe: true = gespeichert, false = nicht gespeichert (Speicher voll,
 * blockiert). Das Autosave darf die Bearbeitung nie stören — aber die
 * Anzeige „automatisch gespeichert" darf auch nicht lügen (Audit „Offline
 * und Speicher", O1): der Aufrufer zeigt bei false den Fehlzustand.
 */
export function entwurfSpeichern(bogen: Erfassungsbogen, zusatz: EntwurfZusatz = {}, gespeichert = Date.now()): boolean {
  const s = speicher();
  if (!s) return false;
  // Hat ein anderes Fenster den Entwurf seit unserem letzten Schreiben
  // geändert, wird nicht still darübergeschrieben (R2-O4, siehe unten).
  if (entwurfFremdGeaendert()) {
    for (const h of konfliktHoerer) h();
    return false;
  }
  const text = entwurfZuJson(bogen, gespeichert, zusatz);
  try {
    s.setItem(SPEICHER_SCHLUESSEL, text);
  } catch {
    return false;
  }
  // Manche Browser scheitern still: dem Speicher glauben, nicht dem Aufruf.
  const ok = s.getItem(SPEICHER_SCHLUESSEL) === text;
  if (ok) eigenerStand = text;
  return ok;
}

export function entwurfVerwerfen(): void {
  // Gehört der gespeicherte Entwurf inzwischen einem anderen Fenster, bleibt
  // er stehen: Dieses Fenster schließt nur SEINEN Bogen (R2-O4).
  if (!entwurfFremdGeaendert()) speicher()?.removeItem(SPEICHER_SCHLUESSEL);
  eigenerStand = undefined;
}

// --------------------------------------------- Zwei Fenster, ein Entwurf (R2-O4)

/**
 * Zwei Fenster mit demselben Bogen (installierte App und ein Link, der im
 * Browser aufgeht) überschrieben sich still: Beide meldeten „gespeichert", und
 * wer zuletzt tippte, löschte die Eingaben des anderen (Audit Runde 2, R2-O4).
 *
 * Darum merkt sich jedes Fenster, welchen Text es zuletzt selbst geschrieben
 * hat. Steht beim nächsten Speichern etwas anderes im Speicher, schreibt es
 * nicht, sondern meldet den Konflikt; die Oberfläche fragt dann (siehe
 * fenster-abgleich.tsx). `undefined` = dieses Fenster hat noch keinen eigenen
 * Stand geschrieben — dann gibt es nichts zu schützen. Ein leerer Speicher
 * gilt nicht als Konflikt (dort ist nichts, was verloren ginge).
 */
let eigenerStand: string | undefined;
const konfliktHoerer = new Set<() => void>();

/** Steht im Speicher ein anderer Entwurf als der, den dieses Fenster zuletzt schrieb? */
export function entwurfFremdGeaendert(): boolean {
  if (eigenerStand === undefined) return false;
  // Leer ist kein fremder Stand: Hat das andere Fenster seinen Bogen
  // geschlossen oder alles gelöscht, geht durch erneutes Schreiben nichts verloren.
  const jetzt = speicher()?.getItem(SPEICHER_SCHLUESSEL) ?? null;
  return jetzt !== null && jetzt !== eigenerStand;
}

/** Benachrichtigung, wenn ein Speichern wegen fremder Änderung unterblieb. Rückgabe: Abmelden. */
export function entwurfKonfliktAbonnieren(hoerer: () => void): () => void {
  konfliktHoerer.add(hoerer);
  return () => {
    konfliktHoerer.delete(hoerer);
  };
}

/** „Meine Fassung behalten": Das nächste Speichern darf den fremden Stand überschreiben. */
export function entwurfUeberschreibenErlauben(): void {
  eigenerStand = undefined;
}

/** Speicherschlüssel des Entwurfs — für den Abgleich über das `storage`-Ereignis. */
export const ENTWURF_SCHLUESSEL = SPEICHER_SCHLUESSEL;

// --------------------------------------------- Verdrängter Entwurf (Rückholung)

/**
 * Den Bogen merken, der gerade von einem anderen verdrängt wird. Ein leerer
 * Bogen ist nichts wert und würde nur eine sinnlose Rückhol-Zeile erzeugen —
 * das entscheidet die aufrufende Stelle (siehe `bogenHatInhalt`).
 *
 * Rückgabe: true = gemerkt. false = nicht gemerkt — eine fremde Erfassung
 * hätte einen eigenen Bogen verdrängt ({@link rueckholungNimmt}) oder der
 * Speicher ist voll. `tausch`: die Rückholung wird ohnehin gerade geleert
 * (Zurückholen), dann ist der Platz frei.
 */
export function ersetztenEntwurfMerken(
  bogen: Erfassungsbogen,
  fremd?: Entwurf["fremd"],
  opt: { tausch?: boolean } = {},
): boolean {
  if (!opt.tausch && !rueckholungNimmt(!!fremd, ersetztenEntwurfLaden())) return false;
  try {
    speicher()?.setItem(ERSETZT_SCHLUESSEL, entwurfZuJson(bogen, Date.now(), { fremd }));
    return true;
  } catch {
    return false; // Speicher voll o. ä. — der Wechsel selbst darf daran nicht scheitern
  }
}

export function ersetztenEntwurfLaden(jetzt: EebZeitpunkt = datenschutzZeitpunkt()): Entwurf | null {
  return ausSpeicherLaden(ERSETZT_SCHLUESSEL, jetzt);
}

export function ersetztenEntwurfVerwerfen(): void {
  speicher()?.removeItem(ERSETZT_SCHLUESSEL);
}
