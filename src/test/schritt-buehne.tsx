/**
 * Kleine Bühne für die Schritt-Komponenten: hält den Bogen im Zustand, damit
 * ein Test einen Schritt so bedienen kann wie die App ihn einhängt
 * (`bogen` + `aendern`), ohne die ganze Anwendung zu rendern.
 */

import { useState, type ComponentType } from "react";
import type { Erfassungsbogen } from "../model";
import { neuerBogen } from "../app/hilfen";
import type { SchrittProps } from "../app/schritte";

export function SchrittBuehne(props: {
  komponente: ComponentType<SchrittProps>;
  /** Abweichender Startbogen; ohne Angabe ein frischer (THW, leer). */
  bogen?: Erfassungsbogen;
}) {
  const { komponente: Schritt } = props;
  const [bogen, setBogen] = useState<Erfassungsbogen>(() => props.bogen ?? neuerBogen());
  return <Schritt bogen={bogen} aendern={(patch) => setBogen((b) => ({ ...b, ...patch }))} />;
}
