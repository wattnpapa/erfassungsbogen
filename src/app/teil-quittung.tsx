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

import { useEffect, useRef } from "react";
import type { SegmentTeil } from "@bos/eeb-format/codec";

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
 *
 * Das eingehende Kästchen wird abgestempelt (`.frisch`, Keyframe `stempel-ein`
 * in index.html): Wer einen Stapel abfilmt, hält das Gerät in Bewegung und
 * sieht nur, DASS sich etwas geändert hat — der Stempel sagt, WELCHER Teil
 * gerade angekommen ist, ohne dass die Zeile neu gelesen werden muss. Der
 * erste Stand quittiert nie; er ist der Stand, nicht die Änderung.
 */
export function TeilQuittung({ teile }: { teile: SegmentTeil[] }) {
  const liste = useRef<HTMLOListElement>(null);
  const gesehen = useRef<Set<number> | null>(null);
  const haben = new Set(teile.map((t) => t.teilNr));
  const schluessel = [...haben].sort((a, b) => a - b).join(",");
  useEffect(() => {
    const jetzt = new Set(schluessel ? schluessel.split(",").map(Number) : []);
    const vorher = gesehen.current;
    gesehen.current = jetzt;
    if (vorher === null || !liste.current) return;
    for (const n of jetzt) {
      if (vorher.has(n)) continue;
      const kaestchen = liste.current.querySelector<HTMLLIElement>(`[data-teil="${n}"]`);
      if (!kaestchen) continue;
      // Über das DOM statt über einen key: derselbe Teil kann in einer neuen
      // Sammlung erneut eingehen, und der Reflow setzt den Stempel dann neu an.
      kaestchen.classList.remove("frisch");
      void kaestchen.offsetWidth;
      kaestchen.classList.add("frisch");
    }
  }, [schluessel]);

  const anzahl = teile[0]?.anzahl ?? 0;
  if (anzahl < 2) return null;
  return (
    <ol className="teil-quittung" aria-hidden="true" ref={liste}>
      {Array.from({ length: anzahl }, (_, i) => i + 1).map((n) => (
        <li key={n} data-teil={n} className={haben.has(n) ? "ein" : "offen"}>
          {n}
        </li>
      ))}
    </ol>
  );
}
