/**
 * „Gehört zu dieser Lage" — die Entscheidung des Meldekopfs zur Marke „⚠ Anderer Einsatz?" (R17-E4).
 *
 * Die Marke gilt für jede Einheit, deren Auftragstext kein Ortswort der Lage teilt, und ließ sich nicht wegbekommen: Wer sie
 * dreimal gesehen und geprüft hatte, las sie beim vierten Mal nicht mehr, und der eine echte Fehlgriff ging darin unter.
 * Der Meldekopf bestätigt jetzt je Einheit, dass der Bogen zur Lage gehört; die Marke fällt auf Karte, Lageblatt, Sammel-PDF
 * und in den Tabellen weg. Die Entscheidung gilt für den Ortstext, den der Meldekopf gesehen hat: Nennt eine spätere
 * Folgemeldung einen anderen, erscheint die Marke wieder. Wie `ersetztDurch` ein optionales Feld am Eintrag.
 */
import {
  einsaetzeLaden as kernEinsaetzeLaden,
  einsaetzePapierkorb as kernEinsaetzePapierkorb,
  type MeldeEintrag,
} from "@bos/meldekopf/einsaetze";
import { sammlungenSchreiben } from "./eintrag-zeiten";

declare module "@bos/meldekopf/einsaetze" {
  interface MeldeEintrag {
    /** Ort/Auftrag, den der Meldekopf als zur Lage gehörig bestätigt hat (getrimmter Text des Bogens). */
    ortGebilligt?: string;
    /** Wann bestätigt wurde (ms). */
    ortGebilligtAm?: number;
  }
}

/** Der Text, auf den sich eine Bestätigung bezieht. */
function ortText(e: Pick<MeldeEintrag, "bogen">): string {
  return (e.bogen.einsatz.ortAuftrag ?? "").trim();
}

/** Hat der Meldekopf diesen Ortstext der Einheit schon als passend bestätigt (an einer ihrer Fassungen)? */
export function ortIstGebilligt(e: Pick<MeldeEintrag, "bogen" | "einheitSchluessel">, alle: readonly MeldeEintrag[]): boolean {
  const text = ortText(e);
  if (text === "") return false;
  return alle.some((x) => x.einheitSchluessel === e.einheitSchluessel && x.ortGebilligt === text);
}

/** Bestätigung setzen (`gilt` = true) oder zurücknehmen. Rückgabe: ob der Eintrag gefunden wurde. */
export function ortBilligen(einsatzId: string, eintragId: string, gilt = true, jetzt = Date.now()): boolean {
  const liste = [...kernEinsaetzeLaden(), ...kernEinsaetzePapierkorb()];
  const s = liste.find((x) => x.id === einsatzId);
  const e = s?.eintraege.find((x) => x.id === eintragId);
  if (!s || !e) return false;
  if (gilt) {
    e.ortGebilligt = ortText(e);
    e.ortGebilligtAm = jetzt;
  } else {
    // Zurücknehmen: an allen Fassungen der Einheit, sonst gälte eine ältere Bestätigung weiter.
    for (const x of s.eintraege) {
      if (x.einheitSchluessel !== e.einheitSchluessel) continue;
      delete x.ortGebilligt;
      delete x.ortGebilligtAm;
    }
  }
  s.geaendert = Date.now();
  sammlungenSchreiben(liste);
  return true;
}
