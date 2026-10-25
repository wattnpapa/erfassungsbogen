/**
 * Warnung „Geräteuhr prüfen" (Audit Runde 4, R4-D1; Runde 5, R5-D1, R5-O5).
 *
 * Weicht die Geräteuhr unplausibel weit vom letzten Start ab (mehr als
 * `UHR_SPRUNG_TAGE`, vor oder zurück), rechnet die App alle Fristen mit dem
 * letzten akzeptierten Zeitpunkt und löscht oder anonymisiert nichts. Ob das
 * Datum stimmt, kann nur der Helfer sagen: Nach einer echten Pause von 100
 * Tagen ist es richtig, nach einem leeren Akku falsch. Die Meldung nennt
 * deshalb beide Möglichkeiten, sagt mit Zahlen, was „Stimmt" kostet, und
 * verlangt eine Antwort. Ein Sprung wird nie durch Zeitablauf bestätigt.
 */
import { useMemo, useState } from "react";
import { EEB_EPOCHE_MS, type EebZeitpunkt } from "@bos/eeb-format/model";
import { datenschutzfristAbgelaufen } from "@bos/eeb-format/datenschutzfrist";
import { uhrBestaetigen, uhrWarnung } from "./datenschutz-uhr";
import { betroffeneText, folgenMehrzahl, folgenText, folgenVorhanden, msAusZeitpunkt } from "./uhr-folgen";
import { frageJaNein } from "./dialoge";
import { ENTWURF_SCHLUESSEL, entwurfAusJson } from "./entwurf";
import { einheitAnzeigename } from "./hilfen";

function tag(z: EebZeitpunkt): string {
  return new Date(EEB_EPOCHE_MS + z * 60_000).toLocaleDateString("de-DE", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Die Richtung des Sprungs in Worten — „danach" las sich verkehrt herum (Audit Runde 7, R7-S5). */
function richtungSatz(vor: boolean, tage: number): string {
  const t = `${tage} ${tage === 1 ? "Tag" : "Tage"}`;
  return vor ? `Die Uhr ist ${t} vorgesprungen.` : `Die Uhr ist ${t} zurückgegangen.`;
}

/**
 * Der eigene Bogen (Entwurf, Rückholplatz), dessen Namen fällig würden, mit Namen und
 * letzter Bearbeitung: „THW Albstadt Zugtrupp", zuletzt bearbeitet 15.07.26" (R7-O4).
 */
function eigeneBoegenText(geraet: EebZeitpunkt): string {
  const teile: string[] = [];
  try {
    for (const [schluessel, wo] of [
      [ENTWURF_SCHLUESSEL, "Bogen"],
      ["eeb.entwurf.ersetzt.v1", "Zuletzt geschlossener Bogen"],
    ] as const) {
      const e = entwurfAusJson(localStorage.getItem(schluessel));
      if (!e || !datenschutzfristAbgelaufen({ uebung: e.bogen.uebung === true, stand: e.bogen.stand }, geraet)) continue;
      const name = einheitAnzeigename(e.bogen.einheit) || "(ohne Namen)";
      const am = new Date(e.gespeichert).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" });
      teile.push(`${wo} „${name}", zuletzt bearbeitet ${am}`);
    }
  } catch {
    /* ohne Lesezugriff bleibt es bei der allgemeinen Angabe */
  }
  return teile.join("; ");
}

export function UhrWarnung({ neuLaden = () => window.location.reload() }: { neuLaden?: () => void } = {}) {
  const w = useMemo(() => uhrWarnung(), []);
  const [korrigieren, setKorrigieren] = useState(false);
  const [fehler, setFehler] = useState(false);
  if (!w) return null;
  const vor = w.richtung === "vor";
  const folgen = folgenText(w.folgen);
  const hatFolgen = folgenVorhanden(w.folgen);
  // Alter gegenüber dem letzten akzeptierten Zeitpunkt, nicht der Geräteuhr (R6-D3).
  const betroffen = betroffeneText(w.folgen, msAusZeitpunkt(w.zuletzt));
  const f = w.folgen;
  const mehrere = folgenMehrzahl(f);
  const eigene = f.entwurf ? eigeneBoegenText(w.geraet) : "";
  // Der Satz zur Rettung passt zum Fall (R6-O8): Sammlungen lassen sich exportieren, der eigene Bogen übergeben.
  const rettung = [
    f.sammlungen > 0 ? "Eine Sammlung, die du noch brauchst, vorher exportieren: Dazu „Abbrechen“ und die Sammlung öffnen." : "",
    f.entwurf ? "Den eigenen Bogen vorher sichern: Dazu „Abbrechen“, auf der Startseite „Fortsetzen“ und dort „Bogen übergeben…“." : "",
  ]
    .filter(Boolean)
    .join(" ");

  async function stimmt() {
    if (hatFolgen) {
      const ja = await frageJaNein({
        titel: "Datum stimmt — jetzt endgültig löschen?",
        text: `Das Gerät zeigt den ${tag(w!.geraet)}. Damit ${mehrere ? "werden" : "wird"} ${folgen} endgültig gelöscht — nicht im Papierkorb. ${betroffen.liste ? `Betroffen: ${betroffen.liste}. ${betroffen.laufend} ` : ""}${eigene ? `Eigener Bogen: ${eigene}. ` : ""}${rettung}`,
        ok: "Ja, Datum stimmt — löschen",
        abbruch: "Abbrechen",
        gefahr: true,
      });
      if (!ja) return;
    }
    if (uhrBestaetigen()) neuLaden();
    else setFehler(true);
  }

  // Erst der Satz und die Antwort, dann die Folgen: Bei 200 % Schrift war die Warnung
  // 1 500 px hoch und die Knöpfe lagen drei Bildschirme tiefer (R7-H9, R7-G8).
  return (
    <div className="warnung uhr-warnung" role="alert">
      <p>
        <strong>⚠ Geräteuhr prüfen:</strong> Das Gerät zeigt den {tag(w.geraet)}, beim letzten Start war der{" "}
        {tag(w.zuletzt)}. {richtungSatz(vor, w.tage)} Stimmt das heutige Datum? Bis du antwortest, löscht und
        anonymisiert die App nichts.
      </p>
      <div className="vorlage-aktionen">
        <button type="button" onClick={stimmt}>Geräteuhr stimmt</button>
        {korrigieren ? (
          <button type="button" onClick={neuLaden}>Neu prüfen</button>
        ) : (
          <button type="button" onClick={() => setKorrigieren(true)}>Uhr korrigieren</button>
        )}
      </div>
      {korrigieren && (
        <p>
          Stelle in den Geräteeinstellungen Datum und Uhrzeit richtig ein (am besten „automatisch"), dann „Neu
          prüfen". Passt die Uhr wieder zum letzten Start, verschwindet diese Meldung von selbst.
        </p>
      )}
      {fehler && <p className="fehler">Die Antwort ließ sich nicht speichern (Speicher gesperrt). Es bleibt alles, wie es ist.</p>}
      {hatFolgen && (
        <p>
          Wenn das Datum stimmt, {mehrere ? "werden" : "wird"} {folgen} endgültig gelöscht. Wenn die Uhr falsch geht, bleibt alles.
        </p>
      )}
      {(betroffen.liste || eigene) && (
        // Hinter einem Tipp: Bei 200 % Schrift hielt die Aufzählung die Antwort aus dem Bild (R7-H9).
        <details className="uhr-betroffen">
          <summary>Was genau betroffen wäre</summary>
          {betroffen.liste && (
            <p>
              Betroffen: {betroffen.liste}. {betroffen.laufend}
            </p>
          )}
          {eigene && <p>Eigener Bogen: {eigene}.</p>}
        </details>
      )}
    </div>
  );
}

/**
 * Hinweis im Assistenten und im Dialog „Bogen übergeben", solange die Frage der
 * Geräteuhr offen ist: Stand und Einsatzzeitraum dieses Bogens tragen sonst die
 * falsche Uhrzeit ohne jeden Hinweis, und der Meldekopf bekommt das falsch
 * beschriftete Blatt (Audit Runde 7, R7-W2). Beantwortet wird auf der Startseite.
 */
export function UhrHinweis({ klasse = "" }: { klasse?: string } = {}) {
  const w = useMemo(() => {
    try {
      return uhrWarnung();
    } catch {
      return null;
    }
  }, []);
  if (!w) return null;
  return (
    <p className={`warnung uhr-hinweis ${klasse}`.trim()} role="status">
      <strong>⚠ Geräteuhr nicht bestätigt:</strong> Das Gerät zeigt den {tag(w.geraet)}, beim letzten Start war der{" "}
      {tag(w.zuletzt)}. Datum und Stand dieses Bogens stimmen vielleicht nicht. Antworten kannst du auf der
      Startseite unter „Geräteuhr prüfen"; der Bogen bleibt dabei gespeichert.
    </p>
  );
}
