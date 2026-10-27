/**
 * Gemeinsame Bausteine der Assistenten-Schritte: Vokabular-Auswahl, Feld-Rahmen,
 * Zähler, Hinweise und die Vollständigkeits-Checkliste. Bewusst ohne Bezug zu
 * einem einzelnen Schritt — alles hier wird von mehreren Schritten genutzt.
 */

import { createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type ComponentProps, type MouseEvent, type ReactNode } from "react";
import { Erfassungsbogen, VokabularWert } from "@bos/eeb-format/model";
import type { VokabularEintrag } from "@bos/vokabulare/thw";
import { vokabSortiert, type Pruefpunkt } from "../hilfen";
import { funktionVergeben } from "../haeufige-funktionen";
import { HOECHST_PERSONEN, mitGeltendemWert, zahlLesen, zahlMarkieren, type ZahlRegeln } from "../zahl-eingabe";
import { naechstesFeld } from "../tastatur";
import { beginntMit, falte, passtZurSuche, suchAlternativen, vokabRang } from "../schreibweise";

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
  /**
   * Bleibt der Text nach dem Verlassen des Felds Freitext, sagt das Feld es
   * (Einheitstyp, Audit Runde 4, R4-H1): „Bergungsgruppe" ausgeschrieben sah
   * wie eine Wahl aus, hatte aber keinen Typ-Code.
   */
  freitextHinweis?: boolean;
}) {
  const { wert, aendern, tabelle, platzhalter, suchbar, freitextHinweis } = props;
  const titel = useContext(FeldTitel);
  if (suchbar && tabelle.length > 0) {
    return (
      <VokabCombobox wert={wert} aendern={aendern} tabelle={tabelle} platzhalter={platzhalter} freitextHinweis={freitextHinweis} />
    );
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
  freitextHinweis?: boolean;
}) {
  const { wert, aendern, tabelle, platzhalter, freitextHinweis } = props;
  const [imFeld, setImFeld] = useState(false);
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

  const suche = eingabe.trim();
  // Bewusst ohne Obergrenze: die Liste ist ein Ersatz für das Native-Select und
  // muss ohne Tippen jeden Eintrag zeigen — sie scrollt (max-height in der
  // CSS). Gekappt auf acht Zeilen las sich „B (ASH) … FGr I" am Handy als
  // vollständige Auswahl, und wer seine Einheit nicht sah, hielt sie für
  // nicht vorgesehen, statt zu tippen.
  // Wortweise und ohne Umlaut-Unterschiede (R11-H2): „FGr Wasserschaden/Pumpen", das Beispiel im Feld,
  // findet „FGr WP – Fachgruppe Wasserschaden/Pumpen", obwohl Kürzel und Name getrennt stehen.
  // Rang statt Reihenfolge der Liste (R13-H1): das Kürzel als ganzes Wort zuerst, dann Wortanfänge, zuletzt Treffer mitten im Wort;
  // gebräuchliche Kurzformen („BGr", „1. BGr") kommen als zusätzliche Suchtexte dazu.
  const treffer = suche
    ? sortiert
        .map((t, i) => ({ t, i, r: Math.min(...[suche, ...suchAlternativen(suche)].map((s) => vokabRang(t.kurz, t.name, s))) }))
        .filter((x) => x.r < 3)
        .sort((a, b) => a.r - b.r || a.i - b.i)
        .map((x) => x.t)
    : sortiert;

  const freitext = wert.code == null ? (wert.freitext ?? "").trim() : "";
  return (
    <>
    {/* Nur zum Beobachten des Fokus; ohne eigene Darstellung. */}
    <span style={{ display: "contents" }} onFocusCapture={() => setImFeld(true)} onBlurCapture={() => setImFeld(false)}>
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
        // Direkt eingetipptes Kürzel, Label oder ausgeschriebener Name beim
        // Verlassen zum Code auflösen — ohne Groß-/Kleinschreibung und ohne
        // Leerzeichen am Rand, aber nur bei genau einem Treffer (R4-H1).
        const klein = falte(v);
        const gleich = sortiert.filter((x) => falte(x.name) === klein || falte(label(x)) === klein);
        const t =
          sortiert.find((x) => label(x) === v || falte(x.kurz) === klein) ?? (gleich.length === 1 ? gleich[0] : undefined);
        if (t) {
          setEingabe(label(t));
          aendern({ code: t.code });
        }
      }}
    />
    </span>
    {freitextHinweis && freitext && !imFeld && (
      <span className="hinweis warnung-text freitext-hinweis" role="status" style={{ display: "block" }}>
        „{freitext}" ist nicht aus der Liste — Vorschlag antippen oder als eigener Typ behalten. Ohne Typ-Code
        fehlen das taktische Zeichen und der Soll-Vergleich.
      </span>
    )}
    </>
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
/**
 * Eingabeattribute für Kennungen — Kennzeichen, Funkruf-Kennzahlen,
 * Dienststellen-Kürzel. Das sind Buchstaben-Ziffern-Folgen, keine Wörter: die
 * Autokorrektur „verbesserte" sie, die Großschreibung am Satzanfang machte
 * aus „THW" ein „Thw", und die Rechtschreibprüfung unterstrich jedes
 * Kennzeichen rot (Audit Runde 2, R2-M6). `autoComplete="off"` dazu, weil
 * das Telefon für ein unbeschriftetes Textfeld sonst Einträge aus ganz
 * anderen Formularen anbietet.
 */
export const KENNUNG_EINGABE = {
  autoCapitalize: "characters",
  autoCorrect: "off",
  spellCheck: false,
  autoComplete: "off",
} as const;

/**
 * Für Felder, die NICHT die eigenen Daten des Gerätebesitzers meinen
 * (Personen des Bogens, Dienststellenkontakte): kein Autofill aus der
 * eigenen Kontaktkarte. `autocomplete="tel"`/`"email"` am OV-Telefon bot die
 * private Handynummer an, und ein Tipp darauf setzte sie als
 * Dienststellenkontakt auf den Bogen (R2-M6). Nur „Name/Kontakt hinterlegen"
 * (Absenderkarte) meint wirklich den Gerätebesitzer und behält name/email/tel.
 */
export const FREMDE_DATEN = { autoComplete: "off", autoCorrect: "off", spellCheck: false } as const;

/**
 * Für Namen, Orte, Typen und Zuordnungen mit Fachwörtern („FGr“, „GrFü“, „Haßmersheim“, seltene Familiennamen):
 * Die Tastatur unterstrich sie rot und tauschte sie beim Leertaste-Druck gegen Wörterbuchwörter aus (R13-H3).
 * Anders als {@link KENNUNG_EINGABE} bleibt die Großschreibung am Wortanfang.
 */
export const NAMEN_EINGABE = { autoCorrect: "off", spellCheck: false } as const;

/**
 * Die offene Vorschlagsliste soll über den festen Leisten am unteren Rand (Fußleiste des
 * Assistenten, Ansicht-Balken, Bildschirmtastatur) im Bild stehen: In der Schnellerfassung lag
 * „FGr W (B)" ganz unter der zweizeiligen Fußleiste (R7-E8). Erst rollt die Seite so weit, wie
 * es das Feld oben im Bild lässt, dann wird die Liste auf den Rest begrenzt (sie rollt in sich).
 */
function listeInsBildHalten(liste: HTMLElement, eingabe: HTMLElement | null) {
  liste.style.maxHeight = "";
  if (typeof window === "undefined") return;
  const vv = window.visualViewport;
  let grenze = vv ? vv.offsetTop + vv.height : window.innerHeight;
  for (const fest of document.querySelectorAll<HTMLElement>("footer.nav, .anzeige-balken")) {
    const r = fest.getBoundingClientRect();
    if (r.height > 0 && r.top > 0 && r.top < grenze) grenze = r.top;
  }
  const rand = 8;
  const unten = liste.getBoundingClientRect().bottom;
  if (unten <= grenze - rand) return;
  const feldOben = eingabe?.getBoundingClientRect().top ?? 0;
  // Das Feld bleibt im Bild: höchstens so weit rollen, dass seine Oberkante bei 8 px steht.
  const rollen = Math.max(0, Math.min(unten - (grenze - rand), feldOben - rand));
  if (rollen > 0) {
    try {
      window.scrollBy(0, rollen);
    } catch {
      /* Testumgebung ohne Layout */
    }
  }
  const oben = liste.getBoundingClientRect().top;
  const platz = grenze - rand - oben;
  // Mindestens eine Zeile (Grundmaß) bleibt, auch wenn der Platz knapp ist.
  if (platz > 0 && platz < liste.getBoundingClientRect().height) liste.style.maxHeight = `${Math.max(platz, 48)}px`;
}

export function VorschlagFeld<T>(props: {
  /** id des Eingabefelds (Sprungziel); die Listen-IDs bleiben eigene. */
  id?: string;
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
  /** true: Kennung (Kürzel) — Großbuchstaben, ohne Autokorrektur ({@link KENNUNG_EINGABE}). */
  kennung?: boolean;
  /**
   * Satz unter dem Feld, solange das Feld Fokus hat, etwas getippt ist und die Liste nichts findet — statt
   * stumm Freitext zu übernehmen (R11-H1).
   */
  keineTreffer?: ReactNode;
}) {
  const { id: feldId, wert, platzhalter, beschriftung, treffer, schluessel, zeile, tippen, waehlen, bestaetigen, verlassen, imFluss, picker, kennung, keineTreffer } = props;
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
  const listeRef = useRef<HTMLUListElement>(null);
  const eingabeRef = useRef<HTMLInputElement>(null);
  useLayoutEffect(() => {
    const liste = listeRef.current;
    if (!aufgeklappt || !liste) return;
    listeInsBildHalten(liste, eingabeRef.current);
    // Die Bildschirmtastatur fährt erst nach dem Öffnen auf und verkleinert das Bild.
    const vv = typeof window === "undefined" ? null : window.visualViewport;
    if (!vv) return;
    const neu = () => listeInsBildHalten(liste, eingabeRef.current);
    vv.addEventListener("resize", neu);
    return () => vv.removeEventListener("resize", neu);
  }, [aufgeklappt, sichtbar.length]);
  // Die markierte Zeile bleibt beim Blättern mit den Pfeiltasten im Bild: Die
  // Liste rollt in sich (max-height), und ab der sechsten Zeile wanderte die
  // Markierung unsichtbar unter den Rand (Probelauf: THW-Fahrzeugtypen).
  useEffect(() => {
    if (!aufgeklappt) return;
    const zeile = listeRef.current?.children[aktiv];
    if (zeile instanceof HTMLElement && typeof zeile.scrollIntoView === "function") {
      try {
        zeile.scrollIntoView({ block: "nearest" });
      } catch {
        /* Umgebung ohne Layout */
      }
    }
  }, [aktiv, aufgeklappt]);
  const nehmen = (v: T) => {
    waehlen(v);
    setOffen(false);
    setAktiv(0);
  };

  return (
    <span className={["autocomplete", imFluss ? "im-fluss" : "", picker ? "picker" : ""].filter(Boolean).join(" ")}>
      <input
        id={feldId}
        ref={eingabeRef}
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
        // Ort, Einheitstyp, Funktion, Beruf: Fachwörter und Kürzel, keine Wörterbuchwörter (R13-H3).
        {...NAMEN_EINGABE}
        enterKeyHint={imFluss ? "enter" : "next"}
        {...(kennung ? KENNUNG_EINGABE : {})}
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
            // „Weiter" der Tastatur (R11-G1): wie in Schritt 3 und 5 zum nächsten Feld, im letzten schließt
            // sie die Tastatur. Chip-Felder (imFluss) bleiben stehen, dort folgt oft ein weiterer Eintrag.
            if (!imFluss && eingabeRef.current) {
              const weiter = naechstesFeld(eingabeRef.current);
              if (weiter) weiter.focus();
              else eingabeRef.current.blur();
            }
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
        <ul
          className="vorschlaege"
          ref={listeRef}
          id={listeId}
          role="listbox"
          aria-label={`Vorschläge zu ${beschriftung ?? ausFeld ?? "der Eingabe"}`}
          // Ein Mausklick auf die Rollleiste der Liste (oder das Ziehen ihres
          // Griffs) nahm dem Feld den Fokus — blur schloss die Liste, bevor
          // sie gerollt war (Probelauf: THW-Fahrzeugtypen mit der Maus nicht
          // rollbar). Der Fokus bleibt im Feld; die Zeilen wählen weiterhin
          // über ihr eigenes mousedown.
          onMouseDown={(ev) => ev.preventDefault()}
        >
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
      {keineTreffer && offen && treffer.length === 0 && wert.trim().length >= 3 && (
        <span className="hinweis kein-treffer" style={{ display: "block" }}>
          {keineTreffer}
        </span>
      )}
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
  /**
   * Hinweis zur aktuellen Suche, der unter den Vorschlägen steht — für
   * Eingaben, die hier nichts (Passendes) finden, weil das Gesuchte in einem
   * anderen Feld liegt. Liefert nichts, bleibt die Liste allein.
   */
  suchhinweis?: (suche: string) => ReactNode | undefined;
  /**
   * Was das LEERE Feld beim Antippen anbietet (häufigste Funktionen der
   * Einheit, haeufige-funktionen.ts) — damit sich eine Funktion ohne
   * Tastatur zuweisen lässt (Audit Runde 2, R2-G5). Schon gesetzte Werte
   * fallen heraus.
   */
  haeufige?: readonly VokabularWert[];
}) {
  const { werte, aendern, tabelle, hinzufuegenText, freitextVorschlaege, suchhinweis, haeufige } = props;
  const [eingabe, setEingabe] = useState("");
  // Zuletzt entfernter Eintrag mit seinem Platz: Das Entfernen geschah ohne Spur, und ein Fehltipp mit Handschuh
  // ließ die Funktion der Person unbemerkt verschwinden (R12-G1).
  const [entfernt, setEntfernt] = useState<{ wert: VokabularWert; index: number; text: string } | null>(null);

  const suche = eingabe.trim();
  const treffer: Kandidat[] = [];
  if (!suche) {
    for (const w of haeufige ?? []) {
      if (funktionVergeben(werte, w)) continue;
      const t = w.code != null ? tabelle.find((x) => x.code === w.code) : undefined;
      if (w.code != null && !t) continue; // Code aus fremder Tabelle: lieber nicht als „#12" anbieten
      treffer.push(t ? { text: t.kurz, zusatz: t.name, wert: w } : { text: w.freitext ?? "", wert: w });
    }
  } else {
    // vokabSortiert: gleiche Reihenfolge wie in den Auswahllisten der App,
    // damit Gleichartiges beieinander steht („GrFü B", „GrFü BrB", „GrFü E").
    for (const t of vokabSortiert(tabelle)) {
      // Wortweise, ohne Umlaut-Unterschiede: „Gruppenfuehrer" und „GrFu" finden „GrFü …" (R11-H2).
      if (passtZurSuche(`${t.kurz} ${t.name}`, suche)) {
        treffer.push({ text: t.kurz, zusatz: t.name, wert: { code: t.code } });
      }
    }
    for (const v of freitextVorschlaege ?? []) {
      const { text, zusatz } = typeof v === "string" ? { text: v, zusatz: undefined } : v;
      // Der Zusatz zählt bei der Suche mit: „Tauchen" soll alle Tauchscheine
      // holen, obwohl das Wort in keiner der Bezeichnungen steht.
      if (passtZurSuche(`${text} ${zusatz ?? ""}`, suche))
        treffer.push({ text, zusatz, wert: { freitext: text } });
    }
    // Was mit der Eingabe beginnt, ist meist das Gemeinte — nach vorn. Zählt für
    // beide Schreibweisen: die eine tippt „GrFü B", die andere „Gruppenführer".
    const beginnt = (k: Kandidat) =>
      Number(beginntMit(k.text, suche) || (k.zusatz != null && beginntMit(k.zusatz, suche)));
    treffer.sort((a, b) => beginnt(b) - beginnt(a));
  }

  const hinweis = suche ? suchhinweis?.(suche) : undefined;

  const hinzu = (w: VokabularWert) => {
    aendern([...werte, w]);
    setEingabe("");
    setEntfernt(null);
  };
  const wertText = (w: VokabularWert) =>
    w.code != null ? (tabelle.find((t) => t.code === w.code)?.kurz ?? `#${w.code}`) : (w.freitext ?? "");
  const entfernen = (i: number) => {
    const w = werte[i];
    if (!w) return;
    setEntfernt({ wert: w, index: i, text: wertText(w) });
    aendern(werte.filter((_, j) => j !== i));
  };
  const zurueckholen = () => {
    if (!entfernt) return;
    const neu = [...werte];
    neu.splice(Math.min(entfernt.index, neu.length), 0, entfernt.wert);
    aendern(neu);
    setEntfernt(null);
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
            onClick={() => entfernen(i)}
          >
            ×
          </button>
        </span>
      ))}
      {entfernt && (
        <span className="chip-rueckgaengig" role="status">
          „{entfernt.text}" entfernt{" "}
          <button type="button" onClick={zurueckholen}>
            Rückgängig
          </button>
        </span>
      )}
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
      {hinweis && (
        <span className="hinweis suchhinweis" role="note">
          {hinweis}
        </span>
      )}
    </span>
  );
}

/**
 * Ein Tipp auf die Beschriftung (oder daneben) gibt der Beschriftung zufolge den Tipp an das erste bedienbare
 * Element im Feld weiter. Bei Feldern mit Chips ist das der Knopf „<Funktion> entfernen" des ersten Chips: Ein Tipp
 * auf die Titelzeile oder neben den Chip löschte die Funktion der Person ohne Rückfrage (R12-G1). Steht ein
 * Knopf vor dem Eingabefeld, geht der Tipp deshalb an das Eingabefeld (Fokus), nie an den Knopf.
 */
export function feldTippFangen(e: MouseEvent<HTMLLabelElement>): void {
  const ziel = e.target as Element | null;
  if (ziel?.closest("button, input, select, textarea, a, [role='option'], [role='listbox']")) return;
  const label = e.currentTarget;
  const erstes = label.querySelector("button, input:not([type='hidden']), select, textarea");
  if (!(erstes instanceof HTMLButtonElement)) return;
  const eingabe = label.querySelector<HTMLElement>("input:not([type='hidden']), select, textarea");
  if (!eingabe) return; // Ein Feld nur aus Knöpfen behält die Weitergabe des Tipps.
  e.preventDefault();
  eingabe.focus();
}

export function Feld(props: { titel: string; schmal?: boolean; klasse?: string; children: ReactNode }) {
  return (
    <label
      className={["feld", props.schmal ? "schmal" : "", props.klasse ?? ""].filter(Boolean).join(" ")}
      onClick={feldTippFangen}
    >
      {props.titel}
      <FeldTitel.Provider value={props.titel}>{props.children}</FeldTitel.Provider>
    </label>
  );
}

export const zahl = (s: string): number => {
  const n = parseInt(s, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

/**
 * Satz für ein Zahlenfeld, dessen Eingabe begrenzt oder gerundet wurde — leer, wenn der Wert
 * unverändert übernommen wird (Audit Runde 7, R7-E6: 999 wurde still zu 99, −5 zu 0, 1,5 zu 1;
 * Runde 9, R9-E1: Komma und Minus verschwanden still). Rechnet wie {@link zahlLesen}.
 */
export function zahlBegrenzung(eingabe: string, opt: { min?: number; max?: number; einheit?: string } = {}): string {
  return zahlLesen(eingabe, opt).meldung;
}

/**
 * Zahlenfeld mit Text statt `type="number"`: Der Wert im Feld ist, was getippt wurde, bis das Feld
 * verlassen wird; ins Modell geht die gelesene ganze Zahl. Jede Abweichung (Komma gerundet, Minus
 * abgelehnt, Obergrenze) steht als Satz neben dem Feld (R9-E1). Leer ist 0 — oder, mit `leer`,
 * „nicht angegeben" (`undefined`); das Feld zeigt dann kein stehengebliebenes „0" (R9-E1).
 * Ziffernblock und „Weiter" der Tastatur (`inputMode`, `enterKeyHint`, R9-G6).
 */
export function useZahlEingabe(
  wert: number | undefined,
  setzen: (n: number | undefined) => void,
  regeln: ZahlRegeln & { leer?: boolean } = {},
): { eingabe: ComponentProps<"input">; meldung: string } {
  const anzeige = (w: number | undefined) => (w === undefined ? "" : String(w));
  const [text, setText] = useState(anzeige(wert));
  const [meldung, setMeldung] = useState("");
  const [abgelehnt, setAbgelehnt] = useState(false);
  const zuletzt = useRef(wert);
  useEffect(() => {
    // Von außen geändert (Schaltfläche +/−, Vorbelegung aus der Stärke): Feld und Satz folgen.
    if (wert !== zuletzt.current) {
      zuletzt.current = wert;
      setText(anzeige(wert));
      setMeldung("");
      setAbgelehnt(false);
    }
  }, [wert]);
  const aufnehmen = (roh: string) => {
    if (roh.trim() === "" && regeln.leer) {
      setText(roh);
      setMeldung("");
      setAbgelehnt(false);
      zuletzt.current = undefined;
      setzen(undefined);
      return;
    }
    const r = mitGeltendemWert(zahlLesen(roh, regeln), zuletzt.current);
    setMeldung(r.meldung);
    setAbgelehnt(r.wert === null);
    if (r.wert === null) {
      setText(roh);
      return;
    }
    // Führende Nullen („05") und begrenzte Werte zeigt das Feld sofort so, wie sie gelten.
    setText(r.begrenzt || /^0\d/.test(roh.trim()) ? String(r.wert) : roh);
    zuletzt.current = r.wert;
    setzen(r.wert);
  };
  return {
    meldung,
    eingabe: {
      type: "text",
      inputMode: "numeric",
      enterKeyHint: "next",
      autoComplete: "off",
      value: text,
      "aria-invalid": abgelehnt || undefined,
      onChange: (e) => aufnehmen(e.target.value),
      onFocus: zahlMarkieren, // Antippen markiert die Zahl: Überschreiben statt Anhängen (R16-S1)
      onBlur: () => setText(anzeige(zuletzt.current)),
    },
  };
}

/**
 * Sammelstelle für die Sätze der Zahlenfelder einer Feldzeile (R10-M4, R10-G3): Steht sie im Baum, zeigt
 * {@link ZahlMeldung} den Satz nicht unter dem Feld, sondern meldet ihn hier an — die Zeile sammelt alle Sätze
 * über die volle Breite unter den Feldern. In der schmalen Feldspalte (112 px) brach er in bis zu sieben Zeilen
 * um und verschob die Nachbarfelder.
 */
export const ZahlMeldungsSenke = createContext<((feld: string, text: string) => void) | null>(null);

/** Der Satz zu {@link useZahlEingabe}, direkt unter dem Feld (oder gesammelt, siehe {@link ZahlMeldungsSenke}). */
export function ZahlMeldung(props: { meldung: string; id?: string }) {
  const senke = useContext(ZahlMeldungsSenke);
  const feld = useContext(FeldTitel) ?? "";
  const { meldung } = props;
  useEffect(() => {
    if (!senke) return;
    senke(feld, meldung);
    return () => senke(feld, "");
  }, [senke, feld, meldung]);
  if (!meldung || senke) return null;
  return (
    <small className="hinweis warnung-text zahl-meldung" id={props.id} role="status">
      {props.meldung}
    </small>
  );
}

/** Ganzzahlfeld (Liter, Personen, Anzahl) mit {@link useZahlEingabe} und dem Satz darunter. */
export function ZahlFeld(props: {
  wert: number;
  setzen: (n: number) => void;
  min?: number;
  max?: number;
  einheit?: string;
  "aria-label"?: string;
  id?: string;
}) {
  const { meldung, eingabe } = useZahlEingabe(props.wert, (n) => props.setzen(n ?? 0), props);
  return (
    <>
      <input {...eingabe} id={props.id} aria-label={props["aria-label"]} />
      <ZahlMeldung meldung={meldung} />
    </>
  );
}

// Die Stärke-Notation „x / x / x / x" ist BOS-Konvention, aber nicht jedem
// geläufig — Tooltip/aria erklären sie, ohne die Anzeige aufzublähen.
export const STAERKE_LEGENDE = "Führer / Unterführer / Mannschaft / Gesamt";
/** Wofür die Aufteilung nach Geschlecht gebraucht wird (Unterbringung, WC/Dusche). */
export const MWD_LEGENDE = "Aufteilung nach Geschlecht — für Unterbringung und WC/Dusche";

export function staerkeVorlesen(s: { fuehrer: number; unterfuehrer: number; mannschaft: number; gesamt: number }): string {
  return `${s.fuehrer} Führer, ${s.unterfuehrer} Unterführer, ${s.mannschaft} Mannschaft, ${s.gesamt} gesamt`;
}

/**
 * Großer, touch-freundlicher Zähler (− / Zahl / +) für die Erfassung ohne
 * Tastatur am Tablet. Werte bleiben ≥ min; direkte Zahleneingabe bleibt möglich.
 */
export function Stepper(props: { titel: string; wert: number; setzen: (n: number) => void; min?: number }) {
  const min = props.min ?? 0;
  const setze = (n: number) => props.setzen(Math.min(HOECHST_PERSONEN, Math.max(min, n)));
  const { eingabe, meldung } = useZahlEingabe(props.wert, (n) => setze(n ?? 0), { min, max: HOECHST_PERSONEN, einheit: "Zahlen" });
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
        <input {...eingabe} aria-label={props.titel} />
        <button type="button" aria-label={`${props.titel}: erhöhen`} onClick={() => setze(props.wert + 1)}>
          +
        </button>
      </div>
      <ZahlMeldung meldung={meldung} />
    </div>
  );
}

/**
 * Plausibilitätshinweise (nicht blockierend) zum AKTUELLEN Schritt.
 *
 * Von den Prüfpunkten (pruefpunkte()) erscheinen nur die, die sich auf diesem
 * Schritt beheben lassen. Vorher standen auf Schritt 1 schon drei gelbe
 * Kästen, bevor irgendetwas eingegeben war — zwei davon zu Schritt 2 und 3,
 * antippbar, und wer ihnen folgte, sprang auf Schritt 3, bevor Schritt 1
 * fertig war. Wer auf dem ersten Bildschirm lernt, dass gelbe Kästen ohnehin
 * immer da sind, überliest später auch die, die zählen (kein Name, keine
 * Rufnummer). Die Gesamtliste über alle Schritte gehört in die Übersicht und
 * den Übergabe-Dialog, wo sie als Checkliste mit Sprung steht.
 *
 * `role="status"`, damit Vorlesesoftware neu auftauchende Hinweise aktiv
 * mitbekommt.
 */
export function Hinweise(props: {
  /** Nur-Text-Hinweise, die den aktuellen Schritt selbst betreffen. */
  hinweise?: string[];
  /** Hinweise mit Schrittbezug (pruefpunkte()); gezeigt werden die zu `aktuellerSchritt`. */
  punkte?: Pruefpunkt[];
  /** Schritt-Index (0-basiert, siehe SCHRITTE in app.tsx) — ohne Angabe erscheinen alle Punkte. */
  aktuellerSchritt?: number;
}) {
  const { hinweise = [], punkte = [], aktuellerSchritt } = props;
  const hier = aktuellerSchritt == null ? punkte : punkte.filter((p) => p.schritt === aktuellerSchritt);
  if (hinweise.length === 0 && hier.length === 0) return null;
  return (
    <div role="status">
      {hinweise.map((h) => (
        <p key={h} className="warnung">⚠ {h}</p>
      ))}
      {hier.map((p) => (
        <p key={p.text} className="warnung">⚠ {p.text}</p>
      ))}
    </div>
  );
}

/**
 * Vollständigkeits-Checkliste der Übersicht: bündelt alle offenen Punkte in
 * einer Box; jeder Punkt springt direkt zum Schritt, auf dem er sich beheben
 * lässt. Ist alles vollständig, gibt es eine kurze grüne Bestätigung.
 */
export function Vollstaendigkeit(props: {
  punkte: Pruefpunkt[];
  geheZu: (schritt: number, feld?: string) => void;
  /** Satz unter der Liste — im Übergabe-Dialog sagt er, dass nichts gesperrt ist. */
  nachsatz?: string;
  /** Empfangene Meldung einer fremden Einheit: Die Punkte sind Hinweise an die Einheit, kein Auftrag an dieses Gerät (R14-H1). */
  fremd?: boolean;
  /** Schnellerfassung (nur Stärke): „vollständig" gilt nur für das, was dort erfragt wird (R14-N3). */
  schnell?: boolean;
  /** Der Einheitstyp ist gesetzt: Er „fehlt" in der Schnellerfassung dann nicht (R17-S12). */
  typGesetzt?: boolean;
}) {
  const { punkte, geheZu, nachsatz } = props;
  if (punkte.length === 0) {
    return (
      <p className="vollstaendig-ok" role="status">
        {props.schnell ? `✓ Für die Schnellerfassung vollständig (${props.typGesetzt ? "" : "Typ, "}Fahrzeuge, Bedarf fehlen bewusst).` : "✓ Alle Angaben vollständig und plausibel."}
      </p>
    );
  }
  if (props.fremd) {
    return (
      <div className="vollstaendigkeit" role="status">
        <p className="vollstaendigkeit-titel">
          Hinweise an die Einheit ({punkte.length}) — hier nichts zu beheben:
        </p>
        <ul>
          {punkte.map((p) => (
            <li key={p.text}>{p.text}</li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <div className="vollstaendigkeit" role="status">
      <p className="vollstaendigkeit-titel">
        ⚠ {punkte.length === 1 ? "1 offener Punkt" : `${punkte.length} offene Punkte`} für die Weitergabe<span className="nur-bildschirm"> — antippen zum Beheben</span>:
      </p>
      <ul>
        {punkte.map((p) => (
          <li key={p.text}>
            <button type="button" className="link" onClick={() => geheZu(p.schritt, p.feld)}>
              {p.text}
            </button>
          </li>
        ))}
      </ul>
      {nachsatz && <p className="hinweis">{nachsatz}</p>}
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
      {...KENNUNG_EINGABE}
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
