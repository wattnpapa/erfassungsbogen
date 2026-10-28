/**
 * Taktische Zeichen als Bild — die Zeichensammlung (rund 340 KB SVG-Quelltext)
 * wird erst bei Bedarf nachgeladen und steckt nicht im Startbündel.
 *
 * Bis die Sammlung da ist, steht ein unsichtbares Quadrat gleicher Höhe an der
 * Stelle: die Zeichen sind quadratisch (viewBox 256 x 256), die Zeile springt
 * beim Austausch nicht. Nach dem ersten Laden liegt die Brücke im Speicher, und
 * jedes weitere Zeichen erscheint schon im ersten Durchgang.
 */

import { useEffect, useState } from "react";
import type { Einheit, Fahrzeug, OrganisationsTyp } from "@bos/eeb-format/model";

type Bruecke = typeof import("./taktische-zeichen-bogen");

let bruecke: Bruecke | null = null;
let ladevorgang: Promise<Bruecke> | null = null;

/** Lädt die Zeichensammlung (einmal); ein Fehlschlag erlaubt einen neuen Versuch. */
export function zeichenLaden(): Promise<Bruecke> {
  if (!ladevorgang) {
    ladevorgang = import("./taktische-zeichen-bogen").then(
      (b) => (bruecke = b),
      (fehler) => {
        ladevorgang = null;
        throw fehler;
      },
    );
  }
  return ladevorgang;
}

/** Durchsichtiges Quadrat als Platzhalter (belegt Höhe und Breite, zeigt nichts). */
const PLATZHALTER =
  "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20256%20256%22%2F%3E";

function useZeichenUrl(erzeuge: (b: Bruecke) => string, abhaengig: unknown[]): string | null {
  const [url, setUrl] = useState<string | null>(() => (bruecke ? bruecke.svgDataUrl(erzeuge(bruecke)) : null));
  useEffect(() => {
    let aktiv = true;
    const fertig = (b: Bruecke) => {
      if (aktiv) setUrl(b.svgDataUrl(erzeuge(b)));
    };
    if (bruecke) fertig(bruecke);
    else zeichenLaden().then(fertig, () => undefined);
    return () => {
      aktiv = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, abhaengig);
  return url;
}

interface BildEigenschaften {
  className?: string;
  alt?: string;
  "aria-hidden"?: boolean | "true";
}

/** Taktisches Zeichen der Einheit (Avatar). */
export function EinheitZeichen({ einheit, ...rest }: { einheit: Einheit } & BildEigenschaften) {
  const url = useZeichenUrl((b) => b.einheitSymbolSvg(einheit), [einheit]);
  return <ZeichenImg url={url} {...rest} />;
}

/** Taktisches Zeichen eines Fahrzeugs. */
export function FahrzeugZeichen({ fahrzeug, org, ...rest }: { fahrzeug: Fahrzeug; org: OrganisationsTyp } & BildEigenschaften) {
  const url = useZeichenUrl((b) => b.fahrzeugSymbolSvg(fahrzeug, org), [fahrzeug, org]);
  return <ZeichenImg url={url} {...rest} />;
}

function ZeichenImg({ url, className, alt = "", ...rest }: { url: string | null } & BildEigenschaften) {
  return (
    <img
      className={className}
      src={url ?? PLATZHALTER}
      alt={url ? alt : ""}
      style={url ? undefined : { visibility: "hidden" }}
      data-zeichen={url ? "geladen" : "laedt"}
      {...rest}
    />
  );
}
