/**
 * Vergleich zweier Fassungen für Karte, Lageblatt und Sammel-PDF (R17-A1).
 *
 * Der geteilte Kern nennt die Aufteilung nach Geschlecht immer „Unterbringung M/W/D“. Sie ist aber nur dann eine
 * Unterbringung, wenn die Einheit welche angefordert hat; sonst ist es die abgeleitete Zahl für WC/Dusche (so heißt sie
 * auch im Block „Bedarf gesamt“). Ohne Anforderung behauptete das Lageblatt nach „Stärke ändern…“ eine Änderung der
 * Schlafplätze, die nie angefordert war.
 */
import type { Erfassungsbogen } from "@bos/eeb-format/model";
import { bogenDiff as kernDiff, type BogenDiff } from "@bos/meldekopf/meldung-diff";

export type { BogenDiff };

/** Feldname im Kern. */
export const FELD_UNTERBRINGUNG_MWD = "Unterbringung M/W/D";
/** Feldname, wenn keine Unterbringung angefordert ist. */
export const FELD_WC_DUSCHE_MWD = "WC/Dusche M/W/D";

/** Ist es die M/W/D-Zeile — unter welchem der beiden Namen auch immer? */
export function istMwdFeld(feld: string): boolean {
  return feld === FELD_UNTERBRINGUNG_MWD || feld === FELD_WC_DUSCHE_MWD;
}

/** Wie `bogenDiff` des Kerns; die M/W/D-Zeile heißt „WC/Dusche“, wenn weder die alte noch die neue Fassung Unterbringung anfordert. */
export function bogenDiff(vorher: Erfassungsbogen, nachher: Erfassungsbogen): BogenDiff {
  const d = kernDiff(vorher, nachher);
  if (vorher.sofortbedarf?.unterbringung || nachher.sofortbedarf?.unterbringung) return d;
  if (!d.bedarf.some((a) => a.feld === FELD_UNTERBRINGUNG_MWD)) return d;
  return { ...d, bedarf: d.bedarf.map((a) => (a.feld === FELD_UNTERBRINGUNG_MWD ? { ...a, feld: FELD_WC_DUSCHE_MWD } : a)) };
}
