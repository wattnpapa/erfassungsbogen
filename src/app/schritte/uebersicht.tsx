/**
 * Schritt 6 — Gesamtübersicht: Zusammenfassung aller Schritte, Vollständigkeits-
 * prüfung und die Übergabewege (QR, PDF, Link, Datei).
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Erfassungsbogen,
  KontaktArt,
  PersonalErfassung,
  datumZuIso,
  staerke,
  unterbringungMWD,
  verpflegung,
} from "@bos/eeb-format/model";
import { vorlageAnlegen } from "../vorlagen";
import { TabellenScroll } from "../tabellen-scroll";
import { RolleMarke } from "../rolle-marke";
import {
  QrSatz,
  bogenDateiname,
  bogenSpeichern,
  bytesAlsDatei,
  datumDeutsch,
  textAlsDatei,
  einheitAnzeigename,
  einheitOrt,
  fahrzeugSitzplaetze,
  funkrufText,
  funktionsText,
  kennzeichenText,
  kontaktText,
  natoZeitstempel,
  orgLabel,
  heuteDatum,
  pruefpunkte,
  zeitraumDeutsch,
  qrErzeugen,
  vokabText,
  vokabularFuer,
  zeitpunktDeutsch,
} from "../hilfen";
import { debugAktiv } from "../debug-plattform";
import { mwdText } from "../auswertung";
import { bogenCsvInhalt } from "../bogen-csv";
import { einheitSymbolSvg, svgDataUrl } from "../taktische-zeichen-bogen";
import {
  absenderLabel,
  kettenLabel,
  ketteVollstaendig,
  signaturLabel,
  type SignaturStatus,
} from "@bos/eeb-format/signatur";
import { absenderkarteLaden, type Absenderkarte } from "../absenderkarte";
import { AbsenderkarteFeld } from "../absenderkarte-ui";
import { geraeteKurzform, geraeteSchluesselNurSitzung, geraeteOeffentlichHex } from "../geraete-schluessel";
import { istNativ, linkTeilen, nahbereichDienst, pdfEinbettbar, shareSheetVerfuegbar, textTeilen } from "../nativ";
import { fehlerText, istNachladeFehler } from "../nachladen";
import { frageJaNein, frageText, zeigeHinweis } from "../dialoge";
import { SpeicherVollFehler, istSpeicherVoll } from "../eintrag-zeiten";
import { uebergabeText, type UebergabeStand, type UebergabeWeg } from "../uebergabe-stand";
import { ebeneBetreten, ebeneVerlassen, useEbeneZurueck, useModalesOverlay } from "../modal-overlay";
import {
  MWD_LEGENDE,
  STAERKE_LEGENDE,
  Vollstaendigkeit,
  staerkeVorlesen,
} from "./bausteine";

/** Stufenzahl im QR-Hinweis — nur nennen, wenn es tatsächlich ein Meldeweg ist. */
function stufenText(qr: QrSatz): string {
  return qr.stufen > 1 ? `, ${qr.stufen} Stufen` : "";
}

export function Uebersicht(props: {
  bogen: Erfassungsbogen;
  geheZu: (schritt: number, feld?: string) => void;
  neu: () => void;
  /**
   * Was mit dem offenen Bogen beim Schließen geschieht — ein Satz für die
   * Rückfrage und ob dabei etwas endgültig verloren geht (app.tsx,
   * folgenFuerOffenenBogen). Ohne ihn fällt die Rückfrage allgemein aus.
   */
  schliessenFolgen?: () => { satz: string; verlust: boolean };
  onVorlageGespeichert?: (name: string) => void;
  /**
   * Gesetzt, wenn der Bogen die Bearbeitung einer gespeicherten Vorlage ist
   * („Bearbeiten" auf der Vorlagenkarte). Dann ist „Vorlage aktualisieren" die
   * Hauptaktion — ein Einsatzbogen soll hier gar nicht erst entstehen — und
   * „Als Vorlage speichern" wird zu „Als neue Vorlage speichern".
   */
  vorlageBearbeitung?: { name: string; onAktualisieren: () => void };
  /** Signaturstatus des importierten Transports (Herkunft), falls der Bogen gescannt wurde. */
  signatur?: SignaturStatus | null;
  /**
   * Rohbytes des empfangenen Payloads. Solange der Bogen unverändert ist, reist
   * dieser Payload samt Original-Signatur weiter (dieses Gerät zeichnet nur
   * gegen) — sonst stünde beim nächsten Empfänger das eigene Gerät als Ursprung.
   */
  herkunft?: Uint8Array | null;
  /** Gesetzt, wenn der Bogen für eine Einsatz-Sammlung erfasst wird (Meldekopf/Zugführer). */
  sammelAktion?: { label: string; onUebernehmen: () => void };
  /**
   * Öffnet die Einsatz-Auswahl, um den offenen Bogen nachträglich in eine
   * Sammlung zu legen — der Meldekopf scannt/öffnet oft erst und entscheidet
   * dann, wohin der Bogen gehört. Im Sammelmodus überflüssig: dort führt
   * `sammelAktion` bereits in den vorgewählten Einsatz.
   */
  onInEinsatzAufnehmen?: () => void;
  /**
   * Einsatzdaten zurücksetzen (Zeitraum heute, Ort/Auftrag und Sofortbedarf
   * leer) — angeboten, wenn der Einsatzzeitraum vorbei ist (R2-S1).
   */
  onNeuerEinsatz?: () => void;
  /** Letzte Übergabe und der Rückruf, wenn übergeben wurde (R2-W2). */
  uebergabe?: UebergabeStand | null;
  /**
   * Was mit dem Bogen geschah (R3-H3): Weg und ob der Nutzer den Empfang
   * bestätigt hat. Ohne Bestätigung heißt der Vermerk nicht „Übergeben".
   */
  onUebergeben?: (weg: UebergabeWeg, bestaetigt?: boolean) => void;
  /** „Ist angekommen" zum letzten, unveränderten Vermerk (R3-H3). */
  onUebergabeBestaetigen?: () => void;
}) {
  const { bogen, geheZu, neu } = props;

  async function alsVorlageSpeichern() {
    const name = await frageText({
      titel: props.vorlageBearbeitung ? "Als neue Vorlage speichern" : "Als Vorlage speichern",
      label: "Name der Vorlage",
      vorgabe: props.vorlageBearbeitung ? "" : einheitAnzeigename(bogen.einheit),
      hinweis: props.vorlageBearbeitung
        ? `Legt eine zweite Vorlage neben „${props.vorlageBearbeitung.name}" an; die bleibt, wie sie war.`
        : "Die Vorlage bleibt auf diesem Gerät und lässt sich für den nächsten Einsatz mustern.",
      ok: "Vorlage speichern",
    });
    if (name == null) return;
    let v;
    try {
      v = vorlageAnlegen(name, bogen);
    } catch (e) {
      // Voller Speicher: der Dialog schloss ohne jede Meldung, nur die
      // Konsole wusste Bescheid (Audit Runde 2, R2-O2).
      await zeigeHinweis({
        titel: "Vorlage nicht gespeichert",
        text: istSpeicherVoll(e) ? new SpeicherVollFehler(e).message : String(e instanceof Error ? e.message : e),
      });
      return;
    }
    props.onVorlageGespeichert?.(v.name);
  }

  /**
   * Bogen schließen, zurück zur Startseite. Die Rückfrage sagte „… der
   * gespeicherte Entwurf gelöscht" — tatsächlich lag der Bogen danach unter
   * „Zuletzt geschlossenen Bogen zurückholen", und statt eines neuen Bogens kam
   * die Startseite. Jetzt steht da, was wirklich geschieht; „gefahr" nur,
   * wenn dabei wirklich etwas verloren geht (Audit Runde 2, R2-H9).
   */
  async function bogenVerwerfen() {
    const folgen = props.schliessenFolgen?.() ?? {
      satz: `„${einheitAnzeigename(bogen.einheit)}" bleibt auf der Startseite unter „Zuletzt geschlossenen Bogen zurückholen" erreichbar.`,
      verlust: false,
    };
    const sicher = await frageJaNein({
      titel: "Bogen schließen?",
      text: `Der Bogen wird geschlossen, nicht gelöscht. ${folgen.satz} Einen neuen Bogen beginnst du auf der Startseite.`,
      ok: "Schließen, zur Startseite",
      gefahr: folgen.verlust,
    });
    if (sicher) neu();
  }

  const [qr, setQr] = useState<QrSatz | null>(null);
  const [fehler, setFehler] = useState("");
  const [pdfLaeuft, setPdfLaeuft] = useState(false);
  // Quittung nach „PDF erzeugen": der Browser zeigt den Download oft nur kurz
  // oder gar nicht (Telefon), die App sagte nichts — also wurde ein zweites
  // Mal getippt und die Mail an den Meldekopf trug zwei Anhänge. Steht bis
  // zum nächsten PDF oder bis der Dialog geschlossen wird.
  const [pdfQuittung, setPdfQuittung] = useState("");
  // Fehler von „PDF erzeugen": steht direkt unter dem Knopf, nicht unten im
  // Dialog, wo er hinter „Weitere Formate" außerhalb des Bildes lag (R4-O2).
  const [pdfFehler, setPdfFehler] = useState("");
  const pdfFehlerZeile = useRef<HTMLParagraphElement>(null);
  // Der Dialog scrollt: Die Meldung rollt ins Bild, auch wenn sie unter dem
  // Rand erscheint (R4-O2).
  useEffect(() => {
    if (pdfFehler) pdfFehlerZeile.current?.scrollIntoView?.({ block: "nearest" });
  }, [pdfFehler]);
  // Vollbild-QR zum Vorzeigen (Handy-zu-Tablet-Scan ohne Papier); bei
  // Segmentierung blättert `vollbildTeil` durch die Teile.
  const [vollbild, setVollbild] = useState(false);
  const [vollbildTeil, setVollbildTeil] = useState(0);
  // Welche Teile dieses Codes schon im Vollbild standen — über das Schließen
  // hinaus: Wieder geöffnet, beginnt das Vollbild beim ersten fehlenden Teil
  // statt bei Teil 1 (Audit Runde 4, R4-M5). Ein neuer Code fängt neu an.
  const [vollbildGezeigt, setVollbildGezeigt] = useState<ReadonlySet<number>>(() => new Set());
  useEffect(() => setVollbildGezeigt(new Set()), [qr]);
  // „Bogen übergeben": ein Dialog bündelt alle Transportwege (QR/PDF/Link/Datei).
  const teilenDialog = useRef<HTMLDialogElement>(null);
  /* Einmal geprüft, zweimal gezeigt: in der Leitzeile dieser Ansicht und im
     Übergabe-Dialog. Dort ist es der letzte Moment, in dem die Lücke noch
     auffallen kann — wer bis zum QR-Code durchgetippt hat, hat die Warnung
     oben längst weggescrollt. */
  const offenePunkte = pruefpunkte(bogen, true, heuteDatum());
  const zeitraumVorbei = bogen.einsatz.zeitraumBis < heuteDatum();
  const [schluesselKurz, setSchluesselKurz] = useState<string | null>(null);
  // Geräteschlüssel ließ sich nicht speichern: das Siegel gilt nur für diese
  // Sitzung (R3-E1). Code und PDF entstehen trotzdem.
  const [nurSitzung, setNurSitzung] = useState(false);
  // Freiwillige Absenderangaben zur Signatur. Als Effekt-Abhängigkeit geführt:
  // eine geänderte Karte ändert den signierten Payload → QR neu erzeugen.
  const [absender, setAbsender] = useState<Absenderkarte>(() => absenderkarteLaden());
  const [linkKopiert, setLinkKopiert] = useState(false);
  // Eingebettete PDF-Vorschau (nur Browser/Desktop): auf Wunsch erzeugt,
  // verworfen sobald der Bogen sich ändert (dann wäre sie veraltet).
  const [vorschauUrl, setVorschauUrl] = useState<string | null>(null);
  const [vorschauLaeuft, setVorschauLaeuft] = useState(false);
  /**
   * Blob-URLs der Vorschau leben bis zum Tab-Ende weiter, also beim Ersetzen
   * (und beim Verlassen der Ansicht) die alte freigeben — sonst sammelt eine
   * längere Sitzung jede erzeugte PDF im Speicher an.
   */
  const vorschauSetzen = (neu: string | null) =>
    setVorschauUrl((alt) => {
      if (alt) URL.revokeObjectURL(alt);
      return neu;
    });
  const vorschauRef = useRef<string | null>(null);
  vorschauRef.current = vorschauUrl;
  useEffect(
    () => () => {
      if (vorschauRef.current) URL.revokeObjectURL(vorschauRef.current);
    },
    [],
  );
  // Nahbereichs-Dienst des Systems (AirDrop/Quick Share) — nur Beschriftung.
  const nahDienst = nahbereichDienst();
  const org = bogen.einheit.organisation;
  const s = staerke(bogen);
  // Schnellerfassung des Meldekopfs: Stärke als Summe, absichtlich ohne Namen.
  const nurStaerke = bogen.personalErfassung === PersonalErfassung.NUR_STAERKE;
  const staerkeText = `${s.fuehrer} / ${s.unterfuehrer} / ${s.mannschaft} / ${s.gesamt}`;
  const mwd = unterbringungMWD(bogen);
  const vp = verpflegung(bogen);
  /**
   * Bei der Schnellerfassung ohne manuelle Aufteilung steht schlicht nichts zur
   * Unterbringung und zur Ernährung im Bogen. Die abgeleitete Null las sich
   * dort aber wie eine Meldung („niemand braucht ein Bett"), obwohl neun
   * Personen gemeldet waren — deshalb wird sie hier als fehlende Angabe
   * gezeigt.
   */
  const mwdAngegeben = !nurStaerke || bogen.unterbringungManuell != null;
  const vpAufteilungAngegeben = !nurStaerke || bogen.verpflegungManuell != null;
  const mwdAnzeige = mwdAngegeben ? mwdText(mwd) : "keine Angabe";
  /**
   * „Unterbringung: M 9 / W 0 / D 0" stand auch ohne angeforderte
   * Unterbringung da und las sich wie „9 Mann brauchen ein Quartier" — „M"
   * hieß in derselben Zeile Mannschaft (Audit Runde 3, R3-N3). Die Zahl ist
   * die Aufteilung nach Geschlecht; „Unterbringung" heißt sie nur, wenn der
   * Bogen Unterbringung anfordert.
   */
  const mwdTitel = bogen.sofortbedarf?.unterbringung ? "Unterbringung" : "Geschlecht";
  /**
   * Spalten, die für diesen Bogen nirgends etwas enthalten, werden nicht
   * gezeigt. Sonst nimmt „Erreichbarkeit" ein Drittel der Personaltabelle für
   * acht leere Zellen ein und drückt die Tabelle auf dem Telefon über den
   * Kartenrand — die eigentliche Auskunft wird abgeschnitten, damit Leere
   * Platz bekommt. Optionale Angaben ohne Inhalt sind keine Information.
   */
  const zeigeErreichbarkeit = bogen.personal.some((p) => p.kontakte.some((k) => kontaktText(k) !== ""));
  const zeigeFunkruf = bogen.fahrzeuge.some((f) => funkrufText(f, bogen.einheit) !== "");
  const zeigeAenderungen = bogen.fahrzeuge.some((f) => (f.aenderungen ?? "") !== "");

  useEffect(() => {
    let aktiv = true;
    vorschauSetzen(null); // Bogen geändert → alte PDF-Vorschau wäre veraltet
    (async () => {
      try {
        // Eigener/bearbeiteter Bogen: mit dem Geräteschlüssel signiert.
        // Unverändert empfangener Bogen: Original-Payload gegengezeichnet.
        const q = await qrErzeugen(bogen, props.herkunft);
        if (aktiv) setQr(q);
        if (aktiv) setNurSitzung(geraeteSchluesselNurSitzung());
        geraeteKurzform().then((k) => aktiv && setSchluesselKurz(k));
      } catch (e) {
        // Nie Programmtext (R3-E1): fehlerText übersetzt auch den vollen Speicher.
        if (aktiv) setFehler(`QR-Code: ${fehlerText(e)}`);
      }
    })();
    return () => {
      aktiv = false;
    };
  }, [bogen, absender, props.herkunft]);

  // Vollbild-QR = Vorzeige-Moment: der Bildschirm darf dabei nicht ausgehen.
  // Wake Lock anfordern, nach Tab-Wechsel erneut (das System gibt ihn dann frei);
  // ohne Browser-Unterstützung passiert einfach nichts.
  useEffect(() => {
    if (!vollbild) return;
    let lock: WakeLockSentinel | null = null;
    let aktiv = true;
    const anfordern = async () => {
      try {
        lock = (await navigator.wakeLock?.request("screen")) ?? null;
      } catch {
        /* nicht verfügbar (z. B. Energiesparmodus) — kein Beinbruch */
      }
    };
    void anfordern();
    const sichtbar = () => {
      if (aktiv && document.visibilityState === "visible") void anfordern();
    };
    document.addEventListener("visibilitychange", sichtbar);
    return () => {
      aktiv = false;
      document.removeEventListener("visibilitychange", sichtbar);
      lock?.release().catch(() => {});
    };
  }, [vollbild]);

  async function vorschauLaden() {
    setVorschauLaeuft(true);
    setFehler("");
    try {
      // Dynamisch: pdfmake samt eingebetteter Schriften bleibt aus dem
      // Start-Bundle heraus und wird erst beim ersten PDF geladen.
      const { pdfBlobUrl } = await import("../pdf");
      vorschauSetzen(await pdfBlobUrl(bogen, props.herkunft));
    } catch (e) {
      setFehler(`PDF-Vorschau: ${fehlerText(e)}`);
    } finally {
      setVorschauLaeuft(false);
    }
  }

  async function schluesselTeilen() {
    const hex = await geraeteOeffentlichHex();
    if (!hex) return;
    const text = `EEB-Signaturschlüssel (öffentlich)\nKurzform: ${schluesselKurz ?? ""}\n${hex}`;
    if (istNativ()) {
      await textTeilen("eeb-signaturschluessel.txt", text);
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(hex);
      setFehler("");
      await zeigeHinweis({
        titel: "Öffentlicher Schlüssel kopiert",
        text: "Der Schlüssel liegt in der Zwischenablage — die Gegenstelle kann damit prüfen, dass Bögen von diesem Gerät stammen.",
        kopiertext: hex,
      });
    } else {
      // Ohne Zwischenablage bleibt das Markieren von Hand — der Text steht dafür da.
      await zeigeHinweis({ titel: "Öffentlicher Schlüssel", text: "Zum Weitergeben markieren und kopieren:", kopiertext: hex });
    }
  }

  /**
   * Bogen-Link ins System-Share-Sheet geben (AirDrop, Quick Share, Messenger,
   * Mail …). Nativ übernimmt das Capacitor-Plugin, im Browser die Web Share
   * API — beide öffnen dasselbe Fenster des Betriebssystems.
   */
  async function linkInsShareSheet(url: string): Promise<void> {
    const titel = `Erfassungsbogen ${einheitAnzeigename(bogen.einheit)}`;
    if (istNativ()) await linkTeilen(titel, url);
    else await navigator.share({ title: titel, text: titel, url });
  }

  /**
   * Übergabe aufs Nachbargerät: AirDrop bzw. Quick Share stehen im Share-Sheet
   * und arbeiten ohne Netz und ohne vorherige Kopplung. Der Link trägt den
   * kompletten signierten Bogen — auch einen, der für einen einzelnen QR-Code
   * zu groß wäre und sonst in Teilen gescannt werden müsste.
   */
  async function anGeraetInDerNaeheSenden() {
    if (!qr) return;
    setFehler("");
    try {
      await linkInsShareSheet(qr.vollUrl);
      props.onUebergeben?.("nah");
    } catch (e) {
      // Abbruch im Share-Dialog ist kein Fehler
      if (e instanceof Error && e.name === "AbortError") return;
      setFehler(`Senden: ${e instanceof Error ? e.message : e}`);
    }
  }

  async function bogenLinkTeilen() {
    if (!qr) return;
    const url = qr.vollUrl;
    try {
      if (shareSheetVerfuegbar()) {
        await linkInsShareSheet(url);
        props.onUebergeben?.("link");
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        props.onUebergeben?.("kopiert");
        setLinkKopiert(true);
        window.setTimeout(() => setLinkKopiert(false), 3000);
      } else {
        await zeigeHinweis({ titel: "Bogen-Link", text: "Zum Weitergeben markieren und kopieren:", kopiertext: url });
      }
    } catch (e) {
      // Abbruch im Share-Dialog ist kein Fehler
      if (e instanceof Error && e.name === "AbortError") return;
      setFehler(`Link teilen: ${e instanceof Error ? e.message : e}`);
    }
  }

  async function csv() {
    setFehler("");
    try {
      await textAlsDatei(`eeb-${bogenDateiname(bogen)}.csv`, bogenCsvInhalt(bogen), "text/csv;charset=utf-8");
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return; // Abbruch im Share-Dialog
      setFehler(`CSV: ${e instanceof Error ? e.message : e}`);
    }
  }

  /**
   * Fremdformat der Führungsstelle — dynamisch geladen, damit der
   * XLSX-Schreiber samt Stiltabelle nicht im Start-Bundle liegt (wie bei der PDF).
   */
  async function oldenburgXlsx() {
    setFehler("");
    try {
      const { XLSX_MIME, bogenOldenburgXlsx } = await import("../oldenburg-xlsx");
      await bytesAlsDatei(`eeb-${bogenDateiname(bogen)}-oldenburg.xlsx`, bogenOldenburgXlsx(bogen), XLSX_MIME);
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return; // Abbruch im Share-Dialog
      setFehler(`Excel: ${fehlerText(e)}`);
    }
  }

  async function blanko() {
    setFehler("");
    try {
      const { blankoPdfErzeugen } = await import("../pdf");
      await blankoPdfErzeugen();
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return; // Abbruch im Teilen-Fenster
      setFehler(`Blanko-Vordruck: ${fehlerText(e)}`);
    }
  }

  async function pdf() {
    setPdfLaeuft(true);
    setFehler("");
    setPdfQuittung("");
    setPdfFehler("");
    // Der Dateiname wird HIER gebildet und an pdfErzeugen übergeben, nicht
    // dort erraten: so nennt die Quittung genau die Datei, die entstanden ist
    // — auch wenn der Minutenwechsel des Zeitstempels dazwischenfällt. Die
    // Bauart (eeb-<NATO-Zeit>_<Einheit>.pdf) ist dieselbe wie in pdf.ts.
    const dateiname = `eeb-${natoZeitstempel()}_${bogenDateiname(bogen)}.pdf`;
    try {
      const { pdfErzeugen } = await import("../pdf");
      await pdfErzeugen(bogen, dateiname, props.herkunft);
      // „PDF erzeugt", nicht „Übergeben": die Datei liegt erst auf diesem
      // Gerät (Audit Runde 3, R3-A7).
      props.onUebergeben?.("pdf");
      // In der App gibt es keinen Download: die PDF ging ins Teilen-Fenster
      // des Systems — dort heißt „fertig" etwas anderes als im Browser.
      setPdfQuittung(
        istNativ()
          ? `PDF erstellt und im Teilen-Fenster übergeben: ${dateiname}`
          : `PDF gespeichert: ${dateiname} — liegt im Download-Ordner des Browsers.`,
      );
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return; // Abbruch im Teilen-Fenster
      // Der Ausweg gehört zur Meldung: Fehlt der PDF-Baustein (Netz weg vor dem
      // Vorrat), geht der QR-Code in derselben Lage (R4-O2).
      setPdfFehler(
        istNachladeFehler(e)
          ? "PDF nicht möglich: Der PDF-Baustein ist noch nicht geladen. Ohne Netz geht jetzt nur der QR-Code — mit Netz die Seite einmal neu laden."
          : `PDF: ${fehlerText(e)} Der QR-Code geht trotzdem.`,
      );
    } finally {
      setPdfLaeuft(false);
    }
  }

  const abschnitt = (titel: string, schritt: number, inhalt: ReactNode) => (
    <section className="karte" key={titel}>
      <div className="kopfzeile">
        <h2>{titel}</h2>
        <button type="button" onClick={() => geheZu(schritt)}>Bearbeiten</button>
      </div>
      {inhalt}
    </section>
  );

  return (
    <>
      <section className="karte">
        <div className="kopfzeile">
          <h2>Gesamtübersicht</h2>
          {/* Eine primäre Aktion, klar herausgehoben; die selteneren Wege
              stehen als Nebenaktionen abgesetzt daneben, statt als vier
              gleichrangige Knöpfe um den Blick zu konkurrieren. */}
          <span className="uebersicht-aktionen">
            {props.vorlageBearbeitung ? (
              // Vorlagen-Bearbeitung: das Ziel ist die gespeicherte Vorlage,
              // nicht ein Empfänger — Übergabe und Sammlung treten zurück.
              <button type="button" className="primaer" onClick={props.vorlageBearbeitung.onAktualisieren}>
                Vorlage aktualisieren
              </button>
            ) : props.sammelAktion ? (
              <button type="button" className="primaer" onClick={props.sammelAktion.onUebernehmen}>
                {props.sammelAktion.label}
              </button>
            ) : (
              // Ein Weg zum Ziel: QR, Nahbereich (AirDrop/Quick Share), PDF,
              // Link und Datei tragen denselben Bogen — der Dialog bündelt sie.
              <button type="button" className="primaer" onClick={() => teilenDialog.current?.showModal()}>
                Bogen übergeben…
              </button>
            )}
            <span className="neben-aktionen">
              {(props.sammelAktion || props.vorlageBearbeitung) && (
                <button type="button" onClick={() => teilenDialog.current?.showModal()}>Bogen übergeben…</button>
              )}
              {!props.sammelAktion && !props.vorlageBearbeitung && props.onInEinsatzAufnehmen && (
                <button type="button" onClick={props.onInEinsatzAufnehmen}>In Einsatz-Sammlung ablegen…</button>
              )}
              <button type="button" onClick={alsVorlageSpeichern}>
                {props.vorlageBearbeitung ? "Als neue Vorlage speichern" : "Als Vorlage speichern"}
              </button>
              {/* „Bogen schließen" statt „Neuer Bogen": Der Knopf schließt nur
                  und führt zur Startseite (R3-H7, R3-N6). */}
              <button type="button" onClick={() => void bogenVerwerfen()}>Bogen schließen</button>
            </span>
          </span>
        </div>
        {fehler && <p className="fehler">{fehler}</p>}
        {props.signatur && props.signatur.zustand !== "unsigniert" && (
          <p className={`signatur-herkunft ${props.signatur.zustand}`} role="status">
            Empfangen als: <strong>{signaturLabel(props.signatur)}</strong>
            {props.signatur.zustand === "gueltig"
              ? " — Herkunft belegt (nicht die Identität des Absenders)."
              : " — die Daten passen nicht zur Signatur."}
            {/* Weitergereichter Bogen: der Meldeweg als Kette. Die äußere
                Signatur sagt nur, wer übergeben hat — wer ihn erstellt hat,
                steht am Anfang der Kette. */}
            {kettenLabel(props.signatur) && (
              <>
                <br />
                Meldeweg: <strong>{kettenLabel(props.signatur)}</strong>
                {ketteVollstaendig(props.signatur)
                  ? " — jede Stufe hat denselben Bogen gezeichnet."
                  : " — eine Stufe der Kette ist nicht gedeckt; der Ursprung ist damit unbelegt."}
              </>
            )}
            {/* Die Absenderkarte ist mitsigniert, aber selbst gesetzt: als
                Rückfrage-Kontakt brauchbar, als Identitätsnachweis nicht. */}
            {props.signatur.zustand === "gueltig" && props.signatur.absender && (
              <>
                <br />
                Eigene Angabe des Absenders: <strong>{absenderLabel(props.signatur.absender)}</strong>{" "}
                — bei Zweifeln über diesen Kontakt zurückfragen.
              </>
            )}
          </p>
        )}
        {/* Erst wer, dann wie es um den Bogen steht: das taktische Zeichen mit
            Name und Stärke ist die Auskunft, wegen der die Ansicht geöffnet
            wird — die Vollständigkeitsprüfung ist ihr Befund und steht danach. */}
        <div className="einheit-kopf leitzeile">
          <img
            className="einheit-avatar gross"
            src={svgDataUrl(einheitSymbolSvg(bogen.einheit))}
            alt="Taktisches Zeichen der Einheit"
          />
          <div>
            <p className="einheit-name">
              {orgLabel(org)}
              {" · "}{vokabText(bogen.einheit.einheitsTyp, vokabularFuer(org, "einheitstyp"), "name") || "(Einheitstyp offen)"}
              {" · "}{einheitOrt(bogen.einheit) || "(Standort offen)"}
            </p>
            <p className="einheit-staerke">
              <span>
                Stärke{" "}
                <strong title={STAERKE_LEGENDE} aria-label={`Stärke: ${staerkeVorlesen(s)}`}>
                  {s.fuehrer} / {s.unterfuehrer} / {s.mannschaft} / {s.gesamt}
                </strong>{" "}
                {/* Kurzlegende sichtbar statt nur im Tooltip (R2-N9). */}
                <span className="hinweis" aria-hidden="true">(F / UF / M / Ges)</span>
              </span>
              <span title={MWD_LEGENDE}>{mwdTitel}: {mwdAnzeige}</span>
            </p>
          </div>
        </div>
        {/* Hat der Meldekopf den aktuellen Stand? (R2-W2) */}
        {(() => {
          const u = uebergabeText(bogen, props.uebergabe);
          if (!u) return null;
          return (
            <>
              <p className={u.geaendert ? "warnung" : "hinweis"} role="status">{u.text}</p>
              {/* Die App weiß nicht, ob etwas ankam — der Nutzer kann es
                  ausdrücklich bestätigen (R3-H3, R3-A7). */}
              {u.offen && props.onUebergabeBestaetigen && (
                <p>
                  <button type="button" onClick={props.onUebergabeBestaetigen}>
                    Gegenstelle hat ihn — als übergeben vermerken
                  </button>
                </p>
              )}
            </>
          );
        })()}
        <Vollstaendigkeit punkte={offenePunkte} geheZu={geheZu} />
      </section>

      {/* Einheit und Einsatz beantworten zusammen „wer, wo, wann" und tragen je
          nur eine Handvoll kurzer Paare. Als volle Kartenbreite standen sie zu
          knapp der Hälfte leer und der Blick musste zweimal ganz nach links
          zurück; nebeneinander bilden sie einen Block. Schmal stapeln sie. */}
      <div className="karten-paar">
      {abschnitt("Einheit", 0, (
        <dl className="paare">
          <dt>Organisation</dt><dd>{orgLabel(org)}{bogen.einheit.organisationName ? ` — ${bogen.einheit.organisationName}` : ""}</dd>
          <dt>Einheitstyp</dt><dd>{vokabText(bogen.einheit.einheitsTyp, vokabularFuer(org, "einheitstyp"), "name") || "—"}</dd>
          {/* <div> statt <span>: in einer Definitionsliste ist nur <div> als
              Gruppierung zulässig, und Vorlesesoftware verliert sonst den
              Bezug zwischen Ebene und Name. `display: contents` hält die
              Paare weiterhin im Raster der Liste. */}
          {bogen.einheit.hierarchie.map((h, i) => (
            <div key={i} style={{ display: "contents" }}>
              <dt>{vokabText(h.bezeichnung, vokabularFuer(org, "ebene")) || "Ebene"}</dt>
              <dd>{h.name}{h.kurz ? ` (${h.kurz})` : ""}{h.telefon ? ` · ${h.telefon}` : ""}{h.email ? ` · ${h.email}` : ""}</dd>
            </div>
          ))}
        </dl>
      ))}

      {abschnitt("Einsatz", 1, (
        <dl className="paare">
          <dt>Zeitraum</dt><dd>{datumDeutsch(datumZuIso(bogen.einsatz.zeitraumVon))} – {datumDeutsch(datumZuIso(bogen.einsatz.zeitraumBis))}</dd>
          <dt>Ort / Auftrag</dt><dd>{bogen.einsatz.ortAuftrag || "—"}</dd>
          <dt>Beginn / Ende</dt>
          <dd>
            {bogen.einsatz.einsatzbeginn != null ? zeitpunktDeutsch(bogen.einsatz.einsatzbeginn) : "—"}
            {" / "}
            {bogen.einsatz.einsatzende != null ? zeitpunktDeutsch(bogen.einsatz.einsatzende) : "—"}
            {/* Die Zeiten des Meldekopfs kommen nicht in diesen Bogen zurück;
                ohne eigenen Eintrag trägt das PDF keine Einsatzzeiten (R2-W4). */}
            {(bogen.einsatz.einsatzbeginn == null || bogen.einsatz.einsatzende == null) && (
              <span className="hinweis">
                {" "}— für eigene Nachweise in Schritt 2 eintragen; die Zeiten des Meldekopfs kommen nicht hierher zurück.
              </span>
            )}
          </dd>
        </dl>
      ))}
      </div>

      {/* Leer trug die Karte bisher nur die Spaltenköpfe — eine Versalzeile
          über nichts, die aussieht, als sei die Tabelle abgeschnitten. Ein
          Satz sagt stattdessen, was fehlt; dieselbe Auskunft wie in der
          Einsatz-Sammlung, damit „nichts erfasst" überall gleich klingt. */}
      {/* Bei der Schnellerfassung („nur Stärke") gibt es absichtlich keine
          Namensliste. „Personal (0) — kein Personal erfasst" stand dann direkt
          unter einer gemeldeten Stärke von neun und las sich wie ein Fehler;
          die Überschrift nennt deshalb die gemeldete Stärke. */}
      {abschnitt(
        nurStaerke
          ? `Personal (Stärke ${staerkeText})`
          : `Personal (${bogen.personal.length})`,
        2,
        bogen.personal.length === 0 ? (
        <p className="hinweis">
          {nurStaerke
            ? `Stärke ${staerkeText} als Summe gemeldet — ohne Namensliste (Meldekopf-Schnellerfassung).`
            : "Kein Personal erfasst."}
        </p>
      ) : (
        <TabellenScroll titel="Personal">
        <table className="uebersicht">
          <thead>
            <tr>
              {/* Die Rolle führt die Zeile an: sie ist die Auskunft, nach der
                  in der Liste gesucht wird („wer ist hier Unterführer?"), und
                  die Funktion daneben sagt dann, welcher — GrFü, TrFü, … */}
              <th title={STAERKE_LEGENDE}>Rolle</th>
              <th>Funktion / Zusatzfunktion</th>
              <th>Name, Vorname</th>
              {zeigeErreichbarkeit && <th>Erreichbarkeit</th>}
            </tr>
          </thead>
          <tbody>
            {bogen.personal.map((p, i) => (
              <tr key={i}>
                <td><RolleMarke rolle={p.staerkeRolle} /></td>
                <td>{funktionsText(p, org) || "—"}</td>
                <td>{p.nachname}{p.nachname && p.vorname ? ", " : ""}{p.vorname}</td>
                {zeigeErreichbarkeit && <td>{p.kontakte.map(kontaktText).join(" · ")}</td>}
              </tr>
            ))}
          </tbody>
        </table>
        </TabellenScroll>
      ))}

      {abschnitt(`Fahrzeuge (${bogen.fahrzeuge.length})`, 3, bogen.fahrzeuge.length === 0 ? (
        <p className="hinweis">Keine Fahrzeuge erfasst.</p>
      ) : (
        <TabellenScroll titel="Fahrzeuge">
        <table className="uebersicht">
          <thead>
            <tr>
              <th>Typ</th>
              <th>Kennzeichen</th>
              {zeigeFunkruf && <th>Funkrufname</th>}
              <th>Sitzplätze</th>
              <th>StAN</th>
              {zeigeAenderungen && <th>Änderungen</th>}
            </tr>
          </thead>
          <tbody>
            {bogen.fahrzeuge.map((f, i) => (
              <tr key={i}>
                <td>{vokabText(f.typ, vokabularFuer(org, "fahrzeug")) || "—"}</td>
                <td>{kennzeichenText(f)}</td>
                {zeigeFunkruf && <td>{funkrufText(f, bogen.einheit)}</td>}
                <td>{fahrzeugSitzplaetze(f, org) ?? "—"}</td>
                <td>{f.stanKonform == null ? "—" : f.stanKonform ? "ja" : "nein"}</td>
                {zeigeAenderungen && <td>{f.aenderungen ?? ""}</td>}
              </tr>
            ))}
          </tbody>
        </table>
        </TabellenScroll>
      ))}

      {abschnitt("Sofortbedarf & Sonstiges", 4, (
        <dl className="paare">
          <dt>Verpflegung</dt>
          <dd>
            {bogen.sofortbedarf
              ? `${bogen.sofortbedarf.verpflegungPersonen} Personen` +
                (vpAufteilungAngegeben
                  ? `, davon ${vp.vegetarisch} vegetarisch, ${vp.vegan} vegan`
                  : " · Aufteilung vegetarisch/vegan: keine Angabe")
              : "—"}
          </dd>
          <dt>Betriebsstoff</dt>
          <dd>
            {bogen.sofortbedarf
              ? `${bogen.sofortbedarf.dieselLiter} l Diesel / ${bogen.sofortbedarf.benzinLiter} l Benzin / ${bogen.sofortbedarf.gemischLiter} l Gemisch`
              : "—"}
          </dd>
          <dt>Unterbringung / Ruhezeit</dt>
          <dd>{bogen.sofortbedarf ? `${bogen.sofortbedarf.unterbringung ? "Unterbringung" : "keine Unterbringung"} · ${bogen.sofortbedarf.ruhezeitErforderlich ? "Ruhezeit erforderlich" : "keine Ruhezeit"}` : "—"}</dd>
          <dt>Sonstiges</dt><dd>{bogen.sonstiges || "—"}</dd>
        </dl>
      ))}

      {/* Ab hier verlässt der Bogen das Gerät: Vorschau und QR gehören zusammen
          und nicht mehr zu den Datenabschnitten darüber. Der größere Abstand
          davor ist der einzige Absatz der Ansicht — ohne ihn stapeln sich acht
          gleich weit auseinanderstehende Karten ohne erkennbare Gliederung. */}
      <div className="transport-gruppe">
      {/* Eingebettete PDF-Vorschau: man sieht, was der Meldekopf bekommt, bevor
          gedruckt wird. Nur im Browser — die native App zeigt PDFs im Share-Sheet,
          und mobile WebViews rendern eingebettete PDFs nicht zuverlässig. */}
      {!istNativ() && !pdfEinbettbar() && (
        // Browser ohne PDF-Betrachter (Chrome auf Android): der Rahmen bliebe
        // eine Fehlerseite. Stattdessen die Datei selbst — die öffnet das
        // Telefon mit der PDF-App, die es ohnehin hat.
        <section className="karte">
          <div className="kopfzeile">
            <h2>PDF</h2>
            <button type="button" className={pdfLaeuft ? "arbeitet" : ""} aria-busy={pdfLaeuft || undefined} onClick={pdf} disabled={pdfLaeuft}>
              {pdfLaeuft ? "PDF wird erstellt…" : "PDF herunterladen"}
            </button>
          </div>
          <p className="hinweis">
            Dieser Browser kann PDFs nicht in der Seite anzeigen. Die heruntergeladene Datei öffnet
            sich mit dem PDF-Betrachter des Telefons.
          </p>
        </section>
      )}
      {pdfEinbettbar() && (
        <section className="karte">
          <div className="kopfzeile">
            <h2>PDF-Vorschau</h2>
            {/* „arbeitet" muss sich von „gesperrt" unterscheiden: der graue
                Knopf mit dem Text „Vorschau wird erzeugt…" sah wie ein
                deaktivierter Knopf aus (dieselbe 0.4 Deckkraft), und das
                Setzen des Bogens samt QR-Code dauert auf einem Telefon
                mehrere Sekunden — unter Zeitdruck wurde mehrfach getippt.
                Die Klasse hält Schrift und Linie stark, die Statuszeile
                darunter sagt in Worten, was läuft. */}
            <button
              type="button"
              className={vorschauLaeuft ? "arbeitet" : ""}
              aria-busy={vorschauLaeuft || undefined}
              onClick={vorschauLaden}
              disabled={vorschauLaeuft}
            >
              {vorschauLaeuft ? "Vorschau wird erzeugt…" : vorschauUrl ? "Vorschau aktualisieren" : "Vorschau anzeigen"}
            </button>
          </div>
          {vorschauLaeuft && (
            <p className="hinweis arbeitet-zeile" role="status">
              Der Bogen wird gesetzt und der QR-Code gerechnet — das dauert auf dem Telefon
              einige Sekunden. Die App arbeitet, sie hängt nicht.
            </p>
          )}
          {vorschauUrl ? (
            <iframe className="pdf-rahmen" src={vorschauUrl} title="PDF-Vorschau des Erfassungsbogens" />
          ) : (
            <p className="hinweis">
              Zeigt den fertigen Bogen im Papier-Layout, ohne ihn herunterzuladen — die PDF entsteht direkt im Browser.
            </p>
          )}
        </section>
      )}

      <section className="karte qr-box">
        <h2>QR-Code (Offline-Transport)</h2>
        {qr ? (
          qr.segmentiert ? (
            <>
              <p className="hinweis">
                Bogen zu groß für einen Code — in {qr.teile.length} Teile aufgeteilt. Alle Teile
                nacheinander scannen; die App setzt sie zusammen. Auch auf der letzten PDF-Seite.
              </p>
              <div className="qr-teile">
                {qr.teile.map((t) => (
                  <figure key={t.teilNr}>
                    <img src={t.datenUrl} alt={`EEB2-QR-Code Teil ${t.teilNr} von ${t.anzahl}`} />
                    <figcaption>Teil {t.teilNr} / {t.anzahl}</figcaption>
                  </figure>
                ))}
              </div>
            </>
          ) : (
            <>
              <img src={qr.teile[0]!.datenUrl} alt="EEB2-QR-Code" />
              <p className="hinweis">
                Öffnet beim Scannen mit der Kamera die App; dieser Code steht auch auf der letzten PDF-Seite.
              </p>
            </>
          )

        ) : (
          <p className="hinweis">QR-Code wird erzeugt…</p>
        )}
        {/* Kein zweiter „Vollbild"-Knopf hier: die QR-Box ist Nachweis- und
            Signaturfläche, der Vorzeige-Weg läuft über „Bogen übergeben…" →
            „QR-Code im Vollbild zeigen" (eine primäre Tür). */}
        <div className="signatur-optionen">
          {/* Beim Weiterreichen ist die wichtigste Aussage, WESSEN Signatur der
              Code trägt — sonst hielte der nächste Empfänger dieses Gerät für
              den Ursprung. */}
          {qr?.weitergeleitet && (
            <p className="hinweis">
              <strong>Unveränderter Bogen von fremder Stelle:</strong> Der Code trägt weiterhin die
              Original-Signatur; dieses Gerät hat nur gegengezeichnet (Weitergabe bezeugt). Sobald
              hier etwas bearbeitet wird, ist es ein eigener Bogen und wird allein selbst signiert.
            </p>
          )}
          {/* Kern sichtbar, Technik im Ausklapper: am Vorzeige-Punkt zählt „wer
              hat signiert", nicht Kurvenname und Byte-Zahl. „Echtheits-Siegel"
              bleibt der Leitbegriff (auch auf der Startseite); Ed25519 & Co.
              stehen nur noch unter „Was das Siegel belegt". */}
          {/* Die Kurzform (Hex-Ziffern) steht im Aufklapper: in der Karte las
              sie sich wie etwas, das man abschreiben oder vergleichen müsste,
              an der Stelle, an der nur der QR-Code gezeigt werden soll (Audit
              „Neuer Nutzer", F7). Gebraucht wird sie beim Abgleich mit der
              Gegenstelle — dafür ist sie einen Tipp entfernt. */}
          <p className="hinweis">
            {qr?.weitergeleitet ? "Gegengezeichnet" : "Signiert"} mit dem Echtheits-Siegel dieses Geräts.
          </p>
          {nurSitzung && (
            <p className="hinweis" role="status">
              Das Siegel gilt nur, solange diese Seite offen ist: Der Speicher nimmt den Geräteschlüssel
              gerade nicht an. Code und PDF sind vollständig; die Gegenstelle sieht bei einer späteren
              Übergabe ein anderes Siegel dieses Geräts.
            </p>
          )}
          <details className="signatur-detail">
            <summary>Was das Siegel belegt</summary>
            <p className="hinweis">
              Kurzform des Siegels: <strong>{schluesselKurz ?? "Schlüssel wird erzeugt…"}</strong> — die
              Gegenstelle sieht dieselben Zeichen beim Einlesen.
            </p>
            <p className="hinweis">
              Es belegt Herkunft und Integrität, nicht die Identität — der private Schlüssel bleibt
              auf dem Gerät. Technisch eine Ed25519-Signatur (+97 Byte je Bogen){qr ? ` · Format EEB2C${stufenText(qr)}` : ""}.
              {schluesselKurz && (
                <>
                  {" · "}
                  <button type="button" className="link" onClick={schluesselTeilen}>
                    öffentlichen Schlüssel anzeigen/teilen
                  </button>
                </>
              )}
            </p>
          </details>
          <AbsenderkarteFeld karte={absender} onGespeichert={setAbsender} />
        </div>
      </section>
      </div>

      <dialog
        ref={teilenDialog}
        aria-label="Bogen übergeben"
        className="teilen-dialog"
        // Beim nächsten Öffnen beginnt der Dialog ohne alte Quittung — sonst
        // stünde „PDF gespeichert" von gestern unter einem frischen Bogen.
        onClose={() => {
          setPdfQuittung("");
          setPdfFehler("");
        }}
      >
        <div className="kopfzeile">
          <h2>Bogen übergeben</h2>
          <button type="button" onClick={() => teilenDialog.current?.close()}>Schließen</button>
        </div>
        {/* Die Lücken stehen VOR den Wegen, nicht danach: hinter dem QR-Knopf
            gelesen wären sie eine Nachricht an jemanden, der schon zeigt.
            Gesperrt wird nichts — eine Teilmeldung ist manchmal richtig, und
            eine gesperrte Übergabe hilft am Meldekopf niemandem. Antippen
            schließt den Dialog und springt an die Stelle. */}
        {/* Alter Bogen: zuerst fragen, ob er noch gilt — drei Tipps nach
            „Fortsetzen" stand sonst der QR-Code eines Einsatzes vom Juli
            (Audit Runde 2, R2-S1). */}
        {zeitraumVorbei && props.onNeuerEinsatz && (
          <div className="teilen-weg">
            <p className="warnung" role="status">
              Dieser Bogen gehört zum Einsatz {zeitraumDeutsch(bogen)}.
            </p>
            {/* Kein zweiter Primärknopf: Nachts standen zwei gleich
                bernsteinfarbene Knöpfe untereinander, und der, der den Bogen
                verändert, stand oben (Audit Runde 3, R3-L7). Er bleibt zuerst,
                die Übergabe bleibt der eine Primärknopf. */}
            <button
              type="button"
              onClick={() => {
                teilenDialog.current?.close();
                props.onNeuerEinsatz?.();
              }}
            >
              Für neuen Einsatz vorbereiten
            </button>
            <p className="hinweis">Zeitraum heute, Ort/Auftrag und Sofortbedarf leer — Personal und Fahrzeuge bleiben.</p>
          </div>
        )}
        {/* Die Lücken stehen eingeklappt über den Wegen: Aufgeklappt schoben
            sechs Punkte „QR-Code" und „PDF" unter das erste Bild, und wer
            übergeben wollte, sah keinen Knopf dafür (Audit Runde 2, R2-H6).
            Die Zahl bleibt sichtbar, die Liste ist ein Tipp entfernt. */}
        {offenePunkte.length > 0 && (
          <details className="offene-punkte">
            <summary className="warnung">
              ⚠ {offenePunkte.length === 1 ? "1 offener Punkt" : `${offenePunkte.length} offene Punkte`} — ansehen · Übergeben ist trotzdem möglich
            </summary>
            <Vollstaendigkeit
              punkte={offenePunkte}
              geheZu={(schritt, feld) => {
                teilenDialog.current?.close();
                geheZu(schritt, feld);
              }}
              nachsatz="Der Bogen geht dann mit diesen Lücken an die Gegenstelle."
            />
          </details>
        )}
        <div className="teilen-weg">
          <button
            type="button"
            className="primaer"
            disabled={!qr}
            onClick={() => {
              teilenDialog.current?.close();
              const fehlt = qr ? qr.teile.findIndex((_, i) => !vollbildGezeigt.has(i)) : -1;
              setVollbildTeil(fehlt > 0 && vollbildGezeigt.size > 0 ? fehlt : 0);
              setVollbild(true);
              // Vermerkt wird erst beim Schließen — und nur, wenn alle Teile
              // gezeigt wurden (R3-H3).
              ebeneBetreten(VOLLBILD_EBENE); // Zurück schließt nur das Vollbild (R2-H5)
            }}
          >
            QR-Code im Vollbild zeigen
          </button>
          {/* Je Weg genau ein kurzer Satz: unter Stress wird der Text nicht
              gelesen, aber er schiebt den nächsten Knopf nach unten — „PDF
              erzeugen" lag nach zwei Erklärabsätzen außerhalb des Bildes. */}
          <p className="hinweis">
            Die Gegenstelle scannt den Code vom Display
            {qr?.segmentiert ? ` — ${qr.teile.length} Teile nacheinander` : ""}.
          </p>
        </div>
        {/* Handy zu Handy ohne Papier und ohne Kamera. Nur dort anbieten, wo es
            ein Share-Sheet gibt — sonst zeigte der Knopf ins Leere. */}
        {shareSheetVerfuegbar() && (
          <div className="teilen-weg">
            <button type="button" onClick={anGeraetInDerNaeheSenden} disabled={!qr}>
              {nahDienst ? `Per ${nahDienst} senden` : "An Gerät in der Nähe senden"}
            </button>
            <p className="hinweis">
              Handy zu Handy über {nahDienst ?? "den Nahbereichs-Dienst"} — ohne Netz, ohne Kopplung.
            </p>
          </div>
        )}
        <div className="teilen-weg">
          <button type="button" className={pdfLaeuft ? "arbeitet" : ""} aria-busy={pdfLaeuft || undefined} onClick={pdf} disabled={pdfLaeuft}>
            {pdfLaeuft ? "PDF wird erstellt…" : "PDF erzeugen"}
          </button>
          <p className="hinweis">Zum Drucken oder Versenden, mit QR-Code auf der letzten Seite.</p>
          {/* role="status": die Quittung kommt asynchron, nach dem Klick — ohne
              Ansage erführe ein Screenreader nichts davon. */}
          {pdfQuittung && <p className="hinweis pdf-quittung" role="status">✓ {pdfQuittung}</p>}
          {pdfFehler && <p className="fehler pdf-fehler" role="alert" ref={pdfFehlerZeile}>{pdfFehler}</p>}
        </div>
        {/* Zweite Stufe: Vor Ort zählen fast immer QR-Vollbild, Nahbereich
            oder PDF (oben). Link/CSV/Excel sind Chat- bzw. Führungsstellen-
            Aufgaben — eingeklappt bleiben es am Entscheidungspunkt ≤4 sichtbare
            Optionen, und alle Ausgabewege sind trotzdem an EINER Stelle. */}
        <details className="teilen-weitere">
          <summary>Weitere Formate (Link, Tabelle, Excel, Blanko)</summary>
          <div className="teilen-weg">
            <button type="button" onClick={bogenLinkTeilen} disabled={!qr}>
              {linkKopiert ? "Link kopiert ✓" : "Link teilen"}
            </button>
            {/* Der Link trägt den Bogen, aber nicht die App: Ein Gerät, das die
                Seite nie mit Netz geöffnet hat, zeigt offline nur eine
                Fehlerseite. Das muss der Absender vorher wissen, nicht der
                Empfänger im Funkloch (Audit Runde 2, R2-O5). */}
            <p className="hinweis">
              Für Chat, Mail oder Notiz: derselbe Inhalt wie im QR-Code — öffnet den Bogen beim Antippen.
              Ohne Netz öffnet er sich nur, wenn die Gegenstelle die App schon einmal mit Netz
              geöffnet hat — sonst QR-Code oder PDF weitergeben (die PDF trägt den Bogen selbst).
            </p>
          </div>
          {/* Anders als die Wege darüber ist CSV eine Einbahnstraße: es trägt
              keinen QR und lässt sich nicht zurücklesen. Steht trotzdem hier,
              weil der Nutzer alle Ausgabewege an einer Stelle sucht. */}
          <div className="teilen-weg">
            <button type="button" onClick={csv}>Als CSV (Tabelle)</button>
            <p className="hinweis">
              Für Excel & Co.: alle erfassten Daten des Bogens — je eine Zeile für die Einheit,
              jede Person und jedes Fahrzeug. Zum Auswerten, nicht zum Zurücklesen.
            </p>
          </div>
          <div className="teilen-weg">
            <button type="button" onClick={oldenburgXlsx}>Als Excel (Format „Oldenburg“)</button>
            <p className="hinweis">
              Eine Zeile in der Einheitenliste der Führungsstelle — Spalten und Formatierung wie in
              deren Vorlage. Zum Einfügen in die laufende Liste am Meldekopf.
            </p>
          </div>
          {/* Der leere Vordruck für die nächste Einheit ohne Gerät oder den
              Ausfall dieses Geräts (Audit Runde 3, R3-A7). */}
          <div className="teilen-weg">
            <button type="button" onClick={blanko}>Blanko-Vordruck (Papier-Reserve)</button>
            <p className="hinweis">Leerer Bogen, 2 Seiten A4, zum Ausfüllen mit der Hand.</p>
          </div>
          {/* Roh-JSON nur im Debug-Modus anbieten: fürs Publikum ist der Bogen
              ohnehin in jeder PDF eingebettet — ein separater JSON-Download
              verwirrt mehr, als er nützt. */}
          {debugAktiv() && (
            <div className="teilen-weg">
              <button type="button" onClick={() => bogenSpeichern(bogen)}>Als Datei speichern (Debug)</button>
              <p className="hinweis">Roh-JSON des Bogens — nur im Debug-Modus sichtbar.</p>
            </div>
          )}
        </details>
        {fehler && <p className="fehler">{fehler}</p>}
      </dialog>

      {vollbild && qr && (
        <QrVollbild
          qr={qr}
          einheit={`${orgLabel(org)} · ${vokabText(bogen.einheit.einheitsTyp, vokabularFuer(org, "einheitstyp"), "name") || "(Einheitstyp offen)"} · ${einheitOrt(bogen.einheit) || "(Standort offen)"}`}
          staerke={staerkeText}
          teilIndex={vollbildTeil}
          onTeil={setVollbildTeil}
          bereitsGezeigt={vollbildGezeigt}
          onGezeigt={setVollbildGezeigt}
          onSchliessen={(ergebnis) =>
            ebeneVerlassen(VOLLBILD_EBENE, () => {
              setVollbild(false);
              if (ergebnis) props.onUebergeben?.("qr", ergebnis === "bestaetigt");
            })
          }
          onZurueck={(ergebnis) => {
            setVollbild(false);
            if (ergebnis) props.onUebergeben?.("qr", ergebnis === "bestaetigt");
          }}
        />
      )}
    </>
  );
}

/**
 * QR-Code im Vollbild zum Vorzeigen. Ein modaler `<dialog>` (R2-M3): Fokus
 * und Vorlesen bleiben im Overlay, die Übersicht dahinter rollt nicht mit,
 * Escape schließt, und der Fokus kehrt auf „Bogen übergeben…" zurück.
 */
const VOLLBILD_EBENE = "qr-vollbild";

/**
 * Was beim Schließen des Vollbilds vermerkt wird (R3-H3): `undefined` =
 * nichts (nicht alle Teile gezeigt), „gezeigt" = alle Teile gezeigt, Empfang
 * offen, „bestaetigt" = der Nutzer hat gesagt, dass gescannt wurde.
 */
export type VollbildErgebnis = "gezeigt" | "bestaetigt" | undefined;

export function QrVollbild(props: {
  qr: QrSatz;
  /** Wer gezeigt wird — Organisation · Einheitstyp · Standort. */
  einheit: string;
  /** Stärke „F / UF / M / Ges" als Zahlen. */
  staerke: string;
  teilIndex: number;
  onTeil: (i: number) => void;
  /** Teile, die bei einem früheren Öffnen schon gezeigt wurden. */
  bereitsGezeigt?: ReadonlySet<number>;
  /** Meldet jeden neu gezeigten Teil (für das nächste Öffnen). */
  onGezeigt?: (gezeigt: ReadonlySet<number>) => void;
  /** Knopf oder Escape — verbraucht auch den Verlaufseintrag. */
  onSchliessen: (ergebnis: VollbildErgebnis) => void;
  /** Geräte-/Browser-Zurück — der Eintrag ist dann schon weg. */
  onZurueck: (ergebnis: VollbildErgebnis) => void;
}) {
  const { qr, teilIndex } = props;
  const dialog = useRef<HTMLDialogElement>(null);
  const anzahl = qr.teile.length;
  const index = Math.min(teilIndex, anzahl - 1);
  const teil = qr.teile[index]!;
  // Welche Teile schon auf dem Bildschirm standen: „gezeigt" gilt erst, wenn
  // es alle waren — vorher hieß schon Teil 1 von 2 „Übergeben" (R3-H3).
  const [gezeigt, setGezeigt] = useState<ReadonlySet<number>>(() => new Set([...(props.bereitsGezeigt ?? []), index]));
  useEffect(() => {
    setGezeigt((g) => (g.has(index) ? g : new Set([...g, index])));
  }, [index]);
  const onGezeigt = useRef(props.onGezeigt);
  onGezeigt.current = props.onGezeigt;
  useEffect(() => onGezeigt.current?.(gezeigt), [gezeigt]);
  const alleGezeigt = gezeigt.size >= anzahl;
  const fehlend = qr.teile.findIndex((_, i) => !gezeigt.has(i));
  // „zeigen" = Code; „frage" = Wurde gescannt?; „fehlt" = ein Teil fehlt noch.
  const [phase, setPhase] = useState<"zeigen" | "frage" | "fehlt">("zeigen");
  const ohneFrage = (): VollbildErgebnis => (alleGezeigt ? "gezeigt" : undefined);
  /**
   * Zurück-Geste und Escape wie „Schließen", solange Teile fehlen: Sie
   * schlossen das Vollbild sonst mitten in der Übergabe ohne Hinweis, und
   * „Schließen" fragte im selben Zustand nach (Audit Runde 4, R4-M5). Einmal
   * abgefangen, steht „Teil n wurde noch nicht gezeigt" da; ein zweites
   * Zurück schließt dann wirklich (wie „Trotzdem schließen").
   */
  const fehlteilAbfangen = (): boolean => {
    if (phase !== "zeigen" || alleGezeigt) return false;
    setPhase("fehlt");
    return true;
  };
  useModalesOverlay(dialog, {
    onSchliessen: () => {
      if (!fehlteilAbfangen()) props.onSchliessen(ohneFrage());
    },
  });
  useEbeneZurueck(VOLLBILD_EBENE, () => {
    if (fehlteilAbfangen()) {
      ebeneBetreten(VOLLBILD_EBENE); // die Geste ist verbraucht — der nächste Rücksprung landet wieder hier
      return;
    }
    props.onZurueck(ohneFrage());
  });
  // Stand = Moment des Öffnens; der Code zeigt den Bogen, wie er jetzt ist.
  const [stand] = useState(() => new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }));
  const teilText = (i: number) => `Teil ${i + 1} von ${anzahl}`;
  return (
    <dialog ref={dialog} className="qr-vollbild" aria-label="QR-Code im Vollbild" tabIndex={-1} data-zurueck="eigen">
      {/* Wer mehrere Telefone nacheinander scannt, prüft vor dem Scan, welcher
          Bogen gerade gezeigt wird — vorher stand hier nur der Code
          (Audit Runde 2, R2-W6, R2-N9, R2-O7). */}
      <p className="qr-vollbild-kopf">
        <strong>{props.einheit}</strong>
        <br />
        Stärke <strong>{props.staerke}</strong> <span className="hinweis">(F / UF / M / Ges) · Stand {stand} Uhr</span>
      </p>
      {/* „Teil 1 von 2" ÜBER dem Code: darunter verdeckte ihn die klebende
          Knopfleiste, und der zweite Teil wurde leicht vergessen (R3-H2). */}
      {qr.segmentiert && phase === "zeigen" && (
        <p className="qr-vollbild-teil">
          <strong>{teilText(index)}</strong>
          <span className="qr-vollbild-teil-zusatz"> — alle nacheinander scannen lassen.</span>
        </p>
      )}
      {phase === "zeigen" && (
        <div className="qr-vollbild-code">
          <img
            src={teil.datenUrl}
            alt={qr.segmentiert ? `EEB2-QR-Code Teil ${teil.teilNr} von ${teil.anzahl}` : "EEB2-QR-Code"}
          />
        </div>
      )}
      {phase === "zeigen" && (
        <p className="hinweis qr-vollbild-tipp">Der Bildschirm bleibt an — Display-Helligkeit hoch stellen hilft beim Scannen.</p>
      )}
      {phase === "frage" && (
        <div className="qr-vollbild-frage" role="group" aria-label="Wurde gescannt?">
          <p>
            <strong>{anzahl > 1 ? `Hat die Gegenstelle alle ${anzahl} Teile gescannt?` : "Hat die Gegenstelle den Code gescannt?"}</strong>
          </p>
          <p className="hinweis">Die App kann das nicht selbst sehen.</p>
          <div className="qr-vollbild-nav">
            <button type="button" className="primaer" onClick={() => props.onSchliessen("bestaetigt")}>
              Ja, gescannt — übergeben
            </button>
            <button type="button" onClick={() => props.onSchliessen("gezeigt")}>Nicht sicher</button>
            <button type="button" onClick={() => setPhase("zeigen")}>← Code wieder zeigen</button>
          </div>
        </div>
      )}
      {phase === "fehlt" && fehlend >= 0 && (
        <div className="qr-vollbild-frage" role="group" aria-label="Teil fehlt">
          <p className="warnung">
            <strong>{teilText(fehlend)} wurde noch nicht gezeigt.</strong> Ohne ihn hat die Gegenstelle den Bogen nicht.
          </p>
          <div className="qr-vollbild-nav">
            <button
              type="button"
              className="primaer"
              onClick={() => {
                props.onTeil(fehlend);
                setPhase("zeigen");
              }}
            >
              {teilText(fehlend)} zeigen
            </button>
            <button type="button" onClick={() => props.onSchliessen(undefined)}>Trotzdem schließen</button>
          </div>
        </div>
      )}
      {phase === "zeigen" && (
        <div className={`qr-vollbild-nav${qr.segmentiert ? " mit-teilen" : ""}`}>
          {qr.segmentiert && (
            <button
              type="button"
              disabled={index === 0}
              aria-label={index === 0 ? "Voriger Teil" : `Voriger Teil (${index} von ${anzahl})`}
              onClick={() => props.onTeil(index - 1)}
            >
              {index === 0 ? "←" : `← Teil ${index}`}
            </button>
          )}
          {qr.segmentiert && (
            <button
              type="button"
              disabled={index >= anzahl - 1}
              aria-label={index >= anzahl - 1 ? "Nächster Teil" : `Nächster Teil (${index + 2} von ${anzahl})`}
              onClick={() => props.onTeil(index + 1)}
            >
              {/* Die Teilzahl auch im Knopf — er bleibt im Bild, wenn der Text darüber es nicht ist (R3-H2). */}
              {index >= anzahl - 1 ? `${teilText(index)} ist der letzte` : `Weiter zu Teil ${index + 2} →`}
            </button>
          )}
          <button
            type="button"
            className="primaer"
            onClick={() => setPhase(alleGezeigt ? "frage" : "fehlt")}
          >
            Schließen
          </button>
        </div>
      )}
    </dialog>
  );
}
