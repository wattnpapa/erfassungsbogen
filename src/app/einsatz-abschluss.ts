/**
 * Übergabe und Abschluss je Einsatz (R18-A6, R18-A7).
 *
 * Zwei Dinge hat das Papier, die das Gerät bisher nicht kannte: das Kästchen „übertragen [ ] von … um …" (die Übergabe
 * ist angekommen) und das Ende des Einsatzes. Beides steht in keiner Meldung und nicht in der Sammlung (die liegt im
 * geteilten Kern und kennt weder „beendet" noch „übergeben"), sondern in einem eigenen Schlüssel der App:
 * `eeb.abschluss.v1`, je Einsatz-Kennung ein Eintrag. Keine Personendaten außer dem frei getippten Empfänger der
 * Übergabe; der Eintrag wandert mit der Datensicherung und fällt mit „Alle Daten löschen".
 */
import { einsatzWerte } from "./lagemonitor-speicher";

export const ABSCHLUSS_SCHLUESSEL = "eeb.abschluss.v1";

/** So lang darf der Empfänger der Übergabe sein. */
export const UEBERGABE_AN_MAX = 80;

export interface Abschluss {
  /** Der Einsatz wurde am Gerät als beendet markiert (Date.now()). */
  beendetAm?: number;
  /** Die Übergabe (Weitergabe, Lageblatt, Datei an den Stab) ist angekommen — wann (Date.now()). */
  uebergabeAm?: number;
  /** An wen: Name oder Stelle, frei getippt (kann leer sein). */
  uebergabeAn?: string;
}

const werte = einsatzWerte<Abschluss>(ABSCHLUSS_SCHLUESSEL, (x): x is Abschluss => !!x && typeof x === "object" && !Array.isArray(x));

/** Was für den Einsatz vermerkt ist; leer, wenn nichts. */
export function abschlussLaden(einsatzId: string): Abschluss {
  const a = werte.laden(einsatzId);
  if (!a) return {};
  return {
    ...(typeof a.beendetAm === "number" && Number.isFinite(a.beendetAm) ? { beendetAm: a.beendetAm } : {}),
    ...(typeof a.uebergabeAm === "number" && Number.isFinite(a.uebergabeAm) ? { uebergabeAm: a.uebergabeAm } : {}),
    ...(typeof a.uebergabeAn === "string" && a.uebergabeAn.trim() ? { uebergabeAn: a.uebergabeAn.trim().slice(0, UEBERGABE_AN_MAX) } : {}),
  };
}

/**
 * Vermerk ändern: Felder mit Wert werden gesetzt, Felder mit `null` entfernt, die übrigen bleiben.
 * `bekannteIds` = die Einsätze, die es gibt; Einträge zu anderen fallen dabei weg. `false`, wenn der Speicher voll ist.
 */
export function abschlussSetzen(
  einsatzId: string,
  aenderung: { [K in keyof Abschluss]?: Abschluss[K] | null },
  bekannteIds: readonly string[],
): boolean {
  const neu: Abschluss = { ...abschlussLaden(einsatzId) };
  for (const [k, v] of Object.entries(aenderung) as [keyof Abschluss, unknown][]) {
    if (v == null) delete neu[k];
    else (neu as Record<string, unknown>)[k] = k === "uebergabeAn" ? String(v).trim().slice(0, UEBERGABE_AN_MAX) : v;
  }
  if (neu.uebergabeAn === "") delete neu.uebergabeAn;
  return werte.setzen(einsatzId, Object.keys(neu).length === 0 ? null : neu, bekannteIds);
}

/** Der Einsatz ist als beendet markiert. */
export function einsatzBeendet(einsatzId: string): boolean {
  return abschlussLaden(einsatzId).beendetAm != null;
}

/** „Übergabe vermerkt 28.10.2026, 01:10 an Stab Oldenburg" — für Einsatzansicht und Papier-Abgleich. */
export function abschlussUebergabeText(a: Abschluss, zeit: (ms: number) => string): string {
  if (a.uebergabeAm == null) return "";
  return `Übergabe vermerkt ${zeit(a.uebergabeAm)}${a.uebergabeAn ? ` an ${a.uebergabeAn}` : ""}`;
}

/**
 * Was für den Abschluss noch fehlt, als Aufzählung der Ausgabewege ohne Datei oder Sicherung. `getan` je Weg:
 * `true` = erzeugt. Leer, wenn alles erledigt ist.
 */
export function abschlussOffen(getan: readonly { name: string; getan: boolean }[]): string[] {
  return getan.filter((x) => !x.getan).map((x) => x.name);
}

// ---------------------------------------------------------------- R19: Stand der Lage gegen den Vermerk

/** Wie viele Einheiten seit `zeit` (Date.now()) eine neue Meldung brachten (R19-D1, R19-W1). */
export function meldungenSeit(eintraege: readonly { empfangenAm: number; einheitSchluessel: string }[], zeit: number): number {
  return new Set(eintraege.filter((e) => e.empfangenAm > zeit).map((e) => e.einheitSchluessel)).size;
}

/** „1 neue Meldung" / „3 neue Meldungen"; leer bei 0. */
export function neueMeldungenText(n: number): string {
  return n <= 0 ? "" : n === 1 ? "1 neue Meldung" : `${n} neue Meldungen`;
}

/**
 * Kurzer Stand für die Karte auf der Startseite: „beendet 04:10 · übergeben an Stab Rottenburg" (R19-A11, K7, L5).
 * Leer, wenn weder beendet noch übergeben. Kamen nach dem Vermerk Meldungen, steht es dabei („nicht mehr aktuell").
 */
export function abschlussKarteText(a: Abschluss, zeit: (ms: number) => string, eintraege: readonly { empfangenAm: number; einheitSchluessel: string }[] = []): string {
  const teile: string[] = [];
  const alt = (t: number) => {
    const n = meldungenSeit(eintraege, t);
    return n > 0 ? ` — nicht mehr aktuell, seitdem ${neueMeldungenText(n)}` : "";
  };
  if (a.beendetAm != null) teile.push(`beendet ${zeit(a.beendetAm)}${alt(a.beendetAm)}`);
  if (a.uebergabeAm != null) teile.push(`übergeben ${zeit(a.uebergabeAm)}${a.uebergabeAn ? ` an ${a.uebergabeAn}` : " (ohne Empfänger)"}${a.beendetAm == null ? alt(a.uebergabeAm) : ""}`);
  return teile.join(" · ");
}
