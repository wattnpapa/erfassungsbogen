/**
 * Fortschritt und Bericht von „Bögen einlesen…" (Bilderstapel) in der
 * Einsatzansicht.
 *
 * Beides stand unter der Einheitenliste: Bei 360 × 640 lag „Stapel
 * eingelesen" rund 1 200 px unter dem Bild, am Tablet an der Unterkante —
 * wer ein Foto einlas und „0 Bögen aufgenommen" bekam, sah davon nichts
 * (Audit Runde 2, R2-A2). Die Quittung holt sich deshalb selbst ins Bild,
 * sobald sie erscheint, und nimmt den Fokus (Vorlesesoftware, Tastatur).
 */

import { useEffect, useRef } from "react";
import type { TeileMerker } from "./qr-stapel";

export function StapelQuittung(props: {
  /** „3 von 12 Bildern gelesen…" — leer, solange kein Stapel läuft. */
  stand: string;
  onAbbrechen: () => void;
  bericht: string[];
  onSchliessen: () => void;
  /** Teile unvollständiger Bögen, die für den nächsten Durchgang bereitliegen. */
  merker?: TeileMerker;
}) {
  const standRef = useRef<HTMLParagraphElement>(null);
  const berichtRef = useRef<HTMLElement>(null);
  const laeuft = props.stand !== "";
  const hatBericht = props.bericht.length > 0;

  // Nur beim Erscheinen: jede Fortschrittszeile erneut ins Bild zu holen,
  // risse dem Helfer die Seite unter dem Finger weg.
  useEffect(() => {
    if (laeuft) standRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [laeuft]);
  useEffect(() => {
    if (!hatBericht) return;
    const el = berichtRef.current;
    el?.scrollIntoView?.({ block: "nearest" });
    el?.focus({ preventScroll: true });
  }, [hatBericht, props.bericht]);

  const gemerkt = props.merker?.anzahl() ?? 0;

  return (
    <>
      {/* Stapel läuft: Fortschritt und Abbruch. Dreißig Handyfotos dauern
          spürbar — ohne Stand wirkt die App hängengeblieben, ohne Abbruch ist
          ein versehentlich gewählter Bilderordner nicht mehr zu stoppen. */}
      {laeuft && (
        <p className="meldung" role="status" style={{ textAlign: "center" }} ref={standRef}>
          {props.stand}{" "}
          <button type="button" onClick={props.onAbbrechen}>Abbrechen</button>
        </p>
      )}
      {/* Der Bericht bleibt stehen, bis er geschlossen wird: was NICHT
          ankam (Bild ohne Code, fehlendes Teil eines mehrteiligen Bogens),
          muss man abarbeiten können — eine verschwindende Meldung reicht
          dafür nicht. */}
      {hatBericht && (
        <section className="karte" ref={berichtRef} tabIndex={-1} aria-labelledby="stapel-quittung-titel">
          <h2 id="stapel-quittung-titel">Stapel eingelesen</h2>
          <ul>
            {props.bericht.map((zeile) => (
              <li key={zeile}>{zeile}</li>
            ))}
          </ul>
          <button type="button" onClick={props.onSchliessen}>Schließen</button>
          {/* Gemerkte Teile verfallen von selbst (qr-stapel.ts); wer weiß,
              dass das fehlende Blatt nicht mehr kommt, wirft sie gleich weg. */}
          {gemerkt > 0 && props.merker && (
            <>
              {" "}
              <button
                type="button"
                onClick={() => {
                  props.merker?.verwerfen();
                  props.onSchliessen();
                }}
              >
                Gemerkte Teile verwerfen
              </button>
            </>
          )}
        </section>
      )}
    </>
  );
}
