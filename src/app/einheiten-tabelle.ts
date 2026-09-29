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
import { einheitAnzeigename, orgLabel, vokabText, vokabularFuer, zeitgruppe } from "./hilfen";
import { MeldeStatus, type EinsatzArt, type MeldeEintrag } from "@bos/meldekopf/einsaetze";
import { summiereBoegen, unterbringungLage, verpflegungLage, zaehltInLage, type EinsatzSummen } from "./auswertung";
import { eintreffzeit, zeitKurz, zeitpunktZuMs } from "./eintrag-zeiten";

// ------------------------------------------------------------ Bedarfsmarken

/** Eine Bedarfsmarke: ausgeschrieben für die Karte, kurz für die Tabellenzelle. */
export interface BedarfMarke {
  lang: string;
  kurz: string;
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
 */
export function bedarfMarken(b: Erfassungsbogen): BedarfMarke[] {
  const sb = b.sofortbedarf;
  if (!sb) return [];
  const marken: BedarfMarke[] = [];
  if (sb.ruhezeitErforderlich) marken.push({ lang: "Ruhezeit", kurz: "Ruhezeit" });
  if (sb.unterbringung) marken.push({ lang: "Unterbringung angefordert", kurz: "Unterbr." });
  if (sb.dieselLiter > 0) marken.push({ lang: `Diesel ${sb.dieselLiter} l`, kurz: `Diesel ${sb.dieselLiter} l` });
  if (sb.benzinLiter > 0) marken.push({ lang: `Benzin ${sb.benzinLiter} l`, kurz: `Benzin ${sb.benzinLiter} l` });
  if (sb.gemischLiter > 0) marken.push({ lang: `Gemisch ${sb.gemischLiter} l`, kurz: `Gemisch ${sb.gemischLiter} l` });
  const gesamt = staerke(b).gesamt;
  if (sb.verpflegungPersonen > 0 && sb.verpflegungPersonen !== gesamt) {
    marken.push({
      lang: `Verpflegung ${sb.verpflegungPersonen} (Stärke ${gesamt})`,
      kurz: `Verpfl. ${sb.verpflegungPersonen} (St. ${gesamt})`,
    });
  }
  return marken;
}

/** Kurztext für die Tabellenspalte „Bedarf": „Ruhezeit · Unterbr. · Diesel 400 l". */
export function bedarfKurztext(b: Erfassungsbogen): string {
  return bedarfMarken(b)
    .map((m) => m.kurz)
    .join(" · ");
}

/** Hat die Meldung irgendeinen Sofortbedarf? (Filter „nur mit Sofortbedarf".) */
export function hatSofortbedarf(e: MeldeEintrag): boolean {
  return bedarfMarken(e.bogen).length > 0;
}

/**
 * Ist der Absender-Stand alt — älter als 24 Stunden vor dem Eintreffen? Ein
 * Bogen vom Juli in einer September-Lage sah bisher aus wie jeder andere
 * (K2); die Marke „alt" sagt, dass die Zahlen aus einer anderen Zeit stammen.
 */
export const STAND_ALT_MS = 24 * 60 * 60 * 1000;

export function standIstAlt(e: MeldeEintrag): boolean {
  // bogen.stand ist ein EebZeitpunkt (Minuten), die Eintreffzeit Millisekunden
  // — erst umrechnen (Audit Runde 2, R2-N4).
  return eintreffzeit(e) - zeitpunktZuMs(e.bogen.stand) > STAND_ALT_MS;
}

/** „Neu": vor weniger als 30 Minuten eingetroffen — was seit der Übernahme dazukam. */
export const NEU_MS = 30 * 60 * 1000;

export function istNeu(e: MeldeEintrag, jetzt = Date.now()): boolean {
  return jetzt - eintreffzeit(e) < NEU_MS;
}

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
  /** Sofortbedarf als Kurztext (siehe {@link bedarfKurztext}); leer = keiner. */
  bedarf: string;
  /** Eintreffzeit als Uhrzeit (bei anderem Tag mit Datum). */
  eingetroffen: string;
  /** Eintreffzeit in ms — Sortierschlüssel der Spalte „Eingetroffen". */
  eingetroffenAm: number;
  /** Abrückzeit als Uhrzeit; leer, solange die Einheit da ist. */
  abgerueckt: string;
  /** Abrückzeit in ms, 0 = nicht abgerückt — Sortierschlüssel. */
  abgerueckAm: number;
  stand: string;
  /** Absender-Stand älter als 24 h vor dem Eintreffen (Marke „alt"). */
  standAlt: boolean;
  /** Auftrag/Notiz der Führungsstelle (MeldeEintrag.notiz). */
  auftrag: string;
  /** Vor Ort (neueste Revision, nicht abgerückt/aufgegangen). */
  anwesend: boolean;
  /** Zählt in die Summen: anwesend UND gehört in diese Lage (keine fremde Übung). */
  zaehlt: boolean;
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
  | "bedarf"
  | "eingetroffen"
  | "abgerueckt"
  | "stand"
  | "auftrag";

export interface SpaltenDefinition {
  schluessel: TabellenSpalte;
  /** Spaltenkopf; kurz, weil über 20 Spalten nebeneinander stehen. */
  kopf: string;
  /** Langfassung als title/aria — „F" allein sagt am Bildschirm nichts. */
  titel: string;
  /** Zahlenspalte: rechtsbündig und absteigend vorsortiert. */
  zahl: boolean;
  /**
   * Sortiert nach diesem Feld statt nach dem angezeigten Text — die Uhrzeit
   * „09:40" steht als Text da, geordnet wird aber nach dem Zeitpunkt (sonst
   * käme „26.09., 23:00" vor „08:00" von heute).
   */
  sortiertNach?: keyof TabellenZeile;
}

/**
 * Spaltenfolge der Tabelle. Vorn steht, wonach die Führung entscheidet: wer
 * (Einheit, Zug), wie stark, was gebraucht wird, seit wann da und mit welchem
 * Auftrag. Vorher folgte die Tabelle dem CSV der Übersicht (Einheit, Org.,
 * Zug, F, U, M, Ges., Verpflegung, Unterbringung, Kraftstoff, …) — auf dem
 * Tablet endete das Bild bei „Unt. M", Bedarf, Eintreffzeit und Auftrag
 * lagen rechts außerhalb (Audit Runde 2, R2-K5). Die Aufschlüsselung von
 * Stärke, Verpflegung, Unterbringung und Kraftstoff folgt dahinter; das CSV
 * behält seine Folge, die Zahlen sind dieselben.
 */
export const TABELLEN_SPALTEN: SpaltenDefinition[] = [
  { schluessel: "einheit", kopf: "Einheit", titel: "Einheit", zahl: false },
  { schluessel: "zugEtikett", kopf: "Zug", titel: "Zug", zahl: false },
  { schluessel: "gesamt", kopf: "Ges.", titel: "Stärke gesamt", zahl: true },
  // Der Bedarf steht VOR den Zeiten: nach ihm wird gesucht („wer schläft
  // zuerst?"), der Stand ist Beiwerk und steht ganz hinten (K1, K2).
  { schluessel: "bedarf", kopf: "Bedarf", titel: "Sofortbedarf", zahl: false },
  { schluessel: "eingetroffen", kopf: "Eingetr.", titel: "Eingetroffen", zahl: false, sortiertNach: "eingetroffenAm" },
  { schluessel: "auftrag", kopf: "Auftrag", titel: "Auftrag / Notiz der Führungsstelle", zahl: false },
  { schluessel: "abgerueckt", kopf: "Abger.", titel: "Abgerückt", zahl: false, sortiertNach: "abgerueckAm" },
  { schluessel: "fuehrer", kopf: "F", titel: "Führer", zahl: true },
  { schluessel: "unterfuehrer", kopf: "U", titel: "Unterführer", zahl: true },
  { schluessel: "mannschaft", kopf: "M", titel: "Mannschaft", zahl: true },
  { schluessel: "fahrzeuge", kopf: "Kfz", titel: "Fahrzeuge", zahl: true },
  { schluessel: "organisation", kopf: "Org.", titel: "Organisation", zahl: false },
  { schluessel: "verpflegung", kopf: "Verpfl.", titel: "Verpflegung gesamt", zahl: true },
  { schluessel: "vegetarisch", kopf: "veg.", titel: "Verpflegung vegetarisch", zahl: true },
  { schluessel: "vegan", kopf: "vegan", titel: "Verpflegung vegan", zahl: true },
  { schluessel: "unterbringungM", kopf: "Unt. M", titel: "Unterbringung männlich", zahl: true },
  { schluessel: "unterbringungW", kopf: "Unt. W", titel: "Unterbringung weiblich", zahl: true },
  { schluessel: "unterbringungD", kopf: "Unt. D", titel: "Unterbringung divers", zahl: true },
  { schluessel: "diesel", kopf: "Diesel", titel: "Diesel (Liter)", zahl: true },
  { schluessel: "benzin", kopf: "Benzin", titel: "Benzin (Liter)", zahl: true },
  { schluessel: "gemisch", kopf: "Gemisch", titel: "Gemisch (Liter)", zahl: true },
  { schluessel: "stand", kopf: "Stand", titel: "Stand der Meldung (Absender)", zahl: false },
];

/** Fahrzeug-Kurzbezeichnungen einer Einheit, z. B. „GKW / MzKW" (wie im CSV). */
function fahrzeugTypen(e: MeldeEintrag): string {
  const tabelle = vokabularFuer(e.bogen.einheit.organisation, "fahrzeug");
  return e.bogen.fahrzeuge
    .map((f) => vokabText(f.typ, tabelle))
    .filter(Boolean)
    .join(" / ");
}

/**
 * Meldungen → Tabellenzeilen, Reihenfolge unverändert. Mit der Einsatzart
 * fallen Übungsmeldungen aus der Summe (nicht aus der Tabelle — sie bleiben
 * sichtbar, sie zählen nur nicht; siehe zaehltInLage).
 */
export function tabellenZeilen(eintraege: MeldeEintrag[], art?: EinsatzArt, jetzt = Date.now()): TabellenZeile[] {
  return eintraege.map((e) => {
    const b = e.bogen;
    const st = staerke(b);
    // Dieselben Regeln wie die Summen: Schnellerfassung ohne Aufteilung zählt
    // die Stärke, nicht die Ansprechpartner (R2-N5).
    const vp = verpflegungLage(b);
    const u = unterbringungLage(b);
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
      bedarf: bedarfKurztext(b),
      eingetroffen: zeitKurz(eintreffzeit(e), jetzt),
      eingetroffenAm: eintreffzeit(e),
      abgerueckt: e.abgerueckAm != null ? zeitKurz(e.abgerueckAm, jetzt) : "",
      abgerueckAm: e.abgerueckAm ?? 0,
      stand: zeitgruppe(b.stand),
      standAlt: standIstAlt(e),
      auftrag: e.notiz ?? "",
      anwesend: e.status === MeldeStatus.ANWESEND,
      zaehlt: e.status === MeldeStatus.ANWESEND && (art == null || zaehltInLage(art, b)),
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
  return summiereBoegen(zeilen.filter((z) => z.zaehlt).map((z) => z.eintrag.bogen));
}

/** Wie sich die Zeilen auf die Zählweisen verteilen (siehe {@link summenBeschriftung}). */
export interface TabellenZaehlung {
  /** Anwesend und in dieser Lage zählend — die Zahl der Stärkeleiste. */
  zaehlend: number;
  /** Anwesend, aber als Übung nicht in dieser Lage. */
  uebung: number;
  abgerueckt: number;
  zusammengefuehrt: number;
}

export function tabellenZaehlung(zeilen: TabellenZeile[]): TabellenZaehlung {
  const z: TabellenZaehlung = { zaehlend: 0, uebung: 0, abgerueckt: 0, zusammengefuehrt: 0 };
  for (const zeile of zeilen) {
    if (zeile.zaehlt) z.zaehlend++;
    else if (zeile.anwesend) z.uebung++;
    else if (zeile.eintrag.status === MeldeStatus.AUFGEGANGEN) z.zusammengefuehrt++;
    else z.abgerueckt++;
  }
  return z;
}

/**
 * Beschriftung der Summenzeile: „Summe (6 zählend · 1 Übung · 1 abgerückt)".
 *
 * Vorher hieß es „Summe (7 anwesend)" und die Stärke daneben war die von
 * sechs — die Übung zählte als anwesend, aber nicht in die Zahl. Kopfzahl,
 * Listenüberschrift und Summenzeile nannten damit drei verschiedene Zahlen
 * für „wie viele Einheiten" (K4). Jetzt sagt jede Zahl, was sie zählt; was
 * null ist, bleibt weg.
 */
export function summenBeschriftung(z: TabellenZaehlung): string {
  const teile = [`${z.zaehlend} zählend`];
  if (z.uebung > 0) teile.push(`${z.uebung} Übung`);
  if (z.abgerueckt > 0) teile.push(`${z.abgerueckt} abgerückt`);
  if (z.zusammengefuehrt > 0) teile.push(`${z.zusammengefuehrt} zusammengeführt`);
  return `Summe (${teile.join(" · ")})`;
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
  const definition = TABELLEN_SPALTEN.find((s) => s.schluessel === spalte);
  const feld: keyof TabellenZeile = definition?.sortiertNach ?? spalte;
  return [...zeilen].sort((a, b) => {
    const wa = a[feld];
    const wb = b[feld];
    const vergleich =
      typeof wa === "number" && typeof wb === "number"
        ? wa - wb
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
