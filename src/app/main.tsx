/**
 * SPA-Einstieg: Startbildschirm (neu / Vorlage / Datei / QR), Assistent,
 * Übersicht, Vorlagenliste und Musterung.
 */

import { StrictMode, useEffect, useState, type ChangeEvent } from "react";
import { createRoot } from "react-dom/client";
import type { Erfassungsbogen } from "../model";
import { decodePayloadUrl, decodeVorlagePayloadUrl, istVorlageNutzlast } from "../codec";
import { bogenLaden, browserKompressor, neuerBogen } from "./hilfen";
import { bogenLinksEmpfangen, istNativ, plattform, qrScannen } from "./nativ";
import { vorlageAnlegen, vorlagenLaden, type Vorlage } from "./vorlagen";
import { Musterung, VorlagenListe } from "./vorlagen-ui";
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
const SCHRITT_EINSATZ = 1; // Landepunkt nach der Musterung: Ort/Zeitraum sind das einzig Leere.

/**
 * Startzustand aus dem URL-Fragment: Ein QR/Universal Link kann einen
 * Einsatzbogen (`#…`) oder eine geteilte Vorlage (`#V.…`) tragen. Eine Vorlage
 * wird direkt importiert (nicht als Arbeitsbogen geöffnet). Das Fragment wird
 * danach aus der Adresszeile entfernt, damit die Daten nicht im Verlauf hängen.
 */
function startAusUrlFragment(): {
  bogen: Erfassungsbogen | null;
  vorlage: Vorlage | null;
  fehler: string;
} {
  const fragment = window.location.hash.slice(1);
  if (!fragment) return { bogen: null, vorlage: null, fehler: "" };
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  try {
    if (istVorlageNutzlast(fragment)) {
      const b = decodeVorlagePayloadUrl(fragment, browserKompressor);
      return { bogen: null, vorlage: vorlageAnlegen(b.einheit.name, b), fehler: "" };
    }
    return { bogen: decodePayloadUrl(fragment, browserKompressor), vorlage: null, fehler: "" };
  } catch {
    return { bogen: null, vorlage: null, fehler: "Der geöffnete Link enthält keinen gültigen Erfassungsbogen." };
  }
}

const START = startAusUrlFragment();

function App() {
  const [bogen, setBogen] = useState<Erfassungsbogen | null>(START.bogen);
  const [schritt, setSchritt] = useState(START.bogen ? UEBERSICHT : 0);
  const [fehler, setFehler] = useState(START.fehler);
  const [meldung, setMeldung] = useState(START.vorlage ? `Vorlage „${START.vorlage.name}" importiert.` : "");
  const [scannerOffen, setScannerOffen] = useState(false);
  // Zeigt den Startbildschirm, ohne den aktuellen Bogen zu verwerfen –
  // er lässt sich von dort per „Aktuellen Bogen fortsetzen“ wieder öffnen.
  const [zeigeStart, setZeigeStart] = useState(false);
  const [vorlagen, setVorlagen] = useState<Vorlage[]>(() => vorlagenLaden());
  const [musterVorlage, setMusterVorlage] = useState<Vorlage | null>(null);

  const vorlagenNeuLaden = () => setVorlagen(vorlagenLaden());

  function musterungFertig(neuerArbeitsbogen: Erfassungsbogen) {
    setBogen(neuerArbeitsbogen);
    setSchritt(SCHRITT_EINSATZ);
    setMusterVorlage(null);
    setZeigeStart(false);
    setMeldung("");
  }

  async function ladeDatei(e: ChangeEvent<HTMLInputElement>) {
    const datei = e.target.files?.[0];
    e.target.value = "";
    if (!datei) return;
    try {
      setBogen(await bogenLaden(datei));
      setSchritt(UEBERSICHT);
      setZeigeStart(false);
      setZeigeVorlagen(false);
      setFehler("");
    } catch (err) {
      setFehler(err instanceof Error ? err.message : String(err));
    }
  }

  function uebernehmeText(text: string, fehlertext: string) {
    setScannerOffen(false);
    try {
      // Geteilte Vorlage (Marker „V.“): importieren statt als Bogen öffnen.
      if (istVorlageNutzlast(text)) {
        const b = decodeVorlagePayloadUrl(text, browserKompressor);
        const v = vorlageAnlegen(b.einheit.name, b);
        setVorlagen(vorlagenLaden());
        setMusterVorlage(null);
        setZeigeStart(true); // Startbildschirm listet die (nun importierte) Vorlage
        setMeldung(`Vorlage „${v.name}" importiert.`);
        setFehler("");
        return;
      }
      setBogen(decodePayloadUrl(text, browserKompressor));
      setSchritt(UEBERSICHT);
      setZeigeStart(false);
      setFehler("");
    } catch {
      setFehler(fehlertext);
    }
  }

  function uebernehmeQrText(text: string) {
    uebernehmeText(text, "Der gescannte QR-Code enthält keinen gültigen Erfassungsbogen.");
  }

  // Universal Link (iOS) / App Link (Android) öffnet die native App:
  // Bogen oder Vorlage aus der übergebenen URL übernehmen (Kaltstart und laufende App).
  useEffect(() => {
    return bogenLinksEmpfangen((url) =>
      uebernehmeText(url, "Der geöffnete Link enthält keinen gültigen Erfassungsbogen."),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nur einmal registrieren; der Handler nutzt ausschließlich stabile Setter
  }, []);

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

  // Musterung einer Vorlage (Vorrang vor allen anderen Ansichten).
  if (musterVorlage) {
    return (
      <>
        <UpdateBanner />
        <Musterung vorlage={musterVorlage} onStart={musterungFertig} onAbbrechen={() => setMusterVorlage(null)} />
        <Fusszeile />
      </>
    );
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
        {meldung && <p className="meldung" role="status">{meldung}</p>}
        {fehler && <p className="fehler">{fehler}</p>}
        {scannerOffen && (
          <QrScannerWeb onErgebnis={uebernehmeQrText} onAbbruch={() => setScannerOffen(false)} />
        )}
        {vorlagen.length > 0 && (
          <section className="start-vorlagen">
            <h2>Gespeicherte Vorlagen</h2>
            <VorlagenListe
              vorlagen={vorlagen}
              onMustern={(v) => { setMeldung(""); setMusterVorlage(v); }}
              onGeaendert={vorlagenNeuLaden}
            />
          </section>
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
        <button type="button" className="zur-start" onClick={() => setZeigeStart(true)}>
          ‹ Startseite
        </button>
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
        <Uebersicht
          bogen={bogen}
          geheZu={setSchritt}
          neu={() => { setBogen(null); setSchritt(0); }}
          onVorlageGespeichert={(name) => { vorlagenNeuLaden(); setMeldung(`Als Vorlage „${name}" gespeichert.`); }}
        />
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
