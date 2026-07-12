/**
 * THW-Funkrufnamenregelung (Taschenkarte THW-Funkrufnamen, Stand 02/2022).
 * Quelle: THWin-Taschenkarte, vom Nutzer bereitgestellt (nicht Bestandteil der
 * StAN, daher hier separat gepflegt).
 *
 * Ein THW-Funkrufname lautet "<Kennwort> <Ort> <Teileinheit>/<Fahrzeug>",
 * z. B. "Heros Oldenburg 18/13" (FGr K (A) / FmKW). Modell: `Funkrufname` in
 * src/model.ts mit `teile: [Teileinheit-Kennzahl, Fahrzeug-Kennzahl]`.
 *
 * WICHTIG: Die Kennzahlen hier sind die tatsächlich GESPROCHENEN THW-Zahlen,
 * NICHT die codec-internen VokabularWert-Codes. Sie werden weder im QR kodiert
 * noch append-only versioniert — es ist eine reine Nachschlage-/Vorbelegungs-
 * tabelle.
 *
 * Redaktionsentscheidungen (Johannes, 2026-07-12):
 *  - Die erste Zahl (Teileinheit) hängt im OV vom Zug/TZ ab (B = 22 im 1. TZ,
 *    27 im 2. TZ; FGr N = 24 bzw. 28). Vorbelegt wird immer der 1. Zug/TZ;
 *    beim 2. TZ korrigiert der Nutzer die Zahl im Feld.
 *  - FüSt-/Verwaltungs-Kennzahlen (10-15, 65-69, 71-73, 79-99) werden nur als
 *    Referenz geführt, nicht automatisch vorbelegt.
 *  - Uneindeutige Fahrzeug-Kennzahlen (LKW Kipper 41/42, LKW Ladekran 44/45,
 *    2. LKW WLF) sind bewusst mit einer plausiblen Zahl vorbelegt — editierbar.
 */

export interface KennzahlEintrag {
  /** Die gesprochene THW-Kennzahl (z. B. 22, 51). */
  kennzahl: number;
  kurz: string;
  name: string;
  /** Kontext/Fußnote aus der Taschenkarte. */
  hinweis?: string;
}

// ---------------------------------------------- Erste Zahl: Teileinheit (links)
// Identifiziert die Teileinheit im OV. Auszug der Taschenkarte (operative Zeilen
// plus Verwaltung). Zeilen mit Zahlbereichen (THW-FüSt 11-15, 94-99) sind hier
// als Einzelzahl bzw. gar nicht abgebildet.

export const THW_TEILEINHEIT_KENNZAHLEN: KennzahlEintrag[] = [
  { kennzahl: 10, kurz: "THW-FüSt", name: "THW-Führungsstelle", hinweis: "als (TEL)/EAL/UEAL/BR" },
  { kennzahl: 16, kurz: "FZ FK", name: "Zugtrupp Fachzug Führung/Kommunikation", hinweis: "ZTr / Zug / Zug-BefSt" },
  { kennzahl: 17, kurz: "FGr F", name: "Fachgruppe Führungsunterstützung" },
  { kennzahl: 18, kurz: "FGr K (A)", name: "Fachgruppe Kommunikation (A)" },
  { kennzahl: 19, kurz: "FGr K (B)", name: "Fachgruppe Kommunikation (B)" },
  { kennzahl: 21, kurz: "1. TZ", name: "Zugtrupp 1. Technischer Zug", hinweis: "ZTr / Zug / Zug-BefSt" },
  { kennzahl: 22, kurz: "B", name: "Bergungsgruppe im 1. TZ" },
  { kennzahl: 23, kurz: "2. B", name: "zweite Bergungsgruppe im 1. TZ" },
  { kennzahl: 24, kurz: "FGr N", name: "Fachgruppe Notversorgung/-instandsetzung im 1. TZ" },
  { kennzahl: 26, kurz: "2. TZ", name: "Zugtrupp 2. Technischer Zug", hinweis: "ZTr / Zug / Zug-BefSt" },
  { kennzahl: 27, kurz: "B", name: "Bergungsgruppe im 2. TZ" },
  { kennzahl: 28, kurz: "FGr N", name: "Fachgruppe Notversorgung/-instandsetzung im 2. TZ" },
  { kennzahl: 31, kurz: "FGr I", name: "Fachgruppe Infrastruktur" },
  { kennzahl: 32, kurz: "FGr E", name: "Fachgruppe Elektroversorgung" },
  { kennzahl: 33, kurz: "FGr TW", name: "Fachgruppe Trinkwasserversorgung" },
  { kennzahl: 35, kurz: "FGr Sp", name: "Fachgruppe Sprengen" },
  { kennzahl: 36, kurz: "FGr W (A)", name: "Fachgruppe Wassergefahren (A)", hinweis: "MzAB" },
  { kennzahl: 37, kurz: "FGr W (B)", name: "Fachgruppe Wassergefahren (B)", hinweis: "MzPt" },
  { kennzahl: 38, kurz: "FGr SB (A)", name: "Fachgruppe Schwere Bergung (A)" },
  { kennzahl: 39, kurz: "FGr SB (B)", name: "Fachgruppe Schwere Bergung (B)" },
  { kennzahl: 41, kurz: "FGr R (B)", name: "Fachgruppe Räumen (B)", hinweis: "Radlader" },
  { kennzahl: 42, kurz: "FGr R (A)", name: "Fachgruppe Räumen (A)", hinweis: "Bagger" },
  { kennzahl: 43, kurz: "FGr R (C)", name: "Fachgruppe Räumen (C)", hinweis: "Teleskoplader" },
  { kennzahl: 44, kurz: "FGr O (A)", name: "Fachgruppe Ortung (A)" },
  { kennzahl: 45, kurz: "FGr O (B)", name: "Fachgruppe Ortung (B)" },
  { kennzahl: 46, kurz: "FGr O (C)", name: "Fachgruppe Ortung (C)" },
  { kennzahl: 47, kurz: "FGr WP (A)", name: "Fachgruppe Wasserschaden/Pumpen (A)", hinweis: "SwPu 5.000 l/min" },
  { kennzahl: 48, kurz: "FGr WP (B)", name: "Fachgruppe Wasserschaden/Pumpen (B)", hinweis: "SwPu 15.000 l/min" },
  { kennzahl: 49, kurz: "FGr WP (C)", name: "Fachgruppe Wasserschaden/Pumpen (C)", hinweis: "SwPu 25.000 l/min" },
  { kennzahl: 54, kurz: "FGr BrB", name: "Fachgruppe Brückenbau" },
  { kennzahl: 55, kurz: "FGr Öl (A)", name: "Fachgruppe Ölschaden (A)", hinweis: "Küste" },
  { kennzahl: 56, kurz: "FGr Öl (B)", name: "Fachgruppe Ölschaden (B)", hinweis: "Küste" },
  { kennzahl: 57, kurz: "FGr Öl (C)", name: "Fachgruppe Ölschaden (C)", hinweis: "Binnen" },
  { kennzahl: 61, kurz: "FZ Log", name: "Zugtrupp Fachzug Logistik", hinweis: "ZTr / Zug / Zug-BefSt" },
  { kennzahl: 62, kurz: "Tr TS", name: "Trupp Logistik-Schwerer Transport" },
  { kennzahl: 63, kurz: "FGr Log-MW", name: "Fachgruppe Logistik-Materialwirtschaft" },
  { kennzahl: 64, kurz: "FGr Log-V", name: "Fachgruppe Logistik-Verpflegung" },
  { kennzahl: 65, kurz: "Tr Log Sonderform", name: "Trupp Logistik Sonderform", hinweis: "nur im Einsatz" },
  { kennzahl: 66, kurz: "Log-Stelle", name: "Logistikstelle", hinweis: "nur im Einsatz" },
  { kennzahl: 67, kurz: "Log-Stelle", name: "Logistikstelle", hinweis: "nur im Einsatz" },
  { kennzahl: 68, kurz: "Log-Stelle", name: "Logistikstelle", hinweis: "nur im Einsatz" },
  { kennzahl: 69, kurz: "Log-Stelle", name: "Logistikstelle", hinweis: "nur im Einsatz" },
  { kennzahl: 71, kurz: "FÜTr", name: "Führungstrupp", hinweis: "sonst. Einheiten z. B. 3. TZ" },
  { kennzahl: 72, kurz: "1. Gr", name: "erste Gruppe", hinweis: "sonst. Einheiten z. B. 3. TZ" },
  { kennzahl: 73, kurz: "2. Gr", name: "zweite Gruppe", hinweis: "sonst. Einheiten z. B. 3. TZ" },
  { kennzahl: 74, kurz: "Tr MHP", name: "Trupp Mobiler Hochwasserpegel" },
  { kennzahl: 75, kurz: "Tr ESS", name: "Trupp Einsatzstellensicherung" },
  { kennzahl: 76, kurz: "Tr UL", name: "Trupp Unbemannte Luftfahrtsysteme" },
  { kennzahl: 79, kurz: "ÖGA", name: "Örtliche Gefahrenabwehr", hinweis: "nur genehmigte ÖGA" },
  { kennzahl: 81, kurz: "THW-Leitung", name: "THW-Leitung" },
  { kennzahl: 82, kurz: "THW-AZ", name: "THW-Ausbildungszentrum" },
  { kennzahl: 83, kurz: "THW-LogH/LogZ", name: "THW-Logistikhof/-zentrum" },
  { kennzahl: 84, kurz: "LV-DSt", name: "Landesverband-Dienststelle" },
  { kennzahl: 85, kurz: "RSt", name: "Regionalstelle" },
  { kennzahl: 86, kurz: "OV", name: "Ortsverband" },
  { kennzahl: 91, kurz: "SEEBA", name: "Schnelleinsatzeinheit Bergung Ausland" },
  { kennzahl: 92, kurz: "SEELIFT", name: "Schnelleinsatzeinheit Logistikabwicklung Flughafen" },
  { kennzahl: 93, kurz: "SEEWA", name: "Schnelleinsatzeinheit Wasser Ausland" },
];

// ------------------------------------------- Zweite Zahl: Fahrzeug/Person (rechts)
// Identifiziert das Fahrzeug bzw. die Funktion innerhalb der Teileinheit.
// "Ziffernfolge 00 wird nicht gesprochen"; 20/30/40/50/60/70/80/90 werden nicht
// belegt (Kfz/Pers.).

export const THW_FAHRZEUG_KENNZAHLEN: KennzahlEintrag[] = [
  { kennzahl: 10, kurz: "MTW", name: "Mannschaftstransportwagen", hinweis: "ZTr" },
  { kennzahl: 11, kurz: "FüKW", name: "Führungskraftwagen", hinweis: "nur FZ FK" },
  { kennzahl: 12, kurz: "FüKomKW", name: "Führungs- und Kommunikationskraftwagen", hinweis: "nur FZ FK" },
  { kennzahl: 13, kurz: "FmKW", name: "Fernmeldekraftwagen", hinweis: "nur FZ FK" },
  { kennzahl: 14, kurz: "FüKomKW", name: "Führungs- und Kommunikationskraftwagen", hinweis: "nur FZ FK, Fzg Ügl" },
  { kennzahl: 15, kurz: "FmKW", name: "Fernmeldekraftwagen", hinweis: "nur FZ FK, Fzg Ügl" },
  { kennzahl: 17, kurz: "MastKW", name: "Mastkraftwagen", hinweis: "nur FGr K (B)" },
  { kennzahl: 21, kurz: "PKW", name: "Personenkraftwagen", hinweis: "1. Pkw der OE/Teileinheit" },
  { kennzahl: 22, kurz: "PKW", name: "Personenkraftwagen", hinweis: "2. Pkw der OE/Teileinheit" },
  { kennzahl: 23, kurz: "PKW", name: "Personenkraftwagen", hinweis: "3. Pkw der OE/Teileinheit" },
  { kennzahl: 24, kurz: "PKW", name: "Personenkraftwagen", hinweis: "4. Pkw der OE/Teileinheit" },
  { kennzahl: 25, kurz: "MTW", name: "Mannschaftstransportwagen", hinweis: "1. MTW der OE/Teileinh." },
  { kennzahl: 26, kurz: "MTW", name: "Mannschaftstransportwagen", hinweis: "2. MTW der OE/Teileinh." },
  { kennzahl: 27, kurz: "MTW", name: "Mannschaftstransportwagen", hinweis: "3. MTW der OE/Teileinh." },
  { kennzahl: 28, kurz: "MTW", name: "Mannschaftstransportwagen", hinweis: "4. MTW der OE/Teileinh." },
  { kennzahl: 31, kurz: "MLW I", name: "Mannschaftslastwagen I" },
  { kennzahl: 32, kurz: "MLW II", name: "Mannschaftslastwagen II" },
  { kennzahl: 33, kurz: "MLW III", name: "Mannschaftslastwagen III" },
  { kennzahl: 34, kurz: "MLW IV", name: "Mannschaftslastwagen IV" },
  { kennzahl: 35, kurz: "MLW V", name: "Mannschaftslastwagen V" },
  { kennzahl: 41, kurz: "LKW", name: "Lastkraftwagen", hinweis: "<= 7t" },
  { kennzahl: 42, kurz: "LKW", name: "Lastkraftwagen", hinweis: "> 7t" },
  { kennzahl: 43, kurz: "LKW Lbw", name: "Lastkraftwagen mit Ladebordwand" },
  { kennzahl: 44, kurz: "LKW Lkr", name: "Lastkraftwagen mit Ladekran", hinweis: "Ladekran < 190 kNm" },
  { kennzahl: 45, kurz: "LKW Lkr", name: "Lastkraftwagen mit Ladekran", hinweis: "Ladekran >= 190 kNm" },
  { kennzahl: 46, kurz: "LKW Lkr, gl", name: "Lastkraftwagen geländegängig mit Ladekran", hinweis: "Ladekran" },
  { kennzahl: 47, kurz: "Autokran", name: "Autokran / Mobilkran" },
  { kennzahl: 49, kurz: "LKW Lbw", name: "Lastkraftwagen mit Ladebordwand", hinweis: "2. LKW FGr TW" },
  { kennzahl: 51, kurz: "GKW", name: "Gerätekraftwagen" },
  { kennzahl: 52, kurz: "GKW II", name: "Gerätekraftwagen II" },
  { kennzahl: 53, kurz: "GKW II", name: "Gerätekraftwagen II", hinweis: "Übergangslösung" },
  { kennzahl: 54, kurz: "MzKW", name: "Mehrzweckkraftwagen" },
  { kennzahl: 55, kurz: "MzGW", name: "Mehrzweckgerätewagen" },
  { kennzahl: 56, kurz: "sonstige GW", name: "sonstiger Gerätewagen" },
  { kennzahl: 57, kurz: "BelKW", name: "Beleuchtungskraftwagen" },
  { kennzahl: 61, kurz: "LKW-K", name: "Lastkraftwagen Kipper", hinweis: "< 9t" },
  { kennzahl: 62, kurz: "LKW-K", name: "Lastkraftwagen Kipper", hinweis: ">= 9t" },
  { kennzahl: 63, kurz: "LKW-K, Lkr", name: "Lastkraftwagen Kipper mit Ladekran", hinweis: "Ladekran < 190 kNm" },
  { kennzahl: 64, kurz: "LKW-K, Lkr", name: "Lastkraftwagen Kipper mit Ladekran", hinweis: "Ladekran >= 190 kNm" },
  { kennzahl: 65, kurz: "WLF", name: "Wechselladerfahrzeug", hinweis: "Hakensystem" },
  { kennzahl: 66, kurz: "WLF Lkr", name: "Wechselladerfahrzeug mit Ladekran", hinweis: "Hakensystem mit Lkr" },
  { kennzahl: 67, kurz: "WLF", name: "Wechselladerfahrzeug", hinweis: "Wechselpritsche" },
  { kennzahl: 68, kurz: "Sattel-Kfz", name: "Sattelkraftfahrzeug" },
  { kennzahl: 71, kurz: "Bagger", name: "Bagger" },
  { kennzahl: 72, kurz: "Radlader", name: "Radlader" },
  { kennzahl: 73, kurz: "Teleskoplader", name: "Teleskoplader" },
  { kennzahl: 74, kurz: "son. Baumaschine", name: "sonstige Baumaschine" },
  { kennzahl: 75, kurz: "ERS", name: "Einsatzstellen-Räumsystem" },
  { kennzahl: 77, kurz: "Sonstige Kfz", name: "sonstiges Kraftfahrzeug" },
  { kennzahl: 78, kurz: "Sonstige Fz", name: "sonstiges Fahrzeug", hinweis: "z. B. Wfs" },
  { kennzahl: 79, kurz: "KOM", name: "Kraftomnibus", hinweis: "Reisebus" },
  { kennzahl: 81, kurz: "MzAB", name: "Mehrzweckarbeitsboot" },
  { kennzahl: 82, kurz: "MzAB", name: "Mehrzweckarbeitsboot" },
  { kennzahl: 83, kurz: "MzAB", name: "Mehrzweckarbeitsboot" },
  { kennzahl: 84, kurz: "MzPt", name: "Mehrzweckponton" },
  { kennzahl: 85, kurz: "Son. Wasserfahrzeug", name: "sonstiges Wasserfahrzeug" },
  { kennzahl: 86, kurz: "Son. Wasserfahrzeug", name: "sonstiges Wasserfahrzeug" },
  { kennzahl: 91, kurz: "Führungskraft", name: "Führungskraft" },
  { kennzahl: 92, kurz: "Vertreter/in", name: "Vertreter/in von …/91" },
  { kennzahl: 94, kurz: "FaBe", name: "Fachberater/in" },
  { kennzahl: 95, kurz: "FaBe", name: "Fachberater/in" },
  { kennzahl: 96, kurz: "TeBe", name: "Technische/r Berater/in" },
  { kennzahl: 97, kurz: "Ltr THW-FüSt", name: "Leiter/in THW-Führungsstelle", hinweis: "nur im Einsatz" },
  { kennzahl: 98, kurz: "S6 / FmFü", name: "Sachgebiet 6 / Fernmeldeführer/in" },
];

// -------------------------------------- Ableitung: Einheitstyp → Teileinheit-Zahl
// Schlüssel = Einheitstyp-Code aus THW_EINHEITSTYPEN (src/vokabulare/thw.ts).
// Immer der 1. Zug/TZ (s. Kopf-Kommentar). Einheitstypen ohne Eintrag in der
// Taschenkarte (MT, VOST, FGr BT, ENT, Sys BR500, Stab) fehlen bewusst.

export const TEILEINHEIT_KENNZAHL_JE_EINHEITSTYP: Record<number, number> = {
  3: 21, // ZTr TZ → 1. TZ
  4: 22, // B → 1. TZ
  5: 22, // B (ASH) → 1. TZ
  6: 42, // FGr R (A)
  7: 41, // FGr R (B)
  8: 43, // FGr R (C)
  9: 36, // FGr W (A)
  10: 37, // FGr W (B)
  11: 54, // FGr BrB
  12: 44, // FGr O (A)
  13: 45, // FGr O (B)
  14: 46, // FGr O (C)
  15: 35, // FGr Sp
  16: 24, // FGr N → 1. TZ
  17: 91, // SEEBA
  18: 38, // FGr SB (A)
  19: 39, // FGr SB (B)
  20: 75, // Tr ESS
  21: 74, // Tr MHP
  22: 76, // Tr UL
  24: 31, // FGr I
  25: 32, // FGr E
  26: 33, // FGr TW
  27: 47, // FGr WP (A)
  28: 48, // FGr WP (B)
  29: 49, // FGr WP (C)
  30: 55, // FGr Öl (A)
  31: 56, // FGr Öl (B)
  32: 57, // FGr Öl (C)
  33: 93, // SEEWA
  35: 92, // SEElift
  36: 61, // ZTr FZ Log
  37: 63, // FGr Log-MW
  38: 64, // FGr Log-V
  39: 62, // Tr Log-TS
  41: 16, // ZTr FZ FK
  42: 17, // FGr F
  43: 18, // FGr K (A)
  44: 19, // FGr K (B)
};

/** Teileinheit-Kennzahl (1. Zahl des Funkrufnamens) für einen Einheitstyp-Code. */
export function teileinheitKennzahl(einheitsTypCode: number | undefined): number | undefined {
  if (einheitsTypCode == null) return undefined;
  return TEILEINHEIT_KENNZAHL_JE_EINHEITSTYP[einheitsTypCode];
}
