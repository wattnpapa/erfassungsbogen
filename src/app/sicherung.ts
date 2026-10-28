/**
 * Komplett-Sicherung aller lokalen App-Daten (Geräteumzug / Backup):
 * sämtliche `eeb.*`-Einträge des localStorage — Vorlagen, Einsätze, Entwurf,
 * Geräteschlüssel, Einstellungen — als eine JSON-Datei exportieren und auf
 * einem anderen Gerät wieder einspielen. Ohne Cloud ist das Gerät sonst ein
 * Single Point of Failure.
 *
 * Achtung: Die Datei enthält auch den PRIVATEN Signatur-Geräteschlüssel —
 * die UI weist darauf hin, dass sie wie ein Schlüssel zu behandeln ist.
 *
 * Gegenstück ist das restlose Löschen (`alleDatenLoeschen`) — beides arbeitet
 * über denselben `eeb.`-Präfix, damit „gesichert" und „gelöscht" dieselbe Menge
 * meinen.
 */

import { absenderkarteGefuellt, absenderkarteLaden } from "./absenderkarte";
import { einsaetzeLaden, einsaetzePapierkorb } from "./einsaetze-lesen";
import { beschaedigterEntwurf, entwurfLaden, ersetztenEntwurfLaden } from "./entwurf";
import { exportVorhanden } from "./export-stand";
import { einheitAnzeigename } from "./hilfen";
import { geraeteSchluesselPrivat } from "./geraete-schluessel";
import { vorlagenLaden, vorlagenPapierkorb } from "./vorlagen";
import { UNLESBAR_SCHLUESSEL, unlesbarAusText, unlesbarBestand, unlesbarerGesamttext, unlesbareSammlungsteile, unlesbareVorlagenteile } from "./unlesbar";
import { folgenVorhanden, uhrFolgen, type UhrFolgen } from "./uhr-folgen";

const FORMAT = "eeb-sicherung";
const VERSION = 1;
/** Nur App-eigene Einträge wandern in die Sicherung. */
const PRAEFIX = "eeb.";
/** Merkzettel der Geräteuhr (datenschutz-uhr.ts) — bleibt beim Einspielen beim Gerät. */
const UHR_SCHLUESSEL = "eeb.uhr.v1";
/**
 * Vorratsstand der Beispielbögen und Themenseiten (offline-bereit.ts, `ZUSATZ_STAND_SCHLUESSEL`) — beschreibt, was auf
 * DIESEM Gerät im Cache liegt, nicht auf dem Herkunftsgerät der Sicherung; bleibt beim Einspielen beim Gerät (R14-O2).
 */
export const ZUSATZ_STAND_SCHLUESSEL = "eeb.offline-zusatz.v1";
/** Schlüssel, die zum Gerät gehören und beim Einspielen weder gelöscht noch aus der Datei übernommen werden. */
const BEIM_GERAET: ReadonlySet<string> = new Set([UHR_SCHLUESSEL, ZUSATZ_STAND_SCHLUESSEL]);

export interface Sicherung {
  format: typeof FORMAT;
  version: number;
  erstellt: string; // ISO-Zeitpunkt
  eintraege: Record<string, string>;
}

// ------------------------------------------------- Serialisierung (rein)

export function sicherungInhalt(eintraege: Record<string, string>, jetzt = new Date()): string {
  const s: Sicherung = { format: FORMAT, version: VERSION, erstellt: jetzt.toISOString(), eintraege };
  return JSON.stringify(s, null, 2);
}

/**
 * Sicherungsdatei prüfen und die Einträge zurückgeben. Wirft mit verständlicher
 * Meldung bei fremden Dateien; fremde Schlüssel (ohne `eeb.`) werden ignoriert.
 */
export function sicherungParsen(text: string): Record<string, string> {
  let roh: unknown;
  try {
    roh = JSON.parse(text);
  } catch {
    throw new Error("Datei ist kein gültiges JSON.");
  }
  const s = roh as Sicherung;
  if (s?.format !== FORMAT || typeof s.eintraege !== "object" || s.eintraege == null) {
    throw new Error("Keine gültige Erfassungsbogen-Sicherungsdatei.");
  }
  if (typeof s.version !== "number" || s.version > VERSION) {
    throw new Error(`Sicherung stammt aus einer neueren App-Version (Format ${s.version}) — bitte erst die App aktualisieren.`);
  }
  const eintraege: Record<string, string> = {};
  for (const [k, v] of Object.entries(s.eintraege)) {
    if (k.startsWith(PRAEFIX) && typeof v === "string") eintraege[k] = v;
  }
  return eintraege;
}

/** Zeitpunkt, zu dem die Sicherung erstellt wurde (ISO), oder null. */
export function sicherungErstelltAm(text: string): string | null {
  try {
    const s = JSON.parse(text) as Partial<Sicherung>;
    return typeof s?.erstellt === "string" ? s.erstellt : null;
  } catch {
    return null;
  }
}

// ------------------------------------------ Was ersetzt wird (für die Rückfrage)

/** Eine Einsatz-Sammlung, wie die Rückfrage vor dem Einspielen sie nennt. */
export interface SammlungKurz {
  name: string;
  meldungen: number;
  papierkorb: boolean;
}

/**
 * Inhalt eines Bestands (Gerät oder Sicherungsdatei) — Sammlungen beim Namen,
 * dazu Vorlagen und Entwurf. „Sicherung einspielen" ersetzt ALLES; die
 * Rückfrage nannte bisher weder, was auf dem Gerät verschwindet, noch, was die
 * Datei bringt (Audit Runde 2, R2-D3). Gelesen wird aus den rohen Einträgen,
 * damit Gerät und Datei mit derselben Elle gemessen werden.
 */
export interface BestandUmfang {
  sammlungen: SammlungKurz[];
  /** Aktive Vorlagen. */
  vorlagen: number;
  /** Vorlagen im Papierkorb (R4-D2: getrennt genannt). */
  vorlagenPapierkorb: number;
  entwurf: boolean;
  /**
   * Name der Einheit auf dem Rückholplatz, sonst null. „Sicherung einspielen"
   * nannte ihn nicht und löschte ihn trotzdem; bei leerem Arbeitsplatz stand
   * dort „nichts geht verloren" (Audit Runde 4, R4-D2).
   */
  rueckholplatz: string | null;
  /** Eine Absenderkarte mit Inhalt ist hinterlegt. */
  absender: boolean;
  /** Privater Geräteschlüssel (Hex) — für die Kurzform vorher/nachher; null = keiner. */
  geraeteschluessel: string | null;
  /**
   * Was beim Einspielen sofort unter die Fristen fiele (R5-D4): Sammlungen
   * über 90 Tage Ruhe, Papierkorb über 30 Tage, Namen in alten Meldungen und
   * im Entwurf. Eine alte Datei bringt nicht, was in ihr steht, sondern was
   * nach den Fristen übrig bleibt.
   */
  faellig: UhrFolgen;
  /**
   * Beschädigtes im Bestand, in Worten („Einsatz-Sammlungen: Text abgeschnitten …"). Die Rückfrage
   * nennt es: Wer die Datei einspielt, bringt es mit (R8-E1). Leer oder fehlend = nichts gefunden.
   */
  beschaedigt?: string[];
  /**
   * Beiseitegelegtes (R9-D2): unlesbare Gesamttexte, Sammlungs- und Vorlagenteile unter `eeb.unlesbar.v1`
   * und ein beschädigter Entwurf. Beides geht beim Einspielen verloren, ohne dass die Rückfrage es nannte.
   */
  beiseite?: BeiseiteUmfang;
}

/** Zahl und Größe des Beiseitegelegten (unlesbarer Text, beschädigter Entwurf). */
export interface BeiseiteUmfang {
  /** Beiseitegelegte Einträge (ganze Gesamttexte, Sammlungen, Meldungen, Vorlagen). */
  eintraege: number;
  /** Zeichen des beiseitegelegten Textes (der Rohtext, wie er gespeichert ist). */
  zeichen: number;
  /** Ein beschädigter Entwurf liegt beiseite. */
  entwurf: boolean;
}

/** Wie {@link BeiseiteUmfang}, gemessen an den Einträgen eines Bestands; null, wenn nichts beiseite liegt. */
export function beiseiteUmfang(eintraege: Record<string, string>): BeiseiteUmfang | null {
  const b = unlesbarAusText(eintraege[UNLESBAR_SCHLUESSEL]);
  const anzahl = b ? b.sammlungen.length + b.meldungen.length + b.vorlagen.length + b.texte.length : 0;
  const entwurf = !!eintraege[BESCHAEDIGT_ENTWURF_SCHLUESSEL];
  if (anzahl === 0 && !entwurf) return null;
  return { eintraege: anzahl, zeichen: anzahl > 0 ? (eintraege[UNLESBAR_SCHLUESSEL] ?? "").length : 0, entwurf };
}

const EINSAETZE_SCHLUESSEL = "eeb.einsaetze.v1";
const VORLAGEN_SCHLUESSEL = "eeb.vorlagen.v1";
const ENTWURF_SCHLUESSEL = "eeb.entwurf.v1";
const ERSETZT_SCHLUESSEL = "eeb.entwurf.ersetzt.v1";
const ABSENDER_SCHLUESSEL = "eeb.absenderkarte.v1";
const GERAETESCHLUESSEL_SCHLUESSEL = "eeb.geraeteschluessel.v1";
const BESCHAEDIGT_ENTWURF_SCHLUESSEL = "eeb.entwurf.beschaedigt.v1";
/** Alles, was die Rückfrage vor dem Einspielen zählt — Gerät und Datei mit derselben Elle. */
const BESTAND_SCHLUESSEL = [
  EINSAETZE_SCHLUESSEL,
  VORLAGEN_SCHLUESSEL,
  ENTWURF_SCHLUESSEL,
  ERSETZT_SCHLUESSEL,
  ABSENDER_SCHLUESSEL,
  GERAETESCHLUESSEL_SCHLUESSEL,
  UNLESBAR_SCHLUESSEL,
  BESCHAEDIGT_ENTWURF_SCHLUESSEL,
];

function jsonListe(roh: string | undefined): unknown[] {
  if (!roh) return [];
  try {
    const x: unknown = JSON.parse(roh);
    return Array.isArray(x) ? x : [];
  } catch {
    return [];
  }
}

/** Was an den Einträgen eines Bestands beschädigt ist — dieselben Prüfungen, mit denen die App Unlesbares beiseitelegt (unlesbar.ts). */
function beschaedigtes(eintraege: Record<string, string>): string[] {
  const aus: string[] = [];
  const n = (zahl: number, eins: string, viele: string) => `${zahl} ${zahl === 1 ? eins : viele}`;
  const sammlungenText = unlesbarerGesamttext(eintraege[EINSAETZE_SCHLUESSEL], "sammlungen");
  if (sammlungenText) aus.push("Einsatz-Sammlungen: der gespeicherte Text ist beschädigt und nicht lesbar");
  else {
    const teile = unlesbareSammlungsteile(eintraege[EINSAETZE_SCHLUESSEL]);
    if (teile.meldungen.length > 0) aus.push(`Einsatz-Sammlungen: ${n(teile.meldungen.length, "Meldung", "Meldungen")} nicht lesbar`);
    if (teile.sammlungen.length > 0) aus.push(`Einsatz-Sammlungen: ${n(teile.sammlungen.length, "Sammlung", "Sammlungen")} nicht lesbar`);
  }
  if (unlesbarerGesamttext(eintraege[VORLAGEN_SCHLUESSEL], "vorlagen")) aus.push("Vorlagen: der gespeicherte Text ist beschädigt und nicht lesbar");
  else {
    const v = unlesbareVorlagenteile(eintraege[VORLAGEN_SCHLUESSEL]).length;
    if (v > 0) aus.push(`Vorlagen: ${n(v, "Vorlage", "Vorlagen")} nicht lesbar`);
  }
  for (const [schluessel, name] of [[ENTWURF_SCHLUESSEL, "Entwurf"], [ERSETZT_SCHLUESSEL, "zuletzt geschlossener Bogen"]] as const) {
    const roh = eintraege[schluessel];
    if (!roh) continue;
    try {
      JSON.parse(roh);
    } catch {
      aus.push(`${name}: der gespeicherte Text ist beschädigt und nicht lesbar`);
    }
  }
  return aus;
}

export function bestandUmfang(eintraege: Record<string, string>): BestandUmfang {
  const sammlungen: SammlungKurz[] = [];
  for (const e of jsonListe(eintraege[EINSAETZE_SCHLUESSEL])) {
    const s = e as { name?: unknown; eintraege?: unknown; geloeschtAm?: unknown };
    if (!s || !Array.isArray(s.eintraege)) continue;
    sammlungen.push({
      name: typeof s.name === "string" && s.name ? s.name : "(ohne Namen)",
      meldungen: s.eintraege.length,
      papierkorb: typeof s.geloeschtAm === "number",
    });
  }
  const vorlagen = jsonListe(eintraege[VORLAGEN_SCHLUESSEL]);
  const imPapierkorb = vorlagen.filter((v) => typeof (v as { geloeschtAm?: unknown } | null)?.geloeschtAm === "number").length;
  return {
    sammlungen,
    vorlagen: vorlagen.length - imPapierkorb,
    vorlagenPapierkorb: imPapierkorb,
    entwurf: !!eintraege[ENTWURF_SCHLUESSEL],
    rueckholplatz: rueckholplatzAusRoh(eintraege[ERSETZT_SCHLUESSEL]),
    absender: absenderAusRoh(eintraege[ABSENDER_SCHLUESSEL]),
    geraeteschluessel: /^[0-9a-f]{64}$/i.test(eintraege[GERAETESCHLUESSEL_SCHLUESSEL] ?? "")
      ? eintraege[GERAETESCHLUESSEL_SCHLUESSEL]!
      : null,
    faellig: uhrFolgen(Date.now(), (k) => eintraege[k] ?? null),
    beschaedigt: beschaedigtes(eintraege),
    beiseite: beiseiteUmfang(eintraege) ?? undefined,
  };
}

export { folgenVorhanden };

function rueckholplatzAusRoh(roh: string | undefined): string | null {
  if (!roh) return null;
  try {
    const e = JSON.parse(roh) as { bogen?: { einheit?: unknown } };
    if (!e?.bogen?.einheit) return "(Bogen ohne Namen)";
    return einheitAnzeigename(e.bogen.einheit as Parameters<typeof einheitAnzeigename>[0]) || "(Bogen ohne Namen)";
  } catch {
    return "(Bogen ohne Namen)";
  }
}

function absenderAusRoh(roh: string | undefined): boolean {
  if (!roh) return false;
  try {
    const k = JSON.parse(roh) as unknown;
    return !!k && typeof k === "object" && absenderkarteGefuellt(k as Parameters<typeof absenderkarteGefuellt>[0]);
  } catch {
    return false;
  }
}

/**
 * Steht auf dem Gerät überhaupt etwas, das beim Einspielen verloren geht?
 * Dann verlangt die Rückfrage den Haken — nicht nur bei laufenden Sammlungen
 * (R4-D2).
 */
export function bestandBetroffen(b: BestandUmfang): boolean {
  return (
    b.sammlungen.length > 0 ||
    b.vorlagen > 0 ||
    b.vorlagenPapierkorb > 0 ||
    b.entwurf ||
    b.rueckholplatz != null ||
    b.absender ||
    b.geraeteschluessel != null ||
    b.beiseite != null
  );
}

/** Bestand dieses Geräts, gemessen wie eine Sicherungsdatei. */
export function geraetBestand(): BestandUmfang {
  const s = speicher();
  const eintraege: Record<string, string> = {};
  if (s) {
    for (const k of BESTAND_SCHLUESSEL) {
      const v = s.getItem(k);
      if (v != null) eintraege[k] = v;
    }
  }
  return bestandUmfang(eintraege);
}

// ------------------------------------------------- localStorage-Hülle (I/O)

function speicher(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null; // z. B. Privatmodus/blockierter Speicher
  }
}

function alleEebSchluessel(s: Storage): string[] {
  const schluessel: string[] = [];
  for (let i = 0; i < s.length; i++) {
    const k = s.key(i);
    if (k?.startsWith(PRAEFIX)) schluessel.push(k);
  }
  return schluessel;
}

// ------------------------------------------------- Letzte Sicherung, Erinnerung

/**
 * Wann auf diesem Gerät zuletzt eine Sicherung erstellt wurde. Alles liegt nur
 * hier, einen Server, der es noch hätte, gibt es nicht — und bisher sagte die
 * App nirgends, wann zuletzt eine Kopie gezogen wurde, noch erinnerte sie
 * daran (Audit Runde 2, R2-O6). Der Zeitpunkt steht unter `eeb.`: Er reist mit
 * der Sicherung (nach dem Einspielen gilt deren Erstellzeit) und fällt mit
 * „Alle Daten löschen" weg. Gemerkt wird beim Erstellen der Datei — ob sie
 * danach wirklich abgelegt wurde, sieht die App nicht.
 */
const ZULETZT_SCHLUESSEL = "eeb.sicherung.zuletzt.v1";

/** Nach so vielen Tagen ohne Sicherung erinnert die Fußzeile daran. */
export const ERINNERUNG_TAGE = 3;
const TAG_MS = 24 * 60 * 60 * 1000;

export function letzteSicherung(): number | null {
  const roh = speicher()?.getItem(ZULETZT_SCHLUESSEL);
  const n = roh == null ? NaN : Number(roh);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Was eine Sicherung wert macht: laufende Sammlungen mit Meldungen und
 * Vorlagen. Zeitpunkt, seit dem das so ist (älteste Anlage), oder null.
 */
function wertvollSeit(): number | null {
  const zeiten = [
    ...einsaetzeLaden().filter((e) => e.eintraege.length > 0).map((e) => e.angelegt),
    ...vorlagenLaden().map((v) => v.erstellt),
  ].filter((t) => typeof t === "number" && Number.isFinite(t));
  return zeiten.length > 0 ? Math.min(...zeiten) : null;
}

/** Liegt hier etwas, dessen Verlust wehtäte? (Anlass, dauerhaften Speicher zu erbitten.) */
export function wertvolleDaten(): boolean {
  return wertvollSeit() != null;
}

/**
 * Ist eine Erinnerung fällig? Ja, wenn wertvolle Daten da sind und die letzte
 * Sicherung — oder, ohne jede Sicherung, das Entstehen dieser Daten — länger
 * als {@link ERINNERUNG_TAGE} zurückliegt. `seit` = letzte Sicherung oder null.
 */
export function sicherungFaellig(jetzt = Date.now()): { seit: number | null } | null {
  const wertvoll = wertvollSeit();
  if (wertvoll == null) return null;
  const seit = letzteSicherung();
  const bezug = seit ?? wertvoll;
  return jetzt - bezug >= ERINNERUNG_TAGE * TAG_MS ? { seit } : null;
}

/**
 * Datenstand der letzten Sicherung (R12-O4): wie viele Einsätze und Meldungen sie enthielt. Daraus rechnet die
 * Anzeige „seit der Sicherung n neue Meldungen" — die Erinnerung allein rechnete nur in Tagen.
 */
const STAND_SCHLUESSEL = "eeb.sicherung.stand.v1";

/**
 * Zählt am rohen Speichertext statt über `einsaetzeLaden()`: Das Laden legt unlesbare Teile beiseite und schreibt
 * dabei; mitten in einer Sicherung darf sie nichts am Bestand verändern.
 */
function meldungenGesamt(): { einsaetze: number; meldungen: number } {
  try {
    const roh = JSON.parse(speicher()?.getItem("eeb.einsaetze.v1") ?? "[]") as unknown;
    if (!Array.isArray(roh)) return { einsaetze: 0, meldungen: 0 };
    const aktiv = roh.filter((x): x is { eintraege?: unknown; geloeschtAm?: unknown } => !!x && typeof x === "object" && (x as { geloeschtAm?: unknown }).geloeschtAm == null);
    return {
      einsaetze: aktiv.length,
      meldungen: aktiv.reduce((n, x) => n + (Array.isArray(x.eintraege) ? x.eintraege.length : 0), 0),
    };
  } catch {
    return { einsaetze: 0, meldungen: 0 };
  }
}

/** Was die letzte Sicherung enthielt; `null`, wenn unbekannt (ältere Sicherung ohne Vermerk). */
export function sicherungStand(): { einsaetze: number; meldungen: number } | null {
  try {
    const roh = speicher()?.getItem(STAND_SCHLUESSEL);
    if (!roh) return null;
    const d = JSON.parse(roh) as { einsaetze?: unknown; meldungen?: unknown };
    return typeof d.einsaetze === "number" && typeof d.meldungen === "number"
      ? { einsaetze: d.einsaetze, meldungen: d.meldungen }
      : null;
  } catch {
    return null;
  }
}

/** Satz zum Datenstand: „enthält 3 Einsätze, 54 Meldungen; seit der Sicherung 12 neue Meldungen"; leer ohne Vermerk. */
export function sicherungStandText(): string {
  const stand = sicherungStand();
  if (!stand) return "";
  const jetzt = meldungenGesamt();
  const neu = Math.max(0, jetzt.meldungen - stand.meldungen);
  const einsaetze = `${stand.einsaetze} ${stand.einsaetze === 1 ? "Einsatz" : "Einsätze"}`;
  const meldungen = `${stand.meldungen} ${stand.meldungen === 1 ? "Meldung" : "Meldungen"}`;
  return `Sie enthält ${einsaetze}, ${meldungen}; ${neu === 0 ? "seitdem ist nichts Neues dazugekommen" : `seit der Sicherung ${neu === 1 ? "1 neue Meldung" : `${neu} neue Meldungen`}`}.`;
}

/**
 * Quittung nach „Sicherung erstellen…" (R12-O4): Dateiname, Ablage und der ehrliche Satz, dass die Kopie erst zählt,
 * wenn sie woanders liegt. Ob der Browser die Datei wirklich ablegt, sieht die App nicht.
 */
export function sicherungQuittungText(dateiname: string, nativ: boolean, vermerkFehlt = false): string {
  const ablage = nativ ? "wurde über das Teilen-Menü abgelegt" : "liegt im Download-Ordner";
  // R20-O2: Bei vollem Speicher bleibt der Vermerk aus; dieselbe Auskunft wie bei den Exporten, damit die Übergabe-Liste nicht ohne Grund „noch nicht“ zeigt.
  const vermerk = vermerkFehlt ? " Vermerk nicht gespeichert (Speicher voll) – die Übergabe-Liste zeigt „noch nicht“." : "";
  return `Sicherung „${dateiname}" erzeugt — ${ablage}.${vermerk} Gesichert ist sie erst, wenn sie auf einem zweiten Gerät oder Datenträger liegt.`;
}

/** Ereignis, mit dem Ansichten, die den Sicherungsvermerk zeigen (Übergabe-Liste), neu zeichnen (R20-O2). */
export const SICHERUNG_EREIGNIS = "eeb:sicherung";

let vermerkFehlte = false;
/** Konnte die letzte Sicherung ihren Vermerk („zuletzt gesichert“) nicht schreiben, weil der Speicher voll war? */
export function sicherungVermerkFehlte(): boolean {
  return vermerkFehlte;
}

/** Alle lokalen App-Daten als Sicherungsdatei-Inhalt. */
export function sicherungErstellen(jetzt = new Date()): string {
  const s = speicher();
  const eintraege: Record<string, string> = {};
  vermerkFehlte = false;
  if (s) {
    // Vor dem Einsammeln merken, damit die Datei ihren eigenen Zeitpunkt trägt.
    try {
      s.setItem(ZULETZT_SCHLUESSEL, String(jetzt.getTime()));
      s.setItem(STAND_SCHLUESSEL, JSON.stringify(meldungenGesamt()));
    } catch {
      vermerkFehlte = true; /* Speicher voll — die Sicherung selbst ist wichtiger als der Vermerk */
    }
    try {
      globalThis.dispatchEvent?.(new Event(SICHERUNG_EREIGNIS));
    } catch {
      /* kein Fenster (Test ohne DOM) */
    }
    for (const k of alleEebSchluessel(s)) {
      const v = s.getItem(k);
      if (v != null) eintraege[k] = v;
    }
  }
  return sicherungInhalt(eintraege, jetzt);
}

/**
 * Sicherung einspielen: ERSETZT alle lokalen App-Daten durch den Datei-Inhalt
 * (Geräteumzug-Semantik). Rückgabe: Zahl der übernommenen Einträge.
 */
export function sicherungEinspielen(text: string): number {
  const eintraege = sicherungParsen(text);
  const s = speicher();
  if (!s) throw new Error("Lokaler Speicher ist nicht verfügbar (Privatmodus?).");
  // R13-O1: Vorher merken, was auf dem Gerät liegt. Passt die Datei nicht in den Speicher, wird der alte Stand
  // zurückgeschrieben, statt ein leeres Gerät und einen englischen Browser-Text zu hinterlassen.
  const vorher: Record<string, string> = {};
  for (const k of alleEebSchluessel(s)) {
    if (BEIM_GERAET.has(k)) continue;
    const v = s.getItem(k);
    if (v != null) vorher[k] = v;
  }
  let anzahl = 0;
  try {
    for (const k of Object.keys(vorher)) s.removeItem(k);
    for (const [k, v] of Object.entries(eintraege)) {
      // Der Uhrstand gehört zu diesem Gerät, nicht zur Datei: Der Stand aus einer
      // 100 Tage alten Sicherung löste beim nächsten Start „Geräteuhr prüfen"
      // aus, obwohl die Uhr stimmte (Audit Runde 5, R5-D4).
      if (BEIM_GERAET.has(k)) continue;
      s.setItem(k, v);
      anzahl++;
    }
  } catch (err) {
    // Rückfall: halb geschriebene Schlüssel der Datei entfernen, dann den alten Stand zurückschreiben.
    let wiederhergestellt = true;
    try {
      for (const k of Object.keys(eintraege)) if (!BEIM_GERAET.has(k)) s.removeItem(k);
      for (const [k, v] of Object.entries(vorher)) s.setItem(k, v);
    } catch {
      wiederhergestellt = false;
    }
    throw new Error(sicherungEinspielFehlerText(wiederhergestellt, err));
  }
  return anzahl;
}

/** Deutscher Satz, wenn das Einspielen scheitert (R13-O1): sagt, ob die bisherigen Daten noch da sind. */
export function sicherungEinspielFehlerText(bestandUnveraendert: boolean, ursache?: unknown): string {
  const voll = ursache instanceof Error && /quota|voll|full/i.test(`${ursache.name} ${ursache.message}`);
  const grund = voll ? "Der Speicher dieses Geräts reicht für diese Sicherung nicht" : "Die Sicherung ließ sich nicht schreiben";
  return bestandUnveraendert
    ? `Nicht eingespielt: ${grund}. Deine bisherigen Daten auf diesem Gerät sind unverändert.`
    : `Nicht eingespielt: ${grund}, und die bisherigen Daten ließen sich nicht vollständig zurückschreiben. Seite nicht schließen, Sicherung vorher erstellen.`;
}

// ------------------------------------------------- Restlos löschen

/**
 * Was auf diesem Gerät liegt — für die Rückfrage vor dem Löschen. Ohne konkrete
 * Zahlen ist „alles löschen?" eine Frage, die niemand verantwortlich beantworten
 * kann. Vorlagen und Einsätze zählen inklusive Papierkorb: was gelöscht wird,
 * muss auch gezeigt werden.
 */
export interface DatenUmfang {
  /** Zahl der `eeb.*`-Einträge insgesamt (auch Einstellungen). */
  eintraege: number;
  vorlagen: number;
  einsaetze: number;
  /** Gemeldete Bögen über alle Einsatz-Sammlungen. */
  meldungen: number;
  entwurf: boolean;
  /**
   * Name der Einheit auf dem Rückholplatz (verdrängter eigener Bogen), sonst
   * null. Die Aufzählung nannte ihn nicht und sagte bei leerem Arbeitsplatz
   * „kein offener Bogen-Entwurf" (Audit Runde 3, R3-D4).
   */
  rueckholplatz: string | null;
  /**
   * Ein unlesbarer Entwurf liegt beiseitegelegt auf dem Gerät. Die Karte
   * verspricht „nicht gelöscht"; die Aufzählung schwieg und löschte ihn mit
   * (Audit Runde 6, R6-D2).
   */
  beiseitegelegt: boolean;
  /** Beiseitegelegte unlesbare Sammlungs-/Vorlagentexte und -teile (`eeb.unlesbar.v1`), sonst null (R9-D2). */
  beiseiteDaten: BeiseiteUmfang | null;
  absender: boolean;
  geraeteschluessel: boolean;
  /**
   * Namen der Sammlungen mit Meldungen, von denen es keinen Export, kein
   * Lageblatt und keine Weitergabe gibt: Beim Löschen ist das die einzige
   * Kopie (Audit Runde 4, R4-D5).
   */
  ohneExport: string[];
}

function rueckholplatzName(): string | null {
  const e = ersetztenEntwurfLaden();
  return e ? einheitAnzeigename(e.bogen.einheit) || "(Bogen ohne Namen)" : null;
}

function beiseiteUmfangGeraet(): BeiseiteUmfang | null {
  const b = unlesbarBestand();
  if (!b) return null;
  const roh = speicher()?.getItem(UNLESBAR_SCHLUESSEL) ?? "";
  return { eintraege: b.sammlungen.length + b.meldungen.length + b.vorlagen.length + b.texte.length, zeichen: roh.length, entwurf: false };
}

export function datenUmfang(): DatenUmfang {
  const s = speicher();
  const einsaetze = [...einsaetzeLaden(), ...einsaetzePapierkorb()];
  return {
    eintraege: s ? alleEebSchluessel(s).length : 0,
    vorlagen: vorlagenLaden().length + vorlagenPapierkorb().length,
    einsaetze: einsaetze.length,
    meldungen: einsaetze.reduce((summe, e) => summe + e.eintraege.length, 0),
    entwurf: entwurfLaden() != null,
    rueckholplatz: rueckholplatzName(),
    beiseitegelegt: beschaedigterEntwurf() != null,
    beiseiteDaten: beiseiteUmfangGeraet(),
    absender: absenderkarteGefuellt(absenderkarteLaden()),
    geraeteschluessel: geraeteSchluesselPrivat() != null,
    ohneExport: einsaetze.filter((e) => e.eintraege.length > 0 && !exportVorhanden(e.id)).map((e) => e.name),
  };
}

/**
 * Alle lokalen App-Daten (`eeb.*`) endgültig entfernen — auch der Papierkorb,
 * auch der private Geräteschlüssel. Rückgabe: Zahl der entfernten Einträge.
 *
 * Nicht betroffen ist der Widerspruch zur Reichweitenmessung (`skipgc`, ohne
 * `eeb.`-Präfix): das ist eine Datenschutz-Entscheidung über die App, kein
 * erfasster Inhalt — sie beim „Alles löschen" stillschweigend zurückzunehmen
 * wäre das Gegenteil dessen, was hier jemand will.
 */
export function alleDatenLoeschen(): number {
  const s = speicher();
  if (!s) throw new Error("Lokaler Speicher ist nicht verfügbar (Privatmodus?).");
  const schluessel = alleEebSchluessel(s);
  for (const k of schluessel) s.removeItem(k);
  // Auch die Merker im Sitzungsspeicher dieses Tabs (wartender Link, Rückweg
  // von „Vorbelegung entfernen"): Sie können Personendaten tragen (R5-S6, R5-D5).
  try {
    const sitzung = globalThis.sessionStorage;
    if (sitzung) {
      const sitzungsSchluessel: string[] = [];
      for (let i = 0; i < sitzung.length; i++) {
        const k = sitzung.key(i);
        if (k?.startsWith(PRAEFIX)) sitzungsSchluessel.push(k);
      }
      for (const k of sitzungsSchluessel) sitzung.removeItem(k);
    }
  } catch {
    /* Sitzungsspeicher gesperrt — dort liegt dann auch nichts */
  }
  return schluessel.length;
}
