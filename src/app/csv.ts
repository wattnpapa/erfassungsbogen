/**
 * CSV-Grundlagen für alle Exporte — bewusst OHNE neue Abhängigkeit: reines
 * String-Building.
 *
 * Ausgabeformat auf Excel(DE) getrimmt: Semikolon als Trenner, UTF-8-BOM,
 * deutsche Dezimalkommas. Ein CSV, das man in Deutschland doppelklickt, landet
 * in Excel — und das erwartet genau diese drei Dinge, sonst stehen Umlaute
 * falsch und alle Spalten in einer.
 */

import { anfuehrung } from "./typografie";

export const CSV_TRENNER = ";";

/** Excel(DE) erkennt UTF-8 nur zuverlässig mit BOM; ohne BOM landen Umlaute falsch. */
export const CSV_BOM = "﻿";

/** Zahl deutsch: Ganzzahl bleibt schlicht, Bruch bekommt Dezimalkomma. */
export function deZahl(n: number): string {
  return Number.isInteger(n) ? String(n) : String(n).replace(".", ",");
}

/**
 * Zeichen, die Excel & Co. am Zellanfang als Formelstart deuten. Ein fremder
 * Bogen (gescannt/importiert) könnte so z. B. `=HYPERLINK(…)` oder eine
 * DDE-Nutzlast einschleusen, die beim Doppelklick auf das CSV ausgeführt wird
 * (CSV-Injection). Nur Textwerte sind betroffen — Zahlen laufen über `deZahl`.
 */
const FORMEL_START = /^[=+\-@\t\r]/;

/**
 * CSV-Feld: neutralisiert bei Texten einen führenden Formel-Auslöser mit einem
 * vorangestellten `'` (Excel wertet die Zelle dann als Text), quotet bei
 * Trenner/Quote/Umbruch/Rand-Leerzeichen und verdoppelt interne Quotes.
 */
export function csvFeld(v: string | number): string {
  if (typeof v === "number") return deZahl(v);
  const t = anfuehrung(v);
  const s = FORMEL_START.test(t) ? `'${t}` : t;
  return /[";\r\n]/.test(s) || s !== s.trim() ? `"${s.replace(/"/g, '""')}"` : s;
}

export function csvZeile(werte: (string | number)[]): string {
  return werte.map(csvFeld).join(CSV_TRENNER);
}

/**
 * Nachtrag-Datei (R17-A3, W2, K9): Die Kopfzeile bleibt Zeile 1 — Tabellenprogramme und Importe erwarten sie dort —, aber eine
 * zusätzliche ERSTE SPALTE trägt den Vermerk schon in der Überschrift („NACHTRAG seit …, nicht die ganze Lage") und in jeder
 * Datenzeile („NACHTRAG"). So sieht man beim Öffnen sofort, dass es nur ein Teil der Lage ist; Summen- und Schlusszeilen bekommen
 * eine leere erste Zelle. `zeilen`: Kopfzeile, `datenZeilen` Datenzeilen, danach Summen und Schlusszeilen (alle schon CSV).
 */
export function mitNachtragSpalte(zeilen: string[], kopfText: string, datenZeilen: number): string[] {
  return zeilen.map((z, i) => `${csvFeld(i === 0 ? kopfText : i <= datenZeilen ? "NACHTRAG" : "")}${CSV_TRENNER}${z}`);
}

/** Zeilen → fertiger Dateiinhalt (BOM, CRLF, abschließender Umbruch). */
export function csvDatei(zeilen: string[]): string {
  return CSV_BOM + zeilen.join("\r\n") + "\r\n";
}

export function jaNein(b: boolean): string {
  return b ? "ja" : "nein";
}
