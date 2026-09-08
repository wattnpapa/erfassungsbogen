/**
 * Die Quittung: das Aufblitzen einer Zahl, die sich gerade geändert hat.
 *
 * Die Stärke ist die eine Zahl, wegen der der Bogen gelesen wird — und sie
 * ändert sich an zwei Stellen, ohne dass jemand hinsieht: in der Stärke-Leiste
 * der Einsatz-Sammlung, wenn eine neue Meldung eintrifft, und im Personal-
 * Schritt, wenn eine Zeile weiter oben ergänzt wird und die abgeleitete Summe
 * nachzieht. Beide Male ist die Quittung die einzige Auskunft darüber, WELCHE
 * Summe sich bewegt hat; ohne sie fällt sie ersatzlos weg (siehe die
 * Bewegungs-Regel in DESIGN.md).
 *
 * Bewusst über das DOM statt über einen `key`: beim ersten Malen der Ansicht
 * bleibt alles still, und bei schnellen Folgeänderungen (Kiosk-Scan, gedrückt
 * gehaltene Pfeiltaste im Zahlenfeld) setzt die Animation dank Reflow auch dann
 * neu an, wenn die Klasse schon gesetzt war.
 */

import { useEffect, useRef } from "react";

/**
 * Ref für das Element, das die Änderung von `wert` quittieren soll. Der erste
 * Wert quittiert nie — er ist der Stand, nicht die Änderung.
 *
 * `wert` darf eine Zahl oder ein Schlüssel über mehrere Zahlen sein
 * („0/2/6/8"): eine Stärkeangabe ist EINE Auskunft, sie quittiert als Ganzes.
 */
export function useZahlQuittung<T extends HTMLElement>(wert: number | string) {
  const element = useRef<T>(null);
  const vorher = useRef(wert);
  useEffect(() => {
    if (vorher.current === wert || !element.current) return;
    vorher.current = wert;
    element.current.classList.remove("zahl-geaendert");
    void element.current.offsetWidth;
    element.current.classList.add("zahl-geaendert");
  }, [wert]);
  return element;
}
