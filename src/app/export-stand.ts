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
import {
  STAND_FELDER,
  standGleichheit,
  vermerkFeld,
  vermerkKennung,
  type Feld,
  type StandFeld,
} from "./einsatz-abgleich";
import { MeldeStatus } from "@bos/meldekopf/einsaetze";
import { geltendeJeEinheit } from "./fassung-vorrang";
import { ORT_REGEL } from "./einheiten-tabelle";

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


/** Ausgabewege mit eigenem Bezugspunkt für „nur neue Bögen". */
export type ExportZiel = "pdf" | "csv" | "csv-detail";

/**
 * Bis 2026-11 gab es ein viertes Ziel `xlsx` (Excel-Liste im Format „Oldenburg"). Ein alter Stand
 * dazu wird beim Lesen schlicht übergangen und beim nächsten Schreiben nicht mehr mitgenommen.
 */
export const EXPORT_ZIELE: readonly ExportZiel[] = ["pdf", "csv", "csv-detail"];

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


/** Die Stände aller Formate dieses Einsatzes (fehlend = noch nie in diesem Format exportiert). */
export function exportStaendeLaden(einsatzId: string): Partial<Record<ExportZiel, ExportStand>> {
  return zielAblageLaden()[einsatzId] ?? {};
}




/** Stand des zuletzt erzeugten Lageblatts dieses Einsatzes, oder null (R2-A3). */
export function lageblattStandLaden(einsatzId: string): ExportStand | null {
  return ablageLaden(LAGEBLATT_SCHLUESSEL)[einsatzId] ?? null;
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


/** FNV-1a (32 Bit) — kurze Prüfsumme einer Vermerk-Kennung, kein Klartext im Stand. */
function pruefsumme(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
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

