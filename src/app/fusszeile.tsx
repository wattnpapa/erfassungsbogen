/**
 * Seiten-Fußzeile: Version, Credits sowie Impressum/Datenschutz/Über als Dialoge.
 * Aufbau angelehnt an sprechfunk-uebung.de (gleicher Autor).
 */

import { Fragment, lazy, Suspense, useEffect, useRef, useState, type ChangeEvent, type ReactNode, type RefObject } from "react";
import type { Erfassungsbogen } from "@bos/eeb-format/model";
import { istNativ, textTeilen } from "./nativ";
import { fehlerText } from "./nachladen";
import { blobAlsDownload } from "./hilfen";
import { nutzungsKanal, statistikAbgewaehlt, statistikAbwaehlen } from "./statistik";
import { AnzeigeSchalter } from "./anzeige-schalter";
import { frageWahl, zeigeHinweis } from "./dialoge";
import {
  alleDatenLoeschen,
  datenUmfang,
  bestandBetroffen,
  bestandUmfang,
  folgenVorhanden,
  geraetBestand,
  letzteSicherung,
  sicherungErstellen,
  sicherungQuittungText,
  sicherungVermerkFehlte,
  sicherungStandText,
  sicherungFaellig,
  sicherungErstelltAm,
  sicherungEinspielen,
  sicherungParsen,
  type BestandUmfang,
  type DatenUmfang,
} from "./sicherung";
import { dateiFehlerMeldung } from "./datei-fehler";
import { schluesselFrage } from "./schluessel-frage";
import { geraeteKurzform, geraeteSchluesselLoeschen, geraeteSchluesselPrivat, geraeteSchluesselSicherstellen, kurzformAusPrivatHex } from "./geraete-schluessel";
import { speicherBelegung, speicherText } from "./eintrag-zeiten";
import { groessteText, istVoll } from "./speicher-warnung";
import { dauerhaftenSpeicherAnfragen, speicherDauerhaft } from "./speicher-browser";
import { WERKZEUGE, WERKZEUGE_TITEL } from "./werkzeuge";
import { folgenText } from "./uhr-folgen";
import { arbeiten, useArbeitet } from "./arbeitet";
import type { Aenderung } from "./aenderungen";

const KONTAKT = "johannes.rudolph@thw-oldenburg.de";
const REPO = "https://github.com/wattnpapa/erfassungsbogen";
// Absolut, nicht relativ: dieselbe Fußzeile läuft in der Electron-/Capacitor-App,
// wo ein relativer Pfad auf das mitgelieferte Bundle statt auf die Seite zeigt.
const ANLEITUNG = "https://erfassungsbogen.app/anleitung.html";
const VORLAGE = "https://erfassungsbogen.app/vorlage.html";

/** Schmales Telefon (R19-M15): Lange Dialoge klappen ihre Erklärungen ein. */
const engeAnzeige = () => typeof window.matchMedia === "function" && window.matchMedia("(max-width: 30rem)").matches;

function Dialog({ titel, dialogRef, klasse, onSchliessen, children }: {
  titel: string;
  dialogRef: RefObject<HTMLDialogElement | null>;
  klasse?: string;
  /** Feuert auch bei Esc und Backdrop-Schluss, nicht nur beim Knopf. */
  onSchliessen?: () => void;
  children: ReactNode;
}) {
  return (
    <dialog ref={dialogRef} aria-label={titel} className={klasse} onClose={onSchliessen}>
      <div className="kopfzeile">
        <h2>{titel}</h2>
        <button type="button" onClick={() => dialogRef.current?.close()}>Schließen</button>
      </div>
      {children}
    </dialog>
  );
}

/**
 * Impressum und Datenschutz stehen als eigene Bausteine, weil sie die einzigen
 * Teile der Fußzeile sind, die auf jeder Seite erreichbar bleiben müssen — auch
 * in der schmalen Assistenten-Zeile, die den Rest weglässt.
 */
function Impressumsdialog({ dialogRef }: { dialogRef: RefObject<HTMLDialogElement | null> }) {
  return (
    <Dialog titel="Impressum" dialogRef={dialogRef}>
      <p><strong>Angaben gemäß § 5 DDG</strong></p>
      <p>
        Johannes Rudolph<br />
        Kniphauser Straße 16<br />
        26419 Schortens<br />
        Deutschland
      </p>
      <p><strong>Kontakt</strong></p>
      <p>E-Mail: <a href={`mailto:${KONTAKT}`}>{KONTAKT}</a></p>
      <p><strong>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</strong></p>
      <p>Johannes Rudolph</p>
    </Dialog>
  );
}

function Datenschutzdialog({ dialogRef }: { dialogRef: RefObject<HTMLDialogElement | null> }) {
  const [statistikAus, setStatistikAus] = useState(() => statistikAbgewaehlt());

  function statistikUmschalten(ereignis: ChangeEvent<HTMLInputElement>) {
    const aus = ereignis.target.checked;
    setStatistikAus(aus);
    statistikAbwaehlen(aus);
  }

  return (
    <Dialog titel="Datenschutz" dialogRef={dialogRef}>
      <h3>1. Verantwortlicher</h3>
      <p>
        Johannes Rudolph<br />
        E-Mail: <a href={`mailto:${KONTAKT}`}>{KONTAKT}</a>
      </p>
      <h3>2. Verarbeitung beim Aufruf der Website</h3>
      <p>
        Die Website wird über GitHub Pages (GitHub Inc.) ausgeliefert. Dabei verarbeitet
        GitHub technisch notwendige Verbindungsdaten (z.&nbsp;B. IP-Adresse) in
        Server-Logs zur Bereitstellung und Absicherung des Dienstes. Details:{" "}
        <a href="https://docs.github.com/site-policy/privacy-policies/github-privacy-statement"
          target="_blank" rel="noopener noreferrer">GitHub Privacy Statement</a>.
      </p>
      <h3>3. Erfasste Bogendaten</h3>
      <p>
        Alle im Erfassungsbogen eingegebenen Daten (Einheit, Personal, Fahrzeuge usw.)
        werden ausschließlich lokal auf dem eigenen Gerät verarbeitet. Es findet keine
        Übertragung an einen Server statt. Eine Weitergabe erfolgt nur, wenn Nutzende
        selbst eine Datei, ein PDF oder einen QR-Code erzeugen und teilen.
      </p>
      <p>
        Freiwillig können unter „Absender“ Name, E-Mail-Adresse und Telefonnummer
        hinterlegt werden. Diese Angaben bleiben auf dem Gerät gespeichert und werden
        in jedem selbst erzeugten QR-Code, Link und PDF mitgegeben, damit die
        Gegenstelle bei Rückfragen weiß, an wen sie sich wenden kann. Die Angabe ist
        nicht erforderlich und jederzeit änder- und löschbar.
      </p>
      <h3>4. Speicherung im Endgerät und Reichweitenmessung</h3>
      <p>
        Es werden keine Cookies gesetzt. Die App speichert ihre Daten aber im
        lokalen Speicher (localStorage) des Geräts, weil sie ohne Server
        arbeitet und die Arbeit sonst bei jedem Neustart verloren wäre:
        eigene Vorlagen, Einsatz-Sammlungen, der aktuelle Bogen-Entwurf, die
        Absenderkarte, der private Signatur-Geräteschlüssel und die
        Anzeige-Einstellungen (Feld-/Nachtmodus). Ein Widerspruch gegen die
        Reichweitenmessung wird ebenfalls dort vermerkt.
      </p>
      <p>
        Personaldaten in Bögen haben eine Datenschutzfrist: 90 Tage nach der
        letzten Änderung eines Bogens entfernt die App Namen, Funktionen,
        Qualifikationen und Erreichbarkeiten dauerhaft — im Entwurf, in
        Einsatz-Sammlungen und beim Einlesen eines älteren QR-Codes oder einer
        Datei. Stärke und Summen bleiben erhalten. Ausgenommen sind Übungsbögen
        (Haken „Dies ist eine Übung“) und die eigenen Vorlagen. Damit eine falsch
        gehende Geräteuhr keine Daten vorzeitig löscht, merkt sich die App
        zusätzlich den zuletzt gesehenen Zeitpunkt. Ausgedruckte, exportierte
        oder weitergegebene Kopien erreicht die Frist nicht.
      </p>
      <p>
        Diese Einträge sind für den ausdrücklich gewünschten Dienst technisch
        erforderlich (§ 25 Abs. 2 Nr. 2 TDDDG); eine Einwilligung ist dafür
        nicht nötig. Sie verlassen das Gerät nicht: es gibt keine Übertragung
        an einen Server, keinen Zugriff durch Dritte und keine Kennung zur
        Wiedererkennung. Gelöscht werden sie über „Alle Daten löschen“ in der
        Fußzeile oder durch Löschen der Websitedaten im Browser.
      </p>
      <p>
        Der private Signatur-Geräteschlüssel liegt dabei unverschlüsselt im
        lokalen Speicher; er belegt die Herkunft der Bögen, nicht die Identität
        einer Person. Besteht der Verdacht, dass er in fremde Hände geraten ist
        — etwa nach Verlust oder Weitergabe des Geräts —, ersetzt
        „Geräteschlüssel neu erzeugen“ in der Fußzeile ihn durch ein neues
        Schlüsselpaar. Bögen von diesem Gerät tragen danach eine andere
        Kurzform, die den Empfängern bekannt gemacht werden muss.
      </p>
      <p>
        Zur Reichweitenmessung wird{" "}
        <a href="https://www.goatcounter.com/" target="_blank" rel="noopener noreferrer">
          GoatCounter
        </a>{" "}
        eingesetzt: beim Start wird einmalig ein Zählimpuls gesendet. Übertragen
        werden nur Zeitpunkt und Nutzungsart ({nutzungsKanal().titel}) sowie – im
        Browser – die verweisende Seite. Die IP-Adresse wird nicht gespeichert, es
        entsteht keine geräteübergreifende Kennung. Inhalte des Erfassungsbogens
        werden nicht übertragen. Ohne Internetverbindung unterbleibt der Impuls.
        Spielt jemand den Erklärfilm auf der Startseite ab, zählt GoatCounter
        außerdem, ob er gestartet, zur Hälfte und bis zum Ende gesehen wurde —
        nur diese festen Ereignisnamen, ohne verweisende Seite.
        Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO.
      </p>
      <label className="inline">
        <input type="checkbox" checked={statistikAus} onChange={statistikUmschalten} />
        Nicht mitzählen (gilt ab dem nächsten Start)
      </label>
      <h3>5. Betroffenenrechte</h3>
      <p>
        Nach Art. 15–21 DSGVO bestehen Rechte auf Auskunft, Berichtigung, Löschung,
        Einschränkung der Verarbeitung und Widerspruch. Anfragen bitte an die oben
        genannte E-Mail-Adresse.
      </p>
      <p>
        Für die lokal gespeicherten Daten lassen sich Auskunft und Löschung
        unmittelbar selbst ausüben, ohne Anfrage: „Datensicherung“ in der Fußzeile
        gibt alle gespeicherten Einträge als Datei heraus (und spielt sie wieder
        ein), „Alle Daten löschen“ nennt den Umfang und entfernt sie vollständig
        von diesem Gerät. Der Reichweitenmessung wird über das Kästchen in
        Abschnitt 4 widersprochen.
      </p>
    </Dialog>
  );
}

/**
 * Leerer Vordruck aus der App erzeugen — derselbe wie der Download auf der
 * Website, aber offline und in der Desktop-/Mobil-App ohne Umweg (R3-A7).
 */
async function blankoHerunterladen(): Promise<void> {
  // Mit Sperre und Rückmeldung wie die übrigen PDF-Wege (arbeitet.ts, R5-L4).
  await arbeiten("blanko", async () => {
    try {
      const { blankoPdfErzeugen } = await import("./pdf");
      await blankoPdfErzeugen();
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      await zeigeHinweis({
        titel: "Blanko-Vordruck",
        text: `Der Vordruck ließ sich nicht erzeugen (${e instanceof Error ? e.message : String(e)}). Er liegt auch unter „Aufbau des Bogens" auf erfassungsbogen.app.`,
      });
    }
  });
}

/**
 * Den Beispielbögen-Dialog öffnen. Der einzige Einstieg ist der Abschnitt
 * „Beispielbögen“ auf der Startseite unter „So funktioniert's"; einen Link in
 * der Fußzeile gibt es nicht mehr. Der Dialog selbst bleibt hier (Zustand,
 * Nachladen, Ordner-Navigation); die Startseite schickt nur dieses Ereignis.
 */
const BEISPIELE_OEFFNEN = "eeb:beispielboegen-oeffnen";
const BeispieleDialog = lazy(() => import("./beispiele-dialog"));
export function beispielboegenOeffnen(): void {
  window.dispatchEvent(new Event(BEISPIELE_OEFFNEN));
}

export function Fusszeile({ onBogenOeffnen, onAlsUebung, kompakt = false }: {
  /**
   * Beispielbogen in der App öffnen — wie ein frisch gescannter Bogen.
   * Rückgabe false = die Übernahme wurde abgelehnt (Rückfrage abgebrochen);
   * dann bleibt der Dialog stehen.
   */
  onBogenOeffnen: (bogen: Erfassungsbogen) => Promise<boolean>;
  /**
   * Alle Bögen des offenen Beispiel-Ordners in eine neue Übungs-Sammlung legen
   * (Prüfrunde Beispielbögen, BB-K1). Ohne Angabe fehlt der Knopf.
   */
  onAlsUebung?: (boegen: Erfassungsbogen[], ordnerName: string) => Promise<boolean>;
  /**
   * Schmale Linkzeile statt voller Fußzeile — für den Assistenten. Beim
   * Ausfüllen gehören Datensicherung, „Alle Daten löschen" und 227
   * Beispielbögen nicht unter das Formular: sie sind Startseiten-Angelegenheiten
   * und stehen am Meldekopf-Tablet nur zwischen Feld und Weiter-Knopf.
   * Impressum und Datenschutz bleiben, sie müssen von jeder Seite erreichbar
   * sein; die Darstellung sitzt im Assistenten ohnehin schon im Seitenkopf.
   */
  kompakt?: boolean;
}) {
  // Eine PDF-Erzeugung läuft höchstens einmal, gleich von welcher Stelle (arbeitet.ts).
  const arbeitet = useArbeitet();
  const ueber = useRef<HTMLDialogElement>(null);
  const aenderungen = useAenderungen();
  const impressum = useRef<HTMLDialogElement>(null);
  const datenschutz = useRef<HTMLDialogElement>(null);
  const sicherung = useRef<HTMLDialogElement>(null);
  const [sicherungFehler, setSicherungFehler] = useState("");
  // Rückfrage vor dem Einspielen — wie „Alle Daten löschen" mit Zahlen,
  // Sicherungs-Ausweg und Haken, denn die Folge für den Bestand ist dieselbe
  // (Audit Runde 2, R2-D3). Der Stand wird beim Öffnen erhoben.
  const einspielen = useRef<HTMLDialogElement>(null);
  const [einspielStand, setEinspielStand] = useState<{
    text: string;
    name: string;
    erstellt: string | null;
    datei: BestandUmfang;
    geraet: BestandUmfang;
    /** Kurzform des Geräteschlüssels vorher (Gerät) und nachher (Datei), R4-D2. */
    kurzGeraet: string | null;
    kurzDatei: string | null;
  } | null>(null);
  const [einspielVerstanden, setEinspielVerstanden] = useState(false);
  // Zweiter Haken, wenn Beiseitegelegtes (nicht lesbare Daten) mit verschwindet (R9-D2).
  const [beiseiteVerstanden, setBeiseiteVerstanden] = useState(false);
  // Wann zuletzt gesichert, ob eine Erinnerung fällig ist und ob der Browser
  // den Speicher dauerhaft vorhält (Audit Runde 2, R2-O6). Der Speicherstatus
  // wird beim Öffnen der Datensicherung erhoben (asynchron).
  const [zuletztGesichert, setZuletztGesichert] = useState(() => letzteSicherung());
  const [erinnerung, setErinnerung] = useState(() => sicherungFaellig());
  const [dauerhaft, setDauerhaft] = useState<boolean | null>(null);
  const [dauerhaftAbgelehnt, setDauerhaftAbgelehnt] = useState(false);
  // Quittung der letzten Sicherung (Dateiname, Ablage) und Datenstand (R12-O4).
  const [sicherungQuittung, setSicherungQuittung] = useState("");
  const sicherungQuittungRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (!sicherungQuittung) return;
    try {
      sicherungQuittungRef.current?.scrollIntoView?.({ block: "nearest" });
    } catch {
      /* Testumgebung ohne Layout */
    }
  }, [sicherungQuittung]);
  const loeschen = useRef<HTMLDialogElement>(null);
  // Stand beim Öffnen des Löschen-Dialogs — die Rückfrage nennt Zahlen, damit
  // niemand „alles löschen" blind bestätigt.
  const [loeschUmfang, setLoeschUmfang] = useState<DatenUmfang | null>(null);
  // Zweite Bestätigung im Dialog selbst (statt window.confirm): der Haken steht
  // neben der Liste dessen, was verschwindet, und ist nach dem Schließen wieder
  // leer — ein zweiter Klick allein löscht also nie.
  const [loeschVerstanden, setLoeschVerstanden] = useState(false);
  const [loeschFehler, setLoeschFehler] = useState("");

  // Fehlschlag beim Neuerzeugen des Geräteschlüssels — steht in der Fußzeile
  // selbst, weil der Weg ohne eigenen Dialog auskommt (nur Rückfrage + Hinweis).
  const [schluesselFehler, setSchluesselFehler] = useState("");

  /** Alle lokalen App-Daten als Datei anbieten — App: Share-Sheet, Browser: Download. */
  async function sicherungExportieren() {
    setSicherungFehler(""); // eine frühere Fehlerzeile gilt nicht mehr (R14-H4)
    const inhalt = sicherungErstellen();
    setZuletztGesichert(letzteSicherung());
    setErinnerung(null);
    const name = `eeb-sicherung-${new Date().toISOString().slice(0, 10)}.json`;
    if (istNativ()) {
      await textTeilen(name, inhalt);
      setSicherungQuittung(sicherungQuittungText(name, true, sicherungVermerkFehlte()));
      return;
    }
    blobAlsDownload(name, new Blob([inhalt], { type: "application/json" }));
    setSicherungQuittung(sicherungQuittungText(name, false, sicherungVermerkFehlte()));
  }

  async function sicherungImportieren(e: ChangeEvent<HTMLInputElement>) {
    const datei = e.target.files?.[0];
    e.target.value = "";
    if (!datei) return;
    setSicherungFehler("");
    setSicherungQuittung(""); // die Quittung einer früheren Sicherung steht nicht neben dem Ergebnis dieser Datei (R14-H4)
    // Erst prüfen, dann fragen: Eine kaputte oder falsche Datei soll nicht
    // zuerst „alles ersetzen?" auslösen und danach Parser-Text zeigen
    // (Audit Runde 2, R2-E5).
    let text: string;
    try {
      text = await datei.text();
      sicherungParsen(text);
    } catch (err) {
      setSicherungFehler(await dateiFehlerMeldung(datei, err, "sicherung"));
      return;
    }
    const dateiBestand = bestandUmfang(sicherungParsen(text));
    const geraet = geraetBestand();
    setEinspielStand({
      text,
      name: datei.name,
      erstellt: sicherungErstelltAm(text),
      datei: dateiBestand,
      geraet,
      kurzGeraet: geraet.geraeteschluessel ? await kurzformAusPrivatHex(geraet.geraeteschluessel) : null,
      kurzDatei: dateiBestand.geraeteschluessel ? await kurzformAusPrivatHex(dateiBestand.geraeteschluessel) : null,
    });
    setEinspielVerstanden(false);
    setBeiseiteVerstanden(false);
    einspielen.current?.showModal();
  }

  /** Nach der Rückfrage: wirklich ersetzen und neu laden. */
  async function einspielenJetzt() {
    if (!einspielStand) return;
    const { text } = einspielStand;
    einspielen.current?.close(); // ein Fehler erscheint im Dialog „Datensicherung" dahinter
    try {
      const anzahl = sicherungEinspielen(text);
      await zeigeHinweis({
        titel: "Sicherung eingespielt",
        text: `${anzahl} Einträge übernommen. Zum Abschluss „Neu laden“ tippen.`,
        ok: "Neu laden",
      });
      window.location.reload();
    } catch (err) {
      setSicherungQuittung("");
      setSicherungFehler(err instanceof Error ? err.message : String(err));
    }
  }

  /** Datensicherung öffnen und den Speicherstatus des Browsers erheben. */
  function sicherungOeffnen() {
    setSicherungFehler("");
    sicherung.current?.showModal();
    void speicherDauerhaft().then(setDauerhaft);
  }

  async function dauerhaftAnfragen() {
    const antwort = await dauerhaftenSpeicherAnfragen();
    setDauerhaft(antwort);
    // Der Tipp muss eine sichtbare Folge haben, auch wenn der Browser ablehnt (R12-O3).
    setDauerhaftAbgelehnt(antwort === false);
  }

  /** Löschen-Dialog öffnen: Stand frisch erheben, Bestätigung zurücksetzen. */
  function loeschenOeffnen() {
    setLoeschUmfang(datenUmfang());
    setLoeschVerstanden(false);
    setLoeschFehler("");
    loeschen.current?.showModal();
  }

  /**
   * Alles löschen und neu laden: der laufende Stand in React (offener Entwurf,
   * geladene Vorlagen) wüsste sonst nichts vom leeren Speicher und könnte ihn
   * beim nächsten Speichern wieder auffüllen.
   */
  async function alleDatenLoeschenJetzt() {
    try {
      const anzahl = alleDatenLoeschen();
      await zeigeHinweis({
        titel: "Alle lokalen Daten gelöscht",
        text: `${anzahl} Einträge entfernt. Die App startet jetzt neu.`,
        ok: "Neu starten",
      });
      window.location.reload();
    } catch (err) {
      setLoeschFehler(err instanceof Error ? err.message : String(err));
    }
  }

  /**
   * Geräteschlüssel verwerfen und sofort einen neuen erzeugen — der Weg für den
   * Verdacht, dass der private Schlüssel abgeflossen ist (M3 im
   * Informationssicherheitskonzept). Der neue Schlüssel wird gleich hier erzeugt
   * statt beim nächsten Signieren, damit die Kurzform in der Bestätigung steht:
   * ohne sie wüssten die Empfänger nicht, worauf sie künftig prüfen sollen.
   * Danach wird neu geladen, weil die Übersicht die alte Kurzform und den alten
   * QR-Code sonst weiter anzeigt.
   */
  async function geraeteSchluesselNeuErzeugen() {
    // Ohne vorhandenen Schlüssel wird nichts gelöscht — der Text sagt, was wirklich geschieht (R7-D6).
    const hatSchluessel = geraeteSchluesselPrivat() != null;
    let sicher = false;
    // Ohne Schlüssel: nur der erste Satz und ein neutraler Knopf, keine Warnung vor einem alten Schlüssel (R12-D3).
    const frage = schluesselFrage(hatSchluessel);
    for (let runde = 0; runde < 5 && !sicher; runde++) {
      const wahl = await frageWahl({
        titel: frage.titel,
        text: (
          <>
            {/* Die Folge steht vor der Erläuterung: Die feste Knopfleiste deckt bei 360 × 640 den Rest (R18-D4). */}
            {frage.folgen && (
              <p>
                <strong>{frage.folgen.fett}</strong>
                {frage.folgen.rest}
              </p>
            )}
            <p>{frage.erster}</p>
          </>
        ),
        wege: [
          ...(hatSchluessel
            ? [
                {
                  wert: "sichern",
                  label: "Vorher Sicherung erstellen…",
                  hinweis: "Die Sicherungsdatei enthält den bisherigen Schlüssel. Danach fragt die App erneut.",
                },
              ]
            : []),
          { wert: "neu", label: frage.neuLabel, gefahr: frage.gefahr },
        ],
      });
      if (wahl === "sichern") {
        await sicherungExportieren();
        continue;
      }
      sicher = wahl === "neu";
      if (!sicher) return;
    }
    if (!sicher) return;
    try {
      geraeteSchluesselLoeschen();
      await geraeteSchluesselSicherstellen();
      const kurz = await geraeteKurzform();
      await zeigeHinweis({
        titel: "Geräteschlüssel neu erzeugt",
        text: kurz
          ? `Die neue Kurzform lautet ${kurz}. Sie muss den Empfängern bekannt gemacht werden. Zum Abschluss „Neu laden“ tippen.`
          : "Der neue Schlüssel steht. Zum Abschluss „Neu laden“ tippen.",
        kopiertext: kurz ?? undefined,
        ok: "Neu laden",
      });
      window.location.reload();
    } catch (err) {
      setSchluesselFehler(err instanceof Error ? err.message : String(err));
    }
  }

  // Einstieg von der Startseite (beispielboegenOeffnen). Die kompakte
  // Fußzeile rendert den Dialog nicht und hört deshalb auch nicht zu.
  // Der Dialog selbst liegt in einem eigenen Baustein (beispiele-dialog.tsx) und lädt erst
  // beim ersten Öffnen — mit Ordnern, Suche und der Adressliste aller Beispiel-Dateien wäre
  // er sonst Teil jedes App-Starts (ADR-003, Bundle-Budget). Jede Anfrage zählt hoch.
  const [beispielAnfrage, setBeispielAnfrage] = useState(0);
  useEffect(() => {
    if (kompakt) return;
    const auf = () => setBeispielAnfrage((n) => n + 1);
    window.addEventListener(BEISPIELE_OEFFNEN, auf);
    return () => window.removeEventListener(BEISPIELE_OEFFNEN, auf);
  }, [kompakt]);

  // Im Assistenten bleibt von der Fußzeile eine Zeile übrig: Pflichtangaben und
  // die Anleitung. Alles Übrige — samt der schweren Beispielbögen-Liste — wird
  // gar nicht erst gerendert, statt nur ausgeblendet zu werden.
  if (kompakt) {
    return (
      <footer className="seite fuss-schmal">
        <nav aria-label="Rechtliches und Hilfe">
          <button type="button" className="link" onClick={() => impressum.current?.showModal()}>Impressum</button>
          <button type="button" className="link" onClick={() => datenschutz.current?.showModal()}>Datenschutz</button>
          <a href={ANLEITUNG} target="_blank" rel="noopener noreferrer">Anleitung</a>
          {/* Auch beim Ausfüllen eines Bogens erreichbar (R3-A7). */}
          <button type="button" className="link" onClick={() => void blankoHerunterladen()}>Blanko-Vordruck</button>
          <button type="button" className="link fuss-version" title="Was ist neu" onClick={() => void aenderungen.oeffnen()}>
            v{__APP_VERSION__} · Was ist neu
          </button>
        </nav>
        {aenderungen.dialog}
        <Impressumsdialog dialogRef={impressum} />
        <Datenschutzdialog dialogRef={datenschutz} />
        <Werkzeugzeile />
      </footer>
    );
  }

  return (
    <footer className="seite">
      {/* Nach Zweck gruppiert statt als eine Reihe gleich gewichteter Links:
          „was tut der Eintrag" ist die einzige Ordnung, die hier etwas
          Wahres über den Inhalt aussagt. Der Anzeige-Umschalter ist ein
          Bedienelement und kein Link — er bekommt eine eigene, benannte
          Spalte statt zwischen den Links zu stehen. */}
      <div className="fuss-gruppen">
        <nav className="fuss-gruppe" aria-label="Daten">
          <span className="fuss-titel">Daten</span>
          <button type="button" className="link" onClick={sicherungOeffnen}>Datensicherung</button>
          {/* Dezente Erinnerung, solange wertvolle Daten ungesichert altern
              (R2-O6) — kein Dialog, der die Arbeit unterbricht. */}
          {erinnerung && (
            <p className="hinweis sicherung-erinnerung">
              {erinnerung.seit
                ? `Letzte Sicherung vor ${Math.floor((Date.now() - erinnerung.seit) / 86_400_000)} Tagen. ${sicherungStandText()}`.trim()
                : "Noch keine Datensicherung erstellt."}{" "}
              Alles liegt nur auf diesem Gerät.{" "}
              <button type="button" className="link" onClick={sicherungOeffnen}>Jetzt sichern…</button>
            </p>
          )}
          <button type="button" className="link" onClick={() => void geraeteSchluesselNeuErzeugen()}>Geräteschlüssel neu erzeugen</button>
          <button type="button" className="link gefahr" onClick={loeschenOeffnen}>Alle Daten löschen</button>
          {schluesselFehler && <p className="fehler">{schluesselFehler}</p>}
        </nav>
        <nav className="fuss-gruppe" aria-label="Rechtliches">
          <span className="fuss-titel">Rechtliches</span>
          <button type="button" className="link" onClick={() => impressum.current?.showModal()}>Impressum</button>
          <button type="button" className="link" onClick={() => datenschutz.current?.showModal()}>Datenschutz</button>
        </nav>
        <nav className="fuss-gruppe" aria-label="Projekt">
          <span className="fuss-titel">Projekt</span>
          <a href={ANLEITUNG} target="_blank" rel="noopener noreferrer">Anleitung</a>
          <a href={VORLAGE} target="_blank" rel="noopener noreferrer">Aufbau des Bogens</a>
          <button
            type="button"
            className={`link${arbeitet === "blanko" ? " arbeitet" : ""}`}
            aria-busy={arbeitet === "blanko" || undefined}
            disabled={arbeitet !== null}
            onClick={() => void blankoHerunterladen()}
          >
            {arbeitet === "blanko" ? "Blanko-Vordruck wird erzeugt…" : "Blanko-Vordruck (PDF)"}
          </button>
          {/* Das PDF bleibt hell, auch nachts (R5-L5). */}
          <span className="hinweis papier-hinweis">Das PDF ist für Papier gedacht, hell.</span>
          <button type="button" className="link" onClick={() => void aenderungen.oeffnen()}>Was ist neu</button>
          <a href={`mailto:${KONTAKT}`}>Kontakt</a>
          <a href={REPO} target="_blank" rel="noopener noreferrer">Open Source auf GitHub</a>
        </nav>
        {/* Registerentscheidung der Oberfläche: Du — wie an allen anderen
            Stellen (Absenderkarte, Hinweise); ein einzelnes „Sie" wirkte hier
            wie ein Riss im amtlich-präzisen Ton. */}
        <nav className="fuss-gruppe" aria-label="Für deine Organisation">
          <span className="fuss-titel">Für deine Organisation</span>
          <a href="https://erfassungsbogen.app/thw.html" target="_blank" rel="noopener noreferrer">THW</a>
          <a href="https://erfassungsbogen.app/feuerwehr.html" target="_blank" rel="noopener noreferrer">Feuerwehr</a>
          <a href="https://erfassungsbogen.app/dlrg.html" target="_blank" rel="noopener noreferrer">DLRG</a>
          <a href="https://erfassungsbogen.app/drk.html" target="_blank" rel="noopener noreferrer">DRK</a>
          <a href="https://erfassungsbogen.app/johanniter.html" target="_blank" rel="noopener noreferrer">Johanniter</a>
          <a href="https://erfassungsbogen.app/malteser.html" target="_blank" rel="noopener noreferrer">Malteser</a>
          <a href="https://erfassungsbogen.app/asb.html" target="_blank" rel="noopener noreferrer">ASB</a>
          <a href="https://erfassungsbogen.app/katastrophenschutz.html" target="_blank" rel="noopener noreferrer">Katastrophenschutz</a>
          <a href="https://erfassungsbogen.app/bbk.html" target="_blank" rel="noopener noreferrer">Bundeseinheiten (BBK)</a>
          <a href="https://erfassungsbogen.app/bundeswehr.html" target="_blank" rel="noopener noreferrer">Bundeswehr</a>
          <a href="https://erfassungsbogen.app/meldekopf.html" target="_blank" rel="noopener noreferrer">Meldekopf</a>
        </nav>
        <div className="fuss-gruppe">
          <span className="fuss-titel">Ansicht</span>
          <AnzeigeSchalter />
        </div>
      </div>
      <p className="fuss-marke">
        Einheiten-Erfassungsbogen{" "}
        <button type="button" className="link" title="Was ist neu" onClick={() => void aenderungen.oeffnen()}>v{__APP_VERSION__}</button>
        {" "}· von{" "}
        <button type="button" className="link" onClick={() => ueber.current?.showModal()}>Johannes Rudolph</button>
      </p>

      <Dialog titel="Datensicherung" dialogRef={sicherung} klasse="rollhinweis">
        <p>
          Alle lokalen Daten dieser App — Vorlagen, Einsatz-Sammlungen, der aktuelle
          Entwurf, Einstellungen und der Signatur-Geräteschlüssel — lassen sich als
          eine Datei sichern und auf einem anderen Gerät (oder nach einer
          Neuinstallation) wieder einspielen.
        </p>
        <p className="warnung">
          Die Datei enthält den privaten Signaturschlüssel und ggf. Personendaten.
          Sicher aufbewahren und nur über vertrauenswürdige Wege übertragen.
        </p>
        <div className="aktionen">
          <button type="button" className="primaer" onClick={() => void sicherungExportieren()}>Sicherung erstellen…</button>
          <label className="datei-knopf">
            Sicherung einspielen…
            <input type="file" accept=".json,application/json" className="nur-sr" onChange={(e) => void sicherungImportieren(e)} />
          </label>
        </div>
        {/* Das Ergebnis des letzten Tipps steht direkt unter den Knöpfen und ist die einzige Meldung: eine frühere
            Fehlerzeile oder Quittung wird mit dem nächsten Vorgang entfernt (R14-H4). */}
        {sicherungQuittung && (
          <p className="hinweis sicherung-quittung" role="status" ref={sicherungQuittungRef}>
            {sicherungQuittung}
          </p>
        )}
        {sicherungFehler && <p className="fehler" role="alert">{sicherungFehler}</p>}
        {/* R19-M15: Am kleinen Telefon steht das Übrige hinter „Mehr dazu": Der Dialog war 1 309 px hoch, „Sicherung erstellen…" lag unter dem Bildrand. */}
        {dauerhaft === false && (
          <p className="warnung">
            Der Speicher ist nicht dauerhaft: Der Browser darf ihn bei Platzmangel oder nach
            längerer Nichtnutzung räumen. Regelmäßig sichern; auf iPhone und iPad die App über
            „Zum Home-Bildschirm“ ablegen.{" "}
            <button type="button" className="link" onClick={() => void dauerhaftAnfragen()}>
              Dauerhaften Speicher anfragen
            </button>
          </p>
        )}
        {dauerhaft === false && dauerhaftAbgelehnt && (
          <p className="hinweis" role="status">
            Der Browser hat den dauerhaften Speicher abgelehnt — regelmäßig sichern; auf iPhone und iPad die App
            über „Zum Home-Bildschirm“ ablegen.
          </p>
        )}
        <details className="dialog-mehr" open={!engeAnzeige()}>
        <summary>Mehr dazu</summary>
        <p className="hinweis">
          Einspielen ersetzt die vorhandenen App-Daten auf diesem Gerät vollständig.
        </p>
        {/* Wie sicher liegt es hier, und wann gab es zuletzt eine Kopie?
            (Audit Runde 2, R2-O6) */}
        <p className="hinweis" role="status">
          {zuletztGesichert
            ? `Letzte Sicherung auf diesem Gerät erstellt: ${new Date(zuletztGesichert).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })} Uhr. ${sicherungStandText()}`.trim()
            : "Auf diesem Gerät wurde noch keine Sicherung erstellt."}
        </p>
        {dauerhaft === true && (
          <p className="hinweis">
            Der Browser hält den Speicher dieser App dauerhaft vor und räumt ihn nicht von sich aus.
          </p>
        )}
        {/* Der Speicherstand gehört dorthin, wo aufgeräumt wird: Ein voller
            Speicher trifft sonst ohne Vorwarnung (Audit „Offline und
            Speicher", O4). Die Grenze ist eine Schätzung — Browser nennen
            ihr Limit nicht, üblich sind rund 5 MB. */}
        <SpeicherStand />
        </details>
      </Dialog>

      {/* Rückfrage vor dem Einspielen: nennt, was auf dem Gerät verschwindet
          und was die Datei bringt, bietet die Sicherung vorher an und
          verlangt einen Haken, sobald laufende Sammlungen betroffen sind
          (Audit Runde 2, R2-D3). */}
      <Dialog titel="Sicherung einspielen?" dialogRef={einspielen} onSchliessen={() => setEinspielStand(null)}>
        {einspielStand && (() => {
          const laufendBetroffen = einspielStand.geraet.sammlungen.some((x) => !x.papierkorb && x.meldungen > 0);
          // Der Haken gilt, sobald hier überhaupt etwas verloren geht — nicht
          // nur bei laufenden Sammlungen (R4-D2).
          const betroffen = bestandBetroffen(einspielStand.geraet);
          return (
            <>
              <p>
                Einspielen <strong>ersetzt</strong> alle App-Daten auf diesem Gerät — Vorlagen,
                Einsätze, Entwurf, Einstellungen und den Geräteschlüssel — durch den Inhalt der
                Datei. Anders als „Einsatz importieren…“ wird nichts ergänzt.
              </p>
              <p><strong>Auf diesem Gerät — geht dabei verloren:</strong></p>
              <BestandListe bestand={einspielStand.geraet} kurzform={einspielStand.kurzGeraet} geraet />
              <p>
                <strong>
                  In der Datei „{einspielStand.name}“
                  {einspielStand.erstellt
                    ? ` (erstellt ${new Date(einspielStand.erstellt).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })} Uhr)`
                    : ""}
                  :
                </strong>
              </p>
              <BestandListe bestand={einspielStand.datei} kurzform={einspielStand.kurzDatei} />
              {/* Eine alte Datei bringt, was nach den Fristen übrig bleibt (R5-D4). */}
              {folgenVorhanden(einspielStand.datei.faellig) && (
                <p className="warnung" role="status">
                  <strong>Davon fällt sofort wieder weg:</strong> {folgenText(einspielStand.datei.faellig)} — die
                  Datei ist älter als die Fristen (Sammlungen 90 Tage ohne Änderung, Papierkorb 30 Tage, Namen in
                  Bögen 90 Tage). Das Einspielen löst die Aufräumung beim Neuladen aus; was du noch brauchst, vorher
                  aus der Datei übernehmen oder exportieren.
                  {einspielStand.datei.faellig.namen.length > 0 && <> Betroffen: „{einspielStand.datei.faellig.namen.join("“, „")}“.</>}
                </p>
              )}
              {laufendBetroffen && (
                <p className="warnung">
                  Die laufenden Sammlungen dieses Geräts sind danach weg — ohne Papierkorb.
                  Vorher sichern oder übergeben.
                </p>
              )}
              <div className="aktionen">
                <button type="button" onClick={() => void sicherungExportieren()}>Vorher Sicherung erstellen…</button>
              </div>
              {betroffen && (
                <label className="inline">
                  <input
                    type="checkbox"
                    checked={einspielVerstanden}
                    onChange={(e) => setEinspielVerstanden(e.target.checked)}
                  />
                  Ja, die Daten dieses Geräts durch die Sicherung ersetzen
                </label>
              )}
              {/* Beiseitegelegtes ist die letzte Spur unlesbarer Daten: eigener Haken (R9-D2). */}
              {einspielStand.geraet.beiseite && (
                <label className="inline">
                  <input
                    type="checkbox"
                    checked={beiseiteVerstanden}
                    onChange={(e) => setBeiseiteVerstanden(e.target.checked)}
                  />
                  Beiseitegelegtes geht verloren — ich habe es gesichert („Vorher Sicherung erstellen…“) oder brauche es nicht
                </label>
              )}
              <div className="aktionen">
                <button
                  type="button"
                  className="gefahr"
                  disabled={(betroffen && !einspielVerstanden) || (!!einspielStand.geraet.beiseite && !beiseiteVerstanden)}
                  onClick={() => void einspielenJetzt()}
                >
                  Einspielen und ersetzen
                </button>
                <button type="button" onClick={() => einspielen.current?.close()}>Abbrechen</button>
              </div>
            </>
          );
        })()}
      </Dialog>

      {/* Restlos löschen — z. B. bevor ein geteiltes Tablet weitergegeben wird
          oder nach einer Übung. Bewusst mit Zahlen, Sicherungs-Ausweg und
          eigenem Haken: rückgängig gibt es hier nicht. */}
      <Dialog titel="Alle lokalen Daten löschen" dialogRef={loeschen} klasse="rollhinweis">
        <p>
          Entfernt <strong>alle</strong> Daten dieser App von diesem Gerät — auch die
          Einträge im Papierkorb. Es gibt keine Kopie in einer Cloud: was hier weg
          ist, ist weg.
        </p>
        {/* R20-L2: Der sichere Weg steht über der Folge-Zeile und damit am kleinen Telefon über der festen Leiste: Bei 360 × 640 lag
            „Vorher Sicherung erstellen…" sonst zur Hälfte unter ihr, der Tipp traf die Leiste. */}
        <div className="aktionen loesch-sicherung">
          <button type="button" onClick={() => void sicherungExportieren()}>Vorher Sicherung erstellen…</button>
        </div>
        {/* Die Folge in einer Zeile ganz oben (R18-D4): Die feste Leiste mit Haken und Knöpfen deckt bei 360 × 640 sonst die
            Aufzählung, und „noch kein Export …" blieb ungelesen. Wo es keine Kopie gibt, ist das hier die einzige (R4-D5). */}
        {loeschUmfang && loeschUmfang.eintraege > 0 && loeschUmfang.einsaetze > 0 && (
          <p className="loesch-kurz">
            <strong>
              {loeschUmfang.einsaetze} {loeschUmfang.einsaetze === 1 ? "Einsatz-Sammlung" : "Einsatz-Sammlungen"} mit {loeschUmfang.meldungen}{" "}
              {loeschUmfang.meldungen === 1 ? "gemeldeten Bogen" : "gemeldeten Bögen"}
            </strong>
            {loeschUmfang.ohneExport.length > 0
              ? ` — noch kein Export, kein Lageblatt und keine Weitergabe von: ${loeschUmfang.ohneExport.map((n) => `„${n}"`).join(", ")}`
              : ""}
            .
          </p>
        )}
        {/* Die Sicherung steht vor der langen Aufzählung (R7-D7), seit R20-L2 vor der Folge-Zeile. */}
        {/* R19-M15, D7: Die Aufzählung liegt am kleinen Telefon hinter „Was genau gelöscht wird"; Sicherung, Haken und Knöpfe stehen im Bild. */}
        <details className="dialog-mehr" open={!engeAnzeige()}>
        <summary>Was genau gelöscht wird</summary>
        {loeschUmfang && (
          loeschUmfang.eintraege === 0 ? (
            <p>Auf diesem Gerät sind derzeit keine App-Daten gespeichert.</p>
          ) : (
            <>
              <p><strong>Betroffen sind:</strong></p>
              <ul>
                <li>
                  {loeschUmfang.vorlagen} {loeschUmfang.vorlagen === 1 ? "Vorlage" : "Vorlagen"}
                  {" (inkl. Papierkorb)"}
                </li>
                <li>
                  {loeschUmfang.einsaetze} {loeschUmfang.einsaetze === 1 ? "Einsatz-Sammlung" : "Einsatz-Sammlungen"}
                  {" mit "}{loeschUmfang.meldungen} {loeschUmfang.meldungen === 1 ? "gemeldeten Bogen" : "gemeldeten Bögen"}
                  {/* „Noch kein Export …" steht jetzt oben in der Kurzzeile (R18-D4). */}
                </li>
                <li>{loeschUmfang.entwurf ? "der aktuelle Bogen-Entwurf" : "kein offener Bogen-Entwurf"}</li>
                {loeschUmfang.rueckholplatz != null && (
                  <li>der zuletzt geschlossene Bogen „{loeschUmfang.rueckholplatz}" (Startseite, zum Zurückholen)</li>
                )}
                {loeschUmfang.beiseitegelegt && (
                  <li>ein beiseitegelegter, unlesbarer Bogen (Startseite, „Als Datei sichern“ vorher möglich)</li>
                )}
                {loeschUmfang.beiseiteDaten && (
                  <li>
                    <strong>beiseitegelegte, nicht lesbare Daten</strong> (Sammlungen oder Vorlagen): {loeschUmfang.beiseiteDaten.eintraege}{" "}
                    {loeschUmfang.beiseiteDaten.eintraege === 1 ? "Eintrag" : "Einträge"}, {loeschUmfang.beiseiteDaten.zeichen.toLocaleString("de-DE")} Zeichen
                    — nur „Vorher Sicherung erstellen…“ hebt sie auf
                  </li>
                )}
                <li>{loeschUmfang.absender ? "die hinterlegte Absenderkarte" : "keine Absenderkarte"}</li>
                <li>
                  {loeschUmfang.geraeteschluessel
                    ? "der Signatur-Geräteschlüssel — künftige Bögen werden mit einem neuen Schlüssel signiert"
                    : "kein Signatur-Geräteschlüssel"}
                </li>
                <li>alle Einstellungen (Darstellung, Vorbelegungen)</li>
              </ul>
            </>
          )
        )}
        <p className="warnung">
          Bereits erzeugte PDFs, QR-Codes und Sicherungsdateien bleiben unberührt —
          nur der Speicher dieser App wird geleert. Die Einstellung „Nicht
          mitzählen“ aus dem Datenschutzhinweis bleibt erhalten.
        </p>
        </details>
        {/* R16-M2: Haken und Entscheidung kleben am Dialogfuß, auch wenn die Aufzählung darüber lang ist. */}
        <div className="dialog-entscheidung">
          <label className="inline">
            <input
              type="checkbox"
              checked={loeschVerstanden}
              onChange={(e) => setLoeschVerstanden(e.target.checked)}
            />
            Ja, alle lokalen Daten dieser App endgültig löschen
          </label>
          {/* R17-L1: Der gesperrte Knopf sagt, was fehlt. */}
          {!loeschVerstanden && <p className="hinweis dialog-fehlt" role="status">„Endgültig löschen“ geht erst, wenn der Haken gesetzt ist.</p>}
          <div className="aktionen">
            <button type="button" className="gefahr" disabled={!loeschVerstanden} onClick={alleDatenLoeschenJetzt}>
              Endgültig löschen
            </button>
            <button type="button" onClick={() => loeschen.current?.close()}>Abbrechen</button>
          </div>
          {loeschFehler && <p className="fehler">{loeschFehler}</p>}
        </div>
      </Dialog>

      {beispielAnfrage > 0 && (
        <Suspense fallback={null}>
          <BeispieleDialog anfrage={beispielAnfrage} onBogenOeffnen={onBogenOeffnen} onAlsUebung={onAlsUebung} />
        </Suspense>
      )}

      <Dialog titel="Über dieses Projekt" dialogRef={ueber}>
        <p>
          Der Einheiten-Erfassungsbogen ist ein Projekt von <strong>Johannes Rudolph</strong>,
          ehrenamtlicher Helfer im THW (Ortsverband Oldenburg). Die App digitalisiert die
          Erfassung von Einheiten im Bevölkerungsschutz – BOS-übergreifend, offline nutzbar
          und mit QR-Code-Transport, damit die Daten auch ohne Netz beim Meldekopf ankommen.
        </p>
        <p>
          Die Anwendung ist Open Source (Lizenz EUPL-1.2). Fehler, Ideen und Beiträge gern
          über <a href={REPO} target="_blank" rel="noopener noreferrer">GitHub</a> oder per{" "}
          <a href={`mailto:${KONTAKT}`}>E-Mail</a>.
        </p>
        <p>
          Weiteres Projekt: <a href="https://sprechfunk-uebung.de/" target="_blank" rel="noopener noreferrer">
          Sprechfunk-Übungsgenerator</a> – Sprechfunkübungen für BOS-Einheiten erstellen.
        </p>
      </Dialog>

      {aenderungen.dialog}

      <Impressumsdialog dialogRef={impressum} />

      <Datenschutzdialog dialogRef={datenschutz} />

      <Werkzeugzeile />
    </footer>
  );
}

/**
 * „Was ist neu" — der Änderungsverlauf (aenderungen.ts). Die Liste kommt erst
 * beim Öffnen nach (eigener Baustein im Offline-Vorrat), das Startpaket trägt
 * nur den Knopf. Erreichbar über die Versionsnummer, in der schmalen Zeile des
 * Assistenten wie in der vollen Fußzeile.
 */
function useAenderungen() {
  const ref = useRef<HTMLDialogElement>(null);
  const [daten, setDaten] = useState<{ liste: readonly Aenderung[]; monate: Readonly<Record<string, string>> } | null>(null);
  // Blättern je Monat, 0 = neuester. Ein Verlauf seit Juli war als eine Liste über 20 Bildschirme lang.
  const [seite, setSeite] = useState(0);
  const [fehler, setFehler] = useState("");
  const kopf = useRef<HTMLHeadingElement>(null);
  const oeffnen = async () => {
    setFehler("");
    setSeite(0);
    try {
      const m = await import("./aenderungen");
      setDaten({ liste: m.AENDERUNGEN, monate: m.MONATE });
    } catch (err) {
      setFehler(`Der Änderungsverlauf ließ sich nicht laden: ${fehlerText(err)}`);
    }
    ref.current?.showModal();
  };
  const monate = daten ? [...new Set(daten.liste.map((a) => a.datum.slice(0, 7)))] : [];
  const monat = monate[seite];
  const blaettern = (neu: number) => {
    setSeite(neu);
    // Nach dem Blättern beginnt der neue Monat oben, nicht dort, wo man im alten gerollt hatte.
    requestAnimationFrame(() => kopf.current?.scrollIntoView?.({ block: "start" }));
  };
  const leiste = monate.length > 1 && (
    <nav className="aenderungen-blaettern" aria-label="Monate blättern">
      <button type="button" disabled={seite === 0} onClick={() => blaettern(seite - 1)}>← Neuer</button>
      <span>
        {seite + 1} von {monate.length}
      </span>
      <button type="button" disabled={seite >= monate.length - 1} onClick={() => blaettern(seite + 1)}>Älter →</button>
    </nav>
  );
  const dialog = (
    <Dialog titel="Was ist neu" dialogRef={ref} klasse="rollhinweis aenderungen">
      <p className="hinweis">Installierte Fassung: v{__APP_VERSION__}.</p>
      {fehler && <p className="fehler" role="alert">{fehler}</p>}
      {daten && monat && (
        <>
          <h3 className="aenderungen-monat" ref={kopf}>{monatsName(monat)}</h3>
          {daten.monate[monat] && <p className="aenderungen-kurz">{daten.monate[monat]}</p>}
          {daten.liste
            .filter((a) => a.datum.startsWith(monat))
            .map((a) => (
              <section key={a.datum} className="aenderung">
                <h4>{aenderungsDatumText(a.datum)}</h4>
                <ul>
                  {a.punkte.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </section>
            ))}
          {leiste}
        </>
      )}
    </Dialog>
  );
  return { oeffnen, dialog };
}

const MONATSNAMEN = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

/** „November 2026" aus „2026-11". */
function monatsName(jjjjmm: string): string {
  const [j, m] = jjjjmm.split("-");
  return `${MONATSNAMEN[Number(m) - 1] ?? m} ${j}`;
}

/** „08.11.2026" aus „2026-11-08" — hier statt aus aenderungen.ts, damit das Startpaket die Liste nicht mitlädt. */
function aenderungsDatumText(iso: string): string {
  const [j, m, t] = iso.split("-");
  return `${t}.${m}.${j}`;
}

/**
 * Letzte Zeile jeder Fußzeile: die Werkzeuge desselben Autors (werkzeuge.ts).
 * Der Mittelpunkt steht als eigenes, verborgenes Element zwischen den Links —
 * nicht unterstrichen, nicht angetippt, nicht vorgelesen.
 */
function Werkzeugzeile() {
  return (
    <nav className="fuss-werkzeuge" aria-label={WERKZEUGE_TITEL}>
      {WERKZEUGE.map((w, i) => (
        <Fragment key={w.href}>
          {i > 0 && <span aria-hidden="true">·</span>}
          <a href={w.href} target="_blank" rel="noopener noreferrer">{w.label}</a>
        </Fragment>
      ))}
    </nav>
  );
}

/**
 * Inhalt eines Bestands für die Einspiel-Rückfrage: Sammlungen beim Namen,
 * Vorlagen getrennt nach aktiv und Papierkorb, Rückholplatz, Absenderkarte
 * und Geräteschlüssel mit Kurzform — dieselben Posten wie „Alle Daten
 * löschen" (R4-D2).
 */
function BestandListe({ bestand, kurzform, geraet = false }: { bestand: BestandUmfang; kurzform: string | null; geraet?: boolean }) {
  const aktiv = bestand.sammlungen.filter((x) => !x.papierkorb);
  const papierkorb = bestand.sammlungen.length - aktiv.length;
  return (
    <ul>
      {aktiv.length === 0 && <li>keine laufende Einsatz-Sammlung</li>}
      {aktiv.map((x, i) => (
        <li key={i}>
          Sammlung „{x.name}“ mit {x.meldungen} {x.meldungen === 1 ? "Meldung" : "Meldungen"}
        </li>
      ))}
      {papierkorb > 0 && <li>{papierkorb} {papierkorb === 1 ? "Sammlung" : "Sammlungen"} im Papierkorb</li>}
      {/* Beschädigtes in der Datei: Wer sie einspielt, bringt es mit (R8-E1). */}
      {(bestand.beschaedigt ?? []).map((t) => (
        <li key={t}><strong>beschädigt:</strong> {t}</li>
      ))}
      {/* Beiseitegelegtes geht beim Einspielen mit verloren, auch wenn die Karte „nichts gelöscht“ sagt (R9-D2). */}
      {bestand.beiseite && bestand.beiseite.eintraege > 0 && (
        <li>
          <strong>beiseitegelegt:</strong> {bestand.beiseite.eintraege} {bestand.beiseite.eintraege === 1 ? "nicht lesbarer Eintrag" : "nicht lesbare Einträge"}{" "}
          (Sammlungen oder Vorlagen, {bestand.beiseite.zeichen.toLocaleString("de-DE")} Zeichen){geraet ? " — ohne Sicherung weg" : ""}
        </li>
      )}
      {bestand.beiseite?.entwurf && <li><strong>beiseitegelegt:</strong> ein beschädigter, nicht lesbarer Bogen (Entwurf){geraet ? " — ohne Sicherung weg" : ""}</li>}
      <li>
        {bestand.vorlagen} {bestand.vorlagen === 1 ? "Vorlage" : "Vorlagen"}
        {bestand.vorlagenPapierkorb > 0 ? `, dazu ${bestand.vorlagenPapierkorb} im Papierkorb` : ""}
      </li>
      <li>{bestand.entwurf ? "ein angefangener Bogen (Entwurf)" : "kein angefangener Bogen"}</li>
      {bestand.rueckholplatz != null && (
        <li>der zuletzt geschlossene Bogen „{bestand.rueckholplatz}“ (Startseite, zum Zurückholen)</li>
      )}
      <li>{bestand.absender ? "die hinterlegte Absenderkarte" : "keine Absenderkarte"}</li>
      <li>
        {bestand.geraeteschluessel
          ? `der Signatur-Geräteschlüssel${kurzform ? ` (Kurzform ${kurzform})` : ""}${
              geraet ? " — Empfänger, die ihn kennen, sehen danach einen anderen" : ""
            }`
          : "kein Signatur-Geräteschlüssel"}
      </li>
    </ul>
  );
}

/** Belegter Gerätespeicher als Zeile mit Aufräum-Hinweis ab 70 %. */
function SpeicherStand() {
  const b = speicherBelegung();
  if (!b) return null;
  const groesste = b.anteil >= 0.7 ? groessteText() : "";
  return (
    <p className={b.anteil >= 0.7 ? "warnung" : "hinweis"} role="status">
      Belegter Speicher: etwa {speicherText(b)}.
      {b.anteil >= 0.7
        ? `${istVoll(b) ? " Er ist voll — die App kann nichts mehr speichern." : " Wird er voll, kann die App nichts mehr speichern."}${groesste ? ` Am meisten belegen: ${groesste}.` : ""} Platz schafft nur Löschen — alte Einsätze sichern, den Papierkorb leeren oder einen gesicherten Einsatz dort endgültig löschen; die Sicherung selbst schafft keinen Platz, und bei vollem Speicher kostet schon das Ablegen in den Papierkorb Platz.`
        : ""}
    </p>
  );
}
