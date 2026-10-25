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

import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

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

/**
 * Eigener Verlaufseintrag für ein Overlay, damit die Zurück-Geste nur das
 * Overlay schließt. Im QR-Vollbild sprang Zurück sonst eine ganze Ansicht
 * zurück — von der Übersicht auf Schritt 5 (Audit Runde 2, R2-H5).
 *
 * Bewusst an Handlungen gebunden statt an einen Effekt: Der Eintrag entsteht
 * beim Öffnen ({@link ebeneBetreten}) und wird beim Schließen über Knopf oder
 * Escape wieder verbraucht ({@link ebeneVerlassen}); Zurück schließt über
 * {@link useEbeneZurueck}. Der Eintrag übernimmt den Verlaufszustand darunter
 * (die Ansicht der App), der App-Lauscher stellt beim Rücksprung also nichts um.
 */
const EBENE = "eebEbene";

function ebeneImVerlauf(): unknown {
  try {
    return (history.state as Record<string, unknown> | null)?.[EBENE];
  } catch {
    return undefined;
  }
}

export function ebeneBetreten(kennung: string): void {
  try {
    // „eebErste" markiert nur den ersten Eintrag der App (siehe unten) und wandert nicht mit.
    const { eebErste: _erste, ...darunter } = ((history.state as Record<string, unknown> | null) ?? {}) as Record<string, unknown>;
    void _erste;
    history.pushState({ ...darunter, [EBENE]: kennung }, "");
  } catch {
    /* ohne Verlauf (eingebettet, file://) schließt eben nur der Knopf */
  }
}

/** Overlay schließen und, falls sein Eintrag obenauf liegt, ihn verbrauchen. */
export function ebeneVerlassen(kennung: string, schliessen: () => void): void {
  if (ebeneImVerlauf() === kennung) eigenesZurueck();
  schliessen();
}

/**
 * Ein `history.back()`, das die App selbst auslöst, um den Eintrag eines Fensters zu verbrauchen.
 * Der Browser liefert es asynchron: Tippt jemand davor schon auf „Startseite", zöge die späte
 * Rückkehr den neuen Eintrag wieder ab und die App sprang zurück in den Bogen (e2e-Ausfall in
 * Runde 7). `eigenesZurueckVerbrauchen` erkennt diesen Pop im Lauscher der App.
 */
let eigenesZurueckBis = 0;
function eigenesZurueck(): void {
  eigenesZurueckBis = Date.now() + 1500;
  history.back();
}

/** War der Pop eben die späte Rückkehr eines eigenen `back()`? Verbraucht die Marke. */
export function eigenesZurueckVerbrauchen(): boolean {
  const war = eigenesZurueckBis > Date.now();
  eigenesZurueckBis = 0;
  return war;
}

/** Solange das Overlay offen ist: Zurück (Gerät, Browser) schließt es. */
export function useEbeneZurueck(kennung: string, schliessen: () => void): void {
  const zu = useRef(schliessen);
  zu.current = schliessen;
  useEffect(() => {
    const beiZurueck = () => {
      if (ebeneImVerlauf() !== kennung) zu.current();
    };
    window.addEventListener("popstate", beiZurueck);
    return () => window.removeEventListener("popstate", beiZurueck);
  }, [kennung]);
}

/**
 * Rückfrage auf dem ersten Verlaufseintrag der App (Link, Startbildschirm):
 * Dort hat „Zurück" keinen App-Eintrag unter sich und verließ die Seite, die
 * Rückfrage mit ihr (Audit Runde 5, R5-S5). Solange die Rückfrage offen ist,
 * liegt darum ein eigener Eintrag über dem ersten; Zurück schließt dann die
 * Rückfrage. Gibt zurück, ob ein Eintrag angelegt wurde.
 */
export const RUECKFRAGE_EBENE = "rueckfrage";
/** Die verzögerte Rückkehr der eben geschlossenen Rückfrage, solange sie aussteht. */
let ausstehendeRueckkehr: ReturnType<typeof setTimeout> | null = null;
export function ersteEbeneBetreten(): boolean {
  try {
    // Folgt direkt eine zweite Rückfrage („Wohin damit?" → „Ist das dieselbe
    // Einheit?"), liegt der Eintrag der ersten noch obenauf: Die zweite
    // übernimmt ihn, statt dass die späte Rückkehr sie als „Zurück" liest und
    // schließt (Audit Runde 6, R6-N1).
    if (ausstehendeRueckkehr !== null && ebeneImVerlauf() === RUECKFRAGE_EBENE) {
      clearTimeout(ausstehendeRueckkehr);
      ausstehendeRueckkehr = null;
      return true;
    }
    if (!(history.state as { eebErste?: boolean } | null)?.eebErste || ebeneImVerlauf()) return false;
    ebeneBetreten(RUECKFRAGE_EBENE);
    return true;
  } catch {
    return false;
  }
}

/**
 * Liegt noch der Eintrag einer eben beantworteten Rückfrage obenauf (kein Fenster mehr offen)?
 * Dann ersetzt die App ihn durch den Eintrag der neuen Ansicht, statt einen weiteren darauf zu
 * legen: Sonst blieb er unter dem Assistenten stehen, und ein Zurück mehr führte ohne sichtbare
 * Wirkung auf dieselbe Seite (Audit Runde 6, R6-E4).
 */
export function rueckfrageEintragErsetzbar(): boolean {
  try {
    return ebeneImVerlauf() === RUECKFRAGE_EBENE && !document.querySelector("dialog[open]");
  } catch {
    return false;
  }
}

/**
 * Den Eintrag der Rückfrage wieder verbrauchen, wenn sie per Knopf zu ist und
 * er noch obenauf liegt. Verzögert: Löst die Antwort einen Ansichtswechsel aus,
 * legt die App dessen Verlaufseintrag an; ein `back()` davor risse ihn mit
 * (dann bleibt der Eintrag stehen, und ein Zurück mehr führt auf dieselbe Seite).
 */
export function ersteEbeneVerlassen(): void {
  if (ausstehendeRueckkehr !== null) clearTimeout(ausstehendeRueckkehr);
  ausstehendeRueckkehr = setTimeout(() => {
    ausstehendeRueckkehr = null;
    try {
      if (ebeneImVerlauf() === RUECKFRAGE_EBENE) eigenesZurueck();
    } catch {
      /* ohne Verlauf */
    }
  }, 80);
}

/**
 * Dieselbe Behandlung für alle Fenster der Startseite (Datensicherung, „Alle Daten löschen",
 * Impressum, Datenschutz, Beispielbögen …), nicht nur für Rückfragen: Auf dem ersten
 * Verlaufseintrag der App führte Zurück bei offenem Fenster aus der App heraus (Audit Runde 6,
 * R6-S3). Ein Beobachter legt für jedes geöffnete `<dialog>` den Eintrag an und verbraucht ihn
 * beim Schließen; die Zurück-Geste schließt das Fenster über `offenesFensterAbbrechen` (app.tsx).
 * Fenster, die ihren Rücksprung selbst führen (`data-zurueck="eigen"`) und Rückfragen, die schon
 * einen Eintrag tragen, bleiben unberührt.
 */
export function dialogVerlaufVerdrahten(): void {
  if (typeof document === "undefined" || typeof MutationObserver === "undefined") return;
  const beobachter = new MutationObserver((muster) => {
    for (const m of muster) {
      const d = m.target;
      if (!(d instanceof HTMLDialogElement) || d.dataset.zurueck === "eigen") continue;
      if (d.open && d.dataset.ebene !== "1") {
        if (ersteEbeneBetreten()) d.dataset.ebene = "1";
      } else if (!d.open && d.dataset.ebene === "1") {
        delete d.dataset.ebene;
        ersteEbeneVerlassen();
      }
    }
  });
  beobachter.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["open"] });
  // Schloss die Zurück-Geste nur das oberste von zwei Fenstern, braucht das darunter wieder einen Eintrag.
  window.addEventListener("popstate", () => {
    setTimeout(() => {
      if (document.querySelector("dialog[open][data-ebene='1']") && !ebeneImVerlauf()) {
        try {
          if ((history.state as { eebErste?: boolean } | null)?.eebErste) ebeneBetreten(RUECKFRAGE_EBENE);
        } catch {
          /* ohne Verlauf */
        }
      }
    }, 0);
  });
}

