/**
 * Bewegung an den Listen: Zugang, Abgang und die Quittung des Eingangs.
 *
 * Drei Sorten Liste teilen sich das hier — die Eintragslisten des Assistenten
 * (Personen, Fahrzeuge), die Kartenstapel von Einsätzen und Vorlagen
 * (`kartenstapel.tsx`) und die Meldungen einer Einsatz-Sammlung.
 *
 * Beide Listen sind Stapel gleich aussehender Karten. Kommt eine dazu oder
 * geht eine weg, ändert sich der Stapel schlagartig — und wer gerade die
 * siebte von neun Personenkarten gelöscht hat, sieht danach neun minus eine
 * gleich aussehende Karten und weiß nicht, ob die richtige ging. Der Abgang
 * zeigt die Karte, die geht, bevor sie geht; der Zugang stempelt die neue ein.
 *
 * Nichts davon trägt eine Auskunft, die es nur hier gäbe: der Karteninhalt
 * steht danach unverändert da. Unter reduzierter Bewegung entfällt beides
 * deshalb ersatzlos — und der Abgang nimmt dann den direkten Weg, statt auf
 * eine Animation zu warten, die nicht läuft.
 */

import { useEffect, useRef, type RefObject } from "react";

/**
 * Setzt den Einzugsstempel — genau einmal, beim Einhängen der Karte.
 *
 * Bewusst am Einhängen und nicht an der Klasse im Markup: die Listen sind über
 * den Index verschlüsselt, und beim Löschen einer Karte rückt der Inhalt in
 * bestehenden Knoten nach. Eine Klasse, die dabei an einen längst stehenden
 * Knoten geriete, stempelte eine Karte ein, die gar nicht neu ist.
 */
export function useEinzugsstempel(element: RefObject<HTMLElement | null>, frisch?: boolean) {
  useEffect(() => {
    if (frisch) element.current?.classList.add("kommt");
    // Absichtlich ohne Abhängigkeiten: der Stempel gehört dem Einhängen.
  }, []);
}

/**
 * Läuft an diesem Element tatsächlich eine Abgangs-Animation? Falsch, wenn das
 * System „weniger Bewegung" angefordert hat (dann steht die Dauer global auf
 * 0 ms), wenn das Stylesheet gar nicht geladen ist (Testumgebung) oder wenn die
 * Umgebung keine berechneten Stile liefert. In all diesen Fällen darf der
 * Eintrag nicht auf ein Ereignis warten, das nie kommt.
 */
function abgangLaeuft(element: HTMLElement) {
  // Im verdeckten Tab laufen keine Animationen: `animationend` bliebe aus und
  // die Notbremse wird als Hintergrund-Zeitgeber auf rund eine Sekunde
  // gedrosselt. Wer beim Löschen die App wechselt, fände die Karte bei der
  // Rückkehr noch da — hier gibt es nichts zu zeigen, also nichts zu warten.
  if (typeof document !== "undefined" && document.visibilityState === "hidden") return false;
  if (typeof getComputedStyle !== "function") return false;
  const stil = getComputedStyle(element);
  if (!stil.animationName || stil.animationName === "none") return false;
  return stil.animationDuration
    .split(",")
    .some((d) => Number.parseFloat(d) > 0);
}

/** Notbremse: bricht die Animation ab (Wechsel in einen Hintergrund-Tab), darf
 *  der Eintrag nicht stehen bleiben. */
const ABGANG_NOTBREMSE_MS = 400;

/**
 * Lässt die Karte `element` sichtbar abgehen und nimmt sie erst danach aus der
 * Liste (`wegnehmen`). Die Reihenfolge ist Absicht: solange die Animation
 * läuft, steht die Liste unverändert — nichts rutscht unter der Karte weg, die
 * gerade geht.
 */
export function mitAbgang(element: HTMLElement | null, wegnehmen: () => void) {
  if (!element) {
    wegnehmen();
    return;
  }
  element.classList.add("geht");
  if (!abgangLaeuft(element)) {
    element.classList.remove("geht");
    wegnehmen();
    return;
  }
  let erledigt = false;
  const abschliessen = () => {
    if (erledigt) return;
    erledigt = true;
    clearTimeout(uhr);
    element.removeEventListener("animationend", abschliessen);
    wegnehmen();
    // Die Listen sind über den Index verschlüsselt: nach dem Wegnehmen trägt
    // genau dieser DOM-Knoten den nachrückenden Eintrag. Die Klasse muss
    // deshalb mit weg, sonst bliebe er unsichtbar stehen.
    element.classList.remove("geht");
  };
  const uhr = setTimeout(abschliessen, ABGANG_NOTBREMSE_MS);
  element.addEventListener("animationend", abschliessen);
}

/**
 * Die zuletzt quittierte Marke — modulweit, nicht je Komponente.
 *
 * Die Einheitenliste wird gesucht, gefiltert und sortiert; eine Zeile hängt
 * sich dabei aus und wieder ein. Läge das Gedächtnis in der Zeile, quittierte
 * sie beim Wiedereinhängen ein zweites Mal — eine Quittung für nichts, und
 * genau das verbietet die Stempel-Regel. Kartenansicht und Tabelle stehen nie
 * gleichzeitig, teilen sich das Gedächtnis also gefahrlos.
 */
let zuletztQuittiert: string | null = null;

/**
 * Quittiert die eine Zeile, die gerade eingegangen ist: sie blitzt kurz auf
 * dem Eingangs-Fond auf (`.eingegangen` in index.html) und wird, falls sie
 * außerhalb liegt, in den Sichtbereich geholt.
 *
 * `marke` ist der Schlüssel des Eingangs plus ein Zähler — nur so quittiert
 * auch die Folgemeldung DERSELBEN Einheit, bei der sich eine bestehende Zeile
 * still ändert. `null` heißt: diese Zeile ist nicht gemeint.
 *
 * Wie bei der Zahl-Quittung über das DOM statt über einen `key`: beim ersten
 * Malen der Liste bleibt alles still, und ein Reflow lässt die Animation auch
 * dann neu ansetzen, wenn die Klasse schon steht.
 */
export function useEingangsquittung<T extends HTMLElement>(marke: string | null) {
  const element = useRef<T>(null);
  useEffect(() => {
    if (!marke || marke === zuletztQuittiert) return;
    const el = element.current;
    if (!el) return;
    zuletztQuittiert = marke;
    el.classList.remove("eingegangen");
    void el.offsetWidth;
    el.classList.add("eingegangen");
    // Ohne Rollbewegung und nur, wenn die Zeile wirklich außerhalb liegt: eine
    // Quittung, die niemand sieht, ist keine — und eine Liste, die unter dem
    // Finger wegspringt, obwohl die Zeile schon dasteht, ist schlimmer als
    // keine. „nearest" tut beides von sich aus.
    //
    // Geprüft, weil es die Funktion nicht überall gibt (Testumgebung, sehr
    // alte WebViews): die Quittung selbst hängt nicht daran und steht auch
    // ohne Rollen da.
    if (typeof el.scrollIntoView === "function") el.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [marke]);
  return element;
}
