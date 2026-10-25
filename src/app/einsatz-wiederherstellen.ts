/**
 * „Wiederherstellen" aus dem Papierkorb mit neuer Aufräumfrist (Audit Runde 5,
 * R5-D2).
 *
 * Der Kern (`einsatzWiederherstellen` in `@bos/meldekopf/einsaetze`, Submodul,
 * hier nicht änderbar) nimmt nur `geloeschtAm` weg und lässt `geaendert`
 * stehen. Lag die Sammlung vor dem Löschen länger als 90 Tage ruhig (oder wird
 * sie im Papierkorb älter als die Aufräumfrist), löscht ihn der nächste Lesezugriff
 * endgültig: Der Papierkorb sagte „30 Tage rückholbar", und „Wiederherstellen"
 * räumte die Sammlung im selben Augenblick weg — ohne Meldung.
 *
 * Wer eine Sammlung zurückholt, arbeitet damit: Das Zurückholen zählt als
 * Änderung, die Aufräumfrist beginnt neu. Das tut diese Schicht über dem Kern;
 * Rückholweg und Quittung der Oberfläche bleiben, wie sie sind.
 */
import { AUFRAEUM_HINWEIS_MS, einsaetzeLaden, einsaetzePapierkorb, type Einsatzsammlung } from "@bos/meldekopf/einsaetze";
import { sammlungenSchreiben } from "./eintrag-zeiten";

/** Würde diese Sammlung nach dem Zurückholen bald (oder sofort) unter die Aufräumfrist fallen? */
export function ruhtSchonLange(s: Pick<Einsatzsammlung, "geaendert">, jetzt = Date.now()): boolean {
  return jetzt - s.geaendert >= AUFRAEUM_HINWEIS_MS;
}

/**
 * Holt die Sammlung aus dem Papierkorb und setzt ihre Ruhefrist neu
 * (`geaendert` = jetzt). `false`, wenn es sie nicht (mehr) im Papierkorb gibt.
 */
export function einsatzWiederherstellen(id: string, jetzt = Date.now()): boolean {
  const liste = [...einsaetzeLaden(), ...einsaetzePapierkorb()];
  const s = liste.find((x) => x.id === id);
  if (!s) return false;
  delete s.geloeschtAm;
  s.geaendert = jetzt;
  sammlungenSchreiben(liste);
  return true;
}
