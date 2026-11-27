/**
 * Bausteine des Sichtschutzes „Namen verbergen“ (Logik in namen-verbergen.ts):
 *  - <PersonName>: ein Name als Balken, Antippen, Enter oder Leertaste deckt
 *    ihn für {@link AUFGEDECKT_MS} auf, ein zweiter Tipp verdeckt ihn wieder.
 *  - <NamenText>: Fließtext, in dem gemerkte Namen als <PersonName> stehen
 *    (Rückfragen, Hinweise, Quittungen).
 *  - namensFeld(): Kennzeichen für Eingabefelder mit Namen. Ein Feld ohne
 *    Fokus zeigt den Balken, das Antippen setzt den Fokus und deckt auf.
 *  - <NamenVerbergenSchalter>: der Schalter selbst.
 *
 * Steht ein Name in einem Knopf oder einer Beschriftung (`still`), wird er nur
 * verdeckt: ein Knopf im Knopf ließe sich weder sauber vorlesen noch bedienen.
 * Aufdecken geht dort über den Schalter.
 */

import { useEffect, useState, useSyncExternalStore, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import {
  AUFGEDECKT_MS,
  namenVerbergenAbonnieren,
  namenVerbergenSetzen,
  namenVerbergenStand,
  textMitNamen,
} from "./namen-verbergen";

export function useNamenVerbergen(): boolean {
  return useSyncExternalStore(namenVerbergenAbonnieren, namenVerbergenStand, () => false);
}

export function PersonName(props: { children: string; className?: string; still?: boolean }) {
  const { children, className, still = false } = props;
  const verbergen = useNamenVerbergen();
  const [offen, setOffen] = useState(false);
  useEffect(() => {
    if (!offen) return;
    const uhr = setTimeout(() => setOffen(false), AUFGEDECKT_MS);
    return () => clearTimeout(uhr);
  }, [offen]);
  useEffect(() => {
    if (!verbergen) setOffen(false);
  }, [verbergen]);

  const klasse = (zusatz: string) => ["personname", zusatz, className].filter(Boolean).join(" ");
  if (!verbergen || !children.trim()) return <span className={klasse("")}>{children}</span>;
  if (still) {
    return (
      <span className={klasse("verdeckt")} data-still="">
        <span className="nur-sr">Name verborgen</span>
        <span aria-hidden="true">{children}</span>
      </span>
    );
  }
  const umschalten = (e: MouseEvent | KeyboardEvent) => {
    // Der Name steht oft in einer Karte oder Zeile, die selbst auf Tippen reagiert.
    e.preventDefault();
    e.stopPropagation();
    setOffen((o) => !o);
  };
  const taste = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") umschalten(e);
  };
  return offen ? (
    <span
      className={klasse("aufgedeckt")}
      role="button"
      tabIndex={0}
      aria-pressed="true"
      title="Name wieder verbergen"
      onClick={umschalten}
      onKeyDown={taste}
    >
      {children}
    </span>
  ) : (
    <span
      className={klasse("verdeckt")}
      role="button"
      tabIndex={0}
      aria-pressed="false"
      aria-label="Name verborgen, zum Anzeigen antippen"
      title="Name anzeigen"
      onClick={umschalten}
      onKeyDown={taste}
    >
      <span aria-hidden="true">{children}</span>
    </span>
  );
}

/** Fließtext, in dem gemerkte Namen verdeckt stehen. Ohne Sichtschutz unverändert. */
export function NamenText(props: { children: string; still?: boolean }): ReactNode {
  const verbergen = useNamenVerbergen();
  if (!verbergen) return props.children;
  const stuecke = textMitNamen(props.children);
  if (stuecke.length === 1 && !stuecke[0]!.name) return props.children;
  return stuecke.map((s, i) =>
    s.name ? (
      <PersonName key={i} still={props.still}>
        {s.text}
      </PersonName>
    ) : (
      s.text
    ),
  );
}

/**
 * Kennzeichen für ein Eingabefeld mit Namen. `data-personname="1"`, sobald
 * etwas darin steht: Ein leeres Feld soll keinen Balken tragen, und CSS sieht
 * den Inhalt eines Felds ohne Platzhalter nicht.
 */
export function namensFeld(wert: string | undefined): { "data-personname": "0" | "1" } {
  return { "data-personname": wert && wert.trim() ? "1" : "0" };
}

/** Der Schalter „Namen verbergen“ (Fußzeile, Personal-Schritt, Personalstamm). */
export function NamenVerbergenSchalter(props: { kurz?: boolean } = {}) {
  const an = useNamenVerbergen();
  return (
    <label className="inline namen-verbergen-schalter">
      <input type="checkbox" checked={an} onChange={(e) => namenVerbergenSetzen(e.target.checked)} />{" "}
      Namen verbergen
      {!props.kurz && (
        <span className="hinweis"> — Namen stehen als Balken da, Antippen zeigt sie kurz. PDF und Exporte bleiben vollständig.</span>
      )}
    </label>
  );
}
