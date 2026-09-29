/**
 * Oberfläche für „Einsatz-Sammlung" (Meldekopf/Zugführer):
 *  - EinsatzListe: Kartenliste der Einsätze auf dem Startbildschirm.
 *  - EinsatzDetail: Summen über die anwesenden Einheiten, Einheitenliste mit
 *    Status (anwesend/abgerückt) und aufklappbarer Revisions-Historie, Bögen
 *    hinzufügen (Scan / manuell), Einsatz löschen.
 *
 * Reine Anzeige + Aufruf der Store-/Auswertungslogik (einsaetze.ts, auswertung.ts).
 */

import { useEffect, useId, useLayoutEffect, useRef, useState, type FocusEvent, type ReactNode } from "react";
import {
  PersonalErfassung,
  datumZuIso,
  staerke,
  unterbringungMWD,
  verpflegung,
  type Erfassungsbogen,
} from "@bos/eeb-format/model";
import { datenschutzfristAbgelaufen } from "@bos/eeb-format/datenschutzfrist";
import { datenschutzZeitpunkt } from "./datenschutz-uhr";
import {
  datumDeutsch,
  einheitAnzeigename,
  funkrufText,
  funktionsText,
  kennzeichenText,
  kontaktText,
  orgLabel,
  nurSollstaerke,
  pruefpunkte,
  vokabText,
  vokabularFuer,
  zeitpunktDeutsch,
} from "./hilfen";
import { bogenDiff, diffKurzfassung, type WertAenderung } from "@bos/meldekopf/meldung-diff";
import {
  EinsatzArt,
  MeldeStatus,
  einsatzEndgueltigLoeschen,
  einsatzLoeschen,
  einsatzWiederherstellen,
  einsaetzeLaden,
  einsaetzePapierkorb,
  meldungAufteilen,
  meldungenZusammenfuehren,
  meldungEntfernen,
  einsatzImportieren,
  neuesteJeEinheit,
  revisionen,
  tageBisAufraeumen,
  stammSchluessel,
  type AufteilungOptionen,
  type Einsatzsammlung,
  type MeldeEintrag,
  type ZusammenfuehrungOptionen,
} from "@bos/meldekopf/einsaetze";
import { RolleMarke } from "./rolle-marke";
import { AufteilenPanel } from "./aufteilen-ui";
import { ZusammenfuehrenPanel } from "./zusammenfuehren-ui";
import type { AufteilungsWahl } from "@bos/meldekopf/aufteilen";
import { aggregiere, aggregiereNachZug, uebungenAusserhalbDerLage, type EinsatzSummen } from "./auswertung";
import {
  SORTIERUNGEN,
  einheitenAnsicht,
  personenMitQualifikation,
  qualifikationenImEinsatz,
  type EinheitenSortierung,
} from "./einheiten-liste";
import { debugAktiv } from "./debug-plattform";
import { Auswahl, STAERKE_LEGENDE } from "./schritte/bausteine";
import { SeitenKopf } from "./seiten-kopf";
import { AnzeigeSchalter } from "./anzeige-schalter";
import {
  SpeicherVollFehler,
  abrueckzeitSetzen,
  eintreffzeit,
  eintreffzeitSetzen,
  einheitEntfernen,
  einheitVerschieben,
  notizSetzen,
  zugSetzen,
  HERKUNFT_TEXT,
  statusMitZeitSetzen,
  zeitKurz,
  zeitLang,
} from "./eintrag-zeiten";
import { frageJaNein, frageWahl, zeigeHinweis } from "./dialoge";
import { TabellenScroll } from "./tabellen-scroll";
import {
  TABELLEN_SPALTEN,
  bedarfMarken,
  gemerkteAnsicht,
  istNeu,
  passtZuBedarfsfilter,
  type BedarfsFilter,
  merkeAnsicht,
  standIstAlt,
  summenBeschriftung,
  tabellenSumme,
  tabellenZaehlung,
  tabellenZeilen,
  zeilenSortieren,
  type EinheitenAnsicht,
  type Sortierrichtung,
  type TabellenSpalte,
  type TabellenZeile,
} from "./einheiten-tabelle";
import { imWebBrowser } from "./nativ";
import { aufgeraeumteLaden, aufgeraeumteQuittieren } from "./aufraeum-hinweis";
import { useZahlQuittung } from "./quittung";
import { mitAbgang, useEingangsquittung } from "./eintrag-bewegung";
import { AbgangKnopf, Kartenstapel } from "./kartenstapel";
import { istBilddatei } from "./qr-stapel";
import { fehlerText } from "./nachladen";
import { entfernteMerken, entfernteVergessen } from "./entfernte-meldungen";
import {
  exportStandLaden,
  exportZeitKurz,
  lageblattStandLaden,
  neueEintraege,
  seitdemText,
  type ExportStand,
  type ExportUmfang,
} from "./export-stand";

export const ART_LABEL: Record<EinsatzArt, string> = {
  [EinsatzArt.EINSATZ]: "Einsatz",
  [EinsatzArt.UEBUNG]: "Übung",
  [EinsatzArt.VERANSTALTUNG]: "Veranstaltung",
};

// Herkunft einer Meldung: ein Wortlaut für Karte und Exporte, siehe
// HERKUNFT_TEXT in eintrag-zeiten.ts (Audit Runde 2, R2-K6).
const QUELLE_LABEL = HERKUNFT_TEXT;

/**
 * Eine Schreibaktion auf die Sammlung ausführen und einen vollen Speicher dem
 * Nutzer sagen, statt ihn zu verschlucken: Ein Statuswechsel, der still nicht
 * gespeichert wurde, ist am Meldekopf schlimmer als eine Fehlermeldung — die
 * Anzeige sagt „abgerückt", der Speicher sagt „anwesend", und beim nächsten
 * Laden stimmt die Lage nicht mehr. Liefert, ob geschrieben wurde.
 */
async function gesichert(titel: string, aktion: () => void): Promise<boolean> {
  try {
    aktion();
    return true;
  } catch (e) {
    await zeigeHinweis({ titel, text: e instanceof SpeicherVollFehler ? e.message : fehlerText(e) });
    return false;
  }
}

/** Zeitpunkt → Wert eines datetime-local-Felds (Ortszeit, ohne Sekunden). */
function zuDatetimeLocal(ms: number): string {
  const d = new Date(ms);
  const zwei = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${zwei(d.getMonth() + 1)}-${zwei(d.getDate())}T${zwei(d.getHours())}:${zwei(d.getMinutes())}`;
}

/** Wert eines datetime-local-Felds → Zeitpunkt; null bei leerem/ungültigem Feld. */
function ausDatetimeLocal(wert: string): number | null {
  if (!wert.trim()) return null;
  const ms = new Date(wert).getTime();
  return Number.isNaN(ms) ? null : ms;
}

/**
 * Ein von Hand gesetzter Statuswechsel — die Quittung dafür steht in der
 * Einsatzansicht, mit Uhrzeit und Rückweg (Zerstörende-Handlungen-Audit D4).
 */
export interface StatusWechsel {
  /** Die Meldung VOR dem Wechsel — der Rückweg stellt genau diesen Stand her. */
  vorher: MeldeEintrag;
  status: MeldeStatus;
  zeit: number;
}

/** Kurzes Signatur-Etikett für eine Meldung (leer, wenn unsigniert empfangen). */
function signaturBadge(e: MeldeEintrag) {
  if (!e.signatur) return null;
  if (e.signatur.zustand === "gueltig") {
    return (
      <span className="signatur-badge gueltig" title={`Öffentlicher Schlüssel: ${e.signatur.pubkey ?? ""}`}>
        ✓ signiert {e.signatur.kurzform ?? ""}
      </span>
    );
  }
  return <span className="signatur-badge ungueltig" title="Signatur passt nicht zu den Daten">⚠ Signatur ungültig</span>;
}

/** „Lageblatt Mo., 16:30 (seitdem 1 neue Meldung) · Export: noch keiner" — für die Startseitenkarte (R2-A3). */
function ausgabeStandText(s: Einsatzsammlung): string {
  const teil = (was: string, stand: ExportStand | null, keiner: string) =>
    stand ? `${was} ${exportZeitKurz(stand.zeitpunkt)} (${seitdemText(neueEintraege(s.eintraege, stand).length)})` : `${was}: ${keiner}`;
  return `${teil("Lageblatt", lageblattStandLaden(s.id), "noch keins")} · ${teil("Export", exportStandLaden(s.id), "noch keiner")}`;
}

/** Kalendertag der Geräteuhr: „28.09.2026". */
function tagText(ms: number): string {
  return new Date(ms).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function staerkeText(b: Erfassungsbogen): string {
  const s = staerke(b);
  return `${s.fuehrer} / ${s.unterfuehrer} / ${s.mannschaft} / ${s.gesamt}`;
}

function summenStaerkeText(sum: EinsatzSummen): string {
  const s = sum.staerke;
  return `${s.fuehrer} / ${s.unterfuehrer} / ${s.mannschaft} / ${s.gesamt}`;
}

/**
 * Stand lesbar: „28.09.2026, 14:42" statt der Zeitgruppe „281442sep26", die
 * ein Neuling nicht auf Anhieb liest (Audit Runde 2, R2-N4).
 */
function standText(b: Erfassungsbogen): string {
  return zeitpunktDeutsch(b.stand);
}

/**
 * Was gerade in dieser Sammlung eingegangen ist: der Schlüssel der Einheit
 * plus ein Zähler. Der Zähler ist der Unterschied zwischen „schon da" und
 * „gerade gekommen" — eine Folgemeldung derselben Einheit trägt denselben
 * Schlüssel, ändert aber still eine bestehende Zeile, und genau die soll
 * quittieren (siehe useEingangsquittung).
 */
export type Eingang = { schluessel: string; nonce: number };

/** Marke für genau diese Zeile — null, wenn sie nicht gemeint ist. */
function marke(eingang: Eingang | null | undefined, schluessel: string): string | null {
  return eingang && eingang.schluessel === schluessel ? `${eingang.schluessel}#${eingang.nonce}` : null;
}

// ---------------------------------------------------------------- Einsatzliste

export function EinsatzListe(props: {
  einsaetze: Einsatzsammlung[];
  onOeffnen: (s: Einsatzsammlung) => void;
  onGeaendert: () => void;
}) {
  const { einsaetze, onOeffnen, onGeaendert } = props;
  const [zeigePapierkorb, setZeigePapierkorb] = useState(false);
  const papierkorb = einsaetzePapierkorb();
  // Nach dem Laden gelesen: einsaetzePapierkorb() hat die Frist gerade geprüft
  // und fällige Löschungen vorgemerkt (aufraeum-hinweis.ts, R2-D5).
  const [aufgeraeumt, setAufgeraeumt] = useState(() => aufgeraeumteLaden());
  /**
   * Der gerade zurückgeholte Einsatz. Aus dem Papierkorb wiederhergestellt,
   * taucht er irgendwo in der Liste darüber wieder auf — bei mehreren
   * Sammlungen ist ohne Stempel nicht zu sehen, welche zurückkam. Genau die
   * Zusage „nichts geht verloren" bliebe damit unquittiert.
   */
  const [zurueckgeholt, setZurueckgeholt] = useState<string | null>(null);

  /**
   * Rückfrage vor dem Weg in den Papierkorb. Dass ein Fehltipp umkehrbar ist,
   * hilft nur, wenn der Rückweg auch bekannt ist — der Papierkorb liegt hinter
   * einem Textlink, den nichts ankündigt. Die Frage nennt ihn deshalb.
   */
  function fragLoeschen(s: Einsatzsammlung) {
    const einheiten = neuesteJeEinheit(s.eintraege).length;
    return frageJaNein({
      titel: "Einsatz löschen?",
      text: `„${s.name}" mit ${einheiten} gemeldeten Einheit${einheiten === 1 ? "" : "en"} wandert in den Papierkorb und lässt sich dort 30 Tage lang zurückholen.`,
      ok: "In den Papierkorb",
      gefahr: true,
    });
  }

  function loeschen(s: Einsatzsammlung) {
    einsatzLoeschen(s.id);
    onGeaendert();
  }

  // Rückfrage und Mutation bleiben getrennt: der Abgang der Karte läuft
  // zwischen beiden (siehe AbgangKnopf).
  function fragEndgueltig(s: Einsatzsammlung) {
    return frageJaNein({
      titel: "Einsatz endgültig löschen?",
      text: `„${s.name}" mit ${s.eintraege.length} Meldung(en) wird aus dem Papierkorb entfernt. Darin stecken fremde Personendaten; rückgängig geht das nicht.`,
      ok: "Endgültig löschen",
      gefahr: true,
    });
  }

  function endgueltigLoeschen(s: Einsatzsammlung) {
    einsatzEndgueltigLoeschen(s.id);
    onGeaendert();
  }

  return (
    <>
      {/* Nach einer automatischen Löschung einmal sagen, WAS weg ist — sonst
          sucht man eine Sammlung, die nicht verlegt, sondern gelöscht ist
          (Audit Runde 2, R2-D5). */}
      {aufgeraeumt.length > 0 && (
        <div className="warnung aufgeraeumt-hinweis" role="status">
          <p>
            <strong>Automatisch gelöscht:</strong>{" "}
            {aufgeraeumt.length === 1 ? "Diese Sammlung lag" : "Diese Sammlungen lagen"} 90 Tage unverändert
            und {aufgeraeumt.length === 1 ? "wurde" : "wurden"} wegen der enthaltenen Personendaten endgültig
            entfernt — nicht im Papierkorb. Wer die Daten noch braucht, greift auf einen Export oder das Papier zurück.
          </p>
          <ul>
            {aufgeraeumt.map((a) => (
              <li key={a.id}>
                „{a.name}" · {tagText(a.angelegt)} bis {tagText(a.geaendert)} · {a.einheiten} Einheit(en),{" "}
                {a.meldungen} Meldung(en) · gelöscht am {zeitLang(a.entferntAm)}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => {
              aufgeraeumteQuittieren();
              setAufgeraeumt([]);
            }}
          >
            Verstanden
          </button>
        </div>
      )}
      {einsaetze.map((s) => {
        const sum = aggregiere(s.eintraege, s.art);
        const restTage = tageBisAufraeumen(s);
        const ruhtTage = Math.floor((Date.now() - s.geaendert) / (24 * 60 * 60 * 1000));
        return (
          <Kartenstapel className="karte" key={s.id} frisch={s.id === zurueckgeholt}>
            <div className="kopfzeile">
              <h2>{s.name}</h2>
              <button type="button" className="primaer" onClick={() => onOeffnen(s)}>Öffnen</button>
            </div>
            <p>
              <strong>{ART_LABEL[s.art]}</strong>
              {s.ort ? ` · ${s.ort}` : ""}
            </p>
            <p className="hinweis">
              {sum.einheiten} Einheit(en) anwesend · Stärke {sum.staerke.fuehrer} / {sum.staerke.unterfuehrer} / {sum.staerke.mannschaft} / {sum.staerke.gesamt}
            </p>
            {/* Stand von Papier und Export schon auf der Startseite: ob der
                Aushang und die letzte Lieferung noch stimmen (R2-A3). */}
            <p className="hinweis ausgabe-stand">{ausgabeStandText(s)}</p>
            {/* Ankündigung der automatischen Löschung (siehe AUFRAEUM_FRIST_MS).
                Sie steht über den Aktionen, damit der Ausweg — exportieren oder
                durch eine Änderung die Uhr zurücksetzen — direkt daneben liegt. */}
            {restTage != null && (
              <p className="warnung">
                {restTage > 0
                  ? `Wird in ${restTage} Tag(en) automatisch gelöscht.`
                  : "Wird beim nächsten Start automatisch gelöscht."}{" "}
                {/* Die tatsächliche Ruhezeit — „seit 60 Tagen" stand auch bei
                    70 Tagen da (Audit Runde 2, R2-D5). */}
                Die Sammlung liegt seit {ruhtTage} Tagen unverändert und enthält Personendaten
                gemeldeter Kräfte. Wenn du sie noch brauchst, exportiere sie jetzt — jede
                Änderung an der Sammlung setzt die Frist zurück.
              </p>
            )}
            <div className="vorlage-aktionen">
              {/* Der Abgang zeigt, welche Sammlung geht — die Liste rückt erst
                  danach nach. Ohne ihn verschwindet aus einem Stapel gleich
                  aussehender Karten schlagartig eine, und welche es war, steht
                  nur noch im Papierkorb. */}
              <AbgangKnopf className="entfernen" bestaetigen={() => fragLoeschen(s)} onAusfuehren={() => loeschen(s)}>
                Löschen…
              </AbgangKnopf>
            </div>
          </Kartenstapel>
        );
      })}
      {papierkorb.length > 0 && (
        <p>
          <button type="button" className="link" onClick={() => setZeigePapierkorb(!zeigePapierkorb)}>
            {zeigePapierkorb ? "Papierkorb ausblenden" : `Papierkorb (${papierkorb.length})`}
          </button>
        </p>
      )}
      {zeigePapierkorb &&
        papierkorb.map((s) => (
          <Kartenstapel className="karte papierkorb" key={s.id}>
            <div className="kopfzeile">
              <h2>{s.name}</h2>
              {/* Nur der harmlose Weg steht in der Kopfzeile. „Endgültig
                  löschen" lag daneben, keine zwei Fingerbreit vom
                  Wiederherstellen entfernt — mit Handschuh eine Verwechslung
                  ohne Rückweg. */}
              <AbgangKnopf
                onAusfuehren={() => { einsatzWiederherstellen(s.id); setZurueckgeholt(s.id); onGeaendert(); }}
              >
                Wiederherstellen
              </AbgangKnopf>
            </div>
            <p className="hinweis">
              {s.eintraege.length} Meldung(en) · gelöscht am {new Date(s.geloeschtAm!).toLocaleDateString("de-DE")} —
              wird nach 30 Tagen automatisch endgültig entfernt.
            </p>
            <div className="papierkorb-endgueltig">
              <AbgangKnopf
                className="entfernen"
                bestaetigen={() => fragEndgueltig(s)}
                onAusfuehren={() => endgueltigLoeschen(s)}
              >
                Endgültig löschen…
              </AbgangKnopf>
            </div>
          </Kartenstapel>
        ))}
    </>
  );
}

// ---------------------------------------------------------------- Einsatzdetail

/**
 * Kann dieses Gerät einen ganzen Ordner auswählen? Nur der Rechner: Handy- und
 * Tablet-Browser kennen das Attribut zwar, öffnen aber trotzdem den normalen
 * Dateipicker — ein Knopf, der etwas anderes tut als er verspricht, ist im Feld
 * schlimmer als kein Knopf. Der Zeigergerät-Test trennt beide Welten
 * zuverlässiger als eine Browser-Erkennung.
 */
function ordnerAuswahlMoeglich(): boolean {
  if (typeof HTMLInputElement === "undefined" || !("webkitdirectory" in HTMLInputElement.prototype)) return false;
  return typeof matchMedia === "function" && matchMedia("(pointer: fine)").matches;
}

/** Was der Einlese-Knopf im Dateifenster vorschlägt: fertige Bögen in jeder Form. */
const EINLESE_ARTEN = ".json,application/json,.pdf,application/pdf,image/*";

/**
 * Ein Knopf für alles, was fertig ausgefüllt hereinkommt: JSON, PDF, Fotos und
 * Screenshots von QR-Codes — einzeln, viele auf einmal oder als ganzer Ordner.
 *
 * Vorher standen dafür drei Knöpfe nebeneinander und verlangten vorab eine
 * Entscheidung, die das Dateifenster ohnehin abnimmt: dort liegt die Datei, und
 * was sie ist, sieht man an ihr — nicht am Knopf davor. Welcher Weg gegangen
 * wird, entscheidet deshalb hier der Dateityp: Bilder gehen durch den
 * QR-Stapel, JSON und PDF durch den Bogen-Import. Beides gemischt ist erlaubt.
 *
 * Nur die Ordnerauswahl bleibt ein eigener Weg, weil ein Dateifeld entweder
 * Dateien ODER einen Ordner öffnen lässt. Sie hängt als zweiter Eintrag an
 * einem kleinen Menü — und das Menü erscheint nur dort, wo es Ordner überhaupt
 * gibt: sonst öffnet der Knopf ohne Zwischenschritt das Dateifenster.
 */
function BoegenEinlesenKnopf(props: {
  /** JSON-/PDF-Dateien mit fertigen Bögen. */
  onDaten: (dateien: File[]) => void;
  /** Bilder, aus denen erst noch QR-Codes gelesen werden. */
  onBilder: (dateien: File[]) => void;
}) {
  const mitOrdner = ordnerAuswahlMoeglich();
  const dateiFeld = useRef<HTMLInputElement>(null);
  const ordnerFeld = useRef<HTMLInputElement>(null);
  const huelle = useRef<HTMLDivElement>(null);
  const [offen, setOffen] = useState(false);

  // `webkitdirectory` ist kein React-Attribut und wird deshalb nachgesetzt.
  useEffect(() => {
    if (mitOrdner) ordnerFeld.current?.setAttribute("webkitdirectory", "");
  }, [mitOrdner]);

  // Ein offenes Menü muss auch wieder zugehen, ohne dass etwas gewählt wurde —
  // sonst verdeckt es die Knopfreihe darunter.
  useEffect(() => {
    if (!offen) return;
    function danebenGeklickt(e: MouseEvent) {
      if (!huelle.current?.contains(e.target as Node)) setOffen(false);
    }
    function taste(e: KeyboardEvent) {
      if (e.key === "Escape") setOffen(false);
    }
    document.addEventListener("mousedown", danebenGeklickt);
    document.addEventListener("keydown", taste);
    return () => {
      document.removeEventListener("mousedown", danebenGeklickt);
      document.removeEventListener("keydown", taste);
    };
  }, [offen]);

  /** Auswahl auf die beiden Wege verteilen. */
  function verteile(dateien: File[]) {
    const bilder = dateien.filter((d) => istBilddatei(d.name, d.type));
    const daten = dateien.filter((d) => !istBilddatei(d.name, d.type));
    if (daten.length > 0) props.onDaten(daten);
    // Auch die leere Auswahl geht weiter: der Aufrufer meldet dann „keine
    // Bilddateien" — besser als ein Knopf, der wortlos nichts tut.
    if (bilder.length > 0 || daten.length === 0) props.onBilder(bilder);
  }

  return (
    <div className="einlese" ref={huelle}>
      <button
        type="button"
        aria-haspopup={mitOrdner ? "menu" : undefined}
        aria-expanded={mitOrdner ? offen : undefined}
        title="Fertig ausgefüllte Bögen aufnehmen: JSON- oder PDF-Datei, Fotos oder Screenshots von QR-Codes — auch viele auf einmal und mehrteilige Bögen."
        onClick={() => (mitOrdner ? setOffen((o) => !o) : dateiFeld.current?.click())}
      >
        Bögen einlesen…
      </button>
      {mitOrdner && offen && (
        <div className="einlese-menue" role="menu">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOffen(false);
              dateiFeld.current?.click();
            }}
          >
            Dateien wählen…
          </button>
          <button
            type="button"
            role="menuitem"
            title="Einen ganzen Ordner mit QR-Bildern einlesen (Unterordner eingeschlossen). Nicht-Bilder werden übergangen."
            onClick={() => {
              setOffen(false);
              ordnerFeld.current?.click();
            }}
          >
            Ganzen Ordner wählen…
          </button>
        </div>
      )}
      {/* Die Felder werden vom Knopf ausgelöst und stehen deshalb nicht selbst
          in der Tabfolge — sichtbar und bedienbar ist der Knopf. */}
      <input
        ref={dateiFeld}
        type="file"
        accept={EINLESE_ARTEN}
        multiple
        tabIndex={-1}
        className="nur-sr"
        aria-label="Dateien wählen…"
        onChange={(e) => {
          const dateien = [...(e.target.files ?? [])];
          e.target.value = "";
          if (dateien.length > 0) verteile(dateien);
        }}
      />
      {mitOrdner && (
        <input
          ref={ordnerFeld}
          type="file"
          multiple
          tabIndex={-1}
          className="nur-sr"
          aria-label="Ganzen Ordner wählen…"
          onChange={(e) => {
            // Ein Ordner enthält auch .DS_Store und Ähnliches: hier zählen nur
            // die Bilder, alles andere wird stillschweigend übergangen.
            const bilder = [...(e.target.files ?? [])].filter((d) => istBilddatei(d.name, d.type));
            e.target.value = "";
            props.onBilder(bilder);
          }}
        />
      )}
    </div>
  );
}

export function EinsatzDetail(props: {
  einsatz: Einsatzsammlung;
  onZurueck: () => void;
  onGeaendert: () => void;
  onScannen: () => void;
  onManuell: () => void;
  /** Fertige Bögen aus JSON-/PDF-Dateien. */
  onDateiImport: (dateien: File[]) => void;
  /** Stapel abfotografierter/gescannter QR-Codes (Mehrfachauswahl oder Ordner). */
  onBilderImport: (dateien: File[]) => void;
  onExport: () => void;
  /** Die Ausgabewege bekommen den gewählten Umfang mit: alle Bögen oder nur die seit dem letzten Export neuen. */
  onCsvExport: (umfang: ExportUmfang) => void;
  onCsvDetailExport: (umfang: ExportUmfang) => void;
  onOldenburgExport: (umfang: ExportUmfang) => void;
  /** Sammel-PDF (Übersicht, Bögen, eingebettete Sammlung) im gewählten Umfang. */
  onSammelPdf: (umfang: ExportUmfang) => void;
  /**
   * Einsatz weitergeben / sichern — immer die ganze Sammlung (Meldungen,
   * Zeiten, Historie, Züge), die das nächste Gerät über „Einsatz
   * importieren…" liest; unabhängig vom Kästchen „nur neue Bögen".
   * Optional, solange die App den Weg noch nicht verdrahtet hat.
   */
  onWeitergeben?: () => void;
  /** Einseitiges Lageblatt (Übersicht + Bedarf + Züge) als PDF. */
  onLageblatt?: () => void;
  onGeloescht: () => void;
  /** Die gerade eingegangene Meldung — sie quittiert in der Liste. */
  eingang?: Eingang | null;
  /** Stand des letzten Exports dieses Einsatzes (export-stand.ts); null oder weggelassen: noch keiner. */
  exportStand?: ExportStand | null;
  /**
   * Alle Bögen oder nur die neuen. Hält der Aufrufer die Wahl (app.tsx, damit
   * sie das Aus- und Einhängen der Ansicht übersteht), gibt er beides herein;
   * sonst führt die Ansicht sie selbst.
   */
  exportUmfang?: ExportUmfang;
  onExportUmfang?: (umfang: ExportUmfang) => void;
}) {
  const { einsatz, onZurueck, onGeaendert, onScannen, onManuell, onDateiImport, onBilderImport, onExport, onCsvExport, onCsvDetailExport, onOldenburgExport, onSammelPdf, onWeitergeben, onLageblatt, onGeloescht, eingang } = props;
  const exportStand = props.exportStand ?? null;
  const [eigenerUmfang, setEigenerUmfang] = useState<ExportUmfang>("alle");
  const exportUmfang = props.exportUmfang ?? eigenerUmfang;
  const setExportUmfang = props.onExportUmfang ?? setEigenerUmfang;
  const neueBoegen = neueEintraege(einsatz.eintraege, exportStand).length;
  const nurNeue = exportUmfang === "neue";
  // Beim Teilexport ohne neue Bögen gäbe es eine leere Datei — die Knöpfe
  // bleiben gesperrt, die Kästchenzeile sagt warum.
  const exportGesperrt = nurNeue && neueBoegen === 0;
  // Wann zuletzt ein Lageblatt entstand und was seitdem kam — ob der Aushang
  // an der Wand noch stimmt (Audit Runde 2, R2-A3). Bei jedem Rendern frisch
  // gelesen: pdf.ts vermerkt den Druck, die Ansicht rendert danach neu.
  const lageblattStand = lageblattStandLaden(einsatz.id);
  const [suche, setSuche] = useState("");
  const [sortierung, setSortierung] = useState<EinheitenSortierung>("name");
  // "" = keine Einschränkung. Schlüssel siehe einheiten-liste.ts.
  const [quali, setQuali] = useState("");
  // Nur Einheiten, bei denen jetzt etwas zu entscheiden ist — Kraftstoff
  // allein zählt nicht, den meldet fast jede Einheit (Audit Runde 2, R2-K4).
  // "ruhezeit"/"unterbringung" kommen aus den Kopfzahlen („Ruhezeit: 5×").
  const [bedarfsFilter, setBedarfsFilter] = useState<BedarfsFilter | null>(null);
  const nurBedarf = bedarfsFilter != null;
  const bedarfsFilterText =
    bedarfsFilter === "ruhezeit" ? "„nur mit Ruhezeit“" : bedarfsFilter === "unterbringung" ? "„nur mit Unterbringung“" : "„nur dringender Bedarf“";
  const aufBedarfFiltern = (f: BedarfsFilter) => {
    setBedarfsFilter(f);
    document.querySelector(".einheiten-filter")?.scrollIntoView?.({ block: "start" });
  };
  // Letzter Statuswechsel von Hand — solange er hier steht, gibt es den Rückweg.
  const [statusWechsel, setStatusWechsel] = useState<StatusWechsel | null>(null);
  // Karten oder Tabelle — geräteweit gemerkt (einheiten-tabelle.ts).
  const [ansicht, setAnsicht] = useState<EinheitenAnsicht>(gemerkteAnsicht);
  const sum = aggregiere(einsatz.eintraege, einsatz.art);
  const zugGruppen = aggregiereNachZug(einsatz.eintraege, einsatz.art);
  // Was die Lage NICHT enthält, gehört genauso sichtbar gemacht wie das, was
  // sie enthält (siehe zaehltInLage).
  const uebungenDaneben = uebungenAusserhalbDerLage(einsatz.eintraege, einsatz.art);
  // Zuletzt Entferntes — solange es hier steht, gibt es einen Rückweg. Beim
  // Entfernen einer Einheit ALLE ihre Fassungen, beim Verwerfen einer Fassung
  // nur diese (Audit Runde 2, R2-D1).
  const [zuletztEntfernt, setZuletztEntfernt] = useState<Entfernt | null>(null);

  /** Entferntes unverändert zurücklegen (mit Signatur, Herkunft, Zeiten, Notiz, Etiketten). */
  async function entferntesZurueckholen() {
    if (!zuletztEntfernt) return;
    const ok = await gesichert("Rückgängig", () => {
      einsatzImportieren({ ...einsatz, eintraege: zuletztEntfernt.eintraege });
      // Zurückgeholt gilt nicht mehr als „hier entfernt" (R2-D4).
      entfernteVergessen(einsatz.id, zuletztEntfernt.eintraege.map((e) => e.id));
    });
    if (!ok) return;
    setZuletztEntfernt(null);
    onGeaendert();
  }

  /**
   * Statuswechsel zurücknehmen: der Stand VOR dem Tipp kommt wieder — samt
   * der alten Abrückzeit, falls die Einheit vorher schon einmal abgerückt war.
   */
  async function statusZurueck() {
    if (!statusWechsel) return;
    const { vorher } = statusWechsel;
    const ok = await gesichert("Rückgängig", () =>
      statusMitZeitSetzen(einsatz.id, vorher.id, vorher.status, vorher.abgerueckAm),
    );
    if (!ok) return;
    setStatusWechsel(null);
    onGeaendert();
  }
  // Alle gemeldeten Einheiten (neueste Revision je Einheit) — Grundlage für die
  // Gesamtzahl; `kopf` ist davon nur der gerade angezeigte Ausschnitt. Suche,
  // Filter und Sortierung ändern die Summen oben bewusst nicht.
  const alleEinheiten = neuesteJeEinheit(einsatz.eintraege);
  // Die zuletzt eingelesene Einheit (siehe `eingang`) — für die Quittung oben.
  const eingegangen = eingang ? alleEinheiten.find((e) => e.einheitSchluessel === eingang.schluessel) : undefined;
  /**
   * Beim Öffnen und nach jeder Aufnahme beginnt die Ansicht oben, bei Summe
   * und Aufnahme-Knopf. Vorher öffnete sie mitten auf der Seite (mit der
   * Rollposition der vorigen Ansicht) bzw. an der neuen Karte, rund 700 px
   * unter dem Knopf für die nächste Einheit (Audit Runde 2, R2-S3). Die
   * Karte quittiert trotzdem; wer sie sehen will, tippt „In der Liste zeigen".
   */
  useEffect(() => {
    try {
      window.scrollTo(0, 0);
    } catch {
      /* Testumgebung ohne Layout */
    }
  }, [einsatz.id, eingang?.nonce]);
  /** Die Karte (oder Tabellenzeile) der zuletzt eingelesenen Einheit ins Bild holen. */
  function eingangZeigen() {
    if (!eingegangen) return;
    const ziel = [...document.querySelectorAll<HTMLElement>("[data-einheit]")].find(
      (el) => el.dataset.einheit === eingegangen.einheitSchluessel,
    );
    ziel?.scrollIntoView({ block: "center" });
  }
  const qualiListe = qualifikationenImEinsatz(alleEinheiten);
  const gewaehlteQuali = qualiListe.find((q) => q.schluessel === quali);
  // Zwei Gruppen in der Auswahlliste: „wer kann X?" und „wer darf was fahren?"
  // sind verschiedene Fragen; in einer Liste standen die Fahrerlaubnisklassen
  // alphabetisch zwischen den Funktionen (K6). Die Klassen tragen den
  // Schlüsselraum „kf…" (siehe qualisDerPerson).
  const istFahrerlaubnis = (schluessel: string) => schluessel === "kf" || schluessel.startsWith("kf:");
  const qualiFunktionen = qualiListe.filter((q) => !istFahrerlaubnis(q.schluessel));
  const qualiFahrerlaubnis = qualiListe.filter((q) => istFahrerlaubnis(q.schluessel));
  const kopfOhneBedarfsfilter = einheitenAnsicht(alleEinheiten, suche, sortierung, quali);
  const kopf = bedarfsFilter ? kopfOhneBedarfsfilter.filter((e) => passtZuBedarfsfilter(e, bedarfsFilter)) : kopfOhneBedarfsfilter;
  const gefiltert = kopf.length !== alleEinheiten.length;
  // Meldeköpfe melden oft nur die Stärke — dort steht keine Person und damit
  // keine Qualifikation. Ohne diesen Hinweis sähe der Filter wie ein Fehler aus.
  const ohnePersonen = alleEinheiten.filter(
    (e) => e.bogen.personalErfassung === PersonalErfassung.NUR_STAERKE || e.bogen.personal.length === 0,
  ).length;
  // Kurzform für die Trefferzeile an der Karte: „AGT" statt der ganzen
  // Beschriftung — die steht schon im Hinweis über der Liste.
  const qualiKurz = gewaehlteQuali?.label.split(" – ")[0] ?? "";

  /**
   * Einsatz löschen — mit Rückfrage, obwohl es „nur" in den Papierkorb geht.
   *
   * Der Knopf stand als einzige dauerhaft eingeblendete Aktion in der festen
   * Fußleiste, an genau der Stelle, an der im Assistenten „← Zurück" sitzt: ein
   * Daumentipp löschte die ganze Sammlung, ohne Frage, ohne Rückmeldung, und
   * der Rückweg über den Papierkorb ist von dort aus nicht zu sehen. Die
   * Rückfrage nennt deshalb den Umfang und den Papierkorb beim Namen.
   */
  async function loeschen() {
    const anzahl = neuesteJeEinheit(einsatz.eintraege).length;
    const sicher = await frageJaNein({
      titel: "Einsatz löschen?",
      text: `„${einsatz.name}" mit ${anzahl} gemeldeten Einheit${anzahl === 1 ? "" : "en"} wandert in den Papierkorb und lässt sich dort 30 Tage lang zurückholen.`,
      ok: "In den Papierkorb",
      gefahr: true,
    });
    if (!sicher) return;
    einsatzLoeschen(einsatz.id);
    onGeloescht();
  }

  return (
    <>
    <SeitenKopf variante="einsatz-kopf">
      {/* Rücksprung und Anzeige-Umschalter in einer Zeile — wie im Assistenten.
          Wer am Meldekopf in die Nacht oder in die Sonne gerät, darf den
          Umschalter nicht erst in der Fußzeile unter 30 Karten suchen müssen
          (Nacht-und-Sicht-Audit N3). */}
      <div className="kopf-oberzeile">
        <button type="button" className="zur-start" onClick={onZurueck}>‹ Einsätze</button>
        <AnzeigeSchalter />
      </div>
      <div className="titelzeile">
        <h1>{einsatz.name}</h1>
      </div>
      <p className="hinweis">
        {ART_LABEL[einsatz.art]}{einsatz.ort ? ` · ${einsatz.ort}` : ""}
      </p>
    </SeitenKopf>
    <main id="inhalt" tabIndex={-1} className="einsatz-detail">
      <section className="karte staerke-leiste">
        <div><Zaehlwert wert={sum.einheiten} /><span>Einheiten</span></div>
        <div><Zaehlwert wert={sum.staerke.fuehrer} /><span>Führer</span></div>
        <div><Zaehlwert wert={sum.staerke.unterfuehrer} /><span>Unterf.</span></div>
        <div><Zaehlwert wert={sum.staerke.mannschaft} /><span>Mannsch.</span></div>
        <div className="gesamt"><Zaehlwert wert={sum.staerke.gesamt} /><span>Gesamt</span></div>
      </section>

      {/* Aufnahme direkt unter der Summe: Beim Blick aufs Telefon steht oben
          die Gesamtzahl und gleich darunter „nächste Einheit". Unter Bedarf
          und Zwischensummen lag der Hauptknopf des Meldekopfs in keinem Fall
          im ersten Bild (Audit Runde 2, R2-S3). */}
      <div className="aktionen">
        <button type="button" className="primaer" onClick={onScannen}>Bogen scannen…</button>
        <button type="button" onClick={onManuell}>Einheit manuell erfassen…</button>
        {/* Datei, PDF, einzelne Bilder, viele Bilder, ganzer Ordner: ein Knopf,
            der die Sorte am Dateityp erkennt (siehe BoegenEinlesenKnopf). */}
        <BoegenEinlesenKnopf onDaten={onDateiImport} onBilder={onBilderImport} />
      </div>

      {/* Quittung der Aufnahme dort, wo nach dem Übernehmen der Blick liegt:
          Name und neue Gesamtzahl bei Summe und Aufnahme-Knopf, statt die
          Seite zur neuen Karte zu rollen (R2-S3). Unter den Knöpfen, damit
          sie den Knopf für die nächste Einheit nicht unter den Bildrand
          schiebt. */}
      {eingegangen && (
        <p className="meldung eingang-quittung" role="status">
          Zuletzt eingelesen: „{einheitAnzeigename(eingegangen.bogen.einheit)}"
          {eingegangen.teilEtikett ? ` (${eingegangen.teilEtikett})` : ""} · jetzt {sum.einheiten}{" "}
          {sum.einheiten === 1 ? "Einheit" : "Einheiten"}, Gesamt {sum.staerke.gesamt}.{" "}
          <button type="button" className="link" onClick={eingangZeigen}>In der Liste zeigen</button>
        </p>
      )}

      {/* Ausgenommene Übungsmeldungen: Die Zahlen darüber sind ohne sie
          gerechnet, und das muss dort stehen, wo die Zahlen stehen — nicht nur
          als Etikett an der einzelnen Karte weiter unten. Eine Zeile, die
          Namen auf Tipp: Der Hinweis wuchs mit jedem Namen und schob Summe und
          Aufnahme-Knöpfe unter den Bildrand (Audit Runde 2, R2-S3). Aus
          demselben Grund steht er unter den Aufnahme-Knöpfen: im Feld-Thema
          lag „Bogen scannen…" unter ihm bei 649 px, über ihm bei 545 px. */}
      {uebungenDaneben.length > 0 && (
        <details className="meldung uebung-ausgenommen">
          <summary>
            {uebungenDaneben.length} Übungsmeldung{uebungenDaneben.length === 1 ? "" : "en"} nicht gezählt — anzeigen
          </summary>
          <p>
            {uebungenDaneben.map((e) => einheitAnzeigename(e.bogen.einheit)).join(", ")}.{" "}
            {uebungenDaneben.length === 1 ? "Sie zählt" : "Sie zählen"} nicht in diese Lage; die Summen oben sind ohne{" "}
            sie gerechnet.
          </p>
        </details>
      )}


      <section className="karte">
        <h2>Bedarf (anwesende Einheiten)</h2>
        {/* Vier Bedarfsarten als beschriftete Paare statt als zwei Sätze: nach
            diesen Zahlen wird gezielt gesucht („wie viel Diesel?"), nicht
            gelesen. Im Fließtext lag jede Zahl an einer anderen Stelle der
            Zeile und war nur über den davorstehenden Begriff zu finden. */}
        <dl className="paare">
          <dt>Verpflegung</dt>
          <dd>
            <strong>{sum.verpflegung.gesamt}</strong>
            {" "}({sum.verpflegung.vegetarisch} vegetarisch / {sum.verpflegung.vegan} vegan)
          </dd>
          <dt>Unterbringung</dt>
          <dd>
            M {sum.unterbringung.m} / W {sum.unterbringung.w} / D {sum.unterbringung.d}
            {/* Schnellerfassungen ohne M/W/D-Aufteilung benennen statt als 0
                zu verschweigen (Audit Runde 2, R2-N5). */}
            {sum.unterbringungOhneAngabe > 0 ? ` · ${sum.unterbringungOhneAngabe} ohne M/W/D-Angabe` : ""}
            {/* Sprung in den passenden Filter: „wer braucht ein Quartier?" ist
                genau die Frage hinter der Zahl (Audit Runde 2, R2-K4). */}
            {sum.unterbringungBenoetigt > 0 && (
              <>
                {" · "}
                <button type="button" className="link" onClick={() => aufBedarfFiltern("unterbringung")}>
                  {sum.unterbringungBenoetigt}× angefordert
                </button>
              </>
            )}
          </dd>
          <dt>Kraftstoff</dt>
          <dd>
            Diesel {sum.kraftstoff.dieselLiter} l · Benzin {sum.kraftstoff.benzinLiter} l
            {sum.kraftstoff.gemischLiter > 0 ? ` · Gemisch ${sum.kraftstoff.gemischLiter} l` : ""}
          </dd>
          <dt>Fahrzeuge</dt>
          <dd>
            {sum.fahrzeuge}
            {sum.ruhezeitErforderlich > 0 && (
              <>
                {" · "}
                <button type="button" className="link" onClick={() => aufBedarfFiltern("ruhezeit")}>
                  Ruhezeit: {sum.ruhezeitErforderlich}×
                </button>
              </>
            )}
          </dd>
        </dl>
      </section>

      {/* Ab drei Zügen zugeklappt: der Block schob auf dem Tablet den Einstieg
          in die Einheitenliste unter den Falz (K6). Die Zusammenfassung nennt
          die Zahl, damit klar ist, was sich dahinter verbirgt. */}
      {zugGruppen.length > 1 && (
        <details className="karte zug-summen" open={zugGruppen.length < 3}>
          <summary><h2>Zwischensummen nach Zug ({zugGruppen.length} Züge)</h2></summary>
          {zugGruppen.map((g) => (
            <div className="zug-summe" key={g.zugEtikett ? `zug:${g.zugEtikett}` : "zug:ohne"}>
              <p>
                <strong>{g.zugEtikett ?? "Ohne Zug"}</strong>
                {" · "}{g.summen.einheiten} Einheit(en){" · "}Stärke {summenStaerkeText(g.summen)}
              </p>
              <p className="hinweis">
                Verpflegung {g.summen.verpflegung.gesamt}
                {" · "}Unterbringung M {g.summen.unterbringung.m} / W {g.summen.unterbringung.w} / D {g.summen.unterbringung.d}
                {g.summen.unterbringungOhneAngabe > 0 ? ` (${g.summen.unterbringungOhneAngabe} ohne Angabe)` : ""}
                {" · "}Fahrzeuge {g.summen.fahrzeuge}
              </p>
            </div>
          ))}
        </details>
      )}


      {/* Zweite Reihe: was aus der Sammlung herausgeht. Die erste nimmt Bögen
          auf. Der Sprung zwischen den Reihen muss größer sein als der zwischen
          den Knöpfen, sonst liest sich die Aufteilung als zufälliger Umbruch
          einer einzigen Reihe aus sieben gleichrangigen Knöpfen. */}
      {(onWeitergeben || onLageblatt) && (
        <div className="vorlage-aktionen einsatz-weitergabe">
          {/* Der Weg, der immer geht — auch am Einsatzende, wenn alle abgerückt
              sind. Er hieß „Sammel-PDF" und versprach ein Druckstück; dass er
              die ganze Sammlung trägt, stand nur im Tooltip, den ein Telefon nie
              zeigt (W2). Das Lageblatt daneben ist das Papier für die Wand:
              eine Seite statt 41 (A3, A4). */}
          {onWeitergeben && (
            <button
              type="button"
              className="primaer"
              onClick={onWeitergeben}
              title="Die ganze Sammlung als Datei — auf dem nächsten Gerät über „Einsatz importieren…“ einlesbar."
            >
              Einsatz weitergeben / sichern
            </button>
          )}{" "}
          {onLageblatt && (
            <button
              type="button"
              onClick={onLageblatt}
              title="Nur die Übersicht: Einheiten mit Zug, Eintreff- und Abrückzeit, Bedarf und Zwischensummen — A4 quer, ohne Bögen; bis etwa zwölf Einheiten eine Seite."
            >
              {/* Ehrlich beschriftet: bei großen Lagen wird es mehr als eine
                  Seite (Audit Runde 2, R2-K3). */}
              Lageblatt (A4 quer)
            </button>
          )}{" "}
        </div>
      )}
      {onLageblatt && (
        <p className="hinweis lageblatt-stand" role="status">
          {lageblattStand
            ? `Lageblatt erstellt ${exportZeitKurz(lageblattStand.zeitpunkt)} · ${seitdemText(neueEintraege(einsatz.eintraege, lageblattStand).length)}`
            : "Noch kein Lageblatt aus diesem Einsatz."}
        </p>
      )}
      {onWeitergeben && (
        <p className="hinweis einsatz-ausgaben-hinweis">
          {/* Ein Knopf für die ganze Sammel-PDF: „Sammel-PDF (alle Bögen)"
              darunter erzeugte dieselbe Datei — zwei gleichwertige Knöpfe, und
              welcher „für Papier" ist, stand nur hier (Audit Runde 2, R2-A3). */}
          „Einsatz weitergeben / sichern" erzeugt die Sammel-PDF mit allen Bögen (zum Drucken) und allen Meldungen,
          Zeiten, Historie und Zügen — auf dem nächsten Gerät über „Einsatz importieren…" einlesbar, auch wenn alle
          abgerückt sind. Nur die neuen Bögen für den Stab: Kästchen unten.
        </p>
      )}
      {/* Der Meldekopf liefert dem Stab nach: einmal am Abend alles, am Morgen
          nur, was seitdem dazukam. Das Kästchen schaltet alle vier Ausgabewege
          um; die Zeile sagt, wann zuletzt exportiert wurde und wie viel
          seitdem neu ist (Rückmeldung Anwender, September 2026). */}
      <div className="export-umfang">
        <label className="inline">
          <input
            type="checkbox"
            checked={nurNeue}
            onChange={(e) => setExportUmfang(e.target.checked ? "neue" : "alle")}
          />
          Nur neue Bögen seit dem letzten Export
        </label>
        <span className="hinweis">
          {exportStand
            ? `Zuletzt exportiert ${exportZeitKurz(exportStand.zeitpunkt)} · seitdem ${
                neueBoegen === 0 ? "keine neuen Bögen" : neueBoegen === 1 ? "1 neuer Bogen" : `${neueBoegen} neue Bögen`
              }`
            : "Noch kein Export aus diesem Einsatz — alle Bögen sind neu."}
        </span>
      </div>
      <div className="vorlage-aktionen einsatz-ausgaben">
        {/* Die ganze Sammel-PDF liegt auf „Einsatz weitergeben / sichern";
            hier nur noch der Nachtrag „nur neue Bögen" (R2-A3). Ohne
            Weitergabe-Knopf bleibt der Gesamtweg hier. */}
        {(nurNeue || !onWeitergeben) && (
          <>
            <button
              type="button"
              onClick={() => onSammelPdf(exportUmfang)}
              disabled={exportGesperrt}
              title={nurNeue
                ? "Nur die seit dem letzten Export neuen Bögen als eine PDF — mit eingebetteten Daten dieser Bögen. Auf dem Zielgerät über „Einsatz importieren…“ einlesbar."
                : "Alle Bögen als eine PDF — mit eingebetteter kompletter Sammlung (Züge, Status, Historie). Auf dem Zielgerät über „Einsatz importieren…“ einlesbar."}
            >
              {nurNeue ? "Sammel-PDF (nur neue Bögen)" : "Sammel-PDF (alle Bögen)"}
            </button>{" "}
          </>
        )}
        {/* Zwei CSV-Wege, weil zwei verschiedene Fragen dahinterstehen: die
            Übersicht beantwortet „wie stark ist die Lage?" (eine Zeile je
            Einheit, mit Summenzeile), der Detail-Export „wer und was genau ist
            da?" (jede Person, jedes Fahrzeug einzeln). */}
        <button type="button" onClick={() => onCsvExport(exportUmfang)} disabled={exportGesperrt} title="Eine Zeile je anwesender Einheit mit Stärke, Verpflegung, Unterbringung und Kraftstoff — plus Summenzeile. Für die Lagekarte.">
          Übersicht als CSV
        </button>{" "}
        <button type="button" onClick={() => onCsvDetailExport(exportUmfang)} disabled={exportGesperrt} title="Alle Daten aller gemeldeten Einheiten: je Einheit eine Zeile, dazu eine Zeile pro Person und pro Fahrzeug. Für Auswertung in Excel.">
          Alle Daten als CSV
        </button>{" "}
        {/* Drittes Format, weil es keinem der beiden CSVs entspricht: eine
            fremde Excel-Vorlage mit fester Spaltenfolge, in die die
            Führungsstelle die Zeilen direkt einfügt. */}
        <button type="button" onClick={() => onOldenburgExport(exportUmfang)} disabled={exportGesperrt} title="Einheitenliste im Format der Führungsstelle Oldenburg: je gemeldeter Einheit eine Zeile, Spalten und Formatierung wie in deren Excel-Vorlage.">
          Excel-Liste (Format „Oldenburg“)
        </button>{" "}
        {/* Roh-JSON nur im Debug-Modus: fürs Publikum trägt die Sammel-PDF die
            Bögen als eingebettetes JSON — ein separater Export verwirrt nur. */}
        {debugAktiv() && (
          <button type="button" onClick={onExport}>Als Datei exportieren (Debug)</button>
        )}
      </div>

      <section className="karte">
        <div className="kopfzeile">
          {/* Zwei beschriftete Zahlen statt drei unbeschrifteter: „gemeldet"
              ist die Länge der Liste, „zählend" die Zahl der Stärkeleiste —
              dieselbe Zählweise wie die Summenzeile der Tabelle (K4). */}
          <h2>
            Einheiten ({gefiltert ? `${kopf.length} von ${alleEinheiten.length}` : alleEinheiten.length} gemeldet
            {" · "}{sum.einheiten} zählend)
          </h2>
          {/* Zwei Sichten auf dieselbe (gesuchte, gefilterte, sortierte) Liste:
              die Karten für die Arbeit an einer Einheit, die Tabelle für den
              Vergleich über alle — „wer hat die meisten Kräfte?" ist an
              Karten untereinander nicht zu beantworten. */}
          {alleEinheiten.length > 0 && (
            <span className="ansicht-umschalter" role="group" aria-label="Darstellung der Einheiten">
              {([
                { wert: "karten", label: "Karten" },
                { wert: "tabelle", label: "Tabelle" },
              ] as const).map((a) => (
                <button
                  key={a.wert}
                  type="button"
                  aria-pressed={ansicht === a.wert}
                  onClick={() => {
                    setAnsicht(a.wert);
                    merkeAnsicht(a.wert);
                  }}
                >
                  {a.label}
                </button>
              ))}
            </span>
          )}
        </div>
        {/* Ab einer Handvoll Meldungen trägt die Liste allein nicht mehr — bei
            einer Großlage stehen hier 30–50 Einheiten. Bei einer einzigen
            Meldung wäre die Leiste nur Beiwerk, ab der zweiten steht sie
            bereit: eine erst später auftauchende Leiste liest sich am Gerät
            wie eine fehlende Funktion (Rückmeldung Anwender, August 2026). */}
        {alleEinheiten.length > 1 && (
          <div className="zeile einheiten-filter">
            <label className="feld">
              Suche
              <input
                type="search"
                value={suche}
                placeholder="Einheit, Organisation, Ort, Zug, Kennzeichen…"
                onChange={(e) => setSuche(e.target.value)}
              />
            </label>
            <label className="feld sortierung">
              Sortierung
              <Auswahl
                beschriftung="Sortierung"
                value={sortierung}
                onChange={(e) => setSortierung(e.target.value as EinheitenSortierung)}
              >
                {SORTIERUNGEN.map((s) => (
                  <option key={s.wert} value={s.wert}>{s.label}</option>
                ))}
              </Auswahl>
            </label>
            {/* Erst anbieten, wenn überhaupt Qualifikationen gemeldet sind —
                bei reinen Stärkemeldungen wäre die Liste leer. */}
            {qualiListe.length > 0 && (
              <label className="feld sortierung">
                Qualifikation
                <Auswahl
                  beschriftung="Qualifikation"
                  value={quali}
                  onChange={(e) => setQuali(e.target.value)}
                >
                  <option value="">alle</option>
                  {qualiFunktionen.length > 0 && (
                    <optgroup label="Funktionen">
                      {qualiFunktionen.map((q) => (
                        <option key={q.schluessel} value={q.schluessel}>
                          {q.label} ({q.personen})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {qualiFahrerlaubnis.length > 0 && (
                    <optgroup label="Fahrerlaubnis">
                      {qualiFahrerlaubnis.map((q) => (
                        <option key={q.schluessel} value={q.schluessel}>
                          {q.label} ({q.personen})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </Auswahl>
              </label>
            )}
            {/* „Wer braucht etwas?" — der Bedarf stand nur als Summe im Kopf,
                die Zuordnung führte die Führungskraft nebenbei auf Papier (K1). */}
            <label className="inline bedarf-filter" title="Ruhezeit, Unterbringung, abweichende Verpflegung — Kraftstoff allein zählt nicht.">
              <input
                type="checkbox"
                checked={nurBedarf}
                onChange={(e) => setBedarfsFilter(e.target.checked ? "dringend" : null)}
              />
              {" "}nur dringender Bedarf (ohne Kraftstoff)
            </label>
          </div>
        )}
        {gewaehlteQuali && (
          <p className="hinweis" role="status">
            <strong>{gewaehlteQuali.personen}</strong>
            {gewaehlteQuali.personen === 1 ? " Einsatzkraft" : " Einsatzkräfte"} mit {`„${gewaehlteQuali.label}“`}
            {" in "}{gewaehlteQuali.einheiten} {gewaehlteQuali.einheiten === 1 ? "Einheit" : "Einheiten"}.
            {ohnePersonen > 0 && (
              <>
                {" "}
                {ohnePersonen === 1
                  ? "Eine Meldung führt keine Personen und bleibt hier außen vor."
                  : `${ohnePersonen} Meldungen führen keine Personen und bleiben hier außen vor.`}
              </>
            )}
            {" "}
            <button type="button" className="link" onClick={() => setQuali("")}>Filter aufheben</button>
          </p>
        )}
        {(bedarfsFilter === "ruhezeit" || bedarfsFilter === "unterbringung") && kopf.length > 0 && (
          <p className="hinweis" role="status">
            {kopf.length} {kopf.length === 1 ? "Einheit" : "Einheiten"} {bedarfsFilter === "ruhezeit" ? "mit Ruhezeit" : "mit angeforderter Unterbringung"}.{" "}
            <button type="button" className="link" onClick={() => setBedarfsFilter(null)}>Bedarfsfilter aufheben</button>
          </p>
        )}
        {alleEinheiten.length === 0 && <p className="hinweis">Noch keine Meldung. Bogen scannen oder manuell erfassen.</p>}
        {alleEinheiten.length > 0 && kopf.length === 0 && (
          <p className="hinweis">
            Keine Einheit passt zu{" "}
            {[suche.trim() && `„${suche.trim()}“`, gewaehlteQuali && `„${gewaehlteQuali.label}“`, nurBedarf && bedarfsFilterText]
              .filter(Boolean)
              .join(" und ")}
            .{" "}
            {suche.trim() !== "" && (
              <button type="button" className="link" onClick={() => setSuche("")}>Suche löschen</button>
            )}
            {suche.trim() !== "" && gewaehlteQuali ? " · " : ""}
            {gewaehlteQuali && (
              <button type="button" className="link" onClick={() => setQuali("")}>Filter aufheben</button>
            )}
            {nurBedarf && (
              <>
                {suche.trim() !== "" || gewaehlteQuali ? " · " : ""}
                <button type="button" className="link" onClick={() => setBedarfsFilter(null)}>Bedarfsfilter aufheben</button>
              </>
            )}
          </p>
        )}
        {ansicht === "tabelle" && kopf.length > 0 && <EinheitenTabelle meldungen={kopf} art={einsatz.art} eingang={eingang} />}
        {/* Eine Liste: das Vorleseprogramm nennt die Zahl der Einheiten und
            erlaubt den Sprung von Eintrag zu Eintrag (R2-M4). */}
        {ansicht === "karten" && kopf.length > 0 && (
          <ul className="einheiten-liste">
            {kopf.map((e) => (
              <EinheitKarte
                key={e.einheitSchluessel}
                einsatzId={einsatz.id}
                kopf={e}
                alle={einsatz.eintraege}
                onGeaendert={onGeaendert}
                qualifikation={quali}
                qualifikationKurz={qualiKurz}
                eingang={eingang}
                onEntfernt={setZuletztEntfernt}
                onStatusWechsel={setStatusWechsel}
              />
            ))}
          </ul>
        )}
      </section>

      {/* Das Löschen gehört ans Ende des Inhalts, nicht in die feste Leiste am
          Daumen: Es ist die seltenste und folgenschwerste Handlung dieser
          Ansicht. */}
      <section className="karte einsatz-verwalten">
        <h2>Einsatz verwalten</h2>
        <p className="hinweis">
          Gelöschte Einsätze liegen 30 Tage im Papierkorb auf der Startseite und lassen sich von dort zurückholen.
        </p>
        <button type="button" className="entfernen" onClick={loeschen}>Einsatz löschen…</button>
      </section>

      {/* Quittung von Entfernen und Statuswechsel mit Rückweg — fest im
          Daumenbereich statt über den Summen am Seitenanfang: Wer in einer
          langen Liste bei 2 400 px „Abrücken" traf, sah die Quittung nicht,
          „Rückgängig" war ein 74 × 30 px großer Textlink (Audit Runde 2,
          R2-H4). Eine Quittung zur Zeit: die jüngere ersetzt die ältere. */}
      {zuletztEntfernt && (
        <DaumenQuittung
          key={`entfernt:${zuletztEntfernt.eintraege.map((e) => e.id).join(",")}`}
          onRueckgaengig={() => void entferntesZurueckholen()}
          onSchliessen={() => setZuletztEntfernt(null)}
        >
          {zuletztEntfernt.art === "fassung"
            ? `Fassung Stand ${standText(zuletztEntfernt.eintraege[0]!.bogen)} von „${einheitAnzeigename(zuletztEntfernt.eintraege[0]!.bogen.einheit)}" verworfen.`
            : `Meldung „${einheitAnzeigename(zuletztEntfernt.eintraege[0]!.bogen.einheit)}" entfernt${
                zuletztEntfernt.eintraege.length > 1 ? ` (${zuletztEntfernt.eintraege.length} Fassungen)` : ""
              }.`}
        </DaumenQuittung>
      )}
      {/* Statuswechsel mit Uhrzeit: Ein Tipp nahm die Einheit bisher wortlos
          aus allen Summen — und niemand konnte hinterher sagen, wann (D4, W3).
          Sie liegt womöglich genau unter dem Finger, der eben „Abrücken"
          getippt hat; ihre Knöpfe tragen deshalb denselben Prellschutz wie
          die Karte (R2-G4). */}
      {statusWechsel && (
        <DaumenQuittung
          key={`status:${statusWechsel.vorher.id}:${statusWechsel.zeit}`}
          prellschutz
          onRueckgaengig={() => void statusZurueck()}
          onSchliessen={() => setStatusWechsel(null)}
        >
          „{einheitAnzeigename(statusWechsel.vorher.bogen.einheit)}"{" "}
          {statusWechsel.status === MeldeStatus.ABGERUECKT ? "abgerückt" : "wieder anwesend"}{" "}
          {zeitKurz(statusWechsel.zeit)}
        </DaumenQuittung>
      )}
    </main>
    </>
  );
}

/**
 * Einheitenliste als Tabelle: eine Zeile je Meldung, Spalten wie im
 * CSV-Export der Übersicht, darunter eine Summenzeile über die anwesenden
 * Zeilen der Auswahl.
 *
 * Gesucht und gefiltert wird oben in der Leiste — die Tabelle bekommt genau
 * das Ergebnis. Zusätzlich sind die Spaltenköpfe Sortierknöpfe: das ist der
 * Griff, den eine Tabelle mitbringt und eine Kartenliste nicht („welche
 * Einheit meldet den größten Verpflegungsbedarf?"). Zahlen starten dabei
 * absteigend — gefragt ist der größte Wert, nicht die Null.
 */
function EinheitenTabelle({ meldungen, art, eingang }: { meldungen: MeldeEintrag[]; art: EinsatzArt; eingang?: Eingang | null }) {
  // null = Reihenfolge der Liste (Sortierauswahl der Leiste) unverändert
  // übernehmen. Erst ein Klick auf einen Spaltenkopf ordnet hier um.
  const [spalte, setSpalte] = useState<TabellenSpalte | null>(null);
  const [richtung, setRichtung] = useState<Sortierrichtung>("auf");
  const zeilen = tabellenZeilen(meldungen, art);
  const sortiert = spalte ? zeilenSortieren(zeilen, spalte, richtung) : zeilen;
  const summe = tabellenSumme(zeilen);
  const zaehlung = tabellenZaehlung(zeilen);

  function sortierenNach(s: TabellenSpalte, zahl: boolean) {
    if (spalte === s) {
      setRichtung(richtung === "auf" ? "ab" : "auf");
      return;
    }
    setSpalte(s);
    setRichtung(zahl ? "ab" : "auf");
  }

  /** Summenzeile spaltenweise — dieselbe Reihenfolge wie die Datenzeilen. */
  const summenWert: Record<TabellenSpalte, string | number> = {
    einheit: summenBeschriftung(zaehlung),
    organisation: "",
    zugEtikett: "",
    fuehrer: summe.staerke.fuehrer,
    unterfuehrer: summe.staerke.unterfuehrer,
    mannschaft: summe.staerke.mannschaft,
    gesamt: summe.staerke.gesamt,
    verpflegung: summe.verpflegung.gesamt,
    vegetarisch: summe.verpflegung.vegetarisch,
    vegan: summe.verpflegung.vegan,
    unterbringungM: summe.unterbringung.m,
    unterbringungW: summe.unterbringung.w,
    unterbringungD: summe.unterbringung.d,
    diesel: summe.kraftstoff.dieselLiter,
    benzin: summe.kraftstoff.benzinLiter,
    gemisch: summe.kraftstoff.gemischLiter,
    fahrzeuge: summe.fahrzeuge,
    bedarf: "",
    eingetroffen: "",
    abgerueckt: "",
    stand: "",
    auftrag: "",
  };

  return (
    <>
      <TabellenScroll titel="Einheitenübersicht">
        <table className="uebersicht einheiten-tabelle">
          <caption className="nur-sr">
            Gemeldete Einheiten mit Stärke, Verpflegung, Unterbringung und Kraftstoff
          </caption>
          <thead>
            <tr>
              {TABELLEN_SPALTEN.map((s) => (
                <th
                  key={s.schluessel}
                  scope="col"
                  className={s.zahl ? "zahl" : undefined}
                  aria-sort={
                    spalte === s.schluessel
                      ? richtung === "auf"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  <button
                    type="button"
                    className="spalten-sortierung"
                    title={`Nach ${s.titel} sortieren`}
                    onClick={() => sortierenNach(s.schluessel, s.zahl)}
                  >
                    <span aria-hidden="true">{s.kopf}</span>
                    <span className="nur-sr">{s.titel}</span>
                    {spalte === s.schluessel && (
                      <span className="sortier-pfeil" aria-hidden="true">
                        {richtung === "auf" ? "▲" : "▼"}
                      </span>
                    )}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortiert.map((z) => (
              <TabellenZeileZelle key={z.eintrag.einheitSchluessel} zeile={z} eingang={eingang} />
            ))}
          </tbody>
          {/* Die Summe zählt nur die anwesenden Zeilen der Auswahl — abgerückte
              stehen in der Tabelle, aber in keiner Summe, genau wie in der
              Stärkeleiste oben. */}
          <tfoot>
            <tr>
              {TABELLEN_SPALTEN.map((s) => (
                <td key={s.schluessel} className={s.zahl ? "zahl" : undefined}>
                  {summenWert[s.schluessel]}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </TabellenScroll>
      <p className="hinweis">
        Spaltenkopf anklicken sortiert die Tabelle. Details, Historie und Aktionen einer Einheit
        stehen in der Kartenansicht.
      </p>
    </>
  );
}

/**
 * Kennzeichnung einer Meldung, deren Datenschutzfrist abgelaufen ist — ihre
 * Personaldaten hat die Sammlung beim Laden schon entfernt. Ohne die Marke
 * sähe „Einsatzkraft 1" wie ein Erfassungsfehler aus.
 */
function AnonymBadge({ bogen }: { bogen: Erfassungsbogen }) {
  if (!datenschutzfristAbgelaufen(bogen, datenschutzZeitpunkt())) return null;
  return (
    <span className="uebung-badge" title="Datenschutzfrist abgelaufen: Namen, Funktionen, Qualifikationen und Erreichbarkeiten wurden entfernt.">
      ANONYMISIERT
    </span>
  );
}

/** Marke „alt" am Absender-Stand, der weit vor dem Eintreffen liegt (siehe standIstAlt). */
function AltBadge() {
  return (
    <span className="alt-badge" title="Der Stand des Absenders liegt mehr als 24 Stunden vor dem Eintreffen — die Zahlen stammen aus einer anderen Zeit.">
      alt
    </span>
  );
}

/** Eine Datenzeile — abgerückte Meldungen bleiben sichtbar, aber durchgestrichen. */
function TabellenZeileZelle({ zeile: z, eingang }: { zeile: TabellenZeile; eingang?: Eingang | null }) {
  const zeile = useEingangsquittung<HTMLTableRowElement>(marke(eingang, z.eintrag.einheitSchluessel), { rollen: false });
  return (
    <tr ref={zeile} data-einheit={z.eintrag.einheitSchluessel} className={z.anwesend ? undefined : "gestrichen"}>
      <th scope="row">
        {z.einheit}
        {z.eintrag.bogen.uebung ? <span className="uebung-badge">ÜBUNG</span> : null}
        <AnonymBadge bogen={z.eintrag.bogen} />
        {z.teilEtikett ? <span className="teil-badge">{z.teilEtikett}</span> : null}
        {!z.anwesend && (
          <span className="muster-sub">
            {z.eintrag.status === MeldeStatus.ABGERUECKT ? "abgerückt" : "zusammengeführt"}
          </span>
        )}
      </th>
      {/* Die Zellen folgen TABELLEN_SPALTEN, damit Kopf, Zeile und Summe nie
          auseinanderlaufen, wenn die Spaltenfolge sich ändert (R2-K5). */}
      {TABELLEN_SPALTEN.filter((s) => s.schluessel !== "einheit").map((s) => (
        <TabellenZelle key={s.schluessel} spalte={s.schluessel} zeile={z} />
      ))}
    </tr>
  );
}

/** Eine Datenzelle der Einheitentabelle (alles außer dem Zeilenkopf „Einheit"). */
function TabellenZelle({ spalte, zeile: z }: { spalte: TabellenSpalte; zeile: TabellenZeile }) {
  switch (spalte) {
    // Zahl plus Typen: „3" beantwortet die Summenfrage, „GKW / MzKW" die
    // nach dem, was tatsächlich dasteht.
    case "fahrzeuge":
      return <td className="zahl" title={z.fahrzeugTypen}>{z.fahrzeuge}</td>;
    case "bedarf":
      return <td className="bedarf-zelle">{z.bedarf}</td>;
    case "auftrag":
      return <td className="auftrag-zelle">{z.auftrag}</td>;
    case "stand":
      return (
        <td>
          {z.stand}
          {z.standAlt && <AltBadge />}
        </td>
      );
    case "einheit":
    case "organisation":
    case "zugEtikett":
    case "eingetroffen":
    case "abgerueckt":
      return <td>{z[spalte]}</td>;
    default:
      return <td className="zahl">{z[spalte]}</td>;
  }
}

/**
 * Zahl der Stärke-Leiste. Ändert eine neue Meldung den Wert, quittiert die
 * Zahl das mit dem Aufblitzen aus index.html (.zahl-geaendert) — dieselbe
 * Quittung wie die abgeleitete Stärke im Personal-Schritt (siehe quittung.ts).
 */
function Zaehlwert({ wert }: { wert: number }) {
  return <strong ref={useZahlQuittung<HTMLElement>(wert)}>{wert}</strong>;
}

/**
 * Read-only Vollansicht eines gemeldeten Bogens (Zugehörigkeit, Einsatz,
 * Personal, Fahrzeuge, Sofortbedarf) — spiegelt die Erfassungs-Übersicht bzw.
 * das PDF, aber ohne Bearbeiten-Aktionen: fremde Bögen werden hier nur gelesen.
 */
function BogenDetails({ bogen }: { bogen: Erfassungsbogen }) {
  const org = bogen.einheit.organisation;
  const s = staerke(bogen);
  const mwd = unterbringungMWD(bogen);
  const vp = verpflegung(bogen);
  const nurStaerke = bogen.personalErfassung === PersonalErfassung.NUR_STAERKE;
  const sb = bogen.sofortbedarf;

  return (
    <div className="bogen-details">
      <h4>Zugehörigkeit</h4>
      <dl className="paare">
        <dt>Organisation</dt>
        <dd>{orgLabel(org)}{bogen.einheit.organisationName ? ` — ${bogen.einheit.organisationName}` : ""}</dd>
        <dt>Einheitstyp</dt>
        <dd>{vokabText(bogen.einheit.einheitsTyp, vokabularFuer(org, "einheitstyp"), "name") || "—"}</dd>
        {/* <div> statt <span>: nur <div> ist in einer Definitionsliste als
            Gruppierung zulässig, sonst verliert Vorlesesoftware den Bezug
            zwischen Ebene und Name. */}
        {bogen.einheit.hierarchie.map((h, i) => (
          <div key={i} style={{ display: "contents" }}>
            <dt>{vokabText(h.bezeichnung, vokabularFuer(org, "ebene")) || "Ebene"}</dt>
            <dd>{h.name}{h.kurz ? ` (${h.kurz})` : ""}{h.telefon ? ` · ${h.telefon}` : ""}{h.email ? ` · ${h.email}` : ""}</dd>
          </div>
        ))}
      </dl>

      <h4>Einsatz / Auftrag</h4>
      <dl className="paare">
        <dt>Zeitraum</dt>
        <dd>{datumDeutsch(datumZuIso(bogen.einsatz.zeitraumVon))} – {datumDeutsch(datumZuIso(bogen.einsatz.zeitraumBis))}</dd>
        <dt>Ort / Auftrag</dt><dd>{bogen.einsatz.ortAuftrag || "—"}</dd>
        <dt>Beginn / Ende</dt>
        <dd>
          {bogen.einsatz.einsatzbeginn != null ? zeitpunktDeutsch(bogen.einsatz.einsatzbeginn) : "—"}
          {" / "}
          {bogen.einsatz.einsatzende != null ? zeitpunktDeutsch(bogen.einsatz.einsatzende) : "—"}
        </dd>
      </dl>

      <h4>Personal ({s.fuehrer} / {s.unterfuehrer} / {s.mannschaft} / {s.gesamt})</h4>
      {nurStaerke && (
        <p className="hinweis">
          Meldekopf-Modus: nur Stärke gemeldet{bogen.personal.length > 0 ? " — unten die Ansprechpartner:innen" : ""}.
        </p>
      )}
      {bogen.personal.length > 0 ? (
        <TabellenScroll titel="Personal">
          <table className="uebersicht">
            <thead>
              {/* Spalten wie in der Bogen-Übersicht: erst die Rolle, dann die
                  Funktion — der Meldekopf liest beide Listen nebeneinander. */}
              <tr><th title={STAERKE_LEGENDE}>Rolle</th><th>Funktion / Zusatzfunktion</th><th>Name, Vorname</th><th>Erreichbarkeit</th></tr>
            </thead>
            <tbody>
              {bogen.personal.map((p, i) => (
                <tr key={i}>
                  <td><RolleMarke rolle={p.staerkeRolle} /></td>
                  <td>{funktionsText(p, org) || "—"}</td>
                  <td>{p.nachname}{p.nachname && p.vorname ? ", " : ""}{p.vorname}</td>
                  <td>{p.kontakte.map(kontaktText).join(" · ") || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TabellenScroll>
      ) : (
        !nurStaerke && <p className="hinweis">Kein Personal erfasst.</p>
      )}
      <p className="hinweis">Unterbringung: M {mwd.m} / W {mwd.w} / D {mwd.d}</p>

      <h4>Fahrzeuge ({bogen.fahrzeuge.length})</h4>
      {bogen.fahrzeuge.length > 0 ? (
        <TabellenScroll titel="Fahrzeuge">
          <table className="uebersicht">
            <thead>
              <tr><th>Typ</th><th>Kennzeichen</th><th>Funkrufname</th><th>StAN</th><th>Änderungen</th></tr>
            </thead>
            <tbody>
              {bogen.fahrzeuge.map((f, i) => (
                <tr key={i}>
                  <td>{vokabText(f.typ, vokabularFuer(org, "fahrzeug")) || "—"}</td>
                  <td>{kennzeichenText(f) || "—"}</td>
                  <td>{funkrufText(f, bogen.einheit) || "—"}</td>
                  <td>{f.stanKonform == null ? "—" : f.stanKonform ? "ja" : "nein"}</td>
                  <td>{f.aenderungen ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TabellenScroll>
      ) : (
        <p className="hinweis">Keine Fahrzeuge erfasst.</p>
      )}

      <h4>Sofortbedarf &amp; Sonstiges</h4>
      <dl className="paare">
        <dt>Verpflegung</dt>
        <dd>{sb ? `${sb.verpflegungPersonen} Personen, davon ${vp.vegetarisch} vegetarisch, ${vp.vegan} vegan` : "—"}</dd>
        <dt>Betriebsstoff</dt>
        <dd>{sb ? `${sb.dieselLiter} l Diesel / ${sb.benzinLiter} l Benzin / ${sb.gemischLiter} l Gemisch` : "—"}</dd>
        <dt>Unterbringung / Ruhezeit</dt>
        <dd>{sb ? `${sb.unterbringung ? "Unterbringung" : "keine Unterbringung"} · ${sb.ruhezeitErforderlich ? "Ruhezeit erforderlich" : "keine Ruhezeit"}` : "—"}</dd>
        <dt>Sonstiges</dt><dd>{bogen.sonstiges || "—"}</dd>
      </dl>
    </div>
  );
}

// ------------------------------------------------------- Änderungen (Diff)

/** Geänderte Felder als „vorher → nachher"; rendert nichts, wenn leer. */
function DiffWerte({ titel, eintraege }: { titel: string; eintraege: WertAenderung[] }) {
  if (eintraege.length === 0) return null;
  return (
    <>
      <h4>{titel}</h4>
      <ul className="diff-liste">
        {eintraege.map((a) => (
          <li key={a.feld}>
            <span className="diff-feld">{a.feld}:</span> <span className="diff-vorher">{a.vorher}</span>
            {" → "}
            <span className="diff-nachher">{a.nachher}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

/** Zu- bzw. abgegangene Positionen (Personen, Fahrzeuge). */
function DiffPosten({ titel, art, zeilen }: { titel: string; art: "zugang" | "abgang"; zeilen: string[] }) {
  if (zeilen.length === 0) return null;
  return (
    <>
      <h4>{titel}</h4>
      <ul className={`diff-liste ${art}`}>
        {zeilen.map((z, i) => (
          <li key={`${z}-${i}`}>
            <span className="diff-zeichen">{art === "zugang" ? "+" : "−"}</span> {z}
          </li>
        ))}
      </ul>
    </>
  );
}

/**
 * „Was hat sich seit der letzten Meldung geändert?" — Kern der Schichtübergabe.
 * Zeigt ausschließlich Bewegung; unveränderte Felder bleiben weg (dafür gibt es
 * die Vollansicht „Details").
 */
function Aenderungen({ vorher, nachher }: { vorher: Erfassungsbogen; nachher: Erfassungsbogen }) {
  const d = bogenDiff(vorher, nachher);
  if (d.anzahl === 0) {
    return (
      <p className="hinweis diff-block">
        Inhaltlich unverändert gegenüber der Meldung vom {standText(vorher)} (nur der Meldestand ist neuer).
      </p>
    );
  }
  return (
    <div className="diff-block">
      <p className="hinweis">Gegenüber der Meldung vom {standText(vorher)}:</p>
      <DiffWerte titel="Stärke" eintraege={d.staerke} />
      <DiffPosten titel="Personal neu gemeldet" art="zugang" zeilen={d.personalZugang} />
      <DiffPosten titel="Personal nicht mehr gemeldet" art="abgang" zeilen={d.personalAbgang} />
      <DiffWerte titel="Personal geändert" eintraege={d.personalGeaendert} />
      <DiffPosten titel="Fahrzeuge neu gemeldet" art="zugang" zeilen={d.fahrzeugeZugang} />
      <DiffPosten titel="Fahrzeuge abgemeldet" art="abgang" zeilen={d.fahrzeugeAbgang} />
      <DiffWerte titel="Fahrzeuge geändert" eintraege={d.fahrzeugeGeaendert} />
      <DiffWerte titel="Sofortbedarf" eintraege={d.bedarf} />
      <DiffWerte titel="Auftrag / Sonstiges" eintraege={d.sonstiges} />
    </div>
  );
}

/**
 * Was „Entfernen" oder „Fassung verwerfen" zuletzt aus der Sammlung nahm —
 * neueste Fassung zuerst. Die Ansicht legt es bei „Rückgängig" unverändert
 * zurück (Audit Runde 2, R2-D1).
 */
interface Entfernt {
  art: "einheit" | "fassung";
  eintraege: MeldeEintrag[];
}

/** Eine Revisionszeile in der Historie, mit Diff zur direkt älteren Fassung. */
function HistorieZeile({ eintrag, vorheriger, aktuell, onVerwerfen }: {
  eintrag: MeldeEintrag;
  vorheriger?: MeldeEintrag;
  aktuell: boolean;
  /** Nur diese Fassung verwerfen (R2-D1) — die Historie steht erst ab zwei Fassungen da. */
  onVerwerfen?: () => void;
}) {
  const [offen, setOffen] = useState(false);
  return (
    <li>
      Stand {standText(eintrag.bogen)} · Stärke {staerkeText(eintrag.bogen)} · {QUELLE_LABEL[eintrag.quelle]}
      {/* Wann die Fassung HIER eingegangen ist — der Stand ist die Uhr des
          Absenders (Audit Runde 2, R2-K6). */}
      {" · eingegangen "}{zeitKurz(eintrag.empfangenAm)}
      {aktuell ? " (aktuell)" : ""}
      {vorheriger && (
        <>
          {" "}
          <button type="button" className="link" onClick={() => setOffen(!offen)}>
            {offen ? "Änderungen ausblenden" : "Änderungen"}
          </button>
        </>
      )}
      {onVerwerfen && (
        <>
          {" "}
          <button type="button" className="link" onClick={onVerwerfen}>Fassung verwerfen…</button>
        </>
      )}
      {offen && vorheriger && <Aenderungen vorher={vorheriger.bogen} nachher={eintrag.bogen} />}
    </li>
  );
}

/**
 * Quittung mit Rückweg, fest am unteren Bildrand (Daumenbereich), mit
 * „Rückgängig" in voller Knopfgröße (Audit Runde 2, R2-H4). Sie bleibt, bis
 * die nächste Quittung sie ersetzt, sie geschlossen wird oder die Ansicht
 * wechselt — ein Zeitablauf nähme den einzigen Rückweg einer entfernten
 * Meldung, während der Helfer gerade woanders hinsieht.
 *
 * `prellschutz`: Die Knöpfe nehmen erst nach PRELLSCHUTZ_MS an — die Leiste
 * erscheint womöglich genau unter dem Finger eines Doppeltipps.
 */
function DaumenQuittung({ children, prellschutz = false, onRueckgaengig, onSchliessen }: {
  children: ReactNode;
  prellschutz?: boolean;
  onRueckgaengig: () => void;
  onSchliessen: () => void;
}) {
  const [bereit, setBereit] = useState(!prellschutz);
  useEffect(() => {
    if (bereit) return;
    const uhr = setTimeout(() => setBereit(true), PRELLSCHUTZ_MS);
    return () => clearTimeout(uhr);
  }, [bereit]);
  return (
    <div className="quittung-daumen" role="status">
      <span className="quittung-text">{children}</span>
      <button type="button" className="quittung-rueckgaengig" disabled={!bereit} onClick={onRueckgaengig}>
        Rückgängig
      </button>
      <button type="button" className="quittung-schliessen" disabled={!bereit} aria-label="Quittung schließen" onClick={onSchliessen}>
        ✕
      </button>
    </div>
  );
}

/**
 * So lange nimmt eine Karte nach „Abrücken"/„Wieder anwesend" keinen Tipp an.
 * Ein Doppeltipp mit Handschuh liegt bei 100–300 ms (Audit Runde 2, R2-G4);
 * wer bewusst zurücknehmen will, tippt nicht schneller als nach einer
 * halben Sekunde erneut.
 */
// Der Prüfstand (features/support/haken.ts) setzt ihn vor dem Laden auf 0 —
// Playwright tippt schneller nach, als es ein Finger je täte.
export const PRELLSCHUTZ_MS: number = (globalThis as { __EEB_PRELLSCHUTZ_MS?: number }).__EEB_PRELLSCHUTZ_MS ?? 600;

function EinheitKarte(props: {
  einsatzId: string;
  kopf: MeldeEintrag;
  alle: MeldeEintrag[];
  onGeaendert: () => void;
  /** Das Entfernte — die Ansicht bietet es danach zum Zurückholen an. */
  onEntfernt?: (entfernt: Entfernt) => void;
  /** Aktiver Qualifikationsfilter ("" = keiner) — nennt die passenden Personen in der Zeile. */
  qualifikation?: string;
  /** Kurzform der gefilterten Qualifikation für die Trefferzeile („AGT"). */
  qualifikationKurz?: string;
  /** Die gerade eingegangene Meldung — trifft sie diese Zeile, quittiert sie. */
  eingang?: Eingang | null;
  /** Statuswechsel von Hand — die Ansicht quittiert ihn mit Uhrzeit und Rückweg. */
  onStatusWechsel?: (w: StatusWechsel) => void;
}) {
  const { einsatzId, kopf, alle, onGeaendert, onEntfernt, qualifikation = "", qualifikationKurz = "", eingang, onStatusWechsel } = props;
  // Ohne Rollen: Die Ansicht bleibt nach der Aufnahme oben (R2-S3).
  const zeile = useEingangsquittung<HTMLLIElement>(marke(eingang, kopf.einheitSchluessel), { rollen: false });
  const nameId = useId();
  // Bis wann die Karte nach einem Statuswechsel keine Tipps annimmt (R2-G4).
  // Der Zeitstempel sperrt jeden Knopf der Karte; der Zustand graut den
  // Wechselknopf für diese Zeit aus, damit sichtbar ist, dass er gerade nicht
  // annimmt (und Testautomaten auf ihn warten, statt ins Leere zu tippen).
  const gesperrtBis = useRef(0);
  const [prellt, setPrellt] = useState(false);
  // Der Wechselknopf und seine Lage im Bild beim Tipp: Nach dem Abrücken
  // wächst die Zeitzeile („· abgerückt 11:07 ändern") meist um eine Zeile,
  // und die Knopfreihe rutschte 28 px unter dem Finger weg. Die Ansicht rollt
  // um genau diesen Betrag nach, damit der Rückweg dort liegt, wo eben
  // „Abrücken" lag (R2-G4).
  const wechselKnopf = useRef<HTMLButtonElement>(null);
  const ankerOben = useRef<number | null>(null);
  useLayoutEffect(() => {
    const alt = ankerOben.current;
    ankerOben.current = null;
    const neu = wechselKnopf.current?.getBoundingClientRect().top;
    if (alt == null || neu == null) return;
    const versatz = neu - alt;
    if (Math.abs(versatz) < 1) return;
    try {
      window.scrollBy(0, versatz);
    } catch {
      /* Testumgebung ohne Layout */
    }
  }, [kopf.status]);
  useEffect(() => {
    if (!prellt) return;
    const uhr = setTimeout(() => setPrellt(false), Math.max(0, gesperrtBis.current - Date.now()));
    return () => clearTimeout(uhr);
  }, [prellt]);
  // Die Namen gehören in die Zeile, nicht hinter einen Klick: die Frage lautet
  // „wen habe ich?", und die Antwort ist der Name, nicht die Zahl.
  const qualiPersonen = personenMitQualifikation(kopf, qualifikation);
  const [details, setDetails] = useState(false);
  const [historie, setHistorie] = useState(false);
  const vermerke = kopf.vermerke ?? [];
  const [aenderungen, setAenderungen] = useState(false);
  const [aufteilen, setAufteilen] = useState(false);
  const [zusammenfuehren, setZusammenfuehren] = useState(false);
  const [pdfLaeuft, setPdfLaeuft] = useState(false);
  // null = nicht in Bearbeitung; String = Entwurf des Zug-Etiketts.
  const [zugEntwurf, setZugEntwurf] = useState<string | null>(null);
  // Entwurf des Auftrags/der Notiz der Führungsstelle (K5), gleiche Regel.
  const [notizEntwurf, setNotizEntwurf] = useState<string | null>(null);
  // Eintreff- oder Abrückzeit in Korrektur (Nachtragen vom Papier).
  const [zeitEntwurf, setZeitEntwurf] = useState<{ feld: "eintreffen" | "abruecken"; wert: string } | null>(null);
  const [lueckenOffen, setLueckenOffen] = useState(false);
  // Was der Bogen offenlässt (keine Rufnummer, Stärke ohne Namen…) — dieselbe
  // Prüfliste, die die Einheit beim Ausfüllen sieht. Auf der Karte, damit die
  // Rückfrage kommt, solange die Einheit noch vor dem Meldekopf steht (K3).
  const luecken = pruefpunkte(kopf.bogen);
  const bedarf = bedarfMarken(kopf.bogen);
  const revs = revisionen(alle, kopf.einheitSchluessel);
  // Folgemeldung: die direkt ältere Fassung derselben Einheit ist der Bezug für
  // „was hat sich seit der letzten Meldung geändert?".
  const vorige = revs[1];
  const kurz = vorige ? diffKurzfassung(bogenDiff(vorige.bogen, kopf.bogen)) : "";
  const abgerueckt = kopf.status === MeldeStatus.ABGERUECKT;
  const aufgegangen = kopf.status === MeldeStatus.AUFGEGANGEN;
  // Nur anwesende Meldungen zählen — und nur an ihnen sind Aufteilen und
  // Zusammenführen sinnvoll.
  const zaehlt = kopf.status === MeldeStatus.ANWESEND;
  // Andere anwesende Teile derselben Einheit — die Gegenstücke zum Zusammenführen.
  const geschwister = neuesteJeEinheit(alle).filter(
    (e) =>
      e.einheitSchluessel !== kopf.einheitSchluessel &&
      stammSchluessel(e.einheitSchluessel) === stammSchluessel(kopf.einheitSchluessel) &&
      e.status === MeldeStatus.ANWESEND,
  );
  const zielVonAufgegangen = kopf.aufgegangenIn
    ? alle.find((e) => e.einheitSchluessel === kopf.aufgegangenIn!.einheitSchluessel)
    : undefined;
  // Herkunft eines abgeteilten Teils: Name der Einheit, aus der er stammt.
  const stammt = kopf.stammtVon
    ? alle.find((e) => e.einheitSchluessel === kopf.stammtVon!.einheitSchluessel)
    : undefined;

  /** Statuswechsel mit Zeitstempel; die Ansicht bekommt den alten Stand für den Rückweg. */
  async function statusSetzen(status: MeldeStatus) {
    const zeit = Date.now();
    gesperrtBis.current = zeit + PRELLSCHUTZ_MS;
    setPrellt(true);
    ankerOben.current = wechselKnopf.current?.getBoundingClientRect().top ?? null;
    const vorher = { ...kopf };
    const ok = await gesichert(
      status === MeldeStatus.ABGERUECKT ? "Abrücken" : "Wieder anwesend",
      () => statusMitZeitSetzen(einsatzId, kopf.id, status, zeit),
    );
    if (!ok) {
      ankerOben.current = null;
      return;
    }
    onStatusWechsel?.({ vorher, status, zeit });
    onGeaendert();
  }

  async function zugSpeichern() {
    const ok = await gesichert("Zug zuordnen", () =>
      zugSetzen(einsatzId, kopf.einheitSchluessel, kopf.id, zugEntwurf ?? ""),
    );
    setZugEntwurf(null);
    if (ok) onGeaendert();
  }

  /**
   * Beim Verlassen des Felds speichern — „1. Zug" getippt, kurz in die Liste
   * und zurück: das Feld war leer, die Zuordnung weg (Stress-Audit S5). Ein
   * leerer Entwurf ändert nichts; wer den Zug löschen will, drückt Speichern.
   * Der Wechsel auf Speichern/Abbrechen daneben ist kein Verlassen.
   */
  function inlineVerlassen(e: FocusEvent<HTMLInputElement>, entwurf: string | null, speichern: () => void, schliessen: () => void) {
    if (e.currentTarget.parentElement?.contains(e.relatedTarget as Node | null)) return;
    if (entwurf == null) return;
    if (entwurf.trim() === "") schliessen();
    else speichern();
  }

  async function notizSpeichern() {
    const ok = await gesichert("Auftrag/Notiz", () => notizSetzen(einsatzId, kopf.id, notizEntwurf ?? ""));
    setNotizEntwurf(null);
    if (ok) onGeaendert();
  }

  /** Korrigierte Zeit übernehmen; ein leeres oder ungültiges Feld ändert nichts. */
  async function zeitSpeichern() {
    if (!zeitEntwurf) return;
    const ms = ausDatetimeLocal(zeitEntwurf.wert);
    if (ms == null) {
      setZeitEntwurf(null);
      return;
    }
    const ok = await gesichert("Zeit ändern", () =>
      zeitEntwurf.feld === "eintreffen"
        ? eintreffzeitSetzen(einsatzId, kopf.id, ms)
        : abrueckzeitSetzen(einsatzId, kopf.id, ms),
    );
    setZeitEntwurf(null);
    if (ok) onGeaendert();
  }

  function aufteilenAusfuehren(wahl: AufteilungsWahl, opt: AufteilungOptionen) {
    meldungAufteilen(einsatzId, kopf.id, wahl, opt);
    setAufteilen(false);
    onGeaendert();
  }

  function zusammenfuehrenAusfuehren(teilIds: string[], opt: ZusammenfuehrungOptionen) {
    meldungenZusammenfuehren(einsatzId, kopf.id, teilIds, opt);
    setZusammenfuehren(false);
    onGeaendert();
  }

  /**
   * Einzelbogen dieser Meldung als PDF öffnen — der Blick auf genau eine
   * Einheit (und der Ausdruck fürs Klemmbrett), ohne die Sammel-PDF aller
   * Meldungen. Der Tab geht im Klick auf, noch vor dem Nachladen des
   * PDF-Satzes: erst danach geöffnet, fiele er dem Popup-Blocker zum Opfer.
   * In App und Desktop-Fenster gibt es keinen Tab — dort führt derselbe Knopf
   * zu Share-Sheet bzw. Download.
   */
  async function bogenPdf() {
    const tab = imWebBrowser() ? window.open("", "_blank") : null;
    // Bis das PDF steht, vergehen Sekunden: ein weißes Fenster ohne Erklärung
    // liest sich am Gerät wie ein Fehlklick.
    if (tab) tab.document.body.textContent = "Bogen wird erzeugt…";
    setPdfLaeuft(true);
    try {
      // Dynamisch: pdfmake samt Schriften bleibt aus dem Start-Bundle heraus.
      const { meldungPdfAnzeigen } = await import("./pdf");
      await meldungPdfAnzeigen(kopf, tab);
    } catch (e) {
      // Sonst bleibt der leere Tab als stiller Rest stehen.
      tab?.close();
      await zeigeHinweis({ titel: "Bogen als PDF", text: fehlerText(e) });
    } finally {
      setPdfLaeuft(false);
    }
  }

  /**
   * Einheit in eine andere Sammlung verschieben — die falsche Mappe erwischt
   * (Audit „Fehler und Wiederanlauf", E5). Vorher hieß der Rückweg
   * „Entfernen" und neu scannen, beim eigenen Bogen sogar PDF → Datei laden.
   * Alle Fassungen, Signatur, Zeiten und Notiz ziehen unverändert mit.
   */
  async function verschieben() {
    const andere = einsaetzeLaden().filter((s) => s.id !== einsatzId);
    if (andere.length === 0) {
      await zeigeHinweis({ titel: "In anderen Einsatz verschieben", text: "Es gibt keine andere Einsatz-Sammlung auf diesem Gerät." });
      return;
    }
    const ziel = await frageWahl({
      titel: "In anderen Einsatz verschieben",
      text: `„${einheitAnzeigename(kopf.bogen.einheit)}" samt Historie, Zeiten und Auftrag verschieben nach:`,
      wege: andere.map((s) => ({
        wert: s.id,
        label: s.name,
        hinweis: `${ART_LABEL[s.art]}${s.ort ? ` · ${s.ort}` : ""} · angelegt ${new Date(s.angelegt).toLocaleDateString("de-DE")}`,
      })),
    });
    if (!ziel) return;
    const name = andere.find((s) => s.id === ziel)?.name ?? "";
    if (await gesichert("Verschieben", () => einheitVerschieben(einsatzId, ziel, kopf.einheitSchluessel))) {
      onGeaendert();
      await zeigeHinweis({ titel: "Verschoben", text: `„${einheitAnzeigename(kopf.bogen.einheit)}" liegt jetzt in „${name}".` });
    }
  }

  async function entfernen() {
    const sicher = await frageJaNein({
      titel: "Meldung entfernen?",
      text: `„${einheitAnzeigename(kopf.bogen.einheit)}" (Stand ${standText(kopf.bogen)}) wird aus diesem Einsatz entfernt — samt Historie.`,
      ok: "Meldung entfernen",
      gefahr: true,
    });
    if (!sicher) return;
    // Erst geht die Zeile sichtbar ab, dann erst wird sie weggenommen: bei
    // dreißig gleich gebauten Zeilen ist sonst hinterher nicht zu sehen, ob
    // die richtige ging — und anders als eine Karte im Assistenten ist eine
    // entfernte Meldung nicht wiederherstellbar. Läuft keine Animation
    // (reduzierte Bewegung, verdeckter Tab), nimmt mitAbgang den direkten Weg.
    mitAbgang(zeile.current, () => {
      // ALLE Fassungen der Einheit, nicht nur der Kopf: sonst rückt die ältere
      // Fassung nach, die Einheit bleibt mit veralteter Stärke in der Lage und
      // die Summen steigen sogar (Audit Runde 2, R2-D1). Abgeteilte Teile haben
      // einen eigenen Schlüssel und bleiben.
      const weg = einheitEntfernen(einsatzId, kopf.einheitSchluessel);
      // Die Einträge reisen vollständig zurück an die Ansicht: Sie bietet sie
      // zum Zurückholen an, solange niemand weitergeklickt hat. Für Einsätze
      // gibt es einen Papierkorb, für die einzelne Meldung bisher nichts.
      if (weg.length > 0) onEntfernt?.({ art: "einheit", eintraege: revisionen(weg, kopf.einheitSchluessel) });
      onGeaendert();
    });
  }

  /**
   * Nur eine Fassung verwerfen — etwa eine falsch aufgenommene Folgemeldung.
   * Eigener Weg mit eigener Rückfrage, die sagt, welcher Stand danach gilt;
   * „Entfernen" nimmt dagegen die ganze Einheit (Audit Runde 2, R2-D1).
   */
  async function fassungVerwerfen(r: MeldeEintrag) {
    const gueltig = revs.find((x) => x.id !== r.id);
    if (!gueltig) return;
    const istKopf = r.id === kopf.id;
    const sicher = await frageJaNein({
      titel: "Fassung verwerfen?",
      text:
        `Fassung Stand ${standText(r.bogen)} (Stärke ${staerkeText(r.bogen)}) von „${einheitAnzeigename(kopf.bogen.einheit)}" wird verworfen. ` +
        (istKopf
          ? `Gültig ist dann wieder Stand ${standText(gueltig.bogen)} mit Stärke ${staerkeText(gueltig.bogen)} — samt deren Zeiten und Auftrag.`
          : `Die aktuelle Fassung (Stand ${standText(kopf.bogen)}, Stärke ${staerkeText(kopf.bogen)}) bleibt gültig.`),
      ok: "Fassung verwerfen",
      gefahr: true,
    });
    if (!sicher) return;
    if (
      !(await gesichert("Fassung verwerfen", () => {
        meldungEntfernen(einsatzId, r.id);
        entfernteMerken(einsatzId, [r.id]); // kommt beim Import nicht still zurück (R2-D4)
      }))
    )
      return;
    onEntfernt?.({ art: "fassung", eintraege: [r] });
    onGeaendert();
  }

  return (
    <li
      ref={zeile}
      data-einheit={kopf.einheitSchluessel}
      className={`einheit-zeile${zaehlt ? "" : " gestrichen"}`}
      // Prellschutz: Der zweite Tipp eines Doppeltipps auf „Abrücken" traf
      // die neu geordnete Karte (R2-G4). Abgefangen wird in der
      // Einfangphase, also bevor irgendein Knopf der Karte ihn sieht.
      onClickCapture={(e) => {
        // Nur Zeiger-Tipps; ein Klick aus der Tastatur trägt `detail === 0`.
        if (e.detail > 0 && Date.now() < gesperrtBis.current) {
          e.stopPropagation();
          e.preventDefault();
        }
      }}
    >
      <div className="kopfzeile">
        <div className="muster-text">
          {/* Der Name als Überschrift: Mit Vorleseprogramm springt man so von
              Einheit zu Einheit statt durch neun Knöpfe je Karte zu wischen;
              die Knöpfe verweisen über aria-describedby auf ihn, sonst stand
              in der Knopfliste 21× „Abrücken" ohne Einheit (Audit Runde 2,
              R2-M4). Der sichtbare Knopfname bleibt, wie er ist. */}
          <h3 className="muster-name" id={nameId}>
            {einheitAnzeigename(kopf.bogen.einheit)}
            {/* Übungsbögen bleiben auch neben echten Meldungen unübersehbar. */}
            {kopf.bogen.uebung ? <span className="uebung-badge">ÜBUNG</span> : null}
            <AnonymBadge bogen={kopf.bogen} />
            {/* Ohne diese Kennzeichnung stünde dieselbe Einheit nach einer
                Aufteilung zweimal gleichnamig untereinander. */}
            {kopf.teilEtikett ? <span className="teil-badge">{kopf.teilEtikett}</span> : null}
            {kopf.zugEtikett ? <span className="zug-badge"> {kopf.zugEtikett}</span> : null}
            {/* Was seit der Übernahme dazukam: jünger als 30 Minuten (K2). */}
            {zaehlt && istNeu(kopf) ? <span className="neu-badge" title="Vor weniger als 30 Minuten eingetroffen">neu</span> : null}
            {/* Der Zustand als Wort statt über Deckkraft: 55 % drückten Stärke
                und Abrückzeit unter 3:1 (Audit Runde 2, R2-L5). */}
            {!zaehlt ? <span className="status-badge">{abgerueckt ? "abgerückt" : "zusammengeführt"}</span> : null}
          </h3>
          <span className="muster-sub">
            {orgLabel(kopf.bogen.einheit.organisation)} · Stärke {staerkeText(kopf.bogen)}
            {aufgegangen ? " · zusammengeführt" : ""}
            {kopf.signatur ? <> · {signaturBadge(kopf)}</> : null}
          </span>
          {/* Die Zeiten der Führungsstelle zuerst, der Absender-Stand nur als
              Zusatz: „eingetroffen 09:40" ist die Zeile fürs Einsatztagebuch,
              „Stand 161923jul26" war die einzige Zeit und sagte nichts über
              das Eintreffen (K2). Beide Zeiten sind korrigierbar — beim
              Nachtragen vom Papier ist der Moment des Abtippens nicht der des
              Eintreffens (Analog-Audit A2). */}
          <span className="muster-sub zeiten-zeile">
            eingetroffen {zeitKurz(eintreffzeit(kopf))}{" "}
            <button
              aria-describedby={nameId}
              type="button"
              className="link zeit-aendern"
              onClick={() => setZeitEntwurf({ feld: "eintreffen", wert: zuDatetimeLocal(eintreffzeit(kopf)) })}
            >
              ändern
            </button>
            {abgerueckt && (
              <>
                {" · abgerückt"}
                {kopf.abgerueckAm != null ? ` ${zeitKurz(kopf.abgerueckAm)}` : ""}{" "}
                <button
                  aria-describedby={nameId}
                  type="button"
                  className="link zeit-aendern"
                  onClick={() => setZeitEntwurf({ feld: "abruecken", wert: zuDatetimeLocal(kopf.abgerueckAm ?? Date.now()) })}
                >
                  ändern
                </button>
              </>
            )}
            {" · Stand "}{standText(kopf.bogen)}
            {standIstAlt(kopf) && <AltBadge />}
            {" · "}{QUELLE_LABEL[kopf.quelle]}
          </span>
          {/* Sofortbedarf nur, wenn gesetzt — nichts alarmiert, was leer ist (K1). */}
          {bedarf.length > 0 && (
            <span className="muster-sub bedarf-zeile">
              {bedarf.map((m) => (
                // Dringendes kräftig, Kraftstoff als ruhige Routine-Marke
                // (Audit Runde 2, R2-K4).
                <span className={m.dringend ? "bedarf-marke dringend" : "bedarf-marke routine"} key={m.lang}>{m.lang}</span>
              ))}
            </span>
          )}
          {/* Nur Sollplätze, niemand gezählt: als solche kennzeichnen, nicht als
              gewöhnliche Lücke (Audit Runde 2, R2-E2). */}
          {nurSollstaerke(kopf.bogen) && (
            <span className="muster-sub">
              <span className="bedarf-marke">Sollstärke, nicht gemeldet</span>
            </span>
          )}
          {kopf.notiz && (
            <span className="muster-sub auftrag-notiz">
              Auftrag/Notiz: {kopf.notiz}
            </span>
          )}
          {luecken.length > 0 && (
            <span className="muster-sub">
              <button
                aria-describedby={nameId}
                type="button"
                className="link luecken-marke"
                aria-expanded={lueckenOffen}
                title={luecken.map((p) => p.text).join("\n")}
                onClick={() => setLueckenOffen(!lueckenOffen)}
              >
                {luecken.length} {luecken.length === 1 ? "Lücke" : "Lücken"}
              </button>
            </span>
          )}
          {qualiPersonen.length > 0 && (
            <span className="muster-sub quali-treffer">
              {qualiPersonen.length}× {qualifikationKurz}:{" "}
              {qualiPersonen
                .map((p) => [p.vorname, p.nachname].filter((t) => t.trim() !== "").join(" ").trim() || "(ohne Namen)")
                .join(", ")}
            </span>
          )}
          {/* Folgemeldung: die Veränderung gehört in die Zeile, nicht erst hinter
              einen Klick — sie ist die Information der Schichtübergabe. */}
          {kurz && vorige && (
            <span className="muster-sub diff-kurz">
              seit {standText(vorige.bogen)}: {kurz}
            </span>
          )}
          {kopf.aufgegangenIn && (
            <span className="muster-sub">
              aufgegangen in{" "}
              {zielVonAufgegangen ? einheitAnzeigename(zielVonAufgegangen.bogen.einheit) : "eine andere Meldung"}
              {zielVonAufgegangen?.teilEtikett ? ` (${zielVonAufgegangen.teilEtikett})` : ""}
              {" am "}
              {new Date(kopf.aufgegangenIn.zusammengefuehrtAm).toLocaleString("de-DE", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          {kopf.stammtVon && (
            <span className="muster-sub">
              abgeteilt aus {stammt ? einheitAnzeigename(stammt.bogen.einheit) : "einer Meldung"}
              {kopf.stammtVon.teilEtikett ? ` (${kopf.stammtVon.teilEtikett})` : ""}
              {" am "}
              {new Date(kopf.stammtVon.abgeteiltAm).toLocaleString("de-DE", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
      </div>
      <div className="vorlage-aktionen">
        <button type="button" aria-describedby={nameId} onClick={() => setDetails(!details)}>
          {details ? "Details schließen" : "Details"}
        </button>{" "}
        <button
          aria-describedby={nameId}
          type="button"
          onClick={bogenPdf}
          disabled={pdfLaeuft}
          title="Bogen dieser Einheit als PDF — im Browser in einem neuen Tab."
        >
          {pdfLaeuft ? "Bogen wird erzeugt…" : "Bogen als PDF"}
        </button>{" "}
        {vorige && (
          <>
            <button type="button" aria-describedby={nameId} onClick={() => setAenderungen(!aenderungen)}>
              {aenderungen ? "Änderungen schließen" : "Änderungen"}
            </button>{" "}
          </>
        )}
        {/* „Abrücken" und sein Gegenknopf „Wieder anwesend" teilen sich einen
            Platz. Stand der Gegenknopf abgesetzt vor „Entfernen" (D4), rückten
            alle Knöpfe nach dem Abrücken um: unter dem Finger lag dann „Zug
            ändern", und ein Doppeltipp öffnete den Zug-Editor mit Tastatur
            (Audit Runde 2, R2-G4). Jetzt liegt unter dem Finger der Rückweg;
            gegen das Zurückschalten durch denselben Doppeltipp hält der
            Prellschutz der Karte (siehe PRELLSCHUTZ_MS). */}
        {zaehlt ? (
          <>
            <button type="button" ref={wechselKnopf} aria-describedby={nameId} disabled={prellt} onClick={() => void statusSetzen(MeldeStatus.ABGERUECKT)}>
              Abrücken
            </button>{" "}
          </>
        ) : (
          <>
            <button type="button" ref={wechselKnopf} aria-describedby={nameId} disabled={prellt} onClick={() => void statusSetzen(MeldeStatus.ANWESEND)}>
              Wieder anwesend
            </button>{" "}
          </>
        )}
        <button type="button" aria-describedby={nameId} onClick={() => setZugEntwurf(kopf.zugEtikett ?? "")}>
          {kopf.zugEtikett ? "Zug ändern" : "Zug zuordnen"}
        </button>{" "}
        <button type="button" aria-describedby={nameId} onClick={() => setNotizEntwurf(kopf.notiz ?? "")}>
          {kopf.notiz ? "Auftrag ändern" : "Auftrag/Notiz"}
        </button>{" "}
        {zaehlt && (
          <>
            <button type="button" aria-describedby={nameId} onClick={() => setAufteilen(!aufteilen)}>
              {aufteilen ? "Aufteilen schließen" : "Aufteilen…"}
            </button>{" "}
          </>
        )}
        {/* Nur anbieten, wenn es überhaupt einen anderen Teil zum Eingliedern gibt. */}
        {zaehlt && geschwister.length > 0 && (
          <>
            <button type="button" aria-describedby={nameId} onClick={() => setZusammenfuehren(!zusammenfuehren)}>
              {zusammenfuehren ? "Zusammenführen schließen" : "Zusammenführen…"}
            </button>{" "}
          </>
        )}
        {(revs.length > 1 || vermerke.length > 0) && (
          <button type="button" aria-describedby={nameId} onClick={() => setHistorie(!historie)}>
            {historie ? "Historie schließen" : revs.length > 1 ? `Historie (${revs.length})` : "Historie"}
          </button>
        )}{" "}
        <button type="button" aria-describedby={nameId} onClick={() => void verschieben()}>Verschieben…</button>{" "}
        <button type="button" aria-describedby={nameId} className="entfernen" onClick={entfernen}>Entfernen</button>
      </div>
      {lueckenOffen && luecken.length > 0 && (
        <ul className="luecken-liste">
          {luecken.map((p) => (
            <li key={p.text}>{p.text}</li>
          ))}
        </ul>
      )}
      {aenderungen && vorige && <Aenderungen vorher={vorige.bogen} nachher={kopf.bogen} />}
      {details && <BogenDetails bogen={kopf.bogen} />}
      {zusammenfuehren && geschwister.length > 0 && (
        <ZusammenfuehrenPanel
          ziel={kopf}
          teile={geschwister}
          onAbbrechen={() => setZusammenfuehren(false)}
          onZusammenfuehren={zusammenfuehrenAusfuehren}
        />
      )}
      {aufteilen && (
        <AufteilenPanel
          eintrag={kopf}
          onAbbrechen={() => setAufteilen(false)}
          onAufteilen={aufteilenAusfuehren}
        />
      )}
      {zugEntwurf !== null && (
        <div className="zug-bearbeiten">
          <input
            type="text"
            value={zugEntwurf}
            placeholder="z. B. 2. Zug"
            aria-label="Zug"
            autoFocus
            onChange={(e) => setZugEntwurf(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void zugSpeichern();
              if (e.key === "Escape") setZugEntwurf(null);
            }}
            onBlur={(e) => inlineVerlassen(e, zugEntwurf, () => void zugSpeichern(), () => setZugEntwurf(null))}
          />{" "}
          <button type="button" aria-describedby={nameId} className="primaer" onClick={() => void zugSpeichern()}>Speichern</button>{" "}
          <button type="button" aria-describedby={nameId} onClick={() => setZugEntwurf(null)}>Abbrechen</button>
        </div>
      )}
      {notizEntwurf !== null && (
        <div className="zug-bearbeiten notiz-bearbeiten">
          <input
            type="text"
            value={notizEntwurf}
            placeholder="z. B. Deichabschnitt Nord ab 14:00"
            aria-label="Auftrag/Notiz"
            autoFocus
            onChange={(e) => setNotizEntwurf(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void notizSpeichern();
              if (e.key === "Escape") setNotizEntwurf(null);
            }}
            onBlur={(e) => inlineVerlassen(e, notizEntwurf, () => void notizSpeichern(), () => setNotizEntwurf(null))}
          />{" "}
          <button type="button" aria-describedby={nameId} className="primaer" onClick={() => void notizSpeichern()}>Speichern</button>{" "}
          <button type="button" aria-describedby={nameId} onClick={() => setNotizEntwurf(null)}>Abbrechen</button>
        </div>
      )}
      {zeitEntwurf !== null && (
        <div className="zug-bearbeiten zeit-bearbeiten">
          <label className="feld">
            {zeitEntwurf.feld === "eintreffen" ? "Eingetroffen am" : "Abgerückt am"}
            <input
              type="datetime-local"
              value={zeitEntwurf.wert}
              autoFocus
              onChange={(e) => setZeitEntwurf({ ...zeitEntwurf, wert: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") void zeitSpeichern();
                if (e.key === "Escape") setZeitEntwurf(null);
              }}
            />
          </label>{" "}
          <button type="button" aria-describedby={nameId} className="primaer" onClick={() => void zeitSpeichern()}>Speichern</button>{" "}
          <button type="button" aria-describedby={nameId} onClick={() => setZeitEntwurf(null)}>Abbrechen</button>
        </div>
      )}
      {historie && revs.length > 1 && (
        <ul className="historie">
          {revs.map((r, i) => (
            <HistorieZeile
              key={r.id}
              eintrag={r}
              vorheriger={revs[i + 1]}
              aktuell={i === 0}
              onVerwerfen={() => void fassungVerwerfen(r)}
            />
          ))}
        </ul>
      )}
      {/* Verlauf der Führungsstelle: Zug, Auftrag, Zeitkorrektur, Abrücken
          mit Uhrzeit — für Einsatztagebuch und Übergabe (Audit Runde 2, R2-K6). */}
      {historie && vermerke.length > 0 && (
        <>
          <p className="hinweis"><strong>Vermerke der Führungsstelle</strong></p>
          <ul className="historie fuehrungs-vermerke">
            {vermerke.map((v, i) => (
              <li key={i}>{zeitKurz(v.zeit)} {v.text}</li>
            ))}
          </ul>
        </>
      )}
    </li>
  );
}
