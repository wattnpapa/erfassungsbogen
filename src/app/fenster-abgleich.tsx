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
 *
 * Runde 4 (R4-S4): „Meine Fassung behalten" klang wie die sichere Wahl,
 * verwarf aber den Stand des anderen Fensters ohne Rückholplatz. Jetzt kommt
 * der andere Stand auf den Rückholplatz, wie es „Neuen Bogen erstellen" im
 * anderen Fenster schon tat; ginge dabei etwas endgültig verloren, fragt das
 * Fenster vorher und nennt es. Die Warnung nennt den anderen Stand, und
 * „Stand aus dem anderen Fenster laden" kehrt in den Bogen zurück statt auf
 * die Startseite.
 */

import { useEffect, useRef, useState } from "react";
import type { Erfassungsbogen } from "@bos/eeb-format/model";
import {
  ENTWURF_SCHLUESSEL,
  entwurfAusAnderemFenster,
  entwurfFremdGeaendert,
  entwurfKonfliktAbonnieren,
  entwurfUeberschreibenErlauben,
  ersetztenEntwurfLaden,
  ersetztenEntwurfMerken,
  rueckholungNimmt,
  type Entwurf,
} from "./entwurf";
import { bogenHatInhalt, einheitAnzeigename } from "./hilfen";
import { frageJaNein } from "./dialoge";

/**
 * Merker in der Sitzung: Nach „Stand aus dem anderen Fenster laden" öffnet
 * die neu geladene App den Bogen direkt, statt auf der Startseite einen
 * zusätzlichen Tipp auf „Fortsetzen" zu verlangen (R4-S4).
 */
export const NACH_ABGLEICH_SCHLUESSEL = "eeb.abgleich.fortsetzen";

/** Einmal lesen und löschen: Kam diese Seite aus „Stand aus dem anderen Fenster laden"? */
export function nachAbgleichFortsetzen(): boolean {
  try {
    const da = sessionStorage.getItem(NACH_ABGLEICH_SCHLUESSEL) === "1";
    if (da) sessionStorage.removeItem(NACH_ABGLEICH_SCHLUESSEL);
    return da;
  } catch {
    return false;
  }
}

function gleich(a: Erfassungsbogen | null | undefined, b: Erfassungsbogen | null | undefined): boolean {
  return !!a && !!b && JSON.stringify(a) === JSON.stringify(b);
}

function zeitKurz(e: Entwurf): string {
  return new Date(e.gespeichert).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
}

const EINSAETZE_SCHLUESSEL = "eeb.einsaetze.v1";

export interface FensterAbgleich {
  /** Ein anderes Fenster hat den offenen Bogen geändert; hier wird nicht gespeichert. */
  konflikt: boolean;
  /** Zählt jede Entscheidung „behalten" hoch — gehört in die Abhängigkeiten des Autosave. */
  runde: number;
  /**
   * Eigene Fassung behalten: Der Stand des anderen Fensters kommt auf den
   * Rückholplatz, die eigene Fassung überschreibt beim nächsten Speichern.
   */
  behalten: () => Promise<void>;
  /** Stand aus dem anderen Fenster übernehmen: die App lädt neu und öffnet den gespeicherten Entwurf. */
  neuLaden: () => void;
}

export function useFensterAbgleich(
  bogenOffen: boolean,
  onEinsaetze: () => void,
  opt: {
    /** Der offene Bogen dieses Fensters — gleicht der andere Stand ihm, ist nichts zu retten. */
    eigenerBogen?: () => Erfassungsbogen | null;
    /** Der Rückholplatz hat sich geändert (Startseite neu lesen). */
    onRueckholung?: () => void;
  } = {},
): FensterAbgleich {
  const [konflikt, setKonflikt] = useState(false);
  const [runde, setRunde] = useState(0);
  const offen = useRef(bogenOffen);
  offen.current = bogenOffen;
  const einsaetze = useRef(onEinsaetze);
  einsaetze.current = onEinsaetze;
  const optRef = useRef(opt);
  optRef.current = opt;

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
    behalten: async () => {
      const anderes = entwurfAusAnderemFenster();
      const eigener = optRef.current.eigenerBogen?.() ?? null;
      if (anderes && bogenHatInhalt(anderes.bogen) && !gleich(anderes.bogen, eigener)) {
        const name = einheitAnzeigename(anderes.bogen.einheit);
        const alt = ersetztenEntwurfLaden();
        const nimmt = rueckholungNimmt(!!anderes.fremd, alt);
        // Was dort liegt und nicht ohnehin einer der beiden Stände ist, fiele weg.
        const altFaellt =
          nimmt && !!alt && bogenHatInhalt(alt.bogen) && !gleich(alt.bogen, anderes.bogen) && !gleich(alt.bogen, eigener);
        if (!nimmt || altFaellt) {
          const ja = await frageJaNein({
            titel: "Meine Fassung behalten?",
            text: !nimmt
              ? `Die Erfassung „${name}" aus dem anderen Fenster (Stand ${zeitKurz(anderes)} Uhr) geht dabei verloren — auf dem Rückholplatz liegt dein eigener Bogen „${einheitAnzeigename(alt!.bogen.einheit)}", und der bleibt.`
              : `„${name}" aus dem anderen Fenster (Stand ${zeitKurz(anderes)} Uhr) kommt auf den Rückholplatz. Der dort bisher liegende Bogen „${einheitAnzeigename(alt!.bogen.einheit)}" (Stand ${zeitKurz(alt!)} Uhr) wird dabei endgültig gelöscht.`,
            ok: "Meine Fassung behalten",
            gefahr: true,
          });
          if (!ja) return;
        }
        if (nimmt && !gleich(alt?.bogen, anderes.bogen)) ersetztenEntwurfMerken(anderes.bogen, anderes.fremd);
        optRef.current.onRueckholung?.();
      }
      entwurfUeberschreibenErlauben();
      setKonflikt(false);
      setRunde((r) => r + 1);
    },
    neuLaden: () => {
      try {
        sessionStorage.setItem(NACH_ABGLEICH_SCHLUESSEL, "1");
      } catch {
        /* ohne Sitzungsspeicher eben über die Startseite */
      }
      window.location.reload();
    },
  };
}

/** Sichtbare Warnung an Stelle der „automatisch gespeichert"-Zeile. */
export function FensterKonflikt({ abgleich }: { abgleich: FensterAbgleich }) {
  const anderes = entwurfAusAnderemFenster();
  return (
    <div className="autosave speicher-fehler fenster-konflikt" role="alert">
      <p>
        ⚠ Dieser Bogen wurde in einem anderen Fenster geändert
        {anderes ? ` (dort: „${einheitAnzeigename(anderes.bogen.einheit)}", Stand ${zeitKurz(anderes)} Uhr)` : ""}. Eingaben hier
        werden erst wieder gespeichert, wenn du entscheidest. „Meine Fassung behalten" legt den anderen Stand auf
        den Rückholplatz.
      </p>
      <div className="aktionen">
        <button type="button" onClick={abgleich.neuLaden}>Stand aus dem anderen Fenster laden</button>
        <button type="button" onClick={() => void abgleich.behalten()}>Meine Fassung behalten</button>
      </div>
    </div>
  );
}
