/**
 * Warnung „Geräteuhr prüfen" (Audit Runde 4, R4-D1).
 *
 * Geht die Geräteuhr unplausibel weit vor dem letzten Start (mehr als
 * `UHR_SPRUNG_TAGE`), rechnet die App alle Fristen mit dem letzten
 * akzeptierten Zeitpunkt und löscht oder anonymisiert nichts. Das muss der
 * Helfer wissen: Falsch ist meist die Uhr, nicht die Sammlung.
 */
import { useMemo } from "react";
import { EEB_EPOCHE_MS, type EebZeitpunkt } from "@bos/eeb-format/model";
import { uhrWarnung } from "./datenschutz-uhr";

function tag(z: EebZeitpunkt): string {
  return new Date(EEB_EPOCHE_MS + z * 60_000).toLocaleDateString("de-DE", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function UhrWarnung() {
  const w = useMemo(() => uhrWarnung(), []);
  if (!w) return null;
  return (
    <p className="warnung uhr-warnung" role="alert">
      ⚠ Geräteuhr prüfen: Das Gerät zeigt den {tag(w.geraet)}, beim letzten Start war der {tag(w.zuletzt)}. Bis das
      geklärt ist, löscht und anonymisiert die App nichts. Datum falsch? In den Geräteeinstellungen korrigieren.
      Stimmt es, gilt es ab dem nächsten Start (frühestens morgen).
    </p>
  );
}
