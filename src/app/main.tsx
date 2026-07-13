/**
 * SPA-Einstieg: Startbildschirm (neu / Vorlage / Datei / QR), Assistent,
 * Übersicht, Vorlagenliste und Musterung.
 */

import { StrictMode, useEffect, useRef, useState, type ChangeEvent } from "react";
import { createRoot } from "react-dom/client";
import type { Erfassungsbogen } from "../model";
import {
  decodePayloadUrl,
  decodeVorlagePayloadUrl,
  istVorlageNutzlast,
  istSegmentNutzlast,
  parseSegmentUrl,
  segmentSammeln,
  segmenteZuBogen,
  type SegmentTeil,
} from "../codec";
import { SCHRITT_STATUS_TITEL, bogenLaden, browserKompressor, neuerBogen, schrittStatus } from "./hilfen";
import { bogenLinksEmpfangen, istNativ, qrScannen, textTeilen } from "./nativ";
import { DebugLeiste, debugAktiv, wendePlattformKlasseAn, wendeRahmenAn } from "./debug-plattform";
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
  // Segmentierung: gesammelte Teile eines großen Bogens (Zustand als Ref, damit
  // der laufende Kamera-/Native-Scan darauf zugreift) + Fortschrittstext fürs Overlay.
  const segmentTeileRef = useRef<SegmentTeil[]>([]);
  const [scanFortschritt, setScanFortschritt] = useState("");

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

  /** Fertigen Bogen übernehmen: im Sammelmodus als Meldung ablegen, sonst öffnen. */
  function uebernimmBogen(b: Erfassungsbogen) {
    if (sammelZielId) {
      const ziel = sammelZielId;
      setSammelZielId(null);
      bogenInSammlung(ziel, b, "scan");
      return;
    }
    setBogen(b);
    setSchritt(UEBERSICHT);
    setZeigeStart(false);
    setFehler("");
  }

  /**
   * Einen gescannten/übergebenen QR-Text verarbeiten. Rückgabe: true = fertig
   * (Overlay schließen / Native-Schleife beenden), false = es wird noch ein
   * weiterer Segment-Teil erwartet. Segment-Teile werden gesammelt (Fortschritt
   * „Teil x von n"), Duplikate/fremde/fehlende Teile sauber behandelt und bei
   * Vollständigkeit dekodiert. Vorlagen (Marker „V.") werden importiert.
   */
  function uebernehmeText(text: string, fehlertext: string): boolean {
    if (istVorlageNutzlast(text)) {
      segmentTeileRef.current = [];
      setScanFortschritt("");
      try {
        const b = decodeVorlagePayloadUrl(text, browserKompressor);
        const v = vorlageAnlegen(b.einheit.name, b);
        setVorlagen(vorlagenLaden());
        setMusterVorlage(null);
        setZeigeStart(true); // Startbildschirm listet die (nun importierte) Vorlage
        setMeldung(`Vorlage „${v.name}" importiert.`);
        setFehler("");
      } catch {
        setFehler(fehlertext);
      }
      return true;
    }
    // Segment-Teil eines großen Bogens: sammeln, bis alle Teile vorliegen.
    if (istSegmentNutzlast(text)) {
      try {
        const teil = parseSegmentUrl(text);
        const r = segmentSammeln(segmentTeileRef.current, teil);
        segmentTeileRef.current = r.teile;
        if (r.status === "vollständig") {
          const b = segmenteZuBogen(r.teile, browserKompressor);
          segmentTeileRef.current = [];
          setScanFortschritt("");
          uebernimmBogen(b);
          return true;
        }
        setFehler("");
        setScanFortschritt(
          r.status === "duplikat"
            ? `Teil ${teil.teilNr} war schon dabei — ${r.haben} von ${r.anzahl} Teilen gescannt.`
            : r.status === "fremd"
              ? `Anderer Bogen erkannt — neu begonnen (Teil ${teil.teilNr} von ${r.anzahl}).`
              : `Teil ${r.haben} von ${r.anzahl} gescannt — bitte die übrigen Teile zeigen.`,
        );
        return false;
      } catch {
        setFehler(fehlertext);
        return true;
      }
    }
    // Normaler Einzel-Bogen.
    segmentTeileRef.current = [];
    setScanFortschritt("");
    try {
      uebernimmBogen(decodePayloadUrl(text, browserKompressor));
    } catch {
      setFehler(fehlertext);
    }
    return true;
  }

  function uebernehmeQrText(text: string): boolean {
    return uebernehmeText(text, "Der gescannte QR-Code enthält keinen gültigen Erfassungsbogen.");
  }

  /** Web-Scanner-Ergebnis: bei Fertigstellung das Overlay schließen. */
  function scanErgebnisWeb(text: string) {
    if (uebernehmeQrText(text)) {
      setScannerOffen(false);
      setScanFortschritt("");
    }
  }

  function scanAbbrechen(auchSammelZiel: boolean) {
    setScannerOffen(false);
    if (auchSammelZiel) setSammelZielId(null);
    segmentTeileRef.current = [];
    setScanFortschritt("");
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
      // Schleife für die Segmentierung: bei einem Einzel-Bogen genau ein Durchlauf,
      // bei mehreren Teilen so lange, bis alle gescannt sind oder abgebrochen wird.
      for (;;) {
        const teile = segmentTeileRef.current;
        const anweisung =
          teile.length > 0
            ? `Teil ${teile.length} von ${teile[0]!.anzahl} gescannt — nächsten Teil in den Rahmen halten`
            : "QR-Code des Erfassungsbogens in den Rahmen halten";
        const text = await qrScannen(anweisung);
        if (!text) {
          // Abbruch: angefangenen Sammelstand verwerfen.
          segmentTeileRef.current = [];
          setScanFortschritt("");
          return;
        }
        if (uebernehmeQrText(text)) return;
      }
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
          <QrScannerWeb onErgebnis={scanErgebnisWeb} fortschritt={scanFortschritt} onAbbruch={() => scanAbbrechen(true)} />
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
          <QrScannerWeb onErgebnis={scanErgebnisWeb} fortschritt={scanFortschritt} onAbbruch={() => scanAbbrechen(false)} />
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

  // Leichter Füllstand je Schritt (Orientierung; die Übersicht hat keinen Status).
  const status = schrittStatus(bogen);

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
          {SCHRITTE.map((name, i) => {
            const st = status[i]; // undefined für die Übersicht (letzter Schritt)
            const klassen = [i === schritt ? "aktiv" : "", st ? `status-${st}` : ""].filter(Boolean).join(" ");
            const glyph = st === "ok" ? "✓" : st === "begonnen" ? "•" : "";
            return (
              <button
                key={name}
                className={klassen}
                aria-label={st ? `${i + 1}. ${name} — ${SCHRITT_STATUS_TITEL[st]}` : undefined}
                title={st ? SCHRITT_STATUS_TITEL[st] : undefined}
                onClick={() => setSchritt(i)}
              >
                {i + 1}. {name}
                {glyph && <span className="schritt-status" aria-hidden="true">{glyph}</span>}
              </button>
            );
          })}
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
// Im Browser kann der Debug-Modus die visuelle Plattform überschreiben.
wendePlattformKlasseAn();
wendeRahmenAn();

// Im Debug-Modus eine schwebende Leiste zum Umschalten der Vorschau zeigen.
function Wurzel() {
  return (
    <>
      <App />
      {debugAktiv() && <DebugLeiste />}
    </>
  );
}

createRoot(document.getElementById("app")!).render(
  <StrictMode>
    <Wurzel />
  </StrictMode>,
);
