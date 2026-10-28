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
  personUnbenannt,
  fahrzeugUnbenannt,
  staerkePlausibilitaet,
  zeitraumDeutsch,
  bogenLaden,
  browserKompressor,
  bytesAlsDatei,
  dateinameTeil,
  einheitAnzeigename,
  einheitOrt,
  artMitMarke,
  ausgabeDateiname,
  neuerBogen,
  pruefpunkte,
  schrittStatus,
  zeitpunktDeutsch,
} from "./hilfen";
import { EEB_EPOCHE_MS, PersonalErfassung, jetztZeitpunkt, staerke } from "@bos/eeb-format/model";
import {
  DATENSCHUTZFRIST_TAGE,
  bogenAnonymisiert,
  datenschutzfristAbgelaufen,
  datenschutzfristEnde,
  tageBisAnonymisierung,
} from "@bos/eeb-format/datenschutzfrist";
import { datenschutzZeitpunkt, stempelZeitpunkt } from "./datenschutz-uhr";
import { anonymQuittung } from "./anonym-hinweis";
import { standNachEintreffenQuittung } from "./stand-uhr";
import { leseausgabeMeldung } from "./pdf-titel";
import { Kopfnav } from "./kopfnav-ui";
import { bogenLinksEmpfangen, imWebBrowser, istNativ, qrScannen, textTeilen } from "./nativ";
import { fehlerText } from "./nachladen";
import { dateiFehlerMeldung } from "./datei-fehler";
import type { DateiFehler } from "./fehler-buendeln";
import { FehlerImBild } from "./fehler-im-bild";
import { entfernteImImportKlaeren } from "./entfernte-meldungen";
import { eigenesZurueckUm, eigenesZurueckVerbrauchen, rueckfrageEintragErsetzbar } from "./modal-overlay";
import { FensterKonflikt, nachAbgleichFortsetzen, useFensterAbgleich } from "./fenster-abgleich";
import { entwirreScanText } from "./tastaturbelegung";
import { ASSISTENT_SCHRITT_SPERRE_MS, ortSperren, SEITENWECHSEL_SPERRE_MS } from "./tipp-schutz";
import { vorlageAktualisieren, vorlageAnlegen, vorlageAusDatei, vorlageZahlenText, vorlagenLaden, vorlagenPapierkorb, vorlageZuruecksetzen, type Vorlage } from "./vorlagen";
import { Musterung, VorlagenListe } from "./vorlagen-ui";
import { musterungVorlageAusStand } from "./musterung-stand";
import { rueckwegeVergessen } from "./rueckweg-sitzung";
import { gezaehltWegMerken } from "./gezaehlt-weg";
import { einsatzVorbereiten, einsatzWegGilt, einsatzWegHolen, einsatzWegVergessen, einsatzWiederherstellen, type EinsatzWeg } from "./einsatz-vorbereiten";
import { absenderkarteGefuellt, absenderkarteLaden, type Absenderkarte } from "./absenderkarte";
import { AbsenderkarteFeld } from "./absenderkarte-ui";
import {
  EinsatzArt,
  MeldeStatus,
  bogenInhaltsId,
  einheitSchluessel,
  einsatzAnlegen,
  meldungEntfernen,
  type EintragSignatur,
  type Einsatzsammlung,
  type MeldeEintrag,
} from "@bos/meldekopf/einsaetze";
import { fassungGiltSetzen, fassungInHistorieLegen, fassungPruefen, fassungenJeEinheit, geltendeJeEinheit, type FassungsPruefung } from "./fassung-vorrang";
import { einsaetzeLaden, einsaetzePapierkorb } from "./einsaetze-lesen";
import { diffKurzfassung } from "@bos/meldekopf/meldung-diff";
import { bogenDiff } from "./diff-lage";
import {
  SpeicherVollFehler,
  eintreffzeitSetzen,
  istSpeicherVoll,
  meldungAufnehmen,
  nummerUndZugSetzen,
  statusMitZeitSetzen,
  speicherFehlerArt,
  speicherVollMeldung,
  vomPapierMarkieren,
  zeitKurz,
  zeitLang,
} from "./eintrag-zeiten";
import { offlineLangText, offlineText, offlineZeileOffen, useOfflineStand } from "./offline-bereit";
import { uebergabeBestaetigen, uebergabeNachWeg, uebergabeText, type UebergabeStand } from "./uebergabe-stand";
import { ART_LABEL, EinsatzDetail, EinsatzListe, type Eingang } from "./einsaetze-ui";
import { uebersprungenText } from "./uebersprungen-text";
import { anzahlEinheiten, einheitenZahl, letzteMeldung, lueckeKurz, meldungsNummern, nummernWechsel, nummernWechselText, rueckkehrText } from "./einheiten-tabelle";
import { exportSammlung, exportStaendeLaden, exportStaendeUebernehmen, exportStandAusWeitergabe, exportVermerken, lieferungsMarke, weitergabeUmImportErgaenzen, type ExportStand, type ExportUmfang, type ExportZiel } from "./export-stand";
import { NICHTS_UEBERNOMMEN_SATZ, abgleichGliederung, abgleichText, einsatzAbgleichen, importUebernahm, sammlungFuerZiel, widerspruecheZumMerken, type Einzelheit } from "./einsatz-abgleich";
import { widerspruchMerken } from "./widerspruch-merker";
import { aktuelleMeldungen } from "./auswertung";
import { lageAngabenLaden, lageAngabenUebernehmen } from "./lage-angaben";
import { ablehnungsSatz, abgelehnteBoegen, boegenAusJsonTextMitUrsachen, boegenAusPdfBytes, einsatzAusDatei, einsatzAusPdfBytes, einsatzDateiInhalt, istPdfDatei, pdfInhaltArt } from "./einsatz-transport";
import type { QrBogen } from "./qr-boegen";
import { einsatzDetailCsvInhalt } from "./bogen-csv";
import { QrScannerWeb } from "./qr-scanner-web";
import { handscannerLauscher, tastaturGehoertElement } from "./handscanner";
import { TeilQuittung, fehlendeTeile, fehltNochSatz, teilGelesenSatz, verworfeneTeileSatz } from "./teil-quittung";
import { qrAusBild } from "./qr-bild";
import {
  LAGE_ABGLEICH_KURZ,
  LAGE_NACHTRAGEN_HINWEIS,
  SAMMLUNG_IN_PDF_HINWEIS,
  dateiImportMeldung,
  istBilddatei,
  qrStapelLesen,
  stapelBericht as stapelBerichtZeilen,
  teileMerker,
  type DateiAnteil,
} from "./qr-stapel";
import { EinleseQuittung } from "./einlese-quittung";
import { StapelQuittung } from "./stapel-quittung";
import { EintreffzeitFeld, abrueckzeitVomZettel, aehnlicherOrt, andererEinheitstyp, eintreffzeitPruefen } from "./nacherfassung";
import { meldungenVergleichen, steckbriefZeile, type MeldungsVergleich } from "./meldungs-vergleich";
import { beispielMerken, beispielVergessen } from "./beispiel-herkunft";
import { ansichtSchluessel, stelleLaden, stelleMerken } from "./ansicht-stelle";
import { abgeteiltDoppelt, abgeteiltDoppeltImStapel, abgeteiltDoppeltText, doppeltHerausnehmbar, ohneAbgeteilte } from "./abgeteilt-doppelt";
import { DaumenQuittung } from "./daumen-quittung";
import {
  entwurfAusAnderemFenster,
  entwurfLaden,
  zettelPruefen,
  beschaedigterEntwurfAnzeige,
  beschaedigtenEntwurfVerwerfen,
  entwurfSpeichern,
  entwurfVerwerfen,
  ersetztenEntwurfLaden,
  ersetztenEntwurfMerken,
  rueckholungNimmt,
  ersetztenEntwurfVerwerfen,
  entwurfUeberschreibenErlauben,
  entwurfFremdEntfernt,
  type Entwurf,
} from "./entwurf";
import { SeitenKopf } from "./seiten-kopf";
import { datumZweistellig } from "./papierkorb-frist";
import { UnlesbarHinweis } from "./unlesbar-hinweis";
import { AnzeigeLeistenKnopf, AnzeigeSchalter } from "./anzeige-schalter";
import { orgFarbe, wendeOrgAkzentAn } from "./org-farben";
import { einheitSymbolSvg, svgDataUrl } from "./taktische-zeichen-bogen";
import { Fusszeile } from "./fusszeile";
import { Aktualisierungshinweise } from "./aktualisierung";
import { SpeicherWarnung } from "./speicher-warnung";
import { arbeiten, useArbeitet } from "./arbeitet";
import { LEERER_EINSATZ_TEXT, LEERE_DATEI_TEXT, einsatzLeer } from "./ausgabe-sperre";
import { selbstGeloeschtMeldung } from "./einsatz-geloescht";
import { wartendenLinkErledigt, wartendenLinkLesen, wartendenLinkMerken } from "./wartender-link";
import { FesteWarnung } from "./feste-warnung";
import { speicherFehlerDetails, speicherFehlerKurz } from "./speicher-fehler-text";
import { browserSpeicherhuelle } from "./speicher-browser";
import { UhrHinweis, UhrWarnung } from "./uhr-warnung";
import { Dialogschicht, frageFelder, frageJaNein, frageWahl, zeigeHinweis, type Antwortweg } from "./dialoge";
import { istNurStaerke, nurStaerkeUebernehmen, wasWegfiele } from "./nur-staerke";
import { eintreffzeitStapelHinweis } from "./angaben-alter";
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

/**
 * Ziel von „← Zurück" im Assistenten. In der Schnellerfassung führt „Weiter" von Schritt 1 gleich auf Schritt 3 (der Reiter 2
 * zeigt „–", „entfällt"); „←" springt ebenso zurück, statt auf dem entfallenden Schritt 2 zu landen (R18-S6).
 */
export function zurueckSchritt(schritt: number, schnellErfassung: boolean): number {
  if (schnellErfassung && schritt === 2) return 0;
  return Math.max(0, schritt - 1);
}

/** „Einsatz anlegen" bei gesperrtem Browser-Speicher: Grund und Ausweg dort, wo getippt wurde (R18-O1). */
export const SAMMLUNG_GESPERRT_TEXT =
  "Dieser Browser lässt die App gerade nichts speichern (privates Fenster oder Datenschutz-Einstellung). Eine Sammlung ginge beim Schließen verloren. " +
  "Ein normales Fenster öffnen oder Speichern für diese Seite erlauben; bis dahin Bögen als PDF übergeben.";

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
 * Quittung im Kiosk-Stapel, wenn eine Fassung nicht nach dem Zeitstempel
 * gelten soll (R4-W1): keine Rückfrage beim Dauerscannen, aber ein Satz,
 * der sagt, was gilt und wo es sich ändern lässt.
 */
/** Wo eine nur abgelegte ältere Fassung doch gelten kann (R15-E2). */
const HISTORIE_WEG = ". Ändern: Historie › „Diese Fassung gilt…“";
function vorrangKioskText(p: FassungsPruefung): string {
  const bisher = zeitpunktDeutsch(p.bisher.bogen.stand);
  if (p.lage === "aelter") return `älterer Stand als der vorhandene (${bisher}) — nur in die Historie gelegt${HISTORIE_WEG}`;
  if (p.lage === "gleiche-minute") return `gleicher Stand wie die bisherige Fassung (${bisher}) — die eben gescannte gilt, an der Karte unter „Historie" änderbar`;
  return `älterer Stand als die Schnellerfassung (${bisher}) — an der Karte „Bogen übernehmen" tippen`;
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
type Ansicht = { schritt: number; zeigeStart: boolean; einsatz: string | null; scanner: boolean; muster?: boolean; lauf?: string };
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
 * Soll Zurück den Eintrag aus der Zeit vor dem Neuladen überspringen? Nur auf der Startseite (R11-E8): Wer mitten im Einsatz oder
 * im Assistenten neu lädt und dann zurück will, soll auf dem vorigen Eintrag landen (meist die Startseite) und nicht aus der App
 * fliegen (R17-S2).
 */
export function verlaufRestUeberspringen(
  ziel: { lauf?: string } | undefined | null,
  aktuell: Pick<Ansicht, "zeigeStart" | "scanner" | "muster" | "einsatz"> | null | undefined,
  lauf: string = LAUF_ID,
): boolean {
  // Die Einsatzansicht trägt `zeigeStart` ebenfalls (sie liegt auf der Startseite); sie zählt hier nicht als Startseite.
  const aufStartseite = !aktuell || (aktuell.zeigeStart && !aktuell.einsatz && !aktuell.scanner && !aktuell.muster);
  return aufStartseite && verlaufRest(ziel, lauf);
}
/**
 * Bisherige und neue Meldung in der Rückfrage nebeneinander (R4-N1): Stärke,
 * Ansprechperson, Kennzeichen, Stand — und ein Hinweis, wenn sie keine Person
 * und kein Fahrzeug gemeinsam haben. Steht im `<p>` der Rückfrage, darum nur
 * Inline-Elemente.
 */
export function MeldungsGegenueberstellung({ vergleich, warAbgerueckt = false }: { vergleich: MeldungsVergleich; warAbgerueckt?: boolean }) {
  return (
    <>
      <br />
      <span className="meldungs-vergleich">
        {/* Was die Wahl für den Anwesenheitsstand bedeutet, steht vor dem Vergleich und nicht dahinter, wo bei
            360 × 640 der Rollbereich es verbirgt (R12-W4). */}
        {warAbgerueckt && (
          <>
            <strong className="rueckkehr-hinweis">⚠ Die Einheit war abgerückt – mit der neuen Fassung zählt sie wieder mit.</strong>
            <br />
          </>
        )}
        <strong>Bisher:</strong> {steckbriefZeile(vergleich.bisher)}
        <br />
        <strong>Neu:</strong> {steckbriefZeile(vergleich.neu)}
        {vergleich.geaendert && (
          <>
            <br />
            <strong>Geändert:</strong> {vergleich.geaendert}
          </>
        )}
      </span>
      {vergleich.keineUeberschneidung && (
        <>
          <br />
          <span className="warnung-text">
            ⚠ Keine gemeinsame Person, kein gemeinsames Fahrzeug — vielleicht eine andere Gruppe?
          </span>
        </>
      )}
    </>
  );
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
  return a.schritt === b.schritt && a.zeigeStart === b.zeigeStart && a.einsatz === b.einsatz && a.scanner === b.scanner && !!a.muster === !!b.muster;
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
    if (keinBogen) beispielVergessen();
  }, [keinBogen]);
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
  // Für welche Erfassung die Frage „Fahrzeuge und Sofortbedarf offen — jetzt übernehmen?" schon beantwortet ist (R15-S4).
  const folgeFrageFuer = useRef<number | null>(null);
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
  // Einsatz-Sammlung (Meldekopf/Zugführer): Liste, offener Einsatz und das
  // Sammelziel für hereinkommende Bögen (Scan/manuell landen dort statt zu öffnen).
  const [einsaetze, setEinsaetze] = useState<Einsatzsammlung[]>(() => einsaetzeLaden());
  // Beim Kaltstart ohne Link die zuletzt offene Sammlung wieder öffnen (W5).
  const [offenerEinsatzId, setOffenerEinsatzIdRoh] = useState<string | null>(() =>
    START.bogen || START.segment || START.vorlage || erfassungsZielBeimStart() ? null : letztenEinsatzLaden(),
  );
  const setOffenerEinsatzId = (id: string | null) => {
    setOffenerEinsatzIdRoh(id);
    letztenEinsatzMerken(id);
  };
  // Was beim letzten Export des offenen Einsatzes schon in der Sammlung stand
  // (export-stand.ts) — die Detailansicht zählt daran ab, was seitdem neu ist.
  const [exportStaende, setExportStaende] = useState<Partial<Record<ExportZiel, ExportStand>>>({});
  // Alle Bögen oder nur die neuen: liegt hier statt in der Detailansicht, weil
  // die beim Erfassen einer Einheit (Assistent übernimmt) aus- und wieder
  // eingehängt wird — ein angekreuztes Kästchen, das dabei zurückspränge,
  // läse sich als Fehler. Vorgabe bleibt der Gesamtexport, und ein anderer
  // Einsatz beginnt wieder damit: dem Stab darf nicht versehentlich etwas fehlen.
  const [exportUmfang, setExportUmfang] = useState<ExportUmfang>("alle");
  const letzterExportEinsatz = useRef<string | null>(null);
  useEffect(() => {
    if (!offenerEinsatzId) return; // Assistent zwischendurch — die Wahl wartet auf die Rückkehr
    setExportStaende(exportStaendeLaden(offenerEinsatzId));
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
  function markiereEingang(schluessel: string, uebersprungen?: string) {
    eingangZaehler.current += 1;
    setEingang({ schluessel, nonce: eingangZaehler.current, ...(uebersprungen ? { uebersprungen } : {}) });
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
  // Der Knopf im Bericht öffnet den Abgleich vom Papier (R4-A6).
  const [abgleichAnstoss, setAbgleichAnstoss] = useState(0);
  // Rückmeldung von „Bögen einlesen…" (Dateien) unter den Aufnahme-Knöpfen (R3-L1, R3-E4).
  const [einlese, setEinlese] = useState<{ fehler: string; meldung: string; einzelheiten?: Einzelheit[] } | null>(null);
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
  // Die drei Zettelangaben liegen mit im Entwurf und überleben das Neuladen (R9-S1).
  const [nachEintreffzeit, setNachEintreffzeit] = useState(ENTWURF?.fremd?.zettel?.zeit ?? "");
  // „Abgerückt um“ vom Meldeblock („an / ab“, R13-A1): Die Einheit wird gleich als abgerückt angelegt.
  const [nachAbgerueckt, setNachAbgerueckt] = useState(ENTWURF?.fremd?.zettel?.ab ?? "");
  // „Nr. laut Zettel“ und Zug der von Hand erfassten Einheit (R5-A4).
  const [nachNummer, setNachNummer] = useState(ENTWURF?.fremd?.zettel?.nr ?? "");
  const [nachZug, setNachZug] = useState(ENTWURF?.fremd?.zettel?.zug ?? "");
  // Zuletzt auf „Ja — dieselbe Einheit" zusammengelegt: für die Quittung mit
  // beiden Namen und „Rückgängig — als eigene Einheit" (Audit Runde 4, R4-E1).
  const [zusammenlegung, setZusammenlegung] = useState<{
    einsatzId: string;
    eintragId: string;
    bogen: Erfassungsbogen;
    quelle: "scan" | "manuell" | "pdf-import";
    signatur?: EintragSignatur;
    herkunft?: string;
    neu: string;
    alt: string;
  } | null>(null);

  // Legt ein anderes Fenster die offene Sammlung in den Papierkorb (oder löscht
  // sie), sprang diese Ansicht wortlos auf die Startseite: Wer gerade Einheiten
  // aufnahm, sah die Lage verschwinden und hielt die App für abgestürzt
  // (Audit Runde 5, R5-O6). Jetzt sagt die Startseite, was geschah. Nur wenn
  // dieses Fenster die Sammlung vorher gesehen hat — nicht bei einer
  // Erinnerung an eine längst gelöschte.
  const offenerBekannt = useRef<{ id: string; name: string } | null>(null);
  useEffect(() => {
    if (!offenerEinsatzId) {
      offenerBekannt.current = null;
      return;
    }
    const da = einsaetze.find((s) => s.id === offenerEinsatzId);
    if (da) {
      offenerBekannt.current = { id: da.id, name: da.name };
      return;
    }
    const bekannt = offenerBekannt.current;
    if (!bekannt || bekannt.id !== offenerEinsatzId) return;
    offenerBekannt.current = null;
    const imPapierkorb = einsaetzePapierkorb().some((s) => s.id === bekannt.id);
    setMeldung(
      imPapierkorb
        ? `Die Sammlung „${bekannt.name}" wurde in einem anderen Fenster in den Papierkorb gelegt. Sie lässt sich dort 30 Tage lang zurückholen — unten auf der Startseite unter „Papierkorb".`
        : `Die Sammlung „${bekannt.name}" gibt es nicht mehr — sie wurde in einem anderen Fenster gelöscht.`,
    );
    setOffenerEinsatzId(null);
    setZeigeStart(true);
  }, [einsaetze, offenerEinsatzId]);

  // Dasselbe für eine laufende Aufnahme „für Einsatz" (R11-O2): Wird der Einsatz in einem anderen Fenster gelöscht, sprang die
  // Eingabe ohne Hinweis zum eigenen Bogen — „Aufnahme für" und „In Einsatz übernehmen" waren weg, ohne zu sagen, warum.
  const zielBekannt = useRef<{ id: string; name: string } | null>(null);
  // Einsatz, den dieses Fenster selbst gerade in den Papierkorb gelegt hat (R12-S1).
  const selbstGeloescht = useRef<string | null>(null);
  // Die dazu gezeigte Statuszeile: Mit „Rückgängig" ist der Einsatz wieder da, die Zeile verschwindet (R13-S1).
  const selbstMeldung = useRef<{ id: string; text: string } | null>(null);
  useEffect(() => {
    const m = selbstMeldung.current;
    if (!m || !einsaetze.some((s) => s.id === m.id)) return;
    selbstMeldung.current = null;
    setMeldung((jetzt) => (jetzt === m.text ? "" : jetzt));
  }, [einsaetze]);
  useEffect(() => {
    if (!sammelZielId || !fremdeErfassung) {
      zielBekannt.current = null;
      selbstGeloescht.current = null;
      return;
    }
    const da = einsaetze.find((s) => s.id === sammelZielId);
    if (da) {
      zielBekannt.current = { id: da.id, name: da.name };
      return;
    }
    const bekannt = zielBekannt.current;
    if (!bekannt || bekannt.id !== sammelZielId) return;
    zielBekannt.current = null;
    const imPapierkorb = einsaetzePapierkorb().some((s) => s.id === bekannt.id);
    if (selbstGeloescht.current === bekannt.id) {
      selbstGeloescht.current = null;
      setZeigeStart(true);
      const text = selbstGeloeschtMeldung(bekannt.name, bogen ? einheitAnzeigename(bogen.einheit) || "(noch ohne Namen)" : "");
      selbstMeldung.current = { id: bekannt.id, text };
      setMeldung(text);
      return;
    }
    setMeldung(
      imPapierkorb
        ? `Der Einsatz „${bekannt.name}" wurde in einem anderen Fenster in den Papierkorb gelegt. Die Eingabe ist jetzt ein eigener Bogen und lässt sich hier nicht mehr ablegen — zum Ablegen auf der Startseite unter „Papierkorb Einsätze" den Einsatz zurückholen und die Meldung dort neu aufnehmen.`
        : `Der Einsatz „${bekannt.name}" gibt es nicht mehr — er wurde in einem anderen Fenster gelöscht. Die Eingabe ist jetzt ein eigener Bogen; zum Ablegen „In Einsatz-Sammlung ablegen…“ in der Übersicht nutzen.`,
    );
  }, [einsaetze, sammelZielId, fremdeErfassung]);

  const vorlagenNeuLaden = () => setVorlagen(vorlagenLaden());
  const einsaetzeNeuLaden = () => setEinsaetze(einsaetzeLaden());
  // R14-S1: Ein nicht gespeicherter Zug oder Auftrag wird beim Verlassen der Einsatzansicht gesichert (Browser-Zurück,
  // Startseite) — aber erst NACH dem letzten Laden der Liste. Die Karte zeigte beim nächsten Öffnen den alten Stand
  // („Text weg"), obwohl er im Speicher stand. Jeder Wechsel der offenen Ansicht liest die Sammlungen darum frisch ein;
  // die Aufräumfunktionen der Karten laufen vor diesem Effekt.
  useEffect(() => {
    setEinsaetze(einsaetzeLaden());
  }, [offenerEinsatzId]);

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
  const stelleAnsicht = ansichtSchluessel({ schritt, zeigeStart: startSichtbar, einsatz: offenerEinsatzId, scanner: scannerOffen, muster: musterAktiv });
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
    const jetzt: Ansicht = { schritt, zeigeStart: startSichtbar, einsatz: offenerEinsatzId, scanner: scannerOffen, muster: musterAktiv, lauf: LAUF_ID };
    const vorher = ansichtRef.current;
    ansichtRef.current = jetzt;
    if (typeof history === "undefined") return;
    if (!vorher) {
      // Der erste Eintrag der App trägt eine Marke: Rückfragen legen dort einen
      // eigenen Eintrag an, damit Zurück sie schließt statt die App zu verlassen
      // (R5-S5, modal-overlay.ts). Nach dem Neuladen ist `eeb` schon da.
      const roh = (history.state ?? {}) as { eeb?: Ansicht };
      // Kaltstart direkt in den zuletzt geöffneten Einsatz (R18-K12): Darunter liegt ein Eintrag „Startseite", damit Zurück
      // zuerst die Startseite zeigt („die anderen Einsätze") und die App nicht verlässt. Nach dem Neuladen ist `eeb` schon da.
      if (!roh.eeb && jetzt.einsatz && !jetzt.scanner && !jetzt.muster) {
        try {
          history.replaceState({ ...roh, eeb: { ...jetzt, einsatz: null }, eebErste: true }, "");
          history.pushState({ eeb: jetzt }, "");
        } catch {
          /* ohne Verlauf */
        }
        return;
      }
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
      if (hub(vorher) && !vorher.muster && (jetzt.scanner || sammelZielRef.current)) ruecksprungRef.current = { ziel: vorher, tiefe: 1 };
      else if (ruecksprungRef.current) ruecksprungRef.current.tiefe += 1;
    }
    if (ersetzbar) history.replaceState({ eeb: jetzt }, "");
    else history.pushState({ eeb: jetzt }, "");
  }, [schritt, startSichtbar, offenerEinsatzId, scannerOffen, musterAktiv]);
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
      // Zurück aus der Sammlung (wie „‹ Startseite"): Hinweiszeilen zu einer einzelnen Einheit gehören nicht auf die
      // Startseite, dort fehlt der Einsatz, auf den sie sich beziehen (R15-S3).
      if (ansichtRef.current?.einsatz && !ziel.einsatz) einsatzHinweiseWeg();
      if (!ziel.muster && musterVorlageRef.current) setMusterVorlage(null);
      else if (ziel.muster && !musterVorlageRef.current) setMusterVorlage(musterungVorlageAusStand(vorlagenRef.current));
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
  const bogenGespeichert = useRef<{ bogen: Erfassungsbogen | null; um: number }>({
    bogen: ENTWURF?.bogen ?? null,
    um: ENTWURF?.gespeichert ?? Date.now(),
  });
  // Zweites Fenster mit demselben Bogen oder derselben Sammlung (R2-O4).
  const fenster = useFensterAbgleich(!!bogen, einsaetzeNeuLaden, {
    eigenerBogen: () => bogen,
    onRueckholung: () => setErsetzterEntwurf(ersetztenEntwurfLaden()),
  });
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
          fremd: fremdeErfassung
            ? {
                einsatzId: sammelZielId ?? undefined,
                beginn: erfassungBeginn ?? undefined,
                ...(zeigeStart ? { startseite: true as const } : {}),
                zettel: zettelPruefen({ zeit: nachEintreffzeit, ab: nachAbgerueckt, nr: nachNummer, zug: nachZug }),
              }
            : undefined,
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
  }, [bogen, vorlageInBearbeitung, fremdeErfassung, sammelZielId, erfassungBeginn, zeigeStart, schritt, uebergabe, fenster.runde, nachEintreffzeit, nachNummer, nachZug]);

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
    // Am Meldekopf ist eine Bogendatei fast immer die Meldung einer Einheit:
    // dieselbe Frage „Wohin damit?" wie bei Link und Scan. Vorher öffnete
    // „Aus Datei laden…" sie als eigenen Bogen, die Einheit fehlte in der Lage
    // und der eigene Entwurf lag auf dem Rückholplatz (Audit Runde 4, R4-N2).
    const mehrere =
      anzahl > 1 ? `Die PDF enthält ${anzahl} Bögen — aufgenommen ist „${einheitAnzeigename(geladen.bogen.einheit)}". Alle auf einmal: in der Sammlung „Bögen einlesen…".` : "";
    const bereitsGefragtVorab = oeffnenErsetztEigenenBogen(geladen.bogen);
    const wohin = await empfangsZielWaehlen(geladen.bogen, "Datei");
    if (wohin == null) return; // abgebrochen — nichts verändert
    const bereitsGefragt = wohin === "oeffnen" && bereitsGefragtVorab;
    let nichtAbgelegt: string | null = null;
    if (wohin !== "oeffnen") {
      const ok = await bogenInSammlung(wohin, geladen.bogen, "pdf-import", undefined, false, mehrere);
      setZeigeStart(false);
      // Wie beim Link: nur bei vollem Speicher wird der Bogen stattdessen geöffnet (R2-O2).
      nichtAbgelegt = ok ? null : ablageFehler.current;
      if (!nichtAbgelegt) return;
    }
    // Derselbe Bogen ist schon offen: nichts ersetzen, nichts verdrängen (R4-E2).
    if (bogenSchonOffen(geladen.bogen)) {
      schonOffenenBogenZeigen(geladen.bogen);
      return;
    }
    if (!(await darfBogenErsetzen({ titel: "Bogen aus Datei öffnen?", was: "den Bogen aus der Datei", ok: "Datei öffnen", ohneFrage: bereitsGefragt }))) return;
    const b = geladen.bogen;
    if (b.uebung) beispielMerken(b); // Namen und Nummern aus einem Übungs-/Beispielbogen: Rückfrage beim Abwählen von „Übung" (R14-E6)
    setBogen(b);
    setzeEmpfang(null); // Datei-Import: kein signierter Transport
    setSchritt(UEBERSICHT);
    setZeigeStart(false);
    setOffenerEinsatzId(null);
    setFehler(
      nichtAbgelegt
        ? `Nicht in die Sammlung aufgenommen: ${nichtAbgelegt} Der Bogen bleibt hier geöffnet — danach „In Einsatz-Sammlung ablegen…".`
        : "",
    );
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
    // „Alle Daten löschen" (oder Löschen des Bogens) in einem anderen Fenster:
    // Was dort entfernt wurde, schreibt dieses Fenster nicht aus dem
    // Arbeitsspeicher auf den Rückholplatz zurück (Audit Runde 7, R7-D1).
    if (entwurfFremdEntfernt()) return false;
    // Die Rückholung nennt die letzte Bearbeitung, nicht den Moment des Schließens (R4-S5).
    const geaendertUm = bogenGespeichert.current.bogen === b ? bogenGespeichert.current.um : undefined;
    const ok = ersetztenEntwurfMerken(
      b,
      fremdeErfassung
        ? { einsatzId: sammelZielId ?? undefined, beginn: erfassungBeginn ?? undefined, zettel: zettelPruefen({ zeit: nachEintreffzeit, ab: nachAbgerueckt, nr: nachNummer, zug: nachZug }) }
        : undefined,
      { ...opt, geaendertUm },
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
      satz: `Achtung, „Zuletzt geschlossener Bogen" fasst nur einen Bogen: ${alt.fremd ? "Die" : "Der"} dort bisher liegende ${alt.fremd ? "Erfassung" : "Bogen"} „${altName}" (Stand ${stand} Uhr${altMerkmal ? ` · ${altMerkmal}` : ""}) wird dabei endgültig gelöscht. ${bleibt.replace("Der Stand bleibt", "Nur der jetzt ersetzte Stand bleibt")}`,
      verlust: true,
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
    setOffenerEinsatzId(null);
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
        text: `${a.vorab ? `${a.vorab} ` : ""}${
          bearbeiteteVorlage
            ? `Die Bearbeitung der Vorlage „${bearbeiteteVorlage.name}"`
            : `${fremdeErfassung ? "Die angefangene Erfassung" : "Der angefangene Bogen"} „${einheitAnzeigename(bogen.einheit)}"`
        } wird durch ${a.was} ersetzt. ${folgen.satz}`,
        ok: a.ok,
        abbruch: a.abbruch,
        gefahr: folgen.verlust,
        // Die sichere Wahl hat den Fokus, auch wenn der Bogen zurückholbar bleibt (R7-E4).
        fokus: "abbruch",
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
    // Eine zurückgeholte Erfassung bleibt eine Erfassung — samt Sammlung, falls es sie noch gibt.
    const ziel = zurueck.fremd?.einsatzId;
    setFremdeErfassung(!!zurueck.fremd);
    setErfassungBeginn(zurueck.fremd?.beginn ?? null);
    setNachEintreffzeit(zurueck.fremd?.zettel?.zeit ?? "");
    setNachAbgerueckt(zurueck.fremd?.zettel?.ab ?? "");
    setNachNummer(zurueck.fremd?.zettel?.nr ?? "");
    setNachZug(zurueck.fremd?.zettel?.zug ?? "");
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
      // Ein Name für beides (R18-N6): „Bogen schließen" heißt überall „aufbewahren, nicht löschen" — wie in der Übersicht.
      titel: vorlage ? "Bearbeitung der Vorlage beenden?" : fremdeErfassung ? "Angefangene Erfassung schließen?" : "Angefangenen Bogen schließen?",
      text: vorlage
        ? `Die Bearbeitung der Vorlage „${vorlage.name}" wird beendet. ${folgen.satz}`
        : `„${einheitAnzeigename(bogen.einheit)}" wird geschlossen. ${folgen.satz}`,
      ok: vorlage ? "Bearbeitung beenden" : "Bogen schließen",
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
    setFremdeErfassung(false);
    setSammelZiel(null);
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
    quelle: "scan" | "manuell" | "pdf-import",
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
    // Auf „Ja" bei „Ist das dieselbe Einheit?": der Name der Einheit, in die
    // die neue Meldung gelegt wurde — für Quittung und Rückweg (R4-E1).
    let zusammengelegtMit: string | null = null;
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
    // Wer in einer Rückfrage ausdrücklich „neue Fassung" gewählt hat, hat
    // entschieden, welche Fassung gilt — auch bei älterem oder gleichem Stand
    // im Bogen (R4-W1). "neu" = die eingehende gilt, "bisher" = sie liegt nur
    // in der Historie.
    let entschieden: "neu" | "bisher" | null = null;
    // Steht ein Teil dieser Einheit schon als abgeteilter Trupp in der Lage, würden seine Personen mit der
    // Folgemeldung doppelt zählen (R13-W1). Auch im Kiosk-Stapel ohne Frage: die Quittung nennt es dann.
    const doppeltBefund = bekannt && !schonDa && einsatz ? abgeteiltDoppelt(einsatz.eintraege, schl, b) : null;
    let doppeltHerausgenommen = false;
    if (bekannt && !schonDa && !kiosk) {
      const bisherKopf = einsatz ? fassungenJeEinheit(einsatz.eintraege, schl)[0] : undefined;
      const bisher = bisherKopf?.bogen;
      // Älterer oder gleicher Stand im Bogen: nach dem Zeitstempel gälte er
      // nicht bzw. nur zufällig — darum hier sagen und wählen lassen (R4-W1).
      const nichtJuenger = bisher != null && b.stand <= bisher.stand;
      const platzhalterBisher = bisherKopf?.quelle === "manuell" && quelle !== "manuell";
      // Beide Meldungen nebeneinander, bevor jemand „Fassung" oder „eigene
      // Einheit" wählt: Stärke, Ansprechperson, Kennzeichen, Stand. Haben sie
      // keine Person und kein Fahrzeug gemeinsam, ist es eher eine zweite
      // Gruppe — dann steht „eigene Einheit" vorn (Audit Runde 4, R4-N1).
      const vergleich = bisher ? meldungenVergleichen(bisher, b) : null;
      const fassungWeg: Antwortweg = {
        wert: "fassung",
        label: "Als neue Fassung anhängen",
        hinweis:
          (nichtJuenger && bisher
            ? `Der Bogen trägt ${b.stand < bisher.stand ? "einen älteren Stand" : "denselben Stand"} (${zeitpunktDeutsch(b.stand)}) ${b.stand < bisher.stand ? "als" : "wie"} die bisherige Meldung (${zeitpunktDeutsch(bisher.stand)}${platzhalterBisher ? ", von Hand erfasst" : ""}) — er gilt trotzdem, die bisherige wandert in die Historie.`
            : "Normalfall bei einer Nachmeldung: die bisherige wandert in die Historie, die neue gilt.") +
          (bisher ? wegfallHinweis(bisher) : ""),
      };
      // Die Folgemeldung enthält Personen, die hier schon als eigener Trupp stehen: der sichere Weg nimmt sie heraus.
      const ohneTeileWeg: Antwortweg[] =
        doppeltBefund && doppeltHerausnehmbar(b)
          ? [
              {
                wert: "fassung-ohne",
                label: `Als neue Fassung anhängen, ohne ${doppeltBefund.teile.map((t) => t.etikett).join(", ")}`,
                hinweis: `Die abgeteilten Personen bleiben beim Trupp und zählen nicht doppelt: ${staerkeKurz(ohneAbgeteilte(b, doppeltBefund))} statt ${staerkeKurz(b)}.`,
              },
            ]
          : [];
      const historieWeg: Antwortweg[] = nichtJuenger
        ? [{ wert: "historie", label: "Nur in die Historie legen", hinweis: "Die bisherige Meldung gilt weiter." }]
        : [];
      const eigeneWeg: Antwortweg = {
        wert: "eigene",
        label: "Als eigene Einheit führen",
        hinweis: "Für eine zweite, gleich benannte Einheit — beide zählen getrennt in die Summe.",
      };
      // Die Frage hat zwei gleichwertige Antworten und deshalb zwei benannte
      // Knöpfe: „OK/Abbrechen" hätte den zweiten Weg als Abbruch getarnt.
      const wahl = await frageWahl({
        titel: "Einheit ist bereits gemeldet",
        text: (
          <>
            „{einheitAnzeigename(b.einheit)}" steht in diesem Einsatz schon. Wie soll der neue Bogen dazu stehen?
            {vergleich && <MeldungsGegenueberstellung vergleich={vergleich} warAbgerueckt={bisherKopf?.status === MeldeStatus.ABGERUECKT} />}
            {doppeltBefund && (
              <>
                <br />
                <span className="warnung-text">
                  ⚠ {abgeteiltDoppeltText(doppeltBefund)} Als gewöhnliche neue Fassung zählten sie doppelt.
                </span>
              </>
            )}
          </>
        ),
        wege: vergleich?.keineUeberschneidung
          ? [eigeneWeg, ...(bisher ? nurStaerkeWeg(bisher) : []), ...ohneTeileWeg, fassungWeg, ...historieWeg]
          : nichtJuenger && !platzhalterBisher && b.stand < (bisher?.stand ?? 0)
            ? // Älterer Bogen nach einem echten jüngeren: Historie zuerst.
              [...historieWeg, ...(bisher ? nurStaerkeWeg(bisher) : []), ...ohneTeileWeg, fassungWeg, eigeneWeg]
            : [...(bisher ? nurStaerkeWeg(bisher) : []), ...ohneTeileWeg, fassungWeg, ...historieWeg, eigeneWeg],
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
      if (wahl === "fassung-ohne" && doppeltBefund) {
        aufzunehmen = ohneAbgeteilte(b, doppeltBefund);
        doppeltHerausgenommen = true;
      }
      if (wahl === "fassung" || wahl === "fassung-ohne" || wahl === "staerke") entschieden = "neu";
      if (wahl === "historie") entschieden = "bisher";
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
      const aehnlich = geltendeJeEinheit(einsatz.eintraege).find(
        (e) =>
          e.einheitSchluessel !== schl &&
          e.bogen.einheit.organisation === b.einheit.organisation &&
          // Zwei eingetragene, verschiedene Einheitstypen sind zwei Einheiten
          // (Bergungsgruppe und Fachgruppe Räumen desselben OV, R4-E1).
          !andererEinheitstyp(e.bogen.einheit, b.einheit) &&
          aehnlicherOrt(einheitOrt(e.bogen.einheit), ort),
      );
      if (aehnlich) {
        const vergleich = meldungenVergleichen(aehnlich.bogen, b);
        const wahl = await frageWahl({
          titel: "Ist das dieselbe Einheit?",
          text: (
            <>
              In diesem Einsatz steht schon „{einheitAnzeigename(aehnlich.bogen.einheit)}". Die neue Meldung heißt „
              {einheitAnzeigename(b.einheit)}".
              <MeldungsGegenueberstellung vergleich={vergleich} />
            </>
          ),
          // Der sichere Weg vorn: Die Namen sind verschieden, und wer unter
          // Zeitdruck den hervorgehobenen Knopf nahm, ließ eine Einheit aus
          // der Lage fallen (R4-E1). Zusammenlegen bleibt ein Tipp weiter —
          // und lässt sich in der Quittung zurücknehmen.
          wege: [
            {
              wert: "eigene",
              label: "Nein — als eigene Einheit führen",
              hinweis: "Beide zählen getrennt in die Summe.",
            },
            ...nurStaerkeWeg(aehnlich.bogen).map((w) => ({
              ...w,
              label: `Ja — nur die Stärke von „${einheitAnzeigename(aehnlich.bogen.einheit)}" ändern (${staerkeKurz(aehnlich.bogen)} → ${staerkeKurz(b)})`,
            })),
            {
              wert: "gleich",
              label: `Ja — als neue Fassung von „${einheitAnzeigename(aehnlich.bogen.einheit)}"`,
              hinweis: "Die bisherige Meldung wandert in die Historie; gezählt wird eine Einheit." + wegfallHinweis(aehnlich.bogen),
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
        if (wahl === "gleich" || wahl === "staerke") {
          zusammengelegtMit = einheitAnzeigename(aehnlich.bogen.einheit);
          entschieden = "neu";
        }
      }
    }
    // Was sich gegenüber der vorigen Fassung ändert — für die Quittung im
    // Kiosk, bevor der Kern die neue Fassung obenauf legt.
    const vorige = bekannt && !schonDa && einsatz ? fassungenJeEinheit(einsatz.eintraege, schl)[0] : undefined;
    // Stand vor der Aufnahme — für die Frage, welche Fassung gilt (R4-W1).
    const vorherEintraege = einsatz?.eintraege ?? [];
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
    // Welche Fassung gilt? Nicht allein der Zeitstempel im Bogen: Ein
    // nachgereichter Bogen nach der Schnellerfassung oder zwei Fassungen
    // derselben Minute fragen nach (Audit Runde 4, R4-W1). Im Kiosk-Stapel
    // keine Frage — die Quittung sagt es, die Karte bietet die Übernahme an.
    const pruefung = r.neu ? fassungPruefen(vorherEintraege, einsaetzeLaden().find((x) => x.id === zielId)?.eintraege ?? [], r.eintrag.id) : null;
    let vorrang: { text: string } | null = null;
    if (pruefung && entschieden) {
      // Die Rückfrage davor hat entschieden — still umsetzen, in der Quittung nennen.
      await vorrangSetzen(zielId, entschieden === "neu" ? pruefung.neu.id : pruefung.bisher.id, entschieden === "bisher" ? pruefung.neu.id : undefined);
      vorrang = {
        text:
          entschieden === "neu"
            ? `gilt trotz ${pruefung.neu.bogen.stand < pruefung.bisher.bogen.stand ? "älterem" : "gleichem"} Stand (${zeitpunktDeutsch(pruefung.neu.bogen.stand)}); die bisherige Fassung liegt in der Historie`
            : `nur in die Historie gelegt — die bisherige Fassung (${zeitpunktDeutsch(pruefung.bisher.bogen.stand)}) gilt weiter, die Lage bleibt unverändert`,
      };
    } else if (pruefung && kiosk) {
      vorrang = { text: vorrangKioskText(pruefung) };
    } else if (pruefung) {
      vorrang = await vorrangKlaeren(zielId, pruefung);
    }
    // Holt die Folgemeldung eine abgerückte Einheit zurück, sagt die Quittung es ausdrücklich (R5-K1).
    const rueckkehrZusatz = r.neu && r.rueckkehr ? `; ⚠ ${rueckkehrText(r.rueckkehr)}, zählt wieder mit` : "";
    // Abgeteilte Trupps (R13-W1): herausgenommen oder, im Stapel ohne Frage, als Warnung genannt.
    const teileZusatz =
      r.neu && doppeltBefund
        ? doppeltHerausgenommen
          ? `; ohne ${doppeltBefund.teile.map((t) => t.etikett).join(", ")} (${doppeltBefund.personen.length} ${doppeltBefund.personen.length === 1 ? "Person" : "Personen"} stehen dort)`
          : `; ⚠ ${abgeteiltDoppeltText(doppeltBefund)} Sie zählen doppelt`
        : "";
    const folgeText =
      r.neu && vorige
        ? `Folgemeldung: ${diffKurzfassung(bogenDiff(vorige.bogen, aufzunehmen)) || "inhaltlich unverändert"}${rueckkehrZusatz}${teileZusatz}`
        : "";
    const folge =
      (vorrang && folgeText && pruefung?.lage === "gleiche-minute"
        ? ` (${folgeText}; ${vorrang.text})`
        : vorrang
          ? ` (${vorrang.text})`
          : folgeText
            ? ` (${folgeText})`
            : "") +

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
    // Übersprungen: eigene, sichtbare Quittung in der Ansicht (R15-W1), mit beiden Stärken, wenn eine andere Fassung gilt.
    const geltendJetzt = r.neu ? undefined : geltendeJeEinheit(einsaetzeLaden().find((x) => x.id === zielId)?.eintraege ?? []).find((e) => e.einheitSchluessel === r.eintrag.einheitSchluessel);
    markiereEingang(
      r.eintrag.einheitSchluessel,
      r.neu
        ? undefined
        : uebersprungenText(
            einheitAnzeigename(b.einheit),
            staerke(b).gesamt,
            geltendJetzt && geltendJetzt.id !== r.eintrag.id ? staerke(geltendJetzt.bogen).gesamt : null,
          ),
    );
    setZusammenlegung(
      zusammengelegtMit && r.neu
        ? {
            einsatzId: zielId,
            eintragId: r.eintrag.id,
            bogen: b,
            quelle,
            signatur: empfang?.signatur,
            herkunft: empfang?.herkunft ? base64UrlKodieren(empfang.herkunft) : undefined,
            neu: einheitAnzeigename(b.einheit),
            alt: zusammengelegtMit,
          }
        : null,
    );
    setOffenerEinsatzId(zielId); // zurück in die Einsatzansicht
    return true;
  }

  /**
   * Rückfrage, welche Fassung einer Einheit gilt (Audit Runde 4, R4-W1). Die
   * Kern-Regel „jüngster Stand im Bogen" bleibt, wo sie passt; hier fragt die
   * App in den beiden Lagen, in denen sie still das Falsche wählte: der
   * nachgereichte Bogen nach einer Schnellerfassung (Vorschlag: der Bogen
   * gilt) und zwei verschiedene Fassungen derselben Minute. Ein älterer
   * Bogen nach einem jüngeren gilt nicht und wird nur benannt. Rückgabe: Satz
   * für die Quittung.
   */
  async function vorrangKlaeren(zielId: string, p: FassungsPruefung): Promise<{ text: string }> {
    const name = einheitAnzeigename(p.neu.bogen.einheit);
    const stand = (e: MeldeEintrag) => `Stand ${zeitpunktDeutsch(e.bogen.stand)}, Stärke ${staerkeKurz(e.bogen)}`;
    if (p.lage === "aelter") {
      await vorrangSetzen(zielId, p.bisher.id, p.neu.id);
      return { text: `älterer Stand als der vorhandene (${zeitpunktDeutsch(p.bisher.bogen.stand)}) — nur in die Historie gelegt, die Lage bleibt unverändert${HISTORIE_WEG}` };
    }
    const vergleich = meldungenVergleichen(p.bisher.bogen, p.neu.bogen);
    if (p.lage === "ersetzt-platzhalter") {
      const wahl = await frageWahl({
        titel: "Bogen der Einheit nachgereicht",
        text: (
          <>
            Für „{name}" gilt bisher die von Hand erfasste Meldung ({stand(p.bisher)}). Der eben eingelesene Bogen der Einheit
            trägt den älteren {stand(p.neu)} — nach dem Zeitstempel bliebe die Schnellerfassung gültig.
            <MeldungsGegenueberstellung vergleich={vergleich} />
          </>
        ),
        wege: [
          {
            wert: "bogen",
            label: "Bogen der Einheit gilt — ersetzt die Schnellerfassung",
            hinweis: "Stärke, Namen, Fahrzeuge und Bedarf aus dem Bogen; Zug, Auftrag und Eintreffzeit bleiben.",
          },
          {
            wert: "bisher",
            label: "Schnellerfassung behalten",
            hinweis: "Der Bogen liegt in der Historie; an der Karte lässt er sich später übernehmen.",
          },
        ],
        abbruch: "Später entscheiden",
      });
      if (wahl === "bogen") {
        await vorrangSetzen(zielId, p.neu.id);
        return { text: `Bogen der Einheit gilt, ersetzt die Schnellerfassung (${zeitpunktDeutsch(p.bisher.bogen.stand)})` };
      }
      return { text: `älterer Stand als die Schnellerfassung (${zeitpunktDeutsch(p.bisher.bogen.stand)}) — die Schnellerfassung gilt weiter, der Bogen liegt in der Historie` };
    }
    // Gleiche Minute: die Empfangszeit entscheidet nicht mehr.
    const wahl = await frageWahl({
      titel: "Zwei Fassungen mit demselben Stand",
      text: (
        <>
          „{name}" hat schon eine Fassung mit Stand {zeitpunktDeutsch(p.bisher.bogen.stand)} (Stärke {staerkeKurz(p.bisher.bogen)}). Die eben
          eingelesene trägt dieselbe Minute (Stärke {staerkeKurz(p.neu.bogen)}). Welche gilt?
          {/* War die Einheit abgerückt, entscheidet die Wahl auch darüber, ob sie wieder mitzählt (R5-K1). */}
          {p.neu.rueckkehr && (
            <>
              {" "}
              <strong>Die Einheit ist abgerückt{p.neu.rueckkehr.abgerueckAm != null ? ` (seit ${zeitLang(p.neu.rueckkehr.abgerueckAm)})` : ""}: Gilt die eben eingelesene, zählt sie wieder mit.</strong>
            </>
          )}
          <MeldungsGegenueberstellung vergleich={vergleich} />
        </>
      ),
      wege: [
        { wert: "neu", label: `Die eben eingelesene (Stärke ${staerkeKurz(p.neu.bogen)})${p.neu.rueckkehr ? " — Einheit zählt wieder mit" : ""}` },
        { wert: "bisher", label: `Die bisherige (Stärke ${staerkeKurz(p.bisher.bogen)})${p.neu.rueckkehr ? " — Einheit bleibt abgerückt" : ""}` },
      ],
      abbruch: "Bisherige behalten",
      fokus: "abbruch", // Enter lässt die Meldung unverändert (R9-D4)
    });
    if (wahl === "neu") {
      await vorrangSetzen(zielId, p.neu.id);
      return { text: `gleicher Stand wie die bisherige Fassung — die eben eingelesene gilt` };
    }
    await vorrangSetzen(zielId, p.bisher.id, p.neu.id);
    return { text: `gleicher Stand wie die bisherige Fassung — die bisherige gilt weiter, die eben eingelesene liegt in der Historie` };
  }

  /** Vorrang schreiben; ein voller Speicher wird gemeldet, die Aufnahme bleibt. */
  async function vorrangSetzen(zielId: string, eintragId: string, inHistorie?: string): Promise<void> {
    try {
      fassungGiltSetzen(zielId, eintragId);
      // Die eben eingelesene Fassung liegt nur in der Historie (R8-W2): als verdrängt vermerken.
      if (inHistorie) fassungInHistorieLegen(zielId, inHistorie, eintragId);
    } catch (e) {
      setFehler(istSpeicherVoll(e) ? new SpeicherVollFehler(e).message : fehlerText(e));
    }
    einsaetzeNeuLaden();
  }

  /**
   * Nach einem Stapel (Dateien, Bilder): je betroffener Einheit dieselbe
   * Rückfrage wie beim Einzeleingang (R4-W1). Selten — nur nachgereichte
   * Bögen und gleiche Minuten fragen. Rückgabe: Zeilen für die Quittung.
   */
  async function vorrangImStapel(zielId: string, vorher: MeldeEintrag[], neueIds: string[]): Promise<string[]> {
    const zeilen: string[] = [];
    for (const id of neueIds) {
      const nachher = einsaetzeLaden().find((x) => x.id === zielId)?.eintraege ?? [];
      const p = fassungPruefen(vorher, nachher, id);
      if (!p) continue;
      const r = await vorrangKlaeren(zielId, p);
      zeilen.push(`„${einheitAnzeigename(p.neu.bogen.einheit)}": ${r.text}.`);
    }
    return zeilen;
  }

  /**
   * Im Stapel fragt niemand „Ist das dieselbe Einheit?" – die Quittung nennt dafür die
   * möglichen Doppelungen (Audit Runde 6, R6-N2): „THW Albstadt" ohne Typ neben „THW Albstadt
   * Zugtrupp …" zählte doppelt, ohne dass es jemand erfuhr.
   */
  function aehnlichImStapel(zielId: string, vorher: MeldeEintrag[], neueIds: string[]): string[] {
    const sammlung = einsaetzeLaden().find((x) => x.id === zielId);
    if (!sammlung) return [];
    const geltend = geltendeJeEinheit(sammlung.eintraege);
    const zeilen: string[] = [];
    for (const id of neueIds) {
      const e = sammlung.eintraege.find((x) => x.id === id);
      if (!e || vorher.some((v) => v.einheitSchluessel === e.einheitSchluessel)) continue; // Folgemeldung, keine neue Einheit
      const ort = einheitOrt(e.bogen.einheit);
      const a = geltend.find(
        (g) =>
          g.einheitSchluessel !== e.einheitSchluessel &&
          g.bogen.einheit.organisation === e.bogen.einheit.organisation &&
          !andererEinheitstyp(g.bogen.einheit, e.bogen.einheit) &&
          aehnlicherOrt(einheitOrt(g.bogen.einheit), ort),
      );
      if (a) {
        zeilen.push(
          `„${einheitAnzeigename(e.bogen.einheit)}" ähnelt „${einheitAnzeigename(a.bogen.einheit)}" – beide zählen getrennt. Dieselbe Einheit? Dann die doppelte Karte unter „Mehr…“ › „Entfernen“ wegnehmen (mit „Rückgängig“); beide Karten tragen die Marke „ähnelt“.`,
        );
      }
    }
    return zeilen;
  }

  /**
   * „Rückgängig" nach dem Zusammenlegen (R4-E1): Die eben angehängte Fassung
   * fällt wieder heraus, die bisherige Einheit gilt wie vorher, und die neue
   * Meldung steht als eigene Einheit in der Sammlung — ohne neu zu erfassen.
   * Vorher ging das nur über „Historie → Fassung verwerfen", und die
   * Erfassung war danach weg.
   */
  function zusammenlegungZuruecknehmen() {
    const z = zusammenlegung;
    if (!z) return;
    setZusammenlegung(null);
    try {
      meldungEntfernen(z.einsatzId, z.eintragId);
      const r = meldungAufnehmen(z.einsatzId, z.bogen, { quelle: z.quelle, signatur: z.signatur, herkunft: z.herkunft });
      einsaetzeNeuLaden();
      if (r) markiereEingang(r.eintrag.einheitSchluessel);
      setFehler("");
      setMeldung(`„${z.neu}" steht jetzt als eigene Einheit in der Sammlung; „${z.alt}" gilt wie vorher.`);
    } catch (e) {
      einsaetzeNeuLaden();
      setFehler(istSpeicherVoll(e) ? new SpeicherVollFehler(e).message : fehlerText(e));
    }
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
  /**
   * „Bogen öffnen" in der Wahl „Wohin damit?" würde einen eigenen, angefangenen
   * Bogen verdrängen (und nicht denselben Bogen zeigen). Ohne Sammlung gibt es
   * die Wahl nicht; dann fragt `darfBogenErsetzen` wie bisher.
   */
  function oeffnenErsetztEigenenBogen(b: Erfassungsbogen): boolean {
    return einsaetzeLaden().length > 0 && !!bogen && bogenHatInhalt(bogen) && !bogenSchonOffen(b) && !bogenSchonOffen(bogenNachFrist(b).bogen);
  }

  async function empfangsZielWaehlen(b: Erfassungsbogen, herkunft: "Meldung" | "Datei" = "Meldung"): Promise<string | null> {
    const sammlungen = einsaetzeLaden();
    if (sammlungen.length === 0) return "oeffnen";
    const letzte = letztenEinsatzLaden() ?? offenerEinsatzId;
    const sortiert = [...sammlungen].sort((x, y) => (x.id === letzte ? -1 : y.id === letzte ? 1 : y.geaendert - x.geaendert));
    const wege: { wert: string; label: string; hinweis: string; gefahr?: boolean }[] = sortiert.slice(0, 4).map((s) => ({
      wert: s.id,
      label: `In „${s.name}" aufnehmen`,
      // R15-W1: Liegt genau dieser Inhalt dort schon, sagt es die Zeile vor dem Tipp.
      hinweis: `${s.eintraege.some((e) => e.id === bogenInhaltsId(b)) ? "Schon dort, würde übersprungen · " : ""}${ART_LABEL[s.art]}${s.ort ? ` · ${s.ort}` : ""} · ${einheitenZahl(aktuelleMeldungen(s.eintraege, s.art).length)} anwesend`,
    }));
    // Steht ein eigener Bogen im Weg, nennt schon diese Zeile die Folge samt
    // Rückholplatz — „Bogen öffnen" gilt dann als Zustimmung, die zweite,
    // gleichlautende Rückfrage entfällt (R5-S7; wie bei „Einheit erfassen").
    const folgen = oeffnenErsetztEigenenBogen(b) ? folgenFuerOffenenBogen() : null;
    wege.push({
      wert: "oeffnen",
      label: "Bogen öffnen (ansehen oder bearbeiten)",
      hinweis: folgen
        ? `Ersetzt deinen angefangenen Bogen „${einheitAnzeigename(bogen!.einheit)}". ${folgen.satz}`
        : "Für die Einheit selbst — der eigene angefangene Bogen bleibt über die Startseite zurückholbar.",
      gefahr: folgen?.verlust,
    });
    return frageWahl({
      titel:
        herkunft === "Datei"
          ? `Bogen von „${einheitAnzeigename(b.einheit)}" aus der Datei`
          : `Meldung von „${einheitAnzeigename(b.einheit)}" empfangen`,
      // Niemand hat gezählt: Die Zahl ist die Sollstärke der Vorbelegung — das gehört vor die Entscheidung (R9-W5).
      text: `Stärke ${staerkeKurz(b)}${nurSollstaerke(b) ? ` (nur Sollstärke: ${b.personal.length} Plätze ohne Namen, niemand hat gezählt)` : ""}${b.uebung ? " · ÜBUNG" : ""}. Wohin damit?`,
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
    const ungueltig = signatur.zustand === "ungueltig";
    if (ziel && (!opt.ohneKiosk || scannerOffenRef.current)) {
      // Handscanner im Reihentakt: Wer auf Fenster und Haken schaut, soll bei veränderten Daten nicht grün durchgehen.
      // Es wird nichts aufgenommen; nochmal scannen oder beim Absender neu anfordern (R15-E1). Gleicher Inhalt zählt nicht.
      if (ungueltig) {
        piep(false);
        setScanFortschritt((await import("./signatur-warnung")).signaturUngueltigScan(einheitAnzeigename(b.einheit)));
        return false;
      }
      // Abwarten: steckt in der Aufnahme eine Rückfrage (Einheit schon
      // gemeldet), darf der Scan-Loop nicht schon den nächsten Code lesen.
      // Die Datenschutzfrist wendet die Sammlung selbst an (meldungHinzufuegen).
      await bogenInSammlung(ziel, b, "scan", { signatur: alsEintragSignatur(signatur), herkunft: payload }, true);
      return false; // Kiosk: weiter scannen, bis abgebrochen wird
    }
    const bereitsGefragtVorab = oeffnenErsetztEigenenBogen(b);
    const wohin = await empfangsZielWaehlen(b);
    if (wohin == null) return true; // abgebrochen — nichts verändert
    // Ablegen eines veränderten Bogens nur nach ausdrücklichem Ja; Öffnen zeigt die Signatur ohnehin an (R15-E1).
    if (ungueltig && wohin !== "oeffnen" && !(await (await import("./signatur-warnung")).signaturUngueltigAufnehmen(einheitAnzeigename(b.einheit)))) return true;
    const bereitsGefragt = wohin === "oeffnen" && bereitsGefragtVorab;
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
    // Derselbe Bogen ist schon offen (Link zweimal angetippt): Die Rückfrage
    // bot an, ihn „durch sich selbst" zu ersetzen, und löschte dabei den
    // eigenen Bogen vom Rückholplatz (Audit Runde 4, R4-E2). Jetzt: zeigen.
    if (!nichtAbgelegt && bogenSchonOffen(bogenNachFrist(b).bogen)) {
      schonOffenenBogenZeigen(b);
      return true;
    }
    if (!(await darfBogenErsetzen({ titel: "Empfangenen Bogen öffnen?", was: "die empfangene Meldung", ok: "Meldung öffnen", ohneFrage: bereitsGefragt }))) {
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
          return uebernimmBogen(b, status, payload, opt);
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
  async function uebernehmeQrText(rohText: string, opt: { ohneKiosk?: boolean } = {}): Promise<boolean> {
    const text = entwirreScanText(rohText, istLesbarerScan);
    const fertig = await uebernehmeText(text, scanFehlertext(rohText), opt);
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

  /** Hinweiszeilen der Einsatzansicht räumen, wenn sie verlassen wird („‹ Startseite" und Zurück-Geste). */
  function einsatzHinweiseWeg() {
    setMeldung("");
    setAusgabeQuittung(null);
    setEingang(null);
    setZusammenlegung(null);
    setEinlese(null);
    setStapelBericht([]);
  }

  function scanAbbrechen(auchSammelZiel: boolean) {
    setScannerOffen(false);
    if (auchSammelZiel) setSammelZiel(null);
    // Ein angefangener mehrteiliger Bogen geht mit „Abbrechen" verloren — das Fenster sagt es (R15-E3).
    const verworfen = verworfeneTeileSatz(segmentTeileRef.current);
    setzeSegmentTeile([]);
    setScanFortschritt("");
    // Kiosk-Bilanz beim Schließen kurz bestätigen (der Zähler stand im Overlay).
    const n = kioskZaehlerRef.current;
    kioskZaehlerRef.current = 0;
    const bilanz = [n > 0 && `${n} ${n === 1 ? "Bogen" : "Bögen"} in diesem Durchgang aufgenommen.`, verworfen && `${verworfen}.`].filter(Boolean).join(" ");
    if (bilanz) setMeldung(bilanz);
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
      try {
        await uebernimmBogen(b, status, START.text ? payloadAusText(START.text) : null, { ohneKiosk: true });
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
    void uebernehmeText(text, LINK_UNGUELTIG, { ohneKiosk: true }).finally(wartendenLinkErledigt).then(
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
    void uebernehmeQrText(text, { ohneKiosk: true }).then((fertig) => {
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
    // Lässt der Browser nichts speichern (privates Fenster), entstünde keine Sammlung: Das sagt schon der Tipp auf
    // „Neue Einsatz-Sammlung…", bevor ein Name getippt wird (R18-O1).
    if (browserSpeicherhuelle() === null) {
      await zeigeHinweis({ titel: "Sammlung nicht angelegt", text: SAMMLUNG_GESPERRT_TEXT });
      return null;
    }
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
    // Gleicher Name wie eine vorhandene Sammlung: einmal fragen, statt stumm eine zweite anzulegen, die danach
    // nur an der Zeit zu unterscheiden ist (R11-K3).
    const gleichnamig = einsaetzeLaden()
      .filter((x) => x.name.trim().toLowerCase() === (werte.name ?? "").trim().toLowerCase())
      .sort((a, b) => b.geaendert - a.geaendert);
    if (gleichnamig.length > 0) {
      const vorhanden = gleichnamig[0]!;
      const wahl = await frageWahl({
        titel: "Diese Sammlung gibt es schon",
        text: `„${vorhanden.name}" gibt es schon (${anzahlEinheiten(vorhanden.eintraege)}${vorhanden.ort ? `, ${vorhanden.ort}` : ""}). Die vorhandene öffnen oder trotzdem eine zweite anlegen?`,
        wege: [
          { wert: "oeffnen", label: "Vorhandene öffnen" },
          { wert: "neu", label: "Trotzdem neu anlegen" },
        ],
      });
      if (wahl === null) return null;
      if (wahl === "oeffnen") return vorhanden;
    }
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
    // Schreiben still gescheitert (Speicher gesperrt, nicht voll)? Dann liegt die Sammlung nicht im Speicher (R18-O1).
    if (!einsaetzeLaden().some((x) => x.id === s.id)) {
      await zeigeHinweis({ titel: "Sammlung nicht angelegt", text: SAMMLUNG_GESPERRT_TEXT });
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
    let b = bogen;
    const sig = bogenSignatur;
    const herkunft = bogenHerkunft;
    // Ein empfangener Bogen ist die Meldung der Einheit — nur selbst Erfasstes prüfen (R2-E2).
    let sollVorGezaehlt: Erfassungsbogen | null = null;
    if (!sig) {
      const frei = await sollstaerkeFreigeben(b);
      if (!frei) return;
      if (frei !== b) sollVorGezaehlt = b;
      b = frei;
      if (!(await ortFreigeben(b))) return;
    }
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
    if (sollVorGezaehlt) gezaehltWegMerken({ einsatzId: zielId, eintragId: bogenInhaltsId(b), name: einheitAnzeigename(b.einheit), soll: sollVorGezaehlt });
    einsatzWahlDialog.current?.close();
    if (eigener) return;
    setBogen(null);
    setFremdeErfassung(false);
    setVorlageInBearbeitung(null);
    setzeEmpfang(null);
    setSchritt(0);
  }

  /**
   * Vor dem Ablegen eines selbst erfassten Bogens ohne Ort der Einheit (R14-E7): Ein leerer Bogen stand mit „1 zählend"
   * als Einheit ohne Namen in der Lage. Die Rückfrage nennt die offenen Punkte, wie „Bogen übergeben…" es tut.
   * Rückgabe: true = ablegen; false = abgebrochen oder zum Feld gesprungen.
   */
  async function ortFreigeben(b: Erfassungsbogen): Promise<boolean> {
    if (einheitOrt(b.einheit) || b.einheit.standortRef != null) return true;
    const punkte = pruefpunkte(b, true, heuteDatum()).map((p) => lueckeKurz(p.text));
    const wahl = await frageWahl({
      titel: "Ort der Einheit fehlt",
      text: `Ohne Ort stünde die Einheit namenlos in der Lage. Offene Punkte (${punkte.length}): ${punkte.join(", ")}.`,
      wege: [
        { wert: "eintragen", label: "Ort eintragen" },
        { wert: "trotzdem", label: "Trotzdem ablegen", gefahr: true },
      ],
    });
    if (wahl === "eintragen") {
      einsatzWahlDialog.current?.close();
      if (schritt !== 0) geheZuFeld(0, "feld-einheit-name");
      else {
        const feld = document.getElementById("feld-einheit-name");
        feld?.scrollIntoView?.({ block: "center" });
        feld?.focus({ preventScroll: true });
      }
    }
    return wahl === "trotzdem";
  }

  /**
   * Vor dem Ablegen eines selbst erfassten Bogens: Besteht die Stärke nur aus
   * unbenannten Sollplätzen, hat niemand die Einheit gezählt. „In Einsatz
   * übernehmen" steht auf jedem Schritt — auf Schritt 1 übernommen, stand die
   * StAN-Sollstärke ungefragt als Meldung in der Lage (Audit Runde 2, R2-E2).
   * Rückgabe: true = ablegen, false = nicht (abgebrochen oder zum Eintragen
   * in den Personal-Schritt gesprungen).
   */
  async function sollstaerkeFreigeben(b: Erfassungsbogen): Promise<Erfassungsbogen | null> {
    if (!nurSollstaerke(b)) return b;
    const s = staerke(b);
    // „Nur Stärke" mit den unveränderten Zahlen der Vorbelegung (R7-A1): dieselbe Rückfrage,
    // dazu der Weg „Zahlen stimmen" für eine Einheit, die wirklich in Sollstärke kommt.
    const nurZahl = b.personalErfassung === PersonalErfassung.NUR_STAERKE;
    const wahl = await frageWahl({
      titel: "Nur Sollplätze, keine gemeldete Stärke",
      text: nurZahl
        ? `Für „${einheitAnzeigename(b.einheit)}" stehen noch die Zahlen der Vorbelegung (Soll: ${s.fuehrer} / ${s.unterfuehrer} / ${s.mannschaft} / ${s.gesamt}${b.fahrzeuge.length ? `, ${b.fahrzeuge.length} Fahrzeug${b.fahrzeuge.length === 1 ? "" : "e"}` : ""}) — niemand hat gezählt.`
        : `Für „${einheitAnzeigename(b.einheit)}" stehen nur die Sollplätze nach StAN (Stärke ${s.fuehrer} / ${s.unterfuehrer} / ${s.mannschaft} / ${s.gesamt}${b.fahrzeuge.length ? `, ${b.fahrzeuge.length} Fahrzeug${b.fahrzeuge.length === 1 ? "" : "e"}` : ""}) — niemand hat Personen eingetragen.`,
      wege: [
        // Je Antwort ein Satz unter dem Knopf statt einer Liste davor (R18-S4): Wer in Sekunden entscheidet, liest die Knöpfe.
        { wert: "eintragen", label: "Stärke jetzt eintragen", kurz: "Springt zum Personal." },
        { wert: "soll", label: "Als Sollstärke ablegen", kurz: "Zählt nur als Sollwert, nicht als gemeldet." },
        // Zuletzt und als Wahl mit Gewicht: Sie macht erfundene Zahlen zur Meldung; danach quittiert die Sammlung mit „Rückgängig" (R16-S3).
        ...(nurZahl
          ? [
              {
                wert: "gezaehlt",
                label: "Zahlen stimmen, so gezählt",
                kurz: "Die Einheit hat genau diese Zahlen gemeldet; „Rückgängig“ geht danach.",
                gefahr: true,
              },
            ]
          : []),
      ],
    });
    if (wahl === "eintragen") {
      einsatzWahlDialog.current?.close();
      setOffenerEinsatzId(null);
      setZeigeStart(false);
      setSchritt(2);
    }
    if (wahl === "gezaehlt") {
      // Die Zahl ist jetzt die Angabe: Vorbelegte Sollkarten und -fahrzeuge zählen nicht mit.
      return { ...b, personal: b.personal.filter((p) => !personUnbenannt(p)), fahrzeuge: b.fahrzeuge.filter((f) => !fahrzeugUnbenannt(f)) };
    }
    return wahl === "soll" ? b : null;
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
    let b = bogen;
    // Ohne Namen keine Meldung: Ein Tipp direkt nach dem Öffnen legte eine
    // Einheit „THW" mit Stärke 0 in die Lage, die sich niemandem zuordnen
    // ließ (Audit Runde 3, R3-E3, R3-G3). Gesperrt wird nur hier — im
    // eigenen Bogen darf der Name weiter offen bleiben.
    if (!einheitOrt(b.einheit) && b.einheit.standortRef == null) {
      await zeigeHinweis({
        titel: "Ort der Einheit fehlt",
        text: "Ohne Ort lässt sich die Meldung keiner Einheit zuordnen — in der Lage stünde nur die Organisation. Bitte zuerst den Ort der Einheit eintragen.",
        ok: "Zum Feld „Ort der Einheit“",
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
    // Fahrzeuge und Sofortbedarf noch nicht bearbeitet: einmal je Erfassung nachfragen, nicht den Abschluss unter
    // dem Daumen 16 px über „Weiter →" verstecken (R15-S4).
    if (folgeFrageFuer.current !== (erfassungBeginn ?? -1)) {
      if (!(await (await import("./folgeschritte")).folgeschrittFrage(b, schritt))) return;
      folgeFrageFuer.current = erfassungBeginn ?? -1;
    }
    // „Nr. laut Zettel“: eine ganze Zahl ab 1, nicht schon an eine andere Einheit vergeben (R5-A4). Vor allen Rückfragen zur Stärke: Die Übernahme scheitert sonst nach einer schon beschlossenen Stärke trotzdem (R10-E4).
    let zettelNr: number | undefined;
    if (nachNummer.trim() !== "") {
      const n = Number(nachNummer.trim());
      if (!Number.isInteger(n) || n < 1) {
        await zeigeHinweis({ titel: "Nr. laut Zettel", text: "Bitte eine ganze Zahl ab 1 eintragen oder das Feld leer lassen — dann vergibt die App die Nummer." });
        return;
      }
      const sammlung = einsaetzeLaden().find((s) => s.id === ziel);
      const belegt = sammlung ? [...meldungsNummern(sammlung.eintraege)].find(([schl, nr]) => nr === n && schl !== einheitSchluessel(b.einheit)) : undefined;
      if (belegt) {
        const wer = sammlung!.eintraege.find((e) => e.einheitSchluessel === belegt[0]);
        await zeigeHinweis({
          titel: "Nr. schon vergeben",
          text: `Nr. ${n} gehört schon ${wer ? `„${einheitAnzeigename(wer.bogen.einheit)}“` : "einer anderen Einheit"}. Eine andere Nummer eintragen oder das Feld leer lassen.`,
        });
        return;
      }
      zettelNr = n;
    }
    let sollVorGezaehlt: Erfassungsbogen | null = null;
    {
      const frei = await sollstaerkeFreigeben(b);
      if (!frei) return;
      if (frei !== b) {
        sollVorGezaehlt = b;
        b = frei;
        setBogen(frei); // „so gezählt": der offene Bogen trägt danach nur noch die Zahlen
      }
    }
    if (!(await staerkeFreigeben(b))) return;
    // Dieselbe Zahlendreher-Frage wie bei „Stärke ändern…", bevor die Einheit in die Lage zählt:
    // Mannschaft „99" statt „9" ging ohne Rückfrage durch (Audit Runde 6, R6-E6).
    {
      const warnungen = staerkePlausibilitaet(staerke(b));
      if (warnungen.length > 0 && !nurSollstaerke(b)) {
        const ja = await frageJaNein({
          titel: "Stimmt die Stärke?",
          text: (
            <>
              <p>Stärke {staerkeKurz(b)}</p>
              <ul>
                {warnungen.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </>
          ),
          ok: "Ja, so übernehmen",
          abbruch: "Zahlen korrigieren",
          fokus: "abbruch", // Enter ersetzt sonst die Zahlen (R9-D4)
        });
        if (!ja) {
          setSchritt(2);
          return;
        }
      }
    }
    let zeit: number | null = null;
    const gelesen = eintreffzeitPruefen(nachEintreffzeit);
    if (gelesen.art === "zeit") zeit = gelesen.zeit;
    else if (gelesen.art === "frage") {
      // Zukunft, und gestern läge fast einen Tag zurück: wie an der Karte
      // fragen statt still auf gestern zu legen (Audit Runde 4, R4-E3).
      const wahl = await frageWahl({
        titel: "Stimmt die Zeit?",
        text: `„Eingetroffen um" ${nachEintreffzeit} liegt in der Zukunft — Stunde oder Tag vertauscht? Jetzt ist es ${zeitKurz(Date.now())} Uhr.`,
        // Der sichere Weg steht vorn und ist hervorgehoben: Der dunkle erste
        // Knopf war „Heute 21:12", genau die Zeit, die der Text eben als
        // unmöglich bezeichnet hatte (R5-E5). Bei einem Stundendreher stimmt
        // weder „Heute" noch „Gestern".
        wege: [
          { wert: "korrigieren", label: "Zeit korrigieren", hinweis: "Das Feld „Eingetroffen um“ bleibt offen, der Wert steht zum Ändern darin." },
          { wert: "heute", label: `Trotzdem heute ${zeitLang(gelesen.heute)}` },
          { wert: "gestern", label: `Gestern ${zeitLang(gelesen.gestern)}` },
        ],
      });
      if (!wahl || wahl === "korrigieren") return; // Das Feld bleibt, der Wert steht zum Korrigieren drin.
      zeit = wahl === "gestern" ? gelesen.gestern : gelesen.heute;
    }
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
    // „Abgerückt um“ vom Meldeblock: prüfen, bevor etwas abgelegt wird (R13-A1).
    const abWahl = abrueckzeitVomZettel(nachAbgerueckt, zeit);
    if (abWahl.art === "fehler") {
      await zeigeHinweis({ titel: "Abgerückt um", text: abWahl.text });
      return;
    }
    setMeldung("");
    const vorherDa = new Set(einsaetzeLaden().find((s) => s.id === ziel)?.eintraege.map((e) => e.id));
    // Manuell erfasster Bogen ist kein signierter Transport.
    const ok = await bogenInSammlung(ziel, b, "manuell", undefined, false, eigenerBogenWartetHinweis());
    if (!ok) {
      // Voller Speicher: die Meldung stand oberhalb des Bildschirms, am Knopf
      // geschah nichts Sichtbares. Ein Dialog nennt die Zahl, die sich sonst
      // nirgends mehr findet (Audit Runde 6, R6-E2).
      if (ablageFehler.current) {
        await zeigeHinweis({
          titel: "Nicht übernommen",
          text: (
            <>
              <p>{ablageFehler.current}</p>
              <p>
                <strong>
                  „{einheitAnzeigename(b.einheit) || "Einheit"}“, {nurSollstaerke(b) ? "Sollstärke" : "Stärke"} {staerkeKurz(b)}
                  {nurSollstaerke(b) ? " (nur Sollplätze, nicht gezählt)" : ""}: bitte auf dem Meldeblock notieren, Platz schaffen und
                  dann noch einmal übernehmen. Die Eingaben bleiben stehen.
                </strong>
              </p>
            </>
          ),
        });
      }
      return;
    }
    if (sollVorGezaehlt) gezaehltWegMerken({ einsatzId: ziel, eintragId: bogenInhaltsId(b), name: einheitAnzeigename(b.einheit), soll: sollVorGezaehlt });
    // Uhrzeit vom Blatt an die NEUE Einheit (R2-A5). Eine Folgemeldung erbt
    // die Eintreffzeit ihrer Vorgängerin, die bleibt maßgeblich.
    {
      const eintraege = einsaetzeLaden().find((s) => s.id === ziel)?.eintraege ?? [];
      const neu = eintraege.find((e) => e.id === bogenInhaltsId(b) && !vorherDa.has(e.id));
      if (neu && eintraege.filter((e) => e.einheitSchluessel === neu.einheitSchluessel).length === 1) {
        if (zeit != null) eintreffzeitSetzen(ziel, neu.id, zeit);
        if (zettelNr != null || nachZug.trim() !== "") nummerUndZugSetzen(ziel, neu.id, { nummer: zettelNr, zug: nachZug });
        // Auf dem Meldeblock schon abgerückt: gleich mit dieser Zeit abgerückt anlegen, nicht in die Summen (R13-A1).
        if (abWahl.art === "zeit") statusMitZeitSetzen(ziel, neu.id, MeldeStatus.ABGERUECKT, abWahl.zeit, abWahl.zeit);
        einsaetzeNeuLaden();
        // Ohne Nr. vom Zettel: sagen, welche die App vergeben hat — sie gehört auf den Zettel,
        // sonst laufen Papier und Gerät in zwei Nummernreihen (R5-A4).
        if (zettelNr == null) {
          const nr = meldungsNummern(einsaetzeLaden().find((s) => s.id === ziel)?.eintraege ?? []).get(neu.einheitSchluessel);
          if (nr != null) setMeldung(`„${einheitAnzeigename(b.einheit)}“ hat Nr. ${nr} — die Nummer auf dem Zettel eintragen.`);
        }
      }
    }
    setNachEintreffzeit("");
    setNachAbgerueckt("");
    setNachNummer("");
    setNachZug("");
    setSammelZiel(null);
    setErfassungBeginn(null);
    setBogen(null);
    setFremdeErfassung(false);
    setVorlageInBearbeitung(null);
    setzeEmpfang(null);
    setSchritt(0);
    // Die Sammlung öffnet oben (Name, Kacheln, „Zuletzt abgelegt"), nicht dort, wo der Knopf des Assistenten stand (R10-N5).
    setTimeout(() => {
      try {
        window.scrollTo(0, 0);
      } catch {
        /* Testumgebung ohne Layout */
      }
    }, 0);
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

  async function manuellInEinsatz(zielId: string, schnell = false) {
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
    setNachAbgerueckt("");
    setNachNummer("");
    setNachZug("");
    setSammelZiel(zielId);
    setOffenerEinsatzId(null); // Assistent übernimmt die Ansicht
    setMeldung("");
    // Jeder der beiden Knöpfe öffnet seinen eigenen Weg: „Einheit manuell erfassen…" immer das volle Formular,
    // „Einheit schnell erfassen (nur Stärke)…" immer die Schnellerfassung. Früher erbte der erste Knopf den
    // Modus der zuletzt erfassten Einheit (R2-S2) und öffnete dauerhaft als Schnellerfassung (R17-S3).
    setBogen(schnell ? schnellerfassungsBogen() : neuerBogen());
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
      // Zwei Sammlungen gleichen Namens sind sonst nur an der Anlagezeit zu unterscheiden (R11-D5).
      hinweis: `${ART_LABEL[s.art]}${s.ort ? ` · ${s.ort}` : ""} · ${einheitenZahl(aktuelleMeldungen(s.eintraege, s.art).length)} anwesend${
        sammlungen.some((x) => x.id !== s.id && x.name.trim().toLowerCase() === s.name.trim().toLowerCase()) ? ` · angelegt ${zeitLang(s.angelegt)}` : ""
      }`,
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
    return dateinameTeil(s.name || "einsatz");
  }

  /**
   * Nach einem gelungenen Export in diesem Format: alles, was jetzt in der
   * Sammlung steht, ist in diesem Format hinausgegangen — beim nächsten „nur
   * neue Bögen" DES FORMATS zählt es nicht mehr mit. Die anderen Formate und die
   * Weitergabe an die Ablösung bleiben unberührt (R4-W2). Ein abgebrochenes
   * Share-Sheet kommt hier nicht an (siehe Aufrufer).
   */
  function exportVerbuchen(s: Einsatzsammlung, ziel: ExportZiel) {
    const vorhanden = [...einsaetzeLaden(), ...einsaetzePapierkorb()].map((x) => x.id);
    const stand = exportVermerken(s, ziel, vorhanden);
    setExportStaende((alt) => ({ ...alt, [ziel]: stand }));
  }

  async function exportiereEinsatz(s: Einsatzsammlung) {
    await dateiAnbieten(`eeb-einsatz-${einsatzDateiname(s)}.json`, einsatzDateiInhalt(s, undefined, lageAngabenLaden(s.id)), "application/json");
  }

  /**
   * Der Namensteil der Lieferung, für alle Formate gleich (R5-W8): ein Nachtrag
   * trägt `nachtrag-seit-<Zeitpunkt>-` im Namen — zwei gleichnamige Dateien
   * überschrieben sich im Download-Ordner (R4-W4) —, „nur neue" ohne Bezugspunkt
   * ist die ganze Lage und heißt `erste-lieferung-`, die Gesamtdatei trägt nichts.
   */
  function nachtragMarke(umfang: ExportUmfang, ziel: ExportZiel): string {
    return lieferungsMarke(umfang, exportStaende[ziel]);
  }

  /**
   * Ein Einsatz ohne Einheit liefert nur leere Dateien. Die Weitergabe meldete dann „Seit dem letzten Sammel-PDF …
   * nichts geändert", als gäbe es ein früheres PDF (R12-E5); jetzt sagen alle Ausgaben, was Sache ist.
   */
  function leererEinsatz(s: Einsatzsammlung, blockieren = false): boolean {
    if (!einsatzLeer(s)) return false;
    // Die Weitergabe hat ohne Einheit nichts zu sichern; die Tabellenformate liefern weiter (leere) Dateien, sagen es aber.
    setAusgabeQuittung(blockieren ? LEERER_EINSATZ_TEXT : LEERE_DATEI_TEXT);
    return blockieren;
  }

  /** Quittung einer Tabellendatei: Name und Ablageort, damit am Telefon klar ist, welche Datei an den Stab geht (R18-A4). */
  function dateiQuittungText(name: string, s: Einsatzsammlung): string {
    return `✓ Gespeichert: ${name} — im Download-Ordner bzw. über das Teilen-Menü abgelegt.${einsatzLeer(s) ? ` ${LEERE_DATEI_TEXT}` : ""}`;
  }

  async function exportiereEinsatzCsv(s: Einsatzsammlung, umfang: ExportUmfang) {
    setAusgabeQuittung(null);
    leererEinsatz(s);
    const teil = exportSammlung(s, umfang, exportStaende.csv ?? null);
    const marke = nachtragMarke(umfang, "csv");
    // Erst beim Klick geladen: der CSV-Schreiber gehört nicht ins Startbündel.
    const { einsatzCsvInhalt } = await import("./einsatz-csv");
    const name = ausgabeDateiname(artMitMarke("einsatz", marke), einsatzDateiname(s), "csv");
    const ok = await dateiAnbieten(name, einsatzCsvInhalt(teil, meldungsNummern(s.eintraege), undefined, s.eintraege), "text/csv;charset=utf-8");
    if (ok) {
      exportVerbuchen(s, "csv");
      setAusgabeQuittung(dateiQuittungText(name, s));
    }
  }

  async function exportiereEinsatzCsvDetail(s: Einsatzsammlung, umfang: ExportUmfang) {
    setAusgabeQuittung(null);
    leererEinsatz(s);
    const teil = exportSammlung(s, umfang, exportStaende["csv-detail"] ?? null);
    const name = ausgabeDateiname(artMitMarke("einsatz-alle-daten", nachtragMarke(umfang, "csv-detail")), einsatzDateiname(s), "csv");
    const ok = await dateiAnbieten(name, einsatzDetailCsvInhalt(teil, meldungsNummern(s.eintraege), s.eintraege), "text/csv;charset=utf-8");
    if (ok) {
      exportVerbuchen(s, "csv-detail");
      setAusgabeQuittung(dateiQuittungText(name, s));
    }
  }

  /**
   * Einheitenliste im Fremdformat der Führungsstelle. Dynamisch geladen: der
   * XLSX-Schreiber samt Stiltabelle wird nur beim Klick gebraucht (wie die PDF).
   */
  async function exportiereEinsatzOldenburg(s: Einsatzsammlung, umfang: ExportUmfang) {
    setAusgabeQuittung(null);
    leererEinsatz(s);
    const teil = exportSammlung(s, umfang, exportStaende.xlsx ?? null);
    try {
      const { XLSX_MIME, einsatzOldenburgXlsx } = await import("./oldenburg-xlsx");
      const name = ausgabeDateiname(artMitMarke("einsatz-oldenburg", nachtragMarke(umfang, "xlsx")), einsatzDateiname(s), "xlsx");
      const ok = await bytesAlsDatei(name, einsatzOldenburgXlsx(teil, s.eintraege), XLSX_MIME);
      if (ok) {
        exportVerbuchen(s, "xlsx");
        setAusgabeQuittung(dateiQuittungText(name, s));
      }
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
  async function sammelPdf(s: Einsatzsammlung, umfang: ExportUmfang, weitergabe = false) {
    setFehler("");
    setAusgabeQuittung(null);
    if (leererEinsatz(s, true)) return;
    const teil = exportSammlung(s, umfang, exportStaende.pdf ?? null);
    if (teil.eintraege.length === 0) {
      setFehler("Seit dem letzten Sammel-PDF ist kein Bogen neu dazugekommen und nichts geändert.");
      return;
    }
    // Sperre und „wird erzeugt…" für alle PDF-Wege gemeinsam (arbeitet.ts, R5-O3).
    await arbeiten(weitergabe ? "weitergeben" : "sammel-pdf", async () => {
      try {
        // Dynamisch: pdfmake samt eingebetteter Schriften bleibt aus dem
        // Start-Bundle heraus und wird erst beim ersten PDF geladen.
        const { einsatzPdfErzeugen } = await import("./pdf");
        const stand = umfang === "neue" ? exportStaende.pdf : undefined;
        const ok = await einsatzPdfErzeugen(teil, undefined, s.eintraege, stand?.zeitpunkt, weitergabe ? "" : nachtragMarke(umfang, "pdf"));
        if (!ok) return; // Share-Sheet abgebrochen — nichts übergeben
        // „Einsatz weitergeben / sichern" geht an die Ablösung oder ins Archiv,
        // nicht an den Stab: Es hat seinen eigenen Stand (pdf.ts) und verbraucht
        // den Nachtrag-Bezugspunkt nicht (R4-W2).
        if (!weitergabe) exportVerbuchen(s, "pdf");
        // Die Bestätigung steht direkt unter den Knöpfen (R5-L4), nicht am Seitenende.
        setAusgabeQuittung(
          umfang === "neue"
            ? `✓ Neue Bögen aus „${s.name}" als PDF gespeichert (Download-Ordner bzw. Teilen-Menü). Ob sie angekommen ist, weiß das Gerät nicht.`
            : `✓ Einsatz „${s.name}" als PDF gespeichert (Download-Ordner bzw. Teilen-Menü). Ob sie angekommen ist, weiß das Gerät nicht.`,
        );
      } catch (e) {
        setFehler(`Einsatz weitergeben: ${fehlerText(e)}`);
      }
    });
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

  async function lageblatt(s: Einsatzsammlung) {
    setFehler("");
    setAusgabeQuittung(null);
    const leer = einsatzLeer(s);
    await arbeiten("lageblatt", async () => {
      try {
        const { einsatzLageblattErzeugen } = await import("./pdf");
        if (await einsatzLageblattErzeugen(s)) {
          setAusgabeQuittung(
            `✓ Lageblatt erzeugt (A4 quer) — liegt im Download-Ordner bzw. wurde über das Teilen-Menü abgelegt.${leer ? ` ${LEERE_DATEI_TEXT}` : ""}`,
          );
        }
      } catch (e) {
        setFehler(`Lageblatt: ${fehlerText(e)}`);
      }
    });
  }

  /**
   * Bögen aus einer Datei lesen — für die Aufnahme in einen Einsatz. Bei einer
   * PDF zuerst die eingebetteten Daten, ersatzweise die QR-Codes darin (der
   * Rückfallweg, siehe {@link ladePdfQr}); sonst JSON. Der Signaturstatus
   * reist beim QR-Weg mit, damit der Meldekopf die fremde Meldung später mit
   * erhaltener Original-Signatur weiterreichen kann.
   */
  async function boegenAusDatei(datei: File, abgelehnt?: string[]): Promise<QrBogen[]> {
    const ohneNachweis = (boegen: Erfassungsbogen[]): QrBogen[] =>
      boegen.map((bogen) => ({ bogen, signatur: { zustand: "unsigniert" } as SignaturStatus, herkunft: null }));
    if (!istPdfDatei(datei)) {
      // Nur echte Bögen weiterreichen: Vorher wanderte jedes JSON-Objekt als
      // „Bogen" weiter — eine Sicherung fragte dann „1 Bogen gefunden, Einsatz
      // anlegen?". Was keiner ist, erklärt dateiFehlerMeldung (R2-E5).
      const gelesen = boegenAusJsonTextMitUrsachen(await datei.text());
      // Unvollständige Bögen werden mit Ursache abgelehnt, nicht still verworfen
      // und nicht in die App gelassen, wo sie die Ansicht zum Absturz brächten (R5-E1).
      if (gelesen.boegen.length === 0) {
        throw new Error(
          gelesen.abgelehnt.length > 0
            ? `In der Datei ist kein Bogen lesbar — ${ablehnungsSatz(gelesen.abgelehnt, gelesen.gesamt)}`
            : "In der Datei steht kein lesbarer Erfassungsbogen.",
        );
      }
      if (gelesen.abgelehnt.length > 0) abgelehnt?.push(ablehnungsSatz(gelesen.abgelehnt, gelesen.gesamt));
      return ohneNachweis(gelesen.boegen);
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
  function boegenAufnehmen(
    zielId: string,
    gefunden: QrBogen[],
    vomPapier = false,
  ): { neu: number; uebersprungen: number; speicherVoll: number; neueIds: string[] } {
    let neu = 0;
    let uebersprungen = 0;
    // Bögen, die am vollen Speicher scheiterten — kein „kaputter Bogen" und
    // kein „nichts gefunden" (Audit Runde 3, R3-O1).
    let speicherVoll = 0;
    const neueIds: string[] = [];
    for (const { bogen: b, signatur, herkunft } of gefunden) {
      if (speicherVoll > 0) {
        // Ist der Speicher einmal voll, scheitert jeder weitere Bogen genauso;
        // gezählt wird er trotzdem, damit die Meldung die Zahl nennt.
        speicherVoll++;
        continue;
      }
      try {
        const r = meldungAufnehmen(zielId, b, {
          quelle: "pdf-import",
          signatur: alsEintragSignatur(signatur),
          herkunft: herkunft ? base64UrlKodieren(herkunft) : undefined,
        });
        if (r) r.neu ? neu++ : uebersprungen++;
        if (r?.neu) neueIds.push(r.eintrag.id);
      } catch (e) {
        if (istSpeicherVoll(e)) speicherVoll++;
        /* sonst: ungültiger Bogen — überspringen */
      }
    }
    // Vom Papier: Karten tragen „vom Papier, Zeiten prüfen", bis der Abgleich
    // bestätigt ist (R3-A2). Ein voller Speicher darf die Aufnahme nicht kippen.
    if (vomPapier) {
      try {
        vomPapierMarkieren(zielId, neueIds);
      } catch {
        /* Markierung ist Komfort */
      }
    }
    return { neu, uebersprungen, speicherVoll, neueIds };
  }

  /**
   * Bögen aus JSON-/PDF-Dateien in den offenen Einsatz aufnehmen (Bulk, mit
   * Dedupe). Mehrere Dateien auf einmal, weil der Einlese-Knopf sie gemeinsam
   * anbietet: eine Meldung über den ganzen Stapel liest sich besser als eine je
   * Datei, und eine kaputte Datei darf die übrigen nicht abbrechen — sie wird
   * mit Namen an die Meldung gehängt.
   */
  /**
   * „Bögen einlesen…" mit Dateien und Bildern: eine gemeinsame Rückmeldung
   * je Stapel (Audit Runde 3, R3-E4). Bisher liefen beide Wege nebeneinander;
   * der Bilderweg leerte Fehler und Meldung des Dateiwegs, und dessen
   * Fehlerzeile verdrängte die Erfolgsmeldung.
   */
  async function importiereStapel(zielId: string, daten: File[], bilder: File[]) {
    setEinlese(null);
    setStapelBericht([]);
    setFehler("");
    setMeldung("");
    // Spur für den Fall, dass die Seite mitten im Stapel neu lädt: Der Einsatz sagt es beim Wiederöffnen (R15-S1).
    const spur = await import("./import-unterbrochen");
    spur.importBeginnt(zielId, daten.length + bilder.length, einsaetzeLaden().find((x) => x.id === zielId)?.eintraege.length ?? 0);
    try {
      const d = daten.length > 0 ? await importiereBoegen(zielId, daten, bilder.length > 0) : undefined;
      if (bilder.length > 0) {
        await importiereQrBilder(zielId, bilder, d);
        return;
      }
      setEinlese(d ? { fehler: d.fehler, meldung: d.meldung } : { fehler: "In der Auswahl sind keine Bilddateien.", meldung: "" });
    } finally {
      spur.importEndet();
    }
  }

  /** Folgemeldungen aufgeteilter Einheiten im Stapel: die abgeteilten Personen stehen doppelt (R14-D2). */
  function doppeltImStapel(zielId: string, vorher: MeldeEintrag[], neueIds: string[]): string[] {
    return abgeteiltDoppeltImStapel(vorher, einsaetzeLaden().find((x) => x.id === zielId)?.eintraege ?? [], neueIds);
  }

  /** Satz zu den eben aufgenommenen Bögen, die wegen der Datenschutzfrist ohne Namen ankamen (R11-A1); sonst leer. */
  function anonymImStapel(zielId: string, neueIds: string[]): string[] {
    if (neueIds.length === 0) return [];
    const ids = new Set(neueIds);
    const eintraege = (einsaetzeLaden().find((x) => x.id === zielId)?.eintraege ?? []).filter((e) => ids.has(e.id));
    const satz = anonymQuittung(eintraege, datenschutzZeitpunkt());
    // Stand nach dem Eingang: eine falsche Geräteuhr schreibt alle Zeiten falsch (R13-A3). Gleiche Stelle der Quittung.
    const uhr = standNachEintreffenQuittung(eintraege);
    // Daten und Signatur passen nicht zusammen: nicht still mit Haken durch den Stapel (R15-E1).
    const ungueltig = eintraege.filter((e) => e.signatur?.zustand === "ungueltig");
    const sig = ungueltig.length ? `⚠ Signatur ungültig: ${ungueltig.map((e) => `„${einheitAnzeigename(e.bogen.einheit)}"`).join(", ")} — beim Absender prüfen.` : "";
    return [...(satz ? [satz] : []), ...(uhr ? [uhr] : []), ...(sig ? [sig] : [])];
  }

  async function importiereBoegen(zielId: string, dateien: File[], mitBildern = false): Promise<DateiAnteil & { fehler: string; meldung: string }> {
    let neu = 0;
    let uebersprungen = 0;
    let speicherVoll = 0;
    // Dateiname und Satz je Fehler: gleiche Sätze erscheinen gebündelt mit Zahl und Namen (R17-G13).
    const kaputt: DateiFehler[] = [];
    const zusatz = { sammlungInPdf: false, lage: false }; // R2-A1
    const sammlungenUebernommen: string[] = []; // R3-W3
    // Stand vor dem Stapel und die neu abgelegten Bögen — für die Frage,
    // welche Fassung gilt (R4-W1).
    const vorher = einsaetzeLaden().find((x) => x.id === zielId)?.eintraege ?? [];
    const neueIds: string[] = [];
    for (const datei of dateien) {
      try {
        const bytes = istPdfDatei(datei) ? new Uint8Array(await datei.arrayBuffer()) : null;
        // Lageblatt oder Blanko als PDF: kein Bogen darin, sagt es und nennt den Weg über die Sammel-PDF (R11-A3).
        const nurLesen = bytes ? leseausgabeMeldung(bytes, datei.name) : null;
        if (nurLesen) {
          kaputt.push({ datei: datei.name, text: nurLesen });
          continue;
        }
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
        const abgelehnt: string[] = [];
        const r = boegenAufnehmen(zielId, await boegenAusDatei(datei, abgelehnt), art === "nur-qr");
        for (const satz of abgelehnt) kaputt.push({ datei: datei.name, text: satz, nameVorn: true });
        neu += r.neu;
        uebersprungen += r.uebersprungen;
        speicherVoll += r.speicherVoll;
        neueIds.push(...r.neueIds);
      } catch (e) {
        // Je Datei ein ganzer Satz mit Ursache und nächstem Schritt statt
        // Parser-Text in Klammern (Audit Runde 2, R2-E5).
        kaputt.push({ datei: datei.name, text: await dateiFehlerMeldung(datei, e, "boegen") });
      }
    }
    einsaetzeNeuLaden();
    const vorrang = await vorrangImStapel(zielId, vorher, neueIds);
    // Nur im Fehlerfall nachgeladen: Das Bündeln gehört nicht ins Startbündel.
    const gebuendelt = kaputt.length > 0 ? (await import("./fehler-buendeln")).fehlerZeilenBuendeln(kaputt) : [];
    const fehlerZeilen = [speicherVollMeldung(speicherVoll), ...gebuendelt].filter(Boolean);
    const bogenMeldung =
      neu + uebersprungen === 0
        ? kaputt.length > 0 || sammlungenUebernommen.length > 0 || speicherVoll > 0
          ? ""
          : "Keine Bögen in der Datei gefunden — weder eingebettete Daten noch ein lesbarer QR-Code."
        : dateiImportMeldung(neu, uebersprungen, zusatz);
    // Für den gemeinsamen Bericht mit Bildern: nur, was die Zahl nicht sagt.
    const aehnlich = aehnlichImStapel(zielId, vorher, neueIds);
    // Bögen mit Stand über der Datenschutzfrist: ohne Namen angekommen, das Papier trägt sie (R11-A1).
    const anonym = anonymImStapel(zielId, neueIds);
    // Folgemeldung einer aufgeteilten Einheit: abgeteilte Personen stehen doppelt (R14-D2).
    const doppelt = doppeltImStapel(zielId, vorher, neueIds);
    const hinweise = [
      ...sammlungenUebernommen,
      ...vorrang,
      ...aehnlich,
      ...anonym,
      ...doppelt,
      eintreffzeitStapelHinweis(neu),
      zusatz.sammlungInPdf ? SAMMLUNG_IN_PDF_HINWEIS : zusatz.lage && neu > 0 ? LAGE_NACHTRAGEN_HINWEIS : "",
    ].filter(Boolean);
    return {
      anzahl: dateien.length,
      neu,
      uebersprungen,
      zeilen: [...fehlerZeilen, ...hinweise],
      fehler: fehlerZeilen.join(" "),
      // Die mögliche Doppelung gehört in die sichtbare Quittung, nicht nur in die Zeilen des Berichts (R7-N1).
      meldung: [...sammlungenUebernommen, bogenMeldung, ...anonym, ...doppelt, eintreffzeitStapelHinweis(neu), ...vorrang, ...(mitBildern ? [] : aehnlich)].filter(Boolean).join(" "),
    };
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
      // Heißt die Sammlung wie die Lage hier (zwei Meldeköpfe derselben Lage), ist
      // ihr Name kein Zug: Albstadt und Radolfzell bekämen sonst „Hochwasser Eyach
      // 10/2026" als Schein-Zug, und die Zwischensummen nach Zug stimmten nicht
      // mehr. Dann steht „ohne Zug-Zuordnung" vorn (R4-W8).
      const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
      const gleicheLage = norm(zug) === norm(ziel.name) || norm(ziel.name).includes(norm(zug)) || norm(zug).includes(norm(ziel.name));
      const mitZug = {
        wert: "mit-zug",
        label: `Übernehmen, Zug „${zug}“`,
        hinweis: "Einheiten ohne Zug bekommen diesen Zug. Später an der Karte änderbar.",
      };
      const ohneZug = {
        wert: "ohne-zug",
        label: "Übernehmen ohne Zug-Zuordnung",
        ...(gleicheLage ? { hinweis: "Die Sammlung heißt wie diese Lage — ihr Name ist vermutlich kein Zug." } : {}),
      };
      const wahl = await frageWahl({
        titel: "Sammel-PDF einer anderen Sammlung",
        text:
          `Die PDF enthält die Sammlung „${quelle.name}“ mit ${einheiten === 1 ? "1 Einheit" : `${einheiten} Einheiten`}. ` +
          `In „${ziel.name}“ übernehmen — mit Eintreffzeiten, Abrückvermerken, Auftrag und Siegel?`,
        wege: [
          ...(gleicheLage ? [ohneZug, mitZug] : [mitZug, ohneZug]),
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
    // Die Stände der Exporte reisen mit der Sammlung desselben Einsatzes (R5-W6);
    // bei einer fremden Sammlung gehören sie nicht hierher.
    const dateiStaende = quelle.exportStaende;
    delete quelle.exportStaende;
    const dateiLage = quelle.lageAngaben;
    delete quelle.lageAngaben;
    const eintraegeVorher = ziel.eintraege.map((e) => ({ ...e }));
    const geklaert = await entfernteImImportKlaeren(sammlung);
    const r = einsatzAbgleichen(geklaert.sammlung);
    if (quelle.id === zielId) exportStaendeUebernehmen(zielId, dateiStaende, [...einsaetzeLaden(), ...einsaetzePapierkorb()].map((x) => x.id));
    // Einsatzbeginn und Funkrufname des Monitors nur bei derselben Sammlung (R7-K5).
    const lageSatz = quelle.id === zielId ? lageAngabenUebernehmen(zielId, dateiLage, [...einsaetzeLaden(), ...einsaetzePapierkorb()].map((x) => x.id)) : "";
    const abgleich = abgleichText(r);
    const nummern = nummernWechselText(nummernWechsel(eintraegeVorher, einsaetzeLaden().find((x) => x.id === zielId)?.eintraege ?? []), einsaetzeLaden().find((x) => x.id === zielId)?.eintraege ?? []);
    return (
      (quelle.id === zielId
        ? `${r.hinzugefuegt} neue Meldung(en) ergänzt.`
        : `Sammlung „${quelle.name}“ in „${ziel.name}“ übernommen: ${r.hinzugefuegt} neue Meldung(en) mit Zeiten, Zug und Siegel.`) +
      (abgleich ? ` ${abgleich}` : "") +
      (nummern ? ` ${nummern}` : "") +
      (lageSatz ? ` ${lageSatz}` : "") +
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
    const nurQr = istPdfDatei(datei) && pdfInhaltArt(new Uint8Array(await datei.arrayBuffer())) === "nur-qr";
    const { neu, uebersprungen, speicherVoll } = boegenAufnehmen(s.id, gefunden, nurQr);
    einsaetzeNeuLaden();
    setFehler(speicherVollMeldung(speicherVoll));
    setMeldung(
      `Einsatz „${s.name}" angelegt — ` +
        (neu + uebersprungen > 0 ? dateiImportMeldung(neu, uebersprungen, { lage: true }) : "noch ohne Bogen."),
    );
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
  async function importiereQrBilder(zielId: string, dateien: File[], daten?: DateiAnteil & { fehler: string; meldung: string }) {
    const bilder = dateien.filter((d) => istBilddatei(d.name, d.type));
    if (bilder.length === 0) {
      setEinlese(daten ? { fehler: daten.fehler, meldung: daten.meldung } : { fehler: "In der Auswahl sind keine Bilddateien.", meldung: "" });
      return;
    }
    setFehler("");
    setMeldung("");
    setEinlese(null);
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
      let speicherVoll = 0;
      const neueIds: string[] = [];
      const vorher = einsaetzeLaden().find((x) => x.id === zielId)?.eintraege ?? []; // R4-W1
      for (const fund of erg.funde) {
        if (speicherVoll > 0) {
          speicherVoll++; // jeder weitere scheitert genauso (R3-O1)
          continue;
        }
        // Signatur wie beim Einzelscan prüfen und den Rohpayload mitspeichern —
        // sonst verlöre der Meldekopf beim Weiterreichen die fremde Signatur.
        const status = fund.payload ? await signaturVonPayload(fund.payload) : null;
        try {
          const r = meldungAufnehmen(zielId, fund.bogen, {
            quelle: "scan",
            signatur: status ? alsEintragSignatur(status) : undefined,
            herkunft: fund.payload ? base64UrlKodieren(fund.payload) : undefined,
          });
          if (r) r.neu ? neu++ : uebersprungen++;
          if (r?.neu) neueIds.push(r.eintrag.id);
        } catch (e) {
          // Bisher brach der erste volle Schreibversuch den Stapel ab, und
          // die schon aufgenommenen Bögen wurden nicht mehr gemeldet.
          if (!istSpeicherVoll(e)) throw e;
          speicherVoll++;
        }
      }
      try {
        vomPapierMarkieren(zielId, neueIds); // Abgleich vom Blatt anbieten (R3-A2)
      } catch {
        /* Markierung ist Komfort */
      }
      einsaetzeNeuLaden();
      const vorrang = await vorrangImStapel(zielId, vorher, neueIds);
      setStapelBericht([...stapelBerichtZeilen(erg, neu, uebersprungen, daten, neueIds.length > 0), ...anonymImStapel(zielId, neueIds), ...doppeltImStapel(zielId, vorher, neueIds), ...vorrang, ...aehnlichImStapel(zielId, vorher, neueIds), eintreffzeitStapelHinweis(neu)].filter(Boolean));
      const voll = speicherVollMeldung(speicherVoll);
      if (voll) setEinlese({ fehler: voll, meldung: "" });
    } catch (e) {
      setEinlese({ fehler: `Einlesen: ${fehlerText(e)}`, meldung: daten?.meldung ?? "" });
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
          // Findet sich keiner, gilt die Ursache der Sammlung (etwa „Einheitstyp fehlt").
          try {
            if (await boegenAlsNeuerEinsatz(datei)) return;
          } catch {
            /* die eigene Meldung unten */
          }
          throw err;
        }
      }
      // Ein Nachtrag („nur neue Bögen") ist nur ein Teil der Lage. Gibt es die
      // Sammlung hier noch nicht, entstünde eine Lage mit den paar Einheiten
      // des Nachtrags — das wird gesagt und gefragt (R4-W4). Der Zusatz wandert
      // nie in den Speicher.
      const nachtragSeit = s.nachtragSeit;
      delete s.nachtragSeit;
      // Die Stände der Exporte aus dem Umschlag (R5-W6): nach dem Import übernehmen.
      const dateiStaende = s.exportStaende;
      delete s.exportStaende;
      // Einsatzbeginn und Funkrufname des Monitors vom abgebenden Gerät (R7-K5).
      const dateiLage = s.lageAngaben;
      delete s.lageAngaben;
      // Unvollständige Bögen blieben draußen (R5-E1); der Satz kommt in die Quittung.
      const abgelehnt = abgelehnteBoegen(s);
      const abgelehntGesamt = s.eintraege.length + abgelehnt.length;
      // Zwei Meldeköpfe legen „Hochwasser Jagst" unabhängig an (es gibt offline
      // keine gemeinsame Kennung): Der Import fragt, ob die Datei zur vorhandenen
      // Sammlung gehört, statt still eine zweite gleichnamige anzulegen (R5-W2).
      const vorhandene = einsaetzeLaden();
      if (![...vorhandene, ...einsaetzePapierkorb()].some((x) => x.id === s.id)) {
        const gleichnamig = vorhandene
          .filter((x) => x.name.trim().toLowerCase() === s.name.trim().toLowerCase())
          .sort((a, b) => b.geaendert - a.geaendert)[0];
        if (gleichnamig) {
          const wahl = await frageWahl({
            titel: `Es gibt schon eine Sammlung „${gleichnamig.name}“`,
            text:
              `Die Datei enthält die Sammlung „${s.name}“ mit ${anzahlEinheiten(s.eintraege)}. Auf diesem Gerät gibt es schon eine gleichnamige ` +
              `(angelegt ${zeitLang(gleichnamig.angelegt)}, ${anzahlEinheiten(gleichnamig.eintraege)}) — vermutlich dieselbe Lage von einem zweiten Meldekopf. ` +
              "Zusammenführen oder getrennt halten?",
            wege: [
              {
                wert: "vorhanden",
                label: "In die vorhandene Sammlung übernehmen",
                hinweis: "Alle Einheiten in einer Sammlung, mit Zeiten, Abrückvermerken, Auftrag und Siegel. Laufende Nummern können sich dabei ändern.",
              },
              {
                wert: "eigene",
                label: "Als eigene Sammlung",
                hinweis: "Beide Sammlungen bleiben nebeneinander; auf der Startseite stehen sie mit ihrer Anlagezeit.",
              },
            ],
          });
          if (!wahl) return;
          if (wahl === "vorhanden") s = sammlungFuerZiel(s, gleichnamig);
        }
      }
      if (nachtragSeit != null && ![...einsaetzeLaden(), ...einsaetzePapierkorb()].some((x) => x.id === s.id)) {
        const n = geltendeJeEinheit(s.eintraege).length;
        const anlegen = await frageJaNein({
          titel: "Nur ein Nachtrag — nicht die ganze Lage",
          text:
            `Die Datei ist ein Nachtrag zu „${s.name}" seit ${zeitLang(nachtragSeit)} und enthält nur ${n} Einheit${n === 1 ? "" : "en"}. ` +
            "Die Sammlung gibt es auf diesem Gerät noch nicht: Es entstünde eine Lage mit nur diesen Einheiten. " +
            "Die ganze Lage kommt vom Gerät, das sie führt, über „Einsatz weitergeben / sichern“.",
          ok: "Trotzdem anlegen",
          abbruch: "Abbrechen",
        });
        if (!anlegen) return;
      }
      // Vor Ort entfernte Meldungen kommen nicht still zurück (R2-D4).
      const geklaert = await entfernteImImportKlaeren(s);
      // Bekannte Meldungen abgleichen statt nur neue anzuhängen (R3-W1).
      const eintraegeVorher = (einsaetzeLaden().find((x) => x.id === s.id)?.eintraege ?? []).map((e) => ({ ...e }));
      const r = einsatzAbgleichen(geklaert.sammlung);
      // Was von dort kam, hat das andere Gerät schon (R3-W2).
      weitergabeUmImportErgaenzen(s.id, r.neueIds, r.neueVermerke, r.bekannt, Date.now(), importUebernahm(r));
      // Was der Stab laut dem anderen Gerät schon bekam, gilt hier auch (R5-W6).
      exportStaendeUebernehmen(s.id, dateiStaende, [...einsaetzeLaden(), ...einsaetzePapierkorb()].map((x) => x.id));
      const lageSatz = lageAngabenUebernehmen(s.id, dateiLage, [...einsaetzeLaden(), ...einsaetzePapierkorb()].map((x) => x.id));
      const letzteImImport = letzteMeldung(geklaert.sammlung.eintraege);
      einsaetzeNeuLaden();
      setFehler("");
      // Gegliedert statt ein Absatz (R5-K3): oben Einheiten, Aktualisierungen und
      // inhaltliche Widersprüche, die kleinen Abweichungen eingeklappt dahinter.
      const gliederung = abgleichGliederung(r);
      // Widersprüche bleiben an der Einsatzansicht stehen, bis sie erledigt sind (R11-O3).
      widerspruchMerken(s.id, widerspruecheZumMerken(r));
      // Einheiten statt Fassungen zählen, wie die Liste darunter (R4-K2).
      const jetzt = einsaetzeLaden().find((x) => x.id === s.id);
      const koepfe = geltendeJeEinheit(jetzt?.eintraege ?? []);
      const anwesend = koepfe.filter((e) => e.status === MeldeStatus.ANWESEND).length;
      const vorherEinheiten = new Set(eintraegeVorher.map((e) => e.einheitSchluessel));
      const neueEinheiten = koepfe.filter((e) => !vorherEinheiten.has(e.einheitSchluessel)).length;
      // Nummern, die sich beim Zusammenführen verschoben haben (R5-W3).
      const nummernHinweis = nummernWechselText(nummernWechsel(eintraegeVorher, jetzt?.eintraege ?? []), jetzt?.eintraege ?? []);
      const einheitenText = `${koepfe.length === 1 ? "1 Einheit" : `${koepfe.length} Einheiten`}, davon ${anwesend} anwesend`;
      const kopfSatz = r.neuerEinsatz
        ? `Einsatz „${s.name}" übernommen: ${einheitenText}.`
        : `Einsatz „${s.name}": ${neueEinheiten === 0 ? "keine neue Einheit" : neueEinheiten === 1 ? "1 neue Einheit" : `${neueEinheiten} neue Einheiten`}` +
          `${r.hinzugefuegt > neueEinheiten ? `, ${r.hinzugefuegt - neueEinheiten} Folgemeldung(en)` : ""}. Jetzt ${einheitenText}.`;
      // Die Quittung steht oben in der Einsatzansicht, bei den Aufnahmeknöpfen —
      // als `meldung` stand sie hinter „Einsatz löschen…", vier Bildschirme
      // unter dem sichtbaren Bereich (R4-K2).
      setMeldung("");
      setEinlese({
        fehler: "",
        meldung: [
          kopfSatz,
          ...(r.neuerEinsatz ? [] : gliederung.kurz),
          // Wie aktuell die übernommene Lage ist (Audit Runde 3, R3-K5).
          ...(letzteImImport != null ? [`Stand der Datei: letzte Meldung ${zeitLang(letzteImImport)}.`] : []),
          // Die Datei war nicht neuer: sagen, dass nichts übernommen wurde (R13-A4).
          ...(!r.neuerEinsatz && !importUebernahm(r) ? [NICHTS_UEBERNOMMEN_SATZ] : []),
          ...(nummernHinweis ? [nummernHinweis] : []),
          ...(lageSatz ? [lageSatz] : []),
          ...(geklaert.hinweis ? [geklaert.hinweis.trim()] : []),
          ...(abgelehnt.length > 0 ? [ablehnungsSatz(abgelehnt, abgelehntGesamt)] : []),
        ].join(" "),
        einzelheiten: r.neuerEinsatz ? [] : gliederung.einzelheiten,
      });
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

  // Welche Ansicht gleich gezeigt wird — dieselbe Rangfolge wie die
  // Weichen darunter. Jeder Wechsel beginnt oben (R3-H1).
  useAnsichtBeginntOben(
    musterVorlage ? "musterung" : offenerEinsatz ? `einsatz:${offenerEinsatz.id}` : !bogen || zeigeStart ? "start" : "bogen",
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

  // Offener Einsatz: Detailansicht mit Summen, Einheiten und Sammel-Aktionen.
  if (offenerEinsatz) {
    return (
      <>
        <Aktualisierungshinweise />
        <SpeicherWarnung stand={einsaetze} />
        <UhrWarnung />
        <EinsatzDetail
          einsatz={offenerEinsatz}
          onZurueck={() => { setOffenerEinsatzId(null); setZeigeStart(true); einsatzHinweiseWeg(); }}
          onGeaendert={einsaetzeNeuLaden}
          onScannen={() => scanneInEinsatz(offenerEinsatz.id)}
          onManuell={() => manuellInEinsatz(offenerEinsatz.id)}
          onSchnell={() => manuellInEinsatz(offenerEinsatz.id, true)}
          onDateiImport={(dateien) => void importiereStapel(offenerEinsatz.id, dateien, [])}
          onBilderImport={(dateien) => void importiereStapel(offenerEinsatz.id, [], dateien)}
          onEinlesen={(daten, bilder) => void importiereStapel(offenerEinsatz.id, daten, bilder)}
          abgleichAnstoss={abgleichAnstoss}
          abgleichKnopfImBericht={stapelBericht.includes(LAGE_ABGLEICH_KURZ)}
          einleseQuittung={
            <>
              <EinleseQuittung fehler={einlese?.fehler ?? ""} meldung={einlese?.meldung ?? ""} einzelheiten={einlese?.einzelheiten} />
              {/* Eine angefangene Erfassung für diesen Einsatz liegt im Assistenten:
                  Wer mit „‹ Einsatz" zurückkam, findet sie hier wieder — nicht als
                  fremden „eigenen Bogen" auf der Startseite (Audit „Neuer Nutzer", F2).
                  Neben „Einheit manuell erfassen…", nicht 2 600 px tiefer
                  unter der Liste (Audit Runde 3, R3-S7). */}
              {bogen && fremdeErfassung && sammelZielId === offenerEinsatz.id && (
                <p className="meldung" role="status" style={{ textAlign: "center" }}>
                  Angefangene Erfassung für diesen Einsatz: „{einheitAnzeigename(bogen.einheit) || "(noch ohne Namen)"}".{" "}
                  <button type="button" className="link bogen-weiter" onClick={() => { setMeldung(""); setOffenerEinsatzId(null); setZeigeStart(false); }}>Weiter erfassen</button>
                </p>
              )}
              {/* Wer Meldekopf und Einheit zugleich ist, landet nach dem Neuladen in der Sammlung: Der eigene,
                  noch offene Bogen bekommt hier einen Weg zurück (R8-W5). */}
              {bogen && !fremdeErfassung && !bearbeiteteVorlage && bogenHatInhalt(bogen) && (
                <p className="meldung" role="status" style={{ textAlign: "center" }}>
                  Dein eigener Bogen „{einheitAnzeigename(bogen.einheit) || "(noch ohne Namen)"}" ist noch offen.{" "}
                  <button type="button" className="link bogen-weiter" onClick={() => { setMeldung(""); setOffenerEinsatzId(null); setZeigeStart(false); }}>Bogen fortsetzen</button>
                </p>
              )}
              {/* Stapel-Fortschritt und -Bericht holen sich selbst ins Bild (R2-A2). */}
              <StapelQuittung
                stand={stapelStand}
                onAbbrechen={() => (stapelAbbruchRef.current = true)}
                bericht={stapelBericht}
                onSchliessen={() => setStapelBericht([])}
                onAbgleich={() => setAbgleichAnstoss((n) => n + 1)}
                merker={teileMerker(offenerEinsatz.id)}
              />
            </>
          }
          onExport={() => exportiereEinsatz(offenerEinsatz)}
          onCsvExport={(umfang) => exportiereEinsatzCsv(offenerEinsatz, umfang)}
          onCsvDetailExport={(umfang) => exportiereEinsatzCsvDetail(offenerEinsatz, umfang)}
          onOldenburgExport={(umfang) => exportiereEinsatzOldenburg(offenerEinsatz, umfang)}
          onSammelPdf={(umfang) => sammelPdf(offenerEinsatz, umfang)}
          exportStaende={exportStaende}
          onStandAusWeitergabe={(ziel) => {
            const stand = exportStandAusWeitergabe(offenerEinsatz.id, ziel, [...einsaetzeLaden(), ...einsaetzePapierkorb()].map((x) => x.id));
            if (stand) setExportStaende((alt) => ({ ...alt, [ziel]: stand }));
          }}
          exportUmfang={exportUmfang}
          onExportUmfang={setExportUmfang}
          onWeitergeben={() => sammelPdf(offenerEinsatz, "alle", true)}
          onLageblatt={() => lageblatt(offenerEinsatz)}
          onBlanko={() => void blankoVordruck()}
          zusammenlegungEintragId={zusammenlegung?.einsatzId === offenerEinsatz.id ? zusammenlegung.eintragId : null}
          ausgabeQuittung={ausgabeQuittung}
          eingang={eingang}
          angefangeneErfassung={bogen && fremdeErfassung && sammelZielId === offenerEinsatz.id ? (einheitAnzeigename(bogen.einheit) || "(noch ohne Namen)") : undefined}
          onGeloescht={() => {
            // Selbst gelöscht, nicht „in einem anderen Fenster" (R12-S1): Die Meldung unten sagt, was aus der Erfassung wird.
            selbstGeloescht.current = offenerEinsatz.id;
            setOffenerEinsatzId(null);
            setZeigeStart(true);
            einsaetzeNeuLaden();
            setMeldung(""); /* Quittung mit Rückweg: Startseite (R2-D6) */
          }}
        />
        {(meldung || fehler) && (
          <p className={fehler ? "fehler" : "meldung"} role="status" style={{ textAlign: "center" }}>
            {fehler || meldung}
          </p>
        )}
        {zusammenlegung && zusammenlegung.einsatzId === offenerEinsatz.id && (
          <DaumenQuittung
            onRueckgaengig={zusammenlegungZuruecknehmen}
            rueckgaengigName="Rückgängig — Meldung als eigene Einheit führen"
            onSchliessen={() => setZusammenlegung(null)}
          >
            {/* Handlung und Rückweg vorn, Namen hinten (R5-E4); ein einziges „Rückgängig" (R5-E3). */}
            <strong>Zusammengelegt:</strong> „{zusammenlegung.neu}" als Fassung von „{zusammenlegung.alt}" — „Rückgängig" führt sie als eigene Einheit.
          </DaumenQuittung>
        )}
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
    // Die Liste der Einsätze (R17-A7, K5, N2): ein Einsatz, ein Eintrag. Läuft einer, steht sie über der Weiche — der frühere
    // Schnelleinstieg in „Bögen sammeln" wiederholte Name, Einheiten und Letzte Meldung der Karte darunter. Ohne Einsatz bleibt
    // der Abschnitt mit seinem Hinweis an der alten Stelle.
    const einsatzAbschnitt = (
      <section className="start-vorlagen">
        <h2>Einsatz-Sammlung (Meldekopf)</h2>
        {einsaetze.length === 0 && (
          <p className="hinweis">
            Fremde Bögen zu einem Einsatz/einer Übung sammeln (scannen oder manuell) — mit Stärke-Summen über alle anwesenden Einheiten.
          </p>
        )}
        <EinsatzListe
          einsaetze={einsaetze}
          onOeffnen={(s) => { setMeldung(""); setOffenerEinsatzId(s.id); }}
          onGeaendert={einsaetzeNeuLaden}
        />
      </section>
    );
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
    const offlineHinweis = offlinePlatz ? (
      <div className="offline-platz">
        {offlineZeile}
        <p className="offline-badge offline-geist" aria-hidden="true" data-text={offlineLangText(offline)} />
      </div>
    ) : offlineZeile;
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
        <SpeicherWarnung stand={einsaetze} />
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
                    : `Stärke ${s.fuehrer} / ${s.unterfuehrer} / ${s.mannschaft} / ${s.gesamt} (F / UF / M / Ges)`}
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
                    gehen die Änderungen verloren — {fremdeErfassung ? (bogen && nurSollstaerke(bogen) ? "die Sollstärke (nicht gezählt) jetzt auf dem Meldeblock notieren." : "die Stärke jetzt auf dem Meldeblock notieren.") : "jetzt „Fortsetzen“ und „Bogen übergeben“ (PDF oder QR-Code)."}
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
              <strong>{einheitAnzeigename(ersetzterEntwurf.bogen.einheit)}</strong>
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
        {/* Läuft ein Einsatz, steht seine Karte über den beiden Wegen: nach einer Unterbrechung tippte man sonst in den
            falschen Block („Neuen Bogen erstellen"), der Einsatz lag erst unter dem Bildrand (R17-S9, R17-A7). */}
        {einsaetze.length > 0 && einsatzAbschnitt}
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
                <input type="file" accept=".pdf,application/pdf,.json,application/json" onChange={ladeDatei} className="nur-sr" />
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
            {ausgabeQuittung && !offenerEinsatzId && (
              <p className="hinweis" role="status">
                {ausgabeQuittung}
              </p>
            )}
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
              {/* Laufende Einsätze stehen als Karten über dieser Weiche (R3-K5, R17-A7): ein Einsatz, ein Eintrag. */}
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
            {/* Unter den Knöpfen beider Wege: Der Fortschritt des Offline-Ladens ändert beim Erstbesuch mehrfach seine
                Höhe und schob die Knöpfe darunter um 21 bis 42 px (R16-H3). */}
            {erststart && offlineHinweis}
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
        {einsaetze.length === 0 && einsatzAbschnitt}
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
    setBogen({ ...bogen, ...patch, stand: stempelZeitpunkt() });
    setzeEmpfang(null);
  };

  // Leichter Füllstand je Schritt (Orientierung; die Übersicht hat keinen Status).
  const status = schrittStatus(bogen);
  // Erfassung für eine Sammlung? Dann trägt der Kopf den Einsatz und die
  // Fußleiste den Abschluss (F2) — nur bei einer als fremd markierten
  // Erfassung, nie beim eigenen Bogen (R3-S2).
  const sammelEinsatz = fremdeErfassung && sammelZielId ? einsaetze.find((s) => s.id === sammelZielId) ?? null : null;
  // Schnellerfassung: Der Sofortbedarf entfällt (Reiter „–"). „Weiter" von den Fahrzeugen geht darum gleich zur Übersicht,
  // und „Zurück" dort nennt den Schritt, von dem man kam — der Knopf heißt auch beim ersten Besuch „Zur Übersicht" (R17-S12).
  const schnellOhneBedarfSchritt = fremdeErfassung && bogen.personalErfassung === PersonalErfassung.NUR_STAERKE;
  const zurUebersicht = schritt === UEBERSICHT - 1 || ausUebersicht === schritt || (schnellOhneBedarfSchritt && schritt === UEBERSICHT - 2);

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
          <span className="modus-marke marke-einsatz" title={`Diese Erfassung wird als Meldung in die Sammlung „${sammelEinsatz.name}" gelegt — mit „In Einsatz übernehmen" auf jedem Schritt.`}>
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
      <nav className={`schritte${schnellOhneBedarfSchritt ? " schritte-schnell" : ""}`} aria-label="Schritte">
        {SCHRITTE.map((name, i) => {
          // Schnellerfassung: Einsatz (2) und Sofortbedarf (5) werden übersprungen — kein Haken für Unerledigtes (R14-N3).
          const entfaellt = fremdeErfassung && bogen.personalErfassung === PersonalErfassung.NUR_STAERKE && (i === 1 || i === 4);
          const st = entfaellt ? undefined : status[i]; // undefined für die Übersicht (letzter Schritt)
          const klassen = [i === schritt ? "aktiv" : "", st ? `status-${st}` : ""].filter(Boolean).join(" ");
          // „begonnen" als Wort statt „•": das Symbol verstand niemand (R2-N3, F6).
          const glyph = entfaellt ? "–" : st === "ok" ? "✓" : st === "begonnen" ? "offen" : "";
          return (
            <button
              key={name}
              type="button"
              className={klassen}
              ref={i === schritt ? reiterZeigen : undefined}
              aria-current={i === schritt ? "step" : undefined}
              aria-label={st ? `${i + 1}. ${name} — ${SCHRITT_STATUS_TITEL[st]}` : entfaellt ? `${i + 1}. ${name} — entfällt in der Schnellerfassung` : undefined}
              title={entfaellt ? "Entfällt in der Schnellerfassung" : st ? SCHRITT_STATUS_TITEL[st] : undefined}
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
      {/* Der Strich im Reiter heißt „entfällt": einmal ausgeschrieben, wo die Schnellerfassung beginnt oder wo man auf einem solchen Reiter steht (R17-N5). */}
      {fremdeErfassung && bogen.personalErfassung === PersonalErfassung.NUR_STAERKE && (schritt === 0 || schritt === 1 || schritt === 4) && (
        <p className="schritte-erklaerung">„–“ heißt: Schritt 2 und 5 entfallen hier.</p>
      )}
      {/* Schnellerfassung am Telefon (R18-W7): Schrittleiste und Legende sind dort eingeklappt (CSS); eine Zeile nennt den
          Stand — vier Schritte statt sechs, ohne zwei Zeilen Kopf mehr. Am Rechner bleibt die Leiste. */}
      {schnellOhneBedarfSchritt && (() => {
        const folge = [0, 2, 3, UEBERSICHT];
        const nr = folge.indexOf(schritt) + 1;
        return nr > 0 ? <p className="schritte-schnell-kurz">Schritt {nr} von {folge.length}: {SCHRITTE[schritt]}</p> : null;
      })()}
      {fenster.konflikt ? (
        <FensterKonflikt abgleich={fenster} />
      ) : speicherFehler ? (
        // Feste Leiste am Bildrand, nicht im Kopf: Der rollte mit der Seite weg,
        // und wer mitten im Schritt tippte, sah die Warnung erst nach dem
        // Hochrollen (Audit Runde 5, R5-O1).
        <FesteWarnung
          klasse="speicher-fehler"
          kurz={speicherFehlerKurz(speicherArt, fremdeErfassung, !!bogen && nurSollstaerke(bogen))}
          details={speicherFehlerDetails(speicherArt, fremdeErfassung, gespeichertUm ? uhrzeitMitTag(gespeichertUm) : null)}
        />
      ) : gespeichertUm ? (
        <p className="autosave" role="status" data-kurz={`✓ ${uhrzeitMitTag(gespeichertUm)}`}>
          {/* R4-M7: „✓ automatisch gespeichert · 22:24 Uhr — bleibt auf die…" wurde auf
              360 px an genau der Stelle gekürzt, um die es geht („nur auf diesem
              Gerät"). Kürzer, und das Wichtige steht hinten, wo gekürzt wird,
              nicht vorn. */}
          ✓ gespeichert · {uhrzeitMitTag(gespeichertUm)} Uhr · nur auf diesem Gerät
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
    {/* Solange die Frage der Geräteuhr offen ist, trägt der Bogen vielleicht ein falsches Datum (R7-W2). */}
    <UhrHinweis />
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
      {meldung && <p className="meldung" role="status" key={meldung}>{meldung}{vorlageRueckwegKnopf()}</p>}
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
      {/* Nacherfassung für einen Einsatz: die Uhrzeit vom Meldeblock gleich
          oben mitnehmen, statt sie danach je Karte über „ändern" (R2-A5). */}
      {schritt === 0 && sammelEinsatz && fremdeErfassung && (
        <EintreffzeitFeld
          wert={nachEintreffzeit}
          onAendern={setNachEintreffzeit}
          abgerueckt={nachAbgerueckt}
          onAbgerueckt={setNachAbgerueckt}
          nummer={nachNummer}
          onNummer={setNachNummer}
          zug={nachZug}
          onZug={setNachZug}
          zuege={[...new Set(sammelEinsatz.eintraege.map((e) => e.zugEtikett).filter((z): z is string => !!z))].sort()}
        />
      )}
      {schritt === 0 && <SchrittEinheit bogen={bogen} aendern={aendern} geheZu={setSchritt} ortFokus={!!sammelEinsatz && fremdeErfassung} />}
      {schritt === 1 && <SchrittEinsatz bogen={bogen} aendern={aendern} meldekopf={fremdeErfassung} />}
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
          neu={() => { if (bogenHatInhalt(bogen)) merkeVerdraengt(bogen); setMeldung(""); setBogen(null); setVorlageInBearbeitung(null); setFremdeErfassung(false); setSammelZiel(null); setzeEmpfang(null); setSchritt(0); }}
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
          onInEinsatzAufnehmen={() => { einsaetzeNeuLaden(); einsatzWahlDialog.current?.showModal(); }}
          onNeuerEinsatz={() => {
            const { bogen: neu, weg } = einsatzVorbereiten(bogen, heuteDatum(), stempelZeitpunkt());
            setBogen(neu);
            setEinsatzWeg(weg);
            setSchritt(1);
            setMeldung("Einsatzdaten für den neuen Einsatz zurückgesetzt — Ort/Auftrag eintragen. Personal und Fahrzeuge sind geblieben.");
          }}
          sammelAktion={
            sammelEinsatz
              ? { label: "In Einsatz übernehmen", onUebernehmen: () => void erfassungUebernehmen() }
              : undefined
          }
          fremdeErfassung={fremdeErfassung}
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
                : // Ein Gruppenführer hielt das für die Übergabe an den Meldekopf (R4-N6).
                  "Dein Bogen wird als Meldung abgelegt. Danach öffnet die Sammlung; dein Bogen bleibt unter „Fortsetzen“ auf der Startseite geöffnet. Das bleibt auf diesem Gerät — an den Meldekopf geht er über „Bogen übergeben…“."}
            {" "}Ist die Einheit dort schon gemeldet, wird nachgefragt (neue Fassung oder eigene Einheit).
          </p>
          {fehler && <p className="fehler" role="alert">{fehler}</p>}
          {einsaetze.map((s) => (
            <div className="teilen-weg" key={s.id}>
              <button type="button" onClick={() => bogenInEinsatzLegen(s.id)}>{s.name}</button>
              <p className="hinweis">
                {ART_LABEL[s.art]}{s.ort ? ` · ${s.ort}` : ""} · {einheitenZahl(aktuelleMeldungen(s.eintraege, s.art).length)} anwesend
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
        <footer className={sammelEinsatz ? `nav assistent-nav mit-uebernehmen${schnellOhneBedarfSchritt ? " uebernehmen-haupt" : ""}` : "nav assistent-nav"}>
          {/* Unter 360 px steht nur „←" (das Wort fällt per CSS weg), damit der
              Modusknopf daneben Platz hat; der Name bleibt „← Zurück". */}
          <button type="button" className="nav-zurueck" aria-label="← Zurück" disabled={schritt === 0} onClick={() => setSchritt(zurueckSchritt(schritt, fremdeErfassung && bogen.personalErfassung === PersonalErfassung.NUR_STAERKE))}>
            ←<span className="nav-wort"> Zurück</span>
          </button>
          {/* Moduswechsel aus der festen Leiste, ohne die Stelle im Formular
              zu verlieren (Audit Runde 3, R3-L6). Neben „← Zurück", nicht
              neben „Weiter →": Ein Fehlgriff klappt nur die Wahl auf. */}
          <AnzeigeLeistenKnopf kurz />
          {/* Der Abschluss der Einsatz-Erfassung stand nur auf Schritt 6; am
              Meldekopf reicht oft Schritt 1 und 3 (F2). Im Hochformat steht er
              in eigener Zeile über dem Blättern: schmal zwischen „← Zurück" und
              „Weiter →" traf ein Handschuh, der „Weiter" suchte, das Ablegen
              (Audit Runde 3, R3-G3). */}
          {sammelEinsatz && (
            // R17-M3: Auf schmalen Telefonen steht nur „Übernehmen" (CSS blendet „In Einsatz" aus); der Name bleibt voll.
            <button type="button" className="uebernehmen" aria-label="In Einsatz übernehmen" onClick={() => void erfassungUebernehmen()}>
              <span className="nav-einsatz">In Einsatz </span><span className="nav-ue">übernehmen</span>
            </button>
          )}
          {/* Nach der Musterung stehen Personal, Fahrzeuge und Bedarf schon da:
              Von „Bogen anlegen" bis zur Übergabe führte „Weiter →" durch
              drei Schritte, die nichts Neues verlangten (Audit Runde 4, R4-H5).
              Einen Tipp weiter, ohne etwas zu überspringen: Die Übersicht
              nennt, was offen ist. */}
          {!sammelEinsatz && nachMusterung && schritt === SCHRITT_EINSATZ && (
            <button type="button" className="uebernehmen" onClick={() => setSchritt(UEBERSICHT)}>Zur Übergabe →</button>
          )}
          {/* Schnellerfassung einer fremden Einheit: nach Name und Typ direkt
              zur Stärke — Schritt 2 („Wofür deine Einheit gemeldet wird") ist
              dort nicht gefragt (R2-N6). */}
          <button
            type="button"
            className="primaer nav-weiter"
            aria-label={zurUebersicht ? "Zur Übersicht →" : "Weiter →"}
            onClick={() =>
              setSchritt(
                ausUebersicht === schritt || (schnellOhneBedarfSchritt && schritt === UEBERSICHT - 2)
                  ? UEBERSICHT
                  : schritt === 0 && fremdeErfassung && bogen.personalErfassung === PersonalErfassung.NUR_STAERKE ? 2 : schritt + 1,
              )
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
