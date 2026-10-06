/**
 * Revisionen und Köpfe je Einheit, einmal je Meldungsliste berechnet.
 *
 * Jede Karte der Einsatzansicht fragte den Kern nach den Revisionen ihrer
 * Einheit (`revisionen(alle, …)`) und nach allen Köpfen (`neuesteJeEinheit`)
 * — jeweils ein Durchlauf über ALLE Meldungen. Bei 1 700 Einheiten waren das
 * Millionen Vergleiche je Darstellung; Öffnen und Abrücken einer großen
 * Sammlung dauerten gedrosselt viele Sekunden (Audit Runde 3, R3-O2).
 *
 * Hier wird die Liste einmal nach Einheit gruppiert (gemerkt je Array, das
 * Array ist nach einer Änderung ein neues). Gerechnet wird weiter mit den
 * Kern-Funktionen, nur auf der kleinen Gruppe — das Ergebnis ist dasselbe.
 */

import { type MeldeEintrag } from "@bos/meldekopf/einsaetze";
import { geltendeJeEinheit, fassungenJeEinheit } from "./fassung-vorrang";

interface Index {
  nachEinheit: Map<string, MeldeEintrag[]>;
  koepfe?: MeldeEintrag[];
}

const indizes = new WeakMap<readonly MeldeEintrag[], Index>();

function index(alle: readonly MeldeEintrag[]): Index {
  let i = indizes.get(alle);
  if (!i) {
    const nachEinheit = new Map<string, MeldeEintrag[]>();
    for (const e of alle) {
      const gruppe = nachEinheit.get(e.einheitSchluessel);
      if (gruppe) gruppe.push(e);
      else nachEinheit.set(e.einheitSchluessel, [e]);
    }
    i = { nachEinheit };
    indizes.set(alle, i);
  }
  return i;
}

/** Wie `fassungenJeEinheit(alle, einheitSchl)` (fassung-vorrang.ts): alle Fassungen, die geltende zuerst. */
export function revisionenJe(alle: readonly MeldeEintrag[], einheitSchl: string): MeldeEintrag[] {
  const gruppe = index(alle).nachEinheit.get(einheitSchl);
  return gruppe ? fassungenJeEinheit(gruppe, einheitSchl) : [];
}

/** Wie `geltendeJeEinheit(alle)` (fassung-vorrang.ts, R4-W1); das Array ist jedes Mal neu. */
export function koepfeJe(alle: readonly MeldeEintrag[]): MeldeEintrag[] {
  const i = index(alle);
  i.koepfe ??= geltendeJeEinheit(alle as MeldeEintrag[]);
  return [...i.koepfe];
}
