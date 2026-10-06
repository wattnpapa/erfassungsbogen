/**
 * Quittung mit Rückweg, fest am unteren Bildrand (Daumenbereich), mit
 * „Rückgängig" in voller Knopfgröße (Audit Runde 2, R2-H4). Sie bleibt, bis
 * die nächste Quittung sie ersetzt, sie geschlossen wird oder die Ansicht
 * wechselt — ein Zeitablauf nähme den einzigen Rückweg, während der Helfer
 * gerade woanders hinsieht.
 *
 * Runde 3 (R3-G2, R3-S5, R3-G1, R3-D3):
 * - höchstens zwei Zeilen Text: Die Handlung („Abgerückt 20:39") steht vorn,
 *   der Name folgt und wird gekürzt. Bei 320 × 568 brach ein langer
 *   Einheitsname in fünf Zeilen, die Leiste deckte 26 % des Bilds;
 * - die Seite hält unten ihre Höhe frei (`--quittung-hoehe`), damit sie
 *   nichts dauerhaft verdeckt;
 * - geht sie unter dem Finger auf, sperrt sie diese Stelle (tipp-schutz.ts)
 *   und rollt, was der Finger eben getippt hat, über sich;
 * - über einer festen Fußleiste (Assistent) steht sie über ihr, nicht darauf;
 * - ohne `onRueckgaengig` quittiert sie nur (etwa ein Zurücknehmen).
 *
 * `prellschutz`: Die Knöpfe nehmen erst nach PRELLSCHUTZ_MS an.
 */

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { PRELLSCHUTZ_MS, letzterTippOrt, ortSperren } from "./tipp-schutz";

/** Die Karte (Einheit, Person, Fahrzeug) unter der getippten Stelle, durch die Leiste hindurch. */
function darunterLiegendeKarte(tipp: { x: number; y: number }, leiste: HTMLElement): HTMLElement | null {
  if (typeof document.elementsFromPoint !== "function") return null;
  for (const e of document.elementsFromPoint(tipp.x, tipp.y)) {
    if (leiste.contains(e)) continue;
    const karte = e.closest<HTMLElement>(".einheit-zeile, .karte, article, li, fieldset");
    if (karte) return karte;
  }
  return null;
}

export function DaumenQuittung({ children, prellschutz = false, onRueckgaengig, onSchliessen }: {
  children: ReactNode;
  prellschutz?: boolean;
  onRueckgaengig?: () => void;
  onSchliessen: () => void;
}) {
  const [bereit, setBereit] = useState(!prellschutz);
  const leiste = useRef<HTMLDivElement>(null);
  // Nur einmal je Leiste rollen (StrictMode ruft den Effekt doppelt auf).
  const gerollt = useRef(false);
  useEffect(() => {
    if (bereit) return;
    const uhr = setTimeout(() => setBereit(true), PRELLSCHUTZ_MS);
    return () => clearTimeout(uhr);
  }, [bereit]);
  useLayoutEffect(() => {
    const el = leiste.current;
    if (!el) return;
    const wurzel = document.documentElement;
    // Über einer festen Fußleiste (Assistent: „← Zurück"/„Weiter →").
    const nav = document.querySelector<HTMLElement>("footer.nav");
    const navOben = nav?.getBoundingClientRect().top;
    const hoehe = window.innerHeight || wurzel.clientHeight;
    if (navOben != null && navOben > 0 && navOben < hoehe) {
      el.style.bottom = `${Math.round(hoehe - navOben + 8)}px`;
    }
    const r = el.getBoundingClientRect();
    wurzel.style.setProperty("--quittung-hoehe", `${Math.round(r.height + 16)}px`);
    // Ging die Leiste unter dem Finger auf: diese Stelle sperren, und was
    // eben getippt wurde, samt den Knöpfen derselben Karte über die Leiste
    // rollen — höchstens so weit, dass die getippte Stelle im Bild bleibt.
    const tipp = gerollt.current ? null : letzterTippOrt();
    gerollt.current = true;
    /**
     * Ein Kartenkopf unterhalb der getippten Stelle, den die Leiste anschneidet
     * (R3-G2, Rest): Nach „Abrücken" weiter unten lag der Kopf der nächsten
     * Karte halb unter der Leiste, bis man rollte. Er wird mit über die
     * Leiste gerollt, solange die getippte Stelle im Bild bleibt.
     */
    const angeschnittenerKopf = (y: number): number => {
      let noetig = 0;
      for (const kopf of document.querySelectorAll<HTMLElement>("main h2, main h3")) {
        const s = kopf.getBoundingClientRect();
        if (s.height === 0 || s.top <= y || s.top >= r.bottom || s.bottom <= r.top) continue;
        noetig = Math.max(noetig, s.bottom - r.top + 8);
      }
      return noetig;
    };
    if (tipp && !(tipp.y >= r.top - 8 && tipp.y <= r.bottom + 8)) {
      const rollen = Math.min(angeschnittenerKopf(tipp.y), Math.max(0, tipp.y - 64));
      try {
        if (rollen > 0) window.scrollBy(0, Math.round(rollen));
      } catch {
        /* Testumgebung ohne Layout */
      }
    }
    if (tipp && tipp.y >= r.top - 8 && tipp.y <= r.bottom + 8) {
      ortSperren();
      let rollen = tipp.y - r.top + 40;
      const karte = darunterLiegendeKarte(tipp, el);
      if (karte) {
        for (const k of karte.querySelectorAll<HTMLElement>("button, a[href], input, select, textarea, summary")) {
          const s = k.getBoundingClientRect();
          // Unter der Leiste oder knapp darunter (umgebrochene Knopfreihe,
          // etwa „Mehr…" eine Zeile tiefer, noch unter dem Bildrand).
          if (s.height === 0 || s.bottom <= r.top || s.top > tipp.y + 160) continue;
          rollen = Math.max(rollen, s.bottom - r.top + 8);
        }
      }
      rollen = Math.max(rollen, angeschnittenerKopf(tipp.y));
      rollen = Math.min(rollen, Math.max(0, tipp.y - 64));
      try {
        if (rollen > 0) window.scrollBy(0, Math.round(rollen));
      } catch {
        /* Testumgebung ohne Layout */
      }
    }
    return () => {
      wurzel.style.removeProperty("--quittung-hoehe");
    };
  }, []);
  return (
    <div className="quittung-daumen" role="status" ref={leiste}>
      <span className="quittung-text">{children}</span>
      {/* Die beiden Knöpfe bleiben als Paar zusammen: reicht die Breite nicht
          für Text und Knöpfe, rutscht das Paar unter den Text (R4-M1) — „✕"
          steht nie allein in einer Zeile. */}
      <span className="quittung-knoepfe">
        {onRueckgaengig && (
          <button type="button" className="quittung-rueckgaengig" disabled={!bereit} onClick={onRueckgaengig}>
            Rückgängig
          </button>
        )}
        <button type="button" className="quittung-schliessen" disabled={!bereit} aria-label="Quittung schließen" onClick={onSchliessen}>
          ✕
        </button>
      </span>
    </div>
  );
}
