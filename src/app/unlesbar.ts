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
 */

import { migriereBogen } from "./hilfen";
import { bogenBefund } from "./bogen-pruefung";
import { DATENSCHUTZFRIST_TAGE } from "@bos/eeb-format/datenschutzfrist";
import { geprueftesJetztMs } from "./datenschutz-uhr";

export const UNLESBAR_SCHLUESSEL = "eeb.unlesbar.v1";

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
  texte: { art: "sammlungen" | "vorlagen"; text: string }[];
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
 * Was der Kern beim Lesen der Sammlungen überspringt oder ersetzt, liegt danach nur noch hier:
 * vor dem ersten Lesen eines geänderten Textes beiseitelegen. Hängt in der Hülle um die Ablage
 * (uhr-korrektur.ts), damit jeder Lesezugriff auf den Schlüssel davor geprüft wird — auch der
 * Aufräumlauf beim Start (R8-D1).
 */
export function sammlungenRetten(roh: string | null | undefined): void {
  if (roh === undefined || roh === sammlungenGeprueft) return;
  sammlungenGeprueft = roh;
  const teile = unlesbareSammlungsteile(roh);
  const text = unlesbarerGesamttext(roh, "sammlungen");
  if (teile.sammlungen.length > 0 || teile.meldungen.length > 0 || text) {
    unlesbaresBeiseitelegen({ ...teile, texte: text ? [text] : [] });
  }
}

/** Nur für Tests: den geprüften Text vergessen. */
export function sammlungenRetteZuruecksetzen(): void {
  sammlungenGeprueft = undefined;
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

/** Der beiseitegelegte Bestand, oder null. Nach der Datenschutzfrist wird er entfernt. */
export function unlesbarBestand(): UnlesbarBestand | null {
  try {
    const roh = parsen(speicher()?.getItem(UNLESBAR_SCHLUESSEL));
    if (!istObjekt(roh) || typeof roh.am !== "number") return null;
    if (geprueftesJetztMs() - roh.am > DATENSCHUTZFRIST_TAGE * 24 * 60 * 60 * 1000) {
      unlesbarVerwerfen();
      return null;
    }
    const liste = (x: unknown) => (Array.isArray(x) ? x : []);
    const b: UnlesbarBestand = {
      am: roh.am,
      sammlungen: liste(roh.sammlungen),
      meldungen: liste(roh.meldungen) as UnlesbarBestand["meldungen"],
      vorlagen: liste(roh.vorlagen),
      texte: liste(roh.texte) as UnlesbarBestand["texte"],
    };
    return b.sammlungen.length + b.meldungen.length + b.vorlagen.length + b.texte.length > 0 ? b : null;
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
 * andere unberührt — der Hinweis in der Oberfläche zählt dann trotzdem.
 */
export function unlesbaresBeiseitelegen(neu: Partial<Omit<UnlesbarBestand, "am">>): boolean {
  const s = speicher();
  if (!s) return false;
  if (!(neu.sammlungen?.length || neu.meldungen?.length || neu.vorlagen?.length || neu.texte?.length)) return false;
  const alt = unlesbarBestand() ?? leer(geprueftesJetztMs());
  const a = ergaenzt(alt.sammlungen, neu.sammlungen ?? []);
  const b = ergaenzt(alt.meldungen, neu.meldungen ?? []);
  const c = ergaenzt(alt.vorlagen, neu.vorlagen ?? []);
  const d = ergaenzt(alt.texte, neu.texte ?? []);
  if (a.neu + b.neu + c.neu + d.neu === 0) return false;
  try {
    s.setItem(
      UNLESBAR_SCHLUESSEL,
      JSON.stringify({ ...alt, sammlungen: a.liste, meldungen: b.liste, vorlagen: c.liste, texte: d.liste } satisfies UnlesbarBestand),
    );
    return true;
  } catch {
    return false;
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
