/**
 * Gemeinsame Bausteine der Assistenten-Schritte: Vokabular-Auswahl, Feld-Rahmen,
 * Zähler, Hinweise und die Vollständigkeits-Checkliste. Bewusst ohne Bezug zu
 * einem einzelnen Schritt — alles hier wird von mehreren Schritten genutzt.
 */

import { createContext, useContext, useState, type ComponentProps, type ReactNode } from "react";
import { Erfassungsbogen, VokabularWert } from "../../model";
import type { VokabularEintrag } from "../../vokabulare/thw";
import { vokabSortiert, type Pruefpunkt } from "../hilfen";
import { frageText } from "../dialoge";

export type SchrittProps = {
  bogen: Erfassungsbogen;
  aendern: (patch: Partial<Erfassungsbogen>) => void;
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
}) {
  const { wert, aendern, tabelle, platzhalter } = props;
  const titel = useContext(FeldTitel);
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

export function VokabListe(props: {
  werte: VokabularWert[];
  aendern: (w: VokabularWert[]) => void;
  tabelle: VokabularEintrag[];
  hinzufuegenText: string;
}) {
  const { werte, aendern, tabelle, hinzufuegenText } = props;
  return (
    <span className="chips">
      {werte.map((w, i) => (
        <span key={i} className="chip">
          {w.code != null ? (tabelle.find((t) => t.code === w.code)?.kurz ?? `#${w.code}`) : w.freitext}
          <button type="button" onClick={() => aendern(werte.filter((_, j) => j !== i))}>×</button>
        </span>
      ))}
      <Auswahl
        beschriftung={`${hinzufuegenText} hinzufügen`}
        value=""
        onChange={async (e) => {
          // Das Feld gleich zurücksetzen: die Freitext-Abfrage läuft asynchron,
          // solange dürfte sonst „Freitext…" als scheinbare Auswahl stehen.
          const feld = e.currentTarget;
          const v = feld.value;
          feld.value = "";
          if (!v) return;
          if (v === "frei") {
            const t = await frageText({
              titel: hinzufuegenText,
              label: "Freitext",
              ok: "Hinzufügen",
            });
            if (t) aendern([...werte, { freitext: t }]);
            return;
          }
          aendern([...werte, { code: Number(v) }]);
        }}
      >
        <option value="">{hinzufuegenText}…</option>
        {vokabSortiert(tabelle).map((t) => (
          <option key={t.code} value={t.code}>
            {t.kurz} – {t.name}
          </option>
        ))}
        <option value="frei">Freitext…</option>
      </Auswahl>
    </span>
  );
}

export function Feld(props: { titel: string; schmal?: boolean; children: ReactNode }) {
  return (
    <label className={`feld${props.schmal ? " schmal" : ""}`}>
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

/** Plausibilitätshinweise (nicht blockierend). */
export function Hinweise({ hinweise }: { hinweise: string[] }) {
  return (
    <>
      {hinweise.map((h) => (
        <p key={h} className="warnung">⚠ {h}</p>
      ))}
    </>
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
