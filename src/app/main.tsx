/**
 * SPA-Einstieg: Startbildschirm (neu / Datei laden), Assistent, Übersicht.
 */

import { StrictMode, useState, type ChangeEvent } from "react";
import { createRoot } from "react-dom/client";
import type { Erfassungsbogen } from "../model";
import { decodePayloadUrl } from "../codec";
import { bogenLaden, browserKompressor, neuerBogen } from "./hilfen";
import { istNativ, plattform, qrScannen } from "./nativ";
import { QrScannerWeb } from "./qr-scanner-web";
import { Fusszeile } from "./fusszeile";
import { UpdateBanner } from "./aktualisierung";
import {
  SchrittEinheit,
  SchrittEinsatz,
  SchrittFahrzeuge,
  SchrittPersonal,
  SchrittSofortbedarf,
  Uebersicht,
} from "./schritte";

const SCHRITTE = ["Einheit", "Einsatz", "Personal", "Fahrzeuge", "Sofortbedarf", "Übersicht"];
const UEBERSICHT = SCHRITTE.length - 1;

/**
 * Bogen aus dem URL-Fragment übernehmen (QR-Code mit App-URL bzw. Universal
 * Link öffnet die Web-App als https://erfassungsbogen.app/#<Payload>).
 * Läuft einmalig beim Laden; das Fragment wird danach aus der Adresszeile
 * entfernt, damit die Daten nicht in Verlauf/Lesezeichen hängen bleiben.
 */
function bogenAusUrlFragment(): { bogen: Erfassungsbogen | null; fehler: string } {
  const fragment = window.location.hash.slice(1);
  if (!fragment) return { bogen: null, fehler: "" };
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  try {
    return { bogen: decodePayloadUrl(fragment, browserKompressor), fehler: "" };
  } catch {
    return { bogen: null, fehler: "Der geöffnete Link enthält keinen gültigen Erfassungsbogen." };
  }
}

const START = bogenAusUrlFragment();

function App() {
  const [bogen, setBogen] = useState<Erfassungsbogen | null>(START.bogen);
  const [schritt, setSchritt] = useState(START.bogen ? UEBERSICHT : 0);
  const [fehler, setFehler] = useState(START.fehler);
  const [scannerOffen, setScannerOffen] = useState(false);
  // Zeigt den Startbildschirm, ohne den aktuellen Bogen zu verwerfen –
  // er lässt sich von dort per „Aktuellen Bogen fortsetzen“ wieder öffnen.
  const [zeigeStart, setZeigeStart] = useState(false);

  async function ladeDatei(e: ChangeEvent<HTMLInputElement>) {
    const datei = e.target.files?.[0];
    e.target.value = "";
    if (!datei) return;
    try {
      setBogen(await bogenLaden(datei));
      setSchritt(UEBERSICHT);
      setZeigeStart(false);
      setFehler("");
    } catch (err) {
      setFehler(err instanceof Error ? err.message : String(err));
    }
  }

  function uebernehmeQrText(text: string) {
    setScannerOffen(false);
    try {
      setBogen(decodePayloadUrl(text, browserKompressor));
      setSchritt(UEBERSICHT);
      setZeigeStart(false);
      setFehler("");
    } catch {
      setFehler("Der gescannte QR-Code enthält keinen gültigen Erfassungsbogen.");
    }
  }

  async function scanneQr() {
    // Nativ (iOS/Android) scannt das Capacitor-Plugin, sonst die Webcam.
    if (!istNativ()) {
      setScannerOffen(true);
      return;
    }
    try {
      const text = await qrScannen();
      if (!text) return; // Abbruch
      uebernehmeQrText(text);
    } catch (err) {
      setFehler(err instanceof Error ? err.message : String(err));
    }
  }

  if (!bogen || zeigeStart) {
    return (
      <>
      <UpdateBanner />
      <main className="start">
        <h1>Einheiten-Erfassungsbogen</h1>
        <p>
          Bogen digital erfassen (BOS-übergreifend), als PDF drucken, als Datei teilen –
          inklusive QR-Code für den Offline-Transport.
        </p>
        <div className="aktionen">
          {bogen && (
            <button className="primaer" onClick={() => setZeigeStart(false)}>
              Aktuellen Bogen fortsetzen
            </button>
          )}
          <button className={bogen ? "" : "primaer"} onClick={() => { setBogen(neuerBogen()); setSchritt(0); setZeigeStart(false); }}>
            Neuen Bogen erstellen
          </button>
          <button onClick={scanneQr}>QR-Code scannen…</button>
          <label className="datei-knopf">
            Aus Datei laden…
            <input type="file" accept=".json,application/json" onChange={ladeDatei} hidden />
          </label>
        </div>
        {fehler && <p className="fehler">{fehler}</p>}
        {scannerOffen && (
          <QrScannerWeb onErgebnis={uebernehmeQrText} onAbbruch={() => setScannerOffen(false)} />
        )}
      </main>
      <Fusszeile />
      </>
    );
  }

  const aendern = (patch: Partial<Erfassungsbogen>) => setBogen({ ...bogen, ...patch });

  return (
    <>
    <UpdateBanner />
    <main>
      <header>
        <h1>Einheiten-Erfassungsbogen</h1>
        <nav className="schritte">
          {SCHRITTE.map((name, i) => (
            <button key={name} className={i === schritt ? "aktiv" : ""} onClick={() => setSchritt(i)}>
              {i + 1}. {name}
            </button>
          ))}
        </nav>
      </header>

      {schritt === 0 && <SchrittEinheit bogen={bogen} aendern={aendern} />}
      {schritt === 1 && <SchrittEinsatz bogen={bogen} aendern={aendern} />}
      {schritt === 2 && <SchrittPersonal bogen={bogen} aendern={aendern} />}
      {schritt === 3 && <SchrittFahrzeuge bogen={bogen} aendern={aendern} />}
      {schritt === 4 && <SchrittSofortbedarf bogen={bogen} aendern={aendern} />}
      {schritt === UEBERSICHT && (
        <Uebersicht bogen={bogen} geheZu={setSchritt} neu={() => { setBogen(null); setSchritt(0); }} zurStartseite={() => setZeigeStart(true)} />
      )}

      {schritt !== UEBERSICHT && (
        <footer className="nav">
          <button disabled={schritt === 0} onClick={() => setSchritt(schritt - 1)}>← Zurück</button>
          <span className="platzhalter" />
          <button className="primaer" onClick={() => setSchritt(schritt + 1)}>
            {schritt === UEBERSICHT - 1 ? "Zur Übersicht →" : "Weiter →"}
          </button>
        </footer>
      )}
    </main>
    <Fusszeile />
    </>
  );
}

// Plattform-Klasse (z. B. platform-ios) auf <html> für plattformspezifisches CSS.
document.documentElement.classList.add(`platform-${plattform()}`);

createRoot(document.getElementById("app")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
