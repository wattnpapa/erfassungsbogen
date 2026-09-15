import { StaerkeRolle } from "@bos/eeb-format/model";

/**
 * Kürzel und Langform der Stärkerolle für Personallisten.
 *
 * Die Stärke steht im Bogen nur als Zahlenreihe (1 / 2 / 6 / 9); welche der
 * aufgeführten Personen die beiden Unterführerplätze besetzt, ging aus der
 * Liste bisher nicht hervor. Aus den Funktionen allein ist es nicht immer
 * abzulesen: eine Person kann die Ausbildung zum Gruppenführer tragen und vor
 * Ort trotzdem als Truppführer oder in der Mannschaft eingeteilt sein.
 */
export const ROLLE_KURZ: Record<StaerkeRolle, string> = {
  [StaerkeRolle.FUEHRER]: "Fü",
  [StaerkeRolle.UNTERFUEHRER]: "UFü",
  [StaerkeRolle.MANNSCHAFT]: "Ma",
};

export const ROLLE_LANG: Record<StaerkeRolle, string> = {
  [StaerkeRolle.FUEHRER]: "Führer/in",
  [StaerkeRolle.UNTERFUEHRER]: "Unterführer/in",
  [StaerkeRolle.MANNSCHAFT]: "Mannschaft",
};

/**
 * Stärkerolle als farbige Marke in einer Personalzeile — dieselben drei Farben
 * wie die Rollen-Plaketten der Vorlagenauswahl, damit „Fü" hier und dort
 * dasselbe Grün/Violett trägt.
 *
 * Das Kürzel steht sichtbar, die Langform im `title` und als `aria-label`:
 * „UFü" vorgelesen ist kein Wort, „Unterführer/in" schon.
 */
export function RolleMarke({ rolle }: { rolle: StaerkeRolle }) {
  const klasse = rolle === StaerkeRolle.FUEHRER ? "f" : rolle === StaerkeRolle.UNTERFUEHRER ? "u" : "m";
  return (
    <span className={`rolle-marke rolle-${klasse}`} title={ROLLE_LANG[rolle]} aria-label={ROLLE_LANG[rolle]}>
      {ROLLE_KURZ[rolle]}
    </span>
  );
}
