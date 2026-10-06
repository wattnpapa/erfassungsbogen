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
import { FELDER, feldGleichheit, vermerkFeld, vermerkKennung, type Feld } from "./einsatz-abgleich";
import { geltendeJeEinheit } from "./fassung-vorrang";

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

/** Ausgabewege mit eigenem Bezugspunkt für „nur neue Bögen". */
export type ExportZiel = "pdf" | "csv" | "csv-detail" | "xlsx";

export const EXPORT_ZIELE: readonly ExportZiel[] = ["pdf", "csv", "csv-detail", "xlsx"];

/** Wie das Format in der Zeile unter dem Kästchen heißt. */
export const EXPORT_ZIEL_NAME: Record<ExportZiel, string> = {
  pdf: "Sammel-PDF",
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
  zustand?: Record<string, Partial<Record<Feld, string>>>;
  /** Nur Weitergabe-Stand: wann zuletzt eine Sammlung von dort übernommen wurde. */
  uebernommenAm?: number;
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
      const f: Partial<Record<Feld, string>> = {};
      for (const feld of FELDER) {
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

function ablageSpeichern(ablage: Ablage | ZielAblage, schluessel: string): void {
  try {
    speicher()?.setItem(schluessel, JSON.stringify(ablage));
  } catch {
    /* voller oder gesperrter Speicher — der Stand ist Komfort, kein Fachdatum */
  }
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
    const f: Partial<Record<Feld, string>> = {};
    for (const feld of FELDER) f[feld] = pruefsumme(feldGleichheit(feld, k));
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
  ablageSpeichern(neu, SPEICHER_SCHLUESSEL);
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
  const stand = neuerStand(einsatz, jetzt);
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
  bekannt: Record<string, Partial<Record<Feld, string>>> = {},
  jetzt = Date.now(),
): void {
  const alt = ablageLaden(WEITERGABE_SCHLUESSEL);
  const stand = alt[einsatzId];
  if (!stand) return;
  let zustand = stand.zustand;
  if (zustand) {
    zustand = { ...zustand };
    for (const [schl, felder] of Object.entries(bekannt)) {
      const f: Partial<Record<Feld, string>> = { ...zustand[schl] };
      for (const feld of FELDER) {
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
    uebernommenAm: jetzt,
  };
  ablageSpeichern(alt, WEITERGABE_SCHLUESSEL);
}

/** Was seit dem Stand HIER an bekannten Einheiten geändert wurde (R3-W2, R4-K1). */
export interface AenderungenSeit {
  anzahl: number;
  /** „Abrücken", „Zug", „Auftrag", „Eintreffzeit" — in dieser Reihenfolge, ohne Doppel. */
  arten: string[];
  /** Schlüssel der betroffenen Einheiten. */
  einheiten: string[];
}

const ART_TEXT: Record<Feld, string> = { status: "Abrücken", zug: "Zug", notiz: "Auftrag", eintreffzeit: "Eintreffzeit" };

/**
 * Änderungen an bekannten Einheiten seit einem Stand. Stände mit Zustand
 * vergleichen den Zustand der geltenden Fassung je Einheit — ein „Rückgängig"
 * nimmt die Änderung damit wirklich zurück. Ältere Stände (ohne Zustand)
 * zählen die Vermerke der Führungsstelle.
 */
export function aenderungenSeit(eintraege: MeldeEintrag[], stand: ExportStand): AenderungenSeit {
  const arten = new Set<Feld>();
  const einheiten = new Set<string>();
  let anzahl = 0;
  if (stand.zustand) {
    for (const k of geltendeJeEinheit(eintraege)) {
      const z = stand.zustand[k.einheitSchluessel];
      if (!z) continue; // neue Einheit: zählt als neue Meldung, nicht als Änderung
      for (const feld of FELDER) {
        const bekannt = z[feld];
        if (bekannt === undefined || bekannt === pruefsumme(feldGleichheit(feld, k))) continue;
        anzahl++;
        arten.add(feld);
        einheiten.add(k.einheitSchluessel);
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
        arten.add(feld);
        einheiten.add(e.einheitSchluessel);
      }
    }
    anzahl = gezaehlt.size;
  }
  return { anzahl, arten: FELDER.filter((f) => arten.has(f)).map((f) => ART_TEXT[f]), einheiten: [...einheiten] };
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
  return eintraege.filter((e) => !bekannt.has(e.id));
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

/**
 * Die Sammlung auf den gewünschten Umfang zuschneiden. Die Exporte (CSV,
 * Excel, Sammel-PDF) rechnen alle auf einer `Einsatzsammlung`; sie bekommen
 * dieselbe Sammlung mit weniger Einträgen und müssen den Umfang nicht kennen.
 */
export function exportSammlung(einsatz: Einsatzsammlung, umfang: ExportUmfang, stand: ExportStand | null): Einsatzsammlung {
  if (umfang === "alle") return einsatz;
  return { ...einsatz, eintraege: nachtragEintraege(einsatz.eintraege, stand) };
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
  const stand: ExportStand = { zeitpunkt: jetzt, eintragIds: einsatz.eintraege.map((e) => e.id), ...(bestaetigt ? { bestaetigt: true } : {}) };
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
