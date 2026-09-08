/**
 * Oberfläche für „Einsatz-Sammlung" (Meldekopf/Zugführer):
 *  - EinsatzListe: Kartenliste der Einsätze auf dem Startbildschirm.
 *  - EinsatzDetail: Summen über die anwesenden Einheiten, Einheitenliste mit
 *    Status (anwesend/abgerückt) und aufklappbarer Revisions-Historie, Bögen
 *    hinzufügen (Scan / manuell), Einsatz löschen.
 *
 * Reine Anzeige + Aufruf der Store-/Auswertungslogik (einsaetze.ts, auswertung.ts).
 */

import { useEffect, useRef, useState } from "react";
import {
  PersonalErfassung,
  datumZuIso,
  staerke,
  unterbringungMWD,
  verpflegung,
  zeitpunktZuIso,
  type Erfassungsbogen,
} from "@bos/eeb-format/model";
import {
  datumDeutsch,
  zeitgruppe,
  einheitAnzeigename,
  einheitOrt,
  funkrufText,
  funktionsText,
  kennzeichenText,
  kontaktText,
  orgLabel,
  vokabText,
  vokabularFuer,
} from "./hilfen";
import { bogenDiff, diffKurzfassung, type WertAenderung } from "@bos/meldekopf/meldung-diff";
import {
  EinsatzArt,
  MeldeStatus,
  einsatzEndgueltigLoeschen,
  einsatzLoeschen,
  einsatzWiederherstellen,
  einsaetzePapierkorb,
  einheitZugEtikettSetzen,
  meldungAufteilen,
  meldungenZusammenfuehren,
  meldungEntfernen,
  meldungStatusSetzen,
  neuesteJeEinheit,
  revisionen,
  tageBisAufraeumen,
  stammSchluessel,
  type AufteilungOptionen,
  type Einsatzsammlung,
  type MeldeEintrag,
  type ZusammenfuehrungOptionen,
} from "@bos/meldekopf/einsaetze";
import { AufteilenPanel } from "./aufteilen-ui";
import { ZusammenfuehrenPanel } from "./zusammenfuehren-ui";
import type { AufteilungsWahl } from "@bos/meldekopf/aufteilen";
import { aggregiere, aggregiereNachZug, type EinsatzSummen } from "./auswertung";
import {
  SORTIERUNGEN,
  einheitenAnsicht,
  personenMitQualifikation,
  qualifikationenImEinsatz,
  type EinheitenSortierung,
} from "./einheiten-liste";
import { debugAktiv } from "./debug-plattform";
import { Auswahl } from "./schritte/bausteine";
import { SeitenKopf } from "./seiten-kopf";
import { frageJaNein, zeigeHinweis } from "./dialoge";
import { TabellenScroll } from "./tabellen-scroll";
import {
  TABELLEN_SPALTEN,
  gemerkteAnsicht,
  merkeAnsicht,
  tabellenSumme,
  tabellenZeilen,
  zeilenSortieren,
  type EinheitenAnsicht,
  type Sortierrichtung,
  type TabellenSpalte,
  type TabellenZeile,
} from "./einheiten-tabelle";
import { imWebBrowser } from "./nativ";
import { istBilddatei } from "./qr-stapel";
import { fehlerText } from "./nachladen";

export const ART_LABEL: Record<EinsatzArt, string> = {
  [EinsatzArt.EINSATZ]: "Einsatz",
  [EinsatzArt.UEBUNG]: "Übung",
  [EinsatzArt.VERANSTALTUNG]: "Veranstaltung",
};

const QUELLE_LABEL: Record<MeldeEintrag["quelle"], string> = {
  scan: "Scan",
  manuell: "Manuell",
  "pdf-import": "PDF-Import",
  aufteilung: "Aufteilung",
  zusammenfuehrung: "Zusammenführung",
};

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

function staerkeText(b: Erfassungsbogen): string {
  const s = staerke(b);
  return `${s.fuehrer} / ${s.unterfuehrer} / ${s.mannschaft} / ${s.gesamt}`;
}

function summenStaerkeText(sum: EinsatzSummen): string {
  const s = sum.staerke;
  return `${s.fuehrer} / ${s.unterfuehrer} / ${s.mannschaft} / ${s.gesamt}`;
}

function standText(b: Erfassungsbogen): string {
  return zeitgruppe(b.stand);
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

  // Kein confirm: Löschen ist nur der Weg in den Papierkorb (30 Tage
  // wiederherstellbar) — ein Fehltipp lässt sich rückgängig machen.
  function loeschen(s: Einsatzsammlung) {
    einsatzLoeschen(s.id);
    onGeaendert();
  }

  async function endgueltigLoeschen(s: Einsatzsammlung) {
    const sicher = await frageJaNein({
      titel: "Einsatz endgültig löschen?",
      text: `„${s.name}" mit ${s.eintraege.length} Meldung(en) wird aus dem Papierkorb entfernt. Darin stecken fremde Personendaten; rückgängig geht das nicht.`,
      ok: "Endgültig löschen",
      gefahr: true,
    });
    if (sicher) {
      einsatzEndgueltigLoeschen(s.id);
      onGeaendert();
    }
  }

  return (
    <>
      {einsaetze.map((s) => {
        const sum = aggregiere(s.eintraege);
        const restTage = tageBisAufraeumen(s);
        return (
          <section className="karte" key={s.id}>
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
            {/* Ankündigung der automatischen Löschung (siehe AUFRAEUM_FRIST_MS).
                Sie steht über den Aktionen, damit der Ausweg — exportieren oder
                durch eine Änderung die Uhr zurücksetzen — direkt daneben liegt. */}
            {restTage != null && (
              <p className="warnung">
                {restTage > 0
                  ? `Wird in ${restTage} Tag(en) automatisch gelöscht.`
                  : "Wird beim nächsten Start automatisch gelöscht."}{" "}
                Die Sammlung liegt seit 60 Tagen unverändert und enthält Personendaten
                gemeldeter Kräfte. Wenn du sie noch brauchst, exportiere sie jetzt — jede
                Änderung an der Sammlung setzt die Frist zurück.
              </p>
            )}
            <div className="vorlage-aktionen">
              <button type="button" className="entfernen" onClick={() => loeschen(s)}>Löschen</button>
            </div>
          </section>
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
          <section className="karte papierkorb" key={s.id}>
            <div className="kopfzeile">
              <h2>{s.name}</h2>
              <span>
                <button type="button" onClick={() => { einsatzWiederherstellen(s.id); onGeaendert(); }}>
                  Wiederherstellen
                </button>{" "}
                <button type="button" className="entfernen" onClick={() => endgueltigLoeschen(s)}>
                  Endgültig löschen
                </button>
              </span>
            </div>
            <p className="hinweis">
              {s.eintraege.length} Meldung(en) · gelöscht am {new Date(s.geloeschtAm!).toLocaleDateString("de-DE")} —
              wird nach 30 Tagen automatisch endgültig entfernt.
            </p>
          </section>
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
  onCsvExport: () => void;
  onCsvDetailExport: () => void;
  onOldenburgExport: () => void;
  onSammelPdf: () => void;
  onGeloescht: () => void;
}) {
  const { einsatz, onZurueck, onGeaendert, onScannen, onManuell, onDateiImport, onBilderImport, onExport, onCsvExport, onCsvDetailExport, onOldenburgExport, onSammelPdf, onGeloescht } = props;
  const [suche, setSuche] = useState("");
  const [sortierung, setSortierung] = useState<EinheitenSortierung>("name");
  // "" = keine Einschränkung. Schlüssel siehe einheiten-liste.ts.
  const [quali, setQuali] = useState("");
  // Karten oder Tabelle — geräteweit gemerkt (einheiten-tabelle.ts).
  const [ansicht, setAnsicht] = useState<EinheitenAnsicht>(gemerkteAnsicht);
  const sum = aggregiere(einsatz.eintraege);
  const zugGruppen = aggregiereNachZug(einsatz.eintraege);
  // Alle gemeldeten Einheiten (neueste Revision je Einheit) — Grundlage für die
  // Gesamtzahl; `kopf` ist davon nur der gerade angezeigte Ausschnitt. Suche,
  // Filter und Sortierung ändern die Summen oben bewusst nicht.
  const alleEinheiten = neuesteJeEinheit(einsatz.eintraege);
  const qualiListe = qualifikationenImEinsatz(alleEinheiten);
  const gewaehlteQuali = qualiListe.find((q) => q.schluessel === quali);
  const kopf = einheitenAnsicht(alleEinheiten, suche, sortierung, quali);
  const gefiltert = kopf.length !== alleEinheiten.length;
  // Meldeköpfe melden oft nur die Stärke — dort steht keine Person und damit
  // keine Qualifikation. Ohne diesen Hinweis sähe der Filter wie ein Fehler aus.
  const ohnePersonen = alleEinheiten.filter(
    (e) => e.bogen.personalErfassung === PersonalErfassung.NUR_STAERKE || e.bogen.personal.length === 0,
  ).length;
  // Kurzform für die Trefferzeile an der Karte: „AGT" statt der ganzen
  // Beschriftung — die steht schon im Hinweis über der Liste.
  const qualiKurz = gewaehlteQuali?.label.split(" – ")[0] ?? "";

  // Verschiebt nur in den Papierkorb (30 Tage wiederherstellbar über die
  // Einsatzliste) — daher kein confirm.
  function loeschen() {
    einsatzLoeschen(einsatz.id);
    onGeloescht();
  }

  return (
    <>
    <SeitenKopf>
      <button type="button" className="zur-start" onClick={onZurueck}>‹ Einsätze</button>
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
            {sum.unterbringungBenoetigt > 0 ? ` · ${sum.unterbringungBenoetigt}× angefordert` : ""}
          </dd>
          <dt>Kraftstoff</dt>
          <dd>
            Diesel {sum.kraftstoff.dieselLiter} l · Benzin {sum.kraftstoff.benzinLiter} l
            {sum.kraftstoff.gemischLiter > 0 ? ` · Gemisch ${sum.kraftstoff.gemischLiter} l` : ""}
          </dd>
          <dt>Fahrzeuge</dt>
          <dd>
            {sum.fahrzeuge}
            {sum.ruhezeitErforderlich > 0 ? ` · Ruhezeit: ${sum.ruhezeitErforderlich}×` : ""}
          </dd>
        </dl>
      </section>

      {zugGruppen.length > 1 && (
        <section className="karte">
          <h2>Zwischensummen nach Zug</h2>
          {zugGruppen.map((g) => (
            <div className="zug-summe" key={g.zugEtikett ? `zug:${g.zugEtikett}` : "zug:ohne"}>
              <p>
                <strong>{g.zugEtikett ?? "Ohne Zug"}</strong>
                {" · "}{g.summen.einheiten} Einheit(en){" · "}Stärke {summenStaerkeText(g.summen)}
              </p>
              <p className="hinweis">
                Verpflegung {g.summen.verpflegung.gesamt}
                {" · "}Unterbringung M {g.summen.unterbringung.m} / W {g.summen.unterbringung.w} / D {g.summen.unterbringung.d}
                {" · "}Fahrzeuge {g.summen.fahrzeuge}
              </p>
            </div>
          ))}
        </section>
      )}

      <div className="aktionen">
        <button type="button" className="primaer" onClick={onScannen}>Bogen scannen…</button>
        <button type="button" onClick={onManuell}>Einheit manuell erfassen…</button>
        {/* Datei, PDF, einzelne Bilder, viele Bilder, ganzer Ordner: ein Knopf,
            der die Sorte am Dateityp erkennt (siehe BoegenEinlesenKnopf). */}
        <BoegenEinlesenKnopf onDaten={onDateiImport} onBilder={onBilderImport} />
      </div>

      {/* Zweite Reihe: was aus der Sammlung herausgeht. Die erste nimmt Bögen
          auf. Der Sprung zwischen den Reihen muss größer sein als der zwischen
          den Knöpfen, sonst liest sich die Aufteilung als zufälliger Umbruch
          einer einzigen Reihe aus sieben gleichrangigen Knöpfen. */}
      <div className="vorlage-aktionen einsatz-ausgaben">
        <button
          type="button"
          onClick={onSammelPdf}
          title="Alle Bögen als eine PDF — mit eingebetteter kompletter Sammlung (Züge, Status, Historie). Auf dem Zielgerät über „Einsatz importieren…“ einlesbar."
        >
          Sammel-PDF (alle Bögen)
        </button>{" "}
        {/* Zwei CSV-Wege, weil zwei verschiedene Fragen dahinterstehen: die
            Übersicht beantwortet „wie stark ist die Lage?" (eine Zeile je
            Einheit, mit Summenzeile), der Detail-Export „wer und was genau ist
            da?" (jede Person, jedes Fahrzeug einzeln). */}
        <button type="button" onClick={onCsvExport} title="Eine Zeile je anwesender Einheit mit Stärke, Verpflegung, Unterbringung und Kraftstoff — plus Summenzeile. Für die Lagekarte.">
          Übersicht als CSV
        </button>{" "}
        <button type="button" onClick={onCsvDetailExport} title="Alle Daten aller gemeldeten Einheiten: je Einheit eine Zeile, dazu eine Zeile pro Person und pro Fahrzeug. Für Auswertung in Excel.">
          Alle Daten als CSV
        </button>{" "}
        {/* Drittes Format, weil es keinem der beiden CSVs entspricht: eine
            fremde Excel-Vorlage mit fester Spaltenfolge, in die die
            Führungsstelle die Zeilen direkt einfügt. */}
        <button type="button" onClick={onOldenburgExport} title="Einheitenliste im Format der Führungsstelle Oldenburg: je gemeldeter Einheit eine Zeile, Spalten und Formatierung wie in deren Excel-Vorlage.">
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
          <h2>Einheiten ({gefiltert ? `${kopf.length} von ${alleEinheiten.length}` : alleEinheiten.length})</h2>
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
                  {qualiListe.map((q) => (
                    <option key={q.schluessel} value={q.schluessel}>
                      {q.label} ({q.personen})
                    </option>
                  ))}
                </Auswahl>
              </label>
            )}
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
        {alleEinheiten.length === 0 && <p className="hinweis">Noch keine Meldung. Bogen scannen oder manuell erfassen.</p>}
        {alleEinheiten.length > 0 && kopf.length === 0 && (
          <p className="hinweis">
            Keine Einheit passt zu{" "}
            {[suche.trim() && `„${suche.trim()}“`, gewaehlteQuali && `„${gewaehlteQuali.label}“`]
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
          </p>
        )}
        {ansicht === "tabelle" && kopf.length > 0 && <EinheitenTabelle meldungen={kopf} />}
        {ansicht === "karten" &&
          kopf.map((e) => (
            <EinheitKarte
              key={e.einheitSchluessel}
              einsatzId={einsatz.id}
              kopf={e}
              alle={einsatz.eintraege}
              onGeaendert={onGeaendert}
              qualifikation={quali}
              qualifikationKurz={qualiKurz}
            />
          ))}
      </section>

      <footer className="nav">
        <button type="button" className="entfernen" onClick={loeschen}>Einsatz löschen</button>
      </footer>
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
function EinheitenTabelle({ meldungen }: { meldungen: MeldeEintrag[] }) {
  // null = Reihenfolge der Liste (Sortierauswahl der Leiste) unverändert
  // übernehmen. Erst ein Klick auf einen Spaltenkopf ordnet hier um.
  const [spalte, setSpalte] = useState<TabellenSpalte | null>(null);
  const [richtung, setRichtung] = useState<Sortierrichtung>("auf");
  const zeilen = tabellenZeilen(meldungen);
  const sortiert = spalte ? zeilenSortieren(zeilen, spalte, richtung) : zeilen;
  const summe = tabellenSumme(zeilen);
  const anwesende = zeilen.filter((z) => z.anwesend).length;

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
    einheit: `Summe (${anwesende} anwesend)`,
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
    stand: "",
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
              <TabellenZeileZelle key={z.eintrag.einheitSchluessel} zeile={z} />
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

/** Eine Datenzeile — abgerückte Meldungen bleiben sichtbar, aber durchgestrichen. */
function TabellenZeileZelle({ zeile: z }: { zeile: TabellenZeile }) {
  return (
    <tr className={z.anwesend ? undefined : "gestrichen"}>
      <th scope="row">
        {z.einheit}
        {z.eintrag.bogen.uebung ? <span className="uebung-badge">ÜBUNG</span> : null}
        {z.teilEtikett ? <span className="teil-badge">{z.teilEtikett}</span> : null}
        {!z.anwesend && (
          <span className="muster-sub">
            {z.eintrag.status === MeldeStatus.ABGERUECKT ? "abgerückt" : "zusammengeführt"}
          </span>
        )}
      </th>
      <td>{z.organisation}</td>
      <td>{z.zugEtikett}</td>
      <td className="zahl">{z.fuehrer}</td>
      <td className="zahl">{z.unterfuehrer}</td>
      <td className="zahl">{z.mannschaft}</td>
      <td className="zahl">{z.gesamt}</td>
      <td className="zahl">{z.verpflegung}</td>
      <td className="zahl">{z.vegetarisch}</td>
      <td className="zahl">{z.vegan}</td>
      <td className="zahl">{z.unterbringungM}</td>
      <td className="zahl">{z.unterbringungW}</td>
      <td className="zahl">{z.unterbringungD}</td>
      <td className="zahl">{z.diesel}</td>
      <td className="zahl">{z.benzin}</td>
      <td className="zahl">{z.gemisch}</td>
      {/* Zahl plus Typen: „3" beantwortet die Summenfrage, „GKW / MzKW" die
          nach dem, was tatsächlich dasteht. */}
      <td className="zahl" title={z.fahrzeugTypen}>{z.fahrzeuge}</td>
      <td>{z.stand}</td>
    </tr>
  );
}

/**
 * Zahl der Stärke-Leiste. Ändert eine neue Meldung den Wert, quittiert die
 * Zahl das mit dem Aufblitzen aus index.html (.zahl-geaendert) — bewusst über
 * das DOM statt über einen key: beim ersten Malen der Ansicht bleibt alles
 * still, und bei schnellen Folgemeldungen (Kiosk-Scan) setzt die Animation
 * dank Reflow auch dann neu an, wenn die Klasse schon gesetzt war.
 */
function Zaehlwert({ wert }: { wert: number }) {
  const element = useRef<HTMLElement>(null);
  const vorher = useRef(wert);
  useEffect(() => {
    if (vorher.current === wert || !element.current) return;
    vorher.current = wert;
    element.current.classList.remove("zahl-geaendert");
    void element.current.offsetWidth;
    element.current.classList.add("zahl-geaendert");
  }, [wert]);
  return <strong ref={element}>{wert}</strong>;
}

/**
 * Read-only Vollansicht eines gemeldeten Bogens (Zugehörigkeit, Einsatz,
 * Personal, Fahrzeuge, Sofortbedarf) — spiegelt die Erfassungs-Übersicht bzw.
 * das PDF, aber ohne Bearbeiten-Aktionen: fremde Bögen werden hier nur gelesen.
 */
function BogenDetails({ bogen }: { bogen: Erfassungsbogen }) {
  const org = bogen.einheit.organisation;
  const standort = einheitOrt(bogen.einheit);
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
          {bogen.einsatz.einsatzbeginn != null ? zeitpunktZuIso(bogen.einsatz.einsatzbeginn).replace("T", " ") : "—"}
          {" / "}
          {bogen.einsatz.einsatzende != null ? zeitpunktZuIso(bogen.einsatz.einsatzende).replace("T", " ") : "—"}
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
              <tr><th>Funktion / Zusatzfunktion</th><th>Name, Vorname</th><th>Erreichbarkeit</th></tr>
            </thead>
            <tbody>
              {bogen.personal.map((p, i) => (
                <tr key={i}>
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
                  <td>{funkrufText(f, standort) || "—"}</td>
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

/** Eine Revisionszeile in der Historie, mit Diff zur direkt älteren Fassung. */
function HistorieZeile({ eintrag, vorheriger, aktuell }: { eintrag: MeldeEintrag; vorheriger?: MeldeEintrag; aktuell: boolean }) {
  const [offen, setOffen] = useState(false);
  return (
    <li>
      Stand {standText(eintrag.bogen)} · Stärke {staerkeText(eintrag.bogen)} · {QUELLE_LABEL[eintrag.quelle]}
      {aktuell ? " (aktuell)" : ""}
      {vorheriger && (
        <>
          {" "}
          <button type="button" className="link" onClick={() => setOffen(!offen)}>
            {offen ? "Änderungen ausblenden" : "Änderungen"}
          </button>
        </>
      )}
      {offen && vorheriger && <Aenderungen vorher={vorheriger.bogen} nachher={eintrag.bogen} />}
    </li>
  );
}

function EinheitKarte(props: {
  einsatzId: string;
  kopf: MeldeEintrag;
  alle: MeldeEintrag[];
  onGeaendert: () => void;
  /** Aktiver Qualifikationsfilter ("" = keiner) — nennt die passenden Personen in der Zeile. */
  qualifikation?: string;
  /** Kurzform der gefilterten Qualifikation für die Trefferzeile („AGT"). */
  qualifikationKurz?: string;
}) {
  const { einsatzId, kopf, alle, onGeaendert, qualifikation = "", qualifikationKurz = "" } = props;
  // Die Namen gehören in die Zeile, nicht hinter einen Klick: die Frage lautet
  // „wen habe ich?", und die Antwort ist der Name, nicht die Zahl.
  const qualiPersonen = personenMitQualifikation(kopf, qualifikation);
  const [details, setDetails] = useState(false);
  const [historie, setHistorie] = useState(false);
  const [aenderungen, setAenderungen] = useState(false);
  const [aufteilen, setAufteilen] = useState(false);
  const [zusammenfuehren, setZusammenfuehren] = useState(false);
  const [pdfLaeuft, setPdfLaeuft] = useState(false);
  // null = nicht in Bearbeitung; String = Entwurf des Zug-Etiketts.
  const [zugEntwurf, setZugEntwurf] = useState<string | null>(null);
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

  function statusUmschalten() {
    // Aus „abgerückt" und „aufgegangen" führt derselbe Weg zurück: wieder
    // eigenständig anwesend.
    meldungStatusSetzen(einsatzId, kopf.id, zaehlt ? MeldeStatus.ABGERUECKT : MeldeStatus.ANWESEND);
    onGeaendert();
  }

  function zugSpeichern() {
    einheitZugEtikettSetzen(einsatzId, kopf.einheitSchluessel, zugEntwurf ?? "");
    setZugEntwurf(null);
    onGeaendert();
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

  async function entfernen() {
    const sicher = await frageJaNein({
      titel: "Meldung entfernen?",
      text: `„${einheitAnzeigename(kopf.bogen.einheit)}" (Stand ${standText(kopf.bogen)}) wird aus diesem Einsatz entfernt — samt Historie.`,
      ok: "Meldung entfernen",
      gefahr: true,
    });
    if (sicher) {
      meldungEntfernen(einsatzId, kopf.id);
      onGeaendert();
    }
  }

  return (
    <div className={`einheit-zeile${zaehlt ? "" : " gestrichen"}`}>
      <div className="kopfzeile">
        <span className="muster-text">
          <span className="muster-name">
            {einheitAnzeigename(kopf.bogen.einheit)}
            {/* Übungsbögen bleiben auch neben echten Meldungen unübersehbar. */}
            {kopf.bogen.uebung ? <span className="uebung-badge">ÜBUNG</span> : null}
            {/* Ohne diese Kennzeichnung stünde dieselbe Einheit nach einer
                Aufteilung zweimal gleichnamig untereinander. */}
            {kopf.teilEtikett ? <span className="teil-badge">{kopf.teilEtikett}</span> : null}
            {kopf.zugEtikett ? <span className="zug-badge"> {kopf.zugEtikett}</span> : null}
          </span>
          <span className="muster-sub">
            {orgLabel(kopf.bogen.einheit.organisation)} · Stärke {staerkeText(kopf.bogen)} · Stand {standText(kopf.bogen)} · {QUELLE_LABEL[kopf.quelle]}
            {abgerueckt ? " · abgerückt" : ""}
            {aufgegangen ? " · zusammengeführt" : ""}
            {kopf.signatur ? <> · {signaturBadge(kopf)}</> : null}
          </span>
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
        </span>
      </div>
      <div className="vorlage-aktionen">
        <button type="button" onClick={() => setDetails(!details)}>
          {details ? "Details schließen" : "Details"}
        </button>{" "}
        <button
          type="button"
          onClick={bogenPdf}
          disabled={pdfLaeuft}
          title="Bogen dieser Einheit als PDF — im Browser in einem neuen Tab."
        >
          {pdfLaeuft ? "Bogen wird erzeugt…" : "Bogen als PDF"}
        </button>{" "}
        {vorige && (
          <>
            <button type="button" onClick={() => setAenderungen(!aenderungen)}>
              {aenderungen ? "Änderungen schließen" : "Änderungen"}
            </button>{" "}
          </>
        )}
        <button type="button" onClick={statusUmschalten}>{zaehlt ? "Abrücken" : "Als anwesend"}</button>{" "}
        <button type="button" onClick={() => setZugEntwurf(kopf.zugEtikett ?? "")}>
          {kopf.zugEtikett ? "Zug ändern" : "Zug zuordnen"}
        </button>{" "}
        {zaehlt && (
          <>
            <button type="button" onClick={() => setAufteilen(!aufteilen)}>
              {aufteilen ? "Aufteilen schließen" : "Aufteilen…"}
            </button>{" "}
          </>
        )}
        {/* Nur anbieten, wenn es überhaupt einen anderen Teil zum Eingliedern gibt. */}
        {zaehlt && geschwister.length > 0 && (
          <>
            <button type="button" onClick={() => setZusammenfuehren(!zusammenfuehren)}>
              {zusammenfuehren ? "Zusammenführen schließen" : "Zusammenführen…"}
            </button>{" "}
          </>
        )}
        {revs.length > 1 && (
          <button type="button" onClick={() => setHistorie(!historie)}>
            {historie ? "Historie schließen" : `Historie (${revs.length})`}
          </button>
        )}{" "}
        <button type="button" className="entfernen" onClick={entfernen}>Entfernen</button>
      </div>
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
            autoFocus
            onChange={(e) => setZugEntwurf(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") zugSpeichern();
              if (e.key === "Escape") setZugEntwurf(null);
            }}
          />{" "}
          <button type="button" className="primaer" onClick={zugSpeichern}>Speichern</button>{" "}
          <button type="button" onClick={() => setZugEntwurf(null)}>Abbrechen</button>
        </div>
      )}
      {historie && revs.length > 1 && (
        <ul className="historie">
          {revs.map((r, i) => (
            <HistorieZeile key={r.id} eintrag={r} vorheriger={revs[i + 1]} aktuell={i === 0} />
          ))}
        </ul>
      )}
    </div>
  );
}
