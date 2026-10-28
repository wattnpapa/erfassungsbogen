/**
 * Eine Aktion, die Sekunden dauert — sperrt sich selbst gegen den zweiten
 * Tipp und sagt, dass sie läuft (Audit Runde 5, R5-O3, R5-H4, R5-L4).
 *
 * „Einsatz weitergeben / sichern" brauchte bei 30 Bögen 18 s ohne jede
 * Rückmeldung, der Knopf blieb frei, und ein zweiter Tipp erzeugte eine zweite
 * Datei gleichen Namens. Beim Blanko-Vordruck und Lageblatt war es dasselbe
 * (vier Sekunden und länger), beim Bogen-PDF stand „wird erstellt" nur, solange
 * die Oberfläche überhaupt neu zeichnen konnte. Eine gemeinsame Stelle für alle:
 *
 * - **Eine Sperre für alle PDF-Wege.** Es läuft höchstens eine dieser Aktionen,
 *   auch von verschiedenen Stellen der Oberfläche aus (Einsatzansicht, Startseite,
 *   Fußzeile): Die PDF-Erzeugung läuft im Hauptfaden, zwei gleichzeitig würden
 *   einander ausbremsen und zwei Dateien liefern.
 * - **Erst zeichnen, dann rechnen.** Vor der schweren Arbeit gibt die Aktion der
 *   Oberfläche ein Bild, damit „wird erzeugt…" schon steht, wenn der Hauptfaden
 *   für Sekunden blockiert ist.
 * - **Alle Knöpfe lesen denselben Zustand** ({@link useArbeitet}) und beschriften
 *   sich selbst; der Zustand ist der Name der laufenden Aktion.
 */
import { useSyncExternalStore } from "react";

let aktuell: string | null = null;
const hoerer = new Set<() => void>();

function melden(): void {
  for (const h of hoerer) h();
}

function abonnieren(h: () => void): () => void {
  hoerer.add(h);
  return () => hoerer.delete(h);
}

/**
 * Satz zur Dauer der Sammel-PDF, an der Zahl der Bögen ausgerichtet (R15-O1): gemessen rund 0,4 s je Bogen am Rechner,
 * mit vierfach gedrosselter CPU (Telefon) rund 1,5 s. „Bis zu einer halben Minute" galt nur für kleine Einsätze; wer
 * nach 40 Sekunden noch nichts sah, hielt die App für hängend. Einen Fortschritt „n von m" gibt es nicht: Die Erzeugung
 * läuft in einem Zug im Hauptfaden.
 */
export function sammelPdfDauerText(boegen: number, gemessenSek?: number): string {
  // Sobald die ersten Bögen vorbereitet sind, zählt die Messung an diesem Gerät, nicht die Pauschale (R17-A4).
  if (gemessenSek != null) {
    return `Die Sammel-PDF wird erzeugt — an diesem Gerät insgesamt etwa ${dauerText(gemessenSek)} (an den ersten Bögen gemessen). Nicht noch einmal tippen, Bildschirm und Seite offen lassen.`;
  }
  // 2 s je Bogen: gemessen 66 s für 30 Bögen bei sechsfach gedrosselter CPU (R17-O1).
  return `Die Sammel-PDF wird erzeugt — bei ${boegen} ${boegen === 1 ? "Bogen" : "Bögen"} am Telefon etwa ${dauerText(Math.ceil(boegen * 2))} oder länger. Nicht noch einmal tippen, Bildschirm und Seite offen lassen.`;
}

function dauerText(s: number): string {
  return s < 60 ? `${s} Sekunden` : `${Math.ceil(s / 60)} Min.`;
}

/**
 * Wie oft die ganze Erzeugung dauert, gemessen an der Vorbereitung der Bögen (QR-Code, Übersicht): Im Browser gemessen
 * 3,6- bis 4-mal so lang wie diese Vorbereitung allein (30 Bögen: 9,1 s gegenüber 2,5 s; mit vierfach gedrosselter CPU 43 s
 * gegenüber 10 s). Das Setzen der Seiten und das Schreiben der Datei laufen danach ohne Zwischenstand im Hauptfaden.
 */
export const PDF_GESAMT_FAKTOR = 4.2;

/** Zwischenstand einer laufenden Aktion: Satz, Schritt n von von (von = 0: kein Zähler). */
export interface ArbeitFortschritt {
  text: string;
  n: number;
  von: number;
  /** An den ersten Bögen gemessene Gesamtdauer in Sekunden, in Fünferschritten; fehlt, solange zu wenig gemessen ist. */
  schaetzungSek?: number;
}

let phaseStart = 0;
let letzteSchaetzung: number | undefined;

let fortschritt: ArbeitFortschritt | null = null;

/** Zwischenstand der laufenden Aktion, sonst null (R17-O1/D4/A4: „Bogen 12 von 30"). */
export function arbeitFortschritt(): ArbeitFortschritt | null {
  return fortschritt;
}

/** Hook: Zwischenstand der laufenden Aktion; die Oberfläche zeichnet bei jedem Schritt neu. */
export function useArbeitFortschritt(): ArbeitFortschritt | null {
  return useSyncExternalStore(abonnieren, arbeitFortschritt, arbeitFortschritt);
}

/**
 * Zwischenstand melden und der Oberfläche ein Bild geben, damit er erscheint, bevor der nächste schwere Schritt den
 * Hauptfaden belegt. Außerhalb einer laufenden Aktion ohne Wirkung.
 */
export async function fortschrittMelden(text: string, n = 0, von = 0): Promise<void> {
  if (aktuell === null) return;
  const jetzt = zeitJetzt();
  if (von > 0 && n === 0) {
    phaseStart = jetzt;
    letzteSchaetzung = undefined;
  }
  // Ab dem vierten vorbereiteten Bogen (und mindestens einer halben Sekunde Messung): Gesamtdauer hochrechnen, auf fünf Sekunden gerundet.
  if (von > 0 && n >= 4 && jetzt - phaseStart >= 500) {
    letzteSchaetzung = Math.max(5, Math.ceil(((jetzt - phaseStart) / n) * von * PDF_GESAMT_FAKTOR / 5000) * 5);
  }
  fortschritt = { text, n, von, ...(letzteSchaetzung != null ? { schaetzungSek: letzteSchaetzung } : {}) };
  melden();
  await naechstesBild();
}

/** Der Satz zum Zwischenstand, etwa „12 von 30 Bögen vorbereitet (QR-Code, Übersicht)". */
export function fortschrittSatz(f: ArbeitFortschritt): string {
  return f.von > 0 ? `${f.n} von ${f.von} ${f.text}` : f.text;
}

/** Schließt der Nutzer die Seite mitten in der Erzeugung, fragt der Browser nach (R17-O1). */
function vorSchliessen(e: BeforeUnloadEvent): void {
  e.preventDefault();
  e.returnValue = "";
}

/** Name der gerade laufenden Aktion, sonst null. */
export function arbeitetGerade(): string | null {
  return aktuell;
}

/** Hook: Name der laufenden Aktion, sonst null — die Oberfläche zeichnet bei jedem Wechsel neu. */
export function useArbeitet(): string | null {
  return useSyncExternalStore(abonnieren, arbeitetGerade, arbeitetGerade);
}

/** Der Oberfläche ein Bild geben (Sperre sichtbar machen), bevor schwere Arbeit den Hauptfaden belegt. */
export function naechstesBild(): Promise<void> {
  return new Promise((fertig) => {
    let erledigt = false;
    const los = () => {
      if (erledigt) return;
      erledigt = true;
      fertig();
    };
    // Im verdeckten Tab ruft der Browser keinen Bildrückruf auf: Die Rückfallzeit hält die Erzeugung nicht an.
    setTimeout(los, 250);
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(() => setTimeout(los, 0));
    else setTimeout(los, 0);
  });
}

/**
 * `aktion` unter dem Namen `was` ausführen, sofern gerade nichts anderes läuft.
 * Ein zweiter Aufruf in der Zeit tut nichts und meldet `lief: false`.
 */
export async function arbeiten<T>(was: string, aktion: () => Promise<T>): Promise<{ lief: true; wert: T } | { lief: false }> {
  if (aktuell !== null) return { lief: false };
  aktuell = was;
  fortschritt = null;
  lauf = { von: zeitJetzt(), bis: Infinity, was };
  if (typeof window !== "undefined") window.addEventListener("beforeunload", vorSchliessen);
  melden();
  try {
    await naechstesBild();
    return { lief: true, wert: await aktion() };
  } finally {
    aktuell = null;
    fortschritt = null;
    if (typeof window !== "undefined") window.removeEventListener("beforeunload", vorSchliessen);
    if (lauf) lauf.bis = zeitJetzt();
    melden();
  }
}

/** Zeitbasis der Ereigniszeit (`Event.timeStamp`): Millisekunden seit dem Seitenstart. */
function zeitJetzt(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

let lauf: { von: number; bis: number; was: string } | null = null;

/**
 * Wurde der Tipp mit der Ereigniszeit `zeit` (`event.timeStamp`) während des letzten oder des laufenden Laufs
 * ausgeführt? Die Erzeugung blockiert den Hauptfaden mehrere Sekunden: Ein zweiter Tipp, der schon nach 150 ms
 * erfolgte, wird erst danach bearbeitet — und fände dann Sperre und Zeitfenster längst abgelaufen. Die Ereigniszeit
 * verrät, dass er zu früh kam (R13-G1).
 */
export function tippWaehrendLauf(zeit: number, was?: string): boolean {
  if (!lauf || !Number.isFinite(zeit)) return false;
  // R19-K4/N2: Ein Tipp auf eine ANDERE Ausgabe (CSV nach Lageblatt) ist kein Doppeltipp und wird nicht verschluckt.
  if (was !== undefined && lauf.was !== was) return false;
  return zeit >= lauf.von && zeit <= lauf.bis + NACHLAUF_MS;
}

/**
 * Ein Tipp kurz NACH dem Ende des Laufs gehört noch zum Doppeltipp (R14-G1): Der Finger tippte auf den gesperrten
 * Knopf, sah nichts, und tippt nach Sekunden noch einmal — oder ein Prüfer wartet, bis der Knopf wieder frei ist,
 * und tippt dann sofort. Wer die Datei bewusst ein zweites Mal will, liest erst die Quittung.
 */
export const NACHLAUF_MS = 1200;

/** Nur für Tests. */
export function arbeitetZuruecksetzen(): void {
  aktuell = null;
  fortschritt = null;
  lauf = null;
  melden();
}
