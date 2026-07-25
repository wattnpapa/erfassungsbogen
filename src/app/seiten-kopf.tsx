/**
 * Seitenkopf: die Kopfleiste jeder Web-Ansicht (Startseite, Assistent,
 * Einsatz, Musterung). Sie liegt bewusst außerhalb von <main> und trägt die
 * volle Fensterbreite — nur so liest sie sich als Kopf der Seite und nicht
 * als weitere Karte im Inhalt. Der Inhalt der Leiste bleibt dabei auf dem
 * Satzspiegel des Textes, damit Titel und Inhalt dieselbe linke Kante haben.
 */

import type { ReactNode } from "react";

export function SeitenKopf({ variante, children }: { variante?: string; children: ReactNode }) {
  return (
    <header className={variante ? `seiten-kopf ${variante}` : "seiten-kopf"}>
      <div className="kopf-inhalt">{children}</div>
    </header>
  );
}
