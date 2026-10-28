/**
 * Papierkorb für einzelne entfernte Meldungen (R17-E2, R17-D6).
 *
 * „Meldung entfernen" nimmt eine Einheit samt Historie, Zeiten, Zug und Auftrag aus der Sammlung; „Rückgängig" lebte nur in
 * der Quittungsleiste im Arbeitsspeicher. Ein Telefon, das die Seite im Hintergrund verwirft, oder die Aufforderung „Neu
 * laden" nach einem App-Update kostete die Meldung endgültig — bei der Handlung mit den meisten Folgen (die Nummern rücken
 * auf). Fahrzeug und Person waren länger rückholbar, ein ganzer Einsatz 30 Tage.
 *
 * Jetzt legt die App jede entfernte Meldung für {@link MELDUNGEN_PAPIERKORB_TAGE} Tage in einen Papierkorb der Sammlung; die
 * Einsatzansicht listet sie unter „Zuletzt entfernte Meldungen" mit „Zurückholen". Neuer Speicherschlüssel
 * `eeb.meldungen-papierkorb.v1` im `localStorage` (vollständige Einträge samt Namen der Personen — deshalb kürzer als der
 * Papierkorb für Einsätze; er wandert mit der Datensicherung und fällt mit „Alle Daten löschen" weg, Präfix `eeb.`).
 */
import type { MeldeEintrag } from "@bos/meldekopf/einsaetze";
import { einsaetzeLaden, einsaetzePapierkorb } from "./einsaetze-lesen";
import { einheitAnzeigename } from "./hilfen";

export const MELDUNGEN_PAPIERKORB_SCHLUESSEL = "eeb.meldungen-papierkorb.v1";
/** So lange bleibt eine entfernte Meldung zum Zurückholen liegen. */
export const MELDUNGEN_PAPIERKORB_TAGE = 7;
/** Mehr als so viele entfernte Meldungen je Sammlung hält der Papierkorb nicht (die ältesten fallen heraus). */
export const MELDUNGEN_PAPIERKORB_MAX = 20;

const TAG_MS = 24 * 60 * 60 * 1000;

/** Eine entfernte Meldung (alle ihre Fassungen) oder eine verworfene Fassung. */
export interface PapierkorbMeldung {
  /** Eindeutig je Entfernen. */
  id: string;
  art: "einheit" | "fassung";
  eintraege: MeldeEintrag[];
  /** Anzeigename der Einheit zum Zeitpunkt des Entfernens. */
  name: string;
  nummer?: number;
  bezug?: string;
  verschoben?: string;
  entferntAm: number;
}

type Stand = Record<string, PapierkorbMeldung[]>;

function speicher(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function laden(): Stand {
  const roh = speicher()?.getItem(MELDUNGEN_PAPIERKORB_SCHLUESSEL);
  if (!roh) return {};
  try {
    const x: unknown = JSON.parse(roh);
    if (!x || typeof x !== "object" || Array.isArray(x)) return {};
    const stand: Stand = {};
    for (const [k, v] of Object.entries(x)) {
      if (!Array.isArray(v)) continue;
      stand[k] = v.filter(
        (m): m is PapierkorbMeldung =>
          !!m && typeof m === "object" && typeof (m as PapierkorbMeldung).id === "string" && Array.isArray((m as PapierkorbMeldung).eintraege) && typeof (m as PapierkorbMeldung).entferntAm === "number",
      );
    }
    return stand;
  } catch {
    return {};
  }
}

function schreiben(stand: Stand, jetzt: number): boolean {
  const s = speicher();
  if (!s) return false;
  // Abgelaufenes und Sammlungen, die es nicht mehr gibt (endgültig gelöscht), fallen heraus.
  const bekannt = new Set([...einsaetzeLaden(), ...einsaetzePapierkorb()].map((x) => x.id));
  const sauber: Stand = {};
  for (const [k, v] of Object.entries(stand)) {
    const frisch = v.filter((m) => jetzt - m.entferntAm <= MELDUNGEN_PAPIERKORB_TAGE * TAG_MS && m.eintraege.length > 0);
    if (bekannt.has(k) && frisch.length > 0) sauber[k] = frisch.slice(-MELDUNGEN_PAPIERKORB_MAX);
  }
  try {
    if (Object.keys(sauber).length === 0) s.removeItem(MELDUNGEN_PAPIERKORB_SCHLUESSEL);
    else s.setItem(MELDUNGEN_PAPIERKORB_SCHLUESSEL, JSON.stringify(sauber));
    return true;
  } catch {
    return false; // Speicher voll: das Entfernen selbst darf daran nicht scheitern
  }
}

/** Die entfernten Meldungen dieser Sammlung, die jüngste zuerst; Abgelaufenes ist schon heraus. */
export function meldungenImPapierkorb(einsatzId: string, jetzt = Date.now()): PapierkorbMeldung[] {
  return (laden()[einsatzId] ?? [])
    .filter((m) => jetzt - m.entferntAm <= MELDUNGEN_PAPIERKORB_TAGE * TAG_MS)
    .sort((a, b) => b.entferntAm - a.entferntAm);
}

/**
 * Die Lücken in den Nummern als Satz für Lageblatt, Sammel-PDF und CSV (R19-A2): „Nr. 2 entfernt 04:21 (Papierkorb) — nicht in
 * der Summe." Wer auf der Wand „1, 3, 4, 5" liest, sieht so, dass Nr. 2 bewusst fehlt. Leer, wenn nichts entfernt wurde.
 */
export function entfernteNummernText(einsatzId: string, jetzt = Date.now()): string {
  const luecken = meldungenImPapierkorb(einsatzId, jetzt)
    .filter((m) => m.art === "einheit" && m.nummer != null)
    .sort((a, b) => a.nummer! - b.nummer!);
  if (luecken.length === 0) return "";
  const uhr = (ms: number) => new Date(ms).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  return `${luecken.map((m) => `Nr. ${m.nummer} entfernt ${uhr(m.entferntAm)}`).join(", ")} (Papierkorb) — nicht in der Summe.`;
}

/** Wann die Meldung endgültig aus dem Papierkorb fällt. */
export function papierkorbFristEnde(m: PapierkorbMeldung): number {
  return m.entferntAm + MELDUNGEN_PAPIERKORB_TAGE * TAG_MS;
}

/** Eine entfernte Meldung in den Papierkorb legen. Rückgabe: ob sie dort liegt (nein bei vollem Speicher). */
export function meldungInPapierkorb(
  einsatzId: string,
  x: { art: "einheit" | "fassung"; eintraege: MeldeEintrag[]; nummer?: number; bezug?: string; verschoben?: string },
  jetzt = Date.now(),
): boolean {
  const erste = x.eintraege[0];
  if (!erste) return false;
  const stand = laden();
  const eintrag: PapierkorbMeldung = {
    id: `${erste.id}@${jetzt}`,
    art: x.art,
    eintraege: x.eintraege,
    name: einheitAnzeigename(erste.bogen.einheit),
    ...(x.nummer != null ? { nummer: x.nummer } : {}),
    ...(x.bezug ? { bezug: x.bezug } : {}),
    ...(x.verschoben ? { verschoben: x.verschoben } : {}),
    entferntAm: jetzt,
  };
  stand[einsatzId] = [...(stand[einsatzId] ?? []), eintrag];
  return schreiben(stand, jetzt);
}

/** Aus dem Papierkorb nehmen (nach dem Zurückholen oder „Endgültig löschen"), über die Kennungen der Einträge oder die `id`. */
export function meldungAusPapierkorb(einsatzId: string, kennung: string | readonly string[], jetzt = Date.now()): void {
  const stand = laden();
  const liste = stand[einsatzId];
  if (!liste) return;
  const ids = typeof kennung === "string" ? new Set([kennung]) : new Set(kennung);
  stand[einsatzId] = liste.filter((m) => !ids.has(m.id) && !m.eintraege.some((e) => ids.has(e.id)));
  schreiben(stand, jetzt);
}
