/**
 * SPA-Einstieg: Startbildschirm (neu / Vorlage / Datei / QR), Assistent,
 * Übersicht, Vorlagenliste und Musterung.
 */

import { StrictMode, useEffect, useState, type ChangeEvent } from "react";
import { createRoot } from "react-dom/client";
import type { Erfassungsbogen } from "../model";
import { decodePayloadUrl, decodeVorlagePayloadUrl, istVorlageNutzlast } from "../codec";
import { bogenLaden, browserKompressor, neuerBogen } from "./hilfen";
import { bogenLinksEmpfangen, istNativ, plattform, qrScannen, textTeilen } from "./nativ";
import { vorlageAnlegen, vorlagenLaden, type Vorlage } from "./vorlagen";
import { Musterung, VorlagenListe } from "./vorlagen-ui";
import {
  EinsatzArt,
  einheitSchluessel,
  einsaetzeLaden,
  einsatzAnlegen,
  einsatzImportieren,
  meldungHinzufuegen,
  type Einsatzsammlung,
} from "./einsaetze";
import { EinsatzDetail, EinsatzListe } from "./einsaetze-ui";
import { aktuelleMeldungen } from "./auswertung";
import { boegenAusPdfBytes, einsatzAusDatei, einsatzDateiInhalt } from "./einsatz-transport";
import { einsatzPdfErzeugen } from "./pdf";
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
  // Einsatz-Sammlung (Meldekopf/Zugführer): Liste, offener Einsatz und das
  // Sammelziel für hereinkommende Bögen (Scan/manuell landen dort statt zu öffnen).
  const [einsaetze, setEinsaetze] = useState<Einsatzsammlung[]>(() => einsaetzeLaden());
  const [offenerEinsatzId, setOffenerEinsatzId] = useState<string | null>(null);
  const [sammelZielId, setSammelZielId] = useState<string | null>(null);

  const vorlagenNeuLaden = () => setVorlagen(vorlagenLaden());
  const einsaetzeNeuLaden = () => setEinsaetze(einsaetzeLaden());

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

  /**
   * Bogen in eine Einsatz-Sammlung aufnehmen (Meldekopf/Zugführer). Erkennt die
   * App die Einheit schon im Einsatz, wird die Zuordnung bestätigt (neue Fassung
   * = Historie) oder als eigene Einheit geführt (Vorschlag+Bestätigung).
   */
  function bogenInSammlung(zielId: string, b: Erfassungsbogen, quelle: "scan" | "manuell") {
    const einsatz = einsaetzeLaden().find((s) => s.id === zielId);
    const schl = einheitSchluessel(b.einheit);
    let override: string | undefined;
    if (einsatz?.eintraege.some((e) => e.einheitSchluessel === schl)) {
      const name = b.einheit.name || "diese Einheit";
      const alsFassung = window.confirm(
        `„${name}" ist bereits im Einsatz.\n\nOK = als neue Fassung anhängen (Historie).\nAbbrechen = als eigene, separate Einheit führen.`,
      );
      if (!alsFassung) override = `${schl}#${Date.now()}`;
    }
    const r = meldungHinzufuegen(zielId, b, { quelle, einheitSchluesselOverride: override });
    einsaetzeNeuLaden();
    if (!r) {
      setFehler("Einsatz nicht gefunden.");
      return;
    }
    setMeldung(
      r.neu
        ? `Meldung von „${b.einheit.name || "Einheit"}" aufgenommen.`
        : `Bereits vorhanden — übersprungen (gleicher Inhalt).`,
    );
    setFehler("");
    setOffenerEinsatzId(zielId); // zurück in die Einsatzansicht
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
      const dekodiert = decodePayloadUrl(text, browserKompressor);
      // Sammelmodus (Meldekopf/Zugführer): Bogen als Meldung ablegen, nicht öffnen.
      if (sammelZielId) {
        const ziel = sammelZielId;
        setSammelZielId(null);
        bogenInSammlung(ziel, dekodiert, "scan");
        return;
      }
      setBogen(dekodiert);
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

  function neuerEinsatz() {
    const name = window.prompt("Neuen Einsatz/Übung anlegen — Name:", "");
    if (name == null || !name.trim()) return;
    const ort = window.prompt("Ort / Auftrag (optional):", "") ?? "";
    const s = einsatzAnlegen(name, EinsatzArt.EINSATZ, ort);
    einsaetzeNeuLaden();
    setMeldung("");
    setZeigeStart(false);
    setOffenerEinsatzId(s.id);
  }

  function scanneInEinsatz(zielId: string) {
    setSammelZielId(zielId);
    setMeldung("");
    scanneQr(); // web: Scanner-Overlay; nativ: Plugin-Modal → uebernehmeQrText
  }

  function manuellInEinsatz(zielId: string) {
    setSammelZielId(zielId);
    setOffenerEinsatzId(null); // Assistent übernimmt die Ansicht
    setMeldung("");
    setBogen(neuerBogen());
    setSchritt(0);
    setZeigeStart(false);
  }

  async function exportiereEinsatz(s: Einsatzsammlung) {
    const name = (s.name || "einsatz").replace(/[^\wäöüÄÖÜß-]+/g, "_");
    const text = einsatzDateiInhalt(s);
    if (istNativ()) {
      await textTeilen(`eeb-einsatz-${name}.json`, text);
      return;
    }
    const blob = new Blob([text], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `eeb-einsatz-${name}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function sammelPdf(s: Einsatzsammlung) {
    const boegen = aktuelleMeldungen(s.eintraege).map((e) => e.bogen);
    if (boegen.length === 0) {
      setFehler("Keine anwesenden Einheiten für die Sammel-PDF.");
      return;
    }
    try {
      await einsatzPdfErzeugen(s.name, boegen);
    } catch (e) {
      setFehler(`Sammel-PDF: ${e instanceof Error ? e.message : e}`);
    }
  }

  /** Bögen aus einer JSON-/PDF-Datei in den offenen Einsatz aufnehmen (Bulk, mit Dedupe). */
  async function importiereBoegen(zielId: string, datei: File) {
    try {
      let boegen: Erfassungsbogen[];
      if (datei.name.toLowerCase().endsWith(".pdf") || datei.type === "application/pdf") {
        boegen = boegenAusPdfBytes(new Uint8Array(await datei.arrayBuffer()));
      } else {
        const daten = JSON.parse(await datei.text());
        boegen = Array.isArray(daten) ? daten : [daten];
      }
      let neu = 0;
      let uebersprungen = 0;
      for (const b of boegen) {
        try {
          const r = meldungHinzufuegen(zielId, b, { quelle: "pdf-import" });
          if (r) r.neu ? neu++ : uebersprungen++;
        } catch {
          /* ungültiger Bogen — überspringen */
        }
      }
      einsaetzeNeuLaden();
      setFehler("");
      setMeldung(
        neu + uebersprungen === 0
          ? "Keine Bögen in der Datei gefunden."
          : `${neu} Bogen/Bögen aufgenommen${uebersprungen ? `, ${uebersprungen} bereits vorhanden` : ""}.`,
      );
    } catch (e) {
      setFehler(`Import: ${e instanceof Error ? e.message : e}`);
    }
  }

  /** Ganze Einsatz-Sammlung aus einer Datei importieren (Schichtübergabe/Backup). */
  async function importiereEinsatzDatei(e: ChangeEvent<HTMLInputElement>) {
    const datei = e.target.files?.[0];
    e.target.value = "";
    if (!datei) return;
    try {
      const s = einsatzAusDatei(await datei.text());
      const r = einsatzImportieren(s);
      einsaetzeNeuLaden();
      setFehler("");
      setMeldung(
        r.neuerEinsatz
          ? `Einsatz „${s.name}" importiert (${r.hinzugefuegt} Meldung(en)).`
          : `Einsatz „${s.name}": ${r.hinzugefuegt} neue Meldung(en) ergänzt.`,
      );
      setOffenerEinsatzId(s.id);
    } catch (err) {
      setFehler(err instanceof Error ? err.message : String(err));
    }
  }

  // Offener Einsatz (Meldekopf/Zugführer) — Vorrang vor Assistent/Start, aber
  // nicht über der Musterung/dem Assistenten während einer manuellen Erfassung.
  const offenerEinsatz = offenerEinsatzId ? einsaetze.find((s) => s.id === offenerEinsatzId) : null;

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

  // Offener Einsatz: Detailansicht mit Summen, Einheiten und Sammel-Aktionen.
  if (offenerEinsatz) {
    return (
      <>
        <UpdateBanner />
        <EinsatzDetail
          einsatz={offenerEinsatz}
          onZurueck={() => { setOffenerEinsatzId(null); setMeldung(""); }}
          onGeaendert={einsaetzeNeuLaden}
          onScannen={() => scanneInEinsatz(offenerEinsatz.id)}
          onManuell={() => manuellInEinsatz(offenerEinsatz.id)}
          onDateiImport={(datei) => importiereBoegen(offenerEinsatz.id, datei)}
          onExport={() => exportiereEinsatz(offenerEinsatz)}
          onSammelPdf={() => sammelPdf(offenerEinsatz)}
          onGeloescht={() => { setOffenerEinsatzId(null); einsaetzeNeuLaden(); setMeldung("Einsatz gelöscht."); }}
        />
        {(meldung || fehler) && (
          <p className={fehler ? "fehler" : "meldung"} role="status" style={{ textAlign: "center" }}>
            {fehler || meldung}
          </p>
        )}
        {scannerOffen && (
          <QrScannerWeb onErgebnis={uebernehmeQrText} onAbbruch={() => { setScannerOffen(false); setSammelZielId(null); }} />
        )}
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
        <section className="start-vorlagen">
          <div className="kopfzeile">
            <h2>Einsatz-Sammlung (Meldekopf)</h2>
            <span>
              <button type="button" onClick={neuerEinsatz}>Neuer Einsatz…</button>{" "}
              <label className="datei-knopf">
                Einsatz importieren…
                <input type="file" accept=".json,application/json" hidden onChange={importiereEinsatzDatei} />
              </label>
            </span>
          </div>
          <p className="hinweis">
            Fremde Bögen zu einem Einsatz/einer Übung sammeln (scannen oder manuell) — mit Stärke-Summen über alle anwesenden Einheiten.
          </p>
          <EinsatzListe
            einsaetze={einsaetze}
            onOeffnen={(s) => { setMeldung(""); setOffenerEinsatzId(s.id); }}
            onGeaendert={einsaetzeNeuLaden}
          />
        </section>
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
          sammelAktion={
            sammelZielId
              ? {
                  label: "In Einsatz übernehmen",
                  onUebernehmen: () => {
                    const ziel = sammelZielId;
                    setSammelZielId(null);
                    setBogen(null);
                    setSchritt(0);
                    bogenInSammlung(ziel, bogen, "manuell");
                  },
                }
              : undefined
          }
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
