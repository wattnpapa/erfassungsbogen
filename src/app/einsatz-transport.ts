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

import { SCHEMA_VERSION, mitTransportVersion, type Erfassungsbogen } from "../model";
import { migriereBogen } from "./hilfen";
import type { Einsatzsammlung } from "./einsaetze";
import { entpackt, pdfStroeme } from "./pdf-stroeme";

// -------------------------------------------------------- JSON-Datei (Einsatz)

interface EinsatzDatei {
  typ: "eeb-einsatz";
  version: 1;
  einsatz: Einsatzsammlung;
}

/** Ganze Einsatz-Sammlung als Datei-Inhalt (menschenlesbar eingerückt). */
export function einsatzDateiInhalt(s: Einsatzsammlung): string {
  // Jeder enthaltene Bogen mit seiner Transport-Version: nur Übungsbögen
  // fordern das neue Schema, alles andere bleibt für alte Stände lesbar.
  const einsatz: Einsatzsammlung = {
    ...s,
    eintraege: s.eintraege.map((e) => ({ ...e, bogen: mitTransportVersion(e.bogen) })),
  };
  const datei: EinsatzDatei = { typ: "eeb-einsatz", version: 1, einsatz };
  return JSON.stringify(datei, null, 2);
}

function istBogen(x: unknown): x is Erfassungsbogen {
  const b = x as Erfassungsbogen;
  return (
    !!b &&
    typeof b.schemaVersion === "number" &&
    b.schemaVersion >= 2 &&
    b.schemaVersion <= SCHEMA_VERSION &&
    !!b.einheit &&
    !!b.einsatz &&
    Array.isArray(b.personal)
  );
}

/** Geparster JSON-Wert → Einsatz-Sammlung (Umschlag oder bloße Sammlung); wirft bei Ungültigem. */
function einsatzAusRoh(roh: unknown): Einsatzsammlung {
  const alsDatei = roh as Partial<EinsatzDatei>;
  const s = (alsDatei?.typ === "eeb-einsatz" && alsDatei.einsatz ? alsDatei.einsatz : roh) as Einsatzsammlung;
  if (!s || typeof s.id !== "string" || !Array.isArray(s.eintraege)) {
    throw new Error("Keine gültige Einsatz-Datei.");
  }
  s.eintraege = s.eintraege.filter((e) => e && istBogen(e.bogen)).map((e) => ({ ...e, bogen: migriereBogen(e.bogen) }));
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

/** Bogen oder Bogen-Array aus einem JSON-Text ziehen (gültige Bögen migriert). */
function boegenAusText(text: string): Erfassungsbogen[] {
  let daten: unknown;
  try {
    daten = JSON.parse(text);
  } catch {
    return [];
  }
  const kandidaten = Array.isArray(daten) ? daten : [daten];
  return kandidaten.filter(istBogen).map((b) => migriereBogen(b as Erfassungsbogen));
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
