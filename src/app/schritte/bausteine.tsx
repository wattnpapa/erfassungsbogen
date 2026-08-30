/**
 * Gemeinsame Bausteine der Assistenten-Schritte: Vokabular-Auswahl, Feld-Rahmen,
 * Zähler, Hinweise und die Vollständigkeits-Checkliste. Bewusst ohne Bezug zu
 * einem einzelnen Schritt — alles hier wird von mehreren Schritten genutzt.
 */

import { createContext, useContext, useEffect, useId, useState, type ComponentProps, type ReactNode } from "react";
import { Erfassungsbogen, VokabularWert } from "../../model";
import type { VokabularEintrag } from "../../vokabulare/thw";
import { vokabSortiert, type Pruefpunkt } from "../hilfen";

export type SchrittProps = {
  bogen: Erfassungsbogen;
  aendern: (patch: Partial<Erfassungsbogen>) => void;
  /** Sprung zu einem anderen Assistenten-Schritt — Hinweise, die dorthin zeigen, werden damit antippbar. */
  geheZu?: (schritt: number) => void;
};

/** Feldname des umschließenden <Feld> — Auswahllisten beschriften sich daraus. */
const FeldTitel = createContext<string | undefined>(undefined);

/**
 * Auswahlliste — überall statt eines nackten <select> zu verwenden.
 *
 * Grund: Beschriftet wird in dieser App über ein umschließendes
 * `<label className="feld">`, und bei einem <select> zählt der Text *aller*
 * <option>-Elemente zum Textinhalt des Labels. Vorlesesoftware und
 * Prüfwerkzeuge nennen dann die halbe Optionsliste als Feldnamen
 * („ArtEinsatzÜbungVeranstaltung" statt „Art"). Ein aria-label gewinnt
 * gegenüber dem Label und nennt nur den Feldnamen. Ohne <Feld> herum muss die
 * Beschriftung explizit mitgegeben werden.
 */
export function Auswahl({
  beschriftung,
  ...rest
}: ComponentProps<"select"> & { beschriftung?: string }) {
  const ausFeld = useContext(FeldTitel);
  return <select aria-label={beschriftung ?? ausFeld} {...rest} />;
}

export function VokabAuswahl(props: {
  wert: VokabularWert;
  aendern: (v: VokabularWert) => void;
  tabelle: VokabularEintrag[];
  platzhalter: string;
  /** Lange Listen (Einheitstyp, Fahrzeugtyp) als tippbare Combobox statt als
      Bildlauf-Select — Freitext bleibt möglich, eine Auswahl setzt den Code. */
  suchbar?: boolean;
}) {
  const { wert, aendern, tabelle, platzhalter, suchbar } = props;
  const titel = useContext(FeldTitel);
  if (suchbar && tabelle.length > 0) {
    return <VokabCombobox wert={wert} aendern={aendern} tabelle={tabelle} platzhalter={platzhalter} />;
  }
  if (tabelle.length === 0) {
    return (
      <input
        value={wert.freitext ?? ""}
        onChange={(e) => aendern({ freitext: e.target.value })}
        placeholder={platzhalter}
      />
    );
  }
  const istFrei = wert.code == null;
  return (
    <span style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
      <Auswahl
        value={istFrei ? "frei" : String(wert.code)}
        onChange={(e) => {
          const v = e.target.value;
          aendern(v === "frei" ? { freitext: "" } : { code: Number(v) });
        }}
      >
        <option value="frei">Freitext…</option>
        {vokabSortiert(tabelle).map((t) => (
          <option key={t.code} value={t.code}>
            {t.kurz} – {t.name}
          </option>
        ))}
      </Auswahl>
      {istFrei && (
        // Zweites Bedienelement im selben Label: ohne eigenen Namen erbte es
        // den des Labels (samt Optionstexten) und wäre von der Liste daneben
        // nicht zu unterscheiden.
        <input
          aria-label={titel && `${titel} (Freitext)`}
          value={wert.freitext ?? ""}
          onChange={(e) => aendern({ freitext: e.target.value })}
          placeholder={platzhalter}
        />
      )}
    </span>
  );
}

/**
 * Vokabular-Auswahl als tippbare Combobox (für lange Listen wie Einheitstyp
 * oder Fahrzeugtyp). Baut auf {@link VorschlagFeld} auf und bewahrt die
 * Freitext-Fähigkeit von {@link VokabAuswahl}: Tippen ist Freitext, das Wählen
 * eines Vorschlags setzt den Code (Grundlage der StAN-Vorbelegung).
 *
 * Der Anzeigetext lebt lokal (`eingabe`), wird aber bei externer Änderung des
 * Werts (Landesvorlage, Organisationswechsel) nachgezogen. Ein gewählter Code
 * erscheint als „Kürzel – Name", ein Freitext unverändert — damit „steht im
 * Feld … der Wert" exakt den freitextbasierten Vorlagenwert liest.
 */
function VokabCombobox(props: {
  wert: VokabularWert;
  aendern: (v: VokabularWert) => void;
  tabelle: VokabularEintrag[];
  platzhalter: string;
}) {
  const { wert, aendern, tabelle, platzhalter } = props;
  const sortiert = vokabSortiert(tabelle);
  const label = (t: VokabularEintrag) => `${t.kurz} – ${t.name}`;
  const ausCode = wert.code != null ? sortiert.find((t) => t.code === wert.code) : undefined;
  const anzeige = ausCode ? label(ausCode) : (wert.freitext ?? "");
  const [eingabe, setEingabe] = useState(anzeige);
  // Externe Werteänderung (Vorlage/Org-Wechsel) in die Anzeige übernehmen.
  useEffect(() => {
    setEingabe(anzeige);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wert.code, wert.freitext]);

  const suche = eingabe.trim().toLowerCase();
  const treffer = (
    suche
      ? sortiert.filter(
          (t) =>
            t.kurz.toLowerCase().includes(suche) ||
            t.name.toLowerCase().includes(suche) ||
            label(t).toLowerCase().includes(suche),
        )
      : sortiert
  ).slice(0, 8);

  return (
    <VorschlagFeld
      wert={eingabe}
      platzhalter={platzhalter}
      picker
      treffer={treffer}
      schluessel={(t) => String(t.code)}
      zeile={(t) => (
        <>
          {t.kurz}
          <small>{t.name}</small>
        </>
      )}
      tippen={(v) => {
        setEingabe(v);
        aendern({ freitext: v });
      }}
      waehlen={(t) => {
        setEingabe(label(t));
        aendern({ code: t.code });
      }}
      bestaetigen={(v) => {
        setEingabe(v);
        aendern({ freitext: v });
      }}
      verlassen={(v) => {
        // Direkt eingetipptes Kürzel/Label beim Verlassen zum Code auflösen.
        const t = sortiert.find(
          (x) => label(x) === v || x.kurz.toLowerCase() === v.trim().toLowerCase(),
        );
        if (t) {
          setEingabe(label(t));
          aendern({ code: t.code });
        }
      }}
    />
  );
}

/**
 * Eingabefeld mit eigener Vorschlagsliste — für Listen, die zu lang für ein
 * <select> sind (Ortsverbände, THW-Funktionen, Berufe), aber Freitext erlauben
 * müssen. Bewusst keine native <datalist>: Safari/iOS zeigt deren Vorschläge
 * praktisch nicht.
 *
 * Das Filtern bleibt beim Aufrufer (`treffer`), weil jede Liste nach eigenen
 * Feldern sucht und eigen sortiert; hier stecken nur Tastatur-, Maus- und
 * Fokusverhalten, die überall gleich sein sollen.
 *
 * Barrierefreiheit — das Muster „Combobox mit Listen-Autovervollständigung"
 * (ARIA 1.2). Ohne diese Rollen ist die Liste für Vorlesesoftware ein
 * beliebiges <ul> irgendwo im Dokument: sie kündigt weder an, dass Vorschläge
 * aufgeklappt sind, noch welcher gerade markiert ist.
 *  - Der Fokus bleibt immer im Eingabefeld; markiert wird über
 *    `aria-activedescendant`, nicht über echten Fokus (deshalb tragen die
 *    Zeilen auch kein tabindex).
 *  - `aria-controls` steht nur bei offener Liste, sonst zeigte die Referenz auf
 *    ein Element, das gar nicht im Dokument ist.
 *  - Die Trefferzahl kommt zusätzlich über eine Statuszeile: dass sich die
 *    Anzahl beim Tippen ändert, verrät sonst nichts.
 */
export function VorschlagFeld<T>(props: {
  wert: string;
  platzhalter?: string;
  beschriftung?: string;
  /** Vorschläge zur aktuellen Eingabe, schon gefiltert und sortiert. */
  treffer: T[];
  /** Stabiler React-Key je Vorschlag. */
  schluessel: (v: T) => string;
  /** Darstellung einer Zeile der Vorschlagsliste. */
  zeile: (v: T) => ReactNode;
  tippen: (wert: string) => void;
  waehlen: (v: T) => void;
  /** Enter/Klick ohne markierten Vorschlag — übernimmt die Eingabe als Freitext. */
  bestaetigen?: (wert: string) => void;
  /** Beim Verlassen des Felds, z. B. ein direkt eingetipptes Kürzel auflösen. */
  verlassen?: (wert: string) => void;
  /** true: Feld läuft in einer Zeile mit (Chips), statt eine eigene zu füllen. */
  imFluss?: boolean;
  /**
   * true: Auswahl-Combobox (Einheitstyp/Fahrzeugtyp) — trägt ein ▾ als
   * Picker-Hinweis. Öffnen auf Fokus/Tap gilt ohnehin für alle Felder; das
   * Chevron sagt nur denen, wo eine Auswahl das Ziel ist (nicht bei reinen
   * Suchfeldern wie dem OV-Namen), dass hier eine Liste wartet.
   */
  picker?: boolean;
}) {
  const { wert, platzhalter, beschriftung, treffer, schluessel, zeile, tippen, waehlen, bestaetigen, verlassen, imFluss, picker } = props;
  const ausFeld = useContext(FeldTitel);
  const [offen, setOffen] = useState(false);
  const [aktiv, setAktiv] = useState(0);
  // Mehrere Vorschlagsfelder stehen gleichzeitig auf einer Seite (Funktion und
  // Qualifikation je Person) — die IDs müssen sich unterscheiden.
  const id = useId();
  const listeId = `${id}-liste`;
  const zeilenId = (k: number) => `${id}-zeile-${k}`;

  const sichtbar = offen ? treffer : [];
  const aufgeklappt = sichtbar.length > 0;
  const nehmen = (v: T) => {
    waehlen(v);
    setOffen(false);
    setAktiv(0);
  };

  return (
    <span className={["autocomplete", imFluss ? "im-fluss" : "", picker ? "picker" : ""].filter(Boolean).join(" ")}>
      <input
        // Wie bei <Auswahl>: im umschließenden <label> zählt sonst der ganze
        // Textinhalt (hier die schon gesetzten Chips) als Feldname.
        aria-label={beschriftung ?? ausFeld}
        role="combobox"
        aria-expanded={aufgeklappt}
        aria-controls={aufgeklappt ? listeId : undefined}
        aria-activedescendant={aufgeklappt ? zeilenId(aktiv) : undefined}
        // "list": Vorschläge stehen in der Liste, der getippte Text wird nicht
        // im Feld vervollständigt.
        aria-autocomplete="list"
        // Sonst legt sich die Autovervollständigung des Browsers über unsere.
        autoComplete="off"
        value={wert}
        placeholder={platzhalter}
        onChange={(ev) => {
          tippen(ev.target.value);
          setOffen(true);
          setAktiv(0);
        }}
        // Antippen/Fokussieren zeigt die Liste, ohne dass erst getippt werden
        // muss — ein Native-Select öffnete auf Tap, das darf die Combobox nicht
        // verlieren (Meldekopf am Tablet, Handschuhe). Zeigt nur etwas, wenn der
        // Aufrufer für die aktuelle Eingabe Treffer liefert (leeres Suchfeld: keine).
        onFocus={() => setOffen(true)}
        onClick={() => setOffen(true)}
        onKeyDown={(ev) => {
          if (ev.key === "Escape") {
            setOffen(false);
            return;
          }
          if (ev.key === "Enter") {
            ev.preventDefault();
            const v = sichtbar[aktiv];
            if (v !== undefined) nehmen(v);
            else bestaetigen?.(wert);
            return;
          }
          if (ev.key !== "ArrowDown" && ev.key !== "ArrowUp") return;
          if (!offen) {
            // Nach Escape holt Pfeil-ab die Liste zurück, ohne neu zu tippen.
            if (ev.key === "ArrowDown" && treffer.length > 0) {
              ev.preventDefault();
              setOffen(true);
              setAktiv(0);
            }
            return;
          }
          if (sichtbar.length === 0) return;
          ev.preventDefault();
          setAktiv(
            ev.key === "ArrowDown"
              ? (aktiv + 1) % sichtbar.length
              : (aktiv + sichtbar.length - 1) % sichtbar.length,
          );
        }}
        onBlur={() => {
          setOffen(false);
          verlassen?.(wert);
        }}
      />
      {aufgeklappt && (
        <ul className="vorschlaege" id={listeId} role="listbox" aria-label={`Vorschläge zu ${beschriftung ?? ausFeld ?? "der Eingabe"}`}>
          {sichtbar.map((v, k) => (
            // onMouseDown statt onClick, damit die Auswahl vor dem blur greift
            <li
              key={schluessel(v)}
              id={zeilenId(k)}
              role="option"
              // Markiert = das, was Enter nehmen würde; ohne dieses Flag nennt
              // Vorlesesoftware die Zeile nur, ohne sie als gewählt auszuweisen.
              aria-selected={k === aktiv}
              className={k === aktiv ? "aktiv" : undefined}
              onMouseDown={(ev) => {
                ev.preventDefault();
                nehmen(v);
              }}
            >
              {zeile(v)}
            </li>
          ))}
        </ul>
      )}
      <span className="nur-vorlesen" role="status">
        {aufgeklappt ? `${sichtbar.length} ${sichtbar.length === 1 ? "Vorschlag" : "Vorschläge"}` : ""}
      </span>
    </span>
  );
}

/** Ein Vorschlag der VokabListe — aus der Code-Tabelle oder als Freitext-Tipphilfe. */
type Kandidat = { text: string; zusatz?: string; wert: VokabularWert };

/**
 * Eintrag einer Freitext-Tipphilfe. Der Kurzweg (String) reicht, wo der
 * Vorschlag für sich spricht (Berufsbezeichnungen); die Objektform trägt einen
 * `zusatz`, der NUR in der Liste erscheint und mitgesucht wird — im Bogen
 * landet immer allein `text` (z. B. DLRG-Ausbildungskennzahl + Bezeichnung,
 * daneben der Fachbereich als Zusatz).
 */
export type FreitextVorschlag = string | { text: string; zusatz?: string };

export function VokabListe(props: {
  werte: VokabularWert[];
  aendern: (w: VokabularWert[]) => void;
  tabelle: VokabularEintrag[];
  hinzufuegenText: string;
  /**
   * Tipphilfe für den Freitext-Weg (z. B. Berufsbezeichnungen). Ausgewähltes
   * landet als Freitext im Bogen — anders als `tabelle`, die Codes vergibt.
   */
  freitextVorschlaege?: readonly FreitextVorschlag[];
}) {
  const { werte, aendern, tabelle, hinzufuegenText, freitextVorschlaege } = props;
  const [eingabe, setEingabe] = useState("");

  const suche = eingabe.trim().toLowerCase();
  const treffer: Kandidat[] = [];
  if (suche) {
    // vokabSortiert: gleiche Reihenfolge wie in den Auswahllisten der App,
    // damit Gleichartiges beieinander steht („GrFü B", „GrFü BrB", „GrFü E").
    for (const t of vokabSortiert(tabelle)) {
      if (t.kurz.toLowerCase().includes(suche) || t.name.toLowerCase().includes(suche)) {
        treffer.push({ text: t.kurz, zusatz: t.name, wert: { code: t.code } });
      }
    }
    for (const v of freitextVorschlaege ?? []) {
      const { text, zusatz } = typeof v === "string" ? { text: v, zusatz: undefined } : v;
      // Der Zusatz zählt bei der Suche mit: „Tauchen" soll alle Tauchscheine
      // holen, obwohl das Wort in keiner der Bezeichnungen steht.
      if (text.toLowerCase().includes(suche) || (zusatz?.toLowerCase().includes(suche) ?? false))
        treffer.push({ text, zusatz, wert: { freitext: text } });
    }
    // Was mit der Eingabe beginnt, ist meist das Gemeinte — nach vorn. Zählt für
    // beide Schreibweisen: die eine tippt „GrFü B", die andere „Gruppenführer".
    const beginnt = (k: Kandidat) =>
      Number(k.text.toLowerCase().startsWith(suche) || (k.zusatz?.toLowerCase().startsWith(suche) ?? false));
    treffer.sort((a, b) => beginnt(b) - beginnt(a));
  }

  const hinzu = (w: VokabularWert) => {
    aendern([...werte, w]);
    setEingabe("");
  };
  const freitextHinzu = (text: string) => {
    const t = text.trim();
    if (t) hinzu({ freitext: t });
  };

  return (
    <span className="chips">
      {werte.map((w, i) => (
        <span key={i} className="chip">
          {w.code != null ? (tabelle.find((t) => t.code === w.code)?.kurz ?? `#${w.code}`) : w.freitext}
          <button
            type="button"
            aria-label={`${w.code != null ? (tabelle.find((t) => t.code === w.code)?.kurz ?? `#${w.code}`) : w.freitext} entfernen`}
            onClick={() => aendern(werte.filter((_, j) => j !== i))}
          >
            ×
          </button>
        </span>
      ))}
      <VorschlagFeld
        wert={eingabe}
        beschriftung={`${hinzufuegenText} hinzufügen`}
        platzhalter={`${hinzufuegenText}…`}
        imFluss
        treffer={treffer.slice(0, 8)}
        schluessel={(k) => (k.wert.code != null ? `c${k.wert.code}` : `f${k.text}`)}
        zeile={(k) => (
          <>
            {k.text}
            {k.zusatz && <small>{k.zusatz}</small>}
          </>
        )}
        tippen={setEingabe}
        waehlen={(k) => hinzu(k.wert)}
        bestaetigen={freitextHinzu}
      />
      {/* Sichtbarer Weg für eigene Eingaben, auch wenn die Liste Treffer zeigt:
          per Enter gewinnt dort der markierte Vorschlag. */}
      <button type="button" disabled={eingabe.trim() === ""} onClick={() => freitextHinzu(eingabe)}>
        + eigener Text
      </button>
    </span>
  );
}

export function Feld(props: { titel: string; schmal?: boolean; klasse?: string; children: ReactNode }) {
  return (
    <label className={["feld", props.schmal ? "schmal" : "", props.klasse ?? ""].filter(Boolean).join(" ")}>
      {props.titel}
      <FeldTitel.Provider value={props.titel}>{props.children}</FeldTitel.Provider>
    </label>
  );
}

export const zahl = (s: string): number => {
  const n = parseInt(s, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

// Die Stärke-Notation „x / x / x / x" ist BOS-Konvention, aber nicht jedem
// geläufig — Tooltip/aria erklären sie, ohne die Anzeige aufzublähen.
export const STAERKE_LEGENDE = "Führer / Unterführer / Mannschaft / Gesamt";
export const MWD_LEGENDE = "Unterbringungsplätze: männlich / weiblich / divers";

export function staerkeVorlesen(s: { fuehrer: number; unterfuehrer: number; mannschaft: number; gesamt: number }): string {
  return `${s.fuehrer} Führer, ${s.unterfuehrer} Unterführer, ${s.mannschaft} Mannschaft, ${s.gesamt} gesamt`;
}

/**
 * Großer, touch-freundlicher Zähler (− / Zahl / +) für die Erfassung ohne
 * Tastatur am Tablet. Werte bleiben ≥ min; direkte Zahleneingabe bleibt möglich.
 */
export function Stepper(props: { titel: string; wert: number; setzen: (n: number) => void; min?: number }) {
  const min = props.min ?? 0;
  const setze = (n: number) => props.setzen(Math.max(min, n));
  return (
    <div className="stepper-feld">
      <span className="stepper-titel">{props.titel}</span>
      <div className="stepper">
        <button
          type="button"
          aria-label={`${props.titel}: verringern`}
          disabled={props.wert <= min}
          onClick={() => setze(props.wert - 1)}
        >
          −
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={min}
          value={props.wert}
          aria-label={props.titel}
          onChange={(e) => setze(zahl(e.target.value))}
        />
        <button type="button" aria-label={`${props.titel}: erhöhen`} onClick={() => setze(props.wert + 1)}>
          +
        </button>
      </div>
    </div>
  );
}

/**
 * Plausibilitätshinweise (nicht blockierend). Ein Warnmuster wie in der
 * Übersicht: Punkte, die auf einen ANDEREN Schritt zeigen, sind antippbar und
 * springen dorthin — vorher waren sie hier Sackgassen, und man lernte erst in
 * der Übersicht, dass Warnungen klickbar sein können. `role="status"`, damit
 * Vorlesesoftware neu auftauchende Hinweise aktiv mitbekommt.
 */
export function Hinweise(props: {
  /** Nur-Text-Hinweise, die den aktuellen Schritt selbst betreffen. */
  hinweise?: string[];
  /** Hinweise mit Schrittbezug (pruefpunkte()). */
  punkte?: Pruefpunkt[];
  aktuellerSchritt?: number;
  geheZu?: (schritt: number) => void;
}) {
  const { hinweise = [], punkte = [], aktuellerSchritt, geheZu } = props;
  if (hinweise.length === 0 && punkte.length === 0) return null;
  return (
    <div role="status">
      {hinweise.map((h) => (
        <p key={h} className="warnung">⚠ {h}</p>
      ))}
      {punkte.map((p) =>
        geheZu && p.schritt !== aktuellerSchritt ? (
          <p key={p.text} className="warnung">
            ⚠ <button type="button" className="link" onClick={() => geheZu(p.schritt)}>{p.text}</button>
          </p>
        ) : (
          <p key={p.text} className="warnung">⚠ {p.text}</p>
        ),
      )}
    </div>
  );
}

/**
 * Vollständigkeits-Checkliste der Übersicht: bündelt alle offenen Punkte in
 * einer Box; jeder Punkt springt direkt zum Schritt, auf dem er sich beheben
 * lässt. Ist alles vollständig, gibt es eine kurze grüne Bestätigung.
 */
export function Vollstaendigkeit(props: { punkte: Pruefpunkt[]; geheZu: (schritt: number) => void }) {
  const { punkte, geheZu } = props;
  if (punkte.length === 0) {
    return (
      <p className="vollstaendig-ok" role="status">✓ Alle Angaben vollständig und plausibel.</p>
    );
  }
  return (
    <div className="vollstaendigkeit" role="status">
      <p className="vollstaendigkeit-titel">
        ⚠ {punkte.length === 1 ? "1 offener Punkt" : `${punkte.length} offene Punkte`} für die Weitergabe — antippen zum Beheben:
      </p>
      <ul>
        {punkte.map((p) => (
          <li key={p.text}>
            <button type="button" className="link" onClick={() => geheZu(p.schritt)}>
              {p.text}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Eingabefeld für Funkruf-Kennzahlen ("18/13").
 * Lokaler Text-Zustand, damit Trennzeichen beim Tippen erhalten bleiben —
 * geparst wird im Hintergrund (je Teil 0–255, wie im QR-Format).
 */
export function KennzahlenFeld(props: { teile: number[]; aendern: (t: number[]) => void }) {
  const [text, setText] = useState(props.teile.join("/"));
  return (
    <input
      value={text}
      placeholder="18/13"
      onChange={(e) => {
        setText(e.target.value);
        props.aendern(
          e.target.value
            .split(/[^0-9]+/)
            .filter(Boolean)
            .map((n) => Math.min(255, zahl(n))),
        );
      }}
    />
  );
}
