/**
 * Nacherfassung vom Papier am Meldekopf („Einheit manuell erfassen…"):
 * Namensvarianten erkennen und die Eintreffzeit vom Meldeblock gleich
 * mitnehmen (Audit Runde 2, R2-A5).
 *
 *  - Handschriftlich steht „OV Albstadt" auf dem Blatt, im Einsatz steht
 *    „THW Albstadt Zugtrupp" aus der Datei. Die Ähnlichkeitsrückfrage
 *    verglich den Ort buchstabengenau („ov albstadt" ≠ „albstadt") und
 *    schwieg — die Einheit zählte doppelt.
 *  - Eine Eintreffzeit fragte der Assistent nicht ab: Jede nachgetragene
 *    Karte bekam die Uhrzeit des Abtippens und musste einzeln über „ändern"
 *    korrigiert werden.
 */

import { Feld } from "./schritte/bausteine";

/**
 * Vorsätze, die auf Papier vor dem Ortsnamen stehen, aber nicht zum Ort
 * gehören: Gliederungsbezeichnungen der Organisationen. Bewusst kurz — jedes
 * Wort hier macht die Rückfrage häufiger, nicht die Zuordnung automatisch.
 */
const VORSAETZE = new Set([
  "ov", "ortsverband", "thw", "drk", "asb", "juh", "mhd", "dlrg", "ff", "fw", "feuerwehr",
  "kv", "kreisverband", "og", "ortsgruppe", "ortsverein", "rv", "regionalverband", "bv", "lv",
]);

/** Ort ohne Vorsätze, Satzzeichen und Groß-/Kleinschreibung, als Wortliste. */
export function ortWoerter(ort: string | undefined): string[] {
  const woerter = (ort ?? "")
    .toLocaleLowerCase("de-DE")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
  let i = 0;
  while (i < woerter.length - 1 && VORSAETZE.has(woerter[i]!)) i++;
  return woerter.slice(i);
}

/**
 * Könnte das derselbe Standort sein? Gleich nach dem Abstreifen der Vorsätze
 * („OV Albstadt" ~ „Albstadt") oder der eine Name steckt wortweise im
 * anderen („Albstadt" ~ „Albstadt-Ebingen"). Nur Anlass für eine Rückfrage —
 * zusammengelegt wird erst auf „Ja".
 */
export function aehnlicherOrt(a: string | undefined, b: string | undefined): boolean {
  const wa = ortWoerter(a);
  const wb = ortWoerter(b);
  if (wa.length === 0 || wb.length === 0) return false;
  const [kurz, lang] = wa.length <= wb.length ? [wa, wb] : [wb, wa];
  for (let start = 0; start + kurz.length <= lang.length; start++) {
    if (kurz.every((w, i) => lang[start + i] === w)) return true;
  }
  return false;
}

/**
 * „09:40" → Zeitpunkt (ms). Das Datum ist heute; liegt die Uhrzeit mehr als
 * eine Viertelstunde in der Zukunft, ist gestern gemeint (Einsatz über
 * Mitternacht, Blatt von 23:50 wird um 00:20 abgetippt). Leer oder
 * unlesbar = null (dann gilt wie bisher die Zeit der Aufnahme).
 */
export function eintreffzeitAusUhrzeit(uhrzeit: string, jetzt = Date.now()): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(uhrzeit.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  const d = new Date(jetzt);
  d.setHours(h, min, 0, 0);
  if (d.getTime() - jetzt > 15 * 60_000) d.setDate(d.getDate() - 1);
  return d.getTime();
}

/**
 * Feld „Eingetroffen um" im Nacherfassungsweg. Steht auf dem ersten Schritt,
 * weil dort das Blatt oben anfängt und die Uhrzeit vom Meldeblock daneben
 * liegt. Leer = Zeit der Übernahme, wie bisher.
 */
export function EintreffzeitFeld(props: { wert: string; onAendern: (wert: string) => void }) {
  return (
    <section className="karte nacherfassung-zeit">
      <Feld titel="Eingetroffen um (vom Meldeblock)" schmal>
        <input type="time" value={props.wert} onChange={(e) => props.onAendern(e.target.value)} />
      </Feld>
      <p className="hinweis">
        Leer lassen, wenn die Einheit gerade eintrifft — dann gilt die Uhrzeit von „In Einsatz übernehmen“.
        Liegen bis dahin mehr als fünf Minuten, fragt die App, ob der Beginn der Erfassung gilt.
      </p>
    </section>
  );
}
