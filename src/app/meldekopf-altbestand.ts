/**
 * Einsatz-Sammlungen aus der Zeit, als der Erfassungsbogen selbst sammelte (bis 2026-11).
 *
 * Seit dem 2026-11-09 sammelt die eigene Meldekopf-App (meldekopf-app.ts). Was auf einem Gerät noch
 * unter `eeb.einsaetze.v1` liegt, zeigt die Startseite als Altbestand: mit dem Weg hinüber (Datensicherung,
 * die die Meldekopf-App einspielt) und dem Weg weg (Löschen mit Rückfrage). Gelesen wird über den Kern
 * (`einsaetze-lesen.ts`), damit dessen Aufräumfrist ruhender Sammlungen und die Datenschutzfrist je
 * Meldung weiter greifen, auch wenn diese App die Sammlungen nicht mehr zeigt.
 */

import { einsaetzeLaden, einsaetzeLesenZuruecksetzen, einsaetzePapierkorb } from "./einsaetze-lesen";

/**
 * Alle Schlüssel, die nur zur Sammlung gehörten. Datensicherung und „Alle Daten löschen“ erfassen sie
 * ohnehin über das Präfix `eeb.`; diese Liste braucht nur das gezielte Löschen des Altbestands.
 */
export const SAMMLUNGS_SCHLUESSEL: readonly string[] = [
  "eeb.einsaetze.v1",
  "eeb.export-stand.v2",
  "eeb.export-stand.v1",
  "eeb.lageblatt-stand.v1",
  "eeb.weitergabe-stand.v1",
  "eeb.kenntnis-stand.v1",
  "eeb.entfernt.v1",
  "eeb.aufgeraeumt.v1",
  "eeb.letzterEinsatz.v1",
  "eeb.lagebeginn.v1",
  "eeb.lagefunkruf.v1",
  "eeb.lagestufe.v1",
  "eeb.meldungen-papierkorb.v1",
  "eeb.abschluss.v1",
  "eeb.widersprueche.v1",
  "eeb.nummernhinweis.v1",
  "eeb.einheiten-ansicht",
  "eeb.einheiten-tabelle-alle-spalten",
  "eeb.schnellOrganisation.v1",
];

export interface Altbestand {
  /** Aktive Sammlungen. */
  sammlungen: number;
  /** Sammlungen im Papierkorb. */
  papierkorb: number;
  /** Meldungen über alle Sammlungen, Papierkorb eingeschlossen. */
  meldungen: number;
}

/** Was noch auf dem Gerät liegt; `null`, wenn nichts. */
export function altbestandLesen(): Altbestand | null {
  const aktiv = einsaetzeLaden();
  const korb = einsaetzePapierkorb();
  if (aktiv.length + korb.length === 0) return null;
  return {
    sammlungen: aktiv.length,
    papierkorb: korb.length,
    meldungen: [...aktiv, ...korb].reduce((n, s) => n + s.eintraege.length, 0),
  };
}

/** Satz für die Startseite: „2 Einsatz-Sammlungen mit 14 Meldungen (dazu 1 im Papierkorb)“. */
export function altbestandText(a: Altbestand): string {
  const teile = [
    a.sammlungen > 0 ? `${a.sammlungen} ${a.sammlungen === 1 ? "Einsatz-Sammlung" : "Einsatz-Sammlungen"}` : "",
    a.sammlungen === 0 && a.papierkorb > 0 ? `${a.papierkorb} ${a.papierkorb === 1 ? "Einsatz-Sammlung" : "Einsatz-Sammlungen"} im Papierkorb` : "",
  ].filter(Boolean);
  const korb = a.sammlungen > 0 && a.papierkorb > 0 ? ` (dazu ${a.papierkorb} im Papierkorb)` : "";
  return `${teile.join("")} mit ${a.meldungen} ${a.meldungen === 1 ? "Meldung" : "Meldungen"}${korb}`;
}

/** Den Altbestand vom Gerät löschen. Liefert die Zahl der entfernten Einträge. Wirft bei gesperrtem Speicher. */
export function altbestandLoeschen(speicher: Storage = localStorage): number {
  let n = 0;
  for (const k of SAMMLUNGS_SCHLUESSEL) {
    if (speicher.getItem(k) == null) continue;
    speicher.removeItem(k);
    n++;
  }
  einsaetzeLesenZuruecksetzen();
  return n;
}
