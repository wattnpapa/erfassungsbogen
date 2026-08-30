/**
 * DLRG-Ausbildungskennzahlen als Vorschlagsliste für die Zusatzqualifikationen
 * einer Person (56 Einträge aus sechs Fachbereichen).
 *
 * Quelle: Legende der DLRG-Ausbildungskennzahlen (vom Nutzer bereitgestellt,
 * 2026-08-30). Handredaktion — es gibt keinen maschinenlesbaren Datensatz.
 *
 * Bewusst nur Text, KEINE Codes: eine Qualifikation wandert als Freitext in den
 * Bogen — genauso wie die Berufsbezeichnungen (src/vokabulare/berufe.ts). Die
 * Liste ist reine Tipphilfe (eigene Eingaben bleiben immer möglich), und so
 * bleibt das QR-Format unberührt: kein Schema-Sprung, alte Bögen lesbar, und
 * ältere App-Stände zeigen den Klartext statt einer nackten Codenummer.
 *
 * Redaktionsentscheidungen:
 *  - `text` beginnt mit der Ausbildungskennzahl, weil DLRG-Listen darüber
 *    geführt werden ("411, 715, 831"); die Bezeichnung dahinter macht den
 *    Eintrag auch für einen fremden Meldekopf lesbar, der die Zahlen nicht
 *    kennt. Beim Tippen greift beides — gesucht wird in Text UND Fachbereich.
 *  - `zusatz` ist der Fachbereich aus der Legende; er steht nur in der
 *    Vorschlagsliste, nicht im Bogen. So findet „Tauchen" alle Tauchscheine.
 *  - Reihenfolge nach Kennzahlbereich (4xx WRD, 5xx Boot, 6xx Tauchen, 7xx IuK,
 *    8xx KatS, 10xx Strömungsrettung) statt nach der zweispaltigen Optik der
 *    Legende — in einer Klappliste sucht man nach der Zahl.
 *  - Schreibweisen der Legende beibehalten, nur die Auszeichnung der Funkscheine
 *    vereinheitlicht („BOS-Sprechfunker -digital-" → „BOS-Sprechfunker digital").
 *  - Das Schnorcheltauchabzeichen trägt keine Kennzahl, sondern das Kürzel DSTA;
 *    es steht deshalb ohne Zahl in der Liste.
 */

export interface QualifikationsVorschlag {
  /** Landet als Freitext im Bogen: „<Kennzahl> <Bezeichnung>". */
  text: string;
  /** Fachbereich — nur Anzeige und Suche in der Vorschlagsliste. */
  zusatz: string;
}

const WRD = "Wasserrettungsdienst";
const BOOT = "Boot";
const TAUCHEN = "Tauchen";
const IUK = "IuK";
const KATS = "KatS / ÖGA";
const SR = "Strömungsrettung";

export const DLRG_QUALIFIKATIONEN: readonly QualifikationsVorschlag[] = [
  // Wasserrettungsdienst (4xx)
  { text: "401 Basisausbildung Einsatzdienste", zusatz: WRD },
  { text: "402 Aufbaumodul „Umgang mit Rettungsgeräten und Überwachung von Wasserflächen“", zusatz: WRD },
  { text: "403 Aufbaumodul „Schwimmen in fließenden Gewässern“", zusatz: WRD },
  { text: "404 Aufbaumodul „Einsatz in Küstengewässern“", zusatz: WRD },
  { text: "411 Wasserretter (Fachausbildung Wasserrettungsdienst)", zusatz: WRD },
  { text: "421 Führungslehre-Ausbildung", zusatz: WRD },
  { text: "431 Wachführer", zusatz: WRD },
  { text: "481 Ausbilder Wasserrettungsdienst", zusatz: WRD },
  { text: "491 Multiplikator Wasserrettungsdienst", zusatz: WRD },

  // Boot (5xx)
  { text: "511 DLRG-Bootsführerschein A", zusatz: BOOT },
  { text: "512 DLRG-Bootsführerschein B", zusatz: BOOT },
  { text: "581 Ausbilder für den DLRG Bootsführerschein A", zusatz: BOOT },
  { text: "582 Ausbilder für den DLRG Bootsführerschein B", zusatz: BOOT },
  { text: "591 Multiplikator DLRG-Bootsführerschein A", zusatz: BOOT },
  { text: "592 Multiplikator DLRG-Bootsführerschein B", zusatz: BOOT },

  // Tauchen (6xx; DSTA ohne Kennzahl)
  { text: "DSTA Deutsches Schnorcheltauchabzeichen", zusatz: TAUCHEN },
  { text: "612 Einsatztaucher Stufe 1", zusatz: TAUCHEN },
  { text: "613 Einsatztaucher Stufe 2", zusatz: TAUCHEN },
  { text: "631 Taucheinsatzführer", zusatz: TAUCHEN },
  { text: "641 Signalmann", zusatz: TAUCHEN },
  { text: "682 DLRG Lehrtaucher", zusatz: TAUCHEN },
  { text: "691 DLRG-Multiplikator Einsatztauchen", zusatz: TAUCHEN },

  // Information und Kommunikation (7xx)
  { text: "710 Sprechfunkunterweisung DLRG-Betriebsfunk", zusatz: IUK },
  { text: "711 DLRG Sprechfunker", zusatz: IUK },
  { text: "712 BOS-Sprechfunker analog", zusatz: IUK },
  { text: "715 BOS-Sprechfunker digital", zusatz: IUK },
  { text: "721 UKW-Sprechfunkzeugnis für den Binnenschifffahrtsfunk (UBI)", zusatz: IUK },
  { text: "722 Dienst-Funkbetriebszeugnis (DFbz)", zusatz: IUK },
  { text: "781 Ausbilder Sprechfunk", zusatz: IUK },
  { text: "782 Ausbilder BOS digital", zusatz: IUK },
  { text: "791 Multiplikator Sprechfunk", zusatz: IUK },
  { text: "792 Multiplikator Digitalfunk", zusatz: IUK },

  // Katastrophenschutz / Öffentlich-rechtliche Gefahrenabwehr (8xx)
  { text: "811 Helfergrundausbildung", zusatz: KATS },
  { text: "812 Landesspezifische Ausbildung", zusatz: KATS },
  { text: "830 Truppführerausbildung", zusatz: KATS },
  { text: "831 Gruppenführerausbildung (Führungsstufe A)", zusatz: KATS },
  { text: "832 Zugführer- und Einsatzführerausbildung (Führungsstufe B)", zusatz: KATS },
  { text: "833 Verbandsführerausbildung (Führungsstufe C)", zusatz: KATS },
  { text: "881 Ausbilder Katastrophenschutz", zusatz: KATS },
  { text: "891 Multiplikator Katastrophenschutz", zusatz: KATS },

  // Strömungsrettung (10xx)
  { text: "1011 Strömungsretter 1 (SR1)", zusatz: SR },
  { text: "1012 Sachkundiger PSA gegen Absturz", zusatz: SR },
  { text: "1021 Modul Seiltechnik", zusatz: SR },
  { text: "1022 Modul Wildwasser", zusatz: SR },
  { text: "1023 Modul Rafting", zusatz: SR },
  { text: "1024 Modul Canyoning", zusatz: SR },
  { text: "1025 Modul Absturzsicherung", zusatz: SR },
  { text: "1028 Strömungsretter 2 (SR2)", zusatz: SR },
  { text: "1030 Truppführer Strömungsrettung (TrpFhr SR)", zusatz: SR },
  { text: "1031 Gruppenführer Strömungsrettung (GrpFhr SR)", zusatz: SR },
  { text: "1041 Modul Evakuierung", zusatz: SR },
  { text: "1051 Strömungsrettungs-Techniker (SRT)", zusatz: SR },
  { text: "1081 Ausbilder Strömungsrettung", zusatz: SR },
  { text: "1082 Ausbilder Sachkunde PSA gegen Absturz", zusatz: SR },
  { text: "1083 Ausbilder SRT", zusatz: SR },
  { text: "1091 Multiplikator Strömungsrettung", zusatz: SR },
];
