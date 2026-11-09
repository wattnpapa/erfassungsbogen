/**
 * Transport einer Einsatz-Sammlung: Datei-Export/-Import (JSON) und Import von
 * Bögen aus empfangenen PDFs.
 *
 * PDF-Import bewusst OHNE PDF-Parser-Abhängigkeit: unsere Bögen liegen in der
 * PDF als eingebettetes JSON (ZUGFeRD-artig, siehe pdf-dokument.ts). Wir
 * durchsuchen die PDF nach Datenströmen (pdf-stroeme.ts), entpacken sie und
 * behalten, was sich als gültiger Erfassungsbogen (oder ein Array davon)
 * parsen lässt. Robust gegen Fremd-Streams (Schrift, Inhalt), die schlicht
 * nicht als Bogen-JSON durchgehen.
 */

import { SCHEMA_VERSION, type Erfassungsbogen } from "@bos/eeb-format/model";
import { migriereBogen } from "./hilfen";
import { bogenBefund } from "./bogen-pruefung";
import { entpackt, pdfStroeme } from "./pdf-stroeme";
import type { ExportStand, ExportZiel } from "./export-stand";
import { type LageAngaben } from "./lage-angaben";

declare module "@bos/meldekopf/einsaetze" {
  interface Einsatzsammlung {
    /**
     * Nur im Umschlag eines Nachtrags („nur neue Bögen", Audit Runde 4, R4-W4):
     * ab wann (Date.now()). Die Datei enthält dann nur einen Teil der Lage; das
     * Einlesen auf einem Gerät ohne diese Sammlung fragt nach. Wird nie in den
     * Speicher übernommen.
     */
    nachtragSeit?: number;
    /**
     * Nur im Umschlag der Datei (nie im Speicher): die Stände der Exporte je
     * Format — Kennungen, Prüfsummen und Zeitpunkt, keine Personendaten. Die
     * Ablösung weiß damit, was der Stab schon hat (Audit Runde 5, R5-W6). Das
     * Einlesen übernimmt sie in den Gerätespeicher (`exportStaendeUebernehmen`)
     * und entfernt das Feld.
     */
    exportStaende?: Partial<Record<ExportZiel, ExportStand>>;
    /**
     * Nur im Umschlag der Datei (nie im Speicher): Einsatzbeginn und
     * Funkrufname des Lagemonitors des abgebenden Geräts (R7-K5). Das Einlesen
     * setzt sie, wenn hier noch nichts gesetzt ist (`lageAngabenUebernehmen`),
     * und entfernt das Feld.
     */
    lageAngaben?: LageAngaben;
  }
}

// -------------------------------------------------------- JSON-Datei (Einsatz)



/**
 * Ist `x` ein Bogen, den die App lesen kann? Prüft Schema-Version und
 * Pflichtfelder (bogen-pruefung.ts, R5-E1), ergänzt Harmloses und nennt sonst
 * die Ursache in Alltagssprache.
 */
function bogenAufnehmbar(x: unknown): { bogen: Erfassungsbogen | null; ursache?: string; ergaenzt?: string[] } {
  const v = (x as { schemaVersion?: unknown } | null)?.schemaVersion;
  if (typeof v === "number" && v > SCHEMA_VERSION) return { bogen: null, ursache: "stammt aus einer neueren Version der App" };
  if (typeof v !== "number" || v < 2) return { bogen: null, ursache: "ist kein Bogen dieser App" };
  const r = bogenBefund(x);
  return r.ok ? { bogen: r.bogen, ergaenzt: r.ergaenzt } : { bogen: null, ursache: r.ursache };
}






// -------------------------------------------------------------- PDF-Import

/** Ist die gewählte Datei eine PDF? (Dateiendung ODER MIME-Typ — je nach Plattform fehlt eins davon.) */
export function istPdfDatei(datei: File): boolean {
  return datei.name.toLowerCase().endsWith(".pdf") || datei.type === "application/pdf";
}



function rohBoegen(text: string): unknown[] {
  let daten: unknown;
  try {
    daten = JSON.parse(text);
  } catch {
    return [];
  }
  return Array.isArray(daten) ? daten : [daten];
}

function boegenAusText(text: string): Erfassungsbogen[] {
  return rohBoegen(text)
    .map((k) => bogenAufnehmbar(k).bogen)
    .filter((b): b is Erfassungsbogen => b != null)
    .map((b) => migriereBogen(b));
}

/**
 * Alle Datenströme einer PDF als Texte liefern — je Strom entpackt
 * (FlateDecode) und roh. Nicht dekodierbare Ströme fallen still raus;
 * die Aufrufer filtern ohnehin auf gültiges Bogen-/Einsatz-JSON.
 */
function streamTexte(bytes: Uint8Array): string[] {
  const texte: string[] = [];
  for (const strom of pdfStroeme(bytes)) {
    // 1) entpackt (FlateDecode)
    const roh = entpackt(strom);
    if (roh) {
      try {
        texte.push(new TextDecoder().decode(roh));
      } catch {
        // nicht dekodierbar — ignorieren
      }
    }
    // 2) roh (unkomprimiert eingebettet)
    try {
      texte.push(new TextDecoder().decode(strom.daten));
    } catch {
      // nicht dekodierbar — ignorieren
    }
  }
  return texte;
}

/**
 * Erfassungsbögen aus den Bytes einer PDF extrahieren (eingebettetes JSON).
 * Dubletten (gleicher Inhalt) werden entfernt.
 */
export function boegenAusPdfBytes(bytes: Uint8Array): Erfassungsbogen[] {
  const gefunden: Erfassungsbogen[] = [];
  const gesehen = new Set<string>();
  for (const text of streamTexte(bytes)) {
    for (const b of boegenAusText(text)) {
      const schl = JSON.stringify(b);
      if (!gesehen.has(schl)) {
        gesehen.add(schl);
        gefunden.push(b);
      }
    }
  }
  return gefunden;
}


