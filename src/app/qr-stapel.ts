/**
 * Viele QR-Bilder auf einmal einlesen — der Meldekopf bekommt einen Ordner
 * (oder eine Mehrfachauswahl) voller abfotografierter/gescannter Bögen und
 * nicht dreißig Einzelklicks.
 *
 * Zwei Dinge unterscheiden den Stapel vom Einzelbild:
 *
 *  - Segmentierte Bögen liegen als MEHRERE Bilder vor. Welche Datei zu welchem
 *    Bogen gehört, steht erst im Code — die Teile werden deshalb über den
 *    ganzen Stapel hinweg nach ihrer Bogen-Kennung gesammelt, unabhängig von
 *    der Reihenfolge im Ordner. Was am Ende unvollständig bleibt, wird als
 *    Lücke gemeldet (mit den fehlenden Teilnummern) statt still verworfen.
 *  - Es wird nichts geöffnet und nichts gefragt: das Ergebnis ist ein Bericht,
 *    den der Aufrufer in eine Sammlung schiebt. Rückfragen je Bogen wären bei
 *    dreißig Dateien dreißig Dialoge.
 *
 * Reines Modul ohne DOM-Zugriff (Leser und Kompressor sind einsetzbar), damit
 * die Stapellogik ohne Bilder und ohne Browser testbar bleibt.
 */

import type { Erfassungsbogen } from "../model";
import {
  decodePayload,
  decodePayloadUrl,
  istSegmentNutzlast,
  istVorlageNutzlast,
  parseSegmentUrl,
  payloadAusText,
  segmentePayload,
  type Kompressor,
  type SegmentTeil,
} from "../codec";
import { browserKompressor } from "./hilfen";
import { qrAusBild } from "./qr-bild";

/** Eine Datei des Stapels — Name nur für den Bericht, gelesen wird der Blob. */
export interface StapelDatei {
  name: string;
  blob: Blob;
}

/** Ein fertig gelesener Bogen samt Rohbytes (erhalten die fremde Signatur). */
export interface StapelFund {
  /** Dateiname(n), aus denen der Bogen stammt — bei Segmenten mehrere. */
  datei: string;
  bogen: Erfassungsbogen;
  payload: Uint8Array | null;
}

export type StapelGrund = "kein-code" | "kein-bogen" | "vorlage";

/** Eine Datei, aus der kein Bogen wurde. */
export interface StapelFehler {
  datei: string;
  grund: StapelGrund;
  text: string;
}

/** Ein angefangener, aber unvollständiger mehrteiliger Bogen. */
export interface StapelLuecke {
  dateien: string[];
  haben: number;
  anzahl: number;
  /** Teilnummern, die im Stapel fehlen — die Ansage ans Feld. */
  fehlen: number[];
}

export interface StapelErgebnis {
  /** Wie viele Dateien tatsächlich angefasst wurden (bei Abbruch weniger). */
  gelesen: number;
  funde: StapelFund[];
  fehler: StapelFehler[];
  luecken: StapelLuecke[];
  abgebrochen: boolean;
}

export interface StapelOptionen {
  /** QR-Text aus einer Bilddatei; null = kein Code drin. Vorgabe: {@link qrAusBild}. */
  lesen?: (datei: Blob) => Promise<string | null>;
  kompressor?: Kompressor;
  /** Nach jeder Datei aufgerufen — für die Fortschrittszeile. */
  beiFortschritt?: (fertig: number, gesamt: number, datei: string) => void;
  /** Wird vor jeder Datei gefragt; true = Rest stehen lassen. */
  abbruch?: () => boolean;
}

const BILD_ENDUNGEN = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".heic", ".heif", ".avif", ".tif", ".tiff"];

/**
 * Ist das eine Bilddatei? Bei der Ordnerauswahl kommt alles mit, was drin liegt
 * — PDFs, Textdateien, macOS-Ressourcedateien (`._foo.jpg`). Der MIME-Typ fehlt
 * je nach Browser/Dateisystem, deshalb zusätzlich die Endung.
 */
export function istBilddatei(name: string, typ = ""): boolean {
  const basis = name.slice(name.lastIndexOf("/") + 1);
  if (basis.startsWith(".")) return false; // versteckte Datei / macOS-Beifang
  if (typ.startsWith("image/")) return true;
  const klein = basis.toLowerCase();
  return BILD_ENDUNGEN.some((e) => klein.endsWith(e));
}

/** Sortierschlüssel: „bogen2.jpg" vor „bogen10.jpg" — Ordner liefern beliebige Reihenfolge. */
function nachNamen(a: StapelDatei, b: StapelDatei): number {
  return a.name.localeCompare(b.name, "de", { numeric: true, sensitivity: "base" });
}

interface Sammelstand {
  teile: SegmentTeil[];
  dateien: string[];
  anzahl: number;
}

/**
 * Den ganzen Stapel lesen. Läuft bewusst nacheinander: dreißig Bilder parallel
 * zu dekodieren heißt dreißig entpackte Bitmaps gleichzeitig im Speicher — auf
 * dem Tablet im Feld der sichere Absturz.
 */
export async function qrStapelLesen(dateien: StapelDatei[], optionen: StapelOptionen = {}): Promise<StapelErgebnis> {
  const lesen = optionen.lesen ?? qrAusBild;
  const k = optionen.kompressor ?? browserKompressor;
  const liste = [...dateien].sort(nachNamen);
  const funde: StapelFund[] = [];
  const fehler: StapelFehler[] = [];
  // Schlüssel: Bogen-Kennung + Teilzahl — genau das, was Teile aneinanderbindet.
  const offene = new Map<string, Sammelstand>();
  let gelesen = 0;
  let abgebrochen = false;

  for (const datei of liste) {
    if (optionen.abbruch?.()) {
      abgebrochen = true;
      break;
    }
    let text: string | null = null;
    try {
      text = await lesen(datei.blob);
    } catch {
      text = null; // defektes/unlesbares Bild zählt wie „kein Code drin"
    }
    gelesen++;
    optionen.beiFortschritt?.(gelesen, liste.length, datei.name);
    if (!text) {
      fehler.push({ datei: datei.name, grund: "kein-code", text: "Kein QR-Code im Bild gefunden." });
      continue;
    }
    // Vorlagen sind keine Meldung: sie beschreiben eine Soll-Einheit, keine
    // angetretene. Sie kommentarlos aufzunehmen wäre eine Falschmeldung.
    if (istVorlageNutzlast(text)) {
      fehler.push({ datei: datei.name, grund: "vorlage", text: "Vorlage statt Meldung — nicht aufgenommen." });
      continue;
    }
    if (istSegmentNutzlast(text)) {
      try {
        const teil = parseSegmentUrl(text);
        const schluessel = `${teil.id}.${teil.anzahl}`;
        const stand = offene.get(schluessel) ?? { teile: [], dateien: [], anzahl: teil.anzahl };
        offene.set(schluessel, stand);
        if (stand.teile.some((t) => t.teilNr === teil.teilNr)) continue; // dasselbe Blatt zweimal fotografiert
        stand.teile.push(teil);
        stand.dateien.push(datei.name);
        if (stand.teile.length === teil.anzahl) {
          offene.delete(schluessel);
          const payload = segmentePayload(stand.teile);
          funde.push({ datei: stand.dateien.join(" + "), bogen: decodePayload(payload, k), payload });
        }
      } catch {
        fehler.push({ datei: datei.name, grund: "kein-bogen", text: "Teil eines Bogens, aber nicht lesbar." });
      }
      continue;
    }
    try {
      funde.push({ datei: datei.name, bogen: decodePayloadUrl(text, k), payload: payloadAusText(text) });
    } catch {
      fehler.push({ datei: datei.name, grund: "kein-bogen", text: "QR-Code enthält keinen Erfassungsbogen." });
    }
  }

  const luecken: StapelLuecke[] = [...offene.values()].map((stand) => {
    const da = new Set(stand.teile.map((t) => t.teilNr));
    const fehlen: number[] = [];
    for (let n = 1; n <= stand.anzahl; n++) if (!da.has(n)) fehlen.push(n);
    return { dateien: stand.dateien, haben: stand.teile.length, anzahl: stand.anzahl, fehlen };
  });

  return { gelesen, funde, fehler, luecken, abgebrochen };
}

/**
 * Der Bericht in Sätzen — eine Zeile je Sachverhalt, damit im Feld ablesbar
 * bleibt, was NICHT angekommen ist. `neu`/`uebersprungen` liefert der Aufrufer,
 * denn erst die Sammlung weiß, was doppelt war.
 */
export function stapelBericht(e: StapelErgebnis, neu: number, uebersprungen: number): string[] {
  const zeilen: string[] = [];
  zeilen.push(
    `${e.gelesen} ${e.gelesen === 1 ? "Bild" : "Bilder"} gelesen — ${neu} ${neu === 1 ? "Bogen" : "Bögen"} aufgenommen` +
      (uebersprungen > 0 ? `, ${uebersprungen} bereits vorhanden` : "") +
      ".",
  );
  if (e.abgebrochen) zeilen.push("Abgebrochen — die restlichen Bilder wurden nicht gelesen.");
  for (const l of e.luecken) {
    zeilen.push(
      `Unvollständiger mehrteiliger Bogen: ${l.haben} von ${l.anzahl} Teilen da (${l.dateien.join(", ")}) — ` +
        `es ${l.fehlen.length === 1 ? "fehlt Teil" : "fehlen die Teile"} ${l.fehlen.join(", ")}.`,
    );
  }
  for (const f of e.fehler) zeilen.push(`${f.datei}: ${f.text}`);
  return zeilen;
}
