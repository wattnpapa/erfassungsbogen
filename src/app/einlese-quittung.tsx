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

export interface QuittungsEinzelheit {
  titel: string;
  zeilen: string[];
}

export function EinleseQuittung({ fehler, meldung, einzelheiten = [] }: { fehler: string; meldung: string; einzelheiten?: QuittungsEinzelheit[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Nach dem Aufbau der Ansicht: Deren eigener Sprung an den Anfang läuft nach
    // den Effekten der Kinder und nahm der Quittung nach „Einsatz importieren…"
    // das Scrollen (R5-K3).
    const rahmen = requestAnimationFrame?.(() => ref.current?.scrollIntoView?.({ block: "nearest" }));
    ref.current?.scrollIntoView?.({ block: "nearest" });
    return () => {
      if (rahmen != null) cancelAnimationFrame?.(rahmen);
    };
  }, [fehler, meldung]);
  if (!fehler && !meldung) return null;
  return (
    <div ref={ref} className="einlese-quittung" role={fehler ? "alert" : "status"}>
      {meldung && <p className="meldung">{meldung}</p>}
      {/* Das Kleine eingeklappt: die Kurzfassung oben bleibt ohne Scrollen lesbar (R5-K3). */}
      {einzelheiten.map((e) => (
        <details className="einlese-einzelheit" key={e.titel}>
          <summary>{e.titel}</summary>
          <ul>
            {e.zeilen.map((z, i) => (
              <li key={i}>{z}</li>
            ))}
          </ul>
        </details>
      ))}
      {/* Mit Zeichen und Rahmen wie die Erfolgsmeldung daneben (R4-L4): als
          Fließtext im Alarmton war die Fehlerzeile unter Rot-Grün-Schwäche nur
          noch ein beiger Satz. Das Zeichen ist für Vorleser versteckt, der
          Wortlaut trägt die Aussage. */}
      {fehler && (
        <p className="fehler">
          <span aria-hidden="true">⚠ </span>
          {fehler}
        </p>
      )}
    </div>
  );
}
