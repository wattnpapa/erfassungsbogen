/**
 * Hinweis auf einen fast vollen Gerätespeicher — dort, wo gearbeitet wird.
 *
 * Die Warnung ab 70 % stand nur im Dialog „Datensicherung". Startseite und
 * Einsatzansicht blieben bei vollem Speicher stumm, bis ein Scan nicht mehr
 * abgelegt werden konnte (Audit Runde 2, R2-O7). Die Zeile nennt, wo der
 * Platz steckt, und dass nur Löschen Platz schafft.
 */
import { useMemo } from "react";
import { speicherBelegung, speicherGroessteSammlungen, speicherText } from "./eintrag-zeiten";

/** Ab diesem Anteil warnt die App (Fußzeile: ab 70 % gelb, hier ab 80 % sichtbar). */
export const SPEICHER_WARNSCHWELLE = 0.8;

/** Wo der Platz steckt: „„Hochwasser" (41 %), „Übung Mai" im Papierkorb (12 %)". */
export function groessteText(): string {
  const liste = speicherGroessteSammlungen(3).filter((x) => x.anteil >= 0.01);
  if (liste.length === 0) return "";
  return liste
    .map((x) => `„${x.name}"${x.papierkorb ? " im Papierkorb" : ""} (${Math.round(x.anteil * 100)} %)`)
    .join(", ");
}

/**
 * `stand` ist ein beliebiger Wert, der sich ändert, wenn geschrieben wurde
 * (etwa die geladenen Sammlungen) — die Belegung wird nur dann neu gezählt.
 */
export function SpeicherWarnung({ stand }: { stand: unknown }) {
  const b = useMemo(() => speicherBelegung(), [stand]);
  if (!b || b.anteil < SPEICHER_WARNSCHWELLE) return null;
  const groesste = groessteText();
  return (
    <p className="warnung" role="status">
      ⚠ Gerätespeicher zu {speicherText(b)} belegt. Wird er voll, kann die App nichts mehr speichern.
      {groesste ? ` Am meisten belegen: ${groesste}.` : ""} Platz schafft nur Löschen: nicht mehr
      benötigte Einsätze sichern, in den Papierkorb legen und den Papierkorb leeren.
    </p>
  );
}
