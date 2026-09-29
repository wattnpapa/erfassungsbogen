/**
 * Vollbild-Overlays (QR-Vollbild, Scanner) als echte modale Dialoge.
 *
 * Beide waren ein `<div role="dialog">` über der Seite: Der Fokus blieb auf
 * dem Auslöser dahinter, Tab wanderte über verdeckte Knöpfe („Neuer Bogen",
 * „Bearbeiten"), die Seite darunter rollte beim Wischen mit, und nach dem
 * Schließen stand der Fokus auf `<body>` (Audit Runde 2, R2-M3). Die übrigen
 * Dialoge der App sind `<dialog>` mit `showModal()` — das leisten die Overlays
 * jetzt auch: Der Browser macht den Rest der Seite inert (kein Tab, kein
 * Vorlesen dahinter), Escape meldet sich als `cancel`.
 *
 * Dazu kommt, was `showModal()` nicht selbst tut:
 *  - die Seite dahinter festhalten (sie rollte sonst unter dem Overlay mit),
 *  - den Fokus beim Öffnen ins Overlay setzen und beim Schließen an den
 *    Auslöser zurückgeben — auch wenn React das Element einfach aushängt.
 */

import { useLayoutEffect, useRef, type RefObject } from "react";

// Mehrere Overlays können gestapelt sein (Scanner und darüber eine Rückfrage
// sind native Dialoge; zwei Overlays zugleich kommen nicht vor, schaden aber
// auch nicht): erst das letzte gibt die Seite wieder frei.
let sperren = 0;
let overflowVorher = "";

function seiteSperren(): void {
  if (sperren++ > 0) return;
  const html = document.documentElement;
  overflowVorher = html.style.overflow;
  html.style.overflow = "hidden";
}

function seiteFreigeben(): void {
  if (sperren === 0 || --sperren > 0) return;
  document.documentElement.style.overflow = overflowVorher;
}

export interface ModalOptionen {
  /** Escape (bzw. die Schließen-Geste des Systems) — der Aufrufer schließt. */
  onSchliessen: () => void;
  /** Was nach dem Öffnen den Fokus bekommt; Vorgabe: der Dialog selbst. */
  erstesZiel?: () => HTMLElement | null | undefined;
  /** Wohin der Fokus nach dem Schließen geht; Vorgabe: was vorher fokussiert war. */
  rueckfokus?: () => HTMLElement | null | undefined;
}

/**
 * Den `<dialog>` hinter `ref` beim Einhängen modal öffnen und beim Aushängen
 * sauber schließen. Der Dialog braucht `tabIndex={-1}`, damit er selbst den
 * Fokus nehmen kann.
 */
export function useModalesOverlay(ref: RefObject<HTMLDialogElement | null>, optionen: ModalOptionen): void {
  const opt = useRef(optionen);
  opt.current = optionen;
  // Layout-Effekt: läuft vor dem ersten Malen — das Overlay erscheint gleich
  // modal — und beim Aushängen, BEVOR React den Knoten entfernt.
  useLayoutEffect(() => {
    const d = ref.current;
    if (!d) return;
    const vorher = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!d.open) {
      try {
        d.showModal();
      } catch {
        d.setAttribute("open", ""); // sehr alte Webviews: wenigstens sichtbar
      }
    }
    seiteSperren();
    (opt.current.erstesZiel?.() ?? d).focus({ preventScroll: true });
    const abbrechen = (e: Event) => {
      e.preventDefault(); // schließen tut der Aufrufer, sonst stünde React-Zustand und DOM quer
      opt.current.onSchliessen();
    };
    d.addEventListener("cancel", abbrechen);
    return () => {
      d.removeEventListener("cancel", abbrechen);
      if (d.open) {
        try {
          d.close();
        } catch {
          d.removeAttribute("open");
        }
      }
      seiteFreigeben();
      const ziel = opt.current.rueckfokus?.() ?? vorher;
      if (ziel?.isConnected) ziel.focus({ preventScroll: true });
    };
  }, [ref]);
}
