/**
 * Transport einer Einsatz-Sammlung: Datei-Export/-Import (JSON) und Import von
 * Bögen aus empfangenen PDFs.
 *
 * PDF-Import bewusst OHNE PDF-Parser-Abhängigkeit: unsere Bögen liegen in der
 * PDF als eingebettetes JSON (ZUGFeRD-artig, siehe pdf-dokument.ts). Wir
 * durchsuchen die PDF nach Datenströmen, entpacken sie mit pako (FlateDecode)
 * bzw. lesen sie roh und behalten, was sich als gültiger Erfassungsbogen (oder
 * ein Array davon) parsen lässt. Robust gegen Fremd-Streams (Schrift, Inhalt),
 * die schlicht nicht als Bogen-JSON durchgehen.
 */

import { inflate } from "pako";
import { SCHEMA_VERSION, mitTransportVersion, type Erfassungsbogen } from "../model";
import { migriereBogen } from "./hilfen";
import type { Einsatzsammlung } from "./einsaetze";

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

/** Bytes → Latin1-String (chunkweise), um Stream-Marker per Offset zu finden. */
function latin1String(bytes: Uint8Array): string {
  let s = "";
  const schritt = 0x8000;
  for (let i = 0; i < bytes.length; i += schritt) {
    s += String.fromCharCode(...bytes.subarray(i, i + schritt));
  }
  return s;
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
  const latin1 = latin1String(bytes);
  const texte: string[] = [];
  const re = /stream\r?\n/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(latin1))) {
    const start = m.index + m[0].length;
    const ende = latin1.indexOf("endstream", start);
    if (ende < 0) continue;
    // Vor „endstream" steht i. d. R. ein Zeilenumbruch, der nicht zum Strom gehört.
    let bis = ende;
    if (latin1[bis - 1] === "\n") bis--;
    if (latin1[bis - 1] === "\r") bis--;
    const roh = bytes.subarray(start, bis);
    // 1) entpackt (FlateDecode)
    try {
      texte.push(new TextDecoder().decode(inflate(roh)));
    } catch {
      // kein Flate-Strom — ignorieren
    }
    // 2) roh (unkomprimiert eingebettet)
    try {
      texte.push(new TextDecoder().decode(roh));
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
