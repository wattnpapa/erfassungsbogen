/**
 * Kompakter Umschalter Standard / Feld / Nacht — sitzt in der Fußzeile,
 * wo alle App-Einstellungen versammelt sind.
 */

import { useEffect, useRef, useState } from "react";
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

/**
 * Moduswechsel aus der festen Fußleiste des Assistenten (Audit Runde 3,
 * R3-L6): Der Umschalter stand nur im Kopf, und der Kopf rollt mit. Mitten in
 * Schritt 3 hieß „Licht aus" rund 3 000 px nach oben wischen, danach die
 * Stelle im Formular wieder suchen. Hier ein Knopf („◐") in der Leiste, ein
 * Tipp klappt die vier Modi darüber auf, der zweite wählt. Die Stelle im
 * Formular bleibt: Was vorher in der Bildmitte stand, steht danach wieder
 * dort, auch wenn der Feld-Modus die Schrift vergrößert.
 */
export function AnzeigeLeistenKnopf() {
  const [modus, setModus] = useState<AnzeigeModus>(() => anzeigeModus());
  const [offen, setOffen] = useState(false);
  const huelle = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const horcher = (e: Event) => setModus((e as CustomEvent<AnzeigeModus>).detail);
    window.addEventListener(ANZEIGE_MODUS_EVENT, horcher);
    return () => window.removeEventListener(ANZEIGE_MODUS_EVENT, horcher);
  }, []);

  // Daneben getippt oder Escape: zu, ohne zu wählen.
  useEffect(() => {
    if (!offen) return;
    const daneben = (e: Event) => {
      if (!huelle.current?.contains(e.target as Node)) setOffen(false);
    };
    const taste = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOffen(false);
    };
    document.addEventListener("pointerdown", daneben);
    document.addEventListener("keydown", taste);
    return () => {
      document.removeEventListener("pointerdown", daneben);
      document.removeEventListener("keydown", taste);
    };
  }, [offen]);

  function waehle(m: AnzeigeModus) {
    // Anker: das Element in der Bildmitte, damit die Stelle im Formular bleibt.
    const anker = typeof document.elementFromPoint === "function"
      ? document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2)
      : null;
    const vorher = anker?.getBoundingClientRect().top;
    setModus(m);
    anzeigeModusSetzen(m);
    setOffen(false);
    if (anker && vorher != null) {
      const nachher = anker.getBoundingClientRect().top;
      if (Math.abs(nachher - vorher) > 1) window.scrollBy(0, nachher - vorher);
    }
  }

  const aktuell = ANZEIGE_MODI.find((x) => x.modus === modus)?.label ?? "";
  return (
    <span className="anzeige-leiste" ref={huelle}>
      <button
        type="button"
        className="anzeige-leiste-knopf"
        aria-expanded={offen}
        aria-label={`Anzeigemodus ${aktuell} – ${offen ? "zuklappen" : "ändern"}`}
        title="Anzeigemodus (Standard, Dunkel, Feld, Nacht)"
        onClick={() => setOffen((o) => !o)}
      >
        <span aria-hidden="true">◐</span>
      </button>
      {offen && (
        <span className="anzeige-leiste-wahl" role="group" aria-label="Anzeigemodus">
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
      )}
    </span>
  );
}
