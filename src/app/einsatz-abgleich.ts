/**
 * Abgleich einer importierten Einsatz-Sammlung mit dem Stand dieses Geräts.
 *
 * Der geteilte Kern (`einsatzImportieren`, Submodul) führt nur über die
 * Eintrags-ID zusammen: Meldungen, die das Gerät noch nicht kennt, kommen
 * dazu, bekannte bleiben unberührt. Was die Führungsstelle des anderen Geräts
 * an bekannten Einheiten getan hat — Abrücken, Zug, Auftrag/Notiz,
 * Eintreffzeit —, ging beim Rückimport still verloren. Die Quittung sagte
 * „0 neue Meldung(en) ergänzt", und beide Geräte führten danach verschiedene
 * Lagen (Audit Runde 3, R3-W1).
 *
 * Diese Schicht legt sich um den Kern, ohne ihn zu ändern: Sie merkt sich den
 * Stand vor dem Import, lässt den Kern die neuen Meldungen anhängen und
 * gleicht danach je Einheit die Zusätze der Führungsstelle ab.
 *
 * Regel je Feld (Status samt Abrückzeit, Zug, Auftrag/Notiz, Eintreffzeit):
 *  1. Gleich → nichts zu tun.
 *  2. Den Verlauf der Führungsstelle (`vermerke`, mit Uhrzeit) tragen beide
 *     Stände mit. Hat nur eine Seite das Feld geändert, seit sich die Stände
 *     zuletzt kannten (Vermerk, den die andere Seite nicht hat), gilt diese.
 *  3. Haben beide Seiten es geändert, gilt der jüngere Vermerk — und der
 *     Abgleich nennt das als Widerspruch in der Quittung und im Verlauf der
 *     Einheit („Abgleich: …"), damit nichts still überschrieben wird.
 *  4. Ohne Vermerk (ältere Sammlungen, Zug aus einem Bündel): Ist der Wert
 *     hier leer, wird er übernommen. Für den Status zählt die Abrückzeit als
 *     Änderungszeitpunkt. Sonst bleibt der Wert dieses Geräts stehen, und der
 *     Unterschied wird als Widerspruch genannt.
 *
 * Kein Schemawechsel: die Felder sind die App-Zusätze aus eintrag-zeiten.ts,
 * die schon heute mit Sammel-PDF und Einsatz-Transport reisen.
 */

import { MeldeStatus, type MeldeEintrag } from "@bos/meldekopf/einsaetze";
import { zeitKurz, type FuehrungsVermerk } from "./eintrag-zeiten";

export type Feld = "status" | "zug" | "notiz" | "eintreffzeit";


/**
 * Zu welchem Feld gehört ein Vermerk? Die Texte schreibt eintrag-zeiten.ts
 * (`statusMitZeitSetzen`, `abrueckzeitSetzen`, `zugSetzen`, `notizSetzen`,
 * `eintreffzeitSetzen`); „Abgleich: …" gehört zu keinem Feld.
 */
export function vermerkFeld(text: string): Feld | null {
  if (/^(Abgerückt|Wieder als anwesend geführt|Status geändert|Abrückzeit korrigiert)/.test(text)) return "status";
  if (/^Zug/.test(text)) return "zug";
  if (/^Auftrag\/Notiz/.test(text)) return "notiz";
  if (/^Eintreffzeit korrigiert/.test(text)) return "eintreffzeit";
  return null;
}

/** Kennung eines Vermerks für den Vergleich zweier Stände. */
export function vermerkKennung(einheitSchl: string, v: FuehrungsVermerk): string {
  return `${einheitSchl}|${v.zeit}|${v.text}`;
}





/** Wert eines Felds als Vergleichs- und Anzeigegröße. */
interface Wert {
  gleichheit: string;
  text: string;
  leer: boolean;
}

/**
 * Vergleichswert eines Felds der Einheit (Status samt Abrückzeit, Zug, Auftrag,
 * Eintreffzeit) — Grundlage der Stände „was hat sich seit dem Export
 * geändert?" (export-stand.ts, R4-K1): Es zählt der Zustand, nicht die Zahl der
 * Vermerke, damit „Abrücken" und sein „Rückgängig" nichts Neues ergeben.
 */
export function feldGleichheit(feld: Feld, e: MeldeEintrag): string {
  return wert(feld, e).gleichheit;
}

/**
 * Felder der Stände „was hat sich seit dem Export geändert?": die vier Felder
 * des Abgleichs und dazu die geltende Fassung selbst (R5-W1). Der Wechsel der
 * geltenden Fassung („Diese Fassung gilt", Vorrang vom anderen Gerät) ist eine
 * Änderung der Lage, auch wenn kein neuer Eintrag entstand — der Stab plant
 * sonst weiter mit der Schnellerfassung, während der Meldekopf den Bogen führt.
 * Der Abgleich selbst gleicht „fassung" nicht nach den Regeln der übrigen Felder
 * ab: Den Vorrang trägt `ersetztDurch`.
 */
export type StandFeld = Feld | "fassung";

export function standGleichheit(feld: StandFeld, e: MeldeEintrag): string {
  return feld === "fassung" ? e.id : feldGleichheit(feld, e);
}

function wert(feld: Feld, e: MeldeEintrag): Wert {
  switch (feld) {
    case "status": {
      const s = e.status;
      if (s === MeldeStatus.ABGERUECKT) {
        return {
          gleichheit: `1|${e.abgerueckAm ?? ""}`,
          text: e.abgerueckAm != null ? `abgerückt ${zeitKurz(e.abgerueckAm)}` : "abgerückt",
          leer: false,
        };
      }
      if (s === MeldeStatus.AUFGEGANGEN) return { gleichheit: "2", text: "zusammengeführt", leer: false };
      return { gleichheit: "0", text: "anwesend", leer: true };
    }
    case "zug":
      return e.zugEtikett
        ? { gleichheit: e.zugEtikett, text: `Zug „${e.zugEtikett}“`, leer: false }
        : { gleichheit: "", text: "ohne Zug", leer: true };
    case "notiz":
      return e.notiz
        ? { gleichheit: e.notiz, text: `Auftrag „${e.notiz}“`, leer: false }
        : { gleichheit: "", text: "ohne Auftrag", leer: true };
    case "eintreffzeit": {
      const t = e.eingetroffenAm ?? e.empfangenAm;
      return { gleichheit: String(t), text: `eingetroffen ${zeitKurz(t)}`, leer: false };
    }
  }
}





/** Was sich an einer Einheit durch den Abgleich geändert hat. */
export interface AbgleichAenderung {
  einheitSchluessel: string;
  /** Kurzname der Einheit („Ulm", sonst Anzeigename). */
  einheit: string;
  /** Übernommene Werte, z. B. „abgerückt 20:47", „Zug „2. TZ“". */
  was: string[];
}

/** Beide Geräte haben dasselbe Feld geändert — der jüngere Stand gilt. */
export interface AbgleichWiderspruch {
  einheitSchluessel: string;
  einheit: string;
  feld: string;
  hier: string;
  datei: string;
  /** Welcher Wert jetzt gilt. */
  gilt: "hier" | "datei";
}

export interface AbgleichErgebnis {
  neuerEinsatz: boolean;
  /** Neu angehängte Meldungen (Kern). */
  hinzugefuegt: number;
  aktualisiert: AbgleichAenderung[];
  widersprueche: AbgleichWiderspruch[];
  /** Eintrags-IDs, die durch den Import hierher kamen. */
  neueIds: string[];
  /** Vermerk-Kennungen, die durch den Import hierher kamen oder dabei entstanden. */
  neueVermerke: string[];
  /**
   * Je Einheit die Felder, deren Wert jetzt dem der Datei entspricht — das
   * andere Gerät kennt sie (R4-W7). Wo hier ein anderer Wert gilt (Widerspruch,
   * hier behalten), fehlt das Feld: das hat das andere Gerät noch nicht.
   */
  bekannt: Record<string, Partial<Record<StandFeld, string>>>;
}





export const FELDER: Feld[] = ["status", "zug", "notiz", "eintreffzeit"];

/** Alle Felder der Stände: {@link FELDER} und die geltende Fassung (R5-W1). */
export const STAND_FELDER: StandFeld[] = [...FELDER, "fassung"];




/** Ein eingeklappter Abschnitt einer Quittung. */
export interface Einzelheit {
  titel: string;
  zeilen: string[];
}




