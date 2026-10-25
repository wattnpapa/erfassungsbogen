/**
 * Texte der festen Warnleiste „Nicht gespeichert" im Assistenten (Audit Runde 5,
 * R5-O1). Kurz: was ist, und der eine Schritt, der jetzt zählt — in zwei Zeilen
 * auf einem Telefon. Details: der Rest, hinter „Was tun?".
 *
 * Gesperrt ist nicht voll: Dort hilft kein Papierkorb, sondern Speichern
 * erlauben bzw. den privaten Modus verlassen (R3-O4). Eine fremde Erfassung am
 * Meldekopf ist kein Bogen zum Übergeben: Dort gehört die Stärke auf den
 * Meldeblock, und der Speicher muss frei werden (R4-E7).
 */

export type SpeicherFehlerArt = "voll" | "gesperrt";

function ursache(art: SpeicherFehlerArt): string {
  return art === "gesperrt" ? "dieser Browser lässt die App nichts speichern" : "der Speicher dieses Geräts ist voll";
}

export function speicherFehlerKurz(art: SpeicherFehlerArt, fremd: boolean): string {
  return `⚠ Nicht gespeichert — ${ursache(art)}. ${
    fremd ? "Die Stärke jetzt auf dem Meldeblock notieren." : "Jetzt „Bogen übergeben“ (PDF)."
  }`;
}

export function speicherFehlerDetails(art: SpeicherFehlerArt, fremd: boolean, letzterStand: string | null): string {
  const gesperrt = art === "gesperrt";
  const stand = letzterStand ? ` Letzter gesicherter Stand: ${letzterStand} Uhr.` : "";
  const ausgang = fremd
    ? gesperrt
      ? "Die Erfassung bleibt geöffnet. Speichern für diese Seite erlauben oder ein normales Fenster nutzen (etwa im privaten Modus oder durch eine Datenschutz-Einstellung gesperrt)."
      : "Die Erfassung bleibt geöffnet. Zuerst sichern, dann Platz schaffen: in der Fußzeile der Startseite Papierkorb leeren oder alte Einsätze endgültig löschen (die Sicherung selbst schafft keinen Platz)."
    : gesperrt
      ? "Der Bogen bleibt geöffnet. Für die nächste Erfassung Speichern für diese Seite erlauben oder ein normales Fenster nutzen (etwa im privaten Modus oder durch eine Datenschutz-Einstellung gesperrt)."
      : "Der Bogen bleibt geöffnet. Zuerst sichern, dann Platz schaffen: in der Fußzeile der Startseite Papierkorb leeren oder alte Einsätze endgültig löschen (die Sicherung selbst schafft keinen Platz).";
  return `${ausgang}${stand}`;
}
