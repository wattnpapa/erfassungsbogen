/**
 * Quittung mit Rückweg, fest am unteren Bildrand (Daumenbereich), mit
 * „Rückgängig" in voller Knopfgröße (Audit Runde 2, R2-H4). Sie bleibt, bis
 * die nächste Quittung sie ersetzt, sie geschlossen wird, die Ansicht
 * wechselt oder `QUITTUNG_ENDE_NACH_MS` (30 s) vergangen sind (R18).
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
 * Runde 18: „Rückgängig" und „✕" nehmen sofort an (nie gesperrt, R18-G3); der Text steht immer vollständig da (kein
 * Abschneiden, R18-S2/N2/D5); nach `QUITTUNG_ENDE_NACH_MS` verschwindet die Leiste ganz; „✕" liegt mindestens 12 px
 * neben „Rückgängig" (R18-D6).
 */

import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { QUITTUNG_SPERRE_KURZ_MS, QUITTUNG_SPERRE_MS, letzterTippOrt, ortSperren } from "./tipp-schutz";

/**
 * So lange steht die Leiste mit vollem Text und „Rückgängig"; danach verschwindet sie ganz (R18-S2, H1, W1, A8). Vorher
 * schrumpfte sie nach 15 s auf eine Zeile mit gekürztem Text und blieb so stehen, auch nach Stunden: ein „Rückgängig"
 * ohne lesbaren Gegenstand. Die Handlung bleibt über die Historie der Einheit und die Kopfzeile erreichbar.
 */
export const QUITTUNG_ENDE_NACH_MS = 30_000;

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

export function DaumenQuittung({ children, sperreKurz = false, onRueckgaengig, rueckgaengigName, onSchliessen, mehrzeilig = false }: {
  children: ReactNode;
  /** „Rückgängig" nimmt etwas Harmloses zurück: Die Stelle unter der Leiste sperrt nur so lang wie der Prellschutz (R17-D3). */
  sperreKurz?: boolean;
  /** Ohne Wirkung seit R18 (der Text steht immer vollständig da); bleibt, damit ältere Aufrufer weiter passen. */
  kurz?: ReactNode;
  /** Nur noch die Klasse `quittung-mehrzeilig` (R11-M3); der Text steht seit R18 in jedem Fall vollständig da. */
  mehrzeilig?: boolean;
  /** Ohne Wirkung seit R18: „Rückgängig" und „✕" sind nie gesperrt (R18-G3). */
  prellschutz?: boolean;
  onRueckgaengig?: () => void;
  /** Voller Name des Rückgängig-Knopfs für Vorlesesoftware und Tooltip, wenn „Rückgängig" allein zu wenig sagt (R5-E3). */
  rueckgaengigName?: string;
  onSchliessen: () => void;
}) {
  const leiste = useRef<HTMLDivElement>(null);
  // Nur einmal je Leiste rollen (StrictMode ruft den Effekt doppelt auf).
  const gerollt = useRef(false);
  // Nach 30 s verschwindet die Leiste ganz (R18-S2): Sie stand sonst stundenlang mit gekürztem Text da.
  const schliessen = useRef(onSchliessen);
  schliessen.current = onSchliessen;
  useEffect(() => {
    const uhr = setTimeout(() => schliessen.current(), QUITTUNG_ENDE_NACH_MS);
    return () => clearTimeout(uhr);
  }, []);
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
    } else {
      el.style.bottom = ""; // eine schwebende Leiste (R17-S11) rastet beim erneuten Messen unten ein
    }
    let r = el.getBoundingClientRect();
    wurzel.style.setProperty("--quittung-hoehe", `${Math.round(r.height + 16)}px`);
    // Ging die Leiste unter dem Finger auf: diese Stelle sperren, und was
    // eben getippt wurde, samt den Knöpfen derselben Karte über die Leiste
    // rollen — höchstens so weit, dass die getippte Stelle im Bild bleibt.
    const tipp = gerollt.current ? null : letzterTippOrt();
    gerollt.current = true;
    // R17-S11: Läge die Leiste auf dem Knopf, den der Finger eben getippt hat, schwebt sie stattdessen direkt darüber. Die
    // Seite springt dann nicht mehr (vorher rollte sie bis zu 144 px unter dem Finger weg), der getippte Knopf und der
    // Gegenknopf bleiben, wo sie waren, und „Rückgängig" liegt in Daumennähe. Rollt der Nutzer, rastet sie unten ein.
    let schwebt = false;
    let schwebAb: (() => void) | undefined;
    if (tipp && tipp.y >= r.top - 8 && tipp.y <= r.bottom + 8 && typeof document.elementsFromPoint === "function") {
      const getippt = document
        .elementsFromPoint(tipp.x, tipp.y)
        .find((e) => !el.contains(e))
        ?.closest<HTMLElement>("button, a[href], summary, input, select, textarea");
      const oben = getippt?.getBoundingClientRect().top;
      if (oben != null && oben - 8 - r.height >= 8) {
        const unten = el.style.bottom;
        el.style.bottom = `${Math.round(hoehe - oben + 8)}px`;
        r = el.getBoundingClientRect();
        schwebt = true;
        const start = window.scrollY;
        const einrasten = () => {
          if (Math.abs(window.scrollY - start) < 48) return;
          el.style.bottom = unten;
          window.removeEventListener("scroll", einrasten);
        };
        window.addEventListener("scroll", einrasten, { passive: true });
        schwebAb = () => window.removeEventListener("scroll", einrasten);
      }
    }
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
    // Eine Leiste ohne „Rückgängig" (Auskunft nach einem Zurücknehmen) liegt oft genau dort, wo gleich das nächste
    // „Rückgängig" erscheint: Sie sperrt die Stelle nur kurz, sonst verwirft sie den bewussten nächsten Tipp (R17-D3).
    const sperrDauer = sperreKurz || !onRueckgaengig ? QUITTUNG_SPERRE_KURZ_MS : QUITTUNG_SPERRE_MS;
    if (schwebt && tipp) ortSperren(sperrDauer);
    if (tipp && !schwebt && !(tipp.y >= r.top - 8 && tipp.y <= r.bottom + 8)) {
      const rollen = Math.min(angeschnittenerKopf(tipp.y), Math.max(0, tipp.y - 64));
      try {
        if (rollen > 0) window.scrollBy(0, Math.round(rollen));
      } catch {
        /* Testumgebung ohne Layout */
      }
    }
    if (tipp && !schwebt && tipp.y >= r.top - 8 && tipp.y <= r.bottom + 8) {
      // 2,5 s statt 1,5 s: Zweittipp ab 1,5 s nahm das Abrücken zurück (R8-D5); bei harmlosem Rückgängig nur der Prellschutz (R17-D3).
      ortSperren(sperrDauer);
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
      schwebAb?.();
      wurzel.style.removeProperty("--quittung-hoehe");
    };
  }, []);
  return (
    <div className={`quittung-daumen${mehrzeilig ? " quittung-mehrzeilig" : ""}`} role="status" ref={leiste}>
      <span className="quittung-text">{children}</span>
      {/* Die beiden Knöpfe bleiben als Paar zusammen: reicht die Breite nicht
          für Text und Knöpfe, rutscht das Paar unter den Text (R4-M1) — „✕"
          steht nie allein in einer Zeile. */}
      <span className="quittung-knoepfe">
        {onRueckgaengig && (
          <button type="button" className="quittung-rueckgaengig" data-sicher="" onClick={() => onRueckgaengig()} aria-label={rueckgaengigName} title={rueckgaengigName}>
            Rückgängig
          </button>
        )}
        <button type="button" className="quittung-schliessen" data-sicher="" aria-label="Quittung schließen" onClick={() => onSchliessen()}>
          ✕
        </button>
      </span>
    </div>
  );
}
