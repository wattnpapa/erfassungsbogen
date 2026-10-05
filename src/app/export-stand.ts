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
import { zeitLang } from "./eintrag-zeiten";
import { vermerkFeld, vermerkKennung } from "./einsatz-abgleich";

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
  /**
   * Nur Weitergabe-Stand: Prüfsummen aller Vermerke der Führungsstelle
   * (Abrücken, Zug, Auftrag, Eintreffzeit), die das andere Gerät kennt —
   * gezählt wird, was danach HIER dazukam (Audit Runde 3, R3-W2). Prüfsummen
   * statt Text, damit kein Auftragstext in diesem Komfort-Stand landet.
   * Fehlt bei älteren Ständen; dann zählt der Zeitpunkt.
   */
  vermerke?: string[];
  /** Nur Weitergabe-Stand: wann zuletzt eine Sammlung von dort übernommen wurde. */
  uebernommenAm?: number;
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
        ...(Array.isArray(s.vermerke) ? { vermerke: s.vermerke.filter((v): v is string => typeof v === "string") } : {}),
        ...(typeof s.uebernommenAm === "number" ? { uebernommenAm: s.uebernommenAm } : {}),
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

/**
 * Wann die ganze Sammlung zuletzt über „Einsatz weitergeben / sichern"
 * herausging, und was da in ihr stand. Nach einer Schichtübergabe arbeitete
 * das alte Gerät weiter wie zuvor, ohne Hinweis, dass die Lage jetzt auf
 * einem anderen Gerät geführt wird — ein Nachzügler landete dort und fehlte
 * der neuen Schicht (Audit Runde 2, R2-W5). Getrennt vom Export-Stand: der
 * Teilexport an den Stab ist keine Übergabe der Lage.
 */
const WEITERGABE_SCHLUESSEL = "eeb.weitergabe-stand.v1";

/** Stand der letzten Weitergabe der ganzen Sammlung, oder null (R2-W5). */
export function weitergabeStandLaden(einsatzId: string): ExportStand | null {
  return ablageLaden(WEITERGABE_SCHLUESSEL)[einsatzId] ?? null;
}

/** Nach einer gelungenen Weitergabe der ganzen Sammlung (Sammel-PDF, alle Bögen). */
export function weitergabeVermerken(einsatz: Einsatzsammlung, behalten?: Iterable<string>, jetzt = Date.now()): ExportStand {
  const stand: ExportStand = {
    zeitpunkt: jetzt,
    eintragIds: einsatz.eintraege.map((e) => e.id),
    vermerke: [...vermerkPruefsummen(einsatz.eintraege)],
  };
  const alt = ablageLaden(WEITERGABE_SCHLUESSEL);
  const neu: Ablage = {};
  if (behalten) {
    for (const id of behalten) if (alt[id]) neu[id] = alt[id];
  } else {
    Object.assign(neu, alt);
  }
  neu[einsatz.id] = stand;
  ablageSpeichern(neu, WEITERGABE_SCHLUESSEL);
  return stand;
}

/** FNV-1a (32 Bit) — kurze Prüfsumme einer Vermerk-Kennung, kein Klartext im Stand. */
function pruefsumme(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function vermerkPruefsummen(eintraege: MeldeEintrag[]): Set<string> {
  const p = new Set<string>();
  for (const e of eintraege) for (const v of e.vermerke ?? []) p.add(pruefsumme(vermerkKennung(e.einheitSchluessel, v)));
  return p;
}

/**
 * Nach „Einsatz importieren…": Was von dort kam, hat das andere Gerät schon.
 * Ohne das zählte der Vermerk zurückimportierte Meldungen als „hier neu" und
 * schickte zum erneuten Weitergeben (Audit Runde 3, R3-W2). Nur wenn es schon
 * eine Weitergabe gab; `vermerke` sind Vermerk-Kennungen aus dem Abgleich.
 */
export function weitergabeUmImportErgaenzen(
  einsatzId: string,
  eintragIds: string[],
  vermerke: string[],
  jetzt = Date.now(),
): void {
  const alt = ablageLaden(WEITERGABE_SCHLUESSEL);
  const stand = alt[einsatzId];
  if (!stand) return;
  alt[einsatzId] = {
    ...stand,
    eintragIds: [...new Set([...stand.eintragIds, ...eintragIds])],
    ...(stand.vermerke ? { vermerke: [...new Set([...stand.vermerke, ...vermerke.map(pruefsumme)])] } : {}),
    uebernommenAm: jetzt,
  };
  ablageSpeichern(alt, WEITERGABE_SCHLUESSEL);
}

/** Was seit der Weitergabe HIER an bekannten Einheiten geändert wurde (R3-W2). */
export interface AenderungenSeit {
  anzahl: number;
  /** „Abrücken", „Zug", „Auftrag", „Eintreffzeit" — in dieser Reihenfolge, ohne Doppel. */
  arten: string[];
}

const ART_TEXT: Record<string, string> = { status: "Abrücken", zug: "Zug", notiz: "Auftrag", eintreffzeit: "Eintreffzeit" };

export function aenderungenSeit(eintraege: MeldeEintrag[], stand: ExportStand): AenderungenSeit {
  const bekannt = stand.vermerke ? new Set(stand.vermerke) : null;
  const gezaehlt = new Set<string>();
  const arten = new Set<string>();
  for (const e of eintraege) {
    for (const v of e.vermerke ?? []) {
      const feld = vermerkFeld(v.text);
      if (!feld) continue;
      const p = pruefsumme(vermerkKennung(e.einheitSchluessel, v));
      if (gezaehlt.has(p)) continue; // Folgemeldungen tragen den Verlauf mit
      const neu = bekannt ? !bekannt.has(p) : v.zeit > stand.zeitpunkt;
      if (!neu) continue;
      gezaehlt.add(p);
      arten.add(feld);
    }
  }
  return { anzahl: gezaehlt.size, arten: ["status", "zug", "notiz", "eintreffzeit"].filter((a) => arten.has(a)).map((a) => ART_TEXT[a]!) };
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

/**
 * Zeitpunkt von Export, Lageblatt und Weitergabe — in derselben Form wie auf
 * Karte und Lageblatt: „29.09.2026, 16:44". Vorher „Mo., 16:44", das über
 * eine Woche hinaus mehrdeutig war und neben „28.09.2026, 14:05" stand
 * (Audit Runde 2, R2-A6).
 */
export function exportZeitKurz(zeitpunkt: number): string {
  return zeitLang(zeitpunkt);
}

/**
 * Was die Führungsstelle an diesem Gerät zuletzt „zur Kenntnis genommen" hat:
 * die Meldungen, die beim letzten Tipp auf „Zur Kenntnis genommen" in der
 * Sammlung standen. Alles, was danach kam — neue Einheiten wie Folgemeldungen
 * —, nennt die Einsatzansicht in einer Sammelquittung, auch nach einem
 * Neuladen. Vorher merkte sich die Ansicht nur im Arbeitsspeicher, was seit
 * dem Öffnen dazukam; nach dem Neuladen war die Quittung weg, und eine
 * Folgemeldung mit drei Helfern weniger fiel nur auf, wer jede Karte prüfte
 * (Audit Runde 3, R3-K1).
 *
 * Wie die anderen Stände: Kennungen statt Zeitpunkt (per Sammel-PDF
 * übernommene Meldungen tragen die Empfangszeit des anderen Geräts), keine
 * Personendaten, unter dem `eeb.`-Präfix. Bewusst je Gerät und nicht in der
 * Sammlung: „gesehen" hat die Person an diesem Gerät, nicht die nächste
 * Schicht, die die Lage per „Einsatz importieren…" übernimmt.
 */
const KENNTNIS_SCHLUESSEL = "eeb.kenntnis-stand.v1";

/** Stand der letzten Kenntnisnahme dieses Einsatzes, oder null (noch nie geöffnet). */
export function kenntnisStandLaden(einsatzId: string): ExportStand | null {
  return ablageLaden(KENNTNIS_SCHLUESSEL)[einsatzId] ?? null;
}

/**
 * Alles, was jetzt in der Sammlung steht, gilt als gesehen. Beim ersten
 * Öffnen einer Sammlung gesetzt (sonst stünde beim ersten Mal jede Meldung
 * als neu da) und bei „Zur Kenntnis genommen". `behalten` räumt Stände
 * verschwundener Einsätze weg — wie beim Export-Stand.
 */
export function kenntnisVermerken(einsatz: Einsatzsammlung, behalten?: Iterable<string>, jetzt = Date.now()): ExportStand {
  const stand: ExportStand = { zeitpunkt: jetzt, eintragIds: einsatz.eintraege.map((e) => e.id) };
  const alt = ablageLaden(KENNTNIS_SCHLUESSEL);
  const neu: Ablage = {};
  if (behalten) {
    for (const id of behalten) if (alt[id]) neu[id] = alt[id];
  } else {
    Object.assign(neu, alt);
  }
  neu[einsatz.id] = stand;
  ablageSpeichern(neu, KENNTNIS_SCHLUESSEL);
  return stand;
}
