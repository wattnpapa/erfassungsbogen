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

import { neuesteJeEinheit, revisionen, type MeldeEintrag } from "@bos/meldekopf/einsaetze";

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

/** Wie `revisionen(alle, einheitSchl)` aus dem Kern: alle Fassungen, neueste zuerst. */
export function revisionenJe(alle: readonly MeldeEintrag[], einheitSchl: string): MeldeEintrag[] {
  const gruppe = index(alle).nachEinheit.get(einheitSchl);
  return gruppe ? revisionen(gruppe, einheitSchl) : [];
}

/** Wie `neuesteJeEinheit(alle)` aus dem Kern; das Array ist jedes Mal neu. */
export function koepfeJe(alle: readonly MeldeEintrag[]): MeldeEintrag[] {
  const i = index(alle);
  i.koepfe ??= neuesteJeEinheit(alle as MeldeEintrag[]);
  return [...i.koepfe];
}
