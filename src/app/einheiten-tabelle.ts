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
import { einheitAnzeigename, orgLabel, vokabText, vokabularFuer, zeitpunktDeutsch } from "./hilfen";
import { MeldeStatus, type EinsatzArt, type MeldeEintrag } from "@bos/meldekopf/einsaetze";
import { FELD_GESAMTSTAERKE, bogenDiff, diffKurzfassung } from "@bos/meldekopf/meldung-diff";
import { summiereBoegen, unterbringungLage, verpflegungLage, zaehltInLage, type EinsatzSummen } from "./auswertung";
import { eintreffzeit, zeitLang, zeitpunktZuMs } from "./eintrag-zeiten";
import { revisionenJe } from "./einheiten-index";

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

/** Kurztext für die Tabellenspalte „Bedarf": „Ruhezeit · Unterbr. · Diesel 400 l". */
export function bedarfKurztext(b: Erfassungsbogen): string {
  return bedarfMarken(b)
    .map((m) => m.kurz)
    .join(" · ");
}

/** Hat die Meldung irgendeinen Sofortbedarf (auch nur Kraftstoff)? */
export function hatSofortbedarf(e: MeldeEintrag): boolean {
  return bedarfMarken(e.bogen).length > 0;
}

/**
 * Bedarfsfilter der Einheitenliste. „Nur mit Sofortbedarf" traf fast alle,
 * weil jede Einheit Kraftstoff meldet (Audit Runde 2, R2-K4). Gefiltert wird
 * darum auf das, was jetzt zu entscheiden ist — oder gezielt auf Ruhezeit bzw.
 * Unterbringung (Sprung aus den Kopfzahlen). Abgerückte fallen immer heraus:
 * für sie ist nichts mehr zu entscheiden.
 */
export type BedarfsFilter = "dringend" | "ruhezeit" | "unterbringung";

export function passtZuBedarfsfilter(e: MeldeEintrag, filter: BedarfsFilter): boolean {
  if (e.status !== MeldeStatus.ANWESEND) return false;
  const sb = e.bogen.sofortbedarf;
  if (filter === "ruhezeit") return !!sb?.ruhezeitErforderlich;
  if (filter === "unterbringung") return !!sb?.unterbringung;
  return bedarfMarken(e.bogen).some((m) => m.dringend);
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
  for (const e of eintraege) {
    const bisher = erste.get(e.einheitSchluessel);
    if (bisher == null || e.empfangenAm < bisher) erste.set(e.einheitSchluessel, e.empfangenAm);
  }
  const reihe = [...erste].sort((a, b) => a[1] - b[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  return new Map(reihe.map(([schluessel], i) => [schluessel, i + 1]));
}

/** „Neu": vor weniger als 30 Minuten eingetroffen — was seit der Übernahme dazukam. */
export const NEU_MS = 30 * 60 * 1000;

export function istNeu(e: MeldeEintrag, jetzt = Date.now()): boolean {
  return jetzt - eintreffzeit(e) < NEU_MS;
}

// ------------------------------------------------------------ Lücken

/**
 * Kurzform eines offenen Punkts der Meldung für Karte und Lageblatt: „1
 * Lücke" sagte nicht, worum es geht — dahinter stand etwa ein Sitzplatz-
 * Hinweis „15 in den erfassten Fahrzeugen für 19 Personen" (Audit Runde 3,
 * R3-K7). Bekannte Punkte bekommen ein Stichwort, alle anderen ihren Anfang.
 */
export function lueckeKurz(text: string): string {
  const sitz = /^Sitzplätze: \d+ in den erfassten Fahrzeugen für \d+ Personen — (\d+)/.exec(text);
  if (sitz) return `Sitzplätze fehlen: ${sitz[1]}`;
  if (/^Keine telefonische Erreichbarkeit/.test(text)) return "keine Rufnummer";
  if (/hat noch kein Kennzeichen/.test(text)) return "Kennzeichen fehlt";
  if (/kein Kraftfahrer/.test(text)) return "kein Kraftfahrer";
  if (/^Ort\/Auftrag ist noch leer/.test(text)) return "Ort/Auftrag leer";
  if (/^Einsatzzeitraum .* ist vorbei/.test(text)) return "Zeitraum vorbei";
  if (/^Stärke ist 0/.test(text)) return "Stärke 0";
  const kopf = text.split(/[:—]/)[0]!.trim();
  if (kopf.length > 0 && kopf.length <= 32 && kopf !== text) return `${kopf} prüfen`;
  return text.length <= 32 ? text.replace(/\.$/, "") : `${text.slice(0, 30).trimEnd()} …`;
}

/** „Sitzplätze fehlen: 4" bzw. „Sitzplätze fehlen: 4 + 2 weitere" — leer ohne Lücken. */
export function lueckenText(texte: string[]): string {
  if (texte.length === 0) return "";
  const erst = lueckeKurz(texte[0]!);
  return texte.length === 1 ? erst : `${erst} + ${texte.length - 1} weitere`;
}

// ------------------------------------------------------------ Folgemeldungen

/**
 * Was eine Folgemeldung an der Einheit geändert hat — für Karte, Kompaktzeile
 * und Sammelquittung. Eine Folgemeldung erbt die Eintreffzeit (R2-K1); an ihr
 * ist sie deshalb nicht als neu zu erkennen. Maßgeblich ist hier der Eingang
 * der Fassung (`empfangenAm`), nicht das Eintreffen der Einheit (Audit
 * Runde 3, R3-K1).
 */
export interface FolgeAenderung {
  /** Eingang der aktuellen Fassung (Geräteuhr, ms). */
  gemeldetAm: number;
  /** „Stärke 12 → 9 (−3)", „Diesel … / 2 Änderungen", „inhaltlich unverändert". */
  kurz: string;
  /** Gesamtstärke vorher/nachher, nur wenn sie sich geändert hat. */
  staerkeVorher?: number;
  staerkeNachher?: number;
  /** Die Gesamtstärke ist gesunken — das muss auffallen. */
  verlust: boolean;
}

/**
 * Ist diese Fassung eine Folgemeldung der Einheit? Ja, wenn es eine ältere
 * Fassung gibt und die aktuelle von außen kam — eine hier entstandene
 * Rest-Fassung nach Aufteilen oder Zusammenführen ist keine Meldung.
 */
export function folgeAenderung(kopf: MeldeEintrag, alle: MeldeEintrag[]): FolgeAenderung | null {
  if (kopf.quelle === "aufteilung" || kopf.quelle === "zusammenfuehrung") return null;
  const vorige = revisionenJe(alle, kopf.einheitSchluessel).find((r) => r.id !== kopf.id && r.empfangenAm <= kopf.empfangenAm);
  if (!vorige) return null;
  const d = bogenDiff(vorige.bogen, kopf.bogen);
  const vorher = staerke(vorige.bogen).gesamt;
  const nachher = staerke(kopf.bogen).gesamt;
  return {
    gemeldetAm: kopf.empfangenAm,
    kurz: folgeKurztext(d, vorher, nachher),
    ...(vorher !== nachher ? { staerkeVorher: vorher, staerkeNachher: nachher } : {}),
    verlust: nachher < vorher,
  };
}

/**
 * Kurzfassung einer Folgemeldung: Stärke zuerst (mit Differenz), dann
 * Fahrzeuge, dann bis zu zwei Bedarfsänderungen mit Wert („Diesel 200 l →
 * 400 l") und geänderte Freitexte nur mit Namen. `diffKurzfassung` allein
 * sagte bei Weinsberg „2 Änderungen" — welche, stand erst hinter einem Tipp.
 */
function folgeKurztext(d: ReturnType<typeof bogenDiff>, vorher: number, nachher: number): string {
  if (d.anzahl === 0) return "inhaltlich unverändert";
  const teile: string[] = [];
  let erklaert = 0;
  if (vorher !== nachher || d.staerke.some((a) => a.feld === FELD_GESAMTSTAERKE)) {
    const diff = nachher - vorher;
    teile.push(`Stärke ${vorher} → ${nachher}${diff !== 0 ? ` (${diff > 0 ? "+" : "−"}${Math.abs(diff)})` : ""}`);
    // Ab- und Zugänge im Personal SIND die Stärkeänderung.
    erklaert += d.staerke.length + d.personalZugang.length + d.personalAbgang.length;
  }
  const fz = diffKurzfassung({ ...d, staerke: [] });
  if (d.fahrzeugeZugang.length > 0 || d.fahrzeugeAbgang.length > 0) {
    teile.push(fz);
    erklaert += d.fahrzeugeZugang.length + d.fahrzeugeAbgang.length;
  }
  // Die M/W/D-Aufteilung folgt der Stärke — neben ihr nur Lärm.
  const bedarf = vorher !== nachher ? d.bedarf.filter((a) => a.feld !== "Unterbringung M/W/D") : d.bedarf;
  erklaert += d.bedarf.length - bedarf.length;
  for (const a of bedarf.slice(0, Math.max(0, 3 - teile.length))) {
    teile.push(`${a.feld} ${a.vorher} → ${a.nachher}`);
    erklaert++;
  }
  for (const a of d.sonstiges.slice(0, Math.max(0, 3 - teile.length))) {
    teile.push(`${a.feld} geändert`);
    erklaert++;
  }
  const rest = d.anzahl - erklaert;
  if (rest > 0) teile.push(teile.length === 0 ? `${rest} ${rest === 1 ? "Änderung" : "Änderungen"}` : `${rest} weitere ${rest === 1 ? "Änderung" : "Änderungen"}`);
  return teile.join(" · ");
}

/** Wann die aktuelle Fassung einging — Sortierschlüssel „zuletzt gemeldet". */
export function zuletztGemeldet(e: MeldeEintrag): number {
  return e.empfangenAm;
}

/**
 * Eingang der jüngsten Meldung einer Sammlung (Geräteuhr, ms) — neue
 * Einheiten wie Folgemeldungen; hier entstandene Fassungen (Aufteilen,
 * Zusammenführen) zählen nicht. Nach „Einsatz importieren…" tragen die
 * Meldungen die Empfangszeit des alten Geräts, die Zahl sagt also auch dort,
 * wann zuletzt etwas einging (Audit Runde 3, R3-K5). null ohne Meldung.
 */
export function letzteMeldung(eintraege: MeldeEintrag[]): number | null {
  let max: number | null = null;
  for (const e of eintraege) {
    if (e.quelle === "aufteilung" || e.quelle === "zusammenfuehrung") continue;
    if (max == null || e.empfangenAm > max) max = e.empfangenAm;
  }
  return max;
}

/** Fassung vor weniger als 30 Minuten eingegangen (Marke „neue Fassung", R3-K1). */
export function frischGemeldet(e: MeldeEintrag, jetzt = Date.now()): boolean {
  return jetzt - e.empfangenAm < NEU_MS;
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
  // F/U/M und Kfz direkt bei der Gesamtstärke: am Laptop lagen sie erst nach
  // seitlichem Rollen im Bild (Rahmen 894 px, Tabelle 1 826 px; Audit
  // Runde 3, R3-K7). Vier schmale Zahlenspalten kosten zusammen kaum Breite.
  { schluessel: "fuehrer", kopf: "F", titel: "Führer", zahl: true },
  { schluessel: "unterfuehrer", kopf: "U", titel: "Unterführer", zahl: true },
  { schluessel: "mannschaft", kopf: "M", titel: "Mannschaft", zahl: true },
  { schluessel: "gesamt", kopf: "Ges.", titel: "Stärke gesamt", zahl: true },
  { schluessel: "fahrzeuge", kopf: "Kfz", titel: "Fahrzeuge", zahl: true },
  // Der Bedarf steht VOR den Zeiten: nach ihm wird gesucht („wer schläft
  // zuerst?"), der Stand ist Beiwerk und steht ganz hinten (K1, K2).
  { schluessel: "bedarf", kopf: "Bedarf", titel: "Sofortbedarf", zahl: false },
  { schluessel: "eingetroffen", kopf: "Eingetr.", titel: "Eingetroffen", zahl: false, sortiertNach: "eingetroffenAm" },
  { schluessel: "auftrag", kopf: "Auftrag", titel: "Auftrag / Notiz der Führungsstelle", zahl: false },
  { schluessel: "abgerueckt", kopf: "Abger.", titel: "Abgerückt", zahl: false, sortiertNach: "abgerueckAm" },
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
      // Eine Zeitform für Karte, Tabelle und Lageblatt: „29.09.2026, 14:05".
      // Vorher stand hier „14:05" neben „170805jul26", auf dem Blatt
      // „28.09.2026, 14:05" (Audit Runde 2, R2-A6).
      eingetroffen: zeitLang(eintreffzeit(e)),
      eingetroffenAm: eintreffzeit(e),
      abgerueckt: e.abgerueckAm != null ? zeitLang(e.abgerueckAm) : "",
      abgerueckAm: e.abgerueckAm ?? 0,
      stand: zeitpunktDeutsch(b.stand),
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
