/**
 * CSV-Grundlagen für alle Exporte — bewusst OHNE neue Abhängigkeit: reines
 * String-Building.
 *
 * Ausgabeformat auf Excel(DE) getrimmt: Semikolon als Trenner, UTF-8-BOM,
 * deutsche Dezimalkommas. Ein CSV, das man in Deutschland doppelklickt, landet
 * in Excel — und das erwartet genau diese drei Dinge, sonst stehen Umlaute
 * falsch und alle Spalten in einer.
 */

export const CSV_TRENNER = ";";

/** Excel(DE) erkennt UTF-8 nur zuverlässig mit BOM; ohne BOM landen Umlaute falsch. */
export const CSV_BOM = "﻿";

/** Zahl deutsch: Ganzzahl bleibt schlicht, Bruch bekommt Dezimalkomma. */
export function deZahl(n: number): string {
  return Number.isInteger(n) ? String(n) : String(n).replace(".", ",");
}

/** CSV-Feld: quotet nur bei Trenner/Quote/Umbruch/Rand-Leerzeichen, verdoppelt interne Quotes. */
export function csvFeld(v: string | number): string {
  const s = typeof v === "number" ? deZahl(v) : v;
  return /[";\r\n]/.test(s) || s !== s.trim() ? `"${s.replace(/"/g, '""')}"` : s;
}

export function csvZeile(werte: (string | number)[]): string {
  return werte.map(csvFeld).join(CSV_TRENNER);
}

/** Zeilen → fertiger Dateiinhalt (BOM, CRLF, abschließender Umbruch). */
export function csvDatei(zeilen: string[]): string {
  return CSV_BOM + zeilen.join("\r\n") + "\r\n";
}

export function jaNein(b: boolean): string {
  return b ? "ja" : "nein";
}
