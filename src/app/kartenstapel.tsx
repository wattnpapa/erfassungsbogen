/**
 * Zu- und Abgang in einem Kartenstapel — die Bauteile hinter
 * `eintrag-bewegung.ts` für Listen, die aus ganzen Karten bestehen
 * (Einsätze, Vorlagen, deren Papierkörbe).
 *
 * Personal und Fahrzeuge tragen dieselbe Bewegung schon länger. Die Frage ist
 * überall dieselbe: aus einem Stapel gleich aussehender Karten verschwindet
 * eine — war es die richtige? Und eine kommt dazu — welche? Der Abgang zeigt
 * die Karte, bevor sie geht; der Stempel markiert die, die kam.
 *
 * Die Karte reicht ihre Referenz über einen Kontext an ihre Knöpfe: sonst
 * müsste jede Liste die Referenz selbst durchfädeln, und genau dabei geriete
 * sie irgendwann an die falsche Karte.
 */

import { createContext, useContext, useRef, type ReactNode, type RefObject } from "react";
import { mitAbgang, useEinzugsstempel } from "./eintrag-bewegung";

const KarteKontext = createContext<RefObject<HTMLElement | null> | null>(null);

/**
 * Eine Karte im Stapel. `frisch` stempelt sie beim Einhängen ein — für die
 * eine Karte, die gerade dazukam (neu angelegt, zurückgeholt, eingegangen).
 */
export function Kartenstapel(props: { className: string; frisch?: boolean; children: ReactNode }) {
  const karte = useRef<HTMLElement>(null);
  useEinzugsstempel(karte, props.frisch);
  return (
    <KarteKontext.Provider value={karte}>
      <section ref={karte} className={props.className}>
        {props.children}
      </section>
    </KarteKontext.Provider>
  );
}

/**
 * Ein Knopf, der seine Karte aus der Liste nimmt: erst geht sie sichtbar ab,
 * dann erst wird sie weggenommen (`mitAbgang`).
 *
 * `bestaetigen` läuft davor und kann abbrechen. Die Reihenfolge ist Absicht:
 * ein Abgang vor der Rückfrage ließe die Karte bei „Abbrechen" unsichtbar
 * stehen — die Abgangs-Animation hält ihren Endzustand.
 */
export function AbgangKnopf(props: {
  className?: string;
  title?: string;
  bestaetigen?: () => Promise<boolean>;
  onAusfuehren: () => void;
  children: ReactNode;
}) {
  const karte = useContext(KarteKontext);
  return (
    <button
      type="button"
      className={props.className}
      title={props.title}
      onClick={async () => {
        if (props.bestaetigen && !(await props.bestaetigen())) return;
        mitAbgang(karte?.current ?? null, props.onAusfuehren);
      }}
    >
      {props.children}
    </button>
  );
}
