/**
 * Lesezugriffe auf die Einsatz-Sammlungen für die Oberfläche.
 *
 * Zwei Dinge regelt diese Datei (Audit Runde 3, R3-O2):
 *
 * 1. **Lesen scheitert nicht am Speicher.** Der Kern schreibt beim Lesen die
 *    Frist-Bereinigung zurück. Scheiterte das (Speicher voll oder gesperrt),
 *    warf schon das bloße Anzeigen — „Fortsetzen" und „Öffnen" ließen einen
 *    leeren Bildschirm zurück, die Startseite stand ohne Knöpfe da. Über diese
 *    Funktionen wird ein scheiterndes Zurückschreiben gemerkt und gemeldet
 *    (speicher-schonend.ts, `leseSchreibFehler`), die Liste erscheint trotzdem.
 * 2. **Gleiches nicht neu einlesen.** Der Kern parst bei jedem Aufruf den
 *    ganzen gespeicherten Text, hebt jeden Bogen aufs aktuelle Schema und
 *    prüft die Fristen. Die Oberfläche liest an vielen Stellen; bei einer
 *    Sammlung mit 5 Mio. Zeichen kamen beim Start 16 und bis zum Abrücken
 *    weitere 24 Durchläufe zusammen (gedrosselt je rund 0,4 s). Steht im
 *    Speicher noch genau derselbe Text und ist dieselbe Minute, gibt diese
 *    Datei das letzte Ergebnis zurück. Die Fristen rechnen in Tagen; eine
 *    Minute Versatz ändert an ihnen nichts. Ein anderes Fenster, das
 *    schreibt, ändert den Text und damit das Ergebnis.
 *
 * Das zurückgegebene Array ist jedes Mal neu (React sieht eine Änderung wie
 * bisher), die Sammlungen darin werden aber geteilt und dürfen nicht
 * verändert werden. Wer ändert und zurückschreibt, liest frisch aus dem Kern
 * (eintrag-zeiten.ts, einsatz-abgleich.ts). In Entwicklung und Tests sind die
 * geteilten Objekte eingefroren, damit ein Verstoß sofort auffällt.
 *
 * Änderungen (Abrücken, Ablegen, …) gehen weiter direkt an den Kern und
 * melden einen vollen Speicher dort, wo gehandelt wurde.
 */

import {
  einsaetzeLaden as kernEinsaetzeLaden,
  einsaetzePapierkorb as kernEinsaetzePapierkorb,
  type Einsatzsammlung,
} from "@bos/meldekopf/einsaetze";
import { bekannterText, huellenZugriffe, nurLesend, rohText } from "./speicher-schonend";

/** Speicherschlüssel der Sammlungen im Kern (einsaetze.ts, nicht exportiert). */
const SAMMLUNGEN_SCHLUESSEL = "eeb.einsaetze.v1";

interface Gemerkt {
  text: string | null;
  minute: number;
  liste: readonly Einsatzsammlung[];
}

const gemerkt = new Map<"aktiv" | "papierkorb", Gemerkt>();

const EINFRIEREN = import.meta.env?.DEV === true;

function einfrieren<T>(wert: T): T {
  if (wert && typeof wert === "object" && !Object.isFrozen(wert)) {
    Object.freeze(wert);
    for (const v of Object.values(wert)) einfrieren(v);
  }
  return wert;
}

function gelesen(art: "aktiv" | "papierkorb", kern: () => Einsatzsammlung[]): Einsatzsammlung[] {
  const minute = Math.floor(Date.now() / 60_000);
  const roh = rohText(SAMMLUNGEN_SCHLUESSEL);
  const alt = gemerkt.get(art);
  if (roh !== undefined && alt && alt.minute === minute && alt.text === roh) return [...alt.liste];

  const vorher = huellenZugriffe();
  const liste = nurLesend(kern);
  // Nur merken, wenn der Kern wirklich über die schonende Hülle gelesen hat
  // (Tests hängen mitunter eine eigene Ablage ein) und bekannt ist, was nun
  // im Speicher steht (nach einem gescheiterten Zurückschreiben nicht).
  const nachher = bekannterText(SAMMLUNGEN_SCHLUESSEL);
  if (roh === undefined || vorher < 0 || huellenZugriffe() === vorher || nachher === undefined) {
    gemerkt.delete(art);
    return liste;
  }
  gemerkt.set(art, { text: nachher, minute, liste: EINFRIEREN ? einfrieren(liste) : liste });
  return [...liste];
}

/** Aktive Einsätze (ohne Papierkorb). Die Sammlungen darin nicht verändern. */
export function einsaetzeLaden(): Einsatzsammlung[] {
  return gelesen("aktiv", kernEinsaetzeLaden);
}

/** Einsätze im Papierkorb, zuletzt gelöschte zuerst. Die Sammlungen darin nicht verändern. */
export function einsaetzePapierkorb(): Einsatzsammlung[] {
  return gelesen("papierkorb", kernEinsaetzePapierkorb);
}

/** Nur für Tests: gemerkte Ergebnisse vergessen. */
export function einsaetzeLesenZuruecksetzen(): void {
  gemerkt.clear();
}
