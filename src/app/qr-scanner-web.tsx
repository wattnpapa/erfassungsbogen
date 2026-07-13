/**
 * QR-Scanner für Browser und Desktop: Webcam per getUserMedia, Dekodierung
 * mit jsQR als Vollbild-Overlay. In der nativen App übernimmt stattdessen
 * der Capacitor-Scanner (siehe nativ.ts).
 */

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

export function QrScannerWeb(props: {
  onErgebnis: (text: string) => void;
  onAbbruch: () => void;
  /** Fortschritt bei Segmentierung, z. B. „Teil 1 von 2 gescannt". */
  fortschritt?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // Callbacks über eine Ref ansprechen, damit der Kamera-Effekt nur einmal
  // läuft und neue Prop-Identitäten den Stream nicht neu starten.
  const propsRef = useRef(props);
  propsRef.current = props;
  // Zuletzt gemeldeter Code: verhindert, dass derselbe (weiter im Bild
  // liegende) QR-Code 60×/s gemeldet wird — bei Segmentierung soll erst ein
  // NEUER Teil auslösen, der Scanner läuft dafür durchgehend weiter.
  const letzterText = useRef("");
  const [fehler, setFehler] = useState("");

  useEffect(() => {
    let aktiv = true;
    let stream: MediaStream | null = null;
    let rahmen = 0;
    const leinwand = document.createElement("canvas");
    const ctx = leinwand.getContext("2d", { willReadFrequently: true });

    function stoppen() {
      aktiv = false;
      cancelAnimationFrame(rahmen);
      stream?.getTracks().forEach((t) => t.stop());
    }

    function suchen() {
      if (!aktiv) return;
      const video = videoRef.current;
      if (video && ctx && video.readyState >= video.HAVE_ENOUGH_DATA && video.videoWidth) {
        // Verkleinert dekodieren: deutlich schneller und für QR ausreichend.
        const faktor = Math.min(1, 640 / video.videoWidth);
        leinwand.width = Math.round(video.videoWidth * faktor);
        leinwand.height = Math.round(video.videoHeight * faktor);
        ctx.drawImage(video, 0, 0, leinwand.width, leinwand.height);
        const bild = ctx.getImageData(0, 0, leinwand.width, leinwand.height);
        const code = jsQR(bild.data, bild.width, bild.height, { inversionAttempts: "dontInvert" });
        // Nur einen NEUEN Code melden. Der Scanner läuft weiter (Segmentierung:
        // mehrere Teile); den Overlay schließt der Aufrufer, wenn er fertig ist.
        if (code?.data && code.data !== letzterText.current) {
          letzterText.current = code.data;
          propsRef.current.onErgebnis(code.data);
        }
      }
      rahmen = requestAnimationFrame(suchen);
    }

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
      } catch {
        if (aktiv) setFehler("Keine Kamera verfügbar oder Zugriff verweigert. Alternativ den Bogen aus einer Datei laden.");
        return;
      }
      if (!aktiv) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play().catch(() => {});
      suchen();
    })();

    return stoppen;
  }, []);

  return (
    <div className="scanner" role="dialog" aria-label="QR-Code scannen">
      <video ref={videoRef} playsInline muted />
      {fehler
        ? <p className="scanner-text fehler">{fehler}</p>
        : <p className="scanner-text">{props.fortschritt || "QR-Code des Erfassungsbogens vor die Kamera halten"}</p>}
      {!fehler && <div className="scanner-rahmen" aria-hidden="true" />}
      <button onClick={props.onAbbruch}>Abbrechen</button>
    </div>
  );
}
