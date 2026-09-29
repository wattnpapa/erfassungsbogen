/**
 * Abgleich zwischen zwei Fenstern derselben App (Audit Runde 2, R2-O4).
 *
 * Auf Telefonen geht ein geteilter Link oft im Browser auf, während die App
 * schon offen ist. Bisher überschrieben sich die Fenster still: Beide meldeten
 * „gespeichert", im Speicher stand, wer zuletzt tippte. Und eine offene
 * Sammlungsansicht zeigte eine zu kleine Stärke, bis dort jemand etwas tat.
 *
 * Das `storage`-Ereignis meldet Änderungen aus anderen Fenstern desselben
 * Ursprungs:
 * - Einsatz-Sammlungen: sofort neu einlesen — die Sammlung schreibt je
 *   Handlung frisch aus dem Speicher, dort geht nichts verloren; es fehlte nur
 *   die Anzeige.
 * - Entwurf: Ist hier ein Bogen offen und steht im Speicher ein anderer Stand
 *   als der, den dieses Fenster zuletzt schrieb, speichert dieses Fenster nicht
 *   mehr (entwurf.ts) und fragt: Stand aus dem anderen Fenster laden oder die
 *   eigene Fassung behalten.
 */

import { useEffect, useRef, useState } from "react";
import { ENTWURF_SCHLUESSEL, entwurfFremdGeaendert, entwurfKonfliktAbonnieren, entwurfUeberschreibenErlauben } from "./entwurf";

const EINSAETZE_SCHLUESSEL = "eeb.einsaetze.v1";

export interface FensterAbgleich {
  /** Ein anderes Fenster hat den offenen Bogen geändert; hier wird nicht gespeichert. */
  konflikt: boolean;
  /** Zählt jede Entscheidung „behalten" hoch — gehört in die Abhängigkeiten des Autosave. */
  runde: number;
  /** Eigene Fassung behalten: überschreibt beim nächsten Speichern den anderen Stand. */
  behalten: () => void;
  /** Stand aus dem anderen Fenster übernehmen: die App lädt neu und öffnet den gespeicherten Entwurf. */
  neuLaden: () => void;
}

export function useFensterAbgleich(bogenOffen: boolean, onEinsaetze: () => void): FensterAbgleich {
  const [konflikt, setKonflikt] = useState(false);
  const [runde, setRunde] = useState(0);
  const offen = useRef(bogenOffen);
  offen.current = bogenOffen;
  const einsaetze = useRef(onEinsaetze);
  einsaetze.current = onEinsaetze;

  useEffect(() => {
    const abmelden = entwurfKonfliktAbonnieren(() => setKonflikt(true));
    function beiSpeicher(e: StorageEvent) {
      // key === null: das andere Fenster hat den ganzen Speicher geleert.
      if (e.key === null || e.key === EINSAETZE_SCHLUESSEL) einsaetze.current();
      if ((e.key === null || e.key === ENTWURF_SCHLUESSEL) && offen.current && entwurfFremdGeaendert()) {
        setKonflikt(true);
      }
    }
    window.addEventListener("storage", beiSpeicher);
    return () => {
      abmelden();
      window.removeEventListener("storage", beiSpeicher);
    };
  }, []);

  // Ohne offenen Bogen gibt es nichts zu entscheiden.
  useEffect(() => {
    if (!bogenOffen) setKonflikt(false);
  }, [bogenOffen]);

  return {
    konflikt: konflikt && bogenOffen,
    runde,
    behalten: () => {
      entwurfUeberschreibenErlauben();
      setKonflikt(false);
      setRunde((r) => r + 1);
    },
    neuLaden: () => window.location.reload(),
  };
}

/** Sichtbare Warnung an Stelle der „automatisch gespeichert"-Zeile. */
export function FensterKonflikt({ abgleich }: { abgleich: FensterAbgleich }) {
  return (
    <div className="autosave speicher-fehler fenster-konflikt" role="alert">
      <p>
        ⚠ Dieser Bogen wurde in einem anderen Fenster geändert. Eingaben hier werden erst
        wieder gespeichert, wenn du entscheidest.
      </p>
      <div className="aktionen">
        <button type="button" onClick={abgleich.neuLaden}>Stand aus dem anderen Fenster laden</button>
        <button type="button" onClick={abgleich.behalten}>Meine Fassung behalten</button>
      </div>
    </div>
  );
}
