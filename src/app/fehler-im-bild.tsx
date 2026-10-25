/**
 * Fehlerzeile, die sich selbst ins Bild holt.
 *
 * Auf der Startseite steht die Rückmeldung oben im Einleitungsbereich, die
 * Knöpfe dafür („Aus Datei laden…", „Einsatz importieren…") aber weit unten:
 * Bei 360 × 640 ragten nach einem Fehlschlag nur 7 px Rot an den oberen
 * Bildrand, und angesagt wurde nichts. Wer das nicht sieht, hält den Vorgang
 * für nicht erfolgt und versucht es wieder (Audit Runde 2, R2-L2).
 *
 * Darum: `role="alert"` für die Ansage, und steht die Zeile nicht vollständig
 * im Bild, rollt die Ansicht zu ihr — mittig, damit sie nicht unter dem
 * Seitenkopf verschwindet.
 */

import { useEffect, useRef } from "react";

export function FehlerImBild({ text }: { text: string }) {
  const zeile = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const el = zeile.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const hoehe = window.innerHeight || document.documentElement.clientHeight;
    if (r.top < 0 || r.bottom > hoehe) el.scrollIntoView?.({ block: "center" });
  }, [text]);
  return (
    <p ref={zeile} className="fehler" role="alert">
      {text}
    </p>
  );
}
