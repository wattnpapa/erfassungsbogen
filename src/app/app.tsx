/**
 * Die Anwendung selbst: Startbildschirm (neu / Vorlage / Datei / QR), Assistent,
 * Übersicht, Vorlagenliste, Musterung und Einsatz-Sammlung.
 *
 * Bewusst getrennt vom Browser-Einstieg (main.tsx): so lässt sich `App` in
 * Tests rendern, ohne dass ein Wurzelknoten oder Plattform-Seiteneffekte nötig sind.
 */

import { Fragment, useEffect, useRef, useState, type ChangeEvent } from "react";
import { START_ABSCHNITTE, type Teil } from "./start-inhalt";
import type { Erfassungsbogen } from "@bos/eeb-format/model";
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
} from "@bos/eeb-format/codec";
import { signaturLabel, signaturVonPayload, signaturVonText, type SignaturStatus } from "@bos/eeb-format/signatur";
import {
  SCHRITT_STATUS_TITEL,
  blobAlsDownload,
  bogenHatInhalt,
  heuteDatum,
  nurSollstaerke,
  zeitraumDeutsch,
  bogenLaden,
  browserKompressor,
  bytesAlsDatei,
  einheitAnzeigename,
  einheitOrt,
  neuerBogen,
  schrittStatus,
} from "./hilfen";
import { EEB_EPOCHE_MS, PersonalErfassung, jetztZeitpunkt, staerke } from "@bos/eeb-format/model";
import {
  DATENSCHUTZFRIST_TAGE,
  bogenAnonymisiert,
  datenschutzfristAbgelaufen,
  datenschutzfristEnde,
  tageBisAnonymisierung,
} from "@bos/eeb-format/datenschutzfrist";
import { datenschutzZeitpunkt } from "./datenschutz-uhr";
import { Kopfnav } from "./kopfnav-ui";
import { bogenLinksEmpfangen, imWebBrowser, istNativ, qrScannen, textTeilen } from "./nativ";
import { fehlerText } from "./nachladen";
import { dateiFehlerMeldung } from "./datei-fehler";
import { FehlerImBild } from "./fehler-im-bild";
import { entfernteImImportKlaeren } from "./entfernte-meldungen";
import { FensterKonflikt, useFensterAbgleich } from "./fenster-abgleich";
import { entwirreScanText } from "./tastaturbelegung";
import { vorlageAktualisieren, vorlageAnlegen, vorlageAusDatei, vorlagenLaden, vorlagenPapierkorb, vorlageZuruecksetzen, type Vorlage } from "./vorlagen";
import { Musterung, VorlagenListe } from "./vorlagen-ui";
import { absenderkarteGefuellt, absenderkarteLaden, type Absenderkarte } from "./absenderkarte";
import { AbsenderkarteFeld } from "./absenderkarte-ui";
import {
  EinsatzArt,
  bogenInhaltsId,
  einheitSchluessel,
  einsaetzeLaden,
  einsaetzePapierkorb,
  einsatzAnlegen,
  neuesteJeEinheit,
  revisionen,
  type EintragSignatur,
  type Einsatzsammlung,
} from "@bos/meldekopf/einsaetze";
import { bogenDiff, diffKurzfassung } from "@bos/meldekopf/meldung-diff";
import { SpeicherVollFehler, eintreffzeitSetzen, istSpeicherVoll, meldungAufnehmen, zeitLang } from "./eintrag-zeiten";
import { offlineText, useOfflineStand } from "./offline-bereit";
import { uebergabeFesthalten, uebergabeText, type UebergabeStand } from "./uebergabe-stand";
import { ART_LABEL, EinsatzDetail, EinsatzListe, letzteMeldungText, type Eingang } from "./einsaetze-ui";
import { letzteMeldung, meldungsNummern } from "./einheiten-tabelle";
import { exportSammlung, exportStandLaden, exportVermerken, weitergabeUmImportErgaenzen, type ExportStand, type ExportUmfang } from "./export-stand";
import { abgleichText, einsatzAbgleichen, sammlungFuerZiel } from "./einsatz-abgleich";
import { aktuelleMeldungen } from "./auswertung";
import { boegenAusJsonText, boegenAusPdfBytes, einsatzAusDatei, einsatzAusPdfBytes, einsatzDateiInhalt, istPdfDatei, pdfInhaltArt } from "./einsatz-transport";
import type { QrBogen } from "./qr-boegen";
import { einsatzCsvInhalt } from "./einsatz-csv";
import { einsatzDetailCsvInhalt } from "./bogen-csv";
import { QrScannerWeb } from "./qr-scanner-web";
import { TeilQuittung, fehlendeTeile, fehltNochSatz } from "./teil-quittung";
import { qrAusBild } from "./qr-bild";
import { dateiImportMeldung, istBilddatei, qrStapelLesen, stapelBericht as stapelBerichtZeilen, teileMerker } from "./qr-stapel";
import { StapelQuittung } from "./stapel-quittung";
import { EintreffzeitFeld, aehnlicherOrt, eintreffzeitAusUhrzeit } from "./nacherfassung";
import {
  entwurfAusAnderemFenster,
  entwurfLaden,
  entwurfSpeichern,
  entwurfVerwerfen,
  ersetztenEntwurfLaden,
  ersetztenEntwurfMerken,
  rueckholungNimmt,
  ersetztenEntwurfVerwerfen,
  entwurfUeberschreibenErlauben,
  type Entwurf,
} from "./entwurf";
import { SeitenKopf } from "./seiten-kopf";
import { AnzeigeSchalter } from "./anzeige-schalter";
import { orgFarbe, wendeOrgAkzentAn } from "./org-farben";
import { einheitSymbolSvg, svgDataUrl } from "./taktische-zeichen-bogen";
import { Fusszeile } from "./fusszeile";
import { Aktualisierungshinweise } from "./aktualisierung";
import { SpeicherWarnung } from "./speicher-warnung";
import { Dialogschicht, frageFelder, frageJaNein, frageWahl, zeigeHinweis, type Antwortweg } from "./dialoge";
import { istNurStaerke, nurStaerkeUebernehmen, wasWegfiele } from "./nur-staerke";
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
/** Ab dieser Dauer zwischen Beginn und Übernahme einer Erfassung fragt die App nach der Eintreffzeit (R3-S6). */
const ERFASSUNG_PAUSE_MS = 5 * 60_000;

/**
 * Datenschutzfrist beim Öffnen eines Bogens von außen (Scan, Link, Datei): Ist
 * sie abgelaufen, wird nur die anonymisierte Fassung übernommen. Wer das
 * Ergebnis `anonymisiert` erhält, verwirft auch Signaturnachweis und
 * Rohpayload — sie deckten den veränderten Inhalt nicht mehr und trügen die
 * Namen beim Weiterreichen im Klartext weiter.
 */
function bogenNachFrist(b: Erfassungsbogen): { bogen: Erfassungsbogen; anonymisiert: boolean } {
  if (!datenschutzfristAbgelaufen(b, datenschutzZeitpunkt())) return { bogen: b, anonymisiert: false };
  return { bogen: bogenAnonymisiert(b), anonymisiert: true };
}

const FRIST_ABGELAUFEN_MELDUNG =
  `Die Datenschutzfrist dieses Bogens ist abgelaufen (${DATENSCHUTZFRIST_TAGE} Tage nach der letzten Änderung) — ` +
  "Namen, Funktionen, Qualifikationen und Erreichbarkeiten wurden entfernt.";

/** Kalendertag eines Zeitpunkts, deutsch geschrieben („12.12.2026"). */
function tagDeutsch(zeitpunkt: number): string {
  return new Date(EEB_EPOCHE_MS + zeitpunkt * 60_000).toLocaleDateString("de-DE", { timeZone: "UTC" });
}

/**
 * Hinweis zur Datenschutzfrist unter dem Kopf: nach Ablauf, dass die
 * Personaldaten entfernt sind, und in den letzten 14 Tagen davor, wann es so
 * weit ist. Die übrige Zeit schweigt das Band — der Hinweis steht dauerhaft im
 * Einsatz-Schritt beim Übungshaken.
 */
function FristBand({ bogen }: { bogen: Erfassungsbogen }) {
  const jetzt = datenschutzZeitpunkt();
  const ende = datenschutzfristEnde(bogen);
  if (ende == null) return null;
  if (datenschutzfristAbgelaufen(bogen, jetzt)) {
    return (
      <div className="frist-band" role="status">
        <strong>DATENSCHUTZFRIST ABGELAUFEN</strong> — Namen, Funktionen, Qualifikationen und
        Erreichbarkeiten wurden {DATENSCHUTZFRIST_TAGE} Tage nach der letzten Änderung entfernt. Stärke
        und Summen bleiben erhalten.
      </div>
    );
  }
  const tage = tageBisAnonymisierung(bogen, jetzt);
  if (tage == null) return null;
  return (
    <div className="frist-band" role="status">
      <strong>Datenschutzfrist</strong> — Die Personaldaten dieses Bogens werden am {tagDeutsch(ende)}{" "}
      anonymisiert ({tage === 1 ? "noch 1 Tag" : `noch ${tage} Tage`}). Wird der Bogen weiter bearbeitet,
      beginnt die Frist neu.
    </div>
  );
}

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
    const { bogen, anonymisiert } = bogenNachFrist(decodePayloadUrl(fragment, browserKompressor));
    // Anonymisiert: kein Text für die Signaturprüfung — der Nachweis deckt den Inhalt nicht mehr.
    return { bogen, vorlage: null, fehler: "", text: anonymisiert ? "" : fragment, segment: "" };
  } catch {
    return { bogen: null, vorlage: null, fehler: "Der geöffnete Link enthält keinen gültigen Erfassungsbogen.", text: "", segment: "" };
  }
}

/**
 * Fehlertext für einen Scan, aus dem sich kein Bogen lesen ließ — mit dem
 * Anfang dessen, was tatsächlich ankam.
 *
 * Nötig wegen der USB-Handscanner: Sie tippen den Code als Tastenfolge, und
 * steht der Scanner auf einer anderen Tastaturbelegung als der Rechner, kommt
 * er verstümmelt an („https:--erfassungsbogen.app§…" statt „…app/#…"). Der
 * Bogen ist dann in Ordnung und der Scan technisch erfolgreich — nur die
 * Zeichen stimmen nicht. Ohne den empfangenen Anfang ist das im Feld nicht zu
 * erkennen, und die Meldung „kein gültiger Erfassungsbogen" zeigt auf den
 * falschen Schuldigen.
 */
/** Trägt der Text einen Bogen, eine Vorlage oder einen Segment-Teil? */
function istLesbarerScan(text: string): boolean {
  try {
    if (istSegmentNutzlast(text)) {
      parseSegmentUrl(text);
      return true;
    }
    if (istVorlageNutzlast(text)) {
      decodeVorlagePayloadUrl(text, browserKompressor);
      return true;
    }
    decodePayloadUrl(text, browserKompressor);
    return true;
  } catch {
    return false;
  }
}

/** Hinweis nach einem zurückgerechneten Scan — die Einstellung selbst bleibt falsch. */
const BELEGUNG_HINWEIS =
  "Der Handscanner tippt in einer anderen Tastaturbelegung (US) als der Rechner; die App hat den Code zurückgerechnet. "
  + "Dauerhaft behoben ist es, wenn der Scanner auf Deutschland/DE gestellt wird — die Anleitung zeigt unter „USB-Handscanner einrichten\" die Codes zum Abscannen.";

export function scanFehlertext(text: string): string {
  const anfang = text.trim().slice(0, 40);
  const gezeigt = `Empfangen: „${anfang}${text.trim().length > 40 ? "…" : ""}"`;
  // Unser Link, aber ohne die Raute: Genau so sieht eine falsche Belegung aus.
  if (/erfassungsbogen/i.test(text) && !text.includes("#")) {
    return `Der Code kam verstümmelt an — der Handscanner ist vermutlich auf eine andere Tastaturbelegung eingestellt als der Rechner (Deutsch/DE). ${gezeigt}`;
  }
  return `Der gescannte QR-Code enthält keinen gültigen Erfassungsbogen. ${gezeigt}`;
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

/**
 * Der erklärende Text am Ende der Startseite. Er entsteht aus derselben Quelle
 * wie der statische Block in index.html (start-inhalt.ts) — deshalb steht nach
 * dem React-Mount Zeichen für Zeichen dasselbe da wie vorher im Gerüst.
 * Position: unter dem Arbeitsbereich. Wer die App benutzen will, soll die
 * Weiche „eigener Bogen / Meldekopf" oben finden; wer wissen will, was das
 * hier ist, liest weiter.
 */
function StartInhalt() {
  return (
    <section className="start-seo" aria-label="Über den digitalen Erfassungsbogen">
      {START_ABSCHNITTE.map((abschnitt) => (
        <Fragment key={abschnitt.titel}>
          <h2>{abschnitt.titel}</h2>
          {abschnitt.bloecke.map((block, i) =>
            block.art === "absatz" ? (
              <p key={i}>{teile(block.teile)}</p>
            ) : block.art === "liste" ? (
              <ul key={i}>
                {block.punkte.map((punkt, j) => (
                  <li key={j}>{teile(punkt)}</li>
                ))}
              </ul>
            ) : (
              <Fragment key={i}>
                <h3>{block.frage}</h3>
                <p>{teile(block.antwort)}</p>
              </Fragment>
            ),
          )}
        </Fragment>
      ))}
    </section>
  );
}

/** Fließtext mit eingestreuten Verweisen — wie teileHtml() in start-inhalt.ts. */
function teile(stuecke: Teil[]) {
  return stuecke.map((stueck, i) =>
    typeof stueck === "string" ? (
      <Fragment key={i}>{stueck}</Fragment>
    ) : (
      <a key={i} href={stueck.ziel}>
        {stueck.text}
      </a>
    ),
  );
}

const START = startAusUrlFragment();

/**
 * Zuletzt offene Einsatz-Sammlung — damit ein Meldekopf-Tablet nach Neuladen,
 * Akku oder Browserneustart dort weitermacht, wo es war (Audit
 * „Arbeitsablauf", W5), statt auf der Startseite mit einem fremden Bogen als
 * oberster Karte (Audit „Stress", S2). Nur für einige Stunden: wer die
 * Sammlung vor Tagen zuletzt offen hatte, will heute eher den eigenen Bogen.
 */
const LETZTER_EINSATZ_SCHLUESSEL = "eeb.letzterEinsatz.v1";
const LETZTER_EINSATZ_FRIST_MS = 12 * 60 * 60 * 1000;

function letztenEinsatzMerken(id: string | null): void {
  try {
    if (id) localStorage.setItem(LETZTER_EINSATZ_SCHLUESSEL, JSON.stringify({ id, um: Date.now() }));
    else localStorage.removeItem(LETZTER_EINSATZ_SCHLUESSEL);
  } catch {
    /* Speicher voll oder gesperrt — dann eben nicht gemerkt */
  }
}

function letztenEinsatzLaden(): string | null {
  try {
    const roh = localStorage.getItem(LETZTER_EINSATZ_SCHLUESSEL);
    if (!roh) return null;
    const { id, um } = JSON.parse(roh) as { id?: string; um?: number };
    if (typeof id !== "string" || typeof um !== "number" || Date.now() - um > LETZTER_EINSATZ_FRIST_MS) return null;
    return einsaetzeLaden().some((s) => s.id === id) ? id : null;
  } catch {
    return null;
  }
}

/** „1 / 1 / 2 / 4" — die Stärke in der Kurzform des Bogens. */
function staerkeKurz(b: Erfassungsbogen): string {
  const s = staerke(b);
  return `${s.fuehrer} / ${s.unterfuehrer} / ${s.mannschaft} / ${s.gesamt}`;
}

/**
 * „12:36" für heute, „25.09., 12:36" für einen anderen Tag — ein drei Tage
 * alter Entwurf darf nicht wie von heute aussehen (Audit Runde 2, R2-O3).
 */
function uhrzeitMitTag(d: Date): string {
  const uhr = d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  return d.toDateString() === new Date().toDateString()
    ? uhr
    : `${d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}, ${uhr}`;
}

/** Was die App gerade zeigt — für den Browser-Verlauf (Zurück-Knopf, Audit „Fehler", E3). */
type Ansicht = { schritt: number; zeigeStart: boolean; einsatz: string | null; scanner: boolean };
function ansichtGleich(a: Ansicht, b: Ansicht): boolean {
  return a.schritt === b.schritt && a.zeigeStart === b.zeigeStart && a.einsatz === b.einsatz && a.scanner === b.scanner;
}

// Ein Segment-Teil aus dem Kaltstart darf nur einmal in den Sammelstand —
// StrictMode (Entwicklung) führt Mount-Effekte doppelt aus.
let startSegmentVerbraucht = false;
let startEmpfangVerbraucht = false;

/**
 * Auswahl der Einsatzart für den Anlege-Dialog. Die alte Abfrage über
 * `window.prompt` legte immer einen „Einsatz" an, obwohl sie „Einsatz/Übung"
 * versprach — mit einem eigenen Dialog ist die Wahl endlich möglich.
 */
const ART_WAHL = Object.entries(ART_LABEL).map(([wert, label]) => ({ wert, label }));

// Der automatisch gesicherte Entwurf — Autosave überlebt geschlossene Tabs,
// leere Akkus und vom System beendete Apps (siehe entwurf.ts).
const ENTWURF_GESPEICHERT = entwurfLaden();

/**
 * Kaltstart MIT Bogen aus der URL (geteilter Link, QR mit Kamera-App). Sofort
 * geöffnet wird er nur, wenn nichts zu schützen und nichts zu wählen ist: kein
 * angefangener Bogen, keine Sammlung. Sonst läuft er nach dem Mounten
 * denselben Weg wie ein Link bei offener App (`uebernimmBogen`): erst „Wohin
 * damit?" bzw. die Rückfrage zum angefangenen Bogen, dann verdrängen.
 *
 * Vorher wanderte der eigene Entwurf schon beim Laden des Moduls auf den
 * Rückholplatz — ein dort liegender Bogen war gelöscht, bevor irgendein
 * Dialog erschien, und „Abbrechen" stellte nichts wieder her (Audit Runde 3,
 * R3-D2).
 */
const START_SOFORT: Erfassungsbogen | null =
  START.bogen && !(ENTWURF_GESPEICHERT && bogenHatInhalt(ENTWURF_GESPEICHERT.bogen)) && einsaetzeLaden().length === 0
    ? START.bogen
    : null;
/** Bogen aus dem Start-Link, der erst nach dem Mounten (mit Rückfrage) übernommen wird. */
const START_EMPFANG: Erfassungsbogen | null = START.bogen && !START_SOFORT ? START.bogen : null;
const ENTWURF = START_SOFORT ? null : ENTWURF_GESPEICHERT;

// Nach einem Neuladen stellte der Browser die alte Scrollposition wieder her
// — die Startseite stand dann 1 100 px unter der Entwurfskarte mit
// „Fortsetzen", und der Bogen schien verloren (Audit Runde 2, R2-H3). Die App
// führt ihre Ansichten selbst; jede beginnt oben.
try {
  if (typeof history !== "undefined" && "scrollRestoration" in history) history.scrollRestoration = "manual";
} catch {
  /* ohne Verlauf (Tests) */
}

/** Sammlung, für die der wiederhergestellte Entwurf erfasst wurde — falls es sie noch gibt. */
function erfassungsZielBeimStart(): string | null {
  const id = ENTWURF?.fremd?.einsatzId;
  return id && einsaetzeLaden().some((s) => s.id === id) ? id : null;
}

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

/**
 * Richtung des letzten Schrittwechsels: `"vor"` oder `"zurueck"`.
 *
 * Reine Anzeigehilfe für die Bewegung in `.schritt-inhalt` — beim ersten Malen
 * (und beim Sprung eines geöffneten Bogens direkt in die Übersicht) gilt
 * „vor", weil es nichts gibt, wovon zurückgegangen worden wäre.
 */
function useSchrittRichtung(schritt: number) {
  // Als Zustand, nicht als Ref: eine Ref, die beim Rendern beschrieben wird,
  // ist im StrictMode nach dem zweiten Durchlauf schon nachgeführt — der
  // Rücksprung meldete sich dann als Vorwärtsschritt.
  const [stand, setStand] = useState({ schritt, richtung: "vor" });
  if (stand.schritt !== schritt) {
    setStand({ schritt, richtung: schritt < stand.schritt ? "zurueck" : "vor" });
  }
  return stand.richtung;
}

function AppInhalt() {
  const [bogen, setBogen] = useState<Erfassungsbogen | null>(START_SOFORT ?? ENTWURF?.bogen ?? null);
  /**
   * Kennung der gespeicherten Vorlage, die der offene Bogen gerade bearbeitet
   * („Bearbeiten" auf der Vorlagenkarte). Solange sie gesetzt ist, bietet die
   * Übersicht „Vorlage aktualisieren" statt „Als Vorlage speichern" an, und
   * jeder Weg, der den Bogen ersetzt oder schließt, löst die Verbindung. Sie
   * wandert mit dem Entwurf in den Speicher, damit sie einen Neustart überlebt.
   */
  const [vorlageInBearbeitung, setVorlageInBearbeitung] = useState<string | null>(ENTWURF?.vorlageId ?? null);
  /**
   * Der offene Bogen ist keine eigene Meldung, sondern die Erfassung einer
   * fremden Einheit am Meldekopf („Einheit schnell erfassen", „Einheit manuell
   * erfassen…"). Sie darf den eigenen Bogen nie aus der Rückholung verdrängen
   * (entwurf.ts, `rueckholungNimmt`) und wird nach dem Ablegen geschlossen.
   * Wandert mit dem Entwurf in den Speicher.
   */
  const [fremdeErfassung, setFremdeErfassung] = useState<boolean>(!!ENTWURF?.fremd);
  /**
   * Beginn der fremden Erfassung (Date.now()). Bleibt „Eingetroffen um" leer
   * und liegen bis zur Übernahme mehr als fünf Minuten dazwischen, fragt die
   * App, welche Zeit gilt — sonst wurde die Unterbrechung zur Eintreffzeit
   * (Audit Runde 3, R3-S6). Wandert mit `fremd` in den Entwurf.
   */
  const [erfassungBeginn, setErfassungBeginn] = useState<number | null>(ENTWURF?.fremd?.beginn ?? null);
  /** Letzte Übergabe des offenen Bogens (R2-W2, uebergabe-stand.ts). */
  const [uebergabe, setUebergabe] = useState<UebergabeStand | null>(ENTWURF?.uebergabe ?? null);
  // „Fortsetzen" öffnet den Schritt, auf dem gearbeitet wurde — nicht immer
  // die Übersicht mit acht gelben Punkten (Audit Runde 2, R2-N7).
  const [schritt, setSchritt] = useState(START_SOFORT ? UEBERSICHT : ENTWURF ? (ENTWURF.schritt ?? UEBERSICHT) : 0);
  const richtung = useSchrittRichtung(schritt);
  const offline = useOfflineStand();
  // Schrittwechsel (Weiter, Zurück, Schrittleiste, Prüfpunkt): der neue
  // Schritt beginnt oben. Vorher blieb die Scrollposition des vorigen stehen,
  // und Schritt 2 bis 4 öffneten mitten im Formular — Ort/Auftrag, die
  // Personal-Betriebsart oder der Fahrzeugtyp lagen über dem Bildrand und
  // wurden übersprungen (Audit Runde 2, R2-H1). Der Fokus geht auf die
  // Überschrift, nicht ins erste Feld: keine aufspringende Tastatur, und
  // Vorlesesoftware sagt, wo man jetzt ist.
  const vorigerSchritt = useRef(schritt);
  // Ziel eines Prüfpunkts („antippen zum Beheben"): Feld statt Schrittanfang (R2-H2).
  const zielFeld = useRef<string | null>(null);
  const geheZuFeld = (s: number, feld?: string) => {
    zielFeld.current = feld ?? null;
    setSchritt(s);
  };
  useEffect(() => {
    if (vorigerSchritt.current === schritt) return;
    vorigerSchritt.current = schritt;
    const feld = zielFeld.current ? document.getElementById(zielFeld.current) : null;
    zielFeld.current = null;
    if (feld) {
      // Mitte des Bildes: die Beschriftung darüber bleibt sichtbar, der Kopf verdeckt nichts.
      feld.scrollIntoView?.({ block: "center" });
      feld.focus({ preventScroll: true });
      return;
    }
    try {
      window.scrollTo(0, 0);
    } catch {
      /* Testumgebung ohne Layout */
    }
    const kopf = document.querySelector<HTMLElement>(".schritt-inhalt h2");
    if (kopf) {
      kopf.tabIndex = -1;
      kopf.focus({ preventScroll: true });
    }
  }, [schritt]);
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
  // Zuletzt verdrängter Arbeitsbogen (entwurf.ts): Solange er hier steht,
  // bietet die Startseite ihn zum Zurückholen an.
  const [ersetzterEntwurf, setErsetzterEntwurf] = useState<Entwurf | null>(() => ersetztenEntwurfLaden());
  // Zeigt den Startbildschirm, ohne den aktuellen Bogen zu verwerfen –
  // er lässt sich von dort per „Aktuellen Bogen fortsetzen“ wieder öffnen.
  const [zeigeStart, setZeigeStart] = useState(!START_SOFORT && !!ENTWURF);
  const [vorlagen, setVorlagen] = useState<Vorlage[]>(() => vorlagenLaden());
  /** Vorige Fassung nach „Vorlage aktualisieren" — für „Rückgängig" (R2-D2). */
  const [vorlageRueckweg, setVorlageRueckweg] = useState<Vorlage | null>(null);
  // Absenderkarte (Gerätestand) — auch auf der Startseite einstellbar; die
  // Übersicht liest sie beim Mounten erneut aus dem Speicher.
  const [absender, setAbsender] = useState<Absenderkarte>(() => absenderkarteLaden());
  const [musterVorlage, setMusterVorlage] = useState<Vorlage | null>(null);
  // Einsatz-Sammlung (Meldekopf/Zugführer): Liste, offener Einsatz und das
  // Sammelziel für hereinkommende Bögen (Scan/manuell landen dort statt zu öffnen).
  const [einsaetze, setEinsaetze] = useState<Einsatzsammlung[]>(() => einsaetzeLaden());
  // Beim Kaltstart ohne Link die zuletzt offene Sammlung wieder öffnen (W5).
  const [offenerEinsatzId, setOffenerEinsatzIdRoh] = useState<string | null>(() =>
    START.bogen || START.segment || START.vorlage ? null : letztenEinsatzLaden(),
  );
  const setOffenerEinsatzId = (id: string | null) => {
    setOffenerEinsatzIdRoh(id);
    letztenEinsatzMerken(id);
  };
  // Was beim letzten Export des offenen Einsatzes schon in der Sammlung stand
  // (export-stand.ts) — die Detailansicht zählt daran ab, was seitdem neu ist.
  const [exportStand, setExportStand] = useState<ExportStand | null>(null);
  // Alle Bögen oder nur die neuen: liegt hier statt in der Detailansicht, weil
  // die beim Erfassen einer Einheit (Assistent übernimmt) aus- und wieder
  // eingehängt wird — ein angekreuztes Kästchen, das dabei zurückspränge,
  // läse sich als Fehler. Vorgabe bleibt der Gesamtexport, und ein anderer
  // Einsatz beginnt wieder damit: dem Stab darf nicht versehentlich etwas fehlen.
  const [exportUmfang, setExportUmfang] = useState<ExportUmfang>("alle");
  const letzterExportEinsatz = useRef<string | null>(null);
  useEffect(() => {
    if (!offenerEinsatzId) return; // Assistent zwischendurch — die Wahl wartet auf die Rückkehr
    setExportStand(exportStandLaden(offenerEinsatzId));
    if (letzterExportEinsatz.current !== offenerEinsatzId) setExportUmfang("alle");
    letzterExportEinsatz.current = offenerEinsatzId;
  }, [offenerEinsatzId]);
  /**
   * Welche Zeile der Einheitenliste gehört zum gerade aufgenommenen Bogen?
   * Die Stärke-Leiste quittiert die geänderte Summe, die Rückmeldezeile nennt
   * den Namen — aber die Liste, auf der nach dem Scan der Blick liegt, sagt
   * ohne diese Marke nichts. Der Zähler unterscheidet zwei Aufnahmen derselben
   * Einheit: bei einer Folgemeldung ändert sich eine bestehende Zeile still.
   */
  const [eingang, setEingang] = useState<Eingang | null>(null);
  /**
   * Die gerade eingescannte Vorlage. Der Startbildschirm listet sie im selben
   * Augenblick; zwischen den vorhandenen Vorlagen fiele sie sonst nicht auf.
   */
  const [frischeVorlageId, setFrischeVorlageId] = useState<string | null>(null);
  const eingangZaehler = useRef(0);
  /** Merkt die Zeile zum gerade aufgenommenen Bogen vor (siehe `eingang`). */
  function markiereEingang(schluessel: string) {
    eingangZaehler.current += 1;
    setEingang({ schluessel, nonce: eingangZaehler.current });
  }
  // Nach einem Neustart mitten in einer Erfassung für eine Sammlung geht es
  // dort weiter, statt die fremde Einheit als eigenen Bogen zu zeigen (R2-E3).
  /** Grund, aus dem das letzte Ablegen in eine Sammlung scheiterte (voller Speicher o. ä.). */
  const ablageFehler = useRef<string | null>(null);
  const [sammelZielId, setSammelZielId] = useState<string | null>(() => erfassungsZielBeimStart());
  // Sammelziel zusätzlich als Ref: der laufende (asynchrone) Scan-Loop und die
  // Scanner-Callbacks lesen sonst einen veralteten Closure-Stand.
  const sammelZielRef = useRef<string | null>(sammelZielId);
  const setSammelZiel = (id: string | null) => {
    sammelZielRef.current = id;
    setSammelZielId(id);
  };
  // Auswahl „In Einsatz aufnehmen" aus der Übersicht heraus.
  const einsatzWahlDialog = useRef<HTMLDialogElement>(null);
  // Stapel-Einlesen vieler QR-Bilder: laufender Stand und der Bericht danach.
  // Der Abbruch als Ref, weil die laufende Schleife sonst den alten Stand sieht.
  const [stapelStand, setStapelStand] = useState("");
  const [stapelBericht, setStapelBericht] = useState<string[]>([]);
  const stapelAbbruchRef = useRef(false);
  // Kiosk-Scan (Meldekopf): Zähler der in diesem Durchgang aufgenommenen Bögen.
  const kioskZaehlerRef = useRef(0);
  // Segmentierung: gesammelte Teile eines großen Bogens (Zustand als Ref, damit
  // der laufende Kamera-/Native-Scan darauf zugreift) + Fortschrittstext fürs Overlay.
  const segmentTeileRef = useRef<SegmentTeil[]>([]);
  // Dasselbe fürs Rendern: der Sammelstand speist die Kästchenzeile
  // (TeilQuittung), und liegen Teile eines noch UNvollständigen Bogens im
  // Speicher, nimmt Schließen tatsächlich etwas zurück — das steht dann auch
  // auf dem Knopf (siehe Kiosk-Scanner weiter unten).
  const [segmentStand, setSegmentStand] = useState<SegmentTeil[]>([]);
  const segmenteOffen = segmentStand.length > 0;
  const setzeSegmentTeile = (teile: SegmentTeil[]) => {
    segmentTeileRef.current = teile;
    setSegmentStand(teile);
  };
  const [scanFortschritt, setScanFortschritt] = useState("");
  // Nacherfassung vom Papier: Uhrzeit vom Meldeblock, leer = Zeit der Übernahme (R2-A5).
  const [nachEintreffzeit, setNachEintreffzeit] = useState("");

  const vorlagenNeuLaden = () => setVorlagen(vorlagenLaden());
  const einsaetzeNeuLaden = () => setEinsaetze(einsaetzeLaden());

  // Browser-Verlauf: Jeder Ansichtswechsel (Schritt, Startseite, Einsatz,
  // Scanner) bekommt einen Verlaufseintrag, damit „Zurück" — auf Android der
  // Hardware-Knopf — innerhalb der App bleibt, statt sie zu verlassen (Audit
  // „Fehler und Wiederanlauf", E3). Ein Rücksprung aus dem Verlauf stellt die
  // gemerkte Ansicht wieder her und legt selbst keinen neuen Eintrag an.
  const ansichtRef = useRef<Ansicht | null>(null);
  const verlaufZielRef = useRef<Ansicht | null>(null);
  // Ohne Bogen IST die Startseite zu sehen, auch bei zeigeStart = false. Vorher
  // galten Startseite und Schritt 1 deshalb als dieselbe Ansicht: „Neuen Bogen
  // erstellen" legte keinen Verlaufseintrag an, und Zurück aus Schritt 1
  // verließ die App (Audit Runde 2, R2-H5).
  const startSichtbar = zeigeStart || !bogen;
  useEffect(() => {
    const jetzt: Ansicht = { schritt, zeigeStart: startSichtbar, einsatz: offenerEinsatzId, scanner: scannerOffen };
    const vorher = ansichtRef.current;
    ansichtRef.current = jetzt;
    if (typeof history === "undefined") return;
    if (!vorher) {
      history.replaceState({ ...(history.state ?? {}), eeb: jetzt }, "");
      return;
    }
    if (ansichtGleich(vorher, jetzt)) return;
    if (verlaufZielRef.current && ansichtGleich(verlaufZielRef.current, jetzt)) {
      verlaufZielRef.current = null; // Rücksprung angekommen — kein neuer Eintrag
      return;
    }
    verlaufZielRef.current = null;
    history.pushState({ eeb: jetzt }, "");
  }, [schritt, startSichtbar, offenerEinsatzId, scannerOffen]);
  useEffect(() => {
    function beiVerlauf(e: PopStateEvent) {
      const ziel = (e.state as { eeb?: Ansicht } | null)?.eeb;
      if (!ziel) return;
      verlaufZielRef.current = ziel;
      setSchritt(ziel.schritt);
      setZeigeStart(ziel.zeigeStart);
      setOffenerEinsatzIdRoh(ziel.einsatz);
      letztenEinsatzMerken(ziel.einsatz);
      if (!ziel.scanner && scannerOffenRef.current) scanAbbrechen(!!sammelZielRef.current);
      else if (ziel.scanner && !scannerOffenRef.current && !istNativ()) setScannerOffen(true);
    }
    window.addEventListener("popstate", beiVerlauf);
    return () => window.removeEventListener("popstate", beiVerlauf);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nur einmal registrieren; Handler nutzt Refs und stabile Setter
  }, []);
  const scannerOffenRef = useRef(false);
  scannerOffenRef.current = scannerOffen;

  // Entwurfssicherung: jede Änderung still sichern; wird der Bogen bewusst
  // geschlossen (Neuer Bogen, Übernahme in einen Einsatz), fällt der Entwurf weg.
  // Der Zeitstempel speist die sichtbare „automatisch gespeichert"-Anzeige —
  // sie nimmt die Angst, dass Eingaben bei Akku/Abbruch verloren gehen.
  const [gespeichertUm, setGespeichertUm] = useState<Date | null>(null);
  // Wahrheit statt Beruhigung: Schlägt das Sichern fehl (Speicher voll), sagt
  // die Zeile das — die alte Anzeige behauptete „gespeichert", während nichts
  // gespeichert war (Audit „Offline und Speicher", O1).
  const [speicherFehler, setSpeicherFehler] = useState(false);
  // „gespeichert" ist der Zeitpunkt der letzten ÄNDERUNG des Bogens: Bloßes
  // Öffnen oder ein Schrittwechsel verschob ihn bisher auf „jetzt", und ein
  // drei Tage alter Entwurf stand als „gespeichert 12:36 Uhr" da (R2-O3).
  const bogenGespeichert = useRef<{ bogen: Erfassungsbogen | null; um: number }>({
    bogen: ENTWURF?.bogen ?? null,
    um: ENTWURF?.gespeichert ?? Date.now(),
  });
  // Zweites Fenster mit demselben Bogen oder derselben Sammlung (R2-O4).
  const fenster = useFensterAbgleich(!!bogen, einsaetzeNeuLaden);
  useEffect(() => {
    if (bogen) {
      const merk = bogenGespeichert.current;
      if (merk.bogen !== bogen) {
        merk.bogen = bogen;
        merk.um = Date.now();
      }
      const ok = entwurfSpeichern(
        bogen,
        {
          vorlageId: vorlageInBearbeitung ?? undefined,
          fremd: fremdeErfassung ? { einsatzId: sammelZielId ?? undefined, beginn: erfassungBeginn ?? undefined } : undefined,
          schritt,
          uebergabe: uebergabe ?? undefined,
        },
        merk.um,
      );
      setSpeicherFehler(!ok);
      if (ok) setGespeichertUm(new Date(merk.um));
    } else {
      bogenGespeichert.current = { bogen: null, um: Date.now() };
      entwurfVerwerfen();
      setGespeichertUm(null);
      setSpeicherFehler(false);
    }
  }, [bogen, vorlageInBearbeitung, fremdeErfassung, sammelZielId, erfassungBeginn, schritt, uebergabe, fenster.runde]);

  /**
   * Die Vorlage zum offenen Bogen — nur solange sie noch in der Liste steht.
   * Landet sie zwischendurch im Papierkorb, ist der Bogen bis zur
   * Wiederherstellung ein gewöhnlicher Arbeitsbogen (die Kennung bleibt).
   */
  const bearbeiteteVorlage = vorlageInBearbeitung
    ? vorlagen.find((v) => v.id === vorlageInBearbeitung) ?? null
    : null;

  // Akzentfarbe der Oberfläche der Organisation des offenen Bogens anpassen —
  // ohne Bogen (Startseite/Einsatzansicht) das Standard-Blau. So sieht man
  // schon an der Farbe, in welcher Organisation man gerade unterwegs ist.
  // Die Einsatzansicht bleibt neutral, auch wenn im Hintergrund ein eigener
  // Bogen offen ist: nach einer Feuerwehr-Schnellerfassung standen Kopf und
  // Gesamtzahl der Lage feuerrot da — in der Führungsstelle ein Warnsignal
  // (Audit Runde 2, R2-K8).
  const einsatzAnsicht = offenerEinsatzId != null && !musterVorlage;
  useEffect(() => {
    wendeOrgAkzentAn(einsatzAnsicht ? undefined : bogen?.einheit.organisation);
  }, [bogen?.einheit.organisation, einsatzAnsicht]);

  async function musterungFertig(neuerArbeitsbogen: Erfassungsbogen) {
    if (!(await darfBogenErsetzen({ titel: "Bogen aus Vorlage anlegen?", was: "den Bogen aus der Vorlage", ok: "Aus Vorlage anlegen" }))) return;
    setBogen(neuerArbeitsbogen);
    setzeEmpfang(null);
    setSchritt(SCHRITT_EINSATZ);
    setMusterVorlage(null);
    setZeigeStart(false);
    setMeldung("");
  }

  /**
   * Bogen aus einer Datei öffnen. Der Regelfall ist heute die PDF, die die App
   * selbst erzeugt: Sie trägt den Bogen als eingebettete Daten (wie eine
   * E-Rechnung) und zusätzlich als QR-Code. Die blanke JSON-Datei bleibt
   * lesbar, ist aber nur noch der Altweg — weitergereicht wird die PDF.
   *
   * Eine Vorlagen-Datei („Vorlage teilen → Als Datei speichern") landet in den
   * Vorlagen, nicht im Arbeitsbogen — sie wird deshalb vor der Rückfrage
   * erkannt, die den offenen Bogen schützt: der bleibt dabei unberührt.
   */
  async function ladeDatei(e: ChangeEvent<HTMLInputElement>) {
    const datei = e.target.files?.[0];
    e.target.value = "";
    if (!datei) return;
    setFehler(""); // eine Meldung gehört zur letzten Handlung, nicht zur vorletzten (E6)
    if (!istPdfDatei(datei)) {
      try {
        const vorlage = vorlageAusDatei(await datei.text());
        if (vorlage) {
          const v = vorlageAnlegen(vorlage.name, vorlage.bogen);
          vorlageEingegangen(v);
          setMeldung(`Vorlage „${v.name}" importiert.`);
          return;
        }
      } catch (err) {
        setFehler(await dateiFehlerMeldung(datei, err, "bogen")); // nie Parser-Text (R2-E5)
        return;
      }
    }
    // Erst lesen und prüfen, dann fragen und verdrängen: Die Rückfrage kam
    // vor dem Lesen, auch bei einer abgeschnittenen JSON oder einem Foto —
    // und nach „Datei öffnen" lag eine Kopie des offenen Bogens auf dem
    // Rückholplatz, der dort liegende Bogen war gelöscht, geöffnet wurde
    // nichts (Audit Runde 3, R3-E2). Eine unbrauchbare Datei meldet sich
    // jetzt ohne Rückfrage und lässt beide Plätze unberührt.
    let geladen: { bogen: Erfassungsbogen; anonymisiert: boolean };
    let anzahl = 1;
    try {
      if (istPdfDatei(datei)) {
        const bytes = new Uint8Array(await datei.arrayBuffer());
        const boegen = boegenAusPdfBytes(bytes);
        if (boegen.length === 0) {
          // QR-Rückfall: Er läuft über `uebernimmBogen`, das selbst fragt.
          await ladePdfQr(bytes);
          return;
        }
        geladen = bogenNachFrist(boegen[0]!);
        anzahl = boegen.length;
      } else {
        geladen = bogenNachFrist(await bogenLaden(datei));
      }
    } catch (err) {
      setFehler(await dateiFehlerMeldung(datei, err, "bogen")); // nie Parser-Text (R2-E5)
      return;
    }
    if (!(await darfBogenErsetzen({ titel: "Bogen aus Datei öffnen?", was: "den Bogen aus der Datei", ok: "Datei öffnen" }))) return;
    const b = geladen.bogen;
    setBogen(b);
    setzeEmpfang(null); // Datei-Import: kein signierter Transport
    setSchritt(UEBERSICHT);
    setZeigeStart(false);
    setFehler("");
    // Sammel-PDF eines Meldekopfs: hier lässt sich nur EIN Bogen öffnen —
    // wer alle will, ist beim Einsatz-Import richtig, statt die PDF als
    // „ging nicht" abzulegen.
    setMeldung(
      [
        geladen.anonymisiert ? FRIST_ABGELAUFEN_MELDUNG : "",
        anzahl > 1
          ? `Die PDF enthält ${anzahl} Bögen — geöffnet ist „${einheitAnzeigename(b.einheit)}". Alle auf einmal: „Einsatz importieren…".`
          : "",
        eigenerBogenWartetHinweis(),
      ]
        .filter(Boolean)
        .join(" "),
    );
  }

  /**
   * PDF ohne eingebettete Daten: die QR-Codes der PDF auswerten — für
   * Ausdrucke, die durch ein fremdes Werkzeug gelaufen sind und ihre Anhänge
   * verloren haben. Das ist derselbe Weg wie beim Scannen, inklusive
   * Signaturprüfung, mehrteiliger Codes (die Teile stehen alle in derselben
   * PDF) und der Rückfrage zum offenen Bogen.
   */
  async function ladePdfQr(bytes: Uint8Array) {
    // Dynamisch: die QR-Auswertung zieht den Decoder (ZXing als WebAssembly)
    // nach — der gehört nicht ins Start-Bundle, sondern erst in den Rückfall.
    const { qrTexteAusPdfBytes } = await import("./pdf-qr");
    const texte = await qrTexteAusPdfBytes(bytes);
    if (texte.length === 0) {
      throw new Error(
        "In dieser PDF steckt kein Erfassungsbogen — weder eingebettete Daten noch ein lesbarer QR-Code. " +
          "Stammt die PDF aus einem Scanner (abfotografiertes Papier), hilft „QR-Code scannen…“ bzw. ein Foto des Codes.",
      );
    }
    for (const text of texte) {
      // Mehrteilige Bögen: jeder Teil wandert in denselben Sammelstand wie beim
      // Scannen; fertig ist es, sobald ein Teil den Bogen vervollständigt.
      if (await uebernehmeText(text, "Der QR-Code in der PDF enthält keinen gültigen Erfassungsbogen.", { ohneKiosk: true })) return;
    }
    // Unvollständig: der Fortschritt („es fehlt noch Teil x") steht bereits.
  }

  /**
   * Den angefangenen Bogen direkt von der Startseite aus wegwerfen — das
   * Gegenstück zu „Fortsetzen". Ohne diesen Weg müsste man den Entwurf erst
   * öffnen, um ihn in der Übersicht zu verwerfen. Anders als bei Vorlagen und
   * Einsätzen gibt es für den Entwurf keinen Papierkorb, deshalb die Rückfrage.
   */
  /**
   * Den offenen Bogen merken, der gerade seinen Platz räumt — und die
   * Startseite darüber in Kenntnis setzen. Rückgabe false: nicht gemerkt,
   * weil eine fremde Erfassung den eigenen Bogen aus der Rückholung verdrängt
   * hätte (dann ist die Erfassung verworfen, siehe `folgenFuerOffenenBogen`).
   */
  function merkeVerdraengt(b: Erfassungsbogen, opt: { tausch?: boolean } = {}): boolean {
    const alt = opt.tausch ? null : ersetztenEntwurfLaden();
    // Bearbeitung einer gespeicherten Vorlage (R3-D1): Unverändert ist sie
    // nichts wert — die Vorlage liegt ja gespeichert vor. Verändert darf sie
    // wie eine fremde Erfassung keinen eigenen Bogen vom Rückholplatz
    // schieben: Dort lag nach „Vorlage bearbeiten" → „Verwerfen" die
    // unveränderte Vorlagen-Kopie, der echte Einsatzbogen war gelöscht.
    if (bearbeiteteVorlage && (vorlageUnveraendert(b) || !rueckholungNimmt(true, alt))) return false;
    // Derselbe Bogen liegt schon dort: keine Kopie über sich selbst (R3-E2).
    if (alt && JSON.stringify(alt.bogen) === JSON.stringify(b)) return true;
    const ok = ersetztenEntwurfMerken(
      b,
      fremdeErfassung ? { einsatzId: sammelZielId ?? undefined, beginn: erfassungBeginn ?? undefined } : undefined,
      opt,
    );
    if (ok) setErsetzterEntwurf(ersetztenEntwurfLaden());
    return ok;
  }

  /** Steht im offenen Bogen noch genau der gespeicherte Stand der bearbeiteten Vorlage? */
  function vorlageUnveraendert(b: Erfassungsbogen | null = bogen): boolean {
    return !!b && !!bearbeiteteVorlage && JSON.stringify(b) === JSON.stringify(bearbeiteteVorlage.bogen);
  }

  /**
   * Unterscheidungsmerkmal für Rückfragen, in denen zwei Bögen mit demselben
   * Namen stehen können (eigener Bogen und Vorlage derselben Einheit, R3-D1):
   * Personen und Einsatzort.
   */
  function bogenMerkmal(b: Erfassungsbogen): string {
    const ort = b.einsatz.ortAuftrag.trim();
    return [
      b.personal.length > 0 ? `${b.personal.length} ${b.personal.length === 1 ? "Person" : "Personen"}` : "",
      ort ? `„${ort.length > 40 ? `${ort.slice(0, 39)}…` : ort}"` : "",
    ]
      .filter(Boolean)
      .join(" · ");
  }

  /**
   * Was mit dem offenen Bogen passiert, wenn er seinen Platz räumt — in einem
   * Satz für die Rückfrage, und ob dabei etwas endgültig verloren geht. Die
   * alte Rückfrage versprach immer „bleibt erreichbar", auch wenn der Bogen
   * auf dem Rückholplatz dabei überschrieben wurde (R2-N1/R2-E1).
   */
  function folgenFuerOffenenBogen(opt: { tausch?: boolean } = {}): { satz: string; verlust: boolean } {
    if (!bogen) return { satz: "", verlust: false };
    const name = einheitAnzeigename(bogen.einheit);
    const alt = opt.tausch ? null : ersetztenEntwurfLaden();
    const altName = alt ? einheitAnzeigename(alt.bogen.einheit) : "";
    const altZaehlt = !!alt && bogenHatInhalt(alt.bogen);
    const altMerkmal = alt ? bogenMerkmal(alt.bogen) : "";
    // Bearbeitung einer gespeicherten Vorlage (R3-D1): Die Vorlage selbst
    // bleibt, wie sie gespeichert ist; es geht höchstens um nicht übernommene
    // Änderungen. Ein eigener Bogen auf dem Rückholplatz bleibt dort.
    if (bearbeiteteVorlage) {
      const eigenerWartet =
        alt && !alt.fremd && altZaehlt
          ? ` Dein Bogen „${altName}"${altMerkmal ? ` (${altMerkmal})` : ""} bleibt auf der Startseite zurückholbar.`
          : "";
      if (vorlageUnveraendert()) {
        return { satz: `Die Vorlage „${bearbeiteteVorlage.name}" bleibt unverändert gespeichert.${eigenerWartet}`, verlust: false };
      }
      if (!rueckholungNimmt(true, alt)) {
        return {
          satz: `Nicht mit „Vorlage aktualisieren" übernommene Änderungen gehen verloren, die Vorlage „${bearbeiteteVorlage.name}" bleibt in ihrer gespeicherten Fassung.${eigenerWartet}`,
          verlust: true,
        };
      }
    }
    if (fremdeErfassung && !rueckholungNimmt(true, alt)) {
      return {
        satz: `Sie ist noch in keiner Sammlung und wird verworfen. Dein eigener Bogen „${altName}" bleibt auf der Startseite zurückholbar.`,
        verlust: true,
      };
    }
    const bleibt = `„${name}" bleibt auf der Startseite unter „Zuletzt verdrängten Bogen zurückholen" erreichbar.`;
    if (!altZaehlt) return { satz: bleibt, verlust: false };
    const stand = new Date(alt.gespeichert).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
    return {
      satz: `${bleibt} ${alt.fremd ? "Die" : "Der"} dort bisher liegende ${alt.fremd ? "Erfassung" : "Bogen"} „${altName}" (Stand ${stand} Uhr${altMerkmal ? ` · ${altMerkmal}` : ""}) wird dabei endgültig gelöscht.`,
      verlust: true,
    };
  }

  /** Satz für Quittungen: wo der eigene Bogen liegt, wenn er in der Rückholung wartet. */
  function eigenerBogenWartetHinweis(): string {
    const r = ersetztenEntwurfLaden();
    return r && !r.fremd && bogenHatInhalt(r.bogen)
      ? `Dein eigener Bogen „${einheitAnzeigename(r.bogen.einheit)}" liegt auf der Startseite unter „Zuletzt verdrängten Bogen zurückholen".`
      : "";
  }

  /**
   * Wächter vor jedem Wechsel des Arbeitsbogens.
   *
   * Die App führt genau einen Bogen. Wege wie „Neuen Bogen erstellen", „Aus
   * Datei laden", ein eintreffender Scan oder „Einheit erfassen" aus einer
   * Sammlung setzten sich bisher wortlos an dessen Stelle — der halb erfasste
   * eigene Bogen war weg, ohne Frage und ohne Rückweg, während „Verwerfen" im
   * selben Produkt sauber nachfragt. Hier steht deshalb beides: die Frage und
   * die Rückholung (siehe `ersetztenEntwurfMerken`).
   *
   * Ein unberührter Bogen (nur Vorgaben) löst keine Frage aus; sonst stünde
   * sie ständig im Weg und würde weggetippt. `ohneFrage`: der Aufrufer hat
   * schon gefragt. `tausch`: die Rückholung wird gerade geleert (Zurückholen).
   */
  async function darfBogenErsetzen(a: {
    titel: string;
    was: string;
    ok: string;
    ohneFrage?: boolean;
    tausch?: boolean;
  }): Promise<boolean> {
    // Was auch immer den Bogen ersetzt: die Bearbeitung einer Vorlage ist es
    // danach nicht mehr — der verdrängte Bogen wird zum gewöhnlichen Entwurf.
    // Ebenso endet eine Aufnahme für eine Sammlung: Wer danach „Neuen Bogen
    // erstellen" tippte, erbte Kopf, Marke und „In Einsatz übernehmen" der
    // eben abgebrochenen Erfassung, und der eigene Bogen landete mit einem
    // Tipp in der fremden Sammlung (Audit Runde 3, R3-S2). Wege, die wieder
    // für eine Sammlung erfassen, setzen das Ziel danach neu.
    if (!bogen || !bogenHatInhalt(bogen)) {
      if (!a.tausch && !(await anderesFensterFreigeben(a))) return false;
      setVorlageInBearbeitung(null);
      setFremdeErfassung(false);
      setSammelZiel(null);
      setErfassungBeginn(null);
      return true;
    }
    if (!a.ohneFrage) {
      const folgen = folgenFuerOffenenBogen({ tausch: a.tausch });
      const ja = await frageJaNein({
        titel: a.titel,
        text: `${
          bearbeiteteVorlage
            ? `Die Bearbeitung der Vorlage „${bearbeiteteVorlage.name}"`
            : `${fremdeErfassung ? "Die angefangene Erfassung" : "Der angefangene Bogen"} „${einheitAnzeigename(bogen.einheit)}"`
        } wird durch ${a.was} ersetzt. ${folgen.satz}`,
        ok: a.ok,
        gefahr: folgen.verlust,
      });
      if (!ja) return false;
    }
    merkeVerdraengt(bogen, { tausch: a.tausch });
    setVorlageInBearbeitung(null);
    setFremdeErfassung(false);
    setSammelZiel(null);
    setErfassungBeginn(null);
    return true;
  }

  /**
   * Dieses Fenster hat keinen Bogen offen, im Speicher steht aber der Entwurf
   * eines anderen Fensters (zweiter Tab, früher geöffnet). Vorher legte dieser
   * Tab ohne Frage einen neuen Bogen an und überschrieb den anderen Entwurf
   * mit dem nächsten Speichern (Audit Runde 3, R3-S3). Jetzt: Rückfrage mit
   * Namen, dann wandert der fremde Stand auf den Rückholplatz.
   */
  async function anderesFensterFreigeben(a: { titel: string; was: string; ok: string; ohneFrage?: boolean }): Promise<boolean> {
    const anderes = entwurfAusAnderemFenster();
    if (!anderes || !bogenHatInhalt(anderes.bogen)) return true;
    const name = einheitAnzeigename(anderes.bogen.einheit);
    const alt = ersetztenEntwurfLaden();
    const nimmt = rueckholungNimmt(!!anderes.fremd, alt);
    const altZaehlt = !!alt && bogenHatInhalt(alt.bogen);
    const folge = !nimmt
      ? ` Als Erfassung einer fremden Einheit wird sie dabei verworfen; dein Bogen „${einheitAnzeigename(alt!.bogen.einheit)}" bleibt zurückholbar.`
      : ` „${name}" bleibt auf der Startseite unter „Zuletzt verdrängten Bogen zurückholen" erreichbar.${
          altZaehlt ? ` Der dort bisher liegende Bogen „${einheitAnzeigename(alt!.bogen.einheit)}" wird dabei endgültig gelöscht.` : ""
        }`;
    if (!a.ohneFrage) {
      const stand = new Date(anderes.gespeichert).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
      const ja = await frageJaNein({
        titel: a.titel || "Bogen aus einem anderen Fenster",
        text: `In einem anderen Fenster ist „${name}" angefangen (Stand ${stand} Uhr). Er wird durch ${a.was || "den neuen Bogen"} ersetzt.${folge}`,
        ok: a.ok || "Ersetzen",
        gefahr: !nimmt || altZaehlt,
      });
      if (!ja) return false;
    }
    if (nimmt && ersetztenEntwurfMerken(anderes.bogen, anderes.fremd)) setErsetzterEntwurf(ersetztenEntwurfLaden());
    // Der nächste eigene Stand darf den fremden jetzt überschreiben — er liegt gesichert.
    entwurfUeberschreibenErlauben();
    return true;
  }

  /**
   * Gespeicherte Vorlage dauerhaft ändern: ihr Bogen kommt in den Assistenten,
   * die Übersicht schreibt ihn mit „Vorlage aktualisieren" zurück. Die
   * Musterung („Einsatz vorbereiten") lässt die Vorlage bewusst unangetastet —
   * bis hierher gab es keinen Weg, eine Vorlage inhaltlich zu ändern, außer
   * sie als neue Vorlage zu speichern und die alte zu löschen.
   */
  async function vorlageBearbeiten(v: Vorlage) {
    // Dieselbe Vorlage ist schon offen: weiterarbeiten statt die eigenen
    // Änderungen durch den gespeicherten Stand zu ersetzen.
    if (bogen && vorlageInBearbeitung === v.id) {
      setZeigeStart(false);
      setMeldung("");
      return;
    }
    if (!(await darfBogenErsetzen({ titel: "Vorlage bearbeiten?", was: `die Vorlage „${v.name}"`, ok: "Vorlage bearbeiten" }))) return;
    setBogen(structuredClone(v.bogen));
    setVorlageInBearbeitung(v.id);
    setzeEmpfang(null);
    setSchritt(0);
    setMusterVorlage(null);
    setOffenerEinsatzId(null);
    setZeigeStart(false);
    setFehler("");
    setMeldung(`Vorlage „${v.name}" wird bearbeitet — die Änderungen kommen in der Übersicht mit „Vorlage aktualisieren" in die Vorlage.`);
  }

  /**
   * Den bearbeiteten Bogen in die Vorlage zurückschreiben und den Arbeitsplatz
   * räumen. Vorher nennt eine Rückfrage, was sich an der Vorlage ändert, und
   * danach holt „Rückgängig" die vorige Fassung zurück: Mit „StAN-Sollplätze
   * laden" und „Vorlage aktualisieren" waren elf Namen der Vorlage sonst
   * dauerhaft weg (Audit Runde 2, R2-D2).
   */
  async function vorlageAktualisierenUndSchliessen() {
    if (!bogen || !vorlageInBearbeitung) return;
    const vorher = vorlagen.find((x) => x.id === vorlageInBearbeitung) ?? null;
    if (vorher) {
      const namen = (b: Erfassungsbogen) => b.personal.filter((p) => p.vorname.trim() || p.nachname.trim()).length;
      const zeile = (was: string, a: number, b: number) => (a === b ? `${was} ${a}` : `${was} ${a} → ${b}`);
      const ja = await frageJaNein({
        titel: `Vorlage „${vorher.name}" überschreiben?`,
        text: [
          zeile("Personen", vorher.bogen.personal.length, bogen.personal.length),
          zeile("davon mit Namen", namen(vorher.bogen), namen(bogen)),
          zeile("Fahrzeuge", vorher.bogen.fahrzeuge.length, bogen.fahrzeuge.length),
        ].join(" · ") + ". Die vorige Fassung lässt sich danach mit „Rückgängig“ zurückholen.",
        ok: "Vorlage aktualisieren",
        gefahr: namen(bogen) < namen(vorher.bogen),
      });
      if (!ja) return;
    }
    // Endgültig gelöscht, während der Bogen offen war: dann eben als neue
    // Vorlage — die Arbeit soll nicht ins Leere laufen.
    const v = vorlageAktualisieren(vorlageInBearbeitung, bogen)
      ?? vorlageAnlegen(bearbeiteteVorlage?.name ?? einheitAnzeigename(bogen.einheit), bogen);
    setVorlageRueckweg(vorher);
    setBogen(null); // löscht auch die Entwurfssicherung
    setVorlageInBearbeitung(null);
    setzeEmpfang(null);
    setSchritt(0);
    vorlagenNeuLaden();
    setFrischeVorlageId(v.id);
    setZeigeStart(true);
    setMeldung(`Vorlage „${v.name}" aktualisiert.`);
  }

  /** Den zuletzt verdrängten Bogen zurück in den Arbeitsplatz holen. */
  async function holeVerdraengtenZurueck() {
    const zurueck = ersetzterEntwurf;
    if (!zurueck) return;
    if (!(await darfBogenErsetzen({
      titel: "Verdrängten Bogen zurückholen?",
      was: `den Bogen „${einheitAnzeigename(zurueck.bogen.einheit)}"`,
      ok: "Zurückholen",
      tausch: true,
    }))) {
      return;
    }
    // Erst nach dem Wächter aufräumen: Er kann den gerade offenen Bogen selbst
    // in die Rückholung gelegt haben — dann steht dort jetzt der richtige.
    if (ersetztenEntwurfLaden()?.gespeichert === zurueck.gespeichert) {
      ersetztenEntwurfVerwerfen();
      setErsetzterEntwurf(null);
    }
    setBogen(zurueck.bogen);
    // Eine zurückgeholte Erfassung bleibt eine Erfassung — samt Sammlung, falls es sie noch gibt.
    const ziel = zurueck.fremd?.einsatzId;
    setFremdeErfassung(!!zurueck.fremd);
    setErfassungBeginn(zurueck.fremd?.beginn ?? null);
    setSammelZiel(ziel && einsaetzeLaden().some((x) => x.id === ziel) ? ziel : null);
    setzeEmpfang(null);
    setSchritt(UEBERSICHT);
    setOffenerEinsatzId(null);
    setZeigeStart(false);
    setFehler("");
    setMeldung(`Bogen „${einheitAnzeigename(zurueck.bogen.einheit)}" zurückgeholt.`);
  }

  async function entwurfWegwerfen() {
    if (!bogen) return;
    // Verworfen heißt nicht verloren: Der Bogen wandert in dieselbe Rückholung
    // wie ein verdrängter (Audit „Zerstörende Handlungen", D7) — wer nach
    // 14 Stunden „Verwerfen" statt „Fortsetzen" trifft, hat ihn morgen wieder.
    // Ausnahme: eine fremde Erfassung, die dort den eigenen Bogen verdrängen würde.
    const folgen = bogenHatInhalt(bogen) ? folgenFuerOffenenBogen() : { satz: "", verlust: false };
    // Vorlagen-Bearbeitung: „Verwerfen" heißt hier „Bearbeitung beenden" —
    // die Vorlage bleibt gespeichert, der eigene Bogen auf dem Rückholplatz
    // ebenso (R3-D1).
    const vorlage = bearbeiteteVorlage;
    const unveraendert = vorlageUnveraendert();
    const sicher = await frageJaNein({
      titel: vorlage ? "Bearbeitung der Vorlage beenden?" : fremdeErfassung ? "Angefangene Erfassung verwerfen?" : "Angefangenen Bogen verwerfen?",
      text: vorlage
        ? `Die Bearbeitung der Vorlage „${vorlage.name}" wird beendet. ${folgen.satz}`
        : `„${einheitAnzeigename(bogen.einheit)}" wird geschlossen. ${folgen.satz}`,
      ok: vorlage ? "Bearbeitung beenden" : "Verwerfen",
      gefahr: vorlage ? folgen.verlust : true,
    });
    if (!sicher) return;
    const gemerkt = bogenHatInhalt(bogen) && merkeVerdraengt(bogen);
    if (vorlage) {
      setBogen(null);
      setVorlageInBearbeitung(null);
      setzeEmpfang(null);
      setSchritt(0);
      setMeldung(
        [
          `Bearbeitung der Vorlage „${vorlage.name}" beendet — die Vorlage ist unverändert.`,
          !unveraendert && gemerkt ? "Die nicht übernommenen Änderungen liegen unten auf der Startseite zum Zurückholen." : "",
          eigenerBogenWartetHinweis(),
        ]
          .filter(Boolean)
          .join(" "),
      );
      return;
    }
    setBogen(null); // löscht auch die Entwurfssicherung (siehe oben)
    setVorlageInBearbeitung(null);
    setFremdeErfassung(false);
    setSammelZiel(null);
    setzeEmpfang(null);
    setSchritt(0);
    setMeldung(gemerkt ? "Angefangener Bogen verworfen — Rückholung unten auf der Startseite." : "Angefangene Erfassung verworfen.");
  }

  /**
   * Beispielbogen aus der Fußzeile öffnen — bewusst derselbe Weg wie bei einem
   * frisch gescannten Bogen (Übersicht, keine Signatur). Er ersetzt den offenen
   * Bogen inkl. Entwurfssicherung, daher vorher rückfragen. Rückgabe false =
   * abgelehnt, der Beispielbögen-Dialog bleibt dann offen.
   */
  async function oeffneBeispiel(b: Erfassungsbogen): Promise<boolean> {
    if (!(await darfBogenErsetzen({ titel: "Beispielbogen öffnen?", was: "den Beispielbogen", ok: "Beispielbogen öffnen" }))) {
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
    /** Satz hinter der Quittung — etwa, dass der eigene Bogen offen bleibt. */
    zusatz = "",
  ): Promise<boolean> {
    ablageFehler.current = null;
    const einsatz = einsaetzeLaden().find((s) => s.id === zielId);
    const schl = einheitSchluessel(b.einheit);
    // Gleicher Inhalt schon da? Dann gibt es nichts zu fragen — der Kern
    // überspringt ihn ohnehin, die Rückfrage davor war nur Stapel-Bremse
    // (Audit „Stress", S1; „Offline", O3).
    const schonDa = einsatz?.eintraege.some((e) => e.id === bogenInhaltsId(b)) ?? false;
    // Ein Übungsbogen in einer echten Lage zählt nicht mit (siehe zaehltInLage).
    // Das gehört in dieselbe Zeile, die die Aufnahme quittiert — sonst steht die
    // Meldung scheinbar normal in der Liste und der Meldekopf rechnet mit ihr.
    const uebungDaneben = einsatz != null && !!b.uebung && einsatz.art !== EinsatzArt.UEBUNG;
    const uebungZusatz = uebungDaneben ? " Achtung: als ÜBUNG gekennzeichnet — zählt nicht in die Lage." : "";
    let override: string | undefined;
    const bekannt = einsatz?.eintraege.some((e) => e.einheitSchluessel === schl) ?? false;
    // Im Kiosk-Stapel keine Fachfrage: Eine veränderte Fassung derselben
    // Einheit ist laut Dialog selbst „der Normalfall" — sie wird angehängt und
    // in der Quittung als Folgemeldung genannt; die Ausnahme „zweite
    // gleichnamige Einheit" bleibt über „Aufteilen"/„Als eigene Einheit" in
    // der Einsatzansicht erreichbar.
    // Nur eine Stärke vom Papier für eine schon gemeldete Einheit: Als neue
    // Fassung fielen Fahrzeuge, Bedarf und Namen still aus den Summen. Die
    // Rückfrage sagt, was wegfiele, und bietet zuerst „Nur die Stärke
    // ändern" an (Audit Runde 3, R3-A1).
    let aufzunehmen = b;
    const nurStaerkeWeg = (vorher: Erfassungsbogen): Antwortweg[] => {
      if (!istNurStaerke(b) || wasWegfiele(vorher, b).length === 0) return [];
      return [
        {
          wert: "staerke",
          label: `Nur die Stärke ändern (${staerkeKurz(vorher)} → ${staerkeKurz(b)})`,
          hinweis: `Neue Fassung mit allem Übrigen der bisherigen Meldung: ${wasWegfiele(vorher, b).join(", ")} bleiben.`,
        },
      ];
    };
    const wegfallHinweis = (vorher: Erfassungsbogen): string => {
      if (!istNurStaerke(b)) return "";
      const weg = wasWegfiele(vorher, b);
      return weg.length > 0 ? ` Fällt dabei weg: ${weg.join(", ")}.` : "";
    };
    if (bekannt && !schonDa && !kiosk) {
      const bisher = einsatz ? revisionen(einsatz.eintraege, schl)[0]?.bogen : undefined;
      // Die Frage hat zwei gleichwertige Antworten und deshalb zwei benannte
      // Knöpfe: „OK/Abbrechen" hätte den zweiten Weg als Abbruch getarnt.
      const wahl = await frageWahl({
        titel: "Einheit ist bereits gemeldet",
        text: `„${einheitAnzeigename(b.einheit)}" steht in diesem Einsatz schon. Wie soll der neue Bogen dazu stehen?`,
        wege: [
          ...(bisher ? nurStaerkeWeg(bisher) : []),
          {
            wert: "fassung",
            label: "Als neue Fassung anhängen",
            hinweis:
              "Der Normalfall bei einer Folgemeldung: die bisherige Meldung wandert in die Historie." +
              (bisher ? wegfallHinweis(bisher) : ""),
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
        return false;
      }
      if (wahl === "eigene") override = `${schl}#${Date.now()}`;
      if (wahl === "staerke" && bisher) aufzunehmen = nurStaerkeUebernehmen(bisher, staerke(b), b.stand);
    }
    // Ähnliche Einheit schon da (gleiche Organisation und gleicher Ort, aber
    // anderer Schlüssel — etwa nach einer Papierphase ohne Einheitstyp
    // abgetippt, jetzt gescannt)? Dann fragen, statt still eine zweite Einheit
    // anzulegen, die doppelt zählt (Audit „Analog first", A5). Im Stapel
    // keine Frage: dort gilt „anhalten kostet mehr als nachträglich
    // zusammenführen".
    if (!bekannt && !schonDa && !kiosk && einsatz) {
      // Ort ohne Vorsätze wie „OV" und auch als Teil des anderen Namens — vorher
      // buchstabengenau, „OV Albstadt" ≠ „Albstadt" zählte doppelt (R2-A5).
      const ort = einheitOrt(b.einheit);
      const aehnlich = neuesteJeEinheit(einsatz.eintraege).find(
        (e) =>
          e.einheitSchluessel !== schl &&
          e.bogen.einheit.organisation === b.einheit.organisation &&
          aehnlicherOrt(einheitOrt(e.bogen.einheit), ort),
      );
      if (aehnlich) {
        const wahl = await frageWahl({
          titel: "Ist das dieselbe Einheit?",
          text: `In diesem Einsatz steht schon „${einheitAnzeigename(aehnlich.bogen.einheit)}" (Stärke ${staerkeKurz(aehnlich.bogen)}). Die neue Meldung heißt „${einheitAnzeigename(b.einheit)}".`,
          wege: [
            ...nurStaerkeWeg(aehnlich.bogen).map((w) => ({
              ...w,
              label: `Ja — nur die Stärke von „${einheitAnzeigename(aehnlich.bogen.einheit)}" ändern (${staerkeKurz(aehnlich.bogen)} → ${staerkeKurz(b)})`,
            })),
            {
              wert: "gleich",
              label: `Ja — als neue Fassung von „${einheitAnzeigename(aehnlich.bogen.einheit)}"`,
              hinweis: "Die bisherige Meldung wandert in die Historie; gezählt wird eine Einheit." + wegfallHinweis(aehnlich.bogen),
            },
            {
              wert: "eigene",
              label: "Nein — als eigene Einheit führen",
              hinweis: "Beide zählen getrennt in die Summe.",
            },
          ],
        });
        if (!wahl) {
          setMeldung(`„${einheitAnzeigename(b.einheit)}" nicht aufgenommen.`);
          return false;
        }
        if (wahl === "gleich") override = aehnlich.einheitSchluessel;
        if (wahl === "staerke") {
          override = aehnlich.einheitSchluessel;
          aufzunehmen = nurStaerkeUebernehmen(aehnlich.bogen, staerke(b), b.stand);
        }
      }
    }
    // Was sich gegenüber der vorigen Fassung ändert — für die Quittung im
    // Kiosk, bevor der Kern die neue Fassung obenauf legt.
    const vorige = bekannt && !schonDa && einsatz ? revisionen(einsatz.eintraege, schl)[0] : undefined;
    let r;
    try {
      // meldungAufnehmen: legt ab und lässt die Folgemeldung Zug, Auftrag und
      // Eintreffzeit der Vorgängerin erben (eintrag-zeiten.ts, R2-K1).
      r = meldungAufnehmen(zielId, aufzunehmen, {
        quelle,
        einheitSchluesselOverride: override,
        signatur: empfang?.signatur,
        herkunft: empfang?.herkunft ? base64UrlKodieren(empfang.herkunft) : undefined,
      });
    } catch (e) {
      // Voller Speicher: nichts abgelegt, und das muss sichtbar sein — der
      // Bogen bleibt beim Aufrufer offen (Audit „Offline und Speicher", O1).
      const text = istSpeicherVoll(e) ? new SpeicherVollFehler(e).message : fehlerText(e);
      ablageFehler.current = text;
      if (kiosk) setScanFortschritt(`✗ Nicht aufgenommen: ${text}`);
      else setFehler(text);
      einsaetzeNeuLaden();
      return false;
    }
    einsaetzeNeuLaden();
    if (!r) {
      setFehler("Einsatz nicht gefunden.");
      return false;
    }
    const folge =
      (r.neu && vorige ? ` (Folgemeldung: ${diffKurzfassung(bogenDiff(vorige.bogen, aufzunehmen)) || "inhaltlich unverändert"})` : "") +

      (r.erbeFehlt ? " Zug, Auftrag und Eintreffzeit der vorigen Fassung konnten nicht übernommen werden (Speicher voll) — bitte an der Karte nachtragen." : "");
    if (kiosk) {
      // Dauerscannen: Piep + Zähler im Overlay, die Kamera bleibt an — beim
      // Massen-Check-in muss niemand zwischen den Bögen die Ansicht wechseln.
      if (r.neu) kioskZaehlerRef.current += 1;
      piep(r.neu);
      const stand = `${kioskZaehlerRef.current} ${kioskZaehlerRef.current === 1 ? "Bogen" : "Bögen"} in diesem Durchgang`;
      setScanFortschritt(
        r.neu
          ? `✓ „${einheitAnzeigename(b.einheit)}" aufgenommen${folge} — ${stand}.${uebungZusatz} Nächsten Bogen zeigen…`
          : `Bereits vorhanden — übersprungen (gleicher Inhalt). ${stand}.`,
      );
      setFehler("");
      return true;
    }
    setMeldung(
      r.neu
        ? `Meldung von „${einheitAnzeigename(b.einheit)}" aufgenommen${folge}.${
            aufzunehmen !== b ? " Nur die Stärke geändert — Fahrzeuge, Bedarf und Namen der bisherigen Meldung gelten weiter." : ""
          }${uebungZusatz}${zusatz ? ` ${zusatz}` : ""}`
        : `Bereits vorhanden — übersprungen (gleicher Inhalt). Die Zeile in der Liste ist quittiert.${zusatz ? ` ${zusatz}` : ""}`,
    );
    setFehler("");
    // Auch beim übersprungenen Bogen: die Frage nach dem Scan lautet „welche
    // Zeile ist gemeint?", und darauf gibt es hier eine Antwort — die Zeile,
    // die den Inhalt schon trägt. Die Rückmeldezeile sagt, ob er neu war.
    markiereEingang(r.eintrag.einheitSchluessel);
    setOffenerEinsatzId(zielId); // zurück in die Einsatzansicht
    return true;
  }

  /**
   * Wohin mit einer empfangenen Meldung (Link, Nahbereich, Datei, Kaltstart)?
   * Gibt es Sammlungen, ist die Antwort am Meldekopf fast immer „in die
   * Sammlung" — vorher lief jeder dieser Wege über den eigenen Arbeitsbogen,
   * mit fünf Tipps und einer Rückfrage zum „angefangenen Bogen", den es aus
   * Meldekopf-Sicht gar nicht gab (Audit „Arbeitsablauf", W1). Ohne Sammlung
   * wird der Bogen wie bisher geöffnet.
   *
   * Rückgabe: Einsatz-ID, "oeffnen" oder null (abgebrochen).
   */
  async function empfangsZielWaehlen(b: Erfassungsbogen): Promise<string | null> {
    const sammlungen = einsaetzeLaden();
    if (sammlungen.length === 0) return "oeffnen";
    const letzte = letztenEinsatzLaden() ?? offenerEinsatzId;
    const sortiert = [...sammlungen].sort((x, y) => (x.id === letzte ? -1 : y.id === letzte ? 1 : y.geaendert - x.geaendert));
    const wege = sortiert.slice(0, 4).map((s) => ({
      wert: s.id,
      label: `In „${s.name}" aufnehmen`,
      hinweis: `${ART_LABEL[s.art]}${s.ort ? ` · ${s.ort}` : ""} · ${aktuelleMeldungen(s.eintraege, s.art).length} Einheit(en) anwesend`,
    }));
    wege.push({
      wert: "oeffnen",
      label: "Bogen öffnen (ansehen oder bearbeiten)",
      hinweis: "Für die Einheit selbst — der eigene angefangene Bogen bleibt über die Startseite zurückholbar.",
    });
    return frageWahl({
      titel: `Meldung von „${einheitAnzeigename(b.einheit)}" empfangen`,
      text: `Stärke ${staerkeKurz(b)}${b.uebung ? " · ÜBUNG" : ""}. Wohin damit?`,
      wege,
    });
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
    /**
     * Kein Kiosk-Scan: Link oder Datei. Ein gesetztes Sammelziel gehört dann
     * zu einer offenen Erfassung (oder einem Scan-Durchgang ohne offenes
     * Overlay) — der Bogen darf nicht still in dieser Sammlung landen.
     */
    opt: { ohneKiosk?: boolean } = {},
  ): Promise<boolean> {
    const ziel = sammelZielRef.current;
    if (ziel && (!opt.ohneKiosk || scannerOffenRef.current)) {
      // Abwarten: steckt in der Aufnahme eine Rückfrage (Einheit schon
      // gemeldet), darf der Scan-Loop nicht schon den nächsten Code lesen.
      // Die Datenschutzfrist wendet die Sammlung selbst an (meldungHinzufuegen).
      await bogenInSammlung(ziel, b, "scan", { signatur: alsEintragSignatur(signatur), herkunft: payload }, true);
      return false; // Kiosk: weiter scannen, bis abgebrochen wird
    }
    const wohin = await empfangsZielWaehlen(b);
    if (wohin == null) return true; // abgebrochen — nichts verändert
    let nichtAbgelegt: string | null = null;
    if (wohin !== "oeffnen") {
      const ok = await bogenInSammlung(wohin, b, "scan", { signatur: alsEintragSignatur(signatur), herkunft: payload });
      setZeigeStart(false);
      // Nicht abgelegt, weil der Speicher voll war: Der eingelesene Bogen war
      // sonst weg, und die Einheit fuhr weiter. Er wird geöffnet — mit dem
      // Grund oben —, damit ihn niemand ein zweites Mal scannen muss (R2-O2).
      // Ein bewusst abgebrochenes Ablegen bleibt, wie es war.
      nichtAbgelegt = ok ? null : ablageFehler.current;
      if (!nichtAbgelegt) return true;
    }
    if (!(await darfBogenErsetzen({ titel: "Empfangenen Bogen öffnen?", was: "die empfangene Meldung", ok: "Meldung öffnen" }))) {
      return true; // Scan beendet, der eigene Bogen bleibt stehen
    }
    // Wo der eigene Bogen jetzt liegt — derselbe Hinweis wie früher beim
    // Kaltstart, jetzt auf jedem Weg (R3-S1).
    const wartet = eigenerBogenWartetHinweis();
    const { bogen: geoeffnet, anonymisiert } = bogenNachFrist(b);
    setBogen(geoeffnet);
    if (anonymisiert) setzeEmpfang(null);
    else setzeEmpfang(signatur, payload ?? null);
    setSchritt(UEBERSICHT);
    setZeigeStart(false);
    // Einsatzansicht hat Vorrang vor der Übersicht (siehe Render weiter unten):
    // ohne dieses Schließen bliebe ein per Link geöffneter Bogen unsichtbar.
    setOffenerEinsatzId(null);
    setFehler(
      nichtAbgelegt
        ? `Nicht in die Sammlung aufgenommen: ${nichtAbgelegt} Der Bogen bleibt hier geöffnet — danach „In Einsatz-Sammlung ablegen…".`
        : "",
    );
    setMeldung([anonymisiert ? FRIST_ABGELAUFEN_MELDUNG : "", wartet].filter(Boolean).join(" "));
    return true;
  }

  /** Eine eben importierte Vorlage (Scan, Link, Datei) auf der Startseite zeigen. */
  function vorlageEingegangen(v: Vorlage) {
    setVorlagen(vorlagenLaden());
    setFrischeVorlageId(v.id);
    setMusterVorlage(null);
    setZeigeStart(true); // Startbildschirm listet die (nun importierte) Vorlage
    setFehler("");
  }

  /**
   * Einen gescannten/übergebenen QR-Text verarbeiten. Rückgabe: true = fertig
   * (Overlay schließen / Native-Schleife beenden), false = es wird noch ein
   * weiterer Segment-Teil erwartet. Segment-Teile werden gesammelt (Fortschritt
   * „Teil x von n"), Duplikate/fremde/fehlende Teile sauber behandelt und bei
   * Vollständigkeit dekodiert. Vorlagen (Marker „V.") werden importiert. Die
   * Signatur des Transports wird geprüft (blockiert den Import nie).
   */
  async function uebernehmeText(text: string, fehlertext: string, opt: { ohneKiosk?: boolean } = {}): Promise<boolean> {
    if (istVorlageNutzlast(text)) {
      setzeSegmentTeile([]);
      setScanFortschritt("");
      try {
        const b = decodeVorlagePayloadUrl(text, browserKompressor);
        const v = vorlageAnlegen(einheitAnzeigename(b.einheit), b);
        vorlageEingegangen(v);
        const status = await signaturVonText(text);
        setMeldung(`Vorlage „${v.name}" importiert.${status.zustand !== "unsigniert" ? ` (${signaturLabel(status)})` : ""}`);
        setFehler("");
      } catch {
        scanFehlerRef.current = fehlertext;
        setFehler(fehlertext);
      }
      return true;
    }
    // Segment-Teil eines großen Bogens: sammeln, bis alle Teile vorliegen.
    if (istSegmentNutzlast(text)) {
      try {
        const teil = parseSegmentUrl(text);
        const r = segmentSammeln(segmentTeileRef.current, teil);
        setzeSegmentTeile(r.teile);
        if (r.status === "vollständig") {
          // Signatur über den zusammengesetzten Payload prüfen (auch signierte
          // Bögen können segmentiert sein — die Teile ergeben ihn 1:1 wieder).
          const payload = segmentePayload(r.teile);
          const b = segmenteZuBogen(r.teile, browserKompressor);
          const status = await signaturVonPayload(payload);
          setzeSegmentTeile([]);
          setScanFortschritt("");
          return uebernimmBogen(b, status, payload, opt);
        }
        setFehler("");
        // Die fehlenden Teile ausdrücklich benennen, statt sie ausrechnen zu
        // lassen: „es fehlt noch Teil 4" ist im Feld die Anweisung, „3 von 5"
        // nur ein Zwischenstand. Die Kästchenzeile zeigt dasselbe fürs Auge.
        const fehlt = fehltNochSatz(r.teile);
        setScanFortschritt(
          r.status === "duplikat"
            ? `Teil ${teil.teilNr} war schon dabei — ${fehlt}.`
            : r.status === "fremd"
              ? `Anderer Bogen erkannt — neu begonnen (Teil ${teil.teilNr} von ${r.anzahl}); ${fehlt}.`
              : `Teil ${r.haben} von ${r.anzahl} gescannt — ${fehlt}.`,
        );
        return false;
      } catch {
        scanFehlerRef.current = fehlertext;
        setFehler(fehlertext);
        return true;
      }
    }
    // Normaler Einzel-Bogen.
    setzeSegmentTeile([]);
    setScanFortschritt("");
    try {
      const dekodiert = decodePayloadUrl(text, browserKompressor);
      const status = await signaturVonText(text);
      return uebernimmBogen(dekodiert, status, payloadAusText(text), opt);
    } catch {
      scanFehlerRef.current = fehlertext;
      setFehler(fehlertext);
    }
    return true;
  }

  /**
   * Gescannten Text übernehmen. Vorgeschaltet die Belegungs-Rückrechnung: Ein
   * Handscanner in US-Belegung liefert auf deutschen Rechnern einen verdrehten
   * (aber vollständigen) Code — den kann die App lesen, statt den Nutzer mit
   * einer Fehlermeldung an die Scanner-Konfiguration zu schicken. Der
   * Fehlertext zeigt weiterhin, was TATSÄCHLICH ankam.
   */
  async function uebernehmeQrText(rohText: string): Promise<boolean> {
    const text = entwirreScanText(rohText, istLesbarerScan);
    const fertig = await uebernehmeText(text, scanFehlertext(rohText));
    // Nach der Übernahme melden: Sie setzt ihrerseits Meldungen, die den
    // Hinweis sonst gleich wieder überschrieben.
    if (text !== rohText) setMeldung(BELEGUNG_HINWEIS);
    return fertig;
  }

  /**
   * Web-Scanner-Ergebnis: bei Fertigstellung das Overlay schließen. Ein
   * unlesbarer Code schließt es NICHT — die Meldung steht im Scanner, der
   * nächste Versuch braucht keinen Neustart (Audit „Fehler", E6).
   */
  async function scanErgebnisWeb(text: string) {
    scanFehlerRef.current = null;
    const fertig = await uebernehmeQrText(text);
    if (scanFehlerRef.current) {
      setScanFortschritt(`✗ ${scanFehlerRef.current}`);
      setFehler("");
      return;
    }
    if (fertig) {
      setScannerOffen(false);
      setScanFortschritt("");
    }
  }
  /** Fehlertext des letzten Scans — gesetzt von uebernehmeText, gelesen vom Web-Scanner. */
  const scanFehlerRef = useRef<string | null>(null);

  function scanAbbrechen(auchSammelZiel: boolean) {
    setScannerOffen(false);
    if (auchSammelZiel) setSammelZiel(null);
    setzeSegmentTeile([]);
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
    if (!START_SOFORT || !START.text) return;
    let aktiv = true;
    signaturVonText(START.text).then((s) => aktiv && setzeEmpfang(s, payloadAusText(START.text)));
    return () => {
      aktiv = false;
    };
  }, []);

  // Kaltstart mit Bogen aus dem Link, während ein angefangener Bogen oder eine
  // Sammlung auf dem Gerät liegt: derselbe Weg wie ein Link bei offener App —
  // „Wohin damit?" (am Meldekopf fast immer die Sammlung, W1), sonst die
  // Rückfrage zum angefangenen Bogen. Verdrängt wird erst nach der Antwort;
  // „Abbrechen" lässt Arbeitsplatz und Rückholplatz, wie sie waren (R3-D2).
  useEffect(() => {
    if (!START_EMPFANG || startEmpfangVerbraucht) return;
    startEmpfangVerbraucht = true;
    const b = START_EMPFANG;
    void (async () => {
      const status = START.text ? await signaturVonText(START.text) : ({ zustand: "unsigniert" } as SignaturStatus);
      await uebernimmBogen(b, status, START.text ? payloadAusText(START.text) : null, { ohneKiosk: true });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nur beim Mounten
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

  /**
   * Ein Bogen-Link bei laufender App (Fragmentwechsel im Browser, Universal
   * Link in der nativen App). Die Listener werden nur einmal registriert und
   * rufen deshalb über diese Ref den Handler des AKTUELLEN Renders: Vorher
   * lief der Handler aus dem ersten Render, und `darfBogenErsetzen` prüfte den
   * Bogen vom Start — war die App ohne Entwurf geöffnet worden, ersetzte ein
   * Link den inzwischen angelegten eigenen Bogen ohne Frage und ohne
   * Rückholung (Audit Runde 3, R3-S1).
   */
  const linkEmpfangenRef = useRef<(text: string) => void>(() => {});
  linkEmpfangenRef.current = (text: string) => {
    void uebernehmeText(text, "Der geöffnete Link enthält keinen gültigen Erfassungsbogen.", { ohneKiosk: true }).then(
      (fertig) => {
        // Segment-Teil eines mehrteiligen Bogens: Scanner öffnen, damit die
        // übrigen Teile direkt folgen können. Kam umgekehrt der LETZTE Teil
        // per Link, während der Scanner offen war, schließt er sich.
        if (!fertig) void scanneQr();
        else setScannerOffen(false);
      },
    );
  };

  // Web-Pendant zum Universal Link: Wird ein Bogen-Link angetippt, während die
  // Seite schon offen ist, lädt der Browser das Dokument NICHT neu — es ändert
  // sich nur das Fragment. Auf dem Telefon ist genau das der Normalfall (der
  // Browser benutzt den vorhandenen Tab bzw. die laufende PWA weiter), am
  // Rechner trifft es jeden Link ab dem zweiten. Ohne diesen Listener liefe der
  // Kaltstart-Pfad oben nie und man bliebe auf der Startseite stehen.
  useEffect(() => {
    function beiFragmentwechsel() {
      const fragment = fragmentNehmen();
      if (fragment) linkEmpfangenRef.current(fragment);
    }
    window.addEventListener("hashchange", beiFragmentwechsel);
    return () => window.removeEventListener("hashchange", beiFragmentwechsel);
  }, []);

  // Universal Link (iOS) / App Link (Android) öffnet die native App:
  // Bogen oder Vorlage aus der übergebenen URL übernehmen (Kaltstart und laufende App).
  useEffect(() => bogenLinksEmpfangen((url) => linkEmpfangenRef.current(url)), []);

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
        // Der native Scanner nimmt nur eine Textzeile an — dort ist der Satz
        // die einzige Auskunft und nennt deshalb den nächsten fehlenden Teil
        // als Anweisung (im Web-Overlay zeigt zusätzlich die Kästchenzeile,
        // was noch aussteht).
        const fehlen = fehlendeTeile(teile);
        const anweisung =
          teile.length > 0 && fehlen.length > 0
            ? `Teil ${teile.length} von ${teile[0]!.anzahl} gescannt — jetzt Teil ${fehlen[0]} in den Rahmen halten`
            : "QR-Code des Erfassungsbogens in den Rahmen halten";
        const text = await qrScannen(anweisung);
        if (!text) {
          // Abbruch: angefangenen Sammelstand (und ein Kiosk-Sammelziel) verwerfen.
          setzeSegmentTeile([]);
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
      titel: "Neue Einsatz-Sammlung anlegen",
      hinweis:
        "Die Sammelmappe des Meldekopfs für eintreffende Bögen — mit Stärke-Summen über alle anwesenden Einheiten. Der eigene Bogen entsteht unter „Meinen Bogen ausfüllen“.",
      ok: "Einsatz anlegen",
      felder: [
        { name: "name", label: "Name", platzhalter: "z. B. Hochwasser Weser" },
        { name: "art", label: "Art", auswahl: ART_WAHL },
        { name: "ort", label: "Ort / Auftrag (optional)", optional: true, platzhalter: "z. B. Deichabschnitt Nord" },
      ],
    });
    if (!werte) return null;
    let s: Einsatzsammlung;
    try {
      s = einsatzAnlegen(werte.name!, Number(werte.art) as EinsatzArt, werte.ort);
    } catch (e) {
      // Voller Speicher: der Dialog schloss, und es gab weder Sammlung noch
      // Meldung — nur einen Fehler in der Konsole (Audit Runde 2, R2-O2).
      await zeigeHinweis({
        titel: "Sammlung nicht angelegt",
        text: istSpeicherVoll(e) ? new SpeicherVollFehler(e).message : fehlerText(e),
      });
      return null;
    }
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
    // Ein empfangener Bogen ist die Meldung der Einheit — nur selbst Erfasstes prüfen (R2-E2).
    if (!sig && !(await sollstaerkeFreigeben(b))) return;
    setMeldung(""); // Rückmeldung des Assistenten gehört nicht in die Folgeansicht
    setFehler("");
    // Erst ablegen, dann schließen: Scheitert das Ablegen (Speicher voll),
    // bleibt der Bogen offen — vorher war er in dem Fall nirgends mehr (O1).
    // Ein EMPFANGENER Bogen (mit Signatur) wird nach dem Ablegen geschlossen,
    // damit der Meldekopf keinen fremden Bogen als eigenen Entwurf behält;
    // der selbst erfasste Bogen der eigenen Einheit bleibt offen — sie will
    // ihn weiter pflegen (Audit „Zerstörende Handlungen", D5).
    // Eine fremde Erfassung (Schnellerfassung von der Startseite) ist
    // ebenfalls nicht „dein Bogen": offen gelassen, verdrängte sie beim
    // nächsten Wechsel den eigenen aus der Rückholung (R2-N1).
    const eigener = !sig && !fremdeErfassung;
    const ok = await bogenInSammlung(
      zielId,
      b,
      sig ? "scan" : "manuell",
      sig ? { signatur: alsEintragSignatur(sig), herkunft } : undefined,
      false,
      eigener ? "Dein Bogen bleibt geöffnet — Startseite → „Fortsetzen“." : eigenerBogenWartetHinweis(),
    );
    // Gescheitert (Speicher voll): Die Auswahl bleibt offen und zeigt den
    // Fehler dort, wo getippt wurde — vorher schloss sie, und der Assistent
    // meldete weiter „✓ gespeichert" (R2-O2).
    if (!ok) return;
    einsatzWahlDialog.current?.close();
    if (eigener) return;
    setBogen(null);
    setFremdeErfassung(false);
    setVorlageInBearbeitung(null);
    setzeEmpfang(null);
    setSchritt(0);
  }

  /**
   * Vor dem Ablegen eines selbst erfassten Bogens: Besteht die Stärke nur aus
   * unbenannten Sollplätzen, hat niemand die Einheit gezählt. „In Einsatz
   * übernehmen" steht auf jedem Schritt — auf Schritt 1 übernommen, stand die
   * StAN-Sollstärke ungefragt als Meldung in der Lage (Audit Runde 2, R2-E2).
   * Rückgabe: true = ablegen, false = nicht (abgebrochen oder zum Eintragen
   * in den Personal-Schritt gesprungen).
   */
  async function sollstaerkeFreigeben(b: Erfassungsbogen): Promise<boolean> {
    if (!nurSollstaerke(b)) return true;
    const s = staerke(b);
    const wahl = await frageWahl({
      titel: "Stärke nicht gezählt",
      text: `Für „${einheitAnzeigename(b.einheit)}" stehen nur die Sollplätze nach StAN (Stärke ${s.fuehrer} / ${s.unterfuehrer} / ${s.mannschaft} / ${s.gesamt}${b.fahrzeuge.length ? `, ${b.fahrzeuge.length} Fahrzeug${b.fahrzeuge.length === 1 ? "" : "e"}` : ""}) — niemand hat Personen eingetragen.`,
      wege: [
        { wert: "eintragen", label: "Stärke jetzt eintragen", hinweis: "Springt zum Personal — Namen oder nur die Zahl (Schnellerfassung)." },
        { wert: "soll", label: "Als Sollstärke ablegen", hinweis: "Die Karte in der Sammlung trägt die Marke „Sollstärke, nicht gemeldet“." },
      ],
    });
    if (wahl === "eintragen") {
      einsatzWahlDialog.current?.close();
      setOffenerEinsatzId(null);
      setZeigeStart(false);
      setSchritt(2);
    }
    return wahl === "soll";
  }

  /**
   * Vor dem Ablegen einer Erfassung mit Stärke 0: Die Einheit galt sonst als
   * angekommen, ihre Leute fehlten in Stärke, Verpflegung und Unterbringung,
   * und auffallen konnte es nur in der Liste ganz unten (Audit Runde 3,
   * R3-N1). „Stärke eintragen" springt zu Schritt 3 — ohne erfasste Personen
   * gleich im Modus „Nur Stärke", dort stehen die Zähler.
   * Rückgabe: true = ablegen.
   */
  async function staerkeFreigeben(b: Erfassungsbogen): Promise<boolean> {
    if (nurSollstaerke(b) || staerke(b).gesamt > 0) return true;
    const wahl = await frageWahl({
      titel: "Stärke fehlt",
      text: `„${einheitAnzeigename(b.einheit)}" hat noch keine Stärke (0 Personen). In der Lage zählte sie als Einheit ohne Leute.`,
      wege: [
        { wert: "eintragen", label: "Stärke eintragen", hinweis: "Springt zu „3. Personal“ — die Zahl genügt." },
        { wert: "null", label: "Trotzdem mit Stärke 0 übernehmen", hinweis: "Die Karte trägt die Marke „Stärke fehlt“; nachtragen als Folgemeldung.", gefahr: true },
      ],
    });
    if (wahl === "eintragen") {
      if (b.personal.length === 0 && b.personalErfassung !== PersonalErfassung.NUR_STAERKE) {
        setBogen({
          ...b,
          personalErfassung: PersonalErfassung.NUR_STAERKE,
          staerkeManuell: { fuehrer: 0, unterfuehrer: 0, mannschaft: 0, gesamt: 0 },
        });
      }
      setSchritt(2);
    }
    return wahl === "null";
  }

  /** Erfassung für einen Einsatz abschließen: ablegen, dann den Arbeitsplatz räumen. */
  async function erfassungUebernehmen() {
    const ziel = sammelZielId;
    if (!ziel || !bogen || !fremdeErfassung) return;
    const b = bogen;
    // Ohne Namen keine Meldung: Ein Tipp direkt nach dem Öffnen legte eine
    // Einheit „THW" mit Stärke 0 in die Lage, die sich niemandem zuordnen
    // ließ (Audit Runde 3, R3-E3, R3-G3). Gesperrt wird nur hier — im
    // eigenen Bogen darf der Name weiter offen bleiben.
    if (!einheitOrt(b.einheit) && b.einheit.standortRef == null) {
      await zeigeHinweis({
        titel: "Name der Einheit fehlt",
        text: "Ohne Namen lässt sich die Meldung keiner Einheit zuordnen — in der Lage stünde nur die Organisation. Bitte zuerst den Namen eintragen.",
        ok: "Zum Namensfeld",
      });
      einsatzWahlDialog.current?.close();
      if (schritt !== 0) geheZuFeld(0, "feld-einheit-name");
      else {
        const feld = document.getElementById("feld-einheit-name");
        feld?.scrollIntoView?.({ block: "center" });
        feld?.focus({ preventScroll: true });
      }
      return;
    }
    if (!(await sollstaerkeFreigeben(b))) return;
    if (!(await staerkeFreigeben(b))) return;
    let zeit = eintreffzeitAusUhrzeit(nachEintreffzeit);
    // Kein Blatt-Wert und eine Unterbrechung dazwischen: fragen statt die
    // Uhrzeit des Übernehmens still zur Eintreffzeit zu machen (R3-S6).
    if (zeit == null && erfassungBeginn != null && Date.now() - erfassungBeginn > ERFASSUNG_PAUSE_MS) {
      const uhr = (ms: number) => new Date(ms).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
      const wahl = await frageWahl({
        titel: "Wann ist die Einheit eingetroffen?",
        text: `Die Erfassung von „${einheitAnzeigename(b.einheit)}" läuft seit ${uhr(erfassungBeginn)} Uhr, „Eingetroffen um" ist leer.`,
        wege: [
          { wert: "beginn", label: `Um ${uhr(erfassungBeginn)} (Beginn der Erfassung)` },
          { wert: "jetzt", label: `Jetzt, ${uhr(Date.now())}` },
        ],
      });
      if (!wahl) return;
      if (wahl === "beginn") zeit = erfassungBeginn;
    }
    setMeldung("");
    const vorherDa = new Set(einsaetzeLaden().find((s) => s.id === ziel)?.eintraege.map((e) => e.id));
    // Manuell erfasster Bogen ist kein signierter Transport.
    const ok = await bogenInSammlung(ziel, b, "manuell", undefined, false, eigenerBogenWartetHinweis());
    if (!ok) return;
    // Uhrzeit vom Blatt an die NEUE Einheit (R2-A5). Eine Folgemeldung erbt
    // die Eintreffzeit ihrer Vorgängerin, die bleibt maßgeblich.
    if (zeit != null) {
      const eintraege = einsaetzeLaden().find((s) => s.id === ziel)?.eintraege ?? [];
      const neu = eintraege.find((e) => e.id === bogenInhaltsId(b) && !vorherDa.has(e.id));
      if (neu && eintraege.filter((e) => e.einheitSchluessel === neu.einheitSchluessel).length === 1) {
        eintreffzeitSetzen(ziel, neu.id, zeit);
        einsaetzeNeuLaden();
      }
    }
    setNachEintreffzeit("");
    setSammelZiel(null);
    setErfassungBeginn(null);
    setBogen(null);
    setFremdeErfassung(false);
    setVorlageInBearbeitung(null);
    setzeEmpfang(null);
    setSchritt(0);
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

  async function manuellInEinsatz(zielId: string) {
    // Eine angefangene Erfassung liegt noch im Assistenten (abgebrochen über
    // „‹ Einsatz", oder nach einem Neustart): fortsetzen oder bewusst
    // verwerfen — nicht still in die Rückholung schieben, wo sie den eigenen
    // Bogen verdrängte (R2-E1).
    if (bogen && fremdeErfassung && bogenHatInhalt(bogen)) {
      const folgen = folgenFuerOffenenBogen();
      const wahl = await frageWahl({
        titel: "Angefangene Erfassung",
        text: `„${einheitAnzeigename(bogen.einheit) || "(noch ohne Namen)"}" ist angefangen, aber noch in keiner Sammlung.`,
        wege: [
          { wert: "weiter", label: "Diese Erfassung fortsetzen" },
          { wert: "neu", label: "Verwerfen und neue Einheit erfassen", hinweis: folgen.satz, gefahr: folgen.verlust },
        ],
      });
      if (!wahl) return;
      if (wahl === "weiter") {
        setSammelZiel(zielId);
        setOffenerEinsatzId(null);
        setMeldung("");
        setZeigeStart(false);
        return;
      }
      await darfBogenErsetzen({ titel: "", was: "", ok: "", ohneFrage: true });
    } else if (!(await darfBogenErsetzen({ titel: "Einheit für den Einsatz erfassen?", was: "die neu zu erfassende Einheit", ok: "Einheit erfassen" }))) {
      return;
    }
    setFremdeErfassung(true);
    setErfassungBeginn(Date.now());
    setNachEintreffzeit("");
    setSammelZiel(zielId);
    setOffenerEinsatzId(null); // Assistent übernimmt die Ansicht
    setMeldung("");
    // Wie die letzte hier von Hand erfasste Einheit: Wer eben nur die Stärke
    // gezählt hat, will die nächste nicht mit „Personal vollständig erfassen"
    // beginnen (R2-S2). Abgeleitet aus der Sammlung, kein eigener Speicher.
    const zuletzt = einsaetzeLaden()
      .find((x) => x.id === zielId)
      ?.eintraege.filter((e) => e.quelle === "manuell")
      .sort((a, b) => b.empfangenAm - a.empfangenAm)[0];
    setBogen(zuletzt?.bogen.personalErfassung === PersonalErfassung.NUR_STAERKE ? schnellerfassungsBogen() : neuerBogen());
    setzeEmpfang(null);
    setSchritt(0);
    setZeigeStart(false);
  }

  /** Leerer Bogen für die Meldekopf-Schnellerfassung (nur Stärke). */
  function schnellerfassungsBogen(): Erfassungsbogen {
    return {
      ...neuerBogen(),
      personalErfassung: PersonalErfassung.NUR_STAERKE,
      staerkeManuell: { fuehrer: 0, unterfuehrer: 0, mannschaft: 0, gesamt: 0 },
    };
  }

  /**
   * Zielsammlung der Schnellerfassung von der Startseite. Rückgabe: Einsatz-ID,
   * "" = ohne Sammlung (nur ein Bogen), null = abgebrochen. Ohne Sammlungen
   * gibt es nichts zu fragen.
   */
  async function schnellerfassungsZiel(): Promise<string | null> {
    const sammlungen = einsaetzeLaden();
    if (sammlungen.length === 0) return "";
    const letzte = letztenEinsatzLaden();
    const sortiert = [...sammlungen].sort((x, y) => (x.id === letzte ? -1 : y.id === letzte ? 1 : y.geaendert - x.geaendert));
    const wege = sortiert.slice(0, 4).map((s) => ({
      wert: s.id,
      label: `Für „${s.name}" erfassen`,
      hinweis: `${ART_LABEL[s.art]}${s.ort ? ` · ${s.ort}` : ""} · ${aktuelleMeldungen(s.eintraege, s.art).length} Einheit(en) anwesend`,
    }));
    wege.push({ wert: "ohne", label: "Ohne Sammlung erfassen", hinweis: "Nur ein Bogen — später über „In Einsatz-Sammlung ablegen…“ zuordnen." });
    const wahl = await frageWahl({ titel: "Einheit schnell erfassen — für welche Sammlung?", text: "Die Einheit wird nach der Erfassung dort abgelegt.", wege });
    return wahl === null ? null : wahl === "ohne" ? "" : wahl;
  }

  /**
   * Text als Datei anbieten — App: Share-Sheet, Browser: Download (wie
   * bogenSpeichern). Liefert false, wenn das Share-Sheet abgebrochen wurde.
   */
  async function dateiAnbieten(dateiname: string, text: string, mime: string): Promise<boolean> {
    if (istNativ()) return textTeilen(dateiname, text);
    blobAlsDownload(dateiname, new Blob([text], { type: mime }));
    return true;
  }

  function einsatzDateiname(s: Einsatzsammlung): string {
    return (s.name || "einsatz").replace(/[^\wäöüÄÖÜß-]+/g, "_");
  }

  /**
   * Nach einem gelungenen Export: alles, was jetzt in der Sammlung steht, ist
   * beim Stab angekommen — beim nächsten „nur neue Bögen" zählt es nicht mehr
   * mit. Ein abgebrochenes Share-Sheet kommt hier nicht an (siehe Aufrufer).
   */
  function exportVerbuchen(s: Einsatzsammlung) {
    const vorhanden = [...einsaetzeLaden(), ...einsaetzePapierkorb()].map((x) => x.id);
    setExportStand(exportVermerken(s, vorhanden));
  }

  async function exportiereEinsatz(s: Einsatzsammlung) {
    await dateiAnbieten(`eeb-einsatz-${einsatzDateiname(s)}.json`, einsatzDateiInhalt(s), "application/json");
  }

  async function exportiereEinsatzCsv(s: Einsatzsammlung, umfang: ExportUmfang) {
    const teil = exportSammlung(s, umfang, exportStand);
    const ok = await dateiAnbieten(`eeb-einsatz-${einsatzDateiname(s)}.csv`, einsatzCsvInhalt(teil, meldungsNummern(s.eintraege)), "text/csv;charset=utf-8");
    if (ok) exportVerbuchen(s);
  }

  async function exportiereEinsatzCsvDetail(s: Einsatzsammlung, umfang: ExportUmfang) {
    const teil = exportSammlung(s, umfang, exportStand);
    const ok = await dateiAnbieten(
      `eeb-einsatz-${einsatzDateiname(s)}-alle-daten.csv`,
      einsatzDetailCsvInhalt(teil, meldungsNummern(s.eintraege)),
      "text/csv;charset=utf-8",
    );
    if (ok) exportVerbuchen(s);
  }

  /**
   * Einheitenliste im Fremdformat der Führungsstelle. Dynamisch geladen: der
   * XLSX-Schreiber samt Stiltabelle wird nur beim Klick gebraucht (wie die PDF).
   */
  async function exportiereEinsatzOldenburg(s: Einsatzsammlung, umfang: ExportUmfang) {
    const teil = exportSammlung(s, umfang, exportStand);
    try {
      const { XLSX_MIME, einsatzOldenburgXlsx } = await import("./oldenburg-xlsx");
      const ok = await bytesAlsDatei(`eeb-einsatz-${einsatzDateiname(s)}-oldenburg.xlsx`, einsatzOldenburgXlsx(teil), XLSX_MIME);
      if (ok) exportVerbuchen(s);
    } catch (e) {
      setFehler(`Excel-Liste: ${fehlerText(e)}`);
    }
  }

  /**
   * Sammel-PDF. Im Gesamtumfang ALLE aktuellen Meldungen — auch abgerückte und
   * Übungen: Die Datei ist die Übergabe der ganzen Sammlung und muss auch am
   * Einsatzende funktionieren, wenn niemand mehr anwesend ist (Audit
   * „Arbeitsablauf", W2; „Analog first", A1). Was zählt und was nicht,
   * unterscheidet das Blatt selbst. Beim Teilexport enthält die PDF (Seiten
   * wie eingebettete Sammlung) nur die neuen Bögen; die Vorfassung einer
   * Folgemeldung für den Diff kommt aus der ganzen Sammlung.
   */
  async function sammelPdf(s: Einsatzsammlung, umfang: ExportUmfang) {
    setFehler("");
    const teil = exportSammlung(s, umfang, exportStand);
    if (teil.eintraege.length === 0) {
      setFehler("Seit dem letzten Export ist kein Bogen neu dazugekommen.");
      return;
    }
    try {
      // Dynamisch: pdfmake samt eingebetteter Schriften bleibt aus dem
      // Start-Bundle heraus und wird erst beim ersten PDF geladen.
      const { einsatzPdfErzeugen } = await import("./pdf");
      const ok = await einsatzPdfErzeugen(teil, undefined, s.eintraege);
      if (!ok) return; // Share-Sheet abgebrochen — nichts übergeben
      exportVerbuchen(s);
      setMeldung(
        umfang === "neue"
          ? `Neue Bögen aus „${s.name}" als PDF weitergegeben.`
          : `Einsatz „${s.name}" als PDF weitergegeben/gesichert — mit allen Meldungen, Zeiten und Historie.`,
      );
    } catch (e) {
      setFehler(`Einsatz weitergeben: ${fehlerText(e)}`);
    }
  }

  /** Einseitiges Lageblatt (nur Übersicht) — für Wand, Ablösung und Klemmbrett (A3/A4). */
  async function lageblatt(s: Einsatzsammlung) {
    setFehler("");
    try {
      const { einsatzLageblattErzeugen } = await import("./pdf");
      if (await einsatzLageblattErzeugen(s)) setMeldung("Lageblatt erzeugt (A4 quer).");
    } catch (e) {
      setFehler(`Lageblatt: ${fehlerText(e)}`);
    }
  }

  /**
   * Bögen aus einer Datei lesen — für die Aufnahme in einen Einsatz. Bei einer
   * PDF zuerst die eingebetteten Daten, ersatzweise die QR-Codes darin (der
   * Rückfallweg, siehe {@link ladePdfQr}); sonst JSON. Der Signaturstatus
   * reist beim QR-Weg mit, damit der Meldekopf die fremde Meldung später mit
   * erhaltener Original-Signatur weiterreichen kann.
   */
  async function boegenAusDatei(datei: File): Promise<QrBogen[]> {
    const ohneNachweis = (boegen: Erfassungsbogen[]): QrBogen[] =>
      boegen.map((bogen) => ({ bogen, signatur: { zustand: "unsigniert" } as SignaturStatus, herkunft: null }));
    if (!istPdfDatei(datei)) {
      // Nur echte Bögen weiterreichen: Vorher wanderte jedes JSON-Objekt als
      // „Bogen" weiter — eine Sicherung fragte dann „1 Bogen gefunden, Einsatz
      // anlegen?". Was keiner ist, erklärt dateiFehlerMeldung (R2-E5).
      const boegen = boegenAusJsonText(await datei.text());
      if (boegen.length === 0) throw new Error("In der Datei steht kein lesbarer Erfassungsbogen.");
      return ohneNachweis(boegen);
    }
    const bytes = new Uint8Array(await datei.arrayBuffer());
    const eingebettet = boegenAusPdfBytes(bytes);
    if (eingebettet.length === 1) return [await siegelAusPdfQr(bytes, eingebettet[0]!)];
    if (eingebettet.length > 0) return ohneNachweis(eingebettet);
    // Dynamisch: die QR-Auswertung zieht den Decoder (ZXing als WebAssembly)
    // nach — der gehört nicht ins Start-Bundle, sondern erst in den Rückfall.
    const { qrTexteAusPdfBytes } = await import("./pdf-qr");
    const { boegenAusQrTexten } = await import("./qr-boegen");
    return boegenAusQrTexten(await qrTexteAusPdfBytes(bytes));
  }

  /**
   * Siegel eines einzelnen PDF-Bogens aus seinem QR-Code mitlesen. Derselbe
   * Bogen kam über den Link „✓ signiert" an, als PDF nur „Aus Datei" ohne
   * Signatur — die Mail-Meldung galt dann als weniger vertrauenswürdig als
   * dieselbe per QR (Audit Runde 2, R2-W6). Übernommen wird der Bogen aus dem
   * QR, nicht der eingebettete: nur dessen Inhalt ist signiert. Passt der QR
   * nicht zur selben Fassung (Einheit, Stand) oder ist er unlesbar, bleibt es
   * beim eingebetteten Bogen ohne Nachweis.
   */
  async function siegelAusPdfQr(bytes: Uint8Array, bogen: Erfassungsbogen): Promise<QrBogen> {
    const ohne: QrBogen = { bogen, signatur: { zustand: "unsigniert" } as SignaturStatus, herkunft: null };
    try {
      const { qrTexteAusPdfBytes } = await import("./pdf-qr");
      const { boegenAusQrTexten } = await import("./qr-boegen");
      const ausQr = await boegenAusQrTexten(await qrTexteAusPdfBytes(bytes));
      const passend = ausQr.find(
        (q) =>
          q.signatur.zustand !== "unsigniert" &&
          q.bogen.stand === bogen.stand &&
          einheitSchluessel(q.bogen.einheit) === einheitSchluessel(bogen.einheit),
      );
      return passend ?? ohne;
    } catch {
      return ohne;
    }
  }

  /**
   * Gefundene Bögen in eine Sammlung schreiben (Dedupe über die Eintrags-ID).
   * Der Aufrufer lädt die Einsätze neu — beim Stapel erst nach der letzten Datei.
   *
   * Bewusst ohne Eingangs-Quittung in der Liste: hier kommen dreißig Bögen auf
   * einmal, und eine Marke, die dreißig Zeilen träfe, markierte nichts mehr.
   * Wie viele es waren, sagt die Rückmeldezeile; welche es waren, ist die
   * ganze Liste. Die Quittung gehört dem einzelnen Eingang.
   */
  function boegenAufnehmen(zielId: string, gefunden: QrBogen[]): { neu: number; uebersprungen: number } {
    let neu = 0;
    let uebersprungen = 0;
    for (const { bogen: b, signatur, herkunft } of gefunden) {
      try {
        const r = meldungAufnehmen(zielId, b, {
          quelle: "pdf-import",
          signatur: alsEintragSignatur(signatur),
          herkunft: herkunft ? base64UrlKodieren(herkunft) : undefined,
        });
        if (r) r.neu ? neu++ : uebersprungen++;
      } catch {
        /* ungültiger Bogen — überspringen */
      }
    }
    return { neu, uebersprungen };
  }

  /**
   * Bögen aus JSON-/PDF-Dateien in den offenen Einsatz aufnehmen (Bulk, mit
   * Dedupe). Mehrere Dateien auf einmal, weil der Einlese-Knopf sie gemeinsam
   * anbietet: eine Meldung über den ganzen Stapel liest sich besser als eine je
   * Datei, und eine kaputte Datei darf die übrigen nicht abbrechen — sie wird
   * mit Namen an die Meldung gehängt.
   */
  async function importiereBoegen(zielId: string, dateien: File[]) {
    let neu = 0;
    let uebersprungen = 0;
    const kaputt: string[] = [];
    const zusatz = { sammlungInPdf: false, lage: false }; // R2-A1
    const sammlungenUebernommen: string[] = []; // R3-W3
    for (const datei of dateien) {
      try {
        const bytes = istPdfDatei(datei) ? new Uint8Array(await datei.arrayBuffer()) : null;
        const art = bytes ? pdfInhaltArt(bytes) : null;
        if (art === "sammlung" && bytes) {
          // Sammel-PDF (z. B. vom Zugführer): als Paket mit Zeiten, Zug und
          // Siegel in diese Sammlung übernehmen, statt nur die Bögen zu
          // nehmen oder eine zweite Sammlung anzulegen (R3-W3).
          const uebernahme = await sammlungInZielUebernehmen(zielId, bytes);
          if (uebernahme === "abbruch") continue;
          if (uebernahme != null) {
            sammlungenUebernommen.push(uebernahme);
            continue;
          }
          zusatz.sammlungInPdf = true;
        }
        if (art === "nur-qr") zusatz.lage = true;
        const r = boegenAufnehmen(zielId, await boegenAusDatei(datei));
        neu += r.neu;
        uebersprungen += r.uebersprungen;
      } catch (e) {
        // Je Datei ein ganzer Satz mit Ursache und nächstem Schritt statt
        // Parser-Text in Klammern (Audit Runde 2, R2-E5).
        kaputt.push(await dateiFehlerMeldung(datei, e, "boegen"));
      }
    }
    einsaetzeNeuLaden();
    setFehler(kaputt.join(" "));
    const bogenMeldung =
      neu + uebersprungen === 0
        ? kaputt.length > 0 || sammlungenUebernommen.length > 0
          ? ""
          : "Keine Bögen in der Datei gefunden — weder eingebettete Daten noch ein lesbarer QR-Code."
        : dateiImportMeldung(neu, uebersprungen, zusatz);
    setMeldung([...sammlungenUebernommen, bogenMeldung].filter(Boolean).join(" "));
  }

  /**
   * Sammel-PDF mit eingebetteter Sammlung beim „Bögen einlesen…" in die
   * offene Sammlung übernehmen (Audit Runde 3, R3-W3). Bisher gab es zwei
   * schlechte Wege: nur die Bögen (ohne Siegel, Zeiten und Zug) oder
   * „Einsatz importieren…", das eine zweite Sammlung anlegte, aus der jede
   * Einheit einzeln umgebucht werden musste.
   *
   * Rückgabe: Quittungstext nach der Übernahme, `null` für „nur die Bögen"
   * (bisheriger Weg), `"abbruch"` für nichts.
   */
  async function sammlungInZielUebernehmen(zielId: string, bytes: Uint8Array): Promise<string | null | "abbruch"> {
    const quelle = einsatzAusPdfBytes(bytes);
    const ziel = einsaetzeLaden().find((x) => x.id === zielId);
    if (!quelle || !ziel) return null;
    let sammlung: Einsatzsammlung;
    if (quelle.id === zielId) {
      // Dieselbe Sammlung (Rückweg von einem anderen Gerät): verlustfrei abgleichen.
      sammlung = quelle;
    } else {
      const einheiten = new Set(quelle.eintraege.map((e) => e.einheitSchluessel)).size;
      const zug = quelle.name.trim();
      const wahl = await frageWahl({
        titel: "Sammel-PDF einer anderen Sammlung",
        text:
          `Die PDF enthält die Sammlung „${quelle.name}“ mit ${einheiten === 1 ? "1 Einheit" : `${einheiten} Einheiten`}. ` +
          `In „${ziel.name}“ übernehmen — mit Eintreffzeiten, Abrückvermerken, Auftrag und Siegel?`,
        wege: [
          {
            wert: "mit-zug",
            label: `Übernehmen, Zug „${zug}“`,
            hinweis: "Einheiten ohne Zug bekommen diesen Zug. Später an der Karte änderbar.",
          },
          { wert: "ohne-zug", label: "Übernehmen ohne Zug-Zuordnung" },
          {
            wert: "nur-boegen",
            label: "Nur die Bögen",
            hinweis: "Ohne Zeiten, Zug und Siegel — wie ein einzeln eingelesener Bogen.",
          },
        ],
      });
      if (!wahl) return "abbruch";
      if (wahl === "nur-boegen") return null;
      sammlung = sammlungFuerZiel(quelle, ziel, wahl === "mit-zug" ? zug : "");
    }
    const geklaert = await entfernteImImportKlaeren(sammlung);
    const r = einsatzAbgleichen(geklaert.sammlung);
    const abgleich = abgleichText(r);
    return (
      (quelle.id === zielId
        ? `${r.hinzugefuegt} neue Meldung(en) ergänzt.`
        : `Sammlung „${quelle.name}“ in „${ziel.name}“ übernommen: ${r.hinzugefuegt} neue Meldung(en) mit Zeiten, Zug und Siegel.`) +
      (abgleich ? ` ${abgleich}` : "") +
      geklaert.hinweis
    );
  }

  /**
   * PDF ohne gespeicherte Sammlung (Einzelbogen, ältere oder fremd erzeugte
   * Sammel-PDF): Die Bögen selbst stecken trotzdem drin — eingebettet oder als
   * QR-Code. Statt den Import abzuweisen, wird daraus ein neuer Einsatz
   * angelegt; das ist am Meldekopf der eigentliche Zweck („da kommt ein
   * Ausdruck, mach was draus").
   */
  async function boegenAlsNeuerEinsatz(datei: File): Promise<boolean> {
    const gefunden = await boegenAusDatei(datei);
    if (gefunden.length === 0) return false;
    const weiter = await frageJaNein({
      titel: "Keine Einsatz-Sammlung in der Datei",
      text:
        `Die Datei enthält ${gefunden.length} Bogen/Bögen, aber keine gespeicherte Sammlung ` +
        "(Einzelbogen oder ältere Sammel-PDF). Dafür einen neuen Einsatz anlegen?",
      ok: "Einsatz anlegen",
    });
    if (!weiter) return true; // bewusst abgelehnt — kein Fehler
    const s = await einsatzErfragen();
    if (!s) return true;
    const { neu, uebersprungen } = boegenAufnehmen(s.id, gefunden);
    einsaetzeNeuLaden();
    setFehler("");
    setMeldung(`Einsatz „${s.name}" angelegt — ${dateiImportMeldung(neu, uebersprungen, { lage: true })}`);
    setZeigeStart(false);
    setOffenerEinsatzId(s.id);
    return true;
  }

  /**
   * Stapel QR-Bilder in den offenen Einsatz aufnehmen: eine Mehrfachauswahl
   * oder ein ganzer Ordner voller abfotografierter/gescannter Bögen.
   *
   * Bewusst ohne Rückfrage je Bogen: die Einzelaufnahme fragt bei bekannter
   * Einheit „neue Fassung oder eigene Einheit?" — bei dreißig Bildern wären das
   * dreißig Dialoge. Der Stapel entscheidet wie der PDF-/JSON-Import: gleicher
   * Inhalt wird übersprungen, neuer Inhalt derselben Einheit stapelt sich als
   * Fassung in die Historie. Beides ist nachträglich korrigierbar, ein
   * weggeklickter Dialog nicht.
   */
  async function importiereQrBilder(zielId: string, dateien: File[]) {
    const bilder = dateien.filter((d) => istBilddatei(d.name, d.type));
    if (bilder.length === 0) {
      setFehler("In der Auswahl sind keine Bilddateien.");
      return;
    }
    setFehler("");
    setMeldung("");
    setStapelBericht([]);
    stapelAbbruchRef.current = false;
    setStapelStand(`0 von ${bilder.length} Bildern gelesen…`);
    try {
      const erg = await qrStapelLesen(
        bilder.map((d) => ({ name: d.name, blob: d })),
        {
          beiFortschritt: (fertig, gesamt) => setStapelStand(`${fertig} von ${gesamt} Bildern gelesen…`),
          abbruch: () => stapelAbbruchRef.current,
          // Teile mehrteiliger Bögen über Durchgänge merken (R2-A2).
          merker: teileMerker(zielId),
        },
      );
      let neu = 0;
      let uebersprungen = 0;
      for (const fund of erg.funde) {
        // Signatur wie beim Einzelscan prüfen und den Rohpayload mitspeichern —
        // sonst verlöre der Meldekopf beim Weiterreichen die fremde Signatur.
        const status = fund.payload ? await signaturVonPayload(fund.payload) : null;
        const r = meldungAufnehmen(zielId, fund.bogen, {
          quelle: "scan",
          signatur: status ? alsEintragSignatur(status) : undefined,
          herkunft: fund.payload ? base64UrlKodieren(fund.payload) : undefined,
        });
        if (r) r.neu ? neu++ : uebersprungen++;
      }
      einsaetzeNeuLaden();
      setStapelBericht(stapelBerichtZeilen(erg, neu, uebersprungen));
    } catch (e) {
      setFehler(`Stapel einlesen: ${fehlerText(e)}`);
    } finally {
      setStapelStand("");
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
    setFehler(""); // Meldung der vorigen Handlung nicht stehen lassen (E6)
    try {
      let s: Einsatzsammlung;
      if (istPdfDatei(datei)) {
        const gefunden = einsatzAusPdfBytes(new Uint8Array(await datei.arrayBuffer()));
        if (!gefunden) {
          if (await boegenAlsNeuerEinsatz(datei)) return;
          // Eine abgeschnittene PDF ist „beschädigt", nicht „ohne Bogen" (R2-E5).
          const leer = new Error(
            "In dieser PDF steckt weder eine Einsatz-Sammlung noch ein einzelner Bogen — " +
              "es sind keine eingebetteten Daten und kein lesbarer QR-Code darin.",
          );
          setFehler(await dateiFehlerMeldung(datei, leer, "einsatz"));
          return;
        }
        s = gefunden;
      } else {
        try {
          s = einsatzAusDatei(await datei.text());
        } catch (err) {
          // Keine Sammlung, aber vielleicht ein Bogen (oder mehrere) als JSON.
          if (await boegenAlsNeuerEinsatz(datei)) return;
          throw err;
        }
      }
      // Vor Ort entfernte Meldungen kommen nicht still zurück (R2-D4).
      const geklaert = await entfernteImImportKlaeren(s);
      // Bekannte Meldungen abgleichen statt nur neue anzuhängen (R3-W1).
      const r = einsatzAbgleichen(geklaert.sammlung);
      // Was von dort kam, hat das andere Gerät schon (R3-W2).
      weitergabeUmImportErgaenzen(s.id, r.neueIds, r.neueVermerke);
      const letzteImImport = letzteMeldung(geklaert.sammlung.eintraege);
      einsaetzeNeuLaden();
      setFehler("");
      const abgleich = abgleichText(r);
      setMeldung(
        (r.neuerEinsatz
          ? `Einsatz „${s.name}" importiert (${r.hinzugefuegt} Meldung(en)).`
          : `Einsatz „${s.name}": ${r.hinzugefuegt} neue Meldung(en) ergänzt` +
            (abgleich ? `. ${abgleich}` : r.hinzugefuegt === 0 ? " — die Datei enthält nichts, was hier fehlte." : ".")) +
          // Wie aktuell die übernommene Lage ist: Kam auf dem alten Gerät
          // danach noch etwas, fehlt es hier (Audit Runde 3, R3-K5).
          (letzteImImport != null ? ` Letzte Meldung darin: ${zeitLang(letzteImImport)}.` : "") +
          geklaert.hinweis,
      );
      setOffenerEinsatzId(s.id);
    } catch (err) {
      setFehler(await dateiFehlerMeldung(datei, err, "einsatz")); // nie Parser-Text (R2-E5)
    }
  }

  // Offener Einsatz (Meldekopf/Zugführer) — Vorrang vor Assistent/Start, aber
  // nicht über der Musterung/dem Assistenten während einer manuellen Erfassung.
  const offenerEinsatz = offenerEinsatzId ? einsaetze.find((s) => s.id === offenerEinsatzId) : null;
  // Laufende Sammlungen für die Weiche der Startseite (R3-K5): die zuletzt
  // geänderten, höchstens zwei — sonst wird aus der Weiche eine zweite Liste.
  const laufende = [...einsaetze].sort((a, b) => b.geaendert - a.geaendert).slice(0, 2);

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
        <SpeicherWarnung stand={einsaetze} />
        <EinsatzDetail
          einsatz={offenerEinsatz}
          onZurueck={() => { setOffenerEinsatzId(null); setZeigeStart(true); setMeldung(""); setEingang(null); }}
          onGeaendert={einsaetzeNeuLaden}
          onScannen={() => scanneInEinsatz(offenerEinsatz.id)}
          onManuell={() => manuellInEinsatz(offenerEinsatz.id)}
          onDateiImport={(dateien) => void importiereBoegen(offenerEinsatz.id, dateien)}
          onBilderImport={(dateien) => void importiereQrBilder(offenerEinsatz.id, dateien)}
          onExport={() => exportiereEinsatz(offenerEinsatz)}
          onCsvExport={(umfang) => exportiereEinsatzCsv(offenerEinsatz, umfang)}
          onCsvDetailExport={(umfang) => exportiereEinsatzCsvDetail(offenerEinsatz, umfang)}
          onOldenburgExport={(umfang) => exportiereEinsatzOldenburg(offenerEinsatz, umfang)}
          onSammelPdf={(umfang) => sammelPdf(offenerEinsatz, umfang)}
          exportStand={exportStand}
          exportUmfang={exportUmfang}
          onExportUmfang={setExportUmfang}
          onWeitergeben={() => sammelPdf(offenerEinsatz, "alle")}
          onLageblatt={() => lageblatt(offenerEinsatz)}
          eingang={eingang}
          onGeloescht={() => { setOffenerEinsatzId(null); einsaetzeNeuLaden(); setMeldung(""); /* Quittung mit Rückweg: Startseite (R2-D6) */ }}
        />
        {(meldung || fehler) && (
          <p className={fehler ? "fehler" : "meldung"} role="status" style={{ textAlign: "center" }}>
            {fehler || meldung}
          </p>
        )}
        {/* Eine angefangene Erfassung für diesen Einsatz liegt im Assistenten:
            Wer mit „‹ Einsatz" zurückkam, findet sie hier wieder — nicht als
            fremden „eigenen Bogen" auf der Startseite (Audit „Neuer Nutzer", F2). */}
        {bogen && fremdeErfassung && sammelZielId === offenerEinsatz.id && (
          <p className="meldung" role="status" style={{ textAlign: "center" }}>
            Angefangene Erfassung für diesen Einsatz: „{einheitAnzeigename(bogen.einheit) || "(noch ohne Namen)"}".{" "}
            <button type="button" className="link" onClick={() => { setMeldung(""); setOffenerEinsatzId(null); setZeigeStart(false); }}>Weiter erfassen</button>
          </p>
        )}
        {/* Stapel-Fortschritt und -Bericht holen sich selbst ins Bild (R2-A2). */}
        <StapelQuittung
          stand={stapelStand}
          onAbbrechen={() => (stapelAbbruchRef.current = true)}
          bericht={stapelBericht}
          onSchliessen={() => setStapelBericht([])}
          merker={teileMerker(offenerEinsatz.id)}
        />
        {/* Kiosk-Scan: die aufgenommenen Bögen bleiben im Einsatz — der Knopf
            beendet nur den Durchgang, deshalb „Fertig". Liegen aber Teile eines
            noch unvollständigen Bogens im Sammelstand, gehen die beim Schließen
            verloren — dann ist es ehrlicher weiterhin ein „Abbrechen". */}
        {scannerOffen && (
          <QrScannerWeb
            onErgebnis={scanErgebnisWeb}
            fortschritt={scanFortschritt}
            onAbbruch={() => scanAbbrechen(true)}
            onBild={ladeQrBild}
            teile={segmentStand}
            abbruchText={segmenteOffen ? "Abbrechen" : "Fertig"}
          />
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
      {/* Die Kopfleiste der Themenwelt nur auf der Startseite: In Assistent
          und Einsatzansicht konkurrierte sie mit Schrittleiste und
          Rücksprung — und wer dort arbeitet, sucht keine Themenseite.
          Nur im Browser, wie der erklärende Text unten (imWebBrowser()). */}
      <SeitenKopf variante="start-kopf" vorspann={imWebBrowser() ? <Kopfnav /> : null}>
        <div className="titelzeile">
          <h1>Digitaler Einheiten-Erfassungsbogen</h1>
          {/* Feld/Nacht auch hier, nicht nur in der Fußzeile: Wer draußen
              zuerst auf der Startseite landet, stellt die Anzeige sofort um. */}
          <AnzeigeSchalter />
        </div>
      </SeitenKopf>
      <main id="inhalt" tabIndex={-1} className="start">
        {/* Die Werbezeile erklärt das Prinzip für den ersten Besuch. Mit
            eigenem Entwurf, Vorlagen oder Einsätzen ist sie längst bekannt und
            drängt sich nur noch vor die Karte, um die es jetzt geht — das
            Offline-Versprechen bleibt als schmales Badge stehen, der Satz
            entfällt (wie „So funktioniert's" unten). */}
        {erststart && (
          <p>
            Das kostenlose Online-Tool für BOS-Einheiten und Hilfsorganisationen:
            Bogen digital erfassen, als PDF drucken, als Datei teilen – und per
            QR-Code ohne Internetverbindung von Gerät zu Gerät übertragen.
          </p>
        )}
        {/* Die Zusage erst, wenn sie stimmt (R2-O1, offline-bereit.ts). */}
        <p className={`offline-badge${offline.stand === "bereit" ? "" : " offline-laedt"}`} role="status">{offlineText(offline)}</p>
        <SpeicherWarnung stand={einsaetze} />
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
                {/* Vorlagen-Bearbeitung: Die Karte trug denselben Titel wie der
                    eigene Bogen darunter und wurde als Doppelung verworfen (R3-D1). */}
                {bearbeiteteVorlage && (
                  <span className="hinweis warnung-text">Bearbeitung der Vorlage „{bearbeiteteVorlage.name}" — kein Einsatzbogen</span>
                )}
                {/* Eine fremde Einheit ist nicht „mein Bogen" — die Karte sagt es (R2-E3). */}
                {fremdeErfassung && (
                  <span className="hinweis">
                    Angefangene Erfassung
                    {(() => {
                      const ziel = sammelZielId ? einsaetze.find((x) => x.id === sammelZielId) : undefined;
                      return ziel ? ` für „${ziel.name}"` : " einer fremden Einheit";
                    })()}
                  </span>
                )}
                {/* Stand gegenüber der letzten Übergabe (R2-W2). */}
                {(() => {
                  const u = uebergabeText(bogen, uebergabe);
                  return u && <span className={`hinweis${u.geaendert ? " warnung-text" : ""}`}>{u.text}</span>;
                })()}
                {/* Alter Bogen: der Zeitraum steht auf der Karte, bevor jemand „Fortsetzen" tippt (R2-S1). */}
                {bogen.einsatz.zeitraumBis < heuteDatum() && (
                  <span className="hinweis warnung-text">Einsatz {zeitraumDeutsch(bogen)}</span>
                )}
                <span className="hinweis">
                  {/* Kurzlegende sichtbar: die Zahlen allein erklärte nur Schritt 3 (R2-N9). */}
                  Stärke {s.fuehrer} / {s.unterfuehrer} / {s.mannschaft} / {s.gesamt} (F / UF / M / Ges)
                  {gespeichertUm
                    ? ` · gespeichert ${uhrzeitMitTag(gespeichertUm)} Uhr`
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
        {/* Rückholung: Was ein anderer Bogen verdrängt hat, ist nicht verloren.
            Die Zeile steht unter der Entwurfskarte, damit der aktuelle Bogen
            zuerst kommt — sie ist der Ausweg, nicht das Angebot. */}
        {ersetzterEntwurf && (
          <section className="entwurf-karte verdraengt">
            <span className="entwurf-text">
              <strong>{einheitAnzeigename(ersetzterEntwurf.bogen.einheit)}</strong>
              <span className="hinweis">
                Zuletzt verdrängter Bogen · Stand{" "}
                {new Date(ersetzterEntwurf.gespeichert).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })} Uhr
              </span>
            </span>
            <span className="entwurf-aktionen">
              <button type="button" onClick={holeVerdraengtenZurueck}>Zuletzt verdrängten Bogen zurückholen</button>
            </span>
          </section>
        )}
        {/* Rückmeldungen stehen ÜBER den Aktionen: „Entwurf … wiederhergestellt"
            erklärt die Karte darüber, und unter den Knöpfen klebte der Kasten
            optisch an der Knopfreihe, statt ein eigener Block zu sein. */}
        {meldung && (
          <p className="meldung" role="status" key={meldung}>
            {meldung}
            {vorlageRueckweg && meldung.startsWith(`Vorlage „`) && (
              <>
                {" "}
                <button
                  type="button"
                  onClick={() => {
                    vorlageZuruecksetzen(vorlageRueckweg);
                    vorlagenNeuLaden();
                    setMeldung(`Vorlage „${vorlageRueckweg.name}" auf die vorige Fassung zurückgesetzt.`);
                    setVorlageRueckweg(null);
                  }}
                >
                  Rückgängig
                </button>
              </>
            )}
          </p>
        )}
        {/* Holt sich ins Bild und wird angesagt: die Knöpfe sitzen weit
            unter dieser Zeile (Audit Runde 2, R2-L2). */}
        {fehler && <FehlerImBild text={fehler} />}
        {/* Ohne Kamera-Overlay (nativer Scan, „QR aus Bild einlesen") steht der
            Fortschritt hier — mit derselben Kästchenzeile, damit auch dieser
            Weg zeigt, welcher Teil noch aussteht. */}
        {scanFortschritt && !scannerOffen && (
          <>
            <p className="meldung" role="status" key={scanFortschritt}>{scanFortschritt}</p>
            <TeilQuittung teile={segmentStand} />
          </>
        )}
        {/* Zwei-Wege-Weiche: beide bestätigten Nutzergruppen (PRODUCT.md) mit
            gleichem Gewicht — die Einheit mit eigenem Bogen links, der
            Meldekopf rechts. Vorher gab es nur EINEN Primärknopf („Neuen
            Bogen erstellen"), und wer sammeln wollte, wählte am Meldekopf
            regelmäßig den falschen Einstieg. */}
        <div className="weiche">
          <section className="weiche-weg" aria-labelledby="weg-eigener-bogen">
            <h2 id="weg-eigener-bogen">Meinen Bogen ausfüllen</h2>
            <p className="hinweis">
              Für Einheiten, die ihre eigene Stärkemeldung erfassen, drucken und weitergeben.
            </p>
            <div className="aktionen">
              <button type="button" className={bogen ? "" : "primaer"} onClick={async () => {
                if (!(await darfBogenErsetzen({ titel: "Neuen Bogen anfangen?", was: "einen leeren Bogen", ok: "Neu anfangen" }))) return;
                setMeldung("");
                setBogen(neuerBogen());
                setzeEmpfang(null);
                setSchritt(0);
                setZeigeStart(false);
              }}>
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
                <input type="file" accept=".pdf,application/pdf,.json,application/json" onChange={ladeDatei} className="nur-sr" />
              </label>
            </div>
          </section>
          <section className="weiche-weg" aria-labelledby="weg-meldekopf">
            <h2 id="weg-meldekopf">Bögen sammeln (Meldekopf)</h2>
            <p className="hinweis">
              Für Meldeköpfe, Bereitstellungsräume und Zugführer: eintreffende Bögen bündeln
              — Stärke und Sofortbedarf laufend zusammengezählt.
            </p>
            <div className="aktionen">
              {/* „Neuer Einsatz…" lasen Helfer als Beginn der eigenen Meldung
                  (Audit „Neuer Nutzer", F3) — der Knopf nennt jetzt, was er
                  anlegt: die Sammelmappe. */}
              {/* Laufende Sammlungen direkt hier öffnen: auf dem Telefon stand
                  ihre Karte erst unter Entwurf, Vorlagen und Weiche, bei rund
                  1 850 px (Audit Runde 3, R3-K5). Die zuletzt geänderten zuerst,
                  mit dem Zeitpunkt der letzten Meldung. */}
              {laufende.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="primaer sammlung-oeffnen"
                  onClick={() => { setMeldung(""); setOffenerEinsatzId(s.id); }}
                >
                  „{s.name}" öffnen
                  <span className="knopf-zusatz">{letzteMeldungText(s)}</span>
                </button>
              ))}
              <button type="button" className={laufende.length > 0 ? "" : "primaer"} onClick={neuerEinsatz}>Neue Einsatz-Sammlung…</button>
              {/* Direkter Einstieg in die Meldekopf-Schnellerfassung: vorher nur
                  als Radio in Schritt 3 erreichbar — unter Zeitdruck fand ihn
                  dort niemand. */}
              <button
                type="button"
                onClick={async () => {
                  // Erst das Ziel: Die Schnellerfassung von hier kannte keine
                  // Sammlung, sprach wie der eigene Bogen und endete mit einem
                  // offenen Entwurf (Audit Runde 2, R2-N6, R2-S2).
                  const ziel = await schnellerfassungsZiel();
                  if (ziel === null) return;
                  if (!(await darfBogenErsetzen({ titel: "Einheit schnell erfassen?", was: "die schnell zu erfassende Einheit", ok: "Schnell erfassen" }))) return;
                  setFremdeErfassung(true);
                  setErfassungBeginn(Date.now());
                  setSammelZiel(ziel || null);
                  setMeldung("");
                  setBogen(schnellerfassungsBogen());
                  setzeEmpfang(null);
                  setSchritt(0);
                  setZeigeStart(false);
                }}
              >
                Einheit schnell erfassen (nur Stärke)…
              </button>
              <label className="datei-knopf">
                Einsatz importieren…
                <input type="file" accept=".json,application/json,.pdf,application/pdf" className="nur-sr" onChange={importiereEinsatzDatei} />
              </label>
            </div>
          </section>
        </div>
        {scannerOffen && (
          <QrScannerWeb onErgebnis={scanErgebnisWeb} fortschritt={scanFortschritt} onAbbruch={() => scanAbbrechen(false)} onBild={ladeQrBild} teile={segmentStand} />
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
              onBearbeiten={(v) => void vorlageBearbeiten(v)}
              onGeaendert={vorlagenNeuLaden}
              frischeId={frischeVorlageId}
            />
          </section>
        )}
        {/* Anlegen/Import sitzen oben in der Weiche; hier steht die Liste der
            laufenden Sammlungen. Die Überschrift bleibt wörtlich bestehen —
            E2E-Szenarien und Anleitung verweisen auf sie. */}
        <section className="start-vorlagen">
          <h2>Einsatz-Sammlung (Meldekopf)</h2>
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
            Zugeklappt, bis man ihn braucht — der sichtbare „hinterlegen…"-Link
            reicht als Einstieg; die dauerhaft offene Karte zeigte sonst ein
            „Übernehmen/Abbrechen"-Paar, obwohl niemand etwas begonnen hatte. */}
        <section className="start-vorlagen">
          <h2>Absender für übergebene Bögen</h2>
          <p className="hinweis">
            Jeder übergebene Bogen trägt automatisch ein Echtheits-Siegel dieses Geräts.
            Wer freiwillig Name und Rückkanal hinterlegt, macht daraus einen Absender,
            den die Gegenstelle bei Rückfragen auch erreichen kann.
          </p>
          <AbsenderkarteFeld karte={absender} onGespeichert={setAbsender} />
        </section>
        {/* Mit vorhandenen Daten bleibt die Erklärung erreichbar — am Ende der
            Startseite, über der Fußzeile, statt den Arbeitsbereich zu verdrängen. */}
        {!erststart && <SoFunktionierts />}
        {/* Der erklärende Text ist Web-Inhalt: Er beantwortet „was ist das
            hier?" für den ersten Besuch und trägt die Startseite in den
            Suchmaschinen. Deshalb zwei Bedingungen:
              - nur im Browser — wer die App installiert hat, weiß es bereits
                (die Frühweiche in index.html blendet ihn dort schon vor dem
                Mount aus, sonst blitzte er im Gerüst kurz auf);
              - nur beim Erststart — sobald Entwurf, Vorlagen oder Einsätze da
                sind, ist die Startseite Arbeitsfläche und kein Prospekt mehr.
            Im Browser-Erststart steht damit nach dem Mount Zeichen für Zeichen
            dasselbe wie im statischen Gerüst von index.html. */}
        {erststart && imWebBrowser() && <StartInhalt />}
      </main>
      <Fusszeile onBogenOeffnen={oeffneBeispiel} />
      </>
    );
  }

  // Bearbeiten verwirft den Import-Signaturstatus: er beschreibt den empfangenen
  // Transport, nicht den nun geänderten Bogen.
  const aendern = (patch: Partial<Erfassungsbogen>) => {
    // Jede Bearbeitung datiert den Stand neu — die Zeitgruppe im PDF und die
    // Revisionsreihenfolge der Einsatz-Sammlung zeigen die letzte Änderung.
    setBogen({ ...bogen, ...patch, stand: jetztZeitpunkt() });
    setzeEmpfang(null);
  };

  // Leichter Füllstand je Schritt (Orientierung; die Übersicht hat keinen Status).
  const status = schrittStatus(bogen);
  // Erfassung für eine Sammlung? Dann trägt der Kopf den Einsatz und die
  // Fußleiste den Abschluss (F2) — nur bei einer als fremd markierten
  // Erfassung, nie beim eigenen Bogen (R3-S2).
  const sammelEinsatz = fremdeErfassung && sammelZielId ? einsaetze.find((s) => s.id === sammelZielId) ?? null : null;

  return (
    <>
    <Aktualisierungshinweise />
    <SeitenKopf variante="assistent-kopf">
      {/* Rücksprung und Anzeige-Umschalter teilen sich die erste Zeile. Der
          Umschalter stand vorher in der Titelzeile und rutschte dort auf dem
          Telefon unter den Titel — eine eigene Zeile für vier Knöpfe, die
          einmal im Einsatz gesetzt werden. „‹ Startseite" braucht 80 der 360
          px; daneben ist der Platz, und erreichbar bleibt der Umschalter
          genauso: Wer beim Ausfüllen in die Sonne gerät, findet ihn im Kopf
          des Formulars. */}
      <div className="kopf-oberzeile">
        {/* In der Erfassung für einen Einsatz führt der Rückweg in den Einsatz,
            nicht auf die Startseite: Dorthin gehört die halbe Erfassung nicht,
            und dort sah sie aus wie der eigene Bogen (Audit „Neuer Nutzer", F2). */}
        {sammelEinsatz ? (
          <button type="button" className="zur-start" onClick={() => { setMeldung(""); setOffenerEinsatzId(sammelEinsatz.id); }}>
            ‹ Einsatz „{sammelEinsatz.name}"
          </button>
        ) : (
          <button type="button" className="zur-start" onClick={() => { setMeldung(""); setZeigeStart(true); }}>
            ‹ Startseite
          </button>
        )}
        <AnzeigeSchalter klappbar />
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
        {/* Modus-Marke: In der Meldekopf-Schnellerfassung sah der Assistent
            genauso aus wie beim vollen Bogen — sechs Schritte, dieselbe
            Überschrift. Die Marke steht auf jedem Schritt und sagt, warum
            Personal nur als Zahl erfasst wird. */}
        {bogen.personalErfassung === PersonalErfassung.NUR_STAERKE && (
          <span className="modus-marke" title="Personal wird nur als Stärke erfasst (Führer/Unterführer/Mannschaft), nicht namentlich">
            Schnellerfassung
          </span>
        )}
        {sammelEinsatz && (
          <span className="modus-marke" title={`Diese Erfassung wird als Meldung in die Sammlung „${sammelEinsatz.name}" gelegt — mit „In Einsatz übernehmen" auf jedem Schritt.`}>
            Aufnahme für: {sammelEinsatz.name}
          </span>
        )}
        {/* Vorlagen-Bearbeitung: der Assistent sieht aus wie bei jedem Bogen —
            die Marke sagt auf jedem Schritt, dass hier die gespeicherte Vorlage
            geändert wird und nicht ein Einsatzbogen entsteht. */}
        {bearbeiteteVorlage && (
          <span className="modus-marke" title={`Die gespeicherte Vorlage „${bearbeiteteVorlage.name}" wird bearbeitet — sichern in der Übersicht über „Vorlage aktualisieren"`}>
            Vorlage
          </span>
        )}
      </div>
      {/* Der aktive Schritt steht nicht nur als CSS-Klasse da: ohne
          aria-current="step" liest eine Vorlesesoftware sechs gleichwertige
          Knöpfe vor und sagt nicht, wo man gerade ist. */}
      <nav className="schritte" aria-label="Schritte">
        {SCHRITTE.map((name, i) => {
          const st = status[i]; // undefined für die Übersicht (letzter Schritt)
          const klassen = [i === schritt ? "aktiv" : "", st ? `status-${st}` : ""].filter(Boolean).join(" ");
          // „begonnen" als Wort statt „•": das Symbol verstand niemand (R2-N3, F6).
          const glyph = st === "ok" ? "✓" : st === "begonnen" ? "offen" : "";
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
              {/* Name in eigenem Span: auf dem Telefon steht nur die Nummer im
                  Bild, der Name bleibt für Vorlesesoftware im Knopf (R2-H7).
                  Der äußere Span hält Nummer und Name als EIN Flex-Kind. */}
              <span>{i + 1}<span className="schritt-name">. {name}</span></span>
              {glyph && <span className="schritt-status" aria-hidden="true">{glyph}</span>}
            </button>
          );
        })}
      </nav>
      {fenster.konflikt ? (
        <FensterKonflikt abgleich={fenster} />
      ) : speicherFehler ? (
        <p className="autosave speicher-fehler" role="alert">
          ⚠ Nicht gespeichert — der Speicher dieses Geräts ist voll. Der Bogen bleibt geöffnet; bitte jetzt „Bogen übergeben" (PDF) oder in der Fußzeile der Startseite Papierkorb leeren bzw. Sicherung erstellen.
          {gespeichertUm ? ` Letzter gesicherter Stand: ${uhrzeitMitTag(gespeichertUm)} Uhr.` : ""}
        </p>
      ) : gespeichertUm ? (
        <p className="autosave" role="status">
          ✓ automatisch gespeichert · {uhrzeitMitTag(gespeichertUm)} Uhr — bleibt auf diesem Gerät
        </p>
      ) : null}
    </SeitenKopf>
    {/* Übungs-Störer: volle Breite direkt unter dem Kopf, auf jedem Schritt.
        Er hängt am Bogen (nicht an einem Geräte-Modus) und erscheint darum
        auch, wenn ein fremder Übungsbogen gescannt wurde. */}
    {bogen.uebung && (
      <div className="uebungs-band" role="status">
        <strong>ÜBUNG</strong> — Dieser Bogen ist als Übung gekennzeichnet und beschreibt keinen echten Einsatz.
        {" "}Übungsbögen unterliegen keiner Datenschutzfrist.
      </div>
    )}
    <FristBand bogen={bogen} />
    {/* Die Übersicht ist der einzige Schritt ohne fixe Schritt-Navigation
        (siehe unten) — sie braucht deshalb auch nicht den Freiraum dafür. */}
    <main
      id="inhalt"
      tabIndex={-1}
      className={schritt === UEBERSICHT ? "ohne-nav" : sammelEinsatz ? "mit-uebernehmen" : undefined}
    >
      {/* Rückmeldungen (Vorlage gespeichert, Beispielbogen geöffnet …) gehören
          dorthin, wo die Aktion ausgelöst wurde. Ohne diese Zeile blieben sie
          im Assistenten unsichtbar und tauchten später unvermittelt auf der
          Startseite auf. */}
      {meldung && <p className="meldung" role="status" key={meldung}>{meldung}</p>}
      {fehler && <p className="fehler" role="alert">{fehler}</p>}
      {/* Der Schrittwechsel trägt seine Richtung: vorwärts kommt der Inhalt von
          rechts, zurück von links. Die Schrittleiste oben sagt, WO man ist —
          dass man gerade zurückgesprungen ist (etwa weil ein Prüfpunkt in einen
          früheren Schritt verweist), sagte bisher nichts. Bewusst kurz: das
          hier ist der Weg zur Arbeit, nicht die Arbeit.
          `key` erzwingt den Neuaufbau, damit die Bewegung bei jedem Wechsel
          neu ansetzt — die Schritte tauschen ohnehin die Komponente. */}
      <div className={`schritt-inhalt ${richtung}`} key={schritt}>
      {/* Nacherfassung für einen Einsatz: die Uhrzeit vom Meldeblock gleich
          oben mitnehmen, statt sie danach je Karte über „ändern" (R2-A5). */}
      {schritt === 0 && sammelEinsatz && fremdeErfassung && (
        <EintreffzeitFeld wert={nachEintreffzeit} onAendern={setNachEintreffzeit} />
      )}
      {schritt === 0 && <SchrittEinheit bogen={bogen} aendern={aendern} geheZu={setSchritt} />}
      {schritt === 1 && <SchrittEinsatz bogen={bogen} aendern={aendern} />}
      {schritt === 2 && <SchrittPersonal bogen={bogen} aendern={aendern} geheZu={setSchritt} />}
      {schritt === 3 && <SchrittFahrzeuge bogen={bogen} aendern={aendern} />}
      {schritt === 4 && <SchrittSofortbedarf bogen={bogen} aendern={aendern} />}
      {schritt === UEBERSICHT && (
        <Uebersicht
          bogen={bogen}
          signatur={bogenSignatur}
          herkunft={bogenHerkunft}
          geheZu={geheZuFeld}
          uebergabe={uebergabe}
          onUebergeben={() => setUebergabe(uebergabeFesthalten(bogen))}
          schliessenFolgen={() => (bogenHatInhalt(bogen) ? folgenFuerOffenenBogen() : { satz: "", verlust: false })}
          neu={() => { if (bogenHatInhalt(bogen)) merkeVerdraengt(bogen); setMeldung(""); setBogen(null); setVorlageInBearbeitung(null); setFremdeErfassung(false); setSammelZiel(null); setzeEmpfang(null); setSchritt(0); }}
          onVorlageGespeichert={(name) => { vorlagenNeuLaden(); setMeldung(`Als Vorlage „${name}" gespeichert.`); }}
          vorlageBearbeitung={
            bearbeiteteVorlage ? { name: bearbeiteteVorlage.name, onAktualisieren: () => void vorlageAktualisierenUndSchliessen() } : undefined
          }
          onInEinsatzAufnehmen={() => { einsaetzeNeuLaden(); einsatzWahlDialog.current?.showModal(); }}
          onNeuerEinsatz={() => {
            const heute = heuteDatum();
            const { sofortbedarf: _alt, ...ohneBedarf } = bogen;
            setBogen({ ...ohneBedarf, einsatz: { zeitraumVon: heute, zeitraumBis: heute, ortAuftrag: "" }, stand: jetztZeitpunkt() });
            setSchritt(1);
            setMeldung("Einsatzdaten für den neuen Einsatz zurückgesetzt — Ort/Auftrag eintragen. Personal und Fahrzeuge sind geblieben.");
          }}
          sammelAktion={
            sammelEinsatz
              ? { label: "In Einsatz übernehmen", onUebernehmen: () => void erfassungUebernehmen() }
              : undefined
          }
        />
      )}
      </div>

      {/* Einsatz-Auswahl für „In Einsatz-Sammlung ablegen…": ein gescannter oder
          geöffneter Bogen wandert von der Übersicht direkt in eine Sammlung. */}
      {schritt === UEBERSICHT && (
        <dialog ref={einsatzWahlDialog} aria-label="In Einsatz-Sammlung ablegen" className="teilen-dialog">
          <div className="kopfzeile">
            <h2>In Einsatz-Sammlung ablegen</h2>
            <button type="button" onClick={() => einsatzWahlDialog.current?.close()}>Schließen</button>
          </div>
          <p className="hinweis">
            {bogenSignatur
              ? "Die empfangene Meldung wird in der Sammlung abgelegt und hier geschlossen."
              : fremdeErfassung
                ? "Die Erfassung wird in der Sammlung abgelegt und hier geschlossen."
                : "Dein Bogen wird als Meldung abgelegt und bleibt hier geöffnet."}
            {" "}Ist die Einheit dort schon gemeldet, wird nachgefragt (neue Fassung oder eigene Einheit).
          </p>
          {fehler && <p className="fehler" role="alert">{fehler}</p>}
          {einsaetze.map((s) => (
            <div className="teilen-weg" key={s.id}>
              <button type="button" onClick={() => bogenInEinsatzLegen(s.id)}>{s.name}</button>
              <p className="hinweis">
                {ART_LABEL[s.art]}{s.ort ? ` · ${s.ort}` : ""} · {aktuelleMeldungen(s.eintraege, s.art).length} Einheit(en) anwesend
              </p>
            </div>
          ))}
          <div className="teilen-weg">
            <button type="button" className={einsaetze.length === 0 ? "primaer" : ""} onClick={neuerEinsatzFuerBogen}>
              Neue Sammlung anlegen…
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
        <footer className={sammelEinsatz ? "nav mit-uebernehmen" : "nav"}>
          <button type="button" disabled={schritt === 0} onClick={() => setSchritt(schritt - 1)}>← Zurück</button>
          {/* Der Abschluss der Einsatz-Erfassung stand nur auf Schritt 6; am
              Meldekopf reicht oft Schritt 1 und 3 (F2). Im Hochformat steht er
              in eigener Zeile über dem Blättern: schmal zwischen „← Zurück" und
              „Weiter →" traf ein Handschuh, der „Weiter" suchte, das Ablegen
              (Audit Runde 3, R3-G3). */}
          {sammelEinsatz ? (
            <button type="button" className="uebernehmen" onClick={() => void erfassungUebernehmen()}>In Einsatz übernehmen</button>
          ) : (
            <span className="platzhalter" />
          )}
          {/* Schnellerfassung einer fremden Einheit: nach Name und Typ direkt
              zur Stärke — Schritt 2 („Wofür deine Einheit gemeldet wird") ist
              dort nicht gefragt (R2-N6). */}
          <button
            type="button"
            className="primaer"
            onClick={() =>
              setSchritt(
                schritt === 0 && fremdeErfassung && bogen.personalErfassung === PersonalErfassung.NUR_STAERKE ? 2 : schritt + 1,
              )
            }
          >
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
