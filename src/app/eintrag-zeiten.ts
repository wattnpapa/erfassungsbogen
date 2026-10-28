/**
 * App-seitige Erweiterung der Einsatz-Sammlung um Zeiten und Notizen je Meldung.
 *
 * Der geteilte Kern (`@bos/meldekopf/einsaetze`, Submodul) kennt am Eintrag nur
 * `empfangenAm` — den Zeitpunkt, zu dem das Gerät die Meldung angenommen hat.
 * Die Führungsstelle braucht mehr: Wann ist die Einheit eingetroffen (beim
 * Nachtragen vom Papier NICHT der Moment des Abtippens), wann ist sie
 * abgerückt, und welchen Auftrag hat sie von hier bekommen. Diese Felder
 * werden hier als optionale Zusatzfelder am Eintrag geführt: Die Sammlung wird
 * als JSON gespeichert, der Kern reicht unbekannte Felder unverändert durch
 * (einsaetzeAusJson kopiert die Objekte), und Sammel-PDF sowie
 * Einsatz-Transport tragen sie mit. Kein Schemawechsel im Kern nötig.
 *
 * Fehlt `eingetroffenAm`, gilt `empfangenAm` — so bleiben ältere Sammlungen
 * lesbar (siehe {@link eintreffzeit}).
 */
import {
  MeldeStatus,
  einsaetzeSpeichern,
  meldungHinzufuegen,
  type Einsatzsammlung,
  type MeldeEintrag,
  type MeldeQuelle,
  type MeldungAufnahme,
  type MeldungOptionen,
} from "@bos/meldekopf/einsaetze";
import { einsaetzeLaden, einsaetzePapierkorb } from "./einsaetze-lesen";
import {
  einsaetzeLaden as kernEinsaetzeLaden,
  einsaetzePapierkorb as kernEinsaetzePapierkorb,
} from "@bos/meldekopf/einsaetze";
import { entfernteMerken } from "./entfernte-meldungen";
import { fassungenJeEinheit, geltendeJeEinheit } from "./fassung-vorrang";
import { zugNormalisiert } from "./zug-name";
import { EEB_EPOCHE_MS, type EebZeitpunkt } from "@bos/eeb-format/model";

declare module "@bos/meldekopf/einsaetze" {
  interface MeldeEintrag {
    /**
     * Wann die Einheit vor Ort eingetroffen ist (Geräteuhr, Date.now()).
     * Vorbelegt mit dem Empfangszeitpunkt, von der Führungsstelle korrigierbar
     * — etwa beim Nachtragen eines Papierstapels. Fehlt = `empfangenAm`.
     */
    eingetroffenAm?: number;
    /** Wann die Einheit abgerückt ist (Date.now()); nur bei Status ABGERUECKT. */
    abgerueckAm?: number;
    /**
     * Auftrag oder Notiz der Führungsstelle zu dieser Einheit („Deichabschnitt
     * Nord ab 14:00"). Bewusst am Eintrag, nicht im Bogen: der Bogen ist die
     * Meldung der Einheit, die Notiz gehört dem Meldekopf.
     */
    notiz?: string;
    /**
     * Was die Führungsstelle an dieser Einheit getan hat, mit Uhrzeit: Zug,
     * Auftrag, Zeitkorrektur, Abrücken (Audit Runde 2, R2-K6). Bisher stand nur
     * der aktuelle Wert da — „seit wann hat die FGr E diesen Auftrag?" war nicht
     * zu beantworten. Wie die übrigen Zusatzfelder am Eintrag, vom Kern
     * unverändert durchgereicht; eine Folgemeldung erbt die Liste.
     */
    vermerke?: FuehrungsVermerk[];
    /**
     * Vom Papier eingelesen (Fotos/Scans der QR-Codes, PDF ohne eingebettete
     * Daten), Lage noch nicht abgeglichen: Eintreffzeit ist die Zeit des
     * Einlesens, Status „anwesend", kein Zug — bis jemand die Angaben vom
     * Blatt bestätigt hat (Audit Runde 3, R3-A2). Zeitpunkt des Einlesens
     * (Date.now()); fehlt = abgeglichen bzw. nicht vom Papier.
     */
    vomPapier?: number;
    /**
     * Der Papier-Abgleich hat Nr., Zug, Status und Notiz übernommen; offen ist allenfalls die
     * Eintreffzeit (Audit Runde 6, R6-N3). Die Karte „Lage noch nicht abgeglichen" nennt dann
     * nur noch das Fehlende.
     */
    papierAbgeglichen?: boolean;
    /**
     * Laufende Nummer, wie sie auf dem gedruckten Lageblatt stand — nur gesetzt,
     * wenn der Papier-Abgleich sie übernommen hat (Audit Runde 4, R4-A1). Ohne
     * sie zählt die App nach dem Eingang (`meldungsNummern`); nach einem
     * Wiederanlauf vom Papier ergäbe das andere Nummern als auf dem Blatt an
     * der Wand. Eine gesetzte Nummer ist fest, die übrigen rücken um sie herum.
     */
    nummer?: number;
    /**
     * Diese Fassung hat eine abgerückte Einheit wieder in die Lage geholt: Zu
     * einer Einheit, die abgerückt war, kam eine Fassung mit neuerem Stand, und
     * sie gilt nun als anwesend (Audit Runde 5, R5-K1). Die App holt die Einheit
     * nicht still zurück, sondern kennzeichnet es — Verlauf, Quittung, Karte,
     * Lageblatt und Nachtrag nennen es, die Karte bietet „Wieder abrücken" an.
     * `abgerueckAm` ist die frühere Abrückzeit. Fällt weg, sobald jemand den
     * Status von Hand setzt.
     */
    rueckkehr?: { abgerueckAm?: number };
  }
}

/** Ein Eintrag im Verlauf der Führungsstelle: Zeitpunkt (Date.now()) und Text. */
export interface FuehrungsVermerk {
  zeit: number;
  text: string;
}

/**
 * Herkunft einer Meldung — EIN Wortlaut für Karte, Historie und alle CSV-
 * Exporte. Bisher hieß derselbe JSON-Import auf der Karte „Aus Datei" und in
 * der CSV „PDF-Import", ein Scan hier „Empfangen", dort „Scan" (Audit Runde 2,
 * R2-K6). „Empfangen" statt „Scan" bleibt, weil Scan, Link und Übertragung
 * dasselbe sind: die Einheit hat selbst gemeldet (Arbeitsablauf-Audit W7).
 */
export const HERKUNFT_TEXT: Record<MeldeQuelle, string> = {
  scan: "Empfangen",
  manuell: "Manuell erfasst",
  "pdf-import": "Aus Datei",
  aufteilung: "Aufteilung",
  zusammenfuehrung: "Zusammenführung",
};

function vermerken(e: MeldeEintrag, text: string, zeit = Date.now()): void {
  (e.vermerke ??= []).push({ zeit, text });
}

/**
 * Bogen-Zeitpunkt (EebZeitpunkt: Minuten seit 2020-01-01, lokale Wandzeit) als
 * Millisekunden der Geräteuhr, damit er sich mit `empfangenAm`/`eingetroffenAm`
 * vergleichen lässt. Vorher wurden Minuten direkt von Millisekunden abgezogen —
 * die Marke „alt" stand dadurch an jeder Karte (Audit Runde 2, R2-N4). Die
 * Wandzeit wird als lokale Zeit dieses Geräts gelesen, wie sie auf dem Papier
 * steht.
 */
export function zeitpunktZuMs(z: EebZeitpunkt): number {
  const w = new Date(EEB_EPOCHE_MS + z * 60_000); // Wandzeit in UTC-Feldern
  return new Date(w.getUTCFullYear(), w.getUTCMonth(), w.getUTCDate(), w.getUTCHours(), w.getUTCMinutes()).getTime();
}

/** Eintreffzeit einer Meldung — korrigierter Wert oder Empfangszeit. */
export function eintreffzeit(e: MeldeEintrag): number {
  return e.eingetroffenAm ?? e.empfangenAm;
}

/**
 * Ist die Eintreffzeit der Meldung nur die Zeit, zu der das Gerät sie angenommen hat? Von Hand gesetzte oder
 * korrigierte Zeiten (Zettel-Eingabe, „ändern") weichen vom Eingang der ersten Fassung ab; manuell erfasste
 * Einheiten stammen vom Meldeblock (R14-A1).
 */
export function zeitEingelesen(m: MeldeEintrag, fassungenNeuesteZuerst: MeldeEintrag[]): boolean {
  const erste = fassungenNeuesteZuerst[fassungenNeuesteZuerst.length - 1] ?? m;
  // Nur die erste Fassung entscheidet: Eine von Hand korrigierte Stärke (Quelle „manuell") erbt die Eintreffzeit der
  // eingelesenen Meldung und damit auch deren Kennzeichnung (R15-A1).
  if (erste.quelle === "manuell") return false;
  return eintreffzeit(m) === erste.empfangenAm;
}

/** Fußnote zur Eintreffzeit: Lageblatt, Sammel-PDF, Excel und CSV sagen dasselbe (R16-A1). */
export const EINTREFF_HINWEIS = "Eintreffzeit = Zeit des Einlesens am Gerät, nicht vom Absender oder Meldeblock bestätigt.";

/**
 * Ist die Eintreffzeit dieser Meldung vom Gerät und nicht vom Absender bestätigt (Einlesen oder vom Papier)?
 * `historie` ist die ganze Sammlung: Beim Teilexport fehlt die erste Fassung sonst (R16-A1).
 */
export function eintreffzeitUnbestaetigt(m: MeldeEintrag, historie: readonly MeldeEintrag[]): boolean {
  return m.vomPapier != null || zeitEingelesen(m, fassungenJeEinheit(historie, m.einheitSchluessel));
}

/** Spielraum für „in der Zukunft": Uhren zweier Geräte gehen nie gleich. */
export const ZUKUNFT_TOLERANZ_MS = 15 * 60_000;
/** Wie weit vor der Aufnahme eine Eintreffzeit liegen darf, ohne dass nachgefragt wird (R12-E4). */
export const VERGANGENHEIT_TOLERANZ_MS = 24 * 3_600_000;

/**
 * Passt die Zeit zusammen? Eintreff- oder Abrückzeit mehr als eine
 * Viertelstunde in der Zukunft oder Abrücken vor dem Eintreffen — typisch
 * für einen Tag- oder Monatsdreher beim Nachtragen vom Meldeblock. Vorher
 * gingen beide ohne Hinweis durch (Audit Runde 3, R3-E5). Nur ein Hinweis,
 * gesperrt wird nichts. `null` heißt: plausibel.
 */
export function zeitUnstimmigkeit(
  z: { eintreffen: number; abgerueckt?: number | null },
  jetzt = Date.now(),
  /**
   * Bezug für die Gegenrichtung (R12-E4): Aufnahmezeit der Meldung und Beginn des Einsatzzeitraums in ms. Eine
   * Eintreffzeit, die mehr als einen Tag vor der Aufnahme UND vor dem Zeitraum liegt, ist meist ein Dreher im
   * Jahr oder bei Tag und Monat.
   */
  bezug?: { aufnahme: number; zeitraumVon?: number },
): string | null {
  if (z.eintreffen > jetzt + ZUKUNFT_TOLERANZ_MS) {
    return `Eingetroffen ${zeitLang(z.eintreffen)} liegt in der Zukunft — Tag oder Monat vertauscht?`;
  }
  if (
    bezug &&
    z.eintreffen < bezug.aufnahme - VERGANGENHEIT_TOLERANZ_MS &&
    (bezug.zeitraumVon == null || z.eintreffen < bezug.zeitraumVon)
  ) {
    return `Eingetroffen ${zeitLang(z.eintreffen)} liegt mehr als einen Tag vor der Aufnahme (${zeitLang(bezug.aufnahme)}) — Jahr, Tag oder Monat vertauscht?`;
  }
  if (z.abgerueckt != null && z.abgerueckt > jetzt + ZUKUNFT_TOLERANZ_MS) {
    return `Abgerückt ${zeitLang(z.abgerueckt)} liegt in der Zukunft — Tag oder Monat vertauscht?`;
  }
  if (z.abgerueckt != null && z.abgerueckt < z.eintreffen) {
    return `Abgerückt ${zeitLang(z.abgerueckt)} liegt vor dem Eintreffen ${zeitLang(z.eintreffen)} — stimmt eine der Zeiten nicht?`;
  }
  return null;
}

/** Uhrzeit, bei anderem Tag mit Datum: „09:40" bzw. „26.09., 09:40". */
export function zeitKurz(ms: number, jetzt = Date.now()): string {
  const d = new Date(ms);
  const heute = new Date(jetzt);
  const gleicherTag =
    d.getFullYear() === heute.getFullYear() && d.getMonth() === heute.getMonth() && d.getDate() === heute.getDate();
  const uhr = d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  return gleicherTag ? uhr : `${d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}, ${uhr}`;
}

/** Datum und Uhrzeit ausgeschrieben: „27.09.2026, 20:19". */
export function zeitLang(ms: number): string {
  return new Date(ms).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/**
 * Der Gerätespeicher ist voll (QuotaExceededError o. ä.). Wer schreibt, muss
 * das dem Nutzer sagen — still verloren gehen darf nichts.
 */
export class SpeicherVollFehler extends Error {
  constructor(ursache?: unknown) {
    // R20-H13/N9: Zuerst was los ist, dann nur Wege, die in diesem Zustand bestehen (siehe `platzRat`).
    super(`Speichern fehlgeschlagen — der Speicher dieses Geräts ist voll${belegungKlammer()}. ${platzRat()}`);
    this.name = "SpeicherVollFehler";
    (this as { cause?: unknown }).cause = ursache;
  }
}

/** „ (zu 100 % belegt)" — die Belegung, soweit der Browser sie lesen lässt; sonst leer (R20-N9). */
function belegungKlammer(): string {
  const b = speicherBelegung();
  return b ? ` (zu ${Math.round(b.anteil * 100)} % belegt)` : "";
}

/**
 * Was bei vollem Speicher Platz schafft — nur die Wege, die im jetzigen Zustand bestehen (R20-N9): Einen leeren
 * Papierkorb gibt es nicht zu leeren, und ein Einsatz, den es nicht gibt, lässt sich nicht löschen. Sichern kommt
 * zuerst, weil Löschen nicht rückholbar ist; die Sicherung selbst schafft keinen Platz.
 */
export function platzRat(): string {
  let korb = 0;
  let sammlungen = 0;
  try {
    korb = einsaetzePapierkorb().length;
    sammlungen = einsaetzeLaden().length;
  } catch {
    /* nicht lesbar: dann nennt der Rat nur den allgemeinen Weg */
  }
  const wege: string[] = [];
  if (korb > 0) wege.push(`den Papierkorb leeren (${korb} ${korb === 1 ? "Einsatz" : "Einsätze"})`);
  if (sammlungen > 0) wege.push("einen gesicherten Einsatz endgültig löschen", "unter „Mehr…“ Meldungen endgültig entfernen");
  if (wege.length === 0) wege.push("„Alle Daten löschen“ (nach der Sicherung)");
  const liste = wege.length > 1 ? `${wege.slice(0, -1).join(", ")} oder ${wege[wege.length - 1]}` : wege[0]!;
  return `Erst sichern${sammlungen > 0 ? " (Einsatz weitergeben / sichern)" : ""}, dann Platz schaffen: ${liste}.`;
}

/**
 * Meldung, wenn beim Einlesen Bögen am vollen Speicher scheiterten. Die Datei
 * ist dann in Ordnung — bisher stand „Keine Bögen in der Datei gefunden", und
 * der Meldekopf forderte gültige PDFs neu an (Audit Runde 3, R3-O1). Leer bei 0.
 */
export function speicherVollMeldung(anzahl: number): string {
  if (anzahl <= 0) return "";
  return (
    `Nicht aufgenommen: ${anzahl === 1 ? "1 Bogen" : `${anzahl} Bögen`} — der Speicher dieses Geräts ist voll, ` +
    `die Datei selbst ist in Ordnung. ${platzRat()} Danach dieselbe Datei noch einmal einlesen.`
  );
}

/** Ist dieser Fehler ein voller Speicher? (Browser nennen ihn unterschiedlich.) */
export function istSpeicherVoll(e: unknown): boolean {
  if (!(e instanceof Error) && typeof e !== "object") return false;
  const name = (e as { name?: string })?.name ?? "";
  const text = (e as { message?: string })?.message ?? "";
  return /quota/i.test(name) || /quota|exceeded/i.test(text) || (e as { code?: number })?.code === 22;
}

/**
 * Alle Sammlungen samt Papierkorb — der Kern exportiert nur die beiden
 * Teillisten, schreibt aber immer die Gesamtliste.
 */
function alleSammlungen(): Einsatzsammlung[] {
  // Frisch aus dem Kern, nicht aus dem Lese-Zwischenspeicher: die Aufrufer
  // ändern die Sammlungen an Ort und Stelle und schreiben sie dann zurück
  // (einsaetze-lesen.ts, R3-O2).
  return [...kernEinsaetzeLaden(), ...kernEinsaetzePapierkorb()];
}

/**
 * Gesamtliste schreiben und einen vollen Speicher als {@link SpeicherVollFehler}
 * melden statt ihn als nackte Ausnahme durchzureichen.
 */
export function sammlungenSchreiben(liste: Einsatzsammlung[]): void {
  try {
    einsaetzeSpeichern(liste);
  } catch (e) {
    if (istSpeicherVoll(e)) throw new SpeicherVollFehler(e);
    throw e;
  }
}

/**
 * Eine Sammlung auf einen früheren Stand zurücksetzen (Rückgängig nach dem Zusammenführen, R20-D3). Ersetzt die Sammlung gleicher ID
 * vollständig; gibt es sie nicht mehr, wird sie wieder angelegt. Ein voller Speicher kommt als {@link SpeicherVollFehler}.
 */
export function sammlungZuruecksetzen(vorher: Einsatzsammlung): void {
  const liste = alleSammlungen();
  const i = liste.findIndex((x) => x.id === vorher.id);
  if (i < 0) liste.push(vorher);
  else liste[i] = vorher;
  sammlungenSchreiben(liste);
}

/**
 * Prüft, ob die Sammlung nach dem Schreiben wirklich im Speicher steht. Ein
 * `setItem` kann in manchen Browsern still scheitern; darum wird nicht dem
 * Aufruf, sondern dem Speicher geglaubt.
 */
export function eintragGespeichert(einsatzId: string, eintragId: string): boolean {
  return alleSammlungen().some((s) => s.id === einsatzId && s.eintraege.some((e) => e.id === eintragId));
}

function eintragAendern(einsatzId: string, eintragId: string, aendern: (e: MeldeEintrag) => void): void {
  const liste = alleSammlungen();
  const s = liste.find((x) => x.id === einsatzId);
  const e = s?.eintraege.find((x) => x.id === eintragId);
  if (!s || !e) return;
  aendern(e);
  s.geaendert = Date.now();
  sammlungenSchreiben(liste);
}

/**
 * Name und Ort/Auftrag einer Sammlung nachträglich ändern (R16-K1): Beides steht beim Anlegen oft noch nicht fest. Der
 * Kern bietet dafür keinen Setter; Einheiten, Zeiten und Aufträge bleiben unberührt. Ein leerer Name lässt den alten
 * stehen, ein leerer Ort löscht ihn. Liefert die Werte davor (für „Rückgängig"); `null`, wenn es den Einsatz nicht gibt.
 */
export function einsatzKopfSetzen(einsatzId: string, name: string, ort: string): { name: string; ort: string } | null {
  const liste = alleSammlungen();
  const s = liste.find((x) => x.id === einsatzId);
  if (!s) return null;
  const vorher = { name: s.name, ort: s.ort ?? "" };
  s.name = name.trim() || s.name;
  s.ort = ort.trim() || undefined;
  s.geaendert = Date.now();
  sammlungenSchreiben(liste);
  return vorher;
}

/** Eintreffzeit einer Meldung korrigieren (Nachtragen vom Papier). */
export function eintreffzeitSetzen(einsatzId: string, eintragId: string, zeitpunkt: number): void {
  eintragAendern(einsatzId, eintragId, (e) => {
    delete e.vomPapier; // wer die Zeit vom Blatt einträgt, hat abgeglichen (R3-A2)
    const vorher = eintreffzeit(e);
    e.eingetroffenAm = zeitpunkt;
    if (vorher !== zeitpunkt) vermerken(e, `Eintreffzeit korrigiert: ${zeitLang(vorher)} → ${zeitLang(zeitpunkt)}`);
  });
}

/**
 * „Nr. laut Zettel“ und Zug einer eben von Hand erfassten Einheit (R5-A4): Das Papier
 * (Blanko-Kasten „Meldekopf“) hat sie, die Erfassung kannte nur die Uhrzeit — sonst gab es
 * zwei Nummernreihen. Die Nummer gilt für die ganze Einheit; sie ist fest wie die aus dem
 * Papier-Abgleich (R4-A1).
 */
export function nummerUndZugSetzen(einsatzId: string, eintragId: string, wert: { nummer?: number; zug?: string }): void {
  const liste = alleSammlungen();
  const s = liste.find((x) => x.id === einsatzId);
  const e = s?.eintraege.find((x) => x.id === eintragId);
  if (!s || !e) return;
  // Wie beim Zuordnen an der Karte und beim Papier-Abgleich: „2", „Zug 2", „2.Zug" sind ein Zug (R10-S1, R10-A1).
  const zug = zugNormalisiert(wert.zug ?? "", s.eintraege.map((x) => x.zugEtikett)) || undefined;
  for (const x of s.eintraege) {
    if (x.einheitSchluessel !== e.einheitSchluessel) continue;
    if (wert.nummer != null) x.nummer = wert.nummer;
    if (zug) x.zugEtikett = zug;
  }
  if (zug) vermerken(e, `Zug: ${zug}`);
  if (wert.nummer != null) vermerken(e, `Nr. ${wert.nummer} laut Zettel`);
  s.geaendert = Date.now();
  sammlungenSchreiben(liste);
}

/** Abrückzeit einer abgerückten Meldung korrigieren. */
export function abrueckzeitSetzen(einsatzId: string, eintragId: string, zeitpunkt: number): void {
  eintragAendern(einsatzId, eintragId, (e) => {
    const vorher = e.abgerueckAm;
    e.abgerueckAm = zeitpunkt;
    if (vorher !== zeitpunkt) {
      vermerken(e, `Abrückzeit korrigiert: ${vorher != null ? `${zeitLang(vorher)} → ` : ""}${zeitLang(zeitpunkt)}`);
    }
  });
}

/**
 * Status mit Zeitstempel setzen: Abrücken hält den Zeitpunkt fest, „wieder
 * anwesend" nimmt ihn zurück. Ersetzt `meldungStatusSetzen` aus dem Kern
 * überall dort, wo eine Führungskraft den Status von Hand wechselt.
 */
export function statusMitZeitSetzen(
  einsatzId: string,
  eintragId: string,
  status: MeldeStatus,
  zeitpunkt = Date.now(),
  /** Zeit des Vermerks im Verlauf, wenn sie von der Abrückzeit abweicht („Wieder abrücken" nach einer Rückkehr, R5-K1). */
  vermerkZeit = zeitpunkt,
): void {
  eintragAendern(einsatzId, eintragId, (e) => {
    if (e.status !== status) {
      vermerken(
        e,
        status === MeldeStatus.ABGERUECKT ? "Abgerückt" : status === MeldeStatus.ANWESEND ? "Wieder als anwesend geführt" : "Status geändert",
        vermerkZeit,
      );
    }
    delete e.rueckkehr; // von Hand entschieden: die Kennzeichnung der Folgemeldung gilt nicht mehr
    e.status = status;
    if (status === MeldeStatus.ABGERUECKT) e.abgerueckAm = zeitpunkt;
    else delete e.abgerueckAm;
    if (status !== MeldeStatus.AUFGEGANGEN) delete e.aufgegangenIn;
  });
}

/**
 * Stand vor einem Zusammenführen — alles, was für „Rückgängig" gebraucht wird
 * (Audit Runde 4, R4-D5). Der Kern legt eine neue Revision des Ziels an (bei
 * gleichem Inhalt schon vorhanden) und setzt die Teile auf AUFGEGANGEN.
 */
export interface ZusammenfuehrungVorher {
  /** Die Revision, in der jetzt alles steckt. */
  zielId: string;
  /** Sie gab es vorher nicht — sie wird beim Zurücknehmen entfernt. */
  zielWarNeu: boolean;
  /** Die Teile samt Status und Abrückzeit vor dem Zusammenführen. */
  teile: { id: string; status: MeldeStatus; abgerueckAm?: number }[];
}

/**
 * Zusammenführen zurücknehmen: die Teile haben wieder ihren Status (und ihre
 * Abrückzeit), die neue Revision des Ziels geht heraus, die Fassung davor gilt
 * wieder. Ohne Vermerk in der Historie der Teile — sie waren nie weg.
 */
export function zusammenfuehrungZurueck(einsatzId: string, v: ZusammenfuehrungVorher): void {
  const liste = alleSammlungen();
  const s = liste.find((x) => x.id === einsatzId);
  if (!s) return;
  for (const t of v.teile) {
    const e = s.eintraege.find((x) => x.id === t.id);
    if (!e) continue;
    e.status = t.status;
    if (t.abgerueckAm != null) e.abgerueckAm = t.abgerueckAm;
    else delete e.abgerueckAm;
    delete e.aufgegangenIn;
  }
  if (v.zielWarNeu) s.eintraege = s.eintraege.filter((x) => x.id !== v.zielId);
  s.geaendert = Date.now();
  sammlungenSchreiben(liste);
}

/** Auftrag/Notiz der Führungsstelle setzen (leer = entfernen). */
export function notizSetzen(einsatzId: string, eintragId: string, notiz: string): void {
  eintragAendern(einsatzId, eintragId, (e) => {
    const t = notiz.trim();
    const vorher = e.notiz;
    if (t) e.notiz = t;
    else delete e.notiz;
    if ((vorher ?? "") !== t) {
      vermerken(
        e,
        !t ? `Auftrag/Notiz entfernt (war: ${vorher})` : vorher ? `Auftrag/Notiz geändert: ${t} (war: ${vorher})` : `Auftrag/Notiz: ${t}`,
      );
    }
  });
}

/**
 * Zug einer Einheit setzen (alle Fassungen, wie `einheitZugEtikettSetzen` im
 * Kern) und den Vorgang mit Uhrzeit an der aktuellen Fassung vermerken
 * (R2-K6). Leer = Zuordnung entfernen.
 */
export function zugSetzen(einsatzId: string, einheitSchl: string, kopfId: string, etikett: string): void {
  const liste = alleSammlungen();
  const s = liste.find((x) => x.id === einsatzId);
  if (!s) return;
  // Schreibweise der schon vergebenen Züge übernehmen (R7-K4).
  const wert = zugNormalisiert(etikett, s.eintraege.map((e) => e.zugEtikett)) || undefined;
  const kopf = s.eintraege.find((e) => e.id === kopfId);
  const vorher = kopf?.zugEtikett;
  let geaendert = false;
  for (const e of s.eintraege) {
    if (e.einheitSchluessel === einheitSchl && e.zugEtikett !== wert) {
      e.zugEtikett = wert;
      geaendert = true;
    }
  }
  if (!geaendert) return;
  if (kopf && vorher !== wert) {
    vermerken(kopf, wert ? (vorher ? `Zug: ${wert} (war: ${vorher})` : `Zug: ${wert}`) : `Zug-Zuordnung entfernt (war: ${vorher})`);
  }
  s.geaendert = Date.now();
  sammlungenSchreiben(liste);
}

/**
 * Eine Folgemeldung erbt, was die Führungsstelle der Einheit gegeben hat:
 * Eintreffzeit, Auftrag/Notiz, Zug und Teil-Etikett der Vorgängerin derselben
 * Einheit. Sonst stünde jede Folgemeldung als frisch eingetroffen da, und Zug
 * und Auftrag wären mit jeder Fassung weg — still, weil die Karte nur die
 * Stärkeänderung meldet (Audit Runde 2, „Führungssicht", R2-K1). Aufzurufen
 * direkt nach `meldungHinzufuegen`, wenn `neu` war; {@link meldungAufnehmen}
 * erledigt beides.
 */
export function folgemeldungErbt(einsatzId: string, eintragId: string): void {
  const liste = alleSammlungen();
  const s = liste.find((x) => x.id === einsatzId);
  const e = s?.eintraege.find((x) => x.id === eintragId);
  if (!s || !e) return;
  const vorgaenger = s.eintraege
    .filter((x) => x.einheitSchluessel === e.einheitSchluessel && x.id !== e.id)
    .sort((a, b) => b.empfangenAm - a.empfangenAm)[0];
  if (!vorgaenger) return;
  let geaendert = false;
  if (e.eingetroffenAm == null) {
    e.eingetroffenAm = eintreffzeit(vorgaenger);
    geaendert = true;
  }
  if (e.notiz == null && vorgaenger.notiz) {
    e.notiz = vorgaenger.notiz;
    geaendert = true;
  }
  if (!e.zugEtikett && vorgaenger.zugEtikett) {
    e.zugEtikett = vorgaenger.zugEtikett;
    geaendert = true;
  }
  if (!e.teilEtikett && vorgaenger.teilEtikett) {
    e.teilEtikett = vorgaenger.teilEtikett;
    geaendert = true;
  }
  // Der Verlauf der Führungsstelle gehört zur Einheit, nicht zur Fassung (R2-K6).
  if (e.vermerke == null && vorgaenger.vermerke?.length) {
    e.vermerke = vorgaenger.vermerke.map((v) => ({ ...v }));
    geaendert = true;
  }
  if (geaendert) sammlungenSchreiben(liste);
}

/**
 * Ergebnis von {@link meldungAufnehmen}. `erbeFehlt`: die Meldung ist
 * abgelegt, aber Zug, Auftrag und Eintreffzeit der Vorgängerin konnten nicht
 * übernommen werden (Speicher voll) — das muss der Aufrufer sagen.
 */
export type MeldungAufnahmeMitErbe = MeldungAufnahme & {
  erbeFehlt?: boolean;
  /** Die Fassung hat eine abgerückte Einheit zurückgeholt (R5-K1); `abgerueckAm` = seit wann sie abgerückt war. */
  rueckkehr?: { abgerueckAm?: number };
};

/**
 * Eine eben aufgenommene Fassung, die eine abgerückte Einheit zurück in die
 * Lage holt (Audit Runde 5, R5-K1).
 *
 * Entscheidung: Eine Folgemeldung mit neuerem Stand holt die Einheit zurück,
 * aber nicht still. Sie ist die ausdrückliche neue Aussage der Einheit („ich
 * bin wieder da", neuer Einsatz, geänderte Stärke); sie zu übergehen ließe
 * eine Einheit in der Lage fehlen, die wieder vor Ort ist. Eine Rückfrage
 * scheidet aus: Im Kiosk-Stapel und beim Einlesen vieler Bögen gibt es keine,
 * und wer am Meldekopf in der Schlange steht, soll nicht pro Bogen entscheiden.
 * Stattdessen steht der Wechsel im Verlauf der Einheit, in der Quittung, an
 * der Karte (mit „Wieder abrücken"), im Lageblatt und im Nachtrag.
 *
 * Ein älterer Stand (Historie) oder eine abgerückte Einheit, deren neue
 * Fassung nicht gilt, bleibt abgerückt: Dort gilt der Kopf weiter.
 */
function rueckkehrErkennen(einsatzId: string, eintragId: string): { abgerueckAm?: number } | null {
  const liste = alleSammlungen();
  const s = liste.find((x) => x.id === einsatzId);
  const e = s?.eintraege.find((x) => x.id === eintragId);
  if (!s || !e) return null;
  const davor = geltendeJeEinheit(s.eintraege.filter((x) => x.einheitSchluessel === e.einheitSchluessel && x.id !== e.id))[0];
  if (!davor || davor.status !== MeldeStatus.ABGERUECKT) return null;
  const gilt = geltendeJeEinheit(s.eintraege.filter((x) => x.einheitSchluessel === e.einheitSchluessel))[0];
  if (!gilt || gilt.id !== e.id || e.status !== MeldeStatus.ANWESEND) return null;
  const rueck: { abgerueckAm?: number } = davor.abgerueckAm != null ? { abgerueckAm: davor.abgerueckAm } : {};
  e.rueckkehr = rueck;
  vermerken(
    e,
    `Wieder als anwesend geführt: Folgemeldung (Stand ${zeitLang(zeitpunktZuMs(e.bogen.stand))}) holt die abgerückte Einheit zurück` +
      (davor.abgerueckAm != null ? ` — war abgerückt seit ${zeitLang(davor.abgerueckAm)}` : ""),
  );
  s.geaendert = Date.now();
  sammlungenSchreiben(liste);
  return rueck;
}

/**
 * Bogen als Meldung in eine Sammlung legen — der einzige Weg, den die App
 * dafür nimmt. Scan, Link, Datei, Ordner, Bilderstapel und „In Einsatz
 * aufnehmen" liefen bisher teils am Erbe der Folgemeldung vorbei; dann waren
 * Zug und Auftrag je nach Eingangsweg weg (R2-K1).
 */
export function meldungAufnehmen(
  einsatzId: string,
  bogen: Parameters<typeof meldungHinzufuegen>[1],
  opt: MeldungOptionen = {},
): MeldungAufnahmeMitErbe | null {
  const r = meldungHinzufuegen(einsatzId, bogen, opt);
  if (!r?.neu) return r;
  try {
    folgemeldungErbt(einsatzId, r.eintrag.id);
  } catch {
    return { ...r, erbeFehlt: true };
  }
  try {
    const rueck = rueckkehrErkennen(einsatzId, r.eintrag.id);
    if (rueck) return { ...r, rueckkehr: rueck };
  } catch {
    /* die Kennzeichnung ist Zusatz; die Meldung ist abgelegt */
  }
  return r;
}

/**
 * Wie voll ist der Speicher? Die Browser nennen ihr Limit nicht; Chromium lässt
 * je Herkunft rund 5 Mio. Zeichen zu (Schlüssel + Wert, UTF-16 intern 10 MB),
 * Firefox und Safari ähnlich (jsdom: genau 5 000 000 Codeeinheiten). Vorher rechnete die Anzeige Zeichen × 2 gegen
 * 5 MB und kam bei vollem Speicher auf „10 von 5 MB" (Audit Runde 2, R2-O7).
 * Gerechnet wird jetzt in Zeichen gegen diese Grenze; `anteil` ist auf 1
 * gedeckelt. Null ohne Speicher.
 */
export const SPEICHER_GRENZE_ZEICHEN = 5_000_000;

export function speicherBelegung(): { belegt: number; grenze: number; anteil: number } | null {
  let s: Storage | null;
  try {
    s = globalThis.localStorage ?? null;
  } catch {
    return null;
  }
  if (!s) return null;
  let zeichen = 0;
  for (let i = 0; i < s.length; i++) {
    const k = s.key(i);
    if (k == null) continue;
    zeichen += k.length + (s.getItem(k)?.length ?? 0);
  }
  return { belegt: zeichen, grenze: SPEICHER_GRENZE_ZEICHEN, anteil: Math.min(1, zeichen / SPEICHER_GRENZE_ZEICHEN) };
}

/**
 * Warum scheiterte ein Schreibvorgang? „gesperrt", wenn der Browser den
 * Speicher gar nicht herausgibt (blockierte Website-Daten) oder er weit unter
 * der Grenze belegt ist und trotzdem nichts annimmt (Privatmodus, Quote 0);
 * sonst „voll". Vorher hieß beides „voll — Papierkorb leeren", was bei einer
 * Sperre nicht hilft (Audit Runde 3, R3-O4).
 */
export function speicherFehlerArt(): "voll" | "gesperrt" {
  let s: Storage | null;
  try {
    s = globalThis.localStorage ?? null;
  } catch {
    return "gesperrt";
  }
  if (!s) return "gesperrt";
  // Nimmt der Speicher ein einzelnes Zeichen? Dann ist er nicht gesperrt —
  // nur der eine, größere Schreibvorgang passte nicht mehr hinein.
  try {
    s.setItem(PROBE_SCHLUESSEL, "1");
    s.removeItem(PROBE_SCHLUESSEL);
    return "voll";
  } catch {
    const b = speicherBelegung();
    return b && b.anteil < 0.9 ? "gesperrt" : "voll";
  }
}

const PROBE_SCHLUESSEL = "eeb.speicherprobe";

/**
 * Nimmt der Browser gar nichts zum Speichern an — Zugriff gesperrt (blockierte
 * Website-Daten) oder Schreiben abgelehnt, ohne dass der Speicher voll wäre?
 * Dann muss schon die Startseite es sagen, nicht erst der Bogen (Audit Runde 5,
 * R5-O7). Ein voller Speicher zählt nicht: Dafür gibt es seine eigene Warnung.
 */
export function speicherGesperrt(): boolean {
  let s: Storage | null;
  try {
    s = globalThis.localStorage ?? null;
  } catch {
    return true;
  }
  if (!s) return true;
  try {
    s.setItem(PROBE_SCHLUESSEL, "1");
    s.removeItem(PROBE_SCHLUESSEL);
    return false;
  } catch {
    return speicherFehlerArt() === "gesperrt";
  }
}

/** „etwa 38 % (1,9 von 5 Mio. Zeichen)" — nie über 100 %. */
export function speicherText(b: { belegt: number; grenze: number; anteil?: number }): string {
  const anteil = b.anteil ?? Math.min(1, b.belegt / b.grenze);
  const mio = (n: number) => (n / 1_000_000).toLocaleString("de-DE", { maximumFractionDigits: 1 });
  // Unter einer Million in Tausend: „0 von 5 Mio." neben „1 %" las sich als leerer Speicher (R10-O4).
  const belegt = Math.min(b.belegt, b.grenze);
  const menge =
    belegt > 0 && belegt < 1_000_000
      ? belegt < 1000
        ? "unter 1 Tsd."
        : `${Math.round(belegt / 1000).toLocaleString("de-DE")} Tsd.`
      : mio(belegt);
  return `${Math.round(anteil * 100)} % (${menge} von ${mio(b.grenze)} Mio. Zeichen)`;
}

/**
 * Welche Sammlungen belegen am meisten? Für den Aufräum-Hinweis: vorher hieß
 * es nur „Papierkorb leeren", ohne zu sagen, wo der Platz steckt (R2-O7).
 */
export function speicherGroessteSammlungen(anzahl = 3): { name: string; papierkorb: boolean; anteil: number }[] {
  // Bezug ist die Grenze — oder die tatsächliche Belegung, wenn der Browser
  // mehr zulässt: eine Sammlung mit „104 %" neben einem Speicher „zu 100 %"
  // ging nicht auf (Audit Runde 3, R3-O4).
  const bezug = Math.max(SPEICHER_GRENZE_ZEICHEN, speicherBelegung()?.belegt ?? 0);
  const groesse = (x: Einsatzsammlung, papierkorb: boolean) => ({
    name: x.name,
    papierkorb,
    anteil: Math.min(1, JSON.stringify(x).length / bezug),
  });
  try {
    return [...einsaetzeLaden().map((x) => groesse(x, false)), ...einsaetzePapierkorb().map((x) => groesse(x, true))]
      .sort((x, y) => y.anteil - x.anteil)
      .slice(0, anzahl);
  } catch {
    return [];
  }
}

/**
 * Eine Einheit samt aller ihrer Fassungen in eine andere Sammlung verschieben
 * (falsche Mappe erwischt — Audit „Fehler und Wiederanlauf", E5). Signatur,
 * Herkunft, Zeiten und Notiz reisen unverändert mit; Fassungen, die im Ziel
 * schon liegen (gleiche Inhalts-ID), werden nicht verdoppelt. Rückgabe: Zahl
 * der verschobenen Fassungen.
 */
export function einheitVerschieben(vonEinsatzId: string, nachEinsatzId: string, einheitSchl: string): number {
  if (vonEinsatzId === nachEinsatzId) return 0;
  const liste = alleSammlungen();
  const von = liste.find((s) => s.id === vonEinsatzId);
  const nach = liste.find((s) => s.id === nachEinsatzId);
  if (!von || !nach) return 0;
  const wandern = von.eintraege.filter((e) => e.einheitSchluessel === einheitSchl);
  if (wandern.length === 0) return 0;
  von.eintraege = von.eintraege.filter((e) => e.einheitSchluessel !== einheitSchl);
  let verschoben = 0;
  for (const e of wandern) {
    if (nach.eintraege.some((x) => x.id === e.id)) continue;
    nach.eintraege.push(e);
    verschoben++;
  }
  const jetzt = Date.now();
  von.geaendert = jetzt;
  nach.geaendert = jetzt;
  sammlungenSchreiben(liste);
  return verschoben;
}

/**
 * Eine Einheit samt ALLER ihrer Fassungen aus einer Sammlung nehmen. Der Kern
 * kennt nur `meldungEntfernen` für einen einzelnen Eintrag; damit fiel bei
 * „Entfernen" nur die neueste Fassung weg, die ältere wurde wieder Kopf und
 * zählte erneut in den Summen — obwohl die Rückfrage „samt Historie" sagt
 * (Audit Runde 2, R2-D1). Gruppiert wird über den exakten Fingerabdruck:
 * abgeteilte Truppteile tragen einen eigenen Schlüssel (`…|teil:n`) und sind
 * eigene Einheiten, sie bleiben stehen. Ein Schreibvorgang für alle Fassungen,
 * damit kein halb entfernter Zustand im Speicher landen kann.
 *
 * Rückgabe: die entfernten Einträge unverändert (Signatur, Herkunft, Zeiten,
 * Notiz, Zug, Etiketten) — für „Rückgängig". `nummern` = die Nummern vor dem Entfernen (`meldungsNummern`): Sie werden an
 * allen Fassungen festgeschrieben, damit die übrigen Einheiten nicht aufrücken (R18-A1).
 */
export function einheitEntfernen(einsatzId: string, einheitSchl: string, nummern?: ReadonlyMap<string, number>): MeldeEintrag[] {
  const liste = alleSammlungen();
  const s = liste.find((x) => x.id === einsatzId);
  if (!s) return [];
  if (!s.eintraege.some((e) => e.einheitSchluessel === einheitSchl)) return [];
  // Die Nummern gehören der Einheit, nicht ihrer Listenstelle (R18-A1/W2): Das Papier (Meldeblock, Lageblatt, Funk)
  // trägt die vergebenen Nummern. Vor dem Entfernen werden sie festgeschrieben; die übrigen rücken nicht auf,
  // und die entfernte Einheit bekommt ihre Nummer beim Zurückholen wieder. Die Zählung (`meldungsNummern`) bringt der
  // Aufrufer mit: Dieses Modul darf `einheiten-tabelle` nicht importieren (Zyklus; er holte das Modul samt Nachbarn
  // ins Startbündel, ADR-003 Aufnahmeregel 5).
  if (nummern) {
    for (const x of s.eintraege) {
      const n = nummern.get(x.einheitSchluessel);
      if (x.nummer == null && n != null) x.nummer = n;
    }
  }
  const weg = s.eintraege.filter((e) => e.einheitSchluessel === einheitSchl);
  s.eintraege = s.eintraege.filter((e) => e.einheitSchluessel !== einheitSchl);
  s.geaendert = Date.now();
  sammlungenSchreiben(liste);
  // Merken, damit ein späterer „Einsatz importieren…" die Einheit nicht still
  // zurückholt (Audit Runde 2, R2-D4).
  entfernteMerken(einsatzId, weg.map((e) => e.id));
  return weg;
}

/**
 * Frisch vom Papier eingelesene Meldungen markieren (R3-A2). Nur neue
 * Einheiten: eine Folgemeldung erbt Zeit, Zug und Auftrag ihrer Vorgängerin
 * und braucht keinen Abgleich.
 */
export function vomPapierMarkieren(einsatzId: string, eintragIds: string[], jetzt = Date.now()): void {
  if (eintragIds.length === 0) return;
  const ids = new Set(eintragIds);
  const liste = alleSammlungen();
  const s = liste.find((x) => x.id === einsatzId);
  if (!s) return;
  let geaendert = false;
  for (const e of s.eintraege) {
    if (!ids.has(e.id) || e.vomPapier != null) continue;
    if (s.eintraege.some((x) => x.einheitSchluessel === e.einheitSchluessel && x.id !== e.id)) continue;
    e.vomPapier = jetzt;
    geaendert = true;
  }
  if (geaendert) sammlungenSchreiben(liste);
}

/** Eine Zeile des Abgleichs: was vom Blatt („Stand am Meldekopf") gilt. */
export interface PapierAbgleichZeile {
  eintragId: string;
  /**
   * Eintreffzeit laut Blatt. Fehlt sie, bleibt die Zeit des Einlesens stehen und
   * die Meldung bleibt als „vom Papier" markiert (R5-A1): Die Marke fällt erst,
   * wenn die Eintreffzeit wirklich bestätigt wurde.
   */
  eingetroffenAm?: number;
  status: MeldeStatus.ANWESEND | MeldeStatus.ABGERUECKT;
  /** Nur bei ABGERUECKT. */
  abgerueckAm?: number;
  zug: string;
  /** Auftrag / Notiz vom Blatt; fehlt = unverändert, leer = entfernen (R4-A2). */
  notiz?: string;
  /** „Nr." vom Blatt; fehlt = keine feste Nummer (R4-A1). */
  nummer?: number;
}

/**
 * Lage vom Papier in einem Schritt übernehmen (R3-A2): je Einheit
 * Eintreffzeit, Status samt Abrückzeit und Zug, mit Vermerken wie bei der
 * Einzelkorrektur an der Karte; danach gilt die Meldung als abgeglichen.
 * Ein Schreibvorgang für alle Zeilen. Rückgabe: Zahl der abgeglichenen.
 */
export function papierAbgleichUebernehmen(einsatzId: string, zeilen: PapierAbgleichZeile[]): number {
  const liste = alleSammlungen();
  const s = liste.find((x) => x.id === einsatzId);
  if (!s) return 0;
  let n = 0;
  for (const z of zeilen) {
    const e = s.eintraege.find((x) => x.id === z.eintragId);
    if (!e) continue;
    n++;
    const vorher = eintreffzeit(e);
    if (z.eingetroffenAm != null && vorher !== z.eingetroffenAm) {
      e.eingetroffenAm = z.eingetroffenAm;
      vermerken(e, `Eintreffzeit korrigiert: ${zeitLang(vorher)} → ${zeitLang(z.eingetroffenAm)}`);
    }
    if (z.status === MeldeStatus.ABGERUECKT) {
      // Steht auf dem Blatt keine Abrückzeit, bleibt sie offen („nicht bestätigt") – die Uhrzeit
      // des Einlesens wäre keine (R6-A6, wie bei der Eintreffzeit).
      const zeit = z.abgerueckAm;
      if (e.status !== MeldeStatus.ABGERUECKT) vermerken(e, zeit != null ? "Abgerückt" : "Abgerückt (Zeit vom Papier nicht bestätigt)", zeit ?? Date.now());
      e.status = MeldeStatus.ABGERUECKT;
      if (zeit != null) e.abgerueckAm = zeit;
      else delete e.abgerueckAm;
    } else if (e.status === MeldeStatus.ABGERUECKT) {
      vermerken(e, "Wieder als anwesend geführt");
      e.status = MeldeStatus.ANWESEND;
      delete e.abgerueckAm;
    }
    const zug = zugNormalisiert(z.zug, s.eintraege.map((x) => x.zugEtikett)) || undefined;
    if (zug !== e.zugEtikett) {
      const war = e.zugEtikett;
      for (const x of s.eintraege) if (x.einheitSchluessel === e.einheitSchluessel) x.zugEtikett = zug;
      vermerken(e, zug ? (war ? `Zug: ${zug} (war: ${war})` : `Zug: ${zug}`) : `Zug-Zuordnung entfernt (war: ${war})`);
    }
    if (z.notiz !== undefined) {
      const notiz = z.notiz.trim() || undefined;
      const war = e.notiz;
      if (notiz !== war) {
        if (notiz) e.notiz = notiz;
        else delete e.notiz;
        vermerken(e, !notiz ? `Auftrag/Notiz entfernt (war: ${war})` : war ? `Auftrag/Notiz geändert: ${notiz} (war: ${war})` : `Auftrag/Notiz: ${notiz}`);
      }
    }
    if (z.nummer != null) {
      for (const x of s.eintraege) if (x.einheitSchluessel === e.einheitSchluessel) x.nummer = z.nummer;
    }
    // Die Marke fällt nur, wenn die Zeit vom Blatt eingetragen wurde (R5-A1).
    if (z.eingetroffenAm != null) delete e.vomPapier;
    else e.papierAbgeglichen = true;
  }
  if (n > 0) {
    s.geaendert = Date.now();
    sammlungenSchreiben(liste);
  }
  return n;
}
