/**
 * Die Anwendung selbst: Startbildschirm (neu / Vorlage / Datei / QR), Assistent,
 * Übersicht, Vorlagenliste, Musterung und Einsatz-Sammlung.
 *
 * Bewusst getrennt vom Browser-Einstieg (main.tsx): so lässt sich `App` in
 * Tests rendern, ohne dass ein Wurzelknoten oder Plattform-Seiteneffekte nötig sind.
 */

import { Fragment, useEffect, useLayoutEffect, useRef, useState, type ChangeEvent } from "react";
import { START_ABSCHNITTE, type Teil } from "./start-inhalt";
import type { Erfassungsbogen, Person } from "@bos/eeb-format/model";
import { nachzueglerMerken } from "./vorlage-nachzuegler";
import {
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
  einheitAnzeigename,
  einheitOrt,
  bogenSpeichern,
  neuerBogen,
  schrittStatus,
} from "./hilfen";
import { EEB_EPOCHE_MS, PersonalErfassung, staerke } from "@bos/eeb-format/model";
import {
  DATENSCHUTZFRIST_TAGE,
  bogenAnonymisiert,
  datenschutzfristAbgelaufen,
  datenschutzfristEnde,
  tageBisAnonymisierung,
} from "@bos/eeb-format/datenschutzfrist";
import { datenschutzZeitpunkt, stempelZeitpunkt } from "./datenschutz-uhr";
import { Kopfnav } from "./kopfnav-ui";
import { bogenLinksEmpfangen, imWebBrowser, istNativ, qrScannen } from "./nativ";
import { useOnline } from "./online";
import { ereignisZaehlen, type Ereignis } from "./statistik";
import { fehlerText } from "./nachladen";
import { dateiFehlerMeldung } from "./datei-fehler";
import { WORD_DATEI_ARTEN, istWordDatei } from "./word-bogen-fehler";
import { FehlerImBild } from "./fehler-im-bild";
import { eigenesZurueckUm, eigenesZurueckVerbrauchen, rueckfrageEintragErsetzbar } from "./modal-overlay";
import { FensterKonflikt, nachAbgleichFortsetzen, useFensterAbgleich } from "./fenster-abgleich";
import { entwirreScanText } from "./tastaturbelegung";
import { ASSISTENT_SCHRITT_SPERRE_MS, ortSperren, SEITENWECHSEL_SPERRE_MS } from "./tipp-schutz";
import { vorlageAktualisieren, vorlageAnlegen, vorlageAusDatei, vorlageZahlenText, vorlagenLaden, vorlagenPapierkorb, vorlageZuruecksetzen, type Vorlage } from "./vorlagen";
import { Musterung, VorlagenListe } from "./vorlagen-ui";
import { musterungVorlageAusStand } from "./musterung-stand";
import { rueckwegeVergessen } from "./rueckweg-sitzung";
import { einsatzVorbereiten, einsatzWegGilt, einsatzWegHolen, einsatzWegVergessen, einsatzWiederherstellen, type EinsatzWeg } from "./einsatz-vorbereiten";
import { absenderkarteLaden, type Absenderkarte } from "./absenderkarte";
import { AbsenderkarteFeld } from "./absenderkarte-ui";
import { einsaetzeLaden } from "./einsaetze-lesen";
import { speicherBelegung, speicherFehlerArt } from "./eintrag-zeiten";
import { offlineFortschritt, offlineLangText, offlineRuhig, offlineText, offlineZeileOffen, useOfflineStand } from "./offline-bereit";
import { uebergabeBestaetigen, uebergabeNachWeg, uebergabeText, type UebergabeStand } from "./uebergabe-stand";
import { boegenAusPdfBytes, istPdfDatei } from "./einsatz-transport";
import { QrScannerWeb } from "./qr-scanner-web";
import { handscannerLauscher, tastaturGehoertElement } from "./handscanner";
import { TeilQuittung, fehlendeTeile, fehltNochSatz, teilGelesenSatz, verworfeneTeileSatz } from "./teil-quittung";
import { qrAusBild } from "./qr-bild";
import { beispielMerken, beispielOffenMerken, beispielVergessen, istUnveraendertesBeispiel } from "./beispiel-herkunft";
import { ansichtSchluessel, stelleLaden, stelleMerken } from "./ansicht-stelle";
import { DaumenQuittung } from "./daumen-quittung";
import {
  entwurfAusAnderemFenster,
  entwurfLaden,
  beschaedigterEntwurfAnzeige,
  beschaedigtenEntwurfVerwerfen,
  entwurfSpeichern,
  entwurfVerwerfen,
  ersetztenEntwurfLaden,
  ersetztenEntwurfAblegen,
  type AblageErgebnis,
  rueckholungNimmt,
  ersetztenEntwurfVerwerfen,
  entwurfUeberschreibenErlauben,
  entwurfFremdEntfernt,
  entwurfFremdGeaendert,
  type Entwurf,
} from "./entwurf";
import { SeitenKopf } from "./seiten-kopf";
import { datumZweistellig } from "./papierkorb-frist";
import { UnlesbarHinweis } from "./unlesbar-hinweis";
import { AnzeigeLeistenKnopf, AnzeigeSchalter } from "./anzeige-schalter";
import { orgFarbe, wendeOrgAkzentAn } from "./org-farben";
import { EinheitZeichen } from "./zeichen-bild";
import { Fusszeile, beispielboegenOeffnen } from "./fusszeile";
import { MeldekopfWeg } from "./meldekopf-weg";
import { rueckMarkeUebernehmen } from "./meldekopf-app";
import { Aktualisierungshinweise } from "./aktualisierung";
import { SpeicherWarnung, istVoll } from "./speicher-warnung";
import { arbeiten, useArbeitet } from "./arbeitet";
import { wartendenLinkErledigt, wartendenLinkLesen, wartendenLinkMerken } from "./wartender-link";
import { FesteWarnung } from "./feste-warnung";
import { speicherFehlerDetails, speicherFehlerKurz } from "./speicher-fehler-text";
import { UhrHinweis, UhrWarnung } from "./uhr-warnung";
import { Dialogschicht, frageJaNein, frageWahl } from "./dialoge";
import {
  SchrittEinheit,
  SchrittEinsatz,
  SchrittFahrzeuge,
  SchrittPersonal,
  SchrittSofortbedarf,
  Uebersicht,
  personalRueckwegVergessen,
} from "./schritte";

const SCHRITTE = ["Einheit", "Einsatz", "Personal", "Fahrzeuge", "Sofortbedarf", "Übersicht"];
const UEBERSICHT = SCHRITTE.length - 1;
const SCHRITT_EINSATZ = 1; // Landepunkt nach der Musterung: Ort/Zeitraum sind das einzig Leere.

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
 * Meldung bei einem Link ohne lesbaren Bogen — mit dem nächsten Schritt: Meist
 * ist er auf dem Weg gekürzt worden (Chat, Mail), und der Absender hat QR-Code
 * und PDF zur Hand (Audit Runde 4, R4-E7).
 */
const LINK_UNGUELTIG =
  "Der geöffnete Link enthält keinen gültigen Erfassungsbogen. Er ist vermutlich unterwegs abgeschnitten worden — " +
  "bitte den QR-Code oder die PDF des Absenders verwenden oder den Link neu anfordern.";

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
  // Kein Link in der Adresszeile, aber einer, auf dessen Wahl vor dem Neuladen
  // noch gewartet wurde: erneut fragen, statt ihn zu verlieren (R5-S6).
  const fragment = fragmentNehmen() || wartendenLinkLesen();
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
    return { bogen: null, vorlage: null, fehler: LINK_UNGUELTIG, text: "", segment: "" };
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



/** Erklärfilm (erklaerfilm/, veröffentlicht unter public/video/). */
const FILM_MB = 28; // Größe von public/video/erklaerfilm.mp4 (erklaerfilm/veroeffentlichen.mjs)
const FILM_WEB = "https://erfassungsbogen.app/video/erklaerfilm.mp4";

/**
 * Der Erklärfilm „Ankommen am Meldekopf" (gut fünf Minuten): Papier gegen
 * digital am Meldekopf, dann jede Seite des Assistenten. Im Browser direkt
 * abspielbar; geladen wird erst beim Antippen (preload="none"), damit die
 * Startseite am Meldekopf mit schlechtem Netz nicht schwerer wird. Die
 * installierten Apps tragen die Datei nicht mit (scripts/ohne-video.mjs) und
 * verlinken auf die Website.
 * Ohne Netz verschwindet der Bereich ganz: Ein Player, der nichts laden kann,
 * wäre am Meldekopf nur eine schwarze Fläche. Dasselbe, wenn das Laden
 * scheitert, obwohl der Browser „online" meldet (WLAN ohne Internet). Läuft
 * der Film schon, bleibt er stehen — was gepuffert ist, spielt weiter.
 */
export function Erklaerfilm() {
  const online = useOnline();
  const [ladefehler, setLadefehler] = useState(false);
  const [gestartet, setGestartet] = useState(false);
  // Je Seitenaufruf jedes Ereignis höchstens einmal zählen — Pause und
  // Weiterspielen oder Zurückspulen über die Hälfte zählen nicht doppelt.
  const gezaehlt = useRef(new Set<Ereignis>());
  const zaehlen = (e: Ereignis) => {
    if (gezaehlt.current.has(e)) return;
    gezaehlt.current.add(e);
    ereignisZaehlen(e);
  };
  if ((!online && !gestartet) || ladefehler) return null;
  if (!imWebBrowser()) {
    return (
      <p className="erklaerfilm">
        <a href={FILM_WEB} target="_blank" rel="noopener noreferrer" onClick={() => zaehlen("erklaerfilm-link-app")}>
          Erklärfilm ansehen
        </a>{" "}
        (5 Minuten, öffnet im Browser, rund {FILM_MB} MB)
      </p>
    );
  }
  return (
    <figure className="erklaerfilm">
      <video
        controls
        preload="none"
        playsInline
        poster="video/erklaerfilm.jpg"
        width={1920}
        height={1080}
        onPlay={() => {
          setGestartet(true);
          zaehlen("erklaerfilm-start");
        }}
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          if (v.duration > 0 && v.currentTime >= v.duration / 2) zaehlen("erklaerfilm-haelfte");
        }}
        onEnded={() => zaehlen("erklaerfilm-ende")}
      >
        <source src="video/erklaerfilm.mp4" type="video/mp4" onError={() => setLadefehler(true)} />
        <track kind="subtitles" src="video/erklaerfilm.vtt" srcLang="de" label="Deutsch" />
      </video>
      <figcaption>
        Erklärfilm, 5 Minuten: eine THW-Einheit kommt am Meldekopf an, dann jede Seite des Bogens. Lädt erst beim
        Abspielen (rund {FILM_MB} MB); Untertitel lassen sich im Player einschalten.
      </figcaption>
    </figure>
  );
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
      <Erklaerfilm />
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
 * Einstieg in die Beispielbögen direkt unter „So funktioniert's". Bisher
 * standen sie nur als Link in der Fußzeile unter „Daten" — zum Ausprobieren
 * sind sie aber der schnellste Weg, einen fertigen Bogen samt QR-Code zu
 * sehen. Der Knopf öffnet denselben Dialog wie der Fußzeilen-Link.
 */
function BeispielboegenStart() {
  // Der Dialog ist ein nachgeladener Baustein: Bis er offen ist, sagt der Knopf es (BB2-M5, BB2-E4).
  const [laedt, setLaedt] = useState(false);
  return (
    <section className="start-vorlagen start-beispiele" aria-label="Beispielbögen">
      <h2>Beispielbögen</h2>
      <p className="hinweis">
        Ausgefüllte Bögen fiktiver Einheiten zum Ansehen und Ausprobieren, sortiert nach Organisation und
        Thema. Jeder lässt sich in der App öffnen, als PDF erzeugen oder als Link weitergeben.
      </p>
      <button
        type="button"
        className="primaer"
        aria-busy={laedt || undefined}
        disabled={laedt}
        onClick={() => {
          setLaedt(true);
          void beispielboegenOeffnen().finally(() => setLaedt(false));
        }}
      >
        {laedt ? "Beispielbögen werden geladen …" : "Beispielbögen ansehen"}
      </button>
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

// Vor dem Fragment: `?rueck=meldekopf` merken und aus der Adresse nehmen (meldekopf-app.ts).
rueckMarkeUebernehmen();
const START = startAusUrlFragment();



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

/**
 * Der aktive Reiter der Schrittleiste liegt mittig im Bild, wenn die Leiste seitlich rollt (Zoom, Querformat; Audit Runde 9, R9-M8).
 * Nur der Rollbereich der Leiste wird bewegt, nie die Seite.
 */
function reiterZeigen(el: HTMLButtonElement | null): void {
  const leiste = el?.parentElement;
  if (!el || !leiste || leiste.scrollWidth <= leiste.clientWidth) return;
  const abstand = el.getBoundingClientRect().left - leiste.getBoundingClientRect().left;
  leiste.scrollLeft += abstand - (leiste.clientWidth - el.offsetWidth) / 2;
}

/** Was die App gerade zeigt — für den Browser-Verlauf (Zurück-Knopf, Audit „Fehler", E3). */
// `muster`: die Musterung einer Vorlage ist eine eigene Ansicht mit Verlaufseintrag (R7-H2).
type Ansicht = { schritt: number; zeigeStart: boolean; scanner: boolean; muster?: boolean; lauf?: string };
/**
 * Kennung dieses Seitenaufrufs. Verlaufseinträge tragen sie: Nach dem Neuladen steht der Verlauf aus der Zeit davor
 * noch da (Schritt 2, 1, 0), und Zurück von der Startseite zeigte weiter die Startseite, zweimal, bevor die App
 * verlassen wurde (R11-E8). Einträge einer fremden Kennung überspringt die App mit einem weiteren Zurück.
 */
const LAUF_ID = Math.random().toString(36).slice(2, 10);
/** Gehört der Verlaufseintrag zu einem früheren Seitenaufruf (Rest vor dem Neuladen)? */
export function verlaufRest(ziel: { lauf?: string } | undefined | null, lauf: string = LAUF_ID): boolean {
  return !!ziel?.lauf && ziel.lauf !== lauf;
}
/**
 * Soll Zurück den Eintrag aus der Zeit vor dem Neuladen überspringen? Nur auf der Startseite (R11-E8): Wer mitten im
 * Assistenten neu lädt und dann zurück will, soll auf dem vorigen Eintrag landen (meist die Startseite) und nicht aus der App
 * fliegen (R17-S2).
 */
export function verlaufRestUeberspringen(
  ziel: { lauf?: string } | undefined | null,
  aktuell: Pick<Ansicht, "zeigeStart" | "scanner" | "muster"> | null | undefined,
  lauf: string = LAUF_ID,
): boolean {
  const aufStartseite = !aktuell || (aktuell.zeigeStart && !aktuell.scanner && !aktuell.muster);
  return aufStartseite && verlaufRest(ziel, lauf);
}

/**
 * Das oberste offene Fenster schließen, als hätte man Escape gedrückt —
 * für die Zurück-Geste (R4-S1). Rückfragen der Dialogschicht liegen immer
 * oben. QR-Vollbild und Scanner führen ihren Rücksprung selbst
 * (`data-zurueck="eigen"`: eigener Verlaufseintrag bzw. Teil der Ansicht).
 * Rückgabe: ob ein Fenster offen war.
 */
function offenesFensterAbbrechen(): boolean {
  if (typeof document === "undefined") return false;
  const offen = [...document.querySelectorAll<HTMLDialogElement>("dialog[open]")].filter(
    (d) => d.dataset.zurueck !== "eigen",
  );
  if (offen.length === 0) return false;
  const oben = offen.find((d) => d.classList.contains("abfrage")) ?? offen[offen.length - 1]!;
  const abbruch = new Event("cancel", { cancelable: true });
  oben.dispatchEvent(abbruch);
  if (!abbruch.defaultPrevented && oben.open) oben.close("");
  return true;
}

function ansichtGleich(a: Ansicht, b: Ansicht): boolean {
  return a.schritt === b.schritt && a.zeigeStart === b.zeigeStart && a.scanner === b.scanner && !!a.muster === !!b.muster;
}

// Ein Segment-Teil aus dem Kaltstart darf nur einmal in den Sammelstand —
// StrictMode (Entwicklung) führt Mount-Effekte doppelt aus.
let startSegmentVerbraucht = false;
let startEmpfangVerbraucht = false;


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
 *
 * Entschieden wird beim ersten Aufbau der App, nicht beim Laden dieses
 * Moduls: Das Modul wird importiert, bevor main.tsx der Sammlung ihren
 * Speicher reicht (`speicherVerdrahten`). Beim Laden sah `einsaetzeLaden()`
 * darum nie eine Sammlung, und am Meldekopf ohne eigenen Bogen öffnete ein
 * Kaltstart-Link den fremden Bogen als eigenen Arbeitsbogen, ohne „Wohin
 * damit?" (Audit Runde 4, R4-W3).
 */
interface StartLage {
  sofort: Erfassungsbogen | null;
  /** Bogen aus dem Start-Link, der erst nach dem Mounten (mit Rückfrage) übernommen wird. */
  empfang: Erfassungsbogen | null;
  entwurf: typeof ENTWURF_GESPEICHERT;
  /** Neu geladen über „Stand aus dem anderen Fenster laden": den Bogen direkt zeigen (R4-S4). */
  fortsetzen: boolean;
}
let startLageGemerkt: StartLage | null = null;
function startLage(): StartLage {
  if (!startLageGemerkt) {
    const sofort =
      START.bogen && !(ENTWURF_GESPEICHERT && bogenHatInhalt(ENTWURF_GESPEICHERT.bogen)) && einsaetzeLaden().length === 0
        ? START.bogen
        : null;
    // Wartet noch die Wahl „Wohin damit?", bleibt der Link im Sitzungsspeicher
    // (R5-S6); alles andere ist mit dem Aufbau der App erledigt.
    if (START.bogen && !sofort && START.text) wartendenLinkMerken(START.text);
    else wartendenLinkErledigt();
    startLageGemerkt = {
      sofort,
      empfang: START.bogen && !sofort ? START.bogen : null,
      entwurf: sofort ? null : ENTWURF_GESPEICHERT,
      fortsetzen: nachAbgleichFortsetzen(),
    };
  }
  return startLageGemerkt;
}

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
  const id = startLage().entwurf?.fremd?.einsatzId;
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

/**
 * Jeder Wechsel der Ansicht (Startseite, Assistent, Musterung,
 * Einsatz-Sammlung) beginnt oben, mit Kopf und Überschrift im Bild.
 *
 * Der Schrittwechsel im Assistenten tat das schon (R2-H1), der Wechsel VON
 * der Startseite aber nicht: „Neuen Bogen erstellen", „Fortsetzen", „Einsatz
 * vorbereiten" und die Schnellerfassung liegen dort meist unter dem ersten
 * Bild, und die neue Ansicht übernahm deren Scrollposition. Die Musterung
 * öffnete bei 819 px — fünf angehakte Personen samt Stärke-Leiste über dem
 * Bildrand —, die Schnellerfassung ohne „Eingetroffen um" und die Marke der
 * Sammlung (Audit Runde 3, R3-H1). Darum hängt das an der Ansicht, nicht an
 * jedem einzelnen Knopf. Vor dem Malen (Layout-Effekt), damit die Mitte der
 * neuen Seite nicht kurz aufblitzt; der Fokus geht wie beim Schrittwechsel
 * auf die Überschrift, ohne zu rollen.
 */
function useAnsichtBeginntOben(ansicht: string) {
  const vorige = useRef(ansicht);
  useLayoutEffect(() => {
    if (vorige.current === ansicht) return;
    vorige.current = ansicht;
    try {
      window.scrollTo(0, 0);
    } catch {
      /* Testumgebung ohne Layout */
    }
    const kopf =
      document.querySelector<HTMLElement>(".schritt-inhalt h2") ??
      document.querySelector<HTMLElement>(".seiten-kopf h1");
    if (kopf && ansicht !== "start") {
      if (!kopf.hasAttribute("tabindex")) kopf.tabIndex = -1;
      kopf.focus({ preventScroll: true });
    }
  }, [ansicht]);
}

function AppInhalt() {
  const { sofort: START_SOFORT, empfang: START_EMPFANG, entwurf: ENTWURF, fortsetzen: NACH_ABGLEICH } = startLage();
  const [bogen, setBogen] = useState<Erfassungsbogen | null>(START_SOFORT ?? ENTWURF?.bogen ?? null);
  // Ohne offenen Bogen gibt es keine Beispieldaten mehr, nach denen die Rückfrage beim Abwählen von „Übung" fragt (R14-E6).
  const keinBogen = bogen === null;
  useEffect(() => {
    if (keinBogen) {
      beispielVergessen();
      beispielOffenMerken(null);
    }
  }, [keinBogen]);
  /**
   * Kennung der gespeicherten Vorlage, die der offene Bogen gerade bearbeitet
   * („Bearbeiten" auf der Vorlagenkarte). Solange sie gesetzt ist, bietet die
   * Übersicht „Vorlage aktualisieren" statt „Als Vorlage speichern" an, und
   * jeder Weg, der den Bogen ersetzt oder schließt, löst die Verbindung. Sie
   * wandert mit dem Entwurf in den Speicher, damit sie einen Neustart überlebt.
   */
  const [vorlageInBearbeitung, setVorlageInBearbeitung] = useState<string | null>(ENTWURF?.vorlageId ?? null);
  /** Letzte Übergabe des offenen Bogens (R2-W2, uebergabe-stand.ts). */
  const [uebergabe, setUebergabe] = useState<UebergabeStand | null>(ENTWURF?.uebergabe ?? null);
  // „Fortsetzen" öffnet den Schritt, auf dem gearbeitet wurde — nicht immer
  // die Übersicht mit acht gelben Punkten (Audit Runde 2, R2-N7).
  const [schritt, setSchritt] = useState(START_SOFORT ? UEBERSICHT : ENTWURF ? (ENTWURF.schritt ?? UEBERSICHT) : 0);
  const richtung = useSchrittRichtung(schritt);
  const offline = useOfflineStand();
  // Wechselt die Offline-Zeile beim Erstbesuch ihren Text, hält sie bis zum Neuladen die Höhe der längsten Fassung (R18-K7, M10).
  const [offlinePlatz, setOfflinePlatz] = useState(() => offlineZeileOffen(offline));
  if (!offlinePlatz && offlineZeileOffen(offline)) setOfflinePlatz(true);
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
  // Wer aus der Übersicht einen Punkt beheben geht („Bearbeiten“, offener Punkt), kommt mit „Zur Übersicht →“
  // zurück, statt sich durch die übrigen Schritte zu tippen (R9-W4). Gilt nur für diesen einen Schritt.
  const [ausUebersicht, setAusUebersicht] = useState<number | null>(null);
  const geheZuFeld = (s: number, feld?: string) => {
    zielFeld.current = feld ?? null;
    setAusUebersicht(schritt === UEBERSICHT && s !== UEBERSICHT ? s : null);
    setSchritt(s);
  };
  useEffect(() => {
    if (vorigerSchritt.current === schritt) return;
    vorigerSchritt.current = schritt;
    setAusUebersicht((a) => (a === schritt ? a : null));
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
        ? `Entwurf vom ${new Date(ENTWURF.gespeichert).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })} Uhr wiederhergestellt.${ENTWURF.fremd ? " Die Aufnahme läuft dort weiter, wo du warst." : " „Fortsetzen“ öffnet ihn dort, wo du warst."}`
        : "",
  );
  /** Der Satz „Entwurf … wiederhergestellt" gehört in die Entwurfskarte (R18-N7). */
  const meldungInKarte = !!bogen && meldung.startsWith("Entwurf vom ");
  const [scannerOffen, setScannerOffen] = useState(false);
  // Zuletzt verdrängter Arbeitsbogen (entwurf.ts): Solange er hier steht,
  // bietet die Startseite ihn zum Zurückholen an.
  // Bestätigung der letzten PDF-Erzeugung (Weitergeben, Lageblatt, Blanko-Vordruck),
  // gezeigt direkt unter deren Knöpfen (R5-L4).
  const [ausgabeQuittung, setAusgabeQuittung] = useState<string | null>(null);
  const pdfArbeitet = useArbeitet();
  const [ersetzterEntwurf, setErsetzterEntwurf] = useState<Entwurf | null>(() => ersetztenEntwurfLaden());
  // „Für neuen Einsatz vorbereiten“: Stand davor für „Rückgängig“, auch nach dem Neuladen (R16-E2).
  const [einsatzWeg, setEinsatzWeg] = useState<EinsatzWeg | null>(() => einsatzWegHolen(bogen));
  // Ein gespeicherter Bogen, den die App nicht lesen kann, liegt beiseite und
  // wird auf der Startseite genannt, statt zu verschwinden oder die Ansicht
  // weiß zu machen (Audit Runde 5, R5-E1).
  const [beschaedigt, setBeschaedigt] = useState(() => beschaedigterEntwurfAnzeige());
  // Zeigt den Startbildschirm, ohne den aktuellen Bogen zu verwerfen –
  // er lässt sich von dort per „Aktuellen Bogen fortsetzen“ wieder öffnen.
  // Eine angefangene Erfassung für eine Sammlung (Meldekopf) öffnet nach dem
  // Neuladen gleich wieder die Erfassung — vorher landete man auf der
  // Startseite und brauchte „Fortsetzen" (Audit Runde 3, R3-S7). Der eigene
  // Bogen beginnt weiter auf der Startseite.
  const [zeigeStart, setZeigeStart] = useState(
    !START_SOFORT && !!ENTWURF && (!erfassungsZielBeimStart() || ENTWURF.fremd?.startseite === true) && !NACH_ABGLEICH,
  );
  const [vorlagen, setVorlagen] = useState<Vorlage[]>(() => vorlagenLaden());
  /** Vorige Fassung nach „Vorlage aktualisieren" — für „Rückgängig" (R2-D2). */
  const [vorlageRueckweg, setVorlageRueckweg] = useState<Vorlage | null>(null);
  // Absenderkarte (Gerätestand) — auch auf der Startseite einstellbar; die
  // Übersicht liest sie beim Mounten erneut aus dem Speicher.
  const [absender, setAbsender] = useState<Absenderkarte>(() => absenderkarteLaden());
  // Eine vor dem Neuladen offene Musterung öffnet wieder, mit ihren Haken
  // (Audit Runde 4, R4-E7); ein Link oder eine angefangene Erfassung geht vor.
  // Der Bogen kommt eben aus einer Musterung: Schritt 2 bietet „Zur Übergabe →"
  // an, weil Personal, Fahrzeuge und Bedarf schon aus der Vorlage stehen (R4-H5).
  const [nachMusterung, setNachMusterung] = useState(false);
  const [musterVorlage, setMusterVorlage] = useState<Vorlage | null>(() =>
    START.bogen || START.segment || START.vorlage || START_SOFORT || erfassungsZielBeimStart() ? null : musterungVorlageAusStand(vorlagen),
  );
  /**
   * Die gerade eingescannte Vorlage. Der Startbildschirm listet sie im selben
   * Augenblick; zwischen den vorhandenen Vorlagen fiele sie sonst nicht auf.
   */
  const [frischeVorlageId, setFrischeVorlageId] = useState<string | null>(null);
  // Segmentierung: gesammelte Teile eines großen Bogens (Zustand als Ref, damit
  // der laufende Kamera-/Native-Scan darauf zugreift) + Fortschrittstext fürs Overlay.
  const segmentTeileRef = useRef<SegmentTeil[]>([]);
  // Dasselbe fürs Rendern: der Sammelstand speist die Kästchenzeile
  // (TeilQuittung), und liegen Teile eines noch UNvollständigen Bogens im
  // Speicher, nimmt Schließen tatsächlich etwas zurück — das steht dann auch
  // auf dem Knopf.
  const [segmentStand, setSegmentStand] = useState<SegmentTeil[]>([]);
  const setzeSegmentTeile = (teile: SegmentTeil[]) => {
    segmentTeileRef.current = teile;
    setSegmentStand(teile);
  };
  const [scanFortschritt, setScanFortschritt] = useState("");

  const vorlagenNeuLaden = () => setVorlagen(vorlagenLaden());
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
  const musterAktiv = musterVorlage != null;
  // R14-S2: Bildlaufstelle über ein Neuladen hinweg. Gemerkt wird beim Rollen, Ausblenden und Verlassen der Seite; nach dem
  // Neuladen rollt die erste passende Ansicht (gleiche Ansicht-Kennung, höchstens 12 Stunden alt) dorthin zurück.
  const stelleAnsicht = ansichtSchluessel({ schritt, zeigeStart: startSichtbar, scanner: scannerOffen, muster: musterAktiv });
  const stelleAnsichtRef = useRef(stelleAnsicht);
  stelleAnsichtRef.current = stelleAnsicht;
  const stelleErledigt = useRef(false);
  useEffect(() => {
    let uhr: ReturnType<typeof setTimeout> | undefined;
    const merken = () => {
      if (stelleAnsichtRef.current && stelleErledigt.current) stelleMerken(stelleAnsichtRef.current, window.scrollY);
    };
    const beiRollen = () => {
      clearTimeout(uhr);
      uhr = setTimeout(merken, 300);
    };
    const beiSichtwechsel = () => {
      if (document.visibilityState === "hidden") merken();
    };
    window.addEventListener("scroll", beiRollen, { passive: true });
    window.addEventListener("pagehide", merken);
    document.addEventListener("visibilitychange", beiSichtwechsel);
    return () => {
      clearTimeout(uhr);
      window.removeEventListener("scroll", beiRollen);
      window.removeEventListener("pagehide", merken);
      document.removeEventListener("visibilitychange", beiSichtwechsel);
    };
  }, []);
  useEffect(() => {
    if (stelleErledigt.current || !stelleAnsicht) return;
    // Nur die erste Ansicht nach dem Start: Wer sie verlässt, beginnt anderswo oben (und merkt von da an wieder).
    const y = stelleLaden(stelleAnsicht);
    if (y == null) {
      // Die Startseite wartet noch auf „Fortsetzen"; jede andere Ansicht ohne gemerkte Stelle beendet das Warten.
      if (stelleAnsicht !== "start") stelleErledigt.current = true;
      return;
    }
    const rollen = () => window.scrollTo(0, y);
    const rahmen = requestAnimationFrame(() => requestAnimationFrame(() => {
      rollen();
      stelleErledigt.current = true;
    }));
    // Listen, die erst nach dem ersten Bild ihre Höhe haben, holen den Rest nach.
    const spaeter = setTimeout(() => {
      if (Math.abs(window.scrollY - y) > 40) rollen();
    }, 400);
    return () => {
      cancelAnimationFrame(rahmen);
      clearTimeout(spaeter);
    };
  }, [stelleAnsicht]);
  // Ausgangsansicht einer Erfassung oder eines Scans (Startseite, Einsatzansicht) und wie viele Verlaufseinträge
  // seither dazukamen (R11-S2). Endet die Handlung dort, werden sie mit einem Schritt verbraucht.
  const ruecksprungRef = useRef<{ ziel: Ansicht; tiefe: number } | null>(null);
  // Nach dem Sprung ersetzt der Lauscher den Eintrag, auf dem die Ansicht landet, durch die stehende Ansicht.
  const nachSprungErsetzenRef = useRef(false);
  useEffect(() => {
    const jetzt: Ansicht = { schritt, zeigeStart: startSichtbar, scanner: scannerOffen, muster: musterAktiv, lauf: LAUF_ID };
    const vorher = ansichtRef.current;
    ansichtRef.current = jetzt;
    if (typeof history === "undefined") return;
    if (!vorher) {
      // Der erste Eintrag der App trägt eine Marke: Rückfragen legen dort einen
      // eigenen Eintrag an, damit Zurück sie schließt statt die App zu verlassen
      // (R5-S5, modal-overlay.ts). Nach dem Neuladen ist `eeb` schon da.
      const roh = (history.state ?? {}) as { eeb?: Ansicht };
      history.replaceState({ ...roh, eeb: jetzt, ...(roh.eeb ? {} : { eebErste: true }) }, "");
      return;
    }
    if (ansichtGleich(vorher, jetzt)) return;
    // Unter dem Finger liegt jetzt etwas anderes: Nach „Weiter →" wieder
    // „Weiter →" (ein Doppeltipp übersprang Schritt 2), nach „Neuen Bogen
    // erstellen" das „◐" des Assistenten (das Darstellungsmenü ging auf).
    // Die Stelle des Tipps eben nimmt 1,5 s nichts an (Audit Runde 4, R4-S2,
    // R4-S3) — wie nach „Abrücken".
    // Wechselt nur der Schritt, bleibt „Weiter →" an derselben Stelle: 0,9 s (R4-S2; R10-S2: 1,5 s schluckten im Takt von 1 s jeden zweiten Tipp). Öffnet sich dagegen
    // die Sammlung, die Startseite oder ein anderes Fenster, liegen unter dem Finger andere Knöpfe, und
    // wer die Knöpfe liest, tippt nach einer halben Sekunde: dort nur 600 ms (R9-H5).
    // R17-G11: 0,5 s nach „Weiter →" (vorher 0,9 s: jeder zweite Tipp im Takt von 0,4 bis 0,8 s blieb liegen).
    ortSperren(vorher.schritt === jetzt.schritt ? SEITENWECHSEL_SPERRE_MS : ASSISTENT_SCHRITT_SPERRE_MS);
    if (verlaufZielRef.current && ansichtGleich(verlaufZielRef.current, jetzt)) {
      verlaufZielRef.current = null; // Rücksprung angekommen — kein neuer Eintrag
      return;
    }
    verlaufZielRef.current = null;
    // Die Musterung endet (Abbrechen, „Bogen anlegen", anderer Weg): Ihr Eintrag wird ersetzt
    // statt überbaut, damit Zurück zur Startseite führt, nicht in die tote Musterung (R7-H2).
    // Bricht sie nur ab und steht die Startseite da, nimmt der Verlauf den Eintrag zurück.
    if (vorher.muster && !jetzt.muster) {
      const st = (history.state ?? {}) as { eeb?: Ansicht; eebErste?: boolean };
      if (jetzt.zeigeStart && st.eeb?.muster && !st.eebErste) history.back();
      else history.replaceState({ ...(st.eebErste ? { eebErste: true } : {}), eeb: jetzt }, "");
      return;
    }
    // Abgeschlossene Handlung (R11-S2): „In Einsatz übernehmen" und Scanner „Fertig" legten einen Eintrag obendrauf;
    // Zurück zeigte dann dieselbe Ansicht noch einmal, das ausgefüllte Formular oder die wieder offene Kamera.
    const hub = (a: Ansicht) => a.zeigeStart && !a.scanner && !a.muster;
    const rs = ruecksprungRef.current;
    if (rs && hub(jetzt) && !rueckfrageEintragErsetzbar()) {
      ruecksprungRef.current = null;
      if (ansichtGleich(rs.ziel, jetzt)) {
        // Zurück auf den Eintrag, an dem die Handlung begann: derselbe Ansicht, nichts zu ersetzen.
        eigenesZurueckUm(rs.tiefe);
        return;
      }
      // Andere Ansicht (Schnellerfassung von der Startseite → Einsatz): auf den ersten Eintrag der Handlung
      // zurück und ihn durch die neue Ansicht ersetzen — Zurück führt dann dorthin, wo die Handlung begann.
      if (rs.tiefe > 1) {
        nachSprungErsetzenRef.current = true;
        eigenesZurueckUm(rs.tiefe - 1);
        return;
      }
      history.replaceState({ eeb: jetzt }, "");
      return;
    }
    const ersetzbar = rueckfrageEintragErsetzbar();
    if (!ersetzbar) {
      if (hub(vorher) && !vorher.muster && jetzt.scanner) ruecksprungRef.current = { ziel: vorher, tiefe: 1 };
      else if (ruecksprungRef.current) ruecksprungRef.current.tiefe += 1;
    }
    if (ersetzbar) history.replaceState({ eeb: jetzt }, "");
    else history.pushState({ eeb: jetzt }, "");
  }, [schritt, startSichtbar, scannerOffen, musterAktiv]);
  useEffect(() => {
    function beiVerlauf(e: PopStateEvent) {
      const ziel = (e.state as { eeb?: Ansicht } | null)?.eeb;
      // Zurück bei offener Rückfrage oder offenem Fenster ist „Abbrechen":
      // Es schließt, was oben liegt, und die Ansicht dahinter bleibt. Vorher
      // sprang die Ansicht, und die Rückfrage blieb über der falschen Seite
      // stehen und wirkte von dort, ohne „Rückgängig" (Audit Runde 4, R4-S1).
      // Der verbrauchte Verlaufseintrag wird für die stehende Ansicht neu
      // angelegt, damit das nächste Zurück wieder einen Schritt zurück führt.
      // Die späte Rückkehr eines eigenen `back()` (Fenster geschlossen, schon weitergetippt): Sie
      // zog den Eintrag der inzwischen gezeigten Ansicht ab; der wird wieder angelegt, die Ansicht
      // bleibt (e2e-Ausfall „Startseite" nach „Vorlage speichern", Runde 7).
      if (eigenesZurueckVerbrauchen()) {
        const jetzt = ansichtRef.current;
        if (nachSprungErsetzenRef.current) {
          nachSprungErsetzenRef.current = false;
          if (jetzt) {
            try {
              history.replaceState({ eeb: jetzt }, "");
            } catch {
              /* ohne Verlauf */
            }
          }
          return;
        }
        if (jetzt && !(ziel && ansichtGleich(ziel, jetzt))) {
          try {
            history.pushState({ eeb: jetzt }, "");
          } catch {
            /* ohne Verlauf */
          }
        }
        return;
      }
      if (offenesFensterAbbrechen()) {
        const jetzt = ansichtRef.current;
        if (jetzt && !(ziel && ansichtGleich(ziel, jetzt))) {
          try {
            history.pushState({ eeb: jetzt }, "");
          } catch {
            /* ohne Verlauf */
          }
        }
        return;
      }
      // Rest des Verlaufs vor dem Neuladen (R11-E8): überspringen, damit Zurück die App beim ersten Mal verlässt.
      // Nur auf der Startseite: Wer mitten im Einsatz oder im Assistenten neu lädt und dann zurück will, soll auf dem
      // vorigen Eintrag landen (meist die Startseite) und nicht aus der App fliegen (R17-S2).
      if (verlaufRestUeberspringen(ziel, ansichtRef.current)) {
        try {
          history.back();
        } catch {
          /* ohne Verlauf */
        }
        return;
      }
      if (!ziel) return;
      // Der Eintrag einer Rückfrage auf dem ersten Eintrag (R5-S5) führt auf
      // dieselbe Ansicht: nichts umzustellen, und das Ziel nicht merken.
      if (ansichtRef.current && ansichtGleich(ziel, ansichtRef.current)) return;
      verlaufZielRef.current = ziel;
      ruecksprungRef.current = null; // Zurück per Browser: kein Sprung mehr, der Verlauf stimmt nicht mehr mit dem Zähler
      if (!ziel.muster && musterVorlageRef.current) setMusterVorlage(null);
      else if (ziel.muster && !musterVorlageRef.current) setMusterVorlage(musterungVorlageAusStand(vorlagenRef.current));
      setSchritt(ziel.schritt);
      setZeigeStart(ziel.zeigeStart);
      if (!ziel.scanner && scannerOffenRef.current) scanAbbrechen();
      else if (ziel.scanner && !scannerOffenRef.current && !istNativ()) setScannerOffen(true);
    }
    window.addEventListener("popstate", beiVerlauf);
    return () => window.removeEventListener("popstate", beiVerlauf);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nur einmal registrieren; Handler nutzt Refs und stabile Setter
  }, []);
  const scannerOffenRef = useRef(false);
  scannerOffenRef.current = scannerOffen;
  const musterVorlageRef = useRef<Vorlage | null>(null);
  musterVorlageRef.current = musterVorlage;
  const vorlagenRef = useRef(vorlagen);
  vorlagenRef.current = vorlagen;

  // Entwurfssicherung: jede Änderung still sichern; wird der Bogen bewusst
  // geschlossen (Neuer Bogen, Übernahme in einen Einsatz), fällt der Entwurf weg.
  // Der Zeitstempel speist die sichtbare „automatisch gespeichert"-Anzeige —
  // sie nimmt die Angst, dass Eingaben bei Akku/Abbruch verloren gehen.
  const [gespeichertUm, setGespeichertUm] = useState<Date | null>(null);
  // Wahrheit statt Beruhigung: Schlägt das Sichern fehl (Speicher voll), sagt
  // die Zeile das — die alte Anzeige behauptete „gespeichert", während nichts
  // gespeichert war (Audit „Offline und Speicher", O1).
  const [speicherFehler, setSpeicherFehler] = useState(false);
  // Voll oder vom Browser gesperrt? Einmal je Fehlschlag geprüft (R3-O4).
  const [speicherArt, setSpeicherArt] = useState<"voll" | "gesperrt">("voll");
  // „gespeichert" ist der Zeitpunkt der letzten ÄNDERUNG des Bogens: Bloßes
  // Öffnen oder ein Schrittwechsel verschob ihn bisher auf „jetzt", und ein
  // drei Tage alter Entwurf stand als „gespeichert 12:36 Uhr" da (R2-O3).
  // Prüfrunde Beispielbögen (BB-D1 u. a., Runde 2 BB2-D2): Ein über „Anzeigen"
  // geöffnetes, unverändertes Beispiel ist nichts wert — es wird ohne Rückfrage
  // ersetzt oder geschlossen und belegt den Rückholplatz nicht. Gemerkt als
  // Prüfsumme im Speicher (beispiel-herkunft.ts), damit das auch nach dem
  // Neuladen und in einem zweiten Tab gilt.
  const bogenGespeichert = useRef<{ bogen: Erfassungsbogen | null; um: number }>({
    bogen: ENTWURF?.bogen ?? null,
    um: ENTWURF?.gespeichert ?? Date.now(),
  });
  // Zweites Fenster mit demselben Bogen (R2-O4).
  const fenster = useFensterAbgleich(!!bogen, () => {}, {
    eigenerBogen: () => bogen,
    onRueckholung: () => setErsetzterEntwurf(ersetztenEntwurfLaden()),
  });
  // R21-A5: „Entwurf vom … wiederhergestellt" steht im Assistenten nur bis zum ersten Schritt oder zur ersten Eingabe
  // (vorher auf jedem Schritt, 75 px hoch, nicht schließbar); ein leerer Entwurf zeigt ihn gar nicht (siehe Darstellung).
  const entwurfHinweisBei = useRef<{ bogen: Erfassungsbogen; schritt: number } | null>(null);
  useEffect(() => {
    if (!bogen || zeigeStart || !meldung.startsWith("Entwurf vom ")) {
      entwurfHinweisBei.current = null;
      return;
    }
    const vorher = entwurfHinweisBei.current;
    if (!vorher) {
      entwurfHinweisBei.current = { bogen, schritt };
    } else if (vorher.bogen !== bogen || vorher.schritt !== schritt) {
      entwurfHinweisBei.current = null;
      setMeldung("");
    }
  }, [bogen, schritt, zeigeStart, meldung]);
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
          schritt,
          uebergabe: uebergabe ?? undefined,
        },
        merk.um,
      );
      setSpeicherFehler(!ok);
      if (!ok) setSpeicherArt(speicherFehlerArt());
      if (ok) setGespeichertUm(new Date(merk.um));
    } else {
      bogenGespeichert.current = { bogen: null, um: Date.now() };
      entwurfVerwerfen();
      personalRueckwegVergessen(); // R7-O5: kein „Rückgängig" mit Namen im Tab, wenn der Bogen weg ist
      rueckwegeVergessen(); // dito für Fahrzeuge und Ebenen (R9-D3)
      setGespeichertUm(null);
      setSpeicherFehler(false);
    }
  }, [bogen, vorlageInBearbeitung, schritt, uebergabe, fenster.runde]);

  // Nicht Gespeichertes geht nicht ohne Rückfrage verloren: Schließen oder
  // Neuladen fragt nach, solange die Zeile „Nicht gespeichert" steht. Viele
  // mobile Browser zeigen den Dialog nicht; Tablet und Laptop am Meldekopf
  // schon (Audit Runde 3, R3-O4).
  useEffect(() => {
    if (!speicherFehler || !bogen) return;
    const warnen = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warnen);
    return () => window.removeEventListener("beforeunload", warnen);
  }, [speicherFehler, bogen]);

  /**
   * Die Vorlage zum offenen Bogen — nur solange sie noch in der Liste steht.
   * Landet sie zwischendurch im Papierkorb, ist der Bogen bis zur
   * Wiederherstellung ein gewöhnlicher Arbeitsbogen (die Kennung bleibt).
   */
  const bearbeiteteVorlage = vorlageInBearbeitung
    ? vorlagen.find((v) => v.id === vorlageInBearbeitung) ?? null
    : null;

  // Akzentfarbe der Oberfläche der Organisation des offenen Bogens anpassen —
  // ohne Bogen (Startseite) das Standard-Blau. So sieht man schon an der
  // Farbe, in welcher Organisation man gerade unterwegs ist.
  useEffect(() => {
    wendeOrgAkzentAn(bogen?.einheit.organisation);
  }, [bogen?.einheit.organisation]);

  async function musterungFertig(neuerArbeitsbogen: Erfassungsbogen, abgewaehlt: Person[] = [], alleDa?: string) {
    if (
      !(await darfBogenErsetzen({
        titel: "Bogen aus Vorlage anlegen?",
        was: "den Bogen aus der Vorlage",
        ok: alleDa ? "Ja, alle sind da — anlegen" : "Aus Vorlage anlegen",
        // „Alle dabei?" und „Bogen ersetzen?" in einer Rückfrage (R4-S5).
        vorab: alleDa,
        abbruch: alleDa ? "Zurück zur Liste" : undefined,
      }))
    )
      return;
    nachzueglerMerken(neuerArbeitsbogen, abgewaehlt);
    setBogen(neuerArbeitsbogen);
    if (neuerArbeitsbogen.uebung) beispielMerken(neuerArbeitsbogen); // Vorlage aus einem Beispiel (BB-D2, R14-E6)
    setNachMusterung(true);
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
    if (!istPdfDatei(datei) && !istWordDatei(datei)) {
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
    /** Word-Bogen: was übernommen, unter Sonstiges eingetragen oder verworfen wurde. */
    let wordQuittung: string[] = [];
    try {
      if (istWordDatei(datei)) {
        // Dynamisch: der Word-Leser gehört nicht ins Startbündel.
        const { bogenAusWordBytes } = await import("./word-bogen");
        const w = bogenAusWordBytes(new Uint8Array(await datei.arrayBuffer()));
        geladen = { bogen: w.bogen, anonymisiert: false };
        wordQuittung = w.quittung;
      } else if (istPdfDatei(datei)) {
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
    // Derselbe Bogen ist schon offen: nichts ersetzen, nichts verdrängen (R4-E2).
    if (bogenSchonOffen(geladen.bogen)) {
      schonOffenenBogenZeigen(geladen.bogen);
      return;
    }
    if (!(await darfBogenErsetzen({ titel: "Bogen aus Datei öffnen?", was: "den Bogen aus der Datei", ok: "Datei öffnen" }))) return;
    const b = geladen.bogen;
    if (b.uebung) beispielMerken(b); // Namen und Nummern aus einem Übungs-/Beispielbogen: Rückfrage beim Abwählen von „Übung" (R14-E6)
    setBogen(b);
    setzeEmpfang(null); // Datei-Import: kein signierter Transport
    setSchritt(UEBERSICHT);
    setZeigeStart(false);
    setFehler("");
    // Sammel-PDF eines Meldekopfs: hier lässt sich nur EIN Bogen öffnen —
    // alle zusammen liest die Meldekopf-App ein („Einsatz importieren…").
    setMeldung(
      [
        geladen.anonymisiert ? FRIST_ABGELAUFEN_MELDUNG : "",
        ...wordQuittung,
        anzahl > 1
          ? `Die PDF enthält ${anzahl} Bögen — geöffnet ist „${einheitAnzeigename(b.einheit)}". Alle auf einmal liest die Meldekopf-App ein.`
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
      if (await uebernehmeText(text, "Der QR-Code in der PDF enthält keinen gültigen Erfassungsbogen.")) return;
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
  function merkeVerdraengt(b: Erfassungsbogen, opt: { tausch?: boolean } = {}): AblageErgebnis {
    // Unverändertes Beispiel: liegt jederzeit wieder unter „Beispielbögen" bereit.
    if (beispielUnveraendert(b)) return "uebersprungen";
    const alt = opt.tausch ? null : ersetztenEntwurfLaden();
    // Bearbeitung einer gespeicherten Vorlage (R3-D1): Unverändert ist sie
    // nichts wert — die Vorlage liegt ja gespeichert vor. Verändert darf sie
    // wie eine fremde Erfassung keinen eigenen Bogen vom Rückholplatz
    // schieben: Dort lag nach „Vorlage bearbeiten" → „Verwerfen" die
    // unveränderte Vorlagen-Kopie, der echte Einsatzbogen war gelöscht.
    if (bearbeiteteVorlage && (vorlageUnveraendert(b) || !rueckholungNimmt(true, alt))) return "uebersprungen";
    // Derselbe Bogen liegt schon dort: keine Kopie über sich selbst (R3-E2).
    if (alt && JSON.stringify(alt.bogen) === JSON.stringify(b)) return "gemerkt";
    // „Alle Daten löschen" (oder Löschen des Bogens) in einem anderen Fenster:
    // Was dort entfernt wurde, schreibt dieses Fenster nicht aus dem
    // Arbeitsspeicher auf den Rückholplatz zurück (Audit Runde 7, R7-D1).
    if (entwurfFremdEntfernt()) return "uebersprungen";
    // Die Rückholung nennt die letzte Bearbeitung, nicht den Moment des Schließens (R4-S5).
    const geaendertUm = bogenGespeichert.current.bogen === b ? bogenGespeichert.current.um : undefined;
    // R20-D1: Ist der Speicher voll, zieht der Bogen vom Entwurfsplatz auf den Rückholplatz um;
    // gelingt auch das nicht, meldet die Antwort „voll" und der Aufrufer lässt den Bogen offen.
    const erg = ersetztenEntwurfAblegen(b, undefined, { ...opt, geaendertUm, ausEntwurf: !entwurfFremdGeaendert() });
    if (erg === "gemerkt") setErsetzterEntwurf(ersetztenEntwurfLaden());
    return erg;
  }

  /**
   * Der Bogen konnte nicht auf der Startseite abgelegt werden (Speicher voll,
   * R20-D1): Er bleibt offen, nichts hat sich geändert. Der sichere Ausweg ist
   * die Datei; erst danach lohnt es sich, Platz zu schaffen.
   */
  async function ablageVollMelden(b: Erfassungsbogen, was: string): Promise<void> {
    await (await import("./bogen-ablage-voll")).ablageVollMelden(b, was); // nachgeladen: der Fall ist selten
  }

  /** Steht im offenen Bogen noch genau das über „Anzeigen" geöffnete Beispiel? */
  function beispielUnveraendert(b: Erfassungsbogen | null = bogen): boolean {
    return istUnveraendertesBeispiel(b);
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
  function folgenFuerOffenenBogen(opt: { tausch?: boolean } = {}): { satz: string; verlust: boolean; verliertAlt?: Erfassungsbogen } {
    if (!bogen) return { satz: "", verlust: false };
    // Unverändertes Beispiel (BB2-D1): Es wird nicht abgelegt und verdrängt nichts.
    // Vorher warnte „Bogen schließen" in der Übersicht rot vor dem Verlust des
    // eigenen Bogens, der in Wahrheit auf dem Rückholplatz liegen blieb.
    if (beispielUnveraendert()) {
      const r = opt.tausch ? null : ersetztenEntwurfLaden();
      const wartet = r && !r.fremd && bogenHatInhalt(r.bogen) ? ` Dein Bogen „${einheitAnzeigename(r.bogen.einheit)}" bleibt auf der Startseite zurückholbar.` : "";
      return { satz: `Der Beispielbogen liegt weiter unter „Beispielbögen“ bereit.${wartet}`, verlust: false };
    }
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
    // In einem anderen Fenster gelöscht (R7-D1): nicht wieder ablegen, und die Frage sagt es.
    if (!opt.tausch && entwurfFremdEntfernt() && !(alt && JSON.stringify(alt.bogen) === JSON.stringify(bogen))) {
      return {
        satz: "Dieser Bogen wurde in einem anderen Fenster gelöscht oder geschlossen. Er wird hier nicht wieder abgelegt und ist danach nicht mehr erreichbar.",
        verlust: true,
      };
    }
    // Der Name steht schon im Satz davor; hier nicht noch einmal (Audit Runde 5, R5-D5).
    const bleibt = `Der Stand bleibt auf der Startseite unter „Zuletzt geschlossenen Bogen zurückholen" erreichbar.`;
    if (!altZaehlt) return { satz: bleibt, verlust: false };
    const stand = new Date(alt.gespeichert).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
    // Es gibt nur einen Rückholplatz (R7-D3): Der Verlust des dort liegenden Bogens steht VOR der Zusage.
    return {
      // Der verlorene Bogen steht im ersten Satz (R19-D8).
      satz: `${alt.fremd ? "Die Erfassung" : "Der Bogen"} „${altName}" (Stand ${stand} Uhr${altMerkmal ? ` · ${altMerkmal}` : ""}) auf dem Platz „Zuletzt geschlossener Bogen" wird dabei endgültig gelöscht: Er fasst nur einen Bogen. ${bleibt.replace("Der Stand bleibt", "Nur der jetzt ersetzte Stand bleibt")}`,
      verlust: true,
      verliertAlt: alt.bogen,
    };
  }

  /**
   * Gleicht ein eintreffender Bogen dem offenen aufs Zeichen? Dann gibt es
   * nichts zu ersetzen — und nichts vom Rückholplatz zu verdrängen (R4-E2).
   * Ein inzwischen bearbeiteter Bogen gleicht nicht mehr; dann fragt die
   * App wie bisher.
   */
  function bogenSchonOffen(neu: Erfassungsbogen): boolean {
    return !!bogen && JSON.stringify(bogen) === JSON.stringify(neu);
  }

  /** Den schon offenen Bogen zeigen, statt ihn durch sich selbst zu ersetzen. */
  function schonOffenenBogenZeigen(neu: Erfassungsbogen) {
    setSchritt(UEBERSICHT);
    setZeigeStart(false);
    setFehler("");
    setMeldung(
      [`Dieser Bogen ist schon offen: „${einheitAnzeigename(neu.einheit)}". Nichts ersetzt.`, eigenerBogenWartetHinweis()]
        .filter(Boolean)
        .join(" "),
    );
  }

  /** Satz für Quittungen: wo der eigene Bogen liegt, wenn er in der Rückholung wartet. */
  function eigenerBogenWartetHinweis(): string {
    const r = ersetztenEntwurfLaden();
    return r && !r.fremd && bogenHatInhalt(r.bogen)
      ? `Dein eigener Bogen „${einheitAnzeigename(r.bogen.einheit)}" liegt auf der Startseite unter „Zuletzt geschlossenen Bogen zurückholen".`
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
    /** Ein Satz vor der Frage (etwa „Alle dabei?" der Musterung, R4-S5) und die Beschriftung des Abbrechens. */
    vorab?: string;
    abbruch?: string;
  }): Promise<boolean> {
    setNachMusterung(false); // jeder andere Weg zu einem neuen Bogen kommt nicht aus der Musterung
    // Was auch immer den Bogen ersetzt: die Bearbeitung einer Vorlage ist es
    // danach nicht mehr — der verdrängte Bogen wird zum gewöhnlichen Entwurf.
    // Ebenso endet eine Aufnahme für eine Sammlung: Wer danach „Neuen Bogen
    // erstellen" tippte, erbte Kopf, Marke und „In Einsatz übernehmen" der
    // eben abgebrochenen Erfassung, und der eigene Bogen landete mit einem
    // Tipp in der fremden Sammlung (Audit Runde 3, R3-S2). Wege, die wieder
    // für eine Sammlung erfassen, setzen das Ziel danach neu.
    if (!bogen || !bogenHatInhalt(bogen) || beispielUnveraendert()) {
      if (!a.tausch && !beispielUnveraendert() && !(await anderesFensterFreigeben(a))) return false;
      beispielOffenMerken(null);
      setVorlageInBearbeitung(null);
      return true;
    }
    if (!a.ohneFrage) {
      const folgen = folgenFuerOffenenBogen({ tausch: a.tausch });
      const text = `${a.vorab ? `${a.vorab} ` : ""}${
        bearbeiteteVorlage
          ? `Die Bearbeitung der Vorlage „${bearbeiteteVorlage.name}"`
          : `Der angefangene Bogen „${einheitAnzeigename(bogen.einheit)}"`
      } wird durch ${a.was} ersetzt. ${folgen.satz}`;
      if (folgen.verliertAlt) {
        // R19-D8: Geht dabei ein Bogen endgültig verloren, kann er vorher als Datei gesichert werden.
        const wahl = await frageWahl({
          titel: a.titel,
          text,
          abbruch: a.abbruch,
          fokus: "abbruch",
          wege: [
            { wert: "sichern", label: `${a.ok} — den alten Bogen vorher als Datei sichern` },
            { wert: "ja", label: `${a.ok} — alten Bogen endgültig löschen`, gefahr: true },
          ],
        });
        if (wahl === null) return false;
        if (wahl === "sichern") await bogenSpeichern(folgen.verliertAlt);
      } else {
        const ja = await frageJaNein({
          titel: a.titel,
          text,
          ok: a.ok,
          abbruch: a.abbruch,
          gefahr: folgen.verlust,
          // Die sichere Wahl hat den Fokus, auch wenn der Bogen zurückholbar bleibt (R7-E4).
          fokus: "abbruch",
        });
        if (!ja) return false;
      }
    }
    // R20-D1: Konnte der Bogen nicht abgelegt werden, bleibt er offen — die Frage versprach „erreichbar".
    if (merkeVerdraengt(bogen, { tausch: a.tausch }) === "voll") {
      await ablageVollMelden(bogen, a.tausch ? "zurückgeholt" : "ersetzt");
      return false;
    }
    beispielOffenMerken(null);
    setVorlageInBearbeitung(null);
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
      : ` Der Stand bleibt auf der Startseite unter „Zuletzt geschlossenen Bogen zurückholen" erreichbar.${
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
    if (nimmt) {
      const erg = ersetztenEntwurfAblegen(anderes.bogen, anderes.fremd, { ausEntwurf: true });
      if (erg === "voll") {
        await ablageVollMelden(anderes.bogen, "ersetzt"); // R20-D1: der Bogen des anderen Fensters bleibt, wo er ist
        return false;
      }
      if (erg === "gemerkt") setErsetzterEntwurf(ersetztenEntwurfLaden());
    }
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
    if (v.bogen.uebung) beispielMerken(v.bogen); // BB-D2, R14-E6
    setVorlageInBearbeitung(v.id);
    setzeEmpfang(null);
    setSchritt(0);
    setMusterVorlage(null);
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

  /** „Rückgängig“ hinter der Meldung zur Vorlage, solange die vorige Fassung bekannt ist (R2-D2, R12-D1). */
  function vorlageRueckwegKnopf() {
    const rueck = vorlageRueckweg;
    if (!rueck || !meldung.startsWith(`Vorlage „`)) return null;
    return (
      <>
        {" "}
        <button
          type="button"
          onClick={() => {
            vorlageZuruecksetzen(rueck);
            vorlagenNeuLaden();
            setMeldung(`Vorlage „${rueck.name}" auf die vorige Fassung zurückgesetzt.`);
            setVorlageRueckweg(null);
          }}
        >
          Rückgängig
        </button>
      </>
    );
  }

  /** Den zuletzt verdrängten Bogen zurück in den Arbeitsplatz holen. */
  async function holeVerdraengtenZurueck() {
    const zurueck = ersetzterEntwurf;
    if (!zurueck) return;
    if (!(await darfBogenErsetzen({
      titel: "Geschlossenen Bogen zurückholen?",
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
    // Prüfrunde Beispielbögen (BB-D2): Ein zurückgeholter Übungsbogen trägt
    // seine erfundenen Namen weiter; die Rückfrage beim Abwählen von „Übung"
    // gilt deshalb auch nach dem Zurückholen (R14-E6).
    if (zurueck.bogen.uebung) beispielMerken(zurueck.bogen);
    setzeEmpfang(null);
    setSchritt(UEBERSICHT);
    setZeigeStart(false);
    setFehler("");
    setMeldung(`Bogen „${einheitAnzeigename(zurueck.bogen.einheit)}" zurückgeholt.`);
  }

  async function entwurfWegwerfen() {
    if (!bogen) return;
    if (beispielUnveraendert()) {
      beispielOffenMerken(null);
      setBogen(null);
      setzeEmpfang(null);
      setSchritt(0);
      setMeldung(["Beispielbogen geschlossen — er liegt weiter unter „Beispielbögen“ bereit.", eigenerBogenWartetHinweis()].filter(Boolean).join(" "));
      return;
    }
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
    // R21-H6: Bei vollem Speicher sagt schon die erste Frage, dass das Ablegen scheitern kann; sie verspricht den Platz auf der
    // Startseite nicht, den die zweite Meldung („Nicht geschlossen — Speicher voll") danach widerriefe.
    const belegung = speicherBelegung();
    const vollSatz =
      belegung && istVoll(belegung) && bogenHatInhalt(bogen)
        ? "Der Speicher dieses Geräts ist voll: Passt der Bogen nicht mehr auf die Startseite, bleibt er offen und nichts ändert sich. Besser vorher sichern. "
        : "";
    const sicher = await frageJaNein({
      // Ein Name für beides (R18-N6): „Bogen schließen" heißt überall „aufbewahren, nicht löschen" — wie in der Übersicht.
      titel: vorlage ? "Bearbeitung der Vorlage beenden?" : "Angefangenen Bogen schließen?",
      text: vorlage
        ? `Die Bearbeitung der Vorlage „${vorlage.name}" wird beendet. ${folgen.satz}`
        : `„${einheitAnzeigename(bogen.einheit)}" wird geschlossen. ${vollSatz ? `${vollSatz}${folgen.verlust ? folgen.satz : ""}` : folgen.satz}`,
      ok: vorlage ? "Bearbeitung beenden" : "Bogen schließen",
      gefahr: vorlage ? folgen.verlust : true,
    });
    if (!sicher) return;
    const ablage = bogenHatInhalt(bogen) ? merkeVerdraengt(bogen) : "uebersprungen";
    if (ablage === "voll") {
      await ablageVollMelden(bogen, vorlage ? "beendet" : "geschlossen"); // R20-D1: Bogen bleibt offen
      return;
    }
    const gemerkt = ablage === "gemerkt";
    if (vorlage) {
      setBogen(null);
      setVorlageInBearbeitung(null);
      setzeEmpfang(null);
      setSchritt(0);
      setMeldung(
        [
          `Bearbeitung der Vorlage „${vorlage.name}" beendet — die Vorlage ist unverändert.`,
          !unveraendert && gemerkt ? "Die nicht übernommenen Änderungen liegen oben auf der Startseite zum Zurückholen." : "",
          eigenerBogenWartetHinweis(),
        ]
          .filter(Boolean)
          .join(" "),
      );
      return;
    }
    setBogen(null); // löscht auch die Entwurfssicherung (siehe oben)
    setVorlageInBearbeitung(null);
    setzeEmpfang(null);
    setSchritt(0);
    setMeldung(gemerkt ? "Angefangener Bogen geschlossen — Rückholung oben auf der Startseite." : "Angefangene Erfassung geschlossen.");
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
    beispielMerken(b); // erfundene Personen und Nummern (R14-E6)
    setBogen(b);
    beispielOffenMerken(b);
    setzeEmpfang(null); // Beispiel aus der App, kein signierter Transport
    setSchritt(UEBERSICHT);
    setMusterVorlage(null);
    setZeigeStart(false);
    setFehler("");
    setMeldung(
      ["Beispielbogen geöffnet — fiktive Daten zum Ansehen und Ausprobieren. Solange du nichts änderst, ersetzt das nächste Beispiel ihn ohne Rückfrage.", eigenerBogenWartetHinweis()]
        .filter(Boolean)
        .join(" "),
    );
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
   * Fertigen Bogen übernehmen und öffnen. Eingesammelt wird seit 2026-11-09 in
   * der Meldekopf-App. `signatur` = Signaturstatus des Transports (Herkunft),
   * beim Öffnen als Provenienz angezeigt. `payload` sind die empfangenen
   * Rohbytes — sie erhalten die fremde Signatur fürs Weiterreichen (siehe
   * qrErzeugen/Gegenzeichnen). Rückgabe: immer true (Scan beendet).
   */
  async function uebernimmBogen(
    b: Erfassungsbogen,
    signatur: SignaturStatus,
    payload?: Uint8Array | null,
  ): Promise<boolean> {
    // Derselbe Bogen ist schon offen (Link zweimal angetippt): Die Rückfrage
    // bot an, ihn „durch sich selbst" zu ersetzen, und löschte dabei den
    // eigenen Bogen vom Rückholplatz (Audit Runde 4, R4-E2). Jetzt: zeigen.
    if (bogenSchonOffen(bogenNachFrist(b).bogen)) {
      schonOffenenBogenZeigen(b);
      return true;
    }
    if (!(await darfBogenErsetzen({ titel: "Empfangenen Bogen öffnen?", was: "die empfangene Meldung", ok: "Meldung öffnen" }))) {
      return true; // Scan beendet, der eigene Bogen bleibt stehen
    }
    // Wo der eigene Bogen jetzt liegt — derselbe Hinweis wie früher beim
    // Kaltstart, jetzt auf jedem Weg (R3-S1).
    const wartet = eigenerBogenWartetHinweis();
    const { bogen: geoeffnet, anonymisiert } = bogenNachFrist(b);
    setBogen(geoeffnet);
    // Ein geöffneter ÜBUNGS-Bogen (etwa ein Beispiel, das der Ausbilder per Link
    // verteilt) ist beim Teilnehmer der Bogen, den er selbst weitergibt: ohne
    // Gegenzeichnung, also ein QR-Code statt drei Teilen (Runde 2, BB2-W2), und
    // mit der Namensprüfung beim Abwählen von „Übung“ (BB2-D3, R14-E6).
    const uebungsbogen = !anonymisiert && geoeffnet.uebung === true;
    if (anonymisiert || uebungsbogen) setzeEmpfang(null);
    else setzeEmpfang(signatur, payload ?? null);
    if (uebungsbogen) beispielMerken(geoeffnet);
    setSchritt(UEBERSICHT);
    setZeigeStart(false);
    setFehler("");
    setMeldung(
      [
        anonymisiert ? FRIST_ABGELAUFEN_MELDUNG : "",
        uebungsbogen ? "Übungsbogen empfangen: Zum Melden am Meldekopf „Bogen übergeben…“ (QR-Code, PDF oder Link)." : "",
        wartet,
      ]
        .filter(Boolean)
        .join(" "),
    );
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
  async function uebernehmeText(text: string, fehlertext: string): Promise<boolean> {
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
        const vorherTeile = segmentTeileRef.current;
        const r = segmentSammeln(vorherTeile, teil);
        setzeSegmentTeile(r.teile);
        if (r.status === "vollständig") {
          // Signatur über den zusammengesetzten Payload prüfen (auch signierte
          // Bögen können segmentiert sein — die Teile ergeben ihn 1:1 wieder).
          const payload = segmentePayload(r.teile);
          const b = segmenteZuBogen(r.teile, browserKompressor);
          const status = await signaturVonPayload(payload);
          setzeSegmentTeile([]);
          setScanFortschritt("");
          return uebernimmBogen(b, status, payload);
        }
        setFehler("");
        // Die fehlenden Teile ausdrücklich benennen, statt sie ausrechnen zu
        // lassen: „es fehlt noch Teil 4" ist im Feld die Anweisung, „3 von 5"
        // nur ein Zwischenstand. Die Kästchenzeile zeigt dasselbe fürs Auge.
        // Der Satz nennt die Nummer des gelesenen Teils und, was ein anderer Bogen wegwirft (R15-E3).
        const fehlt = fehltNochSatz(r.teile);
        setScanFortschritt(
          r.status === "duplikat"
            ? `Teil ${teil.teilNr} war schon dabei — ${fehlt}.`
            : (r.status === "fremd" ? `Anderer Bogen erkannt — ${verworfeneTeileSatz(vorherTeile)}; neu begonnen. ` : "") + teilGelesenSatz(teil.teilNr, r.teile),
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
      return uebernimmBogen(dekodiert, status, payloadAusText(text));
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

  function scanAbbrechen() {
    setScannerOffen(false);
    // Ein angefangener mehrteiliger Bogen geht mit „Abbrechen" verloren — das Fenster sagt es (R15-E3).
    const verworfen = verworfeneTeileSatz(segmentTeileRef.current);
    setzeSegmentTeile([]);
    setScanFortschritt("");
    if (verworfen) setMeldung(`${verworfen}.`);
  }

  // Kaltstart über QR/Universal Link: den beim Rendern schon dekodierten Bogen
  // nachträglich (asynchron) auf seine Signatur prüfen — blockiert nichts.
  useEffect(() => {
    if (!START_SOFORT || !START.text) return;
    let aktiv = true;
    // Übungsbogen per Kaltstart-Link: wie oben ohne Gegenzeichnung (BB2-W2), mit Namensprüfung (BB2-D3).
    if (START_SOFORT.uebung === true) {
      beispielMerken(START_SOFORT);
      return;
    }
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
      try {
        await uebernimmBogen(b, status, START.text ? payloadAusText(START.text) : null);
      } finally {
        wartendenLinkErledigt(); // aufgenommen, geöffnet oder abgebrochen: entschieden (R5-S6)
      }
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
    void uebernehmeText(START.segment, LINK_UNGUELTIG).then(
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
    wartendenLinkMerken(text); // bis zur Wahl; ein Neuladen fragt erneut (R5-S6)
    void uebernehmeText(text, LINK_UNGUELTIG).finally(wartendenLinkErledigt).then(
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

  // USB-Handscanner auf der ganzen Seite, nicht nur im Scanner-Fenster: Beim
  // Probelauf lösten Helfer den Scanner aus, ohne vorher „Bogen scannen…" zu
  // drücken — wie an jeder Kasse. Dann passierte nichts, oder der Browser
  // öffnete auf das „/" der Adresse seine Schnellsuche. Jetzt ist ein Scan
  // ohne offenes Fenster dasselbe wie ein angetippter Bogen-Link: „Wohin
  // damit?" bzw. der Bogen öffnet sich; ein Teil eines mehrteiligen Bogens
  // öffnet das Scanner-Fenster, damit die übrigen Teile folgen können. Offen
  // ist das Fenster, übernimmt dessen eigener Lauscher; in Eingabefeldern
  // (auch Zeit, Datum, Zahl, Auswahl) und bei offenen Fenstern (Rückfragen)
  // bleibt die Tastatur der Seite.
  const handscannerRef = useRef<(text: string) => void>(() => {});
  handscannerRef.current = (text: string) => {
    void uebernehmeQrText(text).then((fertig) => {
      if (!fertig && segmentTeileRef.current.length > 0) void scanneQr();
    });
  };
  useEffect(
    () =>
      handscannerLauscher(window, {
        onScan: (text) => handscannerRef.current(text),
        zustaendig: () =>
          !scannerOffenRef.current && !tastaturGehoertElement(document.activeElement) && !document.querySelector("dialog[open]"),
      }),
    [],
  );

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
            ? `${teile.length} von ${teile[0]!.anzahl} Teilen gelesen — jetzt Teil ${fehlen[0]} in den Rahmen halten`
            : "QR-Code des Erfassungsbogens in den Rahmen halten";
        const text = await qrScannen(anweisung);
        if (!text) {
          // Abbruch: angefangenen Sammelstand verwerfen.
          setzeSegmentTeile([]);
          setScanFortschritt("");
          return;
        }
        if (await uebernehmeQrText(text)) return;
      }
    } catch (err) {
      setFehler(err instanceof Error ? err.message : String(err));
    }
  }


  /** Einseitiges Lageblatt (nur Übersicht) — für Wand, Ablösung und Klemmbrett (A3/A4). */
  /** Blanko-Vordruck aus der Einsatzansicht (R3-A7). */
  async function blankoVordruck() {
    setFehler("");
    setAusgabeQuittung(null);
    await arbeiten("blanko", async () => {
      try {
        const { blankoPdfErzeugen } = await import("./pdf");
        if (await blankoPdfErzeugen()) {
          const text = "Blanko-Vordruck erzeugt (2 Seiten A4, zum Ausfüllen mit der Hand).";
          // Direkt unter dem Knopf, in der Einsatzansicht wie auf der Startseite: Oben über der Karte schob
          // die Quittung den eben getippten Knopf um 66 px nach unten (Audit Runde 6, R6-N10).
          setAusgabeQuittung(`✓ ${text}`);
        }
      } catch (e) {
        setFehler(`Blanko-Vordruck: ${fehlerText(e)}`);
      }
    });
  }

  // Welche Ansicht gleich gezeigt wird — dieselbe Rangfolge wie die
  // Weichen darunter. Jeder Wechsel beginnt oben (R3-H1).
  useAnsichtBeginntOben(
    musterVorlage ? "musterung" : !bogen || zeigeStart ? "start" : "bogen",
  );

  // Musterung einer Vorlage (Vorrang vor allen anderen Ansichten).
  if (musterVorlage) {
    return (
      <>
        <Aktualisierungshinweise />
        <Musterung vorlage={musterVorlage} onStart={musterungFertig} onAbbrechen={() => setMusterVorlage(null)} ersetztBogen={!!bogen && bogenHatInhalt(bogen)} />
        <Fusszeile onBogenOeffnen={oeffneBeispiel} />
      </>
    );
  }

  if (!bogen || zeigeStart) {
    // Erststart = noch keinerlei Daten: Onboarding prominent statt am Seitenende.
    const erststart = !bogen && vorlagen.length === 0;
    const schnellVorlagen = [...vorlagen]
      .sort((a, b) => Number(!!b.standard) - Number(!!a.standard) || b.geaendert - a.geaendert)
      .slice(0, 2);
    const offlineZeile = (
      <p className={`offline-badge${offline.stand === "bereit" ? "" : " offline-laedt"}${offlineZeileOffen(offline) ? " offline-offen" : ""}`} role="status">
        {offlineText(offline)}
        {/* Abgebrochenes Erstladen: Der Ausweg steht neben der Meldung (R4-O1). */}
        {offline.abgebrochen && offline.online && (
          <>
            {" "}
            <button type="button" onClick={() => window.location.reload()}>Jetzt neu laden</button>
          </>
        )}
      </p>
    );
    // Unsichtbarer Platzhalter in der Höhe der längsten Fassung; der Text steht im Attribut, damit er weder vorgelesen noch gefunden wird.
    // Liegt der Kern im Gerät, entfällt der Kasten: Der Text steht dann in der Fußzeile, der Fortschritt als Balken oben.
    const offlineHinweis = offlineRuhig(offline) ? null : offlinePlatz ? (
      <div className="offline-platz">
        {offlineZeile}
        <p className="offline-badge offline-geist" aria-hidden="true" data-text={offlineLangText(offline)} />
      </div>
    ) : offlineZeile;
    const ladeAnteil = offlineFortschritt(offline);
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
              zuerst auf der Startseite landet, stellt die Anzeige sofort um.
              Klappbar wie im Assistenten: Auf schmalen Telefonen (320 px,
              Feld-Modus) standen die vier Segmente in zwei Zeilen und
              „Fortsetzen" unter dem Bildrand (R3-H5). */}
          <AnzeigeSchalter klappbar />
        </div>
      </SeitenKopf>
      <main id="inhalt" tabIndex={-1} className="start">
        {/* Dünner Balken, solange der Offline-Vorrat lädt; er nimmt keinen Platz ein, nichts darunter springt. */}
        {ladeAnteil != null && (
          <div
            className="offline-fortschritt"
            role="progressbar"
            aria-label="Offline-Vorrat wird geladen"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(ladeAnteil * 100)}
          >
            <span style={{ width: `${(ladeAnteil * 100).toFixed(1)}%` }} />
          </div>
        )}
        {/* Die Werbezeile erklärt das Prinzip für den ersten Besuch. Mit
            eigenem Entwurf, Vorlagen oder Einsätzen ist sie längst bekannt und
            drängt sich nur noch vor die Karte, um die es jetzt geht — das
            Offline-Versprechen bleibt als schmales Badge stehen, der Satz
            entfällt (wie „So funktioniert's" unten). */}
        {/* Am Telefon die kurze Fassung (R5-M2): Der vierzeilige Absatz und der
            Offline-Hinweis schoben „Neuen Bogen erstellen" beim Erstbesuch unter
            den Bildrand, bei 200 % Schrift auf den dritten Bildschirm. */}
        {erststart && (
          <p className="start-intro">
            <span className="start-intro-lang">
              Das kostenlose Online-Tool für BOS-Einheiten und Hilfsorganisationen:
              Bogen digital erfassen, als PDF drucken, als Datei teilen – und per
              QR-Code ohne Internetverbindung von Gerät zu Gerät übertragen.
            </span>
            <span className="start-intro-kurz">
              Kostenloses Online-Tool für BOS-Einheiten: Bogen erfassen, als PDF
              drucken, per QR-Code ohne Internet übertragen.
            </span>
          </p>
        )}
        {/* Die Zusage erst, wenn sie stimmt (R2-O1, offline-bereit.ts). Mit
            angefangenem Bogen steht sie unter dessen Karte: Sie schob
            „Fortsetzen" im Feld-Modus unter den Bildrand (Audit Runde 3, R3-H5). */}
        {/* Beim Erstbesuch steht die Zeile unter den Aktionen des ersten Wegs, nicht davor (R5-M2). */}
        {!bogen && !erststart && offlineHinweis}
        <SpeicherWarnung stand={vorlagen} />
        <UhrWarnung />
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
              <EinheitZeichen einheit={bogen.einheit} className="einheit-avatar gross" aria-hidden="true" />
              <span className="entwurf-text">
                <strong>
                  {einheitAnzeigename(bogen.einheit)}
                  {/* Beispiel oder Übung auf einen Blick (BB-D4, BB-E8, BB-N8). */}
                  {bogen.uebung && <span className="uebung-badge">{beispielUnveraendert() ? "BEISPIEL" : "ÜBUNG"}</span>}
                </strong>
                {/* Vorlagen-Bearbeitung: Die Karte trug denselben Titel wie der
                    eigene Bogen darunter und wurde als Doppelung verworfen (R3-D1). */}
                {bearbeiteteVorlage && (
                  <span className="hinweis warnung-text">Bearbeitung der Vorlage „{bearbeiteteVorlage.name}" — kein Einsatzbogen</span>
                )}
                {/* Stand gegenüber der letzten Übergabe (R2-W2). */}
                {(() => {
                  const u = uebergabeText(bogen, uebergabe);
                  return u && <span className={`hinweis${u.geaendert ? " warnung-text" : ""}`}>{u.text}</span>;
                })()}
                {/* „Entwurf … wiederhergestellt" steht in der Karte, zu der der Satz gehört, nicht darunter (R18-N7). */}
                {meldungInKarte && <span className="hinweis">{meldung}</span>}
                {/* Alter Bogen: der Zeitraum steht auf der Karte, bevor jemand „Fortsetzen" tippt (R2-S1). */}
                {bogen.einsatz.zeitraumBis < heuteDatum() && (
                  <span className="hinweis warnung-text">Einsatz {zeitraumDeutsch(bogen)}</span>
                )}
                <span className="hinweis">
                  {/* Kurzlegende sichtbar: die Zahlen allein erklärte nur Schritt 3 (R2-N9). */}
                  {/* Nur Sollplätze aus der Vorbelegung: keine Meldung, die Zahl nennt sich so (R18-N7). */}
                  {nurSollstaerke(bogen)
                    ? `${s.gesamt} Sollplätze, noch ohne Namen`
                    : `Stärke ${s.fuehrer} / ${s.unterfuehrer} / ${s.mannschaft} // ${s.gesamt} (F / UF / M // Ges)`}
                  {/* Mit ausgefallenem Speicher stand hier „gespeichert 21:01 Uhr"
                      für einen Stand, der nicht im Speicher liegt (Audit Runde 4,
                      R4-E5). */}
                  {!speicherFehler && !fenster.konflikt && gespeichertUm
                    ? ` · gespeichert ${uhrzeitMitTag(gespeichertUm)} Uhr`
                    : ""}
                </span>
                {/* Was die App von selbst löscht, kündigt sie dort an, wo man den Bogen wieder aufnimmt:
                    ab 14 Tagen vor Ablauf der Datenschutzfrist (R8-D3). */}
                {!bearbeiteteVorlage && (() => {
                  const ende = datenschutzfristEnde(bogen);
                  if (ende == null) return null;
                  if (datenschutzfristAbgelaufen(bogen, datenschutzZeitpunkt())) {
                    return (
                      <span className="hinweis warnung-text frist-karte">
                        ⚠ Datenschutzfrist abgelaufen: Namen, Funktionen und Erreichbarkeiten wurden am {tagDeutsch(ende)} anonymisiert.
                      </span>
                    );
                  }
                  const tage = tageBisAnonymisierung(bogen, datenschutzZeitpunkt());
                  if (tage == null) return null;
                  return (
                    <span className="hinweis warnung-text frist-karte">
                      ⚠ Namen werden am {tagDeutsch(ende)} anonymisiert ({tage === 1 ? "noch 1 Tag" : `noch ${tage} Tage`}) — vorher weitergeben oder sichern;
                      Bearbeiten beginnt die Frist neu.
                    </span>
                  );
                })()}
                {/* Ein anderes Fenster hat den Bogen geändert oder gelöscht (Alle
                    Daten löschen, Bogen geschlossen): Die Karte darf ihn nicht als
                    gespeichert zeigen, und hier wird nichts zurückgeschrieben
                    (Audit Runde 5, R5-D3). */}
                {fenster.konflikt && (
                  <span className="hinweis warnung-text speicher-fehler" role="alert">
                    ⚠ {fenster.art === "entfernt" ? "In einem anderen Fenster gelöscht oder geschlossen" : "In einem anderen Fenster geändert"}
                    {" "}— hier wird nichts gespeichert. „Fortsetzen“ zeigt die Entscheidung.
                  </span>
                )}
                {speicherFehler && (
                  <span className="hinweis warnung-text speicher-fehler" role="alert">
                    ⚠ Nicht gespeichert — {speicherArt === "gesperrt" ? "dieser Browser lässt die App nichts speichern" : "der Speicher dieses Geräts ist voll"}.
                    {gespeichertUm ? ` Letzter gesicherter Stand: ${uhrzeitMitTag(gespeichertUm)} Uhr.` : ""} Beim Schließen
                    gehen die Änderungen verloren — jetzt „Fortsetzen“ und „Bogen übergeben“ (PDF oder QR-Code).
                  </span>
                )}
              </span>
              <span className="entwurf-aktionen">
                <button type="button" className="primaer" onClick={() => { setMeldung(""); setZeigeStart(false); }}>Fortsetzen</button>
                {/* Bei der Vorlagen-Bearbeitung klang „Verwerfen" schärfer, als es ist,
                    und glich dem „Verwerfen" eines echten Bogens: Die Vorlage
                    bleibt, wie sie war (Audit Runde 4, R4-D5). */}
                <button type="button" className={bearbeiteteVorlage ? "" : "gefahr"} onClick={entwurfWegwerfen}>
                  {bearbeiteteVorlage ? "Bearbeitung beenden" : "Bogen schließen"}
                </button>
              </span>
            </section>
          );
        })()}
        {/* Einträge, die die App nicht anzeigen kann (R7-N3, R7-E2). */}
        <UnlesbarHinweis />
        {beschaedigt && (
          <section className="entwurf-karte verdraengt beschaedigt" role="alert">
            {/* Zugeklappt eine Kopfzeile (R9-S4: zusammen mit dem Kasten zur Sammlung blieb „Neuen Bogen erstellen“
                im ersten Bild); Text, Ursache und Knöpfe stehen dahinter. */}
            <details className="beschaedigt-mehr" style={{ width: "100%" }}>
              <summary>
                {beschaedigt.ungesichert
                  ? "Ein Bogen ließ sich nicht öffnen und nicht beiseitelegen — Speicher voll ›"
                  : "Ein Bogen ließ sich nicht öffnen — beiseitegelegt, nicht gelöscht ›"}
              </summary>
              <span className="entwurf-text">
                <span className="hinweis warnung-text">
                  {beschaedigt.ungesichert
                    ? "Speicher voll – beschädigte Daten nicht gesichert. Der Text liegt unverändert auf dem Gerät. „Als Datei sichern“, dann Platz schaffen (Papierkorb leeren) und neu laden; neue Bögen werden bis dahin nicht gespeichert."
                    : "Nicht gelöscht, nur beiseitegelegt. „Als Datei sichern“ und an den geben, der die App betreut — oder unten gleich einen neuen Bogen beginnen."}
                </span>
                <span className="hinweis">
                  Ursache: {beschaedigt.ursache}. „Aus Datei laden…“ öffnet die Datei nur, wenn diese Ursache nicht mehr zutrifft; fehlt
                  eine Pflichtangabe, nennt die App sie beim Einlesen. Nachtragen lässt sie sich in der App nicht — dann braucht, wer die
                  App betreut, die Datei.{" "}
                  {beschaedigt.ungesichert
                    ? "Die Frist von 90 Tagen läuft erst nach dem Beiseitelegen; bis dahin bleibt der Text unverändert liegen."
                    : `Die App löscht den Bogen am ${datumZweistellig(beschaedigt.am + DATENSCHUTZFRIST_TAGE * 24 * 60 * 60 * 1000)} von selbst (${DATENSCHUTZFRIST_TAGE} Tage nach dem Beiseitelegen).`}
                </span>
              </span>
              <span className="entwurf-aktionen">
                <button
                  type="button"
                  onClick={() => {
                    blobAlsDownload("eeb-beschaedigter-entwurf.json", new Blob([beschaedigt.text], { type: "application/json" }));
                    setMeldung("Datei „eeb-beschaedigter-entwurf.json“ gespeichert (Downloads). Der beiseitegelegte Bogen bleibt zusätzlich auf dem Gerät.");
                  }}
                >
                  Als Datei sichern
                </button>
                <button
                  type="button"
                  className="gefahr"
                  onClick={async () => {
                    const ja = await frageJaNein({
                      titel: "Beschädigten Bogen entfernen?",
                      text: "Der beiseitegelegte Bogen wird endgültig gelöscht. Wenn du ihn noch prüfen willst, vorher „Als Datei sichern“.",
                      ok: "Endgültig entfernen",
                      gefahr: true,
                    });
                    if (!ja) return;
                    beschaedigtenEntwurfVerwerfen();
                    setBeschaedigt(beschaedigterEntwurfAnzeige());
                  }}
                >
                  Entfernen…
                </button>
              </span>
            </details>
          </section>
        )}
        {/* Rückholung: Was ein anderer Bogen verdrängt hat, ist nicht verloren.
            Die Zeile steht unter der Entwurfskarte, damit der aktuelle Bogen
            zuerst kommt — sie ist der Ausweg, nicht das Angebot. */}
        {ersetzterEntwurf && (
          <section className="entwurf-karte verdraengt">
            <span className="entwurf-text">
              <strong>
                {einheitAnzeigename(ersetzterEntwurf.bogen.einheit)}
                {ersetzterEntwurf.bogen.uebung && <span className="uebung-badge">ÜBUNG</span>}
              </strong>
              <span className="hinweis">
                Zuletzt geschlossener Bogen
                {ersetzterEntwurf.ersetztGrund === "fenster-geladen"
                  ? " (durch den Stand des anderen Fensters ersetzt — deine Fassung)"
                  : ersetzterEntwurf.ersetztGrund === "fenster-behalten"
                    ? " (durch deine Fassung ersetzt — Stand des anderen Fensters)"
                    : ""}
                {" "}· zuletzt bearbeitet{" "}
                {new Date(ersetzterEntwurf.gespeichert).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })} Uhr
                {" "}· {ersetzterEntwurf.bogen.personal.length} {ersetzterEntwurf.bogen.personal.length === 1 ? "Person" : "Personen"}
              </span>
            </span>
            <span className="entwurf-aktionen">
              <button type="button" onClick={holeVerdraengtenZurueck}>Zuletzt geschlossenen Bogen zurückholen</button>
            </span>
          </section>
        )}
        {bogen && offlineHinweis}
        {/* Rückmeldungen stehen ÜBER den Aktionen: „Entwurf … wiederhergestellt"
            erklärt die Karte darüber, und unter den Knöpfen klebte der Kasten
            optisch an der Knopfreihe, statt ein eigener Block zu sein. */}
        {meldung && !meldungInKarte && (
          <p className="meldung" role="status" key={meldung}>
            {meldung}
            {vorlageRueckwegKnopf()}
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
              {/* Gespeicherte Vorlagen zuerst: Für den Helfer mit Vorlage ist
                  „Einsatz vorbereiten" der Hauptweg, die Vorlagenkarten standen
                  aber erst unter dem Meldekopf-Block, 1,7 bis 2,1 Bildschirme
                  tief (Audit Runde 3, R3-H5). Die Standard-Vorlage vorn, sonst
                  die zuletzt geänderten; die Karten unten bleiben für
                  Bearbeiten, Teilen und Löschen. */}
              {schnellVorlagen.map((v, i) => (
                <button
                  key={v.id}
                  type="button"
                  className={!bogen && i === 0 ? "primaer" : ""}
                  onClick={() => { setMeldung(""); setMusterVorlage(v); }}
                >
                  Einsatz vorbereiten: {v.name}
                </button>
              ))}
              <button type="button" className={bogen || schnellVorlagen.length > 0 ? "" : "primaer"} onClick={async () => {
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
                <input type="file" accept={`.pdf,application/pdf,.json,application/json,${WORD_DATEI_ARTEN}`} onChange={ladeDatei} className="nur-sr" />
              </label>
              {/* Die Papier-Reserve für die eigene Einheit, bevor man sie
                  braucht: stand nur als Fußzeilen-Link unter „Projekt“, bei
                  leerem Gerät rund 6 300 px tief (Audit Runde 4, R4-A8). */}
              <button
                type="button"
                className={`mit-zusatz${pdfArbeitet === "blanko" ? " arbeitet" : ""}`}
                aria-busy={pdfArbeitet === "blanko" || undefined}
                disabled={pdfArbeitet !== null}
                onClick={() => void blankoVordruck()}
                aria-describedby="start-blanko-zusatz"
              >
                {pdfArbeitet === "blanko" ? "Vordruck wird erzeugt…" : "Leeren Vordruck drucken (PDF)"}
                <span className="knopf-zusatz" id="start-blanko-zusatz" aria-hidden="true">
                  {pdfArbeitet === "blanko" ? "Einen Moment, bitte nicht noch einmal tippen" : "Papier-Reserve zum Ausfüllen mit der Hand"}
                </span>
              </button>
            </div>
            {ausgabeQuittung && (
              <p className="hinweis" role="status">
                {ausgabeQuittung}
              </p>
            )}
          </section>
          <MeldekopfWeg erststartHinweis={erststart ? offlineHinweis : undefined} />
        </div>
        {scannerOffen && (
          <QrScannerWeb onErgebnis={scanErgebnisWeb} fortschritt={scanFortschritt} onAbbruch={scanAbbrechen} onBild={ladeQrBild} teile={segmentStand} />
        )}
        {/* Erststart ohne Daten: das Grundprinzip prominent direkt unter den
            Aktionen erklären — der USP steckt sonst nur im Untertitel. Mit
            vorhandenen Daten wandert die Erklärung ans Seitenende (unten). */}
        {erststart && <SoFunktionierts />}
        {erststart && <BeispielboegenStart />}
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
        {!erststart && <BeispielboegenStart />}
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
      <Fusszeile onBogenOeffnen={oeffneBeispiel} offlineHinweis={offlineRuhig(offline) ? offlineText(offline) : undefined} />
      </>
    );
  }

  // Bearbeiten verwirft den Import-Signaturstatus: er beschreibt den empfangenen
  // Transport, nicht den nun geänderten Bogen.
  const aendern = (patch: Partial<Erfassungsbogen>) => {
    // Jede Bearbeitung datiert den Stand neu — die Zeitgruppe im PDF und die
    // Revisionsreihenfolge der Einsatz-Sammlung zeigen die letzte Änderung.
    setBogen({ ...bogen, ...patch, stand: stempelZeitpunkt() });
    setzeEmpfang(null);
  };

  // Leichter Füllstand je Schritt (Orientierung; die Übersicht hat keinen Status).
  const status = schrittStatus(bogen);
  const zurUebersicht = schritt === UEBERSICHT - 1 || ausUebersicht === schritt;

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
        <button type="button" className="zur-start" onClick={() => { setMeldung(""); setZeigeStart(true); }}>
          ‹ Startseite
        </button>
        <AnzeigeSchalter klappbar />
      </div>
      <div className="titelzeile">
        {/* Taktisches Zeichen der Einheit als „Avatar" — Wiedererkennung auf einen Blick. */}
        <EinheitZeichen einheit={bogen.einheit} className="einheit-avatar" aria-hidden="true" />
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
          const nr = i + 1;
          // R21-N3: Der Ort der Einheit ist Pflicht. Wer Schritt 1 verlassen hat, ohne ihn einzutragen, sieht am Reiter „fehlt"
          // (der Schrittstatus bleibt „leer": ein leerer Bogen gilt nicht als begonnen).
          const ortFehlt = i === 0 && schritt !== 0 && status[0] === "leer" && !einheitOrt(bogen.einheit) && bogen.einheit.standortRef == null;
          const st = ortFehlt ? "begonnen" : status[i]; // undefined für die Übersicht (letzter Schritt)
          const klassen = [i === schritt ? "aktiv" : "", st ? `status-${st}` : ""].filter(Boolean).join(" ");
          // „begonnen" als Wort statt „•": das Symbol verstand niemand (R2-N3, F6). „fehlt" statt „offen" (R19-E9): „offen" hieß
          // für manchen „nicht begonnen"; gemeint ist: hier fehlt noch etwas.
          const glyph = st === "ok" ? "✓" : st === "begonnen" ? "fehlt" : "";
          return (
            <button
              key={name}
              type="button"
              className={klassen}
              ref={i === schritt ? reiterZeigen : undefined}
              aria-current={i === schritt ? "step" : undefined}
              aria-label={st ? `${nr}. ${name} — ${SCHRITT_STATUS_TITEL[st]}` : undefined}
              title={st ? SCHRITT_STATUS_TITEL[st] : undefined}
              onClick={() => setSchritt(i)}
            >
              {/* Name in eigenem Span: auf dem Telefon steht nur die Nummer im
                  Bild, der Name bleibt für Vorlesesoftware im Knopf (R2-H7).
                  Der äußere Span hält Nummer und Name als EIN Flex-Kind. */}
              <span>{nr}<span className="schritt-name">{`. ${name}`}</span></span>
              {glyph && <span className="schritt-status" aria-hidden="true">{glyph}</span>}
            </button>
          );
        })}
      </nav>
      {fenster.konflikt ? (
        <FensterKonflikt abgleich={fenster} />
      ) : speicherFehler ? (
        // Feste Leiste am Bildrand, nicht im Kopf: Der rollte mit der Seite weg,
        // und wer mitten im Schritt tippte, sah die Warnung erst nach dem
        // Hochrollen (Audit Runde 5, R5-O1).
        <FesteWarnung
          klasse="speicher-fehler"
          kurz={speicherFehlerKurz(speicherArt, false, !!bogen && nurSollstaerke(bogen))}
          details={speicherFehlerDetails(speicherArt, false, gespeichertUm ? uhrzeitMitTag(gespeichertUm) : null)}
        />
      ) : gespeichertUm && bogenHatInhalt(bogen) ? (
        // R19-N14: Erst nach der ersten Eingabe; ein leerer Bogen meldete schon „gespeichert".
        <p className="autosave" role="status" data-kurz={`✓ ${uhrzeitMitTag(gespeichertUm)}`} data-zeit={uhrzeitMitTag(gespeichertUm)}>
          {/* R4-M7: „✓ automatisch gespeichert · 22:24 Uhr — bleibt auf die…" wurde auf
              360 px an genau der Stelle gekürzt, um die es geht („nur auf diesem
              Gerät"). Kürzer, und das Wichtige steht hinten, wo gekürzt wird,
              nicht vorn. */}
          ✓ gespeichert · {uhrzeitMitTag(gespeichertUm)} Uhr · nur auf diesem Gerät
        </p>
      ) : (
        // R21-A9: Der Platz der Zeile ist von Anfang an da (leer, unsichtbar, für Vorlesesoftware nicht vorhanden): Sie erschien
        // sonst nach der ersten Eingabe und schob den Inhalt um eine Zeile nach unten.
        <p className="autosave autosave-leer" aria-hidden="true" data-kurz={" "} data-zeit={" "}>{" "}</p>
      )}
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
    {/* Solange die Frage der Geräteuhr offen ist, trägt der Bogen vielleicht ein falsches Datum (R7-W2). */}
    <UhrHinweis />
    {/* Die Übersicht ist der einzige Schritt ohne fixe Schritt-Navigation
        (siehe unten) — sie braucht deshalb auch nicht den Freiraum dafür. */}
    <main
      id="inhalt"
      tabIndex={-1}
      className={schritt === UEBERSICHT ? "ohne-nav" : undefined}
    >
      {/* Rückmeldungen (Vorlage gespeichert, Beispielbogen geöffnet …) gehören
          dorthin, wo die Aktion ausgelöst wurde. Ohne diese Zeile blieben sie
          im Assistenten unsichtbar und tauchten später unvermittelt auf der
          Startseite auf. */}
      {meldung && !(meldung.startsWith("Entwurf vom ") && !bogenHatInhalt(bogen)) && <p className="meldung" role="status" key={meldung}>{meldung}{vorlageRueckwegKnopf()}</p>}
      {fehler && <p className="fehler" role="alert">{fehler}</p>}
      {/* R16-E2: „Für neuen Einsatz vorbereiten“ ist wie die Nachbarn zurückholbar, solange nichts Neues eingetragen ist. */}
      {bogen && einsatzWegGilt(einsatzWeg, bogen) && (
        <DaumenQuittung
          key={`einsatz-weg:${einsatzWeg.nonce}`}
          mehrzeilig
          onRueckgaengig={() => {
            setBogen(einsatzWiederherstellen(bogen, einsatzWeg, stempelZeitpunkt()));
            setEinsatzWeg(null);
            setMeldung("Zeitraum, Ort/Auftrag und Sofortbedarf des vorigen Einsatzes sind zurück.");
          }}
          rueckgaengigName="Rückgängig — Zeitraum, Ort/Auftrag und Sofortbedarf zurückholen"
          onSchliessen={() => { einsatzWegVergessen(); setEinsatzWeg(null); }}
        >
          <strong>Für neuen Einsatz vorbereitet:</strong> Zeitraum, Ort/Auftrag und Sofortbedarf sind leer — „Rückgängig" holt sie zurück, bis du Neues einträgst.
        </DaumenQuittung>
      )}
      {/* Der Schrittwechsel trägt seine Richtung: vorwärts kommt der Inhalt von
          rechts, zurück von links. Die Schrittleiste oben sagt, WO man ist —
          dass man gerade zurückgesprungen ist (etwa weil ein Prüfpunkt in einen
          früheren Schritt verweist), sagte bisher nichts. Bewusst kurz: das
          hier ist der Weg zur Arbeit, nicht die Arbeit.
          `key` erzwingt den Neuaufbau, damit die Bewegung bei jedem Wechsel
          neu ansetzt — die Schritte tauschen ohnehin die Komponente. */}
      <div className={`schritt-inhalt ${richtung}`} key={schritt}>
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
          onUebergeben={(weg, bestaetigt) => setUebergabe((u) => uebergabeNachWeg(bogen, u, weg, bestaetigt))}
          onUebergabeBestaetigen={() => setUebergabe((u) => uebergabeBestaetigen(bogen, u) ?? u)}
          schliessenFolgen={() => (bogenHatInhalt(bogen) ? folgenFuerOffenenBogen() : { satz: "", verlust: false })}
          neu={async () => { if (bogenHatInhalt(bogen) && merkeVerdraengt(bogen) === "voll") { await ablageVollMelden(bogen, "geschlossen"); return; } setMeldung(""); setBogen(null); setVorlageInBearbeitung(null); setzeEmpfang(null); setSchritt(0); }}
          onVorlageGespeichert={(name, ersetzt) => {
            vorlagenNeuLaden();
            // Ersetzt: die vorige Fassung bleibt für „Rückgängig“ in Reichweite (R12-D1).
            setVorlageRueckweg(ersetzt ?? null);
            setMeldung(
              ersetzt
                ? `Vorlage „${name}" ersetzt (vorher ${vorlageZahlenText(ersetzt.bogen)}).`
                : `Als Vorlage „${name}" gespeichert.`,
            );
          }}
          vorlageBearbeitung={
            bearbeiteteVorlage ? { name: bearbeiteteVorlage.name, onAktualisieren: () => void vorlageAktualisierenUndSchliessen() } : undefined
          }
          onNeuerEinsatz={() => {
            const { bogen: neu, weg } = einsatzVorbereiten(bogen, heuteDatum(), stempelZeitpunkt());
            setBogen(neu);
            setEinsatzWeg(weg);
            setSchritt(1);
            setMeldung("Einsatzdaten für den neuen Einsatz zurückgesetzt — Ort/Auftrag eintragen. Personal und Fahrzeuge sind geblieben.");
          }}
        />
      )}
      </div>

      {schritt !== UEBERSICHT && (
        <footer className="nav assistent-nav">
          {/* Unter 360 px steht nur „←" (das Wort fällt per CSS weg), damit der
              Modusknopf daneben Platz hat; der Name bleibt „← Zurück". */}
          <button type="button" className="nav-zurueck" aria-label="← Zurück" disabled={schritt === 0} onClick={() => setSchritt(schritt - 1)}>
            ←<span className="nav-wort"> Zurück</span>
          </button>
          {/* Moduswechsel aus der festen Leiste, ohne die Stelle im Formular
              zu verlieren (Audit Runde 3, R3-L6). Neben „← Zurück", nicht
              neben „Weiter →": Ein Fehlgriff klappt nur die Wahl auf. */}
          <AnzeigeLeistenKnopf kurz />
          {/* Nach der Musterung stehen Personal, Fahrzeuge und Bedarf schon da:
              Von „Bogen anlegen" bis zur Übergabe führte „Weiter →" durch
              drei Schritte, die nichts Neues verlangten (Audit Runde 4, R4-H5).
              Einen Tipp weiter, ohne etwas zu überspringen: Die Übersicht
              nennt, was offen ist. */}
          {nachMusterung && schritt === SCHRITT_EINSATZ && (
            <button type="button" className="uebernehmen" onClick={() => setSchritt(UEBERSICHT)}>Zur Übergabe →</button>
          )}
          <button
            type="button"
            className="primaer nav-weiter"
            aria-label={zurUebersicht ? "Zur Übersicht →" : "Weiter →"}
            onClick={() =>
              setSchritt(ausUebersicht === schritt ? UEBERSICHT : schritt + 1)
            }
          >
            {zurUebersicht ? (
              <>
                {/* Auf dem kleinsten Bild fällt „Zur" weg, damit „◐" nicht unter den Knopf gerät (R6-G1). */}
                <span className="nav-zur">Zur </span>
                {/* Beim Browser-Zoom 200 % (180 px) steht nur der Pfeil, damit die Leiste einzeilig bleibt (R7-M3). */}
                <span className="nav-weiter-wort">Übersicht </span>→
              </>
            ) : (
              <>
                <span className="nav-weiter-wort">Weiter </span>→
              </>
            )}
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
