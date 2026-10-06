/**
 * Ablage-Hülle, die dem Kern die geprüfte Uhr unterschiebt (Audit Runde 4, R4-D1).
 *
 * Der Kern (`@bos/meldekopf/einsaetze`, Submodul, hier nicht änderbar) rechnet
 * Aufräumfrist (90 Tage ohne Änderung) und Papierkorbfrist (30 Tage) mit
 * `Date.now()` und löscht beim bloßen Lesen endgültig. Eine falsch gestellte
 * Geräteuhr (Werkszustand, leerer Akku, Einrichtung von Hand) hätte so beim
 * Start die laufende Sammlung gelöscht. Die Datenschutzfrist läuft dagegen
 * schon über die geprüfte Uhr (datenschutz-uhr.ts).
 *
 * Solange die Geräteuhr unplausibel weit vorgeht, verschiebt diese Hülle die
 * Zeitstempel `geaendert` und `geloeschtAm` der Sammlungen beim Lesen um den
 * Vorsprung nach vorn und beim Schreiben wieder zurück. Der Kern sieht dann
 * genau das Alter, das die geprüfte Uhr ergibt, und löscht nichts, was nicht
 * wirklich fällig ist; im Speicher stehen weiter ehrliche Zeitstempel. Ist die
 * Uhr plausibel, reicht die Hülle den Text unverändert durch.
 */

import type { Speicherhuelle } from "@bos/meldekopf/einsaetze";
import { uhrVersatzMs } from "./datenschutz-uhr";

/** Speicherschlüssel der Sammlungen im Kern (einsaetze.ts, nicht exportiert). */
const SAMMLUNGEN_SCHLUESSEL = "eeb.einsaetze.v1";

const ZEITFELDER = ["geaendert", "geloeschtAm"] as const;

/** Zeitstempel der Sammlungen um `ms` verschieben; Text, der kein Sammlungs-JSON ist, bleibt wie er ist. */
export function zeitstempelVerschieben(text: string, ms: number): string {
  if (ms === 0) return text;
  try {
    const liste: unknown = JSON.parse(text);
    if (!Array.isArray(liste)) return text;
    for (const s of liste as Record<string, unknown>[]) {
      if (!s || typeof s !== "object") continue;
      for (const f of ZEITFELDER) if (typeof s[f] === "number") s[f] = (s[f] as number) + ms;
    }
    return JSON.stringify(liste);
  } catch {
    return text;
  }
}

export function uhrKorrigierteHuelle(innen: Speicherhuelle): Speicherhuelle {
  /** Der Versatz, mit dem zuletzt gelesen wurde — mit demselben wird zurückgeschrieben. */
  let gelesenMit = 0;
  /** Das letzte Ergebnis je Rohtext, damit große Sammlungen nicht bei jedem Zugriff neu verschoben werden. */
  let verschoben: { roh: string; ms: number; text: string } | null = null;
  return {
    getItem(schluessel: string) {
      const roh = innen.getItem(schluessel);
      if (schluessel !== SAMMLUNGEN_SCHLUESSEL) return roh;
      const ms = uhrVersatzMs();
      gelesenMit = ms;
      if (ms === 0 || roh == null) return roh;
      if (verschoben && verschoben.roh === roh && verschoben.ms === ms) return verschoben.text;
      const text = zeitstempelVerschieben(roh, ms);
      verschoben = { roh, ms, text };
      return text;
    },
    setItem(schluessel: string, wert: string) {
      innen.setItem(schluessel, schluessel === SAMMLUNGEN_SCHLUESSEL ? zeitstempelVerschieben(wert, -gelesenMit) : wert);
    },
  };
}
