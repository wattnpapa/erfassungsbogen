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
import { FELDER, STAND_FELDER, standGleichheit, vermerkFeld, vermerkKennung, type Feld, type StandFeld } from "./einsatz-abgleich";
import { MeldeStatus } from "@bos/meldekopf/einsaetze";
import { geltendeJeEinheit } from "./fassung-vorrang";
import { ORT_REGEL, abweichenderOrt } from "./einheiten-tabelle";

/**
 * Stände des Exports je Einsatz UND Format (R4-W2). Bis Runde 4 gab es einen
 * Merker für alle Ausgabewege: CSV und Excel für die eigene Liste, die Weitergabe
 * an die Ablösung und der Nachtrag an den Stab verbrauchten ihn gegenseitig, dem
 * Stab fehlten Einheiten. Jetzt hat jedes Format seinen eigenen Bezugspunkt, und
 * die Weitergabe der ganzen Sammlung an die Ablösung zählt nicht mit (sie hat
 * ihren eigenen Stand, `eeb.weitergabe-stand.v1`). Der alte gemeinsame Merker
 * (`eeb.export-stand.v1`) wird nicht übernommen: lieber einmal zu viel
 * liefern als einem Empfänger etwas vorzuenthalten.
 */
const SPEICHER_SCHLUESSEL = "eeb.export-stand.v2";
const ALTER_SCHLUESSEL = "eeb.export-stand.v1";

/**
 * Kennzeile jeder Tabellendatei (Excel, CSV): zu welcher Lage sie gehört und wann sie erzeugt wurde — wie der
 * Kopf von Lageblatt und Sammel-PDF (R16-A1). Zwei Dateien vom selben Tag lassen sich so ordnen.
 */
export function exportKennzeile(s: Pick<Einsatzsammlung, "name">, erstellt: number = Date.now()): string {
  return `Einsatz „${s.name}“ · Erstellt ${zeitLang(erstellt)}`;
}

/** Ausgabewege mit eigenem Bezugspunkt für „nur neue Bögen". */
export type ExportZiel = "pdf" | "csv" | "csv-detail" | "xlsx";

export const EXPORT_ZIELE: readonly ExportZiel[] = ["pdf", "csv", "csv-detail", "xlsx"];

/** Wie das Format in der Zeile unter dem Kästchen heißt. */
export const EXPORT_ZIEL_NAME: Record<ExportZiel, string> = {
  // „Sammel-PDF" meint auch die Datei von „Einsatz weitergeben / sichern" (an die
  // Ablösung); die Zeile hier betrifft die Lieferung an den Stab (R5-W5).
  pdf: "Sammel-PDF an den Stab",
  csv: "Übersicht als CSV",
  "csv-detail": "Alle Daten als CSV",
  xlsx: "Excel-Liste",
};
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
  /**
   * Zustand je Einheit zum Zeitpunkt des Stands: Prüfsumme von Status samt
   * Abrückzeit, Zug, Auftrag und Eintreffzeit (R4-K1). „Seitdem geändert" heißt
   * damit: der Zustand weicht ab — ein Abrücken und sein „Rückgängig" ergeben
   * nichts Neues, und was ein Import vom anderen Gerät brachte, lässt sich als
   * bekannt buchen (R4-W7). Prüfsummen statt Text, damit kein Auftragstext in
   * diesem Komfort-Stand landet.
   */
  zustand?: Record<string, Partial<Record<StandFeld, string>>>;
  /** Nur Weitergabe-Stand: wann zuletzt eine Sammlung von dort übernommen wurde. */
  uebernommenAm?: number;
  /**
   * Woher der Stand dieses Formats kommt, wenn nicht von einem Export an diesem
   * Gerät: `geraet` = mit der Sammel-PDF vom anderen Gerät übernommen (R5-W6),
   * `weitergabe` = auf Wunsch ab der Weitergabe gerechnet (R5-W5). Fehlt = hier
   * exportiert.
   */
  herkunft?: "geraet" | "weitergabe";
  /**
   * Nur Kenntnis-Stand: durch „Zur Kenntnis genommen" gesetzt (nicht beim ersten
   * Öffnen). Was bis dahin einging, trägt keine „neu"-Marke mehr, auch wenn es
   * jünger als 30 Minuten ist (R4-K7).
   */
  bestaetigt?: boolean;
}

type Ablage = Record<string, ExportStand>;
type ZielAblage = Record<string, Partial<Record<ExportZiel, ExportStand>>>;

function speicher(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null; // z. B. Privatmodus/blockierter Speicher
  }
}

/** Ein Stand aus dem Speicher, oder null, wenn er beschädigt ist. */
function standLesen(stand: unknown): ExportStand | null {
  if (!stand || typeof stand !== "object") return null;
  const s = stand as Partial<ExportStand>;
  if (typeof s.zeitpunkt !== "number" || !Array.isArray(s.eintragIds)) return null;
  let zustand: ExportStand["zustand"];
  if (s.zustand && typeof s.zustand === "object" && !Array.isArray(s.zustand)) {
    zustand = {};
    for (const [schl, felder] of Object.entries(s.zustand)) {
      if (!felder || typeof felder !== "object") continue;
      const f: Partial<Record<StandFeld, string>> = {};
      for (const feld of STAND_FELDER) {
        const w = (felder as Record<string, unknown>)[feld];
        if (typeof w === "string") f[feld] = w;
      }
      zustand[schl] = f;
    }
  }
  return {
    zeitpunkt: s.zeitpunkt,
    eintragIds: s.eintragIds.filter((id): id is string => typeof id === "string"),
    ...(Array.isArray(s.vermerke) ? { vermerke: s.vermerke.filter((v): v is string => typeof v === "string") } : {}),
    ...(zustand ? { zustand } : {}),
    ...(typeof s.uebernommenAm === "number" ? { uebernommenAm: s.uebernommenAm } : {}),
    ...(s.bestaetigt === true ? { bestaetigt: true } : {}),
    ...(s.herkunft === "geraet" || s.herkunft === "weitergabe" ? { herkunft: s.herkunft } : {}),
  };
}

function rohLesen(schluessel: string): Record<string, unknown> {
  try {
    const roh = speicher()?.getItem(schluessel);
    if (!roh) return {};
    const daten: unknown = JSON.parse(roh);
    if (!daten || typeof daten !== "object" || Array.isArray(daten)) return {};
    return daten as Record<string, unknown>;
  } catch {
    return {}; // beschädigter Eintrag: lieber „noch kein Export" als ein Absturz
  }
}

function ablageLaden(schluessel: string): Ablage {
  const ablage: Ablage = {};
  for (const [einsatzId, stand] of Object.entries(rohLesen(schluessel))) {
    const s = standLesen(stand);
    if (s) ablage[einsatzId] = s;
  }
  return ablage;
}

/** `false`, wenn der Speicher voll oder gesperrt ist (R11-O4: „Zur Kenntnis genommen" meldet das). */
function ablageSpeichern(ablage: Ablage | ZielAblage, schluessel: string): boolean {
  try {
    const s = speicher();
    if (!s) return false;
    s.setItem(schluessel, JSON.stringify(ablage));
    return true;
  } catch {
    /* voller oder gesperrter Speicher — der Stand ist Komfort, kein Fachdatum */
    return false;
  }
}

/** Ob der letzte Export-, Lageblatt- oder Weitergabe-Vermerk geschrieben werden konnte (R19-O4). */
let vermerkGelungen = true;

/** Zusatz für die Erfolgsquittung eines Exports, wenn der Vermerk am vollen Speicher scheiterte; sonst leer (R19-O4). */
export function vermerkFehltZusatz(): string {
  // Wer ohne Vermerk exportiert (Nachtrag, Weitergabe als Teil), hat ihn vorher mit vermerkNeuBeginnen() freigegeben.
  return vermerkGelungen ? "" : " Vermerk nicht gespeichert (Speicher voll) — die Übergabe-Liste zeigt „noch nicht“.";
}

/** Vor jedem Export aufrufen: ein früherer Fehlschlag soll nicht an dieser Quittung hängen. */
export function vermerkNeuBeginnen(): void {
  vermerkGelungen = true;
}

function zielAblageLaden(): ZielAblage {
  const ablage: ZielAblage = {};
  for (const [einsatzId, ziele] of Object.entries(rohLesen(SPEICHER_SCHLUESSEL))) {
    if (!ziele || typeof ziele !== "object") continue;
    const je: Partial<Record<ExportZiel, ExportStand>> = {};
    for (const z of EXPORT_ZIELE) {
      const s = standLesen((ziele as Record<string, unknown>)[z]);
      if (s) je[z] = s;
    }
    if (Object.keys(je).length > 0) ablage[einsatzId] = je;
  }
  return ablage;
}

/** Stand des letzten Exports dieses Formats, oder null, wenn es noch keinen gab. */
export function exportStandLaden(einsatzId: string, ziel: ExportZiel): ExportStand | null {
  return zielAblageLaden()[einsatzId]?.[ziel] ?? null;
}

/** Die Stände aller Formate dieses Einsatzes (fehlend = noch nie in diesem Format exportiert). */
export function exportStaendeLaden(einsatzId: string): Partial<Record<ExportZiel, ExportStand>> {
  return zielAblageLaden()[einsatzId] ?? {};
}

/** Zustand je Einheit (Prüfsummen) für einen neuen Stand. */
function zustandVon(eintraege: MeldeEintrag[]): NonNullable<ExportStand["zustand"]> {
  const z: NonNullable<ExportStand["zustand"]> = {};
  for (const k of geltendeJeEinheit(eintraege)) {
    const f: Partial<Record<StandFeld, string>> = {};
    for (const feld of STAND_FELDER) f[feld] = pruefsumme(standGleichheit(feld, k));
    z[k.einheitSchluessel] = f;
  }
  return z;
}

function neuerStand(einsatz: Einsatzsammlung, jetzt: number): ExportStand {
  return { zeitpunkt: jetzt, eintragIds: einsatz.eintraege.map((e) => e.id), zustand: zustandVon(einsatz.eintraege) };
}

/**
 * Nach einem gelungenen Export in diesem Format: alles, was jetzt in der
 * Sammlung steht, gilt in DIESEM Format als übergeben — auch beim Teilexport,
 * denn der enthielt genau das, was vorher noch fehlte. Die anderen Formate
 * bleiben, wie sie waren (R4-W2). Stände zu Einsätzen, die es nicht mehr gibt
 * (endgültig gelöscht), fallen bei der Gelegenheit weg; `behalten` nennt die
 * IDs aller noch vorhandenen Einsätze samt Papierkorb.
 */
export function exportVermerken(
  einsatz: Einsatzsammlung,
  ziel: ExportZiel,
  behalten?: Iterable<string>,
  jetzt = Date.now(),
): ExportStand {
  const stand = neuerStand(einsatz, jetzt);
  const alt = zielAblageLaden();
  const neu: ZielAblage = {};
  if (behalten) {
    for (const id of behalten) if (alt[id]) neu[id] = alt[id];
  } else {
    Object.assign(neu, alt);
  }
  neu[einsatz.id] = { ...neu[einsatz.id], [ziel]: stand };
  vermerkGelungen = ablageSpeichern(neu, SPEICHER_SCHLUESSEL);
  try {
    speicher()?.removeItem(ALTER_SCHLUESSEL); // der gemeinsame Merker der Runden 1–3
  } catch {
    /* Komfort */
  }
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
  const stand = neuerStand(einsatz, jetzt);
  const alt = ablageLaden(LAGEBLATT_SCHLUESSEL);
  const neu: Ablage = {};
  if (behalten) {
    for (const id of behalten) if (alt[id]) neu[id] = alt[id];
  } else {
    Object.assign(neu, alt);
  }
  neu[einsatz.id] = stand;
  vermerkGelungen = ablageSpeichern(neu, LAGEBLATT_SCHLUESSEL);
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
  const stand = neuerStand(einsatz, jetzt);
  const alt = ablageLaden(WEITERGABE_SCHLUESSEL);
  const neu: Ablage = {};
  if (behalten) {
    for (const id of behalten) if (alt[id]) neu[id] = alt[id];
  } else {
    Object.assign(neu, alt);
  }
  neu[einsatz.id] = stand;
  vermerkGelungen = ablageSpeichern(neu, WEITERGABE_SCHLUESSEL);
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

/**
 * Nach „Einsatz importieren…": Was von dort kam, hat das andere Gerät schon.
 * Ohne das zählte der Vermerk zurückimportierte Meldungen als „hier neu" und
 * schickte zum erneuten Weitergeben (Audit Runde 3, R3-W2). Nur wenn es schon
 * eine Weitergabe gab. `bekannt` nennt je Einheit die Felder, deren Wert jetzt
 * dem der Datei entspricht (R4-W7) — auch, was der Abgleich dabei auf diesem
 * Gerät geschrieben hat; `vermerke` (Vermerk-Kennungen) gelten nur noch für
 * Stände ohne Zustand.
 */
export function weitergabeUmImportErgaenzen(
  einsatzId: string,
  eintragIds: string[],
  vermerke: string[],
  bekannt: Record<string, Partial<Record<StandFeld, string>>> = {},
  jetzt = Date.now(),
  /** Hat die Datei etwas gebracht? Eine ältere Datei übernimmt nichts, und der Kopf darf es nicht behaupten (R13-A4). */
  uebernommen = true,
): void {
  const alt = ablageLaden(WEITERGABE_SCHLUESSEL);
  const stand = alt[einsatzId];
  if (!stand) return;
  let zustand = stand.zustand;
  if (zustand) {
    zustand = { ...zustand };
    for (const [schl, felder] of Object.entries(bekannt)) {
      const f: Partial<Record<StandFeld, string>> = { ...zustand[schl] };
      for (const feld of STAND_FELDER) {
        const w = felder[feld];
        if (w !== undefined) f[feld] = pruefsumme(w);
      }
      zustand[schl] = f;
    }
  }
  alt[einsatzId] = {
    ...stand,
    eintragIds: [...new Set([...stand.eintragIds, ...eintragIds])],
    ...(stand.vermerke ? { vermerke: [...new Set([...stand.vermerke, ...vermerke.map(pruefsumme)])] } : {}),
    ...(zustand ? { zustand } : {}),
    ...(uebernommen ? { uebernommenAm: jetzt } : {}),
  };
  ablageSpeichern(alt, WEITERGABE_SCHLUESSEL);
}

/** Was seit dem Stand HIER an bekannten Einheiten geändert wurde (R3-W2, R4-K1). */
export interface AenderungenSeit {
  anzahl: number;
  /**
   * „Abrücken", „Wieder anwesend", „Zug", „Auftrag", „Eintreffzeit", „Fassung" —
   * in dieser Reihenfolge, ohne Doppel.
   */
  arten: string[];
  /** Schlüssel der betroffenen Einheiten. */
  einheiten: string[];
  /** Je Einheit die Arten der Änderung (gleiche Wörter und Reihenfolge wie `arten`). */
  jeEinheit: Record<string, string[]>;
}

const ART_TEXT: Record<Feld, string> = { status: "Abrücken", zug: "Zug", notiz: "Auftrag", eintreffzeit: "Eintreffzeit" };
const ART_FASSUNG = "Fassung";
const ART_WIEDER_DA = "Wieder anwesend";
/** Reihenfolge der Arten in „2 Änderungen (Zug, Auftrag)". */
const ART_REIHE = [ART_TEXT.status, "Zusammenführen", ART_WIEDER_DA, ART_TEXT.zug, ART_TEXT.notiz, ART_TEXT.eintreffzeit, ART_FASSUNG];

/** Das Wort für einen Statuswechsel — in die Richtung, in die er ging (R5-K1: „Abrücken" für zwei Zurückgekehrte war falsch). */
function statusArt(status: MeldeStatus): string {
  if (status === MeldeStatus.ABGERUECKT) return ART_TEXT.status;
  if (status === MeldeStatus.AUFGEGANGEN) return "Zusammenführen";
  return ART_WIEDER_DA;
}

/**
 * Änderungen an bekannten Einheiten seit einem Stand. Stände mit Zustand
 * vergleichen den Zustand der geltenden Fassung je Einheit — ein „Rückgängig"
 * nimmt die Änderung damit wirklich zurück. Ältere Stände (ohne Zustand)
 * zählen die Vermerke der Führungsstelle.
 *
 * Auch der Wechsel der geltenden Fassung zählt („Fassung", R5-W1): wer nach
 * einem Export den nachgereichten Bogen statt der Schnellerfassung gelten
 * lässt, hat die Lage geändert. Eine NEUE Fassung ist dagegen eine neue
 * Meldung und wird dort gezählt, nicht hier.
 */
export function aenderungenSeit(eintraege: MeldeEintrag[], stand: ExportStand): AenderungenSeit {
  const arten = new Set<string>();
  const jeEinheit: Record<string, Set<string>> = {};
  const einheiten = new Set<string>();
  let anzahl = 0;
  const vermerke = (schl: string, art: string) => {
    arten.add(art);
    einheiten.add(schl);
    (jeEinheit[schl] ??= new Set()).add(art);
  };
  if (stand.zustand) {
    const bekannteIds = new Set(stand.eintragIds);
    for (const k of geltendeJeEinheit(eintraege)) {
      const z = stand.zustand[k.einheitSchluessel];
      if (!z) continue; // neue Einheit: zählt als neue Meldung, nicht als Änderung
      for (const feld of STAND_FELDER) {
        const bekannt = z[feld];
        if (bekannt === undefined || bekannt === pruefsumme(standGleichheit(feld, k))) continue;
        // Eine Fassung, die der Stand nicht kannte, ist eine neue Meldung.
        if (feld === "fassung" && !bekannteIds.has(k.id)) continue;
        anzahl++;
        vermerke(k.einheitSchluessel, feld === "fassung" ? ART_FASSUNG : feld === "status" ? statusArt(k.status) : ART_TEXT[feld]);
      }
    }
  } else {
    const bekannt = stand.vermerke ? new Set(stand.vermerke) : null;
    const gezaehlt = new Set<string>();
    for (const e of eintraege) {
      for (const v of e.vermerke ?? []) {
        const feld = vermerkFeld(v.text);
        if (!feld) continue;
        const p = pruefsumme(vermerkKennung(e.einheitSchluessel, v));
        if (gezaehlt.has(p)) continue; // Folgemeldungen tragen den Verlauf mit
        const neu = bekannt ? !bekannt.has(p) : v.zeit > stand.zeitpunkt;
        if (!neu) continue;
        gezaehlt.add(p);
        vermerke(e.einheitSchluessel, feld === "status" && /^Wieder als anwesend/.test(v.text) ? ART_WIEDER_DA : ART_TEXT[feld]);
      }
    }
    anzahl = gezaehlt.size;
  }
  return {
    anzahl,
    arten: ART_REIHE.filter((a) => arten.has(a)),
    einheiten: [...einheiten],
    jeEinheit: Object.fromEntries(Object.entries(jeEinheit).map(([schl, a]) => [schl, ART_REIHE.filter((x) => a.has(x))])),
  };
}

/** „1 Änderung (Abrücken)" / „2 Änderungen (Zug, Auftrag)" — leer ohne Änderung. */
export function aenderungText(a: AenderungenSeit): string {
  if (a.anzahl === 0) return "";
  return `${a.anzahl === 1 ? "1 Änderung" : `${a.anzahl} Änderungen`} (${a.arten.join(", ")})`;
}

/**
 * „seitdem 1 neue Meldung" / „seitdem keine neue Meldung" — für Export- und
 * Lageblatt-Zeile. Mit `aend` zählen auch Änderungen an bekannten Einheiten
 * mit („seitdem 1 neue Meldung und 1 Änderung (Abrücken)", R4-K1): Ein Blatt,
 * auf dem eine abgerückte Einheit noch steht, ist nicht „unverändert".
 */
export function seitdemText(neu: number, aend?: AenderungenSeit): string {
  const a = aend ? aenderungText(aend) : "";
  if (neu === 0) return a ? `seitdem ${a}` : "seitdem keine neue Meldung";
  const m = neu === 1 ? "1 neue Meldung" : `${neu} neue Meldungen`;
  return a ? `seitdem ${m} und ${a}` : `seitdem ${m}`;
}

/** Meldungen, die beim letzten Export noch nicht in der Sammlung standen — ohne Stand: alle. */
export function neueEintraege(eintraege: MeldeEintrag[], stand: ExportStand | null): MeldeEintrag[] {
  if (!stand) return eintraege;
  const bekannt = new Set(stand.eintragIds);
  // Eine ältere Fassung, die erst nach dem Export eintraf und nur in der Historie
  // liegt, ändert die Lage nicht: Sie zählte als „neuer Bogen" und brachte ihre
  // alte Stärke in den Nachtrag (Audit Runde 6, R6-W1).
  const geltend = new Set(geltendeJeEinheit(eintraege).map((e) => e.id));
  return eintraege.filter((e) => !bekannt.has(e.id) && geltend.has(e.id));
}

/**
 * „Neu seit der letzten Kenntnisnahme": die neuen Meldungen ohne eigene Umbauten (Aufteilen, Zusammenführen) und
 * ohne abgerückte Einheiten. Wer abgerückt ist, ist abgefertigt — die Startseite zählte ihn noch als neu, die
 * Einsatzansicht nach dem Abrücken nicht mehr, und beim Wiederöffnen stand er wieder da (R13-W2).
 */
export function neuZurKenntnis(eintraege: MeldeEintrag[], stand: ExportStand | null): MeldeEintrag[] {
  return neueEintraege(eintraege, stand).filter(
    (e) => e.quelle !== "aufteilung" && e.quelle !== "zusammenfuehrung" && !e.angaben?.kennzeichnung && e.status !== MeldeStatus.ABGERUECKT,
  );
}

/**
 * Was ein Nachtrag seit dem Stand enthält: die neuen Meldungen und die geltende
 * Fassung jeder Einheit, an der sich seither etwas geändert hat (Abrücken, Zug,
 * Auftrag, Eintreffzeit). Ohne das ginge ein Abrücken nie in einen Teilexport
 * (R4-K1): Die Einheit stünde beim Stab weiter als anwesend in der Lage.
 */
export function nachtragEintraege(eintraege: MeldeEintrag[], stand: ExportStand | null): MeldeEintrag[] {
  if (!stand) return eintraege;
  const neu = neueEintraege(eintraege, stand);
  const geaendert = new Set(aenderungenSeit(eintraege, stand).einheiten);
  if (geaendert.size === 0) return neu;
  const ids = new Set(neu.map((e) => e.id));
  for (const k of geltendeJeEinheit(eintraege)) if (geaendert.has(k.einheitSchluessel)) ids.add(k.id);
  return eintraege.filter((e) => ids.has(e.id));
}

/** Warum eine Einheit im Nachtrag steht (R5-W7). */
export interface NachtragGrund {
  /** Die Einheit war beim Stand noch nicht in der Sammlung — nur ihre Kräfte kommen zur Summe der letzten Lieferung dazu. */
  neu: boolean;
  /** „neu", „Folgemeldung", „Zug", „Auftrag", „Abrücken", „Wieder anwesend", „Eintreffzeit", „Fassung". */
  gruende: string[];
}

declare module "@bos/meldekopf/einsaetze" {
  interface Einsatzsammlung {
    /**
     * Nur an einer für den Export zugeschnittenen Sammlung (Nachtrag, „nur neue
     * Bögen"): je Einheit, warum sie dabei ist. Wird nie gespeichert und nicht
     * in die Sammel-PDF eingebettet.
     */
    nachtragGruende?: Record<string, NachtragGrund>;
    /**
     * Nur an einer zugeschnittenen Sammlung: Einheiten, deren Bogen einen anderen
     * Einsatz nennt (R5-K5), auf Grundlage der GANZEN Sammlung gerechnet — ein
     * Nachtrag mit zwei Einheiten hätte sonst keine Vergleichsbasis. Nie gespeichert.
     */
    fremdeOrte?: Record<string, string>;
  }
}

/**
 * Einheiten, deren Bogen einen Ort/Auftrag nennt, der nicht zur Lage passt
 * (R5-K5), als Schlüssel → Text des Bogens. Dieselbe Regel wie die Marke „Anderer
 * Einsatz?" an der Karte; Lageblatt, Sammel-PDF, CSV und Excel tragen sie jetzt
 * ebenfalls. `fremdeOrte` der zugeschnittenen Sammlung geht vor.
 */
export function ortHinweise(s: Einsatzsammlung, ganz: readonly MeldeEintrag[] = s.eintraege): Record<string, string> {
  if (s.fremdeOrte) return s.fremdeOrte;
  const aus: Record<string, string> = {};
  for (const e of geltendeJeEinheit(s.eintraege)) {
    const ort = abweichenderOrt(e, s, ganz);
    if (ort != null) aus[e.einheitSchluessel] = ort;
  }
  return aus;
}

/** Der Hinweis in Worten, für Zellen und Zeilen der Ausgaben. */
export function ortHinweisText(ort: string): string {
  return `Anderer Einsatz? Bogen nennt: „${ort}“ – passt das zu dieser Lage? ${ORT_REGEL} Zählt trotzdem mit.`;
}

/**
 * Je Einheit des Nachtrags der Grund, warum sie dabei ist (R5-W7). Ohne den Grund
 * sah eine Einheit mit bloßer Zugänderung wie eine neue Meldung aus, und wer die
 * „Summe Nachtrag" auf die bisherige Summe addierte, zählte ihre Kräfte doppelt.
 */
export function nachtragGruende(eintraege: MeldeEintrag[], stand: ExportStand): Record<string, NachtragGrund> {
  const bekannteIds = new Set(stand.eintragIds);
  const bekannteEinheiten = new Set(eintraege.filter((e) => bekannteIds.has(e.id)).map((e) => e.einheitSchluessel));
  const aend = aenderungenSeit(eintraege, stand);
  const aus: Record<string, NachtragGrund> = {};
  for (const k of geltendeJeEinheit(eintraege)) {
    const schl = k.einheitSchluessel;
    const arten = aend.jeEinheit[schl] ?? [];
    if (!bekannteEinheiten.has(schl)) {
      aus[schl] = { neu: true, gruende: ["neu"] };
    } else if (!bekannteIds.has(k.id) || arten.length > 0) {
      aus[schl] = { neu: false, gruende: [...(bekannteIds.has(k.id) ? [] : [k.angaben?.kennzeichnung ? "Kennzeichnung" : "Folgemeldung"]), ...arten] };
    }
  }
  return aus;
}

/** „neu" / „geändert: Zug, Auftrag" — der Grund als Wort für eine Zeile (R5-W7). */
export function nachtragGrundText(g: NachtragGrund | undefined): string {
  if (!g) return "";
  return g.neu ? "neu" : `geändert: ${g.gruende.join(", ")}`;
}

/**
 * Die Sammlung auf den gewünschten Umfang zuschneiden. Die Exporte (CSV,
 * Excel, Sammel-PDF) rechnen alle auf einer `Einsatzsammlung`; sie bekommen
 * dieselbe Sammlung mit weniger Einträgen und müssen den Umfang nicht kennen.
 * Beim Nachtrag trägt sie dazu den Bezugszeitpunkt (`nachtragSeit`) und je
 * Einheit den Grund (`nachtragGruende`), damit jedes Format Zeilen und
 * Summen gleich kennzeichnet (R5-W7, R5-K6).
 */
export function exportSammlung(einsatz: Einsatzsammlung, umfang: ExportUmfang, stand: ExportStand | null): Einsatzsammlung {
  if (umfang === "alle") return einsatz;
  const eintraege = nachtragEintraege(einsatz.eintraege, stand);
  const fremdeOrte = ortHinweise({ ...einsatz, eintraege }, einsatz.eintraege);
  if (!stand) return { ...einsatz, eintraege, fremdeOrte };
  return { ...einsatz, eintraege, fremdeOrte, nachtragSeit: stand.zeitpunkt, nachtragGruende: nachtragGruende(einsatz.eintraege, stand) };
}

/**
 * Der Namensteil einer Lieferung — für alle Formate gleich (R5-W8):
 * `nachtrag` für einen Nachtrag, `erste-lieferung` für
 * „nur neue Bögen" ohne Bezugspunkt (das ist die ganze Lage und hieß bisher
 * wie die Gesamtdatei), sonst nichts.
 */
export function lieferungsMarke(umfang: ExportUmfang, stand: ExportStand | null | undefined): string {
  if (umfang !== "neue") return "";
  // Der Bezugspunkt („seit …") steht in der Datei; im Namen steht nur der Zeitstempel der Erzeugung (R18-W6).
  return stand ? "nachtrag" : "erste-lieferung";
}

/**
 * Stände vom anderen Gerät übernehmen (R5-W6): Die Sammel-PDF der Weitergabe
 * trägt die Stände der Exporte mit (nur Kennungen, Prüfsummen und Zeitpunkt —
 * keine Personendaten). Auf der Ablösung wüsste sonst der erste Nachtrag nicht,
 * was der Stab schon hat, und lieferte die ganze Lage noch einmal. Je Format
 * gilt die Vereinigung: Was eines der Geräte geliefert hat, hat der Stab; je
 * Einheit zählt der Zustand des jüngeren Stands.
 */
export function exportStaendeUebernehmen(einsatzId: string, staende: unknown, behalten?: Iterable<string>): void {
  if (!staende || typeof staende !== "object" || Array.isArray(staende)) return;
  const alt = zielAblageLaden();
  const je = { ...(alt[einsatzId] ?? {}) };
  let geaendert = false;
  for (const z of EXPORT_ZIELE) {
    const eingang = standLesen((staende as Record<string, unknown>)[z]);
    if (!eingang) continue;
    const hier = je[z];
    if (!hier) {
      je[z] = { ...eingang, herkunft: "geraet" };
    } else {
      const juenger = eingang.zeitpunkt > hier.zeitpunkt;
      const [spaeter, frueher] = juenger ? [eingang, hier] : [hier, eingang];
      je[z] = {
        ...hier,
        zeitpunkt: spaeter.zeitpunkt,
        eintragIds: [...new Set([...hier.eintragIds, ...eingang.eintragIds])],
        ...(hier.zustand || eingang.zustand ? { zustand: { ...frueher.zustand, ...spaeter.zustand } } : {}),
        ...(juenger ? { herkunft: "geraet" as const } : hier.herkunft ? { herkunft: hier.herkunft } : {}),
      };
    }
    geaendert = true;
  }
  if (!geaendert) return;
  const neu: ZielAblage = {};
  if (behalten) {
    for (const id of behalten) if (alt[id]) neu[id] = alt[id];
  } else {
    Object.assign(neu, alt);
  }
  neu[einsatzId] = je;
  ablageSpeichern(neu, SPEICHER_SCHLUESSEL);
}

/**
 * Das Format ab der letzten Weitergabe rechnen (R5-W5): Der Stab hat die
 * Sammel-PDF der Weitergabe ebenfalls bekommen. Auf ausdrücklichen Wunsch — die
 * Weitergabe zählt sonst nicht als Lieferung an den Stab (R4-W2). Null, wenn es
 * keine Weitergabe gibt.
 */
export function exportStandAusWeitergabe(einsatzId: string, ziel: ExportZiel, behalten?: Iterable<string>): ExportStand | null {
  const w = weitergabeStandLaden(einsatzId);
  if (!w) return null;
  const alt = zielAblageLaden();
  const neu: ZielAblage = {};
  if (behalten) {
    for (const id of behalten) if (alt[id]) neu[id] = alt[id];
  } else {
    Object.assign(neu, alt);
  }
  const stand: ExportStand = { zeitpunkt: w.zeitpunkt, eintragIds: [...w.eintragIds], ...(w.zustand ? { zustand: w.zustand } : {}), herkunft: "weitergabe" };
  neu[einsatzId] = { ...neu[einsatzId], [ziel]: stand };
  ablageSpeichern(neu, SPEICHER_SCHLUESSEL);
  return stand;
}

/**
 * Gibt es von dieser Sammlung irgendeinen Export, ein Lageblatt oder eine
 * Weitergabe? Für die Rückfragen vor dem endgültigen Löschen: Sie sagen, wenn
 * es keine Kopie gibt (Audit Runde 4, R4-D5).
 */
export function exportVorhanden(einsatzId: string): boolean {
  return (
    Object.keys(exportStaendeLaden(einsatzId)).length > 0 ||
    lageblattStandLaden(einsatzId) != null ||
    weitergabeStandLaden(einsatzId) != null
  );
}

/** Satz für Rückfragen vor dem Löschen: was von dieser Sammlung schon hinausging (R19-W10). */
export function exportStandSatz(einsatzId: string): string {
  const zeiten = [...Object.values(exportStaendeLaden(einsatzId)), lageblattStandLaden(einsatzId), weitergabeStandLaden(einsatzId)]
    .filter((s): s is ExportStand => s != null)
    .map((s) => s.zeitpunkt);
  return zeiten.length === 0 ? "Noch nichts exportiert oder übergeben." : `Zuletzt herausgegangen: ${exportZeitKurz(Math.max(...zeiten))}.`;
}

/**
 * Wann zuletzt ein Export, ein Lageblatt oder eine Weitergabe dieser Sammlung
 * eine der Meldungen enthielt — `null`, wenn keine in irgendeinem Stand steht.
 * Für die Rückfrage vor dem Entfernen: Sie sagt, ob es von der Meldung noch
 * eine Kopie gibt (Audit Runde 4, R4-D3).
 */
export function letzterStandMit(einsatzId: string, eintragIds: readonly string[]): number | null {
  const ids = new Set(eintragIds);
  const staende: (ExportStand | null | undefined)[] = [
    ...Object.values(exportStaendeLaden(einsatzId)),
    lageblattStandLaden(einsatzId),
    weitergabeStandLaden(einsatzId),
  ];
  let zuletzt: number | null = null;
  for (const st of staende) {
    if (!st || !st.eintragIds.some((id) => ids.has(id))) continue;
    if (zuletzt == null || st.zeitpunkt > zuletzt) zuletzt = st.zeitpunkt;
  }
  return zuletzt;
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
export function kenntnisVermerken(
  einsatz: Einsatzsammlung,
  behalten?: Iterable<string>,
  jetzt = Date.now(),
  /** true: jemand hat „Zur Kenntnis genommen" getippt (R4-K7). */
  bestaetigt = false,
): ExportStand {
  return kenntnisVermerkenGeprueft(einsatz, behalten, jetzt, bestaetigt).stand;
}

/** Wie {@link kenntnisVermerken}, sagt aber, ob der Stand wirklich im Speicher steht (R11-O4). */
export function kenntnisVermerkenGeprueft(
  einsatz: Einsatzsammlung,
  behalten?: Iterable<string>,
  jetzt = Date.now(),
  bestaetigt = false,
): { stand: ExportStand; gespeichert: boolean } {
  const stand: ExportStand = { zeitpunkt: jetzt, eintragIds: einsatz.eintraege.map((e) => e.id), ...(bestaetigt ? { bestaetigt: true } : {}) };
  const alt = ablageLaden(KENNTNIS_SCHLUESSEL);
  const neu: Ablage = {};
  if (behalten) {
    for (const id of behalten) if (alt[id]) neu[id] = alt[id];
  } else {
    Object.assign(neu, alt);
  }
  neu[einsatz.id] = stand;
  return { stand, gespeichert: ablageSpeichern(neu, KENNTNIS_SCHLUESSEL) };
}

/**
 * Den Stand vor „Zur Kenntnis genommen" zurückschreiben (Rückgängig, R11-D1); `null` entfernt den Eintrag. Liefert
 * `false`, wenn der Speicher voll oder gesperrt ist.
 */
export function kenntnisWiederherstellen(einsatzId: string, stand: ExportStand | null, behalten?: Iterable<string>): boolean {
  const alt = ablageLaden(KENNTNIS_SCHLUESSEL);
  const neu: Ablage = {};
  if (behalten) {
    for (const id of behalten) if (alt[id]) neu[id] = alt[id];
  } else {
    Object.assign(neu, alt);
  }
  if (stand) neu[einsatzId] = stand;
  else delete neu[einsatzId];
  return ablageSpeichern(neu, KENNTNIS_SCHLUESSEL);
}
