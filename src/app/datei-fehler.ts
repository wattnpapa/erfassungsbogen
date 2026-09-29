/**
 * Verständliche Meldungen für Dateien, die sich nicht einlesen lassen.
 *
 * Bis hierher reichten die Datei-Eingänge den Text des Parsers durch:
 * „Unexpected end of JSON input", „Unexpected token 'N', "Name;Vorna"… is not
 * valid JSON". Das versteht am Meldekopf niemand, und es sagt nicht, was als
 * Nächstes zu tun ist — also wird dieselbe Datei noch einmal versucht oder die
 * App für defekt gehalten (Audit Runde 2, R2-E5).
 *
 * Deshalb schaut diese Stelle selbst in die Datei und sagt in Alltagssprache,
 * WAS sie ist (leer, abgeschnitten, eine Tabelle, eine Datei für einen anderen
 * Knopf …) und WAS jetzt hilft. Parser-Texte erscheinen nie. Alle Datei-Wege
 * nutzen dieselbe Auswertung, damit dieselbe kaputte Datei überall dieselbe
 * Erklärung bekommt.
 */

import { SCHEMA_VERSION } from "@bos/eeb-format/model";
import { fehlerText, istNachladeFehler } from "./nachladen";
import { SpeicherVollFehler, istSpeicherVoll } from "./eintrag-zeiten";

/** Über welchen Knopf die Datei kam — bestimmt, was „richtig" wäre und wohin eine falsche gehört. */
export type DateiWeg =
  /** Startseite „Aus Datei laden…": ein Bogen (PDF/JSON) oder eine Vorlage. */
  | "bogen"
  /** Einsatzansicht „Bögen einlesen…": Bögen als PDF oder JSON. */
  | "boegen"
  /** Startseite „Einsatz importieren…": Einsatz-Sammlung (oder Bögen daraus). */
  | "einsatz"
  /** Fußzeile „Datensicherung" → „Sicherung einspielen…". */
  | "sicherung";

/** Was eine Datei nach dem ersten Blick ist — keine vollständige Prüfung. */
export type DateiArt =
  | "leer"
  | "pdf"
  | "pdf-kaputt"
  | "json-kaputt"
  | "tabelle"
  | "fremd"
  | "json-fremd"
  | "bogen"
  | "bogen-neuer"
  | "boegen"
  | "einsatz"
  | "vorlage"
  | "sicherung";

function istObjekt(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function istBogenRoh(x: unknown): boolean {
  return istObjekt(x) && typeof x.schemaVersion === "number" && x.schemaVersion >= 2 && !!x.einheit;
}

function jsonArt(roh: unknown): DateiArt {
  if (Array.isArray(roh)) {
    return roh.length > 0 && roh.every(istBogenRoh) ? "boegen" : "json-fremd";
  }
  if (!istObjekt(roh)) return "json-fremd";
  if (roh.format === "eeb-sicherung") return "sicherung";
  if (roh.format === "eeb-vorlage") return "vorlage";
  if (roh.typ === "eeb-einsatz" || (typeof roh.id === "string" && Array.isArray(roh.eintraege))) return "einsatz";
  if (istBogenRoh(roh)) return (roh.schemaVersion as number) > SCHEMA_VERSION ? "bogen-neuer" : "bogen";
  return "json-fremd";
}

/**
 * Dateiinhalt (als Text gelesen, auch bei PDFs) → Art. Eine PDF gilt als
 * abgeschnitten, wenn ihr die Schlussmarke `%%EOF` fehlt — das ist der
 * typische Rest einer abgebrochenen Übertragung.
 */
export function dateiArt(text: string): DateiArt {
  const t = text.replace(/^﻿/, "").trim();
  if (!t) return "leer";
  if (t.startsWith("%PDF")) return t.slice(-2048).includes("%%EOF") ? "pdf" : "pdf-kaputt";
  if (t.startsWith("{") || t.startsWith("[")) {
    try {
      return jsonArt(JSON.parse(t));
    } catch {
      return "json-kaputt";
    }
  }
  // Tabellen (CSV, aus Excel gespeicherte Namenslisten): Zeilen mit Trennern.
  const zeilen = t.split(/\r?\n/).slice(0, 5);
  if (zeilen.every((z) => /[;\t,]/.test(z))) return "tabelle";
  return "fremd";
}

const NEU_ANFORDERN = "Bitte beim Absender neu anfordern oder den QR-Code des Bogens scannen.";

/** Wohin eine Datei gehört, die über den falschen Knopf kam. */
const RICHTIGER_KNOPF: Partial<Record<DateiArt, string>> = {
  einsatz: "eine Einsatz-Sammlung. Sie wird auf der Startseite über „Einsatz importieren…“ eingelesen.",
  vorlage: "eine Vorlage. Sie wird auf der Startseite über „Aus Datei laden…“ übernommen.",
  sicherung:
    "eine Datensicherung. Sie wird über die Fußzeile „Datensicherung“ eingespielt — Achtung: das ersetzt alle Daten auf diesem Gerät.",
  bogen: "ein einzelner Bogen. Er wird auf der Startseite über „Aus Datei laden…“ geöffnet oder in einer Sammlung über „Bögen einlesen…“ aufgenommen.",
  boegen: "eine Liste von Bögen. Sie wird in einer Einsatz-Sammlung über „Bögen einlesen…“ aufgenommen.",
  pdf: "eine PDF. Bögen daraus werden über „Aus Datei laden…“ oder „Bögen einlesen…“ gelesen, eine Sammel-PDF über „Einsatz importieren…“.",
};

/** Welche Arten ein Weg selbst verarbeitet — für sie gibt es keinen „falscher Knopf"-Hinweis. */
const PASST: Record<DateiWeg, DateiArt[]> = {
  bogen: ["bogen", "vorlage", "pdf"],
  boegen: ["bogen", "boegen", "pdf"],
  einsatz: ["einsatz", "bogen", "boegen", "pdf"],
  sicherung: ["sicherung"],
};

/**
 * Meldung zu einer Datei, die sich nicht einlesen ließ — mit Ursache und
 * nächstem Schritt. `null`, wenn die Art zum Weg passt und der Inhalt selbst
 * nichts erklärt (dann greift die allgemeine Meldung, {@link allgemeineMeldung}).
 */
export function dateiFehlerText(name: string, art: DateiArt, weg: DateiWeg): string | null {
  const datei = `„${name}“`;
  const ausSicherung = weg === "sicherung";
  switch (art) {
    case "leer":
      return (
        `${datei} ist leer — vermutlich wurde die Übertragung abgebrochen. ` +
        (ausSicherung ? "Die Sicherung auf dem alten Gerät neu erstellen und vollständig kopieren." : NEU_ANFORDERN)
      );
    case "json-kaputt":
    case "pdf-kaputt":
      return (
        `${datei} ist beschädigt oder unvollständig (etwa nach abgebrochener Übertragung). ` +
        (ausSicherung
          ? "Die Daten auf diesem Gerät sind unverändert. Die Sicherung auf dem alten Gerät neu erstellen und vollständig kopieren."
          : NEU_ANFORDERN)
      );
    case "tabelle":
      return (
        `${datei} ist eine Tabelle oder Liste, keine Datei dieser App. Eingelesen werden die PDF eines Bogens ` +
        "und Dateien, die diese App selbst gespeichert hat. Namen aus einer Liste bitte im Schritt „Personal“ eintragen."
      );
    case "fremd":
    case "json-fremd":
      return (
        `${datei} stammt nicht aus dieser App. ` +
        (ausSicherung
          ? "Eine Sicherung entsteht über „Sicherung erstellen…“ und heißt eeb-sicherung-….json."
          : "Beim Absender die PDF des Bogens anfordern oder den QR-Code scannen.")
      );
    case "bogen-neuer":
      return `${datei} stammt aus einer neueren Version der App. Bitte die App mit Netz neu laden, damit sie sich aktualisiert, und die Datei dann erneut wählen.`;
    default:
      if (PASST[weg].includes(art)) return null;
      return RICHTIGER_KNOPF[art] ? `${datei} ist ${RICHTIGER_KNOPF[art]}` : null;
  }
}

/** Letzter Rückfall ohne erkennbare Ursache — ebenfalls ohne Parser-Text. */
export function allgemeineMeldung(name: string, weg: DateiWeg): string {
  return weg === "sicherung"
    ? `„${name}“ ließ sich nicht einspielen. Die Daten auf diesem Gerät sind unverändert. Die Sicherung auf dem alten Gerät neu erstellen und erneut versuchen.`
    : `„${name}“ ließ sich nicht lesen. ${NEU_ANFORDERN}`;
}

/**
 * Meldung für einen gescheiterten Datei-Eingang. Eigene, schon verständliche
 * Fehler (Speicher voll, neuere App-Version, Baustein nicht nachladbar) gehen
 * unverändert durch; alles andere wird aus dem Dateiinhalt erklärt.
 */
export async function dateiFehlerMeldung(datei: File, fehler: unknown, weg: DateiWeg): Promise<string> {
  if (istNachladeFehler(fehler)) return fehlerText(fehler);
  if (fehler instanceof SpeicherVollFehler) return fehler.message;
  if (istSpeicherVoll(fehler)) return new SpeicherVollFehler(fehler).message;
  const eigen = fehler instanceof Error ? fehler.message : "";
  if (/neueren App-Version|Lokaler Speicher ist nicht verfügbar/.test(eigen)) return eigen;
  let text: string;
  try {
    text = await datei.text();
  } catch {
    return allgemeineMeldung(datei.name, weg);
  }
  const erklaert = dateiFehlerText(datei.name, dateiArt(text), weg);
  if (erklaert) return erklaert;
  // Die Datei sieht richtig aus: Dann trägt die eigene Meldung der Stelle,
  // die sie ablehnte (etwa „In dieser PDF steckt kein Erfassungsbogen …"),
  // mehr als jede allgemeine — sofern sie kein Programmtext ist.
  if (eigen && !TECHNISCH.test(eigen)) return eigen;
  return allgemeineMeldung(datei.name, weg);
}

/** Erkennungszeichen von Programm- und Parser-Texten, die nie angezeigt werden. */
const TECHNISCH = /JSON|Unexpected|token|position|undefined|null|Cannot|is not|TypeError|SyntaxError|Invalid|Error/;
