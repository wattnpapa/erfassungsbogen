/**
 * Stand des letzten Exports je Einsatz — die Grundlage für „nur neue Bögen".
 *
 * Der Meldekopf gibt seine Sammlung laufend an S2/Stab weiter: einmal am
 * Abend, dann wieder am Morgen, dann noch einmal mittags. Bekäme der Stab
 * jedes Mal die ganze Sammlung, müsste er selbst heraussuchen, was seit der
 * letzten Lieferung dazugekommen ist. Deshalb merkt sich die App je Einsatz,
 * was beim letzten Export schon in der Sammlung stand, und kann beim nächsten
 * Mal nur den Rest herausgeben (Rückmeldung Anwender, September 2026).
 *
 * Gemerkt werden die IDs der Meldungen, nicht ein Zeitpunkt: Bögen, die per
 * Sammel-PDF von einem anderen Meldekopf hereinkommen, tragen dessen
 * Empfangszeit — ein Zeitvergleich hielte sie fälschlich für alt. Der
 * Zeitpunkt wird nur für die Anzeige („zuletzt Sa. 21:55") mitgeführt.
 *
 * „Neu" heißt: beim letzten Export noch nicht in der Sammlung. Eine
 * Folgemeldung einer bekannten Einheit ist damit neu (eigener Eintrag), ein
 * bloßer Statuswechsel (abgerückt) nicht — der Stab erfährt davon über den
 * nächsten Gesamtexport.
 *
 * Ablage unter dem `eeb.`-Präfix: der Stand wandert mit der Datensicherung
 * mit und fällt bei „Alle Daten löschen" mit weg. Personendaten stecken keine
 * darin, nur Kennungen und ein Zeitstempel.
 */

import type { Einsatzsammlung, MeldeEintrag } from "@bos/meldekopf/einsaetze";

const SPEICHER_SCHLUESSEL = "eeb.export-stand.v1";
/**
 * Wann zuletzt ein Lageblatt erzeugt wurde, und was da in der Sammlung stand.
 * Getrennt vom Export-Stand: das Lageblatt ist Papier für die Wand, kein
 * Export an den Stab — es darf „nur neue Bögen" nicht verschieben. Bisher
 * merkte sich die App den Druck gar nicht; ob der Aushang aktuell ist, wusste
 * niemand (Audit Runde 2, R2-A3).
 */
const LAGEBLATT_SCHLUESSEL = "eeb.lageblatt-stand.v1";

/** Was der Export herausgeben soll. */
export type ExportUmfang = "alle" | "neue";

export interface ExportStand {
  /** Geräteuhr beim Export (Date.now()) — nur für die Anzeige. */
  zeitpunkt: number;
  /** IDs aller Meldungen, die zu diesem Zeitpunkt in der Sammlung standen. */
  eintragIds: string[];
}

type Ablage = Record<string, ExportStand>;

function speicher(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null; // z. B. Privatmodus/blockierter Speicher
  }
}

function ablageLaden(schluessel = SPEICHER_SCHLUESSEL): Ablage {
  try {
    const roh = speicher()?.getItem(schluessel);
    if (!roh) return {};
    const daten: unknown = JSON.parse(roh);
    if (!daten || typeof daten !== "object" || Array.isArray(daten)) return {};
    const ablage: Ablage = {};
    for (const [einsatzId, stand] of Object.entries(daten as Record<string, unknown>)) {
      if (!stand || typeof stand !== "object") continue;
      const s = stand as Partial<ExportStand>;
      if (typeof s.zeitpunkt !== "number" || !Array.isArray(s.eintragIds)) continue;
      ablage[einsatzId] = {
        zeitpunkt: s.zeitpunkt,
        eintragIds: s.eintragIds.filter((id): id is string => typeof id === "string"),
      };
    }
    return ablage;
  } catch {
    return {}; // beschädigter Eintrag: lieber „noch kein Export" als ein Absturz
  }
}

function ablageSpeichern(ablage: Ablage, schluessel = SPEICHER_SCHLUESSEL): void {
  try {
    speicher()?.setItem(schluessel, JSON.stringify(ablage));
  } catch {
    /* voller oder gesperrter Speicher — der Stand ist Komfort, kein Fachdatum */
  }
}

/** Stand des letzten Exports dieses Einsatzes, oder null, wenn es noch keinen gab. */
export function exportStandLaden(einsatzId: string): ExportStand | null {
  return ablageLaden()[einsatzId] ?? null;
}

/**
 * Nach einem gelungenen Export: alles, was jetzt in der Sammlung steht, gilt
 * als übergeben — auch beim Teilexport, denn der enthielt genau das, was
 * vorher noch fehlte. Stände zu Einsätzen, die es nicht mehr gibt (endgültig
 * gelöscht), fallen bei der Gelegenheit weg; `behalten` nennt die IDs aller
 * noch vorhandenen Einsätze samt Papierkorb.
 */
export function exportVermerken(
  einsatz: Einsatzsammlung,
  behalten?: Iterable<string>,
  jetzt = Date.now(),
): ExportStand {
  const stand: ExportStand = { zeitpunkt: jetzt, eintragIds: einsatz.eintraege.map((e) => e.id) };
  const alt = ablageLaden();
  const neu: Ablage = {};
  if (behalten) {
    for (const id of behalten) if (alt[id]) neu[id] = alt[id];
  } else {
    Object.assign(neu, alt);
  }
  neu[einsatz.id] = stand;
  ablageSpeichern(neu);
  return stand;
}

/** Stand des zuletzt erzeugten Lageblatts dieses Einsatzes, oder null (R2-A3). */
export function lageblattStandLaden(einsatzId: string): ExportStand | null {
  return ablageLaden(LAGEBLATT_SCHLUESSEL)[einsatzId] ?? null;
}

/**
 * Nach einem erzeugten Lageblatt: Zeitpunkt und die Meldungen, die darauf
 * standen. Stände verschwundener Einsätze räumt der nächste Aufruf mit
 * `behalten` weg — wie beim Export-Stand.
 */
export function lageblattVermerken(einsatz: Einsatzsammlung, behalten?: Iterable<string>, jetzt = Date.now()): ExportStand {
  const stand: ExportStand = { zeitpunkt: jetzt, eintragIds: einsatz.eintraege.map((e) => e.id) };
  const alt = ablageLaden(LAGEBLATT_SCHLUESSEL);
  const neu: Ablage = {};
  if (behalten) {
    for (const id of behalten) if (alt[id]) neu[id] = alt[id];
  } else {
    Object.assign(neu, alt);
  }
  neu[einsatz.id] = stand;
  ablageSpeichern(neu, LAGEBLATT_SCHLUESSEL);
  return stand;
}

/** „seitdem 1 neue Meldung" / „seitdem keine neue Meldung" — für Export- und Lageblatt-Zeile. */
export function seitdemText(neu: number): string {
  return neu === 0 ? "seitdem keine neue Meldung" : neu === 1 ? "seitdem 1 neue Meldung" : `seitdem ${neu} neue Meldungen`;
}

/** Meldungen, die beim letzten Export noch nicht in der Sammlung standen — ohne Stand: alle. */
export function neueEintraege(eintraege: MeldeEintrag[], stand: ExportStand | null): MeldeEintrag[] {
  if (!stand) return eintraege;
  const bekannt = new Set(stand.eintragIds);
  return eintraege.filter((e) => !bekannt.has(e.id));
}

/**
 * Die Sammlung auf den gewünschten Umfang zuschneiden. Die Exporte (CSV,
 * Excel, Sammel-PDF) rechnen alle auf einer `Einsatzsammlung`; sie bekommen
 * dieselbe Sammlung mit weniger Einträgen und müssen den Umfang nicht kennen.
 */
export function exportSammlung(einsatz: Einsatzsammlung, umfang: ExportUmfang, stand: ExportStand | null): Einsatzsammlung {
  if (umfang === "alle") return einsatz;
  return { ...einsatz, eintraege: neueEintraege(einsatz.eintraege, stand) };
}

/** „Sa. 21:55" — kurz genug für die Kästchenzeile neben den Export-Knöpfen. */
export function exportZeitKurz(zeitpunkt: number): string {
  return new Date(zeitpunkt).toLocaleString("de-DE", { weekday: "short", hour: "2-digit", minute: "2-digit" });
}
