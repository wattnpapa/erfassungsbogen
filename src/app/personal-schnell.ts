/**
 * Parser für die Mehrzeilen-Namenseingabe der Personal-Schnelleingabe:
 * Wer eine fertige Liste hat (Alarm-Nachricht, Tabelle, Notizzettel), fügt
 * sie als Text ein — eine Person je Zeile — statt jede Person einzeln
 * anzulegen. Reine Funktion, damit sie unit-testbar bleibt.
 */

import { StaerkeRolle } from "@bos/eeb-format/model";

/** Ein erkannter Name; weitere Personendaten werden anschließend erfasst. */
export interface NamensEintrag {
  vorname: string;
  nachname: string;
  /** Erkanntes Funktionskürzel der Zeile („ZFhr", „GrFü") — roh, ungedeutet. */
  funktion?: string;
  /** Aus der Funktion abgeleitete Stärke-Rolle; fehlt = Mannschaft (Vorgabe). */
  rolle?: StaerkeRolle;
}

/**
 * Funktionskürzel → Stärke-Rolle.
 *
 * Eingefügte Listen tragen die Funktion fast immer mit („Meyer, Jens, ZFhr").
 * Ohne diese Zuordnung landete das Kürzel im Vornamen und jede Person zählte
 * als Mannschaft: Aus einem Zugführer und drei Helfern wurde 0/0/4/4 — die
 * falsche Zahl reist über den Ausdruck bis in die Summe der Führungsstelle.
 *
 * Die Liste bleibt bewusst kurz und wörtlich: Erkannt wird, was in BOS-Listen
 * üblich ist; alles andere bleibt Mannschaft und steht als Funktionstext an der
 * Person, statt geraten zu werden. Verglichen wird kleingeschrieben und ohne
 * Punkte, Schrägstriche und Bindestriche.
 */
const ROLLE_KUERZEL: ReadonlyArray<readonly [RegExp, StaerkeRolle]> = [
  [/^(zfhr|zfu|zfue|zugfuhrer|zugfuehrer|zgfhr|efhr|einsatzleiter|el|ofuehrer|ortsbeauftragter|ob)$/, StaerkeRolle.FUEHRER],
  [/^(grfhr|grfu|grfue|gruppenfuhrer|gruppenfuehrer|trfhr|trfu|truppfuhrer|truppfuehrer|zugtrfhr|ztrfhr)$/, StaerkeRolle.UNTERFUEHRER],
];

/** Vergleichsform: klein, ohne Umlaute, ohne Trenn- und Satzzeichen. */
function kuerzelSchluessel(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ß/g, "ss")
    .replace(/[^a-z]/g, "");
}

/** Stärke-Rolle zu einem Funktionskürzel — `undefined`, wenn nichts passt. */
export function rolleAusFunktion(funktion: string): StaerkeRolle | undefined {
  const schluessel = kuerzelSchluessel(funktion);
  if (!schluessel) return undefined;
  return ROLLE_KUERZEL.find(([muster]) => muster.test(schluessel))?.[1];
}

/**
 * Text → Namensliste. Je Zeile eine Person, zwei gängige Schreibweisen:
 *  - „Nachname, Vorname"  (Komma trennt)
 *  - „Vorname [weitere Vornamen] Nachname"  (letztes Wort ist der Nachname)
 * Ein einzelnes Wort wird als Nachname übernommen. Leerzeilen entfallen.
 *
 * Ein drittes, kommagetrenntes Feld gilt als Funktion („Meyer, Jens, ZFhr")
 * und wird nicht mehr in den Vornamen gezogen; ist das Kürzel bekannt, bringt
 * es die Stärke-Rolle mit (siehe {@link rolleAusFunktion}).
 */
export function parseNamen(text: string): NamensEintrag[] {
  return text
    .split(/\r?\n/)
    .map((zeile) => zeile.trim())
    .filter(Boolean)
    .map((zeile) => {
      const komma = zeile.indexOf(",");
      if (komma >= 0) {
        const rest = zeile.slice(komma + 1);
        const zweites = rest.indexOf(",");
        const vorname = (zweites >= 0 ? rest.slice(0, zweites) : rest).trim();
        const funktion = zweites >= 0 ? rest.slice(zweites + 1).trim() : "";
        return {
          nachname: zeile.slice(0, komma).trim(),
          vorname,
          ...(funktion ? { funktion, rolle: rolleAusFunktion(funktion) } : {}),
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
