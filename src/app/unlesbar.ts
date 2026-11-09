/**
 * Unlesbare Einträge in Sammlungen und Vorlagen: zählen, beiseitelegen, zeigen
 * (Audit Runde 7, R7-N3, R7-E2).
 *
 * Seit Runde 6 stürzt die Startseite bei einem kaputten Eintrag nicht mehr ab —
 * der Eintrag fehlte aber still in Zählung und Liste, eine Sammlung nur mit
 * unbrauchbaren Einträgen stand als „Noch keine Meldung." da, und der Kern
 * (Submodul) schreibt beim nächsten Speichern nur noch die lesbaren Teile
 * zurück: Was er nicht lesen konnte, war danach endgültig weg.
 *
 * Darum gilt hier dreierlei:
 *
 * 1. **Beiseitelegen:** Was der Kern überspringt (Sammlung ohne Kennung oder
 *    Eintragsliste, Meldung ohne Bogen, Vorlage ohne lesbaren Bogen), wird
 *    vor dem ersten Lesen durch den Kern unverändert unter
 *    `eeb.unlesbar.v1` abgelegt. Der Schlüssel wandert mit der
 *    Datensicherung und fällt mit „Alle Daten löschen" weg (Präfix `eeb.`).
 *    Wie beim beiseitegelegten Entwurf löscht ihn die Datenschutzfrist nach
 *    90 Tagen, gerechnet ab dem Beiseitelegen mit der geprüften Uhr.
 * 2. **Zählen:** Meldungen, die der Kern behält, die die App aber nicht
 *    anzeigen kann (Pflichtfeld fehlt), zählt einsaetze-lesen.ts je Sammlung.
 * 3. **Zeigen:** unlesbar-hinweis.tsx nennt die Zahl und bietet die Sicherung an.
 * 4. **Nicht überschreiben, was sich nicht beiseitelegen lässt (R9-O1):** Ist der Speicher voll und
 *    scheitert das Beiseitelegen, lassen die Hüllen (uhr-korrektur.ts, vorlagen.ts, entwurf.ts) das
 *    Überschreiben des Originals nicht durch; die Startseite sagt „Speicher voll – beschädigte Daten nicht
 *    gesichert“. Aufräumen am Ursprungsort: unlesbar-aufraeumen.ts (R9-E4).
 */

import { migriereBogen } from "./hilfen";
import { bogenBefund } from "./bogen-pruefung";
import { DATENSCHUTZFRIST_TAGE } from "@bos/eeb-format/datenschutzfrist";
import { geprueftesJetztMs } from "./datenschutz-uhr";

export const UNLESBAR_SCHLUESSEL = "eeb.unlesbar.v1";

/** Was als ganzer Text beiseitegelegt wird: Sammlungen, Vorlagen, die Absenderkarte (R9-O3). */
export type TextArt = "sammlungen" | "vorlagen" | "absenderkarte";

export interface UnlesbarBestand {
  /** Wann zum ersten Mal beiseitegelegt (Date.now()). */
  am: number;
  /** Ganze Sammlungen (ohne Kennung oder ohne Eintragsliste). */
  sammlungen: unknown[];
  /** Meldungen, die der Kern überspringt, mit der Sammlung, zu der sie gehörten. */
  meldungen: { sammlungId: string; sammlungName: string; eintrag: unknown }[];
  /** Vorlagen, die sich nicht lesen ließen. */
  vorlagen: unknown[];
  /**
   * Ganze Gesamttexte, die sich gar nicht als Liste lesen ließen (abgebrochenes
   * JSON nach vollem Speicher oder Absturz, ein fremder Wert): Ohne sie ersetzte
   * die App den Text beim ersten Lesen still durch `[]` (R8-D1).
   */
  texte: { art: TextArt; text: string }[];
}

function istObjekt(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function speicher(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function parsen(text: string | null | undefined): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Kann der Bogen gehoben und geprüft werden — wie ihn der Kern bzw. die App liest? */
function bogenLesbar(bogen: unknown, mitPflichtfeldern: boolean): boolean {
  if (!istObjekt(bogen) || !Array.isArray(bogen.personal)) return false;
  try {
    const kopie = structuredClone(bogen);
    const gehoben = migriereBogen(kopie as never);
    return mitPflichtfeldern ? bogenBefund(gehoben).ok : true;
  } catch {
    return false;
  }
}

/**
 * Teile des gespeicherten Sammlungs-Textes, die der Kern beim Lesen weglässt
 * (und beim nächsten Schreiben endgültig verliert).
 */
export function unlesbareSammlungsteile(text: string | null | undefined): Pick<UnlesbarBestand, "sammlungen" | "meldungen"> {
  const aus = { sammlungen: [] as unknown[], meldungen: [] as UnlesbarBestand["meldungen"] };
  const roh = parsen(text);
  if (!Array.isArray(roh)) return aus;
  for (const s of roh) {
    if (!istObjekt(s) || typeof s.id !== "string" || !Array.isArray(s.eintraege)) {
      if (s != null) aus.sammlungen.push(s);
      continue;
    }
    for (const e of s.eintraege) {
      const kernOk = istObjekt(e) && typeof e.id === "string" && bogenLesbar(e.bogen, false);
      if (!kernOk) {
        aus.meldungen.push({ sammlungId: s.id, sammlungName: typeof s.name === "string" ? s.name : "", eintrag: e });
      }
    }
  }
  return aus;
}

/**
 * Ein gespeicherter Gesamttext, der keine Liste ist (leerer Text und der Wert `null` zählen
 * als „nichts gespeichert"). Sonst null.
 */
export function unlesbarerGesamttext(
  text: string | null | undefined,
  art: "sammlungen" | "vorlagen",
): UnlesbarBestand["texte"][number] | null {
  if (text == null || text.trim() === "") return null;
  try {
    const roh: unknown = JSON.parse(text);
    return roh === null || Array.isArray(roh) ? null : { art, text };
  } catch {
    return { art, text };
  }
}

let sammlungenGeprueft: string | null | undefined;

/**
 * Konnte der beschädigte Text NICHT beiseitegelegt werden (Speicher voll, R9-O1/R9-E5), bleibt er
 * unter seinem Schlüssel stehen: Die Hüllen (uhr-korrektur.ts, vorlagen.ts) lassen dann kein
 * Überschreiben durch, solange dort noch genau dieser Text liegt. Sonst ersetzte der Kern ihn
 * beim ersten Speichern durch `[]`, und die einzige Spur wäre weg.
 */
export type RettungArt = "sammlungen" | "vorlagen";
interface OffeneRettung {
  roh: string;
  /** Letzter Versuch (ms), damit die Wiederholung nicht bei jedem Lesen den ganzen Text prüft. */
  versuch: number;
}
const rettungOffen = new Map<RettungArt, OffeneRettung>();
const RETTUNG_WIEDERHOLUNG_MS = 2_000;

/** Ist ein beschädigter Text offen, der sich nicht beiseitelegen ließ? (Für den Hinweis auf der Startseite.) */
export function rettungOffenArten(): RettungArt[] {
  return [...rettungOffen.keys()];
}

/** Der Rohtext, der wegen vollen Speichers nicht beiseitegelegt wurde, oder null. */
export function rettungOffenText(art: RettungArt): string | null {
  return rettungOffen.get(art)?.roh ?? null;
}

/** Voller Speicher: ist es Zeit für einen neuen Versuch, den Text beiseitezulegen? */
export function rettungWiederholenFaellig(art: RettungArt): boolean {
  const o = rettungOffen.get(art);
  return !!o && Date.now() - o.versuch >= RETTUNG_WIEDERHOLUNG_MS;
}

/** Darf unter dem Schlüssel dieser Art geschrieben werden, wenn dort aktuell `gespeichert` steht? */
export function schreibenErlaubt(art: RettungArt, gespeichert: string | null | undefined): boolean {
  const o = rettungOffen.get(art);
  if (!o) return true;
  if (gespeichert === o.roh) return false;
  // Der Text ist inzwischen ein anderer (anderes Fenster, Einspielen): nichts mehr zu schützen.
  rettungOffen.delete(art);
  return true;
}

/** Nach dem Verwerfen oder Bereinigen von Hand: nichts mehr offen. */
export function rettungOffenVergessen(art?: RettungArt): void {
  if (art) rettungOffen.delete(art);
  else rettungOffen.clear();
}

/** Fehler, den ein gesperrtes Schreiben wirft — die Oberfläche liest ihn wie „Speicher voll“. */
export function rettungGesperrtFehler(): Error {
  const e = new Error("Speicher voll – beschädigter Text nicht gesichert; er bleibt unverändert liegen.");
  e.name = "QuotaExceededError";
  return e;
}

/**
 * Beiseitelegen mit Ergebnis: true, wenn alles Neue jetzt beiseite liegt (oder schon lag).
 * Ein Wert, den es nicht gab und der sich nicht schreiben ließ, ergibt false.
 */
function beiseiteGesichert(neu: Partial<Omit<UnlesbarBestand, "am">>): boolean {
  if (!(neu.sammlungen?.length || neu.meldungen?.length || neu.vorlagen?.length || neu.texte?.length)) return true;
  return ablegen(neu) !== "gescheitert";
}

/**
 * Was der Kern beim Lesen der Sammlungen überspringt oder ersetzt, liegt danach nur noch hier:
 * vor dem ersten Lesen eines geänderten Textes beiseitelegen. Hängt in der Hülle um die Ablage
 * (uhr-korrektur.ts), damit jeder Lesezugriff auf den Schlüssel davor geprüft wird — auch der
 * Aufräumlauf beim Start (R8-D1). Gelingt das Beiseitelegen nicht, bleibt der Text stehen
 * ({@link schreibenErlaubt}) und wird nach kurzer Frist erneut versucht.
 */
export function sammlungenRetten(roh: string | null | undefined): void {
  if (roh === undefined) return;
  if (roh === sammlungenGeprueft && !rettungWiederholenFaellig("sammlungen")) return;
  sammlungenGeprueft = roh;
  rettungOffen.delete("sammlungen");
  const teile = unlesbareSammlungsteile(roh);
  const text = unlesbarerGesamttext(roh, "sammlungen");
  if (teile.sammlungen.length > 0 || teile.meldungen.length > 0 || text) {
    if (!beiseiteGesichert({ ...teile, texte: text ? [text] : [] }) && roh != null) {
      rettungOffen.set("sammlungen", { roh, versuch: Date.now() });
    }
  }
}

/** Dasselbe für den Vorlagentext (vorlagen.ts). */
export function vorlagenRetten(roh: string | null | undefined, vorlagenteile: unknown[], text: UnlesbarBestand["texte"][number] | null): void {
  rettungOffen.delete("vorlagen");
  if (vorlagenteile.length === 0 && !text) return;
  if (!beiseiteGesichert({ vorlagen: vorlagenteile, texte: text ? [text] : [] }) && roh != null) {
    rettungOffen.set("vorlagen", { roh, versuch: Date.now() });
  }
}

/** Nur für Tests: den geprüften Text vergessen. */
export function sammlungenRetteZuruecksetzen(): void {
  sammlungenGeprueft = undefined;
  rettungOffen.clear();
}

/** Vorlagen, die `vorlagenAusJson` weglässt. */
export function unlesbareVorlagenteile(text: string | null | undefined): unknown[] {
  const roh = parsen(text);
  if (!Array.isArray(roh)) return [];
  return roh.filter((v) => !(istObjekt(v) && typeof v.id === "string" && bogenLesbar(v.bogen, true)) && v != null);
}

// ------------------------------------------------------------ Ablage (I/O)

function leer(am: number): UnlesbarBestand {
  return { am, sammlungen: [], meldungen: [], vorlagen: [], texte: [] };
}

/** Der beiseitegelegte Bestand aus seinem gespeicherten Text (auch aus einer Sicherungsdatei), oder null. Ohne Fristprüfung. */
export function unlesbarAusText(text: string | null | undefined): UnlesbarBestand | null {
  const roh = parsen(text);
  if (!istObjekt(roh) || typeof roh.am !== "number") return null;
  const liste = (x: unknown) => (Array.isArray(x) ? x : []);
  const b: UnlesbarBestand = {
    am: roh.am,
    sammlungen: liste(roh.sammlungen),
    meldungen: liste(roh.meldungen) as UnlesbarBestand["meldungen"],
    vorlagen: liste(roh.vorlagen),
    texte: liste(roh.texte) as UnlesbarBestand["texte"],
  };
  return b.sammlungen.length + b.meldungen.length + b.vorlagen.length + b.texte.length > 0 ? b : null;
}

/** Der beiseitegelegte Bestand, oder null. Nach der Datenschutzfrist wird er entfernt. */
export function unlesbarBestand(): UnlesbarBestand | null {
  try {
    const b = unlesbarAusText(speicher()?.getItem(UNLESBAR_SCHLUESSEL));
    if (!b) return null;
    if (geprueftesJetztMs() - b.am > DATENSCHUTZFRIST_TAGE * 24 * 60 * 60 * 1000) {
      unlesbarVerwerfen();
      return null;
    }
    return b;
  } catch {
    return null;
  }
}

export function unlesbarVerwerfen(): void {
  try {
    speicher()?.removeItem(UNLESBAR_SCHLUESSEL);
  } catch {
    /* nichts zu tun */
  }
}

function schluessel(x: unknown): string {
  try {
    return JSON.stringify(x);
  } catch {
    return String(x);
  }
}

function ergaenzt<T>(vorhanden: T[], neu: T[]): { liste: T[]; neu: number } {
  const bekannt = new Set(vorhanden.map(schluessel));
  const liste = [...vorhanden];
  let n = 0;
  for (const x of neu) {
    if (bekannt.has(schluessel(x))) continue;
    bekannt.add(schluessel(x));
    liste.push(x);
    n++;
  }
  return { liste, neu: n };
}

/**
 * Unlesbares dazulegen (ohne Doppelte). Rückgabe: true, wenn etwas Neues
 * abgelegt wurde. Scheitert das Schreiben (Speicher voll), bleibt alles
 * andere unberührt — die Hüllen lassen dann das Überschreiben des
 * Originals nicht zu (R9-O1, {@link schreibenErlaubt}).
 */
export function unlesbaresBeiseitelegen(neu: Partial<Omit<UnlesbarBestand, "am">>): boolean {
  return ablegen(neu) === "abgelegt";
}

function ablegen(neu: Partial<Omit<UnlesbarBestand, "am">>): "abgelegt" | "vorhanden" | "gescheitert" | "nichts" {
  const s = speicher();
  if (!s) return "gescheitert";
  if (!(neu.sammlungen?.length || neu.meldungen?.length || neu.vorlagen?.length || neu.texte?.length)) return "nichts";
  const alt = unlesbarBestand() ?? leer(geprueftesJetztMs());
  const a = ergaenzt(alt.sammlungen, neu.sammlungen ?? []);
  const b = ergaenzt(alt.meldungen, neu.meldungen ?? []);
  const c = ergaenzt(alt.vorlagen, neu.vorlagen ?? []);
  const d = ergaenzt(alt.texte, neu.texte ?? []);
  if (a.neu + b.neu + c.neu + d.neu === 0) return "vorhanden";
  try {
    const text = JSON.stringify({ ...alt, sammlungen: a.liste, meldungen: b.liste, vorlagen: c.liste, texte: d.liste } satisfies UnlesbarBestand);
    s.setItem(UNLESBAR_SCHLUESSEL, text);
    // Manche Browser scheitern still: dem Speicher glauben, nicht dem Aufruf.
    return s.getItem(UNLESBAR_SCHLUESSEL) === text ? "abgelegt" : "gescheitert";
  } catch {
    return "gescheitert";
  }
}


/** Zusammenfassung für Hinweise: wie viel liegt beiseite? */
export function unlesbarZahlen(): { sammlungen: number; meldungen: number; vorlagen: number; texte: number; gesamt: number } {
  const b = unlesbarBestand();
  const sammlungen = b?.sammlungen.length ?? 0;
  const meldungen = b?.meldungen.length ?? 0;
  const vorlagen = b?.vorlagen.length ?? 0;
  const texte = b?.texte.length ?? 0;
  return { sammlungen, meldungen, vorlagen, texte, gesamt: sammlungen + meldungen + vorlagen + texte };
}
