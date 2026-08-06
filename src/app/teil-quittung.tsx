/**
 * Teil-Quittung: die Kästchenzeile des mehrteiligen QR-Transports.
 *
 * Ein großer Bogen reist in mehreren QR-Codes. Wer sie am Meldekopf abfilmt,
 * muss unter Zeitdruck wissen, WELCHER Teil noch fehlt — „Teil 3 von 5
 * gescannt" verlangt dafür Lesen und Mitzählen, und wer den Stapel schon in
 * der Hand hält, blättert dann ratend weiter. Die Zeile zeigt jeden Teil als
 * Kästchen wie auf einem amtlichen Bogen: eingegangene sind abgestempelt,
 * offene stehen leer.
 *
 * Der Fortschrittssatz daneben bleibt die maßgebliche Auskunft — er nennt die
 * fehlenden Teile ausdrücklich (siehe {@link fehlendeTeileText}) und trägt
 * damit dieselbe Information für Screenreader und für den nativen
 * System-Scanner, der nur eine Textzeile annimmt. Die Kästchenzeile ist der
 * Blick, nicht die einzige Quelle; sie ist deshalb `aria-hidden`.
 */

import type { SegmentTeil } from "../codec";

/** Noch fehlende Teilnummern, aufsteigend. Leer bei unsegmentiert/vollständig. */
export function fehlendeTeile(teile: SegmentTeil[]): number[] {
  const anzahl = teile[0]?.anzahl ?? 0;
  if (anzahl < 2) return [];
  const haben = new Set(teile.map((t) => t.teilNr));
  const fehlen: number[] = [];
  for (let n = 1; n <= anzahl; n++) if (!haben.has(n)) fehlen.push(n);
  return fehlen;
}

/**
 * „Teil 4" / „Teile 2 und 4" / „Teile 2, 3 und 5" — benennt, was noch fehlt,
 * statt es den Lesenden ausrechnen zu lassen. Leerer String, wenn nichts fehlt.
 */
export function fehlendeTeileText(teile: SegmentTeil[]): string {
  const fehlen = fehlendeTeile(teile);
  if (fehlen.length === 0) return "";
  if (fehlen.length === 1) return `Teil ${fehlen[0]}`;
  const letzter = fehlen[fehlen.length - 1];
  return `Teile ${fehlen.slice(0, -1).join(", ")} und ${letzter}`;
}

/**
 * Derselbe Befund als feldtauglicher Satzteil, mit passendem Verb: „es fehlt
 * noch Teil 4" / „es fehlen noch die Teile 2 und 4". Leer, wenn nichts fehlt.
 */
export function fehltNochSatz(teile: SegmentTeil[]): string {
  const fehlen = fehlendeTeile(teile);
  if (fehlen.length === 0) return "";
  if (fehlen.length === 1) return `es fehlt noch Teil ${fehlen[0]}`;
  return `es fehlen noch die ${fehlendeTeileText(teile)}`;
}

/**
 * Die Kästchenzeile. Rendert nichts bei unsegmentiertem Transport (`anzahl < 2`)
 * oder leerem Sammelstand — dort gibt es keinen Fortschritt zu zeigen.
 */
export function TeilQuittung({ teile }: { teile: SegmentTeil[] }) {
  const anzahl = teile[0]?.anzahl ?? 0;
  if (anzahl < 2) return null;
  const haben = new Set(teile.map((t) => t.teilNr));
  return (
    <ol className="teil-quittung" aria-hidden="true">
      {Array.from({ length: anzahl }, (_, i) => i + 1).map((n) => (
        <li key={n} className={haben.has(n) ? "ein" : "offen"}>
          {n}
        </li>
      ))}
    </ol>
  );
}
