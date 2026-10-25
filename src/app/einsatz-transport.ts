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

import { SCHEMA_VERSION, mitTransportVersion, type Erfassungsbogen } from "@bos/eeb-format/model";
import { migriereBogen } from "./hilfen";
import { bogenBefund } from "./bogen-pruefung";
import type { Einsatzsammlung } from "@bos/meldekopf/einsaetze";
import { entpackt, pdfStroeme } from "./pdf-stroeme";
import type { ExportStand, ExportZiel } from "./export-stand";
import { lageAngabenPruefen, type LageAngaben } from "./lage-angaben";

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

interface EinsatzDatei {
  typ: "eeb-einsatz";
  version: 1;
  einsatz: Einsatzsammlung;
  /** Stände der Exporte je Format (R5-W6); fehlt in Dateien älterer Versionen. */
  staende?: Partial<Record<ExportZiel, ExportStand>>;
  /** Einsatzbeginn und Funkrufname des Lagemonitors (R7-K5); fehlt in Dateien älterer Versionen. */
  lage?: LageAngaben;
}

/**
 * Ganze Einsatz-Sammlung als Datei-Inhalt (menschenlesbar eingerückt). `staende`
 * (R5-W6) sind die Stände der Exporte dieses Geräts; sie reisen im Umschlag mit,
 * nicht in der Sammlung. Ein zugeschnittener Nachtrag (`nachtragGruende`) trägt
 * seine Gründe nicht in die Datei.
 */
export function einsatzDateiInhalt(s: Einsatzsammlung, staende?: Partial<Record<ExportZiel, ExportStand>>, lage?: LageAngaben): string {
  // Jeder enthaltene Bogen mit seiner Transport-Version: nur Übungsbögen
  // fordern das neue Schema, alles andere bleibt für alte Stände lesbar.
  const { nachtragGruende: _gruende, exportStaende: _staende, lageAngaben: _lage, fremdeOrte: _orte, ...rest } = s;
  const einsatz: Einsatzsammlung = {
    ...rest,
    eintraege: s.eintraege.map((e) => ({ ...e, bogen: mitTransportVersion(e.bogen) })),
  };
  const datei: EinsatzDatei = {
    typ: "eeb-einsatz",
    version: 1,
    einsatz,
    ...(staende && Object.keys(staende).length > 0 ? { staende } : {}),
    ...(lage && (lage.beginn != null || lage.funkruf != null) ? { lage } : {}),
  };
  return JSON.stringify(datei, null, 2);
}

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

/**
 * Ursachen der Bögen, die beim Einlesen einer Datei nicht übernommen wurden —
 * neben der Sammlung gemerkt, nicht an ihr: Sie gehört nie in den Speicher
 * (Audit Runde 5, R5-E1).
 */
const ablehnungen = new WeakMap<object, string[]>();

/** Ursachen der beim Einlesen von `s` abgelehnten Bögen („der Einheitstyp fehlt" …); leer, wenn alle lesbar waren. */
export function abgelehnteBoegen(s: Einsatzsammlung): string[] {
  return ablehnungen.get(s) ?? [];
}

/** Satz für abgelehnte Bögen: „1 von 3 Bögen ist unvollständig (der Einheitstyp fehlt) und wurde nicht übernommen." */
export function ablehnungsSatz(abgelehnt: readonly string[], gesamt: number): string {
  if (abgelehnt.length === 0) return "";
  const ursachen = [...new Set(abgelehnt)];
  const nenner = `${abgelehnt.length} von ${gesamt} ${gesamt === 1 ? "Bogen" : "Bögen"}`;
  const ist = abgelehnt.length === 1 ? "ist" : "sind";
  const grund = ursachen.length <= 2 ? ursachen.join(" bzw. ") : `${ursachen.slice(0, 2).join(" bzw. ")} u. a.`;
  return `${nenner} ${ist} unvollständig (${grund}) und wurde${abgelehnt.length === 1 ? "" : "n"} nicht übernommen.`;
}

/** Geparster JSON-Wert → Einsatz-Sammlung (Umschlag oder bloße Sammlung); wirft bei Ungültigem. */
function einsatzAusRoh(roh: unknown): Einsatzsammlung {
  const alsDatei = roh as Partial<EinsatzDatei>;
  const s = (alsDatei?.typ === "eeb-einsatz" && alsDatei.einsatz ? alsDatei.einsatz : roh) as Einsatzsammlung;
  if (!s || typeof s.id !== "string" || !Array.isArray(s.eintraege)) {
    throw new Error("Keine gültige Einsatz-Datei.");
  }
  // Die Stände der Exporte aus dem Umschlag gehören nicht in die Sammlung: Sie
  // hängen bis zum Import an ihr und werden dort übernommen und entfernt (R5-W6).
  delete (s as { nachtragGruende?: unknown }).nachtragGruende;
  delete (s as { fremdeOrte?: unknown }).fremdeOrte;
  if (alsDatei?.typ === "eeb-einsatz" && alsDatei.staende && typeof alsDatei.staende === "object") s.exportStaende = alsDatei.staende;
  else delete s.exportStaende;
  const lage = alsDatei?.typ === "eeb-einsatz" ? lageAngabenPruefen(alsDatei.lage) : undefined;
  if (lage) s.lageAngaben = lage;
  else delete s.lageAngaben;
  const gesamt = s.eintraege.length;
  const abgelehnt: string[] = [];
  const angenommen: typeof s.eintraege = [];
  for (const e of s.eintraege) {
    const r = e ? bogenAufnehmbar(e.bogen) : { bogen: null, ursache: "ist kein Bogen dieser App" };
    if (r.bogen) angenommen.push({ ...e, bogen: migriereBogen(r.bogen) });
    else abgelehnt.push(r.ursache ?? "unlesbar");
  }
  // Nichts Lesbares in einer Datei, die Bögen enthielt: ablehnen, statt eine
  // leere Sammlung anzulegen (R5-E1).
  if (gesamt > 0 && angenommen.length === 0) {
    throw new Error(`Kein Bogen in der Datei ist lesbar — ${ablehnungsSatz(abgelehnt, gesamt)}`);
  }
  s.eintraege = angenommen;
  if (abgelehnt.length > 0) ablehnungen.set(s, abgelehnt);
  return s;
}

/**
 * Datei-Text → Einsatz-Sammlung. Akzeptiert den {@link EinsatzDatei}-Umschlag
 * ebenso wie eine bloße Sammlung. Enthaltene Bögen werden schema-migriert;
 * kaputte Einträge fallen raus. Wirft bei grundsätzlich ungültiger Datei.
 */
export function einsatzAusDatei(text: string): Einsatzsammlung {
  let roh: unknown;
  try {
    roh = JSON.parse(text);
  } catch {
    throw new Error("Datei ist kein gültiges JSON.");
  }
  return einsatzAusRoh(roh);
}

// -------------------------------------------------------------- PDF-Import

/** Ist die gewählte Datei eine PDF? (Dateiendung ODER MIME-Typ — je nach Plattform fehlt eins davon.) */
export function istPdfDatei(datei: File): boolean {
  return datei.name.toLowerCase().endsWith(".pdf") || datei.type === "application/pdf";
}

/**
 * Bogen oder Bogen-Array aus einem JSON-Text ziehen (gültige Bögen migriert).
 * Kaputtes JSON oder etwas anderes als Bögen ergibt eine leere Liste — auch
 * für die JSON-Datei bei „Bögen einlesen…" (Audit Runde 2, R2-E5).
 */
export function boegenAusJsonText(text: string): Erfassungsbogen[] {
  return boegenAusText(text);
}

/** Wie {@link boegenAusJsonText}, dazu die Ursachen der abgelehnten Bögen (R5-E1). */
export function boegenAusJsonTextMitUrsachen(text: string): { boegen: Erfassungsbogen[]; abgelehnt: string[]; gesamt: number } {
  const alle = rohBoegen(text);
  const boegen: Erfassungsbogen[] = [];
  const abgelehnt: string[] = [];
  for (const k of alle) {
    // Was gar keinen Bogen andeutet (Sicherung, Vorlage …), zählt nicht als abgelehnter Bogen.
    if (!(k && typeof k === "object" && "schemaVersion" in k && "einheit" in k)) continue;
    const r = bogenAufnehmbar(k);
    if (r.bogen) boegen.push(migriereBogen(r.bogen));
    else abgelehnt.push(r.ursache ?? "unlesbar");
  }
  return { boegen, abgelehnt, gesamt: boegen.length + abgelehnt.length };
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

/**
 * Vollständige Einsatz-Sammlung aus den Bytes einer Sammel-PDF extrahieren —
 * der Umschlag „eeb-einsatz" (inkl. Zug-Zuordnung, Status, Historie) wird seit
 * dieser Fassung zusätzlich zu den Bögen eingebettet. `null`, wenn die PDF
 * keinen Umschlag trägt (ältere Sammel-PDFs, fremde PDFs).
 */
export function einsatzAusPdfBytes(bytes: Uint8Array): Einsatzsammlung | null {
  for (const text of streamTexte(bytes)) {
    let roh: unknown;
    try {
      roh = JSON.parse(text);
    } catch {
      continue;
    }
    // Nur der explizite Umschlag zählt: eine bloße Bogen-Liste ist KEINE Sammlung.
    if ((roh as Partial<EinsatzDatei>)?.typ !== "eeb-einsatz") continue;
    try {
      return einsatzAusRoh(roh);
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Was trägt diese PDF? „sammlung" = die ganze Einsatz-Sammlung eingebettet
 * (Sammel-PDF: verlustfrei über „Einsatz importieren…"), „boegen" = nur
 * eingebettete Bögen, „nur-qr" = keine Daten, allenfalls QR-Codes — ein
 * eingescannter Ausdruck. Für die Rückmeldung von „Bögen einlesen…": bei
 * „sammlung" auf den verlustfreien Weg verweisen, bei „nur-qr" sagen, dass
 * Zeiten und Abrückvermerke vom Papier nachzutragen sind (Audit Runde 2, R2-A1).
 */
export function pdfInhaltArt(bytes: Uint8Array): "sammlung" | "boegen" | "nur-qr" {
  if (einsatzAusPdfBytes(bytes)) return "sammlung";
  return boegenAusPdfBytes(bytes).length > 0 ? "boegen" : "nur-qr";
}
