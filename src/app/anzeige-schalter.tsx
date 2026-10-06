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
 * Modus als Knopf da („Ansicht: Standard ▾"); ein Tipp klappt die vier Segmente auf.
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
          aria-label={`Ansicht: ${aktuell} – ${offen ? "zuklappen" : "ändern"}`}
          onClick={() => setOffen((o) => !o)}
        >
          {/* „Standard ▾" klang nach einer Einstellung des Bogens; „Ansicht:" sagt,
              dass es um die Darstellung der App geht (Audit Runde 4, R4-H5). */}
          Ansicht: {aktuell} <span aria-hidden="true">{offen ? "▴" : "▾"}</span>
        </button>
      )}
      {ANZEIGE_MODI.map(({ modus: m, label, kurz, titel }) => (
        <button
          key={m}
          type="button"
          className={m === modus ? "aktiv" : ""}
          aria-pressed={m === modus}
          title={titel}
          onClick={() => waehle(m)}
        >
          {label}
          <span className="modus-kurz" aria-hidden="true">{kurz}</span>
        </button>
      ))}
    </span>
  );
}

/** Höchste Höhe, die ein Anker haben darf (px): eine Zeile, ein Feld, eine Überschrift. */
const ANKER_MAX_HOEHE = 120;

/**
 * Das Element, das beim Moduswechsel an seiner Stelle im Bild bleiben soll
 * (Audit Runde 4, R4-L3). Bisher: was genau in der Bildmitte lag. Traf der
 * Punkt die Fläche einer ganzen Personenkarte (Rand, Zwischenraum), war das die
 * Karte selbst — es blieb nur ihre Oberkante stehen, und der Inhalt darin
 * wanderte im Feld-Modus, der die Schrift vergrößert, um rund 375 px (mehr
 * als eine halbe Bildhöhe).
 *
 * Jetzt: das erste Element um die Bildmitte, das höchstens eine Zeile hoch
 * ist (Feld, Beschriftung, Knopf, Überschrift). Gesucht wird in der Mitte,
 * dann in Schritten nach oben und unten und an drei Spalten; fest
 * positionierte Elemente (Leiste, Quittung) zählen nicht. Findet sich nichts,
 * gilt wie bisher, was in der Mitte liegt.
 */
export function ankerInBildmitte(dok: Document = document, fenster: Window = window): Element | null {
  if (typeof dok.elementFromPoint !== "function") return null;
  const w = fenster.innerWidth;
  const h = fenster.innerHeight;
  const spalten = [w / 2, w * 0.25, w * 0.75];
  const schritte = [0, -24, 24, -48, 48, -80, 80, -120, 120];
  for (const d of schritte) {
    for (const x of spalten) {
      const el = dok.elementFromPoint(x, h / 2 + d);
      if (!el || el === dok.documentElement || el === dok.body) continue;
      if (festPositioniert(el, fenster)) continue;
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && r.height <= ANKER_MAX_HOEHE) return el;
    }
  }
  return dok.elementFromPoint(w / 2, h / 2);
}

function festPositioniert(el: Element, fenster: Window): boolean {
  for (let e: Element | null = el; e && e !== e.ownerDocument.documentElement; e = e.parentElement) {
    if (fenster.getComputedStyle(e).position === "fixed") return true;
  }
  return false;
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
    // Anker: ein kleines Element um die Bildmitte, damit die Stelle im Formular bleibt.
    const anker = ankerInBildmitte();
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
        aria-label={`Ansicht: ${aktuell} – ${offen ? "zuklappen" : "ändern"}`}
        title="Ansicht (Standard, Dunkel, Feld, Nacht)"
        onClick={() => setOffen((o) => !o)}
      >
        <span aria-hidden="true">◐</span>
      </button>
      {offen && (
        <span className="anzeige-leiste-wahl" role="group" aria-label="Anzeigemodus">
          {ANZEIGE_MODI.map(({ modus: m, label, kurz, titel }) => (
            <button
              key={m}
              type="button"
              className={m === modus ? "aktiv" : ""}
              aria-pressed={m === modus}
              title={titel}
              onClick={() => waehle(m)}
            >
              {label}
              <span className="modus-kurz" aria-hidden="true">{kurz}</span>
            </button>
          ))}
        </span>
      )}
    </span>
  );
}
