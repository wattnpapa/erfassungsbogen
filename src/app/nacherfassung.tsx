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
 * („OV Albstadt" ~ „Albstadt") oder der kürzere Name steht wortweise VORN im
 * längeren („Albstadt" ~ „Albstadt-Ebingen", „Biberach" ~ „Biberach/Riß").
 * Nur Anlass für eine Rückfrage — zusammengelegt wird erst auf „Ja".
 *
 * Nicht mehr irgendwo im Namen: „Neu-Ulm" enthielt „Ulm", und die App schlug
 * für zwei Ortsverbände „dieselbe Einheit" vor (Audit Runde 4, R4-E1).
 */
export function aehnlicherOrt(a: string | undefined, b: string | undefined): boolean {
  const wa = ortWoerter(a);
  const wb = ortWoerter(b);
  if (wa.length === 0 || wb.length === 0) return false;
  const [kurz, lang] = wa.length <= wb.length ? [wa, wb] : [wb, wa];
  return kurz.every((w, i) => lang[i] === w);
}

/** Einheitstyp als Vergleichsschlüssel; leer, wenn keiner eingetragen ist. */
function typSchluessel(t: { code?: number; freitext?: string } | undefined): string {
  if (t?.code != null) return `c${t.code}`;
  return (t?.freitext ?? "").trim().toLocaleLowerCase("de-DE");
}

/**
 * Tragen beide Einheiten einen Einheitstyp, und sind es verschiedene? Dann
 * sind es zwei Einheiten — Bergungsgruppe und Fachgruppe Räumen desselben
 * Ortsverbands treffen am Meldekopf oft nacheinander ein (R4-E1). Fehlt der
 * Typ auf einer Seite (Papierphase, R2-A5), bleibt die Rückfrage.
 */
export function andererEinheitstyp(
  a: { einheitsTyp?: { code?: number; freitext?: string } },
  b: { einheitsTyp?: { code?: number; freitext?: string } },
): boolean {
  const ta = typSchluessel(a.einheitsTyp);
  const tb = typSchluessel(b.einheitsTyp);
  return ta !== "" && tb !== "" && ta !== tb;
}

/** So weit darf „gestern" zurückliegen, damit es ohne Nachfrage gilt (Blatt von 23:50, abgetippt um 00:20). */
export const GESTERN_STILL_MS = 6 * 60 * 60_000;

/** Ergebnis von {@link eintreffzeitPruefen}. */
export type EintreffzeitWahl =
  /** Leer oder unlesbar — dann gilt wie bisher die Zeit der Aufnahme. */
  | { art: "keine" }
  /** Eindeutig: diese Zeit gilt. */
  | { art: "zeit"; zeit: number }
  /** Die Uhrzeit liegt heute in der Zukunft, gestern wäre lange her: fragen. */
  | { art: "frage"; heute: number; gestern: number };

/**
 * „09:40" → Eintreffzeit. Das Datum ist heute. Liegt die Uhrzeit mehr als
 * eine Viertelstunde in der Zukunft, ist gestern nur dann still gemeint, wenn
 * das kurz her ist (Blatt von 23:50, abgetippt um 00:20, siehe
 * {@link GESTERN_STILL_MS}). Sonst ist es meist ein Dreher — „21:12" statt
 * „20:12" um 20:42 landete bisher auf gestern und machte die Einheit fast
 * einen Tag älter (Audit Runde 4, R4-E3). Dann fragt die App (heute oder gestern).
 */
export function eintreffzeitPruefen(uhrzeit: string, jetzt = Date.now()): EintreffzeitWahl {
  const m = /^(\d{1,2}):(\d{2})$/.exec(uhrzeit.trim());
  if (!m) return { art: "keine" };
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return { art: "keine" };
  const d = new Date(jetzt);
  d.setHours(h, min, 0, 0);
  const heute = d.getTime();
  if (heute - jetzt <= 15 * 60_000) return { art: "zeit", zeit: heute };
  d.setDate(d.getDate() - 1);
  const gestern = d.getTime();
  return jetzt - gestern <= GESTERN_STILL_MS ? { art: "zeit", zeit: gestern } : { art: "frage", heute, gestern };
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
