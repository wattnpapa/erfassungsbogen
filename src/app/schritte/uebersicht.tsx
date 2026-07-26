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
import {
  QrSatz,
  bogenSpeichern,
  datumDeutsch,
  einheitAnzeigename,
  einheitOrt,
  funkrufText,
  funktionsText,
  kennzeichenText,
  orgLabel,
  pruefpunkte,
  qrErzeugen,
  vokabText,
  vokabularFuer,
} from "../hilfen";
import { pdfDatenUrl, pdfErzeugen } from "../pdf";
import { debugAktiv } from "../debug-plattform";
import { einheitSymbolSvg, svgDataUrl } from "../taktische-zeichen";
import { absenderLabel, signaturLabel, type SignaturStatus } from "../../signatur";
import { absenderkarteLaden, type Absenderkarte } from "../absenderkarte";
import { AbsenderkarteFeld } from "../absenderkarte-ui";
import { geraeteKurzform, geraeteOeffentlichHex } from "../geraete-schluessel";
import { istNativ, linkTeilen, textTeilen } from "../nativ";
import {
  MWD_LEGENDE,
  STAERKE_LEGENDE,
  Vollstaendigkeit,
  staerkeVorlesen,
} from "./bausteine";

export function Uebersicht(props: {
  bogen: Erfassungsbogen;
  geheZu: (schritt: number) => void;
  neu: () => void;
  onVorlageGespeichert?: (name: string) => void;
  /** Signaturstatus des importierten Transports (Herkunft), falls der Bogen gescannt wurde. */
  signatur?: SignaturStatus | null;
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

  function alsVorlageSpeichern() {
    const name = window.prompt("Als Vorlage speichern unter:", einheitAnzeigename(bogen.einheit));
    if (name == null) return;
    const v = vorlageAnlegen(name, bogen);
    props.onVorlageGespeichert?.(v.name);
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
  const org = bogen.einheit.organisation;
  const s = staerke(bogen);
  const mwd = unterbringungMWD(bogen);
  const vp = verpflegung(bogen);

  useEffect(() => {
    let aktiv = true;
    setVorschauUrl(null); // Bogen geändert → alte PDF-Vorschau wäre veraltet
    (async () => {
      try {
        const q = await qrErzeugen(bogen); // signiert immer mit dem Geräteschlüssel
        if (aktiv) setQr(q);
        geraeteKurzform().then((k) => aktiv && setSchluesselKurz(k));
      } catch (e) {
        if (aktiv) setFehler(`QR-Code: ${e instanceof Error ? e.message : e}`);
      }
    })();
    return () => {
      aktiv = false;
    };
  }, [bogen, absender]);

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
      setVorschauUrl(await pdfDatenUrl(bogen));
    } catch (e) {
      setFehler(`PDF-Vorschau: ${e instanceof Error ? e.message : e}`);
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
      setFehler(""); // kein Fehler; Rückmeldung via Titel/alert unnötig
      window.alert(`Öffentlicher Schlüssel in die Zwischenablage kopiert:\n\n${hex}`);
    } else {
      window.prompt("Öffentlicher Schlüssel (kopieren):", hex);
    }
  }

  async function bogenLinkTeilen() {
    if (!qr) return;
    const url = qr.vollUrl;
    const titel = `Erfassungsbogen ${einheitAnzeigename(bogen.einheit)}`;
    try {
      if (istNativ()) {
        await linkTeilen(titel, url);
      } else if (navigator.share) {
        await navigator.share({ title: titel, text: titel, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setLinkKopiert(true);
        window.setTimeout(() => setLinkKopiert(false), 3000);
      } else {
        window.prompt("Link kopieren:", url);
      }
    } catch (e) {
      // Abbruch im Share-Dialog ist kein Fehler
      if (e instanceof Error && e.name === "AbortError") return;
      setFehler(`Link teilen: ${e instanceof Error ? e.message : e}`);
    }
  }

  async function pdf() {
    setPdfLaeuft(true);
    setFehler("");
    try {
      await pdfErzeugen(bogen);
    } catch (e) {
      setFehler(`PDF: ${e instanceof Error ? e.message : e}`);
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
          <span className="uebersicht-aktionen">
            {props.sammelAktion && (
              <button type="button" className="primaer" onClick={props.sammelAktion.onUebernehmen}>
                {props.sammelAktion.label}
              </button>
            )}{" "}
            {/* Ein Weg zum Ziel: PDF/QR/Link/Datei sind vier Transportarten
                desselben Bogens — der Dialog bündelt sie mit Situationshilfe. */}
            <button type="button" className={props.sammelAktion ? "" : "primaer"} onClick={() => teilenDialog.current?.showModal()}>
              Bogen übergeben…
            </button>{" "}
            {!props.sammelAktion && props.onInEinsatzAufnehmen && (
              <>
                <button type="button" onClick={props.onInEinsatzAufnehmen}>In Einsatz aufnehmen…</button>{" "}
              </>
            )}
            <button type="button" onClick={alsVorlageSpeichern}>Als Vorlage speichern</button>{" "}
            <button type="button" onClick={() => window.confirm("Aktuellen Bogen verwerfen?") && neu()}>Neuer Bogen</button>
          </span>
        </div>
        {fehler && <p className="fehler">{fehler}</p>}
        {props.signatur && props.signatur.zustand !== "unsigniert" && (
          <p className={`signatur-herkunft ${props.signatur.zustand}`} role="status">
            Empfangen als: <strong>{signaturLabel(props.signatur)}</strong>
            {props.signatur.zustand === "gueltig"
              ? " — Herkunft belegt (nicht die Identität des Absenders)."
              : " — die Daten passen nicht zur Signatur."}
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
        <Vollstaendigkeit punkte={pruefpunkte(bogen)} geheZu={geheZu} />
        <div className="einheit-kopf">
          <img
            className="einheit-avatar gross"
            src={svgDataUrl(einheitSymbolSvg(bogen.einheit))}
            alt="Taktisches Zeichen der Einheit"
          />
          <div>
            <p>
              <strong>{orgLabel(org)}</strong>
              {" · "}{vokabText(bogen.einheit.einheitsTyp, vokabularFuer(org, "einheitstyp"), "name") || "(Einheitstyp offen)"}
              {" · "}{einheitOrt(bogen.einheit) || "(Standort offen)"}
            </p>
            <p>
              Stärke:{" "}
              <strong title={STAERKE_LEGENDE} aria-label={`Stärke: ${staerkeVorlesen(s)}`}>
                {s.fuehrer} / {s.unterfuehrer} / {s.mannschaft} / {s.gesamt}
              </strong>
              {" · "}
              <span title={MWD_LEGENDE}>Unterbringung: M {mwd.m} / W {mwd.w} / D {mwd.d}</span>
            </p>
          </div>
        </div>
      </section>

      {abschnitt("Einheit", 0, (
        <dl className="paare">
          <dt>Organisation</dt><dd>{orgLabel(org)}{bogen.einheit.organisationName ? ` — ${bogen.einheit.organisationName}` : ""}</dd>
          <dt>Einheitstyp</dt><dd>{vokabText(bogen.einheit.einheitsTyp, vokabularFuer(org, "einheitstyp"), "name") || "—"}</dd>
          {bogen.einheit.hierarchie.map((h, i) => (
            <span key={i} style={{ display: "contents" }}>
              <dt>{vokabText(h.bezeichnung, vokabularFuer(org, "ebene")) || "Ebene"}</dt>
              <dd>{h.name}{h.kurz ? ` (${h.kurz})` : ""}{h.telefon ? ` · ${h.telefon}` : ""}{h.email ? ` · ${h.email}` : ""}</dd>
            </span>
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

      {abschnitt(`Personal (${bogen.personal.length})`, 2, (
        <div className="tabellen-scroll">
        <table className="uebersicht">
          <thead>
            <tr><th>Funktion / Zusatzfunktion</th><th>Name, Vorname</th><th>Erreichbarkeit</th></tr>
          </thead>
          <tbody>
            {bogen.personal.map((p, i) => (
              <tr key={i}>
                <td>{funktionsText(p, org) || "—"}</td>
                <td>{p.nachname}{p.nachname && p.vorname ? ", " : ""}{p.vorname}</td>
                <td>
                  {p.kontakte
                    .map((k) =>
                      k.emailTemplate === 1
                        ? "eMail: Standard (D)"
                        : `${k.art === KontaktArt.EMAIL ? "eMail" : k.art === KontaktArt.MOBIL ? "Mobil" : "Tel"}: ${k.wert ?? ""} (${k.dienstlich ? "D" : "P"})`,
                    )
                    .join(" · ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      ))}

      {abschnitt(`Fahrzeuge (${bogen.fahrzeuge.length})`, 3, (
        <div className="tabellen-scroll">
        <table className="uebersicht">
          <thead>
            <tr><th>Typ</th><th>Kennzeichen</th><th>Funkrufname</th><th>StAN</th><th>Änderungen</th></tr>
          </thead>
          <tbody>
            {bogen.fahrzeuge.map((f, i) => (
              <tr key={i}>
                <td>{vokabText(f.typ, vokabularFuer(org, "fahrzeug")) || "—"}</td>
                <td>{kennzeichenText(f)}</td>
                <td>{funkrufText(f, einheitOrt(bogen.einheit))}</td>
                <td>{f.stanKonform == null ? "—" : f.stanKonform ? "ja" : "nein"}</td>
                <td>{f.aenderungen ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
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
              <p className="hinweis">Signiert ({qr.container}).</p>
            </>
          ) : (
            <>
              <img src={qr.teile[0]!.datenUrl} alt="EEB2-QR-Code" />
              <p className="hinweis">
                Signiert ({qr.container}) — öffnet beim Scannen mit der Kamera die App; dieser Code steht auch auf der letzten PDF-Seite.
              </p>
            </>
          )

        ) : (
          <p className="hinweis">QR-Code wird erzeugt…</p>
        )}
        {qr && (
          <p>
            <button type="button" onClick={() => { setVollbildTeil(0); setVollbild(true); }}>
              Vollbild anzeigen
            </button>
          </p>
        )}
        <div className="signatur-optionen">
          <p className="hinweis">
            Signiert mit dem Geräteschlüssel (Ed25519, +97 Byte). Dieses Gerät:{" "}
            <strong>{schluesselKurz ?? "Schlüssel wird erzeugt…"}</strong>
            {schluesselKurz && (
              <>
                {" · "}
                <button type="button" className="link" onClick={schluesselTeilen}>
                  öffentlichen Schlüssel anzeigen/teilen
                </button>
              </>
            )}
            <br />
            Belegt Herkunft/Integrität, nicht die Identität — der private Schlüssel bleibt auf dem Gerät.
          </p>
          <AbsenderkarteFeld karte={absender} onGespeichert={setAbsender} />
        </div>
      </section>

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
        <div className="teilen-weg">
          <button type="button" onClick={pdf} disabled={pdfLaeuft}>
            {pdfLaeuft ? "PDF wird erstellt…" : "PDF erzeugen"}
          </button>
          <p className="hinweis">Zum Drucken oder Versenden — Papier-Layout, QR-Code auf der letzten Seite.</p>
        </div>
        <div className="teilen-weg">
          <button type="button" onClick={bogenLinkTeilen} disabled={!qr}>
            {linkKopiert ? "Link kopiert ✓" : "Link teilen"}
          </button>
          <p className="hinweis">Derselbe Inhalt wie im QR-Code — öffnet den Bogen beim Antippen.</p>
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
