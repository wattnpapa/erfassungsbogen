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
import { staerke } from "@bos/eeb-format/model";
import { zeitpunktDeutsch } from "./hilfen";
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
    <details className="meldungen-papierkorb" id={PAPIERKORB_ANKER}>
      <summary>
        Zuletzt entfernte Meldungen ({liste.length}) — {MELDUNGEN_PAPIERKORB_TAGE} Tage zurückholbar
      </summary>
      <ul className="papierkorb-liste">
        {liste.map((m) => (
          <li key={m.id}>
            <span className="papierkorb-text">
              {m.art === "fassung" ? "Fassung von " : "Meldung "}
              {m.nummer != null ? `Nr. ${m.nummer} ` : ""}
              <strong>„{m.name}"</strong>
              {m.bezug ? ` (${m.bezug})` : ""} · entfernt {zeitLang(m.entferntAm)} · liegt bis {zeitLang(papierkorbFristEnde(m))}
            </span>
            {/* Je Fassung Stand, Stärke, Zug und Auftrag: Bei mehreren Meldungen derselben Einheit sieht man, welche man holt (R18-K11). */}
            <ul className="papierkorb-fassungen">
              {fassungsZeilen(m).map((z) => (
                <li key={z.id}>{z.text}</li>
              ))}
            </ul>
            {/* Eigene Knopfzeile unter dem Text, „Endgültig löschen…" rechts abgesetzt (R18-D1, E4, H3, G1). */}
            <span className="papierkorb-knoepfe">
              <button type="button" onClick={() => onHolen(m)}>Zurückholen</button>
              <button type="button" className="gefahr" onClick={() => void loeschen(m)}>Endgültig löschen…</button>
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}

/** Anker des Blocks: Der Verweis über der Liste springt hierher und klappt ihn auf (R18-E3). */
export const PAPIERKORB_ANKER = "meldungen-papierkorb";

/** Eine Zeile je Fassung der entfernten Meldung, die jüngste zuerst: Stand · Stärke · Zug · Auftrag. */
export function fassungsZeilen(m: PapierkorbMeldung): { id: string; text: string }[] {
  return [...m.eintraege]
    .sort((a, b) => b.bogen.stand - a.bogen.stand)
    .map((e) => {
      const s = staerke(e.bogen);
      const auftrag = (e.bogen.einsatz.ortAuftrag ?? "").trim();
      const teile = [
        `Stand ${zeitpunktDeutsch(e.bogen.stand)}`,
        `Stärke ${s.fuehrer}/${s.unterfuehrer}/${s.mannschaft}/${s.gesamt}`,
        e.zugEtikett ? `Zug „${e.zugEtikett}"` : "kein Zug",
        ...(auftrag ? [`Auftrag „${auftrag}"`] : []),
      ];
      return { id: e.id, text: teile.join(" · ") };
    });
}
