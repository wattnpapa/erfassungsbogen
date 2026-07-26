/**
 * Schritt 2 — Einsatz: Zeitraum, Ort/Auftrag sowie Beginn und Ende.
 */

import {
  Einsatz,
  datumAusIso,
  datumZuIso,
  zeitpunktAusIso,
  zeitpunktZuIso,
} from "../../model";
import { Feld, type SchrittProps } from "./bausteine";

export function SchrittEinsatz({ bogen, aendern }: SchrittProps) {
  const ez = bogen.einsatz;
  const setEz = (p: Partial<Einsatz>) => aendern({ einsatz: { ...ez, ...p } });
  const jetztLokal = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };
  return (
    <section className="karte">
      <h2>2. Einsatz</h2>
      <div className="zeile">
        <Feld titel="Zeitraum von" schmal>
          <input type="date" value={datumZuIso(ez.zeitraumVon)} onChange={(e) => setEz({ zeitraumVon: datumAusIso(e.target.value) })} />
        </Feld>
        <Feld titel="Zeitraum bis" schmal>
          <input type="date" value={datumZuIso(ez.zeitraumBis)} onChange={(e) => setEz({ zeitraumBis: datumAusIso(e.target.value) })} />
        </Feld>
        <Feld titel="Einsatzort / Auftrag">
          <input value={ez.ortAuftrag} onChange={(e) => setEz({ ortAuftrag: e.target.value })} placeholder="z. B. Fernmeldebauübung Kabelblitz" />
        </Feld>
      </div>
      <div className="zeile">
        <label className="inline">
          <input
            type="checkbox"
            checked={ez.einsatzbeginn != null}
            onChange={(e) => setEz({ einsatzbeginn: e.target.checked ? zeitpunktAusIso(jetztLokal()) : undefined })}
          />
          Einsatzbeginn
        </label>
        {ez.einsatzbeginn != null && (
          <input type="datetime-local" value={zeitpunktZuIso(ez.einsatzbeginn)} onChange={(e) => setEz({ einsatzbeginn: zeitpunktAusIso(e.target.value) })} />
        )}
        <label className="inline">
          <input
            type="checkbox"
            checked={ez.einsatzende != null}
            onChange={(e) => setEz({ einsatzende: e.target.checked ? zeitpunktAusIso(jetztLokal()) : undefined })}
          />
          Einsatzende
        </label>
        {ez.einsatzende != null && (
          <input type="datetime-local" value={zeitpunktZuIso(ez.einsatzende)} onChange={(e) => setEz({ einsatzende: zeitpunktAusIso(e.target.value) })} />
        )}
      </div>
    </section>
  );
}
