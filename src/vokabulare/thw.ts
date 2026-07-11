/**
 * THW-Vokabulare für VokabularWert-Codes (Namensraum OrganisationsTyp.THW).
 * Quelle: THW StAN, Stand 01.07.2026 (vom Nutzer bereitgestellt).
 *
 * REGELN:
 *  - Codes sind append-only und werden NIE umgedeutet oder wiederverwendet.
 *  - Code 0 ist reserviert (= Freitext-Ausweg im QR-Format).
 *  - `kurz` ist die Kurzform für Bogen-Druck und kompakte Anzeige.
 *
 * Redaktionsentscheidungen (Johannes, 2026-07-10):
 *  - StAN OV (00-01) wird nicht aufgenommen; OV-spezifische Einheiten und
 *    Fahrzeuge (z. B. MzKW, MTW OV, Anh OV) laufen über den Freitext-Ausweg.
 *  - Ältere Bezeichnungen aus 02-00 STAN TZ (B1, B2, Bel, …) werden ignoriert;
 *    maßgeblich sind die Einzel-StAN dieser Lieferung.
 *  - Fb-Kürzel (z. B. "Fb Fü K_A") werden nicht abgebildet.
 *  - Es gibt keine offizielle Kurzformen-Liste; die `kurz`-Spalte ist eigene
 *    Redaktion dieses Projekts.
 */

export interface VokabularEintrag {
  code: number;
  kurz: string;
  name: string;
  stanNr?: string;
}

// ---------------------------------------------------------- Hierarchie-Ebenen

export const THW_HIERARCHIE_EBENEN: VokabularEintrag[] = [
  { code: 1, kurz: "OV", name: "Ortsverband" },
  { code: 2, kurz: "RB", name: "Regionalbereich" }, // Regionalstelle als Kontaktstelle
  { code: 3, kurz: "LV", name: "Landesverband" },
];

// ------------------------------------------------------------- Einheitstypen
// Aus den StAN-Einzeldokumenten 2026 (eine StAN = ein Einheitstyp).
// OV-Teileinheiten und Alt-Bezeichnungen bewusst nicht enthalten (s. Kopf).

export const THW_EINHEITSTYPEN: VokabularEintrag[] = [
  { code: 1, kurz: "MT", name: "Media Team", stanNr: "00-06" },
  { code: 2, kurz: "VOST", name: "Virtual Operations Support Team", stanNr: "00-07" },
  { code: 3, kurz: "ZTr TZ", name: "Zugtrupp Technischer Zug", stanNr: "02-01" },
  { code: 4, kurz: "B", name: "Bergungsgruppe", stanNr: "02-02" },
  { code: 5, kurz: "B (ASH)", name: "Bergungsgruppe (Abstützsystem Holz)", stanNr: "02-02ASH" },
  { code: 6, kurz: "FGr R (A)", name: "Fachgruppe Räumen (A)", stanNr: "02-04a" },
  { code: 7, kurz: "FGr R (B)", name: "Fachgruppe Räumen (B)", stanNr: "02-04b" },
  { code: 8, kurz: "FGr R (C)", name: "Fachgruppe Räumen (C)", stanNr: "02-04c" },
  { code: 9, kurz: "FGr W (A)", name: "Fachgruppe Wassergefahren (A)", stanNr: "02-05a" },
  { code: 10, kurz: "FGr W (B)", name: "Fachgruppe Wassergefahren (B)", stanNr: "02-05b" },
  { code: 11, kurz: "FGr BrB", name: "Fachgruppe Brückenbau", stanNr: "02-06" },
  { code: 12, kurz: "FGr O (A)", name: "Fachgruppe Ortung (A)", stanNr: "02-07a" },
  { code: 13, kurz: "FGr O (B)", name: "Fachgruppe Ortung (B)", stanNr: "02-07b" },
  { code: 14, kurz: "FGr O (C)", name: "Fachgruppe Ortung (C)", stanNr: "02-07c" },
  { code: 15, kurz: "FGr Sp", name: "Fachgruppe Sprengen", stanNr: "02-08" },
  { code: 16, kurz: "FGr N", name: "Fachgruppe Notversorgung und Notinstandsetzung", stanNr: "02-09" },
  { code: 17, kurz: "SEEBA", name: "Schnelleinsatzeinheit Bergung Ausland", stanNr: "02-11" },
  { code: 18, kurz: "FGr SB (A)", name: "Fachgruppe Schwere Bergung (A)", stanNr: "02-13a" },
  { code: 19, kurz: "FGr SB (B)", name: "Fachgruppe Schwere Bergung (B)", stanNr: "02-13b" },
  { code: 20, kurz: "Tr ESS", name: "Trupp Einsatzstellensicherung", stanNr: "02-14" },
  { code: 21, kurz: "Tr MHP", name: "Trupp Mobiler Hochwasserpegel", stanNr: "02-15" },
  { code: 22, kurz: "Tr UL", name: "Trupp Unbemannte Luftfahrtsysteme", stanNr: "02-16" },
  { code: 23, kurz: "FGr BT", name: "Fachgruppe Bergungstauchen", stanNr: "02-17" },
  { code: 24, kurz: "FGr I", name: "Fachgruppe Infrastruktur", stanNr: "03-01" },
  { code: 25, kurz: "FGr E", name: "Fachgruppe Elektroversorgung", stanNr: "03-02" },
  { code: 26, kurz: "FGr TW", name: "Fachgruppe Trinkwasserversorgung", stanNr: "03-03" },
  { code: 27, kurz: "FGr WP (A)", name: "Fachgruppe Wasserschaden/Pumpen (A)", stanNr: "03-04a" },
  { code: 28, kurz: "FGr WP (B)", name: "Fachgruppe Wasserschaden/Pumpen (B)", stanNr: "03-04b" },
  { code: 29, kurz: "FGr WP (C)", name: "Fachgruppe Wasserschaden/Pumpen (C)", stanNr: "03-04c" },
  { code: 30, kurz: "FGr Öl (A)", name: "Fachgruppe Ölschaden (A)", stanNr: "03-05a" },
  { code: 31, kurz: "FGr Öl (B)", name: "Fachgruppe Ölschaden (B)", stanNr: "03-05b" },
  { code: 32, kurz: "FGr Öl (C)", name: "Fachgruppe Ölschaden (C)", stanNr: "03-05c" },
  { code: 33, kurz: "SEEWA", name: "Schnelleinsatzeinheit Wasser Ausland", stanNr: "03-10" },
  { code: 34, kurz: "ENT", name: "Einsatznachsorgeteam", stanNr: "06-01" },
  { code: 35, kurz: "SEElift", name: "Schnelleinsatzeinheit Logistikabwicklung Flughafen", stanNr: "09-03" },
  { code: 36, kurz: "ZTr FZ Log", name: "Zugtrupp Fachzug Logistik", stanNr: "09-04" },
  { code: 37, kurz: "FGr Log-MW", name: "Fachgruppe Logistik-Materialwirtschaft", stanNr: "09-05" },
  { code: 38, kurz: "FGr Log-V", name: "Fachgruppe Logistik-Verpflegung", stanNr: "09-06" },
  { code: 39, kurz: "Tr Log-TS", name: "Trupp Logistik-Schwerer Transport", stanNr: "09-07" },
  { code: 40, kurz: "Sys BR500", name: "System Bereitstellungsraum 500", stanNr: "09-10" },
  { code: 41, kurz: "ZTr FZ FK", name: "Zugtrupp Fachzug Führung/Kommunikation", stanNr: "10-03" },
  { code: 42, kurz: "FGr F", name: "Fachgruppe Führungsunterstützung", stanNr: "10-04" },
  { code: 43, kurz: "FGr K (A)", name: "Fachgruppe Kommunikation (A)", stanNr: "10-05a" },
  { code: 44, kurz: "FGr K (B)", name: "Fachgruppe Kommunikation (B)", stanNr: "10-05b" },
  { code: 45, kurz: "Stab", name: "Stabspersonal", stanNr: "10-06" },
];

// ---------------------------------------------------------------- Funktionen
// art: "funktion" = Spalte 1 der StAN-Funktionsübersicht (bestimmt i. d. R.
// die Stärkerolle), "zusatz" = Zusatzfunktion.
// Kraftfahrer-Zusatzfunktionen: die reine Klasse steckt bereits im Feld
// `fahrerlaubnis` der Person; hier nur die ADR-Varianten als Zusatzfunktion.
//
// WICHTIG (Stärkemeldung): Die Stärkerolle einer Person richtet sich nach der
// vor Ort wahrgenommenen Grundfunktion, nicht nach der höchsten Qualifikation.
// Beispiel: SGL, der als GrFü eingesetzt ist, zählt als Unterführer. Deshalb
// wird `staerkeRolle` in der App pro Person explizit erfasst (Vorbelegung aus
// der Grundfunktion, überschreibbar).

export interface FunktionsEintrag extends VokabularEintrag {
  art: "funktion" | "zusatz";
}

export const THW_FUNKTIONEN: FunktionsEintrag[] = [
  // --- Führungs-/Grundfunktionen ---
  { code: 1, kurz: "ZFü", name: "Zugführer/in", art: "funktion" },
  { code: 2, kurz: "ZTrFü", name: "Zugtruppführer/in", art: "funktion" },
  { code: 3, kurz: "GrFü", name: "Gruppenführer/in", art: "funktion" },
  { code: 4, kurz: "TrFü", name: "Truppführer/in", art: "funktion" },
  { code: 5, kurz: "He", name: "Fachhelfer/in", art: "funktion" },
  { code: 6, kurz: "He (Res)", name: "Fachhelfer/in (Reserve)", art: "funktion" },
  { code: 7, kurz: "SGL", name: "Sachgebietsleiter/in", art: "funktion" },
  { code: 8, kurz: "Ltr VOST", name: "Leiter/in VOST", art: "funktion" },
  { code: 9, kurz: "stv. Ltr VOST", name: "Stellvertretende/r Leiter/in VOST", art: "funktion" },
  { code: 10, kurz: "GrLtr VOST", name: "Gruppenleiter/in VOST", art: "funktion" },
  { code: 11, kurz: "TrLtr VOST", name: "Truppleiter/in VOST", art: "funktion" },
  { code: 12, kurz: "PSF", name: "Psychosoziale Fachkraft", art: "funktion" },
  { code: 13, kurz: "Peer", name: "THW-Peer", art: "funktion" },

  // --- Zusatzfunktionen (StAN-weit gesammelt) ---
  { code: 30, kurz: "Spr", name: "Sprechfunker/in", art: "zusatz" },
  { code: 31, kurz: "SanHe", name: "Sanitätshelfer/in", art: "zusatz" },
  { code: 32, kurz: "AGT", name: "Atemschutzgeräteträger/in", art: "zusatz" },
  { code: 33, kurz: "CBRN", name: "CBRN-Helfer/in", art: "zusatz" },
  { code: 34, kurz: "FK IuK", name: "Fachkraft IuK", art: "zusatz" },
  { code: 35, kurz: "FüGeh", name: "Führungsgehilfe/Führungsgehilfin", art: "zusatz" },
  { code: 36, kurz: "BoFü", name: "Bootsführer/in", art: "zusatz" },
  { code: 37, kurz: "BoFü man.", name: "Bootsführer/in manuelles Boot", art: "zusatz" },
  { code: 38, kurz: "Bed. Motorsäge", name: "Bediener/in Motorsäge", art: "zusatz" },
  { code: 39, kurz: "Bed. Ladekran", name: "Bediener/in Ladekran", art: "zusatz" },
  { code: 40, kurz: "Bed. Mobilkran", name: "Bediener/in Mobilkran", art: "zusatz" },
  { code: 41, kurz: "Bed. Bagger/Radlader", name: "Bediener/in Bagger/Radlader", art: "zusatz" },
  { code: 42, kurz: "Bed. Teleskoplader", name: "Bediener/in Teleskoplader", art: "zusatz" },
  { code: 43, kurz: "Bed. Schreitbagger", name: "Bediener/in Schreitbagger", art: "zusatz" },
  { code: 44, kurz: "Bed. Hubarbeitsbühne", name: "Bediener/in Hubarbeitsbühne", art: "zusatz" },
  { code: 45, kurz: "Bed. Arbeitsplattform", name: "Bediener/in Arbeitsplattform", art: "zusatz" },
  { code: 46, kurz: "Bed. TOG", name: "Bediener/in technisches Ortungsgerät", art: "zusatz" },
  { code: 47, kurz: "GabelSt", name: "Gabelstaplerfahrer/in", art: "zusatz" },
  { code: 48, kurz: "GelSt", name: "Geländestaplerfahrer/in", art: "zusatz" },
  { code: 49, kurz: "Masch. NEA", name: "Maschinist/in NEA", art: "zusatz" },
  { code: 50, kurz: "Masch. SEA", name: "Maschinist/in SEA", art: "zusatz" },
  { code: 51, kurz: "Masch. Pumpen", name: "Maschinist/in Pumpen", art: "zusatz" },
  { code: 52, kurz: "Masch. TWAA", name: "Maschinist/in TWAA", art: "zusatz" },
  { code: 53, kurz: "Masch. Richtfunk", name: "Maschinist/in Richtfunk", art: "zusatz" },
  { code: 54, kurz: "Masch. Separation", name: "Maschinist/in Separationsanlage", art: "zusatz" },
  { code: 55, kurz: "Masch. Skimmer", name: "Maschinist/in Skimmer", art: "zusatz" },
  { code: 56, kurz: "RettHuFü", name: "Rettungshundeführer/in", art: "zusatz" },
  { code: 57, kurz: "Spreng", name: "Sprengberechtigte/r", art: "zusatz" },
  { code: 58, kurz: "SprengGeh", name: "Sprenggehilfe/in", art: "zusatz" },
  { code: 59, kurz: "THW-Schw", name: "THW-Schweißer/in/Brennschneider/in", art: "zusatz" },
  { code: 60, kurz: "PE/PVC-Schw", name: "PE/PVC-Schweißer/in", art: "zusatz" },
  { code: 61, kurz: "BFB", name: "Baufachberater/in", art: "zusatz" },
  { code: 62, kurz: "TB Ortung", name: "Technische/r Berater/in Ortung", art: "zusatz" },
  { code: 63, kurz: "TB Ölschaden", name: "Technische/r Berater/in Ölschaden", art: "zusatz" },
  { code: 64, kurz: "TB VOST", name: "Technische/r Berater/in VOST", art: "zusatz" },
  { code: 65, kurz: "Abn. EGS", name: "Abnahmeberechtigte Person EGS", art: "zusatz" },
  { code: 66, kurz: "NwFü", name: "Nachweisführer/in", art: "zusatz" },
  { code: 67, kurz: "LogFü", name: "Logistikführer/in", art: "zusatz" },
  { code: 68, kurz: "Ltr THW-FüSt", name: "Leiter/in THW-FüSt", art: "zusatz" },
  { code: 69, kurz: "Ltr Stab THW-FüSt", name: "Leiter/in Stab THW-FüSt", art: "zusatz" },
  { code: 70, kurz: "Ltr FmBetrieb", name: "Leiter/in des Fernmeldebetriebs", art: "zusatz" },
  { code: 71, kurz: "FmFü", name: "Fernmeldeführer/in", art: "zusatz" },
  { code: 72, kurz: "Ltr ENT", name: "Leiter/in des Einsatznachsorgeteams", art: "zusatz" },
  { code: 73, kurz: "SGL S1", name: "Sachgebietsleiter/in S1", art: "zusatz" },
  { code: 74, kurz: "SGL S2", name: "Sachgebietsleiter/in S2", art: "zusatz" },
  { code: 75, kurz: "SGL S3", name: "Sachgebietsleiter/in S3", art: "zusatz" },
  { code: 76, kurz: "SGL S4", name: "Sachgebietsleiter/in S4", art: "zusatz" },
  { code: 77, kurz: "SGL S5", name: "Sachgebietsleiter/in S5", art: "zusatz" },
  { code: 78, kurz: "SGL S6", name: "Sachgebietsleiter/in S6", art: "zusatz" },
  { code: 79, kurz: "BergTaucher", name: "Bergungstaucher/in", art: "zusatz" },
  { code: 80, kurz: "TauchSanHe", name: "Tauchsanitätshelfer/in", art: "zusatz" },
  { code: 81, kurz: "TauchGerWart", name: "Tauchgerätewart/in", art: "zusatz" },
  { code: 82, kurz: "LuFzFernFü", name: "Luftfahrzeugfernführer/in", art: "zusatz" },
  { code: 83, kurz: "Ausw. Fernerkundung", name: "Auswerter/in Fernerkundung", art: "zusatz" },
  { code: 84, kurz: "TW-Laborant", name: "Trinkwasser-Laborant/in", art: "zusatz" },
  { code: 85, kurz: "Hygiene", name: "Hygienehelfer/in", art: "zusatz" },
  { code: 86, kurz: "Koch", name: "Koch/Köchin FGr Log-V", art: "zusatz" },
  { code: 87, kurz: "GerWart St V", name: "Gerätewart/in St V", art: "zusatz" },
  { code: 88, kurz: "Bef. P. Logistik", name: "Befähigte Person Logistik", art: "zusatz" },
  { code: 89, kurz: "Bef. P. Technik", name: "Befähigte Person Technik", art: "zusatz" },
  { code: 90, kurz: "Bef. P. Elektro", name: "Befähigte Person Elektro", art: "zusatz" },
  { code: 91, kurz: "Hägglunds", name: "Hägglundsfahrer/in", art: "zusatz" },
  { code: 92, kurz: "Fotograf", name: "Fotograf/in", art: "zusatz" },
  { code: 93, kurz: "Redakteur", name: "Redakteur/in", art: "zusatz" },
  { code: 94, kurz: "Presse MT", name: "Pressesprecher/in Media Team", art: "zusatz" },
  { code: 95, kurz: "SoMe", name: "Social-Media-Manager/in", art: "zusatz" },
  { code: 96, kurz: "Videograf", name: "Videograf/in", art: "zusatz" },
  // Kraftfahrer: Klasse steht in `fahrerlaubnis`; hier nur ADR-Zusätze
  { code: 100, kurz: "Kf ADR Stückgut", name: "Kraftfahrer/in CE ADR Stückgut", art: "zusatz" },
  { code: 101, kurz: "Kf ADR Tank", name: "Kraftfahrer/in CE ADR Tank", art: "zusatz" },
  { code: 102, kurz: "Kf ADR Kl. 1", name: "Kraftfahrer/in BE ADR Klasse 1", art: "zusatz" },
];

// -------------------------------------------------------------- Fahrzeugtypen
// Aus den Ausstattungs-Kapiteln der StAN-Einzeldokumente 2026 (Kurzzeichen wo
// vorhanden). OV-Fahrzeuge (MzKW, MTW OV, Anh OV, …) bewusst nicht enthalten
// — dafür den Freitext-Ausweg nutzen (s. Kopf).

export const THW_FAHRZEUGTYPEN: VokabularEintrag[] = [
  { code: 1, kurz: "FmKW", name: "Fernmeldekraftwagen" },
  { code: 2, kurz: "FüKW", name: "Führungskraftwagen" },
  { code: 3, kurz: "FüKomKW", name: "Führungs- und Kommunikationskraftwagen" },
  { code: 4, kurz: "GKW", name: "Gerätekraftwagen" },
  { code: 5, kurz: "MTW FGr", name: "Mannschaftstransportwagen Fachgruppe" },
  { code: 6, kurz: "MLW IV", name: "Mannschaftslastwagen IV" },
  { code: 7, kurz: "LKW Kipper", name: "Lastkraftwagen Kipper" },
  { code: 8, kurz: "LKW Lbw", name: "Lastkraftwagen mit Ladebordwand" },
  { code: 9, kurz: "LKW LK", name: "Lastkraftwagen mit Ladekran" },
  { code: 10, kurz: "LKW LK gl", name: "Lastkraftwagen geländegängig mit Ladekran" },
  { code: 11, kurz: "LKW WLF", name: "Lastkraftwagen Wechsellader" },
  { code: 12, kurz: "LKW WLF Tank", name: "LKW WLF Abrollsystem Tank" },
  { code: 13, kurz: "SZM", name: "Sattelzugmaschine" },
  { code: 14, kurz: "Auflieger", name: "Auflieger Sattelzug" },
  { code: 15, kurz: "PKW gl", name: "Personenkraftwagen geländegängig" },
  { code: 16, kurz: "Bagger", name: "Baumaschine Bagger" },
  { code: 17, kurz: "Radlader", name: "Baumaschine Radlader" },
  { code: 18, kurz: "Teleskoplader", name: "Baumaschine Teleskoplader" },
  { code: 19, kurz: "Schreitbagger", name: "Schreitbagger" },
  { code: 20, kurz: "Mobilkran", name: "Mobilkran" },
  { code: 21, kurz: "Gabelstapler", name: "Gabelstapler" },
  { code: 22, kurz: "MzAB", name: "Mehrzweckarbeitsboot" },
  { code: 23, kurz: "MTW TZ", name: "Mannschaftstransportwagen Technischer Zug" },
  { code: 24, kurz: "MTW gl", name: "Mannschaftstransportwagen geländegängig" },
  { code: 40, kurz: "Anh 2t", name: "Anhänger (2 t Nutzlast)" },
  { code: 41, kurz: "Anh K", name: "Anhänger mit Spezialaufbau für FGr K (1 t Nutzlast)" },
  { code: 42, kurz: "Anh FüLa", name: "Anhänger Führung und Lage" },
  { code: 43, kurz: "Anh Plane/Spriegel", name: "Anhänger Plane/Spriegel" },
  { code: 44, kurz: "Anh Plattform", name: "Anhänger Plattform" },
  { code: 45, kurz: "Anh Tieflader", name: "Anhänger Tieflader" },
  { code: 46, kurz: "Anh DLE", name: "Anhänger Drucklufterzeuger" },
  { code: 47, kurz: "Anh NEA mittel", name: "Anhänger mit Netzersatzanlage (mittel)" },
  { code: 48, kurz: "Anh NEA groß", name: "Anhänger mit Netzersatzanlage (groß)" },
  { code: 49, kurz: "Anh NEA sehr groß", name: "Anhänger mit Netzersatzanlage (sehr groß)" },
  { code: 50, kurz: "Anh SwPu klein", name: "Anhänger mit Schmutzwasserpumpe (klein)" },
  { code: 51, kurz: "Anh SwPu mittel", name: "Anhänger mit Schmutzwasserpumpe (mittel)" },
  { code: 52, kurz: "Anh SwPu groß", name: "Anhänger mit Schmutzwasserpumpe (groß)" },
  { code: 53, kurz: "Anh TWAA", name: "Anhänger TWAA" },
  { code: 54, kurz: "Anh BDF", name: "Anhänger BDF-Lafette" },
  { code: 55, kurz: "Anh ASH", name: "Anhänger mit Abstützsystem Holz" },
];

// ----------------------------------------------- Funkrufnamen-Kennwörter (BOS)
// Global (nicht THW-spezifisch), hier zentral abgelegt bis eigene Datei folgt.

export const FUNKRUF_KENNWOERTER: VokabularEintrag[] = [
  { code: 1, kurz: "Heros", name: "Heros (THW)" },
  { code: 2, kurz: "Florian", name: "Florian (Feuerwehr)" },
  { code: 3, kurz: "Rotkreuz", name: "Rotkreuz (DRK)" },
  { code: 4, kurz: "Akkon", name: "Akkon (JUH)" },
  { code: 5, kurz: "Johannes", name: "Johannes (MHD)" },
  { code: 6, kurz: "Sama", name: "Sama (ASB)" },
  { code: 7, kurz: "Pelikan", name: "Pelikan (DLRG)" },
];

// ------------------------------------------------------------ Email-Templates

export const THW_EMAIL_TEMPLATES: VokabularEintrag[] = [
  { code: 1, kurz: "person", name: "vorname.nachname@thw-<ov-slug>.de" },
  { code: 2, kurz: "ov", name: "ov-<ov-slug>@thw.de" },
];
