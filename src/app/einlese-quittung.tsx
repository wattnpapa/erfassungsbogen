/**
 * Rückmeldung von „Bögen einlesen…" (Dateien) in der Einsatzansicht, direkt
 * unter den Aufnahme-Knöpfen.
 *
 * Sie stand unter der ganzen Ansicht: Bei 360 × 640 lag „1 Bogen
 * aufgenommen." rund 2 100 px unter dem Bild, die Ansicht sprang nicht, und
 * wer eine falsche Datei gewählt hatte, sah nichts (Audit Runde 3, R3-L1).
 * Bei einem gemischten Stapel verdrängte die Fehlerzeile die Erfolgsmeldung
 * (R3-E4): Jetzt stehen beide untereinander. Die Quittung holt sich beim
 * Erscheinen selbst ins Bild und bleibt bis zum nächsten Einlesen oder bis
 * die Ansicht wechselt.
 */

import { useEffect, useRef } from "react";

export function EinleseQuittung({ fehler, meldung }: { fehler: string; meldung: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView?.({ block: "nearest" });
  }, [fehler, meldung]);
  if (!fehler && !meldung) return null;
  return (
    <div ref={ref} className="einlese-quittung" role={fehler ? "alert" : "status"}>
      {meldung && <p className="meldung">{meldung}</p>}
      {fehler && <p className="fehler">{fehler}</p>}
    </div>
  );
}
