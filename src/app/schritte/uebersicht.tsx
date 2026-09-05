/**
 * Schritt 6 — Gesamtübersicht: Zusammenfassung aller Schritte, Vollständigkeits-
 * prüfung und die Übergabewege (QR, PDF, Link, Datei).
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Erfassungsbogen,
  KontaktArt,
  datumZuIso,
  staerke,
  unterbringungMWD,
  verpflegung,
  zeitpunktZuIso,
} from "../../model";
import { vorlageAnlegen } from "../vorlagen";
import { TabellenScroll } from "../tabellen-scroll";
import {
  QrSatz,
  bogenDateiname,
  bogenSpeichern,
  bytesAlsDatei,
  datumDeutsch,
  textAlsDatei,
  einheitAnzeigename,
  einheitOrt,
  funkrufText,
  funktionsText,
  kennzeichenText,
  kontaktText,
  orgLabel,
  pruefpunkte,
  qrErzeugen,
  vokabText,
  vokabularFuer,
} from "../hilfen";
import { debugAktiv } from "../debug-plattform";
import { bogenCsvInhalt } from "../bogen-csv";
import { einheitSymbolSvg, svgDataUrl } from "../taktische-zeichen";
import {
  absenderLabel,
  kettenLabel,
  ketteVollstaendig,
  signaturLabel,
  type SignaturStatus,
} from "../../signatur";
import { absenderkarteLaden, type Absenderkarte } from "../absenderkarte";
import { AbsenderkarteFeld } from "../absenderkarte-ui";
import { geraeteKurzform, geraeteOeffentlichHex } from "../geraete-schluessel";
import { istNativ, linkTeilen, nahbereichDienst, shareSheetVerfuegbar, textTeilen } from "../nativ";
import { fehlerText } from "../nachladen";
import { frageJaNein, frageText, zeigeHinweis } from "../dialoge";
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
  geheZu: (schritt: number) => void;
  neu: () => void;
  onVorlageGespeichert?: (name: string) => void;
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
}) {
  const { bogen, geheZu, neu } = props;

  async function alsVorlageSpeichern() {
    const name = await frageText({
      titel: "Als Vorlage speichern",
      label: "Name der Vorlage",
      vorgabe: einheitAnzeigename(bogen.einheit),
      hinweis: "Die Vorlage bleibt auf diesem Gerät und lässt sich für den nächsten Einsatz mustern.",
      ok: "Vorlage speichern",
    });
    if (name == null) return;
    const v = vorlageAnlegen(name, bogen);
    props.onVorlageGespeichert?.(v.name);
  }

  /** Bogen schließen und mit einem leeren beginnen — der offene wäre danach weg. */
  async function bogenVerwerfen() {
    const sicher = await frageJaNein({
      titel: "Aktuellen Bogen verwerfen?",
      text: `„${einheitAnzeigename(bogen.einheit)}" wird geschlossen und der gespeicherte Entwurf gelöscht.`,
      ok: "Verwerfen und neu beginnen",
      gefahr: true,
    });
    if (sicher) neu();
  }

  const [qr, setQr] = useState<QrSatz | null>(null);
  const [fehler, setFehler] = useState("");
  const [pdfLaeuft, setPdfLaeuft] = useState(false);
  // Vollbild-QR zum Vorzeigen (Handy-zu-Tablet-Scan ohne Papier); bei
  // Segmentierung blättert `vollbildTeil` durch die Teile.
  const [vollbild, setVollbild] = useState(false);
  const [vollbildTeil, setVollbildTeil] = useState(0);
  // „Bogen übergeben": ein Dialog bündelt alle Transportwege (QR/PDF/Link/Datei).
  const teilenDialog = useRef<HTMLDialogElement>(null);
  const [schluesselKurz, setSchluesselKurz] = useState<string | null>(null);
  // Freiwillige Absenderangaben zur Signatur. Als Effekt-Abhängigkeit geführt:
  // eine geänderte Karte ändert den signierten Payload → QR neu erzeugen.
  const [absender, setAbsender] = useState<Absenderkarte>(() => absenderkarteLaden());
  const [linkKopiert, setLinkKopiert] = useState(false);
  // Eingebettete PDF-Vorschau (nur Browser/Desktop): auf Wunsch erzeugt,
  // verworfen sobald der Bogen sich ändert (dann wäre sie veraltet).
  const [vorschauUrl, setVorschauUrl] = useState<string | null>(null);
  const [vorschauLaeuft, setVorschauLaeuft] = useState(false);
  // Nahbereichs-Dienst des Systems (AirDrop/Quick Share) — nur Beschriftung.
  const nahDienst = nahbereichDienst();
  const org = bogen.einheit.organisation;
  const s = staerke(bogen);
  const mwd = unterbringungMWD(bogen);
  const vp = verpflegung(bogen);
  /**
   * Spalten, die für diesen Bogen nirgends etwas enthalten, werden nicht
   * gezeigt. Sonst nimmt „Erreichbarkeit" ein Drittel der Personaltabelle für
   * acht leere Zellen ein und drückt die Tabelle auf dem Telefon über den
   * Kartenrand — die eigentliche Auskunft wird abgeschnitten, damit Leere
   * Platz bekommt. Optionale Angaben ohne Inhalt sind keine Information.
   */
  const zeigeErreichbarkeit = bogen.personal.some((p) => p.kontakte.some((k) => kontaktText(k) !== ""));
  const zeigeFunkruf = bogen.fahrzeuge.some((f) => funkrufText(f, einheitOrt(bogen.einheit)) !== "");
  const zeigeAenderungen = bogen.fahrzeuge.some((f) => (f.aenderungen ?? "") !== "");

  useEffect(() => {
    let aktiv = true;
    setVorschauUrl(null); // Bogen geändert → alte PDF-Vorschau wäre veraltet
    (async () => {
      try {
        // Eigener/bearbeiteter Bogen: mit dem Geräteschlüssel signiert.
        // Unverändert empfangener Bogen: Original-Payload gegengezeichnet.
        const q = await qrErzeugen(bogen, props.herkunft);
        if (aktiv) setQr(q);
        geraeteKurzform().then((k) => aktiv && setSchluesselKurz(k));
      } catch (e) {
        if (aktiv) setFehler(`QR-Code: ${e instanceof Error ? e.message : e}`);
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
      const { pdfDatenUrl } = await import("../pdf");
      setVorschauUrl(await pdfDatenUrl(bogen, props.herkunft));
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
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
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

  async function pdf() {
    setPdfLaeuft(true);
    setFehler("");
    try {
      const { pdfErzeugen } = await import("../pdf");
      await pdfErzeugen(bogen, undefined, props.herkunft);
    } catch (e) {
      setFehler(`PDF: ${fehlerText(e)}`);
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
            {props.sammelAktion ? (
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
              {props.sammelAktion && (
                <button type="button" onClick={() => teilenDialog.current?.showModal()}>Bogen übergeben…</button>
              )}
              {!props.sammelAktion && props.onInEinsatzAufnehmen && (
                <button type="button" onClick={props.onInEinsatzAufnehmen}>In Einsatz aufnehmen…</button>
              )}
              <button type="button" onClick={alsVorlageSpeichern}>Als Vorlage speichern</button>
              <button type="button" onClick={() => void bogenVerwerfen()}>Neuer Bogen</button>
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
                </strong>
              </span>
              <span title={MWD_LEGENDE}>Unterbringung: M {mwd.m} / W {mwd.w} / D {mwd.d}</span>
            </p>
          </div>
        </div>
        <Vollstaendigkeit punkte={pruefpunkte(bogen)} geheZu={geheZu} />
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
            {bogen.einsatz.einsatzbeginn != null ? zeitpunktZuIso(bogen.einsatz.einsatzbeginn).replace("T", " ") : "—"}
            {" / "}
            {bogen.einsatz.einsatzende != null ? zeitpunktZuIso(bogen.einsatz.einsatzende).replace("T", " ") : "—"}
          </dd>
        </dl>
      ))}
      </div>

      {/* Leer trug die Karte bisher nur die Spaltenköpfe — eine Versalzeile
          über nichts, die aussieht, als sei die Tabelle abgeschnitten. Ein
          Satz sagt stattdessen, was fehlt; dieselbe Auskunft wie in der
          Einsatz-Sammlung, damit „nichts erfasst" überall gleich klingt. */}
      {abschnitt(`Personal (${bogen.personal.length})`, 2, bogen.personal.length === 0 ? (
        <p className="hinweis">Kein Personal erfasst.</p>
      ) : (
        <TabellenScroll titel="Personal">
        <table className="uebersicht">
          <thead>
            <tr>
              <th>Funktion / Zusatzfunktion</th>
              <th>Name, Vorname</th>
              {zeigeErreichbarkeit && <th>Erreichbarkeit</th>}
            </tr>
          </thead>
          <tbody>
            {bogen.personal.map((p, i) => (
              <tr key={i}>
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
              <th>StAN</th>
              {zeigeAenderungen && <th>Änderungen</th>}
            </tr>
          </thead>
          <tbody>
            {bogen.fahrzeuge.map((f, i) => (
              <tr key={i}>
                <td>{vokabText(f.typ, vokabularFuer(org, "fahrzeug")) || "—"}</td>
                <td>{kennzeichenText(f)}</td>
                {zeigeFunkruf && <td>{funkrufText(f, einheitOrt(bogen.einheit))}</td>}
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
          <dd>{bogen.sofortbedarf ? `${bogen.sofortbedarf.verpflegungPersonen} Personen, davon ${vp.vegetarisch} vegetarisch, ${vp.vegan} vegan` : "—"}</dd>
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
      {!istNativ() && (
        <section className="karte">
          <div className="kopfzeile">
            <h2>PDF-Vorschau</h2>
            <button type="button" onClick={vorschauLaden} disabled={vorschauLaeuft}>
              {vorschauLaeuft ? "Vorschau wird erzeugt…" : vorschauUrl ? "Vorschau aktualisieren" : "Vorschau anzeigen"}
            </button>
          </div>
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
          <p className="hinweis">
            {qr?.weitergeleitet ? "Gegengezeichnet" : "Signiert"} mit dem Echtheits-Siegel dieses
            Geräts: <strong>{schluesselKurz ?? "Schlüssel wird erzeugt…"}</strong>
          </p>
          <details className="signatur-detail">
            <summary>Was das Siegel belegt</summary>
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

      <dialog ref={teilenDialog} aria-label="Bogen übergeben" className="teilen-dialog">
        <div className="kopfzeile">
          <h2>Bogen übergeben</h2>
          <button type="button" onClick={() => teilenDialog.current?.close()}>Schließen</button>
        </div>
        <div className="teilen-weg">
          <button
            type="button"
            className="primaer"
            disabled={!qr}
            onClick={() => {
              teilenDialog.current?.close();
              setVollbildTeil(0);
              setVollbild(true);
            }}
          >
            QR-Code im Vollbild zeigen
          </button>
          <p className="hinweis">
            Vor Ort ohne Netz: Die Gegenstelle scannt den Code direkt vom Display
            {qr?.segmentiert ? ` (${qr.teile.length} Teile nacheinander)` : ""}.
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
              Handy zu Handy: im Teilen-Fenster {nahDienst ?? "den Nahbereichs-Dienst"} wählen —
              ohne Netz, ohne Kopplung. Der Link trägt den ganzen Bogen, auch einen für den
              QR-Code zu großen.
            </p>
          </div>
        )}
        <div className="teilen-weg">
          <button type="button" onClick={pdf} disabled={pdfLaeuft}>
            {pdfLaeuft ? "PDF wird erstellt…" : "PDF erzeugen"}
          </button>
          <p className="hinweis">Zum Drucken oder Versenden — Papier-Layout, QR-Code auf der letzten Seite.</p>
        </div>
        {/* Zweite Stufe: Vor Ort zählen fast immer QR-Vollbild, Nahbereich
            oder PDF (oben). Link/CSV/Excel sind Chat- bzw. Führungsstellen-
            Aufgaben — eingeklappt bleiben es am Entscheidungspunkt ≤4 sichtbare
            Optionen, und alle Ausgabewege sind trotzdem an EINER Stelle. */}
        <details className="teilen-weitere">
          <summary>Weitere Formate (Link, Tabelle, Excel)</summary>
          <div className="teilen-weg">
            <button type="button" onClick={bogenLinkTeilen} disabled={!qr}>
              {linkKopiert ? "Link kopiert ✓" : "Link teilen"}
            </button>
            <p className="hinweis">
              Für Chat, Mail oder Notiz: derselbe Inhalt wie im QR-Code — öffnet den Bogen beim Antippen.
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

      {vollbild && qr && (() => {
        const teil = qr.teile[Math.min(vollbildTeil, qr.teile.length - 1)]!;
        return (
          <div className="qr-vollbild" role="dialog" aria-label="QR-Code im Vollbild">
            <img
              src={teil.datenUrl}
              alt={qr.segmentiert ? `EEB2-QR-Code Teil ${teil.teilNr} von ${teil.anzahl}` : "EEB2-QR-Code"}
            />
            {qr.segmentiert && (
              <p>
                <strong>Teil {teil.teilNr} von {teil.anzahl}</strong> — alle Teile nacheinander scannen lassen.
              </p>
            )}
            <p className="hinweis">Der Bildschirm bleibt an — Display-Helligkeit hoch stellen hilft beim Scannen.</p>
            <div className="qr-vollbild-nav">
              {qr.segmentiert && (
                <button type="button" disabled={vollbildTeil === 0} onClick={() => setVollbildTeil(vollbildTeil - 1)}>
                  ← Voriger Teil
                </button>
              )}
              {qr.segmentiert && (
                <button
                  type="button"
                  disabled={vollbildTeil >= qr.teile.length - 1}
                  onClick={() => setVollbildTeil(vollbildTeil + 1)}
                >
                  Nächster Teil →
                </button>
              )}
              <button type="button" className="primaer" onClick={() => setVollbild(false)}>Schließen</button>
            </div>
          </div>
        );
      })()}
    </>
  );
}
