/**
 * Verdrahtung der Einsatz-Sammlung mit dem Browser-Speicher.
 *
 * Die Sammlung selbst (`einsaetze.ts`) kennt nur eine hineingereichte Hülle —
 * nach ADR-003 wandert sie in den geteilten Kern und darf dort keine
 * Browser-Globals anfassen. Diese Datei bleibt im Produkt und ist die einzige
 * Stelle, die `localStorage` mit ihr verbindet. Ebenso reicht sie die Uhr für
 * die Datenschutzfrist herein (siehe datenschutz-uhr.ts).
 */

import { datenschutzUhrSetzen, speicherhuelleSetzen, type Speicherhuelle } from "@bos/meldekopf/einsaetze";
import { datenschutzZeitpunkt } from "./datenschutz-uhr";
import { istNativ } from "./nativ";
import { wertvolleDaten } from "./sicherung";

/** `localStorage`, sofern erreichbar — im Privatmodus oder bei blockiertem
 *  Speicher wirft schon der Zugriff auf die Eigenschaft. */
export function browserSpeicherhuelle(): Speicherhuelle | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/** Einmal beim Start aufrufen, bevor die Sammlung gelesen wird. */
export function speicherVerdrahten(): void {
  speicherhuelleSetzen(browserSpeicherhuelle());
  datenschutzUhrSetzen(() => datenschutzZeitpunkt());
}

// ------------------------------------------------- Dauerhafter Speicher

/**
 * Browser dürfen Website-Daten räumen, wenn der Gerätespeicher knapp wird;
 * Safari räumt nicht abgelegte Seiten nach längerer Nichtnutzung. Trifft das
 * Vorlagen oder eine ruhende Sammlung, ist alles weg — es gibt keinen Server,
 * der es noch hätte. Die App bittet darum um dauerhaften Speicher
 * (`navigator.storage.persist`) und zeigt das Ergebnis in der Datensicherung
 * (Audit Runde 2, R2-O6).
 *
 * Nur im Web: In der nativen App gehört der Speicher der App selbst, dort
 * räumt kein Browser. `null` = nicht feststellbar (alter Browser, nativ).
 */
function speicherManager(): StorageManager | null {
  if (istNativ()) return null;
  try {
    return globalThis.navigator?.storage ?? null;
  } catch {
    return null;
  }
}

/** Hält der Browser den Speicher dieser App dauerhaft vor? */
export async function speicherDauerhaft(): Promise<boolean | null> {
  const m = speicherManager();
  if (!m?.persisted) return null;
  try {
    return await m.persisted();
  } catch {
    return null;
  }
}

/** Um dauerhaften Speicher bitten (Firefox fragt dabei nach, Chrome entscheidet selbst). */
export async function dauerhaftenSpeicherAnfragen(): Promise<boolean | null> {
  const m = speicherManager();
  if (!m?.persist) return null;
  try {
    if (await m.persisted?.()) return true;
    return await m.persist();
  } catch {
    return null;
  }
}

/**
 * Beim Start: nur bitten, wenn hier etwas liegt, dessen Verlust wehtäte
 * (laufende Sammlungen mit Meldungen, Vorlagen). Wer die Seite nur ansieht,
 * bekommt in Firefox keine Rückfrage, bevor er etwas erfasst hat.
 */
export function dauerhaftWennWertvoll(): void {
  if (!wertvolleDaten()) return;
  void dauerhaftenSpeicherAnfragen();
}
