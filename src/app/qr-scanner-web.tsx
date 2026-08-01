/**
 * QR-Scanner für Browser und Desktop: Webcam per getUserMedia, Dekodierung
 * mit jsQR als Vollbild-Overlay. In der nativen App übernimmt stattdessen
 * der Capacitor-Scanner (siehe nativ.ts).
 */

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import type jsQRTyp from "jsqr";
import { gemerkteKamera, kameraListe, merkeKamera, type Kamera } from "./kamera";

/** Was schiefging (ein Satz) und was dagegen hilft (kurze Schritte). */
type KameraFehler = { text: string; schritte?: string[] };

/**
 * Kamerastart-Fehler in einen Rat übersetzen, der zur Ursache passt.
 *
 * Wichtig für Feldmeldungen wie „der Browser fragt gar nicht erst": Steht die
 * Kamera einmal auf „blockiert" — im Browser für die Seite ODER im Betriebs-
 * system für die Browser-App —, kommt getUserMedia ohne jede Nachfrage als
 * NotAllowedError zurück. Beide Stellen gehören deshalb in den Hinweis.
 */
function kameraRat(err: unknown): KameraFehler {
  const name = err instanceof Error ? err.name : "";
  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
      return {
        text: "Die Kamera ist für diese Seite blockiert — deshalb fragt der Browser gar nicht erst nach. Zwei Stellen prüfen:",
        schritte: [
          "Im Browser: Schloss- oder Info-Symbol in der Adresszeile → Berechtigungen → Kamera zulassen.",
          "Im Gerät: Einstellungen → Apps → dieser Browser → Berechtigungen → Kamera erlauben.",
        ],
      };
    case "NotFoundError":
    case "OverconstrainedError":
      return { text: "Dieses Gerät meldet keine nutzbare Kamera." };
    case "NotReadableError":
    case "AbortError":
      return {
        text: "Die Kamera lässt sich nicht öffnen — meist hält sie gerade eine andere App belegt. "
          + "Andere Kamera-Apps schließen und erneut versuchen.",
      };
    default:
      return { text: `Die Kamera lässt sich nicht starten${name ? ` (${name})` : ""}.` };
  }
}

/** Verweigert bleibt verweigert — hier lohnt kein zweiter Anlauf. */
function istVerweigert(err: unknown): boolean {
  return err instanceof Error && (err.name === "NotAllowedError" || err.name === "SecurityError");
}

/**
 * Kamera anfordern. Eine gewählte Kamera geht vor, die Rückkamera ist Wunsch,
 * nicht Bedingung — jede Stufe darf scheitern, ohne den Scan zu beenden: Die
 * gemerkte Kamera kann abgemeldet sein, Geräte ohne Rückkamera kennen
 * `facingMode` nicht, und manche Webviews weisen die Objekt-Form ganz zurück.
 */
async function kameraOeffnen(wunschId: string): Promise<MediaStream> {
  if (wunschId) {
    try {
      return await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: wunschId } }, audio: false });
    } catch (err) {
      if (istVerweigert(err)) throw err;
    }
  }
  try {
    return await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
  } catch (err) {
    if (istVerweigert(err)) throw err;
    return await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  }
}

export function QrScannerWeb(props: {
  onErgebnis: (text: string) => void;
  onAbbruch: () => void;
  /** Fortschritt bei Segmentierung, z. B. „Teil 1 von 2 gescannt". */
  fortschritt?: string;
  /**
   * Beschriftung des Schließen-Knopfes. Standard „Abbrechen" — beim
   * Kiosk-Scan (Meldekopf) sind die Bögen aber schon aufgenommen, dort
   * beendet der Knopf den Durchgang, statt etwas zurückzunehmen.
   */
  abbruchText?: string;
  /** Ausweg, wenn das Abfilmen nicht klappt: QR aus einem Foto/Screenshot lesen. */
  onBild?: (e: ChangeEvent<HTMLInputElement>) => void;
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
  const [fehler, setFehler] = useState<KameraFehler | null>(null);
  // Hochzählen startet den Kamera-Effekt neu — nötig, weil eine im Browser
  // oder im Betriebssystem nachträglich erteilte Freigabe erst beim nächsten
  // getUserMedia greift.
  const [versuch, setVersuch] = useState(0);
  const [kameras, setKameras] = useState<Kamera[]>([]);
  // Wunsch (gemerkte/gewählte Kamera) und tatsächlich laufende Kamera sind
  // getrennt: Der Wunsch startet den Effekt neu, die laufende meldet nur, was
  // daraus geworden ist — sonst würde die Rückmeldung den Stream erneut starten.
  const [wunschKamera, setWunschKamera] = useState(gemerkteKamera);
  const [benutzteKamera, setBenutzteKamera] = useState("");

  useEffect(() => {
    let aktiv = true;
    let stream: MediaStream | null = null;
    let rahmen = 0;
    // jsQR (~130 KB) lädt erst mit dem Overlay, nicht mit dem Start-Bundle.
    // Bis dahin läuft die Scanschleife leer — das Kamerabild steht ohnehin
    // erst nach der getUserMedia-Freigabe.
    let jsQR: typeof jsQRTyp | null = null;
    void import("jsqr").then((m) => { jsQR = m.default; });
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
      if (video && ctx && jsQR && video.readyState >= video.HAVE_ENOUGH_DATA && video.videoWidth) {
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
      // Fehlt die Schnittstelle ganz, gibt es keinen Fehler zum Auswerten:
      // typisch für unsichere Verbindungen (http) und für Browser, die die
      // Kamera-API gesperrt haben.
      if (!navigator.mediaDevices?.getUserMedia) {
        if (aktiv) {
          setFehler({
            text: window.isSecureContext === false
              ? "Ohne gesicherte Verbindung (https) geben Browser die Kamera nicht frei. Die App über ihre https-Adresse öffnen."
              : "Dieser Browser gibt die Kamera für Webseiten nicht frei. In Privacy- und Blocker-Browsern lässt sich das in deren Einstellungen erlauben; sonst hilft ein anderer Browser.",
          });
        }
        return;
      }
      try {
        stream = await kameraOeffnen(wunschKamera);
      } catch (err) {
        if (aktiv) setFehler(kameraRat(err));
        return;
      }
      if (!aktiv) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      setFehler(null);
      setBenutzteKamera(stream.getVideoTracks()[0]?.getSettings().deviceId ?? "");
      // Geräteliste erst NACH der Freigabe holen: vorher liefert der Browser
      // aus Datenschutzgründen keine Namen (und teils gar keine Geräte). Sie
      // ist reiner Komfort — fehlt die Schnittstelle oder scheitert sie,
      // scannt die geöffnete Kamera unverändert weiter.
      Promise.resolve(navigator.mediaDevices.enumerateDevices?.() ?? [])
        .then((geraete) => {
          if (aktiv) setKameras(kameraListe(geraete));
        })
        .catch(() => {});
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play().catch(() => {});
      suchen();
    })();

    return stoppen;
  }, [versuch, wunschKamera]);

  // Wert der Auswahl: die laufende Kamera, solange sie in der Liste steht —
  // sonst der Wunsch bzw. die erste Kamera, damit die Auswahl nie leer wirkt.
  const auswahl = [benutzteKamera, wunschKamera].find((id) => kameras.some((k) => k.id === id))
    ?? kameras[0]?.id
    ?? "";

  return (
    <div className="scanner" role="dialog" aria-label="QR-Code scannen">
      <video ref={videoRef} playsInline muted />
      {fehler
        ? (
          <div className="scanner-text fehler">
            <p>{fehler.text}</p>
            {fehler.schritte && (
              <ul className="scanner-schritte">
                {fehler.schritte.map((schritt) => <li key={schritt}>{schritt}</li>)}
              </ul>
            )}
            {props.onBild && <p>Ohne Kamera geht es weiter über ein Foto oder einen Screenshot des QR-Codes.</p>}
          </div>
        )
        : <p className="scanner-text">{props.fortschritt || "QR-Code des Erfassungsbogens vor die Kamera halten"}</p>}
      {!fehler && <div className="scanner-rahmen" aria-hidden="true" />}
      <div className="scanner-aktionen">
        {kameras.length > 1 && !fehler && (
          <label className="scanner-kamera">
            <span className="nur-sr">Kamera</span>
            <select
              value={auswahl}
              onChange={(e) => { merkeKamera(e.target.value); setWunschKamera(e.target.value); }}
            >
              {kameras.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
            </select>
          </label>
        )}
        {fehler && (
          <button type="button" onClick={() => { setFehler(null); setVersuch((n) => n + 1); }}>
            Kamera erneut versuchen
          </button>
        )}
        {props.onBild && (
          <label className="datei-knopf">
            QR aus Bild einlesen…
            <input type="file" accept="image/*" onChange={props.onBild} className="nur-sr" />
          </label>
        )}
        <button type="button" onClick={props.onAbbruch}>{props.abbruchText ?? "Abbrechen"}</button>
      </div>
    </div>
  );
}
