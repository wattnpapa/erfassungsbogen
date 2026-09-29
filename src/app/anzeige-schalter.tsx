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

/**
 * `klappbar` (Assistenten-Kopf, R2-H7): Auf dem Telefon steht nur der gewählte
 * Modus als Knopf da („Standard ▾"); ein Tipp klappt die vier Segmente auf.
 * Die vier Segmente brauchten sonst eine eigene Kopfzeile — neben
 * „‹ Startseite" passen sie im Feld-Modus nicht. Ab 30rem Breite blendet das
 * Stylesheet den Klappknopf aus und zeigt die Segmente wie gewohnt; das
 * Ausblenden ist reines CSS, im Baum stehen immer alle Knöpfe.
 */
export function AnzeigeSchalter({ klappbar = false }: { klappbar?: boolean }) {
  const [modus, setModus] = useState<AnzeigeModus>(() => anzeigeModus());
  const [offen, setOffen] = useState(false);

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
    setOffen(false);
  }

  const klassen = ["anzeige-schalter", klappbar ? "klappbar" : "", klappbar && offen ? "offen" : ""]
    .filter(Boolean)
    .join(" ");
  const aktuell = ANZEIGE_MODI.find((x) => x.modus === modus)?.label ?? "";

  return (
    <span className={klassen} role="group" aria-label="Anzeigemodus">
      {klappbar && (
        <button
          type="button"
          className="anzeige-klappe"
          aria-expanded={offen}
          aria-label={`Anzeigemodus ${aktuell} – ${offen ? "zuklappen" : "ändern"}`}
          onClick={() => setOffen((o) => !o)}
        >
          {aktuell} <span aria-hidden="true">{offen ? "▴" : "▾"}</span>
        </button>
      )}
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
