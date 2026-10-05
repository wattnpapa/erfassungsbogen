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

import type { Erfassungsbogen } from "@bos/eeb-format/model";
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
} from "@bos/eeb-format/codec";
import { browserKompressor } from "./hilfen";
import { qrAlleAusBild } from "./qr-bild";

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
  /**
   * Bis wann die vorhandenen Teile für den nächsten Durchgang gemerkt bleiben
   * (nur mit {@link StapelOptionen.merker}); ms seit Epoche.
   */
  gemerktBis?: number;
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
  /**
   * QR-Text(e) aus einer Bilddatei; null oder leer = kein Code drin. Vorgabe:
   * {@link qrAlleAusBild} — alle Codes des Bildes, denn eine Bogenseite trägt
   * bis zu zwei Teile (R2-A2).
   */
  lesen?: (datei: Blob) => Promise<string | string[] | null>;
  /**
   * Teile unvollständiger Bögen über Durchgänge hinweg merken: Was dieser
   * Durchgang nicht vervollständigt, liegt beim nächsten „Bögen einlesen…"
   * wieder bereit (R2-A2). Ohne Merker verfällt es wie bisher mit dem Stapel.
   */
  merker?: TeileMerker;
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
 * Wie lange ein angefangener mehrteiliger Bogen auf seine übrigen Teile
 * wartet. Eine Stunde reicht für „Seite für Seite fotografieren, zwischendurch
 * gestört werden"; länger soll ein halber Personalbestand nicht unbemerkt im
 * Arbeitsspeicher liegen.
 */
export const TEILE_ABLAUF_MS = 60 * 60_000;

/**
 * Gedächtnis für Teile mehrteiliger Bögen zwischen zwei Einlese-Durchgängen.
 *
 * Vorher verfiel ein gelesenes „Teil 1 / 2" mit dem Ende des Durchgangs: Wer
 * die Sammel-PDF Seite für Seite fotografierte und jede Seite einzeln einlas,
 * bekam bei jedem großen Bogen „0 Bögen aufgenommen — es fehlt Teil 1"
 * (Audit Runde 2, R2-A2). Bewusst nur im Arbeitsspeicher und mit Ablauf: die
 * Teile tragen Personendaten, sind aber noch keine Meldung — nach einem
 * Neuladen oder einer Stunde ohne neues Teil sind sie weg (das Blatt liegt ja
 * noch da).
 */
export class TeileMerker {
  private stand = new Map<string, Sammelstand & { zuletzt: number }>();

  constructor(
    private readonly ablaufMs = TEILE_ABLAUF_MS,
    private readonly uhr: () => number = () => Date.now(),
  ) {}

  /** Die noch gültigen Sammelstände samt letztem Eingang — abgelaufene fallen dabei weg. */
  entnehmen(): { offen: Map<string, Sammelstand>; zuletzt: Map<string, number> } {
    const jetzt = this.uhr();
    const offen = new Map<string, Sammelstand>();
    const zuletzt = new Map<string, number>();
    for (const [schluessel, s] of this.stand) {
      if (jetzt - s.zuletzt > this.ablaufMs) continue;
      offen.set(schluessel, { teile: [...s.teile], dateien: [...s.dateien], anzahl: s.anzahl });
      zuletzt.set(schluessel, s.zuletzt);
    }
    this.stand.clear();
    return { offen, zuletzt };
  }

  /**
   * Was am Ende eines Durchgangs unvollständig blieb, für den nächsten
   * ablegen. Die Frist läuft ab dem letzten NEUEN Teil — ein Durchgang ohne
   * Fortschritt für diesen Bogen verlängert sie nicht. Rückgabe: gemerkt bis.
   */
  ablegen(offen: Map<string, Sammelstand>, geaendert: Set<string>, zuletzt: Map<string, number>): Map<string, number> {
    const jetzt = this.uhr();
    const bis = new Map<string, number>();
    for (const [schluessel, s] of offen) {
      const z = geaendert.has(schluessel) ? jetzt : (zuletzt.get(schluessel) ?? jetzt);
      this.stand.set(schluessel, { ...s, zuletzt: z });
      bis.set(schluessel, z + this.ablaufMs);
    }
    return bis;
  }

  /** Gemerkte Teile bewusst wegwerfen („Gemerkte Teile verwerfen"). */
  verwerfen(): void {
    this.stand.clear();
  }

  /** Wie viele angefangene Bögen (noch nicht abgelaufen) gemerkt sind. */
  anzahl(): number {
    const jetzt = this.uhr();
    return [...this.stand.values()].filter((s) => jetzt - s.zuletzt <= this.ablaufMs).length;
  }
}

// Ein Merker je Einsatz: Teile, die für Einsatz A gelesen wurden, sollen nicht
// in Einsatz B einen Bogen vervollständigen.
const merkerJeEinsatz = new Map<string, TeileMerker>();

/** Der Teile-Merker des Einsatzes (legt ihn beim ersten Mal an). */
export function teileMerker(einsatzId: string): TeileMerker {
  let m = merkerJeEinsatz.get(einsatzId);
  if (!m) merkerJeEinsatz.set(einsatzId, (m = new TeileMerker()));
  return m;
}

/**
 * Den ganzen Stapel lesen. Läuft bewusst nacheinander: dreißig Bilder parallel
 * zu dekodieren heißt dreißig entpackte Bitmaps gleichzeitig im Speicher — auf
 * dem Tablet im Feld der sichere Absturz.
 */
export async function qrStapelLesen(dateien: StapelDatei[], optionen: StapelOptionen = {}): Promise<StapelErgebnis> {
  const lesen = optionen.lesen ?? qrAlleAusBild;
  const k = optionen.kompressor ?? browserKompressor;
  const liste = [...dateien].sort(nachNamen);
  const funde: StapelFund[] = [];
  const fehler: StapelFehler[] = [];
  // Schlüssel: Bogen-Kennung + Teilzahl — genau das, was Teile aneinanderbindet.
  // Mit Merker beginnt der Durchgang bei den Teilen der vorigen (R2-A2).
  const gemerkt = optionen.merker?.entnehmen();
  const offene = gemerkt?.offen ?? new Map<string, Sammelstand>();
  const geaendert = new Set<string>();
  let gelesen = 0;
  let abgebrochen = false;

  for (const datei of liste) {
    if (optionen.abbruch?.()) {
      abgebrochen = true;
      break;
    }
    let texte: string[] = [];
    try {
      const roh = await lesen(datei.blob);
      texte = (Array.isArray(roh) ? roh : [roh]).filter((t): t is string => !!t);
    } catch {
      texte = []; // defektes/unlesbares Bild zählt wie „kein Code drin"
    }
    gelesen++;
    optionen.beiFortschritt?.(gelesen, liste.length, datei.name);
    if (texte.length === 0) {
      fehler.push({ datei: datei.name, grund: "kein-code", text: "Kein QR-Code im Bild gefunden." });
      continue;
    }
    // Ein Foto einer Bogenseite kann zwei Codes tragen (R2-A2): jeden Code
    // wie ein eigenes Bild behandeln, unter demselben Dateinamen.
    for (const text of texte) {
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
          if (!stand.dateien.includes(datei.name)) stand.dateien.push(datei.name);
          geaendert.add(schluessel);
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
  }

  // Leere Stände (nur unlesbare Teile) nicht mitschleppen.
  for (const [schluessel, stand] of offene) if (stand.teile.length === 0) offene.delete(schluessel);
  const gemerktBis = optionen.merker?.ablegen(offene, geaendert, gemerkt?.zuletzt ?? new Map());
  const luecken: StapelLuecke[] = [...offene].map(([schluessel, stand]) => {
    const da = new Set(stand.teile.map((t) => t.teilNr));
    const fehlen: number[] = [];
    for (let n = 1; n <= stand.anzahl; n++) if (!da.has(n)) fehlen.push(n);
    const bis = gemerktBis?.get(schluessel);
    return { dateien: stand.dateien, haben: stand.teile.length, anzahl: stand.anzahl, fehlen, ...(bis != null ? { gemerktBis: bis } : {}) };
  });

  return { gelesen, funde, fehler, luecken, abgebrochen };
}

function uhrzeit(ms: number): string {
  return new Date(ms).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
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
        `es ${l.fehlen.length === 1 ? "fehlt Teil" : "fehlen die Teile"} ${l.fehlen.join(", ")}.` +
        // Mit Merker ist das kein Verlust, sondern ein Zwischenstand (R2-A2).
        (l.gemerktBis != null
          ? ` Die gelesenen Teile bleiben bis ${uhrzeit(l.gemerktBis)} Uhr gemerkt — das fehlende Blatt einfach als weiteres Bild einlesen.`
          : ""),
    );
  }
  for (const f of e.fehler) zeilen.push(`${f.datei}: ${f.text}`);
  if (neu > 0) zeilen.push(STIFT_HINWEIS, LAGE_NACHTRAGEN_HINWEIS);
  return zeilen;
}

/**
 * Ein Foto zeigt Papier — und auf Papier wird mit dem Stift korrigiert. Der
 * Code trägt aber den gedruckten Stand; die Korrektur ging beim Einlesen still
 * verloren (Audit Runde 2, R2-A4). Der Ausdruck trägt dafür neben dem Code das
 * Kästchen „von Hand geändert" und den Stand, die Karte zeigt denselben Stand.
 */
export const STIFT_HINWEIS =
  "Von Hand korrigierte Angaben auf dem Ausdruck stecken nicht im Code: Ist dort „von Hand geändert“ " +
  "angekreuzt oder etwas durchgestrichen, die Karte gegen das Blatt prüfen (gleicher „Stand“) und in der App nachtragen.";

/**
 * Was ein Bogen aus Code oder Datei NICHT mitbringt: der QR-Code trägt nur den
 * Bogen der Einheit. Eintreffzeit, Abrückvermerk, Zug und Auftrag gehören dem
 * Meldekopf und stehen auf dem Papier nur als Text (Übergabe-Übersicht und
 * Kasten „Stand am Meldekopf“ je Bogen). Ohne diesen Satz stand eine
 * abgerückte Einheit nach dem Einlesen still wieder als anwesend und zählend
 * da, mit der Scan-Uhrzeit als Eintreffzeit (Audit Runde 2, R2-A1).
 * Folgemeldungen erben Zeit, Zug und Auftrag ihrer Vorgängerin — der Satz
 * betrifft deshalb die neu aufgenommenen Einheiten.
 */
export const LAGE_NACHTRAGEN_HINWEIS =
  "Eintreffzeit der neu aufgenommenen Einheiten ist die Zeit des Einlesens, und sie stehen als anwesend; " +
  "Abrückvermerk, Zug und Auftrag stecken nicht im Bogen. Stammen die Bögen aus einer Sammel-PDF: oben in der " +
  "Einsatzansicht „Lage vom Papier abgleichen…“ — dort für alle eben eingelesenen Einheiten Eintreffzeit, Status " +
  "und Zug von Seite 1 (Übergabe-Übersicht) bzw. dem Kasten „Stand am Meldekopf“ in einem Schritt eintragen. " +
  "Bis dahin tragen die Karten „vom Papier, Zeiten prüfen“.";

/**
 * Hinweis für „Bögen einlesen…“ mit einer Sammel-PDF, die die ganze Sammlung
 * eingebettet trägt, wenn bei der Rückfrage „Nur die Bögen“ gewählt wurde:
 * Zeiten, Abrückvermerke, Züge und Siegel sind dann nicht mitgekommen (R2-A1).
 * Seit R3-W3 bietet die Rückfrage die Übernahme in die offene Sammlung an.
 */
export const SAMMLUNG_IN_PDF_HINWEIS =
  "Die PDF enthält die vollständige Einsatz-Sammlung mit Zeiten, Abrückvermerken, Zügen und Siegeln — " +
  "übernommen wurden nur die Bögen. Für alles die PDF erneut einlesen und „Übernehmen“ wählen.";

/**
 * Rückmeldezeile für „Bögen einlesen…“ (JSON-/PDF-Dateien) und für eine PDF
 * ohne Sammlung über „Einsatz importieren…“. Bei einer Sammel-PDF mit
 * eingebetteter Sammlung verweist sie auf den verlustfreien Weg; `lage`
 * hängt — wie beim Bilderstapel — an, was aus den Bögen allein nicht
 * zurückkommt (R2-A1). Einzelne Bögen einer Einheit (JSON, eigener PDF-Bogen)
 * brauchen den Satz nicht: dort IST der Eingang die Eintreffzeit.
 */
export function dateiImportMeldung(
  neu: number,
  uebersprungen: number,
  zusatz: { sammlungInPdf?: boolean; lage?: boolean } = {},
): string {
  // Numerus statt „Bogen/Bögen" (Audit Runde 2, R2-K8).
  const teile = [`${neu} ${neu === 1 ? "Bogen" : "Bögen"} aufgenommen${uebersprungen ? `, ${uebersprungen} bereits vorhanden` : ""}.`];
  if (zusatz.sammlungInPdf) teile.push(SAMMLUNG_IN_PDF_HINWEIS);
  else if (zusatz.lage && neu > 0) teile.push(LAGE_NACHTRAGEN_HINWEIS);
  return teile.join(" ");
}
