/**
 * Lagemonitor: die Zahlen für die Anzeige im Führungsfahrzeug.
 *
 * Reine Logik ohne Oberfläche. Die Summen kommen aus `auswertung.ts`, damit der
 * Monitor dieselben Zahlen zeigt wie die Einsatzansicht und das Lageblatt. Der
 * Monitor zeigt nur Zusammenzählungen und Einheitsnamen — keine Personen: Ein
 * Bildschirm im Fahrzeug sieht jeder, der vorbeikommt.
 */

import { staerke, type EebZeitpunkt } from "@bos/eeb-format/model";
import { angabenAlterWort, angabenZeit, type AngabenSeit } from "./angaben-alter";
import { einheitOrt } from "@bos/meldekopf/darstellung";
import { EinsatzArt, MeldeStatus, revisionen, type Einsatzsammlung, type MeldeEintrag } from "@bos/meldekopf/einsaetze";
import { aggregiere, aktuelleMeldungen, type EinsatzSummen } from "./auswertung";
import { eintreffzeit } from "./eintrag-zeiten";
import { letzteMeldung, sollstaerkeAnteil } from "./einheiten-tabelle";
import { geltendeJeEinheit } from "./fassung-vorrang";
import { einheitAnzeigename, funkrufText, nurSollstaerke, natoZeitstempel, orgLabel, vokabText, vokabularFuer } from "./hilfen";

/** Datum-Zeit-Gruppe in ihren Teilen: „17" „1806" „feb" „24" (Tag, Uhrzeit, Monat, Jahr). */
export function dtgTeile(d: Date): { tag: string; zeit: string; monat: string; jahr: string } {
  const s = natoZeitstempel(d);
  return { tag: s.slice(0, 2), zeit: s.slice(2, 6), monat: s.slice(6, 9), jahr: s.slice(9) };
}

const zwei = (n: number) => String(n).padStart(2, "0");

const MONATE_KURZ = ["Jan.", "Feb.", "März", "Apr.", "Mai", "Juni", "Juli", "Aug.", "Sept.", "Okt.", "Nov.", "Dez."];

/** Uhrzeit und Datum lesbar getrennt: „10:28" und „25. Okt. 2026" (R10-H3; statt der Funk-Gruppe „25 1028 okt 26"). */
export function uhrTeile(d: Date): { zeit: string; datum: string } {
  return { zeit: `${zwei(d.getHours())}:${zwei(d.getMinutes())}`, datum: `${d.getDate()}. ${MONATE_KURZ[d.getMonth()]} ${d.getFullYear()}` };
}

/** „27 Personen" / „1 Person": Zahl und Wort mit Leerzeichen (R12-K4/R12-H1). */
export function personenText(n: number): string {
  return `${n} ${n === 1 ? "Person" : "Personen"}`;
}

/**
 * Sofortbedarf als eine Zeile für den Monitor, nur mit dem, was da ist:
 * „Bedarf: Diesel 120 l · Unterbringung 24 · Ruhezeit 3×" (R10-K5). Wie in der Kopfzeile der
 * Einsatzansicht (`sum.kraftstoff.dieselLiter`, `unterbringungAngefordert.personen`, `ruhezeitErforderlich`);
 * Benzin und Gemisch stehen dort nur im Aufklappteil und hier gar nicht.
 */
export function bedarfText(s: EinsatzSummen): string | null {
  const teile: string[] = [];
  // Reihenfolge wie die Kopfzeile der Einsatzansicht; Verpflegung und „Personen" wie dort (R12-K4).
  if ((s.verpflegungAngefordert ?? 0) > 0) teile.push(`Verpflegung ${s.verpflegungAngefordert}`);
  if (s.unterbringungBenoetigt > 0) teile.push(`Unterbringung ${personenText(s.unterbringungAngefordert.personen)}`);
  teile.push(...kraftstoffTeile(s.kraftstoff));
  if (s.ruhezeitErforderlich > 0) teile.push(`Ruhezeit ${s.ruhezeitErforderlich} ${s.ruhezeitErforderlich === 1 ? "Einheit" : "Einheiten"}`);
  // Schnell erfasste Einheiten haben keinen Bedarf angegeben: Das ist keine Aussage „nichts nötig" (R14-W1).
  const ohne = s.bedarfOhneAngabe ?? 0;
  if (ohne > 0) teile.push(bedarfOhneAngabeText(ohne));
  return teile.length > 0 ? `Bedarf: ${teile.join(" · ")}` : null;
}

/** „bei 1 Einheit nicht erfasst" / „bei 3 Einheiten nicht erfasst" — für Monitor, Einsatzansicht und Lageblatt (R14-W1). */
export function bedarfOhneAngabeText(n: number): string {
  return `bei ${n} ${n === 1 ? "Einheit" : "Einheiten"} nicht erfasst`;
}

/**
 * Kraftstoffe mit Menge größer 0 in der Schreibweise des Lageblatts: „Diesel 580 l", „Benzin 160 l",
 * „Gemisch 10 l" (R13-K1). Kurzzeile der Einsatzansicht und Lagemonitor nennen damit alle angeforderten Sorten.
 */
export function kraftstoffTeile(k: { dieselLiter: number; benzinLiter: number; gemischLiter: number }): string[] {
  const teile: string[] = [];
  if (k.dieselLiter > 0) teile.push(`Diesel ${k.dieselLiter} l`);
  if (k.benzinLiter > 0) teile.push(`Benzin ${k.benzinLiter} l`);
  if (k.gemischLiter > 0) teile.push(`Gemisch ${k.gemischLiter} l`);
  return teile;
}

/**
 * Einsatzdauer ausgeschrieben: „1 Tag, 6 Stunden, 6 Minuten". Tage fehlen unter
 * 24 Stunden. `null`, wenn der Beginn fehlt oder in der Zukunft liegt.
 */
export function dauerText(beginn: number | null, jetzt: number): string | null {
  if (beginn == null || jetzt < beginn) return null;
  const minuten = Math.floor((jetzt - beginn) / 60_000);
  const tage = Math.floor(minuten / 1440);
  const stunden = Math.floor((minuten % 1440) / 60);
  const rest = minuten % 60;
  const teil = (n: number, eins: string, viele: string) => `${n} ${n === 1 ? eins : viele}`;
  return [
    ...(tage > 0 ? [teil(tage, "Tag", "Tage")] : []),
    teil(stunden, "Stunde", "Stunden"),
    teil(rest, "Minute", "Minuten"),
  ].join(", ");
}

/** Eine Zeile der Einheitentabelle: Organisation, Ort, Funkrufname, Einheitentyp, Führer/Unterführer/Mannschaft. */
export interface EinheitZeile {
  /** Schlüssel der Meldung — stabil, solange die Einheit gleich bleibt. */
  id: string;
  orga: string;
  ort: string;
  /** Funkrufname des ersten Fahrzeugs, das einen hat; leer, wenn keins einen trägt. */
  funkruf: string;
  typ: string;
  fuehrer: number;
  unterfuehrer: number;
  mannschaft: number;
  /** Niemand hat gezählt: die Zahlen sind nur die Sollstärke der Vorbelegung (in der Tabelle mit „S" markiert, R10-K4). */
  soll: boolean;
  /** Alter der Meldung in Minuten, nur ab {@link VERALTET_ALTER_MIN} (knappe Altersmarke je Zeile, R11-K1). */
  alterMin?: number;
  /** Der Stand im Bogen liegt weit vor dem Eingang: die Altersmarke meint den Stand, nicht das Eintreffen (R14-K1). */
  standAlt?: boolean;
  /** Zug der Einheit (R14-K3). */
  zug?: string;
  /** Auftrag/Notiz des Meldekopfs, auf eine Zeile gekürzt (R14-K3). */
  auftrag?: string;
}

/** Satz unter dem Bedarf der Einsatzansicht (R14-W1). */
export function bedarfOhneAngabeHinweis(n: number): string {
  return `Der Bedarf ist ${bedarfOhneAngabeText(n)} — „keine" bei Unterbringung, Ruhezeit und Betriebsstoff heißt dort nicht „nichts nötig".`;
}

/** Alter einer Zeile mit Minuten: „6 Std 40 Min", ab einem Tag „2 T" (R14-K3: abgerundete Stunden verwischten 1:30 und 1:59). */
export function alterKurz(min: number): string {
  // Ausgeschrieben: Auf dem Fernseher liest sich „103 T" nicht als „Tage" (R18-K5).
  if (min >= 1440) return `${Math.floor(min / 1440)} ${Math.floor(min / 1440) === 1 ? "Tag" : "Tage"}`;
  return `${Math.floor(min / 60)} Std ${min % 60} Min`;
}

/** Auftrag für die Monitorzeile: eine Zeile, höchstens 48 Zeichen. */
export function auftragKurz(t: string): string {
  const eine = t.replace(/\s+/g, " ").trim();
  return eine.length > 48 ? `${eine.slice(0, 47).trimEnd()}…` : eine;
}

/** Ab diesem Alter einer Meldung warnen Kopfzeile, Kachel und Monitor (R10-K1, R11-K1). */
export const VERALTET_ALTER_MIN = 60;

/** Alter der Meldungen der anwesenden (zählenden) Einheiten — nicht der abgerückten, die die Lage nicht mehr tragen (R11-K1). */
export interface AnwesendenAlter {
  /** Eingang der ältesten Meldung unter den Anwesenden (ms). */
  aeltesteMs: number;
  anwesend: number;
  /** Davon älter als {@link VERALTET_ALTER_MIN} Minuten. */
  aelter: number;
}

/**
 * Wie alt sind die Meldungen, auf denen die Stärke beruht? „Letzte Meldung vor 1 Min" sagte nichts, wenn
 * eine frische abgerückte Einheit die jüngste war und die anwesenden Stunden alt waren (R11-K1).
 * `null` ohne anwesende Einheit.
 */
export function anwesendenAlter(anwesende: readonly { empfangenAm: number; bogen?: { stand: EebZeitpunkt }; angaben?: AngabenSeit }[], jetzt: number): AnwesendenAlter | null {
  if (anwesende.length === 0) return null;
  const grenze = VERALTET_ALTER_MIN * 60_000;
  // Alter der Angaben (Stand), nicht des Eintreffens (R14-K1); ohne Bogen gilt der Eingang.
  const zeit = (e: { empfangenAm: number; bogen?: { stand: EebZeitpunkt }; angaben?: AngabenSeit }) =>
    e.bogen ? angabenZeit({ empfangenAm: e.empfangenAm, bogen: e.bogen, angaben: e.angaben }) : e.empfangenAm;
  return {
    aeltesteMs: Math.min(...anwesende.map(zeit)),
    anwesend: anwesende.length,
    aelter: anwesende.filter((e) => jetzt - zeit(e) >= grenze).length,
  };
}

/**
 * „älteste Meldung vor 8 Std 20 Min, 5 von 6 älter als 1 Std" — nur, wenn mindestens eine anwesende Einheit
 * älter als eine Stunde ist, sonst `null`.
 */
export function anwesendenAlterText(a: AnwesendenAlter | null, jetzt: number): string | null {
  if (!a || a.aelter === 0) return null;
  return `älteste Meldung ${alterText(a.aeltesteMs, jetzt)}, ${a.aelter} von ${a.anwesend} älter als 1 Std`;
}

/**
 * Altersaussage für Papier: „⚠ älteste Meldung vor 5 Std 0 Min, 4 von 6 älter als 1 Std", gerechnet zum Druckzeitpunkt
 * `jetzt`; `null`, wenn keine anwesende Meldung eine Stunde alt ist (R12-K3).
 */
export function lageblattAlterText(empfangenAm: readonly number[], jetzt: number): string | null {
  const t = anwesendenAlterText(anwesendenAlter(empfangenAm.map((z) => ({ empfangenAm: z })), jetzt), jetzt);
  return t ? `⚠ ${t}` : null;
}

/**
 * Zeile des Lageblatts, deren Meldung zum Druckzeitpunkt eine Stunde alt oder älter ist: „⚠ Meldung vor 6 Std 41 Min".
 * Der Kopf nennt „4 von 7 älter als 1 Std"; die Zeile sagt, welche (R13-K2). `null` darunter oder ohne Eingang.
 */
export function lageblattZeilenAlter(empfangenAm: number | undefined, jetzt: number, wort: "Meldung" | "Stand" = "Meldung"): string | null {
  if (empfangenAm == null || jetzt - empfangenAm < VERALTET_ALTER_MIN * 60_000) return null;
  return `⚠ ${wort} ${alterText(empfangenAm, jetzt)}`;
}

/**
 * Stärke „F / U / M / G" der Summenzeile: Mit dreistelligen Werten bräche die schmale Spalte um, und die
 * Gesamtstärke stünde allein in der zweiten Zeile (R13-A5). Dann ohne Leerzeichen um die Schrägstriche.
 */
export function staerkeSummenText(f: number, u: number, m: number, g: number, kompakt?: boolean): string {
  const breit = `${f} / ${u} / ${m} / ${g}`;
  return (kompakt ?? breit.length > 14) ? `${f}/${u}/${m}/${g}` : breit;
}

/**
 * Eine Schreibweise für die ganze Spalte „Stärke F / U / M / G" (R18-W5): Sobald eine Zeile oder die Summe zu breit
 * wird, stehen alle Zeilen kompakt — vorher wechselte die Schreibweise von Zeile zu Zeile.
 */
export function staerkeSpalteKompakt(zeilen: readonly [number, number, number, number][]): boolean {
  return zeilen.some(([f, u, m, g]) => `${f} / ${u} / ${m} / ${g}`.length > 14);
}

/** Zwischensumme je Zug: „älteste Meldung vor 5 Std 0 Min" — nur ab einer Stunde, sonst `null` (R12-K3). */
export function zugAlterText(aeltesteMeldungAm: number | undefined, jetzt: number): string | null {
  if (aeltesteMeldungAm == null || jetzt - aeltesteMeldungAm < VERALTET_ALTER_MIN * 60_000) return null;
  return `⚠ älteste Meldung ${alterText(aeltesteMeldungAm, jetzt)}`;
}

/** Was sich zuletzt in der Lage bewegt hat — der Fernseher soll nicht nur Zahlen ändern, sondern sagen, warum (Audit Runde 6, R6-K1). */
export interface Bewegung {
  id: string;
  name: string;
  art: "Eingetroffen" | "Abgerückt" | "Wieder da" | "Folgemeldung";
  zeit: number;
  /** Bei Folgemeldungen die Stärkeänderung: „Stärke 4 → 1 (−3)" (R7-K2). */
  detail?: string;
}

/** Eine Meldezeit, die weiter als das in der Zukunft liegt, deutet auf eine falsche Geräteuhr (R7-K3). */
export const ZUKUNFT_TOLERANZ_MS = 5 * 60_000;

/** So lange gilt eine Bewegung als „gerade eben" und steht im Hauptbild. */
export const BEWEGUNG_FENSTER_MS = 15 * 60_000;

export interface Lagebild {
  name: string;
  ort?: string;
  uebung: boolean;
  /** Art der Sammlung als Wort („Einsatz", „Übung", „Veranstaltung"). */
  art: string;
  summen: EinsatzSummen;
  /** Anwesende Einheiten, zuletzt gemeldete zuerst. */
  einheiten: EinheitZeile[];
  /** Einheiten, die abgerückt sind (zählen nicht mehr mit). */
  abgerueckt: number;
  /** Wann zuletzt etwas in die Sammlung kam (Date.now()), sonst `null`. */
  letzteMeldung: number | null;
  /** Früheste Eintreffzeit aller Meldungen — Vorschlag für den Beginn, wenn keiner gesetzt ist. */
  ersteMeldung: number | null;
  /** Abrücken, Rückkehr und Folgemeldungen der letzten Minuten, jüngste zuerst. */
  bewegungen: Bewegung[];
  /** Meldezeiten liegen in der Zukunft (Geräteuhr nachgestellt?) — der Monitor nennt das, statt „gerade eben" zu behaupten. */
  zeitenPruefen: boolean;
  /** Einheiten, für die niemand gezählt hat (reine Sollstärke), und ihre Personen: stecken in der Gesamtstärke (R9-K1). */
  sollstaerke: { einheiten: number; personen: number };
  /** Alter der Meldungen der anwesenden Einheiten (R11-K1); `null` ohne Anwesende. */
  anwesendenAlter: AnwesendenAlter | null;
}

export function lagebildArt(art: EinsatzArt): string {
  return art === EinsatzArt.UEBUNG ? "Übung" : art === EinsatzArt.VERANSTALTUNG ? "Veranstaltung" : "Einsatz";
}

function bewegungenSeit(einsatz: Einsatzsammlung, jetzt: number): Bewegung[] {
  const aus: Bewegung[] = [];
  for (const k of geltendeJeEinheit(einsatz.eintraege)) {
    const name = einheitAnzeigename(k.bogen.einheit);
    for (const v of k.vermerke ?? []) {
      if (jetzt - v.zeit > BEWEGUNG_FENSTER_MS) continue;
      if (v.text === "Abgerückt") aus.push({ id: `${k.id}-a-${v.zeit}`, name, art: "Abgerückt", zeit: v.zeit });
      else if (/^Wieder als anwesend/.test(v.text)) aus.push({ id: `${k.id}-w-${v.zeit}`, name, art: "Wieder da", zeit: v.zeit });
    }
    if (jetzt - k.empfangenAm <= BEWEGUNG_FENSTER_MS && !k.angaben?.kennzeichnung) {
      const revs = revisionen(einsatz.eintraege, k.einheitSchluessel);
      if (revs.length > 1) {
        const davor = revs.find((r) => r.id !== k.id);
        const alt = davor ? staerke(davor.bogen).gesamt : null;
        const neu = staerke(k.bogen).gesamt;
        const diff = alt != null && alt !== neu ? ` (${neu - alt > 0 ? "+" : "−"}${Math.abs(neu - alt)})` : "";
        aus.push({
          id: `${k.id}-f`,
          name,
          art: "Folgemeldung",
          zeit: k.empfangenAm,
          detail: alt != null && alt !== neu ? `Stärke ${alt} → ${neu}${diff}` : undefined,
        });
      } else if (k.status !== MeldeStatus.ABGERUECKT) {
        // Neue Einheit: erklärt, warum Zahl und Tabelle springen (R7-W4).
        aus.push({ id: `${k.id}-e`, name, art: "Eingetroffen", zeit: k.empfangenAm });
      }
    }
  }
  return aus.sort((a, b) => b.zeit - a.zeit);
}

export function lagebild(einsatz: Einsatzsammlung, jetzt: number = Date.now()): Lagebild {
  const geltend = geltendeJeEinheit(einsatz.eintraege);
  const einheiten = [...aktuelleMeldungen(einsatz.eintraege, einsatz.art)]
    // Erst die mit ⚠ (Angaben älter als eine Stunde), älteste zuerst: Bei knappem Platz werden die unauffälligen Zeilen
    // gekürzt, nicht die gewarnten (R15-K2). Danach zuletzt gemeldet zuerst (R8-K5); bei gleicher Zeit bleibt die Reihenfolge.
    .sort((a, b) => {
      const alt = (m: MeldeEintrag) => jetzt - angabenZeit(m) >= VERALTET_ALTER_MIN * 60_000;
      return Number(alt(b)) - Number(alt(a)) || (alt(a) ? angabenZeit(a) - angabenZeit(b) : b.empfangenAm - a.empfangenAm);
    })
    .map((m): EinheitZeile => {
      const e = m.bogen.einheit;
      const st = staerke(m.bogen);
      return {
        id: m.id,
        orga: e.organisationName?.trim() || orgLabel(e.organisation),
        ort: einheitOrt(e),
        funkruf: m.bogen.fahrzeuge.map((f) => funkrufText(f, e)).find((t) => t !== "") ?? "",
        typ: vokabText(e.einheitsTyp, vokabularFuer(e.organisation, "einheitstyp"), "name").trim(),
        fuehrer: st.fuehrer,
        unterfuehrer: st.unterfuehrer,
        mannschaft: st.mannschaft,
        soll: nurSollstaerke(m.bogen),
        ...(jetzt - angabenZeit(m) >= VERALTET_ALTER_MIN * 60_000 ? { alterMin: Math.floor((jetzt - angabenZeit(m)) / 60_000) } : {}),
        ...(m.zugEtikett ? { zug: m.zugEtikett } : {}),
        ...(m.notiz?.trim() ? { auftrag: auftragKurz(m.notiz) } : {}),
        ...(angabenAlterWort(m) === "Stand" ? { standAlt: true } : {}),
      };
    });
  return {
    name: einsatz.name,
    ort: einsatz.ort,
    uebung: einsatz.art === EinsatzArt.UEBUNG,
    art: lagebildArt(einsatz.art),
    summen: aggregiere(einsatz.eintraege, einsatz.art),
    einheiten,
    abgerueckt: geltend.filter((e) => e.status === MeldeStatus.ABGERUECKT).length,
    // Dieselbe Zählweise wie Kopf, Startseite und Import (R18-K2).
    letzteMeldung: letzteMeldung(einsatz.eintraege),
    ersteMeldung: geltend.length > 0 ? Math.min(...geltend.map(eintreffzeit)) : null,
    bewegungen: bewegungenSeit(einsatz, jetzt),
    sollstaerke: sollstaerkeAnteil(einsatz.eintraege, einsatz.art),
    anwesendenAlter: anwesendenAlter(aktuelleMeldungen(einsatz.eintraege, einsatz.art), jetzt),
    zeitenPruefen: einsatz.eintraege.some((e) => e.empfangenAm - jetzt > ZUKUNFT_TOLERANZ_MS) ||
      geltend.some((e) => eintreffzeit(e) - jetzt > ZUKUNFT_TOLERANZ_MS),
  };
}

/** Wert für das `datetime-local`-Feld (Ortszeit, ohne Sekunden). */
export function zuEingabeWert(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${zwei(d.getMonth() + 1)}-${zwei(d.getDate())}T${zwei(d.getHours())}:${zwei(d.getMinutes())}`;
}

/** Eingabewert → Zeitpunkt; leer oder ungültig → `null`. */
export function ausEingabeWert(wert: string): number | null {
  if (!wert) return null;
  const ms = new Date(wert).getTime();
  return Number.isFinite(ms) ? ms : null;
}

/** „vor 4 Min" / „gerade eben" / „vor 2 Std 5 Min" — Alter einer Meldung für die Datenstand-Zeile. */
export function alterText(zeit: number, jetzt: number): string {
  if (zeit - jetzt > ZUKUNFT_TOLERANZ_MS) return "liegt in der Zukunft";
  const min = Math.max(0, Math.floor((jetzt - zeit) / 60_000));
  if (min < 1) return "gerade eben";
  if (min < 60) return `vor ${min} Min`;
  const std = Math.floor(min / 60);
  if (std < 24) return `vor ${std} Std ${min % 60} Min`;
  const tage = Math.floor(std / 24);
  return `vor ${tage} ${tage === 1 ? "Tag" : "Tagen"}`;
}
