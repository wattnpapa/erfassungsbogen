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
import { DATENSCHUTZFRIST_TAGE, bogenAnonymisiert, datenschutzfristAbgelaufen } from "@bos/eeb-format/datenschutzfrist";
import { migriereBogen } from "./hilfen";
import { bogenBefund } from "./bogen-pruefung";
import { datenschutzZeitpunkt, geprueftesJetztMs } from "./datenschutz-uhr";
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
   * (Audit Runde 3, R3-S6). `startseite`: Die Erfassung wurde über „‹ Startseite“
   * verlassen — nach einem Neuladen steht die App dort, nicht im halbfertigen
   * Formular (R5-N3).
   */
  fremd?: { einsatzId?: string; beginn?: number; startseite?: true };
  /** Zuletzt offener Schritt des Assistenten — „Fortsetzen" öffnet ihn (R2-N7). */
  schritt?: number;
  /** Letzte Übergabe dieses Bogens (QR, Link, PDF, Nahbereich) — siehe uebergabe-stand.ts (R2-W2). */
  uebergabe?: UebergabeStand;
  /**
   * Nur beim Bogen auf dem Rückholplatz: warum er dort liegt, wenn nicht durch
   * Schließen. Die Startseite nennt den Anlass in der Karte, statt ihn als
   * „Zuletzt geschlossenen Bogen" neben den gleichnamigen Entwurf zu stellen
   * (Audit Runde 7, R7-S3). `fenster-geladen`: deine Fassung wurde durch den
   * Stand des anderen Fensters ersetzt; `fenster-behalten`: der Stand des
   * anderen Fensters wurde durch deine Fassung ersetzt.
   */
  ersetztGrund?: "fenster-geladen" | "fenster-behalten";
}

/** Zusätze eines Entwurfs neben dem Bogen (siehe `Entwurf`). */
export type EntwurfZusatz = Pick<Entwurf, "vorlageId" | "fremd" | "schritt" | "uebergabe" | "ersetztGrund">;

// ------------------------------------------------- Serialisierung (rein)

/** JSON-String → Entwurf. Defensiv: Müll oder fremdes Format ergibt null. */
export function entwurfAusJson(text: string | null): Entwurf | null {
  const r = entwurfPruefen(text);
  return "entwurf" in r ? r.entwurf : null;
}

/**
 * Wie {@link entwurfAusJson}, nennt aber die Ursache, wenn der Text kein
 * brauchbarer Entwurf ist. Die Pflichtfelder des Bogens werden geprüft
 * (bogen-pruefung.ts): Ein Entwurf ohne `einheitsTyp` ließ „Fortsetzen" ins
 * Weiße laufen, und die Karte stand nach dem Neuladen wieder da (Audit
 * Runde 5, R5-E1). Ergänzbares wird ergänzt, Unbrauchbares abgelehnt.
 */
export function entwurfPruefen(text: string | null): { entwurf: Entwurf | null } | { ursache: string } {
  if (!text) return { entwurf: null };
  let roh: unknown;
  try {
    roh = JSON.parse(text);
  } catch {
    return { ursache: "der gespeicherte Text ist abgebrochen oder beschädigt" };
  }
  const e = roh as Entwurf;
  if (!e || typeof e.gespeichert !== "number" || !e.bogen || !Array.isArray(e.bogen.personal)) {
    return { ursache: "es ist kein Entwurf dieser App" };
  }
  const befund = bogenBefund(e.bogen);
  if (!befund.ok) return { ursache: befund.ursache };
  try {
    e.bogen = migriereBogen(befund.bogen);
  } catch {
    return { ursache: "die Schema-Version des Bogens ist nicht lesbar" };
  }
  if (typeof e.vorlageId !== "string" || !e.vorlageId) delete e.vorlageId;
  if (typeof e.schritt !== "number" || !Number.isInteger(e.schritt) || e.schritt < 0 || e.schritt > 5) delete e.schritt;
  const u = e.uebergabe as Partial<UebergabeStand> | undefined;
  if (!u || typeof u.um !== "number" || typeof u.id !== "string" || typeof u.einheit !== "string" || typeof u.staerke !== "string") {
    delete e.uebergabe;
  } else {
    // Weg und Bestätigung seit Runde 3 (R3-H3); Unbekanntes fällt weg.
    if (u.weg !== undefined && !["qr", "pdf", "link", "kopiert", "nah"].includes(u.weg)) delete u.weg;
    if (u.bestaetigt !== undefined && u.bestaetigt !== true) delete u.bestaetigt;
  }
  if (e.ersetztGrund !== "fenster-geladen" && e.ersetztGrund !== "fenster-behalten") delete e.ersetztGrund;
  if (!e.fremd || typeof e.fremd !== "object") delete e.fremd;
  else {
    const { einsatzId, beginn, startseite } = e.fremd;
    e.fremd = {
      ...(startseite === true ? { startseite: true as const } : {}),
      ...(typeof einsatzId === "string" && einsatzId ? { einsatzId } : {}),
      ...(typeof beginn === "number" && Number.isFinite(beginn) ? { beginn } : {}),
    };
  }
  return { entwurf: e };
}

export function entwurfZuJson(bogen: Erfassungsbogen, gespeichert = Date.now(), zusatz: EntwurfZusatz = {}): string {
  return JSON.stringify({
    gespeichert,
    bogen,
    ...(zusatz.vorlageId ? { vorlageId: zusatz.vorlageId } : {}),
    ...(zusatz.fremd ? { fremd: zusatz.fremd } : {}),
    ...(zusatz.schritt != null ? { schritt: zusatz.schritt } : {}),
    ...(zusatz.ersetztGrund ? { ersetztGrund: zusatz.ersetztGrund } : {}),
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
  const befund = entwurfPruefen(roh);
  if (!("entwurf" in befund)) {
    // Unbrauchbar, aber nicht löschen: erst beiseitelegen, damit der nächste
    // Entwurf ihn nicht überschreibt; die Startseite sagt es (R5-E1).
    if (schluessel === SPEICHER_SCHLUESSEL && roh) beschaedigtBeiseite(s, roh, befund.ursache);
    return null;
  }
  const e = befund.entwurf;
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

// --------------------------------------------- Beschädigter Entwurf (R5-E1)

/** Hier liegt ein Entwurf, den die App nicht lesen kann — beiseitegelegt statt gelöscht. */
const BESCHAEDIGT_SCHLUESSEL = "eeb.entwurf.beschaedigt.v1";

export interface BeschaedigterEntwurf {
  /** Der gespeicherte Text, unverändert. */
  text: string;
  ursache: string;
  /** Wann beiseitegelegt (Date.now()). */
  am: number;
}

function beschaedigtBeiseite(s: Storage, roh: string, ursache: string): void {
  try {
    // Ein früher beiseitegelegter Text bleibt (die Karte nennt ihn zuerst); der
    // neue wird erst entfernt, wenn er sicher irgendwo liegt.
    if (s.getItem(BESCHAEDIGT_SCHLUESSEL) == null) {
      s.setItem(BESCHAEDIGT_SCHLUESSEL, JSON.stringify({ text: roh, ursache, am: Date.now() } satisfies BeschaedigterEntwurf));
    }
    if (beschaedigterEntwurf()?.text === roh) s.removeItem(SPEICHER_SCHLUESSEL);
  } catch {
    /* Speicher voll o. ä. — dann bleibt der Text, wo er ist, und die Karte fehlt weiter */
  }
}

/**
 * Der beiseitegelegte Entwurf, oder null. Er kann Personendaten tragen, die die
 * Datenschutzfrist nicht erreicht (die App kann den Bogen nicht lesen, also
 * nicht anonymisieren): Darum fällt er nach derselben Frist von 90 Tagen
 * selbst weg, gerechnet ab dem Beiseitelegen mit der geprüften Uhr.
 */
export function beschaedigterEntwurf(): BeschaedigterEntwurf | null {
  try {
    const roh = speicher()?.getItem(BESCHAEDIGT_SCHLUESSEL);
    if (!roh) return null;
    const x = JSON.parse(roh) as Partial<BeschaedigterEntwurf>;
    if (typeof x.text !== "string") return null;
    const am = typeof x.am === "number" ? x.am : 0;
    if (geprueftesJetztMs() - am > DATENSCHUTZFRIST_TAGE * 24 * 60 * 60 * 1000) {
      beschaedigtenEntwurfVerwerfen();
      return null;
    }
    return { text: x.text, ursache: typeof x.ursache === "string" ? x.ursache : "unlesbar", am };
  } catch {
    return null;
  }
}

/** Den beiseitegelegten Entwurf endgültig entfernen (nach „Als Datei sichern" oder auf Wunsch). */
export function beschaedigtenEntwurfVerwerfen(): void {
  try {
    speicher()?.removeItem(BESCHAEDIGT_SCHLUESSEL);
  } catch {
    /* nichts zu tun */
  }
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
    for (const h of konfliktHoerer) h("geaendert");
    return false;
  }
  // Hat ein anderes Fenster den Entwurf gelöscht („Alle Daten löschen", Bogen
  // geschlossen), schreibt dieses ihn nicht still zurück: Ein Datenschutz-
  // Löschen wäre sonst keines, und die Anzeige sagte dazu „gespeichert"
  // (Audit Runde 5, R5-D3).
  if (entwurfFremdEntfernt()) {
    for (const h of konfliktHoerer) h("entfernt");
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
const konfliktHoerer = new Set<(art: KonfliktArt) => void>();

/** Was das andere Fenster getan hat: einen anderen Stand geschrieben oder den Entwurf entfernt. */
export type KonfliktArt = "geaendert" | "entfernt";

/** Steht im Speicher ein anderer Entwurf als der, den dieses Fenster zuletzt schrieb? */
export function entwurfFremdGeaendert(): boolean {
  if (eigenerStand === undefined) return false;
  // Leer ist kein fremder Stand, sondern ein entfernter ({@link entwurfFremdEntfernt}).
  const jetzt = speicher()?.getItem(SPEICHER_SCHLUESSEL) ?? null;
  if (jetzt === null || jetzt === eigenerStand) return false;
  // Hat das andere Fenster den Entwurf nur neu geschrieben (Fortsetzen, anderer
  // Schritt, neuer Zeitstempel), ohne am Bogen etwas zu ändern, geht durch
  // Weiterschreiben nichts verloren: kein Konflikt, der Stand wird übernommen
  // (Audit Runde 7, R7-E3).
  if (nurNeuGeschrieben(eigenerStand, jetzt)) {
    eigenerStand = jetzt;
    return false;
  }
  return true;
}

/** Gleicher Bogen und gleiche Zusätze in beiden Texten — nur Zeitstempel und Schritt dürfen abweichen. */
function nurNeuGeschrieben(a: string, b: string): boolean {
  const x = entwurfAusJson(a);
  const y = entwurfAusJson(b);
  if (!x || !y) return false;
  const inhalt = (e: Entwurf) => JSON.stringify([e.bogen, e.vorlageId ?? null, e.fremd?.einsatzId ?? null, e.uebergabe ?? null]);
  return inhalt(x) === inhalt(y);
}

/** Wann dieses Fenster zuletzt selbst gespeichert hat (Date.now()), für die Sekunden in der Zwei-Fenster-Warnung. */
export function entwurfEigenerStandUm(): number | null {
  return (eigenerStand !== undefined ? entwurfAusJson(eigenerStand)?.gespeichert : null) ?? null;
}

/**
 * Wurde der Entwurf, den dieses Fenster zuletzt schrieb, von einem anderen
 * Fenster aus dem Speicher entfernt? Dann geht durch Nichtschreiben nichts
 * verloren, was nicht ohnehin nur hier steht — und durch Schreiben käme
 * Gelöschtes zurück (R5-D3). Ein nicht lesbarer Speicher zählt nicht.
 */
export function entwurfFremdEntfernt(): boolean {
  if (eigenerStand === undefined) return false;
  const s = speicher();
  if (!s) return false;
  try {
    return s.getItem(SPEICHER_SCHLUESSEL) === null;
  } catch {
    return false;
  }
}

/** Benachrichtigung, wenn ein Speichern wegen fremder Änderung unterblieb. Rückgabe: Abmelden. */
export function entwurfKonfliktAbonnieren(hoerer: (art: KonfliktArt) => void): () => void {
  konfliktHoerer.add(hoerer);
  return () => {
    konfliktHoerer.delete(hoerer);
  };
}

/** „Meine Fassung behalten": Das nächste Speichern darf den fremden Stand überschreiben. */
export function entwurfUeberschreibenErlauben(): void {
  eigenerStand = undefined;
}

/**
 * Der gespeicherte Entwurf, wenn ihn ein ANDERES Fenster geschrieben hat und
 * dieses Fenster ihn nicht kennt — etwa ein früher geöffneter Tab, dessen
 * Startseite ohne Entwurf geladen wurde. Ohne diese Prüfung überschrieb so
 * ein Tab beim Anlegen eines neuen Bogens den Entwurf des anderen Fensters
 * still (Audit Runde 3, R3-S3). null = nichts Fremdes gespeichert.
 */
export function entwurfAusAnderemFenster(jetzt: EebZeitpunkt = datenschutzZeitpunkt()): Entwurf | null {
  const roh = speicher()?.getItem(SPEICHER_SCHLUESSEL) ?? null;
  if (roh === null || roh === eigenerStand) return null;
  return entwurfLaden(jetzt);
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
 * (Zurückholen), dann ist der Platz frei. `geaendertUm`: Zeitpunkt der letzten
 * Bearbeitung des Bogens (siehe unten).
 */
export function ersetztenEntwurfMerken(
  bogen: Erfassungsbogen,
  fremd?: Entwurf["fremd"],
  opt: { tausch?: boolean; geaendertUm?: number; grund?: Entwurf["ersetztGrund"] } = {},
): boolean {
  if (!opt.tausch && !rueckholungNimmt(!!fremd, ersetztenEntwurfLaden())) return false;
  try {
    // Der Stand ist die letzte BEARBEITUNG des Bogens, nicht der Augenblick des
    // Schließens: Ein Bogen, der um 22:40 zuletzt bearbeitet war, wirkte sonst
    // um 22:45 so neu wie der Wechsel selbst (Audit Runde 4, R4-S5). Fehlt die
    // Angabe, gilt wie früher der Zeitpunkt des Merkens.
    speicher()?.setItem(ERSETZT_SCHLUESSEL, entwurfZuJson(bogen, opt.geaendertUm ?? Date.now(), { fremd, ersetztGrund: opt.grund }));
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
