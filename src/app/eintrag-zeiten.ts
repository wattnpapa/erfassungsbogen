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
    super(
      "Speichern fehlgeschlagen — der Speicher dieses Geräts ist voll. " +
        "Platz schafft nur Löschen: nicht mehr benötigte Einsätze in den Papierkorb legen und den Papierkorb leeren " +
        "(bei Bedarf vorher sichern — die Sicherung selbst schafft keinen Platz).",
    );
    this.name = "SpeicherVollFehler";
    (this as { cause?: unknown }).cause = ursache;
  }
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
    "die Datei selbst ist in Ordnung. Platz schafft nur Löschen: nicht mehr benötigte Einsätze sichern, " +
    "in den Papierkorb legen und den Papierkorb leeren; danach dieselbe Datei noch einmal einlesen."
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

/** Eintreffzeit einer Meldung korrigieren (Nachtragen vom Papier). */
export function eintreffzeitSetzen(einsatzId: string, eintragId: string, zeitpunkt: number): void {
  eintragAendern(einsatzId, eintragId, (e) => {
    delete e.vomPapier; // wer die Zeit vom Blatt einträgt, hat abgeglichen (R3-A2)
    const vorher = eintreffzeit(e);
    e.eingetroffenAm = zeitpunkt;
    if (vorher !== zeitpunkt) vermerken(e, `Eintreffzeit korrigiert: ${zeitLang(vorher)} → ${zeitLang(zeitpunkt)}`);
  });
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
): void {
  eintragAendern(einsatzId, eintragId, (e) => {
    if (e.status !== status) {
      vermerken(
        e,
        status === MeldeStatus.ABGERUECKT ? "Abgerückt" : status === MeldeStatus.ANWESEND ? "Wieder als anwesend geführt" : "Status geändert",
        zeitpunkt,
      );
    }
    e.status = status;
    if (status === MeldeStatus.ABGERUECKT) e.abgerueckAm = zeitpunkt;
    else delete e.abgerueckAm;
    if (status !== MeldeStatus.AUFGEGANGEN) delete e.aufgegangenIn;
  });
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
  const wert = etikett.trim() || undefined;
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
export type MeldungAufnahmeMitErbe = MeldungAufnahme & { erbeFehlt?: boolean };

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
  try {
    if (!globalThis.localStorage) return "gesperrt";
  } catch {
    return "gesperrt";
  }
  const b = speicherBelegung();
  return b && b.anteil < 0.9 ? "gesperrt" : "voll";
}

/** „etwa 38 % (1,9 von 5 Mio. Zeichen)" — nie über 100 %. */
export function speicherText(b: { belegt: number; grenze: number; anteil?: number }): string {
  const anteil = b.anteil ?? Math.min(1, b.belegt / b.grenze);
  const mio = (n: number) => (n / 1_000_000).toLocaleString("de-DE", { maximumFractionDigits: 1 });
  return `${Math.round(anteil * 100)} % (${mio(Math.min(b.belegt, b.grenze))} von ${mio(b.grenze)} Mio. Zeichen)`;
}

/**
 * Welche Sammlungen belegen am meisten? Für den Aufräum-Hinweis: vorher hieß
 * es nur „Papierkorb leeren", ohne zu sagen, wo der Platz steckt (R2-O7).
 */
export function speicherGroessteSammlungen(anzahl = 3): { name: string; papierkorb: boolean; anteil: number }[] {
  const groesse = (x: Einsatzsammlung, papierkorb: boolean) => ({
    name: x.name,
    papierkorb,
    anteil: JSON.stringify(x).length / SPEICHER_GRENZE_ZEICHEN,
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
 * Notiz, Zug, Etiketten) — für „Rückgängig".
 */
export function einheitEntfernen(einsatzId: string, einheitSchl: string): MeldeEintrag[] {
  const liste = alleSammlungen();
  const s = liste.find((x) => x.id === einsatzId);
  if (!s) return [];
  const weg = s.eintraege.filter((e) => e.einheitSchluessel === einheitSchl);
  if (weg.length === 0) return [];
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
  eingetroffenAm: number;
  status: MeldeStatus.ANWESEND | MeldeStatus.ABGERUECKT;
  /** Nur bei ABGERUECKT. */
  abgerueckAm?: number;
  zug: string;
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
    if (vorher !== z.eingetroffenAm) {
      e.eingetroffenAm = z.eingetroffenAm;
      vermerken(e, `Eintreffzeit korrigiert: ${zeitLang(vorher)} → ${zeitLang(z.eingetroffenAm)}`);
    }
    if (z.status === MeldeStatus.ABGERUECKT) {
      const zeit = z.abgerueckAm ?? Date.now();
      if (e.status !== MeldeStatus.ABGERUECKT) vermerken(e, "Abgerückt", zeit);
      e.status = MeldeStatus.ABGERUECKT;
      e.abgerueckAm = zeit;
    } else if (e.status === MeldeStatus.ABGERUECKT) {
      vermerken(e, "Wieder als anwesend geführt");
      e.status = MeldeStatus.ANWESEND;
      delete e.abgerueckAm;
    }
    const zug = z.zug.trim() || undefined;
    if (zug !== e.zugEtikett) {
      const war = e.zugEtikett;
      for (const x of s.eintraege) if (x.einheitSchluessel === e.einheitSchluessel) x.zugEtikett = zug;
      vermerken(e, zug ? (war ? `Zug: ${zug} (war: ${war})` : `Zug: ${zug}`) : `Zug-Zuordnung entfernt (war: ${war})`);
    }
    delete e.vomPapier;
  }
  if (n > 0) {
    s.geaendert = Date.now();
    sammlungenSchreiben(liste);
  }
  return n;
}
