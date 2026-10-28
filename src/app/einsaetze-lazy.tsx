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
    />
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
  return ui ? <ui.EinsatzDetail {...props} /> : <LadeFlaeche />;
}

export function EinsatzListe(props: ComponentProps<Ui["EinsatzListe"]>) {
  const ui = useUi();
  return ui ? <ui.EinsatzListe {...props} /> : <LadeFlaeche karten={props.einsaetze.length} />;
}
