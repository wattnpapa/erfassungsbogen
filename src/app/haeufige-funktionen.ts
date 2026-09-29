/**
 * Die häufigsten Funktionen einer Einheit — als antippbare Liste im leeren
 * Feld „Funktion hinzufügen".
 *
 * Das Feld zeigte beim Antippen nichts, erst nach dem ersten Buchstaben: Bei
 * 19 Personen mit je ein, zwei Funktionen hieß das jedes Mal Tastatur auf,
 * Buchstabe tippen, Vorschlag wählen — mit Handschuhen die mühsamste Stelle
 * des Personal-Schritts (Audit Runde 2, R2-G5).
 *
 * Quellen (1 und 2 zusammen nach Häufigkeit, 3 füllt auf):
 *  1. die StAN-Sollplätze des Einheitstyps (nur THW; je Sollplatz so oft, wie
 *     er besetzt wird — ein Mannschaftsplatz ohne eigene Funktion zählt als
 *     „He", die Grundfunktion der Helferinnen und Helfer),
 *  2. die Funktionen, die im Bogen schon vergeben sind — so kommen auch bei
 *     Organisationen ohne Funktionsvokabular die eigenen Freitexte
 *     („Maschinist") nach dem ersten Eintippen per Tipp wieder,
 *  3. beim THW die Zusatzfunktionen, die in fast jeder Einheit vorkommen
 *     (Sprechfunk, Sanitätshelfer, Atemschutz) — die StAN nennt nur die
 *     Grundfunktion eines Platzes, gerade die Zusatzfunktionen der Helfer sind
 *     aber das, was man für 19 Personen einträgt.
 */

import { OrganisationsTyp, StaerkeRolle, type Person, type VokabularWert } from "@bos/eeb-format/model";

/** THW_FUNKTIONEN: 5 He (Fachhelfer/in). */
const THW_HELFER = 5;
/** THW_FUNKTIONEN: 30 Spr, 31 SanHe, 32 AGT — StAN-weit die häufigsten Zusatzfunktionen. */
const THW_ALLGEMEINE_ZUSATZFUNKTIONEN = [30, 31, 32];

/** Höchstzahl der Einträge — dieselbe Länge wie die Trefferliste beim Tippen. */
export const HAEUFIGE_FUNKTIONEN_MAX = 8;

function schluessel(w: VokabularWert): string | undefined {
  if (w.code != null) return `c${w.code}`;
  const t = w.freitext?.trim();
  return t ? `f${t.toLowerCase()}` : undefined;
}

/**
 * Häufigste Funktionen, absteigend nach Anzahl; bei Gleichstand gewinnt, was
 * zuerst vorkommt — die StAN steht in Führungsreihenfolge (Zugführer vor
 * Helfer), die Liste liest sich also wie die Stärkenachweisung.
 */
export function haeufigeFunktionen(
  org: OrganisationsTyp,
  stan: readonly Person[],
  personal: readonly Person[],
  max = HAEUFIGE_FUNKTIONEN_MAX,
): VokabularWert[] {
  const zaehler = new Map<string, { wert: VokabularWert; anzahl: number; zuerst: number }>();
  let lauf = 0;
  const zaehle = (w: VokabularWert) => {
    const k = schluessel(w);
    if (!k) return;
    const eintrag = zaehler.get(k);
    if (eintrag) eintrag.anzahl++;
    else zaehler.set(k, { wert: w.code != null ? { code: w.code } : { freitext: w.freitext!.trim() }, anzahl: 1, zuerst: lauf++ });
  };
  const thw = org === OrganisationsTyp.THW;
  for (const p of stan) {
    if (p.funktionen.length > 0) p.funktionen.forEach(zaehle);
    else if (thw && p.staerkeRolle === StaerkeRolle.MANNSCHAFT) zaehle({ code: THW_HELFER });
  }
  for (const p of personal) p.funktionen.forEach(zaehle);
  const liste = [...zaehler.values()]
    .sort((a, b) => b.anzahl - a.anzahl || a.zuerst - b.zuerst)
    .map((e) => e.wert);
  if (thw) {
    for (const code of THW_ALLGEMEINE_ZUSATZFUNKTIONEN) {
      if (!funktionVergeben(liste, { code })) liste.push({ code });
    }
  }
  return liste.slice(0, max);
}

/** Ist `w` schon unter `werte` (gleicher Code bzw. gleicher Freitext)? */
export function funktionVergeben(werte: readonly VokabularWert[], w: VokabularWert): boolean {
  const k = schluessel(w);
  return k != null && werte.some((x) => schluessel(x) === k);
}
