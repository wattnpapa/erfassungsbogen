/**
 * Warnleiste, die am oberen Bildrand festsitzt (Audit Runde 5, R5-O1, R5-S4).
 *
 * „Nicht gespeichert" stand im Kopf des Assistenten und rollte mit der Seite
 * weg: Wer mitten im Schritt tippte, sah sie erst nach dem Hochrollen (R5-O1).
 * Die Konfliktwarnung der zwei Fenster saß schon fest am Rand, war aber mit
 * Text und zwei Knöpfen 240 px hoch und deckte bei offener Tastatur das Feld,
 * in das getippt wird (R5-S4). Beide laufen jetzt über diese Leiste:
 *
 * - zwei Zeilen Kurztext, die Einzelheiten hinter einem Tipp („Was tun?",
 *   „Entscheiden");
 * - bei knapper Bildhöhe (offene Tastatur, Querformat) startet sie
 *   eingeklappt, damit das Eingabefeld frei bleibt;
 * - die Seite rückt um die Leistenhöhe nach unten (`--fest-warnung-hoehe`,
 *   siehe index.html), und das Scrollen zu einem Feld hält sie frei —
 *   die Leiste verdeckt weder Kopf noch Eingabe.
 */

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

/** Unter dieser Bildhöhe (px) gilt der Bildschirm als knapp: Tastatur offen oder Querformat. */
export const KNAPPE_BILDHOEHE = 480;

function bildhoehe(): number {
  if (typeof window === "undefined") return Infinity;
  return window.visualViewport?.height ?? window.innerHeight ?? Infinity;
}

export function FesteWarnung({
  klasse,
  rolle = "alert",
  kurz,
  details,
  detailsKnopf = "Was tun?",
  aktionen,
  einklappenBeiKnappemBild = true,
  offenAnfangs = false,
  aktionenImmer = false,
}: {
  /** Zusatzklassen (`fenster-konflikt`, `speicher-fehler`). */
  klasse: string;
  rolle?: "alert" | "status";
  /** Der Satz, der immer da ist — höchstens zwei Zeilen. */
  kurz: ReactNode;
  /** Einzelheiten, hinter dem Knopf. */
  details?: ReactNode;
  detailsKnopf?: string;
  /** Knöpfe der Entscheidung (nur ausgeklappt sichtbar). */
  aktionen?: ReactNode;
  /** Bei knapper Bildhöhe eingeklappt beginnen. */
  einklappenBeiKnappemBild?: boolean;
  /** Ohne knappes Bild gleich ausgeklappt (die Entscheidung der zwei Fenster). */
  offenAnfangs?: boolean;
  /**
   * Die Knöpfe der Entscheidung stehen immer in der Leiste, solange das Bild
   * nicht knapp ist; `details` klappen getrennt auf („Genauer"). Bei knappem
   * Bild (Tastatur, Querformat) bleibt es beim Schalter „Entscheiden"
   * (Audit Runde 7, R7-O1, R7-M2: Die Knöpfe lagen hinter einem inneren Rollen).
   */
  aktionenImmer?: boolean;
}) {
  const [knapp, setKnapp] = useState(() => bildhoehe() < KNAPPE_BILDHOEHE);
  const [offen, setOffen] = useState(() => offenAnfangs && !(einklappenBeiKnappemBild && bildhoehe() < KNAPPE_BILDHOEHE));
  const leiste = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const vv = window.visualViewport;
    const pruefen = () => {
      const k = bildhoehe() < KNAPPE_BILDHOEHE;
      setKnapp(k);
      // Geht die Tastatur auf, räumt die Leiste das Feld frei.
      if (k && einklappenBeiKnappemBild) setOffen(false);
    };
    vv?.addEventListener("resize", pruefen);
    window.addEventListener("resize", pruefen);
    return () => {
      vv?.removeEventListener("resize", pruefen);
      window.removeEventListener("resize", pruefen);
    };
  }, [einklappenBeiKnappemBild]);

  // Die Höhe an die Seite melden: Sie rückt nach unten, und Fokus-Scrollen
  // lässt die Leiste frei (index.html).
  useLayoutEffect(() => {
    const el = leiste.current;
    if (!el) return;
    const wurzel = document.documentElement;
    const messen = () => wurzel.style.setProperty("--fest-warnung-hoehe", `${Math.ceil(el.getBoundingClientRect().height)}px`);
    messen();
    const beobachter = typeof ResizeObserver === "function" ? new ResizeObserver(messen) : null;
    beobachter?.observe(el);
    return () => {
      beobachter?.disconnect();
      wurzel.style.removeProperty("--fest-warnung-hoehe");
    };
  }, []);

  const hatMehr = !!details || !!aktionen;
  const aktionenSichtbar = !!aktionen && (aktionenImmer ? !knapp || offen : offen);
  // Bei dauernd sichtbaren Knöpfen öffnet der Schalter nur noch die Einzelheiten.
  const schalterText = offen
    ? "Zuklappen"
    : aktionenImmer && !knapp
      ? "Genauer"
      : aktionen && !details
        ? "Entscheiden"
        : aktionen && aktionenImmer
          ? "Entscheiden"
          : detailsKnopf;
  return (
    <div ref={leiste} className={`autosave fest-warnung ${klasse}${knapp ? " knapp" : ""}`} role={rolle}>
      <p className="fest-kurz">{kurz}</p>
      {offen && details && <div className="fest-details">{details}</div>}
      {aktionenSichtbar && <div className="aktionen">{aktionen}</div>}
      {hatMehr && (aktionenImmer && !knapp ? !!details : true) && (
        <button
          type="button"
          className="fest-schalter"
          aria-expanded={offen}
          onClick={() => setOffen((o) => !o)}
        >
          {schalterText}
        </button>
      )}
    </div>
  );
}
