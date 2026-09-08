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
 * Gerät gelesen hat, findet im Export exakt dieselben Zahlen wieder.
 *
 * Gesucht, gefiltert und vorsortiert wird weiterhin in einheiten-liste.ts —
 * die Tabelle bekommt die fertige Anzeigeliste und ordnet sie höchstens nach
 * einer angeklickten Spalte um.
 */

import { staerke, unterbringungMWD, verpflegung } from "@bos/eeb-format/model";
import { einheitAnzeigename, orgLabel, vokabText, vokabularFuer, zeitgruppe } from "./hilfen";
import { MeldeStatus, type MeldeEintrag } from "@bos/meldekopf/einsaetze";
import { summiereBoegen, type EinsatzSummen } from "./auswertung";

/** Eine Tabellenzeile: eine gemeldete Einheit mit allen Zahlen der Übersicht. */
export interface TabellenZeile {
  eintrag: MeldeEintrag;
  einheit: string;
  teilEtikett: string;
  organisation: string;
  zugEtikett: string;
  fuehrer: number;
  unterfuehrer: number;
  mannschaft: number;
  gesamt: number;
  verpflegung: number;
  vegetarisch: number;
  vegan: number;
  unterbringungM: number;
  unterbringungW: number;
  unterbringungD: number;
  diesel: number;
  benzin: number;
  gemisch: number;
  fahrzeuge: number;
  fahrzeugTypen: string;
  stand: string;
  /** Zählt in die Summen (neueste Revision, nicht abgerückt/aufgegangen). */
  anwesend: boolean;
}

/** Spaltenschlüssel — zugleich Sortierschlüssel der anklickbaren Köpfe. */
export type TabellenSpalte =
  | "einheit"
  | "organisation"
  | "zugEtikett"
  | "fuehrer"
  | "unterfuehrer"
  | "mannschaft"
  | "gesamt"
  | "verpflegung"
  | "vegetarisch"
  | "vegan"
  | "unterbringungM"
  | "unterbringungW"
  | "unterbringungD"
  | "diesel"
  | "benzin"
  | "gemisch"
  | "fahrzeuge"
  | "stand";

export interface SpaltenDefinition {
  schluessel: TabellenSpalte;
  /** Spaltenkopf; kurz, weil 18 Spalten nebeneinander stehen. */
  kopf: string;
  /** Langfassung als title/aria — „F" allein sagt am Bildschirm nichts. */
  titel: string;
  /** Zahlenspalte: rechtsbündig und absteigend vorsortiert. */
  zahl: boolean;
}

/**
 * Spaltenfolge der Tabelle. Reihenfolge wie im CSV der Übersicht: erst wer
 * (Einheit, Organisation, Zug), dann wie stark, dann was gebraucht wird.
 */
export const TABELLEN_SPALTEN: SpaltenDefinition[] = [
  { schluessel: "einheit", kopf: "Einheit", titel: "Einheit", zahl: false },
  { schluessel: "organisation", kopf: "Org.", titel: "Organisation", zahl: false },
  { schluessel: "zugEtikett", kopf: "Zug", titel: "Zug", zahl: false },
  { schluessel: "fuehrer", kopf: "F", titel: "Führer", zahl: true },
  { schluessel: "unterfuehrer", kopf: "U", titel: "Unterführer", zahl: true },
  { schluessel: "mannschaft", kopf: "M", titel: "Mannschaft", zahl: true },
  { schluessel: "gesamt", kopf: "Ges.", titel: "Stärke gesamt", zahl: true },
  { schluessel: "verpflegung", kopf: "Verpfl.", titel: "Verpflegung gesamt", zahl: true },
  { schluessel: "vegetarisch", kopf: "veg.", titel: "Verpflegung vegetarisch", zahl: true },
  { schluessel: "vegan", kopf: "vegan", titel: "Verpflegung vegan", zahl: true },
  { schluessel: "unterbringungM", kopf: "Unt. M", titel: "Unterbringung männlich", zahl: true },
  { schluessel: "unterbringungW", kopf: "Unt. W", titel: "Unterbringung weiblich", zahl: true },
  { schluessel: "unterbringungD", kopf: "Unt. D", titel: "Unterbringung divers", zahl: true },
  { schluessel: "diesel", kopf: "Diesel", titel: "Diesel (Liter)", zahl: true },
  { schluessel: "benzin", kopf: "Benzin", titel: "Benzin (Liter)", zahl: true },
  { schluessel: "gemisch", kopf: "Gemisch", titel: "Gemisch (Liter)", zahl: true },
  { schluessel: "fahrzeuge", kopf: "Kfz", titel: "Fahrzeuge", zahl: true },
  { schluessel: "stand", kopf: "Stand", titel: "Stand der Meldung", zahl: false },
];

/** Fahrzeug-Kurzbezeichnungen einer Einheit, z. B. „GKW / MzKW" (wie im CSV). */
function fahrzeugTypen(e: MeldeEintrag): string {
  const tabelle = vokabularFuer(e.bogen.einheit.organisation, "fahrzeug");
  return e.bogen.fahrzeuge
    .map((f) => vokabText(f.typ, tabelle))
    .filter(Boolean)
    .join(" / ");
}

/** Meldungen → Tabellenzeilen, Reihenfolge unverändert. */
export function tabellenZeilen(eintraege: MeldeEintrag[]): TabellenZeile[] {
  return eintraege.map((e) => {
    const b = e.bogen;
    const st = staerke(b);
    const vp = verpflegung(b);
    const u = unterbringungMWD(b);
    const sb = b.sofortbedarf;
    return {
      eintrag: e,
      einheit: einheitAnzeigename(b.einheit),
      teilEtikett: e.teilEtikett ?? "",
      organisation: orgLabel(b.einheit.organisation),
      zugEtikett: e.zugEtikett ?? "",
      fuehrer: st.fuehrer,
      unterfuehrer: st.unterfuehrer,
      mannschaft: st.mannschaft,
      gesamt: st.gesamt,
      verpflegung: vp.gesamt,
      vegetarisch: vp.vegetarisch,
      vegan: vp.vegan,
      unterbringungM: u.m,
      unterbringungW: u.w,
      unterbringungD: u.d,
      diesel: sb?.dieselLiter ?? 0,
      benzin: sb?.benzinLiter ?? 0,
      gemisch: sb?.gemischLiter ?? 0,
      fahrzeuge: b.fahrzeuge.length,
      fahrzeugTypen: fahrzeugTypen(e),
      stand: zeitgruppe(b.stand),
      anwesend: e.status === MeldeStatus.ANWESEND,
    };
  });
}

/**
 * Summenzeile der Tabelle — über genau die anwesenden Zeilen der Auswahl.
 *
 * Absichtlich nicht über alle Meldungen des Einsatzes: die Tabelle zeigt, was
 * Suche und Filter übrig lassen, und eine Summe, die etwas anderes zählt als
 * die Zeilen darüber, wäre in einer Lagebesprechung eine falsche Zahl. Die
 * Gesamtsummen des Einsatzes stehen unverändert in der Stärkeleiste.
 */
export function tabellenSumme(zeilen: TabellenZeile[]): EinsatzSummen {
  return summiereBoegen(zeilen.filter((z) => z.anwesend).map((z) => z.eintrag.bogen));
}

export type Sortierrichtung = "auf" | "ab";

/**
 * Nach einer Spalte sortierte Kopie. Bei Gleichstand entscheidet der
 * Einheitenname, damit die Reihenfolge stabil bleibt und die Tabelle beim
 * Umschalten nicht springt.
 */
export function zeilenSortieren(
  zeilen: TabellenZeile[],
  spalte: TabellenSpalte,
  richtung: Sortierrichtung,
): TabellenZeile[] {
  const vorzeichen = richtung === "auf" ? 1 : -1;
  const zahl = TABELLEN_SPALTEN.find((s) => s.schluessel === spalte)?.zahl ?? false;
  return [...zeilen].sort((a, b) => {
    const wa = a[spalte];
    const wb = b[spalte];
    const vergleich = zahl
      ? (wa as number) - (wb as number)
      : String(wa).localeCompare(String(wb), "de");
    return vergleich * vorzeichen || a.einheit.localeCompare(b.einheit, "de");
  });
}

// ------------------------------------------------------------ Gemerkte Sicht

export type EinheitenAnsicht = "karten" | "tabelle";

const SPEICHER_ANSICHT = "eeb.einheiten-ansicht";

/**
 * Zuletzt gewählte Darstellung. Ein Meldekopf, der mit der Tabelle arbeitet,
 * will sie nach jedem Scan wiederfinden — und nicht bei jeder Rückkehr in den
 * Einsatz erneut umschalten. Gilt geräteweit, nicht je Einsatz: die Vorliebe
 * hängt am Arbeitsplatz, nicht an der Lage.
 */
export function gemerkteAnsicht(): EinheitenAnsicht {
  try {
    return localStorage.getItem(SPEICHER_ANSICHT) === "tabelle" ? "tabelle" : "karten";
  } catch {
    return "karten";
  }
}

/** Darstellung merken (localStorage kann im privaten Modus werfen). */
export function merkeAnsicht(a: EinheitenAnsicht): void {
  try {
    localStorage.setItem(SPEICHER_ANSICHT, a);
  } catch {
    /* Merken ist Komfort, kein Muss. */
  }
}
