/**
 * Einsatzansicht (einsaetze-ui.tsx, rund 150 KB) und Einsatzliste, nachgeladen.
 *
 * Wer nur einen Bogen ausfüllt, braucht die Sammlung nicht; die Datei liegt im
 * Service-Worker-Vorrat und steht offline wie online bereit. Bis sie da ist,
 * hält eine leere Fläche den Platz: bei der Liste so hoch wie die Karten,
 * bei der Detailansicht so hoch wie der Bildschirm — nichts springt beim
 * Austausch. Der Ladezustand ist für Hilfstechnik als „wird geladen" gekennzeichnet.
 *
 * Ist das Modul einmal geladen, rendern beide Ansichten sofort, ohne erneutes
 * Warten (auch in Tests, die `einsatzUiLaden()` vorab abwarten).
 */

import { useEffect, useState, type ComponentProps, type CSSProperties } from "react";
import type { EinsatzArt } from "@bos/meldekopf/einsaetze";
import { AnzeigeSchalter } from "./anzeige-schalter";
import { ART_LABEL } from "./einsaetze-konstanten";
import { SeitenKopf } from "./seiten-kopf";

type Ui = typeof import("./einsaetze-ui");

let geladen: Ui | null = null;
let ladevorgang: Promise<Ui> | null = null;

/** Lädt die Einsatzansicht (einmal); ein Fehlschlag erlaubt beim nächsten Rendern einen neuen Versuch. */
export function einsatzUiLaden(): Promise<Ui> {
  if (!ladevorgang) {
    ladevorgang = import("./einsaetze-ui").then(
      (m) => (geladen = m),
      (fehler) => {
        ladevorgang = null;
        throw fehler;
      },
    );
  }
  return ladevorgang;
}

/**
 * Die Platzhalterfläche. Ihre Höhe steht im CSS (index.html, „Runde 20 (Startbündel)"): bei der Liste `--karten` Kartenhöhen,
 * bei der Detailansicht 70 vh. Die Kartenhöhe ist gemessen, nicht geraten; sie hängt an der Breite.
 */
function LadeFlaeche({ karten }: { karten?: number }) {
  return (
    <div
      className={`einsatz-laedt${karten == null ? " detail" : ""}`}
      role="status"
      aria-busy="true"
      aria-label="Einsatzansicht wird geladen"
      style={karten == null ? undefined : ({ "--karten": karten } as CSSProperties)}
    >
      {/* R21-M2, N5, E2, A2: sichtbarer Ladehinweis statt leerer Fläche (die Liste bleibt eine stille Platzhalterkarte). */}
      {karten == null && <p className="einsatz-laedt-text" aria-hidden="true">Einsatzansicht wird geladen …</p>}
    </div>
  );
}

/**
 * R21-M2, N5, E2, A2: Beim Nachladen der Detailansicht steht schon ihr Kopf da — „‹ Startseite", Ansichtswahl, Name und Art des Einsatzes —,
 * damit der Weg zurück offen ist und nichts leer wirkt. Die Platzhalterfläche (mit dem sichtbaren Ladehinweis) liegt im selben `main`, in dem
 * gleich die Ansicht steht; der Kopf hat dieselbe Bauart wie der der Ansicht, die Seite springt beim Austausch nicht.
 */
function LadeDetail({ einsatz, onZurueck }: { einsatz: { name: string; art: EinsatzArt; ort?: string }; onZurueck: () => void }) {
  return (
    <>
      <SeitenKopf variante="einsatz-kopf einsatz-laedt-kopf">
        <div className="kopf-oberzeile">
          <button type="button" className="zur-start" onClick={onZurueck}>‹ Startseite</button>
          <AnzeigeSchalter klappbar beschriftet />
        </div>
        <div className="titelzeile">
          <h1>{einsatz.name}</h1>
        </div>
        <p className="hinweis">{ART_LABEL[einsatz.art]}{einsatz.ort ? ` · ${einsatz.ort}` : ""}</p>
      </SeitenKopf>
      <main id="inhalt" tabIndex={-1} className="einsatz-detail">
        <LadeFlaeche />
      </main>
    </>
  );
}

/** Das geladene Modul, oder null bis dahin. Ein Ladefehler wird zum Render-Fehler (Fehlerfänger der App). */
function useUi(): Ui | null {
  const [ui, setUi] = useState<Ui | null>(geladen);
  const [, setFehler] = useState<unknown>(null);
  useEffect(() => {
    if (ui) return;
    let aktiv = true;
    einsatzUiLaden().then(
      (m) => aktiv && setUi(m),
      (fehler) =>
        aktiv &&
        setFehler(() => {
          throw fehler;
        }),
    );
    return () => {
      aktiv = false;
    };
  }, [ui]);
  return ui;
}

export function EinsatzDetail(props: ComponentProps<Ui["EinsatzDetail"]>) {
  const ui = useUi();
  return ui ? <ui.EinsatzDetail {...props} /> : <LadeDetail einsatz={props.einsatz} onZurueck={props.onZurueck} />;
}

export function EinsatzListe(props: ComponentProps<Ui["EinsatzListe"]>) {
  const ui = useUi();
  return ui ? <ui.EinsatzListe {...props} /> : <LadeFlaeche karten={props.einsaetze.length} />;
}
