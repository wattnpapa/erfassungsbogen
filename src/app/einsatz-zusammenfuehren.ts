/**
 * Zusammenführen zweier Sammlungen gleichen Namens beim Einlesen (R5-W2, R20-D3): der Satz zu den Nummern, die sich dabei ändern, und das
 * Zurücknehmen. Eigene Datei, die erst beim Einlesen einer gleichnamigen Sammlung nachgeladen wird — das Startbündel trägt sie nicht
 * (ADR-003, Aufnahmeregel 5).
 */
import type { Einsatzsammlung } from "@bos/meldekopf/einsaetze";
import { anzahlEinheiten, nummernWechsel } from "./einheiten-tabelle";
import { SpeicherVollFehler, istSpeicherVoll, sammlungZuruecksetzen } from "./eintrag-zeiten";
import { fehlerText } from "./nachladen";
import { nummernHinweisLoeschen } from "./nummern-hinweis";

/** Welche vorhandenen Nummern sich ändern würden, wenn die Datei in die vorhandene Sammlung käme — als Satz für die Rückfrage. */
export function wechselSatz(vorhanden: Einsatzsammlung, datei: Einsatzsammlung): string {
  const bekannt = new Set(vorhanden.eintraege.map((e) => e.id));
  const wechsel = nummernWechsel(vorhanden.eintraege, [...vorhanden.eintraege, ...datei.eintraege.filter((e) => !bekannt.has(e.id))]);
  if (wechsel.length === 0) return " Keine vorhandene Nummer ändert sich.";
  const liste = wechsel.slice(0, 3).map((w) => `${w.einheit} ${w.von} → ${w.nach}`).join(", ");
  return ` Dabei ändern sich ${wechsel.length === 1 ? "1 Nummer" : `${wechsel.length} Nummern`}: ${liste}${wechsel.length > 3 ? " …" : ""}.`;
}

/**
 * Die Sammlung auf den Stand vor dem Einlesen zurücksetzen; der Hinweis auf geänderte Nummern entfällt. Liefert den Satz für die
 * Quittung und ob es gelang (ein voller Speicher lässt den zusammengeführten Stand stehen).
 */
export function zusammenfuehrenZurueck(vorher: Einsatzsammlung): { ok: boolean; text: string } {
  try {
    sammlungZuruecksetzen(vorher);
  } catch (e) {
    return { ok: false, text: `Nicht zurückgenommen: ${istSpeicherVoll(e) ? new SpeicherVollFehler(e).message : fehlerText(e)}` };
  }
  nummernHinweisLoeschen(vorher.id);
  return {
    ok: true,
    text: `Zusammenführen zurückgenommen: „${vorher.name}" steht wieder wie vor dem Einlesen (${anzahlEinheiten(vorher.eintraege)}); die Nummern gelten wie vorher.`,
  };
}
