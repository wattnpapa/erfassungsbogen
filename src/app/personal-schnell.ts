/**
 * Parser für die Mehrzeilen-Namenseingabe der Personal-Schnelleingabe:
 * Wer eine fertige Liste hat (Alarm-Nachricht, Tabelle, Notizzettel), fügt
 * sie als Text ein — eine Person je Zeile — statt jede Person einzeln
 * anzulegen. Reine Funktion, damit sie unit-testbar bleibt.
 */

/** Ein erkannter Name; weitere Personendaten werden anschließend erfasst. */
export interface NamensEintrag {
  vorname: string;
  nachname: string;
}

/**
 * Text → Namensliste. Je Zeile eine Person, zwei gängige Schreibweisen:
 *  - „Nachname, Vorname"  (Komma trennt; weitere Kommas gehören zum Vornamen)
 *  - „Vorname [weitere Vornamen] Nachname"  (letztes Wort ist der Nachname)
 * Ein einzelnes Wort wird als Nachname übernommen. Leerzeilen entfallen.
 */
export function parseNamen(text: string): NamensEintrag[] {
  return text
    .split(/\r?\n/)
    .map((zeile) => zeile.trim())
    .filter(Boolean)
    .map((zeile) => {
      const komma = zeile.indexOf(",");
      if (komma >= 0) {
        return {
          nachname: zeile.slice(0, komma).trim(),
          vorname: zeile.slice(komma + 1).trim(),
        };
      }
      const teile = zeile.split(/\s+/);
      if (teile.length === 1) return { vorname: "", nachname: teile[0]! };
      return {
        vorname: teile.slice(0, -1).join(" "),
        nachname: teile[teile.length - 1]!,
      };
    });
}
