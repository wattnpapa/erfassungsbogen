/**
 * Sitzplätze je Fahrzeug — Grundlage des Transport-Sanitychecks.
 *
 * Hintergrund: Auf dem Bogen stehen Personal und Fahrzeuge nebeneinander, ohne
 * dass jemand nachrechnet, ob die Leute überhaupt mitfahren können. Zehn Helfer
 * und ein LKW Lkr gl (3 Plätze) ergeben eine Meldung, die vor Ort nicht
 * aufgeht — genau das soll auffallen, bevor der Bogen rausgeht.
 *
 * Zwei Quellen für die Platzzahl, in dieser Reihenfolge:
 *  1. Fahrzeugtyp aus dem Vokabular der Organisation (`sitzplaetze` am
 *     VokabularEintrag) — derzeit gepflegt für das THW.
 *  2. Freitext-Fahrzeuge über die Kurzzeichen-Tabelle unten. Nötig, weil
 *     Feuerwehr, Hilfsorganisationen und OV-Fahrzeuge ausschließlich über den
 *     Freitext-Ausweg erfasst werden.
 *
 * GRUNDSATZ: lieber schweigen als raten. Was hier nicht sicher zuzuordnen ist,
 * bleibt `undefined`; die Bilanz zählt es als „unbekannt" und der Sanitycheck
 * meldet dann gar nichts. Ein falscher Alarm ist teurer als ein verpasster —
 * die Zahlen sind Richtwerte, kein Fahrzeugschein.
 */

import type { Fahrzeug } from "../model";
import type { VokabularEintrag } from "./thw";

/**
 * Sitzplätze aus dem Kurzzeichen eines Freitext-Fahrzeugs (Richtwerte).
 *
 * Feuerwehr: die Normbesatzungen nach DIN/FwDV 3 — Trupp 1/2 = 3,
 * Staffel 1/5 = 6, Gruppe 1/8 = 9. Rettungsdienst: die üblichen Besatzungen
 * (RTW/KTW 3, NEF 2). Anhänger und Abrollbehälter 0.
 *
 * Reihenfolge ist Absicht: Anhänger zuerst (ein „Anh SW" ist kein SW),
 * Sonderfälle vor ihren allgemeineren Mustern (ELW 2 vor ELW, TSF vor TLF-
 * artigen Kürzeln). Erstes passendes Muster gewinnt.
 *
 * Bewusst NICHT aufgenommen (zu uneinheitlich → bleibt unbekannt): Boote aller
 * Art, Dekon-Fahrzeuge, Feldkochherde, Sonderfahrzeuge der HiOrg.
 */
export const SITZPLAETZE_FREITEXT: { muster: RegExp; plaetze: number }[] = [
  // Anhänger, Auflieger, Abrollbehälter — befördern niemanden.
  { muster: /^(anh|ab|fwa)\b|anhänger|auflieger|abrollbehälter/, plaetze: 0 },
  // Mannschaftstransport: Gruppenbesatzung (MzKW/MTW/MTF, auch OV-Fahrzeuge).
  { muster: /^(mtw|mtf|mzkw|mzf|btkw)\b/, plaetze: 9 },
  // Einsatzleitwagen: ELW 2 als Führungsfahrzeug größer als ELW 1.
  { muster: /^elw\s*2/, plaetze: 7 },
  { muster: /^elw/, plaetze: 4 },
  // Kommandowagen und Pkw.
  { muster: /^(kdow|kdw|pkw|kombi)\b/, plaetze: 5 },
  // Löschfahrzeuge mit Gruppenbesatzung.
  { muster: /^(lf|hlf)\b/, plaetze: 9 },
  // Löschfahrzeuge mit Staffelbesatzung.
  { muster: /^(mlf|stlf|tsf)\b/, plaetze: 6 },
  // Truppbesatzung: Tanklösch-, Rüst-, Schlauch-, Gerätewagen, Hubrettung, WLF.
  { muster: /^(tlf|rw|sw|gw|dlk|dlak|tmf?|wlf|flf)\b/, plaetze: 3 },
  // Rettungsdienst.
  { muster: /^nef\b/, plaetze: 2 },
  { muster: /^(rtw|ktw|itw|naw)\b/, plaetze: 3 },
];

/** Sitzplätze eines Freitext-Fahrzeugs, oder undefined wenn kein Muster passt. */
export function sitzplaetzeAusFreitext(text: string): number | undefined {
  // Normalisieren auf das, worauf die Muster ausgelegt sind: Kleinschreibung,
  // Bindestrich als Worttrenner ("GW-San" → "gw san"), ein Leerzeichen.
  const t = text.toLowerCase().replace(/[-_/]/g, " ").replace(/\s+/g, " ").trim();
  return SITZPLAETZE_FREITEXT.find((e) => e.muster.test(t))?.plaetze;
}

/**
 * Sitzplätze eines Fahrzeugs (inkl. Fahrer/in) — aus dem Vokabular der
 * Organisation oder, bei Freitext, aus der Kurzzeichen-Tabelle.
 * `undefined` = unbekannt, dann wird nicht geprüft.
 */
export function sitzplaetzeFuer(f: Fahrzeug, tabelle: VokabularEintrag[]): number | undefined {
  if (f.typ.code != null) return tabelle.find((e) => e.code === f.typ.code)?.sitzplaetze;
  const freitext = f.typ.freitext?.trim();
  return freitext ? sitzplaetzeAusFreitext(freitext) : undefined;
}

/** Transportbilanz eines Bogens: was an Plätzen da ist, was gebraucht wird. */
export interface SitzplatzBilanz {
  /** Summe der Sitzplätze aller Fahrzeuge mit bekannter Platzzahl. */
  plaetze: number;
  /** Anzahl Fahrzeuge ohne hinterlegte Platzzahl — solange > 0 wird nicht gewarnt. */
  unbekannt: number;
  /** Gesamtstärke der Einheit. */
  benoetigt: number;
  /** Fehlende Plätze, aber nur wenn die Bilanz vollständig ist (sonst 0). */
  fehlend: number;
}

export function sitzplatzBilanz(
  fahrzeuge: Fahrzeug[],
  tabelle: VokabularEintrag[],
  benoetigt: number,
): SitzplatzBilanz {
  let plaetze = 0;
  let unbekannt = 0;
  for (const f of fahrzeuge) {
    const p = sitzplaetzeFuer(f, tabelle);
    if (p == null) unbekannt++;
    else plaetze += p;
  }
  // Nur eine lückenlose Bilanz darf eine Lücke behaupten: ein einziges
  // Fahrzeug mit unbekannter Platzzahl kann das Defizit komplett auffangen.
  const fehlend = unbekannt === 0 ? Math.max(0, benoetigt - plaetze) : 0;
  return { plaetze, unbekannt, benoetigt, fehlend };
}
