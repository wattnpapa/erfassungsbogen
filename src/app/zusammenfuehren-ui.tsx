/**
 * Auswahlfeld „Teile zusammenführen" in der Einheitenkarte — Gegenstück zu
 * aufteilen-ui.tsx. Angeboten wird es nur, wenn es überhaupt einen anderen
 * anwesenden Teil derselben Einheit gibt.
 *
 * Reine Eingabe und Vorschau; gerechnet wird in zusammenfuehren.ts, geschrieben
 * in einsaetze.ts.
 */

import { useState } from "react";
import { staerke, type Erfassungsbogen } from "../model";
import { zusammenfuehrungFehler, fuegeZusammen } from "./zusammenfuehren";
import type { MeldeEintrag, ZusammenfuehrungOptionen } from "./einsaetze";
import { einheitAnzeigename, zeitgruppe } from "./hilfen";

/** Kurzfassung „0 / 1 / 8 / 9 · 2 Fzg" für die Vorschau. */
function bilanz(b: Erfassungsbogen): string {
  const s = staerke(b);
  return `${s.fuehrer} / ${s.unterfuehrer} / ${s.mannschaft} / ${s.gesamt} · ${b.fahrzeuge.length} Fzg`;
}

export function ZusammenfuehrenPanel(props: {
  /** Die Meldung, die weiterläuft und alles aufnimmt. */
  ziel: MeldeEintrag;
  /** Andere anwesende Teile derselben Einheit (Revisions-Köpfe). */
  teile: MeldeEintrag[];
  onAbbrechen: () => void;
  onZusammenfuehren: (teilIds: string[], opt: ZusammenfuehrungOptionen) => void;
}) {
  const { ziel, teile, onAbbrechen, onZusammenfuehren } = props;
  const [gewaehlt, setGewaehlt] = useState<string[]>(teile.length === 1 ? [teile[0]!.id] : []);
  const [teilEtikett, setTeilEtikett] = useState(ziel.teilEtikett ?? "");

  const mit = teile.filter((t) => gewaehlt.includes(t.id));
  const fehler = zusammenfuehrungFehler(
    ziel.bogen,
    mit.map((t) => t.bogen),
  );
  const vorschau = fehler
    ? null
    : fuegeZusammen(
        ziel.bogen,
        mit.map((t) => t.bogen),
        ziel.bogen.stand,
      );

  function umschalten(id: string) {
    setGewaehlt(gewaehlt.includes(id) ? gewaehlt.filter((x) => x !== id) : [...gewaehlt, id]);
  }

  return (
    <div className="aufteilen-panel">
      <h4>Zusammenführen</h4>
      <p className="hinweis">
        Welche Teile kommen zurück zu „{einheitAnzeigename(ziel.bogen.einheit)}
        {ziel.teilEtikett ? ` (${ziel.teilEtikett})` : ""}“? Ihr Personal und ihre Fahrzeuge landen in
        dieser Meldung; die eingegliederten Teile bleiben mit ihrer Historie stehen, zählen aber nicht
        mehr einzeln.
      </p>

      <h5>Teile, die aufgehen ({mit.length} von {teile.length})</h5>
      {teile.map((t) => (
        <label className="muster-zeile" key={t.id}>
          <input
            type="checkbox"
            aria-label={t.teilEtikett ?? einheitAnzeigename(t.bogen.einheit)}
            checked={gewaehlt.includes(t.id)}
            onChange={() => umschalten(t.id)}
          />
          <span className="muster-text">
            <span className="muster-name">{t.teilEtikett ?? einheitAnzeigename(t.bogen.einheit)}</span>
            <span className="muster-sub">
              Stärke {bilanz(t.bogen)} · Stand {zeitgruppe(t.bogen.stand)}
            </span>
          </span>
        </label>
      ))}

      <label className="feld">
        Bezeichnung danach (leer = die Einheit ist wieder ganz)
        <input
          type="text"
          value={teilEtikett}
          placeholder="ohne Bezeichnung"
          onChange={(e) => setTeilEtikett(e.target.value)}
        />
      </label>

      {vorschau ? (
        <p className="aufteilen-vorschau">
          <strong>Danach:</strong> {bilanz(vorschau)}
          {vorschau.personalErfassung !== ziel.bogen.personalErfassung && (
            <>
              {" — "}
              <span className="hinweis">
                Ein Teil ist nur als Stärke gemeldet: die Summe wird als Zahlen geführt, die bekannten
                Namen bleiben als Ansprechpartner erhalten.
              </span>
            </>
          )}
        </p>
      ) : (
        <p className="hinweis aufteilen-fehler">{fehler}</p>
      )}

      <div className="vorlage-aktionen">
        <button
          type="button"
          className="primaer"
          disabled={fehler != null}
          onClick={() => onZusammenfuehren(gewaehlt, { teilEtikett })}
        >
          Zusammenführen
        </button>{" "}
        <button type="button" onClick={onAbbrechen}>Abbrechen</button>
      </div>
    </div>
  );
}
