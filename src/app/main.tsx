/**
 * SPA-Einstieg: Startbildschirm (neu / Vorlage / Datei / QR), Assistent,
 * Übersicht, Vorlagenliste und Musterung.
 */

// Oberflächenschrift: Archivo (Grotesk in der DIN-Linie — der Formenwelt der
// Fahrzeug- und Schilderbeschriftung im BOS-Umfeld). Bewusst aus dem Bundle
// statt von einem CDN: die App muss offline vollständig funktionieren.
import "@fontsource-variable/archivo";

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
  segmentePayload,
  segmenteZuBogen,
  type SegmentTeil,
} from "../codec";
import { signaturLabel, signaturVonPayload, signaturVonText, type SignaturStatus } from "../signatur";
import { SCHRITT_STATUS_TITEL, bogenLaden, browserKompressor, einheitAnzeigename, neuerBogen, schrittStatus } from "./hilfen";
import { staerke } from "../model";
import { bogenLinksEmpfangen, istNativ, qrScannen, textTeilen } from "./nativ";
import { DebugLeiste, debugAktiv, wendePlattformKlasseAn, wendeRahmenAn } from "./debug-plattform";
import { statistikStarten } from "./statistik";
import { vorlageAnlegen, vorlagenLaden, vorlagenPapierkorb, type Vorlage } from "./vorlagen";
import { Musterung, VorlagenListe } from "./vorlagen-ui";
import { absenderkarteGefuellt, absenderkarteLaden, type Absenderkarte } from "./absenderkarte";
import { AbsenderkarteFeld } from "./absenderkarte-ui";
import {
  EinsatzArt,
  einheitSchluessel,
  einsaetzeLaden,
  einsatzAnlegen,
  einsatzImportieren,
  meldungHinzufuegen,
  type EintragSignatur,
  type Einsatzsammlung,
} from "./einsaetze";
import { EinsatzDetail, EinsatzListe } from "./einsaetze-ui";
import { aktuelleMeldungen } from "./auswertung";
import { boegenAusPdfBytes, einsatzAusDatei, einsatzAusPdfBytes, einsatzDateiInhalt } from "./einsatz-transport";
import { einsatzCsvInhalt } from "./einsatz-csv";
import { einsatzPdfErzeugen } from "./pdf";
import { QrScannerWeb } from "./qr-scanner-web";
import { qrAusBild } from "./qr-bild";
import { entwurfLaden, entwurfSpeichern, entwurfVerwerfen } from "./entwurf";
import { wendeAnzeigeModusAn } from "./anzeige-modus";
import { AnzeigeSchalter } from "./anzeige-schalter";
import { orgFarbe, wendeOrgAkzentAn } from "./org-farben";
import { einheitSymbolSvg, svgDataUrl } from "./taktische-zeichen";
import { Fusszeile } from "./fusszeile";
import { Aktualisierungshinweise } from "./aktualisierung";
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
  /** Rohes Fragment für die (asynchrone) Signaturprüfung nach dem Mounten. */
  text: string;
} {
  const fragment = window.location.hash.slice(1);
  if (!fragment) return { bogen: null, vorlage: null, fehler: "", text: "" };
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  try {
    if (istVorlageNutzlast(fragment)) {
      const b = decodeVorlagePayloadUrl(fragment, browserKompressor);
      return { bogen: null, vorlage: vorlageAnlegen(b.einheit.name, b), fehler: "", text: fragment };
    }
    return { bogen: decodePayloadUrl(fragment, browserKompressor), vorlage: null, fehler: "", text: fragment };
  } catch {
    return { bogen: null, vorlage: null, fehler: "Der geöffnete Link enthält keinen gültigen Erfassungsbogen.", text: "" };
  }
}

/** SignaturStatus → gespeicherter Eintragsstatus (nur signierte Empfänge). */
function alsEintragSignatur(status: SignaturStatus): EintragSignatur | undefined {
  if (status.zustand === "unsigniert") return undefined;
  if (status.zustand === "ungueltig") {
    return { zustand: status.zustand, pubkey: status.pubkey, kurzform: status.kurzform };
  }
  return {
    zustand: status.zustand,
    pubkey: status.pubkey,
    kurzform: status.kurzform,
    absender: status.absender,
  };
}

/**
 * Kurzer Bestätigungston für den Kiosk-Scan (Meldekopf sammelt viele Bögen):
 * hoher Ton = aufgenommen, tiefer Ton = Duplikat. Ohne Audio-Unterstützung
 * passiert einfach nichts — der Ton ist reiner Komfort.
 */
function piep(erfolg: boolean): void {
  try {
    const Ctor =
      window.AudioContext ??
      (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const oszillator = ctx.createOscillator();
    const pegel = ctx.createGain();
    oszillator.type = "sine";
    oszillator.frequency.value = erfolg ? 880 : 330;
    pegel.gain.value = 0.08;
    oszillator.connect(pegel).connect(ctx.destination);
    oszillator.start();
    oszillator.stop(ctx.currentTime + 0.18);
    oszillator.onended = () => void ctx.close();
  } catch {
    /* kein Ton möglich — egal */
  }
}

/**
 * „So funktioniert's": das Grundprinzip (Offline-QR-Transport) in drei
 * Schritten. Beim Erststart steht es prominent unter den Aktionen; sobald
 * Daten vorhanden sind, rückt es ans Ende der Startseite — als Nachschlage-
 * Erklärung, ohne den Arbeitsbereich zu verdrängen.
 */
function SoFunktionierts() {
  return (
    <section className="onboarding" aria-label="So funktioniert es">
      <h2>So funktioniert&rsquo;s</h2>
      <div className="onboarding-schritte">
        <div className="onboarding-schritt">
          <svg viewBox="0 0 48 48" aria-hidden="true">
            <rect x="10" y="6" width="28" height="36" rx="3" fill="none" stroke="currentColor" strokeWidth="2.5" />
            <line x1="16" y1="16" x2="32" y2="16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="16" y1="23" x2="32" y2="23" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="16" y1="30" x2="26" y2="30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <strong>1. Bogen ausfüllen</strong>
          <span>Einheit, Personal und Fahrzeuge erfassen — Vorlagen und Vorbelegungen helfen.</span>
        </div>
        <div className="onboarding-schritt">
          <svg viewBox="0 0 48 48" aria-hidden="true">
            <g fill="currentColor">
              <rect x="8" y="8" width="12" height="12" rx="1.5" fill="none" stroke="currentColor" strokeWidth="2.5" />
              <rect x="12" y="12" width="4" height="4" />
              <rect x="28" y="8" width="12" height="12" rx="1.5" fill="none" stroke="currentColor" strokeWidth="2.5" />
              <rect x="32" y="12" width="4" height="4" />
              <rect x="8" y="28" width="12" height="12" rx="1.5" fill="none" stroke="currentColor" strokeWidth="2.5" />
              <rect x="12" y="32" width="4" height="4" />
              <rect x="28" y="28" width="5" height="5" />
              <rect x="35" y="28" width="5" height="5" />
              <rect x="28" y="35" width="5" height="5" />
              <rect x="35" y="35" width="5" height="5" />
            </g>
          </svg>
          <strong>2. QR-Code zeigen</strong>
          <span>Der ganze Bogen steckt im QR-Code — als PDF, Vollbild oder Link. Ganz ohne Internet.</span>
        </div>
        <div className="onboarding-schritt">
          <svg viewBox="0 0 48 48" aria-hidden="true">
            <g fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M8 14 V10 a2 2 0 0 1 2-2 h4" />
              <path d="M34 8 h4 a2 2 0 0 1 2 2 v4" />
              <path d="M40 34 v4 a2 2 0 0 1-2 2 h-4" />
              <path d="M14 40 h-4 a2 2 0 0 1-2-2 v-4" />
              <path d="M16 24 l6 6 l10 -12" />
            </g>
          </svg>
          <strong>3. Meldekopf scannt</strong>
          <span>Die Gegenstelle scannt den Code und hat sofort alle Daten — samt Stärke-Summen.</span>
        </div>
      </div>
    </section>
  );
}

const START = startAusUrlFragment();

// Kaltstart ohne Bogen aus der URL: den automatisch gesicherten Entwurf
// anbieten — Autosave überlebt geschlossene Tabs, leere Akkus und vom System
// beendete Apps (siehe entwurf.ts).
const ENTWURF = START.bogen ? null : entwurfLaden();

function App() {
  const [bogen, setBogen] = useState<Erfassungsbogen | null>(START.bogen ?? ENTWURF?.bogen ?? null);
  const [schritt, setSchritt] = useState(START.bogen || ENTWURF ? UEBERSICHT : 0);
  const [fehler, setFehler] = useState(START.fehler);
  // Signaturstatus des zuletzt IMPORTIERTEN Bogens (Herkunft des Transports).
  // Wird beim Bearbeiten verworfen — dann beschreibt er den Bogen nicht mehr.
  const [bogenSignatur, setBogenSignatur] = useState<SignaturStatus | null>(null);
  const [meldung, setMeldung] = useState(
    START.vorlage
      ? `Vorlage „${START.vorlage.name}" importiert.`
      : ENTWURF
        ? `Entwurf vom ${new Date(ENTWURF.gespeichert).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })} Uhr wiederhergestellt.`
        : "",
  );
  const [scannerOffen, setScannerOffen] = useState(false);
  // Zeigt den Startbildschirm, ohne den aktuellen Bogen zu verwerfen –
  // er lässt sich von dort per „Aktuellen Bogen fortsetzen“ wieder öffnen.
  const [zeigeStart, setZeigeStart] = useState(!START.bogen && !!ENTWURF);
  const [vorlagen, setVorlagen] = useState<Vorlage[]>(() => vorlagenLaden());
  // Absenderkarte (Gerätestand) — auch auf der Startseite einstellbar; die
  // Übersicht liest sie beim Mounten erneut aus dem Speicher.
  const [absender, setAbsender] = useState<Absenderkarte>(() => absenderkarteLaden());
  const [musterVorlage, setMusterVorlage] = useState<Vorlage | null>(null);
  // Einsatz-Sammlung (Meldekopf/Zugführer): Liste, offener Einsatz und das
  // Sammelziel für hereinkommende Bögen (Scan/manuell landen dort statt zu öffnen).
  const [einsaetze, setEinsaetze] = useState<Einsatzsammlung[]>(() => einsaetzeLaden());
  const [offenerEinsatzId, setOffenerEinsatzId] = useState<string | null>(null);
  const [sammelZielId, setSammelZielId] = useState<string | null>(null);
  // Sammelziel zusätzlich als Ref: der laufende (asynchrone) Scan-Loop und die
  // Scanner-Callbacks lesen sonst einen veralteten Closure-Stand.
  const sammelZielRef = useRef<string | null>(null);
  const setSammelZiel = (id: string | null) => {
    sammelZielRef.current = id;
    setSammelZielId(id);
  };
  // Kiosk-Scan (Meldekopf): Zähler der in diesem Durchgang aufgenommenen Bögen.
  const kioskZaehlerRef = useRef(0);
  // Segmentierung: gesammelte Teile eines großen Bogens (Zustand als Ref, damit
  // der laufende Kamera-/Native-Scan darauf zugreift) + Fortschrittstext fürs Overlay.
  const segmentTeileRef = useRef<SegmentTeil[]>([]);
  const [scanFortschritt, setScanFortschritt] = useState("");

  const vorlagenNeuLaden = () => setVorlagen(vorlagenLaden());
  const einsaetzeNeuLaden = () => setEinsaetze(einsaetzeLaden());

  // Entwurfssicherung: jede Änderung still sichern; wird der Bogen bewusst
  // geschlossen (Neuer Bogen, Übernahme in einen Einsatz), fällt der Entwurf weg.
  // Der Zeitstempel speist die sichtbare „automatisch gespeichert"-Anzeige —
  // sie nimmt die Angst, dass Eingaben bei Akku/Abbruch verloren gehen.
  const [gespeichertUm, setGespeichertUm] = useState<Date | null>(null);
  useEffect(() => {
    if (bogen) {
      entwurfSpeichern(bogen);
      setGespeichertUm(new Date());
    } else {
      entwurfVerwerfen();
      setGespeichertUm(null);
    }
  }, [bogen]);

  // Akzentfarbe der Oberfläche der Organisation des offenen Bogens anpassen —
  // ohne Bogen (Startseite/Einsatzansicht) das Standard-Blau. So sieht man
  // schon an der Farbe, in welcher Organisation man gerade unterwegs ist.
  useEffect(() => {
    wendeOrgAkzentAn(bogen?.einheit.organisation);
  }, [bogen?.einheit.organisation]);

  function musterungFertig(neuerArbeitsbogen: Erfassungsbogen) {
    setBogen(neuerArbeitsbogen);
    setBogenSignatur(null);
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
      setBogenSignatur(null); // Datei-Import: kein signierter Transport
      setSchritt(UEBERSICHT);
      setZeigeStart(false);
      setZeigeVorlagen(false);
      setFehler("");
    } catch (err) {
      setFehler(err instanceof Error ? err.message : String(err));
    }
  }

  /** QR-Code aus einem Foto/Screenshot einlesen — gleiche Pipeline wie der Scan. */
  async function ladeQrBild(e: ChangeEvent<HTMLInputElement>) {
    const datei = e.target.files?.[0];
    e.target.value = "";
    if (!datei) return;
    try {
      const text = await qrAusBild(datei);
      if (!text) {
        setFehler("Im Bild wurde kein QR-Code gefunden — am besten ein scharfes, möglichst gerades Foto des Codes verwenden.");
        return;
      }
      setFehler("");
      await uebernehmeText(text, "Der QR-Code im Bild enthält keinen gültigen Erfassungsbogen.");
    } catch (err) {
      setFehler(err instanceof Error ? err.message : String(err));
    }
  }

  /**
   * Bogen in eine Einsatz-Sammlung aufnehmen (Meldekopf/Zugführer). Erkennt die
   * App die Einheit schon im Einsatz, wird die Zuordnung bestätigt (neue Fassung
   * = Historie) oder als eigene Einheit geführt (Vorschlag+Bestätigung).
   */
  function bogenInSammlung(
    zielId: string,
    b: Erfassungsbogen,
    quelle: "scan" | "manuell",
    signatur?: EintragSignatur,
    /** Kiosk-Scan: Rückmeldung ins Scanner-Overlay statt Ansichtswechsel. */
    kiosk = false,
  ) {
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
    const r = meldungHinzufuegen(zielId, b, { quelle, einheitSchluesselOverride: override, signatur });
    einsaetzeNeuLaden();
    if (!r) {
      setFehler("Einsatz nicht gefunden.");
      return;
    }
    if (kiosk) {
      // Dauerscannen: Piep + Zähler im Overlay, die Kamera bleibt an — beim
      // Massen-Check-in muss niemand zwischen den Bögen die Ansicht wechseln.
      if (r.neu) kioskZaehlerRef.current += 1;
      piep(r.neu);
      const stand = `${kioskZaehlerRef.current} ${kioskZaehlerRef.current === 1 ? "Bogen" : "Bögen"} in diesem Durchgang`;
      setScanFortschritt(
        r.neu
          ? `✓ „${b.einheit.name || "Einheit"}" aufgenommen — ${stand}. Nächsten Bogen zeigen…`
          : `Bereits vorhanden — übersprungen (gleicher Inhalt). ${stand}.`,
      );
      setFehler("");
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

  /**
   * Fertigen Bogen übernehmen: im Sammelmodus als Meldung ablegen, sonst öffnen.
   * `signatur` = Signaturstatus des Transports (Herkunft); beim Öffnen als
   * Provenienz angezeigt, im Sammelmodus je Meldung gespeichert.
   *
   * Rückgabe: true = Scan beendet (Overlay/Loop schließen), false = Kiosk-Modus,
   * der Scanner bleibt für den nächsten Bogen an (Sammelziel bleibt gesetzt).
   */
  function uebernimmBogen(b: Erfassungsbogen, signatur: SignaturStatus): boolean {
    const ziel = sammelZielRef.current;
    if (ziel) {
      bogenInSammlung(ziel, b, "scan", alsEintragSignatur(signatur), true);
      return false; // Kiosk: weiter scannen, bis abgebrochen wird
    }
    setBogen(b);
    setBogenSignatur(signatur);
    setSchritt(UEBERSICHT);
    setZeigeStart(false);
    setFehler("");
    return true;
  }

  /**
   * Einen gescannten/übergebenen QR-Text verarbeiten. Rückgabe: true = fertig
   * (Overlay schließen / Native-Schleife beenden), false = es wird noch ein
   * weiterer Segment-Teil erwartet. Segment-Teile werden gesammelt (Fortschritt
   * „Teil x von n"), Duplikate/fremde/fehlende Teile sauber behandelt und bei
   * Vollständigkeit dekodiert. Vorlagen (Marker „V.") werden importiert. Die
   * Signatur des Transports wird geprüft (blockiert den Import nie).
   */
  async function uebernehmeText(text: string, fehlertext: string): Promise<boolean> {
    if (istVorlageNutzlast(text)) {
      segmentTeileRef.current = [];
      setScanFortschritt("");
      try {
        const b = decodeVorlagePayloadUrl(text, browserKompressor);
        const v = vorlageAnlegen(b.einheit.name, b);
        setVorlagen(vorlagenLaden());
        setMusterVorlage(null);
        setZeigeStart(true); // Startbildschirm listet die (nun importierte) Vorlage
        const status = await signaturVonText(text);
        setMeldung(`Vorlage „${v.name}" importiert.${status.zustand !== "unsigniert" ? ` (${signaturLabel(status)})` : ""}`);
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
          // Signatur über den zusammengesetzten Payload prüfen (auch signierte
          // Bögen können segmentiert sein — die Teile ergeben ihn 1:1 wieder).
          const payload = segmentePayload(r.teile);
          const b = segmenteZuBogen(r.teile, browserKompressor);
          const status = await signaturVonPayload(payload);
          segmentTeileRef.current = [];
          setScanFortschritt("");
          return uebernimmBogen(b, status);
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
      const dekodiert = decodePayloadUrl(text, browserKompressor);
      const status = await signaturVonText(text);
      return uebernimmBogen(dekodiert, status);
    } catch {
      setFehler(fehlertext);
    }
    return true;
  }

  function uebernehmeQrText(text: string): Promise<boolean> {
    return uebernehmeText(text, "Der gescannte QR-Code enthält keinen gültigen Erfassungsbogen.");
  }

  /** Web-Scanner-Ergebnis: bei Fertigstellung das Overlay schließen. */
  async function scanErgebnisWeb(text: string) {
    if (await uebernehmeQrText(text)) {
      setScannerOffen(false);
      setScanFortschritt("");
    }
  }

  function scanAbbrechen(auchSammelZiel: boolean) {
    setScannerOffen(false);
    if (auchSammelZiel) setSammelZiel(null);
    segmentTeileRef.current = [];
    setScanFortschritt("");
    // Kiosk-Bilanz beim Schließen kurz bestätigen (der Zähler stand im Overlay).
    if (kioskZaehlerRef.current > 0) {
      setMeldung(`${kioskZaehlerRef.current} ${kioskZaehlerRef.current === 1 ? "Bogen" : "Bögen"} in diesem Durchgang aufgenommen.`);
      kioskZaehlerRef.current = 0;
    }
  }

  // Kaltstart über QR/Universal Link: den beim Rendern schon dekodierten Bogen
  // nachträglich (asynchron) auf seine Signatur prüfen — blockiert nichts.
  useEffect(() => {
    if (!START.bogen || !START.text) return;
    let aktiv = true;
    signaturVonText(START.text).then((s) => aktiv && setBogenSignatur(s));
    return () => {
      aktiv = false;
    };
  }, []);

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
          // Abbruch: angefangenen Sammelstand (und ein Kiosk-Sammelziel) verwerfen.
          segmentTeileRef.current = [];
          setScanFortschritt("");
          setSammelZiel(null);
          if (kioskZaehlerRef.current > 0) {
            setMeldung(`${kioskZaehlerRef.current} ${kioskZaehlerRef.current === 1 ? "Bogen" : "Bögen"} in diesem Durchgang aufgenommen.`);
            kioskZaehlerRef.current = 0;
          }
          return;
        }
        if (await uebernehmeQrText(text)) return;
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
    setSammelZiel(zielId);
    kioskZaehlerRef.current = 0; // neuer Kiosk-Durchgang
    setMeldung("");
    scanneQr(); // web: Scanner-Overlay; nativ: Plugin-Modal → uebernehmeQrText
  }

  function manuellInEinsatz(zielId: string) {
    setSammelZiel(zielId);
    setOffenerEinsatzId(null); // Assistent übernimmt die Ansicht
    setMeldung("");
    setBogen(neuerBogen());
    setBogenSignatur(null);
    setSchritt(0);
    setZeigeStart(false);
  }

  /** Text als Datei anbieten — App: Share-Sheet, Browser: Download (wie bogenSpeichern). */
  async function dateiAnbieten(dateiname: string, text: string, mime: string) {
    if (istNativ()) {
      await textTeilen(dateiname, text);
      return;
    }
    const blob = new Blob([text], { type: mime });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = dateiname;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function einsatzDateiname(s: Einsatzsammlung): string {
    return (s.name || "einsatz").replace(/[^\wäöüÄÖÜß-]+/g, "_");
  }

  async function exportiereEinsatz(s: Einsatzsammlung) {
    await dateiAnbieten(`eeb-einsatz-${einsatzDateiname(s)}.json`, einsatzDateiInhalt(s), "application/json");
  }

  async function exportiereEinsatzCsv(s: Einsatzsammlung) {
    await dateiAnbieten(`eeb-einsatz-${einsatzDateiname(s)}.csv`, einsatzCsvInhalt(s), "text/csv;charset=utf-8");
  }

  async function sammelPdf(s: Einsatzsammlung) {
    const boegen = aktuelleMeldungen(s.eintraege).map((e) => e.bogen);
    if (boegen.length === 0) {
      setFehler("Keine anwesenden Einheiten für die Sammel-PDF.");
      return;
    }
    try {
      await einsatzPdfErzeugen(s, boegen);
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

  /**
   * Ganze Einsatz-Sammlung aus einer Datei importieren (Schichtübergabe/Backup).
   * Akzeptiert die Sammel-PDF (dort ist die komplette Sammlung inkl. Zügen,
   * Status und Historie eingebettet) ebenso wie eine JSON-Datei.
   */
  async function importiereEinsatzDatei(e: ChangeEvent<HTMLInputElement>) {
    const datei = e.target.files?.[0];
    e.target.value = "";
    if (!datei) return;
    try {
      let s: Einsatzsammlung;
      if (datei.name.toLowerCase().endsWith(".pdf") || datei.type === "application/pdf") {
        const gefunden = einsatzAusPdfBytes(new Uint8Array(await datei.arrayBuffer()));
        if (!gefunden) {
          setFehler(
            "In dieser PDF steckt keine komplette Einsatz-Sammlung (ältere Sammel-PDF oder Einzelbogen). " +
              "Einzelne Bögen lassen sich im geöffneten Einsatz über „Aus Datei/PDF…“ aufnehmen.",
          );
          return;
        }
        s = gefunden;
      } else {
        s = einsatzAusDatei(await datei.text());
      }
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
        <Aktualisierungshinweise />
        <Musterung vorlage={musterVorlage} onStart={musterungFertig} onAbbrechen={() => setMusterVorlage(null)} />
        <Fusszeile />
      </>
    );
  }

  // Offener Einsatz: Detailansicht mit Summen, Einheiten und Sammel-Aktionen.
  if (offenerEinsatz) {
    return (
      <>
        <Aktualisierungshinweise />
        <EinsatzDetail
          einsatz={offenerEinsatz}
          onZurueck={() => { setOffenerEinsatzId(null); setMeldung(""); }}
          onGeaendert={einsaetzeNeuLaden}
          onScannen={() => scanneInEinsatz(offenerEinsatz.id)}
          onManuell={() => manuellInEinsatz(offenerEinsatz.id)}
          onDateiImport={(datei) => importiereBoegen(offenerEinsatz.id, datei)}
          onExport={() => exportiereEinsatz(offenerEinsatz)}
          onCsvExport={() => exportiereEinsatzCsv(offenerEinsatz)}
          onSammelPdf={() => sammelPdf(offenerEinsatz)}
          onGeloescht={() => { setOffenerEinsatzId(null); einsaetzeNeuLaden(); setMeldung("Einsatz in den Papierkorb verschoben."); }}
        />
        {(meldung || fehler) && (
          <p className={fehler ? "fehler" : "meldung"} role="status" style={{ textAlign: "center" }}>
            {fehler || meldung}
          </p>
        )}
        {scannerOffen && (
          <QrScannerWeb onErgebnis={scanErgebnisWeb} fortschritt={scanFortschritt} onAbbruch={() => scanAbbrechen(true)} onBild={ladeQrBild} />
        )}
        <Fusszeile />
      </>
    );
  }

  if (!bogen || zeigeStart) {
    // Erststart = noch keinerlei Daten: Onboarding prominent statt am Seitenende.
    const erststart = !bogen && vorlagen.length === 0 && einsaetze.length === 0;
    return (
      <>
      <Aktualisierungshinweise />
      <main className="start">
        <div className="kopf-leiste">
          <span />
          <AnzeigeSchalter />
        </div>
        <h1>Einheiten-Erfassungsbogen</h1>
        <p>
          Bogen digital erfassen (BOS-übergreifend), als PDF drucken, als Datei teilen –
          inklusive QR-Code für den Offline-Transport.
        </p>
        <p className="offline-badge">✓ Funktioniert komplett offline — alle Daten bleiben auf diesem Gerät.</p>
        {/* „Weiter, wo du warst": der Entwurf als Karte mit taktischem Zeichen,
            Kennfarbe der Organisation und Stärke — der häufigste Weg zurück in
            die Arbeit ist damit ein einziger Tipp. */}
        {bogen && (() => {
          const s = staerke(bogen);
          return (
            <section
              className="entwurf-karte"
              style={{ borderLeftColor: orgFarbe(bogen.einheit.organisation).balken }}
            >
              <img
                className="einheit-avatar gross"
                src={svgDataUrl(einheitSymbolSvg(bogen.einheit))}
                alt=""
                aria-hidden="true"
              />
              <span className="entwurf-text">
                <strong>{einheitAnzeigename(bogen.einheit)}</strong>
                <span className="hinweis">
                  Stärke {s.fuehrer} / {s.unterfuehrer} / {s.mannschaft} / {s.gesamt}
                  {gespeichertUm
                    ? ` · gespeichert ${gespeichertUm.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr`
                    : ""}
                </span>
              </span>
              <button className="primaer" onClick={() => setZeigeStart(false)}>Fortsetzen</button>
            </section>
          );
        })()}
        <div className="aktionen">
          <button className={bogen ? "" : "primaer"} onClick={() => { setBogen(neuerBogen()); setBogenSignatur(null); setSchritt(0); setZeigeStart(false); }}>
            Neuen Bogen erstellen
          </button>
          <button onClick={scanneQr}>QR-Code scannen…</button>
          {/* Im Web sitzt „QR aus Bild einlesen" im Scanner-Overlay, wo es gebraucht
              wird. Nativ scannt eine System-Oberfläche ohne eigene Knöpfe — dort
              bleibt der Ausweg deshalb hier auf der Startseite. */}
          {istNativ() && (
            <label className="datei-knopf">
              QR aus Bild einlesen…
              <input type="file" accept="image/*" onChange={ladeQrBild} hidden />
            </label>
          )}
          <label className="datei-knopf">
            Aus Datei laden…
            <input type="file" accept=".json,application/json" onChange={ladeDatei} hidden />
          </label>
        </div>
        {meldung && <p className="meldung" role="status">{meldung}</p>}
        {fehler && <p className="fehler">{fehler}</p>}
        {scanFortschritt && !scannerOffen && <p className="meldung" role="status">{scanFortschritt}</p>}
        {scannerOffen && (
          <QrScannerWeb onErgebnis={scanErgebnisWeb} fortschritt={scanFortschritt} onAbbruch={() => scanAbbrechen(false)} onBild={ladeQrBild} />
        )}
        {/* Erststart ohne Daten: das Grundprinzip prominent direkt unter den
            Aktionen erklären — der USP steckt sonst nur im Untertitel. Mit
            vorhandenen Daten wandert die Erklärung ans Seitenende (unten). */}
        {erststart && <SoFunktionierts />}
        {/* Auch anzeigen, wenn NUR der Papierkorb gefüllt ist — sonst wäre eine
            versehentlich gelöschte letzte Vorlage nicht wiederherstellbar. */}
        {(vorlagen.length > 0 || vorlagenPapierkorb().length > 0) && (
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
                <input type="file" accept=".json,application/json,.pdf,application/pdf" hidden onChange={importiereEinsatzDatei} />
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
        {/* Absender einmal einrichten, bevor der erste Bogen entsteht: hier auf
            der Startseite gefunden, gilt die Angabe für jeden späteren Transport.
            Ohne hinterlegte Karte gleich aufgeklappt — ein Link allein würde die
            Funktion an dieser Stelle verstecken. */}
        <section className="start-vorlagen">
          <h2>Absender für übergebene Bögen</h2>
          <p className="hinweis">
            Jeder Bogen wird mit dem Geräteschlüssel signiert. Wer hier freiwillig Name und
            Rückkanal hinterlegt, macht daraus einen Absender, den die Gegenstelle bei
            Rückfragen auch erreichen kann.
          </p>
          <AbsenderkarteFeld
            karte={absender}
            onGespeichert={setAbsender}
            startOffen={!absenderkarteGefuellt(absender)}
          />
        </section>
        {/* Mit vorhandenen Daten bleibt die Erklärung erreichbar — am Ende der
            Startseite, über der Fußzeile, statt den Arbeitsbereich zu verdrängen. */}
        {!erststart && <SoFunktionierts />}
      </main>
      <Fusszeile />
      </>
    );
  }

  // Bearbeiten verwirft den Import-Signaturstatus: er beschreibt den empfangenen
  // Transport, nicht den nun geänderten Bogen.
  const aendern = (patch: Partial<Erfassungsbogen>) => {
    setBogen({ ...bogen, ...patch });
    setBogenSignatur(null);
  };

  // Leichter Füllstand je Schritt (Orientierung; die Übersicht hat keinen Status).
  const status = schrittStatus(bogen);

  return (
    <>
    <Aktualisierungshinweise />
    <main>
      <header>
        <div className="kopf-leiste">
          <button type="button" className="zur-start" onClick={() => setZeigeStart(true)}>
            ‹ Startseite
          </button>
          <AnzeigeSchalter />
        </div>
        <div className="titelzeile">
          {/* Taktisches Zeichen der Einheit als „Avatar" — Wiedererkennung auf einen Blick. */}
          <img
            className="einheit-avatar"
            src={svgDataUrl(einheitSymbolSvg(bogen.einheit))}
            alt=""
            aria-hidden="true"
          />
          <h1>Einheiten-Erfassungsbogen</h1>
        </div>
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
        {gespeichertUm && (
          <p className="autosave" role="status">
            ✓ automatisch gespeichert · {gespeichertUm.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr — bleibt auf diesem Gerät
          </p>
        )}
      </header>

      {schritt === 0 && <SchrittEinheit bogen={bogen} aendern={aendern} />}
      {schritt === 1 && <SchrittEinsatz bogen={bogen} aendern={aendern} />}
      {schritt === 2 && <SchrittPersonal bogen={bogen} aendern={aendern} />}
      {schritt === 3 && <SchrittFahrzeuge bogen={bogen} aendern={aendern} />}
      {schritt === 4 && <SchrittSofortbedarf bogen={bogen} aendern={aendern} />}
      {schritt === UEBERSICHT && (
        <Uebersicht
          bogen={bogen}
          signatur={bogenSignatur}
          geheZu={setSchritt}
          neu={() => { setBogen(null); setBogenSignatur(null); setSchritt(0); }}
          onVorlageGespeichert={(name) => { vorlagenNeuLaden(); setMeldung(`Als Vorlage „${name}" gespeichert.`); }}
          sammelAktion={
            sammelZielId
              ? {
                  label: "In Einsatz übernehmen",
                  onUebernehmen: () => {
                    const ziel = sammelZielId;
                    setSammelZiel(null);
                    setBogen(null);
                    setBogenSignatur(null);
                    setSchritt(0);
                    // Manuell erfasster Bogen ist kein signierter Transport.
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
wendeAnzeigeModusAn();

// Im Debug-Modus eine schwebende Leiste zum Umschalten der Vorschau zeigen.
function Wurzel() {
  return (
    <>
      <App />
      {debugAktiv() && <DebugLeiste />}
    </>
  );
}

// Einen Start zählen (Browser, PWA, App). Schlägt ohne Netz still fehl.
statistikStarten();

createRoot(document.getElementById("app")!).render(
  <StrictMode>
    <Wurzel />
  </StrictMode>,
);
