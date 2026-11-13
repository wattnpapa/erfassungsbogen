/**
 * Beispielbögen beim Weitergeben auf den Stand eines neuen Bogens stellen
 * (Prüfrunde Beispielbögen, BB-W5, BB-K6, BB-H6, BB-N4, BB-E9, BB-A8;
 * Rückmeldung 11/2026).
 *
 * Die Beispiele tragen in ihren Dateien einen erfundenen Einsatz (Zeitraum,
 * Ort und Auftrag) und den Stand, an dem sie erzeugt wurden. Geöffnet, als PDF
 * oder in einer Übungs-Sammlung meldete die App deshalb „Stand vor 50 Tagen"
 * und „Zeitraum vorbei", und wer ein Beispiel als Ausgangspunkt nahm, musste
 * zuerst einen fremden Auftrag löschen. Beim Weitergeben aus dem Dialog stehen
 * die Einsatzangaben deshalb leer da (Zeitraum nicht angegeben, Ort und
 * Auftrag leer), und der Stand ist die Minute, in der Bogen, PDF oder Link
 * erzeugt wurden.
 *
 * Bewusst ohne Vokabular- oder Kern-Importe außer dem Format (Startbündel).
 */

import type { EebZeitpunkt, Erfassungsbogen } from "@bos/eeb-format/model";
import { einsatzLeer } from "./zeitraum-eingabe";

export function beispielAufHeute(b: Erfassungsbogen, stand: EebZeitpunkt): Erfassungsbogen {
  return { ...b, einsatz: einsatzLeer(), stand };
}
