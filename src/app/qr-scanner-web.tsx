/**
 * QR-Scanner für Browser und Desktop: Webcam per getUserMedia, Dekodierung
 * mit jsQR als Vollbild-Overlay. In der nativen App übernimmt stattdessen
 * der Capacitor-Scanner (siehe nativ.ts).
 */

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import type jsQRTyp from "jsqr";
import { gemerkteKamera, kameraListe, merkeKamera, type Kamera } from "./kamera";
import { TeilQuittung } from "./teil-quittung";
import type { SegmentTeil } from "../codec";

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

// USB-Handscanner melden sich als Tastatur („Keyboard-Wedge"): Sie tippen den
// QR-Inhalt als sehr schnelle Tastenfolge und schließen werkseitig mit Enter
// (manche mit Tab) ab. Menschliches Tippen hat deutlich größere Lücken —
// alles über dieser Pause verwirft den Puffer.
const HANDSCANNER_PAUSE_MS = 500;
// Unter dieser Länge ist es kein Bogen-Payload (kürzester Link ist weit
// länger) — versehentliche Tasten plus Enter lösen so keinen Scan aus.
const HANDSCANNER_MINDESTLAENGE = 8;

/**
 * Bildwunsch für den Scan. Ohne Angabe liefern Browser 640×480 — und damit
 * muss ein dichter Bogen-Code rund 60 % der Bildhöhe füllen, um gelesen zu
 * werden. So nah stellt keine Handy-Hauptkamera mehr scharf: Genau daran
 * scheiterte das Abfilmen eines Codes vom Notebook-Bildschirm, den die
 * Kamera-App desselben Telefons sofort liest.
 *
 * Der Überschuss gegenüber {@link DECODE_BREITE} ist nicht verschenkt: Beim
 * Verkleinern mittelt drawImage darüber und glättet so die Modulkanten, die
 * eine direkte Aufnahme in 1280 px hart abtasten würde.
 *
 * Alles hier ist Wunsch (`ideal`) und keine Bedingung: Ein Gerät, das die
 * Auflösung nicht kann, liefert weiter sein Bestes, statt die Anfrage
 * abzulehnen. Der Fokuswunsch steht in `advanced`, weil ein dort unbekannter
 * Eintrag stillschweigend übergangen wird — auf oberster Ebene würde er die
 * Anfrage auf Geräten ohne steuerbaren Fokus sprengen.
 */
const BILD_WUNSCH: MediaTrackConstraints = {
  width: { ideal: 1920 },
  height: { ideal: 1080 },
  advanced: [{ focusMode: "continuous" } as MediaTrackConstraintSet],
};

/**
 * Kamera anfordern. Eine gewählte Kamera geht vor, die Rückkamera ist Wunsch,
 * nicht Bedingung — jede Stufe darf scheitern, ohne den Scan zu beenden: Die
 * gemerkte Kamera kann abgemeldet sein, Geräte ohne Rückkamera kennen
 * `facingMode` nicht, und manche Webviews weisen die Objekt-Form ganz zurück.
 */
async function kameraOeffnen(wunschId: string): Promise<MediaStream> {
  if (wunschId) {
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { ...BILD_WUNSCH, deviceId: { exact: wunschId } },
        audio: false,
      });
    } catch (err) {
      if (istVerweigert(err)) throw err;
    }
  }
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { ...BILD_WUNSCH, facingMode: "environment" },
      audio: false,
    });
  } catch (err) {
    if (istVerweigert(err)) throw err;
    return await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  }
}

/**
 * Breite, auf die die Suchschleife das Kamerabild zum Dekodieren verkleinert.
 * Sie entscheidet über die Reichweite: Am dichtesten Bogen-Code (Version 25,
 * 117 Module) gemessen, wie klein er im Bild stehen darf, damit jsQR ihn noch
 * liest — bei 640 px muss er rund 60 % der Bildhöhe füllen, bei 1280 px reichen
 * 30 %. Halb so groß im Bild heißt doppelt so weit weg, und genau daran hing
 * der Fehlschlag: So nah, wie 640 px es verlangten, stellt keine
 * Handy-Hauptkamera mehr scharf.
 *
 * Nach oben ist 1280 die Grenze des Nützlichen — 1920 kostete in derselben
 * Messung ein Fünftel mehr Rechenzeit je Bild, ohne mehr Codes zu lesen.
 */
const DECODE_BREITE = 1280;
// Nach dieser Zeit ohne Treffer bekommt der Nutzer den Rat, den sonst nur
// kennt, wer die Naheinstellgrenze von Handykameras kennt.
const TIPP_NACH_MS = 6000;

export function QrScannerWeb(props: {
  onErgebnis: (text: string) => void;
  onAbbruch: () => void;
  /** Fortschritt bei Segmentierung, z. B. „Teil 1 von 2 gescannt". */
  fortschritt?: string;
  /**
   * Sammelstand eines mehrteiligen Bogens — wird als Kästchenzeile unter dem
   * Hinweis gezeigt, damit beim Abfilmen sichtbar ist, welcher Teil noch fehlt.
   */
  teile?: SegmentTeil[];
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
  // Zeichen, die der Handscanner gerade tippt. Nur als Lebenszeichen gedacht:
  // Ohne Kamerabild sieht man sonst nicht, ob der Scanner überhaupt am Rechner
  // ankommt — ein stummer Bildschirm wirkt wie ein kaputter Scanner.
  const [scannerZeichen, setScannerZeichen] = useState(0);
  // Rat zum Abstand, sobald die Kamera eine Weile läuft, ohne etwas zu finden.
  const [tipp, setTipp] = useState(false);

  useEffect(() => {
    let aktiv = true;
    let stream: MediaStream | null = null;
    let rahmen = 0;
    let tippUhr: ReturnType<typeof setTimeout> | undefined;
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
      clearTimeout(tippUhr);
      stream?.getTracks().forEach((t) => t.stop());
    }

    function suchen() {
      if (!aktiv) return;
      const video = videoRef.current;
      if (video && ctx && jsQR && video.readyState >= video.HAVE_ENOUGH_DATA && video.videoWidth) {
        // Verkleinert dekodieren, aber nicht weiter als nötig — siehe
        // DECODE_BREITE: unter 1280 px verliert der Scanner Reichweite.
        const faktor = Math.min(1, DECODE_BREITE / video.videoWidth);
        leinwand.width = Math.round(video.videoWidth * faktor);
        leinwand.height = Math.round(video.videoHeight * faktor);
        ctx.drawImage(video, 0, 0, leinwand.width, leinwand.height);
        const bild = ctx.getImageData(0, 0, leinwand.width, leinwand.height);
        const text = jsQR(bild.data, bild.width, bild.height, { inversionAttempts: "dontInvert" })?.data ?? "";
        // Nur einen NEUEN Code melden. Der Scanner läuft weiter (Segmentierung:
        // mehrere Teile); den Overlay schließt der Aufrufer, wenn er fertig ist.
        if (text && text !== letzterText.current) {
          letzterText.current = text;
          // Was einmal gelesen wurde, braucht keinen Rat mehr zum Abstand.
          clearTimeout(tippUhr);
          setTipp(false);
          propsRef.current.onErgebnis(text);
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
      setTipp(false);
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
      tippUhr = setTimeout(() => { if (aktiv) setTipp(true); }, TIPP_NACH_MS);
      suchen();
    })();

    return stoppen;
  }, [versuch, wunschKamera]);

  // Tastatur-Lauscher für USB-Handscanner: dicht aufeinanderfolgende Zeichen
  // sammeln und beim Enter/Tab-Abschluss als Scan melden. Läuft unabhängig
  // von der Kamera — gerade an PCs ohne (freigegebene) Webcam ist der
  // Handscanner der einzige Weg. Capture-Phase, damit ein fokussierter Knopf
  // das abschließende Enter nicht als Klick schluckt.
  useEffect(() => {
    let puffer = "";
    let zuletzt = 0;
    function beiTaste(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return; // Kurzbefehle unangetastet lassen
      const jetzt = performance.now();
      if (jetzt - zuletzt > HANDSCANNER_PAUSE_MS) puffer = "";
      zuletzt = jetzt;
      setScannerZeichen(puffer.length);
      // Leertaste ausgenommen: Sie bedient fokussierte Knöpfe, und kein
      // Payload-Zeichensatz (URL, Base41, Base64url) enthält Leerzeichen.
      if (e.key.length === 1 && e.key !== " ") {
        puffer += e.key;
        setScannerZeichen(puffer.length);
        // Sonst springt z. B. die Kamera-Auswahl bei Buchstaben mit.
        e.preventDefault();
        return;
      }
      if ((e.key === "Enter" || e.key === "Tab") && puffer.length >= HANDSCANNER_MINDESTLAENGE) {
        e.preventDefault();
        const text = puffer;
        puffer = "";
        setScannerZeichen(0);
        propsRef.current.onErgebnis(text);
      }
    }
    window.addEventListener("keydown", beiTaste, true);
    return () => window.removeEventListener("keydown", beiTaste, true);
  }, []);

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
          </div>
        )
        : (
          <div className="scanner-text">
            {/* role="status": der Fortschritt wechselt mit jedem gelesenen Teil
                — ohne Ansage wüsste ein Screenreader im Overlay nichts davon. */}
            <p role="status">{props.fortschritt || "QR-Code des Erfassungsbogens vor die Kamera halten"}</p>
            {/* Der Rat, den sonst nur kennt, wer die Naheinstellgrenze von
                Handykameras kennt: Zu nah ist der häufigste Grund, warum ein
                Code unlesbar bleibt, den dieselbe Kamera in der Kamera-App
                sofort liest — die schaltet dafür von selbst aufs Ultraweit-
                winkel um, eine Webseite darf das nicht. */}
            {tipp && (
              <p role="status" className="scanner-tipp">
                Noch nichts erkannt? Etwa 20–30 cm Abstand halten — näher stellt die Hauptkamera nicht scharf.
                {kameras.length > 1 && " Für nahe Codes unten auf „Ultraweitwinkel“ umschalten."}
                {" "}Steht der Code auf einem Bildschirm, hilft es, ihn dort größer zu ziehen.
              </p>
            )}
            <TeilQuittung teile={props.teile ?? []} />
          </div>
        )}
      {!fehler
        ? <div className="scanner-rahmen" aria-hidden="true" />
        : (
          /* Der zweite Weg ist ohne Kamera der einzige — er bekommt deshalb
             die Mitte des Bildschirms, dort wo sonst der Suchrahmen steht,
             statt als Nachsatz unter der Fehlermeldung zu stehen. */
          <div className="scanner-handscanner">
            <p className="handscanner-titel">Ohne Kamera: mit dem USB-Handscanner scannen</p>
            <ol className="scanner-schritte">
              <li>QR-Code des Erfassungsbogens auf Papier oder Bildschirm anvisieren.</li>
              <li>Am Handscanner auslösen — dieses Fenster nimmt den Code sofort an, ohne Klick in ein Feld.</li>
            </ol>
            {/* role="status": Ohne Kamerabild ist diese Zeile die einzige
                Rückmeldung — erst dass der Scanner ankommt, dann bei einem
                mehrteiligen Bogen, welcher Teil noch fehlt. Ohne sie wirkt ein
                angenommener Teil 1 von 4 wie ein verschluckter Scan. */}
            <p role="status" className={`handscanner-lampe${scannerZeichen ? " aktiv" : ""}`}>
              {scannerZeichen
                ? `Handscanner erkannt — ${scannerZeichen} Zeichen …`
                : props.fortschritt || "Bereit — warte auf den Handscanner"}
            </p>
            <TeilQuittung teile={props.teile ?? []} />
            <p className="handscanner-fussnote">
              Der Scanner muss den Code mit Enter abschließen (Werkseinstellung der meisten Geräte).
              {" "}Kommen die Zeichen verdreht an, steht er auf einer anderen Tastaturbelegung — die Anleitung
              zeigt unter „USB-Handscanner einrichten“ die Codes zum Umstellen.
              {props.onBild && " Sonst hilft „QR aus Bild einlesen…“ mit einem Foto oder Screenshot."}
            </p>
          </div>
        )}
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
