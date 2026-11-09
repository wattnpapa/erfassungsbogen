/**
 * Tabellensicht der Einheitenliste eines Meldekopfs.
 *
 * Die Karten der Einsatzansicht beantworten „was ist mit dieser einen
 * Einheit?" — bei 30–50 Meldungen einer Großlage fehlt daneben die Frage
 * „welche Einheit hat die meisten Kräfte / den größten Verpflegungsbedarf?".
 * Die Antwort stand bisher nur im CSV-Export, also erst in Excel und erst nach
 * einem Dateiwechsel. Hier liegt dieselbe Zeilenaufstellung als reine Logik,
 * damit die Oberfläche sie am Gerät zeigen kann.
 *
 * Bewusst dieselben Spalten wie {@link einsatzCsvInhalt}: wer die Tabelle am
 * Gerät gelesen hat, findet im Export exakt dieselben Zahlen wieder — nur in
 * anderer Folge (siehe {@link TABELLEN_SPALTEN}).
 *
 * Gesucht, gefiltert und vorsortiert wird weiterhin in einheiten-liste.ts —
 * die Tabelle bekommt die fertige Anzeigeliste und ordnet sie höchstens nach
 * einer angeklickten Spalte um.
 */

import { staerke, type Erfassungsbogen } from "@bos/eeb-format/model";
import { type MeldeEintrag } from "@bos/meldekopf/einsaetze";

// ------------------------------------------------------------ Bedarfsmarken

/** Eine Bedarfsmarke: ausgeschrieben für die Karte, kurz für die Tabellenzelle. */
export interface BedarfMarke {
  lang: string;
  kurz: string;
  /**
   * Dringend = jetzt ist etwas zu entscheiden (Ruhezeit, Unterbringung,
   * abweichende Verpflegung). Kraftstoff meldet fast jede Einheit; er ist
   * Routine für die Logistik-Summe und steht darum abgesetzt (Audit Runde 2,
   * R2-K4).
   */
  dringend: boolean;
}

/**
 * Was eine Einheit sofort braucht — nur das, was gesetzt ist. Der Bedarf
 * stand bisher allein als Summe im Kopf („Ruhezeit: 3×"); WER Ruhezeit
 * braucht, war nur über die Details jeder einzelnen Karte zu finden
 * (Führungssicht-Audit K1). Leer = kein Sofortbedarf, und dann steht auch
 * nichts da: eine Marke „Ruhezeit: nein" alarmierte, wo nichts ist.
 *
 * Verpflegung erscheint nur, wenn die gemeldete Zahl von der Stärke abweicht —
 * „Verpflegung 12" bei Stärke 12 ist der Normalfall und keine Auffälligkeit.
 * Reihenfolge: erst das Dringende, dann der Kraftstoff (R2-K4).
 */
export function bedarfMarken(b: Erfassungsbogen): BedarfMarke[] {
  const sb = b.sofortbedarf;
  if (!sb) return [];
  const marken: BedarfMarke[] = [];
  if (sb.ruhezeitErforderlich) marken.push({ lang: "Ruhezeit", kurz: "Ruhezeit", dringend: true });
  if (sb.unterbringung) marken.push({ lang: "Unterbringung angefordert", kurz: "Unterbr.", dringend: true });
  const gesamt = staerke(b).gesamt;
  if (sb.verpflegungPersonen > 0 && sb.verpflegungPersonen !== gesamt) {
    marken.push({
      lang: `Verpflegung ${sb.verpflegungPersonen} (Stärke ${gesamt})`,
      kurz: `Verpfl. ${sb.verpflegungPersonen} (St. ${gesamt})`,
      dringend: true,
    });
  }
  if (sb.dieselLiter > 0) marken.push({ lang: `Diesel ${sb.dieselLiter} l`, kurz: `Diesel ${sb.dieselLiter} l`, dringend: false });
  if (sb.benzinLiter > 0) marken.push({ lang: `Benzin ${sb.benzinLiter} l`, kurz: `Benzin ${sb.benzinLiter} l`, dringend: false });
  if (sb.gemischLiter > 0) marken.push({ lang: `Gemisch ${sb.gemischLiter} l`, kurz: `Gemisch ${sb.gemischLiter} l`, dringend: false });
  return marken;
}



/**
 * Bedarfsfilter der Einheitenliste. „Nur mit Sofortbedarf" traf fast alle,
 * weil jede Einheit Kraftstoff meldet (Audit Runde 2, R2-K4). Gefiltert wird
 * darum auf das, was jetzt zu entscheiden ist — oder gezielt auf Ruhezeit bzw.
 * Unterbringung (Sprung aus den Kopfzahlen). Abgerückte fallen immer heraus:
 * für sie ist nichts mehr zu entscheiden.
 */
export type BedarfsFilter = "dringend" | "ruhezeit" | "unterbringung";




/**
 * Laufende Nummer je Meldung: die Einheiten in der Reihenfolge, in der sie in
 * dieser Sammlung zum ersten Mal eingingen (erste Fassung, Empfangszeit) —
 * auf Karte, Tabelle und Lageblatt dieselbe. Über Funk hieß eine Zeile des
 * Lageblatts sonst „THW Biberach/Riß Fachgruppe Ortung (B)" (Audit Runde 2,
 * R2-A6). Die Empfangszeit ist unveränderlich (anders als die korrigierbare
 * Eintreffzeit) und reist beim Weitergeben mit; ein anderes Gerät mit
 * derselben Sammlung vergibt also dieselben Nummern. Wird eine Einheit
 * entfernt, rücken die späteren nach.
 */
export function meldungsNummern(eintraege: MeldeEintrag[]): Map<string, number> {
  const erste = new Map<string, number>();
  const fest = new Map<string, number>();
  for (const e of eintraege) {
    const bisher = erste.get(e.einheitSchluessel);
    if (bisher == null || e.empfangenAm < bisher) erste.set(e.einheitSchluessel, e.empfangenAm);
    if (e.nummer != null && e.nummer >= 1 && !fest.has(e.einheitSchluessel)) fest.set(e.einheitSchluessel, e.nummer);
  }
  const reihe = [...erste].sort((a, b) => a[1] - b[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  // Vom Papier übernommene Nummern (R4-A1) sind fest — doppelt vergeben gilt sie
  // nur der ersten Einheit in Eingangsreihenfolge. Alle übrigen Einheiten zählen
  // in dieser Reihenfolge die kleinsten freien Nummern; ohne feste Nummern ist
  // das wie bisher 1, 2, 3 …
  const vergeben = new Map<string, number>();
  const belegt = new Set<number>();
  for (const [schluessel] of reihe) {
    const n = fest.get(schluessel);
    if (n != null && !belegt.has(n)) {
      vergeben.set(schluessel, n);
      belegt.add(n);
    }
  }
  // Wer nach der letzten festen Einheit einging, zählt hinter der höchsten festen Nummer weiter: Eine beim
  // Entfernen entstandene Lücke (R18-A1) füllt keine spätere Einheit — auf Papier und im Funk bliebe „Nr. 2"
  // sonst nicht die entfernte Einheit. Früher Eingegangene ohne Nummer füllen weiter die kleinsten freien (R4-A1).
  const festZeiten = reihe.filter(([schluessel]) => vergeben.has(schluessel)).map(([, t]) => t);
  const spaetesteFest = festZeiten.length > 0 ? Math.max(...festZeiten) : Infinity;
  const hoechsteFest = Math.max(0, ...vergeben.values());
  for (const [schluessel, empfangen] of reihe) {
    if (vergeben.has(schluessel)) continue;
    let frei = empfangen > spaetesteFest ? hoechsteFest + 1 : 1;
    while (belegt.has(frei)) frei++;
    vergeben.set(schluessel, frei);
    belegt.add(frei);
  }
  return new Map(reihe.map(([schluessel]) => [schluessel, vergeben.get(schluessel)!]));
}





/** Eine Einheit, deren laufende Nummer sich durch eine Übernahme geändert hat (R5-W3). */
export interface NummernWechsel {
  einheitSchluessel: string;
  einheit: string;
  von: number;
  nach: number;
}








// ------------------------------------------------------------ Fremder Einsatz




/** Die Regel hinter „Anderer Einsatz?" in einem Satz — die Marke nannte nur den Verdacht, nicht den Grund (R14-W3). */
export const ORT_REGEL = "Kein Ortsname daraus kommt beim Ort der Sammlung oder bei den übrigen Einheiten vor.";





// ------------------------------------------------------------ Lücken


