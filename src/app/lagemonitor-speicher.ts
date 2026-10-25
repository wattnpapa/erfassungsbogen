/**
 * Angaben je Einsatz für den Lagemonitor (Einsatzbeginn, Funkrufname).
 *
 * Sie stehen in keinem Erfassungsbogen und nicht in der Sammlung, sondern
 * werden von Hand gesetzt. Je Angabe ein Eintrag im `localStorage`: ein Wert
 * je Einsatz-Kennung. Beim Schreiben fallen Einträge zu Einsätzen weg, die es
 * nicht mehr gibt.
 */

function speicher(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export interface EinsatzWerte<T> {
  laden: (einsatzId: string) => T | null;
  /** Wert setzen oder mit `null` entfernen; `false`, wenn der Speicher voll oder gesperrt ist. */
  setzen: (einsatzId: string, wert: T | null, bekannteIds: readonly string[]) => boolean;
}

export function einsatzWerte<T>(schluessel: string, istWert: (x: unknown) => x is T): EinsatzWerte<T> {
  function lesen(): Record<string, T> {
    try {
      const roh = speicher()?.getItem(schluessel);
      if (!roh) return {};
      const x = JSON.parse(roh) as unknown;
      if (!x || typeof x !== "object" || Array.isArray(x)) return {};
      const aus: Record<string, T> = {};
      for (const [id, wert] of Object.entries(x)) if (istWert(wert)) aus[id] = wert;
      return aus;
    } catch {
      return {};
    }
  }

  return {
    laden: (einsatzId) => lesen()[einsatzId] ?? null,
    setzen: (einsatzId, wert, bekannteIds) => {
      const neu: Record<string, T> = {};
      for (const [id, v] of Object.entries(lesen())) {
        if (id !== einsatzId && bekannteIds.includes(id)) neu[id] = v;
      }
      if (wert != null) neu[einsatzId] = wert;
      try {
        const s = speicher();
        if (!s) return false;
        if (Object.keys(neu).length === 0) s.removeItem(schluessel);
        else s.setItem(schluessel, JSON.stringify(neu));
        return true;
      } catch {
        return false;
      }
    },
  };
}
