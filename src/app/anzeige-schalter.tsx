/**
 * Kompakter Umschalter Standard / Feld / Nacht — sitzt in der Fußzeile,
 * wo alle App-Einstellungen versammelt sind.
 */

import { useEffect, useState } from "react";
import {
  ANZEIGE_MODI,
  ANZEIGE_MODUS_EVENT,
  anzeigeModus,
  anzeigeModusSetzen,
  type AnzeigeModus,
} from "./anzeige-modus";

export function AnzeigeSchalter() {
  const [modus, setModus] = useState<AnzeigeModus>(() => anzeigeModus());

  // Es gibt mehrere Instanzen (Kopfbereich + Fußzeile) — über das Event
  // bleiben alle auf demselben Stand, egal wo umgeschaltet wird.
  useEffect(() => {
    const horcher = (e: Event) => setModus((e as CustomEvent<AnzeigeModus>).detail);
    window.addEventListener(ANZEIGE_MODUS_EVENT, horcher);
    return () => window.removeEventListener(ANZEIGE_MODUS_EVENT, horcher);
  }, []);

  function waehle(m: AnzeigeModus) {
    setModus(m);
    anzeigeModusSetzen(m);
  }

  return (
    <span className="anzeige-schalter" role="group" aria-label="Anzeigemodus">
      {ANZEIGE_MODI.map(({ modus: m, label, titel }) => (
        <button
          key={m}
          type="button"
          className={m === modus ? "aktiv" : ""}
          aria-pressed={m === modus}
          title={titel}
          onClick={() => waehle(m)}
        >
          {label}
        </button>
      ))}
    </span>
  );
}
