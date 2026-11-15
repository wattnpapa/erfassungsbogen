/**
 * Rahmen für den lokalen Personalstamm (personalstamm.ts) — der Teil, der im Startbündel steckt:
 *  - PersonalstammKarte: Abschnitt der Startseite mit Stand (Anzahl, Datei, Datum des Einlesens, Altershinweis),
 *    „Personal einlesen…" und „Personalstamm löschen".
 *  - StammAuswahlFenster: das Fenster „Wer ist dabei?" — vor einem neuen Bogen (Startseite) und als
 *    „Aus Personalstamm hinzufügen…" in Schritt 3.
 *
 * Die Inhalte (Dateileser, Spaltenzuordnung, Suche und Auswahl) laden beim ersten Öffnen nach
 * (personalstamm-ui.tsx); hier stehen nur Rahmen, Titel und Schließen, damit das Fenster sofort da ist.
 */
import { Suspense, lazy, useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { frageJaNein } from "./dialoge";
import { datumZweistellig } from "./papierkorb-frist";
import { stammAlterTage, stammAnzahlText, stammIstAlt, stammLoeschen, type Personalstamm } from "./personalstamm";

const ui = () => import("./personalstamm-ui");
const EinlesenInhalt = lazy(() => ui().then((m) => ({ default: m.EinlesenInhalt })));
const AuswahlInhalt = lazy(() => ui().then((m) => ({ default: m.AuswahlInhalt })));

/** Modales Fenster, das seinen Inhalt nur trägt, solange es offen ist — beim nächsten Öffnen beginnt er frisch. */
function Fenster({ offen, titel, klasse, onSchliessen, children }: {
  offen: boolean;
  titel: string;
  klasse: string;
  onSchliessen: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (offen && !d.open) d.showModal();
    else if (!offen && d.open) d.close();
  }, [offen]);
  return (
    // onClose feuert auch bei Escape und der Zurück-Geste, nicht nur beim Knopf.
    <dialog ref={ref} aria-label={titel} className={klasse} onClose={() => offen && onSchliessen()}>
      <div className="kopfzeile">
        <h2>{titel}</h2>
        <button type="button" onClick={onSchliessen}>Schließen</button>
      </div>
      {offen && (
        <Suspense fallback={<p className="hinweis" role="status">Wird geladen …</p>}>
          {children}
        </Suspense>
      )}
    </dialog>
  );
}

/** „Wer ist dabei?": Personen aus dem Personalstamm wählen. */
export function StammAuswahlFenster({ offen, titel, onSchliessen, ...inhalt }: {
  offen: boolean;
  titel: string;
  onSchliessen: () => void;
} & ComponentProps<typeof AuswahlInhalt>) {
  return (
    <Fenster offen={offen} titel={titel} klasse="stamm-dialog stamm-auswahl" onSchliessen={onSchliessen}>
      <AuswahlInhalt {...inhalt} />
    </Fenster>
  );
}

/** Abschnitt „Personalstamm" der Startseite. */
export function PersonalstammKarte({ stamm, onGeaendert }: {
  stamm: Personalstamm | null;
  /** Der Stamm wurde eingelesen, ersetzt oder gelöscht. */
  onGeaendert: (stamm: Personalstamm | null) => void;
}) {
  const [einlesen, setEinlesen] = useState(false);
  const [meldung, setMeldung] = useState("");

  async function loeschen() {
    if (!stamm) return;
    const ja = await frageJaNein({
      titel: "Personalstamm löschen?",
      text: `${stammAnzahlText(stamm.personen.length)} aus „${stamm.quelle || "der eingelesenen Datei"}“ werden von diesem Gerät entfernt. Schon erstellte Bögen und Vorlagen bleiben, wie sie sind. Zurück kommt der Stamm nur durch erneutes Einlesen der Datei.`,
      ok: "Personalstamm löschen",
      gefahr: true,
      fokus: "abbruch",
    });
    if (!ja) return;
    stammLoeschen();
    setMeldung("Personalstamm von diesem Gerät gelöscht.");
    onGeaendert(null);
  }

  return (
    <section className="start-vorlagen personalstamm">
      <h2>Personalstamm</h2>
      {stamm ? (
        <>
          <p>
            <strong>{stammAnzahlText(stamm.personen.length)}</strong>
            {stamm.quelle ? ` aus „${stamm.quelle}“` : ""}, eingelesen am {datumZweistellig(stamm.importiert)}.
          </p>
          {stammIstAlt(stamm) && (
            <p className="warnung" role="status">
              Der Personalstamm ist {stammAlterTage(stamm)} Tage alt. Stimmt die Liste noch? Sonst die aktuelle Datei neu einlesen.
            </p>
          )}
          <p className="hinweis">
            „Neuen Bogen erstellen“ fragt zuerst „Wer ist dabei?“; in Schritt 3 ergänzt „Aus Personalstamm hinzufügen…“
            weitere Personen. Die Liste bleibt auf diesem Gerät und ist nicht Teil der Datensicherung.
          </p>
        </>
      ) : (
        <p className="hinweis">
          Die Helferliste der Dienststelle einmal aus Excel oder CSV einlesen und bei jedem neuen Bogen antippen, wer
          dabei ist — über Gruppen und Fachgruppen hinweg, mit Suche und Filter. Die Liste bleibt auf diesem Gerät; in
          einen Bogen kommen nur die ausgewählten Personen.
        </p>
      )}
      {meldung && <p className="meldung" role="status">{meldung}</p>}
      <div className="vorlage-aktionen">
        <button type="button" onClick={() => { setMeldung(""); setEinlesen(true); }}>
          {stamm ? "Neu einlesen…" : "Personal einlesen…"}
        </button>{" "}
        {stamm && (
          <button type="button" className="entfernen" onClick={() => void loeschen()}>
            Personalstamm löschen…
          </button>
        )}
      </div>
      <Fenster offen={einlesen} titel={stamm ? "Personalstamm neu einlesen" : "Personal einlesen"} klasse="stamm-dialog" onSchliessen={() => setEinlesen(false)}>
        <EinlesenInhalt
          vorhanden={stamm}
          onFertig={(neu, text) => {
            setEinlesen(false);
            setMeldung(text);
            onGeaendert(neu);
          }}
        />
      </Fenster>
    </section>
  );
}
