/**
 * Block „Zuletzt entfernte Meldungen" der Einsatzansicht (R17-E2, R17-D6): Was „Meldung entfernen" wegnahm, liegt
 * {@link MELDUNGEN_PAPIERKORB_TAGE} Tage im Papierkorb der Sammlung und lässt sich von hier zurückholen — auch nach dem Neuladen.
 *
 * Eigene Datei, die die Einsatzansicht per `React.lazy` nachlädt: Der Block erscheint nur, wenn etwas im Papierkorb liegt, und
 * soll das Startbündel nicht vergrößern (ADR-003, Aufnahmeregel 5).
 */
import { useMemo, useState } from "react";
import { frageJaNein } from "./dialoge";
import { zeitLang } from "./eintrag-zeiten";
import { MELDUNGEN_PAPIERKORB_TAGE, meldungAusPapierkorb, meldungenImPapierkorb, papierkorbFristEnde, type PapierkorbMeldung } from "./meldungs-papierkorb";

export default function EntferntMeldungenBlock({ einsatzId, geaendert, onHolen }: {
  einsatzId: string;
  /** Ändert sich, wenn die Sammlung sich bewegt hat (Zurückholen, Entfernen): Der Block liest den Papierkorb neu. */
  geaendert: number;
  /** Zurücklegen in die Sammlung — die Einsatzansicht hat Speicherschutz, Quittung und Stapel. */
  onHolen: (m: PapierkorbMeldung) => void;
}) {
  const [stand, setStand] = useState(0);
  // Die Minute zählt mit: Eine abgelaufene Meldung verschwindet auch ohne weitere Handlung.
  const liste = useMemo(() => meldungenImPapierkorb(einsatzId), [einsatzId, geaendert, stand, Math.floor(Date.now() / 60_000)]); // eslint-disable-line react-hooks/exhaustive-deps
  if (liste.length === 0) return null;

  async function loeschen(m: PapierkorbMeldung) {
    const sicher = await frageJaNein({
      titel: "Meldung endgültig löschen?",
      text: `„${m.name}"${m.nummer != null ? ` (war Nr. ${m.nummer})` : ""} wird mit Historie, Zeiten, Zug und Auftrag endgültig gelöscht. Danach lässt sie sich nur noch aus einer Weitergabe-Datei oder einem Export zurückholen.`,
      ok: "Endgültig löschen",
      gefahr: true,
    });
    if (!sicher) return;
    meldungAusPapierkorb(einsatzId, m.id);
    setStand((n) => n + 1);
  }

  return (
    <details className="meldungen-papierkorb">
      <summary>
        Zuletzt entfernte Meldungen ({liste.length}) — {MELDUNGEN_PAPIERKORB_TAGE} Tage zurückholbar
      </summary>
      <ul className="papierkorb-liste">
        {liste.map((m) => (
          <li key={m.id}>
            <span>
              {m.art === "fassung" ? "Fassung von " : "Meldung "}
              {m.nummer != null ? `Nr. ${m.nummer} ` : ""}
              <strong>„{m.name}"</strong>
              {m.bezug ? ` (${m.bezug})` : ""} · entfernt {zeitLang(m.entferntAm)} · liegt bis {zeitLang(papierkorbFristEnde(m))}
            </span>{" "}
            <button type="button" onClick={() => onHolen(m)}>Zurückholen</button>{" "}
            <button type="button" className="gefahr" onClick={() => void loeschen(m)}>Endgültig löschen…</button>
          </li>
        ))}
      </ul>
    </details>
  );
}
