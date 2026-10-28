/**
 * Text der Rückfrage „Geräteschlüssel neu erzeugen?" (Fußzeile). Ohne vorhandenen Schlüssel wird nichts gelöscht;
 * dann gehören weder die Warnung vor dem „alten" Schlüssel noch der rote Gefahrenknopf in den Dialog (R12-D3).
 */

export interface SchluesselFrage {
  titel: string;
  /** Erster Absatz. */
  erster: string;
  /** Zweiter Absatz (Kurzform abgleichen, alter öffentlicher Schlüssel); `null`, wenn es keinen alten Schlüssel gibt. */
  folgen: { fett: string; rest: string } | null;
  /** Beschriftung des bestätigenden Knopfes. */
  neuLabel: string;
  /** Roter Gefahrenknopf nur, wenn etwas gelöscht wird. */
  gefahr: boolean;
}

export function schluesselFrage(hatSchluessel: boolean): SchluesselFrage {
  if (!hatSchluessel) {
    return {
      titel: "Geräteschlüssel erzeugen?",
      erster: "Auf diesem Gerät liegt noch kein Signaturschlüssel; es wird ein neues Schlüsselpaar erzeugt, gelöscht wird nichts.",
      folgen: null,
      neuLabel: "Schlüssel jetzt erzeugen",
      gefahr: false,
    };
  }
  return {
    titel: "Geräteschlüssel neu erzeugen?",
    // R18-D4: Die Folge steht zuerst und kurz; die feste Knopfleiste deckte bei 360 × 640 den zweiten Absatz.
    erster:
      "Der bisherige Signaturschlüssel dieses Geräts wird gelöscht und durch ein neues Paar ersetzt " +
      "(sinnvoll bei Verdacht, dass er in fremde Hände geraten ist).",
    folgen: {
      fett: "Empfänger müssen die Kurzform danach neu abgleichen:",
      rest:
        " Neue Bögen tragen eine andere Kurzform. Bereits verschickte bleiben gültig, aber nur gegen den alten öffentlichen Schlüssel — " +
        "den gibt es danach nur noch in einer früheren Sicherung.",
    },
    neuLabel: "Neu erzeugen",
    gefahr: true,
  };
}
