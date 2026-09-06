/**
 * Seitenkopf: die Kopfleiste jeder Web-Ansicht (Startseite, Assistent,
 * Einsatz, Musterung). Sie liegt bewusst außerhalb von <main> und trägt die
 * volle Fensterbreite — nur so liest sie sich als Kopf der Seite und nicht
 * als weitere Karte im Inhalt. Der Inhalt der Leiste bleibt dabei auf dem
 * Satzspiegel des Textes, damit Titel und Inhalt dieselbe linke Kante haben.
 *
 * Die Sprungmarke sitzt hier, weil der Kopf in jeder Ansicht das erste Element
 * ist: sie muss der erste Tabstopp sein, sonst führt der Weg zum Formular
 * jedes Mal durch Rücksprung, Anzeige-Umschalter und die Schrittleiste.
 */

import type { ReactNode } from "react";

/**
 * Knopf statt <a href="#inhalt">: das URL-Fragment ist in dieser App keine
 * Sprungadresse, sondern die Nutzlast eines QR-Codes (siehe
 * startAusUrlFragment in main.tsx). Ein „#inhalt" in der Adresszeile würde
 * beim nächsten Neuladen als Bogen gelesen und mit „kein gültiger
 * Erfassungsbogen" quittiert. Der Fokus wandert deshalb direkt per Skript.
 */
function zumInhalt() {
  const inhalt = document.getElementById("inhalt");
  if (!inhalt) return;
  inhalt.focus();
  inhalt.scrollIntoView();
}

/**
 * `vorspann` steht zwischen Sprungmarke und Kopfbalken — dort sitzt die
 * Kopfnavigation auf der Startseite. Sie muss über dem Balken liegen, darf
 * aber die Sprungmarke nicht von Platz eins der Tabfolge verdrängen: Sonst
 * führte der Weg zum Formular jedes Mal durch acht Navigationslinks, also
 * genau an dem Element vorbei, das ihn abkürzen soll.
 */
export function SeitenKopf({
  variante,
  vorspann,
  children,
}: {
  variante?: string;
  vorspann?: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <button type="button" className="sprungmarke" onClick={zumInhalt}>
        Zum Inhalt springen
      </button>
      {vorspann}
      <header className={variante ? `seiten-kopf ${variante}` : "seiten-kopf"}>
        <div className="kopf-inhalt">{children}</div>
      </header>
    </>
  );
}
