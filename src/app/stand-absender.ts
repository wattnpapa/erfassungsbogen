/**
 * Stand des Absenders bei einer Fassung, die der Meldekopf von Hand umgestellt hat (R17-D5).
 *
 * „Als Übung kennzeichnen…" legt eine neue Fassung an. Ihr Stand im Bogen wird neu gestempelt (sonst hätte sie dieselbe
 * Kennung wie die Fassung davor, sobald man die Kennzeichnung zurückstellt), die Karte zeigte aber „Stand 18:03", obwohl
 * der Absender nichts Neues gemeldet hat. Diese Fassung trägt darum den Stand der Vorgängerin mit; die Karte zeigt ihn.
 * Wie `ersetztDurch` und `angaben` ein optionales Feld am Eintrag, kein Schemawechsel.
 */
import {
  einsaetzeLaden as kernEinsaetzeLaden,
  einsaetzePapierkorb as kernEinsaetzePapierkorb,
  type MeldeEintrag,
} from "@bos/meldekopf/einsaetze";
import type { EebZeitpunkt } from "@bos/eeb-format/model";
import { sammlungenSchreiben } from "./eintrag-zeiten";

declare module "@bos/meldekopf/einsaetze" {
  interface MeldeEintrag {
    /** Stand, den der Absender gemeldet hat; nur gesetzt, wenn der Meldekopf die Fassung von Hand umgestellt hat. */
    standAbsender?: EebZeitpunkt;
  }
}

/** Der Stand, den die Karte zeigt: der des Absenders, sonst der im Bogen. */
export function standDesAbsenders(e: Pick<MeldeEintrag, "bogen" | "standAbsender">): EebZeitpunkt {
  return e.standAbsender ?? e.bogen.stand;
}

/** Die neue Fassung `eintragId` übernimmt den Anzeige-Stand der Vorgängerin. Rückgabe: ob der Eintrag gefunden wurde. */
export function standAbsenderVermerken(einsatzId: string, eintragId: string, vorgaengerin: Pick<MeldeEintrag, "bogen" | "standAbsender">): boolean {
  const liste = [...kernEinsaetzeLaden(), ...kernEinsaetzePapierkorb()];
  const e = liste.find((x) => x.id === einsatzId)?.eintraege.find((x) => x.id === eintragId);
  if (!e) return false;
  e.standAbsender = standDesAbsenders(vorgaengerin);
  sammlungenSchreiben(liste);
  return true;
}
