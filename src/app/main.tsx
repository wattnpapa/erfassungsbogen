/**
 * SPA-Einstieg: Startbildschirm (neu / Datei laden), Assistent, Übersicht.
 */

import { StrictMode, useState, type ChangeEvent } from "react";
import { createRoot } from "react-dom/client";
import type { Erfassungsbogen } from "../model";
import { bogenLaden, neuerBogen } from "./hilfen";
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

function App() {
  const [bogen, setBogen] = useState<Erfassungsbogen | null>(null);
  const [schritt, setSchritt] = useState(0);
  const [fehler, setFehler] = useState("");

  async function ladeDatei(e: ChangeEvent<HTMLInputElement>) {
    const datei = e.target.files?.[0];
    e.target.value = "";
    if (!datei) return;
    try {
      setBogen(await bogenLaden(datei));
      setSchritt(UEBERSICHT);
      setFehler("");
    } catch (err) {
      setFehler(err instanceof Error ? err.message : String(err));
    }
  }

  if (!bogen) {
    return (
      <main className="start">
        <h1>Einheiten-Erfassungsbogen</h1>
        <p>
          Bogen digital erfassen (BOS-übergreifend), als PDF drucken, als Datei teilen –
          inklusive QR-Code für den Offline-Transport.
        </p>
        <div className="aktionen">
          <button className="primaer" onClick={() => { setBogen(neuerBogen()); setSchritt(0); }}>
            Neuen Bogen erstellen
          </button>
          <label className="datei-knopf">
            Aus Datei laden…
            <input type="file" accept=".json,application/json" onChange={ladeDatei} hidden />
          </label>
        </div>
        {fehler && <p className="fehler">{fehler}</p>}
      </main>
    );
  }

  const aendern = (patch: Partial<Erfassungsbogen>) => setBogen({ ...bogen, ...patch });

  return (
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
        <Uebersicht bogen={bogen} geheZu={setSchritt} neu={() => { setBogen(null); setSchritt(0); }} />
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
  );
}

createRoot(document.getElementById("app")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
