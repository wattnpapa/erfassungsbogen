/**
 * Die Anwendung selbst: Startbildschirm (neu / Vorlage / Datei / QR), Assistent,
 * Übersicht, Vorlagenliste, Musterung und Einsatz-Sammlung.
 *
 * Bewusst getrennt vom Browser-Einstieg (main.tsx): so lässt sich `App` in
 * Tests rendern, ohne dass ein Wurzelknoten oder Plattform-Seiteneffekte nötig sind.
 */

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import type { Erfassungsbogen } from "../model";
import {
  base64UrlKodieren,
  decodePayloadUrl,
  decodeVorlagePayloadUrl,
  istVorlageNutzlast,
  istSegmentNutzlast,
  parseSegmentUrl,
  payloadAusText,
  segmentSammeln,
  segmentePayload,
  segmenteZuBogen,
  type SegmentTeil,
} from "../codec";
import { signaturLabel, signaturVonPayload, signaturVonText, type SignaturStatus } from "../signatur";
import { SCHRITT_STATUS_TITEL, bogenLaden, browserKompressor, einheitAnzeigename, neuerBogen, schrittStatus } from "./hilfen";
import { staerke } from "../model";
import { bogenLinksEmpfangen, istNativ, qrScannen, textTeilen } from "./nativ";
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
import { ART_LABEL, EinsatzDetail, EinsatzListe } from "./einsaetze-ui";
import { aktuelleMeldungen } from "./auswertung";
import { boegenAusPdfBytes, einsatzAusDatei, einsatzAusPdfBytes, einsatzDateiInhalt } from "./einsatz-transport";
import { einsatzCsvInhalt } from "./einsatz-csv";
import { QrScannerWeb } from "./qr-scanner-web";
import { qrAusBild } from "./qr-bild";
import { entwurfLaden, entwurfSpeichern, entwurfVerwerfen } from "./entwurf";
import { SeitenKopf } from "./seiten-kopf";
import { orgFarbe, wendeOrgAkzentAn } from "./org-farben";
import { einheitSymbolSvg, svgDataUrl } from "./taktische-zeichen";
import { Fusszeile } from "./fusszeile";
import { Aktualisierungshinweise } from "./aktualisierung";
import { Dialogschicht, frageFelder, frageJaNein, frageWahl } from "./dialoge";
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
 * Fragment aus der Adresszeile holen und dort entfernen, damit die Daten nicht
 * im Verlauf hängen bleiben. Gemeinsame Grundlage für den Kaltstart und für
 * `hashchange` (siehe den Listener in `App`).
 */
function fragmentNehmen(): string {
  const fragment = window.location.hash.slice(1);
  if (fragment) {
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }
  return fragment;
}

/**
 * Startzustand aus dem URL-Fragment: Ein QR/Universal Link kann einen
 * Einsatzbogen (`#…`), eine geteilte Vorlage (`#V.…`) oder einen Segment-Teil
 * eines mehrteiligen Bogens (`#EEBS.…`) tragen. Eine Vorlage wird direkt
 * importiert (nicht als Arbeitsbogen geöffnet); ein Segment-Teil wird nach dem
 * Mounten in den Sammelstand übernommen und der Scanner geöffnet.
 */
function startAusUrlFragment(): {
  bogen: Erfassungsbogen | null;
  vorlage: Vorlage | null;
  fehler: string;
  /** Rohes Fragment für die (asynchrone) Signaturprüfung nach dem Mounten. */
  text: string;
  /** Segment-Teil eines mehrteiligen Bogens — die übrigen Teile fehlen noch. */
  segment: string;
} {
  const fragment = fragmentNehmen();
  if (!fragment) return { bogen: null, vorlage: null, fehler: "", text: "", segment: "" };
  try {
    if (istVorlageNutzlast(fragment)) {
      const b = decodeVorlagePayloadUrl(fragment, browserKompressor);
      return { bogen: null, vorlage: vorlageAnlegen(einheitAnzeigename(b.einheit), b), fehler: "", text: fragment, segment: "" };
    }
    if (istSegmentNutzlast(fragment)) {
      // Erster Kontakt per Handy-Kamera, App noch nie geöffnet: Der QR-Teil
      // trägt eine App-URL und landet als Kaltstart hier. Nur validieren —
      // übernehmen kann erst die gemountete App (Sammelstand + Scanner).
      parseSegmentUrl(fragment);
      return { bogen: null, vorlage: null, fehler: "", text: "", segment: fragment };
    }
    return { bogen: decodePayloadUrl(fragment, browserKompressor), vorlage: null, fehler: "", text: fragment, segment: "" };
  } catch {
    return { bogen: null, vorlage: null, fehler: "Der geöffnete Link enthält keinen gültigen Erfassungsbogen.", text: "", segment: "" };
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

// Ein Segment-Teil aus dem Kaltstart darf nur einmal in den Sammelstand —
// StrictMode (Entwicklung) führt Mount-Effekte doppelt aus.
let startSegmentVerbraucht = false;

/**
 * Auswahl der Einsatzart für den Anlege-Dialog. Die alte Abfrage über
 * `window.prompt` legte immer einen „Einsatz" an, obwohl sie „Einsatz/Übung"
 * versprach — mit einem eigenen Dialog ist die Wahl endlich möglich.
 */
const ART_WAHL = Object.entries(ART_LABEL).map(([wert, label]) => ({ wert, label }));

// Kaltstart ohne Bogen aus der URL: den automatisch gesicherten Entwurf
// anbieten — Autosave überlebt geschlossene Tabs, leere Akkus und vom System
// beendete Apps (siehe entwurf.ts).
const ENTWURF = START.bogen ? null : entwurfLaden();

export function App() {
  // Rückfragen, Eingaben und Hinweise zeichnet die App selbst (dialoge.tsx) —
  // die eingebauten window.prompt/confirm/alert bleiben in der iOS-App
  // unbeantwortet. Die Schicht steht außerhalb des Inhalts, damit sie in jeder
  // Ansicht erreichbar ist, auch über einem schon offenen Dialog.
  return (
    <>
      <AppInhalt />
      <Dialogschicht />
    </>
  );
}

function AppInhalt() {
  const [bogen, setBogen] = useState<Erfassungsbogen | null>(START.bogen ?? ENTWURF?.bogen ?? null);
  const [schritt, setSchritt] = useState(START.bogen || ENTWURF ? UEBERSICHT : 0);
  const [fehler, setFehler] = useState(START.fehler);
  // Signaturstatus des zuletzt IMPORTIERTEN Bogens (Herkunft des Transports).
  // Wird beim Bearbeiten verworfen — dann beschreibt er den Bogen nicht mehr.
  const [bogenSignatur, setBogenSignatur] = useState<SignaturStatus | null>(null);
  // Rohbytes des empfangenen Payloads. Nur sie tragen die fremde Signatur:
  // Beim Weiterreichen wird dieser Payload gegengezeichnet, statt den Bogen neu
  // zu signieren (sonst stünde das eigene Gerät als Ursprung da).
  const [bogenHerkunft, setBogenHerkunft] = useState<Uint8Array | null>(null);
  /** Empfangsstand setzen/verwerfen — Status und Rohpayload gehören zusammen. */
  const setzeEmpfang = (signatur: SignaturStatus | null, payload: Uint8Array | null = null) => {
    setBogenSignatur(signatur);
    setBogenHerkunft(payload);
  };
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
  // Auswahl „In Einsatz aufnehmen" aus der Übersicht heraus.
  const einsatzWahlDialog = useRef<HTMLDialogElement>(null);
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
    setzeEmpfang(null);
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
      setzeEmpfang(null); // Datei-Import: kein signierter Transport
      setSchritt(UEBERSICHT);
      setZeigeStart(false);
      setFehler("");
    } catch (err) {
      setFehler(err instanceof Error ? err.message : String(err));
    }
  }

  /**
   * Den angefangenen Bogen direkt von der Startseite aus wegwerfen — das
   * Gegenstück zu „Fortsetzen". Ohne diesen Weg müsste man den Entwurf erst
   * öffnen, um ihn in der Übersicht zu verwerfen. Anders als bei Vorlagen und
   * Einsätzen gibt es für den Entwurf keinen Papierkorb, deshalb die Rückfrage.
   */
  async function entwurfWegwerfen() {
    if (!bogen) return;
    const sicher = await frageJaNein({
      titel: "Angefangenen Bogen verwerfen?",
      text: `„${einheitAnzeigename(bogen.einheit)}" wird gelöscht. Das lässt sich nicht rückgängig machen.`,
      ok: "Verwerfen",
      gefahr: true,
    });
    if (!sicher) return;
    setBogen(null); // löscht auch die Entwurfssicherung (siehe oben)
    setzeEmpfang(null);
    setSchritt(0);
    setMeldung("Angefangener Bogen verworfen.");
  }

  /**
   * Beispielbogen aus der Fußzeile öffnen — bewusst derselbe Weg wie bei einem
   * frisch gescannten Bogen (Übersicht, keine Signatur). Er ersetzt den offenen
   * Bogen inkl. Entwurfssicherung, daher vorher rückfragen. Rückgabe false =
   * abgelehnt, der Beispielbögen-Dialog bleibt dann offen.
   */
  async function oeffneBeispiel(b: Erfassungsbogen): Promise<boolean> {
    if (
      bogen &&
      !(await frageJaNein({
        titel: "Beispielbogen öffnen?",
        text: "Der aktuell geöffnete Bogen wird durch den Beispielbogen ersetzt — auch der gespeicherte Entwurf.",
        ok: "Beispielbogen öffnen",
      }))
    ) {
      return false;
    }
    setBogen(b);
    setzeEmpfang(null); // Beispiel aus der App, kein signierter Transport
    setSchritt(UEBERSICHT);
    setMusterVorlage(null);
    setOffenerEinsatzId(null);
    setZeigeStart(false);
    setFehler("");
    setMeldung("Beispielbogen geöffnet — fiktive Daten zum Ansehen und Ausprobieren.");
    return true;
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
  async function bogenInSammlung(
    zielId: string,
    b: Erfassungsbogen,
    quelle: "scan" | "manuell",
    /**
     * Was beim Empfang mitkam: geprüfter Signaturstatus und der rohe Payload.
     * Letzterer wird mitgespeichert, damit der Meldekopf die Meldung später mit
     * erhaltener Original-Signatur weiterreichen kann (Gegenzeichnen).
     */
    empfang?: { signatur?: EintragSignatur; herkunft?: Uint8Array | null },
    /** Kiosk-Scan: Rückmeldung ins Scanner-Overlay statt Ansichtswechsel. */
    kiosk = false,
  ) {
    const einsatz = einsaetzeLaden().find((s) => s.id === zielId);
    const schl = einheitSchluessel(b.einheit);
    let override: string | undefined;
    if (einsatz?.eintraege.some((e) => e.einheitSchluessel === schl)) {
      // Die Frage hat zwei gleichwertige Antworten und deshalb zwei benannte
      // Knöpfe: „OK/Abbrechen" hätte den zweiten Weg als Abbruch getarnt.
      const wahl = await frageWahl({
        titel: "Einheit ist bereits gemeldet",
        text: `„${einheitAnzeigename(b.einheit)}" steht in diesem Einsatz schon. Wie soll der neue Bogen dazu stehen?`,
        wege: [
          {
            wert: "fassung",
            label: "Als neue Fassung anhängen",
            hinweis: "Der Normalfall bei einer Folgemeldung: die bisherige Meldung wandert in die Historie.",
          },
          {
            wert: "eigene",
            label: "Als eigene Einheit führen",
            hinweis: "Für eine zweite, gleich benannte Einheit — beide zählen getrennt in die Summe.",
          },
        ],
      });
      if (!wahl) {
        // Abgebrochen: der Bogen bleibt draußen. Im Kiosk-Scan steht die
        // Rückmeldung im Overlay, sonst über der Ansicht.
        const text = `„${einheitAnzeigename(b.einheit)}" nicht aufgenommen.`;
        if (kiosk) setScanFortschritt(text);
        else setMeldung(text);
        return;
      }
      if (wahl === "eigene") override = `${schl}#${Date.now()}`;
    }
    const r = meldungHinzufuegen(zielId, b, {
      quelle,
      einheitSchluesselOverride: override,
      signatur: empfang?.signatur,
      herkunft: empfang?.herkunft ? base64UrlKodieren(empfang.herkunft) : undefined,
    });
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
          ? `✓ „${einheitAnzeigename(b.einheit)}" aufgenommen — ${stand}. Nächsten Bogen zeigen…`
          : `Bereits vorhanden — übersprungen (gleicher Inhalt). ${stand}.`,
      );
      setFehler("");
      return;
    }
    setMeldung(
      r.neu
        ? `Meldung von „${einheitAnzeigename(b.einheit)}" aufgenommen.`
        : `Bereits vorhanden — übersprungen (gleicher Inhalt).`,
    );
    setFehler("");
    setOffenerEinsatzId(zielId); // zurück in die Einsatzansicht
  }

  /**
   * Fertigen Bogen übernehmen: im Sammelmodus als Meldung ablegen, sonst öffnen.
   * `signatur` = Signaturstatus des Transports (Herkunft); beim Öffnen als
   * Provenienz angezeigt, im Sammelmodus je Meldung gespeichert. `payload` sind
   * die empfangenen Rohbytes — sie erhalten die fremde Signatur fürs
   * Weiterreichen (siehe qrErzeugen/Gegenzeichnen).
   *
   * Rückgabe: true = Scan beendet (Overlay/Loop schließen), false = Kiosk-Modus,
   * der Scanner bleibt für den nächsten Bogen an (Sammelziel bleibt gesetzt).
   */
  async function uebernimmBogen(
    b: Erfassungsbogen,
    signatur: SignaturStatus,
    payload?: Uint8Array | null,
  ): Promise<boolean> {
    const ziel = sammelZielRef.current;
    if (ziel) {
      // Abwarten: steckt in der Aufnahme eine Rückfrage (Einheit schon
      // gemeldet), darf der Scan-Loop nicht schon den nächsten Code lesen.
      await bogenInSammlung(ziel, b, "scan", { signatur: alsEintragSignatur(signatur), herkunft: payload }, true);
      return false; // Kiosk: weiter scannen, bis abgebrochen wird
    }
    setBogen(b);
    setzeEmpfang(signatur, payload ?? null);
    setSchritt(UEBERSICHT);
    setZeigeStart(false);
    // Einsatzansicht hat Vorrang vor der Übersicht (siehe Render weiter unten):
    // ohne dieses Schließen bliebe ein per Link geöffneter Bogen unsichtbar.
    setOffenerEinsatzId(null);
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
        const v = vorlageAnlegen(einheitAnzeigename(b.einheit), b);
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
          return uebernimmBogen(b, status, payload);
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
      return uebernimmBogen(dekodiert, status, payloadAusText(text));
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
    signaturVonText(START.text).then((s) => aktiv && setzeEmpfang(s, payloadAusText(START.text)));
    return () => {
      aktiv = false;
    };
  }, []);

  // Kaltstart mit einem Segment-Teil: Jemand hat einen Teil eines mehrteiligen
  // Bogens mit der Handy-Kamera gescannt, ohne dass die App lief (typisch:
  // erster Kontakt, nichts installiert). Der Teil wandert in den Sammelstand
  // und der Scanner öffnet sich sofort — die übrigen Teile lassen sich dann
  // ohne Umweg abscannen. Ohne diesen Pfad wäre der Teil verloren, denn das
  // Fragment ist bereits aus der Adresszeile entfernt.
  useEffect(() => {
    if (!START.segment || startSegmentVerbraucht) return;
    startSegmentVerbraucht = true; // StrictMode mountet doppelt — der Teil zählt nur einmal
    void uebernehmeText(START.segment, "Der geöffnete Link enthält keinen gültigen Erfassungsbogen.").then(
      (fertig) => {
        if (!fertig) void scanneQr();
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nur beim Mounten; der Handler nutzt ausschließlich stabile Setter
  }, []);

  // Web-Pendant zum Universal Link: Wird ein Bogen-Link angetippt, während die
  // Seite schon offen ist, lädt der Browser das Dokument NICHT neu — es ändert
  // sich nur das Fragment. Auf dem Telefon ist genau das der Normalfall (der
  // Browser benutzt den vorhandenen Tab bzw. die laufende PWA weiter), am
  // Rechner trifft es jeden Link ab dem zweiten. Ohne diesen Listener liefe der
  // Kaltstart-Pfad oben nie und man bliebe auf der Startseite stehen.
  useEffect(() => {
    function beiFragmentwechsel() {
      const fragment = fragmentNehmen();
      if (!fragment) return;
      void uebernehmeText(fragment, "Der geöffnete Link enthält keinen gültigen Erfassungsbogen.").then(
        (fertig) => {
          // Segment-Teil eines mehrteiligen Bogens: Scanner öffnen, damit die
          // übrigen Teile direkt folgen können. Kam umgekehrt der LETZTE Teil
          // per Link, während der Scanner offen war, schließt er sich.
          if (!fertig) void scanneQr();
          else setScannerOffen(false);
        },
      );
    }
    window.addEventListener("hashchange", beiFragmentwechsel);
    return () => window.removeEventListener("hashchange", beiFragmentwechsel);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nur einmal registrieren; der Handler nutzt ausschließlich stabile Setter
  }, []);

  // Universal Link (iOS) / App Link (Android) öffnet die native App:
  // Bogen oder Vorlage aus der übergebenen URL übernehmen (Kaltstart und laufende App).
  useEffect(() => {
    return bogenLinksEmpfangen((url) => {
      void uebernehmeText(url, "Der geöffnete Link enthält keinen gültigen Erfassungsbogen.").then(
        (fertig) => {
          // Wie beim Web-Fragmentwechsel: Ein Segment-Teil per Link startet
          // den Scanner für die übrigen Teile (hier die native Scan-Schleife).
          if (!fertig) void scanneQr();
        },
      );
    });
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

  /**
   * Einsatz-Sammlung anlegen: Name, Art und Ort in einem Dialog. Rückgabe null =
   * abgebrochen. Beide Wege dorthin (Startseite und Einsatz-Auswahl über einem
   * offenen Bogen) fragen dasselbe — deshalb eine gemeinsame Stelle.
   */
  async function einsatzErfragen(): Promise<Einsatzsammlung | null> {
    const werte = await frageFelder({
      titel: "Neuen Einsatz anlegen",
      hinweis:
        "Eine Sammlung für fremde Bögen — mit Stärke-Summen über alle anwesenden Einheiten.",
      ok: "Einsatz anlegen",
      felder: [
        { name: "name", label: "Name", platzhalter: "z. B. Hochwasser Weser" },
        { name: "art", label: "Art", auswahl: ART_WAHL },
        { name: "ort", label: "Ort / Auftrag (optional)", optional: true, platzhalter: "z. B. Deichabschnitt Nord" },
      ],
    });
    if (!werte) return null;
    const s = einsatzAnlegen(werte.name!, Number(werte.art) as EinsatzArt, werte.ort);
    einsaetzeNeuLaden();
    return s;
  }

  async function neuerEinsatz() {
    const s = await einsatzErfragen();
    if (!s) return;
    setMeldung("");
    setZeigeStart(false);
    setOffenerEinsatzId(s.id);
  }

  /**
   * Offenen Bogen nachträglich in eine Sammlung legen (Auswahl aus der Übersicht).
   * Kam er über einen Transport herein (Scan/Link), reist sein Signaturstatus als
   * Herkunftsnachweis mit; ein selbst erfasster Bogen zählt als „manuell".
   * Wie bei der Übernahme aus dem Sammelmodus ist der Bogen danach abgelegt —
   * der Arbeitsentwurf wird geschlossen und die Einsatzansicht übernimmt.
   */
  async function bogenInEinsatzLegen(zielId: string) {
    if (!bogen) return;
    const b = bogen;
    const sig = bogenSignatur;
    const herkunft = bogenHerkunft;
    einsatzWahlDialog.current?.close();
    setBogen(null);
    setzeEmpfang(null);
    setSchritt(0);
    setMeldung(""); // Rückmeldung des Assistenten gehört nicht in die Folgeansicht
    await bogenInSammlung(
      zielId,
      b,
      sig ? "scan" : "manuell",
      sig ? { signatur: alsEintragSignatur(sig), herkunft } : undefined,
    );
  }

  /** Aus der Einsatz-Auswahl heraus einen neuen Einsatz anlegen und den Bogen hineinlegen. */
  async function neuerEinsatzFuerBogen() {
    const s = await einsatzErfragen();
    if (!s) return;
    await bogenInEinsatzLegen(s.id);
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
    setzeEmpfang(null);
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
    const meldungen = aktuelleMeldungen(s.eintraege);
    if (meldungen.length === 0) {
      setFehler("Keine anwesenden Einheiten für die Sammel-PDF.");
      return;
    }
    try {
      // Dynamisch: pdfmake samt eingebetteter Schriften bleibt aus dem
      // Start-Bundle heraus und wird erst beim ersten PDF geladen.
      const { einsatzPdfErzeugen } = await import("./pdf");
      await einsatzPdfErzeugen(s, meldungen);
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
        <Fusszeile onBogenOeffnen={oeffneBeispiel} />
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
        <Fusszeile onBogenOeffnen={oeffneBeispiel} />
      </>
    );
  }

  if (!bogen || zeigeStart) {
    // Erststart = noch keinerlei Daten: Onboarding prominent statt am Seitenende.
    const erststart = !bogen && vorlagen.length === 0 && einsaetze.length === 0;
    return (
      <>
      <Aktualisierungshinweise />
      <SeitenKopf variante="start-kopf">
        <div className="titelzeile">
          <h1>Digitaler Einheiten-Erfassungsbogen</h1>
        </div>
      </SeitenKopf>
      <main id="inhalt" tabIndex={-1} className="start">
        <p>
          Das kostenlose Online-Tool für BOS-Einheiten und Hilfsorganisationen:
          Bogen digital erfassen, als PDF drucken, als Datei teilen – und per
          QR-Code ohne Internetverbindung von Gerät zu Gerät übertragen.
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
              <span className="entwurf-aktionen">
                <button type="button" className="primaer" onClick={() => { setMeldung(""); setZeigeStart(false); }}>Fortsetzen</button>
                <button type="button" className="gefahr" onClick={entwurfWegwerfen}>Verwerfen</button>
              </span>
            </section>
          );
        })()}
        <div className="aktionen">
          <button type="button" className={bogen ? "" : "primaer"} onClick={() => { setMeldung(""); setBogen(neuerBogen()); setzeEmpfang(null); setSchritt(0); setZeigeStart(false); }}>
            Neuen Bogen erstellen
          </button>
          <button type="button" onClick={scanneQr}>QR-Code scannen…</button>
          {/* Im Web sitzt „QR aus Bild einlesen" im Scanner-Overlay, wo es gebraucht
              wird. Nativ scannt eine System-Oberfläche ohne eigene Knöpfe — dort
              bleibt der Ausweg deshalb hier auf der Startseite. */}
          {istNativ() && (
            <label className="datei-knopf">
              QR aus Bild einlesen…
              <input type="file" accept="image/*" onChange={ladeQrBild} className="nur-sr" />
            </label>
          )}
          {/* Das Feld ist nur fürs Auge weg (.nur-sr), nicht per `hidden`: sonst
              fällt der Knopf komplett aus der Tabfolge und ist ausschließlich
              mit der Maus bedienbar. */}
          <label className="datei-knopf">
            Aus Datei laden…
            <input type="file" accept=".json,application/json" onChange={ladeDatei} className="nur-sr" />
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
                <input type="file" accept=".json,application/json,.pdf,application/pdf" className="nur-sr" onChange={importiereEinsatzDatei} />
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
      <Fusszeile onBogenOeffnen={oeffneBeispiel} />
      </>
    );
  }

  // Bearbeiten verwirft den Import-Signaturstatus: er beschreibt den empfangenen
  // Transport, nicht den nun geänderten Bogen.
  const aendern = (patch: Partial<Erfassungsbogen>) => {
    setBogen({ ...bogen, ...patch });
    setzeEmpfang(null);
  };

  // Leichter Füllstand je Schritt (Orientierung; die Übersicht hat keinen Status).
  const status = schrittStatus(bogen);

  return (
    <>
    <Aktualisierungshinweise />
    <SeitenKopf variante="assistent-kopf">
      <button type="button" className="zur-start" onClick={() => { setMeldung(""); setZeigeStart(true); }}>
        ‹ Startseite
      </button>
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
      {/* Der aktive Schritt steht nicht nur als CSS-Klasse da: ohne
          aria-current="step" liest eine Vorlesesoftware sechs gleichwertige
          Knöpfe vor und sagt nicht, wo man gerade ist. */}
      <nav className="schritte" aria-label="Schritte">
        {SCHRITTE.map((name, i) => {
          const st = status[i]; // undefined für die Übersicht (letzter Schritt)
          const klassen = [i === schritt ? "aktiv" : "", st ? `status-${st}` : ""].filter(Boolean).join(" ");
          const glyph = st === "ok" ? "✓" : st === "begonnen" ? "•" : "";
          return (
            <button
              key={name}
              type="button"
              className={klassen}
              aria-current={i === schritt ? "step" : undefined}
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
    </SeitenKopf>
    {/* Übungs-Störer: volle Breite direkt unter dem Kopf, auf jedem Schritt.
        Er hängt am Bogen (nicht an einem Geräte-Modus) und erscheint darum
        auch, wenn ein fremder Übungsbogen gescannt wurde. */}
    {bogen.uebung && (
      <div className="uebungs-band" role="status">
        <strong>ÜBUNG</strong> — Dieser Bogen ist als Übung gekennzeichnet und beschreibt keinen echten Einsatz.
      </div>
    )}
    <main id="inhalt" tabIndex={-1}>
      {/* Rückmeldungen (Vorlage gespeichert, Beispielbogen geöffnet …) gehören
          dorthin, wo die Aktion ausgelöst wurde. Ohne diese Zeile blieben sie
          im Assistenten unsichtbar und tauchten später unvermittelt auf der
          Startseite auf. */}
      {meldung && <p className="meldung" role="status">{meldung}</p>}
      {schritt === 0 && <SchrittEinheit bogen={bogen} aendern={aendern} />}
      {schritt === 1 && <SchrittEinsatz bogen={bogen} aendern={aendern} />}
      {schritt === 2 && <SchrittPersonal bogen={bogen} aendern={aendern} />}
      {schritt === 3 && <SchrittFahrzeuge bogen={bogen} aendern={aendern} />}
      {schritt === 4 && <SchrittSofortbedarf bogen={bogen} aendern={aendern} />}
      {schritt === UEBERSICHT && (
        <Uebersicht
          bogen={bogen}
          signatur={bogenSignatur}
          herkunft={bogenHerkunft}
          geheZu={setSchritt}
          neu={() => { setMeldung(""); setBogen(null); setzeEmpfang(null); setSchritt(0); }}
          onVorlageGespeichert={(name) => { vorlagenNeuLaden(); setMeldung(`Als Vorlage „${name}" gespeichert.`); }}
          onInEinsatzAufnehmen={() => { einsaetzeNeuLaden(); einsatzWahlDialog.current?.showModal(); }}
          sammelAktion={
            sammelZielId
              ? {
                  label: "In Einsatz übernehmen",
                  onUebernehmen: () => {
                    const ziel = sammelZielId;
                    setSammelZiel(null);
                    setBogen(null);
                    setzeEmpfang(null);
                    setSchritt(0);
                    setMeldung("");
                    // Manuell erfasster Bogen ist kein signierter Transport.
                    void bogenInSammlung(ziel, bogen, "manuell");
                  },
                }
              : undefined
          }
        />
      )}

      {/* Einsatz-Auswahl für „In Einsatz aufnehmen…": ein gescannter oder
          geöffneter Bogen wandert von der Übersicht direkt in eine Sammlung. */}
      {schritt === UEBERSICHT && (
        <dialog ref={einsatzWahlDialog} aria-label="In Einsatz aufnehmen" className="teilen-dialog">
          <div className="kopfzeile">
            <h2>In Einsatz aufnehmen</h2>
            <button type="button" onClick={() => einsatzWahlDialog.current?.close()}>Schließen</button>
          </div>
          <p className="hinweis">
            Der Bogen wird als Meldung abgelegt und hier geschlossen; ist die Einheit im Einsatz schon
            gemeldet, wird nachgefragt (neue Fassung oder eigene Einheit).
          </p>
          {einsaetze.map((s) => (
            <div className="teilen-weg" key={s.id}>
              <button type="button" onClick={() => bogenInEinsatzLegen(s.id)}>{s.name}</button>
              <p className="hinweis">
                {ART_LABEL[s.art]}{s.ort ? ` · ${s.ort}` : ""} · {aktuelleMeldungen(s.eintraege).length} Einheit(en) anwesend
              </p>
            </div>
          ))}
          <div className="teilen-weg">
            <button type="button" className={einsaetze.length === 0 ? "primaer" : ""} onClick={neuerEinsatzFuerBogen}>
              Neuen Einsatz anlegen…
            </button>
            <p className="hinweis">
              {einsaetze.length === 0
                ? "Noch keine Sammlung vorhanden — der Bogen ist die erste Meldung darin."
                : "Für einen neuen Einsatz oder eine Übung."}
            </p>
          </div>
        </dialog>
      )}

      {schritt !== UEBERSICHT && (
        <footer className="nav">
          <button type="button" disabled={schritt === 0} onClick={() => setSchritt(schritt - 1)}>← Zurück</button>
          <span className="platzhalter" />
          <button type="button" className="primaer" onClick={() => setSchritt(schritt + 1)}>
            {schritt === UEBERSICHT - 1 ? "Zur Übersicht →" : "Weiter →"}
          </button>
        </footer>
      )}
    </main>
    {/* Im Assistenten nur die Pflichtzeile: unter einem halb ausgefüllten
        Formular haben Datensicherung, „Alle Daten löschen" und die
        Beispielbögen nichts zu suchen — die stehen auf der Startseite. */}
    <Fusszeile onBogenOeffnen={oeffneBeispiel} kompakt />
    </>
  );
}
